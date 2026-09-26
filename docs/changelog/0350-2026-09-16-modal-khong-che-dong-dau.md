# 0350 — 2026-09-16 — Tiêu đề dính của `Modal` không còn che dòng đầu nội dung

- **PR:** [#973](https://github.com/seeker19110/dhcb/pull/973)
- **Nhánh:** `claude/laughing-babbage-o25bls-fix-modal`
- **Loại:** trả nợ kỹ thuật (sửa gốc thay cho hai miếng vá cục bộ)

## Việc đã làm

1. **`apps/dhcb/src/components/Modal.tsx`** — bỏ `-mt-6` ở header dính; khung đổi `p-6` →
   `px-6 pb-6` (dáng `center`) và `p-6 pb-[calc(...)]` → `px-6 pb-[calc(...)]` (dáng `sheet`).
   Khoảng trên nay do chính header mang bằng `pt-6` sẵn có, nên nhìn y hệt cũ mà không còn
   margin âm. `-mx-6 px-6` giữ nguyên để dải nền vẫn chạm hai mép khung.
2. **Gỡ hai miếng vá `pt-6` cục bộ** ở `useOutlinePane.tsx` (S07-2, #944) và
   `ProgrammingLessonPage.tsx` (S08-2, #961) — sửa gốc làm chúng thừa.
3. **`e2e/modal-sticky-header.spec.ts`** (mới) — cổng chặn CI, 5 ca.

## Bằng chứng

**Chồng lấn đo bằng Chromium thật** (`header.bottom − nộidung.top`, dương = bị che), ở trạng
thái chưa cuộn:

| Ca đo                        | Trước | Sau |
| ---------------------------- | ----- | --- |
| center @1440                 | 24    | 0   |
| center @390                  | 24    | 0   |
| center @320 (tiêu đề 2 dòng) | 24    | 0   |
| center dài @1440             | 24    | 0   |
| center dài @390              | 24    | 0   |
| center dài @320              | 24    | 0   |
| sheet @390                   | 24    | 0   |
| sheet @320                   | 24    | 0   |

Dáng `sheet` tái hiện **đúng con số S07-2 từng ghi** (nội dung 211,6px · đáy tiêu đề 235,6px) —
xác nhận phép đo này đo đúng thứ hai đợt trước đã thấy.

**Phát hiện mới từ ảnh — chỗ hỏng THỨ BA chưa ai biết.** Hộp thoại trụ Sự nghiệp có ô nhập đầu
tiên **không có nhãn nhìn thấy được**, vì nhãn nằm trọn trong 24px bị che:

- "Thêm Mục Tiêu Sự Nghiệp": mất nhãn `Chức danh / Mục tiêu (*)`
- "Thêm Kinh Nghiệm Làm Việc": mất cả hai nhãn `Công ty (*)` và `Vai trò / Chức danh (*)`

Sau khi sửa, cả ba hiện đủ, và mọi thứ bên dưới giữ nguyên toạ độ (hộp thoại chỉ ngắn lại 24px
ở phía trên — đúng 24px trước đây bị chiếm rồi che đi).

**Gỡ miếng vá không gây hồi quy:** ảnh panel Mục lục @390 trước/sau cho khoảng cách tiêu đề →
ô tìm kiếm y như cũ; tấm sheet ngắn lại 24px nên hiện thêm được một dòng ("Chương 4").

**Cổng mới không xanh giả:** đặt lại `-mt-6` → 3 ca `center` đỏ với đúng `Received: 24`; gỡ ra
thì 5/5 xanh.

**Cổng:** typecheck ✅ · lint ✅ 0 cảnh báo · `prettier --check .` ✅ · `test:coverage` ✅ 13.634
test xanh, coverage 94,27 / 90,16 / 94,78 / 94,79 (sàn 93/89/93/93) · E2E **534 ca xanh**
(`a11y`, `a11y-aaa`, `outline-stem`, `outline-programming`, `outline-english`,
`mobile-layout-guards`, `programming-lesson`) · `a11y-modals` **25/25 xanh** (15 hộp thoại ×
5 theme + panel sheet).

**Ảnh hưởng lan ra:** `npm run codemap -- impact apps/dhcb/src/components/Modal.tsx` → 18 file,
17 chỗ dùng `<Modal>` trong 6 file. Mẫu đại diện đã chụp phủ cả hai `variant`, hộp ngắn, hộp dài
phải cuộn, và ba bề rộng.

## Quyết định

- **Sửa gốc, không vá lần ba.** Hai lần trước đều chọn vá cục bộ với lý do "20 hộp thoại khác
  đang dựa vào khoảng đệm hiện tại". Đo thật cho thấy điều đó không đúng: cả 20 hộp đều đang bị
  che 24px như nhau, chỉ khác là hai chỗ có người nhìn kỹ nên vá, còn lại thì chịu.
- **Bỏ padding trên của khung thay vì thêm `pt` cho `children`.** Cách sau vẫn để margin âm nằm
  đó cho người sau vấp lại, và đẩy phần bù vào một chỗ mà người đọc `Modal.tsx` không thấy.
- **Test là E2E chứ không phải RTL.** Lỗi này không tồn tại trong jsdom: nó cần bố cục thật.
  Test theo text vô dụng ở đây — DOM luôn đủ chữ và `toBeVisible()` luôn đúng.

## Rollback

Revert PR. Không migration, không đổi dữ liệu, không đổi API. Revert xong hai miếng vá `pt-6`
quay lại và bẫy quay lại nguyên trạng (bao gồm cả ba nhãn bị che).
