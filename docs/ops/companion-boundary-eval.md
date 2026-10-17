# Eval ranh giới Companion — S04 stored

Runner `eval:companion:boundary` kiểm các ranh giới bằng service production trên dữ liệu
tổng hợp, Postgres disposable và HTTP cục bộ. Đặc tả [S04 đã duyệt](../specs/2026-10-16-stored-s04-injection-stream.md);
corpus `scripts/companion-boundary-corpus.json` được version hóa cùng source. Schema v1
đòi tối thiểu1.874 ca bên cạnh đủ47recipe, ID/control/group hợp lệ; `--corpus` không được
bớt biến thể để báo xanh trên một tập nhỏ hơn sàn.

## Chuẩn bị và chạy

Dùng Node22, dependency từ `npm ci`, Postgres16 đã áp migration của checkout. Trước khi
chạy local, xác minh container/port thuộc phiên kiểm thử của mình; URL loopback và tên DB
không tự chứng minh máy chủ đó là disposable. Runner chỉ SELECT preflight, không tự migrate.

Profile `stored-local` nhận đúng port56543 và DB `dhcb_stored_test`; `github-ci` nhận
port5432/DB `dhcb` khi cả `CI=true` và `GITHUB_ACTIONS=true`. Host chỉ `localhost`,
`127.0.0.1` hoặc `[::1]`, credential phải explicit; query/fragment/socket/URL override và
PG defaults không được nhận. Ví dụ sau chỉ dùng credential của DB kiểm thử riêng:

```bash
STORED_EVAL_DATABASE_URL=postgres://postgres:postgres@127.0.0.1:56543/dhcb_stored_test \
  npm run eval:companion:boundary -- \
  --profile stored-local --artifacts /tmp/dhcb-stored-boundary
```

CI chạy cùng CLI trong `sql-prepare`, sau red-team54/permissions23; artifact được tải lên
kể cả runner thất bại, giữ7 ngày. `quality` phụ thuộc job này. Không chuyển DB local sang
profileCI bằng cách tự đặt hai biến CI để nối một DB khác.

Launcher tạo child với allowlist môi trường trước khi import app/SDK/pg. Không chuyển
provider keys, PG defaults, SDK debug/custom headers, preload hoặc `.env`. Classifier
runtime dùng key giả và một cassette synthetic exact protocol; không có chế độ ghi
cassette hay fallback ra provider. Fetch/TCP guard chỉ cho DB đã validate và HTTP port
do harness cấp; ledger vẫn làm gate đỏ khi runtime nuốt lỗi. Guard này không phải firewall
OS hoặc sandbox cho code tùy ý.

## Đọc kết quả

Corpus có47 recipe/1.874 biến thể: context51, tool97, confirm17, HTTP15, wrapper36,
stream1.658. Trong đó1.692 ca thuần và182 ca có Postgres. Mỗi attack trỏ đối chứng dương;
đối chứng không thấy dữ liệu hợp lệ cũng làm ca tấn công đỏ. Có thêm8 ca runtime
prepare→consentDB→tool session, ghi riêng, không cộng vào1.874.

- Exit0 chỉ khi toàn corpus và runtime8 đạt, không crash/thiếu ca, network ledger0,
  source không đổi, accounting global không đổi sau đóng pool, cleanup có residuals0.
- Exit1: vi phạm, crash hoặc không chứng minh được cleanup/accounting/source. Subset luôn
  `PARTIAL`, kể cả mọi ca đã chọn đều đạt. Không suy full pass từ số ca đã chạy.
- Exit2: cấu hình/corpus/preflight không hợp lệ hoặc không khởi động được child. Lỗi trước
  mutation không được ghi thành kết quả nghiệm thu. Signal/deadline cũng trả nonzero.

Mỗi lượt có thư mục UUID, `report.json` và `manifest.json`; file0600/thư mục0700. Report
ghi sourceHead, workingTreeDirty, source hashes, corpus SHA, từng check/ca, các ca chưa
chạy, runtime ledger, network/accounting và cleanup. Checkoutdirty là bằng chứng local,
không thay CI của commit đã push. Hash lại cùng source khi kết thúc; corpus parse/hash
dùng cùng buffer. Không đưa cookie, key hoặc toàn payload hội thoại vào artifact.

Các ranh giới được kiểm bằng quan sát độc lập: sourceID/type lẫn canary; offered tools;
proposal owner/capability/action/domain/payload/risk/version/status; row memory/fact và
audit thật; retry/concurrent confirm; cookie/CSRF HTTP; wrapper và mọi prefix stream.
Hai input primitive của HTTP bị Express strict JSON parser từ chối bằng HTML400 trước
handler: report giữ bằng chứng parser, không coi đó là kiểm handler hoặc cookie auth.

## Cleanup và khôi phục sau tiến trình bị ngắt

Runner ghi journal trước mutation, chỉ quản lý UUID/email của lượt mình. Cleanup xác
minh và khóa ownership trong transaction, dọn audit của đúng person rồi xóa user theo
cascade; kiểm residuals trên các bảng `person_id`, persons/users và sessions. Không có
global cleanup, TRUNCATE hoặc xóa bảng payment. Bất kỳ ownership mismatch, lỗi ghi
journal, transaction/query hoặc residual đều khiến gate đỏ.

File được write/fsync/rename rồi fsync directory/ancestor. Đây là kiểm syscall; chưa
thử mất điện. Writer timeout10s bị khóa cho các lần write sau; launcher deadline12phút
SIGTERM không đảm bảo finally/cleanup đã chạy. Khi thiếu report hoặc bị kill, trạng
thái cleanup là chưa chứng minh được, không được coi là sạch.

Chỉ dùng manifest local tin cậy do chính lượt đó tạo, sau khi xác minh lại DB/container
và tiến trình cũ đã dừng. Không dùng đường dẫn/IDs lấy từ corpus, HTTP hoặc model:

```bash
STORED_EVAL_DATABASE_URL=postgres://postgres:postgres@127.0.0.1:56543/dhcb_stored_test \
  npm run eval:companion:boundary -- \
  --profile stored-local --artifacts /tmp/dhcb-stored-boundary-recovery \
  --cleanup-manifest /tmp/dhcb-stored-boundary/UUID-CUA-LUOT-CU/manifest.json
```

Lượt khôi phục tạo artifact mới, trả `CLEANUP_COMPLETE`/`CLEANUP_ONLY`; không chạy corpus
và không thể thay kết quả eval. Giữ cả journal cũ lẫn mới để đối chiếu. Nếu ownership
không khớp, dừng xử lý manifest đó; không mở rộng DELETE để ép cleanup xanh.

## Phạm vi bằng chứng và rollback

S09/runtime transport và S10/browser là cổng ngoài corpus. Chạy replay7, bộ
`e2e/companion-transport.spec.ts` và full CI E2E riêng. Các mutation controls phải làm
đúng ca đỏ trong khi đối chứng dương còn hoạt động; mutation hooks chỉ ở harness ngoài
repo, không có cờ bypass trong CLI sản phẩm.

Fixture không đo model có bị dụ thực tế, human golden, ranking vector, acoustic latency
hoặc Nginx/VPS delivery. Clock bounds dùng kiểm metadata DB, không làm benchmark. Trace
mặc định tắt; runner không đổi cấu hình production. Revert PR để gỡ corpus/runner/CI;
không migration hoặc dependency mới. Tiếp tục S05/S06 theo [goal](../goals/2026-10-16-stored-upgrades.md).
