// Test HÌNH DẠNG bộ ca `eval:v2:permissions` — không chạm CSDL (ca chạy thật trong CI job
// `sql-prepare`). Bản cũ của file này gọi `resolveAuthority` với `pg` giả trả sẵn đáp án — tức là
// chỉ kiểm được rằng hàm trả lại đúng thứ mock đưa vào (changelog 0625).
import { describe, expect, it } from 'vitest'
import { AuthorityLevelSchema } from '@dhcb/core-contracts/personalPolicy'
import { PERMISSION_CASES } from './eval-v2-permissions-cases'

/** Sàn số ca — bộ ca chỉ được lớn lên; bớt ca phải sửa sàn này có chủ đích trong PR. */
const MIN_CASES = 20

describe('bộ ca eval:v2:permissions', () => {
  it(`có ít nhất ${MIN_CASES} ca, id duy nhất, tiền tố perm-, có tiêu đề`, () => {
    expect(PERMISSION_CASES.length).toBeGreaterThanOrEqual(MIN_CASES)
    const ids = PERMISSION_CASES.map((c) => c.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const c of PERMISSION_CASES) {
      expect(c.id.startsWith('perm-')).toBe(true)
      expect(c.title.trim().length).toBeGreaterThan(0)
    }
  })

  it('phủ ĐỦ mọi mức thẩm quyền trong contract — thêm mức mới mà quên ca thì đỏ', () => {
    const ids = new Set(PERMISSION_CASES.map((c) => c.id))
    for (const level of AuthorityLevelSchema.options) {
      expect(ids.has(`perm-level-${level.toLowerCase()}`)).toBe(true)
    }
  })

  it.each(['perm-cross-automate', 'perm-cross-deny', 'perm-revoke-other', 'perm-concurrent'])(
    'giữ ca bất biến cốt lõi %s',
    (id) => {
      expect(PERMISSION_CASES.some((c) => c.id === id)).toBe(true)
    },
  )
})
