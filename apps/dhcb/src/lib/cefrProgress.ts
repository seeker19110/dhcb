// ──────────────────────────────────────────────────────────────────────
// TIẾN ĐỘ LỘ TRÌNH CEFR
//
// Gom toàn bộ logic tính tiến độ cho lộ trình A1→B2 (tab Lộ trình + trang
// riêng từng cấp) vào 1 chỗ, để UI chỉ gọi hàm thay vì tự lắp ráp:
//   - Đánh dấu BÀI NGỮ PHÁP đã học xong (nút "Đã học xong" trong bài).
//   - Đánh dấu HỘI THOẠI đã xem (tự ghi khi mở) và ĐÃ HỌC (đạt kiểm tra hiểu sau khi xem).
//   - Đếm tiến độ từ vựng / ngữ pháp theo unit + theo cấp.
//   - Luật mở khóa cấp (A1 luôn mở; cấp sau cần ≥70% từ vựng cấp trước).
//   - Tìm "mục học tiếp theo" (vòng từ vựng / bài ngữ pháp đầu tiên chưa xong).
//
// Dữ liệu lưu localStorage theo từng user (giống vocab.ts) và ĐỒNG BỘ lên
// Supabase qua bảng learning_progress — cột cefr_grammar / cefr_dialogues
// (migration 0007, xem lib/progressSync.ts).
// ──────────────────────────────────────────────────────────────────────

import type { CefrLevel, CefrUnit } from '../data/cefr'
import type { Circle } from '../data/curriculum'
import { UNLOCK_PCT } from '@dhcb/core-learner/unlockThreshold'
import { pushProgress } from './progressSync'
import { addGrammarToSRS } from './srs'

// Ngưỡng mở khóa cấp tiếp theo: thuộc ≥70% từ vựng của cấp trước.
// Con số nằm ở `@dhcb/core-learner/unlockThreshold` — DÙNG CHUNG với luật mở bậc môn Lập trình
// (GĐ3, 2026-09-12) để cả nền tảng chỉ có MỘT ngưỡng, đổi một chỗ là đổi hết.
export { UNLOCK_PCT }

const GRAMMAR_KEY = (uid: string) => `et_cefr_grammar_${uid}`
const DIALOGUE_KEY = (uid: string) => `et_cefr_dialogue_${uid}`

// Đọc 1 Set chuỗi từ localStorage (hỏng/thiếu → Set rỗng).
function readSet(key: string): Set<string> {
  try {
    const raw = localStorage.getItem(key)
    const arr = raw ? (JSON.parse(raw) as unknown) : []
    return new Set(Array.isArray(arr) ? (arr as string[]) : [])
  } catch {
    return new Set()
  }
}

function writeSet(key: string, set: Set<string>) {
  localStorage.setItem(key, JSON.stringify([...set]))
}

// ── Bài ngữ pháp đã học xong ────────────────────────────────────────────
export function getDoneGrammar(uid: string): Set<string> {
  return readSet(GRAMMAR_KEY(uid))
}

export function markGrammarDone(uid: string, lessonId: string) {
  const set = getDoneGrammar(uid)
  set.add(lessonId)
  writeSet(GRAMMAR_KEY(uid), set)
  addGrammarToSRS(uid, lessonId) // vào vòng ôn lặp (đề xuất E) — xem lib/srs.ts
  pushProgress(uid) // đồng bộ lên Supabase
}

// LƯU Ý (2026-08-13): server giờ hợp nhất cefrGrammar kiểu UNION (chỉ tăng, không giảm — xem
// api/_lib/progressMerge.ts) để tiến độ không mất khi dùng nhiều thiết bị. Hệ quả: bỏ đánh dấu
// ở ĐÂY chỉ có tác dụng TẠM trên máy này — lần đồng bộ sau (máy khác vẫn còn bản "đã học") sẽ
// tự thêm lại bài này vào danh sách đã học. Đánh đổi đã xác nhận với người dùng.
export function unmarkGrammarDone(uid: string, lessonId: string) {
  const set = getDoneGrammar(uid)
  set.delete(lessonId)
  writeSet(GRAMMAR_KEY(uid), set)
  pushProgress(uid) // đồng bộ lên Supabase
}

