// mistakes.ts — SỔ LỖI CÁ NHÂN (Mistake Bank).
//
// Ý tưởng (docs/research/danh-gia-tien-trien-hoc-2026-07-07.md — đề xuất A):
// mỗi lần AI sửa lỗi trong Chat / Viết / Nói, ta lưu lại { câu sai, câu đúng, giải thích }
// để học viên ÔN LẠI về sau dưới dạng thẻ. Đây là tài liệu ôn giá trị nhất và độc nhất của
// từng người (lỗi thật của chính họ) — trước đây bị "bay hơi" sau mỗi phiên.
//
// [2026-08-24] ĐÃ ĐỒNG BỘ SERVER (Đợt 1 "Không nói dối", docs/research/nang-tam-du-an-2026-08-24.md).
// Trước đây module này CHỈ dùng localStorage nên đổi máy/xoá cache là mất sạch sổ lỗi — thứ tài
// liệu ôn giá trị nhất của từng người. Nay:
//   * localStorage vẫn là nơi ghi/đọc TỨC THÌ (mọi hàm dưới đây giữ nguyên chữ ký đồng bộ, nên
//     luồng Chat/Viết/Nói không phải đổi gì và vẫn chạy được khi mất mạng),
//   * server (`/api/mistakes`) là NGUỒN SỰ THẬT — gọi syncMistakes() để hợp nhất hai phía.
// Mọi thao tác vẫn nuốt lỗi (không throw) để việc lưu/ôn lỗi không bao giờ làm gãy luồng gọi.

import type { Direction } from '../types'
import { getAuthHeader } from '@core/authHeader'
import { readLocalArray } from './localJson'

export type MistakeSource = 'chat' | 'writing' | 'speaking'

export interface Mistake {
  id: string
  wrong: string // câu/cụm học viên viết sai (ngôn ngữ đích)
  corrected: string // câu đúng (ngôn ngữ đích) — có thể rỗng nếu nguồn không tách được (vd Chat)
  explanation: string // giải thích (tiếng mẹ đẻ của học viên)
  source: MistakeSource
  dir: Direction // chiều học lúc mắc lỗi (A: học tiếng Anh · B: học tiếng Việt)
  createdAt: number // thời điểm mắc lỗi GẦN NHẤT (dùng để sắp theo độ mới)
  count: number // số lần mắc lỗi giống nhau (gộp) — lỗi lặp nhiều được ưu tiên ôn
  lastReviewedAt: number | null // lần ôn gần nhất (null = chưa ôn bao giờ)
  reviewCount: number // tổng số lần đã ôn
  // ── Bằng chứng (S12-2, migration 0084) — đều TUỲ CHỌN ─────────────────────────────────────
  // Thẻ có `attemptId` là lỗi mắc trong một lượt làm bài CỤ THỂ, nên "Ôn lại lỗi này" quay về
  // được đúng chỗ và giao diện ghi "có bằng chứng". Thẻ không có thì ghi "ghi tay" — KHÔNG giả
  // bằng chứng. Ba field này KHÔNG tham gia khoá gộp (`norm(wrong)→norm(corrected)`).
  attemptId?: string // lượt nộp trong platform.completion_evidence
  contentId?: string // bài học đã sinh ra lỗi
  subjectId?: 'english' // bảng này là sổ lỗi môn Anh
}

// Dữ liệu tối thiểu để thêm 1 lỗi — phần còn lại (id, thời gian, đếm) do addMistake tự điền.
export interface MistakeInput {
  wrong: string
  corrected: string
  explanation: string
  source: MistakeSource
  dir: Direction
  /** Lượt nộp đã sinh ra lỗi, khi nơi gọi có (S12-2). Không có thì bỏ trống. */
  attemptId?: string
  /** Bài học đã sinh ra lỗi, khi nơi gọi có (S12-2). */
  contentId?: string
}

const KEY = (uid: string) => `et_mistakes_${uid}`

