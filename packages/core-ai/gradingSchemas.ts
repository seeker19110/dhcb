// packages/core-ai/gradingSchemas.ts — JSON Schema cho các lượt CHẤM ĐIỂM/NHẬN XÉT (structured
// outputs của Claude, `output_config.format`).
//
// VÌ SAO: prompt chấm bài đã dặn "chỉ trả JSON" nhưng model vẫn có thể thêm chữ, thiếu khoá
// hoặc trả điểm dạng chuỗi → giao diện báo "AI trả về định dạng không đúng" và học viên mất
// lượt. Với structured outputs, API GIẢI MÃ CÓ RÀNG BUỘC theo schema: câu trả lời luôn là
// JSON hợp lệ, đủ khoá, đúng kiểu.
//
// AN TOÀN: client chỉ gửi TÊN schema (danh sách cho phép bên dưới), KHÔNG BAO GIỜ gửi schema
// thô — schema lạ có thể đòi biên dịch tốn kém hoặc gây 400 cho mọi lượt.
//
// Mỗi schema phải khớp ĐÚNG khuôn JSON mà prompt tương ứng ở `apps/dhcb/src/prompts/` mô tả
// và kiểu dữ liệu giao diện đang đọc (test `apps/dhcb/src/prompts/gradingSchemas.contract.test.ts` canh). Giới hạn của API:
// mọi object phải `additionalProperties: false`; KHÔNG hỗ trợ minimum/maximum/minLength… nên
// thang điểm ghi ở `description` và giao diện vẫn tự kiểm số (lớp phòng thủ thứ hai, cũng là
// lớp duy nhất khi rơi xuống Groq/Gemini dự phòng — hai bên đó không bị ràng buộc schema).
import { arr, num, obj, str, type JsonSchema } from './jsonSchema.js'

// Kiểu + trình dựng dùng chung (Action Canvas cũng dùng) — xem jsonSchema.ts.
export type { JsonSchema } from './jsonSchema.js'

export const GRADING_SCHEMA_NAMES = [
  'writing_eval',
  'speaking_eval',
  'chat_eval',
  'challenge_feedback',
  'interview_feedback',
] as const

export type GradingSchemaName = (typeof GRADING_SCHEMA_NAMES)[number]

export function isGradingSchemaName(v: unknown): v is GradingSchemaName {
  return typeof v === 'string' && (GRADING_SCHEMA_NAMES as readonly string[]).includes(v)
}

const BAND = 'Band 0–9 (bước 0.5).'
const OVERALL = 'Trung bình các tiêu chí, làm tròn tới 0.5.'

// Lỗi kiểu Viết/Nói/Chat: { original, corrected, explanation }.
const ERROR_ITEM = obj({
  original: str('Trích nguyên văn đoạn học viên viết/nói sai.'),
  corrected: str('Cách viết/nói đúng.'),
  explanation: str('Giải thích ngắn bằng tiếng mẹ đẻ của học viên.'),
})

const ERRORS = arr(ERROR_ITEM, 'Các lỗi đáng sửa; mảng rỗng nếu không có lỗi.')
const STRENGTHS = arr(str(), 'Điểm mạnh của học viên.')
const SUGGESTIONS = arr(str(), 'Gợi ý để cải thiện.')
const ENCOURAGEMENT = str('Một câu động viên bằng tiếng mẹ đẻ của học viên.')

const SCHEMAS: Record<GradingSchemaName, JsonSchema> = {
  // writingSystemPrompt — Writing.tsx (FeedbackData)
  writing_eval: obj({
    scores: obj({
      task_response: num(BAND),
      coherence: num(BAND),
      lexical: num(BAND),
      grammar: num(BAND),
      overall: num(OVERALL),
    }),
    errors: ERRORS,
    suggestions: SUGGESTIONS,
    sample: str('Một đoạn văn mẫu ngắn cải thiện ý của học viên.'),
    encouragement: ENCOURAGEMENT,
  }),
  // speakingFullEvaluationPrompt — Speaking.tsx, role-play (EvaluationResult có pronunciation)
  speaking_eval: obj({
    scores: obj({
      fluency: num(BAND),
      lexical: num(BAND),
      grammar: num(BAND),
      pronunciation: num(BAND),
      overall: num(OVERALL),
    }),
    errors: ERRORS,
    strengths: STRENGTHS,
    suggestions: SUGGESTIONS,
    encouragement: ENCOURAGEMENT,
  }),
  // chatFullEvaluationPrompt — Chat.tsx (EvaluationResult KHÔNG có pronunciation)
  chat_eval: obj({
    scores: obj({
      fluency: num(BAND),
      lexical: num(BAND),
      grammar: num(BAND),
      overall: num(OVERALL),
    }),
    errors: ERRORS,
    strengths: STRENGTHS,
    suggestions: SUGGESTIONS,
    encouragement: ENCOURAGEMENT,
  }),
  // challengeFeedbackSystemPrompt — Challenge.tsx (ChallengeFeedback)
  challenge_feedback: obj({
    praise: str('Đúng một lời khen cụ thể bám vào nội dung học viên vừa nói.'),
    corrections: arr(
      obj({
        original: str('Trích cách nói của học viên.'),
        better: str('Cách nói tự nhiên hơn bằng ngôn ngữ đích.'),
        explain: str('Giải thích ngắn bằng tiếng mẹ đẻ của học viên.'),
      }),
      'Tối đa 2–3 lỗi đáng sửa nhất; có thể rỗng nếu học viên nói gần như chuẩn.',
    ),
    upgrade: str('Một câu nâng cấp bằng ngôn ngữ đích để dùng thử ngày mai.'),
  }),
  // interviewAnswerFeedbackPrompt — ReverseInterview.tsx (InterviewFeedback)
  interview_feedback: obj({
    score: num('Mức độ ổn của câu trả lời, số nguyên 0–100.'),
    feedback: str('1–2 câu nhận xét ngắn.'),
    correction: str('Câu viết lại đúng hơn; chuỗi rỗng nếu câu trả lời đã ổn.'),
  }),
}

/** Schema của một loại bài chấm — trả về object MỚI để caller không sửa nhầm bản gốc. */
export function getGradingSchema(name: GradingSchemaName): JsonSchema {
  return structuredClone(SCHEMAS[name])
}
