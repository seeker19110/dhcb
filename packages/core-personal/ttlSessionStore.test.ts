// Canh bộ lưu phiên có hạn (changelog 0538): TTL trượt đúng mốc, trần mỗi người đóng phiên cũ
// nhất, trần toàn cục từ chối 503, chủ phiên khác không đọc được, bộ dọn nền chạy/dừng đúng.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createPracticeSessionStore,
  PRACTICE_SESSION_IDLE_TTL_MS,
  PRACTICE_SESSION_MAX_PER_PERSON,
  SESSION_GONE_CODE,
  SessionCapacityError,
  SessionGoneError,
  TtlSessionStore,
  type TtlSessionStoreOptions,
} from './ttlSessionStore.js'

const TTL = 10_000
const SWEEP = 1_000
const BASE: TtlSessionStoreOptions = {
  idleTtlMs: TTL,
  maxPerOwner: 3,
  maxTotal: 5,
  sweepIntervalMs: SWEEP,
}

let store: TtlSessionStore<string>

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-10-08T00:00:00Z'))
  store = new TtlSessionStore<string>(BASE)
})

afterEach(() => {
  store.dispose()
  vi.useRealTimers()
})

describe('TtlSessionStore — TTL trượt', () => {
  it('còn hạn ở mốc TTL − 1ms, hết hạn ĐÚNG mốc TTL', () => {
    store.create('s1', 'A', 'v1')
    vi.advanceTimersByTime(TTL - 1)
    // Chỉ "nhìn" bằng sweep để không gia hạn — sweep tại TTL−1 không được dọn.
    expect(store.sweep()).toBe(0)
    expect(store.size).toBe(1)
    vi.advanceTimersByTime(1)
    expect(store.get('s1', 'A')).toBeUndefined()
    expect(store.size).toBe(0)
  })

  it('mỗi lần chủ phiên đọc thì gia hạn lại từ đầu (trượt)', () => {
    store.create('s1', 'A', 'v1')
    vi.advanceTimersByTime(TTL - 1)
    expect(store.get('s1', 'A')).toBe('v1')
    vi.advanceTimersByTime(TTL - 1)
    expect(store.get('s1', 'A')).toBe('v1')
    vi.advanceTimersByTime(TTL)
    expect(store.get('s1', 'A')).toBeUndefined()
  })

  it('require() ném SessionGoneError 404 với mã ổn định khi phiên đã hết hạn', () => {
    store.create('s1', 'A', 'v1')
    vi.advanceTimersByTime(TTL)
    let caught: unknown
    try {
      store.require('s1', 'A')
    } catch (err) {
      caught = err
    }
    expect(caught).toBeInstanceOf(SessionGoneError)
    expect((caught as SessionGoneError).status).toBe(404)
    expect((caught as SessionGoneError).code).toBe(SESSION_GONE_CODE)
    expect((caught as SessionGoneError).message).toMatch(/Bắt đầu lại/)
  })

  it('bộ dọn nền tự xoá phiên hết hạn kể cả khi không ai đọc lại', () => {
    store.create('s1', 'A', 'v1')
    store.create('s2', 'B', 'v2')
    expect(store.sweeperRunning).toBe(true)
    vi.advanceTimersByTime(TTL + SWEEP)
    expect(store.size).toBe(0)
    // Hết phiên thì bộ dọn tự dừng — không còn timer treo.
    expect(store.sweeperRunning).toBe(false)
    expect(vi.getTimerCount()).toBe(0)
  })

  it('dọn theo thứ tự hoạt động: phiên vừa được chạm không bị dọn cùng phiên cũ', () => {
    store.create('old', 'A', 'v-old')
    vi.advanceTimersByTime(TTL / 2)
    store.create('new', 'B', 'v-new')
    vi.advanceTimersByTime(TTL / 2)
    // Bộ dọn nền (chu kỳ SWEEP) đã chạy ở mốc này: phiên cũ đi, phiên mới còn.
    expect(store.size).toBe(1)
    expect(store.get('old', 'A')).toBeUndefined()
    expect(store.get('new', 'B')).toBe('v-new')
  })

  it('dispose() dừng timer và xoá sạch phiên', () => {
    store.create('s1', 'A', 'v1')
    expect(vi.getTimerCount()).toBe(1)
    store.dispose()
    expect(vi.getTimerCount()).toBe(0)
    expect(store.size).toBe(0)
  })
})

describe('TtlSessionStore — chủ phiên', () => {
  it('người khác đọc → undefined (giống hệt phiên không tồn tại), require → 404', () => {
    store.create('s1', 'A', 'v1')
    expect(store.get('s1', 'B')).toBeUndefined()
    expect(store.get('khong-co', 'B')).toBeUndefined()
    expect(() => store.require('s1', 'B')).toThrow(SessionGoneError)
    expect(store.get('s1', 'A')).toBe('v1')
  })

  it('người khác đọc thử KHÔNG gia hạn hộ phiên', () => {
    store.create('s1', 'A', 'v1')
    vi.advanceTimersByTime(TTL - 1)
    expect(store.get('s1', 'B')).toBeUndefined()
    vi.advanceTimersByTime(1)
    expect(store.get('s1', 'A')).toBeUndefined()
  })
})

