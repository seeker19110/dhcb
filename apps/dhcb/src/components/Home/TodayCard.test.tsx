// TodayCard.test.tsx — cổng canh thẻ "Hôm nay" (S06-2, đặc tả §④ AC-10..AC-12).
//
// Thẻ này là thứ quyết định người học bấm vào đâu mỗi ngày, mà Trang chủ KHÔNG có test unit nào
// (chỉ E2E). Bốn bất biến dưới đây chỉ cần một PR "dọn giao diện" là mất, nên canh bằng render
// thật (happy-dom) chứ không bằng đọc mã.
import { describe, it, expect, vi, afterEach } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import type { TodayItem, TodayPlan } from '@dhcb/core-contracts/todayPlan'
import TodayCard from './TodayCard'
import { dongNguon, khoangThoiGian, nhanChinh } from './todayCardText'

vi.mock('../../lib/analytics', () => ({ track: vi.fn() }))
;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const NOW = 1_726_000_000_000

let container: HTMLDivElement
let root: Root

async function render(props: Parameters<typeof TodayCard>[0]) {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  await act(async () => {
    root.render(
      <MemoryRouter>
        <TodayCard {...props} />
      </MemoryRouter>,
    )
  })
  return container
}

function item(over: Partial<TodayItem> = {}): TodayItem {
  return {
    id: 'next:programming:p3-u10-l1',
    kind: 'next',
    subjectId: 'programming',
    contentId: 'p3-u10-l1',
    title: 'Git — cỗ máy thời gian cho code của bạn',
    hint: 'Bài kế tiếp trong mục lục',
    href: '/lap-trinh/bai-hoc/p3-u10-l1--git',
    evidenceSource: 'outline.next',
    ...over,
  }
}

function plan(over: Partial<TodayPlan> = {}): TodayPlan {
  return { primary: item(), secondary: [], subjectsSeen: ['programming'], builtAt: NOW, ...over }
}

/** Liên kết CTA chính — đếm bằng đúng khuôn E2E dùng (tên bắt đầu bằng Học tiếp/Bắt đầu). */
function ctaLinks(el: HTMLElement): HTMLAnchorElement[] {
  return [...el.querySelectorAll('a')].filter((a) =>
    /^(Học tiếp|Bắt đầu)/.test(a.textContent ?? ''),
  )
}

afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
})

describe('TodayCard — một CTA, nguồn bằng chữ, bốn trạng thái', () => {
  it('AC-10: đúng MỘT nút chính, trỏ thẳng href của mục (không màn trung gian)', async () => {
    const el = await render({ plan: plan(), state: 'ready' })
    const cta = ctaLinks(el)
    expect(cta).toHaveLength(1)
    expect(cta[0].getAttribute('href')).toBe('/lap-trinh/bai-hoc/p3-u10-l1--git')
    expect(cta[0].textContent).toContain('Git — cỗ máy thời gian')
  })

  it('AC-10: tối đa 2 mục phụ, mỗi mục là một liên kết riêng', async () => {
    const el = await render({
      plan: plan({
        secondary: [
          item({ id: 'a', title: 'Nhánh và gộp', href: '/lap-trinh/bai-hoc/p3-u10-l2--nhanh' }),
          item({
            id: 'b',
            kind: 'review',
            subjectId: 'english',
            title: 'Ôn 12 thẻ đến hạn',
            href: '/lo-trinh-hoc/a1?tab=srs',
            evidenceSource: 'english.srs',
            hint: 'Ôn tập từ vựng',
          }),
        ],
      }),
      state: 'ready',
    })
    expect(ctaLinks(el)).toHaveLength(1)
    expect(el.querySelectorAll('li a')).toHaveLength(2)
    expect(el.textContent).toContain('Ôn 12 thẻ đến hạn')
  })

  it('AC-11: không con số chẩn đoán (band/CEFR + điểm/%) trên thẻ', async () => {
    const el = await render({
      plan: plan({
        primary: item({
          subjectId: 'english',
          title: '🧭 Chào hỏi (3/12)',
          hint: 'Từ vựng · Cấp A1',
          href: '/lo-trinh-hoc/a1',
          evidenceSource: 'english.vocab',
        }),
      }),
      state: 'ready',
    })
    const text = el.textContent ?? ''
    expect(text).not.toMatch(/\b(A1|A2|B1|B2|C1|C2)\b.*(điểm|band|%)/i)
    expect(text).not.toMatch(/band/i)
    expect(text).not.toContain('%')
    // Số đếm việc (3/12 từ) vẫn được phép — nó là việc phải làm, không phải điểm.
    expect(text).toContain('(3/12)')
  })

  it('AC-11: phiên dở nói rõ nguồn + thời gian bằng chữ', async () => {
    const el = await render({
      plan: plan({
        primary: item({
          kind: 'resume',
          evidenceSource: 'session.resume',
          hint: undefined,
          resume: {
            sessionId: 's1',
            subjectId: 'programming',
            courseId: 'git',
            contentId: 'p3-u10-l1',
            hasDraft: true,
            updatedAt: NOW - 5 * 60_000,
          },
        }),
      }),
      state: 'ready',
    })
    expect(el.textContent).toContain('Phiên đang dở · 5 phút trước')
  })

  it('AC-12 (a) đang tải: skeleton có aria-busy, không có liên kết nào', async () => {
    const el = await render({ plan: null, state: 'loading' })
    expect(el.querySelector('[aria-busy="true"]')).not.toBeNull()
    expect(el.querySelectorAll('a')).toHaveLength(0)
    expect(el.innerHTML).toContain('animate-pulse')
  })

  it('AC-12 (c) rỗng: mời chọn môn về /goc-hoc-tap, KHÔNG về lộ trình tiếng Anh', async () => {
    const el = await render({
      plan: plan({
        primary: {
          id: 'pick:-:-',
          kind: 'pick',
          title: 'Chọn môn để bắt đầu',
          href: '/goc-hoc-tap',
          evidenceSource: 'none',
        },
        subjectsSeen: [],
      }),
      state: 'ready',
    })
    const cta = ctaLinks(el)
    expect(cta).toHaveLength(1)
    expect(cta[0].textContent).toContain('Bắt đầu: Chọn môn')
    // Không lặp chữ: nhãn nút đã nói "Bắt đầu" thì tiêu đề bỏ đuôi "để bắt đầu".
    expect(cta[0].textContent).not.toContain('để bắt đầu')
    expect(cta[0].getAttribute('href')).toBe('/goc-hoc-tap')
    expect(el.innerHTML).not.toContain('/lo-trinh-hoc')
    expect(el.innerHTML).not.toContain('/onboarding')
  })

  it('AC-12 (d) lỗi tiến độ: vẫn có CTA + dòng trạng thái có nút thử lại', async () => {
    const retry = vi.fn()
    const el = await render({ plan: plan(), state: 'error', onRetry: retry })
    expect(ctaLinks(el)).toHaveLength(1)
    const status = el.querySelector('[role="status"]')
    expect(status?.textContent).toContain('Chưa tải được tiến độ')
    const btn = status?.querySelector('button') as HTMLButtonElement
    await act(async () => btn.click())
    expect(retry).toHaveBeenCalledTimes(1)
  })
})

