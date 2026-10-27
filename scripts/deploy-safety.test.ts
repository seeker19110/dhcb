// @vitest-environment node
// Canh hai chốt an toàn deploy (audit 2026-10-26):
// - AUD-CI-001: `npm ci` lỗi phải DỪNG deploy — không được rơi sang `npm install` (resolve lại
//   dependency khác lockfile đã qua CI).
// - AUD-SEC-002: SSH vào VPS phải xác minh host key (`fingerprint`); action để trống là bỏ qua
//   kiểm host key, giả mạo host trên đường mạng nhận được GITHUB_TOKEN và lệnh deploy.
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

/** Bỏ chú thích `#` (đủ cho các dòng lệnh của deploy.sh, không có `#` trong chuỗi). */
function codeLines(text: string): string[] {
  return text
    .split('\n')
    .map((line) => line.replace(/(^|\s)#.*$/, '').trim())
    .filter(Boolean)
}

describe('deploy.sh cài dependency đóng băng theo lockfile', () => {
  const lines = codeLines(readFileSync('scripts/deploy.sh', 'utf8'))

  it('có bước npm ci', () => {
    expect(lines.some((line) => /^npm ci\b/.test(line))).toBe(true)
  })

  it('không có nhánh dự phòng npm install', () => {
    expect(lines.filter((line) => /\bnpm (install|i)\b/.test(line))).toEqual([])
  })
})

describe('deploy.yml xác minh host key của VPS', () => {
  const workflow = readFileSync('.github/workflows/deploy.yml', 'utf8')

  it('ssh-action nhận fingerprint từ secret', () => {
    expect(workflow).toMatch(/^\s+fingerprint: \$\{\{ secrets\.VPS_SSH_FINGERPRINT \}\}$/m)
  })

  it('dừng trước khi SSH nếu chưa cấu hình fingerprint (không âm thầm bỏ qua kiểm host key)', () => {
    const guard = workflow.indexOf('VPS_SSH_FINGERPRINT chưa cấu hình')
    const ssh = workflow.indexOf('appleboy/ssh-action@')
    expect(guard).toBeGreaterThan(-1)
    expect(guard).toBeLessThan(ssh)
  })
})
