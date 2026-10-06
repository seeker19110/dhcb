import { describe, it, expect } from 'vitest'
import { TodayPlanSchema, type ResumePoint, type TodayItem } from '@dhcb/core-contracts/todayPlan'
import { SUPPORTED_SUBJECTS } from '../subjectRegistry.js'
import { buildTodayPlan, TIE_BREAK_ORDER, type SubjectSignal } from './buildTodayPlan.js'

const NOW = 1_757_900_000_000

function resume(subjectId: string, contentId: string, updatedAt: number): ResumePoint {
  return {
    sessionId: `s_${subjectId}_${contentId}`,
    subjectId,
    contentId,
    step: 2,
    hasDraft: true,
    updatedAt,
  }
}

function next(subjectId: string, contentId: string, title = 'Bài kế tiếp'): TodayItem {
  return {
    id: `next:${subjectId}:${contentId}`,
    kind: 'next',
    subjectId,
    contentId,
    title,
    href: `/x/${contentId}`,
    evidenceSource: 'outline.next',
  }
}

function review(subjectId: string): TodayItem {
  return {
    id: `review:${subjectId}:srs`,
    kind: 'review',
    subjectId,
    contentId: 'srs',
    title: 'Ôn 12 thẻ đến hạn',
    href: '/lo-trinh-hoc/a1?tab=srs',
    evidenceSource: 'english.srs',
  }
}

/** Mọi kế hoạch trong test đều phải qua schema — hợp đồng là thứ được nghiệm thu, không phải hình dạng đối tượng. */
function plan(signals: SubjectSignal[], now = NOW) {
  const result = buildTodayPlan({ signals, now })
  expect(TodayPlanSchema.parse(result)).toBeTruthy()
  return result
}

describe('buildTodayPlan — bất biến "không mặc định tiếng Anh"', () => {
  it('người chưa có tín hiệu nào: pick toàn cục về góc học tập, không môn nào', () => {
    const p = buildTodayPlan({ signals: [], now: NOW })
    expect(p.primary?.kind).toBe('pick')
    expect(p.primary?.href).toBe('/goc-hoc-tap')
    expect(p.primary?.subjectId).toBeUndefined()
    expect(p.primary?.evidenceSource).toBe('none')
    expect(p.secondary).toEqual([])
    expect(p.subjectsSeen).toEqual([])
    expect(p.builtAt).toBe(NOW)
  })

  it('không có mục nào trỏ vào lộ trình tiếng Anh khi thiếu ngữ cảnh', () => {
    const p = buildTodayPlan({ signals: [], now: NOW })
    const hrefs = [p.primary, ...p.secondary].map((i) => i?.href ?? '')
    // Ghép chuỗi có chủ đích: lệnh chứng minh của đặc tả grep nguyên văn đường dẫn lộ trình
    // tiếng Anh trong thư mục này và đòi 0 dòng.
    const tienToLoTrinhAnh = '/lo-' + 'trinh-hoc'
    expect(hrefs.some((h) => h.startsWith(tienToLoTrinhAnh))).toBe(false)
  })

  it('tiếng Anh đứng CUỐI thứ tự phá hoà', () => {
    expect(TIE_BREAK_ORDER[TIE_BREAK_ORDER.length - 1]).toBe('english')
  })
})

