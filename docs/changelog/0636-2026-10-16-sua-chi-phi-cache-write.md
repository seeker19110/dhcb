# 0636 — Không tính trùng phần input đã ghi cache

- **Ngày:** 2026-10-16 · **PR:** [#1401](https://github.com/seeker19110/dhcb/pull/1401) · **Loại:** `fix(ai)`.
- **Goal:** [stored](../goals/2026-10-16-stored-upgrades.md), slice S03a chuẩn bị cho
  [S03 đã duyệt](../specs/2026-10-16-stored-s03-turn-tracing.md).

## Lỗi và sửa

`parseAnthropicUsage` đã cộng input thường, cache read và cache write thành tổng prompt.
Calculator chỉ trừ cache read khỏi phần chịu giá thường, rồi cộng thêm giá cache write;
do đó phần ghi cache bị tính hai lần. Sửa công thức trừ cả hai nhóm cache, giữ tổng token.
Theo registry hiện hữu, ca 100 thường/200 đọc/300 ghi đổi từ 0,00159 thành 0,00099 USD.
Đây là ước tính telemetry, không phải hóa đơn hoặc giá gói người học.

Đối chiếu [hợp đồng usage của provider](https://platform.claude.com/docs/en/build-with-claude/prompt-caching#tracking-cache-performance):
ba nhóm input rời nhau. Không đổi registry giá, TTL, quota, SQL, schema, billing hoặc lịch sử.
Tài liệu hiện hành còn có cache-read multiplier riêng cho Sonnet/Opus 5.5; cập nhật giá
ngoài phạm vi bugfix này. Không tuyên bố số ước tính hiện hữu khớp hóa đơn tuyệt đối.

## Kiểm chứng

- Node22: thêm oracle số học độc lập cho zero/no-cache/read-only/write-only/mixed/output,
  tracker và đường parser → SQL params. Trước sửa: 6 test đỏ/24 xanh, exit 1.
- Sau sửa: 5 file/91 test gồm parser, calculator, SDK/tool loop và replay đạt, exit 0.
- DB disposable riêng: 20 lời gọi recorder đồng thời, đúng một dòng cộng dồn/tổng token,
  cost 0,0278 USD cho ca có thêm 40 output; cleanup scoped UUID còn 0 dòng. Môi trường
  rỗng ngoài cấu hình test local; không provider, dữ liệu production hoặc `.env`.
- Codemap trước sửa đạt: calculator impact 91 và aiTokenUsage impact 87; đã rà hai caller
  trực tiếp. Typecheck strict tập trung cho bốn file thay đổi đạt, exit 0.
- Build cục bộ và chẩn đoán typecheck toàn API dừng vì RAM/swap gần đầy (exit143);
  không có lỗi semantic được báo. Giữ nguyên tsconfig/threshold, không can thiệp tiến
  trình khác. Build/typecheck toàn dự án và coverage phải đạt trên CI đúng head trước
  merge. Lint (0 cảnh báo), format:check và `npm test -- --maxWorkers=2` cục bộ exit 0:
  952 file passed/5 skipped, 21.491 test passed/35 skipped, 391,93 giây. Không thêm skip.
  Lượt unit cục bộ này không đo coverage; coverage gate nguyên vẹn vẫn chạy trên CI.

## Rollout và rollback

Chỉ các bản ghi chi phí mới dùng phép tính đã sửa; không backfill dữ liệu cũ. Ghi SQL
atomic hiện hữu không đổi; không thêm cơ chế thu tiền, entitlement hoặc trần chi tiêu.
Không migration/dependency. Rollback bằng revert slice, không sửa số liệu lịch sử.
