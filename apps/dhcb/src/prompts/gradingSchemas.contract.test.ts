// Hợp đồng PROMPT ↔ SCHEMA chấm điểm (structured outputs).
//
// Schema ở packages/core-ai/gradingSchemas.ts ép Claude trả JSON đúng khuôn. Nếu ai đó thêm/bớt
// một khoá trong prompt mà quên sửa schema (hoặc ngược lại), Claude sẽ bị ÉP theo schema cũ và
// lặng lẽ bỏ khoá mới — không ai thấy lỗi. Test này đối chiếu tập khoá JSON mà prompt mô tả với
// tập khoá trong schema, ở CẢ HAI chiều học A/B. Đặt ở apps/ (không phải packages/) vì gói
// không được import prompt của app.
import { describe, it, expect } from 'vitest'
import {
  GRADING_SCHEMA_NAMES,
  getGradingSchema,
  isGradingSchemaName,
  type GradingSchemaName,
  type JsonSchema,
} from '@dhcb/core-ai/gradingSchemas'
import {
  chatFullEvaluationPrompt,
  interviewAnswerFeedbackPrompt,
  speakingFullEvaluationPrompt,
  writingSystemPrompt,
} from './index'
import { challengeFeedbackSystemPrompt } from './challenge'
import { CHALLENGE_TOPICS } from '../data/challengeTopics'
import type { Direction } from '../types'

const PROMPT_OF: Record<GradingSchemaName, (dir: Direction) => string> = {
  writing_eval: (dir) => writingSystemPrompt(dir),
  speaking_eval: (dir) => speakingFullEvaluationPrompt(dir),
  chat_eval: (dir) => chatFullEvaluationPrompt(dir),
  challenge_feedback: (dir) =>
    challengeFeedbackSystemPrompt('I go to school.', CHALLENGE_TOPICS[0]!, dir),
  interview_feedback: (dir) => interviewAnswerFeedbackPrompt(dir),
}

// Khối JSON mẫu là đoạn từ dấu `{` đầu tiên SAU chữ "JSON" cuối cùng tới hết prompt.
function promptJsonKeys(prompt: string): Set<string> {
  const block = prompt.slice(prompt.indexOf('{', prompt.lastIndexOf('JSON')))
  return new Set([...block.matchAll(/"([a-z_]+)"\s*:/g)].map((m) => m[1]!))
}

function schemaKeys(node: JsonSchema, out = new Set<string>()): Set<string> {
  if (node.type === 'object') {
    for (const [k, child] of Object.entries(node.properties)) {
      out.add(k)
      schemaKeys(child, out)
    }
  } else if (node.type === 'array') {
    schemaKeys(node.items, out)
  }
  return out
}

// Duyệt mọi nút để kiểm luật của API structured outputs.
function allNodes(node: JsonSchema, out: JsonSchema[] = []): JsonSchema[] {
  out.push(node)
  if (node.type === 'object') Object.values(node.properties).forEach((c) => allNodes(c, out))
  if (node.type === 'array') allNodes(node.items, out)
  return out
}

// Từ khoá API KHÔNG hỗ trợ — gửi lên là 400 cho MỌI lượt chấm.
const UNSUPPORTED = ['minimum', 'maximum', 'multipleOf', 'minLength', 'maxLength', 'maxItems']

describe('schema chấm điểm ↔ prompt', () => {
  for (const name of GRADING_SCHEMA_NAMES) {
    for (const dir of ['A', 'B'] as const) {
      it(`${name} (chiều ${dir}): tập khoá JSON của prompt = tập khoá của schema`, () => {
        expect(schemaKeys(getGradingSchema(name))).toEqual(promptJsonKeys(PROMPT_OF[name](dir)))
      })
    }

    it(`${name}: mọi object additionalProperties:false + required đủ mọi khoá; không từ khoá cấm`, () => {
      for (const node of allNodes(getGradingSchema(name))) {
        for (const kw of UNSUPPORTED) expect(node).not.toHaveProperty(kw)
        if (node.type === 'object') {
          expect(node.additionalProperties).toBe(false)
          expect([...node.required].sort()).toEqual(Object.keys(node.properties).sort())
        }
      }
    })
  }

  it('điểm số là number (giao diện kiểm bằng hasNumberFields)', () => {
    const writing = getGradingSchema('writing_eval')
    const scores = writing.type === 'object' ? writing.properties.scores : undefined
    expect(scores?.type).toBe('object')
    if (scores?.type === 'object') {
      for (const s of Object.values(scores.properties)) expect(s.type).toBe('number')
    }
    const speaking = getGradingSchema('speaking_eval')
    expect(speaking.type === 'object' && 'scores' in speaking.properties).toBe(true)
  })

  it('chỉ nhận tên trong danh sách cho phép', () => {
    expect(isGradingSchemaName('writing_eval')).toBe(true)
    expect(isGradingSchemaName('__proto__')).toBe(false)
    expect(isGradingSchemaName({ type: 'object' })).toBe(false)
    expect(isGradingSchemaName(undefined)).toBe(false)
  })

  it('getGradingSchema trả bản sao — sửa bản trả về không đổi bản gốc', () => {
    const a = getGradingSchema('chat_eval')
    if (a.type === 'object') delete a.properties.scores
    const b = getGradingSchema('chat_eval')
    expect(b.type === 'object' && 'scores' in b.properties).toBe(true)
  })
})
