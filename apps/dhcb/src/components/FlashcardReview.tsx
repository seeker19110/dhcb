// FlashcardReview — MÀN LẬT THẺ dùng chung cho mọi môn có thẻ hỏi-đáp (S12-1).
//
// Tách nguyên vẹn từ `pages/subjects/programming/ProgrammingReview.tsx` (PR-L10) để môn Lập
// trình và bốn môn STEM dùng CHUNG một màn ôn: hai bản chép tay là hai cách hỏng khác nhau về
// a11y, vùng chạm và nhịp học.
//
// NHỊP CỦA MÀN ÔN (cố ý, không được rút gọn): hiện câu hỏi → học viên NGHĨ đã rồi mới bấm
// "Xem đáp án" → tự đánh giá 4 mức. Bắt nghĩ trước khi thấy đáp án chính là thứ tạo ra trí nhớ;
// hiện sẵn cả hai mặt thì học viên chỉ đọc lướt và tưởng mình nhớ.
//
// Component KHÔNG tự đọc/ghi kho SRS: nó nhận `cards` đã dựng sẵn và gọi `onRate` — nơi gọi mới
// là nơi biết phải ghi qua hàm nào (`reviewProgCard` · `reviewStemCard`). Nhờ vậy S12 không mở
// thêm một đường ghi nào vào lịch ôn.
import { useState, type ReactNode } from 'react'
import { Eye, Trophy } from 'lucide-react'
import type { Rating } from '../lib/srs'
import { buttonClass } from '@core/buttonStyles'

/** Một thẻ đủ để hiện: khoá để chấm, hai mặt, và tên bài để học viên biết thẻ từ đâu ra. */
export interface FlashcardItem {
  key: string
  hoi: string
  dap: string
  lessonTitle: string
}

/** 4 mức tự đánh giá — nhãn nói bằng lời người học, không dùng thuật ngữ FSRS. */
const MUC: { rating: Rating; nhan: string; mau: string }[] = [
  { rating: 'again', nhan: 'Quên rồi', mau: 'border-rose-500/40 hover:border-rose-400' },
  { rating: 'hard', nhan: 'Khó nhớ', mau: 'border-amber-500/40 hover:border-amber-400' },
  { rating: 'good', nhan: 'Nhớ được', mau: 'border-emerald-500/40 hover:border-emerald-400' },
  { rating: 'easy', nhan: 'Quá dễ', mau: 'border-sky-500/40 hover:border-sky-400' },
]

export interface FlashcardReviewProps {
  cards: readonly FlashcardItem[]
  /** Chấm một thẻ. Nơi gọi tự quyết định ghi qua hàm nào của môn mình. */
  onRate: (key: string, rating: Rating) => void
  /** Trần số thẻ của phiên — cắt ngay ở đây để mọi nơi dùng chung một luật. */
  cap?: number
  /** Chữ + nút hiện khi phiên kết thúc (mỗi môn nói một kiểu). */
  xongPhien?: (daOn: number) => ReactNode
  /** Nút phụ dưới thẻ, ví dụ "Mở lại bài này" — nơi gọi tự dựng vì URL là của môn. */
  duoiThe?: (card: FlashcardItem) => ReactNode
}

export default function FlashcardReview({
  cards,
  onRate,
  cap,
  xongPhien,
  duoiThe,
}: FlashcardReviewProps) {
  const [viTri, setViTri] = useState(0)
  const [hienDap, setHienDap] = useState(false)
  const [daOn, setDaOn] = useState(0)

  const hangDoi = cap == null ? cards : cards.slice(0, cap)
  const the = hangDoi[viTri]

  const cham = (rating: Rating) => {
    if (!the) return
    onRate(the.key, rating)
    setDaOn((n) => n + 1)
    setHienDap(false)
    setViTri((i) => i + 1)
  }

  // Hết thẻ trong phiên (đã ôn xong) — khác hẳn ca "không có thẻ nào đến hạn", ca đó do trang
  // gọi tự hiện vì mỗi môn có lời khuyên riêng.
  if (!the) {
    if (hangDoi.length === 0) return null
    return (
      <div className="rounded-3xl border border-emerald-500/40 bg-emerald-500/10 p-5 flex items-start gap-3">
        <Trophy
          className="w-6 h-6 text-emerald-400 theme-light:text-emerald-900 shrink-0"
          aria-hidden="true"
        />
        <div>
          <p className="font-bold text-content">Xong phiên ôn — {daOn} thẻ! 🎉</p>
          {xongPhien ? (
            xongPhien(daOn)
          ) : (
            <p className="mt-1 text-sm text-content-secondary leading-relaxed">
              Thẻ bạn nhớ được sẽ giãn ra xa hơn, thẻ còn lấn cấn quay lại sớm. Cứ đều đặn vậy thôi,
              không cần học thuộc.
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <section className="space-y-4">
      <p className="text-xs text-content-secondary" aria-live="polite">
        Thẻ {viTri + 1}/{hangDoi.length} · từ bài “{the.lessonTitle}”
      </p>

      <div className="rounded-3xl border border-accent-500/30 bg-zinc-900/80 p-6">
        <p className="text-base font-semibold text-content leading-relaxed whitespace-pre-line">
          {the.hoi}
        </p>
        {hienDap && (
          <p className="mt-4 pt-4 border-t border-zinc-800 text-sm text-content-secondary leading-relaxed whitespace-pre-line">
            {the.dap}
          </p>
        )}
      </div>

      {!hienDap ? (
        <button
          type="button"
          onClick={() => setHienDap(true)}
          className={buttonClass({ size: 'lg', fullWidth: true })}
        >
          <Eye className="w-4 h-4" aria-hidden="true" />
          <span>Xem đáp án</span>
        </button>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-content-secondary" id="muc-nho">
            Bạn nhớ tới đâu?
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2" aria-labelledby="muc-nho">
            {MUC.map((m) => (
              <button
                key={m.rating}
                type="button"
                onClick={() => cham(m.rating)}
                className={`tap-44 px-3 py-2.5 rounded-2xl bg-zinc-900 border text-content font-semibold text-sm transition ${m.mau}`}
              >
                {m.nhan}
              </button>
            ))}
          </div>
        </div>
      )}

      {duoiThe?.(the)}
    </section>
  )
}
