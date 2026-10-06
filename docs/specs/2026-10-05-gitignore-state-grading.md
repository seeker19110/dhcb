# Đặc tả — Phase00: loại trừ bí mật và trọng số AI khỏi commit

Trạng thái: **Approved for implementation — chỉ sau khi PR đặc tả merge**. Ngày: 2026-10-05. Thuộc phương án 20 phase và quyền triển khai/PR/merge đã được chủ dự án duyệt; review độc lập và kiểm tương thích đã xử lý ở mục cuối. Không mở worker hoặc triển khai production.

## Phạm vi và bằng chứng

Nguồn khóa tại `f6dbae74ef622b78a76df704f86eafcde9f4ef3f`, source key `00-setup-and-tooling/02-git-and-collaboration`, đường dẫn `phases/00-setup-and-tooling/02-git-and-collaboration/docs/en.md`. Ma trận hiện là EXTEND/K1, trỏ `p3-u10-l1`; lát này bổ sung mục tiêu loại trừ tệp lớn/bí mật, tái sử dụng `p3-u11-l1`. Không đổi toàn mục nguồn thành complete/REUSE: cộng tác, nhánh và đồng bộ còn cần bằng chứng riêng. Đã đọc trực tiếp bài nguồn pinned ngày 2026-10-05: Learning Objectives và Exercises yêu cầu loại trừ checkpoint `.pt`, `.pth`, `.safetensors`; nguồn còn yêu cầu identity, add/commit/push, nhánh và log. `.env` là phần bổ sung DHCB từ bài hiện có, không gán thành mục tiêu nguyên văn của nguồn.

Hiện `gitSim.ts` có workdir/staged/commit snapshot nhưng `git add .` lấy mọi file, `git status` liệt kê mọi file chưa theo dõi. `.gitignore` hiện chỉ là file văn bản. `p3-u11-l1` Make chỉ dựng README và ignore, các ca `contains` so transcript; echo chữ kỳ vọng có thể vượt ca mà không tạo trạng thái mong muốn. `grading.ts` chỉ nhận output/error. Server dùng cùng simulator nhưng cũng chỉ so output.

## Kết quả học tập

Học viên viết `.gitignore` cho `.env`, `*.pt`, `*.pth`, `*.safetensors` và `__pycache__/`; commit README và chính `.gitignore`, giữ tệp bí mật/trọng số trong working tree, chứng minh chúng chưa vào staging hay lịch sử. Giải thích ignore không xóa tệp và không bỏ theo dõi tệp đã commit. Mọi dữ liệu bí mật của fixture đều là chữ giả, không dùng khóa thật. Ca chứng minh commit bắt buộc state `initialized === true` và HEAD tồn tại; không để assertions absence trên repo chưa commit tự đạt.

## Hợp đồng subset mô phỏng

Chỉ đọc `.gitignore` ở gốc từ **workdir tại lúc status/add**, không lấy phiên bản staged. Một dòng một pattern; CRLF chuyển LF; bỏ dòng trống và dòng bắt đầu `#`; trailing spaces được bỏ (escaped spaces không hỗ trợ). So khớp phân biệt hoa/thường, path ảo POSIX; không I/O thật.

Hỗ trợ tên literal không slash (`.env`): so basename ở bất kỳ mức path ảo; wildcard `*` ở một thành phần (`*.pt`, `*.pth`, `*.safetensors`), `*` không khớp slash; pattern không trailing slash so từng thành phần, nếu khớp thư mục thì hậu duệ cũng bị bỏ qua; literal thư mục có trailing slash (`__pycache__/`): bỏ tệp nằm dưới thành phần thư mục ấy, không bỏ file basename `__pycache__`. File path ảo dùng slash được hỗ trợ dù simulator chưa có `cd`/cây thư mục thật. Literal basename không trailing slash cũng khớp thành phần thư mục cùng tên và hậu duệ, như Git. Pattern chỉ basename, một dấu `*` tối đa, và directory literal là subset công bố trong bài.

