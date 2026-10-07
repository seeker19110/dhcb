# 0513 — Gỡ hai kênh WebSocket không client nào gọi (2026-10-07)

- **Ngày:** 2026-10-07 · **PR:** chưa tạo (commit cục bộ) · **Loại:** `refactor(server)`.
- **Nối tiếp:** changelog 0465, nợ bảo mật (2) — chủ dự án chốt "gỡ".

## Việc đã làm

Gỡ `/ws/voice-companion` và `/ws/co-learning-room` (không có client nào trong `apps/` gọi):

- Xoá `wsVoiceHandler`, `wsCoLearningHandler`, `realtimeVoiceService` (chỉ `wsVoiceHandler` dùng),
  `coLearningRoomService` (chỉ có test dùng) cùng các file test của chúng; xoá
  `scripts/stress-test-ws.ts` và lệnh `stress:test:ws`.
- `apps/server/src/server.ts` bỏ hai lệnh gắn WebSocket.
- **Giữ** REST `/api/co-learning-audio`, `audioCoLearningService` và lược đồ
  `audioCoLearningRoom` vì route đó vẫn dùng.

## Bằng chứng

`npm run typecheck` · `npm run lint` (0 cảnh báo) · test `packages/core-ai`, `apps/server`,
`packages/core-contracts`; `grep` không còn tham chiếu tới các file đã xoá ngoài changelog cũ.
