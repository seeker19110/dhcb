# 0517 — Cấu hình seed giọng ElevenLabs: 6 giọng nam/nữ + cờ `--eleven` có ước tính chi phí (2026-10-08)

- **Ngày:** 2026-10-08 · **PR:** (điền số PR khi tạo) · **Loại:** `refactor(tts)` · **Nhánh:**
  `claude/happy-babbage-cqddtx`.
- **Nguồn:** yêu cầu của chủ dự án trong phiên: "cấu hình để dùng API của ElevenLabs seed giọng cho
  dự án". Chủ dự án chốt: seed **toàn bộ nội dung có TTS câu**, **nhiều giọng nam + nữ**.

## Đã làm

- **6 giọng** thay cho 1 (`Rachel`): thêm `Alice` · `Matilda` (nữ), `Eric` · `Daniel` · `Chris` (nam).
  Bảng `ELEVEN_VOICES` ở `packages/core-ai/elevenLabsTts.ts` là nguồn duy nhất (tên → `voice_id` thật
  - giới tính). `voice_id` lấy từ `GET https://api.elevenlabs.io/v1/voices` (danh sách premade công
    khai, không cần key) — không dựa vào trí nhớ.
- `generateAudioFromElevenLabs(text, voice)` nhận giọng; `/api/tts` truyền đúng giọng người dùng chọn
  (trước đây luôn đọc bằng Rachel dù chọn giọng nào).
- Server hạ giọng theo **đúng giới tính** (`Eric` hết quyền → `Puck`, `Alice` → `Kore`).
- Client `voiceTiers.ts`: thêm 5 giọng vào `VoiceId` · `VOICE_OPTIONS` · `ELEVEN_VOICE_IDS`; vẫn loại
  khỏi bể random như Rachel cũ.
- `scripts/seed-all.ts` — cờ **`--eleven`** (mặc định TẮT): thêm tác vụ 6 giọng vào curriculum · cefr ·
  hội thoại · Cụm từ · challenge, nối SAU CÙNG; `hashText` bỏ `lang` cho ElevenLabs đúng như `/api/tts`;
  giới hạn request song song (`ELEVENLABS_SEED_CONCURRENCY`, mặc định 3); lưu `viseme_timeline` thật;
  **in ước tính credit rồi bắt gõ "yes"** (không bàn phím thì cần `--yes`); `--check` chỉ in ước tính;
  **`--eleven-budget=N`** cắt mỗi lượt ở N ký tự theo thứ tự ưu tiên để chia việc theo hạn mức tháng.
- `.env.example`, `docs/seed-guide.md` mục 8 mô tả cách dùng.

## Quyết định / phát hiện

- **Quy mô thật (đo bằng `loadPatternTasks`): ~421.071 audio · ~15,9 triệu ký tự.** Rất lớn so với hạn
  mức gói ElevenLabs thông thường → thêm trần ngân sách và cổng xác nhận thay vì để `--all` tự tiêu.
- Từ điển không seed ElevenLabs vì `/api/pronunciation` từ chối giọng này (có sẵn từ trước).
- **Bẫy bắt được bằng test:** `tasks.push(...mảngKhổngLồ)` tràn stack với ~420k phần tử → đổi sang vòng lặp.
- **`Rachel` không có trong danh sách premade hiện hành** của ElevenLabs. Giữ nguyên vì audio đã cache
  khoá theo tên giọng; chưa kiểm được còn gọi được không (cần key thật). Nếu lỗi `voice not found`
  khi seed → loại khỏi `ELEVEN_VOICES` (tên mới thì tạo hash mới, không phá cache cũ).

## Chưa làm / việc tay

- **Chưa chạy seed thật** — phiên không có `ELEVENLABS_API_KEY` và chạy sẽ tốn tiền thật. Chủ dự án
  điền key vào `.env` trên VPS rồi chạy `npm run seed:all -- --eleven --check` để xem ước tính.
- Chất lượng tiếng Việt của `eleven_multilingual_v2` vẫn chưa kiểm định — nghe thử trước khi seed lớn.

## Bằng chứng

- `npm run typecheck` ✅ · test mới: `elevenLabsTts` (+4) · `voiceAccess` (+2) ·
  `scripts/eleven-voices-parity.test.ts` (3) · `scripts/seed-all-eleven.test.ts` (9).
