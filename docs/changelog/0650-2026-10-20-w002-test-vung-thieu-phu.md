# 0650 — 2026-10-20 — W-002: test cho 8 vùng thiếu phủ D-1…D-8 của audit (lượt, giá, webhook, sổ xoá)

Đóng **D-1 … D-8** (+ nhánh `catch` của `founder.ts`) trong mục D của
`docs/audit/2026-10-20-audit-toan-dien.md`. Chỉ thêm/sửa file test — **không đổi mã sản phẩm**;
mọi test mới đều xanh trên mã hiện tại, tức là khẳng định hành vi đang có để chặn hồi quy về sau.

## Test thêm (7 file, +~330 dòng)

| ID  | File                                                        | Nhánh được phủ                                                                                                                                         |
| --- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| D-1 | `packages/core-auth/actorUsage.test.ts`                     | `refundActorUsage` tài khoản thật: có `day` → hoàn đúng dòng; `day === ''` → truyền `undefined`                                                        |
| D-2 | `packages/core-auth/actorUsage.test.ts`                     | Khách → `refundGuestTrial(guestKey, ip)`, không đụng `daily_usage`; gate tài khoản thật ok/chặn; khách chặn không message → `''`                       |
| D-3 | `packages/core-billing/prices.getPlanPrices.test.ts`        | `pool.query` ném → trả đúng giá mặc định seed 0014/0055, có `warn`, KHÔNG cache lỗi (DB sống lại là đọc được ngay)                                     |
| D-4 | `packages/core-billing/prices.getPlanPrices.test.ts`        | Cache TTL 30 s (fake timers) · `invalidatePricesCache` · lọc dòng `plus`/`pro` · `sale_until` Date → ISO / null · chu kỳ lạ bị bỏ                      |
| D-5 | `apps/server/src/api/billing/payment-webhook.test.ts`       | Body không phải JSON → 200 không log/không DB · payload mảng/chuỗi/null · `id` boolean → `txnId` null · `id` dài → cắt 64                              |
| D-6 | `packages/core-personal/accountErasureLedger.test.ts` (mới) | `rows[0]` không có / cột null → mảng rỗng, đếm 0; count chuỗi `"3"` → 3; cờ chỉ `true` khi đúng boolean; sổ tắt không đọc DB; lỗi DB NÉM               |
| —   | `packages/core-billing/founder.test.ts`                     | `grantFounderIfAvailable`: query ném → `false` + warn (fail-safe không cấp VIP vĩnh viễn); chỉ `true` khi SQL trả đúng boolean                         |
| D-7 | `packages/core-personal/companionTools.test.ts`             | `proposeAction` trả `committed` → `done_by_user_policy`; `unsafe()` chặn cả `propose_learning_goal` và `propose_profile_fact`                          |
| D-8 | `apps/dhcb/src/lib/syncOutbox.test.ts`                      | `setActiveUid` null/khách/uid; sự kiện `storage` (khoá lạ, khoá chủ khác chỉ báo giao diện, khoá chủ đang hoạt động → gửi); `visibilitychange` ẩn/hiện |

## Kiểm chứng

- 7 file test: `vitest run` 140/140 xanh tại máy; eslint 0 cảnh báo; Prettier sạch; `tsc` cho
  `tsconfig.api.json` + `apps/dhcb/tsconfig.json` 0 lỗi. Cổng đầy đủ (coverage ratchet) ở CI.
- Hai giả định sai của chính test lúc viết (đếm số request khi hàng đợi rỗng; debounce dưới fake
  timers trong khi đường gửi `import()` lười) đã sửa về đúng hành vi mã — ghi lại để người sau
  không lặp: debounce đã có ở AC-9, không viết lại.

## Không làm

- Không nâng ngưỡng coverage trong `vitest.config.ts` (đụng cổng — cần người dùng đồng ý riêng,
  CLAUDE.md §8). Số mới sẽ thấy ở CI của PR này.
