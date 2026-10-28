# Eval gia sư AI — baseline (⑤ T1)

> ## Hiệu lực — cập nhật 2026-10-28 (changelog 0683, sau F-011)
>
> Baseline dưới đây chạy trên VPS với cấu hình production sau #1462 + #1464 (sửa prompt chấm, F-011).
> Chủ dự án chạy tay, dán nguyên văn kết quả vào phiên; số liệu chép đúng nguyên văn. Chạy **MỘT lượt**.
> Trong cùng ngày, hai lượt khác trên cùng prompt cho 95,8 % / 5,0 % (bộ 180 câu) và 97,7 % / 0 %
> (bộ 62 câu × 3 lượt) — xem changelog `0682`.
>
> **So với baseline 2026-10-25** (mục "Lịch sử" bên dưới): recall 99,2 → 96,7 %, FP-rate
> 53,3 → 3,3 %, precision 78,8 → 98,3 %. Đổi có chủ đích: bỏ bịa lỗi ở câu đúng, đổi lấy vài câu sai
> bị bỏ sót. Các ca bỏ sót còn lại chủ yếu là gia sư lặng lẽ nói lại dạng đúng trong lời thoại thay vì
> chỉ lỗi (`x-b-tonemark-03`, `x-b-wordorder-07`).

> Sinh tự động bởi `npm run eval:tutor -- --write-baseline`. KHÔNG sửa tay phần số liệu.
> Phương pháp + cách đọc chỉ số: xem cuối file.

- **Ngày chạy:** 2026-10-28
- **Provider · model:** Anthropic · claude-haiku-5-5 (effort low)
- **Golden set:** 180 câu (120 lỗi · 43 đúng · 17 ca biên)
- **Chế độ chạy:** chat

## Tổng hợp

| Chế độ | Chấm được | Recall | Precision | FP-rate | Specificity | Feedback VI | JSON hợp lệ | Type-hit* |
| ------ | --------- | ------ | --------- | ------- | ----------- | ----------- | ----------- | --------- |
| chat   | 180       | 96.7%  | 98.3%     | 3.3%    | 96.7%       | 100.0%      | —           | 68.1%     |

## Recall theo loại lỗi — chế độ chat

| Loại lỗi        | Bắt được / Tổng |
| --------------- | --------------- |
| third_person_s  | 8/8             |
| plural_s        | 8/8             |
| article         | 8/8             |
| tense           | 11/11           |
| aux_verb        | 8/9             |
| missing_be      | 8/8             |
| extra_be        | 8/8             |
| preposition     | 8/8             |
| adjective_order | 8/8             |
| pronoun         | 7/8             |
| word_by_word    | 8/8             |
| tone_mark       | 7/8             |
| classifier      | 8/8             |
| word_order      | 7/8             |
| negation        | 8/8             |

**Bỏ sót lỗi (FN):** aux-01, x-b-tonemark-03, x-b-wordorder-07, x-b-pronoun-02

**Bịa lỗi ở câu đúng/ca biên (FP):** x-a-edge-01, x-b-correct-17

## Cách đọc

- **Recall** = bắt được lỗi thật / tổng câu có lỗi. Cao = ít bỏ sót.
- **Precision** = báo lỗi đúng / tổng lần báo lỗi. Cao = ít bịa.
- **FP-rate** = bịa lỗi trên câu đúng/ca biên. Thấp = tốt (với người mới, sửa SAI hại hơn bỏ SÓT).
- **Feedback VI** = tỉ lệ nhận xét (chiều A) đúng bằng tiếng Việt.
- **JSON hợp lệ** = tỉ lệ câu trả lời speaking đúng schema `{speech,feedback,corrected}`.
- **Type-hit\*** = ĐO GẦN ĐÚNG bằng từ khoá xem nhận xét có nhắm đúng loại lỗi không — CHỈ tham khảo, không dùng để pass/fail.

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

## Lịch sử — baseline 2026-10-25 (bộ 180 câu, Anthropic, trước khi sửa F-011)