export function isGrammarDone(uid: string, lessonId: string): boolean {
  return getDoneGrammar(uid).has(lessonId)
}

// ── Hội thoại: đã xem → đã học ──────────────────────────────────────────
// Hội thoại không có id riêng → khóa = "<id unit/vòng>:<titleEn>" (ổn định).
export const dialogueKey = (ownerId: string, titleEn: string) => `${ownerId}:${titleEn}`

// "ĐÃ HỌC" (đạt kiểm tra hiểu — lib/dialogueComprehension.ts) lưu CHUNG mảng với "đã xem"
// (`et_cefr_dialogue_<uid>` ↔ cột `cefr_dialogues`), phân biệt bằng tiền tố. Lý do (đặc tả
// docs/specs/2026-10-09-hoi-thoai-cefr-bang-chung-da-hoc.md §③): luồng đồng bộ hiện có hợp nhất
// mảng này kiểu UNION ở cả client lẫn server — bản ghi mới đi theo mà KHÔNG cần migration, và
// client cũ chưa biết tiền tố vẫn giữ nguyên (không xoá) khi đẩy lại. Id unit/vòng không bao giờ
// bắt đầu bằng tiền tố này (test canh trên dữ liệu thật).
export const DIALOGUE_LEARNED_PREFIX = 'learned|'

/** Hội thoại ĐÃ XEM (khoá `dialogueKey`). Không gồm bản ghi "đã học" có tiền tố. */
export function getViewedDialogues(uid: string): Set<string> {
  const out = new Set<string>()
  for (const entry of readSet(DIALOGUE_KEY(uid))) {
    if (!entry.startsWith(DIALOGUE_LEARNED_PREFIX)) out.add(entry)
  }
  return out
}

/** Hội thoại ĐÃ HỌC (đạt kiểm tra hiểu), trả về đúng khoá `dialogueKey` (đã bỏ tiền tố). */
export function getLearnedDialogues(uid: string): Set<string> {
  const out = new Set<string>()
  for (const entry of readSet(DIALOGUE_KEY(uid))) {
    if (entry.startsWith(DIALOGUE_LEARNED_PREFIX)) {
      out.add(entry.slice(DIALOGUE_LEARNED_PREFIX.length))
    }
  }
  return out
}

export function markDialogueViewed(uid: string, ownerId: string, titleEn: string) {
  const set = readSet(DIALOGUE_KEY(uid))
  const key = dialogueKey(ownerId, titleEn)
  if (set.has(key)) return // đã xem rồi — khỏi ghi lại + khỏi đẩy mạng thừa
  set.add(key)
  writeSet(DIALOGUE_KEY(uid), set)
  pushProgress(uid) // đồng bộ lên server
}

/**
 * Ghi "ĐÃ HỌC" — CHỈ gọi sau khi người học ĐẠT kiểm tra hiểu (`gradeComprehension().passed`).
 * Đã học thì chắc chắn đã xem: ghi luôn cả khoá "đã xem" (phòng khi màn mở bằng đường khác).
 * Dữ liệu "đã xem" cũ KHÔNG bao giờ tự được nâng thành "đã học".
 */
export function markDialogueLearned(uid: string, ownerId: string, titleEn: string) {
  const set = readSet(DIALOGUE_KEY(uid))
  const key = dialogueKey(ownerId, titleEn)
  const learnedEntry = `${DIALOGUE_LEARNED_PREFIX}${key}`
  if (set.has(key) && set.has(learnedEntry)) return // đã ghi rồi — idempotent
  set.add(key)
  set.add(learnedEntry)
  writeSet(DIALOGUE_KEY(uid), set)
  pushProgress(uid) // đồng bộ lên server
}

// ── Đếm tiến độ ─────────────────────────────────────────────────────────
export interface Counts {
  done: number
  total: number
}

