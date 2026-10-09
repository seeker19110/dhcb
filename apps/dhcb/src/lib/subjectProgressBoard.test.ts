// subjectProgressBoard.test.ts — Khối "Tiến độ theo môn" ở `/tien-do` (S12-3, AC-14).
//
// File nguồn chỉ nạp dữ liệu môn bằng `import()` ĐỘNG (ràng buộc ②) — `vi.mock` vẫn chặn được
// import động, nên test này thay toàn bộ nguồn dữ liệu bằng bản giả điều khiển được và canh ba
// ràng buộc đầu file nguồn: đếm qua `summarizeOutline` (①), và một môn hỏng không làm trắng
// cả khối (③). Không kiểm nội dung cây mục lục (đã có test riêng của từng adapter S07).
import { describe, it, expect, beforeEach, vi } from 'vitest'

const m = vi.hoisted(() => ({
  // Tiếng Anh
  loadCefr: vi.fn(),
  loadFoundation: vi.fn(async () => [{ id: 'c1' }]),
  buildCefrOutline: vi.fn(() => ({ kind: 'cefr' })),
  computeLockedMapFromServer: vi.fn(() => ({})),
  getDoneGrammar: vi.fn(() => []),
  getViewedDialogues: vi.fn(() => []),
  getLearnedDialogues: vi.fn(() => []),
  getDialogueTitlesByUnit: vi.fn(async () => new Map()),
  getLearnedWords: vi.fn(() => []),
  getPassedExamLevels: vi.fn(() => []),
  englishNext: vi.fn(() => ({ levelId: undefined })),
  duongDanCapCefr: vi.fn((id: string) => `/lo-trinh-hoc/${id}`),
  getDirection: vi.fn(() => 'A'),
  // Lập trình
  buildLevelOutline: vi.fn(() => ({ kind: 'prog' })),
  fetchProgressWithState: vi.fn(async () => ({ lessons: [], state: 'ready' })),
  levelLockMap: vi.fn(() => ({})),
  programmingNext: vi.fn(() => ({ picked: undefined })),
  duongDanBac: vi.fn(() => '/bac/p1'),
  PROGRAMMING_LEVELS: [{ id: 'p1', title: 'Nhập môn' }],
  // STEM
  buildStemOutlineForApp: vi.fn(() => ({ kind: 'stem' })),
  fetchCompletionState: vi.fn(async () => ({ state: {}, status: 'ready' })),
  // Ý định
  readLocalIntent: vi.fn(() => null),
  // Đếm
  summarizeOutline: vi.fn((o: { kind: string }) => ({ kind: o.kind })),
}))

vi.mock('../data/cefrLoader', () => ({ loadCefr: m.loadCefr }))
vi.mock('../data/curriculumLoader', () => ({ loadFoundation: m.loadFoundation }))
vi.mock('./outline/cefrOutline', () => ({ buildCefrOutline: m.buildCefrOutline }))
vi.mock('./cefrProgress', () => ({
  computeLockedMapFromServer: m.computeLockedMapFromServer,
  getDoneGrammar: m.getDoneGrammar,
  getViewedDialogues: m.getViewedDialogues,
  getLearnedDialogues: m.getLearnedDialogues,
}))
vi.mock('../data/dialoguesLoader', () => ({ getDialogueTitlesByUnit: m.getDialogueTitlesByUnit }))
vi.mock('./vocab', () => ({ getLearnedWords: m.getLearnedWords }))
vi.mock('./cefrExam', () => ({ getPassedExamLevels: m.getPassedExamLevels }))
vi.mock('./today/englishNext', () => ({
  englishNext: m.englishNext,
  duongDanCapCefr: m.duongDanCapCefr,
}))
vi.mock('./storage', () => ({ getDirection: m.getDirection }))
vi.mock('./outline/programmingOutline', () => ({ buildLevelOutline: m.buildLevelOutline }))
vi.mock('./programmingProgress', () => ({ fetchProgressWithState: m.fetchProgressWithState }))
vi.mock('./programmingLevelLock', () => ({ levelLockMap: m.levelLockMap }))
vi.mock('./today/programmingNext', () => ({ programmingNext: m.programmingNext }))
vi.mock('./programmingRoutes', () => ({ duongDanBac: m.duongDanBac }))
vi.mock('@dhcb/subject-programming/curriculum', () => ({
  PROGRAMMING_LEVELS: m.PROGRAMMING_LEVELS,
}))
vi.mock('./outline/stemOutlineApp', () => ({ buildStemOutlineForApp: m.buildStemOutlineForApp }))
// `./stemLessonRoutes` KHÔNG mock: module khác còn cần export khác của nó (`nhanCapHsg`…), và
// nhãn/URL thật là thứ đáng canh (href phải trỏ đúng danh sách bài môn đó).
vi.mock('./stemEvidence', () => ({ fetchCompletionState: m.fetchCompletionState }))
vi.mock('./intent/learnerIntentStore', () => ({ readLocalIntent: m.readLocalIntent }))
vi.mock('./progressSummary', () => ({ summarizeOutline: m.summarizeOutline }))

