# Đặc tả: Kiểm bước giải giữa của Bảng nháp STEM (Toán · Hoá)

**Trạng thái:** Approved for implementation — chủ dự án duyệt hướng "chất lượng cao nhất"
2026-10-09 trong phiên (giao qua coordinator, đợt `0547`).

**Nền:** nợ 🟡 trong `PROGRESS.md` "Bảng nháp STEM (Companion › Thử thách) chưa kiểm được bước giải
ở giữa" (sau changelog `0473`: mọi bước không chứng minh được hiện "? Chưa tự kiểm được"; `0539`:
đáp số cuối của `submit_solution` chấm theo giá trị qua `gradeFinalAnswer`).

---

## 0. Một câu

Bảng nháp STEM tự **chứng minh** được bước giải giữa ở hai dạng chắc chắn kiểm được — phương trình
đại số **một ẩn** (bước có giữ nguyên tập nghiệm của đề không) và **cân bằng phương trình hoá học**
(đếm nguyên tử từng nguyên tố + điện tích hai vế) — còn lại vẫn nói thật "? Chưa tự kiểm được".

## ① Phạm vi

**LÀM:**

- Toán: so **tập nghiệm thực** của bước với đề bài, CHÍNH XÁC (số hữu tỉ BigInt + đa thức + dãy
  Sturm). Ra một trong: tương đương (✓) · đổi nghiệm — mất nghiệm / thêm nghiệm lạ / cả hai (✗) ·
  chia cho 0 (✗) · ngoài phạm vi (?).
- Hoá: đọc LaTeX phẳng/Unicode (`H_2`, `H₂`, `\rightarrow`, `→`, `\ce{}`, `·`, `^{2-}`, `e^-`,
  `(s)/(aq)/(k)`, `↑↓`, điều kiện `→(t°)`), đếm nguyên tử + điện tích, phát hiện **đổi chất** (sửa
  chỉ số thay vì thêm hệ số), báo hệ số chưa tối giản.
- Gợi ý **Socratic** (câu hỏi), không lộ nghiệm hay bước đúng; xoá hai "mẫu lỗi gán cứng" cũ (gợi ý
  của chúng đưa thẳng `2x = 10`, `2H_2 + O_2 → 2H_2O`).
- Hợp đồng: thêm 4 `errorType` + cờ `isFinalAnswer`; bài chỉ "giải xong" khi bước **đã chứng minh**
  VÀ ở dạng đáp số (`x = 5`; PTHH cân bằng tối giản đúng chất của đề).
- Giao diện: nhãn ✗ cụ thể (`✗ Đổi nghiệm` · `✗ Lệch nguyên tử` · `✗ Lệch điện tích` · `✗ Đổi chất`
  · `✗ Chia cho 0`), vùng `role="status"` đọc kết luận bước vừa kiểm.

**KHÔNG LÀM (quan trọng ngang mục trên):**

- **Vật lí — kiểm thứ nguyên từng bước: GHI NỢ.** `units.ts` chỉ quy đổi đơn vị của MỘT đáp số;
  kiểm thứ nguyên bước giữa cần đọc ký hiệu đại lượng (`v`, `a`, `t`) + gán thứ nguyên cho từng
  biến theo đề — chưa có nguồn dữ liệu đó trong đề mẫu. Làm vội sẽ thành "kiểm" giả.
- Không thêm phụ thuộc npm (xem §5 nghiên cứu). Không đụng `gradeAnswer`/`index.ts` của engine chấm
  (bộ kiểm bước KHÔNG export qua `index.ts` → không vào bundle client).
- Không kiểm: căn, lượng giác, log/mũ, π, bất phương trình, hệ nhiều ẩn, giá trị tuyệt đối, phương
  trình hoá có hệ số phân số (`1/2 O_2`) — tất cả trả "?" kèm câu nói rõ phạm vi.
- Không sửa `generateMicroHint` (gợi ý soạn sẵn của 3 đề mẫu) — ngoài phạm vi, ghi nợ ở changelog.
- Không render LaTeX (skill `stem-science-reasoning-master` §4: là quyết định công nghệ riêng).

## ② Điểm chạm

