// Loader lười cho ví dụ "các dạng của từ" — tải /public/data/form-examples.json bằng fetch().
// Chỉ tải khi WordFormsBlock cần (không nằm trong payload từ điển tải mỗi trang).
// Kiểm HTTP + không cache lỗi: xem `examplesLoaderFactory.ts` (changelog 0530).

export type { ExPair } from './extra-examples'
import { createExamplesLoader } from './examplesLoaderFactory'

export const loadFormExamples = createExamplesLoader('/data/form-examples.json')
