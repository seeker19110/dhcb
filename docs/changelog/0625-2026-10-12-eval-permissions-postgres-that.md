# 0625 — `eval:v2:permissions` chạy trên Postgres thật (21 ca, chặn CI) · sửa đặt policy đồng thời ra 500

- **Ngày:** 2026-10-12 · **PR:** #1387 · **Loại:** `fix(personal)`
- **Nguồn việc:** nợ (3) trong mục red-team của `PROGRESS.md` (changelog `0623`); chủ dự án: "tất cả theo
  khuyến nghị".

## Vì sao viết lại

Bản cũ (`scripts/eval-v2-permissions-fixtures.json`, 40 ca) dựng `pg` giả TỰ LỌC policy bằng JS rồi đưa
cho `resolveAuthority` — tức là kiểm chính cái mock, không kiểm câu SQL. 10 ca DENY giống hệt nhau;
không có ca khác người, ghi đè, thu hồi, chạy đồng thời; script chỉ thoát 1 khi DENY bị lách, mọi sai
khác khác vẫn "xanh". Test đi kèm gọi `resolveAuthority` với mock trả sẵn đáp án.

## Đã làm

1. `scripts/eval-v2-permissions-cases.ts` — 21 ca, gieo bằng `setPolicy`/`revokePolicy`, đọc bằng
   `resolveAuthority`, đối chiếu số dòng thật trong `personal.personal_policies`: chưa có policy → null ·
   đủ 7 mức thẩm quyền đọc lại đúng · lệch subject/action/scope → null · thu hồi → null (giữ dòng audit) ·
   ghi đè siết (AUTOMATE→DENY) và nới (DENY→READ), đúng 1 dòng hiệu lực · khác người (AUTOMATE của A
   không sang B; READ của B không gỡ DENY của A; B thu hồi policy của A → 404) · thu hồi hai lần → 409 ·
   AUTOMATE thiếu `review_at` và mức lạ "ROOT" → CSDL từ chối · 5 lần đặt đồng thời.
2. `scripts/eval-v2-permissions.ts` viết lại: chặn `DATABASE_URL` không cục bộ (thoát 2), ca hỏng = 💥 đỏ,
   mọi ca phải đạt (không chỉ DENY). Dùng chung đồ nghề `scripts/red-team/redTeamKit.ts`.
3. `scripts/eval-v2-permissions.test.ts`: test hình dạng (≥ 20 ca, id duy nhất, đủ mọi mức trong
   `AuthorityLevelSchema`, giữ 4 ca bất biến cốt lõi). Xoá fixture JSON.
4. CI: job `sql-prepare` thêm bước `npm run eval:v2:permissions` (~1 giây).
5. **Lỗi thật lộ ra — đã sửa** (`packages/core-personal/policyService.ts#setPolicy`): khi CHƯA có policy
   hiệu lực, `select … for update` không khoá được dòng nào, nên hai lần đặt đồng thời (vd bấm đúp) cùng
   insert; chỉ mục duy nhất `idx_personal_policies_active` chặn một bên bằng `DatabaseError` thô → API
   `/api/personal/personal-policies` trả 500. Dữ liệu vẫn toàn vẹn (chỉ mục làm đúng việc). Nay lỗi 23505
   đúng chỉ mục đó → `ConflictError` (409 "thử lại"); lỗi CSDL khác ném nguyên. Comment cũ nói khoá
   "chống hai request cùng đặt" — đã sửa cho đúng phạm vi.
6. Đính chính "40/40" ở `docs/research/kien-truc-va-ha-tang.md` (Invariant 3 + bảng cổng) và
   `docs/research/dinh-huong-va-ke-hoach-chung.md`; ghi chú đã xoá fixture ở đặc tả V2-19.

## Bằng chứng

- **Đỏ-trước:** stash bản sửa `policyService.ts` → `❌ perm-concurrent … ✗ lỗi không phải 409:
DatabaseError: duplicate key value violates unique constraint "idx_personal_policies_active"`, thoát 1;
  áp lại → `✅ 21/21`, thoát 0. Unit test mới (23505 → ConflictError) đỏ trước, xanh sau; lỗi khác (23514)
  không bị đổi thành 409.

## Cần chủ dự án quyết (ghi ở `PROGRESS.md`)

- Policy `AUTOMATE` đã quá `review_at` vẫn được `resolveAuthority` coi là hiệu lực. Migration 0042 ghi
  "quyền tự động phải có expiry/review" nhưng không chỗ nào đọc `review_at`. Đề xuất: quá hạn thì hạ về
  `EXECUTE_WITH_CONFIRMATION` (chờ xác nhận), không xoá policy. Chưa làm vì là đổi hành vi quyền.
