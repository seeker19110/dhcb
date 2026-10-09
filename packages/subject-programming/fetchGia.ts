// fetchGia — Fetch GIẢ LẬP cho mạch web (PR-L7e, tổng quát hoá ở PR-L8), TÁCH RIÊNG khỏi
// fetchPrelude có chủ đích: file này KHÔNG import linkedom. Trang bài học/dự án chỉ cần
// FETCH_SHIM_* để nhúng vào khung xem trang; nếu shim nằm chung file với bộ chạy linkedom
// (~94KB gzip) thì cả thư viện đó bị kéo vào bundle chính và nổ ngân sách Initial JS.
//
// MỘT NGUỒN DUY NHẤT, BA NƠI DÙNG — để không có khe hở "xanh ở CI, rớt ở người học":
//  1. Cổng CI và Worker chấm bài cùng gọi chayBaiFetch (fetchPrelude.ts), bên trong dùng
//     taoFetchBang() ở đây.
//  2. Khung XEM TRANG (iframe) nhúng shim sinh từ ĐÚNG hàm taoFetchBang() bằng .toString().
// Vì lẽ đó taoFetchBang() phải TỰ CHỨA (không tham chiếu gì ngoài tham số của nó) — sửa hàm
// này thì giữ nguyên ràng buộc đó, test 'shim tự chứa' sẽ nhắc nếu quên.
import { THOI_TIET_63_TINH, type TinhThoiTiet } from './weatherData.js'
import { MENU_CUA_HANG, type MonCuaHang } from './shopData.js'
import { SO_QUY_LOP, type GiaoDichQuy } from './fundData.js'
import { TAI_LIEU_CHIA_SE, type TaiLieuChiaSe } from './hocTapData.js'

/** API mẫu nào phục vụ lượt chạy: bài học P3-U7 (thời tiết), dự án T1 (menu quán), dự án
 *  T2 (sổ quỹ lớp) hay dự án T3 (kho tài liệu chia sẻ). Khai ở đây (không phải fetchPrelude)
 *  để trang dự án dùng được mà không kéo linkedom vào bundle; fetchPrelude re-export lại cho
 *  các nơi đang import từ đó. */
export type FetchApi = 'thoi-tiet' | 'cua-hang' | 'quy-lop' | 'tai-lieu'

/** Hình dạng Response rút gọn mà fetch giả trả về — đủ cho những gì bài học dạy. */
export interface ResponseGia {
  ok: boolean
  status: number
  json(): Promise<unknown>
  text(): Promise<string>
}

/** Một bản ghi của API mẫu: object bất kỳ, miễn có trường dùng làm khoá tra cứu. */
type BanGhi = Record<string, unknown>

/**
 * Tạo fetch giả phục vụ MỘT địa chỉ API mẫu từ một mảng dữ liệu:
 *   <duongDanApi>                     → 200, cả mảng
 *   <duongDanApi>?<thamSo>=<giá trị>  → 200 một bản ghi khớp `khoaTra`, hoặc 404 {error}
 *   địa chỉ khác                      → reject TypeError (giống hệt lỗi mạng của fetch thật)
 *
 * So khớp không phân biệt hoa/thường và bỏ khoảng trắng thừa — người dùng gõ tay thì phải vậy.
 *
 * RÀNG BUỘC: hàm TỰ CHỨA — chỉ dùng tham số của nó và API chuẩn của JavaScript, vì source
 * được nhúng nguyên văn vào iframe qua các hằng FETCH_SHIM_* (xem đầu file).
 */
export function taoFetchBang(
  data: BanGhi[],
  duongDanApi: string,
  thamSo: string,
  khoaTra: string,
): (url: string) => Promise<ResponseGia> {
  // Giữ dữ liệu dưới dạng chuỗi JSON: mỗi lần gọi parse ra bản MỚI, học viên có lỡ sửa
  // object nhận được cũng không làm bẩn dữ liệu của lần gọi sau.
  const goc = JSON.stringify(data)
  return function fetchGia(url: string): Promise<ResponseGia> {
    const taoResponse = (status: number, body: unknown): ResponseGia => ({
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.resolve(JSON.parse(JSON.stringify(body))),
      text: () => Promise.resolve(JSON.stringify(body)),
    })

    // Chấp nhận cả đường dẫn tương đối lẫn tuyệt đối — cắt bỏ phần https://host nếu có.
    const duongDan = String(url).replace(/^https?:\/\/[^/]+/, '')
    const dauHoi = duongDan.indexOf('?')
    const path = dauHoi === -1 ? duongDan : duongDan.slice(0, dauHoi)
    if (path !== duongDanApi) {
      return Promise.reject(
        new TypeError(
          'Sandbox hoc tap khong co mang that — chi goi duoc API mau "' +
            duongDanApi +
            '" (hoac "' +
            duongDanApi +
            '?' +
            thamSo +
            '=<gia tri>"). Ban vua goi: ' +
            String(url),
        ),
      )
    }

    const danhSach = JSON.parse(goc) as BanGhi[]
    if (dauHoi === -1) return Promise.resolve(taoResponse(200, danhSach))

    // Có query: chỉ hiểu tham số đã khai báo (giá trị có dấu được URL-encode bởi trình duyệt).
    let can = ''
    const tienTo = thamSo + '='
    for (const cap of duongDan.slice(dauHoi + 1).split('&')) {
      if (cap.startsWith(tienTo)) {
        can = decodeURIComponent(cap.slice(tienTo.length).replace(/\+/g, ' ')).trim()
      }
    }
    const khop = danhSach.find((r) => String(r[khoaTra]).toLowerCase() === can.toLowerCase())
    if (!khop) {
      return Promise.resolve(
        taoResponse(404, { error: 'Khong tim thay "' + can + '" trong du lieu' }),
      )
    }
    return Promise.resolve(taoResponse(200, khop))
  }
}

