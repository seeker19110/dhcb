// ──────────────────────────────────────────────────────────────────────
// LOGIC LỘ TRÌNH HỌC
//
// Ghép phần NỀN TẢNG (src/data/curriculum.ts) với phần MỞ RỘNG tự động
// (các từ còn lại trong dictionary.json) thành 1 lộ trình phẳng, có thứ tự.
//
// THỨ TỰ HỌC = THEO CẤP CEFR: các vòng nền tảng xếp theo đúng thứ tự
// xuất hiện trong lộ trình A1→B2 (src/data/cefr.ts) — học hết từ vựng A1
// mới sang A2… — rồi mới tới phần mở rộng từ từ điển.
//
//   - getLearningPath(): toàn bộ chuỗi từ theo thứ tự học.
//   - getCircles():       chuỗi đó nhưng gom theo "vòng tròn" (chủ đề / cụm mở rộng).
//   - getTodayBatch():    lấy 20 từ KẾ TIẾP chưa thuộc (mục tiêu mỗi ngày).
//   - daily counter:      đếm số từ đã học trong ngày (mục tiêu 20/ngày).
//   - random queue:       hàng đợi ôn tập ngẫu nhiên KHÔNG lặp trong 1 vòng.
// ──────────────────────────────────────────────────────────────────────

import type { DictEntry, AgeGroup } from '../types'
import type { Circle } from '../data/curriculum'
import type { CefrLevel } from '../data/cefr'
import { loadDictionary } from '../data/dictionary/loader'
import { loadFoundation } from '../data/curriculumLoader'
import { vnDateStr } from './date'
import { loadCefr } from '../data/cefrLoader'
import { getLearnedCount } from './vocab'

// Kích thước cụm "Mở rộng" khi gom phần từ vựng ngoài nền tảng (thuần cấu trúc dữ
// liệu, KHÔNG phải tốc độ học của người dùng — xem getDailySpeed() bên dưới).
export const DAILY_GOAL = 20

// ── Tốc độ học: cho chọn 5/10/20 từ/ngày (mặc định mới 10) ─────────────
// Người dùng MỚI (chưa có từ nào đã thuộc) mặc định 10 — trong khuyến nghị
// 10–20 từ/ngày, dễ đạt mục tiêu mỗi ngày hơn 20. Người dùng ĐÃ HỌC (có tiến độ
// trước khi tính năng này ra mắt) giữ nguyên 20 để không đổi trải nghiệm đột ngột.
export type DailySpeed = 5 | 10 | 20
export const DAILY_SPEEDS: DailySpeed[] = [5, 10, 20]
const NEW_USER_DEFAULT_SPEED: DailySpeed = 10
const EXISTING_USER_DEFAULT_SPEED: DailySpeed = 20
const SPEED_KEY = (uid: string) => `et_speed_${uid}`

export function getDailySpeed(uid: string): DailySpeed {
  try {
    const raw = localStorage.getItem(SPEED_KEY(uid))
    const n = raw ? Number(raw) : NaN
    if (n === 5 || n === 10 || n === 20) return n
  } catch {
    /* localStorage không khả dụng → dùng mặc định bên dưới */
  }
  return getLearnedCount(uid) > 0 ? EXISTING_USER_DEFAULT_SPEED : NEW_USER_DEFAULT_SPEED
}

export function setDailySpeed(uid: string, speed: DailySpeed): void {
  localStorage.setItem(SPEED_KEY(uid), String(speed))
}

// Trần từ/ngày theo tốc độ đã chọn: 5 batch × tốc độ (công thức cũ, chỉ đổi từ
// DAILY_GOAL cố định sang tốc độ của từng người).
export function getDailyMax(uid: string): number {
  return getDailySpeed(uid) * 5
}

// Dữ liệu từ điển — KHÔNG import tĩnh nữa (file ~2MB). Nạp ĐỘNG bằng
// dynamic import() qua loadCurriculum() để Vite tách dictionary.json thành
// chunk riêng, không nằm trong bundle tải lần đầu.
// ENTRIES rỗng cho tới khi nạp xong → phải await loadCurriculum() trước khi
// gọi các hàm bên dưới (xem Learn.tsx / Dictionary.tsx).
let ENTRIES: DictEntry[] = []
let FOUNDATION: Circle[] = []
// Thứ tự vòng từ vựng theo lộ trình CEFR (id vòng, đã khử trùng) + cấp của từng vòng.
let CEFR_CIRCLE_ORDER: string[] = []
let CIRCLE_LEVEL: Record<string, CefrLevel['id']> = {}

