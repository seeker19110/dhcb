// gitSim.test.ts — CỔNG ĐƠN VỊ cho engine mô phỏng git (PR 1 của khoá "Git & GitHub thực
// hành", docs/specs/2026-08-30-khoa-hoc-thuc-hanh-github.md). File này KHÔNG tồn tại trước —
// gitSim.ts trước đó chỉ được phủ gián tiếp qua lessonsGit.test.ts (chấm nội dung bài học).
//
// Phạm vi ở đây: BA TẦNG LỆNH MỚI (hoàn tác · kho từ xa giả lập · nâng cao) — mỗi lệnh mới,
// kèm đủ ca lỗi ở bảng ③ của đặc tả. Vòng làm việc 8 lệnh cũ (init/status/add/commit/log/
// branch/switch/merge) đã có cổng riêng ở lessonsGit.test.ts, KHÔNG lặp lại ở đây.
import { describe, expect, it } from 'vitest'
import { chayLenh } from './gitSim.js'

describe('gitSim — tầng HOÀN TÁC (diff/restore/reset/revert/reflog)', () => {
  it('diff (chưa add) hiện đúng dòng đổi; diff --staged chỉ hiện thứ đã add', () => {
    const r = chayLenh(`git init
echo "dong 1" > f.txt
git add .
git commit -m "c1"
echo "dong moi" > f.txt
git diff`)
    expect(r.error).toBeUndefined()
    expect(r.output).toContain('-dong 1')
    expect(r.output).toContain('+dong moi')

    const rStaged = chayLenh(`git init
echo "dong 1" > f.txt
git add .
git commit -m "c1"
echo "dong moi" > f.txt
git diff --staged`)
    // Chưa add lần sửa mới → diff --staged không in thêm gì SAU dòng lệnh (rỗng thật sự).
    expect(rStaged.output.trim().endsWith('$ git diff --staged')).toBe(true)
  })

  it('diff rỗng khi không có gì đổi', () => {
    const r = chayLenh('git init\necho "a" > f.txt\ngit add .\ngit commit -m "c"\ngit diff')
    expect(r.output.trim().endsWith('$ git diff')).toBe(true)
  })

  it('restore <file> bỏ thay đổi chưa add, MẤT vĩnh viễn phần chưa add', () => {
    const r = chayLenh(`git init
echo "goc" > f.txt
git add .
git commit -m "c1"
echo "sua tam" > f.txt
git restore f.txt
cat f.txt`)
    expect(r.error).toBeUndefined()
    // Chỉ kiểm nội dung THẬT của f.txt sau khi restore (dòng cuối, do `cat` in ra) — transcript
    // phía trên vẫn còn nhắc lại "sua tam" trong chính dòng lệnh echo đã gõ, điều đó không tính.
    const dongCuoi = r.output.trim().split('\n').pop()
    expect(dongCuoi).toBe('goc')
  })

  it('restore --staged bỏ khỏi vùng chờ nhưng GIỮ nguyên thư mục làm việc', () => {
    const r = chayLenh(`git init
echo "a" > f.txt
git add .
git status
git restore --staged f.txt
git status`)
    expect(r.error).toBeUndefined()
    const [truoc, sau] = r.output.split('git restore --staged f.txt')
    expect(truoc).toContain('Thay doi da chuan bi de commit')
    expect(sau).toContain('File chua duoc theo doi')
    expect(sau).not.toContain('Thay doi da chuan bi de commit')
  })

  it('restore thiếu tên file thì báo lỗi dạy được', () => {
    expect(chayLenh('git init\ngit restore').error).toContain('Thieu ten file')
  })

  it('restore file không nằm trong vùng chờ khi dùng --staged thì báo lỗi', () => {
    expect(chayLenh('git init\necho "a" > f.txt\ngit restore --staged f.txt').error).toContain(
      'khong o trong vung cho',
    )
  })

  it('reset --soft: dời nhánh về commit cũ nhưng GIỮ nguyên vùng chờ + thư mục làm việc', () => {
    const r = chayLenh(`git init
echo "a" > f.txt
git add .
git commit -m "c1"
echo "b" > g.txt
git add .
git commit -m "c2"
git reset --soft c1
git status`)
    expect(r.error).toBeUndefined()
    // Sau reset --soft, g.txt (đã commit ở c2) giờ lại nằm trong vùng chờ so với c1.
    expect(r.output).toContain('Thay doi da chuan bi de commit')
  })

  it('reset --hard: xoá cả vùng chờ lẫn thư mục làm việc, cảnh báo trước', () => {
    const r = chayLenh(`git init
echo "a" > f.txt
git add .
git commit -m "c1"
echo "b" > g.txt
git add .
git commit -m "c2"
git reset --hard c1
ls`)
    expect(r.error).toBeUndefined()
    expect(r.output).toContain('CANH BAO')
    // Kiểm đúng KẾT QUẢ của `ls` (dòng cuối) — không kiểm toàn bộ transcript vì transcript
    // còn in lại cả lệnh "echo ... > g.txt" (tên file g.txt xuất hiện ở ĐÓ, không phải ở ls).
    const dongCuoi = r.output.trim().split('\n').pop()
    expect(dongCuoi).toBe('f.txt')
  })

  it('restore <file> khoi phuc TU BAN DA ADD (chua commit) khi dang co trong vung cho', () => {
    const r = chayLenh(`git init
echo "goc" > f.txt
git add .
git commit -m "c1"
echo "da add" > f.txt
git add .
echo "sua tiep sau khi add" > f.txt
git restore f.txt
cat f.txt`)
    expect(r.error).toBeUndefined()
    expect(r.output.trim().split('\n').pop()).toBe('da add')
  })

  it('reset tới commit không tồn tại thì báo lỗi dạy được (gợi ý git log)', () => {
    expect(
      chayLenh('git init\necho "a" > f.txt\ngit add .\ngit commit -m "c"\ngit reset c9').error,
    ).toContain('git log --oneline')
  })

  it('revert tạo COMMIT MỚI hoàn tác nội dung, KHÔNG xoá lịch sử (khác reset)', () => {
    const r = chayLenh(`git init
echo "a" > f.txt
git add .
git commit -m "c1"
echo "b" > f.txt
git add .
git commit -m "c2 sai roi"
git revert c2
git log --oneline
cat f.txt`)
    expect(r.error).toBeUndefined()
    expect(r.output).toContain('Revert "c2 sai roi"')
    // Lịch sử vẫn còn đủ 3 commit (c1, c2, và commit revert mới) — không bị xoá.
    expect(r.output).toContain('c1 c1')
    expect(r.output).toContain('c2 c2 sai roi')
    expect(r.output).toContain('a')
    expect(r.output).not.toContain('\nb\n')
  })

  it('revert khi nhanh hien tai CHUA co commit nao (khong co cha)', () => {
    const r = chayLenh(`git init
git branch b
echo "a" > f.txt
git add .
git commit -m "c1 tren main"
git switch b
git revert c1
git log --oneline`)
    expect(r.error).toBeUndefined()
    expect(r.output).toContain('Revert "c1 tren main"')
  })

  it('revert thieu ma commit thi bao loi', () => {
    expect(chayLenh('git init\ngit revert').error).toContain('Thieu ma commit')
  })

  it('revert commit không tồn tại thì báo lỗi', () => {
    expect(chayLenh('git init\ngit revert c9').error).toContain('Khong co commit')
  })

  it('reflog liệt kê MỌI commit từng tạo, kể cả sau khi reset --hard "làm mất" nó', () => {
    const r = chayLenh(`git init
echo "a" > f.txt
git add .
git commit -m "c1"
echo "b" > f.txt
git add .
git commit -m "c2"
git reset --hard c1
git reflog`)
    expect(r.error).toBeUndefined()
    // c2 không còn trên nhánh nào, nhưng reflog vẫn nhớ — đây là lý do reflog "cứu hộ" được.
    expect(r.output).toContain('c2')
    expect(r.output).toContain('c1')
  })

  it('reflog khi chưa có commit nào', () => {
    expect(chayLenh('git init\ngit reflog').output).toContain('Chua co gi trong reflog')
  })
})

