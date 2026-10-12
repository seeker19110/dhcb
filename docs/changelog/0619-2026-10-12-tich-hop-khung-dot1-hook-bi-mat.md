# 0619 — Tích hợp khung project-template (đợt 1): vá hook chặn git nguy hiểm · rào bí mật trước commit

- **Ngày:** 2026-10-12 · **PR:** #1381 · **Loại:** `fix(hooks)`
- **Nguồn việc:** chủ dự án: "chờ project-template merge xong rồi tích hợp sâu những cái hay, ưu
  điểm vào dự án" → "đọc toàn bộ luôn" → "xong tích hợp luôn".
- **Khung đối chiếu:** `seeker19110/project-template` @ `59bd1d1` (sau PR #289 của khung), đọc HẾT
  348 file (4 subagent chia vùng: `.claude`+`scripts`+`tests` · `docs/framework`+file gốc ·
  `docs/reports|adr|ops|…` · `.github`+`docs/specs|work`). Lần tích hợp trước: `0292`, `0294`.

## Vấn đề (ĐO THẬT, không đọc mã đoán)

1. **`block-dangerous-git.sh` để lọt 10 biến thể** (payload JSON giống Claude Code): refspec
   `+HEAD:main`/`+refs/heads/main`, `:main`, `--delete main`, cờ gộp `-fu`, `bash -c 'git reset
--hard'`, `"don't" && git reset --hard && echo "it's"`, heredoc `<<-EOF` thụt tab,
   `checkout -- .`, `stash clear/drop` — TRAPS.md mục 22.
2. **`pre-commit-gate.sh`** không chặn commit trên `main`, không chặn bí mật (bí mật chỉ bị gitleaks
   bắt ở CI — tức SAU khi đã push lên repo public), và coi `git commit -m x && rm --no-verify` là
   bỏ cổng.
3. **`maintenance-sweep.sh`** in NGUYÊN VĂN dòng khớp mẫu bí mật vào báo cáo (lộ chính khoá đang
   cảnh báo); regex riêng sót `sk-ant-` (Anthropic — AI chính), `AIza` (Google TTS/Gemini),
   `github_pat_`; chèn tên file vào chuỗi `sh -c "…{}…"`.
4. **`.gitignore`** không chặn `.env.production`/`.env.staging`… (`git check-ignore` xác nhận).
5. **4 hook thoát IM LẶNG khi thiếu `jq`** (`config-protection` — chính cổng bảo vệ cổng,
   `block-pipe-to-shell`, `auto-format`, `shared-file-reminder`) → tưởng đang canh mà đã tắt.
6. **`config-protection.sh`** sót file cổng: các `tsconfig*.json` ngoài base, `playwright.config.ts`,
   `.github/dependabot.yml`, `scripts/check-*`, `scripts/sql-prepare-allowlist.json`.

## Đã làm

- **`.claude/hooks/_lib.sh` (mới)** — bộ lọc "bỏ dữ liệu trước khi so khớp" MỘT nguồn cho hai hook
  (lấy từ khung, giữ nguyên các vá TRAPS 53/62 của khung).
- **`block-dangerous-git.sh`** viết lại trên `_lib.sh`: soi cờ trong ĐOẠN lệnh git (cờ `rm -rf`
  không bị tính nhầm), token hoá đoạn `git push` (refspec `+…`, cờ gộp, đích `src:dst`), thêm
  `checkout/restore [--] .` (`restore --staged .` vẫn cho qua), `stash clear/drop`, xoá nhánh chính.
  **Giữ luật riêng của DHCB: chặn MỌI force-push** (khung chỉ chặn vào main, nhánh khác cảnh báo)
  — chặt hơn, không nới. Xoá nhánh feature (`--delete claude/x`, TRAPS mục 21) vẫn được.
- **`scripts/_commit-guard.sh` (mới)** — mẫu bí mật + ngưỡng file lớn MỘT nguồn cho 3 nơi dùng.
- **`pre-commit-gate.sh`**: rào (1) đứng trên main/master (`ALLOW_COMMIT_ON_MAIN=1`), (2) bí mật
  trong phần THÊM của diff, kể cả `git add … && git commit`/`commit -a` (hook chạy trước lệnh nên
  index còn cũ), (3) file **THÊM MỚI** > 1 MB — chỉnh so với khung: khung chặn cả file SỬA, nhưng
  DHCB có 5 file dữ liệu > 1 MB (`curriculum.json`, `cefr*Vocab.json`, `sitemap-words.xml`,
  `lessons.json`) sửa thường xuyên; (5) đếm chuỗi đỏ cùng chữ ký ở `.claude/.gate-red-streak` —
  lần 2 nhắc ghi lỗi ở tầng nào, lần ≥ 3 nhắc dừng báo người dùng (AI_DELIVERY_LOOP §5 trước đây
  chỉ là văn xuôi). `--no-verify` chỉ tính khi cùng đoạn với `commit`. Rào 1–3 chạy cả ở dry-run.
- **`scripts/check-staged-secrets.sh` (mới) + `.husky/pre-commit`** — cùng mẫu bí mật cho MỌI
  commit (gõ tay, Codex), không chỉ commit qua Claude Code.
- **`maintenance-sweep.sh`**: dùng mẫu chung, chỉ in `đường-dẫn:dòng [redacted]`, đọc tên file bằng
  `read -d ''`.
- **`.gitignore`**: `.env.*` + `!.env.example`.
- 4 hook in một dòng cảnh báo khi thiếu `jq`; `config-protection.sh` thêm 5 nhóm file cổng.
- **Test**: `scripts/claude-hooks.test.ts` thêm bảng 26 ca chặn / 16 ca cho qua cho
  `block-dangerous-git`, 7 ca mẫu bí mật (khoá GIẢ dựng bằng nối chuỗi để file test không tự khớp),
  4 ca rào main/bí mật/file lớn; repo giả của test "chọn thư mục cổng" chuyển sang nhánh `work`
  (cổng nay chặn commit trên main kể cả dry-run); bài EPIPE bỏ qua `_*.sh` (thư viện, không phải
  hook). `scripts/agent-config-security.test.ts` thêm 9 file cổng mới vào bảng đại diện.
- **TRAPS.md mục 22.**

## Quyết định

- Các file cổng (hook, `.husky/pre-commit`, `agent-config-security.test.ts`) sửa qua đúng quy
  trình `config-protection`: nêu lý do với chủ dự án trước, mọi thay đổi đều SIẾT, không nới.
- KHÔNG lấy `deny` list 54 mục của khung vào `settings.json` ở đợt này: `config-protection` của
  DHCB đã mạnh hơn cơ chế `ask` của khung; deny thô dễ chặn lệnh vận hành VPS thật.
- Phần còn lại của bản đối chiếu (agent/lệnh, CI/pr-policy, tài liệu vận hành) làm ở các đợt sau —
  danh sách + quyết định LẤY/BỎ ghi ở changelog đợt kế tiếp.

## Bằng chứng kiểm chứng

- Probe tay trước khi viết test: 27/27 ca phải chặn → exit 2, 19/19 ca phải cho qua → exit 0;
  `pre-commit-gate` trong repo nháp: 11 ca (bí mật staged/chưa staged/`git add &&`, `--no-verify`
  thật và giả, file mới > 1 MB, sửa file lớn có sẵn, trên main, `ALLOW_COMMIT_ON_MAIN`, heredoc).
- `maintenance-sweep.sh --no-deps` trên worktree có khoá giả → báo `leak.ts:1 [redacted]`, đếm
  `sk-ant` trong báo cáo = 0; trên repo thật → "không" (không báo oan).
- `npx vitest run scripts/claude-hooks.test.ts scripts/agent-config-security.test.ts` → 142/142.
- Cổng đủ: xem Báo cáo xác thực trong mô tả PR.
