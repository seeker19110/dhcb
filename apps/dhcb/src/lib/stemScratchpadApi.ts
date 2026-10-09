import { getAuthHeader } from '@core/authHeader'
// apps/dhcb/src/lib/stemScratchpadApi.ts — Client API cho bảng nháp STEM.
// Từ changelog 0551: đề lấy từ NGÂN HÀNG ĐỀ thật (`get_questions`), mở phiên bằng `questionId`,
// nộp đáp số qua `submit_solution`. Dữ liệu server trả về được validate bằng Zod trước khi dùng.
import { z } from 'zod'
import {
  StemBankQuestionPublicSchema,
  StemMicroHintSchema,
  StemProblemStateSchema,
  SubmitSolutionResultSchema,
  type ScratchpadStep,
  type ScratchpadStepValidation,
  type StemBankQuestionPublic,
  type StemMicroHint,
  type StemProblemState,
  type StemSubjectType,
  type SubmitSolutionResult,
} from '@dhcb/core-contracts/stemScratchpad'

const QuestionsResponseSchema = z.object({
  questions: z.array(StemBankQuestionPublicSchema),
  total: z.number().int().min(0),
})

const ProblemResponseSchema = z.object({ problem: StemProblemStateSchema })

const HintResponseSchema = z.object({
  hint: StemMicroHintSchema,
  hintsUsed: z.number().int().min(0),
})

/** Số câu tối đa tải về một lượt cho một môn — đủ để bấm "Đề khác" nhiều lần. */
const SO_CAU_MOI_LUOT = 200

function postJson(action: string, body: unknown): Promise<Response> {
  return fetch(`/api/stem-scratchpad?action=${action}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify(body),
  })
}

/** Tải các câu của ngân hàng đề cho một môn (không có đáp án — server không bao giờ gửi). */
export async function fetchStemQuestionsApi(
  subject: StemSubjectType,
): Promise<StemBankQuestionPublic[]> {
  const res = await fetch(
    `/api/stem-scratchpad?action=get_questions&subject=${subject}&limit=${SO_CAU_MOI_LUOT}`,
    { headers: { ...getAuthHeader() } },
  )
  if (!res.ok) {
    throw new Error(`Lỗi tải ngân hàng đề STEM: ${res.status}`)
  }
  return QuestionsResponseSchema.parse(await res.json()).questions
}

/** Mở một phiên giải câu `questionId` của ngân hàng đề. */
export async function createStemProblemFromBankApi(questionId: string): Promise<StemProblemState> {
  const res = await postJson('create_problem', { questionId })
  if (!res.ok) {
    throw new Error(`Lỗi tạo bài tập STEM: ${res.status}`)
  }
  return ProblemResponseSchema.parse(await res.json()).problem
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
  const res = await postJson('validate_step', params)

  if (!res.ok) {
    throw new Error(`Lỗi kiểm tra bước giải: ${res.status}`)
  }

  const data = await res.json()
  return data
}

export async function getStemHintApi(
  problemId: string,
): Promise<{ hint: StemMicroHint; hintsUsed: number }> {
  const res = await postJson('get_hint', { problemId })

  if (!res.ok) {
    throw new Error(`Lỗi lấy gợi ý: ${res.status}`)
  }

  return HintResponseSchema.parse(await res.json())
}

/** Nộp đáp số cuối. Server chấm theo đáp án của bài học; lời giải chỉ có khi đã đúng. */
export async function submitStemSolutionApi(
  problemId: string,
  finalAnswer: string,
): Promise<SubmitSolutionResult> {
  const res = await postJson('submit_solution', { problemId, finalAnswer })
  if (!res.ok) {
    throw new Error(`Lỗi nộp lời giải: ${res.status}`)
  }
  return SubmitSolutionResultSchema.parse(await res.json())
}