describe('gitSim — tầng KHO TỪ XA GIẢ LẬP (remote/push/fetch/pull/clone)', () => {
  const NEN = `git init
echo "goc" > f.txt
git add .
git commit -m "c1"
`

  it('push khi chưa remote add thì báo lỗi gợi đúng lệnh kế tiếp', () => {
    expect(chayLenh(`${NEN}git push`).error).toContain('git remote add origin')
  })

  it('remote add + push -u origin main: thiết lập upstream, đẩy lên thành công', () => {
    const r = chayLenh(`${NEN}git remote add origin https://vi-du.local/kho.git
git push -u origin main`)
    expect(r.error).toBeUndefined()
    expect(r.output).toContain('Da day len origin/main')
  })

  it('remote add hai lần thì báo lỗi; remote -v liệt kê URL', () => {
    const script = `${NEN}git remote add origin https://vi-du.local/kho.git`
    expect(chayLenh(`${script}\ngit remote add origin https://khac.local/kho.git`).error).toContain(
      'da ton tai',
    )
    expect(chayLenh(`${script}\ngit remote -v`).output).toContain('https://vi-du.local/kho.git')
  })

  it('fetch không đổi gì cục bộ, chỉ báo trạng thái origin', () => {
    const r = chayLenh(`${NEN}git remote add origin https://vi-du.local/kho.git
git push -u origin main
git fetch`)
    expect(r.output).toContain('origin/main')
  })

  it('pull khi chưa có gì mới trên origin thì nói "không có gì mới"', () => {
    const r = chayLenh(`${NEN}git remote add origin https://vi-du.local/kho.git
git push -u origin main
git pull`)
    expect(r.output).toContain('khong co gi moi')
  })

  it('pull sau khi "người khác" push thêm (không đụng file nào của mình) → tua nhanh', () => {
    // remote add + push + "người khác push thêm" đều nằm trong BỐI CẢNH (chạy trước, không in
    // ra) — đúng khuôn các bài Make đã có: đề bài nói "kho của bạn đang có…", học viên chỉ gõ
    // lệnh MỚI (ở đây là `git pull`).
    const boiCanh = [
      'git init',
      'echo "cua toi" > minh.txt',
      'git add .',
      'git commit -m "c1"',
      'git remote add origin https://vi-du.local/kho.git',
      'git push -u origin main',
      'remote-seed main "commit cua nguoi khac" nguoikhac.txt "noi dung ho"',
    ]
    const r = chayLenh('git pull\ngit log --oneline\nls', boiCanh)
    expect(r.error).toBeUndefined()
    expect(r.output).toContain('Tua nhanh (fast-forward) tu origin/main')
    expect(r.output).toContain('minh.txt')
    expect(r.output).toContain('nguoikhac.txt')
  })

  it('pull khi CẢ HAI phía cùng sửa MỘT file → chèn dấu xung đột thật, KHÔNG tự tạo commit', () => {
    const boiCanh = [
      'git init',
      'echo "ban goc" > f.txt',
      'git add .',
      'git commit -m "c1"',
      'git remote add origin https://vi-du.local/kho.git',
      'git push -u origin main',
      'echo "ban cua toi" > f.txt',
      'git add .',
      'git commit -m "sua o may toi"',
      'remote-seed main "sua tren github" f.txt "ban cua nguoi khac"',
    ]
    const r = chayLenh('git pull\ncat f.txt', boiCanh)
    expect(r.error).toBeUndefined()
    expect(r.output).toContain('XUNG DOT')
    expect(r.output).toContain('<<<<<<< HEAD')
    expect(r.output).toContain('=======')
    expect(r.output).toContain('>>>>>>> origin/main')
    expect(r.output).toContain('ban cua toi')
    expect(r.output).toContain('ban cua nguoi khac')
  })

  it('commit khi còn xung đột chưa giải thì bị chặn; giải xong rồi commit thì thành công', () => {
    const boiCanh = [
      'git init',
      'echo "ban goc" > f.txt',
      'git add .',
      'git commit -m "c1"',
      'git remote add origin https://vi-du.local/kho.git',
      'git push -u origin main',
      'echo "ban cua toi" > f.txt',
      'git add .',
      'git commit -m "sua o may toi"',
      'remote-seed main "sua tren github" f.txt "ban cua nguoi khac"',
      'git pull',
    ]
    const chuaGiai = chayLenh('git commit -m "xong roi"', boiCanh)
    expect(chuaGiai.error).toContain('Con xung dot chua giai')

    const daGiai = chayLenh(
      'echo "da hop nhat ca hai" > f.txt\ngit add f.txt\ngit commit -m "giai xung dot"\ngit log --oneline',
      boiCanh,
    )
    expect(daGiai.error).toBeUndefined()
    expect(daGiai.output).toContain('Da hoan tat gop')
    expect(daGiai.output).toContain('giai xung dot')
  })

  it('push khi origin có commit mình chưa có thì bị từ chối (phải pull trước)', () => {
    const boiCanh = [
      'git init',
      'echo "a" > f.txt',
      'git add .',
      'git commit -m "c1"',
      'git remote add origin https://vi-du.local/kho.git',
      'git push -u origin main',
      'echo "b" > g.txt',
      'git add .',
      'git commit -m "c2 o may toi"',
      'remote-seed main "cua nguoi khac" h.txt "noi dung"',
    ]
    const r = chayLenh('git push', boiCanh)
    expect(r.error).toContain('Chay "git pull" truoc')
  })

  it('push --force-with-lease vẫn đẩy được dù origin đã có commit mới (chấp nhận rủi ro)', () => {
    const boiCanh = [
      'git init',
      'echo "a" > f.txt',
      'git add .',
      'git commit -m "c1"',
      'git remote add origin https://vi-du.local/kho.git',
      'git push -u origin main',
      'echo "b" > g.txt',
      'git add .',
      'git commit -m "c2"',
      'remote-seed main "cua nguoi khac" h.txt "noi dung"',
    ]
    const r = chayLenh('git push --force-with-lease origin main', boiCanh)
    expect(r.error).toBeUndefined()
    expect(r.output).toContain('Da day len origin/main')
  })

  it('clone: kho mới tinh tải toàn bộ lịch sử + file từ origin', () => {
    const r = chayLenh('git clone https://mo-phong.local/kho.git\ngit log --oneline\nls', [
      'remote-seed main "commit dau" README.md "xin chao"',
    ])
    expect(r.error).toBeUndefined()
    expect(r.output).toContain('README.md')
    expect(r.output).toContain('commit dau')
  })

  it('clone kho không tồn tại (URL không khớp bối cảnh) thì báo lỗi rõ ràng', () => {
    expect(chayLenh('git clone https://khong-ton-tai.local/x.git').error).toBeTruthy()
  })

  it('clone khi thư mục đã là kho git thì báo lỗi', () => {
    expect(chayLenh('git init\ngit clone https://vi-du.local/kho.git').error).toContain(
      'da la kho git roi',
    )
  })
})

describe('gitSim — tầng NÂNG CAO (stash/tag/cherry-pick/rebase)', () => {
  it('stash push cất thay đổi, dọn sạch thư mục; stash pop lấy lại và xoá khỏi ngăn', () => {
    const r = chayLenh(`git init
echo "a" > f.txt
git add .
git commit -m "c1"
echo "dang lam do" > g.txt
git stash push -m "dang lam do"
git status
git stash pop
cat g.txt
git stash list`)
    expect(r.error).toBeUndefined()
    expect(r.output).toContain('thu muc lam viec sach')
    expect(r.output).toContain('dang lam do')
    expect(r.output).toContain('(khong co stash nao)')
  })

  it('stash push cat luon thay doi DA ADD (vung cho khac commit goc)', () => {
    const r = chayLenh(`git init
echo "goc" > f.txt
git add .
git commit -m "c1"
echo "da add roi" > f.txt
git add .
git stash push -m "da add"
git status`)
    expect(r.error).toBeUndefined()
    expect(r.output).toContain('thu muc lam viec sach')
  })

  it('stash push khi không có gì để cất thì báo lỗi', () => {
    expect(chayLenh('git init\ngit stash push').error).toContain('Khong co gi de stash')
  })

  it('stash pop khi ngăn rỗng thì báo lỗi', () => {
    expect(chayLenh('git init\ngit stash pop').error).toContain('Khong co stash nao')
  })

  it('tag -a gắn nhãn lên commit hiện tại; liệt kê ra đúng tên; trùng tên thì báo lỗi', () => {
    const r = chayLenh(`git init
echo "a" > f.txt
git add .
git commit -m "c1"
git tag -a v1.0 -m "Ban dau tien"
git tag`)
    expect(r.error).toBeUndefined()
    expect(r.output).toContain('v1.0')
    expect(
      chayLenh(
        `git init\necho "a" > f.txt\ngit add .\ngit commit -m "c"\ngit tag -a v1.0 -m "x"\ngit tag -a v1.0 -m "y"`,
      ).error,
    ).toContain('da ton tai')
  })

  it('tag không kèm -a thì báo lỗi dạy được', () => {
    expect(chayLenh('git init\ngit tag -a').error).toContain('Thieu ten tag')
  })

  it('cherry-pick mang một commit sang nhánh khác, tạo mã commit MỚI', () => {
    const r = chayLenh(`git init
echo "a" > f.txt
git add .
git commit -m "c1"
git switch -c phu
echo "b" > g.txt
git add .
git commit -m "them g"
git switch main
git cherry-pick c2
git log --oneline
ls`)
    expect(r.error).toBeUndefined()
    expect(r.output).toContain('them g')
    expect(r.output).toContain('g.txt')
    // Commit mới trên main không trùng mã c2 (mã sinh mới, không phải copy mã cũ).
    expect(r.output.match(/c3/)).toBeTruthy()
  })

  it('cherry-pick commit không tồn tại thì báo lỗi', () => {
    expect(chayLenh('git init\ngit cherry-pick c9').error).toContain('Khong co commit')
  })

  it('rebase tuyến tính: chuyển tiếp commit riêng của nhánh phụ lên đầu nhánh chính', () => {
    const r = chayLenh(`git init
echo "a" > f.txt
git add .
git commit -m "c1"
git switch -c phu
echo "b" > g.txt
git add .
git commit -m "them g"
git switch main
echo "c" > h.txt
git add .
git commit -m "them h tren main"
git switch phu
git rebase main
git log --oneline`)
    expect(r.error).toBeUndefined()
    expect(r.output).toContain('Da rebase 1 commit')
    expect(r.output).toContain('them h tren main')
    expect(r.output).toContain('them g')
  })

  it('rebase -i (tương tác) không được mô phỏng, nói rõ nằm ngoài bài học', () => {
    expect(
      chayLenh('git init\necho "a" > f.txt\ngit add .\ngit commit -m "c"\ngit rebase main -i')
        .error,
    ).toContain('nam ngoai bai hoc')
  })

  it('rebase khi nhánh đích chưa có commit nào (tổ tiên là gốc rỗng) vẫn chạy được', () => {
    const r = chayLenh(`git init
git branch dich
echo "a" > f.txt
git add .
git commit -m "c1"
git rebase dich
git log --oneline`)
    expect(r.error).toBeUndefined()
    expect(r.output).toContain('Da rebase 1 commit')
  })
})

