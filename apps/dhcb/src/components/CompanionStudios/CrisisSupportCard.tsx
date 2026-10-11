import { LifeBuoy, Phone } from 'lucide-react'
import type { CompanionSafetyNotice } from '@dhcb/core-contracts/companionSafety'
import { formatPhone } from './formatPhone'

interface CrisisSupportCardProps {
  notice: CompanionSafetyNotice
}

/**
 * Thẻ hỗ trợ khủng hoảng — hiện NGAY DƯỚI tin nhắn của Bạn Đồng Hành khi lớp an toàn ở server
 * (`packages/core-personal/safetyGuard.ts`) kết luận lượt thoại có dấu hiệu tự hại / bị bạo
 * hành, xâm hại. Số điện thoại là số THẬT từ `VIETNAM_SAFETY_RESOURCES` (server gửi xuống),
 * bấm được trên điện thoại (`tel:`). Thẻ do server quyết định, client KHÔNG tự suy luận.
 *
 * Thiết kế cố ý: giọng bình tĩnh, không hoảng, không emoji, không "cảnh báo đỏ" chói — người
 * đang khó khăn cần số đúng và một câu nói tử tế, không cần bị doạ.
 */
export default function CrisisSupportCard({ notice }: CrisisSupportCardProps) {
  const heading =
    notice.level === 'imminent'
      ? 'Hãy gọi một người thật ngay bây giờ'
      : 'Bạn không đơn độc — có người sẵn sàng nghe'
  const lead =
    notice.category === 'abuse'
      ? 'Điều đang xảy ra với bạn không phải lỗi của bạn. Những nơi dưới đây giúp miễn phí và giữ kín.'
      : 'Nếu bạn đang thấy quá sức, gọi cho một trong những nơi dưới đây — họ nghe miễn phí và không phán xét.'

  return (
    <section
      aria-label="Hỗ trợ khẩn cấp"
      className="mt-4 pt-3.5 border-t border-zinc-800/80 space-y-3"
    >
      <div className="flex items-center gap-1.5 text-sm font-bold text-zinc-100">
        <LifeBuoy className="w-4 h-4 text-accent-400 theme-light:text-accent-800" aria-hidden />
        {heading}
      </div>
      <p className="text-sm leading-relaxed text-zinc-200">{lead}</p>
      <ul className="space-y-2">
        {notice.resources.map((r) => (
          <li
            key={r.phone}
            className="bg-zinc-950/80 border border-zinc-800/90 rounded-2xl p-3.5 flex flex-col gap-1.5"
          >
            <a
              href={`tel:${r.phone}`}
              className="inline-flex items-center gap-2 min-h-11 text-[0.9375rem] font-semibold text-accent-300 theme-light:text-accent-900 underline underline-offset-2 hover:text-accent-200"
            >
              <Phone className="w-4 h-4 shrink-0" aria-hidden />
              <span>
                {r.name} — gọi {formatPhone(r.phone)}
              </span>
            </a>
            {r.note && <p className="text-sm leading-relaxed text-zinc-200">{r.note}</p>}
          </li>
        ))}
      </ul>
      <p className="text-sm leading-relaxed text-zinc-200">
        Bạn Đồng Hành là AI và không thể gọi thay bạn. Nếu có người lớn bạn tin được ở gần — bố mẹ,
        thầy cô, anh chị — hãy nói với họ.
      </p>
    </section>
  )
}
