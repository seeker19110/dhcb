# Goal: Học tập liền mạch, có bằng chứng và giao diện xuất sắc

| Thuộc tính        | Giá trị                                                                                                       |
| ----------------- | ------------------------------------------------------------------------------------------------------------- |
| Goal ID           | GOAL-2026-0915-LEARNING-UX                                                                                    |
| Owner             | Chủ sản phẩm Đồng Hành; agent chính điều phối và review                                                       |
| Trạng thái        | ACTIVE — UX-R1/UX-R2 và R3-1 đã merge; R3-2 review PASS, full gate đang chạy trước PR                         |
| Bắt đầu           | 2026-09-15                                                                                                    |
| Target review     | Sau mỗi slice; chưa cam kết ngày phát hành toàn bộ                                                            |
| Quyền được cấp    | Research, branch, PR và auto-merge khi checks đạt; không bao gồm deploy thủ công hoặc production access       |
| Budget/guardrails | Một outcome/PR/agent; tối đa 3 lần sửa cùng lỗi; không paid provider, production data hoặc secrets trong test |

## 1. Outcome và Definition of Goal Complete

- Outcome: biết học gì, bắt đầu ngay, giữ được bài làm, nhận phản hồi đúng và quay lại đúng chỗ.
- Người dùng: khách và tài khoản; tiếng Anh, STEM, lập trình, toàn bộ môn/khóa có nội dung xuất bản.
- Metric baseline → target: baseline production chưa đo; không suy activation/retention từ audit giả lập. Luồng chuẩn Hôm nay → bài tối đa 2 thao tác; resume đúng activity/step/draft ở mọi ca nghiệm thu; 0 mất nháp/đếm trùng ở ma trận kiểm thử.
- Cửa sổ đo: kiểm tra kỹ thuật từng PR; đánh giá học trì hoãn 7/14 ngày và usability sau khi có bản thử được phép vận hành. Chưa có dữ liệu để kết luận hiệu quả học tăng.
- Guardrails: completion/mastery/quyền/billing do domain/server xác nhận; guest limits giữ nguyên; mục lục độc lập shellbar; không hồi quy theme/a11y/bundle.
- Completion approver: chủ sản phẩm sau evidence trên main và kiểm tra trải nghiệm; không gọi goal complete khi mới viết spec hoặc tạo PR.
- Thị giác: sáu màn mẫu có ảnh 390/768/1440px, kiểm tra 320px và năm theme; mỗi trục phân cấp, typography, bố cục, nhất quán, hoàn thiện đạt tối thiểu 4/5 qua review thiết kế.

## 2. Scope và non-goals

### In scope

- Góc học tập `/goc-hoc-tap`, tiếng Anh là môn; link và dữ liệu cũ được bảo toàn.
- Tin cậy hỏi nhanh; lỗi/dialog/renderer; onboarding theo ý định; Hôm nay; mục lục môn và khóa trong vùng nội dung.
- Phiên học, resume, đồng bộ có version, trợ giảng, kết quả và ôn lại có bằng chứng; nâng thị giác trên token hiện có.

### Không làm

- Viết lại payment/auth/guest mode, nâng 3D/WebGL, thay font toàn app hoặc hứa AI trả lời đúng tuyệt đối.
- Merge/deploy, sửa production hay dùng provider có phí khi chưa có quyền tương ứng.

## 3. Milestones và slices

Các mã S giữ liên kết kế hoạch cũ; thứ tự mới ưu tiên 0S → 01–04 → S07 trước S05/S06. S05–S13 đã có đặc tả riêng (2026-09-15, changelog 0328), đều **Approved for implementation** từ 2026-09-15 (chủ dự án chốt toàn bộ §7 theo đề xuất mặc định) → READY; S04 đi cùng từng slice. Làm tuần tự; mỗi PR giao một subagent và agent chính review diff/gate.

| ID  | Outcome/AC | Dependency | Spec | Issue | PR  | State | Evidence |
| --- | ---------- | ---------- | ---- | ----- | --- | ----- | -------- |