describe('gitSim — lệnh git chưa init / thiếu tham số / ca biên status-add-commit-log-branch', () => {
  it('mọi lệnh git đều đòi hỏi đã "git init" trước', () => {
    expect(chayLenh('git status').error).toContain('Thu muc nay chua phai kho git')
  })

  it('git status: hiện "chua chuan bi" khi sua file da commit nhung chua add lai', () => {
    const r = chayLenh(`git init
echo "goc" > f.txt
git add .
git commit -m "c1"
echo "sua roi" > f.txt
git status`)
    expect(r.error).toBeUndefined()
    expect(r.output).toContain('Thay doi chua chuan bi (can git add)')
  })

  it('git add khong co tham so thi bao loi', () => {
    expect(chayLenh('git init\ngit add').error).toContain('Thieu ten file')
  })

  it('git add file khong ton tai trong thu muc thi bao loi', () => {
    expect(chayLenh('git init\ngit add khong-co.txt').error).toContain('Khong co file')
  })

  it('git commit thieu -m thi bao loi', () => {
    expect(chayLenh('git init\necho "a" > f.txt\ngit add .\ngit commit').error).toContain(
      'Commit phai co loi nhan',
    )
  })

  it('git commit khi vung cho khong co gi moi thi bao loi', () => {
    expect(
      chayLenh(
        'git init\necho "a" > f.txt\ngit add .\ngit commit -m "c1"\ngit add .\ngit commit -m "lai nua"',
      ).error,
    ).toContain('Khong co gi trong vung cho de commit')
  })

  it('git log khi chua co commit nao', () => {
    expect(chayLenh('git init\ngit log').output).toContain('Chua co commit nao')
  })

  it('git log dang day du (khong --oneline) hien nhanh + loi nhan', () => {
    const r = chayLenh('git init\necho "a" > f.txt\ngit add .\ngit commit -m "c1"\ngit log')
    expect(r.output).toContain('commit c1')
    expect(r.output).toContain('Nhanh: main')
  })

  it('git branch khong tham so thi liet ke, nhanh hien tai co dau *', () => {
    const r = chayLenh(
      'git init\necho "a" > f.txt\ngit add .\ngit commit -m "c1"\ngit branch phu\ngit branch',
    )
    expect(r.output).toContain('* main')
    expect(r.output).toContain('  phu')
  })

  it('git branch ten da ton tai thi bao loi', () => {
    expect(chayLenh('git init\ngit branch main').error).toContain('da ton tai roi')
  })

  it('git switch sang nhanh khong ton tai thi bao loi', () => {
    expect(chayLenh('git init\ngit switch khong-co').error).toContain('Khong co nhanh')
  })

  it('git switch -c sang nhanh da ton tai thi bao loi', () => {
    expect(
      chayLenh(
        'git init\necho "a" > f.txt\ngit add .\ngit commit -m "c1"\ngit branch phu\ngit switch -c phu',
      ).error,
    ).toContain('da ton tai roi')
  })

  it('git switch thieu ten nhanh thi bao loi', () => {
    expect(chayLenh('git init\ngit switch').error).toContain('Thieu ten nhanh')
  })
})

describe('gitSim — git merge: thiếu tham số, nhánh không tồn tại, gộp thật + xung đột', () => {
  it('merge thieu ten nhanh thi bao loi', () => {
    expect(chayLenh('git init\ngit merge').error).toContain('Thieu ten nhanh')
  })

  it('merge nhanh khong ton tai thi bao loi', () => {
    expect(chayLenh('git init\ngit merge khong-co').error).toContain('Khong co nhanh')
  })

  it('merge vao chinh no thi bao loi', () => {
    expect(chayLenh('git init\ngit merge main').error).toContain('gop mot nhanh vao chinh no')
  })

  it('merge nhanh trung tip voi main (tao SAU khi da co commit) thi fast-forward, khong loi', () => {
    expect(
      chayLenh(
        'git init\necho "a" > f.txt\ngit add .\ngit commit -m "c1"\ngit branch phu\ngit merge phu',
      ).error,
    ).toBeUndefined() // fast-forward vì phu trùng main, không lỗi — kiểm output riêng dưới
  })

  it('merge nhanh CHUA TUNG co commit nao (tao TRUOC commit dau) thi bao loi', () => {
    // git branch phu khi main chưa có commit nào -> phu cũng có HEAD null. Khác test phía trên
    // (branch tạo SAU commit, nên trùng tip = fast-forward) — đây là ca thật sự "chưa có gì".
    expect(
      chayLenh(
        'git init\ngit branch phu\necho "a" > f.txt\ngit add .\ngit commit -m "c1"\ngit merge phu',
      ).error,
    ).toContain('chua co commit nao de gop')
  })

  it('merge khong-fast-forward, hai nhanh sua file khac nhau: tao commit gop, canh bao khi trung', () => {
    const r = chayLenh(`git init
echo "a" > f.txt
git add .
git commit -m "c1"
git switch -c phu
echo "b" > g.txt
git add .
git commit -m "them g"
git switch main
echo "c" > h.txt
git add .
git commit -m "them h"
git merge phu`)
    expect(r.error).toBeUndefined()
    expect(r.output).toContain('Da gop nhanh phu vao main')
  })

  it('merge khong-fast-forward, hai nhanh cung sua MOT file: gop nhung canh bao xung dot', () => {
    const r = chayLenh(`git init
echo "goc" > f.txt
git add .
git commit -m "c1"
git switch -c phu
echo "sua o phu" > f.txt
git add .
git commit -m "sua tren phu"
git switch main
echo "sua o main" > f.txt
git add .
git commit -m "sua tren main"
git merge phu`)
    expect(r.error).toBeUndefined()
    expect(r.output).toContain('Luu y: ca hai nhanh cung sua f.txt')
    expect(r.output).toContain('XUNG DOT')
  })
})

