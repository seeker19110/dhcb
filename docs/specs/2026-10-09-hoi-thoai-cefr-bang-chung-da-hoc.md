# Đặc tả: Hội thoại CEFR — bằng chứng "đã học" (kiểm tra hiểu tất định)

**Trạng thái:** Approved for implementation — chủ dự án duyệt hướng "chất lượng cao nhất"
2026-10-09 trong phiên (giao qua coordinator, đợt `0548`).

**Nền:** nợ `PROGRESS.md` "[2026-09-15 — S11-1] Hội thoại CEFR đánh dấu 'đã xem'
(`markDialogueViewed`) chứ không phải 'đã học'". Trước đợt này, MỞ một hội thoại là mục lục đã
đánh dấu nút "Hội thoại" của unit là **Đã xong** (`progress: 'completed'`, nguồn
`english.cefrDialogue`) — không có gì chứng minh người học hiểu.

---

## 0. Một câu

Sau khi xem một hội thoại CEFR, người học (cả chiều A lẫn B) làm một **kiểm tra hiểu 3 câu, không
tốn lượt AI**, sinh tất định từ chính dữ liệu hội thoại; đúng **≥ 2/3** thì hội thoại được ghi là
**đã học**, và mục lục phân biệt ba trạng thái **chưa xem / đã xem / đã học**.

## ① Phạm vi

**LÀM:**

- Hàm thuần `buildComprehensionQuiz(dialogue, direction, seed)` sinh tối đa 3 câu chọn đáp án,
  **mỗi đáp án đúng kiểm ngược được từ dữ liệu** (không phán đoán "câu nào hợp lý"):
  1. **meaning** — "Câu này trong hội thoại có nghĩa là gì?": đề = một dòng bằng ngôn ngữ đích;
     đáp án = bản dịch tác giả viết sẵn của chính dòng đó; nhiễu = bản dịch các dòng KHÁC cùng hội
     thoại (khác chữ sau chuẩn hoá). Ưu tiên dòng ≥ 3 từ; **tránh dòng "lộ đáp án"** — đề và đáp án
     chung một từ (tên riêng "Lan", số "5") mà không nhiễu nào có.
  2. **next-line** — "Trong hội thoại vừa xem, câu nào được nói ngay sau câu này?": đáp án = dòng
     liền sau trong dữ liệu; nhiễu = dòng khác của **cùng người nói với đáp án** (tên người nói
     không gợi ý được gì).
  3. **speaker** — "Ai nói câu này?": hai tên nhân vật (chiều A tên `vi`, chiều B tên `en`).
  - Không dòng nào vừa làm đề/đáp án câu này vừa làm đề câu khác (một câu không lộ câu kia).
  - Loại nào không dựng được (hội thoại một người nói, hai tên trùng) thì bù bằng loại khác cho đủ 3.
  - Dưới `MIN_QUESTIONS = 2` câu dựng được (vd hội thoại 2 dòng) → trả `[]`, giao diện nói thật
    "chưa kiểm tra được", **không tự chế câu hỏi**.
  - Seed = `<ownerId>:<titleEn>|<chiều>|<số lần làm>` (FNV-1a → mulberry32, trộn bằng
    `shuffle` Fisher–Yates dùng chung). "Làm lại" tăng số lần làm → đề đổi.
- **Hai chiều:** chiều A đề tiếng Anh, câu hỏi/giải thích tiếng Việt; chiều B đề tiếng Việt, câu
  hỏi/giải thích tiếng Anh (dữ liệu hội thoại có sẵn cả `en` lẫn `vi` cho mọi dòng).
- Chấm: `gradeComprehension` — đạt khi `total ≥ 2` và `correct ≥ ceil(2·total/3)` (3 câu → 2,
  2 câu → 2). Bỏ trống = sai.
- Màn `DialogueComprehensionCheck` mở từ nút "Làm kiểm tra hiểu" dưới bản hội thoại; màn này
  **che bản hội thoại kèm bản dịch** trong lúc làm (nếu không, câu hỏi nghĩa chỉ là dò dòng dịch).
