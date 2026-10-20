# 0651 — 2026-10-20 — W-003: vệ sinh mã + tài liệu theo audit (F-002 · F-003 · F-004 · F-005 · F-006 · F-010)

Đóng sáu phát hiện mức Thấp của `docs/audit/2026-10-20-audit-toan-dien.md`, đợt W-003 của
"làm tất cả". Không đổi hành vi người dùng thấy; không migration.

## Việc đã làm

- **F-004 — gộp hai bản `pickRandom` chép tay.** Thêm `sample(arr, n, rng)` vào
  `packages/core-contracts/shuffle.ts` (Fisher–Yates một phần, không đụng mảng gốc, `n` ngoài
  biên kẹp về `[0, length]`). `apps/dhcb/src/lib/dictionaryApi.ts` (`fetchRandomEntries`) và
  `apps/server/src/api/subjects/english/dictionary.ts` (`pickRandom`) dùng chung hàm này. Test
  mới: bản sao/không trùng, ca biên `n` lớn/0/âm/mảng rỗng/lẻ, phân bố đều 200.000 lượt với
  RNG xác định (không flaky).
- **F-003 — xoá `apps/dhcb/src/components/Celebration.tsx`** (75 dòng, 0 import kể từ P1-6
  2026-09-17 khi `SessionDone` thành overlay duy nhất); sửa chú thích `lib/confetti.ts:2` nói
  đúng nơi nạp (`SessionDone.tsx`).
- **F-002 — `PROGRESS.md` mục nợ mã hoá:** thân mục không còn tự mâu thuẫn với tiêu đề — ghi rõ
  module đã nối ở 2 chỗ (2FA, intake), còn nợ tên/email/tiến độ + backfill.
- **F-005 — 4 chỗ số liệu cũ:** `PROGRESS.md` "21 bảng" → 26 (kèm mốc); chú thích
  `e2e/a11y.spec.ts` / `e2e/a11y-aaa.spec.ts` "15 trang × 5 theme" → trỏ về mảng route thật × 3
  theme (**chỉ chú thích**, cổng không đổi — hook `config-protection` đã chặn lần đầu đúng thiết
  kế, nói rõ rồi mới sửa); `docs/framework/QUY-TRINH-AUDIT.md` Tầng 11 bước 4 ghi đúng kỳ vọng
  `/api/health/deep` 429 khi không Redis ở production.
- **F-006 — `scripts/maintenance-sweep.sh`:** phép đếm TODO bỏ `packages/subject-programming/
{lessons,specializations}/` (đề bài cho học viên, không phải nợ). Trước: 64 file → 🟡; nay đếm
  đúng mã nguồn.
- **F-010 — `TRAPS.md` mục 31:** bẫy "Chromium cài sẵn ≠ bản Playwright ghim" kèm cách rà
  (`browsers.json` vs `--version`) và cổng chốt.

## Kiểm chứng

- `vitest run` shuffle + dictionaryApi + dictionary: xanh; eslint 0 cảnh báo; Prettier sạch; `tsc`
  3 tsconfig (app · api · e2e) 0 lỗi; `bash -n` script maintain. Cổng đầy đủ ở CI của PR.
- Không file nào trong `.claude/skills`, `.agents/skills`, `docs/` còn trỏ tới `Celebration.tsx`
  (test gương skill không bị ảnh hưởng).

## Không làm

- F-007 (biên CSS) chỉ ghi nhận; F-008 (`eval:tutor` với key thật) là việc tay chủ dự án; F-009
  đi đợt W-004 riêng vì chạm giao diện (phải chụp ảnh trước/sau).