// Promise nạp — cache lại để chỉ tải MỘT lần dù được gọi từ nhiều nơi.
let _loadPromise: Promise<void> | null = null

// Gọi (await) một lần trước khi dùng getCircles/getLearningPath/getTodayBatch...
export function loadCurriculum(): Promise<void> {
  if (!_loadPromise) {
    const promise = Promise.all([loadDictionary(), loadFoundation(), loadCefr()]).then(
      ([entries, foundation, levels]) => {
        ENTRIES = entries
        FOUNDATION = foundation
        // Ghi lại thứ tự vòng theo A1→B2 (1 vòng có thể được nhắc ở 2 cấp —
        // giữ lần xuất hiện ĐẦU, tức cấp thấp nhất cần nó).
        CEFR_CIRCLE_ORDER = []
        CIRCLE_LEVEL = {}
        for (const lv of levels) {
          for (const u of lv.units) {
            for (const id of u.vocabCircleIds) {
              if (!(id in CIRCLE_LEVEL)) {
                CIRCLE_LEVEL[id] = lv.id
                CEFR_CIRCLE_ORDER.push(id)
              }
            }
          }
        }
      },
    )
    _loadPromise = promise
    void promise.catch(() => {
      if (_loadPromise === promise) _loadPromise = null
    })
  }
  return _loadPromise
}

// Cấp CEFR của 1 vòng từ vựng (null với vòng mở rộng "extra-*").
export function getCefrLevelOfCircle(circleId: string): CefrLevel['id'] | null {
  return CIRCLE_LEVEL[circleId] ?? null
}

// Đã nạp xong dữ liệu từ điển chưa (dùng để khởi tạo state "ready" ở UI).
export function isCurriculumReady(): boolean {
  return ENTRIES.length > 0
}

// Khóa nhận diện 1 từ (không phân biệt hoa/thường) để so trùng giữa
// phần nền tảng và từ điển.
export const wordKey = (word: string) => word.trim().toLowerCase()

// So sánh 2 từ theo hạng tần suất (freq tăng dần: số nhỏ = thông dụng hơn, học
// trước) — đúng luật Zipf (2.000-2.800 từ thông dụng nhất phủ ~90% văn bản
// thường gặp). Từ CHƯA CÓ freq (scripts/assign-word-freq.ts chưa điền) xếp SAU
// CÙNG; Array.prototype.sort ổn định (ES2019+) nên thứ tự gốc giữ nguyên giữa
// các từ cùng thiếu freq — không random, không đổi kết quả giữa các lần build.
export function compareByFreq(a: DictEntry, b: DictEntry): number {
  if (a.freq == null && b.freq == null) return 0
  if (a.freq == null) return 1
  if (b.freq == null) return -1
  return a.freq - b.freq
}

// ── Xây dựng các vòng MỞ RỘNG từ dictionary (memo hóa theo nhóm tuổi) ───
// Chỉ 'nhi_dong' lọc khác — mọi giá trị khác (kể cả undefined) dùng CHUNG 1 cache
// 'default' để không tốn thêm bộ nhớ/tính toán cho các nhóm không lọc gì.
function circleCacheKey(ageGroup?: AgeGroup): 'nhi_dong' | 'default' {
  return ageGroup === 'nhi_dong' ? 'nhi_dong' : 'default'
}
const _circlesCache = new Map<'nhi_dong' | 'default', Circle[]>()

