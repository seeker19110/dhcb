# 0573 — Dự án trục T3 "Sổ học tập của tôi": đủ năm chặng P1→P5 (26 bước)

- **Ngày:** 2026-10-09 · **PR:** #1323 · **Loại:** `feat(programming)`
- **Đặc tả:** `docs/specs/2026-10-09-du-an-truc-t2-t3-ha-tang.md` (Approved for implementation),
  đợt hạ tầng `0571`.

## Vấn đề

Sau đợt hạ tầng `0571`, dự án T3 có khung 5 chặng rỗng nên ở trạng thái "Sắp mở". Đợt này
soạn toàn bộ nội dung để T3 mở thật. Miền dữ liệu gồm môn học, deadline bài tập, điểm và điểm
trung bình có trọng số, thẻ ôn tập, và trang chia sẻ tài liệu công khai.

## Đã làm

**Luật điểm xuyên suốt cả năm chặng:**

- ĐTB = (thường xuyên + 2 × giữa kỳ + 3 × cuối kỳ) / 6, làm tròn 1 chữ số.
- Xếp loại theo ĐTB đã làm tròn: ≥ 8.0 Tot · ≥ 6.5 Kha · ≥ 5.0 Dat · còn lại "Chua dat".
- Môn chưa có điểm là `None`, KHÔNG phải 0.
- Bộ điểm 8·7·9 → 8.2 của P1 chạy lại đúng ở P4 và P5. Một dòng chảy, không đề rời.

**Nội dung từng chặng.** Mã bước `t3-p<n>-s<k>`. Unit thuộc đúng bậc. Mỗi bước có ca hiện và ca
ẩn. Dòng chấm in không dấu.

| Chặng                          | Số bước | Nội dung                                                                                                                                                                                                                    |
| ------------------------------ | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P1 — Sổ điểm chạy chữ          | 5       | Chạy bằng console, một file `so_hoc_tap.py`. Đi qua: hệ số, ĐTB, xếp loại, vòng lặp nhiều môn, mục tiêu điểm (milestone).                                                                                                   |
| P2 — Sổ môn học không mất      | 5       | Thêm bảng hệ số môn, lệnh `them` và lưu `diem.csv`. Chặn dữ liệu hỏng, chặn điểm ngoài 0–10 (cả NaN). Milestone tách ba file `so_hoc_tap.py`/`tinh_diem.py`/`luu_tru.py`, dùng `probeCode`.                                 |
| P3 — Trang chia sẻ tài liệu    | 5       | Làn `html` và CSS. Làn `dom` cho thẻ ôn lật mặt. Làn `sql` (bảng báo cáo ĐTB có bộ dữ liệu riêng qua `datasetSql`). Milestone làn `fetch` có API giả `/api/tai-lieu` mới.                                                   |
| P4 — Lõi sổ học có test và API | 6       | Lớp `MonHoc`/`SoHocTap`, bài tập có hạn nộp (`date`), ngoại lệ riêng + `logging`. Làn `pytest` 6 test. Làn `apisim` CRUD `/bai-tap`. Milestone `/diem` + tổng kết môn.                                                      |
| P5 — Sổ học tập lên Internet   | 5       | CSDL có CHECK/khoá ngoại/giao dịch. Trang công khai chống XSS (`html.escape`) và kiểm quyền xem tài liệu riêng. Đo phép so khi lọc thẻ trùng (n² → n). Cấu hình từ biến môi trường. Milestone `apisim` API nộp bài + làn C. |

**Hạ tầng bổ sung cho nội dung T3:**

- `packages/subject-programming/hocTapData.ts`: 6 tài liệu chia sẻ, dùng làm dữ liệu cho API giả.
- `fetchGia.ts` thêm:
  - kiểu `FetchApi` (`thoi-tiet` · `cua-hang` · `tai-lieu`);
  - `taoFetchTaiLieu`;
  - `FETCH_SHIM_TAI_LIEU_JS`;
  - **một** bảng phân phối `taoFetchTheoApi`.