// Số từ đã thuộc trong 1 vòng — so cả nguyên dạng lẫn chữ thường
// (learned đọc từ vocab.ts đã lowercase, nhưng giữ kiểm tra kép cho an toàn).
export function circleDoneCount(circle: Circle, learned: Set<string>): number {
  return circle.words.filter((w) => learned.has(w.word) || learned.has(w.word.toLowerCase())).length
}

// Từ vựng của 1 unit (cộng các vòng liên kết).
export function unitVocabCounts(
  unit: CefrUnit,
  byId: Record<string, Circle>,
  learned: Set<string>,
): Counts {
  let done = 0
  let total = 0
  for (const id of unit.vocabCircleIds) {
    const c = byId[id]
    if (!c) continue
    total += c.words.length
    done += circleDoneCount(c, learned)
  }
  return { done, total }
}

// Từ vựng của cả cấp.
export function levelVocabCounts(
  level: CefrLevel,
  byId: Record<string, Circle>,
  learned: Set<string>,
): Counts {
  return level.units.reduce(
    (acc, u) => {
      const c = unitVocabCounts(u, byId, learned)
      return { done: acc.done + c.done, total: acc.total + c.total }
    },
    { done: 0, total: 0 },
  )
}

// Ngữ pháp của 1 unit / cả cấp (done = số bài đã đánh dấu học xong).
export function unitGrammarCounts(unit: CefrUnit, doneGrammar: Set<string>): Counts {
  return {
    done: unit.grammar.filter((g) => doneGrammar.has(g.id)).length,
    total: unit.grammar.length,
  }
}

export function levelGrammarCounts(level: CefrLevel, doneGrammar: Set<string>): Counts {
  return level.units.reduce(
    (acc, u) => {
      const c = unitGrammarCounts(u, doneGrammar)
      return { done: acc.done + c.done, total: acc.total + c.total }
    },
    { done: 0, total: 0 },
  )
}

// ── Điều kiện DỰ THI cuối cấp ────────────────────────────────────────────
// Đã học đủ để được thi: ≥70% từ vựng (UNLOCK_PCT) VÀ 100% ngữ pháp của cấp.
// (Trước đây đây CHÍNH là điều kiện tự mở khóa cấp sau; nay chỉ để bật nút "Thi
// cuối cấp" — cấp sau mở khóa khi THI ĐẠT, xem computeLockedMap.)
export function isExamEligible(
  level: CefrLevel,
  byId: Record<string, Circle>,
  learned: Set<string>,
  doneGrammar: Set<string>,
): boolean {
  const vocab = levelVocabCounts(level, byId, learned)
  const grammar = levelGrammarCounts(level, doneGrammar)
  const vocabOk = vocab.total === 0 || vocab.done / vocab.total >= UNLOCK_PCT
  const grammarOk = grammar.total === 0 || grammar.done === grammar.total
  return vocabOk && grammarOk
}

// ── Khóa cấp ────────────────────────────────────────────────────────────
// A1 luôn mở; cấp sau bị khóa cho tới khi THI ĐẠT bài thi cuối cấp TRƯỚC
// (examPassed = tập id cấp đã thi đạt, xem lib/cefrExam.ts getPassedExamLevels).
// Người dùng đã mở khóa từ trước (grandfather) được giữ ở computeLockedMapPersisted.
export function computeLockedMap(
  levels: CefrLevel[],
  examPassed: Set<string>,
): Map<CefrLevel['id'], boolean> {
  const map = new Map<CefrLevel['id'], boolean>()
  levels.forEach((l, idx) => {
    const prev = idx > 0 ? levels[idx - 1] : undefined
    map.set(l.id, prev ? !examPassed.has(prev.id) : false)
  })
  return map
}