export function getCircles(ageGroup?: AgeGroup): Circle[] {
  const cacheKey = circleCacheKey(ageGroup)
  const cached = _circlesCache.get(cacheKey)
  if (cached) return cached

  // Xếp các vòng nền tảng THEO THỨ TỰ CEFR (A1→B2). Vòng nào không nằm trong
  // lộ trình CEFR (phòng hờ dữ liệu lệch) giữ nguyên thứ tự gốc, xếp sau cùng.
  // Nhóm Nhi đồng: ẨN HẲN các vòng gắn `notForKids` (GĐ 4, PROGRESS.md 2026-07-22).
  const foundation = cacheKey === 'nhi_dong' ? FOUNDATION.filter((c) => !c.notForKids) : FOUNDATION
  const byId = new Map(foundation.map((c) => [c.id, c]))
  const inCefr = CEFR_CIRCLE_ORDER.map((id) => byId.get(id)).filter((c): c is Circle => c != null)
  const referenced = new Set(CEFR_CIRCLE_ORDER)
  const rest0 = foundation.filter((c) => !referenced.has(c.id))
  const orderedFoundation = [...inCefr, ...rest0]

  // Tập các từ đã có trong phần nền tảng → loại khỏi phần mở rộng để khỏi trùng.
  // CHỦ Ý dùng FOUNDATION đầy đủ (không phải `foundation` đã lọc) — từ của vòng bị ẩn
  // vẫn không được lọt vào phần "Mở rộng" (tránh học lại đúng từ đó qua đường khác,
  // và giữ đúng ý định "ẩn hẳn khỏi luồng học" chứ không phải "chuyển sang chỗ khác").
  const foundationKeys = new Set<string>()
  FOUNDATION.forEach((c) => c.words.forEach((w) => foundationKeys.add(wordKey(w.word))))

  // Các từ còn lại trong từ điển làm phần mở rộng — sắp theo TẦN SUẤT thay vì
  // alphabet (xem compareByFreq bên dưới), đúng luật Zipf.
  const rest = ENTRIES.filter((e) => !foundationKeys.has(wordKey(e.word))).sort(compareByFreq)

  // Gom phần mở rộng thành các cụm DAILY_GOAL từ → mỗi cụm là 1 "vòng"
  const extra: Circle[] = []
  for (let i = 0; i < rest.length; i += DAILY_GOAL) {
    const words = rest.slice(i, i + DAILY_GOAL)
    const n = extra.length + 1
    extra.push({
      id: `extra-${n}`,
      titleVi: `Mở rộng ${n}`,
      titleEn: `Set ${n}`,
      emoji: '📚',
      words,
      sentences: [], // phần mở rộng dùng câu ví dụ sẵn trong từng từ
    })
  }

  const result = [...orderedFoundation, ...extra]
  _circlesCache.set(cacheKey, result)
  return result
}

// ── Lộ trình phẳng (mảng từ theo thứ tự học) ──────────────────────────
const _pathCache = new Map<'nhi_dong' | 'default', DictEntry[]>()

export function getLearningPath(ageGroup?: AgeGroup): DictEntry[] {
  const cacheKey = circleCacheKey(ageGroup)
  const cached = _pathCache.get(cacheKey)
  if (cached) return cached
  // Khử trùng theo key (vd: chữ cái "I" và đại từ "I") — giữ lần xuất hiện đầu,
  // để mỗi từ chỉ học 1 lần và đếm tiến độ không bị lệch.
  const seen = new Set<string>()
  const result = getCircles(ageGroup)
    .flatMap((c) => c.words)
    .filter((w) => {
      const k = wordKey(w.word)
      if (seen.has(k)) return false
      seen.add(k)
      return true
    })
  _pathCache.set(cacheKey, result)
  return result
}

// Vòng (chủ đề) chứa 1 từ — để hiển thị tên chủ đề đang học. KHÔNG cần tham số
// ageGroup: chỉ tra cứu metadata của 1 từ ĐÃ CÓ trong lộ trình học của người gọi
// (nếu là Nhi đồng thì từ đó chắc chắn không thuộc vòng bị ẩn) — dùng danh sách
// đầy đủ (mặc định) để tra là đủ, không ảnh hưởng nội dung hiển thị.
export function findCircleOfWord(word: string): Circle | undefined {
  const k = wordKey(word)
  return getCircles().find((c) => c.words.some((w) => wordKey(w.word) === k))
}

