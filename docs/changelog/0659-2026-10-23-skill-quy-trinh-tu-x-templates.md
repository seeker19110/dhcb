# 0659 — 2026-10-23 — Thêm 5 skill quy trình từ X-Templates (có `/autopilot`)

PR (điền khi mở). Chủ dự án yêu cầu "lấy từ x-templates": chép 5 skill mà `xt.py doctor` báo thiếu
sau khi cài khung 3.15.3 bằng `--no-harness` (changelog `0658`): `autopilot`, `audit`, `blueprint`,
`research`, `handover` — từ `seeker19110/x-templates` main `1023a46`, vào `.claude/skills/` và bản
gương `.agents/skills/`; nội dung giữ nguyên upstream, chỉ khác định dạng do Prettier của repo.

## Quyết định

- Không chép `adr`, `gate`, `review` của khung: DHCB đã có lệnh cùng tên ở `.claude/commands/`
  (luật của chính khung 3.15.3: lệnh riêng của dự án thắng skill khung).
- Không đổi `.claude/settings.json`/hook — chỉ thêm file skill mới, không đè file nào.
- `scripts/skills-mirror.test.ts`: thêm ngoại lệ hẹp 3 đường dẫn (`docs/autopilot/PLAN.md`,
  `docs/ops/AUDIT-STATUS.md` do skill tạo ra khi chạy; `docs/gaps.md` thuộc repo đang được nghiên
  cứu). Chọn sửa test thay vì sửa chữ trong skill để nội dung giữ nguyên upstream.
- Luật "bớt hỏi" (ADR-0008 của khung) cho `CLAUDE.md` mục 3/7/9/12: bộ phân loại quyền chặn agent
  tự sửa `CLAUDE.md` — để chủ dự án áp tay, không lách.

## Kiểm chứng

- `scripts/skills-mirror.test.ts` + `scripts/agent-config-security.test.ts` xanh; lint, typecheck,
  format:check, check:docs đạt.
