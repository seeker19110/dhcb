// fetchPrelude — Bộ chạy bài FETCH, DÙNG CHUNG cho cổng CI và Worker trong trình duyệt (PR-L7e).
//
// VẤN ĐỀ PHẢI GIẢI: sandbox học tập KHÔNG có mạng (CSP của app chặn, runner CI cũng không
// được gọi API thật), nhưng unit P3-U7 dạy fetch. Lời giải: fetch GIẢ LẬP — một hàm cùng tên,
// cùng hình dạng (trả Promise<Response> có .ok/.status/.json()), phục vụ bộ dữ liệu thời tiết
// mẫu cố định (weatherData.ts). Học viên viết code y như gọi API thật; thứ duy nhất khác là
// dữ liệu nằm sẵn trong máy.
//
// PR-L8: dự án trục chặng P3 cũng cần fetch, nhưng gọi API MENU CỬA HÀNG của chính dự án chứ
// không phải API thời tiết của bài học — nên chayBaiFetch() nhận thêm tham số `api` chọn bộ
// dữ liệu. Hai bộ đi qua CÙNG một hàm giả lập (taoFetchBang), không đẻ nhánh hành vi riêng.
//
// Fetch giả lập nằm ở fetchGia.ts (file này chỉ import, KHÔNG chứa) — chủ ý: trang bài học
// cần FETCH_SHIM_JS cho khung xem trang, mà file này kéo theo linkedom (~94KB gzip); tách ra
// thì linkedom chỉ nằm trong worker/cổng CI, không lọt vào bundle chính (ngân sách Initial JS).
//
// Chạy trong Worker (không phải iframe) vì cùng lý do với bài DOM: vòng lặp vô hạn của học
// viên chỉ có thể bị dừng bằng terminate() từ main thread. Trang dựng bằng linkedom.
import { parseHTML } from 'linkedom'
import { moTaCayDom, type ElementLike } from './htmlPrelude.js'
import { thucHien, type DomLike } from './domPrelude.js'
import { taoFetchTheoApi, type FetchApi } from './fetchGia.js'

export {
  taoFetchBang,
  taoFetchGia,
  taoFetchCuaHang,
  taoFetchQuyLop,
  taoFetchTheoApi,
  FETCH_SHIM_JS,
  FETCH_SHIM_CUA_HANG_JS,
  FETCH_SHIM_QUY_LOP_JS,
  type FetchApi,
  type ResponseGia,
} from './fetchGia.js'

/** Kết quả một lượt chạy — cùng hình dạng với DomRunResult của bài DOM. */
export interface FetchRunResult {
  output: string
  error?: string
}

/**
 * Xả hàng đợi microtask: fetch giả resolve ngay lập tức, nhưng chuỗi .then()/await của học
 * viên cần vài "nhịp" microtask mới chạy xong. 25 nhịp là dư dả cho mọi chuỗi Promise mà bài
 * học có thể sinh ra (mỗi await tốn 1–2 nhịp); code treo THẬT (Promise không bao giờ resolve,
 * vòng lặp vô hạn) thì không xả kiểu gì cũng không xong — đã có timeout terminate của Worker.
 */
async function xaMicrotask(): Promise<void> {
  for (let i = 0; i < 25; i++) await Promise.resolve()
}

/**
 * Dựng trang, chạy script CÓ FETCH GIẢ của học viên (bọc async — cho phép cả top-level await),
 * chờ mọi Promise lắng xuống, diễn các hành động (chờ sau MỖI hành động, vì handler thường là
 * hàm async gọi fetch), rồi mô tả cây DOM. Mỗi lượt gọi là một trang MỚI TINH.
 */
export async function chayBaiFetch(
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

    // new Function + bọc async: script chỉ thấy document/window/fetch của trang giả, và
    // được phép await ở "mức ngoài cùng" (khung xem trang không cho — bài học dạy khuôn
    // `async function` + gọi hàm, chạy được ở CẢ HAI nơi).
    const p = new Function(
      'document',
      'window',
      'fetch',
      'return (async () => {\n' + js + '\n})()',
    )(document, window, fetchGia) as Promise<unknown>
    await p
    await xaMicrotask()

    for (const hd of hanhDong) {
      thucHien(hd, document as unknown as DomLike, EventCtor)
      await xaMicrotask()
    }

    return { output: moTaCayDom(document.documentElement as unknown as ElementLike) }
  } catch (err) {
    const e = err as Error
    return { output: '', error: e?.message ? `${e.name ?? 'Lỗi'}: ${e.message}` : String(err) }
  }
}
