// Chỉ dùng code vô hại và mô phỏng thuần để kiểm ranh giới production.
// Các cổng lessonsPython/Js/Ts/Sql vẫn kiểm nội dung tin cậy; test này không chạy
// payload thoát sandbox/DoS và không coi node:vm/subprocess là ranh giới bảo mật.
import { describe, expect, it, vi, afterEach } from 'vitest'
import { getLesson, PROGRAMMING_LESSONS } from './lessons.js'
import {
  regradeMakeSubmission,
  regradeInterpretedSubmission,
  regradeSubmission,
  regradeWebSubmission,
  regradeSqlSubmission,
  isServerRegradableLesson,
  getServerRegradeAvailability,
  assertServerRegradeAvailable,
  GradingUnavailableError,
  MAX_SUBMISSION_CODE_LENGTH,
} from './completionSandboxServer.js'

const blockedEngineCall = vi.hoisted(() =>
  vi.fn(() => {
    throw new Error('Engine không được chạy trong API')
  }),
)
vi.mock('node:child_process', () => ({
  execFileSync: blockedEngineCall,
  spawnSync: blockedEngineCall,
}))
vi.mock('node:vm', () => ({
  default: { createContext: blockedEngineCall, runInContext: blockedEngineCall },
}))
vi.mock('sql.js', () => ({ default: blockedEngineCall }))
vi.mock('./domFetchServerPrelude.js', () => ({
  chayBaiHtmlServer: blockedEngineCall,
  chayBaiDomServer: blockedEngineCall,
  chayBaiFetchServer: blockedEngineCall,
}))
vi.mock('./kotlinSim/chayKotlin.js', () => ({ chayKotlin: blockedEngineCall }))
vi.mock('./swiftSim/index.js', () => ({ chaySwift: blockedEngineCall }))
vi.mock('./bashSim.js', () => ({ chayBash: blockedEngineCall }))
afterEach(() => {
  expect(blockedEngineCall).not.toHaveBeenCalled()
  vi.unstubAllEnvs()
})

describe('chính sách chấm lại fail-closed', () => {
  it('mọi bài học vẫn yêu cầu chấm lại, engine tạm dừng không rơi về client tự khai', () => {
    expect(PROGRAMMING_LESSONS.length).toBeGreaterThan(500)
    for (const lesson of PROGRAMMING_LESSONS) {
      expect(isServerRegradableLesson(lesson.id), lesson.id).toBe(true)
    }
  })

  it('bước dự án, rubric và id không tồn tại nằm ngoài phạm vi; dispatcher từ chối', async () => {
    for (const id of ['p1-s1', 'web-s2-m1', 'khong-ton-tai-u1-l1']) {
      expect(isServerRegradableLesson(id)).toBe(false)
      expect(getServerRegradeAvailability(id)).toBe('not_regradable')
      await expect(regradeSubmission(id, '# harmless')).rejects.toThrow('không thuộc phạm vi')
    }
  })

  const paused = PROGRAMMING_LESSONS.filter(
    (lesson) => !['git', 'hermes', 'vibe', 'openclaw'].includes(lesson.language),
  )
  it.each(paused.map((lesson) => [lesson.id, lesson.language] as const))(
    '%s (%s) tạm dừng cả dispatcher và đường thông dịch trực tiếp, không thực thi engine',
    async (id) => {
      expect(getServerRegradeAvailability(id)).toBe('isolated_worker_required')
      expect(() => assertServerRegradeAvailable(id)).toThrow(GradingUnavailableError)
      await expect(regradeSubmission(id, '# harmless')).rejects.toMatchObject({
        code: 'PROGRAMMING_GRADING_UNAVAILABLE',
      })
      expect(() => regradeInterpretedSubmission(id, '# harmless')).toThrow(GradingUnavailableError)
    },
  )

  it('các export engine cũ cũng đóng; cấu hình sandbox cũ không thể mở lại Python', async () => {
    vi.stubEnv('PROGRAMMING_SANDBOX_USER', 'configured-sandbox-user')
    expect(() => regradeMakeSubmission('p1-u1-l1', 'print(1)')).toThrow(GradingUnavailableError)
    await expect(regradeWebSubmission('p3-u6-l1', 'console.log(1)')).rejects.toThrow(
      GradingUnavailableError,
    )
    await expect(regradeSqlSubmission('p3-u9-l1', 'SELECT 1;')).rejects.toThrow(
      GradingUnavailableError,
    )
  })
})

describe('bộ mô phỏng dòng lệnh còn hoạt động', () => {
  const cases: ReadonlyArray<readonly [string, string]> = [
    ['git-u2-l1', 'echo "khong lien quan gi ca"'],
    ['hermes-u1-l1', '# khong lam gi'],
    ['vibe-u1-l1', '# khong lam gi'],
    ['openclaw-u1-l1', '# khong lam gi'],
  ]
  it.each(cases)(
    '%s: code mẫu đạt, code sai không đạt qua dispatcher thật',
    async (id, wrongCode) => {
      const lesson = getLesson(id)!
      expect(getServerRegradeAvailability(id)).toBe('available')
      expect((await regradeSubmission(id, lesson.make.sampleSolution)).passed).toBe(true)
      expect((await regradeSubmission(id, wrongCode)).passed).toBe(false)
    },
  )

  it('giới hạn code áp dụng cả dispatcher và hàm mô phỏng trực tiếp', async () => {
    const tooLong = '#'.repeat(MAX_SUBMISSION_CODE_LENGTH + 1)
    await expect(regradeSubmission('git-u2-l1', tooLong)).rejects.toThrow('Code vượt quá')
    expect(() => regradeInterpretedSubmission('git-u2-l1', tooLong)).toThrow('Code vượt quá')
    expect(
      regradeInterpretedSubmission('git-u2-l1', '#'.repeat(MAX_SUBMISSION_CODE_LENGTH)).passed,
    ).toBe(false)
  })
})