// Giới hạn số lỗi lưu để không phình localStorage vô hạn — giữ lại các bản GẦN/HAY LẶP nhất.
const MAX_MISTAKES = 200
// Độ dài tối đa mỗi trường (tránh lưu nguyên bài viết dài vào 1 thẻ lỗi).
const MAX_FIELD_LEN = 500
// Giãn cách ôn tối thiểu: đã ôn trong vòng 2 ngày thì tạm chưa cần ôn lại.
// Xuất ra ngoài (S12-1) để hàng đợi ôn xuyên môn tính hạn CÙNG một con số với sổ lỗi —
// khai lại ở nơi khác là mở đường cho hai chỗ lệch nhau mà không ai biết.
export const REVIEW_SPACING_MS = 2 * 86_400_000

function read(uid: string): Mistake[] {
  return readLocalArray<Mistake>(KEY(uid))
}

function write(uid: string, list: Mistake[]): void {
  try {
    localStorage.setItem(KEY(uid), JSON.stringify(list))
  } catch {
    /* hết dung lượng / chế độ riêng tư — bỏ qua, không làm gãy luồng gọi */
  }
}

// Chuẩn hóa để so trùng: gộp khoảng trắng + thường hóa + bỏ khoảng trắng đầu/cuối.
function norm(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ')
}

function clip(s: string): string {
  const t = (s ?? '').trim()
  return t.length > MAX_FIELD_LEN ? t.slice(0, MAX_FIELD_LEN) : t
}

// Lỗi có "đáng lưu" không: phải có câu sai (đủ dài) và PHẢI có ít nhất câu đúng HOẶC giải
// thích. Bỏ trường hợp câu sai trùng hệt câu đúng (không phải lỗi thật).
function isWorthSaving(m: MistakeInput): boolean {
  const wrong = clip(m.wrong)
  if (wrong.length < 2) return false
  const corrected = clip(m.corrected)
  const explanation = clip(m.explanation)
  if (!corrected && !explanation) return false
  if (corrected && norm(wrong) === norm(corrected)) return false
  return true
}

export function getMistakes(userId: string): Mistake[] {
  if (!userId) return []
  return read(userId)
}

// Thêm 1 lỗi. Nếu đã có lỗi GIỐNG (cùng câu sai + câu đúng sau chuẩn hóa) thì KHÔNG tạo
// bản mới mà tăng count + làm mới thời gian + đánh dấu cần ôn lại (lastReviewedAt = null).
export function addMistake(userId: string, input: MistakeInput): void {
  if (!userId || !isWorthSaving(input)) return
  try {
    const list = read(userId)
    const wrong = clip(input.wrong)
    const corrected = clip(input.corrected)
    const key = `${norm(wrong)}→${norm(corrected)}`
    const now = Date.now()
    const idx = list.findIndex((m) => `${norm(m.wrong)}→${norm(m.corrected)}` === key)
    const existing = idx >= 0 ? list[idx] : undefined
    if (existing) {
      list[idx] = {
        ...existing,
        count: existing.count + 1,
        createdAt: now, // đẩy lên đầu theo độ mới
        lastReviewedAt: null, // lỗi lặp lại → cần ôn lại
        // Giữ giải thích mới nhất nếu có (đôi khi AI diễn đạt rõ hơn ở lần sau)
        explanation: clip(input.explanation) || existing.explanation,
        // Bằng chứng: bản MỚI thắng, nhưng thiếu thì KHÔNG xoá móc cũ (cùng luật `coalesce`
        // của server ở api/subjects/english/mistakes.ts).
        ...(input.attemptId ? { attemptId: input.attemptId } : {}),
        ...(input.contentId ? { contentId: input.contentId } : {}),
      }
    } else {
      list.unshift({
        id: crypto.randomUUID(),
        wrong,
        corrected,
        explanation: clip(input.explanation),
        source: input.source,
        dir: input.dir,
        createdAt: now,
        count: 1,
        lastReviewedAt: null,
        reviewCount: 0,
        ...(input.attemptId ? { attemptId: input.attemptId } : {}),
        ...(input.contentId ? { contentId: input.contentId } : {}),
      })
    }
    // Cắt bớt nếu vượt trần: bỏ các thẻ CŨ nhất & ít lặp nhất trước.
    if (list.length > MAX_MISTAKES) {
      list.sort((a, b) => b.count - a.count || b.createdAt - a.createdAt)
      list.length = MAX_MISTAKES
    }
    write(userId, list)
  } catch {
    /* không bao giờ để việc lưu lỗi làm gãy luồng gọi */
  }
}

