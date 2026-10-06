// Canh rubric TRẠNG THÁI của bài p3-u11-l1 (đặc tả docs/specs/2026-10-05-gitignore-state-grading.md,
// lát B1). Hai nửa:
//  1. Hình dạng rubric: đủ loại assertion, đủ probe dương/âm theo đặc tả, mọi file bị bỏ qua của
//     mỗi kho mẫu đều có cả historyAbsent lẫn workdirContent, không còn điều kiện transcript cũ.
//  2. Chạy THẬT trên gitSim + gradeGitTestCase (cùng hàm trình duyệt/server dùng): lời giải đúng
//     theo nhiều cách đều đạt; mọi kiểu "lách" trong mục Acceptance 6–8 đều rớt.
import { describe, expect, it } from 'vitest'
import { getLesson } from '../lessons.js'
import { chayLenh } from '../gitSim.js'
import { allTestsPassed, gradeGitTestCase } from '../grading.js'
import type { ProgrammingTestCase } from '../lessonTypes.js'

const lesson = getLesson('p3-u11-l1')!
const cases = lesson.make.testCases

type Assertion = NonNullable<ProgrammingTestCase['gitAssertions']>[number]
const assertionsOf = (c: ProgrammingTestCase): Assertion[] => c.gitAssertions ?? []
const allAssertions = cases.flatMap(assertionsOf)

function probes(ignored: boolean): string[] {
  return allAssertions.flatMap((a) =>
    a.type === 'headIgnoreProbe' && a.ignored === ignored ? [a.path] : [],
  )
}

function grade(code: string) {
  return cases.map((c) => gradeGitTestCase(c, chayLenh(code, c.stdinLines)))
}
const passes = (code: string) => allTestsPassed(grade(code))

/** Đường dẫn file mà lệnh dựng kho tạo ra (echo "..." > path), trừ README.md. */
function fixtureFiles(c: ProgrammingTestCase): Map<string, string> {
  const files = new Map<string, string>()
  for (const line of c.stdinLines) {
    const m = /^echo "(.*)" > (\S+)$/.exec(line)
    if (m && m[2] !== 'README.md') files.set(m[2]!, `${m[1]}\n`)
  }
  return files
}

const IGNORE_DUNG = [
  'echo ".env" > .gitignore',
  'echo "*.pt" >> .gitignore',
  'echo "*.pth" >> .gitignore',
  'echo "*.safetensors" >> .gitignore',
  'echo "__pycache__/" >> .gitignore',
]
const giai = (...lines: string[]) => lines.join('\n')

