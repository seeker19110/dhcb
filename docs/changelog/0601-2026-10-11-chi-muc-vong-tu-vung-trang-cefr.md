# 0601 — Trang cấp CEFR không chờ dữ liệu nặng: bản tóm tắt vòng từ vựng + hoãn tải

- **Ngày:** 2026-10-11 · **PR:** (xem mô tả PR) · **Loại:** `perf(english)`
- **Nguồn việc:** nợ Tầng 8 trong `PROGRESS.md` ("Dictionary + trang CEFR" chưa đo). Người dùng
  duyệt phương án trong phiên sau khi xem số đo.

## Đo trên production (Lighthouse 13.5 mobile, cấu hình PageSpeed, 3 lượt)

| Trang       | Điểm  | FCP   | LCP   | TBT        | CLS   |
| ----------- | ----- | ----- | ----- | ---------- | ----- |
| Trang chủ   | 99    | 1,1 s | 1,1 s | 30 ms      | 0     |
| Từ điển     | 91–93 | 2,1 s | 2,8 s | 80–90 ms   | 0     |
| Cấp CEFR B1 | 83–85 | 2,2 s | 3,1 s | 190–280 ms | 0,012 |

- Trang chủ xác nhận số đo của đợt 0584 sau deploy. A11y/BP/SEO 100 cả ba trang.
- Lượt đầu chạy mặc định báo NO_FCP; nâng `--max-wait-for-fcp` thì chạy ổn. Đây là do mạng
  container: trang có khung xương vẽ ngay.
- **Đo Slow 4G thật** (CDP 1,6 Mbps / 150 ms, Playwright) trang cấp B1: **6,3–7,3 s** mới hiện
  nội dung.

## Chẩn đoán

1. Trang cấp đợi `Promise.all([loadCefr(), loadFoundation()])` mới vẽ. Trong đó
   `curriculum.json` nặng **3,6 MB thô / 971 KB brotli** (Cloudflare): nghĩa, câu ví dụ, phiên âm
   của 671 vòng.
   - Trang tổng quan chỉ cần tên vòng và danh sách TỪ để đếm "đã thuộc x/N".
   - Cũng file đó được Home (đã đăng nhập), EnglishHome, lộ trình, bảng tiến độ môn, mục lục và
     thống kê tải chỉ để đếm.
2. `useAsyncLoad(loadCurriculum)` bắn ngay lúc mount: thêm 10 chunk từ điển (~0,9 MB nén) giành
   băng thông với nội dung đầu tiên.
3. `WordCard.tsx` / `WordFormsBlock.tsx` tự tải `extra-examples.json` + `form-examples.json` NGAY
   LÚC IMPORT module. Trang cấp import chúng từ đầu, dù người học chưa mở thẻ nào.
4. `CefrLessonViews` lấy `InlinePronounce` qua cả `Lessons.tsx`. Trang Lessons kéo theo
   `lessons/loader`, module này tự tải `/data/lessons/index.json` lúc import.

## Đã làm

- **`apps/dhcb/public/data/curriculum-index.json`** — bản tóm tắt: `id · titleVi · titleEn ·
emoji · notForKids? · words[{word}]`.
  - Dung lượng: 308 KB thô, ~53 KB brotli (nhẹ hơn ~13 lần).
  - Khuôn duy nhất ở `apps/dhcb/src/data/curriculumIndex.ts`.
  - Sinh bằng `npm run gen:curriculum-index` (`scripts/gen-curriculum-index.ts`).
  - `scripts/archive/gen-curriculum-json.ts` sinh kèm.
  - `curriculumIndex.test.ts` đỏ khi hai file lệch.
- **Kiểu `CircleSummary`** (`curriculumTypes.ts`). Các hàm đếm (`cefrProgress`, `stats`,
  `cefrOutline`, `englishNext`) nhận kiểu này. `Circle` đầy đủ vẫn gán được, nên không nơi gọi
  nào phải đổi.
- **`loadFoundationIndex()`** (`curriculumLoader.ts`, chung khuôn nhớ-promise với
  `loadFoundation`). Đổi sang bản tóm tắt ở: Home, `useTodayPlan`, EnglishHome, RoadmapTab,
  `subjectProgressBoard`, `buildIntentOutlines`, `stats`.
