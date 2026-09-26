# Goal: Nâng cấp UI/UX và độ tin cậy sư phạm

| Thuộc tính        | Giá trị                                                                                              |
| ----------------- | ---------------------------------------------------------------------------------------------------- |
| Goal ID           | GOAL-2026-0923-UIUX-PEDAGOGY                                                                         |
| Owner             | Chủ sản phẩm Đồng Hành; agent phụ trách kế hoạch và bằng chứng kỹ thuật                              |
| Trạng thái        | IN PROGRESS — S07b/c cũng đã merge; nghiệm thu kỹ thuật và người thật còn mở                         |
| Bắt đầu           | 2026-09-23                                                                                           |
| Target review     | Sau từng slice; tổng lịch được ước lượng lại sau M1                                                  |
| Quyền được cấp    | Tự quyết kế hoạch, triển khai, push và auto-merge qua required checks theo chỉ thị người dùng        |
| Budget/guardrails | Một outcome/PR; tối đa 3 lần sửa cùng lỗi; 0 paid provider trong test; không production data/secrets |

## 1. Outcome và Definition of Goal Complete

Người học vào đúng môn, học đúng ngôn ngữ, làm câu hỏi hợp lệ, hiểu phản hồi, sửa được
lỗi và biết chính xác bài/kết quả đã lưu hay chưa. Các luồng này dùng được trên mobile,
bàn phím và công nghệ hỗ trợ.

Kế hoạch tiếp nối [Learning UX 15/09](2026-09-15-learning-ux.md) và các spec UI clarity;
tái sử dụng hạ tầng đã có. Không kế thừa quyền merge/approval hay checklist hoàn thành
của goal cũ. Không sửa lại trạng thái lịch sử khi chưa đối chiếu bằng chứng.

### Metric baseline → target

| Tiêu chí           | Baseline đã biết                                            | Đích nghiệm thu                                                                                                                            |
| ------------------ | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Lỗi audit F1–F8    | 8 phát hiện ở SHA 1d9e247e                                  | 8/8 được sửa và có test hồi quy tương ứng trên main                                                                                        |
| Phục hồi tải/lưu   | Placement mất mạng kẹt; hàm lưu nuốt lỗi                    | Mọi ca timeout/offline/HTTP lỗi có kết thúc pending, giữ dữ liệu và retry hữu hạn; không xác nhận lưu sai                                  |
| Môn và ngôn ngữ    | Thẻ Hóa trong màn Lý; isA gắn UI language                   | 0 sai môn ở hàng đợi có cap; 4 tổ hợp UI language × direction đúng độc lập                                                                 |
| Câu hỏi điền từ    | Có ứng viên không tạo được chỗ trống                        | 100% câu được phát có đúng 1 vị trí trống, đáp án theo câu và lựa chọn phân biệt; báo rõ khi thiếu câu hợp lệ                              |
| Accessibility      | 18/18 meta-viewport; contrast incomplete; gate AAA lọt span | 0 vi phạm A/AA trong ma trận; 100% incomplete có kết luận kiểm chứng; nội dung/tiêu đề ≥7:1 theo quy định dự án                            |
| Điều hướng bài dài | Bài mẫu mobile 4.469px; kết quả 6.053px                     | Tới phần học/tự kiểm/kết quả trong ≤2 thao tác; focus không bị thanh cố định che                                                           |
| Usability          | Chưa có baseline người học thật                             | Pilot tối thiểu 8 người lớn, ≥90% lượt làm nhiệm vụ cốt lõi hoàn tất không cần hướng dẫn; báo số tuyệt đối và lỗi, không suy rộng thống kê |
| Hiệu quả học       | Chưa đo                                                     | Có đánh giá trì hoãn ngày 7/14 và báo cáo giới hạn; chưa đặt KPI tăng điểm khi chưa có baseline                                            |

Cửa sổ đo: từng PR cho correctness/a11y; M5 cho usability; ngày 7/14 tính từ phiên
pilot đầu của từng người. Pilot với người thật chỉ bắt đầu khi có người tham gia tự
nguyện và môi trường được phép sử dụng. Nếu chưa có, trạng thái phần đó là WAITING,
không thay bằng dữ liệu giả và không tuyên bố Goal Complete.

Goal Complete yêu cầu M1–M5 đạt, evidence trên main, không còn lỗi chặn học/sai trạng
thái lưu, và chủ sản phẩm xác nhận nghiệm thu. Bản kế hoạch hoàn tất không đồng nghĩa
goal hoàn tất. Phát hành production là hoạt động riêng sau khi được cho phép.

## 2. Scope và quyết định thiết kế

### Quyết định đã chọn trong kế hoạch

1. **Cho phép zoom.** Bỏ ngoại lệ khóa zoom cũ; kiểm 200% và reflow 320 CSS px,
   bàn phím ảo, sticky header và thanh điều hướng. Giữ chống iOS tự zoom ô nhập
   bằng cỡ chữ thích hợp, không cấm người dùng chủ động phóng to.
2. **Tách ba khái niệm:** ngôn ngữ nhãn UI, ngôn ngữ đích, ngôn ngữ giải thích.
   Đổi nhãn UI không tự đổi chiều học; dùng cấu hình hướng học hiện có.
3. **Trạng thái lưu phải trung thực:** đang lưu / đã lưu / chưa lưu, có retry;
   kết quả làm bài không bị xóa khi lỗi mạng. Không dùng cache làm bằng chứng server đã lưu.
4. **Câu hỏi phải được kiểm tra trước khi phát.** Dùng đáp án trong ngữ cảnh,
   không suy từ cả chuỗi nghĩa từ điển. Tạm loại ứng viên không xác định chắc;
   câu thiếu được bù từ tập hợp lệ, thiếu tập thì báo rõ thay vì bịa dữ liệu.
