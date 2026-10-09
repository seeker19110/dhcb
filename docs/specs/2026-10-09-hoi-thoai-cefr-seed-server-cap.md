# Đặc tả: Hội thoại CEFR — seed do SERVER cấp (HMAC, TTL, dùng một lần), không trả đáp án sai

**Trạng thái:** Approved for implementation — chủ dự án chốt 2026-10-09 ("làm mục 1 seed HMAC"),
trả nợ 🟡 `PROGRESS.md` "[2026-10-09 — rà soát bảo mật changelog `0555`] Kiểm tra hiểu hội thoại
CEFR chưa chống người đọc mã có chủ ý".

**Nền:** đợt `0555` (`docs/specs/2026-10-09-hoi-thoai-cefr-server-cham-lai.md`) để CLIENT chọn
seed (`attempt`), server dựng lại đề từ cùng seed để chấm. Vì `dialogues.json` + thuật toán sinh đề
đều công khai, ai đọc mã vẫn tự tính được `correctId` của mọi lượt trước khi nộp; và server trả
`correctId` sau khi chấm nên dò qua nhiều lượt cũng được.

---

## 0. Một câu

Server **tự sinh seed và GIẤU nó** trong một token ký HMAC (chỉ server suy ra được seed), gửi cho
client **đề đã bỏ đáp án**; chấm xong **không trả đáp án đúng của câu sai** — người đọc mã không
còn đường tính đáp án ngoài việc hiểu hội thoại.

## ① Phạm vi

**LÀM:**

- **Token lượt làm** `packages/core-auth/attemptToken.ts` (dùng chung được cho mọi "lượt" cần
  chống dò): `v1.<payload base64url>.<HMAC-SHA256 base64url>`; khoá ký suy ra bằng
  HKDF-SHA256 từ `USER_DATA_MASTER_KEY` (đã BẮT BUỘC ở production, không thêm biến môi trường);
  dev/test thiếu khoá → khoá ngẫu nhiên theo tiến trình (token hết hiệu lực khi khởi động lại,
  cảnh báo một lần). **Seed ẩn** = HMAC(khoá, `<scope>|seed|<chữ ký>`) — client cầm token nhưng
  không có khoá nên không tính được seed. Verify: so chữ ký bằng `timingSafeEqual`, rồi mới xem
  hạn.
- **Mở lượt:** `POST /api/learning/evidence?action=cefr-dialogue-start` body
  `{ ownerId, titleEn, direction }` → server dựng đề từ seed ẩn, trả `{ token, expiresAt,
questions }` với `questions` là bản CÔNG KHAI (`id · kind · prompt · stem · stemLang ·
stemSpeaker? · options[{id,text,lang?}]`) — KHÔNG có `correctId`/`explanation`. TTL 60 phút.
  Giới hạn 12 lượt mở/phút/tài khoản.
- **Nộp lượt:** `POST …?action=cefr-dialogue` body `{ token, answers }` → verify token (chữ ký,
  hạn, `userId` trong token khớp token đăng nhập), suy seed, chấm lại, tiêu lượt (khoá Redis băm
  SHA-256 của chữ ký, 24 giờ), ghi "đã học" như `0555`. Kết quả từng câu: `chosenId · correct ·
explanation?` — **`explanation` chỉ có khi ĐÚNG**; câu sai không trả đáp án đúng, không giải
  thích (giải thích vốn trích nguyên văn đáp án).
- **Client:** `startDialogueCheck` + `submitDialogueCheck` trong `dialogueCheckClient.ts`;
  `DialogueComprehensionCheck` khi ĐÃ ĐĂNG NHẬP lấy đề từ server (trạng thái đang tải / lỗi tải +
  nút Thử lại), nộp bằng token, hiện đúng/sai theo server, câu sai chỉ nói "chưa đúng — xem lại
  hội thoại". **Khách** (chưa đăng nhập) giữ nguyên luồng tại máy (đề từ seed máy, chấm tại máy,
  có lời giải) — kết quả khách vốn không bao giờ được lưu nên không có gì để chống.
- **Nộp lỗi tạm (mất mạng, 429, 503, 5xx)**: KHÔNG còn "điểm chấm tại máy" cho người đã đăng nhập
  (máy không còn đáp án để chấm) — màn nói "chưa chấm", giữ nguyên lựa chọn, nút Gửi lại gửi lại
  đúng token đó. Token hết hạn/không hợp lệ → `409 ATTEMPT_EXPIRED` → "bấm Làm lại".
