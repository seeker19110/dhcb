// src/lib/dataPrecache.ts — Tải DẦN toàn bộ dữ liệu tĩnh (/data/*.json) về máy để dùng
// OFFLINE, và TỰ CẬP NHẬT khi server đổi.
//
// Cách hoạt động:
//  1. Tải public/data/manifest.json (luôn lấy bản mới — service worker không cache file này).
//     Manifest liệt kê mọi file + hash nội dung (xem scripts/gen-data-manifest.mjs).
//  2. So với "bản đồ đã tải" lưu trong localStorage: file nào MỚI hoặc ĐỔI HASH thì xếp hàng.
//  3. Tải DẦN từng file một, ưu tiên lúc CPU rảnh (requestIdleCallback) để không giật khi
//     người dùng đang nghe hội thoại / thao tác. Ghi thẳng vào Cache Storage của service
//     worker (cùng tên 'gia-su-data') nên lần sau mở offline là có ngay.
//  4. Lưu tiến độ sau MỖI file → đóng/mở lại app vẫn tải tiếp chỗ dang dở cho tới khi xong.
//
// Chỉ chạy ở bản build thật (PROD) vì cần service worker để cache bền. Dev không cần offline.
//
// [2026-10-05, audit M14] KHÔNG còn tự chạy cho mọi người lúc mở app: `DataPrecacheGate` chỉ gọi
// startDataPrecache() khi chính sách ở `offlineDownload.ts` cho phép (đã đăng nhập + đã học ≥ 1
// phiên + công tắc ở Cài đặt bật + không Save-Data), và gọi stopDataPrecache() khi điều kiện mất.

const MANIFEST_URL = '/data/manifest.json'
// PHẢI khớp tên DATA_CACHE trong public/sw.js (cache dữ liệu KHÔNG bị xoá mỗi lần deploy).
const DATA_CACHE = 'gia-su-data'
const MAP_KEY = 'et_data_cached_v1' // { [path]: hash } các file đã tải xong
const DONE_KEY = 'et_data_precache_done' // version đã tải đủ toàn bộ

interface ManifestFile {
  path: string
  hash: string
  size: number
}
interface Manifest {
  version: string
  totalBytes: number
  files: ManifestFile[]
}

// Thế hệ lượt tải: start tăng số này; vòng tải so số của mình với số hiện tại sau mỗi file —
// lệch nhau nghĩa là đã bị dừng (stopDataPrecache) hoặc một lượt mới thay thế → thoát êm.
let generation = 0
let running = false

// ── Bản đồ "đã tải" trong localStorage ──────────────────────────────────────
function loadMap(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(MAP_KEY) || '{}')
  } catch {
    return {}
  }
}
function saveMap(map: Record<string, string>): void {
  try {
    localStorage.setItem(MAP_KEY, JSON.stringify(map))
  } catch {
    /* hết quota — bỏ qua */
  }
}

// ── Tiến độ (cho UI tuỳ chọn) ───────────────────────────────────────────────
export interface PrecacheProgress {
  done: number
  total: number
  bytesDone: number
  bytesTotal: number
}
let progress: PrecacheProgress = { done: 0, total: 0, bytesDone: 0, bytesTotal: 0 }
// Tên sự kiện tiến độ (detail: PrecacheProgress) — Cài đặt nghe để cập nhật "đã tải X MB".
export const PRECACHE_PROGRESS_EVENT = 'data-precache-progress'
function emitProgress() {
  window.dispatchEvent(new CustomEvent(PRECACHE_PROGRESS_EVENT, { detail: { ...progress } }))
}

// Chờ tới lúc CPU rảnh (hoặc tối đa `timeout`ms) — giúp tải nền không tranh tài nguyên.
function idle(timeout = 2000): Promise<void> {
  return new Promise((resolve) => {
    const ric = (
      window as unknown as {
        requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => void
      }
    ).requestIdleCallback
    if (ric) ric(() => resolve(), { timeout })
    else setTimeout(resolve, 300)
  })
}

// Chờ có mạng trở lại (khi đang offline thì dừng tải, online lại thì tiếp).
function waitOnline(): Promise<void> {
  if (navigator.onLine) return Promise.resolve()
  return new Promise((resolve) => {
    const on = () => {
      window.removeEventListener('online', on)
      resolve()
    }
    window.addEventListener('online', on)
  })
}

