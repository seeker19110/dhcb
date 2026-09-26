# feat(programming): nội dung học THẬT cho chặng S1 hướng Kiến trúc (2026-08-27)

**PR:** chưa mở (phiên chính quyết định) · **Nhánh:** `claude/chang-s1-architecture` — nối tiếp
[#716](https://github.com/seeker19110/dhcb/pull/716) và dựng trên nhánh của PR đó.

## Bối cảnh

PR #712 mở bản đồ 13 hướng chuyên sâu; PR #716 soạn nội dung thật cho chặng đầu tiên
(`web-s1`) và ghi việc tiếp theo là **chặng S1 hướng `architecture`**. Đợt này thi hành đúng
việc đó.

Hướng `architecture` là hướng NỀN cắt ngang: nó không dạy công nghệ nào, nó dạy cách chia hệ
thống thành module có ranh giới, viết hợp đồng giữa chúng, và nghiệm thu phần việc mình không
tự gõ. Với người làm việc cùng AI, đây là kỹ năng quyết định chất lượng sản phẩm.

## Vấn đề riêng của hướng này và cách giải

Nội dung ở đây là **kỹ năng đặc tả**, không phải cú pháp — mà khuôn bài học 8 bước bắt buộc
bước ⑥ Make phải **chấm được bằng test-case**. Viết văn về kiến trúc thì máy không chấm nổi.

Cách giải áp cho cả 6 bài: **biến mỗi luật kiến trúc thành MỘT HÀM THUẦN** đọc bản mô tả hệ
thống (dữ liệu) rồi trả về báo cáo vi phạm. Đó đúng là loại máy kiểm mà một dự án thật đặt
trong CI — `npm run codemap -- cycles/hotspots/impact`, lint luật phụ thuộc, test canh gác. Học
viên ra khỏi chặng là có công cụ dùng được, không phải chỉ có ý thức.

## Đã làm

**6 bài học 8 bước mới** trong 3 unit của bậc P6, phủ đủ 4 module của `architecture-s1`, tất cả
dùng `language: 'typescript'` nên đi qua cổng tsc thật (`lessonsTs.test.ts`):

- `p6-u19` — _module có ranh giới & luật phụ thuộc_ (`architecture-s1-m1`, `m2`):
  - l1 **trách nhiệm duy nhất đo được** — Make: máy soát module theo số LÝ DO THAY ĐỔI, xếp
    nặng nhất lên đầu, hoà thì theo tên (báo cáo phải tất định mới đưa vào CI được).
  - l2 **luật phụ thuộc một chiều** — Make: máy canh chiều import theo BẬC TẦNG
    (loi 0 · ungDung 1 · ngoai 2), bỏ qua tự nhập chính mình và tên không có trong bản đồ.
    Lý thuyết có đảo phụ thuộc (lõi khai cổng, ngoài cắm cài đặt) và vòng phụ thuộc.
- `p6-u20` — _vẽ bản đồ & đọc hệ thống người khác_ (`architecture-s1-m3`, `m4`):
  - l1 **bản đồ C4 kiểm được bằng máy** — Make: dò ba bệnh của bản đồ (hộp ma · hộp mồ côi ·
    nhảy tầng). Luận điểm: bản đồ viết dạng DỮ LIỆU thì đặt được vào CI, dạng ảnh thì lệch dần
    khỏi code mà không ai biết.
  - l2 **điểm nóng & vòng phụ thuộc** — Make: fan-in (hoà thì tên A→Z) + dò vòng bằng thuật
    toán **bóc lá**, đúng hai phép đo mà `npm run codemap` cung cấp.
- `p6-u21` — _đặc tả kín & sổ quyết định ADR_ (khuôn giao việc của chính dự án này):
  - l1 **đặc tả kín sáu ô** — Make: cổng chặn đặc tả chưa kín (thiếu ô theo THỨ TỰ CHUẨN → thiếu
    mục KHÔNG LÀM → tiêu chí không đo được, phép thử "câu có con số không").
  - l2 **ADR** — Make: cổng chặn ADR thiếu ô, gồm ca "ô điền toàn dấu cách" (trông như đã điền,
    còn tệ hơn để trống). Nhấn ô "vì sao loại" và "điều kiện xem lại".

**Đăng ký & cầu nối:**

- `packages/subject-programming/curriculum.ts` — 3 unit mới `p6-u19…u21`.
- `packages/subject-programming/lessons.ts` — nạp `P6U19/20/21_LESSONS`.
- `packages/subject-programming/specializations/stageUnits.ts` —
  `'architecture-s1': ['p6-u19', 'p6-u20', 'p6-u21']`. Cổng `stageUnits.test.ts` kiểm chéo cả
  ba đầu (bản đồ hướng · curriculum · lessons) nên khai sai là CI đỏ.

## Quyết định kèm theo

- **Mã unit nối tiếp, không lấn dải người khác.** `p6-u5…u15` thuộc CHƯƠNG TRÌNH M, `p6-u16…u18`
  là Web (#716), nên hướng Kiến trúc bắt đầu từ `p6-u19`. Mã unit là khoá tiến độ Postgres —
  đổi về sau là mất tiến độ người học.
- **Dạy hai khuôn `docs/templates/*` ở S1 dù chương trình xếp chúng ở S3.** Lý do: dự án cuối
  chặng S1 đòi học viên GIAO cho người khác một đề xuất cắt lại ranh giới; không có khuôn đặc
  tả và khuôn ADR thì phần giao việc ấy chỉ là lời nói miệng. Ở S1 chỉ dạy phần **kiểm được
  bằng máy** của hai khuôn, phần nội dung sâu vẫn để dành S3.
- **Không đụng `apps/`.** Trang chi tiết hướng đã tự đọc `SPEC_STAGE_UNITS` từ #716, nên chặng
  mới hiện nút "Vào học" mà không cần sửa giao diện.

## Bằng chứng kiểm chứng

Chạy thật trên nhánh này (output đầy đủ trong mô tả PR khi mở):

- `npx vitest run packages/subject-programming/` — **25 file, 1047 test xanh**, gồm cổng
  "code mẫu đạt HẾT test-case", "ví dụ mẫu chạy không lỗi", "đáp án Predict khớp output thật"
  cho cả 6 bài mới, và 341 test thẻ SRS.
- `npm run typecheck` · `npm run lint` (0 cảnh báo) · `npm run format:check` · `npm run build` ·
  `npm run size` · `npm run test:coverage` (branches ≥ 90) — xem báo cáo trong PR.

## Còn để ngỏ (cố ý)

- Chặng S2–S4 của hướng `architecture` chưa có bài.
- Tiến độ theo HƯỚNG vẫn chưa lưu xuống Postgres (id chặng/module đã ổn định để sau không phải
  di trú) — việc này chung cho cả mạch hướng chuyên sâu, không riêng đợt này.
