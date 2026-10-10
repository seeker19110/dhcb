// packages/core-contracts/subjectManifestVersion.ts — Phiên bản schema của SubjectManifest, tách
// riêng KHÔNG import zod: subjectRegistry (nằm trên trang chủ của khách) chỉ cần con số này, mà
// import nó từ subjectManifest.ts thì kéo theo cả zod (~37 KB) vì file đó dựng schema ngay khi nạp.
export const SUBJECT_MANIFEST_SCHEMA_VERSION = 1
