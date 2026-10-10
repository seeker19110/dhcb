import { describe, it, expect, beforeEach, vi } from 'vitest'
import { getGuestId } from '@core/guestId'
import { LEARNING_SESSION_PREFIX } from './learningSession'
import { hasAnyGuestSession } from './guestActivity'

describe('hasAnyGuestSession', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('rỗng → false', () => {
    expect(hasAnyGuestSession()).toBe(false)
  })

  it('có khoá phiên học (LEARNING_SESSION_PREFIX) → true', () => {
    localStorage.setItem(`${LEARNING_SESSION_PREFIX}guest_abc:english:a1`, '{}')
    expect(hasAnyGuestSession()).toBe(true)
  })

  it('có ý định đã chọn môn (readLocalIntent khác null) → true', () => {
    const uid = getGuestId()
    localStorage.setItem(
      `dhcb_intent_${uid}`,
      JSON.stringify({
        schemaVersion: 1,
        subjectIds: ['english'],
        createdAt: 1,
        updatedAt: 1,
      }),
    )
    expect(hasAnyGuestSession()).toBe(true)
  })

  it('bản ghi ý định hỏng hoặc chưa chọn môn nào → false', () => {
    const uid = getGuestId()
    localStorage.setItem(`dhcb_intent_${uid}`, '{không phải json')
    expect(hasAnyGuestSession()).toBe(false)
    localStorage.setItem(`dhcb_intent_${uid}`, JSON.stringify({ schemaVersion: 1, subjectIds: [] }))
    expect(hasAnyGuestSession()).toBe(false)
    localStorage.setItem(`dhcb_intent_${uid}`, 'null')
    expect(hasAnyGuestSession()).toBe(false)
  })

  it('ý định của NGƯỜI KHÁC (khoá khác guestId) không tính → false', () => {
    localStorage.setItem(
      'dhcb_intent_guest_nguoi-khac',
      JSON.stringify({ subjectIds: ['english'] }),
    )
    expect(hasAnyGuestSession()).toBe(false)
  })

  it('localStorage ném lỗi → false', () => {
    const spy = vi.spyOn(Storage.prototype, 'length', 'get').mockImplementation(() => {
      throw new Error('blocked')
    })
    expect(hasAnyGuestSession()).toBe(false)
    spy.mockRestore()
  })
})
