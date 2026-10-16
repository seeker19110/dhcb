// packages/core-contracts/interactiveQuestion.ts — Hợp đồng dữ liệu cho "câu hỏi tương tác"
// mà Bạn Đồng Hành AI đặt ra cho người dùng.
//
// VÌ SAO CẦN: trước đây Companion hỏi khảo sát bằng CHỮ THUẦN (ví dụ "Bạn cảm thấy hạnh phúc
// nhất khi làm gì? (công việc, học tập, sáng tạo...)"), người dùng phải gõ tay câu trả lời —
// chậm, nhất là trên điện thoại, và dữ liệu thu về không chuẩn hoá được. Contract này cho phép
// LLM xuất THÊM một khối dữ liệu có cấu trúc bên cạnh lời văn, để giao diện dựng thành ô tick.
//
// NGUYÊN TẮC BẤT BIẾN: khối câu hỏi là PHẦN THÊM, không thay thế lời văn. Nếu LLM không xuất
// khối này, hoặc xuất sai định dạng, người dùng vẫn đọc được câu hỏi dạng chữ như cũ
// Khối reserved luôn được giấu, kể cả JSON hỏng; lời văn trước khối vẫn được giữ.

import { z } from 'zod'

export const INTERACTIVE_QUESTION_SCHEMA_VERSION = 1

// Nhãn khối được LLM bọc quanh JSON. Đặt tên riêng ("dhcb-questions") thay vì ```json để không
// đụng những khối JSON mà LLM xuất ra vì mục đích khác (ví dụ minh hoạ code cho môn Lập trình).
export const INTERACTIVE_QUESTION_FENCE = 'dhcb-questions'

// Một lựa chọn để tick. `id` dùng làm khoá React + khoá chống trùng; `label` là chữ hiển thị.
export const InteractiveOptionSchema = z
  .object({
    id: z.string().min(1).max(60),
    label: z.string().min(1).max(160),
  })
  .strict()

export type InteractiveOption = z.infer<typeof InteractiveOptionSchema>

export const InteractiveQuestionSchema = z
  .object({
    id: z.string().min(1).max(60),
    text: z.string().min(1).max(300),
    // true = chọn nhiều (checkbox) · false = chọn một (radio). Mặc định chọn một cho an toàn:
    // người dùng bấm 1 phát là xong, không phải bấm thêm nút gửi trong đầu.
    multi: z.boolean(),
    // Tối đa 8 lựa chọn: quá số này thì danh sách tick dài hơn cả gõ tay, phản tác dụng.
    options: z.array(InteractiveOptionSchema).min(2).max(8),
    // Cho phép người dùng tự viết đáp án ngoài danh sách (ô "Khác…"). Luôn nên bật với câu hỏi
    // mở về bản thân — danh sách do AI đoán không bao giờ phủ hết được con người thật.
    allowFreeText: z.boolean(),
  })
  .strict()

export type InteractiveQuestion = z.infer<typeof InteractiveQuestionSchema>

export const InteractiveQuestionSetSchema = z
  .object({
    schemaVersion: z.literal(INTERACTIVE_QUESTION_SCHEMA_VERSION),
    // Tối đa 5 câu/lượt — khớp luồng người mới "5 câu hỏi ~90 giây"
    // (docs/research/luong-nguoi-moi-ho-so-nang-luc-an-2026-08-23.md). Hỏi nhiều hơn trong một
    // lượt là bắt người dùng làm bài kiểm tra, trái tư thế ĐỒNG HÀNH.
    questions: z.array(InteractiveQuestionSchema).min(1).max(5),
  })
  .strict()

export type InteractiveQuestionSet = z.infer<typeof InteractiveQuestionSetSchema>

