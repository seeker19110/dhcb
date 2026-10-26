// Ca an toàn của restore (audit 2026-10-26: AUD-DATA-002, AUD-SEC-003, AUD-SEC-004). KHÔNG chạm
// Postgres thật: `psql` trên PATH là script giả ghi lại tham số + đọc hết stdin rồi thoát theo mã
// trong FAKE_PSQL_EXIT. `gunzip`/`bash` là bản thật của máy.
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import { gzipSync } from 'node:zlib'
import {
  assertGzipIntact,
  assertSafeDatabaseName,
  runRestorePipeline,
  verifyRestoredDatabase,
} from './restore-pg-from-r2'
import { redactConnectionUrl, writePrivateFile } from './lib/restoreSafety'

let dir: string
let originalPath: string | undefined

beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'restore-test-'))
  const bin = path.join(dir, 'bin')
  fs.mkdirSync(bin)
  fs.writeFileSync(
    path.join(bin, 'psql'),
    '#!/usr/bin/env bash\n' +
      'printf "%s\\n" "$@" > "$FAKE_PSQL_ARGS"\n' +
      // Mô phỏng psql dừng sớm (ON_ERROR_STOP ở câu đầu) — thoát mà không đọc hết stdin.
      'if [ -n "${FAKE_PSQL_NO_READ:-}" ]; then exit "${FAKE_PSQL_EXIT:-0}"; fi\n' +
      'cat > "$FAKE_PSQL_STDIN"\n' +
      'printf "%s" "${FAKE_PSQL_STDOUT:-}"\n' +
      'exit "${FAKE_PSQL_EXIT:-0}"\n',
    { mode: 0o755 },
  )
  originalPath = process.env.PATH
  process.env.PATH = `${bin}${path.delimiter}${originalPath ?? ''}`
  process.env.FAKE_PSQL_ARGS = path.join(dir, 'args.txt')
  process.env.FAKE_PSQL_STDIN = path.join(dir, 'stdin.sql')
  delete process.env.FAKE_PSQL_EXIT
  delete process.env.FAKE_PSQL_STDOUT
})

afterEach(() => {
  process.env.PATH = originalPath
  for (const key of [
    'FAKE_PSQL_ARGS',
    'FAKE_PSQL_STDIN',
    'FAKE_PSQL_EXIT',
    'FAKE_PSQL_STDOUT',
    'PWN_MARKER',
    'FAKE_PSQL_NO_READ',
  ])
    delete process.env[key]
  fs.rmSync(dir, { recursive: true, force: true })
})

function writeDump(name: string, sql: string, truncate = false): string {
  const file = path.join(dir, name)
  const gz = gzipSync(Buffer.from(sql))
  fs.writeFileSync(file, truncate ? gz.subarray(0, gz.length - 5) : gz)
  return file
}

const TARGET = 'postgres://postgres:s3cret-pass@127.0.0.1:5432/dhcb_restore'

describe('assertGzipIntact — kiểm file TRƯỚC bước DROP', () => {
  it('file gzip nguyên vẹn → qua', () => {
    expect(() => assertGzipIntact(writeDump('ok.sql.gz', 'select 1;\n'))).not.toThrow()
  })
  it('file gzip bị cắt cụt → ném lỗi', () => {
    expect(() => assertGzipIntact(writeDump('cut.sql.gz', 'select 1;\n', true))).toThrow()
  })
})

describe('runRestorePipeline — không báo thành công giả', () => {
  it('gzip bị cắt cụt dù psql thoát 0 → ném lỗi (pipefail)', async () => {
    const dump = writeDump('cut.sql.gz', 'select 1;\n', true)
    await expect(runRestorePipeline(dump, TARGET)).rejects.toThrow()
  })
  it('psql báo lỗi SQL (exit 3) → ném lỗi', async () => {
    process.env.FAKE_PSQL_EXIT = '3'
    await expect(
      runRestorePipeline(writeDump('ok.sql.gz', 'select 1;\n'), TARGET),
    ).rejects.toThrow()
  })
  it('lỗi ném ra KHÔNG chứa mật khẩu của connection string', async () => {
    process.env.FAKE_PSQL_EXIT = '3'
    await expect(runRestorePipeline(writeDump('ok.sql.gz', 'select 1;\n'), TARGET)).rejects.toThrow(
      /^(?![\s\S]*s3cret-pass)[\s\S]*mã thoát 3/,
    )
    expect(() => verifyRestoredDatabase(TARGET)).toThrow(/^(?![\s\S]*s3cret-pass)/)
  })
  it('psql dừng sớm với dump lớn → ném lỗi, KHÔNG treo chờ gunzip', async () => {
    process.env.FAKE_PSQL_NO_READ = '1'
    process.env.FAKE_PSQL_EXIT = '3'
    // ~30 MB sau giải nén — lớn hơn nhiều bộ đệm ống, gunzip chắc chắn phải chờ người đọc.
    const big = writeDump('big.sql.gz', 'select 1;\n'.repeat(3_000_000))
    await expect(runRestorePipeline(big, TARGET)).rejects.toThrow(/mã thoát 3/)
  }, 15_000)
  it('gọi psql với ON_ERROR_STOP=1 và nạp đủ nội dung dump', async () => {
    await runRestorePipeline(writeDump('ok.sql.gz', 'select 42;\n'), TARGET)
    const args = fs.readFileSync(process.env.FAKE_PSQL_ARGS!, 'utf8').split('\n')
    expect(args).toContain('ON_ERROR_STOP=1')
    expect(args).toContain(TARGET)
    expect(fs.readFileSync(process.env.FAKE_PSQL_STDIN!, 'utf8')).toBe('select 42;\n')
  })
})

