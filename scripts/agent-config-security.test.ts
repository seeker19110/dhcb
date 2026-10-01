// scripts/agent-config-security.test.ts — Chốt chặn AN NINH cho chính bộ cấu hình tác tử AI của
// DHCB (`.claude/`, `.agents/`, `CLAUDE.md`, prompt gửi AI…).
//
// VÌ SAO CẦN: cấu hình tác tử là MÃ CHẠY ĐƯỢC chứ không phải tài liệu — hook trong
// `.claude/settings.json` chạy shell trên máy người dùng, file `.md` của agent/lệnh/skill đi thẳng
// vào ngữ cảnh mô hình. Năm 2026 đã có bằng chứng thật: Check Point công bố CVE-2025-59536 (hook
// trong repo chạy trước hộp thoại tin cậy) và CVE-2026-21852 (repo đổi `ANTHROPIC_BASE_URL` để lấy
// API key); Snyk "ToxicSkills" quét 3.984 skill công khai, 36% có prompt injection. Ý tưởng các
// nhóm kiểm dưới đây chuyển thể từ "Security Guide" + AgentShield của ECC (affaan-m/ECC v2.2.2,
// MIT) — viết lại thành test vitest chạy offline, không thêm gói phụ thuộc nào (xem ADR-0013).
//
// CÁCH SỬA khi test này đỏ: đọc thông báo — mỗi mục chỉ đúng file + lý do. ĐỪNG nới test cho
// vừa (file này nằm trong danh sách của `.claude/hooks/config-protection.sh`).
import { execFileSync, spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { z } from 'zod'

const ROOT = process.cwd()

function gitLsFiles(...paths: string[]): string[] {
  return execFileSync('git', ['ls-files', '-z', '--', ...paths], { cwd: ROOT, encoding: 'utf8' })
    .split('\u0000')
    .filter((f) => f !== '')
}

/** Bề mặt mà mô hình ĐỌC như chỉ thị: cấu hình tác tử + prompt gửi AI của sản phẩm. */
const HARNESS_FILES = gitLsFiles(
  '.claude',
  '.agents',
  '.opencodereview',
  'CLAUDE.md',
  'AGENTS.md',
  'TRAPS.md',
  'apps/dhcb/src/prompts',
  'packages/subject-programming/feedbackPrompt.ts',
)

// Ký tự VÔ HÌNH với người đọc nhưng mô hình vẫn đọc: zero-width, word joiner, BOM, điều khiển
// hướng chữ bidi (kiểu "Trojan Source", CVE-2021-42574). Khai bằng MÃ ĐIỂM số, KHÔNG viết escape
// kiểu backslash-u trong regex: công cụ ghi file của tác tử từng giải mã escape đó thành ký tự
// thật ngay trong file này (lint `no-irregular-whitespace` bắt được, changelog 0468).
const INVISIBLE_RANGES: ReadonlyArray<readonly [number, number]> = [
  [0x200b, 0x200d], // zero-width space / non-joiner / joiner
  [0x2060, 0x2060], // word joiner
  [0xfeff, 0xfeff], // BOM / zero-width no-break space
  [0x202a, 0x202e], // bidi embedding/override
  [0x2066, 0x2069], // bidi isolate
]
function coKyTuVoHinh(line: string): boolean {
  for (const ch of line) {
    const cp = ch.codePointAt(0) ?? 0
    if (INVISIBLE_RANGES.some(([lo, hi]) => cp >= lo && cp <= hi)) return true
  }
  return false
}

describe('cấu hình tác tử: không giấu chỉ thị bằng ký tự vô hình', () => {
  it('có file để kiểm (tự bảo vệ khỏi test rỗng luôn xanh)', () => {
    expect(HARNESS_FILES.length).toBeGreaterThan(30)
  })

  it('bộ dò bắt được ký tự vô hình thật (tự bảo vệ khỏi bộ dò hỏng luôn xanh)', () => {
    for (const cp of [0x200b, 0x2060, 0xfeff, 0x202e, 0x2068]) {
      expect(coKyTuVoHinh(`ab${String.fromCodePoint(cp)}cd`)).toBe(true)
    }
    expect(coKyTuVoHinh('Tiếng Việt có dấu — bình thường')).toBe(false)
  })

  it('không file nào chứa zero-width / bidi / BOM', () => {
    const viPham: string[] = []
    for (const f of HARNESS_FILES) {
      const lines = readFileSync(resolve(ROOT, f), 'utf8').split('\n')
      const i = lines.findIndex(coKyTuVoHinh)
      if (i >= 0) viPham.push(`${f}:${i + 1}`)
    }
    expect(viPham).toEqual([])
  })
})

const hookSchema = z.object({ type: z.string(), command: z.string().optional() })
const settingsSchema = z
  .object({
    enableAllProjectMcpServers: z.boolean().optional(),
    apiKeyHelper: z.string().optional(),
    env: z.record(z.string(), z.string()).optional(),
    permissions: z
      .object({
        allow: z.array(z.string()).default([]),
        ask: z.array(z.string()).default([]),
        deny: z.array(z.string()).default([]),
      })
      .default({ allow: [], ask: [], deny: [] }),
    hooks: z
      .record(
        z.string(),
        z.array(z.object({ matcher: z.string().optional(), hooks: z.array(hookSchema) })),
      )
      .default({}),
  })
  .passthrough()

const settings = settingsSchema.parse(
  JSON.parse(readFileSync(resolve(ROOT, '.claude/settings.json'), 'utf8')),
)

describe('.claude/settings.json', () => {
  it('không tự bật mọi MCP server của repo và không đổi kênh xác thực API', () => {
    expect(settings.enableAllProjectMcpServers).not.toBe(true)
    expect(settings.apiKeyHelper).toBeUndefined()
    // Repo đặt các biến này = mọi người clone repo gửi request (kèm key) tới máy chủ lạ.
    const forbidden = ['ANTHROPIC_BASE_URL', 'ANTHROPIC_API_KEY', 'ANTHROPIC_AUTH_TOKEN']
    expect(Object.keys(settings.env ?? {}).filter((k) => forbidden.includes(k))).toEqual([])
  })

  it('không cấp quyền Bash trùm toàn bộ hay lệnh mạng/xoá/leo quyền', () => {
    const broad = /^Bash(\((\*|:\*)?\))?$/
    const risky = /^Bash\((curl|wget|nc|ssh|scp|rm|sudo|chmod)\b/
    expect(settings.permissions.allow.filter((r) => broad.test(r) || risky.test(r))).toEqual([])
  })

  it('đọc file bí mật (.env…) luôn phải hỏi người dùng trước', () => {
    expect(settings.permissions.ask).toEqual(expect.arrayContaining(['Read(.env)', 'Read(.env.*)']))
  })

  it('mọi hook là MỘT script bash nằm trong .claude/ và được git theo dõi', () => {
    const tracked = new Set(gitLsFiles('.claude'))
    const viPham: string[] = []
    for (const [event, groups] of Object.entries(settings.hooks)) {
      for (const g of groups) {
        for (const h of g.hooks) {
          // Hook kiểu http/prompt/agent gửi dữ liệu ra ngoài hoặc chạy mô hình — không dùng ở DHCB.
          const m =
            h.type === 'command'
              ? /^bash (\.claude\/(?:hooks\/)?[a-z0-9-]+\.sh)$/.exec(h.command ?? '')
              : null
          if (!m?.[1] || !tracked.has(m[1])) viPham.push(`${event}: ${h.type} ${h.command ?? ''}`)
        }
      }
    }
    expect(viPham).toEqual([])
  })
})

describe('script hook', () => {
  const scripts = gitLsFiles('.claude').filter((f) => f.endsWith('.sh'))

  it('có script để kiểm', () => {
    expect(scripts.length).toBeGreaterThanOrEqual(5)
  })

  it('không gọi mạng và không đụng biến điều hướng API', () => {
    const net = /\b(curl|wget|nc|ncat|ssh|scp|rsync)\s|ANTHROPIC_BASE_URL/
    const viPham: string[] = []
    for (const f of scripts) {
      readFileSync(resolve(ROOT, f), 'utf8')
        .split('\n')
        .forEach((line, i) => {
          if (!line.trimStart().startsWith('#') && net.test(line)) viPham.push(`${f}:${i + 1}`)
        })
    }
    expect(viPham).toEqual([])
  })
})

describe('subagent chỉ-đọc không có công cụ ghi (least agency)', () => {
  // Agent mà mô tả cam kết "KHÔNG sửa code". Thêm agent rà/tra cứu mới thì thêm tên vào đây.
  const READ_ONLY = [
    'lookup',
    'version-check',
    'security-reviewer',
    'silent-failure-hunter',
    'database-reviewer',
  ]
  const WRITE_TOOLS = /\b(Edit|Write|MultiEdit|NotebookEdit)\b/

  it.each(READ_ONLY)('%s khai `tools:` tường minh và không có Edit/Write', (name) => {
    const text = readFileSync(resolve(ROOT, `.claude/agents/${name}.md`), 'utf8')
    const frontmatter = text.split(/^---$/m)[1] ?? ''
    const tools = /^tools:\s*(.+)$/m.exec(frontmatter)?.[1]
    expect(tools, `${name} thiếu tools: → nhận MỌI công cụ, kể cả ghi file`).toBeDefined()
    expect(tools).not.toMatch(WRITE_TOOLS)
  })
})

// Hook cần bash + jq. Máy dev thiếu jq thì bỏ qua; trên CI (ubuntu có sẵn jq) LUÔN chạy để
// không thành "xanh giả" (TRAPS.md mục 3).
const hasJq = spawnSync('jq', ['--version']).status === 0
describe.runIf(hasJq || process.env.CI)('config-protection.sh', () => {
  // Sổ ghi nhận "đã nhắc trong phiên" để ở thư mục tạm, không đụng .claude/ của repo.
  const ackDir = mkdtempSync(join(tmpdir(), 'gate-ack-'))
  afterAll(() => rmSync(ackDir, { recursive: true, force: true }))
  let phien = 0
  const phienMoi = (): string => `test-${process.pid}-${++phien}`

  const run = (
    filePath: string,
    env: Record<string, string> = {},
    sessionId: string = phienMoi(),
  ): string =>
    execFileSync('bash', ['.claude/hooks/config-protection.sh'], {
      cwd: ROOT,
      input: JSON.stringify({
        session_id: sessionId,
        tool_name: 'Edit',
        tool_input: { file_path: filePath },
      }),
      env: {
        ...process.env,
        CLAUDE_PROJECT_DIR: ROOT,
        GATE_ACK_DIR: ackDir,
        ALLOW_GATE_EDIT: '',
        ...env,
      },
      encoding: 'utf8',
    })
  const decision = (out: string): string | undefined =>
    out.trim() === ''
      ? undefined
      : z
          .object({ hookSpecificOutput: z.object({ permissionDecision: z.string() }) })
          .parse(JSON.parse(out)).hookSpecificOutput.permissionDecision

  // Mỗi đại diện vừa là ca thử vừa là canh "lỗi thời": file bị đổi tên/xoá thì hook coi như tạo
  // mới và cho qua → test đỏ, nhắc cập nhật danh sách trong hook.
  it.each([
    'eslint.config.js',
    'vitest.config.ts',
    'tsconfig.base.json',
    '.prettierignore',
    'scripts/ci-workflow-policy.test.ts',
    'scripts/agent-config-security.test.ts',
    'e2e/a11y-aaa.spec.ts',
    'scripts/lib/contrast.ts',
    '.github/workflows/ci.yml',
    '.husky/pre-commit',
    '.claude/settings.json',
    '.claude/hooks/block-dangerous-git.sh',
  ])('chạm cổng %s lần đầu trong phiên → bị từ chối kèm lý do', (rel) => {
    expect(decision(run(resolve(ROOT, rel)))).toBe('deny')
  })

  it('lần sau cùng phiên → hỏi người dùng; phiên khác → từ chối lại từ đầu', () => {
    const file = resolve(ROOT, 'vitest.config.ts')
    const sid = phienMoi()
    expect(decision(run(file, {}, sid))).toBe('deny')
    expect(decision(run(file, {}, sid))).toBe('ask')
    expect(decision(run(resolve(ROOT, 'eslint.config.js'), {}, sid))).toBe('deny')
    expect(decision(run(file))).toBe('deny')
  })

  it('không có session_id → vẫn hỏi người dùng', () => {
    expect(decision(run(resolve(ROOT, 'vitest.config.ts'), {}, ''))).toBe('ask')
  })

  it('không lách được bằng `..` hay đường dẫn tương đối', () => {
    expect(decision(run(`${ROOT}/scripts/../eslint.config.js`))).toBe('deny')
    expect(decision(run('apps/../vitest.config.ts'))).toBe('deny')
  })

  it('file thường, file mới, file ngoài repo → cho qua', () => {
    expect(decision(run(resolve(ROOT, 'apps/dhcb/src/lib/storage.ts')))).toBeUndefined()
    expect(decision(run(resolve(ROOT, 'scripts/khong-ton-tai-policy.test.ts')))).toBeUndefined()
    expect(decision(run('/etc/eslint.config.js'))).toBeUndefined()
  })

  it('ALLOW_GATE_EDIT=1 tắt hook có chủ đích', () => {
    expect(
      decision(run(resolve(ROOT, 'eslint.config.js'), { ALLOW_GATE_EDIT: '1' })),
    ).toBeUndefined()
  })
})
