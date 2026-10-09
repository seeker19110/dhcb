import React, { useEffect, useState } from 'react'
import {
  Users,
  Handshake,
  ShieldCheck,
  Calendar,
  Sparkles,
  CheckCircle,
  Loader2,
  Lock,
} from 'lucide-react'
import type { PeerStudyMatch, A2ANegotiationResult } from '@dhcb/core-contracts/a2aProtocol'
import { buttonClass } from '@core/buttonStyles'

// Dựng thông điệp bắt tay A2A — helper NGOÀI component (Date.now là hàm không
// thuần, chỉ được gọi từ event handler, không được gọi trong lúc render).
function buildHandshakeMessage(peer: PeerStudyMatch) {
  const now = Date.now()
  return {
    messageId: crypto.randomUUID(),
    senderDid: 'did:key:z6MkpMySelf',
    recipientDid: peer.peerDid,
    senderPersonId: '550e8400-e29b-41d4-a716-446655440001',
    recipientPersonId: peer.peerPersonId,
    purpose: 'study_partner_handshake',
    payload: {
      topic: peer.sharedSkill,
      proposedWindow: new Date(now + 86400_000).toISOString(),
      durationMinutes: 30,
    },
    signature: 'ed25519_sig_demo_handshake',
    timestamp: new Date(now).toISOString(),
    expiresAt: new Date(now + 3600_000).toISOString(),
    schemaVersion: 'v3.0.0',
  }
}

