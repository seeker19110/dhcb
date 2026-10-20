# 0648 — 2026-10-20 — Audit toàn diện theo quy trình 11 tầng (chỉ đọc, báo cáo)

Người dùng gọi `/audit`. Chạy đủ `docs/framework/QUY-TRINH-AUDIT.md` mục 2 trên `main` @ `17ce6b0f`
(#1414), nhánh `claude/modest-archimedes-tjsh0m`. **Không sửa mã** (nguyên tắc 1.2) — đợt này chỉ
thêm báo cáo `docs/audit/2026-10-20-audit-toan-dien.md` + file nhật ký này + một dòng "Tiếp theo"
trong `PROGRESS.md`. Mọi phát hiện có mã `F-001…F-009` và đề xuất test `D-1…D-8`, chờ chủ dự án
duyệt chia đợt.

## Kết quả tóm tắt

- **Cổng chặn đều xanh:** build · typecheck · lint 0 cảnh báo · format · unit 22.465/22.465 (35 skip)
  **3 lượt liên tiếp cùng số** · size JS 136,66/160 kB (85,4 %) · CSS 23,74/26 kB (91,3 %) · coverage
  96,01/91,89/96,92/96,73 % (sàn 94/90/94/94) · `check:docs` · `check:specs` (191) · `check:sql`
  (686 câu) · `npm audit --omit=dev` 0 · `maintain` 🔴 0.
- **Bảo mật:** 14/14 dòng OWASP 2b đạt, có bằng chứng file:dòng; 104/109 handler `validateAuth`, 5
  công khai có chủ đích.
- **Đường cài mới (Tầng 11):** Postgres tạm trong container, `schema.sql` + 100/100 migration, lần 2
  lũy đẳng, `/api/health` 200; `/api/health/deep` trả 429 vì không Redis + `NODE_ENV=production`
  (rate limit fail-closed — đúng thiết kế từ changelog 0581).
- **Ngẫu nhiên (Tầng 10):** `shuffle.ts` đo 400.000 lượt: 24,98 | 24,98 | 25,04 | 25,00 %.
- **Ảnh chụp (Tầng 8b):** 6 trang trụ cột × 1440/390 px; 0 câu chữ lặp; trang dài nhất (Lập trình
  3140/4232 px) có hàng chip nhảy mục.
- **E2E:** xem mục Kiểm chứng.

## Phát hiện (chi tiết + đề xuất ở báo cáo)

0 mức Cao. 1 mức Trung: **F-001** mã mời bạn bè / phiên chia sẻ vị trí sinh bằng `Math.random`
(`friends.ts:12`, `locationService.ts:19`) trái quy ước `crypto.randomInt` đã dùng ở referral, email
verification, companion link, SePay — có rate limit IP nên khó khai thác thật. 7 mức Thấp: PROGRESS
mục mã hoá tự mâu thuẫn (F-002) · `Celebration.tsx` mồ côi (F-003) · `pickRandom` chép 2 nơi (F-004)
· 4 chỗ số liệu tài liệu cũ (F-005) · `maintain` đếm TODO trong nội dung bài học (F-006) · biên CSS còn
2,26 kB (F-007) · hai lối vào cùng đích ở `/goc-hoc-tap` (F-009). Cần người dùng: **F-008** chạy
`eval:tutor` với key thật ghi baseline mới (model chính đã đổi sang Claude 2026-10-10, baseline vẫn
Groq 2026-08-26).

## Không chạy được trong container (ghi rõ, không suy diễn)

Tầng 4 (không key AI) · Tầng 8 Lighthouse production (máy đang chịu tải E2E, số đo sẽ sai) · Tầng 9
(không quyền VPS/Sentry) · chạy tay 3 chế độ Chat/Viết/Nói (không backend/key).

## Kiểm chứng

Mọi số trên đọc từ output thật trong lượt này (log ở scratchpad phiên). Lệnh đã chạy: `npm ci`,
`npm run build`, `typecheck`, `lint`, `format:check`, `test` ×3, `test:coverage`, `size`, `codemap
-- cycles/orphans`, `check:docs`, `check:specs`, `check:sql` (trên DB tạm), `maintain`, `npx tsx
scripts/run-pg-migrations.ts` ×2, `node dist-server/server.js` + curl health, Playwright chụp 12 ảnh,
`npm run test:e2e`. Hai tác tử chỉ-đọc: đối chiếu 6 khẳng định PROGRESS với mã (5 KHỚP, 1 LỆCH) và
rà coverage HTML tìm nhánh chưa phủ (8 đề xuất, tôi mở mã đối chiếu D-1/D-3/D-6).

E2E: 1467 pass / 5 skip / 1 đỏ trong 51,2 phút (2 worker). Ca đỏ
`lesson-animation-reduced-motion.spec.ts:118` chạy riêng đỏ 5/5 → không phải flaky theo tải; nguyên
nhân là container dùng Chromium 141 cài sẵn còn Playwright 1.64 ghim Chromium 156 (CI dùng bản ghim,
cùng HEAD 6/6 mảnh xanh). Thí nghiệm tối giản chứng minh Chromium 141 giữ `CSSAnimation` đã WAAPI
`pause()` khi media đổi sang `reduce` (3 → 3) trong khi không pause thì huỷ đúng (3 → 0). Ghi F-010,
không sửa/skip test.
