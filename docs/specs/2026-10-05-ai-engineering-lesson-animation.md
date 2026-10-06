# Đặc tả: Hoạt họa giải thích cơ chế trong các khóa AI Engineering

> Trạng thái: **Approved for implementation**, chủ dự án DHCB xác nhận ngày 2026-10-05; đã merge qua [PR #1236](https://github.com/seeker19110/dhcb/pull/1236) tại `93904be` trước khi sửa source. Đối chiếu mã nguồn ngày 2026-10-05; số bài và danh sách hoạt họa cuối cùng phải lấy từ bảng đối chiếu chương trình mới, không suy từ tên khóa.

## 0. Một câu

Gắn các hoạt họa ngắn, đúng chuyên môn và đọc được trên mọi thiết bị vào bài học AI khi chuyển động giúp người học hiểu một cơ chế mà hình tĩnh và ví dụ code chưa truyền đạt đủ.

## ① Phạm vi và nguyên tắc sư phạm

**Làm khi triển khai:**

- Chọn hoạt họa từ mục tiêu học tập cụ thể: người học phải trả lời được câu hỏi về **thứ tự, luồng dữ liệu, thay đổi trạng thái hoặc quan hệ nhân quả** sau khi xem.
- Viết storyboard và kiểm duyệt nội dung chuyên môn trước khi tạo `animation`. Mỗi hoạt họa giải thích đúng **một cơ chế**, có nhãn trạng thái ban đầu, biến đổi, kết quả, và lời dẫn tương ứng.
- Dùng `LessonAnimationSchema`/`LessonAnimation` hiện có cho dữ liệu khai báo, render bằng `packages/core-ui/LessonAnimation.tsx`; mở rộng hợp đồng và màn bài học thường của Lập trình theo cách tương thích bài cũ.
- Mở rộng công cụ chụp hoạt họa để nhận bài học Lập trình, chụp năm mốc trên desktop/mobile, rồi người soạn **mở và đọc** ảnh dải của từng hoạt họa trước khi báo hoàn tất.
- Làm thí điểm theo chủ đề đại diện, sửa lỗi bằng chứng thị giác phát hiện, rồi mới nhân rộng theo bảng đối chiếu bài học AI.

**Không làm:**

- Không đặt chỉ tiêu "mọi bài đều phải có hoạt họa". Bài dạy cú pháp, định nghĩa, công thức đứng yên, quyết định thiết kế hoặc đạo đức AI có thể dùng văn bản, code chạy được, bảng hoặc hình tĩnh hiệu quả hơn.
- Không dùng hoạt họa trang trí, logo nhấp nháy, nền chuyển động hay chuyển cảnh chỉ để tạo cảm giác hiện đại.
- Không nhúng SVG/HTML tự do trong dữ liệu bài học; không thêm thư viện hoạt họa khi schema hiện có biểu đạt được ý cần dạy.
- Không biến hoạt họa thành nguồn duy nhất của kiến thức hay thành điều kiện chấm điểm/ghi tiến độ. Không dùng mô phỏng làm khẳng định về hiệu năng, độ chính xác hoặc tính an toàn của mô hình thật nếu chưa có thí nghiệm.
- Không tự động phát video, âm thanh, gọi API hay tải model cho phần minh họa.

**Quy tắc chọn:** một ứng viên được nhận khi (1) nêu được câu hỏi học tập kiểm tra được; (2) ít nhất ba trạng thái khác nhau có ý nghĩa; (3) trạng thái cuối giúp giải thích câu trả lời; (4) mô tả chữ độc lập với chuyển động; (5) người duyệt nội dung xác nhận sơ đồ không gây hiểu sai. Nếu không đủ, dùng hình tĩnh hoặc ví dụ thực thi. Ưu tiên thao tác có người học thường hiểu nhầm: token khác từ, attention không phải "đọc tất cả như nhau", gradient là hướng cập nhật, truy hồi tài liệu không phải mô hình tự nhớ chính xác.

## ② Điểm chạm đã xác minh

| Việc                    | Đường dẫn                                                                                                                                     | Trạng thái hiện tại / yêu cầu triển khai                                                                                                                                                          |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hợp đồng chung          | `packages/core-contracts/lessonAnimation.ts`                                                                                                  | `LessonAnimationSchema` strict: 1–60 hình, tối đa 20 keyframe/hình, 12 caption, duration 500–60.000 ms. Tái dùng; thay schema chỉ khi có storyboard chứng minh thiếu khả năng biểu đạt.           |
| Renderer chung          | `packages/core-ui/LessonAnimation.tsx`                                                                                                        | Có mô tả chữ, caption, phát/dừng, `prefers-reduced-motion`, hộp `Xem lớn`. Không fork renderer.                                                                                                   |
| Bài thường Lập trình    | `packages/subject-programming/lessonTypes.ts`                                                                                                 | `LessonSchema` hiện **không có** `animation`; Zod `.strict()` sẽ từ chối dữ liệu thêm tùy tiện. Thêm trường optional `animation: LessonAnimationSchema` và test dữ liệu.                          |
| Trang bài thường        | `apps/dhcb/src/pages/subjects/programming/ProgrammingLessonPage.tsx`                                                                          | Sáu màn của khuôn tám bước; mục `concept` hiện chỉ có `hook` + `theory`. Render hoạt họa tùy chọn sau lý thuyết, trước ví dụ mẫu; không tạo bước bắt buộc mới.                                    |
| Module hướng chuyên sâu | `packages/subject-programming/specializations/stageDetailTypes.ts` và `apps/dhcb/src/pages/subjects/programming/ProgrammingSpecStagePage.tsx` | Đã có trường `animation?` và renderer sau “Kiến thức”, trước “Tự tay làm”. Chỉ bổ sung nội dung khi mục tiêu của module phù hợp; tránh lặp cùng cơ chế ở cả bài thường và module.                 |
| Cổng dữ liệu chuyên sâu | `packages/subject-programming/specStageDetails.test.ts`                                                                                       | Đã parse mọi module có hoạt họa bằng schema chung. Mở rộng cổng tương tự cho **mọi bài thường AI**, kể cả bài nạp lười.                                                                           |
| Công cụ ảnh             | `scripts/shots-lesson-animations.ts`, lệnh `npm run shots:lesson-anim`                                                                        | Hiện nhận math, physics, chemistry, biology ở viewport 760 px, chụp mốc 2/25/50/75/98%. Mở rộng `programming` và hai viewport 1440/390, giữ khả năng chọn `--only`; ảnh ở thư mục tạm ngoài repo. |
| Test UI                 | `apps/dhcb/src/pages/subjects/programming/ProgrammingLessonPage.test.tsx` và `packages/core-ui/LessonAnimation.test.tsx`                      | Canh bài có/không có hoạt họa, mô tả, vùng render, điều khiển bàn phím, reduced motion và lỗi hồi quy renderer.                                                                                   |

Trước khi sửa các điểm chạm, chạy `npm run codemap -- impact <file>` cho từng hotspot. Công cụ ảnh tạo file chỉ để rà và **không commit** ảnh chụp. Tài liệu nguồn của hạ tầng và các lỗi đã gặp: `docs/specs/2026-09-21-hoat-anh-mo-phong-bai-hoc.md`, `TRAPS.md` mục hoạt họa, `docs/changelog/0407-*`, `0408-*`.

## ③ Hợp đồng dữ liệu và cách hiển thị

```ts
// Hướng đề xuất; tên import thực tế theo quy ước package.
const LessonSchema = z
  .object({
    // ...toàn bộ trường hiện có, không đổi id/progress
    animation: LessonAnimationSchema.optional(),
  })
  .strict()
```

- `animation` nằm trên **bài**, không nằm trên khóa học/chương. Danh sách khóa chỉ tham chiếu `lessonIds`; cùng một bài dùng ở nhiều khóa có cùng một hoạt họa, không nhân bản nội dung.
- Người soạn khai `title`, `description` 20–800 ký tự, `shapes` và `captions` theo trạng thái. Caption tối đa 12 và là bản tóm tắt **đầy đủ** của chuỗi, không chỉ lời phụ đề cho người nhìn được hình. Tránh gọi tên màu trong mô tả vì token đổi theo theme.
- Mỗi shape có `id` riêng, role màu từ enum. Chữ SVG là chữ thật, tương phản theo quy định dự án; không dựa riêng vào màu để phân biệt trạng thái. Hình cần hiện muộn phải điều khiển opacity bằng keyframe từ 0 tới cuối; overlay không tô đục che hình. Nhãn của vật chuyển động phải đi theo vật. Mốc quyết định cách nhau ít nhất 600 ms để người học nhận ra.
- Hoạt họa mặc định ngắn (đề xuất 4–12 giây) và lặp chỉ khi lặp giúp hiểu cơ chế tuần hoàn. Tiến trình tuyến tính nên dừng ở kết quả (`loop: false`) để người học đọc được trạng thái cuối. Renderer hiện chỉ có phát/dừng; nếu thí điểm chứng minh cần điều khiển từng bước, phải có đặc tả và test tương tác riêng trước khi mở rộng, không nhồi nhiều trạng thái khó đọc vào một hoạt họa.
- Khi hoạt họa tự chạy hơn 5 giây song song với nội dung khác, nút tạm dừng/dừng là yêu cầu kiểm theo [WCAG 2.2 SC 2.2.2](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide). Không dùng việc có `prefers-reduced-motion` làm lý do bỏ quyền điều khiển trực tiếp.
- Ảnh đầu phải tự có ý nghĩa; ảnh cuối phải giải thích kết luận. `prefers-reduced-motion` hiện tắt animation và giữ cảnh đầu, nên **description + captions liệt kê toàn bộ chuỗi bằng chữ** là điều kiện nghiệm thu bắt buộc.

**Ca lỗi:** dữ liệu vượt giới hạn, trùng id hoặc keyframe quá `durationMs` phải bị cổng Zod chặn trước build; bài không có `animation` vẫn render và chấm như cũ. Mô tả thiếu quan hệ nhân quả hoặc cảnh không khớp lời dẫn là lỗi nội dung phải sửa trước phát hành dù parse xanh.

## ④ Storyboard mẫu theo nhóm chủ đề AI

Các cảnh dưới đây là **ứng viên**, chưa phải lời hứa mỗi bài của repo tham chiếu đều có hoạt họa. Mỗi hàng là một hoạt họa độc lập, tối đa một cơ chế chính. ID bài sẽ gán sau khi bảng đối chiếu nội dung được chốt.

| #   | Cơ chế và câu hỏi học tập                                      | Ba trạng thái chính / cảnh kết                                                                              | Điều cần canh để không sai                                                                               |
| --- | -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| 1   | Gradient descent: vì sao trọng số đổi?                         | Điểm trên đường loss → mũi tên gradient tại điểm → bước cập nhật ngược gradient → loss mới                  | Minh họa một chiều; bước quá lớn có thể vượt cực tiểu, không ngầm hứa luôn hội tụ.                       |
| 2   | Backpropagation: sai số đi về lớp trước ra sao?                | Forward qua 2–3 lớp → so dự đoán và mục tiêu → tín hiệu gradient đi ngược từng cạnh → tham số được cập nhật | Tách rõ giá trị kích hoạt và gradient, không vẽ "dữ liệu huấn luyện chảy ngược".                         |
| 3   | Convolution: kernel chia sẻ trọng số thế nào?                  | Ô ảnh + kernel → cửa sổ trượt → một giá trị feature map mỗi vị trí → bản đồ đầu ra                          | Kích thước/padding/stride phải khớp vị trí, phép nhân cộng trong ví dụ tính đúng.                        |
| 4   | Tokenization BPE: token khác từ ra sao?                        | Chuỗi ký tự → cặp phổ biến được gộp → token IDs → chuỗi giải mã                                             | Minh họa một ví dụ cụ thể, không tuyên bố mọi tokenizer luôn cho cùng phân đoạn.                         |
| 5   | Self-attention: trọng số trộn thông tin từ token khác thế nào? | Token truy vấn → điểm số với các token khác → chuẩn hóa trọng số → vector tổng hợp                          | Tỷ lệ mũi tên/nhãn phải tương ứng số ví dụ; không nhân cách hóa attention như giải thích đầy đủ mô hình. |
| 6   | Transformer causal mask: vì sao token không thấy tương lai?    | Lưới vị trí → ô tương lai bị che → hàng trọng số hợp lệ → dự đoán token tiếp                                | Cột/hàng phải đúng chiều; phân biệt mask nhân quả với padding mask.                                      |
| 7   | Sinh token tự hồi quy: một câu được tạo ra sao?                | Prompt → phân phối token tiếp → chọn token → nối token vào ngữ cảnh → lặp                                   | Thể hiện chọn mẫu bằng ví dụ, không ngầm khẳng định token được chọn luôn có xác suất cao nhất.           |
| 8   | Diffusion: nhiễu được gỡ theo từng bước thế nào?               | Hình sạch → thêm nhiễu theo lịch (huấn luyện) → mẫu nhiễu → các bước khử nhiễu → hình giả lập               | Đánh dấu hai quá trình huấn luyện và sinh mẫu là hai chiều khác nhau; hình chỉ là minh họa.              |
| 9   | RAG: tài liệu đi vào câu trả lời ở đâu?                        | Câu hỏi → embedding/truy hồi top-k → đoạn được chọn → ghép prompt → câu trả lời có trích dẫn                | Không vẽ "nạp tài liệu vào trọng số"; nêu rõ truy hồi sai thì câu trả lời có thể sai.                    |
| 10  | Tool calling/MCP: quyền và dữ liệu di chuyển thế nào?          | Mô hình đề xuất call → ứng dụng kiểm/định tuyến → tool trả dữ liệu → mô hình tổng hợp                       | Tool thực thi ở môi trường ứng dụng; animation không gợi ý mô hình tự có quyền gọi hành động.            |
| 11  | Agent loop và nhiều agent: trạng thái được bàn giao ra sao?    | Mục tiêu → lập bước → tool/agent chuyên trách → kiểm kết quả → tiếp tục/dừng                                | Phân biệt đề xuất của AI với thay đổi trạng thái có thẩm quyền; có điểm dừng và xử lý lỗi.               |
| 12  | Đánh giá và serving: phân phối phiên bản ra sao?               | Tập eval → so hai phiên bản bằng cùng ca → canary nhỏ → theo dõi lỗi/độ trễ → rollback                      | Số liệu ví dụ phải ghi là giả lập; không trộn tỷ lệ đạt eval với bảo đảm an toàn sản xuất.               |

Với chủ đề âm thanh, RL, đa phương thức hoặc an toàn AI, người soạn áp cùng tiêu chí chọn; chỉ thêm storyboard khi bài thật có mục tiêu rõ. Với ví dụ phương trình/thuật toán, reviewer đối chiếu từng mốc với đáp án số hoặc một chương trình tham chiếu, không dựa vào vẻ hợp lý của hình.

## ⑤ Cổng chất lượng và tiêu chí chấp nhận

**Cổng cho từng hoạt họa, trước khi merge nội dung:**

1. Bảng đối chiếu ghi bài ID, mục tiêu, câu hỏi kiểm tra, lý do cần chuyển động, reviewer chuyên môn, và một storyboard 3–5 trạng thái. Bài không đạt quy tắc chọn ở ① không thêm `animation`.
2. Dữ liệu toàn bộ bài học qua `LessonSchema` và `LessonAnimationSchema.safeParse`; test canh id hình duy nhất, keyframe hợp lệ, caption/mô tả có đủ trạng thái. Bài cũ không có hoạt họa vẫn xanh.
3. Test UI xác nhận hoạt họa xuất hiện đúng bước `concept`, không xuất hiện khung rỗng ở bài thiếu, renderer có mô tả, nút phát/dừng và `Xem lớn` khi chữ nhỏ. Test reduced motion xác nhận cảnh đứng và bản chữ đọc được.
4. Chụp **5 mốc 2/25/50/75/98%** cho cả **1440 px và 390 px** ở ít nhất hai theme tương phản (blue-sky và dark-blue) trên trang thực; công cụ chụp rời của STEM có thể hỗ trợ rà sơ bộ nhưng không thay ảnh trang thật. Kiểm browser `getAnimations().length > 0`, so ảnh ít nhất 3 mốc có thay đổi thực. Người soạn và reviewer đều xem ảnh dải, ghi nhận không có nhãn tràn/đè, mũi tên sai chiều, nội dung bị cắt, chữ quá nhỏ. Ở mobile kiểm nút `Xem lớn` và hộp thoại có thể đọc toàn bộ nhãn.
5. Đọc bằng bàn phím và trình đọc màn hình: focus tới nút phát/dừng/Xem lớn/Đóng, Esc thoát và trả focus; toàn bộ thông tin có trong văn bản kể cả khi tắt chuyển động. Chữ nội dung đạt AAA ≥7:1, controls AA, các theme hiện hành qua cổng a11y.
6. Không có fetch/model/runtime trả phí từ hoạt họa; chỉ CSS transform/opacity trên SVG. Đo trang bài có hoạt họa thí điểm ở 390/1440: không gây layout shift khi hiện nút `Xem lớn`, không làm hỏng thao tác cuộn và nhập code; xem size budget hiện hành và Lighthouse/trace nếu có suy giảm rõ. Không đặt ngân sách byte hoặc FPS tùy tiện khi chưa có baseline; ghi baseline, số đo sau sửa và ngưỡng chấp nhận vào PR thí điểm.
7. Gate cuối cho PR chạm UI: `npm run build`, `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm test`, `npm run test:e2e` và kiểm ảnh Tầng 8b. Các lệnh phải chạy trên commit cuối sau khi gộp mọi agent.

**Cổng phát hành theo lô:** thí điểm 3–5 hoạt họa từ các nhóm khác nhau ở bảng ④; reviewer xác nhận cả kiến thức lẫn khả năng đọc. Sau đó nhân rộng chỉ cho các bài đã qua bảng chọn. Không đánh dấu hoàn thành bằng số lượng hoạt họa nếu ảnh hoặc câu hỏi học tập chưa được duyệt. Mỗi lô có danh sách bài, ảnh chứng cứ ngoài repo, lỗi đã sửa, bài cố ý dùng hình tĩnh, và số bài còn thiếu.

## ⑥ Bất biến và phân việc

| Bất biến                                                          | Cổng canh                                                        |
| ----------------------------------------------------------------- | ---------------------------------------------------------------- |
| Nội dung bài là dữ liệu strict, không có SVG/HTML tùy ý           | `LessonSchema` + `LessonAnimationSchema` và test mọi lesson      |
| Bài cũ, ID tiến độ, grading, SRS và nạp lười không đổi            | test `lessons*.test.ts`, `lessonsLazy.test.ts`, trang học và e2e |
| Màu theo role, nhãn chữ đủ tương phản, không chỉ màu truyền nghĩa | schema + a11y AA/AAA + ảnh các theme                             |
| Khi giảm chuyển động, lời giải vẫn đầy đủ                         | test renderer + duyệt description/captions                       |
| Animation chạy thật và đúng cơ chế                                | browser `getAnimations`, năm ảnh mốc và reviewer chuyên môn      |
| Không đưa animation vào mastery, billing, quyền hoặc chi phí AI   | review diff và test luồng bài học                                |

Trình tự giao việc độc lập: (A) hợp đồng bài thường + test parse; (B) trang bài thường + test UI, sau khi A cố định interface; (C) mở rộng công cụ ảnh và script kiểm; (D) các lô storyboard/nội dung ở **file bài khác nhau**, sau khi A–C hợp nhất. Mỗi agent có tập file viết riêng; chỉ coordinator sửa file registry, generated index, lockfile hoặc schema chung. Không cho nhiều agent cùng chạy generator gây ghi đè chỉ mục. Coordinator rà từng diff, chạy đầy đủ gate và xem ảnh sau gộp.

## Nghiệm thu đặc tả

- Tài liệu này đã được **Approved for implementation** ngày 2026-10-05; phải merge theo `AGENTS.md` trước khi sửa source. Quyết định phạm vi khóa AI và bảng đối chiếu bài học nằm ở đặc tả/goal cấp chương trình.
- Điều còn cần chốt trước nguồn thay đổi: danh sách ID bài cụ thể, baseline hiệu năng/size, bộ ví dụ số có đáp án để reviewer kiểm từng storyboard, và cách mở rộng công cụ ảnh `programming` mà không sửa tập ảnh STEM hiện có.
