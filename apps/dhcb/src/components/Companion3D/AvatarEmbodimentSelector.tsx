import { Bot, Radio, Sparkles } from 'lucide-react'

export type EmbodimentMode = '3d_cyber_avatar' | 'live_orb' | 'minimal'

interface AvatarEmbodimentSelectorProps {
  currentMode: EmbodimentMode
  onModeChange: (mode: EmbodimentMode) => void
}

export default function AvatarEmbodimentSelector({
  currentMode,
  onModeChange,
}: AvatarEmbodimentSelectorProps) {
  const modes = [
    {
      id: '3d_cyber_avatar' as const,
      label: 'Nhân vật 3D',
      icon: Bot,
      desc: 'Nhân vật 3D nhìn theo bạn, khẩu hình khớp lời nói',
      badge: 'Đẹp nhất',
    },
    {
      id: 'live_orb' as const,
      label: 'Quả cầu âm thanh',
      icon: Radio,
      desc: 'Quả cầu hiệu ứng theo trạng thái ghi âm/trả lời',
      badge: 'Nhẹ',
    },
    {
      id: 'minimal' as const,
      label: 'Gọn nhẹ',
      icon: Sparkles,
      desc: 'Chế độ văn bản tối giản tiết kiệm pin',
      badge: 'Tiết kiệm pin',
    },
  ]

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/60 p-1.5 backdrop-blur-md">
      {modes.map((mode) => {
        const Icon = mode.icon
        const isActive = currentMode === mode.id
        return (
          <button
            key={mode.id}
            type="button"
            onClick={() => onModeChange(mode.id)}
            className={`tap-44-y flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              isActive
                ? 'bg-cyan-500/20 text-cyan-300 theme-light:text-cyan-800 shadow-[0_0_12px_rgba(6,182,212,0.25)] border border-cyan-500/40'
                : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200 border border-transparent'
            }`}
          >
            <Icon
              className={`h-3.5 w-3.5 ${isActive ? 'text-cyan-400 theme-light:text-cyan-800' : 'text-zinc-500'}`}
            />
            <span>{mode.label}</span>
            <span
              className={`rounded px-1.5 py-0.2 text-[0.6875rem] font-semibold uppercase ${
                isActive
                  ? 'bg-cyan-500/30 text-cyan-200 theme-light:text-cyan-800'
                  : 'bg-zinc-800 text-zinc-500'
              }`}
            >
              {mode.badge}
            </span>
          </button>
        )
      })}
    </div>
  )
}
