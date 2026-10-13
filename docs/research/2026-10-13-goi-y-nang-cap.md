# Gợi ý nâng cấp — rà soát 2026-10-13

> Lấy từ đợt rà soát chéo 19 repo của chủ sở hữu (ma trận vệ sinh ở [seeker19110/stored, mục 23 §8.1](https://github.com/seeker19110/stored/blob/main/23-own-repos-lessons/README.md); gợi ý tích hợp ở §7b của cùng file). Số liệu đo bằng lệnh trên HEAD (đếm `uses:` ghim SHA 40 ký tự, khối `permissions:`, `dependabot.yml`, `.claude/settings.json`), không suy ra từ văn xuôi. Đây là **đề xuất**, chưa sửa code. Mỗi mục kèm bằng chứng để kiểm lại trước khi làm; mục nào đã xử lý thì đánh dấu hoặc xoá.

## Hiện trạng đo được

| HEAD đọc | Action ghim SHA | Workflow thiếu `permissions:` cấp đầu | Dependabot | LICENSE · SECURITY | File test |
|---|---|---|---|---|---|
| `f2a09a3` (2026-10-13) | 5/21 | – | npm, github-actions | không · có | 1056 |

## Đề xuất (🔴 cao · 🟠 trung bình · 🟢 nhẹ)

| # | Mức | Đề xuất | Bằng chứng | Kiểm xong khi |
|---|---|---|---|---|
| 1 | 🟠 | Bỏ `"model": "opusplan"` khỏi `.claude/settings.json` theo ADR-0007 của khung (chọn model theo độ phức tạp) | `.claude/settings.json:3` ghi `"model": "opusplan"`; lỗi này đã được ghi từ đợt rà ngày 12/10 và vẫn còn | `grep -c opusplan .claude/settings.json` → 0 |
| 2 | 🟠 | Thêm danh sách `permissions.deny` (lấy từ khung: `rm -rf`, `git push --force`, đọc `.env*`, tải script rồi pipe thẳng vào shell…) để bổ sung cho hook `config-protection` / `block-pipe-to-shell` | `permissions.deny` đang rỗng (0 mục), `allow` có 4 mục; projects-template có 54 mục deny, xboss 26 | Có `deny` và hook test vẫn xanh |
| 3 | 🟠 | Ghim **16** action còn lại theo SHA | Mới ghim 5/21 `uses:` | `grep -hE "uses:" .github/workflows/*.yml | grep -vcE "@[0-9a-f]{40}"` → 0 |
| 4 | 🟢 | Thêm `auto-complete-guard.sh` vào hook Stop (ba cổng máy của khung, #287) | Stop hiện chỉ gọi `usage-guard.sh` | Có trong `settings.json` và test hook của khung chạy được |
| 5 | 🟢 | Rút gọn `CLAUDE.md` (336 dòng): chuyển phần tham chiếu sang `docs/` và chỉ giữ luật cốt lõi | `wc -l CLAUDE.md` → 336; khung là 143 dòng, xboss 279 dòng. File dài thì mỗi phiên tốn context và luật dễ bị bỏ sót | CLAUDE.md dưới khoảng 200 dòng và không mất luật nào |
| 6 | 🟢 | Thống nhất TypeScript với các repo anh em (`^5.2.2` → 6.x) khi có đợt nâng phụ thuộc | `package.json` ghi `typescript ^5.2.2`; xboss và Xgold đã dùng 6.0.3 | `npm run typecheck` xanh |

## Giữ nguyên (điểm mạnh)

- ProposedAction + safetyGuard, open-code-review `rule.json`, memory không dùng pgvector.
- Dependabot npm + github-actions, CodeQL, secret-scan.

## Gợi ý tích hợp từ catalog `stored`

- Guardrails input/output (NeMo Guardrails / LLM Guard) và lọc prompt-injection cho gia sư AI có người dùng thật (stored mục 12 §2).
- Codebase graph để onboard tính năng nhanh hơn (stored mục 16 §2d).

## Ghi chú chung

- Ghim action theo SHA bằng [pinact](https://github.com/suzuki-shunsuke/pinact) hoặc [ratchet](https://github.com/sethvargo/ratchet), giữ comment tag (`# v7.0.1`), rồi để Dependabot `github-actions` tự nâng SHA. Đây là cách projects-template, xboss và Sales-Hunter đang làm.
- Chuẩn tham chiếu là `seeker19110/projects-template`: 25/25 action ghim SHA, mọi workflow có `permissions:` cấp đầu, Dependabot cho npm, github-actions và pip.
