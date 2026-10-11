# Đặc tả — Bước dự án làn `apisim`: ca ẩn do BỘ CHẤM tự gọi API (chống in sẵn đáp án)

- **Ngày:** 2026-10-11 · **Trạng thái:** Draft — chờ chủ dự án duyệt
- **Nguồn việc:** nợ ghi ở `PROGRESS.md` mục "Dự án trục T2/T3": "bước apisim (P4 s5/s6, P5 s5)
  không có input nên ca ẩn không chặn hết lời giải gõ cứng (giới hạn chung với T1)". Chủ dự án chọn
  hướng này ngày 2026-10-11.

## 0. Một câu

Ở 9 bước dự án làn `apisim`, bộ chấm tự chạy file của học viên rồi gọi API bằng dữ liệu RIÊNG của
nó, nên lời giải chỉ in sẵn các dòng đáp án không còn qua được ca ẩn.

## Bối cảnh (đo trên mã, 2026-10-11)

- **Cách chấm hiện tại:**
  - Đề bắt học viên dán một khối kiểm thử cố định vào cuối `api.py`. Khối này gọi `TestClient` và
    in từng dòng, ví dụ `DS: 200 4`.
  - Mọi ca chấm đều là `tc([], '<dòng>')`: stdin rỗng, khớp `contains`.
  - Vì vậy một file chỉ gồm các lệnh `print("DS: 200 4")`… sẽ đạt **toàn bộ** ca, kể cả ca ẩn.
- **Nơi chấm:** chỉ ở trình duyệt.
  - `ProgrammingProjectPage.tsx` `runChecks` chạy code một lần cho mỗi ca, qua
    `codeRunner.ts` → Pyodide worker, rồi so bằng `grading.ts` `gradeTestCase`.
  - Server **không** chấm lại bước dự án: `completionSandboxServer.ts` chỉ chấm lại bài học
    `p[1-6]-uN-lN`. `progress.ts` nhận trạng thái `completed` do client gửi.
- **Hệ quả cho phạm vi:** ca ẩn ở đây là **công cụ sư phạm**, không phải hàng rào an ninh. Nó chặn
  việc vô tình "qua bài" bằng cách in sẵn đáp án; nó không chặn được người cố tình gọi thẳng API
  tiến độ. Đặc tả này không đổi điều đó.
- **Cơ chế có sẵn để tận dụng:** `probeCode` (`projectStepTypes.ts`) là code của bộ chấm, chạy
  THAY file chính (`entry = probeCode ?? files[mainFile]`). Các file của học viên đã được ghi vào
  thư mục làm việc, nên probe đọc được `api.py`. Hiện có một `refine` chỉ cho phép `probeCode` ở
  bước `python`.

9 bước làn `apisim`:

| Dự án | Bước                                  |
| ----- | ------------------------------------- |
| T1    | `p4-s5`, `p4-s6` (milestone), `p5-s5` |
| T2    | `t2-p4-s5`, `t2-p4-s6`, `t2-p5-s5`    |
| T3    | `t3-p4-s5`, `t3-p4-s6`, `t3-p5-s5`    |

## ① Phạm vi

**LÀM:**

- Nới `refine` của `ProjectStepSchema` để cho phép `probeCode` ở cả bước `apisim`. Bước `pytest`
  vẫn KHÔNG cho phép, vì làn này đã có phần nối của riêng nó.
- Mỗi bước trong 9 bước có một `probeCode` theo cùng một khuôn:
  1. `g = runpy.run_path('<file>.py', run_name='__main__')`. Chạy NGUYÊN file học viên như khi bấm
     chạy, kể cả khối kiểm thử họ đã dán, nên các dòng của ca hiện có vẫn in ra y như cũ. Dùng
     `runpy` chứ không `import` vì học viên có thể bọc khối kiểm thử trong
     `if __name__ == "__main__":`; `import` sẽ bỏ qua khối đó và các ca hiện có sẽ đỏ oan.
  2. Lấy `app = g['app']`, tạo `TestClient(app)` mới, rồi gọi các request với dữ liệu KHÁC đề. In
     từng dòng có tiền tố `KT ` (kiểm tra).
