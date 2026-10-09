# 0563 — Gỡ scaffolding giả còn sót từ `cf44362`: phòng âm thanh không client, stress-test lỗi, 3 chỗ số giả (2026-10-09)

- **Ngày:** 2026-10-09 · **PR:** (điền sau khi tạo) · **Loại:** `refactor(server)`
- **Nguồn:** mục (4) của nợ 🟡 "Gemini Live" trong `PROGRESS.md` — "audit lại các file V6.x/V7.0
  cùng thời điểm commit `cf44362` xem có scaffolding giả". Tiền lệ cùng khuôn: `0484` (gỡ điểm GOP
  giả), `0513` (gỡ `/ws/voice-companion`, `/ws/co-learning-room`), `0534` (gỡ
  `/api/realtime-multimodal`).

## Kết quả audit (đọc mã, `rg` + `git log`)

1. **`/api/co-learning-audio`** (handler + `audioCoLearningService` + hợp đồng
   `audioCoLearningRoom`): **0 client** trong `apps/dhcb/src` lẫn `apps/hub/src` từ PR #628/#644
   (2026-08-24). `processAudioChunk`/`subscribeToRoomEvents`/`broadcastAiSocraticHint` là mã chết từ
   khi `0513` gỡ kênh WebSocket. Map phòng trong bộ nhớ không có TTL: `MAX_ROOMS = 100` đầy là khoá
   tạo phòng vĩnh viễn tới lần khởi động lại — lỗ DoS rẻ. Thẻ VIP còn quảng cáo "Phòng học nhóm bằng
   âm thanh".
2. **`scripts/stress-test.ts`** (`npm run stress:test`): không gửi header auth nên mọi request bị
   401, nhưng `status < 500` được đếm là thành công; kịch bản `pvp-arena?action=lobby_state` không
   tồn tại; không tài liệu/test nào nhắc.
3. **Cung điện trí nhớ:** `retentionStrength: 70 + Math.floor(Math.random() * 25)` hiển thị
   `{n}%` ở `MemoryPalaceExplorerModal` như độ bền đo được.
4. **Vision Solver:** thiếu `GEMINI_API_KEY` → trả "Mock simulation" `confidence: 0.95`,
   `finalAnswer: 'Đáp số đã được xác minh chính xác.'` SAU KHI handler đã trừ lượt. Nhánh AI trả sai
   khuôn JSON cũng ghép 3 "bước giải" mẫu cố định (`f(x) = 0`, công thức nghiệm bậc hai) kèm cùng câu
   "đã được xác minh".
5. **Thẻ "3D Articulatory Phonetics & Pitch Alignment":** nút "Kiểm tra Phát âm" không ghi âm gì;
   client gửi `scoreEstimate: Math.random()*15 + 85`; server sinh đường pitch "người học" = pitch mẫu
   (4 điểm sinh bằng công thức) + nhiễu `Math.random()`; `alignmentScore`/`overallPhoneticScore` lấy
   thẳng từ số client tự gửi; giao diện hiện "Khớp N%" và vẽ hai đường cong **cố định trong JSX**
   (không dùng dữ liệu trả về).

**Đính chính changelog `0513`** (không sửa file cũ): mục "Giữ REST `/api/co-learning-audio` … vì
route đó vẫn dùng" là sai — route có gắn ở `routes.ts` nhưng không client nào gọi từ 2026-08-24.

## Đã làm

- **Gỡ (mục 1, 2):** xoá `apps/server/src/api/learning/co-learning-audio.ts` (+ test),
  `packages/core-ai/audioCoLearningService.ts` (+ test), `packages/core-contracts/audioCoLearningRoom.ts`
  (+ test), `scripts/stress-test.ts`; bỏ import + `app.all('/api/co-learning-audio')` ở
  `apps/server/src/routes.ts`, lệnh `stress:test` ở `package.json`, mục route ở `docs/FEATURE-MAP.md`,
  đoạn "· Phòng học nhóm bằng âm thanh / Audio co-learning rooms" ở dòng VIP của
  `UpgradeSection.tsx` (vi + en; không có test/golden nào canh câu chữ này). 7 file xoá = 1 899 dòng.
- **Cung điện trí nhớ (mục 3):** hằng `INITIAL_RETENTION_STRENGTH = 0`; độ bền chỉ đổi qua
  `verifyLocusRecall` (đường tăng THẬT đã có: đúng +15, sai −5) — nay **kẹp [0, 100]** (trước đây sai
  lần đầu từ 0 sẽ ra −5, vi phạm hợp đồng `min(0)`). Modal hiện **"Chưa ôn"** khi điểm neo chưa có
  `lastRecalledAt`, chỉ hiện "%" sau lần ôn đầu. Test: giá trị khởi tạo xác định, kẹp biên, và test
  tĩnh "nguồn không còn `Math.random`".
- **Vision Solver (mục 4):** `VisionSolverUnavailableError` (`AppError` 503 `vision_unavailable`) khi
  thiếu key; `VisionSolverBadOutputError` (502 `vision_bad_output`) khi AI trả sai khuôn —
  `parseVisionSolutionText` trả `null` thay vì bịa bước. Handler `vision-solve.ts` đã có sẵn nhánh
  `catch` → `refundUsage` + `toErrorBody` nên không phải sửa. `core-ai/tsconfig.json` thêm reference
  `core-errors`. Client `visionSolverApi.ts` đọc được cả lỗi khuôn `{error:{message,code}}` (trước
  sẽ hiện "[object Object]"). Test: thiếu key → 503 + `refundUsage('user-1','chat',day)`; sai khuôn →
  502; nguồn không còn "Mock"/câu "đã được xác minh chính xác".
