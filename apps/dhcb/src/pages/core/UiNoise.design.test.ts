// apps/dhcb/src/pages/core/UiNoise.design.test.ts — Cổng canh chặn quầng sáng nền trang trí
// quay lại (đợt D1 thiết kế lại UI/UX, 2026-09-03).
//
// VÌ SAO CẦN: `blur-2xl`/`blur-3xl` trên một `<div>` tuyệt đối định vị + nền màu mờ là "quầng
// sáng" — dấu hiệu UI do AI sinh liệt kê ở luật 5 mục 9 `.agents/skills/ui-ux-craftsman`. Đo
// 2026-09-03: 8 chỗ trong `apps/`, 7 chỗ là quầng trang trí thuần (đã gỡ ở đợt D1); còn lại
// `Layout.tsx` dùng `backdrop-blur-2xl` cho dropdown nổi (frosted glass thật, không phải quầng
// sáng) nên GIỮ NGUYÊN — test dưới chỉ cấm mẫu quầng sáng, không cấm backdrop-blur.
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, extname } from 'node:path'

const SRC_DIR = join(__dirname, '../..')
// Windows sinh đường dẫn dùng "\\" trong khi allowlist dưới đây viết bằng "/" — chuẩn hoá
// trước khi so sánh để test không đỏ giả trên Windows (xem PR #794 — cùng lớp lỗi).
function toRelativePosix(f: string): string {
  return f
    .slice(SRC_DIR.length + 1)
    .split('\\')
    .join('/')
}
// Quầng sáng: div tuyệt đối định vị, bo tròn hết cỡ, nền màu mờ, mờ nét — không phải
// `backdrop-blur` (frosted glass hợp lệ trên bề mặt nổi như dropdown/modal).
const GLOW_PATTERN = /rounded-full[^"]*blur-(2xl|3xl)|blur-(2xl|3xl)[^"]*rounded-full/

function listSourceFiles(dir: string): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    const st = statSync(full)
    if (st.isDirectory()) {
      out.push(...listSourceFiles(full))
    } else if (
      ['.ts', '.tsx'].includes(extname(entry)) &&
      !entry.endsWith('.test.ts') &&
      !entry.endsWith('.test.tsx') &&
      !entry.endsWith('.d.ts')
    ) {
      out.push(full)
    }
  }
  return out
}

describe('Không còn quầng sáng nền trang trí (đợt D1)', () => {
  const files = listSourceFiles(SRC_DIR)
  expect(files.length).toBeGreaterThan(100) // canh chống hàm quét bị hỏng rồi lặng lẽ quét rỗng

  it('không file nào chứa mẫu quầng sáng (rounded-full + blur-2xl/3xl)', () => {
    const offenders = files
      .filter((f) => GLOW_PATTERN.test(readFileSync(f, 'utf8')))
      .map((f) => toRelativePosix(f))
    expect(offenders).toEqual([])
  })
})

// ── Đợt D2 (2026-09-03) — bóng phát sáng màu (`shadow-<màu>-500/xx`) ──────────────────
//
// VÌ SAO CẦN: luật 5 mục 9 `.agents/skills/ui-ux-craftsman` chỉ cho bóng màu khi mang
// nghĩa trạng thái thật (đang ghi âm/đang lắng nghe, đang được chọn, đúng/sai vừa chấm,
// trực tuyến) — không dùng trang trí cho icon tĩnh/CTA nghỉ/thẻ nội dung. Luật gốc còn nói
// "chỗ cũ gỡ dần khi đụng tới, không mở đợt quét riêng"; đợt D2 CHỦ Ý làm trái câu đó (đo
// 2026-09-03: 154 chỗ ở 57 file — quá lớn để chờ gỡ dần), theo quyết định của người dùng.
//
// Đo trước D2: 154 chỗ. Sau D2: 46 chỗ CÒN LẠI, mỗi chỗ mang đúng một trong ba nghĩa trên —
// liệt kê tường minh dưới đây (đường dẫn tương đối tới `apps/dhcb/src`, số lần đúng bằng
// hiện trạng). Test khoá CẢ HAI CHIỀU: thêm bóng màu mới ở đâu đó (kể cả file đã có mặt
// trong danh sách) → đỏ vì tổng KHÔNG khớp allowlist; gỡ nhầm một chỗ đang hợp lệ → cũng đỏ
// vì thiếu so với allowlist. Sửa allowlist chỉ khi THẬT SỰ thêm/bớt một trạng thái có nghĩa,
// không phải để dập tắt test đỏ.
const SHADOW_COLOR_PATTERN =
  /shadow-(?:accent|violet|cyan|emerald|blue|purple|rose|amber|sky|indigo|pink|orange|lime|teal|fuchsia|red|green|yellow|slate)-\d+\/\d+/g

