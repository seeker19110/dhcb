# S06a — Sửa cổng AAA bỏ sót target: bằng chứng triển khai

Trạng thái: **VERIFYING**, chưa hoàn thành S06, chưa đủ điều kiện merge. Base
`f07820aa`, nhánh `codex/uiux-accessibility`. Không gọi provider trả phí hoặc production.

## Phạm vi

Sửa lỗi hiện hữu tại `e2e/a11y-aaa.spec.ts`, thêm collector
`e2e/helpers/aaaFindings.ts`. Nội dung inline trong đoạn văn, heading trong header
và link văn xuôi không bị bỏ qua; button và navigation giữ phạm vi AA. Target axe
được giữ nguyên. Target mất khỏi DOM, selector không hợp lệ, target frame/shadow chưa
hỗ trợ, không phân loại được hoặc rule không có node đều không được thành pass.

Mọi incomplete được giữ để review, kể cả chrome. Axe 4.13.0 dùng minThreshold
4.5/3 cho `color-contrast-enhanced`, bỏ kết quả ratio chưa xác định. Vì vậy scan AAA
vẫn giữ nguyên tags và scan riêng `color-contrast` cung cấp incomplete bổ sung.
Không chain `withRules()` sau `withTags()` vì sẽ ghi đè phạm vi quét.

## Kiểm chứng local

Runtime Windows Node 22.23.2, Playwright 1.63.0, Chromium 153.0.8010.12,
axe-core 4.13.0; mỗi lượt một worker.

- Negative controls (`--grep 'S06a negative controls'`): **2/2 đạt**. Fixture HTML
  thật qua axe bắt `p > span`, `p > em`, prose link, heading trong header; chấp nhận
  chữ #333 trên trắng và chrome AA #666 trên trắng. Gradient thật tạo incomplete;
  node xóa sau scan phải báo missing; full target lồng và rule không có node không
  được bỏ qua. Hai lần thử gradient chỉ với rule enhanced không sinh incomplete;
  đã đối chiếu mã axe và bổ sung rule AA, không giả kết quả incomplete.
- Trước sửa avatar: requested `/login` redirect về `/` sau mockLogin × `dark-blue`, `blue-sky`, `kid`: **0/3 đạt, 3/3 fail**.
  Cả ba ở trang chủ đã đăng nhập báo `incomplete: color-contrast target=[".w-7"] (chrome)` với lý do
  `Element content is too short to determine if it is actual text content`.
  Không có miễn trừ hoặc evidence thủ công giả để chuyển thành đạt.
- Sau sửa avatar Layout: requested `/login` → final `/` cả ba theme: **3/3 đạt**
  (10.6s), không còn incomplete `.w-7`. Đây không phải bằng chứng màn Login.
- Unit Layout: **17/17 đạt**, Vitest 5.0.1, 691ms.
- ESLint hai file TypeScript sửa: exit 0.
- Codemap impact cho spec E2E: exit 1, bản đồ hiện không chứa file E2E này.
  Đã đọc trực tiếp helper/caller; không sửa generated codemap.

Các lượt dùng config tạm giữ browser chuẩn, tắt GPU Windows; controls không khởi
động Vite, route dùng Vite port 5182, giữ toàn bộ dữ liệu mock hiện có. Config tạm
không đưa vào commit. Full build/typecheck/lint/unit/E2E và ma trận AA/AAA **chưa
chạy**; cần root điều phối tuần tự khi tích hợp. Không tái sử dụng số pass cũ.

## Phần còn lại

S06b cần phép đo 7:1 độc lập cho heading lớn, compositing alpha, token/gradient
không kết luận, trạng thái tải nội dung và xử lý evidence incomplete trên ma trận
route/theme/state. S06a không chứng minh tất cả nội dung đạt 7:1. Avatar `.w-7` được sửa nền gradient thành `bg-zinc-800`, chữ `text-zinc-100`,
không đổi ký tự E, button `aria-label="Trang cá nhân"` hoặc tên người dùng.
Codemap Layout: 77 file ảnh hưởng. Màu computed sau sửa (foreground/background):

