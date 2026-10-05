// CỔNG NỘI DUNG cho bài GIT/dòng lệnh (PR-L9) — chạy chuỗi lệnh THẬT trên bộ mô phỏng
// (gitSim.ts) rồi chấm bằng đúng grading.ts học viên gặp.
//
// Mạch này KHÔNG có khe hở "xanh ở CI, rớt ở người học": engine là TypeScript thuần, cổng CI
// và trình duyệt gọi chung một hàm chayLenh() — không có hai bản cài đặt như mạch Python
// (python3 vs Pyodide) hay mạch HTML (happy-dom vs DOMParser).
//
// Ngoài chấm nội dung, cổng còn canh HAI BẤT BIẾN riêng của mạch mô phỏng:
//  1. Engine tất định — cùng chuỗi lệnh phải cho cùng output, nếu không thì bài học vô nghĩa.
//  2. Bài học KHÔNG được dạy lệnh mà mô phỏng KHÔNG CHẠY ĐƯỢC như thể chạy được. Danh sách này
//     đã THU HẸP từ PR-L9: PR 1/4 khoá Git thêm kho từ xa giả lập nên push/pull/fetch/clone
//     chạy THẬT trong bộ nhớ (không mạng thật, nhưng là lệnh hợp lệ của bài — xem gitu4.ts),
//     và stash/tag/cherry-pick/rebase (ca tuyến tính) cũng chạy thật (xem gitu5.ts). Chỉ còn
//     cấm đúng những lệnh gitSim.ts THẬT SỰ chặn (GIT_CHUA_MO_PHONG) — không nằm trong bài học
//     nào của khoá, chỉ xuất hiện ở lý thuyết/về nhà nếu có nhắc tới.
import { describe, expect, it } from 'vitest'
import { PROGRAMMING_LESSONS } from './lessons.js'
import { chayLenh } from './gitSim.js'
import { gradeGitTestCase, allTestsPassed } from './grading.js'
import type { ProgrammingLesson, ProgrammingTestCase } from './lessonTypes.js'

const GIT_LESSONS = PROGRAMMING_LESSONS.filter((l) => l.language === 'git')

/** Lệnh mà gitSim.ts THẬT SỰ không chạy được (xem GIT_CHUA_MO_PHONG + chặn rebase -i) — cấm
 *  xuất hiện trong code CHẠY của bài. */
const LENH_NGOAI_DOI =
  /\bgit (worktree|submodule|lfs|mergetool|archive|fsck|bisect)\b|\bgit rebase\b[^\n]*(-i\b|--interactive\b)|\bpip install\b|\bpython3 -m venv\b/

function gradeAll(lesson: ProgrammingLesson, code: string, cases: ProgrammingTestCase[]) {
  return cases.map((c) => {
    const r = chayLenh(code, c.stdinLines)
    return gradeGitTestCase(c, r)
  })
}

function describeFailures(results: ReturnType<typeof gradeAll>): string {
  return results
    .filter((r) => !r.passed)
    .map(
      (r) => `[${r.label}] ${r.error ? `LỖI: ${r.error}` : `output thật: ${r.actual ?? '(ẩn)'}`}`,
    )
    .join(' | ')
}

