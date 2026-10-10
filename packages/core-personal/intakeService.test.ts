import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { Pool } from 'pg'
import {
  getIntakeState,
  saveIntake,
  saveChosenTask,
  markTaskDone,
  getIntakeStats,
} from './intakeService.js'

// Mã hoá chạy THẬT (không mock) để kiểm được rằng câu trả lời tự do không bao giờ chạm CSDL ở
// dạng plaintext — đó là lý do tồn tại của lớp này.
process.env.USER_DATA_MASTER_KEY = Buffer.alloc(32, 9).toString('base64')

const USER = '11111111-1111-1111-1111-111111111111'
const seen: { sql: string; params: unknown[] }[] = []
let nextRows: unknown[] = []

const pool = {
  query: async (sql: string, params?: unknown[]) => {
    seen.push({ sql, params: params ?? [] })
    return { rows: nextRows, rowCount: nextRows.length }
  },
} as unknown as Pool

beforeEach(() => {
  seen.length = 0
  nextRows = []
  vi.restoreAllMocks()
})

describe('saveIntake', () => {
  it('câu trả lời TỰ DO không bao giờ chạm CSDL ở dạng plaintext', async () => {
    await saveIntake(pool, USER, { extraHour: 'ngủ thêm', flowActivity: 'vẽ tranh' }, 'goi-y-x')
    const insert = seen.find((q) => q.sql.includes('insert into personal.intake'))
    const params = insert?.params ?? []
    const asText = JSON.stringify(params)

    expect(asText).not.toContain('ngủ thêm')
    expect(asText).not.toContain('vẽ tranh')
    // Đúng định dạng phong bì của userDataCrypto.
    expect(params[3]).toMatch(/^v\d+:/)
    expect(params[4]).toMatch(/^v\d+:/)
  })

  it('câu CHỌN SẴN lưu nguyên văn — cần lọc/thống kê, và chỉ vài giá trị nên giấu cũng vô nghĩa', async () => {
    await saveIntake(pool, USER, { focus: 'tien_bac', lastLearned: 'lau_roi' }, 'goi-y-x')
    const insert = seen.find((q) => q.sql.includes('insert into personal.intake'))
    expect(insert?.params[1]).toBe('tien_bac')
    expect(insert?.params[2]).toBe('lau_roi')
  })

  it('bỏ qua câu tự do → lưu null, không mã hoá chuỗi rỗng', async () => {
    await saveIntake(pool, USER, { focus: 'chua_ro' }, 'goi-y-x')
    const insert = seen.find((q) => q.sql.includes('insert into personal.intake'))
    expect(insert?.params[3]).toBeNull()
    expect(insert?.params[4]).toBeNull()
  })

  it('chuỗi chỉ có khoảng trắng cũng coi như bỏ qua', async () => {
    await saveIntake(pool, USER, { extraHour: '   ' }, 'goi-y-x')
    const insert = seen.find((q) => q.sql.includes('insert into personal.intake'))
    expect(insert?.params[3]).toBeNull()
  })

  it('bỏ HẾT 5 câu vẫn lưu được (đặc tả: bỏ qua không được chặn luồng)', async () => {
    await expect(saveIntake(pool, USER, {}, 'goi-y-x')).resolves.toEqual({})
  })

  it('dữ liệu sai kiểu → ném lỗi, không âm thầm lưu rác', async () => {
    await expect(saveIntake(pool, USER, { focus: 'không-có-thật' }, 'goi-y-x')).rejects.toThrow()
    await expect(saveIntake(pool, USER, { linhTinh: 1 }, 'goi-y-x')).rejects.toThrow()
  })

  it('KHÔNG lưu nhóm tuổi ở bảng này — nguồn sự thật là public.profiles (migration 0059)', async () => {
    await saveIntake(pool, USER, { focus: 'hoc_thi' }, 'goi-y-x')
    const insert = seen.find((q) => q.sql.includes('insert into personal.intake'))
    expect(insert?.sql).not.toContain('age_group')
  })
})

describe('getIntakeState', () => {
  it('chưa từng trả lời → chưa xong, câu trả lời rỗng', async () => {
    expect(await getIntakeState(pool, USER)).toEqual({
      done: false,
      answers: {},
      chosenTaskId: null,
      taskDone: false,
    })
  })

  it('vòng tròn: lưu rồi đọc lại ra đúng bản gốc', async () => {
    await saveIntake(pool, USER, { focus: 'quan_he', flowActivity: 'chơi đàn' }, 'goi-y-x')
    const insert = seen.find((q) => q.sql.includes('insert into personal.intake'))

    nextRows = [
      {
        focus: 'quan_he',
        last_learned: null,
        extra_hour_enc: null,
        flow_activity_enc: insert?.params[4],
        chosen_task_id: null,
        completed_at: new Date(),
      },
    ]
    const state = await getIntakeState(pool, USER)
    expect(state.done).toBe(true)
    expect(state.answers.flowActivity).toBe('chơi đàn')
    expect(state.answers.focus).toBe('quan_he')
  })

  it('bản ghi CŨ chưa mã hoá vẫn đọc được (chuyển đổi dần)', async () => {
    nextRows = [
      {
        focus: null,
        last_learned: null,
        extra_hour_enc: 'văn bản cũ chưa mã hoá',
        flow_activity_enc: null,
        chosen_task_id: null,
        completed_at: new Date(),
      },
    ]
    const state = await getIntakeState(pool, USER)
    expect(state.answers.extraHour).toBe('văn bản cũ chưa mã hoá')
  })
})

