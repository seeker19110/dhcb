# Hồ sơ giọng văn — DHCB "Đồng Hành Cùng Bạn"

> Nguồn sự thật giọng văn marketing. Mọi nội dung sinh ra bởi skill này PHẢI đọc file này trước.
> Sửa tại file này khi định vị sản phẩm/giá/tính năng thay đổi — đừng để nội dung marketing lệch
> với thực tế sản phẩm (đối chiếu `CLAUDE.md` mục 1 + mục 13 khi nghi ngờ).

## Về sản phẩm (about-me)

- **Tên:** DHCB — Đồng Hành Cùng Bạn (donghanhcungban.org, môn Anh tại en-vi.donghanhcungban.org)
- **Là gì:** KHÔNG chỉ là app học tiếng Anh — là **nền tảng đồng hành cá nhân**: trụ **Học tập**
  (nhiều môn) + trụ **Ghi chú** (việc cần làm, dự án, biên bản họp), xuyên suốt bởi "Bạn Đồng
  Hành" — một AI đi cùng bạn dài hạn, không phải chatbot trả lời một câu rồi thôi. Ba trụ Sự
  nghiệp · Khởi nghiệp · Đời sống **đã gỡ hẳn 2026-09-20** — KHÔNG nhắc trong nội dung quảng bá.
- **Trụ Học tập hiện có:** Tiếng Anh (môn đầu tiên, chín nhất — chi tiết bên dưới), **Lập trình**
  (từ nhập môn tới 14 hướng chuyên sâu — 11 hướng sản phẩm: web · di động · backend · dữ liệu · AI
  · DevOps · bảo mật · hệ thống · game · nhúng · desktop, cùng 3 hướng nền: kiến trúc · thuật toán
  · toán cho lập trình — cả lộ trình mục tiêu "Kỹ Sư Trưởng AI" và cụm khoá AI thực
  chiến Python→ML→Deep Learning→Agent), và **STEM — Toán/Lý/Hoá/Sinh** (chương trình bám khung
  GDPT 2018, đã hiển thị trong app — xem `apps/dhcb/src/data/stemCurriculum.ts` — chưa xác nhận
  có tính năng chấm bài AI riêng như môn Anh/Lập trình, đừng nhắc tới trong nội dung quảng bá).
- **Đối tượng chính:** người Việt cần đồng hành lâu dài trong học tập — học sinh, sinh viên, người
  đi làm muốn học ngoại ngữ hoặc chuyển hướng sang lập trình — ngân sách thấp, muốn học tự nhiên
  chứ không khô khan.
- **Điểm khác biệt của cả nền tảng:** không phải "kho khoá học" rời rạc — mỗi môn có Companion
  đồng hành, sửa lỗi, chấm điểm, cá nhân hoá lộ trình theo đúng người học, đúng tốc độ.

### Môn Anh (chi tiết vì là tính năng cờ)

- Hai chiều học: A — người Việt học tiếng Anh; B — người nước ngoài học tiếng Việt qua tiếng Anh.
- 3 chế độ: Chat tổng hợp (sửa lỗi + động viên, chấm điểm kiểu IELTS Speaking) · Luyện viết +
  chấm điểm (kiểu IELTS) · **Luyện nói song ngữ** — bạn nói → AI nghe (STT) → AI trả lời bằng
  **giọng ngôn ngữ đích chuẩn** + sửa lỗi/giải thích bằng **giọng tiếng mẹ đẻ** (hai giọng TTS
  riêng biệt, không chỉ hiển thị chữ). Đây là điểm khác biệt cốt lõi, không nơi nào khác làm.
- Lộ trình CEFR A1→C2 đầy đủ, cá nhân hoá tốc độ học (5/10/20 từ/ngày), ôn tập SRS không lặp.

### Môn Lập trình

- 6 bậc P1→P6, 14 hướng chuyên sâu, lộ trình mục tiêu ghép nhiều chặng (VD: "Kỹ Sư Trưởng AI"),
  cụm khoá ngắn AI thực chiến (Python/AI → Toán cho AI → ML/Data Science → Deep Learning CV →
  Transformer/Detection → LLM Agent). Chấm bài AI có eval riêng, không lộ lời giải.