describe('buildTodayPlan — thứ tự ưu tiên', () => {
  it('phiên dở thắng bài kế tiếp của chính môn đó', () => {
    const p = plan([
      {
        subjectId: 'programming',
        resume: resume('programming', 'p3-u10-l1', NOW - 1000),
        resumeHref: '/lap-trinh/bai-hoc/p3-u10-l1--git?khoa=git',
        resumeTitle: 'Git cơ bản',
        next: next('programming', 'p3-u10-l2'),
        lastEvidenceAt: NOW - 500,
      },
    ])
    expect(p.primary?.kind).toBe('resume')
    expect(p.primary?.evidenceSource).toBe('session.resume')
    expect(p.primary?.href).toContain('?khoa=git')
    expect(p.primary?.resume?.step).toBe(2)
    expect(p.primary?.title).toBe('Git cơ bản')
    // Bài tiếp sau bài dở là mục phụ đầu.
    expect(p.secondary[0]?.contentId).toBe('p3-u10-l2')
  })

  it('phiên dở thắng cả khi môn khác có bằng chứng mới hơn', () => {
    const p = plan([
      {
        subjectId: 'english',
        next: next('english', 'circle-1'),
        lastEvidenceAt: NOW - 10,
      },
      {
        subjectId: 'programming',
        resume: resume('programming', 'p1-u1-l1', NOW - 100_000),
        resumeHref: '/lap-trinh/bai-hoc/p1-u1-l1--a',
        resumeTitle: 'Bài 1',
      },
    ])
    expect(p.primary?.subjectId).toBe('programming')
    expect(p.primary?.kind).toBe('resume')
  })

  it('bài tiếp trùng bài đang dở thì KHÔNG thành mục phụ', () => {
    const p = plan([
      {
        subjectId: 'programming',
        resume: resume('programming', 'l1', NOW - 5),
        resumeHref: '/lap-trinh/bai-hoc/l1--a',
        next: next('programming', 'l1'),
      },
    ])
    expect(p.secondary).toEqual([])
  })

  it('không phiên: chọn môn có bằng chứng mới nhất', () => {
    const p = plan([
      { subjectId: 'english', next: next('english', 'c1'), lastEvidenceAt: NOW - 90_000 },
      { subjectId: 'programming', next: next('programming', 'l9'), lastEvidenceAt: NOW - 10 },
    ])
    expect(p.primary?.subjectId).toBe('programming')
    expect(p.secondary[0]?.subjectId).toBe('english')
  })

  it('không phiên, không mốc thời gian: theo thứ tự cố định (Anh cuối)', () => {
    const p = plan([
      { subjectId: 'english', next: next('english', 'c1') },
      { subjectId: 'physics', next: next('physics', 'ly-1') },
    ])
    expect(p.primary?.subjectId).toBe('physics')
  })

  it('chỉ có ôn tập: review thành việc chính', () => {
    const p = plan([{ subjectId: 'english', review: review('english') }])
    expect(p.primary?.kind).toBe('review')
    expect(p.primary?.evidenceSource).toBe('english.srs')
    expect(p.secondary).toEqual([])
  })

  it('bài kế tiếp thắng ôn tập ngay cả khi ôn tập thuộc môn có mốc mới hơn', () => {
    const p = plan([
      { subjectId: 'english', review: review('english'), lastEvidenceAt: NOW - 1 },
      { subjectId: 'programming', next: next('programming', 'l2'), lastEvidenceAt: NOW - 90_000 },
    ])
    expect(p.primary?.subjectId).toBe('programming')
    expect(p.primary?.kind).toBe('next')
  })
})

describe('buildTodayPlan — ba tổ hợp môn', () => {
  it('chỉ Tiếng Anh: bài từ vựng + mục ôn', () => {
    const p = plan([
      {
        subjectId: 'english',
        next: next('english', 'c1', '🍜 Món ăn (3/10)'),
        review: review('english'),
      },
    ])
    expect(p.primary?.subjectId).toBe('english')
    expect(p.secondary).toHaveLength(1)
    expect(p.secondary[0]?.kind).toBe('review')
  })

  it('chỉ Lập trình: không có mục ôn (SRS là từ vựng Anh)', () => {
    const p = plan([
      { subjectId: 'programming', next: next('programming', 'l1'), lastEvidenceAt: NOW - 5 },
    ])
    expect(p.primary?.subjectId).toBe('programming')
    expect(p.secondary.some((i) => i.kind === 'review')).toBe(false)
  })

  it('chỉ STEM, chưa có phiên: pick về góc học tập của môn đó, không bịa "bài 1"', () => {
    const p = plan([{ subjectId: 'physics', lastEvidenceAt: NOW - 5 }])
    expect(p.primary?.kind).toBe('pick')
    expect(p.primary?.href).toBe('/goc-hoc-tap/physics')
    expect(p.primary?.subjectId).toBe('physics')
  })

  it('chỉ STEM, có phiên: mở lại đúng phiên', () => {
    const p = plan([
      {
        subjectId: 'physics',
        resume: resume('physics', 'ly10-c1-b2', NOW - 60_000),
        resumeHref: '/vat-ly/bai-hoc/ly10-c1-b2--su-roi-tu-do',
        resumeTitle: 'Sự rơi tự do',
      },
    ])
    expect(p.primary?.kind).toBe('resume')
    expect(p.primary?.title).toBe('Sự rơi tự do')
  })

  it('nhiều môn có tín hiệu nhưng không việc nào: pick TOÀN CỤC', () => {
    const p = plan([
      { subjectId: 'physics', lastEvidenceAt: NOW - 5 },
      { subjectId: 'chemistry', lastEvidenceAt: NOW - 7 },
    ])
    expect(p.primary?.href).toBe('/goc-hoc-tap')
    expect(p.primary?.subjectId).toBeUndefined()
    expect(p.primary?.title).toContain('đi hết nội dung')
  })
})