- **Gộp với T2 (phiên chính, khi đưa lên sau PR T2):** T2 cũng tự viết `taoFetchTheoApi` và
  khai API giả qua trường `ProjectTrack.fetchApi` (`projectTracks.ts`) + bảng
  `FETCH_SHIM_THEO_API`. Bảng `FETCH_THEO_DU_AN` riêng của T3 trong trang đã BỎ; T3 chỉ khai
  `fetchApi: 'tai-lieu'` và thêm mục `tai-lieu` vào `FetchApi`, `taoFetchTheoApi`,
  `FETCH_SHIM_THEO_API`. Việc truyền `check.datasetSql` vào bộ chấm T2 đã làm trước, nên không
  lặp lại.
- `projectStepsT3.test.ts` (58 test):
  - chấm các bước HTML/DOM/SQL/fetch bằng chính bộ máy thật (happy-dom, sql.js, `chayBaiDom`, `chayBaiFetch`);
  - kiểm số học từng ca chấm theo luật điểm;
  - **mutation test**: bản code sai điển hình phải rớt.
  - Ví dụ: commit sau từng dòng, quên `PRAGMA foreign_keys`, không escape, `>=` thay `>` ở hạn nộp, 404 trước 422…

## Quyết định

- **P1 có 5 bước.** Brief ghi "gần với T1". Số bước đếm thật từ file T1 là 5/5/5/6/5, nên T3 theo đúng nhịp đó.
- **Bảo mật P5 dạy XSS + kiểm quyền thay vì SQL injection.** T1 đã dạy SQL injection. Sổ học tập có trang tài liệu công khai, nên hai mục OWASP này sát sản phẩm hơn.
- **Hiệu năng chấm bằng phép đếm, không bằng giây.** Theo ranh giới chặng P5 của T1.
- **Deploy không mô phỏng.** Bước 4 chỉ chấm phần đo được. URL sống thuộc làn C, do học viên tự nộp bằng chứng.
- **Giữ nguyên tiêu đề chặng có sẵn** trong khung `0571`.
- **Sửa dữ liệu test cũ, không sửa ý định:**
  - `progress.projectTrack.test.ts`: mã "đúng khuôn nhưng không tồn tại" đổi `t3-p2-s1` → `t3-p2-s99`, vì `t3-p2-s1` nay có thật.
  - `ProjectTrackPicker.test.tsx`: dữ liệu giả tự đặt T3 "chưa mở", thay vì dựa vào trạng thái thật của T3.

## Kiểm chứng

- `npx vitest run packages/subject-programming apps/dhcb/src/pages/subjects/programming apps/dhcb/src/components/programming apps/dhcb/src/lib apps/server/src/api/subjects/programming`
  → 303 file xanh, 12242 test xanh. Trong đó `lessonsPython.test.ts` chạy code mẫu của 21 bước Python T3 bằng python3 thật, đạt hết check.
- `npm run typecheck` · `npm run lint` · `npm run format:check`: exit 0.
- `npm run codemap -- cycles`: "Không có chu trình import."
- `npx tsx scripts/audit-prose.ts --ci`: 0 lỗi.
- Giới hạn schema (requirement ≤ 2000, hint ≤ 500, referenceCode ≤ 6000): cả 26 bước `ProjectStepSchema.safeParse` OK.

## Không làm

- E2E a11y riêng cho trang dự án KHI ĐANG CHỌN T3: cổng `e2e/a11y*.spec.ts` quét
  `/lap-trinh/du-an` ở dự án mặc định (T1); khung trang dùng chung một component cho cả ba dự
  án, nên không viết thêm ca chọn T3.

Tầng 8b ĐÃ LÀM ở phiên chính (bản đã gộp với T2): chụp `/lap-trinh/du-an` chọn T3 ở 1440px +
390px, theme Blue sky + Xanh đêm — ba dự án đều mở, 5 chặng T3 hiện đúng tên, bước 1 mở, không
tràn/đè. `npm run build` + `npm run test:coverage` chạy ở phiên chính trước khi mở PR.
