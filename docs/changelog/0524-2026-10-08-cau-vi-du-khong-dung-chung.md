# 0524 — Mỗi câu ví dụ chỉ minh hoạ một mục từ (F11) (2026-10-08)

- **Ngày:** 2026-10-08 · **PR:** (chưa tạo) · **Loại:** `fix(content)`.
- **Nguồn:** phát hiện F11 của `docs/audit/2026-09-14-chat-luong-noi-dung-cac-mon-hoc.md` — "36
  câu ví dụ tiếng Anh bị dùng lại cho nhiều mục từ".

## Vì sao

Hai từ khác nhau minh hoạ bằng đúng một câu ("Please sit down." vừa cho `please`, `down`, vừa cho
`sit`) làm loãng chất lượng cảm nhận, và thường câu đó chỉ minh hoạ đúng MỘT trong hai từ. Các vòng
`cefr-*` chép câu ví dụ thẳng từ từ điển, nên lỗi ở từ điển hiện ra trong bài học.

## Số đo (đo lại trên dữ liệu thật, không dùng số 36 của lượt audit)

Khoá so sánh: câu `ex_en` (bỏ khoảng trắng thừa, viết thường) × mục từ (từ viết thường, từ loại).
Cùng một mục từ lặp ở nhiều chunk/vòng KHÔNG tính.

| Nơi đo                                           | Trước                        | Sau   |
| ------------------------------------------------ | ---------------------------- | ----- |
| Từ điển `public/data/dictionary/chunk-*.json`    | 39 câu / 79 mục              | **0** |
| Vòng từ vựng (`curriculum.json`, 671 vòng)       | 35 câu                       | **0** |
| — trong đó có dính vòng thủ công `curriculum.ts` | 21 (6 câu thủ công–thủ công) | **0** |

Số đo khác 36 vì từ điển đã đổi từ sau lượt audit (thêm/gỡ mục, sinh lại vòng ở 0409/0410).

## Đã làm

- **Từ điển:** viết câu ví dụ MỚI (kèm bản dịch `ex_vi`) cho **52 mục**: 42 mục trùng ngay trong từ
  điển (79 mục − 39 câu giữ lại = 40, cộng 2 vì hai câu "Please sit down." và "She is my best
  friend." minh hoạ đúng nhất cho từ của vòng thủ công `sit`/`best friend`, nên cả hai mục từ điển
  đều nhận câu mới) + 10 mục cefr đang dùng chung câu với một từ của vòng thủ công (`next`,
  `foundation`, `any`, `unique`, `confidently`, `from`, `brush`, `some`, `many`, `weekend`). Câu giữ lại ở mục mà nó minh hoạ đúng nhất (vd "Please sit down." giữ cho `sit`, "Leaves
  fall in autumn." giữ cho `autumn`, "She peeled the potatoes." giữ cho `potatoes`). Sửa tại chỗ
  từng dòng `ex_en`/`ex_vi`, không định dạng lại file.
- **Vòng thủ công `curriculum.ts`:** đổi câu ví dụ của 6 từ trùng giữa hai vòng thủ công (`love`,
  `drink`, `what`, `on`, `friend`, `reading`). Chỉ đổi câu ví dụ CỦA TỪ — danh sách từ và câu mẫu
  của vòng không đổi, nên golden hash `KHONG_DUNG_VONG_THU_CONG` giữ nguyên.
- **Đồng bộ đúng quy trình "chỉ sửa chữ"** (`docs/claude-md-chi-tiet.md` §8):
  `sync-vocab-from-dictionary.ts` (74 trường = 37 từ × 2 ở `cefrA1B2ExtraVocab.json`, 0 ở C1C2) →
  `gen-curriculum-json.ts` (671 vòng, 11 864 từ — không đổi) → `gen-learn-json.ts` (không đổi
  `cefr.json`/`dialogues.json`). KHÔNG chạy lại bộ sinh vòng, nên thành phần vòng và câu mẫu vòng
  (F3) không xáo.
- **Test canh tái phát** `CAU_VI_DU_KHONG_DUNG_CHUNG` trong `apps/dhcb/src/data/vocabQuality.test.ts`,
  hai ca: trên từ điển và trên toàn bộ `FOUNDATION` (bắt cả trùng thủ công ↔ cefr). Danh sách ngoại
  lệ `NGOAI_LE_DUNG_CHUNG` tường minh — hiện rỗng (cặp `modal`/`modal verb`, `potato`/`potatoes`
  cũng được viết câu riêng thay vì miễn trừ). Đã chứng kiến test **ĐỎ** (đặt lại "The sun rises in
  the east." cho `sun`) trước khi tin là xanh.

## Ví dụ trước → sau

| Mục             | Trước                                      | Sau                                                    |
| --------------- | ------------------------------------------ | ------------------------------------------------------ |
| `down` (adv)    | Please sit down.                           | She walked down the stairs slowly.                     |
| `fall` (v)      | Leaves fall in autumn.                     | Be careful, or you will fall on the wet floor.         |
| `brightly`      | The sun shone brightly.                    | Lanterns glow brightly during the Mid-Autumn Festival. |
| `lot` (n)       | I have a lot of homework today.            | There are a lot of motorbikes on the street.           |
| `strange`       | I heard a strange noise.                   | Durian has a strange smell.                            |
| `dioxide`       | Plants absorb carbon dioxide from the air. | Sulfur dioxide from factories pollutes the air.        |
| `next` (adj)    | See you next week.                         | The next bus comes in ten minutes.                     |
| `on` (thủ công) | The book is on the table.                  | Your phone is on the chair.                            |

## Bằng chứng

- Đo trước/sau bằng script tạm ở thư mục nháp của phiên (đọc thẳng `chunk-*.json` và
  `curriculum.json`): 39 → 0 và 35 → 0 như bảng trên.
- Kiểm trước khi áp: mọi câu mới chưa từng xuất hiện ở từ điển / từ của vòng / câu mẫu vòng, và có
  chứa chính từ đó.
- Bộ dựng câu điền từ thật (`buildFillBlankQuestions`, chiều A, toàn từ điển): **0/52** mục đã sửa
  bị loại (không `no_match`, không `multiple_spans`).
- `npx vitest run apps/dhcb/src/data/vocabQuality.test.ts` → 5/5 xanh; cổng commit đầy đủ ghi ở mô
  tả PR/commit.
