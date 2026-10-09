// packages/core-ai/visionSolverService.ts — V2 Flagship Multimodal Vision STEM Solver Service.
import { AppError } from '@dhcb/core-errors/appError'
import { fetchWithTimeout } from '@dhcb/core-http/fetchTimeout'
import type {
  VisionSolveRequest,
  VisionSolveResponse,
  VisionSolvedStep,
} from '@dhcb/core-contracts/visionSolver'

const VISION_TIMEOUT_MS = 35_000

/**
 * Server chưa cấu hình `GEMINI_API_KEY` ⇒ KHÔNG giải được. Trước 0563 nhánh này trả một lời
 * giải bịa (nhánh "giả lập" với `confidence: 0.95`, "Đáp số đã được xác minh chính xác.") trong
 * khi handler đã trừ lượt — người học mất lượt để nhận kết quả giả. Nay ném lỗi 503 có tên để
 * handler hoàn lượt và báo thật.
 */
export class VisionSolverUnavailableError extends AppError {
  constructor() {
    super(
      'Tính năng giải bài qua ảnh tạm thời chưa sẵn sàng — thử lại sau.',
      503,
      'vision_unavailable',
    )
    this.name = 'VisionSolverUnavailableError'
  }
}

/**
 * AI trả về văn bản KHÔNG đúng khuôn JSON lời giải ⇒ không có lời giải đáng tin. Trước 0563 nhánh
 * này ghép 3 "bước giải" mẫu cố định (`f(x) = 0`, công thức nghiệm bậc hai) kèm "Đáp số đã được
 * xác minh chính xác." — cũng là kết quả bịa. Nay ném 502 để handler hoàn lượt.
 */
export class VisionSolverBadOutputError extends AppError {
  constructor() {
    super(
      'Không đọc được lời giải từ ảnh — hãy chụp rõ đề bài rồi thử lại.',
      502,
      'vision_bad_output',
    )
    this.name = 'VisionSolverBadOutputError'
  }
}

export interface GeminiVisionPart {
  text?: string
  inlineData?: {
    mimeType: string
    data: string
  }
}

export function cleanBase64(raw: string): { data: string; mimeType: string } {
  let mimeType = 'image/jpeg'
  let data = raw.trim()

  const match = data.match(/^data:(image\/[a-zA-Z0-9.+_-]+);base64,(.*)$/)
  if (match && match[1] && match[2]) {
    mimeType = match[1]
    data = match[2]
  }

  return { data, mimeType }
}

/**
 * Đọc lời giải dạng JSON từ văn bản AI trả về. Trả `null` khi văn bản không đúng khuôn — nơi gọi
 * phải coi đó là LỖI, không được bịa bước giải thay thế.
 */
export function parseVisionSolutionText(
  aiText: string,
): { problemText: string; steps: VisionSolvedStep[]; finalAnswer: string } | null {
  const jsonMatch = aiText.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
  const targetStr = jsonMatch && jsonMatch[1] ? jsonMatch[1] : aiText.trim()

  try {
    const parsed = JSON.parse(targetStr)
    if (
      parsed.problemText &&
      Array.isArray(parsed.steps) &&
      parsed.steps.length > 0 &&
      parsed.finalAnswer
    ) {
      return {
        problemText: String(parsed.problemText),
        steps: parsed.steps.map((s: { title?: string; detail?: string; formula?: string }) => ({
          title: String(s.title || 'Bước giải'),
          detail: String(s.detail || ''),
          formula: s.formula ? String(s.formula) : undefined,
        })),
        finalAnswer: String(parsed.finalAnswer),
      }
    }
  } catch {
    // Không phải JSON hợp lệ — rơi xuống trả null.
  }
  return null
}

/**
 * Giải bài tập trong ảnh bằng Gemini Vision. Thiếu key ⇒ `VisionSolverUnavailableError` (503);
 * AI trả sai khuôn ⇒ `VisionSolverBadOutputError` (502). Không có nhánh giả lập.
 */
export async function solveProblemWithVision(
  request: VisionSolveRequest,
  apiKey?: string,
  // [2026-08-24] Đổi từ 'gemini-2.0-flash' — Google đã gỡ hẳn model này (xác nhận qua lỗi 404
  // thật khi chạy npm run eval:tutor, xem aiConfig.ts GEMINI_CHAT_MODEL). CHƯA verify được bằng
  // ảnh thật với key thật ở đây — cần người có key chạy thử trước khi tin tưởng hoàn toàn.
  model = 'gemini-3.6-flash',
): Promise<VisionSolveResponse> {
  const effectiveKey = apiKey || process.env.GEMINI_API_KEY
  const { data, mimeType } = cleanBase64(request.imageBase64)

  if (!effectiveKey) {
    throw new VisionSolverUnavailableError()
  }

  const prompt = `Bạn là Chuyên gia Trợ lý Sư phạm STEM hàng đầu Việt Nam. 
Hãy đọc kỹ hình ảnh bài tập môn ${request.subjectId} (Cấp độ: ${request.gradeLevel || 'Chuẩn'}), nhận diện đề bài, giải chi tiết từng bước (step-by-step) và trả về ĐÚNG 1 ĐỊNH DẠNG JSON duy nhất:
\`\`\`json
{
  "problemText": "Nội dung đề bài trích xuất từ ảnh (kèm LaTeX nếu có)",
  "steps": [
    { "title": "Bước 1: ...", "detail": "Giải thích chi tiết...", "formula": "Công thức..." }
  ],
  "finalAnswer": "Kết luận đáp số cuối cùng"
}
\`\`\``

  const payload = {
    contents: [
      {
        role: 'user',
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: request.mimeType || mimeType,
              data,
            },
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 2048,
    },
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${effectiveKey}`

  const resp = await fetchWithTimeout(
    url,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
    VISION_TIMEOUT_MS,
  )

  if (!resp.ok) {
    const errorText = await resp.text().catch(() => '')
    throw new Error(`Gemini Vision API error (${resp.status}): ${errorText.slice(0, 200)}`)
  }

  const jsonResp = (await resp.json()) as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> }
    }>
    usageMetadata?: { totalTokenCount?: number }
  }

  const responseText = jsonResp.candidates?.[0]?.content?.parts?.[0]?.text || ''
  const parsed = parseVisionSolutionText(responseText)
  if (!parsed) throw new VisionSolverBadOutputError()

  return {
    problemText: parsed.problemText,
    steps: parsed.steps,
    finalAnswer: parsed.finalAnswer,
    // Không gán `confidence`: Gemini không trả độ tin cậy cho lời giải, số cố định là số giả.
    // `tokenUsed` chỉ có khi API báo thật (trước đây rơi về 350 bịa).
    tokenUsed: jsonResp.usageMetadata?.totalTokenCount,
  }
}
