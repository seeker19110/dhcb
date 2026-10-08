# 0532 — Test vững dưới tải: bỏ việc thừa trong 6 file đỏ giả vì timeout (2026-10-08)

- **Ngày:** 2026-10-08 · **PR:** (chưa tạo) · **Loại:** `test`.
- **Nguồn:** báo cáo đo của phiên chính 2026-10-08. Trên máy 4 CPU tải 14–23 (nhiều phiên
  vitest chạy song song), `npm run test:coverage` đỏ ở MỌI lượt, lý do duy nhất là timeout, và
  mỗi lượt một tập file khác nhau. Chạy riêng từng file thì xanh. Khuôn lỗi: `TRAPS.md` mục 7.

## Nguyên nhân chung (đo, không đoán)

Các file trên chạy riêng chỉ tốn vài trăm ms tới ~4 s. Có hai yếu tố cộng vào để đẩy chúng
qua ngưỡng:

1. **Đo coverage V8 làm JS "nóng" chậm đi rất nhiều lần.** V8 phải đếm từng khối lệnh nên
   vòng lặp JS chạy trên dữ liệu lớn, và trình biên dịch TypeScript (`typescript.js` 9 MB),
   chậm đi 4–18 lần so với chạy không đo. Hai ví dụ: vòng lặp từng byte trên ~71 MB tăng từ
   0,5 s lên 9,2 s; một lượt `scanGraph` trên repo giả 2 file tăng từ 4,2 s lên 16,3 s.
2. **Máy tải ~20 trên 4 lõi** nhân thêm khoảng 1,3–2 lần nữa.

Phần lớn chi phí bị nhân lên đó là **việc thừa**: phân tích lại `lib.dom.d.ts` cho một repo
giả không dùng DOM, quét JS từng byte trên toàn repo trong khi chỉ cần biết "có hay không".
Đợt này bỏ phần thừa trước. Chỉ ở những chỗ chi phí là thật của production mới nới ngưỡng,
và nới riêng cho đúng ca/hook đó.

## Từng file

Ghi chú về số đo: "riêng" là `npx vitest run <file> --reporter=verbose`. "cov" là thêm
`--coverage.enabled`. "cov + tải" là chạy kèm hai vòng `vitest run apps/dhcb/src/pages
packages/subject-programming` song song, cộng tải sẵn có của các phiên khác; `uptime` lúc đo
là 16–25. Máy dùng chung nên số "riêng" sau khi sửa cũng đo ở tải ~22.