- Đạt → `markDialogueLearned(uid, ownerId, titleEn)`; dữ liệu cũ "đã xem" **giữ nguyên là đã xem**.
- Mục lục (`cefrOutline`) + danh sách hội thoại trong trang cấp hiện nhãn CHỮ ba trạng thái.

**KHÔNG LÀM:**

- Không gọi AI, không sửa prompt (`apps/dhcb/src/prompts/*` không đổi → không cần `eval:tutor`).
- Không đổi schema CSDL, không migration, không đổi API `/api/progress` (xem ③ — lưu chung mảng).
- Không chuyển hội thoại sang endpoint server chấm lại `POST /api/learning/evidence` (S11): dữ liệu
  hội thoại chỉ có ở client (`public/data/dialogues.json`). Mức tin cậy của "đã học" ngang
  `cefrGrammar` hiện tại (client khai sau khi đạt kiểm tra ở máy) — ghi rõ ở ⑤/rủi ro.
- Không bỏ nút "Hội thoại" ở unit không có hội thoại (162/197 unit) — đổi cấu trúc cây/đếm tổng
  là việc riêng; đợt này chỉ ghi chữ "Phần này chưa có hội thoại" khi biết chắc.
- Không dạng bài "sắp xếp lại lượt thoại" (kéo-thả khó đạt a11y bàn phím/trình đọc màn hình; câu
  "next-line" đo cùng năng lực theo dõi mạch hội thoại bằng radio chuẩn).

## ② Điểm chạm

| Việc | Đường dẫn file                                                 | Ghi chú                                                     |
| ---- | -------------------------------------------------------------- | ----------------------------------------------------------- |
| Thêm | `apps/dhcb/src/lib/dialogueComprehension.ts`                   | Sinh đề + chấm, hàm thuần tất định                          |
| Thêm | `apps/dhcb/src/lib/dialogueComprehension.test.ts`              | Ca biên + quét MỌI hội thoại thật × A/B                     |
| Thêm | `apps/dhcb/src/components/DialogueComprehensionCheck.tsx`      | Màn kiểm tra (radiogroup, phản hồi chữ, focus)              |
| Thêm | `apps/dhcb/src/components/DialogueComprehensionCheck.test.tsx` | Hành vi giao diện A/B, đạt/chưa đạt, chưa đăng nhập         |
| Sửa  | `apps/dhcb/src/lib/cefrProgress.ts`                            | `getLearnedDialogues` · `markDialogueLearned` · lọc tiền tố |
| Sửa  | `apps/dhcb/src/lib/outline/cefrOutline.ts`                     | `tienDoHoiThoaiCuaUnit`: chưa xem / đã xem / đã học         |
| Sửa  | `apps/dhcb/src/data/dialoguesLoader.ts`                        | `getDialogueTitlesByUnit` (để đếm "đã học x/N")             |
| Sửa  | `apps/dhcb/src/components/CefrLessonViews.tsx`                 | `DialogueView` nhận `comprehension` + nút mở kiểm tra       |
| Sửa  | `apps/dhcb/src/pages/subjects/english/CefrLevelPage.tsx`       | Truyền owner/learned; nhãn trạng thái từng hội thoại        |
| Sửa  | `apps/dhcb/src/lib/subjectProgressBoard.ts`                    | Ctx mục lục có `learnedDialogues` + tên hội thoại           |
| Sửa  | `apps/dhcb/src/lib/intent/buildIntentOutlines.ts`              | Như trên                                                    |
| Sửa  | `apps/dhcb/src/lib/progressSummary.ts`                         | Nhãn nguồn `english.cefrDialogueLearned`                    |

**Ảnh hưởng lan ra:** thẻ "Tiến độ theo môn" (`/tien-do`) và cây ý định (S05) đọc cùng adapter —
hội thoại chỉ đã xem nay là "đang học dở" thay vì "đã xong", nên số "đã xong" của môn Anh có thể
GIẢM với người dùng cũ. Đây là sửa cho đúng, không phải hồi quy.

