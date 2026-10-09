# Đặc tả: Hạ tầng dự án trục T2/T3 — chọn dự án, mã bước theo dự án

> Ngày: 2026-10-09 · **Trạng thái:** Approved for implementation (chủ dự án chốt trong phiên 2026-10-09: làm đủ T2/T3 P1→P5, giữ tiến độ riêng từng dự án)

**Nền:** môn Lập trình có "dự án trục" xuyên P1→P5. Hiện chỉ T1 "Cửa hàng của tôi" có bước
(26 bước). `PROJECT_TRACKS` khai T2 "Quỹ lớp / Chi tiêu nhà mình" và T3 "Sổ học tập của tôi" với
`available: false` ghi cứng. Bối cảnh chọn dự án: `docs/research/mon-lap-trinh.md` §2.2 (ba
phương án đồng hình kỹ thuật — CRUD + báo cáo + trang public). Cột
`programming.learner_state.project_track` (CHECK `T1`/`T2`/`T3`, migration 0064) đã có nhưng
chưa có đường ghi.

Đây là PR **HẠ TẦNG**: chưa soạn bước nào cho T2/T3. Nội dung chia 4 PR sau (theo mục
"Hợp đồng cho PR nội dung" bên dưới).

---

## 0. Một câu

Cho học viên chọn một trong ba dự án trục ở trang dự án, mỗi dự án giữ tiến độ và workspace
riêng (đổi qua đổi lại không mất gì), và dựng sẵn khung dữ liệu để PR nội dung T2/T3 chỉ việc
điền bước.

## ① Phạm vi

**LÀM:**

- Mã bước theo dự án: T1 GIỮ `p<n>-s<k>`; T2 `t2-p<n>-s<k>`; T3 `t3-p<n>-s<k>`. Schema bước,
  `getProjectStep` (tra cả 3 dự án), regex khoá tiến độ của API.
- Bước T2/T3 đối xử ĐÚNG như bước T1: không qua khoá bậc, không là bài xương sống, không chấm lại
  ở server (vì `getLesson()` không biết chúng).
- `getProjectStages(track)`: T1 trả đúng `PROJECT_STAGES` cũ (cùng tham chiếu, giữ export cũ);
  T2/T3 trả 5 chặng P1–P5 có tiêu đề riêng, `steps: []`.
- `PROJECT_TRACKS[].available` SUY từ dữ liệu (có ≥ 1 bước là mở), không ghi cứng.
- API ghi lựa chọn: `POST /api/programming/progress` nhận thêm body `{ projectTrack }`.
- Workspace tách theo dự án (tiền tố đường dẫn lưu) + snapshot milestone theo dự án.
- Giao diện: bộ chọn 3 thẻ ở trang dự án; trang dựng chặng/bước theo dự án đang chọn; trang môn
  hiện tên chặng theo dự án đang chọn; khách lưu lựa chọn ở localStorage.

**KHÔNG LÀM (quan trọng ngang mục trên):**

- Không soạn nội dung bước T2/T3 (4 PR sau).
- Không migration: cột `project_track` đã có, CHECK đã đủ 3 giá trị.
- Không đổi mã bước T1 (tiến độ người học thật đang gắn vào `p1-s1`…).
- Không thêm API giả cho bước `fetch` của T2/T3 (`FetchApi` hiện chỉ `'thoi-tiet' | 'cua-hang'`):
  PR nội dung nào soạn bước `fetch` cho T2/T3 tự bổ sung (xem hợp đồng).
- Không đổi `ProgrammingAbout` (đếm 5 chặng — mọi dự án cùng 5 chặng, con số không đổi).
- Không thêm hàng đợi offline cho lựa chọn dự án: lựa chọn không phải tiến độ học, mất thì chọn
  lại; trang báo lỗi + nút "Thử lại" khi server không nhận.

## ② Điểm chạm

