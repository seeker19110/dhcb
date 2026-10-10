// progressSync.ts — Đồng bộ TIẾN ĐỘ HỌC lên Supabase để không mất khi đổi máy.
//
// Trước đây từ đã thuộc (et_learned_*), từ khó (et_hard_*) và lịch ôn SRS (srs_*)
// CHỈ nằm trong localStorage → đổi điện thoại/xoá cache là mất sạch, mất động lực.
// Module này đẩy/kéo các dữ liệu đó qua bảng `learning_progress` (RLS theo user).
// Từ migration 0007 đồng bộ thêm tiến độ lộ trình CEFR: bài ngữ pháp đã học xong
// (et_cefr_grammar_*) + hội thoại đã xem (et_cefr_dialogue_*) — xem lib/cefrProgress.ts.
//
// localStorage vẫn là bộ đệm đọc nhanh + chạy offline. Khi kéo về, ta HỢP NHẤT
// (không ghi đè mất dữ liệu): learned/hard/cefr_* lấy hợp (union), SRS giữ thẻ tiến bộ hơn.
//
// NGUY CƠ MẤT DỮ LIỆU ĐÃ SỬA (điều tra "mất dữ liệu học tập admin"): pushProgress() đọc
// TOÀN BỘ localStorage rồi gửi đè lên server — nếu máy/tab này VỪA mở app (localStorage
// còn rỗng/cũ) và người dùng bấm học 1 từ NGAY trước khi pullProgress() (chạy lúc mở app,
// xem lib/useCloudSync.ts) kéo + hợp nhất xong, pushProgress() sẽ gửi lên bản RỖNG/CŨ —
// server nhận được ghi vào, xoá mất dữ liệu thật đã lưu trước đó. Sửa bằng cách bắt MỌI
// lượt gọi pushProgress() CHỜ lượt pullProgress() đang chạy (nếu có) xong trước khi đọc
// localStorage để gửi — khi đó localStorage đã chắc chắn là bản đã hợp nhất đầy đủ.

import { getAuthHeader } from '@core/authHeader'
import { isGuestId } from '@core/guestId'
import { getPendingOfflineReviews, clearPendingOfflineReviews } from './offlineSrsStore'
import {
  enqueue as enqueueSync,
  flush as flushSync,
  getSyncVersion,
  setSyncVersion,
  registerKindHandler,
} from './syncOutbox'
import {
  getSettingsUpdatedAt,
  setSettingsUpdatedAt,
  getStreakFreezeDatesForSync,
  setStreakFreezeDatesFromSync,
} from './storage'
import { readLocalArray } from './localJson'

const LEARNED = (uid: string) => `et_learned_${uid}`
const HARD = (uid: string) => `et_hard_${uid}`
const SRS = (uid: string) => `srs_${uid}`
// PHẢI khớp key trong lib/cefrProgress.ts (GRAMMAR_KEY/DIALOGUE_KEY/UNLOCKED_KEY).
const CEFR_GRAMMAR = (uid: string) => `et_cefr_grammar_${uid}`
const CEFR_DIALOGUE = (uid: string) => `et_cefr_dialogue_${uid}`
// GĐ2a (2026-09-12): key này giờ là BỘ ĐỆM ĐỌC danh sách cấp do SERVER cấp, không phải dữ liệu
// client tự khai — ta chỉ GHI XUỐNG từ response, không bao giờ GỬI LÊN nữa (xem cefrProgress.ts).
const CEFR_UNLOCKED = (uid: string) => `et_cefr_unlocked_${uid}`
// Kết quả bài thi cuối cấp (map levelId → {passed,bestPct,attempts,lastAt}) —
// migration 0009. Khớp key trong lib/cefrExam.ts (EXAM_KEY).
const CEFR_EXAMS = (uid: string) => `et_cefr_exams_${uid}`
// Kết quả bài test xếp lớp gần nhất ({cefr,appLevel,lastAt}) — migration 0011.
// Khớp key trong lib/placementResult.ts (KEY).
const PLACEMENT = (uid: string) => `et_placement_${uid}`
// Mục tiêu tuần ({goal,updatedAt}) — migration 0012. Khớp key lib/weeklyGoal.ts (KEY).
const WEEKLY_GOAL = (uid: string) => `et_weekly_goal_${uid}`
// Huy hiệu đã đạt (mảng id) — migration 0013. Khớp key lib/achievements.ts (KEY).
const ACHIEVEMENTS = (uid: string) => `et_achievements_${uid}`

