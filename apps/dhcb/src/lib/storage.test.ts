import { describe, it, expect, beforeEach, vi } from 'vitest'

import {
  getStreak,
  hasStudiedToday,
  shouldCelebrateStreak,
  markStreakCelebrated,
  daysSinceLastActivity,
  hasEverStudied,
  register,
  login,
  logout,
  getCurrentUser,
  getDirection,
  setDirection,
  incrementUsage,
  markStudiedToday,
  getUsage,
} from './storage'
import { vnDateStr } from './date'

const usageKey = (uid: string, date: string) => `et_usage_${uid}_${date}`
const dayAgo = (n: number) => {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return vnDateStr(d)
}
const activity = (date: string, learnCount = 1) => ({
  date,
  chatCount: 0,
  writingCount: 0,
  speakingCount: 0,
  sttCount: 0,
  learnCount,
})
const setActivity = (uid: string, daysAgo: number) => {
  const date = dayAgo(daysAgo)
  localStorage.setItem(usageKey(uid, date), JSON.stringify(activity(date)))
}

describe('getStreak — vé nghỉ streak (V2, docs/research/cai-tien-lo-trinh-hoc.md)', () => {
  beforeEach(() => localStorage.clear())

  it('học liên tục 5 ngày (kể cả hôm nay) → streak 5', () => {
    for (let i = 0; i <= 4; i++) setActivity('u1', i)
    expect(getStreak('u1')).toBe(5)
  })

  it('chưa học hôm nay nhưng học đủ 4 ngày trước → vẫn tính streak 4 (không phạt "hôm nay")', () => {
    for (let i = 1; i <= 4; i++) setActivity('u1', i)
    expect(getStreak('u1')).toBe(4)
  })

  it('nghỉ 1 ngày giữa chuỗi, CHƯA dùng vé nào → tự động bắc cầu, streak không đứt', () => {
    // Học hôm nay + 2 ngày trước, NGHỈ 1 ngày (3 ngày trước), rồi học tiếp 4-6 ngày trước.
    setActivity('u1', 0)
    setActivity('u1', 1)
    setActivity('u1', 2)
    // ngày 3 nghỉ (không set activity)
    setActivity('u1', 4)
    setActivity('u1', 5)
    setActivity('u1', 6)
    expect(getStreak('u1')).toBe(6) // 3 ngày (0,1,2) + bắc cầu ngày 3 + 3 ngày (4,5,6)
  })

  it('vé nghỉ CHỈ dùng được 1 lần — nghỉ 2 đợt cách nhau <7 ngày thì đợt sau vẫn đứt streak', () => {
    setActivity('u1', 0)
    setActivity('u1', 1)
    // ngày 2 nghỉ → bắc cầu bằng vé (đợt 1)
    setActivity('u1', 3)
    // ngày 4 nghỉ nữa (cách ngày 2 chỉ 2 ngày, còn trong cooldown 7 ngày) → hết vé, đứt ở đây
    setActivity('u1', 5)
    setActivity('u1', 6)
    // Đếm được: ngày 0,1 (2) + bắc cầu ngày 2 (không cộng) + ngày 3 (1) = 3, rồi đứt ở ngày 4
    // (5, 6 không còn được tính vì streak đã đứt trước khi tới đó).
    expect(getStreak('u1')).toBe(3)
  })

  it('gọi getStreak nhiều lần cho cùng dữ liệu → kết quả ổn định (idempotent)', () => {
    setActivity('u1', 0)
    setActivity('u1', 2)
    const first = getStreak('u1')
    const second = getStreak('u1')
    const third = getStreak('u1')
    expect(second).toBe(first)
    expect(third).toBe(first)
  })

  it('nghỉ nhiều ngày (không đủ điều kiện vé) → streak đứt đúng chỗ như cũ', () => {
    setActivity('u1', 0)
    setActivity('u1', 1)
    // nghỉ liền 2 ngày (2, 3) — chỉ ngày 2 được bắc cầu bằng vé, ngày 3 vẫn nghỉ → đứt hẳn
    setActivity('u1', 4) // không được tính vì streak đã đứt trước khi quét tới đây
    expect(getStreak('u1')).toBe(2) // chỉ đếm 0, 1 — bắc cầu ngày 2 không cộng, đứt ở ngày 3
  })
})

