# Đặc tả: Hội thoại CEFR — server CHẤM LẠI kiểm tra hiểu (bằng chứng "đã học" do server ghi)

**Trạng thái:** Approved for implementation — chủ dự án duyệt hướng "chất lượng cao nhất"
2026-10-09, giao qua coordinator (đợt `0555`), là phần "còn mở" của nợ `PROGRESS.md` "[S11-1 …
0548] Hội thoại CEFR: 'đã học' mới có bằng chứng ở MÁY, server chưa chấm lại".

**Nền:** đợt `0548` (`docs/specs/2026-10-09-hoi-thoai-cefr-bang-chung-da-hoc.md`) thêm kiểm tra
hiểu 3 câu tất định; đạt thì CLIENT gọi `markDialogueLearned` ghi `learned|<owner>:<titleEn>` vào
mảng `et_cefr_dialogue_<uid>` rồi `/api/progress` hợp nhất UNION lên cột `cefr_dialogues`. Server
chưa từng thấy bài làm — sửa localStorage (hoặc POST thẳng `/api/progress`) là "đã học" cả cấp.

---

## 0. Một câu

Lượt nộp kiểm tra hiểu hội thoại CEFR (cả chiều A lẫn B) được **server chấm lại** từ lựa chọn thô

- seed bằng **đúng hàm sinh đề của giao diện**, và **chỉ server** được ghi "đã học".

## ① Phạm vi

**LÀM:**

- **Một hàm, hai nơi chạy.** `buildComprehensionQuiz`/`gradeComprehension`/`comprehensionSeed` dời
  từ `apps/dhcb/src/lib/dialogueComprehension.ts` sang gói dùng chung
  `packages/subject-english/dialogueComprehension.ts` (kiểu hội thoại khai CẤU TRÚC
  `ComprehensionDialogue` vì `packages/` không được import `apps/`). File cũ ở app chỉ còn
  `export *` để mọi import trong app giữ nguyên. Thêm `regradeComprehension(dialogue, dir, seed,
answers)` cho server: dựng lại đề, id câu lạ/trùng → `QUIZ_MISMATCH`, thiếu câu = sai.
- **Nguồn dữ liệu — KHÔNG nhân đôi.** Server đọc ĐÚNG file `apps/dhcb/public/data/dialogues.json`
  (file giao diện fetch qua `/data/dialogues.json`) bằng đường dẫn cố định tính từ `process.cwd()`,
  validate Zod, cache RAM (`packages/subject-english/dialogueData.ts`). Lý do chọn cách này thay vì
  dời file vào `packages/`: (1) đã có tiền lệ chạy thật trên VPS — `dictionaryData.ts` (từ điển) và
  `_lib/cefrAssessment.ts` (bài thi cấp, đọc CHÍNH file này) đều đọc `apps/dhcb/public/data` theo
  cwd; (2) dời file sẽ phải đổi đường fetch + manifest dữ liệu PWA + hai e2e đang chặn
  `**/data/dialogues.json` mà không thêm lợi ích nào; (3) file 247 KB, nạp một lần là đủ.
- **Endpoint:** `POST /api/learning/evidence?action=cefr-dialogue` — cùng handler "bằng chứng" S11
  (đi qua cùng CORS, rate limit theo IP, `validateAuth`), xử lý ở
  `apps/server/src/api/_lib/cefrDialogueCheck.ts`. Đạt ngưỡng → ghi `"<owner>:<titleEn>"` +
  `"learned|<owner>:<titleEn>"` vào `english.learning_progress.cefr_dialogues` kiểu UNION (không
  migration), cộng thưởng "ngày có học thật" như `/api/progress` (fail-open).
- **Chống gian lận / dò đáp án:** schema `.strict()` (không có chỗ cho `correct`/`passed`); giới
  hạn **6 lượt nộp/phút theo TÀI KHOẢN** (thêm vào 60/phút theo IP); **mỗi lượt (seed) chỉ chấm MỘT
  lần** trong 24 giờ (bộ đếm Redis `consumeWindowCounter`, khoá băm SHA-256) — đáp án đúng chỉ trả
  về SAU khi lượt đã bị tiêu, nên nộp bừa để xem đáp án rồi nộp lại đúng lượt đó nhận 409. Ghi DB
  lỗi → trả lại lượt (`resetCounter`).