// Cài đặt cá nhân (KHÔNG phải tiến độ "chỉ tăng" — hợp nhất theo mốc updatedAt MỚI HƠN
// thắng, xem touchSettingsUpdated ở storage.ts). Các key này là TOÀN CỤC (không theo uid) vì
// người dùng có thể chỉnh trước khi đăng nhập — migration 0040. Phải khớp key thật ở
// lib/uiLang.ts (KEY), lib/storage.ts (DIRECTION_KEY), lib/sound.ts (SOUND_KEY),
// lib/tts.ts (VOICE_KEY/RANDOM_KEY/NATIVE_VOICE_KEY/NATIVE_VOICE_ON_KEY).
const SETTINGS_KEYS = {
  uiLang: 'ui_lang',
  direction: 'et_direction',
  soundEnabled: 'ui_sound_enabled',
  voicePref: 'tts_voice',
  voiceRandomPref: 'tts_voice_random',
  nativeVoiceOn: 'tts_voice_native_on',
  nativeVoicePref: 'tts_voice_native',
} as const

interface SettingsBlob {
  uiLang?: string
  direction?: string
  soundEnabled?: string
  voicePref?: string
  voiceRandomPref?: string
  nativeVoiceOn?: string
  nativeVoicePref?: string
  updatedAt?: string
}

function readSettingsBlob(): SettingsBlob {
  const blob: SettingsBlob = { updatedAt: getSettingsUpdatedAt() }
  for (const [field, key] of Object.entries(SETTINGS_KEYS)) {
    const v = localStorage.getItem(key)
    if (v !== null) (blob as Record<string, string>)[field] = v
  }
  return blob
}

function applySettingsBlob(blob: SettingsBlob): void {
  for (const [field, key] of Object.entries(SETTINGS_KEYS)) {
    const v = (blob as Record<string, string | undefined>)[field]
    if (v !== undefined) localStorage.setItem(key, v)
  }
  if (blob.updatedAt) setSettingsUpdatedAt(blob.updatedAt)
}

// Cấu trúc 1 thẻ SRS (khớp src/lib/srs.ts) — chỉ cần để merge theo số lần ôn (reps).
interface SRSLike {
  interval: number
  ease: number
  due: number
  reps: number
}

// Cấu trúc 1 kết quả thi cuối cấp (khớp src/lib/cefrExam.ts ExamResult).
interface ExamResultLike {
  passed: boolean
  bestPct: number
  attempts: number
  lastAt: string
}

// Cấu trúc kết quả placement (khớp src/lib/placementResult.ts PlacementSaved).
interface PlacementLike {
  cefr: string
  appLevel: string
  lastAt: string
}

function readPlacement(key: string): PlacementLike | null {
  try {
    const r = localStorage.getItem(key)
    if (!r) return null
    const obj = JSON.parse(r) as unknown
    if (obj && typeof obj === 'object' && 'lastAt' in obj) return obj as PlacementLike
    return null
  } catch {
    return null
  }
}

// Hợp nhất: giữ bản có lastAt MỚI HƠN (placement là "chụp trình độ tại thời điểm
// thi", không có khái niệm tốt/xấu như điểm thi cuối cấp).
function mergePlacement(
  local: PlacementLike | null,
  cloud: PlacementLike | null,
): PlacementLike | null {
  if (!local) return cloud
  if (!cloud) return local
  return (local.lastAt ?? '') >= (cloud.lastAt ?? '') ? local : cloud
}

// Cấu trúc mục tiêu tuần (khớp src/lib/weeklyGoal.ts WeeklyGoalSaved).
interface WeeklyGoalLike {
  goal: number
  updatedAt: string
}

function readWeeklyGoal(key: string): WeeklyGoalLike | null {
  try {
    const r = localStorage.getItem(key)
    if (!r) return null
    const obj = JSON.parse(r) as unknown
    if (obj && typeof obj === 'object' && 'updatedAt' in obj) return obj as WeeklyGoalLike
    return null
  } catch {
    return null
  }
}