import { buildSubjectProgressBoard } from './subjectProgressBoard'

const LEVELS = [
  { id: 'A1', title: 'A1', units: [] },
  { id: 'A2', title: 'A2', units: [] },
]

beforeEach(() => {
  vi.resetAllMocks() // resetAllMocks trả về impl gốc của vi.fn(impl), clearAllMocks thì giữ override của test trước
  m.loadCefr.mockResolvedValue(LEVELS)
})

describe('buildSubjectProgressBoard', () => {
  it('đủ 6 môn theo thứ tự cố định, mỗi thẻ đếm qua summarizeOutline (ràng buộc ①)', async () => {
    const the = await buildSubjectProgressBoard('u1', 'free')
    expect(the.map((t) => t.subjectId)).toEqual([
      'english',
      'programming',
      'mathematics',
      'physics',
      'chemistry',
      'biology',
    ])
    expect(the.map((t) => t.subjectLabel)).toEqual([
      'Tiếng Anh',
      'Lập trình',
      'Toán',
      'Vật lí',
      'Hoá học',
      'Sinh học',
    ])
    expect(the[2]?.href).toBe('/goc-hoc-tap/mathematics/bai-hoc')
    expect(m.summarizeOutline).toHaveBeenCalledTimes(6)
    // Chưa khai lớp → STEM dựng theo lớp mặc định 10.
    expect(m.buildStemOutlineForApp.mock.calls[0]?.[1]).toBe('10')
  })

  it('Tiếng Anh: englishNext không chỉ cấp → lấy cấp đầu, không có prevLevelId', async () => {
    const [anh] = await buildSubjectProgressBoard('u1', 'free')
    expect(anh?.href).toBe('/lo-trinh-hoc/A1')
    const opts = m.buildCefrOutline.mock.calls[0]?.[1] as Record<string, unknown>
    expect(opts).not.toHaveProperty('prevLevelId')
  })

  it('Tiếng Anh: cấp hiện tại là A2 → prevLevelId = A1, href theo cấp đó', async () => {
    m.englishNext.mockReturnValue({ levelId: 'A2' })
    const [anh] = await buildSubjectProgressBoard('u1', 'free')
    expect(anh?.href).toBe('/lo-trinh-hoc/A2')
    const opts = m.buildCefrOutline.mock.calls[0]?.[1] as Record<string, unknown>
    expect(opts.prevLevelId).toBe('A1')
    // isA suy từ direction
    expect(m.englishNext.mock.calls[0]?.[0]).toMatchObject({ isA: true })
  })

  it('Tiếng Anh: chương trình rỗng, hoặc cấp không tồn tại → vắng thẻ, các môn khác còn', async () => {
    m.loadCefr.mockResolvedValue([])
    let the = await buildSubjectProgressBoard('u1', 'free')
    expect(the.map((t) => t.subjectId)).not.toContain('english')
    expect(the).toHaveLength(5)

    m.loadCefr.mockResolvedValue(LEVELS)
    m.englishNext.mockReturnValue({ levelId: 'Z9' })
    the = await buildSubjectProgressBoard('u1', 'free')
    expect(the.map((t) => t.subjectId)).not.toContain('english')
  })

  it('Lập trình: chưa có bằng chứng → bậc p1; pickNextLesson chỉ bậc khác → dùng bậc đó', async () => {
    let [, lt] = await buildSubjectProgressBoard('u1', 'free')
    expect(m.buildLevelOutline.mock.calls[0]?.[0]).toBe('p1')
    expect(lt?.href).toBe('/bac/p1')

    vi.resetAllMocks()
    m.loadCefr.mockResolvedValue(LEVELS)
    m.programmingNext.mockReturnValue({ picked: { levelId: 'p3' } })
    ;[, lt] = await buildSubjectProgressBoard('u1', 'vip')
    expect(m.buildLevelOutline.mock.calls[0]?.[0]).toBe('p3')
    // p3 không có trong PROGRAMMING_LEVELS giả → href dự phòng, không ném lỗi.
    expect(lt?.href).toBe('/goc-hoc-tap/programming')
    // gói dịch vụ đi vào luật khoá bậc
    expect(m.levelLockMap.mock.calls[0]?.[2]).toBe('vip')
  })

  it('Lập trình: không dựng được cây → vắng thẻ; tải hỏng → state đi vào outline', async () => {
    m.buildLevelOutline.mockReturnValueOnce(undefined)
    const the = await buildSubjectProgressBoard('u1', 'free')
    expect(the.map((t) => t.subjectId)).not.toContain('programming')

    m.fetchProgressWithState.mockResolvedValueOnce({ lessons: [], state: 'error' })
    await buildSubjectProgressBoard('u1', 'free')
    const opts = m.buildLevelOutline.mock.calls.at(-1)?.[1] as Record<string, unknown>
    expect(opts.progressState).toBe('error')
  })

  it('STEM: lớp lấy từ ý định đã khai; môn không dựng được cây → vắng thẻ đó', async () => {
    m.readLocalIntent.mockReturnValue({ grade: '12' } as never)
    m.buildStemOutlineForApp.mockImplementation((subject: { label: string }) =>
      subject.label === 'Hoá học' ? undefined : { kind: 'stem' },
    )
    const the = await buildSubjectProgressBoard('u1', 'free')
    expect(m.buildStemOutlineForApp.mock.calls[0]?.[1]).toBe('12')
    expect(the.map((t) => t.subjectId)).toEqual([
      'english',
      'programming',
      'mathematics',
      'physics',
      'biology',
    ])
  })

  it('đọc ý định ném lỗi → lớp mặc định, không vỡ', async () => {
    m.readLocalIntent.mockImplementation(() => {
      throw new Error('localStorage hỏng')
    })
    const the = await buildSubjectProgressBoard('u1', 'free')
    expect(m.buildStemOutlineForApp.mock.calls[0]?.[1]).toBe('10')
    expect(the).toHaveLength(6)
  })

  it('mọi môn STEM đều lỗi → bốn môn STEM vắng, hai môn kia vẫn hiện', async () => {
    m.fetchCompletionState.mockRejectedValue(new Error('offline'))
    const the = await buildSubjectProgressBoard('u1', 'free')
    expect(the.map((t) => t.subjectId)).toEqual(['english', 'programming'])
  })

  it('một môn ném lỗi KHÔNG làm trắng cả khối (ràng buộc ③)', async () => {
    m.loadCefr.mockRejectedValue(new Error('mạng'))
    m.fetchCompletionState.mockImplementation(async (_u: string, id: string) => {
      if (id === 'physics') throw new Error('500')
      return { state: {}, status: 'ready' }
    })
    const the = await buildSubjectProgressBoard('u1', 'free')
    expect(the.map((t) => t.subjectId)).toEqual([
      'programming',
      'mathematics',
      'chemistry',
      'biology',
    ])
  })
})
