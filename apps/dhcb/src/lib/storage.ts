import type {
  User,
  ChatSession,
  WritingSubmission,
  SpeakingSession,
  DailyUsage,
  Direction,
} from '../types'
// Mỗi lần lưu xuống localStorage, ta cũng đẩy bản ghi lên Supabase (bắn rồi quên)
import { pushChatSession, pushWritingSub, pushSpeakingSession, pushLearnDay } from './cloud'
import { vnDateStr, daysBetween } from './date'

// ─── Keys ────────────────────────────────────────────────────────────────────
const K = {
  currentUser: 'et_current_user',
  users: 'et_users',
  chatSessions: (uid: string) => `et_chat_${uid}`,
  writingSubs: (uid: string) => `et_writing_${uid}`,
  speakingSessions: (uid: string) => `et_speaking_${uid}`,
  usage: (uid: string, date: string) => `et_usage_${uid}_${date}`,
}

// ── Mốc thời gian cài đặt cá nhân đổi gần nhất — dùng để đồng bộ đa thiết bị (settings
// blob trong learning_progress, xem lib/progressSync.ts) theo kiểu "mới hơn thắng", giống
// placement/weeklyGoal. Mọi setter cài đặt (ngôn ngữ giao diện, chiều học, âm thanh, giọng
// đọc TTS) PHẢI gọi hàm này khi đổi giá trị.
const SETTINGS_UPDATED_AT_KEY = 'et_settings_updated_at'

export function touchSettingsUpdated(): void {
  try {
    localStorage.setItem(SETTINGS_UPDATED_AT_KEY, new Date().toISOString())
  } catch {
    /* localStorage đầy/bị chặn — bỏ qua, chỉ là mốc thời gian phụ */
  }
}

export function getSettingsUpdatedAt(): string {
  try {
    return localStorage.getItem(SETTINGS_UPDATED_AT_KEY) ?? ''
  } catch {
    return ''
  }
}

export function setSettingsUpdatedAt(iso: string): void {
  try {
    localStorage.setItem(SETTINGS_UPDATED_AT_KEY, iso)
  } catch {
    /* ignore */
  }
}

function get<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

// Ghi localStorage AN TOÀN: bắt lỗi (đầy bộ nhớ / chế độ riêng tư của Safari) để
// không làm crash luồng lưu chat/viết/nói. Dữ liệu thật vẫn được đồng bộ lên Supabase
// (pushChatSession/...), nên lỗi cache cục bộ không làm mất dữ liệu.
function set<T>(key: string, val: T): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(val))
    return true
  } catch (err) {
    console.warn('[storage] không ghi được localStorage (bỏ qua, vẫn đồng bộ cloud):', err)
    return false
  }
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
// LƯU Ý BẢO MẬT: hashPassword() và verifyPassword() đã bị XÓA vì dùng btoa()
// (base64 — không phải hashing thật, có thể đảo ngược dễ dàng).
// Xác thực thật sự được xử lý qua Supabase Auth (src/lib/auth.ts).
// Các hàm register/login/logout bên dưới chỉ còn dùng để quản lý localStorage guest user.

export function register(email: string, name: string, _password: string): User | null {
  void _password // không còn dùng — giữ lại tham số để không phải sửa nơi gọi
  const users = get<(User & { pwHash?: string })[]>(K.users) ?? []
  if (users.find((u) => u.email === email)) return null // email đã tồn tại
  const user: User = {
    id: crypto.randomUUID(),
    email,
    name,
    plan: 'free',
    onboarded: false,
    createdAt: Date.now(),
  }
  users.push({ ...user })
  set(K.users, users)
  set(K.currentUser, user)
  return user
}

export function login(email: string, _password: string): User | null {
  void _password // không còn dùng — giữ lại tham số để không phải sửa nơi gọi
  // Tìm theo email — không còn kiểm tra password vì storage.ts không dùng cho auth thật
  // (auth thật dùng Supabase — xem src/lib/auth.ts)
  const users = get<(User & { pwHash?: string })[]>(K.users) ?? []
  const found = users.find((u) => u.email === email)
  if (!found) return null
  const { pwHash: _pw, ...user } = found
  void _pw
  set(K.currentUser, user)
  return user
}

