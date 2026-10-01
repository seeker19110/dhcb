# 0467 — Tích hợp OpenCodeReview (alibaba) vào `/review` ở chế độ delegation (2026-10-01)

- **Ngày:** 2026-10-01 · **PR:** (điền khi tạo) · **Loại:** `chore(review)`.
- **Quyết định:** [`docs/adr/0012-open-code-review-delegation.md`](../adr/0012-open-code-review-delegation.md)

## Việc đã làm

- Nghiên cứu `alibaba/open-code-review` v1.12.11 (Apache-2.0): CLI Go, lọc file 6 cổng + luật theo
  glob + chế độ delegation không cần LLM.
- Thêm `.opencodereview/rule.json` — 8 luật DHCB theo đường dẫn: migration lũy đẳng · handler API
  (validateAuth + user_id từ token, Zod, SQL tham số, đếm lượt AI, SePay HMAC/idempotency) · prompt
  (golden snapshot + eval, hai chiều A/B) · prompt Lập trình · gói `@dhcb/*` (import, luật phụ thuộc,
  giới tính không làm trục năng lực) · frontend (token màu, a11y, slug URL, lessonsLoader) · CI
  (`quality`/`e2e` bất biến) · quy ước chung.
- npm script `review:ocr` / `review:ocr:preview` (npx ghim 1.12.11, không đổi lockfile).
- `/review` thêm Bước 1b: lấy file + luật từ OCR, review đủ từng file, báo độ phủ.
- Test canh `scripts/ocr-rules-policy.test.ts`: luật `**/*` phải đứng cuối, mọi luật gộp với luật
  hệ thống, không trùng path, luật API còn đòi validateAuth.

## Bằng chứng

- `ocr rules check` trên 6 file mẫu: mỗi file khớp đúng luật dự định (API → `apps/server/src/api/**`,
  migration → `postgres/migrations/*.sql`, hub → `apps/{dhcb,hub}/src/**`…).
- `ocr delegate preview --from origin/main~3 --to HEAD`: 91/178 file cần review, JSON hợp lệ.

## Chưa làm (chờ chủ dự án quyết)

- GitHub Action review tự động mọi PR — tốn tiền LLM mỗi lần push, cần secret. Xem ADR-0012.
