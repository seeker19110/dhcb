// Test đường dùng chính `visemeTimelineFromAlignment` (alignment thật → timeline lưu cache) và các
// ca biên của hai hàm thuần mà `visemeTimeline.test.ts` chưa đi qua. Tách file riêng vì cần
// `vi.mock` eSpeak-ng (tiến trình ngoài) — không làm ảnh hưởng các test thuần ở file kia.
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ElevenAlignment } from './elevenLabsTts.js'
import type { Viseme } from './espeakPhonemes.js'

const wordVisemesFromEspeak = vi.fn<(words: string[], lang: string) => Promise<Viseme[][] | null>>()
vi.mock('./espeakPhonemes.js', () => ({
  wordVisemesFromEspeak: (words: string[], lang: string) => wordVisemesFromEspeak(words, lang),
}))

const { visemeTimelineFromAlignment, wordSpansFromAlignment, framesFromWordSpans } =
  await import('./visemeTimeline.js')

/** Alignment giả: mỗi ký tự chiếm đúng `step` giây liên tiếp nhau. */
function makeAlignment(text: string, step = 0.1): ElevenAlignment {
  const characters = [...text]
  return {
    characters,
    character_start_times_seconds: characters.map((_, i) => i * step),
    character_end_times_seconds: characters.map((_, i) => (i + 1) * step),
  }
}

beforeEach(() => {
  wordVisemesFromEspeak.mockReset()
})

describe('visemeTimelineFromAlignment — trả null = "không có timing thật", không phải lỗi', () => {
  it('alignment rỗng/chỉ khoảng trắng → null và KHÔNG gọi eSpeak (không tốn tiến trình ngoài)', async () => {
    expect(await visemeTimelineFromAlignment(makeAlignment('   '), 'en-US')).toBeNull()
    expect(wordVisemesFromEspeak).not.toHaveBeenCalled()
  })

  it('máy không có eSpeak-ng (trả null) → null', async () => {
    wordVisemesFromEspeak.mockResolvedValue(null)
    expect(await visemeTimelineFromAlignment(makeAlignment('xin chào'), 'vi-VN')).toBeNull()
  })

  it('eSpeak trả số từ lệch với alignment → null (không gán khẩu hình sai từ)', async () => {
    wordVisemesFromEspeak.mockResolvedValue([['AA']])
    expect(await visemeTimelineFromAlignment(makeAlignment('hi there'), 'en-US')).toBeNull()
  })

  it('mọi từ đều không có viseme → không có khung hình → null', async () => {
    wordVisemesFromEspeak.mockResolvedValue([[], []])
    expect(await visemeTimelineFromAlignment(makeAlignment('hm hm'), 'en-US')).toBeNull()
  })

  it('đường thường: gửi đúng từ + ngôn ngữ cho eSpeak, trả timeline có REST giữa hai từ', async () => {
    wordVisemesFromEspeak.mockResolvedValue([['PP', 'AA'], ['FF']])
    const frames = await visemeTimelineFromAlignment(makeAlignment('ba f'), 'en-US')
    expect(wordVisemesFromEspeak).toHaveBeenCalledWith(['ba', 'f'], 'en-US')
    expect(frames).toEqual([
      { viseme: 'PP', startMs: 0, endMs: 100 },
      { viseme: 'AA', startMs: 100, endMs: 200 },
      { viseme: 'REST', startMs: 200, endMs: 300 },
      { viseme: 'FF', startMs: 300, endMs: 400 },
    ])
  })

  it('ranh giới trần 4000 khung hình: đúng 4000 thì giữ, 4001 thì bỏ', async () => {
    // Một từ dài 4001 ms bắt đầu từ 0 (không có REST đầu câu) → số khung hình = số viseme.
    const alignment: ElevenAlignment = {
      characters: ['a'],
      character_start_times_seconds: [0],
      character_end_times_seconds: [4.001],
    }
    wordVisemesFromEspeak.mockResolvedValue([Array<Viseme>(4000).fill('AA')])
    expect(await visemeTimelineFromAlignment(alignment, 'en-US')).toHaveLength(4000)

    wordVisemesFromEspeak.mockResolvedValue([Array<Viseme>(4001).fill('AA')])
    expect(await visemeTimelineFromAlignment(alignment, 'en-US')).toBeNull()
  })
})

describe('wordSpansFromAlignment — mảng mốc thời gian ngắn hơn mảng ký tự (dữ liệu bẩn)', () => {
  it('thiếu mốc bắt đầu → 0; thiếu mốc kết thúc → lấy mốc bắt đầu (endMs không bao giờ < startMs)', () => {
    const spans = wordSpansFromAlignment({
      characters: ['a', 'b', ' ', 'c'],
      character_start_times_seconds: [0.5, 0.6],
      character_end_times_seconds: [0.6],
    })
    // "ab": ký tự 'b' thiếu mốc kết thúc → endSec = startSec của từ (0,5 s).
    // "c": thiếu cả hai mốc → 0..0.
    expect(spans).toEqual([
      { word: 'ab', startMs: 500, endMs: 500 },
      { word: 'c', startMs: 0, endMs: 0 },
    ])
  })
})

describe('framesFromWordSpans — từ không có viseme', () => {
  it('bỏ hẳn từ không có viseme: không thêm khung hình, không dời mốc khoảng lặng', () => {
    const frames = framesFromWordSpans(
      [
        { word: 'a', startMs: 0, endMs: 100 },
        { word: '—', startMs: 150, endMs: 200 },
        { word: 'b', startMs: 300, endMs: 400 },
      ],
      [['AA'], [], ['PP']],
    )
    // REST lấp trọn 100→300 vì từ giữa bị bỏ qua chứ không "chiếm" 150→200.
    expect(frames).toEqual([
      { viseme: 'AA', startMs: 0, endMs: 100 },
      { viseme: 'REST', startMs: 100, endMs: 300 },
      { viseme: 'PP', startMs: 300, endMs: 400 },
    ])
  })
})
