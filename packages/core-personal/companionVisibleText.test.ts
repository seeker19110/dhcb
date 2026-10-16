import { describe, expect, it } from 'vitest'
import { CompanionVisibleTextGuard, sanitizeCompanionVisibleText } from './companionVisibleText.js'
import {
  CompanionSurfaceSanitizer,
  SURFACE_FRAME_LIMIT,
  SURFACE_PENDING_LIMIT,
} from './companionSurfaceSanitizer.js'
import { QuestionFenceGuard } from './companionQuestionFence.js'
import { extractInteractiveQuestions } from '@dhcb/core-contracts/interactiveQuestion'

const ID = '11111111-1111-4111-8111-111111111111'

// Oracle riêng: không dùng regex production, chỉ biết canary/biên ASCII đã chọn trước.
function hasCanaryId(text: string): boolean {
  const word = (char: string | undefined) => char !== undefined && /[A-Za-z0-9_]/.test(char)
  let offset = text.indexOf(ID)
  while (offset !== -1) {
    if (!word(text[offset - 1]) && !word(text[offset + ID.length])) return true
    offset = text.indexOf(ID, offset + 1)
  }
  return false
}

function run(parts: string[], finish = true) {
  const emitted: string[] = []
  const guard = new CompanionVisibleTextGuard((text) => emitted.push(text))
  for (const part of parts) guard.push(part)
  if (finish) guard.end()
  return { text: emitted.join(''), emitted, guard }
}

const fixtures: Array<[string, string]> = [
  ['Xin chào bạn! Hello world.', 'Xin chào bạn! Hello world.'],
  [
    'Toán: x < y; code: <div class="ok">nội dung</div>',
    'Toán: x < y; code: <div class="ok">nội dung</div>',
  ],
  [
    '```json\n{"tool_use":"chỉ là tên trường"}\n```',
    '```json\n{"tool_use":"chỉ là tên trường"}\n```',
  ],
  ['<du_lieu_a>Ý kiến</du_lieu_a> <TOOL_USE x="y">text</TOOL_USE>', 'Ý kiến text'],
  [
    '<function_calls><invoke name="x"><parameter name="y">giữ lời văn</parameter></invoke></function_calls>',
    'giữ lời văn',
  ],
  ['<antml:invoke>text</antml:invoke>', 'text'],
  ['<du_<tool_use>lieu_a>', ''],
  ['<tool_<tool_use>use>', ''],
  [`<${ID}/invoke>`, ''],
  [`A ${ID} B`, 'A  B'],
  [`é${ID}é`, 'éé'],
  [`x${ID} ${ID}x ${ID}_ g${ID}`, `x${ID} ${ID}x ${ID}_ g${ID}`],
  [`${ID}<tool_use>x`, `${ID}x`],
  [`${ID}<tool_use>!`, '!'],
  ['<invokeX> </invoke > <tool_user> giữ', '<invokeX> </invoke >  giữ'],
  ['A\n```dhcb-questions\n{"private":1}\n```\nkhối thứ hai', 'A\n'],
  ['A\n``` \tdhcb-questions\t\r\n{}\r\n```', 'A\n'],
  ['A\n``<tool_use>`dhcb-questions\n{}\n```', 'A\n'],
  [
    'Inline: ```dhcb-questions là tên; không phải header.',
    'Inline: ```dhcb-questions là tên; không phải header.',
  ],
  ['```dhcb-questionsExtra\n{"normal":1}\n```', '```dhcb-questionsExtra\n{"normal":1}\n```'],
  ['```python\nprint("hello")\n```', '```python\nprint("hello")\n```'],
  ['```dh', '```dh'],
  ['<tool_', '<tool_'],
  ['<tool_use', ''],
  ['<invoke', '<invoke'],
  ['<parameter', '<parameter'],
  ['<invoke ', ''],
  ['<parameter ', ''],
  ['A\n```dhcb-questions', 'A\n```dhcb-questions'],
]

