// ════════════════════════════════════════════════════════════════════
//  gen-stories-json.mjs — Sinh dữ liệu "Truyện cổ tích / Ngụ ngôn song ngữ"
//  cho trang /listening.
//
//  Đọc mọi file apps/dhcb/src/data/stories/raw/*.json (nguồn — do người dịch soạn),
//  validate theo ràng buộc mục 5.3 của đặc tả, rồi ghi ra:
//    - public/data/stories/<id>.json  (nội dung đầy đủ, kèm lineCount tự tính)
//    - public/data/stories/index.json (mảng StoryMeta, KHÔNG kèm lines/source/moral*)
//
//  Chạy lại khi thêm/sửa truyện:  node scripts/gen-stories-json.mjs
// ════════════════════════════════════════════════════════════════════

import { mkdirSync, writeFileSync, readdirSync, readFileSync, rmSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, join, basename } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const RAW_DIR = join(__dirname, '..', 'apps', 'dhcb', 'src', 'data', 'stories', 'raw')
const OUT_DIR = join(__dirname, '..', 'apps', 'dhcb', 'public', 'data', 'stories')

// Phải khớp STORY_KINDS ở apps/dhcb/src/data/stories/index.ts (file .mjs không import type được).
const VALID_KINDS = ['fairy-tale', 'fable', 'vn-folk', 'myth', 'humor', 'children']
const VALID_LEVELS = ['A2', 'B1', 'B2']

// Thứ tự độ khó để sắp truyện từ DỄ đến KHÓ. Liệt kê đủ 6 bậc CEFR A1→C2 cho về sau,
// dù dữ liệu hiện tại chỉ dùng 3 bậc giữa (A2/B1/B2 — xem VALID_LEVELS): nếu sau này mở
// thêm bậc thì chỉ cần nới VALID_LEVELS, không phải sửa lại chỗ sắp xếp này.
const LEVEL_ORDER = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

// Kiểm 1 truyện theo ràng buộc mục 5.3 đặc tả. Ném lỗi rõ ràng nếu vi phạm.
function validateStory(story, filename) {
  const prefix = `[gen-stories-json] ${filename}:`

  if (!VALID_KINDS.includes(story.kind)) {
    throw new Error(
      `${prefix} kind "${story.kind}" không hợp lệ (phải là một trong: ${VALID_KINDS.join(', ')})`,
    )
  }
  if (!VALID_LEVELS.includes(story.level)) {
    throw new Error(`${prefix} level "${story.level}" không hợp lệ (phải là 'A2' | 'B1' | 'B2')`)
  }

  const idFromFile = basename(filename, '.json')
  if (story.id !== idFromFile) {
    throw new Error(`${prefix} id "${story.id}" không khớp tên file (kỳ vọng "${idFromFile}")`)
  }

  if (!Array.isArray(story.lines) || story.lines.length === 0) {
    throw new Error(`${prefix} lines rỗng hoặc không phải mảng`)
  }

  let expectedP = 0
  for (const [i, line] of story.lines.entries()) {
    if (typeof line.en !== 'string' || line.en.trim() === '') {
      throw new Error(`${prefix} lines[${i}].en rỗng`)
    }
    if (typeof line.vi !== 'string' || line.vi.trim() === '') {
      throw new Error(`${prefix} lines[${i}].vi rỗng`)
    }
    if (typeof line.p !== 'number') {
      throw new Error(`${prefix} lines[${i}].p không phải số`)
    }
    if (line.p === expectedP + 1) {
      expectedP = line.p
    } else if (line.p !== expectedP) {
      throw new Error(
        `${prefix} lines[${i}].p = ${line.p} không hợp lệ — phải bắt đầu từ 0, tăng dần, không nhảy cóc (đang mong đợi ${expectedP} hoặc ${expectedP + 1})`,
      )
    }
  }

  // Bài học rút ra là TÙY CHỌN (bản public domain của một số truyện vốn không kèm câu bài học,
  // ta lấy nguyên văn nên không tự bịa thêm) — nhưng đã có một bên thì phải có cả hai.
  const hasMoralEn = typeof story.moralEn === 'string' && story.moralEn.trim() !== ''
  const hasMoralVi = typeof story.moralVi === 'string' && story.moralVi.trim() !== ''
  if (hasMoralEn !== hasMoralVi) {
    throw new Error(`${prefix} moralEn và moralVi phải đi cùng nhau (đang thiếu một bên)`)
  }
}

