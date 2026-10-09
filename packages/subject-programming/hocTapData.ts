// hocTapData — KHO TÀI LIỆU MẪU của dự án trục T3 "Sổ học tập của tôi", dùng cho API giả
// `/api/tai-lieu` ở bước cuối chặng P3 (trang chia sẻ tài liệu công khai).
//
// Ba tài liệu đầu giữ ĐÚNG bộ học viên đã gõ tay ở bước 1–2 của chặng (trang HTML tĩnh), để dự
// án là MỘT sản phẩm tiến hoá chứ không phải đề rời; thêm ba tài liệu nữa để danh sách đủ dài,
// có môn trùng nhau (lọc theo môn mới có nghĩa) mà vẫn nhẩm tay được. Tên viết KHÔNG DẤU như mọi
// dòng chấm điểm của dự án (so chuỗi khỏi lệch dấu tiếng Việt).
//
// LƯU Ý KHI SỬA: đổi tài liệu ở đây là phải sửa `expected` của bước `t3-p3-s5` (cổng
// projectStepsT3.test.ts chạy code mẫu thật nên sẽ đỏ ngay — không âm thầm sai).

/** Một tài liệu mà API `/api/tai-lieu` trả về. */
export interface TaiLieuChiaSe {
  ten: string
  /** Mã môn viết thường không dấu — khoá để trang lọc theo môn. */
  mon: string
  luot_tai: number
}

export const TAI_LIEU_CHIA_SE: TaiLieuChiaSe[] = [
  { ten: 'De cuong Toan HK1', mon: 'toan', luot_tai: 120 },
  { ten: 'Tom tat Van 11', mon: 'van', luot_tai: 85 },
  { ten: 'Tu vung Anh Unit 1-5', mon: 'anh', luot_tai: 240 },
  { ten: '50 bai tap Dao ham', mon: 'toan', luot_tai: 64 },
  { ten: 'So do tu duy Lich su', mon: 'su', luot_tai: 37 },
  { ten: 'Cong thuc Vat ly 11', mon: 'ly', luot_tai: 150 },
]
