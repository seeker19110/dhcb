// apps/dhcb/src/pages/core/LiveLocation.tsx — "Đi chung": chia sẻ vị trí thời gian thực với bạn
// bè trong một chuyến đi chơi, để không ai bị lạc.
//
// BỐI CẢNH DÙNG THẬT quyết định toàn bộ bố cục: người dùng đang đi bộ ngoài đường, một tay cầm
// máy, nắng chói, đang vội. Màn hình này phải "liếc một giây là biết", chứ không phải một trang
// tài liệu để đọc. Từ đó ba quyết định thiết kế chính:
//
//   1. BẢN ĐỒ TRƯỚC. Bản đồ chiếm khung lớn ngay đầu trang thay vì bị kẹp giữa các thẻ chữ.
//      Nó là thứ trả lời câu hỏi "mọi người đang ở đâu" nhanh nhất.
//   2. CÔNG TẮC DÍNH ĐÁY. Công tắc chia sẻ (ShareToggle) dính đáy màn hình, luôn trong tầm ngón
//      cái, không bao giờ phải cuộn đi tìm — đây là quyết định riêng tư quan trọng nhất và luật
//      của tính năng là "bấm tắt là dừng NGAY".
//   3. XẾP THEO MỨC KHẨN. Cảnh báo có người đi lạc → bản đồ → ai đang ở đâu → nhóm giãn bao xa
//      → cài đặt → rời/kết thúc. Thứ khẩn nhất nằm nơi mắt chạm tới trước.
//
// Nguyên tắc bất di bất dịch: công tắc chia sẻ LUÔN mặc định TẮT — người dùng phải chủ động bật,
// và bấm tắt là dừng ngay lập tức (server xoá vị trí, xem migration 0068).

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { AlertTriangle, Flag, Navigation, ShieldCheck } from 'lucide-react'
import Layout from '../../components/Layout'
import { Skeleton } from '../../components/Skeleton'
import LiveMap from '../../components/location/LiveMap'
import MemberList from '../../components/location/MemberList'
import GroupSpread, { type Pair } from '../../components/location/GroupSpread'
import ShareToggle from '../../components/location/ShareToggle'
import TripActions from '../../components/location/TripActions'
import TripHeader from '../../components/location/TripHeader'
import TripSetup from '../../components/location/TripSetup'
import { usePageTitle } from '../../lib/usePageTitle'
import { useToast } from '@core/ToastProvider'
import { PageShell } from '@core/PageShell'
import { useAuth } from '../../context/useAuth'
import { distanceMeters, findStragglers, groupCenter } from '@dhcb/core-location/geo'
import { formatDistance } from '../../lib/locationFormat'
import {
  LocationSocket,
  buildDirectionsUrl,
  createSession,
  fetchMySessions,
  fetchSessionState,
  joinSession,
  leaveSession,
  setSharing,
  updateSession,
  watchMyPosition,
  type MemberPosition,
  type SessionState,
  type SessionSummary,
  type WatchHandle,
} from '../../lib/locationShare'