// Thêm nhiều lỗi cùng lúc (vd mảng errors của bài Luyện viết).
export function addMistakes(userId: string, inputs: MistakeInput[]): void {
  for (const m of inputs) addMistake(userId, m)
}

export function deleteMistake(userId: string, id: string): void {
  if (!userId) return
  write(
    userId,
    read(userId).filter((m) => m.id !== id),
  )
}

// Đánh dấu đã ôn 1 lỗi (tăng reviewCount + ghi thời điểm) → tạm rời khỏi danh sách cần ôn.
export function markReviewed(userId: string, id: string): void {
  if (!userId) return
  const list = read(userId)
  const idx = list.findIndex((m) => m.id === id)
  const existing = idx >= 0 ? list[idx] : undefined
  if (!existing) return
  list[idx] = {
    ...existing,
    lastReviewedAt: Date.now(),
    reviewCount: existing.reviewCount + 1,
  }
  write(userId, list)
}

// Lỗi "cần ôn": chưa ôn bao giờ HOẶC lần ôn gần nhất đã quá REVIEW_SPACING_MS.
// Sắp xếp: lỗi LẶP NHIỀU trước (ưu tiên theo đề xuất), rồi tới lỗi mới hơn.
export function getDueMistakes(userId: string, now: number = Date.now()): Mistake[] {
  return getMistakes(userId)
    .filter((m) => m.lastReviewedAt == null || now - m.lastReviewedAt >= REVIEW_SPACING_MS)
    .sort((a, b) => b.count - a.count || b.createdAt - a.createdAt)
}

export function getMistakeStats(userId: string): { total: number; due: number } {
  const all = getMistakes(userId)
  const now = Date.now()
  const due = all.filter(
    (m) => m.lastReviewedAt == null || now - m.lastReviewedAt >= REVIEW_SPACING_MS,
  ).length
  return { total: all.length, due }
}

// ── Đồng bộ server ───────────────────────────────────────────────────────────

// Hợp nhất 2 sổ lỗi theo khóa (câu sai → câu đúng, sau chuẩn hóa) — cùng luật với addMistake
// và server: count/createdAt/reviewCount lấy giá trị lớn hơn, lastReviewedAt=null thắng
// (nghĩa là "cần ôn lại"). Kết quả sắp theo độ mới và cắt trần MAX_MISTAKES.
function mergeMistakeLists(base: Mistake[], extra: Mistake[]): Mistake[] {
  const keyOf = (m: Mistake) => `${norm(m.wrong)}→${norm(m.corrected)}`
  const byKey = new Map<string, Mistake>(base.map((m) => [keyOf(m), m]))
  for (const m of extra) {
    const k = keyOf(m)
    const ex = byKey.get(k)
    if (!ex) {
      byKey.set(k, m)
      continue
    }
    byKey.set(k, {
      ...ex,
      count: Math.max(ex.count, m.count),
      createdAt: Math.max(ex.createdAt, m.createdAt),
      reviewCount: Math.max(ex.reviewCount, m.reviewCount),
      lastReviewedAt:
        ex.lastReviewedAt == null || m.lastReviewedAt == null
          ? null
          : Math.max(ex.lastReviewedAt, m.lastReviewedAt),
      explanation: ex.explanation || m.explanation,
      // Bằng chứng không bao giờ bị `undefined` của phía kia xoá mất.
      ...((ex.attemptId ?? m.attemptId) ? { attemptId: ex.attemptId ?? m.attemptId } : {}),
      ...((ex.contentId ?? m.contentId) ? { contentId: ex.contentId ?? m.contentId } : {}),
    })
  }
  const merged = [...byKey.values()].sort((a, b) => b.createdAt - a.createdAt)
  if (merged.length > MAX_MISTAKES) {
    merged.sort((a, b) => b.count - a.count || b.createdAt - a.createdAt)
    merged.length = MAX_MISTAKES
  }
  return merged
}