### Môn STEM (Toán/Lý/Hoá/Sinh)

- Chương trình bám khung GDPT 2018, chia theo chương/khối lớp. Có Companion AI giải thích lại
  kiến thức. Đối tượng: học sinh phổ thông ôn bài/ôn thi, không riêng gì học sinh giỏi.
- KHÔNG nhắc "chấm bài kiểu IELTS" hay cơ chế eval riêng cho STEM trong nội dung marketing — chưa
  xác nhận có, chỉ chắc chắn có chương trình + Companion giải thích. Bảng nháp STEM chỉ tự kiểm
  được vài lỗi và đáp số của vài đề mẫu (changelog 0473) — KHÔNG quảng cáo "AI kiểm từng bước giải".

## Giá

- **Hai gói duy nhất:** Free — **30 lượt AI/ngày** tính chung mọi tính năng; **VIP** — gói trả phí
  duy nhất, bán qua SePay. Gói Pro/Plus **đã ngừng bán 2026-09-12** — KHÔNG nhắc.
- Giá VIP mặc định: 30k/10 ngày · 75k/tháng · 500k/năm. **Giá thật đọc từ bảng `plan_prices`, admin
  đổi được và có thể đang khuyến mãi** — trước khi đăng bài có con số, kiểm `GET /api/plan-prices`
  (nguồn: `packages/core-billing/prices.ts`). Rẻ hơn nhiều so với thuê gia sư (200-500k/buổi) hoặc
  mua khoá học lập trình vài triệu.

## Giọng văn (voice)

- Gần gũi, như một người bạn đồng hành — KHÔNG hô khẩu hiệu, KHÔNG "học dễ như ăn kẹo".
- Thẳng thắn về giá trị thật: sửa lỗi bằng giọng nói, không phải gimmick; không phóng đại số liệu.
- Ưu tiên ví dụ cụ thể, tình huống đời sống Việt Nam (đi phỏng vấn, đi làm, đi du lịch, thi lớp 10,
  muốn chuyển hướng sang lập trình...).
- Không dùng thuật ngữ kỹ thuật (AI, STT, TTS, CEFR...) trong nội dung hướng người dùng cuối
  (Facebook/TikTok) — chỉ dùng ở nội dung LinkedIn/kỹ thuật, và phải giải thích ngắn gọn nếu dùng.
- Câu ngắn, nhịp nhanh cho Facebook/TikTok; câu có chiều sâu hơn, số liệu/kỹ thuật cụ thể hơn cho
  LinkedIn.
- Emoji dùng tiết chế (0–2 mỗi caption), không lạm dụng, không dùng emoji ở LinkedIn kỹ thuật.
- KHÔNG bịa tính năng chưa có, KHÔNG bịa số liệu (số người dùng, đánh giá sao...) chưa được xác
  nhận trong `CLAUDE.md`/`PROGRESS.md`.

## 4 thông điệp cốt lõi (chọn 1-2 theo yêu cầu mỗi lần viết, đừng nhồi hết vào một bài)

1. **Sửa lỗi bằng giọng nói thật, hai chiều** (môn Anh) — nghe được AI nói chuẩn giọng ngôn ngữ
   đích, rồi nghe được AI giải thích lại bằng giọng mẹ đẻ, như có một gia sư ngồi cạnh.
2. **Giá rẻ / có bản miễn phí** — ai cũng học được, không cần thuê gia sư đắt đỏ hay mua khoá học
   lập trình vài triệu.
3. **Lộ trình bài bản, cá nhân hoá theo từng môn** — tiếng Anh có CEFR A1→C2; Lập trình có 6 bậc
   P1→P6 + 14 hướng chuyên sâu + lộ trình mục tiêu — không học lan man, biết mình đang ở đâu, học
   đúng tốc độ của mình.
4. **Một AI đồng hành xuyên suốt, không phải app rời rạc** — Companion nhớ bạn học gì, chấm điểm,
   gợi ý bước tiếp theo, dù bạn đang học Anh hay học lập trình.
