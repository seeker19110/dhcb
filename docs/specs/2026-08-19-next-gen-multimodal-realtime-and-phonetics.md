# Feature spec: Next-Gen Multimodal Realtime Voice & Acoustic Phonetics Engine (Platform V4 Phase 1)

| Thuộc tính   | Giá trị                              |
| ------------ | ------------------------------------ |
| Issue        | #v4-01-multimodal-realtime-phonetics |
| Spec owner   | Platform Core Team                   |
| Trạng thái   | **Approved for implementation**      |
| Người duyệt  | Architecture Owner                   |
| Ngày duyệt   | 2026-08-19                           |
| Lần cập nhật | 2026-08-19                           |

> Trạng thái: **Approved for implementation** — Không giới hạn chi phí, tối ưu hoá trải nghiệm đàm thoại thời gian thực và đánh giá âm học đỉnh cao.

> **Cập nhật 2026-10-08 (changelog 0534):** `/api/realtime-multimodal` cùng `packages/core-ai/realtimeMultimodalService.ts` và `packages/core-contracts/realtimeMultimodal.ts` đã GỠ — không client nào gọi, Map phiên trong bộ nhớ không dọn. Đàm thoại thời gian thực thật đi qua `/api/gemini-live`.

---

## 1. Tóm tắt quyết định

Nâng cấp toàn diện hạ tầng thoại và âm học của Đồng Hành từ cơ chế REST/Chunking phân mảnh lên **Full-Duplex Realtime Multimodal Streaming** (kết nối trực tiếp Gemini 2.0 Multimodal Live API / OpenAI Realtime) và **Acoustic Phonetics GOP Engine** (đo đạc âm học cấp độ âm vị, formant, cao độ F0 và căn chỉnh thời gian âm vị). Đạt độ trễ đàm thoại < 250ms, cho phép ngắt lời tự nhiên (Barge-in), nhận diện cử động âm học và cung cấp phản hồi sửa lỗi phát âm tức thì.

---

## 2. Vấn đề, người dùng và bằng chứng

- **Persona/job-to-be-done**: Học viên luyện phản xạ giao tiếp tiếng Anh tự nhiên và luyện phát âm chuẩn bản xứ không bị giật cục hay gượng gạo.
- **Hiện trạng & Pain point**: Luồng thoại REST cũ phải chờ học viên nói hết câu -> gửi base64 -> STT Whisper -> LLM sinh chữ -> TTS tạo file -> tải về phát. Tổng độ trễ từ 1.5s - 3.5s, làm mất nhịp đối thoại tự nhiên và không thể ngắt lời AI giữa chừng.
- **Mục tiêu**: Đưa độ trễ xuống < 250ms qua luồng streaming liên tục 2 chiều (Bidirectional Audio Streaming), hỗ trợ Voice Activity Detection (VAD) và đánh giá chi tiết GOP (Goodness of Pronunciation) từng âm vị.

---

## 3. Nghiên cứu hiện trạng

### Code và luồng hiện tại

- `packages/core-ai/realtimeVoiceService.ts`: State machine cơ bản, cần mở rộng thành Full-Duplex Multimodal Engine.
- `packages/core-ai/articulatoryPhoneticsService.ts`: Dữ liệu hướng dẫn giải phẫu miệng, cần tích hợp thêm ma trận GOP và căn chỉnh âm vị tự động.
- `packages/core-ai/wsVoiceHandler.ts`: WebSocket thoại, nâng cấp hỗ trợ giao thức Gemini 2.0 Live / OpenAI Realtime frames.

---

## 4. Phương án và quyết định

| Phương án                                                     | Lợi ích                                                   | Chi phí / Rủi ro                | Kết luận        |
| :------------------------------------------------------------ | :-------------------------------------------------------- | :------------------------------ | :-------------- |
| **A. Giữ nguyên REST Chunking**                               | Chi phí thấp                                              | Độ trễ cao, trải nghiệm rời rạc | ❌ Loại bỏ      |
| **B. WebSockets Full-Duplex Streaming + Acoustic GOP Engine** | Độ trễ < 250ms, ngắt lời tự nhiên, độ chính xác âm vị 99% | Cần hạ tầng streaming liên tục  | ✅ **Lựa chọn** |

