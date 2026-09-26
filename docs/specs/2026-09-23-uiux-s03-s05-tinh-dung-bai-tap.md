# S03–S05 — Đúng môn, đúng chiều học và câu điền từ hợp lệ

> Trạng thái: **DESIGN_READY** — S04 đã triển khai; S05 được duyệt riêng cho source kỹ thuật sau khi PR bổ sung này merge, còn nghiệm thu chuyên môn WAITING; S03 đã triển khai qua #1121.
>
> **Kết luận:** Approved for implementation — chỉ S04; có hiệu lực sau khi PR spec này merge.
> Người quyết định: Codex theo ủy quyền rõ của chủ sản phẩm trong tác vụ ngày 2026-09-23
> và quyền tự quyết ghi ở goal. Ngày duyệt: 2026-09-23. Không phải nghiệm thu implementation.

```yaml
feature:
  id: UIUX_S04_001
  name: Tách ngôn ngữ giao diện và chiều học Practice
  pillar: learning
  subject: english
goal:
  user: learner
  objective: change_ui_language_without_changing_learning_session
scope:
  include: [practice_direction_snapshot, stable_session_data, ui_labels_and_client_errors]
  exclude: [s03_reimplementation, s05_builder, prompts, server, usage, persistence]
user_flow: [practice_hub, open_mode, answer_or_record, feedback, retry_same_session, return_hub]
states: [loading, success, empty, error, offline, unauthenticated, quota_exhausted]
ai_calls:
  needed: true
  cached: true
  daily_limit_counted: true
acceptance_criteria:
  - id: S04_AC01
    text: Tám mode đúng ma trận direction × UI, bao gồm audio và feedback
    proof: npx vitest run apps/dhcb/src/pages/learning/practice/s04Contract.test.tsx
  - id: S04_AC02
    text: Đổi UI giữ dữ liệu và tiến độ; Retry giữ direction; mở mode mới đọc lại direction
    proof: npx vitest run apps/dhcb/src/pages/learning/practice/s04Contract.test.tsx
  - id: S04_AC03
    text: Lỗi đã lưu và callback trễ theo UI mới, giữ fallback và consumer cũ
    proof: npx vitest run apps/dhcb/src/pages/learning/practice/s04Contract.test.tsx apps/dhcb/src/lib/pronounceAssessApi.test.ts
  - id: S04_AC04
    text: E2E settings, trạng thái, bàn phím, ba theme và ảnh trước/sau
    proof: npx playwright test e2e/practice-direction.spec.ts e2e/a11y.spec.ts e2e/a11y-aaa.spec.ts
risk: normal
design_spec: required
```

Các test S04 mới trong `proof` là deliverable implementation, chưa tồn tại/chưa chạy
ở PR docs. `ai_calls` mô tả đường gọi hiện hữu (cache TTS, lượt do server kiểm soát),
không hứa mọi kết quả AI được cache và không cấp quyền gọi provider trong test.

