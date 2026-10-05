import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { MessageCircle, Mic, PenLine, Volume2, Sparkles } from 'lucide-react'
import { track } from '../../lib/analytics'
import ThemeToggle from '../../components/ThemeToggle'
import { MAIN_CONTENT_ID } from '@core/PageShell'

// Trang landing công khai, KHÔNG bọc RequireAuth — dùng làm điểm đến cho link quảng cáo
// (TikTok/Facebook/SEO). Khác với "/" (đã gắn RequireAuth, đẩy người chưa đăng nhập sang
// /login), trang này ai cũng vào được để đọc giới thiệu trước khi quyết định đăng ký.
//
// PHẠM VI: đây là trang quảng cáo RIÊNG cho MÔN TIẾNG ANH (giữ nguyên thông điệp theo từ
// khoá quảng cáo), KHÔNG phải trang chủ nền tảng. Trang chủ nền tảng là apps/hub (giới
// thiệu đủ 5 trụ). Vì vậy trang này phải nói rõ tiếng Anh là MỘT MÔN của nền tảng và có
// đường dẫn sang phần còn lại — tránh để người đọc hiểu nhầm nền tảng chỉ dạy tiếng Anh.
const TITLE = 'Nói tiếng Anh với AI — sửa lỗi bằng giọng Việt | Môn tiếng Anh · Đồng hành cùng bạn'
const DESCRIPTION =
  'Nói tiếng Anh với AI — sai chỗ nào, được giảng lại bằng tiếng Việt. Miễn phí. Hội thoại giọng Anh chuẩn, sửa lỗi & giải thích bằng giọng tiếng Việt. Môn Tiếng Anh thuộc nền tảng đồng hành cá nhân Đồng hành cùng bạn.'

const MODES = [
  {
    icon: MessageCircle,
    title: 'Chat tổng hợp',
    desc: 'Trò chuyện thân mật với AI, sửa lỗi kèm động viên, giải thích bằng tiếng Việt.',
  },
  {
    icon: PenLine,
    title: 'Luyện viết + chấm điểm',
    desc: 'Chấm bài kiểu IELTS, chỉ rõ lỗi sai, ước lượng band điểm.',
  },
  {
    icon: Mic,
    title: 'Luyện nói song ngữ',
    desc: 'Nói tiếng Anh, AI trả lời bằng giọng Anh chuẩn — sửa lỗi & giải thích bằng giọng tiếng Việt.',
  },
] as const

