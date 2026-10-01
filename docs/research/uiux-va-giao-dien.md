# Tổng hợp Nghiên cứu: Uiux Va Giao Dien

Tài liệu này gộp từ 7 tài liệu nghiên cứu liên quan.

---

## [1] Tài liệu: cai-tien-ui-ux.md

_(Chi tiết nguồn gốc: `cai-tien-ui-ux.md`)_

# Nghiên cứu: Cải tiến UI/UX toàn app

> Ngày: 2026-07-04 · Trạng thái: **U-1 → U-5 ĐÃ TRIỂN KHAI** (xác nhận lại trong
> `dac-ta-cai-tien-uiux-2026-07-13.md`: bottom-nav `BottomNav.tsx` 4 tab đã có từ đợt này).
> Phương pháp: lái app thật bằng Playwright khổ mobile 375×812 (12 trang chính + các luồng tương
> tác), đo bằng máy (cuộn ngang, kích thước vùng chạm), đối chiếu checklist
> `docs/framework/BO-SUNG-chat-luong-Nhom-2.md`. Mọi phát hiện đều có bằng chứng đo/chụp thật.

## Bối cảnh

Nền UI tốt hơn mặt bằng chung: không cuộn ngang ở 12 trang, a11y 0 lỗi critical/serious 4 theme,
có `prefers-reduced-motion`/safe-area, input chat 16px không gây zoom iOS. Vấn đề tập trung ở
**luồng sử dụng hằng ngày**:

| #   | Vấn đề                                                                                             | Tác động                  |
| --- | -------------------------------------------------------------------------------------------------- | ------------------------- |
| U1  | Trang chủ là menu tĩnh — không có "Học tiếp", không hiện SRS đến hạn/mục tiêu ngày                 | 🔴 Ma sát mỗi ngày        |
| U2  | Không có bottom-nav — đổi chế độ phải quay về Home (2–3 chạm)                                      | 🔴 Ma sát mỗi ngày        |
| U3  | Onboarding hỏi 3 câu nhưng KHÔNG dùng câu trả lời                                                  | 🔴 Mất niềm tin           |
| U4  | Chat: hàng nhập tràn 15px ở 375px, nút gửi dính mép (thiếu `min-w-0`)                              | 🟡 Bug layout thật        |
| U5  | Chat: chờ cưỡng bức 10s giữa MỖI tin nhắn — gãy nhịp hội thoại                                     | 🟡 Ma sát tính năng chính |
| U6  | Lỗi kỹ thuật tiếng Anh phơi nguyên văn ra UI                                                       | 🟡 Thiếu chuyên nghiệp    |
| U7  | Trang cấp CEFR: nội dung học bị đẩy xuống ~600px, "Tổng đã thuộc 0/10199" gây nản                  | 🟡                        |
| U8  | 350 bài hội thoại/300 chủ đề câu: danh sách phẳng, không dấu vết đã học                            | 🟡                        |
| U9  | Vài nút dùng thường xuyên < 44px (avatar header 28×28, nút Nữ/Nam 75×23...)                        | 🟢                        |
| U10 | Copy quá đát/không nhất quán (số từ điển 3 nơi 3 số khác nhau, copy "riêng tư" sai từ khi có sync) | 🟢                        |
| U11 | Vài empty state thiếu nút hành động                                                                | 🟢                        |

## Những cái đang làm đúng (giữ nguyên)

Không cuộn ngang, a11y 68/68 E2E xanh, safe-area đúng, input chat không gây zoom, ô tìm kiếm ghim
đáy màn (đúng vùng ngón cái), thẻ từ (WordCard) rõ ràng ≥44px, khối "Nhận xét" trong chat tách
bong bóng riêng, màn thiết lập Chat/Speaking gọn, Onboarding UI đẹp (vấn đề ở U3 là dữ liệu không
được dùng, không phải UI).

## Kế hoạch theo đợt (đã triển khai U-1 → U-5)

| Đợt     | Nội dung                                                                                                                            | Vấn đề           |
| ------- | ----------------------------------------------------------------------------------------------------------------------------------- | ---------------- |
| U-1     | Vá nhanh: `min-w-0` input chat, thông điệp lỗi thân thiện + nút thử lại, vùng chạm ≥44px, copy (login/badge/số từ), CTA empty state | U4 U6 U9 U10 U11 |
| U-2     | Thẻ "Học tiếp" đầu trang Home (mục kế tiếp + SRS due + mục tiêu ngày)                                                               | U1               |
| U-3     | Nối onboarding → mặc định app (level→độ khó Chat/Nói + gợi ý test-out; phút/ngày→tốc độ 5/10/20)                                    | U3               |
| U-4     | Gọn header 4 tab học trang cấp + đổi "0/10199" → tiến độ của cấp + bỏ QuickActions ở màn học                                        | U7               |
| U-5     | Bottom tab bar (Trang chủ·Lộ trình·Luyện tập·Tiến độ) + dời QuickActions + đánh dấu "đã xem" Lessons/Phrases                        | U2 U8            |
| _(rời)_ | Giảm throttle chat 10s → 3s (cần chốt UX; không tăng trần chi phí vì lượt/ngày đã cap riêng)                                        | U5               |

## Chi tiết kỹ thuật đáng nhớ (U3, U4)

- **U3**: `saveOnboarding()` ghi câu trả lời lên Supabase nhưng không nơi nào đọc lại. Nối:
  `level` → mặc định độ khó Chat/Speaking + gợi ý test-out nếu ≥ Trung cấp; `dailyMinutes` → map
  sang tốc độ 5/10/20 (`setDailySpeed`); `goal` → chọn card đề xuất đầu Home.
- **U4**: nguyên nhân là `<input>` flex item có `min-width:auto` mặc định không co xuống dưới bề
  rộng nội tại, đẩy cả hàng vượt container ở 375px — fix bằng thêm `min-w-0`.

## Bằng chứng khảo sát

Ảnh chụp 12 trang + 6 luồng (khổ 375×812, DPR 2, không commit vào repo để khỏi phình); đo hàng
nhập chat cho thấy tràn 15px ở viewport 375px; grep xác nhận U3 (0 chỗ đọc lại data onboarding) và
U8 (Lessons/CommonPhrases không có state đã xem).

---

## [2] Tài liệu: dac-ta-cai-tien-uiux-2026-07-13.md

_(Chi tiết nguồn gốc: `dac-ta-cai-tien-uiux-2026-07-13.md`)_

# Đặc tả cải thiện UI/UX (bản đã đối chiếu code thật) — 2026-07-13

> Nguồn gốc: người dùng đưa một bản đặc tả UI/UX bên ngoài để đánh giá. Tài liệu này là bản
> **đã kiểm tra lại với code thật** (grep + đọc file), sửa các điểm sai/lỗi thời, và viết lại
> thành việc cụ thể để giao cho agent code làm. **Không suy đoán — mọi dòng dưới đây đều đã đối
> chiếu với file thật tính đến commit hiện tại của nhánh `claude/english-tutor-ui-ux-bb6ckm`.**

## 0. Các điểm trong bản gốc ĐÃ SAI / LỖI THỜI — không đưa vào việc cần làm

Để agent code không làm lại việc đã xong hoặc lật ngược quyết định đã duyệt:

1. **"Chưa có bottom navigation"** — SAI. `src/components/BottomNav.tsx` đã triển khai đủ 4 tab
   (Trang chủ, Lộ trình, Luyện tập, Tiến độ), ẩn ở `/login` `/onboarding`, chỉ hiện `<640px`,
   nhớ route luyện tập gần nhất qua localStorage. Đã xong từ 2026-07-04 (tài liệu
   `cai-tien-ui-ux.md`, mục U-1→U-5). **Không làm lại.**
2. **"Khóa zoom (`user-scalable=no`) là sơ suất a11y"** — SAI. Đây là **quyết định chủ động đã
   duyệt**, ghi rõ ở `index.html` (comment ngay trên thẻ viewport), `AUDIT.md` dòng 553, và
   `CLAUDE.md` mục 13 ("Zoom mobile khóa chủ động — đánh đổi 1 mục a11y, bù bằng sàn chữ ≥11px").
   **Không tự đổi lại** — nếu muốn đổi phải hỏi người dùng trước vì đây là lật quyết định cũ,
   không phải sửa lỗi.
3. **"Số liệu Từ điển mâu thuẫn 12.073/8k/12.245"** — đã từng phát hiện trước (mục E7,
   `docs/research/cai-tien-trai-nghiem-hoc-2026-07-11.md`), có phần đã sửa. Xem mục 2 dưới đây
   để biết hiện trạng thật (vẫn còn 1 chỗ sai như bản gốc mô tả, nhưng lý do khác).

## 1. Việc cần làm — nhóm A: 2 fix nhỏ, rủi ro thấp (ưu tiên 1)

### A1. Theme toggle: chuyển từ cycle sang menu chọn trực tiếp

- **File:** `src/components/ThemeToggle.tsx`
- **Hiện trạng (đã xác nhận):** bấm nút gọi `cycleTheme()` nhảy sang theme kế tiếp trong mảng
  `THEMES` (`src/lib/theme.ts`) — không có popover, không thấy trước danh sách/tên/trạng thái.
- **Việc cần làm:** đổi thành popover/menu liệt kê `THEMES` (swatch + `labelVi`/`labelEn`) + đánh
  dấu theme đang chọn (`aria-current`) + bấm chọn thẳng (`setTheme(t.value)`), đóng khi chọn/click
  ngoài/Esc, điều hướng được bằng bàn phím. Giữ nguyên `aria-label` hiện có.
- **Không đụng:** `src/lib/theme.ts`, `src/context/useTheme.ts`, hệ biến CSS `--a-*` — chỉ đổi
  UI của nút bấm.

### A2. Màn Luyện nói (Speaking) thiếu mô tả cấp độ — thiếu nhất quán với Chat

- **File cần sửa:** `src/pages/Speaking.tsx` · **tham khảo:** `src/pages/Chat.tsx` dòng 137-141.
- **Hiện trạng:** dữ liệu `descA`/`descB` cho từng mức độ đã có sẵn trong `LEVELS`
  (`src/types.ts:167-180`, vd `descA: 'A1–A2, câu đơn giản'`). `Chat.tsx` đã render dòng mô tả này
  dưới 3 nút chọn cấp độ (`<p className="text-xs ...">{isA ? descA : descB}</p>`); `Speaking.tsx`
  (quanh dòng 167-189) không có.
- **Việc cần làm:** thêm cùng đoạn `<p>` mô tả cấp độ vào `Speaking.tsx`, ngay sau khối
  `grid grid-cols-3 gap-2` (trước nút "Bắt đầu luyện nói →"). Không đổi `LEVELS`/`Chat.tsx`.

## 2. Việc cần làm — nhóm B: Kiểm tra & thống nhất số liệu Từ điển (ưu tiên 2)

- **Đã xác nhận 3 vị trí số liệu:**
  1. `VocabMilestone.tsx`: 4 mốc đặt tên, mốc cuối cùng = **8.000** (`GOAL = MILESTONES[...].count`,
     dòng 18) — đây là **mốc thành tựu đặt tên cao nhất**, không phải tổng số từ. Thanh chỉ vẽ
     đến mốc cuối này (cố ý, không phải lỗi).
  2. `StudyTabs.tsx:827`: `{progress.done}/{progress.total}` — cần xác định `progress.total`
     lấy từ đâu (nghi là tổng từ vựng của **lộ trình học** `getLearningPath()`, ra số ~12.245,
     KHÁC với tổng số mục **từ điển** 12.073 — hai tập dữ liệu khác nhau: một là từ điển tra
     cứu, một là danh sách từ trong lộ trình học có thứ tự).
  3. Tiêu đề trang Từ điển ghi "12.073 từ thông dụng" — đây là tổng số mục trong
     `public/data/dictionary/chunk-*.json` (đã xác nhận ở `AUDIT.md` dòng 40).
