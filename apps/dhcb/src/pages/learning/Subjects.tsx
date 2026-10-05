// apps/dhcb/src/pages/Subjects.tsx — Multi-Subject Learning Hub & AI Diagnostic Studio
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePageTitle } from '../../lib/usePageTitle'
import {
  BookOpen,
  Calculator,
  Atom,
  FlaskConical,
  Dna,
  ChevronRight,
  GraduationCap,
  Layers,
  Sparkles,
  Search,
  Brain,
  Bot,
} from 'lucide-react'
import Layout from '../../components/Layout'
import { PageShell } from '@core/PageShell'
import PageHeader from '../../components/PageHeader'
import SubjectIllustration from '../../components/SubjectIllustration'
import { listSubjects } from '../../lib/subjectApi'
import type { SubjectManifest } from '@dhcb/core-contracts/subjectManifest'
import { goToSubjects } from '../../lib/subjectsHost'

const SUBJECT_ICONS: Record<string, typeof BookOpen> = {
  english: BookOpen,
  mathematics: Calculator,
  physics: Atom,
  chemistry: FlaskConical,
  biology: Dna,
}

const SUBJECT_COLORS: Record<
  string,
  { gradient: string; text: string; bg: string; border: string }
> = {
  english: {
    gradient: 'from-emerald-500 to-teal-400',
    text: 'text-emerald-400 theme-light:text-emerald-800',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30 hover:border-emerald-500/60',
  },
  mathematics: {
    gradient: 'from-blue-500 to-cyan-400',
    text: 'text-blue-400 theme-light:text-blue-800',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30 hover:border-blue-500/60',
  },
  physics: {
    gradient: 'from-purple-500 to-indigo-400',
    text: 'text-purple-400 theme-light:text-purple-800',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/30 hover:border-purple-500/60',
  },
  chemistry: {
    gradient: 'from-amber-500 to-orange-400',
    text: 'text-amber-400 theme-light:text-amber-800',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30 hover:border-amber-500/60',
  },
  biology: {
    gradient: 'from-rose-500 to-pink-400',
    text: 'text-rose-400 theme-light:text-rose-800',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/30 hover:border-rose-500/60',
  },
}

