import { describe, it, expect } from 'vitest'
import {
  mergeSrsMap,
  mergeExamMap,
  mergeByTimestamp,
  mergeArrayUnion,
  resolveHard,
} from './progressMerge'

describe('mergeArrayUnion', () => {
  it('hợp 2 mảng, không trùng lặp — chỉ tăng, không mất phần tử nào', () => {
    expect(mergeArrayUnion(['a', 'b'], ['b', 'c'])).toEqual(['a', 'b', 'c'])
  })

  it('1 bên rỗng → giữ nguyên bên còn lại', () => {
    expect(mergeArrayUnion([], ['a'])).toEqual(['a'])
    expect(mergeArrayUnion(['a'], [])).toEqual(['a'])
  })

  it('phần tử bị "bỏ đánh dấu" ở client (không còn trong mảng gửi lên) vẫn được server giữ lại nếu đã từng có trên server', () => {
    // Mô phỏng: server đang có 'book' (máy A đã học), máy B đồng bộ gửi lên mảng không có 'book'
    // (do B chưa từng thấy 'book', không phải B chủ động bỏ đánh dấu) → 'book' KHÔNG được mất.
    expect(mergeArrayUnion(['book'], ['run'])).toEqual(['book', 'run'])
  })
})

describe('mergeSrsMap', () => {
  it('giữ thẻ có reps cao hơn giữa 2 bên', () => {
    const a = { book: { reps: 5 }, go: { reps: 1 } }
    const b = { book: { reps: 2 }, run: { reps: 3 } }
    expect(mergeSrsMap(a, b)).toEqual({ book: { reps: 5 }, go: { reps: 1 }, run: { reps: 3 } })
  })

  it('thẻ chỉ có ở 1 bên → giữ nguyên', () => {
    expect(mergeSrsMap({ book: { reps: 1 } }, {})).toEqual({ book: { reps: 1 } })
    expect(mergeSrsMap({}, { go: { reps: 1 } })).toEqual({ go: { reps: 1 } })
  })

  it('giá trị không đúng dạng (không có reps số) → vẫn không throw, ưu tiên bên b khi bằng/không xác định', () => {
    expect(mergeSrsMap({ book: 'garbage' }, { book: { reps: 1 } })).toEqual({ book: { reps: 1 } })
  })

  it('F7 (docs/changelog/0334-*.md): HOÀ reps → giữ bản có due XA HƠN, không cho client thắng vô điều kiện', () => {
    // Máy A đã ôn tới reps=3, due đẩy xa tới ngày mai (10_000). Máy B đồng bộ CHẬM, gửi lên
    // bản cũ hơn cũng reps=3 nhưng due=hôm nay (1_000) — ghi đè mù sẽ lùi lịch ôn về quá khứ.
    const a = { book: { reps: 3, due: 10_000 } }
    const b = { book: { reps: 3, due: 1_000 } }
    expect(mergeSrsMap(a, b)).toEqual({ book: { reps: 3, due: 10_000 } })
  })

  it('F7: hoà reps, due bên b mới hơn → b thắng', () => {
    const a = { book: { reps: 3, due: 1_000 } }
    const b = { book: { reps: 3, due: 10_000 } }
    expect(mergeSrsMap(a, b)).toEqual({ book: { reps: 3, due: 10_000 } })
  })

  it('AUD-XFEAT-004: hoà HOÀN TOÀN (cùng reps, cùng due) → giữ đúng object đang lưu `a`', () => {
    const stored = { due: 1_000, reps: 3, state: 2 }
    const merged = mergeSrsMap({ book: stored }, { book: { state: 2, reps: 3, due: 1_000 } })
    expect(merged.book).toBe(stored)
  })

  it('F7: hoà reps nhưng thiếu `due` số hợp lệ ở một/cả hai bên → không throw, coi như thua', () => {
    expect(mergeSrsMap({ book: { reps: 1, due: 5 } }, { book: { reps: 1 } })).toEqual({
      book: { reps: 1, due: 5 },
    })
    expect(mergeSrsMap({ book: { reps: 1 } }, { book: { reps: 1, due: 5 } })).toEqual({
      book: { reps: 1, due: 5 },
    })
  })
})

describe('mergeExamMap', () => {
  it('hợp nhất theo cấp — passed=OR, bestPct/attempts=max, lastAt=mới hơn', () => {
    const a = { a1: { passed: false, bestPct: 40, attempts: 1, lastAt: '2026-08-01T00:00:00Z' } }
    const b = { a1: { passed: true, bestPct: 90, attempts: 2, lastAt: '2026-08-02T00:00:00Z' } }
    expect(mergeExamMap(a, b)).toEqual({
      a1: { passed: true, bestPct: 90, attempts: 2, lastAt: '2026-08-02T00:00:00Z' },
    })
  })

  it('cấp chỉ có ở 1 bên → giữ nguyên', () => {
    const a = { a1: { passed: true, bestPct: 90, attempts: 1, lastAt: '2026-08-01T00:00:00Z' } }
    expect(mergeExamMap(a, {})).toEqual(a)
    expect(mergeExamMap({}, a)).toEqual(a)
  })
})

