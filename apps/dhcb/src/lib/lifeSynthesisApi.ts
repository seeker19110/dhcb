import { getAuthHeader } from '@core/authHeader'
// apps/dhcb/src/lib/lifeSynthesisApi.ts — REST Client cho Cross-Domain Life Synthesis Engine V5.4.
import type { LifeSynthesisReport, LifeDomainType } from '@dhcb/core-contracts/lifeSynthesis'

export async function fetchLifeSynthesisReport(
  timeframe: 'daily' | 'weekly' | 'monthly' = 'weekly',
): Promise<LifeSynthesisReport> {
  const res = await fetch(`/api/life-synthesis?timeframe=${timeframe}`, {
    headers: {
      ...getAuthHeader(),
    },
  })

  if (!res.ok) {
    throw new Error(`Lỗi tải báo cáo tổng hợp đa miền: ${res.status}`)
  }

  const data = await res.json()
  return data.report
}

export async function generateCustomLifeSynthesisReport(params: {
  timeframe?: 'daily' | 'weekly' | 'monthly'
  domainActivityCounts?: Partial<Record<LifeDomainType, number>>
  metacognitiveAwarenessIndex?: number
  neuroEnergyScore?: number
  activeGoals?: Array<{
    id: string
    title: string
    domain: LifeDomainType
    targetDaysRemaining: number
    progressPercent: number
  }>
}): Promise<LifeSynthesisReport> {
  const res = await fetch('/api/life-synthesis', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify(params),
  })

  if (!res.ok) {
    throw new Error(`Lỗi sinh báo cáo tổng hợp đa miền: ${res.status}`)
  }

  const data = await res.json()
  return data.report
}
