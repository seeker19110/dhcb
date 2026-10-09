# 0547 — Bảng nháp STEM kiểm được bước giải giữa (Toán một ẩn + cân bằng PTHH) (2026-10-09)

- **Ngày:** 2026-10-09 · **PR:** (chưa tạo — commit trên nhánh worktree) · **Loại:** `feat(stem)`
- **Đặc tả:** `docs/specs/2026-10-09-kiem-buoc-giai-stem.md` (Approved for implementation — chủ dự án
  duyệt hướng chất lượng cao nhất 2026-10-09).
- **Nguồn:** nợ 🟡 `PROGRESS.md` "Bảng nháp STEM … chưa kiểm được bước giải ở giữa" (`0473`, `0539`).

## Đã làm

**Bộ kiểm Toán — `packages/core-grading/stepCheckMath.ts`** (`checkMathStep(step, anchor, previous?)`).
Phương trình một ẩn → phân thức N(x)/D(x) với hệ số **hữu tỉ chính xác** (`rational.ts`, BigInt), mọi
mẫu số gặp trên đường đi ghi vào tập xác định (rút gọn `x/x → 1` không làm mất `x ≠ 0`). Tập nghiệm
thực so với đề bằng ƯCLN đa thức + phần không lặp + **dãy Sturm** đếm nghiệm thực (`polynomial.ts`) —
không làm tròn, không lấy mẫu ngẫu nhiên, nên cả "tương đương" lẫn "đổi nghiệm" đều là kết luận
CHỨNG MINH được. Đọc: `\frac`/`\dfrac`, `\cdot`/`\times`, `^{…}`, `\left(\right)`, `²`, dấu phẩy
thập phân, chuỗi `a = b = c`, `⇒`/`\implies`, "hoặc"/`;`/`\lor`, `±`. Mọi thứ khác (căn, lượng
giác, π, `≠`/`<`, nhiều ẩn, bậc > 24, hệ số > 2048 bit, LaTeX lạ, dấu `:`) → `unsupported` có lý do.

**Bộ kiểm Hoá — `packages/core-grading/stepCheckChem.ts`** (`checkChemStep(step, problem?)`). Tái dùng
`parseFormula`/`parseEquation` của `chemistry.ts`; thêm chuẩn hoá LaTeX (`\ce{}`, `\mathrm{}`,
`_{}`/`^{}`, mọi kiểu mũi tên kể cả `\xrightarrow{t°}`, `·`), trạng thái `(s)/(l)/(g)/(aq)/(r)/(k)/(dd)`,
`↑↓`, điều kiện `→(t°)`, electron `e^-`, danh sách 118 nguyên tố (ký hiệu bịa → không kiểm). Thứ tự:
đổi chất so với đề → lệch nguyên tử (nêu nguyên tố + số đếm từng vế) → lệch điện tích → tối giản.

