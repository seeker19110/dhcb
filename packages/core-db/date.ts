// date.ts — Ngày theo giờ Việt Nam cho server. Nguồn duy nhất ở
// packages/core-contracts/vnDate.ts (dùng chung với client — đợt E4 audit 2026-10-10, trước đó
// là bản chép tay "PHẢI khớp src/lib/date.ts"). File này giữ đường import cũ cho ~20 nơi ở server.
export { vnDateStr, addDays, weekStartOf } from '@dhcb/core-contracts/vnDate'