- Ghi chú ở `.env.example` (khoá gốc nay còn ký token lượt làm) + skill
  `pedagogy-linguistics-master` hai bản gương + changelog + đóng nợ `PROGRESS.md`.

**KHÔNG LÀM:**

- Không migration, không bảng mới; không đổi cách ghi `cefr_dialogues` và `/api/progress`.
- Không thêm biến môi trường; không thêm thư viện (HKDF/HMAC là `node:crypto`).
- Không đụng `.github/workflows/*`, `e2e/a11y*.spec.ts`, cấu hình lint/coverage, prompt AI.
- Không chống "học thuộc": người thật nhìn đề rồi đọc lại hội thoại để trả lời là ĐÚNG mục đích.
  Dò bằng cách nộp sai nhiều lượt chỉ biết "phương án này sai" của đề đó, mỗi lượt là đề/thứ tự
  khác, 6 lượt nộp/phút — chấp nhận.

## ② Điểm chạm

| Việc | Đường dẫn file                                                                                                      | Ghi chú                                           |
| ---- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| Thêm | `packages/core-auth/attemptToken.ts`                                                                                | ký/verify token + seed ẩn, HKDF từ khoá gốc       |
| Thêm | `packages/core-auth/attemptToken.test.ts`                                                                           | chữ ký, hạn, giả mạo, seed ẩn, khoá thiếu         |
| Sửa  | `packages/core-contracts/cefrDialogueCheck.ts`                                                                      | schema start/submit mới, bỏ `attempt`/`correctId` |
| Sửa  | `packages/subject-english/dialogueComprehension.ts`                                                                 | `toPublicComprehensionQuestion`                   |
| Sửa  | `apps/server/src/api/_lib/cefrDialogueCheck.ts`                                                                     | `handleCefrDialogueStart` + chấm theo token       |
| Sửa  | `apps/server/src/api/learning/evidence.ts`                                                                          | gắn action `cefr-dialogue-start`                  |
| Sửa  | `apps/server/src/api/learning/evidence.cefrDialogue.test.ts`                                                        | viết lại theo hợp đồng mới                        |
| Sửa  | `apps/dhcb/src/lib/dialogueCheckClient.ts` (+ test)                                                                 | `startDialogueCheck`, outcome mới                 |
| Sửa  | `apps/dhcb/src/components/DialogueComprehensionCheck.tsx` (+ test)                                                  | đề từ server khi đăng nhập                        |
| Sửa  | `.env.example` · skill `pedagogy-linguistics-master` (2 bản) · `PROGRESS.md` · `docs/legacy/no-ky-thuat-da-dong.md` | tài liệu                                          |

**Ảnh hưởng lan ra (codemap):** `CefrLessonViews.tsx` chỉ truyền props cũ (không đổi);
`packages/subject-english/dialogueData.test.ts` dùng `regradeComprehension(seed)` — giữ nguyên.

## ③ Hợp đồng dữ liệu

**Mở lượt — vào** (`DialogueStartInputSchema`, `.strict()`):

```ts
{ ownerId: string /* /^[a-z0-9-]{2,64}$/ */, titleEn: string /* 1..200 */, direction: 'A' | 'B' }
```

**Mở lượt — ra 200** (`DialogueStartResultSchema`):

```ts
{
  token: string          // ≤ 2048 ký tự, mờ với client
  expiresAt: number      // epoch ms
  questions: {           // 2..3 câu, KHÔNG correctId/explanation
    id: string; kind: 'meaning' | 'next-line' | 'speaker'; prompt: string
    stem: string; stemLang: 'en' | 'vi'; stemSpeaker?: string
    options: { id: string; text: string; lang?: 'en' | 'vi' }[]
  }[]
}
```

**Nộp — vào** (`DialogueCheckInputSchema`, `.strict()`):

```ts
{ token: string, answers: { questionId: string; optionId: string }[] /* 1..3 */ }
```

**Nộp — ra 200** (`DialogueCheckResultSchema`):

```ts
{
  correct: number; total: number; required: number; passed: boolean; saved: boolean
  items: { questionId: string; chosenId: string | null; correct: boolean
           explanation?: { lead: string; quote?: string; quoteLang?: 'en' | 'vi' } }[]
  // explanation CHỈ xuất hiện khi correct === true
}
```

**Ca lỗi:**

