# Đặc tả GĐ2b — Chấm thi cuối cấp CEFR ở SERVER (bịt nốt lỗ `cefrExams`)

**Trạng thái:** Approved for implementation — chủ dự án mở lại GĐ2b 2026-10-12 ("bắt đầu GĐ2b"),
gỡ quyết định HOÃN 2026-09-12. Khung gốc: `docs/specs/2026-09-12-gd2-vip-hoc-tu-do-mon-anh.md`
§0.2 + §⑦ (năm câu hỏi thiết kế để ngỏ). Nền kỹ thuật đã có: PR GĐ2a
(`docs/changelog/0290-*.md`) và mẫu "server cấp lượt, giữ đáp án, chấm lại" của hội thoại CEFR
(`docs/specs/2026-10-09-hoi-thoai-cefr-seed-server-cap.md`).

---

## 0. Một câu

Đề thi cuối cấp do **server dựng từ bộ đề tĩnh**, trả cho trình duyệt **không kèm đáp án**, server
**chấm và ghi sổ thi**; `/api/progress` **không còn tin** `cefrExams` client gửi lên — sửa
localStorage hay POST thẳng "đã đạt C2" không mở được cấp.

## 0.1. Phát hiện khi khảo sát mã (2026-10-12) — ĐỌC TRƯỚC

