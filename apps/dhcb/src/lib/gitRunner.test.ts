// gitRunner — lớp mỏng nối bộ mô phỏng (gitSim) vào khuôn CodeRunResult của trang bài học
// (PR-L9). Engine đã có cổng riêng (lessonsGit.test.ts); ở đây chỉ kiểm phần lớp mỏng này
// phải làm đúng: giữ nguyên output, chuyển lỗi thành trường `error`, và truyền bối cảnh.
import { describe, expect, it } from 'vitest'
import { runGit } from './gitRunner'

describe('runGit', () => {
  it('chạy chuỗi lệnh và trả output như terminal', async () => {
    const r = await runGit('git init\necho "a" > a.txt\ngit add .\ngit commit -m "dau tien"')
    expect(r.output).toContain('[main c1] dau tien')
    expect(r.error).toBeUndefined()
    expect(r.timedOut).toBe(false)
  })

  it('lệnh sai: giữ NGUYÊN output đã in (để học viên đọc) và kèm error cho bộ chấm', async () => {
    const r = await runGit('git init\ngit commit -m "quen add"')
    expect(r.output).toContain('$ git init')
    expect(r.output).toContain('loi:')
    expect(r.error).toContain('vung cho')
  })

  it('lenhChuanBi dựng bối cảnh trước, không in ra', async () => {
    const r = await runGit('git log --oneline', {
      lenhChuanBi: ['git init', 'echo "a" > a.txt', 'git add .', 'git commit -m "co san"'],
    })
    expect(r.output).toBe('$ git log --oneline\nc1 co san')
  })

  it('không có bối cảnh thì mỗi lượt là kho mới tinh', async () => {
    await runGit('git init\necho "cu" > cu.txt\ngit add .\ngit commit -m "cu"')
    const r = await runGit('git init\nls')
    expect(r.output).toContain('(thu muc rong)')
  })
})

it('chuyển snapshot thật và giữ khi lỗi, không gộp nội dung state vào output', async () => {
  const r = await runGit('git init\necho "private" > .env\ngit add absent')
  expect(r.error).toBeDefined()
  expect(r.gitState?.workdir['.env']).toBe('private\n')
  expect(r.gitState?.staged).toEqual({})
  expect(r.output).not.toContain('headSnapshot')
})
