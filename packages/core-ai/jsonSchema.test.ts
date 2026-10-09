import { describe, it, expect } from 'vitest'
import {
  arr,
  num,
  obj,
  schemaKeys,
  schemaViolations,
  str,
  strEnum,
  type JsonSchema,
} from './jsonSchema.js'

describe('trình dựng JSON Schema', () => {
  it('obj: mọi khoá bắt buộc, đóng additionalProperties', () => {
    expect(obj({ a: str(), b: num('điểm') })).toEqual({
      type: 'object',
      properties: { a: { type: 'string' }, b: { type: 'number', description: 'điểm' } },
      required: ['a', 'b'],
      additionalProperties: false,
    })
  })

  it('strEnum: chép mảng giá trị (sửa mảng gốc không đổi schema)', () => {
    const values = ['x', 'y']
    const node = strEnum(values)
    values.push('z')
    expect(node).toEqual({ type: 'string', enum: ['x', 'y'] })
  })

  it('không mô tả → không có khoá description (kể cả undefined)', () => {
    expect(Object.keys(arr(str()))).toEqual(['type', 'items'])
  })

  it('schemaKeys: gom khoá đệ quy qua object lồng trong array', () => {
    expect(schemaKeys(obj({ list: arr(obj({ inner: str() })) }))).toEqual(
      new Set(['list', 'inner']),
    )
  })
})

describe('schemaViolations — bắt đúng schema API sẽ từ chối', () => {
  it('schema dựng bằng trình dựng → hợp lệ', () => {
    expect(schemaViolations(obj({ a: arr(obj({ b: strEnum(['x']) })) }))).toEqual([])
  })

  it('object lồng thiếu additionalProperties:false → báo', () => {
    const bad = {
      type: 'object',
      properties: { a: str() },
      required: ['a'],
    } as unknown as JsonSchema
    expect(schemaViolations(obj({ wrap: bad }))).toContain(
      'object thiếu additionalProperties:false',
    )
  })

  it('required thiếu một khoá → báo', () => {
    const bad = { ...obj({ a: str(), b: str() }), required: ['a'] } as JsonSchema
    expect(schemaViolations(bad)).toEqual(['required lệch khoá: a,b'])
  })

  it.each(['maxItems', 'minLength', 'maximum', 'pattern'])(
    'từ khoá không hỗ trợ %s → báo',
    (kw) => {
      const bad = { ...str(), [kw]: 1 } as JsonSchema
      expect(schemaViolations(obj({ a: bad }))).toEqual([`từ khoá cấm: ${kw}`])
    },
  )
})
