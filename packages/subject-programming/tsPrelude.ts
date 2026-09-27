// tsPrelude — LÀN TYPESCRIPT của bậc P4 (PR-L16, unit U10–U11).
//
// VÌ SAO KHÁC MỌI LÀN KHÁC: các làn trước chạy trọn trong trình duyệt. TypeScript thì cần
// TRÌNH BIÊN DỊCH tsc (~7MB kèm bộ lib.d.ts) — nhét vào sandbox trình duyệt là bắt học viên
// tải thêm một Pyodide nữa chỉ để kiểm kiểu. Nên phần kiểm kiểu chạy ở SERVER
// (`POST /api/programming/ts-check`), rồi JavaScript sinh ra chạy trong Worker JS ĐÃ CÓ.
// Server chỉ BIÊN DỊCH, tuyệt đối không chạy code học viên — không có eval, không tiến trình
// con, nên bề mặt tấn công đúng bằng "tốn CPU", và đã bị chặn bằng rate-limit + auth.
//
// File này giữ phần LOGIC THUẦN dùng chung cho hai nơi (handler server + cổng CI), theo đúng
// bài học của jsPrelude/pyLanes: định dạng kết quả chỉ được viết MỘT lần, nếu không cổng CI
// và thứ học viên nhìn thấy sẽ trôi khỏi nhau.
//
// `typescript` được TIÊM VÀO (tham số), không import trực tiếp: gói subject-programming là
// gói dữ liệu bài học, không được kéo theo trình biên dịch vào bất kỳ bundle nào.
import type * as TS from 'typescript'

/**
 * Phần API của gói `typescript` mà file này thật sự dùng.
 *
 * Vì sao KHÔNG khai `typeof import('typescript')`: gói được nạp bằng `import ts from
 * 'typescript'` ở server (CommonJS + esModuleInterop) nhưng bằng `import * as ts` ở cổng CI —
 * hai hình dạng lệch nhau đúng ở thuộc tính `default`, và build server đã đỏ vì chuyện đó.
 * Mô tả theo CẤU TRÚC thì cả hai đều hợp lệ, và người đọc thấy ngay file này cần những gì.
 */
export interface TsCompiler {
  ScriptTarget: typeof TS.ScriptTarget
  ModuleKind: typeof TS.ModuleKind
  createSourceFile: typeof TS.createSourceFile
  createCompilerHost: typeof TS.createCompilerHost
  createProgram: typeof TS.createProgram
  transpileModule: typeof TS.transpileModule
  flattenDiagnosticMessageText: typeof TS.flattenDiagnosticMessageText
}

/** Tên file ảo của code học viên — hiện trong thông báo lỗi nên đặt cho dễ hiểu. */
export const TEN_FILE_TS = 'bai.ts'

export interface KetQuaKiemTs {
  /** Mỗi phần tử là một lỗi kiểu đã định dạng sẵn cho học viên đọc. */
  loi: string[]
  /** JavaScript sinh ra (luôn có, kể cả khi còn lỗi kiểu — tsc vẫn sinh được). */
  js: string
}

/** Dòng đầu output khi code SẠCH kiểu, để học viên phân biệt hai giai đoạn rõ ràng. */
export const TIEU_DE_CHAY = '[TypeScript] Khong co loi kieu — chay chuong trinh:'

/** Dòng đầu output khi CÒN lỗi kiểu (chương trình KHÔNG được chạy). */
export const TIEU_DE_LOI = '[TypeScript] Trinh bien dich bat duoc loi — chuong trinh KHONG chay:'

/**
 * Kiểm kiểu + sinh JavaScript cho một đoạn TypeScript.
 *
 * Bật `strict` vì đó là cấu hình của chính dự án DHCB (CLAUDE.md mục 4) và cũng là điều
 * khiến TypeScript đáng học: strict tắt thì phần lớn lỗi mà bài muốn dạy sẽ không hiện ra.
 */
function taoOptions(ts: TsCompiler): TS.CompilerOptions {
  return {
    strict: true,
    noImplicitAny: true,
    target: ts.ScriptTarget.ES2020,
    module: ts.ModuleKind.None,
    // skipLibCheck: chỉ soi code học viên, không soi lại bộ lib chuẩn (nhanh hơn nhiều).
    skipLibCheck: true,
    noEmit: false,
    // AN TOÀN (vá 2026-09-27): bài làm là MỘT file độc lập, không bao giờ cần file khác.
    // noResolve: bỏ qua `/// <reference path>` và `import` — trước đây học viên viết
    //   `/// <reference path="/var/www/…/x.ts" />` là server đọc file thật trên đĩa (dò được file
    //   nào tồn tại qua lỗi TS6053, và mỗi file lớn nằm lại vĩnh viễn trong bộ nhớ đệm bên dưới).
    // types: []: không tự nạp các gói @types trong node_modules của server.
    noResolve: true,
    types: [],
  }
}