| Việc | Đường dẫn file                                                    | Ghi chú                                               |
| ---- | ----------------------------------------------------------------- | ----------------------------------------------------- |
| Thêm | `packages/core-grading/rational.ts`                               | số hữu tỉ BigInt, trần 2048 bit                       |
| Thêm | `packages/core-grading/polynomial.ts`                             | đa thức Q[x]: ƯCLN, square-free, Sturm; trần bậc 24   |
| Thêm | `packages/core-grading/stepCheckMath.ts`                          | `checkMathStep(step, anchor, previous?)`              |
| Thêm | `packages/core-grading/stepCheckChem.ts`                          | `checkChemStep(step, problem?)`, `normalizeChemLatex` |
| Thêm | `packages/core-grading/stepCheckMath.test.ts`                     | ca biên §8                                            |
| Thêm | `packages/core-grading/stepCheckChem.test.ts`                     | ca biên §8                                            |
| Sửa  | `packages/core-grading/expression.ts`                             | chỉ xuất `type ExprNode` (không đổi hành vi)          |
| Sửa  | `packages/core-contracts/stemScratchpad.ts`                       | 4 `errorType`, `isFinalAnswer`, `nhanKetQuaBuoc`      |
| Sửa  | `packages/core-ai/stemScratchpadService.ts`                       | nối hai bộ kiểm vào `validateStep`                    |
| Sửa  | `packages/core-ai/tsconfig.json`                                  | tham chiếu `../core-grading`                          |
| Sửa  | `apps/server/src/api/learning/stem-scratchpad.ts`                 | "giải xong" cần `isFinalAnswer`; bỏ đề tự dựng        |
| Sửa  | `apps/dhcb/src/components/StemScratchpad/StemScratchpadModal.tsx` | nhãn ✗ cụ thể + `role="status"`                       |

**Ảnh hưởng lan ra (theo codemap):** `stemScratchpadService.ts` chỉ được handler
`stem-scratchpad.ts` dùng; `stemScratchpad.ts` (hợp đồng) được modal + `stemScratchpadApi.ts` dùng
kiểu (thêm trường tuỳ chọn/giá trị enum — tương thích ngược với bản ghi cũ trong
`platform.feature_state`). `expression.ts` chỉ thêm một export kiểu.

## ③ Hợp đồng dữ liệu

**Vào** (`POST /api/stem-scratchpad?action=validate_step`, không đổi): `{ problemId?, latexInput,
explanation? }`.

**Ra** — `ScratchpadStepValidation` thêm:

```ts
errorType: ... | 'changed_solutions' | 'division_by_zero' | 'unbalanced_charge' | 'substance_changed'
isFinalAnswer?: boolean // bước đã chứng minh đúng VÀ ở dạng đáp số
```

**Ca lỗi:**

| Tình huống                                    | Kết luận                          | Hành vi mong đợi                                 |
| --------------------------------------------- | --------------------------------- | ------------------------------------------------ |
| Bước làm mất/thêm nghiệm thực                 | `invalid` · `changed_solutions`   | nói mất/thêm/cả hai + câu hỏi Socratic           |
| Bước khớp bước trước nhưng lệch đề            | `invalid` · `changed_solutions`   | thêm câu "chỗ sai nằm ở một bước TRƯỚC đó"       |
| Có `…/0`, `0^{-1}`                            | `invalid` · `division_by_zero`    | "phép chia cho 0 không được phép"                |
| PTHH lệch nguyên tử                           | `invalid` · `unbalanced_equation` | nêu đích danh nguyên tố + số đếm từng vế         |
| PTHH ion lệch điện tích                       | `invalid` · `unbalanced_charge`   | nêu tổng điện tích từng vế                       |
| Đổi chất so với đề                            | `invalid` · `substance_changed`   | hỏi "có lỡ sửa chỉ số không?"                    |
| LaTeX lạ, căn, π, nhiều ẩn, quá bậc 24, đề lạ | `unverified`                      | "chưa tự kiểm được" + câu nói rõ phạm vi bộ kiểm |

## ④ Tiêu chí chấp nhận

- [x] `2x = 15 + 5`, `2x = 15 + 7`, `x = 50` sau đề `2x + 5 = 15` → `invalid`, KHÔNG BAO GIỜ `valid`
      — `packages/core-ai/stemScratchpadService.test.ts`, `stepCheckMath.test.ts`.
- [x] Biến đổi khác dạng nhưng tương đương (`(x-2)(x+2)=0` ⇔ `x²-4=0`, `\frac{10}{2}`, `0,5`,
      `x = ±2`, "hoặc", nghiệm kép, chia cho `x²+1`) → `valid` — `stepCheckMath.test.ts`.
- [x] Chia hai vế cho biểu thức chứa ẩn (`x² = x → x = 1`) → mất nghiệm; rút gọn phân thức bỏ ĐKXĐ
      → nghiệm lạ; bình phương → nghiệm lạ — `stepCheckMath.test.ts`.
- [x] Mọi đầu vào ngoài phạm vi → `unverified` với lý do cụ thể, không đoán — `stepCheckMath.test.ts`,
      `stepCheckChem.test.ts`.
- [x] PTHH: ngoặc lồng, ngậm nước `·`, ion, electron, trạng thái, điều kiện phản ứng; nguyên tố bịa
      → `unverified` — `stepCheckChem.test.ts`.
- [x] Bước giữa `valid` không làm bài "giải xong"; `x = 5` thì có —
      `apps/server/src/api/learning/stem-scratchpad.test.ts`.
- [x] Nhãn luôn có ký hiệu + chữ (không chỉ màu) — `packages/core-contracts/stemScratchpad.test.ts`.
- [x] Tầng 8b: ảnh 1440 + 390 × blue-sky + dark-blue, trước/sau, Toán + Hoá — đã tự xem.

**Lệnh chứng minh:**