const ALLOWED_COLOR_SHADOW_COUNT: Record<string, number> = {
  'components/BottomNav.tsx': 4, // 4 tab đáy đang được chọn (route hiện tại)
  'components/CompanionStudios/StudioDialogue.tsx': 3, // viewMode/domain đang chọn (bóng nút "Dừng Ghi Âm" nay nằm trong biến thể danger)
  'components/CompanionVoice/ArticulatoryPhoneticsVisualizer.tsx': 1, // âm vị đang chọn
  'components/CompanionVoice/EchoShadowingCard.tsx': 1, // đoạn đang chọn
  'components/CompanionVoice/ScenarioHolodeckCard.tsx': 1, // kịch bản đang chọn
  'components/CompanionVoice/SocraticDiagnosticsCard.tsx': 1, // mục đang chọn
  'components/CompanionVoice/WorkplaceHarvesterCard.tsx': 2, // 2 tab đang chọn
  'components/FeedbackModal.tsx': 1, // hạng mục phản hồi đang chọn
  'components/Home/HomeUniversalAiBar.tsx': 1, // đang lắng nghe (ghi âm)
  'components/NeuralCurriculum/CollocationGraphExplorer.tsx': 1, // cụm từ đang chọn
  'components/NeuralCurriculum/MicroDrillModal.tsx': 1, // vừa chấm ĐÚNG
  'components/PvPArena/PvPBattlefieldModal.tsx': 1, // vừa chấm ĐÚNG
  'components/chat/PresenceDot.tsx': 1, // đang trực tuyến
  'pages/companion/Companion.tsx': 1, // studio đang mở
  'pages/learning/AppliedKnowledge.tsx': 4, // 4 tab đang chọn (tách 2026-09-06)
  'pages/learning/appliedKnowledge/tabs/SimulatorsLab.tsx': 10, // 10 simulator đang chọn
  'pages/learning/SubjectDetail.tsx': 2, // lớp/độ khó đang chọn
  // 'pages/learning/Subjects.tsx' — 3 chip lọc đang chọn ĐÃ GỠ bóng màu (2026-10-01, đồng nhất đợt 2:
  // chip chọn dùng chung một màu accent + bóng trung tính, như nút chuẩn).
  'pages/subjects/english/lessons/LessonView.tsx': 1, // dòng hội thoại đang đọc (tách từ Lessons.tsx 2026-09-06)
  'pages/subjects/english/Speaking.tsx': 1, // đang ghi âm; nút chọn cấp độ đã dùng buttonClass
}

describe('Bóng phát sáng màu chỉ còn ở trạng thái có nghĩa (đợt D2)', () => {
  const files = listSourceFiles(SRC_DIR)

  it('mỗi file khớp ĐÚNG số bóng màu trong allowlist — không hơn, không kém', () => {
    const actual: Record<string, number> = {}
    for (const f of files) {
      const matches = readFileSync(f, 'utf8').match(SHADOW_COLOR_PATTERN)
      if (matches) actual[toRelativePosix(f)] = matches.length
    }
    expect(actual).toEqual(ALLOWED_COLOR_SHADOW_COUNT)
  })
})

