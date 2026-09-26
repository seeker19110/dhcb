# 0348 — 2026-09-16 — S11-2: bài STEM nộp tự kiểm tra, evidence khách và hàng đợi gửi lại

| Thuộc tính | Giá trị                                                                                |
| ---------- | -------------------------------------------------------------------------------------- |
| PR         | [#964](https://github.com/seeker19110/dhcb/pull/964)                                   |
| Đặc tả     | `docs/specs/2026-09-15-learning-ux-s11-completion-evidence.md` §9 mục 2 (AC-9…AC-13)   |
| Goal       | `docs/goals/2026-09-15-learning-ux.md` dòng S11                                        |
| Nền        | S11-1 (#935) hợp đồng + migration `0081` + `POST /api/learning/evidence`; S08-3 (#962) |

## Việc đã làm

- `apps/dhcb/src/lib/stemEvidence.ts` (mới): `submitStemEvidence` · `fetchCompletionState` ·
  `flushPendingEvidence` · `pushGuestEvidence`. Ba khoá localStorage mới `dhcb_evidence_` ·
  `dhcb_evidence_state_` · `dhcb_evidence_pending_`, mọi truy cập bọc try/catch, mọi bản ghi đọc
  ra đều validate lại bằng Zod (phần tử hỏng bị bỏ, không làm vỡ trang).
- `StemLessonView.tsx`: nút **"Nộp bài tự kiểm tra"** (≥ 44px) chỉ bật khi đã trả lời đủ mọi câu;
  nộp xong mọi câu đều hiện đúng/sai. Chữ **"Đã hoàn thành"** CHỈ xuất hiện khi server trả
  `passed: true` — bản chấm ở máy (khách, hoặc lúc đang chờ gửi lại) nói rõ nó là kết quả cục bộ.
- `guestProgress.ts`: đăng ký cả **ba** tiền tố vào `ALL_PREFIXES` + nhánh merge đẩy từng evidence
  khách lên server. Lỗi mạng ở một bản ghi không chặn phần còn lại của việc hợp nhất.

## Quyết định đáng nhớ

**Bản ghi cục bộ lưu KÈM trả lời thô, không chỉ `CompletionEvidence`.** AC-10 ghi "mảng
`CompletionEvidence`", nhưng AC-11 đòi lúc merge phải gửi `answers` thô cho server chấm lại — mà
`CompletionEvidenceSchema` cố ý KHÔNG có `answers`. Hai dòng chỉ thoả cùng lúc khi lưu
`{ input, evidence }` (`StoredEvidenceSchema`). Chọn theo AC-11 vì đó là dòng giữ bất biến bảo mật.

**Ba lớp chặn cho luồng merge evidence khách:** (1) client gửi `answers` THÔ, server chấm lại nên
khách sửa `passed: true` trong localStorage không lọt; (2) `attemptId` giữ nguyên nên gửi lại
không sinh dòng nhật ký thứ hai; (3) bản ghi có `ownerId` khác id khách hiện tại bị BỎ, không đẩy
lên — danh tính thật vẫn do token quyết định ở server, đây là lớp rẻ tiền đứng ngay chỗ dữ liệu
không đáng tin.

**Hàng đợi gửi lại chỉ trong MỘT thiết bị.** Không version, không xử lý xung đột hai thiết bị —
đó là S09. Gửi theo thứ tự và DỪNG ngay khi gặp lỗi còn có thể thử lại; 400 thì bỏ khỏi hàng đợi
kèm `console.warn` tiền tố `[evidence]`.

**Dòng kết quả là bản TẠM.** S11-3 thay bằng `ActivityResult` dùng chung (đặc tả §① mục 6).

## Bằng chứng kiểm chứng

- `npm run typecheck` ✅ (sau `rm -rf packages/*/dist dist dist-server`) · `npm run lint` ✅ 0 cảnh
  báo · `npx prettier --check .` ✅
- `npm run test:coverage` ✅ 13623 pass / 2 skip — Stmts 94.27 · Branch 90.17 · Func 94.78 ·
  Lines 94.79 (sàn 93/89/93/93)
- Test mới: `stemEvidence.test.ts` **18 ca** · `guestProgress.test.ts` 27 → **31** ·
  `StemLesson.test.tsx` 14 → **19**
- E2E `e2e/stem-evidence.spec.ts` 2/2 ✅ (mở bài + trả lời tại chỗ → **0 request** tới
  `/api/learning/evidence`; khách nộp → không gọi server, có khoá `dhcb_evidence_*`)
- E2E hàng xóm `learning-session-resume-stem.spec.ts` + `outline-stem.spec.ts` ✅ 12/12
- `e2e/a11y.spec.ts` + `e2e/a11y-aaa.spec.ts` ✅ **472 pass**, 0 vi phạm, 5 theme
- `npm run codemap -- impact`: `guestProgress.ts` → 4 file (đúng như đặc tả §② dự đoán),
  `StemLessonView.tsx` → 3 file
- Tầng 8b: ảnh thật 1440 / 390 / 320 px, TRƯỚC/SAU, bốn trạng thái (chưa nộp · nộp đạt · nộp
  không đạt · đã lưu chờ gửi lại) — dán trong mô tả PR

## Ghi chú cho người đến sau

- **Bẫy ảnh chụp đã mắc trong chính đợt này, ghi lại để khỏi mất thì giờ lần sau:** (1)
  `locator.boundingBox()` trả toạ độ **khung nhìn**, còn `screenshot({ fullPage, clip })` nhận toạ
  độ **tài liệu** — Playwright đã cuộn phần tử vào tầm nhìn khi click nên lấy thẳng `box.y` là cắt
  nhầm đầu trang; (2) ảnh `fullPage` ở màn hẹp bị thanh điều hướng dính đáy in đè vào giữa ảnh kèm
  dải trắng — đó là lỗi CỦA ẢNH, chụp khung nhìn sau khi `scrollIntoView` thì nhìn đúng.
- Hàng đợi được gửi lại từ `StemLessonView` với điều kiện `hasPendingEvidence(uid)` — hàng đợi
  rỗng thì KHÔNG có request nào rời trình duyệt, nên bất biến "mở bài không sinh evidence" vẫn giữ.
