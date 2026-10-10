// HtmlPreview — Khung XEM TRANG cho bài HTML/CSS của môn Lập trình (PR-L7c).
//
// Vì sao dùng được iframe ở đây trong khi bài JavaScript thì không: thuộc tính sandbox để
// RỖNG nghĩa là mọi quyền đều bị thu hồi — script KHÔNG chạy, form không gửi, không mở cửa
// sổ, không truy cập storage/cookie của trang cha (iframe mang origin ẩn danh). Trang chỉ
// được hiển thị. Không có script thì không có vòng lặp vô hạn, nên rủi ro treo trang mà bài
// JavaScript phải né bằng Web Worker ở đây KHÔNG tồn tại.
//
// Học viên vẫn có thể viết <script> vào bài — trình duyệt sẽ lặng lẽ không chạy nó. Đó là
// hành vi đúng cho hai unit này (U4 HTML, U5 CSS); bài DOM sẽ có cơ chế riêng.
//
// Bài DOM (CÓ script) khi đã cấu hình runner (`VITE_CODE_RUNNER_ORIGIN`): khung không dùng
// `srcdoc` nữa mà nạp `<runner>/preview.html#<trang>` — `srcdoc` thừa kế CSP của app, buộc app
// giữ 'unsafe-inline' cho script học viên; trang ở origin runner mang CSP riêng của nó (đặc tả
// docs/specs/2026-10-10-tach-runtime-chay-code-ten-mien-con.md). Trang TĨNH vẫn dùng `srcdoc`
// với sandbox="" vì không có script nào để chạy.
import { encodePreviewPayload } from '../lib/runnerProtocol'
import { getRunnerOrigin } from '../lib/runnerBridge'

interface Props {
  /** Mã HTML của trang. */
  html: string
  /**
   * Script cho bài DOM. CÓ script nghĩa là iframe phải được phép chạy JavaScript, nên nó
   * KHÔNG còn là trang tĩnh câm nữa — xem cảnh báo bên dưới.
   */
  script?: string
}

export function HtmlPreview({ html, script }: Props) {
  const chayScript = script !== undefined
  // Nhét script vào cuối body để nó chạy SAU khi các thẻ đã tồn tại (đúng cái bẫy số 2 mà
  // bài DOM dạy: đặt script trước nội dung thì getElementById trả null).
  // '\x3C/script>' thay vì gõ thẳng thẻ đóng: chuỗi này nằm trong mã nguồn JavaScript, gõ
  // thẳng có thể cắt sớm thẻ script của trang bao ngoài nếu bundle bị nhúng vào HTML.
  const trang = chayScript
    ? html.replace(/<\/body>/i, `<script>${script}\x3C/script></body>`)
    : html
  const runnerOrigin = getRunnerOrigin()
  const runnerSrc =
    chayScript && runnerOrigin
      ? `${runnerOrigin}/preview.html#${encodePreviewPayload(trang)}`
      : null

  return (
    <div className="space-y-2">
      <p className="text-xs text-zinc-400">
        {chayScript
          ? 'Xem trang chạy thật (script của bạn có chạy trong khung này):'
          : 'Xem trang (script bị tắt trong khung này — chỉ hiển thị):'}
      </p>
      <iframe
        // sandbox="" = thu hồi TOÀN BỘ quyền (bài HTML/CSS: trang tĩnh, không thể treo).
        // allow-scripts CHỈ dùng cho bài DOM, nơi học viên cần thấy trang phản ứng thật.
        // KHÔNG bao giờ thêm allow-same-origin: iframe sẽ đọc được cookie/storage của app (với
        // khung runner thì origin ẩn danh chặn script học viên đụng vào storage của `run.…`).
        // Lưu ý: khung này KHÔNG phải chỗ chấm bài — chấm chạy trong Web Worker (domRunner),
        // nơi vòng lặp vô hạn bị terminate(). Ở đây vòng lặp vô hạn chỉ làm khung đứng hình.
        // `key` đổi theo nội dung: chỉ đổi phần `#` thì trình duyệt KHÔNG nạp lại trang, nên
        // phải dựng khung mới mỗi khi trang học viên đổi.
        key={runnerSrc ?? 'srcdoc'}
        sandbox={chayScript ? 'allow-scripts' : ''}
        {...(runnerSrc ? { src: runnerSrc } : { srcDoc: trang })}
        title="Xem trước trang web bạn vừa viết"
        className="w-full h-64 rounded-2xl border border-zinc-800 bg-white"
      />
    </div>
  )
}