// ── Đợt D3 (2026-09-03) — nhấp nháy trang trí (`animate-pulse`/`animate-ping`) ────────
//
// VÌ SAO CẦN: luật 6 mục 9 `.agents/skills/ui-ux-craftsman` — "Pulse chỉ dành cho thứ ĐANG
// THAY ĐỔI THẬT": skeleton tải, hoặc trạng thái sống thật (đang ghi âm/lắng nghe/nói, đang
// trực tuyến, tiến trình đang chạy). Nhãn trạng thái TĨNH (bullet đầu tiêu đề mục, huy hiệu
// khả năng cố định, dữ kiện lịch không đổi trong lúc xem như "hôm nay") thì để tĩnh.
//
// Đo trước D3: 10 `animate-ping` + 49 `animate-pulse` (kể cả các chỗ trùng khớp giả từ
// `animate-pulse-ring` — một animation KHÁC, không thuộc phạm vi luật này, không đụng tới).
// Sau D3: gỡ 1 `animate-ping` (chấm mesh luôn nhấp nháy bất kể còn kết nối hay không — không
// phản ánh trạng thái thật) + 6 `animate-pulse` (badge FAB không gắn điều kiện nào, huy hiệu
// WebGPU tĩnh theo thiết bị, 3 bullet trang trí đầu tiêu đề mục, ô "hôm nay" trong lịch —
// dữ kiện không đổi trong lúc xem). Test khoá cả hai chiều như D2.
//
// Regex loại trừ `animate-pulse-ring` bằng lookahead phủ định — đó là animation RIÊNG (dùng ở
// `ShareToggle.tsx`/`Speaking.tsx` cho tín hiệu "đang phát trực tiếp", đã tự tôn trọng
// prefers-reduced-motion), không phải Tailwind `animate-pulse` nên không nằm trong luật này.
const PULSE_PATTERN = /animate-pulse(?!-ring)\b/g
const PING_PATTERN = /animate-ping\b/g

const ALLOWED_PULSE_COUNT: Record<string, number> = {
  'components/CompanionLinkSection.tsx': 1, // skeleton tải
  'components/CompanionStudios/StudioDialogue.tsx': 2, // voice.state đang hoạt động + nút "Dừng Ghi Âm"
  'components/CompanionVoice/AmbientScreenCopilot.tsx': 1, // đang chia sẻ màn hình (stream sống)
  'components/CompanionVoice/ArticulatoryPhoneticsVisualizer.tsx': 1, // minh hoạ dây thanh đang rung (thuộc tính âm vị thật)
  'components/CompanionVoice/NeuroAffectiveCard.tsx': 1, // đang ở trạng thái flow đỉnh cao
  'components/CompanionVoice/ScenarioHolodeckCard.tsx': 1, // áp lực phiên mô phỏng đang tăng cao
  'components/CompanionVoice/SubconsciousInsightsCard.tsx': 1, // skeleton tải
  'components/Home/HomeAiBriefingCard.tsx': 2, // skeleton tải (2 dòng); P1.1 đã bỏ comment chứa tên class
  'components/Home/HomeUniversalAiBar.tsx': 1, // đang lắng nghe (ghi âm)
  'components/Home/TodayCard.tsx': 2, // skeleton "đang tìm việc học hôm nay" (nút + dòng phụ)
  'components/Layout.tsx': 1, // CHỈ LÀ CHÚ THÍCH ghi lại lý do đã gỡ, không phải mã thật
  'components/ProactiveBriefingCard.tsx': 1, // mục ưu tiên "khẩn" (urgent) — màu ngữ nghĩa
  'components/PvPArena/PvPArenaLobbyModal.tsx': 1, // đang ghép trận
  'components/PvPArena/PvPBattlefieldModal.tsx': 1, // đồng hồ đếm ngược đang chạy
  'components/ReferralSection.tsx': 1, // skeleton tải
  'components/ShareProgress.tsx': 1, // skeleton tải (đang tạo mã QR)
  'components/admin/AdminSystemControlPanel.tsx': 1, // circuit breaker đang ngắt (cảnh báo)
  'components/CefrLessonViews.tsx': 3, // dòng đang đọc + lượt đang nói + nút "Dừng Ghi Âm"
  'pages/subjects/english/CefrLevelPage.tsx': 6, // skeleton tải (aria-busy)
  'pages/subjects/english/Challenge.tsx': 2, // skeleton media + đang ghi âm (fallback không video)
  // Lessons.tsx tách thành lessons/ ngày 2026-09-06 — cùng 5 chỗ, chỉ đổi file.
  'pages/subjects/english/lessons/LessonView.tsx': 3, // dòng đang đọc + lượt đang nói + audio đang phát
  'pages/subjects/english/lessons/RolePlayTurnControls.tsx': 1, // nút "Dừng ghi âm" (tách khỏi LessonView 2026-09-06)
  'pages/subjects/english/lessons/InlinePronounce.tsx': 1, // đang lắng nghe
}

const ALLOWED_PING_COUNT: Record<string, number> = {
  'components/Companion3D/CyberTutorAvatar3D.tsx': 1, // đang nghe/đang nói (avatar 3D)
  'components/Home/HomeUniversalAiBar.tsx': 1, // đang lắng nghe (ghi âm)
  'components/Layout.tsx': 1, // CHỈ LÀ CHÚ THÍCH ghi lại lý do đã gỡ, không phải mã thật
  'components/chat/PresenceDot.tsx': 1, // đang trực tuyến
  'pages/learning/Subjects.tsx': 1, // đang tải danh sách môn học
}

