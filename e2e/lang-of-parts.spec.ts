import { test, expect, type Page } from '@playwright/test'
import { mockLogin } from './helpers/auth'
import { muteTts } from './helpers/tts'

// Cổng (c) của audit UI/UX 2026-09-30 (mục C5 + mục 11) — WCAG 3.1.1 Language of Page (A) và
// 3.1.2 Language of Parts (AA). axe chỉ kiểm `<html lang>` CÓ và HỢP LỆ (`html-has-lang`,
// `valid-lang`), KHÔNG biết một câu tiếng Anh đang nằm trong vùng `lang="vi"` — khi đó trình
// đọc màn hình đọc câu tiếng Anh bằng giọng và luật phát âm tiếng Việt (lỗi nặng với app học
// ngoại ngữ).
//
// HEURISTIC (rẻ, không cần mô hình nhận diện ngôn ngữ):
// - Duyệt mọi phần tử HIỂN THỊ, lấy CHỮ RIÊNG của nó (các text node con trực tiếp — không gộp
//   chữ của phần tử con, để mỗi khối chữ chỉ bị đếm một lần ở đúng phần tử chứa nó).
// - "Khối tiếng Anh": không có chữ cái mang dấu tiếng Việt, ≥ MIN_WORDS từ, và chứa ≥
//   MIN_EN_FUNCTION_WORDS từ chức năng tiếng Anh KHÁC NHAU (the, is, you, …). Đòi từ chức năng
//   để không bắt nhầm tên riêng/thuật ngữ đứng lẻ ("IELTS", "Free", "A1", "VIP").
// - "Khối tiếng Việt": ≥ MIN_VI_WORDS từ có chữ cái mang dấu tiếng Việt.
// - Ngôn ngữ hiệu lực của khối = `closest('[lang]')` (đúng cách trình đọc màn hình kế thừa).
//   Vi phạm khi khối tiếng Anh có ngôn ngữ hiệu lực KHÔNG phải `en`, hoặc khối tiếng Việt có
//   ngôn ngữ hiệu lực KHÔNG phải `vi`.
//
// NGƯỠNG: MAX_VIOLATIONS = 0 trên mỗi trang. Đo trước khi sửa (2026-10-04, code `main` 7081d8a):
// bài hội thoại lesson=1 chiều A có hàng chục khối tiếng Anh trong vùng lang=vi (audit đếm 20
// câu), /lo-trinh-hoc/a1 5 mẫu ngữ pháp, danh sách truyện 8 tiêu đề, /learn-vietnamese mọi đoạn
// (cả trang tiếng Anh dưới `<html lang="vi">`). Số đo thật ghi ở changelog 0490.
// Heuristic có thể BỎ SÓT (câu tiếng Anh quá ngắn, không có từ chức năng) — đó là giới hạn chấp
// nhận được của cổng rẻ; nó KHÔNG được báo nhầm, nên ngưỡng giữ ở 0.

const MIN_WORDS = 3
const MIN_EN_FUNCTION_WORDS = 2
const MIN_VI_WORDS = 2
const MAX_VIOLATIONS = 0

/** Từ chức năng tiếng Anh rất thông dụng — gần như không xuất hiện trong chữ tiếng Việt. */
const EN_FUNCTION_WORDS = [
  'the',
  'a',
  'an',
  'is',
  'are',
  'am',
  'was',
  'were',
  'be',
  'you',
  'your',
  'i',
  "i'm",
  'my',
  'me',
  'we',
  'our',
  'he',
  'she',
  'it',
  "it's",
  'they',
  'this',
  'that',
  'what',
  'how',
  'where',
  'when',
  'do',
  'does',
  'did',
  "don't",
  'have',
  'has',
  'to',
  'of',
  'and',
  'in',
  'on',
  'for',
  'with',
  'can',
  'would',
  'please',
  'there',
  'here',
]

interface Violation {
  kind: 'en' | 'vi'
  lang: string
  text: string
}