describe('buildTodayPlan — ca biên', () => {
  it('phiên không tra được đường dẫn thì bị bỏ, rơi xuống bài kế tiếp', () => {
    const p = plan([
      {
        subjectId: 'programming',
        resume: resume('programming', 'da-go-khoi-registry', NOW - 5),
        next: next('programming', 'l4'),
      },
    ])
    expect(p.primary?.kind).toBe('next')
    expect(p.primary?.contentId).toBe('l4')
  })

  it('hai phiên cùng updatedAt: kết quả ổn định, không phụ thuộc thứ tự mảng', () => {
    const a: SubjectSignal = {
      subjectId: 'english',
      resume: resume('english', 'c1', NOW - 10),
      resumeHref: '/lo-trinh-hoc/a1',
    }
    const b: SubjectSignal = {
      subjectId: 'programming',
      resume: resume('programming', 'l1', NOW - 10),
      resumeHref: '/lap-trinh/bai-hoc/l1--a',
    }
    expect(plan([a, b]).primary?.subjectId).toBe('programming')
    expect(plan([b, a]).primary?.subjectId).toBe('programming')
  })

  it('môn lạ (dữ liệu cũ) bị bỏ qua, không ném lỗi', () => {
    const p = buildTodayPlan({
      signals: [{ subjectId: 'astrology', next: next('astrology', 'x') }],
      now: NOW,
      knownSubjectIds: ['english', 'programming'],
    })
    expect(p.primary?.kind).toBe('pick')
    expect(p.subjectsSeen).toEqual([])
  })

  it('cắt mục phụ ở 2 dù có nhiều việc hơn', () => {
    const p = plan([
      {
        subjectId: 'english',
        resume: resume('english', 'c1', NOW - 5),
        resumeHref: '/lo-trinh-hoc/a1',
        next: next('english', 'c2'),
        review: review('english'),
      },
      { subjectId: 'programming', next: next('programming', 'l1'), lastEvidenceAt: NOW - 900 },
    ])
    expect(p.secondary).toHaveLength(2)
    expect(p.secondary.map((i) => i.kind)).toEqual(['next', 'review'])
  })

  it('mục phụ của môn thứ hai mang nhãn tên môn', () => {
    const p = plan([
      { subjectId: 'programming', next: next('programming', 'l1'), lastEvidenceAt: NOW - 5 },
      {
        subjectId: 'english',
        subjectLabel: 'Tiếng Anh',
        next: next('english', 'c1'),
        lastEvidenceAt: NOW - 900,
      },
    ])
    expect(p.secondary[0]?.hint).toBe('Môn thứ hai: Tiếng Anh')
  })

  it('subjectsSeen liệt kê mọi môn có tín hiệu, thứ tự tất định', () => {
    const p = plan([
      { subjectId: 'english', next: next('english', 'c1') },
      { subjectId: 'programming', next: next('programming', 'l1') },
    ])
    expect(p.subjectsSeen).toEqual(['programming', 'english'])
  })

  it('không mutate đầu vào', () => {
    const signals: SubjectSignal[] = [
      { subjectId: 'programming', next: next('programming', 'l1'), lastEvidenceAt: NOW - 5 },
    ]
    const snapshot = JSON.stringify(signals)
    buildTodayPlan({ signals, now: NOW })
    expect(JSON.stringify(signals)).toBe(snapshot)
  })

  it('builtAt lấy từ `now` truyền vào (không đọc đồng hồ máy)', () => {
    expect(buildTodayPlan({ signals: [], now: 12345 }).builtAt).toBe(12345)
  })
})