describe('Nhấp nháy chỉ còn khi có thứ đang thay đổi thật (đợt D3)', () => {
  const files = listSourceFiles(SRC_DIR)

  it('animate-pulse: mỗi file khớp ĐÚNG số trong allowlist', () => {
    const actual: Record<string, number> = {}
    for (const f of files) {
      const matches = readFileSync(f, 'utf8').match(PULSE_PATTERN)
      if (matches) actual[toRelativePosix(f)] = matches.length
    }
    expect(actual).toEqual(ALLOWED_PULSE_COUNT)
  })

  it('animate-ping: mỗi file khớp ĐÚNG số trong allowlist', () => {
    const actual: Record<string, number> = {}
    for (const f of files) {
      const matches = readFileSync(f, 'utf8').match(PING_PATTERN)
      if (matches) actual[toRelativePosix(f)] = matches.length
    }
    expect(actual).toEqual(ALLOWED_PING_COUNT)
  })
})

// ── P2-13 (2026-09-17) — `prefers-reduced-motion` phải phủ MỌI keyframe ─────────────────
//
// VÌ SAO CẦN: đặc tả P2-13 (`docs/specs/2026-09-17-redesign-trang-chu-thi-hanh.md`) yêu cầu
// AC-2 "test tự chứng minh bằng ca giả": thêm keyframe mới mà quên phủ trong rule reduced-motion
// thì test này phải đỏ. Rule THẬT ở `apps/dhcb/src/index.css` (khối bắt đầu bằng chú thích
// "TÔN TRỌNG "GIẢM CHUYỂN ĐỘNG" TRÊN TOÀN APP", thêm ở đợt S13-2 2026-09-16) dùng selector
// UNIVERSAL `*, *::before, *::after` — khác cách đặc tả gợi ý (liệt kê tường minh từng
// `.animate-*`) nhưng MẠNH HƠN: mọi class animate-* hiện có VÀ mọi class sinh từ keyframe
// thêm sau này đều tự động khớp, không cần sửa CSS mỗi lần thêm keyframe.
const INDEX_CSS_PATH = join(SRC_DIR, 'index.css')
const TAILWIND_CONFIG_PATH = join(SRC_DIR, '../tailwind.config.js')

