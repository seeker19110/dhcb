// Test engine chấm — trọng tâm CA BIÊN (CLAUDE.md mục 4.9: mỗi nhánh logic ≥ 1 test ca biên).
import { describe, expect, it } from 'vitest'
import {
  normalizeOutput,
  gradeTestCase,
  gradeGitTestCase,
  allTestsPassed,
  checkParsonsOrder,
  parsonsShuffle,
} from './grading.js'
import { chayLenh } from './gitSim.js'
import { TestCaseSchema } from './lessonTypes.js'

const tc = (over: Record<string, unknown> = {}) =>
  TestCaseSchema.parse({ expected: 'xin chào', label: 'ca 1', ...over })

describe('normalizeOutput', () => {
  it('bỏ khoảng trắng cuối dòng, dòng trống cuối, CRLF', () => {
    expect(normalizeOutput('a  \r\nb\t\n\n\n')).toBe('a\nb')
  })
  it('chuỗi rỗng và chỉ toàn xuống dòng → rỗng', () => {
    expect(normalizeOutput('')).toBe('')
    expect(normalizeOutput('\n\n')).toBe('')
  })
  it('KHÔNG đụng khoảng trắng đầu dòng (thụt lề có nghĩa với người đọc)', () => {
    expect(normalizeOutput('  a\n')).toBe('  a')
  })
})

describe('gradeTestCase', () => {
  it('contains (mặc định): output chứa expected là đạt', () => {
    expect(gradeTestCase(tc(), 'Máy nói: xin chào bạn!\n').passed).toBe(true)
  })
  it('exact: phải bằng toàn bộ sau chuẩn hoá — khác 1 ký tự là rớt', () => {
    expect(gradeTestCase(tc({ match: 'exact' }), 'xin chào \n').passed).toBe(true)
    expect(gradeTestCase(tc({ match: 'exact' }), 'xin chào!').passed).toBe(false)
  })
  it('lỗi runtime → rớt kể cả output tình cờ chứa expected', () => {
    const r = gradeTestCase(tc(), 'xin chào', 'NameError: ...')
    expect(r.passed).toBe(false)
    expect(r.error).toContain('NameError')
  })
  it('ca rớt KHÔNG ẩn: trả actual để đối chiếu; ca ẨN rớt: không lộ actual lẫn error', () => {
    expect(gradeTestCase(tc(), 'sai rồi').actual).toBe('sai rồi')
    const hid = gradeTestCase(tc({ hidden: true }), 'sai rồi', 'Boom')
    expect(hid.actual).toBeUndefined()
    expect(hid.error).toBeUndefined()
  })
  it('output rỗng với expected không rỗng → rớt (không đạt "chứa chuỗi rỗng ngược")', () => {
    expect(gradeTestCase(tc(), '').passed).toBe(false)
  })
})

describe('allTestsPassed', () => {
  it('mảng rỗng KHÔNG tính là đạt (chặn bài soạn thiếu test)', () => {
    expect(allTestsPassed([])).toBe(false)
  })
  it('mọi ca pass → đạt; 1 ca rớt → không', () => {
    const ok = { label: 'x', hidden: false, passed: true }
    expect(allTestsPassed([ok, ok])).toBe(true)
    expect(allTestsPassed([ok, { ...ok, passed: false }])).toBe(false)
  })
})

describe('checkParsonsOrder', () => {
  const sol = ['a', 'b', 'c']
  it('đúng thứ tự → true; sai chỗ / thiếu dòng → false', () => {
    expect(checkParsonsOrder(['a', 'b', 'c'], sol)).toBe(true)
    expect(checkParsonsOrder(['b', 'a', 'c'], sol)).toBe(false)
    expect(checkParsonsOrder(['a', 'b'], sol)).toBe(false)
  })
})

describe('parsonsShuffle', () => {
  const lines = ['dòng 1', 'dòng 2', 'dòng 3', 'dòng 4']
  it('deterministic theo seed + giữ nguyên tập phần tử', () => {
    const a = parsonsShuffle(lines, 'p1-u4-l1')
    expect(parsonsShuffle(lines, 'p1-u4-l1')).toEqual(a)
    expect([...a].sort()).toEqual([...lines].sort())
  })
  it('không bao giờ trả về đúng thứ tự gốc (nếu có ≥2 phần tử khác nhau)', () => {
    for (const seed of ['a', 'b', 'c', 'p1-u1-l1', 'p9-u9-l9']) {
      expect(parsonsShuffle(lines, seed)).not.toEqual(lines)
    }
  })
  it('mảng toàn phần tử giống nhau: không kẹt vòng (ca biên)', () => {
    expect(parsonsShuffle(['x', 'x'], 's')).toEqual(['x', 'x'])
  })
})

