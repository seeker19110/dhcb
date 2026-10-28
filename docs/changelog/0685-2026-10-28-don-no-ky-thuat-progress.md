# 0685 — 2026-10-28 — Dọn mục "Nợ kỹ thuật còn mở" trong PROGRESS

Đợt 1 của yêu cầu "làm tiếp tất cả nợ" (chủ dự án, 2026-10-28). Chỉ tài liệu.

## Phân loại 22 mục nợ

Một agent đọc toàn bộ mục nợ, đối chiếu với mã và nguồn sống (npm, nodejs.org), chia thành ba loại:

- **AI làm được ngay:** dọn PROGRESS (đợt này) · ca injection cho `eval:tutor`/`eval:companion` + eval chấm bài
  viết (viết được, chạy cần key) · Node 26 phía repo · ảnh tầng 8b bằng dữ liệu giả · giảm chuỗi chunk JS ở
  Từ điển/CEFR.
- **Cần người:** AUD-SEC-005 (thu hồi credential cũ), chạy eval có key, quyết định CEFR `dialogues.json`,
  `ERASED_BENEFIT_LEDGER_KEY` trên VPS, chuyên gia duyệt nội dung, trình đọc màn hình thật, Node 26 trên VPS,
  quyết định sản phẩm (theme `kid`, lối vào trùng, "Đọc tiếp" xuyên thiết bị), chấm AC-8, nơi giữ
  `USER_DATA_MASTER_KEY`, Gemini Live với key thật, đọc log Redis/Sentry/pm2.
- **Vẫn chặn từ thượng nguồn (kiểm 2026-10-28):** TypeScript 7 (`typescript-eslint` peer `<6.1.0`), ESLint 10
  (`eslint-plugin-jsx-a11y` peer `^9`).

## Đã làm

- Mục `@anthropic-ai/sdk` 1.3.0 (🟢, đã xong ở `0677`) dời sang `docs/legacy/no-ky-thuat-da-dong.md`.
- Mục "đợt nâng cấp major stack" (`0414`) dời sang kho lưu: phần còn mở (Node 26, ESLint 10) trùng y hệt mục
  "đợt React 19 + Tailwind 4". Mục đó nay ghi Node 26 đã thành LTS (v26.13.0, 2026-10-28) nên ràng buộc "chờ sau
  2026-10-28" đã hết.
- Mục coverage/bundle (≈ 180 dòng lịch sử) viết lại thành bảng số đo hôm nay; lịch sử dời nguyên văn sang kho
  lưu, mục "Lịch sử đo coverage/bundle".
- Giữ nguyên ý "rail mục lục đứng trước `<h1>`" ở mục audit UI/UX 2026-09-30: liên kết bỏ qua mục lục đã có từ
  #1167 (trước audit), thứ tự DOM vẫn là quyết định thiết kế chưa chốt.

## Số đo (trên mã giống `main` sau #1466)

`npm run test:coverage`: statements 96,23 % · branches 92,16 % · functions 97,01 % · lines 96,95 % (sàn 94/90/94/94).
`npm run budget`: Initial JS 136,83/160 kB (85,5 %) · CSS 23,76/26 kB (91,4 %).
