// localJson.ts — Đọc MẢNG JSON từ localStorage an toàn (audit 2026-10-10, đợt E4: trước đó 8 file
// chép tay cùng khối try/catch này).
//
// Thiếu khoá, JSON hỏng, giá trị không phải mảng, hoặc localStorage bị chặn (Safari riêng tư,
// iframe) → mảng rỗng: các nơi gọi đều coi "không đọc được" như "chưa có gì", không làm vỡ UI.
// Phần tử KHÔNG được kiểm kiểu (giữ đúng hành vi cũ) — nơi cần kiểm thì tự lọc sau khi đọc.
// Phần GHI cố ý không gộp: có nơi nuốt lỗi quota, có nơi để lỗi nổi lên cho người gọi xử lý.

export function readLocalArray<T = unknown>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key)
    const parsed: unknown = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? (parsed as T[]) : []
  } catch {
    return []
  }
}