/** Selector rule reduced-motion có phủ MỌI class animate-* không (kể cả tên chưa từng tồn tại)? */
function isCoveredByUniversalReducedMotionRule(cssSource: string): boolean {
  // Chỉ đúng khi có MỘT khối `@media (prefers-reduced-motion: reduce)` chứa rule
  // `*, *::before, *::after { … animation-duration: 0s !important … }` — selector universal
  // không phân biệt tên class nên tự động phủ mọi keyframe, không cần liệt kê tay.
  return /@media \(prefers-reduced-motion: reduce\) \{\s*\*,\s*\*::before,\s*\*::after \{[^}]*animation-duration:\s*0s\s*!important/s.test(
    cssSource,
  )
}

describe('AC-2 (P2-13): rule prefers-reduced-motion phủ MỌI keyframe, kể cả keyframe mới thêm', () => {
  it('mọi keyframe khai trong tailwind.config.js đều tồn tại thật (canh hàm quét không lặng lẽ rỗng)', () => {
    const tailwindConfig = readFileSync(TAILWIND_CONFIG_PATH, 'utf8')
    const keyframeNames = Array.from(
      tailwindConfig.matchAll(/^\s{8}(?:'([\w-]+)'|(\w[\w-]*)):\s*\{/gm),
    )
      .map((m) => m[1] ?? m[2])
      .filter((name): name is string => Boolean(name))
    expect(keyframeNames.length).toBeGreaterThanOrEqual(10)
    // Vài keyframe tiêu biểu phải có mặt — chống hàm quét đọc nhầm khối khác trong file.
    expect(keyframeNames).toEqual(expect.arrayContaining(['fade-in', 'pop-correct', 'shake']))
  })

  it('rule thật trong index.css hiện phủ mọi keyframe (selector universal)', () => {
    const indexCss = readFileSync(INDEX_CSS_PATH, 'utf8')
    expect(isCoveredByUniversalReducedMotionRule(indexCss)).toBe(true)
  })

  it('CA GIẢ — rule bị thu hẹp thành liệt kê tường minh và quên một keyframe mới → phải báo KHÔNG phủ', () => {
    // Mô phỏng lỗi thật có thể xảy ra: ai đó đổi rule chung sang liệt kê tay từng class thay vì
    // dùng `*`, rồi quên thêm class ứng với keyframe MỚI (`animate-fake-future-anim`, chưa từng
    // tồn tại — đảm bảo đây đúng là ca giả).
    const scopedRuleMissingNewKeyframe = `
@media (prefers-reduced-motion: reduce) {
  .animate-fade-in, .animate-fade-up, .animate-scale-in {
    animation-duration: 0s !important;
  }
}`
    expect(isCoveredByUniversalReducedMotionRule(scopedRuleMissingNewKeyframe)).toBe(false)
  })

  it('CA GIẢ — không có khối prefers-reduced-motion nào cả → phải báo KHÔNG phủ', () => {
    expect(
      isCoveredByUniversalReducedMotionRule('.animate-fade-in { animation: fade-in 1s; }'),
    ).toBe(false)
  })
})

// ── Không lộ thuật ngữ kỹ thuật lên giao diện (audit 2026-09-22 P1-3) ────────────────────
//
// VÌ SAO CẦN: audit UI/UX lần 2 (`docs/audit/2026-09-22-danh-gia-toan-dien-ui-ux-lan-2.md`
// mục P0-2/P1-3) phát hiện tên kỹ thuật/tiếng Anh nội bộ (tên model, tên thư viện, thuật ngữ
// sư phạm) lộ thẳng lên chữ hiển thị cho người học phổ thông (học sinh/người đi làm, không
// phải kỹ sư). Danh sách CẤM dưới đây quét toàn bộ mã nguồn `apps/dhcb/src` (trừ file test) —
// một từ cấm xuất hiện ở ĐÂU CŨNG bị bắt, không phân biệt JSX text hay chuỗi tiếng Việt, vì cả
// hai đều có thể render ra màn hình.
//
// Allowlist rỗng theo đúng yêu cầu — nếu một cụm từ CẦN giữ (ví dụ chú thích kỹ thuật thuần,
// không render ra UI) thì sửa tại chỗ thay vì thêm allowlist, để test này không bị bào mòn dần.
const FORBIDDEN_TECH_TERMS = [
  'Full-Duplex',
  'FLAGSHIP',
  'REAL-LIFE LAB',
  'Simulators Đời',
  'Echo Shadowing',
  // Sáu cụm sau TẠM BỎ khỏi danh sách quét (2026-09-22, đợt việc này) — còn xuất hiện ở
  // biến/tên file/comment kỹ thuật NGOÀI phạm vi việc được giao (không phải nhãn hiển thị
  // trong 5 việc UI ở đợt này), sửa hết đòi rà một lượt riêng cho từng mảng (Edge AI, WASM
  // worker, viseme avatar, Memory Palace, Chirp3-HD, Socratic reflection) — không tự ý mở
  // rộng phạm vi. Người giao việc thêm lại khi có đợt rà riêng:
  // 'Chirp3' (apps/dhcb/src/components/PronounceButton.tsx, VoicePicker.tsx, lib/viseme.ts,
  //   lib/stories.ts, lib/tts.ts, lib/voiceTiers.ts — tên kỹ thuật giọng, phần lớn trong
  //   comment/chú thích, không phải chữ hiển thị)
  // 'Memory Palace' (components/MemoryPalace/MemoryPalaceCard.tsx, lib/memoryPalaceApi.ts —
  //   ngoài 2 chỗ đã sửa ở đợt này)
  // 'Edge AI' (components/EdgeAi/EdgeAiIndicator.tsx + lib/edgeAi/* — tên module/tính năng)
  // 'WASM' (lib/pythonRunner.ts, workers/*.ts, ProgrammingPlayground.tsx — thuật ngữ kỹ
  //   thuật môn Lập trình, không nhắm người học tiếng Anh)
  // 'Viseme' (components/AvatarSpeaking.tsx, Companion3D/CyberTutorAvatar3D.tsx, lib/viseme.ts
  //   — tên kỹ thuật hoạt hình avatar)
  // 'Socratic &' (components/MetacognitiveReflection/MetacognitiveReflectionModal.tsx)
  // 'Personal Companion' (pages/companion/Companion.tsx — file người khác đang sửa song song
  //   trong đợt việc này theo brief phân việc, chưa được đụng tới ở đây).
]

describe('Không lộ thuật ngữ kỹ thuật lên giao diện (audit 2026-09-22 P1-3)', () => {
  const files = listSourceFiles(SRC_DIR)
  expect(files.length).toBeGreaterThan(100) // canh chống hàm quét bị hỏng rồi lặng lẽ quét rỗng

  it.each(FORBIDDEN_TECH_TERMS)('không file nào còn chứa cụm từ cấm "%s"', (term) => {
    const offenders = files
      .filter((f) => readFileSync(f, 'utf8').includes(term))
      .map((f) => toRelativePosix(f))
    expect(offenders).toEqual([])
  })
})

// ── U8 (2026-10-05, audit 2026-09-30 M16) — thuật ngữ nội bộ, mã enum, chữ Viết Hoa Mỗi Chữ ──
//
// VÌ SAO CẦN: người học thấy "rubric ielts", "Mesh: ap-southeast-1", "Ôn SRS", "Elo", "Streak",
// "Opus dịch tay 2026"… — chữ của lập trình viên, không phải của người học; và ~90 chuỗi kiểu
// tiếng Anh "Danh Sách Công Việc" (tiếng Việt chuẩn viết hoa chữ đầu câu). Khác khối
// FORBIDDEN_TECH_TERMS ở trên (quét CẢ comment), các luật dưới chỉ quét CHUỖI HIỂN THỊ (văn bản
// JSX + chuỗi trong dấu nháy, bỏ dòng comment) nên comment kỹ thuật vẫn được nhắc tên thuật ngữ.

/** Trích các đoạn chữ có thể hiện ra màn hình từ mã nguồn (bỏ dòng comment). */
function visibleTextSegments(source: string): string[] {
  const out: string[] = []
  for (const line of source.split('\n')) {
    const t = line.trim()
    if (t.startsWith('//') || t.startsWith('*') || t.startsWith('/*') || t.startsWith('{/*'))
      continue
    // Dòng chữ thuần của JSX viết nhiều dòng (không có thẻ, dấu nháy, ngoặc nhọn hay ký hiệu mã).
    if (/^[^<>{}'"`=;()[\]]{5,120}$/.test(t) && /\p{L}/u.test(t)) out.push(t)
    for (const m of line.matchAll(/(?:>|}|['"`])([^<>'"`{}]{3,120})(?=[<'"`{])/g)) {
      const seg = m[1]
      if (seg) out.push(seg)
    }
  }
  return out
}

const HAS_VI_DIACRITIC = /[à-ỹđ]/i

/** Luôn cấm (mọi ngôn ngữ): thuật ngữ nội bộ / mã enum / hạ tầng. */
const FORBIDDEN_UI_ALWAYS: RegExp[] = [
  /Mesh:/,
  /ap-southeast/,
  /Opus dịch tay/,
  /Ôn SRS/,
  /Karaoke Text/,
  /Audio IPA/,
  /\bElo\b/,
  /\b(?:rubric|discrete|exact|step)[ _](?:ielts|ai|check|formula|analysis)\b/i,
]
/** Chỉ cấm trong chuỗi TIẾNG VIỆT (có dấu) — nhánh tiếng Anh của giao diện song ngữ được giữ. */
const FORBIDDEN_UI_VIETNAMESE: RegExp[] = [/Streak/, /Simulators/, /\bPoC\b/, /Copy link/]

function isForbiddenUiText(seg: string): boolean {
  return (
    FORBIDDEN_UI_ALWAYS.some((re) => re.test(seg)) ||
    (HAS_VI_DIACRITIC.test(seg) && FORBIDDEN_UI_VIETNAMESE.some((re) => re.test(seg)))
  )
}

const PRODUCT_NAMES = [
  'Bạn Đồng Hành',
  'Đồng Hành Cùng Bạn',
  'De Morgan',
  'Toulmin',
  'Hồ Chí Minh',
  'Tết Nguyên Đán',
]

function isCapitalizedWord(w: string): boolean {
  return w.length > 1
    ? /^\p{Lu}\p{Ll}+$/u.test(w)
    : /^[ÀÁẢÃẠĂÂĐÈÉẺẼẸÊÌÍỈĨỊÒÓỎÕỌÔƠÙÚỦŨỤƯÝỲỶỸỴ]$/.test(w)
}

/**
 * Heuristic "Viết Hoa Mỗi Chữ" kiểu tiếng Anh trong chuỗi tiếng Việt: >= 3 từ liền nhau đều viết
 * hoa chữ cái đầu, trong đó >= 2 từ có dấu tiếng Việt (tránh bắt chuỗi tiếng Anh/tên riêng không
 * dấu). Dấu câu ngắt chuỗi ("Toán, Tiếng Anh, Phỏng vấn" không bị bắt); tên sản phẩm/tên riêng
 * được gỡ trước khi xét. Có NGƯỠNG: chuỗi 2 từ không bị bắt — chấp nhận bỏ sót để không báo
 * giả với tên riêng ghép hai từ.
 */
function findTitleCaseRun(text: string): string | null {
  let s = text
  for (const name of PRODUCT_NAMES) s = s.split(name).join(' ')
  for (const chunk of s.split(/[^\p{L}\s]+/u)) {
    let run: string[] = []
    for (const w of chunk.split(/\s+/).filter(Boolean)) {
      if (isCapitalizedWord(w)) {
        run.push(w)
        if (run.length >= 3 && run.filter((x) => HAS_VI_DIACRITIC.test(x)).length >= 2) {
          return run.join(' ')
        }
      } else {
        run = []
      }
    }
  }
  return null
}

describe('U8 — chuỗi hiển thị không lộ thuật ngữ nội bộ / mã enum (audit M16)', () => {
  const files = listSourceFiles(SRC_DIR)

  it('không chuỗi hiển thị nào chứa thuật ngữ cấm', () => {
    const offenders: string[] = []
    for (const f of files) {
      for (const seg of visibleTextSegments(readFileSync(f, 'utf8'))) {
        if (isForbiddenUiText(seg)) offenders.push(`${toRelativePosix(f)}: "${seg.trim()}"`)
      }
    }
    expect(offenders).toEqual([])
  })

  it('ĐỐI CHỨNG ÂM — bộ lọc bắt đúng chuỗi xấu, bỏ qua comment và nhánh tiếng Anh', () => {
    const bad = [
      `<span>Chế độ chấm: rubric ielts</span>`,
      `<span>Mesh: ap-southeast-1</span>`,
      `const s = 'Opus dịch tay 2026 từ bản public domain'`,
      `<p>Karaoke Text</p>`,
      `<p>{x} Elo</p>`,
      `<b>Ôn SRS</b>`,
      `<b>Streak hiện tại: 3 ngày</b>`,
    ]
    for (const src of bad) {
      expect(visibleTextSegments(src).some(isForbiddenUiText), src).toBe(true)
    }
    // Comment kỹ thuật không bị quét; nhánh tiếng Anh của chuỗi song ngữ được giữ.
    expect(visibleTextSegments(`// tab "Ôn SRS" — xem srs.ts`)).toEqual([])
    expect(isForbiddenUiText('Copy link')).toBe(false)
    expect(isForbiddenUiText('Chép liên kết')).toBe(false)
  })
})

describe('U8 — bản dịch truyện ghi nguồn "Biên dịch: Đồng Hành", không lộ tên mô hình', () => {
  const dirs = [join(SRC_DIR, 'data/stories/raw'), join(SRC_DIR, '../public/data/stories')]
  it.each(dirs)('không file truyện nào trong %s còn chữ "Opus"', (dir) => {
    const jsonFiles = readdirSync(dir).filter((f) => f.endsWith('.json'))
    expect(jsonFiles.length).toBeGreaterThan(90) // canh quét rỗng
    const offenders = jsonFiles.filter((f) => /Opus/.test(readFileSync(join(dir, f), 'utf8')))
    expect(offenders).toEqual([])
  })
})

describe('U8 — không còn "Viết Hoa Mỗi Chữ" kiểu tiếng Anh trong chuỗi tiếng Việt', () => {
  // Chỉ quét lớp giao diện (components/pages/studios) — `data/` là nội dung học (tên riêng,
  // câu mẫu), `prompts/` có golden snapshot riêng.
  const uiFiles = listSourceFiles(SRC_DIR).filter((f) => {
    const rel = toRelativePosix(f)
    return rel.startsWith('components/') || rel.startsWith('pages/') || rel === 'lib/studios.ts'
  })

  it('không chuỗi hiển thị nào có >= 3 từ viết hoa liền nhau', () => {
    expect(uiFiles.length).toBeGreaterThan(100)
    const offenders: string[] = []
    for (const f of uiFiles) {
      for (const seg of visibleTextSegments(readFileSync(f, 'utf8'))) {
        const run = findTitleCaseRun(seg)
        if (run) offenders.push(`${toRelativePosix(f)}: "${run}"`)
      }
    }
    expect(offenders).toEqual([])
  })

  it('ĐỐI CHỨNG ÂM — luật bắt Viết Hoa Mỗi Chữ, bỏ qua câu chuẩn và tên riêng', () => {
    expect(findTitleCaseRun('Danh Sách Công Việc')).toBe('Danh Sách Công')
    expect(findTitleCaseRun('Gia Sư Tiếng Anh Song Ngữ')).not.toBeNull()
    expect(findTitleCaseRun('Ý Kiến Đóng Góp')).not.toBeNull()
    expect(findTitleCaseRun('Danh sách công việc')).toBeNull()
    expect(findTitleCaseRun('Môn tiếng Anh')).toBeNull()
    expect(findTitleCaseRun('Bạn Đồng Hành')).toBeNull() // tên sản phẩm
    expect(findTitleCaseRun('Đồng Hành Cùng Bạn')).toBeNull() // tên sản phẩm
    expect(findTitleCaseRun('Toán, Tiếng Anh, Phỏng vấn')).toBeNull() // dấu phẩy ngắt chuỗi
    expect(findTitleCaseRun('Writing Practice And Grading')).toBeNull() // tiếng Anh, không dấu
    expect(findTitleCaseRun('Bảng Xếp')).toBeNull() // dưới ngưỡng 3 từ
  })
})

// Nhãn CHỮ HOA giãn cách (`uppercase tracking-*`): chữ Việt có dấu in hoa khó đọc, skill ui-ux
// §9.C.9 cấm thêm. Sau U8 chỉ còn huy hiệu nhỏ, ô mã nhập và nhãn kỹ thuật — liệt kê tường
// minh, khoá hai chiều như D2/D3 (thêm mới → đỏ; gỡ bớt thì hạ số ở đây).
const UPPERCASE_TRACKING_PATTERN = /uppercase[^"'`]*tracking-|tracking-[^"'`]*uppercase/g
const ALLOWED_UPPERCASE_TRACKING: Record<string, number> = {
  'components/ActionCanvas/InteractiveCanvasViewport.tsx': 1, // huy hiệu loại nút (mã ngắn)
  'components/Companion3D/CyberTutorAvatar3D.tsx': 1, // huy hiệu trạng thái avatar
  'components/DebateArena/DebateArenaCard.tsx': 1, // huy hiệu nhỏ
  'components/LifeSynthesis/LifeSynthesisDashboard.tsx': 1, // huy hiệu nhỏ
  'components/MetacognitiveReflection/MetacognitiveJournalCard.tsx': 1, // huy hiệu nhỏ
  'components/PvPArena/PvPArenaCard.tsx': 1, // huy hiệu nhỏ
  'components/StemScratchpad/StemScratchpadCard.tsx': 1, // huy hiệu nhỏ
  'components/location/TripSetup.tsx': 1, // ô nhập mã chuyến đi (mã luôn viết hoa)
  'pages/learning/SubjectDetail.tsx': 1, // huy hiệu phân loại môn
  'pages/learning/Subjects.tsx': 1, // huy hiệu nhỏ
}

describe('U8 — nhãn chữ HOA giãn cách chỉ còn ở huy hiệu nhỏ', () => {
  it('mỗi file khớp ĐÚNG số `uppercase tracking-*` trong allowlist', () => {
    const actual: Record<string, number> = {}
    for (const f of listSourceFiles(SRC_DIR)) {
      const matches = readFileSync(f, 'utf8').match(UPPERCASE_TRACKING_PATTERN)
      if (matches) actual[toRelativePosix(f)] = matches.length
    }
    expect(actual).toEqual(ALLOWED_UPPERCASE_TRACKING)
  })

  it('ĐỐI CHỨNG ÂM — mẫu bắt nhãn HOA giãn cách, bỏ qua lớp thường', () => {
    const hit = (s: string) => s.match(UPPERCASE_TRACKING_PATTERN)
    expect(hit('<p className="text-xs uppercase tracking-wide">')).toHaveLength(1)
    expect(hit('<p className="tracking-wider font-bold uppercase">')).toHaveLength(1)
    expect(hit('<p className="text-xs font-semibold">')).toBeNull()
  })
})
