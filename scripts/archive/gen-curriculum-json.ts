// scripts/gen-curriculum-json.ts
// Sinh public/data/curriculum.json từ NGUỒN src/data/curriculum.ts (FOUNDATION),
// đồng thời LÀM GIÀU phiên âm tiếng Anh (ipa_en) LẤY TỪ TỪ ĐIỂN
// (public/data/dictionary/chunk-*.json) cho từng từ vựng có trong từ điển.
//
// Nhờ đó các trang dùng từ vựng (Học theo lộ trình, Lộ trình CEFR) hiển thị phiên âm
// THỐNG NHẤT với trang Từ điển — "lấy trong từ điển" thay vì nhập tay rời rạc.
//
// Lưu ý: KHÔNG sao chép ipa_vi vì nghĩa tiếng Việt trong vòng chủ đề có thể khác
// nghĩa trong từ điển (giữ ngữ cảnh) → phiên âm tiếng Việt sẽ không khớp.
//
// Chạy: npx tsx scripts/gen-curriculum-json.ts   (an toàn để chạy lại — ghi đè)

import * as fs from 'node:fs'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'
import { FOUNDATION } from '../../apps/dhcb/src/data/curriculum.ts'
import type { DictEntry } from '../../apps/dhcb/src/types.ts'
import { buildCurriculumIndex } from '../../apps/dhcb/src/data/curriculumIndex.ts'

// Script nằm ở scripts/archive/ nên gốc repo lùi HAI cấp (sửa 2026-09-14).
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const DICT_DIR = path.join(ROOT, 'apps/dhcb/public/data/dictionary')
const OUT = path.join(ROOT, 'apps/dhcb/public/data/curriculum.json')

// Nạp toàn bộ từ điển → map theo từ (không phân biệt hoa/thường)
let dict: DictEntry[] = []
for (let i = 0; i < 10; i++) {
  const f = path.join(DICT_DIR, `chunk-${String(i).padStart(3, '0')}.json`)
  dict = dict.concat(JSON.parse(fs.readFileSync(f, 'utf8')))
}
const dmap = new Map(dict.map((e) => [e.word.trim().toLowerCase(), e]))

let enriched = 0
const out = FOUNDATION.map((circle) => ({
  ...circle,
  words: circle.words.map((w) => {
    const d = dmap.get(w.word.trim().toLowerCase())
    // Chỉ thêm ipa_en nếu từ có trong từ điển và mục từ vựng chưa tự có ipa_en.
    if (d?.ipa_en && !w.ipa_en) {
      enriched++
      return { ...w, ipa_en: d.ipa_en }
    }
    return w
  }),
}))

fs.writeFileSync(OUT, JSON.stringify(out))
// Bản tóm tắt cho các trang chỉ đếm tiến độ (changelog 0601) — sinh CÙNG LÚC để không lệch.
fs.writeFileSync(
  path.join(path.dirname(OUT), 'curriculum-index.json'),
  JSON.stringify(buildCurriculumIndex(out)),
)
const totalWords = out.reduce((s, c) => s + c.words.length, 0)
console.log(
  `✅ Sinh curriculum.json: ${out.length} vòng, ${totalWords} từ, ${enriched} từ được gắn ipa_en từ từ điển`,
)
