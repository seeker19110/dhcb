# 0673 — 2026-10-26 — Client và server dùng chung một hàm gộp SRS

PR #1452. Đợt sửa audit thứ sáu: đóng `AUD-XFEAT-001` (🟠).

## Vấn đề

Khi kéo tiến độ về, `apps/dhcb/src/lib/progressSync.ts` gộp thẻ SRS bằng luật riêng: hoà `reps` thì
bản local luôn thắng. Server (`apps/server/src/api/_lib/progressMerge.ts#mergeSrsMap`) khi hoà `reps`
giữ bản có `due` xa hơn. Hai phía chọn khác nhau ⇒ local giữ lịch cũ (ôn sớm) và mỗi lần pull lại
xếp thêm một lượt đồng bộ thừa, không bao giờ hội tụ.

## Đã làm

- Chuyển `mergeSrsMap` sang `packages/core-learner/srsMerge.ts` (gói dùng chung); server re-export từ
  `progressMerge.ts` nên chỗ gọi và test cũ giữ nguyên.
- Client gọi `mergeSrsMap(cloud, local)` — đúng vai như server (`a` = bản đang lưu, `b` = bản client).
- Thay đổi phụ: thẻ local thiếu `reps` nay coi là -1 như server (trước là 0).

## Kiểm chứng

- Đỏ-trước: ca mới ở `progressSync.test.ts` (local reps3/due100, cloud reps3/due200, pull hai lần) ĐỎ
  với mã cũ; XANH sau sửa: local nhận due200, không POST nào, outbox 0. Thêm ca local có `due` xa hơn
  thì local thắng.
- `packages/core-learner` + `apps/dhcb/src/lib`: 4.234/4.234 đạt; test server progress vẫn xanh.
- `npm run typecheck`, `npm run lint` đạt; CI PR xanh.

## Rủi ro và đường lùi

Luật server không đổi. Không đổi schema. Đường lùi: revert PR.
