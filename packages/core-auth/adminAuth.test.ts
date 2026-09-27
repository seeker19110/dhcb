import { describe, it, expect, afterEach, vi } from 'vitest'
import { isAdminUser } from './adminAuth.js'

afterEach(() => vi.unstubAllEnvs())

describe('isAdminUser', () => {
  it('ID trong ADMIN_USER_IDS được cấp quyền, ID khác bị từ chối', () => {
    vi.stubEnv('ADMIN_USER_IDS', 'admin-1,admin-2')
    expect(isAdminUser('admin-1')).toBe(true)
    expect(isAdminUser('admin-2')).toBe(true)
    expect(isAdminUser('student-1')).toBe(false)
  })

  it('so khớp nguyên ID, phân biệt hoa/thường và không chấp nhận tiền tố', () => {
    vi.stubEnv('ADMIN_USER_IDS', 'Admin-123')
    expect(isAdminUser('Admin-123')).toBe(true)
    expect(isAdminUser('admin-123')).toBe(false)
    expect(isAdminUser('Admin-12')).toBe(false)
    expect(isAdminUser(' Admin-123 ')).toBe(false)
  })

  it.each([undefined, '', ' , , '])(
    'danh sách %s luôn từ chối, dù ADMIN_EMAILS có giá trị',
    (ids) => {
      vi.stubEnv('ADMIN_USER_IDS', ids)
      vi.stubEnv('ADMIN_EMAILS', 'admin@example.com')
      expect(isAdminUser('admin-1')).toBe(false)
      expect(isAdminUser('admin@example.com')).toBe(false)
    },
  )

  it('ID null/undefined/rỗng không được cấp quyền', () => {
    vi.stubEnv('ADMIN_USER_IDS', 'admin-1')
    expect(isAdminUser(null)).toBe(false)
    expect(isAdminUser(undefined)).toBe(false)
    expect(isAdminUser('')).toBe(false)
  })

  it('bỏ khoảng trắng ở cấu hình và bỏ mục rỗng', () => {
    vi.stubEnv('ADMIN_USER_IDS', ' admin-1 , , admin-2 ')
    expect(isAdminUser('admin-2')).toBe(true)
  })

  it('thu hồi quyền ngay khi ID bị gỡ khỏi danh sách', () => {
    vi.stubEnv('ADMIN_USER_IDS', 'admin-1')
    expect(isAdminUser('admin-1')).toBe(true)
    vi.stubEnv('ADMIN_USER_IDS', 'admin-2')
    expect(isAdminUser('admin-1')).toBe(false)
  })
})