// Hợp nhất: bản có updatedAt MỚI HƠN thắng (đây là lựa chọn cài đặt của người
// dùng — không có khái niệm "tốt lên", giống placement).
function mergeWeeklyGoal(
  local: WeeklyGoalLike | null,
  cloud: WeeklyGoalLike | null,
): WeeklyGoalLike | null {
  if (!local) return cloud
  if (!cloud) return local
  return (local.updatedAt ?? '') >= (cloud.updatedAt ?? '') ? local : cloud
}

function readExamMap(key: string): Record<string, ExamResultLike> {
  try {
    const r = localStorage.getItem(key)
    const obj = r ? (JSON.parse(r) as unknown) : {}
    return obj && typeof obj === 'object' ? (obj as Record<string, ExamResultLike>) : {}
  } catch {
    return {}
  }
}

// Hợp nhất kết quả thi 2 nguồn: dữ liệu chỉ "tốt lên" — passed = OR, bestPct =
// max, attempts = max, lastAt = mới hơn.
function mergeExamMaps(
  a: Record<string, ExamResultLike>,
  b: Record<string, ExamResultLike>,
): Record<string, ExamResultLike> {
  const out: Record<string, ExamResultLike> = {}
  for (const key of new Set([...Object.keys(a), ...Object.keys(b)])) {
    const x = a[key]
    const y = b[key]
    if (!x) {
      if (y) out[key] = y
      continue
    }
    if (!y) {
      out[key] = x
      continue
    }
    out[key] = {
      passed: x.passed || y.passed,
      bestPct: Math.max(x.bestPct ?? 0, y.bestPct ?? 0),
      attempts: Math.max(x.attempts ?? 0, y.attempts ?? 0),
      lastAt: (x.lastAt ?? '') >= (y.lastAt ?? '') ? x.lastAt : y.lastAt,
    }
  }
  return out
}

function readArr(key: string): string[] {
  return readLocalArray<string>(key)
}

function readObj(key: string): Record<string, SRSLike> {
  try {
    const r = localStorage.getItem(key)
    const obj = r ? (JSON.parse(r) as unknown) : {}
    return obj && typeof obj === 'object' ? (obj as Record<string, SRSLike>) : {}
  } catch {
    return {}
  }
}

// Đọc localStorage HIỆN TẠI và dựng THÂN REQUEST gửi lên server.
//
// S09-2: việc GỬI không còn nằm ở đây nữa — nó đi qua hàng đợi `syncOutbox` (debounce 1,5 giây,
// gộp nhiều thay đổi thành một request, gửi lại có backoff khi mạng/server lỗi). Hàm này chỉ
// CHỤP localStorage ĐÚNG LÚC GỬI (không phải lúc xếp hàng) — đúng tinh thần guard `pullInFlight`:
// bản gửi đi luôn là bản đã hợp nhất mới nhất, không bao giờ là bản rỗng lúc app vừa mở.
function buildProgressBody(userId: string, attemptId: string): Record<string, unknown> {
  return {
    learned: readArr(LEARNED(userId)),
    hard: readArr(HARD(userId)),
    srs: readObj(SRS(userId)),
    cefrGrammar: readArr(CEFR_GRAMMAR(userId)),
    cefrDialogues: readArr(CEFR_DIALOGUE(userId)),
    // CỐ Ý KHÔNG gửi `cefrUnlocked`: server tự tính quyền mở cấp (GĐ2a) và bỏ qua nếu có.
    cefrExams: readExamMap(CEFR_EXAMS(userId)),
    placement: readPlacement(PLACEMENT(userId)) ?? {},
    weeklyGoal: readWeeklyGoal(WEEKLY_GOAL(userId)) ?? {},
    achievements: readArr(ACHIEVEMENTS(userId)),
    settings: readSettingsBlob(),
    streakFreezeDates: getStreakFreezeDatesForSync(userId),
    // Phong bì đồng bộ S09-1: `attemptId` để server nhận ra lần gửi lại (không cộng thưởng hai
    // lần), `baseVersion` để server biết có thiết bị khác ghi chen vào giữa hay không.
    sync: {
      attemptId,
      baseVersion: getSyncVersion(userId),
      clientUpdatedAt: new Date().toISOString(),
    },
  }
}

// Response của POST /api/progress sau S09-1.
interface ProgressPostResult {
  cefrUnlocked?: unknown
  version?: unknown
  conflict?: unknown
  replayed?: unknown
  merged?: CloudProgressDoc
}

