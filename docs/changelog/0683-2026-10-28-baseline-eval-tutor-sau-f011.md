# 0683 — 2026-10-28 — Ghi baseline `eval:tutor` mới sau F-011

Đợt việc nhỏ, chỉ tài liệu. Trả nợ "chưa ghi baseline mới" ở `0682`.

## Đã làm

- Chủ dự án chạy `npm run eval:tutor -- --write-baseline --delay 800` trên VPS, `main` @ `c2936809` (#1464),
  rồi dán nguyên văn kết quả vào phiên. Repo trên VPS không push được, nên số liệu được chép đúng nguyên văn vào
  `docs/research/eval-tutor-baseline.md`.
- Baseline 2026-10-25 chuyển xuống mục "Lịch sử" (giữ nguyên số liệu, hạ cấp tiêu đề). Thêm khối "Hiệu lực
  2026-10-28" ghi mức thay đổi so với 25/10.

## Số liệu (bộ 180 câu, Anthropic · claude-haiku-5-5, một lượt)

|           | 2026-10-25 | 2026-10-28 |
| --------- | ---------- | ---------- |
| Recall    | 99,2 %     | 96,7 %     |
| Precision | 78,8 %     | 98,3 %     |
| FP-rate   | 53,3 %     | 3,3 %      |

FN: `aux-01`, `x-b-tonemark-03`, `x-b-wordorder-07`, `x-b-pronoun-02`. FP: `x-a-edge-01`, `x-b-correct-17`.

## Việc tay sau đợt

Trên VPS, lệnh `--write-baseline` đã sửa file trong `/var/www/dhcb` (thư mục production). Cần trả file về bản
git (`git checkout -- docs/research/eval-tutor-baseline.md`), nếu không lần deploy sau sẽ vướng thay đổi cục bộ.
