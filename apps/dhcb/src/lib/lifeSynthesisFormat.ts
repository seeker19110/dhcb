// Chuẩn hoá số điểm 0–100 của báo cáo tổng hợp đa miền.
//
// Trả `null` khi giá trị thiếu/không phải số hữu hạn — nơi hiển thị phải ghi "Chưa đủ dữ liệu"
// chứ KHÔNG được thay bằng số "đẹp" (bản cũ dùng `|| 88`/`|| 92`/`|| 85` nên điểm 0 thật cũng
// thành 88, và dữ liệu thiếu thành điểm bịa — CLAUDE.md mục 1 + 4.9, null khác 0).
export function diemHopLe(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null
  return Math.min(100, Math.max(0, Math.round(value)))
}
