// apps/dhcb/src/lib/visionSolverApi.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { solveProblemImage } from './visionSolverApi.js'

describe('visionSolverApi', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('calls POST /api/vision-solve and returns parsed result', async () => {
    const mockRes = {
      problemText: 'Tính tích phân',
      steps: [{ title: 'B1', detail: 'Chi tiết' }],
      finalAnswer: 'I = 1',
    }

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockRes,
    })

    const res = await solveProblemImage({
      imageBase64: 'iVBORw0KGgoAAAANSUhEUg==',
      subjectId: 'mathematics',
    })

    expect(globalThis.fetch).toHaveBeenCalledWith('/api/vision-solve', expect.any(Object))
    expect(res.problemText).toBe('Tính tích phân')
    expect(res.finalAnswer).toBe('I = 1')
  })

  it('throws error when API returns non-ok status', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ error: 'Ảnh không hợp lệ' }),
    })

    await expect(solveProblemImage({ imageBase64: 'invalid', subjectId: 'math' })).rejects.toThrow(
      'Ảnh không hợp lệ',
    )
  })

  it('đọc được lỗi khuôn AppError {error:{message,code}} (vd 503 thiếu key AI)', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({
        error: { message: 'Tạm thời chưa sẵn sàng', code: 'vision_unavailable' },
      }),
    })
    await expect(solveProblemImage({ imageBase64: 'x', subjectId: 'math' })).rejects.toThrow(
      'Tạm thời chưa sẵn sàng',
    )
  })
})
