// apps/dhcb/src/pages/subjects/english/lessons/LessonList.tsx — tách từ pages/subjects/english/Lessons.tsx (1.693 dòng) ngày 2026-09-06, mã GIỮ NGUYÊN.

import { useState, useRef, useEffect, useMemo } from 'react'
import { Loader2 } from 'lucide-react'
import { type LessonMeta } from '../../../../data/lessons/loader'
import { PAGE_SIZE, getColor } from './shared'

// ── Danh sách bài học — nhận query từ cha, IntersectionObserver lazy load ─────
export function LessonList({
  lessons,
  isA,
  query,
  onSelect,
  compact = false,
  selectedId,
}: {
  lessons: LessonMeta[]
  isA: boolean
  query: string
  onSelect: (meta: LessonMeta) => void
  /**
   * Khuôn GỌN cho cột phụ desktop (master–detail): luôn MỘT cột và thẻ nhỏ lại. Rail rộng
   * 288–320px, không đủ chỗ cho lưới 2 cột lẫn dòng "N lượt thoại" — nhồi vào thì chữ bị cắt.
   */
  compact?: boolean
  /** Mã bài đang mở ở cột phải — tô đậm để người dùng biết mình đang ở đâu trong danh sách. */
  selectedId?: number
}) {
  const [visible, setVisible] = useState(PAGE_SIZE)
  const sentinelRef = useRef<HTMLDivElement>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return lessons
    return lessons.filter(
      (l) => l.title.toLowerCase().includes(q) || l.situation.toLowerCase().includes(q),
    )
  }, [query, lessons])

  // Đổi từ khóa tìm kiếm → thu về trang đầu — pattern so-sánh-prev ngay trong render.
  const [prevQuery, setPrevQuery] = useState(query)
  if (query !== prevQuery) {
    setPrevQuery(query)
    setVisible(PAGE_SIZE)
  }

  useEffect(() => {
    const el = sentinelRef.current
    if (!el || visible >= filtered.length) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) setVisible((v) => Math.min(v + PAGE_SIZE, filtered.length))
      },
      { rootMargin: '300px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [visible, filtered.length])

  const shown = filtered.slice(0, visible)

  return (
    <div className="space-y-4">
      {query.trim() && (
        <p className="text-xs text-zinc-400 px-1">
          {filtered.length} {isA ? 'bài phù hợp' : 'lessons found'}
        </p>
      )}

      {/* Cards màu sắc — grid 2 cột trên màn rộng; khuôn `compact` luôn một cột. */}
      <div className={compact ? 'space-y-1.5' : 'grid grid-cols-1 sm:grid-cols-2 gap-3'}>
        {shown.map((l) => {
          const c = getColor(l.id)
          const isSelected = l.id === selectedId
          return (
            <button
              key={l.id}
              id={`lesson-card-${l.id}`}
              onClick={() => onSelect(l)}
              // `aria-current="true"` chứ không chỉ đổi màu: người dùng trình đọc màn hình
              // cũng cần biết mục nào đang mở, mà màu thì họ không thấy.
              aria-current={isSelected ? 'true' : undefined}
              className={`text-left w-full border transition-all group ${
                compact ? 'rounded-xl p-2.5' : 'rounded-xl p-3.5 active:scale-[0.98]'
              } ${
                isSelected
                  ? `bg-zinc-800 ${c.border} ring-1 ring-inset ring-accent-500/40`
                  : `bg-zinc-900/80 hover:bg-zinc-800/60 ${c.border}`
              }`}
            >
              <div className={`flex items-start ${compact ? 'gap-2.5' : 'gap-3'}`}>
                {/* Số bài + chấm màu */}
                <div
                  className={`${compact ? 'w-7 h-7' : 'w-8 h-8'} rounded-lg ${c.bg} flex items-center justify-center shrink-0 mt-0.5`}
                >
                  <span id={`lesson-card-${l.id}-number`} className={`text-xs font-bold ${c.text}`}>
                    {l.id}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  {/* [U4 · WCAG 3.1.2] tên bài + tình huống trong dữ liệu luôn là tiếng Việt —
                      ở chiều B (giao diện tiếng Anh) phải báo cho trình đọc màn hình. */}
                  <p
                    lang="vi"
                    id={`lesson-card-${l.id}-title`}
                    className={`font-semibold leading-snug ${compact ? 'text-sm' : 'text-[0.9375rem]'} ${c.text}`}
                  >
                    {l.title}
                  </p>
                  <p
                    lang="vi"
                    id={`lesson-card-${l.id}-situation`}
                    className="text-xs text-zinc-400 break-words mt-0.5"
                  >
                    {l.situation}
                  </p>
                  {/* Dòng "N lượt thoại" chỉ có chỗ ở khuôn rộng. Đếm TỪNG lượt nói (không chia
                      đôi thành cặp) — cùng cách đếm với trang bài ("Lượt 20"), link `#luot-N`
                      và dòng mô tả "Mỗi bài 10–20 đoạn" (turnCount thật 10–20). */}
                  {!compact && (
                    <p className="text-[0.6875rem] text-zinc-400 mt-1.5">
                      {l.turnCount} {isA ? 'lượt thoại' : 'turns'}
                    </p>
                  )}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {shown.length === 0 && (
        <p className="text-center text-zinc-400 py-10 text-sm">
          {isA ? 'Không tìm thấy bài nào.' : 'No lessons found.'}
        </p>
      )}

      {/* Sentinel — cuộn tới đây tự động tải thêm */}
      {visible < filtered.length && (
        <div ref={sentinelRef} className="flex justify-center py-6">
          <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
        </div>
      )}
    </div>
  )
}
