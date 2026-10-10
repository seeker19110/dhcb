// apps/dhcb/src/lib/googleMapsLoader.ts — Nạp Google Maps JavaScript API MỘT LẦN, lười (chỉ khi
// người dùng thật sự mở màn hình bản đồ). Không dùng thư viện npm nào để không phình bundle
// (ngân sách size-limit đang rất mỏng — xem PROGRESS.md "Nợ kỹ thuật") — script tải từ CDN của
// Google nên không tính vào bundle.

const SCRIPT_ID = 'google-maps-js-api'

// Khai báo TỐI GIẢN đúng phần API mình dùng — cố ý KHÔNG cài @types/google.maps để không thêm
// phụ thuộc chỉ phục vụ một màn hình. Thêm chỗ nào dùng mới thì khai thêm ở đây.
export interface GoogleLatLngLiteral {
  lat: number
  lng: number
}
export interface GoogleLatLngBounds {
  extend(point: GoogleLatLngLiteral): void
  isEmpty(): boolean
}
export interface GoogleMap {
  setCenter(point: GoogleLatLngLiteral): void
  setZoom(zoom: number): void
  fitBounds(bounds: GoogleLatLngBounds, padding?: number): void
  /** Dùng để biết người dùng đã tự kéo/thu phóng bản đồ — xem LiveMap.tsx. */
  addListener(eventName: string, handler: () => void): void
}
export interface GoogleMarker {
  setPosition(point: GoogleLatLngLiteral): void
  setMap(map: GoogleMap | null): void
  setTitle(title: string): void
}
export interface GoogleMapsApi {
  Map: new (el: HTMLElement, options: Record<string, unknown>) => GoogleMap
  Marker: new (options: Record<string, unknown>) => GoogleMarker
  LatLngBounds: new () => GoogleLatLngBounds
}

// KHÔNG khai `declare global` cho window.google ở đây: packages/core-ui/clientAuth.ts đã khai
// window.google (Google Identity Services) với hình dạng khác, hai bản khai sẽ chỏi nhau
// (TS2717). Đọc qua một hàm ép kiểu tại chỗ là đủ và không đụng khai báo của người khác.
function readMapsFromWindow(): GoogleMapsApi | undefined {
  return (window as unknown as { google?: { maps?: GoogleMapsApi } }).google?.maps
}

let loadPromise: Promise<GoogleMapsApi> | null = null

export function getMapsApiKey(): string {
  return import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? ''
}

export function hasMapsApiKey(): boolean {
  return getMapsApiKey().trim().length > 0
}

/** Trả về namespace google.maps; ném lỗi nếu thiếu key hoặc script tải hỏng (mất mạng, bị chặn). */
export function loadGoogleMaps(): Promise<GoogleMapsApi> {
  if (loadPromise) return loadPromise

  loadPromise = new Promise((resolve, reject) => {
    const key = getMapsApiKey()
    if (!key) {
      reject(new Error('Thiếu VITE_GOOGLE_MAPS_API_KEY'))
      return
    }
    const existing = readMapsFromWindow()
    if (existing) {
      resolve(existing)
      return
    }
    const script = document.createElement('script')
    script.id = SCRIPT_ID
    script.async = true
    script.defer = true
    script.src =
      `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}` +
      '&libraries=marker&loading=async&language=vi&region=VN'
    script.onload = () => {
      const maps = readMapsFromWindow()
      if (maps) resolve(maps)
      else reject(new Error('Google Maps tải xong nhưng không dùng được'))
    }
    script.onerror = () => {
      // Cho phép thử lại lần sau (mạng chập chờn) — nếu giữ promise hỏng thì mãi mãi hỏng.
      loadPromise = null
      script.remove()
      reject(new Error('Không tải được Google Maps'))
    }
    document.head.appendChild(script)
  })
  return loadPromise
}
