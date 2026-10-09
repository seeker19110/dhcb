---
name: memory-palace-cognitive-scaffolder
description: 'Kỹ năng Nghiệp vụ Cung điện Trí nhớ (Method of Loci), ôn tập ngắt quãng FSRS, Nhật ký Phản tỉnh Socratic (bẫy tư duy) và bản tin chủ động. Kích hoạt khi làm việc với Cung điện trí nhớ, thẻ ôn tập/SRS, nhật ký phản tỉnh, bản tin sáng/tối hoặc thiết kế bài tập ghi nhớ dài hạn.'
---

# MEMORY PALACE & COGNITIVE SCAFFOLDER

Quy chuẩn cho các tính năng ghi nhớ và phản tỉnh trong Đồng Hành (studio "Ghi nhớ" của Bạn Đồng
Hành + hệ ôn tập SRS).

> **Đối chiếu mã ngày 2026-10-02.** Bản trước của skill này mô tả như ĐÃ CÓ: bộ điều tiết tải nhận
> thức (`cognitiveLoadRegulator.ts`) và "hợp nhất trí nhớ chu trình REM"
> (`remConsolidationService.ts`) — **cả hai không tồn tại**. Mục dưới ghi đúng cái đang có. Khi
> skill và mã lệch nhau, **MÃ thắng**.

---

## 1. CUNG ĐIỆN TRÍ NHỚ (METHOD OF LOCI) — ĐANG CÓ

`packages/core-ai/memoryPalaceService.ts` (hợp đồng `packages/core-contracts/memoryPalace.ts`),
giao diện `apps/dhcb/src/components/MemoryPalace/` (`MemoryPalaceCard`,
`MemoryPalaceExplorerModal`):

```
[Khái niệm / từ vựng C1–C2 / công thức / ngụy biện]
        ▼
[Liên tưởng giác quan + hình ảnh dị biệt]
        ▼
[Gắn vào điểm neo (locus) trong một "phòng" theo chủ đề]
        ▼
[Ôn lại bằng cách "đi" qua các điểm neo]
```

- **5 chủ đề phòng** (`MemoryPalaceThemeSchema`): `knowledge_library` (từ vựng học thuật, khái
  niệm) · `debate_sanctuary` (lập luận Toulmin, ngụy biện) · `philosophical_atrium` (phản tỉnh) ·
  `stem_laboratory` (công thức) · `zen_garden` (tĩnh tâm).
- Điểm neo sinh từ mẫu theo chủ đề; id phòng/điểm neo dùng `randomUUID()` — đừng quay lại id dựa
  trên thời gian (từng trùng id khi tạo cùng mili-giây).
- **Độ bền ghi nhớ (`retentionStrength`)** khởi điểm `INITIAL_RETENTION_STRENGTH = 0` và CHỈ đổi
  qua ôn thật (`verifyLocusRecall`: đúng +15, sai −5, kẹp [0, 100]). Trước changelog 0563 nó là
  `70 + random(25)` hiển thị như số đo — đừng quay lại. Giao diện hiện "Chưa ôn" khi điểm neo chưa
  có `lastRecalledAt`, chỉ hiện "%" sau lần ôn đầu.
- Giao diện là thẻ + danh sách điểm neo. **CHƯA CÓ** không gian 3D/isometric.

---

## 2. ÔN TẬP NGẮT QUÃNG — FSRS THẬT

- `apps/dhcb/src/lib/srs.ts` dùng thư viện **`ts-fsrs`** (cùng thuật toán Anki dùng từ 23.10),
  thay SM-2 tự viết từ 2026-07-16. Lý do và đánh đổi ghi ở chú thích đầu file `srs.ts` (tài
  liệu nghiên cứu nó trỏ tới, `sm2-den-fsrs-2026-07-16.md`, không còn trong repo).
