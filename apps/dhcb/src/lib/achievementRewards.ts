// src/lib/achievementRewards.ts — Gọi API phần thưởng huy hiệu (api/achievements.ts, migration
// 0026). Tách riêng khỏi lib/achievements.ts (tính "đã đạt huy hiệu" THUẦN, không gọi mạng —
// chỉ để hiển thị UI ngay, không phải chỗ quyết định cấp thưởng) — giống cách quests.ts/
// achievements.ts đã tách ở dự án này.

import { getAuthHeader, getStoredToken } from '@core/authHeader'

export interface AchievementRewardStatus {
  id: string
  earned: boolean
  claimed: boolean
  reward: { enabled: boolean; rewardPlan: 'pro' | 'vip'; rewardDays: number }
}

export async function fetchAchievementRewards(): Promise<AchievementRewardStatus[] | null> {
  try {
    const headers = getAuthHeader()
    if (!getStoredToken()) return null
    const res = await fetch('/api/achievements', { headers })
    if (!res.ok) return null
    const data = (await res.json()) as { items: AchievementRewardStatus[] }
    return data.items
  } catch {
    return null
  }
}

// Trả về { rewardDays, rewardPlan } nếu nhận thành công, `null` nếu chưa đủ điều kiện/đã nhận
// rồi/lỗi mạng — server tự xác minh lại "đã đạt" từ dữ liệu thật, không tin client.
export async function claimAchievementReward(
  achievementId: string,
): Promise<{ rewardDays: number; rewardPlan: 'pro' | 'vip' } | null> {
  try {
    const headers = getAuthHeader()
    if (!getStoredToken()) return null
    const res = await fetch('/api/achievements', {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headers },
      body: JSON.stringify({ achievementId }),
    })
    if (!res.ok) return null
    const data = (await res.json()) as {
      ok: boolean
      rewardDays?: number
      rewardPlan?: 'pro' | 'vip'
    }
    return data.ok && typeof data.rewardDays === 'number' && data.rewardPlan
      ? { rewardDays: data.rewardDays, rewardPlan: data.rewardPlan }
      : null
  } catch {
    return null
  }
}
