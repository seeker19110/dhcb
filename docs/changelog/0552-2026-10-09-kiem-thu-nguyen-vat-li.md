# 0552 — Bảng nháp STEM kiểm THỨ NGUYÊN từng bước Vật lí (2026-10-09)

- **Ngày:** 2026-10-09 · **PR:** (chưa tạo — commit trên nhánh `feat/stem-kiem-thu-nguyen-vat-li`) ·
  **Loại:** `feat(stem)`
- **Đặc tả:** `docs/specs/2026-10-09-kiem-thu-nguyen-vat-li.md` (Approved for implementation — chủ dự
  án duyệt hướng chất lượng cao nhất 2026-10-09, giao qua coordinator).
- **Nguồn:** mục (1) của nợ 🟡 `PROGRESS.md` "Bảng nháp STEM" (sau `0547`: Vật lí còn chưa kiểm bước).

## Đã làm

**Đại số thứ nguyên — `packages/core-grading/dimension.ts`.** Vector số mũ 7 đại lượng cơ bản SI
[M, L, T, I, Θ, N, J] bằng số hữu tỉ BigInt (`rational.ts` của `0547`) → mũ ½ của căn chính xác,
không làm tròn. Bảng nhỏ tự viết: đơn vị SI cơ bản/dẫn xuất + ngoài SI hay gặp (km/h, L, eV, kWh,
atm, °C, `giây`/`giờ`/`tấn`/`lít`…), 20 tiền tố (k, m, μ/u, n…; `ms` đọc nguyên khối = mili-giây),
đọc biểu thức đơn vị (`J/(kg.K)`, `N·m²/kg²`, `s^{-1}`, `m/s2`), hằng chuẩn KHÔNG mơ hồ (g, c, G, N_A,
k_B, ħ, ε_0, μ_0, m_e, m_p); `k`, `h`, `e`, `R` cố ý KHÔNG có (nhiều nghĩa — đề phải khai).

**Bộ kiểm — `packages/core-grading/stepCheckPhysics.ts`** (`checkPhysicsStep(step, variables)`). Bộ đọc
đệ quy xuống viết riêng (bộ đọc của `expression.ts` gộp `vt` thành một tên, không có `\text`/chỉ số
dưới — không tái dùng được): `\frac`, `\sqrt[n]`, `√`, `²`, `\sin…\ln`, `e^{…}`, `30^\circ`, `Δt`,
`\vec`, chữ Hy Lạp, `v_0`/`v_{tb}`/`v₁₂`, nhân ngầm (`mgh` → m·g·h, mọi cách tách phải cùng thứ
nguyên), `9{,}8\,\text{m/s}^2` (số mũ ngoài `\text` gắn vào đơn vị cuối), `3\cdot10^{8}`, `10 m/s`,
đơn vị trong ngoặc cuối vế kiểu SGK (`= 2,5 (m/s)`), chuỗi `a = b = c`, `⇒`/`;`. Ra: `mismatch`
(chứng minh được — nêu hai phần người học gõ + thứ nguyên từng phần) · `conditional_mismatch` ·
`consistent` · `division_by_zero` · `unsupported` (10 lý do cụ thể).

**Hợp đồng** (`packages/core-contracts/stemScratchpad.ts`): `errorType: 'dimension_mismatch'` + nhãn
`✗ Lệch thứ nguyên` (một mục trong `NHAN_LOI`, modal không phải sửa); `StemVariableTableSchema` +
trường TUỲ CHỌN `variables` của `StemProblemState`. **Handler** `create_problem` nhận `variables`
(Zod, sai → 400). **Service**: nhánh `physics` trong `validateStep` — lệch đã chứng minh → ✗; còn lại
thử khớp đáp số đề mẫu (`khopDapSo`, giữ nguyên) rồi mới "chưa tự kiểm được" kèm điều đã biết
("Thứ nguyên khớp: các vế đều là m·s⁻¹ … điều kiện CẦN"). Bảng biến cho 2 đề mẫu Vật lí giao diện tự
dựng đặt cạnh `DAP_SO_DE_MAU` (`BANG_BIEN_DE_MAU`); bảng riêng của đề luôn thắng.

## Quyết định

- **Khớp thứ nguyên KHÔNG BAO GIỜ là ✓.** Đó là điều kiện cần (`v = 2at` khớp mà sai hệ số) → luật bất
  biến skill §2. Nhãn vẫn `? Chưa tự kiểm được`, phản hồi nói rõ phần đã kiểm được.
