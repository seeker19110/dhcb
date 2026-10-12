// MemoryConsentCard.tsx — Thẻ "Bạn Đồng Hành có được nhớ không?" trong studio trò chuyện (GĐ2a).
//
// Vì sao có thẻ này: trước 2026-10-11 không có đường nào cấp consent nên Companion KHÔNG BAO GIỜ
// đọc được ký ức/hồ sơ/lịch sử — mọi lượt đều như lần đầu gặp. Thẻ mời bật ký ức (một nút = cấp
// đúng hai consent chuẩn) và công tắc "Phiên không lưu" (ephemeral: không đọc gì cá nhân, không
// lưu gì — kể cả câu "ghi nhớ…"). Công tắc là `role="switch"` + `aria-checked` (WCAG 4.1.2).
import { Link } from 'react-router-dom'
import { Brain, EyeOff } from 'lucide-react'
import type { CompanionMemorySettings } from '@dhcb/core-contracts/consentGrant'
import { buttonClass } from '@core/buttonStyles'

export const COMPANION_MEMORY_PATH = '/ban-dong-hanh/ky-uc'

interface MemorySwitchProps {
  id: string
  label: string
  description: string
  checked: boolean
  disabled?: boolean
  onChange: (next: boolean) => void
}

/** Công tắc dùng chung cho thẻ này và trang ký ức — cùng khuôn `OfflineDownloadSetting`. */
export function MemorySwitch({
  id,
  label,
  description,
  checked,
  disabled = false,
  onChange,
}: MemorySwitchProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <label htmlFor={id} className="text-sm font-semibold text-white">
          {label}
        </label>
        <p id={`${id}-desc`} className="text-xs text-zinc-400 mt-0.5">
          {description}
        </p>
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-describedby={`${id}-desc`}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className="tap-44 flex items-center justify-center rounded-full shrink-0 disabled:opacity-60"
      >
        <span
          aria-hidden="true"
          className={`relative w-11 h-6 rounded-full transition ${checked ? 'bg-accent-500' : 'bg-zinc-700'}`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${checked ? 'translate-x-5' : ''}`}
          />
        </span>
      </button>
    </div>
  )
}

export interface MemoryConsentCardProps {
  /** `null` = chưa tải được cài đặt (mạng/lỗi) → chỉ hiện công tắc phiên tạm. */
  settings: CompanionMemorySettings | null
  ephemeral: boolean
  onEphemeralChange: (next: boolean) => void
  /** Bật cả hai công tắc ký ức bằng một nút. */
  onEnableMemory: () => Promise<void>
  enabling?: boolean
}

export default function MemoryConsentCard({
  settings,
  ephemeral,
  onEphemeralChange,
  onEnableMemory,
  enabling = false,
}: MemoryConsentCardProps) {
  const memoryOff = settings !== null && !settings.rememberMemories
  return (
    <section
      aria-label="Ký ức và quyền riêng tư"
      className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-4 space-y-3"
    >
      {memoryOff && !ephemeral && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-start gap-2 min-w-0 flex-1">
            <Brain className="w-4 h-4 text-accent-400 shrink-0 mt-0.5" aria-hidden="true" />
            <p className="text-sm text-zinc-200">
              Bạn Đồng Hành đang <strong className="text-white">không nhớ gì</strong> giữa các lần
              trò chuyện. Bật ký ức để mỗi lần quay lại không phải kể lại từ đầu — bạn xem, sửa,
              quên từng ký ức bất cứ lúc nào.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void onEnableMemory()}
            disabled={enabling}
            className={buttonClass({ variant: 'primary', size: 'sm' })}
          >
            {enabling ? 'Đang bật…' : 'Bật ký ức'}
          </button>
        </div>
      )}
      <MemorySwitch
        id="companion-ephemeral"
        label="Phiên không lưu"
        description={
          ephemeral
            ? 'Đang bật: lượt này không đọc ký ức/lịch sử và không lưu gì lại.'
            : 'Bật khi muốn nói chuyện mà không để lại dấu vết nào.'
        }
        checked={ephemeral}
        onChange={onEphemeralChange}
      />
      <p className="text-xs text-zinc-400 flex items-center gap-1.5">
        <EyeOff className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        <Link
          to={COMPANION_MEMORY_PATH}
          className="underline underline-offset-2 text-accent-300 theme-light:text-accent-800"
        >
          Bạn Đồng Hành nhớ gì về tôi?
        </Link>
      </p>
    </section>
  )
}
