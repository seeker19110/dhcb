# 0479 — Chuyển skill đợt 3: `stem-science-reasoning-master` · `memory-palace-cognitive-scaffolder` · `multimodal-realtime-voice-master` (2026-10-02)

- **Ngày:** 2026-10-02 · **PR:** #1214 · **Loại:** `chore(skills)`.
- **Nối tiếp:** đợt 1 (0477, PR #1212), đợt 2 (0478, PR #1213); cùng phương án chủ dự án đã duyệt.

## Kết quả rà từng skill (đối chiếu mã 2026-10-02)

### `stem-science-reasoning-master`

| Bản cũ khẳng định                                                               | Thực tế                                                                                                                       | Bản mới                                                                                               |
| ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| "Deterministic Step Validator": biến đổi đại số, đếm nguyên tử, kiểm thứ nguyên | Bộ kiểm chỉ bắt vài lỗi gán cứng + đáp số 3 đề mẫu (0473)                                                                     | Ghi đúng 3 trạng thái `valid`/`invalid`/`unverified`, luật "không chứng minh được thì không báo đúng" |
| **Bắt buộc LaTeX** cho mọi công thức                                            | App **không render LaTeX** (không KaTeX/MathJax); nội dung bài học viết bằng Unicode (²: 700+ chỗ, ₂: 1.000+ chỗ, `\frac`: 0) | Luật mới: hiển thị cho học viên bằng Unicode; LaTeX phẳng chỉ ở ô nhập bảng nháp                      |
| `api/stem-scratchpad.ts`, `apps/english/...`                                    | `apps/server/src/api/learning/...`, `apps/dhcb/...`                                                                           | Sửa đường dẫn; thêm Vision Solver có thật (`vision-solve.ts`, có đếm lượt)                            |

### `memory-palace-cognitive-scaffolder`

| Bản cũ khẳng định                                                        | Thực tế                                                                                    |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| `cognitiveLoadRegulator.ts` (chỉ số tải nhận thức CLI tự hạ/nâng độ khó) | Không tồn tại                                                                              |
| `remConsolidationService.ts` ("hợp nhất trí nhớ chu trình REM")          | Không tồn tại. Ôn tập thật là **FSRS** qua thư viện `ts-fsrs` (`apps/dhcb/src/lib/srs.ts`) |
| Cung điện "3D/Isometric"                                                 | Thẻ + danh sách điểm neo; 5 chủ đề phòng đúng như enum                                     |
| "Chỉ số tự nhận thức MAI"                                                | Tính từ **số từ** bài viết + thưởng theo số bẫy nhận ra — không phải thang MAI chuẩn       |
| Bẫy tư duy                                                               | Có, nhận diện bằng từ khoá                                                                 |
| Morning briefing "trước khi người dùng thức giấc"                        | Sinh khi được gọi, theo luật từ dữ liệu, **không gọi AI**, không có lịch                   |

Sửa kèm: chú thích trong `srs.ts` trỏ tới `docs/research/sm2-den-fsrs-2026-07-16.md`, nhưng **file
này không còn trong repo**. Skill nay trỏ thẳng tới chú thích đầu `srs.ts`.

### `multimodal-realtime-voice-master`

| Bản cũ khẳng định                                                     | Thực tế                                                                                                                     |
| --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| WebRTC song công, độ trễ ≤ 250 ms, ngắt lời ≤ 50 ms                   | Không có WebRTC; đường thật là WebSocket ⇄ Gemini Live, **chưa test với key thật** (nợ trong PROGRESS); con số chưa từng đo |
| `audioDspWorker.ts`, `useAudioDsp.ts` (F0 tự tương quan, LPC formant) | Không tồn tại                                                                                                               |
| GOP âm học (công thức log-likelihood)                                 | Heuristic chính tả + điểm gán cứng (đã ghi ở 0478)                                                                          |
| Avatar "3D"                                                           | Canvas 2D; dõi mắt và 15 viseme có thật                                                                                     |

Bản mới thêm phần STT/TTS đang chạy thật và chính sách cache TTS.

## Phát hiện lỗi SẢN PHẨM khi rà (ghi nợ, chưa sửa trong PR này)

1. 🔴 **Echo Shadowing hiện "Band" từ số NGẪU NHIÊN.**
   - `EchoShadowingCard.tsx` gửi lên `measuredLatencyMs: Math.floor(Math.random() * 80) + 380` và
     `phonemeAccuracy: Math.floor(Math.random() * 10) + 88`.
   - Server tính band từ hai số đó.
   - Kết quả: học viên thấy điểm band không đo gì cả.
   - Cùng họ lỗi với lab phát âm (0478).
2. 🟡 **"Chỉ số tự nhận thức"** của nhật ký phản tỉnh là đại lượng thay thế bằng số từ. Không được
   dùng để xếp hạng hay đưa lên màn hình chính.

## Bằng chứng

- `scripts/skills-mirror.test.ts`: 26/26 xanh (8 skill). Mọi đường dẫn trong repo mà 3 skill mới
  nhắc tới đều tồn tại; bản gương trùng từng byte.
- Script nháp soát định danh: các mục bị báo chỉ là route/lệnh (`/api/stt`, `/consult`…).
- Đã đọc trực tiếp các file trước khi viết:
  - `stemScratchpadService.ts`, `vision-solve.ts` (có `checkAndConsumeUsage`);
  - `memoryPalace.ts` (enum chủ đề), `srs.ts`, `metacognitiveReflectionService.ts`,
    `proactiveBriefingService.ts`;
  - `echoShadowingService.ts`, `EchoShadowingCard.tsx`, `geminiLive*`, `visemeMorphingService.ts`.
