# Đặc tả: Kiểm THỨ NGUYÊN từng bước giải Vật lí trong Bảng nháp STEM

**Trạng thái:** Approved for implementation — chủ dự án duyệt hướng "chất lượng cao nhất"
2026-10-09 trong phiên (giao qua coordinator, đợt `0552`; là mục (1) của nợ "Bảng nháp STEM" trong
`PROGRESS.md`).

**Nền:** `docs/specs/2026-10-09-kiem-buoc-giai-stem.md` (đợt `0547`) cố ý GHI NỢ Vật lí vì "chưa có
nguồn gán thứ nguyên cho biến theo đề — làm vội sẽ thành kiểm giả". Đặc tả này đặt nguồn đó: **bảng
thứ nguyên biến khai trong đề**.

---

## 0. Một câu

Bảng nháp STEM tự **chứng minh** được một bước Vật lí **lệch thứ nguyên** (cộng/trừ hoặc cho bằng
nhau hai đại lượng khác thứ nguyên, đối số hàm siêu việt có thứ nguyên) và nói `✗ Lệch thứ nguyên`;
bước khớp thứ nguyên vẫn là `? Chưa tự kiểm được` vì khớp thứ nguyên là điều kiện CẦN, không đủ.

## ① Phạm vi

**LÀM:**

- Bộ kiểm `checkPhysicsStep(step, variables)` (`packages/core-grading/stepCheckPhysics.ts`) đọc một
  bước LaTeX phẳng/gõ thường: `+ − · × / ÷ ^ ( ) [ ] { }`, `\frac`/`\dfrac`, `\cdot`/`\times`,
  `\sqrt`/`\sqrt[n]`/`√`, `²`/`⁻¹`, `\sin \cos \tan \exp \ln \log …`, `e^{…}`, `\pi`, `30^\circ`/`30°`,
  `\Delta t`/`Δt`, `\vec{v}`, chữ Hy Lạp (`\omega`, `ω`), chỉ số dưới `v_0`/`v_{tb}`/`v₁₂`, phép
  nhân ngầm (`2at`, `mgh` tách thành m·g·h), số thập phân `9{,}8`/`9,8`/`9.8`, dạng khoa học
  `3\cdot10^{8}`, đơn vị `\text{…}`/`\mathrm{…}`, đơn vị gõ thường sau con số (`10 m/s`), đơn vị trong
  ngoặc ở CUỐI vế theo lối SGK (`= 2,5 (m/s)`), chuỗi `a = b = c`, nhiều mệnh đề nối bằng `⇒`/`;`.
- Đại số thứ nguyên CHÍNH XÁC (`packages/core-grading/dimension.ts`): vector số mũ 7 đại lượng cơ bản
  SI [M, L, T, I, Θ, N, J] bằng số hữu tỉ BigInt (`rational.ts`) — mũ ½ của căn là chính xác, không
  làm tròn, không lấy mẫu.
- Bảng nhỏ TỰ VIẾT: đơn vị SI cơ bản + dẫn xuất + ngoài SI hay gặp (km/h, L, eV, kWh, atm, °C, tên
  tiếng Việt `giây`/`giờ`/`tấn`/`lít`…), 20 tiền tố (k, m, μ/u, n, c, d, M, G…), hằng chuẩn KHÔNG mơ hồ
  (g, c, G, N_A, k_B, ħ, ε_0, μ_0, m_e, m_p).
- Hợp đồng: `errorType: 'dimension_mismatch'` + nhãn `✗ Lệch thứ nguyên`; bảng biến
  `StemVariableTableSchema` + trường tuỳ chọn `variables` của `StemProblemState`; `create_problem`
  nhận `variables` (Zod).
- Gợi ý là **câu hỏi Socratic**, không chứa công thức đúng hay đáp số.

**KHÔNG LÀM (quan trọng ngang mục trên):**

