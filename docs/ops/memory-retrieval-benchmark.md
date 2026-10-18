# Benchmark truy xuất ký ức Việt–Anh

Theo [S05 đã duyệt](../specs/2026-10-16-stored-s05-memory-retrieval-benchmark.md). Bằng chứng của lượt tích hợp được cập nhật sau kiểm chứng bên dưới.

Công cụ so đường chữ hiện hữu với fallback khi embedding thất bại trên cùng snapshot.
`BASELINE_VALID` chỉ xác nhận phép đo hợp lệ. Nó không phải chất lượng đạt ngưỡng,
không chứng minh chất lượng semantic và không thay thuật toán/ranking/provider.

## Điều kiện và cách chạy

Dùng Node.js 22 và dependency từ `package-lock.json`. Cần Postgres disposable đã migrate, DSN ở
`STORED_EVAL_DATABASE_URL` trong environment. Profile `stored-local` chỉ chấp nhận
loopback:56543/database `dhcb_stored_test`. Không dùng DATABASE_URL, credential production
hoặc tạo `.env`. Launcher scrub environment trước imports; không gọi worker trực tiếp.

```bash
node --import tsx scripts/eval-memory-retrieval.ts --profile stored-local --artifacts /duong-dan-tuyet-doi/ket-qua
```

Launcher chỉ nhận profile/artifacts/corpus/cleanup-manifest, không có flags chọn subset,
chốt quality floor hoặc bỏ guard. Corpus khác bytes frozen phải thất bại. Không gọi
provider có phí. Giữ artifacts ở vị trí riêng tư, ngoài Git; chứa dữ liệu tổng hợp và
UUID riêng cho lượt kiểm thử.

Trong GitHub Actions, bước benchmark chạy bằng profile `github-ci` trên service
`127.0.0.1:5432/dhcb` của job `sql-prepare`, sau corpus S04. Profile này còn kiểm cả
`CI=true` và `GITHUB_ACTIONS=true`; không dùng để trỏ một database tùy ý. Lỗi benchmark
làm job và `quality` đỏ. Không có tùy chọn bỏ cổng hoặc gọi worker trực tiếp.

Artifact `memory-retrieval-<run_id>-<run_attempt>` giữ báo cáo và journal trong 7 ngày,
cả khi benchmark xanh hoặc đỏ, theo mẫu bằng chứng S04. Báo cáo xanh cần được đọc để
kiểm dữ liệu đo trước merge; đây là artifact benchmark tổng hợp, không phải báo cáo
Playwright. Thiếu artifact là lỗi. Cleanup hoặc upload bị ngắt vẫn phải báo thiếu bằng chứng.

## Cách đọc bằng chứng

Corpus có 40 câu hỏi (20 Việt/20 Anh), 33 câu có ký ức liên quan và 7 câu không có.
Ranking có 80 observation, 40 mỗi mode, cùng now/config/budget4000/limit10/touchfalse
trong transaction read-only repeatable read.
Baseline là FTS có importance/recency/RRF hiện hữu; không gọi là FTS thuần. Fallback dùng
rejecting fake tại provider boundary; phải giữ attempt/error ledger riêng.

Report có Recall@5/@10 và MRR@10, tách ngôn ngữ và nhóm không relevant. Thiếu query,
query_error, sai/thiếu ID, hard guard, parity, audit, cleanup, accounting, source hoặc
network làm run INVALID/nonzero; canonical metrics null, không bỏ ca lỗi khỏi mẫu số.
Hai mode còn phải khớp full ranked IDs và các thành phần score, không chỉ cùng tổng điểm.
Nhãn corpus là `agent_synthetic_review`/`humanReview: NOT_REVIEWED`; vector thật `NOT_MEASURED`.
Review corpus/baseline trước chốt threshold hay thay thuật toán.

Tám nhóm context chạy sau rank transaction, trên fixture riêng: owner active, foreign,
không consent, sai purpose, revoke, expired, public-only, ephemeral. Guard kiểm cả source
ID/type/nội dung và các đối chứng hợp lệ; không chỉ tìm một canary. Fixture ranking gồm
26 memory/29 audit; context gồm 16 person/56 memory/80 audit. Không chỉnh timestamp SQL.

