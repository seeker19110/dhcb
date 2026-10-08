# 0534 — Gỡ `/api/realtime-multimodal`; `/api/pronunciation` trừ lượt khi gọi Google TTS (2026-10-08)

- **Ngày:** 2026-10-08 · **PR:** (chưa tạo — commit trên nhánh worktree) · **Loại:**
  `refactor(server)` + `fix(billing)`
- **Nguồn:** đề xuất (a)(b) của 0526, chủ dự án duyệt 2026-10-08 ("theo hướng chất lượng cao nhất").

## 1. Gỡ endpoint phiên không client nào gọi

Đề xuất (a) của 0526 nêu 3 endpoint giữ phiên trong `Map` bộ nhớ không bao giờ dọn:
`/api/realtime-multimodal`, `/api/scenario-holodeck`, `/api/socratic-diagnostics`. Luật giao việc:
chứng minh không client nào gọi TRƯỚC khi gỡ; phát hiện nơi gọi thật thì DỪNG endpoint đó.

### Bằng chứng nơi gọi (grep toàn repo, trừ `docs/changelog/`)

Tìm theo đường dẫn API, tên handler, tên service, tên hàm service, tên hợp đồng
(`realtime-multimodal|scenario-holodeck|socratic-diagnostics|realtimeMultimodal|scenarioHolodeck|
socraticDiagnostics|MultimodalSession|HolodeckSession|listPredefinedScenarios|processHolodeckTurn|
listMisconceptions|SocraticSession|submitSocraticReflection`) trong `apps/dhcb`, `apps/hub`, `e2e/`,
`scripts/`, `docs/specs/`, `.claude/`, `.agents/`, `packages/`.

| Endpoint                    | Nơi gọi thật                                                                                                                                                                                                                                                                                          | Kết luận                   |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| `/api/realtime-multimodal`  | **Không có.** Chỉ handler + test của nó, service + test, hợp đồng + test, `routes.ts`, `docs/FEATURE-MAP.md`, 2 đặc tả 2026-08-19 (mô tả, không gọi), `docs/legacy/`. Không client nào fetch; `websocketEndpoint` `/ws/realtime-multimodal` nó trả về cũng KHÔNG có máy chủ WebSocket nào lắng nghe.  | **Gỡ**                     |
| `/api/scenario-holodeck`    | **CÓ:** `apps/dhcb/src/components/CompanionVoice/ScenarioHolodeckCard.tsx` (GET qua `useCatalogList` + 3 `fetch` POST start/turn/finalize), gắn ở `StudioLabs.tsx` → `pages/companion/Companion.tsx` (`activeStudio === 'labs'`). Thêm `e2e/companion-catalog-states.spec.ts` mock đúng endpoint này. | **GIỮ — dừng gỡ, báo lại** |
| `/api/socratic-diagnostics` | **CÓ:** `apps/dhcb/src/components/CompanionVoice/SocraticDiagnosticsCard.tsx` (3 `fetch`: GET danh sách, POST start, POST reflect), gắn ở `StudioCognitive.tsx` → `pages/companion/Companion.tsx` (`activeStudio === 'cognitive'`).                                                                   | **GIỮ — dừng gỡ, báo lại** |

Hai endpoint giữ lại vẫn còn rủi ro gốc (Map phiên không dọn — dù đã có rate limit 60/phút/IP và
kiểm chủ phiên từ 0526). Việc siết (trần phiên/người, TTL) cần chủ dự án quyết riêng.

### Đã gỡ

- `apps/server/src/routes.ts`: bỏ import + `app.all('/api/realtime-multimodal', …)`, để lại comment
  giải thích. Đường này nay rơi vào `app.all('/api/*splat')` của `server.ts` → **404**
  `{ error: 'API route không tồn tại' }` như mọi route không tồn tại.
- Xoá `apps/server/src/api/platform/realtime-multimodal.ts` + `.test.ts`.
- Xoá `packages/core-ai/realtimeMultimodalService.ts` + `.test.ts` (Map `activeMultimodalSessions`)
  — `npm run codemap -- impact` cho thấy chỉ handler trên import.
- Xoá `packages/core-contracts/realtimeMultimodal.ts` + `.test.ts` — chỉ service trên import.
- `docs/FEATURE-MAP.md`: bỏ mục endpoint, tổng 112 → 111 endpoint. Sửa TAY, không chạy
  `npm run gen:feature-map`: generator hiện sinh ra diff 211 dòng (bản đồ route giao diện đã lệch
  từ trước, ngoài phạm vi đợt này).
- Hai đặc tả `docs/specs/2026-08-19-next-gen-multimodal-realtime-and-phonetics.md` và
  `docs/specs/2026-08-19-3d-embodied-cyber-tutor-and-viseme-morphing.md`: thêm một dòng "Cập nhật
  2026-10-08" ghi rõ phần đã gỡ (không đổi nội dung đặc tả).
- Skill `.claude/skills/*` + `.agents/skills/*`: không skill nào nhắc endpoint/service đã gỡ — không
  cần sửa. Changelog cũ giữ nguyên.

## 2. `/api/pronunciation` trừ lượt Free/VIP khi cache MISS

Đề xuất (b) của 0526: nhánh cache MISS gọi Google TTS chỉ có rate limit 60/phút/IP, không trừ lượt
→ mỗi chuỗi ≤ 100 ký tự mới là một lần trả tiền, một tài khoản Free đốt được ~86.000 lượt TTS/ngày.

### Đã làm (server)

`apps/server/src/api/subjects/english/pronunciation.ts` — TÁI DÙNG đúng khuôn `/api/tts`
(`packages/core-ai/tts.ts`):

