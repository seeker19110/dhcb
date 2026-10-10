import { describe, expect, it } from 'vitest'
import { SPEC_STAGE_DETAILS } from './stageDetails.js'
import { LAZY_STAGE_DETAIL_IDS, loadSpecStageDetail } from './stageDetailsLoader.js'

describe('stageDetailsLoader — đồng bộ với sổ đăng ký tĩnh', () => {
  it('có đúng các chặng như SPEC_STAGE_DETAILS (không thiếu, không thừa)', () => {
    expect([...LAZY_STAGE_DETAIL_IDS].sort()).toEqual(
      SPEC_STAGE_DETAILS.map((d) => d.stageId).sort(),
    )
  })

  it('mỗi chặng nạp lười ra ĐÚNG đối tượng của sổ tĩnh', async () => {
    for (const d of SPEC_STAGE_DETAILS) {
      expect(await loadSpecStageDetail(d.stageId)).toBe(d)
    }
  })

  it('chuẩn hoá mã (khoảng trắng, chữ hoa) giống getSpecStageDetail', async () => {
    expect((await loadSpecStageDetail('  WEB-S2 '))?.stageId).toBe('web-s2')
  })

  it('mã lạ / khoá kế thừa của Object → undefined, không ném lỗi', async () => {
    expect(await loadSpecStageDetail('web-s9')).toBeUndefined()
    expect(await loadSpecStageDetail('constructor')).toBeUndefined()
    expect(await loadSpecStageDetail('__proto__')).toBeUndefined()
  })
})