**Nối vào `validateStep`** (`packages/core-ai/stemScratchpadService.ts`): xoá hai mẫu lỗi gán cứng
cũ (chỉ khớp đúng chuỗi `2x = 15 + 5` / `H_2 + O_2 -> H_2O`, "gợi ý" lộ luôn lời giải). Phản hồi:
câu nêu sự thật kiểm được + gợi ý **câu hỏi Socratic** theo loại lỗi (mất nghiệm → "có chia cho biểu
thức chứa ẩn không?"; nghiệm lạ → "có nhân/bình phương/bỏ ĐKXĐ không?"; cả hai → "dấu khi chuyển
vế?"), không chứa nghiệm. Lỗi mang từ bước trước được chỉ ra ("chỗ sai nằm ở một bước TRƯỚC đó").
"Chưa tự kiểm được" nay nói rõ phạm vi theo môn.

**Hợp đồng** (`packages/core-contracts/stemScratchpad.ts`): 4 `errorType` mới, cờ `isFinalAnswer`,
`nhanKetQuaBuoc()`. **Handler** (`stem-scratchpad.ts`): "giải xong" cần `valid` + `isFinalAnswer`
(bước giữa `2x = 10` không còn làm bài xong); không còn lấy chính bước đầu làm "đề" khi thiếu
`problemId` (tránh tự so với mình rồi khen). **Giao diện**: nhãn `✗ Đổi nghiệm` · `✗ Lệch nguyên tử`
· `✗ Lệch điện tích` · `✗ Đổi chất` · `✗ Chia cho 0` (ký hiệu + chữ, không chỉ màu), vùng
`role="status"` đọc kết luận bước vừa kiểm, gợi ý thôi dùng font mono.

## Quyết định

- **Tự viết, KHÔNG thêm thư viện** (số liệu `npm view` + lý do: đặc tả §5). `mathjs` 15.2.0 (9,4 MB) không
  có so tập nghiệm và làm mất ĐKXĐ khi rút gọn; `nerdamer` 2.0.0 phát hành 2026-10-02 (< 2 tuần);
  `algebrite` 1.4.0 ngừng từ 2022, không có kiểu TS. Không phụ thuộc mới → không ADR, không đổi
  `package-lock.json`, bộ kiểm không xuất qua `core-grading/index.ts` nên không vào bundle client.
- **So với ĐỀ, không so với bước liền trước:** một bước sai kéo theo các bước sau cũng ✗ (đúng sự
  thật: chúng không còn tương đương đề), kèm câu chỉ về bước sai đầu tiên.
- **Vật lí — kiểm thứ nguyên từng bước: GHI NỢ** (cần gán thứ nguyên cho biến theo đề; làm vội thành
  kiểm giả).
- PTHH cân bằng nhưng chưa tối giản → `✓` (bảo toàn đúng) kèm nhắc rút gọn, không tính là đáp số.

## Tầng 8b

Ảnh 1440px + 390px × blue-sky + dark-blue, trước/sau, kịch bản Toán (`2x = 15 + 5` → `2x = 10` →
`\sqrt{x} = 5`) và Hoá (`H_2 + O_2 -> H_2O` → `2H_2 + O_2 -> 2H_2O`) — 16 ảnh, đã tự xem. Trước: cả
ba bước Toán đều "? Chưa tự kiểm được". Sau: `✗ Đổi nghiệm` / `✓ Hợp lệ` / `? Chưa tự kiểm được`, Hoá
`✗ Lệch nguyên tử` (nêu "O (vế trái 2, vế phải 1)") / `✓ Hợp lệ`. Thấy thêm (KHÔNG sửa, ghi nợ): ở
390px hàng nhập chật, nút "💡 Gợi ý" bị ép 2 dòng sát mép phải — có từ trước.

## Kiểm chứng

- `rm -rf packages/*/dist dist dist-server && npm run typecheck` → exit 0 (lần đầu bắt được lỗi thu hẹp
  kiểu ở `compareSets`, đã sửa).
- `npm run lint` → exit 0, 0 cảnh báo · `npm run build` → exit 0 · `npm run budget` → Initial JS
  149,06/160 kB, CSS 24,36/26 kB (không đổi do bộ kiểm chạy server).
- `npm run codemap -- cycles` → "Không có chu trình import" · `npm run check:specs` → OK 152 đặc tả ·
  `npm run check:docs` → OK · `prettier --check` file đổi → sạch.
- `npx vitest run --no-watch packages/core-grading packages/core-ai/stemScratchpadService.test.ts
packages/core-contracts/stemScratchpad.test.ts apps/server/src/api/learning/stem-scratchpad.test.ts
apps/dhcb/src/components/StemScratchpad apps/dhcb/src/components/CompanionStudios
scripts/changelog.test.ts scripts/skills-mirror.test.ts` → 17 file, 308 test xanh.
- Độ phủ riêng 5 file mới/đổi chính: stmts 96,4% · branches 87,5% · lines 98,3%. Chưa chạy
  `test:coverage` toàn bộ (máy dùng chung, theo chỉ đạo coordinator) — CI sẽ chạy.

## Nợ / rủi ro còn lại

- Vật lí: kiểm thứ nguyên bước giữa. Toán: căn, lượng giác, log, π, bất phương trình, nhiều ẩn, dấu `:`.
- `generateMicroHint` (gợi ý soạn sẵn) còn đưa thẳng `x = \frac{10}{2} = 5` — trái Socratic.
- Bản ghi bước cũ trong `platform.feature_state` giữ nhãn cũ (không chạy lại bộ kiểm cho bước đã lưu).
- `1.000` hiểu là một nghìn (luật số Việt của `normalizeAnswerText`) — nhất quán với engine chấm.
