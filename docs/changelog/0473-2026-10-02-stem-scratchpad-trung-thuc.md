# 0473 — Bảng nháp STEM thôi khen sai: bước chưa kiểm được thì nói "chưa kiểm được" (2026-10-02)

- **Ngày:** 2026-10-02 · **PR:** (điền sau khi tạo) · **Loại:** `fix(stem)`.
- **Nối tiếp:** nợ 🔴 "STEM Scratchpad chấm mọi bước là đúng" ghi ở changelog 0470 (đợt rà
  `.agents/skills/` khi tích hợp ECC). Chủ dự án chọn phương án **"Trả 'chưa kiểm được'"**: bước
  không kiểm được thì nói rõ, không khen đúng; giữ các kiểm tra thật.

## Vì sao

Bảng nháp STEM (Bạn Đồng Hành › Thử thách › "Mở Bảng Nháp") có đường vào thật cho mọi người dùng.
Bộ kiểm `StemScratchpadService.validateStep` chỉ nhận ra **bốn lỗi cụ thể**: ô rỗng, lệch ngoặc,
đúng một câu chuyển vế sai dấu (`2x + 5 = 15` → `2x = 15 + 5`), và đúng một phương trình hoá học
chưa cân bằng. Bước nào không rơi vào bốn lỗi đó đều được trả **"Bước biến đổi logic chính xác"**
kèm độ tin cậy 0,95 và nhãn xanh "✓ Hợp lệ" — **kể cả bước sai rõ ràng** như `2x = 15 + 7`.

Đây là lỗi sư phạm: người học tin một bước sai là đúng rồi đi tiếp trên nền sai.

Có thêm một chỗ khen sai thứ hai, lộ ra khi đọc server: nhãn **"ĐÃ GIẢI XONG"** dựa vào **so
chuỗi con** (`latexInput.includes('x = 5')`, `includes('2H_2O')`). Vì vậy `x = 50` vẫn được tính
là giải xong, và `H_2 + O_2 -> 2H_2O` cũng vậy dù chưa cân bằng (4 H bên phải, 2 H bên trái).

## Việc đã làm

### A. Hợp đồng — tách "không thấy lỗi" khỏi "đúng"

`packages/core-contracts/stemScratchpad.ts`:

- Thêm `StepVerdictSchema` với ba giá trị: `valid` (đã chứng minh đúng) · `invalid` (bắt được lỗi
  cụ thể) · `unverified` (không thấy lỗi nhưng cũng không kiểm được).
- `ScratchpadStepValidation` có thêm trường `status` **tuỳ chọn**, nên bước đã lưu trước đợt này
  vẫn đọc được.
- Hàm `ketQuaBuoc(validation)` quyết định nhãn hiển thị. Chỉ ra `valid` khi `status` ghi rõ
  `valid`. Bước cũ không có `status` thì ra `unverified`, vì chính các bước đó từng bị chấm "hợp
  lệ" giả. Dữ liệu mâu thuẫn thì nghiêng về báo lỗi.

### B. Bộ kiểm — nói thật

`packages/core-ai/stemScratchpadService.ts`:

- Bốn nhánh bắt lỗi giữ nguyên, nay gắn thêm `status: 'invalid'`.
- Nhánh mặc định đổi từ "Bước biến đổi logic chính xác" (0,95) thành `status: 'unverified'`,
  độ tin cậy 0, kèm cách tự kiểm: "Hệ thống chưa tự kiểm được bước này. Hãy tự đối chiếu: thay giá
  trị vừa tìm vào đề bài, hoặc kiểm hai vế (và số nguyên tử mỗi nguyên tố nếu là phương trình hoá
  học) có bằng nhau không."
