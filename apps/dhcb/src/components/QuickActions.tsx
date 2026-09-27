// QuickActions — hàng hành động nhanh: Lộ trình · Chia sẻ · Nhắc học.
// Trước đây nằm ở trang chủ; nay chuyển xuống ĐÁY các trang khác (xóa khỏi trang chủ).
// Tự gói toàn bộ logic: mở quiz, modal chia sẻ tiến độ, bật/tắt + chọn GIỜ nhắc học.
//
// "Nhắc học" = thông báo đẩy (web push) nhắc bạn VÀO HỌC mỗi ngày để giữ chuỗi 🔥 ngày
// liên tiếp (streak). Khi bật, ta HỎI bạn muốn học lúc mấy giờ → server gửi nhắc đúng
// giờ đó cho những ngày bạn chưa học (xem api/push.ts + bộ hẹn giờ trong server.ts).

import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Share2, Route, Bell, BellOff, X, Clock } from 'lucide-react'
import ShareProgress from './ShareProgress'
import {
  isPushSupported,
  getNotifPermission,
  subscribePush,
  unsubscribePush,
  type PushActionResult,
} from '../lib/pushNotif'
import { useAuth } from '../context/useAuth'
import { useLang } from '../context/useLang'
import { useDialogBehavior } from './useDialogBehavior'
import { duongDanLoTrinh } from '../lib/englishRoutes'

// Lưu giờ nhắc (giờ địa phương 0–23) để hiển thị lại lần sau
const remindKey = (uid: string) => `et_remind_hour_${uid}`
function loadRemindHour(uid: string): number {
  try {
    const stored = localStorage.getItem(remindKey(uid))
    if (stored === null) return 20
    const raw = Number(stored)
    return Number.isInteger(raw) && raw >= 0 && raw <= 23 ? raw : 20
  } catch {
    return 20
  }
}
function saveRemindHour(uid: string, hour: number): boolean {
  try {
    localStorage.setItem(remindKey(uid), String(hour))
    return true
  } catch {
    return false
  }
}
const fmtHour = (h: number) => `${String(h).padStart(2, '0')}:00`

type PushIssue = Exclude<PushActionResult['status'], 'success'>
type PushOperation = 'subscribe' | 'unsubscribe'

// Đổi giờ địa phương người dùng chọn → giờ UTC để server (chạy theo UTC) gửi đúng lúc.
function localHourToUtc(localHour: number): number {
  const offsetH = -new Date().getTimezoneOffset() / 60 // VN = +7
  return ((Math.round(localHour - offsetH) % 24) + 24) % 24
}

export default function QuickActions() {
  const { user } = useAuth()
  if (!user) return null

  // Key theo user bảo đảm state cục bộ (đặc biệt giờ nhắc) được khởi tạo lại từ đúng namespace
  // khi phiên auth đến muộn hoặc đổi người dùng, không cần effect đồng bộ state.
  return <QuickActionsForUser key={user.id} userId={user.id} />
}