describe('p3-u11-l1 — hình dạng rubric trạng thái', () => {
  it('mọi ca đều chấm trạng thái, bỏ hết điều kiện transcript cũ', () => {
    expect(cases.length).toBeLessThanOrEqual(10)
    for (const c of cases) {
      expect(c.gitAssertions?.length, c.label).toBeGreaterThan(0)
      expect(c.gitAssertions!.length, c.label).toBeLessThanOrEqual(12)
      // Chỉ còn kiểm "có chạy git commit" để phản hồi sớm — không ép thứ tự dòng ignore,
      // mã commit c1 hay số file trong ảnh chụp.
      expect(c.expected).toBe('$ git commit')
      expect(c.match).toBe('contains')
      expect(c.stdinLines[0]).toBe('git init')
    }
    expect(cases.some((c) => c.hidden)).toBe(true)
    expect(cases.some((c) => !c.hidden)).toBe(true)
  })

  it('đủ các loại assertion của lát B1', () => {
    const types = new Set(allAssertions.map((a) => a.type))
    for (const t of [
      'headIgnoreProbe',
      'historyAbsent',
      'workdirContent',
      'commitMessage',
      'headContent',
    ]) {
      expect(types.has(t as Assertion['type']), t).toBe(true)
    }
    // .gitignore không bị chấm bằng nội dung chính xác — chỉ bằng probe ngữ nghĩa.
    expect(
      allAssertions.some(
        (a) => (a.type === 'headContent' || a.type === 'workdirContent') && a.path === '.gitignore',
      ),
    ).toBe(false)
  })

  it('probe dương phủ năm mẫu, ở gốc lẫn thư mục con', () => {
    const pos = probes(true)
    for (const p of ['.env', 'config/.env']) expect(pos).toContain(p)
    for (const ext of ['.pt', '.pth', '.safetensors']) {
      expect(
        pos.some((p) => !p.includes('/') && p.endsWith(ext)),
        ext,
      ).toBe(true)
      expect(
        pos.some((p) => p.includes('/') && p.endsWith(ext)),
        `${ext} lồng`,
      ).toBe(true)
    }
    expect(pos.some((p) => p.startsWith('__pycache__/'))).toBe(true)
    expect(pos.some((p) => p.includes('/__pycache__/'))).toBe(true)
  })

  it('probe âm đúng danh sách đặc tả (chặn mẫu * và mẫu rộng quá tay)', () => {
    const neg = probes(false)
    for (const p of ['README.md', '.gitignore', '.env.example', 'a.pt.txt', 'notes.pth.md']) {
      expect(neg).toContain(p)
    }
    // `__pycache__` (không gạch chéo) là lời giải đúng như Git → không được làm probe âm.
    expect(neg).not.toContain('__pycache__')
  })

  it('mỗi kho mẫu: mọi file bị bỏ qua có cả historyAbsent lẫn workdirContent đúng nội dung', () => {
    const kho = new Map<string, ProgrammingTestCase[]>()
    for (const c of cases) {
      const key = c.stdinLines.join('\n')
      kho.set(key, [...(kho.get(key) ?? []), c])
    }
    expect(kho.size).toBeGreaterThanOrEqual(2) // kho công khai + kho ca ẩn khác tên
    for (const group of kho.values()) {
      const files = fixtureFiles(group[0]!)
      expect(files.size).toBeGreaterThan(0)
      const asserts = group.flatMap(assertionsOf)
      for (const [path, content] of files) {
        expect(
          asserts.some((a) => a.type === 'historyAbsent' && a.path === path),
          path,
        ).toBe(true)
        expect(
          asserts.some(
            (a) => a.type === 'workdirContent' && a.path === path && a.content === content,
          ),
          path,
        ).toBe(true)
      }
      expect(asserts.some((a) => a.type === 'commitMessage')).toBe(true)
      expect(asserts.some((a) => a.type === 'headContent' && a.path === 'README.md')).toBe(true)
    }
  })

  it('kho mẫu có trọng số ở gốc VÀ lồng, chỉ chứa chữ giả', () => {
    const files = [...new Set(cases.flatMap((c) => [...fixtureFiles(c).keys()]))]
    for (const ext of ['.pt', '.pth', '.safetensors']) {
      expect(
        files.some((p) => p.endsWith(ext) && !p.includes('/')),
        ext,
      ).toBe(true)
      expect(
        files.some((p) => p.endsWith(ext) && p.includes('/')),
        `${ext} lồng`,
      ).toBe(true)
    }
    const contents = cases.flatMap((c) => [...fixtureFiles(c).values()])
    expect(contents.every((v) => /gia/.test(v))).toBe(true)
  })
})

describe('p3-u11-l1 — lời giải đúng theo nhiều cách đều đạt', () => {
  it('code mẫu đạt mọi ca', () => {
    expect(passes(lesson.make.sampleSolution)).toBe(true)
  })

  it('đảo thứ tự mẫu, thêm chú thích và dòng trống, *.env thay .env, __pycache__ không gạch chéo', () => {
    const code = giai(
      'echo "# trong so mo hinh" > .gitignore',
      'echo "*.safetensors" >> .gitignore',
      'echo "*.pth" >> .gitignore',
      'echo "" >> .gitignore',
      'echo "__pycache__" >> .gitignore',
      'echo "*.pt" >> .gitignore',
      'echo "*.env" >> .gitignore',
      'git add .',
      'git commit -m "Chuan hoa cau truc"',
    )
    expect(passes(code)).toBe(true)
  })

  it('không gõ git init (kho đã init sẵn) và add từng file thay cho add .', () => {
    expect(
      passes(
        giai(...IGNORE_DUNG, 'git add README.md .gitignore', 'git commit -m "Chuan hoa cau truc"'),
      ),
    ).toBe(true)
  })

  it('nhiều commit, HEAD cuối mang đúng lời nhắn', () => {
    const code = giai(
      'git add README.md',
      'git commit -m "Them README"',
      ...IGNORE_DUNG,
      'git add .',
      'git commit -m "Chuan hoa cau truc"',
      'git log --oneline',
    )
    expect(passes(code)).toBe(true)
  })
})