Không hỗ trợ `!`, `?`, bracket classes, escape/backslash, `**`, pattern chứa slash giữa/đầu, negation, nested `.gitignore`, `.git/info/exclude`, global excludes. Gặp cú pháp này phải lỗi tiếng Việt rõ dòng/pattern và subset được hỗ trợ; không silently ignore hoặc giả vờ áp dụng. `.gitignore` lỗi không được khiến `add` chuyển một phần trạng thái: parse và validate toàn bộ trước mutation. Dấu `#` ở giữa literal là tên bình thường. Chỉ ASCII filename đơn giản trong fixture; reject control characters/path traversal cho assertion contract.

`git add .` bỏ qua file chưa theo dõi bị ignore. Tệp tracked được định nghĩa là có trong HEAD snapshot **hoặc staging**; vẫn được add/status khi khớp ignore. Thêm ignore sau khi staging không tự loại file khỏi staging. `git add <ignored-untracked-file>` lỗi rõ tên file; preflight cả danh sách trước mutation. `git add -f`/`--force` chưa hỗ trợ, báo lỗi rõ; không diễn giải flag thành filename. `ls`/`cat` vẫn thấy/đọc ignored files. `git status` không liệt kê ignored-untracked nhưng vẫn liệt kê thay đổi tracked. Không mở rộng stash semantics trong lát này; nêu rõ stash mô phỏng chưa đảm bảo parity ignored/untracked.

## Chấm trạng thái thật và tương thích

Thêm optional `gitState` vào `GitRunResult`: bản sao chỉ đọc theo kiểu dữ liệu, gồm `initialized`, `workdir`, `staged`, `headSnapshot`, `commits` (message + snapshot). Không xuất RepoState live hoặc cấp setter; không nhận state do learner/client gửi. Snapshot deep-copy cả workdir/staged/HEAD và từng commit snapshot khi trả kết quả; type readonly chưa đủ nếu vẫn dùng chung object. Mọi lookup path dùng own-property (`Object.hasOwn`), không `in` hoặc prototype lookup; map được tạo không prototype hoặc đọc theo own-property. Trả snapshot cả khi lỗi để chẩn đoán nhưng mọi ca có error vẫn fail.

Thêm optional `gitAssertions` có Zod strict vào TestCaseSchema, tối đa 12 assertions/ca, mỗi path tối đa 120 và mỗi content tối đa 500 ký tự; enum hữu hạn: `workdirContent`, `stagedAbsent`, `headContent`, `headAbsent`, `historyAbsent`, `commitMessage`, `headIgnoreProbe`. `headIgnoreProbe` nhận path và boolean `ignored`; grader lấy chính `.gitignore` từ HEAD snapshot, parse bằng bộ matcher subset của engine rồi thử đường dẫn đó như untracked, không chạy lệnh hoặc nhận output learner. Giá trị yêu cầu được schema kiểm theo loại, không dùng expression/eval/regex của tác giả. Schema có path/content trường giới hạn cho mỗi loại; `headIgnoreProbe` bắt buộc `.gitignore` tồn tại trong HEAD, lỗi parse/missing HEAD fail. Tất cả assertions phải đạt; `historyAbsent` xét mọi snapshot trong toàn bộ commits lưu trong state, kể cả commit không còn reachable sau reset/rebase hoặc chuyển nhánh, không chỉ HEAD. `commitMessage` so message của HEAD hiện tại, không search bất kỳ commit cũ. Trường optional giữ ca cũ không assertions nguyên hành vi. `gradeTestCase` cũ bắt buộc fail closed nếu testCase có gitAssertions: caller quên dispatch không được silently so transcript rồi pass; lỗi công khai nêu thiếu Git-state grader, lỗi ẩn chỉ fail. Assertion chỉ hợp lệ bài language git; test catalog chặn bài khác dùng.

Thêm `gradeGitTestCase(testCase, GitRunResult)` dùng cùng shape TestCaseResult; nếu có assertions thì chúng là điều kiện AND bổ sung với so output cũ. Thiếu snapshot fail closed, kể cả output đúng. Nội dung `.gitignore` được chấm bằng semantic probes, không `workdirContent/headContent` exact; cho phép đảo thứ tự, dòng trống/comment và các pattern tương đương trong subset. Chấm positive probes cho `.env`, ba hậu tố checkpoint và directory cache; negative probes cho README, `.gitignore`, `.env.example`, `.pt.txt` và `.pth.md`, để pattern `*` không qua. Kết hợp HEAD semantics, historyAbsent và workdirContent của fixture ngăn lời giải chỉ add README/ignore hoặc xóa file để né. Ca ẩn không trả snapshot/content/lỗi chi tiết; ca công khai trả thông báo tiêu chí sai hữu hạn, không dump workdir. Có thể giữ output check cho phản hồi học tập; tuyệt đối không coi output làm bằng chứng commit.