describe('gitSim — diff/restore/reset ca bien con lai', () => {
  it('diff file moi tao chua add hien dong + (khong co dong -)', () => {
    const r = chayLenh('git init\necho "noi dung moi" > moi.txt\ngit diff')
    expect(r.error).toBeUndefined()
    expect(r.output).toContain('+noi dung moi')
  })

  it('diff --staged hien dung dong doi khi vung cho co thay doi thuc su', () => {
    const r = chayLenh('git init\necho "dong moi" > f.txt\ngit add .\ngit diff --staged')
    expect(r.error).toBeUndefined()
    expect(r.output).toContain('diff --git a/f.txt b/f.txt')
    expect(r.output).toContain('+dong moi')
  })

  it('diff --staged rong khi vung cho khong co gi khac voi commit gan nhat', () => {
    const r = chayLenh(
      'git init\necho "a" > f.txt\ngit add .\ngit commit -m "c1"\ngit diff --staged',
    )
    expect(r.error).toBeUndefined()
    expect(r.output.trim().endsWith('$ git diff --staged')).toBe(true)
  })

  it('restore file chua tung add/commit thi bao loi khong co gi de khoi phuc', () => {
    expect(chayLenh('git init\necho "a" > f.txt\ngit restore f.txt').error).toContain(
      'Khong co gi de khoi phuc',
    )
  })

  it('git reset khong tham so nao va chua co commit thi bao loi', () => {
    expect(chayLenh('git init\ngit reset').error).toContain('Khong co commit de reset ve')
  })

  it('git reset khong tham so muc (mac dinh mixed) ve chinh HEAD hien tai', () => {
    const r = chayLenh('git init\necho "a" > f.txt\ngit add .\ngit commit -m "c1"\ngit reset')
    expect(r.error).toBeUndefined()
    expect(r.output).toContain('Da reset (mixed)')
  })
})

describe('gitSim — revert ca bien: revert commit dau tien (khong co cha)', () => {
  it('revert commit dau tien: khong co "truoc", xoa het file khoi ban chup moi', () => {
    const r = chayLenh(`git init
echo "a" > f.txt
git add .
git commit -m "c1"
git revert c1
ls`)
    expect(r.error).toBeUndefined()
    expect(r.output).toContain('Revert "c1"')
    const dongCuoi = r.output.trim().split('\n').pop()
    expect(dongCuoi).toBe('(thu muc rong)')
  })
})

describe('gitSim — remote/push/fetch ca bien con lai', () => {
  it('remote -v khi chua co remote nao', () => {
    expect(chayLenh('git init\ngit remote -v').output).toContain('(chua co remote nao)')
  })

  it('remote add ten khac "origin" thi bao loi', () => {
    expect(
      chayLenh('git init\ngit remote add upstream https://vi-du.local/kho.git').error,
    ).toContain('mot remote ten "origin"')
  })

  it('remote add thieu URL thi bao loi', () => {
    expect(chayLenh('git init\ngit remote add origin').error).toContain('Thieu URL')
  })

  it('remote subcommand khong ho tro thi bao loi', () => {
    expect(chayLenh('git init\ngit remote rm origin').error).toContain('Mo phong ho tro')
  })

  it('push voi remote khac "origin" thi bao loi', () => {
    expect(
      chayLenh(
        'git init\necho "a" > f.txt\ngit add .\ngit commit -m "c1"\ngit remote add origin https://vi-du.local/kho.git\ngit push khac main',
      ).error,
    ).toContain('chi co remote "origin"')
  })

  it('push nhanh chua co commit nao thi bao loi', () => {
    expect(
      chayLenh('git init\ngit remote add origin https://vi-du.local/kho.git\ngit push origin main')
        .error,
    ).toContain('chua co commit nao de day')
  })

  it('fetch chua co remote thi bao loi', () => {
    expect(chayLenh('git init\ngit fetch').error).toContain('Chua co remote')
  })

  it('fetch khi remote chua co nhanh nao', () => {
    expect(
      chayLenh('git init\ngit remote add origin https://vi-du.local/kho.git\ngit fetch').output,
    ).toContain('origin chua co nhanh nao')
  })

  it('pull lan hai lien tiep sau khi da dong bo het thi bao "da cap nhat"', () => {
    const r = chayLenh(`git init
echo "a" > f.txt
git add .
git commit -m "c1"
git remote add origin https://vi-du.local/kho.git
git push -u origin main
git pull
git pull`)
    expect(r.error).toBeUndefined()
    // Pull lần 2: idKia === idNay ngay trong origin (không có gì đổi từ lần fetch trước sau ff)
    const soLanKhongMoi = (r.output.match(/khong co gi moi/g) ?? []).length
    expect(soLanKhongMoi).toBeGreaterThanOrEqual(1)
  })

  it('pull khi local da vuot xa remote (local dang truoc) thi bao "da cap nhat"', () => {
    const boiCanh = [
      'git init',
      'echo "a" > f.txt',
      'git add .',
      'git commit -m "c1"',
      'git remote add origin https://vi-du.local/kho.git',
      'git push -u origin main',
      'echo "b" > g.txt',
      'git add .',
      'git commit -m "c2 them local"',
    ]
    const r = chayLenh('git pull', boiCanh)
    expect(r.error).toBeUndefined()
    expect(r.output).toContain('Da cap nhat')
  })

  it('pull gop sach (khong trung file) tu ca hai nhanh phan ky: tao commit gop tu dong', () => {
    const boiCanh = [
      'git init',
      'echo "a" > f.txt',
      'git add .',
      'git commit -m "c1"',
      'git remote add origin https://vi-du.local/kho.git',
      'git push -u origin main',
      'echo "cua toi" > minh.txt',
      'git add .',
      'git commit -m "them cua toi"',
      'remote-seed main "them cua nguoi khac" nguoikhac.txt "noi dung ho"',
    ]
    const r = chayLenh('git pull\ngit log --oneline\nls', boiCanh)
    expect(r.error).toBeUndefined()
    expect(r.output).toContain('Da gop origin/main vao main')
    expect(r.output).toContain('minh.txt')
    expect(r.output).toContain('nguoikhac.txt')
  })

  it('xung dot khi ben kia con sua them file KHONG trung: file rieng cua kia van duoc ap dung', () => {
    const boiCanh = [
      'git init',
      'echo "ban goc" > f.txt',
      'git add .',
      'git commit -m "c1"',
      'git remote add origin https://vi-du.local/kho.git',
      'git push -u origin main',
      'echo "toi sua" > f.txt',
      'git add .',
      'git commit -m "sua o may toi"',
    ]
    // remote-seed nối tiếp thêm commit khác của "người khác" chứa cả file trùng (f.txt) lẫn
    // file riêng (chi_co_o_remote.txt) — kiểm nhánh áp file riêng của phía kia khi có xung đột.
    const boiCanhDay = [
      ...boiCanh,
      'remote-seed main "sua tren github" f.txt "ban cua nguoi khac"',
      'remote-seed main "them file rieng" chi_co_o_remote.txt "chi co ben do"',
    ]
    const r = chayLenh('git pull\ncat chi_co_o_remote.txt', boiCanhDay)
    expect(r.error).toBeUndefined()
    expect(r.output).toContain('XUNG DOT')
    expect(r.output.trim().split('\n').pop()).toBe('chi co ben do')
  })

  it('pull khi dang gop do (con xung dot chua giai) thi bao loi, khong pull tiep', () => {
    const boiCanh = [
      'git init',
      'echo "ban goc" > f.txt',
      'git add .',
      'git commit -m "c1"',
      'git remote add origin https://vi-du.local/kho.git',
      'git push -u origin main',
      'echo "ban cua toi" > f.txt',
      'git add .',
      'git commit -m "sua o may toi"',
      'remote-seed main "sua tren github" f.txt "ban cua nguoi khac"',
      'git pull',
    ]
    const r = chayLenh('git pull', boiCanh)
    expect(r.error).toContain('Dang gop dang do')
  })

  it('clone khi remote ton tai (dung URL) nhung nhanh "main" chua tung co commit nao', () => {
    // remote-seed dựng remote với URL cố định 'https://mo-phong.local/kho.git', nhưng seed vào
    // nhánh KHÁC ("feature") — nhánh "main" mà clone mặc định lấy vẫn chưa có commit nào, phủ
    // đúng nhánh `id === null` (kho từ xa có tồn tại nhưng nhánh main rỗng).
    const r = chayLenh('git clone https://mo-phong.local/kho.git\nls', [
      'remote-seed feature "commit tren nhanh khac" f.txt "noi dung"',
    ])
    expect(r.error).toBeUndefined()
    expect(r.output).toContain('Da clone tu')
    expect(r.output.trim().split('\n').pop()).toBe('(thu muc rong)')
  })

  it('clone thieu URL thi bao loi', () => {
    expect(chayLenh('git clone').error).toContain('Thieu URL')
  })

  it('pull chua co remote thi bao loi', () => {
    expect(
      chayLenh('git init\necho "a" > f.txt\ngit add .\ngit commit -m "c1"\ngit pull').error,
    ).toContain('Chua co remote')
  })

  it('pull khi CHUA TUNG push (origin khong co nhanh nay) thi bao dung thong diep "Khong co gi moi"', () => {
    const r = chayLenh(`git init
echo "a" > f.txt
git add .
git commit -m "c1"
git remote add origin https://vi-du.local/kho.git
git pull`)
    expect(r.error).toBeUndefined()
    expect(r.output).toContain('Khong co gi moi tu origin/main.')
  })
})

