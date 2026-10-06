// Test lib onboarding (U-3): cache localStorage, đọc từ GET /api/profile (mock fetch), map
// phút/ngày → tốc độ học.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import {
  getCachedOnboarding,
  cacheOnboarding,
  fetchOnboarding,
  minutesToSpeed,
  pushAgeGroup,
  isValidAgeGroup,
  useOnboarding,
  setChosenSubject,
  getChosenSubject,
  situationForGoal,
  DEFAULT_CHAT_SITUATION,
} from './onboarding'
import { SITUATIONS } from '../types'

;(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

// Giả lập GET /api/profile trả về body cho trước (hoặc lỗi HTTP nếu ok=false).
function mockProfileResponse(body: unknown, ok = true) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({ ok, json: async () => body }) as unknown as Response),
  )
}

beforeEach(() => {
  localStorage.clear()
  vi.clearAllMocks()
})

describe('minutesToSpeed', () => {
  it('map đúng 4 mức phút của onboarding (5/10/20/30)', () => {
    expect(minutesToSpeed(5)).toBe(5)
    expect(minutesToSpeed(10)).toBe(10)
    expect(minutesToSpeed(20)).toBe(20)
    expect(minutesToSpeed(30)).toBe(20) // 30 phút cũng về tốc độ tối đa 20
  })

  it('giá trị lạ vẫn về 1 trong 3 tốc độ hợp lệ (ca biên)', () => {
    expect(minutesToSpeed(0)).toBe(5)
    expect(minutesToSpeed(-1)).toBe(5)
    expect(minutesToSpeed(7)).toBe(10)
    expect(minutesToSpeed(999)).toBe(20)
  })
})

describe('cache localStorage', () => {
  it('localStorage đầy lúc ghi cache → không throw (chỉ bỏ qua)', () => {
    const setItem = vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError')
    })
    expect(() =>
      cacheOnboarding('u1', {
        level: 'beginner',
        goal: 'daily',
        dailyMinutes: 10,
        ageGroup: 'nguoi_lon',
      }),
    ).not.toThrow()
    setItem.mockRestore()
  })

  it('ghi rồi đọc lại đúng dữ liệu, tách theo uid', () => {
    cacheOnboarding('u1', {
      level: 'advanced',
      goal: 'work',
      dailyMinutes: 20,
      ageGroup: 'thanh_nien',
    })
    expect(getCachedOnboarding('u1')).toEqual({
      level: 'advanced',
      goal: 'work',
      dailyMinutes: 20,
      ageGroup: 'thanh_nien',
    })
    expect(getCachedOnboarding('u2')).toBeNull() // uid khác không thấy cache của u1
  })

  it('dữ liệu hỏng / level lạ → null (không crash)', () => {
    localStorage.setItem('et_onboarding_u1', 'not-json{{')
    expect(getCachedOnboarding('u1')).toBeNull()
    localStorage.setItem('et_onboarding_u1', JSON.stringify({ level: 'hacker' }))
    expect(getCachedOnboarding('u1')).toBeNull()
  })

  it('thiếu goal/dailyMinutes/ageGroup → điền mặc định (goal daily, 10 phút, người lớn)', () => {
    localStorage.setItem('et_onboarding_u1', JSON.stringify({ level: 'beginner' }))
    expect(getCachedOnboarding('u1')).toEqual({
      level: 'beginner',
      goal: 'daily',
      dailyMinutes: 10,
      ageGroup: 'nguoi_lon',
    })
  })

  it('ageGroup lạ → về mặc định người lớn (không tin dữ liệu localStorage bị sửa tay)', () => {
    localStorage.setItem(
      'et_onboarding_u1',
      JSON.stringify({ level: 'beginner', ageGroup: 'hacker' }),
    )
    expect(getCachedOnboarding('u1')?.ageGroup).toBe('nguoi_lon')
  })
})