- **Không báo ✓ cho bước khớp thứ nguyên.** `v = 2at` khớp thứ nguyên mà vẫn sai hệ số → luật bất
  biến của skill `stem-science-reasoning-master` §2 ("valid chỉ khi đã chứng minh đúng").
- **Không đoán thứ nguyên từ tên biến.** Đề không khai bảng `variables` → `unsupported` có lý do.
  Không đoán nghĩa của ký hiệu mơ hồ `k` (Coulomb/lò xo/Boltzmann), `h` (Planck/độ cao), `e`
  (điện tích/cơ số), `R` (khí/điện trở/bán kính) khi đề không khai.
- **Không sửa ngân hàng đề** (`packages/core-ai/stemQuestionBank.ts`), `generateMicroHint`, bố cục
  390px của modal — một đợt khác (`0551`) đang làm. Đợt này chỉ mở rộng HỢP ĐỒNG (trường tuỳ chọn) và
  thêm bảng biến cho 2 đề mẫu Vật lí mà giao diện tự dựng (đặt cạnh `DAP_SO_DE_MAU` ở service).
- Không quy đổi giá trị/hệ số đơn vị (việc của `units.ts` khi chấm đáp số); không kiểm vector/chiều,
  không kiểm bất phương trình, đạo hàm/tích phân (`\int`, `\mathrm{d}t` → `unsupported`).
- Không thêm thư viện npm (§5). Không xuất bộ kiểm qua `core-grading/index.ts` (không vào bundle client).

## ② Điểm chạm

| Việc | Đường dẫn file                                           | Ghi chú                                                        |
| ---- | -------------------------------------------------------- | -------------------------------------------------------------- |
| Thêm | `packages/core-grading/dimension.ts`                     | vector thứ nguyên hữu tỉ, bảng đơn vị/tiền tố/hằng số          |
| Thêm | `packages/core-grading/stepCheckPhysics.ts`              | `checkPhysicsStep(step, variables)`                            |
| Thêm | `packages/core-grading/dimension.test.ts`                | đọc đơn vị, tiền tố, mũ phân số, hằng số                       |
| Thêm | `packages/core-grading/stepCheckPhysics.test.ts`         | ca biên §④ + dòng lời giải thật của `packages/subject-physics` |
| Thêm | `packages/core-ai/stemScratchpadService.physics.test.ts` | phản hồi + nhãn + quét ngân hàng đề Vật lí                     |
| Sửa  | `packages/core-contracts/stemScratchpad.ts`              | `dimension_mismatch`, nhãn, `StemVariableTableSchema`          |
| Sửa  | `packages/core-contracts/stemScratchpad.test.ts`         | nhãn + bảng biến                                               |
| Sửa  | `packages/core-ai/stemScratchpadService.ts`              | nhánh `physics` trong `validateStep`, bảng biến đề mẫu         |
| Sửa  | `apps/server/src/api/learning/stem-scratchpad.ts`        | `create_problem` nhận `variables` (Zod, sai → 400)             |
| Sửa  | `apps/server/src/api/learning/stem-scratchpad.test.ts`   | luồng tạo đề Vật lí → bước lệch thứ nguyên                     |

**Ảnh hưởng lan ra (theo codemap):** `stemScratchpadService.ts` chỉ được handler
`stem-scratchpad.ts` dùng; hợp đồng `stemScratchpad.ts` được modal + `stemScratchpadApi.ts` dùng kiểu
(thêm giá trị enum + trường tuỳ chọn — tương thích ngược với bản ghi cũ trong `platform.feature_state`).
Modal hiển thị nhãn qua `nhanKetQuaBuoc()` nên KHÔNG cần sửa giao diện.

## ③ Hợp đồng dữ liệu

**Vào — bảng biến của đề** (mở rộng `StemProblemState`, tương thích ngược):

