# Đặc tả: "Tổng hợp 30 ngày" (Life Synthesis) dựng từ dữ liệu thật

**Trạng thái:** Approved for implementation — chủ dự án duyệt hướng "chất lượng cao nhất"
2026-10-09 trong phiên (giao qua coordinator, đợt `0550`).

**Nền:** nợ 🟡 trong `PROGRESS.md` "Tổng hợp đa miền (Life Synthesis) chờ dữ liệu thật" — changelog
`0475` gỡ studio "Tổng kết" vì nó hiện điểm 88/92/85 BỊA giống nhau cho mọi người, `/api/life-synthesis`
trả 501, `lifeSynthesisService.ts` toàn số gán cứng + câu soạn sẵn + 3 trụ đã xoá.

---

## 0. Một câu

Cho người học đã đăng nhập xem, trong studio "Kế hoạch" của Bạn Đồng Hành, bản tổng hợp 30 ngày
qua **chỉ gồm phép đếm trên bản ghi thật** của hai trụ Học tập + Ghi chú, kèm nhận xét và tối đa 3
gợi ý sinh tất định theo luật có tên.

## ① Phạm vi

**LÀM:**

- `GET /api/life-synthesis`: `validateAuth`, rate limit, đọc CSDL bằng 2 câu SQL tham số hoá lọc
  `user_id` của token, trả `{ report }` đã kiểm bằng Zod strict; lỗi CSDL → 500 an toàn.
- Nguồn Học tập (theo môn × ngày giờ VN, cửa sổ 30 ngày tính cả hôm nay):
  - Tiếng Anh: `public.daily_usage.learn_count > 0` (subject `english`), `english.chat_sessions`,
    `english.speaking_sessions`, `english.writing_submissions`;
  - Lập trình: `programming.lesson_progress` (`updated_at` = ngày có ghi tiến độ, `completed_at` =
    hoàn thành lần đầu);
  - Toán · Lí · Hoá · Sinh: `platform.completion_evidence.server_at` + `platform.completion_state.completed_at`.
- Nguồn Ghi chú: `worklife.tasks` + `worklife.documents`, nối qua `personal.persons.user_id`
  (không tạo hồ sơ Person khi đọc).
