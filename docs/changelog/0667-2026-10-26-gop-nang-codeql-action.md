# 0667 — 2026-10-26 — Gộp nâng codeql-action 4.39.1 và nhóm Dependabot cho CodeQL

PR (điền khi mở). Quét lại sau #1445: Dependabot mở bốn PR mới. #1442 (`@google/genai` 2.31.0) và #1443
(`@anthropic-ai/sdk` 0.137.0 — bản 0.x mới nhất, vẫn API version `2023-06-01`) xanh đủ 18 check ⇒ đã merge.

## Đã làm

- #1441 (`codeql-action/analyze`) và #1444 (`codeql-action/init`) đỏ ở hai job `Analyze` vì mỗi PR chỉ nâng
  một nửa: CodeQL báo _"Loaded a configuration file for version '4.38.3', but running version '4.39.1'"_.
  Gộp cả hai bản nâng lên 4.39.1 trong PR này (`.github/workflows/codeql.yml`, vẫn ghim SHA).
- `.github/dependabot.yml`: nhóm `codeql-action` (`github/codeql-action*`) để lần sau hai bước luôn nâng cùng
  một PR.

## Kiểm chứng

- `vitest run scripts/ci-workflow-policy.test.ts scripts/agent-config-security.test.ts scripts/changelog.test.ts`
  (kết quả ghi ở mô tả PR); YAML parse cả hai file; job CodeQL trên PR là phép thử thật.
- Đường lùi: revert PR (về 4.38.3 + bỏ nhóm).
