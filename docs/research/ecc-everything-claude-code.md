# ECC ("Everything Claude Code") — nghiên cứu và đối chiếu với DHCB

> Ngày: 2026-10-01 · Người làm: phiên Claude Code · Quyết định đi kèm:
> [`docs/adr/0013-tich-hop-ecc-chon-loc.md`](../adr/0013-tich-hop-ecc-chon-loc.md) · Nhật ký:
> `docs/changelog/0468-2026-10-01-tich-hop-ecc.md`.
>
> **Phương pháp:** clone `github.com/affaan-m/ECC` (bản `2.2.2`, commit `c70874f`, 2026-09-29),
> đọc README, ba bộ hướng dẫn (`the-shortform-guide.md`, `the-longform-guide.md`,
> `the-security-guide.md`), `hooks/`, mã các hook chính, các agent/lệnh liên quan; đối chiếu tài
> liệu chính thức Claude Code (hooks, skills, permissions). **Không chạy mã nào của ECC** trên
> repo DHCB — đúng lời khuyên của chính ECC: coi cấu hình tác tử của bên thứ ba là hàng chuỗi
> cung ứng, đọc trước khi tin.

## 1. ECC là gì

ECC (tên cũ `everything-claude-code`) là bộ "hệ điều hành cho tác tử lập trình" của Affaan
Mustafa, giấy phép MIT. Tác giả xây nó qua ~10 tháng dùng Claude Code hằng ngày, thắng hackathon
Anthropic x Forum Ventures (giải nhất, 15.000 USD tín dụng Anthropic); công cụ quét an ninh
AgentShield đi kèm ra đời ở hackathon Cerebral Valley x Anthropic (02/2026). Đây là một trong những
repo về Claude Code nhiều sao nhất — các nguồn ghi từ ~140 nghìn (thông báo v1.10) tới ~212–214
nghìn sao (giữa 2026), tùy thời điểm đo.

Nội dung bản 2.2.2: **68 agent · 293 skill · 94 lệnh · 24 hook (sự kiện) · bộ rules theo ngôn
ngữ · bộ nhớ/"instinct" học liên tục · AgentShield**, kèm bộ cài cho Claude Code, Codex, Kimi,
Cursor, OpenCode… Vòng làm việc cốt lõi:

```text
plan -> test -> implement -> review -> verify -> remember -> improve
```

Khẩu hiệu đáng nhớ nhất: **"Optimize the context window. Persist everything else."** — ngữ cảnh
của mô hình là tài nguyên khan hiếm; thứ gì cần nhớ lâu thì ghi ra file, đừng nhồi vào prompt.

## 2. Năm ý tưởng có giá trị thật

1. **Hook thi hành luật NGOÀI ngữ cảnh mô hình.** "Hãy dùng TDD" là câu mô hình có thể quên; hook
   thì không quên. ECC có hook chặn sửa cấu hình linter (`config-protection`), format sau mỗi lần
   sửa, kiểm commit, chặn `--no-verify`, "GateGuard" bắt trình bày dữ kiện trước khi sửa file.
