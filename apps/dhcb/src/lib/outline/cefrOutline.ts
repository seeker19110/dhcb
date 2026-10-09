// cefrOutline — dựng cây mục lục MỘT CẤP CEFR của môn Tiếng Anh (A1 → C2).
//
// Đặc tả: docs/specs/2026-09-15-goc-hoc-tap-07-muc-luc-mon-khoa.md §③.2, §③.3 (dòng CEFR), AC-5.
//
// Cây: `cấp → unit → hoạt động`, mỗi unit đúng ba loại hoạt động theo THỨ TỰ CỐ ĐỊNH:
//   ① Từ vựng — mỗi vòng (`vocabCircleIds`) một hoạt động
//   ② Ngữ pháp — mỗi `GrammarLesson` một hoạt động (unit không có ngữ pháp thì KHÔNG sinh nút
//      rỗng: B2 có 43 unit nhưng chỉ 14 bài ngữ pháp)
//   ③ Hội thoại — MỘT hoạt động cho cả unit, CHỈ khi unit thật sự có hội thoại (162/197 unit
//      không có: không sinh nút rỗng; chưa biết thì ẩn tới khi dữ liệu tải xong)
//
// Ở `apps/` vì dữ liệu cấp (`data/cefrTypes`) và tiến độ (`lib/cefrProgress`) sống trong app;
// `packages/` không được import `apps/`.
//
// KHÔNG FETCH: `cefr.json` và danh sách vòng đã nằm sẵn trong trang (`loadCefr`/`loadFoundation`);
// adapter chỉ nhận dữ liệu đã có qua `ctx` và là hàm thuần, gọi được trong `useMemo`.
import type { Outline, OutlineNode } from '@dhcb/core-contracts/outline'
import type { CefrLevel, CefrUnit } from '../../data/cefrTypes'
import type { Circle } from '../../data/curriculumTypes'
import { circleDoneCount, dialogueKey } from '../cefrProgress'
import { duongDanLoTrinh } from '../englishRoutes'

const SUBJECT_ID = 'english'

export interface CefrOutlineCtx {
  /** Từ đã thuộc (`et_learned_<uid>`), chữ thường. */
  learned: ReadonlySet<string>
  /** Bài ngữ pháp đã học xong (`et_cefr_grammar_<uid>`, hợp nhất với server). */
  doneGrammar: ReadonlySet<string>
  /** Khoá hội thoại đã xem: `dialogueKey(ownerId, titleEn)` (`et_cefr_dialogue_<uid>`). */
  viewedDialogues: ReadonlySet<string>
  /** Khoá hội thoại ĐÃ HỌC (đạt kiểm tra hiểu) — `getLearnedDialogues`, cùng khuôn khoá. */
  learnedDialogues: ReadonlySet<string>
  /**
   * `titleEn` các hội thoại của từng unit (từ `dialogues.json`). Có thì đếm đúng "đã học x/N";
   * unit có mục rỗng → không có nút hội thoại. Vắng (đang tải / tải lỗi) → cũng KHÔNG sinh nút
   * (không biết N, không khẳng định "đã học hết", không đẻ mẫu số ảo).
   */
  dialogueTitlesByUnit?: ReadonlyMap<string, readonly string[]>
  /** Vòng từ vựng theo id (từ `loadFoundation()`). */
  circles: ReadonlyMap<string, Circle>
  /** Khoá cấp — SERVER là nguồn sự thật (`computeLockedMapFromServer`), adapter không tự tính. */
  lockedMap: ReadonlyMap<CefrLevel['id'], boolean>
  /** Cấp liền trước, để viết đúng câu giải thích khoá như màn khoá hiện có. */
  prevLevelId?: CefrLevel['id']
}

/** Loại hoạt động trong một unit CEFR. */
export type CefrActivityKind = 'vocab' | 'grammar' | 'dialogue'

/**
 * URL một hoạt động: trang cấp + ngữ cảnh trên query, vì ba hoạt động này là màn CON của
 * `CefrLevelPage` (không phải route riêng). Giữ ở ĐÚNG MỘT hàm để giao diện S07-3 đọc lại
 * bằng cùng một quy ước, không nơi nào tự ghép chuỗi.
 */
export function duongDanHoatDongCefr(
  levelId: CefrLevel['id'],
  unitId: string,
  kind: CefrActivityKind,
  contentId: string,
): string {
  const query = new URLSearchParams({ unit: unitId, hd: `${kind}:${contentId}` })
  return `${duongDanLoTrinh(levelId)}?${query.toString()}`
}

/** Một hoạt động đã được chỉ đích danh trên URL (`?unit=…&hd=<loại>:<mã>`). */
export interface CefrActivityRef {
  unitId: string
  kind: CefrActivityKind
  contentId: string
}

const CAC_LOAI: readonly CefrActivityKind[] = ['vocab', 'grammar', 'dialogue']

