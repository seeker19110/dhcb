// src/lib/guestPrerender.ts — Bản HTML DỰNG SẴN của trang chủ khách (`/`): bật lúc tải trang, gỡ
// khi React đã vẽ xong trang thật.
//
// VÌ SAO (đo Lighthouse mobile 2026-10-10, changelog 0584): là app một trang, chữ đầu tiên chỉ hiện
// sau khi tải + chạy ~165 KB JS khởi động → FCP ~2,8 s, LCP ~3,1 s. Lúc build, Vite chèn sẵn HTML
// của trang chủ khách (render tĩnh từ CHÍNH các component, xem `prerender/GuestHomePrerender.tsx`)
// vào `index.html`, trong một khối RIÊNG (`#guest-prerender`) cạnh `#root`. Trình duyệt vẽ được
// nội dung ngay khi có HTML + CSS; trên mạng 4G giả lập LCP 2,6 s → 0,75 s (trung vị 5 lượt).
//
// VÌ SAO KHÔNG để React `createRoot` vẽ đè lên HTML có sẵn: `createRoot` XOÁ nội dung cũ rồi vẽ lại
// phần tử y hệt — trình duyệt tính đó là lần vẽ LCP mới (đo thật: LCP bị đẩy từ 136 ms lên ~600 ms).
// Hydrate thì buộc HTML khớp tuyệt đối lần render đầu, mà lần render đầu của app là khung chờ phiên
// đăng nhập, không phải trang chủ. Nên: React render vào `#root` đang ẨN; khi trang chủ khách thật
// đã commit, `releaseGuestPrerender()` gỡ bản dựng sẵn và hiện `#root` trong CÙNG một khung hình
// (gọi từ `useLayoutEffect` — trước lần vẽ kế tiếp), không nháy, không xê dịch bố cục.

/** Thuộc tính trên `<html>`: có mặt = đang hiện bản dựng sẵn, `#root` bị ẩn bằng CSS. */
export const PRERENDER_ATTR = 'data-guest-prerender'
/** Id khối chứa HTML dựng sẵn (anh em với `#root`, KHÔNG nằm trong nó). */
export const PRERENDER_CONTAINER_ID = 'guest-prerender'

/**
 * Có hiện bản dựng sẵn cho lượt mở trang này không. Chỉ khi chắc chắn React sẽ vẽ ĐÚNG trang đó:
 * đường dẫn `/`, máy chưa có cờ phiên đăng nhập, ngôn ngữ giao diện tiếng Việt (bản dựng sẵn là
 * tiếng Việt), màn hình HẸP (< 1024px). Mọi trường hợp khác — kể cả lỗi đọc localStorage — trả
 * `false`: app chạy như cũ.
 *
 * Vì sao chỉ màn hẹp: header (`Layout`) chọn nút theo `useIsDesktopViewport()` bằng JS, nên HTML
 * tĩnh chỉ đúng được MỘT bề rộng. Bản dựng sẵn render ở bề rộng mobile — nơi điểm PageSpeed thấp
 * và đa số người dùng ở đó; desktop (đã ~99 điểm) chạy như cũ.
 *
 * HÀM NÀY ĐƯỢC NHÚNG NGUYÊN VĂN vào `<script>` trong `<head>` (qua `Function.prototype.toString`,
 * xem plugin trong `apps/dhcb/vite.config.ts`) nên phải TỰ ĐỦ: không dùng biến/hàm ngoài thân,
 * không cú pháp mà trình duyệt cũ không chạy. Các khoá localStorage viết thẳng ở đây; test
 * `guestPrerender.test.ts` canh chúng khớp hằng số gốc ở `@core/authHeader` và `lib/uiLang.ts`.
 */
export function shouldShowGuestPrerender(
  pathname: string,
  storage: Pick<Storage, 'getItem'>,
  isDesktopViewport: boolean,
): boolean {
  try {
    if (pathname !== '/' || isDesktopViewport) return false
    // Cờ phiên (SESSION_MARKER_KEY) hoặc token đời cũ (LEGACY_TOKEN_KEY) → người đã đăng nhập.
    if (storage.getItem('gsa_session_present_v1') || storage.getItem('gsa_session_token_v1')) {
      return false
    }
    // Cùng luật với getUiLang(): đã chọn thì theo lựa chọn; chưa chọn thì chiều học B → tiếng Anh.
    const lang = storage.getItem('ui_lang')
    if (lang === 'en') return false
    if (lang !== 'vi' && storage.getItem('et_direction') === 'B') return false
    return true
  } catch {
    return false
  }
}