export default function LiveLocation() {
  const toast = useToast()
  const { user } = useAuth()
  const { code: codeFromUrl } = useParams<{ code?: string }>()

  const [sessions, setSessions] = useState<SessionSummary[]>([])
  const [state, setState] = useState<SessionState | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [transport, setTransport] = useState<'websocket' | 'polling'>('polling')

  const socketRef = useRef<LocationSocket | null>(null)
  const watchRef = useRef<WatchHandle | null>(null)

  const myUserId = user?.id ?? ''
  const me = useMemo(
    () => state?.members.find((m) => m.userId === myUserId) ?? null,
    [state, myUserId],
  )
  const sharing = !!me?.sharingEnabled

  usePageTitle('Đi chung | Đồng Hành Cùng Bạn')

  // ── Nạp danh sách chuyến + vào thẳng chuyến nếu mở bằng link mời ────────────────────────
  useEffect(() => {
    let cancelled = false
    const boot = async () => {
      if (codeFromUrl) {
        const joined = await joinSession(codeFromUrl)
        if (!cancelled && joined) setState(joined)
        else if (!cancelled) toast.error('Mã mời không dùng được (sai mã hoặc chuyến đã kết thúc)')
      }
      const list = await fetchMySessions()
      if (cancelled) return
      setSessions(list)
      setLoading(false)
    }
    void boot()
    return () => {
      cancelled = true
    }
  }, [codeFromUrl, toast])

  // ── Kết nối thời gian thực khi đang mở một chuyến ───────────────────────────────────────
  useEffect(() => {
    const sessionId = state?.sessionId
    if (!sessionId) return

    const socket = new LocationSocket(sessionId, {
      onState: (next) => setState(next),
      onMemberPosition: (member: MemberPosition) =>
        setState((prev) =>
          prev && prev.sessionId === sessionId
            ? {
                ...prev,
                members: prev.members.some((m) => m.userId === member.userId)
                  ? prev.members.map((m) => (m.userId === member.userId ? member : m))
                  : [...prev.members, member],
              }
            : prev,
        ),
      onMemberLeft: (userId) =>
        setState((prev) =>
          prev ? { ...prev, members: prev.members.filter((m) => m.userId !== userId) } : prev,
        ),
      onSessionEnded: () => {
        setState(null)
        toast.info('Chuyến đã kết thúc — vị trí của mọi người đã được xoá')
      },
      onTransportChange: setTransport,
    })
    socket.connect()
    socketRef.current = socket

    return () => {
      socket.close()
      socketRef.current = null
    }
  }, [state?.sessionId, toast])

  // ── Bật/tắt GPS theo đúng công tắc chia sẻ ──────────────────────────────────────────────
  // Tắt chia sẻ mà vẫn để watchPosition chạy là vừa tốn pin vừa sai lời hứa riêng tư.
  useEffect(() => {
    if (!sharing || !state?.sessionId) {
      watchRef.current?.stop()
      watchRef.current = null
      return
    }
    if (watchRef.current) return
    // Báo lỗi GPS ĐÚNG MỘT LẦN cho mỗi lượt bật chia sẻ. watchPosition gọi callback lỗi lặp
    // lại (quyền bị từ chối, hết giờ chờ liên tiếp) — báo mỗi lần là phủ kín màn hình bằng
    // cùng một dòng chữ, che mất chính cái bản đồ mà người dùng đang cần nhìn.
    let reportedError = false
    watchRef.current = watchMyPosition(
      (position) => socketRef.current?.sendPosition(position),
      (message) => {
        if (reportedError) return
        reportedError = true
        toast.error(message)
      },
    )
    return () => {
      watchRef.current?.stop()
      watchRef.current = null
    }
  }, [sharing, state?.sessionId, toast])

  // ── Khoảng cách + cảnh báo lạc ──────────────────────────────────────────────────────────
  const myPosition = me?.position ?? null
  const anchor = useMemo(() => {
    if (state?.meetPoint) return { lat: state.meetPoint.lat, lng: state.meetPoint.lng }
    const points = (state?.members ?? []).flatMap((m) => (m.position ? [m.position] : []))
    return groupCenter(points)
  }, [state])

  const stragglers = useMemo(
    () =>
      findStragglers(
        (state?.members ?? []).map((m) => ({ userId: m.userId, position: m.position })),
        anchor,
        state?.alertRadiusM ?? 300,
      ),
    [state, anchor],
  )

  /** Khoảng cách từ TÔI tới từng người — MemberList hiện con số này ở cột phải. */
  const distancesFromMe = useMemo(() => {
    const map = new Map<string, number>()
    if (!myPosition) return map
    for (const member of state?.members ?? []) {
      if (member.position && member.userId !== myUserId) {
        map.set(member.userId, distanceMeters(myPosition, member.position))
      }
    }
    return map
  }, [state, myPosition, myUserId])

  // Khoảng cách giữa TỪNG CẶP thành viên đang chia sẻ — không chỉ so với riêng mình, để cả
  // nhóm biết ai gần ai mà không cần mỗi người tự mở máy tính so sánh toạ độ.
  const pairDistances = useMemo(() => {
    const sharingMembers = (state?.members ?? []).filter((m) => m.position)
    const pairs: Pair[] = []
    for (let i = 0; i < sharingMembers.length; i++) {
      for (let j = i + 1; j < sharingMembers.length; j++) {
        const a = sharingMembers[i]!
        const b = sharingMembers[j]!
        pairs.push({ a, b, distanceM: distanceMeters(a.position!, b.position!) })
      }
    }
    return pairs.sort((x, y) => x.distanceM - y.distanceM)
  }, [state])

  const openSession = useCallback(async (sessionId: string) => {
    const next = await fetchSessionState(sessionId)
    if (next) setState(next)
  }, [])

  // ── Hành động ───────────────────────────────────────────────────────────────────────────
  /** Bọc mọi thao tác gọi mạng: khoá nút trong lúc chờ để không bấm hai lần ra hai chuyến. */
  async function run(action: () => Promise<void>) {
    if (busy) return
    setBusy(true)
    try {
      await action()
    } finally {
      setBusy(false)
    }
  }

  const handleCreate = (name: string, durationMinutes: 60 | 240 | 480) =>
    run(async () => {
      if (!name) {
        toast.error('Đặt tên cho chuyến đi đã nhé')
        return
      }
      const created = await createSession(name, durationMinutes)
      if (!created) {
        toast.error('Không tạo được chuyến — thử lại sau')
        return
      }
      setState(created)
      toast.success(`Đã tạo chuyến "${created.name}" — bấm "Mời bạn" để gửi link cho bạn bè`)
    })

  const handleJoin = (code: string) =>
    run(async () => {
      const joined = await joinSession(code)
      if (!joined) {
        toast.error('Mã mời không dùng được')
        return
      }
      setState(joined)
    })

  const toggleSharing = () =>
    run(async () => {
      if (!state) return
      const next = await setSharing(state.sessionId, { sharingEnabled: !sharing })
      if (!next) {
        toast.error('Không đổi được trạng thái chia sẻ')
        return
      }
      setState(next)
      toast.success(
        sharing
          ? 'Đã TẮT chia sẻ — vị trí của bạn đã được xoá khỏi máy chủ'
          : 'Đang chia sẻ vị trí với mọi người trong chuyến',
      )
    })

  const togglePrecision = () =>
    run(async () => {
      if (!state || !me) return
      const next = await setSharing(state.sessionId, {
        precisionMode: me.precisionMode === 'exact' ? 'approx' : 'exact',
      })
      if (next) setState(next)
    })

  const setMeetPointHere = () =>
    run(async () => {
      if (!state || !myPosition) {
        toast.error('Cần bật chia sẻ vị trí trước để lấy chỗ bạn đang đứng')
        return
      }
      const next = await updateSession(state.sessionId, {
        meetPoint: { lat: myPosition.lat, lng: myPosition.lng, label: 'Điểm hẹn' },
      })
      if (next) {
        setState(next)
        toast.success('Đã đặt điểm hẹn tại chỗ bạn đang đứng')
      } else toast.error('Chỉ chủ chuyến mới đặt được điểm hẹn')
    })

  const clearMeetPoint = () =>
    run(async () => {
      if (!state) return
      const next = await updateSession(state.sessionId, { meetPoint: null })
      if (next) {
        setState(next)
        toast.success('Đã bỏ điểm hẹn — cảnh báo đi lạc quay về tính theo tâm nhóm')
      } else toast.error('Chỉ chủ chuyến mới đổi được điểm hẹn')
    })

  const handleExtend = () =>
    run(async () => {
      if (!state) return
      const next = await updateSession(state.sessionId, { extendMinutes: 60 })
      if (next) {
        setState(next)
        toast.success('Đã gia hạn thêm 1 giờ')
      } else toast.error('Chỉ chủ chuyến mới gia hạn được')
    })

  const handleEnd = () =>
    run(async () => {
      if (!state) return
      // updateSession(end) trả về null vì server không gửi kèm state của chuyến đã kết thúc —
      // dựa vào việc màn hình quay lại danh sách để biết đã xong.
      await updateSession(state.sessionId, { end: true })
      setState(null)
      setSessions(await fetchMySessions())
      toast.success('Đã kết thúc chuyến — vị trí của mọi người đã xoá')
    })

  const handleLeave = () =>
    run(async () => {
      if (!state) return
      await leaveSession(state.sessionId)
      setState(null)
      setSessions(await fetchMySessions())
      toast.success('Bạn đã rời chuyến, vị trí của bạn đã được xoá')
    })

  // ── Giao diện ───────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-dvh bg-zinc-950">
      <Layout title="Đi chung" />
      {/* [2026-09-02, đợt 4 thiết kế lại desktop] Trang danh sách → width="standard". */}
      <PageShell width="standard" baseWidth="max-w-2xl">
        <h1 tabIndex={-1} className="sr-only focus:outline-none">
          Đi chung
        </h1>

        {loading ? (
          /* Skeleton thay chữ "Đang tải…" — khớp khung thẻ sắp hiện. */
          <div className="space-y-3" aria-busy="true" aria-label="Đang tải chuyến đi chung">
            <Skeleton className="h-24 rounded-2xl" />
            <Skeleton className="h-32 rounded-2xl" />
          </div>
        ) : !state ? (
          <TripSetup
            sessions={sessions}
            onOpen={(id) => void openSession(id)}
            onCreate={(name, duration) => void handleCreate(name, duration)}
            onJoin={(code) => void handleJoin(code)}
            busy={busy}
          />
        ) : (
          <div className="space-y-4">
            {/* Cảnh báo đi lạc — thứ khẩn nhất, nên nằm trên cả bản đồ. */}
            {stragglers.length > 0 && (
              <section
                className="rounded-2xl border border-amber-400/50 bg-amber-400/10 p-4"
                role="status"
              >
                <h2 className="flex items-center gap-2 font-bold text-amber-100 theme-light:text-amber-900">
                  <AlertTriangle className="h-5 w-5" aria-hidden="true" />
                  Có người đang cách xa nhóm
                </h2>
                <ul className="mt-2 space-y-1 text-sm text-zinc-100">
                  {stragglers.map((straggler) => {
                    const member = state.members.find((m) => m.userId === straggler.userId)
                    return (
                      <li key={straggler.userId}>
                        {member?.name ?? 'Ai đó'} cách {state.meetPoint ? 'điểm hẹn' : 'tâm nhóm'}{' '}
                        <strong>{formatDistance(straggler.distanceM)}</strong>
                      </li>
                    )
                  })}
                </ul>
              </section>
            )}

            <LiveMap members={state.members} meetPoint={state.meetPoint} myUserId={myUserId} />

            {state.meetPoint && (
              <a
                href={buildDirectionsUrl(state.meetPoint)}
                target="_blank"
                rel="noopener noreferrer"
                className="tap-44 flex items-center justify-center gap-2 rounded-xl border border-zinc-700 px-4 font-semibold text-zinc-100"
              >
                <Flag className="h-4 w-4" aria-hidden="true" />
                Chỉ đường tới điểm hẹn
                <Navigation className="h-4 w-4" aria-hidden="true" />
              </a>
            )}

            <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
              <h2 className="text-lg font-bold text-zinc-100">
                Mọi người trong chuyến ({state.members.length})
              </h2>
              <MemberList
                members={state.members}
                myUserId={myUserId}
                distancesFromMe={distancesFromMe}
              />
            </section>

            <GroupSpread pairs={pairDistances} myUserId={myUserId} />

            <TripHeader
              name={state.name}
              inviteCode={state.inviteCode}
              expiresAt={state.expiresAt}
              transport={transport}
            />

            <TripActions
              isOwner={state.ownerId === myUserId}
              precisionMode={me?.precisionMode ?? 'exact'}
              canSetMeetPoint={!!myPosition}
              hasMeetPoint={!!state.meetPoint}
              onTogglePrecision={() => void togglePrecision()}
              onSetMeetPoint={() => void setMeetPointHere()}
              onClearMeetPoint={() => void clearMeetPoint()}
              onExtend={() => void handleExtend()}
              onEnd={() => void handleEnd()}
              onLeave={() => void handleLeave()}
            />

            <p className="flex items-start gap-2 text-sm text-zinc-200">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              Tắt chia sẻ là vị trí của bạn bị xoá khỏi máy chủ ngay. Ứng dụng không lưu lịch sử
              hành trình của ai.
            </p>

            <ShareToggle
              sharing={sharing}
              otherMemberCount={Math.max(0, state.members.length - 1)}
              onToggle={() => void toggleSharing()}
              busy={busy}
            />
          </div>
        )}
      </PageShell>
    </div>
  )
}
