import { describe, it, expect, beforeAll } from 'vitest'
import { OutlineSchema } from '@dhcb/core-contracts/outline'
import { loadCefr } from '../../data/cefrLoader'
import { loadFoundation } from '../../data/curriculumLoader'
import type { CefrLevel } from '../../data/cefrTypes'
import type { Circle } from '../../data/curriculumTypes'
import {
  buildCefrOutline,
  docHoatDongTuQuery,
  duongDanHoatDongCefr,
  nodeIdHoatDong,
  tienDoHoiThoaiCuaUnit,
  type CefrOutlineCtx,
} from './cefrOutline'

// Dữ liệu THẬT: vitest.setup.ts chặn fetch('/data/…') và đọc thẳng public/ — không ra mạng.
let levels: CefrLevel[] = []
let circles: Map<string, Circle> = new Map()

beforeAll(async () => {
  levels = await loadCefr()
  circles = new Map((await loadFoundation()).map((c) => [c.id, c]))
})

const ctxRong = (): CefrOutlineCtx => ({
  learned: new Set<string>(),
  doneGrammar: new Set<string>(),
  viewedDialogues: new Set<string>(),
  learnedDialogues: new Set<string>(),
  circles,
  lockedMap: new Map(),
})

const hoatDong = (outline: { nodes: readonly { kind: string }[] }) =>
  outline.nodes.filter((n) => n.kind === 'activity')