- Mỗi bước thêm **2–3 ca ẩn mới** (`hidden: true`) khớp các dòng `KT …`. Giữ nguyên toàn bộ ca
  đang có, cả nhãn lẫn chuỗi mong đợi.
- **Request của probe phải TƯƠNG ĐỐI với trạng thái**, để không phụ thuộc vào việc khối kiểm thử
  của học viên đã thêm/xoá gì trước đó. Ví dụ: tạo một bản ghi mới bằng tên lạ, đọc lại đúng `id`
  vừa nhận, xoá nó, xoá lần hai phải là 404, hỏi một id rất lớn phải là 404. KHÔNG kiểm tổng số
  bản ghi tuyệt đối.
- Test nội dung (`lessonsPython.test.ts` hoặc test của từng dự án) chạy `referenceCode` qua probe
  bằng Python thật và phải đạt MỌI ca. Thêm ca "lời giải gõ cứng":
  - lấy đúng các dòng mong đợi của ca hiện có, in bằng `print`;
  - chạy qua probe;
  - phải TRƯỢT ít nhất một ca. Làm cho cả 9 bước.

**KHÔNG LÀM:**

- Không đụng server: không chấm lại bước dự án ở `completionSandboxServer.ts`, không đổi
  `progress.ts`. Đổi điều này là một quyết định kiến trúc riêng (cần chạy Python ở server).
- Không đổi đề (`requirement`) và không bắt học viên sửa khối kiểm thử họ đã dán. Ai đã làm đúng
  vẫn đạt ngay, không phải làm lại.
- Không đổi các bài học làn `apisim` ngoài dự án (`lessons/p4u8.ts`…). Nếu cần, làm ở đợt sau với
  cùng khuôn.
- Không đổi `grading.ts`, `TestCaseSchema`, worker Pyodide, hay `pyLanes.ts`.
- Không đổi bước `pytest`, `python`, `sql`, `dom`, `fetch`.

## ② Điểm chạm

| Việc | Đường dẫn file                                       | Ghi chú                                                  |
| ---- | ---------------------------------------------------- | -------------------------------------------------------- |
| Sửa  | `packages/subject-programming/projectStepTypes.ts`   | `refine`: `probeCode` cho `python` + `apisim`            |
| Sửa  | `packages/subject-programming/projectStepsP4.ts`     | `probeCode` + ca ẩn `p4-s5`, `p4-s6`                     |
| Sửa  | `packages/subject-programming/projectStepsP5.ts`     | `p5-s5`                                                  |
| Sửa  | `packages/subject-programming/projectStepsT2P4.ts`   | `t2-p4-s5`, `t2-p4-s6`                                   |
| Sửa  | `packages/subject-programming/projectStepsT2P5.ts`   | `t2-p5-s5`                                               |
| Sửa  | `packages/subject-programming/projectStepsT3P4.ts`   | `t3-p4-s5`, `t3-p4-s6`                                   |
| Sửa  | `packages/subject-programming/projectStepsT3P5.ts`   | `t3-p5-s5`                                               |
| Sửa  | `packages/subject-programming/lessonsPython.test.ts` | chạy probe làn `apisim`; ca "gõ cứng phải trượt"         |
| Sửa  | `packages/subject-programming/projectSteps.test.ts`  | test `refine`: `apisim` nhận probe, `pytest` vẫn từ chối |

**Ảnh hưởng lan ra:** `ProgrammingProjectPage.tsx` đọc `probeCode` sẵn (không sửa). Trước khi làm,
chạy `npm run codemap -- impact packages/subject-programming/projectStepTypes.ts` và ghi kết quả
vào changelog.

## ③ Hợp đồng dữ liệu

**Vào:** `ProjectStep.probeCode?: string` (≤ 2000 ký tự), giờ hợp lệ khi
`language ∈ {'python', 'apisim'}` (bước bỏ trống `language` vẫn tính là `python`).