describe('gradeGitTestCase — bằng chứng state', () => {
  const stateCase = (hidden = false) =>
    tc({
      expected: 'safe',
      hidden,
      gitAssertions: [
        { type: 'workdirContent', path: '.env', content: 'fake\n' },
        { type: 'headContent', path: 'README.md', content: 'doc\n' },
        { type: 'historyAbsent', path: '.env' },
        { type: 'commitMessage', content: 'safe' },
        { type: 'headIgnoreProbe', path: 'nested/.env', ignored: true },
        { type: 'headIgnoreProbe', path: '.env.example', ignored: false },
      ],
    })
  const setup = ['git init', 'echo "fake" > .env', 'echo "doc" > README.md']
  const correct =
    'echo "# comment" > .gitignore\necho ".env" >> .gitignore\ngit add README.md .gitignore\ngit commit -m "safe"'
  it('semantic probes cho phép comment và add từng file; browser/server dùng engine thuần', () => {
    const run = chayLenh(correct, setup)
    expect(gradeGitTestCase(stateCase(), run).passed).toBe(true)
    expect(gradeTestCase(stateCase(), run.output).passed).toBe(false)
  })
  it('echo/JSON, thiếu state, xóa fixture, wildcard rộng và commit message cũ không qua', () => {
    expect(gradeGitTestCase(stateCase(), { output: 'safe' }).passed).toBe(false)
    for (const code of [
      'echo "safe"',
      'echo "{safe: true}"',
      `${correct}\nrm .env`,
      correct.replace('echo ".env"', 'echo "*"'),
      `${correct}\necho "new" > README.md\ngit add .\ngit commit -m "wrong"`,
    ]) {
      expect(gradeGitTestCase(stateCase(), chayLenh(code, setup)).passed).toBe(false)
    }
  })
  it('history giữ file cấm kể cả reset; ca ẩn không lộ state/lỗi/nội dung', () => {
    const run = chayLenh(
      `git add README.md\ngit commit -m "base"\ngit add .env\ngit commit -m "leak"\ngit reset --hard c1\necho "fake" > .env\n${correct}`,
      setup,
    )
    expect(run.error).toBeUndefined()
    const withoutHistory = stateCase()
    withoutHistory.gitAssertions = withoutHistory.gitAssertions!.filter(
      (a) => a.type !== 'historyAbsent',
    )
    expect(gradeGitTestCase(withoutHistory, run).passed).toBe(true)
    expect(gradeGitTestCase(stateCase(), run).passed).toBe(false)
    expect(gradeGitTestCase(stateCase(true), run)).toEqual({
      label: 'ca 1',
      hidden: true,
      passed: false,
    })
  })
  it('history vẫn bắt commit cấm sau rebase và reset về HEAD sạch', () => {
    const run = chayLenh(
      `git add README.md
git commit -m "base"
git branch feature
git switch feature
echo "fake" > .env
git add .env
git commit -m "leak"
git switch main
echo "main" > marker
git add marker
git commit -m "main update"
git switch feature
git rebase main
git reset --hard c1
echo "fake" > .env
${correct}`,
      setup,
    )
    expect(run.error).toBeUndefined()
    expect(run.output).toContain('Da rebase 1 commit')
    expect(Object.hasOwn(run.gitState!.headSnapshot!, '.env')).toBe(false)
    expect(run.gitState!.commits.filter((c) => Object.hasOwn(c.snapshot, '.env'))).toHaveLength(2)
    const withoutHistory = stateCase()
    withoutHistory.gitAssertions = withoutHistory.gitAssertions!.filter(
      (a) => a.type !== 'historyAbsent',
    )
    expect(gradeGitTestCase(withoutHistory, run).passed).toBe(true)
    expect(gradeGitTestCase(stateCase(), run).passed).toBe(false)
  })
  it('strict schema chặn prototype/traversal, trường lạ và giá trị thiếu', () => {
    for (const assertion of [
      { type: 'headAbsent', path: '../x' },
      { type: 'headAbsent', path: 'constructor' },
      { type: 'headAbsent', path: 'x', surprise: true },
      { type: 'headIgnoreProbe', path: 'x' },
    ]) {
      expect(
        TestCaseSchema.safeParse({ expected: 'x', label: 'x', gitAssertions: [assertion] }).success,
      ).toBe(false)
    }
  })
})
