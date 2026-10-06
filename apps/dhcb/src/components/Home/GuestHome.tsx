// apps/dhcb/src/components/Home/GuestHome.tsx — Trang chủ cho KHÁCH VÃNG LAI (chưa đăng nhập).
//
// Đặc tả: docs/specs/2026-09-17-redesign-trang-chu-thi-hanh.md §P0-3.
//
// Khác trang chủ người đã đăng nhập: khách CHƯA có "Hôm nay"/streak/lịch sử — mọi thứ đó cần một
// tài khoản để tính. Thay vào đó, khách cần ĐÚNG BA điều để bắt đầu học trong vài giây:
//  1. Companion tự giới thiệu (chuỗi tĩnh, không gọi API — khách chưa có gì để cá nhân hoá).
//  2. ĐÚNG MỘT CTA dẫn tới `/bat-dau` (luồng "Bắt đầu theo ý định" — S05, không đụng ở đây).
//  3. Dải môn để khách muốn xem trước một môn cụ thể vẫn bấm được, + trụ Ghi chú.
import { Link } from 'react-router-dom'
import { StickyNote } from 'lucide-react'
import { CompanionAvatar } from '@core/CompanionAvatar'
import { CompanionBubble } from '@core/CompanionBubble'
import { buttonClass } from '@core/buttonStyles'
import { SUBJECT_ENTRIES } from '@dhcb/core-learner/subjectEntry'
import { track } from '../../lib/analytics'

// Chuỗi tĩnh — hợp đồng dữ liệu §③ của spec, KHÔNG được đổi chữ ngoài chủ đích (không có
// snapshot riêng cho lát này, nhưng vẫn giữ nguyên như spec đã chốt).
const GUEST_LEAD = 'Chào bạn. Mình là Bạn Đồng Hành — học cùng bạn mỗi ngày.'
const GUEST_DETAIL = 'Từ tiếng Anh tới lập trình, toán, lý, hoá, sinh — bắt đầu từ một việc nhỏ.'

// Trụ KHÔNG phải môn học (không tới từ SUBJECT_ENTRIES) — cùng nội dung với thẻ "Ghi chú" của
// trang chủ người đã đăng nhập (Home.tsx), rút gọn cho khách vì khách chưa có gì để cá nhân hoá.
// [2026-09-20] Hai trụ "Sự nghiệp & Khởi nghiệp" và "Công việc & Đời sống" đã bị gỡ hẳn.
const GUEST_PILLARS = [
  {
    id: 'notes',
    label: 'Ghi chú',
    path: '/ghi-chu',
    icon: StickyNote,
  },
] as const

function handleStartClick() {
  track('cta_click', { refCode: 'guest_home_start' })
}

export default function GuestHome() {
  return (
    <div className="space-y-5">
      <h1 className="sr-only">Trang chủ</h1>

      {/* ── Khối 1: Companion tự giới thiệu ── */}
      <div className="flex items-start gap-3">
        <CompanionAvatar mood="idle" decorative />
        <div className="flex-1 min-w-0">
          <CompanionBubble variant="home" lead={GUEST_LEAD} detail={GUEST_DETAIL} />
        </div>
      </div>

      {/* ── Khối 2: ĐÚNG MỘT CTA ── */}
      <div className="flex flex-col items-center gap-2 py-2 text-center">
        <Link
          to="/bat-dau"
          onClick={handleStartClick}
          className={buttonClass({
            variant: 'primary',
            size: 'lg',
            fullWidth: true,
            className: 'max-w-sm',
          })}
        >
          Bắt đầu — chọn việc đầu tiên
        </Link>
        <p className="text-sm text-zinc-400">Không cần tài khoản</p>
        {/* [U9b, audit 2026-09-30 mục 8] Người cũ đổi máy cần một lối đăng nhập BẰNG CHỮ — trước
            đây chỉ có nút tròn chữ cái đầu ở header, phải đoán. Liên kết chữ, không phải nút
            chính thứ hai: CTA "Bắt đầu" vẫn là nút chính duy nhất (AC-2). */}
        <p className="text-sm text-zinc-400">
          Đã có tài khoản?{' '}
          <Link
            to="/login"
            className="tap-44 inline-flex items-center font-semibold text-content underline underline-offset-2 hover:no-underline"
          >
            Đăng nhập
          </Link>
        </p>
      </div>

      {/* ── Khối 3: Dải môn + 2 trụ ── */}
      <section aria-labelledby="guest-home-subjects-heading">
        <h2 id="guest-home-subjects-heading" className="text-base font-bold text-white mb-2 px-1">
          Bộ môn & không gian
        </h2>
        <ul className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {SUBJECT_ENTRIES.map((entry) => (
            <li key={entry.id} className="shrink-0">
              <Link
                to={entry.ctaPath}
                className="tap-44 flex items-center rounded-full border border-zinc-800 bg-zinc-900/90 px-4 text-sm font-medium text-zinc-200 hover:border-accent-500/40 hover:text-white transition"
              >
                {entry.label}
              </Link>
            </li>
          ))}
        </ul>

        <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {GUEST_PILLARS.map((pillar) => {
            const Icon = pillar.icon
            return (
              <li key={pillar.id}>
                <Link
                  to={pillar.path}
                  className="tap-44 flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/90 px-4 py-3 text-sm font-semibold text-zinc-200 hover:border-zinc-700 hover:text-white transition"
                >
                  <Icon
                    className="w-4 h-4 text-purple-400 theme-light:text-purple-800 shrink-0"
                    aria-hidden="true"
                  />
                  {pillar.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </section>
    </div>
  )
}
