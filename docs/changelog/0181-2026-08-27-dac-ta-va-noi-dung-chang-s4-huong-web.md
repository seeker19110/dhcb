# docs+feat(programming): đặc tả chặng S4 cho 13 hướng + nội dung học THẬT cho `web-s4` (2026-08-27)

**PR:** [#720](https://github.com/seeker19110/dhcb/pull/720) · **Nhánh:** `claude/spec-s4-13-huong-t559fn`

## Bối cảnh

PR #712 mở bản đồ 13 hướng chuyên sâu (52 chặng), PR #716 soạn nội dung thật cho hai chặng S1
(`web-s1`, `architecture-s1`). Chặng **S4 — bậc chuyên gia** thì cả 13 hướng đều mới có bản đồ,
chưa hướng nào có bài. Đợt này làm hai việc: **viết đặc tả giao việc cho cả 13 hướng**, rồi
**thi hành đợt 1 (hướng Web)** để chứng minh đặc tả chạy được chứ không chỉ đẹp trên giấy.

## Đã làm

- **Đặc tả `docs/specs/2026-08-27-chang-s4-13-huong.md`** theo khuôn 6 ô của
  `docs/templates/dac-ta-tinh-nang.md`: phạm vi (có mục "KHÔNG làm"), điểm chạm file, hợp đồng
  dữ liệu + bảng ca lỗi, tiêu chí chấp nhận đo được, bất biến + test canh, quy ước dự án. Kèm
  **bảng cấp mã unit chốt cứng `p6-u22`…`p6-u60`** (3 unit/hướng) và thứ tự thi hành 13 đợt.
- **3 unit / 6 bài học 8 bước mới cho chặng `web-s4`**, đều ngôn ngữ `typescript`:
  - `p6-u22` — _thời gian thực_ (`web-s4-m1`): l1 **hoà giải gói tin theo `seq`** (ba ca trùng /
    tới sớm / đúng lượt, tính lũy đẳng khi gửi lại), l2 **presence bằng dấu vết sống + TTL**
    (một người nhiều kết nối; "bây giờ" là tham số nên test được).
  - `p6-u23` — _offline_ (`web-s4-m2`): l1 **chọn chiến lược cache** (cache-first / network-first
    / SWR, luật riêng tư chặn trước luật hash), l2 **hàng đợi ghi offline + LWW tất định**
    (bỏ trùng theo id, phá hoà bằng mã thiết bị).
  - `p6-u24` — _vận hành_ (`web-s4-m3`): l1 **phân vị nearest-rank** (vì sao trung bình nói dối,
    bẫy `.sort()` so chuỗi), l2 **cảnh báo theo triệu chứng người dùng** (SLO → ngân sách lỗi →
    tốc độ tiêu, luật hai cửa sổ).
- Khai `SPEC_STAGE_UNITS['web-s4']`, 3 unit vào bậc P6 của `curriculum.ts`, 3 import vào
  `lessons.ts`.

## Quyết định kèm theo

- **Luật số 1 của chặng S4: dạy PHÁN ĐOÁN, không dạy hạ tầng.** Bộ chạy bài học không có mạng,
  không có tiến trình thứ hai, không có service worker — mà thứ khiến hệ thời gian thực hỏng
  cũng không phải cú pháp `new WebSocket(...)`. Nên mỗi bài quy về MỘT quyết định của chuyên gia
  rồi mô phỏng tất định bằng hàm thuần, **chấm được bằng test-case**. Đây là cùng nguyên tắc đã
  dùng ở `web-s1` (không dạy cú pháp React vì không chấm được).
- **Module `web-s4-m4` (dẫn dắt kỹ thuật) cố ý KHÔNG có bài.** Phần ADR đã có bài thật ở
  `p6-u21`; review code và ước lượng thì không quy được về test-case. Theo luật trên thì phải để
  ngỏ chứ không lấp bằng bài lý thuyết suông — ghi rõ trong comment đầu `p6u24.ts`.
- **Chốt dải mã unit trước khi 13 đợt chạy song song.** Mã unit là khoá tiến độ Postgres, đổi về
  sau rất đắt; chia dải trong đặc tả để hai PR hướng khác nhau không tranh mã của nhau. Dải
  `p6-u61` trở đi để dành cho S2/S3.
- **Cố ý nhảy cóc S2/S3.** Làm đích cuối trước để 13 hướng có "trần" nhìn thấy được.

## Bằng chứng kiểm chứng

- Cổng nội dung bắt **4 lỗi thật** trong lượt soạn đầu, đúng loại lỗi nó sinh ra để bắt:
  - `p6-u22-l1` và `p6-u23-l2`: một **lựa chọn sai của Predict lại là chuỗi con của output thật**
    (`"Ket qua: Chao"` nằm trong `"Ket qua: Chao nba"`) → đổi lựa chọn nhiễu.
  - `p6-u24-l1` và `p6-u24-l2`: đáp án Predict trải **hai dòng** trong khi bộ chạy so theo chuỗi
    output → gộp lại thành một lần `console.log`.
  - `p6-u22-l2`: test-case tự soạn sai số học (mốc 88 giây thì Bình đã quá hạn 33 giây) → dời về
    mốc 85 để ca đó đúng là ca **biên `<=`** như ý đồ.
- `npx vitest run packages/subject-programming` — **1103/1103 xanh** (gồm `lessonsTs.test.ts` chạy
  `tsc` thật cho cả 6 bài mới: code mẫu đạt hết test-case, ví dụ mẫu chạy không lỗi, đáp án
  Predict khớp output thật).
- `npx prettier --check packages/subject-programming docs/specs` — sạch. `npm run typecheck` — sạch.
- `stageUnits.test.ts`: ca "chặng chưa soạn bài trả về mảng rỗng" đổi mốc từ `web-s4` (nay đã có
  bài) sang `web-s2` — cổng vẫn canh đúng điều nó cần canh.

## Va chạm với hai PR song song (#718, #719)

Trong lúc đợt này đang chạy, PR #718 và #719 vào `main` mở **tầng "chi tiết chặng"**
(`specializations/details/<hướng>-<chặng>.ts` + trang `ProgrammingSpecStagePage`) cho S2 và S3
của cả 13 hướng. Hai việc KHÔNG đè nhau — đó là hai tầng khác nhau của cùng một chặng: chi tiết
chặng để ĐỌC, bài học 8 bước để GÕ CODE và được chấm. Đã ghi rõ quan hệ hai tầng vào đầu đặc tả
S4 để đợt sau không lẫn.

Hai việc dọn kèm theo: số changelog của đợt này đổi từ `0179` (trùng với PR #718) sang `0181`;
và cổng đã chạy lại đủ trên kết quả đã gộp `main` vì hai bên cùng chạm luồng trang hướng
(CLAUDE.md mục 11).

## Việc để ngỏ (cố ý)

- **12 hướng còn lại của chặng S4** (`architecture` → `desktop`, dải `p6-u25`…`p6-u60`): đặc tả đã
  ghi rõ unit, chủ đề từng bài và ngôn ngữ đề xuất — mỗi hướng một PR theo thứ tự trong đặc tả.
- **S2 và S3 của mọi hướng** — chưa soạn, dải mã `p6-u61` trở đi đã chừa sẵn.