- Người dùng tự chấm Quên / Khó / Nhớ / Dễ, FSRS tính lần ôn kế tiếp. App ôn theo **ngày**, không có
  bước học lại trong vài phút như Anki.
- Đổi tham số hay kho lưu → đọc chú thích đó trước. Thẻ SRS của từ vựng và ngữ pháp dùng chung
  engine này.

**CHƯA CÓ — đừng mô tả như đã có:**

- "Hợp nhất trí nhớ chu trình REM";
- "chỉ số tải nhận thức (CLI)" tự hạ/nâng độ khó;
- "micro-break 30 giây" tự động.

Điều tiết độ khó theo trạng thái người học là ý tưởng hợp lý nhưng cần đặc tả + dữ liệu đo, không tự
dựng công thức trọng số.

---

## 3. NHẬT KÝ PHẢN TỈNH — HEURISTIC, KHÔNG PHẢI THANG ĐO

`packages/core-personal/metacognitiveReflectionService.ts`, giao diện
`apps/dhcb/src/components/MetacognitiveReflection/`:

- **Bẫy tư duy** được nhận diện bằng **từ khoá trong bài viết của người học**:
  - "chắc chắn", "dễ ợt" → tự tin thái quá;
  - "sợ sai", "chưa sẵn sàng" → tê liệt phân tích;
  - … và hội chứng kẻ giả mạo, chi phí chìm.

  Giao diện nên trình bày là "**có thể** bạn đang…" kèm câu hỏi Socratic, không phải chẩn đoán.

- **KHÔNG có con số nào chấm người viết** (changelog 0539). "Chỉ số tự nhận thức" (MAI giả, tính
  từ số từ của bài viết), "Growth Mindset" và "xu hướng tư duy" đã BỎ khỏi service, hợp đồng, API
  và giao diện. Phản hồi chỉ định tính: bẫy có thể đang mắc, nguyên văn cụm từ khiến bộ dò nghĩ tới
  (`triggerPhrases`), câu hỏi Socratic riêng cho từng bẫy.
  - Bản ghi cũ trong `platform.feature_state` còn hai trường số. Server chiếu qua
    `toPublicReflection` (danh sách trắng) nên số không bao giờ ra client. Đừng thêm lại điểm số
    nào: test `.strict()` + `findForbiddenLanguage` trong
    `packages/core-personal/metacognitiveReflectionService.test.ts` sẽ đỏ.
  - Luật số 1 của sản phẩm: kết quả chẩn đoán **không bao giờ là màn hình chính**
    (`docs/research/luong-nguoi-moi-ho-so-nang-luc-an-2026-08-23.md`).
- **Khoảnh khắc "Aha"** trích từ câu dài trong bài viết — giữ, vì nó phản chiếu lời người học chứ
  không chấm điểm họ.

---

## 4. BẢN TIN CHỦ ĐỘNG

`apps/server/src/api/personal/proactive-briefing.ts` sinh bản tin `morning`/`evening` **khi được
gọi**, theo luật từ dữ liệu trong CSDL (`packages/core-personal/proactiveBriefingService.ts`) —
**không gọi AI**. Không có lịch tự chạy "trước khi người dùng thức giấc". Nếu sau này thêm bước
gọi AI thì phải qua đếm lượt (`checkAndConsumeUsage`) và đọc ngữ cảnh qua `contextEngine` theo
consent.

Luật nội dung (changelog 0495, audit M10): bản tin CHỈ đếm việc thật của hai trụ còn lại — thẻ ôn
đến hạn (`english.learning_progress`, đọc bằng `userId`) và việc chưa xong / đến hạn trong Ghi chú
(`worklife.tasks`, đọc bằng `personId`; `personId` ≠ `userId`). Không mục trụ đã xoá, không số gán
cứng, **lỗi CSDL là lỗi** (ném ra, API 500 — không bịa số), không khen khi chưa có bằng chứng hành
động, sáng/tối tính theo giờ Việt Nam.