describe('CompanionVisibleTextGuard — cùng policy trên mọi partition', () => {
  it.each(fixtures)('mọi vị trí cắt và từng ký tự: %s', (input, expected) => {
    for (let cut = 0; cut <= input.length; cut++) {
      const result = run([input.slice(0, cut), input.slice(cut)])
      expect(result.text, `cut=${cut}`).toBe(expected)
      let prefix = ''
      for (const text of result.emitted) {
        prefix += text
        expect(hasCanaryId(prefix), `canary tại cut=${cut}`).toBe(false)
      }
    }
    expect(run([...input]).text).toBe(expected)
    expect(sanitizeCompanionVisibleText(input).text).toBe(expected)
    expect(sanitizeCompanionVisibleText(expected).text).toBe(expected)
  })

  it('EOF tại mọi vị trí: partial UUID là literal, UUID hoàn chỉnh bị loại', () => {
    for (let end = 1; end <= ID.length; end++) {
      const prefix = ID.slice(0, end)
      const expected = end === ID.length ? 'A ' : 'A ' + prefix
      expect(run(['A ', ...prefix]).text).toBe(expected)
      expect(run(['A ', prefix]).text).toBe(expected)
      const aborted = run(['A ', ...prefix], false)
      aborted.guard.abort()
      aborted.guard.end()
      expect(aborted.emitted.join('')).toBe('A ')
    }
  })

  it('kết thúc sớm ở mọi vị trí của input hợp thành không phát canary/thẻ đã hoàn chỉnh', () => {
    const input = '<tool_<tool_use>use>' + ID + '\n```dhcb-questions\n{"private":1}'
    for (let end = 0; end <= input.length; end++) {
      const prefix = input.slice(0, end)
      const whole = run([prefix])
      const chars = run([...prefix])
      expect(chars.text).toBe(whole.text)
      expect(hasCanaryId(chars.text)).toBe(false)
      expect(chars.text).not.toContain('<tool_use>')
      expect(chars.text).not.toContain('private')
      const aborted = run([...prefix], false)
      aborted.guard.abort()
      expect(hasCanaryId(aborted.emitted.join(''))).toBe(false)
    }
  })

  it('oracle canary phát hiện identity guard và kiểu phát UUID trước khi biết right boundary', () => {
    expect(hasCanaryId(`A ${ID}!`)).toBe(true)
    expect(hasCanaryId(`${ID}x`)).toBe(false)
    expect(hasCanaryId(ID)).toBe(true)
    expect(hasCanaryId(`x${ID}`)).toBe(false)
  })

  it('phát prefix benign trước EOF, không chờ cả câu trả lời', () => {
    const result = run(['Xin chào! ', '<tool_'], false)
    expect(result.emitted.join('')).toBe('Xin chào! ')
    result.guard.abort()
    result.guard.end()
    result.guard.push('use> bí mật')
    expect(result.emitted.join('')).toBe('Xin chào! ')
  })

  it('EOF/abort idempotent; fallback dùng instance mới, không nối prefix của primary', () => {
    const primary = run(['A ', '<tool_'], false)
    primary.guard.abort()
    primary.guard.end()
    expect(primary.emitted.join('')).toBe('A ')
    const fallback = run(['use> lời dự phòng'])
    fallback.guard.end()
    fallback.guard.push('late')
    expect(fallback.emitted.join('')).toBe('use> lời dự phòng')
    expect(fallback.guard.issues).toEqual([])
  })

  it('diagnostics chỉ finite enums, không giữ payload nhạy cảm', () => {
    const result = run([`<tool_use>${ID}\n\`\`\`dhcb-questions\n{"private":"CANARY"}`])
    expect(result.guard.issues).toEqual(['markup', 'internal_id', 'question_fence'])
    expect(JSON.stringify(result.guard.issues)).not.toContain('CANARY')
  })
})

