# 0519 — M17 đợt 8: chữ `text-white` trên nền accent → nền accent đặc + chữ `#09090b` (2026-10-08)

- **Ngày:** 2026-10-08 · **PR:** #1271 · **Loại:** `fix(ui)` · **Nhánh:**
  `claude/peaceful-newton-czolhg`.
- **Nguồn:** phần còn mở của `0518` ("6 nút gradient `from-accent-500 … text-white` tự ghép"). Chủ dự
  án: "tiếp tục tất cả các đợt còn lại".

## Lỗi đo được

`text-white` map sang `--c-white`: ở Xanh đêm là trắng thật, ở Blue sky/Nhi đồng bị đảo thành chữ tối.
Đo tương phản (công thức WCAG, giá trị token trong `packages/core-ui/theme.css`):

| Theme    | `text-white` trên accent-600 | trên accent-500 | `#09090b` trên accent-500 |
| -------- | ---------------------------- | --------------- | ------------------------- |
| Xanh đêm | 3,68 ❌                      | 2,43 ❌         | 8,19                      |
| Blue sky | 4,36 ❌                      | 6,44            | 7,18                      |
| Nhi đồng | 4,87                         | 6,19            | 7,10                      |

Mọi chỗ đều dùng gradient `accent-600 → accent-500`, nên luôn có một đầu trượt AA (4,5:1) ở theme mặc
định hoặc Xanh đêm. Nặng nhất là **bong bóng tin nhắn của người dùng** (chat Tiếng Anh + chat Bạn Đồng
Hành + đàm thoại Studio): đó là chữ NỘI DUNG, luật dự án đòi AAA 7:1. Cổng `e2e/a11y.spec.ts` không bắt
được vì nền là gradient — axe không tính được tương phản trên gradient, xếp vào "incomplete" chứ không
"violation" (vd nút "Đăng nhập" ở `/login` nằm trong 15 trang được quét mà vẫn lọt).

## Đã làm (9 file)

- Bong bóng người dùng (`MessageBubble`, `Chat.tsx`, `StudioDialogue`): gradient → `bg-accent-500
text-[#09090b]` — ≥ 7,10:1 ở cả 3 theme, đạt AAA.
- Nút "Đăng nhập" (`Login`, hub `HubLogin`), "Nhấn để nói" (`StudioDialogue`) → `buttonClass`; nút gửi
  chat (chỉ biểu tượng) → `buttonVariantClass('primary')`.
- Tab "Đàm thoại giọng nói" đang chọn (`StudioDialogue`): gradient chữ trắng → `bg-accent-500
text-black`, khớp tab "Hội thoại văn bản" đứng cạnh.
- Avatar chữ cái ở `Profile` (×2): chữ trắng → `#09090b` (giữ gradient 500 → 400, cả hai đầu ≥ 7,10:1).
- Lớp phủ đếm ngược trên nút gửi chat (`bg-black/40`): `text-white` → `text-[#fff]` — ở theme sáng
  `text-white` bị đảo thành chữ tối, chỉ 2,60–2,70:1; `#fff` đạt 5,99–6,68:1.
- Biểu tượng trên nền gradient ở `LifeSynthesis*` (đang tắt, 501): `text-white` → `text-[#fff]` cho
  thống nhất (biểu tượng chỉ cần 3:1, đạt ở cả 3 theme).
- Cổng `DesignSystem.design.test.ts` (app + hub + packages): (1) 0 chuỗi class ghép nền accent đặc/
  gradient 400–600 với `text-white`; (2) 0 `hover:from-accent-*` (nút gradient tự ghép).

## Bằng chứng

- Cổng mới chạy trên mã cũ (giữ test, cất mã nguồn): **đỏ**, 7 file ở luật (1) + 4 file ở luật (2); mã
  mới: xanh.
- Tầng 8b (1440 + 390px, `blue-sky` + `dark-blue`, trước/sau, so điểm ảnh): `/login` nút "Đăng nhập"
  từ chữ trắng trên gradient cyan (Xanh đêm, mờ) → chữ tối trên cyan đặc, cùng chiều cao; `/trang-ca-nhan`
  avatar đổi màu chữ; `/ban-dong-hanh` chỉ khác giờ hiển thị + quầng sáng động (không do đợt này).

## Sửa sau CI (lượt 2)

CI đỏ ở `e2e/learning-ux-states.spec.ts` (màn tutor, 12 ca: loading/error/feedback × 2 theme × 2 bề rộng):
`color-contrast` **1,2:1** ở dòng giờ `text-zinc-400` NẰM TRONG bong bóng người dùng. Lỗi này có sẵn từ
trước nhưng bị che: trên nền gradient axe không tính được tương phản nên không báo. Nền đặc làm nó lộ ra,
và đây cũng là bằng chứng cho đúng điều đợt này nêu (gradient làm cổng a11y bị mù).

- `StudioDialogue`: dòng giờ đổi màu theo người gửi: bot `text-zinc-400`, người dùng `text-[#09090b]/80`.
- `MessageBubble`: dòng giờ của mình `text-accent-100/80` (chữ nhạt trên nền accent) → `text-[#09090b]/80`;
  nhãn "Đã lọc" hổ phách trong bong bóng của mình → kế thừa màu dòng.
- `#09090b` ở độ mờ 80% trên accent-500: Xanh đêm 6,12 · Blue sky 5,51 · Nhi đồng 5,48 (≥ AA 4,5 cho chữ
  phụ). Chạy lại ở máy: 16/16 ca tutor của `learning-ux-states` xanh.
