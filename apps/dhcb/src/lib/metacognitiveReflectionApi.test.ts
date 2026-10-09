// apps/dhcb/src/lib/metacognitiveReflectionApi.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  fetchDailySocraticPrompt,
  fetchMetacognitiveSummary,
  submitMetacognitiveReflectionApi,
} from './metacognitiveReflectionApi.js'

describe('metacognitiveReflectionApi', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('fetches daily socratic prompt', async () => {
    const mockPrompt = {
      id: 'socratic-learning-1',
      domain: 'learning',
      theme: 'Tự nhận thức',
      promptText: 'Câu hỏi mẫu',
      deepDivingQuestion: 'Câu hỏi sâu mẫu',
    }

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, prompt: mockPrompt }),
    } as unknown as Response)

    const res = await fetchDailySocraticPrompt('learning')
    expect(res.id).toBe('socratic-learning-1')
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/metacognitive-reflection?action=daily_prompt&domain=learning'),
      expect.any(Object),
    )
  })

  it('fetches metacognitive summary', async () => {
    const mockSummary = {
      totalReflectionsCount: 5,
      topDetectedBiases: ['analysis_paralysis'],
      recentAhaMoments: ['Hành động thực tế quan trọng hơn suy nghĩ quá mức.'],
    }

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, summary: mockSummary, reflections: [] }),
    } as unknown as Response)

    const res = await fetchMetacognitiveSummary()
    expect(res.summary.totalReflectionsCount).toBe(5)
    expect(res.summary.topDetectedBiases).toEqual(['analysis_paralysis'])
  })

  it('submits metacognitive reflection', async () => {
    const mockReflection = {
      id: 'refl-1',
      personId: 'user-1',
      domain: 'work',
      title: 'Tự đánh giá',
      reflectionPrompt: 'Prompt',
      userReflection: 'Reflection text',
      ahaMoments: [],
      identifiedBiases: [],
      socraticFollowUps: [],
      createdAt: '2026-08-20T06:00:00.000Z',
    }

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, reflection: mockReflection }),
    } as unknown as Response)

    const res = await submitMetacognitiveReflectionApi({
      domain: 'work',
      reflectionPrompt: 'Prompt',
      userReflection: 'Reflection text',
    })

    expect(res.id).toBe('refl-1')
    expect(res.socraticFollowUps).toEqual([])
  })
})
