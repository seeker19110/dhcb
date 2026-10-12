import { describe, expect, it } from 'vitest'
import {
  REGISTERED_TOOLS,
  getToolManifest,
  listToolManifests,
  validateToolInput,
} from './toolRegistry.js'

describe('toolRegistry', () => {
  it('trả về manifest khi tool có trong registry', () => {
    const tool = getToolManifest('learning.update_goal')
    expect(tool.id).toBe('learning.update_goal')
    expect(tool.sideEffect).toBe('internal')
    expect(tool.requiredPermissions).toContain('learning.write')
    expect(tool.idempotent).toBe(true)
  })

  it('ném NotFoundError khi tool không tồn tại', () => {
    expect(() => getToolManifest('khong.ton.tai')).toThrow(
      "Tool 'khong.ton.tai' không tồn tại trong registry",
    )
  })

  it('liệt kê đủ toàn bộ tool đã đăng ký', () => {
    const list = listToolManifests()
    expect(list.length).toBe(Object.keys(REGISTERED_TOOLS).length)
    expect(list.map((t) => t.id).sort()).toEqual([
      'dictionary.lookup',
      'learning.update_goal',
      'memory.create_record',
      'memory.invalidate_record',
      'memory.supersede_record',
      'profile.update_fact',
    ])
  })

  it('GĐ2b: thay/vô hiệu ký ức là việc ghi và cần quyền ghi ký ức', () => {
    for (const id of ['memory.supersede_record', 'memory.invalidate_record'] as const) {
      const tool = getToolManifest(id)
      expect(tool.sideEffect).not.toBe('none')
      expect(tool.requiredPermissions).toEqual(['memory.write'])
    }
    // Thay tạo bản ghi MỚI mỗi lần → không idempotent; vô hiệu hai lần cho cùng kết quả.
    expect(getToolManifest('memory.supersede_record').idempotent).toBe(false)
    expect(getToolManifest('memory.invalidate_record').idempotent).toBe(true)
  })

  it('tool chỉ đọc (dictionary.lookup) không có side effect và không đòi quyền', () => {
    const tool = getToolManifest('dictionary.lookup')
    expect(tool.sideEffect).toBe('none')
    expect(tool.requiredPermissions).toEqual([])
    expect(tool.auditPolicy.logLevel).toBe('minimal')
  })

  it('tool ghi bộ nhớ không idempotent (được phép tạo nhiều bản ghi)', () => {
    expect(getToolManifest('memory.create_record').idempotent).toBe(false)
  })

  it('validateToolInput chấp nhận object (kể cả rỗng và mảng)', () => {
    const tool = getToolManifest('profile.update_fact')
    expect(() => validateToolInput(tool, {})).not.toThrow()
    expect(() => validateToolInput(tool, { key: 'name', value: 'An' })).not.toThrow()
    expect(() => validateToolInput(tool, [])).not.toThrow()
  })

  it('validateToolInput từ chối null và giá trị không phải object', () => {
    const tool = getToolManifest('profile.update_fact')
    const msg = "Input của tool 'profile.update_fact' phải là một object"
    expect(() => validateToolInput(tool, null)).toThrow(msg)
    expect(() => validateToolInput(tool, undefined)).toThrow(msg)
    expect(() => validateToolInput(tool, 'chuỗi')).toThrow(msg)
    expect(() => validateToolInput(tool, 42)).toThrow(msg)
  })
})