---

## 5. Outcome và guardrails

- **Metric chính**: Độ trễ từ khi dứt câu đến khi AI phát âm thanh đầu tiên: $\le 250\text{ms}$.
- **Độ chính xác âm học**: GOP scoring bắt đúng 100% các biến thể lỗi âm vị L1 tiếng Việt.
- **Guardrail**: Xử lý rớt mạng tự động tái kết nối với Exponential Backoff; fallback mượt mà khi mạng yếu.

---

## 6. Scope và non-goals

### In scope

- Hợp đồng dữ liệu `realtimeMultimodal.ts` (V4 Schemas).
- Động cơ đàm thoại `realtimeMultimodalService.ts` quản lý phiên duplex, VAD, Barge-in, và Audio PCM streaming.
- Động cơ phân tích âm học `acousticPhoneticsService.ts` tính toán GOP score, Formant analysis, Phoneme timing alignment.
- API Handlers `api/realtime-multimodal.ts` và `api/acoustic-phonetics.ts`.
- Giao diện người dùng `RealtimeMultimodalLiveOrb.tsx` và `AcousticPhoneticsLab.tsx` tích hợp tại `/dong-hanh`.

### Non-goals

- Chưa triển khai hardware VR headset SDK (dành cho Phase 3 Spatial Holodeck).

---

## 7. Yêu cầu chi tiết (Requirements)

### Functional Requirements

- **FR-1**: Khởi tạo và duy trì phiên Full-Duplex Audio Session giữa Client và Backend Server qua WebSocket song công.
- **FR-2**: Tự động phát hiện khi người dùng cất giọng để tạm dừng phát âm thanh của AI ngay lập tức (Barge-in trong vòng 50ms).
- **FR-3**: Đánh giá chi tiết câu nói của học viên theo ma trận GOP: Độ chính xác âm vị ($\text{Phoneme Accuracy}$), Độ trôi chảy ($\text{Fluency}$), Trọng âm và Ngữ điệu ($\text{Prosody & Pitch}$), và Căn chỉnh thời gian âm vị ($\text{Phoneme Alignment}$).

### Non-Functional Requirements

- **NFR-1**: Type Safety 100% với Zod schemas (`REALTIME_MULTIMODAL_VERSION = 'v4.0.0'`).
- **NFR-2**: WCAG AAA/AA compliance trên toàn bộ UI components.
- **NFR-3**: 100% Unit & Integration Test Coverage cho toàn bộ contracts và services.

---

## 8. Data Contracts & Architecture

```typescript
export const REALTIME_MULTIMODAL_VERSION = 'v4.0.0'

export interface MultimodalAudioChunk {
  sessionId: string
  sequence: number
  pcmBase64: string
  sampleRate: number
  isFinal: boolean
  timestamp: string
}

export interface AcousticGopScore {
  phoneme: string
  targetIpa: string
  gopScore: number // 0 - 100
  status: 'correct' | 'distorted' | 'omitted' | 'inserted'
  durationMs: number
  startTimeMs: number
  endTimeMs: number
  f0Hz?: number
}
```

---

## 9. Kế hoạch Kiểm thử (Test Plan)

- **Unit Tests**: Kiểm thử toàn diện các hàm biến đổi PCM, tính toán RMS, phát hiện Barge-in, thuật toán tính điểm GOP.
- **Integration Tests**: Kiểm thử vòng đời phiên đàm thoại (Start $\rightarrow$ Stream $\rightarrow$ Interruption $\rightarrow$ Evaluation $\rightarrow$ End).
- **Quality Gates**: Đảm bảo `npm run build`, `npm run typecheck`, `npm run lint`, `npm test` đều đạt 100% xanh.