// Xử lý response khi server đã nhận bản chụp.
async function onProgressPushed(userId: string, body: unknown): Promise<void> {
  const res = (body ?? {}) as ProgressPostResult
  // Server trả kèm danh sách cấp nó vừa tính → cập nhật bộ đệm NGAY, để vừa thi đạt là cấp
  // sau mở ra mà không phải chờ lượt pullProgress kế tiếp.
  try {
    if (Array.isArray(res.cefrUnlocked))
      localStorage.setItem(CEFR_UNLOCKED(userId), JSON.stringify(res.cefrUnlocked))
  } catch {
    /* response không phải JSON / hết dung lượng — bỏ qua, lượt pull sau sẽ đồng bộ lại */
  }
  // Thiết bị khác đã ghi chen vào giữa: server trả BẢN GỘP đầy đủ. Áp bản đó xuống localStorage
  // bằng ĐÚNG đường hợp nhất của `doPull` (không viết luật merge thứ hai ở client) — vì mọi
  // trường đều là union/"tốt hơn thắng" nên giao diện chỉ có thể NHIỀU THÊM, không bao giờ lùi.
  if (res.conflict === true && res.merged && typeof res.merged === 'object') {
    applyCloudProgress(userId, res.merged)
    notifyProgressApplied()
  }
  // Server cũ (chưa deploy S09-1) không trả `version` → coi như "không hỗ trợ version", vẫn tính
  // là gửi thành công, chỉ không ghi version (client tiếp tục gửi baseVersion cũ).
  if (typeof res.version === 'number') setSyncVersion(userId, res.version)
  // Đẩy thành công → xoá hàng chờ review offline
  const pendingReviews = await getPendingOfflineReviews(userId)
  const ids = pendingReviews.map((r) => r.id!).filter(Boolean)
  if (ids.length > 0) await clearPendingOfflineReviews(userId, ids)
}

// Người nghe "vừa áp bản gộp từ server" — `useCloudSync` đăng ký để tăng `version` của nó, nhờ
// vậy mọi `useMemo` đọc localStorage tính lại (nếu không, giao diện vẫn vẽ số cũ).
const appliedListeners = new Set<() => void>()

export function onProgressApplied(cb: () => void): () => void {
  appliedListeners.add(cb)
  return () => {
    appliedListeners.delete(cb)
  }
}

function notifyProgressApplied(): void {
  for (const cb of appliedListeners) {
    try {
      cb()
    } catch {
      /* một người nghe lỗi không chặn người còn lại */
    }
  }
}

// Đăng ký cách gửi tài liệu tiến độ môn Anh cho hàng đợi dùng chung.
registerKindHandler('english', {
  // Chờ lượt pull đang chạy xong rồi mới chụp localStorage (chống ghi đè bản rỗng — xem đầu file).
  beforeSend: async (uid) => {
    const pulling = pullInFlight.get(uid)
    if (pulling) await pulling.catch(() => undefined)
  },
  buildRequest: (uid, entry) => ({
    url: '/api/progress',
    body: buildProgressBody(uid, entry.attemptId),
  }),
  onSuccess: (uid, _entry, body) => onProgressPushed(uid, body),
})

// Lượt pullProgress() ĐANG CHẠY cho từng user (nếu có) — pushProgressAsync() phải chờ lượt
// này xong rồi mới đọc localStorage để gửi, tránh gửi bản CŨ/RỖNG đè lên dữ liệu thật vừa
// kéo về (xem giải thích đầu file). Dùng Map thay biến đơn vì nhiều user/tab có thể đồng
// thời đăng nhập (hiếm nhưng an toàn hơn không đáng gì thêm phức tạp).
const pullInFlight = new Map<string, Promise<void>>()

// Bản CÓ THỂ AWAIT — dùng khi nơi gọi cần chắc chắn server đã nhận dữ liệu mới TRƯỚC khi làm
// bước tiếp theo (vd claim nhiệm vụ "thi đạt cấp CEFR", server tự đọc lại DB để xác minh, xem
// src/components/CefrExam.tsx). pushProgress() (bên dưới) vẫn giữ dạng bắn-rồi-quên cho mọi
// nơi gọi khác không cần chờ.
export async function pushProgressAsync(userId: string): Promise<void> {
  if (!userId) return
  // KHÁCH VÃNG LAI: tiến độ chỉ sống trong localStorage. Gọi lên server chỉ tạo 401 rác và
  // không bao giờ thành công (không có phiên). Xem lib/guestProgress.ts — tiến độ được hợp
  // nhất lên tài khoản ĐÚNG MỘT LẦN, ngay lúc đăng nhập/đăng ký.
  if (isGuestId(userId)) return
  enqueueSync(userId, 'english')
  // `flush` tay BỎ QUA debounce và chỉ resolve sau khi server đã nhận — `CefrExam.tsx` claim
  // nhiệm vụ "thi đạt cấp" ngay sau đó nên bắt buộc phải chờ thật.
  await flushSync(userId)
}