```ts
variables?: Record<string, string> // ký hiệu → đơn vị; tối đa 64 mục, khoá 1–32 ký tự, giá trị ≤ 64
// vd { v: 'm/s', v_0: 'm/s', a: 'm/s^2', t: 's', 'Δt': 's', '\\omega': 'rad/s', N: '' }
// '' (hoặc '1') = không thứ nguyên. Khoá chuẩn hoá như ký hiệu trong bài: `\omega` ≡ `ω`,
// `v_{12}` ≡ `v₁₂` ≡ `v_12`, `\Delta t` ≡ `Δt`.
```

`POST /api/stem-scratchpad?action=create_problem` nhận thêm `variables` (validate bằng
`StemVariableTableSchema`; sai kiểu → `400 Invalid variables table`). `validate_step` không đổi.

**Thứ tự gán thứ nguyên một ký hiệu:** bảng biến của đề (THẮNG mọi thứ) → hằng chuẩn → tách chữ liền
thành tích ký hiệu đã biết (`mgh`; mọi cách tách phải cùng thứ nguyên) → `Δx` cùng thứ nguyên `x` →
chỉ số dưới/phẩy CHƯA khai (`v_1` khi chỉ khai `v`: dùng thứ nguyên `v` nhưng CÓ ĐIỀU KIỆN) → đơn vị
gõ thường (chỉ hợp lệ khi đi kèm con số) → ký hiệu mơ hồ / lạ → `unsupported`.

**Ra — `checkPhysicsStep`:**

```ts
type PhysicsStepCheck =
  | { verdict: 'consistent'; dimension: string; assumedCoefficients: boolean }
  | { verdict: 'mismatch'; mismatch: DimensionMismatch } // CHỨNG MINH được
  | { verdict: 'conditional_mismatch'; mismatch: DimensionMismatch; doubts: string[] }
  | { verdict: 'division_by_zero' }
  | { verdict: 'unsupported'; reason: PhysicsUnsupportedReason; detail?: string }
type DimensionMismatch = {
  context: 'sum' | 'equation' | 'function_argument' | 'exponent'
  functionName?: string
  left: { text: string; dimension: string } // text = đúng phần người học gõ (≤ 40 ký tự)
  right: { text: string; dimension: string } // dimension theo đơn vị cơ bản SI: 'm·s⁻¹', 'm^(1/2)·s⁻¹'
}
```

**Ra — `ScratchpadStepValidation`:** thêm `errorType: 'dimension_mismatch'`.

**Ca lỗi:**

| Tình huống                                                  | Kết luận                         | Hành vi mong đợi                                           |
| ----------------------------------------------------------- | -------------------------------- | ---------------------------------------------------------- |
| Hai vế / hai hạng tử khác thứ nguyên, mọi thừa số chắc chắn | `invalid` · `dimension_mismatch` | nêu hai phần gõ + thứ nguyên từng phần; hỏi Socratic       |
| Đối số `sin/cos/ln/e^…` có thứ nguyên                       | `invalid` · `dimension_mismatch` | "đối số của cos là “t”, có thứ nguyên s"                   |
| Lệch chỉ khi coi số trần là hệ số (`v = 2t` lối SGK)        | `unverified` · `none`            | "Chưa kết luận được. Nếu số “2” không kèm đơn vị, thì …"   |
| Chia cho số 0                                               | `invalid` · `division_by_zero`   | như Toán                                                   |
| Khớp thứ nguyên                                             | `unverified` · `none`            | "Thứ nguyên khớp … là điều kiện CẦN — chưa xác nhận đúng"  |
| Khớp đáp số đề mẫu (`khopDapSo`)                            | `valid` · `isFinalAnswer`        | như trước (`0473`); bước lệch thứ nguyên bị ✗ TRƯỚC khi so |
| Thiếu bảng biến / bảng hỏng / ký hiệu lạ/mơ hồ / đơn vị lạ  | `unverified` · `none`            | câu nêu đúng lý do + phạm vi bộ kiểm                       |
| Chỉ toàn số, không dấu `=`, số mũ là biến, quá dài/sâu      | `unverified` · `none`            | như trên                                                   |

