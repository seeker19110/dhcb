# 0565 — Sinh lại FEATURE-MAP: bộ sinh sót route, file cũ cũng lệch (2026-10-09)

- **Ngày:** 2026-10-09 · **PR:** #1310 · **Loại:** `fix(scripts)`
- **Nguồn:** changelog `0534` ghi "generator sinh ra diff ~211 dòng, chưa ai xác minh bên nào đúng".

## Kết luận: CẢ HAI bên sai

| Bên                                       | Sai ở đâu                                                                                                                                                                                                                                                                                                      |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `docs/FEATURE-MAP.md` cũ (104 route)      | Lệch từ trước khi tách Góc học tập: còn `/lap-trinh/*`, `/luyen-noi`, `/mon-hoc/:subjectId`… như route CHÍNH, còn `/career`, `/startup`, `/life`, `/api/career`, `/api/startup`, `/api/life` (ba trụ đã gỡ 2026-09-20), thiếu `/ghi-chu`, `/goc-hoc-tap/**`, `/api/account`, `/api/cefr-assessment`…           |
| Bộ sinh `scripts/gen-feature-map.ts` (60) | Chỉ bắt `path="..."` chuỗi trần. `App.tsx` khai hơn 60 route bằng `path={`${PROGRAMMING_PREFIX}/…`}`, `path={ENGLISH_PREFIX}`, `path={duongDanMonTiengAnh()}` và các vòng `{LEGACY_*.map((p) => <Route path={p} />)}` → bị bỏ sót toàn bộ môn Lập trình/Anh dưới `/goc-hoc-tap/**` và mọi URL cũ chuyển hướng. |

Bằng chứng: `grep -c 'path="' App.tsx` = 60 (đúng con số bộ sinh cũ) trong khi `grep -c "<Route" App.tsx` = 97; `grep -n 'path={' App.tsx` liệt kê đúng các dạng bị bỏ.

## Đã làm

1. **Sửa bộ sinh:** `extractRoutes(appSource, consts?)` hiểu thêm `path={`${HẰNG}/x`}`, `path={HẰNG}`,
   `path={HÀM()}` và vòng `{DANH_SÁCH.map((v) => <Route path={v}|{`${v}/*`} />)}`. Giá trị hằng/mảng
   NẠP TỪ MÃ THẬT (`subjectsHost`, `navPaths`, `programmingRoutes`, `englishRoutes`) — không chép
   tay nên không lệch. Dạng động không giải được thì bỏ qua (không văng lỗi). Thêm `buildFeatureMap()`.
2. **Test** `scripts/gen-feature-map.test.ts`: +3 ca cho dạng khai mới, +1 ca **canh file khớp bộ
   sinh** (mẫu như `lessonsLazy.test.ts`) — lệch thì đỏ kèm lệnh sửa.
3. **Sinh lại** `docs/FEATURE-MAP.md`: **128 route giao diện · 112 endpoint API** (file cũ 104 / 111).
   Route: -36 mất (URL cũ không còn là route chính) / +60 mới. API: +6 (`/api/account`,
   `/api/admin-stem-review`, `/api/cefr-assessment`, `/api/learner-intent`, `/api/learning/evidence`,
   `/api/payment-cancel`) và -4 (`/api/career`, `/api/career-interview`, `/api/life`,
   `/api/startup`) và -1 (`/api/co-learning-audio`, gỡ ở #1308): 111 + 6 - 4 - 1 = 112.

## Lưu ý

- Đã sinh lại trên `main` có #1308 (đợt 0563 gỡ `/api/co-learning-audio`) và #1309: 112 API.
- Không sửa `PROGRESS.md`: không có mục nợ nào nhắc FEATURE-MAP.
- Cổng CI không đổi (`ci.yml` là file được bảo vệ); test canh nằm trong `npm test` nên CI job `unit` chạy.
