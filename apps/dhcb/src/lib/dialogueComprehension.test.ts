// Kiểm tra hiểu hội thoại CEFR — đặc tả docs/specs/2026-10-09-hoi-thoai-cefr-bang-chung-da-hoc.md
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import type { Dialogue, DialogueLine } from '../data/dialogues'
import {
  MIN_QUESTIONS,
  QUIZ_SIZE,
  buildComprehensionQuiz,
  comprehensionSeed,
  gradeComprehension,
  requiredCorrect,
  type ComprehensionDirection,
  type ComprehensionQuestion,
} from './dialogueComprehension'
import { DIALOGUE_LEARNED_PREFIX } from './cefrProgress'

const l = (who: 'A' | 'B', en: string, vi: string): DialogueLine => ({ who, en, vi })

const LOP_HOC: Dialogue = {
  titleVi: 'Làm quen ở lớp học',
  titleEn: 'Meeting in class',
  speakerA: { vi: 'Lan', en: 'Lan' },
  speakerB: { vi: 'Minh', en: 'Minh' },
  lines: [
    l('A', 'Hello! Are you a new student?', 'Xin chào! Bạn là học viên mới à?'),
    l('B', 'Yes, I am. My name is Minh.', 'Vâng. Tôi tên Minh.'),
    l('A', "Nice to meet you, Minh. I'm Lan.", 'Rất vui được gặp Minh. Tôi là Lan.'),
    l('B', 'Nice to meet you too.', 'Tôi cũng rất vui.'),
    l('A', "I'm from Hue. Where are you from?", 'Tôi đến từ Huế. Bạn từ đâu?'),
    l('B', "I'm from Hanoi.", 'Tôi đến từ Hà Nội.'),
  ],
}