- **`/api/progress` lọc bỏ `learned|…` do client đẩy lên.** Bản đã có trong DB giữ nguyên (merge
  UNION với `existing`) → dữ liệu cũ không bao giờ bị hạ cấp.
- **Client:** `apps/dhcb/src/lib/dialogueCheckClient.ts` (`submitDialogueCheck`, không bao giờ ném,
  trả union kết cục). `DialogueComprehensionCheck` gửi lượt nộp, hiện kết quả THEO SERVER (đúng/sai
  từng câu lấy `correctId` server trả); prop `onPassed` đổi thành `onVerified` — chỉ gọi khi server
  trả `passed && saved`. `markDialogueLearned` bị XOÁ; thay bằng `recordServerVerifiedDialogue`
  (chỉ phản chiếu kết quả server vào kho máy để mục lục hiện ngay, KHÔNG đẩy đồng bộ).
- **Số lượt bắt đầu ngẫu nhiên** (0…2³¹−1) mỗi lần mở màn kiểm tra: vì server chỉ chấm mỗi lượt
  một lần, mở lại màn không được quay về lượt 0 đã dùng.

**KHÔNG LÀM:**

- Không migration, không bảng mới, không ghi vào `platform.completion_evidence/_state` (bảng đó
  của STEM, `subject_id` chỉ nhận 4 môn STEM) — đúng ràng buộc giao việc.
