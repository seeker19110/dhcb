import React, { useRef, useState } from 'react'
import { CanvasNode, CanvasEdge, CanvasViewport } from '@dhcb/core-contracts/actionCanvas'
import { CheckCircle2, AlertCircle, Clock, User, Bot, Trash2 } from 'lucide-react'

interface InteractiveCanvasViewportProps {
  nodes: CanvasNode[]
  edges: CanvasEdge[]
  viewport: CanvasViewport
  selectedNodeId: string | null
  onSelectNode: (id: string | null) => void
  onUpdateNodePosition: (id: string, x: number, y: number) => void
  onDeleteNode: (id: string) => void
  onUpdateViewport: (viewport: CanvasViewport) => void
}

const DEFAULT_THEME = {
  border: 'border-sky-500/40',
  bg: 'bg-sky-950/40',
  text: 'text-sky-400 theme-light:text-sky-900',
  glow: 'rgba(56, 189, 248, 0.2)',
}

// Màu + nhãn tiếng Việt theo miền. Chỉ còn hai trụ thật + `general` (changelog 0485); hợp đồng đã
// đổi miền của ba trụ đã xoá về `general` khi đọc.
const DOMAIN_COLORS: Record<string, { border: string; bg: string; text: string; glow: string }> = {
  learning: DEFAULT_THEME,
  work: {
    border: 'border-emerald-500/40',
    bg: 'bg-emerald-950/40',
    text: 'text-emerald-400 theme-light:text-emerald-900',
    glow: 'rgba(34, 197, 94, 0.2)',
  },
  general: {
    border: 'border-purple-500/40',
    bg: 'bg-purple-950/40',
    text: 'text-purple-400 theme-light:text-purple-800',
    glow: 'rgba(168, 85, 247, 0.2)',
  },
}

const DOMAIN_LABELS: Record<string, string> = {
  learning: 'Học tập',
  work: 'Ghi chú',
  general: 'Chung',
}

