# 0318 — 2026-09-15 — Đặc tả nền nâng trải nghiệm học

**PR:** [#920](https://github.com/seeker19110/dhcb/pull/920) · **Nhánh:** `codex/learning-ux-01-spec` · **Base:** `45195feb` (#919).

## Thay đổi

- Thêm [goal](../goals/2026-09-15-learning-ux.md) từ template, chia 13 slice tuần tự, mỗi subagent một PR.
- Thêm [spec nền](../specs/2026-09-15-learning-ux-foundation.md): AC cho hỏi nhanh trung thực, dialog/lỗi/renderer và mục lục môn/khóa độc lập shellbar.
- Đối chiếu guest mode mới: đọc/học không bắt login, Companion private cần giữ nháp qua login; không auto gọi paid AI khi mở trang.
- Ghi reuse TocRail/Modal, bằng chứng audit cũ có giới hạn, giữ authority completion/mastery/billing và guest limits.

## Trạng thái và kiểm tra

S01 chờ merge; S02 **Approved for implementation** sau review của agent chính, chỉ được code sau merge spec. S03 trở đi cần review riêng; goal **NOT COMPLETE**. Chưa thay source, tạo prototype hoặc đo hiệu quả sản phẩm. S04–S13 cần spec nhỏ trước code.

Node22.23.2: Prettier check ba tài liệu **PASS**; `git diff --check` **PASS**. Không dùng test count từ commit cũ, không yêu cầu full gate cho docs-only.

## Rủi ro và rollback

Không runtime/schema/migration thay đổi. Revert ba tài liệu nếu cần. Merge/deploy chưa được cho phép rõ ràng; main có tự deploy. Các quyết định còn mở và next slice S02 được ghi trong goal.
