// Cổng cho `summarizeOutline` (S12-3, AC-13).
//
// Chạy trên CÂY THẬT của cả ba adapter S07 (CEFR · Lập trình · STEM): bẫy ở đây là bẫy DỮ LIỆU
// ("94 bài Vật lí toàn chưa đo được" khác hẳn "94 bài chưa học"), mà cây giả thì không nói lên
// được điều đó. Ca biên `unknown` là ca quan trọng nhất — quy nó về 0 là vi phạm luật số 1.
import { describe, it, expect, beforeAll, vi } from 'vitest'
import type { Outline } from '@dhcb/core-contracts/outline'
import { OutlineSchema } from '@dhcb/core-contracts/outline'
import type { LevelLockInfo } from '@dhcb/subject-programming/levelLock'
import { PHYSICS_LOADER } from '@dhcb/subject-physics/lessonsLoader'
import { loadCefr } from '../data/cefrLoader'
import { loadFoundation } from '../data/curriculumLoader'
import type { CefrLevel } from '../data/cefrTypes'
import type { Circle } from '../data/curriculumTypes'
import { buildCefrOutline } from './outline/cefrOutline'
import { buildLevelOutline } from './outline/programmingOutline'
import { buildStemOutlineForApp } from './outline/stemOutlineApp'
import { STEM_SUBJECTS } from './stemLessonRoutes'
import { summarizeOutline, nhanNguonBangChung, rutGonPhamVi } from './progressSummary'

let levels: CefrLevel[] = []
let circles: Map<string, Circle> = new Map()

beforeAll(async () => {
  levels = await loadCefr()
  circles = new Map((await loadFoundation()).map((c) => [c.id, c]))
})

const LOCK_RONG = new Map<string, LevelLockInfo>()

describe('summarizeOutline — cây THẬT môn STEM', () => {
  it('Vật lí lớp 10 chưa có bằng chứng: toàn unknown → measured:false, KHÔNG quy về 0', () => {
    const cay = buildStemOutlineForApp(STEM_SUBJECTS.physics, '10')!
    const s = summarizeOutline(cay)
    expect(s.total).toBeGreaterThan(20) // dữ liệu thật, đủ lớn để ca có nghĩa
    expect(s.unknown).toBe(s.total)
    expect(s.completed).toBe(0)
    expect(s.measured).toBe(false)
    expect(s.evidenceSources).toEqual([])
    expect(s.subjectId).toBe('physics')
  })

  it('chỉ đếm LÁ: nút chương/lớp không được tính vào tổng', () => {
    const cay = buildStemOutlineForApp(STEM_SUBJECTS.physics, '10')!
    const soLa = cay.nodes.filter((n) => n.kind === 'lesson' || n.kind === 'activity').length
    expect(summarizeOutline(cay).total).toBe(soLa)
    expect(soLa).toBeLessThan(cay.nodes.length) // có nút khung thật, ca không rỗng nghĩa
  })

  it('có bằng chứng hoàn thành hai bài → 2/n, measured:true, nêu đúng nguồn', () => {
    const goc = buildStemOutlineForApp(STEM_SUBJECTS.physics, '10')!
    const hai = goc.nodes.filter((n) => n.kind === 'lesson').slice(0, 2)
    const state = new Map(
      hai.map((n) => [
        n.contentId!,
        {
          subjectId: 'physics' as const,
          contentId: n.contentId!,
          status: 'completed' as const,
          updatedAt: 1,
          source: 'server' as const,
        },
      ]),
    )
    const cay = buildStemOutlineForApp(STEM_SUBJECTS.physics, '10', {
      state,
      stateStatus: 'ready',
    })!
    const s = summarizeOutline(cay)
    expect(s.completed).toBe(2)
    expect(s.measured).toBe(true)
    expect(s.evidenceSources).toEqual(['stem.evidence'])
    expect(nhanNguonBangChung(s.evidenceSources)).toBe('theo bài đã đạt test')
  })
})

