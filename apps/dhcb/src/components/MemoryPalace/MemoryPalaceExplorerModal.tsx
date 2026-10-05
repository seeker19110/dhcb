import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { thongDiepLoiThanThien } from '../../lib/friendlyError'
import { useDialogBehavior } from '../useDialogBehavior'
import { X, Sparkles, MapPin, CheckCircle2, Key, Plus } from 'lucide-react'
import {
  fetchMemoryPalaceState,
  createMemoryPalaceRoomApi,
  verifyLocusRecallApi,
} from '../../lib/memoryPalaceApi.js'
import type {
  MemoryPalaceState,
  MemoryPalaceRoom,
  MemoryPalaceTheme,
  LocusAnchor,
  LocusRecallResult,
} from '@dhcb/core-contracts/memoryPalace'

interface MemoryPalaceExplorerModalProps {
  onClose: () => void
}

export default function MemoryPalaceExplorerModal({ onClose }: MemoryPalaceExplorerModalProps) {
  // 6 hành vi a11y bắt buộc của hộp thoại (Escape, bẫy tiêu điểm, khoá cuộn nền…).
  const { dialogProps, titleId, backdropProps } = useDialogBehavior(onClose)
  const [state, setState] = useState<MemoryPalaceState | null>(null)
  const [activeRoomIndex, setActiveRoomIndex] = useState(0)
  const [selectedLocus, setSelectedLocus] = useState<LocusAnchor | null>(null)
  const [recallInput, setRecallInput] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const [recallResult, setRecallResult] = useState<LocusRecallResult | null>(null)
  const [isCreatingRoom, setIsCreatingRoom] = useState(false)
  const [newRoomName, setNewRoomName] = useState('')
  const [newRoomTheme, setNewRoomTheme] = useState<MemoryPalaceTheme>('stem_laboratory')

  useEffect(() => {
    fetchMemoryPalaceState()
      .then((s) => {
        setState(s)
        const firstRoom = s.rooms[0]
        if (firstRoom && firstRoom.loci.length > 0) {
          setSelectedLocus(firstRoom.loci[0] ?? null)
        }
      })
      .catch(() => {})
  }, [])

  const currentRoom: MemoryPalaceRoom | undefined = state?.rooms[activeRoomIndex]

  const handleSelectRoom = (idx: number) => {
    setActiveRoomIndex(idx)
    setRecallResult(null)
    setRecallInput('')
    const room = state?.rooms[idx]
    if (room && room.loci.length > 0) {
      setSelectedLocus(room.loci[0] ?? null)
    } else {
      setSelectedLocus(null)
    }
  }

  const handleSelectLocus = (locus: LocusAnchor) => {
    setSelectedLocus(locus)
    setRecallResult(null)
    setRecallInput('')
  }

  const handleVerifyRecall = async () => {
    if (!currentRoom || !selectedLocus || !recallInput.trim()) return
    setIsVerifying(true)
    try {
      const { result, updatedLocus } = await verifyLocusRecallApi({
        roomId: currentRoom.id,
        locusId: selectedLocus.id,
        userRecallText: recallInput,
      })
      setRecallResult(result)
      setSelectedLocus(updatedLocus)

      // Cập nhật lại state local
      if (state) {
        const updatedRooms = [...state.rooms]
        const room = updatedRooms[activeRoomIndex]
        if (room) {
          const lIdx = room.loci.findIndex((l) => l.id === updatedLocus.id)
          if (lIdx >= 0) room.loci[lIdx] = updatedLocus
        }
        setState({ ...state, rooms: updatedRooms })
      }
    } catch (err: unknown) {
      const msg = thongDiepLoiThanThien(err, 'Lỗi kiểm tra trí nhớ')
      alert(msg)
    } finally {
      setIsVerifying(false)
    }
  }

  const handleCreateRoom = async () => {
    if (!newRoomName.trim()) return
    try {
      const room = await createMemoryPalaceRoomApi({
        name: newRoomName,
        theme: newRoomTheme,
      })
      if (state) {
        setState({ ...state, rooms: [...state.rooms, room] })
        setActiveRoomIndex(state.rooms.length)
        setSelectedLocus(room.loci[0] || null)
      }
      setIsCreatingRoom(false)
      setNewRoomName('')
    } catch (err: unknown) {
      const msg = thongDiepLoiThanThien(err, 'Lỗi tạo phòng mới')
      alert(msg)
    }
  }

  // Portal ra document.body: hộp thoại nằm trong khung studio — tổ tiên có `transform` hoặc
  // `space-y-*` (lề dưới 16px) làm lớp phủ `fixed inset-0` lệch/co lại (changelog 0474).
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
      {...backdropProps}
    >
      <div
        {...dialogProps}
        className="relative w-full max-w-5xl max-h-[90dvh] bg-zinc-950 border border-amber-500/30 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-zinc-100 focus:outline-none"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-xl">
              🏛️
            </div>
            <div>
              <h2 id={titleId} className="text-lg font-bold text-white flex items-center gap-2">
                Cung Điện Trí Nhớ Không Gian (Spatial Method of Loci)
              </h2>
              <p className="text-xs text-zinc-400">
                Neo giữ kiến thức C1/C2 & STEM vào các điểm mốc đa giác quan
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="tap-44 shrink-0 w-11 h-11 flex items-center justify-center rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Room Navigation Tabs */}
        <div className="flex items-center gap-2 px-6 py-3 border-b border-zinc-800 bg-zinc-900/30 overflow-x-auto">
          {state?.rooms.map((room, idx) => (
            <button
              key={room.id}
              type="button"
              onClick={() => handleSelectRoom(idx)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeRoomIndex === idx
                  ? 'bg-amber-500 text-zinc-950 shadow-md font-bold'
                  : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <span>{room.name}</span>
              <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-black/20">
                {room.loci.length} Loci
              </span>
            </button>
          ))}

          <button
            type="button"
            onClick={() => setIsCreatingRoom(true)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-900 border border-dashed border-amber-500/40 text-amber-300 theme-light:text-amber-900 hover:bg-amber-500/10 transition-all flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm phòng</span>
          </button>
        </div>

        {/* Create Room Modal Section */}
        {isCreatingRoom && (
          <div className="p-4 bg-zinc-900 border-b border-zinc-800 flex flex-wrap items-center gap-3 animate-fadeIn">
            <input
              type="text"
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              placeholder="Tên phòng (ví dụ: Xưởng luyện tranh biện C2)..."
              className="px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 flex-1 min-w-[200px]"
            />
            <select
              value={newRoomTheme}
              onChange={(e) => setNewRoomTheme(e.target.value as MemoryPalaceTheme)}
              className="px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100"
            >
              <option value="knowledge_library">Thư viện tri thức</option>
              <option value="debate_sanctuary">Đấu trường tranh biện</option>
              <option value="stem_laboratory">Phòng thí nghiệm STEM</option>
              <option value="zen_garden">Khu vườn thiền</option>
              <option value="philosophical_atrium">Góc chiêm nghiệm</option>
            </select>
            <button
              type="button"
              onClick={handleCreateRoom}
              className="px-3 py-1.5 rounded-xl bg-amber-500 text-zinc-950 font-bold text-xs hover:bg-amber-400"
            >
              Tạo phòng
            </button>
            <button
              type="button"
              onClick={() => setIsCreatingRoom(false)}
              className="px-3 py-1.5 rounded-xl bg-zinc-800 text-zinc-400 text-xs hover:text-white"
            >
              Hủy
            </button>
          </div>
        )}

        {/* Main Content Layout */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Spatial Loci Map & Anchors */}
          <div className="lg:col-span-7 space-y-4">
            {currentRoom && (
              <>
                <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-950/30 to-zinc-900/60 border border-amber-500/20">
                  <h3 className="font-bold text-base text-amber-300 theme-light:text-amber-900">
                    {currentRoom.name}
                  </h3>
                  <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                    {currentRoom.description}
                  </p>
                </div>

                {/* Interactive Spatial Map */}
                <div className="relative w-full h-64 rounded-2xl bg-zinc-900/90 border border-zinc-800 p-4 overflow-hidden flex items-center justify-center">
                  <div className="absolute inset-0 bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:16px_16px] opacity-20" />

                  {/* Spatial Loci Markers */}
                  {currentRoom.loci.map((locus, i) => {
                    const isSelected = selectedLocus?.id === locus.id
                    return (
                      <button
                        key={locus.id}
                        type="button"
                        onClick={() => handleSelectLocus(locus)}
                        style={{
                          left: `${locus.spatialCoordinates.x}%`,
                          top: `${locus.spatialCoordinates.y}%`,
                        }}
                        className={`absolute -translate-x-1/2 -translate-y-1/2 p-2 rounded-2xl transition-all transform hover:scale-125 flex items-center gap-1.5 shadow-lg ${
                          isSelected
                            ? 'bg-amber-500 text-zinc-950 ring-4 ring-amber-500/30 scale-110 z-10 font-bold'
                            : locus.mastered
                              ? 'bg-emerald-600/80 text-white border border-emerald-400/40'
                              : 'bg-zinc-800/90 text-amber-300 theme-light:text-amber-900 border border-amber-500/30 hover:border-amber-400'
                        }`}
                        title={locus.label}
                      >
                        <MapPin className="w-3.5 h-3.5" />
                        <span className="text-[11px] max-w-[100px] truncate hidden sm:inline">
                          {i + 1}. {locus.label}
                        </span>
                      </button>
                    )
                  })}
                </div>

                {/* Loci List */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-zinc-400">
                    Các điểm neo Loci trong phòng ({currentRoom.loci.length})
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {currentRoom.loci.map((locus, i) => (
                      <button
                        key={locus.id}
                        type="button"
                        onClick={() => handleSelectLocus(locus)}
                        className={`p-3 rounded-xl text-left border transition-all flex items-start justify-between ${
                          selectedLocus?.id === locus.id
                            ? 'bg-amber-500/10 border-amber-500 text-amber-200 theme-light:text-amber-900'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                        }`}
                      >
                        <div>
                          <div className="text-xs font-bold flex items-center gap-1">
                            <span>#{i + 1}</span>
                            <span>{locus.label}</span>
                          </div>
                          <div className="text-[11px] text-zinc-400 truncate max-w-[180px] mt-0.5">
                            {locus.keyConcept}
                          </div>
                        </div>
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-zinc-800 font-semibold">
                          {locus.retentionStrength}%
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Right Column: Locus Deep Recall & Mnemonics */}
          <div className="lg:col-span-5 space-y-4">
            {selectedLocus ? (
              <div className="p-5 rounded-2xl bg-zinc-900/90 border border-amber-500/30 space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Key className="w-4 h-4 text-amber-400 theme-light:text-amber-900" />
                    <h4 className="font-bold text-sm text-white">{selectedLocus.label}</h4>
                  </div>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 theme-light:text-amber-900 font-bold border border-amber-500/30">
                    {selectedLocus.category.toUpperCase()}
                  </span>
                </div>

                {/* Target Concept */}
                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
                  <div className="text-[11px] text-zinc-400 font-bold uppercase">
                    Khái niệm & Tri thức mục tiêu
                  </div>
                  <div className="text-sm font-bold text-amber-300 theme-light:text-amber-900">
                    {selectedLocus.keyConcept}
                  </div>
                </div>

                {/* Mnemonic Story */}
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-1.5">
                  <div className="text-[11px] text-amber-400 theme-light:text-amber-900 font-bold uppercase flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Câu chuyện liên tưởng (Mnemonic Visual Cue):</span>
                  </div>
                  <p className="text-xs text-amber-100 theme-light:text-amber-900 leading-relaxed italic">
                    "{selectedLocus.mnemonicStory}"
                  </p>
                </div>

                {/* Active Recall Section */}
                <div className="space-y-2 pt-2 border-t border-zinc-800">
                  <label
                    htmlFor="memorypalaceexplorermodal-kiem-tra-truy-xuat-khong-gian-sp"
                    className="block text-xs font-bold text-zinc-300 uppercase"
                  >
                    Kiểm tra Truy xuất Không gian (Spatial Active Recall)
                  </label>
                  <textarea
                    id="memorypalaceexplorermodal-kiem-tra-truy-xuat-khong-gian-sp"
                    value={recallInput}
                    onChange={(e) => setRecallInput(e.target.value)}
                    placeholder="Nhắm mắt nhớ lại hình ảnh tại điểm neo này, gõ lại ý nghĩa khái niệm..."
                    rows={3}
                    className="w-full p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 focus:outline-none focus:border-amber-500 transition-all placeholder:text-zinc-500"
                  />
                  <button
                    type="button"
                    disabled={!recallInput.trim() || isVerifying}
                    onClick={handleVerifyRecall}
                    className="w-full py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-zinc-950 font-bold text-xs shadow-md transition-all active:scale-95 disabled:opacity-50"
                  >
                    {isVerifying ? 'Đang đối chiếu đường mòn thần kinh...' : 'Xác thực điểm neo 🧠'}
                  </button>
                </div>

                {/* Verification Feedback */}
                {recallResult && (
                  <div
                    className={`p-3 rounded-xl text-xs space-y-1 animate-fadeIn border ${
                      recallResult.isAccurate
                        ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200 theme-light:text-emerald-900'
                        : 'bg-amber-950/40 border-amber-500/40 text-amber-200 theme-light:text-amber-900'
                    }`}
                  >
                    <div className="font-bold flex items-center gap-1.5">
                      {recallResult.isAccurate ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 theme-light:text-emerald-900" />
                      ) : (
                        <Sparkles className="w-4 h-4 text-amber-400 theme-light:text-amber-900" />
                      )}
                      <span>Độ tương đồng: {recallResult.similarityScore}%</span>
                    </div>
                    <p className="text-[11px] leading-relaxed">{recallResult.feedback}</p>
                    <div className="text-[11px] text-zinc-400 pt-1">
                      Độ bền thần kinh mới: <strong>{recallResult.strengthenedRetention}%</strong>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 rounded-2xl bg-zinc-900 border border-zinc-800 text-center text-zinc-500 text-xs">
                Chọn một điểm neo Loci trên bản đồ để bắt đầu ôn tập.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