Frontend CodeRunResult thêm optional gitState cùng type; gitRunner chuyển snapshot từ engine. ProgrammingLessonPage chọn gradeGitTestCase cho git (không stringify state vào output). Server regradeInterpretedSubmission chọn cùng grader cho git; không nhận assertions/state từ body. Rà `apps/dhcb/src/pages/subjects/programming/ProgrammingProjectPage.tsx` và `packages/subject-programming/projectStepTypes.ts`: schema project step dùng test cases thì phải giữ validate/dispatch tương ứng; project không assertions giữ đường cũ. Schema project hiện không nhận language Git và không có project Git đăng ký: lát này không mở thêm language cho project; chặn gitAssertions trên step không phải Git và bảo đảm caller dùng grader cũ fail closed. Catalog validation chặn assertions trên ngôn ngữ khác. Các test helper chấm lessons Git cũng dùng cùng grader để sampleSolution không kiểm theo đường cũ.

## Lát triển khai và file độc quyền

PR A (engine + hợp đồng chấm) là lát nhỏ bắt buộc đầu tiên: `packages/subject-programming/gitSim.ts`, `gitSim.test.ts`, `lessonTypes.ts`, `grading.ts`, `grading.test.ts`, `completionSandboxServer.ts`, `completionSandboxServer.test.ts`, `apps/dhcb/src/lib/gitRunner.ts`, `apps/dhcb/src/lib/codeRunResult.ts`, `apps/dhcb/src/pages/subjects/programming/ProgrammingLessonPage.tsx`, `apps/dhcb/src/pages/subjects/programming/ProgrammingProjectPage.tsx`, `packages/subject-programming/projectStepTypes.ts` và test liên quan. Rà codemap để xác định helper/schema/project consumer trước chốt file set; một agent sở hữu cả interface này, không tách song song schema/grader/runner. Không thêm course ID/catalog.

PR B thay các legacy exact transcript assertions của bài nâng cấp bằng tiêu chí state/semantic; không giữ điều kiện chứa hai dòng ignore theo thứ tự hay bắt c1/commit đầu tiên. Chỉ giữ output check phục vụ phản hồi nếu không bác lời giải đúng. PR B sau A merge: `packages/subject-programming/lessons/p3u11.ts`, test bài Git, storyboard/animation của bài (nếu animation contract đã merge), evidence map và goal checkpoint. Một agent sở hữu nội dung + tests; root cập nhật goal/map tuần tự. Không thêm dependency hay lockfile. Mỗi PR chạy toàn cổng AGENTS, E2E khi learner flow thay đổi.

## Acceptance và ca âm

1. Literal `.env`, wildcard cả ba hậu tố, directory `__pycache__/`: đúng ở root và nested paths; `.env.example`, `a.pt.txt`, `notes.pth.md`, file tên `__pycache__` vẫn eligible. Không phân loại mọi file model tự động ngoài pattern đã khai.
2. `add .` chỉ staging README/.gitignore; commit snapshot không có fixture bị ignore; ignored file còn trong workdir. Status không liệt kê ignored-untracked, ls vẫn liệt kê.
3. Tệp `.env` đã commit trước ignore vẫn hiện sửa đổi và được add; staged trước ignore vẫn vào commit. Lời cảnh báo nội dung phải phù hợp bằng chứng này.
4. Add explicit ignored-untracked lỗi; danh sách README rồi ignored path không staging README một phần. Invalid pattern lỗi không mutate staging. Empty/comment-only ignore giữ hành vi cũ.
5. Thay đổi workdir `.gitignore` chưa staged có hiệu lực; lỗi parse có số dòng. `!`, `**`, `?`, `[ab]`, backslash và `/models/*.pt` bị từ chối rõ.
6. Echo toàn transcript đúng, không init/add/commit: fail. Echo chuỗi snapshot/JSON không tạo state: fail. Chỉ cat ignore/ls: fail. Xóa file ignored để né bài: fail workdirContent. Commit rồi chuyển HEAD/restore không xóa bằng chứng historyAbsent: fail. Thiếu một pattern với fixture tương ứng: fail.
7. Fixture có file `.pt/.pth/.safetensors` root và nested, cùng benign README; đổi tên/nội dung fixture có ca thứ hai; semantic probes trên `.gitignore` đã commit bắt lời giải chỉ add hai file với ignore sai rồi hardcode báo cáo. Giới hạn 12 assertions mỗi ca được chia nhiều ca, tối đa 10 theo schema hiện có; không tăng trần chỉ để gom một ca. Tiêu chí đánh giá cuối không bắt một transcript hay một trình tự lệnh duy nhất.
8. SampleSolution và lời giải tương đương có đảo pattern/comment, add từng file thay add chấm, nhiều commit nhưng HEAD đúng, đều pass. Echo-only, commitMessage đúng ở commit cũ nhưng HEAD sai, HEAD chưa tồn tại và history có file cấm sau reset/rebase đều fail.
9. Browser và server cùng code/fixture cho cùng pass/fail; lỗi hoặc missing gitState fail; server 4.000 ký tự giữ nguyên. Ca cũ không assertions giữ behavior/expected output; p3-u11-l1 sample không tạo ignored files vẫn commit đủ hai file.