// Đẩy sổ cục bộ lên server, nhận về sổ ĐÃ HỢP NHẤT (server gộp theo cùng luật với addMistake:
// count/mốc thời gian lấy giá trị lớn hơn), rồi ghi đè localStorage bằng bản hợp nhất đó.
//
// Trả về sổ sau đồng bộ; nếu chưa đăng nhập hoặc mất mạng thì trả về sổ cục bộ và KHÔNG throw —
// người dùng vẫn học bình thường, lần đồng bộ sau sẽ đẩy lên.
export async function syncMistakes(userId: string): Promise<Mistake[]> {
  if (!userId) return []
  const local = read(userId)
  try {
    const headers = await getAuthHeader()
    const res = await fetch('/api/mistakes', {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ mistakes: local }),
    })
    if (!res.ok) return local
    const data = (await res.json()) as { mistakes?: Mistake[] }
    if (!Array.isArray(data.mistakes)) return local
    // Hợp nhất lại với sổ cục bộ HIỆN TẠI trước khi ghi đè: trong lúc request đang bay,
    // addMistake() có thể vừa ghi lỗi mới — ghi đè thẳng bằng bản server sẽ nuốt mất chúng
    // (race hẹp nhưng xảy ra đúng lúc đang chat, audit 2026-08-24). Luật hợp nhất giống server:
    // count/mốc thời gian lấy giá trị lớn hơn, lastReviewedAt=null (cần ôn lại) thắng.
    const merged = mergeMistakeLists(data.mistakes, read(userId))
    write(userId, merged)
    return merged
  } catch {
    return local // ngoại tuyến — giữ nguyên bản cục bộ
  }
}

// Hẹn giờ đẩy sổ lên server, GOM NHÓM các lần ghi liên tiếp.
//
// Vì sao cần: Chat/Viết/Nói ghi lỗi bằng addMistake() (đồng bộ, chỉ localStorage). Nếu mỗi lỗi
// đẩy lên ngay thì một phiên chat 20 tin nhắn thành 20 request gửi trọn sổ — quá nặng. Nếu KHÔNG
// đẩy gì thì lỗi chỉ lên server lúc người dùng mở trang Sổ tay, mà họ có thể không bao giờ mở
// trên máy đó rồi đổi máy là mất. Gom nhóm là điểm cân bằng: ghi cuối cùng của một cụm mới đẩy.
let syncTimer: ReturnType<typeof setTimeout> | null = null
const SYNC_DEBOUNCE_MS = 5_000

export function scheduleMistakeSync(userId: string, delayMs: number = SYNC_DEBOUNCE_MS): void {
  if (!userId) return
  if (syncTimer) clearTimeout(syncTimer)
  syncTimer = setTimeout(() => {
    syncTimer = null
    void syncMistakes(userId)
  }, delayMs)
}

// Xoá một thẻ lỗi ở CẢ hai phía. Xoá cục bộ trước để giao diện phản hồi ngay, rồi báo server;
// server lỗi thì thẻ sẽ quay lại ở lần syncMistakes() sau — chấp nhận được, đổi lại không bao
// giờ mất dữ liệu do xoá nhầm lúc mạng chập chờn.
export async function deleteMistakeSynced(userId: string, id: string): Promise<void> {
  if (!userId) return
  deleteMistake(userId, id)
  try {
    const headers = await getAuthHeader()
    await fetch(`/api/mistakes?id=${encodeURIComponent(id)}`, { method: 'DELETE', headers })
  } catch {
    /* ngoại tuyến — bỏ qua, lần sync sau sẽ hoà lại */
  }
}
