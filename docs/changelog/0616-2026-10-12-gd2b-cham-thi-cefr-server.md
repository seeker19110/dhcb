# 0616 — GĐ2b: chấm thi cuối cấp CEFR ở server — đặc tả, grandfather kết quả cũ, giọng Nghe ngẫu nhiên

- **Ngày:** 2026-10-12 · **PR:** (xem mô tả PR) · **Loại:** `feat(english)`
- **Đặc tả:** `docs/specs/2026-10-12-gd2b-cham-thi-cefr-server.md` (Approved for implementation —
  chủ dự án mở lại GĐ2b 2026-10-12, gỡ HOÃN 2026-09-12). Khung gốc:
  `docs/specs/2026-09-12-gd2-vip-hoc-tu-do-mon-anh.md` §0.2 + §⑦.
- **Nguồn việc:** chủ dự án: "bắt đầu GĐ2b".

## Phát hiện khi khảo sát mã (quan trọng)

**Lõi GĐ2b đã có trong mã từ 2026-10-10** nhưng **không ai ghi lại**: PR
[#1320](https://github.com/seeker19110/dhcb/pull/1320) (tiêu đề `feat(programming): hạ tầng dự án
trục T2/T3`) mang theo `/api/cefr-assessment` + `apps/server/src/api/_lib/cefrAssessment.ts` +
hợp đồng `core-contracts/cefrAssessment.ts` + `CefrExam.tsx` lấy đề từ server + 10 test đơn vị +
E2E `audit-cefr-assessment.spec.ts`, và `progress.ts` chuyển sang đọc sổ thi server
(`platform.feature_state`, feature `cefr_assessment_v1`). Mô tả PR và changelog `0571` không nhắc
tới; `PROGRESS.md` vẫn ghi "⛔ HOÃN". Đợt này KHÔNG viết lại phần đó — chỉ trả lời năm câu hỏi
thiết kế §⑦, vá hai lỗ #1320 để lại và đồng bộ tài liệu.

## Vấn đề (hai lỗ #1320 để lại)

1. **Mất quyền của người đã thi đạt theo cách cũ.** Sổ server bắt đầu rỗng; luật mở cấp chỉ đọc
   sổ đó + grandfather đóng băng từ `0077` (2026-09-12). Ai thi đạt A1 (client chấm, cột
   `english.learning_progress.cefr_exams`) từ 2026-09-12 → 2026-10-10 bị khoá lại A2 đang học —
   hồi tố, phá bất biến GĐ2a §⑤. Tệ hơn: POST `/api/progress` ghi
   `cefr_exams = sổ server` nên cột cũ bị ghi đè ở lần đồng bộ kế tiếp.
2. **Mất giọng Nghe ngẫu nhiên** (đặc tả bài thi mục ③ N2 chống học vẹt theo 1 giọng): hợp đồng
   server không có `audioVoice`, `CefrExam.tsx` phát bằng giọng toàn cục cố định.

## Đã làm

- **Migration `0095_cefr_exams_legacy_grandfather.sql`:** suy cấp L(n+1) từ mọi mục
  `passed = true` còn trong cột `cefr_exams` cũ, cộng (union) vào `cefr_unlocked_grandfathered`.
  Cố ý KHÔNG đọc bản chụp `cefr_unlocked`: người VIP có đủ 6 cấp trong đó, đóng băng là phát quyền
  vĩnh viễn cho VIP sắp hết hạn (phá tiêu chí 6 GĐ2a). Lũy đẳng (`is distinct from`), bỏ qua giá
  trị rác (`jsonb_typeof`), chỉ thêm — không đổi schema. Dòng `README.md` migration.
- **Giọng Nghe ngẫu nhiên:** `randomVoice()` xuất khẩu từ `lib/cefrExam.ts`; `CefrExam.tsx` gắn
  cho từng câu `listening` ngay khi nhận đề server (giọng không ảnh hưởng chấm nên không cần server
  chọn). 2 test mới.
- **Chú thích** đầu `lib/cefrExam.ts` + `CefrExam.tsx` nói đúng hiện trạng (trước còn ghi "client
  lưu + chấm, đồng bộ Supabase"). `saveExamAttempt` ghi rõ chỉ test dựng dữ liệu còn dùng.
- **Đặc tả** `2026-10-12-gd2b-cham-thi-cefr-server.md`: bảng liệt kê đủ thành phần #1320 đã đưa
  vào + bảng quyết định năm câu hỏi §⑦ + giới hạn đã biết.
- **`PROGRESS.md`:** bảng Ưu tiên 1b mục 2b ⛔ HOÃN → ✅; ghi chú HOÃN thay bằng tóm tắt quyết định.

## Quyết định

| Câu hỏi §⑦                 | Chốt                                                                                                                                                                     |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Nguồn đề                   | Bộ đề tĩnh trên server (đã chốt 2026-09-12). Đo kho thật: mọi cấp đủ 24 câu (ngữ pháp thấp nhất C2 = 20, hội thoại ≥3 dòng thấp nhất C1/C2 = 6).                         |
| Chống xem trước            | `start` không trả `correct` (đã có, test canh).                                                                                                                          |
| Trần thi lại               | **Không thêm trần ngày** — 24 câu × 4 phương án, đạt ≥ 70 % ⇒ đoán mò ≈ 10⁻⁷/lượt; đề là bài học người đó đã hoàn thành nên "dò" không cho gì chưa có. Giữ 10 lượt/phút. |
| Đang thi dở lúc deploy     | Lượt nằm trong DB, hạn 60 phút; `start` lại trả đúng lượt đang mở (đã có, test canh).                                                                                    |
| Offline/PWA                | Chấp nhận mất thi offline cho người đã đăng nhập (đánh đổi chủ dự án chốt khi mở lại GĐ2b). Bài xếp lớp vẫn tại máy.                                                     |
| Kết quả thi cũ (phát sinh) | Grandfather qua `0095`; chấp nhận giữ cả bài "đạt" giả trước 2026-10-10 (cùng đánh đổi `0077`).                                                                          |

## Giới hạn đã biết

- Dòng đã đồng bộ `/api/progress` sau 2026-10-10 → cột cũ đã bị ghi đè, `0095` không cứu được;
  có người thật phản ánh thì tra backup trước ngày đó.
- Đề là dữ liệu công khai: script tra JSON vẫn trả lời đúng được — cùng nợ 🟡 "Kiểm tra hiểu hội
  thoại CEFR" chờ chủ dự án quyết đổi kiến trúc dữ liệu.
- Không chụp Tầng 8b: không đổi pixel nào.

## Bằng chứng kiểm chứng

Chạy ở máy sau `npm ci` (2026-10-12):

- `npm run typecheck` ✅ · `npm run lint` ✅ (0 cảnh báo) · `npm run build` ✅ · Prettier ✅.
- `vitest` liên quan: `cefrExam.test.ts` (+2 ca `randomVoice`) · `ExamCallers.s08.test.tsx` ·
  `cefrAssessment.test.ts` (10 ca server của #1320) · `changelog.test.ts` → **74/74**; toàn bộ
  `npm test` chạy qua hook pre-commit.
- `npm run check:specs` ✅ (180 đặc tả, không thiếu đường dẫn) ·
  `scripts/check-progress-freshness.sh` ✅ · `npm run codemap -- impact lib/cefrExam.ts` → chỉ THÊM
  export, không đổi chữ ký.
- Kho đề đo thật bằng script đọc `cefr/curriculum/dialogues.json`: A1→C2 ngữ pháp
  180/140/150/140/33/20 câu, hội thoại ≥3 dòng 18/15/17/17/6/6, từ vựng 916–3243 — đủ 24 câu/cấp.
- Migration `0095` không chạy được ở máy (không có Postgres); CI `sql-prepare` áp trên Postgres 16.
