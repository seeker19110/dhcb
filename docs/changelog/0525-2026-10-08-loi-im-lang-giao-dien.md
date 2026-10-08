# 0525 — Săn lỗi im lặng phía giao diện: tải hỏng phải hiện LỖI + Thử lại (2026-10-08)

- **Ngày:** 2026-10-08 · **PR:** (chưa tạo) · **Loại:** `fix(ui)` · **Nhánh:** worktree
  `worktree-agent-a6fdc905187aca037`.
- **Nguồn:** đợt rà "lỗi im lặng" (silent failure) phía giao diện `apps/dhcb/src` + `apps/hub/src`
  theo CLAUDE.md mục 4.3 ("mọi thao tác có thể fail đều có nhánh lỗi + trạng thái tải/rỗng/lỗi trên
  UI"). Phía server do một đợt song song khác xử lý — đợt này KHÔNG chạm `apps/server`, `packages/`.

## Cách rà

1. Quét `.catch(() => [] | null | {} | undefined)` và `catch {}` rỗng (77 chỗ).
2. Quét `x = await fetch(...)` không có `x.ok`/`x.status` trong 25 dòng kế tiếp (3 chỗ).
3. Quét `.then(...)` không có nhánh lỗi trong `useEffect`/handler (~60 chỗ), rồi đọc từng chỗ ở
   luồng người học dùng nhiều để xem lỗi đi đâu: **skeleton quay mãi**, **giả làm rỗng**, hay
   **có xử lý ở tầng khác**.

Chỉ sửa chỗ XÁC NHẬN có hại (đọc mã + test đỏ trên mã cũ + ảnh chụp trang thật). Dùng lại
`components/LoadError.tsx` (khối lỗi chuẩn có Thử lại) và `thongDiepLoiThanThien` — không hiện
`err.message` thô.

## Đã làm

Hai mảnh dùng chung mới:

- `lib/useAsyncLoad.ts` — hook chạy một hàm tải bất kỳ, trả `loading | error | ready` + `retry`.
  Cùng ý `useCatalogList` nhưng nhận hàm tải (loader dữ liệu tĩnh, API) thay vì URL danh mục. Đổi
  `loader`/bấm Thử lại thì quay về `loading` ngay trong lượt render (không setState đồng bộ trong
  effect — luật `react-hooks/set-state-in-effect`).
- `LoadError` thêm prop `lang` ('vi' | 'en') cho phần chữ cố định — chiều B (giao diện tiếng Anh)
  không còn thấy khối lỗi tiếng Việt. Mặc định 'vi', mọi chỗ dùng cũ không đổi.

| #   | File                                                                     | Hậu quả với người dùng (trước)                                                                                                                                                                                                                                            | Cách sửa                                                                                                                                                                                  | Test                                                                    |
| --- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| 1   | `pages/subjects/english/CefrLevelPage.tsx`                               | Tải từ điển hỏng → 5 tab học (Hôm nay/Ôn lại/Nghe/Từ khó/Kiểm tra) kẹt "Đang tải từ vựng…" **vĩnh viễn**, không nút nào.                                                                                                                                                  | `useAsyncLoad(loadCurriculum)` → `LoadError` + Thử lại.                                                                                                                                   | `e2e/load-error-states.spec.ts` (trang quá nặng để dựng bằng mock unit) |
| 2   | `components/StudyPanel.tsx` (trang Từ điển)                              | Cùng bệnh #1.                                                                                                                                                                                                                                                             | Như #1; câu lỗi dùng chung `lib/curriculumMessages.ts`.                                                                                                                                   | `StudyPanel.loadError.test.tsx`                                         |
| 3   | `data/patterns/loader.ts`                                                | Không kiểm `res.ok`; **cache lời hứa bị từ chối mãi** (Thử lại vô ích tới khi F5); cache cả body lỗi như dữ liệu; 2 unhandled rejection lúc import. Ảnh chụp: chỉ mục trả 503 → `index.filter is not a function` → **cả trang Luyện nghe sập** về màn "Đã có lỗi xảy ra". | Kiểm HTTP + `Array.isArray`, chỉ cache khi thành công, nuốt lỗi của lượt nạp sẵn. Bỏ `INDEX`/`getIndex` không ai dùng.                                                                    | `data/patterns/loader.test.ts`                                          |
| 4   | `pages/subjects/english/Listening.tsx` — tab Mẫu câu                     | Chỉ mục lỗi → skeleton mãi; mở mẫu lỗi → `opening` kẹt `true` → cả tab thành skeleton mãi.                                                                                                                                                                                | `useAsyncLoad(loadIndex)`; `open()` có try/catch/finally, lỗi hiện trên danh sách kèm Thử lại mở lại đúng mẫu.                                                                            | `Listening.loadError.test.tsx`                                          |
| 5   | `pages/subjects/english/Listening.tsx` — tab Hội thoại                   | `getAllDialogues()` lỗi/quá 15s → skeleton mãi.                                                                                                                                                                                                                           | `useAsyncLoad(getAllDialogues)` + `LoadError`.                                                                                                                                            | `Listening.loadError.test.tsx`                                          |
| 6   | `pages/subjects/english/CommonPhrases.tsx`                               | Chỉ mục lỗi → "Không tìm thấy kết quả phù hợp" (như trang không có chủ đề); mở chủ đề lỗi → `loading` kẹt → **mọi thẻ `disabled` vĩnh viễn**, bấm không phản hồi.                                                                                                         | `useAsyncLoad` + skeleton lúc tải; `openSubject` có try/finally, lỗi hiện kèm Thử lại; "Không tìm thấy kết quả" chỉ khi đã tải xong.                                                      | `CommonPhrases.loadError.test.tsx`                                      |
| 7   | `data/stories/loader.ts` + `Stories.tsx` + `StoryReader.tsx`             | Danh sách lỗi → màn "Chưa có nội dung"; truyện lỗi mạng/5xx → "Không tìm thấy truyện này" (5xx còn bị cache mãi).                                                                                                                                                         | Loader NÉM khi lỗi thật, chỉ `null` khi 404 **hoặc** catch-all SPA trả HTML 200 (id lạ — `server.ts` không trả 404 cho `/data/*`); không cache lỗi. Hai trang hiện `LoadError` + Thử lại. | `data/stories/loader.test.ts`, `Stories.loadError.test.tsx`             |
| 8   | `pages/subjects/english/WordDetail.tsx` (trang công khai SEO)            | Tải từ điển lỗi → vòng xoay quay mãi; vòng xoay không có nhãn cho trình đọc màn hình.                                                                                                                                                                                     | `useAsyncLoad(loadDictionary)` + `LoadError`; vòng xoay `role="status"` + `aria-label`.                                                                                                   | `WordDetail.loadError.test.tsx`                                         |
| 9   | `lib/examPlan.ts` + `pages/learning/ExamPlan.tsx`                        | `fetchExamPlan` trả `null` cho mọi lỗi → mạng chập là trang hiện **form tạo kế hoạch mới** như thể kế hoạch đã mất, đồng thời `setExamRetention(uid, null)` **đặt lại mức nhớ FSRS** (lịch ôn thưa ra ngay trước ngày thi). "Kết thúc kế hoạch" lỗi thì im lặng.          | `fetchExamPlan` NÉM khi lỗi/body lệch; trang hiện `LoadError` và KHÔNG gọi `setExamRetention`; kết thúc lỗi → toast.                                                                      | `examPlan.test.ts` (sửa 1 ca + 3 ca mới), `ExamPlan.loadError.test.tsx` |
| 10  | `lib/friends.ts` + `Friends.tsx` + `AddFriend.tsx` + `chat/ChatList.tsx` | Lỗi tải → "Bạn bè (0) — Chưa có bạn bè nào" (trang Bạn bè, bộ chọn Chat mới); tra mã lỗi → "**Mã kết bạn không tồn tại**" (người được mời bỏ cuộc). Chép link bị chặn → promise trôi, nút như liệt.                                                                       | `fetchFriendsState`/`lookupFriendByCode` NÉM khi lỗi, kiểm body bằng Zod; 3 màn hiện lỗi + Thử lại; chép link lỗi → toast.                                                                | `friends.test.ts` (sửa 4 ca + 1 ca mới), `Friends.loadError.test.tsx`   |
| 11  | `pages/domains/notes/NotesKanban.tsx`                                    | `.catch(() => [])` trên từng lời gọi → nhánh `catch` không bao giờ chạy → mất mạng là bảng **0 việc ở cả hai cột**, như thể việc của người dùng đã biến mất.                                                                                                              | Bỏ `.catch(() => [])`, thêm `loadError` + `LoadError` (cùng khuôn `Notes.tsx`).                                                                                                           | `NotesKanban.loadError.test.tsx`                                        |
| 12  | `data/dictionary/loader.ts`                                              | Câu lỗi "Không tải được dữ liệu từ điển: chunk-000.json" có dấu nên `thongDiepLoiThanThien` hiện **nguyên văn cả tên file** (lộ ra ngay khi sửa #1).                                                                                                                      | Câu lỗi mang mã HTTP (`Tải từ điển chunk-000.json lỗi HTTP 503`) → dịch thành "Máy chủ đang gặp sự cố…".                                                                                  | `data/dictionary/loader.test.ts` (1 ca mới)                             |
| 13  | `lib/preloader.ts`                                                       | `preloadLearnData` để lỗi từ điển lọt thành unhandled rejection (caller gọi `void`) và giữ cờ `learn = true` → cả phiên không nạp trước nữa.                                                                                                                              | Bắt lỗi, mở khoá cờ để lần sau nạp lại; màn đang hiện tự báo lỗi.                                                                                                                         | `lib/preloader.test.ts`                                                 |

## Đã xét, không sửa (ghi lại để đợt sau)

- `Companion.tsx:93,135` — nạp trạng thái chủ động + lịch sử hội thoại `.catch(() => {})`: có chú
  thích quyết định "lỗi mạng thì im lặng giữ tin chào". Lịch sử không về được thì người dùng tưởng
  mất hội thoại cũ — **nên** thêm một dòng báo nhẹ, nhưng đổi hành vi Companion cần chủ dự án quyết.
- `MemoryPalaceCard`, `MetacognitiveJournalCard`, `MemoryPalaceExplorerModal`,
  `MetacognitiveReflectionModal` — `.catch(() => {})`/`null`: thẻ vẫn hiện mô tả mặc định, chỉ mất
  dòng số liệu phụ. Hại thấp.
- `LifeSynthesisDashboard` — chưa gắn vào giao diện (changelog 0475); còn hiện số bịa `|| 88`/`|| 92`
  khi không có dữ liệu — phải sửa trước khi bật lại.
- `data/extraExamplesLoader.ts`, `data/formExamplesLoader.ts` — không kiểm `res.ok`, cache lời hứa
  bị từ chối, `.then` lúc import không có nhánh lỗi (unhandled rejection). Dữ liệu PHỤ (ví dụ bổ
  sung) nên hại thấp; sửa cùng khuôn `patterns/loader.ts` khi chạm tới.
- `CefrLevelPage.tsx:507,1336`, `CefrLessonViews.tsx:352`, `TodayLesson.tsx:133` — `getDialogues()`
  không nhánh lỗi: mất phần hội thoại của unit (không kẹt màn hình) + unhandled rejection. Nên làm đợt
  sau bằng `useAsyncLoad`.
- `ReferralSection`/`CompanionLinkSection` — lỗi thì ẩn cả khối: quyết định có chú thích (không gây
  rối trang Hồ sơ). `Home.tsx` quests, `Dashboard`/`VipPlanSummary` weekly credit, `QuestsPanel` — đã
  có nhánh lỗi riêng.
- Tiến độ môn Lập trình (`fetchProgress`/`fetchSpecProgress`/`fetchPathProgress`) trả cache cục bộ
  khi lỗi — thiết kế offline-first có chủ đích (`fetchProgressWithState` có cờ `error` cho chỗ cần).
- Admin `res.json().catch(() => ({}))` (14 chỗ) — chỉ dùng để đọc `error` của body lỗi SAU khi đã
  kiểm `res.ok`: đúng.
- `passwordApi.ts` — đọc JSON trước khi kiểm `ok`, nhưng HTML 502 → `SyntaxError` được
  `thongDiepLoiThanThien` dịch đúng: không hại.
- `apps/hub/src` — `HubLogin` đã có nhánh lỗi; không thấy chỗ nuốt lỗi gây hại.

## Bằng chứng

- **Đỏ trước / xanh sau:** chép bản `HEAD` của 18 file nguồn vào worktree rồi chạy 14 file test mới/sửa:
  **14/14 file đỏ, 40 ca hỏng** (73 ca); trả mã mới về: xanh hết.
- E2E mới `e2e/load-error-states.spec.ts` (máy chủ trả 503 → khối lỗi → mạng hồi → Thử lại → nội
  dung hiện; axe AA 0 vi phạm trên khối lỗi; nút Thử lại cao ≥ 44px): 3/3 xanh. Trước khi sửa #12
  spec này đỏ đúng chỗ — khối lỗi in "Không tải được dữ liệu từ điển: chunk-000.json".
- **Tầng 8b** (Playwright + `mockLogin` + `page.route` trả 503, theme `dark-blue`, 1440×900 và
  390×844, ảnh lưu ngoài repo ở scratchpad phiên; cả 20 ảnh đều cao đúng 1 khung nhìn — không trang nào
  dài hơn, không câu chữ lặp):
  - `/goc-hoc-tap/english/lo-trinh/a1?tab=today` — trước: khung "Đang tải từ vựng…" đứng yên; sau:
    khối lỗi "Máy chủ đang gặp sự cố — thử lại sau ít phút." + "Từ bạn đã học và lịch ôn vẫn được giữ
    nguyên." + nút Thử lại.
  - `/goc-hoc-tap/english/luyen-nghe` — trước: **cả trang sập** về màn "Đã có lỗi xảy ra / Tải lại
    trang" (mất luôn thanh tab); sau: thanh tab còn nguyên, khối lỗi + Thử lại.
  - `/ban-be` — trước: "Bạn bè (0) · Chưa có bạn bè nào — chia sẻ link/QR ở trên" (không có link/QR
    nào ở trên); sau: khối lỗi "Bạn bè của bạn vẫn còn nguyên…" phía trên lối vào "Đi chung".
  - `/goc-hoc-tap/english/on-thi` — trước: form "Ngày thi… Bắt đầu đếm ngược" như chưa có kế hoạch;
    sau: khối lỗi "Kế hoạch ôn thi của bạn vẫn còn nguyên…".
  - `/goc-hoc-tap/english/truyen` — trước: "Chưa có nội dung."; sau: khối lỗi + Thử lại.
  - Ảnh 390px trước/sau chỉ khác ở đúng vùng trạng thái lỗi (cố ý); phần khung trang giữ nguyên.
- Cổng ở máy (worktree, máy đang tải nặng — load average 10–19 do các tác tử song song):
  - `rm -rf packages/*/dist dist dist-server && npm run typecheck` → 0; `npm run lint` → 0
    (0 cảnh báo); `npx prettier --check` các file đã đổi → 0; `npm run build` → 0; `npm run size` → 0
    (JS 154,56/160 kB, CSS 23,95/26 kB).
  - `npm run test:coverage` hai lần đỏ chỉ vì **hết giờ dưới tải** ở file KHÔNG liên quan
    (`tsPrelude.test.ts` 5s, `scanGraph`/`no-control-chars` 30s — TRAPS mục 7); chạy riêng lẻ: xanh.
    Chạy lại `vitest run --coverage --testTimeout 30000 --exclude scripts/no-control-chars.test.ts`
    (file bị loại không thuộc phạm vi đo coverage): **821 file / 18.910 test xanh**, coverage
    95,54 / 91,46 / 96,03 / 96,19 — trên sàn; `no-control-chars` + `changelog` chạy riêng: xanh.
  - `npx playwright test e2e/a11y.spec.ts e2e/load-error-states.spec.ts` → **239/239 xanh**.

## Còn mở

- Các mục "Đã xét, không sửa" ở trên — ưu tiên: `getDialogues()` ở trang cấp CEFR, hai loader ví dụ
  phụ, quyết định của chủ dự án về lịch sử Companion.