- **Việc cần làm (giao cho agent code, cần đọc thêm trước khi sửa):**
  1. Đọc `src/lib/stats.ts` hoặc nơi tính `progress.total` truyền vào `StudyTabs.tsx` để xác
     nhận chính xác nó lấy từ `getLearningPath().length` hay nguồn khác, và giá trị thật hiện
     tại là bao nhiêu.
  2. Nếu `progress.total` (~12.245) khác `12.073` (tổng từ điển) vì **là hai tập dữ liệu khác
     nhau về bản chất** (lộ trình học có thể lặp/thêm cụm từ, từ điển là tra cứu thuần) — KHÔNG
     gộp làm một số duy nhất một cách máy móc. Thay vào đó: đổi nhãn hiển thị cho rõ nghĩa, ví
     dụ `"Tổng đã thuộc: 243/12.245 từ trong lộ trình"` thay vì chỉ "Tổng đã thuộc: X/Y" trần
     trụi dễ hiểu nhầm là tổng từ điển.
  3. Với thanh mốc `VocabMilestone` dừng ở "8k": thêm chú thích ngắn kiểu "(mốc cao nhất)" hoặc
     tooltip giải thích đây là các mốc đặt tên, không phải tổng số từ, để không gây hiểu nhầm
     khi đặt cạnh con số 12.073/12.245.
  4. Kiểm tra xem mục **E7** trong `docs/research/cai-tien-trai-nghiem-hoc-2026-07-11.md` (dòng
     33, 61-62) đã được triển khai tới đâu — tài liệu đó ghi "đã sửa ở trang cấp, sót ở đây
     (`StudyPanel` dùng ở `/learning-path` tổng quan + `/dictionary`)" — tránh làm trùng, chỉ
     hoàn thiện phần còn sót.

## 3. Việc cần làm — nhóm C: Bố cục desktop 2 cột + skeleton + phân nhóm trang chủ (ưu tiên 3, việc lớn hơn)

> Nhóm này đụng nhiều file/layout — agent code nên **đọc kỹ rồi đề xuất kế hoạch chia nhỏ trước
> khi sửa**, đúng quy tắc ở `CLAUDE.md` mục 3 & 7 (giải thích kế hoạch ngắn gọn rồi hỏi trước khi
> sửa nhiều file/đổi cấu trúc). Dưới đây là khung việc, KHÔNG phải chỉ định kỹ thuật chi tiết vì
> chưa đọc hết các file liên quan.

### C1. Bố cục desktop (≥1024px) đỡ trống trải

- Container hiện dùng `max-w-3xl mx-auto` (đã xác nhận ở `Dictionary.tsx:211`, và nhiều trang
  khác dùng pattern tương tự — cần grep `max-w-3xl` toàn `src/pages/` để liệt kê hết trước khi
  sửa).
- Đề xuất: giữ nguyên cột nội dung mobile-first (không phá layout mobile đang hoạt động tốt),
  chỉ thêm breakpoint `lg:` cho các màn có nội dung phù hợp bố cục 2 cột — ví dụ Từ điển (panel
  mốc từ vựng/tab bên trái, flashcard bên phải), màn setup Luyện nói/Chat (mô tả bên trái, form
  chọn bên phải). Cần xem xét từng trang cụ thể, không áp máy móc cho mọi trang.
- **Yêu cầu bắt buộc:** phải test bằng mắt (`npm run dev` + xem ở viewport ≥1024px) trước khi
  báo xong, vì đây là thay đổi layout trực quan, type-check không bắt được lỗi bố cục.

### C2. Skeleton loading nhất quán

- Đã xác nhận: trang Hồ sơ (`Profile.tsx`) có skeleton loader. Cần grep xem những trang gọi AI
  (chấm viết `Writing.tsx`, luyện nói `Speaking.tsx`, chat `Chat.tsx`) hiện xử lý trạng thái
  loading như thế nào (spinner? text? không có gì?) trước khi quyết định cách chuẩn hóa.
- Đề xuất: dùng chung 1 component skeleton (nếu chưa có, tạo `src/components/Skeleton.tsx`),
  áp cho Từ điển + các luồng gọi AI có độ trễ, kèm text trạng thái rõ ràng ("AI đang chấm bài…").

### C3. Phân nhóm tính năng ở trang chủ

- Cần đọc `src/pages/Home.tsx` đầy đủ để biết cấu trúc danh sách tính năng hiện tại (bao nhiêu
  card, đã có card "Học tiếp" nổi bật chưa) trước khi đề xuất phân nhóm — tài liệu
  `cai-tien-trai-nghiem-hoc-2026-07-11.md` (mục E8) đã ghi nhận "thẻ Học tiếp có nhưng lép vế
  giữa menu 7 card" — đây có thể đã là việc tồn đọng đã biết (V-5 trong tài liệu đó), agent code
  nên đọc tài liệu này trước để tránh làm trùng/xung đột hướng đã duyệt.

## 4. Thứ tự khuyến nghị cho agent code

1. Nhóm A (A1, A2) — làm trước, mỗi việc 1 commit riêng, test thủ công bằng mắt.
2. Nhóm B — đọc `src/lib/stats.ts` trước, xác nhận nguồn số liệu, sửa nhãn hiển thị (không đổi
   logic tính toán nếu không cần).
3. Nhóm C — dừng lại, tóm tắt kế hoạch chia nhỏ và xin xác nhận người dùng trước khi sửa (theo
   đúng CLAUDE.md mục 3 & 12 — thay đổi lớn/nhiều file phải hỏi trước).

## 5. Cổng trước khi commit (nhắc lại từ CLAUDE.md mục 8)

Build ✅ · Typecheck ✅ · Lint (0 cảnh báo) ✅ · Test ✅ · tự đọc lại diff · không để lại
`console.log` debug · conventional commits. Nhóm C bắt buộc thêm bước tự chạy thử bằng mắt
(`npm run dev`) ở cả mobile và desktop viewport vì là thay đổi layout trực quan.

---

## [3] Tài liệu: audit-ui-ux-desktop-mobile-2026-08-31.md

_(Chi tiết nguồn gốc: `audit-ui-ux-desktop-mobile-2026-08-31.md`)_

# Audit UI/UX toàn diện — Desktop + Mobile (2026-08-31)

> Audit CHỈ ĐỌC + BÁO CÁO theo `docs/framework/QUY-TRINH-AUDIT.md` (không sửa code trong lúc
> audit). Phạm vi: toàn bộ frontend `apps/dhcb/src` + `apps/hub/src`, đối chiếu chuẩn nội bộ
> CLAUDE.md mục 4 (vùng chạm ≥ 44px, sàn chữ ≥ 11px, input 16px, token màu `--a-*`/`--z-*`,
> WCAG AA/AAA) và tiêu chuẩn ngành (WAI-ARIA APG, iOS safe-area, dvh).
>
> **Ba lớp bằng chứng:** (1) đọc code mobile-first, (2) đọc code desktop, (3) chạy `npm run dev`
> thật + Chromium thật, chụp 41 ảnh ở 1440×900 và 390×844, cả theme tối lẫn Blue sky, đo tràn
> ngang bằng JS (`scrollWidth − clientWidth`). Phát hiện nặng nhất (mục 1) đã được xác minh lại
> trực tiếp trên `apps/dhcb/src/index.css` trước khi ghi vào báo cáo.

## Tóm tắt điều hành

- **Không có lỗi chặn thao tác trên trình duyệt thật**: 0 tràn ngang ở 11 trang × 2 viewport,
  0 lỗi JS runtime, layout không vỡ. Nền tảng thiết kế (token 5 theme, `--sidebar-w`,
  `tap-44`, `Modal.tsx`, safe-area utilities) đều đúng chuẩn — vấn đề chủ yếu là **độ phủ
  không đều**: nơi dùng nguyên thuỷ chung thì rất tốt, nơi tự chế thì lệch chuẩn.
- **10 phát hiện 🔴** (vi phạm luật bắt buộc hoặc hỏng thật trên thiết bị), **~20 phát hiện 🟡**,
  còn lại 🟢. Ba cụm đáng làm trước: (a) luật input 16px bị vô hiệu → iOS auto-zoom;
  (b) ~24 modal tự chế thiếu Escape/focus-trap; (c) sidebar desktop mất active-state ở các
  trang luyện tập chính.

---

## A. 🔴 Nghiêm trọng (vi phạm luật bắt buộc / hỏng thật)

### A1. Luật "input font 16px" bị Tailwind ghi đè ở ~90 input → iOS auto-zoom

`apps/dhcb/src/index.css:91-99` ép `input,textarea,select { font-size:16px }` cho màn cảm ứng
nhưng đặt trong `@layer base`; class `text-sm`/`text-xs` nằm ở `@layer utilities` (layer sau)
nên **thắng bất kể specificity** — luật coi như không tồn tại ở mọi input có class cỡ chữ.
Ví dụ: `pages/domains/work/Work.tsx:636,693,736,824,923,958`, `Career.tsx:683,840,911`,
`Life.tsx:760,818,837`, `Chat.tsx:113` (select), `WorkKanban.tsx:120,164` (12px).
→ **Sửa 1 chỗ:** chuyển rule sang layer utilities (hoặc thêm `!important` trong media query
`(pointer: coarse)`), sau đó rà bỏ `text-sm` khỏi input. Mẫu đúng đã có: `Chat.tsx:867`
`text-base sm:text-sm`.

### A2. App `hub` không có luật 16px, không `tap-44`, không safe-area

`apps/hub/src/index.css` (47 dòng) thiếu hẳn media query `(pointer: coarse)` và mọi utility
mobile. `HubLogin.tsx:235` input `text-sm` → **màn đăng nhập landing bị iOS auto-zoom**;
`HubLogin.tsx:389` nút hiện/ẩn mật khẩu `h-8 w-8` (32px).
→ Tách phần base/utilities dùng chung vào `packages/core-ui` và import ở cả hai app.

### A3. BottomNav: `pb-safe` nằm trong chiều cao cứng → bị bóp trên iPhone có notch

`components/BottomNav.tsx:98` `h-[5.25rem] pb-safe`: box-sizing border-box nên trên iPhone
(inset ≈ 34px) vùng nội dung chỉ còn ~50px — 5 tab bị ép, `tap-44` tràn hộp. Trong khi
`index.css:39` tính `--bnav-only-h = 5.25rem + max(12px, safe)` (giả định CỘNG thêm) → token
CSS lệch với DOM thật.
→ Đổi thành `min-h-[5.25rem] pb-safe` hoặc `h-[calc(5.25rem+env(safe-area-inset-bottom))]`.

### A4. ~24 hộp thoại tự chế `fixed inset-0`, chỉ 4 file dùng `Modal.tsx`

`Modal.tsx` đạt đủ 6 hành vi WAI-ARIA APG (role/aria-modal/Escape/focus-trap/trả focus/khoá
cuộn nền, nút đóng 44px, `max-h-[90dvh]`), nhưng phần lớn modal bỏ qua nó:
`IntegrationsModal.tsx:95`, `MemoryPalaceExplorerModal.tsx:114`, `AgentOrchestratorModal.tsx:81`,
`PvPArenaLobbyModal.tsx:93`, `PvPBattlefieldModal.tsx:123`, `QuickActions.tsx:165`,
`ShareProgress.tsx:67`, `FeedbackModal.tsx:102`, `LiveDebateModal.tsx`, `MicroDrillModal.tsx`,
`ActionCanvas/*Modal.tsx`, `LifeGraph.tsx`, `StartupCanvas.tsx`, `Companion.tsx`… Thiếu
Escape + focus trap là lỗi nặng nhất với người dùng bàn phím desktop; một số còn dùng
`max-h-[90vh]` (không phải dvh — tràn dưới thanh URL iOS: `StemScratchpadModal.tsx:110`,
`MemoryPalaceExplorerModal.tsx:115`, `LiveDebateModal.tsx:91`) hoặc `overflow-hidden` cắt
nội dung không cuộn được (`PvPBattlefieldModal.tsx:124`).
→ Chuyển dần sang `<Modal>` (ưu tiên luồng chính); thêm lint/test canh chặn `fixed inset-0`
mới ngoài `Modal.tsx`.

