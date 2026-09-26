# 0166 — ci: cổng `metadata` đọc PR SỐNG thay vì ảnh chụp trong payload

- **Ngày:** 2026-08-26
- **PR:** #703
- **Nhánh:** `claude/programming-lessons-tl3tbg`

## Triệu chứng

Cổng `metadata` đỏ **bốn lượt liên tiếp** trên PR #703, luôn cùng một dòng:

```
##[error]PR feat phải xác nhận spec đã Approved for implementation.
```

Lỗi ban đầu là thật và là lỗi của tôi: `pr-policy.yml` đòi mô tả PR `feat` chứa **đúng cụm
chữ** `Approved for implementation`, tôi viết "Trạng thái duyệt: đã merge, đang thi hành" —
đúng nghĩa nhưng không đúng chữ. Đã sửa lúc 16:08 UTC.

Nhưng cổng vẫn đỏ sau đó, kể cả ở run tạo lúc 16:24:20 — tức **sau** khi mô tả đã sửa. Kiểm
mô tả sống qua API xác nhận nó CÓ cụm chữ đó:

```
GET /repos/seeker19110/dhcb/pulls/703
updated_at: 2026-08-26T16:08:36Z
có cụm "Approved for implementation"? True
```

## Nguyên nhân

Cổng đọc `context.payload.pull_request.body`. Payload là **ẢNH CHỤP tại thời điểm sự kiện
webhook**, không phải trạng thái hiện tại của PR. Hôm đó Actions đang sự cố
(xem changelog 0165) nên GitHub phát lại hàng tồn: run được tạo muộn hàng chục phút trong khi
payload đóng băng từ lúc sự kiện phát sinh.

| Run  | `head_sha` | Sự kiện lúc | Run tạo lúc |
| ---- | ---------- | ----------- | ----------- |
| #496 | `f1acf77`  | 15:47       | 16:04       |
| #498 | `9e6a36a`  | 15:56       | 16:17       |
| #499 | `82c53e9`  | ~16:00      | 16:23       |
| #500 | `82c53e9`  | ?           | 16:24       |

Ba lượt đầu có mốc sự kiện trước 16:08 nên đọc mô tả cũ — giải thích trọn vẹn. Lượt #500 thì
tôi **không chứng minh được** nó đọc payload nào: API không cho xem payload của một run, nên
"nó cũng là một sự kiện tồn được phát lại" vẫn chỉ là suy đoán hợp lý chứ chưa phải bằng chứng.

Điều đó không đổi kết luận, vì khiếm khuyết của cổng đứng độc lập với hôm nay:

- **Sai chiều nghiêm khắc:** mô tả đã sửa cho đạt yêu cầu mà run đọc bản cũ → đánh trượt oan.
- **Sai chiều dễ dãi, nguy hiểm hơn:** cổng xanh xong mới gỡ sạch mô tả PR thì nó không hề
  biết — dấu tick vẫn xanh, người review vẫn tin, mà nội dung bảo chứng đã biến mất.

Một cổng chấm ảnh chụp quá khứ thì không bảo chứng được hiện tại.

## Việc đã làm

```js
// thay vì: const pr = context.payload.pull_request;
const { data: pr } = await github.rest.pulls.get({
  owner: context.repo.owner,
  repo: context.repo.repo,
  pull_number: context.payload.pull_request.number,
})
```

Bốn trường cổng đang dùng — `title`, `body`, `draft`, `user.login`, `head.sha` — đều có đủ
trong phản hồi `pulls.get`, nên phần logic phía sau **giữ nguyên không sửa một dòng nào**.

## Quyết định kèm theo

- **Không nới lỏng bất kỳ luật nào của cổng** để PR này qua. Bốn luật (tiêu đề Conventional
  Commits · 6 đề mục bắt buộc · liên kết đặc tả CÓ THẬT trong nhánh · cụm chữ
  `Approved for implementation`) giữ nguyên từng chữ. Chỉ đổi NGUỒN đọc dữ liệu.
- **Không dùng `pull_request_target`.** Nó chạy workflow của nhánh đích với quyền ghi, một
  bề mặt tấn công quen thuộc; ở đây chỉ cần đọc nên `pulls.get` với `pull-requests: read`
  (quyền đã khai sẵn trong file) là đủ.
- **Chấp nhận tốn thêm một lượt gọi API mỗi lần chạy.** Cổng vốn đã gọi `repos.getContent`
  cho từng đường dẫn đặc tả; thêm một lượt nữa không đáng kể.

## Bằng chứng kiểm chứng

- `yaml.safe_load()`: YAML hợp lệ, job `metadata` còn nguyên, `permissions` vẫn là
  `{contents: read, pull-requests: read}` — đủ quyền cho `pulls.get`.
- `grep` toàn file: chỉ còn MỘT chỗ chạm `context.payload`, đúng chỗ lấy số PR. Bốn trường
  `pr.draft`, `pr.user.login`, `pr.head.sha`, `pr.title/body` đều lấy từ dữ liệu sống.
- `prettier --check`: đạt.
- Phép thử thật nằm ở chính lần push này: `metadata` phải xanh, vì mô tả PR sống đã chứa cụm
  chữ cổng đòi.

## Bài học

Đây là lần thứ ba trong một ngày cùng một loại sai (xem 0156 ở PR #702 và 0157): **công cụ
kiểm tra đọc nguồn dữ liệu khác với nguồn thật thì nó đo chính nó, không đo hệ thống.** Ở 0156
là script eval đọc key khác production. Ở đây là cổng CI đọc ảnh chụp thay vì trạng thái PR.

Kèm một bài học riêng cho lần này: khi một cổng đỏ ở chỗ mình TIN CHẮC đã sửa, hãy kiểm
**nguồn dữ liệu mà cổng đọc** trước khi sửa nội dung thêm lần nữa. Tôi đã sửa mô tả PR ba lượt
trước khi nghĩ tới việc hỏi "cổng đang đọc mô tả nào?".
