// LevelMilestones.test.tsx — canh luật P2-1 (audit 2026-09-22): câu giải thích ổ khoá chỉ hiện
// đầy đủ ở bậc KẾ TIẾP của bậc đang học; bậc khoá xa hơn chỉ ghi ngắn "Mở sau P<n-1>".
// Dự án không dùng @testing-library — render bằng `renderToStaticMarkup` như các test khác.
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import LevelMilestones from './LevelMilestones'
import type { ProgrammingLevel } from '@dhcb/subject-programming/curriculum'
import type { LevelLockInfo } from '../../lib/programmingLevelLock'

const levels = ['p2', 'p3', 'p4'].map((id) => ({
  id,
  name: `Bậc ${id.toUpperCase()}`,
  canDo: 'Làm được việc gì đó.',
  languages: ['JavaScript'],
  duration: '4 tuần',
  units: [],
})) as unknown as ProgrammingLevel[]

const lockInfo: LevelLockInfo = {
  locked: true,
  requiredLevelId: 'p1',
  doneInRequired: 0,
  neededInRequired: 7,
  remaining: 7,
}

function renderHtml(nextLockedLevelId: string | undefined): string {
  return renderToStaticMarkup(
    <LevelMilestones
      levels={levels}
      progressOf={() => ({ done: 0, total: 5 })}
      onOpen={() => {}}
      lockOf={() => lockInfo}
      lockHint={(info) =>
        `Còn ${info.remaining} bài ở ${info.requiredLevelId?.toUpperCase()} nữa là mở.`
      }
      nextLockedLevelId={nextLockedLevelId}
    />,
  )
}

describe('LevelMilestones — câu giải thích ổ khoá không lặp', () => {
  it('chỉ bậc kế tiếp (p2) hiện câu đầy đủ, p3/p4 hiện ngắn "Mở sau"', () => {
    const text =
      new DOMParser().parseFromString(renderHtml('p2'), 'text/html').body.textContent ?? ''
    // Đếm nội dung đọc được, không phụ thuộc bản sao trong thuộc tính đặt tên nút.
    const soLanCauDayDu = text.split('nữa là mở.').length - 1
    expect(soLanCauDayDu).toBe(1)
    const soLanMoSau = text.split('Mở sau P1').length - 1
    expect(soLanMoSau).toBe(2) // p3 và p4, mỗi bậc có đúng một câu.
  })

  it('không truyền nextLockedLevelId thì giữ hành vi cũ — mọi bậc khoá đều hiện đầy đủ', () => {
    const text =
      new DOMParser().parseFromString(renderHtml(undefined), 'text/html').body.textContent ?? ''
    const soLanCauDayDu = text.split('nữa là mở.').length - 1
    expect(soLanCauDayDu).toBe(3) // Cả 3 bậc, mỗi bậc có đúng một câu.
    expect(text).not.toContain('Mở sau')
  })
})
