// gen-curriculum-index — sinh `apps/dhcb/public/data/curriculum-index.json` (bản TÓM TẮT các vòng
// từ vựng: tên vòng + danh sách từ) từ `curriculum.json` đầy đủ. Khuôn ở
// `apps/dhcb/src/data/curriculumIndex.ts`; lý do và số đo ở changelog 0601.
//
// Chạy lại SAU MỖI LẦN `curriculum.json` đổi (vd sau `scripts/archive/gen-curriculum-json.ts`):
//   npm run gen:curriculum-index
// Quên thì `apps/dhcb/src/data/curriculumIndex.test.ts` đỏ.
import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildCurriculumIndex } from '../apps/dhcb/src/data/curriculumIndex'
import type { Circle } from '../apps/dhcb/src/data/curriculumTypes'

const dataDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../apps/dhcb/public/data',
)
const full = JSON.parse(readFileSync(path.join(dataDir, 'curriculum.json'), 'utf8')) as Circle[]
const index = buildCurriculumIndex(full)
writeFileSync(path.join(dataDir, 'curriculum-index.json'), JSON.stringify(index))
console.log(
  `✅ curriculum-index.json: ${index.length} vòng, ${index.reduce((s, c) => s + c.words.length, 0)} từ`,
)
