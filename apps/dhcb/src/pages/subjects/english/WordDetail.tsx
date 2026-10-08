import { useEffect, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { BookOpen, Volume2, ArrowLeft } from 'lucide-react'
import { loadDictionary } from '../../../data/dictionary/loader'
import type { DictEntry } from '../../../types'
import { PageShell } from '@core/PageShell'
import { duongDanTuDien } from '../../../lib/englishRoutes'
import { buttonClass } from '@core/buttonStyles'
import LoadError from '../../../components/LoadError'
import { useAsyncLoad } from '../../../lib/useAsyncLoad'

// Trang CÔNG KHAI cho 1 từ trong từ điển — /tu-vung/:word — KHÔNG bọc RequireAuth. Đây là phần
// SEO thật: /dictionary (trang tra cứu chính) đang nằm sau RequireAuth nên Google không index
// được gì cả. Trang này lấy đúng dữ liệu công khai sẵn có (public/data/dictionary/*.json, chính
// loadDictionary() app đã dùng, không cần API riêng) nên không lộ gì thêm ngoài phạm vi từ điển.
//
// GIỚI HẠN THẬT cần biết: đây vẫn là app React thuần client-side (không SSR/prerender), nội
// dung chỉ có SAU KHI JS chạy xong. Googlebot render được JS nhưng chậm hơn HTML tĩnh và không
// phải mọi công cụ tìm kiếm khác làm được — đây KHÔNG phải giải pháp SEO tối ưu nhất (site
// prerender/SSG thật sẽ tốt hơn nhiều), nhưng là bước cải thiện thật so với "sau màn đăng nhập,
// không index được gì" hiện tại, và không cần đổi kiến trúc build của dự án.
export default function WordDetail() {
  const { word } = useParams<{ word: string }>()
  const nav = useNavigate()
  // [changelog 0525] Bản cũ `loadDictionary().then(...)` không có nhánh lỗi: tải từ điển hỏng là
  // vòng xoay quay mãi trên một trang công khai (người từ Google vào thấy trang "treo").
  const { state: dictState, retry } = useAsyncLoad(loadDictionary, {
    errorMessage: 'Chưa tải được từ điển. Kiểm tra kết nối rồi thử lại.',
  })
  // undefined = đang tải (hoặc lỗi), null = không tìm thấy
  const entry = useMemo<DictEntry | null | undefined>(() => {
    if (dictState.status !== 'ready') return undefined
    return dictState.data.find((e) => e.word.toLowerCase() === word?.toLowerCase()) ?? null
  }, [dictState, word])

  // SEO: title/description theo đúng từ, cùng cách các landing page khác trong dự án đang làm
  // (set qua document API, trả lại thẻ gốc lúc rời trang — không dùng react-helmet).
  useEffect(() => {
    if (!entry) return
    const prevTitle = document.title
    const title = `${entry.word} nghĩa là gì? Phiên âm, ví dụ song ngữ | Gia sư tiếng Anh AI`
    document.title = title

    const metaDesc = document.querySelector<HTMLMetaElement>('meta[name="description"]')
    const prevDesc = metaDesc?.content
    if (metaDesc) {
      metaDesc.content = `${entry.word}: ${entry.vi}. Ví dụ: "${entry.ex_en}" — "${entry.ex_vi}". Học miễn phí cùng gia sư AI.`
    }

    return () => {
      document.title = prevTitle
      if (metaDesc && prevDesc !== undefined) metaDesc.content = prevDesc
    }
  }, [entry])

  if (dictState.status === 'error') {
    return (
      <div className="min-h-dvh bg-zinc-950 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <LoadError
            message={dictState.message}
            onRetry={retry}
            hint="Thường chỉ là lỗi kết nối tạm thời."
          />
        </div>
      </div>
    )
  }

  if (entry === undefined) {
    return (
      <div
        className="min-h-dvh bg-zinc-950 flex items-center justify-center"
        role="status"
        aria-label="Đang tải từ điển"
      >
        <div className="w-6 h-6 border-2 border-zinc-700 border-t-accent-500 rounded-full animate-spin" />
      </div>
    )
  }

  if (entry === null) {
    return (
      <div className="min-h-dvh bg-zinc-950 flex flex-col items-center justify-center px-4 text-center">
        <p className="text-zinc-300 text-sm mb-4">Không tìm thấy từ "{word}" trong từ điển.</p>
        <button
          type="button"
          onClick={() => nav('/welcome')}
          className="tap-44 text-accent-400 theme-light:text-accent-700 underline underline-offset-2 text-sm"
        >
          Về trang chủ
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-zinc-950 text-zinc-100">
      {/* [2026-09-02, đợt 4 thiết kế lại desktop] Trang từ vựng công khai, chữ để đọc → width reading. */}
      <PageShell
        width="reading"
        baseWidth="max-w-xl"
        className="!pt-8 !pb-[calc(1.5rem+var(--bnav-h))]"
      >
        <Link
          to="/welcome"
          className="tap-44 inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-200 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Gia sư tiếng Anh AI
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <div className="w-11 h-11 rounded-2xl bg-accent-500/15 text-accent-400 flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{entry.word}</h1>
            {entry.ipa_en && (
              <p className="text-sm text-zinc-400 flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5" aria-hidden="true" />/{entry.ipa_en}/
              </p>
            )}
          </div>
        </div>

        {entry.level && (
          <span className="inline-block mt-2 mb-4 rounded-full bg-accent-500/10 border border-accent-500/30 px-2.5 py-1 text-xs font-medium text-accent-400 theme-light:text-accent-700">
            Cấp {entry.level}
          </span>
        )}

        <section className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
          <p className="text-xs font-semibold text-zinc-500 mb-1">Nghĩa ({entry.pos})</p>
          <p className="text-lg text-zinc-100">{entry.vi}</p>
        </section>

        {entry.ex_en && (
          <section className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
            <p className="text-xs font-semibold text-zinc-500 mb-2">Ví dụ</p>
            <p className="text-zinc-200">{entry.ex_en}</p>
            <p className="text-sm text-zinc-400 mt-1">{entry.ex_vi}</p>
          </section>
        )}

        {entry.base && (
          <p className="mt-4 text-sm text-zinc-400">
            Dạng biến thể của{' '}
            <Link
              to={duongDanTuDien(entry.base)}
              className="text-accent-400 theme-light:text-accent-700 underline underline-offset-2"
            >
              {entry.base}
            </Link>
          </p>
        )}

        <div className="mt-8 rounded-2xl border border-accent-500/30 bg-accent-500/5 p-4 text-center">
          <p className="text-sm text-zinc-300 mb-3">
            Muốn học và ghi nhớ từ này? Luyện cùng gia sư AI — sửa lỗi bằng giọng tiếng Việt, miễn
            phí.
          </p>
          <button
            type="button"
            onClick={() => nav('/welcome')}
            className={buttonClass({ size: 'lg' })}
          >
            Học miễn phí ngay
          </button>
        </div>
      </PageShell>
    </div>
  )
}
