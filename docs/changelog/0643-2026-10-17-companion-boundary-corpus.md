# 0643 — Kiểm chứng ranh giới Companion trên Postgres disposable

- **Ngày:** 2026-10-17 · **PR:** [#1408](https://github.com/seeker19110/dhcb/pull/1408) · **Loại:** `test(companion)`.
- **Goal/spec:** [stored S04](../goals/2026-10-16-stored-upgrades.md), [S04 Approved](../specs/2026-10-16-stored-s04-injection-stream.md), merge #1399.

## Thay đổi

Thêm corpus version hóa với 47 recipe, 1.874 biến thể và oracle độc lập cho ngữ cảnh,
quyền công cụ, xác nhận, HTTP cookie thật, wrapper và từng prefix stream. Mỗi attack
có đối chứng dương; thiếu ca, crash hoặc đối chứng thất bại làm cổng đỏ. Thêm 8 ca
prepare → consent DB → tool session với classifier SDK qua fake HTTP exact protocol.
Cổng mới chạy trong CI `sql-prepare`, lưu report và journal 7 ngày.

Fixture chỉ dùng DB disposable explicit. Journal được ghi trước mutation; cleanup
xác minh own UUID/email trong transaction và kiểm residuals, kể cả sessions. Snapshot
ràng buộc proposal/payload/version, toàn row memory/fact, nguồn, privacy và audit.
Accounting global được kiểm lại sau khi đóng pool và drain query đang chạy.
Source sản phẩm, schema, dependency và lockfile không đổi.

## Kiểm chứng cục bộ

- 11 file/311 test tập trung đạt. Loader regression đỏ trước sửa: file riêng chỉ còn
  1.873 ca nhưng vẫn đủ 47 recipe được chấp nhận. Schema v1 nay giữ sàn 1.874; CLI thật
  từ chối file đó bằng exit 2 trước khi tạo artifact.
- Full PG trên source cuối: **1.874/1.874 + runtime 8/8 đạt**, không crash/thiếu ca hoặc
  vi phạm mạng. 380 own roots dọn sạch; accounting không đổi sau đóng pool; source
  hashes ổn định. Report local `cfa2be2b`, head a47a5c14/checkout dirty; CI exact head
  vẫn bắt buộc. Cleanup-only resume journal đã clean trả `CLEANUP_COMPLETE`, không
  tính lượt 0 ca này thành full pass hoặc proof sau mất điện.
- Ba RAM source mutants chạy đủ 1.874 ca mỗi lượt và exit 1 đúng oracle: bỏ consent
  làm 20 ca đỏ (gồm 5 target đã pin, history controls và cascade); bỏ offered gate
  làm 2 ca đỏ và runtime bắt thêm 7/8; bỏ owner predicate confirm làm 3 service case
  và 1 cookie HTTP case đỏ. Target không crash; đối chứng không chịu tác động đã pin
  còn xanh. Không nói toàn bộ 40 controls xanh dưới mọi mutant. Mỗi lượt giữ cleanup,
  network và accounting sạch; verifier ràng buộc normal baseline/source/corpus/report
  hashes. Mutants nằm ngoài repo, không có cờ bypass trong CLI.
- Full Node22: build/typecheck/lint (0 cảnh báo)/format đạt. **973 file/21.975 unit test
  đạt**, 5 file/35 test skip sẵn có; Vitest 674,01 giây (wall npm 676,62 giây).
  Coverage statements/branches/functions/lines **96,14/92,06/96,91/96,84%**, giữ sàn
  94/90/94/94. Replay 7/7, specs 191 và browser transport 8/8 (13,8 giây) đạt.
- Kiểm tra kiểu dữ liệu sau dọn generated output đạt, exit 0 (123,98 giây). CI exact
  head và mọi check vẫn bắt buộc trước merge.

Lượt full gate đầu được dừng tại coverage để thêm floor regression; lượt chưa hoàn tất
đó không được dùng làm bằng chứng cuối. Full gate sau sửa chạy lại từ đầu. PG run đầu
cũng bắt được harness ép JSON cho raw string/null: Express strict parser trả HTML400.
Adapter chỉ nhận đúng primitive + 400 + text/html; nonJSON khác vẫn crash. Hai ca đó
là bằng chứng parser, không suy thành handler/auth proof.

Review và test oracle còn bắt source ID mất canary, positive rỗng, sai binding/payload/
privacy/source/expiry, extra/duplicate tools, nested JSON, runtime DTO/grant setup,
hash corpus đọc lại, source drift, spawn exit và journal/fsync/timeout. Mock/RAM kiểm
bộ đo, không thay bằng chứng PG hoặc provider thật.

## Giới hạn, rollout và rollback

Corpus có provenance agent_synthetic_review/human NOT_REVIEWED. Chưa đo model mới,
semantic quality, acoustic latency hoặc Nginx. S09/S10 runtime/browser vẫn là cổng
ngoài corpus. TCP/fetch guard không phải OS firewall; clock bounds không là benchmark.
SIGTERM không đảm bảo cleanup sau kill: dùng trusted journal recovery theo [runbook](../ops/companion-boundary-eval.md).
Revert PR để rollback runner/CI, không migration. Backlog 82 cảnh báo CodeQL main tạo
12/10 nằm ngoài lát cắt; PR analysis 0 findings không có nghĩa toàn repo 0 cảnh báo.