// BỘ NHỚ LIB — thứ quyết định endpoint này dùng được hay không.
//
// Mỗi lần createProgram, TypeScript đọc và PHÂN TÍCH LẠI toàn bộ lib.es2020.d.ts và họ hàng
// của nó (vài MB). Một lượt như vậy tốn ~2–5 giây, mà lib thì bất biến — nên nạp lại là phí
// sạch. Cache ở mức module: lượt đầu chịu giá, các lượt sau gần như tức thì.
//
// Đây không phải tối ưu sớm: chính chỗ này đã làm cổng CI hết giờ (mỗi bài học một lượt tsc),
// và trên server nó là CPU tiêu tốn cho MỖI lần học viên bấm "Chấm bài".
//
// Bộ nhớ này CHỈ giữ file trong thư mục lib chuẩn của gói typescript (một tập hữu hạn ~100
// file) — mọi đường dẫn khác bị host từ chối trước khi đọc đĩa. Trước bản vá 2026-09-27 nó giữ
// MỌI file từng được tham chiếu, nên chính học viên quyết định nó phình tới đâu (~10 MB heap
// cho mỗi file .d.ts lớn, không bao giờ giải phóng) → worker bị PM2 giết vì quá RAM.
const boNhoLib = new Map<string, TS.SourceFile | undefined>()
let hostDungChung: { host: TS.CompilerHost; thuMucLib: string } | null = null

/** Thư mục chứa lib.*.d.ts của chính gói typescript (đường dẫn đã chuẩn hoá dấu '/'). */
function timThuMucLib(goc: TS.CompilerHost, options: TS.CompilerOptions): string {
  const tuHost = goc.getDefaultLibLocation?.()
  if (tuHost) return tuHost.replace(/\\/g, '/').replace(/\/+$/, '')
  const fileLib = goc.getDefaultLibFileName(options).replace(/\\/g, '/')
  return fileLib.slice(0, fileLib.lastIndexOf('/'))
}

/** `ten` có phải một file lib chuẩn nằm TRỰC TIẾP trong thư mục lib không (không `..`, không thư mục con). */
function laFileLib(ten: string, thuMucLib: string): boolean {
  const chuan = ten.replace(/\\/g, '/')
  if (!chuan.startsWith(thuMucLib + '/')) return false
  const phanSau = chuan.slice(thuMucLib.length + 1)
  return phanSau.length > 0 && !phanSau.includes('/') && !phanSau.includes('..')
}

function layHost(
  ts: TsCompiler,
  options: TS.CompilerOptions,
): { host: TS.CompilerHost; thuMucLib: string } {
  if (hostDungChung) return hostDungChung
  const goc = ts.createCompilerHost(options)
  const thuMucLib = timThuMucLib(goc, options)
  const host: TS.CompilerHost = {
    ...goc,
    getSourceFile: (ten, ...rest) => {
      if (!laFileLib(ten, thuMucLib)) return undefined
      const san = boNhoLib.get(ten)
      if (san !== undefined) return san
      const tep = goc.getSourceFile(ten, ...rest)
      boNhoLib.set(ten, tep)
      return tep
    },
    fileExists: (ten) => laFileLib(ten, thuMucLib) && goc.fileExists(ten),
    readFile: (ten) => (laFileLib(ten, thuMucLib) ? goc.readFile(ten) : undefined),
    // Không liệt kê/duyệt thư mục nào của server (tự dò @types, typeRoots…).
    directoryExists: (ten) => ten.replace(/\\/g, '/').replace(/\/+$/, '') === thuMucLib,
    getDirectories: () => [],
    realpath: (ten) => ten,
    writeFile: () => {},
  }
  hostDungChung = { host, thuMucLib }
  return hostDungChung
}

export function kiemTraTypeScript(code: string, ts: TsCompiler): KetQuaKiemTs {
  const options = taoOptions(ts)
  const sourceFile = ts.createSourceFile(TEN_FILE_TS, code, ts.ScriptTarget.ES2020, true)
  const { host: hostGoc } = layHost(ts, options)
  const host: TS.CompilerHost = {
    ...hostGoc,
    getSourceFile: (ten, ...rest) =>
      ten === TEN_FILE_TS ? sourceFile : hostGoc.getSourceFile(ten, ...rest),
    fileExists: (ten) => ten === TEN_FILE_TS || hostGoc.fileExists(ten),
    readFile: (ten) => (ten === TEN_FILE_TS ? code : hostGoc.readFile(ten)),
  }

  const program = ts.createProgram([TEN_FILE_TS], options, host)
  const chuanDoan = [
    ...program.getSyntacticDiagnostics(sourceFile),
    ...program.getSemanticDiagnostics(sourceFile),
  ]

  const js = ts.transpileModule(code, {
    compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.None },
  }).outputText

  return { loi: chuanDoan.map((d) => dinhDangMotLoi(d, ts)), js }
}

/** "Dòng 7: TS2322 Type 'string' is not assignable to type 'number'." */
function dinhDangMotLoi(chuan_doan: TS.Diagnostic, ts: TsCompiler): string {
  const thongDiep = ts.flattenDiagnosticMessageText(chuan_doan.messageText, ' ')
  if (chuan_doan.file && chuan_doan.start !== undefined) {
    const { line } = chuan_doan.file.getLineAndCharacterOfPosition(chuan_doan.start)
    return `Dong ${line + 1}: TS${chuan_doan.code} ${thongDiep}`
  }
  return `TS${chuan_doan.code} ${thongDiep}`
}

/**
 * Output cuối cùng học viên nhìn thấy (và test-case chấm trên đó).
 *
 * Còn lỗi kiểu → KHÔNG chạy, in nguyên danh sách lỗi. Đây là chủ ý sư phạm: cả điểm mạnh của
 * TypeScript nằm ở chỗ nó chặn TRƯỚC khi chạy, nên bài học phải cho học viên thấy đúng điều
 * đó thay vì lặng lẽ chạy tiếp bằng JavaScript đã sinh.
 */
export function dinhDangKetQuaTs(loi: string[], outputChay: string): string {
  if (loi.length > 0) return [TIEU_DE_LOI, ...loi].join('\n')
  return [TIEU_DE_CHAY, outputChay].join('\n')
}
