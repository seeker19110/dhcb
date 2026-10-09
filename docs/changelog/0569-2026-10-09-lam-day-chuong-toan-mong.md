# 0569 — Làm dày 7 chương Toán chỉ có 1 bài (+13 bài)

- **Ngày:** 2026-10-09 · **PR:** (điền khi tạo) · **Loại:** `feat(stem)`
- **Đặc tả:** `docs/specs/2026-10-09-lam-day-chuong-toan-mong.md` (đợt 2/4 của lượt soạn nốt bài)

## Đã làm

- Thêm 13 bài vào 7 chương Toán:
  - 10 C2 thêm 1 bài, 10 C3 thêm 2, 10 C9 thêm 1.
  - 11 C2 thêm 2, 11 C7 thêm 4, 11 C9 thêm 2.
  - 12 C6 thêm 1.
- Toán tăng từ 55 lên 68 bài. Không còn chương chuẩn nào chỉ có 1 bài.
- Có 9 hoạt ảnh mới, gồm: đường mức F trượt tới đỉnh, sơ đồ cây, lãi kép, tiếp tuyến xoay trên
  parabol, dương tính giả trong bài xét nghiệm, hình chiếu, góc nhị diện, khoảng cách.

## Quyết định

- Hoá 10 C4–C6 và Sinh 12 C5/C7/C9 **không** thêm bài. Hai môn này đánh số bài theo đúng số bài SGK,
  và mỗi chương SGK cũng chỉ có 1 bài, nên chương không thiếu. Thêm vào sẽ phá dãy số.

## Kiểm chứng

- Mỗi file đều qua Zod, `timLoiTuCham`, `timLoiHoatAnh`, kiểm explain ≥ 60 ký tự, và audit-prose
  không có lỗi.
- Các con số đã tính lại bằng `node -e`, ví dụ: LP max 1380, Heron 204, PPV ≈ 8,3%, a/√3 = 3,464.
- `npx vitest run packages/subject-math packages/core-learner apps/dhcb/src/lib`: 3934/3934 xanh.

## Nợ để lại

- Mọi bài đều là `draft`. Những điểm cần chuyên gia đọc lại: thuật ngữ "cong lên/cong xuống" (lồi
  lõm), quy ước lãi kép đơn giản hoá, giả thiết hai lần xét nghiệm độc lập, ký hiệu nhị diện.
- Hoạt ảnh chưa được xem bằng mắt ở Tầng 8b.
