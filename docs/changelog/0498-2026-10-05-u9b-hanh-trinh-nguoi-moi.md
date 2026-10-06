# 0498 — Đợt U9b audit UI/UX: hành trình người mới nói cùng một điều (2026-10-05)

- **Ngày:** 2026-10-05 · **PR:** #1245 · **Loại:** `fix(ux)`.
- **Phạm vi:** đợt U9b trong `docs/audit/2026-09-30-audit-ui-ux-chuan-2026.md`: **M19** (mục 5),
  **mục 8** (hành trình người mới) và **minor 12** (mục 6). Phần còn lại của U9 (M17, M18,
  M20–M22 — bố cục) KHÔNG thuộc đợt này.
- **Quyết định chủ dự án (2026-10-05) đã áp:** onboarding có "Bỏ qua"; các màn sau onboarding dùng
  đúng lựa chọn vừa chọn; môn Toán/Lý/Hoá mở tab Bài học trước, "AI giải bài tập" sau.

## Đã làm

### 1. Onboarding (`pages/core/Onboarding.tsx`)

- **"Bỏ qua"** ở góc trên mọi bước (kể cả bước chọn môn). Bấm là lưu NGAY những gì đã chọn, phần
  còn lại giữ mặc định hợp lý (người lớn · cơ bản · giao tiếp hằng ngày · 10 phút — chính là giá
  trị khởi tạo của state). Bỏ qua ở bước chọn môn thì CHƯA có môn → về Trang chủ (mời chọn môn),
  KHÔNG tự gán Tiếng Anh (luật "không mặc định tiếng Anh", S06 AC-3).
- **Sự kiện phễu mới `onboarding_skip`** (refCode `onboarding:<bước>` hoặc `onboarding:subject`),
  thêm vào whitelist cả client (`lib/analytics.ts`) lẫn server
  (`apps/server/src/api/platform/analytics.ts`). Không cần migration: bảng sự kiện không có
  ràng buộc CHECK theo loại.
- **Nút chính đứng yên một chỗ:** bỏ căn giữa theo chiều dọc. Điện thoại: cột cao đúng một màn,
  chân trang (nút chính + nút phụ) ghim đáy. Từ `sm`: khối có chiều cao tối thiểu cố định
  (`42rem`) được căn giữa nguyên khối. Mọi bước cùng một khuôn chân trang: nút chính rộng hết +
  nút phụ chữ bên dưới ("Chọn môn khác" ở bước 1, "Quay lại" ở các bước sau — bước "Trình độ"
  trước đây không có lối lùi).
- **`aria-pressed`** cho nút số phút (audit nêu), và cả nút trình độ, nút mục tiêu — cùng hợp đồng
  với nút nhóm tuổi.
- **Nhớ môn đã chọn**: `setChosenSubject(uid, môn)` (`lib/onboarding.ts`, khoá
  `dhcb_onboarding_subject_<uid>`, chỉ cục bộ). Đây là LỰA CHỌN, không phải tiến độ.

### 2. Các màn sau onboarding (chọn "Tiếng Anh · Cơ bản · Giao tiếp hàng ngày · 10 phút")

| Màn                       | Trước                                            | Sau                                                                                                                                                |
| ------------------------- | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Trang chủ — thẻ "Hôm nay" | "Bắt đầu: Chọn môn" (hỏi lại)                    | "Bắt đầu: Học Tiếng Anh" · dòng nguồn "Môn bạn đã chọn" → `/goc-hoc-tap/english`                                                                   |
| Trò chuyện                | mặc định "Phỏng vấn xin việc"                    | theo mục tiêu: hằng ngày → Tán gẫu/xã giao · du lịch → Du lịch/khách sạn · công việc → Họp/thuyết trình · IELTS → Tự do; chưa onboarding → Tán gẫu |
| Tiếng Anh home            | "Bài tiếp theo…" + "Học tiếp" · "0 / 50 từ vựng" | chưa có dấu vết học: "Bài đầu tiên theo lộ trình" + "Bắt đầu" · "Mục tiêu hôm nay: 0 / 10 từ vựng"                                                 |
| Ôn tập                    | "Không có gì đến hạn — quay lại ngày mai"        | người chưa học gì: "Chưa có gì để ôn — bạn chưa học bài nào" + "Bắt đầu học bài đầu tiên" → trang môn đã chọn                                      |
| Bài hội thoại             | mở Bài 1 xong, "Tiếp tục" → Bài 2                | "Tiếp tục" → bài mở gần nhất (Bài 1); đang mở một bài thì gợi ý cột trái là "Bài tiếp theo"; người mới thấy "Bắt đầu"                              |

