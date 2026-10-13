# 0632 — Ghim mọi GitHub Action theo SHA và thêm `permissions.deny` cho Claude Code

- **Ngày:** 2026-10-13 · **PR:** #PENDING · **Loại:** `ci(security)`
- **Nguồn việc:** mục 2 và 3 trong `docs/research/2026-10-13-goi-y-nang-cap.md` (changelog `0630`).
  Chủ dự án chốt "theo khuyến nghị".

## Vấn đề

1. **16/21 dòng `uses:` ghim theo TAG** (`actions/checkout@v7`, `setup-node@v7`, `cache@v6`,
   `upload-artifact@v7`, `github-script@v9`). Tag là con trỏ dời được. Nếu tag bị dời sang commit
   độc, mọi job sẽ chạy mã đó kèm `GITHUB_TOKEN`. Test canh (luật 4, changelog `0521`) chỉ đòi ghim
   action **bên thứ ba** và miễn cho `actions/*`.
2. **`permissions.deny` trong `.claude/settings.json` rỗng.** Hiện chỉ có hook
   `block-dangerous-git.sh` chặn lệnh git nguy hiểm. Nếu hook không chạy (thiếu `jq`, hoặc công cụ
   khác đọc settings) thì không còn lớp nào chặn. Trong khi đó `allow` lại có `Bash(git push:*)`.

## Đã làm

1. **Ghim 16 action theo SHA commit**, giữ chú thích phiên bản để Dependabot `github-actions` vẫn
   nâng được:

   | Action                    | SHA                                        | Phiên bản |
   | ------------------------- | ------------------------------------------ | --------- |
   | `actions/checkout`        | `3d3c42e5aac5ba805825da76410c181273ba90b1` | v7.0.1    |
   | `actions/setup-node`      | `949feb2413d6458794dcd2491c4babbbce0c15c1` | v7.1.0    |
   | `actions/cache`           | `55cc8345863c7cc4c66a329aec7e433d2d1c52a9` | v6.1.0    |
   | `actions/upload-artifact` | `cf430e030ddbb5b0abf93d22962f4752f3646cd9` | v7.0.2    |
   | `actions/github-script`   | `3a2844b7e9c422d3c10d287c895573f7108da1b3` | v9.0.0    |
   - SHA lấy bằng `git ls-remote` ngay lúc làm.
   - Tag chính (`v7`, `v6`, `v9`) trỏ ĐÚNG commit của bản vá ghi ở cột phiên bản, nên hành vi CI
     không đổi.
   - `github-script` dùng tag có chú thích (annotated), nên ghim SHA **commit đã bóc**
     (`refs/tags/v9.0.0^{}`), không ghim SHA của đối tượng tag.

2. **Siết test canh** `scripts/ci-workflow-policy.test.ts`: mọi `uses:` (trừ action cục bộ `./`)
   phải `@<SHA 40 ký tự>`, kể cả `actions/*`. Cập nhật dòng tương ứng ở
   `docs/ops/repository-settings.md`.

3. **Thêm `permissions.deny` HẸP** (14 luật). Danh sách lấy đúng những gì hook đã chặn:
   - force-push: `--force`, `-f`, `--force-with-lease`;
   - push thẳng `main`: `git push origin main`, `git push -u origin main`;
   - `reset --hard`, `clean -f`/`-fd`/`-fdx`, `branch -D`;
   - `checkout .` / `restore .` (có và không có `--`).

   Theo luật Claude Code, `deny` thắng `allow`, nên `Bash(git push:*)` vẫn dùng được cho push thường.

4. **Test mới** trong `scripts/agent-config-security.test.ts`:
   - `deny` có đủ luật cốt lõi.
   - `deny` KHÔNG chặn việc quy trình bắt buộc phải làm. Không có luật `rm`, vì CLAUDE.md mục 8 đòi
     `rm -rf packages/*/dist dist dist-server`. Không có luật `Read(.env…)`, vì `.env` để ở `ask`.
     Không có luật tiền tố `checkout .:*`.

## Quyết định

- **Không làm theo nguyên văn gợi ý "`rm -rf`, đọc `.env*`"** trong tài liệu 0630:
  - Chặn `rm -rf` sẽ phá bước bắt buộc trước lần push cuối.
  - Chặn đọc `.env` sẽ phá `npm run eval:*`, vốn cần chủ dự án duyệt đọc key. Để ở `ask` là đúng
    mức.
- **`checkout .` / `restore .` khớp CHÍNH XÁC, không theo tiền tố.** Luật `Bash(git checkout .:*)`
  sẽ chặn nhầm `git checkout .github/workflows/ci.yml`, tức lệnh khôi phục MỘT file.
- **Không thêm luật cho kiểu tải-rồi-chạy (`curl … | sh`).** Luật quyền dạng tiền tố không bắt được
  kiểu này một cách tin cậy (xem chú thích đầu `block-pipe-to-shell.sh`). Hook vẫn là lớp chặn.

## Bằng chứng

- `grep -hE "uses:" .github/workflows/*.yml | grep -vcE "@[0-9a-f]{40}"` → `0` (trước đó `16`).
- **Đỏ-trước:**
  - Cất tạm thay đổi workflow (`git stash push -- .github/workflows`) rồi chạy test canh: đỏ, liệt
    kê đúng 16 dòng.
  - Cất tạm `settings.json`: test `deny` đỏ.
  - Trả lại thay đổi thì cả hai xanh.
- `npx vitest run scripts/agent-config-security.test.ts scripts/claude-hooks.test.ts scripts/ci-workflow-policy.test.ts`
  → 157/157 xanh.
- Cổng commit đầy đủ: xem mô tả PR.

## KHÔNG làm

- Mục 1 (`opusplan`): là quyết định chi phí của chủ dự án (changelog `0376`, `0620`).
- Mục 4 (`auto-complete-guard.sh` ở hook Stop): chậm, trùng `pre-commit-gate.sh` và CI.
- Mục 5 (rút gọn `CLAUDE.md`): để PR riêng.
- Mục 6 (TypeScript 6): để đợt nâng phụ thuộc.