- **Trang cấp CEFR:**
  - Vẽ ngay khi có `cefr.json` + bản tóm tắt.
  - `loadCurriculum` và bản đầy đủ chỉ bắt đầu khi trang đã `ready` (loader `CHUA_TAI` giữ
    `useAsyncLoad` ở trạng thái chờ).
  - Thẻ từ tra vòng ĐẦY ĐỦ theo id. Chưa về thì hiện "Đang tải từ vựng…"; lỗi thì hiện
    `LoadError` + Thử lại.
- **`WordCard` / `WordFormsBlock`:** bỏ lượt tải lúc import. `useEffect` sẵn có vẫn nạp khi thẻ
  đầu tiên mount.
- **`CefrLessonViews`:** import `InlinePronounce` thẳng từ file con.

## Bằng chứng

- **Đo cục bộ trước/sau** — bản build production, máy chủ tĩnh mô phỏng nginx (brotli, cache
  immutable, `/api` trả đúng phản hồi production của khách), 3 lượt mỗi bản.
  - **Đường Slow 4G dùng chung** (1,6 Mbps + 150 ms RTT do máy chủ bóp; CDP không bóp được
    127.0.0.1). LCP trang cấp B1:

    | Bản   | LCP             |
    | ----- | --------------- |
    | Trước | 13,66–13,70 s   |
    | Sau   | **5,34–5,55 s** |

    Giảm khoảng 60%. Dữ liệu tải trước nội dung: 1.596 → 1.176 KB (thô).

  - **Lighthouse mobile (Lantern mô phỏng):**

    | Bản   | Điểm  | LCP       | TBT        |
    | ----- | ----- | --------- | ---------- |
    | Trước | 71–74 | 5,8–6,4 s | 120–190 ms |
    | Sau   | 75–77 | 5,3–5,7 s | 70–110 ms  |

    Lantern ít ghi nhận việc gỡ tải song song. Phần LCP còn lại là chuỗi chunk JS (~1,1 MB thô
    trước nội dung).
- **E2E mới `e2e/cefr-level-fast-paint.spec.ts`** (giữ request nặng, không trả). Ba bất biến:
  1. Danh sách bài hiện ra khi `curriculum.json` + từ điển còn treo.
  2. Mở thẻ từ lúc chưa về → "Đang tải từ vựng…", về rồi → thẻ từ.
  3. Bản đầy đủ lỗi → khối lỗi + Thử lại → thẻ từ.

  Kết quả: bản mới 3/3 xanh; **bản cũ đỏ cả 3**. Ca 3 lộ thêm lỗi im lặng có sẵn: bản cũ hỏng
  `curriculum.json` là kẹt khung xương vĩnh viễn, vì `Promise.all(...).then` không có nhánh lỗi.

- **E2E liên quan chạy ở máy:** load-error-states, outline-english, today-plan, comeback,
  home-clarity-evidence, ux-r3-4-english-disclosure-evidence, s07-matrix, cefr-tab-touch-target,
  audit-cefr-assessment, smoke — **157/157 xanh**.
- **Unit:**
  - `curriculumIndex.test.ts` (khuôn + đồng bộ file).
  - `curriculumLoader.test.ts` chạy cho cả hai loader.
  - Mock của Home / EnglishHome / `subjectProgressBoard` đổi sang `loadFoundationIndex`.
  - `WordFormsBlock.test.tsx` mount thật để effect nạp ví dụ.
- **Tầng 8b:** ảnh A1 ở 1440 + 390, trước/sau.
  - Danh sách và thẻ từ **trùng từng pixel** (`ImageChops.difference` = rỗng).
  - Trạng thái mới "Đang tải từ vựng…" dùng đúng ô chờ sẵn có của các tab học, ở cả hai bề rộng.

## Còn mở

- Từ điển (2,8 s) và CEFR vẫn trên ngân sách LCP 2,5 s mobile. Phần còn lại là chuỗi chunk JS
  (`CefrLevelPage` kéo ~90 chunk); tách chunk là đợt riêng.
- `Promise.all([loadCefr(), loadFoundationIndex()]).then(...)` ở trang cấp, Home, EnglishHome,
  RoadmapTab vẫn không có nhánh lỗi. Đợt này giữ nguyên hành vi để không phình phạm vi; nên chuyển
  sang `useAsyncLoad` ở đợt sau.