| File                                                       | Ca/hook nặng nhất                                  | Trước: riêng / cov / cov + tải                         | Sau: riêng (tải ~22) / cov + tải                        | Nguyên nhân                                                                                                      | Cách sửa                                                                                                                                                        |
| ---------------------------------------------------------- | -------------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `scripts/lib/scanGraph.test.ts`                            | hook `beforeAll` (dựng đồ thị)                     | 4,2 s / 16,3 s / 15,7 s (cùng phép đo đơn lẻ, tải ~20) | 0,56 s / 1,41 s (tải ~25)                               | Repo giả không có tsconfig nên TS nạp lib mặc định, gồm `lib.dom.d.ts`, phân tích lại MỖI lượt                   | Repo giả có `tsconfig.json` chỉ nạp `lib: ['es5']`, `types: []`. Cạnh import/lời gọi hàm không phụ thuộc lib. Test nay đi qua cả nhánh đọc tsconfig             |
| (cùng file)                                                | `scanGraph tạo được cạnh import xuyên qua @dhcb/*` | 1,49 s / 7,26 s / 10,07 s                              | 0,59 s / 0,61 s                                         | Như trên (chương trình TS thứ hai)                                                                               | Như trên                                                                                                                                                        |
| `scripts/no-control-chars.test.ts`                         | `không file nào có NUL…`                           | 0,52 s / 9,24 s / 11,27 s                              | 0,68 s / 0,54 s                                         | Vòng lặp JS từng byte trên ~4.300 file (~71 MB), bị coverage V8 đếm từng khối                                    | Lọc bằng regex V8 trên chuỗi latin1 (1 byte = 1 ký tự). Vòng lặp từng byte chỉ chạy trên file đã bị bắt, để in chi tiết. Tập byte cấm khai MỘT lần (`BYTE_CAM`) |
| (cùng file)                                                | `không file nào có ký tự định dạng vô hình`        | 0,68 s / 0,71 s / 1,17 s (có lượt 3,0 s ở tải ~20)     | 0,23 s / 0,28 s                                         | Giải mã UTF-8 cả ~71 MB (đo tách: utf8 + regex 0,89 s so với latin1 + regex 0,23 s)                              | Lọc trước trên byte thô bằng dãy byte UTF-8 của từng ký tự trong `VO_HINH`. Chỉ giải mã file khớp                                                               |
| `packages/subject-programming/tsPrelude.test.ts`           | ca đầu (trả chi phí lib nguội)                     | 1,38 s / 3,45 s / 6,04 s                               | ca đầu 0,23 s / 0,36 s; chi phí nguội nằm ở `beforeAll` | Phân tích lib es2020 (có DOM): chi phí THẬT của production (lượt "Chấm bài" đầu sau khi khởi động)               | Dồn chi phí nguội về một `beforeAll` có ngưỡng riêng 60 s, bỏ 30 s ở ca đầu. Ca nào đứng đầu hay được chạy lẻ (`-t`) cũng không còn gánh nó                     |
| `scripts/seed-all.test.ts`                                 | `tạo đủ tác vụ truyện cổ tích…`                    | 1,76 s / 1,95 s / 2,88 s                               | 2,97 s / 3,80 s (tải ~25)                               | `loadPatternTasks()` dựng TOÀN BỘ tác vụ TTS: chi phí thật của hàm production                                    | Nới describe 10 s → 30 s, kèm số đo. Bỏ `await import()` thừa (đổi sang import tĩnh)                                                                            |
| (cùng file)                                                | `không trùng lặp…`                                 | 0,55 s / 0,60 s / 0,55 s                               | 0,85 s / 0,81 s                                         | Khử trùng khoá trên toàn bộ tác vụ phát âm: đó chính là phép kiểm                                                | Nới riêng ca này lên 20 s, kèm số đo                                                                                                                            |
| `apps/dhcb/src/pages/learning/StemLessonRetry.test.tsx`    | `chuyển sang bài khác…`, `vào từ Sổ lỗi…`          | 0,64 s / 1,27 s / 0,96 s                               | 1,11 s / 2,18 s (tải ~25)                               | Mỗi ca dựng CẢ trang thật 2–3 lần (React dev + happy-dom). Profile: render React chiếm ~4 s/11 s CPU của cả file | Nạp bài học một lần ở `beforeAll` (loader vốn cache theo chương). Nới describe lên 20 s, kèm số đo. Không cắt bước render nào                                   |
| `apps/dhcb/src/pages/learning/StemLessonTrongBai.test.tsx` | `chọn đích khác…`, `desktop…`                      | 0,71 s / 0,74 s / 1,21 s                               | 1,18 s / 1,80 s (tải ~25)                               | Như trên                                                                                                         | Như trên                                                                                                                                                        |

**Không đổi:** cấu hình vitest/coverage (không nới timeout toàn cục), không skip/quarantine,
không bỏ assertion nào. `no-control-chars.test.ts` có thêm 2 ca canh bộ lọc nhanh. Ca thứ nhất
duyệt cả 256 giá trị byte và kiểm bộ lọc trùng khớp với `laByteCam`, đúng 30 byte cấm, tha
tab/LF/CR. Ca thứ hai kiểm mọi mã điểm trong `VO_HINH` đều bị lọc bắt, còn chữ Việt và ZWJ
emoji thì không.

## Bằng chứng

- **Thử đột biến cho `no-control-chars`:** tạo `zz-mut.ts` có NUL ở dòng 2 và `zz-mut2.md` có
  U+200B, `git add -N` rồi chạy. Kết quả: 2 ca đỏ với đúng `zz-mut.ts:2 — 0x00×1` và
  `zz-mut2.md:1`. Gỡ hai file thì xanh lại.
- **Phép đo cô lập lib cho `scanGraph`** (file đo tạm, đã xoá), cùng repo giả 2 file, cov +
  tải ~22, mỗi cấu hình chạy trong một tiến trình nguội: lib mặc định 15.651 ms · `es5`
  1.006 ms · `es2020` 1.920 ms. Cả ba cho cùng cạnh lời gọi `src/b.ts#x → src/a.ts#t`.
- **Cổng, chạy một lần trên nhánh:**
  - `rm -rf packages/*/dist dist dist-server && npm run typecheck`: exit 0.
  - `npm run lint`: exit 0.
  - `npx prettier --check` trên 7 file đổi: exit 0.
  - `npm run test:coverage` lần 1: **exit 0**. 825 file pass, 1 skip; 19.001 test pass, 2
    skip; mất 2.001 s; tải lúc bắt đầu/kết thúc 12,7 / 15,8 (giữa chừng, lúc 16:41, `uptime`
    báo 21,5).
  - `npm run test:coverage` lần 2: **exit 0**. Cùng 19.001 test; mất 995 s; tải 15,8 → 10,6.
  - Coverage cả hai lần: stmts 95,74 · branches 91,78 · funcs 96,40 · lines 96,36.