describe('gitSim — stash/tag/cherry-pick/rebase ca bien con lai', () => {
  it('stash push khong -m dung thong diep mac dinh "WIP tren <nhanh>"', () => {
    const r = chayLenh('git init\necho "a" > f.txt\ngit stash push')
    expect(r.error).toBeUndefined()
    expect(r.output).toContain('WIP tren main')
  })

  it('stash list khi co nhieu muc, moi nhat dung dau', () => {
    const r = chayLenh(`git init
echo "a" > f.txt
git stash push -m "cai thu nhat"
echo "b" > g.txt
git stash push -m "cai thu hai"
git stash list`)
    expect(r.error).toBeUndefined()
    expect(r.output).toContain('stash@{0}: cai thu hai')
    expect(r.output).toContain('stash@{1}: cai thu nhat')
  })

  it('stash apply giu nguyen trong ngan (khac pop)', () => {
    const r = chayLenh(`git init
echo "a" > f.txt
git stash push -m "x"
git stash apply
git stash list`)
    expect(r.error).toBeUndefined()
    expect(r.output).toContain('VAN GIU trong ngan stash')
    expect(r.output).toContain('stash@{0}: x')
  })

  it('stash drop xoa muc moi nhat', () => {
    const r = chayLenh(`git init
echo "a" > f.txt
git stash push -m "x"
git stash drop
git stash list`)
    expect(r.error).toBeUndefined()
    expect(r.output).toContain('Da xoa stash@{0}')
    expect(r.output).toContain('(khong co stash nao)')
  })

  it('stash khong kem subcommand mac dinh la "push"', () => {
    const r = chayLenh('git init\necho "a" > f.txt\ngit stash\ngit status')
    expect(r.error).toBeUndefined()
    expect(r.output).toContain('Da cat (stash) thay doi')
    expect(r.output).toContain('thu muc lam viec sach')
  })

  it('stash push -m nhung thieu chu sau -m thi dung mac dinh "WIP"', () => {
    const r = chayLenh('git init\necho "a" > f.txt\ngit stash push -m')
    expect(r.error).toBeUndefined()
    expect(r.output).toContain('Da cat (stash) thay doi: WIP')
  })

  it('stash drop khi ngan rong thi bao loi', () => {
    expect(chayLenh('git init\ngit stash drop').error).toContain('Khong co stash nao de xoa')
  })

  it('stash subcommand khong ho tro thi bao loi', () => {
    expect(chayLenh('git init\ngit stash unstash').error).toContain('Mo phong ho tro')
  })

  it('tag khong tham so va chua co tag nao', () => {
    expect(chayLenh('git init\ngit tag').output).toContain('(chua co tag nao)')
  })

  it('tag khong kem -a (vi du "git tag v1.0") thi bao loi', () => {
    expect(chayLenh('git init\ngit tag v1.0').error).toContain('Mo phong chi ho tro')
  })

  it('tag -a khi chua co commit nao thi bao loi', () => {
    expect(chayLenh('git init\ngit tag -a v1.0 -m "x"').error).toContain(
      'Chua co commit nao de gan tag',
    )
  })

  it('cherry-pick khi nhanh hien tai CHUA co commit nao (khong co cha)', () => {
    const r = chayLenh(`git init
git branch b
echo "a" > f.txt
git add .
git commit -m "c1 tren main"
git switch b
git cherry-pick c1
git log --oneline`)
    expect(r.error).toBeUndefined()
    expect(r.output).toContain('c1 tren main')
  })

  it('cherry-pick thieu ma commit thi bao loi', () => {
    expect(chayLenh('git init\ngit cherry-pick').error).toContain('Thieu ma commit')
  })

  it('rebase thieu ten nhanh thi bao loi', () => {
    expect(
      chayLenh('git init\necho "a" > f.txt\ngit add .\ngit commit -m "c1"\ngit rebase').error,
    ).toContain('Thieu ten nhanh')
  })

  it('rebase nhanh khong ton tai thi bao loi', () => {
    expect(
      chayLenh('git init\necho "a" > f.txt\ngit add .\ngit commit -m "c1"\ngit rebase khong-co')
        .error,
    ).toContain('Khong co nhanh')
  })

  it('rebase khi nhanh hien tai chua co commit nao thi bao loi', () => {
    expect(chayLenh('git init\ngit branch dich\ngit rebase dich').error).toContain(
      'chua co commit nao de rebase',
    )
  })

  it('rebase khong tuyen tinh (hai nhanh KHONG chung to tien, tao boi git branch truoc commit dau) thi bao loi', () => {
    // git branch b" khi main CHUA co commit nao -> ca hai nhanh cung co HEAD null; commit dau
    // tien tren moi nhanh vi vay co parents=[] rieng biet — hai "goc" khac nhau, khong chung
    // to tien. Day la ca duy nhat hop le de tao lich su khong lien thong trong mo phong nay.
    const r = chayLenh(`git init
git branch b
echo "a" > f.txt
git add .
git commit -m "c1 tren main"
git switch b
echo "b" > g.txt
git add .
git commit -m "c2 tren b"
git rebase main`)
    expect(r.error).toContain('to tien chung')
  })
})

describe('gitSim — chayGit: lệnh chưa hỗ trợ / thiếu lệnh / init lặp lại', () => {
  it('git khong kem lenh con thi bao loi', () => {
    expect(chayLenh('git').error).toContain('Thieu lenh git')
  })

  it('git init lan hai tren cung kho thi bao "da la kho git roi" (khong loi)', () => {
    const r = chayLenh('git init\ngit init')
    expect(r.error).toBeUndefined()
    expect(r.output).toContain('da la kho git roi')
  })

  it('lenh git khong duoc ho tro thi bao loi liet ke danh sach lenh dung duoc', () => {
    expect(chayLenh('git init\ngit foobar').error).toContain('Mo phong chua ho tro "git foobar"')
  })
})

describe('gitSim — lệnh shell: pwd/ls/cat/rm/echo/mkdir/cd/không hỗ trợ', () => {
  it('pwd tra ve duong dan gia lap co dinh', () => {
    expect(chayLenh('pwd').output).toContain('/home/ban/du-an')
  })

  it('ls khi thu muc rong', () => {
    expect(chayLenh('ls').output).toBe('$ ls\n(thu muc rong)')
  })

  it('cat thieu ten file thi bao loi', () => {
    expect(chayLenh('cat').error).toContain('Thieu ten file')
  })

  it('cat file khong ton tai thi bao loi', () => {
    expect(chayLenh('cat khong-co.txt').error).toContain('Khong co file')
  })

  it('rm thieu ten file thi bao loi', () => {
    expect(chayLenh('rm').error).toContain('Thieu ten file')
  })

  it('rm file khong ton tai thi bao loi', () => {
    expect(chayLenh('rm khong-co.txt').error).toContain('Khong co file')
  })

  it('rm xoa file thanh cong', () => {
    const r = chayLenh('echo "a" > f.txt\nrm f.txt\nls')
    expect(r.error).toBeUndefined()
    expect(r.output.trim().split('\n').pop()).toBe('(thu muc rong)')
  })

  it('echo khong co dau chuyen huong thi tra ve nguyen van noi dung', () => {
    expect(chayLenh('echo xin chao ban').output).toContain('xin chao ban')
  })

  it('echo voi >> noi tiep vao file da co', () => {
    const r = chayLenh('echo "dong 1" > f.txt\necho "dong 2" >> f.txt\ncat f.txt')
    expect(r.error).toBeUndefined()
    expect(r.output).toContain('dong 1')
    expect(r.output).toContain('dong 2')
  })

  it('echo voi > nhung thieu ten file thi bao loi', () => {
    expect(chayLenh('echo "xin chao" >').error).toContain('Thieu ten file sau dau')
  })

  it('remote-seed thieu tham so thi bao loi', () => {
    expect(chayLenh('remote-seed main').error).toContain('remote-seed can 4 tham so')
  })

  it('mkdir va cd tra ve thong diep mo phong phang', () => {
    expect(chayLenh('mkdir thumuc').output).toContain('mo phong: khong tao cay thu muc')
    expect(chayLenh('cd thumuc').output).toContain('mo phong: khong tao cay thu muc')
  })

  it('lenh shell khong ho tro thi bao loi', () => {
    expect(chayLenh('lenh-la').error).toContain('Mo phong chua ho tro lenh')
  })
})