/**
 * Đọc ngược `?unit=…&hd=…` thành hoạt động cụ thể — hàm ĐỐI của `duongDanHoatDongCefr`.
 *
 * Tham số thiếu, loại lạ, hay `hd` không đúng khuôn `<loại>:<mã>` đều trả `undefined`: trang
 * cấp khi đó hiện như bình thường, KHÔNG báo lỗi (người dùng sửa tay URL không phải là lỗi của
 * họ). Mã nội dung có thể chứa dấu `:` nên chỉ tách ở dấu hai chấm ĐẦU TIÊN.
 */
export function docHoatDongTuQuery(search: URLSearchParams): CefrActivityRef | undefined {
  const unitId = search.get('unit')
  const hd = search.get('hd')
  if (!unitId || !hd) return undefined
  const viTri = hd.indexOf(':')
  if (viTri <= 0) return undefined
  const kind = hd.slice(0, viTri)
  const contentId = hd.slice(viTri + 1)
  if (contentId === '') return undefined
  if (!CAC_LOAI.includes(kind as CefrActivityKind)) return undefined
  return { unitId, kind: kind as CefrActivityKind, contentId }
}

/**
 * `nodeId` của một hoạt động — DUY NHẤT trong cây (mã nội dung thì không: cấp B2 dùng vòng từ
 * vựng `it` ở hai unit). Giao diện dùng nó để biết lá nào đang mở.
 */
export function nodeIdHoatDong(ref: CefrActivityRef): string {
  return `activity:${ref.unitId}:${ref.kind}:${ref.contentId}`
}

/** Câu giải thích khoá — lấy nguyên văn luật đang hiện ở màn khoá của trang cấp. */
function lyDoKhoa(prevLevelId: CefrLevel['id'] | undefined): string {
  return prevLevelId
    ? `Thi đạt bài kiểm tra cuối cấp ${prevLevelId} (≥70%) để mở khoá.`
    : 'Cấp này chưa mở.'
}

/** Cây một cấp CEFR. Cấp khoá vẫn dựng đủ cây (để giao diện hiện lý do), chỉ là không có href. */
export function buildCefrOutline(level: CefrLevel, ctx: CefrOutlineCtx): Outline {
  const locked = ctx.lockedMap.get(level.id) === true
  const lockReason = locked ? lyDoKhoa(ctx.prevLevelId) : undefined
  const chung = {
    subjectId: SUBJECT_ID,
    availability: locked ? ('locked' as const) : ('available' as const),
    ...(lockReason ? { lockReason } : {}),
  }

  const rootId = `level:${level.id}`
  const nodes: OutlineNode[] = [
    {
      ...chung,
      nodeId: rootId,
      contentId: level.id,
      kind: 'level',
      title: `${level.id} · ${level.titleVi}`,
      hint: `${level.units.length} phần`,
      order: 0,
      progress: 'unknown',
    },
  ]

  level.units.forEach((unit, unitIndex) => {
    const unitNodeId = `chapter:${unit.id}`
    const hoatDong = hoatDongCuaUnit(level, unit, ctx, locked)
    nodes.push({
      ...chung,
      nodeId: unitNodeId,
      parentId: rootId,
      contentId: unit.id,
      kind: 'chapter',
      title: unit.titleVi,
      hint: `${hoatDong.length} hoạt động`,
      order: unitIndex,
      progress: 'unknown',
    })
    hoatDong.forEach((node, i) => {
      nodes.push({ ...node, parentId: unitNodeId, order: i })
    })
  })

  return { rootId, subjectId: SUBJECT_ID, nodes, builtAt: Date.now() }
}

