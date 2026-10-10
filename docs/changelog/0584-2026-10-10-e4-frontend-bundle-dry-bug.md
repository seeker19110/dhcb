# 0584 — Đợt E4 audit: bundle khởi động + trang chặng nạp lười, gộp code chép, 2 bug nhỏ

- **Ngày:** 2026-10-10 · **PR:** (xem mô tả PR) · **Loại:** `perf(app)`
- **Nguồn:** báo cáo `docs/audit/2026-10-10-audit-toan-dien-va-toi-uu.md` mục E4 (1–6). Người dùng
  yêu cầu "làm tiếp tất cả các đợt khác". Không có migration, không đổi API.

## Đã làm

1. **Bundle khởi động** (E4.1):
   - `unlockAudio` + thẻ `<audio>` dùng chung tách sang `apps/dhcb/src/lib/sharedAudio.ts` (không
     import gì). `main.tsx` import từ đây thay vì `lib/tts` — trước đó cả `tts.ts` (~31 KB nguồn)
     - `voiceTiers` + `audioCache` nằm trong entry của MỌI trang. `tts.ts` vẫn re-export
       `unlockAudio` nên ~30 nơi import cũ không đổi.
   - `AuthProvider` nạp ĐỘNG `audioCache` (dọn cache khi đăng xuất) và `voiceTiers` (lưu giọng
     theo gói), có `.catch` ghi cảnh báo.
   - Trang chặng hướng chuyên sâu nạp lười chi tiết chặng qua
     `packages/subject-programming/specializations/stageDetailsLoader.ts` (mỗi chặng một chunk).
     Trang có trạng thái **đang tải** (`role="status"`, không nháy ghi chú "chưa soạn") và **lỗi**
     (`role="alert"` + nút "Thử lại"). Server/test vẫn dùng `stageDetails.ts` đồng bộ; test
     `stageDetailsLoader.test.ts` canh hai nơi không lệch nhau.
   - `usePrefetchPages` (`App.tsx`) nuốt lỗi mạng của lượt nạp trước (trước đó thành unhandled
     rejection). Phần bỏ nạp trước khi bật Data Saver trùng với PR #1336 (PageSpeed, merge cùng
     ngày) — lúc gộp `main` giữ bản của #1336 (`runWhenPageSettled`).
   - `startupBundle.test.ts` thêm 2 canh: `main.tsx` không import `lib/tts`; `AuthProvider` không
     import tĩnh `audioCache`/`voiceTiers`/`tts`.
2. **DRY** (E4.2) — mọi chỗ gộp đều GIỮ NGUYÊN TỪNG BIT đầu ra (vân tay phiên học trong
   localStorage, thứ tự câu hỏi, thứ tự dòng Parsons là thứ đã lưu / người học đang thấy):
   - `fnv1a32` (`packages/core-contracts/seededRandom.ts`) thay 4 bản chép (`learningSession`,
     `fillBlankQuestions#fnvRank` làn 1, `dialogueComprehension`, `parsonsShuffle`).
   - `mulberry32` một bản ở gói lá `packages/core-grading/mulberry32.ts` (thay 2 bản), re-export
     qua `seededRandom.ts`. **Không** đặt ở `core-contracts` vì `core-contracts` đã phụ thuộc
     `core-grading` — đặt ngược sẽ thành vòng tham chiếu `tsc -b`.
   - `parsonsShuffle` dùng `shuffle` (Fisher–Yates) chung; GIỮ bộ sinh xorshift riêng (đổi sang
     mulberry32 là đổi thứ tự dòng của mọi bài Parsons).
   - Ngày theo giờ VN: một nguồn `packages/core-contracts/vnDate.ts`; `apps/dhcb/src/lib/date.ts`
     và `packages/core-db/date.ts` chỉ re-export (xoá ghi chú "PHẢI khớp nhau" giữa hai bản chép).
     `core-db` thêm tham chiếu tới `core-contracts`.
   - `readLocalArray` (`apps/dhcb/src/lib/localJson.ts`) thay 8 bản try/catch đọc mảng JSON từ
     localStorage. Phần GHI cố ý không gộp (nơi nuốt lỗi quota, nơi để lỗi nổi lên).
   - `khongDau` (`packages/subject-programming/khongDau.ts`) thay 3 bản y hệt trong
     `hermesSim`/`openclawSim`/`vibeSim`.
