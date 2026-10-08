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

// Bỏ comment trước khi dò: comment được phép NHẮC tên lớp để giải thích vì sao đã gỡ.
const stripComments = (code: string) =>
  code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')

describe('transition-all — đã gỡ hết (audit M17)', () => {
  // Gỡ dần qua đợt 0500 (172 → 151) · 0501 (→ 130) · 0513 khu Bạn Đồng Hành (→ 51) · 0514 (→ 0).
  // Code mới khai đúng thuộc tính: `transition-colors` · `transition` · `transition-[width]`…
  // (skill ui-ux mục 10.A.1).
  it('toàn kho không còn transition-all trong mã (ngoài comment)', () => {
    const files = ['apps/dhcb/src', 'apps/hub/src', 'packages'].flatMap((d) =>
      listSource(join(REPO, d)),
    )
    expect(files.length).toBeGreaterThan(300) // canh hàm quét hỏng rồi lặng lẽ quét rỗng
    const offenders = files.filter((f) =>
      /\btransition-all\b/.test(stripComments(readFileSync(f, 'utf8'))),
    )
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

describe('Nút CTA đặc không còn tự ghép màu lệch accent (M17 đợt 4, changelog 0515)', () => {
  // Các file này từng tự ghép nút đặc cyan / violet / indigo / teal / amber / blue / emerald /
  // rose — mỗi nơi một màu cho cùng một vai "hành động chính". Nay dùng `buttonClass`.
  // Nút CÓ nghĩa trạng thái (bật/tắt, đang chọn, ghi âm, ngành A/B…) nằm ngoài danh sách này
  // và được giữ nguyên có chủ đích.
  const CONVERTED = [
    'components/CompanionStudios/ActionCanvasBanner.tsx',
    'components/CompanionStudios/StudioDialogue.tsx',
    'components/admin/AdminReservedNamesPanel.tsx',
    'components/admin/AdminFeatureStatusPanel.tsx',
    'components/admin/AdminTtsCachePanel.tsx',
    'components/admin/AdminPaymentsPanel.tsx',
    'components/CefrExam.tsx',
    'components/studyTabs/QuizTab.tsx',
    'components/studyTabs/TodayLesson.tsx',
    'components/CefrLessonViews.tsx',
    'components/ExamQuestionCard.tsx',
    'components/CompanionVoice/ArticulatoryPhoneticsVisualizer.tsx',
    'components/CompanionVoice/ScenarioHolodeckCard.tsx',
    'components/CompanionVoice/PronunciationHintsCard.tsx',
    'components/CompanionVoice/A2ANegotiatorCard.tsx',
    'components/CompanionVoice/SocraticDiagnosticsCard.tsx',
    'components/DebateArena/LiveDebateModal.tsx',
    'components/DebateArena/DebateArenaCard.tsx',
    'components/MetacognitiveReflection/MetacognitiveJournalCard.tsx',
    'components/StemScratchpad/StemScratchpadCard.tsx',
    'components/MemoryPalace/MemoryPalaceCard.tsx',
    'components/location/TripActions.tsx',
    'components/chat/MessageInput.tsx',
    'components/TwoFactorSection.tsx',
    'components/UpgradeSection.tsx',
    'pages/companion/ActionCanvas.tsx',
    'pages/core/AddFriend.tsx',
  ].map((p) => `apps/dhcb/src/${p}`)

  it('không còn nền đặc màu bậc 400–700 + chữ tự khai trên cùng một chuỗi class', () => {
    const solid =
      /bg-(cyan|violet|indigo|teal|amber|blue|emerald|sky|rose)-[4-7]00(?![\w/])[^"`]*\btext-(white|black|\[#)/
    const offenders = CONVERTED.filter((f) => solid.test(stripComments(read(f))))
    expect(offenders).toEqual([])
  })

  it('mỗi file đều lấy nút từ @core/buttonStyles', () => {
    const missing = CONVERTED.filter(
      (f) =>
        !/from '@core\/buttonStyles'/.test(read(f)) ||
        !/buttonClass|buttonVariantClass/.test(read(f)),
    )
    expect(missing).toEqual([])
  })
})

describe('Nút accent đặc không còn tự ghép class (M17 đợt 6, changelog 0517)', () => {
  // Trước đợt này: 76 chuỗi `className="…bg-accent-500 … hover:bg-accent-400…"` tự ghép ở app + hub —
  // cùng màu với `primary` nhưng mỗi nơi một cỡ (`py-2`…`py-4`), bo góc (`xl`/`2xl`/`full`), mờ khi vô
  // hiệu (40/50/60) và có nơi chữ trắng `#fff` trên nền accent (~2,3:1, trượt AA). Nay đều qua
  // `buttonClass`. Chỉ dò chuỗi `className="…"` viết liền: chuỗi điều kiện (`? 'bg-accent-500…' : …`)
  // là TRẠNG THÁI của nút gửi (bật/tắt theo nội dung ô nhập), không phải nút tự ghép.
  it('app + hub + packages: 0 chuỗi className tự ghép nền accent đặc kèm hover accent', () => {
    const files = ['apps/dhcb/src', 'apps/hub/src', 'packages'].flatMap((d) =>
      listSource(join(REPO, d)),
    )
    expect(files.length).toBeGreaterThan(300)
    const handRolled = /className="[^"]*\bbg-accent-(500|600)(?![/\w-])[^"]*\bhover:bg-accent/
    const offenders = files
      .filter((f) => handRolled.test(stripComments(readFileSync(f, 'utf8'))))
      .map((f) => f.slice(REPO.length + 1))
    expect(offenders).toEqual([])
  })
})

describe('Nút trung tính không còn tự ghép nền zinc đặc (M17 đợt 7, changelog 0518)', () => {
  // Trước đợt này: ~50 nút "Thử lại / Đóng / Làm lại / Dừng" tự ghép `bg-zinc-800 hover:bg-zinc-700`
  // (hoặc `bg-zinc-900 hover:bg-zinc-800`), mỗi nơi một cỡ chữ, bo góc, đệm, và có nơi chữ `text-white`.
  // Nút trung tính chuẩn là `outline` (viền `line-strong` đã đo ở cả 3 theme) — nay đều qua
  // `buttonClass`/`buttonVariantClass`. Hub được thêm vào ở đợt 9 (changelog 0520) sau khi
  // `apps/hub/tailwind.config.js` có token ngữ nghĩa (`line-strong`, `content`, `surface-raised`).
  //
  // Ngoại lệ có lý do — KHÔNG phải nút hành động:
  //   • SentenceScramble: ô chữ của trò xếp câu (bấm để chuyển từ xuống câu) — là quân cờ của trò
  //     chơi, cần nền đặc để trông như một mảnh ghép, không phải nút có viền.
  const ALLOWED = ['apps/dhcb/src/pages/learning/practice/SentenceScramble.tsx']
  it('app + hub + packages: 0 chuỗi className tự ghép nền zinc đặc kèm hover zinc', () => {
    const files = ['apps/dhcb/src', 'apps/hub/src', 'packages'].flatMap((d) =>
      listSource(join(REPO, d)),
    )
    expect(files.length).toBeGreaterThan(300)
    // Hai lookahead: bắt cả khi `hover:` viết trước nền. Nền phải đứng sau dấu cách/nháy — `\b`
    // thì khớp nhầm cả đuôi `hover:bg-zinc-800` của nút chỉ có biểu tượng. `(?![/\w-])` loại nền
    // trong suốt (`bg-zinc-900/60` của hàng lựa chọn, thẻ) — đó là bề mặt, không phải nút đặc.
    const handRolled =
      /className="(?=[^"]*[\s"]bg-zinc-(800|900|950)(?![/\w-]))(?=[^"]*\bhover:bg-zinc-(700|800)(?![/\w-]))/
    const offenders = files
      .filter((f) => handRolled.test(stripComments(readFileSync(f, 'utf8'))))
      .map((f) => f.slice(REPO.length + 1))
    expect(offenders).toEqual(ALLOWED)
  })
})

describe('Không còn chữ `text-white` trên nền accent (M17 đợt 8, changelog 0519)', () => {
  // `text-white` map sang `--c-white`: ở Xanh đêm là trắng thật → trên accent-500 chỉ 2,43:1,
  // accent-600 3,68:1 (trượt AA); ở Blue sky/Nhi đồng bị đảo thành chữ tối → trên accent-600 4,36:1.
  // Trước đợt này dính: bong bóng tin nhắn của người dùng (chữ NỘI DUNG, cần 7:1), nút Đăng nhập,
  // nút gửi chat, "Nhấn để nói", tab đang chọn, avatar chữ cái. Nền accent đặc + chữ `#09090b`
  // đạt ≥ 7,10:1 ở cả 3 theme. axe không bắt được vì nền là gradient (axe báo "incomplete").
  const files = () =>
    ['apps/dhcb/src', 'apps/hub/src', 'packages'].flatMap((d) => listSource(join(REPO, d)))

  it('0 chuỗi class ghép nền accent đặc/gradient (400–600) với `text-white`', () => {
    const list = files()
    expect(list.length).toBeGreaterThan(300)
    const q = `['"\`]`
    const whiteOnAccent = new RegExp(
      `${q}(?=[^'"\`]*\\b(bg|from)-accent-(400|500|600)(?![/\\w-]))(?=[^'"\`]*\\btext-white\\b)`,
    )
    const offenders = list
      .filter((f) => whiteOnAccent.test(stripComments(readFileSync(f, 'utf8'))))
      .map((f) => f.slice(REPO.length + 1))
    expect(offenders).toEqual([])
  })

  it('0 nút gradient accent tự ghép (`hover:from-accent-*`) — dùng `buttonClass`', () => {
    const offenders = files()
      .filter((f) => /\bhover:from-accent-/.test(stripComments(readFileSync(f, 'utf8'))))
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