describe('fetchOnboarding', () => {
  it('hàng hợp lệ → trả dữ liệu VÀ tự ghi cache', async () => {
    mockProfileResponse({
      userLevel: 'intermediate',
      goal: 'ielts',
      dailyMinutes: 30,
      onboarded: true,
    })
    const d = await fetchOnboarding('u1')
    expect(d).toEqual({
      level: 'intermediate',
      goal: 'ielts',
      dailyMinutes: 30,
      ageGroup: 'nguoi_lon',
    })
    expect(getCachedOnboarding('u1')).toEqual(d) // lần sau đọc cache, khỏi gọi DB
  })

  it('server trả ageGroup hợp lệ → giữ đúng giá trị đó (không phải luôn về mặc định)', async () => {
    mockProfileResponse({
      userLevel: 'beginner',
      goal: 'daily',
      dailyMinutes: 10,
      ageGroup: 'nhi_dong',
      onboarded: true,
    })
    const d = await fetchOnboarding('u1')
    expect(d?.ageGroup).toBe('nhi_dong')
  })

  it('chưa onboarded → null (không cache)', async () => {
    mockProfileResponse({
      userLevel: 'beginner',
      goal: 'daily',
      dailyMinutes: 10,
      onboarded: false,
    })
    expect(await fetchOnboarding('u1')).toBeNull()
    expect(getCachedOnboarding('u1')).toBeNull()
  })

  it('lỗi HTTP hoặc userLevel lạ → null', async () => {
    mockProfileResponse(null, false)
    expect(await fetchOnboarding('u1')).toBeNull()
    mockProfileResponse({ userLevel: 'weird', onboarded: true })
    expect(await fetchOnboarding('u1')).toBeNull()
  })

  it('fetch ném lỗi mạng → bắt lỗi, trả null', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')))
    expect(await fetchOnboarding('u1')).toBeNull()
  })
})

describe('pushAgeGroup', () => {
  it('có cache sẵn → cập nhật cache local ngay + POST lên server thành công', async () => {
    cacheOnboarding('u1', {
      level: 'beginner',
      goal: 'daily',
      dailyMinutes: 10,
      ageGroup: 'nguoi_lon',
    })
    mockProfileResponse({})
    await pushAgeGroup('u1', 'thieu_nien')
    expect(getCachedOnboarding('u1')?.ageGroup).toBe('thieu_nien')
    expect(fetch).toHaveBeenCalledWith('/api/profile', expect.objectContaining({ method: 'POST' }))
  })

  it('chưa có cache → không cập nhật cache local, vẫn gọi server', async () => {
    mockProfileResponse({})
    await pushAgeGroup('u2', 'nguoi_lon')
    expect(getCachedOnboarding('u2')).toBeNull()
    expect(fetch).toHaveBeenCalled()
  })

  it('server trả lỗi HTTP → chỉ warn, không throw', async () => {
    mockProfileResponse({}, false)
    await expect(pushAgeGroup('u1', 'nguoi_lon')).resolves.toBeUndefined()
  })

  it('fetch ném lỗi mạng → bắt lỗi, không throw', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')))
    await expect(pushAgeGroup('u1', 'nguoi_lon')).resolves.toBeUndefined()
  })

  it('fetch ném giá trị không phải Error → vẫn bắt lỗi, không throw (nhánh khác instanceof Error)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue('chuoi loi khong phai Error'))
    await expect(pushAgeGroup('u1', 'nguoi_lon')).resolves.toBeUndefined()
  })
})

describe('isValidAgeGroup', () => {
  it('nhận đúng 4 nhóm tuổi hợp lệ', () => {
    expect(isValidAgeGroup('nhi_dong')).toBe(true)
    expect(isValidAgeGroup('thieu_nien')).toBe(true)
    expect(isValidAgeGroup('thanh_nien')).toBe(true)
    expect(isValidAgeGroup('nguoi_lon')).toBe(true)
  })

  it('giá trị lạ / không phải string → false', () => {
    expect(isValidAgeGroup('hacker')).toBe(false)
    expect(isValidAgeGroup(undefined)).toBe(false)
    expect(isValidAgeGroup(123)).toBe(false)
  })
})