export function logout() {
  localStorage.removeItem(K.currentUser)
}

export function getCurrentUser(): User | null {
  return get<User>(K.currentUser)
}

// ─── Chat ─────────────────────────────────────────────────────────────────────
export function getChatSessions(userId: string): ChatSession[] {
  return get<ChatSession[]>(K.chatSessions(userId)) ?? []
}

export function saveChatSession(session: ChatSession) {
  const all = getChatSessions(session.userId)
  const idx = all.findIndex((s) => s.id === session.id)
  if (idx >= 0) all[idx] = session
  else all.unshift(session)
  set(K.chatSessions(session.userId), all)
  pushChatSession(session) // đồng bộ lên Supabase
}

// ─── Writing ──────────────────────────────────────────────────────────────────
export function getWritingSubs(userId: string): WritingSubmission[] {
  return get<WritingSubmission[]>(K.writingSubs(userId)) ?? []
}

export function saveWritingSub(sub: WritingSubmission) {
  const all = getWritingSubs(sub.userId)
  const idx = all.findIndex((s) => s.id === sub.id)
  if (idx >= 0) all[idx] = sub
  else all.unshift(sub)
  set(K.writingSubs(sub.userId), all)
  pushWritingSub(sub) // đồng bộ lên Supabase
}

// ─── Speaking ─────────────────────────────────────────────────────────────────
export function getSpeakingSessions(userId: string): SpeakingSession[] {
  return get<SpeakingSession[]>(K.speakingSessions(userId)) ?? []
}

export function saveSpeakingSession(session: SpeakingSession) {
  const all = getSpeakingSessions(session.userId)
  const idx = all.findIndex((s) => s.id === session.id)
  if (idx >= 0) all[idx] = session
  else all.unshift(session)
  set(K.speakingSessions(session.userId), all)
  pushSpeakingSession(session) // đồng bộ lên Supabase
}

// ─── Usage ────────────────────────────────────────────────────────────────────
function todayStr() {
  return vnDateStr()
}

export function getUsage(userId: string): DailyUsage {
  const date = todayStr()
  const u = get<DailyUsage>(K.usage(userId, date)) ?? {
    date,
    chatCount: 0,
    writingCount: 0,
    speakingCount: 0,
    sttCount: 0,
    pronounceCount: 0,
    learnCount: 0,
  }
  // Bản local cũ có thể thiếu sttCount/pronounceCount/learnCount (lưu trước khi thêm tính
  // năng) — bù mặc định.
  if (u.sttCount == null) u.sttCount = 0
  if (u.pronounceCount == null) u.pronounceCount = 0
  if (u.learnCount == null) u.learnCount = 0
  return u
}

// Tăng lượt CHỈ ở localStorage để giao diện phản hồi tức thì. Số lượt THẬT do SERVER
// đếm authoritative (api/_lib/usage.ts) trong daily_usage; khi mở trang, pullUserData
// kéo số chính xác từ Supabase về ghi đè bản local — nên client KHÔNG đẩy lượt nữa
// (tránh đếm trùng / bị sửa localStorage để gian lận giới hạn).
export function incrementUsage(
  userId: string,
  field: 'chatCount' | 'writingCount' | 'speakingCount' | 'sttCount' | 'pronounceCount',
) {
  const usage = getUsage(userId)
  usage[field]++
  set(K.usage(userId, todayStr()), usage)
}

// Ghi nhận "đã học từ vựng hôm nay" để tính chuỗi ngày liên tiếp (streak).
// Khác incrementUsage: việc học từ KHÔNG tốn API và KHÔNG do server đếm tự động,
// nên ở đây client vừa lưu local vừa CHỦ ĐỘNG đẩy lên Supabase (daily_usage.learn_count)
// để đổi máy / xoá cache vẫn giữ được streak (đồng bộ cả server và client).
export function markStudiedToday(userId: string) {
  const usage = getUsage(userId)
  usage.learnCount = (usage.learnCount ?? 0) + 1
  set(K.usage(userId, todayStr()), usage)
  pushLearnDay(userId, usage.date, usage.learnCount) // đồng bộ lên server (chỉ cột learn_count)
}

