// scripts/skills-mirror.test.ts — canh bộ skill dự án ở `.claude/skills/` (ADR-0013, changelog 0477).
//
// Vì sao cần: Claude Code TỰ NẠP mọi skill ở `.claude/skills/` (tên + mô tả vào mọi phiên, thân
// skill khi kích hoạt) và tin nội dung đó là thật. Bản cũ ở `.agents/skills/` có 9/11 skill nhắc
// tới file/tính năng KHÔNG tồn tại (multiAgentConsensusService, hybridRagEngine, studio "Tổng
// hợp"…) — chuyển nguyên sang là dạy tác tử thiết kế theo thứ không có. Test này chặn ba điều:
//   1. Skill thiếu frontmatter `name`/`description` hoặc `name` lệch tên thư mục (không nạp được).
//   2. Bản gương ở `.agents/skills/` (cho Antigravity/Codex) lệch bản ở `.claude/skills/` — lệch
//      là một trong hai đang nói sai, và công cụ khác sẽ đọc bản sai.
//   3. Skill nhắc một đường dẫn TRONG REPO (`apps/…`, `packages/…`, `scripts/…`, `docs/…`…) không
//      tồn tại — đúng loại lỗi đã làm hỏng bộ skill cũ.
import { describe, it, expect } from 'vitest'
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const ROOT = process.cwd()
const CLAUDE_SKILLS = join(ROOT, '.claude/skills')
const AGENTS_SKILLS = join(ROOT, '.agents/skills')

function filesUnder(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name)
    return statSync(full).isDirectory() ? filesUnder(full) : [full]
  })
}

const skillDirs = existsSync(CLAUDE_SKILLS)
  ? readdirSync(CLAUDE_SKILLS).filter((d) => statSync(join(CLAUDE_SKILLS, d)).isDirectory())
  : []

/** Gốc thư mục được coi là "đường dẫn trong repo" — tên lớp Tailwind kiểu `bg-zinc-900/80` không khớp. */
const REPO_ROOTS = [
  'apps/',
  'packages/',
  'scripts/',
  'docs/',
  'e2e/',
  'postgres/',
  '.github/',
  '.claude/',
]
/** Ký hiệu giữ chỗ trong đường dẫn mẫu (`docs/ui-ux/pages/<feature>.md`, `docs/specs/*.md`…). */
const PLACEHOLDER = /[<>*{}…]|\.\./

const TRACKED = execFileSync('git', ['ls-files'], { cwd: ROOT, encoding: 'utf8' })
  .split('\n')
  .filter(Boolean)

/** Đường dẫn tồn tại nếu là file/thư mục thật, hoặc là tiền tố của file đang được git theo dõi (vd `docs/changelog/0206`). */
export function duongDanTonTai(p: string, tracked: readonly string[] = TRACKED): boolean {
  if (existsSync(join(ROOT, p))) return true
  return tracked.some((f) => f.startsWith(p))
}

/** Các đường dẫn trong repo mà một văn bản Markdown nhắc tới trong cặp backtick. */
export function duongDanDuocNhac(markdown: string): string[] {
  const out = new Set<string>()
  for (const m of markdown.matchAll(/`([^`\s]+)`/g)) {
    const token = m[1]!.replace(/[.,;:)]+$/, '')
    if (!REPO_ROOTS.some((r) => token.startsWith(r))) continue
    if (PLACEHOLDER.test(token)) continue
    out.add(token)
  }
  return [...out]
}

describe('.claude/skills — bộ skill dự án', () => {
  it('có skill để kiểm (tự bảo vệ khỏi test rỗng luôn xanh)', () => {
    expect(skillDirs.length).toBeGreaterThan(0)
  })

  for (const skill of skillDirs) {
    describe(skill, () => {
      const dir = join(CLAUDE_SKILLS, skill)

      it('có SKILL.md với frontmatter name khớp tên thư mục và description không rỗng', () => {
        const md = readFileSync(join(dir, 'SKILL.md'), 'utf8')
        const fm = md.match(/^---\n([\s\S]*?)\n---\n/)
        expect(fm, 'thiếu khối frontmatter ---').toBeTruthy()
        expect(fm![1]).toMatch(new RegExp(`^name: ${skill}$`, 'm'))
        expect(fm![1]).toMatch(/^description: .{20,}$/m)
      })

      it('bản gương ở .agents/skills/ trùng từng byte (cùng tập file)', () => {
        const mirror = join(AGENTS_SKILLS, skill)
        expect(existsSync(mirror), `.agents/skills/${skill} không tồn tại`).toBe(true)
        const a = filesUnder(dir)
          .map((f) => relative(dir, f))
          .sort()
        const b = filesUnder(mirror)
          .map((f) => relative(mirror, f))
          .sort()
        expect(b).toEqual(a)
        for (const f of a) {
          expect(readFileSync(join(mirror, f)).equals(readFileSync(join(dir, f))), f).toBe(true)
        }
      })

      it('mọi đường dẫn trong repo mà skill nhắc tới đều tồn tại', () => {
        const thieu = filesUnder(dir)
          .filter((f) => f.endsWith('.md'))
          .flatMap((f) => duongDanDuocNhac(readFileSync(f, 'utf8')).map((p) => ({ f, p })))
          .filter(({ p }) => !duongDanTonTai(p))
          .map(({ f, p }) => `${relative(ROOT, f)}: ${p}`)
        expect(thieu).toEqual([])
      })
    })
  }
})

describe('bộ dò đường dẫn (tự kiểm chính nó)', () => {
  it('bắt đường dẫn bịa, bỏ qua lớp Tailwind và đường dẫn mẫu', () => {
    const md =
      'Xem `packages/core-ai/hybridRagEngine.ts`, `apps/dhcb/src/index.css`, ' +
      '`bg-zinc-900/80`, `docs/ui-ux/pages/<feature>.md`, `docs/specs/*.md`.'
    expect(duongDanDuocNhac(md).sort()).toEqual([
      'apps/dhcb/src/index.css',
      'packages/core-ai/hybridRagEngine.ts',
    ])
    expect(duongDanTonTai('packages/core-ai/hybridRagEngine.ts')).toBe(false)
    expect(duongDanTonTai('apps/dhcb/src/index.css')).toBe(true)
    expect(duongDanTonTai('docs/changelog/0206', ['docs/changelog/0206-x.md'])).toBe(true)
  })
})
