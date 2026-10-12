# 0627 — Policy AUTOMATE quá hạn duyệt lại (`review_at`) hạ về chờ xác nhận

- **Ngày:** 2026-10-12 · **PR:** #1389 · **Loại:** `fix(personal)`
- **Nguồn việc:** nợ (3b) trong mục red-team của `PROGRESS.md` (lộ ra ở changelog `0625`); chủ dự án
  chốt "theo khuyến nghị, không cần người xác nhận".

## Vấn đề

Migration `0042` và mục 7 kiến trúc bắt quyền tự động "phải có expiry/review" — CSDL buộc
`AUTOMATE` có `review_at`. Nhưng không chỗ nào ĐỌC `review_at`: `resolveAuthority` chỉ lọc
`revoked_at is null`, nên một policy AUTOMATE có hiệu lực vĩnh viễn kể cả khi đã quá hạn duyệt lại.
Hệ quả: đề xuất của Companion cho capability đó (vd `learning.update_goal`) vẫn TỰ CHẠY không hỏi.

## Đã làm

1. `packages/core-personal/policyService.ts#resolveAuthority`: đọc thêm cờ
   `review_at is not null and review_at <= now()` (đồng hồ Postgres). AUTOMATE quá hạn →
   `EXECUTE_WITH_CONFIRMATION`; các mức khác giữ nguyên (DENY không bao giờ bị nới). Không sửa dòng
   trong CSDL (policy append-only) — người dùng đặt lại policy là AUTOMATE trở lại.
   Cả ba nơi gọi (`proposeAction`, `executeAutomatedAction`, `buildContextPackage`) nhận hành vi mới
   qua một chỗ duy nhất; `proposeAction` không tự chạy với `EXECUTE_WITH_CONFIRMATION`.
2. Unit test: AUTOMATE quá hạn → hạ mức; còn hạn → giữ; DENY quá hạn → giữ DENY.
3. `eval:v2:permissions` thêm 2 ca (`perm-automate-review-due`, `perm-automate-review-ahead`) ⇒ 23 ca.
4. `eval:v2:red-team` thêm `rt-ag-15`: AUTOMATE cho mục tiêu học, đối chứng còn hạn ⇒ `committed`,
   quá hạn ⇒ `pending` ⇒ 54 ca.
5. Tài liệu: `PROGRESS.md` (3b ✅), `docs/ops/ai-eval-red-team.md`, `docs/research/kien-truc-va-ha-tang.md`.

## Bằng chứng

- **Đỏ-trước** (trả `policyService.ts` về bản cũ, rồi khôi phục): `❌ rt-ag-15 … quá hạn: committed`,
  red-team thoát 1; `❌ perm-automate-review-due … resolveAuthority=AUTOMATE`. Áp bản sửa: `✅ 54/54`,
  `✅ 23/23`.
- `check:sql` ✅ (câu SQL mới PREPARE được trên schema thật).

## Ghi chú

- API vẫn nhận `reviewAt` ở quá khứ khi đặt AUTOMATE; policy đó có hiệu lực như chờ xác nhận ngay từ
  đầu — an toàn, không cần chặn thêm.
- Chưa có giao diện nào hiển thị policy, nên không có chỗ nào hiện "AUTOMATE" gây hiểu nhầm.