- **Kiểm tra thật duy nhất làm được ngay:** so **nguyên vẹn** đáp số cuối với đáp số đã biết của 3
  đề mẫu mà modal dựng sẵn (`khopDapSo`). Cách so: bỏ khoảng trắng, coi `->`/`→` là
  `\rightarrow`, chỉ lấy vế sau `\implies`/`\Rightarrow` cuối cùng. Khớp thì trả `valid` ("Đúng
  đáp số của đề bài.").
  - Đề Toán và Hoá nhận ra theo phương trình, vì phương trình quyết định đáp số.
  - Đề Vật lý phải khớp cả lời đề, vì công thức `v = a·t` không tự quyết định đáp số.
  - Đề lạ (người gọi API tự tạo) không có đáp số để so, nên không bao giờ ra `valid`.

### C. Server — "giải xong" chỉ khi bộ kiểm khẳng định

`apps/server/src/api/learning/stem-scratchpad.ts`: bỏ ba phép so chuỗi con; nay chỉ đặt
`isSolved = true` khi `validation.status === 'valid'`. Truyền đề bài vào `validateStep` để bộ
kiểm so được đáp số.

### D. Giao diện — ba màu cho ba kết luận

`apps/dhcb/src/components/StemScratchpad/StemScratchpadModal.tsx`: bảng `HIEN_THI_KET_QUA` thay
cho các toán tử ba ngôi lặp lại ba lần.

| Kết luận     | Nhãn                | Màu           |
| ------------ | ------------------- | ------------- |
| `valid`      | ✓ Hợp lệ            | xanh lá       |
| `invalid`    | ✗ Cần chỉnh sửa     | đỏ hồng       |
| `unverified` | ? Chưa tự kiểm được | vàng hổ phách |

Xanh lá giữ đúng nghĩa "đúng" (CLAUDE.md §4.8), nên bước chưa kiểm được không còn bị tô xanh.

## Đổi hai test server — vì kỳ vọng cũ mã hoá chính lỗi đang sửa

`apps/server/src/api/learning/stem-scratchpad.test.ts`:

1. Test "fallback problem creation and solving condition" từng kỳ vọng: gửi `x = 5` **không kèm
   đề** → `isSolved: true`. Server khi đó tự dựng đề từ chính bước gửi lên, tức đề `x = 5` có đáp
   số `x = 5`. Kỳ vọng đó chỉ đúng nhờ phép so chuỗi con. Nay kỳ vọng `isSolved: false` +
   `status: 'unverified'`.
2. Test `submit_solution` tạo đề **không có `problemLatex`** rồi gửi `x = 5`. Nay thêm
   `problemLatex: '2x + 5 = 15'` để đề có đáp số đã biết — giữ nguyên ý test ("đã giải sẵn thì
   submit trả giải xong").

Thêm test mới ở cả ba tầng:

- Bước sai (`2x = 15 + 7`, `x = 100`…) không bao giờ ra `valid`, không có chữ "chính xác/hợp lệ".
- `x = 50`, `2x = 5`, `y = 5` không khớp đáp số `x = 5`.
- Phương trình hoá học chưa cân bằng không được tính là giải xong.
- Đề Vật lý khác lời đề thì không khớp.
- `ketQuaBuoc` cho bước cũ không có `status` ra `unverified`.

## Bằng chứng

- Test liên quan: 8 file / 70 test xanh (`stemScratchpadService`, `stemScratchpad` contract,
  `stem-scratchpad` API, `stemScratchpadApi`, `CompanionStudios`).
- Cổng đầy đủ: xem mô tả PR (typecheck sau `rm -rf packages/*/dist dist dist-server`, lint,
  `test:coverage`).
- **Ảnh chụp trang thật (Tầng 8b)**, dùng Playwright + API giả lập 3 bước (sai / chưa kiểm được /
  đúng đáp số), ở 1440px và 390px, theme Dark blue và Blue sky:
  - Trước: bước sai `2x = 15 + 7` mang nhãn xanh "✓ Hợp lệ".
  - Sau: bước đó mang nhãn vàng "? Chưa tự kiểm được". Bước `x = 5` mới là "✓ Hợp lệ".
  - Ảnh không commit (file nặng, chỉ để đối chiếu trong phiên).

## Phát hiện thêm, CHƯA sửa trong đợt này

1. **Bốn hộp thoại của studio "Thử thách" bị kẹt trong khung studio.** Ảnh 1440px cho thấy hộp
   thoại STEM bị đẩy xuống nửa dưới màn hình, cắt mất phần các bước; nền mờ không phủ sidebar.
   - Nguyên nhân: `StudioLabs` bọc trong `animate-fade-in`. Hoạt ảnh này có `transform` và chạy
     với `both`, nên giữ `transform` sau khi chạy xong. Phần tử cha có `transform` thì
     `position: fixed` của con bám theo cha thay vì màn hình.
   - Bốn hộp thoại bị ảnh hưởng: STEM, PvP (sảnh + trận), Tranh biện trực tiếp.
   - Làm PR riêng ngay sau đợt này: dựng hộp thoại qua `createPortal(…, document.body)` như
     `apps/dhcb/src/components/Modal.tsx`.
2. **`submit_solution` vẫn so chuỗi con** (`finalAnswer.includes(solutionLatex.slice(0, 10))`)
   cho đề lấy từ ngân hàng câu hỏi. Giao diện hiện **không gọi** hành động này (đã grep
   `apps/dhcb/src`), nên chưa có người dùng thấy kết quả sai. Ghi nợ để sửa khi nối ngân hàng đề
   STEM vào giao diện.
3. Bộ kiểm vẫn **chưa chứng minh được bước biến đổi ở giữa** (chỉ biết đáp số cuối của 3 đề mẫu).
   Muốn kiểm thật thì cần bộ giải ký hiệu (ví dụ thay nghiệm vào hai vế, hoặc đếm nguyên tử mỗi
   nguyên tố). Đó là tính năng mới, cần đặc tả riêng.
