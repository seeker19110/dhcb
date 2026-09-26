# 0347 — 2026-09-16 — S08-3: đáp án tự kiểm tra STEM sống qua reload

| Thuộc tính | Giá trị                                                                               |
| ---------- | ------------------------------------------------------------------------------------- |
| PR         | [#962](https://github.com/seeker19110/dhcb/pull/962)                                  |
| Đặc tả     | `docs/specs/2026-09-15-learning-ux-s08-khung-phien-resume.md` §9 mục 3 (AC-16, AC-17) |
| Goal       | `docs/goals/2026-09-15-learning-ux.md` dòng S08-3                                     |
| Nền        | S08-1 (#932) — `learningSession.ts` + `useLearningSession.ts` đã có trên `main`       |

## Việc đã làm

- `apps/dhcb/src/pages/learning/StemLessonView.tsx`: trạng thái `traLoi`/`ketQua` của `CauHoi`
  được **dời lên cha** thành một component mới `TuKiemTra` — một nguồn ghi cho đáp án của mọi câu.
  Nháp `{ answers, checked }` đi qua `useLearningSession` (khoá `dhcb_lsession_v1_*`), nên trả lời
  dở rồi reload thì đáp án còn nguyên.
- Kết quả đúng/sai **không được lưu**: nó được tính lại bằng `gradeAnswer` (hàm thuần, offline)
  cho đúng những câu đã bấm chấm. Nháp không bao giờ là bằng chứng hoàn thành.
- Câu tự luận giữ đúng hành vi cũ: gõ chữ thì bỏ kết quả cũ, chỉ chấm khi bấm "Kiểm tra" — kể cả
  sau khi khôi phục nháp.
- Trình duyệt chặn lưu nháp (Safari riêng tư) → có dòng `role="status"` nói thẳng "rời trang là
  mất phần đang gõ", trang vẫn học được bình thường.
- Nháp cũ của bài đã đổi đề (`stale`) bị bỏ **im lặng** — đúng §3.5: nháp STEM chỉ là chữ/chỉ số,
  không đáng làm phiền bằng một hộp hỏi.

## Quyết định: phần tab học CEFR HOÃN sang PR sau

`§9` mục 3 gộp STEM + tab học CEFR vào một PR, kèm điều kiện "sau S07-3 nếu S07-3 đổi
`CefrLevelPage`". Đo thật trên nhánh S07-3 đang mở:

```
git diff --stat origin/main claude/…-s07-3 -- apps/dhcb/src/pages/subjects/english/CefrLevelPage.tsx
  → 207 dòng đổi; hunk @@ -312,6 +321,108 @@ và @@ -340,32 +451,11 @@
```

Đúng vùng khai báo/điều phối `tab` và màn con `lesson`/`circle`/`dialogue` mà AC-18 phải sửa. Làm
song song là hai PR giẫm nhau trên cùng một file 1229 dòng. Vì vậy PR này giao **trọn phần STEM**;
AC-18/AC-19 (CEFR) tách sang một PR sau khi S07-3 merge.

## Bằng chứng kiểm chứng

- `npm run typecheck` ✅ (trên checkout đã `rm -rf packages/*/dist dist dist-server`)
- `npm run lint` ✅ 0 cảnh báo · `npx prettier --check .` ✅
- `npm run test:coverage` ✅ 13522 pass / 2 skip — Stmts 94.23 · Branch 90.13 · Func 94.70 ·
  Lines 94.75 (sàn 93/89/93/93)
- `apps/dhcb/src/pages/learning/StemLesson.test.tsx`: 10 ca cũ + **4 ca mới** (khôi phục đáp án +
  chấm lại · tự luận chưa chấm · owner khác không lộ nháp · storage bị chặn thì NÓI RA)
- E2E mới `e2e/learning-session-resume-stem.spec.ts` 3/3 ✅ — ca thứ 3 đếm khoá `localStorage`
  trước/sau và chốt **đúng 1 khoá thêm**, tiền tố `dhcb_lsession_v1_` (AC-17)
- `e2e/a11y.spec.ts` + `e2e/a11y-aaa.spec.ts` ✅ 0 vi phạm
- Tầng 8b: ảnh thật 1440 / 390 / 320 px, trước/sau, trước-và-sau-reload. Ảnh TRƯỚC sau reload:
  ô trắc nghiệm hết `aria-pressed`, ô tự luận về placeholder — mất trắng. Ảnh SAU sau reload:
  giống hệt ảnh trước reload.

## Ghi chú cho người đến sau

- File E2E đặt tên `learning-session-resume-stem.spec.ts` chứ không phải
  `learning-session-resume.spec.ts` như đặc tả §② ghi: PR S08-2 (bài Lập trình) đang chạy song
  song và cũng TẠO MỚI đúng tên đó — hai PR cùng thêm một file mới là xung đột add/add chắc chắn.
  Khi cả hai đã vào `main` thì gộp lại làm một file là việc rẻ.
- `apps/dhcb/src/lib/learningSession.ts` (từ #932) chứa **một ký tự NUL thật** làm dấu ngăn trong
  `contentFingerprint`, nên `git diff` coi file đó là nhị phân (`file` báo `data`). Không thuộc
  phạm vi PR này nên không sửa — ghi lại để đợt sau xử lý bằng escape unicode thay vì ký tự thật (CLAUDE.md mục 8).
