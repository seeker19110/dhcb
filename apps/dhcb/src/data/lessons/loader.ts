// Loader cho dữ liệu "Bài học hội thoại" — các file chunk-*.json và index.json
// nằm trong /public/data/lessons/ và được tải bằng fetch() thay vì import.meta.glob.
// index.json (chỉ meta) được tải 1 lần; chunk chỉ tải khi người dùng bấm vào bài.
//
// [S09c, 2026-09-24 — spec §2.7] Ba lỗ hổng cũ đã vá:
//  1. Không kiểm HTTP status: 404/503 bị `r.json()` nuốt thành SyntaxError khó hiểu, hoặc tệ
//     hơn là trang lỗi HTML của proxy được coi như dữ liệu.
//  2. Nhận `chunk[meta.idx]` TRƯỚC khi kiểm id: chỉ mục lệch với chunk (deploy nửa chừng, cache
//     cũ) là mở NHẦM một bài khác mà không ai hay. Nay chỉ nhận bài có đúng `id`.
//  3. Lời hứa lỗi bị cache vĩnh viễn → nút "Thử lại" vô dụng. Nay lỗi thì xoá cache.
// Dữ liệu ngoài được kiểm bằng Zod (CLAUDE.md §4.1). Lỗi luôn là `LessonLoadError` có `kind`
// để giao diện phân biệt "mất mạng / máy chủ lỗi" (cho thử lại) với "mã bài không tồn tại".
// `zod/mini` thay bản đầy đủ (audit 2026-10-10, E4.1b): `preloadBrowse` nạp module này ngay sau
// khi đăng nhập (lúc trình duyệt rảnh) — bản đầy đủ sẽ kéo `vendor-zod` vào MỌI phiên đã đăng nhập.
import * as z from 'zod/mini'

const genderSchema = z.enum(['female', 'male'])
const speakerNameSchema = z.object({ vi: z.string(), en: z.string() })

const turnSchema = z.object({
  speaker: z.enum(['A', 'B']),
  en: z.string(),
  vi: z.string(),
})

const lessonMetaSchema = z.object({
  id: z.int().check(z.positive()),
  title: z.string(),
  situation: z.string(),
  turnCount: z.int().check(z.nonnegative()),
  speakerAGender: z.nullable(genderSchema),
  speakerBGender: z.nullable(genderSchema),
  chunk: z.int().check(z.nonnegative()),
  idx: z.int().check(z.nonnegative()),
})

const lessonSchema = z.object({
  id: z.int().check(z.positive()),
  title: z.string(),
  situation: z.string(),
  turns: z.array(turnSchema),
  speakerAGender: z.optional(genderSchema),
  speakerBGender: z.optional(genderSchema),
  speakerAName: z.optional(speakerNameSchema),
  speakerBName: z.optional(speakerNameSchema),
})

export type Turn = z.infer<typeof turnSchema>
export type LessonMeta = z.infer<typeof lessonMetaSchema>
export type SpeakerName = z.infer<typeof speakerNameSchema>
export type Lesson = z.infer<typeof lessonSchema>

/** Loại lỗi tải: `network` mất mạng · `http` máy chủ trả mã lỗi · `data` dữ liệu hỏng/thiếu bài. */
export type LessonLoadErrorKind = 'network' | 'http' | 'data'

export class LessonLoadError extends Error {
  readonly kind: LessonLoadErrorKind
  readonly status: number | undefined

  constructor(kind: LessonLoadErrorKind, message: string, status?: number) {
    super(message)
    this.name = 'LessonLoadError'
    this.kind = kind
    this.status = status
  }
}

// Tải một file JSON và phân loại lỗi — dùng chung cho index và chunk.
async function fetchJson(url: string): Promise<unknown> {
  let res: Response
  try {
    res = await fetch(url)
  } catch {
    throw new LessonLoadError('network', `Không kết nối được để tải ${url}`)
  }
  if (!res.ok) throw new LessonLoadError('http', `Tải ${url} lỗi HTTP ${res.status}`, res.status)
  try {
    return (await res.json()) as unknown
  } catch {
    throw new LessonLoadError('data', `${url} không phải JSON hợp lệ`)
  }
}

// Tải index ngay lần đầu (file nhỏ, chỉ meta). Chỉ giữ lời hứa THÀNH CÔNG.
let _indexPromise: Promise<LessonMeta[]> | null = null
export function loadIndex(): Promise<LessonMeta[]> {
  if (!_indexPromise) {
    const p = fetchJson('/data/lessons/index.json').then((raw) => {
      const parsed = z.array(lessonMetaSchema).safeParse(raw)
      if (!parsed.success) throw new LessonLoadError('data', 'Chỉ mục bài học sai định dạng')
      return parsed.data
    })
    _indexPromise = p
    // Lỗi → bỏ cache để lần "Thử lại" sau gọi mạng thật (không trả lại đúng lời hứa hỏng).
    p.catch(() => {
      if (_indexPromise === p) _indexPromise = null
    })
  }
  return _indexPromise
}

// Xuất INDEX để tương thích ngược với code cũ dùng `import { INDEX }`.
// Giá trị này là mảng rỗng cho đến khi loadIndex() resolve.
export const INDEX: LessonMeta[] = []
loadIndex().then(
  (d) => {
    INDEX.splice(0, INDEX.length, ...d)
  },
  // Nạp sẵn lúc import: lỗi ở đây không có ai xử lý → nuốt để không thành unhandled rejection;
  // trang sẽ gọi lại loadIndex() và hiện lỗi + nút thử lại của riêng nó.
  () => undefined,
)

// Chunk giữ dạng thô (chưa kiểm từng bài): chỉ bài được MỞ mới qua Zod — không tốn công
// kiểm cả 10 bài để đọc một bài.
const cache = new Map<number, unknown[]>()

function chunkKey(n: number): string {
  return `chunk-${String(n).padStart(3, '0')}.json`
}

// Tải 1 chunk (nhiều bài). Chỉ cache khi tải thành công.
export async function loadChunk(n: number): Promise<unknown[]> {
  const cached = cache.get(n)
  if (cached) return cached
  const raw = await fetchJson(`/data/lessons/${chunkKey(n)}`)
  if (!Array.isArray(raw)) throw new LessonLoadError('data', `${chunkKey(n)} không phải danh sách`)
  cache.set(n, raw)
  return raw
}

function coId(x: unknown, id: number): boolean {
  return typeof x === 'object' && x !== null && (x as { id?: unknown }).id === id
}

// Tải đầy đủ 1 bài (gồm mọi turn) dựa trên meta. Ưu tiên vị trí `idx` nhưng CHỈ khi id khớp.
export async function loadLesson(meta: LessonMeta): Promise<Lesson> {
  const chunk = await loadChunk(meta.chunk)
  const byIdx = chunk[meta.idx]
  const raw = coId(byIdx, meta.id) ? byIdx : chunk.find((l) => coId(l, meta.id))
  if (raw === undefined) {
    // Chunk trong cache có thể là bản CŨ (deploy nửa chừng: chỉ mục mới, chunk cũ) → bỏ cache để
    // nút "Thử lại" tải lại chunk thật từ mạng thay vì lặp lại đúng lỗi này mãi.
    cache.delete(meta.chunk)
    throw new LessonLoadError('data', `Không có bài ${meta.id} trong ${chunkKey(meta.chunk)}`)
  }
  const parsed = lessonSchema.safeParse(raw)
  if (!parsed.success) throw new LessonLoadError('data', `Bài ${meta.id} sai định dạng`)
  return parsed.data
}
