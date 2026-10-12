// api/_lib/dictionaryData.ts — Nạp toàn bộ từ điển Ở PHÍA SERVER (1 lần, cache RAM).
//
// Vì sao đọc bằng fs thay vì import: handler này chạy ở 2 môi trường —
//   (1) Vite dev (qua middleware ssrLoadModule) và (2) Express trên VPS (qua tsx).
// import.meta.glob là tính năng RIÊNG của Vite, không có khi chạy tsx production.
// Dùng fs.readdirSync/readFileSync thì cả hai môi trường (đều là Node) đều chạy được.
//
// Dữ liệu nằm tại public/data/dictionary/chunk-*.json — có sẵn trên đĩa ở cả dev lẫn
// trên VPS (repo được clone nguyên vẹn). Nạp ~2.6MB vào RAM server 1 lần là không đáng kể.
// LƯU Ý: các chunk đã được chuyển từ src/ sang public/ (commit "chuyển chunk sang public/")
// để giảm số module Vite. Endpoint server đọc trực tiếp bằng fs nên phải trỏ ĐÚNG public/.

import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

// Các dạng biến thể của từ — đồng bộ với WordForms trong src/types.ts.
// (Server giữ định nghĩa riêng để không phụ thuộc code React; nội dung phải khớp.)
export interface WordForms {
  plural?: string
  uncountable?: boolean
  v3s?: string
  ving?: string
  past?: string
  pastPart?: string
  comparative?: string
  superlative?: string
  irregular?: boolean
}

export interface DictEntry {
  word: string
  pos: string
  vi: string
  ex_en: string
  ex_vi: string
  ipa_en?: string
  ipa_vi?: string
  // Cấp CEFR ước lượng bằng AI (scripts/tag-cefr-levels.ts) — không phải mọi từ đều có.
  level?: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'
  freq?: number
  forms?: WordForms // các dạng biến thể (chỉ ở từ gốc)
  base?: string // trỏ về từ gốc (chỉ ở entry là dạng biến thể)
}

// Dùng process.cwd() thay vì import.meta.url của chính file này: khi biên dịch sang
// dist-server/ (xem tsconfig.server.json) đường dẫn tương đối từ file đã build sẽ trỏ SAI.
// process.cwd() luôn là gốc repo ở cả 3 môi trường: Vite dev, tsx, và JS đã biên dịch.
// [PR-S2] public/ đã dời vào apps/dhcb/public — cập nhật đường dẫn theo.
const DICT_DIR = join(process.cwd(), 'apps', 'dhcb', 'public', 'data', 'dictionary')

let _all: DictEntry[] | null = null

// Toàn bộ từ điển (ghép mọi chunk theo thứ tự tên file). Cache sau lần đầu.
export function getAllEntries(): DictEntry[] {
  if (_all) return _all
  const files = readdirSync(DICT_DIR)
    .filter((f) => /^chunk-\d+\.json$/.test(f))
    .sort()
  _all = files.flatMap((f) => JSON.parse(readFileSync(join(DICT_DIR, f), 'utf8')) as DictEntry[])
  return _all
}

// Phát hiện chuỗi tiếng Việt (có dấu) — tra theo nghĩa tiếng Việt thay vì theo từ tiếng Anh.
export function hasVietnamese(s: string): boolean {
  return /[àáảãạăắặẳẵặâấầẩẫậđèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵ]/i.test(s)
}

/**
 * Tìm trong từ điển theo một từ khoá đã chuẩn hoá (trim + lowercase). Có dấu tiếng Việt ⇒ tìm
 * trong nghĩa `vi`; không dấu ⇒ ưu tiên từ BẮT ĐẦU bằng từ khoá rồi mới tới từ CHỨA từ khoá.
 * Dùng chung cho `/api/dictionary` và công cụ `lookup_dictionary` của Bạn Đồng Hành (GĐ3).
 */
export function searchDictionaryEntries(entries: DictEntry[], query: string): DictEntry[] {
  if (hasVietnamese(query)) return entries.filter((e) => e.vi.toLowerCase().includes(query))
  const starts: DictEntry[] = []
  const contains: DictEntry[] = []
  for (const e of entries) {
    const w = e.word.toLowerCase()
    if (w.startsWith(query)) starts.push(e)
    else if (w.includes(query)) contains.push(e)
  }
  return [...starts, ...contains]
}
