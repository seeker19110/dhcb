// ──────────────────────────────────────────────────────────────────────────
// TEST BẤT BIẾN cho CHẤT LƯỢNG MỤC TỪ VỰNG.
//
// Vì sao có (2026-09-14): audit vòng `cefr-b2-noun-63` phát hiện người học đang
// được dạy những thứ KHÔNG PHẢI từ tiếng Anh — `los` ("thường thấy trong tên địa
// danh, ví dụ Los Angeles"), `des`, `kong`, `angeles`… Chúng lọt vào lộ trình vì
// các vòng `cefr-*` SINH TỰ ĐỘNG từ từ điển (`scripts/archive/gen-a1b2-extra-vocab.ts`
// đọc `public/data/dictionary/chunk-*.json` lọc theo `level`) — rác ở từ điển là
// rác hiện thẳng ra bài học. Tệ nhất: `des` nằm ở bậc A1, tức bài học đầu tiên.
//
// Hai bất biến dưới đây canh ĐÚNG lớp lỗi đó, ở ĐÚNG tầng nó sinh ra (từ điển),
// nên sinh lại vòng cũng không mang rác về được.
// ──────────────────────────────────────────────────────────────────────────
import { describe, it, expect } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { FOUNDATION } from './curriculum'

const DICT_DIR = path.resolve(process.cwd(), 'apps/dhcb/public/data/dictionary')

interface DictRow {
  word: string
  pos?: string
  vi?: string
  ex_en?: string
}

const dict: DictRow[] = fs
  .readdirSync(DICT_DIR)
  .filter((f) => f.startsWith('chunk-') && f.endsWith('.json'))
  .flatMap((f) => JSON.parse(fs.readFileSync(path.join(DICT_DIR, f), 'utf8')) as DictRow[])

/**
 * Các mục ĐÃ BỊ GỠ 2026-09-14 — không được quay lại.
 * 8 mục đầu là MẢNH của tên riêng (không phải danh từ tiếng Anh); `netsurfer` là
 * biến thể chính tả trùng với `net surfer` đã có; `ios` là tên hệ điều hành viết
 * thường, không phải từ vựng để học.
 */
const DA_GO = [
  'angeles',
  'costa',
  'des',
  'hong',
  'kong',
  'las',
  'los',
  'york',
  'netsurfer',
  'ios',
  // Gỡ 2026-09-15 (đợt vệ sinh dữ liệu sau rà thang bậc): chữ số La Mã duy nhất trong
  // 41 mục `num`, là ký hiệu đánh số chứ không phải mục từ vựng để học.
  'iii',
]

/**
 * Dấu hiệu một mục TỰ NHẬN nó không phải từ tiếng Anh độc lập: phần nghĩa tiếng
 * Việt nói nó chỉ là mảnh của một tên riêng. Bắt theo LỜI GIẢI NGHĨA chứ không
 * theo danh sách từ, nên mục rác kiểu mới cũng bị chặn.
 */
const MO_TA_LA_MANH_TEN_RIENG =
  /thường thấy trong tên|tên địa danh|một phần của tên|viết tắt của tên/i

describe('Chất lượng mục từ vựng (từ điển là nguồn của mọi vòng cefr-* sinh tự động)', () => {
  it('CO_DU_LIEU — đọc được từ điển', () => {
    expect(dict.length).toBeGreaterThan(10_000)
  })

  it('KHONG_CO_MANH_TEN_RIENG — không mục nào tự nhận chỉ là mảnh của tên riêng', () => {
    const loi = dict
      .filter((e) => MO_TA_LA_MANH_TEN_RIENG.test(e.vi ?? ''))
      .map((e) => `${e.word} — "${e.vi}"`)
    expect(
      loi,
      `Đây KHÔNG phải từ tiếng Anh để học, và vòng cefr-* sinh thẳng từ từ điển nên chúng sẽ hiện ra trong bài học:\n${loi.join('\n')}`,
    ).toEqual([])
  })

  it('KHONG_MANG_LAI_MUC_DA_GO — các mục đã gỡ không quay lại', () => {
    const co = new Set(dict.map((e) => e.word.trim().toLowerCase()))
    const quayLai = DA_GO.filter((w) => co.has(w))
    expect(quayLai, `mục đã gỡ 2026-09-14 xuất hiện lại: ${quayLai.join(', ')}`).toEqual([])
  })

  it('CAU_VI_DU_KHONG_DUNG_CHUNG (từ điển) — mỗi câu ví dụ chỉ minh hoạ MỘT mục từ', () => {
    const trung = cauViDuDungChung(dict.map((e) => ({ word: e.word, pos: e.pos, ex_en: e.ex_en })))
    expect(trung, `${GOI_Y_SUA}\n${trung.join('\n')}`).toEqual([])
  })

  it('CAU_VI_DU_KHONG_DUNG_CHUNG (vòng từ vựng) — kể cả giữa vòng thủ công và vòng cefr-*', () => {
    const trung = cauViDuDungChung(FOUNDATION.flatMap((c) => c.words))
    expect(trung, `${GOI_Y_SUA}\n${trung.join('\n')}`).toEqual([])
  })
})

// ──────────────────────────────────────────────────────────────────────────
// F11 (audit 2026-09-14, trả ở docs/changelog/0524): cùng MỘT câu ví dụ từng được dùng
// cho nhiều mục từ khác nhau ("Please sit down." vừa cho `please`, `down`, vừa cho `sit`)
// — người học thấy hai từ khác nhau minh hoạ bằng đúng một câu, và câu đó thường chỉ
// minh hoạ đúng một trong hai. Đo lúc trả: 39 câu / 79 mục trong từ điển; 35 câu trong
// các vòng từ vựng (21 câu có dính vòng thủ công trong `curriculum.ts`).
//
// Khoá so sánh là (từ viết thường, từ loại): cùng một mục từ lặp ở nhiều chunk/vòng thì
// KHÔNG tính là dùng chung. Ngoại lệ phải ghi TƯỜNG MINH ở đây kèm lý do — hiện không có.
// ──────────────────────────────────────────────────────────────────────────
const NGOAI_LE_DUNG_CHUNG: ReadonlySet<string> = new Set<string>([])

const GOI_Y_SUA =
  'Câu ví dụ dùng chung cho nhiều mục từ — giữ câu ở mục nó minh hoạ đúng nhất, viết câu MỚI cho mục còn lại. ' +
  'Sửa từ điển xong chạy: npx tsx scripts/archive/sync-vocab-from-dictionary.ts && npx tsx scripts/archive/gen-curriculum-json.ts'

interface MucCoViDu {
  word: string
  pos?: string
  ex_en?: string
}

/** Trả về danh sách câu ví dụ đang được ≥ 2 mục từ KHÁC nhau dùng chung (rỗng = sạch). */
function cauViDuDungChung(rows: readonly MucCoViDu[]): string[] {
  const theoCau = new Map<string, Set<string>>()
  for (const r of rows) {
    const cau = (r.ex_en ?? '').trim().replace(/\s+/g, ' ').toLowerCase()
    if (cau === '' || NGOAI_LE_DUNG_CHUNG.has(cau)) continue
    const muc = `${r.word.trim().toLowerCase()} (${r.pos ?? '?'})`
    const tap = theoCau.get(cau) ?? new Set<string>()
    tap.add(muc)
    theoCau.set(cau, tap)
  }
  return [...theoCau]
    .filter(([, tap]) => tap.size >= 2)
    .map(([cau, tap]) => `"${cau}" ← ${[...tap].sort().join(', ')}`)
}
