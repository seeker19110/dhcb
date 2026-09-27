import { afterEach, describe, expect, it, vi } from 'vitest'
import { startCefrAssessment, submitCefrAssessment } from './cefrAssessmentApi'
const id = '11111111-1111-4111-8111-111111111111'
afterEach(() => vi.unstubAllGlobals())
describe('API chấm thi CEFR', () => {
  it('gửi cấp và chiều học, không gửi đề hay điểm tự chấm', async () => {
    const fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          attemptId: id,
          expiresAt: 1,
          questions: [
            { key: 'q', part: 'grammar', promptKind: 'text', prompt: 'Q', options: ['a', 'b'] },
          ],
        }),
      ),
    )
    vi.stubGlobal('fetch', fetch)
    const exam = await startCefrAssessment('A1', true)
    expect(exam.questions[0]).not.toHaveProperty('correct')
    expect(JSON.parse(fetch.mock.calls[0]![1].body)).toEqual({
      action: 'start',
      level: 'A1',
      isA: true,
    })
  })
  it('báo lỗi mạng/chấm thi và từ chối phản hồi không đúng hợp đồng', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(new Response(JSON.stringify({ error: 'Hết hạn' }), { status: 410 })),
    )
    await expect(submitCefrAssessment(id, ['a'])).rejects.toThrow('Hết hạn')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}')))
    await expect(startCefrAssessment('A1', true)).rejects.toThrow()
  })
})
