# Eval gia sư AI — baseline (⑤ T1)

> ## ⚠️ HIỆU LỰC CỦA BASELINE — cập nhật 2026-10-09 (changelog 0553)
>
> **Mọi số liệu bên dưới (2026-08-26) CHỈ còn hiệu lực với bộ 62 câu cũ** (toàn chiều A). Golden
> set nay là **180 câu** (62 cũ + 118 mới ở `scripts/eval-tutor-fixtures-extra.json`, cả hai chiều
> A/B, nhóm đúng/ca biên 60 câu): **bộ mới CHƯA có baseline** — không so số của bộ 180 câu với bảng
> dưới đây. Muốn đối chiếu với baseline cũ: `npm run eval:tutor -- --limit 62` (bộ cũ luôn đứng
> trước khi gộp).
>
> **Việc tay chủ dự án (cần key AI thật):** chạy `npm run eval:tutor -- --runs 3 --write-baseline`
> (≈ 540 lời gọi/chế độ), xem lại các câu bị hỏng, rồi commit file này. Lưu ý lệnh ghi đè TOÀN BỘ file
> (kể cả phần "Dải nhiễu" cuối file) — nếu cần giữ phần đó, chép lại sau khi chạy. `--runs N` in
> trung bình ± độ lệch chuẩn giữa các lượt và khoảng tin cậy Wilson 95% theo từng nhóm lỗi; hai lần
> chạy chỉ coi là KHÁC NHAU khi khoảng Wilson không chồng lên nhau. `--group <tên>` chạy riêng một
> nhóm (loại lỗi · error · correct · edge · clean · A · B). `CLAUDE.md` §8 không đổi: vẫn "không tụt
> so với baseline" — baseline mới (nhiều lượt) mới đủ rộng để luật đó có nghĩa.

> Sinh tự động bởi `npm run eval:tutor -- --write-baseline`. KHÔNG sửa tay phần số liệu.
> Phương pháp + cách đọc chỉ số: xem cuối file.

- **Ngày chạy:** 2026-08-26
- **Provider · model:** Groq · openai/gpt-oss-120b (3 key)
- **Golden set:** 62 câu (44 lỗi · 12 đúng · 6 ca biên)
- **Chế độ chạy:** chat

## Tổng hợp

| Chế độ | Chấm được | Recall | Precision | FP-rate | Specificity | Feedback VI | JSON hợp lệ | Type-hit* |
| ------ | --------- | ------ | --------- | ------- | ----------- | ----------- | ----------- | --------- |
| chat   | 62        | 97.7%  | 97.7%     | 5.6%    | 94.4%       | 100.0%      | —           | 76.7%     |

## Recall theo loại lỗi — chế độ chat

| Loại lỗi        | Bắt được / Tổng |
| --------------- | --------------- |
| third_person_s  | 4/4             |
| plural_s        | 5/5             |
| article         | 7/7             |
| tense           | 7/7             |
| aux_verb        | 4/4             |
| missing_be      | 4/4             |
| extra_be        | 2/2             |
| preposition     | 5/5             |
| adjective_order | 1/2             |
| pronoun         | 3/3             |
| word_by_word    | 5/5             |

**Bỏ sót lỗi (FN):** adj-02

**Bịa lỗi ở câu đúng/ca biên (FP):** edge-05

## Cách đọc

- **Recall** = bắt được lỗi thật / tổng câu có lỗi. Cao = ít bỏ sót.
- **Precision** = báo lỗi đúng / tổng lần báo lỗi. Cao = ít bịa.
- **FP-rate** = bịa lỗi trên câu đúng/ca biên. Thấp = tốt (với người mới, sửa SAI hại hơn bỏ SÓT).
- **Feedback VI** = tỉ lệ nhận xét (chiều A) đúng bằng tiếng Việt.
- **JSON hợp lệ** = tỉ lệ câu trả lời speaking đúng schema `{speech,feedback,corrected}`.
- **Type-hit\*** = ĐO GẦN ĐÚNG bằng từ khoá xem nhận xét có nhắm đúng loại lỗi không — CHỈ tham khảo, không dùng để pass/fail.

---

## ⚠️ DẢI NHIỄU — đọc TRƯỚC khi kết luận một PR làm tụt chất lượng

Hai lượt chạy **liên tiếp**, cùng prompt · cùng model · cùng bộ đề · cùng `--delay 3000`,
cách nhau vài phút, cho kết quả KHÁC nhau:

| Chỉ số      | Lượt 1 | Lượt 2 (số baseline ở trên) | Chênh |
| ----------- | ------ | --------------------------- | ----- |
| Recall      | 97.7%  | 97.7%                       | 0     |
| Precision   | 100.0% | 97.7%                       | −2.3  |
| FP-rate     | 0.0%   | 5.6%                        | +5.6  |
| Specificity | 100.0% | 94.4%                       | −5.6  |
| Type-hit    | 86.0%  | 76.7%                       | −9.3  |

Nguyên nhân: LLM lấy mẫu ngẫu nhiên. Đúng MỘT câu đổi phán đoán (`edge-05`: TN → FP) đã làm
FP-rate nhảy 5,6 điểm, vì mẫu số chỉ có 18 câu đúng/ca biên.

**Hệ quả cho luật ở `CLAUDE.md` mục 8** ("recall/precision không được tụt so với baseline"):

1. Chênh lệch **≤ 1 câu** trên bất kỳ chỉ số nào KHÔNG phải bằng chứng tụt chất lượng — nằm
   trong dải nhiễu. Với bộ đề hiện tại: FP-rate ±5,6 điểm · Specificity ±5,6 điểm ·
   Precision ±2,3 điểm · Recall ±2,3 điểm.
2. Type-hit dao động ~±10 điểm nên **không dùng để pass/fail** (đã ghi ở mục "Cách đọc").
3. Nghi ngờ tụt thật → chạy lại **≥ 3 lượt** rồi so trung bình, đừng kết luận từ một lượt.
4. Chỉ số đáng tin nhất trong bộ này là **Recall theo từng nhóm lỗi**: cả hai lượt đều cho
   9/11 nhóm tuyệt đối và cùng bỏ sót đúng `adj-02`. Một nhóm tụt hẳn nhiều câu mới là tín
   hiệu thật.

Muốn thu hẹp dải nhiễu thì phải mở rộng golden set (nhất là nhóm câu đúng/ca biên, hiện chỉ
18 câu), không phải chạy đi chạy lại cùng 62 câu.

---

> **Ghi chú khôi phục (2026-09-20):** file này (bản ghi TỰ ĐỘNG của `npm run eval:tutor --
--write-baseline`) từng bị GỘP vào `docs/research/dinh-huong-va-ke-hoach-chung.md` mục
> [6] trong một đợt dọn tài liệu, khiến CLAUDE.md mục 8 + `scripts/eval-tutor.ts` trỏ tới
> một đường dẫn không còn file thật — audit 2026-09-15 phát hiện (`docs/changelog/0328-*.md`).
> Khôi phục lại làm file thật ở đúng đường dẫn cũ (nội dung lấy nguyên văn từ bản gộp,
> KHÔNG đổi số liệu) để hết tham chiếu gãy — xem `docs/changelog/0384-*.md`. **Số liệu vẫn
> là bản chạy 2026-08-26, ĐÃ CŨ** — PR nào cần so sánh mới phải tự chạy lại
> `npm run eval:tutor -- --write-baseline` (cần key AI thật) trước khi dựa vào file này.
