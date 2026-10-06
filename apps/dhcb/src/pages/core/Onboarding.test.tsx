// Onboarding.test.tsx — cổng canh slice 04 (spec 03-04 §④ AC-4.5, AC-4.6): onboarding theo MÔN.
//
// Trước slice 04 mọi người mới đều bị hỏi trình độ CEFR + mục tiêu giao tiếp — tức onboarding
// của riêng Tiếng Anh — dù họ muốn học Toán. Nay bước đầu là "Bạn muốn học gì?".
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import Onboarding from './Onboarding'

;(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const saveOnboardingMock = vi.hoisted(() =>
  vi.fn<(data: unknown) => Promise<{ ok: boolean }>>(async () => ({ ok: true })),
)
const cacheMock = vi.hoisted(() => vi.fn())
const speedMock = vi.hoisted(() => vi.fn())
const refreshMock = vi.hoisted(() => vi.fn(async () => ({ id: 'u1', onboarded: true })))
const trackMock = vi.hoisted(() => vi.fn())
const chosenMock = vi.hoisted(() => vi.fn())
vi.mock('../../lib/cloud', () => ({ saveOnboarding: saveOnboardingMock }))
vi.mock('../../lib/analytics', () => ({ track: trackMock }))
vi.mock('../../lib/onboarding', () => ({
  cacheOnboarding: cacheMock,
  minutesToSpeed: () => 10,
  setChosenSubject: chosenMock,
}))
vi.mock('../../lib/curriculum', () => ({ setDailySpeed: speedMock }))
vi.mock('../../context/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'u1', name: 'An', onboarded: false },
    refreshVerified: refreshMock,
  }),
}))
vi.mock('../../components/SubjectIllustration', () => ({ default: () => null }))