- Sau rate limit `pron-gen`, TRƯỚC khi gọi Google: `checkAndConsumeUsage(userId, 'speaking')` (đếm
  nguyên tử qua hàm SQL, fail-closed khi lỗi DB, tôn trọng cầu dao AI và phanh tay theo môn).
- Từ chối → **429** `{ error: gate.message }` — cùng mã, cùng thông điệp với `/api/tts` và các
  endpoint AI khác; ghi `logSecurityEvent('USAGE_LIMIT', …)` như `/api/pronounce-assess`.
- Google ném lỗi → `refundUsage(userId, 'speaking', gate.day)` (hoàn đúng ngày đã trừ).
- Cache HIT thoát ở BƯỚC 1 → không đụng tới bộ đếm (kể cả khi đã hết lượt).

### Quyết định trong ranh giới brief

- **Mode `speaking`** (không phải `pronounce`): `/api/tts` tính audio MISS vào `speaking`; cùng một
  provider (Google TTS) thì cùng cột thống kê/chi phí. Cột `pronounce_count` đang dành cho chấm
  phát âm Azure (`/api/pronounce-assess`). Free dùng hạn mức TỔNG nên chọn cột không đổi số lượt.
- **Khách chưa đăng nhập:** endpoint này đã yêu cầu đăng nhập (401) từ trước — không có nhánh khách,
  giữ nguyên (không mở thêm cho khách).
- **Hoàn lượt:** hoàn khi Google lỗi (người dùng không nhận được gì — đúng hợp đồng
  `refundUsage()`); KHÔNG hoàn khi lỗi SAU lúc Google đã trả audio (lưu file) — tiền API đã tốn,
  cùng luật "không tạo lượt miễn phí" của `/api/tts`.

### Đã làm (giao diện — không nuốt thông báo hết lượt)

Trước đây `PronounceButton` (Từ điển) và `WordVoiceCycleButton` (thẻ học từ) gộp MỌI lỗi vào
`console.error` + Web Speech: người hết lượt chỉ nghe giọng đổi khác mà không biết vì sao.

- Mới `apps/dhcb/src/lib/pronunciationApi.ts`: một hàm `fetchPronunciation()` dùng chung cho hai nút,
  kiểm phản hồi bằng Zod, trả `ok` / `refused` (429 có câu thông báo) / `error`.
- Hai nút: `refused` → `toast.info(<câu của server>)` (vùng `aria-live` toàn app của
  `ToastProvider`) rồi VẪN đọc bằng Web Speech (miễn phí, trên máy) để từ không bị câm; `error` giữ
  hành vi cũ. Không đổi bố cục/màu nút.
- `WordFormsBlock.test.tsx` bọc `ToastProvider` như `App.tsx` (nút loa nay dùng `useToast()`).
- Skill `financial-security-sentinel` (cả `.claude/` và `.agents/`, trùng từng byte): thêm câu "đường
  TẠO audio TTS mới trừ lượt `speaking`".

### Test

- `pronunciation.test.ts` (+8 ca): HIT không trừ (kể cả hết lượt) · MISS trừ đúng 1 lượt `speaking`
  TRƯỚC Google · hết lượt → 429 đúng câu, không gọi Google/không lưu · cầu dao → 429 · Google lỗi →
  hoàn đúng ngày · lưu file lỗi → không hoàn · bị `pron-gen` chặn → không trừ · 400 → không trừ.
  Đối chứng: thay cổng bằng `{ ok: true }` → **5 ca đỏ**; trả lại → 28/28 xanh.
- `pronunciationApi.test.ts` (6 ca) và `pronunciationButtons.limit.test.tsx` (3 ca × 2 nút, happy-dom).

## Bằng chứng

Chạy một lần trên trạng thái cuối (máy 4 CPU, load average ~17–20 do agent khác chạy song song):

- `npm ci` → exit 0 (worktree trước đó thiếu `node_modules/pyodide`, build đỏ ở plugin
  `dhcb-pyodide-self-host` — lỗi môi trường, không phải do đợt này; `package-lock.json` không đổi).
- `rm -rf packages/*/dist dist dist-server && npm run typecheck` → exit 0.
- `npm run lint` → exit 0 (0 cảnh báo). `npx prettier --check` 15 file đổi → xanh sau `--write`.
- `npm run build` → exit 0. Boot `node dist-server/server.js` (PORT=3199, DB giả như CI):
  `/api/health` **200**; `GET`/`POST /api/realtime-multimodal` → **404**
  `{"error":"API route không tồn tại"}`; `/api/scenario-holodeck`, `/api/pronunciation` vẫn gắn
  route (429 do rate limit fail-closed khi không có DB — không phải 404).
- `npm run check:docs` → exit 0. `npm run check:specs` → exit 0 (150 đặc tả).
- `npm run test:coverage` → exit 1: 3/18.999 test đỏ ở 4 file KHÔNG đụng tới, đều là timeout do máy
  quá tải (`StemLessonRetry.test.tsx`, `scripts/lib/scanGraph.test.ts`,
  `scripts/no-control-chars.test.ts`, `scripts/seed-all.test.ts` — "Test/Hook timed out"). Chạy lại
  riêng 4 file → **41/41 xanh**, exit 0. Vì lượt đầy đủ đỏ nên ngưỡng coverage chưa được chấm ở máy —
  CI sẽ chấm.
- Test liên quan: `pronunciation.test.ts` 28/28 · `pronunciationApi.test.ts` +
  `pronunciationButtons.limit.test.tsx` 12/12 · `WordFormsBlock.test.tsx` 7/7 ·
  `routes.csrf.test.ts` + `skills-mirror.test.ts` 38/38.