describe('gitSim — chayLenh: bối cảnh lỗi, dòng trống/comment, ký tự nháy đơn', () => {
  it('dòng trống trong lenhChuanBi (bối cảnh) không sinh lệnh, không lỗi', () => {
    const r = chayLenh('git status', ['git init', ''])
    expect(r.error).toBeUndefined()
  })

  it('bối cảnh (lenhChuanBi) gặp lỗi thì trả lỗi ngay, không chạy script chính', () => {
    const r = chayLenh('git status', ['git khong-ton-tai'])
    expect(r.error).toContain('Loi khi dung boi canh')
  })

  it('dòng trống và dòng comment (#) trong script bị bỏ qua', () => {
    const r = chayLenh('\n# day la comment\ngit init\n\n# init xong\npwd')
    expect(r.error).toBeUndefined()
    expect(r.output).toContain('/home/ban/du-an')
    expect(r.output).not.toContain('#')
  })

  it("echo voi nhay don ('...') van tach tu dung", () => {
    const r = chayLenh("echo 'xin chao the gioi'")
    expect(r.output).toContain('xin chao the gioi')
  })
})

describe('gitSim — tất định + không dạy nhầm lệnh ngoài phạm vi mô phỏng', () => {
  it('kho từ xa: cùng chuỗi lệnh chạy hai lần cho output y hệt', () => {
    const script = `git init
echo "a" > f.txt
git add .
git commit -m "c1"
git remote add origin https://vi-du.local/kho.git
git push -u origin main
git stash push -m "x"
git tag -a v1 -m "y"
git log --oneline`
    expect(chayLenh(script).output).toBe(chayLenh(script).output)
  })

  it('lệnh ngoài phạm vi mô phỏng nói thẳng, không im lặng bỏ qua', () => {
    for (const lenh of ['worktree', 'submodule', 'lfs', 'mergetool', 'archive', 'fsck']) {
      const r = chayLenh(`git init\ngit ${lenh}`)
      expect(r.error, lenh).toContain('khong lam')
    }
  })
})

