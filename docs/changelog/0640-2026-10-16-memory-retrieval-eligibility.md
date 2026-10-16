# 0640 — Giữ điều kiện hiệu lực khi đọc bổ sung ký ức

- **Ngày:** 2026-10-16 · **PR:** [#1405](https://github.com/seeker19110/dhcb/pull/1405) · **Loại:** `fix(memory)`.
- **Goal/spec:** [stored S05a](../goals/2026-10-16-stored-upgrades.md),
  [S05 Approved](../specs/2026-10-16-stored-s05-memory-retrieval-benchmark.md), đã merge #1399.

## Lỗi và thay đổi

Lexical/semantic query có thể lấy ID trước khi ký ức hết hạn, bị vô hiệu hoặc được nâng mức
nhạy cảm. Query nền loại bản mới nhưng bước tải ID thiếu chỉ kiểm person/id, nên đưa bản
không còn đủ điều kiện trở lại search; expired/invalidated còn có thể tới Context Engine.
Missing SELECT nay kiểm lại status, valid_to và sensitivity như các query ứng viên.

Provider embedding reject được xử lý riêng để vẫn dùng nhánh chữ/nền. Catch chỉ bao lời gọi
embedding; lỗi SQL lexical/semantic/base/hydration tiếp tục được ném. Không thêm log nội dung,
không đổi ranking, giới hạn, consent, thẩm quyền, usage, giá, schema hoặc dependency.

## Kiểm chứng

- Test-first 8 đỏ/19 xanh trước source; sau sửa + foreign controls retrieval29/29, targeted 5 file/201 test đạt.
  Mock SQL-aware không tự lọc khi thiếu predicate. Cả hai nguồn ID có ba trạng thái xấu,
  positive live ngoài base, default/explicit provider reject và bốn lỗi SQL không bị nuốt.
- PostgreSQL16 disposable: 20 ký ức nền khiến target live ở ngoài LIMIT. Query lexical thật
  lấy ID, barrier trước base gọi service expire/invalidate/merge nâng sensitivity trên kết
  nối khác. Ba target không được trả; live control vẫn được tải, không trả người khác.
  Kiểm trạng thái/version/access_count thật; `touch:false` ở proof này.
- Cùng oracle PG với source main cũ đỏ đúng vì trả expired; source sửa exit0 bốn case.
  Dọn own UUID residual0, bốn audit baseline giữ nguyên. Test không gọi provider trả phí,
  không dữ liệu production. Đây không phải cam kết revoke sau snapshot đã đọc.
- Node22: build/typecheck/lint0 cảnh báo/format:check exit0; unit coverage 961 file,
  21.630 pass/35 skip sẵn có,373,43s; coverage96,13/92,05/96,91/96,84%, giữ sàn94/90/94/94.
  Replay7/7, check:specs191; browser transport8/8 đạt, gồm hai buffering controls.
  Typecheck cuối sau xóa dist exit0 (69,01s); CI exact head phải đạt trước merge.
  Chưa tuyên bố slice đã tích hợp hoặc benchmark hoàn tất.

## Rollout và rollback

Không migration hoặc flag mới. Revert PR để rollback. Corpus bảo mật S04 và baseline S05
vẫn là việc riêng; không suy chất lượng semantic từ vector giả hoặc các ca SQL này.
