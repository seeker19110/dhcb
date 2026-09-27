// Cổng cho getClientIp — chặn hồi quy LỖ HỔNG THẬT đã xác minh trên production 2026-08-26:
// bản cũ đọc phần tử ĐẦU của X-Forwarded-For, tức giá trị client tự khai, nên đổi header mỗi
// request là né sạch rate limit (40 request vào route giới hạn 30/phút → 40 lần 200, 0 lần 429).
import { describe, it, expect } from 'vitest'
import { getClientIp } from './http.js'

const req = (headers: Record<string, string>) => new Request('https://x.test/', { headers })

describe('getClientIp', () => {
  it('ưu tiên X-Real-IP — nginx GHI ĐÈ bằng $remote_addr (đã qua real_ip của Cloudflare)', () => {
    expect(
      getClientIp(
        req({
          'cf-connecting-ip': '203.0.113.7',
          'x-real-ip': '198.51.100.20',
          'x-forwarded-for': '1.2.3.4, 198.51.100.20',
        }),
      ),
    ).toBe('198.51.100.20')
  })

  it('CHẶN HỒI QUY 2026-09-27: gọi thẳng IP VPS kèm CF-Connecting-IP giả không né được bộ đếm', () => {
    // Kẻ tấn công bỏ qua Cloudflare: nginx không tin header CF (ip nguồn không thuộc dải CF) nên
    // X-Real-IP = ip TCP thật của kẻ đó, nhưng header CF-Connecting-IP tự khai vẫn tới Express.
    const attackerIp = '192.0.2.66'
    const a = getClientIp(req({ 'cf-connecting-ip': '10.0.0.1', 'x-real-ip': attackerIp }))
    const b = getClientIp(req({ 'cf-connecting-ip': '10.9.9.9', 'x-real-ip': attackerIp }))
    expect(a).toBe(attackerIp)
    expect(b).toBe(attackerIp)
  })

  it('không có X-Real-IP (không có nginx phía trước) thì mới dùng CF-Connecting-IP', () => {
    expect(
      getClientIp(req({ 'cf-connecting-ip': '203.0.113.7', 'x-forwarded-for': '1.2.3.4' })),
    ).toBe('203.0.113.7')
  })

  it('CHẶN HỒI QUY: XFF lấy phần tử CUỐI, không phải phần client tự khai ở đầu', () => {
    // Nginx nối ip thật vào cuối: "<client khai>, <ip thật>".
    expect(getClientIp(req({ 'x-forwarded-for': '1.2.3.4, 198.51.100.5' }))).toBe('198.51.100.5')
    // Kẻ tấn công chèn nhiều IP giả — phần tử cuối vẫn là ip do proxy nối vào.
    expect(getClientIp(req({ 'x-forwarded-for': 'a, b, c, 198.51.100.5' }))).toBe('198.51.100.5')
  })

  it('XFF chỉ có một giá trị (không qua proxy nào nối thêm) → chính giá trị đó', () => {
    expect(getClientIp(req({ 'x-forwarded-for': '198.51.100.5' }))).toBe('198.51.100.5')
  })

  it('bỏ qua khoảng trắng thừa và phần tử rỗng', () => {
    expect(getClientIp(req({ 'x-forwarded-for': '1.2.3.4 ,  198.51.100.5 , ' }))).toBe(
      '198.51.100.5',
    )
    expect(getClientIp(req({ 'cf-connecting-ip': '  203.0.113.7  ' }))).toBe('203.0.113.7')
  })

  it('không có header nào → "unknown", KHÔNG ném lỗi (rate limit vẫn đếm được)', () => {
    expect(getClientIp(req({}))).toBe('unknown')
    expect(getClientIp(req({ 'x-forwarded-for': '' }))).toBe('unknown')
    expect(getClientIp(req({ 'x-forwarded-for': ' , , ' }))).toBe('unknown')
  })

  it('hai request giả IP khác nhau trong XFF vẫn ra CÙNG một IP ⇒ rate limit gộp đúng', () => {
    // Đây chính là ca lỗ hổng: trước đây hai request này cho hai khoá rate limit khác nhau.
    const a = getClientIp(req({ 'x-forwarded-for': '10.0.1.1, 198.51.100.5' }))
    const b = getClientIp(req({ 'x-forwarded-for': '10.0.9.9, 198.51.100.5' }))
    expect(a).toBe(b)
  })
})
