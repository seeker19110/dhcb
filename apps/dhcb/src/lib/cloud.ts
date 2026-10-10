// cloud.ts — Đồng bộ dữ liệu người dùng lên server (chat, viết, nói, lượt dùng).
//
// Ý tưởng: localStorage vẫn là "bộ nhớ đệm" cho đọc nhanh + chạy offline.
// Mỗi lần lưu, ta ĐẨY (push) bản ghi lên server theo kiểu "bắn rồi quên"
// (không chặn giao diện). Khi mở app/trang, ta KÉO (pull) dữ liệu từ server
// về ghi đè vào localStorage để các máy/trình duyệt khác thấy cùng dữ liệu.
//
// Giai đoạn C (rời Supabase): mọi đọc/ghi đi qua /api/history (Postgres tự host),
// server tự kiểm user từ Bearer token — thay client query Supabase dựa vào RLS trước đây.

// `zod/mini`: file này nằm trên đường khởi động (chunk modulepreload `storage`) — xem
// changelog 0580, đừng đổi lại thành `zod` bản đầy đủ.
import * as z from 'zod/mini'
import { isGuestId } from '@core/guestId'
import { getAuthHeader, getStoredToken } from '@core/authHeader'
import type { ChatSession, WritingSubmission, SpeakingSession, DailyUsage } from '../types'

// Khóa localStorage — PHẢI khớp với storage.ts để dùng chung bộ nhớ đệm
const K = {
  chat: (uid: string) => `et_chat_${uid}`,
  writing: (uid: string) => `et_writing_${uid}`,
  speaking: (uid: string) => `et_speaking_${uid}`,
  usage: (uid: string, date: string) => `et_usage_${uid}_${date}`,
}

function setLocal<T>(key: string, val: T) {
  try {
    localStorage.setItem(key, JSON.stringify(val))
  } catch {
    /* hết dung lượng — bỏ qua */
  }
}

// Đẩy 1 bản ghi lên server kiểu "bắn rồi quên" — lỗi mạng / chưa đăng nhập chỉ warn,
// KHÔNG làm vỡ giao diện (vẫn còn bản localStorage, lần lưu sau sẽ đẩy bù).
function firePost(body: unknown, where: string) {
  if (!getStoredToken()) return // chưa đăng nhập — không có gì để đồng bộ
  void fetch('/api/history', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify(body),
  })
    .then((resp) => {
      if (!resp.ok) console.warn(`[cloud] đồng bộ ${where} lỗi: HTTP`, resp.status)
    })
    .catch((err) => console.warn(`[cloud] đồng bộ ${where} lỗi:`, err))
}

// ── PUSH: đẩy 1 bản ghi lên server ───────────────────────────────────────────
export function pushChatSession(s: ChatSession) {
  firePost(
    {
      action: 'chat',
      session: {
        id: s.id,
        situation: s.situation,
        level: s.level,
        messages: s.messages,
        createdAt: s.createdAt,
      },
    },
    'chat',
  )
}
export function pushSpeakingSession(s: SpeakingSession) {
  firePost(
    {
      action: 'speaking',
      session: {
        id: s.id,
        situation: s.situation,
        level: s.level,
        messages: s.messages,
        createdAt: s.createdAt,
      },
    },
    'speaking',
  )
}
export function pushWritingSub(s: WritingSubmission) {
  firePost(
    {
      action: 'writing',
      submission: {
        id: s.id,
        essayPrompt: s.essayPrompt,
        essay: s.essay,
        feedback: s.feedback,
        submittedAt: s.submittedAt,
      },
    },
    'writing',
  )
}
// BẢO MẬT (bất biến): KHÔNG có hàm đẩy các cột đếm lượt tốn API (chat/writing/speaking/
// stt/pronounce) từ client. Các cột đó do SERVER đếm authoritative (api/_lib/usage.ts,
// hàm SQL consume_usage) và /api/history CHỈ nhận learn_count (action 'learn-day').

// Đẩy RIÊNG cột learn_count (số từ học trong ngày) để ghi nhận streak — không tốn API AI
// nên client được phép là nguồn của số này.
export function pushLearnDay(_userId: string, day: string, learnCount: number) {
  firePost({ action: 'learn-day', day, learnCount }, 'learn day')
}

// ── PULL: kéo toàn bộ dữ liệu của user về ghi vào localStorage ────────────────
// Gọi khi đăng nhập / mở trang. Lỗi mạng sẽ bị nuốt (vẫn dùng được bản local cũ).
export async function pullUserData(userId: string): Promise<void> {
  // Khách vãng lai không có dữ liệu trên server — bỏ qua để khỏi bắn request 401 vô ích.
  if (isGuestId(userId)) return
  if (!getStoredToken()) return
  let data: {
    chat?: ChatSession[]
    writing?: WritingSubmission[]
    speaking?: SpeakingSession[]
    usage?: DailyUsage[]
  }
  try {
    const resp = await fetch('/api/history', { headers: getAuthHeader() })
    if (!resp.ok) {
      console.warn('[cloud] kéo dữ liệu lỗi: HTTP', resp.status)
      return
    }
    data = (await resp.json()) as typeof data
  } catch (err) {
    console.warn('[cloud] kéo dữ liệu lỗi:', err instanceof Error ? err.message : err)
    return
  }

  if (Array.isArray(data.chat)) setLocal(K.chat(userId), data.chat)
  if (Array.isArray(data.writing)) setLocal(K.writing(userId), data.writing)
  if (Array.isArray(data.speaking)) setLocal(K.speaking(userId), data.speaking)
  if (Array.isArray(data.usage)) {
    // Lưu từng ngày vào localStorage để getStreak() tính đúng streak nhiều ngày
    // (server trả tối đa 365 ngày gần nhất, đủ cho chuỗi 1 năm).
    for (const u of data.usage) {
      if (u && typeof u.date === 'string') setLocal(K.usage(userId, u.date), u)
    }
  }
}

// ── Lưu kết quả onboarding ────────────────────────────────────────────────────
// Giai đoạn C: gọi POST /api/profile thay Supabase client — không còn Supabase session
// sau khi cutover khỏi Supabase Auth (Giai đoạn B). Server tự xác định user từ token
// (getAuthHeader()), không cần truyền userId nữa.
export type SaveOnboardingResult =
  | { ok: true }
  | { ok: false; reason: 'network' | 'timeout' | 'invalid-response' }
  | { ok: false; reason: 'http'; status: number }

const onboardingSavedSchema = z.object({ ok: z.literal(true) })

export async function saveOnboarding(data: {
  level: string
  goal: string
  dailyMinutes: number
  ageGroup?: string
}): Promise<SaveOnboardingResult> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 15_000)
  try {
    const resp = await fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ action: 'onboarding', ...data }),
      signal: controller.signal,
    })
    if (!resp.ok) return { ok: false, reason: 'http', status: resp.status }
    let body: unknown
    try {
      body = await resp.json()
    } catch {
      return { ok: false, reason: controller.signal.aborted ? 'timeout' : 'invalid-response' }
    }
    return onboardingSavedSchema.safeParse(body).success
      ? { ok: true }
      : { ok: false, reason: 'invalid-response' }
  } catch {
    return { ok: false, reason: controller.signal.aborted ? 'timeout' : 'network' }
  } finally {
    clearTimeout(timer)
  }
}