// Phần hướng dẫn nối vào system prompt của Companion. Tách hằng số ra đây (cạnh schema) để lời
// hướng dẫn và định dạng dữ liệu không bao giờ trôi lệch nhau.
export const INTERACTIVE_QUESTION_PROMPT_GUIDE =
  '\n\n🎯 CÂU HỎI TƯƠNG TÁC (tick chọn):\n' +
  'Khi bạn cần hỏi người dùng những câu có sẵn phương án (khảo sát bản thân, xác định mục tiêu, ' +
  'chọn lĩnh vực/trình độ/thời lượng học...), hãy viết câu hỏi bằng lời văn NHƯ BÌNH THƯỜNG, rồi ' +
  'nối THÊM vào CUỐI câu trả lời đúng một khối sau (không giải thích gì về khối này):\n' +
  '```' +
  INTERACTIVE_QUESTION_FENCE +
  '\n' +
  '{"schemaVersion":1,"questions":[{"id":"linh_vuc","text":"Bạn muốn khám phá lĩnh vực nào nhất?",' +
  '"multi":true,"options":[{"id":"ngon_ngu","label":"Học một ngôn ngữ mới"},' +
  '{"id":"cong_nghe","label":"Công nghệ, lập trình"}],"allowFreeText":true}]}\n' +
  '```\n' +
  'Quy tắc: tối đa 5 câu mỗi lượt, mỗi câu 2–8 lựa chọn ngắn gọn bằng tiếng Việt; `id` viết thường ' +
  'không dấu, không trùng nhau; đặt `multi` = true khi có thể chọn nhiều đáp án; đặt ' +
  '`allowFreeText` = true với mọi câu hỏi về con người/mong muốn của người dùng. ' +
  'KHÔNG dùng khối này cho câu hỏi mở hoàn toàn (ví dụ "Bạn cảm thấy thế nào?") — câu hỏi mở cứ ' +
  'để người dùng tự viết.'

// Một grammar chung cho parser và stream: đúng tên ở đầu dòng, LF/CRLF.
const HEADER_BODY = '[ \\t]*```[ \\t]*' + INTERACTIVE_QUESTION_FENCE + '[ \\t]*'
const HEADER_LINE = new RegExp('^' + HEADER_BODY + '\\r?$')
export function isInteractiveQuestionHeader(line: string): boolean {
  return HEADER_LINE.test(line)
}
const FENCE_PATTERN = new RegExp('^' + HEADER_BODY + '\\r?\\n([\\s\\S]*?)\\r?\\n?```[ \\t]*$', 'm')
const OPEN_FENCE_PATTERN = new RegExp('^' + HEADER_BODY + '\\r?\\n', 'm')

export interface ExtractedInteractiveQuestions {
  /** Lời văn hiển thị cho người dùng — đã gỡ khối JSON ra khỏi câu trả lời. */
  text: string
  /** Bộ câu hỏi hợp lệ, hoặc mảng rỗng nếu không có / dữ liệu hỏng. */
  questions: InteractiveQuestion[]
}

/**
 * Tách khối câu hỏi tương tác khỏi câu trả lời thô của LLM.
 *
 * Luôn "hỏng thì bỏ qua", không bao giờ ném lỗi: LLM là nguồn dữ liệu KHÔNG đáng tin, nên mọi
 * trường hợp thiếu khối giữ nguyên lời văn; JSON/schema hỏng chỉ bỏ bộ câu hỏi.
 * Riêng khi JSON sai schema, khối vẫn bị GỠ khỏi lời văn để người dùng không phải đọc JSON thô.
 */
export function extractInteractiveQuestions(reply: string): ExtractedInteractiveQuestions {
  const open = OPEN_FENCE_PATTERN.exec(reply)
  if (!open) return { text: reply, questions: [] }
  // Prompt yêu cầu khối đứng cuối. Giấu toàn bộ từ header đầu tiên, kể cả nhiều khối
  // hay JSON hỏng; không để parser cuối khác chính sách delta đã tới người dùng.
  const text = reply.slice(0, open.index).trimEnd()
  const match = FENCE_PATTERN.exec(reply.slice(open.index))
  if (!match || match.index !== 0) return { text, questions: [] }

  let raw: unknown
  try {
    raw = JSON.parse(match[1] ?? '')
  } catch {
    return { text, questions: [] }
  }

  const parsed = InteractiveQuestionSetSchema.safeParse(raw)
  if (!parsed.success) {
    return { text, questions: [] }
  }

  // Khử trùng `id` giữa các câu (và giữa các lựa chọn trong cùng câu): id trùng làm React dựng
  // nhầm phần tử và làm câu trả lời gửi về bị lẫn lộn. LLM trùng id thì bỏ nguyên bộ cho an toàn.
  const questionIds = new Set<string>()
  for (const question of parsed.data.questions) {
    if (questionIds.has(question.id)) return { text, questions: [] }
    questionIds.add(question.id)

    const optionIds = new Set<string>()
    for (const option of question.options) {
      if (optionIds.has(option.id)) return { text, questions: [] }
      optionIds.add(option.id)
    }
  }

  return { text, questions: parsed.data.questions }
}
