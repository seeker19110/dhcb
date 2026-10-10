// apps/dhcb/src/lib/storageKeyPrefixes.ts — Tiền tố khoá localStorage dùng ở ĐƯỜNG KHỞI ĐỘNG.
//
// Vì sao tách riêng: `learningSession.ts` và `intent/learnerIntentStore.ts` đều import zod bản
// đầy đủ (~24 kB brotli, không tree-shake được). Những chỗ chạy lúc mở trang (`GuestBanner` qua
// `guestActivity.ts`, `AuthProvider` qua `guestProgressKeys.ts`) chỉ cần TÊN khoá — import thẳng hai module kia là kéo cả zod vào bundle
// khởi động. File này KHÔNG được import gì nặng (đo 2026-10-10, xem changelog đợt này).
// Các module gốc re-export lại để mọi chỗ import cũ vẫn chạy.

/** Nháp phiên học — xem `learningSession.ts`. Đăng ký thêm ở `guestProgress.ts`. */
export const LEARNING_SESSION_PREFIX = 'dhcb_lsession_v1_'

/** Ý định học — xem `intent/learnerIntentStore.ts`. PHẢI trùng `ALL_PREFIXES` của `guestProgress.ts`. */
export const INTENT_KEY_PREFIX = 'dhcb_intent_'

/** Bằng chứng hoàn thành bài STEM — xem `stemEvidence.ts`. Cả ba phải có trong `ALL_PREFIXES`. */
export const EVIDENCE_LOG_PREFIX = 'dhcb_evidence_'
export const EVIDENCE_STATE_PREFIX = 'dhcb_evidence_state_'
export const EVIDENCE_PENDING_PREFIX = 'dhcb_evidence_pending_'