// Đẩy toàn bộ tiến độ hiện tại lên server (bắn rồi quên — không chặn giao diện).
// S09-2: chỉ XẾP HÀNG; hàng đợi gộp mọi thay đổi trong 1,5 giây kế tiếp thành MỘT request. Một
// phiên ôn 40 thẻ SRS vì vậy tốn ≤ 2 request thay vì 40 (và không còn chạm hạn mức 30/phút).
// Giai đoạn C: gọi POST /api/progress thay Supabase client trực tiếp (không còn RLS
// bảo vệ sau khi cutover khỏi Supabase Auth ở Giai đoạn B).
export function pushProgress(userId: string): void {
  if (!userId || isGuestId(userId)) return
  enqueueSync(userId, 'english')
}

// Kéo tiến độ từ server → HỢP NHẤT với bản local → ghi lại localStorage → đẩy bản
// hợp nhất lên (để mọi máy hội tụ). Lỗi mạng bị nuốt — vẫn dùng bản local.
//
// Đăng ký vào pullInFlight NGAY KHI BẮT ĐẦU (trước khi await gì) để pushProgressAsync() gọi
// đồng thời (do người dùng bấm học 1 từ ngay lúc app vừa mở) THẤY được lượt pull này và chờ
// đúng lúc, không đọc localStorage khi nó còn rỗng/cũ.
export function pullProgress(userId: string): Promise<void> {
  if (!userId) return Promise.resolve()
  if (isGuestId(userId)) return Promise.resolve() // khách: không có gì trên server để kéo về
  const existing = pullInFlight.get(userId)
  if (existing) return existing
  const p = doPull(userId)
    .finally(() => {
      pullInFlight.delete(userId)
    })
    // Gửi bản đã hợp nhất lên (để mọi máy hội tụ) SAU KHI lượt pull đã kết thúc — nếu gọi trong
    // `doPull` thì hàng đợi sẽ chờ chính lượt pull này (`beforeSend`) và treo mãi.
    .then(() => {
      void flushSync(userId)
    })
  pullInFlight.set(userId, p)
  return p
}

async function doPull(userId: string): Promise<void> {
  let data: unknown
  try {
    const resp = await fetch('/api/progress', { headers: getAuthHeader() })
    if (!resp.ok) return
    data = await resp.json()
  } catch {
    return
  }
  if (!data) return

  const cloud = data as CloudProgressDoc
  // Ghi nhớ version server để lần POST sau gửi kèm `baseVersion` đúng (S09-1). GET của server cũ
  // không có trường này — bỏ qua, client vẫn chạy như trước.
  if (typeof cloud.version === 'number') setSyncVersion(userId, cloud.version)

  applyCloudProgress(userId, cloud)
}

/** Hình dạng tài liệu tiến độ server trả về (GET, và `merged` khi xung đột). */
export interface CloudProgressDoc {
  learned?: string[]
  hard?: string[]
  srs?: Record<string, SRSLike>
  cefrGrammar?: string[]
  cefrDialogues?: string[]
  cefrUnlocked?: string[]
  cefrExams?: Record<string, ExamResultLike>
  placement?: PlacementLike
  weeklyGoal?: WeeklyGoalLike
  achievements?: string[]
  settings?: SettingsBlob
  streakFreezeDates?: string[]
  version?: number
}

/**
 * Hợp nhất bản server vào localStorage theo luật domain đã chốt (union / "tốt hơn thắng" /
 * "mốc mới hơn thắng") rồi ghi xuống.
 *
 * Dùng chung cho HAI đường: lượt kéo định kỳ (`doPull`) và bản gộp `merged` server trả về khi
 * phát hiện thiết bị khác đã ghi chen vào giữa (S09-1 `conflict: true`). Chỉ có MỘT nơi viết
 * luật hợp nhất ở client — thêm nơi thứ hai là mở đường cho hai bên lệch nhau.
 */