export default function InteractiveCanvasViewport({
  nodes,
  edges,
  viewport,
  selectedNodeId,
  onSelectNode,
  onUpdateNodePosition,
  onDeleteNode,
  onUpdateViewport,
}: InteractiveCanvasViewportProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.target === containerRef.current || (e.target as HTMLElement).tagName === 'svg') {
      setIsPanning(true)
      setPanStart({ x: e.clientX - viewport.panX, y: e.clientY - viewport.panY })
      onSelectNode(null)
    }
  }

  const handleNodePointerDown = (e: React.PointerEvent, node: CanvasNode) => {
    e.stopPropagation()
    setDraggingNodeId(node.id)
    onSelectNode(node.id)
    setDragOffset({
      x: e.clientX / viewport.zoom - node.x,
      y: e.clientY / viewport.zoom - node.y,
    })
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isPanning) {
      onUpdateViewport({
        ...viewport,
        panX: e.clientX - panStart.x,
        panY: e.clientY - panStart.y,
      })
    } else if (draggingNodeId) {
      const newX = e.clientX / viewport.zoom - dragOffset.x
      const newY = e.clientY / viewport.zoom - dragOffset.y
      onUpdateNodePosition(draggingNodeId, Math.round(newX), Math.round(newY))
    }
  }

  const handlePointerUp = () => {
    setIsPanning(false)
    setDraggingNodeId(null)
  }

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      className="relative w-full h-[640px] overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/90 shadow-2xl select-none cursor-grab active:cursor-grabbing"
    >
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, #38bdf8 1px, transparent 1px)',
          backgroundSize: 24 * viewport.zoom + 'px ' + 24 * viewport.zoom + 'px',
          backgroundPosition: viewport.panX + 'px ' + viewport.panY + 'px',
        }}
      />
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{
          transform:
            'translate(' +
            viewport.panX +
            'px, ' +
            viewport.panY +
            'px) scale(' +
            viewport.zoom +
            ')',
          transformOrigin: '0 0',
        }}
      >
        <defs>
          <marker
            id="edge-arrow"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#38bdf8" />
          </marker>
        </defs>
        {edges.map((edge) => {
          const source = nodes.find((n) => n.id === edge.sourceNodeId)
          const target = nodes.find((n) => n.id === edge.targetNodeId)
          if (!source || !target) return null
          const x1 = source.x + source.width / 2
          const y1 = source.y + source.height / 2
          const x2 = target.x + target.width / 2
          const y2 = target.y + target.height / 2
          const dx = x2 - x1
          const cx1 = x1 + dx * 0.5
          const cy1 = y1
          const cx2 = x1 + dx * 0.5
          const cy2 = y2
          const pathD =
            'M ' +
            x1 +
            ' ' +
            y1 +
            ' C ' +
            cx1 +
            ' ' +
            cy1 +
            ', ' +
            cx2 +
            ' ' +
            cy2 +
            ', ' +
            x2 +
            ' ' +
            y2
          return (
            <g key={edge.id}>
              <path
                d={pathD}
                fill="none"
                stroke="rgba(56, 189, 248, 0.4)"
                strokeWidth="2"
                strokeDasharray={edge.relationship === 'requires' ? '4 4' : 'none'}
                markerEnd="url(#edge-arrow)"
              />
              {edge.label && (
                <text
                  x={(x1 + x2) / 2}
                  y={(y1 + y2) / 2 - 8}
                  fill="#94a3b8"
                  fontSize="10"
                  textAnchor="middle"
                  className="font-medium bg-zinc-900"
                >
                  {edge.label}
                </text>
              )}
            </g>
          )
        })}
      </svg>
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          transform:
            'translate(' +
            viewport.panX +
            'px, ' +
            viewport.panY +
            'px) scale(' +
            viewport.zoom +
            ')',
          transformOrigin: '0 0',
        }}
      >
        {nodes.map((node) => {
          const theme = DOMAIN_COLORS[node.domain] ?? DEFAULT_THEME
          const isSelected = selectedNodeId === node.id
          return (
            <div
              key={node.id}
              onPointerDown={(e) => handleNodePointerDown(e, node)}
              style={{
                left: node.x + 'px',
                top: node.y + 'px',
                width: node.width + 'px',
                boxShadow: isSelected ? '0 0 20px ' + theme.glow : 'none',
              }}
              className={
                'absolute pointer-events-auto rounded-xl border p-3 transition-shadow backdrop-blur-md cursor-grab active:cursor-grabbing ' +
                theme.border +
                ' ' +
                theme.bg +
                ' ' +
                (isSelected ? 'ring-2 ring-cyan-400 border-cyan-400' : 'hover:border-zinc-500')
              }
            >
              <div className="flex items-center justify-between gap-1 mb-1.5">
                <span
                  className={
                    'rounded px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ' +
                    theme.text +
                    ' bg-zinc-950/60 border border-zinc-800'
                  }
                >
                  {DOMAIN_LABELS[node.domain] ?? DOMAIN_LABELS.general}
                </span>
                <div className="flex items-center gap-1 text-[11px] text-zinc-400">
                  {node.assignedTo === 'companion_ai' ? (
                    <span className="flex items-center gap-0.5 text-cyan-300 theme-light:text-cyan-900 font-medium">
                      <Bot className="w-3 h-3" /> AI
                    </span>
                  ) : (
                    <span className="flex items-center gap-0.5 text-zinc-400">
                      <User className="w-3 h-3" /> You
                    </span>
                  )}
                  {isSelected && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onDeleteNode(node.id)
                      }}
                      className="ml-1 p-0.5 text-rose-400 theme-light:text-rose-900 hover:bg-rose-950/60 rounded"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
              <h4 className="text-xs font-bold text-zinc-100 line-clamp-2 mb-1 leading-snug">
                {node.title}
              </h4>
              {node.content && (
                <p className="text-[11px] text-zinc-300/80 line-clamp-2 mb-2 leading-relaxed">
                  {node.content}
                </p>
              )}
              <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1 border-t border-zinc-800/60">
                <span className="flex items-center gap-1">
                  {node.status === 'completed' ? (
                    <CheckCircle2 className="w-3 h-3 text-emerald-400 theme-light:text-emerald-900" />
                  ) : node.status === 'blocked' ? (
                    <AlertCircle className="w-3 h-3 text-rose-400 theme-light:text-rose-900" />
                  ) : (
                    <Clock className="w-3 h-3 text-amber-400 theme-light:text-amber-900" />
                  )}
                  <span className="capitalize">{node.status.replace('_', ' ')}</span>
                </span>
                {node.tags.length > 0 && (
                  <span className="text-zinc-500 font-mono">#{node.tags[0]}</span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