// ── Từ vựng theo CẤP CEFR (cho các tab học trong /learning-path/a1…b2) ──
// Duyệt getCircles() theo đúng thứ tự học và khử trùng theo wordKey GIỐNG
// getLearningPath (giữ lần xuất hiện ĐẦU) → mỗi từ chỉ thuộc đúng 1 cấp,
// tổng từ của 4 cấp + phần ngoài CEFR = đúng lộ trình phẳng.
function collectPathWords(
  belongs: (circleId: string) => boolean,
  ageGroup?: AgeGroup,
): DictEntry[] {
  const seen = new Set<string>()
  const out: DictEntry[] = []
  for (const c of getCircles(ageGroup)) {
    const keep = belongs(c.id)
    for (const w of c.words) {
      const k = wordKey(w.word)
      if (seen.has(k)) continue
      seen.add(k)
      if (keep) out.push(w)
    }
  }
  return out
}

// Từ vựng của 1 cấp CEFR, theo thứ tự học trong lộ trình.
export function getLevelWords(levelId: CefrLevel['id'], ageGroup?: AgeGroup): DictEntry[] {
  return collectPathWords((id) => CIRCLE_LEVEL[id] === levelId, ageGroup)
}

// Từ NGOÀI lộ trình CEFR (vòng nền tảng lẻ + cụm "Mở rộng" từ từ điển) —
// trang cấp CUỐI (B2) học tiếp phần này sau khi thuộc hết từ của cấp.
export function getBeyondCefrWords(ageGroup?: AgeGroup): DictEntry[] {
  return collectPathWords((id) => !(id in CIRCLE_LEVEL), ageGroup)
}

// ── Mục tiêu hôm nay: 20 từ KẾ TIẾP chưa thuộc ─────────────────────────
// Bản tổng quát: lấy từ 1 danh sách bất kỳ (pool = từ của 1 cấp, hoặc cả lộ trình).
// `defer`: từ bị bấm "Để sau" hôm nay (xem getSkippedToday) — HOÃN xuống cuối hàng đợi
// trong ngày thay vì loại hẳn. Trước đây "Để sau" không ghi lại gì nên batch kế tiếp lấy
// đúng N từ CHƯA thuộc đầu tiên theo thứ tự pool — từ vừa bấm "Để sau" (vẫn chưa thuộc)
// lại đứng đầu danh sách đó, quay lại ngay vị trí số 1 (audit toàn diện 2026-08-23).
export function getTodayBatchFrom(
  pool: DictEntry[],
  learned: Set<string>,
  size = DAILY_GOAL,
  defer?: Set<string>,
): DictEntry[] {
  const batch: DictEntry[] = []
  const deferred: DictEntry[] = []
  for (const e of pool) {
    if (learned.has(wordKey(e.word)) || learned.has(e.word)) continue
    if (defer?.has(wordKey(e.word))) {
      deferred.push(e)
      continue
    }
    if (batch.length < size) batch.push(e)
  }
  for (const e of deferred) {
    if (batch.length >= size) break
    batch.push(e)
  }
  return batch
}

export function getTodayBatch(
  learned: Set<string>,
  size = DAILY_GOAL,
  ageGroup?: AgeGroup,
): DictEntry[] {
  return getTodayBatchFrom(getLearningPath(ageGroup), learned, size)
}

// Tiến độ đã thuộc bao nhiêu / tổng của 1 danh sách từ bất kỳ (1 cấp, hoặc cả lộ trình).
export function getPoolProgress(
  pool: DictEntry[],
  learned: Set<string>,
): { done: number; total: number } {
  let done = 0
  for (const e of pool) {
    if (learned.has(wordKey(e.word)) || learned.has(e.word)) done++
  }
  return { done, total: pool.length }
}

// Tiến độ tổng: đã thuộc bao nhiêu / tổng lộ trình
export function getPathProgress(
  learned: Set<string>,
  ageGroup?: AgeGroup,
): { done: number; total: number } {
  return getPoolProgress(getLearningPath(ageGroup), learned)
}

// ── Bộ đếm "học trong ngày" (mục tiêu 20/ngày) ────────────────────────
const DAILY_KEY = (uid: string) => `et_learn_daily_${uid}`
const todayStr = vnDateStr

export function getDailyLearned(uid: string): number {
  try {
    const raw = localStorage.getItem(DAILY_KEY(uid))
    if (!raw) return 0
    const obj = JSON.parse(raw) as { date: string; count: number }
    return obj.date === todayStr() ? obj.count : 0
  } catch {
    return 0
  }
}