- **Thẻ khẩu hình (mục 5, khuôn 0484):** service bỏ `generatePitchContour`/`analyzePhoneticsAndPitch`;
  hợp đồng bỏ `PitchSample`/`PitchContourData`/`PhoneticAnalysisReport` + `PHONETICS_SCHEMA_VERSION`;
  POST `/api/articulatory-phonetics` trả **501 `PITCH_ANALYSIS_UNAVAILABLE`**; GET không còn
  `getOrCreatePerson` (không cần CSDL — dữ liệu tĩnh) và trả 400 khi `phoneme` sai (trước là 500).
  Giao diện bỏ nút "Kiểm tra Phát âm" + khối "Đường cong Ngữ điệu F0 … Khớp N%", tiêu đề còn
  "3D Articulatory Phonetics", mô tả ghi rõ "không ghi âm, không chấm điểm", thêm dòng "Từ ví dụ".
  Pitch MẪU cũng sinh bằng công thức (không có nguồn) nên gỡ luôn, không giữ làm "đường minh hoạ".
  Đi kèm: `e2e/a11y-interactive-states.spec.ts` đổi trạng thái quét thành "chọn âm khác (thẻ đang
  chọn + hướng dẫn)", mock e2e bỏ `PHONETIC_REPORT`; `DesignSystem.design.test.ts` bỏ file này khỏi
  danh sách "CTA dùng `buttonClass`" (thẻ không còn CTA).
- **Skill** (cả `.claude/skills/` và `.agents/skills/`): `multimodal-realtime-voice-master` (§4
  ghi gỡ Pitch Alignment), `memory-palace-cognitive-scaffolder` (luật độ bền), `stem-science-reasoning-master`
  (Vision Solver không có nhánh giả lập), `ui-ux` (thẻ khẩu hình không điểm).
  `pedagogy-linguistics-master` không mô tả phần nào vừa gỡ — không đổi.
- `PROGRESS.md`: mục (4) nợ Gemini Live → ✅ + câu hỏi chờ quyết.

## Chưa làm — chờ chủ dự án

- **Gemini Live** (`/api/gemini-live`, `/ws/gemini-live`): mã THẬT (mở WebSocket tới Google) nhưng
  **chưa có client nào** trong `apps/`. Giữ / gỡ / xây client — chủ dự án quyết; đợt này không đụng.
- Dòng VIP "Nói chuyện trực tiếp với gia sư bằng giọng, ngắt lời được như người thật (đang thử
  nghiệm)" ở `UpgradeSection.tsx` quảng cáo chính tính năng chưa có client đó.

## Phát hiện ngoài phạm vi (ghi lại, chưa sửa)

- `apps/dhcb/src/lib/visionSolverApi.ts` gọi `/api/vision-solve` **không gửi header
  `Authorization`** → mọi lượt giải ảnh ở production nhận 401 (handler `validateAuth`).
- `docs/FEATURE-MAP.md` đã lệch so với `npm run gen:feature-map` từ trước đợt này (sinh lại ra 60
  route giao diện / 112 endpoint thay vì 104 / 111, kéo theo ~200 dòng thay đổi không liên quan) —
  đợt này chỉ xoá tay mục `/api/co-learning-audio`, chưa sinh lại; cần rà bộ sinh riêng.
- Điểm neo Cung điện trí nhớ tạo TRƯỚC đợt này vẫn mang độ bền ngẫu nhiên cũ trong CSDL (ẩn sau
  "Chưa ôn" tới lần ôn đầu; lần ôn đầu cộng/trừ trên nền số cũ). Không viết migration dọn.
- `confidence: 0.98` cố định ở nhánh thật của Vision Solver không phải số đo (giao diện không hiển
  thị trường này).

## Bằng chứng

- Cổng: `rm -rf packages/*/dist dist dist-server && npm run typecheck` · `npm run lint` (0 cảnh báo)
  · `npm run build:packages && npx tsc -p tsconfig.server.json` · vitest các thư mục chạm tới ·
  `npm run check:docs` · `npm run check:specs` · `codemap impact` — kết quả dán ở mô tả PR.
- **Tầng 8b** (Playwright, dev server riêng cổng 5263, theme Blue sky, mock API của
  `e2e/helpers/companionInteractiveMocks.ts`; ảnh không commit):
  - Thẻ khẩu hình TRƯỚC 1440/390: sau khi bấm "Kiểm tra Phát âm" hiện "Khớp 88%" + hai đường cong
    — không có ghi âm nào. SAU 1440: tiêu đề "3D Articulatory Phonetics", mô tả "không ghi âm,
    không chấm điểm", hàng 8 âm vị, mặt cắt miệng + "Từ ví dụ" + lỗi hay mắc + 3 bước; không khoảng
    trống chỗ nút cũ. SAU 390: tiêu đề + nhãn xuống dòng gọn, hàng âm vị cuộn ngang trong thẻ;
    `scrollWidth − innerWidth = 0` ở cả hai cỡ.
  - Modal Cung điện trí nhớ SAU 1440/390: điểm neo chưa ôn hiện nhãn "Chưa ôn", điểm neo đã ôn hiện
    "15%"; nhãn không tràn ở 390.