// Đợt 2 coverage 2026-09-05: nhánh chưa phủ — mỗi test dưới đây nhắm đúng MỘT nhánh rẽ chưa
// từng chạy tới (xem uncovered-all.md), viết theo tình huống người học thật sự có thể gõ.
describe('gitSim — Đợt 2 coverage 2026-09-05: nhánh chưa phủ', () => {
  it('git reset khong tham so tren nhanh da co commit thi reset ve dung HEAD hien tai', () => {
    const r = chayLenh(`git init
echo "a" > f.txt
git add .
git commit -m "c1"
git reset`)
    expect(r.error).toBeUndefined()
    expect(r.output).toContain('Da reset (mixed) nhanh main ve c1')
  })

  it('git reset khong tham so khi chua co commit nao thi bao loi', () => {
    expect(chayLenh('git init\ngit reset').error).toContain('Khong co commit de reset ve')
  })

  it('revert commit dau tien (khong co cha) thi file bi xoa khoi anh chup moi', () => {
    const r = chayLenh(`git init
echo "a" > f.txt
git add .
git commit -m "c1"
git revert c1
ls`)
    expect(r.error).toBeUndefined()
    const dongCuoi = r.output.trim().split('\n').pop()
    expect(dongCuoi).toBe('(thu muc rong)')
  })

  it('revert thieu ma commit thi bao loi day duoc', () => {
    expect(chayLenh('git init\ngit revert').error).toContain('Thieu ma commit')
  })

  it('revert khi nhanh hien tai chua co commit rieng nao thi van tao commit moi, lich su bat dau lai', () => {
    const r = chayLenh(`git init
git branch b1
echo "a" > f.txt
git add .
git commit -m "c1"
echo "b" > f.txt
git add .
git commit -m "c2"
git switch b1
git revert c2
git log --oneline
cat f.txt`)
    expect(r.error).toBeUndefined()
    const dongCuoi = r.output.trim().split('\n').pop()
    expect(dongCuoi).toBe('a')
    const logBlock = r.output.split('$ git log --oneline')[1]!.split('$ cat f.txt')[0]!.trim()
    expect(logBlock.split('\n')).toHaveLength(1)
    expect(logBlock).toContain('Revert "c2"')
  })

  it('git remote -v truoc khi remote add thi noi ro chua co', () => {
    expect(chayLenh('git init\ngit remote -v').output).toContain('(chua co remote nao)')
  })

  it('remote add ten khac "origin" thi bao loi', () => {
    expect(
      chayLenh('git init\ngit remote add upstream https://khac.local/kho.git').error,
    ).toContain('chi ho tro mot remote ten "origin"')
  })

  it('remote add thieu URL thi bao loi', () => {
    expect(chayLenh('git init\ngit remote add origin').error).toContain('Thieu URL')
  })

  it('git remote voi lenh con khong ho tro thi bao loi day duoc', () => {
    expect(chayLenh('git init\ngit remote status').error).toContain(
      'Mo phong ho tro: "git remote -v"',
    )
  })

  it('push toi remote khong phai "origin" thi bao loi', () => {
    const r = chayLenh(`git init
echo "a" > f.txt
git add .
git commit -m "c1"
git remote add origin https://vi-du.local/kho.git
git push upstream main`)
    expect(r.error).toContain('Mo phong chi co remote "origin"')
  })

  it('push mot nhanh chua ton tai o may thi bao loi', () => {
    const r = chayLenh(`git init
echo "a" > f.txt
git add .
git commit -m "c1"
git remote add origin https://vi-du.local/kho.git
git push origin khong-ton-tai`)
    expect(r.error).toContain('chua co commit nao de day')
  })

  it('push tu choi khi lich su remote hoan toan khong lien quan (di qua merge kim cuong)', () => {
    // Nhanh b1 la merge cua b2 vao b1 (c4 co hai cha c2,c3, cung to tien c1) — khi tim to tien
    // chung voi ban ghi remote HOAN TOAN doc lap, ham laToTien phai di qua c1 HAI LAN (tu nhanh
    // c2 va tu nhanh c3) — day la ca duy nhat kiem duoc nhanh "da xet roi, bo qua" cua BFS.
    const r = chayLenh(`git init
echo "a" > f.txt
git add .
git commit -m "c1"
git branch b1
git branch b2
git switch b1
echo "b" > g.txt
git add .
git commit -m "c2"
git switch b2
echo "c" > h.txt
git add .
git commit -m "c3"
git switch b1
git merge b2
git remote add origin https://vi-du.local/kho.git
remote-seed b1 "cua nguoi khac hoan toan" x.txt "noi dung x"
git push origin b1`)
    expect(r.error).toContain('Chay "git pull" truoc')
  })

  it('fetch khi chua co remote thi bao loi', () => {
    expect(chayLenh('git init\ngit fetch').error).toContain('Chua co remote')
  })

  it('pull khi minh da di truoc origin (origin la to tien) thi noi khong co gi moi', () => {
    const r = chayLenh(`git init
echo "a" > f.txt
git add .
git commit -m "c1"
git remote add origin https://vi-du.local/kho.git
git push -u origin main
echo "b" > g.txt
git add .
git commit -m "c2"
git pull`)
    expect(r.error).toBeUndefined()
    expect(r.output).toContain('khong co gi moi tu origin/main')
  })

  it('pull gop sach qua guiGop khi hai ben sua file KHAC nhau (khong xung dot)', () => {
    const r = chayLenh(`git init
echo "cua toi" > minh.txt
git add .
git commit -m "c1"
git remote add origin https://vi-du.local/kho.git
git push -u origin main
echo "them file rieng" > khac.txt
git add .
git commit -m "c2 rieng"
remote-seed main "cua nguoi khac" nguoikhac.txt "noi dung ho"
git pull
ls`)
    expect(r.error).toBeUndefined()
    expect(r.output).toContain('Da gop origin/main vao main')
    const lsBlock = r.output.split('$ ls')[1]!.trim().split('\n').sort()
    expect(lsBlock).toEqual(['khac.txt', 'minh.txt', 'nguoikhac.txt'])
  })

  it('pull xung dot NHUNG con file khac khong xung dot van duoc gop vao workdir', () => {
    const r = chayLenh(`git init
echo "ban goc" > f.txt
git add .
git commit -m "c1"
git remote add origin https://vi-du.local/kho.git
git push -u origin main
echo "ban cua toi" > f.txt
git add .
git commit -m "sua o may toi"
remote-seed main "sua tren github" f.txt "ban cua nguoi khac"
remote-seed main "them file rieng tren remote" khac.txt "noi dung rieng"
git pull
cat khac.txt`)
    expect(r.error).toBeUndefined()
    expect(r.output).toContain('XUNG DOT')
    const dongCuoi = r.output.trim().split('\n').pop()
    expect(dongCuoi).toBe('noi dung rieng')
  })

  it('pull lan hai khi con dang gop do thi bao loi, khong pull chong pull', () => {
    const boiCanh = [
      'git init',
      'echo "ban goc" > f.txt',
      'git add .',
      'git commit -m "c1"',
      'git remote add origin https://vi-du.local/kho.git',
      'git push -u origin main',
      'echo "ban cua toi" > f.txt',
      'git add .',
      'git commit -m "sua o may toi"',
      'remote-seed main "sua tren github" f.txt "ban cua nguoi khac"',
      'git pull',
    ]
    expect(chayLenh('git pull', boiCanh).error).toContain('Dang gop dang do')
  })

  it('clone thieu URL thi bao loi', () => {
    expect(chayLenh('git clone').error).toContain('Thieu URL')
  })

  it('clone kho ma nhanh "main" tren remote chua co commit nao thi van clone duoc, thu muc rong', () => {
    const r = chayLenh('git clone https://mo-phong.local/kho.git\nls', [
      'remote-seed nhanh-khac "commit dau" a.txt "noi dung"',
    ])
    expect(r.error).toBeUndefined()
    const dongCuoi = r.output.trim().split('\n').pop()
    expect(dongCuoi).toBe('(thu muc rong)')
  })

  it('git stash (khong lenh con) mac dinh la push, loi nhan mac dinh nhac ten nhanh', () => {
    const r = chayLenh(`git init
echo "a" > f.txt
git add .
git commit -m "c1"
echo "b" > g.txt
git stash
git stash list`)
    expect(r.error).toBeUndefined()
    expect(r.output).toContain('WIP tren main')
  })

  it('stash push -m khong kem loi nhan thi dung mac dinh "WIP"', () => {
    const r = chayLenh(`git init
echo "a" > f.txt
git add .
git commit -m "c1"
echo "b" > g.txt
git stash push -m
git stash list`)
    expect(r.error).toBeUndefined()
    const listBlock = r.output.split('$ git stash list')[1]!.trim()
    expect(listBlock).toBe('stash@{0}: WIP')
  })

  it('stash push khi file da duoc "git add" truoc do (van tinh la co doi de stash)', () => {
    const r = chayLenh(`git init
echo "goc" > f.txt
git add .
git commit -m "c1"
echo "da add roi" > f.txt
git add f.txt
git stash push -m "co doi da add"
git status`)
    expect(r.error).toBeUndefined()
    expect(r.output).toContain('thu muc lam viec sach')
  })

  it('stash apply (khac pop) VAN GIU trong ngan, lay lai duoc noi dung', () => {
    const r = chayLenh(`git init
echo "a" > f.txt
git add .
git commit -m "c1"
echo "dang lam do" > g.txt
git stash push -m "x"
git stash apply
cat g.txt
git stash list`)
    expect(r.error).toBeUndefined()
    expect(r.output).toContain('VAN GIU trong ngan stash')
    const sauApply = r.output.split('$ cat g.txt')[1]!.split('\n')[1]
    expect(sauApply).toBe('dang lam do')
    const listBlock = r.output.split('$ git stash list')[1]!.trim()
    expect(listBlock).toBe('stash@{0}: x')
  })

  it('stash drop xoa mot muc khoi ngan, drop khi ngan rong thi bao loi', () => {
    const r = chayLenh(`git init
echo "a" > f.txt
git add .
git commit -m "c1"
echo "b" > g.txt
git stash push -m "x"
git stash drop
git stash list`)
    expect(r.error).toBeUndefined()
    expect(r.output).toContain('Da xoa stash@{0}.')
    const listBlock = r.output.split('$ git stash list')[1]!.trim()
    expect(listBlock).toBe('(khong co stash nao)')

    expect(chayLenh('git init\ngit stash drop').error).toContain('Khong co stash nao de xoa')
  })

  it('stash voi lenh con khong ho tro thi bao loi day duoc', () => {
    expect(chayLenh('git init\ngit stash khong-ho-tro').error).toContain(
      'Mo phong ho tro: git stash',
    )
  })

  it('git tag khong tham so khi chua co tag nao', () => {
    expect(chayLenh('git init\ngit tag').output).toContain('(chua co tag nao)')
  })

  it('git tag khong kem -a thi bao loi day duoc (khac ca "thieu ten tag")', () => {
    const r = chayLenh(`git init
echo "a" > f.txt
git add .
git commit -m "c1"
git tag v1`)
    expect(r.error).toContain('Mo phong chi ho tro')
  })

  it('git tag -a truoc khi co commit nao thi bao loi', () => {
    expect(chayLenh('git init\ngit tag -a v1 -m "x"').error).toContain(
      'Chua co commit nao de gan tag',
    )
  })

  it('cherry-pick thieu ma commit thi bao loi', () => {
    expect(chayLenh('git init\ngit cherry-pick').error).toContain('Thieu ma commit')
  })

  it('cherry-pick vao nhanh chua co commit rieng nao thi tao commit goc moi (cha rong)', () => {
    const r = chayLenh(`git init
git branch b1
echo "a" > f.txt
git add .
git commit -m "c1"
git switch b1
git cherry-pick c1
git log --oneline`)
    expect(r.error).toBeUndefined()
    const logBlock = r.output.split('$ git log --oneline')[1]!.trim()
    expect(logBlock.split('\n')).toHaveLength(1)
    expect(logBlock).toContain('c1')
  })

  it('rebase thieu ten nhanh thi bao loi', () => {
    expect(chayLenh('git init\ngit rebase').error).toContain('Thieu ten nhanh')
  })

  it('rebase len nhanh khong ton tai thi bao loi', () => {
    expect(chayLenh('git init\ngit rebase khong-co').error).toContain('Khong co nhanh')
  })

  it('rebase khi nhanh hien tai chua co commit nao thi bao loi', () => {
    const r = chayLenh(`git init
git branch b1
echo "a" > f.txt
git add .
git commit -m "c1"
git switch b1
git rebase main`)
    expect(r.error).toContain('Nhanh hien tai chua co commit nao de rebase')
  })

  it('rebase khi hai nhanh khong co to tien chung (khong tuyen tinh) thi bao loi ro rang', () => {
    const r = chayLenh(`git init
git branch b1
echo "a" > f.txt
git add .
git commit -m "c1"
git switch b1
echo "b" > g.txt
git add .
git commit -m "c2"
git rebase main`)
    expect(r.error).toContain('TUYEN TINH')
  })

  it('lenh git khong ton tai trong danh sach ho tro thi bao loi tong quat, khong im lang', () => {
    expect(chayLenh('git init\ngit blah').error).toContain('Mo phong chua ho tro "git blah"')
  })

  it('restore (khong --staged) dung ban DA ADD lam nguon khoi phuc, khong phai ban commit', () => {
    const r = chayLenh(`git init
echo "goc" > f.txt
git add .
git commit -m "c1"
echo "da-add" > f.txt
git add f.txt
echo "workdir-them" > f.txt
git restore f.txt
cat f.txt`)
    expect(r.error).toBeUndefined()
    const dongCuoi = r.output.trim().split('\n').pop()
    expect(dongCuoi).toBe('da-add')
  })

  it('restore file moi hoan toan (chua tung add, chua tung commit) thi bao loi', () => {
    const r = chayLenh(`git init
echo "a" > f.txt
git add .
git commit -m "c1"
echo "moi" > new.txt
git restore new.txt`)
    expect(r.error).toContain('Khong co gi de khoi phuc')
  })

  it('remote-seed thieu tham so (dung cho boi canh lenhChuanBi) thi bao loi ro', () => {
    const r = chayLenh('ls', ['remote-seed main "chi hai tham so"'])
    expect(r.error).toContain('remote-seed can 4 tham so')
  })

  it('echo >> vao file CHUA TUNG TON TAI van tao file moi voi noi dung dung', () => {
    const r = chayLenh('echo "dong dau" >> moi.txt\ncat moi.txt')
    expect(r.error).toBeUndefined()
    const dongCuoi = r.output.trim().split('\n').pop()
    expect(dongCuoi).toBe('dong dau')
  })

  it('lenhChuanBi co dong rong thi bo qua em lang, khong pha boi canh', () => {
    const r = chayLenh('ls', [
      'git init',
      '',
      'echo "a" > a.txt',
      'git add .',
      'git commit -m "c1"',
    ])
    expect(r.error).toBeUndefined()
    expect(r.output).toContain('a.txt')
  })

  it('tachTu: nhay don, nhay kep va tu tran tren cung mot dong deu tach dung', () => {
    const r = chayLenh(`git init
echo "a" > f.txt
git add .
git commit -m 'phat hanh dau tien'
git tag -a v1.0 -m "ban chinh thuc"`)
    expect(r.error).toBeUndefined()
    expect(r.output).toContain('phat hanh dau tien')
  })
})

