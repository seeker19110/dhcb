# Audit UI/UX theo chuẩn 2026 — WCAG 2.2 (ISO/IEC 40500:2025) · EN 301 549 v4.1.1 · bố cục · 2026-09-30

> **Audit chỉ đọc và đo**, không sửa code (QUY-TRINH-AUDIT §1.2). Nhánh
> `claude/audit-ui-ux-chuan-2026`, gốc `46bea64` (đã gồm PR #1191). Script đo và **1.067 ảnh chụp
> nằm ngoài repo** (scratchpad phiên), repo giữ kỷ luật 0 file PNG. Mọi con số dưới đây đọc từ máy
> đo, không ước lượng.
>
> Khác hai lần audit 2026-09-22 (`2026-09-22-danh-gia-sau-ui-ux.md`,
> `2026-09-22-danh-gia-toan-dien-ui-ux-lan-2.md`) ở ba điểm: (1) chạy trên **backend thật** chứ
> không phải màn lỗi/màn rỗng giả; (2) đo theo **tiêu chí của chuẩn mới nhất**, không chỉ axe;
> (3) chấm **bố cục theo 5 lớp cửa sổ** (6 bề rộng) thay vì 2 bề rộng.

## 0. Tóm tắt cho chủ dự án

**Kết luận: nền kỹ thuật khoẻ, nhưng app CHƯA đạt WCAG 2.2 mức AA trên toàn bộ trang.** Cổng a11y
hiện tại xanh là thật, nhưng nó chỉ quét một nhóm trang và quét trên **dữ liệu giả/màn lỗi**. Lượt
này dựng Postgres + Redis + bản build production trong container, đăng ký một người dùng thật qua
giao diện, rồi quét **toàn bộ 61 route của app + 2 trang hub** — lộ ra những thứ cổng không thể
thấy.

**Tốt, cần giữ (đều có số đo):** 0 lỗi JavaScript trên ~1.500 lượt tải trang · 0 tràn ngang ở 6 bề
rộng trên 60/61 route · 0 hoạt ảnh CSS còn chạy khi bật "giảm chuyển động" (61/61 route) · 0 phần
tử mất dấu tiêu điểm hoặc bị che hoàn toàn khi Tab · liên kết "Bỏ qua tới nội dung chính" hoạt
động · 49/63 trang đạt axe A/AA ở cả 3 theme × 2 bề rộng · phần lớn chữ tính bằng `rem` nên theo
được cỡ chữ người dùng chọn.

**8 lỗi mức critical (chặn người dùng hoặc trượt tiêu chí A/AA):**

| #   | Lỗi                                                                                                                | Tiêu chí                                | Phạm vi                                  |
| --- | ------------------------------------------------------------------------------------------------------------------ | --------------------------------------- | ---------------------------------------- |
| C1  | Viền focus bàn phím chỉ **2,65:1** (Blue sky — theme mặc định) và **2,70:1** (Nhi đồng), cần ≥ 3:1                 | 1.4.11 AA (Understanding) · 2.4.13 AAA  | mọi phần tử bấm được, 2/3 theme          |
| C2  | Toast (117 chỗ gọi `toast.error`) **không được trình đọc màn hình đọc** và tự tắt sau 4 giây                       | 4.1.3 AA · 2.2.1 A                      | 49 file                                  |
| C3  | Form đăng nhập/đăng ký/đặt lại mật khẩu/hub: không `<label>`, không `autocomplete`, lỗi không được đọc             | 1.3.5 AA · 3.3.2 A · 4.1.3 AA · 4.1.2 A | 4 form quan trọng nhất                   |
| C4  | **14 trang** vi phạm axe AA khi có dữ liệu thật — không trang nào nằm trong cổng; kể cả **nút mua "Nâng cấp VIP"** | 1.4.3 AA · 4.1.2 A · 2.1.1 A            | `/welcome`, Hồ sơ, Bạn bè, 3 trang STEM… |
| C5  | Giao diện tiếng Anh vẫn `<html lang="vi">`; câu tiếng Anh trong bài học không có `lang="en"`                       | 3.1.1 A · 3.1.2 AA                      | chiều B + mọi bài hội thoại              |
| C6  | Hub (trang đích công khai) **tràn ngang ở 320/390px** — nút "Đăng nhập/Bắt đầu" thò ra tới 584px                   | 1.4.10 AA · 2.4.11 AA                   | hub                                      |
| C7  | App cài đặt (PWA) khoá **dọc** (`"orientation": "portrait"`)                                                       | 1.3.4 AA                                | mọi người cài app                        |
| C8  | 13 route dùng chung một `document.title` mặc định (còn ghi "Sự nghiệp · Khởi nghiệp · Đời sống" — trụ đã gỡ)       | 2.4.2 A                                 | 11 component trang                       |

**Ba phát hiện quan trọng nhất ngoài a11y:** (1) thanh bên luôn ghi "Free · Nâng cấp" trong khi
**mọi người dùng hiện tại là VIP vĩnh viễn** (ưu đãi 2026 tài khoản đầu), còn trang giá vẫn mô tả
hạn mức Free **cũ** ("+5 lượt/ngày, tối đa 35/7 ngày" thay vì 30 lượt/ngày) — nói sai về gói ở chỗ
nhạy cảm nhất; (2) hợp đồng hạn mức giữa server (`{free: 30, vip: 300}`) và client (theo từng chế
độ) đã lệch, không có Zod chặn, nên trang Tiến độ hiện **"0/"** thiếu mẫu số — và mock E2E vẫn dùng
hình dạng cũ nên không cổng nào thấy; (3) bản tin Bạn Đồng Hành ở Trang chủ đếm **2 "mục tiêu trọng
tâm" thuộc hai trụ đã xoá** (Đời sống, Sự nghiệp) và có chuỗi ngày **gán cứng = 3**.

**Bố cục:** ổn ở điện thoại dọc và 1440px; **gãy ở 1024–1279px** (ba cột ép cột chính còn ~424px,
hẹp hơn cả máy tính bảng 768px) và **gần như không dùng được ở điện thoại ngang / phóng to 200–400%**
(thanh cố định chiếm 39–60% khung nhìn).

Đếm: **8 critical · 22 major · 14 minor.** Đề xuất 9 đợt sửa ở mục 12, đợt 1–3 làm được ngay
không cần quyết định sản phẩm.

## 1. Khung tiêu chuẩn áp dụng (xác minh bằng nguồn sống ngày 2026-09-30)

| Chuẩn                                | Trạng thái tới 30/09/2026                                                                                                                             | Dùng trong audit này                                                                                     |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| **WCAG 2.2** = ISO/IEC 40500:2025    | Khuyến nghị W3C (10/2023, cập nhật 12/2024); ISO thông qua 21/10/2025. **Vẫn là chuẩn hiện hành.**                                                    | Tiêu chí đạt/trượt chính: A + AA toàn app; AAA (7:1) cho chữ nội dung theo CLAUDE.md §4.5                |
| **EN 301 549 v4.1.1**                | ETSI phát hành 02/09/2026; căn theo WCAG 2.2 A/AA, bỏ 4.1.1, **thêm điều 9.7 "User preferences"** cho web. Dự kiến thành chuẩn hài hoà (EAA) 12/2026. | Đo riêng điều 9.7: cỡ chữ người dùng chọn, chế độ tương phản cưỡng bức (forced colors), giảm chuyển động |
| **WCAG 3.0**                         | Working Draft 10/09/2026; CR dự kiến Q4/2027, Recommendation không sớm hơn 2028. Thuật toán tương phản (APCA) **chưa chốt**.                          | Chỉ tham khảo hướng đi, **không** dùng để chấm trượt                                                     |
| **Core Web Vitals** (web.dev)        | LCP ≤ 2,5 s · INP ≤ 200 ms · CLS ≤ 0,1 ở phân vị 75. (Vài blog 2026 nói "LCP 2,0 s" — không phải nguồn chính thức.)                                   | Đo LAB trên bản build (mục 9) — không đo được production, xem mục 2                                      |
| **Material 3 — window size classes** | compact < 600 · medium 600–839 · expanded 840–1199 · large 1200–1599 · extra-large ≥ 1600 (dp)                                                        | Khung chấm bố cục: 320/390 (compact), 768 (medium), 1024 (expanded), 1440 (large), 1920 (XL)             |
| Vùng chạm                            | WCAG 2.5.8 AA: 24×24 CSS px (hoặc đủ giãn cách); 2.5.5 AAA: 44×44; Apple HIG 44pt; Material 48dp                                                      | 24px là sàn cứng; **44px là luật dự án** cho vùng chạm trên mobile                                       |
| Luật riêng của dự án                 | CLAUDE.md §4 (AA/AAA, token màu, 44px, mobile-first) · skill `ui-ux` §9–11 (độ dài dòng ≤ 75ch, focus hiện tức thì, không `transition-all`…)          | Chấm song song với chuẩn quốc tế                                                                         |

## 2. Cách làm và giới hạn

- **Hệ thống thật trong container:** `npm run build` → Postgres 16 tạm (áp 89/89 migration) +
  Redis + `node dist-server/server.js`. Một tài khoản **đăng ký qua giao diện thật** rồi đi hết
  onboarding thật (mục 8). Tài khoản đầu tiên của DB mới được hệ thống cấp **"Người tiên phong —
  VIP vĩnh viễn"** — đúng tình trạng của mọi người dùng production hiện tại (2026 suất đầu).
- **Phạm vi:** 61 route có giao diện riêng trong `App.tsx` (7 trang khách + 54 trang đăng nhập) + 2
  trang hub (`apps/hub`). Mỗi route: 6 bề rộng × theme mặc định; axe A/AA + AAA-chữ-nội-dung ở
  390/1440 × 3 theme; Tab 30–45 lần ở 390/1440; giảm chuyển động; forced colors; cỡ chữ trình duyệt
  16→24px; giãn chữ WCAG 1.4.12; phóng to 200%/400% và điện thoại ngang.
- **Khối lượng:** ~1.500 lượt tải trang, 1.067 ảnh. Công cụ đo tự viết (Playwright + axe-core
  4.x + CDP), không cài phụ thuộc mới vào repo.
- **Giới hạn phải nói rõ:**
  - **Không tới được production** — chính sách mạng của môi trường chặn `www.`/`en-vi.`/`hub.donghanhcungban.org`
    (proxy trả 403). Nên Tầng 8 (CWV thật) vẫn N/A; mục 9 là số LAB. Chạy `npm run cwv:prod` từ máy
    có mạng để có số thật.
  - Không có trình đọc màn hình/thiết bị thật; axe chỉ bắt được khoảng 30–50% lỗi WCAG — phần còn
    lại đo bằng máy tự viết (mục 3) và bằng mắt trên ảnh.
  - Dữ liệu học là của **người mới** (rỗng). Màn có dữ liệu dày (Kanban đầy thẻ, lịch sử dài) chưa
    chấm.
  - Máy chủ tạm của lượt đo bị tắt giữa chừng một lần (giới hạn thời gian nền); 75 lượt đo trúng
    khoảng đó đã được **đo lại toàn bộ 4 route** liên quan (84 lượt, 0 lỗi) — số trong báo cáo là số
    sau khi đo lại.

## 3. Bảng điểm theo tiêu chí

| Tiêu chí                                              | Kết quả                                                                                                                                                        |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| axe A/AA (3 theme × 390/1440)                         | **49/63 trang đạt**; 14 trang trượt (C4, C6)                                                                                                                   |
| AAA chữ nội dung ≥ 7:1 (chính sách dự án)             | 54/63 đạt; 9 trang còn 1–6 phần tử 5,2–6,98:1                                                                                                                  |
| 1.4.11 / 2.4.13 tương phản viền focus                 | **Trượt** ở Blue sky (2,65) và Nhi đồng (2,70); đạt ở Xanh đêm (7,4)                                                                                           |
| 2.4.7 focus nhìn thấy · 2.4.11 không bị che hoàn toàn | 3.557 điểm dừng Tab: 0 bị che hoàn toàn trên app; chỉ ô soạn code CodeMirror không có chỉ báo ngoài con trỏ; hub 390px có 3 phần tử bị đẩy ra ngoài khung (C6) |
| 2.1.2 không bẫy bàn phím                              | Đạt (0 bẫy)                                                                                                                                                    |
| 2.4.1 bỏ qua khối lặp                                 | Skip link đúng ở 52/61 route; **9 route skip link trỏ vào đích không tồn tại**, 4 route không có `<main>`                                                      |
| 2.4.2 tiêu đề trang                                   | **Trượt** 13 route (C8); 3 kiểu hậu tố khác nhau                                                                                                               |
| 1.3.4 hướng màn hình                                  | **Trượt** khi cài PWA (C7)                                                                                                                                     |
| 1.3.5 mục đích ô nhập                                 | **Trượt** ở form đăng ký/đăng nhập/đặt lại/hub (C3)                                                                                                            |
| 1.4.4 / 9.7 cỡ chữ người dùng chọn                    | Root đổi 16→24px đúng; **0–87% chữ bị khoá px** tuỳ trang (M5)                                                                                                 |
| 1.4.10 reflow 320px                                   | App đạt trừ `/action-canvas` (tràn 23px); **hub trượt** (C6)                                                                                                   |
| 1.4.12 giãn chữ                                       | 16 route có chữ bị cắt thêm khi giãn (M21)                                                                                                                     |
| 2.2.2 dừng chuyển động · 2.3.3 giảm chuyển động       | CSS đạt 61/61; **mũi tên nảy vô hạn ở mọi trang mobile** (M2); avatar canvas không nghe "giảm chuyển động" (M3)                                                |
| 2.5.8 vùng chạm 24px                                  | Đạt axe; **182 ô lịch 16×16px ở Tiến độ ≥ 1024px** (M7 — axe bỏ sót)                                                                                           |
| Luật dự án 44px (mobile)                              | 23/61 route có đích < 44px ở 390px; nặng nhất `lo-trinh/a1` 69/116 (M20)                                                                                       |
| 3.1.1 / 3.1.2 ngôn ngữ                                | **Trượt** (C5)                                                                                                                                                 |
| 4.1.3 thông báo trạng thái                            | **Trượt** (C2); 53/61 trang không có vùng `aria-live` nào khi tải                                                                                              |
| Forced colors (EN 301 549 9.7)                        | Dùng được; icon trắng trên nền màu biến mất, nút chính mất khung (M4)                                                                                          |

## 4. Phát hiện CRITICAL

Mỗi phát hiện theo khuôn 4 ô của skill `ui-ux` §10.B (Lỗi · Ở đâu · Mức · Sửa), thêm dòng bằng chứng.

### C1 · Viền focus không đủ tương phản ở theme mặc định

- **Lỗi:** WCAG 1.4.11 AA (Understanding SC 1.4.11 coi viền focus là "thông tin nhận diện trạng
  thái") và 2.4.13 AAA; skill `ui-ux` §10.A.4.
- **Ở đâu:** `apps/dhcb/src/index.css:221-228` (`outline: 2px solid rgb(var(--a-500))`) +
  `packages/core-ui/theme.css:128` (Blue sky `--a-500` = sky-500) và `:168` (Nhi đồng = orange-500).
- **Bằng chứng:** tính theo công thức WCAG: viền trên nền trang Blue sky **2,65:1**, trên thẻ trắng
  2,77:1; Nhi đồng **2,70:1**; Xanh đêm 7,4:1. Lượt Tab đo thật (Blue sky, 61 route + hub, 390 và
  1440px): **3.203/3.557 điểm dừng** có viền 2,53–2,67:1; phần còn lại dùng `ring` (box-shadow).
- **Mức:** critical — người dùng bàn phím mất dấu vị trí ở theme mà **mọi người mới** đều thấy.
- **Sửa:** thêm token `--focus-ring` theo theme (Blue sky = `--a-700` → 5,68:1; Nhi đồng =
  orange-800) dùng cho `outline-color`, kèm test đơn vị tính tương phản viền × nền trang × nền thẻ
  cho cả 3 theme (khuôn `apps/dhcb/src/lib/themeContrast.test.ts`).

### C2 · Toast không được đọc và tự biến mất

- **Lỗi:** 4.1.3 Status Messages (AA); 2.2.1 Timing Adjustable (A).
- **Ở đâu:** `packages/core-ui/ToastProvider.tsx:56` (`setTimeout(remove, 4000)`) và vùng chứa ở
  `:84` không có `role`/`aria-live`. Dùng ở 49 file, **117 lời gọi `toast.error`**.
- **Bằng chứng:** 53/61 trang đo được **không có vùng `aria-live` nào** khi tải; toast được thêm vào
  DOM rồi gỡ sau 4 giây, không dừng khi rê chuột/focus.
- **Mức:** critical — lỗi (mất mạng, lưu thất bại) chỉ tồn tại dưới dạng toast → người dùng trình
  đọc màn hình không bao giờ biết; người đọc chậm/dùng kính lúp không kịp đọc.
- **Sửa:** vùng chứa `role="status" aria-live="polite"`, toast lỗi `role="alert"`; dừng hẹn giờ khi
  hover/focus; lỗi không tự tắt (hoặc ≥ 10 giây + theo độ dài câu). Một chỗ sửa cho cả 117 lời gọi.

### C3 · Form xác thực: thiếu nhãn, thiếu `autocomplete`, lỗi không được đọc

- **Lỗi:** 1.3.5 Identify Input Purpose (AA) · 3.3.2 Labels or Instructions (A) · 4.1.3 (AA) ·
  4.1.2 Name, Role, Value (A); bổ trợ 3.3.8 Accessible Authentication (AA) vì trình quản lý mật khẩu
  dựa vào `autocomplete`.
- **Ở đâu:** `apps/dhcb/src/pages/core/Login.tsx:309-386` (0 `<label>`, 0 `autoComplete`, 0
  `aria-invalid`), khối lỗi `:407` không có `role="alert"`; `ResetPassword.tsx` và
  `apps/hub/src/pages/HubLogin.tsx` cùng khuôn. Hai nút "Đăng nhập | Đăng ký" không có
  `aria-pressed`/`role="tab"` → trình đọc màn hình không biết đang ở chế độ nào.
- **Bằng chứng:** nhìn ảnh 390px: nhãn chỉ là placeholder ("Tên của bạn", "Email", "Mật khẩu (ít nhất
  15 ký tự)") — **luật 15 ký tự biến mất ngay khi gõ ký tự đầu**.
- **Mức:** critical — đây là cổng vào của mọi người dùng; phễu hiện rớt 80% ở đoạn đăng ký → học phiên
  đầu (PROGRESS.md).
- **Sửa:** `<label>` hiện (hoặc floating label), `autoComplete="name|email|current-password|new-password"`,
  dòng gợi ý mật khẩu cố định nối `aria-describedby`, lỗi `role="alert"` + `aria-invalid`, hai nút chế
  độ thành `aria-pressed`. Giữ nguyên luật 15 ký tự (khớp NIST SP 800-63B-4).

### C4 · 14 trang trượt axe AA khi có dữ liệu thật — ngoài cổng

| Trang                                            | Vi phạm (theme)                                                  | Phần tử gây lỗi                                                                                          |
| ------------------------------------------------ | ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `/welcome`, `/learn-vietnamese`                  | color-contrast × 3 (Blue sky, Nhi đồng)                          | đoạn "Điểm khác biệt" `text-zinc-300` — xem M13 (đảo màu hai lần)                                        |
| `/reset-password`                                | color-contrast (Blue sky, Nhi đồng)                              | nút "Về trang đăng nhập" `text-accent-400` (2,05:1)                                                      |
| `/trang-ca-nhan`, `/nhiem-vu`                    | color-contrast × 2 (Blue sky, Nhi đồng)                          | mã mời trong `<code>`                                                                                    |
| `/ban-be`                                        | color-contrast (**cả 3 theme**)                                  | nút "Copy link kết bạn" chữ trắng trên `bg-accent-500` (2,77 / 2,43:1)                                   |
| `/goc-hoc-tap/{mathematics,physics,chemistry}`   | color-contrast (Blue sky, Nhi đồng)                              | tab đang chọn "AI Giải Bài Tập"                                                                          |
| `/goc-hoc-tap/programming/lo-trinh/principal-ai` | color-contrast **× 32** + **select-name (critical)** (mọi theme) | 32 dòng "Mở bài kiểm" `text-[11px] text-accent-400`; `<select>` không nhãn                               |
| `…/chay-thu`, `…/du-an` (390px)                  | scrollable-region-focusable                                      | vùng cuộn CodeMirror `tabindex="-1"` — không cuộn được bằng bàn phím                                     |
| `/nang-cap`, Hồ sơ — **tài khoản Free**          | color-contrast (Blue sky, Nhi đồng)                              | **nút mua "Nâng cấp VIP"**: `bg-amber-500 text-zinc-900` — `zinc-900` tự đảo thành chữ sáng ở theme sáng |
| hub, hub `/login`                                | color-contrast × 9; link-name                                    | chữ "Bắt đầu"; logo-link không tên                                                                       |

- **Mức:** critical (AA). **Gốc chung:** dùng `text-accent-400/500` làm màu chữ, hoặc chữ trắng
  trên `bg-accent-500`, ở theme nền sáng (a-400 2,05:1 · a-500 2,65:1; chữ trắng trên a-500 2,77:1).
- **Sửa:** sửa từng chỗ + **đưa 14 trang vào `e2e/a11y.spec.ts` với mock đúng hình dạng dữ liệu
  thật** (mục 11 giải thích vì sao cổng hiện tại không thấy).

### C5 · Ngôn ngữ trang và ngôn ngữ của đoạn

- **Lỗi:** 3.1.1 Language of Page (A) · 3.1.2 Language of Parts (AA).
- **Ở đâu:** `apps/dhcb/src/context/LangProvider.tsx` không bao giờ đặt `document.documentElement.lang`
  (index.html cố định `lang="vi"`); `LandingEn.tsx` (toàn trang tiếng Anh) không có `lang="en"`.
- **Bằng chứng (máy đo "chữ tiếng Anh nằm trong vùng lang=vi"):** bài hội thoại
  `…/english/bai-hoc?lesson=1` **20 câu**; `/lo-trinh/a1` 5 mẫu ngữ pháp; danh sách truyện 8 tiêu đề;
  `/learn-vietnamese` 5 đoạn (trang dành cho người nước ngoài nhưng thanh điều hướng đáy vẫn "Trang
  chủ · Học · Ôn tập · Tôi").
- **Mức:** critical cho một **app học ngoại ngữ**: trình đọc màn hình đọc câu tiếng Anh bằng giọng
  và luật phát âm tiếng Việt; chiều B (người nước ngoài) nghe cả giao diện bằng giọng Việt.
- **Sửa:** `LangProvider` đặt `html[lang]` theo ngôn ngữ UI; mọi khối chữ tiếng Anh (lượt thoại, ví
  dụ, mẫu câu, tiêu đề truyện) bọc `lang="en"`; thêm phép đo này vào E2E (heuristic ở mục 11).

### C6 · Hub tràn ngang ở điện thoại

- **Lỗi:** 1.4.10 Reflow (AA); kéo theo 2.4.11 (phần tử nhận focus nằm ngoài khung).
- **Ở đâu:** `apps/hub/src/App.tsx` — cụm nút đầu trang "Đăng nhập · Bắt đầu".
- **Bằng chứng:** `scrollWidth − clientWidth` = **194px ở 390px**, mép phải cụm nút 584px; lượt Tab ở
  390px có 3 phần tử nhận focus nhưng **0% diện tích nằm trong khung** ("Đăng nhập", "Xem trụ Học
  tập", "Trò chuyện với Bạn Đồng Hành"). Trang cao 10.144px (12 màn).
- **Mức:** critical — trang đích công khai, người mới trên điện thoại thấy trang lệch ngang.
- **Sửa:** cụm nút xuống dòng/ẩn chữ ở < 480px; thêm hub vào `mobile-layout-guards.spec.ts`.

### C7 · PWA khoá hướng dọc

- **Lỗi:** 1.3.4 Orientation (AA) — không có lý do "thiết yếu" cho app học.
- **Ở đâu:** `apps/dhcb/public/manifest.webmanifest:9` (`"orientation": "portrait"`).
- **Mức:** critical cho người dùng cài app (máy tính bảng gắn cố định trên xe lăn, bàn phím ngoài).
- **Sửa:** xoá dòng đó (hoặc `"any"`).

### C8 · Tiêu đề trang dùng chung và lỗi thời

- **Lỗi:** 2.4.2 Page Titled (A).
- **Ở đâu:** 11 component không gọi `usePageTitle`: `Notes.tsx`, `SubjectDetail.tsx`,
  `CefrLevelPage.tsx`, `StoryReader.tsx`, `ProgrammingSpecializationPage.tsx`,
  `ProgrammingSpecStagePage.tsx`, `ProgrammingCoursePage.tsx`, `ProgrammingPathPage.tsx`,
  `ProgrammingPathDiagnostic.tsx`, `ProgrammingLevelPage.tsx`, `ProgrammingLessonPage.tsx`.
- **Bằng chứng:** 13 route cùng tiêu đề `"Đồng Hành Cùng Bạn — … | Học tập · Sự nghiệp · Công việc ·
Khởi nghiệp · Đời sống"` (lấy từ `apps/dhcb/index.html:17-20`); các trang còn lại dùng 3 kiểu hậu tố
  khác nhau (`| Đồng hành cùng bạn`, `· Đồng hành cùng bạn`, không hậu tố ở trang STEM).
- **Sửa:** gọi `usePageTitle` ở 11 trang, sửa tiêu đề mặc định; test canh: mỗi route có tiêu đề
  riêng, cùng một khuôn hậu tố.

## 5. Phát hiện MAJOR

### Khả năng tiếp cận và tuỳ chọn người dùng (EN 301 549 §9.7)

- **M1 · Thanh cố định chiếm 39–60% khung nhìn khi phóng to / xoay ngang** — 1.4.10 AA (rủi ro),
  1.4.4. `BottomNav.tsx:54-75` + `index.css:54-62` (`--bnav-h` = 5,25rem + ≥12px + dải 2rem). Đo sau
  khi cuộn: **43%** ở 200% (640×360), **60%** ở 400% (320×256), **39%** điện thoại ngang (844×390)
  trên 52/61 route. Ảnh: `lo-trinh/a1` ngang chỉ còn ~205px cho nội dung. **Sửa:** `@media
(max-height: 500px)` → thanh đáy gọn 56px, ẩn dải Reachability, header không dính.
- **M2 · Mũi tên "Reachability" nảy vô hạn ở mọi trang mobile** — 2.2.2 Pause, Stop, Hide (A, rủi
  ro), skill §9.B.6. `BottomNav.tsx:71,73` (`animate-bounce`). Dải 32px `touch-action: none` phía
  trên thanh đáy chặn cả thao tác cuộn bắt đầu từ đó. **Sửa:** mũi tên tĩnh (hoặc gợi ý một lần),
  cân nhắc tắt tính năng mặc định.
- **M3 · Avatar Bạn Đồng Hành chạy vòng `requestAnimationFrame` vô hạn, bỏ qua "giảm chuyển động"** —
  2.3.3 AAA, pin/CPU. `Companion3D/CyberTutorAvatar3D.tsx:262-266` (thở, liếc, chớp mắt). Mặc định
  "Nhân vật 3D" ở desktop. **Sửa:** khung tĩnh khi `prefers-reduced-motion`, dừng khi tab ẩn/ra khỏi
  khung nhìn.
- **M4 · Forced colors (chế độ tương phản cao của Windows)** — EN 301 549 9.7, 1.4.11. Icon trắng/đen
  đặt trên nền gradient **biến mất** (nút tròn "Đồng Hành" ở thanh đáy, ô icon các thẻ tính năng Tiếng
  Anh); nút chính không có viền nên mất hình nút. **Sửa:** `border border-transparent` cho nút,
  icon dùng `currentColor`, biến thể `forced-colors:` cho 3–4 thành phần chung.
- **M5 · Chữ khoá px không theo cỡ chữ người dùng chọn** — EN 301 549 v4.1.1 §9.7. Đổi cỡ chữ mặc
  định của trình duyệt 16→24px: root đổi đúng, nhưng tỉ lệ nút chữ **giữ nguyên cỡ** là: đọc truyện
  **87%**, Action Canvas 67%, Chạy thử code 54%, Góc học tập 51%, Luyện tập 48%, Lập trình 35%, Bạn
  Đồng Hành 34%, bài hội thoại 30%. Gốc: `.read-body { font-size: 15px }` (`index.css:403-404` —
  chính cỡ chữ của **nội dung đọc**) và **529** `text-[Npx]` (489 là `text-[11px]`). **Sửa:** đổi
  sang `rem` (0,9375rem / 0,6875rem) — việc cơ học; test CSS cấm `font-size` px mới.
- **M6 · Lịch hoạt động ở Tiến độ: 182 nút 16×16px** — 2.5.8 AA (trừ khi chứng minh ngoại lệ
  "thiết yếu"). `ActivityCalendarCard.tsx:223` (`isDesktop ? 'w-4 h-4' : 'w-11 h-11'`). axe không bắt
  vì ô dùng roving tabindex. **Sửa:** ô 24px ở desktop hoặc danh sách ngày tương đương có vùng chạm
  đủ.
- **M7 · Bỏ qua khối lặp gãy ở 9 route; 4 route không có `<main>`** — 2.4.1 (A). Skip link trỏ
  `#noi-dung-chinh` không tồn tại ở: `/login`, `/reset-password`, `/bat-dau`, `/nang-cap`,
  `/tin-nhan`, `/avatar-demo`, **Trò chuyện**, **Luyện nói**, Chạy thử code. Trò chuyện và Luyện nói
  **vừa gãy skip link vừa không có `<main>`** — người dùng bàn phím phải Tab qua ~39 mục thanh bên.
  **Sửa:** mọi trang có `<main id="noi-dung-chinh">` (đặt trong `PageShell`/layout full-screen).

### Trung thực dữ liệu và hợp đồng (nói sai với người dùng)

- **M8 · Thanh bên ghi cứng "Free · Nâng cấp"** — `DesktopSidebar.tsx:393`. Mọi người dùng thật hiện
  là VIP vĩnh viễn (0080), nên ở 1440px **cùng một màn** có "Free · Nâng cấp" (thanh bên) và "Bạn đang
  dùng gói VIP" (`/nang-cap`). Trang `/nang-cap` của VIP chỉ có một dòng — không hạn dùng, không lượt
  đã dùng, không quyền lợi. **Sửa:** đọc gói từ phiên; VIP hiện "VIP vĩnh viễn".
  - **Trang giá (tài khoản Free) nói sai hạn mức Free:** "+5 lượt AI/ngày có học từ mới…, dồn tối đa
    35 lượt trong 7 ngày" — đó là cơ chế **đã bỏ** ở GĐ1 (2026-09-12, `packages/core-billing/usage.ts:40-45`);
    thực tế Free được 30 lượt/ngày. Chữ này đến từ dòng seed của migration
    `postgres/migrations/0025_plan_marketing.sql` qua `/api/plan-marketing` và **ghi đè** chữ đã sửa
    trong `UpgradeSection.tsx` (changelog 0289). Cùng trang vẫn còn thuật ngữ "14 giọng **Chirp3-HD**"
    (P0-2 lần 2 chưa đóng hết). **Cần chủ dự án:** kiểm bảng `plan_marketing_bullets` trên production.
- **M9 · Hợp đồng hạn mức server ↔ client đã lệch** — server `/api/app-settings` trả
  `limits: {free: 30, vip: 300}` (một con số tổng, sau GĐ1); client `apps/dhcb/src/lib/appSettings.ts:55`
  vẫn kiểu `Record<Plan, Record<UsageMode, number>>` và `:76` (cả `:39` khi đọc cache) ép kiểu **không Zod** (trái CLAUDE.md
  §4.1). Hệ quả đo được: Tiến độ hiện **"0/"** (thiếu mẫu số) ở Chat/Nói/Viết; 16 chỗ đọc hạn mức theo
  chế độ (`getLimits()[plan].speaking`, `limit.chat`…) đang nhận `undefined`. Mock E2E (`e2e/helpers/auth.ts:17-25`)
  vẫn hình dạng cũ nên **mọi cổng xanh**. **Sửa:** schema Zod = hợp đồng server, UI hiện "x/300 lượt
  hôm nay", sửa mock.
- **M10 · Bản tin Trang chủ dựng trên trụ đã xoá + số gán cứng** —
  `packages/core-personal/proactiveBriefingService.ts:40-112`. "Hôm nay bạn có **2 mục tiêu trọng
  tâm**…" = 1 mục trụ `life` (route `/life`) + 1 mục trụ `career` (route `/career`), cả hai đã xoá
  2026-09-20; `streakDays = 3` gán cứng; `srsDueCount = 5` khi đọc DB lỗi; người mới 0 thẻ nhận
  "**Tuyệt vời!** Bạn đã hoàn thành toàn bộ thẻ ghi nhớ hôm nay" ngay dưới câu "hãy bắt đầu với thẻ
  từ vựng". **Sửa:** chỉ đếm việc thật của Học tập/Ghi chú; không khen khi chưa có hành động.
- **M11 · Action Canvas dựng sẵn 5 thẻ bịa gán cho người dùng** —
  `packages/core-personal/actionCanvasService.ts:9-158`: thẻ "CAREER"/"LIFE" (trụ đã xoá), người thực
  hiện "You", thuật ngữ "Holodeck Panel Mock", "Full-Duplex 3D", "Focus Score 85+". Người mới thấy như
  kế hoạch của chính mình. **Sửa:** màn rỗng có hướng dẫn, hoặc mẫu ghi rõ "Ví dụ".
- **M12 · Siêu dữ liệu công khai lỗi thời/sai** — `apps/dhcb/index.html`: `<title>`, `description`,
  `og:description`, JSON-LD vẫn "năm trụ"; FAQ JSON-LD hứa "nâng cấp **gói Pro** để dùng không giới
  hạn" (gói Pro đã xoá, VIP là 300 lượt/ngày); hub `index.html` và `manifest.webmanifest` cùng lỗi.
  4 `preconnect` tới `api.groq.com`, `api.openai.com`, `api.anthropic.com`, `api.sentry.io` mà client
  **không bao giờ gọi** (gọi AI ở server) → tốn kết nối lúc tải trang và lộ lượt truy cập cho bên thứ
  ba. **Sửa:** cập nhật chữ, xoá 4 preconnect.
- **M13 · Theme: trang đích đảo màu hai lần; theme mặc định lệch giữa HTML và JS** — `Landing.tsx:87`,
  `LandingEn.tsx:81` dùng `theme-light:bg-white text-zinc-900` trên token **đã tự đảo** (CLAUDE.md
  §4.5 đã cảnh báo `text-white`/`bg-white`) → ở Blue sky trang đích thành nền tối + chữ mờ (lỗi AA ở
  C4) cạnh thanh bên/nav sáng. `index.html` đặt `data-theme="dark-blue"` + `theme-color #0e1726`,
  manifest `#09090b`, trong khi mặc định là Blue sky → nhá nền tối trước khi JS chạy và splash PWA
  màu đen. Lần đầu vào không theo `prefers-color-scheme` của máy.
- **M14 · Tải ngầm 23,5 MB dữ liệu cho MỌI người vào lần đầu** — `apps/dhcb/src/main.tsx:41-58` +
  `lib/dataPrecache.ts`. Đo: trang chủ **khách** phát **315 yêu cầu `/data/*` trong 6 giây** đầu;
  309 file = 23,5 MB (≈ 4,8 MB gzip qua `gzip_static`). Không kiểm `navigator.connection.saveData`,
  không kiểm mạng đo dung lượng, không có giao diện cho người dùng biết/tắt. **Sửa:** chỉ tải sau
  khi đăng nhập + đã học ít nhất một phiên, tôn trọng Save-Data, có công tắc "Tải để học ngoại
  tuyến" ở Cài đặt.

### Nội dung học và ngôn từ

- **M15 · Lý thuyết STEM: ~461 "tiêu đề" VIẾT HOA nằm trong đoạn văn** — 1.3.1 (A). Chuỗi
  `'ĐỊNH NGHĨA SỰ RƠI TỰ DO:\n'` trong `packages/subject-{physics,chemistry,biology}/lessons/*.ts`
  (Lý 201 · Hoá 97 · Sinh 163) hiển thị như chữ thường viết hoa, không phải `<h3>`; chỉ số dưới viết
  thô `v_o`, `t_1`, `t_2` (~130 chỗ ở Lý). **Sửa:** bộ dựng lý thuyết chuyển dòng "CHỮ HOA:" thành
  `<h3>` viết thường có dấu + hiển thị chỉ số dưới — một chỗ sửa cho cả 294 bài.
- **M16 · Thuật ngữ nội bộ, mã enum, lộn xộn chữ hoa** —
  - Góc học tập in nguyên giá trị enum cho người học: "Chế độ chấm: **rubric ielts, rubric ai,
    discrete check**", "**exact formula, step analysis**", nhãn `LANGUAGE`/`STEM`/`UNIVERSITY`
    (`pages/learning/Subjects.tsx:412`); hàng này lặp **4 lần** trên cùng màn.
  - "**Mesh: ap-southeast-1**" (vùng AWS) ở đầu Bạn Đồng Hành (`MeshTelemetry/RealtimeTelemetryBar.tsx:37`).
  - "Elo", "Ôn SRS", "Karaoke Text", "Audio IPA", "Streak", "Simulators", "PoC", "Copy link".
  - ~50 chuỗi Viết Hoa Mỗi Chữ Kiểu Tiếng Anh ("Gia Sư Tiếng Anh Song Ngữ", "Danh Sách Công Việc") và
    70 nhãn chữ hoa giãn cách (skill §9.C.9 cấm thêm) — tiếng Việt chuẩn là viết hoa chữ đầu câu.
  - 97 truyện ghi nguồn "**Opus dịch tay** 2026" — nếu là bản dịch máy thì chữ "dịch tay" sai sự
    thật; tên mô hình là thuật ngữ nội bộ.
  - **Sửa:** mở rộng `UiNoise.design.test.ts` (đã có) với danh sách từ cấm + luật viết hoa.
- **M17 · Hệ thống thiết kế gần như không được dùng** — `Button` dùng **12 lần** so với **847**
  `<button>` tự khai lớp; `PageShell` ở 49/95 file trang; màu nút chính khác nhau theo trang (sky,
  emerald, blue-600, rose, amber — ví dụ Luyện tập có 2 CTA đỏ và cam cạnh nhau; Ghi chú dùng
  blue-600 lệch accent); 11 bề rộng nội dung khác nhau ở 1440px (448 → 1152px); 176 `transition-all`
  làm **viền focus hiện dần trong 200ms** (skill §10.A.1/A.4, đo được: viền 0px → 2px sau ~200ms).
  **Sửa:** 4 biến thể nút + 3 bề rộng container chuẩn, chuyển dần theo trang có lưu lượng cao.

### Bố cục và luồng

- **M18 · Dải 1024–1279px (Material "expanded") bị ép** — Trang chủ ở 1024px: thanh bên 256 + cột
  chính **~424px** + cột phải 288 → cột chính **hẹp hơn máy tính bảng 768px** (736px), placeholder ô
  hỏi bị cắt, hàng gợi ý tràn khỏi cột. Bài học STEM/Lập trình ở 1024px có **3 tầng điều hướng**
  (cây thanh bên + mục lục môn + "Trong bài"). **Sửa:** dưới 1280px thu thanh bên thành rail icon
  (đã có chế độ thu gọn) hoặc đưa cột phải xuống dưới cột chính.
- **M19 · Người mới: các màn nói ngược nhau ngay sau onboarding** — chọn "Tiếng Anh · Cơ bản · Giao
  tiếp hàng ngày · 10 phút" xong: Trang chủ "Hôm nay: **Bắt đầu: Chọn môn**" (hỏi lại môn); Trò chuyện
  mặc định "**Phỏng vấn xin việc**"; Tiếng Anh home "**Tiếp tục** học ngay" + "0 / **50** từ vựng"
  (chọn 10 phút); Ôn tập "không có gì đến hạn — **quay lại ngày mai**" với người chưa học gì; mở bài
  1 xong mục "Tiếp tục" trỏ **Bài 2**.
- **M20 · Vùng chạm < 44px trên mobile (luật dự án, 2.5.5 AAA)** — 23/61 route. Nặng nhất:
  `lo-trinh/a1` 69/116 (`<summary>` cao 20px, chip phần 30px), truyện 23 (chip lọc 30px), chẩn đoán
  lộ trình 24 (radio **13×13px**), Cài đặt 21 (công tắc 44×24, nút giọng 34px), Bạn Đồng Hành 12
  (nút avatar 30px), thanh công cụ bài hội thoại cao 20–24px ("EN / EN+VI / VI"), ô tìm Kanban cao
  20px.
- **M21 · Giãn chữ 1.4.12 cắt chữ** — 1.4.12 AA. Khi áp khoảng cách chữ/dòng theo WCAG, số phần tử
  **mới bị cắt**: `lo-trinh/a1` 10, Hồ sơ 6, Action Canvas 4, Tiếng Anh home 4, Trang chủ khách 2,
  Luyện tập 2, Lập trình home 2, 9 trang khác 1 (16 route). Gốc: `truncate`/`line-clamp` trên mô tả thẻ.
- **M22 · Trang rất dài, dòng rất dài, lặp** (Tầng 8b câu 1–2): chi tiết hướng Web **12.118px** ở
  390px (14,4 màn) với dòng **143 ký tự** ở 1440px; lộ trình `principal-ai` **11.523px** (13,7 màn) với
  "Bài kiểm sau chặng — Mở bài kiểm" lặp **32 lần**; chặng hướng Web 7.703px; `lo-trinh/a1` 6.229px.
  Dòng > 80 ký tự ở Lập trình home (114), Giới thiệu (98), 14 hướng (98), lộ trình (100). Luật
  `.read-measure` chưa áp cho trang Lập trình.

## 6. Phát hiện MINOR

1. Nhảy cấp tiêu đề h1 → h3/h4 ở 12 trang (h1 ẩn, tiêu đề thấy được đầu tiên là h3).
2. "Từ điển" mở mặc định tab thẻ ghi nhớ, ô tra từ nằm sau tab — tên và nội dung lệch nhau.
3. Hai liên kết quay lại cùng đích ở trang cấp CEFR (header "← Lộ trình CEFR" và "‹ Lộ trình A1 → C2").
4. Hai nơi cùng tên "Câu thông dụng" (trang riêng và tab trong Luyện nghe); header "Nghe" nhưng thanh
   bên "Luyện nghe".
5. `/avatar-demo` (PoC) mở cho mọi người; lỗi chính tả "**bàn** đang hoàn thiện".
6. Cờ quốc gia làm biểu tượng ngôn ngữ ở Cài đặt (🇻🇳 → 🇺🇸).
7. Trang khách gọi `/api/auth?action=me` + `/api/profile` → 2 lỗi 401 trong console mỗi lần tải.
8. Tên sản phẩm lệch: header "Gia sư AI", trang đăng nhập/hub "Đồng Hành Cùng Bạn", PWA "Đồng Hành AI".
9. Mobile có hai lối vào Bạn Đồng Hành cách nhau ~700px (nút header + nút tròn thanh đáy).
10. Hub dùng font hệ thống thay vì Inter của app; `scroll-behavior: smooth` không có nhánh giảm
    chuyển động.
11. `/welcome` hiện thanh bên của app ("Hồ sơ", "Tiến độ", "Free · Nâng cấp") cho khách.
12. Trang môn Toán/Lý/Hoá mở mặc định tab "AI Giải Bài Tập" trước bài học (câu hỏi sư phạm).
13. Cài đặt vẫn gộp "ngôn ngữ giao diện + chiều học" trong một nút — goal S04 đã chốt tách ba khái
    niệm (câu hỏi sản phẩm).
14. Ô chat mobile hiện "(Enter để gửi)" và bị cắt chữ; bàn phím điện thoại không có nghĩa "Enter
    gửi".

## 7. Bố cục theo 5 lớp cửa sổ (Material 3) — nhận xét từ ảnh

| Lớp (bề rộng đo)   | Điều hướng                | Nhận xét                                                                                                                                    |
| ------------------ | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Compact (320, 390) | thanh đáy 5 mục + header  | Tốt ở dọc: 1 cột, CTA chính trong màn đầu ở Trang chủ/Tiếng Anh. Kém: vùng đáy chiếm ~128px (15% màn 844px); ở 320×568 Trang chủ cần 3 màn. |
| Medium (768)       | vẫn thanh đáy             | Thẻ kéo giãn hết 736px, chữ ngắn → khoảng trống trong thẻ lớn; M3 gợi ý navigation rail + 2 cột ở lớp này.                                  |
| Expanded (1024)    | thanh bên 256px xuất hiện | **Điểm gãy** (M18): 3 cột ép cột chính.                                                                                                     |
| Large (1440)       | thanh bên + cột phải      | Đọc được; cột phải Trang chủ trống từ y≈250px; nhiều nút chính kéo dài hết cột (1.078–1.098px) — mẫu của mobile.                            |
| Extra-large (1920) | như 1440                  | Trang chủ giãn tới 1.568px còn các trang khác giữ ~1.120px → bề rộng không nhất quán; không trang nào dùng thêm cột ở XL.                   |

Entropy thiết kế ở 1440px (máy đếm trên từng trang): cỡ chữ khác nhau trung vị 5 (tối đa 8, Hồ sơ)
— thang chữ ổn; màu chữ trung vị 6 (tối đa **17**, Ứng dụng thực tế); bo góc trung vị 4 (tối đa 7);
bóng đổ trung vị 2 (tối đa 7, Bạn Đồng Hành). Nhịp khoảng cách dọc Trang chủ không theo thang
(12px → ~70px → ~45px giữa các khối liền nhau).

## 8. Hành trình người mới (backend thật, 390×844)

Khách vào `/` → trang đăng nhập → tab Đăng ký → 3 ô → onboarding 5 lựa chọn (môn · nhóm tuổi · trình
độ · mục tiêu · số phút) → Tiếng Anh home: **13 lần chạm** từ trang đăng nhập, không có nút "Bỏ qua"
trong onboarding; vị trí nút "Tiếp theo" nhảy giữa các bước (653 → 683 → 671 → 618px) vì nội dung
căn giữa theo chiều dọc; nút chọn số phút không có `aria-pressed` (nút nhóm tuổi thì có —
`Onboarding.tsx:229` vs `:405`). Trang chủ khách không có liên kết "Đăng nhập" hiện chữ — người cũ
đổi máy phải đoán nút tròn "K". Với phễu đang rớt 80% ở đoạn này, đây là nơi nên đo tiếp (sự kiện
`onboarding_step_view` đã có).

## 9. Hiệu năng LAB (bản build production, gzip như nginx, Slow 4G + CPU chậm 4×)

Điều kiện gần preset mobile của Lighthouse: 390×844, DPR 2, RTT 150 ms, 1,6 Mbps, CPU chậm 4×,
bộ nhớ đệm trống, chặn service worker; trung vị 3 lượt. **Đây là số LAB, không phải số người dùng
thật** (không đo được production — mục 2). TBT là đại diện của INP trong lab.

| Trang                    | FCP (ms) |  LCP (ms) | CLS   | TBT (ms) | Truyền tải | Yêu cầu | Phần tử LCP                              |
| ------------------------ | -------: | --------: | ----- | -------: | ---------: | ------: | ---------------------------------------- |
| Trang chủ (khách)        |    2.224 | **3.916** | 0     |       47 |     833 KB |     105 | lời chào Bạn Đồng Hành                   |
| Đăng nhập                |    2.244 | **3.328** | 0     |        1 |     783 KB |     106 | dòng chú thích cuối thẻ                  |
| Trang chủ (đã đăng nhập) |    4.516 | **5.328** | 0,052 |       48 |     880 KB |     117 | câu "Hôm nay bạn có 2 mục tiêu…" (M10)   |
| Tiếng Anh home           |    4.564 | **6.284** | 0     |       65 |     878 KB |     114 | mẹo huy hiệu                             |
| Lộ trình A1              |    4.524 | **4.524** | 0     |        0 |     840 KB |     115 | nhãn "Trang chủ" ở thanh đáy             |
| Từ điển                  |    4.572 | **6.648** | 0     |       40 |   1.000 KB |     110 | mốc từ vựng                              |
| Bài Vật lí (có hoạt ảnh) |    4.576 | **6.064** | 0     |       68 |     862 KB |     126 | đoạn lý thuyết (M15)                     |
| Bài Lập trình            |    4.588 | **4.588** | 0     |       83 |   1.110 KB |     127 | nhãn "Trang chủ" ở thanh đáy (JS 722 KB) |
| Tiến độ                  |    4.532 | **5.508** | 0     |      141 |     832 KB |     112 | câu tuần này                             |
| Bạn Đồng Hành            |    4.548 | **6.036** | 0,027 |       76 |     841 KB |     116 | lời chào                                 |

- **CLS và TBT đạt** trên mọi trang (CLS ≤ 0,052; TBT ≤ 141 ms) — bố cục ổn định, luồng chính
  không bị khoá lâu.
- **LCP trượt 2,5 s ở mọi trang** trong điều kiện này. Hai điểm đáng làm trước:
  1. **Trang đã đăng nhập vẽ khung đầu tiên chậm gấp đôi trang khách** (FCP ~4,5 s so với ~2,2 s).
     Cấu trúc: mọi route bọc `AllowGuest`/`RequireAccount` (`App.tsx:169-198`) trả `<PageLoading />`
     cho tới khi `AuthProvider` nhận xong `/api/auth?action=me` — tức thời gian khứ hồi xác thực nằm
     trên đường găng của FCP (waterfall ở dòng dưới). Hướng sửa: dựng khung layout + header ngay,
     chỉ chờ xác thực ở vùng nội dung; bỏ lượt `session-from-cookie` khi đã có cờ phiên.
  2. **~200–300 KB dữ liệu JSON** tải ngay lúc mở trang (cột "Fetch" trong số đo từng trang) cộng
     với M14 (23,5 MB tải ngầm sau `load`).
- Waterfall trang chủ đã đăng nhập (đo riêng): `POST /api/auth` (nạp phiên từ cookie) rồi mới tới
  `GET /api/auth?action=me` chạy **2.050 → 4.424 ms**, và FCP xảy ra ngay sau đó (4.548 ms) — xác
  nhận nút thắt nằm ở chuỗi xác thực tuần tự, bị băng thông tranh chấp bởi chunk JS và JSON dữ liệu
  tải cùng lúc. Cùng lượt, `/data/cefr.json` (55 KB) bị tải **hai lần** ở cả khách lẫn người dùng;
  `extra-examples.json` + `form-examples.json` + chỉ mục bài/mẫu câu (~100 KB) tải ngay ở Trang chủ dù
  trang không hiển thị chúng.
- Hub (`apps/hub`, gzip động như nginx): FCP = LCP **1.440 ms**, CLS 0, TBT 0, 127 KB — **đạt**. LCP
  là `<h1>` dựng bằng JavaScript (SPA 382 KB, ~111 KB gzip); dựng sẵn HTML (prerender) sẽ còn nhanh
  hơn nhưng không bắt buộc.

## 10. Hub `apps/hub`

Ngoài C4/C6: trang dài 10.144px ở 390px (12 màn), 6.891px ở 1440px; tiêu đề trang còn liệt kê 3
trụ đã gỡ; logo-link ở `/login` không có tên; font hệ thống thay vì Inter. `DEFAULT_ALLOWED_ORIGINS`
(`packages/core-auth/security.ts:14-19`) **không có** `https://hub.donghanhcungban.org` → đăng nhập
ở hub trả 403 nếu `ALLOWED_ORIGINS` trên VPS không liệt kê hub (runbook bảo mật có nhắc, cần kiểm
tay).

## 11. Vì sao cổng hiện tại không thấy các lỗi trên

1. **Quét dữ liệu giả.** `e2e/helpers/auth.ts` trả `/api/progress` = `{"ok": true}` và app-settings
   hình dạng cũ → trang rơi vào màn lỗi/màn giả; màn **rỗng thật** (ví dụ "Chưa có công việc nào" ở
   Ghi chú, 5,31:1) và màn có dữ liệu không bao giờ được quét.
2. **Danh sách trang cố định.** `a11y.spec.ts` không có `/welcome`, `/learn-vietnamese`,
   `/reset-password`, Hồ sơ, Bạn bè, Nhiệm vụ, trang môn STEM, trang lộ trình Lập trình, hub.
3. **axe có giới hạn cấu trúc:** không biết toast là "thông báo trạng thái", không đo tương phản
   viền focus, bỏ qua vùng chạm có `tabindex="-1"`, không kiểm ngôn ngữ của đoạn, không kiểm
   `document.title` trùng.
4. **Đề xuất cổng mới** (rẻ, chặn đúng loại lỗi đã thấy): (a) test đơn vị tương phản viền focus × 3
   theme; (b) E2E "mọi route có `<main id="noi-dung-chinh">` + tiêu đề riêng"; (c) E2E heuristic chữ
   tiếng Anh ngoài `lang="en"` ở 4 trang bài học; (d) mock E2E đọc chung **schema Zod** với client
   (một nguồn sự thật cho hình dạng dữ liệu); (e) thêm 14 trang ở C4 vào `a11y.spec.ts`; (f) test CSS
   cấm `font-size` bằng px trong code mới.

## 12. Đề xuất chia đợt sửa (mỗi đợt một PR, ảnh trước/sau theo Tầng 8b)

| Đợt | Nội dung                                                                                             | Cần chủ dự án quyết?                     | Ước lượng     |
| --- | ---------------------------------------------------------------------------------------------------- | ---------------------------------------- | ------------- |
| U1  | C1 viền focus + C2 toast + C7 manifest + C8 tiêu đề trang + M7 `<main>`/skip link + cổng (a)(b)      | Không                                    | nhỏ           |
| U2  | C3 form xác thực (app + hub) + C6 hub tràn ngang + hub `link-name`                                   | Không                                    | vừa           |
| U3  | C4 14 trang tương phản + `select-name` + CodeMirror focusable + đưa 14 trang vào cổng (e)            | Không                                    | vừa           |
| U4  | C5 ngôn ngữ (html `lang` + `lang="en"` cho nội dung) + cổng (c)                                      | Không                                    | vừa           |
| U5  | M8 gói trên thanh bên + M9 hợp đồng hạn mức (Zod, "0/", mock) + M10 bản tin + M11 Action Canvas      | **Có** (câu chữ gói, bản tin)            | vừa           |
| U6  | M1 + M2 + M3 + M4 + M5 + M6: tuỳ chọn người dùng (zoom/ngang, chuyển động, forced colors, rem, lịch) | Không (M2: có — tắt Reachability?)       | vừa           |
| U7  | M12 + M13 + M14: siêu dữ liệu, theme mặc định/đảo màu, tải ngầm dữ liệu                              | **Có** (chính sách tải offline)          | nhỏ-vừa       |
| U8  | M15 + M16: tiêu đề STEM + chỉ số dưới, dọn thuật ngữ/chữ hoa + mở rộng `UiNoise.design.test.ts`      | Không                                    | vừa, cơ học   |
| U9  | M17–M22 bố cục: nút/container chuẩn, dải 1024–1279, vùng chạm 44px, trang dài Lập trình, onboarding  | **Có** (onboarding, mặc định Trò chuyện) | lớn, chia nhỏ |

## 13. Phân loại việc

- **AI tự làm được:** toàn bộ U1–U4, U6 (trừ quyết định giữ/bỏ Reachability), U8; phần kỹ thuật của
  U5, U7, U9.
- **Cần chủ dự án:** câu chữ về gói VIP và bản tin (U5); chính sách tải dữ liệu ngoại tuyến (U7);
  có giữ tính năng Reachability không (M2); onboarding rút gọn/"Bỏ qua" (M19, U9); câu hỏi sư phạm
  tab "AI Giải Bài Tập" (minor 12) và tách cài đặt ngôn ngữ/chiều học (minor 13).
- **Cần làm tay trên VPS:** kiểm `ALLOWED_ORIGINS` có hub (mục 10); chạy `npm run cwv:prod` từ máy có
  mạng để có Core Web Vitals thật; muốn phiên AI đo được production thì thêm các host
  `*.donghanhcungban.org` vào danh sách mạng cho phép của môi trường.

## 14. Đã rà và KHÔNG có lỗi (âm tính là bằng chứng)

- 0 `pageerror` trên toàn bộ lượt tải; 0 bẫy bàn phím; trên 3.557 điểm dừng Tab chỉ ô soạn code
  CodeMirror (`/chay-thu`, `/du-an`) không có chỉ báo focus ngoài con trỏ nhấp nháy (so trạng thái
  focus/blur sau khi transition xong, gồm pseudo-element và 3 tổ tiên); 0 phần tử bị che hoàn toàn.
- 0 hoạt ảnh CSS/WAAPI còn chạy dưới `prefers-reduced-motion: reduce` trên 61/61 route — luật chung
  ở `index.css` hoạt động.
- 0 phần tử `forced-color-adjust: none`; không trang nào ẩn nội dung khi bật forced colors.
- 0 tràn ngang ở 6 bề rộng trên 60/61 route app (trừ `/action-canvas` 23px ở 320px).
- Root font đổi đúng 16→24px khi người dùng tăng cỡ chữ; ở 24px không trang nào tràn ngang.
- `<meta viewport>` không còn khoá phóng to (S07a); `user-scalable`/`maximum-scale` không xuất hiện.
- Luyện nghe (P0-1 lần 2) đã có nhóm gập + tìm kiếm + "Tiếp tục"; tab Bạn Đồng Hành đã đổi tên theo
  việc; trang trạng thái rỗng tốt: Ôn tập, Bạn bè, Tin nhắn.
- Mật khẩu tối thiểu 15 ký tự khớp NIST SP 800-63B-4; OAuth 4 nút dùng đúng màu thương hiệu cố định.
- Nhãn "Bản nháp — chưa duyệt chuyên môn" ở bài STEM — trung thực, nên giữ.

## 15. Xu hướng so với các mốc đo cũ (đếm lại bằng máy 2026-09-30)

| Chỉ số (trong `apps/dhcb/src` + `apps/hub/src` + `packages/core-ui`) | Mốc cũ                | Nay                                              |
| -------------------------------------------------------------------- | --------------------- | ------------------------------------------------ |
| `text-[11px]`                                                        | 560 (09-03)           | 489                                              |
| `transition-all`                                                     | 197 (09-05)           | 176                                              |
| `hover:scale-*` (luật: không thêm mới)                               | 56 (09-05)            | **58**                                           |
| File có `animate-pulse`                                              | 29 (09-03)            | 26                                               |
| File có `motion-reduce:`                                             | 5 (09-05)             | 11                                               |
| Bóng màu phát sáng `shadow-<màu>-N`                                  | ~70 (09-03)           | 58                                               |
| Nhãn chữ hoa giãn cách (`uppercase tracking-*`)                      | 54 file (09-03)       | 70 lần                                           |
| `outline-none` không có chỉ báo thay thế trong cùng lớp              | —                     | 83                                               |
| Ngân sách JS khởi đầu (brotli)                                       | 151,60/160 kB (09-22) | **152,41/160 kB (95,3%)** — chạm ngưỡng cảnh báo |
| CSS khởi đầu (brotli)                                                | 23,39/26 kB (09-22)   | 23,87/26 kB (91,8%)                              |
