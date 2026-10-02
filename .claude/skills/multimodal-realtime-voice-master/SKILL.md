---
name: multimodal-realtime-voice-master
description: 'Kỹ năng Nghiệp vụ Âm thanh & Đàm thoại Thời gian thực (Gemini Live qua WebSocket, STT/TTS, ngắt lời, khẩu hình viseme cho avatar, lab phát âm, Echo Shadowing). Kích hoạt khi xử lý luồng âm thanh hai chiều, ghi âm/nhận dạng giọng nói, đọc to TTS, khẩu hình avatar, luyện phát âm hoặc nói đuổi.'
---

# MULTIMODAL REALTIME VOICE & ACOUSTIC MASTER

Quy chuẩn cho mọi thứ dính tới âm thanh trong Đồng Hành: STT/TTS, đàm thoại thời gian thực, avatar
khẩu hình và các lab luyện phát âm.

> **Đối chiếu mã ngày 2026-10-02.** Bản trước của skill này mô tả như ĐÃ CÓ: WebRTC song công, worker
> DSP âm thanh (`audioDspWorker.ts`, `useAudioDsp.ts`), chấm GOP âm học thật — **mã không có**. Nó
> còn đặt chuẩn "≤ 250 ms / ngắt lời ≤ 50 ms" chưa từng được đo. Khi skill và mã lệch nhau, **MÃ
> thắng**. Cấm hiển thị điểm không đo được như điểm thật (changelog 0473 · 0475 · 0478).

---

## 1. STT / TTS — NỀN TẢNG ĐANG CHẠY THẬT

- **STT:** Whisper qua Groq hoặc OpenAI (`/api/stt`, tự chọn theo key có sẵn).
- **TTS:** Google Cloud qua `/api/tts`. Audio cache mã hoá AES-256-GCM, lưu Cloudflare R2
  (`packages/core-ai/fileStorage.ts`). Web Speech API chỉ là đường lùi.
- **Chính sách cache TTS:** KHÔNG BAO GIỜ tự xoá theo "lâu không dùng"; chỉ xoá bản ghi orphan qua
  `npm run seed:all -- --verify --clean-orphans --yes` (CLAUDE.md mục 6).
- Điểm khác biệt sản phẩm: hội thoại bằng giọng ngôn ngữ đích, sửa lỗi bằng **giọng** tiếng mẹ đẻ
  — hai giọng TTS riêng.

---

## 2. ĐÀM THOẠI THỜI GIAN THỰC — GEMINI LIVE QUA WEBSOCKET

- Đường đi: trình duyệt ⇄ WebSocket của server (`packages/core-ai/wsGeminiLiveHandler.ts`,
  `apps/server/src/api/platform/gemini-live.ts`) ⇄ Gemini Live (`packages/core-ai/geminiLiveService.ts`).
  Cấp phép và đếm lượt: `packages/core-ai/geminiLiveAdmission.ts` (`reserveGeminiLiveUsage`).
  Kiểm khói: `scripts/smoke-gemini-live.ts`.
- **Trạng thái:** kết nối WebSocket là THẬT nhưng **CHƯA test với API key thật** — nợ ghi trong
  `PROGRESS.md`. Đừng quảng bá như tính năng đã ổn định.
- **CHƯA CÓ:** WebRTC song công, đo độ trễ khứ hồi, đo độ trễ ngắt lời. Ngắt lời (barge-in) và VAD
  có trong logic service, nhưng con số "≤ 250 ms / ≤ 50 ms" là **mục tiêu chưa đo**. Muốn cam kết
  con số thì đo trước, ghi cách đo vào changelog.
- Luật chung: user action luôn ngắt được giọng AI. Trạng thái voice phải hiểu được cả khi chuyển
  động bị tắt (skill `ui-ux` mục 11.E).

---

## 3. AVATAR & KHẨU HÌNH

- `apps/dhcb/src/components/Companion3D/CyberTutorAvatar3D.tsx` là **Canvas 2D**, không phải WebGL,
  dù tên có "3D". Có dõi mắt theo con trỏ/chạm và chớp mắt.
- Ánh xạ âm vị → khẩu hình: `packages/core-ai/visemeMorphingService.ts`, dải 15 viseme theo chuẩn
  Oculus (`sil`, `PP`, `FF`, `TH`, `DD`, `kk`, `CH`, `SS`, `nn`, `RR`, `aa`, `E`, `ih`, `oh`, `ou`).
- Nâng lên WebGL/three.js là quyết định riêng (bundle + hiệu năng máy yếu), chưa làm.

---

## 4. PHÂN TÍCH ÂM HỌC — CHƯA CÓ ĐO ÂM THANH THẬT

- **CHƯA CÓ:** worker DSP (tự tương quan F0, LPC formant F1/F2). Phân tích hiện chạy trên main thread
  và **không đo từ âm thanh**.
- **Lab phát âm** (`packages/core-ai/acousticPhoneticsService.ts`, `AcousticPhoneticsLab.tsx`):
  - đoán âm sai từ CHÍNH TẢ của câu đã nhận dạng;
  - "Điểm GOP" là công thức gán cứng — nợ 🔴 trong `PROGRESS.md`;
  - phần có giá trị thật để giữ: ma trận lỗi L1 tiếng Việt + mẹo đặt lưỡi.
- Chấm phát âm thật cần forced alignment trên âm thanh (CTC/GOP đúng nghĩa) — việc lớn, cần đặc tả.

---

## 5. ECHO SHADOWING (NÓI ĐUỔI)

`packages/core-ai/echoShadowingService.ts`, API `apps/server/src/api/subjects/english/echo-shadowing.ts`,
giao diện `apps/dhcb/src/components/CompanionVoice/EchoShadowingCard.tsx`.

- **Phương pháp 3 pha** vẫn là chuẩn sư phạm:
  1. nghe chủ động;
  2. nói đuổi với độ trễ ngắn;
  3. nói độc lập rồi so với bản mẫu.
- **Thực tế điểm số:** thẻ gửi lên độ trễ và độ chính xác âm vị là **số ngẫu nhiên**
  (`Math.random()`), server tính "Band" từ đó — tức band hiện cho học viên **không đo gì cả**. Nợ 🔴
  trong `PROGRESS.md`.
- **Luật:** không thêm điểm/band mới cho shadowing khi chưa đo được độ trễ và độ khớp âm vị từ bản
  ghi âm thật.
