# 0576 — `eval:tutor --dump`: lưu nguyên văn câu trả lời để đọc vì sao câu đúng bị đánh dấu lỗi

- **Ngày:** 2026-10-09 · **PR:** #1325 · **Loại:** `chore(eval)`
- **Nguồn:** chủ dự án chạy `npm run eval:tutor -- --runs 3` trên VPS sau khi Claude thành AI
  chính (changelog `0568`), rồi chọn "cách 2" (thêm cờ ghi nguyên văn, chạy lại trên VPS) thay vì
  cấp key Anthropic cho phiên cloud.

## Vấn đề

Kết quả 3 lượt (chat, 180 câu, `claude-haiku-5-5`, effort low):

| Chỉ số          | Baseline cũ (Groq, 62 câu) | Haiku 5.5 (180 câu, 3 lượt)         |
| --------------- | -------------------------- | ----------------------------------- |
| Recall          | 97.7%                      | 99.2% ± 0.8 (357/360)               |
| Precision       | 97.7%                      | 80.4% ± 2.3                         |
| FP-rate         | 5.6%                       | **48.3% ± 6.7** (Wilson 41.1–55.6%) |
| FP-rate ca biên | —                          | 58.8% ± 10.2                        |

19 câu đúng bị đánh dấu ở CẢ 3 lượt, trong đó có `Hello`, `OK thanks bye`,
`I went to the market yesterday.`, `Dạ, em cảm ơn cô ạ.`. Gần như chắc chắn model viết lời khen
vào dòng `✅ Nhận xét:` thay vì để trống như prompt dặn. Nhưng bảng tổng chỉ ghi "FP", không cho
biết model đã viết gì, nên chưa phân biệt được "khen đặt nhầm chỗ" với "sửa oan câu đúng". Hai lỗi
này cần cách sửa prompt khác nhau.

Đây không phải lỗi cách đếm: trang Chat dùng đúng quy tắc tách `✅` như eval
(`parseAssistantReply`). Phần `✅` không rỗng thì hiện khung cam "nhận xét/sửa lỗi" và **ghi câu
của học viên vào sổ lỗi cá nhân** (`addMistake`), kể cả khi câu đó đúng.

## Đã làm

- `scripts/lib/evalScoring.ts`: `buildDumpRecord` (thuần) dựng một bản ghi `{run, mode, id, kind,
dir, input, outcome, feedback, raw, error?}`. `outcome` lấy từ chính `scoreOne` nên không có cách
  chấm thứ hai; khi lỗi provider thì `outcome` là `ERROR`.
- `scripts/eval-tutor.ts`: cờ `--dump <file>` ghi JSONL, mỗi câu một dòng, ghi ngay sau từng câu
  (chạy dở bị ngắt vẫn giữ phần đã có). Đầu lần chạy xoá file cũ để không lẫn hai lần chạy.
  `runMode` nhận số lượt để dòng dump ghi đúng lượt.
- Đưa phần chấm ra ngoài `try`: chỉ lời gọi provider nằm trong `try`, để lỗi ghi file không bị
  đếm nhầm thành lỗi provider (đẩy hai kết quả cho cùng một câu).

## Không làm

- **Chưa sửa prompt chat.** CLAUDE.md §8: PR sửa prompt phải kèm bảng `eval:tutor`, mà phiên cloud
  không có key. Sửa sau khi đọc nguyên văn các câu FP.
- **Chưa ghi baseline 180 câu.** Ghi bây giờ là chốt FP-rate 48% thành chuẩn.
- Không đổi model: Sonnet đắt hơn Haiku khoảng 20 lần mà có thể vẫn lệch định dạng y như vậy.

## Kiểm chứng

- `npx vitest run scripts/lib/evalScoring.test.ts`: 36/36 (thêm 3 ca `buildDumpRecord`:
  nguyên văn + phần `✅` đúng như UI thấy, outcome trùng `scoreOne`, lỗi provider ra `ERROR`).
- Smoke: chạy script thật với server Anthropic giả (`ANTHROPIC_BASE_URL`),
  `--group edge --limit 3 --runs 2 --dump …`. File ra 6 dòng, `run` 1/2 đúng, `outcome` trong file
  khớp từng dòng FP/TN in ra màn hình.

## Việc tay (chủ dự án, trên VPS sau khi deploy)

```
npm run eval:tutor -- --group clean --dump /tmp/eval-dump.jsonl
grep '"outcome":"FP"' /tmp/eval-dump.jsonl
```

Gửi kết quả lệnh `grep` để sửa prompt chat (chiều A và B).