5. **Giữ ba theme và hệ token hiện có.** Chỉnh phân cấp chữ, khoảng cách, focus,
   vùng chạm ở các màn được nâng cấp; không thay framework, font hay token hóa toàn repo.
6. **Một việc học chính mỗi màn.** Mục lục môn và mục lục trong bài có tên/chức năng
   riêng. Lời giải đầy đủ xuất hiện ở nơi phù hợp; bảng kết quả tóm tắt và dẫn về câu.
7. **Phản hồi theo mục tiêu và trình độ:** ghi nhận cụ thể → chỉ ra nguyên nhân →
   một hành động sửa/luyện tiếp. Không tự nhồi C1/C2 vào phản hồi A1; người học được
   tự thử trước khi xem đáp án trong chế độ luyện.
8. **Phân biệt luyện tập và đánh giá.** Bài luyện có gợi ý; bài đánh giá theo blueprint
   và quy tắc phản hồi riêng. Chưa đổi thuật toán xếp lớp/chấm điểm khi chưa có evidence.

### Phạm vi

Luồng vào học/onboarding/xếp lớp → bài học → quiz/tự kiểm → phản hồi/kết quả → ôn lại;
English hai chiều, bốn môn STEM và mẫu đại diện lập trình. Rà thêm trạng thái lỗi và
khả năng tiếp cận của nói/viết bằng provider mock.

### Ngoài phạm vi

Thay nền tảng, mở thêm môn, viết lại auth/payment/entitlement, migration mastery,
chấm điểm AI mới, sửa hàng loạt giáo trình bằng AI, chứng nhận CEFR/IELTS, hứa tăng
retention, gamification mở rộng. Không âm thầm mở rộng những mục này khi sửa lỗi UI.

## 3. Milestones và slices

Mỗi S là một PR nhỏ dự kiến; tách thêm nếu impact map cho thấy phạm vi quá lớn.
S00 là PR tài liệu; S01–S12 là 12 slice kỹ thuật/nghiệm thu. Đối chiếu `main` tại `9c3e2fa2`: S00/S01/S02/S03/S04/S08 đã merge; S06 phần cổng, S07a và S11a là các phần đã merge. Các phần còn lại theo bảng và bằng chứng hiện hành bên dưới; không suy ra hoàn tất milestone từ một phần đã tích hợp.

| ID     | Outcome/AC                                                | Dependency    | Spec                                                                         | Issue/PR                     | State                                      | Evidence cần có                                                                                    |
| ------ | --------------------------------------------------------- | ------------- | ---------------------------------------------------------------------------- | ---------------------------- | ------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| S00    | Baseline, kế hoạch, liên kết goal cũ                      | main hiện tại | Tài liệu này + baseline                                                      | —                            | RESEARCH                                   | SHA, review kế hoạch và ma trận                                                                    |
| M1/S01 | Placement tải lỗi thoát pending và thử lại được (F1)      | S00           | Đặc tả lỗi nhỏ trước code                                                    | —                            | MERGED                                     | reject → retry thành công; timeout; unmount; cache không giữ reject                                |
| M1/S02 | Lưu hồ sơ trung thực ở Placement và Onboarding (F2)       | S01           | Hợp đồng kết quả lưu + hai caller                                            | —                            | MERGED #1125                               | 500/offline/retry/double-click; local draft còn; chỉ điều hướng sau thành công                     |
| M1/S03 | Ôn đúng môn, cap sau lọc (F6)                             | S00           | Quy tắc hàng đợi hiện có                                                     | —                            | MERGED                                     | Bốn môn, due xen kẽ, cap=1, môn rỗng; hub xuyên môn không hồi quy                                  |
| M1/S04 | UI language độc lập chiều học (F8)                        | S00           | Approved #1134; QA amend #1141                                               | #1137                        | SOURCE MERGED; AC04 còn mở                 | 2×2, phiên/Retry, callback/lỗi đã có test; zoom thật, AT, microphone/thiết bị chưa kiểm            |
| M1/S05 | Bộ tạo câu điền từ hợp lệ (F7)                            | S04           | Review #1128; #1138; approve #1153                                           | PR S05                       | SOURCE; expert WAITING                     | Builder/UI/audit/E2E có; parity 12.122/4.760 với audit độc lập; chờ chuyên gia/Product             |
| M2/S06 | Gate AAA phản ánh đúng chữ thực và 7:1 (F5)               | S00           | Follow-up #1139; **S06b Approved 24/09**                                     | #1122, PR S06b               | PARTIAL — S06b source                      | `/luyen-tap` + `/goc-hoc-tap/english` vào AAA, xanh 3 theme (changelog 0435); ma trận rộng còn mở  |
| M2/S07 | Zoom/reflow/focus/44px trên màn bị ảnh hưởng (F3)         | S06           | Gap audit #1140; zoom evidence #1142; **S07d Approved 25/09**                | #1126, #1150, #1152, PR S07d | PARTIAL — S07a/b/c/d source                | Cổng ma trận 76 ca (focus không bị che, 44px, h1) chặn CI; pinch/bàn phím ảo/thiết bị thật WAITING |
| M2/S08 | Quiz có phản hồi đọc/nghe được và focus đúng (F4)         | S06           | Approved trong spec S06–S08                                                  | #1133                        | SOURCE MERGED; AT còn mở                   | Unit/E2E mock đạt; NVDA/VoiceOver và thiết bị thật chưa kiểm                                       |
| M3/S09 | Điều hướng trong bài dài; kết quả gọn, sửa sai thuận tiện | M1, M2        | Review #1135; B2/B3 #1136; **Approved 24/09**                                | #1162, #1163, #1165, PR S09c | SOURCE MERGED khi PR S09c merge; AT còn mở | STEM + English + Lập trình đều có địa chỉ tới phần/lượt/bước; AT/thiết bị thật/zoom thật WAITING   |
| M4/S10 | Chuẩn phản hồi sư phạm và rubric đánh giá nội dung        | M1, S08       | Feature/content spec riêng; **S10b Approved 25/09** (§3.1)                   | PR S10b                      | S10b source; chuyên gia WAITING            | Luyện/đánh giá tách rõ; ba nhóm trình độ; chuyên gia rà bộ mẫu, không coi AI tự duyệt là evidence  |
| M4/S11 | Sau phản hồi có bước thử lại/ôn đúng chỗ                  | S09, S10      | Feature spec nối cơ chế ôn và sổ lỗi hiện có; **S11b Approved 25/09** (§4.1) | PR S11b                      | PARTIAL — S11a merged; S11b source         | CTA từ lỗi tới bài/thẻ đúng môn; tự thử trước đáp án; không tự nâng mastery                        |
| M5/S12 | Audit toàn luồng và pilot giáo dục                        | S01–S11       | Kịch bản nghiệm thu + kế hoạch pilot                                         | —                            | BACKLOG                                    | Full gate, ma trận a11y, thiết bị thật, usability, báo cáo ngày 7/14                               |

