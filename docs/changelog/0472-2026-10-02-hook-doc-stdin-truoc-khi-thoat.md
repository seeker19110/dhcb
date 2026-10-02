# 0472 — Hook đọc hết stdin trước khi thoát: sửa EPIPE làm CI đỏ chập chờn (2026-10-02)

- **Ngày:** 2026-10-02 · **PR:** [#1207](https://github.com/seeker19110/dhcb/pull/1207) · **Loại:** `fix(harness)`.
- **Vì sao:** CI của PR #1206 đỏ ở job `unit`: `scripts/agent-config-security.test.ts › ALLOW_GATE_EDIT=1
tắt hook có chủ đích` ném `spawnSync bash EPIPE`. Lỗi không thuộc #1206 — nằm trong hook
  `config-protection.sh` vào `main` từ PR #1201 (đợt `0468`, do chính mình viết).

## Nguyên nhân gốc

Hook thoát (`exit 0` khi bật biến bỏ qua, thiếu `jq`, thiếu Prettier, thiếu bản đồ codemap…)
TRƯỚC dòng `payload="$(cat)"`. Bên gọi đang ghi payload vào stdin thì nhận EPIPE nếu tiến trình
con thoát trước — tranh chấp thời gian, chỉ lộ ra khi runner CI chậm. Cùng lỗi ở 5/7 hook.

## Việc đã làm

- 5 hook (`auto-format.sh`, `block-dangerous-git.sh`, `block-pipe-to-shell.sh`,
  `config-protection.sh`, `shared-file-reminder.sh`) + `usage-guard.sh` (cùng khuôn, chỉ chưa lộ
  vì máy có `jq`): dời `payload="$(cat)"` lên trước mọi `exit`. KHÔNG đổi hành vi chặn/cho qua nào.
- `scripts/claude-hooks.test.ts`: ca "mọi hook đọc hết stdin trước khi thoát" chạy TỪNG hook trong
  `.claude/hooks/` với payload 200 KB (vượt bộ đệm pipe 64 KB → tranh chấp xảy ra chắc chắn) ở
  nhánh thoát sớm của nó, dùng `execFileSync` (ném EPIPE giống hệt test đã đỏ trên CI).
- `TRAPS.md` mục 17 — khuôn lỗi + cách rà + cổng chốt chặn.

## Bằng chứng

- Tái hiện TRƯỚC khi sửa: payload 200 KB + biến bỏ qua → `config-protection.sh` EPIPE 20/20,
  `block-pipe-to-shell.sh` EPIPE 20/20.
- Cổng mới chạy trên hook CŨ (stash bản sửa): 5 hook đỏ; trên hook ĐÃ SỬA: xanh hết.
  `scripts/claude-hooks.test.ts` + `scripts/agent-config-security.test.ts`: 68/68.
- Các file hook là cổng: `config-protection.sh` từ chối lần chạm đầu từng file, thử lại sau khi
  nêu lý do (sửa lỗi tranh chấp, không nới cổng) thì qua.
- Chép cùng thay đổi sang PR #1206 để nó xanh (thay đổi tự trùng khớp khi PR này merge trước).
