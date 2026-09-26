# 0349 — 2026-09-16 — Bỏ ký tự NUL trong `contentFingerprint`

- **PR:** [#966](https://github.com/seeker19110/dhcb/pull/966)
- **Nhánh:** `claude/laughing-babbage-o25bls-fix-nul`
- **Loại:** trả nợ kỹ thuật (không đổi hành vi)

## Việc đã làm

1. **`apps/dhcb/src/lib/learningSession.ts`** — thay **2 byte NUL thật** (một trong comment, một
   trong `join(...)` của `contentFingerprint`) bằng escape sáu ký tự trong chuỗi TypeScript.
   File vào `main` ở #932 với ký tự gõ thẳng, nên `file(1)` xếp nó là `data` và **`git diff` coi
   cả file là nhị phân** — mọi thay đổi trong file đó trượt khỏi review bằng mắt. Mã vẫn chạy
   đúng, đây thuần tuý là lỗi **khả kiến**, và đúng cái bẫy `CLAUDE.md` mục 8 cảnh báo nguyên văn.

2. **`apps/dhcb/src/lib/learningSession.test.ts`** — thêm ca **ghim GIÁ TRỊ THẬT** của vân tay.
   Hai ca cũ chỉ so _tương đối_ ("cùng đầu vào ra cùng kết quả", "hai cách ghép ra khác nhau"),
   nên ai đó đổi dấu ngăn thành `|` vẫn xanh trong khi mọi nháp đang lưu trên máy người học bị
   coi là stale.

3. **`scripts/no-control-chars.test.ts`** (mới) — cổng chặn CI: quét mọi file nguồn do `git`
   theo dõi, đỏ nếu có byte điều khiển C0 (trừ tab/LF/CR) hoặc DEL, báo rõ file, dòng, byte và
   số lần.

## Bằng chứng

**Vân tay KHÔNG đổi** — tính bằng cách trích nguyên văn thân hàm từ file thật trên đĩa (không
chép tay) TRƯỚC và SAU, kết quả `diff` rỗng:

| Đầu vào                             | Trước      | Sau        |
| ----------------------------------- | ---------- | ---------- |
| `['ab','c']`                        | `ef850b27` | `ef850b27` |
| `['a','bc']`                        | `609747a3` | `609747a3` |
| `[]`                                | `811c9dc5` | `811c9dc5` |
| `['']`                              | `811c9dc5` | `811c9dc5` |
| `['ly10-c2-b10',3,'v1']`            | `37875ca5` | `37875ca5` |
| `['physics','ly10-c2-b10','draft']` | `81b2f813` | `81b2f813` |

**File đọc được trở lại:**

```
trước: apps/dhcb/src/lib/learningSession.ts: data
sau:   apps/dhcb/src/lib/learningSession.ts: JavaScript source, Unicode text, UTF-8 text
```

`git diff` của file nay là văn bản: `1 file changed, 2 insertions(+), 2 deletions(-)`.

**Cổng mới không xanh giả** — tự kiểm bằng cách chèn lại byte NUL rồi chạy; test đỏ với đúng
thông báo `apps/dhcb/src/lib/learningSession.ts:359 — 0x00×2`, gỡ ra thì xanh lại.

**Rà toàn repo:** 0 file nguồn nào khác còn ký tự điều khiển (quét 3.526 file theo `git ls-files`).

**Cổng:** typecheck ✅ (sau `rm -rf packages/*/dist dist dist-server`) · lint ✅ 0 cảnh báo ·
`prettier --check .` ✅ · `test:coverage` ✅ 13.607 test xanh, coverage 94,28 / 90,18 / 94,79 /
94,79 (sàn 93/89/93/93).

## Quyết định

- **Không đổi thuật toán vân tay**, kể cả sang dấu ngăn "đẹp" hơn. `contentFingerprint` nằm
  trong khoá đọc nháp đã lưu **trên máy người học**; đổi hash = mọi nháp đang gõ dở bỗng bị coi
  là "bài đã cập nhật". Byte NUL vẫn là dấu ngăn đúng (không ký tự nào của nội dung trùng nó),
  vấn đề chỉ là **cách viết nó trong mã nguồn**.
- **Ghim giá trị chứ không chỉ so tương đối.** Chi phí gần bằng 0, và nó biến một bất biến "ai
  cũng biết" thành thứ CI biết.
- **Cổng quét cả repo thay vì chỉ một file.** Đo trước khi làm: 3.526 file / 12,7 MB, chạy
  ~0,35 s — rẻ so với việc mất khả năng review một file mã nguồn mà không ai phát hiện.
- **Không đụng `PROGRESS.md`.** Món nợ này chưa từng được ghi ở đó, và thêm dòng mới vào file
  nhiều PR song song cùng sửa là đúng khuôn xung đột `TRAPS.md` mục 1. Bẫy được ghi vào
  `TRAPS.md` (mục 8) — đúng vai trò của file đó.

## Rollback

Revert PR. Không migration, không đổi dữ liệu, không đổi hành vi lúc chạy — file quay lại dạng
nhị phân trong `git diff`, hai test canh biến mất.
