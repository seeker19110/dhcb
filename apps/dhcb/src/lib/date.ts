// date.ts — Ngày theo giờ Việt Nam + tiện ích chuỗi ngày. Nguồn duy nhất ở
// packages/core-contracts/vnDate.ts (dùng chung với server — đợt E4 audit 2026-10-10); file này
// giữ đường import cũ cho phía client.
export {
  vnDateStr,
  vnDayOfWeek,
  MS_DAY,
  dateStrToMs,
  daysBetween,
  addDays,
  weekStartOf,
} from '@dhcb/core-contracts/vnDate'
