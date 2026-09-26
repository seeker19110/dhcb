# 0348 — 2026-09-16 — S06-3: trang môn dùng chung resolver "học tiếp"

| Thuộc tính | Giá trị                                                                             |
| ---------- | ----------------------------------------------------------------------------------- |
| PR         | [#963](https://github.com/seeker19110/dhcb/pull/963)                                |
| Đặc tả     | `docs/specs/2026-09-15-learning-ux-s06-hom-nay-hoc-tiep.md` §9 mục 3 (AC-18, AC-19) |
| Goal       | `docs/goals/2026-09-15-learning-ux.md` dòng S06-3                                   |
| Nền        | S06-1 (#941) adapter + resolver · S06-2 (#952) thẻ "Hôm nay" · S08-1 (#932) phiên   |

## Việc đã làm

Một luật "học tiếp" cho BA nơi hiển thị. Trước PR này luật sống ở ba bản chép:

- `Home.tsx` và `EnglishHome.tsx` mỗi trang một vòng lặp `continueLevel` **giống hệt nhau** (chọn
  cấp CEFR mở đầu tiên còn bước chưa xong), cộng một đoạn dựng nhãn `"${emoji} ${titleVi} (x/y)"`
  chép nguyên văn ở `EnglishHome`.
- `ProgrammingHome.tsx` gọi thẳng `pickNextLesson` và tự dựng URL bằng `duongDanBaiHoc`.

Nay cả ba đi qua adapter đã có của S06-1:

- `englishNext` trả thêm `levelId` — cấp CEFR "đang đi tới". Đây đúng là thứ hai trang cần cho
  luồng "Mừng bạn quay lại" (`?tab=srs&cap=`, `?tab=today&cap=`) và cho nút "Tiếp tục học ngay".
  `srsDue` thành **tuỳ chọn**: trang môn đã có nút "N thẻ đến hạn" riêng, truyền vào rồi bỏ mục
  `review` đi chỉ mời gọi hai chỗ đếm lệch nhau. Thêm `duongDanCapCefr(levelId)` để không còn nơi
  nào tự ghép chuỗi `/lo-trinh-hoc/...`.
- `programmingNext` trả thêm `picked` (kết quả thô của `pickNextLesson`: bậc, tên bậc, ngôn ngữ,
  cờ `resuming`). Trang môn cần những thứ đó cho huy hiệu ngôn ngữ, chặng dự án đang ở và cột mốc
  bậc — mà `TodayItem` cố ý không mang (hợp đồng chung không biết khái niệm "bậc" của riêng môn
  Lập trình). Trả kèm ở đây để luật chạy đúng MỘT lần, ở đúng MỘT nơi.

Giao diện ba trang **không đổi một pixel nào** (ảnh trước/sau ở §Bằng chứng).

## Một lỗi thật do E2E đa môn (AC-19) lôi ra

`dongNguon` (`todayCardText.ts`) nuốt mất `hint` ở nhánh phiên dở. Resolver gắn
`hint = "Môn thứ hai: <tên môn>"` cho mục phụ, nhưng nếu mục phụ ấy là một **phiên dở** thì thẻ chỉ
hiện "Phiên đang dở · 2 giờ trước" — hệt việc chính. Người học có hai môn cùng dở không có cách nào
biết mục phụ dẫn sang môn khác. Nay tên môn đứng trước mốc thời gian:
`"Môn thứ hai: Tiếng Anh · Phiên đang dở · 2 giờ trước"`. Việc chính không đổi (resolver không gắn
`hint` cho mục phiên chính) — có test canh cả hai chiều.

## Bằng chứng kiểm chứng

```
rm -rf packages/*/dist dist dist-server
npm run typecheck        → 0 lỗi
npm run lint             → 0 cảnh báo
npx prettier --check .   → All matched files use Prettier code style!
npm run test:coverage    → 663 file · 13604 test xanh
                           Statements 94.28 · Branches 90.18 · Functions 94.79 · Lines 94.79
                           (sàn 93/89/93/93)
npx playwright test e2e/today-plan e2e/programming-home e2e/comeback e2e/session-cap \
  e2e/continue-viewing e2e/home-quick-ask e2e/mobile-layout-guards   → 43/43
npx playwright test e2e/a11y.spec.ts e2e/a11y-aaa.spec.ts            → 472/472
grep -rn "findNextStep(" apps/dhcb/src/pages
  → chỉ còn CefrLevelPage.tsx:621 (dùng đúng nghĩa: bước kế tiếp TRONG một cấp đang mở,
    không phải bản chép của vòng chọn cấp)
grep -rn "pickNextLesson(" apps/dhcb/src/pages → 0 dòng
```

**Tầng 8b (nhìn ảnh thật).** Chụp `fullPage` bằng config tạm cổng riêng 5331
(`reuseExistingServer: false` — không nối nhầm dev server của worktree khác), chờ theo TRẠNG THÁI
(heading + dòng "Đang học dở"/"Bài học tiếp theo" đã hiện) chứ không chờ theo thời gian. Ba bề rộng
1440 · 390 · 320, trước/sau: **kích thước ảnh trùng từng pixel ở cả 6 cặp**; khác biệt byte thô còn
lại nằm ở khối `animate-fade-in` (mẹo huy hiệu) — khác khung hình chứ không khác bố cục.

## Không làm (giữ nguyên phạm vi slice)

- Không đổi `comeback.ts`, không đổi hành vi `?tab=today&cap=` / `?tab=srs&cap=`.
- Không đụng `CefrLevelPage.tsx` (`findNextStep` ở đó là cách dùng khác, không phải bản chép).
- Không đổi bố cục Trang chủ (xem đề xuất mở ở mô tả PR — quyết định sản phẩm, chờ chủ dự án).