export default function Subjects() {
  usePageTitle('Môn học | Đồng hành cùng bạn')
  const nav = useNavigate()
  const [subjects, setSubjects] = useState<SubjectManifest[]>([])
  const [filter, setFilter] = useState<'all' | 'language' | 'stem'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)

  // Đổi bộ lọc → bật lại spinner NGAY TRONG RENDER (pattern so-sánh-prev, không
  // setState đồng bộ trong effect); mount đầu đã mặc định loading=true.
  const [prevFilter, setPrevFilter] = useState(filter)
  if (filter !== prevFilter) {
    setPrevFilter(filter)
    setLoading(true)
  }

  useEffect(() => {
    listSubjects(filter === 'all' ? undefined : filter)
      .then(setSubjects)
      .catch(() => setSubjects([]))
      .finally(() => setLoading(false))
  }, [filter])

  const filteredSubjects = subjects.filter((s) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      s.label.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q) ||
      s.id.toLowerCase().includes(q)
    )
  })

  return (
    <div className="min-h-dvh bg-zinc-950 text-zinc-100">
      <Layout onBack={() => nav('/')} />

      {/* [2026-09-02, đợt 4 thiết kế lại desktop] Lưới môn học → width standard. */}
      <PageShell width="standard" baseWidth="max-w-4xl" className="space-y-6">
        <PageHeader
          title="Không Gian Môn Học & Gia Sư AI"
          subtitle="Học tập và giải bài tập tương tác đa môn cùng AI: Tiếng Anh, Toán học, Vật lý, Hóa học & Sinh học"
        />

        {/* AI Multi-Subject Diagnostic & Adaptive Recommendation Card */}
        <section
          aria-label="Đánh giá & Gợi ý lộ trình AI"
          className="relative overflow-hidden rounded-3xl border border-accent-500/30 bg-gradient-to-br from-zinc-900/95 via-zinc-900/90 to-blue-950/40 p-5 sm:p-6 shadow-xl backdrop-blur-md animate-fade-up"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg p-3">
                <Brain className="w-full h-full" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-accent-400 theme-light:text-accent-800 bg-accent-500/15 px-2 py-0.5 rounded-full border border-accent-500/25">
                    AI Socratic Tutor
                  </span>
                  <span className="text-xs text-zinc-400 font-medium">Học cùng gia sư AI</span>
                </div>
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Bắt Đầu Từ Đâu Hôm Nay
                </h2>
              </div>
            </div>
          </div>

          {/* [Rà UI/UX 2026-08-28] Ô này trước đây in "Tiến độ tổng thể: 78%" và một
              "khuyến nghị của AI" nêu đích danh hai chủ đề — TẤT CẢ đều là chuỗi cứng
              trong mã, không đọc từ dữ liệu người dùng: ai mở trang cũng thấy y hệt,
              kể cả người vừa đăng ký. Đã bỏ hẳn thay vì tô lại, vì con số bịa làm hỏng
              lòng tin nặng hơn là không có con số nào. Hai nút bên dưới là điều hướng
              thật nên giữ nguyên. */}
          <p className="text-xs sm:text-sm text-zinc-300 mt-3 leading-relaxed">
            Chọn một môn bên dưới để vào phòng học, hoặc mở thẳng hai lối tắt hay dùng nhất:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-4">
            <button
              onClick={() => goToSubjects(nav, 'mathematics')}
              className="tap-44 flex items-center justify-between p-3 rounded-2xl bg-zinc-950/70 hover:bg-zinc-800 border border-blue-500/30 hover:border-blue-500/60 text-left transition-all active:scale-[0.98] group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Calculator className="w-4 h-4 text-blue-400 theme-light:text-blue-800 shrink-0" />
                <span className="text-xs font-semibold text-zinc-200 truncate">
                  Giải bài tập Toán 12 từng bước
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-blue-400 theme-light:text-blue-800 group-hover:translate-x-1 transition-transform shrink-0" />
            </button>

            <button
              onClick={() => nav('/ung-dung-thuc-te')}
              className="tap-44 flex items-center justify-between p-3 rounded-2xl bg-zinc-950/70 hover:bg-zinc-800 border border-cyan-500/30 hover:border-cyan-500/60 text-left transition-all active:scale-[0.98] group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Sparkles className="w-4 h-4 text-cyan-400 theme-light:text-cyan-800 shrink-0" />
                <span className="text-xs font-semibold text-zinc-200 truncate">
                  10 Phòng thí nghiệm Simulators
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-cyan-400 theme-light:text-cyan-800 group-hover:translate-x-1 transition-transform shrink-0" />
            </button>
          </div>
        </section>

        {/* Search & Topic Filters */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm môn học, công thức hoặc chủ đề..."
              className="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-zinc-900/80 border border-zinc-800 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-accent-500 transition"
            />
          </div>

          <div className="flex gap-1.5 justify-center flex-wrap">
            <button
              onClick={() => setFilter('all')}
              className={`tap-44 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
                filter === 'all'
                  ? 'bg-accent-500 text-black shadow-md shadow-accent-500/20'
                  : 'bg-zinc-900/80 border border-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              Tất cả môn
            </button>
            <button
              onClick={() => setFilter('language')}
              className={`tap-44 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
                filter === 'language'
                  ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/20'
                  : 'bg-zinc-900/80 border border-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              Ngôn ngữ
            </button>
            <button
              onClick={() => setFilter('stem')}
              className={`tap-44 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
                filter === 'stem'
                  ? 'bg-blue-500 text-black shadow-md shadow-blue-500/20'
                  : 'bg-zinc-900/80 border border-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              Khoa học STEM
            </button>
          </div>
        </div>

        {/* Banner dẫn vào Phòng Thí Nghiệm Mô Phỏng Ứng Dụng Thực Tế */}
        {/* Trước đây là <div onClick>: không focus/Enter được bằng bàn phím. */}
        <button
          type="button"
          onClick={() => nav('/ung-dung-thuc-te')}
          className="tap-44 w-full text-left p-5 rounded-3xl bg-gradient-to-r from-accent-600/20 via-blue-600/20 to-purple-600/20 border border-accent-500/40 hover:border-accent-500/80 cursor-pointer transition-all flex items-center justify-between group shadow-lg active:scale-[0.99]"
        >
          <div className="flex items-center gap-4">
            <div className="p-3.5 rounded-2xl bg-accent-500/20 text-accent-400 theme-light:text-accent-800 group-hover:scale-110 transition">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] px-2 py-0.5 rounded bg-accent-500/20 text-accent-300 theme-light:text-accent-800 font-bold">
                  MỚI: REAL-LIFE LAB
                </span>
                <span className="text-xs text-zinc-400">10 Simulators Tương Tác</span>
              </div>
              <h2 className="text-base font-bold text-white mt-1 group-hover:text-accent-300 transition">
                Phòng Thí Nghiệm Mô Phỏng & Ứng Dụng Thực Tế
              </h2>
              <p className="text-xs text-zinc-300 mt-0.5">
                Xem ngay công thức Toán, Lý, Hóa, Sinh giải quyết bài toán tiền điện, lãi kép, giảm
                mỡ, vệ tinh GPS ra sao.
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-accent-400 theme-light:text-accent-800 group-hover:translate-x-1 transition shrink-0 ml-2" />
        </button>

        {/* Danh sách thẻ môn học */}
        <h2 className="sr-only">Danh sách môn học</h2>
        {loading ? (
          <div className="text-center py-12 text-zinc-500 text-sm flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-accent-400 animate-ping" />
            <span>Đang tải danh mục môn học…</span>
          </div>
        ) : filteredSubjects.length === 0 ? (
          <div className="text-center py-12 text-zinc-400 text-sm bg-zinc-900/60 rounded-3xl border border-zinc-800">
            {/* [Sửa lỗi 2026-09-05] Trước đây câu này luôn đổ tại từ khoá, kể cả khi ô tìm kiếm
                TRỐNG — lúc đó nó in ra `khớp với từ khóa ""`, vừa vô nghĩa vừa đổ lỗi cho thao
                tác mà người dùng chưa hề làm. Danh sách rỗng khi không có từ khoá là chuyện
                khác hẳn (bộ lọc không có môn nào, hoặc tải danh mục hỏng), nên phải nói khác. */}
            {searchQuery.trim()
              ? `Không tìm thấy môn học nào khớp với từ khóa "${searchQuery.trim()}".`
              : 'Chưa có môn học nào trong mục này. Thử chọn "Tất cả môn" hoặc tải lại trang.'}
          </div>
        ) : (
          /* Ở 1440px cột nội dung rộng ~1150px, đủ chỗ cho BA thẻ ~360px — sáu môn hiện tại
             vừa đúng hai hàng, thấy hết một lần thay vì cuộn ba hàng. Dưới xl giữ 2 cột.
             `items-stretch` + `h-full` trên thẻ: thẻ cùng hàng cao bằng nhau nên nút "Vào
             phòng học" thẳng một đường, thay vì so le theo độ dài mô tả. */
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 items-stretch">
            {filteredSubjects.map((sub, subIdx) => {
              const Icon = SUBJECT_ICONS[sub.id] || BookOpen
              const style = SUBJECT_COLORS[sub.id] || SUBJECT_COLORS.english!

              return (
                <div
                  key={sub.id}
                  className={`relative h-full overflow-hidden bg-zinc-900/80 rounded-3xl border transition-all flex flex-col justify-between group shadow-sm hover:shadow-lg animate-fade-up ${style.border}`}
                  style={{ animationDelay: `${subIdx * 80}ms` }}
                >
                  {/* Illustration nền mờ — góc phải trên */}
                  <div
                    className="absolute top-0 right-0 opacity-[0.08] pointer-events-none select-none"
                    aria-hidden="true"
                  >
                    <SubjectIllustration subjectId={sub.id} size="hero" />
                  </div>

                  <div className="relative p-5">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${style.gradient} flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform`}
                        >
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-white group-hover:text-accent-300 transition-colors">
                            {sub.label}
                          </h3>
                          <span
                            className={`inline-block text-[11px] px-2 py-0.5 rounded-full font-semibold mt-0.5 uppercase ${
                              sub.category === 'language'
                                ? 'bg-emerald-500/15 text-emerald-300 theme-light:text-emerald-800 border border-emerald-500/20'
                                : 'bg-blue-500/15 text-blue-300 theme-light:text-blue-800 border border-blue-500/20'
                            }`}
                          >
                            {sub.category}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs px-2.5 py-1 rounded-xl bg-zinc-800/80 text-zinc-400 border border-zinc-700/80 shrink-0">
                        {sub.taxonomyKind === 'cefr' ? 'Chuẩn CEFR' : 'Theo Khối Lớp'}
                      </span>
                    </div>

                    {/* Illustration nhỏ nổi bật — chỉ hiện dưới md; từ md trở lên đã có hình
                        nền mờ ở góc phải trên nên bỏ đi cho đỡ rối.

                        [Sửa lỗi 2026-09-05] Trước đây chỗ này có HAI thẻ `<p>` cùng in
                        `sub.description`: một trong khối `flex … md:block`, một là
                        `hidden md:block`. Ý định là "dưới md hình đứng cạnh chữ, từ md trở lên
                        chỉ còn chữ", nhưng `md:block` chỉ đổi `display` chứ KHÔNG ẩn khối thứ
                        nhất — chỉ mỗi cái hình bên trong mới `md:hidden`. Hệ quả: từ 768px trở
                        lên mô tả môn học hiện HAI LẦN trong mọi thẻ (thấy rõ trong ảnh chụp
                        1440px của đợt này). Nay chỉ còn một `<p>` duy nhất: từ md trở lên hình
                        bị ẩn nên khối flex còn đúng một con, trông y hệt `block`. */}
                    {/* `mb-3 md:mb-4`: giữ ĐÚNG khoảng cách của cả hai khuôn cũ — dưới md
                        khối flex cũ dùng `mb-3`, từ md trở lên thẻ `<p>` cũ dùng `mb-4`. */}
                    <div className="flex items-start gap-4 mb-3 md:mb-4">
                      <div className="shrink-0 md:hidden animate-float">
                        <SubjectIllustration subjectId={sub.id} size="md" />
                      </div>
                      <p className="text-sm text-zinc-300 leading-relaxed">{sub.description}</p>
                    </div>

                    {/* Mức độ chuẩn hóa */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                        <GraduationCap className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                        <span>Cấp độ:</span>
                        <div className="flex gap-1 flex-wrap">
                          {sub.standardLevels.map((lvl) => (
                            <span
                              key={lvl}
                              className="px-1.5 py-0.5 rounded bg-zinc-950 text-zinc-300 border border-zinc-800 text-[11px] uppercase font-mono"
                            >
                              {lvl.replace('grade_', 'Lớp ')}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                        <Layers className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                        <span>Chế độ chấm:</span>
                        <span className="text-zinc-300">
                          {sub.evaluationModes.map((m) => m.replace('_', ' ')).join(', ')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Nút hành động */}
                  <div className="relative px-5 pb-5">
                    <button
                      onClick={() => {
                        if (sub.id === 'english') {
                          nav('/hoc-tieng-anh')
                        } else if (sub.id === 'programming') {
                          nav('/lap-trinh')
                        } else {
                          nav(`/mon-hoc/${sub.id}`)
                        }
                      }}
                      className={`w-full tap-44 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold transition active:scale-[0.98] ${
                        sub.id === 'english'
                          ? 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-md'
                          : 'bg-accent-500 hover:bg-accent-400 text-black shadow-md'
                      }`}
                    >
                      <Bot className="w-4 h-4" />
                      <span>
                        {sub.id === 'english'
                          ? 'Vào Không Gian Học Tiếng Anh'
                          : sub.id === 'programming'
                            ? 'Vào Lộ Trình Lập Trình'
                            : 'Vào phòng học & Giải đề AI'}
                      </span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </PageShell>
    </div>
  )
}
