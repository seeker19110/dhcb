# 0652 — 2026-10-20 — W-004: `/goc-hoc-tap` một lối vào phòng thí nghiệm (F-009)

Đóng **F-009** (mức Thấp, Tầng 8b) của `docs/audit/2026-10-20-audit-toan-dien.md` — đợt cuối
của "làm tất cả". Chạm giao diện nên có ảnh trước/sau theo đúng Tầng 8b.

## Việc đã làm

`apps/dhcb/src/pages/learning/Subjects.tsx`: gỡ banner "MỚI · 10 thí nghiệm tương tác · Phòng thí
nghiệm mô phỏng & ứng dụng thực tế" nằm giữa ô tìm kiếm và danh sách môn. Nó trỏ cùng đích
`/ung-dung-thuc-te` với lối tắt "10 phòng thí nghiệm mô phỏng" ngay trong hero "Bắt đầu từ đâu hôm
nay" phía trên — một màn hình nói cùng một câu hai lần — và đẩy danh sách môn (việc chính của trang)
xuống dưới. Lối tắt trong hero giữ nguyên; để lại chú thích tại chỗ nói rõ lý do gỡ.

## Kiểm chứng (số đo, không "trông đẹp hơn")

| Ảnh (mockLogin, không backend) | Trước (audit 06:22 UTC) | Sau        |
| ------------------------------ | ----------------------- | ---------- |
| `/goc-hoc-tap` 1440 px         | 1440 × 900              | 1440 × 900 |
| `/goc-hoc-tap` 390 px          | 390 × 1045              | 390 × 857  |

- Chiều cao đọc từ header PNG. Ở 390 px trang ngắn đi 188 px (bớt đúng khối banner); ở 1440 px
  trang vốn vừa một màn nên không đổi chiều cao, nhưng khối danh sách môn (ở đây là trạng thái
  lỗi tải vì không backend) nhích lên ngay dưới hàng lọc.
- Bốn câu Tầng 8b trên ảnh sau: (1) không còn câu chữ xuất hiện hai lần; (2) trang < 2 màn hình;
  (3) 1440 px không có mảng trống mới; (4) ảnh 390 px chỉ khác đúng phần cố ý gỡ.
- `Subjects.test.tsx` 11/11 · eslint 0 cảnh báo · Prettier · `tsc` app 0 lỗi. Cổng a11y AA/AAA
  cho route này chạy ở CI (`e2e/a11y*.spec.ts`).

## Không làm

- Không sửa trang `/ung-dung-thuc-te` hay nội dung lối tắt; không thêm banner thay thế.