/**
 * Gỡ bản dựng sẵn và hiện `#root`. Gọi được nhiều lần, ở bất kỳ đâu (lần sau là no-op) — mọi lối
 * React tiếp quản trang (trang chủ khách đã vẽ, chuyển sang trang khác, hoá ra đã đăng nhập, lỗi
 * render) đều gọi, để `#root` không bao giờ bị ẩn mãi.
 */
export function releaseGuestPrerender(doc: Document = document): void {
  doc.getElementById(PRERENDER_CONTAINER_ID)?.remove()
  doc.documentElement.removeAttribute(PRERENDER_ATTR)
}

/** CSS đặt trong `<head>`: bật cờ thì ẩn `#root`; không bật thì ẩn bản dựng sẵn. */
export const PRERENDER_STYLE = `html[${PRERENDER_ATTR}] #root{display:none}html:not([${PRERENDER_ATTR}]) #${PRERENDER_CONTAINER_ID}{display:none}`

/**
 * Script chặn (inline, trong `<head>`, chạy TRƯỚC lần vẽ đầu): quyết định bật bản dựng sẵn cho
 * lượt mở trang này. Nhúng nguyên văn `shouldShowGuestPrerender` để cùng một luật được test.
 */
export function buildPrerenderGateScript(desktopQuery: string): string {
  return (
    `try{if((${shouldShowGuestPrerender.toString()})(location.pathname,localStorage,` +
    `matchMedia(${JSON.stringify(desktopQuery)}).matches))` +
    `document.documentElement.setAttribute(${JSON.stringify(PRERENDER_ATTR)},'')}catch(e){}`
  )
}

const ROOT_DIV = '<div id="root"></div>'
const META_CHARSET = /<meta charset="[^"]*"\s*\/?>/i

/**
 * Chèn bản dựng sẵn vào `index.html` (plugin Vite gọi, cả dev lẫn build):
 * - `<style>` + script quyết định đặt NGAY SAU `<meta charset>` — trước mọi stylesheet (script
 *   inline đứng sau stylesheet phải chờ CSS tải xong mới chạy) và không đẩy `charset` ra khỏi
 *   1024 byte đầu trang;
 * - khối HTML dựng sẵn đứng NGAY TRƯỚC `#root`.
 * Ném lỗi nếu thiếu mốc nào — build đỏ còn hơn âm thầm mất bản dựng sẵn.
 */
export function injectGuestPrerender(
  html: string,
  prerenderHtml: string,
  desktopQuery: string,
): string {
  const charset = html.match(META_CHARSET)
  if (!charset || !html.includes(ROOT_DIV)) {
    throw new Error(
      `[guestPrerender] index.html thiếu <meta charset> hoặc ${ROOT_DIV} để chèn bản dựng sẵn`,
    )
  }
  const head = `<style>${PRERENDER_STYLE}</style><script>${buildPrerenderGateScript(desktopQuery)}</script>`
  return html
    .replace(charset[0], `${charset[0]}${head}`)
    .replace(
      ROOT_DIV,
      `<div id="${PRERENDER_CONTAINER_ID}">${prerenderHtml.trim()}</div>${ROOT_DIV}`,
    )
}

// Đang hiện bản dựng sẵn mà sau từng này vẫn chưa vẽ được gì (tab mở NỀN — trình duyệt không vẽ
// khi tab ẩn) thì vẫn tải JS, đừng chờ tới lúc người dùng mở tab.
const BOOT_FALLBACK_MS = 2000

