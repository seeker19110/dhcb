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

## Eval thật (VPS, 2026-10-28, chạy trên nhánh qua `git worktree`)

| Bộ              | Recall                                | Precision | FP-rate                        |
| --------------- | ------------------------------------- | --------- | ------------------------------ |
| 62 câu × 3 lượt | **97,7 % ± 0** (129/132)              | 100 %     | **0 %** (0/54)                 |
| 180 câu         | **95,8 %** (115/120) — `main`: 87,5 % | 97,5 %    | **5,0 %** (3/60) — `main`: 0 % |

Chiều B hồi phục: lượng từ 5/8 → 8/8, phủ định 6/8 → 8/8, trật tự từ 5/8 → 7/8, thiếu "là" 7/8 → 8/8.

Đọc nguyên văn 3 ca FP: chỉ `x-b-correct-17` là sửa oan thật ("lo thi trượt" vẫn tự nhiên);
`x-a-edge-01` sửa theo ngữ pháp chuẩn một câu văn nói (ca biên); `x-b-correct-19` hiểu theo vai bạn
ngang hàng nên thấy xưng "con" lạ — có lý. 5 ca FN còn lại chủ yếu là kiểu cũ: lặng lẽ nói lại dạng
đúng (`x-b-tonemark-03`, `x-b-wordorder-07`) hoặc khen câu sai (`aux-01`, `wbw-04`, `x-b-pronoun-02`).

## Quyết định

Ngưỡng đặt ra: recall ≥ 97 % và FP ≈ 0 %. Bộ 62×3 đạt. Bộ 180 câu thiếu 1,4 điểm (≈ 2 câu, trong khoảng
nhiễu của một lượt: Wilson 95 % của 115/120 ≈ 90,6–98,2 %). **Merge**, vì PR này tốt hơn `main` ở độ cân
bằng tổng thể. Không chỉnh thêm prompt chỉ để kéo 1–2 câu (học tủ theo bộ eval).

**Nợ còn lại:** (1) ≈ 3 % câu sai vẫn bị nói lại ngầm thay vì sửa; (2) chưa ghi baseline mới — chạy
`npm run eval:tutor -- --write-baseline` trên `main` sau deploy rồi commit file
`docs/research/eval-tutor-baseline.md`.

Đường lùi: revert PR này (giữ #1462).