- **"Số trần" (số không kèm đơn vị) — quy ước then chốt (đặc tả §6).** SGK viết `x = 5 + 2t (m)`:
  số không đơn vị, đơn vị ghi sau. Nên `2t`, `\frac{1}{2} a t` có thứ nguyên CÓ ĐIỀU KIỆN → lệch ở đó
  chỉ được "Chưa kết luận được. Nếu số “2” không kèm đơn vị, thì …", không ✗. ✗ chỉ khi lệch giữa hai
  giá trị CHẮC CHẮN (ký hiệu đã khai, hằng chuẩn, số kèm đơn vị). Đánh đổi có chủ đích: `s = vt +
½at` (thiếu t) chỉ được hỏi lại. Tương tự: chữ vừa là biến vừa là đơn vị (`10 m/s` khi đề có biến
  `m`) và chỉ số dưới chưa khai (`v_1` khi chỉ khai `v`) đều CÓ ĐIỀU KIỆN.
- **Không đoán thứ nguyên từ tên biến:** đề không có bảng → "chưa tự kiểm được" có lý do. Ngân hàng đề
  (`stemQuestionBank.ts`) KHÔNG sửa (đợt `0551` đang làm) — chỉ mở rộng hợp đồng, test quét ngân hàng
  canh rằng đề chưa khai bảng không bao giờ bị ✓/✗.
- **Tự viết, 0 phụ thuộc mới** (đặc tả §5): thư viện đơn vị npm chỉ quy đổi giá trị, không đọc LaTeX học
  sinh, số mũ bằng float. Bộ kiểm không xuất qua `core-grading/index.ts` → không vào bundle client.
- Test Vật lí của service để ở FILE RIÊNG `stemScratchpadService.physics.test.ts` để không xung đột với
  đợt `0551` (đang sửa `generateMicroHint` + test cuối `stemScratchpadService.test.ts`).

## Tầng 8b

Ảnh 1440px + 390px × blue-sky + dark-blue, trước/sau, kịch bản Vật lí đề mẫu "v = a·t": bước 1
`v = a t` (khớp), bước 2 `v = a t^2` (lệch) — 8 ảnh, dữ liệu kiểm bước lấy từ chạy THẬT `validateStep`
của `origin/main` và của nhánh, đã tự xem. Trước: cả hai bước `? Chưa tự kiểm được` với câu "Bộ kiểm
chưa kiểm được bước giải môn Vật lí". Sau: bước 1 `? Chưa tự kiểm được` + "Thứ nguyên khớp: các vế đều
là m·s⁻¹ …"; bước 2 `✗ Lệch thứ nguyên` + "vế “v” có thứ nguyên m·s⁻¹, còn vế “a t^2” có thứ nguyên
m" + gợi ý dạng câu hỏi. Chữ không tràn, nhãn ký hiệu + chữ ở cả hai theme. Hàng nhập ở 390px vẫn chật
(nợ (5) có từ trước, thuộc đợt `0551`) — không đụng.

## Kiểm chứng

- `rm -rf packages/*/dist dist dist-server && npm run typecheck` → exit 0 · `npm run lint` → exit 0,
  0 cảnh báo · `prettier --check` 15 file đổi → sạch · `npm run codemap -- cycles` → "Không có chu
  trình import" · `npm run check:specs` → OK 155 đặc tả · `npm run audit:prose -- --ci` → exit 0,
  0 lỗi.
- `npx vitest run packages/core-grading packages/core-ai/stemScratchpadService packages/core-contracts
apps/server/src/api/learning/stem-scratchpad apps/dhcb/src/components/StemScratchpad
scripts/changelog.test.ts scripts/skills-mirror.test.ts` → 89 file, 904 test xanh (riêng bộ kiểm:
  `stepCheckPhysics.test.ts` 108 test, `dimension.test.ts` 28, `stemScratchpadService.physics.test.ts`
  10).
- Độ phủ riêng 2 file mới (`dimension.ts` + `stepCheckPhysics.ts`): stmts 95,3% · branches 87,8% ·
  funcs 98,2% · lines 97,4%. Chưa chạy `test:coverage` toàn bộ (máy dùng chung, theo chỉ đạo
  coordinator) — CI sẽ chạy.
- Viết test phủ cú pháp lộ ra một lỗi THẬT đã sửa trước commit: dấu trừ trong nhóm số mũ (`t^{-1}`)
  bị rơi mất → thứ nguyên sai (s thay vì s⁻¹); nay dấu đi vào GIÁ TRỊ chính xác của số trần (kèm bắt
  `0^{-1}`, `s/(1 - 1)` là chia cho 0), có test hồi quy.

## Nợ / rủi ro còn lại

- Ngân hàng đề Vật lí chưa có bảng `variables` (đề còn là dữ liệu mẫu `P_{n} = …`) → khi viết đề thật
  phải khai bảng, nếu không bộ kiểm chỉ nói "chưa tự kiểm được".
- Không kiểm vector/chiều, đạo hàm/tích phân, bất phương trình; `\frac{1}{2}` vẫn được coi là "có thể là
  giá trị đã thay số" (xem Quyết định).
- Giao diện chưa gửi `variables` khi tạo đề (chỉ 2 đề mẫu dùng `BANG_BIEN_DE_MAU` ở server).
