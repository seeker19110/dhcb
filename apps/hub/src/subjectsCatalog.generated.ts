// subjectsCatalog.generated.ts — SINH TỰ ĐỘNG bởi scripts/gen-subject-catalog.ts — KHÔNG sửa tay.
// Chạy lại khi đổi packages/core-learner/subjectEntry.ts:  npm run gen:subject-catalog
// (scripts/gen-subject-catalog.test.ts canh cho file này không lệch nguồn.)
//
// Dữ liệu THUẦN — id/nhãn/thứ tự/đường dẫn/trạng thái. Hub KHÔNG import gói `@dhcb/*`
// (apps/hub/vite.config.ts) nên kiểu được khai lại tại chỗ thay vì import từ gói.
export type SubjectEntryStatus = 'live' | 'preview' | 'building'

export interface SubjectCatalogEntry {
  id: string
  label: string
  order: number
  ctaPath: string
  status: SubjectEntryStatus
}

/** Nguồn: packages/core-learner/subjectEntry.ts (SUBJECT_ENTRIES). */
export const SUBJECT_CATALOG: readonly SubjectCatalogEntry[] = [
  {
    id: 'english',
    label: 'Tiếng Anh',
    order: 0,
    ctaPath: '/goc-hoc-tap/english',
    status: 'live',
  },
  {
    id: 'mathematics',
    label: 'Toán học',
    order: 1,
    ctaPath: '/goc-hoc-tap/mathematics',
    status: 'preview',
  },
  {
    id: 'physics',
    label: 'Vật lí',
    order: 2,
    ctaPath: '/goc-hoc-tap/physics',
    status: 'preview',
  },
  {
    id: 'chemistry',
    label: 'Hóa học',
    order: 3,
    ctaPath: '/goc-hoc-tap/chemistry',
    status: 'preview',
  },
  {
    id: 'biology',
    label: 'Sinh học',
    order: 4,
    ctaPath: '/goc-hoc-tap/biology',
    status: 'preview',
  },
  {
    id: 'programming',
    label: 'Lập trình',
    order: 5,
    ctaPath: '/goc-hoc-tap/programming',
    status: 'live',
  },
]