**Phần lõi của GĐ2b ĐÃ NẰM TRONG MÃ từ 2026-10-10**, đi lẫn trong PR
[#1320](https://github.com/seeker19110/dhcb/pull/1320) `feat(programming): hạ tầng dự án trục
T2/T3` — mô tả PR và changelog `0571` **không nhắc một chữ** tới việc này, `PROGRESS.md` vẫn ghi
GĐ2b "⛔ HOÃN". Những gì #1320 đã đưa vào (đã có test đơn vị + E2E):

| Thành phần                                                                              | Nội dung                                                                                                                                                                                         |
| --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `apps/server/src/api/_lib/cefrAssessment.ts`                                            | `buildServerExam` dựng 24 câu (8 từ vựng · 8 ngữ pháp · 4 nghe · 4 đọc) từ `apps/dhcb/public/data/{cefr,curriculum,dialogues}.json`; `assessCefr` mở lượt / chấm trong transaction, `for update` |
| `apps/server/src/api/subjects/english/cefr-assessment.ts`                               | `POST /api/cefr-assessment` (`validateAuth`, 10 lượt/phút/tài khoản, Zod `.strict()`)                                                                                                            |
| `packages/core-contracts/cefrAssessment.ts`                                             | hợp đồng: `start` trả `attemptId · expiresAt · questions` (KHÔNG `correct`); `submit` trả `pct · passed · correctAnswers · result · cefrUnlocked`                                                |
| `platform.feature_state` (feature `cefr_assessment_v1`)                                 | sổ thi do server chấm: `{ exams: { A1: {passed,bestPct,attempts,lastAt} }, attempt? }` — không migration mới (bảng có từ `0058`)                                                                 |
| `apps/server/src/api/core/progress.ts`                                                  | GET/POST đều đọc `readVerifiedCefrExams` (sổ server) để tính `cefrUnlocked`; `cefrExams` client gửi bị vứt                                                                                       |
| `apps/dhcb/src/components/CefrExam.tsx` + `cefrAssessmentApi.ts`                        | trình duyệt lấy đề từ server, nộp lựa chọn thô, hiện kết quả server trả                                                                                                                          |
| `apps/server/src/api/_lib/cefrAssessment.test.ts` · `e2e/audit-cefr-assessment.spec.ts` | 10 ca server (giấu đáp án, cấp khoá, token người khác, hết hạn, nộp đồng thời, rollback) + E2E 3 theme × 2 khổ                                                                                   |

Đợt này (changelog `0615`) **không viết lại** phần đó. Việc còn lại: (1) trả lời đủ năm câu hỏi §⑦
và ghi quyết định; (2) vá hai lỗ hổng #1320 để lại (mất quyền của người đã thi đạt theo cách cũ;
mất giọng Nghe ngẫu nhiên); (3) đồng bộ tài liệu/`PROGRESS.md`.

## ① Năm câu hỏi §⑦ — quyết định

| #   | Câu hỏi §⑦                        | Quyết định                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Đề sinh ở đâu                     | **Bộ đề tĩnh trên server** (chủ dự án chốt sẵn 2026-09-12, `PROGRESS.md`): server đọc cùng ba file JSON giao diện dùng, xáo trộn bằng `shuffle` của `core-contracts`. Không AI sinh đề. Đã đo kho mỗi cấp đủ 24 câu: ngữ pháp 180/140/150/140/33/20 câu, hội thoại ≥3 dòng 18/15/17/17/6/6, từ vựng ≥ 916 (A1→C2).                                                                                                                                                                                                                     |
| 2   | Chống xem trước đáp án            | `start` trả `CefrAssessmentQuestion` **không có `correct`**; đáp án nằm trong `feature_state.attempt` server. Test "start giấu correct" canh.                                                                                                                                                                                                                                                                                                                                                                                          |
| 3   | Chống thi lại vô hạn để dò đáp án | **Không thêm trần ngày** ngoài 10 lượt/phút/tài khoản. Lý do đo được: đề 24 câu × 4 phương án, đạt ≥ 70 % ⇒ đoán mò đạt ≈ 10⁻⁷/lượt (khác hội thoại 3 câu ≈ 25 %/lượt phải trần 5/ngày). Còn "học thuộc đáp án qua thi lại": đề lấy từ CHÍNH bài học người đó đã hoàn thành (điều kiện dự thi 100 % ngữ pháp), đáp án vốn mở cho họ — dò không mang lại gì chưa có. Script tra JSON công khai vẫn làm được, cùng giới hạn đã ghi ở nợ 🟡 "Kiểm tra hiểu hội thoại CEFR" — chờ chủ dự án quyết đổi kiến trúc dữ liệu, KHÔNG thuộc GĐ2b. |
| 4   | Người đang thi dở lúc deploy      | Lượt thi nằm trong DB (`feature_state.attempt`, hạn 60 phút), không nằm trong RAM tiến trình: deploy/restart không mất; `start` cùng cấp + chiều khi lượt cũ chưa chấm, chưa hết hạn → **trả lại đúng lượt cũ** (test "retry cùng đề đang mở"). Đổi dữ liệu đề giữa chừng → đề cũ vẫn chấm theo đáp án đã lưu trong lượt.                                                                                                                                                                                                              |
| 5   | Offline/PWA                       | **Chấp nhận mất thi offline** cho người đã đăng nhập — đây là đánh đổi chủ dự án đã cân nhắc khi hoãn và nay chốt làm. Thực tế từ #1320 đã vậy. Giao diện nói rõ "Chưa tải được đề thi" + Thử lại; bài xếp lớp (`Placement.tsx`) vẫn chạy tại máy vì không cấp quyền gì.                                                                                                                                                                                                                                                               |

**Kết quả thi cũ (câu hỏi thứ sáu, phát hiện khi rà):** sổ server bắt đầu rỗng; mọi bài đạt theo
cách cũ (client chấm, cột `english.learning_progress.cefr_exams`) từ 2026-09-12 (sau `0077`) đến
2026-10-10 **mất quyền mở cấp sau**, và cột cũ bị ghi đè bằng sổ server ở lần đồng bộ kế tiếp.
→ Migration `0094` grandfather (xem §③). Chấp nhận giữ cả bài "đạt" giả mạo trước 2026-10-10 —
cùng đánh đổi `0077` đã chấp nhận; lỗ đóng từ nay về sau.

## ② Phạm vi đợt 0615

**LÀM:**

- Migration `0094_cefr_exams_legacy_grandfather.sql`: suy cấp L(n+1) từ mọi mục `passed = true`
  còn trong `cefr_exams` cũ, cộng vào `cefr_unlocked_grandfathered`. Chỉ dựa cột `cefr_exams`,
  KHÔNG dựa bản chụp `cefr_unlocked` (VIP có đủ 6 cấp — đóng băng là phát quyền vĩnh viễn, phá
  tiêu chí 6 GĐ2a). Lũy đẳng.
- Giọng Nghe ngẫu nhiên (mục ③ N2 của đặc tả bài thi): `CefrExam.tsx` gắn `audioVoice:
randomVoice()` cho câu `listening` của đề server (server không chọn giọng vì giọng không ảnh hưởng
  chấm). `randomVoice` xuất khẩu từ `lib/cefrExam.ts` + test.
- Chú thích đầu file `lib/cefrExam.ts`/`CefrExam.tsx` nói đúng hiện trạng (trước nói client lưu +
  chấm). `postgres/migrations/README.md` thêm dòng `0094`. `PROGRESS.md` đóng mục 2b. Changelog
  `0615`.

**KHÔNG LÀM:**

- Không đổi hợp đồng `/api/cefr-assessment`, không đổi `buildServerExam`, không thêm trần ngày.
- Không giấu `correctAnswers` sau khi chấm: màn kết quả cần "= đáp án" + "Mở lại bài" để học lại
  (giá trị sư phạm > rủi ro dò, theo lý do #3).
- Không chuyển bài xếp lớp lên server; không đụng `cefr-dialogue` (nợ riêng).
- Không xoá `saveExamAttempt` (chỉ test dựng dữ liệu còn gọi) — ghi chú là mã test-only.
- Không chụp Tầng 8b: đợt này không đổi pixel nào (chỉ gắn giọng TTS + chú thích).

## ③ Điểm chạm

| Việc | Đường dẫn file                                               | Ghi chú                                         |
| ---- | ------------------------------------------------------------ | ----------------------------------------------- |
| Thêm | `postgres/migrations/0094_cefr_exams_legacy_grandfather.sql` | grandfather từ cột `cefr_exams` cũ              |
| Sửa  | `postgres/migrations/README.md`                              | dòng `0094`                                     |
| Sửa  | `apps/dhcb/src/lib/cefrExam.ts`                              | export `randomVoice`, chú thích đúng hiện trạng |
| Sửa  | `apps/dhcb/src/lib/cefrExam.test.ts`                         | 2 ca `randomVoice`                              |
| Sửa  | `apps/dhcb/src/components/CefrExam.tsx`                      | gắn giọng ngẫu nhiên câu Nghe                   |
| Sửa  | `PROGRESS.md`                                                | đóng 2b, ghi quyết định                         |

**Ảnh hưởng lan ra (codemap `impact`):** `lib/cefrExam.ts` được `Placement.tsx`, `listening.ts`,
`cefrProgress.ts`, `achievements.ts`… import — chỉ THÊM một export, không đổi chữ ký nào.

## ④ Tiêu chí chấp nhận

1. Dòng `learning_progress` có `cefr_exams = {"A1":{"passed":true,…}}` và grandfather `[]` → sau
   `0094`: grandfather `["A2"]`; chạy lại migration → không đổi. Dòng VIP có `cefr_unlocked` đủ 6
   cấp nhưng `cefr_exams = {}` → grandfather KHÔNG đổi. Giá trị rác (`cefr_exams` không phải
   object, `passed` không phải boolean true) → bỏ qua, không lỗi. (CI `sql-prepare` áp migration
   trên Postgres 16.)
2. Đề server có câu `listening` → sau khi tải, mỗi câu Nghe có `audioVoice` ∈ `VOICE_OPTIONS`
   (test `randomVoice`; `ExamCallers.s08.test.tsx` vẫn xanh).
3. Thân `start` không chứa `correct`; `/api/progress` POST với `cefrExams` giả không đổi
   `cefrUnlocked` — test có sẵn từ #1320 giữ nguyên xanh.
4. Cổng: typecheck · lint · prettier · vitest liên quan · `check:specs` (mọi đường dẫn §③ tồn tại).

## ⑤ Bất biến không được phá

| Bất biến                                                        | Test canh                                                                |
| --------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Client không bao giờ nhận `correct` trước khi nộp               | `cefrAssessment.test.ts` "start giấu correct"                            |
| Chỉ sổ server quyết `cefrUnlocked`; `cefrExams` client bị vứt   | `progress.test.ts` + `cefrAssessment.test.ts` "chỉ đọc namespace server" |
| Không ai mất quyền đã có (grandfather chỉ TĂNG)                 | migration `0094` lũy đẳng, `computeUnlockedLevels` union                 |
| VIP hết hạn bị khoá lại đúng lúc (không đóng băng bản chụp VIP) | `0094` không đọc `cefr_unlocked`                                         |
| Mỗi lượt chấm một lần, nộp đồng thời không tăng `attempts` kép  | `cefrAssessment.test.ts`                                                 |

## ⑥ Giới hạn đã biết (trung thực)

- Dòng đã đồng bộ `/api/progress` trong 2026-10-10 → ngày chạy `0094` đã bị ghi đè cột cũ —
  không cứu được từ migration; cần tra backup trước 2026-10-10 nếu có người thật phản ánh.
- Đề là nội dung bài học công khai: script đọc JSON tra được đáp án (như nợ hội thoại CEFR).
  Server-side chỉ chặn "bịa kết quả" và "tự chấm", không chặn "biết đáp án".
- `buildServerExam` không ưu tiên từ đã thuộc như `buildExam` cũ — chấp nhận (đề công bằng hơn).
- Mất thi offline cho người đã đăng nhập (quyết định #5).

## ⑦ Quy ước dự án liên quan

CLAUDE.md mục 4.2 (logic nhạy cảm ở server), 4.9 (ca biên, idempotency), mục 8–11 cổng và PR;
`docs/specs/2026-09-12-gd2-vip-hoc-tu-do-mon-anh.md` §⑤ (bất biến "không ai mất quyền đã có").
