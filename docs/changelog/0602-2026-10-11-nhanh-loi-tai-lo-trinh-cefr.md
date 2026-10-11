# 0602 — Tải lộ trình CEFR lỗi thì báo lỗi + Thử lại, không kẹt khung xương

- **Ngày:** 2026-10-11 · **PR:** (xem mô tả PR) · **Loại:** `fix(english)`
- **Nguồn việc:** mục "Còn mở" (4) của nợ Tầng 8 trong `PROGRESS.md`, ghi ở đợt 0601. Ca E2E thứ 3
  của đợt 0601 đã lộ lỗi này trên mã cũ.

## Lỗi

Ba trang tự viết `Promise.all([loadCefr(), loadFoundationIndex()]).then(...)` **không có nhánh
lỗi**. Mạng chập một nhịp (hoặc máy chủ trả 5xx khi deploy) là promise reject, state đứng yên:

| Trang                                                    | Triệu chứng                        |
| -------------------------------------------------------- | ---------------------------------- |
| Trang cấp CEFR (`/goc-hoc-tap/english/lo-trinh/a1`…)     | Kẹt khung xương vĩnh viễn          |
| Lộ trình (`/goc-hoc-tap/english/lo-trinh`, `RoadmapTab`) | Kẹt "Đang tải lộ trình…" vĩnh viễn |
| Trang môn (`/goc-hoc-tap/english`)                       | Thẻ "Học tiếp" biến mất im lặng    |

Cả ba còn để lại unhandled rejection. Ghi chú cũ trong PROGRESS nhắc cả Home — sai: `Home.tsx` và
`useTodayPlan` đã có `.catch`/`.finally` từ trước, nên đợt này không đụng tới.

Lỗi phụ: `cefrLoader` / `curriculumLoader` ném câu tiếng Việt cố định ("Không tải được dữ liệu
CEFR"). `friendlyError` giữ nguyên câu có dấu, nên giao diện chiều B (tiếng Anh) cũng hiện tiếng
Việt, và không phân biệt được lỗi máy chủ với lỗi mạng.

## Đã làm

- **`apps/dhcb/src/data/cefrOverviewLoader.ts` (mới)** — `loadCefrOverview()` gom `cefr.json` +
  chỉ mục vòng thành `{ levels, circleById }`. Hàm cấp module (tham chiếu ổn định) để đưa thẳng
  vào `useAsyncLoad`; hai loader con tự quên promise khi lỗi nên Thử lại là tải lại thật.
- **Trang cấp CEFR, `RoadmapTab`, `EnglishHome`** dùng `useAsyncLoad(loadCefrOverview)`:
  - Lỗi → `LoadError` + Thử lại. Trang cấp và Lộ trình hiện khối lỗi thay cho khung xương/dòng
    chờ; trang môn hiện khối lỗi ngay chỗ thẻ "Học tiếp".
  - Hằng rỗng ổn định (`NO_LEVELS`, `NO_CIRCLES`) khi chưa có dữ liệu, để các `useMemo` phụ thuộc
    không tính lại mỗi render.
- **Câu chữ mới** ở `lib/curriculumMessages.ts`: `LOI_LO_TRINH_*` + `GOI_Y_LO_TRINH_*` ("Tiến độ
  học của bạn vẫn được giữ nguyên.").
- **Loader ném `<nhãn> HTTP <mã>`** (cùng khuôn `dialoguesLoader`) để `friendlyError` dịch đúng
  ngôn ngữ giao diện ("Máy chủ đang gặp sự cố — thử lại sau ít phút." / "The server is having
  trouble…").

## Bằng chứng

- **E2E mới trong `e2e/load-error-states.spec.ts`** (4 ca; route trả 503 → khối lỗi đạt axe AA,
  nút Thử lại ≥ 44px → mạng hồi → bấm Thử lại → nội dung):
  1. Trang cấp, `cefr.json` lỗi.
  2. Trang cấp, `curriculum-index.json` lỗi.
  3. Lộ trình, `cefr.json` lỗi (không còn "Đang tải lộ trình…").
  4. Trang môn, chỉ mục lỗi → khối lỗi ở chỗ "Học tiếp"; Thử lại → nút Bắt đầu/Học tiếp.

  Bản mới: cả file 10/10 xanh. **Bản cũ (cất tạm phần sửa `apps/dhcb/src`): 4 ca mới đỏ cả 4**
  (khối lỗi không bao giờ hiện, chờ hết 60 s).

- **Unit:** `cefrOverviewLoader.test.ts` (gom đúng + một nguồn lỗi thì reject);
  `curriculumLoader.test.ts` kiểm câu lỗi dạng `HTTP 5xx`.
- **Tầng 8b:** chụp trạng thái lỗi của 3 trang ở 1440 + 390 (theme Blue sky), xem bằng mắt: khối
  lỗi đúng chỗ, không tràn ngang, trang môn vẫn giữ phần còn lại (công cụ, tài nguyên). Trạng thái
  bình thường không đổi đường vẽ (chỉ đổi nguồn state), các E2E hiện có của ba trang vẫn xanh.