// ─── Direction (chiều học) ────────────────────────────────────────────────────
const DIRECTION_KEY = 'et_direction'

export function getDirection(): Direction {
  return (localStorage.getItem(DIRECTION_KEY) as Direction) ?? 'A'
}

export function setDirection(dir: Direction) {
  localStorage.setItem(DIRECTION_KEY, dir)
  touchSettingsUpdated()
}

// ─── Streak ───────────────────────────────────────────────────────────────────
// Tính số ngày liên tiếp có học (streak) — tối đa 365 ngày.
// "Có học" = bất kỳ hoạt động nào trong ngày: chat / viết / nói / STT / HỌC TỪ VỰNG.
// Dữ liệu đọc từ localStorage (đã được pullUserData đồng bộ từ Supabase tối đa 365 ngày),
// nên streak nhất quán giữa các máy.
const STREAK_MAX_DAYS = 365

function hasActivityOn(usage: DailyUsage | null): boolean {
  if (!usage) return false
  const total =
    usage.chatCount +
    usage.writingCount +
    usage.speakingCount +
    (usage.sttCount ?? 0) +
    (usage.pronounceCount ?? 0) +
    (usage.learnCount ?? 0)
  return total > 0
}

// ── Vé nghỉ streak (streak freeze) — V2, docs/research/cai-tien-lo-trinh-hoc.md ────────
// 1 "vé nghỉ"/tuần: ngày đầu tiên bị bỏ lỡ trong 1 tuần KHÔNG làm đứt streak (cơ chế đã
// được chứng minh giảm churn 21% — Duolingo). [Cập nhật 2026-08-13] Đã đồng bộ đa thiết bị
// qua `learning_progress.streak_freeze_dates` (union, xem lib/progressSync.ts) — không còn
// chỉ lưu cục bộ.
const STREAK_FREEZE_KEY = (uid: string) => `et_streak_freeze_${uid}`
const STREAK_FREEZE_COOLDOWN_DAYS = 7 // tối thiểu số ngày giữa 2 lần dùng vé (~1 vé/tuần)

function getStreakFreezeDates(userId: string): string[] {
  return get<string[]>(STREAK_FREEZE_KEY(userId)) ?? []
}

// Đọc/ghi trực tiếp (đồng bộ đa thiết bị — lib/progressSync.ts) — union với dữ liệu server.
export function getStreakFreezeDatesForSync(userId: string): string[] {
  return getStreakFreezeDates(userId)
}

export function setStreakFreezeDatesFromSync(userId: string, dates: string[]): void {
  set(STREAK_FREEZE_KEY(userId), dates)
}

// Số ngày giữa 2 chuỗi "yyyy-mm-dd" (luôn dương) — dùng helper dùng chung `date.ts`.
function daysBetweenDateStr(a: string, b: string): number {
  return Math.abs(daysBetween(a, b))
}

// Hôm nay đã có hoạt động học nào chưa (chat/viết/nói/STT/học từ) — dùng cho
// trạng thái ô streak ở Trang chủ ("giữ chuỗi hôm nay" vs "đã giữ ✓").
export function hasStudiedToday(userId: string): boolean {
  return hasActivityOn(get<DailyUsage>(K.usage(userId, todayStr())))
}