Chi tiết kỹ thuật:

- `buildTodayPlan` (`packages/core-learner/today/`) nhận thêm `chosenSubject?` — CHỈ có tác dụng
  khi không có tín hiệu nào (`coMat` rỗng). Mục vẫn là `kind:'pick'` (nhãn "Bắt đầu: …"), không
  bao giờ thành "Học tiếp" một bài chưa mở; `subjectsSeen` không bị bịa thêm. Môn lạ ngoài
  `knownSubjectIds` bị bỏ qua. 5 ca test mới.
- Tiếng Anh home: "chưa học gì" dùng ĐÚNG định nghĩa bằng chứng của thẻ "Hôm nay" (`learned` +
  `doneGrammar` + `examPassed` đều rỗng). Mục tiêu ngày = `getDailySpeed` (một lượt), không phải
  `getDailyMax` (trần 5 lượt = 50).
- Ôn tập: "chưa học gì" = kho SRS chung rỗng (gồm cả thẻ `prog:`/`stem:`) + không có lỗi nào +
  chưa nộp bài STEM nào trên máy. Người đã có thẻ nhưng chưa tới hạn vẫn thấy câu cũ.
- Bài hội thoại: `lib/viewedTracking.ts` thêm `markLastOpened`/`getLastOpened`.
- `situationForGoal` ở `lib/onboarding.ts` (tra bằng `hasOwnProperty`, khoá lạ → mặc định).

### 3. Trang chủ khách

- Dưới "Không cần tài khoản": "Đã có tài khoản? **Đăng nhập**" — liên kết chữ tới `/login`, vùng
  chạm 44px, không phải nút chính thứ hai (AC-2 "đúng một CTA" giữ nguyên).

### 4. Minor 12 — trang môn STEM (`pages/learning/SubjectDetail.tsx`)

- Tab mặc định "Bài học & công thức" (tên cũ "Chương Trình & Công Thức"), thứ tự tab: Bài học →
  Bài tập trọng tâm → AI giải bài tập. Có đề truyền vào (`?q=` từ ô hỏi Trang chủ) thì vẫn mở
  thẳng tab giải. Môn không có khung chương trình → rơi về tab giải (lưới an toàn). Ba nút tab
  thêm `type="button"` + `aria-pressed`.
- **Lỗi thật lộ ra nhờ đổi tab mặc định:** nhãn "Công thức & Định lý cốt lõi" dùng
  `${theme.accent}r` — chữ `r` gõ thừa biến lớp thành `theme-light:text-blue-800r` (không tồn tại)
  nên theme sáng rơi về màu `-400` nhạt, trượt AA. Trước đây tab này không phải tab mặc định nên
  cổng a11y không quét tới. Đã bỏ chữ `r`.

### 5. E2E hành trình người mới — `e2e/new-user-journey.spec.ts`

- Ca 1 (390×844): Trang chủ khách → "Đăng nhập" → tab Đăng ký → onboarding Tiếng Anh · Cơ bản ·
  Giao tiếp · 10 phút (đo toạ độ nút chính 4 bước phải TRÙNG nhau; kiểm `aria-pressed`) → Tiếng
  Anh home → Trang chủ → Trò chuyện → Ôn tập, kiểm các câu chữ ở bảng trên.
- Ca 2: "Bỏ qua" ở bước chọn môn → về Trang chủ "Bắt đầu: Chọn môn" + sự kiện
  `onboarding_skip:onboarding:subject` được gửi.
- Cập nhật theo hợp đồng mới: `continue-viewing.spec.ts` (Lessons), `review-hub.spec.ts` (tách
  ca "đã có thẻ chưa tới hạn" khỏi ca "chưa học gì").

## Bằng chứng kiểm chứng

- `npm run typecheck` ✅ · `npm run lint` ✅ (0 cảnh báo) · `npm run format:check` ✅ ·
  `npm run test:coverage` ✅ 792 file / 18.500 test, sàn 95,09 / 90,96 / 95,64 / 95,74 ·
  `npm run build` ✅ · size-limit ✅ (JS đầu 152,66/160 kB, CSS 24,01/26 kB).
