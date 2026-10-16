# Nghiên cứu nâng cấp DHCB từ stored

Ngày 16/10/2026. Trạng thái: **Đề xuất nghiên cứu**, chưa phải đặc tả được duyệt triển khai.

DHCB nên ưu tiên độ tin cậy của bộ đánh giá AI, khả năng truy nguyên chi phí từng lượt và an
toàn của ngữ cảnh truy xuất. Kho `stored` cung cấp nhiều cơ chế phù hợp, nhưng DHCB đã có
nền tảng tương đương ở nhiều chỗ. Giá trị lớn nhất hiện tại là khép các khoảng trống có thể
kiểm chứng trong nền tảng hiện hữu.

## Phạm vi và mốc mã nguồn

- [stored tại `332cfec0`](https://github.com/seeker19110/stored/tree/332cfec0d0cbe115603d48f230e5a37f49e4e9b9),
  cập nhật ngày 16/10: đếm trực tiếp `data/projects.json` được **483 mục thuộc 23 nhóm**.
  Đây là số hồ sơ trong catalog, không phải số dự án đã được thử tích hợp. Đọc sâu các nhóm
  07, 10, 12, 14, 16 và 23.
- [DHCB main tại `3bdf9617`](https://github.com/seeker19110/dhcb/tree/3bdf9617ac1764f2307e9f31fc1265c6b8943f09),
  commit ngày 13/10: đối chiếu source, test, CI, `CLAUDE.md`, `PROGRESS.md`, `PROJECT.md` và
  nghiên cứu kiến trúc liên quan. Workspace của phiên nghiên cứu vẫn ở `1b797587` ngày
  27/09; bản main mới được đọc trong checkout tạm, không cập nhật checkout của người dùng.
- Các kết luận về cấu trúc/hành vi source là **static-assertion**, trừ phép thử bộ eval
  được mô tả riêng bên dưới. Trạng thái triển khai và số đo người học không được suy ra từ
  việc source đã merge.

## Những nền tảng DHCB đã có

| Cơ chế                                                              | Bằng chứng trên main                                                                                         | Hệ quả khi chọn nâng cấp                                                                      |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| Bản đồ import/lời gọi, tra ảnh hưởng, phát hiện chu trình           | `scripts/codemap.ts`, `scripts/lib/scanGraph.ts`; CI chạy `codemap -- cycles`                                | Graphify/codegraph chỉ đáng thử khi có nhu cầu cụ thể vượt khả năng codemap                   |
| Ký ức có consent, phiên tạm, truy xuất lai FTS + cosine + RRF       | `packages/core-personal/memoryRetrieval.ts`, `contextEngine.ts`; GĐ2a/GĐ2b trong `PROGRESS.md`               | Đo chất lượng truy xuất trước khi đổi kho ký ức hoặc thêm vector database                     |
| Công cụ đọc và công cụ tạo đề xuất, validation và giới hạn vòng lặp | `companionTools.ts`, `packages/core-ai/anthropicToolLoop.ts`: tối đa 4 bước công cụ, 6 lần thi hành, 45 giây | Giữ ranh giới quyền hiện tại khi bổ sung quan sát hoặc bộ lọc nội dung                        |
| An toàn khủng hoảng và kiểm câu trả lời cuối                        | `safetyGuard.ts`, `finalAnswerChecks.ts`                                                                     | Kiểm thử prompt injection cần xác định rõ hành vi cần chặn; lớp khủng hoảng có nhiệm vụ riêng |
| Đếm token thật theo provider/model/mode/ngày                        | `packages/core-ai/aiTokenUsage.ts`                                                                           | Bổ sung liên kết theo lượt để giải thích chi phí của vòng công cụ và fallback                 |
| Red-team và kiểm quyền trên Postgres thật, không gọi AI trong CI    | `scripts/red-team/eval-red-team.ts`, `scripts/eval-v2-permissions.ts`, `.github/workflows/ci.yml`            | Bổ sung bằng chứng về phản hồi của model, tiếp tục giữ cổng kiểm quyền hiện hữu               |

Nguồn đối chiếu:
[CI](https://github.com/seeker19110/dhcb/blob/3bdf9617ac1764f2307e9f31fc1265c6b8943f09/.github/workflows/ci.yml),
[trạng thái Companion](https://github.com/seeker19110/dhcb/blob/3bdf9617ac1764f2307e9f31fc1265c6b8943f09/PROGRESS.md#tiếp-theo),
[nghiên cứu nâng cấp ngày 13/10](https://github.com/seeker19110/dhcb/blob/3bdf9617ac1764f2307e9f31fc1265c6b8943f09/docs/research/2026-10-13-goi-y-nang-cap.md).
Việc ghim GitHub Actions theo SHA và rút gọn `CLAUDE.md` đã được xử lý; không đưa lại vào
danh sách việc mới.

## Phát hiện ưu tiên sửa trước

### Bộ eval ký ức có thể báo thành công khi có ca sai

[`scripts/eval-v2-memory.ts:69–80`](https://github.com/seeker19110/dhcb/blob/3bdf9617ac1764f2307e9f31fc1265c6b8943f09/scripts/eval-v2-memory.ts#L69)
tính `overallAccuracy` và in từng ca sai, nhưng điều kiện thoát thành công chỉ xét
`falseMemoryRate < 0.05 && correctionRate === 1.0`. Một số sai lệch không làm thay đổi hai
chỉ số đó. Khi tập fixture rỗng, các giá trị mặc định của hai chỉ số cũng thỏa điều kiện
thành công; đây là nhận xét từ source, chưa thử trường hợp rỗng.

Đã chạy một **negative control cô lập của chính runner**, trên Node **22.23.2**:

1. Transpile nguyên source runner sang CommonJS, thay `import.meta.url` bằng URL file tương
   ứng và chạy trong `node:vm`.
2. Thay duy nhất dependency `evaluateMemoryCandidate` bằng nguồn kết quả giả; cho 30 ca
   trả kết quả mong đợi làm đối chứng.
3. Lượt thứ hai chỉ ép `conf-accept-1` trả `REJECT` thay vì `ACCEPT`.

| Lượt thử runner                | Số ca đúng do runner đếm | Mã thoát runner | Kết luận runner                           |
| ------------------------------ | ------------------------ | --------------- | ----------------------------------------- |
| Đối chứng với kết quả giả đúng | 30/30                    | 0               | Passed thresholds                         |
| Ép một kết quả sai             | 29/30, 96,67%            | **0**           | **Passed thresholds**, dù đã in ca Failed |

Phép thử chứng minh bộ tổng hợp kết quả bỏ lọt một lỗi đã biết. Nó **không đo độ đúng của
memory service**, không chạy Postgres và không gọi provider. Đây là bằng chứng
`faithful-fixture` cho hành vi runner, không phải kết quả chất lượng AI hay dữ liệu thật.

Đợt sửa nhỏ nhất: làm mọi sai lệch của fixture tất định khiến runner thoát khác 0, chặn tập
rỗng/thiếu nhóm bắt buộc và thêm test negative control kiểm mã thoát. Giữ các ngưỡng an toàn
hiện có. Có thể học trực tiếp cách tổng hợp của
[`scripts/lib/redTeamScoring.ts`](https://github.com/seeker19110/dhcb/blob/3bdf9617ac1764f2307e9f31fc1265c6b8943f09/scripts/lib/redTeamScoring.ts).

### Ngưỡng chi phí theo ngày hiện là cảnh báo

Trong
[`aiTokenUsage.ts:115`](https://github.com/seeker19110/dhcb/blob/3bdf9617ac1764f2307e9f31fc1265c6b8943f09/packages/core-ai/aiTokenUsage.ts#L115),
`AI_DAILY_BUDGET_USD` được kiểm sau khi ghi usage và chỉ tạo log vượt ngưỡng. Cơ chế này
không tự chặn lời gọi tiếp theo. Giới hạn lượt của gói và giới hạn bước/thời gian của vòng
công cụ vẫn là các cơ chế khác đang có.

Vì thế cần gọi đúng tên là **ngưỡng cảnh báo**, và đo chi phí theo lượt trước khi chọn
chính sách dừng. Nếu cần trần tiền cứng, phải có đặc tả riêng về dự trù trước lời gọi,
đồng thời, retry/idempotency và đối soát usage; thay đổi giá trị cảnh báo không tạo ra trần
chi tiêu cứng.

## Năm hướng nâng cấp phù hợp

| Thứ tự | Cơ chế từ stored                                                  | Phần nên áp dụng vào DHCB                                                                                                                     | Tiêu chí nghiệm thu đề xuất                                                                                                                                   |
| ------ | ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1      | Nhóm 07: negative control, claim matrix, record/replay; Promptfoo | Sửa cổng eval ký ức trước; sau đó bổ sung fixture phản hồi provider cho cùng prompt builder, parser, guardrail và vòng công cụ production     | Tập rỗng, ca hỏng và vi phạm hard gate đều làm cổng đỏ; CI chặn mạng ngoài và không có key AI; fixture gắn commit/cấu hình                                    |
| 2      | Nhóm 07: tracing kiểu Langfuse; nhóm 03/21: ngân sách vòng lặp    | Gắn mã lượt và các chặng phân loại an toàn → định tuyến → truy xuất → model/công cụ → fallback; nối token, thời gian và kết quả của mỗi chặng | Từ một lượt mẫu truy được các lời gọi và chi phí tương ứng; usage thiếu được đánh dấu; lỗi exporter không làm hỏng lượt học                                   |
| 3      | Nhóm 12: guardrails input/retrieval/execution/output              | Mở rộng các ca gián tiếp qua ghi chú, ký ức, kết quả công cụ và nhiều lượt; kiểm cả chữ stream lẫn câu trả lời cuối                           | Các ca đã định nghĩa không lộ canary, không đọc chéo người, không ghi authoritative state khi chưa có quyền; đối chứng bỏ lớp phòng thủ phải bắt được vi phạm |
| 4      | Nhóm 10: RAG và quản trị ký ức                                    | Đo trên corpus câu hỏi–ký ức tiếng Việt/Anh có nhãn liên quan; so FTS với FTS + vector hiện có, giữ cùng snapshot và ngân sách ngữ cảnh       | Báo Recall@k/MRR, độ trễ, lỗi embedding; kiểm consent, ký ức bị thay thế/hết hiệu lực và fallback; ngưỡng chất lượng chốt sau baseline                        |
| 5      | Nhóm 14: đo từng chặng của hội thoại giọng nói                    | Đo thời gian đến âm thanh nghe được, ngắt lời, reconnect và fallback trên pipeline hiện tại; dùng kết quả để chọn POC Pipecat/LiveKit nếu cần | Có phân phối p50/p95 và mẫu số trên thiết bị/mạng đã định nghĩa; giữ đủ hai chiều Việt ⇄ Anh, giới hạn phiên và usage                                         |

Các tiêu chí trong bảng là **đề xuất nghiệm thu**, chưa phải kết quả đã đạt.

### Cách áp dụng công cụ với phạm vi nhỏ

**Promptfoo:** hỗ trợ custom provider bằng JavaScript/TypeScript. Có thể bọc đường gọi hiện
có để quản lý tập thử và so sánh phiên bản, sau khi bộ runner hiện hữu đã chặn lỗi đúng.
Record/replay nên đặt ở biên HTTP/provider và chạy tiếp logic ứng dụng thật. Cache của công
cụ không đảm bảo CI chạy offline: phải chủ động cấm mạng và báo lỗi khi thiếu bản ghi.
Replay kiểm tính tương thích với phản hồi đã lưu; chất lượng của model phiên bản mới vẫn
cần eval trực tiếp được duyệt ngân sách. Nguồn:
[custom provider](https://www.promptfoo.dev/docs/providers/custom-api/),
[cơ chế cache](https://www.promptfoo.dev/docs/configuration/caching/).

**Langfuse:** phù hợp khi cần xem trace qua nhiều chặng. Nên bắt đầu bằng hợp đồng telemetry
nhỏ và dữ liệu tổng hợp cần thiết. Nội dung hội thoại, ghi chú, audio, token xác thực và
thông tin nhận dạng cần được loại khỏi payload trước khi xuất. Langfuse có masking phía
SDK; tự host còn cần thêm các thành phần như ClickHouse, Redis và blob storage, nên phải
tính tài nguyên vận hành. Nguồn:
[masking](https://langfuse.com/docs/observability/features/masking),
[hạ tầng tự host](https://langfuse.com/self-hosting/deployment/infrastructure/containers).

**NeMo Guardrails/LLM Guard:** giữ làm ứng viên nếu tập thử cho thấy bộ lọc nội dung hiện tại
chưa đủ. Đo cả báo động nhầm với bài học hợp lệ và độ trễ tiếng Việt. Schema hợp lệ không
chứng minh nội dung an toàn; bộ phân loại nội dung cũng không cấp quyền thực thi. Theo
[OWASP](https://cheatsheetseries.owasp.org/cheatsheets/LLM_Prompt_Injection_Prevention_Cheat_Sheet.html),
cần kết hợp phân tách dữ liệu, quyền tối thiểu, kiểm đầu ra và giám sát.

DHCB đã có ca `rt-ag-12` kiểm thẻ dữ liệu giả trong ghi chú. Điểm cần mở rộng là hành vi
của model khi đọc nội dung đó. Ngoài ra,
[`streamCompanionTurn`](https://github.com/seeker19110/dhcb/blob/3bdf9617ac1764f2307e9f31fc1265c6b8943f09/packages/core-personal/companionRuntime.ts#L1199)
phát delta trước bước finalize: việc kiểm câu trả lời cuối không tự chứng minh mọi nội
dung đã stream trước đó được kiểm tương tự. Cần ca kiểm quan sát riêng hai đường này;
chưa kết luận có rò rỉ trong production.

**Pipecat/LiveKit:** học cách phân rã độ trễ trước khi thay transport. Pipecat có kiểu dữ
liệu riêng cho TTFB, thời gian đến âm thanh nghe được và thời gian xử lý. Không lấy số đo
TTFB ở server làm toàn bộ độ trễ người học cảm nhận; các sự kiện đầu/cuối cần được đo trên
cùng đồng hồ hoặc có phương án đồng bộ rõ ràng. Nguồn:
[mã metrics Pipecat](https://github.com/pipecat-ai/pipecat/blob/main/src/pipecat/metrics/metrics.py).

## Những tích hợp nên để sau

- **Graphify/codegraph:** codemap đã có đồ thị và cổng chu trình. Chỉ thử một công cụ khi
  chứng minh được nhu cầu còn thiếu, chẳng hạn giải thích quan hệ đa ngôn ngữ; đo thời gian
  tìm điểm sửa và độ đúng của cạnh suy diễn trước khi thêm dependency.
- **Engram/Mem0/Graphiti thay kho ký ức:** DHCB vừa có truy xuất lai, consent và cơ chế duyệt
  ký ức. Riêng [Engram](https://github.com/Gentleman-Programming/engram) hướng tới coding
  agent, giữ bộ nhớ SQLite cục bộ và có Git Sync. Có thể đánh giá riêng cho công việc lập
  trình; dữ liệu người học cần tiếp tục đi qua ranh giới quyền của sản phẩm.
- **Framework đa agent mới, local LLM/GPU và tự fine-tune:** chưa có số đo trong đợt này
  chứng minh lợi ích đủ lớn so với chi phí vận hành. Vòng công cụ hiện tại có thể được đo
  và cải thiện từng phần trước.
- **Đổi hệ UI hoặc thêm animation engine:** nghiên cứu này chưa có bằng chứng quan sát
  người học/thiết bị để chọn thay đổi giao diện. Giữ các cổng AA/AAA hiện hữu cho mọi đợt
  triển khai UI tiếp theo.

## Đề xuất bước tiếp theo

Bắt đầu bằng sửa cổng eval ký ức và bổ sung negative control. Sau đó ưu tiên truy nguyên
chi phí từng lượt và bộ fixture về nội dung gián tiếp/streaming, rồi mới chọn có cần thêm
Promptfoo hay backend tracing bên ngoài. Mỗi thay đổi tính năng cần đặc tả được duyệt theo
quy trình dự án; chính sách dừng chi phí, lưu trace và thử provider có phí cần được chốt
trong đặc tả tương ứng.

Song song với chất lượng kỹ thuật, dùng phễu học và phản hồi người học hiện có để chọn nơi
cần đi sâu. Không suy diễn kết quả retention hay hiệu quả học tập từ việc thêm công cụ.

Đợt nghiên cứu chỉ thêm tài liệu này. Không thay source, phụ thuộc, migration hoặc cấu
hình vận hành; không chạy provider trả phí hay truy cập dữ liệu production.
