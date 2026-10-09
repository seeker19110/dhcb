// specializations/stageUnits.ts — CẦU NỐI giữa BẢN ĐỒ HƯỚNG và BÀI HỌC THẬT.
//
// Bản đồ hướng (`registry.ts`) nói "chặng web-s1 dạy những gì"; dòng bài học 8 bước
// (`lessons/`) mới là chỗ học viên gõ code. Hai tầng cố ý tách nhau: bản đồ phủ đủ 14 hướng
// từ ngày đầu, còn nội dung soạn dần từng chặng. File này ghi lại chặng nào ĐÃ có bài, để
// giao diện hiện nút "Vào học" đúng chỗ thay vì hứa suông ở cả 56 chặng.
//
// Luật: chỉ thêm một dòng vào đây KHI unit đã có bài thật — test `stageUnits.test.ts` kiểm
// chéo với curriculum và với `lessons.ts`, nên khai sai là CI đỏ chứ không phải trang trắng.
import type { SpecializationId } from './types.js'

/** Các unit trong dòng bài học 8 bước thuộc về một chặng của hướng. */
export const SPEC_STAGE_UNITS: Record<string, string[]> = {
  // Hướng Web, chặng S1 — soạn 2026-08-27 (3 unit).
  'web-s1': ['p6-u16', 'p6-u17', 'p6-u18'],
  // Hướng Kiến trúc, chặng S1 — soạn 2026-08-27 (3 unit).
  'architecture-s1': ['p6-u19', 'p6-u20', 'p6-u21'],
  // Hướng Web, chặng S4 — soạn 2026-08-27 (3 unit). Đặc tả:
  // `docs/specs/2026-08-27-chang-s4-13-huong.md`.
  'web-s4': ['p6-u22', 'p6-u23', 'p6-u24'],
  // Hướng Backend, chặng S1 — soạn 2026-08-27 (3 unit). Dải `p6-u61…p6-u93` dành cho S1 của
  // 11 hướng còn lại; đặc tả: `docs/specs/2026-08-27-dai-ma-unit-s1-cac-huong-con-lai.md`.
  'backend-s1': ['p6-u61', 'p6-u62', 'p6-u63'],
  // Hướng AI, chặng S1 — soạn 2026-08-31. p6-u1 đã có TỪ TRƯỚC (module m1 gọi mô hình + m2
  // RAG); p6-u64/u65 khép nốt module m3 (đánh giá tự động) + m4 (an toàn & chi phí) của
  // `specializations/ai.ts`.
  'ai-s1': ['p6-u1', 'p6-u64', 'p6-u65'],
  // 4 chặng RIÊNG của lộ trình "Kỹ Sư Trưởng AI", giai đoạn P5 "Tầm trưởng" — soạn 2026-08-31
  // (đợt 4). Không phải hướng chuyên sâu — xem `learningPaths/pathStages.ts`. Đặc tả:
  // `docs/specs/2026-08-31-dot-4-p5-tam-truong.md`.
  'principal-s1': ['p6-u94', 'p6-u95'],
  'principal-s2': ['p6-u96', 'p6-u97'],
  'principal-s3': ['p6-u98', 'p6-u99'],
  'principal-s4': ['p6-u100', 'p6-u101'],
  // Hướng Dữ liệu, chặng S1 — soạn 2026-08-31 (3 unit, 4 module: p6-u66 = m1, p6-u67 = m2,
  // p6-u68 gộp m3+m4 — đúng tiền lệ web-s1 gộp module khi hợp lý).
  'data-s1': ['p6-u66', 'p6-u67', 'p6-u68'],
  // Hướng Dữ liệu, chặng S2 — soạn 2026-08-31 (3 unit, 4 module: p6-u120 = m1 (ETL/ELT),
  // p6-u121 = m2 (mô hình hoá kho dữ liệu), p6-u122 gộp m3+m4 (điều phối + chất lượng dữ
  // liệu — cả hai cùng trả lời "đường ống sai thì làm sao BIẾT và làm sao SỬA"). Đúng tiền lệ
  // backend-s2/s3/s4 gộp m3+m4 thành unit cuối chặng.
  'data-s2': ['p6-u120', 'p6-u121', 'p6-u122'],
  // Hướng Dữ liệu, chặng S3 — soạn 2026-08-31 (3 unit, 4 module: p6-u126 = m1 (dữ liệu lớn
  // hơn RAM), p6-u127 = m2 (luồng thời gian thực), p6-u128 gộp m3+m4 (thực nghiệm + chi phí
  // & quản trị — cả hai cùng trả lời "con số này đáng bao nhiêu"). Đúng tiền lệ
  // backend-s2/s3/s4 gộp m3+m4 thành unit cuối chặng.
  'data-s3': ['p6-u126', 'p6-u127', 'p6-u128'],
  // Hướng Backend, chặng S2 — soạn 2026-08-31 (3 unit, 4 module: p6-u102 = m1, p6-u103 = m2,
  // p6-u104 gộp m3+m4 — đúng tiền lệ web-s1 gộp module khi hợp lý).
  'backend-s2': ['p6-u102', 'p6-u103', 'p6-u104'],
  // Hướng Backend, chặng S3 — soạn 2026-08-31 (3 unit, 4 module: p6-u105 = m1, p6-u106 = m2,
  // p6-u107 gộp m3+m4 — đúng tiền lệ web-s1 gộp module khi hợp lý).
  'backend-s3': ['p6-u105', 'p6-u106', 'p6-u107'],
  // Hướng Backend, chặng S4 — soạn 2026-08-31 (3 unit, 4 module: p6-u108 = m1, p6-u109 = m2,
  // p6-u110 gộp m3+m4 — đúng tiền lệ web-s1 gộp module khi hợp lý).
  'backend-s4': ['p6-u108', 'p6-u109', 'p6-u110'],
  // Hướng Web, chặng S2 — soạn 2026-08-31 (3 unit, 5 module: p6-u111 = m1, p6-u112 gộp
  // m2+m3 (CSDL quan hệ + Xác thực & phiên), p6-u113 gộp m4+m5 (tải dữ liệu client + deploy)).
  'web-s2': ['p6-u111', 'p6-u112', 'p6-u113'],
  // Hướng Web, chặng S3 — soạn 2026-08-31 (3 unit, 5 module: p6-u114 = m1, p6-u115 gộp
  // m2+m4 (render + kiến trúc — cả hai là quyết định CẤU TRÚC lớn), p6-u116 gộp m3+m5
  // (kiểm thử + bảo mật — cả hai là gác CHẤT LƯỢNG/AN TOÀN trước khi release)).
  'web-s3': ['p6-u114', 'p6-u115', 'p6-u116'],
  // Hướng Kiến trúc, chặng S2 — soạn 2026-08-31 (3 unit, 4 module: p6-u117 = m1 (mô hình hoá
  // miền), p6-u118 = m2 (hợp đồng kiểm được), p6-u119 gộp m3+m4 (tiến hoá không phá + dữ liệu
  // là phần khó đổi nhất — cả hai cùng trả lời "đổi hợp đồng đã có người dùng thế nào cho an
  // toàn"). Đúng tiền lệ web-s1/backend-s2 gộp module khi hợp lý.
  'architecture-s2': ['p6-u117', 'p6-u118', 'p6-u119'],
  // Hướng Kiến trúc, chặng S3 — soạn 2026-08-31 (3 unit, 4 module: p6-u123 = m1 (đặc tả
  // kín), p6-u124 = m2 (giao việc cho AI/người mới), p6-u125 gộp m3+m4 (nghiệm thu + sổ
  // quyết định ADR — cả hai cùng trả lời "giữ đúng kết quả code mình không tự gõ", một ở
  // lượt này, một qua các lượt sau). Đúng tiền lệ web-s1/backend-s3 gộp module khi hợp lý.
  'architecture-s3': ['p6-u123', 'p6-u124', 'p6-u125'],
  'architecture-s4': ['p6-u190', 'p6-u191', 'p6-u192', 'p6-u193'],
  // Hướng DI ĐỘNG, chặng S1 — soạn 2026-08-31 (3 unit, 4 module). Đây là chặng ĐẦU TIÊN của
  // hướng Di động có bài học thật, nên không có tiền lệ `mobile-*` nào để theo; cách gộp lấy
  // theo tiền lệ chung của các hướng khác: p6-u131 = m1 (chọn nền tảng & vòng đời app),
  // p6-u132 = m2 (giao diện khai báo), p6-u133 gộp m3+m4 (điều hướng & trạng thái + lưu trữ
  // cục bộ — cả hai cùng trả lời "cái gì phải sống sót, và sống sót ở đâu": m3 lo trong một
  // phiên, m4 lo qua các phiên). Bài dùng làn `typescript` vì `kotlin`/`swift` chưa có bài nào
  // nên chưa cổng CI nào chứng minh bộ mô phỏng chấm đúng — nguyên lý dạy là nguyên lý chung
  // cho cả Android lẫn iOS. Đặc tả: `docs/specs/2026-08-31-bai-hoc-chang-s1-huong-di-dong.md`.
  'mobile-s1': ['p6-u131', 'p6-u132', 'p6-u133'],
  // Hướng Toán học cho Lập trình, chặng S1 — bốn module tách thành bốn unit để mỗi cơ chế
  // có ca biên và bằng chứng chạy thật riêng. Đặc tả:
  // `docs/specs/2026-09-16-mathforcode-s1-bai-hoc-that.md`.
  'mathforcode-s1': ['p6-u134', 'p6-u135', 'p6-u136', 'p6-u137'],
  'mathforcode-s2': ['p6-u138', 'p6-u139', 'p6-u140', 'p6-u141'],
  'algo-s1': ['p6-u142', 'p6-u143', 'p6-u144', 'p6-u145'],
  'algo-s2': ['p6-u162', 'p6-u163', 'p6-u164', 'p6-u165'],
  'systems-s1': ['p6-u146', 'p6-u147', 'p6-u148', 'p6-u149'],
  'systems-s2': ['p6-u150', 'p6-u151', 'p6-u152', 'p6-u153'],
  // Systems S3/S4 — soạn 2026-09-21, mỗi unit bám ĐÚNG một module của chặng (không gộp): bốn
  // cơ chế của mỗi chặng có ca biên rất khác nhau, gộp lại thì ca âm của cái này che cái kia.
  // Đặc tả: `docs/specs/2026-09-21-systems-s3-s4-bai-hoc-that.md`.
  'systems-s3': ['p6-u234', 'p6-u235', 'p6-u236', 'p6-u237'],
  'systems-s4': ['p6-u238', 'p6-u239', 'p6-u240', 'p6-u241'],
  // DevOps S1 — bốn module được tách để mỗi policy vận hành có ca âm riêng. Mô phỏng Python
  // chỉ chuẩn bị quyết định; rubric Linux/VPS thật vẫn nằm ở `details/devops-s1.ts`.
  'devops-s1': ['p6-u154', 'p6-u155', 'p6-u156', 'p6-u157'],
  'devops-s2': ['p6-u178', 'p6-u179', 'p6-u180', 'p6-u181'],
  // DevOps S3 — mỗi unit bám đúng một module của chặng (workload · cấu hình/GitOps · quan sát ·
  // độ tin cậy) để ca âm của module này không lẫn vào policy của module kia.
  'devops-s3': ['p6-u194', 'p6-u195', 'p6-u196', 'p6-u197'],
  // DevOps S4 — bốn unit bám đúng bốn module của chặng (nền tảng cho lập trình viên · chuỗi cung
  // ứng · quy mô và chi phí · văn hoá vận hành); phục vụ mô hình là lab cụ thể, không phải chặng riêng.
  'devops-s4': ['p6-u198', 'p6-u199', 'p6-u200', 'p6-u201'],
  // Hướng Nhúng, chặng S1 và S2 — soạn 2026-09-21. Mỗi unit bám đúng MỘT module vì bốn cơ chế
  // của mỗi chặng tách bạch hoàn toàn (GPIO · ngoại vi · ngắt · chẩn đoán; RTOS · kết nối ·
  // cập nhật từ xa · năng lượng). Đặc tả:
  // `docs/specs/2026-09-21-embedded-s1-s4-bai-hoc-that.md`.
  'embedded-s1': ['p6-u258', 'p6-u259', 'p6-u260', 'p6-u261'],
  'embedded-s2': ['p6-u262', 'p6-u263', 'p6-u264', 'p6-u265'],
  // Hướng Nhúng, chặng S3 và S4 — soạn 2026-09-21 (PR thứ hai của cùng đặc tả): độ tin cậy ·
  // kiểm thử qua HAL · Linux nhúng · an toàn bộ nhớ; rồi sản xuất · bảo mật thiết bị · vận hành
  // đội · an toàn chức năng. Hướng `embedded` từ đây đủ cả bốn chặng.
  'embedded-s3': ['p6-u266', 'p6-u267', 'p6-u268', 'p6-u269'],
  'embedded-s4': ['p6-u270', 'p6-u271', 'p6-u272', 'p6-u273'],
  // Hướng Toán học cho Lập trình, chặng S3 và S4 — 4 unit mỗi chặng, mỗi unit gộp m1+m2 hoặc
  // m3+m4 nên mỗi module có đúng 2 bài. p6-u158…u161 soạn 2026-09-16
  // (`docs/specs/2026-09-16-mathforcode-s3-s4-bai-hoc-that.md`); p6-u290…u293 bổ sung 2026-10-09
  // các topic còn thiếu của cùng module (`docs/specs/2026-10-09-mathforcode-s3-s4-bo-sung-unit.md`).
  // Id cũ giữ nguyên vì tiến độ học viên gắn với chúng.
  'mathforcode-s3': ['p6-u158', 'p6-u159', 'p6-u290', 'p6-u291'],
  'mathforcode-s4': ['p6-u160', 'p6-u161', 'p6-u292', 'p6-u293'],
  'ai-s2': ['p6-u166', 'p6-u167', 'p6-u168', 'p6-u169'],
  'ai-s3': ['p6-u170', 'p6-u171', 'p6-u172', 'p6-u173'],
  'ai-s4': ['p6-u174', 'p6-u175', 'p6-u176', 'p6-u177'],
  'security-s1': ['p6-u182', 'p6-u183', 'p6-u184', 'p6-u185'],
  'security-s2': ['p6-u186', 'p6-u187', 'p6-u188', 'p6-u189'],
  // Hướng Dữ liệu, chặng S4 — soạn 2026-09-21 (4 unit bám đúng 4 module: p6-u202 = m1 kiến trúc
  // nền tảng, p6-u203 = m2 độ tin cậy, p6-u204 = m3 định nghĩa chỉ số, p6-u205 = m4 đạo đức và
  // pháp lý). Không gộp module nào: bốn module này là bốn loại quyết định khác hẳn nhau, gộp thì
  // ca biên của cái này lẫn vào policy của cái kia. Đặc tả:
  // `docs/specs/2026-09-17-data-s4-security-s4-bai-hoc-that.md`.
  'data-s4': ['p6-u202', 'p6-u203', 'p6-u204', 'p6-u205'],
  // Hướng GAME, chặng S1 và S2 — soạn 2026-09-21 (4 unit mỗi chặng, bám ĐÚNG một module một
  // unit: bốn module của `game` không trùng chủ đề nên không gộp như một số hướng khác).
  // Đặc tả: `docs/specs/2026-09-21-game-s1-s4-bai-hoc-that.md`.
  'game-s1': ['p6-u242', 'p6-u243', 'p6-u244', 'p6-u245'],
  'game-s2': ['p6-u246', 'p6-u247', 'p6-u248', 'p6-u249'],
  // Hướng GAME, chặng S3 và S4 — soạn 2026-09-21 (PR thứ hai của cùng đặc tả).
  'game-s3': ['p6-u250', 'p6-u251', 'p6-u252', 'p6-u253'],
  'game-s4': ['p6-u254', 'p6-u255', 'p6-u256', 'p6-u257'],
  // Hướng DI ĐỘNG, chặng S2/S3/S4 — soạn 2026-09-21 (12 unit, mỗi chặng 4 unit ánh xạ 1:1 vào
  // 4 module gốc). KHÁC `mobile-s1` (gộp m3+m4 vì dải id chỉ có 3 chỗ): dải `p6-u214…u225` cấp
  // đủ chỗ nên không gộp module nào — bốn module của mỗi chặng là bốn loại quyết định khác hẳn
  // nhau, gộp thì ca biên của cái này lẫn vào policy của cái kia. Vẫn làn `typescript` theo đúng
  // quyết định đã chốt ở `mobile-s1`. Đặc tả:
  // `docs/specs/2026-09-21-mobile-s2-s4-bai-hoc-that.md`.
  'mobile-s2': ['p6-u214', 'p6-u215', 'p6-u216', 'p6-u217'],
  'mobile-s3': ['p6-u218', 'p6-u219', 'p6-u220', 'p6-u221'],
  'mobile-s4': ['p6-u222', 'p6-u223', 'p6-u224', 'p6-u225'],
  // Hướng Thuật toán, hai chặng CUỐI — soạn 2026-09-21, khép hướng nền cắt ngang này lại đủ
  // bốn chặng S1–S4. Mỗi unit bám đúng một module: u226 = algo-s3-m1 quy hoạch động,
  // u227 = m2 chuỗi, u228 = m3 toán rời rạc, u229 = m4 cấu trúc truy vấn khoảng;
  // u230 = algo-s4-m1 cấu trúc xác suất, u231 = m2 NP-khó, u232 = m3 bộ nhớ/song song,
  // u233 = m4 phỏng vấn và truyền đạt. Đặc tả:
  // `docs/specs/2026-09-21-algo-s3-s4-bai-hoc-that.md`.
  'algo-s3': ['p6-u226', 'p6-u227', 'p6-u228', 'p6-u229'],
  'algo-s4': ['p6-u230', 'p6-u231', 'p6-u232', 'p6-u233'],
  // Hướng An toàn thông tin, chặng S4 — soạn 2026-09-21 (4 unit bám đúng 4 module: p6-u206 = m1 kiến trúc
  // an toàn, p6-u207 = m2 phát hiện và ứng cứu, p6-u208 = m3 điều tra số, p6-u209 = m4 quản trị
  // và tuân thủ). Chặng PHÒNG THỦ: chỉ phân loại, quyết định, quy trình — `securityS4Lessons.test.ts`
  // canh bằng danh sách từ vựng tấn công bị cấm. Đặc tả:
  // `docs/specs/2026-09-17-data-s4-security-s4-bai-hoc-that.md`.
  'security-s4': ['p6-u206', 'p6-u207', 'p6-u208', 'p6-u209'],
  // Hướng An toàn thông tin, chặng S3 — dạy VÌ SAO lỗ hổng tồn tại và CÁCH PHÁT HIỆN, không cung cấp công
  // cụ khai thác (p6-u210 = m1 luồng điều khiển trên máy đồ chơi, p6-u211 = m2 an toàn bộ nhớ,
  // p6-u212 = m3 fuzzing theo độ phủ, p6-u213 = m4 chuỗi cung ứng/IAM/bảo mật AI). Đặc tả:
  // `docs/specs/2026-09-17-security-s3-bai-hoc-that.md`.
  'security-s3': ['p6-u210', 'p6-u211', 'p6-u212', 'p6-u213'],
  // Hướng DESKTOP, chặng S1 và S2 — soạn 2026-09-21. Mỗi unit bám đúng MỘT module của chặng
  // (không gộp): bốn module của desktop-s1 là bốn loại quyết định rời nhau (nền tảng · tệp ·
  // lưu trữ · đóng gói), gộp lại thì ca âm của module này lẫn vào policy của module kia.
  // Đặc tả: `docs/specs/2026-09-21-desktop-s1-s4-bai-hoc-that.md`.
  'desktop-s1': ['p6-u274', 'p6-u275', 'p6-u276', 'p6-u277'],
  'desktop-s2': ['p6-u278', 'p6-u279', 'p6-u280', 'p6-u281'],
  // Desktop S3 và S4 — soạn 2026-09-21, PR thứ hai của cùng đặc tả. Vẫn một unit một module:
  // S3 là bốn bài toán hiệu năng/mở rộng rời nhau, S4 là bốn mặt của việc bán và nuôi một sản
  // phẩm desktop có người trả tiền.
  'desktop-s3': ['p6-u282', 'p6-u283', 'p6-u284', 'p6-u285'],
  'desktop-s4': ['p6-u286', 'p6-u287', 'p6-u288', 'p6-u289'],
}

/** Unit của một chặng; mảng RỖNG nghĩa là chặng chưa có bài (giao diện phải nói rõ điều đó). */
export function unitsOfStage(stageId: string): string[] {
  return SPEC_STAGE_UNITS[stageId.trim().toLowerCase()] ?? []
}

/** Hướng này đã có bài học thật ở chặng nào chưa — dùng để gắn nhãn "đã có bài" ở danh sách. */
export function specHasLessons(specId: SpecializationId): boolean {
  return Object.keys(SPEC_STAGE_UNITS).some((k) => k.startsWith(`${specId}-`))
}
