// Kiểm mã thoát của chính CLI bằng tiến trình con. Chỉ sao chép source/fixture sang
// thư mục tạm; không sửa golden set hay truyền secret vào tiến trình con.
import { spawnSync } from 'node:child_process'
import { cpSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import storedFixtures from './eval-v2-memory-fixtures.json'

const root = resolve(import.meta.dirname, '..')
const require = createRequire(join(root, 'package.json'))

function runCli(contents: string) {
  const dir = mkdtempSync(join(tmpdir(), 'dhcb-memory-eval-'))
  try {
    mkdirSync(join(dir, 'lib'))
    // tsx bỏ path alias cho source bên trong node_modules, nên bản CLI tạm nằm ngoài nó.
    symlinkSync(join(root, 'node_modules'), join(dir, 'node_modules'), 'junction')
    cpSync(join(root, 'scripts/eval-v2-memory.ts'), join(dir, 'eval-v2-memory.ts'))
    cpSync(join(root, 'scripts/lib/memoryEval.ts'), join(dir, 'lib/memoryEval.ts'))
    writeFileSync(join(dir, 'package.json'), JSON.stringify({ type: 'module' }))
    writeFileSync(join(dir, 'eval-v2-memory-fixtures.json'), contents)
    const env: NodeJS.ProcessEnv = { TSX_TSCONFIG_PATH: resolve(root, 'tsconfig.api.json') }
    for (const key of ['PATH', 'SystemRoot', 'TEMP', 'TMP', 'TMPDIR']) {
      if (process.env[key]) env[key] = process.env[key]
    }
    return spawnSync(
      process.execPath,
      ['--import', require.resolve('tsx'), join(dir, 'eval-v2-memory.ts')],
      {
        cwd: root,
        env,
        encoding: 'utf8',
        timeout: 15_000,
      },
    )
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

describe('mã thoát eval:v2:memory', () => {
  it('đối chứng: golden set thật chạy qua service thật → 0', () => {
    const result = runCli(JSON.stringify(storedFixtures))
    expect(result.error).toBeUndefined()
    expect(result.status, result.stderr).toBe(0)
    expect(result.stdout).toContain('100.00% (30/30)')
    expect(result.stdout).toContain('✅ Passed thresholds')
  })

  it('negative control: sai 1/30 dù hai ngưỡng cũ còn đạt → 1', () => {
    const changed = storedFixtures.map((fixture) =>
      fixture.id === 'conf-accept-1' ? { ...fixture, expectedOutcome: 'REJECT' } : fixture,
    )
    const result = runCli(JSON.stringify(changed))
    expect(result.error).toBeUndefined()
    expect(result.status).toBe(1)
    expect(result.stdout, result.stderr).toContain('96.67% (29/30)')
    expect(result.stdout).toContain('False Memory Rate: 4.76%')
    expect(result.stdout).toContain('Correction Rate: 100.00%')
    expect(result.stdout).toContain('❌ Failed thresholds')
    expect(result.stdout).not.toContain('✅ Passed thresholds')
  })

  it.each(['[]', '{'])('fixture rỗng/JSON hỏng → 1: %s', (contents) => {
    const result = runCli(contents)
    expect(result.error).toBeUndefined()
    expect(result.status).toBe(1)
    expect(result.stderr.length).toBeGreaterThan(0)
    expect(result.stdout).not.toContain('✅ Passed thresholds')
  })
})