// Tiến độ của 1 vòng cụ thể (dùng để hiển thị "15/20" bên cạnh tên chủ đề)
export function getCircleProgress(
  circleId: string,
  learned: Set<string>,
): { done: number; total: number } {
  const circle = getCircles().find((c) => c.id === circleId)
  if (!circle) return { done: 0, total: 0 }
  let done = 0
  for (const w of circle.words) {
    if (learned.has(wordKey(w.word)) || learned.has(w.word)) done++
  }
  return { done, total: circle.words.length }
}

// Tăng bộ đếm ngày (gọi khi đánh dấu 1 từ MỚI là đã thuộc trong phần lộ trình)
export function bumpDailyLearned(uid: string): number {
  const cur = getDailyLearned(uid)
  const next = cur + 1
  localStorage.setItem(DAILY_KEY(uid), JSON.stringify({ date: todayStr(), count: next }))
  return next
}

// ── Từ bị bấm "Để sau" trong ngày — dùng làm `defer` cho getTodayBatchFrom ───────
const SKIPPED_KEY = (uid: string) => `et_skipped_daily_${uid}`

export function getSkippedToday(uid: string): Set<string> {
  try {
    const raw = localStorage.getItem(SKIPPED_KEY(uid))
    if (!raw) return new Set()
    const obj = JSON.parse(raw) as { date: string; words: string[] }
    return obj.date === todayStr() ? new Set(obj.words) : new Set()
  } catch {
    return new Set()
  }
}

export function addSkippedToday(uid: string, word: string): void {
  const current = getSkippedToday(uid)
  current.add(wordKey(word))
  localStorage.setItem(SKIPPED_KEY(uid), JSON.stringify({ date: todayStr(), words: [...current] }))
}

// ── Số lần pass quiz để mở batch mới trong ngày ──────────────────────────
const QUIZ_PASS_KEY = (uid: string) => `et_quiz_pass_${uid}`

export function getDailyQuizPasses(uid: string): number {
  try {
    const raw = localStorage.getItem(QUIZ_PASS_KEY(uid))
    if (!raw) return 0
    const obj = JSON.parse(raw) as { date: string; passes: number }
    return obj.date === todayStr() ? obj.passes : 0
  } catch {
    return 0
  }
}

export function bumpDailyQuizPasses(uid: string): number {
  const cur = getDailyQuizPasses(uid)
  const next = cur + 1
  localStorage.setItem(QUIZ_PASS_KEY(uid), JSON.stringify({ date: todayStr(), passes: next }))
  return next
}

// Số từ được phép học hôm nay: tốc độ đã chọn × (quizPasses + 1), tối đa getDailyMax(uid)
export function getDailyAllowance(uid: string): number {
  const speed = getDailySpeed(uid)
  return Math.min(speed * (getDailyQuizPasses(uid) + 1), speed * 5)
}

// ── Ngưỡng "đạt" bài kiểm tra ──────────────────────────────────────────
// DÙNG CHUNG cho mọi bài kiểm tra mở từ mới trong app (mini-quiz mở batch ở tab
// "Hôm nay" VÀ quiz tổng hợp ở tab "Kiểm tra" — StudyTabs.tsx) để nhất quán:
// đạt ≥ ngưỡng này ở bài nào cũng tính là 1 lần "pass" (bumpDailyQuizPasses).
export const QUIZ_PASS_THRESHOLD_PCT = 90

// Số câu SAI tối đa vẫn tính "đạt" — tối thiểu LUÔN là 1, dù batch nhỏ tới đâu. Trước đây
// dùng thẳng % nên quiz càng ít câu càng khắt: tốc độ 5 từ/ngày (mặc định người mới) hay
// comeback (3 từ) phải đúng TUYỆT ĐỐI 100% mới đạt — đúng nhóm người mới/vừa quay lại sau
// khi bỏ bẵng lại rơi vào bài "khó nhất", ngược hẳn ý đồ "phiên nhẹ nhàng hơn" của luồng
// comeback (audit toàn diện 2026-08-23). Từ 10 câu trở lên, hành vi giữ nguyên như cũ.
export function isQuizPass(score: number, total: number): boolean {
  if (total <= 0) return false
  const wrong = total - score
  const maxWrongAllowed = Math.max(1, Math.floor((total * (100 - QUIZ_PASS_THRESHOLD_PCT)) / 100))
  return wrong <= maxWrongAllowed
}
