import { getAuthHeader } from '@core/authHeader'
// apps/dhcb/src/lib/metacognitiveReflectionApi.ts — Client API cho Metacognitive Reflection & Socratic Journaling.
import type {
  MetacognitiveReflection,
  SocraticDailyPrompt,
  MetacognitiveSummary,
} from '@dhcb/core-contracts/metacognitiveReflection'

export async function fetchDailySocraticPrompt(
  domain: 'learning' | 'career' | 'work' | 'startup' | 'life' = 'learning',
  contextAnchor?: string,
): Promise<SocraticDailyPrompt> {
  const q = new URLSearchParams({ action: 'daily_prompt', domain })
  if (contextAnchor) q.set('contextAnchor', contextAnchor)

  const res = await fetch(`/api/metacognitive-reflection?${q.toString()}`, {
    headers: {
      ...getAuthHeader(),
    },
  })

  if (!res.ok) {
    throw new Error(`Lỗi tải câu hỏi phản tỉnh: ${res.status}`)
  }

  const data = await res.json()
  return data.prompt
}

export async function fetchMetacognitiveSummary(): Promise<{
  summary: MetacognitiveSummary
  reflections: MetacognitiveReflection[]
}> {
  const res = await fetch('/api/metacognitive-reflection?action=summary', {
    headers: {
      ...getAuthHeader(),
    },
  })

  if (!res.ok) {
    throw new Error(`Lỗi tải tổng kết nhận thức: ${res.status}`)
  }

  const data = await res.json()
  return {
    summary: data.summary,
    reflections: data.reflections,
  }
}

export async function submitMetacognitiveReflectionApi(params: {
  title?: string
  domain: 'learning' | 'career' | 'work' | 'startup' | 'life'
  reflectionPrompt: string
  userReflection: string
}): Promise<MetacognitiveReflection> {
  const res = await fetch('/api/metacognitive-reflection?action=submit_reflection', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify(params),
  })

  if (!res.ok) {
    throw new Error(`Lỗi lưu nhật ký phản tỉnh: ${res.status}`)
  }

  const data = await res.json()
  return data.reflection
}
