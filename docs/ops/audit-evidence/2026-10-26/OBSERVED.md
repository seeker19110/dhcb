# Kết quả tối thiểu của bundle portable

Ngày: **2026-10-26**, múi giờ báo cáo Asia/Ho_Chi_Minh. Application source được kiểm:
`c561b67b72a697f41035f489bb7bf5967e5c6b40`; chưa sửa ứng dụng. Runtime: Node.js 22.23.4,
PostgreSQL 16.15 disposable đã migrate. Lần xác minh này trích xuất các file `*.txt` từ phụ lục vào
một thư mục `mktemp` mới ngoài checkout; không dùng lại script tại đường dẫn instance cũ.

| Gate           | Exit | Đối chứng và kết quả quan sát                                                                                       |
| -------------- | ---: | ------------------------------------------------------------------------------------------------------------------- |
| `AUD-DATA-001` |    1 | 2 đối chứng đạt; regression đỏ. Hai sync đầu trả 200, version 1/2, `conflict=false`; DB chỉ giữ `dog`, mất `cat`.   |
| `AUD-SEC-001`  |    1 | Không policy: context/tool có marker. User khác không đọc marker. Sau DENY: context chặn nhưng tool vẫn trả marker. |
| `AUD-CFG-001`  |    1 | Thiếu identity: 401; user + breaker: 429/provider 0. Khách chat/STT + breaker: 200/provider giả 1 mỗi đường.        |
| `AUD-DATA-002` |    1 | Pipeline đọc từ source trả 0 với SQL lỗi và gzip thiếu footer. Hai đối chứng `ON_ERROR_STOP`/`pipefail` trả 3/1.    |

Output tổng hợp của lần chạy:

```text
progress=1 policy=1 breaker=1 restore=1 restore_fixed_control=0
```

Breakpoint của progress đúng là assertion thiếu phần tử, không phải timeout, lỗi auth hoặc kết nối.
Barrier quan sát được hai lần đọc hàng rỗng; đối chứng hàng có sẵn và chạy tuần tự đều giữ hợp hai từ.

Metadata privacy không chứa nội dung marker hay định danh người dùng:

```json
{
  "noPolicyControl": true,
  "otherUserBlocked": true,
  "denyConfirmed": true,
  "contextBlocked": true,
  "searchOffered": true,
  "toolReturnedDeniedContent": true,
  "isError": false
}
```

Breaker có đối chứng dương: khi tắt breaker, khách STT trả 200 và gọi provider **giả** đúng một lần.
Trong toàn bộ proof, SQL và `fetch` của breaker được thay bằng fake, không gọi API bên ngoài.

Restore có thêm kiểm tra chất lượng gate: chỉ ở **bản copy source trong scratch**, thay flags Bash
bằng `-o pipefail` và thêm `psql -v ON_ERROR_STOP=1`. Cùng proof lúc đó trả **0**; hai pipeline nguồn
trả 3/1, hai đối chứng vẫn 3/1. Không sửa source repository, không chạy script restore, không
DROP/CREATE hay phục hồi backup thật. Kết quả này chứng minh gate phân biệt được pipeline lỗi và
pipeline đã sửa tối thiểu; không phải bằng chứng lỗi sản phẩm đã được khắc phục.

Các fixture PostgreSQL được xóa theo ID tạo riêng trong `finally`/`afterAll`. Không đưa token,
credential, dữ liệu cá nhân hoặc raw dump/log provider vào phụ lục. Chi tiết mức Trung không nằm
trong bundle; báo cáo và sổ audit vẫn đánh dấu toàn bộ phát hiện là mở.
