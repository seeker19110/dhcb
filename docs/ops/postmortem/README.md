# Post-mortem sự cố — nơi lưu cố định

> Chốt 2026-10-12 (changelog `0622`). Mỗi sự cố **SEV1/SEV2** (thang ở
> `docs/ke-hoach-khoi-phuc-su-co-server.md` Phần 1b) để lại **một file** ở thư mục này:
> `YYYY-MM-DD-<slug>.md` (ngày = ngày sự cố BẮT ĐẦU, giờ UTC). Một file một sự cố, giống
> `docs/changelog/`, để hai lần ghi không xung đột nhau và `ls` là ra lịch sử.
>
> Sự cố cũ hơn ngày chốt nằm ở `docs/ke-hoach-khoi-phuc-su-co-server.md` Phần 7 và
> `PROGRESS.md` mục "Sự cố hạ tầng đã xử lý" — để nguyên chỗ, không dời.
>
> Nguồn: khuôn post-mortem của `seeker19110/project-template` (`docs/ops/incident-response.md`),
> rút gọn cho dự án một người vận hành, một VPS.

## Luật

- **Không đổ lỗi (blameless):** viết về hệ thống — hàng rào nào thiếu, tín hiệu nào đến muộn — không
  viết "ai làm sai".
- **Mỗi sự cố để lại ÍT NHẤT MỘT hàng rào mới** (test hồi quy, cảnh báo, cổng CI, mục `TRAPS.md`).
  Chưa làm kịp thì nó là một mục "Nợ kỹ thuật còn mở" trong `PROGRESS.md`, kèm điều kiện xem lại.
- **Sự cố bảo mật:** repo public — chỉ viết file này SAU khi đã vá và xoay vòng khoá; không kèm cách
  tái hiện (xem Phần 1b của runbook).
- **Số liệu phải có nguồn:** mốc thời gian lấy từ log/run id/commit, không ước lượng từ trí nhớ; ước
  lượng thì ghi rõ "ước lượng".
- Ghi xong: thêm MỘT dòng trỏ tới file vào `PROGRESS.md` mục "Sự cố hạ tầng đã xử lý".

---

## Khuôn (sao chép từ đây)

```markdown
# Post-mortem: <tóm tắt một dòng>

- **Mức:** SEV1 / SEV2 (hạ/nâng mức trong lúc xử lý? ghi lý do)
- **Thời lượng:** <bắt đầu UTC> → <khôi phục UTC> (tổng: …) · giờ Việt Nam: …
- **Phát hiện qua:** Sentry / người dùng báo / rà tay Actions / … (phát hiện muộn bao lâu sau khi bắt đầu?)
- **Trạng thái:** Đã khôi phục / Đã vá triệt để / Đã đóng

## Tóm tắt

<!-- 2–3 câu: chuyện gì xảy ra, ảnh hưởng ai, giải quyết thế nào. -->

## Ảnh hưởng

- Người dùng: <số/tỷ lệ, hoặc "không đo được — vì …">
- Chức năng:
- Dữ liệu / tiền (SePay, lượt AI) / chi phí API:

## Dòng thời gian (UTC)

| Thời điểm | Sự kiện                  | Bằng chứng (log/run id/commit) |
| --------- | ------------------------ | ------------------------------ |
|           | Nguyên nhân được đưa vào |                                |
|           | Phát hiện                |                                |
|           | Bắt đầu giảm thiệt hại   |                                |
|           | Khôi phục dịch vụ        |                                |

## Nguyên nhân gốc (5 Whys)

<!-- Vì sao xảy ra? → vì sao điều đó xảy ra? … tới khi gặp một QUYẾT ĐỊNH/HÀNG RÀO thiếu.
     Thêm câu hỏi cuối: vì sao test/CI/cảnh báo không bắt được sớm hơn? -->

## Chạy tốt / chưa tốt / may mắn

- **Tốt:**
- **Chưa tốt:**
- **May mắn (suýt tệ hơn):**

## Hàng rào mới

| Hành động | Loại (vá / phòng ngừa / phát hiện) | Trạng thái (PR / nợ mở trong PROGRESS) |
| --------- | ---------------------------------- | -------------------------------------- |
|           |                                    |                                        |
```
