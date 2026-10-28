# 0682 — 2026-10-28 — Prompt gia sư: soát lỗi trước khi khen (F-011, phần recall)

PR tiếp nối `0680` (#1462). Chưa đóng F-011: chờ chạy lại `eval:tutor` với key thật.

## Vấn đề

Chủ dự án chạy `eval:tutor` trên VPS 2026-10-28 sau #1462 (Anthropic · claude-haiku-5-5):

| Bộ              | Recall                       | Precision | FP-rate                             |
| --------------- | ---------------------------- | --------- | ----------------------------------- |
| 62 câu × 3 lượt | 97,7 % ± 0 (129/132)         | 100 %     | **0 %** (0/54) — trước 44,4 % ± 5,6 |
| 180 câu         | **87,5 %** — baseline 99,2 % | 100 %     | **0 %** (0/60) — trước 60 %         |

Bịa lỗi đã hết, nhưng recall tụt (CLAUDE.md §8: recall không được tụt). 13/15 ca bỏ sót ở chiều B
(lượng từ 5/8, trật tự từ 5/8, phủ định 6/8). Đọc nguyên văn 15 ca (dump): gia sư **khen câu sai là "rất tự
nhiên"**, hoặc **lặng lẽ nói lại dạng đúng** trong lời thoại mà không chỉ lỗi. Chiều B không có danh sách lỗi
hay gặp như `VIET_COMMON_ERRORS` của chiều A.

## Đã làm

- `apps/dhcb/src/prompts/index.ts`: thêm luật 7 cho cả hai chiều — luật 6 (văn nói hợp lệ) không che lỗi ngữ
  pháp; soát câu trước khi khen; định nói lại câu theo dạng khác ⇒ câu có lỗi ⇒ phải viết phần sửa lỗi.
- Chiều B: danh sách 8 nhóm lỗi hay gặp của người học tiếng Việt (dấu thanh làm đổi từ — khác với gõ không dấu
  hoàn toàn, lượng từ, trật tự từ, phủ định/khung câu hỏi, dấu thời gian, thiếu/thừa "là", xưng hô, dịch từng
  chữ). Viết ở dạng NHÓM, không ví dụ cụ thể — bản nháp đầu có gợi ý quá sát câu eval, đã gỡ để điểm không
  đẹp giả. Kiểm bằng script: không câu nào của hai bộ fixture xuất hiện trong prompt.
- Golden snapshot cập nhật có chủ đích (5 snapshot).

## Tiêu chí đạt (chờ eval thật)

Bộ 180 câu: recall ≥ 97 % và FP-rate vẫn ≈ 0 %. Không đạt ⇒ revert PR này (giữ #1462).