> **Ghi chú lúc ghi baseline này (2026-10-25, changelog 0664, đóng F-008):**
>
> Baseline dưới đây là **lần đầu** của bộ 180 câu, chạy trên VPS với cấu hình production
> (chủ dự án chạy tay, dán nguyên văn kết quả vào phiên; số liệu chép đúng nguyên văn). Chạy **MỘT lượt**
> (không `--runs 3`), nên chưa có khoảng Wilson — so sánh PR sau chỉ coi là khác khi chênh vượt
> "Dải nhiễu" cuối file. Baseline cũ (2026-08-26, 62 câu, Groq) giữ ở mục "Lịch sử" để đối chiếu với
> `npm run eval:tutor -- --limit 62`.
>
> **Điểm cần theo dõi:** FP-rate 53,3 % — bịa lỗi ở 32/60 câu đúng/ca biên, nặng nhất ở câu đúng
> chiều B (`x-b-correct-*` 14/21). Với người mới, sửa SAI hại hơn bỏ sót: đây là việc nên làm tiếp
> (sửa prompt chấm ⇒ bắt buộc chạy lại `eval:tutor` theo CLAUDE.md §8).
>
> **Tụt so với baseline cũ trên CÙNG 62 câu** (đếm từng dòng trong log lượt chạy này): 44/44 câu lỗi
> bắt được (recall 100 %), nhưng 9/18 câu đúng/ca biên bị bịa lỗi (ok-01/03/05/06/08,
> edge-01/03/04/05) ⇒ FP-rate ≈ 50 % so với 5,6 % ngày 2026-08-26 (Groq · gpt-oss-120b). Khác biệt
> vượt xa "Dải nhiễu" cuối file — đây là tụt chất lượng thật kể từ khi Claude làm AI chính (#1315),
> ghi thành phát hiện F-011 (changelog 0664).

> Sinh tự động bởi `npm run eval:tutor -- --write-baseline`. KHÔNG sửa tay phần số liệu.
> Phương pháp + cách đọc chỉ số: xem cuối file.

- **Ngày chạy:** 2026-10-25
- **Provider · model:** Anthropic · claude-haiku-5-5 (effort low)
- **Golden set:** 180 câu (120 lỗi · 43 đúng · 17 ca biên)
- **Chế độ chạy:** chat

#### Tổng hợp

| Chế độ | Chấm được | Recall | Precision | FP-rate | Specificity | Feedback VI | JSON hợp lệ | Type-hit* |
| ------ | --------- | ------ | --------- | ------- | ----------- | ----------- | ----------- | --------- |
| chat   | 180       | 99.2%  | 78.8%     | 53.3%   | 46.7%       | 100.0%      | —           | 58.0%     |

#### Recall theo loại lỗi — chế độ chat

| Loại lỗi        | Bắt được / Tổng |
| --------------- | --------------- |
| third_person_s  | 8/8             |
| plural_s        | 8/8             |
| article         | 8/8             |
| tense           | 11/11           |
| aux_verb        | 9/9             |
| missing_be      | 8/8             |
| extra_be        | 8/8             |
| preposition     | 8/8             |
| adjective_order | 8/8             |
| pronoun         | 8/8             |
| word_by_word    | 8/8             |
| tone_mark       | 8/8             |
| classifier      | 8/8             |
| word_order      | 8/8             |
| negation        | 7/8             |

**Bỏ sót lỗi (FN):** x-b-negation-07

**Bịa lỗi ở câu đúng/ca biên (FP):** ok-01, ok-03, ok-05, ok-06, ok-08, edge-01, edge-03, edge-04, edge-05, x-a-correct-01, x-a-correct-08, x-a-correct-09, x-a-edge-01, x-a-edge-05, x-b-correct-01, x-b-correct-03, x-b-correct-05, x-b-correct-06, x-b-correct-07, x-b-correct-08, x-b-correct-09, x-b-correct-10, x-b-edge-03, x-b-edge-04, x-b-edge-05, x-b-correct-11, x-b-correct-12, x-b-correct-15, x-b-correct-17, x-b-correct-19, x-b-correct-20, x-b-correct-21

## Lịch sử — baseline cũ 2026-08-26 (bộ 62 câu, Groq)

> Sinh tự động bởi `npm run eval:tutor -- --write-baseline`. KHÔNG sửa tay phần số liệu.
> Phương pháp + cách đọc chỉ số: xem cuối file.

- **Ngày chạy:** 2026-08-26
- **Provider · model:** Groq · openai/gpt-oss-120b (3 key)
- **Golden set:** 62 câu (44 lỗi · 12 đúng · 6 ca biên)
- **Chế độ chạy:** chat

#### Tổng hợp

| Chế độ | Chấm được | Recall | Precision | FP-rate | Specificity | Feedback VI | JSON hợp lệ | Type-hit* |
| ------ | --------- | ------ | --------- | ------- | ----------- | ----------- | ----------- | --------- |
| chat   | 62        | 97.7%  | 97.7%     | 5.6%    | 94.4%       | 100.0%      | —           | 76.7%     |

#### Recall theo loại lỗi — chế độ chat

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
