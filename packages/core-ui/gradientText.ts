// Bộ màu cho CHỮ GRADIENT (`bg-clip-text text-transparent`) — MỘT nơi duy nhất trong repo.
//
// Vì sao gom về đây: axe-core KHÔNG đo được tương phản của chữ gradient (màu chữ là ảnh nền bị cắt
// theo hình chữ), nên mọi cổng a11y E2E đều cho qua. Changelog 0598 bắt được tiêu đề hub chỉ đạt
// 1,27:1 ở theme sáng; changelog 0599 bắt thêm hai con số band điểm cùng khuôn. Gom mọi bộ màu về
// một module thì test tĩnh (`scripts/fixed-color-contrast-audit.test.ts`) đo được TẤT CẢ ở 3 theme,
// và cấm viết thẳng điểm dừng màu cạnh `bg-clip-text` ở nơi khác.
//
// LUẬT: chữ gradient chỉ dùng cho chữ LỚN (tiêu đề, con số cỡ ≥ 24px) — ngưỡng 4,5:1 (AAA chữ lớn).
// Mỗi bộ có bậc nhạt cho theme tối và bậc đậm `theme-light:` cho hai theme sáng: màu Tailwind cố
// định (amber, rose…) và cả `accent` bậc 200–400 đều quá nhạt trên nền sáng.

/** Hai class biến chữ thành "khuôn" cho dải màu phía sau. */
export const GRADIENT_TEXT = 'bg-clip-text text-transparent'

/** Dòng nhấn ở tiêu đề hub ("Hiểu điều bạn học."). */
export const HERO_ACCENT_GRADIENT =
  'from-accent-400 via-accent-300 to-accent-200 theme-light:from-accent-800 theme-light:via-accent-700 theme-light:to-accent-700'

export type ScoreBand = 'high' | 'mid' | 'low'

/** Mốc band điểm kiểu IELTS: ≥ 7 tốt, ≥ 5 khá, dưới 5 cần luyện thêm. */
export function scoreBand(overall: number): ScoreBand {
  if (overall >= 7) return 'high'
  if (overall >= 5) return 'mid'
  return 'low'
}

/** Con số band điểm cuối phiên hội thoại (`EvaluationResultView`). */
export const CONVERSATION_SCORE_GRADIENT: Readonly<Record<ScoreBand, string>> = {
  high: 'from-accent-400 to-accent-300 theme-light:from-accent-800 theme-light:to-accent-700',
  mid: 'from-amber-400 to-yellow-300 theme-light:from-amber-900 theme-light:to-amber-800',
  low: 'from-red-400 to-orange-300 theme-light:from-red-800 theme-light:to-red-700',
}

/** Con số band điểm bài viết (`Writing`). */
export const WRITING_SCORE_GRADIENT: Readonly<Record<ScoreBand, string>> = {
  high: 'from-emerald-400 via-teal-300 to-cyan-300 theme-light:from-emerald-800 theme-light:via-teal-800 theme-light:to-cyan-800',
  mid: 'from-amber-400 via-yellow-300 to-amber-200 theme-light:from-amber-900 theme-light:via-amber-800 theme-light:to-amber-800',
  low: 'from-rose-400 via-red-400 to-orange-400 theme-light:from-rose-800 theme-light:via-red-700 theme-light:to-red-700',
}

/** Mọi bộ màu chữ gradient — test tĩnh đo đủ danh sách này, thêm bộ mới thì thêm vào đây. */
export const ALL_GRADIENT_TEXT_COLORS: ReadonlyArray<{ name: string; classes: string }> = [
  { name: 'HERO_ACCENT_GRADIENT', classes: HERO_ACCENT_GRADIENT },
  ...(Object.entries(CONVERSATION_SCORE_GRADIENT) as Array<[ScoreBand, string]>).map(
    ([band, classes]) => ({ name: `CONVERSATION_SCORE_GRADIENT.${band}`, classes }),
  ),
  ...(Object.entries(WRITING_SCORE_GRADIENT) as Array<[ScoreBand, string]>).map(
    ([band, classes]) => ({ name: `WRITING_SCORE_GRADIENT.${band}`, classes }),
  ),
]
