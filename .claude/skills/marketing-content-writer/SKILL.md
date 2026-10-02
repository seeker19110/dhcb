---
name: marketing-content-writer
description: 'Kỹ năng viết nội dung marketing đa kênh cho DHCB (Facebook/TikTok, LinkedIn song ngữ, hook ngắn) đúng giọng văn và định vị sản phẩm thật. Kích hoạt khi được yêu cầu viết caption, kịch bản video ngắn, bài LinkedIn, hoặc bất kỳ nội dung quảng bá/PR nào cho DHCB.'
---

# MARKETING CONTENT WRITER — DHCB

Kỹ năng sinh nội dung marketing cho nền tảng DHCB, tách khỏi các kỹ năng nghiệp vụ sản phẩm khác
(sư phạm, kiến trúc...). Lấy cảm hứng từ mô hình "voice profile trước, nội dung sau" của bộ
`social-media-skills` (charlie947), viết lại gọn cho một dự án, không phải cho một cá nhân sáng
tạo nội dung.

## 1. LUÔN ĐỌC `references/dhcb-voice.md` TRƯỚC

File đó là **nguồn sự thật duy nhất** về: sản phẩm đang có gì thật (không bịa tính năng), giá
thật, giọng văn, và 4 thông điệp cốt lõi. Nếu nội dung cần nhắc tới thứ không có trong file đó
(tính năng mới, số liệu mới) → đối chiếu `CLAUDE.md` mục 1/13 hoặc `PROGRESS.md`, KHÔNG suy đoán.

Nếu định vị sản phẩm/giá thay đổi thật (VD: đổi giá gói VIP, ra mắt môn học mới) → cập nhật
`references/dhcb-voice.md` trước, rồi mới viết nội dung mới dựa trên bản cập nhật.

## 2. QUY TRÌNH VIẾT

1. **Xác định kênh:** Facebook/TikTok (phổ thông, câu ngắn, không thuật ngữ) hay LinkedIn (song
   ngữ Việt/Anh, có thể sâu về sản phẩm/kỹ thuật) hay kênh khác người dùng chỉ định.
2. **Chọn 1-2 thông điệp cốt lõi** trong 4 thông điệp ở `dhcb-voice.md` — đừng nhồi cả 4 vào một
   bài. Nếu người dùng không chỉ định, hỏi hoặc chọn thông điệp phù hợp nhất với ngữ cảnh yêu cầu.
3. **Viết theo đúng giọng văn** ở mục "Giọng văn" trong `dhcb-voice.md` — kiểm tra lại độ dài câu,
   mật độ emoji, có lẫn thuật ngữ kỹ thuật vào bài phổ thông không.
4. **Luôn kèm CTA** (lời kêu gọi hành động) cuối bài — "Học thử miễn phí", "Xem lộ trình", v.v.
   Dùng placeholder `[link]` nếu chưa biết domain/route cụ thể, ghi chú rõ cho người dùng tự điền.
5. **Tự kiểm trước khi đưa ra:**
   - Có bịa tính năng/số liệu chưa xác nhận không? → bỏ hoặc thay bằng thứ đã xác nhận.
   - Có lẫn thuật ngữ kỹ thuật vào bài Facebook/TikTok không? → viết lại bằng ngôn ngữ đời thường.
   - Câu có đúng nhịp kênh không (ngắn/nhanh cho short-form, có chiều sâu cho LinkedIn)?

## 3. ĐỊNH DẠNG SẢN PHẨM ĐẦU RA

- **Facebook/TikTok:** caption ngắn (3-6 dòng) + (nếu là video) kịch bản chia theo giây
  (VD: 0-3s / 3-8s / 8-14s / 14-20s) mô tả hình ảnh + lời thoại/phụ đề.
- **LinkedIn:** bài song ngữ, block **VI** rồi **EN**, câu có chiều sâu hơn, có thể nhắc kỹ thuật
  (AI, STT/TTS, kiến trúc) miễn giải thích ngắn gọn trong câu.
- Luôn ghi chú cuối: nội dung nào cần người dùng tự điền lại (link, ngày giờ khuyến mãi...).

## 4. KHÔNG LÀM

- Không tự ý copy/cài đặt bộ skill `social-media-skills` gốc vào dự án — kỹ năng này là bản viết
  lại riêng cho DHCB, không phụ thuộc Apify/Gemini API như bộ gốc.
- Không tự động đăng bài lên mạng xã hội thật (kỹ năng này chỉ sinh nội dung để người dùng duyệt
  và tự đăng).
- Không thay đổi giá/tính năng thật của sản phẩm để "nghe hay hơn" trong bài viết.
