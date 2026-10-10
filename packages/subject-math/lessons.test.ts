// lessons.test.ts — Gác chất lượng nội dung bài học Toán.
import { describe, expect, it } from 'vitest'
import { timLoiDuyet, moTaLoiDuyet } from '@dhcb/core-contracts/lessonReviewGuard'
import {
  doPhuHoatAnhCore,
  moTaLoiHoatAnh,
  timLoiHoatAnh,
} from '@dhcb/core-contracts/animationQuality'
import { moTaLoiTuCham, timLoiTuCham } from '@dhcb/core-grading/selfGrade'
import { MATH_LESSONS, getMathLesson, listMathLessonsByGrade } from './lessons.js'
import { MathLessonSchema } from './lessonTypes.js'

describe('math lessons', () => {
  it('mọi bài đúng khuôn MathLessonSchema (Zod)', () => {
    for (const lesson of MATH_LESSONS) {
      const r = MathLessonSchema.safeParse(lesson)
      expect(r.success, `Bài ${lesson.id} sai khuôn: ${r.success ? '' : r.error.message}`).toBe(
        true,
      )
    }
  })

  it('id duy nhất trong toàn bộ registry', () => {
    const seen = new Set<string>()
    for (const lesson of MATH_LESSONS) {
      expect(seen.has(lesson.id), `id trùng lặp: ${lesson.id}`).toBe(false)
      seen.add(lesson.id)
    }
  })

  it('mỗi (grade, chapterNumber) chỉ có ĐÚNG MỘT chapterTitle', () => {
    // Cùng loại lỗi copy-paste đã dính thật ở subject-physics/lessons/ly10c3.ts: chapterTitle
    // chỉ là string tự do, schema không ràng buộc theo chapterNumber nên sai sót không bị bắt
    // ở đâu khác ngoài test này.
    const titleByChapter = new Map<string, string>()
    for (const lesson of MATH_LESSONS) {
      const key = `${lesson.grade}-c${lesson.chapterNumber}`
      const existing = titleByChapter.get(key)
      if (existing === undefined) {
        titleByChapter.set(key, lesson.chapterTitle)
        continue
      }
      expect(
        lesson.chapterTitle,
        `Bài ${lesson.id}: chapterTitle "${lesson.chapterTitle}" khác với chapterTitle "${existing}" đã dùng cho chương ${key}`,
      ).toBe(existing)
    }
  })

  it('mọi bài đánh dấu reviewStatus (không âm thầm coi là đã duyệt)', () => {
    for (const lesson of MATH_LESSONS) {
      expect(['draft', 'reviewed']).toContain(lesson.reviewStatus)
    }
  })

  it('mọi checkQuestion tự chấm ĐÚNG với chính đáp án đã khai — dùng engine chấm thật, không AI', () => {
    // Cổng dùng chung ở `@dhcb/core-grading/selfGrade`: nạp vào engine ĐÚNG chuỗi tác giả đã
    // viết (`<value> <unit>`), KHÔNG tự đổi đơn vị. Bản cũ ở đây tự tính
    // `(value - offset) / factor` nên giả định sẵn điều cần kiểm và không thể đỏ — xem
    // `docs/audit/2026-09-14-tinh-chinh-xac-cong-thuc-va-ket-qua.md`.
    const loi = timLoiTuCham(MATH_LESSONS)
    expect(loi.length, `Đáp án đã khai KHÔNG tự chấm đúng:\n${moTaLoiTuCham(loi)}`).toBe(0)
  })

  it('không thủng chương — mỗi lớp phải có đủ 6 chương SGK "Kết nối tri thức" (khoá theo audit 2026-09-14)', () => {
    // docs/research/de-xuat-uu-tien-mon-toan-2026-09-14.md: Toán chỉ 35 bài, thủng 6 chương
    // (10c5, 11c3/c4/c8, 12c2/c3) mà không ai phát hiện — vì KHÔNG có ngưỡng nào canh số chương.
    // Ngưỡng dưới đây không đòi đủ NGAY (còn đang bổ sung dần theo ưu tiên đã chốt), chỉ khoá
    // KHÔNG ĐƯỢC THỦNG THÊM: khi một chương đã có ≥1 bài, xoá hết bài của chương đó phải bị chặn.
    const daCoChuong = new Set(MATH_LESSONS.map((l) => `${l.grade}-c${l.chapterNumber}`))
    const CHUONG_DA_CO_LUC_KHOA = [
      '6-c1',
      '6-c2',
      '6-c3',
      '6-c4',
      '6-c5',
      '6-c6',
      '6-c7',
      '6-c8',
      '6-c9',
      '7-c1',
      '7-c2',
      '7-c3',
      '7-c4',
      '7-c5',
      '7-c6',
      '7-c7',
      '7-c8',
      '7-c9',
      '7-c10',
      '10-c1',
      '10-c2',
      '10-c3',
      '10-c4',
      '10-c5',
      '10-c6',
      '10-c7',
      '10-c8',
      '10-c9',
      '11-c1',
      '11-c2',
      '11-c3',
      '11-c4',
      '11-c5',
      '11-c6',
      '11-c7',
      '11-c8',
      '11-c9',
      '12-c1',
      '12-c2',
      '12-c3',
      '12-c4',
      '12-c5',
      '12-c6',
    ]
    const mat = CHUONG_DA_CO_LUC_KHOA.filter((c) => !daCoChuong.has(c))
    expect(
      mat,
      'chương đã có bài trước đây bị xoá sạch, thủng thêm ngoài 6 chương đã biết',
    ).toEqual([])
  })

  it('getMathLesson tra được đúng bài theo id', () => {
    const first = MATH_LESSONS[0]
    expect(first, 'registry môn Toán còn rỗng — chưa có bài nào để tra').toBeDefined()
    if (!first) return
    expect(getMathLesson(first.id)?.title).toBe(first.title)
  })

  it('listMathLessonsByGrade trả đúng thứ tự chương/bài', () => {
    const lessons10 = listMathLessonsByGrade('10')
    expect(lessons10.length, 'chưa có bài Toán lớp 10 nào').toBeGreaterThan(0)
    for (let i = 1; i < lessons10.length; i++) {
      const prev = lessons10[i - 1]!
      const cur = lessons10[i]!
      const prevKey = prev.chapterNumber * 1000 + prev.lessonNumber
      const curKey = cur.chapterNumber * 1000 + cur.lessonNumber
      expect(curKey).toBeGreaterThanOrEqual(prevKey)
    }
  })
  it('không hai bài nào trùng tiêu đề nguyên văn', () => {
    // Audit 2026-09-14 (F8): 6 bài Hoá trùng tiêu đề y hệt giữa lớp 11 và 12 ("Ôn tập chương 1"…),
    // nên trong danh sách / kết quả tìm kiếm / slug URL chúng trông là một.
    const theoTieuDe = new Map<string, string[]>()
    for (const l of MATH_LESSONS) {
      const ds = theoTieuDe.get(l.title) ?? []
      ds.push(l.id)
      theoTieuDe.set(l.title, ds)
    }
    const trung = [...theoTieuDe.entries()].filter(([, ids]) => ids.length > 1)
    expect(
      trung.map(([t, ids]) => `"${t}" dùng cho ${ids.join(', ')}`),
      'tiêu đề phải phân biệt được bài này với bài kia',
    ).toEqual([])
  })
  it('không lời giải nào cụt dưới 40 ký tự', () => {
    // Audit 2026-09-14 (F9): 19 câu Lí + 1 câu Hoá có `explain` dưới 40 ký tự — đủ chỗ cho phép
    // thế số, không đủ chỗ nói VÌ SAO dùng công thức đó. Với môn mà học sinh sai vì hiểu nhầm
    // khái niệm, một dòng cụt là mất luôn giá trị sư phạm của câu hỏi. Schema chỉ ép min(1).
    // Ngưỡng 40 = đúng ngưỡng lượt audit đã đo và đã sửa hết. Đo lại 2026-09-14 ở ngưỡng 60 thì
    // còn 25 câu Lí + 5 câu Hoá nữa ở dải 41-59 — chưa sửa, chờ người dùng quyết (nợ đã ghi ở
    // PROGRESS.md). Nâng ngưỡng lên 60 chỉ khi đã viết lại nốt dải đó.
    const cut = MATH_LESSONS.flatMap((l) =>
      l.checkQuestions
        .map((q, i) => ({ q, i }))
        .filter(({ q }) => q.explain.trim().length < 40)
        .map(({ q, i }) => `${l.id}#q${i + 1} (${q.explain.trim().length} ký tự)`),
    )
    expect(cut, 'lời giải phải nói được vì sao, không chỉ thế số').toEqual([])
  })
  it('trạng thái duyệt ăn khớp với bản ghi duyệt, và băm nội dung còn hiệu lực', () => {
    // Luật viết MỘT lần ở @dhcb/core-contracts/lessonReviewGuard, thử bằng dữ liệu giả ở
    // lessonReviewGuard.test.ts — ca này chỉ áp nó lên dữ liệu thật của môn.
    const loi = timLoiDuyet(MATH_LESSONS)
    expect(loi.length, `Trạng thái duyệt có vấn đề:\n${moTaLoiDuyet(loi)}`).toBe(0)
  })
})

