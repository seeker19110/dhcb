// Server nạp hội thoại + "cùng seed ⇒ client và server cùng đề" + chấm lại.
// Đặc tả docs/specs/2026-10-09-hoi-thoai-cefr-server-cham-lai.md §④.
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import {
  DIALOGUES_JSON_PATH,
  findCefrDialogue,
  resetCefrDialogueCacheForTest,
} from './dialogueData'
import {
  buildComprehensionQuiz,
  comprehensionSeed,
  regradeComprehension,
  type ComprehensionDialogue,
  type ComprehensionDirection,
} from './dialogueComprehension'

/** Đúng file giao diện fetch (`/data/dialogues.json`), đọc NGUYÊN bản như trình duyệt nhận. */
const CLIENT_DATA = JSON.parse(
  readFileSync(join(process.cwd(), DIALOGUES_JSON_PATH), 'utf8'),
) as Record<string, ComprehensionDialogue[]>

afterEach(() => resetCefrDialogueCacheForTest())

describe('findCefrDialogue — nạp từ ĐÚNG file public', () => {
  it('tra được mọi hội thoại thật theo (owner, titleEn); không có → undefined', () => {
    let n = 0
    for (const [owner, list] of Object.entries(CLIENT_DATA)) {
      for (const d of list) {
        expect(findCefrDialogue(owner, d.titleEn)?.lines).toEqual(d.lines)
        n++
      }
    }
    expect(n).toBeGreaterThan(100)
    expect(findCefrDialogue('a1-greetings', 'Không có')).toBeUndefined()
    expect(findCefrDialogue('khong-co', 'Meeting in class')).toBeUndefined()
  })

  it('file hỏng → NÉM (không chấm bừa trên dữ liệu rác)', () => {
    const root = mkdtempSync(join(tmpdir(), 'dlg-'))
    const file = join(root, DIALOGUES_JSON_PATH)
    mkdirSync(dirname(file), { recursive: true })
    writeFileSync(file, JSON.stringify({ x: [{ titleEn: 1 }] }))
    expect(() => findCefrDialogue('x', 'y', root)).toThrow()
  })
})

describe('cùng seed ⇒ client và server CÙNG ĐỀ', () => {
  it('mọi hội thoại thật × chiều A/B × 3 lượt: đề server dựng == đề giao diện dựng', () => {
    for (const [owner, list] of Object.entries(CLIENT_DATA)) {
      for (const d of list) {
        const server = findCefrDialogue(owner, d.titleEn)!
        for (const dir of ['A', 'B'] as ComprehensionDirection[]) {
          for (const attempt of [0, 1, 123456789]) {
            const seed = comprehensionSeed(owner, d.titleEn, dir, attempt)
            expect(buildComprehensionQuiz(server, dir, seed)).toEqual(
              buildComprehensionQuiz(d, dir, seed),
            )
          }
        }
      }
    }
  })
})

describe('regradeComprehension — chấm lại từ seed', () => {
  const owner = 'a1-greetings'
  const dlg = CLIENT_DATA[owner]![0]!
  const seed = comprehensionSeed(owner, dlg.titleEn, 'A', 0)
  const quiz = buildComprehensionQuiz(dlg, 'A', seed)
  const right = quiz.map((q) => ({ questionId: q.id, optionId: q.correctId }))
  const wrongOf = (i: number) => quiz[i]!.options.find((o) => o.id !== quiz[i]!.correctId)!.id

  it('đúng hết → đạt; sai 2 → chưa đạt', () => {
    const ok = regradeComprehension(dlg, 'A', seed, right)
    expect(ok.ok && ok.result).toMatchObject({ correct: 3, passed: true })
    const bad = regradeComprehension(dlg, 'A', seed, [
      right[0]!,
      { questionId: quiz[1]!.id, optionId: wrongOf(1) },
      { questionId: quiz[2]!.id, optionId: wrongOf(2) },
    ])
    expect(bad.ok && bad.result).toMatchObject({ correct: 1, passed: false })
  })

  it('thiếu câu = sai; id câu lạ hoặc trùng → QUIZ_MISMATCH', () => {
    const thieu = regradeComprehension(dlg, 'A', seed, right.slice(0, 2))
    expect(thieu.ok && thieu.result).toMatchObject({ correct: 2, total: 3, passed: true })
    const thieu2 = regradeComprehension(dlg, 'A', seed, right.slice(0, 1))
    expect(thieu2.ok && thieu2.result.passed).toBe(false)
    expect(
      regradeComprehension(dlg, 'A', seed, [{ questionId: 'meaning-999', optionId: 'o0' }]),
    ).toEqual({ ok: false, code: 'QUIZ_MISMATCH' })
    expect(regradeComprehension(dlg, 'A', seed, [right[0]!, right[0]!])).toEqual({
      ok: false,
      code: 'QUIZ_MISMATCH',
    })
  })

  it('id câu kiểu prototype ("constructor") không làm hỏng chấm', () => {
    expect(
      regradeComprehension(dlg, 'A', seed, [{ questionId: 'constructor', optionId: 'o0' }]),
    ).toEqual({ ok: false, code: 'QUIZ_MISMATCH' })
  })

  it('hội thoại quá ngắn → NO_QUIZ', () => {
    const ngan = { ...dlg, lines: dlg.lines.slice(0, 2) }
    expect(regradeComprehension(ngan, 'A', seed, right)).toEqual({ ok: false, code: 'NO_QUIZ' })
  })
})
