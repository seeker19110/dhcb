// Ba dự án trục T1/T2/T3 (hạ tầng 2026-10-09, docs/specs/2026-10-09-du-an-truc-t2-t3-ha-tang.md).
//
// Hai phần:
//  1. Hạ tầng: getProjectStages / PROJECT_TRACKS.available suy từ dữ liệu / normalizeProjectTrack.
//  2. HỢP ĐỒNG cho PR nội dung T2/T3 — các test dưới chạy trên mảng bước thật của T2/T3. Hôm nay
//     mảng rỗng nên chúng đạt hiển nhiên; PR nội dung điền bước sai khuôn là đỏ ngay ở đây.
import { describe, expect, it } from 'vitest'
import {
  PROJECT_STAGES,
  ProjectStepSchema,
  getProjectStages,
  getProjectStep,
  type ProjectStage,
} from './projectSteps.js'
import {
  PROJECT_TRACKS,
  PROJECT_TRACK_IDS,
  getProjectTrack,
  isProjectTrackAvailable,
  isTrackAvailable,
  normalizeProjectTrack,
} from './projectTracks.js'
import { PROJECT_STAGE_LEVELS, parseProjectStepId, projectStepIdPrefix } from './projectTrackIds.js'
import { PROGRAMMING_LEVELS } from './curriculum.js'
import { P1_PROJECT_STEPS } from './projectSteps.js'

const UNIT_IDS = new Set(PROGRAMMING_LEVELS.flatMap((l) => l.units.map((u) => u.id)))

describe('getProjectStages', () => {
  it('T1 trả ĐÚNG mảng PROJECT_STAGES cũ (cùng tham chiếu — không gãy chỗ đang dùng)', () => {
    expect(getProjectStages('T1')).toBe(PROJECT_STAGES)
  })

  it('mọi dự án có đủ 5 chặng P1–P5 theo thứ tự, tiêu đề "Chặng P<n> — …" không trùng', () => {
    for (const track of PROJECT_TRACK_IDS) {
      const stages = getProjectStages(track)
      expect(
        stages.map((s) => s.level),
        track,
      ).toEqual([...PROJECT_STAGE_LEVELS])
      for (const s of stages) {
        expect(s.title, `${track} ${s.level}`).toMatch(
          new RegExp(`^Chặng ${s.level.toUpperCase()} — \\S`),
        )
      }
      expect(new Set(stages.map((s) => s.title)).size).toBe(stages.length)
    }
  })

  it('T2/T3 đặt tên chặng RIÊNG (không chép nguyên tên chặng của T1)', () => {
    const t1Titles = new Set(PROJECT_STAGES.map((s) => s.title))
    for (const track of ['T2', 'T3'] as const) {
      for (const s of getProjectStages(track)) expect(t1Titles.has(s.title)).toBe(false)
    }
  })
})

describe('PROJECT_TRACKS', () => {
  it('đủ ba mã T1/T2/T3 đúng thứ tự, có tên/mô tả/file chính/code khởi đầu', () => {
    expect(PROJECT_TRACKS.map((t) => t.id)).toEqual(['T1', 'T2', 'T3'])
    for (const t of PROJECT_TRACKS) {
      expect(t.name.length).toBeGreaterThan(0)
      expect(t.description.length).toBeGreaterThan(0)
      expect(t.productNoun.length).toBeGreaterThan(0)
      expect(t.mainFile).toMatch(/^[a-z0-9_][a-z0-9_.-]{0,99}$/)
      expect(t.starterCode).toContain(t.mainFile)
    }
    // Mỗi dự án một file chính riêng — workspace đã tách tiền tố, nhưng tên khác nhau cho dễ nhận.
    expect(new Set(PROJECT_TRACKS.map((t) => t.mainFile)).size).toBe(3)
  })

  it('isTrackAvailable: mở khi có ÍT NHẤT MỘT bước ở bất kỳ chặng nào', () => {
    const empty: ProjectStage[] = PROJECT_STAGE_LEVELS.map((level) => ({
      level,
      title: 'x',
      steps: [],
    }))
    expect(isTrackAvailable(empty)).toBe(false)
    expect(isTrackAvailable([])).toBe(false)
    const oneStep = empty.map((s, i) => (i === 2 ? { ...s, steps: [P1_PROJECT_STEPS[0]!] } : s))
    expect(isTrackAvailable(oneStep)).toBe(true)
  })

  it('`available` SUY từ dữ liệu bước, không ghi cứng', () => {
    for (const t of PROJECT_TRACKS) {
      expect(t.available, t.id).toBe(isTrackAvailable(getProjectStages(t.id)))
      expect(isProjectTrackAvailable(t.id)).toBe(t.available)
      expect(getProjectTrack(t.id)).toBe(t)
    }
    expect(getProjectTrack('T1').available).toBe(true)
  })
})

describe('normalizeProjectTrack', () => {
  it('giá trị lạ/rỗng → T1', () => {
    for (const v of [null, undefined, '', 'T4', 't2', 42, {}]) {
      expect(normalizeProjectTrack(v)).toBe('T1')
    }
  })

  it('dự án đang mở → giữ nguyên; dự án CHƯA mở → T1 (không bao giờ dựng trang trống)', () => {
    for (const t of PROJECT_TRACKS) {
      expect(normalizeProjectTrack(t.id)).toBe(t.available ? t.id : 'T1')
    }
  })
})

describe('getProjectStep tra cả ba dự án', () => {
  it('mọi bước của mọi dự án tra được, mã không trùng giữa các dự án', () => {
    const ids: string[] = []
    for (const track of PROJECT_TRACK_IDS) {
      for (const stage of getProjectStages(track)) {
        for (const step of stage.steps) {
          expect(getProjectStep(step.id)).toBe(step)
          ids.push(step.id)
        }
      }
    }
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('mã T2/T3 chưa có bước → undefined (server trả 400 thay vì ghi rác)', () => {
    if (!isProjectTrackAvailable('T2')) expect(getProjectStep('t2-p1-s1')).toBeUndefined()
    if (!isProjectTrackAvailable('T3')) expect(getProjectStep('t3-p1-s1')).toBeUndefined()
  })
})

// ── HỢP ĐỒNG cho PR nội dung T2/T3 ───────────────────────────────────────────────────────────
describe.each(['T2', 'T3'] as const)('hợp đồng nội dung %s', (track) => {
  const stages = getProjectStages(track)

  it.each(stages.map((s) => [s.level, s] as const))(
    'chặng %s: mã bước đúng tiền tố + bậc, đánh số liên tục từ 1, schema hợp lệ',
    (level, stage) => {
      stage.steps.forEach((step, i) => {
        expect(step.id).toBe(`${projectStepIdPrefix(track)}${level}-s${i + 1}`)
        expect(parseProjectStepId(step.id)?.track).toBe(track)
        expect(ProjectStepSchema.safeParse(step).success, step.id).toBe(true)
      })
    },
  )

  it.each(stages.map((s) => [s.level, s] as const))(
    'chặng %s: unit cùng bậc và có thật; mọi bước khai `files`; chỉ bước cuối là milestone',
    (level, stage) => {
      stage.steps.forEach((step, i) => {
        expect(step.unitId.startsWith(`${level}-u`), step.id).toBe(true)
        expect(UNIT_IDS.has(step.unitId), step.id).toBe(true)
        // Bỏ trống `files` thì getStepFiles rơi về `cua_hang.py` của T1 — chạy nhầm dự án.
        expect(step.files?.length ?? 0, step.id).toBeGreaterThan(0)
        expect(step.isMilestone, step.id).toBe(i === stage.steps.length - 1)
      })
    },
  )
})
