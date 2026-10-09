---
name: pedagogy-linguistics-master
description: 'Kỹ năng nghiệp vụ Sư phạm Song ngữ (Việt ⇄ Anh) và Ngôn ngữ học Ứng dụng (CEFR A1-C2, IELTS Speaking/Writing, phản hồi 3 nhịp, Socratic Scaffolding, phát âm IPA, Echo Shadowing, tranh biện Toulmin). Kích hoạt khi thiết kế hoặc xử lý logic dạy học, chấm điểm, sửa lỗi, lộ trình, xếp lớp, phát âm, từ vựng và hội thoại AI.'
---

# PEDAGOGY & APPLIED LINGUISTICS MASTER — TIÊU CHUẨN SƯ PHẠM

Quy chuẩn nghiệp vụ sư phạm & ngôn ngữ học ứng dụng cho các tính năng gia sư AI, đấu trường tranh
biện và Bạn Đồng Hành.

> **Đối chiếu mã ngày 2026-10-02.** Bản trước của skill này mô tả như ĐÃ CÓ: bộ khảo thí thích ứng
> IRT 3PL/EAP, Bayesian Knowledge Tracing trên đồ thị tiền đề, chấm phát âm GOP bằng âm học thật.
> Mã KHÔNG có những thứ đó (mục 2–3 ghi đúng thực tế). Khi skill và mã lệch nhau, **MÃ thắng**.
> Cấm hiển thị điểm "ước đoán" như số đo thật — bài học changelog 0473 · 0475.

---

## 1. NGUYÊN TẮC SƯ PHẠM SONG NGỮ BẤT BIẾN

Hai chiều học, chọn bằng `getDirection`/`setDirection` (`apps/dhcb/src/lib/storage.ts`):

```
[Chiều A: Người Việt học Tiếng Anh]
  ├── Hội thoại & mẫu câu: giọng bản ngữ Anh chuẩn
  └── Sửa lỗi, giải thích ngữ pháp & động viên: giọng tiếng Việt tự nhiên

[Chiều B: Người nước ngoài học Tiếng Việt qua Tiếng Anh]
  ├── Hội thoại & mẫu câu: giọng chuẩn tiếng Việt
  └── Sửa lỗi & giải thích: giọng tiếng Anh rõ ràng
```

Điểm khác biệt phải giữ (CLAUDE.md mục 1): sửa lỗi và giải thích bằng **GIỌNG** tiếng mẹ đẻ, không
chỉ chữ. Tính năng mới của môn Anh phải nghĩ cả chiều B — nợ chiều B đang ghi trong `PROGRESS.md`.

### Quy tắc phản hồi 3 nhịp

1. **Khích lệ & công nhận** ý của học viên trước khi sửa (giảm "bộ lọc cảm xúc" — Krashen).
2. **Sửa lỗi chính xác & giải thích cơ chế:** chỉ ra điểm chưa chuẩn (ngữ pháp, dùng từ, ngữ âm),
   giải thích _nguyên nhân_ bằng tiếng mẹ đẻ của người học, kèm ví dụ đối chiếu.
3. **Mở rộng & câu hỏi Socratic:** gợi một cấu trúc cao hơn một bậc và kết bằng một câu hỏi gợi mở
   để người học nói tiếp.

Prompt gửi AI nằm ở `apps/dhcb/src/prompts/`. Sửa prompt → xem diff golden snapshot
(`apps/dhcb/src/prompts/golden.test.ts`) **và** chạy `npm run eval:tutor`, dán bảng so sánh vào PR
(CLAUDE.md mục 8).

---

## 2. XẾP LỚP & THEO DÕI MỨC NẮM VỮNG

### A. Bài xếp lớp đầu vào — ĐANG CÓ

`apps/dhcb/src/lib/placement.ts`: **thuật toán bậc thang thích ứng**, tối đa 3 vòng × 8 câu.

- Vòng 1 thi ở A2.
- Đạt ≥ 75% → thi cấp trên (≥ 95% → nhảy 2 cấp); ≤ 40% → thi cấp dưới; ở giữa → dừng.
- Kết quả là **cấp thấp nhất chưa vững**.
- Câu hỏi dựng bằng `buildExam` của `apps/dhcb/src/lib/cefrExam.ts`.

Logic thuần, có test ca biên — giữ tính chất đó khi sửa.

### A2. Hội thoại CEFR: "đã xem" ≠ "đã học" — ĐANG CÓ (2026-10-09)

Mở hội thoại chỉ ghi **đã xem** (`markDialogueViewed`). **Đã học** cần đạt kiểm tra hiểu 3 câu
tất định, không tốn lượt AI (`apps/dhcb/src/lib/dialogueComprehension.ts`, màn
`apps/dhcb/src/components/DialogueComprehensionCheck.tsx`): nghĩa của một dòng · câu nói ngay sau ·
ai nói — đáp án luôn kiểm ngược được từ dữ liệu, đúng ≥ 2/3 mới ghi `markDialogueLearned`. Hai
chiều: A đề tiếng Anh/hỏi tiếng Việt, B đề tiếng Việt/hỏi tiếng Anh. Đặc tả:
`docs/specs/2026-10-09-hoi-thoai-cefr-bang-chung-da-hoc.md`. Đừng tính "đã xem" là hoàn thành.

