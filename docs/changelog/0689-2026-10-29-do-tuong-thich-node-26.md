# 0689 — 2026-10-29 — Đo tương thích Node 26: repo chạy xanh, chỉ còn chờ VPS

Đợt 5 của "làm tiếp tất cả nợ". Nợ "Node 22 → 26 LTS" (mục React 19 + Tailwind 4 trong PROGRESS): Node 26
thành LTS ngày 2026-10-28 (v26.13.0, nhãn "Lithium"), ràng buộc "chờ sau 2026-10-28" đã hết.

## Đo (2026-10-29, Node v26.13.0 tải bằng `npx node@26`, cùng `node_modules` cài bằng `npm ci`)

| Cổng                                                | Kết quả                                                                       |
| --------------------------------------------------- | ----------------------------------------------------------------------------- |
| `npm run typecheck`                                 | ✅ exit 0                                                                     |
| `npm run build` (gồm `build:packages`, server, hub) | ✅ exit 0                                                                     |
| `vitest run` toàn bộ                                | 22.624 đạt, 6 trượt — cả 6 ở `scripts/retrieval-benchmark-worker.env.test.ts` |

Sáu ca trượt KHÔNG phải lỗi tương thích: test đó cố ý khẳng định `process.versions.node` major **là 22**
(test hành vi `process.env` trong tiến trình con của bộ benchmark retrieval S05, phải chạy đúng bản Node của CI).

## Đã làm

- `scripts/retrieval-benchmark-worker.env.test.ts`: bản Node kỳ vọng đọc từ `.nvmrc` (một nguồn duy nhất, khớp
  CI) thay vì ghi cứng `22`. Kiểm hai chiều:
  - Node 22 + `.nvmrc` = 22 → 6/6 đạt (như cũ).
  - Node 26 + `.nvmrc` tạm đặt 26 → **6/6 đạt**: hành vi `process.env` mà bộ chặn `UNSCRUBBED_ENV` dựa vào
    không đổi trên Node 26. Vậy toàn bộ repo đã xanh trên Node 26.
- `CLAUDE.md` §6, `docs/claude-md-chi-tiet.md` §6, PROGRESS: Node 26 không còn "chờ ngày", chỉ chờ nâng VPS.

## Quyết định

KHÔNG đổi CI sang Node 26 trong đợt này: production vẫn chạy Node 22, CI phải kiểm đúng bản đang phục vụ người
dùng. Cũng không thêm job CI Node 26 song song — repo đã đo xanh, job thêm chỉ tốn phút CI cho tới ngày nâng.

## Việc tay để nâng hẳn (thứ tự)

1. VPS: cài Node 26 (`nvm install 26` hoặc NodeSource `setup_26.x`), `npm ci`, `pm2 reload all --update-env`,
   kiểm `/api/health`.
2. Cùng một PR: `.nvmrc` → `26`; 6 chỗ `node-version: 22` trong `.github/workflows/ci.yml`; `engines.node` trong
   `package.json`; `docs/deploy-vps-ubuntu.md` (dòng `setup_22.x`, `nvm install 22`).