describe('useOnboarding (hook)', () => {
  let container: HTMLDivElement
  let root: Root
  let latest: ReturnType<typeof useOnboarding> = null

  function Consumer({ uid }: { uid: string | undefined }) {
    latest = useOnboarding(uid)
    return null
  }

  beforeEach(() => {
    latest = null
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
  })

  it('không có uid → luôn null, không gọi fetch', async () => {
    await act(async () => {
      root.render(<Consumer uid={undefined} />)
    })
    expect(latest).toBeNull()
    container.remove()
  })

  it('đã có cache → trả ngay, không cần chờ fetch', async () => {
    cacheOnboarding('u1', {
      level: 'beginner',
      goal: 'daily',
      dailyMinutes: 10,
      ageGroup: 'nguoi_lon',
    })
    await act(async () => {
      root.render(<Consumer uid="u1" />)
    })
    expect(latest?.level).toBe('beginner')
    container.remove()
  })

  it('chưa có cache → gọi fetch nền rồi cập nhật state', async () => {
    localStorage.clear()
    mockProfileResponse({
      userLevel: 'advanced',
      goal: 'work',
      dailyMinutes: 30,
      onboarded: true,
    })
    await act(async () => {
      root.render(<Consumer uid="u2" />)
    })
    expect(latest?.level).toBe('advanced')
    container.remove()
  })

  it('unmount trước khi fetch nền xong → không setState sau khi huỷ (không cảnh báo)', async () => {
    localStorage.clear()
    let resolveFetch: (v: unknown) => void = () => {}
    vi.stubGlobal(
      'fetch',
      vi.fn(
        () =>
          new Promise((resolve) => {
            resolveFetch = resolve
          }),
      ),
    )
    await act(async () => {
      root.render(<Consumer uid="u3" />)
    })
    await act(async () => {
      root.unmount()
    })
    // fetch resolve sau khi đã unmount — nhánh `alive` false, chỉ cần không throw.
    await act(async () => {
      resolveFetch({ ok: true, json: async () => ({ onboarded: false }) })
    })
    container.remove()
  })
})

// [U9b] Môn đã chọn + tình huống Trò chuyện theo mục tiêu (audit 2026-09-30 M19).
describe('môn đã chọn lúc onboarding', () => {
  it('chưa chọn → undefined; chọn rồi đọc lại đúng, tách theo tài khoản', () => {
    expect(getChosenSubject('u1')).toBeUndefined()
    setChosenSubject('u1', 'english')
    expect(getChosenSubject('u1')).toBe('english')
    expect(getChosenSubject('u2')).toBeUndefined()
  })

  it('localStorage ném lỗi → đọc ra undefined, ghi không ném', () => {
    const get = vi.spyOn(localStorage, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    const set = vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    expect(() => setChosenSubject('u1', 'english')).not.toThrow()
    expect(getChosenSubject('u1')).toBeUndefined()
    get.mockRestore()
    set.mockRestore()
  })
})

describe('situationForGoal', () => {
  it('mỗi mục tiêu onboarding ra một tình huống CÓ THẬT trong SITUATIONS, không phải phỏng vấn', () => {
    const co = new Set(SITUATIONS.map((s) => s.value))
    for (const goal of ['daily', 'travel', 'work', 'ielts']) {
      const s = situationForGoal(goal)
      expect(co.has(s)).toBe(true)
      expect(s).not.toBe('job_interview')
    }
    expect(situationForGoal('daily')).toBe('small_talk')
    expect(situationForGoal('travel')).toBe('hotel_travel')
  })

  it('mục tiêu lạ / rỗng / tên thuộc tính kế thừa → mặc định tán gẫu', () => {
    expect(situationForGoal(undefined)).toBe(DEFAULT_CHAT_SITUATION)
    expect(situationForGoal('')).toBe(DEFAULT_CHAT_SITUATION)
    expect(situationForGoal('toString')).toBe(DEFAULT_CHAT_SITUATION)
  })
})