| Tình huống                                      | Mã                                                   | Hành vi (server · giao diện)                                  |
| ----------------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------- |
| Chưa đăng nhập (start/submit)                   | 401                                                  | Không dựng đề/không chấm · "phiên đăng nhập đã hết"           |
| Quá 12 lượt mở/phút hoặc 6 lượt nộp/phút        | 429 + `Retry-After: 60`                              | · Thử lại / Gửi lại sau một phút                              |
| Không có hội thoại                              | 400 `CONTENT_NOT_FOUND`                              | · "máy chủ gặp lỗi"                                           |
| Hội thoại quá ngắn (start)                      | 400 `NO_QUIZ`                                        | · "chưa kiểm tra được hội thoại này"                          |
| Token sai chữ ký / sai cấu trúc / của user khác | 409 `ATTEMPT_EXPIRED` + log `ATTEMPT_TOKEN_REJECTED` | Không chấm · "lượt hết hạn/không hợp lệ — Làm lại"            |
| Token quá hạn                                   | 409 `ATTEMPT_EXPIRED`                                | Không chấm · như trên                                         |
| Id câu không thuộc đề của token                 | 409 `QUIZ_MISMATCH`                                  | Không tiêu lượt · "Tải lại trang rồi làm lại"                 |
| Lượt đã chấm                                    | 409 `ATTEMPT_USED`                                   | · "Làm lại"                                                   |
| Redis không sẵn sàng (production)               | 503 `SERVICE_UNAVAILABLE`                            | Fail-closed · "máy chủ tạm bận" + Gửi lại/Thử lại             |
| Khoá ký thiếu ở production                      | 503 `SERVICE_UNAVAILABLE` + `console.error`          | Không mở lượt                                                 |
| Ghi DB lỗi                                      | 500                                                  | Trả lại lượt · Gửi lại                                        |
| Mất mạng                                        | —                                                    | start: "Thử lại"; submit: "chưa chấm, Gửi lại" (giữ lựa chọn) |

## ④ Tiêu chí chấp nhận

1. Thân phản hồi `cefr-dialogue-start` và `cefr-dialogue` **không chứa** `correctId`, không chứa
   `explanation` của câu sai, không chứa seed (test quét JSON).
2. Cùng token nộp hai lần → lần hai 409 `ATTEMPT_USED`; token sửa một ký tự → 409
   `ATTEMPT_EXPIRED` + log an ninh; token hết hạn → 409; token của user khác → 409.
3. Hai lần mở lượt cùng hội thoại → hai token khác nhau (nonce), seed ẩn khác nhau.
4. `USER_DATA_MASTER_KEY` thiếu: production → start trả 503; dev → vẫn ký/verify được trong cùng
   tiến trình.
5. Giao diện: đã đăng nhập → hiện "Đang lấy câu hỏi…" rồi đề server; nộp đúng 3/3 → "ĐÃ HỌC",
   `onVerified` một lần; nộp sai → câu sai không hiện "Đáp án đúng"; mất mạng lúc nộp → "chưa chấm"
   - Gửi lại gửi lại đúng token; Làm lại → gọi start lần nữa. Khách → không gọi server, giữ như cũ.
6. Cổng: typecheck · lint · prettier · vitest liên quan · codemap cycles · gitleaks · a11y không
   đổi cấu trúc (fieldset/legend/radio/status giữ nguyên).

## ⑤ Bất biến không được phá

| Bất biến                                                    | Test canh                                                |
| ----------------------------------------------------------- | -------------------------------------------------------- |
| Client không bao giờ nhận `correctId`/seed khi đã đăng nhập | `evidence.cefrDialogue.test.ts` (quét thân)              |
| Mỗi token chấm một lần; verify chữ ký trước hạn             | `attemptToken.test.ts` · `evidence.cefrDialogue.test.ts` |
| Chỉ server ghi `learned\|…`                                 | giữ từ `0555`                                            |
| Không log PII; khoá lượt là bản băm                         | `evidence.cefrDialogue.test.ts`                          |
| Không tốn lượt AI                                           | hàm thuần                                                |

## ⑤b Giới hạn đã biết (trung thực — sau rà bảo mật độc lập 2026-10-09)

