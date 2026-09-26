# TRAPS.md — bẫy đã mắc trong repo này

> Sổ bẫy ĐÃ MẮC THẬT của dự án `dhcb`, không phải danh sách "nên tránh" chung chung. Mỗi
> mục có ngày + PR/changelog + cách rà + cổng/quy ước chốt chặn. Khác `docs/adr/` (ghi **quyết
> định** kiến trúc): file này ghi **lỗi đã xảy ra**. Ý tưởng mượn từ repo khung
> `seeker19110/project-template` (đọc 2026-09-12), điều chỉnh cho đúng quy ước thật của
> `dhcb`.
>
> Cách dùng: gặp lỗi lạ → tìm khuôn khớp ở đây trước khi đọc code từ đầu. Sửa xong → thêm mục
> mới nếu là khuôn mới, hoặc thêm ngày/PR vào mục cũ nếu là **tái phát**.

## 1. Nhiều đợt việc cùng sửa đầu `PROGRESS.md` → xung đột git hàng loạt

**Ngày/PR:** 2026-08-26, xung đột **bốn lần liên tiếp** trong một ngày (PR #693, #695, #696,
#697).

**Khuôn lỗi:** mọi đợt việc chèn thêm một mục vào **đầu** phần "Giai đoạn hiện tại" của
`PROGRESS.md`. Hai PR chạy song song → cả hai cùng sửa đúng vùng đầu file → xung đột git phải
giải tay, lặp lại mỗi lần có ≥ 2 PR đang mở cùng lúc.

**Cách rà:** thấy `PROGRESS.md` xung đột merge nhiều lần trong thời gian ngắn → không phải lỗi
người, mà là cấu trúc file ép nhiều tác nhân ghi cùng một vùng.

**Cổng chốt chặn:** tách nhật ký đợt việc ra `docs/changelog/`, mỗi đợt MỘT FILE MỚI
(`NNNN-YYYY-MM-DD-slug.md`, xem `docs/changelog/README.md`); `scripts/changelog.test.ts` canh
quy ước đặt tên. `PROGRESS.md` chỉ còn giữ trạng thái sửa TẠI CHỖ (không chồng thêm mục) —
CLAUDE.md mục 3.

## 2. `PROGRESS.md` ghi nhánh "chưa merge" trong khi đã merge từ lâu

**Ngày/PR:** phát hiện tay 2026-09-03 (xem `PROGRESS.md`, mục nhánh
`claude/chirp-3-hd-voice-upgrade-c06eds`).

**Khuôn lỗi:** `PROGRESS.md` là văn xuôi cập nhật thủ công, không có gì ép buộc đối chiếu với
git thật. Một mục ghi "nhánh X chưa merge, PHẢI chạy đủ cổng trước khi merge" — nhưng nhánh đó
đã merge từ lâu và không còn tồn tại trên remote. Sai lặng lẽ: phiên sau đọc phải trạng thái cũ,
dễ tưởng còn việc dở hoặc mở PR cho nhánh đã không còn tồn tại.

**Cách rà:** gặp một mục trong `PROGRESS.md` nêu tên nhánh cụ thể và tuyên bố nó "đang làm"/
"chưa merge" → chạy `git ls-remote --heads origin <nhánh>` trước khi tin, đặc biệt nếu mục đó
không có ngày cập nhật gần đây.

**Cổng chốt chặn:** `scripts/check-progress-freshness.sh` — quét tên nhánh dạng
`` `xxx/yyy` `` trong `PROGRESS.md`, bỏ qua nhánh đã có nhãn giải quyết rõ ràng ("ĐÃ MERGE",
"đã merge", "không còn nhánh", "đã xoá", hoặc bọc `~~gạch ngang~~`), còn lại đối chiếu
`git ls-remote --heads origin`; nhánh không nhãn mà cũng không còn tồn tại → cảnh báo. Chạy
trong job `audit` của CI khi push lên `main` (xem `.github/workflows/ci.yml`). Hiện ở dạng
**cảnh báo, chưa chặn CI** — xem `docs/specs/2026-09-12-traps-va-kiem-progress-loi-thoi.md`
mục Rollout.

## 3. Cổng ở máy XANH GIẢ vì môi trường máy khác môi trường CI

**Ngày/PR:** 2026-09-13, PR #893 (nối 4 môn STEM vào app). **Ba lần CI đỏ liên tiếp**, cả ba
đều đã chạy đủ cổng ở máy và đều xanh trước khi push.

**Khuôn lỗi:** "chạy đủ cổng ở máy rồi" KHÔNG đồng nghĩa "CI sẽ xanh". Máy lập trình mang theo
trạng thái mà runner CI không có, và cổng ở máy có khi chạy lệnh KHÁC lệnh CI chạy. Ba biến thể
đã mắc trong cùng một PR:

| Biến thể             | Máy xanh vì                                                | CI đỏ vì                                                                               |
| -------------------- | ---------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| **Lockfile lệch**    | `npm install` tự liên kết workspace mới                    | CI chạy `npm ci`, lệnh này TỪ CHỐI khi `package.json` và `package-lock.json` lệch nhau |
| **Tạo tác build cũ** | còn `packages/*/dist` từ lần build trước để phân giải kiểu | runner checkout sạch, không có `dist` nào                                              |
| **Lệnh khác nhau**   | `npm test` (không bật coverage)                            | `npm run test:coverage` (có ngưỡng chặn)                                               |

**Biến thể thứ tư — chiều NGƯỢC LẠI: máy ĐỎ GIẢ** (2026-09-22, phiên nâng cấp major stack, đợt
changelog 0414). Container phiên mới có `node_modules` chứa **TypeScript 6.0.2** trong khi
`package-lock.json` ghim **5.9.3**. `npm run typecheck` đỏ ở cả bốn tsconfig với
`TS5101: Option 'baseUrl' is deprecated and will stop functioning in TypeScript 7.0`.

Cái bẫy nằm ở chỗ **thông báo lỗi rất thuyết phục và chỉ đúng tên file cấu hình thật** — nó mời
người ta đi thêm `ignoreDeprecations` hoặc gỡ `baseUrl` ở `tsconfig.base.json` ·
`tsconfig.api.json` · `tsconfig.package.base.json` · `apps/hub/tsconfig.json`. Sửa là **sai**: mã
nguồn và cấu hình không có vấn đề gì, chỉ công cụ sai phiên bản.

Dấu hiệu nhận ra: lỗi nhắc một phiên bản **cao hơn** phiên bản dự án khai trong `package.json`
(ở đây `^5.2.2`), và/hoặc lỗi nằm ở file cấu hình mình **không hề sửa** trong đợt việc này.

Cách rà một lệnh: `npx tsc --version` so với
`grep -A2 '"node_modules/typescript"' package-lock.json`. Lệch thì `npm ci`, rồi chạy lại cổng —
**đừng sửa file theo lỗi**.

Biến thể "lockfile lệch" nguy hiểm nhất vì nó giết **mọi** job cùng lúc ở bước cài đặt — nhìn
bảng check thấy toàn đỏ, dễ tưởng nội dung hỏng nặng, trong khi chưa cổng nào kịp chạy.

**Cách rà:** dấu hiệu nhận ra ngay từ bảng check, trước khi đọc log:

- **Mọi job đỏ, mỗi job chỉ sống ~10 giây** → hỏng ở bước cài đặt, gần như chắc chắn là
  lockfile. Đối chiếu: thêm/xoá thư mục trong `packages/` hay `apps/` ở PR này không?
- **Job đỏ ở một project TypeScript mình không đụng tới** → thiếu khai báo phân giải. Tái hiện:
  `rm -rf packages/*/dist && npm run typecheck`.
- **Chỉ "Unit tests + coverage" đỏ mà test không báo ca nào hỏng** → ngưỡng coverage. Tái hiện:
  `npm run test:coverage` (KHÔNG phải `npm test`).

**Cổng chốt chặn** — chưa tự động hoá được, nên là QUY ƯỚC làm việc, áp cho mọi PR:

1. **Thêm hoặc xoá một gói trong `packages/`/`apps/` thì PHẢI chạy `npm install` và commit
   `package-lock.json` kèm theo.** Kiểm nhanh trước khi push: `npm ci` phải trả về 0.
2. **Trước lần push cuối, xoá tạo tác build rồi chạy lại cổng:** `rm -rf packages/*/dist dist
dist-server` rồi `npm run typecheck`. Đây là cách duy nhất tái hiện được checkout sạch của
   CI mà không cần clone lại.
3. **Đọc `.github/workflows/ci.yml` để chạy ĐÚNG lệnh CI chạy, đừng chạy lệnh gần giống.**
   Cụ thể: cổng test của CI là `npm run test:coverage`, không phải `npm test`.

Liên quan: CLAUDE.md mục 8 đã cảnh báo "công cụ phải khớp lockfile" cho trường hợp `node_modules`
cũ; mục này mở rộng khuôn đó sang lockfile, tạo tác build và lệnh chạy.

---

## 4. Test tự kiểm dữ liệu bằng CHÍNH dữ liệu đó → xanh giả, và tài liệu viện dẫn nó làm cổng duyệt

**Ngày/PR:** mắc ở PR #893 (2026-09-13), phát hiện và sửa ở PR #900 (2026-09-14), ghi lại ở
PR #901. Báo cáo đầy đủ: `docs/audit/2026-09-14-tinh-chinh-xac-cong-thuc-va-ket-qua.md`.

**Khuôn lỗi — hai tầng, tầng dưới nguy hiểm hơn tầng trên:**

_Tầng 1 — test mù._ Ca test "mọi đáp án tự chấm đúng" của 4 môn STEM dựng bài làm của học sinh
bằng `(value - offset) / factor`, tức **suy đầu vào ra từ chính trường đang bị kiểm**. `value`
khai sai hệ quy chiếu thì đầu vào cũng sai y hệt, hai cái sai triệt tiêu nhau, cổng không bao giờ
đỏ được. Nó đã bỏ lọt **9 câu Vật lí chấm SAI học sinh trả lời ĐÚNG**. Bẫy phụ: cách sửa tưởng
là hiển nhiên — nạp thẳng `${value} ${unit}` — cũng mù, chỉ mù **chiều ngược lại** (báo đỏ oan
bài khai chuẩn SI). Không chuỗi nào suy được từ riêng `value` mà phân biệt được hai ca.

_Tầng 2 — tài liệu phong nó làm cổng duyệt._ Đặc tả 2026-09-13 viện dẫn chính ca test đó làm lý
do **bỏ khâu duyệt của người có chuyên môn** ("người duyệt tự động"), và nhật ký #893 ghi "mỗi
môn đều có" trong khi **môn Sinh không hề có**. Hệ quả: "12305 test xanh" bị đọc thành "nội dung
đã được duyệt", và nợ chuyên môn biến mất khỏi tầm nhìn điều hành. Kể cả sau khi cổng đã hết mù,
nó vẫn **không** phán được nội dung dạy có đúng chương trình hay không — 442/665 câu (66,5%) là
trắc nghiệm, riêng Sinh 169/170, và với dạng này cổng chỉ xác nhận `correctIds` nằm trong
`choices`.

**Cách rà.** Với bất kỳ test nào tự nhận là "kiểm chất lượng dữ liệu", hỏi đúng một câu:
**đầu vào của bài kiểm tra có ĐỘC LẬP với trường đang bị kiểm không?** Dấu hiệu trong mã: biến
đóng vai đầu vào được suy ra từ chính trường đó (một `switch` trên `q.answer.kind` dựng
`studentInput` từ `q.answer`). Không có nguồn độc lập thì ca test chỉ chứng minh dữ liệu nhất
quán với chính nó.

**Cổng chốt chặn:**

1. `packages/core-grading/selfGrade.ts` — một bản dùng chung cho cả 4 môn (trước đó bốn bản tự
   viết đã lệch nhau: Hoá đúng, Toán/Lí mù, Sinh không có). Hai lớp: tự chấm, **cộng** đối chiếu
   con số hiển thị với `explain` — lời giải tác giả viết tay, nguồn ĐỘC LẬP với `value`.
2. Khai đáp án có đơn vị bằng `donViHienThi(<số hiển thị>, <đơn vị>)`, không gõ tay số SI và
   không chôn hệ số ma thuật.
3. **Không tài liệu nào được viện một cổng máy làm lý do bỏ khâu duyệt của người.** Cổng máy
   kiểm tính nhất quán và tính đúng số học; tính đúng kiến thức thì chỉ người đọc mới kết luận
   được. Nợ đó phải nằm trong `PROGRESS.md` với con số thật, đo bằng script, không chép tay.

## 5. Nhiều tác nhân ghi song song + thao tác git toàn cây → nội dung bị NHÂN ĐÔI hoặc mất

**Ngày/PR:** 2026-09-14, đợt hoạt ảnh STEM (`docs/changelog/0309-*.md`). Bắt được **trước khi
push**, nhưng chỉ vì tình cờ đối chiếu số khối `animation` giữa HEAD và cây làm việc.

**Khuôn lỗi:** năm tác nhân cùng ghi vào các gói khác nhau của một repo. Hai thao tác git tưởng
vô hại lại tác động lên **toàn bộ cây làm việc**, không riêng phần của người gọi:

| Thao tác                              | Hậu quả đã xảy ra thật                                                                                                                                                                                                  |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `git commit` đi qua **`lint-staged`** | `lint-staged` cất stash phần CHƯA stage rồi khôi phục sau khi chạy. Với tác nhân khác đang ghi, bản khôi phục **áp đè lần thứ hai** lên bản vừa commit → **16 hoạt ảnh Toán bị nhân đôi** trong cùng một object literal |
| `git stash` để "so với HEAD cho sạch" | Cất luôn phần việc đang dở của tác nhân khác. Lần này pop lại kịp nên không mất, nhưng đó là may                                                                                                                        |
| Dùng chung một thư mục scratchpad     | Một tác nhân ghi đè file của tác nhân khác giữa chừng, **mất 20 hoạt ảnh đã soạn**, phải viết lại                                                                                                                       |

**Vì sao không cổng nào bắt được khoá nhân đôi:** trong JS, khoá trùng trong object literal thì
**khoá sau lặng lẽ thắng**. TypeScript không báo với object literal gán vào mảng đã có kiểu,
Zod chỉ thấy giá trị cuối, Prettier định dạng cả hai bình thường, test độ phủ vẫn xanh vì bài
đó vẫn "có hoạt ảnh". Nó chỉ hiện ra khi **đếm** số khối.

**Cách rà (rẻ, chạy được ngay):**

```bash
# so so khoi mot khoa giua HEAD va cay lam viec — lech = nhan doi hoac mat
for f in packages/subject-*/lessons/*.ts; do
  o=$(git show HEAD:$f 2>/dev/null | grep -c 'animation: {'); n=$(grep -c 'animation: {' $f)
  [ "$o" != "$n" ] && echo "$f HEAD=$o WT=$n"
done
```

Và để chứng minh "chỉ thêm, không đụng nội dung cũ": tước bỏ mọi khối khoá mới khỏi bản làm
việc bằng cách đếm ngoặc, chạy Prettier cả hai bản, rồi `diff` — khác biệt phải chỉ còn các
dòng comment được thêm.

**Cổng chốt chặn / quy ước:**

1. Khi còn tác nhân khác đang ghi, commit bằng **`git commit --no-verify`** và **tự chạy**
   `npx prettier --check` + `npx eslint --max-warnings 0` trên đúng các file mình commit. Không
   để `lint-staged` đụng vào cây làm việc.
2. **Không bao giờ `git stash`** (kể cả để kiểm chứng) khi có tác nhân khác đang ghi. Muốn so
   với HEAD thì dùng `git show HEAD:<file>` ra file tạm — chỉ đọc, không đụng cây làm việc.
3. Mỗi tác nhân dùng **thư mục con riêng** trong scratchpad; đường dẫn scratchpad là của cả
   phiên, không phải của riêng từng tác nhân.
4. Trước khi commit phần việc của một tác nhân: **đếm khoá** như lệnh rà ở trên. Lệch là dừng,
   khôi phục từ HEAD rồi làm lại — đừng sửa tay.

## 6. Cho một giá trị "luôn tồn tại" → mọi `if (x)` cũ ÂM THẦM đổi nghĩa

**Ngày/PR:** 2026-09-15, PR #919 (chế độ Khách) — 8 test E2E đỏ cùng lúc, xem
`docs/changelog/0317-*.md`.

**Khuôn lỗi:** đợt việc cho `AuthProvider` cấp một `User` **ảo** khi chưa đăng nhập (khách vãng
lai), để mọi trang nội dung chạy được mà không phải sửa từng trang. Đổi này đúng ý đồ, nhưng nó
làm **mọi biểu thức `if (user)` đã có sẵn trong repo đổi nghĩa**: từ "đã đăng nhập" thành "trang
đã tải xong". `Login.tsx` có dòng `if (user) return <Navigate to="/" replace />` → nay đúng với
MỌI khách → **không ai vào được trang đăng nhập nữa**.

Điểm nguy hiểm: lỗi KHÔNG ném exception, không có log đỏ, trang không trắng — nó chỉ _chuyển
hướng_. Triệu chứng ở test hiện ra rất xa nguyên nhân và trông như 8 lỗi rời rạc ở 3 file spec
khác nhau: "mất nút Microsoft", "mất nút VI/EN", "không thấy form email", "`/trang-ca-nhan`
không đẩy về `/login`". Rất dễ đi vá từng test một, hoặc kết luận nhầm là "đã lỡ xoá nút OAuth".

**Cách rà:** trước khi cho một giá trị ngữ cảnh dùng chung chuyển từ "có thể null" sang "luôn có
giá trị", **liệt kê hết nơi đang dùng chính sự tồn tại của nó làm điều kiện**:

```bash
npm run codemap -- callers apps/dhcb/src/context/useAuth.ts#useAuth
grep -rn "if (user)\|if (!user)\|user ? \|user &&" apps/dhcb/src --include=*.tsx
```

Phân loại từng chỗ: dùng `user.id` làm khoá dữ liệu (giữ nguyên — đó chính là cái ta muốn), hay
dùng `user` để hỏi "đã đăng nhập chưa" (PHẢI đổi sang cờ mới, ở đây là `isGuest`).

**Dấu hiệu nhận ra khi đã lỡ:** nhiều test đỏ ở nhiều file nhưng **tất cả cùng một trang**. Đó
gần như luôn là MỘT lỗi, không phải N lỗi — tìm nguyên nhân chung trước khi sửa dòng nào.

**Cổng chốt chặn:** `e2e/login-redirect.spec.ts` nay khẳng định thêm `toHaveURL(/\/login$/)`
(trước chỉ kiểm ô email hiện ra), và `e2e/smoke.spec.ts` có cặp test đối xứng: khách **xem
được** `/`, nhưng `/trang-ca-nhan` **vẫn** đẩy về `/login`. Quy ước trong `App.tsx`: route mới
mặc định là `RequireAccount`, chỉ chuyển sang `AllowGuest` khi trang thật sự không đọc/ghi dữ
liệu riêng của một con người cụ thể.

## 7. Test chỉ đỏ dưới tải full suite — "Test timed out in 5000ms" (BỐN LẦN trong một buổi)

**Ngày/PR:** 2026-09-15/16, bốn lần liên tiếp: `lessonsPython.test.ts` (#937,
`docs/changelog/0334-*.md`), `seed-all.test.ts` (#949, `docs/changelog/0338-2026-09-16-sua-comment-timeout.md`),
`apps/dhcb/src/lib/programmingSrs.test.ts` + `packages/core-auth/authService.test.ts` (PR này —
`authService` phát hiện thêm bởi S05-2 khi chạy full suite).

**Khuôn lỗi:** ca test **CHẠY RIÊNG FILE LUÔN XANH** (thường vài chục–vài trăm ms tới ~2s), chỉ
**đỏ dưới tải `npm run test:coverage` full suite** (hàng trăm file test chạy song song tranh
CPU) với đúng thông báo `Test timed out in 5000ms` — ngưỡng mặc định của Vitest. Không phải lỗi
logic: bản thân việc test làm (build dữ liệu lớn, spawn `python3`, băm bcrypt thật) vốn đã tốn
thời gian gần sát ngưỡng 5s trên máy rảnh; dưới tải CPU của full suite, thời gian thật đó co
giãn thêm và vượt ngưỡng. Một lượt chạy xanh (kể cả `test:coverage` một lần) KHÔNG đủ để kết
luận hết flaky — phải đo dưới tải hoặc lặp lại nhiều lần.

**Hai nguyên nhân khác nhau đứng sau CÙNG một triệu chứng — phải phân biệt trước khi sửa:**

1. **Việc test làm THẬT SỰ THỪA** (ví dụ `programmingSrs.test.ts`: nạp cả 381 bài/~1184 thẻ vào
   SRS trong khi chỉ cần vài thẻ để kiểm hành vi limit — `addLessonCardsToSrs()` gọi `save()`
   toàn bộ dữ liệu cho MỖI thẻ nên đó là O(n²)) → **sửa cho nhanh lên**, không nới ngưỡng.
2. **Việc test làm là chi phí THẬT của production, không thừa** (`authService.test.ts`: bcrypt
   12 vòng THẬT — đúng cấu hình bảo mật production; `lessonsPython.test.ts`: spawn `python3`
   thật; `seed-all.test.ts`: build tác vụ TTS thật) → **nới `timeout` đúng ca/describe đó** theo
   khuôn `describe('...', { timeout: N }, () => {...})`, KHÔNG nới cho cả file, kèm comment tiếng
   Việt ghi số đo thật làm căn cứ.

**Cách rà (làm trước khi kết luận "đã hết flaky"):**

```bash
# 1. Đo thời gian thật của từng ca trong MỘT file nghi ngờ
npx vitest run <file>.test.ts --reporter=verbose

# 2. Rà toàn repo: ca nào có thời gian thật ≥ 60% ngưỡng của nó (mặc định 5000ms, hoặc ngưỡng
#    đã override) là ứng viên rủi ro, kể cả khi lượt đó chưa đỏ
npx vitest run --reporter=verbose > /tmp/full.log
grep -oE "✓.*[0-9]{4,}ms" /tmp/full.log
```

Không được dừng lại ở "chạy riêng file thì xanh" — đó chính xác là dấu hiệu của khuôn lỗi này,
không phải bằng chứng đã hết bệnh.

**Cổng chốt chặn:** chưa có cổng CI tự động phát hiện ca "sát ngưỡng" (mới dừng ở quy trình tay
— đo bằng `--reporter=verbose` trước khi đóng nợ). Ba PR (#937, #949, PR này) đã xử lý bốn file
biết flaky; còn file nào khác lộ ra theo cùng khuôn (`Test timed out in 5000ms` chỉ ở
`test:coverage` full, xanh khi chạy riêng) thì áp đúng quy trình hai bước ở trên — đo trước,
phân loại nguyên nhân, rồi mới chọn sửa nhanh hay nới ngưỡng.

**Biến thể E2E — "dev server NGUỘI" (2026-09-16, trả nợ ba ca flaky báo cáo tay):** cùng khuôn
timeout-5s nhưng ở tầng E2E (Playwright) thay vì Vitest, và nguyên nhân khác: KHÔNG phải CPU
tranh chấp giữa các test, mà là **Vite dev server chưa transform module lần nào** phải dịch cả
chunk trang (React mount + fetch dữ liệu tĩnh lớn qua `/public/data/*.json` — `cefr.json` 228KB,
`curriculum.json` 3,6MB) ngay trong lượt gọi `expect()` ĐẦU TIÊN sau `page.goto()`. Ca này CHỈ lộ
ra khi server thật sự nguội (container mới khởi, hoặc file bị Vite invalidate) — `npm run dev`
đã chạy sẵn (ấm) thì luôn xanh, khiến kiểm tra "chạy lại thử xem" ở máy dev bình thường không
bắt được. Ba ca: `e2e/comeback.spec.ts` ("vắng 5 ngày"), `e2e/listening.spec.ts` (cả ba ca, tab
Nghe ở trang cấp CEFR), `e2e/programming-lesson.spec.ts` ("quay lại từ bài học về ĐÚNG bậc").
Đo thật bằng `playwright.config.ts` tạm đổi cổng riêng (ví dụ 5381) + `reuseExistingServer:
false` để CHẮC CHẮN server là mới khởi (cổng 5179 mặc định `reuseExistingServer:
!process.env.CI` nên dễ nối nhầm vào dev server ấm của worktree khác — xem mục "Cổng 5179 dùng
chung" trong đặc tả giao việc): expect đầu tiên sau `goto` một mình mất 2,6–3,3s (≈55–65%
ngưỡng), chạy song song 2 worker có lượt lên 6,8s tổng thời gian ca — đủ để vượt ngưỡng mặc định
5000ms dưới tải CPU nặng hơn của suite đầy đủ. Sửa: nới `timeout` CỦA ĐÚNG expect đầu tiên sau
mỗi `goto` (không nới cả file/cả suite), kèm comment số đo. Xác nhận hết flaky: 5 lượt liên tiếp
trên server nguội, 2 worker, chạy chung nhiều spec — 25/25 ca xanh (`docs/changelog/` đợt việc
này có số PR + log đầy đủ).

**Tái phát 2026-09-25 (PR #1179, `docs/changelog/0453-*.md`):** `e2e/programming-lesson-steps.spec.ts`
— hai chỗ kiểm NGAY sau `page.goto()` URL cũ và sau `page.reload()` chưa chờ bài nạp lười xong
như helper `mo()` của chính file. Đo bằng `--repeat-each=12 --workers=6/8 --retries=0`: 7/12 lượt
đỏ trên `main`, 16/84 lượt đỏ sau reload. Sửa: chờ `#dau-bai` 30s (helper `taiLai`) và nới đúng
expect URL đầu tiên → 84/84 xanh. Cách rà cho spec mới: mọi `goto`/`reload` tới trang nạp lười phải
đi qua helper có bước chờ, không `expect` thẳng với ngưỡng 5s mặc định.

## 8. Ký tự điều khiển gõ THẲNG vào mã nguồn → `git diff` thành nhị phân, file trượt khỏi review

**Ngày/PR:** file vào `main` ở #932 (2026-09-15), phát hiện + trả nợ ở PR #964
(`docs/changelog/0349-2026-09-16-bo-ky-tu-nul-content-fingerprint.md`).

**Khuôn lỗi:** `apps/dhcb/src/lib/learningSession.ts` dùng **ký tự NUL gõ thẳng** làm dấu ngăn
trong `contentFingerprint`. Mã CHẠY ĐÚNG, mọi cổng xanh, không test nào đỏ — nhưng `file(1)`
xếp file là `data` và **`git diff` coi cả file là nhị phân**, in `Bin` thay vì nội dung. Hậu quả
không phải lỗi runtime mà là **mất khả năng review**: từ đó về sau mọi thay đổi trong file đó đi
qua PR mà không ai nhìn thấy dòng nào. Đây là kiểu hỏng IM LẶNG — không có gì đỏ để lần ra.

Rất dễ tái phát vì **chính công cụ sinh file cũng mắc**: khi viết cổng canh cho bẫy này, file
test mới tự nó dính NUL hai lần (chuỗi escape trong nội dung được ghi ra thành ký tự thật). Nên
đừng tin "mình gõ escape là xong" — phải KIỂM bằng `file`.

**Cách rà:**

```bash
# File nào git coi là nhị phân trong diff
git diff --stat | grep Bin

# Quét toàn repo (chính xác hơn file(1), không phụ thuộc heuristic)
npx vitest run scripts/no-control-chars.test.ts

# Kiểm một file sau khi sửa — phải ra "... text", KHÔNG được ra "data"
file apps/dhcb/src/lib/learningSession.ts
```

**Cách sửa:** thay ký tự thật bằng **escape trong chuỗi** (sáu ký tự: gạch chéo ngược + `u0000`
cho NUL; `t` sau gạch chéo ngược cho tab). Giá trị chuỗi lúc chạy KHÔNG đổi.
**Bắt buộc chứng minh giá trị không đổi bằng số đo**, đừng nói suông — với
`contentFingerprint` thì hash nằm trong khoá đọc nháp lưu trên máy người học, đổi hash = mọi
nháp đang gõ dở bỗng bị coi là stale. Cách gọn: tính hàm cho vài bộ đầu vào TRƯỚC và SAU rồi
`diff`, và ghim luôn giá trị vào một test (`learningSession.test.ts` — ca "ghim giá trị").

**Cổng chốt chặn:** `scripts/no-control-chars.test.ts` chạy trong CI mọi PR, quét mọi file nguồn
`git` theo dõi và báo rõ `file:dòng — byte×số lần`. Cổng này đã được tự kiểm là KHÔNG xanh giả
(chèn lại NUL thì đỏ đúng chỗ). `CLAUDE.md` mục 8 đã có câu cảnh báo bằng chữ từ trước — nó
không đủ, vì cảnh báo bằng chữ thì người ta quên.

## 9. Margin âm trên phần tử DÍNH → che mất dòng đầu của phần tử sau, và KHÔNG cổng nào bắt được

**Ngày/PR:** mắc từ khi có `Modal` sticky header; vá cục bộ hai lần — S07-2 (#944, panel Mục lục)
và S08-2 (#961, hộp thoại "Bài này đã được cập nhật"); sửa tận gốc ở PR #973
(`docs/changelog/0350-2026-09-16-modal-khong-che-dong-dau.md`).

**Khuôn lỗi:** `apps/dhcb/src/components/Modal.tsx` kéo header dính lên bằng `-mt-6` để dải nền
chạm mép khung (khung có `p-6`). Margin âm làm phần tử chiếm trong **LUỒNG** ít hơn chiều cao
thật đúng 24px, nên phần tử ngay sau nó bị header phủ lên 24px — **dòng đầu của nội dung biến
mất**. Đo thật: chồng lấn đúng 24px ở cả 8 tổ hợp `center`/`sheet` × 1440/390/320.

**Vì sao không cổng nào bắt được — và đây mới là phần đáng nhớ:**

- DOM **có đủ chữ** → mọi test tìm theo text (`getByText`, `toContainText`) đều xanh.
- `toBeVisible()` của Playwright **vẫn đúng**: phần tử không `display:none`, không `opacity:0`,
  vẫn nằm trong khung nhìn. "Bị một phần tử khác vẽ đè lên" không phải là "không visible".
- `getBoundingClientRect()` trả **chiều cao đúng** — nó không biết gì về việc bị che.
- axe/a11y không có luật nào về "phần tử này bị phần tử khác phủ".

Tức là toàn bộ bộ cổng của dự án mù với loại lỗi này. **Chỉ NHÌN ẢNH mới thấy** — đúng lý do
Tầng 8b tồn tại. Hậu quả thật: ba nhãn ô nhập của trụ Sự nghiệp (`Chức danh / Mục tiêu`,
`Công ty`, `Vai trò / Chức danh`) bị che HOÀN TOÀN suốt thời gian dài, không ai phát hiện.

**Cách rà:**

```bash
# Cổng tự động (đã có): so đáy header dính với đỉnh nội dung ngay sau nó
npx playwright test e2e/modal-sticky-header.spec.ts

# Rà tay khuôn tương tự ở chỗ khác: margin âm ĐỨNG trên phần tử sticky/absolute
grep -rn -- "-mt-\|-my-" --include=*.tsx apps/dhcb/src packages | grep -i "sticky\|fixed"
```

**Cách sửa (khuôn chung, không riêng `Modal`):** muốn nền của header dính chạm mép một khung có
padding thì **bỏ padding ở CẠNH ĐÓ của khung** và cho header tự mang padding của mình —
`px-6 pb-6` cho khung + `pt-6` cho header, thay vì `p-6` cho khung + `-mt-6 pt-6` cho header.
Trông y hệt, mà không có margin âm nào để người sau vấp phải. Margin âm NGANG (`-mx-6 px-6`) thì
vô hại: nó không đổi chỗ đứng của phần tử kế tiếp trong luồng dọc.

**Cổng chốt chặn:** `e2e/modal-sticky-header.spec.ts` — so `header.bottom` với `noiDung.top` ở
trạng thái CHƯA cuộn (cuộn rồi thì che là đúng, đó là điểm của sticky), 3 bề rộng × dáng
`center` + dáng `sheet`, cộng một ca canh header vẫn dính sau khi cuộn để bản sửa không âm thầm
giết tính năng cũ. Test phải là **E2E**: lỗi này không tồn tại trong jsdom vì jsdom không có bố
cục. Đã tự kiểm là không xanh giả (đặt lại `-mt-6` thì đỏ với `Received: 24`).

## 10. Hoạt ảnh bài học KHÔNG chạy ở 5 môn suốt nhiều tháng — mọi cổng vẫn xanh

**Ngày/PR:** phát hiện 2026-09-22 khi soi ảnh chụp theo thời gian (`docs/changelog/0407-*.md`).
Lỗi có từ lần đầu viết `packages/core-ui/LessonAnimation.tsx` (đợt 4 môn STEM,
`docs/specs/2026-09-13-hoan-thien-4-mon-stem.md`), sống qua cả GĐ0/GĐ1 hoạt ảnh (PR #1099) và
GĐ2 bước 1 (PR #1101).

**Khuôn lỗi:** renderer gắn `animation-name` (biến thiên theo từng hình) bằng inline style lên
thẻ hình CON, còn `animation-duration`/`iteration-count`/`play-state`/`fill-mode` lại khai bằng
CSS cho thẻ `<g data-animated='true']` CHA. **CSS animation không kế thừa xuống con.** Kết quả:
thẻ cha có duration 9s nhưng `animation-name: none`; thẻ con có tên nhưng `animation-duration:
0s` → không hoạt ảnh nào từng chạy ở Toán/Lí/Hoá/Sinh/Lập trình. Cảnh ở mốc 0 vốn đã đúng nên
trang trông vẫn "có hình", chỉ là hình đứng yên.

**Vì sao KHÔNG cổng nào bắt được** (điểm đáng nhớ nhất):

- Zod `LessonAnimationSchema` kiểm DỮ LIỆU (id, mốc thời gian, màu) — dữ liệu hoàn toàn hợp lệ.
- Test renderer (`packages/core-ui/LessonAnimation.test.tsx`) kiểm CHUỖI HTML có `@keyframes`,
  có `data-animated`, có phần trăm đúng — tất cả đều có mặt, chỉ là nằm sai thẻ.
- Ảnh chụp Tầng 8b chụp **cảnh đầu** (mốc 0), mà cảnh đầu của một hoạt ảnh đứng yên thì không
  khác gì cảnh đầu của hoạt ảnh chạy được.
- jsdom không chạy CSS animation nên test đơn vị không thể phát hiện.

**Cách rà (dùng lại cho mọi nghi ngờ "hoạt ảnh có chạy không"):**

```bash
# 1. Có animation nào ĐANG chạy thật trên trang không (0 = không chạy):
#    trong trình duyệt: [...document.querySelectorAll("[data-animated='true']")]
#      .reduce((n, g) => n + g.getAnimations().length, 0)
# 2. Chụp ảnh ở NHIỀU mốc thời gian bằng animation-delay âm + play-state paused,
#    rồi NHÌN từng ảnh — hai mốc khác nhau mà ảnh giống hệt là dấu hiệu đứng yên:
#      g.style.setProperty('animation-play-state', 'paused', 'important')
#      g.style.setProperty('animation-delay', `-${t}ms`, 'important')
```

**Nguyên nhân thứ hai lộ ra NGAY SAU khi sửa nguyên nhân thứ nhất:** opacity TĨNH của hình
(`opacity: 0` khai trên hình) nằm ở thẻ con, còn opacity ĐỘNG của keyframes chạy trên `<g>` cha
— hai giá trị **nhân** với nhau. 159/238 hoạt ảnh (rà máy 2026-09-22, chủ yếu Sinh học) viết
`opacity: 0` tĩnh + keyframes nâng lên 1 với ý "keyframe quyết định lúc hiện" → hình vô hình
vĩnh viễn (0 × bất kỳ = 0). Khi hoạt ảnh còn đứng yên thì không ai thấy vì mọi thứ đều "chưa
hiện"; khi hoạt ảnh chạy được thì 4/10 hoạt ảnh Lập trình mới lộ ngay phần động không bao giờ
hiện.

**Cách sửa:** (1) đủ bộ thuộc tính animation phải nằm trên **CÙNG MỘT phần tử** — nay
`animation-name` gắn thẳng lên thẻ `<g data-animated='true'>` mang duration/play-state; (2)
hình có keyframe điều khiển opacity thì **keyframe là nguồn sự thật**, renderer bỏ opacity tĩnh
trên hình con (hình chỉ animate vị trí vẫn giữ opacity tĩnh làm nền). Sửa ở renderer thay vì
sửa 159 bộ dữ liệu.

**Cổng chốt chặn:** `packages/core-ui/LessonAnimation.test.tsx` — ca "animation-name nằm trên
CHÍNH thẻ mang data-animated (không phải hình con)": khớp `<g data-animated="true" ...
style="animation-name: dhcbAnim...">` và bắt buộc toàn trang chỉ có ĐÚNG MỘT nơi khai
`animation-name` cho mỗi hình (hai nơi cùng khai là mầm lệch tiếp theo). Đã tự kiểm không xanh
giả: trả `animation-name` về hình con thì ca này đỏ. Cùng file, ca "keyframe điều khiển opacity
thì KHÔNG in opacity tĩnh lên hình con" canh nguyên nhân thứ hai.

**Lưu ý khi chụp khung hình để kiểm:** đổi `animation-delay` âm trên animation đã `paused` cho
kết quả SAI GIẢ ở mốc gần cuối trên Chromium (không tính lại đúng theo delay mới). Cách đáng tin:
`el.getAnimations().forEach(a => { a.pause(); a.currentTime = t })`.

**Bài học rộng hơn:** với thứ chỉ "đúng" khi CHẠY (hoạt ảnh, chuyển cảnh, hiệu ứng theo thời
gian), ảnh chụp một khoảnh khắc và test chuỗi HTML đều là **cổng hình thức**. Phải kiểm ở ≥ 3
mốc thời gian khác nhau và so ảnh khác nhau thật.

**Bẫy thứ ba lộ ra khi rà mắt 34 hoạt ảnh Toán (2026-09-22, `docs/changelog/0408-*.md`):**
`rotate` trong keyframes xoay quanh **TÂM HÌNH** (`centerOf` — trung điểm đoạn thẳng), KHÔNG
quanh một đầu mút. Bán kính đường tròn lượng giác `toan11-c1-b1` khai `rotate: 0 → -360` với ý
"quay quanh gốc O" → thành thanh xoay lơ lửng quanh trung điểm của chính nó, suốt từ khi soạn mà
Zod không thể biết. Muốn quay quanh đầu mút thì phải mô phỏng: `rotate` quanh trung điểm + `dx/dy`
cho trung điểm chạy trên đường tròn bán kính r/2 (nhiều mốc, ≤ 20). Cùng lượt rà: nhãn đứng yên
trong khi hình nó gọi tên trượt đi (`toan11-c4-b2`), nhãn trạng thái chỉ có MỘT bản chữ trong khi
hình đi qua ba trạng thái (`toan10-c7-b2`), chữ dài hơn `viewBoxWidth` bị cắt (`toan12-c1-b2`).
Cổng cho lớp lỗi này: `npm run shots:lesson-anim` (chụp 5 mốc × mọi hoạt ảnh một môn, thoát 1
nếu có hoạt ảnh không chạy) rồi NGƯỜI đọc từng dải ảnh — chưa có máy nào chấm được "nhãn có đi
theo hình không".

**Bốn bẫy nữa lộ ra khi rà mắt 73 hoạt ảnh Vật lí (2026-09-26, `docs/changelog/0457-*.md`)** —
58/73 hoạt ảnh phải sửa, ~20 sai KIẾN THỨC, mọi cổng vẫn xanh:

1. **`closed: true` vẽ bằng `<polyline>` KHÔNG có cạnh khép.** `<polyline>` chỉ tô kín phần
   fill, không bao giờ vẽ nét từ điểm cuối về điểm đầu → 19 hình ở cả 4 môn thiếu đúng một cạnh
   (vòng benzen hở, mạch điện hở, đáy hình chóp thiếu cạnh). Sửa ở renderer: `closed` → `<polygon>`.
   Cổng: ca "đường khép kín (`closed`) vẽ bằng <polygon>" trong `LessonAnimation.test.tsx`.
2. **Trục y SVG hướng XUỐNG — chiều quay đọc theo trục toán học thì ngược trên màn hình.**
   `ly12-c3-b14` mô tả "ngược chiều kim đồng hồ" (đúng quy tắc nắm tay phải) nhưng bốn mũi tên
   khai theo trực giác y-hướng-lên nên trên màn hình chạy CÙNG chiều kim đồng hồ: dạy sai quy tắc
   nắm tay phải. Không máy nào bắt được; cách rà: với mọi hoạt ảnh có lời "chiều kim đồng hồ",
   "lên/xuống", "trái/phải", đọc CHIỀU trên ẢNH CHỤP rồi đối chiếu câu mô tả, không đọc toạ độ.
   Cùng họ lỗi: electron vẽ cùng chiều I ở dây dưới, dòng qua R đi ngược vòng dòng, từ thông hai
   nhánh lõi thép cùng chiều, B song song F trong loa — đều là lỗi "chiều" chỉ thấy khi nhìn ảnh.
3. **Chữ "×"/"⊗" làm ký hiệu từ trường bị vẽ ĐÈ lên hình động** vì renderer luôn vẽ nhãn SAU
   hình (để halo che đường). Ký hiệu nền phải vẽ bằng hình (hai nét, vòng tròn) đặt ĐẦU danh sách.
4. **Bẫy thứ ba ở trên (xoay/co quanh tâm) nay có lối ra:** khai `origin` cho hình — mũi tên lực
   dài dần từ điểm đặt, cột năng lượng mọc từ chân, vật quay quanh tâm quỹ đạo bằng một `rotate`
   (chính xác, thay cho mô phỏng nhiều mốc `dx/dy`). Cổng: ca "co giãn/xoay quanh `origin`".

Công cụ: `npm run shots:lesson-anim` nay in thêm dòng ⚠ hình học ở mỗi mốc (chữ tràn/đè/bị gạch,
chấm/mũi tên ra khung). **Bẫy trong chính công cụ đo** (đã mắc khi viết): đọc `durationMs` từ
`document.querySelector('style')` lấy nhầm thẻ `<style>` theme đầu trang → mặc định 1000 ms, đo
mãi giây đầu của mọi hoạt ảnh mà vẫn in "sạch". Đọc từ spec, và ném lỗi khi thiếu thay vì mặc định.

**Hai bẫy nữa lộ ra khi rà mắt 56 hoạt ảnh Hoá (2026-09-26, `docs/changelog/0459-*.md`):**

1. **Để CSS tự điền phần mốc người soạn không khai là dạy SAI theo ba cách.** Bộ vẽ từng đổi thẳng
   từng mốc sang `@keyframes`. (a) Mốc thiếu `dx/dy` được điền `translate(0, 0)`, nên hình "đứng
   yên rồi mờ đi" lại trượt về chỗ cũ. (b) CSS bỏ qua mốc thiếu `opacity` khi nội suy, nên hình
   "tới nơi mới mờ" lại mờ dần suốt đường đi. (c) Thiếu mốc 0% hoặc 100% thì CSS lấy trạng thái nền,
   nên hình "ẩn tới giây 3" lại hiện từ đầu, còn chấm đồ thị trượt thẳng về điểm đầu ở cuối vòng.
   Zod không bắt được vì dữ liệu hợp lệ; test chuỗi CSS cũ cũng không bắt được vì nó chỉ đọc lại
   đúng những gì người soạn khai. Máy so cách hiểu cũ và mới: 40 hoạt ảnh chạy khác người soạn
   định (4 Lí, 6 Hoá, 26 Sinh, 4 Lập trình). Sửa ở bộ vẽ: hàm thuần `giaiMoc`
   (`packages/core-ui/animationKeyframes.ts`) giải mốc thành trạng thái ĐẦY ĐỦ trước khi sinh CSS.
   Luật ghi trong `AnimationKeyframeSchema`: thuộc tính không khai thì giữ giá trị mốc trước; trước
   mốc đầu và sau mốc cuối giữ trạng thái đầu/cuối; opacity ban đầu là opacity tĩnh. Cổng:
   `animationKeyframes.test.ts` và ca "CSS in đủ mọi thuộc tính ở mọi mốc, kể cả 0% và 100%" trong
   `LessonAnimation.test.tsx`. Đã tự kiểm không xanh giả: bỏ phần "giữ giá trị mốc trước" thì 3 ca
   đỏ. **Hệ quả khi soạn:** muốn hình hiện đột ngột ở giây 2 thì khai hai mốc sát nhau:
   `{ atMs: 1900, opacity: 0 }` rồi `{ atMs: 2000, opacity: 1 }`. Chỉ khai mốc 0 với opacity 0 rồi
   mốc 2000 với opacity 1 là hình mờ dần hiện ra suốt 2 giây. Lỗi này đã gặp ở `ly10-c5-b29`: mũi
   tên động lượng "sau va chạm" hiện dần từ trước va chạm.
2. **Bình HỞ MIỆNG vẽ bằng `rect` (hoặc đường khép kín) thành bình CÓ NẮP.** `rect` luôn vẽ cạnh
   trên. Ống nghiệm, cốc, bình tam giác ở 10 bài Hoá trông như lọ đậy kín, kể cả cốc có cầu muối
   cắm vào. Không máy nào bắt được. Cách rà: liệt kê `rect` có `stroke` và cao ≥ 36 đơn vị rồi xem
   ảnh (script tạm đã dùng: lọc `kind === 'rect' && stroke && h >= 36`). Cách vẽ đúng: `polyline`
   KHÔNG `closed`, đi từ mép miệng trái xuống đáy (bo góc hoặc nửa vòng tròn) rồi lên mép miệng phải.
   Chất lỏng bên trong vẫn là một hình tô màu riêng. Ngoại lệ có chủ đích: ấm đun (có nắp thật),
   bình khí kín ở bài Lí.

## 11. `vi.mock` KHÔNG áp cho các `import()` động chạy ĐỒNG THỜI — chỉ lượt đầu nhận mock

**Ngày/PR:** 2026-09-22, `docs/changelog/0411-*.md` (test cho `apps/dhcb/src/lib/subjectProgressBoard.ts`).

**Khuôn lỗi:** file nguồn nạp dữ liệu bằng `import()` động bên trong một hàm được gọi nhiều
lần song song (`Promise.all(MON_STEM.map(id => theStem(id)))`, mỗi lượt lại `import('./stemEvidence')`).
Test `vi.mock('./stemEvidence', ...)` rồi bắt một môn lỗi → môn đó VẪN dựng được thẻ. Log trong
nguồn cho thấy: `mathematics mock` · `physics real` · `chemistry real` · `biology real` — chỉ
lượt `import()` ĐẦU nhận bản mock, ba lượt đồng thời còn lại nhận module THẬT.

**Vì sao nguy hiểm:** test XANH GIẢ. Các ca "đường vui" vẫn qua vì module thật cũng trả được
dữ liệu; mock không hề được gọi mà không có gì báo. Chỉ lộ khi cố làm một lượt sau lỗi.

**Đã thử và KHÔNG ăn thua:** import tĩnh chính module đó ở đầu file test để "làm ấm cache";
`vi.resetAllMocks()` thay `clearAllMocks()` (cái này sửa một lỗi KHÁC — override của test trước
rò sang test sau — nhưng không sửa lỗi này).

**Cách rà:** nếu nguồn có `import()` bên trong hàm được gọi song song, thêm tạm
`console.log('mock' in fn ? 'mock' : 'real')` ngay sau `await import(...)` rồi chạy test — mỗi
lượt phải in `mock`. Hoặc assert `mock.calls.length` bằng đúng số lượt gọi kỳ vọng, đừng chỉ
assert kết quả cuối.

**Cổng chốt chặn:** viết nguồn sao cho mỗi module chỉ `import()` MỘT lần rồi chia cho các lượt
(`cacTheStem` nạp ba module trước rồi mới `Promise.all` bốn môn). Ngoài việc test mock được, đây
cũng là cách đúng: không có lý do gì nạp lại cùng module bốn lần.

## 12. Phần tử nền tối CỐ ĐỊNH nhưng không tự đặt màu chữ → chữ tối trên nền tối, chỉ lộ dưới tải

**Ngày/PR:** 2026-09-22, PR #1114 (`docs/changelog/0416-*.md`) — `apps/dhcb/src/components/CodeEditor.tsx`.

**Khuôn lỗi:** một component render ra khung **RỖNG** rồi mới nhồi nội dung vào sau (CodeMirror,
Monaco, canvas, thư viện biểu đồ… mount trong `useEffect` và **tự tiêm style của nó**). Khung đó
đặt nền tối cố định bằng mã màu trần (`bg-[#0a0a0a]` — cố ý không theo theme) nhưng **không đặt
màu chữ**. Trong cửa sổ từ lúc khung xuất hiện tới lúc thư viện tiêm style, chữ **thừa hưởng** màu
từ cha — và ở theme nền sáng màu đó là màu **TỐI**. Kết quả: có thật một khoảnh khắc chữ tối trên
nền gần đen.

**Vì sao khó thấy:** cửa sổ ấy hẹp, máy rảnh thì gần như không tồn tại. Cổng `e2e/a11y.spec.ts`
quét đúng một thời điểm, nên nó chỉ bắt được khi máy bị tải — ở đây là lượt full suite sau khi
nâng Vite 8 (Vite 8 chỉ **đổi thời điểm nạp module**, không gây ra lỗi; lỗi có từ trước).
Rất dễ bị kết luận sai là "flake": chạy riêng test đó 3/3 xanh.

**Cách rà:** `grep -rn 'bg-\[#' apps/ packages/ --include=*.tsx` rồi với mỗi chỗ tìm được, hỏi hai
câu: (1) phần tử này có lúc nào RỖNG rồi được nhồi nội dung sau không? (2) nó có tự khai
`text-[...]` cố định không? Thiếu (2) mà có (1) là trúng bẫy. Cẩn thận: `text-white` **KHÔNG** thay
được — nó map sang token `--c-white` và **bị đảo thành màu tối ở theme nền sáng** (CLAUDE.md mục 4.5).

**Cổng chốt chặn:** `apps/dhcb/src/components/CodeEditor.test.tsx` — **đọc hai mã màu host khai
rồi ĐO tương phản**, nên đỏ cả khi ai gỡ `text-[...]` lẫn khi đổi sang cặp màu mất tương phản. Cố ý
KHÔNG dựa vào cổng a11y e2e cho lỗi này: **một cổng chỉ đỏ lúc máy chậm thì không phải cổng.** Đã
chứng minh nó bắt lỗi thật (gỡ bản sửa → 2/3 test đỏ).

## 13. Đọc DÒNG ĐẦU của lỗi build rồi kết luận nguyên nhân — dòng có thông tin nằm ở `Caused by`

**Ngày/PR:** 2026-09-22, PR #1112 → #1114 (`docs/changelog/0414-*.md` rồi `0416-*.md`).

**Khuôn lỗi:** Vite 8 build gãy, dòng đầu là `[builtin:vite-alias] plugin 'rolldown:vite-resolve'
threw an error`. Tôi đọc đúng dòng đó, kết luận **"nguyên nhân ở tầng phân giải module của
rolldown"**, xếp cả bản nâng cấp vào nợ kỹ thuật và viết vào `PROGRESS.md` + mô tả PR. **Sai.**
Dòng đó chỉ là lớp bọc ngoài cùng. Phần `Caused by` bên dưới nói thẳng nguyên nhân:
`"." is not exported ... from package packages/core-grading` — tức **một bare import
`@dhcb/core-grading` vi phạm quy ước import của chính dự án** (CLAUDE.md mục 6). Sửa một dòng là
xong; cái "nợ kỹ thuật" kia chưa từng tồn tại.

**Giá phải trả:** một bản nâng cấp bị hoãn oan, và một kết luận sai được ghi vào ba tài liệu.

**Cách rà:** khi lỗi đến từ bundler/plugin, **đừng để output bị cắt** (không `| tail`, không
`| head`) và tìm bằng `grep -A20 -i "caused by"` trước khi nêu bất kỳ giả thuyết nào. Công cụ
Rust (rolldown, swc, lightningcss) gần như luôn bọc lỗi nhiều lớp: lớp ngoài cho biết **ai** báo,
lớp trong cho biết **vì sao**.

**Cổng chốt chặn:** không phải cổng máy mà là kỷ luật — CLAUDE.md mục 5 đã cấm đoán. Trước khi
viết "nguyên nhân là X" vào tài liệu hay mô tả PR, phải dán được **nguyên văn dòng lỗi nói ra X**.
Không dán được nghĩa là đang đoán.

## 14. Đọc `location` của lượt render trong handler điều hướng → bấm nhanh hai lần ĐÈ MẤT history entry

**Ngày/PR:** mắc lần đầu ở S09b (trang bài STEM, phát hiện qua E2E 1440px: `history.length` 4 → 5,
1/6 lượt), **tái phạm** ở S09d (trang bài Lập trình). Lộ ra 2026-09-25 khi E2E S09-P-AC06 đỏ cả
hai lượt trên CI của PR #1179. Sửa ở PR #1179 (`docs/changelog/0453-*.md`).

**Khuôn lỗi:** React Router v7 (`BrowserRouter` lẫn `MemoryRouter`) cập nhật location trong
`React.startTransition` (xem `useTransitions` trong mã nguồn react-router). `navigate()` ghi vào
history NGAY, nhưng trang render lại SAU, và khi máy chậm thì trễ hẳn. Handler của cú bấm thứ hai
vì vậy đọc `useLocation()` của lượt render CŨ. Ở trang Lập trình, `goTo` thấy "chưa có hash, entry
chưa ghi bước" nên `replace` đè mất entry `#example` vừa push, và Back nhảy thẳng về đầu bài. Máy
dev rảnh không bao giờ thấy lỗi. Người dùng thật trên máy yếu bấm hai lần liền là dính.

**Cách rà:** tìm handler (không phải effect) vừa đọc `loc.hash`/`location.hash`/`loc.state`,
vừa quyết định `navigate(...)` push hay replace dựa trên giá trị đó:
`grep -rln "replace: true" apps/dhcb/src --include=*.tsx | xargs grep -ln "\.hash"`.
Handler kiểu này phải đọc qua một ref cập nhật NGAY khi điều hướng (`viTriRef` ở
`ProgrammingLessonPage.tsx`, `hashDangCho` ở `StemLessonView.tsx`/`LessonView.tsx`), không đọc
thẳng `loc`.

**Cổng chốt chặn:** unit test "hai cú bấm trong CÙNG một `act()`" (React không render lại giữa
hai cú). Đây là cách tái hiện tất định, không cần máy chậm: xem ca "hai cú bấm liền nhau trước
khi trang kịp render lại" ở `ProgrammingLessonPage.test.tsx` (đỏ trước khi sửa với đúng triệu
chứng của CI). Trang mới có điều hướng theo hash phải có ca tương tự.