describe('Khoảnh khắc streak — 1 lần/ngày (V-2, cai-tien-trai-nghiem-hoc-2026-07-11.md)', () => {
  beforeEach(() => localStorage.clear())

  it('hasStudiedToday: false khi chưa có hoạt động, true sau khi có', () => {
    expect(hasStudiedToday('u1')).toBe(false)
    setActivity('u1', 0)
    expect(hasStudiedToday('u1')).toBe(true)
  })

  it('chưa học hôm nay → KHÔNG ăn mừng (kể cả khi có streak từ hôm qua)', () => {
    setActivity('u1', 1)
    expect(shouldCelebrateStreak('u1')).toBe(false)
  })

  it('đã học hôm nay + chưa ăn mừng → ăn mừng; sau khi đánh dấu → không lặp lại', () => {
    setActivity('u1', 0)
    expect(shouldCelebrateStreak('u1')).toBe(true)
    markStreakCelebrated('u1')
    expect(shouldCelebrateStreak('u1')).toBe(false) // idempotent trong cùng ngày
  })

  it('đánh dấu của NGÀY HÔM QUA không chặn ăn mừng hôm nay', () => {
    setActivity('u1', 0)
    localStorage.setItem('et_streak_celebrated_u1', dayAgo(1)) // ăn mừng lần cuối: hôm qua
    expect(shouldCelebrateStreak('u1')).toBe(true)
  })

  it('mỗi người dùng đánh dấu riêng — không ảnh hưởng lẫn nhau', () => {
    setActivity('u1', 0)
    setActivity('u2', 0)
    markStreakCelebrated('u1')
    expect(shouldCelebrateStreak('u1')).toBe(false)
    expect(shouldCelebrateStreak('u2')).toBe(true)
  })
})

describe('daysSinceLastActivity — luồng "quay lại sau khi bỏ bẵng" (② M4)', () => {
  beforeEach(() => localStorage.clear())

  it('đã học hôm nay → 0', () => {
    setActivity('u1', 0)
    expect(daysSinceLastActivity('u1')).toBe(0)
  })

  it('chưa học hôm nay, học 3 ngày trước gần nhất → 3', () => {
    setActivity('u1', 5)
    setActivity('u1', 3)
    expect(daysSinceLastActivity('u1')).toBe(3)
  })

  it('chưa từng học → null (không có mốc "quay lại")', () => {
    expect(daysSinceLastActivity('u1')).toBeNull()
  })

  it('hoạt động ngoài maxLookback → null (quá lâu, không tính "vừa quay lại")', () => {
    setActivity('u1', 10)
    expect(daysSinceLastActivity('u1', 5)).toBeNull()
    expect(daysSinceLastActivity('u1', 10)).toBe(10)
  })
})

describe('hasEverStudied — điều kiện "đã học ≥ 1 phiên" của tải ngoại tuyến (audit M14)', () => {
  beforeEach(() => localStorage.clear())

  it('chưa có dữ liệu nào → false', () => {
    expect(hasEverStudied('u1')).toBe(false)
  })

  it('uid rỗng → false (không quét)', () => {
    setActivity('', 0)
    expect(hasEverStudied('')).toBe(false)
  })

  it('có một ngày học, kể cả cách đây hơn 365 ngày → true (không giới hạn khung)', () => {
    setActivity('u1', 400)
    expect(hasEverStudied('u1')).toBe(true)
  })

  it('bản ghi ngày có nhưng mọi lượt = 0 (mở app không học) → false', () => {
    const date = dayAgo(1)
    localStorage.setItem(usageKey('u1', date), JSON.stringify(activity(date, 0)))
    expect(hasEverStudied('u1')).toBe(false)
  })

  it('bản ghi cũ thiếu cột stt/pronounce/learn nhưng có chat → true', () => {
    const date = dayAgo(2)
    localStorage.setItem(
      usageKey('u1', date),
      JSON.stringify({ date, chatCount: 1, writingCount: 0, speakingCount: 0 }),
    )
    expect(hasEverStudied('u1')).toBe(true)
  })

  it('chỉ người KHÁC đã học → false; uid dài hơn cùng tiền tố không bị khớp nhầm', () => {
    setActivity('u2', 0)
    setActivity('u1_x', 0)
    expect(hasEverStudied('u1')).toBe(false)
  })

  it('JSON hỏng → bỏ qua bản ghi đó, không throw', () => {
    localStorage.setItem(usageKey('u1', dayAgo(0)), '{hỏng')
    expect(hasEverStudied('u1')).toBe(false)
  })

  it('localStorage bị chặn (ném lỗi khi duyệt khoá) → false, không throw', () => {
    setActivity('u1', 0)
    const spy = vi.spyOn(localStorage, 'key').mockImplementation(() => {
      throw new Error('SecurityError')
    })
    expect(hasEverStudied('u1')).toBe(false)
    spy.mockRestore()
  })
})