// Đã từng có ÍT NHẤT MỘT ngày học (chat/viết/nói/STT/phát âm/học từ) chưa — dùng cho điều kiện
// "đã học ≥ 1 phiên" của tải ngầm dữ liệu ngoại tuyến (lib/offlineDownload.ts, audit M14). Quét
// mọi khoá `et_usage_<uid>_*` thay vì lùi từng ngày: không giới hạn khung thời gian, và dữ liệu
// pullUserData kéo về từ server (tối đa 365 ngày) cũng được tính → đổi máy vẫn đúng.
const USAGE_DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export function hasEverStudied(userId: string): boolean {
  if (!userId) return false
  const prefix = K.usage(userId, '')
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      // Phần sau tiền tố phải đúng là ngày — tránh khớp nhầm khoá của uid khác dài hơn
      // (vd uid "a" với khoá của uid "a_b").
      if (!key?.startsWith(prefix) || !USAGE_DATE_RE.test(key.slice(prefix.length))) continue
      if (hasActivityOn(get<DailyUsage>(key))) return true
    }
  } catch {
    /* localStorage bị chặn — coi như chưa học */
  }
  return false
}

// Số ngày kể từ lần hoạt động gần nhất (② M4, luồng "quay lại sau khi bỏ bẵng" —
// docs/research/dac-ta-nang-cap-su-pham-2026-07-15.md). 0 = đã học hôm nay.
// null = không tìm thấy hoạt động nào trong `maxLookback` ngày gần đây (người
// dùng MỚI chưa từng học, hoặc đã vắng quá lâu để khung "chào mừng quay lại"
// còn phù hợp) — nơi gọi coi null là "không hiện luồng quay lại".
export function daysSinceLastActivity(userId: string, maxLookback = 60): number | null {
  const today = new Date()
  for (let i = 0; i <= maxLookback; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    if (hasActivityOn(get<DailyUsage>(K.usage(userId, vnDateStr(d))))) return i
  }
  return null
}

// ── Khoảnh khắc streak (V-2, docs/research/cai-tien-trai-nghiem-hoc-2026-07-11.md) ──
// Màn ăn mừng "🔥 Streak +1" chỉ hiện MỖI NGÀY 1 LẦN (lần đầu hoàn thành bài trong
// ngày). Ghi ngày (giờ VN) đã ăn mừng gần nhất để idempotent — reload/học thêm batch
// trong cùng ngày không bắn lặp.
const STREAK_CELEBRATED_KEY = (uid: string) => `et_streak_celebrated_${uid}`

export function shouldCelebrateStreak(userId: string): boolean {
  if (!hasStudiedToday(userId)) return false
  return localStorage.getItem(STREAK_CELEBRATED_KEY(userId)) !== todayStr()
}

export function markStreakCelebrated(userId: string) {
  localStorage.setItem(STREAK_CELEBRATED_KEY(userId), todayStr())
}

export function getStreak(userId: string): number {
  const freezeDates = getStreakFreezeDates(userId)
  let newFreezeDate: string | null = null
  let streak = 0
  const today = new Date()
  for (let i = 0; i < STREAK_MAX_DAYS; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const dateStr = vnDateStr(d)
    const usage = get<DailyUsage>(K.usage(userId, dateStr))
    if (hasActivityOn(usage)) {
      streak++
      continue
    }
    if (i === 0) continue // hôm nay chưa học: cho qua, kiểm tra hôm qua xem streak còn không

    // Ngày này KHÔNG có hoạt động — thử bắc cầu bằng vé nghỉ trước khi chịu đứt streak.
    const alreadyFrozen = freezeDates.includes(dateStr)
    const candidates = newFreezeDate ? [...freezeDates, newFreezeDate] : freezeDates
    const usedRecently = candidates.some(
      (f) => daysBetweenDateStr(f, dateStr) < STREAK_FREEZE_COOLDOWN_DAYS,
    )
    if (alreadyFrozen || !usedRecently) {
      if (!alreadyFrozen) newFreezeDate = dateStr // ghi nhớ để lưu lại sau vòng lặp
      continue // bắc cầu qua ngày nghỉ — streak không đứt (không cộng thêm cho ngày này)
    }
    break // hết vé (đã dùng trong 7 ngày gần đây) → streak đứt ở đây như cũ
  }
  if (newFreezeDate) {
    set(STREAK_FREEZE_KEY(userId), [...freezeDates, newFreezeDate])
  }
  return Math.min(streak, STREAK_MAX_DAYS)
}