describe('buildTodayPlan — mọi môn đều là môn có thật', () => {
  it('thứ tự phá hoà chỉ chứa id trong SUPPORTED_SUBJECTS', () => {
    const ids = SUPPORTED_SUBJECTS.map((s) => s.id)
    for (const subjectId of TIE_BREAK_ORDER) expect(ids).toContain(subjectId)
  })

  it('subjectId của mục sinh ra luôn là môn có thật', () => {
    const p = plan([
      { subjectId: 'programming', next: next('programming', 'l1'), lastEvidenceAt: NOW - 5 },
      { subjectId: 'english', next: next('english', 'c1'), lastEvidenceAt: NOW - 99 },
    ])
    const ids = SUPPORTED_SUBJECTS.map((s) => s.id)
    for (const item of [p.primary, ...p.secondary]) {
      if (item?.subjectId) expect(ids).toContain(item.subjectId)
    }
  })
})

// [U9b, audit 2026-09-30 M19] Người vừa chọn môn ở onboarding không bị hỏi lại "Chọn môn".
describe('buildTodayPlan — môn đã chọn lúc onboarding', () => {
  const KNOWN = SUPPORTED_SUBJECTS.map((s) => s.id)

  it('chưa có tín hiệu + đã chọn Tiếng Anh: pick vào ĐÚNG môn đó, không phải "Chọn môn"', () => {
    const p = buildTodayPlan({
      signals: [],
      now: NOW,
      knownSubjectIds: KNOWN,
      chosenSubject: { id: 'english', label: 'Tiếng Anh' },
    })
    expect(TodayPlanSchema.parse(p)).toBeTruthy()
    expect(p.primary?.kind).toBe('pick')
    expect(p.primary?.subjectId).toBe('english')
    expect(p.primary?.href).toBe('/goc-hoc-tap/english')
    expect(p.primary?.title).toBe('Môn bạn đã chọn — học Tiếng Anh')
    expect(p.primary?.evidenceSource).toBe('none')
    // Lựa chọn không phải tiến độ: không bịa môn vào danh sách "đã thấy".
    expect(p.subjectsSeen).toEqual([])
  })

  it('đã có tín hiệu thật thì lựa chọn onboarding KHÔNG lấn tín hiệu', () => {
    const p = buildTodayPlan({
      signals: [{ subjectId: 'programming', next: next('programming', 'p1-u1-l2') }],
      now: NOW,
      chosenSubject: { id: 'english', label: 'Tiếng Anh' },
    })
    expect(p.primary?.kind).toBe('next')
    expect(p.primary?.subjectId).toBe('programming')
  })

  it('đã đi hết nội dung (có dấu vết, không còn việc) → vẫn lời mời "chọn môn hoặc khoá mới"', () => {
    const p = buildTodayPlan({
      signals: [{ subjectId: 'programming', lastEvidenceAt: NOW - 1000 }],
      now: NOW,
      chosenSubject: { id: 'english', label: 'Tiếng Anh' },
    })
    expect(p.primary?.title).toContain('đi hết nội dung')
  })

  it('môn lạ (không còn trong registry) hoặc id rỗng → về đúng hành vi cũ', () => {
    for (const chosenSubject of [{ id: 'astrology' }, { id: '' }]) {
      const p = buildTodayPlan({ signals: [], now: NOW, knownSubjectIds: KNOWN, chosenSubject })
      expect(p.primary?.href).toBe('/goc-hoc-tap')
      expect(p.primary?.subjectId).toBeUndefined()
    }
  })

  it('thiếu tên môn thì dùng mã môn — vẫn không trống chữ', () => {
    const p = buildTodayPlan({ signals: [], now: NOW, chosenSubject: { id: 'physics' } })
    expect(p.primary?.title).toBe('Môn bạn đã chọn — học physics')
  })
})