/** Đo trong trình duyệt: trả về danh sách khối chữ nằm sai vùng ngôn ngữ. */
async function findLangViolations(page: Page): Promise<Violation[]> {
  return page.evaluate(
    ({ functionWords, minWords, minEn, minVi }) => {
      const fw = new Set(functionWords)
      // Chữ cái tiếng Việt mang dấu (kể cả đ) — đủ để phân biệt với chữ tiếng Anh thuần ASCII.
      const viLetter = /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i
      const SKIP = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE', 'CODE', 'PRE', 'KBD', 'SVG'])
      const out: Violation[] = []
      for (const el of Array.from(document.body.querySelectorAll<HTMLElement>('*'))) {
        if (SKIP.has(el.tagName.toUpperCase())) continue
        if (el.closest('[aria-hidden="true"], code, pre, svg')) continue
        if (!el.checkVisibility()) continue
        const own = Array.from(el.childNodes)
          .filter((n) => n.nodeType === Node.TEXT_NODE)
          .map((n) => n.textContent ?? '')
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim()
        if (!own) continue
        const words = own.toLowerCase().match(/[\p{L}']+/gu) ?? []
        const lang = (el.closest('[lang]')?.getAttribute('lang') ?? '').toLowerCase()
        const isVi = (l: string) => l === 'vi' || l.startsWith('vi-')
        const isEn = (l: string) => l === 'en' || l.startsWith('en-')
        const viWords = words.filter((w) => viLetter.test(w)).length
        if (viWords === 0) {
          const en = new Set(words.filter((w) => fw.has(w)))
          if (words.length >= minWords && en.size >= minEn && !isEn(lang)) {
            out.push({ kind: 'en', lang, text: own.slice(0, 80) })
          }
        } else if (viWords >= minVi && !isVi(lang)) {
          out.push({ kind: 'vi', lang, text: own.slice(0, 80) })
        }
      }
      return out
    },
    {
      functionWords: EN_FUNCTION_WORDS,
      minWords: MIN_WORDS,
      minEn: MIN_EN_FUNCTION_WORDS,
      minVi: MIN_VI_WORDS,
    },
  )
}

function report(path: string, v: Violation[]): string {
  const lines = v.map((x) => `  [${x.kind} trong lang="${x.lang}"] ${x.text}`)
  return `${path}: ${v.length} khối chữ sai vùng ngôn ngữ (ngưỡng ${MAX_VIOLATIONS})\n${lines.join('\n')}`
}

interface PageCase {
  path: string
  /** Ngôn ngữ giao diện của người dùng giả (quyết định `<html lang>`). */
  uiLang: 'vi' | 'en'
  /** Chiều học môn Tiếng Anh (A: người Việt học Anh · B: người nước ngoài học Việt). */
  direction: 'A' | 'B'
  /**
   * Chờ phần tử NỘI DUNG này hiện ra rồi mới đo — trang tải dữ liệu không đồng bộ, chờ `h1` là
   * đo lúc danh sách còn rỗng và xanh giả (đã gặp thật: danh sách truyện ở 1440px).
   */
  ready: string
  /** `<html lang>` mong đợi khi trang hiển thị. */
  htmlLang: 'vi' | 'en'
}

const CASES: PageCase[] = [
  // Bài hội thoại — lượt thoại tiếng Anh (chiều A) phải là lang="en".
  {
    path: '/goc-hoc-tap/english/bai-hoc?lesson=1',
    uiLang: 'vi',
    direction: 'A',
    ready: '#luot-1',
    htmlLang: 'vi',
  },
  // Chiều B: giao diện tiếng Anh, lượt thoại tiếng Việt phải là lang="vi".
  {
    path: '/goc-hoc-tap/english/bai-hoc?lesson=1',
    uiLang: 'en',
    direction: 'B',
    ready: '#luot-1',
    htmlLang: 'en',
  },
  // Dòng công thức ngữ pháp (font-mono) của unit đầu.
  {
    path: '/lo-trinh-hoc/a1',
    uiLang: 'vi',
    direction: 'A',
    ready: 'p.font-mono',
    htmlLang: 'vi',
  },
  {
    path: '/goc-hoc-tap/english/truyen',
    uiLang: 'vi',
    direction: 'A',
    // Tiêu đề lớn của thẻ truyện (StoryCard).
    ready: 'button p.line-clamp-2',
    htmlLang: 'vi',
  },
  // Landing cho người nước ngoài — cả trang tiếng Anh, kể cả khi giao diện người dùng là vi.
  { path: '/learn-vietnamese', uiLang: 'vi', direction: 'A', ready: 'h1', htmlLang: 'en' },
]

test.describe('ngôn ngữ trang và ngôn ngữ của đoạn (WCAG 3.1.1 + 3.1.2, audit C5)', () => {
  // Hai bề rộng: 1440px (thanh bên desktop) và 390px (header + thanh điều hướng đáy) — mỗi khổ
  // hiện một bộ "khung" giao diện khác nhau nên phải đo cả hai.
  for (const width of [1440, 390]) {
    for (const c of CASES) {
      test(`${width}px ${c.path} · giao diện ${c.uiLang} · chiều ${c.direction}`, async ({
        page,
      }) => {
        await page.setViewportSize({ width, height: 900 })
        await muteTts(page)
        await mockLogin(page, c.uiLang, 'blue-sky')
        await page.addInitScript((d) => localStorage.setItem('et_direction', d), c.direction)
        await page.goto(c.path, { waitUntil: 'domcontentloaded' })
        await expect(page.locator(c.ready).first()).toBeVisible({ timeout: 30_000 })
        // soft: vẫn đo tiếp khối chữ để báo đủ cả hai loại lỗi trong một lần chạy.
        await expect.soft(page.locator('html')).toHaveAttribute('lang', c.htmlLang)
        const violations = await findLangViolations(page)
        expect(violations.length, report(c.path, violations)).toBeLessThanOrEqual(MAX_VIOLATIONS)
      })
    }
  }
})
