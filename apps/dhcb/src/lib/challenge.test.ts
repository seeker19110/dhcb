import { describe, it, expect, beforeEach } from 'vitest'
import {
  challengeSessionOutcome,
  countSentences,
  getChallenge,
  startChallenge,
  saveEntry,
  getWeekCells,
  getTotalSubmitted,
  nextChallengeDay,
  getKeepDates,
  countWords,
  calcWpm,
  mergeCloudEntries,
  CHALLENGE_WEEK_DAYS,
  type ChallengeState,
  type ChallengeEntryLocal,
  type CloudEntryForMerge,
} from './challenge'
import { vnDateStr } from './date'

// ── Tiện ích dựng dữ liệu test ───────────────────────────────────────────────
const dayAgo = (n: number) => {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return vnDateStr(d)
}
const today = () => dayAgo(0)

// Entry tối thiểu để nộp (round do saveEntry tự đóng dấu).
const mkEntry = (day: string, challengeDay = 1): Omit<ChallengeEntryLocal, 'round'> => ({
  day,
  challengeDay,
  topicDay: challengeDay,
  transcript: 'hello world today',
  feedback: null,
  durationSec: 30,
  wordCount: 3,
})

// Dựng thẳng 1 challenge (không qua localStorage) để test các hàm thuần:
// `submittedDaysAgo` = danh sách "n ngày trước" ĐÃ nộp bài.
const mkChallenge = (
  startDaysAgo: number,
  submittedDaysAgo: number[],
  round = 1,
): ChallengeState => {
  const entries: Record<string, ChallengeEntryLocal> = {}
  submittedDaysAgo.forEach((n, i) => {
    const day = dayAgo(n)
    entries[day] = { ...mkEntry(day, i + 1), round }
  })
  return { startDate: dayAgo(startDaysAgo), round, entries }
}

describe('startChallenge / getChallenge', () => {
  beforeEach(() => localStorage.clear())

  it('chưa có thử thách → khởi tạo mới, startDate = hôm nay (giờ VN)', () => {
    expect(getChallenge('u1')).toBeNull()
    const c = startChallenge('u1')
    expect(c.startDate).toBe(today())
    expect(Object.keys(c.entries)).toHaveLength(0)
  })

  it('đã có thử thách → GIỮ NGUYÊN (chu kỳ tuần không mở "vòng mới")', () => {
    startChallenge('u1')
    saveEntry('u1', mkEntry(dayAgo(1)))
    const again = startChallenge('u1')
    expect(Object.keys(again.entries)).toHaveLength(1) // entries còn nguyên
    expect(again.round).toBe(1) // không nhảy vòng
  })

  it('dữ liệu localStorage hỏng → coi như chưa có thử thách, không throw', () => {
    localStorage.setItem('et_challenge_u1', '{"broken":')
    expect(getChallenge('u1')).toBeNull()
    localStorage.setItem('et_challenge_u1', JSON.stringify({ startDate: 1, round: 'x' }))
    expect(getChallenge('u1')).toBeNull()
  })

  it('mỗi người dùng 1 key riêng — không lẫn nhau', () => {
    startChallenge('u1')
    expect(getChallenge('u2')).toBeNull()
  })
})

describe('saveEntry — idempotent theo ngày (ca biên mục 4.3)', () => {
  beforeEach(() => localStorage.clear())

  it('nộp 2 lần cùng 1 ngày → ghi đè, vẫn chỉ 1 entry', () => {
    startChallenge('u1')
    saveEntry('u1', mkEntry(today()))
    const c = saveEntry('u1', { ...mkEntry(today()), transcript: 'second take', wordCount: 2 })
    expect(Object.keys(c.entries)).toHaveLength(1)
    expect(c.entries[today()]?.transcript).toBe('second take')
    expect(getTotalSubmitted(c)).toBe(1) // nộp lại KHÔNG tăng tổng số bài
  })

  it('chưa startChallenge mà nộp → tự khởi tạo (phòng UI gọi lệch thứ tự)', () => {
    const c = saveEntry('u1', mkEntry(today()))
    expect(c.entries[today()]).toBeTruthy()
  })
})

