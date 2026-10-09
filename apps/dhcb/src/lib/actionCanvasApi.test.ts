// apps/dhcb/src/lib/actionCanvasApi.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  fetchActionCanvas,
  saveActionCanvas,
  synthesizeGoalCanvas,
  exportCanvasMarkdown,
} from './actionCanvasApi.js'

describe('actionCanvasApi client library', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
  })

  it('fetches action canvas', async () => {
    const mockCanvas = { title: 'Test Canvas', nodes: [] }
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, canvas: mockCanvas }),
    } as unknown as Response)

    const canvas = await fetchActionCanvas()
    expect(canvas.title).toBe('Test Canvas')
  })

  it('saves action canvas via POST', async () => {
    const mockCanvas = { title: 'Updated Canvas', nodes: [] }
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, canvas: mockCanvas }),
    } as unknown as Response)

    const saved = await saveActionCanvas(
      mockCanvas as unknown as Parameters<typeof saveActionCanvas>[0],
    )
    expect(saved.title).toBe('Updated Canvas')
  })

  // [changelog 0549] Đề xuất AI: kết quả là union theo tình huống, response được validate Zod.
  describe('synthesizeGoalCanvas', () => {
    const NOW = '2026-10-09T00:00:00.000Z'
    const proposal = {
      canvasId: '11111111-1111-4111-8111-111111111111',
      personId: '22222222-2222-4222-8222-222222222222',
      title: 'Đạt IELTS 6.5',
      nodes: [],
      edges: [],
      viewport: { zoom: 1, panX: 0, panY: 0 },
      lastEditedBy: 'user',
      schemaVersion: 'v4.2.0',
      createdAt: NOW,
      updatedAt: NOW,
    }
    function respond(status: number, body: unknown) {
      vi.spyOn(global, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify(body), { status }),
      )
    }

    it('200 + đề xuất đúng hợp đồng → ok; gửi kèm canvasId', async () => {
      respond(200, { success: true, source: 'ai', proposal })
      const r = await synthesizeGoalCanvas('Đạt IELTS 6.5', proposal.canvasId)
      expect(r).toEqual({ kind: 'ok', proposal })
      const init = vi.mocked(global.fetch).mock.calls[0]![1] as RequestInit
      expect(JSON.parse(init.body as string)).toEqual({
        goalPrompt: 'Đạt IELTS 6.5',
        canvasId: proposal.canvasId,
      })
    })

    it('200 nhưng đề xuất lệch hợp đồng → error (không vẽ canvas lưu không được)', async () => {
      respond(200, { success: true, proposal: { ...proposal, nodes: 'x' } })
      expect((await synthesizeGoalCanvas('Đạt IELTS 6.5')).kind).toBe('error')
    })

    it('429 usage_limit → quota kèm câu của server; 429 rate_limited → error', async () => {
      respond(429, { error: 'usage_limit', message: 'Bạn đã dùng hết lượt hôm nay.' })
      expect(await synthesizeGoalCanvas('Đạt IELTS 6.5')).toEqual({
        kind: 'quota',
        message: 'Bạn đã dùng hết lượt hôm nay.',
      })
      respond(429, { error: 'rate_limited', message: 'Quá nhiều yêu cầu' })
      expect((await synthesizeGoalCanvas('Đạt IELTS 6.5')).kind).toBe('error')
    })

    it('409 → busy; 400 → invalid; 502 → error với câu của server', async () => {
      respond(409, { error: 'synthesis_in_progress', message: 'Đang tạo' })
      expect((await synthesizeGoalCanvas('Đạt IELTS 6.5')).kind).toBe('busy')
      respond(400, { error: 'invalid_goal', message: 'Ngắn quá' })
      expect(await synthesizeGoalCanvas('ab')).toEqual({ kind: 'invalid', message: 'Ngắn quá' })
      respond(502, { error: 'ai_invalid_output', message: 'AI trả về kế hoạch không hợp lệ' })
      expect(await synthesizeGoalCanvas('Đạt IELTS 6.5')).toEqual({
        kind: 'error',
        message: 'AI trả về kế hoạch không hợp lệ',
      })
    })

    it('lỗi mạng / body không phải JSON → error với câu mặc định', async () => {
      vi.spyOn(global, 'fetch').mockRejectedValueOnce(new TypeError('Failed to fetch'))
      expect((await synthesizeGoalCanvas('Đạt IELTS 6.5')).kind).toBe('error')
      vi.spyOn(global, 'fetch').mockResolvedValueOnce(new Response('<html>', { status: 502 }))
      const r = await synthesizeGoalCanvas('Đạt IELTS 6.5')
      expect(r.kind).toBe('error')
      if (r.kind === 'error') expect(r.message).toMatch(/Chưa tạo được đề xuất/)
    })
  })

  it('exports canvas to markdown', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        format: 'markdown',
        markdown: '# Report',
        title: 'Plan',
      }),
    } as unknown as Response)

    const res = await exportCanvasMarkdown()
    expect(res.markdown).toBe('# Report')
  })
})
