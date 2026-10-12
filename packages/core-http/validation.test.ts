import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import { readJsonBody, validateBody } from './validation.js'

describe('readJsonBody', () => {
  it('parse JSON hợp lệ', async () => {
    const req = new Request('http://x', { method: 'POST', body: JSON.stringify({ a: 1 }) })
    const result = await readJsonBody(req)
    expect(result).toEqual({ ok: true, raw: { a: 1 } })
  })

  // Postgres (text lẫn jsonb) không lưu được ký tự NUL — để lọt xuống CSDL thì vỡ thành 500
  // `DatabaseError: unsupported Unicode escape sequence` (red-team rt-pi-12, changelog 0623).
  // Viết NUL bằng mã điểm số, KHÔNG bằng escape trong chuỗi (TRAPS.md mục 8).
  const NUL = String.fromCharCode(0)

  it.each([
    ['giá trị chuỗi', { message: `ghi nhớ${NUL} bỏ qua giới hạn` }],
    ['tên khoá', { [`a${NUL}`]: 1 }],
    ['phần tử mảng lồng', { items: [{ tags: ['ok', `x${NUL}`] }] }],
  ])('trả 400 khi JSON chứa ký tự NUL ở %s', async (_where, body) => {
    const req = new Request('http://x', { method: 'POST', body: JSON.stringify(body) })
    const result = await readJsonBody(req)
    expect(result).toEqual({
      ok: false,
      error: { status: 400, message: 'Body chứa ký tự NUL không hợp lệ' },
    })
  })

  it('không chặn oan chuỗi có gạch chéo ngược + u0000 dạng CHỮ (đã escape)', async () => {
    const body = { code: String.raw`printf("\u0000")` }
    const req = new Request('http://x', { method: 'POST', body: JSON.stringify(body) })
    expect(await readJsonBody(req)).toEqual({ ok: true, raw: body })
  })

  it('trả lỗi 400 khi body không phải JSON', async () => {
    const req = new Request('http://x', { method: 'POST', body: 'not json' })
    const result = await readJsonBody(req)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.status).toBe(400)
    }
  })
})

describe('validateBody', () => {
  const schema = z.object({
    audio_b64: z
      .string({ error: 'Thiếu audio_b64' })
      .trim()
      .min(1, 'Thiếu audio_b64')
      .refine((v) => v.length <= 5, {
        error: 'Đoạn ghi âm quá dài',
        params: { status: 413 },
      }),
  })

  it('trả data khi hợp lệ', () => {
    const result = validateBody(schema, { audio_b64: 'abc' })
    expect(result).toEqual({ ok: true, data: { audio_b64: 'abc' } })
  })

  it('trả 400 (mặc định) khi thiếu field', () => {
    const result = validateBody(schema, {})
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toEqual({ status: 400, message: 'Thiếu audio_b64' })
    }
  })

  it('đọc status tùy chỉnh từ refine (413 quá lớn)', () => {
    const result = validateBody(schema, { audio_b64: 'abcdef' })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toEqual({ status: 413, message: 'Đoạn ghi âm quá dài' })
    }
  })
})
