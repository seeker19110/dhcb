# 0555 — Hội thoại CEFR: server CHẤM LẠI kiểm tra hiểu, chỉ server ghi "đã học" (2026-10-09)

- **Ngày:** 2026-10-09 · **PR:** (chưa tạo — commit trên nhánh worktree
  `feat/hoi-thoai-cefr-server-cham-lai`) · **Loại:** `feat(english)`
- **Đặc tả:** `docs/specs/2026-10-09-hoi-thoai-cefr-server-cham-lai.md` (Approved for
  implementation — giao qua coordinator, hướng "chất lượng cao nhất" chủ dự án duyệt 2026-10-09).
- **Nguồn:** phần "còn mở" của nợ `PROGRESS.md` "[S11-1 … 0548] Hội thoại CEFR: 'đã học' mới có bằng
  chứng ở MÁY, server chưa chấm lại" — nay ĐÓNG (dời sang `docs/legacy/no-ky-thuat-da-dong.md`).

## Vấn đề

Sau đợt 0548, đạt kiểm tra hiểu thì CLIENT tự ghi `learned|<owner>:<titleEn>` rồi `/api/progress`
hợp nhất UNION lên cột `cefr_dialogues`. Server không thấy bài làm: sửa localStorage, hoặc POST
thẳng `/api/progress` một mảng `learned|…` bịa ra, là "đã học" mọi hội thoại.

## Đã làm

- **Một hàm cho cả hai đầu.** `buildComprehensionQuiz`/`gradeComprehension`/`comprehensionSeed`
  dời sang `packages/subject-english/dialogueComprehension.ts` (kiểu hội thoại khai cấu trúc
  `ComprehensionDialogue` vì gói không được import `apps/`); `apps/dhcb/src/lib/dialogueComprehension.ts`
  chỉ còn `export *`. Thêm `regradeComprehension` (dựng lại đề từ seed; id câu lạ/trùng →
  `QUIZ_MISMATCH`; thiếu câu = sai).
- **Dữ liệu không nhân đôi.** `packages/subject-english/dialogueData.ts` đọc ĐÚNG
  `apps/dhcb/public/data/dialogues.json` (file giao diện fetch) theo `process.cwd()` + Zod + cache —
  cùng cách `dictionaryData.ts` và `_lib/cefrAssessment.ts` đã chạy thật trên VPS.
- **Endpoint** `POST /api/learning/evidence?action=cefr-dialogue` (cùng handler S11, qua CORS + rate
  limit IP + `validateAuth`), logic ở `apps/server/src/api/_lib/cefrDialogueCheck.ts`: Zod `.strict()`
  (`packages/core-contracts/cefrDialogueCheck.ts`) · 6 lượt nộp/phút THEO TÀI KHOẢN · **mỗi lượt
  (seed) chấm MỘT lần** trong 24 giờ (`consumeWindowCounter`, khoá băm SHA-256) nên đáp án chỉ trả
  về sau khi lượt đã bị tiêu · đạt → nối `"<owner>:<titleEn>"` + `"learned|…"` vào `cefr_dialogues`
  kiểu UNION trong SQL (`||` phần tử chưa có), `version + 1`, cộng thưởng ngày học (fail-open) · ghi
  DB lỗi → 500 và trả lại lượt. `?action=` lạ → 400 `BAD_ACTION`.
- **`/api/progress` lọc `learned|…` do client đẩy lên**; bản đã có trong DB giữ nguyên (merge UNION
  với `existing`) → không hạ cấp dữ liệu cũ. `progressSync.ts` không đổi.
- **Client.** `apps/dhcb/src/lib/dialogueCheckClient.ts` (`submitDialogueCheck`, không ném, union
  kết cục). `DialogueComprehensionCheck` gửi lựa chọn thô + seed, đánh dấu đúng/sai theo `correctId`
  SERVER trả, chỉ gọi `onVerified` khi `passed && saved`. Không lưu được → vẫn cho xem kết quả chấm
  tại máy nhưng dòng điểm kèm "· chưa lưu" và lời nhắn đúng lý do (mất mạng / nộp nhanh / lỗi máy chủ
  có nút **Gửi lại**; hết phiên / lượt đã dùng / dữ liệu đã đổi thì không). Khách: không gọi server.
  `markDialogueLearned` bị XOÁ, thay bằng `recordServerVerifiedDialogue` (chỉ phản chiếu vào kho máy,
  không đẩy đồng bộ).
