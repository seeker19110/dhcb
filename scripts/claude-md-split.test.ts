// scripts/claude-md-split.test.ts — canh CLAUDE.md sau đợt rút gọn (changelog 0476).
//
// CLAUDE.md được nạp vào MỌI phiên, nên mỗi ký tự thừa tốn ở mọi lượt làm việc. Phần lý do/lịch
// sử đã dời sang docs/claude-md-chi-tiet.md; test này giữ cho cách chia đó không mục dần:
//   1. Mọi dòng trỏ "docs/claude-md-chi-tiet.md §X" phải có mục §X thật (không trỏ vào khoảng không).
//   2. CLAUDE.md không vượt TRẦN_KY_TU. Cần thêm luật mà chạm trần → dời phần lý do/lịch sử của
//      luật cũ sang file chi tiết trước, đừng nâng trần cho vừa.
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { FILE_CHI_TIET, dongBiMat, mucCoThat, mucDuocTro } from './lib/claudeMdSplit.js'

const TRAN_KY_TU = 34_000

const claudeMd = readFileSync('CLAUDE.md', 'utf8')
const chiTiet = readFileSync(FILE_CHI_TIET, 'utf8')

describe('CLAUDE.md ↔ docs/claude-md-chi-tiet.md', () => {
  it('mọi mục §X được CLAUDE.md trỏ tới đều có thật trong file chi tiết', () => {
    const tro = mucDuocTro(claudeMd)
    expect(tro.length, 'CLAUDE.md phải còn trỏ tới file chi tiết').toBeGreaterThan(0)
    const coThat = new Set(mucCoThat(chiTiet))
    expect(tro.filter((muc) => !coThat.has(muc))).toEqual([])
  })

  it(`CLAUDE.md không vượt ${TRAN_KY_TU} ký tự`, () => {
    expect(claudeMd.length).toBeLessThanOrEqual(TRAN_KY_TU)
  })
})

describe('claudeMdSplit — logic thuần', () => {
  it('dongBiMat: dòng còn ở CLAUDE.md mới hoặc đã dời sang chi tiết thì không tính là mất', () => {
    const cu = 'luật A\n\nlý do dài của A\nluật B'
    expect(dongBiMat(cu, 'luật A\nluật B', 'lý do dài của A')).toEqual([])
    expect(dongBiMat(cu, '  luật A  \nluật B', '   lý do dài của A')).toEqual([])
    expect(dongBiMat(cu, 'luật A', 'lý do dài của A')).toEqual(['luật B'])
  })

  it('mucDuocTro / mucCoThat đọc đúng số mục, kể cả mục con 11.1', () => {
    const md = 'xem `docs/claude-md-chi-tiet.md` §6 và docs/claude-md-chi-tiet.md §11.1.'
    expect(mucDuocTro(md).sort()).toEqual(['§11.1', '§6'])
    expect(mucCoThat('# t\n\n## §6 — Stack\n\n## §11.1 — CI\n')).toEqual(['§6', '§11.1'])
  })
})