describe('getWeekCells — bảng 7 ô Thứ 2 → CN của tuần chứa hôm nay', () => {
  it('luôn trả đúng 7 ô, ngày liên tiếp, bắt đầu bằng Thứ 2', () => {
    // 2026-07-15 là Thứ 4 → tuần bắt đầu 2026-07-13 (Thứ 2)
    const c = mkChallenge(0, [])
    const cells = getWeekCells(c, '2026-07-15')
    expect(cells).toHaveLength(CHALLENGE_WEEK_DAYS)
    expect(cells[0]?.date).toBe('2026-07-13')
    expect(cells[6]?.date).toBe('2026-07-19')
  })

  it('gắn đúng entry vào ô theo ngày; ngày ngoài tuần KHÔNG lọt vào', () => {
    const entries: Record<string, ChallengeEntryLocal> = {
      '2026-07-12': { ...mkEntry('2026-07-12'), round: 1 }, // CN tuần trước — ngoài tuần
      '2026-07-13': { ...mkEntry('2026-07-13'), round: 1 }, // T2 tuần này
      '2026-07-15': { ...mkEntry('2026-07-15'), round: 1 }, // T4 (hôm nay)
    }
    const c: ChallengeState = { startDate: '2026-07-01', round: 1, entries }
    const cells = getWeekCells(c, '2026-07-15')
    expect(cells.filter((x) => x.entry)).toHaveLength(2) // 12/07 bị loại
    expect(cells[0]?.entry?.day).toBe('2026-07-13')
    expect(cells[2]?.entry?.day).toBe('2026-07-15')
  })

  it('đánh dấu isToday đúng ô + isFuture cho ngày chưa tới', () => {
    const c = mkChallenge(0, [])
    const cells = getWeekCells(c, '2026-07-15') // Thứ 4
    expect(cells.map((x) => x.isToday)).toEqual([false, false, true, false, false, false, false])
    expect(cells.map((x) => x.isFuture)).toEqual([false, false, false, true, true, true, true])
  })

  it('hôm nay là Chủ nhật → ô cuối là hôm nay, không có ngày tương lai', () => {
    const c = mkChallenge(0, [])
    const cells = getWeekCells(c, '2026-07-19') // CN
    expect(cells[6]?.isToday).toBe(true)
    expect(cells.some((x) => x.isFuture)).toBe(false)
  })

  it('entry vòng CŨ nằm trong tuần này vẫn hiện (khóa ngày là duy nhất, không phân vòng)', () => {
    const entries: Record<string, ChallengeEntryLocal> = {
      '2026-07-14': { ...mkEntry('2026-07-14'), round: 1 },
    }
    const c: ChallengeState = { startDate: '2026-07-01', round: 2, entries }
    const cells = getWeekCells(c, '2026-07-15')
    expect(cells[1]?.entry?.day).toBe('2026-07-14')
  })
})

describe('getTotalSubmitted / nextChallengeDay', () => {
  it('đếm TOÀN BỘ bài đã nộp (mọi vòng cũ lẫn mới)', () => {
    const c = mkChallenge(10, [10, 5, 0])
    expect(getTotalSubmitted(c)).toBe(3)
    expect(getTotalSubmitted(mkChallenge(0, []))).toBe(0)
  })

  it('nextChallengeDay: hôm nay chưa nộp → tổng + 1; đã nộp → giữ số cũ (idempotent)', () => {
    const c = mkChallenge(5, [5, 3]) // 2 bài, hôm nay chưa nộp
    expect(nextChallengeDay(c, today())).toBe(3)
    const submitted = mkChallenge(5, [5, 3, 0]) // hôm nay đã nộp (challengeDay = 3)
    expect(nextChallengeDay(submitted, today())).toBe(3) // nộp lại không nhảy số
  })
})

describe('getKeepDates — giữ 7 video của các ngày nộp gần nhất', () => {
  it('10 ngày nộp → chỉ giữ 7 ngày cuối', () => {
    const c = mkChallenge(9, [9, 8, 7, 6, 5, 4, 3, 2, 1, 0])
    const keep = getKeepDates(c)
    expect(keep).toHaveLength(7)
    expect(keep).toContain(dayAgo(0))
    expect(keep).toContain(dayAgo(6))
    expect(keep).not.toContain(dayAgo(7)) // ngoài diện giữ → sẽ bị dọn
    expect(keep).not.toContain(dayAgo(9))
  })

  it('ít hơn 7 ngày nộp → giữ tất cả; chưa nộp gì → rỗng', () => {
    const c = mkChallenge(3, [3, 2, 0])
    expect(getKeepDates(c)).toEqual([dayAgo(3), dayAgo(2), dayAgo(0)])
    expect(getKeepDates(mkChallenge(0, []))).toEqual([])
  })
})

