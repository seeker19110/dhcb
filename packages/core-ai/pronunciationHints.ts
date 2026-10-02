// packages/core-ai/pronunciationHints.ts — Gợi ý luyện âm cho người Việt theo CHỮ VIẾT của câu mẫu.
//
// Thay cho "GOP Lab" cũ (changelog 0484): bản đó đoán âm sai từ chính tả rồi gán "Điểm GOP" bằng
// công thức cứng (`92 - idx * 3`), không nghe giọng ai cả. Ở đây KHÔNG có con số nào: chỉ chỉ ra
// trong câu có âm nào người Việt hay đọc nhầm (lỗi do tiếng mẹ đẻ — L1) và mẹo đặt lưỡi/môi.
// Nhận diện theo chữ viết nên chỉ là GỢI Ý (vd "th" có thể là /θ/ hoặc /ð/) — giao diện nói rõ.
// Hàm thuần, không phụ thuộc Node: giao diện gọi trực tiếp, không qua server.

export interface PronunciationPattern {
  key: string
  targetIpa: string
  commonMistakeIpa: string
  diagnostic: string
  drillTip: string
}

export interface PronunciationHint extends PronunciationPattern {
  /** Các từ trong câu mẫu chứa âm này (giữ thứ tự xuất hiện, không lặp). */
  words: string[]
}

// Ma trận lỗi thường gặp của người Việt (L1 interference).
export const L1_PRONUNCIATION_PATTERNS: Record<string, PronunciationPattern> = {
  th_voiceless: {
    key: 'th_voiceless',
    targetIpa: '/θ/',
    commonMistakeIpa: '/t/',
    diagnostic: 'Hay đọc /θ/ thành /t/ (vd: "think" thành "tink").',
    drillTip: 'Đặt nhẹ đầu lưỡi giữa hai hàm răng rồi thổi hơi ra, dây thanh không rung.',
  },
  th_voiced: {
    key: 'th_voiced',
    targetIpa: '/ð/',
    commonMistakeIpa: '/d/',
    diagnostic: 'Hay đọc /ð/ thành /d/ hoặc "đ" (vd: "this" thành "đít", "they" thành "đây").',
    drillTip:
      'Đầu lưỡi giữa hai hàm răng như /θ/, nhưng rung dây thanh (đặt tay lên cổ để cảm nhận).',
  },
  ash: {
    targetIpa: '/æ/',
    key: 'ash',
    commonMistakeIpa: '/e/',
    diagnostic: 'Hay đọc /æ/ thành /e/ (vd: "bad" thành "bed", "man" thành "men").',
    drillTip: 'Hạ sâu quai hàm, kéo bè khoé môi sang hai bên.',
  },
  r: {
    key: 'r',
    targetIpa: '/r/',
    commonMistakeIpa: '/z/ hoặc /w/',
    diagnostic: 'Hay đọc /r/ thành "r" rung lưỡi kiểu tiếng Việt, hoặc thành /w/.',
    drillTip: 'Cong nhẹ đầu lưỡi lên phía vòm họng, KHÔNG chạm ngạc, môi hơi tròn.',
  },
  sh: {
    key: 'sh',
    targetIpa: '/ʃ/',
    commonMistakeIpa: '/s/',
    diagnostic: 'Hay đọc lẫn /ʃ/ ("she") với /s/ ("see").',
    drillTip: 'Với /ʃ/: chu môi ra trước, lưỡi lùi về sau hơn /s/, hơi thoát ra rộng.',
  },
  final_ks: {
    key: 'final_ks',
    targetIpa: '/ks/',
    commonMistakeIpa: '/k/',
    diagnostic: 'Hay nuốt /s/ ở cuối (vd: "six" thành "síc", "box" thành "bóc").',
    drillTip: 'Chặn hơi ở /k/ rồi xả ngay luồng hơi /s/ qua khe răng — đừng dừng ở /k/.',
  },
}

// Các từ thông dụng có "th" đọc là /ð/ (hữu thanh). Ngoài danh sách → coi là /θ/.
const VOICED_TH_WORDS = new Set([
  'the',
  'this',
  'that',
  'these',
  'those',
  'they',
  'them',
  'their',
  'theirs',
  'there',
  'then',
  'than',
  'though',
  'thus',
  'with',
  'without',
  'other',
  'another',
  'mother',
  'father',
  'brother',
  'weather',
  'whether',
  'together',
  'feather',
  'feathers',
  'leather',
  'rather',
  'either',
  'neither',
  'breathe',
  'clothes',
  'bathe',
  'smooth',
])

// Thứ tự hiển thị ổn định, theo thứ tự trong ma trận.
const PATTERN_ORDER = Object.keys(L1_PRONUNCIATION_PATTERNS)

/** Các khoá âm (trong ma trận) mà một từ (đã chữ thường, bỏ dấu câu) có thể chứa. */
export function patternKeysForWord(word: string): string[] {
  const keys: string[] = []
  if (word.includes('th')) keys.push(VOICED_TH_WORDS.has(word) ? 'th_voiced' : 'th_voiceless')
  // /æ/: từ một âm tiết có đúng một nguyên âm "a" đứng giữa phụ âm (bad, man, black, thank, that).
  if (/^[^aeiouy]*a[^aeiouwy]+$/.test(word) && !/ar$|ar[^aeiou]|all?$/.test(word)) keys.push('ash')
  if (/(^|[^aeiou])r[aeiouy]/.test(word)) keys.push('r')
  if (word.includes('sh')) keys.push('sh')
  if (/(x|ks|cks)$/.test(word)) keys.push('final_ks')
  return keys
}

/** Gợi ý luyện âm cho một câu: âm nào hay nhầm + các từ chứa âm đó. Câu không có âm nào → []. */
export function findPronunciationHints(sentence: string): PronunciationHint[] {
  const wordsByKey = new Map<string, string[]>()
  for (const raw of sentence.split(/\s+/)) {
    const shown = raw.replace(/[^A-Za-z']/g, '') // giữ hoa/thường như trong câu để hiển thị
    const word = shown.toLowerCase()
    if (!word) continue
    for (const key of patternKeysForWord(word)) {
      const list = wordsByKey.get(key) ?? []
      if (!list.some((w) => w.toLowerCase() === word)) list.push(shown)
      wordsByKey.set(key, list)
    }
  }
  return PATTERN_ORDER.filter((key) => wordsByKey.has(key)).map((key) => ({
    ...(L1_PRONUNCIATION_PATTERNS[key] as PronunciationPattern),
    words: wordsByKey.get(key) ?? [],
  }))
}
