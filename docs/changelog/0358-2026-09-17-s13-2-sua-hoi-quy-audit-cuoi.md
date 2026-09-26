# 0358 — S13-2: sửa hồi quy audit cuối goal learning-ux tìm ra

- **Ngày:** 2026-09-17
- **PR:** [#995](https://github.com/seeker19110/dhcb/pull/995)
- **Spec:** [`docs/specs/2026-09-15-learning-ux-s13-responsive-theme-hieu-nang-rollout.md`](../specs/2026-09-15-learning-ux-s13-responsive-theme-hieu-nang-rollout.md) §④ S13-2 (AC-9 → AC-12) — Approved for implementation
- **Base:** `main` `eaefb183` (sau #992)
- **Phạm vi:** AC-9 · AC-10 · AC-11 · AC-12 + hai nợ S13-1 (#987). **AC-8 KHÔNG thuộc PR
  này** — ma trận thị giác 6×5 phải do chủ dự án chấm độc lập (spec §7 Q6).

## Đã sửa

### 1. Nợ S13-1 thứ nhất — `aria-prohibited-attr` (serious)

`apps/dhcb/src/components/Home/TodayCard.tsx` — khối skeleton
`<div aria-busy aria-live aria-label="Đang tìm việc học hôm nay">` nay có
`role="status"`. `aria-label` **bị cấm** trên phần tử role ngầm `generic`, nên trước
đó nhãn ấy không được trình đọc màn hình đọc lên: người dùng NVDA/VoiceOver ở trạng
thái "đang tải" nghe được đúng sự im lặng. `role="status"` đã ngầm `aria-live="polite"`
nên thuộc tính đó được gỡ cho khỏi thừa.

**Gỡ nguyên khối `NO_AA`** khỏi `e2e/learning-ux-states.spec.ts` — cổng chạy ở mức
TUYỆT ĐỐI, 0 vi phạm AA, không còn ngoại lệ nào.

| trước                   | sau   |
| ----------------------- | ----- |
| 1 vi phạm AA            | **0** |
| 1 mã luật trong `NO_AA` | **0** |

### 2. Nợ S13-1 thứ hai — đoạn văn > 80 ký tự/dòng ở ≥ 768px

**126 → 3 vi phạm.** Cách sửa là bó **khoảng đọc** lên đúng những đoạn CHỮ ĐỂ ĐỌC,
không phải nới ngưỡng và không phải hạ khống baseline. Mọi số dưới đây đo bằng chính
phép đo 4 của `e2e/learning-ux-layout.spec.ts` (`clientWidth / (font-size × 0,5)`).

| ô             | trước | sau   |
| ------------- | ----- | ----- |
| today@768     | 10    | **1** |
| today@1440    | 8     | **0** |
| outline@768   | 8     | **0** |
| outline@1440  | 8     | **0** |
| lesson@768    | 12    | **0** |
| lesson@1440   | 12    | **0** |
| result@768    | 27    | **0** |
| result@1440   | 27    | **0** |
| progress@768  | 8     | **1** |
| progress@1440 | 6     | **0** |
| tutor@1440    | (2)   | **1** |
| **tổng**      | 126   | **3** |

Ba ô còn lại đều **dưới** `TOI_DA_VI_PHAM_MOI_MAN = 3` nên bảng `BASELINE_KY_TU`
được đưa về **rỗng**: cổng nay chạy ở ngưỡng tuyệt đối, không còn dòng nợ nào.

Điểm chạm:

| file                                                                 | sửa gì                                                                 |
| -------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `apps/dhcb/src/index.css`                                            | `.read-measure` **66ch → 63ch** (xem lý do bằng số bên dưới)           |
| `apps/dhcb/src/pages/learning/StemLessonView.tsx`                    | `read-measure` lên `<article>` — bó CẢ cột bài, thay vì rắc từng `<p>` |
| `apps/dhcb/src/components/PageHeader.tsx`                            | `read-measure` cho câu mô tả dưới tiêu đề (dùng chung ~30 trang)       |
| `apps/dhcb/src/pages/core/Home.tsx`                                  | mô tả 7 không gian học                                                 |
| `apps/dhcb/src/components/RewardTipBanner.tsx`                       | 2 đoạn của banner mẹo                                                  |
| `apps/dhcb/src/pages/subjects/programming/ProgrammingCoursePage.tsx` | meta khoá + 5 gạch đầu dòng kết quả học                                |
| `apps/dhcb/src/pages/core/Dashboard.tsx`                             | 5 đoạn chú thích/trạng thái rỗng                                       |
| `apps/dhcb/src/components/SubjectProgressSection.tsx`                | chú thích "chỉ đếm mục đã có bằng chứng"                               |

**Vì sao 66ch → 63ch, bằng số chứ không bằng cảm giác:** đơn vị `ch` là bề rộng chữ số
`0`, mà `0` rộng hơn chữ thường trung bình. Đo thật: `read-measure` 66ch cho ra **83 ký
tự/dòng** theo phép đo của cổng — vượt ngưỡng 80. 63ch đo lại **~79**, và quy ra ký tự
thật vẫn nằm trong khoảng **60–75** mà spec nền chốt. Đây là hiệu chuẩn, không phải nới.

### 3. Cổng S13-1 đo NHẦM TRANG ở 320/390 — đỏ giả, và xanh giả

`e2e/helpers/learningUxScreens.ts`: `moManHinh` nay **chờ `<main>` gắn vào DOM** trước
khi gọi `waitForStableDom`.

Mọi trang đều `lazyWithRetry(() => import(...))`. Trong lúc chunk chưa về, React dựng
Suspense fallback — một khung skeleton **TĨNH**. `waitForStableDom` đếm số phần tử,
thấy không đổi, liền báo "ổn định" và trả về khi trang thật chưa mount. Hệ quả đo được:

- `learning-ux-layout.spec.ts` đọc `0 <h1>` ở `today@320` và `today@390` — **đỏ 3/3
  lượt** trên `main` sạch (không phải flake, là sai bền vững). Ở 768/1440 chunk về kịp
  nên xanh — đúng kiểu lỗi làm người đọc log tin là "vỡ ở mobile".
- Ảnh `today--data--dark-blue--320.png` trên `main` cao **656px**; sau khi sửa: **2494px**.
  Tức script chụp của S13-1 đã chụp khung skeleton chứ không phải Trang chủ.
- Nguy hiểm hơn: `learning-ux-states.spec.ts` quét axe trên khung skeleton ở nhiều ô →
  **xanh giả**. Sau khi sửa, cổng quét trang thật; 106 ca xanh / 5 skip (n/a).

### 4. AC-12 — "giảm chuyển động" chưa từng được tôn trọng

Spec S13 AC-12 nói có sẵn khối reduced-motion toàn cục ở `index.css:370`. **Không
đúng.** Trước đợt này repo chỉ tắt hoạt ảnh cho **hai** thứ: `.glass` và
`.course-flow-beam`. Đo bằng `page.emulateMedia({ reducedMotion: 'reduce' })` ở 1440px:

| màn      | phần tử còn chạy hoạt ảnh (trước) | sau   |
| -------- | --------------------------------- | ----- |
| today    | 8                                 | **0** |
| progress | 11                                | **0** |
| tutor    | 6                                 | **0** |
| outline  | 1                                 | **0** |
| lesson   | 1                                 | **0** |
| result   | 1                                 | **0** |

Đã thêm khối toàn cục ở cuối `apps/dhcb/src/index.css` (WCAG 2.3.3) + **6 ca canh**
trong `learning-ux-layout.spec.ts` để nó không bị gỡ nhầm về sau.

Dùng `animation-duration: 0s` chứ không `animation: none`: mọi hoạt ảnh của dự án khai
báo `fill-mode: both`, nên duration 0 làm phần tử nhảy thẳng tới khung hình cuối — tức
trạng thái hiển thị đầy đủ; `animation: none` thì phần tử rơi về style gốc, dễ sinh ca
nội dung biến mất. Khối chỉ áp trong `prefers-reduced-motion: reduce` → người dùng mặc
định **không thấy gì thay đổi**.

## AC-9 — 320px và màu ghi cứng

`grep -rnE "bg-(zinc|slate|gray)-(900|950)|text-white"` trên 5 file gốc của sáu màn:
**47 dòng khớp** (Home 11 · ProgrammingCoursePage 10 · StemLessonView 0 · Companion 9 ·
Dashboard 17). **Không dòng nào là màu ghi cứng.** Lý do, đọc từ
`apps/dhcb/tailwind.config.js:24–38`: cả thang `zinc` lẫn `white` đã được map sang biến
CSS (`zinc.900 → rgb(var(--z-900))`, `white → rgb(var(--c-white))`), nên chúng **đổi
theo theme** đúng như token `--a-*`. Chỉ một màu viết thẳng trong phạm vi này:
`Companion.tsx:521` `text-[#09090b]` trên nền `bg-accent-500` — nền nhấn cố định sáng ở
mọi theme nên chữ phải cố định tối; đúng khuôn ngược của `text-[#fff]` mà `CLAUDE.md`
mục 4.5 chốt.

320px: cổng `learning-ux-layout` canh không cuộn ngang (6/6 xanh) và ảnh
`*--320.png` của cả sáu màn đã được MỞ RA NHÌN — chữ xuống dòng đủ, không bị cắt.

## Bằng chứng kiểm chứng (số thật, chạy trên checkout sạch sau `npm ci`)

```
rm -rf packages/*/dist dist dist-server
npm run typecheck          → 0 lỗi
npm run lint               → 0 cảnh báo
npx prettier --check .     → All matched files use Prettier code style!
npm run build              → exit 0
npm run codemap -- cycles  → Không có chu trình import

npx playwright test e2e/learning-ux-layout.spec.ts e2e/learning-ux-states.spec.ts
                           → 106 passed / 5 skipped (n/a), 0 ngoại lệ NO_AA
```

**AC-10 — ngân sách (đo cùng một máy, `main` eaefb183 vs nhánh này):**

|             | main      | sau        | trần   | mốc cảnh báo 95%  |
| ----------- | --------- | ---------- | ------ | ----------------- |
| Initial JS  | 135,43 kB | **135,40** | 140 kB | 133 kB — **vượt** |
| Initial CSS | 18,37 kB  | **18,45**  | 20 kB  | 19 kB — đạt       |

JS **không đổi vì đợt này không thêm một dòng JS nào** (chỉ `className` + CSS). Con số
135,4 kB đã vượt mốc cảnh báo 95% **từ trước PR này** (di sản của #984) — ghi lại làm nợ
có số, không xử lý trong S13-2 vì nới ngưỡng là quyết định của chủ dự án (spec §7 Q4).

**Coverage — 3 lượt `npm run test:coverage` liên tiếp (AC-11 + AC-10):**

| lượt | Test Files         | Tests                | stmt  | branch | func  | line  |
| ---- | ------------------ | -------------------- | ----- | ------ | ----- | ----- |
| 1    | 680 passed, 1 skip | 14109 passed, 2 skip | 94,02 | 89,83  | 94,35 | 94,58 |
| 2    | 680 passed, 1 skip | 14109 passed, 2 skip | 94,02 | 89,83  | 94,35 | 94,58 |
| 3    | 680 passed, 1 skip | 14109 passed, 2 skip | 94,02 | 89,83  | 94,35 | 94,58 |

3/3 xanh, **cùng số test**, cùng số coverage tới hai chữ số thập phân. Sàn thật
(`vitest.config.ts`) 93 / 89 / 93 / 93 → dư **+1,02 / +0,83 / +1,35 / +1,58**.

**E2E — 3 lượt liên tiếp trên 6 file E2E của S07–S13** (`learning-ux-layout` ·
`learning-ux-states` · `outline-stem` · `learning-session-resume-stem` ·
`stem-evidence` · `mobile-layout-guards`):

| lượt | kết quả                | thời gian |
| ---- | ---------------------- | --------- |
| 1    | 126 passed / 5 skipped | 3,8 ph    |
| 2    | 126 passed / 5 skipped | 4,0 ph    |
| 3    | 126 passed / 5 skipped | 4,4 ph    |

3/3 xanh, cùng số test. **Không gặp lại** flake đã biết của
`apps/dhcb/src/lib/programmingSrs.test.ts` trong 3 lượt `test:coverage` ở trên.

> ⚠️ **Branch dư 0,83 điểm, chưa đạt "≥ 1 điểm" của AC-10.** Đã kiểm là **KHÔNG phải do
> PR này**: chạy cùng lệnh trên `main` + không có thay đổi giao diện nào cho ra đúng
> `94,02 / 89,83 / 94,35 / 94,58`. Đây là nợ có sẵn; ghi vào PROGRESS kèm điều kiện gỡ.
> KHÔNG hạ sàn coverage (spec §7 Q4).

## Tầng 8b — đã NHÌN ảnh thật, không chỉ đọc mã

Chụp bằng `npm run shots:learning-ux` (ngoài repo, `/tmp/shots/`), 6 màn × `data` ×
`dark-blue` × 320/390/1440, **trước** (`main` eaefb183) và **sau**:

| màn      | cao 1440 trước → sau | cao 320 trước → sau |
| -------- | -------------------- | ------------------- |
| today    | 1479 → 1479          | **656 → 2494**      |
| outline  | 2342 → 2439          | 2981 → 2908         |
| lesson   | 3427 → 3413          | 5089 → 4945         |
| tutor    | 1476 → 1475          | 2089 → 1995         |
| result   | 4363 → 4493          | 7129 → 6865         |
| progress | 2196 → 2195          | 3594 → 3556         |

Bốn câu Tầng 8b, trả lời bằng ảnh đã mở:

1. **Lặp nội dung?** Không. Cổng canh "đúng một `<h1>` hiển thị" xanh ở cả 24 ca.
   (Ảnh `fullPage` của `/tien-do` @1440 _trông_ như lặp header ở đáy — đó là hiện tượng
   Chromium vẽ lại phần tử `position: fixed` ở cuối ảnh `fullPage`, không phải DOM lặp;
   nếu lặp thật thì phép đo `<h1>` đã đỏ.)
2. **Chiều cao trang?** `today@320` **tăng** 656 → 2494 px — đúng chiều tốt: trước đó
   ảnh chụp nhầm khung skeleton. Các ô còn lại đổi ≤ 4%, phần lớn **giảm**.
3. **Mảng trống lớn?** Cột bài học ở 1440 nay chừa lề phải — đó là khoảng đọc có chủ
   đích, không phải khối rỗng; rail mục lục bên trái vẫn đầy.
4. **390 trước/sau khớp nhau?** Có, khác duy nhất ở độ dài dòng ngắn lại.

## Rủi ro / rollback

Không migration, không dependency mới, không đổi schema/billing, không đụng
`syncOutbox*`. `PageHeader` là điểm chạm rộng nhất (~30 trang import) nhưng thay đổi chỉ
là `max-width` cho một `<p>` — không đổi cấu trúc, không đổi màu.

Rollback: `git revert <sha>`.

## Còn lại cho chủ dự án

- **AC-8 CHƯA làm** — ma trận thị giác 6 màn × 5 trục do chủ dự án chấm độc lập (spec
  §7 Q6: "agent vừa làm vừa chấm" là điều spec cố ý cấm). 18 ảnh bắt buộc đã sẵn ở
  `/tmp/shots/after/`.
- Hai nợ có số ghi ở `PROGRESS.md`: Initial JS 135,4 kB vượt mốc cảnh báo 95%; branch
  coverage dư 0,83 < 1 điểm.