describe('TtlSessionStore — trần mỗi người', () => {
  it('chạm trần thì đóng phiên CŨ NHẤT của chính người đó, không đụng người khác', () => {
    store.create('b1', 'B', 'vb')
    store.create('a1', 'A', 'v1')
    store.create('a2', 'A', 'v2')
    store.create('a3', 'A', 'v3')
    const { evictedIds } = store.create('a4', 'A', 'v4')
    expect(evictedIds).toEqual(['a1'])
    expect(store.get('a1', 'A')).toBeUndefined()
    expect(store.countForOwner('A')).toBe(3)
    expect(store.get('b1', 'B')).toBe('vb')
  })

  it('"cũ nhất" tính theo lần hoạt động gần nhất, không theo lúc tạo', () => {
    store.create('a1', 'A', 'v1')
    store.create('a2', 'A', 'v2')
    store.create('a3', 'A', 'v3')
    vi.advanceTimersByTime(10)
    store.get('a1', 'A') // a1 vừa dùng → a2 thành phiên ít hoạt động nhất
    const { evictedIds } = store.create('a4', 'A', 'v4')
    expect(evictedIds).toEqual(['a2'])
    expect(store.get('a1', 'A')).toBe('v1')
  })

  it('id trùng là lỗi lập trình, không âm thầm ghi đè', () => {
    store.create('s1', 'A', 'v1')
    expect(() => store.create('s1', 'A', 'v2')).toThrow(/đã tồn tại/)
  })
})

describe('TtlSessionStore — trần toàn tiến trình', () => {
  function fillTo(max: number) {
    // Mỗi người 1 phiên để trần mỗi người không kích hoạt.
    for (let i = 0; i < max; i++) store.create(`s${i}`, `owner-${i}`, `v${i}`)
  }

  it('đầy thì từ chối phiên mới bằng 503, KHÔNG đuổi phiên của người khác', () => {
    fillTo(BASE.maxTotal)
    let caught: unknown
    try {
      store.create('extra', 'newcomer', 'vx')
    } catch (err) {
      caught = err
    }
    expect(caught).toBeInstanceOf(SessionCapacityError)
    expect((caught as SessionCapacityError).status).toBe(503)
    expect((caught as SessionCapacityError).message).toMatch(/quá tải/)
    expect(store.size).toBe(BASE.maxTotal)
    expect(store.get('s0', 'owner-0')).toBe('v0')
  })

  it('đầy nhưng có phiên hết hạn thì dọn trước rồi nhận phiên mới', () => {
    fillTo(BASE.maxTotal)
    vi.advanceTimersByTime(TTL)
    expect(() => store.create('extra', 'newcomer', 'vx')).not.toThrow()
    expect(store.size).toBe(1)
  })

  it('người đã đủ trần riêng vẫn mở được phiên mới khi tiến trình đầy (đổi phiên cũ của họ)', () => {
    store = new TtlSessionStore<string>({ ...BASE, maxPerOwner: 2, maxTotal: 4 })
    store.create('a1', 'A', 'v1')
    store.create('a2', 'A', 'v2')
    store.create('b1', 'B', 'vb1')
    store.create('b2', 'B', 'vb2')
    const { evictedIds } = store.create('a3', 'A', 'v3')
    expect(evictedIds).toEqual(['a1'])
    expect(store.size).toBe(4)
    expect(() => store.create('c1', 'C', 'vc')).toThrow(SessionCapacityError)
  })
})

describe('TtlSessionStore — cấu hình', () => {
  it('từ chối cấu hình vô nghĩa', () => {
    expect(() => new TtlSessionStore({ ...BASE, idleTtlMs: 0 })).toThrow()
    expect(() => new TtlSessionStore({ ...BASE, sweepIntervalMs: 0 })).toThrow()
    expect(() => new TtlSessionStore({ ...BASE, maxPerOwner: 0 })).toThrow()
    expect(() => new TtlSessionStore({ ...BASE, maxPerOwner: 9, maxTotal: 3 })).toThrow()
  })

  it('createPracticeSessionStore dùng đúng hằng chuẩn (30 phút, 5 phiên/người)', () => {
    const practice = createPracticeSessionStore<string>()
    try {
      for (let i = 0; i <= PRACTICE_SESSION_MAX_PER_PERSON; i++) practice.create(`p${i}`, 'A', 'v')
      expect(practice.countForOwner('A')).toBe(PRACTICE_SESSION_MAX_PER_PERSON)
      vi.advanceTimersByTime(PRACTICE_SESSION_IDLE_TTL_MS - 1)
      expect(practice.get(`p${PRACTICE_SESSION_MAX_PER_PERSON}`, 'A')).toBe('v')
      expect(PRACTICE_SESSION_IDLE_TTL_MS).toBe(30 * 60 * 1000)
    } finally {
      practice.dispose()
    }
  })
})