function QuickActionsForUser({ userId }: { userId: string }) {
  const nav = useNavigate()
  // [Slice 04] Chữ giao diện theo ngôn ngữ giao diện, không theo chiều học Tiếng Anh.
  const isA = useLang().lang === 'vi'
  const supported = isPushSupported()
  const initialPermission = supported ? getNotifPermission() : 'default'
  const [showShare, setShare] = useState(false)
  // Trạng thái quyền thông báo hiện tại — đọc 1 lần qua lazy initializer
  // (thay cho setState đồng bộ trong effect trước đây; `supported` không đổi trong đời component).
  const [pushOn, setPushOn] = useState(initialPermission === 'granted')
  const [pushLoading, setPushL] = useState(false)
  const [showTime, setShowTime] = useState(false)
  const [remindHour, setRemindHour] = useState(() => loadRemindHour(userId))
  const [storageWarning, setStorageWarning] = useState(false)
  const [pushIssue, setPushIssue] = useState<PushIssue | null>(
    initialPermission === 'denied' ? 'denied' : null,
  )
  const [retryOperation, setRetryOperation] = useState<PushOperation | null>(null)
  const [focusRevision, setFocusRevision] = useState(0)
  const notifButtonRef = useRef<HTMLButtonElement>(null)

  // Retry biến mất sau khi thành công; chuyển focus về control Nhắc học ở lần commit DOM kế
  // tiếp để không làm người dùng bàn phím rơi về body. Counter bảo đảm mỗi success là một tín
  // hiệu mới, kể cả khi các cập nhật loading bị React batch trong cùng một lượt.
  useLayoutEffect(() => {
    if (focusRevision > 0) notifButtonRef.current?.focus()
  }, [focusRevision])

  // Hộp chọn giờ là một hộp thoại thật → phải đủ 6 hành vi a11y (Escape, bẫy tiêu
  // điểm, trả tiêu điểm về nút "Nhắc học", khoá cuộn nền).
  const closeTime = useCallback(() => setShowTime(false), [])
  const timeDialog = useDialogBehavior(closeTime, showTime)

  // Bấm nút Nhắc học: đang TẮT → mở hộp chọn giờ; đang BẬT → tắt nhắc.
  function onNotifClick() {
    if (!supported || pushLoading) return
    if (getNotifPermission() === 'denied') {
      setPushIssue('denied')
      setRetryOperation(null)
      return
    }
    setPushIssue(null)
    setRetryOperation(null)
    if (pushOn) void turnOff()
    else setShowTime(true)
  }

  // Lưu giờ đã chọn rồi BẬT nhắc (đăng ký push + gửi giờ UTC lên server)
  function applyPushResult(result: PushActionResult, operation: PushOperation) {
    if (result.status === 'success') {
      setPushOn(operation === 'subscribe')
      setPushIssue(null)
      setRetryOperation(null)
      return
    }

    if (operation === 'unsubscribe' && result.status === 'partial' && result.serverUpdated) {
      setPushOn(false)
    } else if (operation === 'subscribe') {
      setPushOn(false)
    }
    setPushIssue(result.status)
    setRetryOperation(result.status === 'denied' ? null : operation)
  }

  async function runPushOperation(operation: PushOperation, restoreFocusOnSuccess = false) {
    if (pushLoading) return
    setPushL(true)
    // Khi Retry, giữ alert/button trong DOM (ở trạng thái disabled) cho tới khi có kết quả để
    // focus không rơi về body trong lúc promise đang chạy.
    if (!restoreFocusOnSuccess) setPushIssue(null)
    try {
      const result =
        operation === 'subscribe'
          ? await subscribePush(localHourToUtc(remindHour))
          : await unsubscribePush()
      applyPushResult(result, operation)
      if (restoreFocusOnSuccess && result.status === 'success') {
        setFocusRevision((revision) => revision + 1)
      }
    } catch {
      applyPushResult({ status: 'failed' }, operation)
    } finally {
      setPushL(false)
    }
  }

  // Ghi storage chỉ là tiện ích cho lần mở sau: dù thiết bị chặn ghi, giờ vừa chọn vẫn được
  // chuyển nguyên vẹn cho lần đăng ký hiện tại.
  async function confirmTime() {
    if (pushLoading) return
    setStorageWarning(!saveRemindHour(userId, remindHour))
    setShowTime(false)
    await runPushOperation('subscribe')
  }

  async function turnOff() {
    await runPushOperation('unsubscribe')
  }

  // Nhãn nút Nhắc học theo trạng thái — khi BẬT hiện luôn giờ nhắc
  const notifLabel = !supported
    ? isA
      ? 'Không hỗ trợ'
      : 'Unsupported'
    : pushLoading
      ? '…'
      : pushOn
        ? fmtHour(remindHour)
        : isA
          ? 'Nhắc học'
          : 'Remind me'

  return (
    <div className="mt-8 pt-5 border-t border-zinc-800/60">
      <div className="grid grid-cols-3 gap-2 max-w-md mx-auto">
        {/* Lộ trình — mở tổng quan A1→B2 (tab Kiểm tra giờ nằm TRONG từng cấp) */}
        <button
          onClick={() => nav(duongDanLoTrinh())}
          aria-label={isA ? 'Lộ trình học' : 'Learning path'}
          className="flex flex-col items-center gap-1.5 py-3 rounded-2xl bg-zinc-900/60 border border-zinc-800/60 hover:border-teal-500/40 transition group"
        >
          <Route className="w-4 h-4 text-teal-400 theme-light:text-teal-900" />
          <span className="text-[11px] text-zinc-400 group-hover:text-zinc-200 transition">
            {isA ? 'Lộ trình' : 'Roadmap'}
          </span>
        </button>

        {/* Chia sẻ tiến độ */}
        <button
          onClick={() => setShare(true)}
          aria-label={isA ? 'Chia sẻ tiến độ' : 'Share progress'}
          className="flex flex-col items-center gap-1.5 py-3 rounded-2xl bg-zinc-900/60 border border-zinc-800/60 hover:border-accent-500/40 transition group"
        >
          <Share2 className="w-4 h-4 text-accent-400" />
          <span className="text-[11px] text-zinc-400 group-hover:text-zinc-200 transition">
            {isA ? 'Chia sẻ' : 'Share'}
          </span>
        </button>

        {/* Bật / tắt thông báo nhắc học mỗi ngày */}
        <button
          ref={notifButtonRef}
          onClick={onNotifClick}
          disabled={!supported || pushLoading}
          aria-label={
            pushOn
              ? isA
                ? 'Tắt nhắc học'
                : 'Turn off reminders'
              : isA
                ? 'Bật nhắc học mỗi ngày'
                : 'Turn on daily reminders'
          }
          className={`flex flex-col items-center gap-1.5 py-3 rounded-2xl border transition group disabled:opacity-50 disabled:cursor-not-allowed ${
            pushOn
              ? 'bg-amber-500/10 border-amber-500/30 hover:border-amber-500/50'
              : 'bg-zinc-900/60 border-zinc-800/60 hover:border-amber-500/30'
          }`}
        >
          {pushOn ? (
            <Bell className="w-4 h-4 text-amber-400 theme-light:text-amber-900" />
          ) : (
            <BellOff className="w-4 h-4 text-zinc-400 group-hover:text-amber-400 transition" />
          )}
          <span
            className={`text-[11px] transition ${pushOn ? 'text-amber-300 theme-light:text-amber-900' : 'text-zinc-400 group-hover:text-zinc-200'}`}
          >
            {notifLabel}
          </span>
        </button>
      </div>

      {/* Giải thích "Nhắc học" đang nhắc cái gì */}
      <p className="text-[11px] text-zinc-400 text-center mt-2.5 max-w-md mx-auto">
        🔔{' '}
        {pushOn
          ? isA
            ? `Sẽ nhắc bạn vào học lúc ${fmtHour(remindHour)} mỗi ngày để giữ chuỗi 🔥`
            : `We'll nudge you to study at ${fmtHour(remindHour)} daily to keep your 🔥 streak`
          : isA
            ? 'Nhắc bạn vào học mỗi ngày để giữ chuỗi 🔥 ngày liên tiếp'
            : 'A daily nudge to study and keep your 🔥 streak'}
      </p>

      <div className="min-h-12 mt-2 max-w-md mx-auto text-sm text-zinc-300 text-center">
        {storageWarning && (
          <p role="status">
            {isA
              ? 'Không thể lưu giờ nhắc trên thiết bị này. Lần mở sau sẽ dùng 20:00.'
              : 'This device could not save the reminder time. Next time, 20:00 will be used.'}
          </p>
        )}
        {pushIssue && (
          <div role={pushIssue === 'denied' ? 'status' : 'alert'}>
            <p>
              {pushIssue === 'denied'
                ? isA
                  ? 'Thông báo đang bị chặn. Hãy bật quyền trong cài đặt trình duyệt.'
                  : 'Notifications are blocked. Enable them in your browser settings.'
                : pushIssue === 'partial'
                  ? isA
                    ? 'Nhắc học chưa cập nhật hoàn tất. Bạn có thể thử lại.'
                    : 'The reminder was only partly updated. You can try again.'
                  : isA
                    ? 'Không thể cập nhật nhắc học. Vui lòng thử lại.'
                    : 'The reminder could not be updated. Please try again.'}
            </p>
            {retryOperation && (
              <button
                type="button"
                onClick={() => void runPushOperation(retryOperation, true)}
                disabled={pushLoading}
                className="min-h-11 mt-1 px-4 rounded-xl font-semibold text-accent-400 theme-light:text-accent-800 hover:bg-zinc-800/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 disabled:opacity-50"
              >
                {isA ? 'Thử lại' : 'Retry'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Hộp chọn giờ học — hiện khi bật nhắc */}
      {showTime && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
          {...timeDialog.backdropProps}
        >
          <div
            {...timeDialog.dialogProps}
            className="w-full max-w-xs bg-zinc-900 border border-zinc-700/60 rounded-2xl p-5 animate-fade-in max-h-[90dvh] overflow-y-auto focus:outline-none"
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400 theme-light:text-amber-900" />
                <h3 id={timeDialog.titleId} className="text-sm font-semibold text-white">
                  {isA ? 'Bạn muốn học lúc mấy giờ?' : 'When do you want to study?'}
                </h3>
              </div>
              <button
                type="button"
                onClick={closeTime}
                aria-label={isA ? 'Đóng' : 'Close'}
                className="tap-44 shrink-0 w-11 h-11 -mr-3 -mt-3 flex items-center justify-center rounded-full text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[11px] text-zinc-400 mb-3">
              {isA
                ? 'Mỗi ngày tới giờ này, nếu bạn chưa học, app sẽ nhắc nhẹ một cái.'
                : "Each day at this time, if you haven't studied, we'll send a gentle nudge."}
            </p>

            <label className="block">
              <span className="sr-only">{isA ? 'Chọn giờ' : 'Pick an hour'}</span>
              <select
                value={remindHour}
                onChange={(e) => setRemindHour(Number(e.target.value))}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-base text-white outline-none focus:border-amber-500/60 transition appearance-none text-center font-semibold tracking-wide"
              >
                {Array.from({ length: 24 }, (_, h) => (
                  <option key={h} value={h}>
                    {fmtHour(h)}
                  </option>
                ))}
              </select>
            </label>

            <button
              onClick={confirmTime}
              disabled={pushLoading}
              className="mt-4 w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-zinc-950 font-semibold text-sm rounded-xl py-3 transition"
            >
              {pushLoading
                ? '…'
                : isA
                  ? `Nhắc tôi lúc ${fmtHour(remindHour)}`
                  : `Remind me at ${fmtHour(remindHour)}`}
            </button>
          </div>
        </div>
      )}

      {/* Modal chia sẻ tiến độ */}
      {showShare && <ShareProgress userId={userId} isA={isA} onClose={() => setShare(false)} />}
    </div>
  )
}
