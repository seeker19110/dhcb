// StoryCard — thẻ 1 truyện ở danh sách (tab Truyện cổ tích / Truyện ngụ ngôn, trang /listening).
// Hiện cờ quốc gia, tiêu đề (ngôn ngữ đích lớn, bản dịch nhỏ), cấp CEFR, ước lượng thời gian nghe.
// Truyện đang đọc dở (docs/specs/2026-09-24-truyen-doc-tiep.md) hiện thêm nhãn "Đọc tiếp · N%"
// + thanh tiến độ mảnh; bấm vào thì StoryReader tự mở đúng đoạn đã lưu.
import { Headphones, ChevronRight, BookOpen } from 'lucide-react'
import type { StoryMeta } from '../data/stories/index'
import { estimateListenMinutes } from '../lib/stories'
import { storyProgressPercent, type StoryProgress } from '../lib/storyProgress'

interface Props {
  story: StoryMeta
  isA: boolean // true = đích tiếng Anh (tiêu đề lớn = titleEn), false = đích tiếng Việt
  onClick: () => void
  /** Vị trí đang đọc dở (null/undefined = chưa đọc hoặc đã đọc xong). */
  progress?: StoryProgress | null
}

export default function StoryCard({ story, isA, onClick, progress }: Props) {
  const minutes = estimateListenMinutes(story.lineCount)
  const mainTitle = isA ? story.titleEn : story.titleVi
  const subTitle = isA ? story.titleVi : story.titleEn
  const country = isA ? story.countryVi : story.countryEn
  const percent = progress ? storyProgressPercent(progress) : null

  return (
    <button
      onClick={onClick}
      className="text-left bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 hover:bg-zinc-800/60 active:scale-[0.98] transition group"
    >
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-lg leading-none" aria-hidden="true">
          {story.flag}
        </span>
        <span className="text-xs text-zinc-400 truncate">{country}</span>
        <span className="ml-auto text-[0.6875rem] px-2 py-0.5 rounded-full bg-accent-500/15 text-accent-300 theme-light:text-accent-800 font-medium shrink-0">
          {story.level}
        </span>
      </div>
      {/* [U4 · WCAG 3.1.2] tiêu đề mang ngôn ngữ của chính nó, không theo ngôn ngữ trang. */}
      <p
        lang={isA ? 'en' : 'vi'}
        className="font-bold text-base text-white leading-snug line-clamp-2"
      >
        {mainTitle}
      </p>
      <p lang={isA ? 'vi' : 'en'} className="text-xs text-zinc-400 mt-0.5 line-clamp-1">
        {subTitle}
      </p>
      {percent !== null && (
        <div className="mt-2">
          {/* Chữ mang đủ thông tin (thành tên truy cập của nút); thanh chỉ để nhìn nhanh nên
              aria-hidden — không cần role="progressbar" lồng trong một <button>. */}
          <span className="flex items-center gap-1 text-[0.6875rem] font-semibold text-accent-300 theme-light:text-accent-800">
            <BookOpen className="w-3 h-3" aria-hidden="true" />
            {isA ? `Đọc tiếp · đã đọc ${percent}%` : `Continue · ${percent}% read`}
          </span>
          <div className="mt-1 h-1 rounded-full bg-zinc-800 overflow-hidden" aria-hidden="true">
            <div className="h-full rounded-full bg-accent-500" style={{ width: `${percent}%` }} />
          </div>
        </div>
      )}
      <div className="flex items-center justify-between mt-2.5">
        <span className="flex items-center gap-1 text-[0.6875rem] text-zinc-400">
          <Headphones className="w-3 h-3" />
          {isA ? `~${minutes} phút` : `~${minutes} min`}
        </span>
        <ChevronRight className="w-3.5 h-3.5 text-content-muted group-hover:text-zinc-400 transition" />
      </div>
    </button>
  )
}
