# 0530 — Trả nốt lỗi im lặng giao diện: hội thoại mẫu + hai loader ví dụ phụ (2026-10-08)

- **Ngày:** 2026-10-08 · **PR:** (chưa tạo — commit trên nhánh worktree) · **Loại:** `fix(ui)`
- **Nguồn:** phần còn lại của 0525 (mục "Đã xét, không sửa" / "Còn mở"): `getDialogues()` không có
  nhánh lỗi ở bốn nơi, và `extraExamplesLoader`/`formExamplesLoader` cùng bệnh với
  `patterns/loader.ts` cũ. Tái dùng đúng hai mảnh của 0525: `lib/useAsyncLoad.ts` và `LoadError`
  (prop `lang`). KHÔNG đụng `apps/server`, `packages/`, file cổng.

## Đã làm

### 1. `getDialogues()` hỏng → khối lỗi + Thử lại (không mất hội thoại im lặng, không unhandled rejection)

Trước: `getDialogues(id).then(set)` không có nhánh lỗi. Hội thoại hỏng (mạng chập, 503, quá 15s)
là phần hội thoại **biến mất** mà không báo gì, kèm một unhandled rejection; riêng trang cấp CEFR
còn dựng 13 lời gọi (mỗi unit một lần) cùng hỏng.

Mảnh dùng chung mới: `components/DialogueLoadError.tsx` (bọc `LoadError`, đúng ngôn ngữ chiều học,
câu trấn an "Phần còn lại của bài học vẫn dùng được bình thường.") + câu chữ `LOI_HOI_THOAI_*` /
`GOI_Y_HOI_THOAI_*` trong `lib/curriculumMessages.ts`.

| #   | Nơi gọi                                                                 | Sửa                                                                                                                                                                                                                                                                                        |
| --- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | `studyTabs/TodayLesson.tsx` — `BatchDoneView` (màn "Xong batch")        | `useAsyncLoad` thay state + effect; lỗi → `DialogueLoadError`. Export `BatchDoneView` để test.                                                                                                                                                                                             |
| 2   | `CefrLessonViews.tsx` — `VocabFlash` (mục "Hội thoại mẫu" cuối vòng từ) | `useAsyncLoad`; lỗi → `DialogueLoadError`.                                                                                                                                                                                                                                                 |
| 3   | `CefrLevelPage.tsx` — dữ liệu hội thoại cả cấp (tab Bài học + tab Nghe) | MỘT lần tải cho cả cấp theo từng unit (`loadLevelDialogues`, trả `{ unitId: Dialogue[] }`), thay cho 1 lần ở cấp trang + 13 lần ở từng `UnitSection`. Lỗi → **một** khối lỗi + Thử lại trên tab Bài học và một trên tab Nghe (không lặp 13 khối). `UnitSection` nhận `dialogues` qua prop. |
| 4   | `CefrLevelPage.tsx` — mở hội thoại từ mục lục (`?unit=…&hd=dialogue:…`) | `.then(ok, err)`: lỗi lưu theo khoá màn con (`khoaManCon`, đổi màn thì lỗi cũ hết hiệu lực). Một nút Thử lại chung (`thuLaiHoiThoai`) tải lại hội thoại cả cấp VÀ mở lại bài trên URL; khối lỗi của URL ẩn khi tab Bài học đã có khối lỗi cấp (không hiện hai khối giống nhau).            |

Tab Nghe: chế độ "Chọn nghĩa" vẫn dùng được khi hội thoại lỗi; "Gõ lại" (chép chính tả) quay về chỉ
dùng từ vựng (như trước khi hội thoại về).

### 2. `extraExamplesLoader` + `formExamplesLoader` theo khuôn `patterns/loader.ts`

Trước: `fetch(url).then((r) => r.json())` — không kiểm `res.ok` (503 thành "dữ liệu"), giữ luôn lời
hứa bị từ chối trong cache (Thử lại vô ích tới khi F5), `.then` ở cấp module và trong effect không
có `.catch` (unhandled rejection).

- Khuôn chung mới `data/examplesLoaderFactory.ts` (`createExamplesLoader(url)`): kiểm `res.ok`,
  kiểm hình dạng (object, không phải mảng/null), **chỉ giữ cache khi thành công**. Hai loader chỉ
  còn một dòng gọi khuôn.
- Dữ liệu PHỤ nên nơi gọi chỉ ẩn phần ví dụ thêm, không báo lỗi to: `WordCard.tsx` (nạp sẵn ở cấp
  module + trong effect), `Dictionary.tsx` thêm `.catch`. `WordFormsBlock.tsx` đã có `.catch` từ
  trước — không đổi. Loader không cache lỗi nên lần mount sau tự tải lại.

## Quyết định