- Con số trả về: số ngày có học (chung + từng môn), chuỗi ngày liên tiếp (kết thúc hôm nay hoặc
  hôm qua), ngày gần nhất, số bài hoàn thành lần đầu (`null` với Tiếng Anh — môn không ghi "hoàn
  thành bài" ở server), số việc mở/quá hạn/đến hạn 7 ngày/chưa có hạn/bị vướng, số ghi chú mới.
- Câu nhận xét (12 luật) và khuyến nghị (5 luật, tối đa 3, mỗi đích một lần) sinh TẤT ĐỊNH, mỗi câu
  mang `ruleId`. Khuyến nghị mang `target` (môn / Góc học tập / Ghi chú) — client dựng URL qua
  `subjectsPath()` / `duongDanGhiChu()`.
- Gắn lại `LifeSynthesisDashboard` vào studio "Kế hoạch" (sau thẻ Workplace Harvester — cổng
  E2E [S06d] đòi thẻ đó nằm trong màn hình đầu ở 390 px; thay đổi so với bản nháp "đầu studio"), đủ
  trạng thái tải · lỗi (LoadError + Thử lại) · rỗng nói thật.
- Mock E2E dùng chung trong `mockLogin` để cổng a11y AA/AAA quét được nội dung thật của khối.

**KHÔNG LÀM (quan trọng ngang mục trên):**

- KHÔNG có điểm tổng hợp nào (0–100, %, xác suất về đích, xếp loại, so sánh với người khác) — Luật
  số 1 sản phẩm; hợp đồng `.strict()` chặn trường lạ.
- KHÔNG gọi AI để viết nhận xét. Nút "nhờ AI gợi ý thêm" (có đếm lượt Free/VIP) là đợt riêng, chưa
  làm.
- KHÔNG đưa lại tab/studio "Tổng kết" riêng; không đưa khối lên Trang chủ (kết quả tổng hợp không là
  màn hình chính).
- KHÔNG nhận số liệu do client tự khai: bỏ hẳn `POST` (trả 405) và khung thời gian tuỳ chọn.
- KHÔNG đụng ba trụ đã xoá (career/startup/life) — hợp đồng không còn các giá trị đó.
- KHÔNG dùng các cột đếm lượt AI của `daily_usage` (`chat_count`…): chúng gắn cứng môn `english`
  cho mọi tính năng nên không nói được người dùng học môn gì.
- KHÔNG thêm bảng/migration, không thêm thư viện, không sửa `.github/workflows/*`,
  `e2e/a11y*.spec.ts`, cấu hình lint/coverage.

## ② Điểm chạm

| Việc | Đường dẫn file                                                           | Ghi chú                                         |
| ---- | ------------------------------------------------------------------------ | ----------------------------------------------- |
| Sửa  | `packages/core-contracts/lifeSynthesis.ts`                               | hợp đồng v2 strict, không trường điểm           |
| Sửa  | `packages/core-contracts/lifeSynthesis.test.ts`                          |                                                 |
| Sửa  | `packages/core-personal/lifeSynthesisService.ts`                         | viết lại: SQL thật + luật câu chữ thuần         |
| Sửa  | `packages/core-personal/lifeSynthesisService.test.ts`                    | ca biên mỗi luật + quét tổ hợp ngôn ngữ cấm     |
| Sửa  | `apps/server/src/api/personal/life-synthesis.ts`                         | 501 → GET thật; POST → 405                      |
| Sửa  | `apps/server/src/api/personal/life-synthesis.test.ts`                    |                                                 |
| Sửa  | `apps/server/src/routes.ts`                                              | chỉ chú thích                                   |
| Sửa  | `apps/dhcb/src/lib/lifeSynthesisApi.ts`                                  | parse qua Zod; lệch hợp đồng = lỗi              |
| Sửa  | `apps/dhcb/src/lib/lifeSynthesisApi.test.ts`                             |                                                 |
| Thêm | `apps/dhcb/src/lib/lifeSynthesisRoutes.ts`                               | đích khuyến nghị → URL qua hàm route dùng chung |
| Sửa  | `apps/dhcb/src/components/LifeSynthesis/LifeSynthesisDashboard.tsx`      | viết lại                                        |
| Sửa  | `apps/dhcb/src/components/LifeSynthesis/LifeSynthesisDashboard.test.tsx` |                                                 |
| Sửa  | `apps/dhcb/src/components/CompanionStudios/StudioProactive.tsx`          | gắn khối                                        |
| Sửa  | `apps/dhcb/src/components/CompanionStudios/CompanionStudios.test.tsx`    |                                                 |
| Sửa  | `apps/dhcb/src/pages/core/UiNoise.design.test.ts`                        | gỡ 1 mục allowlist (huy hiệu HOA đã bỏ)         |
| Sửa  | `e2e/helpers/auth.ts`                                                    | `mockLogin` mock `/api/life-synthesis`          |
| Thêm | `e2e/helpers/lifeSynthesisMock.ts`                                       | mock parse qua hợp đồng                         |

Xoá (mã chết của bản cũ, không còn nơi gọi): `apps/dhcb/src/components/LifeSynthesis/LifeSynthesisDetailModal.tsx`
(đổi khung thời gian bằng POST số tự khai, hiện "xác suất đạt"), `apps/dhcb/src/lib/lifeSynthesisFormat.ts`
(chuẩn hoá điểm 0–100).

**Ảnh hưởng lan ra (theo codemap):** `lifeSynthesisService.ts` chỉ được `life-synthesis.ts` gọi;
`core-contracts/lifeSynthesis.ts` chỉ được service, handler, `lifeSynthesisApi.ts`, dashboard và mock
E2E dùng; `StudioProactive.tsx` nạp lười từ `pages/companion/Companion.tsx`. `mockLogin` dùng ở mọi
spec E2E — thêm một route mock không đổi hành vi spec nào (chưa spec nào gọi `/api/life-synthesis`).

## ③ Hợp đồng dữ liệu

**Vào:** `GET /api/life-synthesis`, header `Authorization: Bearer …`. Không tham số (tham số lạ bị bỏ
qua; `userId` luôn lấy từ token).

**Ra (200):**

```ts
{ report: {
  schemaVersion: 2; generatedAt: string /* ISO */; windowDays: 30
  windowStart: 'YYYY-MM-DD'; windowEnd: 'YYYY-MM-DD' /* hôm nay, giờ VN */
  learning: { activeDays: 0..30; streakDays: 0..30; lastActiveDate: string | null
    subjects: { subjectId: 'english'|'programming'|'mathematics'|'physics'|'chemistry'|'biology'
      label: string; activeDays: 1..30; lastActiveDate: string; streakDays: 0..30
      completions: number | null }[] }
  notes: { totalTasks; openTasks; overdueTasks; dueSoonTasks; undatedOpenTasks; blockedTasks;
    totalNotes; notesCreated } // số nguyên ≥ 0
  observations: { ruleId: ObservationRule; domain: 'learning'|'notes'; text: string }[]
  recommendations: { ruleId: RecommendationRule; domain; text; actionLabel;
    target: {kind:'subject',subjectId} | {kind:'learning-hub'} | {kind:'notes'} }[] // ≤ 3
} } // mọi object .strict()
```

Luật câu chữ (ngưỡng là hằng có tên trong service):

| Luật                                             | Điều kiện                                                        |
| ------------------------------------------------ | ---------------------------------------------------------------- |
| `learning.none`                                  | không môn nào có hoạt động trong 30 ngày                         |
| `learning.subject_streak`                        | chuỗi của môn ≥ `MIN_STREAK_TO_MENTION` (2); chạm 30 → "ít nhất" |
| `learning.streak`                                | chuỗi chung ≥ 2 VÀ dài hơn mọi chuỗi từng môn                    |
| `learning.completions`                           | `completions` ≠ null và > 0                                      |
| `learning.lapsed`                                | môn vắng ≥ `LAPSE_DAYS` (7) ngày                                 |
| `notes.none`                                     | 0 việc và 0 ghi chú (khi đó không nêu luật Ghi chú nào khác)     |
| `notes.overdue/due_soon/undated/blocked/created` | số đếm tương ứng > 0                                             |
| `notes.all_closed`                               | có việc nhưng 0 việc mở                                          |
| `rec.notes_overdue`                              | quá hạn > 0 (ưu tiên 1)                                          |
| `rec.learning_continue`                          | môn có chuỗi ≥ 2 mà hôm nay chưa học                             |
| `rec.learning_resume`                            | (khi không có "continue") môn vắng ≥ 7 ngày gần nhất             |
| `rec.learning_start`                             | chưa học gì                                                      |
| `rec.notes_undated`                              | việc chưa có hạn ≥ `UNDATED_RECOMMEND_THRESHOLD` (3)             |

**Ca lỗi:**

| Tình huống                         | Mã lỗi | Hành vi mong đợi                                                  |
| ---------------------------------- | ------ | ----------------------------------------------------------------- |
| Không/không hợp lệ token           | 401    | không chạm CSDL                                                   |
| Phương thức khác GET/OPTIONS       | 405    | (kể cả POST của bản cũ)                                           |
| Quá 30 lượt/phút/IP                | 429    |                                                                   |
| CSDL lỗi                           | 500    | `{error:'Internal server error'}`, không lộ lỗi pg, không báo cáo |
| Client nhận phản hồi lệch hợp đồng | —      | khối lỗi + Thử lại, KHÔNG hiển thị báo cáo nửa vời                |

## ④ Tiêu chí chấp nhận

- [ ] Mọi câu nhận xét/khuyến nghị trên một lưới tổ hợp ≥ 500 câu không chứa ngôn ngữ cấm của
      `findForbiddenLanguage` (x/100, %, xếp hạng, so sánh, khiếm khuyết) — `npx vitest run packages/core-personal/lifeSynthesisService.test.ts`.
- [ ] Mỗi luật có ca biên hai phía (dưới ngưỡng im, chạm ngưỡng nói) — cùng lệnh trên.
- [ ] Không có dữ liệu → "Chưa có hoạt động học nào trong 30 ngày qua." + "Chưa có việc hay ghi chú
      nào trong Ghi chú.", không câu mẫu nào khác — test dashboard + service.
- [ ] Cả 2 câu SQL nhận `user_id` của token làm `$1` — `npx vitest run apps/server/src/api/personal/life-synthesis.test.ts`.
- [ ] Hai câu SQL PREPARE được trên schema thật — `npm run check:sql` (Postgres đã migrate).
- [ ] Khối trong studio "Kế hoạch": 0 vi phạm AA + AAA (quét vùng `scanScopedAa`/`scanScopedAaa`)
      ở blue-sky + dark-blue × 1440 + 390 × 3 trạng thái (đủ dữ liệu / rỗng / lỗi); ảnh Tầng 8b.

**Lệnh chứng minh:**

```bash
npm run typecheck && npm run lint
npx vitest run packages/core-personal/lifeSynthesisService.test.ts packages/core-contracts/lifeSynthesis.test.ts \
  apps/server/src/api/personal/life-synthesis.test.ts apps/dhcb/src/components/LifeSynthesis \
  apps/dhcb/src/lib/lifeSynthesisApi.test.ts apps/dhcb/src/components/CompanionStudios
DATABASE_URL=postgres://… npm run check:sql
```

## ⑤ Bất biến không được phá

| Bất biến                                                       | Test nào canh nó                                                         |
| -------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Không ngôn ngữ chấm điểm/so sánh trong câu sinh ra (Luật số 1) | `packages/core-personal/lifeSynthesisService.test.ts` (quét tổ hợp)      |
| Hợp đồng không có trường điểm; strict từ chối trường lạ        | `packages/core-contracts/lifeSynthesis.test.ts`                          |
| DOM khối không có thanh điểm/progressbar/x/100/%               | `apps/dhcb/src/components/LifeSynthesis/LifeSynthesisDashboard.test.tsx` |
| Lỗi CSDL không thành báo cáo bịa                               | `apps/server/src/api/personal/life-synthesis.test.ts`                    |
| Không còn tab "Tổng kết" riêng                                 | `apps/dhcb/src/components/CompanionStudios/CompanionStudios.test.tsx`    |
| Studio "Kế hoạch" đạt AA/AAA ở mọi theme                       | `e2e/a11y.spec.ts`, `e2e/a11y-aaa.spec.ts` (không sửa)                   |

## ⑥ Quy ước dự án liên quan

- Import xuyên gói `@dhcb/<gói>/<file>` không đuôi `.js`; nội bộ gói tương đối có `.js`.
- Handler tự `validateAuth()`; `user_id` chỉ từ token; SQL tham số hoá.
- Ngày theo giờ Việt Nam (`vnDateStr`/`addDays` của `@dhcb/core-db/date`; SQL `at time zone 'Asia/Ho_Chi_Minh'`).
- `null` khác 0 (Tiếng Anh `completions: null`).
- URL dựng qua hàm dùng chung (`subjectsPath`, `duongDanGhiChu`) — CLAUDE.md §7.
- Màu qua token (`text-content`, `text-content-secondary`, `bg-surface-card`, `accent-*` + `theme-light:`);
  chữ nội dung AAA, điều khiển AA; vùng chạm ≥ 44px (`tap-44`).

---

## Nghiệm thu (bên giao việc điền SAU khi nhận kết quả)

- Lệnh đã chạy + kết quả thật: xem `docs/changelog/0550-2026-10-09-tong-hop-30-ngay-du-lieu-that.md`.
- Tiêu chí ④ đạt hết chưa; cái nào chưa và vì sao:
- Có phá bất biến ⑤ nào không:
- Có mở rộng ngoài phạm vi ① không:
- Còn để ngỏ: chuỗi ngày chỉ đếm trong cửa sổ 30 ngày (chạm trần nói "ít nhất 30"); Lập trình chỉ
  thấy ngày ghi tiến độ GẦN NHẤT của mỗi bài (`updated_at` bị ghi đè) nên số ngày có học là cận dưới.