// Tách hàm sinh StoryMeta từ nội dung đầy đủ — để test đơn vị được tái dùng.
export function toStoryMeta(story) {
  return {
    id: story.id,
    kind: story.kind,
    titleEn: story.titleEn,
    titleVi: story.titleVi,
    countryVi: story.countryVi,
    countryEn: story.countryEn,
    flag: story.flag,
    level: story.level,
    lineCount: story.lines.length,
  }
}

function main() {
  let files
  try {
    files = readdirSync(RAW_DIR).filter((f) => f.endsWith('.json'))
  } catch (err) {
    console.error(`[gen-stories-json] Không đọc được thư mục raw/: ${RAW_DIR}`, err)
    process.exit(1)
  }

  if (files.length === 0) {
    console.error(`[gen-stories-json] Không tìm thấy file .json nào trong ${RAW_DIR}`)
    process.exit(1)
  }

  const stories = []
  for (const filename of files) {
    const full = join(RAW_DIR, filename)
    let story
    try {
      story = JSON.parse(readFileSync(full, 'utf-8'))
    } catch (err) {
      console.error(`[gen-stories-json] Lỗi parse JSON: ${filename}`, err)
      process.exit(1)
    }
    try {
      validateStory(story, filename)
    } catch (err) {
      console.error(err.message)
      process.exit(1)
    }
    stories.push(story)
  }

  // Sắp xếp theo ĐỘ KHÓ trước (dễ → khó), rồi mới tới thể loại, cuối cùng là id.
  // Đặt độ khó làm khoá CHÍNH (chứ không phải thể loại) để người học lướt danh sách là gặp
  // truyện dễ trước. Vì trang /stories lọc theo thể loại bằng chip mà không sắp xếp lại,
  // thứ tự tương đối được giữ nguyên — nên lọc riêng một thể loại thì bên trong vẫn là dễ → khó.
  stories.sort((a, b) => {
    const byLevel = LEVEL_ORDER.indexOf(a.level) - LEVEL_ORDER.indexOf(b.level)
    if (byLevel !== 0) return byLevel
    const byKind = VALID_KINDS.indexOf(a.kind) - VALID_KINDS.indexOf(b.kind)
    return byKind !== 0 ? byKind : a.id.localeCompare(b.id)
  })

  rmSync(OUT_DIR, { recursive: true, force: true })
  mkdirSync(OUT_DIR, { recursive: true })

  const index = []
  for (const story of stories) {
    const fullStory = { ...story, lineCount: story.lines.length }
    writeFileSync(join(OUT_DIR, `${story.id}.json`), JSON.stringify(fullStory))
    index.push(toStoryMeta(story))
  }

  writeFileSync(join(OUT_DIR, 'index.json'), JSON.stringify(index))

  console.log(`[gen-stories-json] Đã sinh ${stories.length} truyện → ${OUT_DIR}`)
}

// Chỉ chạy main() khi file được thực thi trực tiếp (node scripts/gen-stories-json.mjs),
// KHÔNG chạy khi bị import (vd. stories.test.ts import toStoryMeta để test).
// pathToFileURL: trên Windows, `file://${process.argv[1]}` cho ra "file://C:\..." nên KHÔNG BAO GIỜ
// khớp với import.meta.url ("file:///C:/..."), khiến script chạy im lặng mà không sinh gì.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main()
}
