// Test phần seed giọng ElevenLabs của scripts/seed-all.ts (cờ --eleven / SEED_ELEVEN=1). Cờ được
// đọc lúc nạp module nên mỗi ca nạp lại module với env khác nhau. Không đụng DB/mạng.
import { afterEach, describe, expect, it, vi } from 'vitest'

// Mỗi ca nạp lại seed-all (đọc cả kho dữ liệu, dựng ~hàng trăm nghìn tác vụ) — nặng hơn 5s mặc định
// khi CI chạy song song nhiều file.
vi.setConfig({ testTimeout: 60_000 })
import {
  ELEVEN_TONE_TAGS,
  ELEVEN_VOICE_IDS,
  elevenBilledChars,
  elevenVoiceGender,
  isValidElevenVoice,
} from '@dhcb/core-ai/elevenLabsTts'

async function loadSeed(eleven: boolean, budget?: number) {
  vi.resetModules()
  if (eleven) process.env.SEED_ELEVEN = '1'
  else delete process.env.SEED_ELEVEN
  if (budget === undefined) delete process.env.ELEVEN_BUDGET_CHARS
  else process.env.ELEVEN_BUDGET_CHARS = String(budget)
  return import('./seed-all')
}

afterEach(() => {
  delete process.env.SEED_ELEVEN
  delete process.env.ELEVEN_BUDGET_CHARS
})

describe('seed-all — không có --eleven (mặc định)', () => {
  it('KHÔNG sinh tác vụ ElevenLabs nào (không tự tốn tiền)', async () => {
    const { loadPatternTasks } = await loadSeed(false)
    expect(loadPatternTasks().some((t) => isValidElevenVoice(t.voice))).toBe(false)
  })
})

describe('seed-all — có --eleven', () => {
  it('thêm đủ 6 giọng, vào các nhóm câu; KHÔNG vào truyện (Gemini)', async () => {
    const { loadPatternTasks } = await loadSeed(true)
    const eleven = loadPatternTasks().filter((t) => isValidElevenVoice(t.voice))
    expect(new Set(eleven.map((t) => t.voice))).toEqual(new Set(ELEVEN_VOICE_IDS))
    const cats = new Set(eleven.map((t) => t.cat))
    for (const c of [
      'curriculum',
      'cefr',
      'lessons-early',
      'lessons-rest',
      'patterns',
      'challenge',
    ])
      expect(cats.has(c as never)).toBe(true)
    expect(cats.has('stories')).toBe(false)
  })

  it('không trùng (text, giọng) — audio ElevenLabs không phụ thuộc lang', async () => {
    const { loadPatternTasks } = await loadSeed(true)
    const keys = loadPatternTasks()
      .filter((t) => isValidElevenVoice(t.voice))
      .map((t) => `${t.text}|${t.voice}`)
    expect(new Set(keys).size).toBe(keys.length)
  })

  it('giữ nguyên tác vụ Google và đặt ElevenLabs SAU CÙNG', async () => {
    const off = (await loadSeed(false)).loadPatternTasks()
    const { loadPatternTasks } = await loadSeed(true)
    const on = loadPatternTasks()
    const nonEleven = on.filter((t) => !isValidElevenVoice(t.voice))
    // So từng phần tử bằng khoá chuỗi (nhanh hơn toEqual sâu trên ~hàng trăm nghìn đối tượng).
    const key = (t: (typeof on)[number]) =>
      t.type === 'pattern' ? `${t.cat}|${t.text}|${t.voice}` : ''
    expect(nonEleven.length).toBe(off.length)
    expect(nonEleven.every((t, i) => key(t) === key(off[i]!))).toBe(true)
    const firstEleven = on.findIndex((t) => isValidElevenVoice(t.voice))
    expect(on.slice(firstEleven).every((t) => isValidElevenVoice(t.voice))).toBe(true)
  })

  it('hội thoại: mỗi lượt đọc bằng giọng ElevenLabs của đúng giới tính nhân vật (có cả nữ lẫn nam)', async () => {
    const { loadPatternTasks } = await loadSeed(true)
    const lesson = loadPatternTasks().filter(
      (t) => (t.cat === 'lessons-early' || t.cat === 'lessons-rest') && isValidElevenVoice(t.voice),
    )
    const genders = new Set(lesson.map((t) => elevenVoiceGender(t.voice as never)))
    expect(genders).toEqual(new Set(['female', 'male']))
  })
})