describe('bộ mô phỏng git (gitSim)', () => {
  it('vòng làm việc cơ bản: init → add → commit → log', () => {
    const r = chayLenh(`git init
echo "xin chao" > a.txt
git add a.txt
git commit -m "commit dau"
git log --oneline`)
    expect(r.error).toBeUndefined()
    expect(r.output).toContain('[main c1] commit dau')
    expect(r.output).toContain('c1 commit dau')
  })

  it('TẤT ĐỊNH: chạy hai lần cùng chuỗi lệnh cho ra output y hệt', () => {
    const script = `git init
echo "a" > a.txt
git add .
git commit -m "x"
git switch -c b
echo "b" > b.txt
git add .
git commit -m "y"
git log --oneline`
    expect(chayLenh(script).output).toBe(chayLenh(script).output)
  })

  it('mỗi lượt chạy là kho MỚI TINH — không dính trạng thái lượt trước', () => {
    chayLenh('git init\necho "cu" > cu.txt\ngit add .\ngit commit -m "cu"')
    expect(chayLenh('git init\nls').output).toContain('(thu muc rong)')
  })

  it('status phân biệt ba nhóm: chưa theo dõi · đã chuẩn bị · đã sửa sau khi add', () => {
    expect(chayLenh('git init\necho "a" > a.txt\ngit status').output).toContain(
      'File chua duoc theo doi',
    )
    expect(chayLenh('git init\necho "a" > a.txt\ngit add a.txt\ngit status').output).toContain(
      'Thay doi da chuan bi de commit',
    )
    const suaSauAdd = chayLenh(
      'git init\necho "a" > a.txt\ngit add a.txt\ngit commit -m "c"\necho "b" > a.txt\ngit status',
    )
    expect(suaSauAdd.output).toContain('Thay doi chua chuan bi')
  })

  it('commit KHÔNG có gì trong vùng chờ thì báo lỗi dạy được', () => {
    const r = chayLenh('git init\necho "a" > a.txt\ngit commit -m "quen add"')
    expect(r.error).toContain('vung cho')
    expect(r.output).toContain('loi:')
  })

  it('commit thiếu -m nhắc viết lời nhắn', () => {
    expect(chayLenh('git init\necho "a" > a.txt\ngit add .\ngit commit').error).toContain(
      'loi nhan',
    )
  })

  it('lệnh git khi chưa init thì nhắc chạy git init trước', () => {
    expect(chayLenh('git status').error).toContain('git init')
  })

  it('đổi nhánh thì thư mục làm việc đổi theo (file "biến mất" — cái bẫy của người mới)', () => {
    const r = chayLenh(`git init
echo "a" > a.txt
git add .
git commit -m "c1"
git switch -c nhanh-phu
echo "b" > b.txt
git add .
git commit -m "c2"
git switch main
ls`)
    expect(r.output.trimEnd().endsWith('a.txt')).toBe(true)
  })

  it('gộp khi nhánh chính KHÔNG có commit mới → tua nhanh, không tạo commit gộp', () => {
    const r = chayLenh(`git init
echo "a" > a.txt
git add .
git commit -m "c1"
git switch -c phu
echo "b" > b.txt
git add .
git commit -m "c2"
git switch main
git merge phu
git log --oneline`)
    expect(r.output).toContain('Tua nhanh (fast-forward)')
    expect(r.output).not.toContain('commit gop')
  })

  it('gộp khi CẢ HAI nhánh có commit mới → tạo commit gộp, giữ file của cả hai', () => {
    const r = chayLenh(`git init
echo "a" > a.txt
git add .
git commit -m "c1"
git switch -c phu
echo "b" > b.txt
git add .
git commit -m "tren nhanh phu"
git switch main
echo "c" > c.txt
git add .
git commit -m "tren main"
git merge phu
ls`)
    expect(r.output).toContain('Da gop nhanh phu vao main (commit gop c4)')
    expect(r.output).toContain('a.txt\nb.txt\nc.txt')
  })

  it('hai nhánh cùng sửa MỘT file: nói rõ git thật sẽ báo xung đột, không im lặng', () => {
    const r = chayLenh(`git init
echo "goc" > f.txt
git add .
git commit -m "c1"
git switch -c phu
echo "ban phu" > f.txt
git add .
git commit -m "sua o phu"
git switch main
echo "ban main" > f.txt
git add .
git commit -m "sua o main"
git merge phu`)
    expect(r.output).toContain('XUNG DOT')
  })

  it('push/pull/clone khi chưa khai remote thì nhắc "git remote add origin" trước', () => {
    for (const lenh of ['git push', 'git pull', 'git clone https://x.git']) {
      const r = chayLenh(`git init\n${lenh}`)
      expect(r.error, lenh).toBeTruthy()
    }
  })

  it('echo: > ghi đè, >> nối thêm (cái bẫy tự xoá mất công sức)', () => {
    expect(chayLenh('echo "mot" > f.txt\necho "hai" > f.txt\ncat f.txt').output).toContain('hai')
    const noiThem = chayLenh('echo "mot" > f.txt\necho "hai" >> f.txt\ncat f.txt')
    expect(noiThem.output).toContain('mot\nhai')
  })

  it('lệnh sai thì DỪNG chuỗi (các lệnh sau vô nghĩa) và nêu lệnh dùng được', () => {
    const r = chayLenh('git init\nsudo rm -rf /\ngit status')
    expect(r.error).toContain('chua ho tro')
    expect(r.output).not.toContain('Tren nhanh main')
  })

  // Nhóm dưới đây phủ nốt các NHÁNH còn lại của engine. Không phải test cho đủ số: mỗi ca là
  // một đường học viên thật sự đi (gõ thiếu tham số, gõ nhầm tên nhánh, xem log dạng dài…),
  // và engine mô phỏng chỉ đáng tin khi mọi lối rẽ đều được chạy ít nhất một lần.
  it('git log dạng đầy đủ in mã commit, nhánh và lời nhắn', () => {
    const r = chayLenh(
      'git init\necho "a" > a.txt\ngit add .\ngit commit -m "loi nhan day du"\ngit log',
    )
    expect(r.output).toContain('commit c1')
    expect(r.output).toContain('Nhanh: main')
    expect(r.output).toContain('loi nhan day du')
  })

  it('git log khi kho chưa có commit nào', () => {
    expect(chayLenh('git init\ngit log').output).toContain('Chua co commit nao')
  })

  it('git branch: liệt kê có dấu * ở nhánh hiện tại; tạo nhánh trùng tên thì báo lỗi', () => {
    const r = chayLenh(
      'git init\necho "a" > a.txt\ngit add .\ngit commit -m "c"\ngit branch phu\ngit branch',
    )
    expect(r.output).toContain('* main')
    expect(r.output).toContain('  phu')
    expect(chayLenh('git init\ngit branch main').error).toContain('da ton tai')
  })

  it('git switch: thiếu tên nhánh · nhánh không tồn tại · tạo trùng tên', () => {
    expect(chayLenh('git init\ngit switch').error).toContain('Thieu ten nhanh')
    expect(chayLenh('git init\ngit switch khong-co').error).toContain('Khong co nhanh')
    expect(chayLenh('git init\ngit switch -c main').error).toContain('da ton tai')
  })

  it('git checkout -b làm đúng việc như git switch -c (lệnh cũ vẫn gặp nhiều)', () => {
    expect(chayLenh('git init\ngit checkout -b thu').output).toContain('Da chuyen sang nhanh moi')
  })

  it('git init hai lần thì nói kho đã có, không tạo lại (không mất lịch sử)', () => {
    const r = chayLenh(
      'git init\necho "a" > a.txt\ngit add .\ngit commit -m "c"\ngit init\ngit log --oneline',
    )
    expect(r.output).toContain('da la kho git roi')
    expect(r.output).toContain('c1 c')
  })

  it('git add: thiếu tên file · file không tồn tại', () => {
    expect(chayLenh('git init\ngit add').error).toContain('Thieu ten file')
    expect(chayLenh('git init\ngit add khong-co.txt').error).toContain('Khong co file')
  })

  it('git merge: thiếu tên · nhánh lạ · gộp chính nó · nhánh chưa có commit', () => {
    const nen = 'git init\necho "a" > a.txt\ngit add .\ngit commit -m "c"\n'
    expect(chayLenh(`${nen}git merge`).error).toContain('Thieu ten nhanh')
    expect(chayLenh(`${nen}git merge khong-co`).error).toContain('Khong co nhanh')
    expect(chayLenh(`${nen}git merge main`).error).toContain('chinh no')
    // Nhánh tạo trên kho CHƯA có commit thì không có gì để gộp.
    const rong = chayLenh('git init\ngit branch phu\ngit merge phu')
    expect(rong.error).toContain('chua co commit nao')
  })

  it('git status khi thư mục sạch (vừa commit xong)', () => {
    const r = chayLenh('git init\necho "a" > a.txt\ngit add .\ngit commit -m "c"\ngit status')
    expect(r.output).toContain('thu muc lam viec sach')
  })

  it('git không kèm lệnh con thì nhắc ví dụ; lệnh git lạ nêu các lệnh dùng được', () => {
    expect(chayLenh('git').error).toContain('Thieu lenh git')
    expect(chayLenh('git init\ngit worktree').error).toContain('khong lam')
  })

  it('git bisect: mô phỏng nói rõ không CHẠY được (chỉ dạy bằng lý thuyết/Predict)', () => {
    expect(chayLenh('git init\ngit bisect').error).toContain('khong CHAY duoc')
  })

  it('rebase -i (tương tác) nói rõ không nằm trong bài học này; rebase thường thì chạy được', () => {
    expect(chayLenh('git init\ngit rebase main -i').error).toContain('nam ngoai bai hoc')
    const r = chayLenh(
      'git init\necho "a" > a.txt\ngit add .\ngit commit -m "c1"\ngit switch -c phu\necho "b" > b.txt\ngit add .\ngit commit -m "c2"\ngit rebase main',
    )
    expect(r.error).toBeUndefined()
    expect(r.output).toContain('Da rebase 1 commit')
  })

  it('shell: pwd · cat thiếu tên · cat file lạ · rm · mkdir/cd nói rõ giới hạn', () => {
    expect(chayLenh('pwd').output).toContain('/home/ban/du-an')
    expect(chayLenh('cat').error).toContain('Thieu ten file')
    expect(chayLenh('cat khong-co.txt').error).toContain('Khong co file')
    expect(chayLenh('echo "a" > a.txt\nrm a.txt\nls').output).toContain('(thu muc rong)')
    expect(chayLenh('rm').error).toContain('Thieu ten file')
    expect(chayLenh('rm khong-co.txt').error).toContain('Khong co file')
    expect(chayLenh('mkdir src').output).toContain('khong tao cay thu muc that')
    expect(chayLenh('cd src').output).toContain('khong tao cay thu muc that')
  })

  it('echo không chuyển hướng thì chỉ in ra; thiếu tên file sau > thì báo lỗi', () => {
    expect(chayLenh('echo "xin chao"').output).toContain('xin chao')
    expect(chayLenh('echo "xin chao" >').error).toContain('Thieu ten file')
  })

  it('dòng trống và dòng chú thích (#) bị bỏ qua — code khởi đầu của bài có chúng', () => {
    const r = chayLenh('git init\n\n# day la chu thich\nls')
    expect(r.output).not.toContain('# day la chu thich')
    expect(r.output).toContain('(thu muc rong)')
  })

  it('lệnh chuẩn bị SAI thì báo rõ là lỗi bối cảnh (lỗi của người soạn bài, không phải học viên)', () => {
    const r = chayLenh('ls', ['git commit -m "chua init"'])
    expect(r.error).toContain('Loi khi dung boi canh')
    expect(r.output).toBe('')
  })

  it('nháy đơn cũng được chấp nhận cho lời nhắn commit', () => {
    expect(
      chayLenh('git init\necho "a" > a.txt\ngit add .\ngit commit -m \'loi nhan nhay don\'').output,
    ).toContain('loi nhan nhay don')
  })

  it('lệnh chuẩn bị dựng bối cảnh nhưng KHÔNG in ra', () => {
    const r = chayLenh('git log --oneline', [
      'git init',
      'echo "a" > a.txt',
      'git add .',
      'git commit -m "co san"',
    ])
    expect(r.output).toContain('c1 co san')
    expect(r.output).not.toContain('$ git init')
  })
})