describe('p3-u11-l1 — các kiểu lách đều rớt', () => {
  it('chỉ echo lại transcript của code mẫu (không có trạng thái thật)', () => {
    const transcript = chayLenh(lesson.make.sampleSolution, cases[0]!.stdinLines).output
    const echoOnly = transcript
      .split('\n')
      .map((l) => `echo "${l.replaceAll('"', '')}"`)
      .join('\n')
    const results = grade(echoOnly)
    // Chữ in ra có "$ git commit" nhưng HEAD không tồn tại → mọi ca đều rớt.
    expect(results.every((r) => !r.passed)).toBe(true)
  })

  it('chỉ cat/ls/git status, không commit', () => {
    expect(passes(giai('ls', 'cat README.md', 'git status'))).toBe(false)
  })

  it('viết .gitignore đúng nhưng không commit', () => {
    expect(passes(giai(...IGNORE_DUNG, 'git add .'))).toBe(false)
  })

  it('xoá file bị bỏ qua để né bài → rớt workdirContent', () => {
    const code = giai(...IGNORE_DUNG, 'rm .env', 'git add .', 'git commit -m "Chuan hoa cau truc"')
    expect(passes(code)).toBe(false)
  })

  it('thiếu một mẫu (*.pth) → model.pth lọt vào commit, rớt', () => {
    const code = giai(
      ...IGNORE_DUNG.filter((l) => !l.includes('*.pth')),
      'git add .',
      'git commit -m "Chuan hoa cau truc"',
    )
    expect(passes(code)).toBe(false)
  })

  // `*` → .gitignore tự chặn chính nó, add README/.gitignore báo lỗi; `.env*` → rớt probe âm
  // .env.example; `*.pt*` → hai dấu * ngoài subset, báo lỗi dòng.
  it.each([
    ['*', 'echo "*" > .gitignore'],
    ['.env*', 'echo ".env*" > .gitignore'],
    ['*.pt*', 'echo "*.pt*" > .gitignore'],
  ])('mẫu rộng quá tay %s → rớt probe âm hoặc không commit được', (_ten, dongDau) => {
    const code = giai(
      dongDau,
      ...IGNORE_DUNG.slice(1),
      'git add README.md .gitignore',
      'git commit -m "Chuan hoa cau truc"',
    )
    expect(passes(code)).toBe(false)
  })

  it('.env* rớt đúng ở ca probe âm (.env.example), không phải vì lỗi khác', () => {
    const results = grade(
      giai(
        'echo ".env*" > .gitignore',
        ...IGNORE_DUNG.slice(1),
        'git add .',
        'git commit -m "Chuan hoa cau truc"',
      ),
    )
    const probeAm = cases.findIndex((c) =>
      assertionsOf(c).some((a) => a.type === 'headIgnoreProbe' && a.path === '.env.example'),
    )
    expect(results[probeAm]!.passed).toBe(false)
    expect(results.filter((_, i) => i !== probeAm).every((r) => r.passed)).toBe(true)
  })

  it('cú pháp ngoài subset (!model.pt) → lỗi rõ, rớt', () => {
    const results = grade(giai('echo "!model.pt" > .gitignore', 'git add .'))
    expect(results.every((r) => !r.passed)).toBe(true)
    expect(results.find((r) => !r.hidden)?.error).toContain('ngoai subset')
  })

  it('lời nhắn đúng ở commit CŨ nhưng HEAD mang lời nhắn khác → rớt', () => {
    const code = giai(
      ...IGNORE_DUNG,
      'git add .',
      'git commit -m "Chuan hoa cau truc"',
      'echo "# Quan cua toi v2" > README.md',
      'git add README.md',
      'git commit -m "Sua README"',
    )
    expect(passes(code)).toBe(false)
  })

  it('commit .env rồi reset để HEAD sạch: lịch sử vẫn còn .env → rớt historyAbsent', () => {
    const code = giai(
      'git add README.md',
      'git commit -m "Them README"',
      'git add .',
      'git commit -m "Lo commit ca bi mat"',
      'git reset c1',
      ...IGNORE_DUNG,
      'git add .',
      'git commit -m "Chuan hoa cau truc"',
    )
    const run = chayLenh(code, cases[0]!.stdinLines)
    expect(run.error).toBeUndefined()
    expect(run.gitState?.headSnapshot).not.toHaveProperty(['.env'])
    expect(passes(code)).toBe(false)
  })

  it('chép cứng README của kho công khai → ca ẩn (kho khác) rớt', () => {
    const code = giai(
      'echo "# Quan cua toi" > README.md',
      ...IGNORE_DUNG,
      'git add .',
      'git commit -m "Chuan hoa cau truc"',
    )
    const results = grade(code)
    expect(results.filter((r) => !r.hidden).every((r) => r.passed)).toBe(true)
    expect(results.some((r) => r.hidden && !r.passed)).toBe(true)
  })

  it('liệt kê cứng tên file của kho công khai thay vì dùng * → ca ẩn rớt', () => {
    const code = giai(
      'echo ".env" > .gitignore',
      'echo "model.pt" >> .gitignore',
      'echo "model.pth" >> .gitignore',
      'echo "model.safetensors" >> .gitignore',
      'echo "epoch-1.pt" >> .gitignore',
      'echo "__pycache__/" >> .gitignore',
      'git add .',
      'git commit -m "Chuan hoa cau truc"',
    )
    const results = grade(code)
    expect(allTestsPassed(results)).toBe(false)
    expect(results.some((r) => r.hidden && !r.passed)).toBe(true)
  })

  it('ca ẩn không lộ lỗi chi tiết', () => {
    for (const r of grade('ls').filter((x) => x.hidden)) {
      expect(r.passed).toBe(false)
      expect(r.error).toBeUndefined()
      expect(r.actual).toBeUndefined()
    }
  })
})