| Việc | Đường dẫn file                                                        | Ghi chú                                                                                   |
| ---- | --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Thêm | `packages/subject-programming/projectTrackIds.ts`                     | Khuôn mã/đường dẫn/mốc theo dự án — KHÔNG import gì (đáy chuỗi, server dùng được)         |
| Thêm | `packages/subject-programming/projectTracks.ts`                       | `PROJECT_TRACKS` (chuyển từ curriculum.ts) + `available` suy ra + `normalizeProjectTrack` |
| Thêm | `packages/subject-programming/projectStepsT2.ts`                      | Khung 5 chặng T2, bước rỗng                                                               |
| Thêm | `packages/subject-programming/projectStepsT3.ts`                      | Khung 5 chặng T3, bước rỗng                                                               |
| Sửa  | `packages/subject-programming/projectStepTypes.ts`                    | Regex id theo dự án; thêm kiểu `ProjectStage`                                             |
| Sửa  | `packages/subject-programming/projectSteps.ts`                        | `getProjectStages`, `getProjectStep` tra cả 3 dự án                                       |
| Sửa  | `packages/subject-programming/curriculum.ts`                          | Bỏ `PROJECT_TRACKS`/`ProjectTrack` (chuyển sang projectTracks.ts)                         |
| Sửa  | `apps/server/src/api/subjects/programming/progress.ts`                | Body `{ projectTrack }` + regex khoá bước T2/T3                                           |
| Sửa  | `apps/server/src/api/subjects/programming/project.ts`                 | Mốc snapshot theo dự án, chỉ chốt file của dự án đó                                       |
| Thêm | `apps/dhcb/src/lib/programmingProjectTrack.ts`                        | Bộ đệm + ghi lựa chọn (khách: chỉ localStorage)                                           |
| Sửa  | `apps/dhcb/src/lib/programmingProgress.ts`                            | GET ghi `state.projectTrack` vào bộ đệm                                                   |
| Sửa  | `apps/dhcb/src/lib/programmingProject.ts`                             | Nạp/lưu/snapshot theo dự án                                                               |
| Thêm | `apps/dhcb/src/components/programming/ProjectTrackPicker.tsx`         | Bộ chọn radio gốc (fieldset/legend)                                                       |
| Sửa  | `apps/dhcb/src/pages/subjects/programming/ProgrammingProjectPage.tsx` | Dựng theo dự án đang chọn                                                                 |
| Sửa  | `apps/dhcb/src/pages/subjects/programming/ProgrammingHome.tsx`        | Tên chặng theo dự án đang chọn                                                            |
| Sửa  | `packages/subject-programming/lessonsPython.test.ts`                  | Cổng python3 quét bước của cả 3 dự án                                                     |