describe('summarizeOutline — cây THẬT môn Lập trình', () => {
  const capP1 = (
    progress: readonly { lessonId: string; status: 'completed' | 'in_progress' }[],
    progressState: 'loading' | 'ready' | 'error' = 'ready',
  ): Outline =>
    buildLevelOutline('p1', {
      progress: progress.map((p) => ({ ...p, completedAt: null })),
      progressState,
      lockMap: LOCK_RONG,
    })!

  it('P1 với 2 bản ghi completed → 2/n và nguồn programming.progress', () => {
    const rong = capP1([])
    OutlineSchema.parse(rong)
    const ids = rong.nodes
      .filter((n) => n.kind === 'lesson')
      .slice(0, 2)
      .map((n) => n.contentId!)
    const s = summarizeOutline(capP1(ids.map((lessonId) => ({ lessonId, status: 'completed' }))))
    expect(s.completed).toBe(2)
    expect(s.total).toBe(summarizeOutline(rong).total)
    expect(s.measured).toBe(true)
    expect(s.evidenceSources).toEqual(['programming.progress'])
  })

  it('tải tiến độ HỎNG → mọi lá unknown → "chưa đo được", không phải "0 bài đã xong"', () => {
    const s = summarizeOutline(capP1([], 'error'))
    expect(s.unknown).toBe(s.total)
    expect(s.measured).toBe(false)
  })

  it('không có bản ghi nào nhưng tải XONG → not-started là phép đo hợp lệ (measured:true)', () => {
    const s = summarizeOutline(capP1([]))
    expect(s.completed).toBe(0)
    expect(s.unknown).toBe(0)
    expect(s.measured).toBe(true)
  })

  it('bài đang học dở được đếm riêng, không gộp vào completed', () => {
    const rong = capP1([])
    const id = rong.nodes.find((n) => n.kind === 'lesson')!.contentId!
    const s = summarizeOutline(capP1([{ lessonId: id, status: 'in_progress' }]))
    expect(s.completed).toBe(0)
    expect(s.inProgress).toBe(1)
  })
})

describe('summarizeOutline — cây THẬT môn Tiếng Anh', () => {
  it('cấp A1 chưa học gì: đếm đủ hoạt động, tiêu đề phạm vi lấy từ nút gốc', () => {
    const a1 = levels.find((l) => l.id === 'A1')!
    const cay = buildCefrOutline(a1, {
      learned: new Set(),
      doneGrammar: new Set(),
      viewedDialogues: new Set(),
      learnedDialogues: new Set(),
      circles,
      lockedMap: new Map(),
    })
    const s = summarizeOutline(cay)
    expect(s.subjectId).toBe('english')
    expect(s.scopeId).toBe('A1')
    expect(s.scopeTitle).toContain('A1')
    expect(s.total).toBe(cay.nodes.filter((n) => n.kind === 'activity').length)
    expect(s.completed).toBe(0)
  })

  it('học xong một bài ngữ pháp → 1 mục đã xong, nguồn english.cefrGrammar', () => {
    const a1 = levels.find((l) => l.id === 'A1')!
    const grammarId = a1.units.flatMap((u) => u.grammar)[0]!.id
    const s = summarizeOutline(
      buildCefrOutline(a1, {
        learned: new Set(),
        doneGrammar: new Set([grammarId]),
        viewedDialogues: new Set(),
        learnedDialogues: new Set(),
        circles,
        lockedMap: new Map(),
      }),
    )
    expect(s.completed).toBe(1)
    expect(s.measured).toBe(true)
    expect(s.evidenceSources).toContain('english.cefrGrammar')
  })
})

describe('bất biến: hàm THUẦN', () => {
  it('không ghi localStorage, không fetch, không nạp nội dung bài', () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem')
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    const loadLesson = vi.spyOn(PHYSICS_LOADER, 'loadLesson')
    summarizeOutline(buildStemOutlineForApp(STEM_SUBJECTS.physics, '10')!)
    expect(setItem).not.toHaveBeenCalled()
    expect(fetchSpy).not.toHaveBeenCalled()
    expect(loadLesson).not.toHaveBeenCalled()
    setItem.mockRestore()
    fetchSpy.mockRestore()
    loadLesson.mockRestore()
  })
})

describe('nhanNguonBangChung', () => {
  it('khử trùng nhãn khi nhiều nguồn cùng nghĩa, và bỏ qua nguồn lạ', () => {
    expect(nhanNguonBangChung(['stem.evidence', 'programming.progress'])).toBe(
      'theo bài đã đạt test',
    )
    expect(nhanNguonBangChung(['mon.moi.chua.khai'])).toBeUndefined()
    expect(nhanNguonBangChung([])).toBeUndefined()
  })
})

describe('rutGonPhamVi — chống LẶP CHỮ giữa tên môn và tiêu đề phạm vi (Tầng 8b)', () => {
  it('bỏ tên môn lặp ở đầu tiêu đề', () => {
    expect(rutGonPhamVi('Toán', 'Toán · Lớp 10')).toBe('Lớp 10')
    expect(rutGonPhamVi('Vật lí', 'Vật lí · Lớp 11')).toBe('Lớp 11')
  })

  it('bỏ mã cấp lặp hai lần của tiêu đề CEFR', () => {
    expect(rutGonPhamVi('Tiếng Anh', 'A1 · A1 — Sơ cấp')).toBe('A1 — Sơ cấp')
  })

  it('không đụng tiêu đề vốn đã không lặp', () => {
    expect(rutGonPhamVi('Lập trình', 'P1 · Nhập môn tư duy')).toBe('P1 · Nhập môn tư duy')
    expect(rutGonPhamVi('Toán', 'Lớp 12')).toBe('Lớp 12')
  })

  it('không trả chuỗi rỗng khi tiêu đề ĐÚNG BẰNG tên môn', () => {
    expect(rutGonPhamVi('Toán', 'Toán')).toBe('Toán')
  })
})
