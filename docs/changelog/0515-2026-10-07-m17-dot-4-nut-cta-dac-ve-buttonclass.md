# 0515 — M17 đợt 4: nút CTA đặc tự ghép màu lệch accent → `buttonClass` (2026-10-07)

- **Ngày:** 2026-10-07 · **PR:** #1266 · **Loại:** `style(ui)` · **Nhánh:**
  `claude/peaceful-newton-czolhg` (dựng lại từ `main` sau khi #1265 merge).
- **Nguồn:** nợ còn lại của `0514` ("nút tự ghép class" + M18), audit
  `docs/audit/2026-09-30-audit-ui-ux-chuan-2026.md` **M17**. Chủ dự án: "hoàn thiện nốt các việc
  còn lại rồi tạo PR auto merge".
- **M18 không cần làm:** `0512` đã xác nhận bằng máy đo — `DesktopSidebar.tsx` tự thu gọn ở
  1024–1279px; đợt này chỉ ghi lại cho khỏi tìm lại.

## Vấn đề (đo bằng grep trên `main` `a113536`)

Audit M17 nói "màu nút chính khác nhau theo trang (sky, emerald, blue-600, rose, amber…)". Sau
0500/0501 phần đó vẫn còn ở ~30 chỗ: nút đặc cyan / violet / indigo / teal / amber / blue /
emerald / rose tự ghép (`bg-xxx-500 … text-white|black|[#fff]`) cho cùng vai "hành động chính",
mỗi nơi một màu, một cỡ (`py-2.5`/`py-3`/`py-3.5`, `rounded-xl`/`2xl`/`full`), nhiều chỗ có
`active:scale-95` + `shadow-lg`. Trong đó có nút kẹt chữ đen trên nền rose (Dừng ghi âm) và
`text-white` trên nền `violet-500` (thuộc loại lỗi tương phản mà `buttonStyles.ts` nêu ở đầu file).

## Đã làm

27 file, ~35 nút chuyển sang `buttonClass` / `buttonVariantClass` (`@core/buttonStyles`):

| Nhóm                                                                                                                                                                                                 | Biến thể                                                         |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| "Tiếp tục/Câu tiếp" cỡ lớn ở QuizTab · TodayLesson · CefrLessonViews · ExamQuestionCard · CefrExam                                                                                                   | `primary` cỡ `lg`, `fullWidth`                                   |
| Gửi/hành động trong thẻ Bạn Đồng Hành (Holodeck, Socratic, Pronunciation, Articulatory, Debate)                                                                                                      | `primary`                                                        |
| CTA mở thẻ ở 4 thẻ Bạn Đồng Hành (Tranh biện, Phản tỉnh, Bảng nháp STEM, Cung điện trí nhớ)                                                                                                          | `secondary` (4 thẻ cạnh nhau — giữ luật "một nút chính mỗi màn") |
| "Bắt tay A2A" (một nút mỗi đối tác), "Khớp đơn tay" (một nút mỗi dòng bảng)                                                                                                                          | `secondary` cỡ `sm`                                              |
| Lưu (Action Canvas), Mở Workspace, Xác nhận (Studio), 2FA "Tôi đã lưu xong", Nâng cấp/Xem bảng giá, Kết bạn → Nhắn tin, các nút admin (Thêm từ cấm, Kiểm tra thủ công, Quét lại, Xác nhận & Cấp gói) | `primary`                                                        |
| Dừng ghi âm, "Tắt" 2FA, xác nhận trong TripActions                                                                                                                                                   | `danger`                                                         |
| Nút anh em cùng hàng: Hủy, Từ chối, Không, Kết thúc, Xong, Xem danh sách bạn bè, nút huỷ 2FA                                                                                                         | `outline`                                                        |
| Nút gửi tròn ở `MessageInput` (icon, 44×44)                                                                                                                                                          | `buttonVariantClass('primary')` + tròn                           |

**Giữ nguyên có chủ đích** (màu mang nghĩa trạng thái, không phải "hành động chính"): công tắc
bật/tắt hệ thống (xanh/đỏ), nút ghi âm của thanh hỏi AI, chip đang chọn (mô phỏng STEM, Cung điện
trí nhớ, phản tỉnh), huy hiệu chưa đọc, nút Streak. Cổng mới chỉ canh 27 file đã chuyển.

Hệ quả có chủ ý: chữ nút nay là `#09090b` (accent) hoặc `#fff` (danger) cố định — hết `text-white`
đảo màu theo theme; viền lấy nét dùng luật chung (`button:focus-visible`), không còn vòng riêng
`ring-blue-400` ở `MessageInput`; mờ khi vô hiệu thống nhất `opacity-50` + `pointer-events-none`.

## Cổng

- `DesignSystem.design.test.ts`: describe mới "Nút CTA đặc không còn tự ghép màu lệch accent" — 27 file
  không có nền đặc cyan/violet/indigo/teal/amber/blue/emerald/sky/rose bậc 400–700 + chữ tự khai
  trên cùng chuỗi class, và đều lấy nút từ `@core/buttonStyles`. Đã chạy regex lên bản cũ trên
  `main`: bắt được (1–2 lần/file).
- `UiNoise.design.test.ts`: allowlist bóng màu `StudioDialogue` 4 → 3 (bóng đỏ của "Dừng ghi âm"
  nay thuộc biến thể `danger`) — đúng loại thay đổi mà allowlist cho phép.

## Bằng chứng

- **Tầng 8b** (Blue sky, đăng nhập giả lập, 1440 + 390px, trước/sau, so điểm ảnh bằng PIL) cho
  Bạn Đồng Hành, Action Canvas, Cài đặt, Nâng cấp: **chiều cao trang không đổi ở cả 8 ảnh**;
  Cài đặt giống hệt từng điểm ảnh; Bạn Đồng Hành chỉ khác ở avatar đang chớp mắt + đồng hồ tin nhắn
  (nhiễu thời gian); Action Canvas "Lưu" cyan → accent cùng chiều cao; Nâng cấp: nút amber → accent
  (đang ở trạng thái vô hiệu vì mock chưa có bảng giá). Studio/thẻ nằm sau tương tác, admin sau
  quyền → không có ảnh; các chỗ đó dựa vào cổng test + a11y bên dưới.
- Cổng local: typecheck (xoá `dist` trước) · lint 0 cảnh báo · prettier · build · `test:coverage`
  **808 file / 18.824 test** xanh.
- E2E a11y trên dev server: `a11y.spec.ts` + `a11y-aaa.spec.ts` + `a11y-2fa.spec.ts` +
  `a11y-modals.spec.ts` = 398 ca xanh; 10 ca Bạn Đồng Hành đỏ lần đầu khi chạy 3 worker
  (hết thời gian chờ nhấp tab) → chạy lại riêng nhóm "Bạn Đồng Hành" bằng 1 worker: **16/16 xanh**.

## Còn mở (nói thẳng, không đóng cho đẹp)

- **~145 nút accent đặc tự ghép** (`bg-accent-500 … text-black`): ĐÃ cùng màu với `primary` nên
  không còn lệch màu như audit mô tả; chỉ khác hình (cỡ, bo góc, bóng). Đổi hàng loạt chạm chiều
  cao nút ở ~60 file — cần đợt riêng có ảnh từng trang.
- **Bề rộng nội dung:** `PageShell` nay ở 64/95 file trang (audit ghi 49/95). 31 trang còn tự đặt
  `max-w-*`. Mỗi trang là một thay đổi bố cục ở 1440px → đợt riêng có ảnh.
