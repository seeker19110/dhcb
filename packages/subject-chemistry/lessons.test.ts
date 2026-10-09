// lessons.test.ts — Gác chất lượng nội dung bài học Hoá: mọi bài phải qua ChemLessonSchema,
// mọi câu hỏi checkQuestions phải CHẤM ĐÚNG THẬT bằng packages/core-grading khi trả lời đúng
// đáp án đã khai (bảo đảm dữ liệu bài học không tự mâu thuẫn với chính engine chấm sẽ dùng nó).
import { describe, expect, it } from 'vitest'
import { timLoiDuyet, moTaLoiDuyet } from '@dhcb/core-contracts/lessonReviewGuard'
import {
  doPhuHoatAnhCore,
  moTaLoiHoatAnh,
  timLoiHoatAnh,
} from '@dhcb/core-contracts/animationQuality'
import { moTaLoiTuCham, timLoiTuCham } from '@dhcb/core-grading/selfGrade'
import {
  CHEM_LESSONS,
  getChemLesson,
  listChemAdvancedLessons,
  listChemLessonsByChapter,
  listChemLessonsByGrade,
} from './lessons.js'
import { HOA_HSG_NHIET_DONG_LESSONS } from './lessons/hoa-hsg-nhiet-dong-hoc.js'
import { HOA_HSG_DUNG_DICH_LESSONS } from './lessons/hoa-hsg-dung-dich.js'
import { HOA_HSG_HUU_CO_LESSONS } from './lessons/hoa-hsg-huu-co-va-hon-hop.js'
import { HOA_HSG_DIEN_HOA_LESSONS } from './lessons/hoa-hsg-dien-hoa.js'
import { HOA_HSG_HUU_CO_12_LESSONS } from './lessons/hoa-hsg-huu-co-12.js'
import { ChemLessonSchema } from './lessonTypes.js'
import type { ChemLesson } from './lessonTypes.js'

