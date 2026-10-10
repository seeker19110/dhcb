// seededRandom.ts — Băm chuỗi + bộ sinh số giả ngẫu nhiên CÓ SEED, dùng chung client/server.
//
// Trước đợt E4 (audit 2026-10-10) FNV-1a được chép tay ở 4 nơi và mulberry32 ở 2 nơi. Các nơi đó
// sinh ra kết quả ĐƯỢC LƯU hoặc NGƯỜI HỌC NHÌN THẤY (vân tay phiên học trong localStorage, thứ tự
// câu hỏi, thứ tự dòng Parsons) — nên hai hàm dưới đây phải cho đầu ra TRÙNG TỪNG BIT với bản cũ.
// Test `seededRandom.test.ts` giữ bản cũ làm đối chứng; đừng "tối ưu" thuật toán ở đây.
//
// Không dùng cho mật mã (đoán được) — chỉ để tất định: cùng đầu vào → cùng kết quả.

/** FNV-1a 32-bit theo code unit UTF-16, trả số NGUYÊN KHÔNG DẤU (0…2³²−1). */
export function fnv1a32(text: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    // Nhân với số nguyên tố FNV 16777619 kiểu 32-bit (Math.imul tránh sai số số thực).
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

// mulberry32 sống ở gói lá core-grading (xem lý do ở đó) — re-export để nơi dùng có một cửa.
export { mulberry32 } from '@dhcb/core-grading/mulberry32'
