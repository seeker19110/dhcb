// Canh gác `nginx/en-vi.conf`: mọi khối `location` có `proxy_pass` về Express phải GHI ĐÈ đủ ba
// header IP bằng `$remote_addr`.
//
// Vì sao (lỗ hổng vá 2026-09-27): module `real_ip` của nginx chỉ đổi biến `$remote_addr`, không
// xoá header client tự gửi. Khối nào quên ghi đè thì ai gọi thẳng vào IP VPS (bỏ qua Cloudflare)
// chuyển được `CF-Connecting-IP`/`X-Real-IP` giả tới Express → mỗi request một IP mới → né sạch
// rate limit (dò mật khẩu, dò mã 2FA, dùng AI của khách vô hạn). Xem getClientIp() trong
// packages/core-http/http.ts.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const conf = readFileSync(join(process.cwd(), 'nginx', 'en-vi.conf'), 'utf8')

/** Tách các khối `location ... { ... }` (không lồng nhau trong file này). */
function proxyLocations(text: string): { name: string; body: string }[] {
  const blocks: { name: string; body: string }[] = []
  const re = /location\s+([^{]+)\{([^}]*)\}/g
  for (const m of text.matchAll(re)) {
    const body = m[2] ?? ''
    if (/^\s*proxy_pass\s/m.test(body)) blocks.push({ name: (m[1] ?? '').trim(), body })
  }
  return blocks
}

describe('nginx/en-vi.conf — header IP gửi về Express', () => {
  const blocks = proxyLocations(conf)

  it('tìm thấy các khối proxy (/api/, /, @express)', () => {
    expect(blocks.map((b) => b.name)).toEqual(expect.arrayContaining(['/api/', '/', '@express']))
  })

  it.each(['X-Real-IP', 'CF-Connecting-IP', 'X-Forwarded-For'])(
    'mọi khối proxy ghi đè %s bằng $remote_addr',
    (header) => {
      for (const block of blocks) {
        const line = new RegExp(`^\\s*proxy_set_header\\s+${header}\\s+\\$remote_addr;`, 'm')
        expect(line.test(block.body), `location ${block.name} thiếu ghi đè ${header}`).toBe(true)
      }
    },
  )

  it('không khối nào còn NỐI chuỗi X-Forwarded-For do client gửi', () => {
    for (const block of blocks) expect(block.body).not.toContain('$proxy_add_x_forwarded_for')
  })
})