// Chờ trang tải xong (sự kiện `load`) — tải nền không tranh băng thông với lần vẽ đầu.
function waitPageLoaded(): Promise<void> {
  if (document.readyState === 'complete') return Promise.resolve()
  return new Promise((resolve) => window.addEventListener('load', () => resolve(), { once: true }))
}

// Bắt đầu tải nền. Idempotent: đang chạy thì không mở lượt thứ hai.
export async function startDataPrecache(): Promise<void> {
  if (running) return
  // Cần Cache Storage (service worker) để lưu bền. Không có thì bỏ qua.
  if (!('caches' in window)) return
  running = true
  const myGen = ++generation
  try {
    await waitPageLoaded()
    if (myGen === generation) await runPrecache(myGen)
  } catch {
    // Lỗi mạng/khác — lần sau đủ điều kiện sẽ thử lại tiếp từ chỗ dang dở.
  } finally {
    if (myGen === generation) running = false
  }
}

// Dừng lượt tải đang chạy (tắt công tắc ở Cài đặt / đăng xuất). File đã tải GIỮ NGUYÊN trong
// cache — vẫn dùng được offline; bật lại thì chỉ tải tiếp phần còn thiếu.
export function stopDataPrecache(): void {
  generation++
  running = false
}

// Tóm tắt cho Cài đặt: tổng dung lượng bộ dữ liệu + phần ĐÃ tải trên máy này (theo bản đồ hash
// trong localStorage — ước lượng, không mở Cache Storage để đếm từng file).
export interface DataPackSummary {
  totalBytes: number
  cachedBytes: number
  fileCount: number
}

export async function fetchDataPackSummary(): Promise<DataPackSummary> {
  const res = await fetch(MANIFEST_URL, { cache: 'no-store' })
  if (!res.ok) throw new Error(`manifest HTTP ${res.status}`)
  const manifest = (await res.json()) as Manifest
  const map = loadMap()
  const cachedBytes = manifest.files.reduce((s, f) => (map[f.path] === f.hash ? s + f.size : s), 0)
  return { totalBytes: manifest.totalBytes, cachedBytes, fileCount: manifest.files.length }
}

async function runPrecache(myGen: number): Promise<void> {
  // Lấy manifest MỚI (no-store + bỏ qua service worker cache).
  const res = await fetch(MANIFEST_URL, { cache: 'no-store' })
  if (!res.ok) return
  const manifest = (await res.json()) as Manifest

  const map = loadMap()
  const cache = await caches.open(DATA_CACHE)

  // Xếp hàng các file MỚI hoặc ĐỔI HASH. File đã đúng hash + còn trong cache → bỏ qua.
  const queue: ManifestFile[] = []
  for (const f of manifest.files) {
    const url = '/' + f.path
    if (map[f.path] === f.hash && (await cache.match(url))) continue
    queue.push(f)
  }

  progress = {
    done: manifest.files.length - queue.length,
    total: manifest.files.length,
    bytesDone: manifest.totalBytes - queue.reduce((s, f) => s + f.size, 0),
    bytesTotal: manifest.totalBytes,
  }
  emitProgress()

  if (queue.length === 0) {
    localStorage.setItem(DONE_KEY, manifest.version)
    return
  }

  // Tải DẦN từng file (tuần tự, nhẹ nhàng).
  for (const f of queue) {
    await waitOnline()
    await idle()
    if (myGen !== generation) return // đã bị dừng giữa chừng
    const url = '/' + f.path
    try {
      // Nếu file ĐỔI: xoá bản cũ để service worker (cache-first) buộc lấy bản mới từ mạng.
      if (map[f.path] && map[f.path] !== f.hash) await cache.delete(url)
      // Ghi thẳng bản mạng vào cache để chắc chắn đúng nội dung (không qua bản cũ của SW).
      const fileRes = await fetch(url, { cache: 'no-store' })
      if (fileRes.ok) {
        await cache.put(url, fileRes.clone())
        // Đọc & bỏ body để giải phóng stream (mỗi lần chỉ 1 file ~vài trăm KB).
        await fileRes.arrayBuffer().catch(() => {})
        map[f.path] = f.hash
        saveMap(map)
        progress = { ...progress, done: progress.done + 1, bytesDone: progress.bytesDone + f.size }
        emitProgress()
      }
    } catch {
      // 1 file lỗi — bỏ qua, tiếp file sau; lần mở app sau sẽ thử lại file còn thiếu.
    }
  }

  // Tải đủ toàn bộ version hiện tại.
  if (progress.done >= progress.total) localStorage.setItem(DONE_KEY, manifest.version)
}