describe('nội dung GIT môn Lập trình chạy THẬT', () => {
  it('có ít nhất một bài git (chặn quên đăng ký vào lessons.ts)', () => {
    expect(GIT_LESSONS.length).toBeGreaterThan(0)
  })

  it.each(GIT_LESSONS)('$id — code mẫu đạt HẾT test-case', (lesson) => {
    const results = gradeAll(lesson, lesson.make.sampleSolution, lesson.make.testCases)
    expect(allTestsPassed(results), `Bài ${lesson.id}: ${describeFailures(results)}`).toBe(true)
  })

  it.each(GIT_LESSONS)('$id — ví dụ mẫu chạy không lỗi', (lesson) => {
    const r = chayLenh(lesson.workedExample.code, lesson.workedExample.stdinLines)
    expect(r.error, `Bài ${lesson.id} ví dụ mẫu lỗi: ${r.error}`).toBeUndefined()
    expect(r.output.trim().length).toBeGreaterThan(0)
  })

  it.each(GIT_LESSONS)('$id — Parsons xếp đúng thứ tự thì chạy được thật', (lesson) => {
    // Bối cảnh chuẩn: có bài (U10-L2 "nhánh và gộp") dạy trên kho ĐÃ CÓ commit, nên Parsons
    // của nó bắt đầu thẳng từ git switch. Dựng sẵn kho ở đây; bài nào tự gõ git init thì
    // lệnh đó chỉ báo "da la kho git roi", không phải lỗi.
    const r = chayLenh(lesson.parsons.lines.join('\n'), [
      'git init',
      'echo "co san" > co_san.txt',
      'git add .',
      'git commit -m "Boi canh co san"',
    ])
    expect(r.error, `Bài ${lesson.id} Parsons lỗi: ${r.error}`).toBeUndefined()
  })

  it.each(GIT_LESSONS)('$id — đáp án Predict khớp output thật', (lesson) => {
    const r = chayLenh(lesson.predict.code)
    const dapAn = lesson.predict.choices[lesson.predict.answerIndex]!
    // Predict của mạch này có hai dạng: hỏi OUTPUT (đáp án phải xuất hiện thật) và hỏi
    // CHUYỆN GÌ XẢY RA (đáp án là câu giải thích — khi đó code phải thực sự lỗi/không lỗi
    // đúng như câu đó nói). Test kiểm cả hai bằng cách: nếu đáp án không phải chuỗi con của
    // output thì bài BẮT BUỘC phải là ca lỗi, và câu trả lời đúng phải nói về việc đó.
    if (!r.output.includes(dapAn)) {
      expect(
        r.error,
        `Bài ${lesson.id}: đáp án "${dapAn}" không có trong output mà code cũng không lỗi`,
      ).toBeTruthy()
      expect(dapAn.toLowerCase()).toMatch(/không|khong/)
    }
  })

  it.each(GIT_LESSONS)(
    '$id — KHÔNG dạy lệnh cần mạng/máy thật như thể chạy được ở đây',
    (lesson) => {
      // Chúng được phép nằm trong lý thuyết và bài về nhà (đó là cách dạy đúng), nhưng có mặt
      // trong code CHẠY thì học viên sẽ bấm Chạy và nhận về lỗi giữa bài — dạy sai kỳ vọng.
      for (const [ten, code] of [
        ['ví dụ mẫu', lesson.workedExample.code],
        ['code Predict', lesson.predict.code],
        ['Parsons', lesson.parsons.lines.join('\n')],
        ['code khởi đầu', lesson.make.starterCode],
        ['code mẫu', lesson.make.sampleSolution],
      ] as const) {
        expect(
          LENH_NGOAI_DOI.test(code),
          `Bài ${lesson.id}: ${ten} chứa lệnh chỉ chạy ngoài đời`,
        ).toBe(false)
      }
    },
  )
})