/** Ba loại hoạt động của MỘT unit, đúng thứ tự ① từ vựng ② ngữ pháp ③ hội thoại. */
function hoatDongCuaUnit(
  level: CefrLevel,
  unit: CefrUnit,
  ctx: CefrOutlineCtx,
  locked: boolean,
): OutlineNode[] {
  const lockReason = locked ? lyDoKhoa(ctx.prevLevelId) : undefined
  const nen = (
    kind: CefrActivityKind,
    contentId: string,
    title: string,
    tienDo: Pick<OutlineNode, 'progress' | 'evidenceSource'>,
    hint?: string,
  ): OutlineNode => ({
    nodeId: nodeIdHoatDong({ unitId: unit.id, kind, contentId }),
    subjectId: SUBJECT_ID,
    contentId,
    kind: 'activity',
    title,
    ...(hint ? { hint } : {}),
    order: 0, // nơi gọi gán lại theo vị trí thật trong unit
    ...(locked ? {} : { href: duongDanHoatDongCefr(level.id, unit.id, kind, contentId) }),
    availability: locked ? 'locked' : 'available',
    ...(lockReason ? { lockReason } : {}),
    ...tienDo,
  })

  const nodes: OutlineNode[] = []

  // ① Từ vựng: mỗi vòng một hoạt động. Vòng không có trong dữ liệu đã tải → bỏ qua (không
  // dựng nút "rỗng" mà bấm vào không có gì).
  for (const circleId of unit.vocabCircleIds) {
    const circle = ctx.circles.get(circleId)
    if (!circle) continue
    const done = circleDoneCount(circle, ctx.learned as Set<string>)
    const total = circle.words.length
    const tienDo: Pick<OutlineNode, 'progress' | 'evidenceSource'> =
      total > 0 && done === total
        ? { progress: 'completed', evidenceSource: 'english.vocab' }
        : done > 0
          ? { progress: 'in-progress', evidenceSource: 'english.vocab' }
          : { progress: 'not-started' }
    nodes.push(nen('vocab', circle.id, `Từ vựng: ${circle.titleVi}`, tienDo, `${done}/${total} từ`))
  }

  // ② Ngữ pháp: unit không có bài nào thì KHÔNG sinh nút rỗng.
  for (const grammar of unit.grammar) {
    const xong = ctx.doneGrammar.has(grammar.id)
    nodes.push(
      nen(
        'grammar',
        grammar.id,
        `Ngữ pháp: ${grammar.titleVi}`,
        xong
          ? { progress: 'completed', evidenceSource: 'english.cefrGrammar' }
          : { progress: 'not-started' },
      ),
    )
  }

  // ③ Hội thoại: MỘT hoạt động cho cả unit, ba trạng thái (đặc tả
  // docs/specs/2026-10-09-hoi-thoai-cefr-bang-chung-da-hoc.md):
  //   chưa xem → not-started · đã xem (chưa đạt kiểm tra hiểu) → in-progress · đã học → completed.
  // "Đã xem" KHÔNG còn là "xong" — mở hội thoại không chứng minh người học hiểu.
  // Unit KHÔNG có hội thoại (hoặc chưa biết có hay không) thì KHÔNG sinh nút: nút bấm vào không
  // có gì, lại làm mẫu số "N hoạt động" và tiến độ cấp/môn ảo (changelog 0554).
  const hoiThoai = tienDoHoiThoaiCuaUnit(unit.id, ctx)
  if (hoiThoai) {
    const { hint: chuPhuHoiThoai, ...tienDoHoiThoai } = hoiThoai
    nodes.push(nen('dialogue', unit.id, 'Hội thoại', tienDoHoiThoai, chuPhuHoiThoai))
  }

  return nodes
}

/**
 * Tiến độ + chữ phụ của nút "Hội thoại" một unit. Chữ phụ là CHỮ, không phụ thuộc màu/biểu tượng.
 *
 * Trả `undefined` = unit này KHÔNG có nút hội thoại:
 *  - đã biết unit không có hội thoại nào (`dialogueTitlesByUnit` có mục rỗng);
 *  - CHƯA biết (dữ liệu hội thoại đang tải / tải lỗi → `dialogueTitlesByUnit` vắng hoặc thiếu
 *    unit). Chọn ẨN tới khi biết thay vì hiện tạm: hiện tạm rồi rút lại sẽ làm mẫu số "N hoạt
 *    động" và % tiến độ nhảy xuống ở 162/197 unit; ẩn rồi hiện thêm ở 35 unit chỉ làm mẫu số
 *    tăng đúng sự thật, không bao giờ khẳng định "xong" khi chưa biết tổng.
 */
export function tienDoHoiThoaiCuaUnit(
  unitId: string,
  ctx: Pick<CefrOutlineCtx, 'viewedDialogues' | 'learnedDialogues' | 'dialogueTitlesByUnit'>,
): (Pick<OutlineNode, 'progress' | 'evidenceSource'> & { hint: string }) | undefined {
  const titles = ctx.dialogueTitlesByUnit?.get(unitId)
  if (!titles || titles.length === 0) return undefined
  const tong = titles.length
  const keys = titles.map((t) => dialogueKey(unitId, t))
  const daHoc = keys.filter((k) => ctx.learnedDialogues.has(k)).length
  const daXem = keys.filter((k) => ctx.viewedDialogues.has(k) || ctx.learnedDialogues.has(k)).length
  if (daHoc === tong) {
    return {
      progress: 'completed',
      evidenceSource: 'english.cefrDialogueLearned',
      hint: tong === 1 ? 'Đã học' : `Đã học ${tong}/${tong}`,
    }
  }
  if (daXem > 0) {
    return {
      progress: 'in-progress',
      evidenceSource: daHoc > 0 ? 'english.cefrDialogueLearned' : 'english.cefrDialogue',
      hint: `Đã xem ${daXem}/${tong} · đã học ${daHoc}/${tong}`,
    }
  }
  return { progress: 'not-started', hint: 'Chưa xem' }
}
