# 0320 — 2026-09-15 — Danh mục môn học: lỗi tải nói thật, chống ghi đè khi đổi bộ lọc

**PR:** [#922](https://github.com/seeker19110/dhcb/pull/922) · **Nhánh:** `claude/confident-dirac-sw9dgt` · **Base:** `main` `2719790` (sau #921).

Slice **S03-1** của [GOAL-2026-0915-LEARNING-UX](../goals/2026-09-15-learning-ux.md), theo
[đặc tả nền §④ B](../specs/2026-09-15-learning-ux-foundation.md) — nhóm "Subjects phân biệt
tải/503 hoặc offline/thành công rỗng/lọc rỗng/dữ liệu; retry chỉ chạy theo hành động; đổi filter
nhanh không để response cũ ghi đè response mới". Hai nhóm còn lại của S03 (dialog/bố cục mobile ·
renderer an toàn) tách slice riêng, chưa làm ở đây.

## Vấn đề

`/mon-hoc` nuốt MỌI lỗi tải bằng `.catch(() => setSubjects([]))`, rồi màn hình rỗng in ra
"Chưa có môn học nào trong mục này." Nghĩa là mất mạng, máy chủ 503, hay payload sai hợp đồng
đều hiện ra **một lời nói dối**: nền tảng không có môn học nào. Ảnh chụp trang thật ở 1440px với
`/api/subjects` trả 503 cho thấy đúng câu đó.

Kèm theo hai lỗi cùng chỗ:

- **Race.** Bấm nhanh "Tất cả môn" → "Ngôn ngữ" thì response lượt CŨ về sau và ghi đè danh sách
  đang đúng — không có `AbortController`, không có cờ chặn lượt cũ.
- **Không validate.** Client tin tuyệt đối thân phản hồi. Chính bộ test cũ của `subjectApi` mock
  manifest thiếu field (`{ id, label, category }`) mà vẫn xanh, vì không có gì kiểm.

## Thay đổi

- `apps/dhcb/src/lib/subjectApi.ts`: `SubjectApiError` có **phân loại** `network` · `http` (giữ
  `status` thật) · `invalid`, kèm câu tiếng Việt nói đúng chuyện đã xảy ra (429 và 503 có câu
  riêng); validate response bằng chính `SubjectManifestSchema` — nguồn sự thật của máy chủ; nhận
  `AbortSignal`. `AbortError` được ném NGUYÊN, không bọc lại, để nơi gọi phân biệt "bị huỷ" với
  "hỏng".
- `apps/dhcb/src/pages/learning/Subjects.tsx`: đổi `subjects` + `loading` thành `CatalogState`
  (`loading` | `error` | `ready`) — **bốn nhánh render tách bạch**: đang tải · lỗi tải (dùng lại
  `LoadError`, có nút "Thử lại") · thành công nhưng bộ lọc rỗng · tìm kiếm không khớp.
  `AbortController` + cờ `aborted` chặn cả response lẫn lỗi của lượt đã huỷ. Thử lại **chỉ chạy
  theo hành động người dùng** (`retryToken`), không tự retry vòng quanh — `/api/subjects` có rate
  limit 60 lượt/phút theo IP.
- `apps/dhcb/src/components/LoadError.tsx`: thêm prop `hint` tuỳ chọn. Mặc định giữ nguyên câu cũ
  ("Dữ liệu của bạn vẫn còn nguyên") cho 5 trang trụ cột; danh mục môn học là dữ liệu CHUNG nên
  truyền câu khác, vì "dữ liệu của bạn" ở đó vô nghĩa.

## Kiểm chứng

Node 22.22.2, lệnh chạy thật:

| Cổng                                                      | Kết quả                                                      |
| --------------------------------------------------------- | ------------------------------------------------------------ |
| `npm run build`                                           | ✅                                                           |
| `npm run typecheck`                                       | ✅ sau `rm -rf packages/*/dist dist dist-server`             |
| `npm run lint`                                            | ✅ 0 cảnh báo                                                |
| `npm run format:check`                                    | ✅                                                           |
| `npm run test:coverage`                                   | ✅ 605 file / **12493 test**; statements 94.4%, lines 94.84% |
| `npx playwright test e2e/subjects-catalog-states.spec.ts` | ✅ **14/14**                                                 |

**Test viết trước, và có bằng chứng nó bắt được lỗi cũ:** trả `Subjects.tsx` về bản trên `main`
rồi chạy lại `Subjects.test.tsx` → **6/8 đỏ** (lỗi mạng, 503, bộ lọc rỗng, không-tự-retry, race
ghi đè, huỷ request). Hai ca còn xanh là hai ca mà mã cũ tình cờ đúng.

Test mới: `apps/dhcb/src/pages/learning/Subjects.test.tsx` (8) · `subjectApi.test.ts` 4 → 12 ·
`e2e/subjects-catalog-states.spec.ts` (14, **gồm quét a11y A/AA và AAA cho màn lỗi ở cả 5 theme**
— thêm state mới vào cổng chứ không bỏ rule).

**Ảnh trang thật (Tầng 8b)** trước/sau ở 1440 · 390 · 320px, nguồn dữ liệu là **mock route
`/api/subjects` trả 503** (không có cách bắt máy chủ thật hỏng theo ý muốn). Ảnh "trước" là bằng
chứng trực tiếp của lỗi: 503 mà trang in "Chưa có môn học nào trong mục này". Ảnh 320px của bản
sửa xác nhận bảng lỗi kể cả nút "Thử lại" hiện đủ, không tràn ngang.

`npm run codemap -- impact`: `subjectApi.ts` → 6 file; `LoadError.tsx` → 17 file (thay đổi thuần
bổ sung, prop mới có mặc định bằng đúng chữ cũ, toàn bộ test xanh).

## Rủi ro và rollback

Chỉ frontend. Không đụng schema, migration, billing, entitlement, mastery hay hạn mức khách;
`/api/subjects` vẫn là endpoint công khai như cũ, không thêm auth. Revert 3 file source là về
nguyên trạng, không có dữ liệu nào phải dọn.

**Nợ còn để ngỏ (ngoài phạm vi slice này):** `SubjectDetail.tsx` bắt mọi lỗi của
`getSubjectDetails` rồi `goToSubjects(nav)` — mất mạng một cái là người dùng bị đá khỏi trang môn
học mà không được báo gì. Cùng họ lỗi, khác điểm chạm; đặc tả §② xếp `SubjectDetail.tsx` ngoài
bảng S03.
