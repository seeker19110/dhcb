# 0478 — Chuyển skill đợt 2: `principal-engineer-architect` · `financial-security-sentinel` · `pedagogy-linguistics-master` (2026-10-02)

- **Ngày:** 2026-10-02 · **PR:** [#1213](https://github.com/seeker19110/dhcb/pull/1213) · **Loại:** `chore(skills)`.
- **Nối tiếp:** đợt 1 ở changelog 0477 (PR #1212), cùng phương án chủ dự án đã duyệt: rà, bỏ hoặc
  đánh dấu "chưa có" phần không tồn tại, sửa đường dẫn, chuyển sang `.claude/skills/`, giữ bản gương
  ở `.agents/skills/`.

## Kết quả rà từng skill (đối chiếu mã 2026-10-02)

### `principal-engineer-architect` — 3 thứ bịa, nhiều số lỗi thời

| Bản cũ khẳng định                                                                               | Thực tế                                                                                                                | Bản mới                                                                                          |
| ----------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Web Worker DSP âm thanh `apps/english/src/lib/audioDspWorker.ts`                                | Không tồn tại. Phân tích formant chạy trên main thread trong `AcousticPhoneticsLab.tsx`                                | Nêu worker THẬT (`apps/dhcb/src/workers/`: JS/Python/SQL/DOM của môn Lập trình), DSP → "CHƯA CÓ" |
| Edge AI nạp weights WebGPU "0ms"                                                                | `edgeModelStorage.ts` có thật (OPFS → IndexedDB) nhưng **không có model nào**; `classifyIntentEdge` là regex           | Ghi đúng; cấm mô tả như có model trên trình duyệt                                                |
| Hybrid RAG + RRF `packages/core-ai/hybridRagEngine.ts`                                          | Không tồn tại                                                                                                          | Trỏ `contextEngine.ts` (Context Builder có consent); RAG → "CHƯA CÓ"                             |
| React 18 + Vite 7; "5 Focus Studios"; JS ≤ 123 kB, CSS ≤ 16 kB; "4.869+ tests"; cổng `npm test` | React 19 + Vite 8; 4 studio; ngân sách thật 160/26 kB ở `.size-limit.json`; ~18 nghìn test; cổng CI là `test:coverage` | Sửa; ngân sách trỏ `.size-limit.json` thay vì chép số                                            |
| `withTransaction(async (client) => …)`                                                          | Chữ ký thật `withTransaction(pool, fn)` ở `packages/core-db/transaction.ts`                                            | Sửa                                                                                              |
| "Event Outbox" ở tầng dữ liệu                                                                   | Chỉ có hàng đợi offline phía client                                                                                    | Bỏ khỏi sơ đồ                                                                                    |

### `financial-security-sentinel` — vùng tiền, mô tả sai luồng webhook

| Bản cũ khẳng định                                                         | Thực tế (mã)                                                                                                                                     |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Webhook ký **HMAC-SHA256**                                                | Header `Authorization: Apikey …`, so bằng `timingSafeEqual` (`verifySepayApiKey`) — SePay **không** ký HMAC                                      |
| Trạng thái `processing` → `completed`, `idempotency_key`                  | `pending` → `paid`; chống trùng bằng `WHERE status='pending'` + `UNIQUE provider_txn_id`; có ân hạn 24h, chuyển thiếu giữ `pending`              |
| Referral `packages/core-personal/referralVipService.ts`, mốc 1/3/5/10 bạn | File thật `apps/server/src/api/_lib/referral.ts`, 7 ngày cho cả hai; **không có** mốc                                                            |
| `dailyQuestsService` → rương → Streak Freeze Token                        | `apps/server/src/api/_lib/quests.ts`: 4 nhiệm vụ, 2 nhiệm vụ đã **tắt thưởng** vì client không chứng minh được; **không có** rương/token         |
| Trần chi phí USD/ngày, tự hạ model tại 80%/100%                           | `checkBudgetExceeded` có nhưng **không nơi nào gọi**. Giới hạn thật: `checkAndConsumeUsage` (đếm lượt, fail-closed) + cầu dao `aiCircuitBreaker` |
| `api/_lib/geminiApi.ts`; "tiết kiệm tới 90%"                              | `packages/core-ai/geminiApi.ts`; bỏ con số không đo                                                                                              |

Bản mới vẽ lại sơ đồ webhook theo đúng `payment-webhook.ts`, ghi luật "SePay không ký HMAC — đừng
viết code/test giả định có chữ ký", và thêm hai gói thật (Free/VIP).

### `pedagogy-linguistics-master` — ba "động cơ" không tồn tại

| Bản cũ khẳng định                                               | Thực tế                                                                                                     |
| --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| CAT **IRT 3PL / EAP / Fisher**, "12–15 câu, r > 0,92"           | Không có trong mã. Bài xếp lớp thật (`placement.ts`) là **bậc thang thích ứng**, tối đa 3 vòng × 8 câu      |
| **BKT** + `packages/core-learner/prerequisiteKnowledgeGraph.ts` | Không tồn tại                                                                                               |
| **GOP** âm học, đo formant F1/F2, lệch F0                       | `acousticPhoneticsService.ts` đoán lỗi từ **chính tả** của câu đã nhận dạng; điểm là **công thức gán cứng** |
| `lib/direction.ts`                                              | `getDirection`/`setDirection` ở `apps/dhcb/src/lib/storage.ts`                                              |
| Phát hiện ngụy biện                                             | Có, nhưng là heuristic theo từ khoá — bản mới dặn giao diện trình bày như "gợi ý"                           |

Bản mới giữ phần sư phạm có giá trị (phản hồi 3 nhịp, ma trận lỗi L1 tiếng Việt, Echo Shadowing,
4 tiêu chí IELTS, Toulmin), thêm luật sửa prompt phải chạy golden snapshot + `eval:tutor`, và luật
bậc từ vựng theo nguồn CEFR-J/Octanove.

## Phát hiện lỗi SẢN PHẨM khi rà (ghi nợ, chưa sửa trong PR này)

1. 🔴 **Lab phát âm hiện điểm bịa cho mọi người dùng.** Studio Thử thách › "Acoustic Phonetics &
   GOP Lab" hiển thị "Điểm GOP Tổng X/100", điểm lưu loát và ngữ điệu dạng %. Cả ba đều sinh từ
   công thức gán cứng, không đo âm thanh. Cùng loại lỗi với bảng nháp STEM (0473) và studio Tổng
   kết (0475). Cần chủ dự án chọn: ẩn lab, hay bỏ điểm số và đổi nhãn thành "gợi ý luyện âm".
2. 🟡 **Edge AI phân loại ý định về các miền đã xoá.** `classifyIntentEdge` vẫn trả về
   `career`/`startup`/`life`, dù ba trụ này đã gỡ ngày 2026-09-20.

## Bằng chứng

- `scripts/skills-mirror.test.ts`: 17/17 xanh (5 skill × 3 ca + 2 ca chung). Mọi đường dẫn trong
  repo mà 3 skill mới nhắc tới đều tồn tại; bản gương trùng từng byte.
- Script nháp soát định danh không bắt được định danh bịa nào; các mục bị báo chỉ là route/lệnh
  (`/admin`, `/contract`…).
- Từng khẳng định về luồng tiền đều đọc thẳng từ `payment-webhook.ts`, `sepay.ts`, `usage.ts`,
  `referral.ts`, `quests.ts` trước khi viết.