export default function Landing() {
  const nav = useNavigate()
  const [searchParams] = useSearchParams()

  // SEO: set title + meta description ngay khi vào trang. Dự án hiện set các thẻ SEO tĩnh
  // trong index.html (không dùng react-helmet hay thư viện SEO nào ở phía React) — trang này
  // cần title/description RIÊNG cho mục đích quảng cáo nên set trực tiếp qua document API,
  // và trả về thẻ gốc lúc rời trang để không ảnh hưởng các trang khác.
  useEffect(() => {
    const prevTitle = document.title
    document.title = TITLE

    const metaDesc = document.querySelector<HTMLMetaElement>('meta[name="description"]')
    const prevDesc = metaDesc?.content
    if (metaDesc) metaDesc.content = DESCRIPTION

    return () => {
      document.title = prevTitle
      if (metaDesc && prevDesc !== undefined) metaDesc.content = prevDesc
    }
  }, [])

  // Ghi nhận lượt xem trang landing (chưa cần đăng nhập vẫn track được).
  useEffect(() => {
    track('landing_view')
  }, [])

  // Lưu tạm mã giới thiệu/nguồn traffic (utm_source hoặc ref) để dùng cho tính năng referral
  // sau này — CHỈ lưu lại, chưa xử lý gì thêm.
  useEffect(() => {
    const ref = searchParams.get('ref') ?? searchParams.get('utm_source')
    if (ref) {
      try {
        localStorage.setItem('pending_ref_code', ref)
      } catch {
        // localStorage có thể bị chặn (chế độ riêng tư) — bỏ qua, không chặn trang chạy tiếp
      }
    }
  }, [searchParams])

  function handleCtaClick() {
    track('cta_click')
    // Login.tsx hiện chưa đọc query param để chọn sẵn tab đăng ký (chỉ có state nội bộ
    // mode='login'|'register', mặc định 'login') — trỏ thẳng sang /login, người dùng tự bấm
    // tab "Đăng ký" ở đó.
    nav('/login')
  }

  return (
    <div className="min-h-dvh bg-zinc-950 theme-light:bg-white text-zinc-100 theme-light:text-zinc-900">
      <header className="mx-auto flex max-w-lg justify-end px-4 pt-4 sm:max-w-2xl lg:max-w-6xl">
        <ThemeToggle />
      </header>
      {/* [2026-09-02] Tầng desktop cho trang landing. Trước đây trang này là MỘT cột
          `max-w-2xl` ở mọi bề rộng: trên màn 1440px nó là một dải chữ hẹp giữa hai khoảng
          trống lớn — đúng nghĩa "mobile phóng to" (đo bằng ảnh chụp thật).
          Nguyên tắc: KHÔNG đổi bất cứ thứ gì dưới 1024px (mọi thay đổi đều nằm sau `lg:`),
          và không kéo dài dòng chữ — chỗ thừa dùng để ĐẶT CẠNH NHAU những khối vốn phải cuộn
          mới thấy, nên người đọc nắm được toàn bộ lời chào hàng trong một màn. */}
      {/* `pb-[calc(4rem+var(--bnav-h))]`: trang này KHÔNG dùng `PageShell` nên phải tự chừa chỗ
          cho thanh điều hướng đáy. Trước 2026-09-15 ở đây là `pb-16` (64px) trong khi thanh nav
          cao 97px — nút CTA cuối trang nằm DƯỚI thanh nav và không bấm được ở 390px lẫn 320px.
          `--bnav-h` bằng 0 từ 1024px (index.css) nên desktop không đổi. Cổng canh:
          e2e/mobile-layout-guards.spec.ts */}
      {/* [Trả nợ S03-2, 2026-09-15] `id` + `tabIndex` là ĐÍCH của liên kết "Bỏ qua tới nội
          dung chính" (`SkipLink` render toàn cục trong App.tsx, WCAG 2.4.1 mức A). Hai trang
          giới thiệu này tự dựng `<main>` thay vì dùng `PageShell` — nơi duy nhất đặt
          `MAIN_CONTENT_ID` — nên liên kết trỏ vào `#noi-dung-chinh` KHÔNG TỒN TẠI: người dùng
          bàn phím bấm Tab lần đầu, thấy liên kết, bấm Enter và KHÔNG có gì xảy ra.
          `tabIndex={-1}` không thêm điểm dừng Tab mới nhưng cho phép nhận tiêu điểm bằng mã —
          thiếu nó thì trang chỉ cuộn còn tiêu điểm vẫn kẹt trên thanh điều hướng. */}
      <main
        id={MAIN_CONTENT_ID}
        tabIndex={-1}
        className="mx-auto max-w-lg px-4 pb-[calc(4rem+var(--bnav-h))] pt-6 focus:outline-none sm:max-w-2xl lg:max-w-6xl lg:pt-12"
      >
        {/* Hero + điểm khác biệt: xếp dọc ở mobile (giữ nguyên thứ tự cũ), hai cột ở desktop.
            Dùng lưới CSS chứ không dựng hai nhánh DOM — thứ tự đọc và thứ tự Tab vẫn y hệt. */}
        <div className="lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-center lg:gap-12">
          <section className="text-center lg:text-left">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-500/15 text-accent-400 lg:mx-0">
              <Sparkles className="h-7 w-7" aria-hidden="true" />
            </div>
            <p className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-zinc-800 theme-light:border-zinc-200 bg-zinc-900/60 theme-light:bg-zinc-50 px-3 py-1 text-xs text-zinc-300 theme-light:text-zinc-700">
              <span className="font-semibold text-accent-400">Môn tiếng Anh</span>
              <span aria-hidden="true">·</span>
              <span>một môn của nền tảng Đồng hành cùng bạn</span>
            </p>
            <h1 className="text-2xl font-bold leading-tight sm:text-3xl lg:text-5xl lg:leading-[1.1]">
              Nói tiếng Anh với AI
              <br />
              <span className="text-accent-400">sai chỗ nào, được giảng lại bằng tiếng Việt</span>
            </h1>
            <p className="mt-3 text-base text-zinc-300 theme-light:text-zinc-700 lg:mt-5 lg:text-lg">
              Miễn phí. Không cần biết trước tiếng Anh vẫn học được.
            </p>

            <button
              type="button"
              onClick={handleCtaClick}
              className="tap-44 mt-6 w-full rounded-xl bg-accent-500 px-6 py-3.5 text-base font-semibold text-black transition hover:bg-accent-400 sm:w-auto sm:px-10"
            >
              Bắt đầu học miễn phí
            </button>
          </section>

          {/* Điểm khác biệt — ở desktop đây là cột PHẢI của hero: nó là lý do chọn sản phẩm này
            thay vì sản phẩm khác, nên phải đọc được cùng lúc với tiêu đề, không phải cuộn mới thấy. */}
          <section className="mt-10 rounded-2xl border border-accent-500/30 bg-accent-500/5 p-4 lg:mt-0 lg:p-6">
            <div className="flex items-start gap-3">
              <Volume2 className="mt-0.5 h-5 w-5 shrink-0 text-accent-400" aria-hidden="true" />
              <p className="text-sm text-zinc-300 lg:text-base lg:leading-relaxed">
                <strong className="text-zinc-100 theme-light:text-zinc-900">Điểm khác biệt:</strong>{' '}
                AI không chỉ sửa lỗi bằng chữ — mà còn{' '}
                <strong>đọc to lời giải thích bằng giọng tiếng Việt</strong>, trong khi hội thoại
                chính vẫn bằng giọng tiếng Anh chuẩn. Nội dung bài học sát với đời sống người Việt.
              </p>
            </div>
          </section>
        </div>

        {/* 3 chế độ — một cột ở mobile, ba cột ngang ở desktop: ba chế độ là các lựa chọn NGANG
            HÀNG nhau, xếp dọc làm chúng trông như ba bước nối tiếp. */}
        <section className="mt-8 lg:mt-16">
          <h2 className="text-center text-sm font-semibold text-zinc-500">3 chế độ luyện tập</h2>
          <div className="mt-4 space-y-3 lg:mt-8 lg:grid lg:grid-cols-3 lg:gap-5 lg:space-y-0">
            {MODES.map((mode) => (
              <div
                key={mode.title}
                className="flex items-start gap-3 rounded-xl border border-zinc-800 theme-light:border-zinc-200 bg-zinc-900/60 theme-light:bg-zinc-50 p-4 lg:flex-col lg:gap-4 lg:p-6"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-500/15 text-accent-400">
                  <mode.icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="font-semibold text-zinc-100 theme-light:text-zinc-900">
                    {mode.title}
                  </h3>
                  <p className="mt-0.5 text-sm text-zinc-300 theme-light:text-zinc-700">
                    {mode.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Hai khối cuối đứng CẠNH NHAU ở desktop: một khối nói giới hạn (thành thật), một khối
            nói phạm vi nền tảng — cùng là "thông tin cần biết trước khi đăng ký", nên đọc một
            lượt thay vì cuộn qua hai màn. */}
        <div className="lg:mt-16 lg:grid lg:grid-cols-2 lg:items-start lg:gap-6">
          {/* Giới hạn dùng — thành thật, không phóng đại */}
          <section className="mt-8 rounded-xl border border-zinc-800 theme-light:border-zinc-200 bg-zinc-900/40 theme-light:bg-zinc-50 p-4 text-center lg:mt-0 lg:p-6">
            <p className="text-sm text-zinc-300 theme-light:text-zinc-700">
              Miễn phí, có giới hạn lượt dùng mỗi ngày để mọi người cùng dùng được.
            </p>
          </section>

          {/* Không dừng ở môn tiếng Anh: cho người đọc biết tài khoản này dùng được cả nền tảng */}
          <section className="mt-8 rounded-2xl border border-zinc-800 theme-light:border-zinc-200 bg-zinc-900/40 theme-light:bg-zinc-50 p-4 lg:mt-0 lg:p-6">
            <h2 className="text-sm font-semibold text-zinc-100 theme-light:text-zinc-900">
              Tiếng Anh chỉ là một môn ở đây
            </h2>
            <p className="mt-1.5 text-sm text-zinc-300 theme-light:text-zinc-700">
              Cùng một tài khoản, bạn còn học Lập trình, Toán, Lý, Hoá, Sinh và ghi việc ở Ghi chú —
              cùng Bạn Đồng Hành, người bạn AI nhớ ngữ cảnh học của bạn qua mọi môn. Không phải mua
              thêm gói nào.
            </p>
            <a
              href="https://www.donghanhcungban.org"
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-accent-400 hover:underline"
            >
              Xem toàn bộ nền tảng →
            </a>
          </section>
        </div>

        <div className="mt-8 text-center lg:mt-14">
          <button
            type="button"
            onClick={handleCtaClick}
            className="tap-44 w-full rounded-xl bg-accent-500 px-6 py-3.5 text-base font-semibold text-black transition hover:bg-accent-400 sm:w-auto sm:px-10 lg:px-14 lg:py-4 lg:text-lg"
          >
            Đăng ký ngay — miễn phí
          </button>
        </div>
      </main>
    </div>
  )
}