**Thứ tự thực hiện chọn:** S00 → S01 → S02 → S03 → S04 → S05 → S06 → S07 → S08
→ S09 → S10 → S11 → S12. Phát hiện blocker accessibility mới có thể đưa S06–S08 lên sớm.
Không cần tạo agent song song cho kế hoạch; khi thực thi, ưu tiên tuần tự để kiểm soát shared UI.

### Điểm chạm dự kiến và hợp đồng

- S01: `Placement.tsx`, `data/dialoguesLoader.ts`; phân biệt lỗi dữ liệu/tải và kết quả
  đánh giá. Không trả trình độ suy đoán chỉ vì không tải được câu hỏi.
- S02: `lib/cloud.ts`, `pages/core/Onboarding.tsx`, `Placement.tsx`, test liên quan.
  Hàm lưu trả success/error có kiểu; cập nhật mọi caller trong cùng PR, validate response
  theo contract thật. Không đổi schema server nếu không cần. Mất response sau khi server
  đã lưu phải retry an toàn, không tạo thêm tác dụng phụ.
- S03: `StemReview.tsx`, `lib/stemSrs.ts`, `review-hub.spec.ts`; giữ API hàng đợi tổng
  dùng bởi hub, lọc riêng ở đường ôn môn trước limit, không xóa/di chuyển thẻ đã lưu.
- S04–S05: `Practice.tsx`, các mode trong `practice/`, bộ tạo câu hỏi thuần và type liên quan.
  Contract tối thiểu cần ngôn ngữ đích, câu gốc, span đáp án, options và nguồn từ/bài.
  Không dùng LLM runtime để đoán span; dữ liệu bổ sung phải kiểm duyệt, thêm theo batch riêng.
- S06–S08: `e2e/a11y*.spec.ts`, helper hiện có, `ExamQuestionCard`, `QuizTab`,
  `apps/dhcb/index.html`, `src/index.css`, `packages/core-ui/theme.css` nếu đo buộc phải sửa.
  Không tạo cổng a11y song song hoặc miễn trừ mới để làm test xanh.
- S09–S11: màn STEM/English/lập trình mẫu, `ActivityResult`, `FlashcardReview`,
  sổ lỗi/outline hiện có. Chốt spec và chạy codemap trước khi chọn file cụ thể.

Chạy `npm run codemap -- impact <file>` trước sửa hotspot. Những đường dẫn rút gọn
ở trên nằm trong `apps/dhcb/src/`. Chưa chạy impact map cho source vì lượt này chỉ lập kế hoạch.

## 4. Ma trận chất lượng và bằng chứng

### Luồng bắt buộc

1. Onboarding/xếp lớp: bắt đầu, làm bài, tải lỗi, lưu lỗi, retry, quay lại đúng nơi.
2. English: bài → quiz → sửa sai → ôn; hai chiều học × hai ngôn ngữ UI.
3. STEM: một bài có hoạt ảnh và tự kiểm của mỗi môn; hàng đợi hai/bốn môn xen kẽ.
4. Lập trình: bài nhiều bước → nháp → kết quả → mở lại bài/ôn.
5. Nói/viết: mock đang xử lý/lỗi/hết quyền/mất mạng, giữ đầu vào, phương án chữ khi audio lỗi.

Kết hợp 320/390/768/1440px và ba theme cho màn chịu tác động. Năm trạng thái
rỗng/tải/dữ liệu/lỗi/phản hồi phải có evidence hoặc lý do N/A; không gọi toàn bộ
tích số là coverage nếu có trạng thái chưa chạy. Zoom, reduced motion, keyboard,
focus restore và screen reader có test/checklist riêng, không suy từ ảnh.

### Gate mỗi PR

- Node 22 theo AGENTS/CI; dùng npm và lockfile hiện tại. Phiên bản/budget đọc từ mã,
  không dùng con số cũ của skill: hiện `.size-limit.json` là JS 160kB/CSS 26kB brotli.
- Test hồi quy tình huống thật → `npm run build`, `npm run typecheck`, `npm run lint`,
  `npm run format:check`, `npm test`; `npm run test:e2e` cho UI/luồng/API tích hợp.
- Chạy size/budget khi chạm bundle, ảnh trước/sau 390/1440, kiểm 320/768 và theme.
- Cổng mới cần negative control: đưa lỗi biết trước vào fixture phải báo fail,
  bản tốt phải pass. Không skip hoặc hạ ngưỡng khi cổng phát hiện lỗi thật.
- Snapshot không thay thế kiểm tra nội dung: thẻ/câu đúng môn, đáp án hợp lệ,
  trạng thái lưu thật, focus và điều hướng sau tương tác phải được assert.
- Tài liệu-only: Prettier cho file đổi và `git diff --check`.

### Nghiệm thu sư phạm và pilot

