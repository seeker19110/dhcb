// apps/dhcb/src/pages/core/DesignSystem.design.test.ts — Cổng canh đợt "căn hàng, phân cấp thẻ"
// (audit 2026-09-30 M17 + M22, changelog 0500).
//
// Đọc thẳng mã nguồn (như UiNoise.design.test.ts): thứ cần canh là LỚP TRÌNH BÀY — nút tự ghép
// màu lệch accent, `transition-all`, phần lặp trên trang dài — nên không cần render.
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, extname } from 'node:path'

const REPO = join(__dirname, '../../../../..')
const read = (rel: string) => readFileSync(join(REPO, rel), 'utf8')

function listSource(dir: string): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === 'dist') continue
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) out.push(...listSource(full))
    else if (
      ['.ts', '.tsx'].includes(extname(entry)) &&
      !/\.test\.tsx?$/.test(entry) &&
      !entry.endsWith('.d.ts')
    )
      out.push(full)
  }
  return out
}

// Các trang lưu lượng cao đã chuẩn hoá ở đợt 0500 (+ khung dùng chung hiện trên MỌI trang).
const PRIORITY_FILES = [
  'apps/dhcb/src/pages/core/Home.tsx',
  'apps/dhcb/src/components/Home/SubjectSpaceList.tsx',
  'apps/dhcb/src/pages/learning/Practice.tsx',
  'apps/dhcb/src/components/PvPArena/PvPArenaCard.tsx',
  'apps/dhcb/src/pages/domains/notes/Notes.tsx',
  'apps/dhcb/src/pages/subjects/english/EnglishHome.tsx',
  'apps/dhcb/src/pages/subjects/programming/ProgrammingHome.tsx',
  'apps/dhcb/src/pages/subjects/programming/ProgrammingSpecializationPage.tsx',
  'apps/dhcb/src/pages/subjects/programming/ProgrammingPathPage.tsx',
  'apps/dhcb/src/components/PathStageQuiz.tsx',
  'apps/dhcb/src/components/Layout.tsx',
  'apps/dhcb/src/components/BottomNav.tsx',
  // Đợt 0501 — luồng học chính.
  'apps/dhcb/src/pages/learning/Subjects.tsx',
  'apps/dhcb/src/components/CefrLessonViews.tsx',
  'apps/dhcb/src/components/studyTabs/TodayLesson.tsx',
  'apps/dhcb/src/components/studyTabs/SRSReview.tsx',
  'apps/dhcb/src/components/RoadmapTab.tsx',
  'apps/dhcb/src/pages/subjects/programming/ProgrammingLevelPage.tsx',
  'apps/dhcb/src/pages/subjects/programming/ProgrammingCoursePage.tsx',
  'apps/dhcb/src/pages/subjects/programming/ProgrammingPathStagePage.tsx',
  'apps/dhcb/src/components/programming/LessonStartButton.tsx',
]

// Khu Bạn Đồng Hành (`/ban-dong-hanh`) — thư mục gom trọn hoặc file lẻ.
const COMPANION_AREA = [
  'apps/dhcb/src/pages/companion',
  'apps/dhcb/src/components/CompanionStudios',
  'apps/dhcb/src/components/CompanionVoice',
  'apps/dhcb/src/components/Companion3D',
  'apps/dhcb/src/components/MemoryPalace',
  'apps/dhcb/src/components/MetacognitiveReflection',
  'apps/dhcb/src/components/ProactiveAgent',
  'apps/dhcb/src/components/StemScratchpad',
  'apps/dhcb/src/components/DebateArena',
  'apps/dhcb/src/components/PvPArena',
  'apps/dhcb/src/components/LifeSynthesis',
  'apps/dhcb/src/components/ProactiveBriefingCard.tsx',
]

describe('transition-all — chỉ được GIẢM (audit M17)', () => {
  // Mốc đo sau đợt 0500. Gỡ thêm chỗ nào thì HẠ số này xuống; đừng bao giờ nâng lên — code mới
  // khai đúng thuộc tính (`transition-colors`/`transition`/`transition-transform`), skill ui-ux
  // mục 10.A.1.
  const BASELINE = 51 // đợt 0513 khu Bạn Đồng Hành (0501: 130, 0500: 151)

  it(`toàn kho ≤ ${BASELINE} chỗ`, () => {
    const files = ['apps/dhcb/src', 'apps/hub/src', 'packages'].flatMap((d) =>
      listSource(join(REPO, d)),
    )
    expect(files.length).toBeGreaterThan(300) // canh hàm quét hỏng rồi lặng lẽ quét rỗng
    const count = files.reduce(
      (n, f) => n + (readFileSync(f, 'utf8').match(/\btransition-all\b/g)?.length ?? 0),
      0,
    )
    expect(count).toBeLessThanOrEqual(BASELINE)
  })

  it.each(PRIORITY_FILES)('%s không còn transition-all trong class', (rel) => {
    // Bỏ comment trước khi dò: comment được phép NHẮC tên lớp để giải thích vì sao đã gỡ.
    const code = read(rel)
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*$/gm, '')
    expect(code).not.toMatch(/\btransition-all\b/)
  })

  // Đợt 0513 — gỡ trọn khu Bạn Đồng Hành (studio + thẻ/modal của các tính năng đồng hành).
  it.each(COMPANION_AREA)('%s không còn transition-all', (rel) => {
    const files = rel.endsWith('.tsx') ? [join(REPO, rel)] : listSource(join(REPO, rel))
    expect(files.length).toBeGreaterThan(0)
    const offenders = files.filter((f) => /\btransition-all\b/.test(readFileSync(f, 'utf8')))
    expect(offenders).toEqual([])
  })
})

