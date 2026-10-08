# 0535 — Lịch sử Companion báo nhẹ, hết số bịa ở tổng hợp đa miền, chính tả nhận hội thoại về muộn (2026-10-08)

- **Ngày:** 2026-10-08 · **PR:** (chưa tạo — commit trên nhánh worktree) · **Loại:** `fix(ui)`
- **Nguồn:** ba điểm "Còn mở"/"Đã xét" của 0525 + 0530, chủ dự án duyệt hướng chất lượng cao nhất.
  Không đụng `apps/server`, `packages/`, file cổng.

## Đã làm

### 1. Lịch sử hội thoại Companion: từ "im lặng" sang báo NHẸ + Thử lại

Trước: `fetchCompanionHistory().catch(() => {})` — hỏng thì người dùng chỉ thấy tin chào, tưởng cuộc
trò chuyện trước đã mất. Quyết định mới (thay cho comment "Lỗi mạng thì im lặng" cũ, đã sửa tại chỗ):
báo một dòng nhỏ, KHÔNG chặn.

- `components/CompanionStudios/HistoryLoadNotice.tsx`: `role="status"` (không phải `alert`),
  "Không tải được các tin nhắn trước. Bạn vẫn trò chuyện bình thường." + nút "Thử lại" cỡ nhỏ có
  `tap-44` (vùng chạm ≥ 44px). Màu từ token `zinc` như phần còn lại của trang.
- `pages/companion/Companion.tsx`: `historyFailed` + `historyAttempt` (Thử lại = tăng lượt, effect
  chạy lại); huỷ do `AbortController` (rời trang, StrictMode) KHÔNG bị tính là lỗi. Thành công thì
  xoá thông báo; việc gộp tin theo `id` vẫn lũy đẳng. Chỉ hiện ở studio "Trò chuyện".
- Companion chỉ có giao diện tiếng Việt (không có chiều A/B) nên câu chữ chỉ một thứ tiếng.

### 2. `LifeSynthesisDashboard` hết số bịa

Trước: `report?.holisticAlignmentScore || 88`, `|| 92`, `|| 85` — dữ liệu thiếu thành điểm bịa, và
điểm **0 thật** cũng bị đổi thành 88/92/85 (`||` coi 0 là falsy); lỗi tải bị `.catch(() => {})`.

- `lib/lifeSynthesisFormat.ts` → `diemHopLe(value)`: số hữu hạn → kẹp 0–100, còn lại `null`.
- Dashboard: dùng `useAsyncLoad` (lỗi → `LoadError` + Thử lại), ba ô chỉ số gom về `ScoreCard`
  (`null` → "Chưa đủ dữ liệu", thanh rỗng; đang tải → "--"; điểm 0 thật hiện 0). Danh sách miền rỗng
  → "Chưa đủ dữ liệu". Điểm từng miền thiếu → "--". Rà cả file: không còn hằng số bịa nào khác
  (`||` còn lại chỉ là nhãn dự phòng tên miền/màu).
- `LifeSynthesisDetailModal`: ba chỉ số đầu in `{số}%` thẳng từ báo cáo → thiếu dữ liệu in
  "%" cụt; nay dùng cùng `diemHopLe`. Huy hiệu "V5.4 Flagship" giữ nguyên (đếm `uppercase` của
  `UiNoise.design.test.ts` không đổi).
- Component vẫn CHƯA gắn vào giao diện (changelog 0475) — sạch trước khi bật lại.

### 3. `DictationPractice` nhận câu hội thoại về muộn

Trước: `useState(() => buildDictationItems(...))` chốt danh sách lúc mount. Nay khi nguồn đổi
(`dialogues.length` / `words.length` / chiều học) thì **nối thêm** câu chưa có (khử trùng theo nội
dung) bằng khuôn "chỉnh state lúc render" — không dựng lại cả danh sách nên `current`, `typed`,
`scores` không đổi, chỉ số `current` luôn hợp lệ vì chỉ nối cuối. Nguồn không đổi → không xáo lại.

## Bằng chứng

- **Đỏ trước / xanh sau** (đưa file nguồn về bản `HEAD` rồi chạy test mới, sau đó áp lại):
  - `pages/companion/Companion.history.test.tsx` (3 ca) — 2 ca lỗi **đỏ** trên mã cũ, 3/3 xanh nay.
  - `components/LifeSynthesis/LifeSynthesisDashboard.test.tsx` (4 ca: thiếu dữ liệu → không số
    88/92/85 và không `n / 100`; điểm 0 thật; dữ liệu thật; tải hỏng) — 3 ca **đỏ** trên mã cũ, 4/4 xanh.
  - `components/studyTabs/ListeningTab.dictation.test.tsx` (2 ca: mount 0 hội thoại → có thêm câu,
    "Câu 1/…" và chữ đang gõ còn nguyên; nguồn không đổi → không đổi) — ca chính **đỏ** trên mã cũ.
- **Tầng 8b** (Playwright + `mockLogin` + `page.route` trả 503 cho `GET /api/companion`, theme
  `dark-blue`; ảnh lưu ngoài repo tại
  `/tmp/claude-0/-home-user-dhcb/88aafb10-9d27-57d2-94b0-359edeffb66f/scratchpad/shots-0535/`,
  `truoc-*` / `sau-*`, 1440×900 và 390×844):
  - Trước: không một dòng báo, chỉ tin chào.
  - Sau: giữa thanh studio và "Hình đại diện" có một khung mảnh cao một dòng (hai dòng ở 390px) với
    câu thông báo + nút "Thử lại" bên phải; không đẩy bố cục vỡ, không tràn ngang, tin chào + ô chat
    vẫn ngay bên dưới. Nút Thử lại đo được cao ≥ 44px.
- Cổng ở máy: xem mục "Cổng".

## Cổng

- `rm -rf packages/*/dist dist dist-server && npm run typecheck` → 0; `npm run lint` → 0 (0 cảnh
  báo); `npx prettier --check` mọi file đã đổi → 0; `npm run build` → 0.
- `npx vitest run apps/dhcb/src/{components,pages,lib,data}`: 302 file / 6.151 test xanh, exit 0.
- `npx playwright test e2e/a11y.spec.ts -g "studio Trò chuyện"` (Companion, 3 theme): 3/3 xanh.
  Không chạy `test:coverage` (CI chạy).