export const A2ANegotiatorCard: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [matches, setMatches] = useState<PeerStudyMatch[]>([])
  const [negotiations, setNegotiations] = useState<A2ANegotiationResult[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Nạp dữ liệu 1 lần lúc mount — mọi setState đều nằm SAU await (callback async),
  // không setState đồng bộ trong thân effect. `loading` khởi tạo mặc định true.
  useEffect(() => {
    const fetchData = async () => {
      const [resMatches, resActive] = await Promise.all([
        fetch('/api/a2a?kind=matches'),
        fetch('/api/a2a?kind=active'),
      ])

      if (resMatches.ok) {
        const data = await resMatches.json()
        if (data.matches) setMatches(data.matches)
      }
      if (resActive.ok) {
        const data = await resActive.json()
        if (data.negotiations) setNegotiations(data.negotiations)
      }
    }
    fetchData()
      .catch(() => {
        // Bỏ qua lỗi
      })
      .finally(() => setLoading(false))
  }, [])

  const handleStartHandshake = async (peer: PeerStudyMatch) => {
    try {
      setActionLoading(peer.peerPersonId)
      const msg = buildHandshakeMessage(peer)

      const res = await fetch('/api/a2a', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg }),
      })

      if (res.ok) {
        const data = await res.json()
        if (data.result) {
          setNegotiations((prev) => [data.result, ...prev])
        }
      }
    } catch {
      // Bỏ qua lỗi
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl overflow-hidden transition text-xs shadow-lg">
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        className="w-full px-4 py-3 flex items-center justify-between gap-3 hover:bg-zinc-800/50 transition"
      >
        {/* min-w-0 + flex-1: khối tiêu đề co lại/xuống dòng, nhường badge giữ nguyên một dòng ở 390px. */}
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <div className="shrink-0 p-1.5 rounded-xl bg-indigo-500/20 text-indigo-300 theme-light:text-indigo-800 border border-indigo-500/30">
            <Users className="w-4 h-4" />
          </div>
          <div className="text-left">
            <span className="font-bold text-white text-xs block">
              Mạng Lưới Agent-to-Agent (A2A Mesh)
            </span>
            <span className="text-[0.6875rem] text-zinc-400">
              Đàm phán lịch học & khớp nối bạn đồng hành tự động
            </span>
          </div>
        </div>

        <span className="shrink-0 whitespace-nowrap px-2 py-0.5 rounded-full text-[0.6875rem] font-semibold bg-indigo-500/20 text-indigo-200 theme-light:text-indigo-900 border border-indigo-500/30">
          {matches.length} bạn học phù hợp
        </span>
      </button>

      {isOpen && (
        <div className="p-4 border-t border-zinc-800/80 space-y-4 animate-fade-in bg-zinc-950/60">
          {loading ? (
            <div className="flex items-center justify-center py-4 text-zinc-400 gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-400 theme-light:text-indigo-800" />
              <span>Đang quét mạng lưới bạn học A2A...</span>
            </div>
          ) : (
            <>
              {/* Active Negotiations */}
              {negotiations.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[0.6875rem] font-semibold text-emerald-400 theme-light:text-emerald-900 flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Thỏa thuận A2A đã xác lập ({negotiations.length}):</span>
                  </div>
                  <div className="space-y-1.5">
                    {negotiations.map((neg) => (
                      <div
                        key={neg.id}
                        className="bg-emerald-950/20 theme-light:bg-emerald-50 border border-emerald-800/40 rounded-xl p-3 flex items-center justify-between text-zinc-200"
                      >
                        <div className="space-y-0.5">
                          <div className="font-semibold text-emerald-300 theme-light:text-emerald-900 flex items-center gap-1.5 text-xs">
                            <Handshake className="w-3.5 h-3.5" />
                            <span>{neg.agreedTerms.skillTopic || 'Phiên học nhóm tiếng Anh'}</span>
                          </div>
                          <div className="text-[0.6875rem] text-zinc-400 flex items-center gap-2">
                            <span>Thời lượng: {neg.agreedTerms.studyDurationMinutes || 30}p</span>
                            <span>•</span>
                            <span className="flex items-center gap-1 text-sky-400 theme-light:text-sky-900">
                              <Lock className="w-2.5 h-2.5" />
                              {neg.agreedTerms.disclosureLevel}
                            </span>
                          </div>
                        </div>

                        <span className="text-[0.6875rem] px-2 py-1 rounded bg-zinc-900 font-mono text-zinc-400 border border-zinc-800">
                          {neg.auditReceiptHash.slice(0, 10)}…
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Peer Matches */}
              <div className="space-y-2">
                <div className="text-[0.6875rem] font-semibold text-zinc-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400 theme-light:text-indigo-800" />
                  <span>Đề xuất bạn cùng học tương thích từ Life Graph:</span>
                </div>

                <div className="space-y-2">
                  {matches.map((peer) => (
                    <div
                      key={peer.peerPersonId}
                      className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-3 space-y-2 text-zinc-300"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-bold text-white text-xs flex items-center gap-1.5">
                            <span>{peer.peerDisplayName}</span>
                            <span className="px-1.5 py-0.5 rounded text-[0.6875rem] font-bold bg-indigo-500/20 text-indigo-200 theme-light:text-indigo-800 border border-indigo-500/30">
                              {Math.round(peer.compatibilityScore * 100)}% Tương thích
                            </span>
                          </div>
                          <p className="text-[0.6875rem] text-indigo-300 theme-light:text-indigo-800 mt-0.5 font-medium">
                            Kỹ năng chung: {peer.sharedSkill}
                          </p>
                        </div>

                        <button
                          onClick={() => handleStartHandshake(peer)}
                          disabled={actionLoading === peer.peerPersonId}
                          className={buttonClass({
                            variant: 'secondary',
                            size: 'sm',
                            className: 'tap-44',
                          })}
                        >
                          {actionLoading === peer.peerPersonId ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Handshake className="w-3.5 h-3.5" />
                          )}
                          <span>Bắt tay A2A</span>
                        </button>
                      </div>

                      <div className="text-[0.6875rem] text-zinc-400 bg-zinc-950 p-2 rounded-lg border border-zinc-800 flex items-center gap-1.5">
                        <Calendar className="w-3 h-3 text-zinc-500 shrink-0" />
                        <span>Mục tiêu đề xuất: {peer.recommendedGoal}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-zinc-800/80 text-[0.6875rem] text-content-secondary flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 theme-light:text-emerald-900 shrink-0" />
                <span>
                  Giao thức A2A bảo vệ tuyệt đối lịch trình cá nhân bằng mật mã Zero-Knowledge.
                </span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default A2ANegotiatorCard
