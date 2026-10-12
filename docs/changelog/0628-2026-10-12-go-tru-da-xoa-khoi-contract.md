# 0628 — Gỡ trụ đã xoá (career/startup/life) khỏi 6 contract + 5 service, dùng chung `pillarDomain.ts`

- **Ngày:** 2026-10-12 · **PR:** #1390 · **Loại:** `refactor(personal)`
- **Nguồn việc:** nợ (4) trong mục red-team của `PROGRESS.md` (lộ ra ở changelog `0624`); chủ dự án
  chốt "theo khuyến nghị, không cần người xác nhận".

## Vấn đề

Ba trụ Career · Startup · Life đã gỡ hẳn 2026-09-20 (CLAUDE.md mục 1), nhưng các tính năng Companion
vẫn nhận và SINH ra ba giá trị đó:

- Modal Nhật ký phản tỉnh còn nút "💼 Sự nghiệp", "🚀 Khởi nghiệp", "🌱 Đời sống & Thói quen".
- Module mặc định của Neural Curriculum có `targetDomain: 'career'`.
- Subconscious đặt `targetDomainFocus: 'career'` và sinh giả thuyết "mục tiêu sự nghiệp".
- Proactive Agent sinh nhắc nhở với `domain: 'life'`.
- Ambient Vision ép kiểu kết quả AI bằng `as` mà không kiểm (AI trả gì cũng lọt).

Ở 6 contract (`metacognitiveReflection`, `proactiveAgent`, `neuralCurriculum`, `subconscious`,
`ambientContext`, `proactiveBriefing`), mỗi nơi tự chép một enum 5 trụ.

## Đã làm

1. `packages/core-contracts/pillarDomain.ts` (mới): `PILLAR_DOMAINS = learning · work · general`,
   `PillarDomainSchema` đổi giá trị trụ cũ về `general` khi parse (không từ chối),
   `normalizePillarDomain` cho đường đọc dữ liệu cũ, nhãn tiếng Việt.
   `actionCanvas.ts` (khuôn gốc, changelog `0485`) nay trỏ về đây.
2. 6 contract dùng chung schema đó. Riêng `proactiveBriefing` bỏ ba trụ khỏi enum, vì đây chỉ là
   phản hồi server, không lưu.
3. Service:
   - phản tỉnh: bỏ câu hỏi sự nghiệp/khởi nghiệp, câu hỏi "đời sống" chuyển thành miền `general`;
   - Proactive: `life` → `general`;
   - Subconscious: `career` → `learning`/`general`, viết lại câu giả thuyết;
   - Neural Curriculum: module mặc định → `work`;
   - Ambient Vision: kết quả AI đi qua `normalizePillarDomain`, không còn `as`.
4. Đọc dữ liệu cũ không lỗi:
   - module Neural Curriculum trong `platform.feature_state` được parse qua contract nên tự đổi về `general`;
   - bài phản tỉnh lưu cũ đi qua `toPublicReflection`, nay chuẩn hoá `domain`;
   - API `daily_prompt` dùng schema thay cho chuỗi `if` thủ công: link cũ `?domain=career` → `general`.
5. Giao diện: modal phản tỉnh còn 3 nút: "🎓 Học tập & Ngôn ngữ", "📝 Ghi chú & Công việc",
   "🌱 Bản thân & Thói quen". Kiểu ở các API phía client trỏ về `PillarDomain`.
6. Dọn thêm hai chỗ tìm thấy khi soát:
   - `scripts/protocol-check.ts`: `pillar` còn `learning · work · platform`; chỉ một đặc tả dùng, giá trị `learning`;
   - test `companionRuntime` còn khẳng định "trụ career nạp read model" → chỉ còn `work`.

## Bằng chứng

- **Đỏ-trước:** chạy test API mới trên handler bản cũ → `× GET daily_prompt: trụ đã xoá
(career/startup/life) → general` (bản cũ trả nguyên `career`).
- **Tầng 8b:** ảnh modal ở 1440px + 390px, theme Blue sky, trước/sau. Chụp bằng script Playwright tạm
  ngoài repo, mock đăng nhập + API như E2E.
  - Trước: 5 nút gồm "💼 Sự nghiệp", "🚀 Khởi nghiệp", "🌱 Đời sống & Thói quen".
  - Sau: 3 nút, không tràn hay vỡ bố cục ở 390px.
- Test mới: `pillarDomain.test.ts` (schema, chuẩn hoá, nhãn); bản ghi phản tỉnh cũ mang `career` →
  `general`; module Neural Curriculum cũ mang `career` → `general`; câu hỏi phản tỉnh không nhắc trụ
  đã xoá.

## KHÔNG làm

- Các chỗ `career` mang nghĩa KHÁC, không phải trụ, giữ nguyên:
  - lĩnh vực mục tiêu đời sống (`0050_life_foundation.sql`, `decisionRecord`, `lifeSynthesis`);
  - từ khoá nhận diện câu hỏi trong `companionRuntime` (đã về `general` ở `0624`).
- Không sửa dữ liệu trong CSDL: chuẩn hoá lúc đọc, giống khuôn `actionCanvas` (`0485`).
