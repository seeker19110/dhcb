# S05 benchmark truy xuất ký ức Việt Anh

**Trạng thái:** Approved for implementation — chờ merge trước source.

**Goal:** [Nâng cấp từ stored](../goals/2026-10-16-stored-upgrades.md).

**Người duyệt:** chủ dự án, xác nhận trong chat ngày 2026-10-16; cho phép push/PR/merge/deploy khi CI xanh. Không bao gồm chi phí provider hoặc dữ liệu production.

## Outcome và hợp đồng corpus

So FTS với FTS + cosine/RRF hiện hữu trên cùng snapshot có nhãn liên quan. S01 đo việc
tiếp nhận ký ức; slice này đo ký ức nào phù hợp với câu hỏi. Chưa đổi thuật toán, trọng
số hoặc provider embedding.

- Corpus Zod version 1: người dùng tổng hợp, records, query và relevant IDs. ID duy nhất,
  mọi relevant ID tồn tại, đúng người và còn hiệu lực.
- Tối thiểu 40 query, ít nhất 20 mỗi ngôn ngữ; có/không dấu, diễn đạt lại, không có kết
  quả, sự thật bị thay thế, dữ liệu nhạy cảm và consent.
- Ghi snapshot, now cố định, nguồn nhãn và model/phiên bản vector. Không dữ liệu production.
  Vector tự dựng chỉ dùng kiểm toán học/fallback, không làm chất lượng embedding thực.

## Runner và nghiệm thu

1. Gieo trên Postgres cục bộ disposable, gọi `searchMemories` production; giữ cùng now,
   giới hạn và ngân sách context. Tắt touch recency khi đo để giữ điều kiện giữa các lượt.
2. Báo Recall@5/@10, MRR, số query chấm được/không có relevant/lỗi embedding riêng. Tập
   rỗng, ID trùng hoặc thiếu nhóm làm cổng đỏ; không bỏ ca lỗi để đổi mẫu số.
3. Canary khác người/thiếu consent/bị vô hiệu không tới context cuối. Nếu lọc ở Context
   Engine thì phép đo phải đi qua đúng Context Engine.
4. Embedding hỏng phải có đường chữ hiện hữu và nhãn fallback. Negative control xáo thứ
   tự, bỏ record đúng hoặc bỏ bộ lọc quyền trong test phải bị metric/hard gate bắt.
5. Review baseline/corpus trước khi chốt threshold hoặc thay thuật toán xếp hạng.

Điểm chạm: runner/corpus/test trong `scripts/`, dùng `memoryRetrieval.ts`/`contextEngine.ts`.
Full gate, Postgres cục bộ và cleanup dữ liệu tổng hợp; không migration. CI không gọi
provider có phí. Record vector thực nếu cần là việc riêng phải được duyệt ngân sách/key.
Rollback bằng revert công cụ benchmark; không suy diễn chất lượng model từ vector giả.
