// fundData — SỔ QUỸ MẪU của dự án trục T2 "Quỹ lớp / Chi tiêu nhà mình", dùng cho API giả
// `/api/quy` ở bước cuối chặng P3 (trang minh bạch quỹ lấy sổ từ máy chủ).
//
// Số liệu nối tiếp các chặng trước của T2 (mức đóng 50.000 đồng/bạn, lớp 40 bạn): tháng 9 cả
// lớp đóng đủ 2.000.000, tháng 10 thiếu một bạn còn 1.950.000 — bản ghi CHỈ có ở API này, nên
// ai còn gõ cứng bảng số của bước HTML vào script sẽ lộ ngay ở ca kiểm tra. Tên viết KHÔNG DẤU
// như mọi dòng chấm điểm của dự án (so chuỗi khỏi lệch dấu tiếng Việt).
//
// LƯU Ý KHI SỬA: đổi giao dịch ở đây là phải sửa `expected` của bước t2-p3-s5 (cổng
// projectStepsT2.test.ts chạy code mẫu thật nên sẽ đỏ ngay — không âm thầm sai).

/** Một giao dịch trong sổ quỹ mà API `/api/quy` trả về. */
export interface GiaoDichQuy {
  /** Mã chứng từ: T.. là khoản thu, C.. là khoản chi — tra một giao dịch bằng `?ma=`. */
  ma: string
  /** Ngày dạng YYYY-MM-DD (so sánh chuỗi đúng thứ tự thời gian). */
  ngay: string
  loai: 'thu' | 'chi'
  noi_dung: string
  so_tien: number
}

export const SO_QUY_LOP: GiaoDichQuy[] = [
  { ma: 'T01', ngay: '2026-09-05', loai: 'thu', noi_dung: 'Thu quy thang 9', so_tien: 2000000 },
  { ma: 'T02', ngay: '2026-10-05', loai: 'thu', noi_dung: 'Thu quy thang 10', so_tien: 1950000 },
  { ma: 'C01', ngay: '2026-10-15', loai: 'chi', noi_dung: 'Photo de cuong', so_tien: 120000 },
  { ma: 'C02', ngay: '2026-11-18', loai: 'chi', noi_dung: 'Hoa 20/11', so_tien: 300000 },
  { ma: 'C03', ngay: '2026-11-22', loai: 'chi', noi_dung: 'Nuoc uong van nghe', so_tien: 150000 },
]
