# 0646 — Baseline truy xuất ký ức Việt–Anh

Theo [S05 Approved](../specs/2026-10-16-stored-s05-memory-retrieval-benchmark.md), thuộc
[goal stored](../goals/2026-10-16-stored-upgrades.md). Trước đây eval ký ức đo ingest;
slice này đo ranking bằng `searchMemories` và context cuối bằng `buildContextPackage` thật.
Không đổi thuật toán, trọng số, model/provider, migration, entitlement hoặc usage policy.

## Thay đổi

- Corpus Zod frozen:40query,20 mỗi ngôn ngữ,33positive/7không relevant;26rank memory/29audit.
  Nhãn agent_synthetic_review/humanReview NOT_REVIEWED, chưa quality floor hoặc vector thật.
- CLI Node22 scrub env trước imports, chỉ profile/endpoint database disposable; network guard,
  source/HEAD/corpus pins, UUID journal trước INSERT và cleanup theo đúng run. Không `.env`.
- Hai mode lexical và embedding-error fallback dùng cùng read-only repeatable-read snapshot,
  service-clock now, limit10/budget4000/touchfalse;80observation phải đủ và full ranked parity.
  Fallback dùng rejecting fake40/40, không gọi embedding provider thật.
- Tám context cohort riêng kiểm owner/foreign/no consent/purpose/revoke/expiry/public/ephemeral,
  gồm exact source IDs/content/canary/raw rows/audit/touch. Ghi hay đọc sai đều làm INVALID.
- Work pool đóng trước pool verification/daily snapshot cuối. Cleanup/source/network/accounting
  thiếu hoặc sai làm exit nonzero và canonical metrics null, không bỏ lỗi khỏi mẫu số.
- Bước S05 nằm trong SQLjob CI, quality giữ dependency hiện hữu; artifact nhỏ giữ7ngày cảxanh/đỏ
  để review dữ liệu đo trước merge. Không thay Playwright upload, timeout, thresholds hoặc hooks.

## Bằng chứng tại lượt tích hợp

- Targeted9file/210test đạt. Hai test Node CLI cần header environment Node thay default happy-dom;
  giữ nguyên mọi assertion/runtime source. Log tích hợp đầu và lượt ngắt trước RUN được giữ riêng.
- Actual Postgres disposable: BASELINE_VALID,80observations/8context;26memory/29audit trước/sau ranking
  nguyên vẹn; cleanup0/network0/poolErrors0/daily unchanged sau work pool đóng. Thời gian4,08giây.
- Baseline lexical và rejecting fallback khớp toàn bộ thứ hạng/thành phần score trong cùng run:
  Recall@5=0,712121;Recall@10=0,878788;MRR@10=0,663504. Đây là phép đo trên nhãn tổng hợp,
  không là QUALITY_PASS hoặc chất lượng semantic. Bảy no-relevant vẫn có6–10base candidates;
  không suy thành khả năng nhận biết câu không liên quan.
- Đủ bốn negative controls actual SQL/parity/consent/audit được verifier nguyên byte chấp nhận.
  SQL control đầu bị từ chối đúng vì injector chọn thêm V15 có cùng text V16 nhưng khác sensitivity;
  sửa riêng cap personal của injector ngoài repo, giữ nguyên corpus/scorer/verifier và run forensic.
  Q mới lỗi đúng V01/V16×2 và giữ V15 làm control; không dùng exit1 chung làm detection.
- Review độc lập:1.649 assertions rescore bằng Python và15 probes trên bản sao actual artifacts đạt.
  Raw audit/context/daily không được xuất; các proof này là assertions từ worker/source được pin.
  Snapshot DB sau toàn campaign khớp trước, gồm bốn orphan audit cũ; container đã dừng sau proof.
- Full gate cuối: build/typecheck/lint0warning/format:check/test:coverage/check:specs exit0.
  996 file/22.350 test đạt,5file/35test skip theo cấu hình cũ; coverage96,16/92,09/96,94/96,87%.
  Typecheck sạch trước build;19 source/test/CI pins giữ nguyên. Approved specs191 đạt.
- Review final4 thêm121 assertions và10 strict schema/rescore/RAM-hash checks đạt, không P1/P2.
  Exact-head CI/artifact/CodeQL và merge/deploy còn chờ; chưa nhận goal hoàn tất.

## Vận hành và rollback

Xem [runbook](../ops/memory-retrieval-benchmark.md). Dữ liệu tổng hợp và journal/report đầy đủ
ở artifacts ngoài Git; không commit generated evidence. Nếu tiến trình bị kill, cleanup làunknown
cho tới khi recovery đúng journal hoàn tất; disposable teardown không thay proof cleanup.

Rollback bằng revert tooling/CI step; không migration hoặc thay đổi dữ liệu sản phẩm. Review
corpus/baseline trước chốt floor hoặc đổi retrieval; vector/provider/device thật cần phạm vi và
ngân sách riêng theo đặc tả. Goal còn mở ở instrumentation/measurement S06 và số đo thật.