describe('Onboarding — chọn môn trước', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
    saveOnboardingMock.mockReset().mockResolvedValue({ ok: true })
    refreshMock.mockReset().mockResolvedValue({ id: 'u1', onboarded: true })
    cacheMock.mockReset()
    speedMock.mockReset()
    trackMock.mockReset()
    chosenMock.mockReset()
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
  })

  afterEach(() => {
    act(() => root.unmount())
    container.remove()
  })

  function hien() {
    act(() => {
      root.render(
        <MemoryRouter initialEntries={['/onboarding']}>
          <Routes>
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/goc-hoc-tap/mathematics" element={<p>TRANG-TOAN</p>} />
            <Route path="/goc-hoc-tap/english" element={<p>TRANG-TIENG-ANH</p>} />
            <Route path="/" element={<p>TRANG-CHU</p>} />
          </Routes>
        </MemoryRouter>,
      )
    })
  }

  function nut(re: RegExp): HTMLButtonElement {
    const b = Array.from(container.querySelectorAll('button')).find((x) =>
      re.test(x.textContent ?? ''),
    )
    if (!b) throw new Error(`Không thấy nút ${re}`)
    return b as HTMLButtonElement
  }

  async function chay() {
    await act(async () => {
      await Promise.resolve()
      await Promise.resolve()
    })
  }

  it('bước đầu là "Bạn muốn học gì?" với đủ 6 môn; chưa chọn thì chưa có bước nhóm tuổi', () => {
    hien()
    expect(container.textContent).toContain('Bạn muốn học gì?')
    for (const label of ['Tiếng Anh', 'Toán học', 'Vật lý', 'Hóa học', 'Sinh học', 'Lập trình']) {
      expect(container.textContent, label).toContain(label)
    }
    expect(container.textContent).not.toContain('Bạn thuộc nhóm tuổi nào?')
  })

  it('chọn Toán → chỉ hỏi nhóm tuổi (1/1) rồi hoàn tất, tới trang môn Toán, API nhận giá trị mặc định', async () => {
    hien()
    act(() => nut(/Toán học/).click())
    expect(container.textContent).toContain('Bạn thuộc nhóm tuổi nào?')
    expect(container.textContent).toContain('Bước 1 / 1')
    expect(container.textContent).not.toContain('Trình độ')
    act(() => nut(/Bắt đầu học/).click())
    await chay()
    await chay()
    expect(saveOnboardingMock).toHaveBeenCalledTimes(1)
    expect(saveOnboardingMock.mock.calls[0]![0]).toMatchObject({
      level: 'beginner',
      goal: 'daily',
      dailyMinutes: 10,
      ageGroup: 'nguoi_lon',
    })
    expect(container.textContent).toContain('TRANG-TOAN')
  })

  it('chọn Tiếng Anh → luồng 4 bước như cũ (nhóm tuổi → trình độ …)', () => {
    hien()
    act(() => nut(/Tiếng Anh/).click())
    expect(container.textContent).toContain('Bước 1 / 4')
    act(() => nut(/Tiếp theo/).click())
    expect(container.textContent).toContain('Bước 2 / 4')
  })
  it('POST lỗi giữ lựa chọn nhóm tuổi, không cache/nav; retry giữ payload', async () => {
    saveOnboardingMock.mockResolvedValueOnce({ ok: false })
    hien()
    act(() => nut(/Toán học/).click())
    act(() => nut(/Thiếu niên/).click())
    act(() => nut(/Bắt đầu học/).click())
    await chay()
    expect(container.querySelector('[role="alert"]')?.textContent).toContain('Chưa xác nhận')
    expect(nut(/Thiếu niên/).getAttribute('aria-pressed')).toBe('true')
    expect(cacheMock).not.toHaveBeenCalled()
    expect(speedMock).not.toHaveBeenCalled()
    expect(refreshMock).not.toHaveBeenCalled()
    expect(container.textContent).not.toContain('TRANG-TOAN')
    act(() => nut(/Thử lưu lại/).click())
    await chay()
    expect(saveOnboardingMock.mock.calls[0]![0]).toEqual(saveOnboardingMock.mock.calls[1]![0])
    expect(cacheMock).toHaveBeenCalledTimes(1)
    expect(container.textContent).toContain('TRANG-TOAN')
  })

  it('POST đã lưu, refresh lỗi: retry chỉ đọc phiên và không ghi cache hai lần', async () => {
    refreshMock.mockRejectedValueOnce(new Error('offline'))
    hien()
    act(() => nut(/Toán học/).click())
    act(() => nut(/Bắt đầu học/).click())
    await chay()
    expect(container.querySelector('[role="alert"]')?.textContent).toContain('Hồ sơ đã lưu')
    expect(container.textContent).not.toContain('TRANG-TOAN')
    act(() => nut(/Thử đọc lại phiên/).click())
    await chay()
    expect(saveOnboardingMock).toHaveBeenCalledTimes(1)
    expect(cacheMock).toHaveBeenCalledTimes(1)
    expect(speedMock).toHaveBeenCalledTimes(1)
    expect(refreshMock).toHaveBeenCalledTimes(2)
    expect(container.textContent).toContain('TRANG-TOAN')
  })

  it.each([
    { id: 'u2', onboarded: true },
    { id: 'u1', onboarded: false },
  ])(
    'không điều hướng khi refresh chưa xác nhận đúng người và onboarding: %j',
    async (verified) => {
      refreshMock.mockResolvedValueOnce(verified)
      hien()
      act(() => nut(/Toán học/).click())
      act(() => nut(/Bắt đầu học/).click())
      await chay()
      expect(container.textContent).not.toContain('TRANG-TOAN')
      expect(container.querySelector('[role="alert"]')?.textContent).toContain('Hồ sơ đã lưu')
    },
  )

  it('double click chỉ một POST; unmount không ghi cache hoặc đọc phiên', async () => {
    let resolve!: (result: { ok: boolean }) => void
    saveOnboardingMock.mockReturnValueOnce(
      new Promise((done) => {
        resolve = done
      }),
    )
    hien()
    act(() => nut(/Toán học/).click())
    act(() => {
      const button = nut(/Bắt đầu học/)
      button.click()
      button.click()
    })
    expect(saveOnboardingMock).toHaveBeenCalledTimes(1)
    expect(nut(/Đang lưu/).disabled).toBe(true)
    act(() => root.render(<p>ĐÃ-RỜI-TRANG</p>))
    await act(async () => resolve({ ok: true }))
    expect(cacheMock).not.toHaveBeenCalled()
    expect(refreshMock).not.toHaveBeenCalled()
    expect(container.textContent).toBe('ĐÃ-RỜI-TRANG')
  })

  // ── [U9b] audit 2026-09-30 M19 + mục 8 ─────────────────────────────────────────────────────
  it('lưu xong thì nhớ môn vừa chọn cho đúng tài khoản (Trang chủ không hỏi lại "Chọn môn")', async () => {
    hien()
    act(() => nut(/Toán học/).click())
    act(() => nut(/Bắt đầu học/).click())
    await chay()
    await chay()
    expect(chosenMock).toHaveBeenCalledWith('u1', 'mathematics')
  })

  it('"Bỏ qua" ngay ở bước chọn môn: lưu mặc định, KHÔNG gán môn nào, về Trang chủ, ghi sự kiện bỏ qua', async () => {
    hien()
    act(() => nut(/^Bỏ qua$/).click())
    await chay()
    await chay()
    expect(saveOnboardingMock).toHaveBeenCalledTimes(1)
    expect(saveOnboardingMock.mock.calls[0]![0]).toEqual({
      level: 'beginner',
      goal: 'daily',
      dailyMinutes: 10,
      ageGroup: 'nguoi_lon',
    })
    expect(chosenMock).not.toHaveBeenCalled()
    expect(trackMock).toHaveBeenCalledWith('onboarding_skip', { refCode: 'onboarding:subject' })
    expect(container.textContent).toContain('TRANG-CHU')
  })

  it('"Bỏ qua" giữa luồng Tiếng Anh giữ những gì đã chọn, phần còn lại mặc định, tới trang môn', async () => {
    hien()
    act(() => nut(/Tiếng Anh/).click())
    act(() => nut(/Thanh niên/).click())
    act(() => nut(/Tiếp theo/).click())
    act(() => nut(/Trung cấp/).click())
    act(() => nut(/^Bỏ qua$/).click())
    await chay()
    await chay()
    expect(saveOnboardingMock.mock.calls[0]![0]).toEqual({
      level: 'intermediate',
      goal: 'daily',
      dailyMinutes: 10,
      ageGroup: 'thanh_nien',
    })
    expect(trackMock).toHaveBeenCalledWith('onboarding_skip', { refCode: 'onboarding:1' })
    expect(chosenMock).toHaveBeenCalledWith('u1', 'english')
    expect(container.textContent).toContain('TRANG-TIENG-ANH')
  })

  it('nút trình độ / mục tiêu / số phút có aria-pressed như nút nhóm tuổi', () => {
    hien()
    act(() => nut(/Tiếng Anh/).click())
    act(() => nut(/Tiếp theo/).click())
    expect(nut(/Cơ bản/).getAttribute('aria-pressed')).toBe('true')
    expect(nut(/Nâng cao/).getAttribute('aria-pressed')).toBe('false')
    act(() => nut(/Tiếp theo/).click())
    expect(nut(/Giao tiếp hàng ngày/).getAttribute('aria-pressed')).toBe('true')
    expect(nut(/Du lịch/).getAttribute('aria-pressed')).toBe('false')
    act(() => nut(/Tiếp theo/).click())
    expect(nut(/^10phút/).getAttribute('aria-pressed')).toBe('true')
    act(() => nut(/^20phút/).click())
    expect(nut(/^20phút/).getAttribute('aria-pressed')).toBe('true')
    expect(nut(/^10phút/).getAttribute('aria-pressed')).toBe('false')
  })

  it('bước nào cũng có "Quay lại"/"Chọn môn khác" đi đúng một bước lùi', () => {
    hien()
    act(() => nut(/Tiếng Anh/).click())
    act(() => nut(/Tiếp theo/).click())
    expect(container.textContent).toContain('Bước 2 / 4')
    act(() => nut(/Quay lại/).click())
    expect(container.textContent).toContain('Bước 1 / 4')
    act(() => nut(/Chọn môn khác/).click())
    expect(container.textContent).toContain('Bạn muốn học gì?')
  })
})