/** Kiểm mọi tính chất "đề tử tế" của một đề, đối chiếu ngược với dữ liệu gốc. */
function kiemDe(dlg: Dialogue, dir: ComprehensionDirection, qs: ComprehensionQuestion[]) {
  const target = (ln: DialogueLine) => (dir === 'A' ? ln.en : ln.vi).trim()
  const native = (ln: DialogueLine) => (dir === 'A' ? ln.vi : ln.en).trim()
  const stemIdx: number[] = []
  for (const q of qs) {
    const ids = q.options.map((o) => o.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(ids).toContain(q.correctId)
    const texts = q.options.map((o) => o.text.trim().toLowerCase())
    expect(new Set(texts).size).toBe(texts.length) // không hai phương án trùng chữ
    expect(q.options.every((o) => o.text.trim() !== '')).toBe(true)
    expect(q.stemLang).toBe(dir === 'A' ? 'en' : 'vi')
    const i = Number(q.id.slice(q.id.lastIndexOf('-') + 1))
    const line = dlg.lines[i]!
    expect(target(line)).toBe(q.stem) // đề là câu THẬT của hội thoại, đúng ngôn ngữ đích
    stemIdx.push(i)
    const correct = q.options.find((o) => o.id === q.correctId)!
    if (q.kind === 'meaning') {
      expect(correct.text).toBe(native(line)) // đáp án = bản dịch tác giả của chính câu đó
      expect(q.options.length).toBeGreaterThanOrEqual(3)
      expect(q.options.every((o) => o.lang === (dir === 'A' ? 'vi' : 'en'))).toBe(true)
    } else if (q.kind === 'next-line') {
      const next = dlg.lines[i + 1]!
      expect(correct.text).toBe(target(next)) // đáp án = câu nói NGAY SAU trong dữ liệu
      stemIdx.push(i + 1)
      // Nhiễu là câu của CÙNG người nói với đáp án → tên người nói không gợi ý được.
      for (const o of q.options) {
        const src = dlg.lines.find((x) => target(x) === o.text)!
        expect(src.who).toBe(next.who)
      }
      expect(q.options.length).toBeGreaterThanOrEqual(3)
    } else {
      expect(q.correctId).toBe(line.who)
      expect(q.options).toHaveLength(2)
    }
  }
  // Không dòng nào vừa làm đề câu này vừa làm đề/đáp án câu khác.
  expect(new Set(stemIdx).size).toBe(stemIdx.length)
}

describe('buildComprehensionQuiz — hội thoại bình thường', () => {
  it('3 câu, đủ ba loại, mọi đáp án kiểm ngược được từ dữ liệu (chiều A)', () => {
    const qs = buildComprehensionQuiz(LOP_HOC, 'A', 'seed-1')
    expect(qs).toHaveLength(QUIZ_SIZE)
    expect(qs.map((q) => q.kind)).toEqual(['meaning', 'next-line', 'speaker'])
    kiemDe(LOP_HOC, 'A', qs)
    // Câu hỏi + giải thích bằng tiếng Việt (tiếng mẹ đẻ của người học chiều A).
    expect(qs[0]!.prompt).toBe('Câu này trong hội thoại có nghĩa là gì?')
    expect(qs[2]!.explanation.lead).toMatch(/nói câu này\.$/)
  })

  it('chiều B: đề bằng tiếng Việt (ngôn ngữ đích), câu hỏi/giải thích tiếng Anh', () => {
    const qs = buildComprehensionQuiz(LOP_HOC, 'B', 'seed-1')
    expect(qs).toHaveLength(QUIZ_SIZE)
    kiemDe(LOP_HOC, 'B', qs)
    expect(qs.map((q) => q.prompt)).toEqual([
      'What does this line from the dialogue mean?',
      'In the dialogue you just read, which line comes right after this one?',
      'Who says this line in the dialogue?',
    ])
    expect(qs[0]!.explanation.lead).toBe('Correct meaning:')
    expect(qs[0]!.explanation.quoteLang).toBe('en')
    expect(qs[1]!.explanation.quoteLang).toBe('vi')
  })

  it('tên người nói theo chiều: A hiển thị tên tiếng Việt, B tên tiếng Anh', () => {
    const dlg: Dialogue = {
      ...LOP_HOC,
      speakerA: { vi: 'Cô Lan', en: 'Ms Lan' },
      speakerB: { vi: 'Anh Minh', en: 'Mr Minh' },
    }
    const nameOf = (dir: ComprehensionDirection) =>
      buildComprehensionQuiz(dlg, dir, 's')
        .find((q) => q.kind === 'speaker')!
        .options.map((o) => o.text)
    expect(nameOf('A')).toEqual(['Cô Lan', 'Anh Minh'])
    expect(nameOf('B')).toEqual(['Ms Lan', 'Mr Minh'])
  })

  it('TẤT ĐỊNH theo seed; đổi lần làm thì đề đổi', () => {
    const s0 = comprehensionSeed('a1-greetings', LOP_HOC.titleEn, 'A', 0)
    expect(buildComprehensionQuiz(LOP_HOC, 'A', s0)).toEqual(
      buildComprehensionQuiz(LOP_HOC, 'A', s0),
    )
    const de = new Set(
      [0, 1, 2, 3, 4, 5].map((n) =>
        JSON.stringify(
          buildComprehensionQuiz(
            LOP_HOC,
            'A',
            comprehensionSeed('a1-greetings', LOP_HOC.titleEn, 'A', n),
          ),
        ),
      ),
    )
    expect(de.size).toBeGreaterThan(1)
  })
})

/** Oracle ĐỘC LẬP (viết lại, không dùng hàm nguồn): đề và đáp án đúng chung một từ mà nhiễu không có. */
function loDapAnTheoChu(q: ComprehensionQuestion): boolean {
  const tok = (t: string) => new Set(t.toLowerCase().match(/[\p{L}\p{N}]{2,}/gu) ?? [])
  const dung = q.options.find((o) => o.id === q.correctId)!.text
  const chung = [...tok(q.stem)].filter((t) => tok(dung).has(t))
  const nhieu = q.options.filter((o) => o.id !== q.correctId).map((o) => tok(o.text))
  return chung.some((t) => !nhieu.some((n) => n.has(t)))
}

describe('buildComprehensionQuiz — ca biên', () => {
  it('câu hỏi nghĩa TRÁNH câu làm đề mà tên riêng chỉ xuất hiện ở đáp án đúng', () => {
    const coTen: Dialogue = {
      ...LOP_HOC,
      lines: [
        l('A', 'Good morning, everybody here.', 'Chào buổi sáng mọi người.'),
        l('B', 'See you in class, Lan!', 'Hẹn gặp trong lớp, Lan!'),
        l('A', 'Where is the library now?', 'Thư viện ở đâu vậy?'),
        l('B', 'It is next to the gate.', 'Nó ở cạnh cổng.'),
      ],
    }
    for (let n = 0; n < 30; n++) {
      const m = buildComprehensionQuiz(coTen, 'A', `ten-${n}`).find((q) => q.kind === 'meaning')!
      expect(m.stem).not.toBe('See you in class, Lan!')
      expect(loDapAnTheoChu(m)).toBe(false)
    }
  })

  it('hội thoại quá ngắn (2 dòng) → không đủ chất liệu → [] (không tự chế câu hỏi)', () => {
    const ngan: Dialogue = { ...LOP_HOC, lines: LOP_HOC.lines.slice(0, 2) }
    expect(buildComprehensionQuiz(ngan, 'A', 's')).toEqual([])
    expect(buildComprehensionQuiz(ngan, 'B', 's')).toEqual([])
  })

  it('không có dòng nào → []', () => {
    expect(buildComprehensionQuiz({ ...LOP_HOC, lines: [] }, 'A', 's')).toEqual([])
  })

  it('chỉ MỘT người nói → không hỏi "ai nói", bù bằng loại khác cho đủ 3 câu', () => {
    const motNguoi: Dialogue = {
      ...LOP_HOC,
      lines: LOP_HOC.lines.map((ln) => ({ ...ln, who: 'A' as const })),
    }
    for (const dir of ['A', 'B'] as const) {
      const qs = buildComprehensionQuiz(motNguoi, dir, 's')
      expect(qs).toHaveLength(QUIZ_SIZE)
      expect(qs.some((q) => q.kind === 'speaker')).toBe(false)
      kiemDe(motNguoi, dir, qs)
    }
  })

  it('hai nhân vật TRÙNG tên → không hỏi "ai nói" (câu hỏi vô nghĩa)', () => {
    const trungTen: Dialogue = { ...LOP_HOC, speakerB: { vi: 'Lan', en: 'Lan' } }
    const qs = buildComprehensionQuiz(trungTen, 'A', 's')
    expect(qs.some((q) => q.kind === 'speaker')).toBe(false)
    expect(qs.length).toBeGreaterThanOrEqual(MIN_QUESTIONS)
  })

  it('thiếu tên nhân vật → dùng nhãn A/B', () => {
    const khongTen: Dialogue = { ...LOP_HOC, speakerA: undefined, speakerB: undefined }
    const q = buildComprehensionQuiz(khongTen, 'A', 's').find((x) => x.kind === 'speaker')!
    expect(q.options.map((o) => o.text)).toEqual(['A', 'B'])
  })

  it('bản dịch trùng nhau → phương án vẫn khác chữ, dòng rỗng bị bỏ qua', () => {
    const trung: Dialogue = {
      ...LOP_HOC,
      lines: [
        ...LOP_HOC.lines,
        l('A', 'Nice to meet you too!', 'Tôi cũng rất vui.'), // dịch trùng dòng 3
        l('B', '   ', ''), // dòng hỏng
      ],
    }
    for (let n = 0; n < 20; n++) {
      const qs = buildComprehensionQuiz(trung, 'A', `s${n}`)
      expect(qs).toHaveLength(QUIZ_SIZE)
      for (const q of qs) {
        const texts = q.options.map((o) => o.text.toLowerCase().replace(/[.!?]+$/, ''))
        expect(new Set(texts).size).toBe(texts.length)
      }
    }
  })
})

describe('requiredCorrect / gradeComprehension', () => {
  it('ngưỡng 2/3 làm tròn LÊN', () => {
    expect(requiredCorrect(3)).toBe(2)
    expect(requiredCorrect(2)).toBe(2)
    expect(requiredCorrect(4)).toBe(3)
  })

  const qs = buildComprehensionQuiz(LOP_HOC, 'A', 'grade')
  const dung = Object.fromEntries(qs.map((q) => [q.id, q.correctId]))
  const sai = (q: ComprehensionQuestion) => q.options.find((o) => o.id !== q.correctId)!.id

  it('3/3 và 2/3 → đạt; 1/3 → chưa đạt', () => {
    expect(gradeComprehension(qs, dung)).toMatchObject({ correct: 3, total: 3, passed: true })
    expect(gradeComprehension(qs, { ...dung, [qs[0]!.id]: sai(qs[0]!) })).toMatchObject({
      correct: 2,
      passed: true,
    })
    expect(
      gradeComprehension(qs, {
        ...dung,
        [qs[0]!.id]: sai(qs[0]!),
        [qs[1]!.id]: sai(qs[1]!),
      }),
    ).toMatchObject({ correct: 1, required: 2, passed: false })
  })

  it('bỏ trống = sai; id phương án lạ = sai', () => {
    const r = gradeComprehension(qs, { [qs[0]!.id]: qs[0]!.correctId, [qs[1]!.id]: 'khong-co' })
    expect(r.correct).toBe(1)
    expect(r.passed).toBe(false)
    expect(r.items[2]).toEqual({ questionId: qs[2]!.id, chosenId: undefined, correct: false })
  })

  it('đề rỗng không bao giờ đạt', () => {
    expect(gradeComprehension([], {})).toMatchObject({ total: 0, passed: false })
  })
})

// ── Dữ liệu THẬT: mọi hội thoại × hai chiều đều ra đề đủ chuẩn ─────────────────────────────
describe('dialogues.json thật', () => {
  const data = JSON.parse(
    readFileSync(join(process.cwd(), 'apps/dhcb/public/data/dialogues.json'), 'utf8'),
  ) as Record<string, Dialogue[]>

  it('mọi hội thoại, cả chiều A và B: đủ 3 câu, đủ ba loại, đáp án kiểm ngược được', () => {
    let dem = 0
    for (const [ownerId, list] of Object.entries(data)) {
      for (const dlg of list) {
        for (const dir of ['A', 'B'] as const) {
          for (const attempt of [0, 1]) {
            const qs = buildComprehensionQuiz(
              dlg,
              dir,
              comprehensionSeed(ownerId, dlg.titleEn, dir, attempt),
            )
            expect(qs, `${ownerId} · ${dlg.titleEn} · ${dir}`).toHaveLength(QUIZ_SIZE)
            expect(new Set(qs.map((q) => q.kind)).size).toBe(3)
            kiemDe(dlg, dir, qs)
            // Câu hỏi nghĩa không "lộ" đáp án qua tên riêng/con số chỉ đáp án đúng có.
            const m = qs.find((q) => q.kind === 'meaning')!
            expect(loDapAnTheoChu(m), `${ownerId} · ${dlg.titleEn} · ${dir}`).toBe(false)
            dem++
          }
        }
      }
    }
    expect(dem).toBeGreaterThan(100)
  })

  it('không id unit/vòng nào trùng tiền tố bản ghi "đã học"', () => {
    for (const ownerId of Object.keys(data)) {
      expect(ownerId.startsWith(DIALOGUE_LEARNED_PREFIX)).toBe(false)
    }
  })
})

// Đợt 0555 (docs/specs/2026-10-09-hoi-thoai-cefr-server-cham-lai.md): giao diện và server phải
// dùng ĐÚNG MỘT hàm sinh đề + chấm — không có bản "viết lại" ở app có thể lệch với server.
describe('một hàm dùng chung client + server', () => {
  it('lib của app chỉ re-export gói @dhcb/subject-english (cùng tham chiếu hàm)', async () => {
    const pkg = await import('@dhcb/subject-english/dialogueComprehension')
    expect(buildComprehensionQuiz).toBe(pkg.buildComprehensionQuiz)
    expect(gradeComprehension).toBe(pkg.gradeComprehension)
    expect(comprehensionSeed).toBe(pkg.comprehensionSeed)
  })
})
