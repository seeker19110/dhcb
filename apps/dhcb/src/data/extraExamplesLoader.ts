// Loader cho ví dụ bổ sung — tải từ /public/data/extra-examples.json bằng fetch().
// Kiểm HTTP + không cache lỗi: xem `examplesLoaderFactory.ts` (changelog 0530).

export type { ExPair } from './extra-examples'
import { createExamplesLoader } from './examplesLoaderFactory'

export const loadExtraExamples = createExamplesLoader('/data/extra-examples.json')
