// Luật số 1 ở tầng giao diện (changelog 0539): thẻ + hộp thoại Nhật ký phản tỉnh KHÔNG hiện con
// số nào chấm người viết — kể cả khi API (server cũ / bản ghi cũ) vẫn trả hai số giả MAI và
// Growth Mindset. Bổ sung cho test bất biến ở tầng hàm thuần
// (`packages/core-personal/metacognitiveReflectionService.test.ts`): ở đây kiểm DOM thật.
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { findForbiddenLanguage } from '@dhcb/core-personal/intakeSuggestion'
import MetacognitiveJournalCard from './MetacognitiveJournalCard'
import { submitMetacognitiveReflectionApi } from '../../lib/metacognitiveReflectionApi.js'
import type { MetacognitiveReflection } from '@dhcb/core-contracts/metacognitiveReflection'

// Dữ liệu cố ý mang hình dạng CŨ (còn số giả) — giao diện phải bỏ qua chúng.
const legacyReflection = {
  id: 'refl-1',
  personId: 'u1',
  title: 'Phản tỉnh hôm qua',
  domain: 'learning',
  reflectionPrompt: 'Câu hỏi',
  userReflection: 'Hôm nay mình sợ sai nên nghĩ mãi. Mình nhận ra là cần thử trước rồi sửa sau.',
  ahaMoments: ['Mình nhận ra là cần thử trước rồi sửa sau'],
  identifiedBiases: [
    {
      biasType: 'analysis_paralysis',
      biasName: 'Tê liệt phân tích',
      explanation: 'Có thể mong muốn làm thật hoàn hảo đang khiến bạn chần chừ.',
      antidotePrompt: 'Nếu chỉ có 15 phút để làm một bản nháp thô, bạn sẽ bắt đầu từ đâu?',
      severity: 'high',
      triggerPhrases: ['sợ sai', 'nghĩ mãi'],
    },
  ],
  metacognitiveIndex: 87,
  growthMindsetScore: 90,
  socraticFollowUps: ['Nếu chỉ có 15 phút để làm một bản nháp thô, bạn sẽ bắt đầu từ đâu?'],
  createdAt: '2026-10-07T10:00:00.000Z',
}

vi.mock('../../lib/metacognitiveReflectionApi.js', () => ({
  fetchDailySocraticPrompt: vi.fn(async () => ({
    id: 'p1',
    domain: 'learning',
    theme: 'Chiến lược vượt ngưỡng khó khăn',
    promptText: 'Khi gặp một bài tập khiến bạn bối rối, phản xạ đầu tiên của bạn là gì?',
    deepDivingQuestion: 'Phản xạ đó giúp bạn tiến bộ hay đang né tránh?',
  })),
  fetchMetacognitiveSummary: vi.fn(async () => ({
    summary: {
      overallAwarenessIndex: 87,
      mindsetTrend: 'accelerating',
      totalReflectionsCount: 1,
      topDetectedBiases: ['analysis_paralysis'],
      recentAhaMoments: [],
    },
    reflections: [legacyReflection],
  })),
  submitMetacognitiveReflectionApi: vi.fn(async () => legacyReflection),
}))

let container: HTMLDivElement
let root: Root

beforeEach(() => {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
})

afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
  document.body.innerHTML = ''
})

/** Bất biến chung: không điểm dạng x/100, không nhãn "MAI"/"Mindset", không ngôn ngữ chấm điểm. */
function expectNoScores(text: string) {
  expect(text).not.toMatch(/\d+\s*\/\s*100/)
  expect(text).not.toMatch(/\bMAI\b|Mindset|Metacognitive Index/)
  expect(text).not.toContain('87')
  expect(findForbiddenLanguage([text])).toEqual([])
}

function buttonByText(text: string): HTMLButtonElement {
  const btn = [...document.querySelectorAll('button')].find((b) => b.textContent?.includes(text))
  if (!btn) throw new Error(`Không thấy nút "${text}"`)
  return btn
}

async function openAndSubmit() {
  await act(async () => root.render(<MetacognitiveJournalCard />))
  await act(async () => buttonByText('Phản tỉnh Socratic').click())
  const textarea = document.querySelector('textarea')
  if (!textarea) throw new Error('Không thấy ô viết')
  const setValue = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set
  await act(async () => {
    setValue?.call(textarea, legacyReflection.userReflection)
    textarea.dispatchEvent(new Event('input', { bubbles: true }))
  })
  await act(async () => buttonByText('Nhận câu hỏi gợi mở').click())
}

describe('Nhật ký phản tỉnh — Luật số 1 trên DOM', () => {
  it('thẻ, kết quả và lịch sử chỉ có phản hồi định tính, không con số chấm người viết', async () => {
    await act(async () => root.render(<MetacognitiveJournalCard />))
    expect(document.body.textContent).toContain('Đã phản tỉnh')
    expectNoScores(document.body.textContent ?? '')

    // Mở hộp thoại, viết bài, gửi.
    await openAndSubmit()

    const ketQua = document.body.textContent ?? ''
    expect(ketQua).toContain('Phản hồi cho bài viết của bạn')
    expect(ketQua).toContain('Có thể bạn đang mắc bẫy tư duy')
    expect(ketQua).toContain('“sợ sai”, “nghĩ mãi”')
    expect(ketQua).toContain('Nếu chỉ có 15 phút để làm một bản nháp thô')
    expectNoScores(ketQua)

    // Tab lịch sử: tóm tắt định tính.
    await act(async () => buttonByText('Lịch sử').click())
    const lichSu = document.body.textContent ?? ''
    expect(lichSu).toContain('Bẫy tư duy bạn hay nhắc tới')
    expect(lichSu).toContain('Tê liệt phân tích')
    expect(lichSu).not.toContain('accelerating')
    expectNoScores(lichSu)
  })

  it('server cũ (rollback) trả bẫy "none" giữ chỗ, thiếu triggerPhrases → không vỡ, không hiện bẫy giả', async () => {
    const oldShape = {
      ...legacyReflection,
      identifiedBiases: [
        {
          biasType: 'none',
          biasName: 'Tư duy trung dung & Cởi mở',
          explanation: 'Không phát hiện thiên kiến nhận thức nổi cộm.',
          antidotePrompt: 'Tiếp tục duy trì trạng thái quan sát khách quan.',
          severity: 'low',
        },
      ],
    } as unknown as MetacognitiveReflection
    vi.mocked(submitMetacognitiveReflectionApi).mockResolvedValueOnce(oldShape)
    await openAndSubmit()
    const text = document.body.textContent ?? ''
    expect(text).toContain('chưa thấy dấu hiệu bẫy tư duy quen thuộc nào')
    expect(text).not.toContain('Tư duy trung dung')
    expectNoScores(text)
  })
})