```bash
rm -rf packages/*/dist dist dist-server && npm run typecheck && npm run lint
npx vitest run packages/core-grading packages/core-ai/stemScratchpadService.test.ts \
  packages/core-contracts/stemScratchpad.test.ts apps/server/src/api/learning/stem-scratchpad.test.ts
```

## ⑤ Bất biến không được phá

| Bất biến                                                                         | Test nào canh nó                                 |
| -------------------------------------------------------------------------------- | ------------------------------------------------ |
| Bước không chứng minh được thì KHÔNG BAO GIỜ `valid`                             | `packages/core-ai/stemScratchpadService.test.ts` |
| `2x = 15 + 7` sau `2x + 5 = 15` không bao giờ `valid` (ca sai rõ ràng của skill) | `packages/core-grading/stepCheckMath.test.ts`    |
| Gợi ý không lộ nghiệm/bước đúng                                                  | `packages/core-ai/stemScratchpadService.test.ts` |
| Bộ kiểm tất định (cùng vào → cùng ra)                                            | `packages/core-grading/stepCheckMath.test.ts`    |
| Bước cũ (không `status`) không thành ✓                                           | `packages/core-contracts/stemScratchpad.test.ts` |

## 5. Nghiên cứu: tự viết vs thư viện (KHUNG 3, số liệu `npm view` ngày 2026-10-09)

| Lựa chọn           | Bản / licence / unpacked                       | Vì sao KHÔNG chọn                                                                                        |
| ------------------ | ---------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `mathjs`           | 15.2.0 · Apache-2.0 · 9,4 MB, 9 dependency     | Không có `solve`/so tập nghiệm; `simplify`/`rationalize` không giữ điều kiện xác định (x/x → 1 mất x≠0)  |
| `nerdamer`         | 2.0.0 · Apache-2.0 · 3,1 MB                    | Bản 2.0.0 phát hành 2026-10-02 (< 2 tuần — trái luật phiên bản ổn định); bản trước 1.1.13 từ 2021        |
| `nerdamer-prime`   | 1.5.0 · MIT · 3,1 MB                           | fork cộng đồng; `solve` trả nghiệm số/ký hiệu, không trả lời "mất nghiệm thực nào" một cách chính xác    |
| `algebrite`        | 1.4.0 · MIT · 2,5 MB, cập nhật cuối 2022-06    | ngừng phát triển, không có kiểu TypeScript (`@types/algebrite` không tồn tại → vi phạm luật không `any`) |
| **Tự viết (chọn)** | ~975 dòng TS trong `core-grading`, 0 phụ thuộc | xem dưới                                                                                                 |

**Lý do chọn tự viết:** (1) bài toán hẹp và **chứng minh được tuyệt đối** — phương trình một ẩn
dạng phân thức hữu tỉ quy về đa thức Q[x]; tập nghiệm thực so bằng ƯCLN + đếm nghiệm Sturm trên số
hữu tỉ BigInt, không làm tròn, không lấy mẫu ngẫu nhiên. Lấy mẫu số (cách của `expressionsEqual`)
chỉ cho "gần như chắc" và **không** nhìn thấy nghiệm bị mất khi chia cho biểu thức chứa ẩn; CAS
thư viện lại không theo dõi điều kiện xác định. (2) **tái dùng** bộ phân tích biểu thức
(`expression.ts`) và bộ đọc công thức hoá (`chemistry.ts`) đã có test của engine chấm. (3) 0 phụ
thuộc mới → không cần ADR, không đụng `package-lock.json`, không đội bundle. (4) chạy ở **server**
(`core-ai` chỉ handler dùng; bộ kiểm không xuất qua `core-grading/index.ts` mà client đang import).

**Giới hạn đã biết:** trần bậc 24, trần 2048 bit hệ số (vượt → "?"); tên ẩn phải là MỘT chữ cái;
`1.000` hiểu là một nghìn theo luật chuẩn hoá số Việt của `normalizeAnswerText`.

## 6. Hoá — ion/điện tích

- Điện tích viết `^{2-}`, `^2-`, `²⁻`, `+`/`-` dính cuối công thức; `e^-`/`e⁻` là electron
  (điện tích −1, không nguyên tử) để kiểm bán phản ứng.
- Thứ tự kiểm: đọc được? → đổi chất so với đề? → nguyên tử → điện tích → tối giản.
- Ký hiệu nguyên tố phải thuộc 118 nguyên tố IUPAC; chữ thường đầu (`h2o`) → không đọc được.

## ⑥ Quy ước dự án liên quan

- Import xuyên gói `@dhcb/<gói>/<file>` (rolldown kiểm `exports` nghiêm); nội bộ gói `./x.js`.
- Không `any`; skill `stem-science-reasoning-master` §2: `valid` chỉ khi đã chứng minh.
- Nhãn trạng thái phải có ký hiệu + chữ (WCAG 1.4.1), không chỉ dựa vào màu.

---

## Nghiệm thu

Xem `docs/changelog/0547-2026-10-09-kiem-buoc-giai-stem.md`.
