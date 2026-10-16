// finalAnswerChecks.test.ts — bốn phép kiểm tất định cho câu trả lời cuối của Companion (GĐ3).
import { describe, it, expect } from 'vitest'
import type { ProposedAction } from '@dhcb/core-contracts/proposedAction'
import { runFinalAnswerChecks, NOTHING_SAVED_NOTE, PENDING_SAVE_NOTE } from './finalAnswerChecks.js'

function action(status: ProposedAction['status']): ProposedAction {
  return { status } as ProposedAction
}

const VI = 'Hôm nay mình nên ôn gì?'

describe('runFinalAnswerChecks', () => {
  it.each([
    '<du_<tool_use>lieu_a>',
    '<tool_<tool_use>use>',
    '<11111111-1111-4111-8111-111111111111/invoke>',
  ])('không để phép xóa ghép thành markup nội bộ mới: %s', (reply) => {
    const result = runFinalAnswerChecks({ reply, userMessage: VI, proposedActions: [] })
    expect(result.text).toBe('')
    expect(
      runFinalAnswerChecks({ reply: result.text, userMessage: VI, proposedActions: [] }).text,
    ).toBe(result.text)
  })

  it('câu trả lời sạch ⇒ giữ nguyên, không có lỗi', () => {
    const r = runFinalAnswerChecks({
      reply: 'Bạn có 3 thẻ cần ôn hôm nay.',
      userMessage: VI,
      proposedActions: [],
    })
    expect(r).toEqual({ text: 'Bạn có 3 thẻ cần ôn hôm nay.', issues: [] })
  })

  it('gỡ thẻ bọc dữ liệu và thẻ gọi công cụ bị chép lại', () => {
    const r = runFinalAnswerChecks({
      reply:
        'Theo <du_lieu_ab12cd34 nguon="x">ghi chú</du_lieu_ab12cd34> thì <tool_use>abc</tool_use> ổn.',
      userMessage: VI,
      proposedActions: [],
    })
    expect(r.text).toBe('Theo ghi chú thì abc ổn.')
    expect(r.issues).toEqual(['markup'])
  })

  it('xoá uuid nội bộ', () => {
    const r = runFinalAnswerChecks({
      reply: 'Ghi chú 11111111-1111-4111-8111-111111111111 nói về buổi họp.',
      userMessage: VI,
      proposedActions: [],
    })
    expect(r.text).toBe('Ghi chú nói về buổi họp.')
    expect(r.issues).toEqual(['internal_id'])
  })

  it('"mình đã lưu" mà không có gì committed, không có đề xuất ⇒ nối câu đính chính', () => {
    const r = runFinalAnswerChecks({
      reply: 'Mình đã lưu lại lịch thi của bạn.',
      userMessage: VI,
      proposedActions: [],
    })
    expect(r.text.endsWith(NOTHING_SAVED_NOTE)).toBe(true)
    expect(r.issues).toEqual(['false_save_claim'])
  })

  it('"đã ghi nhớ" khi chỉ có đề xuất pending ⇒ đính chính "đang chờ Xác nhận"', () => {
    const r = runFinalAnswerChecks({
      reply: 'Tôi đã ghi nhớ điều đó.',
      userMessage: VI,
      proposedActions: [action('pending')],
    })
    expect(r.text.endsWith(PENDING_SAVE_NOTE)).toBe(true)
  })

  it('có hành động committed thật ⇒ KHÔNG đính chính', () => {
    const r = runFinalAnswerChecks({
      reply: 'Mình đã cập nhật mục tiêu cho bạn.',
      userMessage: VI,
      proposedActions: [action('committed')],
    })
    expect(r.issues).toEqual([])
  })

  it('"lưu ý" không bị coi là khẳng định đã lưu', () => {
    const r = runFinalAnswerChecks({
      reply: 'Mình đã lưu ý bạn rằng ngữ pháp này khó.',
      userMessage: VI,
      proposedActions: [],
    })
    expect(r.issues).toEqual([])
  })

  it('người dùng viết tiếng Việt mà câu trả lời dài không có chữ Việt ⇒ chỉ ghi nhận, không sửa', () => {
    const reply =
      'Here is a long answer written entirely in English without any Vietnamese characters at all.'
    const r = runFinalAnswerChecks({ reply, userMessage: VI, proposedActions: [] })
    expect(r.text).toBe(reply)
    expect(r.issues).toEqual(['language_mismatch'])
  })

  it('người dùng viết tiếng Anh ⇒ không kiểm ngôn ngữ', () => {
    const reply =
      'Here is a long answer written entirely in English without any Vietnamese characters at all.'
    const r = runFinalAnswerChecks({
      reply,
      userMessage: 'What should I review?',
      proposedActions: [],
    })
    expect(r.issues).toEqual([])
  })
})
