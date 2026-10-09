// Khuôn mã theo dự án trục T1/T2/T3 (hạ tầng 2026-10-09,
// docs/specs/2026-10-09-du-an-truc-t2-t3-ha-tang.md): mã bước, đường dẫn workspace, mốc snapshot.
import { describe, expect, it } from 'vitest'
import {
  PROJECT_STEP_ID_RE,
  fromWorkspaceStoragePath,
  isProjectTrackId,
  parseProjectStepId,
  projectSnapshotMilestone,
  projectStepIdPrefix,
  toWorkspaceStoragePath,
  trackOfSnapshotMilestone,
  trackOfWorkspaceStoragePath,
} from './projectTrackIds.js'
import { ProjectStepSchema, P1_PROJECT_STEPS } from './projectSteps.js'

describe('mã bước dự án', () => {
  it('T1 GIỮ NGUYÊN khuôn cũ p<n>-s<k> (tiến độ người học thật gắn vào đó)', () => {
    expect(parseProjectStepId('p1-s1')).toEqual({ track: 'T1', level: 'p1', step: 1 })
    expect(parseProjectStepId('p5-s12')).toEqual({ track: 'T1', level: 'p5', step: 12 })
    expect(projectStepIdPrefix('T1')).toBe('')
  })

  it('T2/T3 mang tiền tố t2-/t3-', () => {
    expect(parseProjectStepId('t2-p3-s4')).toEqual({ track: 'T2', level: 'p3', step: 4 })
    expect(parseProjectStepId('t3-p1-s1')).toEqual({ track: 'T3', level: 'p1', step: 1 })
    expect(projectStepIdPrefix('T2')).toBe('t2-')
    expect(projectStepIdPrefix('T3')).toBe('t3-')
  })

  it('mã sai khuôn → null (không có t1-, không có t4-, không viết hoa, không phải bài học)', () => {
    for (const bad of [
      't1-p1-s1',
      't4-p1-s1',
      'T2-p1-s1',
      't2-p7-s1',
      't2-p1',
      'p1-u4-l1',
      'web-s2-m1',
      't2-p1-s1-x',
      '',
    ]) {
      expect(parseProjectStepId(bad), bad).toBeNull()
      expect(PROJECT_STEP_ID_RE.test(bad), bad).toBe(false)
    }
  })

  it('ProjectStepSchema nhận mã T2/T3, chặn mã lạ', () => {
    const base = P1_PROJECT_STEPS[0]!
    expect(ProjectStepSchema.safeParse({ ...base, id: 't2-p1-s1' }).success).toBe(true)
    expect(ProjectStepSchema.safeParse({ ...base, id: 't3-p5-s2' }).success).toBe(true)
    expect(ProjectStepSchema.safeParse({ ...base, id: 't1-p1-s1' }).success).toBe(false)
    expect(ProjectStepSchema.safeParse({ ...base, id: 't4-p1-s1' }).success).toBe(false)
  })

  it('isProjectTrackId chỉ nhận đúng ba mã', () => {
    expect(['T1', 'T2', 'T3'].every(isProjectTrackId)).toBe(true)
    for (const bad of ['t1', 'T4', '', null, undefined, 1])
      expect(isProjectTrackId(bad)).toBe(false)
  })
})

describe('workspace tách theo dự án', () => {
  it('T1 giữ nguyên tên file; T2/T3 lưu dưới tiền tố riêng', () => {
    expect(toWorkspaceStoragePath('T1', 'cua_hang.py')).toBe('cua_hang.py')
    expect(toWorkspaceStoragePath('T2', 'logic.py')).toBe('t2--logic.py')
    expect(toWorkspaceStoragePath('T3', 'index.html')).toBe('t3--index.html')
  })

  it('đường dẫn lưu vẫn hợp lệ với khuôn tên file của server (không có "/")', () => {
    const SERVER_PATH_RE = /^[a-z0-9_][a-z0-9_.-]{0,99}$/
    for (const track of ['T1', 'T2', 'T3'] as const) {
      expect(SERVER_PATH_RE.test(toWorkspaceStoragePath(track, 'luu_tru.py'))).toBe(true)
    }
  })

  it('đọc ngược: chỉ trả file của ĐÚNG dự án, file dự án khác → null', () => {
    expect(trackOfWorkspaceStoragePath('logic.py')).toBe('T1')
    expect(trackOfWorkspaceStoragePath('t2--logic.py')).toBe('T2')
    expect(trackOfWorkspaceStoragePath('t3--logic.py')).toBe('T3')
    expect(fromWorkspaceStoragePath('T1', 'logic.py')).toBe('logic.py')
    expect(fromWorkspaceStoragePath('T1', 't2--logic.py')).toBeNull()
    expect(fromWorkspaceStoragePath('T2', 't2--logic.py')).toBe('logic.py')
    expect(fromWorkspaceStoragePath('T2', 'logic.py')).toBeNull()
    expect(fromWorkspaceStoragePath('T3', 't2--logic.py')).toBeNull()
  })

  it('cùng tên file ở hai dự án KHÔNG đè nhau', () => {
    expect(toWorkspaceStoragePath('T1', 'logic.py')).not.toBe(
      toWorkspaceStoragePath('T2', 'logic.py'),
    )
    expect(toWorkspaceStoragePath('T2', 'logic.py')).not.toBe(
      toWorkspaceStoragePath('T3', 'logic.py'),
    )
  })
})

describe('mốc snapshot theo dự án', () => {
  it('T1 giữ mốc cũ p<n>; T2/T3 thêm tiền tố', () => {
    expect(projectSnapshotMilestone('T1', 'p2')).toBe('p2')
    expect(projectSnapshotMilestone('T2', 'p2')).toBe('t2-p2')
    expect(projectSnapshotMilestone('T3', 'p5')).toBe('t3-p5')
  })

  it('đọc ngược mốc → dự án; mốc lạ → null', () => {
    expect(trackOfSnapshotMilestone('p1')).toBe('T1')
    expect(trackOfSnapshotMilestone('t2-p3')).toBe('T2')
    expect(trackOfSnapshotMilestone('t3-p5')).toBe('T3')
    for (const bad of ['t1-p1', 't4-p1', 'p7', 'T2-p1', '']) {
      expect(trackOfSnapshotMilestone(bad), bad).toBeNull()
    }
  })
})