## Giới hạn và chuẩn hóa state/path

Path của assertions/probes và key snapshot phải là đường dẫn POSIX tương đối canonical: không slash đầu/cuối, backslash, component rỗng, `.`/`..`, control/NUL hoặc component prototype nguy hiểm; không tự normalise alias để né điều kiện. Tối đa 120 ký tự/path. Kiểm toàn bộ trước lookup; own-property chỉ nhận file tồn tại thực. Bounds cố định cho input và output state: script/chuẩn bị tối đa 4.000 ký tự mỗi phần, tối đa 100 lệnh học viên và 20 lệnh chuẩn bị; tối đa 100 file, nội dung mỗi file 4.000 ký tự, tổng state bytes 128 KiB, tối đa 100 commit, tối đa 100 pattern/ignore file. Fixture authored phải nằm trong trần; vi phạm trả lỗi và fail, không truncate để pass. Kiểm tương thích bên dưới xác nhận trần không bác fixture hiện có; không nới vô hạn. Budget 128 KiB tính toàn trạng thái nội bộ: local/remote commits, stash, workdir/staged/HEAD và metadata; snapshot xuất cũng bị giới hạn. Kiểm budget và số commit sau từng thao tác, kể cả rebase sinh nhiều commit từ một lệnh; preflight trước mutation hoặc rollback trạng thái nguyên tử khi vượt trần. Matcher token hóa literal + một star, escape literal metacharacters hoặc so prefix/suffix trực tiếp; không tạo regex từ pattern learner, không backtracking ngoài kiểm soát. Commit copying/total snapshot budget có tính toàn lịch sử, không chỉ HEAD, để script lặp commit không tạo bộ nhớ không giới hạn. Giới hạn áp dụng ở entrypoint engine browser và server, không chỉ API.

## Fixture và giới hạn shell

Fixture qua `stdinLines` đang được git runner hiểu là `lenhChuanBi`, chạy trước script và không in transcript; chỉ author tạo fixture, không learner API body. Tạo mỗi file bằng một lệnh `echo "noi dung gia" > path` riêng; `.gitignore` nhiều dòng bằng `>` rồi `>>`. Shell hiện không hiểu `\\n` như newline, không heredoc/printf, không nối `&&`/`;`, không shell wildcard expansion. Không dùng bí mật thật hoặc đường dẫn hệ điều hành. Nested file là key chuỗi như `models/checkpoint.pt`; `mkdir`/`cd` chỉ thông báo giới hạn, không tạo cây thư mục. Các ca mới cần khởi tạo kho nhưng không tạo `.gitignore`/commit hộ học viên; giữ fixture bất biến để chấm `workdirContent`, yêu cầu HEAD README đúng và HEAD `.gitignore` semantic. Probe paths là dữ liệu diagnostic do grader sở hữu, không cần tồn tại trong fixture và không thực thi script sau learner.

## Nội dung/hoạt họa và bằng chứng

