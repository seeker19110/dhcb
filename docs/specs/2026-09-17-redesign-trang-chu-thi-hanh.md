# Đặc tả THI HÀNH — Thiết kế lại Trang chủ & trải nghiệm học cốt lõi (13 lát, P0 → P2)

| Thuộc tính    | Giá trị                                                                                                                                                                                                                                 |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Spec nền      | [`../research/thiet-ke-lai-trang-chu-va-trai-nghiem-hoc-2026-09-17.md`](../research/thiet-ke-lai-trang-chu-va-trai-nghiem-hoc-2026-09-17.md) (THIẾT KẾ — mục A–G)                                                                       |
| Spec kề       | S06 `2026-09-15-learning-ux-s06-hom-nay-hoc-tiep.md` (`TodayPlan`) · S05 `…-s05-bat-dau-theo-y-dinh.md` (`/bat-dau`) · `2026-09-15-mo-xem-web-khong-can-dang-nhap.md` (khách) · `2026-09-15-goc-hoc-tap-architecture.md` (host routing) |
| Base khảo sát | `main` `5f7d329` (#999) + nhánh `claude/blissful-fermi-1i2b1p` (PR #1000), khảo sát 2026-09-17 bằng đọc mã thật                                                                                                                         |
| Trạng thái    | **Đang thi hành** — lệnh 1–12 đã merge; lệnh 13–15 vẫn cần duyệt riêng theo bảng §9                                                                                                                                                     |
| Người duyệt   | Chủ dự án                                                                                                                                                                                                                               |

> Khuôn: `docs/templates/dac-ta-tinh-nang.md` — mỗi lát đủ 6 ô ①–⑥. Ô ④ (tiêu chí chấp nhận)
> viết TRƯỚC giải pháp. Bên thi hành KHÔNG thấy hội thoại: mọi thứ cần biết nằm trong file này +
> spec nền.
>
> **Ba luật sản phẩm chi phối MỌI lát** (vi phạm = PR bị từ chối dù test xanh):
>
> 1. Chẩn đoán KHÔNG bao giờ là màn hình chính; không band/CEFR/%/bậc năng lực lên thẻ chọn việc
>    (CLAUDE.md §2). Mã chặng nội dung (`A2`, `P1`) là ĐỊA CHỈ, được phép; "trình độ A2" là ĐÁNH GIÁ,
>    cấm.
> 2. Không mặc định tiếng Anh (S06 AC-3).
> 3. Một CTA chính trên màn chọn việc (`TodayCard` ba luật).

## 0. Một câu

Người mở app — khách hay tài khoản — thấy một Bạn Đồng Hành có mặt, có trạng thái, nói một sự
thật cụ thể về mình, rồi một nút duy nhất để học tiếp; sau phiên thấy nhịp học đi đều bằng bảy
chấm tuần chứ không bằng phần trăm; và mọi màn của Góc học tập nằm dưới một khuôn URL.

## 1. Đính chính so với spec nền (đọc trước khi làm)

| Spec nền nói                                | Thực tế mã (2026-09-17)                                                                                                                                                                   | Hệ quả cho lát                                                              |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| "`Home` trả `null` khi `!user`" (mục 0, C1) | Route `/` bọc `AllowGuest` (`App.tsx:751`); `AuthProvider` luôn cấp user KHÁCH (`isGuest`), `Home` chỉ trả `null` trong khoảnh khắc loading. Khách đang thấy Home đầy đủ + `GuestBanner`. | P0-3 `GuestHome` là NHÁNH `isGuest` bên trong `Home`, không phải trang mới. |
| "Streak hiện `🔥7` ở header"                | Đúng, `Layout.tsx:169` `streakBadge`, ẩn khi `focus`.                                                                                                                                     | P0-4 giữ, chỉ thu gọn.                                                      |
| Theme `kid` "chưa có màu ấm"                | `kid` accent ĐÃ là cam (`--a-500: 249 115 22`). Màu ấm Companion ở `kid` phải KHÁC cam.                                                                                                   | P0-2 chọn hồng đậm cho `kid` (§P0-2 ③).                                     |
| Huy hiệu "rải ở 3 nơi"                      | Có `lib/achievements.ts` + `achievementRewards.ts` (đã có test). Nguồn sự thật đã tồn tại.                                                                                                | P1-5 đọc từ đó, không tạo bảng mới.                                         |
| Chấm tuần "mới"                             | `lib/weeklyGoal.ts` đã có `getWeekDays(uid): DayActivity[]` (T2→hôm nay) + `getWeeklyProgress`.                                                                                           | P1-5 tái dùng, thêm phần "ngày chưa tới".                                   |

## 2. THỨ TỰ THI HÀNH DUY NHẤT (đã sắp — chủ dự án ra lệnh theo số thứ tự này)

Mười lăm lệnh, mỗi lệnh = MỘT PR. Thứ tự sắp theo bốn tiêu chí, ưu tiên từ trên xuống: (a) lát
sau phụ thuộc lát trước; (b) rủi ro thấp trước để đo phản ứng thật sớm; (c) thứ làm nền cho
nhiều lát (token, reduced-motion) phải xong trước khi lát khác chồng thêm; (d) đổi route
(đụng nhiều E2E) dồn về sau, khi giao diện đã ổn định.

| Lệnh | Lát   | Tên ngắn                                    | Phụ thuộc | Vì sao ở vị trí này                                                            |
| ---- | ----- | ------------------------------------------- | --------- | ------------------------------------------------------------------------------ |
| 1    | P0-1  | Sắp lại trang chủ + một banner phụ          | —         | Chỉ đụng `Home.tsx`, thấy ngay Today là tâm điểm; đo baseline click.           |
| 2    | P0-2  | Token ấm + `CompanionAvatar`/`Bubble`       | —         | Nền cho lệnh 3, 8, 15; phải qua cổng tương phản trước khi ai dùng.             |
| 3    | P2-13 | `prefers-reduced-motion` toàn app           | 2         | Chốt luật animation NGAY sau khi lệnh 2 thêm keyframe, trước khi 7/8 thêm nữa. |
| 4    | P0-3  | `GuestHome`                                 | 2         | Cần avatar/bubble; là lát đổi funnel khách — đo sớm.                           |
| 5    | P0-4  | Header mobile 4 khe + `focus` ẩn bottom nav | —         | Độc lập, nhỏ; làm sau 4 để ảnh chụp guest/home mobile chụp một lần.            |
| 6    | P1-8  | `SubjectSpaceList`                          | —         | Độc lập, nhỏ, hoàn tất bố cục trang chủ trước khi thêm khối mới.               |
| 7    | P1-5  | `WeekRhythm`                                | 6         | Khối mới cuối cùng của trang chủ; cần chỗ đã ổn định từ 1/6.                   |
| 8    | P1-6  | `SessionDone`                               | 2, 7      | Dùng avatar `cheer` + `WeekRhythm` thu gọn.                                    |
| 9    | P1-7  | Sidebar 7 mục + bottom nav                  | —         | Đổi điều hướng sau khi nội dung trang đã chốt; chuẩn bị `hasNote` cho 15.      |
| 10   | P1-9a | URL Lập trình → `/goc-hoc-tap/programming`  | 9         | Đổi route đầu tiên: bộ helper `programmingRoutes.ts` đã có, ít rủi ro nhất.    |
| 11   | P1-9b | URL Tiếng Anh → `/goc-hoc-tap/english`      | 10        | Cần khuôn redirect từ 10; tạo `englishRoutes.ts` mới.                          |
| 12   | P1-9c | Server routing + nginx 301 + SEO            | 10, 11    | Chỉ có nghĩa khi cả hai prefix đã đổi.                                         |
| 13   | P2-10 | `buildProgressStory`                        | 7         | Cần dữ liệu tuần đã hiển thị ổn; đặt ở cột phải + `/tien-do`.                  |
| 14   | P2-12 | Chip gợi ý + 2 demo 30 giây                 | 4, 8, 11  | Demo dùng `SessionDone` và URL Tiếng Anh mới; sinh `homeRoutes.ts`.            |
| 15   | P2-11 | Companion inline trong phiên                | 2, 9, 14  | Phức tạp nhất, dùng `hasNote` (9) và `duongDanHoiDongHanh` (14).               |

```
1 ─► 2 ─► 3
     2 ─► 4 ─► 5 ─► 6 ─► 7 ─► 8
                              9 ─► 10 ─► 11 ─► 12
                         7 ─► 13
                   4,8,11 ─► 14 ─► 15
```

**Luật khi ra lệnh:** lệnh N chỉ được thi hành khi mọi lát nó phụ thuộc đã MERGE vào `main`.
Được phép thi hành song song hai lệnh không phụ thuộc nhau (ví dụ 5 và 6) trên hai nhánh khác
nhau. Không gộp hai lệnh vào một PR: E2E ảnh chụp (Tầng 8b) phải quy được cho đúng một thay đổi.

**Cách ra lệnh:** "thi hành lệnh N" (hoặc "lát P1-5"). Bên thi hành sẽ: đọc lát đó + §3 + spec
nền; mở nhánh; tạo `docs/changelog/`; chạy đủ cổng; tạo PR `feat`/`refactor` theo đúng loại; bật
auto-merge; điền §8 nghiệm thu bằng output thật.

## 3. Quy ước dùng chung cho mọi lát (ô ⑥ chung — lát nào có thêm thì ghi riêng)

- Import xuyên gói `@dhcb/<gói>/<file>` không đuôi; nội bộ gói đường tương đối có `.js`.
- Màu: token `--a-*`/`--z-*`/`content*`/`line-*`; lát P0-2 thêm `--w-*`. **Cấm** `text-zinc-*`
  mới cho chữ nội dung (dùng `text-content`/`text-content-secondary`); cấm hex trong TSX.
- Tương phản: chữ nội dung/tiêu đề AAA ≥ 7:1, thành phần khác AA; canh bởi `e2e/a11y.spec.ts` +
  `e2e/a11y-aaa.spec.ts` (15 trang × 3 theme, 0 vi phạm, không baseline).
- Vùng chạm ≥ 44px: dùng class `tap-44`.
- Chữ giao diện tiếng Việt, comment tiếng Việt, tên biến tiếng Anh; hàm dựng URL tiếng Việt theo
  mẫu `duongDan*` (`lib/programmingRoutes.ts`).
- Không `console.log`; không `any`; dữ liệu ngoài qua Zod.
- Bundle: `.size-limit.json` JS 150 kB / CSS 20 kB; mỗi lát chạm client phải dán số
  `npx size-limit` trước/sau vào PR.
- Ảnh chụp bắt buộc (Tầng 8b): 1440px + 390px, trước/sau, 3 theme, cho MỌI lát chạm giao diện.
  Lệnh: `npm run shots:learning-ux` (mở rộng script nếu trang mới chưa có).
- Analytics: chỉ thêm tên sự kiện vào union `AnalyticsEvent` (`lib/analytics.ts:13`), gọi qua
  `track()`; không fetch tay.
- Cổng commit: `npm run typecheck && npm run lint && npm run format && npm run test:coverage &&
npm run build`; trước push cuối `rm -rf packages/*/dist dist dist-server` rồi `npm run typecheck`.
- PR: tiêu đề khớp regex `pr-policy.yml`; `feat(...)` phải dẫn file này + "Approved for
  implementation" (chỉ khi lát đã được duyệt ở §9). Changelog riêng `docs/changelog/NNNN-*.md`.

---

# P0 — bốn lát đầu

## P0-1 · Sắp lại thứ tự trang chủ + một banner phụ duy nhất (lệnh 1)

### ① Phạm vi

**LÀM:**

- Đổi thứ tự khối trong `Home.tsx` thành: `FirstTaskCard` (nếu có) → `HomeAiBriefingCard` →
  `TodayCard` → `HomeUniversalAiBar` → thẻ "quay lại" → phần môn. (Hiện `TodayCard` đã đứng thứ 3
  sau `HomeAiBriefingCard`; việc thật của lát này là **gỡ khoảng cách/viền để Today là khối tương
  phản lớn nhất** và **đưa mọi banner phụ xuống DƯỚI phần môn**.)
- Hàm thuần `pickHomeBanner(input): HomeBanner | null` chọn ĐÚNG MỘT banner phụ theo ưu tiên
  `planExpiry > promoEnding > pricePromo > rewardTip`.
- Ở trang chủ, chỉ render banner do `pickHomeBanner` trả; các banner đó vẫn render như cũ ở
  trang khác (lát này KHÔNG đụng `AllowGuest`/`RequireAccount` trong `App.tsx`).
- Mobile: khối `topBlocks` (Chào + Today) phải nằm trọn trong 844px chiều cao không cuộn ở 390px.

**KHÔNG LÀM:**

- Không đổi vỏ `HomeAiBriefingCard` (P0-2), không đổi logic `TodayCard`/`buildTodayPlan`.
- Không đụng `SUBJECT_ENTRIES`, không sắp lại môn (P1-8).
- Không đụng `PlanExpiryBanner`/`PromoEndingBanner` bên trong `App.tsx` — chúng vẫn hiện trên
  trang khác; trang chủ chỉ **ẩn** bản của mình khi `pickHomeBanner` không chọn.

### ② Điểm chạm

| Việc | Đường dẫn file                                                  | Ghi chú                                                                  |
| ---- | --------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Thêm | `apps/dhcb/src/lib/home/pickHomeBanner.ts` + `.test.ts`         | thuần, không React, không storage                                        |
| Sửa  | `apps/dhcb/src/pages/core/Home.tsx`                             | thứ tự khối, gọi `pickHomeBanner`, gỡ `RewardTipBanner` khỏi `topBlocks` |
| Sửa  | `apps/dhcb/src/pages/core/Home.test.tsx`, `Home.design.test.ts` | cập nhật thứ tự DOM                                                      |
| Sửa  | `e2e/learning-ux-layout.spec.ts`                                | thêm ca "Today nằm trong fold 390×844"                                   |

**Ảnh hưởng lan ra:** `npm run codemap -- impact apps/dhcb/src/pages/core/Home.tsx` → chỉ
`App.tsx` (route). Banner components không đổi chữ ký.

### ③ Hợp đồng dữ liệu

```ts
// apps/dhcb/src/lib/home/pickHomeBanner.ts
export type HomeBannerKind = 'planExpiry' | 'promoEnding' | 'pricePromo' | 'rewardTip'
export interface PickHomeBannerInput {
  isGuest: boolean
  planExpiresInDays: number | null // null = không có gói trả phí
  promoEndsInDays: number | null // null = không có khuyến mãi đang chạy
  hasRewardTip: boolean // RewardTipBanner có nội dung cho uid này không
}
export interface HomeBanner {
  kind: HomeBannerKind
}
/** Đúng MỘT banner hoặc null. Khách chỉ có thể nhận 'pricePromo'. */
export function pickHomeBanner(input: PickHomeBannerInput): HomeBanner | null
```

Ưu tiên: `planExpiry` khi `planExpiresInDays !== null && ≤ 7` → `promoEnding` khi
`promoEndsInDays !== null && ≤ 3` → `pricePromo` khi `promoEndsInDays !== null` → `rewardTip`
khi `hasRewardTip` → `null`. Khách (`isGuest`): chỉ `pricePromo` hoặc `null`.

**Ca lỗi:** input thiếu trường → TypeScript chặn; không có runtime error path.

### ④ Tiêu chí chấp nhận

- [ ] **AC-1** `pickHomeBanner` test bảng ≥ 10 ca (mỗi nhánh ưu tiên + khách + rỗng) —
      `npx vitest run apps/dhcb/src/lib/home/pickHomeBanner.test.ts`.
- [ ] **AC-2** Trang chủ (user có gói sắp hết hạn + có promo + có reward tip) render ĐÚNG MỘT
      phần tử `[data-home-banner]` — `Home.test.tsx`.
- [ ] **AC-3** Thứ tự DOM trong `<main>`: `#today-card-heading` xuất hiện TRƯỚC ô tìm kiếm
      (`HomeUniversalAiBar`) và TRƯỚC mọi `[data-home-banner]` — `Home.design.test.ts`.
- [ ] **AC-4** Playwright 390×844: `boundingBox` của nút CTA chính trong `TodayCard` có
      `y + height ≤ 844` khi chưa cuộn, ở cả 3 theme — `e2e/learning-ux-layout.spec.ts`.
- [ ] **AC-5** Ảnh chụp trước/sau 1440 + 390 × 3 theme dán vào PR.
- [ ] **AC-6** `npx size-limit` JS không tăng quá 0,3 kB.

### ⑤ Bất biến

| Bất biến                                                | Test canh                                                     |
| ------------------------------------------------------- | ------------------------------------------------------------- |
| `TodayCard` vẫn đúng một CTA, không quyết định việc học | `components/Home/TodayCard.test.tsx` (có sẵn)                 |
| Không mặc định tiếng Anh                                | `packages/core-learner/today/buildTodayPlan.test.ts` (có sẵn) |
| Mỗi khối render một lần (không nhân bản mobile/desktop) | `Home.design.test.ts` (có sẵn, mở rộng)                       |
| `PlanExpiryBanner` vẫn hiện ở trang KHÁC trang chủ      | thêm ca vào `Layout.test.tsx` hoặc `App` test                 |

### ⑥ Quy ước riêng

- Đọc S06 §④ để hiểu vì sao `TodayCard` không được nhận thêm prop quyết định.

---

## P0-2 · Token ấm `--w-*` + `CompanionAvatar` + `CompanionBubble` + thay vỏ lời chào (lệnh 2)

### ① Phạm vi

**LÀM:**

- Thêm 4 token `--w-50 · --w-100 · --w-500 · --w-700` vào `packages/core-ui/theme.css` cho cả 3
  theme + map Tailwind `warm.{50,100,500,700}` trong `apps/dhcb/tailwind.config.js`.
- `CompanionAvatar` (SVG inline, 4 trạng thái, 3 cỡ) — `packages/core-ui/CompanionAvatar.tsx`.
- `CompanionBubble` (bong bóng ≤ 2 dòng, 3 biến thể) — `packages/core-ui/CompanionBubble.tsx`.
- `HomeAiBriefingCard`: thay icon `Bot` + thẻ xám bằng `CompanionAvatar size=48 (md) / 64 (lg)` +
  `CompanionBubble variant="home"`; GIỮ nguyên `fetchProactiveBriefing`, `speak`, `FALLBACK_SUMMARY`,
  `showDailyWords`.
- Gộp thẻ "quay lại sau bỏ bẵng" (`showComeback`, `Home.tsx:160-213`) vào **dòng thứ hai** của
  bong bóng: câu "Đã N ngày rồi — bắt đầu nhẹ thôi." + hai link chữ nhỏ (`Ôn k thẻ` · `Học k từ
mới`) đặt DƯỚI bong bóng, không còn card riêng. Nút đóng giữ `dismissComebackToday`.
- Giọng viết Companion: hằng khuôn câu chào ở `apps/dhcb/src/prompts/companionVoice.ts` (KHÔNG
  gọi AI thêm; chỉ khuôn chuỗi cho phần không đến từ `/api/proactive-briefing`).

**KHÔNG LÀM:**

- Không đụng `/api/proactive-briefing` server, không đổi hợp đồng `ProactiveBriefing`.
- Không thay `AvatarSpeaking.tsx` (viseme LED của trang Bạn Đồng Hành) — hai avatar khác mục đích;
  ghi nợ hợp nhất ở P2-11.
- Không animation Canvas/WebGL; không nạp font/asset ngoài.

### ② Điểm chạm

| Việc | Đường dẫn file                                                | Ghi chú                                                                                                          |
| ---- | ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Sửa  | `packages/core-ui/theme.css`                                  | 3 khối `[data-theme=…]` + `:root` fallback                                                                       |
| Sửa  | `apps/dhcb/tailwind.config.js`                                | `colors.warm`                                                                                                    |
| Thêm | `packages/core-ui/CompanionAvatar.tsx` + `.test.tsx`          |                                                                                                                  |
| Thêm | `packages/core-ui/CompanionBubble.tsx` + `.test.tsx`          |                                                                                                                  |
| Thêm | `apps/dhcb/src/prompts/companionVoice.ts` + golden snapshot   | nếu chuỗi đi vào prompt AI thì thêm vào `golden.test.ts`; ở lát này KHÔNG đi vào prompt AI → chỉ unit test chuỗi |
| Sửa  | `apps/dhcb/src/components/Home/HomeAiBriefingCard.tsx` + test |                                                                                                                  |
| Sửa  | `apps/dhcb/src/pages/core/Home.tsx`                           | gỡ card comeback, truyền `comeback` prop                                                                         |
| Sửa  | `scripts/fixed-color-contrast-audit.ts`                       | thêm `--w-*` vào bảng token được quét                                                                            |
| Sửa  | `e2e/comeback.spec.ts`                                        | selector mới                                                                                                     |

**Ảnh hưởng lan ra:** `codemap -- impact packages/core-ui/theme.css` → toàn app (chỉ THÊM biến,
không sửa biến cũ nên không đổi hành vi). `impact HomeAiBriefingCard.tsx` → `Home.tsx` duy nhất.

### ③ Hợp đồng dữ liệu

```css
/* packages/core-ui/theme.css — giá trị RGB tách khoảng trắng, cùng quy ước --a-* */
[data-theme='blue-sky'] {
  --w-50: 255 251 235;
  --w-100: 254 243 199;
  --w-500: 217 119 6;
  --w-700: 146 64 14;
}
[data-theme='dark-blue'] {
  --w-50: 45 36 18;
  --w-100: 69 52 20;
  --w-500: 251 191 36;
  --w-700: 253 224 71;
}
[data-theme='kid'] {
  --w-50: 253 242 248;
  --w-100: 252 231 243;
  --w-500: 190 24 93;
  --w-700: 131 24 67;
}
```

Quy tắc dùng: nền bong bóng `bg-warm-50` + viền `border-warm-100`; viền/vòng avatar
`warm-500`; **chữ trong bong bóng LUÔN `text-content`** (không `text-warm-*`) để AAA.

```ts
// packages/core-ui/CompanionAvatar.tsx
export type CompanionMood = 'idle' | 'thinking' | 'cheer' | 'hasNote'
export interface CompanionAvatarProps {
  mood?: CompanionMood // mặc định 'idle'
  size?: 32 | 48 | 64 // px, mặc định 48
  /** Có nhãn cho trình đọc màn hình không; mặc định true = aria-hidden (trang trí). */
  decorative?: boolean
  className?: string
}
// packages/core-ui/CompanionBubble.tsx
export interface CompanionBubbleProps {
  variant: 'home' | 'inline' | 'done'
  /** Dòng 1, bắt buộc, ≤ 90 ký tự (cắt bằng CSS line-clamp, KHÔNG cắt chuỗi). */
  lead: string
  /** Dòng 2, ≤ 120 ký tự. */
  detail?: string
  onSpeak?: () => void // hiện nút 🔊 khi có
  onDismiss?: () => void // hiện nút ✕ khi có (chỉ 'inline' và comeback)
  children?: ReactNode // link chữ nhỏ dưới bong bóng
}
// apps/dhcb/src/prompts/companionVoice.ts
export function loiChaoTheoGio(hour: number, name?: string): string // "Chào buổi sáng, Minh."
export function cauQuayLai(daysAway: number): string // "Đã 5 ngày rồi — bắt đầu nhẹ thôi, không cần ôn hết nợ cũ."
```

Trạng thái avatar: `idle` chớp mắt mỗi 6s (CSS keyframe, tắt khi `prefers-reduced-motion`);
`thinking` ba chấm nhấp nháy; `cheer` scale 1→1.08→1 trong 600ms rồi tự về `idle` (component tự
quản bằng `setTimeout`, dọn khi unmount); `hasNote` chấm nhỏ `warm-500` góc phải trên.

**Ca lỗi:** `fetchProactiveBriefing` fail → bong bóng dùng `FALLBACK_SUMMARY` (như hiện tại);
`speak` fail → nút 🔊 disabled 2s rồi bật lại; không throw.

### ④ Tiêu chí chấp nhận

- [ ] **AC-1** `scripts/fixed-color-contrast-audit.ts` chạy xanh với `--w-*`; `text-content` trên
      `bg-warm-50` đo ≥ 7:1 ở cả 3 theme (in số vào PR) — `npx tsx scripts/fixed-color-contrast-audit.ts`.
- [ ] **AC-2** `CompanionAvatar` render `<svg>` với `aria-hidden="true"` khi `decorative` (mặc
      định) và `role="img" aria-label="Bạn Đồng Hành"` khi `decorative={false}`; `mood='cheer'`
      tự về `idle` sau 600ms (fake timers) — `CompanionAvatar.test.tsx`.
- [ ] **AC-3** `CompanionBubble` không bao giờ cắt chuỗi trong JS (`lead` 200 ký tự vẫn nằm nguyên
      trong DOM, chỉ `line-clamp-2`) — test.
- [ ] **AC-4** `HomeAiBriefingCard` không còn import `Bot` từ lucide; vẫn gọi
      `fetchProactiveBriefing` đúng 1 lần; khi có `comeback={ daysAway: 5, … }` thì DOM có
      chuỗi "Đã 5 ngày" và KHÔNG có phần tử `.glass` card riêng — `HomeAiBriefingCard.test.tsx`.
- [ ] **AC-5** `e2e/comeback.spec.ts` xanh với selector mới; `e2e/a11y*.spec.ts` 0 vi phạm.
- [ ] **AC-6** `npx size-limit` JS tăng ≤ 3 kB (dán số).
- [ ] **AC-7** Ảnh chụp 3 theme × 2 bề rộng: avatar và bong bóng là vùng màu ấm DUY NHẤT; nút
      Today vẫn là accent (kiểm bằng mắt, dán ảnh).

### ⑤ Bất biến

| Bất biến                                        | Test canh                                                         |
| ----------------------------------------------- | ----------------------------------------------------------------- |
| Thẻ chào KHÔNG quyết định việc học (S06 AC-14)  | `HomeAiBriefingCard.test.tsx` — không có link tới `/lo-trinh-hoc` |
| Dòng "x/y từ" chỉ hiện khi `showDailyWords`     | test có sẵn, giữ                                                  |
| Comeback chỉ hiện khi `shouldShowComeback(uid)` | `lib/comeback.test.ts` (có sẵn)                                   |
| Mọi theme vẫn 0 vi phạm a11y                    | `e2e/a11y.spec.ts`, `a11y-aaa.spec.ts`                            |

### ⑥ Quy ước riêng

- SVG inline viết tay ≤ 1,5 kB, không import file `.svg` (tránh thêm chunk).
- Animation qua class Tailwind `animate-*` khai trong `tailwind.config.js` keyframes (đã có
  `scale-in`, `pulse-ring`); gói mọi keyframe mới trong `@media (prefers-reduced-motion: no-preference)`.

---

## P0-3 · `GuestHome` — trang chủ cho khách (lệnh 4)

### ① Phạm vi

**LÀM:**

- Trong `Home.tsx`: khi `isGuest` (từ `useAuth()`), render `GuestHome` thay vì bố cục thường.
- `GuestHome` = 3 khối: (1) `CompanionAvatar` + `CompanionBubble variant="home"` tự giới thiệu
  (chuỗi tĩnh, không gọi API); (2) CTA duy nhất "Bắt đầu — chọn việc đầu tiên" → `/bat-dau`;
  dưới nút là dòng chữ "Không cần tài khoản"; (3) dải môn từ `SUBJECT_ENTRIES` dạng chip
  (`entry.label` → `entry.ctaPath`) + 2 trụ.
- `GuestBanner` (`App.tsx` `AllowGuest`) đổi điều kiện: chỉ hiện khi khách **đã có ít nhất một
  phiên học** (`hasAnyGuestSession()` — đếm khoá `LEARNING_SESSION_PREFIX` trong localStorage
  hoặc `readLocalIntent()` đã có `chosenTaskId`). Trước đó không hiện.
- Không render `HomeUniversalAiBar`, `TodayCard`, streak, `FirstTaskCard` cho khách.

**KHÔNG LÀM:**

- Không đụng `/bat-dau` (`StartByIntent`), không đụng `pickStartAction`.
- Không làm hai "demo 30 giây" (P2-12) — chỉ chừa chỗ (không có placeholder rỗng trong DOM).
- Không đổi `AuthProvider`/`isGuest`.

### ② Điểm chạm

| Việc | Đường dẫn file                                               | Ghi chú                |
| ---- | ------------------------------------------------------------ | ---------------------- |
| Thêm | `apps/dhcb/src/components/Home/GuestHome.tsx` + `.test.tsx`  |                        |
| Thêm | `apps/dhcb/src/lib/guestActivity.ts` + `.test.ts`            | `hasAnyGuestSession()` |
| Sửa  | `apps/dhcb/src/pages/core/Home.tsx`                          | nhánh `isGuest`        |
| Sửa  | `apps/dhcb/src/components/GuestBanner.tsx` + `App.tsx`       | điều kiện hiện         |
| Sửa  | `e2e/start-by-intent.spec.ts`, thêm `e2e/guest-home.spec.ts` |                        |
| Sửa  | `scripts/shots-learning-ux.ts`                               | thêm màn guest         |

**Ảnh hưởng lan ra:** `GuestBanner` được import ở `App.tsx` duy nhất. `Home.tsx` → `App.tsx`.

### ③ Hợp đồng dữ liệu

```ts
// apps/dhcb/src/lib/guestActivity.ts
/** Khách đã làm ít nhất một việc thật trên máy này chưa (phiên học hoặc đã chọn việc ở /bat-dau). */
export function hasAnyGuestSession(): boolean // đọc localStorage, try/catch → false
// GuestHome: không prop. Chuỗi tĩnh:
//  lead:   'Chào bạn. Mình là Bạn Đồng Hành — học cùng bạn mỗi ngày.'
//  detail: 'Từ tiếng Anh tới lập trình, toán, lý, hoá, sinh — bắt đầu từ một việc nhỏ.'
```

Sự kiện: `track('cta_click', { refCode: 'guest_home_start' })` khi bấm CTA (tên event có sẵn).

**Ca lỗi:** localStorage bị chặn → `hasAnyGuestSession()` = false → banner không hiện; GuestHome
vẫn render đầy đủ (không phụ thuộc storage).

### ④ Tiêu chí chấp nhận

- [ ] **AC-1** Với `isGuest = true`, `Home` render `GuestHome` và KHÔNG render `#today-card-heading`,
      ô tìm kiếm, `FirstTaskCard` — `Home.test.tsx`.
- [ ] **AC-2** `GuestHome` có ĐÚNG MỘT `<a>`/`<button>` mang class nút chính (`Button` variant
      primary) và nó trỏ `/bat-dau` — `GuestHome.test.tsx`.
- [ ] **AC-3** Dải môn render đủ `SUBJECT_ENTRIES.length` chip, mỗi chip `href === entry.ctaPath` —
      test.
- [ ] **AC-4** `hasAnyGuestSession()` bảng 4 ca: rỗng → false; có khoá `dhcb_lsession_v1_*` → true;
      có intent `chosenTaskId` → true; storage throw → false.
- [ ] **AC-5** E2E khách mới mở `/`: KHÔNG thấy `GuestBanner`; bấm CTA → URL `/bat-dau`; sau khi
      hoàn tất 1 phiên (dùng helper có sẵn của `learning-session-resume.spec.ts`) quay về `/` →
      thấy `GuestBanner` — `e2e/guest-home.spec.ts`.
- [ ] **AC-6** Thời gian tới CTA: Playwright đo `performance.now()` từ `goto('/')` tới CTA
      `visible` < 3000ms trên CI (ghi số vào PR; mục tiêu sản phẩm 10s tính cả đọc).
- [ ] **AC-7** a11y 3 theme xanh cho `/` ở trạng thái khách (thêm vào danh sách 15 trang nếu
      chưa có ca guest).
- [ ] **AC-8** Ảnh chụp guest 1440 + 390 × 3 theme.

### ⑤ Bất biến

| Bất biến                                                                                  | Test canh                              |
| ----------------------------------------------------------------------------------------- | -------------------------------------- |
| Khách vẫn dùng trọn `/bat-dau` không token (S05)                                          | `e2e/start-by-intent.spec.ts` (có sẵn) |
| Không route nào chuyển từ `AllowGuest` sang `RequireAccount`                              | `e2e/login-redirect.spec.ts` (có sẵn)  |
| Không mặc định tiếng Anh: chip môn thứ tự đúng `SUBJECT_ENTRIES`, không môn nào "nổi" hơn | `GuestHome.test.tsx`                   |

### ⑥ Quy ước riêng

- Đọc `docs/specs/2026-09-15-mo-xem-web-khong-can-dang-nhap.md` §③ trước (luật `AllowGuest`).

---

## P0-4 · Header mobile 4 khe + `focus` ẩn bottom nav (lệnh 5)

### ① Phạm vi

**LÀM:**

- Dưới 1024px (`lg:hidden` phần tử, hoặc điều kiện JS `useIsDesktopViewport()` khi cần không render):
  ẩn **bộ chuyển Studio** và **nút đổi theme** khỏi header; bộ chuyển Studio vào một mục "Không
  gian" trong trang Hồ sơ (`/trang-ca-nhan`); nút theme đã có ở Hồ sơ/`/cai-dat` — xác nhận rồi
  gỡ ở header mobile.
- Ở trang chủ mobile: gỡ nút "Đồng Hành AI" khỏi header (Orb bottom nav + Ask bar đã là hai lối).
  Trang khác giữ nút này.
- `focus={true}`: ngoài 2 khe đã ẩn, **ẩn `BottomNav`** — thêm cờ qua `document.documentElement.dataset.focus='1'`
  (cùng cơ chế `dataset.sidebar`), `BottomNav` đọc `data-focus` bằng CSS `[data-focus='1'] nav.bottom-nav { display:none }`.
- Nhãn nút Back mobile: giữ icon-only dưới `sm` (đã vậy), `aria-label` = `backLabel` (đã vậy).

**KHÔNG LÀM:**

- Không đụng desktop (`lg:`) header; không đụng `DesktopSidebar` (P1-7).
- Không đổi `PageHeader`.
- Không gỡ streak badge (giữ, đã ẩn khi `focus`).

### ② Điểm chạm

| Việc | Đường dẫn file                                              | Ghi chú                                 |
| ---- | ----------------------------------------------------------- | --------------------------------------- |
| Sửa  | `apps/dhcb/src/components/Layout.tsx` + `.test.tsx`         | điều kiện render 3 nút; `dataset.focus` |
| Sửa  | `apps/dhcb/src/components/BottomNav.tsx`                    | class `bottom-nav`                      |
| Sửa  | `apps/dhcb/src/index.css`                                   | rule `[data-focus='1']`                 |
| Sửa  | `apps/dhcb/src/pages/core/Profile.tsx`                      | mục "Không gian" (danh sách `STUDIOS`)  |
| Sửa  | `e2e/mobile-layout-guards.spec.ts`, `e2e/bottomnav.spec.ts` |                                         |

**Ảnh hưởng lan ra:** `codemap -- impact Layout.tsx` → ~80 trang dùng `Layout` (chỉ đổi header,
không đổi prop → không cần sửa trang nào). `impact BottomNav.tsx` → `App.tsx`.

### ③ Hợp đồng dữ liệu

```ts
// Layout props KHÔNG đổi. Quy tắc render header < 1024px:
//   isHome (pathname === '/'): [Logo] ............ [streak] [avatar]
//   trang thường:              [← back] [title?] ... [AI] [avatar]
//   focus:                     [← back] [extra?] ... [AI-inline?] [avatar]   (không streak, không Studio, không theme; BottomNav ẩn)
// document.documentElement.dataset.focus: '1' khi focus, xoá khi unmount.
```

**Ca lỗi:** không có.

### ④ Tiêu chí chấp nhận

- [ ] **AC-1** Render `Layout` ở viewport 390 (jsdom + `matchMedia` mock): header có ≤ 4 phần
      tử tương tác (`button, a`) trên trang chủ, ≤ 4 trên trang thường, ≤ 3 khi `focus` —
      `Layout.test.tsx` đếm `getAllByRole`.
- [ ] **AC-2** `focus` → `document.documentElement.dataset.focus === '1'`; unmount → xoá — test.
- [ ] **AC-3** Playwright 390: trang bài học Lập trình (`focus`) KHÔNG thấy `nav[aria-label="Điều hướng chính"]`;
      trang chủ THẤY — `e2e/bottomnav.spec.ts`.
- [ ] **AC-4** Playwright 360×740: không phần tử header nào bị `truncate` mất chữ (kiểm
      `scrollWidth <= clientWidth` cho từng nút) — `mobile-layout-guards.spec.ts`.
- [ ] **AC-5** Trang Hồ sơ có mục "Không gian" liệt kê đủ `STUDIOS.length` mục — test Profile.
- [ ] **AC-6** a11y 3 theme xanh; ảnh chụp 390 trước/sau cho `/`, một trang thường, một trang focus.

### ⑤ Bất biến

| Bất biến                                                 | Test canh                                                         |
| -------------------------------------------------------- | ----------------------------------------------------------------- |
| Nút Back giữ nhãn đích thật (changelog 0359)             | `e2e/programming-lesson.spec.ts`, `english-tools-context.spec.ts` |
| Phím `/` vẫn focus ô hỏi chính (audit B20)               | `e2e/home-quick-ask.spec.ts`                                      |
| Reachability (kéo màn) vẫn hoạt động ở trang không focus | `e2e/mobile-layout-guards.spec.ts`                                |
| Desktop header không đổi                                 | ảnh chụp 1440 trước/sau giống nhau (diff pixel = 0)               |

### ⑥ Quy ước riêng

- `useIsDesktopViewport()` để KHÔNG render trùng phần tử ở hai bề rộng (không dùng `lg:hidden` cho phần tử tương tác có `aria`).
- `dataset.focus` dọn khi unmount (giống `dataset.sidebar` ở `DesktopSidebar`).

---

# P1 — nhịp học, sau phiên, điều hướng, URL

## P1-5 · `WeekRhythm` — 7 chấm tuần + nhiệm vụ + huy hiệu mới nhất (lệnh 7)

### ① Phạm vi

**LÀM:**

- Component `WeekRhythm` đặt ngay dưới `TodayCard` (mobile) / cột phải trên cùng (desktop).
- 7 chấm T2→CN: ● ngày có học (`DayActivity.active`), ○ ngày đã qua không học, ◐ hôm nay chưa
  học, ▢ ngày chưa tới (mờ), kèm chữ "Tuần này 4/7 ngày" (số ngày học / 7, KHÔNG phải / mục tiêu —
  mục tiêu tuần vẫn ở `/tien-do`).
- Dòng 2: "Nhiệm vụ 1/3" từ `fetchQuestsStatus()` (đếm quest `canClaim` + đã claim hôm nay; nếu
  API null → ẩn dòng) · "Huy hiệu mới: <tên>" từ `lib/achievements.ts` (mới nhất theo thời gian
  mở khoá; không có → ẩn).
- Cả khối là một `<Link to="/nhiem-vu">`.
- Ẩn hoàn toàn khi: khách, hoặc `getWeekDays(uid)` toàn `active=false` VÀ chưa từng có streak
  (`getStreak(uid) === 0`) — không hiện "0/7".

**KHÔNG LÀM:**

- Không đổi cách tính streak/tuần (`storage.ts`, `weeklyGoal.ts`).
- Không đổi `/nhiem-vu`, `QuestsPanel`.
- Không tạo API mới; không gọi AI.

### ② Điểm chạm

| Việc | Đường dẫn file                                               | Ghi chú                                |
| ---- | ------------------------------------------------------------ | -------------------------------------- |
| Thêm | `apps/dhcb/src/lib/home/weekRhythm.ts` + `.test.ts`          | thuần: `buildWeekRhythm`               |
| Thêm | `apps/dhcb/src/components/Home/WeekRhythm.tsx` + `.test.tsx` |                                        |
| Sửa  | `apps/dhcb/src/pages/core/Home.tsx`                          | lắp vào 2 bố cục                       |
| Sửa  | `apps/dhcb/src/lib/achievements.ts`                          | thêm `latestUnlocked(uid)` nếu chưa có |
| Sửa  | `e2e/today-plan.spec.ts` hoặc thêm `e2e/week-rhythm.spec.ts` |                                        |

### ③ Hợp đồng dữ liệu

```ts
// apps/dhcb/src/lib/home/weekRhythm.ts
export type DayDot = 'done' | 'missed' | 'today-pending' | 'future'
export interface WeekRhythmModel {
  dots: DayDot[] // luôn length 7, index 0 = T2
  daysDone: number // 0..7
  quests?: { done: number; total: number }
  latestBadge?: { id: string; label: string }
  visible: boolean // false = không render gì
}
export function buildWeekRhythm(input: {
  weekDays: DayActivity[] // getWeekDays(uid): T2 → hôm nay
  todayIndex: number // 0..6
  streak: number
  quests: QuestsStatus | null
  latestBadge: { id: string; label: string } | null
}): WeekRhythmModel
```

**Ca lỗi:** `fetchQuestsStatus()` reject/null → `quests` undefined (dòng ẩn), không toast.

### ④ Tiêu chí chấp nhận

- [ ] **AC-1** `buildWeekRhythm` bảng ≥ 8 ca: T2 chưa học (`[today-pending, future×6]`); CN đủ
      7; giữa tuần có nghỉ; tuần rỗng + streak 0 → `visible=false`; tuần rỗng + streak>0 →
      `visible=true` — `weekRhythm.test.ts`.
- [ ] **AC-2** DOM: đúng 7 phần tử `[data-dot]` với `data-dot` ∈ 4 giá trị; cụm chấm
      `role="img"` có `aria-label` dạng "Tuần này học 4 trên 7 ngày". Tên liên kết lấy từ
      nội dung để giữ nguyên chữ hiển thị, kể cả nhiệm vụ/huy hiệu (WCAG 2.5.3; đồng bộ khi
      nâng axe-core 4.14 ngày 2026-10-22) — `WeekRhythm.test.tsx`.
- [ ] **AC-3** Không có ký tự `%` và không có chuỗi khớp `/\b[ABC][12]\b/` hay `/\bP[1-6]\b/`
      trong DOM của `WeekRhythm` — test bất biến.
- [ ] **AC-4** Khách → `Home` không render `WeekRhythm` — `Home.test.tsx`.
- [ ] **AC-5** E2E: sau khi hoàn tất một hoạt động (helper sẵn có), quay về `/`, chấm hôm nay
      `data-dot="done"` — spec E2E.
- [ ] **AC-6** a11y + ảnh chụp 3 theme × 2 bề rộng; size-limit ≤ +1,5 kB.

### ⑤ Bất biến

| Bất biến                                                                                                | Test canh                     |
| ------------------------------------------------------------------------------------------------------- | ----------------------------- |
| Chấm "done" chỉ khi `DayActivity.active` thật (không vẽ ✓ giả — nguyên tắc của `WeeklyGoalCelebration`) | `weekRhythm.test.ts`          |
| Không con số chẩn đoán trên trang chủ                                                                   | AC-3                          |
| `getWeekDays` không đổi chữ ký                                                                          | `weeklyGoal.test.ts` (có sẵn) |

### ⑥ Quy ước riêng

- Ngày/tuần tính theo giờ Việt Nam qua `lib/date.ts` (`vnDayOfWeek`, `vnDateStr`), KHÔNG dùng `Date.getDay()`.
- Chữ trạng thái AAA (`text-content`); chấm dùng `bg-accent-500`/`bg-line-strong`, không hex.

---

## P1-6 · `SessionDone` — một màn kết gộp ba celebration (lệnh 8)

### ① Phạm vi

**LÀM:**

- `SessionDone` (overlay, dựa trên `Celebration.tsx`) hiện khi một hoạt động học kết thúc, gồm 3
  tầng có điều kiện: (1) `CompanionAvatar mood="cheer"` + `CompanionBubble variant="done"` nói
  **một sự thật** của phiên; (2) `WeekRhythm` thu gọn (chỉ hàng chấm) + dòng streak/nhiệm vụ nếu
  vừa đổi; (3) CTA phụ "Thêm 3 phút? Ôn k thẻ" (khi có SRS due) + link chữ "Về trang chủ".
- Gate gộp: `StreakCelebration` (`shouldCelebrateStreak`) và `WeeklyGoalCelebration`
  (`shouldCelebrateWeeklyGoal`) KHÔNG còn tự bật overlay riêng; nội dung của chúng thành tầng (2).
  `markWeeklyGoalCelebrated`/mark streak vẫn gọi để không lặp.
- Query `?xong=1` gắn vào URL bài khi mở overlay (`history.replaceState`), F5/Back giữ overlay;
  đóng overlay thì xoá query.
- Nơi gọi: những trang hiện gọi `StreakCelebration`/`WeeklyGoalCelebration`
  (`studyTabs/TodayLesson.tsx`, `pages/subjects/english/Challenge.tsx`) + bài Lập trình + bài STEM
  (điểm "hoàn thành" đã có evidence).

**KHÔNG LÀM:**

- Không đụng kết quả chấm chi tiết (IELTS band ở luyện viết/nói) — màn riêng, người dùng mở.
- Không xoá `Celebration.tsx` (dùng lại), không xoá `VocabMilestone`.
- Không tính "sự thật" bằng AI; chỉ từ dữ liệu phiên (§③).

### ② Điểm chạm

| Việc | Đường dẫn file                                                                                                                            | Ghi chú                        |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| Thêm | `apps/dhcb/src/lib/session/sessionFact.ts` + `.test.ts`                                                                                   | thuần: `buildSessionFact`      |
| Thêm | `apps/dhcb/src/components/SessionDone.tsx` + `.test.tsx`                                                                                  |                                |
| Sửa  | `StreakCelebration.tsx`, `WeeklyGoalCelebration.tsx`                                                                                      | thành sub-block, không overlay |
| Sửa  | `studyTabs/TodayLesson.tsx`, `pages/subjects/english/Challenge.tsx`, `pages/programming/Lesson*.tsx`, `pages/learning/StemLessonView.tsx` | gọi `SessionDone`              |
| Sửa  | `e2e/quiz-session.spec.ts`, `e2e/learning-session-resume.spec.ts`                                                                         |                                |

### ③ Hợp đồng dữ liệu

```ts
// apps/dhcb/src/lib/session/sessionFact.ts
export interface SessionOutcome {
  subjectId: string
  contentId: string
  kind: 'lesson' | 'quiz' | 'speaking' | 'writing' | 'review' | 'project-step'
  steps: number // số bước đã làm
  correct?: number // số câu đúng (quiz/review)
  total?: number
  newItems?: string[] // từ/khái niệm lần đầu đúng (≤ 3, đã lọc)
  durationSec: number
}
export interface SessionFact {
  lead: string // "Xong rồi! Bạn vừa nói được 5 câu."
  detail?: string // "'I'd love to' là lần đầu bạn dùng đúng."
}
export function buildSessionFact(o: SessionOutcome): SessionFact
// Luật: lead LUÔN có một số đếm việc đã làm (bước/câu/thẻ); detail chỉ khi có newItems;
// KHÔNG có "%", không "band", không "trình độ". Câu cảm thán một mình ("Tuyệt vời!") là cấm.

export interface SessionDoneProps {
  outcome: SessionOutcome
  uid: string
  srsDue: number // 0 = ẩn CTA phụ
  onClose: () => void // về trang chủ hoặc đóng
  onMore?: () => void // CTA phụ
}
```

**Ca lỗi:** `outcome.steps === 0` → không mở overlay (không ăn mừng việc chưa làm). `srsDue < 0`
→ coi như 0.

### ④ Tiêu chí chấp nhận

- [ ] **AC-1** `buildSessionFact` bảng ≥ 12 ca (6 `kind` × có/không `newItems`); mọi `lead` khớp
      `/\d/` và không khớp `/%|band|trình độ|Tuyệt vời!$/` — test.
- [ ] **AC-2** `SessionDone` render đúng 1 nút chính + ≤ 1 CTA phụ; có `role="dialog"` `aria-modal`
      và focus trap (dùng `useDialogBehavior` có sẵn) — test.
- [ ] **AC-3** Trong một lần hoàn thành có cả streak mốc 7 lẫn đạt mục tiêu tuần: DOM chỉ có MỘT
      `[role="dialog"]` — test tích hợp với `TodayLesson`.
- [ ] **AC-4** Mở overlay → URL có `?xong=1`; reload (E2E) → overlay vẫn hiện; đóng → query mất —
      `e2e/quiz-session.spec.ts`.
- [ ] **AC-5** `steps === 0` → không dialog — test.
- [ ] **AC-6** `prefers-reduced-motion` → không confetti (đã có ở `Celebration`), avatar không
      `cheer` animation — test class.
- [ ] **AC-7** a11y (thêm trang có overlay vào `a11y-modals.spec.ts`), ảnh chụp 3 theme × 2.

### ⑤ Bất biến

| Bất biến                                              | Test canh                                                       |
| ----------------------------------------------------- | --------------------------------------------------------------- |
| Streak/tuần chỉ mừng 1 lần (mark* vẫn ghi)            | `storage.test.ts` `shouldCelebrateStreak`, `weeklyGoal.test.ts` |
| Chỉ ăn mừng thành tựu thật (`Celebration` nguyên tắc) | AC-5                                                            |
| Phiên S08 vẫn đóng đúng (S11)                         | `e2e/learning-session-resume.spec.ts`                           |

### ⑥ Quy ước riêng

- Overlay dùng `useDialogBehavior` (focus trap, Esc, trả focus) như `Modal.tsx`.
- Sự kiện `session_done_view`/`session_done_more` thêm vào union `AnalyticsEvent`.
- Confetti chỉ qua `lib/confetti.ts` (lazy, tôn trọng reduce).

---

## P1-7 · Sidebar 10 → 7 mục + nhãn bottom nav đồng bộ (lệnh 9)

### ① Phạm vi

**LÀM (desktop `DesktopSidebar.tsx`):**

- `MAIN_NAV` = Trang chủ · **Góc học tập ▾** (giữ `SUBJECT_CHILDREN`) · Ôn tập · Bạn Đồng Hành ·
  **Sự nghiệp & Đời sống ▾** (nhóm mới gộp `career` + `worklife`, mục con = 2 studio đó).
- Gỡ "Luyện tập" khỏi `MAIN_NAV` (đường `/luyen-tap` vẫn tồn tại; vào từ mục con môn/hub).
- `CORE_BOTTOM` = Tiến độ · Hồ sơ. "Nâng cấp" thành dòng nhỏ dưới avatar: "Free · Nâng cấp" (link
  `/nang-cap`), không màu amber ở trạng thái thường, `text-content-muted`, hover → `text-content`.
- Cập nhật `ACTIVE_ORDER`, `navTree.ts` (nhóm mới), `resolveActiveNav` không đổi.

**LÀM (mobile `BottomNav.tsx`):**

- Tab 4 "Luyện tập" → "Ôn tập", `to="/goc-hoc-tap/on-tap"`, active theo `REVIEW_PATHS`.
- Nhãn: Trang chủ · Học · Đồng Hành · Ôn tập · Tôi (≤ 8 ký tự).
- Bỏ `scale-105/110` khi active; giữ đổi màu; thêm chấm `hasNote` cho Orb (đọc từ prop
  `companionHasNote?: boolean`, mặc định false — nguồn dữ liệu nối ở P2-11).

**KHÔNG LÀM:**

- Không đổi route nào; không đổi `STUDIOS`; không đổi `NAV_HIDDEN_PATHS`.
- Không đổi cơ chế thu gọn `--sidebar-w`.

### ② Điểm chạm

| Việc | Đường dẫn file                                                                                                 | Ghi chú  |
| ---- | -------------------------------------------------------------------------------------------------------------- | -------- |
| Sửa  | `components/DesktopSidebar.tsx` + `.test.tsx`                                                                  |          |
| Sửa  | `components/BottomNav.tsx`                                                                                     |          |
| Sửa  | `lib/navTree.ts` (+ test), `lib/navPaths.ts` (thêm `CAREER_LIFE_PATHS = [...CAREER_PATHS, ...WORKLIFE_PATHS]`) |          |
| Sửa  | `e2e/bottomnav.spec.ts`, `e2e/v2-hubs.spec.ts`, `e2e/review-hub.spec.ts`, `Layout.test.tsx`                    | nhãn/tab |

**Ảnh hưởng lan ra:** `codemap -- impact lib/navPaths.ts` → `DesktopSidebar`, `BottomNav`,
`Layout`, `breadcrumb.ts` — chạy và dán danh sách vào PR.

### ③ Hợp đồng dữ liệu

```ts
// navPaths.ts
export const CAREER_LIFE_PATHS: readonly string[] // = CAREER_PATHS ∪ WORKLIFE_PATHS, không trùng
// BottomNav
interface Props {
  triggerHandlers?
  isReachabilityOpen?
  companionHasNote?: boolean
}
```

### ④ Tiêu chí chấp nhận

- [ ] **AC-1** `DesktopSidebar` render đúng 7 `<a>` cấp 1 khi mọi nhóm đóng (đếm
      `getAllByRole('link')` trừ mục con) — test.
- [ ] **AC-2** Không mục nào xuất hiện hai lần (tập `href` cấp 1 + cấp 2 không trùng) — test.
- [ ] **AC-3** `resolveActiveNav` cho `/su-nghiep`, `/cong-viec`, `/cuoc-song` → mục "Sự nghiệp &
      Đời sống"; `/luyen-tap` → "Góc học tập" (không còn mục riêng) — test bảng.
- [ ] **AC-4** `BottomNav`: 5 tab, nhãn đúng, tab 4 `href="/goc-hoc-tap/on-tap"`, không class
      `scale-1*` — test + E2E.
- [ ] **AC-5** Playwright 360: không nhãn nào bị cắt (`scrollWidth <= clientWidth`).
- [ ] **AC-6** Link "Nâng cấp" vẫn tồn tại trong sidebar (`href="/nang-cap"`) — test (bảo vệ
      chuyển đổi VIP).
- [ ] **AC-7** a11y + ảnh chụp 1440 (sidebar mở/thu) + 390.

### ⑤ Bất biến

| Bất biến                                                      | Test canh                          |
| ------------------------------------------------------------- | ---------------------------------- |
| Thu gọn sidebar vẫn ghi `dataset.sidebar` + `--sidebar-w`     | `DesktopSidebar.test.tsx` (có sẵn) |
| `/goc-hoc-tap/on-tap` sáng "Ôn tập", không sáng "Góc học tập" | test có sẵn (S12-1), giữ           |
| Mọi route trong `LEARNING_PATHS` vẫn làm sáng đúng một mục    | `navPaths.test.ts`                 |

### ⑥ Quy ước riêng

- Đọc `lib/navPaths.ts` đầu file: thứ tự XÉT active khác thứ tự HIỂN THỊ (`resolveActiveNav`).
- `NAV_HIDDEN_PATHS` và cơ chế `dataset.sidebar`/`--sidebar-w` không đổi.
- PR loại `refactor(nav)`.

---

## P1-8 · `SubjectSpaceList` — môn đang học lên đầu, trạng thái bằng chữ (lệnh 6)

### ① Phạm vi

**LÀM:**

- Tách khối môn (`Home.tsx` từ `SUBJECT_ICON` tới hết `subjectSpaces`) thành
  `components/Home/SubjectSpaceList.tsx`.
- Sắp xếp: môn có trong `todayPlan.subjectsSeen` lên đầu (giữ thứ tự registry trong từng nhóm).
- Mỗi thẻ 1 dòng trạng thái: "đang học · <tên chặng>" (từ `TodayPlan` item của môn đó nếu có,
  `item.title`) hoặc "chưa bắt đầu". Không thanh %, không số.
- Mobile: 3 thẻ đầu + nút "Xem tất cả (6 môn)" mở phần còn lại tại chỗ (`<details>` hoặc state);
  desktop: lưới 2 cột đủ.
- Empty state (C3, `todayPlan.primary.kind === 'pick'`): nút thẻ đổi thành "Thử 5 phút".

**KHÔNG LÀM:** không đổi `SUBJECT_ENTRIES`, không đổi `ctaPath`, không thêm môn.

### ② Điểm chạm

| Việc | Đường dẫn file                                                                             |
| ---- | ------------------------------------------------------------------------------------------ |
| Thêm | `components/Home/SubjectSpaceList.tsx` + `.test.tsx` + `lib/home/orderSubjects.ts` (+test) |
| Sửa  | `pages/core/Home.tsx`, `Home.test.tsx`, `e2e/subjects-catalog-states.spec.ts`              |

### ③ Hợp đồng dữ liệu

```ts
export function orderSubjects(entries: SubjectEntry[], seen: string[]): SubjectEntry[] // ổn định
export interface SubjectSpaceListProps {
  plan: TodayPlan | null
  isDesktop: boolean
  initialVisible?: number // mặc định 3 (mobile)
}
```

### ④ Tiêu chí chấp nhận

- [ ] **AC-1** `orderSubjects` ổn định: `seen=['programming']` → programming đầu, còn lại nguyên
      thứ tự; `seen=[]` → nguyên thứ tự; id lạ trong `seen` bỏ qua — test.
- [ ] **AC-2** Mobile render 3 thẻ + nút "Xem tất cả"; bấm → đủ `SUBJECT_ENTRIES.length` — test.
- [ ] **AC-3** Không ký tự `%`; chuỗi trạng thái ∈ {"đang học · …", "chưa bắt đầu"} — test.
- [ ] **AC-4** `kind:'pick'` → mọi thẻ có nút "Thử 5 phút" trỏ `ctaPath` — test.
- [ ] **AC-5** Ảnh chụp + a11y.

### ⑤ Bất biến

| Bất biến                                                    | Test canh                     |
| ----------------------------------------------------------- | ----------------------------- |
| Không mặc định tiếng Anh: `seen=[]` không đưa `english` lên | `orderSubjects.test.ts`       |
| Thẻ trỏ đúng `entry.ctaPath` (host routing S02)             | `Home.test.tsx` (có sẵn, giữ) |

### ⑥ Quy ước riêng

- `SUBJECT_ENTRIES` là nguồn dùng chung hub + app (`packages/core-learner/subjectEntry.ts`); không khai môn tay.
- Mở/đóng "Xem tất cả" là state cục bộ, không lưu storage.

---

## P1-9a · URL Lập trình → `/goc-hoc-tap/programming/*` (lệnh 10)

### ① Phạm vi

**LÀM:**

- Thêm hằng `PROGRAMMING_PREFIX = '/goc-hoc-tap/programming'` ở `lib/programmingRoutes.ts`; mọi
  `duongDan*` dựng từ hằng. Bậc dùng đốt `bac`: `duongDanBac` → `${PREFIX}/bac/${slug}`.
- Route mới trong `App.tsx` dưới tiền tố mới, cùng element cũ (13 route). Route cũ `/lap-trinh/*`
  → một component `LegacyProgrammingRedirect` gọi `legacyProgrammingPath()` và `<Navigate replace>`
  (giữ `search`).
- `SUBJECTS_ON_APP_HOST.programming = '/goc-hoc-tap/programming'` (`packages/core-learner/subjectHome.ts`).
- `navPaths.ts`: `LEARNING_PATHS` thêm prefix mới (giữ `/lap-trinh` để trang redirect vẫn sáng mục).
  `navTree.ts`, `breadcrumb.ts`: đường dẫn con môn Lập trình dùng helper.
- Cập nhật mọi E2E `programming-*.spec.ts`, `outline-programming.spec.ts`, `route-alias.spec.ts`,
  `learning-session-resume.spec.ts` (URL kỳ vọng).

**KHÔNG LÀM:**

- Không đổi `lessonId`/`courseId`/`specId`/`pathId`; không đổi khoá tiến độ localStorage/DB.
- Không đổi ownership host (Lập trình vẫn app host); không đụng `LEGACY_SUBJECTS_PREFIXES`.
- Không đổi nội dung bài, không chạy `gen:lesson-index`.

### ② Điểm chạm

| Việc | Đường dẫn file                                                                                      | Ghi chú                         |
| ---- | --------------------------------------------------------------------------------------------------- | ------------------------------- |
| Sửa  | `apps/dhcb/src/lib/programmingRoutes.ts` + `.test.ts`                                               | hằng prefix, đốt `bac`          |
| Thêm | `apps/dhcb/src/lib/legacyProgrammingPath.ts` + `.test.ts`                                           | thuần                           |
| Thêm | `apps/dhcb/src/components/LegacyProgrammingRedirect.tsx`                                            |                                 |
| Sửa  | `apps/dhcb/src/App.tsx`                                                                             | 13 route mới + 1 route redirect |
| Sửa  | `packages/core-learner/subjectHome.ts` + test                                                       |                                 |
| Sửa  | `lib/navPaths.ts`, `lib/navTree.ts`, `lib/breadcrumb.ts` (+test)                                    |                                 |
| Sửa  | `apps/server/src/subjectsRouting.test.ts`                                                           | ca prefix mới thuộc app host    |
| Sửa  | 8 file `e2e/programming-*.spec.ts`, `outline-programming`, `route-alias`, `learning-session-resume` |                                 |

**Ảnh hưởng lan ra:** `npm run codemap -- impact apps/dhcb/src/lib/programmingRoutes.ts` (dán
danh sách vào PR — dự kiến ~25 file gọi `duongDan*`, không cần sửa vì gọi hàm).

### ③ Hợp đồng dữ liệu

```ts
export const PROGRAMMING_PREFIX = '/goc-hoc-tap/programming'
/** Ánh xạ URL cũ → mới; null nếu không phải URL Lập trình cũ. Giữ nguyên `search`. */
export function legacyProgrammingPath(pathname: string, search: string): string | null
// Bảng 13 dòng (spec nền §F5): /lap-trinh → PREFIX · /gioi-thieu · /:levelId → /bac/:levelId ·
// /bai-hoc/:id · /khoa-hoc/:id · /khoa/:id → /khoa-hoc/:id · /huong[/:spec[/:stage]] ·
// /lo-trinh/:path[/chan-doan|/chang/:stage] · /du-an · /on-tap · /chay-thu
```

**Ca lỗi:** `/lap-trinh/khong-ton-tai` → `null` → rơi vào route `*` (trang không tìm thấy), không
redirect vòng.

### ④ Tiêu chí chấp nhận

- [ ] **AC-1** `legacyProgrammingPath` bảng 13 ca đúng + 3 ca `null` + 1 ca giữ `?khoa=git` —
      `npx vitest run apps/dhcb/src/lib/legacyProgrammingPath.test.ts`.
- [ ] **AC-2** `grep -rn "'/lap-trinh" apps/dhcb/src --include=*.ts --include=*.tsx` chỉ còn
      trong `legacyProgrammingPath.ts`, `LegacyProgrammingRedirect.tsx`, `navPaths.ts` — dán output.
- [ ] **AC-3** E2E lặp bảng 13 URL cũ: `page.url()` cuối = URL mới, `h1` đúng — `route-alias.spec.ts`.
- [ ] **AC-4** `decideRedirect` với `/goc-hoc-tap/programming/bai-hoc/x` trên host hoc-tap → về
      app host — `subjectsRouting.test.ts`.
- [ ] **AC-5** Tất cả `e2e/programming-*.spec.ts` xanh; `lessonsLazy.test.ts` không đổi.
- [ ] **AC-6** Không redirect vòng: `page.goto('/lap-trinh/xyz')` kết thúc ở trang 404 trong ≤ 1
      chuyển hướng — E2E.

### ⑤ Bất biến

| Bất biến                                                 | Test canh                                   |
| -------------------------------------------------------- | ------------------------------------------- |
| Khoá tiến độ Lập trình không đổi                         | `lib/programmingProgress*.test.ts` (có sẵn) |
| `?khoa=` giữ qua redirect (S07 AC-7)                     | AC-1, `e2e/programming-course.spec.ts`      |
| `TodayPlan.href` cho Lập trình dựng qua `duongDanBaiHoc` | `buildTodayPlan.test.ts` (cập nhật kỳ vọng) |

### ⑥ Quy ước riêng

- Khuôn `<mã>--<slug>` giữ nguyên qua `buildSlugSegment`/`idFromSlugSegment` (`packages/core-ui/slug.ts`).
- Route tĩnh (`/goc-hoc-tap/on-tap`, `/goc-hoc-tap/programming/du-an`…) đặt TRƯỚC route động
  trong `App.tsx`.

---

## P1-9b · URL Tiếng Anh → `/goc-hoc-tap/english/*` (lệnh 11)

### ① Phạm vi

**LÀM:**

- Tạo `lib/englishRoutes.ts`: `ENGLISH_PREFIX = '/goc-hoc-tap/english'` + 12 hàm `duongDan*`
  (§③). Thay MỌI chuỗi cứng bằng hàm: `Home.tsx` `SUBJECT_SHORTCUTS`, `navTree.ts:61-82`,
  `today/englishNext.ts` (`duongDanCapCefr` dời sang đây), `lib/comeback.ts`, `Layout.tsx`,
  `pages/subjects/english/*`, `components/studyTabs/*`.
- Route mới + 12 redirect `<Route path="/<cũ>/*">` qua `LegacyEnglishRedirect`.
- `navPaths.ts`: `LEARNING_PATHS` thêm prefix mới, giữ 12 đường cũ.
- Cập nhật E2E: `english-subject-home`, `english-tools-context`, `outline-english`, `chat`,
  `listening`, `mistake-bank`, `comeback`, `today-plan`, `route-alias`, `a11y*` (danh sách 15 trang).

**KHÔNG LÀM:**

- Không đổi mã CEFR trong URL (`/lo-trinh/A2` giữ `A2`); `/tu-vung/:word` chỉ dời prefix thành
  `/tu-dien/:word`, không thêm `--`.
- Không đổi `SUBJECTS_ON_APP_HOST.english` (đã đúng).
- Không đụng prompt AI (URL không nằm trong prompt — kiểm bằng golden snapshot không đổi).

### ② Điểm chạm

| Việc | Đường dẫn file                                                                                                                                       |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Thêm | `apps/dhcb/src/lib/englishRoutes.ts` + `.test.ts`                                                                                                    |
| Thêm | `apps/dhcb/src/lib/legacyEnglishPath.ts` + `.test.ts`, `components/LegacyEnglishRedirect.tsx`                                                        |
| Sửa  | `App.tsx`, `Home.tsx`, `lib/navTree.ts`, `lib/navPaths.ts`, `lib/breadcrumb.ts`, `lib/today/englishNext.ts` (+test), `lib/comeback.ts`, `Layout.tsx` |
| Sửa  | `pages/subjects/english/*.tsx`, `components/studyTabs/*.tsx` (nơi có `nav('/…')`)                                                                    |
| Sửa  | ~10 file E2E nêu trên                                                                                                                                |

**Ảnh hưởng lan ra:** `npm run codemap -- impact apps/dhcb/src/lib/today/englishNext.ts` và
`grep -rnE "'/(lo-trinh-hoc|tro-truyen|…)" apps/dhcb/src` — dán số dòng trước/sau vào PR.

### ③ Hợp đồng dữ liệu

```ts
export const ENGLISH_PREFIX = '/goc-hoc-tap/english'
export function duongDanLoTrinh(levelId?: CefrLevel['id']): string // /lo-trinh[/A2]
export function duongDanBaiHocAnh(): string // /bai-hoc
export function duongDanTroTruyen(): string
export function duongDanLuyenNoi(): string
export function duongDanLuyenViet(): string
export function duongDanLuyenNghe(): string
export function duongDanTuDien(word?: string): string // /tu-dien[/:word] — encodeURIComponent
export function duongDanOnThi(): string
export function duongDanTruyen(id?: string): string // /truyen[/:id]
export function duongDanCauThongDung(): string
export function duongDanSoTayLoiSai(): string
export function duongDanThuThach(): string
export function legacyEnglishPath(pathname: string, search: string): string | null // 12 mẫu + /tu-vung/:word
```

**Ca lỗi:** `word` chứa `/` hoặc `?` → `encodeURIComponent`; `legacyEnglishPath('/tu-vung/')` (rỗng)
→ `/goc-hoc-tap/english/tu-dien`.

### ④ Tiêu chí chấp nhận

- [ ] **AC-1** `englishRoutes.test.ts` mỗi hàm ≥ 1 ca; `legacyEnglishPath` 13 ca + 3 `null`.
- [ ] **AC-2** grep 13 đường cũ trong `apps/dhcb/src` chỉ còn file redirect + `navPaths.ts` — dán output.
- [ ] **AC-3** `englishNext` trả `href` bắt đầu `/goc-hoc-tap/english/lo-trinh/` — `englishNext.test.ts`.
- [ ] **AC-4** S06 AC-3 đổi grep thành `grep -rn "english/lo-trinh" packages/core-learner/today/` = 0.
- [ ] **AC-5** E2E 13 URL cũ → mới; `english-tools-context.spec.ts` nhãn Back vẫn "Tiếng Anh".
- [ ] **AC-6** `golden.test.ts` xanh KHÔNG dùng `-u`.
- [ ] **AC-7** a11y 15 trang × 3 theme xanh với URL mới.

### ⑤ Bất biến

| Bất biến                                 | Test canh                                |
| ---------------------------------------- | ---------------------------------------- |
| Không mặc định tiếng Anh                 | `buildTodayPlan.test.ts` (grep đổi AC-4) |
| `SUBJECTS_ON_APP_HOST.english` không đổi | `subjectHome.test.ts`                    |
| Chiều B (`direction`) không đổi hành vi  | `e2e/chat.spec.ts` ca chiều B (có sẵn)   |

### ⑥ Quy ước riêng

- Ngoại lệ đã chốt (CLAUDE.md §7): `/tu-dien/:word` và `/lo-trinh/:levelId` KHÔNG dùng khuôn `--`.

---

## P1-9c · Server routing, nginx 301, sitemap, SEO (lệnh 12)

### ① Phạm vi

**LÀM:**

- `apps/server/src/subjectsRouting.ts`: bảng ownership theo độ sâu — thêm test khẳng định
  `/goc-hoc-tap/programming/**` và `/goc-hoc-tap/english/**` (mọi độ sâu) thuộc app host; nếu
  logic hiện tại đã đúng thì chỉ thêm test.
- `docs/deploy-vps-ubuntu.md`: khối nginx `location ^~ /lap-trinh/ { return 301 https://$host/goc-hoc-tap/programming$request_uri_sau_tien_to; }`
  và 12 `location = /<cũ>` → 301 (dùng `rewrite` với regex, ghi rõ). Đây là **việc TAY** trên VPS
  → thêm vào `PROGRESS.md` mục "việc cần làm tay" kèm lệnh kiểm `curl -I`.
- Sitemap: nếu có script sinh (`grep -rn sitemap scripts apps/server`), đổi sang URL mới; nếu
  không có → ghi nợ "chưa có sitemap" vào `PROGRESS.md`.
- `PROGRESS.md`: việc tay "đo Google Search Console sau 14 ngày (2026-10-01)".

**KHÔNG LÀM:** không đổi hostname; không đổi `LEGACY_SUBJECTS_PREFIXES`; không tự sửa nginx trên
VPS từ phiên AI.

### ② Điểm chạm

| Việc | Đường dẫn file                                              |
| ---- | ----------------------------------------------------------- |
| Sửa  | `apps/server/src/subjectsRouting.test.ts` (+ `.ts` nếu cần) |
| Sửa  | `docs/deploy-vps-ubuntu.md`, `PROGRESS.md`                  |

### ③ Hợp đồng dữ liệu

Không đổi hợp đồng; `RedirectDecision` giữ nguyên.

### ④ Tiêu chí chấp nhận

- [ ] **AC-1** `subjectsRouting.test.ts` thêm ≥ 6 ca (2 prefix × 3 độ sâu) xanh.
- [ ] **AC-2** `docs/deploy-vps-ubuntu.md` có khối nginx + lệnh kiểm `curl -I https://www.donghanhcungban.org/lap-trinh` kỳ vọng `301`.
- [ ] **AC-3** `PROGRESS.md` có 2 việc tay (nginx, Search Console) kèm ngày; `scripts/check-progress-freshness.sh` không thêm cảnh báo mới.

### ⑤ Bất biến

| Bất biến                             | Test canh                          |
| ------------------------------------ | ---------------------------------- |
| Bài STEM vẫn về app host theo độ sâu | `subjectsRouting.test.ts` (có sẵn) |

### ⑥ Quy ước riêng

- PR loại `chore(server)`/`docs`; không phải `feat`.

---

# P2 — chiều sâu

## P2-10 · `buildProgressStory` — ba câu "Bạn đã…" (lệnh 13)

### ① Phạm vi

**LÀM:**

- Hàm thuần `buildProgressStory(input): StoryLine[]` (≤ 3 câu) từ dữ liệu 7 ngày.
- Component `ProgressStory` ở cột phải desktop trang chủ (dưới `WeekRhythm`) và đầu trang
  `/tien-do` (`pages/core/Dashboard.tsx`), trước biểu đồ. Mobile trang chủ KHÔNG render.
- Nguồn: `getActivityCalendar(uid, 7)` (`lib/stats.ts`), `getSRSStats` (đếm ôn 7 ngày — nếu chưa có
  số 7 ngày thì thêm hàm thuần đếm từ lịch sử SRS sẵn có), `todayPlan.subjectsSeen` + evidence cache.

**KHÔNG LÀM:** không gọi AI; không câu nào chứa %, band, bậc; không so sánh với người khác; không
thêm cột DB.

### ② Điểm chạm

| Việc | Đường dẫn file                                                                          |
| ---- | --------------------------------------------------------------------------------------- |
| Thêm | `apps/dhcb/src/lib/progress/buildProgressStory.ts` + `.test.ts`                         |
| Thêm | `apps/dhcb/src/components/ProgressStory.tsx` + `.test.tsx`                              |
| Sửa  | `pages/core/Home.tsx` (cột phải desktop), `pages/core/Dashboard.tsx`                    |
| Sửa  | `Home.design.test.ts`, `e2e/learning-ux-layout.spec.ts`, `scripts/shots-learning-ux.ts` |

**Ảnh hưởng lan ra:** `codemap -- impact lib/stats.ts` nếu phải thêm hàm đếm; nếu chỉ đọc thì không.

### ③ Hợp đồng dữ liệu

```ts
export interface StoryInput {
  days7: DayActivity[] // cũ → mới, length ≤ 7
  srs: { reviewed7d: number; correct7d: number }
  lessonsDone7d: Array<{ subjectId: string; label: string; count: number }>
  newWords7d: number
  streak: number
}
export interface StoryLine {
  text: string
  icon: 'calendar' | 'brain' | 'book' | 'flame'
}
export function buildProgressStory(i: StoryInput): StoryLine[] // 0..3, thứ tự: flame → book → brain → calendar
```

Khuôn câu cố định: "Chuỗi 5 ngày — cứ đều thế." · "Bạn xong 3 bài Lập trình." · "Bạn ôn đúng 18/24
thẻ tuần này." · "Bạn học 4 ngày trong 7 ngày qua." Con số = đếm việc đã làm (được phép), không
phải điểm năng lực.

**Ca lỗi:** mọi số 0 → bỏ câu đó; input rỗng → `[]` (component không render).

### ④ Tiêu chí chấp nhận

- [ ] **AC-1** Bảng ≥ 10 ca; input rỗng → `[]`; không chuỗi khớp `/%|band|trình độ|\b[ABC][12]\b|\bP[1-6]\b/`.
- [ ] **AC-2** `toMatchInlineSnapshot` cho 4 khuôn câu (đổi chữ là có chủ đích).
- [ ] **AC-3** `Home` mobile không render `ProgressStory`; desktop có — `Home.design.test.ts`.
- [ ] **AC-4** `/tien-do`: `ProgressStory` là con đầu của `<main>` — test Dashboard.
- [ ] **AC-5** a11y + ảnh chụp 1440 (trang chủ, `/tien-do`) × 3 theme; size-limit ≤ +1 kB.

### ⑤ Bất biến

| Bất biến                               | Test canh                            |
| -------------------------------------- | ------------------------------------ |
| Chẩn đoán không phải màn hình chính    | AC-1 regex                           |
| `getActivityCalendar` chữ ký không đổi | `lib/stats.test.ts` (có sẵn)         |
| `/tien-do` biểu đồ hiện có không đổi   | `e2e/subject-progress-board.spec.ts` |

### ⑥ Quy ước riêng

- Câu hiển thị AAA (`text-content`); icon `aria-hidden`.

---

## P2-11 · Companion inline trong phiên học (lệnh 15)

### ① Phạm vi

**LÀM:**

- `CompanionInline` = `CompanionAvatar size=32` + `CompanionBubble variant="inline"`, dán đáy
  (`position: sticky; bottom`) NGAY TRÊN CTA đáy của trang học, cao ≤ 96px ở 390px.
- `Layout` prop mới `companionNote?: CompanionNote | null`; chỉ render khi `focus && note && !isRead(note.id)`.
- Nguồn nội dung lát này là **tất định, có sẵn**, KHÔNG gọi AI thêm: Tiếng Anh luyện nói/viết →
  câu sửa lỗi đã có (đang TTS); Lập trình → dòng đầu của phản hồi `feedbackPrompt` đã nhận;
  STEM → `hint` của câu đang làm. Thứ tự nối: Anh → Lập trình → STEM (3 commit trong một PR, hoặc
  tách PR nếu > 400 dòng).
- Ẩn: vuốt xuống hoặc ✕ → `markRead(id)` (sessionStorage). Bấm avatar → `duongDanHoiDongHanh(note.askContext)`.
- `BottomNav companionHasNote` (từ lệnh 9) = có note chưa đọc ở trang hiện tại.

**KHÔNG LÀM:** không WebSocket/voice; không tự phát tiếng; không che nội dung; không tăng lượt AI.

### ② Điểm chạm

| Việc | Đường dẫn file                                                                                                               |
| ---- | ---------------------------------------------------------------------------------------------------------------------------- |
| Thêm | `packages/core-ui/CompanionInline.tsx` + `.test.tsx`                                                                         |
| Thêm | `apps/dhcb/src/lib/companion/noteStore.ts` + `.test.ts`                                                                      |
| Sửa  | `components/Layout.tsx` (+test), `components/BottomNav.tsx`, `App.tsx` (truyền `hasNote`)                                    |
| Sửa  | `pages/subjects/english/Speaking*.tsx`, `Writing*.tsx`; `pages/programming/Lesson*.tsx`; `pages/learning/StemLessonView.tsx` |
| Sửa  | `e2e/programming-lesson.spec.ts`, `e2e/stem-evidence.spec.ts`, `e2e/chat.spec.ts`, `a11y-modals.spec.ts`                     |

### ③ Hợp đồng dữ liệu

```ts
export interface CompanionNote {
  id: string
  lead: string
  detail?: string
  askContext?: string
}
// lib/companion/noteStore.ts (sessionStorage, try/catch → coi như chưa đọc)
export function isRead(id: string): boolean
export function markRead(id: string): void
// id = `${subjectId}:${contentId}:${stepOrAttempt}` — đổi bước là note mới.
```

**Ca lỗi:** note `lead` rỗng → không render; `askContext` > 500 ký tự → cắt ở 500 trước khi encode.

### ④ Tiêu chí chấp nhận

- [ ] **AC-1** `Layout` render bong bóng chỉ khi `focus && note && !isRead` — 4 ca test.
- [ ] **AC-2** Playwright 390: `boundingBox().height ≤ 96`; CTA đáy vẫn `visible` và click được khi
      bong bóng hiện.
- [ ] **AC-3** Ẩn rồi reload: vẫn ẩn trong phiên; context mới (tab mới) hiện lại — E2E.
- [ ] **AC-4** `grep -rn "api/agent" packages/core-ui/CompanionInline.tsx apps/dhcb/src/lib/companion/` = 0.
- [ ] **AC-5** `role="status" aria-live="polite"`, nút ✕ có `aria-label`; a11y xanh.
- [ ] **AC-6** Orb bottom nav có chấm khi có note chưa đọc, mất khi đã đọc — E2E.
- [ ] **AC-7** Số request `/api/tts`/`/api/stt`/`/api/agent` trong một phiên luyện nói KHÔNG tăng
      so với trước lát này (đếm trong E2E, dán số).

### ⑤ Bất biến

| Bất biến                                | Test canh                       |
| --------------------------------------- | ------------------------------- |
| `focus` vẫn ẩn Studio/streak/bottom nav | `Layout.test.tsx` (lệnh 5)      |
| Đếm lượt AI không đổi                   | AC-7, `e2e/session-cap.spec.ts` |
| Nội dung bài không bị che               | AC-2                            |

### ⑥ Quy ước riêng

- Giọng viết: ngôi "mình – bạn", ≤ 20 từ/câu, luôn có một sự thật; không "Tuyệt vời!" một mình.

---

## P2-12 · Chip gợi ý Ask bar + hai demo 30 giây cho khách (lệnh 14)

### ① Phạm vi

**LÀM:**

- `lib/homeRoutes.ts`: `duongDanHoiDongHanh(cau)`, `duongDanThuNgay(demoId)`.
- `buildAskChips(plan: TodayPlan | null): string[]` (≤ 3): "Giải thích bài đang dở" khi `primary.kind==='resume'`;
  "Tôi có 10 phút, học gì?" luôn; "Tạo lịch tuần này" khi `subjectsSeen.length ≥ 2`.
- `HomeUniversalAiBar` nhận `suggestions`; bấm chip → `/ban-dong-hanh?hoi=…`; trang Bạn Đồng Hành
  đọc `hoi` điền sẵn ô nhập, KHÔNG tự gửi.
- Hai trang `AllowGuest`, lazy: `/thu-ngay/noi-mot-cau` (STT + TTS sửa 1 câu, dùng `/api/stt`,
  `/api/tts` với hạn mức khách sẵn có) và `/thu-ngay/chay-mot-dong` (`CodeEditor` + runner của
  `/lap-trinh/chay-thu`). Kết thúc bằng `SessionDone` (`steps=1`) + lời mời đăng ký; đánh dấu
  `hasAnyGuestSession()` = true.
- `GuestHome` thêm 2 chip "thử ngay".

**KHÔNG LÀM:** không API mới; không nới hạn mức khách; không lưu gì ngoài cờ phiên khách.

### ② Điểm chạm

| Việc | Đường dẫn file                                                                                      |
| ---- | --------------------------------------------------------------------------------------------------- |
| Thêm | `lib/homeRoutes.ts` (+test), `lib/home/askChips.ts` (+test)                                         |
| Thêm | `pages/core/TryNowSpeak.tsx`, `pages/core/TryNowCode.tsx` (+test)                                   |
| Sửa  | `HomeUniversalAiBar.tsx` (+test), `pages/companion/*` (đọc `hoi`), `App.tsx`, `GuestHome.tsx`       |
| Sửa  | `e2e/guest-home.spec.ts`, `home-quick-ask.spec.ts`, `login-redirect.spec.ts`, `session-cap.spec.ts` |

### ③ Hợp đồng dữ liệu

```ts
export type DemoId = 'noi-mot-cau' | 'chay-mot-dong'
export function duongDanThuNgay(id: DemoId): string // /thu-ngay/<id>
export function duongDanHoiDongHanh(cau: string): string // /ban-dong-hanh?hoi=<encodeURIComponent(cau.slice(0,500))>
export function buildAskChips(plan: TodayPlan | null): string[]
```

**Ca lỗi:** `/api/stt` 429 → màn "Hết lượt thử — Đăng ký để có 30 lượt/ngày" (nút → `/login`),
không crash; mic bị từ chối → hướng dẫn + nút "Thử gõ thay vì nói".

### ④ Tiêu chí chấp nhận

- [ ] **AC-1** `buildAskChips` 6 ca; ≤ 3, không trùng; `plan=null` → 1 chip.
- [ ] **AC-2** Bấm chip → URL `/ban-dong-hanh?hoi=…`; ô nhập có chữ; KHÔNG có request `/api/agent`
      cho tới khi bấm gửi — E2E `page.waitForRequest` phủ định.
- [ ] **AC-3** `/thu-ngay/*` mở khi khách; xong → `hasAnyGuestSession()===true` → `/` thấy `GuestBanner`.
- [ ] **AC-4** Mock 429 → màn mời đăng ký — E2E.
- [ ] **AC-5** Hai trang là chunk lazy (không xuất hiện trong initial JS — `npx size-limit` không đổi > 0,5 kB).
- [ ] **AC-6** `login-redirect.spec.ts` thêm 2 URL vào danh sách công khai.
- [ ] **AC-7** a11y + ảnh chụp 2 trang demo × 3 theme × 2 bề rộng.

### ⑤ Bất biến

| Bất biến                                          | Test canh                           |
| ------------------------------------------------- | ----------------------------------- |
| Hạn mức AI khách áp ở server                      | `e2e/session-cap.spec.ts`           |
| `'/ban-dong-hanh?hoi'` chỉ dựng ở `homeRoutes.ts` | grep = 0 ngoài file đó (ghi vào PR) |
| Luật `AllowGuest` (spec mở xem web) không đổi     | `login-redirect.spec.ts`            |

### ⑥ Quy ước riêng

- Route mới KHÔNG dùng khuôn `--` (param tự mô tả, ngoại lệ CLAUDE.md §7).

---

## P2-13 · Rà `prefers-reduced-motion` toàn app (lệnh 3)

### ① Phạm vi

**LÀM:**

- `index.css`: một rule chung
  `@media (prefers-reduced-motion: reduce) { .animate-*… { animation: none !important; } * { transition-duration: 0.01ms !important; scroll-behavior: auto !important } }`
  (liệt kê tường minh các class `animate-*` khai trong `tailwind.config.js`; giữ đổi màu).
- Rà `grep -rn "animate-\|transition-transform\|requestAnimationFrame" apps/dhcb/src packages/core-ui`
  → bảng kết quả (file · loại · đã phủ?) vào PR; JS animation (`confetti.ts`, `LessonAnimation.tsx`,
  `Celebration.tsx`, `AvatarSpeaking.tsx`) phải đọc `matchMedia('(prefers-reduced-motion: reduce)')`.
- Mở rộng `UiNoise.design.test.ts`: mọi keyframe trong `tailwind.config.js` phải có tên trong
  danh sách rule chung.
- E2E `reducedMotion: 'reduce'` trên 5 trang.

**KHÔNG LÀM:** không xoá animation ở chế độ thường; không đổi ngữ nghĩa `pop-correct`/`shake`.

### ② Điểm chạm

| Việc | Đường dẫn file                                                                                                       |
| ---- | -------------------------------------------------------------------------------------------------------------------- |
| Sửa  | `apps/dhcb/src/index.css`, `apps/dhcb/tailwind.config.js` (chỉ đọc danh sách)                                        |
| Sửa  | `lib/confetti.ts`, `packages/core-ui/LessonAnimation.tsx`, `components/AvatarSpeaking.tsx` (nếu chưa đọc matchMedia) |
| Sửa  | `pages/core/UiNoise.design.test.ts`; thêm `e2e/reduced-motion.spec.ts`                                               |

### ③ Hợp đồng dữ liệu

Không có; là quy tắc CSS + test canh.

### ④ Tiêu chí chấp nhận

- [ ] **AC-1** E2E `reducedMotion:'reduce'`: 0 phần tử có class `animate-*` mà `getComputedStyle().animationName !== 'none'`
      trên `/`, một bài Lập trình, một bài STEM, `/luyen-noi` (URL theo lệnh 11 nếu đã merge), `/tien-do`.
- [ ] **AC-2** `UiNoise.design.test.ts` đỏ khi thêm keyframe mới mà không thêm vào rule chung (test tự chứng minh bằng ca giả).
- [ ] **AC-3** Ảnh chụp chế độ thường 3 trang mẫu: diff pixel = 0 so với trước.
- [ ] **AC-4** `confetti.ts` không chạy khi reduce (test unit mock `matchMedia`).

### ⑤ Bất biến

| Bất biến                                      | Test canh                   |
| --------------------------------------------- | --------------------------- |
| Phản hồi đúng/sai quiz vẫn có ở chế độ thường | `e2e/quiz-keyboard.spec.ts` |
| a11y không đổi                                | `e2e/a11y*.spec.ts`         |

### ⑥ Quy ước riêng

- Từ lệnh này trở đi: mọi keyframe mới PHẢI thêm vào rule chung (test AC-2 canh) — ghi vào CLAUDE.md §4.7 một dòng.

---

## 4. Sự kiện đo (thêm vào `AnalyticsEvent`, chỉ những gì cần)

| Sự kiện                          | Lát   | Khi nào                      | Mục tiêu đo                              |
| -------------------------------- | ----- | ---------------------------- | ---------------------------------------- |
| `cta_click` (có sẵn)             | P0-3  | `refCode:'guest_home_start'` | guest chạm CTA / lượt xem                |
| `daily_plan_click` (có sẵn)      | P0-1  | giữ                          | mở app → vào phiên                       |
| `session_done_view`              | P1-6  | mở `SessionDone`             | tỉ lệ hoàn thành phiên                   |
| `session_done_more`              | P1-6  | bấm "Thêm 3 phút"            | tỉ lệ nhận lời mời                       |
| `try_now_start` / `try_now_done` | P2-12 | demo khách                   | chuyển đổi khách → đăng ký sau phiên đầu |

## 5. Ngân sách & đo (dán vào mỗi PR)

| Lát      | JS dự kiến                                        | Ghi chú                                       |
| -------- | ------------------------------------------------- | --------------------------------------------- |
| P0-1     | ≤ +0,3 kB                                         |                                               |
| P0-2     | ≤ +3 kB                                           | SVG inline + 2 component                      |
| P0-3     | ≤ +1,5 kB                                         | nếu vượt: `lazy(() => import('./GuestHome'))` |
| P0-4     | ≈ 0                                               |                                               |
| P1-5     | ≤ +1,5 kB                                         |                                               |
| P1-6     | ≤ +2 kB                                           | dùng lại `Celebration`                        |
| P1-7/8/9 | ≈ 0                                               | redirect components nhỏ                       |
| P2-*     | P2-12 hai trang mới PHẢI lazy (không vào initial) |                                               |

Tổng P0+P1 ≤ +9 kB → 144,4 kB, dưới trần 150 kB, trên mốc cảnh báo 142,5 kB → **P1-6 xong thì
đo lại và cân nhắc lazy `SessionDone`**.

## 6. Ca biên chung phải có test (mục 4.9 CLAUDE.md)

- Múi giờ: chấm tuần dùng `vnDayOfWeek()`/`vnDateStr()` (`lib/date.ts`), không `Date.getDay()`.
- Ngày đổi khi đang mở trang chủ: `WeekRhythm` tính lại khi `visibilitychange` (test fake timers).
- Hai tab: `SessionDone` mở ở tab A, tab B không tự mở (query chỉ ở tab A).
- localStorage/sessionStorage bị chặn: mọi `read*` trả mặc định, không throw (test `throw` mock).
- `TodayPlan` null/loading: `SubjectSpaceList`, `askChips` phải hoạt động với `null`.

## 7. Câu hỏi đã có đề xuất mặc định (chủ dự án chỉ cần phản đối nếu khác ý)

| #   | Câu hỏi                                                 | Đề xuất mặc định                                       |
| --- | ------------------------------------------------------- | ------------------------------------------------------ |
| Q1  | Màu ấm theme `kid`                                      | hồng đậm `--w-500: 190 24 93` (tránh trùng accent cam) |
| Q2  | "Nâng cấp" hạ khỏi nhóm chính                           | Có, giữ link ở chân sidebar (P1-7 AC-6 bảo vệ)         |
| Q3  | Đốt `bac` cho bậc Lập trình                             | Có — `/goc-hoc-tap/programming/bac/p1--…`              |
| Q4  | `/tu-vung/:word` → `/goc-hoc-tap/english/tu-dien/:word` | Có (dời prefix, giữ ngoại lệ không dùng `--`)          |
| Q5  | Streak badge header mobile trang chủ                    | Giữ (nhỏ), vì `WeekRhythm` chỉ hiện sau khi cuộn tới   |
| Q6  | P2-12 demo nói dùng hạn mức khách hiện có               | Có; hết hạn mức → màn mời đăng ký, không nới hạn mức   |

## 8. Nghiệm thu (điền SAU mỗi lát)

| Lát        | PR    | Lệnh + kết quả thật                                                                                                                                                                                                                                                                                                                         | AC chưa đạt & lý do                                                                                                                                                                                    | Bất biến phá? | Ngoài phạm vi? | Còn ngỏ                                                                                                                                                 |
| ---------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 · P0-1   | #1005 | Đúng 1 banner phụ, `pickHomeBanner` 17 ca, gộp #1005 khi CI đỏ "Type+Lint+Format" do changelog chưa chạy Prettier — sửa và xanh                                                                                                                                                                                                             | Ảnh chụp Playwright (Tầng 8b) chưa đính kèm — không có trình duyệt trong phiên thi hành                                                                                                                | Không         | Không          | AC-5 chờ chụp ảnh học sau                                                                                                                               |
| 2 · P0-2   | #1008 | `--w-*` 3 theme + `CompanionAvatar`/`CompanionBubble`; 3 vòng CI đỏ đã sửa: xung đột merge `Home.tsx` (2 lần, do #1005/#1007 merge trước) · `e2e/a11y.spec.ts` còn selector cũ "Mừng bạn quay lại" (đổi sang `/Đã 5 ngày rồi/`) · contrast `text-accent-500`→`text-warm-700` cho link trong bong bóng (không có biến thể `theme-light:`)    | Ảnh chụp Playwright chưa đính kèm                                                                                                                                                                      | Không         | Không          | Không                                                                                                                                                   |
| 3 · P2-13  | #1010 | Rule reduced-motion đã có sẵn từ S13-2 (universal `*` mạnh hơn spec gợi ý) — phạm vi thực tế chỉ thêm 3 lớp test canh (AC-1 e2e, AC-2 ca giả, AC-4 confetti); CI xanh không cần sửa                                                                                                                                                         | Không                                                                                                                                                                                                  | Không         | Không          | Không                                                                                                                                                   |
| 4 · P0-3   | #1011 | `GuestHome` + `hasAnyGuestSession()`; nhiều vòng CI đỏ đã sửa: xung đột merge `Home.tsx` với #1012 (giữ cả nhánh `isGuest` lẫn `WeekRhythm`) · 1 eslint-disable thừa · 4 test e2e cũ (`english-subject-home`, `home-quick-ask`, `smoke`, `today-plan`) giả định hành vi khách cũ (banner hiện ngay/có thẻ Hôm nay) — cập nhật theo luật mới | AC-8 (ảnh chụp guest 3 theme × 2 bề rộng) — cần mở rộng hệ thống 6-màn-mẫu, ngoài phạm vi                                                                                                              | Không         | Không          | AC-8 để lát riêng                                                                                                                                       |
| 5 · P0-4   | #1006 | Header mobile ≤4 khe, `focus` ẩn bottom nav; CI đỏ "metadata" do cụm "Approved for implementation" bị ngắt dòng trong mô tả PR — sửa mô tả (không đổi mã), CI xanh                                                                                                                                                                          | AC-6 (a11y 2 theme + ảnh 390 trước/sau) để CI `e2e` xác nhận                                                                                                                                           | Không         | Không          | Không                                                                                                                                                   |
| 6 · P1-8   | #1007 | `SubjectSpaceList` + `orderSubjects`, môn đang học lên đầu, trạng thái bằng chữ; CI đỏ a11y contrast (nút "Thử 5 phút" dùng `text-accent-400` thiếu `theme-light:`) — thêm biến thể, xanh                                                                                                                                                   | Ảnh chụp trước/sau chưa đính kèm                                                                                                                                                                       | Không         | Không          | Không                                                                                                                                                   |
| 7 · P1-5   | #1012 | `WeekRhythm` + `buildWeekRhythm` + `latestUnlocked(uid, isA)` mới trong `achievements.ts`; CI xanh ngay lần đầu, không cần sửa                                                                                                                                                                                                              | Ảnh chụp Playwright chưa đính kèm                                                                                                                                                                      | Không         | Không          | Không                                                                                                                                                   |
| 8 · P1-6   | #1014 | `SessionDone` gộp `StreakCelebration`/`WeeklyGoalCelebration` thành sub-block trong 1 overlay; `buildSessionFact` 12+ ca, `?xong=1` qua `history.replaceState`; nối vào `TodayLesson.tsx` (điểm gọi duy nhất của 2 celebration cũ); CI xanh, không cần sửa                                                                                  | AC-3 chỉ có test unit dựng trực tiếp, chưa lắp ráp qua `TodayLesson` thật · AC-4/AC-7 (e2e `?xong=1`, a11y-modals, ảnh chụp) chưa thêm — không có Playwright trong phiên thi hành, để CI thật xác nhận | Không         | Không          | Chưa nối `Challenge.tsx`/`Lesson*.tsx`/`StemLessonView.tsx` (không gọi celebration cũ nên không hồi quy, nhưng cũng chưa có overlay mới) — để lát riêng |
| 9 · P1-7   | #1016 | `DesktopSidebar` 7 mục cấp 1 (gộp career+worklife thành "Sự nghiệp & Đời sống ▾", gỡ "Luyện tập"), `BottomNav` tab 4 "Luyện tập"→"Ôn tập"; `CAREER_LIFE_PATHS` mới; CI đỏ 1 vòng: `e2e/english-tools-context.spec.ts` AC-3.2 dùng nhãn tab "Luyện tập" cũ — sửa theo nhãn mới, xanh                                                         | Ảnh chụp 1440/390 trước/sau + a11y AAA đủ 15 trang × 5 theme chưa chạy trong phiên thi hành, để CI thật xác nhận                                                                                       | Không         | Không          | Không                                                                                                                                                   |
| 10 · P1-9a | #1018 | Prefix Lập trình đã chuyển sang `/goc-hoc-tap/programming`; route cũ redirect tương thích; E2E canonical xanh trong PR hợp nhất                                                                                                                                                                                                             | Không                                                                                                                                                                                                  | Không         | Không          | Theo dõi redirect production cùng P1-9c                                                                                                                 |
| 11 · P1-9b | #1018 | Prefix Tiếng Anh đã chuyển sang `/goc-hoc-tap/english`; helper tập trung và route cũ redirect tương thích                                                                                                                                                                                                                                   | Không                                                                                                                                                                                                  | Không         | Không          | Không                                                                                                                                                   |
| 12 · P1-9c | #1018 | Ownership server, redirect nginx/SEO và canonical test đã vào main; `quality` + 6 shard E2E xanh                                                                                                                                                                                                                                            | Áp dụng cấu hình nginx trên VPS và đo Search Console sau 14 ngày là việc vận hành thủ công, không được suy từ CI                                                                                       | Không         | Không          | Chờ xác minh production ngoài phạm vi PR                                                                                                                |
| 13 · P2-10 |       |                                                                                                                                                                                                                                                                                                                                             |                                                                                                                                                                                                        |               |                |                                                                                                                                                         |
| 14 · P2-12 |       |                                                                                                                                                                                                                                                                                                                                             |                                                                                                                                                                                                        |               |                |                                                                                                                                                         |
| 15 · P2-11 |       |                                                                                                                                                                                                                                                                                                                                             |                                                                                                                                                                                                        |               |                |                                                                                                                                                         |

## 9. Bảng lệnh thi hành (chủ dự án ra lệnh theo số; bên thi hành điền cột còn lại)

Lệnh "thi hành lệnh N" = "Approved for implementation" cho lát đó. Không có lệnh = không code.

| Lệnh | Lát   | Ngày ra lệnh | PR    | Merge            | Ghi chú                                                           |
| ---- | ----- | ------------ | ----- | ---------------- | ----------------------------------------------------------------- |
| 1    | P0-1  | 2026-09-17   | #1005 | 2026-09-17 08:51 | Xanh sau 1 lần sửa format changelog                               |
| 2    | P0-2  | 2026-09-17   | #1008 | 2026-09-17 09:30 | Xanh sau merge conflict + 2 lần sửa contrast + 1 selector e2e     |
| 3    | P2-13 | 2026-09-17   | #1010 | 2026-09-17 10:06 | Xanh ngay — rule reduced-motion đã có sẵn từ S13-2, chỉ thêm test |
| 4    | P0-3  | 2026-09-17   | #1011 | 2026-09-17 10:34 | Xanh sau merge conflict Home.tsx + 1 lint + 4 test e2e cũ sửa     |
| 5    | P0-4  | 2026-09-17   | #1006 | 2026-09-17 08:52 | Xanh sau 1 lần sửa mô tả PR (metadata)                            |
| 6    | P1-8  | 2026-09-17   | #1007 | 2026-09-17 09:04 | Xanh sau 1 lần sửa contrast                                       |
| 7    | P1-5  | 2026-09-17   | #1012 | 2026-09-17 10:09 | Xanh ngay lần đầu                                                 |
| 8    | P1-6  | 2026-09-17   | #1014 | 2026-09-17 11:28 | Xanh ngay — nợ mở: AC-3/4/7 e2e chưa thêm, 3 trang gọi chưa nối   |
| 9    | P1-7  | 2026-09-17   | #1016 | 2026-09-17 12:52 | Xanh sau 1 lần sửa nhãn tab BottomNav trong test e2e cũ           |
| 10   | P1-9a | 2026-09-18   | #1018 | 2026-09-18 14:30 | Canonical URL Lập trình; route cũ giữ redirect                    |
| 11   | P1-9b | 2026-09-18   | #1018 | 2026-09-18 14:30 | Canonical URL Tiếng Anh; helper URL tập trung                     |
| 12   | P1-9c | 2026-09-18   | #1018 | 2026-09-18 14:30 | Server/SEO hoàn tất trong mã; nginx + Search Console chờ vận hành |
| 13   | P2-10 |              |       |                  |                                                                   |
| 14   | P2-12 |              |       |                  |                                                                   |
| 15   | P2-11 |              |       |                  |                                                                   |