describe('hashText — khớp quy ước khoá cache của /api/tts', () => {
  it('giọng ElevenLabs bỏ lang khỏi hash; giọng Google thì giữ', async () => {
    const { hashText } = await loadSeed(false)
    expect(hashText('Hello', 'en-US', 'Alice')).toBe(hashText('Hello', 'vi-VN', 'Alice'))
    expect(hashText('Hello', 'en-US', 'Kore')).not.toBe(hashText('Hello', 'vi-VN', 'Kore'))
    expect(hashText('Hello', 'en-US', 'Alice')).not.toBe(hashText('Hello', 'en-US', 'Eric'))
  })
})

describe('applyElevenBudget — trần ký tự mỗi lượt', () => {
  const BUDGET = 60_000

  it('không đặt trần → giữ nguyên toàn bộ', async () => {
    const { loadPatternTasks, applyElevenBudget } = await loadSeed(true)
    const all = loadPatternTasks()
    expect(applyElevenBudget(all)).toBe(all)
  })

  it('có trần → tổng ký tự ElevenLabs không vượt trần, tác vụ Google giữ nguyên', async () => {
    const { loadPatternTasks, applyElevenBudget } = await loadSeed(true, BUDGET)
    const all = loadPatternTasks()
    const out = applyElevenBudget(all)
    const chars = out
      .filter((t) => isValidElevenVoice(t.voice))
      .reduce((n, t) => n + (t.type === 'pattern' ? t.text.length : 0), 0)
    expect(chars).toBeGreaterThan(0)
    expect(chars).toBeLessThanOrEqual(BUDGET)
    expect(out.filter((t) => !isValidElevenVoice(t.voice))).toEqual(
      all.filter((t) => !isValidElevenVoice(t.voice)),
    )
  })

  it('ưu tiên nhóm nhỏ trước: thứ tự nhóm không bao giờ đi lùi, giáo trình/Cụm từ sau cùng', async () => {
    const order = ['cefr', 'challenge', 'lessons-early', 'lessons-rest', 'curriculum', 'patterns']
    const { loadPatternTasks, applyElevenBudget } = await loadSeed(true, 400_000)
    const ranks = applyElevenBudget(loadPatternTasks())
      .filter((t) => isValidElevenVoice(t.voice))
      .map((t) => order.indexOf(t.type === 'pattern' ? t.cat : ''))
    expect(ranks.length).toBeGreaterThan(0)
    expect(ranks.every((r) => r >= 0)).toBe(true)
    expect(ranks).toEqual([...ranks].sort((a, b) => a - b))
    // Trần 400k chưa đủ cho 2 nhóm khổng lồ (6,4M + 7,7M ký tự) nên chúng không được lọt vào.
    expect(ranks.includes(order.indexOf('patterns'))).toBe(false)
    expect(ranks[0]).toBe(0)
  })
})

describe('giọng điệu theo nhóm câu', () => {
  it('mọi nhóm có tác vụ ElevenLabs đều có giọng điệu khai báo; từ điển/truyện thì không', async () => {
    const { loadPatternTasks, ELEVEN_TONE_BY_CAT } = await loadSeed(true)
    const cats = new Set(
      loadPatternTasks()
        .filter((t) => isValidElevenVoice(t.voice))
        .map((t) => (t.type === 'pattern' ? t.cat : '')),
    )
    for (const c of cats) expect(ELEVEN_TONE_BY_CAT[c as never]).toBeDefined()
    expect(ELEVEN_TONE_BY_CAT).not.toHaveProperty('pron')
    expect(ELEVEN_TONE_BY_CAT).not.toHaveProperty('stories')
    for (const tone of Object.values(ELEVEN_TONE_BY_CAT))
      expect(tone! in ELEVEN_TONE_TAGS).toBe(true)
  })

  it('trần ngân sách tính CẢ thẻ giọng điệu (tổng tính phí không vượt trần)', async () => {
    const budget = 200_000
    const { loadPatternTasks, applyElevenBudget, ELEVEN_TONE_BY_CAT } = await loadSeed(true, budget)
    const billed = applyElevenBudget(loadPatternTasks())
      .filter((t) => isValidElevenVoice(t.voice))
      .reduce(
        (n, t) =>
          t.type === 'pattern' ? n + elevenBilledChars(t.text, ELEVEN_TONE_BY_CAT[t.cat]) : n,
        0,
      )
    expect(billed).toBeGreaterThan(0)
    expect(billed).toBeLessThanOrEqual(budget)
  })
})
