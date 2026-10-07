import React from 'react'

interface VoiceWaveformVisualizerProps {
  audioLevel?: number // 0.0 -> 1.0
  active?: boolean
  className?: string
}

export const VoiceWaveformVisualizer: React.FC<VoiceWaveformVisualizerProps> = ({
  audioLevel = 0,
  active = false,
  className = '',
}) => {
  const bars = [0.3, 0.7, 1.0, 0.6, 0.85, 0.4, 0.9, 0.5, 0.75, 0.35, 0.65, 0.8]

  return (
    <div className={`flex items-center justify-center gap-1 h-10 ${className}`}>
      {bars.map((weight, idx) => {
        const heightMultiplier = active ? Math.max(0.15, audioLevel * weight) : 0.1
        const heightPercent = Math.min(100, Math.round(heightMultiplier * 100))

        return (
          <div
            key={idx}
            className="w-1.5 rounded-full bg-gradient-to-t from-sky-400 to-indigo-500 transition-[height,opacity] duration-75"
            style={{
              height: `${Math.max(4, heightPercent)}%`,
              opacity: active ? 0.9 : 0.3,
            }}
          />
        )
      })}
    </div>
  )
}

export default VoiceWaveformVisualizer
