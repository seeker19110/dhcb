# Đặc tả — Bạn Đồng Hành GĐ4a: "Thẻ hôm nay" từ dữ liệu thật · 👍/👎 thành sở thích · gỡ tác tử chủ động giả lập

- **Ngày:** 2026-10-12 · **Trạng thái:** Approved for implementation (khung 4 giai đoạn chủ dự án chốt
  2026-10-11 "làm lần lượt cả 4"; GĐ4 giao trong phiên 2026-10-12: "tiếp mục kế tiếp theo khuyến
  nghị")
- **Nghiên cứu:** `docs/research/nang-cap-ban-dong-hanh-2026-10-11.md` mục 2.3 (ChatGPT Pulse: thẻ
  từ ký ức + mục tiêu, có 👍/👎, trần thẻ/ngày; OpenAI: đo "rời đi đã làm xong việc", không đo thời
  gian ở lại; không thông điệp tội lỗi về streak cho trẻ) + mục 3 dòng GĐ4
- **GĐ trước:** `docs/specs/2026-10-12-ban-dong-hanh-gd3-tac-tu-cong-cu.md` (đã merge, PR #1378)

## 0. Một câu

Studio "Kế hoạch" của Bạn Đồng Hành mở đầu bằng **tối đa 3 thẻ mỗi ngày** dựng từ dữ liệu THẬT của
người dùng (thẻ ôn đến hạn · việc đến hạn trong Ghi chú · mục tiêu học · lời mời phản tỉnh), mỗi thẻ
tự chuyển "Đã xong" khi việc được làm, có 👍/👎 lưu thành sở thích — và toàn bộ "tác tử chủ động"
giả lập (năng lượng 85% gán cứng cho mọi người, lộ trình AutoPilot 4 bước gõ sẵn) bị gỡ.

## Hiện trạng đo trong mã (trước GĐ4a)

| Điểm           | Mã thật                                                                                                                                  | Hệ quả                                                                                    |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Nhắc nhở       | `proactiveAgentService.evaluateProactiveState`: `circadianEnergy ?? 85`; không nơi gọi nào truyền số đo                                  | MỌI người dùng luôn thấy "Mức năng lượng nhận thức đang ở đỉnh cao (85%+)" — câu bịa      |
| Lộ trình       | `generateGoalAutoPilotPlan` — 4 bước gõ cứng, trạng thái `completed/in_progress` gán sẵn                                                 | "Tiến độ" mục tiêu là số giả, không dính gì tới việc người dùng đã làm                    |
| Lưu trạng thái | `Map` trong bộ nhớ tiến trình                                                                                                            | Mất khi khởi động lại, lệch giữa các tiến trình PM2                                       |
| Định danh      | `proactive-agent.ts`: `personId = auth.userId` (profiles.id ≠ personal.persons.id)                                                       | Dù có dữ liệu thật cũng đọc nhầm người                                                    |
| Bản tin thật   | `proactiveBriefingService` — đúng số liệu (thẻ ôn, việc Ghi chú) nhưng tính lại mỗi lần, không lưu, không phản hồi, `insights` luôn rỗng | Không biết thẻ nào có ích; studio "Kế hoạch" hiện bản tin này trùng ý với thẻ mới sẽ thêm |

## ① Phạm vi

**LÀM:**

- **Bốn loại thẻ, dựng TẤT ĐỊNH từ dữ liệu thật — KHÔNG gọi AI** (không tốn lượt, không tốn tiền,
  không bịa câu):

  | `kind`          | Điều kiện được chọn (lúc dựng thẻ của ngày)                                                                                            | "Đã xong" khi (đọc lại mỗi lần mở)          | Đi tới                            |
  | --------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- | --------------------------------- |
  | `review_due`    | số thẻ ôn đến hạn (`english.learning_progress.srs`, mọi môn) > 0                                                                       | còn 0 thẻ đến hạn                           | `/goc-hoc-tap/on-tap`             |
  | `due_tasks`     | số việc chưa xong có hạn trước hết hôm nay (giờ VN, gồm quá hạn) > 0                                                                   | còn 0 việc như vậy                          | `/ghi-chu`                        |
  | `learning_goal` | có mục tiêu học (fact `learning.goal` do người dùng duyệt qua Companion, nếu không có thì mục tiêu lúc onboarding) VÀ hôm nay chưa học | hôm nay đã có hoạt động học (`daily_usage`) | `/goc-hoc-tap`                    |
  | `reflection`    | 7 ngày qua học ≥ 2 ngày VÀ chưa viết nhật ký phản tỉnh trong 7 ngày                                                                    | đã viết nhật ký hôm nay                     | `/ban-dong-hanh?studio=cognitive` |

- **Một bộ thẻ cho mỗi ngày (giờ VN), dựng lúc mở lần đầu trong ngày** — bảng
  `personal.companion_daily_cards`, ràng buộc duy nhất `(person_id, vn_day, kind)` và
  `(person_id, vn_day, position)` với `position ∈ 1..3` ⇒ **trần 3 thẻ/ngày do CSDL giữ**, hai request
  đua nhau không thể sinh thẻ thứ tư. Ngày chưa có thẻ nào (không đủ điều kiện) thì lần mở sau thử
  dựng lại; đã có thẻ thì không thêm trong ngày.
- **Chữ trên thẻ tính lại từ số liệu SỐNG mỗi lần mở** (ôn 5/12 thẻ thì thẻ nói "còn 7"), bộ thẻ thì
  cố định trong ngày. Số liệu lúc dựng lưu ở `snapshot` để sau này đo "tỉ lệ thẻ được làm xong" —
  thước đo đúng tinh thần "rời đi đã làm xong việc".
- **👍/👎** trên từng thẻ: `POST /api/companion-cards?action=feedback`. Đổi ý được (👍 → 👎), bấm lại
  cùng nút là lũy đẳng. Lưu thành sở thích theo loại thẻ ở `personal.companion_card_preferences`:
  👎 ⇒ loại đó **tắt 7 ngày** (`muted_until`), 👍 ⇒ bỏ tắt + được xếp trước. Thứ tự chọn: điểm ròng
  (👍 − 👎) giảm dần, rồi thứ tự gốc của bảng trên.
- **Gỡ tác tử chủ động giả lập:** `proactiveAgentService` + test, handler `/api/proactive-agent` +
  test + route, hợp đồng `proactiveAgent` + test, `proactiveAgentApi` + test, ba thành phần
  `ProactiveAgent/*` (banner nhắc, thẻ AutoPilot, hộp thoại cài đặt). Studio "Kế hoạch" bỏ luôn
  `ProactiveBriefingCard` (trùng ý với thẻ mới; bản tin ở Trang chủ `HomeAiBriefingCard` GIỮ NGUYÊN).
- **Liên kết sâu studio:** trang `/ban-dong-hanh` đọc `?studio=<dialogue|cognitive|labs|proactive>`
  để mở đúng studio (thẻ phản tỉnh dẫn tới studio "Ghi nhớ" có nhật ký).
- Bảng mới vào `PERSON_TABLES` (xuất + xoá dữ liệu cá nhân); thẻ cũ hơn 90 ngày được job bảo trì
  Companion hằng ngày dọn.

**KHÔNG LÀM (để GĐ4b hoặc sau):**

- Nhắc nghỉ khi phiên trò chuyện dài cho nhóm `nhi_dong`/`thieu_nien` — **GĐ4b** (PR riêng).
- Đẩy thẻ qua web push / email; đưa thẻ ra Trang chủ thay `HomeAiBriefingCard`.
- Câu chữ thẻ do AI viết. Thẻ GĐ4a là câu mẫu điền số thật — rẻ, đúng, test được hết.
- **Cron đêm dựng sẵn thẻ cho mọi người** (nghiên cứu ghi "cron đêm"): KHÔNG làm, thay bằng dựng
  lúc mở lần đầu trong ngày. Lý do: thẻ không gọi AI nên dựng tức thì; cron sẽ tốn truy vấn cho cả
  người không mở app, và số liệu dựng lúc 0 giờ đã cũ khi người dùng mở lúc 7 giờ. Cron chỉ cần khi
  thẻ do AI viết hoặc khi đẩy thông báo — xem lại ở GĐ sau.
- Không thông điệp về chuỗi ngày (streak) trong thẻ — với mọi nhóm tuổi.

## ② Điểm chạm

| Việc | Đường dẫn file                                                           | Ghi chú                                                        |
| ---- | ------------------------------------------------------------------------ | -------------------------------------------------------------- |
| Thêm | `postgres/migrations/0097_companion_daily_cards.sql`                     | 2 bảng, lũy đẳng, rollback ở đầu file                          |
| Sửa  | `postgres/migrations/README.md`                                          | dòng 0097                                                      |
| Thêm | `packages/core-contracts/companionDailyCards.ts`                         | schema thẻ, phản hồi, request                                  |
| Thêm | `packages/core-contracts/companionDailyCards.test.ts`                    |                                                                |
| Thêm | `packages/core-personal/companionDailyCards.ts`                          | đọc số liệu, chọn thẻ (thuần), dựng chữ (thuần), lưu, phản hồi |
| Thêm | `packages/core-personal/companionDailyCards.test.ts`                     | pool giả                                                       |
| Thêm | `packages/core-personal/companionDailyCards.integration.test.ts`         | Postgres thật (bỏ qua khi không có `DATABASE_URL`)             |
| Sửa  | `packages/core-personal/proactiveBriefingService.ts`                     | tách `readDueTaskCounts` dùng chung (DRY)                      |
| Sửa  | `packages/core-personal/personErasureService.ts`                         | thêm 2 bảng vào `PERSON_TABLES`                                |
| Thêm | `apps/server/src/api/personal/companion-cards.ts`                        | GET thẻ hôm nay · POST `?action=feedback`                      |
| Thêm | `apps/server/src/api/personal/companion-cards.test.ts`                   |                                                                |
| Sửa  | `apps/server/src/routes.ts`                                              | gắn `/api/companion-cards`, gỡ `/api/proactive-agent`          |
| Sửa  | `apps/server/src/server.ts`                                              | job bảo trì Companion dọn thẻ > 90 ngày                        |
| Thêm | `apps/dhcb/src/lib/companionCardsApi.ts`                                 | fetch có `signal`, kiểm Zod                                    |
| Thêm | `apps/dhcb/src/lib/companionCardsApi.test.ts`                            |                                                                |
| Thêm | `apps/dhcb/src/components/CompanionStudios/CompanionDailyCards.tsx`      | tải/rỗng/lỗi/Thử lại, 👍/👎 `aria-pressed`                     |
| Thêm | `apps/dhcb/src/components/CompanionStudios/CompanionDailyCards.test.tsx` |                                                                |
| Sửa  | `apps/dhcb/src/components/CompanionStudios/StudioProactive.tsx`          | thẻ mới đứng đầu; bỏ nhắc giả, AutoPilot, bản tin trùng        |
| Sửa  | `apps/dhcb/src/pages/companion/Companion.tsx`                            | bỏ fetch tác tử giả; đọc `?studio=`                            |
| Xoá  | packages/core-personal/proactiveAgentService.ts (+ test)                 |                                                                |
| Xoá  | packages/core-contracts/proactiveAgent.ts (+ test)                       |                                                                |
| Xoá  | apps/server/src/api/personal/proactive-agent.ts (+ test)                 |                                                                |
| Xoá  | apps/dhcb/src/lib/proactiveAgentApi.ts (+ test)                          |                                                                |
| Xoá  | apps/dhcb/src/components/ProactiveAgent/                                 | 3 thành phần                                                   |
| Xoá  | apps/dhcb/src/components/ProactiveBriefingCard.tsx                       | chỉ studio "Kế hoạch" dùng                                     |
| Sửa  | `e2e/helpers/auth.ts`                                                    | mock `/api/companion-cards` để cổng a11y quét thẻ thật         |

## ③ Hợp đồng

**CSDL (migration 0097):**

```sql
personal.companion_daily_cards (
  id uuid pk, person_id uuid → personal.persons on delete cascade, vn_day date,
  kind text check (kind in ('review_due','due_tasks','learning_goal','reflection')),
  position smallint check (position between 1 and 3), snapshot jsonb,
  feedback text check (feedback in ('up','down')) null, feedback_at timestamptz null,
  created_at timestamptz, unique (person_id, vn_day, kind), unique (person_id, vn_day, position))
personal.companion_card_preferences (
  person_id → persons on delete cascade, kind (cùng check), up_count int ≥ 0, down_count int ≥ 0,
  muted_until timestamptz null, updated_at, primary key (person_id, kind))
```

**API:**

```ts
// GET /api/companion-cards → 200
{ day: 'YYYY-MM-DD', cards: CompanionDailyCard[] }          // 0..3 thẻ, theo position
CompanionDailyCard = { id: uuid, kind, title ≤ 120, body ≤ 400, route ≤ 200, actionLabel ≤ 40,
                       status: 'open' | 'done', feedback: 'up' | 'down' | null }
// POST /api/companion-cards?action=feedback  body { cardId: uuid, feedback: 'up' | 'down' } (strict)
// → 200 { cardId, feedback }   (giao diện tự cập nhật thẻ đó)
```

**Ca lỗi:**

| Tình huống                                | Hành vi                                                                  |
| ----------------------------------------- | ------------------------------------------------------------------------ |
| Chưa đăng nhập                            | 401                                                                      |
| Body sai schema / `action` lạ / method lạ | 400 / 400 / 405                                                          |
| `cardId` không thuộc người đang đăng nhập | 404 (không lộ thẻ người khác tồn tại)                                    |
| CSDL lỗi khi đọc số liệu                  | 500 — KHÔNG bịa số; giao diện hiện "Chưa tải được thẻ hôm nay" + Thử lại |
| Hai request đầu ngày đua nhau             | `on conflict do nothing` ⇒ tối đa 3 thẻ, không trùng loại                |
| Quá 60 request/phút/IP                    | 429                                                                      |

## ④ Tiêu chí chấp nhận

- [ ] `companionDailyCards.test.ts`: (a) chọn thẻ — đủ 4 điều kiện ⇒ đúng 3 thẻ theo thứ tự gốc;
      loại bị tắt (`muted_until` > bây giờ) không được chọn; tắt đã hết hạn được chọn lại; 👍 nhiều hơn
      xếp trước; không đủ điều kiện nào ⇒ 0 thẻ; (b) dựng chữ — số sống thay số lúc dựng, hết việc ⇒
      `done`; không có chữ "streak"/"chuỗi"; mục tiêu dài bị cắt; (c) lần mở đầu ngày ghi đúng số
      dòng, lần mở sau không ghi thêm; (d) phản hồi — 👍 rồi 👎 đổi đúng bộ đếm, bấm lại cùng nút
      không đổi gì, thẻ người khác ⇒ `NotFoundError`.
- [ ] `companionDailyCards.integration.test.ts` (Postgres thật): hai lời gọi đầu ngày chạy song song
      ⇒ tổng số thẻ ≤ 3, không trùng `kind`; xoá người ⇒ thẻ + sở thích mất theo.
- [ ] `personErasureService.integration.test.ts` (đã có) xanh: danh sách khớp `information_schema`.
- [ ] `companion-cards.test.ts`: 401 · 405 · 400 body sai · 404 thẻ lạ · GET truyền đúng
      `personId` (persons.id) + `userId` (profiles.id) · 429.
- [ ] `CompanionDailyCards.test.tsx`: trạng thái tải / rỗng / lỗi + Thử lại; thẻ `done` có nhãn "Đã
      xong"; 👎 ⇒ `aria-pressed=true` + câu "7 ngày tới…"; lưu lỗi ⇒ hoàn tác. Tải qua `useAsyncLoad`
      (không setState sau khi rời trang — thay khuôn `AbortController` của fetch giả lập cũ).
- [ ] Không còn tham chiếu nào tới `proactive-agent`/`proactiveAgent` trong mã (`rg` rỗng, trừ
      changelog/legacy).
- [ ] Cổng a11y AA + AAA của studio "Kế hoạch" xanh với thẻ thật (mock E2E).
- [ ] Tầng 8b: ảnh studio "Kế hoạch" 1440 px + 390 px, trước/sau.

**Lệnh chứng minh:**

```bash
rm -rf packages/*/dist dist dist-server && npm run typecheck && npm run lint && npm run test:coverage && npm run build
npm run check:specs && npm run check:sql && npm run migrate:pg
```

## ⑤ Bất biến không được phá

| Bất biến                                                               | Test canh                                                |
| ---------------------------------------------------------------------- | -------------------------------------------------------- |
| Mọi con số trên thẻ đến từ CSDL; lỗi đọc ⇒ lỗi, không số mặc định      | `companionDailyCards.test.ts`                            |
| ≤ 3 thẻ/người/ngày, kể cả khi request đua                              | `companionDailyCards.integration.test.ts`                |
| Chỉ đọc/ghi thẻ của chính người đăng nhập (id từ token, không từ body) | `companion-cards.test.ts`, `companionDailyCards.test.ts` |
| Không gọi AI, không trừ lượt                                           | `companionDailyCards.test.ts` (không import lớp AI)      |
| Không thông điệp tội lỗi về streak                                     | `companionDailyCards.test.ts`                            |
| Xuất/xoá dữ liệu cá nhân phủ hai bảng mới                              | `personErasureService.integration.test.ts`               |
| Bản tin Trang chủ (`/api/proactive-briefing`) không đổi hành vi        | `proactiveBriefingService.test.ts`                       |

## ⑥ Quy ước dự án liên quan

- `personId` = `personal.persons.id`, `userId` = `profiles.id` — hai id khác nhau, truyền cả hai.
- Ngày theo giờ VN (`vnDateStr`), không theo giờ máy chủ.
- SQL tĩnh PREPARE được (`check:sql`). Migration lũy đẳng, có số thứ tự, rollback ghi đầu file.
- Giao diện: chữ đọc AAA, điều khiển AA, 3 theme qua token, vùng chạm ≥ 44 px, `aria-live` cho câu
  xác nhận phản hồi.

---

## Nghiệm thu

- Lệnh đã chạy + kết quả thật: xem changelog `0629`.
- Việc tay sau deploy: `npm run migrate:pg` (0097, hai bảng mới — tự chạy trong `scripts/deploy.sh`).