- Skill `pedagogy-linguistics-master` mục A2 (cả `.claude/skills` + `.agents/skills`) cập nhật.

## Quyết định tự chọn (trong ranh giới brief)

- **Đọc file public theo đường dẫn cố định thay vì dời dữ liệu vào `packages/`:** có tiền lệ chạy
  thật ở hai chỗ; dời file kéo theo đổi đường fetch, manifest dữ liệu PWA và hai e2e đang chặn
  `**/data/dialogues.json`, không thêm lợi ích.
- **Action mới trong `/api/learning/evidence`, không ghi vào bảng `completion_*`:** bảng đó của STEM
  (`subject_id` chỉ 4 môn) — ghi vào phải migration; brief cấm migration, cột `cefr_dialogues` đã đủ.
- **Mỗi lượt chấm một lần + số lượt bắt đầu ngẫu nhiên:** cách duy nhất để server trả lời giải sau
  khi nộp mà không thành "máy dò đáp án". Lượt bắt đầu ngẫu nhiên (0…2³¹−1) để mở lại màn không rơi
  vào lượt đã dùng; test truyền `initialAttempt={0}`.
- **`/api/progress` lọc `learned|…`:** không lọc thì "server chấm lại" chỉ là trang trí — vẫn POST
  thẳng được. Lọc chỉ phần tử MỚI từ client; phần tử đã có trong DB giữ nguyên.
- **Vẫn hiện kết quả chấm tại máy khi không lưu được** (thay vì giấu): người học vẫn nhận phản hồi
  sư phạm, nhưng chữ "ĐÃ HỌC" chỉ xuất hiện khi server xác nhận.

## Bằng chứng kiểm chứng (chạy thật)

- `rm -rf packages/*/dist dist dist-server && npm run typecheck` → exit 0.
- `npm run lint` → exit 0 (0 cảnh báo).
- `npm run build` → exit 0 (vite + `build:packages` + `tsc -p tsconfig.server.json` + hub). Nạp thử
  `dist-server/api/_lib/cefrDialogueCheck.js` và `@dhcb/subject-english/dialogueData` bản biên
  dịch bằng Node: dựng được đề 3 câu từ dữ liệu thật.
- `npm run budget` → Initial JS 149.02/160 kB, Initial CSS 24.44/26 kB (không vượt).
- `npm run codemap -- cycles` → "Không có chu trình import".
- `npm run check:specs` → 157 đặc tả, không thiếu đường dẫn. `npm run audit:prose -- --ci` → 0 lỗi.
- `npm run check:sql` (Postgres 16 local, áp đủ migration) → PREPARE 615 câu, 0 lỗi ngoài
  allowlist. Chạy THẬT câu UNION trên DB đó: mảng `["a1-greetings:Meeting in class","learned|old:Old"]`
  → thêm đúng `learned|a1-greetings:Meeting in class`, giữ phần tử cũ, `version` 1 → 2; người dùng
  chưa có dòng → tạo mới `version 1`.
- Vitest nhắm (lệnh ở đặc tả ④): `packages/subject-english` · `apps/server/src/api/learning` ·
  `apps/server/src/api/core/progress.test.ts` · `apps/dhcb/src/lib` · `DialogueComprehensionCheck` ·
  trang Anh/core bị ảnh hưởng theo `codemap impact` — 314 file / 4.999 test xanh (một lần đỏ duy
  nhất là `skills-mirror` trỏ tới đặc tả chưa viết — hết sau khi viết đặc tả).
  "Cùng seed ⇒ cùng đề": mọi hội thoại thật × A/B × 3 lượt.
- Tầng 8b: ảnh trước/sau 1440 + 390 × blue-sky + dark-blue, màn kết quả đạt / chưa đạt / mất mạng
  (chiều A) + đạt chiều B 390 — ngoài repo (scratchpad `shots-0555/`). Đã xem: đạt hiện "Máy chủ đã
  chấm và ghi … ĐÃ HỌC" và mục lục chuyển "đã học 1/3"; mất mạng hiện "Đúng 3/3 — đạt · chưa lưu" +
  lý do + Gửi lại, mục lục giữ "đã học 0/3"; chưa đạt hiện đáp án đúng bằng chữ. Không vỡ bố cục ở
  390, tương phản theo lớp sẵn có của đợt 0548.

