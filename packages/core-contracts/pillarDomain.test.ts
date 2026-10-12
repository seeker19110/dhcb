// Test schema miền dùng chung (changelog 0628): trụ còn thật giữ nguyên, trụ đã xoá → `general`,
// giá trị lạ bị từ chối ở schema nhưng được thay bằng giá trị dự phòng ở đường ĐỌC dữ liệu cũ.
import { describe, expect, it } from 'vitest'
import {
  LEGACY_PILLAR_DOMAINS,
  PILLAR_DOMAINS,
  PILLAR_DOMAIN_LABELS,
  PillarDomainSchema,
  normalizePillarDomain,
} from './pillarDomain'

describe('PillarDomainSchema', () => {
  it('ba miền còn thật giữ nguyên', () => {
    for (const d of PILLAR_DOMAINS) expect(PillarDomainSchema.parse(d)).toBe(d)
  })

  it('trụ đã xoá (dữ liệu lưu cũ) → general, không từ chối', () => {
    for (const legacy of LEGACY_PILLAR_DOMAINS) {
      expect(PillarDomainSchema.parse(legacy)).toBe('general')
    }
  })

  it('giá trị lạ / sai kiểu → từ chối', () => {
    for (const bad of ['personal', 'LEARNING', '', 42, null, undefined]) {
      expect(PillarDomainSchema.safeParse(bad).success).toBe(false)
    }
  })

  it('mọi miền có nhãn tiếng Việt, không nhãn nào nhắc trụ đã xoá', () => {
    for (const d of PILLAR_DOMAINS) {
      expect(PILLAR_DOMAIN_LABELS[d].length).toBeGreaterThan(0)
      expect(PILLAR_DOMAIN_LABELS[d]).not.toMatch(/sự nghiệp|khởi nghiệp|đời sống/i)
    }
  })
})

describe('normalizePillarDomain', () => {
  it('hợp lệ giữ nguyên, trụ cũ → general', () => {
    expect(normalizePillarDomain('work')).toBe('work')
    expect(normalizePillarDomain('startup')).toBe('general')
  })

  it('giá trị lạ → giá trị dự phòng, không ném lỗi', () => {
    expect(normalizePillarDomain('hack')).toBe('general')
    expect(normalizePillarDomain(undefined, 'learning')).toBe('learning')
  })
})