## Dọn dữ liệu và phục hồi

Journal UUID riêng được ghi bền trước INSERT. Cleanup chỉ xóa đúng dữ liệu thuộc run;
residual phải bằng 0, không reset toàn database. Đóng work pool trước khi mở pool xác minh riêng
để so global daily usage, kiểm source/HEAD trước/sau và ledger mạng. Không có bằng chứng
đóng pool/cleanup thì không suy run sạch.

Launcher giới hạn worker 12 phút; SIGTERM/kill không bảo đảm khối finally hoàn tất. Job CI
giới hạn 15 phút và service disposable bị hủy khi job kết thúc. Đây không phải bằng chứng
cleanup thành công: thiếu xác minh cleanup/pool/daily làm run không hợp lệ. Journal là
bằng chứng phục hồi, không phải quyền xóa dữ liệu tùy ý.

Nếu run bị kill hoặc journal báo chưa sạch, review manifest local đúng run rồi phục hồi:

```bash
node --import tsx scripts/eval-memory-retrieval.ts --profile stored-local --artifacts /duong-dan-tuyet-doi/phuc-hoi --cleanup-manifest /duong-dan-tuyet-doi/run-cu/manifest.json
```

Recovery sạch là CLEANUP_COMPLETE/CLEANUP_ONLY, không phải baseline. Không đưa manifest/IDs
của run khác hoặc từ output AI vào cleanup. Không in DSN/password/raw error.

## Kiểm tra bộ đo và giới hạn

Unit test kiểm schema/scorer/orchestration, không thay Postgres thật. Negative control phải
chứng minh lỗi SQL (cả positive và no-relevant), đảo thứ tự một mode, bỏ consent và sai
actor audit đều bị oracle tương ứng bắt; exit1 chung hoặc crash trước target không đủ.
Baseline và đủ bốn negative controls đã chạy Postgres thật khi tích hợp; toàn gate được cập nhật
trong changelog0646. Chưa có floor, nhãn người duyệt hay vector/provider thực; không suy thành
semantic quality PASS. SQL injector cần phân biệt text và sensitivity cap: V15/V16 cùng text
nhưng khác cap. Không sửa verifier để chấp nhận footprint gây lỗi sai target.

Rollback bằng revert công cụ benchmark, không migration hoặc thay đổi sản phẩm.

## Baseline tích hợp ngày 18/10/2026

Lượt cục bộ đã chạy actual Postgres16 trên database disposable, source inventory44 file,
corpus frozen và source/HEAD trước/sau khớp. Cùng80observations và8context đạt; cleanup0,
network0/poolErrors0, daily usage nguyên vẹn sau work pool đóng. Không có provider thật.

| Nhóm | Positive | Recall@5 | Recall@10 |   MRR@10 |
| ---- | -------: | -------: | --------: | -------: |
| Tổng |       33 | 0,712121 |  0,878788 | 0,663504 |
| Việt |       17 | 0,852941 |  0,882353 | 0,882353 |
| Anh  |       16 | 0,562500 |  0,875000 | 0,430977 |

Lexical và embedding-error fallback có cùng full ranked IDs/components trong mỗi snapshot.
Các giá trị trên là quan sát, không ngưỡng chất lượng; CI gieo snapshot/clock/UUID mới và
không bị ép trùng giá trị giữa các run. Nhãn vẫn chưa được người duyệt, semantic NOT_MEASURED.
Bảy no-relevant có6–10base candidates, được báo riêng và không là accuracy nhận diện no-result.
Bằng chứng negative controls và full gate được chốt trong changelog0646 sau khi hoàn tất.

Chín positive query có tối đa10 eligible memories nên Recall@10 ít phân biệt ở nhóm này.
Nhãn E04/R05 cùng các nhãn tổng hợp còn cần người duyệt trước quyết định chất lượng/ranking.
Artifact lưu observations/snapshot/journal và kết luận audit/context/daily/pool; raw database
snapshots của các proof cuối không được xuất. Reviewer có thể tái tính ranking độc lập,
nhưng không thể coi summary này là lần đọc PG độc lập sau CI.