## ③ Hợp đồng dữ liệu

**Lưu trữ** (cùng kho tiến độ hiện có, đồng bộ cloud sẵn): mảng `et_cefr_dialogue_<uid>` ↔ cột
`learning_progress.cefr_dialogues` (hợp nhất UNION ở client `progressSync.ts` và server
`progressMerge.ts`).

```ts
// "đã xem" (giữ nguyên khuôn cũ):   "<ownerId>:<titleEn>"
// "đã học" (mới, thêm vào CÙNG mảng): "learned|<ownerId>:<titleEn>"
export const DIALOGUE_LEARNED_PREFIX = 'learned|'
getViewedDialogues(uid): Set<string>  // chỉ khoá KHÔNG tiền tố
getLearnedDialogues(uid): Set<string> // khoá "đã học", đã bỏ tiền tố
markDialogueLearned(uid, ownerId, titleEn): void // ghi cả khoá xem + khoá học; idempotent
```

Vì sao chung mảng thay vì cột mới: UNION ở cả hai đầu nên bản ghi mới đi theo **không cần
migration**, và client cũ (chưa biết tiền tố) đọc-rồi-đẩy lại vẫn giữ nguyên bản ghi (không xoá).
Không id unit/vòng nào bắt đầu bằng `learned|` (test quét dữ liệu thật).

**Đề:**

```ts
interface ComprehensionQuestion {
  id: string // `<loại>-<chỉ số dòng>`
  kind: 'meaning' | 'next-line' | 'speaker'
  prompt: string // tiếng mẹ đẻ
  stem: string
  stemLang: 'en' | 'vi'
  stemSpeaker?: string
  options: { id: string; text: string; lang?: 'en' | 'vi' }[]
  correctId: string
  explanation: { lead: string; quote?: string; quoteLang?: 'en' | 'vi' }
}
```

**Mục lục — nút "Hội thoại" của unit** (biết tên hội thoại của unit, N > 0):

| Tình trạng               | `progress`    | `evidenceSource`                                         | Chữ phụ (`hint`)             |
| ------------------------ | ------------- | -------------------------------------------------------- | ---------------------------- |
| chưa xem bài nào         | `not-started` | —                                                        | "Chưa xem"                   |
| đã xem ≥ 1, chưa học hết | `in-progress` | `english.cefrDialogue` hoặc `…Learned` nếu có bài đã học | "Đã xem x/N · đã học y/N"    |
| đã học hết N             | `completed`   | `english.cefrDialogueLearned`                            | "Đã học" / "Đã học N/N"      |
| unit không có hội thoại  | `not-started` | —                                                        | "Phần này chưa có hội thoại" |

Chưa biết tên (đang tải/tải lỗi): **không bao giờ** `completed`; có bài đã học → `in-progress`
"Có hội thoại đã học"; chỉ đã xem → `in-progress` "Đã xem"; còn lại "Chưa xem".

**Ca lỗi:**

| Tình huống                             | Hành vi mong đợi                                            |
| -------------------------------------- | ----------------------------------------------------------- |
| Hội thoại < 2 câu hỏi dựng được        | Màn nói "chưa kiểm tra được", không ghi gì                  |
| Chưa đăng nhập (`uid` rỗng)            | Vẫn làm được; đạt thì báo "cần đăng nhập để lưu tiến độ"    |
| `localStorage` hỏng                    | `readSet` trả Set rỗng như cũ                               |
| Tải `dialogues.json` lỗi ở thẻ tiến độ | Bỏ qua tên hội thoại, adapter không khẳng định "đã học hết" |

## ④ Tiêu chí chấp nhận

- [x] Mọi hội thoại thật (139) × chiều A/B × 2 lần làm ra đủ 3 câu, đủ 3 loại, đáp án kiểm ngược
      khớp dữ liệu, phương án không trùng chữ, câu nghĩa không lộ đáp án —
      `npx vitest run apps/dhcb/src/lib/dialogueComprehension.test.ts`.