// Có phần tử nào của `localArr` mà `cloudArr` CHƯA CÓ không? — dùng để biết máy này đang giữ
// dữ liệu mới hơn server, tức là hợp nhất xong THẬT SỰ cần đẩy lên (khác trường hợp server đã
// có sẵn mọi thứ, hợp nhất ra y hệt bản cloud → không có gì để gửi).
function hasExtra(localArr: string[], cloudArr: string[] | undefined): boolean {
  if (localArr.length === 0) return false
  const cloudSet = new Set(cloudArr ?? [])
  return localArr.some((x) => !cloudSet.has(x))
}

function applyCloudProgress(userId: string, cloud: CloudProgressDoc): void {
  // learned/hard/cefr_*: dữ liệu chỉ tăng dần → lấy hợp của local và cloud
  const localLearned = readArr(LEARNED(userId))
  const localHard = readArr(HARD(userId))
  const localCefrGrammar = readArr(CEFR_GRAMMAR(userId))
  const localCefrDialogues = readArr(CEFR_DIALOGUE(userId))
  const learned = new Set<string>([...localLearned, ...(cloud.learned ?? [])])
  const hard = new Set<string>([...localHard, ...(cloud.hard ?? [])])
  const cefrGrammar = new Set<string>([...localCefrGrammar, ...(cloud.cefrGrammar ?? [])])
  const cefrDialogues = new Set<string>([...localCefrDialogues, ...(cloud.cefrDialogues ?? [])])
  // Có dữ liệu mới cần đẩy lên hay không — bắt đầu bằng bốn tập hợp trên, các nhánh dưới
  // (SRS/achievements/placement/weeklyGoal/settings/streakFreezeDates) tự cộng dồn thêm.
  let changed =
    hasExtra(localLearned, cloud.learned) ||
    hasExtra(localHard, cloud.hard) ||
    hasExtra(localCefrGrammar, cloud.cefrGrammar) ||
    hasExtra(localCefrDialogues, cloud.cefrDialogues)
  // cefrUnlocked: KHÔNG hợp nhất với bản local nữa — server là nguồn sự thật duy nhất (GĐ2a),
  // lấy union sẽ giữ lại đúng những cấp giả mạo/hết hạn mà server vừa gỡ.
  const cefrUnlocked = cloud.cefrUnlocked ?? []
  const localAchievements = readArr(ACHIEVEMENTS(userId))
  const achievements = new Set<string>([...localAchievements, ...(cloud.achievements ?? [])])
  changed = changed || hasExtra(localAchievements, cloud.achievements)

  // cefr_exams: hợp nhất theo cấp, giữ kết quả "tốt hơn" (xem mergeExamMaps).
  const localCefrExams = readExamMap(CEFR_EXAMS(userId))
  const cefrExams = mergeExamMaps(localCefrExams, cloud.cefrExams ?? {})
  changed = changed || JSON.stringify(cefrExams) !== JSON.stringify(cloud.cefrExams ?? {})

  // placement: hợp nhất theo lastAt mới hơn (cloud.placement rỗng '{}' khi chưa
  // từng thi → không có lastAt → coi như null).
  const cloudPlacement = cloud.placement && 'lastAt' in cloud.placement ? cloud.placement : null
  const placement = mergePlacement(readPlacement(PLACEMENT(userId)), cloudPlacement)
  changed = changed || placement !== cloudPlacement

  // weekly_goal: hợp nhất theo updatedAt mới hơn (cloud rỗng '{}' khi chưa từng
  // chỉnh → không có updatedAt → coi như null).
  const cloudWeeklyGoal =
    cloud.weeklyGoal && 'updatedAt' in cloud.weeklyGoal ? cloud.weeklyGoal : null
  const weeklyGoal = mergeWeeklyGoal(readWeeklyGoal(WEEKLY_GOAL(userId)), cloudWeeklyGoal)
  changed = changed || weeklyGoal !== cloudWeeklyGoal

  // settings: mốc updatedAt MỚI HƠN thắng (giống placement/weeklyGoal — đây là "lựa chọn hiện
  // tại", không phải tiến độ chỉ tăng).
  const localSettings = readSettingsBlob()
  const cloudSettings = cloud.settings ?? {}
  const settings =
    (cloudSettings.updatedAt ?? '') > (localSettings.updatedAt ?? '')
      ? cloudSettings
      : localSettings
  // `readSettingsBlob()` luôn trả `updatedAt: ''` (chuỗi rỗng, không phải `undefined`) khi
  // chưa từng lưu mốc — so JSON trực tiếp với `cloudSettings` (thường là `{}` từ server) sẽ
  // LUÔN lệch dù không có ô nào thật sự khác, vì `{}` !== `{"updatedAt":""}`. Bỏ khoá
  // `updatedAt` rỗng trước khi so để chỉ bắt lệch NỘI DUNG thật.
  const stripEmptyUpdatedAt = (s: SettingsBlob) => {
    const { updatedAt, ...rest } = s
    return updatedAt ? { ...rest, updatedAt } : rest
  }
  changed =
    changed ||
    JSON.stringify(stripEmptyUpdatedAt(settings)) !==
      JSON.stringify(stripEmptyUpdatedAt(cloudSettings))

  // streakFreezeDates: vé đã dùng là sự kiện đã xảy ra → union như learned/achievements.
  const localStreakFreezeDates = getStreakFreezeDatesForSync(userId)
  const streakFreezeDates = new Set<string>([
    ...localStreakFreezeDates,
    ...(cloud.streakFreezeDates ?? []),
  ])
  changed = changed || hasExtra(localStreakFreezeDates, cloud.streakFreezeDates)

  // SRS: merge theo từ-khoá, giữ thẻ có nhiều lần ôn hơn (tiến bộ hơn)
  const merged: Record<string, SRSLike> = { ...(cloud.srs ?? {}) }
  for (const [k, v] of Object.entries(readObj(SRS(userId)))) {
    const c = merged[k]
    if (!c || (v.reps ?? 0) >= (c.reps ?? 0)) merged[k] = v
  }
  changed = changed || JSON.stringify(merged) !== JSON.stringify(cloud.srs ?? {})

  try {
    localStorage.setItem(LEARNED(userId), JSON.stringify([...learned]))
    localStorage.setItem(HARD(userId), JSON.stringify([...hard]))
    localStorage.setItem(SRS(userId), JSON.stringify(merged))
    localStorage.setItem(CEFR_GRAMMAR(userId), JSON.stringify([...cefrGrammar]))
    localStorage.setItem(CEFR_DIALOGUE(userId), JSON.stringify([...cefrDialogues]))
    localStorage.setItem(CEFR_UNLOCKED(userId), JSON.stringify(cefrUnlocked))
    localStorage.setItem(CEFR_EXAMS(userId), JSON.stringify(cefrExams))
    localStorage.setItem(ACHIEVEMENTS(userId), JSON.stringify([...achievements]))
    if (placement) localStorage.setItem(PLACEMENT(userId), JSON.stringify(placement))
    if (weeklyGoal) localStorage.setItem(WEEKLY_GOAL(userId), JSON.stringify(weeklyGoal))
    applySettingsBlob(settings)
    setStreakFreezeDatesFromSync(userId, [...streakFreezeDates])
  } catch {
    /* hết dung lượng — bỏ qua */
  }

  // Xếp bản đã hợp nhất vào hàng đợi để mọi máy hội tụ — CHỈ KHI hợp nhất thực sự thêm gì đó
  // ngoài bản cloud vừa kéo về. Trước đây gọi VÔ ĐIỀU KIỆN ở đây: mỗi lần mở một trang có
  // `useCloudSync` (Home/Dashboard/Profile/History/EnglishHome/Speaking/Writing/Chat) đều kéo
  // rồi đẩy lại NGUYÊN VĂN bản cloud (không đổi gì), khiến hàng đợi luôn có đúng 1 mục rồi được
  // gửi lại ngay → banner "Đã đồng bộ dữ liệu học tập thành công!" (OfflineSyncIndicator.tsx)
  // bắn lại mỗi lần điều hướng trang dù không có gì mới để đồng bộ (audit 2026-09-19,
  // docs/changelog/0380-*.md mục 2). KHÔNG gửi ngay tại đây: `pullProgress` gọi `flush` sau khi
  // lượt pull kết thúc (hàng đợi chờ chính lượt pull này trong `beforeSend`).
  if (changed) enqueueSync(userId, 'english')
}