2. **Mỗi loại thành phần làm một việc, nạp đúng lúc** (README, mục "Skills keep the context
   focused"): rules luôn nạp nên phải ít; skill nạp khi cần; agent có ngữ cảnh riêng; hook không
   tốn ngữ cảnh. Thêm năng lực mà không nhồi cả repo vào mỗi phiên.
3. **Rà soát từ ngữ cảnh SẠCH** — người viết code không tự chấm code của mình (agent
   `code-reviewer`, skill `santa-method`: hai người rà độc lập cùng thang chấm).
4. **Biến bài học thành tài sản dùng lại** (`/learn-eval`): rút khuôn từ phiên, qua cổng chất lượng
   Save / Improve / Absorb / Drop rồi mới lưu.
5. **Bản thân cấu hình tác tử là bề mặt tấn công** (Security Guide): CVE-2025-59536 (hook trong
   repo chạy trước hộp thoại tin cậy), CVE-2026-21852 (repo đổi `ANTHROPIC_BASE_URL` để lấy API
   key), Snyk "ToxicSkills" (36% trong 3.984 skill công khai có prompt injection), ký tự Unicode vô
   hình giấu chỉ thị. Lời khuyên: hỏi trước khi đọc file bí mật, quét cấu hình như quét mã.

## 3. Vì sao KHÔNG cài nguyên khối vào DHCB

| Rủi ro                   | Bằng chứng                                                                                                                                                                                                                                                                                                                              |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Phình ngữ cảnh           | 293 skill + 68 agent đều có mô tả nằm trong danh sách của mỗi phiên. Chính ECC dặn "start with the workflow you need, not the full catalog" và "install rules selectively". CLAUDE.md của DHCB đã ~44 nghìn ký tự (~52 KB) nạp mỗi phiên.                                                                                               |
| Mâu thuẫn luật DHCB      | `block-no-verify` chặn `--no-verify` — DHCB cho phép có chủ đích (CLAUDE.md mục 8). `build-error-resolver` gốc khuyên `rm -rf node_modules package-lock.json && npm install` — DHCB cấm (TRAPS.md mục 3). `database-reviewer` gốc dạy RLS/Supabase — DHCB đã rời Supabase (ADR-0009). Rules gốc đặt coverage 80% — DHCB là 93/89/93/93. |
| Phần lớn không liên quan | Skill cho healthcare, trading, homelab, Laravel, Swift, Kotlin…                                                                                                                                                                                                                                                                         |
| Chuỗi cung ứng           | Hook ECC là mã Node chạy trên máy người dùng (GateGuard một file ~1.960 dòng); bản thân README cảnh báo có bản sao giả chứa mã độc. Một người bảo trì chính, ra bản mỗi tuần.                                                                                                                                                           |
| Môi trường DHCB khác     | Phiên cloud chạy trong container bị thu hồi → bộ nhớ phiên/instinct ghi ở `~/.claude/` mất theo container; DHCB đã có nguồn sự thật bền (`PROGRESS.md`, `docs/changelog/`, `TRAPS.md`).                                                                                                                                                 |

## 4. Đối chiếu từng mảng ECC ↔ DHCB

| ECC                                                                | DHCB đã có                                                                                | Quyết định đợt 1                                                                           |
| ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `/plan`, `planner`, `architect`                                    | `/grill`, `/contract`, `/adr`, `coordinator`, agent Plan                                  | Không thêm — trùng vai                                                                     |
| `tdd-workflow`, `tdd-guide`                                        | `/debug` Pha 5 (test hồi quy trước khi sửa), CLAUDE.md mục 4.9                            | Không thêm (xem đợt 2)                                                                     |
| `/code-review`, `code-reviewer`, `security-reviewer`               | `/review` + OpenCodeReview (ADR-0012) + `security-reviewer`                               | Không thêm                                                                                 |
| `/quality-gate`, `verification-loop`                               | `/gate` + hook `pre-commit-gate.sh`                                                       | Không thêm                                                                                 |
| `/build-fix`, `build-error-resolver`                               | Chỉ có luật bằng chữ (CLAUDE.md mục 11 "PR mình tạo là của mình")                         | **THÊM**, viết lại theo bẫy thật của DHCB                                                  |
| `silent-failure-hunter`                                            | Không có                                                                                  | **THÊM**, thêm khuôn "rào an ninh/tiền fail-open"                                          |
| `database-reviewer`                                                | `/contract` (thiết kế trước), `security-reviewer` (rộng)                                  | **THÊM**, bỏ RLS/Supabase, thêm `user_id` từ token + migration lũy đẳng                    |
| Hook `config-protection`                                           | Luật chữ "đừng sửa test cho vừa" (mục 11.1)                                               | **THÊM** — hai nấc: từ chối lần đầu kèm lý do, sau đó hỏi; danh sách là cổng thật của DHCB |
| Hook `post-edit-format`                                            | `pre-commit-gate.sh` ghi "auto-format.sh đã format" — **nhưng file đó chưa từng tồn tại** | **THÊM** `auto-format.sh` (làm lời tài liệu thành sự thật)                                 |
| Hook `post-edit-typecheck`                                         | `pre-commit-gate.sh` lúc commit                                                           | Không — typecheck DHCB gồm 4 project, chạy mỗi lần sửa quá chậm                            |
| Hook `block-no-verify`                                             | Cho phép `--no-verify` có chủ đích                                                        | Không — mâu thuẫn luật                                                                     |
| Hook GateGuard (bắt trình dữ kiện trước lần sửa đầu tiên mỗi file) | `npm run codemap -- impact` + CLAUDE.md mục 7                                             | Không — chặn MỌI file đầu tiên gây ma sát lớn (xem đợt 2)                                  |
| Hook nhắc tmux / chặn dev server                                   | —                                                                                         | Không — phiên cloud                                                                        |
| Bộ nhớ phiên, `save/resume-session`, Memory Vault, `pre-compact`   | `PROGRESS.md` + changelog + `report-status.sh` (SessionStart)                             | Không — container thu hồi; trùng nguồn sự thật                                             |
| Học liên tục v2 (hook quan sát mọi lệnh → "instinct")              | `TRAPS.md` (sổ bẫy có người duyệt)                                                        | **Chuyển thể** thành lệnh `/learn` ghi vào `TRAPS.md`, có người duyệt                      |
| AgentShield / `/security-scan`                                     | `scripts/no-control-chars.test.ts` (chỉ byte C0)                                          | **Chuyển thể** thành `scripts/agent-config-security.test.ts` chạy trong CI                 |
| Security Guide: hạn chế đọc đường dẫn bí mật                       | Không có                                                                                  | **THÊM** `permissions.ask` cho `.env`, `.env.*` (trừ `.env.example`), `~/.ssh`, `~/.aws`   |
| `rules/` (common + typescript…)                                    | CLAUDE.md mục 4, `.agents/rules/`                                                         | Không — luôn nạp → tốn ngữ cảnh mỗi phiên                                                  |
| 293 skill miền                                                     | 10 skill trong `.agents/skills/`                                                          | Không chép hàng loạt                                                                       |
| `context-budget`                                                   | Không có                                                                                  | Đợt 2                                                                                      |
| `santa-method`                                                     | `qa-verifier` (vai QA độc lập)                                                            | Đợt 2                                                                                      |
| Cost tracker, desktop notify                                       | `usage-guard.sh`                                                                          | Không                                                                                      |

## 5. Phát hiện phụ trong lúc đối chiếu

1. **Hook ma:** `.claude/hooks/pre-commit-gate.sh` viết "Format không tự chạy ở đây vì
   `auto-format.sh` (PostToolUse) đã format ngay sau mỗi Edit/Write" — nhưng file đó và mọi cấu
   hình PostToolUse đều không có. Format chỉ được lint-staged làm lúc commit; commit kèm
   `--no-verify` thì lọt tới CI. Đã sửa bằng cách tạo đúng hook đó.
2. **`.agents/skills/` không được Claude Code nạp.** Tài liệu chính thức: skill phải nằm ở
   `.claude/skills/<tên>/SKILL.md`. CLAUDE.md mục 2.1 mô tả "hệ thống 10 siêu kỹ năng" như đang
   chạy — thực tế phiên Claude không thấy chúng trong danh sách skill. Đã ghi chú vào mục 2.1.
3. **Skill lỗi thời:** `life-career-strategic-advisor` vẫn mô tả 5 miền Career/Life… trong khi ba
   trụ Career · Startup · Life đã xoá hẳn 2026-09-20 (ADR-0010). Nếu bật lên `.claude/skills/` mà
   không rà, Claude sẽ tự gọi một skill hướng dẫn sai.
4. **`.agents/mcp_config.json`** chứa đường dẫn máy cá nhân (`C:/Users/<tên>/.gemini/…`) — không
   phải bí mật, nhưng là thông tin máy riêng nằm trong repo.
5. Luật quyền dạng `Bash(curl * | bash)` mà nhiều hướng dẫn (kể cả Security Guide của ECC) gợi ý
   **không bao giờ khớp** ở Claude Code hiện tại: lệnh được tách theo `|` và mỗi phần được so
   riêng (tài liệu permissions, mục "Compound commands"). Vì vậy DHCB không thêm luật đó.

6. **`permissionDecision: "ask"` của hook không hiện hộp hỏi ở phiên cloud auto mode** (mở từ
   iOS, Claude Code 2.1.286) — đo thật trong chính đợt này: transcript ghi hook trả `ask` hai lần,
   Edit vẫn chạy thẳng, dù tài liệu auto mode nói prompt do hook buộc ra vẫn hiện. Vì vậy
   `config-protection.sh` dùng hai nấc (lần đầu `deny` kèm lý do, sau đó `ask`) — nấc `deny` đã
   chặn thật hai lần trong đợt. Bài học chung: **hàng rào phải được thử ở đúng môi trường dùng
   thật**, tài liệu không thay được phép đo.
7. **Escape `\u200B` gõ qua công cụ ghi file của tác tử bị giải mã thành ký tự vô hình thật**
   (tái hiện hai lần); và `grep -P` với mã điểm `\x{…}` mà thiếu locale UTF-8 thì lỗi, gộp với
   `2>/dev/null` thành xanh giả. Đã thêm quét ký tự định dạng vô hình toàn repo vào
   `scripts/no-control-chars.test.ts` — lượt quét đầu bắt được một zero-width space lạc thật.

## 6. Đề xuất đợt 2

1. **Rà và chuyển `.agents/skills/` sang `.claude/skills/`** (hoặc xoá bản lỗi thời): làm bộ 10
   skill thật sự hoạt động, theo cổng chất lượng kiểu `skill-stocktake` của ECC.
2. **Giảm CLAUDE.md** (~44 nghìn ký tự, ~52 KB mỗi phiên): tách lịch sử/giải thích dài sang `docs/`, chỉ
   giữ luật. Theo nguyên tắc "rules luôn nạp nên phải ít" của ECC.
3. **Luật ESLint `no-console`** cho `apps/dhcb/src` + `apps/hub/src` (hiện còn đúng 1
   `console.log`) — thay cho hook cảnh báo `console.log` của ECC; phải là PR riêng vì đổi luật lint
   (luật ghi ở đầu `eslint.config.js`).
4. ✅ (changelog 0469) **Kiểm pipe-to-shell bằng hook** (`curl … | sh`) — vì luật quyền không
   khớp được (mục 5.5). Đã làm: `.claude/hooks/block-pipe-to-shell.sh`.
5. ✅ (changelog 0469) **Bản "nhắc mềm" của GateGuard**: lần đầu sửa một file được ≥ 20 nơi
   import (đếm từ `.codemap/graph.json`) thì nhắc chạy `codemap impact`, không chặn. Đã làm:
   `.claude/hooks/shared-file-reminder.sh`.
6. **`santa-method` cho nội dung học** (bài học, từ điển): hai người rà độc lập cùng thang 5 tiêu
   chuẩn của changelog 0406 trước khi phát hành.

## 7. Nguồn

- ECC: <https://github.com/affaan-m/ECC> (đọc bản `2.2.2`, commit `c70874f`); AgentShield:
  <https://github.com/affaan-m/agentshield>.
- DataCamp, "Everything Claude Code (ECC): Open-Source Framework Guide":
  <https://www.datacamp.com/tutorial/everything-claude-code>.
- Thảo luận phát hành v1.10.0 (140K sao): <https://github.com/affaan-m/ECC/discussions/1272>.
- Pasquale Pillitteri, "Everything Claude Code (ECC): 214K Stars":
  <https://pasqualepillitteri.it/en/news/4878/everything-claude-code-ecc-agent-harness-os>.
- 36Kr, hackathon và giải thưởng: <https://eu.36kr.com/en/p/3823966768943239>.
- Claude Code docs — Hooks <https://code.claude.com/docs/en/hooks>, Skills
  <https://code.claude.com/docs/en/skills>, Permissions <https://code.claude.com/docs/en/permissions>.
- Check Point Research, CVE-2025-59536 / CVE-2026-21852:
  <https://research.checkpoint.com/2026/rce-and-api-token-exfiltration-through-claude-code-project-files-cve-2025-59536/>.
- Snyk, ToxicSkills: <https://snyk.io/blog/toxicskills-malicious-ai-agent-skills-clawhub/>.