// ── Quyền mở cấp: SERVER là nguồn sự thật (GĐ2a, 2026-09-12) ────────────
// Đặc tả: docs/specs/2026-09-12-gd2-vip-hoc-tu-do-mon-anh.md
//
// TRƯỚC ĐÂY client tự tính tập cấp đã mở rồi GHI vào `et_cefr_unlocked_*` và đẩy lên server —
// server ghi hộ mà không kiểm chứng. Ai sửa localStorage (hoặc POST thẳng /api/progress) là mở
// được mọi cấp. Nay việc tính nằm ở server (`apps/server/src/api/core/progress.ts`, dùng chung
// hàm thuần `@dhcb/core-learner/cefrUnlock`), client CHỈ ĐỌC danh sách server trả về.
//
// `et_cefr_unlocked_*` từ đây là BỘ ĐỆM ĐỌC của danh sách server (progressSync.ts ghi khi kéo/đẩy
// tiến độ), không còn là lời khai của client. Grandfather cho người dùng cũ đã chuyển sang cột DB
// `cefr_unlocked_grandfathered` (migration 0077) nên KHÔNG ai mất quyền đã có.
const UNLOCKED_KEY = (uid: string) => `et_cefr_unlocked_${uid}`

/** Danh sách cấp server cho phép, đọc từ bộ đệm. Rỗng = chưa đồng bộ lần nào. */
export function getUnlockedLevels(uid: string): Set<string> {
  return readSet(UNLOCKED_KEY(uid))
}

/**
 * Bản đồ khoá cấp để HIỂN THỊ. Nguồn chính là danh sách server; chưa có bộ đệm (lần đầu mở app,
 * đang offline) thì tạm dùng luật sống tính từ kết quả thi trên máy — chỉ là hiển thị lạc quan,
 * server vẫn cưỡng chế thật nên đoán sai cũng không cấp thêm quyền gì.
 *
 * THUẦN: không ghi localStorage, không gọi mạng — gọi được trong render/useMemo.
 */
export function computeLockedMapFromServer(
  uid: string,
  levels: CefrLevel[],
  examPassed: Set<string>,
): Map<CefrLevel['id'], boolean> {
  const serverUnlocked = getUnlockedLevels(uid)
  if (serverUnlocked.size === 0) return computeLockedMap(levels, examPassed)
  const result = new Map<CefrLevel['id'], boolean>()
  for (const l of levels) result.set(l.id, !serverUnlocked.has(l.id))
  return result
}

// ── Mục học tiếp theo trong 1 cấp ───────────────────────────────────────
// Duyệt unit theo thứ tự; TRONG mỗi unit XEN KẼ từ vựng ↔ ngữ pháp (vòng 1 →
// bài 1 → vòng 2 → bài 2 …) thay vì bắt xong 100% từ vựng mới tới ngữ pháp —
// đúng nguyên tắc interleaving (trộn dạng bài giữ chú ý tốt hơn học 1 dạng kéo
// dài, xem docs/research/cai-tien-lo-trinh-hoc.md mục V5). Hết loại nào (vòng
// hoặc bài) thì tiếp tục loại còn lại. Hội thoại không bắt buộc nên không tính.
// CHỈ đổi thứ tự gợi ý — không đổi dữ liệu/ngưỡng "xong vòng" (vẫn 100%).
export interface NextStep {
  unitIndex: number
  unit: CefrUnit
  kind: 'vocab' | 'grammar'
  circleId?: string
  lessonId?: string
}

export function findNextStep(
  level: CefrLevel,
  byId: Record<string, Circle>,
  learned: Set<string>,
  doneGrammar: Set<string>,
): NextStep | null {
  for (let i = 0; i < level.units.length; i++) {
    const unit = level.units[i]
    if (!unit) continue
    const maxLen = Math.max(unit.vocabCircleIds.length, unit.grammar.length)
    for (let j = 0; j < maxLen; j++) {
      const circleId = unit.vocabCircleIds[j]
      if (circleId != null) {
        const c = byId[circleId]
        if (c && circleDoneCount(c, learned) < c.words.length) {
          return { unitIndex: i, unit, kind: 'vocab', circleId }
        }
      }
      const g = unit.grammar[j]
      if (g && !doneGrammar.has(g.id)) {
        return { unitIndex: i, unit, kind: 'grammar', lessonId: g.id }
      }
    }
  }
  return null
}