| Thuộc tính     | Giá trị                                                                                                                                                   |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Goal           | [UI/UX và sư phạm](../goals/2026-09-23-uiux-su-pham.md), M1/S03–S05                                                                                       |
| Trạng thái     | S03 đã merge #1121; S04 đã triển khai; S05 **Approved for technical implementation** sau PR bổ sung này, nghiệm thu chuyên môn WAITING tại §4             |
| Baseline       | Main `bec484dff7129145c531cacbb321d2942ed07b7a` gồm #1128 đã merge; baseline audit gốc `1d9e247e`                                                         |
| Review         | [Review S04/S05](2026-09-23-uiux-s04-s05-review.md), [#1128](https://github.com/seeker19110/dhcb/pull/1128); tích hợp và đối chiếu source ngày 2026-09-23 |
| Cách giao việc | Ba slice, ba PR riêng; S05 phụ thuộc S04; không sửa đồng thời các mode Practice                                                                           |

## 1. Outcome và giới hạn chung

Người học ôn đúng môn đã mở; ngôn ngữ giao diện không đổi nội dung ngôn ngữ đang học;
câu điền từ có đúng một chỗ trống và đáp án khôi phục được câu gốc. Không thay thuật toán
FSRS, mastery, cấp quyền, usage, chấm CEFR/IELTS hoặc API server. Không gọi LLM để đoán
đáp án hay biến đổi câu. Không sửa hàng loạt từ điển để làm đẹp số liệu độ phủ.

Các đường dẫn rút gọn dưới đây thuộc `apps/dhcb/src/`, trừ `e2e/` và đường dẫn có ghi
rõ gốc khác. Trước mỗi PR chạy codemap impact cho các điểm chạm, đọc lại main và cập
nhật spec theo mã thực. Spec này được soạn bằng đọc mã, chưa chạy test hoặc đo lại dữ liệu.

## 2. S03 — Hàng đợi ôn riêng từng môn

**Lưu lịch sử contract:** S03 đã merge qua #1121; hiện trạng dưới đây là trước sửa,
không phải backlog triển khai lại. Phạm vi duyệt lần này chỉ S04.

### Hiện trạng và điểm chạm

`pages/learning/StemReview.tsx` chốt `hangDoiRef` bằng `getDueStemCards(user.id, cap)`
nhưng không truyền môn của route. `lib/stemSrs.ts:getDueStemCards` đưa toàn bộ thẻ STEM
vào `lib/srs.ts:getDueBy`. Hàm sau lọc đến hạn, rồi khi có limit mới sắp theo due tăng,
difficulty giảm và cắt. Do đó lọc môn sau lệnh hiện tại sẽ vẫn mất thẻ hợp lệ ở ngoài cap.

`pages/learning/ReviewHub.tsx` và `lib/reviewQueue.ts` cần giữ hàng đợi tổng xuyên môn.
`hydrateStemCards` bỏ thẻ không còn nội dung; đây là hành vi hiện có, không tự bù thẻ
ngoài cap trong S03. `reviewStemCard` tiếp tục gọi `reviewWord`, không có đường ghi mới.

### Hợp đồng được đề xuất

Giữ nguyên `getDueStemCards(uid, limit?)` và kết quả cho caller cũ. Thêm hàm thuần đọc
`getDueStemCardsForSubject(uid, subjectId: StemSubjectId, limit?)`, lọc
`getAllStemCards(uid)` theo subjectId **trước** khi gọi `getDueBy` với limit cũ.
Không copy thuật toán sắp xếp; không đổi key `stem:<subject>:<lesson>:<index>`.
`StemReview` dùng subject đã qua `getStemSubject`; route sai tiếp tục Navigate về hub.

Khi user/môn/cap đổi, reset nội dung hiển thị sang loading trước khi hydrate hàng đợi
mới; không để thẻ môn cũ xuất hiện hoặc nhận rating trong lúc tải. Response cũ đến muộn
không được thay hàng đợi mới. Giữ hàng đợi ổn định khi chấm trong cùng một phiên;
không tính lại sau mỗi lần review làm bỏ qua thẻ kế tiếp.

### AC và negative cases

- Fixture trộn đủ Toán/Lí/Hoá/Sinh: với từng môn và cap=1, thẻ đúng môn được chọn dù
  thẻ khác môn có due sớm hơn. Hai thẻ cùng môn due bằng nhau giữ thứ tự difficulty cũ.
- Không có thẻ đúng môn đến hạn: empty state của môn đó, không lấy thẻ môn khác bù.
- Không cap: trả mọi thẻ đến hạn đúng môn; cap=2 không vượt hai ref. Quy tắc query cap
  sai tiếp tục do `lib/reviewRoutes.ts:docCapTuQuery` xử lý, không thêm diễn giải khác.
- User khác không thấy thẻ user trước; đổi route nhanh/lỗi hydrate/retry không hiện
  thẻ cũ. Rating chỉ ghi key đang có trong hàng đợi hiển thị của phiên hiện tại.
- `ReviewHub` giữ đủ thẻ xuyên môn và hạn mức phiên cũ; thẻ chưa đến hạn/namespace khác/
  key rác không lọt vào hàng đợi. Thẻ thiếu nội dung vẫn bị bỏ an toàn.
- Bổ sung `lib/stemSrs.test.ts` và `e2e/review-hub.spec.ts`; E2E seed localStorage,
  mock API, kiểm câu hỏi thực trên route môn và kiểm link mở bài đúng môn.

Rollback: revert đồng bộ helper, caller và test của S03; không migration hoặc phục hồi
kho thẻ vì không thay dữ liệu. Phụ thuộc S00; không phụ thuộc implementation S02.

## 3. S04 — Tách ngôn ngữ giao diện và chiều học

### Hiện trạng và điểm chạm

`pages/learning/Practice.tsx` đặt `isA = useLang().lang === 'vi'`, rồi dùng cùng biến
cho chữ giao diện, `sentencePool`, dữ liệu từ/câu, TTS/STT và mọi mini-game. Các điểm
chạm cần rà đồng bộ:

- `practice/VocabListenGuess.tsx`, `SentenceScramble.tsx`, `DictationTyping.tsx`,
  `FillBlankQuiz.tsx`, `PronounceList.tsx`, `Shadowing.tsx`, `ReverseInterview.tsx`.
- `practice/GameChrome.tsx:GameResult`, `practice/shared.ts:pickExampleSentences`.
- Các hàm dùng lại: `lib/listening.ts:buildDictationItems`, `components/PronunciationCheck.tsx`,
  helper prompt mà `ReverseInterview` đang gọi. Rà caller trước khi đổi chữ ký.
- Nhánh con `components/DetailedPronunciationCheck.tsx` và biên lỗi
  `lib/pronounceAssessApi.ts`; prop UI phải xuống tận nhánh chi tiết. Điều kiện chỉ
  hỗ trợ tiếng Anh tiếp tục theo `lang`, không theo UI.

Nguồn chiều học thật là `lib/storage.ts:getDirection()` với `Direction = 'A' | 'B'`
trong `types.ts`; không có hook `useDirection` trong context hiện tại. Key `et_direction`
và cách đồng bộ settings giữ nguyên. Đọc direction cho phiên; chỉ nhận A/B, giá trị lạ
fallback A tại ranh giới Practice (không thay semantics storage toàn app ở slice này).

### Hợp đồng được đề xuất

Dùng tên rõ `direction`/`learningIsA` cho dữ liệu sư phạm và `uiLang`/`isUiVi` cho chữ
điều khiển. Giữ boolean `isA` của helper dữ liệu cũ có nghĩa chiều học; không đổi chữ ký
helper dùng ngoài Practice nếu chỉ cần truyền đúng boolean. Mini-game nhận thêm
`uiLang: 'vi' | 'en'` cho nhãn/empty/error/result. Cập nhật tất cả caller nội bộ cùng PR.
Với component dùng chung như PronunciationCheck, bổ sung prop ngôn ngữ UI tùy chọn,
mặc định giữ hành vi cũ; prop `isA` cũ tiếp tục biểu thị chiều học, không đổi vai âm thầm.

| Direction | UI  | Từ/câu đích và TTS/STT | Chữ nút/trạng thái | Giải thích sư phạm theo chiều học |
| --------- | --- | ---------------------- | ------------------ | --------------------------------- |
| A         | vi  | Anh                    | Việt               | Việt                              |
| A         | en  | Anh                    | Anh                | Việt                              |
| B         | vi  | Việt                   | Việt               | Anh                               |
| B         | en  | Việt                   | Anh                | Anh                               |

Ở nghe đoán nghĩa, A nghe `word` và chọn `vi`; B nghe `vi` và chọn `word`. Nội dung câu
hỏi phỏng vấn/prompt feedback dựa direction; nhãn “AI hỏi”, lỗi microphone và nút bấm
dựa UI. Không đổi prompt, provider, số lượt hoặc ranh giới usage. Nếu cần sửa prompt
để đạt mục tiêu, tách spec/eval riêng, không ghép vào bugfix truyền direction.

**Phiên** bắt đầu khi từ hub mở mode, chốt direction A/B hợp lệ và pool/danh sách ngẫu
nhiên; kết thúc khi về hub, unmount hoặc đổi user. Khi pool đang tải phải chờ thành công
trước khi chốt dữ liệu; response user/phiên cũ không được ghi vào phiên mới. UI luôn
đọc context hiện hành, không là dependency chọn dữ liệu. Đổi UI giữ câu, options,
đáp án, index, score, kết quả phát âm và audio language. Hai mode phát âm phải snapshot
cả danh sách; không shuffle lại trong render hoặc remount theo UI.

“Làm lại”/Retry trong mode reset tiến độ theo mode hiện có, giữ direction và tập/thứ tự
câu của phiên; không đọc lại settings. Options giữ trong cùng câu khi đổi UI; Retry
có thể tạo lại options theo hành vi mode nhưng không đổi tập câu hoặc chiều học.
Đổi direction ở settings chỉ áp dụng sau khi về hub và mở mode mới. Reload đọc lựa
chọn đã lưu; không hứa giữ tiến độ qua reload. Đổi user phải kết thúc phiên cũ, không
mang pool/kết quả/callback sang user mới.

**Lỗi client:** lưu mã lỗi thay chuỗi dịch (hoặc cơ chế tương đương có test), dịch khi
render bằng UI hiện hành; lỗi đã hiện và callback micro/HTTP muộn đều theo UI mới,
không reset phiên. Callback của phiên đã kết thúc bị bỏ qua. API phát âm bổ sung
`errorCode?` vào nhánh `ok: false`, giữ `message`, `fallback`, chữ ký và consumer cũ.
Mã: `audio_processing`, `network`, `assessment_unavailable` (fallback),
`assessment_failed` (hard error). Permission, micro không hỗ trợ, chưa đăng nhập/hết
lượt có nhãn riêng khi đã có tín hiệu cấu trúc; không parse câu chữ `body.error` để
đoán loại lỗi. Practice dùng nhãn dịch an toàn cho lỗi không biết, không hiện raw
`body.error` như bản dịch UI. Fallback vẫn hướng sang chấm cơ bản; hard error chỉ cho
thử lại, không tự fallback/gọi lại API. Giữ endpoint, payload, provider và tính lượt.

Giữ `pronounceFeedback(score, learningIsA)`, tips, correction/feedback phỏng vấn theo
direction. “Bạn đọc”, “Thử lại”, “Gợi ý câu tốt hơn” theo UI; không gọi LLM dịch feedback.

### AC và negative cases

- Kiểm đủ 2×2 ở tám mode (hai mode phát âm dùng chung PronounceList); xác nhận câu/từ,
  đáp án, nhãn, TTS locale, STT lang và direction truyền vào prompt.
- Đổi UI giữa lượt không reset score/chọn đáp án, không phát audio ngôn ngữ khác,
  không tự đổi `et_direction`. Bắt đầu lượt mới sau đổi direction lấy đúng chiều mới.
- Guest/default direction A và key lỗi có hành vi xác định; auth không quyết định chiều học.
- Đổi UI sau câu thứ hai của hai mode phát âm giữ target/index/kết quả; Retry giữ
  direction cũ, mở mode mới lấy direction mới. Callback sau thoát/đổi user bị bỏ qua.
- Đổi UI trước callback micro/HTTP và sau khi đã hiện lỗi; kiểm chấm cơ bản/chi tiết,
  fallback/hard error, lỗi không biết và caller cũ không truyền prop UI.
- Mock TTS/STT/provider boundary, không microphone thật hoặc paid API trong gate.
  Test component/helper cho ma trận; E2E luồng chọn mode, đổi UI, reload settings.
- Phần phản hồi sư phạm giữ ngôn ngữ nguồn theo direction; chữ điều khiển/error/loading/
  empty/result nhất quán UI. Đánh giá thủ công cả ba theme ở 390/1440px.

Rollback: revert toàn bộ propagation props và các caller cùng PR; không migration.
Phụ thuộc S00; S05 phải dựa vào contract phân biệt UI/direction đã ổn định của S04.

## 4. S05 — Bộ tạo câu điền từ có kiểm chứng

### Hiện trạng và điểm chạm

`practice/FillBlankQuiz.tsx` lọc chỉ cần có example, cắt SESSION_SIZE=8 rồi replace
`word` hoặc toàn bộ `vi` bằng regex không có ranh giới từ. Nếu không khớp vẫn hiện câu
guyên; nếu là từ con sẽ xóa sai; options lấy ba entry khác nhưng không khử chuỗi trùng.
Chỉ cần >=4 items hiện tại không chứng minh từng câu có bốn options phân biệt.

Tách bộ tạo thuần đề xuất `practice/fillBlankQuestions.ts` và test cùng tên. Giữ
`DictEntry`/JSON từ điển hiện tại tương thích; không bắt nguồn nội dung thêm field mới.
`DictEntry.forms` đã có plural/v3s/ving/past/pastPart/comparative/superlative; không dùng
các flag boolean `uncountable`/`irregular` làm đáp án. Sửa `FillBlankQuiz` dùng question
đã validate, thay vì tự suy đáp án và options ở render.

### Hợp đồng câu hỏi và chính sách dữ liệu

Mỗi câu có `targetLang`, `sourceWord`, câu gốc NFC, span `{ start, end }` theo chỉ số
UTF-16 của chính câu NFC, `answer` đúng bằng slice span, options có id riêng/label,
`correctOptionId` và `blanked` dựng từ span. Validate tại builder; không nhận raw AI.
Builder trả danh sách và thống kê số loại bỏ theo lý do; không đưa learner data vào log.

- A: xét word và những forms dạng chuỗi có sẵn. Match không phân biệt hoa thường,
  giữ nguyên dấu/chuỗi thực trong sentence. Nếu có hơn một vị trí hợp lệ, loại câu;
  không đoán chỗ cần kiểm tra. Đáp án là dạng xuất hiện, ví dụ `went`, không phải `go`.
- Khử trùng candidate word/forms sau NFC/case-fold, rồi khử trùng span bằng cặp
  start/end trước khi đếm. Form trùng headword không tạo hai match; hai span khác
  nhau, kể cả chồng lấn, là mơ hồ và bị loại.
- B: chỉ dùng `vi` nguyên chuỗi sau trim/NFC nếu khớp một span hợp lệ trong `ex_vi`.
  Không tự tách dấu phẩy/chấm phẩy để đoán nghĩa; entry đa nghĩa không khớp bị loại.
- Ranh giới dựa chữ Unicode/mark/số, không dùng `\b` ASCII cho tiếng Việt; giữ dấu
  tiếng Việt. Không match `he` trong `the`, hoặc `an` trong `banana`.
- Câu/đáp án trống, thiếu match, nhiều match hoặc span sai bị loại **trước** shuffle
  và cap. Không tự chia một từ thành nhiều blank, không sinh câu mới bằng AI.
- Bốn options có label duy nhất sau trim/NFC/case-fold; đáp án đúng đúng một lần.
  Distractor không trùng đáp án/forms cùng entry và không dùng label rỗng. Nếu không
  đủ ba distractor thì loại câu. Dùng id ổn định để chọn/chấm, không dùng label làm key.
- Distractor lấy nhãn đích entry khác (`word` cho A, `vi` cho B), loại rỗng, loại đáp án
  và mọi form của entry nguồn theo trim/NFC/case-fold, khử trùng rồi mới chọn ba nhãn.
- Dựng blank bằng prefix + marker + suffix theo span; khôi phục bằng span, không
  replace marker đầu tiên vì câu gốc có thể chứa gạch dưới. Mỗi ứng viên có một lý do
  loại chính, ưu tiên: thiếu dữ liệu → không match → mơ hồ → span sai → thiếu distractor.
  Tổng ứng viên = hợp lệ + tổng loại; không đếm đôi.
- Việc options phân biệt không chứng minh chỉ một từ có thể đúng về ngữ nghĩa. UI mô
  tả nhiệm vụ “Khôi phục câu ví dụ đã học”; không tuyên bố mọi lựa chọn khác sai trong
  mọi ngữ cảnh. Trước release kiểm duyệt mẫu về ngữ nghĩa; muốn bài cloze khảo thí thực
  sự cần distractor và accepted answers biên soạn riêng ở batch có review.
- Giữ ngưỡng phiên tối thiểu bốn câu hợp lệ và tối đa SESSION_SIZE hiện hành. Ít hơn
  bốn: thông báo chưa đủ câu phù hợp, nút về hub; không ghi điểm 0 hoặc chấm câu lỗi.
  Không gợi ý retry sẽ làm dữ liệu hợp lệ nếu pool không thay đổi.

### AC và negative cases

- Fixtures A/B: exact match, hoa thường, Unicode NFC/NFD, dấu tiếng Việt, dấu câu,
  regex metacharacter, từ con, nhiều vị trí, từ biến hình, thiếu ví dụ, nghĩa có dấu
  phân cách, options trùng case/NFC, pool 0–3 câu và pool đủ điều kiện.
- Với mọi câu phát ra: đúng một span không rỗng; chèn answer vào blank khôi phục câu
  NFC chính xác; bốn option ids/labels duy nhất; correct id tồn tại đúng một lần.
- Tập fixture có entry lỗi đứng trước entry tốt, SESSION_SIZE nhỏ: lọc trước cap vẫn
  chọn được câu tốt; chọn sai/đúng cập nhật score đúng một lần; double click không cộng đôi.
- Gọi chọn cùng câu hai lần trước render tiếp theo vẫn chấm một lần; dùng transition
  hoặc guard đồng bộ, không coi `picked` trong closure là đủ bằng chứng.
- UI giữ bốn options ổn định khi chọn/đổi UI, nhãn theo S04; thử lại reset score;
  empty có đường thoát và bàn phím dùng được. Phản hồi không chỉ màu/icon.
- Script phân tích offline toàn từ điển: báo tổng entry/examples, ứng viên hợp lệ và
  từng lý do loại bỏ cho A/B trước/sau, cùng SHA và luật match. Báo riêng pool học thật
  nếu có fixture sạch; không suy tỷ lệ lỗi phiên từ số liệu toàn từ điển.
- Kiểm duyệt tối thiểu 20 câu mỗi chiều, có forms/cụm từ/tiếng Việt dấu, trên fixture
  và mẫu dữ liệu thật; ghi câu bị loại cùng lý do. Đây là gate dự kiến, chưa có kết quả.
- Manifest từng mẫu ghi câu, span, đáp án, options, lý do loại và SHA dữ liệu/luật.
  Ghi riêng kiểm kỹ thuật và review chuyên môn; agent tự kiểm không thay chuyên gia.

### Quyết định S05 ngày 23/09: Draft và điều kiện gỡ blocker

Không cấp approval S05 trong PR này. Dependency bắt buộc: S04 spec đã merge, tiếp đó
S04 source đã merge với evidence S04_AC01–04 trên đúng head. S05 đọc lại main, dùng
contract phiên/props S04; không triển khai hai slice song song trong Practice.

Owner chốt acceptance: Product/chủ sản phẩm. Cần chỉ định người duyệt chuyên môn và
chốt quy tắc khi dữ liệu thật chiều B có dưới 20 câu hợp lệ (không bù bằng câu tự sinh
hoặc coi fixture là dữ liệu thật). Owner evidence: agent S05 nộp thiết kế manifest,
phân tích offline và tiêu chí pass/fail cho mẫu trước khi xin approval; manifest thực,
số liệu và review chuyên môn là gate nghiệm thu trước release.
Chấp nhận empty state dưới bốn câu, kể cả chiều B, không hạ chuẩn để đủ tám câu.
Đây không phải kết luận builder đã đúng hoặc 20 mẫu đã được duyệt.

Rollback: revert builder/caller/tests cùng PR; không thay persistence hay migration.
Rủi ro chấp nhận: độ phủ giảm ở chiều B vì dữ liệu không đủ span rõ ràng. Chất lượng
câu ưu tiên hơn đủ tám câu; batch nâng độ phủ phải có spec và kiểm duyệt nội dung riêng.

### Quyết định bổ sung 24/09: source kỹ thuật S05

Quyết định này thay trạng thái **chờ source** ở các ghi chú lịch sử phía trên và
phần handoff S04 bên dưới; nó không thay điều kiện nghiệm thu chuyên môn.

Chủ sản phẩm tiếp tục giao hoàn thiện phần kỹ thuật và yêu cầu **ghi nợ** nghiệm thu
chuyên gia, người học và thiết bị thật. Sau khi S04 source #1137 đã merge, primary
đối chiếu lại main `548bf937`, contract phiên Practice và audit ngoại tuyến
`docs/research/2026-09-23-s05-offline-evidence.md`. S05 được **Approved for technical
implementation** khi PR đặc tả này merge. Quyết định này chỉ cho phép xây pure
builder, nối UI và kiểm thử; expert review 20 câu mỗi chiều và Product acceptance
vẫn `WAITING_EXPERT_REVIEW`, không được ghi release/semantic PASS từ CI.

- `fillBlankQuestions.ts` là một luật duy nhất cho runtime và script audit. Runtime
  nhận pool `DictEntry[]` và dùng vị trí entry trong pool làm id phiên; audit dùng
  `chunk#index0` kèm dataset digest làm ref bền trong đúng phiên bản dữ liệu. Cả hai
  giữ cùng chuẩn hóa, span, reason và chọn options; không dùng id phiên làm định danh
  xuyên phiên hay trạng thái learner có thẩm quyền.
- Builder trả accepted trước cap và thống kê mỗi entry đúng một reason. Caller trộn
  và cap sau validate; question giữ bốn options/id cố định đến hết phiên, kể cả đổi
  ngôn ngữ UI. Dùng id để chấm và guard đồng bộ để chặn double-click trước rerender.
- Pool chỉ 0–3 câu hợp lệ hiện empty với đường về hub, không tạo score 0; 4–7 dùng
  đúng số câu; từ 8 cap ở 8. Copy nhiệm vụ nói rõ **“Khôi phục câu ví dụ đã học”**,
  không ngụ ý distractor sai trong mọi ngữ cảnh.
- Source PR hẹp gồm builder/test, `FillBlankQuiz`/test, script audit/test và E2E
  cho A/B, empty, keyboard, retry, cùng full gate Node 22. Không sửa từ điển,
  Practice session contract, API, DB, billing/mastery hay dữ liệu người học.
- Artifact audit mới phải có hash, rule version, tổng reason và trạng thái review
  chuyên môn WAITING. Manifest 40 mẫu cũ là danh sách review, không được tự điền
  expert PASS. Rollback source bằng revert builder/caller/script cùng PR; giữ bản
  manifest cũ và ghi S05 technical chưa đạt.

## 5. Gate, bằng chứng và điều kiện triển khai

Mỗi slice riêng phải qua build/typecheck/lint/format/unit/E2E theo AGENTS bằng Node22,
đúng lockfile, fake API/provider. Kiểm responsive 320/390/768/1440, ba theme, keyboard,
ảnh trước/sau 390/1440; chữ đọc >=7:1, controls AA và vùng chạm >=44px. Không hạ gate
hoặc coi axe incomplete là pass. Không dùng kết quả của PR trước cho slice sau.

S04 được duyệt theo ủy quyền hiện tại sau review #1128 và contract tích hợp; phải merge
PR spec trước source. S05 vẫn Draft theo blockers §4. Tác vụ này chỉ tài liệu, được
push/tạo PR/bật auto-merge squash với exact full head SHA, không triển khai source.
Không suy CI docs xanh là nghiệm thu sản phẩm hay pilot.

## ① Phạm vi S04 được duyệt

LÀM: contract §3 cho tám mode Practice và nhánh phát âm dùng chung; giữ luồng hiện có.
KHÔNG LÀM: S03, builder S05, prompt/server/provider/usage, persistence/mastery, dữ liệu
từ điển, thiết kế lại hub, các worktree khác. Không có migration. S04 không bảo đảm
câu điền từ hợp lệ về span: đó là S05. S00 là baseline/research đã có trong goal.

## ② Điểm chạm S04

Đường dẫn đầy đủ tính từ repo; write set implementation (PR này không sửa source):

| Việc | Đường dẫn file                                               | Ghi chú                                    |
| ---- | ------------------------------------------------------------ | ------------------------------------------ |
| Sửa  | `apps/dhcb/src/pages/learning/Practice.tsx`                  | Snapshot phiên/pool; nhãn UI               |
| Sửa  | `apps/dhcb/src/pages/learning/practice/VocabListenGuess.tsx` | Direction và UI                            |
| Sửa  | `apps/dhcb/src/pages/learning/practice/SentenceScramble.tsx` | Direction và UI                            |
| Sửa  | `apps/dhcb/src/pages/learning/practice/DictationTyping.tsx`  | Direction và UI                            |
| Sửa  | `apps/dhcb/src/pages/learning/practice/FillBlankQuiz.tsx`    | Props/nhãn/ổn định phiên, chưa builder S05 |
| Sửa  | `apps/dhcb/src/pages/learning/practice/PronounceList.tsx`    | Danh sách ổn định, UI xuống nhánh con      |
| Sửa  | `apps/dhcb/src/pages/learning/practice/Shadowing.tsx`        | Lỗi client và feedback                     |
| Sửa  | `apps/dhcb/src/pages/learning/practice/ReverseInterview.tsx` | Lỗi callback và feedback                   |
| Sửa  | `apps/dhcb/src/pages/learning/practice/GameChrome.tsx`       | Nhãn kết quả/Retry                         |
| Sửa  | `apps/dhcb/src/components/PronunciationCheck.tsx`            | Prop UI tùy chọn, giữ caller cũ            |
| Sửa  | `apps/dhcb/src/components/DetailedPronunciationCheck.tsx`    | Prop UI, mã lỗi, giữ điều kiện lang        |
| Sửa  | `apps/dhcb/src/lib/pronounceAssessApi.ts`                    | errorCode additive, giữ message/fallback   |
| Sửa  | `apps/dhcb/src/lib/pronounceAssessApi.test.ts`               | Hồi quy consumer cũ và mã lỗi              |

**Bổ sung QA S04 (Approved for implementation, 2026-09-23):** kiểm thực tế
AC04 trên bản source #1137 phát hiện outline bàn phím bị selector `:focus` chung
ghi đè `:focus-visible`, tiến độ `1/8` và tiêu đề môn học trên Practice chưa đạt
ngưỡng chữ đọc 7:1, nút đóng mode thiếu nhãn và vùng chạm 44px. Chủ sản phẩm đã
ủy quyền quyết định và hoàn thiện UI/UX; bổ sung đúng các điểm chạm sau trước khi
merge source. Đây là sửa lỗi accessibility đã đo, không mở lại contract chiều học,
không làm S05 hay tuyên bố nghiệm thu thiết bị thật.

| Việc | Đường dẫn file                                               | Giới hạn bổ sung QA                                                      |
| ---- | ------------------------------------------------------------ | ------------------------------------------------------------------------ |
| Sửa  | `apps/dhcb/src/index.css`                                    | `:focus:not(:focus-visible)` giữ outline bàn phím, chỉ selector hiện hữu |
| Sửa  | `apps/dhcb/src/pages/learning/Practice.tsx`                  | Màu heading, truyền nhãn nút thoát mode                                  |
| Sửa  | `apps/dhcb/src/pages/learning/practice/VocabListenGuess.tsx` | Màu tiến độ câu đạt 7:1 trên ba theme                                    |
| Sửa  | `apps/dhcb/src/pages/learning/practice/GameChrome.tsx`       | Accessible name vi/en và target 44px                                     |

Evidence before: QA head `db54c74827717b144f2cf399a62fe19cc20df359`, 30 trạng
thái ba theme/năm viewport không tràn ngang, nhưng focus mode/đáp án vô hình;
tiến độ 1/8 tương phản 6.76/5.41/5.32:1, heading dark-blue 6.8:1. Sau sửa phải
đo lại outline/tương phản trên ba theme, kiểm E2E và CI đúng source head. 200% mới
được mô phỏng viewport tương đương; browser zoom thật, screen reader và microphone
thật còn chờ evidence. QA không được coi là pass chỉ nhờ thay class/token.

Impact đã chạy trên baseline bằng Node 22.23.2: `PronunciationCheck.tsx` có 13 file
ảnh hưởng, gồm caller trực tiếp `WordCard.tsx`/`PronounceList.tsx`; `pronounceAssessApi.ts`
có 16 file, trực tiếp `DetailedPronunciationCheck.tsx` và test helper. Giữ default props
và nhánh message cũ vì WordCard lan tới StudyTabs/CefrLessonViews/Dictionary.

Đọc, không đổi contract: `practice/shared.ts`, `lib/listening.ts`, `lib/storage.ts`,
`types.ts`, các prompt đang gọi. Trước implementation chạy
`npm run codemap -- impact <file>` cho từng file sửa và lưu output trong PLAN.md cục bộ;
rà caller ngoài Practice của hai component phát âm và helper API. Không mở rộng write
set sang caller cũ nếu default props đã giữ tương thích; nếu buộc phải đổi thì cập nhật
spec trước. Các đường dẫn rút gọn ở đoạn này theo quy ước §1.

**File mới được lập kế hoạch, chưa tồn tại:**
`apps/dhcb/src/pages/learning/practice/s04Contract.test.tsx` và
`e2e/practice-direction.spec.ts`. Viết test hồi quy trước source S04; không tạo file rỗng
trong PR docs để làm cổng paths xanh. S05 builder/test là kế hoạch Draft §4, ngoài bảng S04.

## ③ Hợp đồng dữ liệu S04

Vào: `direction: 'A' | 'B'` từ storage (giá trị khác → A tại Practice),
`uiLang: 'vi' | 'en'` từ context, pool `DictEntry[]`, user hiện hành.
Ra: dữ liệu/audio/feedback theo snapshot direction, nhãn/lỗi client theo UI hiện hành;
không ghi direction khi đổi UI. Helper `isA` vẫn chỉ chiều học. Component phát âm dùng
chung nhận `uiLang?`; thiếu prop mặc định `isA ? 'vi' : 'en'` để giữ consumer cũ.
`GameResult` và mini-game được truyền UI tường minh, không dùng UI làm chiều học.
Mã lỗi và chính sách fallback/hard error theo §3; không đổi response server.

## ④ Tiêu chí chấp nhận S04 và bằng chứng cần nộp

- [ ] **S04_AC01:** toàn bộ ma trận 2×2 và tám mode ở §3, cả nhánh chấm chi tiết,
      TTS/STT, feedback theo direction. Chạy `proof` AC01 trong YAML; assert dữ liệu
      thực truyền vào boundary, không chỉ snapshot nhãn.
- [ ] **S04_AC02:** test đổi UI giữa câu, sau câu thứ hai phát âm, chọn đáp án, Retry,
      đổi direction rồi về hub/mở mode, reload và đổi user. Chạy `proof` AC02; so sánh
      target/options/index/score/result trước–sau và kiểm storage không bị ghi.
- [ ] **S04_AC03:** test lỗi đã hiện, callback trễ, callback phiên cũ, permission,
      offline, quota/fallback, hard error và lỗi không biết; chấm cơ bản/chi tiết và
      caller không truyền UI giữ tương thích. Chạy `proof` AC03 với fake boundary.
- [ ] **S04_AC04:** chạy `proof` AC04; test settings/route `/luyen-tap`, bàn phím,
      loading/empty/error/offline/guest/quota và tất cả theme/bề rộng §5. Chụp trước/sau
      390/1440 bằng Playwright screenshot, QA mở và review ảnh thật; lưu đường dẫn
      artifact, lệnh, SHA và kết quả từng AC trong Nghiệm thu của PR implementation.

Các lệnh targeted phải trả 0 và chạy đủ ca đã nêu; không chấp nhận “no tests found”.
Full gate §5 và CI quality/e2e/metadata trên đúng head vẫn bắt buộc. Test mới phải nằm
trong include của Vitest/Playwright hiện có, không chỉnh gate để bỏ qua.

## ⑤ Bất biến và test canh S04

| Bất biến                                                         | Test implementation phải canh                               |
| ---------------------------------------------------------------- | ----------------------------------------------------------- |
| UI không đổi direction, nội dung, score hoặc audio               | `s04Contract.test.tsx`, AC01–02                             |
| UI hiện hành cho lỗi, không nhận callback phiên cũ               | `s04Contract.test.tsx`, AC03                                |
| Giữ fallback/hard error, message consumer cũ, không gọi API thêm | `pronounceAssessApi.test.ts`, AC03                          |
| Feedback theo direction, không đổi prompt/usage/mastery          | Fake boundary AC01/03 và review diff không có server/prompt |
| Ba theme, chữ >=7:1, controls AA, keyboard                       | E2E và ảnh AC04                                             |

## ⑥ Quy ước và rollback

Theo AGENTS/CLAUDE/protocol: Node 22, lockfile, TypeScript strict, import theo repo,
tokens `--a-*`/`--z-*`, test không paid provider/production data. S04/S05 chạy tuần tự;
PLAN.md cục bộ khai file locks, AC refs và dependency trước source. Reviewer đọc spec
gốc, không coi lời báo của implementer là bằng chứng. Rollback S04: revert đồng bộ
props/helper/caller/tests; rollback PR docs: revert tài liệu, không có dữ liệu cần phục hồi.

## ⑦ DESIGN_SPEC

Design S04 tái sử dụng giao diện hiện có, không đổi flow/scope. Codex xác nhận dưới
ủy quyền Product ngày 2026-09-23; đây là duyệt thiết kế, chưa kiểm ảnh implementation.

```yaml
screen: practice
route: /luyen-tap
layout:
  desktop: { width: reading, columns: 1, regions: [Layout, MiniHeader, ActiveMode, GameResult] }
  mobile:
    { width: 390px, columns: 1, regions: [Layout, MiniHeader, ActiveMode, GameResult, BottomNav] }
components:
  - { name: Layout, source: reuse, path: apps/dhcb/src/components/Layout.tsx }
  - { name: MiniHeader, source: reuse, path: apps/dhcb/src/pages/learning/practice/GameChrome.tsx }
  - { name: GameResult, source: reuse, path: apps/dhcb/src/pages/learning/practice/GameChrome.tsx }
  - { name: ActiveMode, source: compose, from: [Practice, existing_practice_modes] }
  - {
      name: PronunciationCheck,
      source: reuse,
      path: apps/dhcb/src/components/PronunciationCheck.tsx,
    }
  - {
      name: DetailedPronunciationCheck,
      source: reuse,
      path: apps/dhcb/src/components/DetailedPronunciationCheck.tsx,
    }
tokens: { spacing: existing, typography: existing, color: '--a-* / --z-*' }
states:
  loading: Practice hoặc mode hiện hành báo tải/chấm, không cho chọn dữ liệu cũ
  success: ActiveMode và GameResult theo UI hiện hành
  empty: ActiveMode báo thiếu nội dung và MiniHeader về hub
  error: ActiveMode hoặc component phát âm báo lỗi đã dịch và thử lại
  offline: Component đang gọi mạng báo lỗi kết nối và thử lại có chủ đích
  unauthenticated: Practice giữ điều kiện đăng nhập mode AI và đường thoát hub
  quota_exhausted: Mode AI báo giới hạn; phát âm chi tiết giữ fallback theo API
a11y: { content: AAA, controls: AA, touch_min: 44px }
themes_required: [blue-sky, dark-blue, kid]
themes_checked: []
```

Desktop 1440: Layout → MiniHeader (về hub/tên mode) → nội dung một cột reading →
điều khiển hoặc kết quả. Mobile 390: cùng thứ tự, nút không tràn, chừa vùng BottomNav.
Ưu tiên câu/từ đang học rồi phản hồi và hành động; UI đổi ngôn ngữ không nhảy focus hay
đổi target. Loading vô hiệu thao tác đang xử lý, error giữ câu/tiến độ và đường thoát;
empty không chấm điểm 0. Chỉ sửa nhãn/lỗi thuộc mode, không redesign các banner hub.
Không có component `new`; các component reuse/compose dùng paths ở bảng ②.
Ba theme được đưa vào design constraints; `themes_checked: []` vì chưa có ảnh source mới.

## Nghiệm thu tài liệu và handoff

- Review nguồn: #1128 đã merge ở baseline; các bổ sung S04 (phiên/phát âm/lỗi/feedback)
  và S05 (span/distractor/thống kê/guard/manifest) đã tích hợp vào §3–4.
- S04 đủ contract để duyệt theo ủy quyền; S05 Draft với owner/điều kiện gỡ blocker.
- Kiểm tài liệu: Prettier, protocol, spec paths, changelog và progress freshness;
  kết quả thật ghi trong changelog/PR. Chưa chạy bất kỳ `proof` sản phẩm S04/S05 nào.
- Trước source: PR spec merged, đọc lại main, tạo PLAN.md, chạy impact từng file.
  Sau source: QA_REPORT trên head implementation, không dùng CI docs thay thế.
