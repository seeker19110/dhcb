# 0482 — Đấu trường PvP: nói rõ đối thủ là AI, hiện Elo thật thay số gán cứng (2026-10-02)

- **Ngày:** 2026-10-02 · **PR:** (điền sau khi tạo) · **Loại:** `fix(pvp)`.
- **Quyết định:** chủ dự án chọn "Đổi hẳn tên nhân vật" (2026-10-02) cho nợ 🔴 ở changelog 0480.

## Vấn đề

Đấu trường 1v1 **chỉ có đối thủ AI**, nhưng giao diện khiến người học tưởng đang đấu với người:

- tên kiểu người thật, kèm cờ quốc gia ("Elena Oxford 🇬🇧", "Minh Cambridge");
- số trận/thắng của nhân vật là số bịa ("89 trận, thắng 62");
- không chỗ nào ghi "AI".

Chụp ảnh Tầng 8b lộ thêm hai chỗ hiện số không thật ở màn kết thúc trận:

- **Elo gán cứng** `+16` / `0` / `-14` theo thắng/hoà/thua, nối chuỗi với dấu `+` cố định nên trận
  thua hiện **"+-14 Elo Rating"**. Elo thật server cộng vào hồ sơ (`match.eloChanges`, K = 32) thì
  không được hiện.
- **"+120 Exp"** (thua thì "+30 Exp") và nút "Hoàn tất & **Nhận Thưởng**", trong khi `rewardExp`
  không được cộng vào đâu cả.

Ngoài ra thẻ và sảnh ghi "Bảng xếp hạng **tuần**", nhưng `realLeaderboard` là top 10 Elo toàn thời
gian.

## Đã làm

- `packages/core-ai/pvpArenaService.ts`:
  - `GHOST_RIVALS` (nay export để test) đổi thành tên bot rõ ràng, ≤ 12 ký tự: Bot Tutor 🤖,
    Bot Oxford 📘, Bot Ưng 🦅, Bot Chớp ⚡, Bot Nova 🌟, Bot Rồng 🐉;
  - bỏ cờ quốc gia;
  - số trận/thắng/chuỗi của bot đặt 0. Mô phỏng lượt bot chỉ dựa vào Elo, nên đổi này không ảnh
    hưởng độ khó.
- `PvPBattlefieldModal.tsx`:
  - thêm nhãn **"Đối thủ AI"** trên tên đối thủ;
  - màn kết thúc hiện Elo thật (`formatEloDelta(match.eloChanges.player1Delta)` → `+16` / `0` /
    `−14`, dấu trừ thật);
  - bỏ ô Exp; nút đổi thành "Hoàn tất".
- `apps/dhcb/src/lib/pvpEloDelta.ts` (mới): `formatEloDelta`.
- Thẻ (`PvPArenaCard.tsx`) và sảnh (`PvPArenaLobbyModal.tsx`): ghi "Đấu với đối thủ AI", bỏ chữ
  "tuần", bỏ "Elo Rating chuẩn quốc tế".
- Skill `gamification-viral-growth-architect` (hai bản gương): luật trung thực PvP theo mã mới, kèm
  ghi chú bảng xếp hạng.

## Phát hiện thêm (ghi nợ, chưa sửa)

🟡 **Bảng xếp hạng PvP hiện tên thật của người dùng cho mọi người chơi.** Truy vấn lấy
`coalesce(profiles.nickname, users.name)`, nên ai chưa đặt biệt danh sẽ lộ tên tài khoản. Không có
bước đồng ý tham gia. Việc này đụng dữ liệu người dùng thật, nên chờ chủ dự án chọn hướng.

## Bằng chứng

- Test mới, mỗi cái **đỏ trên mã cũ, xanh trên mã mới** (đã chạy thử với bản cũ của component):
  - `pvpArenaService.test.ts`: mọi bot có tên bắt đầu "Bot ", dài ≤ 12 ký tự, không cờ quốc gia;
    30 lần ghép trận đều cho số trận/thắng/chuỗi = 0;
  - `PvPBattlefieldModal.test.tsx`: có chữ "Đối thủ AI"; màn kết thúc trận thua hiện "−14 Elo",
    không có "+-", "Exp" hay "Nhận Thưởng";
  - `pvpEloDelta.test.ts`: +16 / −14 / 0.
- Tầng 8b — ảnh trước/sau ở 1440px và 390px gồm thẻ, sảnh, màn trận đấu, màn kết thúc:
  - ảnh "trước" xác nhận hai lỗi "+-14 Elo Rating" và "+30 Exp";
  - lần chụp đầu, tên "Bot Phượng Hoàng" bị cắt thành "Bot Phượn…" ở 390px → rút tên còn ≤ 12 ký
    tự và thêm ca test độ dài;
  - ảnh cuối không còn chữ bị cắt.
- Cổng: xem mô tả PR.