describe('register/login/logout — quản lý guest user cục bộ', () => {
  beforeEach(() => localStorage.clear())

  it('register tạo user mới, tự đăng nhập luôn', () => {
    const u = register('a@test.com', 'A', 'pw123')
    expect(u).not.toBeNull()
    expect(u!.email).toBe('a@test.com')
    expect(u!.plan).toBe('free')
    expect(getCurrentUser()?.email).toBe('a@test.com')
  })

  it('register trùng email → trả về null, không ghi đè', () => {
    register('a@test.com', 'A', 'pw123')
    const dup = register('a@test.com', 'B', 'pw456')
    expect(dup).toBeNull()
  })

  it('login đúng email → trả về user, cập nhật currentUser', () => {
    register('a@test.com', 'A', 'pw123')
    logout()
    expect(getCurrentUser()).toBeNull()
    const u = login('a@test.com', 'pw123')
    expect(u?.email).toBe('a@test.com')
    expect(getCurrentUser()?.email).toBe('a@test.com')
  })

  it('login email không tồn tại → null', () => {
    expect(login('khong-ton-tai@test.com', 'x')).toBeNull()
  })

  it('logout → xoá currentUser', () => {
    register('a@test.com', 'A', 'pw123')
    logout()
    expect(getCurrentUser()).toBeNull()
  })
})

describe('direction — chiều học (A: học Anh / B: học Việt)', () => {
  beforeEach(() => localStorage.clear())

  it('mặc định chưa set → "A"', () => {
    expect(getDirection()).toBe('A')
  })

  it('setDirection lưu và đọc lại đúng', () => {
    setDirection('B')
    expect(getDirection()).toBe('B')
  })
})

describe('usage — đếm lượt dùng + học từ trong ngày', () => {
  beforeEach(() => localStorage.clear())

  it('getUsage lần đầu → tất cả về 0', () => {
    const u = getUsage('u1')
    expect(u.chatCount).toBe(0)
    expect(u.sttCount).toBe(0)
    expect(u.pronounceCount).toBe(0)
    expect(u.learnCount).toBe(0)
  })

  it('incrementUsage tăng đúng field, không ảnh hưởng field khác', () => {
    incrementUsage('u1', 'chatCount')
    incrementUsage('u1', 'chatCount')
    incrementUsage('u1', 'writingCount')
    const u = getUsage('u1')
    expect(u.chatCount).toBe(2)
    expect(u.writingCount).toBe(1)
    expect(u.speakingCount).toBe(0)
  })

  it('getUsage bù mặc định field thiếu (dữ liệu cũ trước khi thêm sttCount/...)', () => {
    localStorage.setItem(
      usageKey('u1', vnDateStr()),
      JSON.stringify({ date: vnDateStr(), chatCount: 1, writingCount: 0, speakingCount: 0 }),
    )
    const u = getUsage('u1')
    expect(u.sttCount).toBe(0)
    expect(u.pronounceCount).toBe(0)
    expect(u.learnCount).toBe(0)
  })

  it('markStudiedToday tăng learnCount', () => {
    markStudiedToday('u1')
    markStudiedToday('u1')
    expect(getUsage('u1').learnCount).toBe(2)
  })
})