Bài dùng dữ liệu giả, giải thích Git LFS/object storage là hướng quản lý model lớn ở dự án thật; simulator không hỗ trợ LFS và không đo dung lượng thật. Hoạt họa ba vùng workdir → staging → commit, card `.env/model.pt/model.pth/model.safetensors` dừng ở working tree theo pattern; card tracked cũ đi qua dù ignore để tránh hiểu sai. Có play/pause, replay hữu hạn và giảm chuyển động theo contract PR #1238; màu kèm nhãn, capture sáng/tối desktop/mobile. Không bật/đổi mặc định worker chấm Python.

Bằng chứng hoàn tất lát ghi phiên bản code, test âm chống echo, parity client/server, kết quả gates và capture review; source map chỉ bổ sung evidence mục ignore ở `p3-u11-l1`, giữ EXTEND và trạng thái phần còn thiếu. Rollback revert PR B rồi A nếu cần; không migration/database/production.

## Nguồn hành vi đã kiểm tra

checkedAt: 2026-10-05. [Git gitignore — DESCRIPTION/PATTERN FORMAT](https://git-scm.com/docs/gitignore): ignore dành cho untracked; file tracked không bị ảnh hưởng; pattern không slash đầu/giữa áp dụng ở mọi mức, trailing slash chỉ thư mục, `*` không khớp slash. [Git git-add — DESCRIPTION](https://git-scm.com/docs/git-add): explicit ignored path báo lỗi; thêm toàn thư mục bỏ qua ignored files; Git thật có `-f`. Subset mô phỏng chủ động từ chối force và cú pháp ngoài hợp đồng, nên thông báo phải phân biệt giới hạn mô phỏng với lỗi Git thật.

Nguồn bài được đọc trực tiếp tại [commit cố định](https://github.com/rohitg00/ai-engineering-from-scratch/blob/f6dbae74ef622b78a76df704f86eafcde9f4ef3f/phases/00-setup-and-tooling/02-git-and-collaboration/docs/en.md), checkedAt 2026-10-05; phần ignore checkpoint nằm ở Learning Objectives và Exercises.

## Review và bằng chứng tương thích trước triển khai

- Review độc lập đã yêu cầu và bản này đã chốt: grader cũ fail closed, message tại HEAD, history toàn commit còn lưu, mandatory init/HEAD, paths canonical + own-property, snapshot deep-copy, chấm semantic không ép transcript, matcher/resource bounds. Source implementation vẫn cần codemap và review diff riêng.
- Kiểm kê ngày 2026-10-05 trên baseline `efb5dde`: **17 bài Git, 48 ca Make, 116 script** gồm worked example/Predict/Parsons/starter/Make. Chỉ chạy simulator thuần trong bộ nhớ; không chạy Git hệ điều hành, suite hoặc worker. Tất cả 48 Make sample hiện có chạy không lỗi. Parsons chưa xếp và Predict cố ý lỗi không bị diễn giải thành lỗi limits.

| Chỉ số                            |                  Tối đa hiện có |                      Trần được chốt |
| --------------------------------- | ------------------------------: | ----------------------------------: |
| Script                            |    288 ký tự (`git-u5-l2` Make) |                               4.000 |
| Chuẩn bị nối LF                   |         275 ký tự (`git-u4-l5`) |                               4.000 |
| Lệnh học viên                     | 15 (`git-u5-l2` worked/Predict) |                                 100 |
| Lệnh chuẩn bị                     |             10 (`git-u4-l4/l5`) |                                  20 |
| File mỗi map                      |                               2 |                                 100 |
| Nội dung mỗi file                 |   70 ký tự (`git-u4-l4` worked) |                               4.000 |
| Path                              |                        14 ký tự |                                 120 |
| Local commits                     |                               4 |                                 100 |
| Remote commits                    |                               3 | 100 trong mỗi kho, cùng budget tổng |
| Snapshot xuất JSON UTF-8          |                        469 byte |                             128 KiB |
| Toàn trạng thái nội bộ JSON UTF-8 |                        914 byte |                             128 KiB |

- Không có project Git đăng ký; không mở thêm language vào project trong lát này. Reset/rebase hiện giữ commit cũ trong storage, phù hợp `historyAbsent`; budget phải kiểm cả dữ liệu còn lưu sau các thao tác. Trần trên không bác fixture đã kiểm, nhưng kiểm regression mới vẫn bắt buộc trong PR A/B.
