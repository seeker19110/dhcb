// vnDate.ts — Ngày "hôm nay" THEO GIỜ VIỆT NAM (Asia/Ho_Chi_Minh, UTC+7, không DST) + tiện ích
// chuỗi ngày "YYYY-MM-DD". MỘT nguồn cho cả client (apps/dhcb/src/lib/date.ts) và server
// (packages/core-db/date.ts) — hai file đó chỉ re-export. Trước đợt E4 (audit 2026-10-10) đây là
// hai bản chép tay kèm ghi chú "PHẢI khớp nhau" — lệch là lượt dùng/streak/tuần tính khác nhau
// giữa client và server.
//
// VẤN ĐỀ GỐC (audit 2026-07-03): trước đây dùng `new Date().toISOString().slice(0, 10)` — luôn
// trả NGÀY UTC, khiến ranh giới "ngày mới" (reset lượt dùng, streak, từ vựng hôm nay...) thực
// chất là 7h sáng giờ Việt Nam thay vì nửa đêm.
//
// Việt Nam không có giờ mùa hè (DST) → offset +7h luôn đúng, không cần thư viện
// timezone ngoài.
const VN_OFFSET_MS = 7 * 60 * 60 * 1000

// Ngày (YYYY-MM-DD) theo giờ Việt Nam của thời điểm `d` (mặc định: hiện tại).
export function vnDateStr(d: Date = new Date()): string {
  return new Date(d.getTime() + VN_OFFSET_MS).toISOString().slice(0, 10)
}

// Thứ trong tuần (0 = Chủ nhật … 6 = Thứ bảy) THEO GIỜ VIỆT NAM của thời điểm `d`.
// Dùng .getUTCDay() trên thời điểm đã dịch +7h — cùng cách tính với vnDateStr() — để
// nhãn "thứ" trên biểu đồ luôn khớp với ngày (YYYY-MM-DD) hiển thị, bất kể múi giờ của
// trình duyệt người xem là gì. Nếu dùng d.getDay() (thứ theo giờ LOCAL của trình duyệt)
// thì người xem ở múi giờ khác VN có thể thấy nhãn thứ lệch 1 ngày so với ngày thực tế.
export function vnDayOfWeek(d: Date = new Date()): number {
  return new Date(d.getTime() + VN_OFFSET_MS).getUTCDay()
}

// ── Tiện ích so/dịch chuỗi ngày "YYYY-MM-DD" (mốc UTC nửa đêm — chuỗi ngày không
// gắn múi giờ nên phép trừ/cộng theo mốc UTC luôn ra đúng số ngày nguyên). Client dùng cho vé
// nghỉ streak, challenge tuần, mục tiêu tuần; server dùng cho nội dung nhắc học
// (api/_lib/reminderContent.ts) — cùng MỘT luật tính ngày. ─────────────────────────
export const MS_DAY = 86_400_000

export function dateStrToMs(d: string): number {
  return new Date(`${d}T00:00:00Z`).getTime()
}

// Số ngày từ a đến b (b sau a → dương, có thể âm).
export function daysBetween(a: string, b: string): number {
  return Math.round((dateStrToMs(b) - dateStrToMs(a)) / MS_DAY)
}

// Ngày cách `d` đúng `n` ngày (n âm = lùi về quá khứ).
export function addDays(d: string, n: number): string {
  return new Date(dateStrToMs(d) + n * MS_DAY).toISOString().slice(0, 10)
}

// Thứ 2 (YYYY-MM-DD) của tuần chứa ngày `d` — LUẬT TUẦN DUY NHẤT của app
// (mục tiêu tuần + challenge chu kỳ tuần ở client, nhắc học theo tuần ở server).
// Chuỗi ngày không gắn múi giờ → lấy thứ theo mốc UTC nửa đêm (như daysBetween).
export function weekStartOf(d: string): string {
  const dow = new Date(dateStrToMs(d)).getUTCDay() // 0 = CN … 6 = T7
  return addDays(d, -((dow + 6) % 7)) // lùi về Thứ 2: T2=0 … CN=6
}
