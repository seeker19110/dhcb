# 0354 — 2026-09-16 — S08-4: tab + màn con của trang cấp CEFR sống qua reload

| Thuộc tính | Giá trị                                                                               |
| ---------- | ------------------------------------------------------------------------------------- |
| PR         | [#985](https://github.com/seeker19110/dhcb/pull/985)                                  |
| Đặc tả     | `docs/specs/2026-09-15-learning-ux-s08-khung-phien-resume.md` §9 mục 3 (AC-18, AC-19) |
| Goal       | `docs/goals/2026-09-15-learning-ux.md` dòng S08-4                                     |
| Nền        | S08-1 (#932) khung phiên · S08-3 (#962) đã hoãn đúng hai AC này vì đụng S07-3         |

## Vì sao có đợt này

S08-3 làm phần STEM và **hoãn** AC-18/AC-19: lúc đó nhánh S07-3 đang đổi 207 dòng đúng vùng
`tab`/màn con của `CefrLevelPage.tsx`. S07-3 (#960) và S12-3 (#983) đã merge, vùng mã đó đã yên,
nên đợt này làm nốt.

## Việc đã làm

- `apps/dhcb/src/pages/subjects/english/CefrLevelPage.tsx`:
  - Tab đang mở không còn là `useState` cục bộ (mất sạch khi reload) mà là **nháp của khung phiên
    S08** (`useLearningSession`, khoá `dhcb_lsession_v1_*`, `contentId = cefr-level:<CẤP>`).
  - Màn con đang mở (vòng từ vựng · bài ngữ pháp) được ghi vào nháp dưới dạng **mã hoạt động**
    `{unitId, kind, contentId}` — KHÔNG lưu nội dung bài. Mở lại trang thì trang tự điều hướng
    tới `?unit=&hd=` bằng đúng hàm dựng URL dùng chung `duongDanHoatDongCefr` (một nguồn sự thật,
    Back/Forward và mục lục vẫn đúng).
  - Mã không còn trong dữ liệu cấp (bài bị gỡ/đổi mã) → **bỏ qua**, hiện màn danh sách như thường.
  - **URL thắng nháp**: còn `?tab=` hoặc `?unit=&hd=` trên URL thì URL quyết định — link "Học
    tiếp" ở Trang chủ và `?tab=&cap=` của `comeback.ts` không bị nháp cũ đè. Người học tự bấm một
    tab thì `?tab=` được gỡ khỏi URL (URL chỉ thắng lúc MỞ trang), `?cap=` giữ nguyên.
  - Nút tab có thêm `aria-pressed` — trước đây trạng thái "đang bật" chỉ nói bằng màu.
- `e2e/learning-session-resume.spec.ts`: thêm 3 ca CEFR (giữ tab qua reload · URL thắng nháp ·
  mở lại đúng bài ngữ pháp đã bấm từ danh sách).

## Ranh giới đã giữ (AC-19)

`git diff --stat` cho `apps/dhcb/src/lib/quizSession.ts` và `apps/dhcb/src/components/StudyTabs.tsx`
= **0 dòng**. Không khôi phục `idx` của tab "Hôm nay", không chạm tiến độ/evidence/API, không
migration.

## Chỗ cần biết

- Hội thoại cố tình KHÔNG ghi vào nháp: nó đè lên màn từ vựng, nên mở lại trang sẽ về đúng vòng
  từ vựng bên dưới (trừ khi hội thoại được mở bằng URL `?hd=dialogue:`, khi đó URL giữ nguyên).
- Phiên của trang cấp có `contentId = cefr-level:<CẤP>`; `resumeTarget` (S06) chỉ tra được
  contentId là mã vòng/bài nên **bỏ qua** phiên này — đúng ý: đây là vị trí trong giao diện, không
  phải một mục học để mời "Học tiếp".
