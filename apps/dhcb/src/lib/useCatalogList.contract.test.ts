// Hợp đồng server ↔ client cho hai danh mục thẻ Bạn Đồng Hành. `useCatalogList` kiểm dữ liệu bằng
// schema `.strict()` và hiện LỖI khi sai — nên nếu dữ liệu server lệch schema, thẻ đang chạy được
// sẽ chuyển sang báo lỗi trên production. Test này bắt chuyện đó ở CI. Đi qua JSON như dây thật.
import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { listShadowingPassages } from '@dhcb/core-ai/echoShadowingService'
import { listPredefinedScenarios } from '@dhcb/core-personal/scenarioHolodeckService'
import { ShadowingPassageSchema } from '@dhcb/core-contracts/echoShadowing'
import { HolodeckScenarioSchema } from '@dhcb/core-contracts/scenarioHolodeck'

const overWire = (value: unknown): unknown => JSON.parse(JSON.stringify(value))

describe('danh mục server khớp schema client của useCatalogList', () => {
  it('bài mẫu Nói đè theo mẫu (GET /api/echo-shadowing)', () => {
    const result = z.array(ShadowingPassageSchema).safeParse(overWire(listShadowingPassages()))
    expect(result.success, JSON.stringify(result.error?.issues.slice(0, 3))).toBe(true)
    expect(result.data?.length).toBeGreaterThan(0)
  })

  it('kịch bản Scenario Holodeck (GET /api/scenario-holodeck)', () => {
    const result = z.array(HolodeckScenarioSchema).safeParse(overWire(listPredefinedScenarios()))
    expect(result.success, JSON.stringify(result.error?.issues.slice(0, 3))).toBe(true)
    expect(result.data?.length).toBeGreaterThan(0)
  })
})