- **Đáp án vẫn tra được từ dữ liệu công khai.** Đề công khai hiện câu làm đề + phương án; đáp án
  là một SỰ THẬT trong `dialogues.json` (bản dịch của chính câu đó / câu đứng sau / `who`). Một
  script đọc đề rồi tra file là trả lời đúng được — seed ẩn KHÔNG chặn được chuyện này và không
  cách nào chặn chừng nào dữ liệu hội thoại còn phải gửi cho giao diện. Đợt này chặn: tính đáp án
  **trước khi mở lượt** (nộp thẳng không nhìn đề), **replay** cùng lượt, và **xem đáp án câu sai
  rồi nộp lại**. Chặn script tra dữ liệu đòi hỏi đổi kiến trúc (hội thoại không còn công khai) —
  ghi nợ cho chủ dự án quyết.
- **Đoán mò để đạt — ĐÃ VÁ ở đợt 0559 (xem ⑥).** Đo lại trên dữ liệu thật: mọi đề 3 câu, số phương
  án {2,4,4} hoặc {2,3,4}, đạt ≥ 2/3 ⇒ đoán ngẫu nhiên đạt **25,0–29,2 %** mỗi lượt (con số cũ
  "~16–26 %" ước sai). Trước 0559 chỉ có 6 lượt nộp/phút → vét cạn tự động đạt trong vài giây; nay
  tối đa 5 lượt nộp KHÔNG ĐẠT/24 giờ/(người, hội thoại). **Vẫn còn** ~77 % đoán mò đạt trong 5 lượt
  một ngày — không trần nào ≥ 1 hạ được dưới 25 %; trần chặn vét cạn chứ không làm đoán mò bất khả.
- Dựng lại seed từ đề bằng vét cạn PRNG 32 bit (`makeRng`): có thể, nhưng vô nghĩa vì đề công khai
  đã đủ để tra đáp án (mục 1) — không đổi PRNG.
- Chữ ký base64url phải CHUẨN TẮC (đã vá sau rà soát): không thì một token có nhiều "chữ ký" →
  nhiều khoá lượt. Test `attemptToken.test.ts` canh.
- 409 `ATTEMPT_USED` trả kèm `saved` (đã vá sau rà lỗi im lặng): mất phản hồi SAU khi server ghi
  "đã học" → Gửi lại nhận 409 nhưng màn phản chiếu "đã học" thay vì bắt làm lại.
- Xoay `USER_DATA_MASTER_KEY` làm token đang dở hết hiệu lực (màn báo "hết hạn, Làm lại").

## ⑥ Trần số lần sai (đợt 0559)

Trả mục (2) nợ 🟡 `PROGRESS.md` "Kiểm tra hiểu hội thoại CEFR: script vẫn TRA được đáp án…". Mục
(1) (tra `dialogues.json`) KHÔNG làm — đổi kiến trúc, chờ chủ dự án.

**Luật:** tối đa `DIALOGUE_FAIL_CAP_PER_DAY = 5` lượt nộp **không đạt** (`passed === false`) trong
cửa sổ 24 giờ (tính từ lượt sai đầu, không gia hạn) cho MỘT cặp (tài khoản, hội thoại). Khoá Redis
`cefr-dialogue-fail:<sha256(JSON[userId, ownerId, titleEn])>` — băm, không PII, **không gồm chiều
A/B** (đổi chiều không thêm lượt). Khách (chưa đăng nhập) không đổi.

**Cách đếm:**

- **Mở lượt** chỉ ĐỌC bộ đếm (`peekWindowCounter`), không tiêu: đã ≥ 5 → 409 `ATTEMPT_CAP`, không
  cấp token/đề.
- **Nộp:** sau khi verify token, chấm (thuần) và tiêu khoá lượt, server **giữ chỗ** bằng một INCR
  nguyên tử (`consumeWindowCounterCount`) TRƯỚC khi trả bất kỳ đúng/sai nào; vượt 5 → trả lại khoá
  lượt + chỗ vừa giữ, 409 `ATTEMPT_CAP`, không trả kết quả, không ghi. Đạt → trả lại chỗ (DECR) rồi
  ghi "đã học" như cũ; không đạt → giữ, thân 200 kèm `attemptsLeft = 5 − số lượt sai`. Ròng lại bộ
  đếm chỉ tăng ở lượt không đạt; giữ chỗ trước để **token cất sẵn nộp đồng loạt** cũng không vượt
  trần (đếm sau khi chấm thì một lượt đạt có thể lọt qua giữa các lượt sai đồng thời).
- Không miễn người đã học: làm lại sau khi đã học không được gì thêm; miễn thì tốn một lần đọc DB
  mỗi lượt mở.

