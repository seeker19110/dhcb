// Loader cho Truyện cổ tích / Ngụ ngôn — tải từ /public/data/stories/ bằng fetch(),
// theo đúng phong cách data/patterns/loader.ts và data/dialoguesLoader.ts.
// Nội dung truyện KHÔNG import tĩnh vào bundle — chỉ tải khi người dùng mở trang/truyện.

export type { StoryKind, StoryLine, StorySource, StoryMeta, Story } from './index'
import type { StoryMeta, Story } from './index'

// [changelog 0525] Bản cũ nuốt mọi lỗi: index lỗi → trả `[]` (trang hiện "chưa có truyện"),
// truyện lỗi mạng/5xx → trả `null` (trang hiện "không tìm thấy truyện" và 5xx còn bị CACHE mãi).
// Người học tưởng nội dung bị xoá. Nay: lỗi thật thì NÉM để trang hiện lỗi + Thử lại; chỉ 404
// mới là "không có truyện này". Không cache lời hứa thất bại.

// Tải index.json (chỉ meta, không có nội dung) — cache promise THÀNH CÔNG, chỉ tải 1 lần.
let _indexPromise: Promise<StoryMeta[]> | null = null
export function loadStoryIndex(): Promise<StoryMeta[]> {
  if (!_indexPromise) {
    const p = fetch('/data/stories/index.json').then(async (r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      const raw: unknown = await r.json()
      if (!Array.isArray(raw)) throw new Error('Danh sách truyện không đúng định dạng.')
      return raw as StoryMeta[]
    })
    _indexPromise = p
    void p.catch(() => {
      if (_indexPromise === p) _indexPromise = null // lần gọi sau tải lại, không kẹt lỗi cũ
    })
  }
  return _indexPromise
}

// Cache nội dung từng truyện theo id — tránh tải lại khi mở lại truyện đã xem.
const storyCache = new Map<string, Promise<Story | null>>()

/**
 * Tải nội dung đầy đủ 1 truyện. `null` CHỈ khi truyện không tồn tại (404, hoặc catch-all SPA trả HTML — cache lại).
 * Lỗi mạng / HTTP khác / JSON hỏng thì NÉM (không cache) để trang phân biệt "lỗi tải" với
 * "không có truyện".
 */
export function loadStory(id: string): Promise<Story | null> {
  let promise = storyCache.get(id)
  if (!promise) {
    const p = fetch(`/data/stories/${id}.json`).then(async (r) => {
      if (r.status === 404) return null
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      // Id lạ: máy chủ KHÔNG trả 404 mà rơi vào catch-all SPA → `index.html` 200 (xem
      // apps/server/src/server.ts). Không phải JSON = không có truyện này, như 404.
      if (!(r.headers.get('content-type') ?? '').includes('json')) return null
      return (await r.json()) as Story
    })
    promise = p
    storyCache.set(id, p)
    void p.catch(() => {
      if (storyCache.get(id) === p) storyCache.delete(id)
    })
  }
  return promise
}