### B. CHƯA CÓ — đừng mô tả hay thiết kế như đã có

- Khảo thí thích ứng theo **IRT 3PL / ước lượng EAP / chọn câu theo thông tin Fisher**, kèm các con
  số "12–15 câu, r > 0,92" của bản cũ — không có trong mã, không có số đo nào chứng minh.
- **Bayesian Knowledge Tracing** và **đồ thị kiến thức tiền đề** (`prerequisiteKnowledgeGraph.ts`
  của bản cũ không tồn tại), cùng "bài học bắc cầu tự sinh".

Muốn làm thì cần đặc tả + dữ liệu hiệu chỉnh tham số trước; ghi đề xuất vào `PROGRESS.md`, không tự
dựng.

---

## 3. PHÁT ÂM & LUYỆN NÓI

### A. Gợi ý luyện âm — thực tế là HEURISTIC theo chữ viết

`packages/core-ai/pronunciationHints.ts` (thẻ `PronunciationHintsCard.tsx`; thay "GOP Lab" ở
changelog 0484, `/api/acoustic-phonetics` nay trả 501):

- Đoán âm dễ sai từ **chữ viết của câu mẫu** (từ có "th", "r", "sh", "x"…), tra ma trận lỗi điển
  hình của người Việt. Không nghe giọng học viên.
- **Không có con số nào** — bản cũ gán "Điểm GOP" bằng công thức cứng, đã gỡ.

Hệ quả cho người thiết kế:

- **KHÔNG** gọi đây là "Goodness of Pronunciation", "đo formant" hay "chấm âm học" trong giao diện
  hoặc nội dung quảng bá.
- **KHÔNG** dựa vào điểm này để xếp lớp hay ghi tiến độ.
- Muốn chấm phát âm thật thì cần forced alignment trên âm thanh — việc lớn, cần đặc tả. Nợ này ghi
  ở `PROGRESS.md`.

Phần **có giá trị sư phạm thật** được giữ: ma trận lỗi L1 tiếng Việt cho /θ/, /ð/, /æ/, /r/, /ʃ/,
/ks/ cuối, kèm mẹo đặt lưỡi (`L1_PRONUNCIATION_PATTERNS`).

### B. Echo Shadowing 3 pha (`apps/dhcb/src/components/CompanionVoice/EchoShadowingCard.tsx`)

1. **Nghe chủ động:** nghe audio mẫu bản ngữ, chú ý trọng âm và nhịp.
2. **Nói đuổi:** nói theo audio mẫu với độ trễ ngắn, khớp trọng âm câu và chỗ ngắt hơi.
3. **Nói độc lập:** tự nói, rồi nghe lại mẫu để so.

Thẻ hiện tại **không ghi âm, không chấm** (changelog 0484): giọng mẫu đọc bằng TTS, học viên tự so.
Chỉ thêm điểm khi đo được từ bản ghi âm thật.

---

## 4. KHUNG THAM CHIẾU CEFR & IELTS

### A. CEFR A1 → C2

Nhãn bậc của từ vựng lấy theo nguồn CEFR-J/Octanove khi có. Từ không có nguồn phải tôn trọng sàn
theo tần suất (`UNSOURCED_LEVEL_FLOORS`, cổng `packages/subject-english/dictionaryLevels.test.ts`).
**Đừng tự gán bậc theo cảm giác.** Sửa từ điển → theo đúng quy trình đồng bộ vòng từ vựng
(`docs/claude-md-chi-tiet.md` §8).

### B. Bốn tiêu chí IELTS Speaking (dùng khi chấm chế độ Chat / Luyện nói)

1. **Fluency and Coherence:** mạch lạc, lưu loát; ngập ngừng vì ý chứ không vì ngôn ngữ.
2. **Lexical Resource:** collocation phong phú, thành ngữ đúng ngữ cảnh, paraphrase linh hoạt.
3. **Grammatical Range and Accuracy:** cấu trúc đa dạng, chính xác về thì, hoà hợp chủ–vị, giới từ.
4. **Pronunciation:** âm đuôi, trọng âm từ/câu, nối âm, nuốt âm, ngữ điệu.

Band là **ước lượng** của AI — giao diện phải nói rõ là ước lượng, không phải điểm thi chính thức.

---

## 5. TRANH BIỆN TOULMIN & NGỤY BIỆN

- **Cấu trúc luận điểm Toulmin:** Claim · Evidence/Data · Warrant · Backing · Rebuttal.
- **Nhận diện ngụy biện** trong `packages/core-ai/debateArenaService.ts` là **heuristic theo từ
  khoá** (Ad Hominem, Straw Man, False Dilemma, Slippery Slope, lập luận vòng quanh…), kiểu dữ liệu
  `LogicalFallacyType` ở `packages/core-contracts/debateArena.ts`. Giao diện nên trình bày như "gợi
  ý có thể là ngụy biện", không phải phán quyết chắc chắn.
