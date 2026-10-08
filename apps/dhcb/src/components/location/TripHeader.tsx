// apps/dhcb/src/components/location/TripHeader.tsx — Thẻ đầu chuyến: tên chuyến, thời gian còn
// lại, chất lượng kết nối, và MỜI BẠN BÈ.
//
// Mời bạn bè được đưa lên đây vì nó là việc đầu tiên người ta làm sau khi tạo chuyến — trước đây
// nút "Chép link mời" nằm lẫn trong đống nút cuối trang, phải cuộn hết màn hình mới thấy.
// Trên điện thoại ưu tiên Web Share API (mở thẳng Zalo/Messenger để gửi), không có thì quay về
// chép vào bộ nhớ tạm như cũ.

import { useState } from 'react'
import { Check, Clock, Share2, Wifi, WifiOff } from 'lucide-react'
import { formatRemaining } from '../../lib/locationFormat'
import { buildInviteUrl } from '../../lib/locationShare'
import { buttonClass } from '@core/buttonStyles'

interface Props {
  name: string
  inviteCode: string
  expiresAt: string
  transport: 'websocket' | 'polling'
}

export default function TripHeader({ name, inviteCode, expiresAt, transport }: Props) {
  const [copied, setCopied] = useState(false)

  async function shareInvite() {
    const url = buildInviteUrl(inviteCode)
    const text = `Vào chuyến "${name}" để mình không lạc nhau nhé: ${url}`
    // navigator.share chỉ tồn tại trên phần lớn trình duyệt di động — không có thì chép link.
    if (navigator.share) {
      try {
        await navigator.share({ title: name, text, url })
        return
      } catch {
        // Người dùng bấm huỷ bảng chia sẻ — không phải lỗi, và cũng không nên im lặng
        // không làm gì, nên rơi xuống nhánh chép link bên dưới.
      }
    }
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Trình duyệt chặn clipboard (thường do không phải HTTPS) — mã mời vẫn hiện to ngay
      // bên cạnh để đọc cho nhau, nên không cần báo lỗi ồn ào.
    }
  }

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
      <h2 className="text-xl font-bold leading-tight text-zinc-100">{name}</h2>
      <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-zinc-200">
        <span>
          <Clock className="mr-1 inline h-4 w-4" aria-hidden="true" />
          {formatRemaining(expiresAt)}
        </span>
        <span>
          {transport === 'websocket' ? (
            <>
              <Wifi className="mr-1 inline h-4 w-4" aria-hidden="true" />
              Cập nhật tức thì
            </>
          ) : (
            <>
              <WifiOff className="mr-1 inline h-4 w-4" aria-hidden="true" />
              Cập nhật mỗi vài giây
            </>
          )}
        </span>
      </p>

      <div className="mt-3 flex items-center gap-2">
        <span className="min-w-0 flex-1">
          <span className="block text-sm text-zinc-200">Mã mời</span>
          {/* <code> nằm trong danh sách được phép bôi đen của dự án (index.css) — đọc cho nhau
              nghe hoặc copy tay đều được, kể cả khi clipboard bị chặn. */}
          <code className="block truncate text-2xl font-bold tracking-[0.25em] text-zinc-100">
            {inviteCode}
          </code>
        </span>
        <button
          type="button"
          onClick={() => void shareInvite()}
          className={buttonClass({ className: 'shrink-0' })}
        >
          {copied ? (
            <Check className="h-5 w-5" aria-hidden="true" />
          ) : (
            <Share2 className="h-5 w-5" aria-hidden="true" />
          )}
          {copied ? 'Đã chép' : 'Mời bạn'}
        </button>
      </div>
    </section>
  )
}