- [x] Ca biên: 2 dòng → `[]`; một người nói → không có câu "ai nói", vẫn 3 câu; tên trùng; thiếu
      tên; bản dịch trùng; dòng rỗng; tất định theo seed.
- [x] Ngưỡng: 3/3, 2/3 đạt; 1/3 không; bỏ trống = sai; đề rỗng không bao giờ đạt.
- [x] Dữ liệu cũ chỉ "đã xem" vẫn là đã xem; `markDialogueLearned` idempotent —
      `npx vitest run apps/dhcb/src/lib/cefrProgress.test.ts`.
- [x] Mục lục ba trạng thái + chữ phụ — `npx vitest run apps/dhcb/src/lib/outline`.
- [x] Giao diện: radiogroup có legend, nộp khi đủ câu, phản hồi chữ, focus khối kết quả, chiều B
      tiếng Anh — `npx vitest run apps/dhcb/src/components/DialogueComprehensionCheck.test.tsx`.
- [x] Tầng 8b: ảnh trước/sau 1440 + 390, blue-sky + dark-blue, chiều A + B.

**Lệnh chứng minh:**

```bash
rm -rf packages/*/dist dist dist-server && npm run typecheck && npm run lint
npx vitest run apps/dhcb/src/lib/dialogueComprehension.test.ts apps/dhcb/src/lib/cefrProgress.test.ts \
  apps/dhcb/src/lib/outline apps/dhcb/src/components/DialogueComprehensionCheck.test.tsx
npm run audit:prose -- --ci
```

## ⑤ Bất biến không được phá

| Bất biến                                                | Test nào canh nó                                    |
| ------------------------------------------------------- | --------------------------------------------------- |
| Đáp án đúng luôn là sự thật trong dữ liệu (không bịa)   | `dialogueComprehension.test.ts` (quét dữ liệu thật) |
| "Đã xem" không bao giờ tự thành "đã học"                | `cefrProgress.test.ts`                              |
| Không tốn lượt AI (không gọi `callClaude`/`/api/agent`) | Hàm thuần; màn không import `lib/ai`                |
| Mục lục không khẳng định "xong" khi không biết tổng     | `outline/cefrOutline.test.ts`                       |
| Cây mục lục hợp lệ (`OutlineSchema`)                    | `outline/cefrOutline.test.ts`                       |

**Giới hạn đã biết (trung thực):** "đã học" do client ghi sau khi đạt ở máy, server chỉ hợp nhất —
cùng mức tin cậy với `cefrGrammar`. Muốn server chấm lại phải đưa dữ liệu hội thoại lên server
(slice riêng). Câu "ai nói" chỉ 2 lựa chọn (đoán trúng 50%); xác suất đạt ≥ 2/3 nhờ đoán bừa
cả ba câu ≈ 0,25 (4 phương án) – 0,29 (3 phương án). Đây là kiểm tra hiểu NGẮN sau khi xem, không
phải bài thi; "Làm lại" luôn ra đề khác nên đoán mò không lặp lại được cùng đáp án.

## ⑥ Quy ước dự án liên quan

- Màu qua token/lớp sẵn có; radio dùng `accent-[rgb(var(--focus-ring))]` (token đạt ≥ 3:1 ở mọi
  theme, WCAG 1.4.11) — không dùng `--a-500` (2,65:1 ở Blue sky).
- Đề/phương án gắn `lang` đúng ngôn ngữ (WCAG 3.1.2); trạng thái bằng CHỮ, không chỉ màu.
- Vùng chạm ≥ 44px (`tap-44`, `min-h-[44px]`).
- Câu chữ mới chạy `npm run audit:prose`.

---

## Nghiệm thu

Xem `docs/changelog/0548-2026-10-09-hoi-thoai-cefr-bang-chung-da-hoc.md`.