describe('chemistry lessons', () => {
  it('mọi bài đúng khuôn ChemLessonSchema (Zod)', () => {
    for (const lesson of CHEM_LESSONS) {
      const r = ChemLessonSchema.safeParse(lesson)
      expect(r.success, `Bài ${lesson.id} sai khuôn: ${r.success ? '' : r.error.message}`).toBe(
        true,
      )
    }
  })

  it('id duy nhất trong toàn bộ registry', () => {
    const seen = new Set<string>()
    for (const lesson of CHEM_LESSONS) {
      expect(seen.has(lesson.id), `id trùng lặp: ${lesson.id}`).toBe(false)
      seen.add(lesson.id)
    }
  })

  it('mỗi (grade, chapterNumber) chỉ có ĐÚNG MỘT chapterTitle', () => {
    // Cùng loại lỗi copy-paste đã dính thật ở subject-physics/lessons/ly10c3.ts: chapterTitle
    // chỉ là string tự do, schema không ràng buộc theo chapterNumber nên sai sót không bị bắt
    // ở đâu khác ngoài test này.
    const titleByChapter = new Map<string, string>()
    for (const lesson of CHEM_LESSONS) {
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
    for (const lesson of CHEM_LESSONS) {
      expect(['draft', 'reviewed']).toContain(lesson.reviewStatus)
    }
  })

  it('mọi checkQuestion tự chấm ĐÚNG với chính đáp án đã khai — dùng engine chấm thật, không AI', () => {
    // Cổng dùng chung ở `@dhcb/core-grading/selfGrade`: nạp vào engine ĐÚNG chuỗi tác giả đã
    // viết (`<value> <unit>`), KHÔNG tự đổi đơn vị. Bản cũ ở đây tự tính
    // `(value - offset) / factor` nên giả định sẵn điều cần kiểm và không thể đỏ — xem
    // `docs/audit/2026-09-14-tinh-chinh-xac-cong-thuc-va-ket-qua.md`.
    const loi = timLoiTuCham(CHEM_LESSONS)
    expect(loi.length, `Đáp án đã khai KHÔNG tự chấm đúng:\n${moTaLoiTuCham(loi)}`).toBe(0)
  })

  it('getChemLesson tra được đúng bài theo id', () => {
    const lesson = getChemLesson('hoa10-c1-b1')
    expect(lesson?.title).toBe('Nhập môn Hoá học')
  })

  it('listChemLessonsByGrade trả đúng thứ tự chương/bài', () => {
    const lessons10 = listChemLessonsByGrade('10')
    expect(lessons10.length).toBeGreaterThan(0)
    for (let i = 1; i < lessons10.length; i++) {
      const prev = lessons10[i - 1]!
      const cur = lessons10[i]!
      const prevKey = prev.chapterNumber * 1000 + prev.lessonNumber
      const curKey = cur.chapterNumber * 1000 + cur.lessonNumber
      expect(curKey).toBeGreaterThanOrEqual(prevKey)
    }
  })
  it('listChemLessonsByChapter chỉ trả bài đúng chương, đúng thứ tự bài', () => {
    const c1 = listChemLessonsByChapter('10', 1)
    expect(c1.length).toBeGreaterThan(0)
    for (const l of c1) expect(l.chapterNumber).toBe(1)
    for (let i = 1; i < c1.length; i++) {
      expect(c1[i]!.lessonNumber).toBeGreaterThanOrEqual(c1[i - 1]!.lessonNumber)
    }
  })

  it('listChemLessonsByChapter với chương không tồn tại trả mảng rỗng', () => {
    expect(listChemLessonsByChapter('10', 999)).toEqual([])
  })

  it('listChemAdvancedLessons không truyền tier trả cả ba cấp, sắp trường→tỉnh→quốc gia', () => {
    const all = listChemAdvancedLessons()
    expect(all.length).toBeGreaterThan(0)
    for (const l of all) expect(l.track).toBe('advanced')
    const order: Record<string, number> = { 'hsg-truong': 0, 'hsg-tinh': 1, 'hsg-quoc-gia': 2 }
    for (let i = 1; i < all.length; i++) {
      expect(order[all[i]!.advancedTier ?? 'hsg-truong']).toBeGreaterThanOrEqual(
        order[all[i - 1]!.advancedTier ?? 'hsg-truong']!,
      )
    }
  })

  it('listChemAdvancedLessons(tier) chỉ trả đúng cấp được yêu cầu', () => {
    const truong = listChemAdvancedLessons('hsg-truong')
    expect(truong.length).toBeGreaterThan(0)
    for (const l of truong) expect(l.advancedTier).toBe('hsg-truong')
  })

  it('không hai bài nào trùng tiêu đề nguyên văn', () => {
    // Audit 2026-09-14 (F8): 6 bài Hoá trùng tiêu đề y hệt giữa lớp 11 và 12 ("Ôn tập chương 1"…),
    // nên trong danh sách / kết quả tìm kiếm / slug URL chúng trông là một.
    const theoTieuDe = new Map<string, string[]>()
    for (const l of CHEM_LESSONS) {
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
  it('không lời giải nào cụt dưới 60 ký tự', () => {
    // Audit 2026-09-14 (F9): 19 câu Lí + 1 câu Hoá có `explain` dưới 40 ký tự — đủ chỗ cho phép
    // thế số, không đủ chỗ nói VÌ SAO dùng công thức đó. Với môn mà học sinh sai vì hiểu nhầm
    // khái niệm, một dòng cụt là mất luôn giá trị sư phạm của câu hỏi. Schema chỉ ép min(1).
    // Ngưỡng 60 (nâng từ 40 ở đợt 0540): dải 41-59 đã được viết lại hết ở changelog 0304, nên
    // cổng chặn đúng mức vừa trả xong. Nâng tiếp chỉ khi đã viết lại nốt dải dưới ngưỡng mới.
    const cut = CHEM_LESSONS.flatMap((l) =>
      l.checkQuestions
        .map((q, i) => ({ q, i }))
        .filter(({ q }) => q.explain.trim().length < 60)
        .map(({ q, i }) => `${l.id}#q${i + 1} (${q.explain.trim().length} ký tự)`),
    )
    expect(cut, 'lời giải phải nói được vì sao, không chỉ thế số').toEqual([])
  })
  it('mỗi lớp Hoá đều có chuyên đề HSG, mỗi chuyên đề đủ ba cấp', () => {
    // Audit 2026-09-14 (F7): Hoá 12 có 0 chuyên đề HSG trong khi lớp 10 có 1 và lớp 11 có 2 —
    // lệch không có lý do ghi ở đâu cả. Ca này biến "đủ ba lớp, mỗi chuyên đề đủ ba cấp" thành
    // cổng chặn CI. Đặc tả: docs/specs/2026-09-14-chuyen-de-hsg-hoa-12.md.
    //
    // Gom nhóm theo FILE dữ liệu (mỗi file = một chuyên đề), KHÔNG theo `chapterTitle`: khuôn
    // test trong đặc tả dùng chapterTitle và đã đỏ ngay trên dữ liệu cũ, vì chỉ chuyên đề "Cân
    // bằng ion trong dung dịch" đặt chung một chapterTitle cho cả ba bài, còn hai chuyên đề kia
    // đặt tiêu đề riêng cho từng bài (Nhiệt hoá học / Động hoá học / Nhiệt động học). Đó là
    // cách đặt tên hợp lệ, không phải lỗi dữ liệu — nên sửa KHOÁ GOM NHÓM, không sửa dữ liệu cũ.
    const chuyenDe: Record<string, readonly ChemLesson[]> = {
      'hoa-hsg-nhiet-dong-hoc': HOA_HSG_NHIET_DONG_LESSONS,
      'hoa-hsg-dung-dich': HOA_HSG_DUNG_DICH_LESSONS,
      'hoa-hsg-huu-co-va-hon-hop': HOA_HSG_HUU_CO_LESSONS,
      'hoa-hsg-dien-hoa': HOA_HSG_DIEN_HOA_LESSONS,
      'hoa-hsg-huu-co-12': HOA_HSG_HUU_CO_12_LESSONS,
    }

    // 1. Mỗi chuyên đề đúng 3 bài, đủ ba cấp, cùng một lớp.
    for (const [ten, bai] of Object.entries(chuyenDe)) {
      expect([...bai.map((l) => l.advancedTier)].sort(), `chuyên đề ${ten} phải đủ ba cấp`).toEqual(
        ['hsg-quoc-gia', 'hsg-tinh', 'hsg-truong'],
      )
      expect(new Set(bai.map((l) => l.grade)).size, `chuyên đề ${ten} phải cùng một lớp`).toBe(1)
      for (const l of bai) expect(l.track, `${l.id} phải là nhánh nâng cao`).toBe('advanced')
    }

    // 2. Mọi bài advanced trong registry đều thuộc đúng một chuyên đề kể trên (không bài mồ côi).
    const trongChuyenDe = new Set(Object.values(chuyenDe).flatMap((b) => b.map((l) => l.id)))
    const advIds = CHEM_LESSONS.filter((l) => l.track === 'advanced').map((l) => l.id)
    expect(
      advIds.filter((id) => !trongChuyenDe.has(id)),
      'bài HSG không thuộc chuyên đề nào',
    ).toEqual([])

    // 3. Lớp nào cũng phải có chuyên đề HSG — chính là lỗ hổng F7 của lớp 12.
    for (const g of ['10', '11', '12'] as const) {
      const co = Object.values(chuyenDe).filter((bai) => bai[0]?.grade === g)
      expect(co.length, `lớp ${g} phải có ít nhất 1 chuyên đề HSG`).toBeGreaterThanOrEqual(1)
    }
  })
  it('trạng thái duyệt ăn khớp với bản ghi duyệt, và băm nội dung còn hiệu lực', () => {
    // Luật viết MỘT lần ở @dhcb/core-contracts/lessonReviewGuard, thử bằng dữ liệu giả ở
    // lessonReviewGuard.test.ts — ca này chỉ áp nó lên dữ liệu thật của môn.
    const loi = timLoiDuyet(CHEM_LESSONS)
    expect(loi.length, `Trạng thái duyệt có vấn đề:\n${moTaLoiDuyet(loi)}`).toBe(0)
  })
})

/** RATCHET độ phủ hoạt ảnh của nhánh core — chỉ được TĂNG, không bao giờ giảm.
 *  Vì sao là hằng số chặn CI chứ không phải ghi chú: phát hiện F6 của audit 2026-09-14 xảy ra
 *  đúng vì không cổng nào canh — độ phủ trôi từ "có làm" về "tuỳ hứng" mà không PR nào đỏ.
 *  Xoá/gộp bài làm số này tụt thì CI đỏ, và hạ hằng số phải là một quyết định CÓ CHỦ ĐÍCH,
 *  ghi lý do trong mô tả PR. Đặc tả: docs/specs/2026-09-14-hoat-anh-minh-hoa-stem.md */
const TOI_THIEU_PHU_HOAT_ANH = 55

describe('Hoá học — hoạt ảnh minh hoạ', () => {
  it(`độ phủ hoạt ảnh nhánh core không tụt dưới ${TOI_THIEU_PHU_HOAT_ANH} bài`, () => {
    const phu = doPhuHoatAnhCore(CHEM_LESSONS)
    expect(
      phu.co,
      `Độ phủ hoạt ảnh core tụt: ${phu.co}/${phu.tong} (${(phu.tiLe * 100).toFixed(1)}%). ` +
        'Hoặc trả lại hoạt ảnh đã mất, hoặc hạ TOI_THIEU_PHU_HOAT_ANH CÓ CHỦ ĐÍCH kèm lý do trong PR.',
    ).toBeGreaterThanOrEqual(TOI_THIEU_PHU_HOAT_ANH)
  })

  it('mọi hoạt ảnh đạt bất biến chất lượng dùng chung 4 môn', () => {
    const loi = timLoiHoatAnh(CHEM_LESSONS)
    expect(loi.length, `Hoạt ảnh chưa đạt chất lượng:\n${moTaLoiHoatAnh(loi)}`).toBe(0)
  })
})