/**
 * Nạp JS khởi động của app (`entry` + các `modulepreload` Vite sinh). Không đang hiện bản dựng
 * sẵn → nạp NGAY (như thẻ tĩnh cũ, cùng độ ưu tiên). Đang hiện → chờ tới SAU lần vẽ chữ đầu tiên:
 * nội dung đã có trong HTML và mọi lối đi chính trên trang chủ khách là thẻ `<a>` thật (bấm được
 * cả khi chưa có JS), nên để CSS + font — thứ cần cho lần vẽ — dùng trọn băng thông trước.
 *
 * Đo thật (changelog 0584): Lighthouse mobile tính mọi JS tải xong trước lần vẽ đầu vào FCP/LCP —
 * kể cả khi chữ đã hiện từ HTML; nạp JS sau lần vẽ chữ đầu: LCP mô phỏng ≈ FCP.
 * Đánh đổi: trên mạng chậm, nút cần JS (vd nút orb Đồng Hành) hoạt động muộn hơn ~một lần tải CSS.
 *
 * Nhúng NGUYÊN VĂN vào `<script>` (như shouldShowGuestPrerender) nên phải TỰ ĐỦ.
 */
export function loadBootScripts(
  entry: string,
  preloads: string[],
  prerenderAttr: string,
  fallbackMs: number,
): void {
  const d = document
  let started = false
  const go = () => {
    if (started) return
    started = true
    // Cùng thứ tự với thẻ tĩnh Vite sinh: script chính TRƯỚC, preload sau — trình duyệt xin file
    // theo thứ tự gặp, để `entry` (thứ kéo cả cây module) đi đầu hàng tải.
    const script = d.createElement('script')
    script.type = 'module'
    script.crossOrigin = ''
    script.src = entry
    d.head.appendChild(script)
    for (const href of preloads) {
      const link = d.createElement('link')
      link.rel = 'modulepreload'
      link.crossOrigin = ''
      link.href = href
      d.head.appendChild(link)
    }
  }
  if (!d.documentElement.hasAttribute(prerenderAttr)) {
    go()
    return
  }
  // Chờ đúng sự kiện "first-contentful-paint" — KHÔNG dùng requestAnimationFrame: đo thật, khung
  // hình đầu có thể chưa có chữ (trình duyệt còn chờ font), JS vẫn kịp tải trước lần vẽ chữ.
  const PO = window.PerformanceObserver
  if (PO && PO.supportedEntryTypes && PO.supportedEntryTypes.includes('paint')) {
    new PO((list, observer) => {
      if (list.getEntriesByName('first-contentful-paint').length) {
        observer.disconnect()
        setTimeout(go, 0)
      }
    }).observe({ type: 'paint', buffered: true })
  } else {
    requestAnimationFrame(() => setTimeout(go, 0))
  }
  setTimeout(go, fallbackMs)
}

const ENTRY_SCRIPT = /<script type="module" crossorigin src="([^"]+)"><\/script>\s*/g
const MODULE_PRELOAD = /<link rel="modulepreload" crossorigin href="([^"]+)">\s*/g

/**
 * CHỈ bản build: thay thẻ `<script type="module">` + `<link rel="modulepreload">` tĩnh do Vite sinh
 * bằng một script inline gọi `loadBootScripts` (xem trên), đặt đúng chỗ thẻ script cũ — trước
 * stylesheet, nên chạy ngay lúc parse (script inline sau stylesheet phải chờ CSS). Ném lỗi nếu
 * không thấy đúng MỘT script module — Vite đổi khuôn thẻ thì build đỏ, không âm thầm mất JS.
 */
export function deferBootScriptsWhilePrerendered(html: string): string {
  const entries = [...html.matchAll(ENTRY_SCRIPT)].map((m) => m[1])
  if (entries.length !== 1) {
    throw new Error(
      `[guestPrerender] cần đúng 1 <script type="module" crossorigin src>, thấy ${entries.length}`,
    )
  }
  const preloads = [...html.matchAll(MODULE_PRELOAD)].map((m) => m[1])
  const args = [entries[0], preloads, PRERENDER_ATTR, BOOT_FALLBACK_MS].map((a) =>
    JSON.stringify(a),
  )
  const loader = `<script>(${loadBootScripts.toString()})(${args.join(',')})</script>`
  return html.replace(MODULE_PRELOAD, '').replace(ENTRY_SCRIPT, () => loader)
}
