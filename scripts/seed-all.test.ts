// Test cho phần dựng tác vụ phát âm của scripts/seed-all.ts — tập trung vào đợt thêm seed
// tiếng Việt (chiều B đọc `card.vi`), vì đây là chỗ dễ gây hậu quả nặng: khoá thiếu `lang`
// sẽ khiến verifyDb coi hàng vạn dòng là "orphan" và `--clean-orphans --yes` xoá thật.
import { describe, it, expect } from 'vitest'
import {
  loadPatternTasks,
  loadPronTasks,
  parsePronunciationKey,
  pronKey,
  isSeedablePronText,
  PRON_VI_VOICE_IDS,
} from './seed-all'

const tasks = loadPronTasks()
const enTasks = tasks.filter((t) => t.lang === 'en-US')
const viTasks = tasks.filter((t) => t.lang === 'vi-VN')

describe('loadPronTasks — tiếng Anh (giữ nguyên hành vi cũ)', () => {
  it('mỗi từ × 16 giọng (14 Chirp3-HD + 2 Studio)', () => {
    const words = new Set(enTasks.map((t) => t.word))
    const voices = new Set(enTasks.map((t) => t.voice))
    expect(voices.size).toBe(16)
    expect(enTasks.length).toBe(words.size * 16)
  })

  it('từ luôn ở dạng chữ thường (khớp cách api/pronunciation.ts chuẩn hoá `word`)', () => {
    expect(enTasks.every((t) => t.word === t.word.toLowerCase())).toBe(true)
  })
})

describe('loadPronTasks — tiếng Việt (mới)', () => {
  it('có tác vụ vi-VN và mỗi nghĩa × đúng bộ giọng vi (KHÔNG có Studio)', () => {
    expect(viTasks.length).toBeGreaterThan(0)
    const texts = new Set(viTasks.map((t) => t.word))
    const voices = new Set(viTasks.map((t) => t.voice))
    expect(voices.size).toBe(PRON_VI_VOICE_IDS.length)
    expect([...voices].some((v) => String(v).startsWith('Studio-'))).toBe(false)
    expect(viTasks.length).toBe(texts.size * PRON_VI_VOICE_IDS.length)
  })

  it('mọi chuỗi tiếng Việt đều qua được luật của API (nếu không, seed ra dòng API không bao giờ gọi tới)', () => {
    expect(viTasks.every((t) => isSeedablePronText(t.word))).toBe(true)
    expect(viTasks.every((t) => t.word.length <= 100)).toBe(true)
  })

  // Dựng khoá cho TOÀN BỘ tác vụ phát âm (Anh + Việt) rồi khử trùng — chính là phép kiểm,
  // không rút gọn được. Đo 2026-10-08 (changelog 0532): 0,55–0,60 s chạy riêng và dưới đo
  // coverage, 0,81 s coverage + máy tải ~25 — ca nặng thứ hai của file; trong `test:coverage`
  // toàn bộ trên máy tải 14–23 hệ số chậm ×6–10 là chạm ngưỡng 5 s mặc định. Nới riêng ca này.
  it(
    'không trùng lặp và không lẫn với tác vụ tiếng Anh (khoá gồm cả lang)',
    { timeout: 20_000 },
    () => {
      const keys = tasks.map((t) => pronKey(t.word, t.voice, t.lang))
      expect(new Set(keys).size).toBe(keys.length)
    },
  )

  // Ngoài nhóm ưu tiên curriculum, tiếng Anh (chiều A — đường dùng chính) phải seed xong
  // trước tiếng Việt, để dừng giữa chừng vẫn xong phần quan trọng hơn.
  // Lưu ý: một số NGHĨA tiếng Việt trùng chữ với từ curriculum ('bay', 'golf', 'cay'…) nên
  // được nhấc lên nhóm ưu tiên cùng chúng — đúng như thiết kế, không phải lỗi thứ tự.
  it('ngoài nhóm ưu tiên curriculum: mọi tác vụ tiếng Anh đứng trước tác vụ tiếng Việt', () => {
    const curriculumWords = new Set(tasks.filter((t) => t.lang === 'en-US').map((t) => t.word))
    const rest = tasks.filter((t) => !(t.lang === 'vi-VN' && curriculumWords.has(t.word)))
    const firstVi = rest.findIndex((t) => t.lang === 'vi-VN')
    const lastEn = rest.map((t) => t.lang).lastIndexOf('en-US')
    expect(firstVi).toBeGreaterThan(0)
    expect(lastEn).toBeLessThan(firstVi)
  })
})