## Sau rà soát (bảo mật độc lập trên `df382934`, không có mục Cao)

1. **[Trung — kiến trúc] Mức bảo vệ phải ghi rõ, không thổi phồng.** Đợt này chống **sửa
   localStorage** và **POST giả** (khai `learned|…` qua `/api/progress`, nộp bừa để dò đáp án qua
   máy chủ); **KHÔNG chống người đọc mã có chủ ý** (seed do client chọn, đề dựng lại được từ dữ liệu +
   thuật toán công khai, server trả `correctId`). Ghi ở đặc tả ⑤. Phương án chặn nốt — **seed do
   server cấp (HMAC, TTL, dùng một lần) + không gửi `correctId` về client** — thành nợ "cần chủ dự án
   quyết" trong `PROGRESS.md` (đánh đổi một vòng gọi server + mất lời giải sau khi nộp).
2. **[Thấp — L1] Redis hỏng ở production trả 429/409 sai nghĩa.** Thêm
   `consumeWindowCounterStatus` (`'ok' | 'exhausted' | 'unavailable'`) và `resetCounterChecked`
   (trả `boolean`) vào `packages/core-auth/security.ts`; `consumeWindowCounter`/`resetCounter` cũ
   giữ nguyên chữ ký, nay gọi qua hàm mới (mọi nơi gọi cũ không đổi hành vi). Handler trả **503
   `SERVICE_UNAVAILABLE`** "Máy chủ tạm bận, chưa chấm — thử lại sau ít phút" + `Retry-After: 60` ở
   cả bước rate limit lẫn bước khoá lượt — vẫn fail-closed (không chấm, không ghi, không lộ đáp án).
   Client có kết cục `unavailable`: "Chưa lưu: máy chủ tạm bận…" + nút **Gửi lại**, không bắt Làm
   lại. 503 không kèm mã đó → vẫn là lỗi chung.
3. **[Thấp — L2] Trả lại lượt thất bại thì im lặng.** Ghi DB lỗi mà `resetCounterChecked` = false →
   `console.warn` tiền tố `[cefr-dialogue]` kèm 12 ký tự cuối của khoá đã băm (không userId, không
   tên hội thoại) — test khẳng định chuỗi log không chứa hai thứ đó.
4. **[Thấp — L4] Phần tử `cefrDialogues` của `/api/progress` không giới hạn độ dài.** Thêm
   `z.string().max(300)` (`MAX_DIALOGUE_ENTRY_LEN`). Đo: khoá thật dài nhất 65 ký tự; trần theo hợp
   đồng `learned|` (8) + owner (64) + `:` (1) + titleEn (200) = 273 → 300 có biên. Test: phần tử 301
   ký tự → 400, không ghi gì; khoá 273 ký tự → 200.

**Kiểm chứng sau vá (chạy thật):** `npx prettier --write` + `npx eslint --max-warnings 0` trên 11 file
sửa → exit 0 · `npm run typecheck` → exit 0 · `npx vitest run packages/core-auth
apps/server/src/api/learning apps/server/src/api/core apps/dhcb/src/lib/dialogueCheckClient.test.ts
apps/dhcb/src/components/DialogueComprehensionCheck.test.tsx packages/subject-english
packages/core-contracts` → 128 file xanh (1 skip), 1.439 test xanh (2 skip). Test mới: 503 ở bước
rate limit và bước khoá lượt + hồi phục sau đó; reset lỗi → warn không lộ PII; client 503 có/không
mã; giao diện `unavailable` có Gửi lại; `consumeWindowCounterStatus` ok/exhausted/production
unavailable/dev Map; `resetCounterChecked` true/false ở production.

## Rủi ro / còn lại

- Đáp án tính được từ dữ liệu + mã công khai: server chặn khai suông và dò qua máy chủ, không chặn
  người tự chạy thuật toán (kiểm tra hiểu ngắn, không phải bài thi). Ghi ở đặc tả ⑤.
- Bản `learned|…` client 0548 ghi lúc offline mà chưa lên server (cửa sổ giữa deploy #1291 và đợt
  này, cùng ngày) chỉ còn ở máy đó.
- Production cần Redis: Redis hỏng thì không chấm, trả 503 `SERVICE_UNAVAILABLE` (fail-closed).
- Người đọc mã có chủ ý vẫn tính được đáp án — nợ "seed do server cấp" chờ chủ dự án quyết.