| Theme     | Foreground       | Background       |
| --------- | ---------------- | ---------------- |
| dark-blue | rgb(236,242,250) | rgb(34,53,84)    |
| blue-sky  | rgb(15,23,42)    | rgb(226,232,240) |
| kid       | rgb(66,42,22)    | rgb(246,234,202) |

Ảnh blue-sky 390/1440 tại `C:/Users/liend/.codex/uiux-implementation/s06-avatar-{before,after}-{390,1440}.png`.
Ảnh before là tái dựng class cũ trên DOM cùng trang/mock để đối chiếu, không phải
ảnh production hoặc bằng chứng baseline commit độc lập.

S07 (zoom/reflow) và S08 (quiz/AT) vẫn chờ đặc tả Approved/merged và S06 tích hợp.
Chưa thay meta viewport, CSS toàn cục, các component quiz, focus hoặc dữ liệu học viên; chỉ avatar trong Layout thay màu như ghi ở trên. Không migration;
rollback bằng revert bốn file của slice này, đồng thời ghi nhận lỗ hổng gate mở lại.

## Kiểm tra CI PR #1122 ngày 23/09

Đã fetch/reconcile `origin/codex/uiux-accessibility`; HEAD `9d020f4a`, không conflict.
Run [35853132839](https://github.com/seeker19110/dhcb/actions/runs/35853132839)
fail Type/Lint/Format tại **TypeScript**: assertion Playwright `toBeDefined()` không
thu hẹp kiểu `rule`/`rule.nodes[0]` dưới `noUncheckedIndexedAccess`. Sửa bằng guard
throw nếu fixture không tạo violation có node; không ép kiểu hoặc bỏ kiểm tra.
Sau sửa `tsc -p tsconfig.e2e.json`: exit 0. Controls chạy lại: **2/2 đạt**.

E2E shard 1/6 có **60 test fail**; năm shard còn lại và unit/build đều đạt trong run
trên. Đây là lỗi/thiếu evidence được cổng mới phát hiện, không phải conflict Git:

- `ProgrammingLevelPage.tsx:252` và `ProgrammingCoursePage.tsx:185`: chữ “Chương n”
  dùng `text-zinc-500` trong heading. CI đo 5.85 dark-blue, 5.21 blue-sky, 5.11 kid,
  dưới 7:1. Local `/lap-trinh/p1` dark-blue tái hiện 10 node vi phạm.
- Cùng route có 10 dấu chương trong button (target `.w-3.text-content-muted.t-caption`)
  incomplete ở cả hai rule vì chỉ chứa ký tự phi văn bản. Chưa có phép đo/kết luận
  bổ sung nên vẫn fail, không loại vì chrome hoặc aria-hidden.
- Các route khác còn incomplete nền ảnh, gradient, phần tử che khuất, text SVG;
  ví dụ STEM target `text[x="100"]`, `text[x="320"]`, `text[x="60"]`, `text[x="140"]`.
- Khối AI phản hồi code blue-sky/kid có target `.gap-2\\.5 > div > span` mất khỏi DOM
  lúc phân loại. Phải ổn định trạng thái scan hoặc cung cấp evidence tương ứng;
  không được coi missing là pass.

Lượt local sau sửa TS: **2 controls đạt, 1 route p1 dark-blue fail** (8.6s).
Chưa sửa hai page ngoài ownership hoặc các nguyên nhân incomplete; PR vẫn bị chặn
bởi E2E. Cần các slice sửa token/component có đo lại và xử lý evidence chưa kết luận,
không thể xác nhận merge-ready bằng việc chỉ sửa TypeScript.

## Vòng sửa nguồn tiếp theo (base `222ede1a`)

Các thay đổi source đã tái hiện trước khi sửa:

- `ProgrammingLevelPage`/`ProgrammingCoursePage`: nhãn chương đổi `text-zinc-500`
  thành `text-zinc-300`; đoạn giải thích LevelPage dùng accent900 ở theme sáng.
- `OutlineTree`: chevron và dấu trạng thái vốn là ký tự Unicode đổi thành icon SVG
  cùng ý nghĩa. Giữ `aria-expanded`, `aria-controls`, nhãn trạng thái chữ `sr-only`,
  liên kết và phím điều hướng. Không xoá thông tin để tránh scan. Icon trạng thái
  dùng các hình Check/CircleDashed/Circle/Minus/Lock và token secondary tương ứng.
- `WordCard`: hai mặt vẫn dùng grid và xoay 3D, thêm `visibility` đồng bộ với
  `aria-hidden` để mặt sau không bị đo xuyên khi chưa lật; nền solid `bg-zinc-900`
  thay gradient, bỏ quầng nền trang trí gây overlap. Focus và `aria-pressed` giữ nguyên.
- `VocabMilestone`: số từ đã thuộc thiếu variant sáng, bổ sung accent900. Badge A1
  tại `TodayLesson` dùng accent900 ở theme sáng để vượt 7:1 trên nền accent alpha.

Kết quả tại thời điểm chỉ có các sửa nguồn trên, trước helper snapshot mới:

- `/tu-dien`, `/lap-trinh/p1`, `/lap-trinh/khoa-hoc/git--git-github-thuc-hanh` ×
  ba theme: **9/9 đạt**, 23.6s.
- Unit `OutlineTree` 17 + `ProgrammingLevelPage` 3: **20/20 đạt**, 1.25s.
- Toàn ma trận AAA gồm ba ca mới lật thẻ bằng Enter/Space, giữ focus và scan mặt sau:
  **74 đạt, 51 fail / 125**, 6.2 phút, một worker. Ba ca lật thẻ đều đạt.
- ESLint các file nguồn sửa lúc đó: exit 0. Không tuyên bố full gate đạt.

### Nhóm còn lại từ ma trận (không cộng thành số node)

Các số sau là số target-selector duy nhất theo lý do, không phải số test hoặc người dùng:

| Nhóm chưa kết luận       | Target duy nhất | Nguồn/điểm tiếp theo                                  |
| ------------------------ | --------------: | ----------------------------------------------------- |
| Short text               |              14 | So sánh phép đo AA cho chrome; không miễn trừ chữ đọc |
| Bị che một phần          |               7 | Lessons cards, sidebar và trạng thái hiện khi scroll  |
| Gradient                 |               6 | CTA Chat/Speaking/MistakeBank và Companion            |
| SVG/image background     |              10 | `LessonAnimation` các nhãn STEM; cần phép đo riêng    |
| SVG overlap              |               2 | Khối bài Sinh/admin review                            |
| Feedback partial overlap |               1 | AI feedback target `.gap-2\\.5 > div > span`          |

Vi phạm AAA đo được còn ở `cefrAccent` (Roadmap/CefrLevelPage), link đọc trong
`DashboardEnglishDetails`, badge/strong của `ProgrammingAbout`, badge/timestamp
`StudioDialogue`. Summary tại GroupSpread là nhãn disclosure tương tác, cần được
phân loại AA bằng semantic đúng, không cần hạ tương phản chữ đọc.

### Helper dùng cùng snapshot và chứng cứ AA

Giữ đầy đủ rule ID từ `axe.getRules(AAA_TAGS)` của chính phiên bản axe đang cài,
thêm `color-contrast` và chạy một lần. MutationObserver theo dõi subtree, attributes,
childList và characterData từ trước scan đến sau phân loại; bất kỳ thay đổi nào làm
snapshot chưa kết luận, xoá mọi resolution và giữ gate fail.

Chỉ kết luận lại `color-contrast-enhanced` incomplete `shortTextContent` khi target
chính xác thuộc chrome và **cùng kết quả scan** có AA pass với foreground,
background, ratio hữu hạn ≥4.5. Không kết luận bằng việc chỉ có chữ “pass”; không
resolve gradient, image, unknown hoặc target biến mất. Raw violations/incomplete
và bản ghi resolution (màu, ratio, rule đo) được đính kèm JSON `axe-aaa-evidence`
trong Playwright report. Vi phạm AA vẫn fail cả trên chrome.

Controls mới sau thay helper: **5/5 đạt**, 4.1s, không dùng Vite/provider. Chứng minh
rule set không mất AAA; snapshot thay đổi không đạt; nội dung 4.5–7 vẫn fail;
chrome dưới AA vẫn fail; chrome short text chỉ được kết luận bằng AA measurement;
stale/không có measurement/gradient/missing/target lồng vẫn chưa kết luận.
Toàn ma trận sau helper mới chưa chạy tại thời điểm ghi mục này.

### Siết yêu cầu chữ đọc và bằng chứng đo bổ sung

- Với `passes` có ratio thực do axe đo, chữ đọc vẫn bị chặn khi ratio <7 kể cả
  heading lớn (axe enhanced chỉ yêu cầu 4.5 cho chữ lớn). `data-reading-content`
  trên nghĩa/ví dụ WordCard giữ yêu cầu 7:1 dù thẻ có wrapper button; nhãn nút
  thông thường vẫn AA.
- Chữ SVG LessonAnimation và tỷ lệ LevelMilestones có halo đục 3 CSS px,
  `paint-order: stroke fill`, `non-scaling-stroke`; nhãn hoạt ảnh được vẽ sau shape.
  Helper tính luminance sRGB của fill/stroke thực. Chỉ kết luận khi ratio ≥7,
  đủ viền 1.5 px, không clip/transform/opacity/filter/mask, không child/tspan chưa
  đo và không hình SVG vẽ sau hoặc HTML có paint giao vùng chữ. Bounding box
  được nới theo nửa stroke để không chứng nhận viền đã bị cắt.
  Cơ sở halo: [W3C G18](https://www.w3.org/WAI/WCAG21/Techniques/general/G18).
  Không allowlist image/incomplete; raw axe vẫn được giữ trong attachment.
- Scroll remeasurement do agent S09 viết giữ target duy nhất, outerHTML, geometry,
  MutationObserver và raw axe. Scanner chỉ bỏ đúng incomplete khi recheck ổn định,
  không reason/violation và cùng target có màu + ratio AA đo được ≥7 cho chữ đọc,
  ≥4.5 cho chrome. Truncate, DOM đổi, target không duy nhất và không có ratio vẫn
  unresolved. Không thay CSS scrollport chỉ để tránh scanner.

Validation sau các thay đổi trên: **22/22 controls đạt, 11.5s**, gồm 6 controls
AAA, 6 scroll và 10 halo; E2E TypeScript `--noEmit -p tsconfig.e2e.json` exit 0.
Full matrix current dirty diff đang chạy; các kết quả ma trận cũ ở trên không được
xem là validation của snapshot hiện tại. Chưa xác nhận full gate hoặc hoàn thành S06.

### Ma trận đầy đủ sau union/nguồn và review guard cuối

Lượt duy nhất trên snapshot trước các guard cuối: **97 đạt, 32 fail /129, 8.8 phút**,
1 worker. File log local `/tmp/s06-matrix-final.log`; report được lưu giải nén tại
`/tmp/s06-final-report`. Các nhóm còn lại: LessonList scroll/lazyload làm selector
không duy nhất; SVG LessonAnimation/LevelMilestones chưa được chứng minh đủ;
Companion selected domain pill gradient; DOM mutation trong ProgrammingLesson/AI
feedback; avatar inactive Đi chung; ví dụ WordCard kid ratio6.82; một timeout
`/lich-su-hoc` tại bước chờ DOM. Không quy timeout thành lỗi màu hoặc tăng thời gian
chờ theo phỏng đoán.

Sau ma trận, review siết thêm: classification nằm trong MutationObserver của phép
đo lại; halo từ chối ancestor pseudo, SVG root khác giao vùng, và viền bị ancestor
scrollport cắt. Controls sau guard: **24/24 đạt, 14.1s**; E2E TypeScript exit0.
Thêm mutation details và lý do halo unresolved vào raw attachment phục vụ chẩn đoán.
WordCard word/IPA mặt trước cũng có marker chữ đọc; ví dụ mặt sau theme sáng đổi
accent800→900 theo phép đo kid6.82. Các thay đổi cuối cần targeted gate, không dùng
97/129 ở trên để tuyên bố snapshot cuối đạt.

## Checkpoint cuối trước primary review/CI

Snapshot đã reconcile `main` gồm các PR S07/S11. Không coi các lượt bị mất session
hoặc timeout là pass. Bằng chứng bền nằm tại
`C:/Users/liend/.codex/uiux-implementation/artifacts/`.

- `s06-final-verification.log`: **64 đạt, 5 fail /69, 4.1 phút**. Năm lỗi thật là
  ba theme của sơ đồ Sinh học và IPA mặt trước WordCard ở hai theme sáng.
- IPA WordCard đo được 6.28 (blue-sky) và 6.11 (kid); đổi accent800→900.
- Sơ đồ `sinh12c1.ts` chỉ đổi bốn giá trị: `lb-lt` y34→28 và fill neutral;
  `lb-ok` x300→220 và fill neutral. Giữ nguyên chữ, topology, chiều mạch và keyframes.
  Trước sửa, halo label y34 chỉ đạt 4.058 ở dark/3.738 ở light; nhãn 3′ giao bounding
  box của nhãn vẽ sau; caption dưới vượt viewBox. Không miễn trừ incomplete.
- Sau sửa: `s06-final-five-controls.log` **37/37 đạt, 1.3 phút**: sáu ca admin/WordCard
  ba theme, 29 negative/positive controls và hai ca chụp ảnh Sinh học.
  Raw `s06-final-37-report` giữ axe incomplete, phép đo halo, scroll và classification.
- Unit `packages/subject-biology/lessons.test.ts`: **17/17 đạt, 1.23s**.
  Unit LessonAnimation/LevelMilestones trước đó **14/14 đạt, 1.16s**.
- E2E TypeScript (gồm fixture metadata mới) exit0; ESLint helpers/AAA/fixture/WordCard
  exit0 trước bốn giá trị dữ liệu Sinh học. Primary chạy lại full changed lint/format.
- Codemap Sinh học đã thử và **OOM exit134**, không báo pass/không retry; fallback `rg`
  xác nhận importer `lessons.ts` và lazy chapter loader `sinh12c1`.

Ảnh thực trước/sau bốn giá trị Sinh học: `s06-biology-before-{390,1440}.png` và
`s06-biology-after-{390,1440}.png`; ảnh renderer SVG/ProgressRing:
`s06-lesson-animation-after-{390,1440}.png`,
`s06-level-milestones-after-{390,1440}.png`. Đã xem ảnh sau ở cả hai kích thước,
nhãn không cắt hoặc che hướng mạch.

Phạm vi fixture danh sách bài được ghi riêng ở
[contrast-fixture-scope.md](../ux-upgrade/s06/contrast-fixture-scope.md): dùng 10 metadata
thật bao đủ bảng màu; không tuyên bố đã đo 350 bản ghi. Kiểm thử real-index lazy append
hai viewport và control sibling mới thiếu tương phản vẫn được giữ.

Readiness chờ chỉ báo đồng bộ hoàn tất và mock đúng GET/POST programming progress;
không bỏ qua DOM mutation hoặc HMR. Phép đo lại chụp classification trong observer
`documentElement`, kiểm identity phần tử (clone cùng HTML vẫn fail); DOM đổi do scroll
được giữ trong raw. Nếu scroll tải thêm nội dung, quét mới toàn trang tối đa một lần,
giữ mọi finding cũ; thay đổi tiếp vẫn unresolved. Halo sau scroll cũng nằm trong snapshot
được canh mutation; pseudo chỉ chấp nhận positioned negative layer phía sau chuỗi
ancestor không âm, các overlay khác vẫn fail closed.

Đây là checkpoint đủ để primary review/commit/push và kiểm CI, **chưa tuyên bố S06
hoàn thành hoặc toàn bộ build/typecheck/lint/unit/E2E đã đạt trên commit cuối**.
