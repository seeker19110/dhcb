// packages/core-ai/visionSolverService.test.ts
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, describe, it, expect, vi } from 'vitest'
import {
  cleanBase64,
  parseVisionSolutionText,
  solveProblemWithVision,
  VisionSolverBadOutputError,
  VisionSolverUnavailableError,
} from './visionSolverService.js'

describe('VisionSolverService', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  it('cleans data url headers from base64 strings', () => {
    const raw = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg=='
    const cleaned = cleanBase64(raw)
    expect(cleaned.mimeType).toBe('image/png')
    expect(cleaned.data).toBe('iVBORw0KGgoAAAANSUhEUg==')
  })

  it('parses valid json block from AI response', () => {
    const aiText = `\`\`\`json
{
  "problemText": "Giải phương trình 2x + 4 = 0",
  "steps": [
    { "title": "Bước 1: Chuyển vế", "detail": "2x = -4", "formula": "2x = -4" },
    { "title": "Bước 2: Chia 2 vế cho 2", "detail": "x = -2", "formula": "x = -2" }
  ],
  "finalAnswer": "x = -2"
}
\`\`\``

    const parsed = parseVisionSolutionText(aiText)
    expect(parsed?.problemText).toBe('Giải phương trình 2x + 4 = 0')
    expect(parsed?.steps).toHaveLength(2)
    expect(parsed?.finalAnswer).toBe('x = -2')
  })

  it('văn bản AI sai khuôn hoặc rỗng ⇒ null, KHÔNG bịa bước giải mẫu (changelog 0563)', () => {
    expect(parseVisionSolutionText('Không thể parse JSON')).toBeNull()
    expect(parseVisionSolutionText('')).toBeNull()
    expect(parseVisionSolutionText('{"problemText":"x","steps":[],"finalAnswer":"y"}')).toBeNull()
  })

  it('thiếu GEMINI_API_KEY ⇒ ném VisionSolverUnavailableError 503, không trả lời giải giả', async () => {
    vi.stubEnv('GEMINI_API_KEY', '')
    const fetchSpy = vi.spyOn(global, 'fetch')
    const promise = solveProblemWithVision({
      imageBase64: 'iVBORw0KGgoAAAANSUhEUg==',
      subjectId: 'physics',
      userPrompt: 'Tính gia tốc a',
    })
    await expect(promise).rejects.toBeInstanceOf(VisionSolverUnavailableError)
    await expect(promise).rejects.toMatchObject({ status: 503, code: 'vision_unavailable' })
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('cleanBase64 không có tiền tố data: giữ nguyên và mặc định image/jpeg', () => {
    const rawClean = cleanBase64('justbase64string')
    expect(rawClean.mimeType).toBe('image/jpeg')
    expect(rawClean.data).toBe('justbase64string')
  })

  it('AI trả văn bản sai khuôn ⇒ ném VisionSolverBadOutputError 502', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: 'xin lỗi, tôi không đọc được' }] } }],
      }),
    } as unknown as Response)
    await expect(
      solveProblemWithVision({ imageBase64: 'abc', subjectId: 'math' }, 'mock-api-key'),
    ).rejects.toBeInstanceOf(VisionSolverBadOutputError)
  })

  it('mã nguồn không còn nhánh giả lập/đáp số bịa (chống kết quả giả)', () => {
    const source = readFileSync(join(__dirname, 'visionSolverService.ts'), 'utf8')
    expect(source).not.toMatch(/Mock/)
    expect(source).not.toMatch(/'Đáp số đã được xác minh chính xác\.'/)
  })

  it('solves problem with apiKey and mock fetch responses', async () => {
    // 1. Mock fetch error
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 403,
      text: async () => 'Quota exceeded',
    } as unknown as Response)

    await expect(
      solveProblemWithVision(
        {
          imageBase64: 'abc',
          subjectId: 'math',
          gradeLevel: 'Lớp 12',
          mimeType: 'image/png',
        },
        'mock-api-key',
      ),
    ).rejects.toThrow('Gemini Vision API error (403)')

    // 2. Mock fetch success
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [
                {
                  text: JSON.stringify({
                    problemText: 'Tính tích phân',
                    steps: [
                      { title: 'B1', detail: 'Tích phân từng phần', formula: 'uv - \\int v du' },
                    ],
                    finalAnswer: 'I = 1',
                  }),
                },
              ],
            },
          },
        ],
        usageMetadata: { totalTokenCount: 420 },
      }),
    } as unknown as Response)

    const successRes = await solveProblemWithVision(
      {
        imageBase64: 'abc',
        subjectId: 'math',
      },
      'mock-api-key',
    )
    expect(successRes.problemText).toBe('Tính tích phân')
    expect(successRes.tokenUsed).toBe(420)
    // Không còn số tin cậy bịa (trước đây cố định 0.98).
    expect(successRes.confidence).toBeUndefined()
  })

  it('API không báo usageMetadata → tokenUsed để trống, không bịa 350', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [
                {
                  text: JSON.stringify({
                    problemText: 'Đề',
                    steps: [{ title: 'B1', detail: 'Giải' }],
                    finalAnswer: 'x = 1',
                  }),
                },
              ],
            },
          },
        ],
      }),
    } as unknown as Response)
    const res = await solveProblemWithVision({ imageBase64: 'abc', subjectId: 'math' }, 'k')
    expect(res.tokenUsed).toBeUndefined()
    expect(res.confidence).toBeUndefined()
  })
})
