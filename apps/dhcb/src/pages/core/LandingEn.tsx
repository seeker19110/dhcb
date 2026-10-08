import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { MessageCircle, Mic, PenLine, Volume2, Sparkles } from 'lucide-react'
import { track } from '../../lib/analytics'
import ThemeToggle from '../../components/ThemeToggle'
import { setDirection } from '../../lib/storage'
import { MAIN_CONTENT_ID } from '@core/PageShell'
import { useDocumentLangOverride } from '../../lib/documentLang'
import { buttonClass } from '@core/buttonStyles'

// Landing page TIẾNG ANH cho chiều B (người nước ngoài học tiếng Việt) — ngách gần như trống
// (xem docs/research/chien-luoc-marketing-2026-07-25.md §2.1). Song song với src/pages/Landing.tsx
// (chiều A, tiếng Việt) — KHÔNG gộp chung 1 component vì đối tượng, kênh phân phối (Reddit/expat
// group vs TikTok VN) và ngôn ngữ nội dung khác hẳn nhau, gộp lại sẽ rối hơn là tách.
const TITLE =
  'Learn Vietnamese by Speaking with AI — Corrections Explained in English | Đồng Hành Cùng Bạn'
const DESCRIPTION =
  'Practice real Vietnamese conversation with an AI tutor. Mistakes are explained back to you in English, in a real Vietnamese voice. Free. One subject inside Đồng Hành Cùng Bạn, a personal companion platform.'

const MODES = [
  {
    icon: MessageCircle,
    title: 'Chat practice',
    desc: 'Friendly conversation with AI, corrections explained in English as you go.',
  },
  {
    icon: PenLine,
    title: 'Writing + scoring',
    desc: 'Get your writing scored, mistakes highlighted, band estimate given.',
  },
  {
    icon: Mic,
    title: 'Bilingual speaking',
    desc: 'Speak Vietnamese, AI replies in a real Vietnamese voice — corrections explained in English.',
  },
] as const

export default function LandingEn() {
  const nav = useNavigate()
  const [searchParams] = useSearchParams()

  // WCAG 3.1.1 (audit C5): cả trang là tiếng Anh, kể cả khi giao diện người dùng đang là vi.
  useDocumentLangOverride('en')

  // SEO: set title + meta description ngay khi vào trang — cùng cách Landing.tsx (chiều A)
  // đang làm, đọc chú thích ở đó để biết vì sao document API thay vì react-helmet.
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

  useEffect(() => {
    track('landing_view', { path: '/learn-vietnamese' })
  }, [])

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
    track('cta_click', { path: '/learn-vietnamese' })
    // Đặt sẵn chiều B (đích=Việt, giải thích=Anh) TRƯỚC khi vào đăng ký — người từ landing này
    // đang tìm học tiếng Việt, không phải tiếng Anh. Không đặt thì họ vào app sẽ thấy mặc định
    // chiều A (học tiếng Anh) và phải tự tìm nút đổi chiều trong Hồ sơ, dễ bỏ cuộc luôn từ đầu.
    setDirection('B')
    nav('/login')
  }

  return (
    <div className="min-h-dvh bg-zinc-950 text-zinc-100">
      <header className="mx-auto flex max-w-lg justify-end px-4 pt-4 sm:max-w-2xl lg:max-w-6xl">
        <ThemeToggle />
      </header>
      {/* [2026-09-02] Tầng desktop — cùng công thức với bản tiếng Việt (`Landing.tsx`): mọi
          thay đổi nằm sau `lg:` nên dưới 1024px không đổi gì; chỗ thừa dùng để đặt cạnh nhau
          những khối vốn phải cuộn mới thấy, không dùng để kéo dài dòng chữ. */}
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
        {/* Hero + điểm khác biệt: xếp dọc ở mobile, hai cột ở desktop (lưới CSS, một nhánh DOM). */}
        <div className="lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-center lg:gap-12">
          <section className="text-center lg:text-left">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-500/15 text-accent-400 lg:mx-0">
              <Sparkles className="h-7 w-7" aria-hidden="true" />
            </div>
            <p className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900/60 px-3 py-1 text-xs text-zinc-300">
              <span className="font-semibold text-accent-400 theme-light:text-accent-700">
                Language subject
              </span>
              <span aria-hidden="true">·</span>
              <span>
                part of the <span lang="vi">Đồng Hành Cùng Bạn</span> platform
              </span>
            </p>
            <h1 className="text-2xl font-bold leading-tight sm:text-3xl lg:text-4xl lg:leading-[1.15] xl:text-5xl xl:leading-[1.1]">
              Learn Vietnamese with AI
              <br />
              <span className="text-accent-400 theme-light:text-accent-700">
                mistakes explained back to you in English
              </span>
            </h1>
            <p className="mt-3 text-base text-zinc-300 lg:mt-5 lg:text-lg">
              Free. No prior Vietnamese needed to get started.
            </p>

            <button
              type="button"
              onClick={handleCtaClick}
              className={buttonClass({ size: 'lg', fullWidth: true, className: 'mt-6 sm:w-auto' })}
            >
              Start learning free
            </button>
          </section>

          {/* Điểm khác biệt — cột PHẢI của hero ở desktop: đây là lý do chọn sản phẩm này, nên
            phải đọc được cùng lúc với tiêu đề chứ không phải cuộn mới thấy. */}
          <section className="mt-10 rounded-2xl border border-accent-500/30 bg-accent-500/5 p-4 lg:mt-0 lg:p-6">
            <div className="flex items-start gap-3">
              <Volume2 className="mt-0.5 h-5 w-5 shrink-0 text-accent-400" aria-hidden="true" />
              <p className="text-sm text-zinc-300 lg:text-base lg:leading-relaxed">
                <strong className="text-zinc-100">What's different:</strong> The AI doesn't just
                correct your text — it{' '}
                <strong>reads the explanation back to you in a real English voice</strong>, while
                the conversation itself stays in natural Vietnamese. Content is grounded in everyday
                Vietnamese life, not textbook phrases.
              </p>
            </div>
          </section>
        </div>

        {/* 3 chế độ — ba lựa chọn NGANG HÀNG nhau nên xếp ngang ở desktop. */}
        <section className="mt-8 lg:mt-16">
          <h2 className="text-center text-sm font-semibold text-zinc-500">Three practice modes</h2>
          <div className="mt-4 space-y-3 lg:mt-8 lg:grid lg:grid-cols-3 lg:gap-5 lg:space-y-0">
            {MODES.map((mode) => (
              <div
                key={mode.title}
                className="flex items-start gap-3 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 lg:flex-col lg:gap-4 lg:p-6"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-500/15 text-accent-400">
                  <mode.icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="font-semibold text-zinc-100">{mode.title}</h3>
                  <p className="mt-0.5 text-sm text-zinc-300">{mode.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Giới hạn dùng — thành thật, không phóng đại */}
        <section className="mt-8 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 text-center lg:mt-16 lg:p-6">
          <p className="text-sm text-zinc-300">
            Free, with a daily usage limit so everyone gets a fair share.
          </p>
        </section>

        <div className="mt-8 text-center lg:mt-14">
          <button
            type="button"
            onClick={handleCtaClick}
            className={buttonClass({
              size: 'lg',
              fullWidth: true,
              className: 'sm:w-auto sm:px-10 lg:h-14 lg:px-14 lg:text-lg',
            })}
          >
            Sign up free
          </button>
        </div>
      </main>
    </div>
  )
}