**Ra:** stdout của probe gồm (a) mọi dòng khối kiểm thử của học viên in ra, rồi (b) các dòng
`KT <mô tả>: <giá trị>` của bộ chấm. Ca ẩn mới khớp `contains` với các dòng `KT`.

**Ca lỗi:**

| Tình huống                                                     | Hành vi mong đợi                                                                       |
| -------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| File học viên không có biến `app` (lời giải chỉ in sẵn đáp án) | `KeyError` → `runError` → mọi ca của lượt đó trượt, giống khi file lỗi cú pháp hôm nay |
| Khối kiểm thử của học viên tự ném lỗi                          | Như hôm nay: lượt chạy lỗi, mọi ca trượt                                               |
| Học viên bọc khối kiểm thử trong `if __name__ == "__main__":`  | `run_path(..., run_name='__main__')` vẫn chạy khối đó → ca hiện có vẫn đạt             |
| Học viên đổi tên file chính                                    | Không xảy ra: `files` của bước cố định tên file                                        |

## ④ Tiêu chí chấp nhận

- [ ] Cả 9 bước có `probeCode` và ≥ 2 ca ẩn `KT` mới; `referenceCode` đạt **mọi** ca (Python
      thật) — `npx vitest run packages/subject-programming/lessonsPython.test.ts`.
- [ ] Lời giải "gõ cứng" (in đúng các dòng mong đợi của ca cũ) **trượt** ≥ 1 ca ở cả 9 bước —
      cùng lệnh trên.
- [ ] `referenceCode` đặt khối kiểm thử trong `if __name__ == "__main__":` vẫn đạt mọi ca (ca
      biên `runpy`) — kiểm cho ít nhất 1 bước mỗi dự án.
- [ ] Schema: `apisim` + `probeCode` hợp lệ; `pytest` + `probeCode` vẫn bị từ chối —
      `npx vitest run packages/subject-programming/projectSteps.test.ts`.
- [ ] E2E chấm một bước apisim trên Pyodide thật bằng `referenceCode` → đạt hết (mở rộng spec E2E
      dự án đang có, nếu có ca apisim; nếu chưa có thì thêm một ca cho `t2-p4-s5`).

**Lệnh chứng minh:**

```bash
npm run typecheck && npm run lint && npm run test:coverage && npm run build
npx vitest run packages/subject-programming
```

## ⑤ Bất biến không được phá

| Bất biến                                                               | Test nào canh nó                                                         |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `referenceCode` của mọi bước Python-lane đạt mọi ca của bước đó        | `packages/subject-programming/lessonsPython.test.ts`                     |
| Bước `pytest` không có `probeCode`                                     | `packages/subject-programming/projectSteps.test.ts`                      |
| Ca hiện có giữ nguyên nhãn + chuỗi mong đợi (học viên cũ không đỏ oan) | so diff trong PR; test reference ở trên                                  |
| Server không đổi hành vi                                               | `apps/server/src/api/subjects/programming/progress.projectTrack.test.ts` |

## ⑥ Rủi ro và rollback

- **Rủi ro:** người học đã làm đúng phần đề nói, nhưng API lệch ở chỗ đề KHÔNG nói rõ, có thể
  trượt ca `KT`. Ca ẩn chỉ hiện "Ca ẩn N", không hiện nhãn (`ProgrammingProjectPage.tsx`), nên
  người học không biết mình trượt điều gì. Vì vậy probe CHỈ được kiểm hành vi đã ghi rõ trong
  `requirement` của bước, và mỗi ca `KT` phải trỏ được tới đúng câu đó trong đề (ghi ở chú thích
  cạnh ca).
- **Tiến độ đã lưu không bị ảnh hưởng:** bước đã `completed` giữ nguyên; chỉ lần chấm mới dùng ca mới.
- **Rollback:** revert PR (chỉ đổi nội dung bước + một `refine`; không schema CSDL, không API).
