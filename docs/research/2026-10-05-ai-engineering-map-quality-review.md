# Review chất lượng bản đồ bài học AI Engineering (Phase 00–18)

Ngày kiểm: 2026-10-05. Trạng thái: **Đã xử lý các lỗi truy vết được phát hiện; review runtime/chuyên môn sâu thuộc từng lát nội dung**. Nguồn đối chiếu là `rohitg00/ai-engineering-from-scratch` tại commit [`f6dbae74ef622b78a76df704f86eafcde9f4ef3f`](https://github.com/rohitg00/ai-engineering-from-scratch/commit/f6dbae74ef622b78a76df704f86eafcde9f4ef3f). Review này chỉ xem tài liệu nghiên cứu và mã bài học hiện có; không xác nhận độ đúng khoa học của toàn bộ 438 bài nguồn thuộc Phase 00–18, không chạy lab nguồn và không coi ID dự kiến là bài đã đăng ký.

## Findings cần xử lý

### [P1] Năm quyết định `EXTEND` không có ID bài DHCB trong source map

- **Vị trí:** `docs/research/2026-10-05-ai-engineering-source-map.csv`: `04-computer-vision/06-object-detection-yolo` (dòng 72), `04-computer-vision/09-image-generation-gans` (dòng 75), `11-llm-engineering/06-rag` (dòng 213), `11-llm-engineering/09-function-calling` (dòng 216), `16-multi-agent-and-swarms/04-primitive-model` (dòng 360). Cả năm có `decision=EXTEND`, `dhcb_lesson_id` rỗng.
- **Chứng cứ:** Bản đồ Phase 03–04 ghi neo gộp `cv2-u2-l1/l2/l3/l4` và `cv2-u3-l1/l2`; Phase 11 ghi `llmagent-u2-l1/l2/l3` và `llmagent-u3-l2/l3`; Phase 16 ghi ID mới dự kiến `multi-u1-l4`, trong khi chứng cứ Make thuộc `p6-u96-l1/l2`. Các ID gộp không phải một lesson ID hợp lệ để đưa vào cột một giá trị.
- **Tác động:** Bộ tổng hợp dựa vào CSV không thể nối năm quyết định `EXTEND` với một bài nền, có thể đếm nhầm như `NEW` hoặc bỏ liên kết tiền đề. Hàng `primitive-model` còn dễ bị hiểu nhầm rằng `multi-u1-l4` đã tồn tại, dù tài liệu đánh dấu prefix `multi-*` chỉ là dự kiến.
- **Sửa đề nghị:** Chọn một ID hiện hữu chính cho `dhcb_lesson_id` của mỗi hàng, ghi các neo phụ vào `notes`; giữ ID mới dự kiến ở trường riêng khi contract đã duyệt. Với `primitive-model`, dùng `p6-u96-l1` hoặc `p6-u96-l2` làm neo thực sau khi đọc Make và xác nhận lựa chọn.

### [P1] Phase 15 thiếu toàn bộ `Build It`, nhưng bản đồ tuyên bố đã rà cấu trúc này

- **Vị trí:** `docs/research/2026-10-05-ai-engineering-phase15-16-map.md:3` ghi đã rà 47/47 bài theo “ý chính Concept, cấu trúc Build It và Exercises”. Bảng Phase 15 ở dòng 15–36 đưa ra outcome và ID dự kiến cho 22 bài.
- **Chứng cứ:** Kiểm 22 file `phases/15-autonomous-systems/*/docs/en.md` tại commit ghim: **0/22 có heading `## Build It`**, **0/22 có `## Learning Objectives`**. Ví dụ [01-long-horizon-agents](https://github.com/rohitg00/ai-engineering-from-scratch/blob/f6dbae74ef622b78a76df704f86eafcde9f4ef3f/phases/15-autonomous-systems/01-long-horizon-agents/docs/en.md) có `The Problem`, `The Concept`, `Use It`, `Ship It`, `Exercises`; không có bài lab chuẩn để kiểm bước thực hành. [15-propose-then-commit](https://github.com/rohitg00/ai-engineering-from-scratch/blob/f6dbae74ef622b78a76df704f86eafcde9f4ef3f/phases/15-autonomous-systems/15-propose-then-commit/docs/en.md) cùng mẫu cấu trúc.
- **Tác động:** Người triển khai có thể hiểu các outcome/lab trong map là sao chép từ bài thực hành nguồn đã được kiểm, rồi bỏ qua việc tự thiết kế lab, rubric và phép đo. Rủi ro tập trung ở các chủ đề agent tự sửa, canary/kill switch, quyền chạy công cụ và quản trị chi phí.
- **Sửa đề nghị:** Đổi mô tả phương pháp thành “đọc Concept/Use It/Ship It/Exercises”; đánh mức kiểm chứng riêng `K1U` hoặc tương đương cho 22 hàng. Với từng hàng, ghi rõ outcome nào lấy từ nguồn và lab DHCB nào **phải tự thiết kế/kiểm bằng fixture an toàn**. Đọc sâu thân bài và nguồn gốc tham chiếu trước khi khóa mục tiêu.

### [P2] Hai bản đồ khác khái quát hóa mức kiểm `Build It` quá rộng

- **Vị trí:** `docs/research/2026-10-05-ai-engineering-phase09-10-map.md:3` ghi đã rà bước Build It cho 36/36 khóa bài. `docs/research/2026-10-05-ai-engineering-phase15-16-map.md:3` cũng áp câu “cấu trúc Build It” cho toàn bộ Phase 16.
- **Chứng cứ:** Phase 10 có **3/24** file không có `## Build It`: [19-dualpipe-parallelism](https://github.com/rohitg00/ai-engineering-from-scratch/blob/f6dbae74ef622b78a76df704f86eafcde9f4ef3f/phases/10-llms-from-scratch/19-dualpipe-parallelism/docs/en.md), [20-deepseek-v3-walkthrough](https://github.com/rohitg00/ai-engineering-from-scratch/blob/f6dbae74ef622b78a76df704f86eafcde9f4ef3f/phases/10-llms-from-scratch/20-deepseek-v3-walkthrough/docs/en.md), [21-jamba-hybrid-ssm-transformer](https://github.com/rohitg00/ai-engineering-from-scratch/blob/f6dbae74ef622b78a76df704f86eafcde9f4ef3f/phases/10-llms-from-scratch/21-jamba-hybrid-ssm-transformer/docs/en.md). Phase 16 có **1/25**: [25-case-studies-2026-sota](https://github.com/rohitg00/ai-engineering-from-scratch/blob/f6dbae74ef622b78a76df704f86eafcde9f4ef3f/phases/16-multi-agent-and-swarms/25-case-studies-2026-sota/docs/en.md). Các hàng tương ứng nằm ở Phase 10 dòng 50–52 và Phase 16 dòng 66.
- **Tác động:** Với bốn bài này, outcome có thể vẫn hợp lý, nhưng mức bằng chứng được trình bày cao hơn thực tế. Lab/lịch GPU/phân tích cấu hình cần thiết kế và xác nhận độc lập, không được coi là đã có bước Build It nguồn.
- **Sửa đề nghị:** Đổi lời mở đầu thành số đếm thực: Phase 10 `21/24`, Phase 16 `24/25` có Build It; gắn mức kiểm riêng cho bốn hàng và ghi rõ phần bài tập lấy từ `Use It`/`Exercises` hay do DHCB tự đề xuất.

### [P2] Chưa có bản đồ kiểm chứng riêng cho sáu phase đã phân loại trong CSV

- **Vị trí:** `docs/research/2026-10-05-ai-engineering-source-map.csv` đã gán `EXTEND`/`NEW` cho Phase **00, 02, 07, 08, 13, 14**, tổng **146 bài**, nhưng tại thời điểm review chưa có file `phase00`, `phase02`, `phase07-08` hoặc `phase13-14` map tương ứng trong `docs/research/`.
- **Tác động:** CSV có outcome, ID và evidence ngắn, nhưng thiếu bản ghi cùng độ sâu/mức kiểm chứng như các map Phase 01, 03–06, 09–12, 15–18. Đặc biệt 31 bài Transformer/Generative AI và 85 bài Phase 13–14 có thể bị khóa quyết định EXTEND/NEW khi chưa nhìn lab và Make ở cùng chuẩn. Đây là **lỗ hổng truy vết**, không phải khẳng định CSV sai.
- **Sửa đề nghị:** Trước khi duyệt phạm vi triển khai, tạo map chi tiết hoặc bổ sung cột mức kiểm chứng và bằng chứng lab vào CSV cho 146 hàng; nêu rõ những hàng chỉ đọc tiêu đề/Concept. Nếu map đang được tác giả khác viết, chỉ đóng finding sau khi file đã xuất hiện và được đối chiếu khóa bài.

## Những kiểm tra không phát hiện lỗi

- Đối chiếu tên source trong các map Phase 01, 03–06, 09–12, 15–18 với source map CSV: **292/292 hàng** ở các map hiện có đủ khóa tương ứng, không trùng khóa trong cùng map. Phase 00/02/07/08/13/14 được ghi là thiếu map riêng ở trên, không tính vào 292.
- Trong CSV tại thời điểm kiểm, `source_key`, `source_path`, `source_url` đều không trùng. Phase 00–18 có 144 hàng `EXTEND`: 139 ID chính đã nhập đều tồn tại trong `packages/subject-programming`, năm hàng rỗng nêu ở finding đầu. Các ID `nlp-*`, `speech-*`, `rl-*`, `llmcore-*`, `auto-*`, `multi-*`, `TBD-*` trong bản đồ được tác giả đánh dấu là **dự kiến**, nên không báo là ID hỏng.
- `source-map.csv` được cập nhật đồng thời trong lúc review. Tại lần kiểm cuối, cả 523 hàng đã có `NEW`/`EXTEND` và không còn `UNREVIEWED`; quyết định của 292 hàng trong các map hiện có khớp CSV. Review này không sửa CSV hoặc tài liệu của nhóm khác.

## Kiểm tra cần chạy khi hợp nhất

1. So bộ `source_key` CSV với inventory 523/523; mỗi khóa đúng một hàng. Kiểm lại sau lần hợp nhất cuối vì CSV đang được ghi đồng thời.
2. So decision/ID/evidence trong CSV với map ở cùng commit; nếu `NEW` dự kiến có prefix mới, kiểm contract registry/loader trước khi dùng làm ID sản phẩm.
3. Đọc sâu body và thử bài lab/fixture trước khi chuyển bất kỳ hàng `EXTEND`/`NEW` nào sang đặc tả **Approved for implementation**; ưu tiên các hàng thiếu Build It ở findings trên.

## Xử lý sau review — 2026-10-05

- Đã điền năm ID hiện hữu chính trong CSV sau khi đối chiếu body/Make; neo phụ và ID dự kiến giữ trong notes. Kiểm cuối không còn EXTEND thiếu ID.
- Hai bản đồ Phase 09–10 và 15–16 đã sửa lời mô tả phương pháp theo cấu trúc nguồn thực tế. CSV có `verification_level` cho từng hàng; Phase 15 và bốn trường hợp không có Build It được gắn K1U. Các lab tương ứng phải tự thiết kế và chạy kiểm trước phát hành.
- 146 hàng có bằng chứng trực tiếp trong CSV được bổ sung mức kiểm chứng rõ ràng. CSV là bản đồ chính thức; không bắt buộc tạo bản Markdown lặp lại nếu outcome/evidence/mức kiểm đã có. Điều này giải quyết truy vết, không xác nhận độ đúng hoặc runtime của bài chưa soạn.
- Thống kê trước đây ở phần findings là snapshot lúc phát hiện; trạng thái cuối cần lấy từ CSV và goal đã hợp nhất. Spec chương trình được duyệt về kiến trúc/quy trình; từng bài vẫn phải qua rubric và test trước khi công bố.