S10 lập bộ mẫu có version tối thiểu 40 trường hợp: 12 English (hai chiều × ba nhóm
A1–A2/B1–B2/C1–C2 × đúng/sai), 16 STEM (bốn môn × đúng/sai/thiếu dữ kiện/ngộ nhận),
8 lập trình (bốn loại lỗi × đúng/sai), 4 lỗi hệ thống. Đây là bộ smoke chuyên môn,
không phải chứng minh độ tin cậy khảo thí. Phản hồi phải đúng nội dung, rõ nguyên nhân,
đúng ngôn ngữ/trình độ, và có bước tiếp theo khả thi. Không chấp nhận lỗi sai kiến thức
hoặc feedback biến lỗi mạng thành lỗi học viên; case chưa duyệt phải giữ nhãn chưa duyệt.

M5 pilot với tối thiểu 8 người lớn; tuyển để có người mới, người quay lại và người dùng
công nghệ hỗ trợ. Năm nhiệm vụ/người: vào đúng bài, thử trả lời, hiểu sửa lỗi, ôn đúng môn,
phục hồi lỗi lưu. Đích vận hành ≥36/40 lượt hoàn tất không cần chỉ dẫn, không có mất bài
hoặc xác nhận lưu sai. Đây là ngưỡng nội bộ dự kiến, không phải chuẩn nghiên cứu phổ quát.
Đo thời gian/lỗi/yêu cầu hỗ trợ và phỏng vấn ngắn; ngày 7/14 dùng câu tương đương thay vì
học thuộc đáp án cũ. Chưa tuyển trẻ em trong pilot đầu; chưa khẳng định hiệu quả cho trẻ em.

## 5. Risk register và rollout

| Rủi ro                                       | Trigger/guardrail                 | Giảm thiểu/rollback                                                                     | Owner                          | State |
| -------------------------------------------- | --------------------------------- | --------------------------------------------------------------------------------------- | ------------------------------ | ----- |
| Sửa hàm lưu làm onboarding mắc kẹt           | Caller chưa xử lý error/pending   | Cập nhật hai caller cùng PR, giữ draft, thử retry và response thất lạc                  | Agent triển khai               | OPEN  |
| Gate đúng phát hiện nhiều lỗi cũ             | F5 tăng số vi phạm                | Sửa theo nhóm màn và token; không giảm ngưỡng, không giả định trước số PR cần           | Agent triển khai               | OPEN  |
| Loại câu sai khiến pool quá nhỏ              | Thiếu câu hợp lệ chiều B          | Đo coverage, hiển thị thiếu dữ liệu, bổ sung bộ câu được duyệt; không khôi phục câu lỗi | Agent + người duyệt chuyên môn | OPEN  |
| Zoom làm sticky UI che nội dung              | Focus/CTA bị che ở 200%           | Kiểm layout và scroll-margin; sửa cục bộ, không quay lại khóa zoom                      | Agent UI                       | OPEN  |
| Cải thiện hình thức không cải thiện việc học | Pilot không đạt hoặc phản hồi sai | Tái thiết kế slice gây lỗi theo bằng chứng; giữ bản ổn định và nháp                     | Agent + chủ sản phẩm           | OPEN  |
| Thiếu người dùng/chuyên gia/thiết bị thật    | M4/M5 thiếu evidence              | Ghi WAITING, hoàn tất phần kỹ thuật độc lập; không tự bịa kết quả                       | Chủ sản phẩm                   | OPEN  |

Rollout theo PR nhỏ sau quality/e2e; spec tính năng phải researched, reviewed,
**Approved for implementation** và merge trước source. Yêu cầu tự quyết định kế hoạch
cho phép chọn phương án ở §2, không phải bằng chứng review/merge đã diễn ra.
Chuẩn bị spec của slice sắp làm; không tạo hàng loạt spec rỗng hoặc đánh dấu Approved giả.

M1/M2 dự kiến không cần migration. Nếu phát sinh thay đổi dữ liệu/schema, tách proposal
additive với verification/recovery trước khi thực hiện. Không sửa hồi tố mastery hay
lịch sử SRS để che lỗi cũ. Lùi PR UI bằng revert tương thích dữ liệu; không rollback bằng
cách khôi phục cổng kiểm sai hay câu hỏi sai. Nếu chưa có cách an toàn, dừng rollout.

Khi được phép phát hành: kiểm staging bằng tài khoản thử, rồi triển khai theo quy trình
hiện có, kiểm smoke và lỗi trong 24–48 giờ. Không bổ sung telemetry PII; ưu tiên log/test
hiện có. Việc gửi lời mời pilot, truy cập production và triển khai cần phạm vi cho phép riêng.

## 6. Current truth