### A5. Sidebar desktop mất active-state ở các trang luyện tập chính

`DesktopSidebar.tsx:37-41,84-85` chỉ có mục `/`, `/tien-do`, `/trang-ca-nhan` + STUDIOS, so
khớp bằng `startsWith`. BottomNav (`BottomNav.tsx:407-531`) có 5 tab với bảng path dài
(`PRACTICE_PATHS`: `/tro-truyen`, `/luyen-noi`, `/luyen-viet`, `/tu-dien`, `/bai-hoc`…).
Kết quả: đứng ở Chat/Speaking/Writing/Dictionary/Lessons/History… **không mục sidebar nào
sáng** — desktop mất định vị trong khi mobile vẫn có.
→ Tách bảng path của BottomNav ra `lib/navPaths.ts` dùng chung; bổ sung mục Luyện tập.

### A6. Sàn chữ 11px bị vi phạm 217 chỗ (202 × `text-[10px]`, 15 × `text-[9px]`)

Nặng nhất: nhãn tab trung tâm BottomNav `BottomNav.tsx:180` `text-[10px] sm:text-[11px]` —
đúng phần tử điều hướng chính ở breakpoint nhỏ nhất (trình duyệt thật cũng thấy nhãn bị cắt
"Agent Bạn Đồn…"). Khác: `Layout.tsx:182` (badge 9px), `Home.tsx:243,294,341,344`,
`Profile.tsx:472`, `Writing.tsx:455`, `A2ANegotiatorCard.tsx:155,181`…
→ Codemod 1 lượt `text-[9px]`/`text-[10px]` → `text-[11px]` + lint rule chặn tái phạm;
rút gọn nhãn tab thành "Đồng Hành".

### A7. Cụm nút gửi tin của Chat 36px, không `tap-44`

`Chat.tsx:815,830,878,887` (`p-2.5` + icon 16px = 36×36, `gap-2` sát nhau) và nút vote
`Chat.tsx:327,342` (`h-9 w-9`). Trang Speaking đã làm đúng (`Speaking.tsx:1071,1132`
`tap-44 p-3`) — áp cùng mẫu.

### A8. CTA chính cuối trang bị BottomNav che ở mobile (thấy trên trình duyệt thật)

"Chấm bài ngay" (`/luyen-viet`) và "Bắt đầu đếm ngược" (`/on-thi`) nằm sát đáy, bị BottomNav/
fade che một phần — thiếu `pb-[calc(...+var(--bnav-h))]` mà ~30 trang khác đã dùng.
(Ảnh: `writing-mobile-full.png`, `on-thi-mobile-full.png`.)

### A9. `⌘K` mở Studio switcher nhưng không quản lý focus

`Layout.tsx:68-73` chỉ toggle state; dropdown `:147-195` không `role="menu"`, không focus mục
đầu, không điều hướng mũi tên, Escape đóng nhưng không trả focus. Người dùng bàn phím mở xong
phải Tab mò từ đầu tài liệu.

### A10. Giá gói Pro/VIP hiện "…" vĩnh viễn khi API `plan_prices` lỗi

Trên trình duyệt thật (`profile-mobile-full.png`): ô giá "10 ngày/Tháng/Năm" chỉ hiện "…" —
không skeleton, không thông báo lỗi, không retry. Đây là màn THANH TOÁN, trạng thái lỗi im
lặng vi phạm luật 4.3. Cùng họ: `Profile.tsx:92,106` fetch thưởng không `catch`/loading.

---

## B. 🟡 Nên sửa

**Mobile:**

1. `OfflineSyncIndicator.tsx:49` `fixed bottom-20` (80px) đè lên BottomNav (84px + safe-area)
   → dùng `bottom-[calc(1rem+var(--bnav-h))]`.
2. Toast (`packages/core-ui/ToastProvider.tsx:96-101`): nút đóng ~14px, container `top-0
z-[100]` đè header che nút Back trong 4 giây → `tap-44` + hạ xuống `top-14`.
3. 0 chỗ dùng `visualViewport`: bàn phím ảo iOS không co `dvh`, ô nhập Chat bị che, chỉ vá bằng
   `setTimeout(scrollIntoView)` (`Chat.tsx:874-877`); BottomNav không ẩn khi bàn phím mở.
4. 192 chỗ nút `py-1`/`py-1.5` không `tap-44` (vd `Home.tsx:256-271,357-378`,
   `Lessons.tsx:999-1026` nút `w-6 h-6` = 24px, `LifeGraph.tsx:794,860,949`).
5. Header mobile 7 cụm trong `h-14` (`Layout.tsx:104-260`), tiêu đề bị cắt cụt "Xin ch…",
   "Không …" (ảnh `home-mobile.png`, `learn-mobile-full.png`); các nút bị flex ép dưới 44px dù
   có class `tap-44` → gom bớt vào menu "⋯".
6. Heatmap Dashboard (`Dashboard.tsx:418-425`): div không focus được, thông tin chỉ trong
   `title` (hover) — vô dụng trên cảm ứng; desktop thì ô ~90px quá to, đẩy số liệu chính xuống
   dưới màn hình (ảnh `tien-do-desktop.png`); mobile label "Lượt AI tuần này…/35" cắt ellipsis.
7. Tab "Kiểm tra" wrap 2 dòng ở `/lo-trinh-hoc/a1` mobile (lệch chiều cao pill).

**Desktop:** 8. Luồng chính vẫn 1 cột hẹp: `Home.tsx:144` `max-w-3xl` 0 class `lg:`; `Speaking.tsx:988`
(Chat có cột feedback, Speaking cùng mô hình thì không); `Writing.tsx:95,365` `max-w-2xl`
— trình soạn luận bỏ trống ~55% màn 1440px, chưa có bố cục "soạn | nhận xét";
`ExamPlan.tsx:266`, `LiveLocation.tsx:328`, `Profile.tsx:197`, `RoadmapTab.tsx` tương tự.
→ Áp mẫu 2 cột/master-detail đã có ở `Dashboard.tsx:767-780`, `CefrLevelPage.tsx:377-378`. 9. Container lệch nhau vô cớ: header `max-w-3xl lg:max-w-5xl` vs trang `max-w-6xl`/`5xl`/`4xl`/
`3xl`/`2xl` → định nghĩa token bề rộng `.page-narrow`/`.page-wide` dùng chung. 10. Ô nhập Chat `max-w-3xl mx-auto` (`Chat.tsx:814-815`) lệch khỏi cột hội thoại `lg:max-w-5xl`. 11. Loading dạng chữ/spinner thay skeleton (`ChatWindow.tsx:157-159`, `ChatList.tsx:92`,
`ExamPlan.tsx:274`, `LiveLocation.tsx:335`) dù đã có `CardListSkeleton`; lỗi mạng không
retry (`ChatWindow.tsx:150-153`, `Chat.tsx:795-799`) dù đã có `LoadError`. 12. Bảng giá nằm lẫn trong Profile, `sm:grid-cols-2`, không route riêng, không so sánh
`lg:grid-cols-3/4`; sidebar không có mục Nâng cấp. 13. 0 chỗ `max-w-prose`: `ProgrammingLessonPage.tsx:161` `max-w-4xl` → ~120-130 ký tự/dòng. 14. Danh sách dài không phân trang: `History.tsx`, `MistakeBank.tsx`, `ChatList.tsx:151`,
`Friends.tsx`; `Dictionary.tsx:33` `PAGE_SIZE = 3` quá nhỏ. 15. Nút không hover state ở `Intake.tsx` (9 nút), `TwoFactorSection.tsx` (10 nút),
`EmailVerifySection.tsx`, `location/TripActions.tsx`, `TripSetup.tsx`. 16. `transition-all` 196 lần (vs `transition-colors` 54) — chuẩn hoá lại. 17. Theme sáng: `DesktopSidebar.tsx`, `ChatList/ChatWindow` 0 override `theme-light:`; palette
studio cố định (`lib/studios.ts:34-79` `text-amber-400`…) thiếu tương phản trên nền sáng —
trình duyệt thật xác nhận: "Live Studio" và chip chào trông như disabled ở Blue sky
(ảnh `home-bluesky-desktop.png`). 18. Màu hex cứng ngoài luật 4.8: `DesktopSidebar.tsx:130`, `TwoFactorSection.tsx:210,277`,
`CodeEditor.tsx:101` + `CodeSurface.tsx:19` (`bg-[#0a0a0a]` cứng cả 4 theme), loạt
`text-black` ở `LifeGraph.tsx:423,520,599`, scrollbar hub hard-code. 19. Aside Dashboard `sticky top-20` không `max-h`/`overflow-y-auto` (`Dashboard.tsx:780`) —
nội dung cao hơn viewport bị cắt; `CefrLevelPage.tsx:378` làm đúng. 20. Phím `/` focus ô nhập ĐẦU TIÊN trong DOM (`Layout.tsx:74-81`), không phải ô chính của trang. 21. Nút đổi theme hành xử như toggle, không thấy menu chọn 4 theme khi click trên trình duyệt
thật (`theme-menu-open.png`) — cần rà lại tương tác mở menu swatch. 22. `/lo-trinh-hoc/a1` mobile bắn ~20 request bị **429** khi tải (prefetch audio ồ ạt?) — rà
lại prefetch, dù không phải lỗi UI thuần.

## C. 🟢 Nhỏ

- `custom-scrollbar` là class chết (`ChatWindow.tsx:156`, `ChatList.tsx:107,151` — không định
  nghĩa ở CSS nào; đã xác minh bằng grep).
- `Layout.tsx:182` `py-0.2` không phải giá trị Tailwind hợp lệ (bị bỏ qua im lặng).
- `Layout.tsx:93` còn `h-screen` (tấm nền Reachability — nên `dvh`, và nên `lg:hidden`
  vì là hack mobile nhưng vẫn render desktop; header `z-50` > sidebar `z-40`).
- `LifeWheel.tsx:160` `w-[320px] shrink-0` tràn ở iPhone SE 320px (container còn 288px).
- Comment `index.css:39` nói BottomNav "hiện ở MỌI kích thước" — sai, thực tế `lg:hidden`.
- `CodeSurface.tsx:19` `overflow-x-auto` thiếu `tabIndex={0}` (WCAG 2.1.1 — bàn phím không
  cuộn được).
- Input ngày `/on-thi` hiện "mm/dd/yyyy" tiếng Anh (native date theo locale trình duyệt).
- Hàng chip "GỢI Ý NHANH" cuộn ngang nhưng không có dấu hiệu cuộn được (ảnh `home-mobile.png`).
- BottomNav trộn ngôn ngữ nhãn: "Profile" cạnh "Trang chủ"/"Phòng Học".
- `Modal.tsx:110` cuộn cả header — nên `sticky top-0` cho tiêu đề + nút X.
- Tooltip sidebar thu gọn dùng `title` gốc (trễ ~1s, không theo theme).
- `ChatPage.tsx` là trang duy nhất không có `<h1>` (thêm `sr-only`).
- Thứ bậc heading thị giác đảo (`Home.tsx:227` h2 `text-xs` < `:242` h3 `text-base`).