**Ảnh hưởng lan ra (theo `npm run codemap -- impact`):** `projectSteps.ts` → 23 file (ba trang
môn Lập trình, `progress.ts`, `routes.ts`/`server.ts`, `App.tsx`/`main.tsx` qua lazy route, các
test bước dự án). `programmingProgress.ts` → 50 file (mọi nơi đọc tiến độ Lập trình, gồm thẻ "Hôm
nay") — vì vậy `programmingProjectTrack.ts` cố ý chỉ import `projectTrackIds.ts`, không kéo dữ
liệu bước vào bundle các trang đó. `curriculum.ts`: chỉ bỏ một export không ai dùng ngoài test.

## ③ Hợp đồng dữ liệu

**Vào:**

```ts
// POST /api/programming/progress — dạng body THỨ BA (hai dạng cũ giữ nguyên)
const ProjectTrackBodySchema = z.object({ projectTrack: z.enum(['T1', 'T2', 'T3']) }).strict()

// Khoá tiến độ dự án trong lesson_progress.lesson_id (regex của API)
//   T1: /^p[1-6]-s\d+$/   T2/T3: /^t[23]-p[1-6]-s\d+$/

// POST /api/programming/project — mốc snapshot
//   milestone: /^(t[23]-)?p[1-6]$/   ('p1' = T1 như cũ; 't2-p1' = chặng P1 của T2)
```

**Ra:**

```ts
// 200 khi chọn dự án
{ ok: true, state: { currentLevel: 'p1'|…|'p6', projectTrack: 'T1'|'T2'|'T3' } }
// GET /api/programming/progress — KHÔNG đổi: state.projectTrack đã có từ trước.
```

**Workspace:** bảng `project_files` là một không gian tên phẳng mỗi người. Tên LƯU: T1 = tên file
(giữ nguyên), T2 = `t2--<file>`, T3 = `t3--<file>`. Tên CHẠY (bộ chạy, `files` của bước, ô soạn)
luôn là `<file>`. Snapshot T1 không còn lẫn file T2/T3 và ngược lại.

**Ca lỗi (là một phần hợp đồng, không phải phụ lục):**

| Tình huống                                       | Mã lỗi | Hành vi mong đợi                                                         |
| ------------------------------------------------ | ------ | ------------------------------------------------------------------------ |
| Chưa đăng nhập / token sai                       | 401    | Không chạm DB                                                            |
| `projectTrack` lạ / thừa trường / trộn bài       | 400    | Zod `.strict()` từ chối, không chạm DB                                   |
| Chọn dự án chưa có bước nào                      | 400    | `code: 'PROJECT_TRACK_NOT_AVAILABLE'`, không ghi DB                      |
| Ghi bước `t2-…`/`t3-…` đúng khuôn nhưng không có | 400    | "Bài học không tồn tại", không ghi DB (như bước T1)                      |
| Mã `t1-…`/`t4-…`                                 | 400    | Schema từ chối                                                           |
| Server không nhận lựa chọn (mạng/5xx)            | —      | Client giữ lựa chọn ở localStorage, hiện thông báo + nút "Thử lại"       |
| Bộ đệm/DB chứa dự án chưa mở                     | —      | `normalizeProjectTrack` quy về T1 — không bao giờ dựng trang dự án trống |
| Snapshot dự án chưa có file nào                  | 400    | "Workspace trống" — như cũ, nay tính theo file của đúng dự án            |

**Vì sao ghi lựa chọn qua `POST /api/programming/progress` chứ không endpoint riêng:** GET của
chính endpoint này đã trả `state.projectTrack` từ cùng dòng `learner_state` — một nơi đọc, một
nơi ghi; không thêm route/handler/rate-limit bucket mới. Body là dạng thứ ba trong cùng
`z.union` `.strict()`, xử lý ở nhánh riêng TRƯỚC mọi logic tiến độ bài (không đi qua khoá bậc,
biên nhận hay chấm lại).

## ④ Tiêu chí chấp nhận

- [ ] Mã T1 cũ (`p1-s1`…) tra được và ghi được y như trước — `projectSteps.test.ts`,
      `progress.test.ts` xanh không sửa.
- [ ] `getProjectStages('T1') === PROJECT_STAGES`; T2/T3 có 5 chặng P1–P5 tiêu đề riêng —
      `projectTracks.test.ts`.
- [ ] `available` suy từ dữ liệu; hôm nay chỉ T1 mở — `projectTracks.test.ts`.
- [ ] Bước `t2-…`/`t3-…` không qua khoá bậc, không là bài xương sống —
      `levelLockServer.test.ts`, `progress.projectTrack.test.ts`.
- [ ] POST `{ projectTrack }`: 401/400/200 đúng bảng ③ — `progress.projectTrack.test.ts`.
- [ ] Workspace + snapshot tách theo dự án — `projectTrackIds.test.ts`,
      `programmingProject.test.ts`, `project.test.ts`.
- [ ] Bộ chọn: radio gốc, dự án chưa mở bị `disabled` thật + "Sắp mở" —
      `ProjectTrackPicker.test.tsx`, `ProgrammingProjectPage.test.tsx`.
- [ ] Không chu trình import — `npm run codemap -- cycles`.

**Lệnh chứng minh:**

```bash
npm run typecheck && npm run lint && npm run format:check && npm run build
npx vitest run packages/subject-programming apps/server apps/dhcb/src/pages/subjects/programming \
  packages/core-personal apps/dhcb/src/lib/programmingProject apps/dhcb/src/components/programming
npm run codemap -- cycles && npm run check:specs
```

## ⑤ Bất biến không được phá

| Bất biến                                                        | Test nào canh nó                                                         |
| --------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Mã bước T1 không đổi (tiến độ người học thật)                   | `packages/subject-programming/projectSteps.test.ts`                      |
| Bước dự án (mọi dự án) không qua khoá bậc                       | `packages/subject-programming/levelLockServer.test.ts`                   |
| Không ghi khoá tiến độ rác                                      | `apps/server/src/api/subjects/programming/progress.projectTrack.test.ts` |
| Không chọn được dự án chưa có bước                              | `apps/server/src/api/subjects/programming/progress.projectTrack.test.ts` |
| File cùng tên ở hai dự án không đè nhau                         | `packages/subject-programming/projectTrackIds.test.ts`                   |
| Code tham chiếu mọi bước Python (cả T2/T3 khi có) đạt hết check | `packages/subject-programming/lessonsPython.test.ts`                     |
| Không chu trình import trong họ `projectStep*`                  | `npm run codemap -- cycles` (CI)                                         |

## ⑥ Quy ước dự án liên quan

- Import xuyên gói `@dhcb/<gói>/<file>` không đuôi `.js`; trong gói dùng đường tương đối có `.js`.
- Mọi handler API tự kiểm `user_id` qua `validateAuth()`; dữ liệu ngoài validate bằng Zod.
- Màu qua token (`zinc-*`/`accent-*` ánh xạ `--z-*`/`--a-*`), vùng chạm ≥ 44px (`tap-44`),
  chữ nội dung AAA, điều khiển AA.
- Họ `projectStep*` chỉ import một chiều xuống `projectStepTypes.ts` → `projectTrackIds.ts`.

---

## Hợp đồng cho PR nội dung T2/T3

Bên soạn nội dung chỉ cần đọc mục này.

1. **Nơi điền:** `packages/subject-programming/projectStepsT2.ts` (T2) và
   `packages/subject-programming/projectStepsT3.ts` (T3). Mỗi file có sẵn 5 mảng
   `T2_P1_PROJECT_STEPS` … `T2_P5_PROJECT_STEPS` (tương tự `T3_…`) gắn vào
   `T2_PROJECT_STAGES`/`T3_PROJECT_STAGES`. Chặng dài thì tách file `projectStepsT2P<n>.ts`
   theo khuôn `projectStepsP3.ts`, export mảng, rồi gắn vào bảng chặng. Chỉ `import type` từ
   `projectStepTypes.ts` (+ `TestCaseSchema` từ `lessonTypes.ts` như T1) — KHÔNG import
   `projectSteps.ts`/`projectTracks.ts` (chu trình).
2. **Khuôn mã:** `t2-p<n>-s<k>` / `t3-p<n>-s<k>`, `k` từ 1 liên tục trong chặng. `unitId` cùng bậc
   (`p<n>-u<x>`, phải tồn tại trong `curriculum.ts`).
3. **Bắt buộc khai `files`** cho MỌI bước (phần tử đầu = file chạy chính). File chính chặng P1:
   T2 `quy_lop.py` (`T2_PROJECT_MAIN_FILE`), T3 `so_hoc_tap.py` (`T3_PROJECT_MAIN_FILE`). Bỏ trống
   thì `getStepFiles` rơi về `cua_hang.py` của T1.
4. **Milestone:** chỉ bước cuối mỗi chặng `isMilestone: true`.
5. **Tiêu đề chặng** (đổi được nếu PR nội dung có lý do, giữ khuôn `Chặng P<n> — …`):
   T2: P1 "Sổ thu chi chạy chữ" · P2 "Sổ quỹ không mất" · P3 "Trang minh bạch quỹ" · P4 "Lõi quỹ
   có test và API" · P5 "Quỹ lên Internet". T3: P1 "Sổ điểm chạy chữ" · P2 "Sổ môn học không mất"
   · P3 "Trang chia sẻ tài liệu" · P4 "Lõi sổ học có test và API" · P5 "Sổ học tập lên Internet".
6. **Tự động có sẵn khi điền bước:** dự án tự mở (`available`), server nhận mã bước, cổng
   `projectTracks.test.ts` (khuôn/hợp đồng) và `lessonsPython.test.ts` (chạy code tham chiếu
   Python) tự quét bước mới. Bước web (`html`/`dom`/`sql`/`fetch`) cần cổng chấm riêng như
   `projectStepsP3.test.ts`.
7. **Bước `fetch` của T2/T3:** trang dự án hiện chỉ gắn API giả `cua-hang` + shim
   `FETCH_SHIM_CUA_HANG_JS` cho T1. PR nào soạn bước `fetch` cho T2/T3 phải thêm API giả riêng
   (`FetchApi` ở `fetchPrelude.ts`, shim ở `fetchGia.ts`) và nối vào `runChecks`/"Xem trang chạy"
   ở `ProgrammingProjectPage.tsx` (hai chỗ đang rẽ nhánh `track === 'T1'`).

---

## Nghiệm thu (bên giao việc điền SAU khi nhận kết quả)

- Lệnh đã chạy + kết quả thật:
- Tiêu chí ④ đạt hết chưa; cái nào chưa và vì sao:
- Có phá bất biến ⑤ nào không:
- Có mở rộng ngoài phạm vi ① không (nếu có: bỏ ra hay giữ lại, vì sao):
- Còn để ngỏ:
