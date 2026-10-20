// src/lib/dictionaryApi.ts — Tra từ điển Ở CLIENT từ dữ liệu tĩnh (public/data/dictionary).
//
// Trước đây file này gọi /api/dictionary (server, cần đăng nhập + mạng). Để app dùng được
// OFFLINE, ta chuyển sang nạp toàn bộ từ điển từ các chunk tĩnh (loadDictionary) — giống
// trang Học (/learn) vẫn làm. Các chunk được service worker cache + dataPrecache tải sẵn,
// nên sau lần đầu là tra được offline. Logic tìm kiếm/đếm loại từ sao y endpoint server cũ.
//
// Giữ nguyên CHỮ KÝ hàm (async, trả Promise) để Dictionary.tsx & Flashcard.tsx không phải sửa.

import { sample } from '@dhcb/core-contracts/shuffle'
import { loadDictionary } from '../data/dictionary/loader'
import type { DictEntry } from '../types'
import { vnDateStr } from './date'

const MAX_RESULTS = 200

export interface DictSearchResult {
  total: number // tổng số từ trong từ điển (hiển thị ở phụ đề)
  matched: number // số từ khớp truy vấn
  posGroups: [string, number][] // [loại từ, số lượng] để vẽ chip lọc
  results: DictEntry[] // kết quả (đã cắt bớt)
  // Có khi query khớp ĐÚNG 1 dạng biến thể (vd "books"/"played") không có entry riêng —
  // trả kèm để UI hiện "'books' là số nhiều của 'book'" (Bước 4, bo-sung-dang-bien-the-tu-dien.md).
  matchedForm?: { form: string; base: string }
}

// ── Chỉ mục dạng biến thể → từ gốc (Bước 4: search hiểu biến thể) ────────────────────────
// Xây 1 LẦN từ trường `forms` đã tính sẵn của toàn bộ từ điển (KHÔNG tính lại thuật toán biến
// thể ở đây) — tra "books"/"played" trả về entry gốc "book"/"play" dù 2 từ đó không có entry
// riêng (chỉ dạng BẤT QUY TẮC mới có entry riêng, xem quyết định thiết kế trong tài liệu).
let formsIndexCache: Map<string, string> | null = null
let wordSetCache: Set<string> | null = null

function buildFormsIndex(entries: DictEntry[]): Map<string, string> {
  const index = new Map<string, string>()
  for (const e of entries) {
    if (!e.forms) continue
    const candidates = [
      e.forms.plural,
      e.forms.v3s,
      e.forms.ving,
      e.forms.past,
      e.forms.pastPart,
      e.forms.comparative,
      e.forms.superlative,
    ]
    for (const f of candidates) {
      const key = f?.toLowerCase()
      if (key && !index.has(key)) index.set(key, e.word)
    }
  }
  return index
}

// Phát hiện chuỗi tiếng Việt (có dấu) — giống logic server cũ.
function hasVietnamese(s: string): boolean {
  return /[àáảãạăắặẳẵặâấầẩẫậđèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵ]/i.test(s)
}

// "Ngẫu nhiên nhưng cố định theo ngày" — giữ KHỚP logic cũ để cùng ngày ra cùng từ.
function seedFromDate(date: string): number {
  let h = 0
  for (let i = 0; i < date.length; i++) h = (h * 31 + date.charCodeAt(i)) >>> 0
  return h
}

// Tìm kiếm theo từ khóa (tiếng Anh hoặc tiếng Việt).
// signal/pos giữ lại cho tương thích — lọc theo pos làm luôn ở client.
export async function searchDictionary(
  q: string,
  _signal?: AbortSignal,
  pos?: string | null,
): Promise<DictSearchResult> {
  const entries = await loadDictionary()
  const query = q.trim().toLowerCase()
  if (!query) return { total: entries.length, matched: 0, posGroups: [], results: [] }

  let matches: DictEntry[]
  let matchedForm: { form: string; base: string } | undefined
  if (hasVietnamese(query)) {
    matches = entries.filter((e) => e.vi.toLowerCase().includes(query))
  } else {
    // Ưu tiên từ BẮT ĐẦU bằng query, rồi mới đến từ CHỨA query.
    const starts: DictEntry[] = []
    const contains: DictEntry[] = []
    for (const e of entries) {
      const w = e.word.toLowerCase()
      if (w.startsWith(query)) starts.push(e)
      else if (w.includes(query)) contains.push(e)
    }
    matches = [...starts, ...contains]

    // Bước 4: query khớp ĐÚNG 1 dạng biến thể không có entry riêng (vd "books"/"played") —
    // chỉ kích hoạt khi KHÔNG có entry nào trùng khớp chính xác (query đã là 1 từ thật rồi
    // thì không cần "gợi ý" gì thêm, vd tránh nhầm khi chính "leaves" cũng là 1 từ độc lập).
    if (!wordSetCache) wordSetCache = new Set(entries.map((e) => e.word.toLowerCase()))
    if (!wordSetCache.has(query)) {
      if (!formsIndexCache) formsIndexCache = buildFormsIndex(entries)
      const base = formsIndexCache.get(query)
      if (base) {
        const baseEntry = entries.find((e) => e.word === base)
        if (baseEntry) {
          matchedForm = { form: query, base }
          if (!matches.some((m) => m.word === base)) matches = [baseEntry, ...matches]
        }
      }
    }
  }

  // Đếm loại từ trên TOÀN BỘ kết quả khớp (trước khi lọc pos) → chip giữ tổng đầy đủ.
  const counts: Record<string, number> = {}
  for (const e of matches) counts[e.pos] = (counts[e.pos] || 0) + 1
  const posGroups = Object.entries(counts).sort((a, b) => b[1] - a[1]) as [string, number][]

  const filtered = pos ? matches.filter((e) => e.pos === pos) : matches

  return {
    total: entries.length,
    matched: matches.length,
    posGroups,
    results: filtered.slice(0, MAX_RESULTS),
    matchedForm,
  }
}

// Lấy từ vựng cố định theo ngày (thẻ "Từ vựng hôm nay") + tổng số từ.
export async function fetchWordOfDay(): Promise<{ total: number; entry: DictEntry | null }> {
  const entries = await loadDictionary()
  if (entries.length === 0) return { total: 0, entry: null }
  const today = vnDateStr()
  const entry = entries[seedFromDate(today) % entries.length] ?? null
  return { total: entries.length, entry }
}

// Lấy n từ ngẫu nhiên cho một lượt luyện Flashcard — dùng `sample` chung (Fisher–Yates một
// phần, không sửa gốc) thay bản chép tay cũ (audit 2026-10-20, F-004).
export async function fetchRandomEntries(n = 30): Promise<DictEntry[]> {
  const entries = await loadDictionary()
  return sample(entries, n)
}
