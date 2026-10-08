import { useState, useRef, useEffect } from 'react'
import { Send } from 'lucide-react'
import { buttonVariantClass } from '@core/buttonStyles'

export interface MessageInputProps {
  onSendMessage: (text: string) => void
  onTyping?: () => void
  disabled?: boolean
  placeholder?: string
}

export default function MessageInput({
  onSendMessage,
  onTyping,
  disabled = false,
  // [audit 2026-09-30 minor 14] Không ghi "(Enter để gửi…)" — dài, bị cắt ở màn hẹp và sai
  // nghĩa trên bàn phím điện thoại. `enterKeyHint="send"` ở dưới thay vai trò đó.
  placeholder = 'Nhập tin nhắn…',
}: MessageInputProps) {
  const [text, setText] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  // Auto-resize chiều cao của textarea theo nội dung
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    const newHeight = Math.min(el.scrollHeight, 120)
    el.style.height = `${newHeight}px`
  }, [text])

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setText(e.target.value)
    onTyping?.()
  }

  function submit() {
    const trimmed = text.trim()
    if (!trimmed || disabled) return
    onSendMessage(trimmed)
    setText('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.focus()
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        submit()
      }}
      className="flex items-end gap-2 p-3 bg-zinc-900/90 border-t border-white/10"
    >
      <div className="relative flex-1 flex items-center rounded-2xl bg-zinc-800/80 border border-white/10 focus-within:border-blue-500/80 transition-colors px-3 py-1.5 min-h-[44px]">
        <textarea
          ref={textareaRef}
          rows={1}
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          enterKeyHint="send"
          className="w-full resize-none bg-transparent text-sm text-white placeholder-zinc-400 focus:outline-none max-h-[120px] py-1 leading-relaxed"
          aria-label="Nhập tin nhắn"
        />
      </div>

      <button
        type="submit"
        disabled={disabled || !text.trim()}
        aria-label="Gửi tin nhắn"
        className={`${buttonVariantClass('primary')} inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors disabled:pointer-events-none disabled:opacity-50`}
      >
        <Send size={18} />
      </button>
    </form>
  )
}
