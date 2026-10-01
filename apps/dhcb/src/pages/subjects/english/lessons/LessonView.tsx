// apps/dhcb/src/pages/subjects/english/lessons/LessonView.tsx — chi tiết bài học: audio player +
// karaoke. Tách từ Lessons.tsx 2026-09-06 (mã giữ nguyên); cùng ngày tách tiếp chế độ "Đóng vai"
// ra useRolePlay.ts + RolePlayToolbar/RolePlayTurnControls/RolePlayFinishBar.
//
// [S09c, 2026-09-24 — spec 2026-09-23 §2.7] Định vị trong bài bằng URL: `#dau-bai`, `#hoi-thoai`,
// `#luot-N`, `#ket-qua` (danh sách trắng ở lib/englishLessonAnchors.ts). Nhảy đích chỉ ĐỊNH VỊ
// phần đọc: không seek audio, không đổi lượt đóng vai, không mở micro/chấm/tự phát. Mọi điều
// hướng đều DỪNG phát/ghi âm và vô hiệu callback cũ (thế hệ `phatRef` + `useRolePlay`). Kết quả
// chấm hiện TẠI CHỖ ở `#ket-qua` (không thay cả màn như trước) để hội thoại và đích lượt vẫn còn.

import { useState, useRef, useEffect, useMemo, useCallback, useEffectEvent } from 'react'
import type { PointerEvent, ReactNode } from 'react'
import { useLocation, useNavigate, useNavigationType } from 'react-router-dom'
import { Play, Pause, Square, Volume2, ChevronUp, ChevronDown } from 'lucide-react'
import {
  speak,
  stopSpeaking,
  pauseCurrentAudio,
  resumeCurrentAudio,
  unlockAudio,
  prefetchSpeech,
  getRatePref,
  setRatePref,
  type Voice,
} from '../../../../lib/tts'
import { pickRandomVoice } from '../../../../lib/voiceTiers'
import VoiceRoleBadge from '../../../../components/VoiceRoleBadge'
import EvaluationResultView from '../../../../components/EvaluationResultView'
import { type Lesson } from '../../../../data/lessons/loader'
import type { Plan } from '../../../../types'
import { COLORS } from './shared'
import type { Speed, AudioMode, WordSync } from './shared'
import { WordText } from './WordText'
import { InlinePronounce } from './InlinePronounce'
import { useRolePlay } from './useRolePlay'
import { RolePlayToolbar } from './RolePlayToolbar'
import { RolePlayTurnControls } from './RolePlayTurnControls'
import { RolePlayFinishBar } from './RolePlayFinishBar'
import { TrongBaiHoiThoai, type LuotTrongBai } from './TrongBaiHoiThoai'
import {
  giaiNeoBaiAnh,
  kieuCuonTheoDoc,
  NEO_BAI_ANH,
  neoLuot,
  nhanLuot,
} from '../../../../lib/englishLessonAnchors'

// Khoảng thở giữa mép trên vùng nhìn thấy và đích sau khi nhảy.
const KHOANG_THO_PX = 12
// Header sticky 56px + khoảng thở, khớp `top-16` của thanh điều khiển ở khuôn desktop.
const DAU_TRANG_DESKTOP_PX = 64

