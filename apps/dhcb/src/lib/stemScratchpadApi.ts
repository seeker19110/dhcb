import { getAuthHeader } from '@core/authHeader'
// apps/dhcb/src/lib/stemScratchpadApi.ts — Client API cho STEM Interactive Scratchpad V5.
import type {
  StemProblemState,
  ScratchpadStep,
  ScratchpadStepValidation,
  StemSubjectType,
} from '@dhcb/core-contracts/stemScratchpad'

export async function fetchSampleStemProblems(): Promise<
  Array<{
    id: string
    subject: StemSubjectType
    title: string
    problemStatement: string
    problemLatex?: string
  }>
> {
  const res = await fetch('/api/stem-scratchpad', {
    headers: {
      ...getAuthHeader(),
    },
  })

  if (!res.ok) {
    throw new Error(`Lỗi tải danh sách bài tập STEM: ${res.status}`)
  }

  const data = await res.json()
  return data.problems
}

export async function createStemProblemApi(params: {
  subject: StemSubjectType
  title: string
  problemStatement: string
  problemLatex?: string
}): Promise<StemProblemState> {
  const res = await fetch('/api/stem-scratchpad?action=create_problem', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify(params),
  })

  if (!res.ok) {
    throw new Error(`Lỗi tạo bài tập STEM: ${res.status}`)
  }

  const data = await res.json()
  return data.problem
}

export async function validateStemStepApi(params: {
  problemId?: string
  latexInput: string
  explanation?: string
}): Promise<{
  step: ScratchpadStep
  validation: ScratchpadStepValidation
  isSolved: boolean
  problem: StemProblemState
}> {
  const res = await fetch('/api/stem-scratchpad?action=validate_step', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify(params),
  })

  if (!res.ok) {
    throw new Error(`Lỗi kiểm tra bước giải: ${res.status}`)
  }

  const data = await res.json()
  return data
}

export async function getStemHintApi(
  problemId: string,
): Promise<{ hint: { hintText: string; suggestedFormula?: string }; hintsUsed: number }> {
  const res = await fetch('/api/stem-scratchpad?action=get_hint', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify({ problemId }),
  })

  if (!res.ok) {
    throw new Error(`Lỗi lấy gợi ý: ${res.status}`)
  }

  const data = await res.json()
  return data
}
