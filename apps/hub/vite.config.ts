import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// apps/hub — trang giới thiệu tổng thể nền tảng "Đồng Hành Cùng Bạn" (PR-7,
// docs/research/dac-ta-gd1-tach-loi-monorepo-2026-07-31.md §7). Vite app ĐỘC LẬP với
// apps/dhcb (không dùng chung vite.config.ts gốc) — tránh đụng cấu hình build phức
// tạp (dev middleware gọi API, code-splitting) của app tiếng Anh đang chạy thật.
//
// Dev: /api/* proxy sang server.ts (Express) đang chạy ở cổng 3001 — hub chỉ gọi 2 API
// công khai, không cần auth: /api/plan-prices (bảng giá) và /api/hub-stats (số liệu tổng).
export default defineConfig({
  // Đọc .env ở gốc repo (nơi VPS lưu .env thật), không phải apps/hub/.env — mặc định của
  // Vite là cùng thư mục vite.config.ts, sai vì npm workspaces chạy build với cwd=apps/hub.
  envDir: path.resolve(__dirname, '../..'),
  plugins: [react()],
  resolve: {
    alias: {
      '@core': path.resolve(__dirname, '../../packages/core-ui'),
    },
  },
  server: {
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
})
