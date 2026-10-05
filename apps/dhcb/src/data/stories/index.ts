// apps/dhcb/src/data/stories/index.ts — Type cho Truyện cổ tích / Ngụ ngôn song ngữ (trang /listening).
// File này CHỈ chứa type + hằng số, KHÔNG chứa nội dung truyện (nội dung nằm ở raw/*.json,
// được script scripts/gen-stories-json.mjs sinh ra public/data/stories/ để tải bằng fetch()).

// 6 thể loại (chốt 2026-08-01, xem docs/research/danh-muc-truyen-nghe-2026-08-01.md mục 9).
export const STORY_KINDS = ['fairy-tale', 'fable', 'vn-folk', 'myth', 'humor', 'children'] as const

export type StoryKind = (typeof STORY_KINDS)[number]

/** Một câu song ngữ. `p` = chỉ số đoạn văn (để gom câu thành đoạn khi hiển thị). */
export interface StoryLine {
  p: number
  en: string
  vi: string
}

export interface StorySource {
  /** Vd: "Aesop's Fables, tr. George Fyler Townsend (1867) — public domain" */
  en: string
  /** URL Gutenberg đã tải văn bản gốc. Rỗng với truyện dân gian Việt Nam. */
  enUrl: string
  /** Vd: "Biên dịch: Đồng Hành" (người dịch thật, chủ dự án xác nhận 2026-10-05) */
  vi: string
}

/** Meta hiển thị ở danh sách — nằm trong index.json, KHÔNG kèm nội dung. */
export interface StoryMeta {
  id: string
  kind: StoryKind
  titleEn: string
  titleVi: string
  countryVi: string
  countryEn: string
  /** Emoji cờ, vd "🇩🇪". */
  flag: string
  /** Cấp CEFR gợi ý để người học tự lượng sức: 'A2' | 'B1' | 'B2'. */
  level: 'A2' | 'B1' | 'B2'
  /** Số câu — dùng ước lượng thời gian nghe ở danh sách. */
  lineCount: number
}

/** Nội dung đầy đủ — nằm trong <id>.json. */
export interface Story extends StoryMeta {
  source: StorySource
  /** Bài học rút ra (ngụ ngôn mới có). */
  moralEn?: string
  moralVi?: string
  lines: StoryLine[]
}
