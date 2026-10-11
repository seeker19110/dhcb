# 0611 — Bảng nháp STEM: đọc ký hiệu khoảng/tập và trị tuyệt đối (vẫn chính xác)

- **Ngày:** 2026-10-11 · **PR:** (xem mô tả PR) · **Loại:** `feat(stem)`
- **Đặc tả:** `docs/specs/2026-10-11-ky-hieu-khoang-va-tri-tuyet-doi.md` (Approved for
  implementation — chủ dự án chọn phạm vi "Ký hiệu khoảng + |x|" ngày 2026-10-11).
- **Nguồn việc:** hai mục "để đợt sau" của đợt `0608` (bất phương trình).

## Vấn đề

Sau `0608`, bộ kiểm đã chứng minh được bước giải bất phương trình, nhưng đáp số viết theo lối SGK
`S = (2; +∞)` vẫn ra "? Chưa tự kiểm được" — dấu `;` đang có nghĩa "hoặc". Bài có trị tuyệt đối
(`|2x − 1| < 5`, `|x − 1| = 3`) cũng chỉ ra "?".

## Đã làm

- `stepCheckMath.ts`:
  - **Ký hiệu tập**, đọc TRƯỚC khi tách "hoặc" và chỉ khi có tiền tố `S =` hoặc `x ∈`/`x \in`:
    khoảng `(a; b)`, `[a; b)`… (ngăn bằng `;`, hoặc `,` khi không có `;`), vô cực `\infty`/`∞`/`inf`,
    hợp `\cup`/`∪`/`U`, tập hữu hạn `\{a; b\}`, `∅`, `ℝ`, `ℝ \setminus \{a; b\}`. Tập đổi về chính
    các mệnh đề sẵn có (một khoảng = chuỗi kép `a < x ≤ b`), nên phần so tập không đổi. Ký hiệu sai
    (đầu mút ngược, ngoặc vuông ở vô cực) không đọc như tập → "?".
  - **Trị tuyệt đối:** `|f|`, `\left| \right|`, `\lvert \rvert`, `\vert`, `abs(f)` → nút `abs`. Phân
    biệt `|` mở/đóng theo ngữ cảnh. Chia trường hợp CHÍNH XÁC ở mức công thức dấu: mỗi `|g|` (từ
    trong ra ngoài) thành `g ≥ 0 VÀ (…g…)` hoặc `g < 0 VÀ (…−g…)`; tối đa 4 trị tuyệt đối khác nhau
    mỗi mệnh đề, vượt → `too_complex`.
  - `changed` thêm trường tuỳ chọn `absoluteValue: { casesSplit: true }` khi mốc có trị tuyệt đối
    còn bước thì không. `inequality` nay chỉ gắn khi thật sự có dấu bất đẳng thức — phương trình có
    trị tuyệt đối đi nhánh công thức dấu nhưng vẫn nhận câu phản hồi của phương trình.
- `stemMicroHint.ts`: `cauHoiTriTuyetDoi` — mất nghiệm thì hỏi đã xét đủ HAI trường hợp chưa; thêm
  nghiệm thì hỏi đã đối chiếu kết quả từng trường hợp với điều kiện của nó chưa. Không chứa số.
  Dùng ở cả gợi ý bậc 3 lẫn phản hồi `validate_step`.
- `stemScratchpadService.ts` + `stemMicroHint.ts`: câu phạm vi và câu "chưa đọc được" nói đúng phạm
  vi mới (đọc được trị tuyệt đối, `S = (2; +∞)`; chưa đọc căn, lượng giác, log, π, `≠`, nhiều ẩn).

**Không làm (theo đặc tả):** dấu `≠` (dòng "ĐK: x ≠ 1" sẽ bị ✗ oan), tiền tố khác `S` (`D = …` là
tập xác định), khoảng đứng trơn không tiền tố (có thể là toạ độ), ngoặc kiểu Pháp `]a; b[`, `\cap`.

## Bằng chứng

- `npx vitest run packages/core-grading packages/core-ai/stemMicroHint.test.ts
packages/core-ai/stemScratchpadService.test.ts` → 480/480 xanh. Ca mới: 20 ca ký hiệu tập tương
  đương + đáp số, đầu mút đóng/mở sai → `changed`, 8 ca ký hiệu sai → "?", 14 ca trị tuyệt đối
  tương đương (lồng nhau, ẩn ngoài trị tuyệt đối, hằng đẳng thức), trần 5 trị tuyệt đối →
  `too_complex` trong 2 s.
- Test bất biến "gợi ý không lộ nghiệm" (`stemMicroHint.test.ts`) chạy thêm hai đề `|x − 1| = 3`
  và `|2x − 1| < 5` với mọi chuỗi bước (đúng, sai, ký hiệu tập).
- Hai kỳ vọng test cũ đã sửa theo đặc tả: `S = (2; +∞)` trước là "?" nay là `equivalent`; câu phạm
  vi không còn "chưa đọc trị tuyệt đối / ký hiệu khoảng".
- Mọi ca phương trình và bất phương trình cũ giữ nguyên kết quả (cùng file test, không sửa).
- `npm run codemap -- impact packages/core-grading/stepCheckMath.ts`: 12 file, đều trong luồng
  bảng nháp STEM (`core-ai` stem* → `api/learning/stem-scratchpad.ts` → `routes.ts`). Bộ kiểm bước
  vẫn không xuất qua `core-grading/index.ts`, nên không vào bundle client.
- Không chạm giao diện (chỉ câu chữ phản hồi từ server) → không cần ảnh Tầng 8b.
