// apps/server/src/api/_lib/companionToolkit.ts — Phần phụ thuộc server TIÊM vào chế độ tác tử
// của Bạn Đồng Hành (GĐ3, `docs/specs/2026-10-12-ban-dong-hanh-gd3-tac-tu-cong-cu.md`).
//
// Gói `core-personal` không được import gói môn học (`subject-english`), nên hàm tra từ điển được
// dựng ở đây rồi truyền vào runtime. Công tắc lùi: `COMPANION_TOOLS=off` ⇒ không truyền toolkit,
// Companion chạy y hệt GĐ2b (planner từ khoá, không công cụ).
import type { CompanionAgentToolkit } from '@dhcb/core-personal/companionRuntime'
import type { DictionaryHit } from '@dhcb/core-personal/companionTools'
import {
  getAllEntries,
  searchDictionaryEntries,
  type DictEntry,
} from '@dhcb/subject-english/dictionaryData'

function toHit(e: DictEntry): DictionaryHit {
  return {
    word: e.word,
    pos: e.pos,
    vi: e.vi,
    ...(e.ex_en ? { exampleEn: e.ex_en } : {}),
    ...(e.ex_vi ? { exampleVi: e.ex_vi } : {}),
    ...(e.ipa_en ? { ipa: e.ipa_en } : {}),
    ...(e.level ? { level: e.level } : {}),
  }
}

/** Tra từ điển: từ trùng KHỚP ĐÚNG lên đầu, rồi tới thứ tự của `/api/dictionary`. */
export function lookupDictionary(word: string, limit: number): DictionaryHit[] {
  const query = word.trim().toLowerCase()
  if (!query) return []
  const matches = searchDictionaryEntries(getAllEntries(), query)
  const exact = matches.filter((e) => e.word.toLowerCase() === query)
  const rest = matches.filter((e) => e.word.toLowerCase() !== query)
  return [...exact, ...rest].slice(0, limit).map(toHit)
}

/** Toolkit cho lượt này — `undefined` khi công tắc lùi đang bật. */
export function getCompanionToolkit(): CompanionAgentToolkit | undefined {
  if (process.env.COMPANION_TOOLS === 'off') return undefined
  return { lookupDictionary }
}
