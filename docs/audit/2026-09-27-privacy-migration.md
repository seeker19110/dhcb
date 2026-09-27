# Khóa dữ liệu riêng tư và phân loại lịch sử Companion

## Phạm vi

Migration `0086_companion_message_sensitivity.sql` thêm cột `sensitivity` vào lịch sử
Companion. Dòng cũ được coi là `sensitive` vì chưa có bằng chứng rằng nội dung không chứa
hồ sơ ẩn. Mỗi lượt mới kế thừa mức nhạy cảm cao nhất của các nguồn ngữ cảnh được dùng,
áp dụng cho cả tin người dùng và câu trả lời. Mức thấp nhất khi lưu là `personal`.

## Triển khai bổ sung

1. Sao lưu theo quy trình vận hành hiện có, chạy migration trước bản ứng dụng mới.
2. Kiểm tra cột và các mức phân loại bằng truy vấn bên dưới.
3. Triển khai code. Code cũ dùng danh sách cột tường minh vẫn hoạt động; bản cũ không ghi
   phân loại sẽ nhận mặc định `sensitive`, nên không tự hạ bảo vệ.
4. Kiểm tra trên môi trường thử: chat thường tạo lịch sử `personal`; lịch sử có context
   T2 tạo `sensitive`; phiên chưa xác minh hai bước không đọc được T2 qua lịch sử, export,
   facts, memories hay context-package. JSON/SSE Companion không trả raw context.

```sql
select column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'personal' and table_name = 'companion_messages'
  and column_name = 'sensitivity';

select sensitivity, count(*)
from personal.companion_messages
 group by sensitivity;

select count(*) as invalid_rows
from personal.companion_messages
where sensitivity is null
   or sensitivity not in ('public', 'personal', 'sensitive', 'restricted');
```

Kết quả mong đợi: cột `text NOT NULL`, mặc định `sensitive`; `invalid_rows = 0`.
Không đọc nội dung transcript trong truy vấn vận hành.

## Khôi phục

Giữ cột bổ sung và dữ liệu phân loại. Không xóa cột hoặc cập nhật đồng loạt về `personal`.
Nếu bản mới lỗi, ưu tiên sửa tiến hoặc tạm khóa endpoint Companion/history/context và
export nhạy cảm. Quay về code cũ mà mở lại các endpoint sẽ tái mở lỗi quyền riêng tư;
không coi việc rollback ứng dụng đơn thuần là khôi phục an toàn. Migration chạy lại
được nhờ `ADD COLUMN IF NOT EXISTS`.

## Ảnh hưởng với người dùng

Chat thông thường và lịch sử mới không cần bật 2FA. Lịch sử cũ chưa phân loại và nội dung
T2 chỉ hiện sau khi bật 2FA và xác minh phiên. Xóa dữ liệu vẫn không bị cổng 2FA này chặn.
Đăng nhập Microsoft với identity đã liên kết vẫn hoạt động; identity mới cần dùng kênh
email/nhà cung cấp đã xác minh. Chưa triển khai luồng liên kết Microsoft mới; không dùng
email hoặc UPN mutable để tự động ghép tài khoản.

## Bằng chứng và giới hạn

Unit test dùng provider giả; không dùng dữ liệu, bí mật hay nhà cung cấp trả phí production.
Việc chạy SQL migration trên PostgreSQL được ghi riêng trong báo cáo nghiệm thu đợt sửa;
tài liệu này không khẳng định migration đã được áp dụng production.

Quy tắc không dùng email/UPN để cấp quyền dựa trên
[tài liệu Microsoft về xác minh claims](https://learn.microsoft.com/en-us/entra/identity-platform/claims-validation).
Mã hóa dữ liệu lưu trữ cần kế hoạch khóa và chuyển đổi riêng, không thuộc migration này.
