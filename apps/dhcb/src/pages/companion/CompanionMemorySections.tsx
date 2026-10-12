// CompanionMemorySections.tsx — Hai mục GĐ2b của trang "Bạn Đồng Hành nhớ gì về tôi"
// (đặc tả `docs/specs/2026-10-12-ban-dong-hanh-gd2b-trich-ky-uc-khoi-loi.md`):
//   · MemorySuggestions — gợi ý ký ức CHỜ DUYỆT (bộ phản tỉnh sau buổi chỉ đề xuất; không gì được
//     ghi khi người dùng chưa bấm "Ghi nhớ").
//   · CoreBlockEditor — hai khối ghi nhớ cố định người dùng tự viết, luôn có trong ngữ cảnh.
// Tách khỏi CompanionMemory.tsx để mỗi file làm một việc. Không hiện `importance` (Luật số 1).
import { useState } from 'react'
import { Check, X } from 'lucide-react'
import {
  CORE_MEMORY_BLOCK_MAX_CHARS,
  type CoreMemoryBlock,
  type CoreMemoryBlockLabel,
} from '@dhcb/core-contracts/personalMemory'
import { buttonClass } from '@core/buttonStyles'
import { useToast } from '@core/ToastProvider'
import {
  CompanionMemoryApiError,
  decideMemorySuggestion,
  saveCoreBlock,
  type MemorySuggestion,
} from '../../lib/companionMemoryApi'

const KIND_LABEL: Record<MemorySuggestion['kind'], string> = {
  add: 'Điều mới',
  update: 'Cập nhật',
  invalidate: 'Không còn đúng',
}

export interface MemorySuggestionsProps {
  suggestions: MemorySuggestion[]
  /** Gợi ý vừa được quyết (ghi nhớ/bỏ qua) — trang gỡ khỏi danh sách và tải lại ký ức nếu cần. */
  onDecided: (id: string, decision: 'confirm' | 'reject') => void
}

export function MemorySuggestions({ suggestions, onDecided }: MemorySuggestionsProps) {
  const toast = useToast()
  const [busyId, setBusyId] = useState<string | null>(null)

  const decide = async (s: MemorySuggestion, decision: 'confirm' | 'reject') => {
    if (busyId) return
    setBusyId(s.id)
    try {
      await decideMemorySuggestion(s.id, decision)
      onDecided(s.id, decision)
      toast.success(decision === 'confirm' ? 'Đã ghi nhớ.' : 'Đã bỏ qua gợi ý.')
    } catch (err) {
      toast.error(
        err instanceof CompanionMemoryApiError && err.status === 409
          ? 'Ký ức gốc vừa thay đổi nên gợi ý này không còn áp dụng. Hãy bấm "Bỏ qua".'
          : 'Chưa xử lý được gợi ý. Thử lại nhé.',
      )
    } finally {
      setBusyId(null)
    }
  }

  return (
    <ul className="space-y-2">
      {suggestions.map((s) => {
        const busy = busyId === s.id
        return (
          <li
            key={s.id}
            className="bg-zinc-900/80 border border-accent-500/40 rounded-2xl p-4 space-y-2"
          >
            <span className="inline-block rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-200">
              {KIND_LABEL[s.kind]}
            </span>
            {s.kind === 'invalidate' ? (
              <p className="text-sm text-zinc-100">
                Bỏ điều đã nhớ: <span className="line-through">{s.previousContent}</span>
              </p>
            ) : (
              <>
                <p className="text-sm text-zinc-100 whitespace-pre-wrap">{s.content}</p>
                {s.previousContent && (
                  <p className="text-xs text-zinc-400">Thay cho: {s.previousContent}</p>
                )}
              </>
            )}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => void decide(s, 'confirm')}
                className={buttonClass({ variant: 'primary', size: 'sm' })}
              >
                <Check className="w-3.5 h-3.5" aria-hidden="true" />
                {s.kind === 'invalidate' ? 'Đồng ý bỏ' : 'Ghi nhớ'}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void decide(s, 'reject')}
                className={buttonClass({ variant: 'outline', size: 'sm' })}
              >
                <X className="w-3.5 h-3.5" aria-hidden="true" />
                Bỏ qua
              </button>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

const BLOCK_TEXT: Record<CoreMemoryBlockLabel, { title: string; hint: string }> = {
  about_me: {
    title: 'Về tôi',
    hint: 'Vd: Học sinh lớp 10, thích vẽ, muốn được giải thích ngắn gọn.',
  },
  current_focus: {
    title: 'Đang tập trung',
    hint: 'Vd: Ôn thi giữa kỳ môn Toán đến hết tháng 10.',
  },
}

export interface CoreBlockEditorProps {
  block: CoreMemoryBlock
  disabled?: boolean
  onSaved: (block: CoreMemoryBlock) => void
}

export function CoreBlockEditor({ block, disabled = false, onSaved }: CoreBlockEditorProps) {
  const toast = useToast()
  const [draft, setDraft] = useState(block.content)
  const [saving, setSaving] = useState(false)
  const id = `core-block-${block.label}`
  const text = BLOCK_TEXT[block.label]
  const changed = draft.trim() !== block.content.trim()

  const save = async () => {
    if (saving || !changed) return
    setSaving(true)
    try {
      const saved = await saveCoreBlock(block.label, draft, block.version)
      onSaved(saved)
      setDraft(saved.content)
      toast.success(saved.content ? 'Đã lưu.' : 'Đã xoá khối này.')
    } catch (err) {
      toast.error(
        err instanceof CompanionMemoryApiError && err.status === 409
          ? 'Khối này vừa được sửa ở nơi khác. Tải lại trang rồi sửa tiếp nhé.'
          : 'Chưa lưu được. Thử lại nhé.',
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-semibold text-white">
        {text.title}
      </label>
      <textarea
        id={id}
        value={draft}
        maxLength={CORE_MEMORY_BLOCK_MAX_CHARS}
        rows={3}
        disabled={disabled || saving}
        placeholder={text.hint}
        aria-describedby={`${id}-count`}
        onChange={(e) => setDraft(e.target.value)}
        className="w-full rounded-xl bg-zinc-950 border border-zinc-700 p-2 text-sm text-zinc-100 placeholder:text-zinc-400 disabled:opacity-60"
      />
      <div className="flex items-center justify-between gap-2">
        <span id={`${id}-count`} className="text-xs text-zinc-400">
          {draft.length}/{CORE_MEMORY_BLOCK_MAX_CHARS} ký tự
        </span>
        <button
          type="button"
          disabled={disabled || saving || !changed}
          onClick={() => void save()}
          className={buttonClass({ variant: 'outline', size: 'sm' })}
        >
          Lưu {text.title.toLowerCase()}
        </button>
      </div>
    </div>
  )
}