- `main` đã reconcile tại `9c3e2fa2` (merge #1142 sau #1137): S01 (#1120), S02 (#1125), S03 (#1121), S04 (#1137), S08 (#1133), S06 phần cổng/tương phản (#1122), S07a quyền zoom (#1126), bộ prototype/rubric/protocol (#1123) và S11a sửa đích câu hỏi (#1124) đã tích hợp. Required quality/e2e của #1137 và #1142 xanh trước merge; CI trên merge commit #1137 đang chạy khi lập checkpoint.
- Baseline: [nghiên cứu 23/09](../research/2026-09-23-uiux-su-pham-baseline.md).
- S02 lưu hồ sơ có source và kiểm thử tại [#1125](https://github.com/seeker19110/dhcb/pull/1125); head `4a34e704` đạt quality/e2e/metadata, đã merge tại `021b3dae`.
- S06 tại [#1122](https://github.com/seeker19110/dhcb/pull/1122) đã merge `b0c424c0`: cổng inline/incomplete, 7:1 cho chữ đọc kể cả heading lớn, phép đo nhãn SVG và phần tử ngoài vùng cuộn. Full CI của head cuối đạt quality/e2e, 6/6 E2E shards; kiểm thiết bị/screen reader thật và toàn ma trận S07/S08 chưa có.
- S07a tại [#1126](https://github.com/seeker19110/dhcb/pull/1126) khôi phục cấu hình zoom và bỏ miễn trừ viewport; head `e5215014` đạt quality/e2e/metadata, đã merge tại `6f8054ff`; chưa chứng minh pinch trên thiết bị thật hay toàn bộ S07.
- S04 spec [#1134](https://github.com/seeker19110/dhcb/pull/1134) và QA amendment [#1141](https://github.com/seeker19110/dhcb/pull/1141) đã merge trước source [#1137](https://github.com/seeker19110/dhcb/pull/1137). Unit/E2E mock và QA ba theme ở 320/390/1440 CSS px đã kiểm focus/tương phản; AC04 chưa nghiệm thu đầy đủ vì chưa kiểm zoom thật, screen reader, microphone và thiết bị thật.
- S08 source [#1133](https://github.com/seeker19110/dhcb/pull/1133) đã merge với quality/e2e xanh. Bằng chứng mock không thay thế NVDA/VoiceOver hay thiết bị thật.
- S05 vẫn Draft: [#1138](https://github.com/seeker19110/dhcb/pull/1138) chỉ chốt thiết kế audit offline/manifest; chưa đo coverage đạt chuẩn hoặc có duyệt chuyên gia mẫu B. S06/S07 vẫn PARTIAL theo audit [#1139](https://github.com/seeker19110/dhcb/pull/1139)/[#1140](https://github.com/seeker19110/dhcb/pull/1140); không suy ra Approved follow-up S06 từ approval S08.
- [#1142](https://github.com/seeker19110/dhcb/pull/1142) đã merge tại `9c3e2fa2`, chỉ sửa báo cáo S07. Trên một sheet mục lục Vật lí, Chrome 153 headless/Windows dùng Page zoom thật 100→200% (780→390 CSS px, DPR 1→2), ba theme: focus thấy được, 20 target hiển thị/theme ≥44px, không tràn ngang. Đây là ca browser zoom có dữ liệu mock, chưa chứng minh toàn ma trận, pinch, browser khác hoặc thiết bị thật; S07 vẫn PARTIAL. Báo cáo/JSON nằm ngoài repo.
- S09 vẫn Draft: review [#1135](https://github.com/seeker19110/dhcb/pull/1135), B2/B3 đóng ở mức thiết kế tại [#1136](https://github.com/seeker19110/dhcb/pull/1136), B1 phụ thuộc M1/M2 còn mở. S10 cần chuyên gia rà 40 mẫu; S11a không hoàn tất S11 rộng; S12 cần thiết bị thật, người học và số đo ngày 7/14. Không có bằng chứng chuyên gia hoặc pilot.
- S07b [#1150](https://github.com/seeker19110/dhcb/pull/1150) và S07c [#1152](https://github.com/seeker19110/dhcb/pull/1152) đã merge: tab CEFR ở 320 px và nút Back chung đạt 44×44 trong E2E 320/390, ba theme. #1152 đạt quality/e2e/metadata trên head `4be722f7`; main tại `548bf937`. S07 rộng vẫn PARTIAL vì pinch, bàn phím ảo và thiết bị thật chưa có evidence.
- Chủ sản phẩm ngày 24/09 yêu cầu ghi nợ chuyên gia, pilot và AT/thiết bị thật, tiếp tục phần khác. S05 technical source được duyệt riêng sau PR đặc tả bổ sung; 40 mẫu vẫn `WAITING_EXPERT_REVIEW`, Product acceptance và release vẫn WAITING. S12 pilot 8 người/ngày 7/14 cũng WAITING, không điền dữ liệu giả.
- S05 source kỹ thuật (changelog 0432): builder `fillBlankQuestions.ts` dùng chung cho `FillBlankQuiz` và `scripts/audit-fillblank.ts`; audit toàn từ điển khớp số liệu độc lập (A 12.122, B 4.760 accepted). 40 mẫu cùng ref với manifest cũ nhưng distractor khác — chuyên gia review manifest mới; expert/Product vẫn `WAITING_EXPERT_REVIEW`.
- Next best slice: khép các phần kỹ thuật S06/S07/S09–S11 có thể kiểm bằng CI và browser; giữ nợ nghiệm thu thật riêng (S05 expert, S04/S08 AT, S12 pilot).

### Đặc tả chi tiết đã chuẩn bị

- [S02 — Lưu hồ sơ trung thực](../specs/2026-09-23-uiux-s02-luu-ho-so-trung-thuc.md).
- [S03–S05 — Tính đúng của bài tập](../specs/2026-09-23-uiux-s03-s05-tinh-dung-bai-tap.md).
- [S06–S08 — Accessibility](../specs/2026-09-23-uiux-s06-s08-accessibility.md).
- [S09–S12 — Trải nghiệm và nghiệm thu](../specs/2026-09-23-uiux-s09-s12-trai-nghiem-va-nghiem-thu.md).

Trạng thái từng slice theo header spec; S04 đã duyệt theo ủy quyền, S05 còn Draft.
Review kỹ thuật của agent không thay thế phê duyệt/merge,
kiểm thử source hoặc nghiệm thu sư phạm. Các sửa lỗi độc lập hiện hữu được triển khai theo phạm vi người dùng đã giao; trạng thái source từng phần nằm ở Current truth.

## 7. Iteration log

### Iteration 1 — 2026-09-23

- State: PLANNING; yêu cầu người dùng: lập kế hoạch nâng cấp, tự quyết định phương án.
- Thay đổi: goal này và baseline bền vững; ghi liên kết kế hoạch trong PROGRESS.
- Gap trước/sau: không đổi lỗi sản phẩm; đã có thứ tự 5 milestone, 12 slice sau PR tài liệu,
  metric, test, điểm chạm, phụ thuộc, rollout và rollback.
- Validation: kiểm Markdown và diff ở lượt tạo; không có source đổi, không chạy full code gate.
- Next: S00 review rồi S01; chưa có PR, chưa triển khai hoặc phát hành.

## 8. Final audit

- [ ] F1–F8 có bằng chứng sửa trên main.
- [ ] M1–M5 đạt AC; incomplete accessibility đã có kết luận.
- [ ] Full regression, a11y, bundle và privacy guardrails đạt.
- [ ] Thiết bị/công nghệ hỗ trợ và pilot có dữ liệu thật.
- [ ] Tài liệu, rollback, residual risks được cập nhật.
- [ ] Chủ sản phẩm xác nhận nghiệm thu.

**Kết luận goal: NOT COMPLETE. S04/S08 đã có source trên main nhưng chưa đủ bằng chứng nghiệm thu thật; S05/S06/S07/S09/S10/S11 rộng/S12 và pilot còn mở.**

### Iteration 2 — 2026-09-23: S01

- Người dùng yêu cầu triển khai; bắt đầu slice sửa lỗi F1 trên base `1d9e247e`.
- Codemap: loader ảnh hưởng 11 file trực tiếp/gián tiếp; Placement ảnh hưởng App/main.
- Loader kiểm HTTP/JSON/schema Zod, timeout 15 giây, chia sẻ request và giải phóng cache reject.
- Placement có lỗi/retry/thoát, giữ vòng hoàn tất; không suy trình độ từ tập câu rỗng; bỏ qua response sau unmount/thoát.
- State: BLOCKED. Unit loader 6/6 và E2E phục hồi 1/1 đạt. Build/typecheck Node 24 đạt; typecheck Node 22 đạt, build Node 22 hết heap.
- Full gate chưa đạt: lint vướng checkout lồng ngoài phạm vi; unit có lỗi report-status/chấm lập trình; E2E có lỗi fixture và browser crash. Lượt unit/E2E đã ngắt, không có tổng kết hoàn chỉnh.
- Bằng chứng, giới hạn và rollback: [changelog S01](../changelog/0420-2026-09-23-placement-phuc-hoi-tai-loi.md).
- Bước gỡ chặn: chạy gate tuần tự trên môi trường đủ bộ nhớ, rà shell/Python và checkout lồng; xử lý các failure ngoài S01 trong phạm vi riêng trước tích hợp.
- Không có migration hoặc API provider trả phí. Targeted unit 6/6 và E2E 1/1 đạt trên Node 22.23.2 và 24.19.0; chưa có kết quả CI.
- Giữ nguyên nguyên tắc một slice/PR; slice sau bắt đầu trên base đã tích hợp và kiểm chứng.

### Iteration 3 — 2026-09-23: gỡ blocker qua subagent

- Người dùng yêu cầu giao việc còn lại cho subagent Astra light; dùng Astra/low,
  ba phạm vi độc lập, exclusive write set và review tập trung.
- State: WAITING. Bỏ lint nhầm nested worktree; unit/E2E targeted đạt khi cấu hình
  đúng shell/Python và giảm tải. Không bỏ test hay hạ rule.
- Full build/typecheck/lint/format Node 22 đạt; full unit 16.744 pass, 2 skip hiện có.
  Full E2E 873 pass, 5 N/A skipped trong 28,3 phút; size gate JS 151,47/160 kB, CSS 23,62/26 kB đạt.
  Log và giới hạn trong changelog 0420; không thêm skip hoặc tắt rule.
- Hoàn thiện Draft S02–S12 từ code thực; chưa Approved/merge hoặc triển khai source.
- Next: review bản sửa S01/config lint và đặc tả; push/mở PR đã được người dùng cho phép ở lượt tiếp theo. Chưa có quyền merge/deploy.

### Iteration 4 — mở PR theo quyền đã cấp

- Người dùng xác nhận cho phép push/mở PR và yêu cầu cập nhật tiến độ.
- Fetch lại origin: main vẫn ở `1d9e247e`, không có divergence trước tạo commit.
- Tách PR tài liệu (goal/baseline/Draft S02–S12/bằng chứng) và PR S01 đặt trên nhánh
  tài liệu. Chỉ PR S01 thay source; đặc tả phần sau vẫn Draft.
- Full gate local ở iteration 3 là bằng chứng hiện có; chờ CI cho commit đã push.
- Chưa cấp quyền merge/deploy; không coi push hoặc mở PR là hoàn thành goal.

- PR đã mở và gắn vào task: [#1119 — tài liệu](https://github.com/seeker19110/dhcb/pull/1119),
  [#1120 — S01](https://github.com/seeker19110/dhcb/pull/1120). #1120 đang đặt trên
  nhánh #1119; cần tích hợp tài liệu trước rồi đổi base #1120 sang main.
- Commit tài liệu `62692ab6`; commit source `34418feb`. Metadata thiếu hai heading đã
  được bổ sung đúng template; chờ kết quả CI, không đổi trạng thái spec thành Approved.

### Iteration 5 — Kiểm tra merge và giải quyết xung đột

- Reconcile `main` tại `f07820aa`; #1119 đã merge, #1120 đã đổi base sang main.
- Giải quyết hai add/add conflict tài liệu bằng cách giữ bằng chứng mới hơn; giữ cập nhật dependency Pyodide từ main. Không có source conflict.
- #1121, #1122, #1123 không có xung đột Git tại thời điểm kiểm tra. #1122 còn lỗi CI accessibility; không coi mergeable là đã qua quality gate.
- Commit reconcile cần CI mới. Source S01 chưa merge/deploy; kết quả gate cũ vẫn chỉ là bằng chứng cho commit cũ.

### Iteration 6 — phân công toàn bộ S02–S12 cho Astra low

Người dùng yêu cầu giao toàn bộ phần còn lại cho subagent Astra low. Ba nhóm được
cấp worktree riêng trên main `f07820aa` (sau merge #1119 và cập nhật Pyodide), độc
quyền file và giao diện được chốt trước code. Root review diff, điều phối test và publish.

| Nhóm    | Agent                 | Kết quả đợt đầu                                                                                                                                                 | Trạng thái                                                                    |
| ------- | --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| S02–S05 | s02_s05_learning      | [#1121](https://github.com/seeker19110/dhcb/pull/1121): S03 lọc đúng môn trước cap, reset phiên user/môn/cap; 41 unit + 9 E2E targeted đạt                      | Draft PR, full CI/ảnh còn pending; S02/S04/S05 chuẩn bị contract, chưa source |
| S06–S08 | s06_s08_accessibility | [#1122](https://github.com/seeker19110/dhcb/pull/1122): S06a inline/incomplete/target collector, avatar token; controls 2/2, Layout 17/17, Home 3 theme 3/3 đạt | Draft PR, chưa xong S06b và ma trận rộng; S07/S08 chưa source                 |
| S09–S12 | s09_s12_experience    | [#1123](https://github.com/seeker19110/dhcb/pull/1123): prototype, 40 mẫu rubric, routing matrix, protocol/phiếu pilot                                          | Draft bộ chuẩn bị, không có thay đổi production, chưa chuyên gia/pilot        |

- Root kiểm prototype sáu tổ hợp viewport/theme, focus, Back, giữ nháp và năm trạng thái;
  đã xem ảnh mobile. Không đổi tên bằng chứng prototype thành nghiệm thu production.
- #1120 S01 hiện tất cả CI xanh, base main, chưa merge tại lúc kiểm tra. #1119 đã merge.
- Không dùng lại số full gate S01 cho các nhánh mới: targeted chỉ chứng minh phạm vi
  đã chạy; full CI từng PR đang được yêu cầu. Không thêm skip/disable để đạt gate.
- Quyền push/mở PR giữ nguyên; không tự merge/deploy. Các feature mới còn phải qua
  spec Approved/merged và phụ thuộc đã nêu; không giả bằng chứng chuyên gia hoặc pilot.
- Next: CI và review từng Draft PR; xử lý findings rồi tích hợp từng slice, reconcile
  main trước khi nhóm nhận slice tiếp. Goal vẫn NOT COMPLETE.

### Iteration 7 — reconcile sau tích hợp S01 và prototype

- Main `bdf4b838` đã có #1120 và #1123. Giữ cả lịch sử phân công và xử lý xung đột trong goal; không có source conflict.
- #1121 đã có quality/e2e xanh ở `ec39818c`; commit merge main cần CI mới. #1122 còn E2E accessibility đỏ, đang sửa nguồn gây lỗi.
- S02 lưu hồ sơ và S11a đích deep-link đang triển khai độc lập; S07a khôi phục quyền zoom đang kiểm chứng. Chưa hoàn tất các milestone hoặc pilot.

### Iteration 8 — triển khai tiếp và sửa CI/xung đột

- Người dùng yêu cầu triển khai toàn bộ phần còn lại, sau đó ưu tiên fix xung đột và CI. Ba subagent Astra low có exclusive write set; root review từng diff và giữ các thay đổi người dùng ngoài phạm vi.
- #1121 xung đột goal sau S01 merge: giữ đủ hai nhánh lịch sử, push `84dd36ba`, full CI xanh; sau đó PR được tích hợp bên ngoài. #1124 full CI xanh và được tích hợp bên ngoài tại `670e6b26`.
- S02 bổ sung kết quả lưu có kiểu, giữ dữ liệu/retry, xác minh lại phiên; CI phát hiện race StrictMode ở loading, đã thêm negative control và sửa request hiện hành mới được kết thúc loading.
- S07a có 4/4 E2E targeted trên ba theme/bốn bề rộng; CI chỉ ra hai file cần format, đã sửa. Full gate đang chờ, chưa thay bằng chứng thiết bị thật bằng viewport giả lập.
- S06 có source fixes, controls fail-closed, ảnh và scan targeted; chưa coi controls hoặc targeted xanh là full AAA. Không hạ ngưỡng, skip hoặc miễn trừ để làm xanh.
- Một số tiến trình local thiếu bộ nhớ; giữ log fail và dùng CI trên đúng head để xác minh đầy đủ, không tái sử dụng số pass của commit cũ.
- Quyền push/mở PR đã có; root không thực hiện merge/deploy. Goal tiếp tục VERIFYING/BUILDING, chưa hoàn tất.

### Iteration 9 — sửa xung đột và CI theo yêu cầu mới

- #1125 `4a34e704` và #1126 `e5215014`: toàn bộ quality/e2e/metadata đã đạt; cả hai mergeable, chưa merge/deploy.
- #1122 đã merge `origin/main` tại `670e6b26` vào nhánh cục bộ, không xung đột. Ma trận mở rộng đầu tiên của dirty diff có 97/129 đạt; 32 lỗi được phân nhóm và đang sửa, không lấy CI cũ làm bằng chứng cho bản này.
- Review độc lập phát hiện và siết điều kiện snapshot, clipping, pseudo paint và SVG overlay trong fallback halo. Các controls đối chứng đã chạy; kết quả cuối theo evidence S06.

### Iteration 10 — bật auto-merge theo chỉ thị người dùng

- Người dùng yêu cầu bật auto-merge; đã bật cho #1125 và #1126 sau khi kiểm tra required checks xanh. GitHub đã merge lần lượt tại `021b3dae` và `6f8054ff`.
- Nhánh #1122 đã tích hợp `origin/main` `6f8054ff` không xung đột, giữ toàn bộ dirty diff. Targeted đang chạy lúc phiên terminal bị gián đoạn không có kết quả cuối, nên chạy lại trên base mới.
- #1122 sẽ được bật auto-merge sau review bản sửa; chỉ merge khi các cổng bắt buộc đạt. Không có lệnh deploy trong đợt này.

- CI trên main `6f8054ff` sau merge #1125/#1126: run `35860862694` hoàn tất **success** (quality và e2e). Đây không phải kết quả cho dirty diff #1122.

### Iteration 11 — hoàn tất sửa blocker accessibility cục bộ

- Lượt kiểm chứng rộng tập trung: 64/69 đạt; năm lỗi còn lại có phép đo cụ thể ở nhãn ADN và phiên âm thẻ từ. Sau sửa nguồn, 37/37 ca cuối đạt (6 trạng thái, 29 controls, 2 ảnh). Đây là targeted evidence, không phải thay thế full CI của head mới.
- Primary đã review ảnh trước/sau và diff, giữ mọi rule/ngưỡng; ma trận hữu hạn 10 bài thật phủ đủ palette được giải thích tại `docs/ux-upgrade/s06/contrast-fixture-scope.md`.
- Tiếp theo: push snapshot đã review, bật auto-merge theo chỉ thị người dùng và xác nhận quality/e2e/metadata trên head mới. Các phần sư phạm/pilot trong Goal DoD vẫn chưa hoàn tất.

### Iteration 12 — 2026-09-23: đối chiếu main và giao một đợt việc còn lại

- #1122 đã qua full CI ở head `a21f33d6` (quality/e2e, 6/6 E2E shards), auto-merge vào main `b0c424c0`. Lỗi unit allowlist hiệu ứng sau khi bỏ glow ở Chat/Speaking đã sửa bằng phép đếm chính xác, targeted 13/13; không nới gate.
- Đối chiếu source/spec trên main: S04/S05/S08 chưa triển khai, đặc tả liên quan vẫn Draft. S09 chỉ có prototype; S10 có 40 mẫu chờ chuyên gia; S11 mới có sửa deep-link; S12 có protocol nhưng chưa pilot. Không đánh dấu các milestone này DONE.
- Giao Astra low ba workstream độc lập: review S04/S05, review S08, audit đọc-chỉ S09–S12 và PR #1127. Mỗi agent có write set riêng; source feature chỉ bắt đầu sau spec được review, Approved và merge theo delivery loop.
- Main CI trên `b0c424c0` (run `35866657006`) đã đạt quality/e2e. Deploy workflow tự khởi chạy sau merge và báo success; không suy ra đã có smoke/pilot production.
- Review S04/S05 đã mở [#1128](https://github.com/seeker19110/dhcb/pull/1128), S08 đã mở [#1129](https://github.com/seeker19110/dhcb/pull/1129). Cả hai là tài liệu review trên base mới; cần tích hợp vào spec gốc, duyệt và merge trước source feature.

### Iteration 13 — tích hợp review và duyệt riêng S04

- Base `bec484dff7129145c531cacbb321d2942ed07b7a`, sau #1128 merge. Tác vụ độc lập
  docs-only trên nhánh `codex/uiux-s04-spec-approval`; không sửa source/worktree khác.
- Chốt S04 theo review và ủy quyền user: phiên/Retry, snapshot phát âm, lỗi callback/API,
  feedback theo direction; thêm metadata, AC/proof, write set, DESIGN_SPEC và gate.
- S05 Draft; đã tích hợp toàn bộ review kỹ thuật, ghi dependency và owner/điều kiện
  gỡ blocker acceptance chuyên môn. Không có kết quả sản phẩm/ảnh/pilot mới.
- Next: merge PR spec qua required checks, rồi giao S04 source riêng; S05 chưa được giao
  source. Goal NOT COMPLETE. Validation docs và PR đợt này ghi tại changelog 0427.

### S06 follow-up — kiểm điều kiện triển khai 2026-09-23

Base origin/main `422c9134`: #1122 đã merge nhưng S06 vẫn PARTIAL. Lịch sử spec
#1119/#1131 chỉ có approval riêng S08; follow-up S06 chờ quyết định duyệt rõ phạm vi.
Theo yêu cầu tác vụ, đợt này docs-only, **BLOCKED_IMPLEMENTATION_APPROVAL**.
Không có source/test mới hoặc kết quả contrast mới. Xem
[audit và bước tiếp theo](../research/2026-09-23-s06-follow-up-approval-audit.md).

### Iteration 14 — checkpoint sau S04 source

- Base `9c3e2fa2` sau #1137 và #1142; #1133–#1142 liên quan đã đối chiếu trạng thái merge.
  #1137 và #1142 đạt quality/e2e trước merge; CI trên merge commit #1137 đang chạy
  tại thời điểm cập nhật, không gán kết quả PR cho CI của `main`.
- Gap: S04 source và S08 source đã tích hợp, nhưng AC04/S08 AT chưa đủ kiểm thật.
  #1142 thêm một ca Chrome zoom 200% cho S07 nhưng chưa đóng ma trận. S05 còn
  Draft dù có audit design; S06/S07 partial; S09 Draft vì B1; S10/S12
  chờ chuyên gia/người học/thiết bị thật. Goal NOT COMPLETE.
- Không thay source hoặc migration trong checkpoint. Validation: Prettier Markdown,
  `git diff --check` và required checks của PR tài liệu trước auto-merge.
- Next: hoàn tất điều kiện duyệt S05 và bằng chứng accessibility còn thiếu;
  giữ S09 source sau khi B1 và dependency được đóng.

### Iteration 15 — S05 source kỹ thuật

- Base `81ae6f74` (#1153 duyệt kỹ thuật S05). Builder thuần + caller + script audit + E2E
  trong một PR; không đổi dữ liệu từ điển, API, persistence, migration.
- Evidence: unit/E2E, negative control guard chấm đôi, parity audit toàn từ điển, ảnh 8b
  trước/sau và axe AA 0 vi phạm ở 18 tổ hợp. Xem `docs/changelog/0432-*.md`.
- Gap còn: review chuyên gia 20 câu/chiều, Product acceptance, fixture pool học sạch.
  Goal NOT COMPLETE.