3. **Bug** (E4.3):
   - `AmbientScreenCopilot.tsx`: dừng chia sẻ màn hình từ thanh của TRÌNH DUYỆT không đưa panel về
     "Chưa kích hoạt" (listener `ended` giữ closure lúc `stream` còn null). Nay đọc luồng qua ref,
     callback ổn định.
   - `useOnboarding` (`lib/onboarding.ts`): đổi tài khoản/đăng xuất mà người mới chưa có hồ sơ
     thì vẫn trả dữ liệu người trước (theme "Nhi đồng" có thể còn khoá). State nay gắn kèm uid.
4. **React** (E4.4): `Layout` memo `getStreak` (vòng tới 365 ngày đọc localStorage) theo chuỗi thô
   usage HÔM NAY (`getTodayUsageRaw`, 1 lần đọc) — học buổi đầu trong ngày vẫn cập nhật số ngay;
   `ThemeProvider` memo `setTheme` + `value` của context.
5. **Export chết** (E4.5) đã xoá: `fetchMyFeedback`, `duongDanActionCanvas`, `DAILY_MAX`,
   `getActiveUid`, `_resetGoogleMapsLoaderForTests`, `SESSION_DURATION_MINUTES`,
   `DEFAULT_DURATION_MINUTES` (ghi chú "không có lựa chọn vĩnh viễn" chuyển sang dòng schema).
6. **Tài liệu** (E4.6): `docs/claude-md-chi-tiet.md` §6 thêm mô tả 8 gói `core-*` còn thiếu +
   chiều phụ thuộc `core-contracts → core-grading`.

## Quyết định — phần KHÔNG làm (kèm lý do)

- **E4.1b (hợp đồng trên đường trang chủ → `zod/mini`) HOÃN.** Đo bản build thật: route `/` kéo
  `vendor-zod` (11,8 kB gzip) qua **10 file** (`cefrDialogueCheck`, `todayPlan`,
  `subjectManifest`, `outline`, `version`, `learnerIntent`, `completionEvidence`, `shared` +
  `lib/learningSession`, `lib/learningQuestionDraft`), không phải 4 như báo cáo ước tính; trong đó
  `version.ts#versionedObject` được **38 hợp đồng** khác dùng (nhiều cái server dùng, gọi tiếp
  `.extend`/`.refine` kiểu classic). Đổi là sửa thông báo lỗi validate ở server + ~150 lời gọi
  method, để đổi lấy ~12 kB trên một route vốn đã nạp lười. Cách làm khi muốn: thêm
  `versionedObjectMini` riêng cho nhóm này thay vì đổi `versionedObject` chung.
- **3 helper fetch-kèm-auth** không gộp: mỗi cái trả kiểu kết quả khác nhau (`Response | null`,
  `SendOutcome` của hàng đợi đồng bộ, ném lỗi) — gộp là đổi hợp đồng lỗi của từng luồng.
- **5 bản bỏ dấu tiếng Việt còn lại** (lọc tên xấu bảng xếp hạng, kiểm duyệt chat, tên dành riêng,
  câu xác nhận xoá tài khoản, ước lượng âm tiết) KHÔNG gộp: khác nhau CÓ CHỦ ĐÍCH về hoa/thường,
  `đ→d`/`Đ→D`, gộp khoảng trắng — và 3 cái là bộ lọc an ninh, đổi luật là đổi cái bị chặn.

## Bằng chứng kiểm chứng

| Kiểm                                                                   | Trước             | Sau                                     |
| ---------------------------------------------------------------------- | ----------------- | --------------------------------------- |
| JS khởi động (cộng MỌI file `index.html` tải, gzip-9)                  | 160.673 B         | 157.118 B (−3,5 kB)                     |
| Chunk `ProgrammingSpecStagePage` (thô / gzip-9)                        | 542 kB / 139,6 kB | 16,6 kB / 4,9 kB + 1 chunk chặng 4–8 kB |
| Giá trị vàng `contentFingerprint`/`fnvRank`/`parsonsShuffle` (6 chuỗi) | —                 | trùng khớp từng byte trước/sau          |

- `seededRandom.test.ts` giữ bản chép cũ làm đối chứng: `fnv1a32` trùng mọi biến thể cũ +
  vector chuẩn FNV-1a; `mulberry32` trùng 1.000 số đầu với 6 seed.
- Test hồi quy bug ĐỎ trên code cũ, XANH trên code mới (đã chạy cả hai):
  `AmbientScreenCopilot.test.tsx` (1/3 đỏ trên bản cũ), `onboarding.test.tsx` (3/3 ca mới đỏ trên
  bản cũ).
- Cổng (typecheck sạch, lint, format, test:coverage, build, Tầng 8b): xem mô tả PR.