## D. Đã tốt (giữ và nhân rộng)

- Hệ token 5 theme `--z-*`/`--a-*`/`--c-white` phủ gần như toàn bộ UI; focus-visible outline
  theo `--a-500` đổi đúng theo theme.
- Kiến trúc `--sidebar-w` + `useIsDesktopViewport` (render theo nhánh, không nhân đôi DOM);
  `lib/studios.ts` một nguồn sự thật cho header + sidebar.
- Hệ safe-area chuẩn hoá (`--bnav-h`, `.pb-safe`, `.tap-44`/`.tap-44-y` — 408 lần dùng);
  Chat/Speaking dùng `100dvh`; chặn double-tap zoom; scrollbar mảnh chỉ bật cho chuột.
- `Modal.tsx`, `Field.tsx`, `LoadError.tsx`, `Skeleton.tsx` — nguyên thuỷ đúng chuẩn, vấn đề
  chỉ là độ phủ.
- `Speaking.tsx` là trang mẫu vùng chạm (mic 80px, nút phụ `tap-44 p-3`, sticky `pb-safe`).
- Trình duyệt thật: 0 tràn ngang, 0 lỗi JS runtime, theme tối nhất quán, sidebar thu gọn mượt;
  trạng thái tải/lỗi làm tốt ở `ExamPlan`, `LiveLocation`, `Writing`.
- Không còn `<div onClick>` nào chưa focus được (2 chỗ còn nhắc là comment ghi nhận đã sửa).

## E. Đề xuất thứ tự sửa (mỗi mục ≈ 1 PR nhỏ)

1. **Vá 1 dòng lan toả rộng:** chuyển rule 16px sang mức thắng utilities (A1) + `min-h` cho
   BottomNav (A3) + `pb` cho 2 CTA bị che (A8) + vị trí `OfflineSyncIndicator` (B1).
2. **Codemod sàn chữ 11px** (A6) + `tap-44` cho cụm nút Chat và các nhóm B4.
3. **Bảng path nav dùng chung** cho sidebar active-state (A5) + focus cho ⌘K (A9).
4. **Chiến dịch Modal:** chuyển dần 24 modal về `<Modal>` (A4), kèm test canh gác.
5. **Trạng thái lỗi thanh toán** (A10) + skeleton/retry nhóm B11.
6. **Nâng desktop đợt 2:** Home/Writing/Speaking/Profile 2 cột (B8), token bề rộng trang (B9).
7. **Theme sáng:** override `theme-light:` cho sidebar/chat/studios (B17) + dọn hex cứng (B18).
8. Hub: dùng chung base CSS mobile (A2).

---

## [4] Tài liệu: dac-ta-admin-dashboard-2026-07-25.md

_(Chi tiết nguồn gốc: `dac-ta-admin-dashboard-2026-07-25.md`)_

# Đặc tả triển khai — Admin Dashboard + chặn tên tài khoản giả danh (M0)

> Ngày soạn: 2026-07-25 · Làm TRƯỚC M1/M2 vì các hạng mục sau (referral, thanh toán, analytics)
> đều cần nơi admin quản lý tập trung.

## Bối cảnh thật (đọc từ code trước khi đặc tả)

- Đã có `src/pages/AdminSettings.tsx` (route `/admin-settings`) — chỉ 1 khối: hạn mức
  chat/writing/speaking/stt/pronounce theo free/pro/vip + mốc khuyến mãi (`promoUntil`) + cầu
  dao khẩn cấp (`aiCircuitBreaker`). Server luôn tự kiểm `isAdminEmail()` (`api/_lib/adminAuth.ts`,
  đọc `ADMIN_EMAILS` trong `.env`) — không tin client.
- Đã có `api/admin-grant-plan.ts` (cấp Pro/VIP tay theo email) — **hiện KHÔNG có UI**, chỉ gọi
  bằng `curl`/Postman thủ công. Cần đưa vào dashboard.
- **Chưa có** trang tổng nào liệt kê các mục quản trị — mỗi thứ một route rời rạc.
- Đăng ký (`api/auth.ts`, `RegisterSchema`) nhận `name` tự do (1-80 ký tự), **không có bước lọc
  tên giả danh admin/CSKH**.

## Phần A — Trang Dashboard admin (khung tổng)

**Vì sao:** M1.7 (analytics), M1.4 (referral), M2 (thanh toán) đều sẽ cần thêm mục quản trị.
Làm khung dashboard 1 lần, các hạng mục sau chỉ cần thêm tab, đỡ phải làm lại điều hướng.

**Đặc tả:**

- Route mới `/admin` (`src/pages/AdminDashboard.tsx`), thay vai trò "trang vào cổng" — có menu
  tab bên trái (mobile: tab ngang cuộn) trỏ tới các trang con:
  - **Hạn mức & khuyến mãi** — chính là `AdminSettings.tsx` hiện có, chuyển thành 1 tab thay vì
    route riêng (giữ route `/admin-settings` redirect sang `/admin?tab=limits` để không vỡ link
    cũ nếu có bookmark).
  - **Cấp gói tay** — UI mới bọc quanh `api/admin-grant-plan.ts` đã có sẵn (form nhập email +
    chọn plan/days, gọi API có sẵn — không viết API mới).
  - **Tên bị cấm đăng ký** — UI cho Phần B bên dưới.
  - Chỗ trống chờ gắn thêm: "Analytics" (M1.7), "Referral" (M1.4), "Thanh toán" (M2) — chỉ cần
    thêm tab khi các hạng mục đó code xong, không làm trước lúc chưa có API.
- Bảo vệ quyền: **client-side chỉ để ẩn/hiện UI cho mượt** (check `isAdminEmail` không có ở
  client — client không có `ADMIN_EMAILS`). Cách đúng: gọi 1 API bất kỳ trong tab (vd
  `/api/admin-settings` GET) lúc vào trang, nếu 403 thì hiện màn "Không có quyền" (Y HỆT cách
  `AdminSettings.tsx` hiện tại đang làm — đọc state `forbidden` trong file đó, tái dùng đúng
  pattern, không bịa cách mới).
- Điều hướng: thêm link "Quản trị" trong menu chỉ hiện với email nằm trong danh sách admin —
  nhưng vì client không biết `ADMIN_EMAILS`, cách đơn giản nhất: **luôn hiện link, để server tự
  chặn** (đã là hành vi hiện tại của `/admin-settings`) — không thêm logic ẩn/hiện phức tạp ở
  client cho việc này.

**Tiêu chí chấp nhận:**

- Vào `/admin` bằng tài khoản không phải admin → thấy "Không có quyền" (403 xử lý đúng, không
  crash trắng trang).