- E2E: `a11y.spec.ts` + `a11y-aaa.spec.ts` + `guest-home` + `a11y-intent` — lần đầu đỏ 6 ca ở trang
  môn STEM theme sáng (lỗi `r` thừa ở mục 4), sửa xong chạy lại 27/27 ca STEM xanh; còn lại
  394 ca xanh. Ca AC-6 (CTA < 3 s) đỏ một lần 3.056 ms khi chạy 4 worker lúc Vite biên dịch nguội;
  chạy riêng 3 lần: 994 / 920 / 1.433 ms.
- E2E bộ liên quan (80 ca xanh): `new-user-journey`, `continue-viewing`, `review-hub`,
  `onboarding-by-subject`, `home-clarity-evidence`, `today-plan`, `chat`, `english-subject-home`,
  `outline-stem`, `stem-deep-link`, `landmark-title`, `smoke`, `a11y-intake`, `start-by-intent`.

### Tầng 8b — ảnh trước/sau (1440px + 390px, đã tự nhìn)

- **Onboarding:** trước — nút "Tiếp theo" trôi theo chiều cao nội dung, không có "Bỏ qua". Sau —
  390px: nút chính ghim đáy cùng một toạ độ ở cả 4 bước, "Bỏ qua" góc trên phải, "Quay lại" ngay
  dưới; 1440px: khối căn giữa, nút cùng chỗ giữa các bước. Bước chọn môn hiện "Làm quen · Bỏ qua".
- **Trang chủ (390):** "Bắt đầu: Chọn môn" → "Bắt đầu: Học Tiếng Anh / Môn bạn đã chọn".
- **Tiếng Anh home (390 + 1440):** "0 / 50 từ vựng · Học tiếp" → "Mục tiêu hôm nay: 0 / 10 từ vựng
  · Bài đầu tiên theo lộ trình · Bắt đầu".
- **Trò chuyện:** "Phỏng vấn xin việc" → "Tán gẫu / xã giao".
- **Ôn tập:** thẻ trạng thái mới, nút chính "Bắt đầu học bài đầu tiên".
- **Bài hội thoại sau khi mở Bài 1:** "Tiếp tục · Bài 2" → "Tiếp tục · Bài 1: Giới thiệu bản thân".
- **Toán (1440 + 390):** tab "Bài học & công thức (1)" đứng đầu và đang mở, nội dung chương hiện
  ngay; nhãn "Công thức & Định lý cốt lõi" nay đậm màu ở theme sáng. Ở 390px ba tab xuống hai dòng
  chữ mỗi nút nhưng vẫn vừa một hàng, không tràn ngang.
- **Trang chủ khách:** dòng "Đã có tài khoản? Đăng nhập" dưới "Không cần tài khoản".
- Ghi chú: thanh "Chưa tải được tiến độ · Thử lại" trong ảnh Trang chủ là do mock E2E
  `/api/progress` trả `{ok:true}` — không liên quan đợt này, có cả ở ảnh trước.

## Đề xuất / nợ còn lại (phiên điều phối đồng bộ vào `PROGRESS.md`)

- **Đề xuất, chờ chủ dự án xác nhận:** bảng mục tiêu → tình huống Trò chuyện (hằng ngày → Tán gẫu,
  IELTS → Tự do…) là lựa chọn an toàn của phiên này; đổi chỉ cần sửa `SITUATION_BY_GOAL`.
- **Đề xuất, chờ xác nhận:** tên tab "Bài học & công thức" (nội dung là các chương + công thức của
  khung chương trình; kho bài học có chấm điểm vẫn là thẻ "Vào học …" phía trên).
- Môn đã chọn chỉ lưu CỤC BỘ — thiết bị mới về lại "Bắt đầu: Chọn môn". Muốn đồng bộ phải thêm
  cột `chosen_subject` ở hồ sơ (migration + API) — để đợt sau nếu phễu cho thấy cần.
- "Tiếp tục" ở Câu thông dụng (`CommonPhrases.tsx`) vẫn theo "chủ đề đầu tiên chưa xem" — audit
  chỉ nêu bài hội thoại; nên áp cùng khuôn `getLastOpened` ở một đợt nhỏ sau.
- Bài hội thoại vẫn không có tín hiệu "đã học xong" (nợ S11-1) nên "Tiếp tục" = bài mở gần nhất;
  khi có tín hiệu "xong", "Tiếp tục" nên tự nhảy sang bài kế.
- Chưa đo lại số lần chạm từ trang đăng nhập (audit: 13) — "Bỏ qua" rút ngắn tối đa còn 2 chạm
  sau đăng ký; nên xem sự kiện `onboarding_skip` trên production sau 1–2 tuần.