**Hợp đồng (bổ sung, tương thích ngược):**

```ts
// DialogueCheckResultSchema (.strict()) thêm:
attemptsLeft?: number // 0..5, CHỈ khi passed === false
// DialogueCheckErrorCodeSchema thêm: 'ATTEMPT_CAP'
// Hằng: DIALOGUE_FAIL_CAP_PER_DAY = 5 (packages/core-contracts/cefrDialogueCheck.ts)
```

| Tình huống                                        | Mã                        | Hành vi (server · giao diện)                                                                 |
| ------------------------------------------------- | ------------------------- | -------------------------------------------------------------------------------------------- |
| Mở lượt khi đã sai 5 lần trong 24 giờ             | 409 `ATTEMPT_CAP`         | Không cấp đề · "Hôm nay đã hết lượt thử…" + chỉ nút "Xem lại hội thoại" (không Thử lại)      |
| Nộp (kể cả đúng) khi đã sai 5 lần — token cất sẵn | 409 `ATTEMPT_CAP`         | Không chấm, không ghi, trả lại khoá lượt · "Chưa chấm: …mai làm tiếp", không Gửi lại/Làm lại |
| Nộp không đạt, còn lượt                           | 200 + `attemptsLeft` ≥ 1  | · "Còn N lượt thử hôm nay" + Làm lại                                                         |
| Nộp không đạt ở lượt thứ 5                        | 200 + `attemptsLeft` = 0  | · lời nhắn hết lượt, KHÔNG Làm lại, "Xem lại hội thoại" là nút chính                         |
| Bộ đếm lượt sai không sẵn sàng (production)       | 503 `SERVICE_UNAVAILABLE` | Fail-closed, trả lại khoá lượt · "máy chủ tạm bận" + Gửi lại                                 |

**Điểm chạm:**

| Việc | Đường dẫn file                                               | Ghi chú                                             |
| ---- | ------------------------------------------------------------ | --------------------------------------------------- |
| Sửa  | `packages/core-auth/security.ts`                             | `consumeWindowCounterCount` + `peekWindowCounter`   |
| Sửa  | `packages/core-contracts/cefrDialogueCheck.ts`               | hằng trần, `attemptsLeft?`, mã `ATTEMPT_CAP`        |
| Sửa  | `apps/server/src/api/_lib/cefrDialogueCheck.ts`              | `failCapKey`, chặn ở start, giữ chỗ/trả chỗ ở check |
| Sửa  | `apps/dhcb/src/lib/dialogueCheckClient.ts`                   | outcome `attempt-cap` ở cả hai bước                 |
| Sửa  | `apps/dhcb/src/components/DialogueComprehensionCheck.tsx`    | "Còn N lượt", màn hết lượt, ẩn Làm lại              |
| Sửa  | `apps/server/src/api/learning/evidence.cefrDialogue.test.ts` | 10 ca trần                                          |

**Tiêu chí chấp nhận:**

1. Sai 5 lần liên tiếp → lần 1..5 trả `attemptsLeft` 4..0; mở lượt lần sau → 409 `ATTEMPT_CAP`.
2. Mở lượt không đổi bộ đếm; lượt đạt không đổi bộ đếm (ròng); `ATTEMPT_USED` không đụng bộ đếm.
3. Token mở trước khi hết trần, nộp sau (kể cả đáp án đúng) → 409, không có `items`/`passed`, không
   ghi DB; 3 token nộp đồng loạt khi còn 1 lượt → đúng 1 lượt được chấm.
4. Khoá `^cefr-dialogue-fail:[0-9a-f]{64}$`, không chứa userId/owner/tên; chiều B dùng chung khoá A.
5. Bộ đếm không sẵn sàng → 503 ở cả hai bước, không trả kết quả; hồi phục thì gửi lại đúng token.
6. Giao diện: "Còn N lượt thử hôm nay" (B: "N tries left today", số ít "1 try"); hết lượt → không
   nút Làm lại/Thử lại/Gửi lại, chỉ "Xem lại hội thoại"; câu hỏi khoá (fieldset `disabled`).

## ⑦ Quy ước dự án liên quan

CLAUDE.md mục 4.2 (logic nhạy cảm ở server), 4.9 (ca biên: hạn, race nộp đúp), mục 8 cổng;
`docs/specs/2026-10-09-hoi-thoai-cefr-server-cham-lai.md` (nền).
