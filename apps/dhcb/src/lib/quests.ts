// src/lib/quests.ts — Gọi API nhiệm vụ (api/quests.ts). Tách riêng khỏi shareContent.ts (hàm
// thuần dựng nội dung, không gọi mạng) — file này CÓ gọi API.

import { getAuthHeader, getStoredToken } from '@core/authHeader'

export type CefrExamLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'

export interface QuestsStatus {
  share: { cooldownDays: number; rewardDays: number; canClaim: boolean }
  streak: {
    current: number
    required: number
    rewardDays: number
    cooldownDays: number
    canClaim: boolean
  }
  cefrExams: { level: CefrExamLevel; passed: boolean; claimed: boolean; rewardDays: number }[]
  referral: {
    code: string
    rewardedCount: number
    pendingCount: number
    maxRewarded: number
    rewardDays: number
  }
}

async function postClaim(body: Record<string, unknown>): Promise<number | null> {
  try {
    const headers = getAuthHeader()
    if (!getStoredToken()) return null // chưa đăng nhập — không có gì để thưởng
    const res = await fetch('/api/quests', {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headers },
      body: JSON.stringify(body),
    })
    if (!res.ok) return null
    const data = (await res.json()) as { ok: boolean; rewardDays?: number }
    return data.ok && typeof data.rewardDays === 'number' ? data.rewardDays : null
  } catch {
    return null
  }
}

// Endpoint giữ tương thích; server hiện tắt thưởng chia sẻ vì chưa có bằng chứng xác minh.
export function claimShareQuest(): Promise<number | null> {
  return postClaim({ action: 'claim-share' })
}

// Chuỗi ngày học vẫn hiển thị; server hiện tắt payout từ tiến độ client tự khai.
export function claimStreakQuest(): Promise<number | null> {
  return postClaim({ action: 'claim-streak' })
}

// Chỉ nhận thưởng sau bài thi CEFR do server chấm và commit vào kho kết quả đã xác minh.
export function claimCefrExamQuest(level: CefrExamLevel): Promise<number | null> {
  return postClaim({ action: 'claim-cefr-exam', level })
}

export async function fetchQuestsStatus(): Promise<QuestsStatus | null> {
  try {
    const headers = getAuthHeader()
    if (!getStoredToken()) return null
    const res = await fetch('/api/quests', { headers })
    if (!res.ok) return null
    return (await res.json()) as QuestsStatus
  } catch {
    return null
  }
}