describe('assertSafeDatabaseName — tên database ghép vào DROP/CREATE', () => {
  it.each(['dhcb', 'dhcb_restore', '_tmp1'])('nhận "%s"', (name) => {
    expect(() => assertSafeDatabaseName(name)).not.toThrow()
  })
  it.each(['', 'DhCb', 'x; drop database dhcb', 'a-b', '1db', 'a'.repeat(64)])(
    'từ chối "%s"',
    (name) => {
      expect(() => assertSafeDatabaseName(name)).toThrow()
    },
  )
})

describe('runRestorePipeline — đường dẫn có ký tự shell không chạy được lệnh', () => {
  it('đường dẫn chứa $(...) và dấu nháy được coi là tên file thuần', async () => {
    // Tên file không chứa `/`; nếu shell diễn giải `$(...)` thì file đánh dấu sẽ được tạo ra.
    const marker = path.join(dir, 'pwned')
    process.env.PWN_MARKER = marker
    const evil = path.join(dir, 'x"$(touch "$PWN_MARKER")".sql.gz')
    fs.writeFileSync(evil, gzipSync(Buffer.from('select 1;\n')))
    await runRestorePipeline(evil, TARGET)
    expect(fs.existsSync(marker)).toBe(false)
    expect(fs.readFileSync(process.env.FAKE_PSQL_STDIN!, 'utf8')).toBe('select 1;\n')
  })
})

describe('verifyRestoredDatabase — kiểm dữ liệu trước khi báo xong', () => {
  it('đọc được số người dùng → trả về số đó', () => {
    process.env.FAKE_PSQL_STDOUT = '17\n'
    expect(verifyRestoredDatabase(TARGET)).toBe(17)
  })
  it('truy vấn lỗi (bảng không có) → ném lỗi', () => {
    process.env.FAKE_PSQL_EXIT = '1'
    expect(() => verifyRestoredDatabase(TARGET)).toThrow()
  })
  it('kết quả không phải số → ném lỗi', () => {
    process.env.FAKE_PSQL_STDOUT = 'oops'
    expect(() => verifyRestoredDatabase(TARGET)).toThrow()
  })
})

describe('redactConnectionUrl — không in mật khẩu ra log', () => {
  it('che mật khẩu, giữ phần còn lại', () => {
    const out = redactConnectionUrl(TARGET)
    expect(out).not.toContain('s3cret-pass')
    expect(out).toBe('postgres://postgres:***@127.0.0.1:5432/dhcb_restore')
  })
  it('URL không có mật khẩu → giữ nguyên', () => {
    expect(redactConnectionUrl('postgres://postgres@localhost/db')).toBe(
      'postgres://postgres@localhost/db',
    )
  })
  it('chuỗi không phải URL → không trả lại nguyên văn', () => {
    expect(redactConnectionUrl('host=db password=hunter2')).not.toContain('hunter2')
  })
})

/** Kiểm quyền + nội dung qua CÙNG một file descriptor (không stat-rồi-đọc theo đường dẫn). */
function expectPrivateFile(file: string, content: string): void {
  const fd = fs.openSync(file, 'r')
  try {
    expect(fs.fstatSync(fd).mode & 0o777).toBe(0o600)
    expect(fs.readFileSync(fd, 'utf8')).toBe(content)
  } finally {
    fs.closeSync(fd)
  }
}

describe('writePrivateFile — file giải mã chỉ chủ sở hữu đọc được', () => {
  it('file mới tạo dưới umask 022 vẫn là 0600', () => {
    const file = path.join(dir, '.env.restored')
    const old = process.umask(0o022)
    try {
      writePrivateFile(file, Buffer.from('SECRET=1\n'))
    } finally {
      process.umask(old)
    }
    expectPrivateFile(file, 'SECRET=1\n')
  })
  it('file đã tồn tại với 0644 → bị siết về 0600', () => {
    const file = path.join(dir, 'system-restored.tar.gz')
    fs.writeFileSync(file, 'old', { mode: 0o644 })
    writePrivateFile(file, Buffer.from('new'))
    expectPrivateFile(file, 'new')
  })
})
