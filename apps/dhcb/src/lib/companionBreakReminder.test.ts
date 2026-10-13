import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  BREAK_POLICIES,
  breakPolicyFor,
  breakStorageKey,
  loadBreakState,
  recordActivity,
  saveBreakState,
  sessionMinutes,
  shouldRemind,
  snooze,
  type BreakState,
} from './companionBreakReminder'

const MIN = 60_000
const T0 = 1_760_000_000_000
const KID = BREAK_POLICIES.nhi_dong
const TEEN = BREAK_POLICIES.thieu_nien

describe('breakPolicyFor', () => {
  it('chỉ nhóm nhi_dong/thieu_nien có lời nhắc', () => {
    expect(breakPolicyFor('nhi_dong')).toBe(KID)
    expect(breakPolicyFor('thieu_nien')).toBe(TEEN)
    expect(breakPolicyFor('thanh_nien')).toBeNull()
    expect(breakPolicyFor('nguoi_lon')).toBeNull()
    expect(breakPolicyFor(null)).toBeNull()
    expect(breakPolicyFor(undefined)).toBeNull()
  })

  it('ngưỡng đúng đặc tả: nhi đồng 20/10/15, thiếu niên 40/15/15 phút', () => {
    expect(KID).toEqual({ firstReminderMinutes: 20, snoozeMinutes: 10, idleResetMinutes: 15 })
    expect(TEEN).toEqual({ firstReminderMinutes: 40, snoozeMinutes: 15, idleResetMinutes: 15 })
  })
})

describe('recordActivity', () => {
  it('lượt đầu mở phiên mới, mốc nhắc = bắt đầu + ngưỡng', () => {
    expect(recordActivity(null, T0, KID)).toEqual({
      sessionStartMs: T0,
      lastActivityMs: T0,
      nextReminderAtMs: T0 + 20 * MIN,
    })
  })

  it('lượt cách lượt trước ĐÚNG ngưỡng nghỉ vẫn giữ phiên', () => {
    const s = recordActivity(null, T0, KID)
    const next = recordActivity(s, T0 + 15 * MIN, KID)
    expect(next.sessionStartMs).toBe(T0)
    expect(next.lastActivityMs).toBe(T0 + 15 * MIN)
    expect(next.nextReminderAtMs).toBe(T0 + 20 * MIN)
  })

  it('quá ngưỡng nghỉ 1 ms ⇒ phiên mới (đã nghỉ thật)', () => {
    const s = recordActivity(null, T0, KID)
    const at = T0 + 15 * MIN + 1
    expect(recordActivity(s, at, KID)).toEqual({
      sessionStartMs: at,
      lastActivityMs: at,
      nextReminderAtMs: at + 20 * MIN,
    })
  })

  it('đồng hồ máy lùi về trước lúc bắt đầu phiên ⇒ mở phiên mới, không ra số âm', () => {
    const s = recordActivity(null, T0, KID)
    const back = recordActivity(s, T0 - 5 * MIN, KID)
    expect(back.sessionStartMs).toBe(T0 - 5 * MIN)
    expect(sessionMinutes(back, T0 - 5 * MIN)).toBe(1)
  })
})

describe('shouldRemind', () => {
  // Trò chuyện đều mỗi 5 phút tới phút 20.
  function chatUntil(minutes: number, policy = KID): BreakState {
    let s: BreakState | null = null
    for (let m = 0; m <= minutes; m += 5) s = recordActivity(s, T0 + m * MIN, policy)
    return s as BreakState
  }

  it('không có phiên ⇒ false', () => {
    expect(shouldRemind(null, T0, KID)).toBe(false)
  })

  it('trước mốc 1 ms ⇒ false; đúng mốc ⇒ true', () => {
    const s = chatUntil(20)
    expect(shouldRemind(s, T0 + 20 * MIN - 1, KID)).toBe(false)
    expect(shouldRemind(s, T0 + 20 * MIN, KID)).toBe(true)
  })

  it('đã qua mốc nhưng rời đi quá ngưỡng nghỉ ⇒ false (quay lại không bật lời nhắc)', () => {
    const s = chatUntil(20)
    expect(shouldRemind(s, T0 + 20 * MIN + 15 * MIN + 1, KID)).toBe(false)
  })

  it('thiếu niên: 20 phút chưa nhắc, 40 phút mới nhắc', () => {
    const s = chatUntil(40, TEEN)
    expect(shouldRemind(s, T0 + 20 * MIN, TEEN)).toBe(false)
    expect(shouldRemind(s, T0 + 40 * MIN, TEEN)).toBe(true)
  })
})

describe('snooze', () => {
  it('dời mốc nhắc thêm đúng số phút của nhóm', () => {
    const s = recordActivity(null, T0, KID)
    const now = T0 + 21 * MIN
    expect(snooze(s, now, KID).nextReminderAtMs).toBe(now + 10 * MIN)
    expect(snooze(s, now, TEEN).nextReminderAtMs).toBe(now + 15 * MIN)
    expect(shouldRemind(snooze(s, now, KID), now, KID)).toBe(false)
  })
})

describe('sessionMinutes', () => {
  it('làm tròn xuống, tối thiểu 1', () => {
    const s = recordActivity(null, T0, KID)
    expect(sessionMinutes(s, T0)).toBe(1)
    expect(sessionMinutes(s, T0 + 20 * MIN + 59_000)).toBe(20)
  })
})

describe('lưu trữ localStorage', () => {
  const UID = 'u-1'

  afterEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
  })

  it('ghi rồi đọc lại đúng; ghi null thì xoá khoá', () => {
    const s = recordActivity(null, T0, KID)
    saveBreakState(UID, s)
    expect(loadBreakState(UID)).toEqual(s)
    saveBreakState(UID, null)
    expect(localStorage.getItem(breakStorageKey(UID))).toBeNull()
    expect(loadBreakState(UID)).toBeNull()
  })

  it('khoá riêng theo người dùng', () => {
    saveBreakState(UID, recordActivity(null, T0, KID))
    expect(loadBreakState('u-2')).toBeNull()
  })

  it.each([
    ['JSON sai', '{không phải json'],
    ['thiếu khoá', JSON.stringify({ sessionStartMs: T0 })],
    ['số âm', JSON.stringify({ sessionStartMs: -1, lastActivityMs: 0, nextReminderAtMs: 0 })],
    ['kiểu sai', JSON.stringify({ sessionStartMs: 'a', lastActivityMs: 0, nextReminderAtMs: 0 })],
    [
      'lần cuối trước lúc bắt đầu',
      JSON.stringify({ sessionStartMs: T0, lastActivityMs: T0 - 1, nextReminderAtMs: T0 }),
    ],
  ])('dữ liệu hỏng (%s) ⇒ null', (_label, raw) => {
    localStorage.setItem(breakStorageKey(UID), raw)
    expect(loadBreakState(UID)).toBeNull()
  })

  it('localStorage ném lỗi ⇒ không ném ra ngoài', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError')
    })
    expect(loadBreakState(UID)).toBeNull()
    expect(() => saveBreakState(UID, recordActivity(null, T0, KID))).not.toThrow()
  })
})
