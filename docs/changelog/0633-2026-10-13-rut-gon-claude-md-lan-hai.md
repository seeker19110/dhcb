# 0633 — Rút gọn CLAUDE.md lần hai: 33.940 → 24.270 ký tự, không mất dòng nào

- **Ngày:** 2026-10-13 · **PR:** #PENDING · **Loại:** `docs(claude-md)`
- **Nguồn việc:** mục 5 trong `docs/research/2026-10-13-goi-y-nang-cap.md` (changelog `0630`). Chủ
  dự án giao: "làm mục 5".

## Vấn đề

`CLAUDE.md` được nạp vào **mọi** phiên Claude Code. File dài 33.940/34.000 ký tự, tức chỉ còn 60 ký
tự trống trước trần của `scripts/claude-md-split.test.ts`. Thêm bất kỳ luật nào cũng sẽ làm cổng đỏ.
Trong file có nhiều phần là mô tả hoặc danh mục chứ không phải luật: danh mục tài liệu, mô tả stack,
cấu trúc thư mục, danh sách từng hook và subagent, ảnh chụp trạng thái từ 2026-09-06.

## Đã làm

1. **Dời NGUYÊN VĂN 22 khối sang `docs/claude-md-chi-tiet.md`.** Mỗi khối nằm dưới mục `§` cùng số
   với mục trong CLAUDE.md, trong đoạn "Dời nguyên văn từ CLAUDE.md (changelog 0633)". Những gì được
   dời:
   - §1: mô tả chi tiết hai chiều học và ba chế độ của môn Anh.
   - §2: danh mục tài liệu đầy đủ.
   - §4: lý do không ép AAA toàn site, mô tả chi tiết cổng a11y.
   - §6: mô tả stack, AI, gói dịch vụ, deploy, phiên bản, lệnh, cấu trúc workspace, luật import.
   - §7: danh sách subagent, OpenCodeReview, codemap, nạp lười bài học, HTML dựng sẵn, quy ước URL.
   - §8: danh sách hook, các cổng CI phụ, eval prompt, golden snapshot, cổng xanh giả.
   - §13 (mục mới): ảnh chụp trạng thái 2026-09-06.
2. **CLAUDE.md giữ luật, viết gọn hơn.** Mọi mệnh lệnh (PHẢI / KHÔNG / đừng / BẮT BUỘC) vẫn ở lại.
   Mỗi chỗ rút gọn có một dòng trỏ `docs/claude-md-chi-tiet.md` §X, và test đã kiểm mục §X đó có
   thật. Các mục §3, §5, §9–§12 (quy trình PR, chống ảo giác, cổng merge, quy ước Git/CI) giữ
   nguyên văn.
3. **Hạ trần** trong `scripts/claude-md-split.test.ts` từ 34.000 xuống **26.000** ký tự để giữ
   thành quả. Còn khoảng 1.700 ký tự cho luật mới. Chạm trần thì dời phần lý do của luật cũ trước,
   đừng nâng trần.

## Quyết định

- **Đo bằng ký tự, không bằng số dòng.** Đề xuất 0630 đặt mục tiêu "dưới khoảng 200 dòng". Số dòng
  chỉ giảm từ 336 xuống 282, vì nhiều luật trước đây nằm trên một dòng rất dài (tới hơn 900 ký tự)
  nay được ngắt ở khoảng 100 ký tự. Phần nạp vào phiên tính theo ký tự: **−28,5%**.
- **Không rút tiếp các mục toàn luật cốt lõi** (§3 quy trình PR, §4 bảo mật/a11y, §11 bốn bước tạo
  PR). Rút nữa sẽ phải bỏ sắc thái của luật, và đó là rủi ro lớn hơn phần ký tự tiết kiệm được.

## Bằng chứng

- `npm run check:claude-md -- origin/main` →
  `✔ Mọi dòng của CLAUDE.md ở origin/main còn nguyên văn ở CLAUDE.md hoặc docs/claude-md-chi-tiet.md.`
- `npm run check:docs` → OK: mọi `/lệnh` của `.claude/commands/` vẫn được CLAUDE.md khai.
- `claude-md-split`, `skills-mirror`, `agent-config-security`, `no-control-chars`, `changelog`:
  95/95 test xanh.
- Một lỗi bắt được khi tự đọc lại: đoạn "SQL phải chạy được trên schema thật" vẫn còn, trùng với
  dòng "Cổng CI khác" mới. Đã dời nguyên văn đoạn đó sang §8.
- Cổng commit đầy đủ: xem mô tả PR.

## KHÔNG làm

- Không sửa nội dung luật nào. Đợt này chỉ đổi chỗ đặt chữ và cách viết.
- Mục 1 (`opusplan`) và mục 6 (TypeScript 6) của tài liệu 0630: như changelog `0632`.