describe('buildCefrOutline — dữ liệu cefr.json thật', () => {
  it('số unit mỗi cấp đúng bằng dữ liệu thật', () => {
    const dem = Object.fromEntries(levels.map((l) => [l.id, l.units.length]))
    // Số unit đổi khi sinh lại vòng từ vựng (2026-09-22, docs/changelog/0409: 306 mục nâng bậc,
    // vòng A1/A2 co lại, B2 nở ra). Đổi số ở đây PHẢI đi kèm một đợt sinh lại vòng có nhật ký.
    // Cập nhật 2026-09-22 (docs/changelog/0410): mốc C1 của sàn bậc theo tần suất đưa 128 mục
    // B2 hạng ≥ 30 000 lên C1 → B2 45 → 44 unit, C1 32 → 33 unit; các cấp khác không đổi.
    expect(dem).toEqual({ A1: 13, A2: 24, B1: 39, B2: 44, C1: 33, C2: 44 })
    for (const level of levels) {
      const outline = buildCefrOutline(level, ctxRong())
      OutlineSchema.parse(outline)
      expect(outline.nodes.filter((n) => n.kind === 'chapter')).toHaveLength(level.units.length)
    }
  })

  it('mỗi unit có đúng ① vòng từ vựng ② bài ngữ pháp ③ MỘT hội thoại (nếu có), đúng thứ tự', () => {
    const level = levels.find((l) => l.id === 'A1')!
    const outline = buildCefrOutline(level, {
      ...ctxRong(),
      dialogueTitlesByUnit: new Map(level.units.map((u) => [u.id, ['One']])),
    })
    for (const unit of level.units) {
      const con = outline.nodes.filter((n) => n.parentId === `chapter:${unit.id}`)
      const soVong = unit.vocabCircleIds.filter((id) => circles.has(id)).length
      expect(con).toHaveLength(soVong + unit.grammar.length + 1)
      const loai = con.map((n) => n.nodeId.split(':')[2])
      expect(loai).toEqual([
        ...Array<string>(soVong).fill('vocab'),
        ...Array<string>(unit.grammar.length).fill('grammar'),
        'dialogue',
      ])
      // `order` chạy liên tục trong cùng unit.
      expect(con.map((n) => n.order)).toEqual(con.map((_, i) => i))
    }
  })

  it('unit KHÔNG có ngữ pháp thì không sinh nút ngữ pháp rỗng (B2: 43 unit / ít bài ngữ pháp)', () => {
    const level = levels.find((l) => l.id === 'B2')!
    const khongNguPhap = level.units.filter((u) => u.grammar.length === 0)
    expect(khongNguPhap.length).toBeGreaterThan(0)
    const outline = buildCefrOutline(level, ctxRong())
    for (const unit of khongNguPhap) {
      const con = outline.nodes.filter((n) => n.parentId === `chapter:${unit.id}`)
      expect(con.some((n) => n.nodeId.includes(':grammar:'))).toBe(false)
    }
  })

  it('vòng từ vựng: xong 100% → completed, dở dang → in-progress, chưa học → not-started', () => {
    const level = levels.find((l) => l.id === 'A1')!
    const unit = level.units.find((u) => u.vocabCircleIds.some((id) => circles.has(id)))!
    const circle = circles.get(unit.vocabCircleIds.find((id) => circles.has(id))!)!

    const ctxXong = ctxRong()
    const outlineXong = buildCefrOutline(level, {
      ...ctxXong,
      learned: new Set(circle.words.map((w) => w.word.toLowerCase())),
    })
    const nutXong = outlineXong.nodes.find((n) => n.nodeId.endsWith(`:vocab:${circle.id}`))!
    expect(nutXong).toMatchObject({ progress: 'completed', evidenceSource: 'english.vocab' })

    const outlineDo = buildCefrOutline(level, {
      ...ctxXong,
      learned: new Set([circle.words[0]!.word.toLowerCase()]),
    })
    const nutDo = outlineDo.nodes.find((n) => n.nodeId.endsWith(`:vocab:${circle.id}`))!
    expect(nutDo).toMatchObject({ progress: 'in-progress', evidenceSource: 'english.vocab' })

    const nutChua = buildCefrOutline(level, ctxRong()).nodes.find((n) =>
      n.nodeId.endsWith(`:vocab:${circle.id}`),
    )!
    expect(nutChua.progress).toBe('not-started')
    expect(nutChua.evidenceSource).toBeUndefined()
  })

  it('ngữ pháp: đánh dấu xong → completed kèm đúng nguồn bằng chứng', () => {
    const level = levels.find((l) => l.id === 'A1')!
    const unit = level.units.find((u) => u.grammar.length > 0)!
    const grammarId = unit.grammar[0]!.id
    const outline = buildCefrOutline(level, {
      ...ctxRong(),
      doneGrammar: new Set([grammarId]),
    })
    expect(outline.nodes.find((n) => n.nodeId.endsWith(`:grammar:${grammarId}`))).toMatchObject({
      progress: 'completed',
      evidenceSource: 'english.cefrGrammar',
    })
    OutlineSchema.parse(outline)
  })

  // Đặc tả docs/specs/2026-10-09-hoi-thoai-cefr-bang-chung-da-hoc.md — chưa xem / đã xem / đã học.
  it('hội thoại: "đã xem" KHÔNG còn là xong (dữ liệu cũ giữ nguyên là đã xem)', () => {
    const level = levels.find((l) => l.id === 'A1')!
    const unit = level.units[0]!
    const outline = buildCefrOutline(level, {
      ...ctxRong(),
      viewedDialogues: new Set([`${unit.id}:Hello there`]),
      dialogueTitlesByUnit: new Map([[unit.id, ['Hello there']]]),
    })
    expect(
      outline.nodes.find((n) => n.nodeId === `activity:${unit.id}:dialogue:${unit.id}`),
    ).toMatchObject({
      progress: 'in-progress',
      evidenceSource: 'english.cefrDialogue',
      hint: 'Đã xem 1/1 · đã học 0/1',
    })
    OutlineSchema.parse(outline)
  })

  it('hội thoại: biết tổng → chỉ XONG khi đã học hết; nhãn chữ đếm x/N', () => {
    const level = levels.find((l) => l.id === 'A1')!
    const unit = level.units[0]!
    const titles = new Map([[unit.id, ['One', 'Two']]])
    const nut = (ctx: Partial<CefrOutlineCtx>) =>
      buildCefrOutline(level, { ...ctxRong(), dialogueTitlesByUnit: titles, ...ctx }).nodes.find(
        (n) => n.nodeId === `activity:${unit.id}:dialogue:${unit.id}`,
      )
    expect(nut({})).toMatchObject({ progress: 'not-started', hint: 'Chưa xem' })
    expect(nut({ viewedDialogues: new Set([`${unit.id}:One`]) })).toMatchObject({
      progress: 'in-progress',
      evidenceSource: 'english.cefrDialogue',
      hint: 'Đã xem 1/2 · đã học 0/2',
    })
    expect(nut({ learnedDialogues: new Set([`${unit.id}:One`]) })).toMatchObject({
      progress: 'in-progress',
      evidenceSource: 'english.cefrDialogueLearned',
      hint: 'Đã xem 1/2 · đã học 1/2',
    })
    expect(nut({ learnedDialogues: new Set([`${unit.id}:One`, `${unit.id}:Two`]) })).toMatchObject({
      progress: 'completed',
      evidenceSource: 'english.cefrDialogueLearned',
      hint: 'Đã học 2/2',
    })
    // Khoá của unit KHÁC hay của vòng từ vựng không được tính cho unit này.
    expect(nut({ learnedDialogues: new Set(['khac:One', 'khac:Two']) })).toMatchObject({
      progress: 'not-started',
    })
  })

  it('hội thoại: unit KHÔNG có hội thoại → không sinh nút, số hoạt động giảm đúng 1', () => {
    const level = levels.find((l) => l.id === 'A1')!
    const [coHoiThoai, khongHoiThoai] = level.units
    const outline = buildCefrOutline(level, {
      ...ctxRong(),
      dialogueTitlesByUnit: new Map([
        [coHoiThoai!.id, ['One']],
        [khongHoiThoai!.id, []],
      ]),
    })
    const conCua = (id: string) => outline.nodes.filter((n) => n.parentId === `chapter:${id}`)
    const dem = (id: string) => conCua(id).filter((n) => n.nodeId.split(':')[2] === 'dialogue')
    expect(dem(coHoiThoai!.id)).toHaveLength(1)
    expect(dem(khongHoiThoai!.id)).toHaveLength(0)
    const soVong = (u: typeof coHoiThoai) =>
      u!.vocabCircleIds.filter((id) => circles.has(id)).length
    expect(conCua(khongHoiThoai!.id)).toHaveLength(
      soVong(khongHoiThoai) + khongHoiThoai!.grammar.length,
    )
    // Chữ "N hoạt động" của unit đếm đúng số nút thật.
    const chuong = (id: string) => outline.nodes.find((n) => n.nodeId === `chapter:${id}`)
    expect(chuong(khongHoiThoai!.id)!.hint).toBe(`${conCua(khongHoiThoai!.id).length} hoạt động`)
    expect(chuong(coHoiThoai!.id)!.hint).toBe(`${conCua(coHoiThoai!.id).length} hoạt động`)
    OutlineSchema.parse(outline)
  })

  it('hội thoại: unit không có hội thoại → tienDoHoiThoaiCuaUnit trả undefined (không nút)', () => {
    expect(
      tienDoHoiThoaiCuaUnit('u', {
        viewedDialogues: new Set(),
        learnedDialogues: new Set(),
        dialogueTitlesByUnit: new Map([['u', []]]),
      }),
    ).toBeUndefined()
  })

  it('hội thoại: CHƯA biết tổng (đang tải/lỗi) → không nút, không bao giờ completed', () => {
    for (const ctx of [
      { viewedDialogues: new Set<string>(), learnedDialogues: new Set<string>() },
      { viewedDialogues: new Set(['u:One']), learnedDialogues: new Set(['u:One']) },
      {
        viewedDialogues: new Set<string>(),
        learnedDialogues: new Set<string>(),
        dialogueTitlesByUnit: new Map<string, readonly string[]>(), // có map nhưng thiếu unit
      },
    ]) {
      expect(tienDoHoiThoaiCuaUnit('u', ctx)).toBeUndefined()
    }
    const level = levels.find((l) => l.id === 'A1')!
    const outline = buildCefrOutline(level, {
      ...ctxRong(),
      learnedDialogues: new Set(level.units.map((u) => `${u.id}:One`)),
    })
    expect(outline.nodes.some((n) => n.nodeId.split(':')[2] === 'dialogue')).toBe(false)
    expect(outline.nodes.some((n) => n.progress === 'completed')).toBe(false)
  })

  it('cấp KHOÁ: đọc bản đồ khoá của server, hoạt động không có href', () => {
    const level = levels.find((l) => l.id === 'A2')!
    const outline = buildCefrOutline(level, {
      ...ctxRong(),
      lockedMap: new Map([['A2', true]]),
      prevLevelId: 'A1',
    })
    OutlineSchema.parse(outline)
    expect(outline.nodes.every((n) => n.availability === 'locked')).toBe(true)
    expect(outline.nodes[0]!.lockReason).toContain('cuối cấp A1')
    expect(hoatDong(outline).every((n) => (n as { href?: string }).href === undefined)).toBe(true)
  })

  it('duongDanHoatDongCefr: trang cấp + ngữ cảnh trên query', () => {
    expect(duongDanHoatDongCefr('B1', 'b1-u3', 'grammar', 'g-1')).toBe(
      '/goc-hoc-tap/english/lo-trinh/b1?unit=b1-u3&hd=grammar%3Ag-1',
    )
  })

  // S07-3: trang cấp đọc NGƯỢC query để biết phải mở màn con nào. Hai hàm phải khớp nhau,
  // nếu không mục lục trỏ tới một URL mà trang không hiểu (bấm vào không có gì xảy ra).
  it('docHoatDongTuQuery là hàm ĐỐI của duongDanHoatDongCefr — đi vòng tròn không mất mát', () => {
    for (const kind of ['vocab', 'grammar', 'dialogue'] as const) {
      const url = new URL(duongDanHoatDongCefr('A1', 'a1-u1', kind, 'x:1'), 'https://x.test')
      expect(docHoatDongTuQuery(url.searchParams)).toEqual({
        unitId: 'a1-u1',
        kind,
        contentId: 'x:1', // mã chứa dấu hai chấm: chỉ tách ở dấu ĐẦU TIÊN
      })
    }
  })

  it('docHoatDongTuQuery bỏ qua query hỏng thay vì ném lỗi', () => {
    const q = (s: string) => docHoatDongTuQuery(new URLSearchParams(s))
    expect(q('')).toBeUndefined()
    expect(q('unit=a1-u1')).toBeUndefined() // thiếu hd
    expect(q('hd=vocab:c1')).toBeUndefined() // thiếu unit
    expect(q('unit=a1-u1&hd=vocab')).toBeUndefined() // không có dấu hai chấm
    expect(q('unit=a1-u1&hd=:c1')).toBeUndefined() // thiếu loại
    expect(q('unit=a1-u1&hd=vocab:')).toBeUndefined() // thiếu mã
    expect(q('unit=a1-u1&hd=nhac:c1')).toBeUndefined() // loại lạ
  })

  it('nodeIdHoatDong trỏ đúng nút trong cây thật (mã trùng ở B2 vẫn phân biệt được)', () => {
    const level = levels.find((l) => l.id === 'B2')!
    const outline = buildCefrOutline(level, ctxRong())
    // `it` là vòng từ vựng xuất hiện ở HAI unit của B2 — mỗi nút một nodeId riêng.
    const trung = outline.nodes.filter((n) => n.kind === 'activity' && n.contentId === 'it')
    expect(trung.length).toBeGreaterThan(1)
    expect(new Set(trung.map((n) => n.nodeId)).size).toBe(trung.length)
    for (const n of trung) {
      const url = new URL(n.href!, 'https://x.test')
      const ref = docHoatDongTuQuery(url.searchParams)!
      expect(nodeIdHoatDong(ref)).toBe(n.nodeId)
    }
  })

  // Ý ĐỊNH của phép đo này: adapter phải TUYẾN TÍNH theo số unit — cây C2 (44 unit) là cây
  // lớn nhất và nó được dựng lại mỗi lần render, nên một vòng lặp lồng vô tình (O(n²)) sẽ làm
  // trang cấp học giật mà không cổng nào khác bắt được.
  //
  // Bản đầu (S07-1, PR #933) đo bằng ĐỒNG HỒ TƯỜNG: `performance.now() - t0 < 16`. Nó đã
  // FLAKE thật — `expect(17.56).toBeLessThan(16)` khi chạy cả bộ test dưới tải, lượt sau xanh.
  // Mili-giây đo cả máy chủ CI đang bận chứ không đo riêng thuật toán, nên ngưỡng nào cũng sẽ
  // vừa quá chặt (đỏ oan) vừa quá lỏng (bỏ lọt hồi quy trên máy nhanh).
  //
  // Thay bằng phép đo ĐỘC LẬP VỚI MÁY: đếm số lần adapter tra cứu bản đồ vòng từ vựng, rồi so
  // TỈ LỆ giữa cấp nhỏ và cấp lớn. Tuyến tính thì tỉ lệ tra cứu xấp xỉ tỉ lệ số unit; bậc hai
  // thì nó vọt lên bình phương — 44/15 ≈ 2,9 lần so với ≈ 8,6 lần, cách nhau quá xa để nhầm.
  // ĐO THẬT 2026-09-15: A1 (15 unit) 54 lượt tra, C2 (44 unit) 147 lượt → tỉ lệ tra 2,72 so
  // với tỉ lệ unit 2,93. Bậc hai sẽ cho ≈ 8,6 — xa hơn ngưỡng dưới đây rất nhiều lần.
  it('dựng cây TUYẾN TÍNH theo số unit (không có vòng lặp lồng ẩn)', () => {
    /** Bản đồ vòng từ vựng có đếm số lần bị tra — thay cho phép đo bằng đồng hồ tường. */
    function demTraCuu(level: CefrLevel): number {
      let dem = 0
      const theoDoi: ReadonlyMap<string, Circle> = {
        ...circles,
        get: (k: string) => {
          dem += 1
          return circles.get(k)
        },
        has: (k: string) => {
          dem += 1
          return circles.has(k)
        },
        size: circles.size,
        keys: () => circles.keys(),
        values: () => circles.values(),
        entries: () => circles.entries(),
        forEach: circles.forEach.bind(circles),
        [Symbol.iterator]: () => circles[Symbol.iterator](),
      } as ReadonlyMap<string, Circle>
      buildCefrOutline(level, { ...ctxRong(), circles: theoDoi })
      return dem
    }

    const a1 = levels.find((l) => l.id === 'A1')!
    const c2 = levels.find((l) => l.id === 'C2')!
    const traA1 = demTraCuu(a1)
    const traC2 = demTraCuu(c2)

    expect(
      traA1,
      'adapter phải thật sự đọc bản đồ vòng — nếu 0 thì phép đo mất nghĩa',
    ).toBeGreaterThan(0)
    const tiLeUnit = c2.units.length / a1.units.length
    // Hệ số 1,5 là biên độ cho chênh lệch số vòng/bài ngữ pháp giữa hai cấp, KHÔNG phải biên
    // độ cho tốc độ máy — nên nó không dao động theo tải.
    expect(traC2 / traA1).toBeLessThan(tiLeUnit * 1.5)
  })
})