describe('Viền lấy nét hiện tức thì (index.css)', () => {
  const css = read('apps/dhcb/src/index.css')
  const rule = css.match(/\n:focus-visible \{\s*transition-property:([^;]+);/)

  it('có luật :focus-visible NGOÀI @layer đặt lại transition-property', () => {
    // Bắt đầu đầu dòng (không thụt lề) = nằm ngoài khối `@layer`, nên thắng utility.
    expect(rule).not.toBeNull()
  })

  it('danh sách thuộc tính KHÔNG chứa outline/box-shadow/all', () => {
    const props = rule?.[1] ?? ''
    expect(props).not.toMatch(/outline|box-shadow|\ball\b/)
    // Vẫn giữ màu + transform để hover/active trên phần tử đang focus còn mượt.
    expect(props).toMatch(/background-color/)
    expect(props).toMatch(/transform/)
  })

  it('summary cũng dùng viền lấy nét theo token', () => {
    expect(css).toMatch(
      /summary:focus-visible \{\s*\/\*[\s\S]*?\*\/\s*outline: 2px solid rgb\(var\(--focus-ring\)\)/,
    )
  })
})

describe('Nút chính theo accent, không tự ghép màu lệch (audit M17)', () => {
  it('Luyện tập: không còn CTA đỏ/cam tự ghép — dùng buttonClass', () => {
    const src = read('apps/dhcb/src/pages/learning/Practice.tsx')
    expect(src).not.toMatch(/bg-rose-500 hover:bg-rose-400/)
    expect(src).toMatch(/buttonClass\(\{\s*variant: 'primary'/)
    const pvp = read('apps/dhcb/src/components/PvPArena/PvPArenaCard.tsx')
    expect(pvp).not.toMatch(/bg-amber-500 hover:bg-amber-400/)
    expect(pvp).toMatch(/buttonClass\(\{\s*variant: 'secondary'/)
  })

  it('Ghi chú: không còn nút/tab blue-500/600 lệch accent', () => {
    const src = read('apps/dhcb/src/pages/domains/notes/Notes.tsx')
    expect(src).not.toMatch(/bg-blue-(500|600)\b(?!\/)/)
    expect(src).not.toMatch(/bg-blue-600\/20/)
  })
})

describe('Không còn hàng nút chính giống hệt nhau (đợt 0501)', () => {
  it('trang bậc/khoá/chặng Lập trình dùng LessonStartButton, không chép tay nút accent đặc', () => {
    for (const f of ['ProgrammingLevelPage', 'ProgrammingCoursePage', 'ProgrammingPathStagePage']) {
      const src = read(`apps/dhcb/src/pages/subjects/programming/${f}.tsx`)
      expect(src, f).toContain('<LessonStartButton')
      expect(src, f).not.toMatch(/w-full[^"]*bg-accent-500 hover:bg-accent-400/)
    }
  })

  it('Góc học tập: nút của từng thẻ môn là `secondary`, không phải sáu nút `primary`', () => {
    const src = read('apps/dhcb/src/pages/learning/Subjects.tsx')
    expect(src).toMatch(/variant: 'secondary', size: 'lg', fullWidth: true/)
    expect(src).not.toMatch(/variant: 'primary', size: 'lg', fullWidth: true/)
  })

  it('không ghép `ghost` + `border` tại chỗ gọi — dùng biến thể `outline`', () => {
    const files = listSource(join(REPO, 'apps/dhcb/src'))
    const offenders = files
      .filter((f) => /variant: 'ghost' \}\)\}[^`]*\bborder\b/.test(readFileSync(f, 'utf8')))
      .map((f) => f.slice(REPO.length + 1))
    expect(offenders).toEqual([])
  })
})

describe('Trang dài Lập trình không lặp/không trải hết (audit M22)', () => {
  it('lộ trình: bài kiểm dạng gọn, không lặp dòng "chưa có bài kiểm" mỗi chặng', () => {
    const src = read('apps/dhcb/src/pages/subjects/programming/ProgrammingPathPage.tsx')
    expect(src).toMatch(/<PathStageQuiz\s+inline/)
    expect(src).not.toContain('Chặng này chưa có bài kiểm.')
  })

  it('chi tiết hướng: module chặng + khối kiến trúc nằm trong khối gập', () => {
    const src = read('apps/dhcb/src/pages/subjects/programming/ProgrammingSpecializationPage.tsx')
    expect(src.match(/<Disclosure\b/g)?.length ?? 0).toBeGreaterThanOrEqual(2)
  })
})