- Vào bằng tài khoản admin → thấy đủ 3 tab, mỗi tab hoạt động đúng như trang gốc.
- `/admin-settings` cũ vẫn hoạt động (redirect hoặc giữ nguyên — không phá link cũ).
- axe/a11y AA giữ nguyên (nguyên tắc #5), 4 theme dùng được (nguyên tắc #8).
- Không có API mới bắt buộc cho phần này (chỉ gom UI + 1 API nhỏ ở Phần B).

**Người làm:** `standard-worker` (Sonnet) — chủ yếu là ghép UI đã có sẵn logic, đặc tả kín.

---

## Phần B — Chặn tên tài khoản dễ gây nhầm là admin/CSKH

**Vì sao:** người dùng thấy tên "Quản trị viên", "CSKH En-Vi", "Admin", "Ban quản trị"... trong
chat/bình luận (nếu sau này có tính năng cộng đồng) dễ tưởng đó là nhân viên thật → bị lừa hoặc
hoang mang. Chặn từ lúc đăng ký rẻ hơn nhiều so với xử lý hậu quả.

**Đặc tả:**

- Danh sách từ khoá cấm: file tĩnh `api/_lib/reservedNames.ts`, export
  `const RESERVED_NAME_PATTERNS: RegExp[]` — khớp không phân biệt hoa/thường, có dấu/không dấu
  (cần hàm bỏ dấu tiếng Việt trước khi so khớp — kiểm tra dự án đã có hàm bỏ dấu ở đâu chưa,
  vd trong `src/lib/` phần tìm kiếm từ điển, TÁI DÙNG nếu có thay vì viết lại).
  Danh sách khởi điểm (bạn bổ sung thêm nếu thấy thiếu):
  `admin`, `administrator`, `quan tri`, `quan tri vien`, `ban quan tri`, `moderator`, `mod`,
  `cskh`, `cham soc khach hang`, `support`, `ho tro`, `official`, `chinh thuc`, `system`,
  `he thong`, `staff`, `nhan vien`, `donghanhcungban` (trùng tên miền/thương hiệu app).
- Áp dụng ở **server**, đúng nguyên tắc #2 (không tin client): sửa `RegisterSchema` trong
  `api/auth.ts` — thêm `.refine()` kiểm `name` không khớp `RESERVED_NAME_PATTERNS`, lỗi rõ ràng:
  `'Tên này không thể sử dụng, vui lòng chọn tên khác'`.
- Áp dụng luôn cho chỗ đổi tên hồ sơ nếu có (kiểm tra `api/profile.ts` xem có cho sửa `name`
  không — nếu có, thêm cùng kiểm tra ở đó, KHÔNG chỉ chặn lúc đăng ký rồi bỏ lửng chỗ đổi tên).
- **Không** áp dụng nhầm vào các field khác không phải tên hiển thị công khai (vd không đụng
  `nickname` nếu field đó chỉ hiển thị riêng tư cho chính chủ — đọc rõ field nào công khai với
  người khác trước khi quyết định phạm vi áp dụng; hiện tại app **chưa có tính năng cộng đồng
  hiển thị tên chéo giữa các user**, nên phạm vi thực tế trước mắt là chặn lúc đăng ký + đổi tên
  hồ sơ, phòng xa cho các tính năng cộng đồng sau này — vd bảng xếp hạng `leaderboard.ts` đã có,
  cần xác nhận `leaderboard.ts` có hiển thị `name` công khai không, nếu có thì đây là lý do thật
  sự cấp thiết ngay bây giờ, không phải phòng xa).

**Tiêu chí chấp nhận:**

- Test unit: đăng ký với `name = "Admin"`, `"quản trị viên"`, `"CSKH"` (có/không dấu, hoa/thường)
  → bị từ chối, thông báo rõ ràng. Tên hợp lệ bình thường (`"Nguyễn Văn A"`) → qua được.
  Ca biên: tên chứa từ khoá như 1 phần của từ khác không nên bị chặn nhầm — kiểm tra rõ khớp
  theo TỪ/CỤM chứ không phải substring bất kỳ (vd tên "Ngô Admin Trần" hợp lý bị chặn, nhưng
  đừng chặn nhầm tên có chữ khớp ngẫu nhiên nếu danh sách chọn từ tiếng Việt thông dụng — rà kỹ
  danh sách để tránh false positive trước khi merge).
- Không đổi chữ ký hàm hiện có ngoài phạm vi cần thiết.

**Người làm:** `standard-worker` (Sonnet) — cần đọc `leaderboard.ts`/`profile.ts` để xác định
đúng phạm vi trước khi code (không đoán), nên không giao Haiku dù bản chất là lọc chuỗi.

---

## Bảng chia việc

| #    | Hạng mục                | Người làm | Phụ thuộc                                   |
| ---- | ----------------------- | --------- | ------------------------------------------- |
| M0.A | Khung Admin Dashboard   | Sonnet    | không                                       |
| M0.B | Chặn tên giả danh admin | Sonnet    | cần đọc `leaderboard.ts`/`profile.ts` trước |

Cả hai độc lập với nhau, làm song song được. Sau khi xong, M1.1 có thể bắt đầu ngay (không phụ
thuộc M0).

---

## [5] Tài liệu: dac-ta-avatar-3d-chat-luong-cao-2026-07-30.md

_(Chi tiết nguồn gốc: `dac-ta-avatar-3d-chat-luong-cao-2026-07-30.md`)_

# Đặc tả nghiên cứu: Nâng cấp Avatar AI lên 3D chất lượng cao

> Trạng thái: **BƯỚC 1 (timing thật) ĐÃ TRIỂN KHAI** — xem mục 5. Các bước còn lại (3D) vẫn
> đang chờ quyết định. Người dùng chốt 2026-07-31: đây chỉ là **một tính năng phụ**, không đầu tư
> model 3D riêng ($300–1500) và không đổi provider TTS mặc định của toàn app.
> Tài liệu này nối tiếp
> `dac-ta-avatar-ai-noi-chuyen-2026-07-28.md` (bản 2D đã triển khai).
> Yêu cầu người dùng (2026-07-30): _"tạo AI tutor 3D đẹp để nói chuyện với người dùng trên đt"_,
> ưu tiên **chất lượng cao nhất có thể** (không tối ưu rẻ/nhẹ trước).

## 1. Hiện trạng đã có trong repo (đọc code thật, không phỏng đoán)

| Thành phần                                             | Hiện trạng                                                                                                               |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| `src/components/AvatarSpeaking.tsx`                    | Avatar **2D SVG robot** vẽ tay, miệng là "thanh LED" đổi rộng/cao theo viseme. 136 dòng.                                 |
| `src/lib/viseme.ts`                                    | 5 viseme (`PP/FF/AA/OO/REST`). Timing **chia đều** thời lượng audio theo số phoneme/âm tiết.                             |
| `api/avatar-visemes.ts` + `api/_lib/espeakPhonemes.ts` | Lấy chuỗi phoneme thật bằng eSpeak-ng trên VPS — nhưng **không có mốc thời gian**.                                       |
| `api/tts.ts`                                           | Google TTS Chirp3-HD (`googleTts.ts`, REST v1) + Studio + **ElevenLabs** (`elevenLabsTts.ts`). Cache mã hoá AES-256-GCM. |
| `src/pages/AvatarDemo.tsx`                             | Trang demo đang dùng avatar 2D.                                                                                          |

**Điểm nghẽn chất lượng số 1 không phải là 2D-hay-3D, mà là TIMING.** Miệng hiện chia đều theo
âm tiết nên luôn "trôi" so với giọng thật. Dựng 3D đẹp mà giữ timing chia đều thì trông **tệ hơn**
2D hiện tại — vì mắt người soi khẩu hình 3D khắt khe hơn nhiều (hiệu ứng uncanny valley).

→ **Thứ tự bắt buộc: sửa timing trước, dựng 3D sau.**

## 2. Lớp 1 — Timing chính xác (bắt buộc, làm trước)

### 2.1. ElevenLabs `with-timestamps` — đường chất lượng cao nhất

Dự án **đã tích hợp ElevenLabs** (`api/_lib/elevenLabsTts.ts` gọi
`POST https://api.elevenlabs.io/v1/text-to-speech/{voice_id}`). ElevenLabs có endpoint song song
`POST /v1/text-to-speech/{voice_id}/with-timestamps` trả về **audio + alignment từng KÝ TỰ**
(`characters`, `character_start_times_seconds`, `character_end_times_seconds`).

Đây là timing **thật từ chính model đã sinh ra audio** — chính xác nhất có thể, không phải ước lượng.

- Thay đổi cần thiết: đổi URL + đọc thêm trường alignment; audio trả về là base64 trong JSON
  (thay vì binary) → chỉnh chỗ nhận response, phần mã hoá/lưu cache **giữ nguyên**.
- Lưu timeline vào cache cùng audio: thêm cột `viseme_timeline JSONB` vào bảng `tts_cache`
  (migration mới) — tính 1 lần, dùng mãi, **không tốn thêm tiền API**.
- Chi phí: ElevenLabs tính theo ký tự, endpoint timestamps **không tính thêm phí** so với endpoint
  thường (cùng 1 lần synthesize). Cần xác nhận lại trên trang pricing lúc triển khai.

### 2.2. Google Chirp3-HD — không có timing thật

Chirp3-HD **không hỗ trợ SSML** nên không dùng được `enableTimePointing`/`SSML_MARK`
(v1beta1). Hai lựa chọn:

- **B1 (khuyên dùng):** forced alignment sau khi có audio — chạy trên chính file audio đã sinh,
  cho mốc thời gian thật cho mọi provider. Có thể dùng ElevenLabs **Forced Alignment API**
  (nhận audio + text → timestamps) hoặc chạy offline. Ưu điểm: một cơ chế dùng chung cho **cả
  Google lẫn ElevenLabs**, và áp được cho audio đã cache từ trước.
- **B2:** đổi giọng mặc định của chế độ 3D sang ElevenLabs (đã có sẵn cơ chế `voiceAccess.ts`
  phân giọng theo gói) và chấp nhận Google chỉ chạy avatar 2D như hiện tại.

**Quyết định cần bạn chốt** (xem mục 7).

### 2.3. Nâng bộ viseme 5 → 15

> ⚠️ **Cập nhật sau khi chốt phong cách robot (mục 3.2.1):** vì miệng là dải LED chứ không phải
> môi, bộ 15 viseme **không còn bắt buộc**. Bộ 5 hiện tại + timing thật đã đủ điều khiển cường độ
> dải sáng. Giữ mục này như bước **tuỳ chọn**, chỉ làm nếu sau này đổi sang avatar có môi thật.

Bộ 5 viseme hiện tại quá thô cho 3D. Chuẩn nên dùng: **Oculus/OVR 15 viseme**
(`sil, PP, FF, TH, DD, kk, CH, SS, nn, RR, aa, E, I, O, U`) — đây cũng chính là bộ mà
Ready Player Me nhúng sẵn trong blendshape của avatar, nên map 1-1 không cần tự chế.

- Bảng tra `phoneme (IPA từ eSpeak-ng) → viseme OVR`: file JSON tĩnh, **tách riêng EN và VI**
  theo `lib/direction.ts` (tiếng Việt có âm cuối tắc /p t k/ và nguyên âm đôi khác tiếng Anh).
- Giữ nguyên `api/_lib/espeakPhonemes.ts` (đã có phoneme thật) — chỉ đổi bảng map và **gắn mốc
  thời gian thật từ lớp 2.1/2.2** thay vì chia đều.

## 3. Lớp 2 — Render 3D

### 3.1. Thư viện (phiên bản ổn định hiện hành, đã kiểm 2026-07-30)

| Gói                  | Bản chọn                         | Ghi chú                                                                                          |
| -------------------- | -------------------------------- | ------------------------------------------------------------------------------------------------ |
| `three`              | r18x (mới nhất r184, 16/04/2026) | Ổn định. **Không** dùng WebGPURenderer ở đợt đầu — hỗ trợ mobile chưa đồng đều.                  |
| `@react-three/fiber` | **v8.x**                         | ⚠️ **BẮT BUỘC v8** — v9 yêu cầu React 19. Dự án đang React 18 và CLAUDE.md mục 6 cấm nâng React. |
| `@react-three/drei`  | v9.x                             | Bản đi kèm R3F v8.                                                                               |
| `@pixiv/three-vrm`   | v3.5.x                           | Chỉ cần nếu chọn hướng avatar VRM.                                                               |

Rủi ro đã lường: R3F v8 là nhánh bảo trì. Đây là **cái giá bắt buộc** của việc giữ React 18 —
nếu sau này nâng React 19 thì mới lên R3F v9. Cần ghi vào `PROGRESS.md` mục nợ kỹ thuật.

### 3.2. Phong cách chốt: ROBOT hình người, khung nửa thân trên

Người dùng đã gửi ảnh tham chiếu (2026-07-30): robot nữ hình người, vỏ kim loại trắng/xám, sợi
carbon đen, **đường viền phát sáng xanh (emissive)**, khung cắt ngang hông, nền xám trơn.

**Đánh giá trung thực:** ảnh đó là render offline/AI-generated tĩnh, KHÔNG phải khung hình
real-time. Chạy y hệt trên điện thoại là không thể. Nhưng đạt ~80–85% cảm giác thị giác đó trong
WebGL mobile là khả thi, và phong cách robot làm việc này DỄ HƠN avatar người thật rất nhiều:

- Không có da / tóc / mắt ướt → bỏ được 3 thứ đắt nhất và dễ rơi vào uncanny valley nhất.
  Kim loại + nhựa + emissive là nhóm vật liệu PBR rẻ và dễ đẹp nhất.
- Khung **bust (nửa thân trên)** trên màn dọc điện thoại → dồn ngân sách đa giác/texture vào
  mặt + vai, nơi người dùng thật sự nhìn.
- Viền phát sáng gần như miễn phí về GPU (emissive, không cần đèn thật) nhưng tạo ấn tượng
  "cao cấp" mạnh nhất trong ảnh — và **đổi màu theo 4 theme** qua biến `--a-*` được.

### 3.2.1. Hệ quả LỚN: bỏ được bài toán blendshape khẩu hình

Robot không có môi. Miệng làm bằng **dải LED / visor emissive phản ứng theo giọng nói** — đúng
ngôn ngữ thị giác của avatar 2D đang chạy, nhưng ở dạng 3D. Nghĩa là:

- KHÔNG cần model có 15 blendshape viseme (rất hiếm và đắt với model robot) → mở rộng mạnh
  nguồn model mua được.
- KHÔNG cần rig mặt.
- Lớp timing chính xác ở mục 2 **vẫn giữ nguyên giá trị** — nó điều khiển cường độ/độ rộng/số
  đoạn của dải sáng thay vì hình miệng.
- Rủi ro triển khai giảm mạnh, chất lượng cảm nhận lại cao hơn: không ai soi độ khớp môi của robot.

Đánh đổi: mất biểu cảm khuôn mặt. Bù bằng (a) đầu nghiêng/gật, (b) mắt đổi màu + cường độ theo
cảm xúc câu trả lời (mục 3.3), (c) cử động tay idle — ảnh tham chiếu có tư thế tay rất hợp.

### 3.2.2. Nguồn model (KHÔNG tự có — cần quyết định chi phí)

| Đường                                       | Chi phí        | Ghi chú                                                              |
| ------------------------------------------- | -------------- | -------------------------------------------------------------------- |
| Mua model robot rigged (Sketchfab/CGTrader) | ~$30–150       | Nhanh nhất. **Phải kiểm giấy phép thương mại** — app có bán Pro/VIP. |
| Thuê 3D artist làm riêng                    | ~$300–1500     | Đúng nhận diện thương hiệu, bản quyền trọn.                          |
| Model miễn phí + chỉnh trong Blender        | 0đ + nhiều giờ | Khó đạt mức ảnh tham chiếu.                                          |

**Bắt buộc tối ưu lại sau khi có model:** giảm đa giác (mục tiêu ~50–80k tris cho bust), gộp
material, nén Draco + texture KTX2 → GLB ≤ 3MB. Model mua về thường 50–200MB; dùng thẳng là
màn hình trắng trên điện thoại.

### 3.2.3. Hai hướng ĐÃ LOẠI (lưu lại lý do)

- **Ready Player Me** (người thật, 52 blendshape ARKit + 15 viseme Oculus): loại vì người dùng
  chọn phong cách robot; avatar người thật còn kéo theo chi phí da/tóc và rủi ro uncanny valley.
- **VRM / VRoid** (anime): loại vì lệch phong cách ảnh tham chiếu; chỉ có 5 viseme chuẩn VRM.

Hai hướng này chỉ nên xét lại nếu sau PoC quyết định đổi hẳn phong cách nhân vật.

### 3.3. Ba thứ quyết định "đẹp" hơn cả model

1. **Ánh sáng:** HDRI environment (`drei/Environment`) + key light — ăn đứt directional light thô.
   Nâng cao: baked lighting để khỏi tốn GPU trên mobile.
2. **Idle animation:** hô hấp nhẹ, chớp mắt ngẫu nhiên 3–6s, đầu vi chuyển động, mắt nhìn theo
   camera (`lookAt`). Thiếu 4 thứ này thì model đẹp mấy cũng như tượng.
3. **Co-articulation:** làm mượt chuyển tiếp giữa 2 viseme (lerp ~60–80ms) thay vì nhảy giật —
   đây là khác biệt lớn nhất giữa lip-sync "nghiệp dư" và "chuyên nghiệp".

Nâng cao (đợt sau, nếu cần): điều khiển blendshape cảm xúc theo **nội dung câu trả lời AI** —
prompt trong `src/prompts/` trả kèm một nhãn cảm xúc (`neutral | happy | encouraging | thinking`),
frontend map sang biểu cảm. Rất rẻ (chỉ vài token) và tăng cảm giác "gia sư thật" nhiều nhất.

## 4. Ràng buộc mobile (đối tượng chính của app)

Đây là chỗ "chất lượng cao nhất" phải thoả hiệp với thực tế máy Android tầm trung ở VN:

- Bundle: three + R3F + drei ≈ **600–700KB gzip**. **Bắt buộc** `React.lazy` + dynamic import,
  chỉ tải khi vào màn có avatar. Ngân sách bundle-size trong CI sẽ đỏ nếu không tách chunk →
  phải cập nhật cấu hình budget cho chunk riêng này.
- Model GLB **≤ 3MB**: nén Draco/meshopt + texture KTX2.
- `dpr={[1, 1.5]}`, khoá 30fps, **không post-processing, không shadow map động** — nếu không máy
  sẽ nóng và tụt pin thấy rõ trong 1 phiên học 15 phút.
- **Bắt buộc có công tắc tắt 3D** → fallback về avatar 2D SVG **đang có** (đây là lợi thế lớn:
  fallback đã tồn tại và đã chạy tốt). Tự tắt khi `prefers-reduced-motion` (mục 5 a11y CLAUDE.md).
- **Rủi ro lớn nhất chưa kiểm chứng:** WebGL chạy song song với `MediaRecorder` (đang ghi âm ở
  chế độ Luyện nói) trên **iOS Safari**. Phải test trên iPhone thật ở PoC, trước khi làm tiếp.

## 5. Phạm vi đề xuất (chia nhỏ theo mục 3 CLAUDE.md)

| Bước | Nội dung                                                                                                                                                                                                                                                      | Rủi ro  | Có giá trị kể cả khi dừng ở đây                 |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | ----------------------------------------------- |
| 1 ✅ | **ĐÃ LÀM (2026-07-31).** `elevenLabsTts.ts` gọi `/with-timestamps`; `visemeTimeline.ts` dựng timeline theo mốc THẬT của từng từ; lưu cột `viseme_timeline` (migration `0028`); client `ensureAudioWithTimeline()` + cache IndexedDB. Không tốn thêm tiền API. | Thấp    | ✅ Avatar 2D **hiện tại** khớp miệng chuẩn ngay |
| 2    | _(tuỳ chọn, xem 2.3)_ Nâng 5 → 15 viseme OVR — **bỏ được** nếu giữ phong cách robot LED                                                                                                                                                                       | Thấp    | ✅ 2D mượt hơn                                  |
| 3    | PoC 3D trên `/avatar-demo` (đã có sẵn trang này) — đo FPS/pin/bundle trên **điện thoại thật, có cả iPhone**                                                                                                                                                   | **Cao** | ⚠️ Cổng quyết định go/no-go                     |
| 4    | Tích hợp vào Chat + Luyện nói, công tắc bật/tắt 3D, fallback 2D                                                                                                                                                                                               | Trung   |                                                 |
| 5    | (Tuỳ chọn) Biểu cảm theo cảm xúc câu trả lời AI                                                                                                                                                                                                               | Thấp    |                                                 |

Bước 1–2 là **thắng lợi chắc chắn**, không phụ thuộc quyết định 3D. Bước 3 là cổng thật sự.

## 6. Việc KHÔNG làm

- Không sinh video AI mỗi câu (HeyGen/D-ID/Wav2Lip) — đã loại ở đặc tả 28/07 vì băng thông,
  chi phí GPU và độ trễ; kết luận đó vẫn đúng và không thay đổi.
- Không nâng React/TS/Tailwind để lấy R3F v9 (CLAUDE.md mục 6).
- Không dùng WebGPURenderer ở đợt đầu.

## 7. Câu cần bạn quyết trước khi mở việc triển khai

1. **Ngân sách model 3D** (mục 3.2.2): mua ~$30–150, thuê artist ~$300–1500, hay tự chỉnh model
   miễn phí? Đây là chặn cứng — không có model thì không có bước 3.
2. **Provider giọng cho chế độ 3D:** ElevenLabs (timing thật, chất lượng cao nhất, đắt hơn) hay
   giữ Google Chirp3-HD + forced alignment (rẻ hơn, thêm 1 lượt xử lý)?
3. **Ưu tiên:** làm ngay, hay xếp sau các nợ kỹ thuật đang mở ở CLAUDE.md mục 13?

Trong lúc chờ 1&2, **bước 1 ở mục 5 (timing thật) chạy được ngay** và cải thiện avatar 2D đang
có — không phụ thuộc quyết định nào ở trên.

## 8. Đánh giá combo "Unity + Ready Player Me + Oculus Lipsync + Convai/Inworld"

Người dùng đề xuất combo này (2026-07-30) như "công thức hoàn hảo nhất hiện nay". Nhận định đó
**đúng — nhưng cho bối cảnh làm MOBILE APP NATIVE TỪ ĐẦU.** Dự án này là **web app React 18 +
Vite, deploy VPS, dùng như PWA trên điện thoại**. Đánh giá từng thành phần:

### 8.1. Unity — ❌ KHÔNG áp dụng

| Vấn đề                 | Chi tiết                                                                                                                                                                       |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Không tái dùng được gì | Toàn bộ UI (chat, lộ trình CEFR, SRS, thanh toán SePay, 4 theme, auth Bearer token, i18n) là React/DOM. Unity không dùng lại được dòng nào.                                    |
| Hai đường đi           | Build native → phải viết lại app + qua App Store/CH Play, mất luôn ưu thế "vào web là học ngay". Build Unity **WebGL** → gói build 15–40MB, nuốt chửng ngân sách LCP hiện tại. |
| WebGL trên di động     | Unity Web nay có chạy trên iOS Safari (WebGL 2.0 từ iOS 15), nhưng vẫn nặng hơn nhiều so với three.js thuần, và khó nhúng chung DOM với UI React sẵn có.                       |
| Chi phí thật           | Đây là **viết lại sản phẩm**, không phải thêm tính năng — vi phạm mục 12 CLAUDE.md (breaking change diện rộng).                                                                |

→ **Tương đương trên web: three.js + React Three Fiber v8** (đã đặc tả ở mục 3.1). Cùng làm được
việc avatar 3D, nhúng thẳng vào React hiện có, không đụng phần còn lại của app.

### 8.2. Ready Player Me — ✅ ÁP DỤNG ĐƯỢC (nhưng lệch phong cách đã chốt)

RPM **không phải công nghệ riêng của Unity** — có SDK web chính chủ `@readyplayerme/visage`,
xây trên đúng stack đã chọn: three.js + react-three-fiber + drei. Avatar xuất GLB, kèm sẵn
blendshape ARKit + viseme Oculus.

- **Ưu:** bỏ được toàn bộ khâu tìm/mua/rig model ở mục 3.2.2 — tiết kiệm $30–1500 và 1–3 ngày Blender.
- **Vướng 1:** RPM là avatar **người thật**, trong khi mục 3.2 đã chốt phong cách **robot** theo
  ảnh tham chiếu người dùng gửi. Hai thứ loại trừ nhau → **cần chọn lại** (xem mục 9).
- **Vướng 2:** dùng thương mại phải **đăng ký partner** với RPM (app có bán gói Pro/VIP). Việc tay,
  phải làm trước khi triển khai.

### 8.3. Oculus Lipsync — ⚠️ ÁP DỤNG MỘT PHẦN

Phải tách hai thứ hay bị gộp làm một:

- **Plugin OVRLipSync (Unity/native): ❌** — không có bản chạy trên web.
- **Bộ 15 viseme chuẩn Oculus (`sil, PP, FF, TH, DD, kk, CH, SS, nn, RR, aa, E, I, O, U`): ✅** —
  đây là **chuẩn dữ liệu**, không phụ thuộc Unity. Đúng bộ mà mục 2.3 đã đề xuất và đúng bộ mà
  avatar RPM nhúng sẵn.

Quan trọng: cách OVRLipSync sinh viseme là **phân tích biên độ audio thời gian thực** — tức là
**đoán**. Cách của dự án (timestamp thật từ ElevenLabs, mục 2.1) **chính xác hơn**, vì lấy mốc
thời gian từ chính model đã sinh ra audio. Không cần thay thế bằng OVRLipSync.

### 8.4. Convai / Inworld — ❌ KHÔNG, và đây là cái "không" mạnh nhất

Convai/Inworld là nền tảng **NPC hội thoại trọn gói**: LLM + STT + TTS + lipsync trong một API.
Dự án này **đã có đủ cả ba** và chúng là tài sản cốt lõi:

| Thành phần | Dự án đã có                                                | Convai/Inworld thay thế bằng       |
| ---------- | ---------------------------------------------------------- | ---------------------------------- |
| LLM        | `/api/agent` + prompt sư phạm riêng ở `src/prompts/`       | LLM chung, không có sư phạm CEFR   |
| STT        | Whisper qua Groq/OpenAI (`/api/stt`)                       | STT đóng gói                       |
| TTS        | Google Chirp3-HD + ElevenLabs, **cache dùng chung mã hoá** | TTS đóng gói, **mất cơ chế cache** |

Ba lý do bác bỏ, theo thứ tự nặng dần:

1. **Phá vỡ điểm khác biệt sản phẩm.** Đặc trưng bất biến của app (CLAUDE.md mục 1) là **sửa lỗi
   và giải thích bằng GIỌNG tiếng mẹ đẻ**, hai giọng riêng, đảo chiều theo `direction` A/B. Đây là
   logic sư phạm song ngữ, không phải hội thoại NPC. Convai/Inworld không làm được việc này.
2. **Phá vỡ mô hình chi phí.** Inworld ~$15/1M ký tự; stack voice agent thật ~$0.007–0.091 **mỗi
   phút hội thoại**, và **tính tiền theo mỗi cuộc trò chuyện, mãi mãi**. App đang MIỄN PHÍ cho cộng
   đồng với gói Pro 20.000đ/10 ngày. Vài chục phút nói/tháng của một người dùng free là đã lỗ.
   Cơ chế **cache TTS dùng chung** (câu nào đã sinh thì mọi user sau dùng lại miễn phí) — thứ giữ
   chi phí app ở mức thấp — sẽ **mất trắng**.
3. **Mất kiểm soát.** Đếm/giới hạn lượt (`api/_lib/usage.ts`), kiểm quyền server, guardrail model
   trong `aiConfig.ts`, eval chất lượng gia sư (`npm run eval:tutor`) đều nằm ở server dự án.
   Đẩy sang nền tảng ngoài là bỏ hết.

→ **Giữ nguyên pipeline AI hiện có.** Avatar 3D chỉ là **lớp hiển thị** cắm lên trên, không đụng
vào tầng AI.

### 8.5. Bảng tổng kết

| Thành phần combo | Áp dụng? | Thay bằng / ghi chú                                                                  |
| ---------------- | -------- | ------------------------------------------------------------------------------------ |
| Unity            | ❌       | three.js + React Three Fiber v8                                                      |
| Ready Player Me  | ✅       | Qua `@readyplayerme/visage` (web SDK); cần chốt lại phong cách + đăng ký partner     |
| Oculus Lipsync   | ⚠️       | Bỏ plugin, **giữ bộ 15 viseme**; timing lấy từ ElevenLabs timestamps (chính xác hơn) |
| Convai / Inworld | ❌       | Giữ `/api/agent` + `/api/stt` + `/api/tts` hiện có                                   |

## 9. Quyết định mới phát sinh: phong cách nhân vật (robot hay người?)

Mục 3.2 đã chốt **robot** (theo ảnh người dùng gửi). Mục 8.2 cho thấy **Ready Player Me** (người
thật) giúp bỏ hẳn khâu model + rig. Hai đường không thể đi cùng lúc:

|                    | Robot (ảnh tham chiếu)                       | Ready Player Me (người)                         |
| ------------------ | -------------------------------------------- | ----------------------------------------------- |
| Model              | Tự mua/thuê, $30–1500 + 1–3 ngày Blender     | Miễn phí, có sẵn                                |
| Rig + blendshape   | Phải tự làm                                  | Có sẵn 52 ARKit + 15 viseme                     |
| Khẩu hình          | Dải LED emissive (dễ, không cần rig mặt)     | Khẩu hình môi thật (cần bộ 15 viseme ở mục 2.3) |
| Uncanny valley     | Không có                                     | Có rủi ro                                       |
| Biểu cảm khuôn mặt | Không (bù bằng mắt/đầu/tay)                  | Đầy đủ                                          |
| Nhận diện riêng    | Cao — hợp 4 theme, viền sáng đổi màu `--a-*` | Thấp — nhìn giống mọi app dùng RPM              |
| Thời gian tới PoC  | Lâu hơn                                      | Nhanh nhất                                      |
| Giấy phép          | Theo model mua                               | Phải đăng ký partner thương mại                 |

**Khuyến nghị:** làm **PoC bằng Ready Player Me trước** (nhanh, gần như 0 đồng) để kiểm chứng rủi
ro lớn nhất — FPS/pin/WebGL + `MediaRecorder` trên iPhone thật (mục 4). Nếu PoC đạt, mới quyết
định có đầu tư model robot riêng cho bản chính thức hay không. Như vậy **không tiêu tiền vào model
trước khi biết 3D có chạy nổi trên điện thoại người dùng hay không**.

## 10. Nguồn đã tra (2026-07-30)

- React Three Fiber — npm / releases (R3F v8 ↔ React 18, v9 ↔ React 19)
- three.js releases (r184, 16/04/2026)
- ElevenLabs Docs — Create speech with timing (`/with-timestamps`), Forced Alignment
- Google Cloud TTS — SSML + `enableTimePointing` (`SSML_MARK`, v1beta1)
- `@pixiv/three-vrm` npm (v3.5.x) + migration guide 1.0 (`expressionManager`)
- Khronos — KTX 2.0 + glTF, `KHR_texture_basisu`, `KHR_draco_mesh_compression`
- So sánh công cụ image-to-3D 2026 (Rodin / Tripo / Meshy v6 / Hunyuan3D v3 / TRELLIS 2)
- `@readyplayerme/visage` npm (three.js + react-three-fiber + drei)
- Unity Manual — Web browser compatibility (WebGL 2.0 trên iOS Safari)
- Inworld AI — Voice agent cost per minute 2026 · Convai pricing

---

## [6] Tài liệu: dac-ta-avatar-ai-noi-chuyen-2026-07-28.md

_(Chi tiết nguồn gốc: `dac-ta-avatar-ai-noi-chuyen-2026-07-28.md`)_

# Đặc tả nghiên cứu: Avatar AI mô phỏng khẩu hình khi nói chuyện

> Trạng thái: **NGHIÊN CỨU KHẢ THI — chưa triển khai.** Tài liệu này chỉ để lưu kết quả tìm hiểu +
> đề xuất kiến trúc, làm cơ sở cho PR triển khai thật sau này (khi được xác nhận ưu tiên).
> Không có code tính năng nào đi kèm PR này.

## 1. Vấn đề & mục tiêu

Người dùng hỏi: tạo hình ảnh AI avatar "nói chuyện" mô phỏng khẩu hình miệng khi phát âm (kiểu
Grok Imagine) có khả thi cho app học tiếng Anh này không?

**Kết luận nhanh:** Khả thi, nhưng **không nên** dùng cách "AI generate video mỗi câu nói"
(kiểu Grok/HeyGen/D-ID) cho app này vì:

- **Băng thông:** video lip-sync tốn hàng trăm KB–vài MB mỗi câu, không phù hợp người dùng mạng
  di động/3G-4G tại Việt Nam (đối tượng chính của app).
- **Chi phí:** các model video AI (Wav2Lip/SadTalker chạy GPU, hoặc API Grok/HeyGen) tốn tiền
  GPU/API mỗi lần generate — ngược với nguyên tắc "ưu tiên chi phí thấp" của dự án (mục 3/7 CLAUDE.md).
- **Độ trễ:** generate video mất vài giây → không phù hợp hội thoại thời gian thực (chế độ Luyện nói).

**Hướng đề xuất: viseme animation 2D** (hình miệng tĩnh ghép theo âm vị, đồng bộ với audio TTS
đã có sẵn) — nhẹ, gần như miễn phí, chạy mượt trên máy/mạng yếu, phù hợp cả 3 chế độ hiện có.

## 2. Vì sao viseme animation phù hợp app này

App đã có sẵn:

- TTS Google Cloud qua `/api/tts` (giọng tiếng Anh + tiếng Việt, đã cache mã hoá).
- Chế độ Luyện nói song ngữ cần AI "nói" bằng giọng đích + giải thích bằng giọng mẹ đẻ.

Chỉ cần **thêm lớp animation khẩu hình chạy trên audio đã có**, không cần generate video mới:

```
[Câu trả lời AI] → Google TTS (đã có) → audio.mp3
                                       ↓
                    [Text → phoneme → viseme timeline]  (mới, chạy server, rẻ)
                                       ↓
              [Frontend: phát audio + đổi frame hình miệng theo timeline]
```

Tổng dữ liệu thêm cho mỗi câu: 1 file JSON timing vài trăm byte–vài KB. Sprite sheet hình miệng
(~12-15 khung hình PNG/SVG) chỉ tải 1 lần, cache vĩnh viễn ở trình duyệt.

## 3. Kiến trúc đề xuất chi tiết

### 3.1. Lấy thời điểm âm vị (timing)

Hai lựa chọn, ưu tiên lựa chọn A vì tận dụng hạ tầng TTS đã có:

- **A — SSML `<mark>` của Google Cloud TTS:** chèn thẻ `<mark name="w3"/>` vào SSML giữa các từ,
  API `synthesizeSpeech` trả về `timepoints` (ms) khi audio phát tới mốc đó. Không cần thư viện
  phoneme riêng cho phần "từ nào phát lúc nào" — chỉ cần map further xuống viseme ở bước 3.2.
  **Cần kiểm tra:** dự án đang dùng REST hay client library Google TTS nào (`api/tts.ts`) —
  đọc code thật trước khi triển khai để biết có hỗ trợ `enableTimePointing`/SSML marks hay không.
- **B — Ước lượng bằng công cụ phoneme (eSpeak-ng / CMU dict):** dùng khi không lấy được
  timepoints thật từ TTS provider, chia đều thời lượng audio theo số âm tiết ước lượng — kém
  chính xác hơn nhưng đơn giản, không phụ thuộc provider.

### 3.2. Bảng tra phoneme → viseme (tĩnh, không cần AI)

Dùng bộ 12-15 viseme chuẩn (Preston Blair hoặc Oculus visemes), lưu 1 file JSON tra cứu tĩnh
trong `src/data/` hoặc `api/_lib/`, ví dụ nhóm chính: `PP` (p/b/m), `FF` (f/v), `TH` (th),
`AA`/`E`/`OO` (nguyên âm mở/tròn môi), `REST` (miệng nghỉ giữa câu). Tiếng Việt cần bảng riêng
vì có thanh điệu và âm khác tiếng Anh — cần bảng phoneme→viseme tách theo `direction`
(`lib/direction.ts`) tương tự cách app đã tách giọng theo chiều học.

### 3.3. Asset hình miệng

- 12-15 ảnh PNG/SVG, ghép 1 sprite sheet duy nhất (ước lượng 50-100KB tổng, tải 1 lần/cache mãi).
- Cần thiết kế/mua asset avatar phù hợp phong cách app (theme hiện tại: 4 theme, xanh đêm mặc
  định) — đây là việc **thiết kế UI**, không phải việc kỹ thuật, cần quyết định riêng.

### 3.4. Render frontend

- Component React mới (ví dụ `AvatarSpeaking.tsx` trong `src/components/`), nhận `audioUrl` +
  `visemeTimeline: {viseme: string; startMs: number; endMs: number}[]`.
  - Phát audio qua `<audio>` hiện có (tái dùng logic TTS playback đã có trong Luyện nói).
  - `requestAnimationFrame` hoặc `setInterval` ~30fps đọc `audio.currentTime`, tra viseme hiện
    tại, đổi ảnh miệng tương ứng — không cần canvas phức tạp, CSS `background-position` trên
    sprite sheet là đủ.

### 3.5. Backend

- Hàm mới `textToVisemeTimeline(text, direction)` chạy khi tạo audio (cùng lúc gọi `/api/tts`),
  trả kèm timeline trong response — không tính lại mỗi lần phát (đã cache theo audio).
- Nếu dùng cách A (SSML marks): sửa `api/tts.ts` để chèn mark + đọc `timepoints` từ response
  Google TTS. Nếu dùng cách B: thêm phụ thuộc `espeak-ng` trên VPS hoặc dict tĩnh.

### 3.6. Cử động tay (đề xuất bổ sung — làm sau viseme, không làm cùng đợt)

Người dùng hỏi thêm: có nên thêm cử động tay cho avatar tự nhiên hơn không? **Trả lời: hợp lý,
cùng triết lý nhẹ-băng-thông như viseme — nhưng nên làm SAU khi viseme miệng đã chạy ổn, không
gộp chung 1 đợt** (tránh phình phạm vi, đúng nguyên tắc chia nhỏ ở mục 3 CLAUDE.md).

Cách làm khả thi, vẫn theo hướng "animation 2D ghép sẵn" chứ không AI-generate:

- **Không đồng bộ theo lời nói** (đơn giản nhất): vài cử chỉ tay lặp lại ngẫu nhiên/định kỳ khi
  avatar đang "nói" (audio đang phát) — ví dụ nghỉ tay, đưa tay nhẹ, gật đầu — chỉ cần 3-5 sprite
  tư thế tay, đổi ngẫu nhiên mỗi vài giây trong lúc audio phát, dừng khi audio dừng. Chi phí gần
  như 0 (không cần phân tích văn bản/audio thêm), tái dùng đúng cơ chế `setInterval` đã có ở 3.4.
- **Đồng bộ nhẹ theo ngữ điệu** (nâng cao hơn, làm nếu cách trên chưa đủ tự nhiên): dùng biên độ
  âm lượng audio (Web Audio API `AnalyserNode`, chạy hoàn toàn ở trình duyệt, không cần backend)
  để tăng tần suất/biên độ cử chỉ khi giọng nói to/nhấn — không cần dữ liệu timing mới từ server.
- **Không nên:** map cử chỉ tay theo ngữ nghĩa câu nói (kiểu "nói số thì giơ ngón tay") — cần
  NLP/AI phân tích câu, phức tạp và dễ sai, không đáng effort cho lợi ích thẩm mỹ tăng thêm.

Asset cần thêm: vài sprite tư thế tay/cánh tay (ước lượng thêm 20-50KB, cùng cơ chế cache vĩnh
viễn như sprite miệng ở 3.3) — vẫn là việc thiết kế UI cần làm riêng, không phải AI tự tạo được.

**Kết luận:** khả thi, effort nhỏ nếu chọn cách "không đồng bộ theo lời nói", nên xếp là bước 4
(sau khi PoC + tích hợp viseme miệng ở mục 5 đã xong và được xác nhận ổn).

## 4. Việc CẦN đọc code thật trước khi ước lượng effort chính xác

Tài liệu này KHÔNG khẳng định các điểm sau — phải đọc code lúc triển khai:

- `api/tts.ts` hiện gọi Google TTS REST hay SDK nào, có hỗ trợ SSML input + timepoints không.
- Cấu trúc cache audio (`api/_lib/fileStorage.ts`) có chỗ lưu kèm metadata JSON (timeline) không,
  hay chỉ lưu file audio.
- `src/pages` nào đang render UI Luyện nói (để biết cắm `AvatarSpeaking` vào đâu).

## 5. Đề xuất phạm vi triển khai (nếu được duyệt, chia nhỏ theo mục 3 CLAUDE.md)

1. **PoC nhỏ:** 1 câu tiếng Anh cố định, 5 viseme cơ bản, kiểm chứng đồng bộ audio-hình trên
   trình duyệt thật (mobile + desktop) trước khi làm đủ bộ.
2. Nếu PoC ổn: mở rộng bảng viseme đầy đủ (EN + VI riêng theo `direction`), tích hợp vào chế độ
   Luyện nói song ngữ.
3. Đo lại băng thông/hiệu năng thực tế (Lighthouse, kích thước JSON timeline theo câu dài) trước
   khi coi là xong — đối chiếu ngân sách Core Web Vitals ở mục 4 CLAUDE.md.
4. **(Tuỳ chọn, sau khi 1-3 ổn)** Thêm cử động tay kiểu "không đồng bộ theo lời nói" (xem 3.6) —
   bước riêng, có thể bỏ qua nếu avatar chỉ-miệng đã đủ tự nhiên với người dùng thật.

## 6. Rủi ro / điểm cần quyết định trước khi làm

- Google Cloud TTS có tính phí thêm khi bật SSML marks/timepoints không? Cần kiểm tra pricing
  trước khi chọn hướng A.
- Asset hình miệng cần ai thiết kế (không phải việc AI có thể tự bịa ra hình phù hợp thẩm mỹ app).
- Tiếng Việt có thanh điệu — cần xác nhận bảng viseme tiếng Việt có đủ tự nhiên hay cần đơn giản
  hoá (ví dụ chỉ animate theo nguyên âm, bỏ qua thanh điệu ở giai đoạn đầu).
- Đây là tính năng **thêm giá trị trải nghiệm**, không phải lỗi/nợ kỹ thuật — nên xếp độ ưu tiên
  sau các mục nợ kỹ thuật đang mở trong CLAUDE.md mục 13 (đặc biệt thanh toán Pro, Sentry).

## 7. Không làm trong phạm vi PR này

- Không sinh video AI (Wav2Lip/SadTalker/Grok Imagine) — đã loại vì băng thông/chi phí (mục 1).
- Không code component/backend thật — chỉ đặc tả, chờ xác nhận ưu tiên trước khi mở việc triển khai.

---

## [7] Tài liệu: dac-ta-gemini-live-2026-08-21.md

_(Chi tiết nguồn gốc: `dac-ta-gemini-live-2026-08-21.md`)_

# Đặc tả nghiên cứu: tích hợp Gemini Live API vào chế độ Luyện nói

> Ngày: 2026-08-21 · Nhánh: `claude/gemini-live-integration-xo175x` · Trạng thái: **NGHIÊN CỨU — chưa code, chờ người dùng duyệt hướng đi**.

## 1. Gemini Live là gì, khác pipeline hiện tại ra sao

**Hiện tại** (chế độ 3 — Luyện nói song ngữ, `src/pages` Speaking + `api/stt.ts` + `api/tts.ts`):

```
Ghi âm (MediaRecorder) → /api/stt (Whisper Groq/OpenAI) → text
  → /api/agent (Claude/Gemini/Groq text) → 2 câu trả lời (hội thoại + sửa lỗi)
  → /api/tts (Google Cloud TTS) × 2 lần, 2 giọng khác nhau → phát audio
```

3 bước tuần tự, độ trễ cộng dồn (STT ~1-2s + LLM ~1-3s + TTS ~1-2s), nhưng **kiểm soát được từng bước** — đặc biệt là tách được 2 giọng (giọng đích cho hội thoại, giọng mẹ đẻ cho sửa lỗi/giải thích) vì TTS gọi riêng cho từng đoạn text.

**Gemini Live API**: 1 kết nối **WebSocket song công** (WSS) duy nhất tới Gemini — client gửi audio stream liên tục, server Google tự làm STT + suy luận + TTS **bên trong mô hình**, trả về audio ngay khi có (không đợi câu nói xong hẳn), hỗ trợ **barge-in** (ngắt lời AI giữa chừng), độ trễ mục tiêu là "gần real-time" (dưới ~1s), không có bước "text ở giữa" mà ứng dụng kiểm soát trực tiếp.

## 2. Vấn đề cốt lõi: đặc trưng "2 giọng" của sản phẩm

Đây là điểm khác biệt phải giữ của app (CLAUDE.md mục 1): hội thoại bằng **giọng ngôn ngữ đích**, sửa lỗi/giải thích bằng **giọng tiếng mẹ đẻ**. Một phiên Live chỉ cấu hình **1 giọng cố định** cho toàn phiên (chọn từ 30 giọng HD có sẵn, đặt lúc mở kết nối) — model không tự chuyển giọng giữa chừng theo ngữ cảnh nội dung.

→ Không thể thay thế 1:1 pipeline hiện tại bằng 1 phiên Live duy nhất mà giữ được tính năng lõi.

**3 phương án khả thi, xếp theo mức xáo trộn kiến trúc:**

| Phương án                                              | Cách làm                                                                                                                                                         | Ưu                                                                                                          | Nhược                                                                                                                      |
| ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| **A. Không đổi kiến trúc, chỉ thay STT**               | Dùng Live API kiểu "chỉ nghe" (nhận audio → trả text, tắt output audio) thay Whisper, giữ nguyên LLM text + TTS Google 2 giọng như cũ                            | Rủi ro thấp, không phá tính năng 2 giọng                                                                    | Không tận dụng được lợi ích chính của Live (độ trễ thấp, barge-in) — gần như phí Live để làm việc mà Whisper đã làm rẻ hơn |
| **B. 2 phiên Live song song**                          | 1 phiên Live giọng đích cho hội thoại, 1 phiên Live giọng mẹ đẻ cho sửa lỗi, đồng bộ tay                                                                         | Có barge-in + độ trễ thấp cho cả 2 luồng                                                                    | Phức tạp cao: 2 WebSocket, chi phí gần gấp đôi, đồng bộ 2 audio stream dễ lệch/rối UI                                      |
| **C. Live cho hội thoại, giữ pipeline cũ cho sửa lỗi** | Hội thoại chính (nói qua nói lại) chạy qua Live (1 giọng đích, có barge-in); phần sửa lỗi/giải thích vẫn lấy transcript rồi gọi `/api/agent` + `/api/tts` như cũ | Cân bằng: có trải nghiệm real-time cho phần hội thoại (giá trị UX rõ nhất), giữ nguyên cơ chế 2 giọng đã có | Vẫn phải chạy 2 hệ thống song song trong cùng 1 tính năng, tăng độ phức tạp code                                           |

**Đề xuất cá nhân: Phương án C**, thử nghiệm trước ở dạng tính năng phụ (ví dụ nút "Chế độ real-time" riêng trong Luyện nói), không thay thế luồng cũ ngay — để so sánh trải nghiệm + chi phí thật trước khi quyết định thay hẳn.

## 3. Chi phí (tra ngày 2026-08-21, xem lại trước khi triển khai vì giá đổi thường xuyên)

- Live API: **$3/1M token audio input, $12/1M token audio output** — quy đổi ~25 token/giây audio ⇒ khoảng **$0.037/phút hội thoại 2 chiều**.
- So với hiện tại: Whisper (Groq free/rẻ) + Claude Haiku (rẻ) + Google TTS (theo ký tự, có cache) — ước tính rẻ hơn nhiều lần cho hội thoại ngắn, đặc biệt vì đã có cache TTS vĩnh viễn (không tính lại phí giọng đã phát trước đó).
- Live API **không cache được** theo cách TTS hiện tại (audio sinh ra theo ngữ cảnh hội thoại, không lặp lại y hệt) → mất lợi thế cache đang có.
- Cần bật đếm lượt riêng (giống `stt_count`) nếu dùng thật, tránh vỡ ngân sách Free/Pro.

Nguồn tham khảo giá: [Gemini API Pricing](https://ai.google.dev/gemini-api/docs/pricing), [Gemini 2.5 Flash Native Audio pricing — FutureAGI](https://futureagi.com/llm-cost-calculator/google/gemini-2-5-flash-native-audio-latest/).

## 4. Ràng buộc kỹ thuật khác

- **Không gọi thẳng từ client** — lộ `GEMINI_API_KEY`. Phải làm server proxy WebSocket trong `server.ts` (đúng nguyên tắc mục 4.2 CLAUDE.md: logic nhạy cảm ở server). Việc thêm 1 tầng proxy WS vào Express hiện tại (vốn là HTTP request/response, không có WS) là thay đổi hạ tầng, cần kiểm tra Express + `ws` hoạt động ổn với PM2 cluster mode 3 instances (sticky session cho WebSocket — nếu không cấu hình đúng ở Nginx, client có thể bị route sang instance khác giữa phiên và rớt kết nối).
- Tiếng Việt nằm trong danh sách 70 ngôn ngữ Live API hỗ trợ chính thức — khả thi về mặt ngôn ngữ. (Nguồn: [Live API overview](https://ai.google.dev/gemini-api/docs/live-api).)
- Cần key `GEMINI_API_KEY` riêng hoặc dùng chung key Gemini đã có cho chat text (`GEMINI_CHAT_MODEL` trong `api/_lib/aiConfig.ts`) — kiểm tra hạn mức/billing tách biệt.

## 5. Đề xuất các bước tiếp theo (nếu bạn duyệt Phương án C)

1. **Prototype nhỏ, tách biệt hoàn toàn khỏi luồng Speaking hiện tại** — 1 endpoint WS thử nghiệm trong `server.ts`, không đụng `api/stt.ts`/`api/tts.ts`, để nghe thử độ trễ/giọng tiếng Việt thật trước khi quyết định đầu tư tiếp.
2. Đo thử chi phí + độ trễ thật, so với pipeline cũ.
3. Nếu ổn: thiết kế UI bật/tắt "Chế độ real-time" trong trang Luyện nói, đếm lượt riêng, migration nếu cần bảng theo dõi.
4. Viết test + cập nhật `PROGRESS.md` theo quy định mục 3 CLAUDE.md (PR = coi như xong, phải cập nhật tài liệu ngay trong PR).

**Việc dừng ở đây chờ bạn quyết định**: chọn Phương án A/B/C, hoặc dừng hẳn (giữ pipeline hiện tại) — đây là quyết định kiến trúc lớn, đúng loại việc CLAUDE.md yêu cầu hỏi trước khi làm (mục 12).

---