/** Fetch giả của BÀI HỌC P3-U7: API thời tiết 63 tỉnh (`/api/thoi-tiet?tinh=<tên>`). */
export function taoFetchGia(data: TinhThoiTiet[]): (url: string) => Promise<ResponseGia> {
  return taoFetchBang(data as unknown as BanGhi[], '/api/thoi-tiet', 'tinh', 'ten')
}

/** Fetch giả của DỰ ÁN TRỤC chặng P3: API menu cửa hàng (`/api/menu?mon=<tên>`). */
export function taoFetchCuaHang(data: MonCuaHang[]): (url: string) => Promise<ResponseGia> {
  return taoFetchBang(data as unknown as BanGhi[], '/api/menu', 'mon', 'ten')
}

/** Fetch giả của DỰ ÁN TRỤC T2 chặng P3: API sổ quỹ lớp (`/api/quy?ma=<mã chứng từ>`). */
export function taoFetchQuyLop(data: GiaoDichQuy[]): (url: string) => Promise<ResponseGia> {
  return taoFetchBang(data as unknown as BanGhi[], '/api/quy', 'ma', 'ma')
}

/** Fetch giả của DỰ ÁN TRỤC T3 chặng P3: kho tài liệu chia sẻ (`/api/tai-lieu?ten=<tên>`). */
export function taoFetchTaiLieu(data: TaiLieuChiaSe[]): (url: string) => Promise<ResponseGia> {
  return taoFetchBang(data as unknown as BanGhi[], '/api/tai-lieu', 'ten', 'ten')
}

/** Fetch giả theo API — MỘT chỗ rẽ nhánh duy nhất, bộ chạy Worker và bộ chấm server cùng gọi
 *  (trước đây mỗi nơi tự viết `api === 'cua-hang' ? … : …`, thêm API mới là dễ sót một nơi
 *  và lặng lẽ rơi về API thời tiết). */
export function taoFetchTheoApi(api: FetchApi): (url: string) => Promise<ResponseGia> {
  if (api === 'cua-hang') return taoFetchCuaHang(MENU_CUA_HANG)
  if (api === 'quy-lop') return taoFetchQuyLop(SO_QUY_LOP)
  if (api === 'tai-lieu') return taoFetchTaiLieu(TAI_LIEU_CHIA_SE)
  return taoFetchGia(THOI_TIET_63_TINH)
}

/** Sinh đoạn script nhúng vào ĐẦU khung xem trang (iframe): định nghĩa `fetch` giả che fetch
 *  thật trong phạm vi script, từ CHÍNH source của taoFetchBang() — một nguồn duy nhất. */
function taoShim(data: unknown[], duongDanApi: string, thamSo: string, khoaTra: string): string {
  return (
    // Dòng đệm __name: vài toolchain (esbuild bật keepNames — tsx, có thể cả test runner) chèn
    // lời gọi helper __name(...) vào source lấy ra bằng .toString(); trong iframe không ai định
    // nghĩa nó. Đệm một hàm no-op cùng tên (chỉ khi chưa có) thì source nào cũng chạy được.
    'var __name = typeof __name === "function" ? __name : ((fn) => fn);\n' +
    'const fetch = (' +
    taoFetchBang.toString() +
    ')(' +
    JSON.stringify(data) +
    ', ' +
    JSON.stringify(duongDanApi) +
    ', ' +
    JSON.stringify(thamSo) +
    ', ' +
    JSON.stringify(khoaTra) +
    ');\n'
  )
}

/** Shim cho bài học P3-U7 (API thời tiết). */
export const FETCH_SHIM_JS = taoShim(THOI_TIET_63_TINH, '/api/thoi-tiet', 'tinh', 'ten')

/** Shim cho dự án trục chặng P3 (API menu cửa hàng). */
export const FETCH_SHIM_CUA_HANG_JS = taoShim(MENU_CUA_HANG, '/api/menu', 'mon', 'ten')

/** Shim cho dự án trục T2 chặng P3 (API sổ quỹ lớp). */
export const FETCH_SHIM_QUY_LOP_JS = taoShim(SO_QUY_LOP, '/api/quy', 'ma', 'ma')

/** Shim cho dự án trục T3 chặng P3 (API kho tài liệu chia sẻ). */
export const FETCH_SHIM_TAI_LIEU_JS = taoShim(TAI_LIEU_CHIA_SE, '/api/tai-lieu', 'ten', 'ten')

/** Shim theo API — trang dự án tra theo API của dự án đang chọn (projectTracks.ts). */
export const FETCH_SHIM_THEO_API: Readonly<Record<FetchApi, string>> = {
  'thoi-tiet': FETCH_SHIM_JS,
  'cua-hang': FETCH_SHIM_CUA_HANG_JS,
  'quy-lop': FETCH_SHIM_QUY_LOP_JS,
  'tai-lieu': FETCH_SHIM_TAI_LIEU_JS,
}
