// eslint.config.js — flat config (ESLint 9+). Thay cho .eslintrc.cjs, chuyển 2026-09-22.
//
// LUẬT KHI SỬA FILE NÀY: đây là bản chuyển NGUYÊN TRẠNG tập rule của .eslintrc.cjs cũ — không
// thêm/bớt luật nào trong đợt chuyển. Muốn đổi luật thì làm ở PR riêng để diff nói rõ "đổi luật",
// chứ không lẫn vào diff "đổi định dạng cấu hình".
//
// Cách kiểm chứng tương đương: `npx eslint --print-config <file>` trước/sau phải ra cùng tập rule.

import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import prettier from 'eslint-config-prettier'

export default tseslint.config(
  {
    // Tương đương ignorePatterns cũ. Flat config cần khuôn '**/<tên>/**' mới khớp thư mục ở mọi
    // cấp — viết trần 'dist' chỉ khớp ĐÚNG một file tên dist.
    ignores: [
      '**/dist/**',
      '**/dist-server/**',
      '**/node_modules/**',
      // Checkout Git độc lập do agent tạo; mỗi worktree chạy lint từ gốc riêng.
      '.claude/worktrees/**',
      // scripts/archive = script sinh dữ liệu DÙNG MỘT LẦN đã đóng băng, giữ làm lịch sử chứ
      // không chạy nữa — không sửa để chiều lint.
      'scripts/archive/**',
      // Đầu ra của công cụ, không phải mã nguồn của dự án.
      'coverage/**',
      'playwright-report/**',
      'test-results/**',
    ],
  },

  // 'eslint:recommended'
  js.configs.recommended,

  // 'plugin:@typescript-eslint/recommended' (kèm parser @typescript-eslint/parser)
  ...tseslint.configs.recommended,

  // Gác accessibility TĨNH cho JSX (CLAUDE.md §4.5). Trước 2026-09-05 tài liệu nói "kèm lint
  // jsx-a11y" nhưng gói chưa từng được cài — lớp gác này thực tế trống, chỉ còn axe E2E chạy sau
  // và chậm. Audit toàn diện 2026-09-05 (F1) phát hiện, nay bật thật.
  jsxA11y.flatConfigs.recommended,

  // 'plugin:react-hooks/recommended'. Dùng đúng configs.flat.recommended (16 rule) — KHÔNG dùng
  // 'recommended-latest' (17 rule) vì bản đó bật thêm luật, tức đổi hành vi cổng lint.
  reactHooks.configs.flat.recommended,

  {
    // env: { browser, es2020, node } của cấu hình cũ.
    languageOptions: {
      globals: { ...globals.browser, ...globals.node, ...globals.es2020 },
    },
    plugins: { 'react-refresh': reactRefresh },
    rules: {
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },

  {
    // File .cjs là CommonJS THẬT (PM2 đọc ecosystem.config.cjs, commitlint đọc
    // commitlint.config.cjs bằng require). Trước 2026-09-26 cả hai nằm trong `ignores` vì cấu hình
    // cũ chạy `--ext ts,tsx,js,mjs` nên CHƯA BAO GIỜ được lint (nợ ghi ở đợt chuyển flat config,
    // changelog 0414). Nay lint thật, khai đúng sourceType để parser không coi chúng là ES module,
    // và cho phép `require` vì đó là cách import chuẩn của CommonJS.
    files: ['**/*.cjs'],
    languageOptions: { sourceType: 'commonjs' },
    rules: { '@typescript-eslint/no-require-imports': 'off' },
  },

  {
    // [2026-10-02, changelog 0470, đề xuất 3 của ADR-0013] CLAUDE.md mục 8 bắt "xoá console.log
    // debug" nhưng trước đây chỉ là luật bằng chữ. Chặn bằng lint cho mã CHẠY TRONG TRÌNH DUYỆT
    // người dùng (log debug lọt vào bundle = lộ dữ liệu ra DevTools + rác). Cho phép warn/error:
    // đó là kênh báo lỗi có chủ đích (và Sentry bắt được). Server/packages/scripts KHÔNG áp: log
    // ở đó đi vào PM2/stdout là có chủ đích; test được miễn.
    files: ['apps/dhcb/src/**/*.{ts,tsx}', 'apps/hub/src/**/*.{ts,tsx}'],
    ignores: ['**/*.test.ts', '**/*.test.tsx'],
    rules: { 'no-console': ['error', { allow: ['warn', 'error'] }] },
  },

  // Phải để SAU các bộ recommended: tắt các luật ESLint xung đột với Prettier (định dạng do
  // Prettier lo, ESLint không cảnh báo format nữa).
  prettier,

  {
    // V2-01 domain-boundary ADR (docs/adr/0003-bien-gioi-domain-v2.md): packages/ là Platform
    // Layer dùng chung cho mọi domain/app tương lai — không được phụ thuộc ngược vào Experience
    // Layer (apps/dhcb, apps/hub). Vi phạm hướng ngược lại (apps/* import packages/*) là bình
    // thường và KHÔNG bị chặn ở đây.
    files: ['packages/**/*.ts', 'packages/**/*.tsx'],
    ignores: ['**/*.test.ts', '**/*.test.tsx'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/apps/*', '**/apps/**'],
              message:
                'packages/ (Platform Layer) không được import từ apps/ (Experience Layer) — xem docs/adr/0003-bien-gioi-domain-v2.md. Nếu 2 phía cần dùng chung kiểu dữ liệu, đưa type đó vào packages/core-contracts/.',
            },
            {
              // [2026-08-23, workspace thật] packages/ cũng không được import ngược api/ —
              // handler HTTP thuộc tầng server. Logic dùng chung phải nằm trong packages/
              // (đợt dời 21 file api/_lib -> core-http/core-auth/core-billing/core-ai/core-chat).
              group: ['**/api/*', '**/api/**'],
              message:
                'packages/ không được import từ api/ — chuyển logic dùng chung vào gói @dhcb/* tương ứng (xem docs/research/dac-ta-cai-to-cau-truc-2026-08-23.md).',
            },
          ],
        },
      ],
    },
  },
)
