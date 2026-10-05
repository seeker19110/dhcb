// Tách một công thức ngữ pháp hai thứ tiếng thành các đoạn theo ngôn ngữ — WCAG 3.1.2 Language
// of Parts (audit 2026-09-30, C5).
//
// Công thức trong dữ liệu CEFR trộn hai thứ tiếng trong MỘT chuỗi, vd
// "S + am / is / are + (tính từ • danh từ • nơi chốn)": từ khoá tiếng Anh xen chỗ trống ghi bằng
// tiếng Việt. Gắn cả chuỗi `lang="en"` thì trình đọc màn hình đọc "tính từ" bằng giọng Anh, để
// nguyên thì đọc "am / is / are" bằng giọng Việt — nên phải gắn `lang` theo TỪNG ĐOẠN.
//
// Quy tắc: cắt theo các ký hiệu nối của công thức (+ • · / ( ) [ ] = , ; : ? " …); đoạn nào có
// chữ cái mang dấu tiếng Việt là `vi`, đoạn chỉ có chữ cái Latin không dấu là `en`, đoạn không
// có chữ cái (ký hiệu, "...") giữ nguyên, không gắn ngôn ngữ. Cắt ở ký hiệu chứ không ở từng từ vì
// nhiều từ tiếng Việt không có dấu ("danh từ" — "danh" không dấu) sẽ bị nhận nhầm là tiếng Anh;
// trong dữ liệu, chỗ trống tiếng Việt luôn đứng thành cụm riêng giữa hai ký hiệu.

export type PartLang = 'en' | 'vi'

export interface LangRun {
  text: string
  /** `undefined` = ký hiệu/khoảng trắng, kế thừa ngôn ngữ của phần tử cha. */
  lang?: PartLang
}

/** Chữ cái tiếng Việt mang dấu (kể cả đ/Đ). */
const VI_LETTER = /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i
const LATIN_LETTER = /[a-z]/i
/** Một cụm ký hiệu nối (kèm khoảng trắng hai bên) — phần được giữ nguyên, không gắn ngôn ngữ. */
const DELIMITER = /(\s*[+•·/()[\]=,;:?"“”…]+\s*)/
/** Cụm ký hiệu được phép gộp hai đoạn cùng ngôn ngữ ở hai bên: đúng MỘT ký hiệu nối. */
const JOINER = /^\s*[+•·/=,;:]\s*$/

function classify(segment: string): PartLang | undefined {
  if (VI_LETTER.test(segment)) return 'vi'
  if (LATIN_LETTER.test(segment)) return 'en'
  return undefined
}

/** Đẩy một đoạn vào danh sách, gộp với đoạn trước khi cùng ngôn ngữ (hoặc cùng không ngôn ngữ). */
function push(runs: LangRun[], text: string, lang: PartLang | undefined): void {
  if (!text) return
  const last = runs[runs.length - 1]
  if (last && last.lang === lang) {
    last.text += text
    return
  }
  runs.push(lang ? { text, lang } : { text })
}

export function splitLangRuns(text: string): LangRun[] {
  const runs: LangRun[] = []
  // `split` với nhóm bắt: phần tử ở vị trí LẺ là cụm ký hiệu nối, vị trí CHẴN là đoạn chữ.
  text.split(DELIMITER).forEach((part, i) => {
    if (!part) return
    if (i % 2 === 1) {
      push(runs, part, undefined)
      return
    }
    // Khoảng trắng đầu/cuối đoạn để ngoài phần tử có `lang` (gọn, không đổi cách hiển thị).
    const core = part.trim()
    if (!core) {
      push(runs, part, undefined)
      return
    }
    const lead = part.slice(0, part.length - part.trimStart().length)
    const trail = part.slice(part.trimEnd().length)
    push(runs, lead, undefined)
    push(runs, core, classify(core))
    push(runs, trail, undefined)
  })
  // Gộp "en + MỘT ký hiệu nối + en" thành một đoạn ("am / is / are") để không vỡ thành quá nhiều
  // phần tử. Không gộp qua ngoặc hay "…": ngoặc là ranh giới cụm, gộp qua sẽ ra đoạn lệch ngoặc.
  const merged: LangRun[] = []
  for (const run of runs) {
    const prev = merged[merged.length - 1]
    const prev2 = merged[merged.length - 2]
    if (run.lang && prev && !prev.lang && JOINER.test(prev.text) && prev2?.lang === run.lang) {
      prev2.text += prev.text + run.text
      merged.pop()
      continue
    }
    merged.push({ ...run })
  }
  return merged
}