describe('mergeByTimestamp', () => {
  it('giữ bản có mốc thời gian mới hơn', () => {
    const older = { goal: 5, updatedAt: '2026-08-01T00:00:00Z' }
    const newer = { goal: 10, updatedAt: '2026-08-02T00:00:00Z' }
    expect(mergeByTimestamp(older, newer, 'updatedAt')).toEqual(newer)
    expect(mergeByTimestamp(newer, older, 'updatedAt')).toEqual(newer)
  })

  it('bản rỗng {} (chưa từng có) luôn thua bản đã có dữ liệu', () => {
    const has = { cefr: 'A1', appLevel: 'A1', lastAt: '2026-08-01T00:00:00Z' }
    expect(mergeByTimestamp({}, has, 'lastAt')).toEqual(has)
    expect(mergeByTimestamp(has, {}, 'lastAt')).toEqual(has)
  })

  it('cả 2 rỗng → trả về rỗng, không throw', () => {
    expect(mergeByTimestamp({}, {}, 'lastAt')).toEqual({})
  })

  it('F8 (docs/changelog/0373-*.md): clientClock (client_updated_at cả request) phân định đúng khi field nội bộ lệch đồng hồ máy', () => {
    // Máy A gửi lúc 10h thật (clientClock mới hơn) nhưng tự ghi `updatedAt` SAI vì đồng hồ hệ
    // thống của máy A chạy lùi — field nội bộ nói A cũ hơn, nhưng clientClock nói A mới hơn.
    const existing = { goal: 5, updatedAt: '2026-09-19T09:00:00.000Z' } // đã lưu, gửi lúc 09h
    const incoming = { goal: 10, updatedAt: '2026-09-19T08:00:00.000Z' } // gửi SAU (10h) nhưng đồng hồ lùi
    const result = mergeByTimestamp(existing, incoming, 'updatedAt', {
      existing: '2026-09-19T09:00:00.000Z',
      incoming: '2026-09-19T10:00:00.000Z',
    })
    expect(result).toEqual(incoming) // clientClock nói incoming mới hơn → incoming thắng
  })

  it('F8: race 2 request gần như đồng thời — clientClock của request cũ hơn KHÔNG được thắng dù tới server sau', () => {
    const existing = { goal: 5, updatedAt: '2026-09-19T09:00:00.000Z' }
    const incoming = { goal: 1, updatedAt: '2026-09-19T09:05:00.000Z' } // field nội bộ mới hơn
    // Nhưng clientClock (nguồn nhất quán) nói incoming thực ra được sinh TRƯỚC existing.
    const result = mergeByTimestamp(existing, incoming, 'updatedAt', {
      existing: '2026-09-19T09:10:00.000Z',
      incoming: '2026-09-19T09:00:00.000Z',
    })
    expect(result).toEqual(existing)
  })

  it('F8: clientClock bằng nhau (idempotent retry) hoặc thiếu 1 bên → rơi về field nội bộ như cũ', () => {
    const older = { goal: 5, updatedAt: '2026-08-01T00:00:00Z' }
    const newer = { goal: 10, updatedAt: '2026-08-02T00:00:00Z' }
    expect(
      mergeByTimestamp(older, newer, 'updatedAt', {
        existing: '2026-09-19T09:00:00.000Z',
        incoming: '2026-09-19T09:00:00.000Z',
      }),
    ).toEqual(newer)
    expect(
      mergeByTimestamp(older, newer, 'updatedAt', {
        existing: null,
        incoming: '2026-09-19T09:00:00.000Z',
      }),
    ).toEqual(newer)
  })
})

describe('resolveHard (F6)', () => {
  it('client_updated_at của request CŨ HƠN bản đã lưu → bỏ qua thay đổi hard, giữ bản đã lưu', () => {
    // Race: request B tới SAU ở tầng mạng nhưng đồng hồ client của B cũ hơn bản A đã lưu.
    const result = resolveHard(
      ['book'],
      ['run'],
      '2026-09-19T10:00:00.000Z', // đã lưu lúc 10h
      '2026-09-19T09:00:00.000Z', // request hiện tại sinh lúc 9h (cũ hơn) nhưng tới server sau
    )
    expect(result).toEqual(['book'])
  })

  it('client_updated_at của request MỚI HƠN bản đã lưu → ghi đè như bình thường', () => {
    const result = resolveHard(
      ['book'],
      ['run'],
      '2026-09-19T09:00:00.000Z',
      '2026-09-19T10:00:00.000Z',
    )
    expect(result).toEqual(['run'])
  })

  it('thiếu client_updated_at ở request hiện tại (client cũ chưa gửi sync) nhưng bản đã lưu có → giữ bản đã lưu', () => {
    expect(resolveHard(['book'], ['run'], '2026-09-19T09:00:00.000Z', null)).toEqual(['book'])
  })

  it('thiếu client_updated_at ở CẢ HAI bên → không throw, giữ hành vi ghi đè tự do cũ (client thắng)', () => {
    expect(resolveHard(['book'], ['run'], null, undefined)).toEqual(['run'])
    expect(resolveHard(['book'], [], undefined, undefined)).toEqual([])
  })

  it('bản đã lưu thiếu client_updated_at (dòng cũ trước migration) nhưng request hiện tại có → request thắng', () => {
    expect(resolveHard(['book'], ['run'], null, '2026-09-19T09:00:00.000Z')).toEqual(['run'])
  })
})
