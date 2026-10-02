# 0476 — Rút gọn CLAUDE.md: giữ luật, dời nguyên văn lý do/lịch sử sang `docs/` (2026-10-02)

- **Ngày:** 2026-10-02 · **PR:** [#1211](https://github.com/seeker19110/dhcb/pull/1211) · **Loại:** `docs(claude-md)`.
- **Nối tiếp:** đề xuất (2) của đợt 2 tích hợp ECC (`docs/research/ecc-everything-claude-code.md`
  mục 6). Chủ dự án duyệt **"Đồng ý, làm 1 PR"**: dời NGUYÊN VĂN phần lịch sử/giải thích sang
  `docs/`, giữ luật + một dòng trỏ, có script kiểm không mất luật, `check:docs` vẫn xanh.

## Vì sao

`CLAUDE.md` được nạp vào **mọi** phiên Claude, nên mỗi ký tự thừa tốn ở mọi lượt làm việc. File
đã lên 43.964 ký tự. Phần lớn chỗ phình là **lý do, lịch sử và số đo** đi kèm luật, chứ không
phải bản thân luật. Ví dụ:

- số đo cửa sổ bật auto-merge của PR #865/#866/#867;
- danh sách 10 skill kèm tính năng mô tả;
- lịch sử cải tổ workspace PR-S1..S4;
- quy trình 5 bước sinh lại vòng từ vựng;
- lý do từng luật CI.

## Việc đã làm

### A. CLAUDE.md: 43.964 → 31.784 ký tự (−28%)

21 đoạn được rút gọn, ở các mục §1, §2, §2.1, §3, §4, §6, §7, §8, §11 và §11.1. Mỗi đoạn giữ
**luật** kèm một dòng trỏ dạng ``docs/claude-md-chi-tiet.md` §X``. **Số mục giữ nguyên**, vì
nhiều test và tài liệu dẫn "CLAUDE.md mục 4.5 / 8 / 11.1".

Sửa kèm hai chỗ đã lỗi thời và tự mâu thuẫn trong chính file. Bản gốc của cả hai vẫn nằm trong
file chi tiết.

- §1 còn liệt kê trụ Career · Startup · Life, dù ba trụ này đã gỡ hẳn ngày 2026-09-20.
- §6 dòng "Frontend" ghi "React 18 + Vite 7 + Tailwind 3", trong khi `package.json` và ngay bên
  dưới đều là React 19 / Vite 8 / Tailwind 4.

### B. `docs/claude-md-chi-tiet.md` — bản gốc từng đoạn, theo số mục §

File được sinh bằng script từ **khoảng dòng** của bản gốc, không gõ lại tay. Có hai lý do:

1. không lệch chữ;
2. dòng chứa `\u0000` ở §8 không đi qua công cụ ghi file, tránh bẫy escape bị giải mã thành ký
   tự thật (TRAPS mục 8).

Đầu file ghi rõ: **luật hiện hành nằm ở CLAUDE.md**; khi hai nơi lệch nhau, CLAUDE.md thắng.

### C. Cổng chống mất chữ và chống phình lại

- **`npm run check:claude-md -- <ref>`** (`scripts/check-claude-md-moved.ts`): mọi dòng của
  CLAUDE.md ở `<ref>` phải còn **nguyên văn** ở CLAUDE.md mới hoặc ở file chi tiết. Thoát 1 và in
  từng dòng bị mất. Đây không phải cổng CI, vì ref so sánh đổi theo từng lần rút gọn.
- **`scripts/claude-md-split.test.ts`** (chạy trong CI):
  - mọi dòng trỏ `§X` phải có mục `## §X` thật trong file chi tiết;
  - CLAUDE.md ≤ **34.000** ký tự (còn khoảng 7% chỗ trống). Thêm luật mà chạm trần thì dời phần
    lý do của luật cũ đi trước, **đừng nâng trần cho vừa**.
- Logic thuần nằm ở `scripts/lib/claudeMdSplit.ts`, có test riêng.

## Bằng chứng

- `npm run check:claude-md -- origin/main`: **0 dòng bị mất**.
- **Đã kiểm cổng bắt được lỗi:**
  - xoá một dòng (bước 3 của §11) khỏi file chi tiết → script in đúng dòng đó và thoát **1**;
  - làm rỗng file chi tiết → thoát **1**;
  - khôi phục → thoát **0**.
- `npm run check:docs` xanh: 11 lệnh và 13 agent vẫn được khai.
- Prettier, ESLint và test (`claude-md-split`, `changelog`, `no-control-chars`,
  `agent-config-security`) đều xanh.
- `file CLAUDE.md`: UTF-8 thuần, dòng `\u0000` còn nguyên 6 ký tự.

## Lưu ý

- Đích ước lượng khi xin duyệt là khoảng 29 nghìn ký tự. Thực tế dừng ở **31.784**, vì phần còn
  lại là luật hoặc lệnh dùng hằng ngày: quy ước PR/metadata, chính sách cache TTS, gói dịch vụ,
  cổng commit, eval prompt. Rút thêm nữa là bắt đầu dời luật đi, trái nguyên tắc "giữ luật".
- Hai cụm "Prettier — đang thêm ở bước khung" (§6) và "sau khi thêm Prettier" (§8) cũng đã lỗi
  thời, vì Prettier có từ lâu. Đợt này giữ nguyên để diff chỉ là "dời + rút gọn"; nên sửa ở lần
  chạm CLAUDE.md kế tiếp.
