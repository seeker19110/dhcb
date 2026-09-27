import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NeuralCurriculumService } from '@dhcb/core-ai/neuralCurriculumService'
import { fetchNeuralCurriculum, generateMicroModule, completeDrill } from './neuralCurriculumApi.js'
const state = NeuralCurriculumService.createDefaultState('11111111-1111-4111-8111-111111111111')
const module = state.modules[0]!
beforeEach(() => {
  vi.restoreAllMocks()
  localStorage.clear()
})
describe('neuralCurriculumApi', () => {
  it('validate state tải từ server', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(Response.json({ state }))
    expect(await fetchNeuralCurriculum()).toEqual(state)
  })
  it('từ chối state malformed', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      Response.json({ state: { masteryScore: 100 } }),
    )
    await expect(fetchNeuralCurriculum()).rejects.toThrow()
  })
  it('tạo module qua POST', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(Response.json({ module, state }))
    expect((await generateMicroModule({ topicOrKeyword: 'Presentation' })).module).toEqual(module)
  })
  it('gửi đáp án kèm ID, nhận kết quả đã chấm từ server', async () => {
    const review = {
      masteryDelta: 15,
      nextIntervalDays: 2,
      correctCount: 3,
      total: 3,
      recorded: true,
    }
    const fetch = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(Response.json({ state, review }))
    const submission = {
      moduleId: module.moduleId,
      answers: module.drills.map((drill) => ({ drillId: drill.id, answer: drill.correctAnswer })),
    }
    expect(await completeDrill(submission)).toEqual({ state, review })
    expect(JSON.parse(String(fetch.mock.calls[0]?.[1]?.body))).toEqual(submission)
  })
  it('lỗi lưu không báo thành công', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      Response.json({ error: 'offline' }, { status: 503 }),
    )
    await expect(completeDrill({ moduleId: module.moduleId, answers: [] })).rejects.toThrow('503')
  })
})
