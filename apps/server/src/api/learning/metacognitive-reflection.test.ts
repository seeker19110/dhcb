// api/metacognitive-reflection.test.ts — test cho handler Nhật ký Phản tỉnh Nhận thức.
import { beforeEach, describe, expect, it, vi } from 'vitest'
import handler from './metacognitive-reflection.js'
import * as security from '@dhcb/core-auth/security'

// State đã chuyển sang platform.feature_state — mock bằng Map in-memory, theo đúng khuôn
// debate-arena.test.ts (state sống suốt file test).
const featureStore = new Map<string, unknown>()
vi.mock('@dhcb/core-db/featureState', () => ({
  getFeatureState: vi.fn(async (u: string, f: string) => featureStore.get(u + '|' + f) ?? null),
  setFeatureState: vi.fn(async (u: string, f: string, st: unknown) => {
    featureStore.set(u + '|' + f, st)
  }),
}))

const USER = '11111111-1111-4111-8111-111111111111'

function authOk() {
  vi.spyOn(security, 'validateAuth').mockResolvedValue({ userId: USER })
}

describe('Metacognitive Reflection API Handler (/api/metacognitive-reflection)', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    featureStore.clear()
  })

  it('handles OPTIONS request with 204', async () => {
    const res = await handler(
      new Request('http://localhost/api/metacognitive-reflection', { method: 'OPTIONS' }),
    )
    expect(res.status).toBe(204)
  })

  it('rejects unauthorized requests with 401', async () => {
    vi.spyOn(security, 'validateAuth').mockResolvedValueOnce(null)
    const res = await handler(
      new Request('http://localhost/api/metacognitive-reflection', { method: 'GET' }),
    )
    expect(res.status).toBe(401)
  })

  it('GET daily_prompt: domain hợp lệ (career) + contextAnchor', async () => {
    authOk()
    const res = await handler(
      new Request(
        'http://localhost/api/metacognitive-reflection?action=daily_prompt&domain=career&contextAnchor=phong-van',
        { method: 'GET' },
      ),
    )
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.success).toBe(true)
    expect(data.prompt).toBeDefined()
  })

  it('GET daily_prompt: domain không hợp lệ hoặc thiếu → mặc định learning', async () => {
    authOk()
    const res = await handler(
      new Request('http://localhost/api/metacognitive-reflection?action=daily_prompt', {
        method: 'GET',
      }),
    )
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.prompt).toBeDefined()
  })

  it('GET daily_prompt: các domain còn lại work/startup/life đều hợp lệ', async () => {
    authOk()
    for (const domain of ['work', 'startup', 'life']) {
      const res = await handler(
        new Request(
          `http://localhost/api/metacognitive-reflection?action=daily_prompt&domain=${domain}`,
          {
            method: 'GET',
          },
        ),
      )
      expect(res.status).toBe(200)
    }
  })

  it('GET summary: trả về tóm tắt khi chưa có reflection nào', async () => {
    authOk()
    const res = await handler(
      new Request('http://localhost/api/metacognitive-reflection?action=summary', {
        method: 'GET',
      }),
    )
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.success).toBe(true)
    expect(data.reflections).toEqual([])
    expect(data.summary).toBeDefined()
  })

  it('GET mặc định: trả danh sách reflections rỗng', async () => {
    authOk()
    const res = await handler(
      new Request('http://localhost/api/metacognitive-reflection', { method: 'GET' }),
    )
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.reflections).toEqual([])
  })

  it('POST submit_reflection: thiếu field bắt buộc trả 400', async () => {
    authOk()
    const res = await handler(
      new Request('http://localhost/api/metacognitive-reflection?action=submit_reflection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Thiếu nội dung' }),
      }),
    )
    expect(res.status).toBe(400)
  })

  it('POST submit_reflection: thành công lưu vào state và GET lại thấy', async () => {
    authOk()
    const res = await handler(
      new Request('http://localhost/api/metacognitive-reflection?action=submit_reflection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Hôm nay học được gì',
          domain: 'learning',
          reflectionPrompt: 'Điều gì khó nhất hôm nay?',
          userReflection: 'Tôi thấy thì hoàn thành khó phân biệt với quá khứ đơn.',
        }),
      }),
    )
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.success).toBe(true)
    expect(data.reflection).toBeDefined()

    const listRes = await handler(
      new Request('http://localhost/api/metacognitive-reflection', { method: 'GET' }),
    )
    const listData = await listRes.json()
    expect(listData.reflections.length).toBe(1)
  })

  it('POST submit_reflection: không truyền domain vẫn dùng mặc định learning', async () => {
    authOk()
    const res = await handler(
      new Request('http://localhost/api/metacognitive-reflection?action=submit_reflection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reflectionPrompt: 'Câu hỏi',
          userReflection: 'Trả lời',
        }),
      }),
    )
    expect(res.status).toBe(200)
  })

  it('Luật số 1: bản ghi CŨ còn số giả MAI/Growth Mindset — GET không trả số đó, CSDL giữ nguyên', async () => {
    authOk()
    const legacy = {
      id: 'refl-old',
      personId: USER,
      title: 'Bản ghi trước changelog 0539',
      domain: 'learning',
      reflectionPrompt: 'Câu hỏi',
      userReflection: 'Bài viết cũ',
      ahaMoments: [],
      identifiedBiases: [
        {
          biasType: 'none',
          biasName: 'Tư duy trung dung & Cởi mở',
          explanation: 'Không phát hiện thiên kiến nhận thức nổi cộm.',
          antidotePrompt: 'Tiếp tục.',
          severity: 'low',
        },
      ],
      metacognitiveIndex: 87,
      growthMindsetScore: 90,
      socraticFollowUps: [],
      createdAt: '2026-10-01T00:00:00.000Z',
    }
    featureStore.set(USER + '|metacognitive_reflection', [legacy])

    for (const url of [
      'http://localhost/api/metacognitive-reflection',
      'http://localhost/api/metacognitive-reflection?action=summary',
    ]) {
      const res = await handler(new Request(url, { method: 'GET' }))
      const raw = await res.text()
      expect(raw).not.toMatch(/metacognitiveIndex|growthMindsetScore|AwarenessIndex|mindsetTrend/)
      expect(JSON.parse(raw).reflections[0].identifiedBiases).toEqual([])
    }

    // Gửi bài mới: bản ghi cũ trong CSDL vẫn còn nguyên (không xoá dữ liệu thật), bản mới không có số.
    const post = await handler(
      new Request('http://localhost/api/metacognitive-reflection?action=submit_reflection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reflectionPrompt: 'Câu hỏi', userReflection: 'Tôi sợ sai.' }),
      }),
    )
    const posted = await post.json()
    expect(posted.reflection.identifiedBiases[0].triggerPhrases).toEqual(['sợ sai'])
    expect(JSON.stringify(posted)).not.toMatch(/metacognitiveIndex|growthMindsetScore/)
    const stored = featureStore.get(USER + '|metacognitive_reflection') as Array<
      Record<string, unknown>
    >
    expect(stored).toHaveLength(2)
    expect(stored[1]).toEqual(legacy)
    expect(stored[0]).not.toHaveProperty('metacognitiveIndex')
  })

  it('POST submit_reflection: domain lạ hoặc bài chỉ có khoảng trắng → 400', async () => {
    authOk()
    for (const body of [
      { reflectionPrompt: 'Câu hỏi', userReflection: 'Trả lời', domain: 'hack' },
      { reflectionPrompt: 'Câu hỏi', userReflection: '    ' },
    ]) {
      const res = await handler(
        new Request('http://localhost/api/metacognitive-reflection?action=submit_reflection', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }),
      )
      expect(res.status).toBe(400)
    }
  })

  it('POST action không xác định trả 400', async () => {
    authOk()
    const res = await handler(
      new Request('http://localhost/api/metacognitive-reflection?action=unknown_action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      }),
    )
    expect(res.status).toBe(400)
  })

  it('POST ném lỗi KHÔNG PHẢI Error (nhánh else của err instanceof Error) trả 500', async () => {
    authOk()
    // req.json() ném một GIÁ TRỊ không phải Error để phủ nhánh String(err) — JSON.parse thật
    // luôn ném SyntaxError (là Error) nên nhánh này không đạt được bằng body hỏng thông thường.
    const fakeReq = {
      method: 'POST',
      url: 'http://localhost/api/metacognitive-reflection?action=submit_reflection',
      json: () => Promise.reject('lỗi dạng chuỗi không phải Error'),
    } as unknown as Request
    const res = await handler(fakeReq)
    expect(res.status).toBe(500)
    const data = await res.json()
    expect(data.details).toBe('lỗi dạng chuỗi không phải Error')
  })

  it('POST body JSON hỏng trả 500 (nhánh catch)', async () => {
    authOk()
    const res = await handler(
      new Request('http://localhost/api/metacognitive-reflection?action=submit_reflection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{invalid-json',
      }),
    )
    expect(res.status).toBe(500)
    const data = await res.json()
    expect(data.error).toBe('Failed to process request')
  })

  it('method không được hỗ trợ trả 405', async () => {
    authOk()
    const res = await handler(
      new Request('http://localhost/api/metacognitive-reflection', { method: 'DELETE' }),
    )
    expect(res.status).toBe(405)
  })
})
