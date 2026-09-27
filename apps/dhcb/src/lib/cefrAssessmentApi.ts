import { CefrAssessmentStart, CefrAssessmentGrade } from '@dhcb/core-contracts/cefrAssessment'

async function call(body: unknown): Promise<unknown> {
  const response = await fetch('/api/cefr-assessment', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data: unknown = await response.json()
  if (!response.ok)
    throw new Error(
      typeof data === 'object' && data && 'error' in data && typeof data.error === 'string'
        ? data.error
        : 'Chưa kết nối được máy chủ chấm thi',
    )
  return data
}
export async function startCefrAssessment(level: string, isA: boolean) {
  return CefrAssessmentStart.parse(await call({ action: 'start', level, isA }))
}
export async function submitCefrAssessment(attemptId: string, answers: string[]) {
  return CefrAssessmentGrade.parse(await call({ action: 'submit', attemptId, answers }))
}