- Không đổi `progressSync.ts` (luồng đồng bộ cloud giữ nguyên). Bản `learned|…` client 0548 ghi
  vào máy mà CHƯA kịp đẩy lên server (offline trong cửa sổ từ khi #1291 chạy tới khi đợt này chạy)
  sẽ chỉ còn ở máy đó, không lên server nữa — xem ⑤ "giới hạn".
- Không giấu đáp án khỏi trình duyệt: đề sinh tất định từ dữ liệu công khai, ai đọc mã vẫn tự tính
  được đáp án. Mục tiêu đợt này là **chặn khai suông** ("đã học" không nhờ chấm) và **chặn dò qua
  máy chủ**, không phải chống người đọc mã nguồn — kiểm tra hiểu ngắn sau khi xem, không phải bài
  thi.
- Không đụng `.github/workflows/*`, `e2e/a11y*.spec.ts`, cấu hình lint/coverage; không thêm thư
  viện; không sửa prompt AI.

## ② Điểm chạm

| Việc | Đường dẫn file                                                 | Ghi chú                                                        |
| ---- | -------------------------------------------------------------- | -------------------------------------------------------------- |
| Thêm | `packages/subject-english/dialogueComprehension.ts`            | Dời từ app + `regradeComprehension`                            |
| Thêm | `packages/subject-english/dialogueData.ts`                     | Server đọc `dialogues.json` (Zod, cache)                       |
| Thêm | `packages/subject-english/dialogueData.test.ts`                | Nạp dữ liệu · cùng seed cùng đề (139 × A/B × 3) · chấm lại     |
| Sửa  | `packages/subject-english/tsconfig.json`                       | `references` → `core-contracts`                                |
| Thêm | `packages/core-contracts/cefrDialogueCheck.ts`                 | Zod vào/ra, mã lỗi, khoá `learned\|…`                          |
| Thêm | `apps/server/src/api/_lib/cefrDialogueCheck.ts`                | Chấm lại + rate limit + lượt một lần + ghi UNION               |
| Sửa  | `apps/server/src/api/learning/evidence.ts`                     | Rẽ nhánh `?action=cefr-dialogue`; action lạ → 400              |
| Thêm | `apps/server/src/api/learning/evidence.cefrDialogue.test.ts`   | Auth, Zod, rate limit, đúng/sai/thiếu/seed khác, 409, 500      |
| Sửa  | `apps/server/src/api/core/progress.ts`                         | Lọc `learned\|…` client đẩy lên                                |
| Sửa  | `apps/server/src/api/core/progress.test.ts`                    | Lọc bản mới · giữ bản cũ · không cộng thưởng nhờ khai          |
| Sửa  | `apps/dhcb/src/lib/dialogueComprehension.ts`                   | Chỉ còn `export *` từ gói                                      |
| Sửa  | `apps/dhcb/src/lib/dialogueComprehension.test.ts`              | Thêm test "app re-export đúng hàm của gói"                     |
| Thêm | `apps/dhcb/src/lib/dialogueCheckClient.ts`                     | Gửi lượt nộp, union kết cục                                    |
| Thêm | `apps/dhcb/src/lib/dialogueCheckClient.test.ts`                | 200/hợp đồng sai/mạng/401/429/409×2/500                        |
| Sửa  | `apps/dhcb/src/lib/cefrProgress.ts`                            | Xoá `markDialogueLearned`, thêm `recordServerVerifiedDialogue` |
| Sửa  | `apps/dhcb/src/lib/cefrProgress.test.ts`                       | Phản chiếu không đẩy đồng bộ                                   |
| Sửa  | `apps/dhcb/src/components/DialogueComprehensionCheck.tsx`      | Gửi server, hiện theo server, lời nhắn "chưa lưu" từng ca      |
| Sửa  | `apps/dhcb/src/components/DialogueComprehensionCheck.test.tsx` | Hành vi mới                                                    |
| Sửa  | `apps/dhcb/src/components/CefrLessonViews.tsx`                 | `onPassed` → `onVerified`                                      |
| Sửa  | `apps/dhcb/src/pages/subjects/english/CefrLevelPage.tsx`       | `onVerified` → `recordServerVerifiedDialogue` + `bump()`       |

**Ảnh hưởng lan ra (theo `npm run codemap -- impact apps/dhcb/src/lib/cefrProgress.ts`):** mục lục
CEFR (`cefrOutline`), thẻ "Tiến độ theo môn", cây ý định, `resumePoint` — đều chỉ ĐỌC
`getLearnedDialogues`, không đổi. `progress.ts` là đường đồng bộ của mọi tiến độ môn Anh — thay đổi
chỉ chạm mảng `cefrDialogues` và chỉ bỏ phần tử có tiền tố `learned|`.

## ③ Hợp đồng dữ liệu

**Vào** (`DialogueCheckInputSchema`, `.strict()`):

```ts
{
  ownerId: string // /^[a-z0-9-]{2,64}$/ — khoá của dialogues.json
  titleEn: string // 1..200
  direction: 'A' | 'B'
  attempt: number // int 0..2_147_483_647
  answers: {
    questionId: string
    optionId: string
  }
  ;[] // 1..3; id câu /^(meaning|next-line|speaker)-\d{1,3}$/, id phương án /^(o[0-3]|A|B)$/
}
// seed = comprehensionSeed(ownerId, titleEn, direction, attempt)  — y hệt client
```

**Ra 200** (`DialogueCheckResultSchema`):

```ts
{
  correct: number
  total: number
  required: number
  passed: boolean
  saved: boolean // server ĐANG giữ "đã học" sau request này (mới ghi hoặc có từ trước)
  items: {
    questionId: string
    chosenId: string | null
    correctId: string
    correct: boolean
  }
  ;[]
}
```

**Lưu trữ:** `english.learning_progress.cefr_dialogues` (jsonb mảng chuỗi), thêm phần tử chưa có
bằng `cefr_dialogues || (phần tử mới không nằm trong mảng)` — không ghi đè, kể cả khi dòng vừa
được tạo chen giữa; `version + 1` để `/api/progress` của thiết bị khác thấy xung đột và kéo bản gộp.

**Ca lỗi:**

| Tình huống                                  | Mã lỗi                                        | Hành vi mong đợi (server · giao diện)                                                           |
| ------------------------------------------- | --------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Chưa đăng nhập / phiên hết                  | 401                                           | Không chấm · "Chưa lưu: phiên đăng nhập đã hết…" (kết quả chấm tại máy)                         |
| Quá 6 lượt/phút/tài khoản (hoặc 60/phút/IP) | 429 + `Retry-After: 60`                       | Không chấm, không tiêu lượt · "Chưa lưu: bạn nộp hơi nhanh…" + nút Gửi lại                      |
| Body sai schema / field lạ                  | 400                                           | Không chấm                                                                                      |
| `?action=` lạ                               | 400 `BAD_ACTION`                              | Không rơi nhầm sang luồng STEM                                                                  |
| Không có hội thoại (owner, titleEn)         | 400 `CONTENT_NOT_FOUND`                       | Giao diện: "Chưa lưu: máy chủ đang gặp lỗi…"                                                    |
| Hội thoại quá ngắn                          | 400 `NO_QUIZ`                                 | (Giao diện vốn không cho làm — "chưa kiểm tra được")                                            |
| Id câu lạ/trùng (dữ liệu hai bên lệch)      | 409 `QUIZ_MISMATCH`                           | Không tiêu lượt · "Chưa lưu: nội dung hội thoại vừa được cập nhật. Tải lại trang…"              |
| Lượt (seed) đã chấm                         | 409 `ATTEMPT_USED`                            | Không lộ gì thêm · "lượt này đã được nộp trước đó… Bấm Làm lại"                                 |
| Redis không sẵn sàng (production)           | 503 `SERVICE_UNAVAILABLE` + `Retry-After: 60` | Fail-closed: không chấm, không ghi · "Chưa lưu: máy chủ tạm bận…" + Gửi lại (không bắt Làm lại) |
| Ghi DB lỗi                                  | 500                                           | Trả lại lượt (reset bộ đếm) · "Chưa lưu: máy chủ đang gặp lỗi…" + Gửi lại                       |
| Cộng thưởng lỗi                             | (200)                                         | Fail-open, "đã học" đã commit                                                                   |
| Mất mạng                                    | —                                             | "Chưa lưu: mất kết nối… Kiểm tra mạng rồi bấm Gửi lại" (gửi lại đúng bài đó)                    |
| Chưa đăng nhập (khách)                      | — (không gọi server)                          | Chấm tại máy · "Bạn đã đạt, nhưng cần đăng nhập để lưu tiến độ."                                |

Kết quả chấm tại máy LUÔN kèm hậu tố "· chưa lưu" ở dòng điểm; chữ "ĐÃ HỌC" chỉ xuất hiện khi server
trả `passed && saved`.

## ④ Tiêu chí chấp nhận

- [x] Cùng seed ⇒ client và server cùng đề: mọi hội thoại thật × A/B × 3 lượt, đề dựng từ dữ liệu
      server nạp == đề dựng từ đúng JSON client fetch; app re-export ĐÚNG tham chiếu hàm của gói —
      `npx vitest run packages/subject-english/dialogueData.test.ts apps/dhcb/src/lib/dialogueComprehension.test.ts`.
- [x] Server chấm: đúng hết / 2/3 đạt; 1/3 không; thiếu câu = sai; seed khác → 409 không tiêu
      lượt; chiều B chấm theo đề B; đạt → ghi UNION đúng hai khoá, userId lấy từ token —
      `npx vitest run apps/server/src/api/learning/evidence.cefrDialogue.test.ts`.
- [x] Handler: 401 trước mọi thứ; 429 theo tài khoản không tiêu lượt, log không chứa userId/tên;
      Zod từ chối field lạ/kiểu sai; lượt đã chấm → 409 không kèm đáp án; khoá bộ đếm là bản băm;
      ghi DB lỗi → 500 + trả lại lượt — cùng lệnh trên.
- [x] `/api/progress` lọc `learned|…` mới từ client, giữ bản cũ trong DB, không cộng thưởng nhờ
      khai — `npx vitest run apps/server/src/api/core/progress.test.ts`.
- [x] Client: gửi lựa chọn thô + seed; `onVerified` chỉ khi server `passed && saved`; đánh dấu theo
      `correctId` của server; 7 ca "chưa lưu" nói đúng lý do, "Gửi lại" chỉ ở lỗi tạm; khách không
      gọi server; `cefrProgress` không còn `markDialogueLearned` —
      `npx vitest run apps/dhcb/src/components/DialogueComprehensionCheck.test.tsx apps/dhcb/src/lib/dialogueCheckClient.test.ts apps/dhcb/src/lib/cefrProgress.test.ts`.
- [x] SQL tĩnh mới PREPARE được trên schema thật — `npm run check:sql` (Postgres 16 local, đủ
      migration); câu UNION chạy thật: giữ phần tử cũ, thêm phần tử mới, `version + 1`.
- [x] Tầng 8b: ảnh 1440 + 390 × blue-sky + dark-blue màn kết quả đạt / chưa đạt / mất mạng (chiều A) + đạt chiều B 390.

**Lệnh chứng minh:**

```bash
rm -rf packages/*/dist dist dist-server && npm run typecheck && npm run lint && npm run build
npx vitest run packages/subject-english apps/server/src/api/learning apps/server/src/api/core/progress.test.ts \
  apps/dhcb/src/lib/dialogueCheckClient.test.ts apps/dhcb/src/lib/cefrProgress.test.ts \
  apps/dhcb/src/lib/dialogueComprehension.test.ts apps/dhcb/src/components/DialogueComprehensionCheck.test.tsx
DATABASE_URL=… npm run check:sql
npm run check:specs && npm run audit:prose -- --ci
```

## ⑤ Bất biến không được phá

| Bất biến                                                         | Test nào canh nó                                           |
| ---------------------------------------------------------------- | ---------------------------------------------------------- |
| Client không tự phong "đã học" (không còn hàm ghi; progress lọc) | `DialogueComprehensionCheck.test.tsx` · `progress.test.ts` |
| Client và server cùng một đề với cùng seed                       | `packages/subject-english/dialogueData.test.ts`            |
| "Đã học" cũ trong DB không bao giờ bị hạ cấp                     | `progress.test.ts` · câu SQL UNION (`cefrDialogueCheck`)   |
| Đáp án chỉ trả về sau khi lượt bị tiêu; mỗi lượt chấm một lần    | `evidence.cefrDialogue.test.ts`                            |
| Không log PII (userId, tên hội thoại, đáp án)                    | `evidence.cefrDialogue.test.ts`                            |
| Không tốn lượt AI                                                | hàm thuần, không import `core-ai`                          |

**Mức bảo vệ của đợt này (ghi rõ sau rà soát bảo mật độc lập):** đợt này CHỐNG được hai đường
gian lận phổ biến — **sửa localStorage** và **POST giả** (`/api/progress` mảng `learned|…` bịa, hoặc
nộp bừa lên endpoint chấm để dò đáp án). Đợt này **KHÔNG chống người đọc mã có chủ ý**: seed do
client chọn, đề dựng được từ `dialogues.json` công khai + thuật toán công khai, và server trả
`correctId` sau khi chấm. Phương án chặn cả trường hợp này — **seed do server cấp (HMAC, TTL, dùng
một lần) + không gửi `correctId` về client** — ghi thành nợ "cần chủ dự án quyết" trong
`PROGRESS.md` (đánh đổi: thêm một vòng gọi server trước khi làm bài, và mất lời giải sau khi nộp vốn
có chủ đích sư phạm).

**Giới hạn đã biết (trung thực):**

- Đáp án tính được từ dữ liệu công khai + mã nguồn công khai — server chặn khai suông và dò qua
  máy chủ, không chặn người tự chạy thuật toán. Lời giải hiện sau khi nộp (có chủ đích sư phạm),
  nên ai cố học thuộc theo id câu qua nhiều lượt vẫn làm được — rate limit 6/phút làm việc đó chậm.
- Bản `learned|…` do client 0548 ghi lúc offline và chưa từng lên server: còn hiện "đã học" ở chính
  máy đó (client hợp nhất UNION khi kéo), nhưng không lên server và không sang máy khác. Cửa sổ
  rủi ro là thời gian giữa deploy #1291 và deploy đợt này (cùng ngày).
- Production cần Redis sẵn sàng: Redis hỏng thì cả rate limit lẫn bộ đếm lượt đều từ chối — vẫn
  fail-closed, nhưng trả **503 `SERVICE_UNAVAILABLE`** (hàm ba trạng thái
  `consumeWindowCounterStatus` trong `packages/core-auth/security.ts`), KHÔNG giả làm 429/409, để
  người học thấy "máy chủ tạm bận" và Gửi lại thay vì bị bắt Làm lại. Ghi DB lỗi mà không trả lại
  được lượt (`resetCounterChecked` = false) → `console.warn` tiền tố `[cefr-dialogue]`, khoá đã băm.

## ⑥ Quy ước dự án liên quan

- Import xuyên gói `@dhcb/<gói>/<file>` không đuôi `.js`; trong gói dùng tương đối có `.js`;
  `packages/` không import `apps/` (vì vậy kiểu hội thoại khai cấu trúc trong gói).
- Handler tự kiểm `validateAuth()`; `user_id` LUÔN lấy từ token; Zod cho mọi body.
- Câu chữ mới hai chiều (A tiếng Việt, B tiếng Anh), trạng thái bằng CHỮ không chỉ màu; màu qua
  lớp/token sẵn có (`border-emerald-500/60`, `border-amber-500/60` như đợt 0548).
- Câu SQL tĩnh mới → `npm run check:sql`.

---

## Nghiệm thu

Xem `docs/changelog/0555-2026-10-09-hoi-thoai-cefr-server-cham-lai.md`.