describe('giới hạn phần mơ hồ, không giới hạn chunk benign', () => {
  it('thuộc tính tag rất dài được discard, prefix/suffix vẫn phát', () => {
    let output = ''
    const guard = new CompanionSurfaceSanitizer((text) => (output += text))
    guard.push('Bắt đầu <tool_use attr="')
    guard.push('x'.repeat(1024 * 1024))
    expect(output).toBe('Bắt đầu ')
    guard.push('">xong')
    guard.end()
    expect(output).toBe('Bắt đầu xong')
    expect(guard.diagnostics).toEqual({ markup: true, internalId: false, overflow: false })
  })

  it('retained state thực tế không vượt trần sau push/abort, kể cả header chưa đóng', () => {
    const surface = new CompanionSurfaceSanitizer(() => {})
    for (const char of '<tool_'.repeat(SURFACE_FRAME_LIMIT + 1)) {
      surface.push(char)
      const pending: unknown = Reflect.get(surface, 'pending')
      expect(typeof pending).toBe('string')
      expect(String(pending).length).toBeLessThanOrEqual(SURFACE_PENDING_LIMIT)
    }
    surface.abort()
    expect(Reflect.get(surface, 'pending')).toBe('')
    const question = new QuestionFenceGuard(() => {})
    for (const char of '```dhcb-questions' + ' '.repeat(SURFACE_PENDING_LIMIT + 1)) {
      question.push(char)
      expect(String(Reflect.get(question, 'pending')).length).toBeLessThanOrEqual(
        SURFACE_PENDING_LIMIT,
      )
    }
    question.abort()
    expect(Reflect.get(question, 'pending')).toBe('')
  })

  it('chunk bình thường lớn không bị drop theo độ dài chunk', () => {
    const input = 'Xin chào bạn! '.repeat(8192)
    expect(run([input]).text).toBe(input)
  })

  it('nesting vượt frame budget bỏ pending và phần sau, không flush raw khi EOF', () => {
    const input = '<tool_'.repeat(SURFACE_FRAME_LIMIT + 1)
    const result = run(['A ', ...input, 'use>không được phát'])
    expect(result.text).toBe('A ')
    expect(result.guard.issues).toContain('surface_overflow')
  })

  it('giới hạn ký tự chạm trước giới hạn frame, không nhả cả vùng đang giữ', () => {
    // Bảy cặp < + UUID cần 14 frame, nhưng dài 259 ký tự (>256).
    const result = run(['A (', ...('<' + ID).repeat(7), 'không phát'])
    expect(result.text).toBe('A (')
    expect(result.guard.issues).toContain('surface_overflow')
  })

  it('header whitespace vượt ngân sách fail closed, không giữ tới EOF', () => {
    const result = run(['A\n```dhcb-questions', ' '.repeat(SURFACE_PENDING_LIMIT + 1), 'x\nCANARY'])
    expect(result.text).toBe('A\n')
    expect(result.guard.issues).toContain('surface_overflow')
  })
})

describe('grammar question header chung parser/stream', () => {
  it.each(['\n', '\r', '\u2028', '\u2029'])('line start theo RegExp multiline: %j', (separator) => {
    const input = 'A' + separator + '```\tdhcb-questions \r\n{}\n```'
    const expected = extractInteractiveQuestions(input).text
    for (let cut = 0; cut <= input.length; cut++) {
      const result = run([input.slice(0, cut), input.slice(cut)])
      expect(result.text.trimEnd()).toBe(expected)
    }
  })

  it('CR sau candidate không hợp lệ có thể mở dòng reserved kế tiếp', () => {
    let output = ''
    const guard = new QuestionFenceGuard((text) => (output += text))
    for (const char of '```dhcb-questions\r```dhcb-questions\nCANARY') guard.push(char)
    guard.end()
    expect(output).toBe('```dhcb-questions\r')
  })
})