## ④ Tiêu chí chấp nhận

- [x] Lệch thứ nguyên CHỨNG MINH được → `mismatch` (vế: `v = a t^2`; tổng: `s = vt + at`; hằng:
      `E = mc`; mũ phân số: `v = \sqrt{g}`; hàm: `\cos(t)`, `\ln(t)`, `e^{-t}`; tiền tố:
      `5\,\text{mm} + 2\,\text{ms}`) — `packages/core-grading/stepCheckPhysics.test.ts`.
- [x] Bước SAI rõ ràng không bao giờ ra `consistent`; bước khớp thứ nguyên không bao giờ thành `valid`
      — `stepCheckPhysics.test.ts`, `packages/core-ai/stemScratchpadService.physics.test.ts`.
- [x] Lối SGK (`v = 2t`, `½at` thiếu t, `10 m/s` khi đề có biến `m`) → KHÔNG ✗ (`conditional_mismatch`)
      — `stepCheckPhysics.test.ts`.
- [x] 7 dòng lời giải thật của `packages/subject-physics` (số trần + đơn vị trong ngoặc cuối vế, `v₁₂`,
      `Δt`, `√(AB² + BC²)`) → `consistent`, không báo lệch giả — `stepCheckPhysics.test.ts`.
- [x] Thiếu bảng biến, bảng hỏng, đơn vị lạ, ký hiệu lạ, ký hiệu mơ hồ (k, R), chia cho 0, quá dài/sâu
      → `unsupported`/`division_by_zero` có lý do — `stepCheckPhysics.test.ts`.
- [x] Quét ngân hàng đề STEM: mọi đề Vật lí chưa khai bảng → "chưa tự kiểm được", không ✓/✗ —
      `stemScratchpadService.physics.test.ts`.
- [x] Nhãn `✗ Lệch thứ nguyên` (ký hiệu + chữ) — `packages/core-contracts/stemScratchpad.test.ts`.
- [x] `create_problem` nhận/từ chối bảng biến; bước lệch qua API → `dimension_mismatch`, bước khớp
      không làm bài "giải xong" — `apps/server/src/api/learning/stem-scratchpad.test.ts`.
- [x] Tầng 8b: ảnh 1440 + 390 × blue-sky + dark-blue, trước/sau, kịch bản Vật lí (một bước khớp, một
      bước lệch thứ nguyên) — đã tự xem (changelog `0552`).

**Lệnh chứng minh:**

```bash
rm -rf packages/*/dist dist dist-server && npm run typecheck && npm run lint
npx vitest run packages/core-grading packages/core-ai/stemScratchpadService \
  packages/core-contracts apps/server/src/api/learning/stem-scratchpad
```

## ⑤ Bất biến không được phá

| Bất biến                                                                   | Test nào canh nó                                         |
| -------------------------------------------------------------------------- | -------------------------------------------------------- |
| Bước Vật lí khớp thứ nguyên KHÔNG BAO GIỜ `valid` (trừ khớp đáp số đề mẫu) | `packages/core-ai/stemScratchpadService.physics.test.ts` |
| ✗ chỉ khi lệch CHỨNG MINH được (không dính số trần/ký hiệu mơ hồ)          | `packages/core-grading/stepCheckPhysics.test.ts`         |
| Không bảng biến → không kết luận (không đoán thứ nguyên)                   | `packages/core-grading/stepCheckPhysics.test.ts`         |
| Gợi ý là câu hỏi, không chứa `=`/chữ số                                    | `packages/core-ai/stemScratchpadService.physics.test.ts` |
| Tất định (cùng vào → cùng ra)                                              | `packages/core-grading/stepCheckPhysics.test.ts`         |
| Phản hồi ≤ 500 ký tự dù người học gõ dài                                   | `packages/core-ai/stemScratchpadService.physics.test.ts` |

## 5. Nghiên cứu: tự viết vs thư viện (KHUNG 3)

