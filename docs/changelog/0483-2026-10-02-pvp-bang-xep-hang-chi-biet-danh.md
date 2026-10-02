# 0483 — Bảng xếp hạng PvP chỉ hiện biệt danh, thôi lộ tên tài khoản (2026-10-02)

- **Ngày:** 2026-10-02 · **PR:** (điền khi tạo) · **Loại:** `fix(pvp)`.
- **Quyết định:** chủ dự án chọn phương án (a) cho nợ 🟡 ghi ở changelog 0482: "chỉ biệt danh, ai
  chưa có thì hiện Học viên #N".

## Vấn đề

`realLeaderboard` (`apps/server/src/api/platform/pvp-arena.ts`) lấy top 10 Elo kèm
`coalesce(profiles.nickname, users.name)`. Ai chưa đặt biệt danh thì **tên tài khoản** (thường là
họ tên đầy đủ) hiện cho mọi người chơi khác. Người dùng không có bước nào đồng ý công khai tên.

## Đã làm

- `pvp-arena.ts`:
  - truy vấn bảng xếp hạng chỉ đọc `p.nickname`, không còn đọc `u.name`;
  - hàm mới `leaderboardName(nickname, rank)`: có biệt danh (đã cắt khoảng trắng) thì dùng biệt
    danh, còn không thì "Học viên #<hạng>".
- `displayName` (tên hồ sơ của **chính** người chơi, chỉ người đó thấy) giữ nguyên.
- `pvp-arena.test.ts`:
  - mock ghi lại câu SQL đã chạy; test mới khẳng định câu SQL bảng xếp hạng không chứa `u.name`;
  - test fallback đổi thành "Học viên #1";
  - thêm test đơn vị cho `leaderboardName` (null, undefined, chỉ khoảng trắng, có khoảng trắng hai
    đầu).
- Skill `gamification-viral-growth-architect` (cả `.claude/` và `.agents/`) ghi luật mới.
- Nợ chuyển từ `PROGRESS.md` sang `docs/legacy/no-ky-thuat-da-dong.md`.

## Không làm

- `playerId` trên bảng xếp hạng vẫn là id người dùng (client chỉ dùng làm React `key`). Đây là
  định danh nội bộ, không phải thông tin cá nhân; muốn ẩn hẳn thì cần đổi hợp đồng
  `packages/core-contracts/pvpArena.ts` → đợt riêng nếu chủ dự án muốn.

## Bằng chứng

- `npx vitest run apps/server/src/api/platform/pvp-arena.test.ts`: 22/22 xanh.
- **Đối chứng âm:** chạy cùng bộ test trên `pvp-arena.ts` cũ (chỉ thêm hàm `leaderboardName` để
  import được) → 2 test đỏ: fallback "Học viên #1" và "SQL không đọc `u.name`".
