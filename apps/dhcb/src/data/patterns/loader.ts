// Loader cho dữ liệu "Cụm từ theo chủ thể" — các file chunk-*.json và index.json
// nằm trong /public/data/patterns/ và được tải bằng fetch() thay vì import.meta.glob.
// index.json (chỉ meta) được tải 1 lần; chunk chỉ tải khi cần (lazy load).

export interface Sentence {
  en: string
  vi: string
}
export interface SubjectMeta {
  starter: string
  category: string
  color: string
  count: number
  chunk: number
  idx: number
}
export interface Subject {
  starter: string
  category: string
  color: string
  sentences: Sentence[]
}

// [changelog 0525] Bản cũ: `fetch(...).then((r) => r.json())` không kiểm `res.ok`, giữ luôn lời
// hứa BỊ TỪ CHỐI trong cache và cache cả body lỗi như dữ liệu. Mạng chập một lần là trang Nghe /
// Câu thông dụng kẹt skeleton hoặc hiện "không có kết quả" tới khi tải lại cả trang. Nay: kiểm
// HTTP + hình dạng, chỉ giữ cache khi THÀNH CÔNG, để nút "Thử lại" trên trang tải lại được thật.

// Tải một file JSON: lỗi mạng giữ nguyên lỗi gốc (`Failed to fetch` — `thongDiepLoiThanThien`
// dịch được), HTTP lỗi ném `HTTP <mã>`.
async function fetchJson(url: string): Promise<unknown> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return (await res.json()) as unknown
}

const LOI_DINH_DANG = 'Dữ liệu cụm từ không đúng định dạng — thử lại sau ít phút.'

// Tải index (file nhỏ, chỉ meta) một lần. Chỉ giữ lời hứa THÀNH CÔNG.
let _indexPromise: Promise<SubjectMeta[]> | null = null
export function loadIndex(): Promise<SubjectMeta[]> {
  if (!_indexPromise) {
    const p = fetchJson('/data/patterns/index.json').then((raw) => {
      if (!Array.isArray(raw)) throw new Error(LOI_DINH_DANG)
      return raw as SubjectMeta[]
    })
    _indexPromise = p
    void p.catch(() => {
      if (_indexPromise === p) _indexPromise = null
    })
  }
  return _indexPromise
}

// Nạp sẵn ngay khi module được import (preloadBrowse). Lỗi ở đây không có ai xử lý → nuốt để
// không thành unhandled rejection; trang gọi lại loadIndex() và tự hiện lỗi + nút Thử lại.
loadIndex().catch(() => undefined)

const cache = new Map<number, Subject[]>()

function chunkKey(n: number) {
  return `chunk-${String(n).padStart(3, '0')}.json`
}

// Tải 1 chunk (nhiều chủ thể). Chỉ cache khi tải thành công và đúng là một danh sách.
export async function loadChunk(n: number): Promise<Subject[]> {
  const cached = cache.get(n)
  if (cached) return cached
  const raw = await fetchJson(`/data/patterns/${chunkKey(n)}`)
  if (!Array.isArray(raw)) throw new Error(LOI_DINH_DANG)
  const data = raw as Subject[]
  cache.set(n, data)
  return data
}

// Tải đầy đủ 1 chủ thể dựa trên meta. Ném lỗi khi tải hỏng — caller hiện lỗi cho người học.
export async function loadSubject(meta: SubjectMeta): Promise<Subject | null> {
  const chunk = await loadChunk(meta.chunk)
  return chunk[meta.idx] ?? chunk.find((s) => s.starter === meta.starter) ?? null
}