describe('TodayCard — hàm chữ nghĩa thuần', () => {
  it('khoangThoiGian: phút · giờ · ngày', () => {
    expect(khoangThoiGian(NOW, NOW)).toBe('vừa xong')
    expect(khoangThoiGian(NOW - 5 * 60_000, NOW)).toBe('5 phút trước')
    expect(khoangThoiGian(NOW - 3 * 3_600_000, NOW)).toBe('3 giờ trước')
    expect(khoangThoiGian(NOW - 2 * 86_400_000, NOW)).toBe('2 ngày trước')
  })

  it('nhanChinh: luôn mở đầu bằng "Học tiếp" hoặc "Bắt đầu"', () => {
    expect(nhanChinh(item())).toMatch(/^Học tiếp: /)
    expect(nhanChinh(item({ kind: 'pick', evidenceSource: 'none' }))).toMatch(/^Bắt đầu: /)
  })

  // [S06-3] Mục phụ của môn thứ hai PHẢI nói tên môn, kể cả khi nó là một phiên dở.
  it('dongNguon: phiên dở của môn thứ hai nói tên môn TRƯỚC mốc thời gian', () => {
    const phienMonKhac = {
      ...item(),
      evidenceSource: 'session.resume' as const,
      hint: 'Môn thứ hai: Tiếng Anh',
      resume: {
        sessionId: 's1',
        subjectId: 'english',
        contentId: 'greetings',
        step: 1,
        hasDraft: false,
        updatedAt: NOW - 3_600_000,
      },
    }
    expect(dongNguon(phienMonKhac, NOW)).toBe(
      'Môn thứ hai: Tiếng Anh · Phiên đang dở · 1 giờ trước',
    )
  })

  it('dongNguon: phiên dở KHÔNG có hint (việc chính) giữ nguyên một vế', () => {
    const phienChinh = {
      ...item(),
      evidenceSource: 'session.resume' as const,
      hint: undefined,
      resume: {
        sessionId: 's1',
        subjectId: 'programming',
        contentId: 'p3-u10-l1',
        step: 2,
        hasDraft: true,
        updatedAt: NOW - 60_000,
      },
    }
    expect(dongNguon(phienChinh, NOW)).toBe('Phiên đang dở · 1 phút trước')
  })

  it('dongNguon: nguồn không phải phiên thì dùng hint của adapter', () => {
    expect(dongNguon(item(), NOW)).toBe('Bài kế tiếp trong mục lục')
  })

  it('pick "đã đi hết nội dung": lời dẫn xuống dòng nguồn, việc lên nhãn nút', () => {
    const het = item({
      kind: 'pick',
      evidenceSource: 'none',
      hint: undefined,
      title: 'Bạn đã đi hết nội dung đang có — chọn môn hoặc khoá mới',
    })
    expect(nhanChinh(het)).toBe('Bắt đầu: Chọn môn hoặc khoá mới')
    expect(dongNguon(het, NOW)).toBe('Bạn đã đi hết nội dung đang có')
  })

  it('[U9b] pick "môn bạn đã chọn": nhãn nút nói đúng môn, dòng nguồn nói vì sao', () => {
    const daChon = item({
      kind: 'pick',
      evidenceSource: 'none',
      hint: undefined,
      title: 'Môn bạn đã chọn — học Tiếng Anh',
    })
    expect(nhanChinh(daChon)).toBe('Bắt đầu: Học Tiếng Anh')
    expect(dongNguon(daChon, NOW)).toBe('Môn bạn đã chọn')
  })
})