Thư viện đơn vị trên npm (`mathjs` units 15.2.0 — 9,4 MB; `js-quantities`; `convert-units`) đều làm
QUY ĐỔI giá trị, không đọc được biểu thức LaTeX của học sinh, không gán thứ nguyên theo bảng biến
của đề, và dùng số thực cho số mũ (mũ ½ của căn so bằng float). Bài toán ở đây hẹp và chứng minh được
tuyệt đối: thứ nguyên là nhóm abel tự do trên 7 đại lượng cơ bản, mọi phép là cộng/trừ/nhân vector số
mũ hữu tỉ. Tự viết ~1.700 dòng TS trong `core-grading` (`dimension.ts` + `stepCheckPhysics.ts`), **0 phụ thuộc mới**, tái dùng `rational.ts`
(đợt `0547`) → không ADR, không đụng `package-lock.json`, không đội bundle client. Bộ đọc biểu thức của
`expression.ts` KHÔNG tái dùng được: nó gộp `vt` thành một tên, không có đơn vị/`\text`/chỉ số dưới,
và qua `normalizeAnswerText` đổi dấu phẩy — nên viết bộ đọc riêng (đệ quy xuống, ghi lại vị trí để
trích đúng phần người học gõ vào phản hồi).

## 6. Quy ước then chốt — "số trần" (số không kèm đơn vị)

SGK Việt Nam viết `x = 5 + 2t (m)` / `= 2,5 (m/s)`: số trong phép tính KHÔNG kèm đơn vị, đơn vị ghi
sau. Theo ISO 80000-1 số trần là không thứ nguyên. Hai quy ước cho hai kết luận khác nhau với `v = 2t`,
nên bộ kiểm tách ba loại giá trị:

- **số trần đứng riêng** (`2 \cdot 5`, một vế hay một hạng tử chỉ toàn số): thứ nguyên NGẦM → bỏ qua
  khi so (không ✓, không ✗);
- **số trần nhân ký hiệu** (`2t`, `\frac{1}{2} a t`): thứ nguyên CÓ ĐIỀU KIỆN — lệch ở đây chỉ được nói
  "Chưa kết luận được. Nếu …" (`conditional_mismatch`), KHÔNG ✗;
- **một con số kèm đơn vị** (`9{,}8\,\text{m/s}^2`, `10 m/s`, `3 (m/s)` cuối vế) hoặc ký hiệu đã khai:
  thứ nguyên CHẮC CHẮN — chỉ lệch giữa hai giá trị chắc chắn mới thành `✗ Lệch thứ nguyên`.

Hệ quả có chủ đích: `s = v t + \frac{1}{2} a t` (thiếu một t) chỉ được hỏi lại, không bị ✗ — vì `½`
về nguyên tắc có thể là một giá trị đã thay số. Đánh đổi này giữ đúng luật "✗ phải chứng minh được".
Tương tự, chữ vừa là ký hiệu đại lượng của đề vừa là ký hiệu đơn vị (`10 m/s` khi đề có biến `m`) và
chỉ số dưới chưa khai (`v_1`) đều là CÓ ĐIỀU KIỆN. Số mũ viết ngoài `\text{m/s}^2` gắn vào đơn vị cuối
(đúng như mắt đọc "m/s²"); sau dấu `/` trong đơn vị, mọi thừa số tới dấu `/` kế tiếp đều ở mẫu
(`J/kg.K` = J/(kg·K), giống `units.ts`).

## ⑥ Quy ước dự án liên quan

- Import xuyên gói `@dhcb/<gói>/<file>`; nội bộ gói `./x.js`. Không `any`. Dữ liệu ngoài (bảng biến từ
  client) validate bằng Zod.
- Nhãn trạng thái luôn ký hiệu + chữ (WCAG 1.4.1). Phản hồi trích lại chuỗi người học gõ (skill §4).

---

## Nghiệm thu

Xem `docs/changelog/0552-2026-10-09-kiem-thu-nguyen-vat-li.md`.