describe('isSeedablePronText', () => {
  it('nhận nghĩa tiếng Việt nhiều vế (dấu phẩy, ngoặc, chấm phẩy, gạch chéo)', () => {
    expect(isSeedablePronText('bỏ rơi, từ bỏ')).toBe(true)
    expect(isSeedablePronText('trên (tàu, xe, máy bay)')).toBe(true)
    expect(isSeedablePronText('có cồn; thuộc về người nghiện rượu')).toBe(true)
    expect(isSeedablePronText('có thể/có khả năng')).toBe(true)
  })

  it('từ chối chuỗi rỗng, quá dài và ký tự ngoài allowlist', () => {
    expect(isSeedablePronText('')).toBe(false)
    expect(isSeedablePronText('a'.repeat(101))).toBe(false)
    expect(isSeedablePronText('<script>')).toBe(false)
    expect(isSeedablePronText('a|b')).toBe(false)
  })
})

describe('parsePronunciationKey', () => {
  it('file tiếng Anh giữ dạng cũ `<word>-<voice>.mp3` → lang en-US', () => {
    expect(parsePronunciationKey('apple-Kore.mp3')).toEqual({
      word: 'apple',
      voice: 'Kore',
      lang: 'en-US',
    })
  })

  it('file tiếng Việt có hậu tố lang → tách đúng cả 3 phần', () => {
    expect(parsePronunciationKey(`${encodeURIComponent('bỏ rơi, từ bỏ')}-Puck-vi-VN.mp3`)).toEqual({
      word: 'bỏ rơi, từ bỏ',
      voice: 'Puck',
      lang: 'vi-VN',
    })
  })

  it('giọng Studio (chỉ tiếng Anh) vẫn tách đúng', () => {
    expect(parsePronunciationKey('apple-Studio-O.mp3')).toEqual({
      word: 'apple',
      voice: 'Studio-O',
      lang: 'en-US',
    })
  })

  it('file không hợp lệ → null', () => {
    expect(parsePronunciationKey('apple.mp3')).toBeNull()
    expect(parsePronunciationKey('apple-Kore.wav')).toBeNull()
  })
})

// `loadPatternTasks()` là hàm production dựng TOÀN BỘ tác vụ TTS (đọc mọi chunk bài hội thoại,
// mẫu câu Cụm từ, truyện trong apps/dhcb/public/data/) — chi phí thật, không phải việc thừa
// của test. Đo 2026-10-08 (changelog 0532): ca này 1,76 s chạy riêng · 1,95 s dưới đo coverage
// V8 · 2,88–3,80 s coverage + máy tải 16–25. Ngưỡng 10 s cũ (đặt 2026-09 khi cả file đo
// ~4,9 s) chỉ còn biên ~2,6 lần so với số đo dưới tải, và file này nằm trong nhóm đỏ giả của
// `test:coverage` toàn bộ trên máy tải 14–23 → nới 30 s cho riêng describe này.
describe('loadPatternTasks — truyện cổ tích/ngụ ngôn (stories)', { timeout: 30_000 }, () => {
  it('tạo đủ tác vụ truyện cổ tích/ngụ ngôn với giọng Gemini tương ứng', () => {
    const patternTasks = loadPatternTasks()
    const storyTasks = patternTasks.filter((t) => t.cat === 'stories')
    expect(storyTasks.length).toBeGreaterThan(0)
    // Có cả tiếng Anh và tiếng Việt
    expect(storyTasks.some((t) => t.lang === 'en-US')).toBe(true)
    expect(storyTasks.some((t) => t.lang === 'vi-VN')).toBe(true)
    // Giọng đều là giọng Gemini hợp lệ
    expect(storyTasks.every((t) => String(t.voice).startsWith('Gemini-'))).toBe(true)
  })
})