describe('mergeCloudEntries — đồng bộ đổi máy không mất tiến độ', () => {
  beforeEach(() => localStorage.clear())

  const mkCloud = (
    day: string,
    round: number,
    feedback: string | null = null,
  ): CloudEntryForMerge => ({
    day,
    round,
    challengeDay: 1,
    topicDay: 1,
    transcript: 'from cloud',
    feedback,
    durationSec: 20,
    wordCount: 2,
  })

  it('không có gì từ cloud → giữ nguyên local (kể cả null)', () => {
    expect(mergeCloudEntries('u1', [])).toBeNull()
    startChallenge('u1')
    const before = getChallenge('u1')
    expect(mergeCloudEntries('u1', [])).toEqual(before)
  })

  it('máy MỚI (chưa có challenge local) → dựng challenge từ cloud, startDate = ngày sớm nhất của vòng mới nhất', () => {
    const cloud = [mkCloud(dayAgo(3), 1), mkCloud(dayAgo(1), 1), mkCloud(dayAgo(0), 1)]
    const merged = mergeCloudEntries('u1', cloud)
    expect(merged).not.toBeNull()
    expect(merged!.startDate).toBe(dayAgo(3))
    expect(Object.keys(merged!.entries)).toHaveLength(3)
    // Đã ghi vào localStorage — gọi lại getChallenge phải thấy đúng dữ liệu vừa hợp nhất
    expect(getChallenge('u1')).toEqual(merged)
  })

  it('máy ĐÃ có challenge → KHÔNG đụng startDate/round, chỉ bổ sung entry thiếu', () => {
    startChallenge('u1') // startDate = hôm nay, round 1
    saveEntry('u1', mkEntry(today()))
    const before = getChallenge('u1')!
    const cloud = [mkCloud(dayAgo(2), 1), mkCloud(today(), 1)] // dayAgo(2) mới với máy này
    const merged = mergeCloudEntries('u1', cloud)!
    expect(merged.startDate).toBe(before.startDate)
    expect(merged.round).toBe(before.round)
    expect(Object.keys(merged.entries)).toHaveLength(2) // thêm dayAgo(2), giữ today()
  })

  it('cùng ngày: cloud có feedback, local chưa → cloud thắng; local đã có feedback → giữ local', () => {
    startChallenge('u1')
    saveEntry('u1', { ...mkEntry(today()), feedback: null })
    const merged1 = mergeCloudEntries('u1', [mkCloud(today(), 1, '{"praise":"tot"}')])!
    expect(merged1.entries[today()]?.feedback).toBe('{"praise":"tot"}')

    saveEntry('u1', { ...mkEntry(today()), feedback: '{"praise":"local"}' })
    const merged2 = mergeCloudEntries('u1', [mkCloud(today(), 1, '{"praise":"cloud-cu"}')])!
    expect(merged2.entries[today()]?.feedback).toBe('{"praise":"local"}')
  })
})

describe('countWords / calcWpm — ca rỗng và chia 0 (mục 4.3)', () => {
  it('countWords: chuỗi rỗng/toàn khoảng trắng → 0; tách theo mọi khoảng trắng', () => {
    expect(countWords('')).toBe(0)
    expect(countWords('   \n\t ')).toBe(0)
    expect(countWords('hello')).toBe(1)
    expect(countWords('  hello   world \n today ')).toBe(3)
  })

  it('calcWpm: 0 giây / 0 từ → 0 (không chia 0, không NaN)', () => {
    expect(calcWpm(0, 0)).toBe(0)
    expect(calcWpm(30, 0)).toBe(0)
    expect(calcWpm(0, 60)).toBe(0)
  })

  it('calcWpm: tính đúng và LÀM TRÒN', () => {
    expect(calcWpm(30, 60)).toBe(30) // 30 từ / 1 phút
    expect(calcWpm(25, 30)).toBe(50) // 25 từ / 30s = 50 wpm
    expect(calcWpm(10, 45)).toBe(13) // 13.33 → 13
  })
})

describe('challengeSessionOutcome — "sự thật" cho màn kết SessionDone', () => {
  it('quay/ghi âm: đếm câu theo dấu kết câu', () => {
    const o = challengeSessionOutcome({
      day: '2026-10-11',
      transcript: 'I love Hanoi. The food is great! Do you like pho?',
      isTyped: false,
      durationSec: 55,
    })
    expect(o).toMatchObject({ kind: 'speaking', steps: 3, contentId: 'challenge:2026-10-11' })
  })

  it('STT không chấm câu vẫn là 1 câu; chữ rỗng là 0 (không mở màn kết)', () => {
    expect(countSentences('i went to the market with my mother')).toBe(1)
    const rong = challengeSessionOutcome({
      day: 'd',
      transcript: '   ',
      isTyped: false,
      durationSec: 0,
    })
    expect(rong.steps).toBe(0)
  })

  it('gõ chữ: một đoạn đã viết', () => {
    const o = challengeSessionOutcome({
      day: 'd',
      transcript: 'Hôm nay tôi đi chợ. Trời đẹp.',
      isTyped: true,
      durationSec: 0,
    })
    expect(o).toMatchObject({ kind: 'writing', steps: 1 })
  })
})