| S01 | Đặc tả, baseline và ma trận nghiệm thu | main hiện tại | [Nền](../specs/2026-09-15-learning-ux-foundation.md) | Chưa tạo | [#920](https://github.com/seeker19110/dhcb/pull/920) | MERGED | Đã vào main tại `46e7b54` |
| S02 | Hỏi nhanh trung thực, giữ câu hỏi/ngữ cảnh | S01 merged/approved | Nền §④ A | Chưa tạo | [#921](https://github.com/seeker19110/dhcb/pull/921) | MERGED | [0319](../changelog/0319-2026-09-15-hoi-nhanh-trung-thuc.md), main `2719790` |
| S03-1 | Subjects: lỗi tải nói thật, chống race | S02 | Nền §④ B (nhóm 1/3) | Chưa tạo | [#922](https://github.com/seeker19110/dhcb/pull/922) | MERGED | [0320](../changelog/0320-2026-09-15-danh-muc-mon-hoc-trang-thai-loi.md) |
| S03-2 | Dialog/bố cục mobile | S03-1 | Nền §④ B (nhóm 2/3) | Chưa tạo | [#923](https://github.com/seeker19110/dhcb/pull/923) | MERGED | [0321](../changelog/0321-2026-09-15-bo-cuc-mobile-khong-bi-thanh-nav-che.md) |
| S03-3 | Markdown/code; toán còn thiếu | S03-2 | Nền §④ B | Chưa tạo | [#924](https://github.com/seeker19110/dhcb/pull/924) | PARTIAL | main `f5beb7a1`; parser toán cần spec riêng |
| S04 | Tokens và thành phần sáu màn mẫu | Đi cùng từng slice | Cần spec nhỏ + prototype | Chưa tạo | — | BACKLOG | Chưa có |
| S05 | Bắt đầu theo ý định, thống nhất hub | S06 + spec | [S05](../specs/2026-09-15-learning-ux-s05-bat-dau-theo-y-dinh.md) (Approved for implementation) | S05-1 [#939](https://github.com/seeker19110/dhcb/pull/939) · S05-2 [#953](https://github.com/seeker19110/dhcb/pull/953) | changelog `0334` (S05-1) · `0342` (S05-2) · migration `0082` · chunk 5,38 kB gzip | S05-1 MERGED · S05-2 PR mở, chờ CI | Chốt §7 theo mặc định 2026-09-15; migration lấy số `0082` theo thứ tự merge thật (`0081` đã bị S11 chiếm); S05-2 hợp nhất danh mục môn hub+app qua `SUBJECT_ENTRIES` |
| S06 | Hôm nay, điểm học tiếp | S08 + spec | [S06](../specs/2026-09-15-learning-ux-s06-hom-nay-hoc-tiep.md) (Approved for implementation) | Chưa tạo | — | READY | Chốt §7 theo mặc định 2026-09-15; nguồn "Học tiếp": `listResumableSessions` (`apps/dhcb/src/lib/learningSession.ts`, S08-1) |
| S06-1 | Hợp đồng `TodayPlan` + resolver Hôm nay | S07-1 + S08-1 | [S06](../specs/2026-09-15-learning-ux-s06-hom-nay-hoc-tiep.md) (Approved for implementation) | Chưa tạo | — | DONE | [0337](../changelog/0337-2026-09-16-s06-1-hop-dong-today-plan-va-resolver.md) — 0 đổi giao diện |
| S06-2 | Thẻ "Hôm nay" ở Trang chủ (một CTA) | S06-1 | [S06](../specs/2026-09-15-learning-ux-s06-hom-nay-hoc-tiep.md) (Approved for implementation) | [#952](https://github.com/seeker19110/dhcb/pull/952) | E2E `today-plan` 5/5 · a11y 347/347 · ảnh 4 bề rộng × 3 trạng thái | MERGED | [0338](../changelog/0338-2026-09-16-s06-2-the-hom-nay-o-trang-chu.md) — bỏ hai lối `/lo-trinh-hoc` hard-code |
| S06-3 | Trang môn dùng chung resolver "học tiếp" | S06-2 | [S06](../specs/2026-09-15-learning-ux-s06-hom-nay-hoc-tiep.md) (Approved for implementation) | [#964](https://github.com/seeker19110/dhcb/pull/964) | E2E 43/43 (thêm 2 ca đa môn) · a11y 472/472 · coverage 94,28/90,18/94,79/94,79 · ảnh 1440/390/320 trước-sau trùng kích thước | REVIEW | [0348](../changelog/0348-2026-09-16-s06-3-trang-mon-dung-chung-resolver.md) — `pickNextLesson` không còn trong `pages/`; `CefrLevelPage:621` giữ `findNextStep` (cách dùng khác, có lý do đo được); sửa `dongNguon` nuốt tên môn thứ hai |
| S07-1 | Hợp đồng `OutlineNode` + adapter 3 môn | 02–04 đã merge (#929) | [S07](../specs/2026-09-15-goc-hoc-tap-07-muc-luc-mon-khoa.md) (Approved for implementation) | Chưa tạo | [#933](https://github.com/seeker19110/dhcb/pull/933) | DONE | [0330](../changelog/0330-2026-09-15-s07-1-hop-dong-muc-luc-va-adapter.md) |
| S07-2 | Rail/panel mục lục Lập trình + STEM | S07-1 | [S07](../specs/2026-09-15-goc-hoc-tap-07-muc-luc-mon-khoa.md) (Approved for implementation) | Chưa tạo | — | DONE | [0335](../changelog/0335-2026-09-15-s07-2-muc-luc-mon-khoa-lap-trinh-stem.md) |
| S07-3 | Mục lục cấp CEFR môn Tiếng Anh | S07-2 | [S07](../specs/2026-09-15-goc-hoc-tap-07-muc-luc-mon-khoa.md) (Approved for implementation) | Chưa tạo | [#960](https://github.com/seeker19110/dhcb/pull/960) | DONE | [0342](../changelog/0342-2026-09-16-s07-3-muc-luc-cap-cefr.md) — `?unit=&hd=` + `activeNodeId` |
| S08-1 | Khung phiên `LearningSession` + hook | — (merge độc lập) | [S08](../specs/2026-09-15-learning-ux-s08-khung-phien-resume.md) (Approved for implementation) | Chưa tạo | [#932](https://github.com/seeker19110/dhcb/pull/932) | DONE | [0331](../changelog/0331-2026-09-15-s08-1-khung-phien-hoc.md) — 0 đổi giao diện |
| S08-2 | Nháp/bước bài Lập trình sống qua reload | S08-1 + S07-2 | [S08](../specs/2026-09-15-learning-ux-s08-khung-phien-resume.md) (Approved for implementation) | Chưa tạo | [#961](https://github.com/seeker19110/dhcb/pull/961) | DONE | [0343](../changelog/0343-2026-09-16-s08-2-nhap-bai-lap-trinh.md) — hook thêm `paused`; ảnh Tầng 8b bắt lỗi nền dính `Modal` che dòng đầu |
| S08-3 | Resume STEM (phần tab học CEFR hoãn) | S08-1 | [S08](../specs/2026-09-15-learning-ux-s08-khung-phien-resume.md) (Approved for implementation) | [#962](https://github.com/seeker19110/dhcb/pull/962) | E2E `learning-session-resume-stem` 3/3 · a11y 455/455 · `StemLesson.test.tsx` 14 ca · ảnh 1440/390/320 trước-sau | REVIEW | [0347](../changelog/0347-2026-09-16-s08-3-resume-tu-kiem-tra-stem.md) — AC-18/AC-19 (tab học CEFR) TÁCH sang PR sau: lúc thi hành, nhánh S07-3 đổi 207 dòng đúng vùng `tab`/màn con của `CefrLevelPage.tsx` |
| S08-4 | Tab + màn con trang cấp CEFR sống qua reload | S08-1 + S07-3 | [S08](../specs/2026-09-15-learning-ux-s08-khung-phien-resume.md) (Approved for implementation) §9 mục 3 (AC-18, AC-19) | Chưa tạo | [#985](https://github.com/seeker19110/dhcb/pull/985) · E2E resume CEFR 3/3 · a11y 492/492 · coverage 94.13/90.03/94.51/94.65 · ảnh 1440/390/320 trước-sau | REVIEW | [0354](../changelog/0354-2026-09-16-s08-4-resume-tab-cap-cefr.md) — phần đuôi S08-3 đã hoãn; `quizSession.ts`/`StudyTabs.tsx` 0 dòng đổi (AC-19) |
| S09-1 | Version đơn điệu + idempotency (server) | — (merge độc lập) | [S09](../specs/2026-09-15-learning-ux-s09-dong-bo-version-retry-xung-dot.md) §9 mục 1 (AC-1…AC-7) | Chưa tạo | [#940](https://github.com/seeker19110/dhcb/pull/940) | REVIEW | [0334](../changelog/0334-2026-09-15-s09-1-version-idempotency-dong-bo.md) — migration 0083, 0 đổi giao diện |
| S09-2 | Outbox client: retry, gộp, hai tab, hết auth | S09-1 | [S09](../specs/2026-09-15-learning-ux-s09-dong-bo-version-retry-xung-dot.md) §9 mục 2 (AC-8…AC-17) | Chưa tạo | [#984](https://github.com/seeker19110/dhcb/pull/984) | REVIEW | [0353](../changelog/0353-2026-09-16-s09-2-outbox-dong-bo-tien-do.md) — `syncOutbox.ts`, xoá `offlineStore.ts`, sửa F1/F4/F5 |
| S08-5 | Đẩy nháp `LearningSession` lên server (cho S09-3 xuyên thiết bị) | S08-1..4 đã ship | **CHƯA CÓ** — cần viết đặc tả mới (endpoint, có/không migration, chu kỳ đẩy) trước khi code | Chưa tạo | — | SPEC | [2026-09-21] Chủ dự án chốt MỞ RỘNG (xem `docs/specs/2026-09-15-learning-ux-s08-khung-phien-resume.md` §0 + `docs/specs/2026-09-15-learning-ux-s09-dong-bo-version-retry-xung-dot.md` §7 Q5). Không sửa lại S08-1..4 đã ship. |
| S09-3 | ConflictRecord + hộp thoại hỏi người học | S09-1 + S08-5 | [S09](../specs/2026-09-15-learning-ux-s09-dong-bo-version-retry-xung-dot.md) §9 mục 3 (AC-18…AC-20) | Chưa tạo | — | BLOCKED | [2026-09-21] Không còn treo ở QUYẾT ĐỊNH (đã chốt mở rộng) — nay treo ở THI HÀNH: chờ đặc tả S08-5 được Approved for implementation rồi mới code |
| S10-1 | Sửa 6 lỗi lifecycle voice/AI trước | — (merge độc lập) | [S10](../specs/2026-09-15-learning-ux-s10-tro-giang-trong-bai-voice.md) §④ Phần 1 (AC-1…AC-6) | Chưa tạo | [#934](https://github.com/seeker19110/dhcb/pull/934) | DONE | [0332](../changelog/0332-2026-09-15-s10-1-sua-lifecycle-companion.md) — 8 ca đỏ trước / xanh sau |
| S10-2 | Trợ giảng trong bài (chữ) | S10-1 + S07-2 (3 trang bài) | [S10](../specs/2026-09-15-learning-ux-s10-tro-giang-trong-bai-voice.md) (Approved for implementation) | Chưa tạo | — | READY | Chờ S07-2 merge (cùng 3 trang bài) |
| S10-3 | Voice thật trong bài | S10-2 | [S10](../specs/2026-09-15-learning-ux-s10-tro-giang-trong-bai-voice.md) (Approved for implementation) | Chưa tạo | — | READY | Sau S10-2 |
| S11 | Completion evidence và kết quả | S08 + domain spec | [S11](../specs/2026-09-15-learning-ux-s11-completion-evidence.md) (Approved for implementation) | Chưa tạo | S11-1: changelog 0333 · S11-2 [#964](https://github.com/seeker19110/dhcb/pull/964) · S11-3 [#969](https://github.com/seeker19110/dhcb/pull/969) | DONE (3/3 slice) | S11-1 nền tảng (hợp đồng + migration 0081 + `POST /api/learning/evidence`) — [0333](../changelog/0333-2026-09-15-s11-1-completion-evidence-nen-tang.md); S11-2 client STEM + khách + hàng đợi — [0348](../changelog/0348-2026-09-16-s11-2-evidence-stem-client.md); S11-3 màn kết quả `ActivityResult` + mục lục đọc evidence — [0351](../changelog/0351-2026-09-16-s11-3-man-ket-qua-va-muc-luc-evidence.md) |
| S12-1 | Hàng đợi ôn xuyên môn + thẻ SRS STEM + hub | S07-1 | [S12](../specs/2026-09-15-learning-ux-s12-on-lai-so-loi-tien-do.md) §9 mục 1 (Approved for implementation) | Chưa tạo | [#951](https://github.com/seeker19110/dhcb/pull/951) | IN REVIEW | [0341](../changelog/0341-2026-09-16-s12-1-hang-doi-on-xuyen-mon.md) — golden snapshot SRS chụp ở commit đầu; nhóm STEM chưa có thẻ tới khi S11-3 gọi `addStemLessonCardsToSrs` |
| S12-2 | Sổ lỗi có bằng chứng (migration `0084` + view từ evidence S11) | S12-1 + S11-1 | [S12](../specs/2026-09-15-learning-ux-s12-on-lai-so-loi-tien-do.md) §9 mục 2 (Approved for implementation) | Chưa tạo | [#981](https://github.com/seeker19110/dhcb/pull/981) | IN REVIEW | [0352](../changelog/0352-2026-09-16-s12-2-so-loi-co-bang-chung.md) — `migrate:pg` chạy 2 lần lũy đẳng; sổ lỗi STEM không có bảng riêng |
| S12-3 | Tiến độ theo môn chỉ từ evidence trên `/tien-do` | S12-2 + S07-1 | [S12](../specs/2026-09-15-learning-ux-s12-on-lai-so-loi-tien-do.md) §9 mục 3 (Approved for implementation) | Chưa tạo | [#983](https://github.com/seeker19110/dhcb/pull/983) | IN REVIEW | [0353](../changelog/0353-2026-09-16-s12-3-tien-do-theo-mon.md) — a11y AA+AAA 10/10 trên `/tien-do` (5 theme), ảnh 1440/390/320 trước-sau; không migration |
| S13 | Responsive/theme/hiệu năng/rollout | S12 | [S13](../specs/2026-09-15-learning-ux-s13-responsive-theme-hieu-nang-rollout.md) (Approved for implementation) | Chưa tạo | — | READY | Chốt §7 theo mặc định 2026-09-15 |
| S13-1 | Công cụ chụp 6 màn + cổng bố cục 4 bề rộng (0 đổi giao diện) | S12 | [S13](../specs/2026-09-15-learning-ux-s13-responsive-theme-hieu-nang-rollout.md) §④ S13-1 (AC-1…AC-7) | Chưa tạo | [#987](https://github.com/seeker19110/dhcb/pull/987) | REVIEW | [0355](../changelog/0355-2026-09-16-s13-1-cong-cu-chup-va-cong-bo-cuc.md) — layout 24/24 · states 76 ca (0 vi phạm mới) · shots 25/25 · codemap cycles sạch; cổng tìm ra 2 nợ THẬT cho S13-2: `aria-prohibited-attr` ở `TodayCard.tsx:74` (trạng thái tải) + 10 ô đoạn văn > 80 ký tự/dòng ở ≥ 768 |
| S13-2 | Sửa hồi quy audit cuối tìm ra (AC-9…AC-12) | S13-1 | [S13](../specs/2026-09-15-learning-ux-s13-responsive-theme-hieu-nang-rollout.md) §④ S13-2 (AC-9…AC-12) | Chưa tạo | [#995](https://github.com/seeker19110/dhcb/pull/995) | REVIEW | [0358](../changelog/0358-2026-09-17-s13-2-sua-hoi-quy-audit-cuoi.md) — hai nợ S13-1 đã đóng: `aria-prohibited-attr` 1 → **0** (xoá hẳn `NO_AA`), đoạn văn > 80 ký tự/dòng **126 → 3** (xoá hẳn `BASELINE_KY_TU`). Thêm: cổng S13-1 đo nhầm khung Suspense ở 320/390 (đỏ giả + xanh giả) đã sửa ở `moManHinh`; reduced-motion toàn cục chưa từng tồn tại, nay có + 6 ca canh. **AC-8 CHƯA làm** — chủ dự án chấm |

### Chặng tái cấu trúc ưu tiên

| ID  | Outcome                                 | Dependency              | State    | Spec / bằng chứng                                                                      |
| --- | --------------------------------------- | ----------------------- | -------- | -------------------------------------------------------------------------------------- |
| 0S  | Đặc tả kiến trúc và reconcile goal      | main f5beb7a1           | REVIEWED | [Spec 0S](../specs/2026-09-15-goc-hoc-tap-architecture.md), root approve 01; chờ merge |
| 01  | Đổi tên/route Góc học tập               | 0S merge                | WAITING  | Spec 0S Approved chỉ 01                                                                |
| 02  | English ngang hàng môn, bỏ studio riêng | 01 + spec bổ sung merge | BACKLOG  | Inventory route/host/auth/storage trước source                                         |
| 03  | Công cụ English trong môn               | 02 + spec bổ sung merge | BACKLOG  | Inventory component/API/context                                                        |
| 04  | Platform không default English          | 03 + spec bổ sung merge | BACKLOG  | Hợp đồng thiếu context và legacy adapter                                               |

### Chặng clarity-first hiện hành

| ID    | Outcome                                       | Dependency          | State   | Spec / bằng chứng                                                                           |
| ----- | --------------------------------------------- | ------------------- | ------- | ------------------------------------------------------------------------------------------- |
| UX-R1 | Tin cậy async/touch nền `/tien-do`            | Foundation approved | MERGED  | PR #1020 · changelog 0367                                                                   |
| UX-R2 | Home progressive disclosure                   | UX-R1               | MERGED  | PR #1021 spec · PR #1022 source · changelog 0369                                            |
| UX-R3 | Tiến độ progressive disclosure                | UX-R2               | ACTIVE  | [Spec UX-R3](../specs/2026-09-18-ui-clarity-dashboard-progressive-disclosure.md) — Approved |
| R3-1  | Async truth/retry + bốn rejected loader cache | UX-R3 spec merge    | MERGED  | PR #1024 · main `2cc505f0` · changelog 0371                                                 |
| R3-2  | Responsive state/focus/calendar               | R3-1 merge          | VERIFY  | Candidate: review PASS 0/0/0; component 21/21, calendar E2E 11/11; full gate chưa chốt      |
| R3-3  | Hierarchy + “Tuần này” có scope English       | R3-2 merge          | WAITING | P2-10 superseded; calendar embedded, không card lồng                                        |
| R3-4  | English progressive disclosure + 28 evidence  | R3-3 merge          | WAITING | Final target 320/390/1440                                                                   |
| UX-R4 | Taxonomy/header/navigation nhất quán          | UX-R3 complete      | BACKLOG | Cần spec riêng                                                                              |

## 4. Risk register

| Risk                         | Trigger/guardrail                          | Mitigation/rollback                                                                   | Owner              | State          |
| ---------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------- | ------------------ | -------------- |
| Khách bị đưa vào API private | Companion không phải API thử guest         | Giữ câu hỏi qua login hoặc đích hỗ trợ guest; không auto-send                         | Kỹ thuật           | Mở             |
| Mất bài/ghi đè tiến độ       | Hai tab, timeout sau server commit         | Version/idempotency và test trước S09; rollback UI giữ dữ liệu                        | Kỹ thuật           | Mở             |
| AI trở thành authority       | Click/AI text tăng completion/mastery      | Domain evidence; chưa đo thì ghi chưa đo                                              | Kỹ thuật + môn học | Mở             |
| Spec cũ không khớp main      | #919 thêm guest sau audit                  | Reconcile từng vòng từ main                                                           | Agent chính        | Đang kiểm soát |
| Merge tự phát hành           | Workflow deploy main                       | Chỉ auto-merge khi review/checks đạt; deploy ngoài phạm vi và không được tự thực hiện | Agent chính        | Đang kiểm soát |
| Đẹp nhưng không học tốt      | Chỉ review screenshot                      | Phiên tiếng Anh/Toán, mục lục khóa lập trình, test gián đoạn và thử người dùng        | Thiết kế + môn học | Mở             |
| Retry UX-R3 giả              | Một trong bốn promise cache vẫn giữ reject | Reset có identity guard ở outer + ba loader; fake-fetch từng tài nguyên               | R3-1               | Contract duyệt |
| “Tuần này” bị hiểu là đa môn | Streak/activity English thiếu scope        | Label English + programming-only fixture; không đổi thuật toán                        | R3-3               | Contract duyệt |
| Resize làm mất focus/state   | Auto disclosure theo breakpoint            | Calendar/English chỉ user toggle; một DOM; test 1024/1280 và conditional focus        | R3-2/R3-4          | Contract duyệt |

## 5. Current truth

> Reconcile mới nhất 2026-09-18 ở `main@2cc505f0` thay cho snapshot cũ bên dưới khi hai phần mâu
> thuẫn. Iteration log cũ được giữ nguyên làm lịch sử, không phải trạng thái hiện hành.

- PR #1024 đã merge R3-1 tại `2cc505f0`: keyed async truth/retry, Zod boundary và bốn rejected
  loader cache đã vào main; changelog 0371 giữ evidence của slice này.
- PR #1023 đã merge đặc tả UX-R3 tại `b413e04f`; bốn source slice R3-1→R3-4 được phép thi hành
  tuần tự. R3-2 hiện là candidate, chưa merge và chưa phải main truth.
- PR #1022 đã merge source UX-R2. Candidate canonical trở thành main truth: Home cao
  1.663/1.581/1.423px ở 320/390/1440, đúng một entry Tiến độ trong content, prompt collapsed trên
  mobile; changelog 0369 giữ evidence hash và gate.
- PR #1020 đã merge UX-R1: calendar/CTA đạt vùng chạm mobile 44px; storage/Web Push có failure
  state và retry; review độc lập cuối PASS 0 critical · 0 major · 0 minor. Required checks đã
  xanh trước auto-merge; bằng chứng chi tiết ở changelog 0367.
- PR #1018 đã merge; quality, unit/build/type/lint/format và 6 shard E2E xanh. Canonical URL cho
  Lập trình/Tiếng Anh cùng server/SEO (lệnh 10–12) đã vào main; nginx production và Search Console
  vẫn là việc vận hành thủ công.
- Chuỗi redesign cũ đã merge 12/15 lát. P2-10 nay được UX-R3 supersede; P2-12 chưa được duyệt và
  P2-11 vẫn phụ thuộc P2-12.
- Baseline audit lịch sử: Trang chủ thành viên 2.027px và `/tien-do` 3.421px ở viewport 390px.
  Baseline canonical UX-R3 hiện hành được ghi riêng bên dưới, không tái sử dụng số lịch sử này.
- Sản phẩm hiện có đúng ba theme: `dark-blue`, `blue-sky`, `kid`. Chủ dự án chọn giữ ba theme;
  không phục hồi `pink`/`vibrant`.
- Spec [UI clarity foundation](../specs/2026-09-18-ui-clarity-foundation.md) và [UX-R2 Home
  progressive disclosure](../specs/2026-09-18-ui-clarity-home-progressive-disclosure.md) đã thi
  hành. [Spec UX-R3](../specs/2026-09-18-ui-clarity-dashboard-progressive-disclosure.md) đã
  **Approved for implementation** theo bốn source slice tuần tự sau khi PR docs merge.
- Baseline UX-R3 `/tien-do` hiện hành là 3.722/3.527/2.195px ở 320/390/1440; target cuối
  ≤2.300/≤2.100/≤1.450px, CLS <0,1, ma trận 28 case trên ba theme.
- Quyết định A đã chốt: không tạo `ProgressStory` độc lập; P2-10 được supersede, narrative gộp
  vào “Tuần này”. Source dự kiến tuần tự R3-1 async → R3-2 responsive → R3-3 hierarchy → R3-4
  English disclosure; không parallel vì cùng chạm Dashboard.
- Adversarial review vòng 1 nêu sáu finding; spec đã sửa theo đủ loader thật và fake-fetch retry,
  semantics quota null/0 + Zod, scope English cho “Tuần này”, focus có điều kiện, calendar explicit
  collapsed state qua breakpoint và embedded presentation. Vòng 2 còn 0 critical · 2 major; đã
  bổ sung fallback focus theo panel mở/đóng và recovery delay ≥600ms monotonic + observer flush.
  Review vòng 3 PASS 0 critical · 0 major · 0 minor; mọi finding đã đóng trong contract.
- Candidate R3-2 dùng một DOM tree, một QuickActions/calendar instance, calendar đóng mặc định
  và giữ disclosure/selection/focus qua breakpoint. Key tuần ổn định giữ cả ngày ở partial week;
  uncontrolled lưu ngày đã clamp; animation calendar có reduced-motion.
- Review R3-2 vòng 3 **PASS 0 critical · 0 major · 0 minor**. Kiểm độc lập trên candidate:
  component **2 file / 21 test PASS**, calendar E2E **11/11 PASS** (axe ba theme, 44px/overflow,
  focus/resize/dialog và cuộn trên layout thật), `git diff --check` PASS. Complete gate và bằng
  chứng thị giác đang được agent chính kiểm, **chưa chốt**; không dùng kết quả R3-1 thay cho R3-2.
- Checkpoint trước khi dừng/chạy tiếp: đọc lại mục này, reconcile current main/PR/checks và cập
  nhật bằng chứng mới; không suy completion từ lịch sử chat.
- Next best slice: hoàn tất full gate/evidence R3-2, mở PR và auto-merge khi required checks xanh;
  reload main rồi giao R3-3 hierarchy + “Tuần này” có scope English.
- Quyền cần thêm: không cần cho docs review/branch/PR/auto-merge; cần riêng nếu deploy thủ công hoặc truy
  cập production.

- Main đã đối chiếu: `f5beb7a1d7d044232b686301e1cb2b0010535a65` (#924). #920–#924 đã merge; [deploy thành công](https://github.com/seeker19110/dhcb/actions/runs/34946596471).
- Markdown/code, lỗi SubjectDetail và skip link landing đã sửa #924. Công thức toán còn thiếu; StrictMode nạp lịch sử Companion và nhãn animation mobile còn mở trong PROGRESS.
- Quyết định mới: **Góc học tập `/goc-hoc-tap`**, tiếng Anh ngang hàng môn học, không còn là không gian platform; giữ dữ liệu và link cũ. [Spec 0S](../specs/2026-09-15-goc-hoc-tap-architecture.md) đã được root review cho 01, hiệu lực sau merge; 02–04 cần spec bổ sung.
- Thứ tự: 0S → 01 đổi route/nhãn → 02 tích hợp English → 03 công cụ theo môn → 04 bỏ default English → S07 mục lục (lập trình, STEM, English) → S08 resume → S06/S05 Home/onboarding → S10 tutor/voice (sửa lifecycle trước) → S11 completion → S09 sync → S12 ôn tập → S13 final audit. S04 thiết kế đi cùng từng slice. Renderer toán không bị bỏ khỏi backlog.
- Next best slice: merge 0S đã review, rồi 01. Không source trước spec Approved và merge.
- Quyền cần thêm: không cần hỏi lại cho push/auto-merge/deploy trong phạm vi đã cấp. Không có quyền dùng secrets/paid provider/production data trong test hoặc đổi DNS.
- Goal gap: chưa có mục lục toàn catalog, continuity/evidence chưa hoàn chỉnh, chưa đo metric sản phẩm. Audit ở `80c2b416` chỉ là frontend local mock, không chứng minh production.

## 6. Iteration log

### Iteration 1 — 2026-09-15

- State: SPEC.
- Slice: S01.
- Goal gap trước/sau: kế hoạch ngoài repo → goal/spec trong repo; trải nghiệm chưa đổi.
- Research/spec/issue/PR: spec nền liên kết ở trên; issue chưa tạo; PR [#920](https://github.com/seeker19110/dhcb/pull/920), đang chờ CI và quyền merge/phát hành.
- Thay đổi: 3 tài liệu; không source, schema hay dependencies.
- Validation và test count: Node22.23.2 Prettier check ba file PASS; git diff --check PASS. Không chạy runtime test cho docs-only; không reuse test count cũ.
- Metric/guardrail: chưa đo metric sản phẩm; giữ toàn bộ bất biến và guest mode.
- Quyết định: tuần tự một agent/PR; technical review riêng với phê duyệt hướng sản phẩm.
- Blocker: chờ merge spec; review S03 trở đi chưa hoàn tất.
- Next best slice: S02.
- Quyền cần thêm: merge/deploy trước khi tích hợp vào main.

### Iteration 2 — 2026-09-15

- State: IMPLEMENT.
- Slice: S03-1 (PR #922), sau khi S02 (#921) merge vào `main`.
- Goal gap trước/sau: `/mon-hoc` biến mọi lỗi tải thành màn hình "chưa có môn học nào" → lỗi tải
  nay nói đúng chuyện đã xảy ra, thử lại được, và response cũ không ghi đè bộ lọc đang chọn.
- Research/spec/issue/PR: đặc tả nền §④ B nhóm 1/3; issue chưa tạo; PR
  [#922](https://github.com/seeker19110/dhcb/pull/922).
- Thay đổi: 3 file source + 2 file test mới + 1 changelog. Không schema, migration hay dependency.
- Validation và test count: Node22.22.2 — build/typecheck/lint/format PASS;
  `npm run test:coverage` 605 file / 12493 test PASS; `e2e/subjects-catalog-states.spec.ts` 14/14.
  Bằng chứng test bắt được lỗi cũ: trả `Subjects.tsx` về bản `main` → 6/8 ca đỏ.
- Metric/guardrail: chưa đo metric sản phẩm. `/api/subjects` giữ nguyên là endpoint công khai,
  không thêm auth; không đụng billing/entitlement/mastery/hạn mức khách; a11y AA + AAA có thêm
  màn lỗi vào cổng, 5 theme.
- Quyết định: tách S03 làm ba slice. Prop `hint` của `LoadError` là thay đổi thuần bổ sung, mặc
  định giữ đúng chữ cũ cho 8 nơi đang dùng.
- Blocker: không có.
- Next best slice: S03-2.
- Quyền cần thêm: người dùng đã cho phép merge #921 và #922 khi CI xanh (phiên 15/09).

### Iteration 4 — 2026-09-15

- State: IMPLEMENT.
- Slice: S03-2 — bố cục mobile không bị thanh điều hướng đáy che (PR #923), sau khi #922 merge.
- Goal gap trước/sau: AC §④ B gạch 2 (390×844 và 320px) KHÔNG có phép đo nào canh → có cổng
  `e2e/mobile-layout-guards.spec.ts` (6 test) và 7 file được sửa lề dưới.
- Thay đổi: 7 file source (mỗi file một lớp CSS + chú thích lý do), 1 file E2E mới. Không schema,
  migration, dependency, không đụng billing/entitlement/guest limits.
- Validation: cổng viết trước → 6/6 ĐỎ trên mã cũ, liệt kê đúng 6 mục cần sửa; sau khi sửa 6/6
  xanh. Ảnh 1440/390/320 trước-sau; ảnh 1440px giống hệt từng điểm ảnh (md5) nên desktop không
  bị chạm. Chạy lại toàn bộ cổng a11y vì bản sửa tăng lề dưới ở 4 trang trụ — đúng thao tác từng
  gây 3 vi phạm `target-size` ở Companion.tsx.
- Metric/guardrail: chưa đo metric sản phẩm. Guardrail: desktop bất biến (bằng chứng md5 ảnh
  1440px); `--bnav-h` đã bằng 0 từ 1024px nên bản sửa là thay đổi thuần mobile.
- Quyết định: cổng dùng HAI phép đo (bất biến lề — không phụ thuộc nội dung; bấm được thật —
  `elementFromPoint`), vì phép đo hành vi một mình đã báo nhầm 4 trang trụ là "sạch" khi dữ liệu
  mock còn ngắn. `/dong-hanh` là ngoại lệ có chủ đích, ghi lý do đo được ngay trong cổng.
- Phát hiện ngoài dự kiến: phần lớn AC gạch 1–2 đã đạt sẵn (15 hộp thoại sạch ở cả hai bề rộng,
  6 hành vi bàn phím có unit test đủ, không còn overlay cũ sau #921) — ghi vào changelog 0321 để
  đợt sau khỏi đo lại. Lỗi thật nằm ở chỗ không ai ngờ: nút CTA của trang landing.
- Nợ mới ghi nhận: `Landing.tsx`/`LandingEn.tsx` thiếu `id={MAIN_CONTENT_ID}` nên liên kết "Bỏ
  qua tới nội dung chính" đứt lặng lẽ ở hai trang đó. Khác họ lỗi, chưa sửa.
- Blocker: không.
- Next best slice: S03-3 (renderer an toàn) — bắt đầu bằng review dependency, không bằng mã.

### Iteration 5 — 2026-09-15 — reconcile và kiến trúc mới

- State: SPEC; slice 0S; base `f5beb7a1`.
- Cập nhật current truth theo #923/#924; giữ iteration log cũ là lịch sử quyền tại thời điểm đó, không phải yêu cầu xin lại quyền hiện nay.
- Quyết định: canonical path `/goc-hoc-tap`, host theo cấu hình sẵn; giữ origin hoạt động và key dữ liệu. Không đổi DNS, không gom hoạt động qua origin khi chưa có spec.
- Bằng chứng: docs-only, validation ghi trong changelog 0323; chưa có test runtime mới hoặc metric mới.
- Next: 01 sau review/merge spec; 02–04 cần discovery/spec bổ sung.

### Iteration 6 — 2026-09-18 — clarity-first audit và quyết định theme

- State: SPEC → READY.
- Slice: UX-R1 reliability + touch foundation cho `/tien-do`.
- Goal gap trước/sau: phản hồi “giao diện rối” chưa có baseline hiện hành → có ảnh thật, audit độc
  lập và spec nhỏ; source chưa đổi.
- Research/spec/issue/PR: [UI clarity foundation](../specs/2026-09-18-ui-clarity-foundation.md);
  issue/PR điền sau.
- Evidence: ảnh ngoài repo ở 390/1440; chiều cao Trang chủ 2.027/1.395px và Tiến độ
  3.421/2.195px; audit 3 luồng độc lập.
- Metric/guardrail: ba theme hiện hành; AAA nội dung, AA control, vùng chạm mobile 44px; không API,
  schema, migration, paid provider hay production data.
- Quyết định: phương án A — giữ `dark-blue`, `blue-sky`, `kid`; hoãn P2-10 để không thêm clutter.
- Blocker: không còn blocker cho UX-R1.
- Next best slice: merge spec, reload main, rồi thi hành UX-R1 trong PR source riêng.
- Quyền cần thêm: không; auto-merge chỉ khi required checks xanh.

### Iteration 7 — 2026-09-18 — UX-R1 merged, đặc tả UX-R2 Trang chủ

- State: VERIFY UX-R1 → SPEC UX-R2.
- Slice: UX-R2 progressive disclosure cho member Home ở 320/390px; desktop 1440 giữ chức năng.
- Goal gap trước/sau: UX-R1 đã merge #1020 nhưng Trang chủ data vẫn cao baseline 2.027px ở 390px
  và nhiều control phụ render đồng thời → có hợp đồng giảm nhiễu đo được, source chưa đổi.
- Research/spec/PR: [UX-R2 Home progressive disclosure](../specs/2026-09-18-ui-clarity-home-progressive-disclosure.md);
  PR docs điền sau.
- Evidence: `main@806e77c0`; changelog 0367 xác nhận review cuối UX-R1 PASS và required CI là
  release gate. Baseline Home từ manifest ảnh ngoài repo của clarity audit.
- Metric/guardrail: target Home ≤1.700px ở 390, ≤1.850px ở 320; đúng một entry Tiến độ; prompt
  chips collapsed; AAA nội dung, AA control, 44px; ba theme hiện hành.
- Quyết định tại checkpoint trước final: scope đúng bốn runtime file; UX-R3/R4/P2-10 là non-goal.
  Spec khi đó Review pending, chưa tự phê duyệt. Vòng 1 BLOCK 2 critical · 7 major · 2 minor;
  D1–D10 đã
  đóng trong bản sửa. Re-review vòng 2 BLOCK 2 critical · 4 major · 1 minor; D11–D14 cùng hợp đồng
  DOM subject/evidence B/CLS/error fixture đã cập nhật. Vòng 3 BLOCK 1 critical · 1 major; D15 và
  hợp đồng container always-mounted/HTML hidden/focus-resize đã cập nhật, chờ review lại.
- Final review: PASS 0 critical · 0 major · 0 minor. Theo mandate giao subagent từng PR cho tới
  khi hoàn thành, trạng thái đổi thành Approved for implementation — chỉ UX-R2.
- Blocker: không còn product/spec blocker; source vẫn chờ spec merge theo delivery loop.
- Next best slice: merge spec, reload main, giao worker source UX-R2 và chạy đủ gate/evidence.
- Quyền cần thêm: không cần thêm cho docs PR/auto-merge; deploy vẫn ngoài phạm vi.

### Iteration 8 — 2026-09-18 — thi hành và verify UX-R2

- State: IMPLEMENT → VERIFY; slice UX-R2 source trên base spec đã merge `809ee3a4`.
- Goal gap trước/sau: Home canonical 320/390 cao 2.082/1.906px, hai entry Tiến độ và năm chip
  focusable sẵn → candidate còn 1.663/1.581px, đúng một entry và 0 chip trước disclosure;
  desktop 1.423px giữ năm chip/sáu môn/shortcut trong budget 1.459px.
- Thay đổi: progressive disclosure prompt và môn; compact Companion/Sự nghiệp; ancestor Home ổn
  định qua resize; reserve loading/validation/comeback; test canonical 33 state/theme/viewport.
- Evidence: BEFORE `806e77c0`, fixture hash `8e5052…1774`; independent AFTER matrix 5/5 và
  capture 1/1, max CLS 0,069396; không overflow/request ngoài fixture. Chi tiết ở changelog 0369.
- Review findings đã đóng: stale focus sau blur; skeleton reserve lệch; status chưa AAA; 1/5 chip
  và thiếu Tab 4→5→6; validation wrap; comeback async CLS; completed-English giữ khoảng trắng;
  mock loader rò giữa test.
- Guardrails: không route/API/schema/migration/dependency, không paid provider/production data;
  người chỉ học Lập trình không nhận comeback English.
- Quyết định UX-R3: chủ dự án chọn phương án A — bỏ `ProgressStory` độc lập, hợp nhất narrative
  vào “Tuần này”; P2-10 được supersede khi spec UX-R3 được viết.
- Verification: final independent review PASS 0 critical/major/minor; build, typecheck, lint,
  format, budget, 14.925 unit test và 77 test tập trung đều xanh. Full E2E đóng cả 7 regression
  comeback; một race ngoài phạm vi `sync-offline` PASS ở full trước và PASS 1/1 khi chạy cô lập.
- Blocker: không còn source/evidence blocker; chờ required quality/e2e CI của PR; không deploy.
- Next best slice: merge UX-R2 khi quality/e2e xanh, reload main, rồi tạo spec UX-R3 từ audit mới.
- Quyền cần thêm: không cần cho PR/auto-merge; deploy/production access vẫn ngoài phạm vi.

### Iteration 9 — 2026-09-18 — UX-R2 merged, đặc tả toàn UX-R3

- State: RECONCILE → SPEC REVIEW; base `main@5d81c6c8` sau PR #1022.
- Slice: docs-only contract cho toàn UX-R3; chưa source.
- Goal gap trước/sau: `/tien-do` cao 3.722/3.527/2.195px ở 320/390/1440, hai failure async có thể
  treo và hierarchy nặng → có contract keyed retry, stable responsive tree, consolidated weekly,
  English disclosure và target ≤2.300/≤2.100/≤1.450px; trải nghiệm runtime chưa đổi.
- Research/spec: [UX-R3 Dashboard progressive disclosure](../specs/2026-09-18-ui-clarity-dashboard-progressive-disclosure.md),
  Approved for implementation; PR điền sau.
- Quyết định: A — P2-10 superseded, narrative nằm trong “Tuần này”; bốn source PR tuần tự R3-1
  đến R3-4, touch set serialize; 28 evidence cases, CLS <0,1, AAA/AA tuyệt đối.
- Adversarial findings vòng 1: 6 finding đã được sửa trong contract; đáng chú ý Retry phải reset đủ outer
  curriculum + ba resource loader, weekly null không phải loading và quota 0 vẫn ready, “Tuần này”
  mang scope English, focus không bị steal, calendar chỉ đổi bởi user và R3-3 dùng embedded mode.
- Review vòng 2: 0 critical · 2 major đã sửa — weekly heading luôn visible; CEFR success chọn đúng
  heading/toggle theo panel và không steal; recovery fixture chờ ≥600ms thực rồi flush observer,
  sáu weekly case chụp đủ loading→unavailable→ready. Vòng 3 PASS 0 critical · 0 major · 0 minor;
  spec đã Approved.
- Guardrails: không API/schema/migration/dependency/provider/production; không source trước Approved.
- Blocker: không còn spec blocker; source chỉ chờ PR docs merge theo delivery loop.
- Next best slice: merge docs, reload main và giao R3-1.
- Quyền cần thêm: không cần cho docs review/PR/auto-merge; deploy/production vẫn ngoài phạm vi.

### Iteration 10 — 2026-09-18 — UX-R3.1 async truth và rejected-cache recovery

- State: IMPLEMENT → VERIFY; base `origin/main@b413e04f` sau PR #1023.
- Slice: R3-1; không đổi hierarchy/disclosure/calendar của R3-2→R3-4.
- Goal gap trước/sau: weekly quota/CEFR có thể treo loading và loader giữ promise reject → hai
  resource có keyed `loading|ready|error`, retry thật, chống stale response; bốn cache coalesce
  pending và chỉ xóa đúng promise reject của chính nó.
- Thay đổi: weekly boundary dùng Zod, `null`/invalid/non-2xx là unavailable nhưng credit `0` vẫn
  ready; VIP không gọi quota Free; 10 dictionary chunk + foundation + CEFR kiểm `response.ok`;
  recovery focus có điều kiện và không cướp focus; bỏ motion gây layout trong Dashboard.
- Test/review: 7 file / 92 targeted PASS; reviewer độc lập vòng 1 BLOCK 2 major + 2 minor,
  vòng 2 còn 2 major, vòng 3 PASS 0 critical · 0 major · 0 minor sau khi xóa width/height motion
  và thêm harness capture/replay cleanup cũ cho đủ bốn cache.
- Complete gate candidate: build, typecheck, lint, format, budget và full E2E **843 pass / 5
  skip** đều xanh; JS 137,66/150 kB, CSS 18,42/20 kB. Full unit: 708 file + 14.948 test xanh,
  1 timeout Swift 5 giây ngoài diff; Swift cô lập 44/44. Không sửa/nới test; CI `quality` là gate.
- Guardrails: không API/schema/migration/dependency/provider/production; không dữ liệu authority.
- Blocker: chưa có product/runtime blocker; chờ commit, PR và required CI trước auto-merge.
- Next best slice: sau merge R3-1, reload main và giao R3-2 tuần tự.
- Quyền cần thêm: không cần cho PR/auto-merge; deploy/production vẫn ngoài phạm vi.

### Iteration 11 — 2026-09-18 — UX-R3.2 responsive state/focus/calendar

- State: RECONCILE → IMPLEMENT → VERIFY; base `main@2cc505f0` sau PR #1024 đã merge R3-1.
- Slice/spec: R3-2 theo §5 và §8 của [spec UX-R3](../specs/2026-09-18-ui-clarity-dashboard-progressive-disclosure.md),
  **Approved for implementation**; changelog [0372](../changelog/0372-2026-09-18-ux-r3-2-dashboard-responsive-state.md).
- Goal gap trước/sau: responsive branches có thể remount control và mất selection/dialog/focus
  → candidate có một cây DOM, một QuickActions/calendar instance, explicit calendar disclosure
  đóng mặc định và ngày chọn do stable owner giữ qua 5/13/26 tuần.
- Review: vòng 1 BLOCK 1 critical · 3 major (partial-week focus, uncontrolled clamp, motion,
  scroll precondition); vòng 2 còn 1 major ở harness ép kích thước; vòng 3 PASS 0/0/0 sau khi
  kiểm cuộn trên kích thước sản phẩm thật với ngày fixture cố định.
- Evidence candidate: component 2 file / 21 test PASS; calendar E2E 11/11 PASS; diff check PASS.
  Test giữ node/focus partial week hai chiều, lưu clamp/callback, no-steal, hidden panel,
  QuickActions dialog/focus trap, keyboard/live detail, mobile 44px/overflow và axe ba theme.
- Complete gate: agent chính đang chạy/chốt build, typecheck, lint, format, full unit, budget,
  full E2E và bằng chứng thị giác. **Chưa có kết luận full gate; chưa merge R3-2.**
- Guardrails: không đổi API/schema/migration/dependency, thuật toán thống kê hoặc authority;
  không paid provider/production access. Target chiều cao và ma trận 28 case chốt ở R3-4.
- Blocker: không còn finding độc lập trong scope R3-2; vẫn chờ complete gate và required CI.
- Next best slice: hoàn tất gate → PR/auto-merge R3-2 khi checks xanh → reload main → R3-3.
- Quyền cần thêm: không cần cho PR/auto-merge; deploy/production vẫn ngoài phạm vi.
- Điểm tiếp tục: nén/cập nhật canonical state ở goal này trước khi dừng, rồi đọc lại main và
  trạng thái PR/checks trước khi chạy tiếp theo yêu cầu chủ dự án.

## 7. Final audit

- [ ] Mọi Goal AC có bằng chứng trên main.
- [ ] Metrics đạt, guardrails không suy giảm.
- [ ] Không còn milestone bắt buộc/blocker cao/migration dang dở.
- [ ] Regression/security/privacy/a11y/operational gates xanh.
- [ ] Production verification hoàn tất nếu được mở rộng quyền/scope.
- [ ] Docs/runbook/telemetry/rollback cập nhật.
- [ ] Residual risks và out-of-scope được ghi rõ.
- [ ] Owner xác nhận completion.

**Kết luận:** NOT COMPLETE  
**Người xác nhận:** chưa có  
**Ngày:** 2026-09-15
