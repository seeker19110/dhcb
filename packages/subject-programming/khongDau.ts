// khongDau.ts — Bỏ dấu tiếng Việt + thường hoá cho các bộ giả lập (hermesSim, openclawSim,
// vibeSim). Trước đợt E4 (audit 2026-10-10) ba file chép y hệt hàm này.
//
// Dò mẫu trên lệnh/nội dung học viên gõ CÓ hoặc KHÔNG dấu đều trúng (output của máy thì luôn
// không dấu, đúng quy ước gitSim/bashSim). KHÔNG gộp khoảng trắng — khác `normalizeVi`
// (core-learner) có chủ đích: các luật dò mẫu so theo vị trí ký tự gốc.

export function khongDau(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase()
}
