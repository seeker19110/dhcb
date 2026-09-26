# 0356 — Quét màu cứng toàn repo + mở rộng cổng tương phản sang thang `zinc`

- **Ngày:** 2026-09-16
- **PR:** [#992](https://github.com/seeker19110/dhcb/pull/992)
- **Bối cảnh:** hai đợt liên tiếp (#981, #984) bị cổng a11y E2E bắt lỗi tương phản do màu
  Tailwind, tức là bắt **sau khi đã lên PR**. Việc này đi tìm phần còn sót và biến nó thành
  cổng tĩnh chặn từ `npm test`.
- **Base:** `main` `4819008e`

## Đã làm

### 1. Chạy công cụ đã có, xác nhận nó không im lặng

`npx tsx scripts/fixed-color-contrast-audit.ts` trên `main` trả **0 vi phạm**. Để chắc đó là
"sạch thật" chứ không phải "công cụ hỏng", tiêm tạm một class `text-zinc-700` vào
`StoryCard.tsx` sau khi mở rộng — công cụ báo đúng `1.18:1`, rồi gỡ ra.

### 2. Tìm khoảng trống thật: thang `zinc` không hề được soi

Công cụ cũ **cố ý bỏ họ `zinc`** với lý do "zinc là token theo theme nên tự đổi màu". Lý do đó
đúng nhưng **không đủ**: token đổi theo theme vẫn có thể không bao giờ đủ tương phản. Đo giá trị
token thật trong `packages/core-ui/theme.css` (thấp/cao nhất trên 3 bề mặt × 5 theme):

| class           | dark-blue | vibrant   | blue-sky  | pink      | kid       | Kết luận       |
| --------------- | --------- | --------- | --------- | --------- | --------- | -------------- |
| `text-zinc-400` | 7.12–8.99 | 7.24–9.17 | 6.88–8.12 | 6.74–7.86 | 6.74–7.78 | đạt AA         |
| `text-zinc-500` | 4.98–6.29 | 4.59–5.81 | 4.59–5.42 | 4.65–5.42 | 4.62–5.33 | đạt AA         |
| `text-zinc-600` | 2.20–2.78 | 2.57–3.25 | 2.08–2.46 | 1.59–1.85 | 1.60–1.85 | **rớt AA hết** |
| `text-zinc-700` | 1.43–1.81 | 1.44–1.83 | 1.20–1.42 | 1.18–1.38 | 1.21–1.40 | **rớt AA hết** |
| `text-zinc-800` | 1.00–1.26 | 1.00–1.27 | 1.00–1.18 | 1.00–1.17 | 1.00–1.15 | **rớt AA hết** |

Đây đúng khuôn lỗi **PR #981**: hỏng **ĐỀU cả 5 theme** (không phải chỉ 3 theme nền sáng như
khuôn màu cứng), nên không cổng nào trong dự án đang canh.

### 3. Sửa 20 chỗ dùng thật (số đo, không đoán)

Tất cả đổi sang token ngữ nghĩa **`text-content-muted`** (= `--z-400`, đã đo 6.74–9.17:1 trên
mọi theme × bề mặt — đúng vai "nhãn/chú thích, chuẩn AA" ghi ở `tailwind.config.js`).

| File                                          | Dòng            | Nội dung                                   |
| --------------------------------------------- | --------------- | ------------------------------------------ |
| `components/admin/AdminPaymentsPanel.tsx`     | 297             | chữ trạng thái "Hoàn tất"                  |
| `components/admin/AdminVipWhitelistPanel.tsx` | 170             | ngày tạo bản ghi                           |
| `components/VoicePicker.tsx`                  | 206             | nhãn giọng bị khoá (chữ THẬT)              |
| `components/FeedbackModal.tsx`                | 210             | sao chưa chọn (biểu tượng mang trạng thái) |
| `components/StoryCard.tsx`                    | 40              | mũi tên                                    |
| `components/programming/LevelMilestones.tsx`  | 158             | mũi tên                                    |
| `pages/domains/work/WorkKanban.tsx`           | 207, 263        | chữ trạng thái RỖNG                        |
| `pages/domains/career/Career.tsx`             | 600             | dấu chấm ngăn cách                         |
| `pages/domains/startup/Startup.tsx`           | 329             | biểu tượng trạng thái rỗng                 |
| `pages/domains/startup/StartupCanvas.tsx`     | 182…459 (9 chỗ) | nút xoá thẻ                                |
| `pages/subjects/english/CommonPhrases.tsx`    | 435             | mũi tên                                    |
| `pages/subjects/english/Listening.tsx`        | 145, 264        | mũi tên                                    |
| `pages/core/History.tsx`                      | 391             | biểu tượng trạng thái rỗng                 |

**KHÔNG thêm mục nào vào `ALLOWLIST`** — allowlist là lối tắt, ở đây sửa được mã thật.

### 4. Mở rộng `scripts/fixed-color-contrast-audit.ts`

- Soi thêm `text-zinc-600/700/800` bằng **giá trị token thật của từng theme** (không phải bảng
  màu Tailwind). Cố ý **không** soi 900/950: đó là thành ngữ "chữ tối trên chip nhấn sáng"
  (`bg-accent-500 text-zinc-950`) mà nền thường nằm ở thẻ CHA — script đọc theo DÒNG không
  phán được, soi sẽ chỉ sinh dương tính giả. Bậc ≤ 500 đã đo là đạt.
- Bỏ qua class có hậu tố độ mờ (`text-zinc-800/80`): một cặp màu đặc không mô tả được phép
  trộn alpha. Đây chính là vòng cung SVG trang trí ở `Dashboard.tsx:153` — nếu soi sẽ báo nhầm.
- Guard nền đặc nhận thêm `bg-accent-<bậc>` và `bg-gradient-to-*` (trước chỉ biết họ màu gốc).

### 5. Bốn ca canh mới ở `scripts/fixed-color-contrast-audit.test.ts`

bắt được 600/700/800 ở đủ 5 theme · không báo nhầm ≤ 500 · bỏ qua hậu tố độ mờ · bỏ qua nền
nhấn/dải màu. Tổng 8 ca, xanh.

## Xét nhưng KHÔNG sửa

- **`apps/dhcb/src/pages/core/Dashboard.tsx:153` `text-zinc-800/80`** — là `stroke` của vòng
  cung SVG nền (trang trí), không phải chữ; lại có độ mờ nên phép đo cặp màu đặc sai bản chất.
- **`apps/dhcb/src/pages/core/Dashboard.tsx:81`
  `bar: 'bg-sky-500', text: 'text-sky-300 theme-light:text-sky-800'`** — thoạt nhìn giống hệt
  khuôn lỗi **#984** (`theme-light:` đè lên nền cố định). ĐÃ kiểm bằng nơi dùng thật: `c.text`
  render ở dòng 605, `c.bar` ở dòng 618 — **hai phần tử khác nhau**, không phải chữ nằm trên
  nền đó. Dương tính giả, giữ nguyên.
- **`apps/hub/src/App.tsx` (~60 chỗ `text-zinc-*`)** — `@dhcb/hub` là app landing RIÊNG, có
  `index.css` riêng và **không có bộ chuyển theme**; thang zinc ở đó không phải cùng hệ token
  với `@dhcb/app`. Đưa nó vào cổng này sẽ so sai bảng màu. Ghi thành nợ mở trong `PROGRESS.md`.
- **`text-zinc-950/900` trên nút nhấn** (~40 chỗ) — nền đặc nằm ở thẻ cha, xem §4.
- **Các biến thể `hover:`/`group-hover:text-zinc-400`** — công cụ cố ý chỉ soi class TRẦN
  (trạng thái nghỉ), giữ nguyên quyết định cũ.

## Kiểm chứng

- `npx tsx scripts/fixed-color-contrast-audit.ts` → **0 cặp rớt AA** (và đã chứng minh công cụ
  bắt được ca hỏng tiêm vào).
- Build ✅ · Typecheck ✅ · Lint ✅ (0 cảnh báo) · Format ✅ · `npm run test:coverage` ✅
  679 file / 14029 ca xanh, coverage 94.03/89.85/94.34/94.59 (trên sàn 93/89/93/93).
- `e2e/a11y.spec.ts` + `e2e/a11y-aaa.spec.ts` (15 trang × 5 theme) ✅.
- Bundle: chỉ đổi tên class CSS, không thêm import — entry chunk `219.38 kB` không đổi.
- **Tầng 8b (nhìn trang thật):** chụp trước/sau 3 trang chạm nhiều nhất
  (`/lich-su` · `/su-nghiep-khoi-nghiep?muc=khoi-nghiep` · `/cong-viec-cuoc-song?muc=cong-viec`)
  × 3 bề rộng 1440/390/320. **Chiều cao `fullPage` giống hệt nhau ở cả 9 cặp**
  (900/900 · 2558/2558 · 1098/1098 · 1193/1193 · 1091/1091 · 1113/1113 …) → không có dịch bố
  cục, chỉ đổi màu điểm ảnh — đúng bản chất "chỉ đổi tên class màu".