describe('saveChosenTask', () => {
  it('ghi lại việc người dùng chọn — để đo gợi ý có trúng không', async () => {
    await saveChosenTask(pool, USER, 'tien-ghi-chi-tieu')
    const upd = seen.find((q) => q.sql.includes('set chosen_task_id'))
    expect(upd?.params).toEqual([USER, 'tien-ghi-chi-tieu'])
  })
})

describe('đo gợi ý có trúng không', () => {
  it('lưu lại việc ĐÃ gợi ý — để sửa thuật toán sau này không làm đổi số liệu lịch sử', async () => {
    await saveIntake(pool, USER, { focus: 'tien_bac' }, 'tien-ghi-chi-tieu')
    const insert = seen.find((q) => q.sql.includes('insert into personal.intake'))
    expect(insert?.sql).toContain('suggested_task_id')
    expect(insert?.params[5]).toBe('tien-ghi-chi-tieu')
  })

  it('saveChosenTask ghi cả MỐC THỜI GIAN chọn — không có nó thì không tính được "trong 7 ngày"', async () => {
    await saveChosenTask(pool, USER, 'x')
    expect(seen[0]?.sql).toContain('task_chosen_at = now()')
  })

  it('markTaskDone chỉ ghi mốc LẦN ĐẦU — bấm lại không được dời mốc', async () => {
    await markTaskDone(pool, USER)
    const upd = seen.find((q) => q.sql.includes('set task_done_at'))
    // Điều kiện này là thứ giữ cho phép đo "trong 7 ngày" không bị bóp méo.
    expect(upd?.sql).toContain('coalesce(task_done_at, now())')
  })

  it('chưa có hàng intake → saveChosenTask/markTaskDone trả false (không báo thành công giả)', async () => {
    nextRows = []
    expect(await saveChosenTask(pool, USER, 'x')).toBe(false)
    expect(await markTaskDone(pool, USER)).toBe(false)
    nextRows = [{}]
    expect(await saveChosenTask(pool, USER, 'x')).toBe(true)
    expect(await markTaskDone(pool, USER)).toBe(true)
  })

  it('getIntakeState báo đúng việc đã làm xong hay chưa', async () => {
    nextRows = [
      {
        focus: null,
        last_learned: null,
        extra_hour_enc: null,
        flow_activity_enc: null,
        chosen_task_id: 'x',
        suggested_task_id: 'x',
        task_done_at: new Date(),
        completed_at: new Date(),
      },
    ]
    expect((await getIntakeState(pool, USER)).taskDone).toBe(true)
  })

  it('thống kê tách RÕ ba tình huống: nhận việc chính · đổi việc · bỏ qua', async () => {
    nextRows = [
      {
        answered: '100',
        took_suggested: '62',
        switched: '25',
        skipped: '13',
        done: '40',
        done_within_7d: '31',
      },
    ]
    const stats = await getIntakeStats(pool, 30)
    expect(stats.tookSuggested + stats.switched + stats.skipped).toBe(stats.answered)
    expect(stats.doneWithin7Days).toBeLessThanOrEqual(stats.done)

    const sql = seen[0]?.sql ?? ''
    // Ba nhánh phải phân biệt được nhau, nếu không thì không biết suy luận sai ở đâu.
    expect(sql).toContain('chosen_task_id = suggested_task_id')
    expect(sql).toContain('chosen_task_id <> suggested_task_id')
    expect(sql).toContain('chosen_task_id is null')
    // "Trong 7 ngày" tính từ lúc CHỌN, không phải từ lúc trả lời câu hỏi.
    expect(sql).toContain("task_chosen_at + interval '7 days'")
  })

  it('thống kê KHÔNG đụng tới hai cột đã mã hoá — đếm không phải cái cớ để mở hồ sơ cá nhân', async () => {
    nextRows = []
    await getIntakeStats(pool, 30)
    for (const q of seen) {
      expect(q.sql).not.toContain('extra_hour_enc')
      expect(q.sql).not.toContain('flow_activity_enc')
    }
  })

  it('chưa có dữ liệu → trả 0 chứ không vỡ', async () => {
    nextRows = []
    const stats = await getIntakeStats(pool, 7)
    expect(stats.answered).toBe(0)
    expect(stats.topTasks).toEqual([])
  })
})