/** RATCHET độ phủ hoạt ảnh của nhánh core — chỉ được TĂNG, không bao giờ giảm.
 *  Vì sao là hằng số chặn CI chứ không phải ghi chú: phát hiện F6 của audit 2026-09-14 xảy ra
 *  đúng vì không cổng nào canh — độ phủ trôi từ "có làm" về "tuỳ hứng" mà không PR nào đỏ.
 *  Xoá/gộp bài làm số này tụt thì CI đỏ, và hạ hằng số phải là một quyết định CÓ CHỦ ĐÍCH,
 *  ghi lý do trong mô tả PR. Đặc tả: docs/specs/2026-09-14-hoat-anh-minh-hoa-stem.md */
const TOI_THIEU_PHU_HOAT_ANH = 34

describe('Toán — hoạt ảnh minh hoạ', () => {
  it(`độ phủ hoạt ảnh nhánh core không tụt dưới ${TOI_THIEU_PHU_HOAT_ANH} bài`, () => {
    const phu = doPhuHoatAnhCore(MATH_LESSONS)
    expect(
      phu.co,
      `Độ phủ hoạt ảnh core tụt: ${phu.co}/${phu.tong} (${(phu.tiLe * 100).toFixed(1)}%). ` +
        'Hoặc trả lại hoạt ảnh đã mất, hoặc hạ TOI_THIEU_PHU_HOAT_ANH CÓ CHỦ ĐÍCH kèm lý do trong PR.',
    ).toBeGreaterThanOrEqual(TOI_THIEU_PHU_HOAT_ANH)
  })

  it('mọi hoạt ảnh đạt bất biến chất lượng dùng chung 4 môn', () => {
    const loi = timLoiHoatAnh(MATH_LESSONS)
    expect(loi.length, `Hoạt ảnh chưa đạt chất lượng:\n${moTaLoiHoatAnh(loi)}`).toBe(0)
  })
})
