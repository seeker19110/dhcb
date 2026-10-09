// domFetchServerPrelude — Bộ chấm-lại-Ở-SERVER cho bài `html` / `dom` / `fetch`
// (ADR-0008 đợt B3, docs/adr/0008-cham-lai-server-lap-trinh-ngoai-p1-p4.md).
//
// VÌ SAO LÀ MỘT FILE RIÊNG, KHÔNG SỬA `domPrelude.ts`/`fetchPrelude.ts` TẠI CHỖ:
// hai file kia là mã DÙNG CHUNG cho CẢ Worker trình duyệt (`apps/dhcb/src/workers/domWorker.ts`,
// `fetchWorker.ts` — chấm xem trước phía học viên) LẪN cổng nội dung CI. `node:vm` là module
// RIÊNG của Node, KHÔNG tồn tại trong trình duyệt — đổi thẳng import ở đó sẽ vỡ bundle client
// ngay khi build. Nên giữ nguyên chúng (Worker vẫn cách ly bằng `terminate()`), và file này
// lắp lại đúng các mảnh THUẦN đã có (`parseHTML`, `thucHien()`, `moTaCayDom()`, `taoFetchGia()`)
// nhưng thay DUY NHẤT dòng thực thi script học viên: `new Function(...)` → `vm.runInContext()`
// trong một context TỐI GIẢN (không `require`/`process`/`global`) + timeout cứng.
//
// Đây đúng khuôn mẫu đã có với Python (client chạy Pyodide, server chạy `python3` thật — HAI
// ENGINE khác nhau, cùng bộ test-case, không lệch nhau nhờ `grading.ts` dùng chung). Ở đây còn
// gần nhau hơn Python: cả hai phía đều là JavaScript, cùng `linkedom`, cùng `moTaCayDom()`.
import vm from 'node:vm'
import { parseHTML } from 'linkedom'
import { moTaCayDom, type ElementLike } from './htmlPrelude.js'
import { thucHien, type DomLike, type DomRunResult } from './domPrelude.js'
import { taoFetchTheoApi, type FetchApi } from './fetchGia.js'
import type { FetchRunResult } from './fetchPrelude.js'

/** Khớp `TIMEOUT_MS` của `completionSandboxServer.ts` (và timeout client) — cùng trải nghiệm. */
const TIMEOUT_MS = 10_000

/**
 * Xả hàng đợi microtask — SAO CHÉP CÓ CHỦ ĐÍCH từ `fetchPrelude.ts` (cùng 25 nhịp) để hành vi
 * chấm hai phía không lệch. Không import lại vì hàm đó là chi tiết nội bộ của file kia.
 */
async function xaMicrotask(): Promise<void> {
  for (let i = 0; i < 25; i++) await Promise.resolve()
}

function moTaLoi(err: unknown): string {
  const e = err as Error
  return e?.message ? `${e.name ?? 'Lỗi'}: ${e.message}` : String(err)
}

/**
 * Context TỐI GIẢN cho script học viên: chỉ `document`/`window` của trang giả (+ `fetch` với bài
 * fetch) và một `console` không-làm-gì. KHÔNG có `require`, `process`, `global`, `fs`, mạng thật.
 *
 * `console` được cấp vì trong Worker trình duyệt script vẫn thấy `console` — không cấp thì bài
 * nào lỡ `console.log` sẽ rớt ở server mà đạt ở client (đúng thứ lệch phải tránh). Output của bài
 * DOM/fetch chấm trên CÂY DOM, nên nuốt console không ảnh hưởng kết quả chấm.
 */
function taoContext(extra: Record<string, unknown>): vm.Context {
  const im = () => {}
  return vm.createContext({ console: { log: im, error: im, warn: im, info: im }, ...extra })
}

/**
 * Bài `html`: học viên nộp HTML, KHÔNG có script nào của họ được chạy — chỉ dựng trang rồi mô tả
 * cây DOM. Dùng `linkedom` (cùng thư viện với bài dom/fetch, và là dependency THẬT của gói; cổng
 * CI `lessonsHtml.test.ts` dùng `happy-dom` vốn chỉ là devDependency, không dùng được ở server).
 */
export function chayBaiHtmlServer(html: string): DomRunResult {
  try {
    const { document } = parseHTML(html)
    return { output: moTaCayDom(document.documentElement as unknown as ElementLike) }
  } catch (err) {
    return { output: '', error: moTaLoi(err) }
  }
}

/** Bài `dom`: bản server-only của `chayBaiDom()` — khác đúng dòng thực thi script học viên. */
export function chayBaiDomServer(html: string, js: string, hanhDong: string[] = []): DomRunResult {
  try {
    const { document, window } = parseHTML(html)
    const EventCtor = (window as unknown as { Event: new (t: string) => unknown }).Event

    const context = taoContext({ document, window })
    vm.runInContext(js, context, { timeout: TIMEOUT_MS })

    for (const hd of hanhDong) thucHien(hd, document as unknown as DomLike, EventCtor)

    return { output: moTaCayDom(document.documentElement as unknown as ElementLike) }
  } catch (err) {
    return { output: '', error: moTaLoi(err) }
  }
}

/**
 * Bài `fetch`: bản server-only của `chayBaiFetch()`. Vẫn bọc script trong một hàm async (cho phép
 * top-level await như bài học dạy) và chờ microtask lắng xuống giữa các hành động.
 *
 * LƯU Ý về timeout: `vm` chỉ cắt được phần chạy ĐỒNG BỘ. Vòng lặp vô hạn bị chặn; còn Promise
 * không bao giờ resolve thì `await` sẽ treo — nhưng fetch ở đây là GIẢ LẬP (resolve ngay, không
 * có mạng thật, không có `setTimeout` trong context) nên không có nguồn treo nào ngoài code cố ý
 * tạo `new Promise(() => {})`, và lượt chấm đó chỉ giữ một request của CHÍNH người nộp.
 */
export async function chayBaiFetchServer(
  html: string,
  js: string,
  hanhDong: string[] = [],
  api: FetchApi = 'thoi-tiet',
): Promise<FetchRunResult> {
  try {
    const { document, window } = parseHTML(html)
    const EventCtor = (window as unknown as { Event: new (t: string) => unknown }).Event
    const fetchGia = taoFetchTheoApi(api)
    // Gắn cả lên window cho ai viết window.fetch(...) — cùng một hàm, không lệch hành vi.
    ;(window as unknown as Record<string, unknown>).fetch = fetchGia

    const context = taoContext({ document, window, fetch: fetchGia })
    const p = vm.runInContext('(async () => {\n' + js + '\n})()', context, {
      timeout: TIMEOUT_MS,
    }) as Promise<unknown>
    await p
    await xaMicrotask()

    for (const hd of hanhDong) {
      thucHien(hd, document as unknown as DomLike, EventCtor)
      await xaMicrotask()
    }

    return { output: moTaCayDom(document.documentElement as unknown as ElementLike) }
  } catch (err) {
    return { output: '', error: moTaLoi(err) }
  }
}