- Gom hội thoại cả cấp về một chỗ (mục 3) thay vì mỗi `UnitSection` tự có `useAsyncLoad`: sửa
  "từng nơi" sẽ cho ra 13 khối lỗi giống hệt nhau trên một màn hình, mỗi khối một nút Thử lại, và
  bấm một nút không làm 12 khối kia hết lỗi (mỗi hook tự giữ lượt thử). Dữ liệu vốn là MỘT file.
- Ví dụ phụ: ẩn im lặng là chủ ý (đúng chỉ dẫn "hại thấp") nhưng **không còn** unhandled rejection
  và **không cache lỗi**.

## Bằng chứng

- **Đỏ trước / xanh sau** (đưa file nguồn về bản `HEAD` rồi chạy test mới):
  - `data/examplesLoaders.test.ts` (10 ca: cả hai loader × thành công/mạng/HTTP/JSON/hình dạng) —
    8 ca lỗi **đỏ** trên mã cũ, 10/10 xanh trên mã mới.
  - `components/dialogues.loadError.test.tsx` (7 ca: `VocabFlash` và `BatchDoneView` × lỗi + Thử
    lại + không unhandled rejection / chiều B tiếng Anh / tải được thì không có khối lỗi; `UnitSection`
    nhận hội thoại qua prop) — 4 ca lỗi/Thử lại **đỏ** trên mã cũ (bản test lúc đó), nay 7/7 xanh.
  - `components/WordCard.loadError.test.tsx` (1 ca: ví dụ phụ hỏng, thẻ vẫn hiện, không unhandled
    rejection) — đỏ trên mã cũ, xanh trên mã mới.
  - Ba chỗ gọi ở trang cấp CEFR không dựng được bằng mock unit (trang quá nặng — 0525): thêm 3 ca vào
    `e2e/load-error-states.spec.ts` (tab Bài học: đúng MỘT `role="alert"`, "Phần 1" vẫn hiện, Thử lại
    → mục "Hội thoại" xuất hiện; tab Nghe; mở hội thoại từ mục lục) — axe AA 0 vi phạm trên khối
    lỗi, nút Thử lại cao ≥ 44px. Trên mã cũ các ca này đỏ vì không có khối lỗi nào. Cả file
    `load-error-states.spec.ts`: 6/6 xanh.
- **Tầng 8b** (Playwright + `mockLogin` + `page.route` trả 503 cho `/data/dialogues.json`, theme
  `dark-blue`, 1440×900 và 390×844; ảnh lưu ngoài repo tại
  `/tmp/claude-0/-home-user-dhcb/88aafb10-9d27-57d2-94b0-359edeffb66f/scratchpad/shots-0530/`,
  `truoc-*` / `sau-*`):
  - `/goc-hoc-tap/english/lo-trinh/a1` (tab Bài học) — trước: trang trông bình thường, mục
    "3 · Hội thoại" của mọi phần **biến mất** không một dòng báo; sau: giữa "Mục lục 13 phần" và
    "Phần 1" có đúng một khối "Không tải được dữ liệu — Máy chủ đang gặp sự cố… Phần còn lại của bài
    học vẫn dùng được bình thường." + nút Thử lại.
  - `…/a1?tab=listening` — trước: không báo gì; sau: khối lỗi đúng một lần phía trên "Chọn nghĩa / Gõ
    lại", phần luyện nghe bên dưới vẫn dùng được.
  - Ảnh 390px: khối lỗi vừa khung, không tràn ngang; ảnh trước/sau chỉ khác đúng vùng trạng thái lỗi.
- Cổng ở máy: xem mục "Cổng" bên dưới.

## Cổng

- `rm -rf packages/*/dist dist dist-server && npm run typecheck` → 0; `npm run lint` → 0 (0 cảnh
  báo); `npx prettier --check` mọi file đã đổi → 0; `npm run build` → 0 (worktree không có
  `node_modules` riêng nên build cần liên kết tạm tới `node_modules` của repo chính — plugin
  `dhcb-pyodide-self-host` đọc `node_modules/pyodide`; không phải lỗi của đợt này).
- `npm run test:coverage`: lần 1 đỏ 1 file (`audit-fillblank.test.ts` — `mkdtemp` trong
  `node_modules` của worktree bị mất do chính thao tác dọn thư mục lúc dựng build; chạy riêng: 10/10
  xanh); lần 2 (cả bộ, sạch): **825 file xanh / 18.960 test xanh**, exit 0, qua ngưỡng coverage.
- `npx playwright test e2e/load-error-states.spec.ts`: 6/6 xanh.

## Còn mở

- Quyết định của chủ dự án về lịch sử Companion (`Companion.tsx:93,135`) — vẫn như 0525.
- `DictationPractice` chốt danh sách câu lúc mount: nếu hội thoại về (hoặc Thử lại thành công) SAU
  khi người học đã vào chế độ "Gõ lại" thì câu chép chính tả chưa có câu hội thoại tới lần vào chế độ
  kế tiếp. Hành vi có từ trước đợt này (hội thoại luôn về sau lần mount đầu), không phải hồi quy.
