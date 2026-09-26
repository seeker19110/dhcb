# 0355 — S13-1: công cụ chụp sáu màn mẫu + cổng bố cục 4 bề rộng

- **Ngày:** 2026-09-16
- **PR:** [#987](https://github.com/seeker19110/dhcb/pull/987)
- **Spec:** [`docs/specs/2026-09-15-learning-ux-s13-responsive-theme-hieu-nang-rollout.md`](../specs/2026-09-15-learning-ux-s13-responsive-theme-hieu-nang-rollout.md) §④ S13-1 (AC-1 → AC-7) — Approved for implementation
- **Base:** `main` `82ed2e88`

## Đã làm

PR **công cụ + cổng**, **0 dòng đổi giao diện**. Mọi mã mới nằm ngoài bundle
(`e2e/`, `scripts/`).

1. **`e2e/helpers/learningUxScreens.ts`** — một nguồn sự thật cho sáu màn mẫu
   (`today · outline · lesson · tutor · result · progress`) × năm trạng thái
   (`empty · loading · data · error · feedback`). Ô nào màn đó không có thật thì ghi
   `{ kind: 'n/a', reason }` chứ không bỏ khoá — **5 ô n/a**, mỗi ô một câu lý do.
   Kèm `moManHinh()` dùng chung cho cả ba nơi tiêu thụ (script chụp + 2 cổng E2E).
   Route là **route THẬT trên main**, không đoán: `result` trùng route `lesson` vì
   S11-3 render `ActivityResult` ngay trong trang bài, không có route riêng; `tutor`
   dùng `/ban-dong-hanh` vì S10-2 (trợ giảng trong bài) chưa merge.
2. **`scripts/learning-ux-screens.test.ts`** (7 ca) — canh 6 màn, 5 khoá/màn, route
   nội bộ, `id` duy nhất, `source` hợp lệ. Đặt ở `scripts/` vì `vitest.config.ts`
   KHÔNG include `e2e/**` (test đặt trong `e2e/` sẽ không bao giờ chạy).
3. **`scripts/shots-learning-ux.ts`** + `npm run shots:learning-ux` — chụp `fullPage`
   ra **ngoài repo** (`SHOT_OUT`, mặc định `/tmp/shots/learning-ux/<phase>/`), ghi
   `manifest.json` (md5 + chiều cao đọc từ **header PNG**, không ước lượng), có
   `--diff before after`. Dùng `mockLogin` thật, không tự gieo `localStorage`.
4. **`e2e/learning-ux-layout.spec.ts`** (24 ca = 6 màn × 4 bề rộng) — 5 phép đo hình
   học ở 320/390/768/1440, **cái CI hiện không có ở 768/1440**.
5. **`e2e/learning-ux-states.spec.ts`** (76 ca + 5 skip n/a) — axe AA cho bốn trạng
   thái phi-dữ-liệu × 2 theme × 2 bề rộng.
6. **`scripts/lighthouse-cwv.sh`** + `npm run cwv:prod` — đo CWV tay trên production,
   `npx --yes lighthouse@12.2.1` (KHÔNG vào lockfile), exit 2 = không đo được, exit
   1 = vượt ngưỡng.
7. **`e2e/a11y-aaa.spec.ts`** — thêm `/ban-dong-hanh` (đã có ở cổng AA, thiếu ở AAA).
   Năm route còn lại của sáu màn đã có sẵn ở cả hai cổng.

## Quyết định

**Cổng bố cục đỏ ngay trên mã hiện tại — đó là bằng chứng nó đo được thật.** Nhưng
S13-1 là PR công cụ (sửa giao diện là S13-2, spec §9 mục 2), nên phép đo 4 (ký
tự/dòng) chạy theo kiểu **bánh cóc**: một bảng `BASELINE_KY_TU` ghi ĐÚNG SỐ ĐÃ ĐO,
không được tệ hơn, và **tốt hơn cũng báo đỏ** để buộc hạ baseline (bảng không mục
ruỗng trong im lặng). Mỗi dòng trong bảng là một mục việc của S13-2:

| ô             | số đoạn > 80 ký tự/dòng | số đo từng đoạn                     |
| ------------- | ----------------------- | ----------------------------------- |
| today@768     | 10                      | 84, 85, 100, 92×7                   |
| today@1440    | 8                       | 84, 98×7                            |
| outline@768   | 8                       | 105, 116×7                          |
| outline@1440  | 8                       | 111, 122×7                          |
| lesson@768    | 12                      | 92, 98, 92×6, 88×3, 92              |
| lesson@1440   | 12                      | 97, 104, 97×6, 93×3, 97             |
| result@768    | 27                      | 92, 98, 92×6, 88×11, 85×8           |
| result@1440   | 27                      | 97, 104, 97×6, 93×11, 90×8          |
| progress@768  | 8                       | 105, 105, 123, 85, 128, 99, 116, 81 |
| progress@1440 | 6                       | 111, 111, 129, 135, 105, 122        |

Bốn phép đo còn lại (cuộn ngang · một `<h1>` · CTA trong màn hình đầu ở 1440 · tỉ lệ
chiều cao) **không có baseline nào** — 24/24 ca xanh ở mức tuyệt đối.

**Cổng a11y trạng thái tìm ra một vi phạm AA THẬT** — đúng thứ nó sinh ra để tìm:
`aria-prohibited-attr` (serious) trên màn `today`, gốc ở
`apps/dhcb/src/components/Home/TodayCard.tsx:74`
(`<div aria-busy aria-live aria-label="Đang tìm việc học hôm nay">` — `aria-label` bị
cấm trên phần tử role ngầm `generic`, nên nhãn đó KHÔNG được trình đọc màn hình đọc
lên). Ghi vào `NO_AA` **theo mã luật** (số phần tử đổi theo bề rộng: 1 ở 390, 2 ở
1440 — ghi chuỗi cứng sẽ thành cổng đỏ giả). Không phải tắt cổng: mọi mã luật khác
vẫn đỏ ở mọi màn/trạng thái/theme/bề rộng. **Gỡ:** S13-2 thêm `role="status"` rồi xoá
nguyên khối `NO_AA`.

**Bẫy đã mắc và đã gỡ trong chính đợt này:** lượt đo đầu báo Trang chủ có **0 `<h1>`**
ở 320/390. Truy tới gốc thì đó là **cổng đỏ giả do mock sai địa chỉ** —
`TodayCard` đọc `/api/programming/progress` (`lib/programmingProgress.ts:49`), không
phải `/api/learning/*`; mock sai làm trang rơi vào nhánh "Chưa tải được tiến độ" và
không dựng tiêu đề, đồng thời ba trạng thái rỗng/dữ-liệu/lỗi ra ảnh **md5 giống hệt
nhau**. Sửa mock trỏ đúng endpoint thì `<h1>` về 1 và bốn trạng thái của `today` tách
ra bốn md5 khác nhau. Bài học: một cổng đỏ vì mock sai cũng nguy hiểm như cổng xanh
giả — phải truy tới gốc, đừng ghi baseline cho nó.

## Bằng chứng kiểm chứng

```
npx vitest run scripts/learning-ux-screens.test.ts      → 7/7 xanh
npx vitest run scripts/ci-workflow-policy.test.ts       → 7/7 xanh (AC-6)
npx playwright test e2e/learning-ux-layout.spec.ts      → 24/24 xanh, 31,1 s
npx playwright test e2e/learning-ux-states.spec.ts      → 76 xanh / 5 skip (n/a)
   (lượt đầu 4 ca ĐỎ vì aria-prohibited-attr — nợ thật, đã ghi vào NO_AA, xem trên)
npx playwright test e2e/a11y-aaa.spec.ts -g ban-dong-hanh → 5/5 xanh (5 theme)
npm run shots:learning-ux -- --phase before --themes dark-blue --widths 1440
                                                        → 25 ảnh, 5 ô n/a, 0 lỗi
npm run test:coverage  → 94,13 / 90,03 / 94,51 / 94,65 (sàn 93/89/93/93) — KHÔNG ĐỔI
                         so với S08-4, tức `scripts/` + `e2e/` nằm ngoài coverage
                         `include` đúng như AC-7 đòi
npm run codemap -- cycles                               → không có chu trình import
```

**Thời gian mảnh E2E (AC-6) — ĐO THẬT trên CI, không ước lượng.** Luật §11.1 chỉ cho
tăng số mảnh khi mảnh chậm nhất tăng > 20%; đo hai run CI thật:

|                                            | mảnh chậm nhất | 1/6 | 2/6 | 3/6 | 4/6 | 5/6 | 6/6 |
| ------------------------------------------ | -------------- | --- | --- | --- | --- | --- | --- |
| Trước (main `82ed2e88`, run `35123227258`) | **5,2 ph**     | 4,2 | 4,5 | 4,7 | 4,1 | 4,4 | 5,2 |
| Sau (PR #987, run `35137470879`)           | **5,2 ph**     | 4,0 | 4,0 | 5,2 | 4,1 | 4,5 | —   |

Thay đổi mảnh chậm nhất: **−1,0%** (ngưỡng +20%) dù thêm 100 test. → **GIỮ 6 mảnh**,
không tăng lên 7. Các job khác: Unit+coverage 4,5 ph · Type/Lint/Format 2,9 ph ·
Build+budget+boot 2,4 ph · npm audit + chu trình import 0,7 ph.

**Cổng bắt được lỗi thật (AC-3):** chèn tạm `<h1>` thứ hai vào
`components/PageHeader.tsx` → đúng 4 ca của màn `tutor` (4 bề rộng) đỏ với thông điệp
`số <h1> hiển thị = 2, phải đúng 1`. Đã hoàn nguyên.

## Rủi ro / rollback

Mã test + script, không vào bundle, không migration, không dependency mới.
Rollback: `git revert <sha>` — người dùng không thấy gì thay đổi.
