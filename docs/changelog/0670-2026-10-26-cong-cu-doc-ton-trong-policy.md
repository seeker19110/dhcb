# 0670 — 2026-10-26 — Công cụ đọc của Bạn Đồng Hành tôn trọng policy DENY inject_context

PR #1449. Đợt sửa audit thứ ba: đóng `AUD-SEC-001` (🔴) trong `docs/ops/AUDIT-STATUS.md`.

## Vấn đề

ContextEngine loại trạng thái miền khỏi ngữ cảnh khi người dùng đặt policy
`DENY (authoritative_domain_state, inject_context, <miền>)`, nhưng công cụ `search_notes` của chế độ
tác tử vẫn đọc và trả ghi chú đó cho model qua `tool_result` — vượt qua lựa chọn riêng tư của chính
chủ (không phải đọc chéo người dùng).

## Đã làm

- `packages/core-personal/companionTools.ts`: cổng chung ở `execute` cho MỌI công cụ đọc theo bảng
  `READ_TOOL_DOMAIN` (`search_notes` → `work`; `get_learning_progress`, `get_review_queue` →
  `learning`): kiểm `resolveAuthority(…, 'authoritative_domain_state', 'inject_context', miền)` TRƯỚC khi
  đọc dữ liệu; `DENY` → trả `status: 'blocked_by_privacy'` (không có dữ liệu). Không đọc được policy →
  rơi vào nhánh lỗi sẵn có, không trả dữ liệu (FAIL-CLOSED). `lookup_dictionary` (dữ liệu công khai)
  không kiểm.
- Công cụ vẫn được KHAI cho model (khai báo là đồng bộ); cổng nằm ở tầng THI HÀNH — nơi duy nhất dữ liệu
  đi ra. Ẩn hẳn công cụ khỏi danh sách cần dựng phiên bất đồng bộ — để sau nếu cần.

## Kiểm chứng

- Đỏ-trước: 4 ca mới ở `packages/core-personal/companionTools.test.ts` (DENY work → search_notes;
  DENY learning → 2 công cụ học; lỗi policy → fail-closed) đỏ trên mã cũ, xanh sau sửa; 2 ca đối chứng
  (DENY learning không chặn search_notes; từ điển không kiểm policy). `vitest packages/core-personal`:
  940 đạt / 20 bỏ qua sẵn có.
- Bộ tái hiện audit `policy.mts.txt` trên Postgres 16 thật (DB tạm `dhcb_audit_sec`, đủ migration, xoá
  sau khi chạy): `main` exit 1 (`toolReturnedDeniedContent: true`); bản sửa exit 0
  (`toolReturnedDeniedContent: false`); đối chứng (không policy đọc được, người khác không đọc được,
  ContextEngine chặn) đều đạt.
- `eval:v2:red-team` 54/54, `eval:v2:permissions` 23/23 trên cùng DB. `eval:companion:boundary` profile
  `github-ci` không chạy được ở máy này (cả trên `main`) — cổng thật ở CI.

## Rủi ro và đường lùi

Thêm 1 truy vấn policy cho mỗi lần gọi công cụ đọc. Người dùng có DENY sẽ thấy Bạn Đồng Hành nói không
xem được dữ liệu miền đó — đúng ý đồ. Đường lùi: revert PR.