// ── Chi tiết bài học với audio player + karaoke ──────────────────────────────
export function LessonView({
  lesson,
  isA,
  color,
  plan,
  userId,
  onBack,
  variant = 'mobile',
  footer,
}: {
  lesson: Lesson
  isA: boolean
  color: (typeof COLORS)[0]
  plan: Plan
  userId: string
  onBack: () => void
  /**
   * Khuôn dựng — QUYẾT ĐỊNH BỞI JS chứ không phải `lg:` (xem luật của `TwoPane`).
   *
   * - `mobile`: như trước — cột dọc chiếm trọn chiều cao, thanh điều khiển đứng yên ở trên,
   *   bong bóng hội thoại cuộn NỘI BỘ. Đúng cho màn hình chỉ chứa được một thứ một lúc.
   * - `desktop`: nằm trong cột phải của master–detail. Ở đây trang đã cuộn theo cả trang rồi,
   *   nên cuộn nội bộ nữa là hai thanh cuộn lồng nhau; thanh điều khiển chuyển sang `sticky`
   *   để vẫn bám theo, còn nút "← Danh sách" bỏ đi vì danh sách hiện sẵn bên trái.
   */
  variant?: 'mobile' | 'desktop'
  /**
   * Khối cuối bài, nằm TRONG vùng cuộn của bài (mobile cuộn nội bộ — đặt ngoài là không bao giờ
   * cuộn tới). Dùng cho "Bài trước / Bài sau" (audit đồng nhất bố cục 2026-10-01).
   */
  footer?: ReactNode
}) {
  const isDesktopPane = variant === 'desktop'
  // Phân giọng cho từng nhân vật — RANDOM trong số giọng gói hiện tại cho phép (đúng giới
  // tính của vai), đổi mỗi lần mở bài học khác/mở lại, để người dùng nghe thử nhiều giọng rồi
  // chọn giọng ưng ý làm mặc định (nút "Đặt mặc định" ở VoiceRoleBadge).
  const genderA = lesson.speakerAGender ?? 'female'
  const genderB = lesson.speakerBGender ?? 'male'
  const initialVoices = useMemo<{ voiceA: Voice; voiceB: Voice }>(() => {
    const a = pickRandomVoice(genderA, plan)
    let b = pickRandomVoice(genderB, plan)
    for (let i = 0; i < 5 && b === a; i++) b = pickRandomVoice(genderB, plan)
    return { voiceA: a, voiceB: b }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson.id, genderA, genderB, plan])

  const [voiceA, setVoiceA] = useState<Voice>(initialVoices.voiceA)
  const [voiceB, setVoiceB] = useState<Voice>(initialVoices.voiceB)
  const voiceARef = useRef<Voice>(initialVoices.voiceA)
  const voiceBRef = useRef<Voice>(initialVoices.voiceB)
  // Đổi bài học → nhận cặp giọng random mới: state reset bằng pattern so-sánh-prev
  // ngay trong render (không setState đồng bộ trong effect); ref đồng bộ ở effect dưới.
  const [prevInitialVoices, setPrevInitialVoices] = useState(initialVoices)
  if (initialVoices !== prevInitialVoices) {
    setPrevInitialVoices(initialVoices)
    setVoiceA(initialVoices.voiceA)
    setVoiceB(initialVoices.voiceB)
  }
  useEffect(() => {
    voiceARef.current = initialVoices.voiceA
    voiceBRef.current = initialVoices.voiceB
  }, [initialVoices])

  function changeVoiceA(v: Voice) {
    setVoiceA(v)
    voiceARef.current = v
  }
  function changeVoiceB(v: Voice) {
    setVoiceB(v)
    voiceBRef.current = v
  }

  const [activeTurn, setActiveTurn] = useState<number | null>(null)
  const [playing, setPlaying] = useState(false)
  const [paused, setPaused] = useState(false)
  // Panel "Cài đặt giọng" ẩn mặc định, bấm nhãn ở thanh control mới hiện; đặt xong 1 giọng thì
  // tự ẩn lại sau 3s (đỡ chiếm chỗ màn hình nhỏ).
  const [voiceSettingsOpen, setVoiceSettingsOpen] = useState(false)
  const hideVoiceSettingsRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(
    () => () => {
      if (hideVoiceSettingsRef.current) clearTimeout(hideVoiceSettingsRef.current)
    },
    [],
  )
  function handleVoiceSet() {
    if (hideVoiceSettingsRef.current) clearTimeout(hideVoiceSettingsRef.current)
    hideVoiceSettingsRef.current = setTimeout(() => setVoiceSettingsOpen(false), 3000)
  }
  const [speed, setSpeed] = useState<Speed>(getRatePref())
  const [mode, setMode] = useState<AudioMode>('en')
  const [wordSync, setWordSync] = useState<WordSync | null>(null)

  // Thế hệ phát audio: mỗi lần phát/dừng/điều hướng tăng lên; chuỗi phát cũ so lại sau MỖI
  // `await` và tự thoát nếu đã khác. Cờ boolean `stopRef` cũ bị lượt "Phát tất cả" mới đặt lại
  // `false` trong khi vòng cũ còn đang chờ giọng đọc → hai vòng chạy song song.
  const phatRef = useRef(0)
  const pauseRef = useRef(false)
  const speedRef = useRef<Speed>(getRatePref())
  const modeRef = useRef<AudioMode>('en')
  const turnRefs = useRef<(HTMLDivElement | null)[]>([])
  const wordSyncRef = useRef<WordSync | null>(null)
  const speedDragRef = useRef<{ startY: number; steps: number } | null>(null)

  // Dừng audio khi thoát trang hoặc back về danh sách
  useEffect(() => {
    // Giữ chính đối tượng ref (không phải giá trị) để cleanup vô hiệu hoá đúng thế hệ đang chạy.
    const phat = phatRef
    return () => {
      phat.current++
      stopSpeaking()
    }
  }, [])

  function changeSpeed(s: Speed) {
    setSpeed(s)
    speedRef.current = s
    setRatePref(s)
  }
  function changeMode(m: AudioMode) {
    setMode(m)
    modeRef.current = m
  }

  function syncWord(ws: WordSync | null) {
    const prev = wordSyncRef.current
    if (!ws) {
      if (prev !== null) {
        wordSyncRef.current = null
        setWordSync(null)
      }
      return
    }
    if (prev?.turnIdx === ws.turnIdx && prev?.lang === ws.lang && prev?.wordIdx === ws.wordIdx)
      return
    wordSyncRef.current = ws
    setWordSync({ ...ws })
  }

  async function startPlayAll() {
    unlockAudio() // mở khoá audio iOS NGAY trong cú bấm (trước mọi await)
    const the = ++phatRef.current
    const daDung = () => the !== phatRef.current
    pauseRef.current = false
    setPlaying(true)
    setPaused(false)
    setActiveTurn(null)

    const targetLang = isA ? 'en-US' : 'vi-VN'
    const transLang = isA ? 'vi-VN' : 'en-US'

    // Nạp TRƯỚC audio các lượt (chạy nền, tuần tự) để phát liền mạch không khựng.
    // Tải nhanh hơn đọc nên bộ nạp luôn đi trước trình phát; trùng câu thì gộp (dedup).
    void (async () => {
      for (const t of lesson.turns) {
        if (daDung()) break
        const v = t.speaker === 'A' ? voiceARef.current : voiceBRef.current
        const m = modeRef.current
        if (m === 'en' || m === 'both') await prefetchSpeech(t.en, 'en-US', v)
        if (m === 'vi' || m === 'both') await prefetchSpeech(t.vi, 'vi-VN', v)
      }
    })()

    for (let i = 0; i < lesson.turns.length; i++) {
      if (daDung()) return
      while (pauseRef.current && !daDung()) await new Promise((r) => setTimeout(r, 100))
      if (daDung()) return

      const t = lesson.turns[i]
      if (!t) continue // i < turns.length nên t luôn có; guard để TS narrow kiểu
      setActiveTurn(i)
      // Cuộn theo dòng đang đọc — mượt, trừ khi người dùng bật giảm chuyển động.
      turnRefs.current[i]?.scrollIntoView({ behavior: kieuCuonTheoDoc(), block: 'center' })

      const targetText = isA ? t.en : t.vi
      const transText = isA ? t.vi : t.en
      const curMode = modeRef.current
      const curSpeed = speedRef.current
      const curVoice = t.speaker === 'A' ? voiceARef.current : voiceBRef.current

      if (curMode === 'en') {
        await speak(t.en, 'en-US', curVoice, curSpeed, (wi) =>
          syncWord({ turnIdx: i, lang: 'en', wordIdx: wi }),
        )
      } else if (curMode === 'vi') {
        await speak(t.vi, 'vi-VN', curVoice, curSpeed, (wi) =>
          syncWord({ turnIdx: i, lang: 'vi', wordIdx: wi }),
        )
      } else {
        const tLang = isA ? 'en' : 'vi'
        const rLang = isA ? 'vi' : 'en'
        await speak(targetText, targetLang, curVoice, curSpeed, (wi) =>
          syncWord({ turnIdx: i, lang: tLang, wordIdx: wi }),
        )
        if (daDung()) return
        syncWord(null)
        await new Promise((r) => setTimeout(r, 250))
        if (daDung()) return
        await speak(transText, transLang, curVoice, curSpeed, (wi) =>
          syncWord({ turnIdx: i, lang: rLang, wordIdx: wi }),
        )
      }

      if (daDung()) return
      syncWord(null)
      await new Promise((r) => setTimeout(r, 500))
    }

    if (daDung()) return
    setActiveTurn(null)
    setPlaying(false)
    setPaused(false)
    syncWord(null)
  }

  function handlePause() {
    pauseRef.current = true
    setPaused(true)
    pauseCurrentAudio()
  }
  function handleResume() {
    pauseRef.current = false
    setPaused(false)
    resumeCurrentAudio()
  }
  function handleStop() {
    phatRef.current++
    pauseRef.current = false
    stopSpeaking()
    setPlaying(false)
    setPaused(false)
    setActiveTurn(null)
    syncWord(null)
  }

  async function playTurn(idx: number) {
    unlockAudio() // mở khoá audio iOS NGAY trong cú bấm (trước mọi await)
    if (playing || paused) handleStop()
    const the = ++phatRef.current
    const daDung = () => the !== phatRef.current
    await new Promise((r) => setTimeout(r, 80))
    if (daDung()) return

    const t = lesson.turns[idx]
    if (!t) return // idx ngoài phạm vi thì không phát gì
    const targetLang = isA ? 'en-US' : 'vi-VN'
    const transLang = isA ? 'vi-VN' : 'en-US'
    const targetText = isA ? t.en : t.vi
    const transText = isA ? t.vi : t.en
    const curMode = modeRef.current
    const curSpeed = speedRef.current
    const curVoice = t.speaker === 'A' ? voiceARef.current : voiceBRef.current

    if (curMode === 'en') {
      await speak(t.en, 'en-US', curVoice, curSpeed, (wi) =>
        syncWord({ turnIdx: idx, lang: 'en', wordIdx: wi }),
      )
    } else if (curMode === 'vi') {
      await speak(t.vi, 'vi-VN', curVoice, curSpeed, (wi) =>
        syncWord({ turnIdx: idx, lang: 'vi', wordIdx: wi }),
      )
    } else {
      const tLang = isA ? 'en' : 'vi'
      const rLang = isA ? 'vi' : 'en'
      await speak(targetText, targetLang, curVoice, curSpeed, (wi) =>
        syncWord({ turnIdx: idx, lang: tLang, wordIdx: wi }),
      )
      if (daDung()) return
      syncWord(null)
      await new Promise((r) => setTimeout(r, 250))
      if (daDung()) return
      await speak(transText, transLang, curVoice, curSpeed, (wi) =>
        syncWord({ turnIdx: idx, lang: rLang, wordIdx: wi }),
      )
    }
    if (daDung()) return
    syncWord(null)
  }

  // ── Chế độ "Đóng vai" — state + logic ở useRolePlay.ts (tách 2026-09-06) ───────────
  const {
    isPro,
    canRecord,
    rolePlay,
    rolePicker,
    setRolePicker,
    rpIdx,
    rpRecording,
    rpTranscribing,
    rpFinished,
    rpEvaluating,
    rpEvaluation,
    rpError,
    rpThrottled,
    startRolePlay,
    stopRolePlay,
    huyTheoDieuHuong,
    closeRolePlayResult,
    gradeRolePlay,
    beginRolePlayRecording,
    finishRolePlayRecording,
    skipRolePlayLine,
  } = useRolePlay({
    lesson,
    isA,
    plan,
    userId,
    speedRef,
    voiceARef,
    voiceBRef,
    setActiveTurn,
    syncWord,
  })

  // ── Định vị trong bài theo URL (S09c) ─────────────────────────────────────────
  const location = useLocation()
  const navigate = useNavigate()
  const kieuDieuHuong = useNavigationType()
  const panelRef = useRef<HTMLDivElement>(null)
  const toolbarRef = useRef<HTMLDivElement>(null)
  // Bấm lại CÙNG đích: hash không đổi nên không có gì để effect phản ứng. Bộ đếm này là tín
  // hiệu "focus lại đích hiện tại" mà KHÔNG thêm history entry.
  const [lanNhay, setLanNhay] = useState(0)
  // Hash ĐANG CHỜ router áp (đã push nhưng location chưa kịp đổi) — so với nó thay vì
  // `location.hash` trong closure, để bấm nhanh liên tiếp không đẩy entry trùng (bài học S09b).
  const hashDangCho = useRef<string | null>(null)
  useEffect(() => {
    if (hashDangCho.current === location.hash || kieuDieuHuong === 'POP') hashDangCho.current = null
  }, [location.hash, kieuDieuHuong])

  /** Nhảy tới một đích trong bài: chỉ đổi hash (giữ pathname + query), không đụng audio/nháp. */
  const nhay = useCallback(
    (id: string) => {
      const hashMoi = `#${id}`
      if ((hashDangCho.current ?? location.hash) === hashMoi) {
        setLanNhay((n) => n + 1)
        return
      }
      hashDangCho.current = hashMoi
      navigate({ pathname: location.pathname, search: location.search, hash: hashMoi })
    },
    [location.hash, location.pathname, location.search, navigate],
  )

  // Mọi điều hướng áp lên bài đang mở (đổi hash, Back/Forward) → dừng phát, huỷ ghi âm/STT/chấm
  // đang chờ; đóng vai đang chạy kết thúc CHƯA hoàn thành. Đổi bài/owner/chiều thì trang remount
  // LessonView (xem `key` ở Lessons.tsx) và cleanup lo phần đó.
  const huyKhiDieuHuong = useEffectEvent(() => {
    handleStop()
    huyTheoDieuHuong()
  })
  const keyDaXuLy = useRef(location.key)
  useEffect(() => {
    if (keyDaXuLy.current === location.key) return
    keyDaXuLy.current = location.key
    huyKhiDieuHuong()
  }, [location.key])

  // Focus + cuộn tới đích sau khi ĐÚNG bài này đã render (component chỉ sống khi bài đã nạp).
  // Chỉ gọi `getElementById` với id đã qua danh sách trắng — không dựng CSS selector từ URL.
  const hashDaXuLy = useRef<string | null>(null)
  useEffect(() => {
    const panel = panelRef.current
    if (!panel) return
    const truoc = hashDaXuLy.current
    hashDaXuLy.current = location.hash
    const dich = giaiNeoBaiAnh(location.hash, lesson.turns.length)
    const dauBai = document.getElementById(NEO_BAI_ANH.dauBai)

    if (dich.loai === 'khong') {
      // Không hash: người học vừa CHỌN bài (PUSH) hoặc Back về entry đầu bài → focus tiêu đề,
      // không cuộn. Mở thẳng/tải lại (POP) thì giữ hành vi cũ, không cướp focus.
      const quayVeDauBai = truoc !== null && truoc !== ''
      const vuaChonBai = truoc === null && kieuDieuHuong !== 'POP'
      if (quayVeDauBai || vuaChonBai) dauBai?.focus({ preventScroll: true })
      return
    }
    const el = dich.loai === 'dich' ? document.getElementById(dich.id) : null
    const target = el && panel.contains(el) ? el : dauBai
    if (!target) return
    target.focus({ preventScroll: true })
    // Chừa chỗ cho header + thanh điều khiển sticky ở desktop; mobile cuộn trong panel riêng
    // (thanh điều khiển nằm ngoài panel) nên chỉ cần khoảng thở.
    const lech = isDesktopPane
      ? DAU_TRANG_DESKTOP_PX + (toolbarRef.current?.offsetHeight ?? 0) + KHOANG_THO_PX
      : KHOANG_THO_PX
    target.style.scrollMarginTop = `${lech}px`
    // `instant` kể cả khi không bật giảm chuyển động: cuộn mượt làm focus và vị trí lệch nhau
    // trong lúc chạy; người bật prefers-reduced-motion không bao giờ gặp chuyển động.
    target.scrollIntoView({ block: 'start', behavior: 'instant' })
  }, [location.hash, lanNhay, lesson.turns.length, kieuDieuHuong, isDesktopPane])

  // Chấm xong → đưa người học tới `#ket-qua` (một entry mới, Back về chỗ cũ).
  const danhGiaDaXuLy = useRef(rpEvaluation)
  useEffect(() => {
    if (rpEvaluation && rpEvaluation !== danhGiaDaXuLy.current) nhay(NEO_BAI_ANH.ketQua)
    danhGiaDaXuLy.current = rpEvaluation
  }, [rpEvaluation, nhay])

  // Đóng kết quả: giữ reset đóng vai của caller, rồi về phần hội thoại.
  function dongKetQua() {
    closeRolePlayResult()
    nhay(NEO_BAI_ANH.hoiThoai)
  }

  const speakerName = (role: 'A' | 'B') =>
    role === 'A'
      ? isA
        ? (lesson.speakerAName?.vi ?? 'Người A')
        : (lesson.speakerAName?.en ?? 'Person A')
      : isA
        ? (lesson.speakerBName?.vi ?? 'Người B')
        : (lesson.speakerBName?.en ?? 'Person B')

  const isIdle = !playing && !paused && !rolePlay
  const SPEEDS: Speed[] = [0.75, 1, 1.25]

  function stepSpeed(delta: number) {
    const i = SPEEDS.indexOf(speedRef.current)
    const next = SPEEDS[(i + delta + SPEEDS.length) % SPEEDS.length]
    if (next !== undefined) changeSpeed(next)
  }
  function onSpeedPointerDown(e: PointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId)
    speedDragRef.current = { startY: e.clientY, steps: 0 }
  }
  function onSpeedPointerMove(e: PointerEvent<HTMLDivElement>) {
    const d = speedDragRef.current
    if (!d) return
    const diff = e.clientY - d.startY
    const targetSteps = Math.trunc(-diff / 32)
    if (targetSteps !== d.steps) {
      stepSpeed(targetSteps - d.steps)
      d.steps = targetSteps
    }
  }
  function onSpeedPointerUp() {
    speedDragRef.current = null
  }

  const MODES: { key: AudioMode; label: string }[] = [
    { key: 'en', label: 'EN' },
    { key: 'both', label: isA ? 'EN+VI' : 'VI+EN' },
    { key: 'vi', label: 'VI' },
  ]

  const dsLuot: LuotTrongBai[] = lesson.turns.map((t, i) => ({
    soThuTu: i + 1,
    nhan: nhanLuot(i + 1, speakerName(t.speaker), isA),
  }))

  return (
    <>
      {/* Thanh điều khiển audio — không cuộn, giống CommonPhrases giữ nội dung trong flex.
          Ở khuôn desktop nó nằm trong luồng cuộn của trang nên phải `sticky`: truyện/hội thoại
          dài vài màn hình, mà Tạm dừng/Dừng là thứ cần đúng lúc đang nghe dở. `top-16` chừa
          đúng header sticky cao 56px cộng khoảng thở, khớp `top-20` của cột phụ `TwoPane`. */}
      <div
        ref={toolbarRef}
        className={
          isDesktopPane
            ? 'sticky top-16 z-10 mb-4 rounded-2xl border border-zinc-800/60 bg-zinc-950/95 backdrop-blur-sm px-3 py-2.5'
            : 'bg-zinc-950/95 backdrop-blur-sm border-b border-zinc-800/40 px-4 py-2.5'
        }
      >
        <div className={isDesktopPane ? '' : 'max-w-3xl mx-auto'}>
          <div className="glass rounded-xl px-3 py-2 flex flex-wrap items-center gap-x-3 gap-y-2">
            {/* Nút quay lại danh sách — CHỈ khuôn mobile. Ở desktop danh sách đứng sẵn bên
                trái nên nút này vừa thừa vừa gây hiểu nhầm là sẽ rời trang. */}
            {!isDesktopPane && (
              <>
                <button
                  onClick={onBack}
                  className="tap-44-y shrink-0 text-xs text-zinc-400 hover:text-white transition flex items-center gap-1"
                >
                  ← {isA ? 'Danh sách' : 'Back'}
                </button>

                <div className="h-3.5 w-px bg-zinc-700" />
              </>
            )}

            {/* [S09c] Các PHẦN của bài đang mở — luôn trong tầm tay trên thanh điều khiển. */}
            <TrongBaiHoiThoai isA={isA} luot={dsLuot} onChon={nhay} />

            {/* Play / Pause / Resume / Stop */}
            <div className="flex items-center gap-1.5">
              {isIdle && (
                <button
                  onClick={() => void startPlayAll()}
                  className="tap-44-y flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-accent-500/20 hover:bg-accent-500/30 text-accent-300 theme-light:text-accent-800 text-xs font-medium transition"
                >
                  <Play className="w-3 h-3 fill-current" />
                  {isA ? 'Phát tất cả' : 'Play all'}
                </button>
              )}
              {playing && !paused && (
                <button
                  onClick={handlePause}
                  className="tap-44-y flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 theme-light:text-amber-900 text-xs font-medium transition"
                >
                  <Pause className="w-3 h-3 fill-current" />
                  {isA ? 'Dừng' : 'Pause'}
                </button>
              )}
              {paused && (
                <button
                  onClick={handleResume}
                  className="tap-44-y flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-accent-500/20 hover:bg-accent-500/30 text-accent-300 theme-light:text-accent-800 text-xs font-medium transition"
                >
                  <Play className="w-3 h-3 fill-current" />
                  {isA ? 'Tiếp' : 'Resume'}
                </button>
              )}
              {!isIdle && !rolePlay && (
                <button
                  onClick={handleStop}
                  className="tap-44 w-6 h-6 flex items-center justify-center rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
                >
                  <Square className="w-3 h-3 fill-current" />
                </button>
              )}
            </div>

            <div className="h-3.5 w-px bg-zinc-700" />

            {/* Tốc độ — chỉ hiện tốc độ hiện tại, vuốt lên/xuống (hoặc bấm mũi tên) để đổi */}
            <div
              onPointerDown={onSpeedPointerDown}
              onPointerMove={onSpeedPointerMove}
              onPointerUp={onSpeedPointerUp}
              onPointerCancel={onSpeedPointerUp}
              className="flex items-center gap-0.5 cursor-ns-resize touch-none select-none"
              title={isA ? 'Vuốt lên/xuống để đổi tốc độ' : 'Swipe up/down to change speed'}
            >
              <button
                type="button"
                onClick={() => stepSpeed(-1)}
                aria-label={isA ? 'Tốc độ chậm hơn' : 'Slower'}
                className="tap-44 flex items-center justify-center text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/60 rounded-lg transition"
              >
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
              <span className="min-w-[30px] text-center px-1.5 py-0.5 rounded text-xs font-medium bg-sky-500/20 text-sky-200 theme-light:text-sky-900 border border-sky-500/40">
                {speed}×
              </span>
              <button
                type="button"
                onClick={() => stepSpeed(1)}
                aria-label={isA ? 'Tốc độ nhanh hơn' : 'Faster'}
                className="tap-44 flex items-center justify-center text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/60 rounded-lg transition"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="h-3.5 w-px bg-zinc-700" />

            {/* Chế độ nghe */}
            <div className="flex items-center gap-1">
              <Volume2 className="w-3 h-3 text-zinc-400 shrink-0" />
              {MODES.map((m) => (
                <button
                  key={m.key}
                  onClick={() => changeMode(m.key)}
                  className={`px-1.5 py-0.5 rounded text-xs font-medium transition ${
                    mode === m.key
                      ? 'bg-violet-500/20 text-violet-300 theme-light:text-violet-800 border border-violet-500/40'
                      : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            <div className="h-3.5 w-px bg-zinc-700" />

            {/* Đóng vai — chỉ VIP. Free thấy nút khoá + link nâng cấp. */}
            <RolePlayToolbar
              isA={isA}
              isPro={isPro}
              canRecord={canRecord}
              rolePlay={rolePlay}
              rolePicker={rolePicker}
              setRolePicker={setRolePicker}
              speakerName={speakerName}
              startRolePlay={startRolePlay}
              stopRolePlay={stopRolePlay}
            />

            {/* Nút mở/ẩn panel giọng — nằm ở phần còn dư của thanh control */}
            <div className="ml-auto flex items-center gap-2 shrink-0">
              {(playing || rolePlay) && activeTurn !== null && (
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent-400 animate-pulse" />
                  <span className="text-[11px] text-zinc-400">
                    {activeTurn + 1}/{lesson.turns.length}
                  </span>
                </div>
              )}
              {!rolePlay && (
                <button
                  type="button"
                  onClick={() => setVoiceSettingsOpen((o) => !o)}
                  aria-expanded={voiceSettingsOpen}
                  className={`px-1.5 py-0.5 rounded text-xs font-medium transition ${
                    voiceSettingsOpen
                      ? 'bg-zinc-800 text-zinc-200'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {isA ? 'Cài đặt giọng' : 'Voice settings'}
                </button>
              )}
            </div>
          </div>

          {rpError && (
            <p className="text-[11px] text-red-400 theme-light:text-red-700 mt-1.5 px-1">
              {rpError}
            </p>
          )}

          {/* Giọng đang phát cho từng nhân vật — vuốt lên/xuống để đổi ngay + nút đặt mặc định —
              chỉ hiện khi bấm "Cài đặt giọng", tự ẩn 3s sau khi đặt mặc định */}
          {voiceSettingsOpen && !rolePlay && (
            <div className="flex gap-2 mt-2 animate-fade-in">
              <VoiceRoleBadge
                voice={voiceA}
                gender={genderA}
                label="A"
                isA={isA}
                plan={plan}
                onChange={changeVoiceA}
                onSet={handleVoiceSet}
              />
              <VoiceRoleBadge
                voice={voiceB}
                gender={genderB}
                label="B"
                isA={isA}
                plan={plan}
                onChange={changeVoiceB}
                onSet={handleVoiceSet}
              />
            </div>
          )}
        </div>
      </div>

      {/* Bong bóng hội thoại — khuôn mobile cuộn NỘI BỘ (không cuộn cả trang); khuôn desktop
          nằm trong luồng cuộn chung của `PageShell` nên không tự cuộn nữa. */}
      <div ref={panelRef} className={isDesktopPane ? '' : 'flex-1 overflow-y-auto'}>
        <div className={isDesktopPane ? 'pb-8' : 'max-w-3xl mx-auto px-4 py-4 pb-8'}>
          {/* [S09c] Tiêu đề bài = đích `#dau-bai` và nơi rơi về khi hash hỏng. Header trang không
              còn nhắc lại tên bài (tránh lặp chữ hai lần trên cùng một màn). */}
          <h1
            id={NEO_BAI_ANH.dauBai}
            tabIndex={-1}
            // [2026-10-01, audit đồng nhất bố cục] Cùng thang chữ tiêu đề bài với bài STEM
            // (`text-2xl sm:text-3xl font-extrabold`) — trước đây 18px, nhỏ hơn cả tiêu đề mục
            // "Lý thuyết" bên môn Lý (20px), nên ba môn có ba cỡ tiêu đề bài khác nhau.
            className="text-2xl sm:text-3xl font-extrabold leading-tight text-white focus:outline-none focus-visible:underline"
          >
            {isA ? `Bài ${lesson.id}: ${lesson.title}` : `Lesson ${lesson.id}: ${lesson.title}`}
          </h1>
          <p className="mt-1 text-sm text-zinc-400">{lesson.situation}</p>

          <h2
            id={NEO_BAI_ANH.hoiThoai}
            tabIndex={-1}
            className="mt-5 mb-3 text-sm font-semibold text-zinc-300 focus:outline-none focus-visible:underline"
          >
            {isA
              ? `Hội thoại · ${lesson.turns.length} lượt`
              : `Dialogue · ${lesson.turns.length} turns`}
          </h2>

          <div className="space-y-3">
            {lesson.turns.map((t, i) => {
              const isActive = activeTurn === i
              const isLeft = t.speaker === 'A'
              const isMyTurn = rolePlay !== null && rpIdx === i

              return (
                <div
                  key={i}
                  ref={(el) => {
                    turnRefs.current[i] = el
                  }}
                  className={`flex ${isLeft ? 'justify-start' : 'justify-end'}`}
                >
                  {/* [S09c] Đích `#luot-N` (N theo thứ tự nguồn, từ 1): focus được bằng mã lệnh,
                    không thêm điểm dừng Tab; nhãn "Lượt N — người nói" cho trình đọc màn hình. */}
                  <div
                    id={neoLuot(i + 1)}
                    role="group"
                    tabIndex={-1}
                    aria-label={nhanLuot(i + 1, speakerName(t.speaker), isA)}
                    className={`max-w-[85%] rounded-2xl p-3.5 transition-all duration-300 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-accent-400 ${
                      isActive
                        ? isLeft
                          ? `${color.bg} border ${color.border} shadow-lg`
                          : 'bg-sky-500/15 border border-sky-500/50 shadow-lg shadow-sky-500/10'
                        : isLeft
                          ? 'bg-zinc-900 border border-zinc-800'
                          : 'bg-accent-500/10 border border-accent-500/30'
                    } ${isMyTurn ? 'ring-2 ring-offset-1 ring-offset-zinc-950 ring-accent-500/60 animate-pulse' : ''}`}
                  >
                    {/* Nhãn speaker + nút phát + nút kiểm tra phát âm */}
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <p className="text-[11px] font-medium text-zinc-400">
                        {/* Số lượt nhìn thấy được để khớp với lưới "Tới lượt" trong mục Trong bài. */}
                        <span aria-hidden="true" className="mr-1.5 tabular-nums">
                          {i + 1}.
                        </span>
                        {speakerName(t.speaker)}
                        {isMyTurn && (
                          <span className="ml-1.5 text-violet-400 theme-light:text-violet-800">
                            {isA ? '· đến lượt bạn' : '· your turn'}
                          </span>
                        )}
                      </p>
                      {/* gap-2 để vùng chạm 44px của 2 nút cạnh nhau không đè lên nhau */}
                      {!rolePlay && (
                        <div className="flex items-center gap-2">
                          <InlinePronounce
                            text={isA ? t.en : t.vi}
                            lang={isA ? 'en-US' : 'vi-VN'}
                            isA={isA}
                          />
                          <button
                            onClick={() => void playTurn(i)}
                            title={isA ? 'Nghe câu này' : 'Play this line'}
                            aria-label={isA ? 'Nghe câu này' : 'Play this line'}
                            className={`tap-44 shrink-0 w-9 h-9 flex items-center justify-center rounded-full transition ${
                              isActive
                                ? `${color.text} bg-zinc-800/50`
                                : 'text-zinc-400 hover:text-zinc-300 hover:bg-zinc-700'
                            }`}
                          >
                            <Volume2
                              className={`w-[1.125rem] h-[1.125rem] ${isActive ? 'animate-pulse' : ''}`}
                            />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Câu chính */}
                    <WordText
                      text={isA ? t.en : t.vi}
                      baseClass={`text-sm leading-relaxed ${isActive ? color.text : 'text-white'}`}
                      wordSync={wordSync}
                      turnIdx={i}
                      lang={isA ? 'en' : 'vi'}
                    />

                    {/* Bản dịch */}
                    <WordText
                      text={isA ? t.vi : t.en}
                      baseClass="text-xs text-zinc-400 italic mt-1 leading-relaxed"
                      wordSync={wordSync}
                      turnIdx={i}
                      lang={isA ? 'vi' : 'en'}
                    />

                    {/* Đến lượt người dùng trong chế độ đóng vai → nút ghi âm thay vì phát TTS */}
                    {isMyTurn && (
                      <RolePlayTurnControls
                        isA={isA}
                        canRecord={canRecord}
                        rpRecording={rpRecording}
                        rpTranscribing={rpTranscribing}
                        beginRolePlayRecording={beginRolePlayRecording}
                        finishRolePlayRecording={finishRolePlayRecording}
                        skipRolePlayLine={skipRolePlayLine}
                      />
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* [S09c] `#ket-qua` LUÔN có. Chỉ hiện kết quả chấm TRONG BỘ NHỚ của đúng lần mở bài
              này (LessonView remount theo bài/owner/chiều) — không điểm giả, không tự chấm, không
              gắn lỗi thứ N vào lượt N (lỗi chưa có định danh lượt). */}
          <section aria-labelledby={NEO_BAI_ANH.ketQua} className="mt-8">
            <h2
              id={NEO_BAI_ANH.ketQua}
              tabIndex={-1}
              className="text-sm font-semibold text-zinc-300 focus:outline-none focus-visible:underline"
            >
              {isA ? 'Kết quả' : 'Result'}
            </h2>
            {rpEvaluation ? (
              <EvaluationResultView
                evaluation={rpEvaluation}
                onClose={dongKetQua}
                dir={isA ? 'A' : 'B'}
                landmark={false}
              />
            ) : (
              <div className="mt-2 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
                <p className="text-sm text-zinc-200">
                  {isA
                    ? 'Chưa có kết quả trong lần mở bài này.'
                    : 'No result yet in this visit to the lesson.'}
                </p>
                <p className="mt-1 text-xs text-zinc-400">
                  {isA
                    ? 'Kết quả chỉ có sau khi bạn đóng vai hết bài rồi bấm “Kết thúc & chấm điểm”. Tải lại trang thì kết quả cũ không được giữ.'
                    : 'A result appears only after you role-play the whole lesson and tap “Finish & grade”. Reloading the page does not keep an earlier result.'}
                </p>
                <a
                  href={`#${NEO_BAI_ANH.hoiThoai}`}
                  onClick={(e) => {
                    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
                    e.preventDefault()
                    nhay(NEO_BAI_ANH.hoiThoai)
                  }}
                  className="tap-44 mt-2 inline-flex items-center text-xs font-medium text-zinc-200 underline underline-offset-4"
                >
                  {isA ? 'Về phần hội thoại' : 'Back to the dialogue'}
                </a>
              </div>
            )}
          </section>
          {footer && <div className="mt-8">{footer}</div>}
        </div>
      </div>

      {/* Kết thúc đóng vai xong (chưa chấm) → thanh dưới cùng màn hình, luôn trong tầm tay
          bấm (không phải cuộn lên) — giống thanh tìm kiếm cố định dưới ở màn danh sách. */}
      {rolePlay && rpFinished && (
        <RolePlayFinishBar
          isA={isA}
          rpEvaluating={rpEvaluating}
          rpThrottled={rpThrottled}
          gradeRolePlay={gradeRolePlay}
          readAgain={() => void startRolePlay(rolePlay.role)}
        />
      )}
    </>
  )
}
