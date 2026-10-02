import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { NeuralDrillReview } from '@dhcb/core-contracts/neuralCurriculum'
import { NeuralCurriculumService } from '@dhcb/core-ai/neuralCurriculumService'
import MicroDrillModal from './MicroDrillModal'
vi.mock('../useDialogBehavior', () => ({
  useDialogBehavior: () => ({ dialogProps: {}, titleId: 'drill-title', backdropProps: {} }),
}))
const drill = NeuralCurriculumService.createDefaultState('11111111-1111-4111-8111-111111111111')
  .modules[0]!.drills[0]!
const result: NeuralDrillReview = {
  correctCount: 1,
  total: 1,
  masteryDelta: 15,
  nextIntervalDays: 2,
  recorded: true,
}
let container: HTMLDivElement
let root: Root
// Hộp thoại render qua portal vào document.body (changelog 0474), không nằm trong `container`.
const button = (label: string) => {
  const found = [...document.body.querySelectorAll('button')].find(
    (element) => element.textContent?.trim() === label,
  )
  if (!found) throw new Error(`Thiếu nút ${label}`)
  return found
}
beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})
afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
  vi.unstubAllGlobals()
})
describe('MicroDrillModal — xác nhận từ server', () => {
  it('gửi ID/đáp án, chờ lưu rồi mới hiển thị hoàn tất', async () => {
    let finish: ((review: NeuralDrillReview) => void) | undefined
    const onComplete = vi.fn(
      () =>
        new Promise<NeuralDrillReview>((resolve) => {
          finish = resolve
        }),
    )
    await act(async () =>
      root.render(
        <MicroDrillModal isOpen onClose={() => {}} drills={[drill]} onComplete={onComplete} />,
      ),
    )
    await act(async () => button(drill.correctAnswer).click())
    await act(async () => button('Hoàn tất').click())
    expect(onComplete).toHaveBeenCalledWith([{ drillId: drill.id, answer: drill.correctAnswer }])
    expect(button('Đang lưu…').disabled).toBe(true)
    expect(document.body.textContent).not.toContain('Hoàn Tất Bài Luyện Vi Mô!')
    await act(async () => finish?.(result))
    expect(document.body.textContent).toContain('Hoàn Tất Bài Luyện Vi Mô!')
    expect(document.body.textContent).toContain('Kết quả đã được lưu')
  })
  it('lỗi giữ đáp án để retry và thông báo lần ôn không cộng điểm lặp', async () => {
    const onComplete = vi
      .fn()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce({ ...result, masteryDelta: 0, recorded: false })
    await act(async () =>
      root.render(
        <MicroDrillModal isOpen onClose={() => {}} drills={[drill]} onComplete={onComplete} />,
      ),
    )
    await act(async () => button(drill.correctAnswer).click())
    await act(async () => button('Hoàn tất').click())
    expect(document.body.querySelector('[role="alert"]')?.textContent).toContain('Chưa lưu được')
    expect(document.body.textContent).not.toContain('Hoàn Tất Bài Luyện Vi Mô!')
    await act(async () => button('Hoàn tất').click())
    expect(document.body.textContent).toContain('điểm không cộng lặp')
    expect(onComplete.mock.calls[0]).toEqual(onComplete.mock.calls[1])
  })
})