describe('gitignore — subset, atomicity và bounds', () => {
  const fixture = [
    'git init',
    'echo "doc" > README.md',
    'echo "secret" > .env',
    'echo "weights" > models/a.pt',
    'echo "cache" > nested/__pycache__/a.py',
    'echo "ok" > .env.example',
    'echo "ok" > __pycache__',
  ]
  const ignore =
    'echo ".env" > .gitignore\necho "*.pt" >> .gitignore\necho "__pycache__/" >> .gitignore'
  it('bỏ ignored khỏi status/add, giữ file trong workdir; benign vẫn theo dõi', () => {
    const r = chayLenh(`${ignore}\ngit add .\ngit commit -m "safe"\ngit status\nls`, fixture)
    expect(r.error).toBeUndefined()
    expect(Object.keys(r.gitState!.headSnapshot!)).toEqual(
      expect.arrayContaining(['README.md', '.gitignore', '.env.example', '__pycache__']),
    )
    for (const p of ['.env', 'models/a.pt', 'nested/__pycache__/a.py']) {
      expect(Object.hasOwn(r.gitState!.headSnapshot!, p)).toBe(false)
      expect(Object.hasOwn(r.gitState!.workdir, p)).toBe(true)
    }
    expect(r.output).toContain('thu muc lam viec sach')
  })
  it('preflight explicit path và invalid ignore không staging một phần', () => {
    const r = chayLenh(`${ignore}\ngit add README.md .env`, fixture)
    expect(r.error).toContain('bo qua')
    expect(r.gitState!.staged).toEqual({})
    const missing = chayLenh('git add README.md missing', fixture)
    expect(missing.gitState!.staged).toEqual({})
    for (const pattern of ['!secret', '**', '?', '[ab]', '/models/*.pt', 'x\\y']) {
      const invalid = chayLenh(`echo "${pattern}" > .gitignore\ngit add .`, fixture)
      expect(invalid.error).toContain('dong 1')
      expect(invalid.gitState!.staged).toEqual({})
    }
  })
  it('ignore ở workdir có hiệu lực; tracked hoặc staged trước ignore không bị loại', () => {
    const r = chayLenh(
      `git add .env\n${ignore}\ngit add .\ngit commit -m "tracked"\necho "changed" > .env\ngit status\ngit add .env`,
      fixture,
    )
    expect(r.error).toBeUndefined()
    expect(r.gitState!.headSnapshot!['.env']).toBe('secret\n')
    expect(r.gitState!.staged['.env']).toBe('changed\n')
    expect(r.output).toContain('sua: .env')
    expect(chayLenh('git add -f .env', fixture).error).toContain('force')
  })
  it('snapshot tách các maps và giới hạn entrypoint/path/file/command', () => {
    const r = chayLenh('git add README.md\ngit commit -m "one"', fixture)
    const copy = r.gitState!.workdir as Record<string, string>
    copy['README.md'] = 'mutated'
    expect(r.gitState!.headSnapshot!['README.md']).toBe('doc\n')
    expect(r.gitState!.commits[0]!.snapshot['README.md']).toBe('doc\n')
    expect(chayLenh('x'.repeat(4001)).error).toBeDefined()
    expect(chayLenh(Array(101).fill('ls').join('\n')).error).toBeDefined()
    expect(chayLenh('', Array(21).fill('ls')).error).toBeDefined()
    for (const p of ['../x', '/x', 'a//b', '__proto__', 'a/constructor'])
      expect(chayLenh(`echo "x" > ${p}`).error).toBeDefined()
    const fileLimit = chayLenh(
      'echo "last" > last',
      Array.from({ length: 20 }, (_, i) => `echo "${'x'.repeat(198)}" > f${i}`),
    )
    expect(fileLimit.error).toBeDefined() // bộ chuẩn bị vượt 4000 ký tự, không truncate
  })
})

it('budget toàn lịch sử rollback commit mới, không truncate evidence cũ', () => {
  const script = Array.from(
    { length: 45 },
    (_, i) => `echo "${i}" > marker\ngit add .\ngit commit -m "c${i}"`,
  ).join('\n')
  // 135 commands vượt trần lệnh; kiểm state budget dùng 32 lần (96 lệnh).
  expect(chayLenh(script).error).toContain('100 lenh')
  const bounded = Array.from(
    { length: 32 },
    (_, i) => `echo "${i}" > marker\ngit add .\ngit commit -m "c${i}"`,
  ).join('\n')
  const r = chayLenh(bounded, [
    'git init',
    ...Array.from({ length: 10 }, (_, i) => `echo "${'x'.repeat(380)}" > f${i}`),
  ])
  expect(r.error).toMatch(/128 KiB/)
  expect(r.gitState!.commits.length).toBeGreaterThan(0)
  expect(new TextEncoder().encode(JSON.stringify(r.gitState)).length).toBeLessThanOrEqual(
    128 * 1024,
  )
  expect(r.gitState!.headMessage).toBe(r.gitState!.commits.at(-1)!.message)
})

it('toString/valueOf là tên file bình thường: mọi lookup chỉ đọc own property', () => {
  for (const name of ['toString', 'valueOf', 'hasOwnProperty']) {
    const ignored = chayLenh(
      `git init\necho "${name}" > .gitignore\necho "fake" > ${name}\ngit status`,
    )
    expect(ignored.error).toBeUndefined()
    expect(ignored.output).not.toContain(`sua: ${name}`)
    const restore = chayLenh(`git init\ngit restore ${name}`)
    expect(restore.error).toBeDefined()
    expect(Object.hasOwn(restore.gitState!.workdir, name)).toBe(false)
    const append = chayLenh(`git init\necho "fake" >> ${name}\ngit add .\ngit commit -m "valid"`)
    expect(append.error).toBeUndefined()
    expect(append.gitState!.headSnapshot![name]).toBe('fake\n')
    expect(append.output).not.toContain('[native code]')
  }
})

it('metadata branches/remote/tags không dùng giá trị inherited làm commit', () => {
  for (const name of ['toString', 'valueOf', 'hasOwnProperty']) {
    const r = chayLenh(
      `git init\ngit remote add origin https://fake.local/repo\ngit push origin ${name}`,
    )
    expect(r.error).toBeDefined()
    expect(r.output).not.toContain('[native code]')
    const branch = chayLenh(
      `git init\necho "x" > a\ngit add .\ngit commit -m "base"\ngit branch ${name}\ngit switch ${name}\ngit log`,
    )
    expect(branch.error).toBeUndefined()
    expect(branch.gitState!.headMessage).toBe('base')
  }
})

it('append quá 4000 ký tự rollback file thay vì cắt nội dung', () => {
  const original = `${'x'.repeat(3980)}\n`
  const r = chayLenh(`echo "${'y'.repeat(30)}" >> f`, [`echo "${'x'.repeat(3980)}" > f`])
  expect(r.error).toContain('4000 ky tu')
  expect(r.gitState!.workdir['f']).toBe(original)
})

it('file thứ 101 rollback, vẫn giữ 100 file từ fixture và learner', () => {
  const fixture = Array.from({ length: 20 }, (_, i) => `echo "fixture" > f${i}`)
  const script = Array.from({ length: 81 }, (_, i) => `echo "learner" > l${i}`).join('\n')
  const r = chayLenh(script, fixture)
  expect(r.error).toContain('100 file')
  expect(Object.keys(r.gitState!.workdir)).toHaveLength(100)
  expect(r.gitState!.workdir['f19']).toBe('fixture\n')
  expect(r.gitState!.workdir['l79']).toBe('learner\n')
  expect(Object.hasOwn(r.gitState!.workdir, 'l80')).toBe(false)
})

it('commit thứ 101 rollback, giữ đầy đủ 100 commit trước đó', () => {
  const r = chayLenh(Array(100).fill('git cherry-pick c1').join('\n'), [
    'git init',
    'echo "base" > f',
    'git add .',
    'git commit -m "base"',
  ])
  expect(r.error).toContain('100 commit')
  expect(r.gitState!.commits).toHaveLength(100)
  expect(r.gitState!.headSnapshot).toEqual({ f: 'base\n' })
  expect(r.gitState!.headMessage).toBe('base')
  expect(r.gitState!.commits.every((c) => c.snapshot['f'] === 'base\n')).toBe(true)
})
