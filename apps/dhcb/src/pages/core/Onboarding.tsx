import { getStoredToken } from '@core/authHeader'
import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Plane,
  Briefcase,
  GraduationCap,
  MessageCircle,
  ChevronRight,
  Check,
  Sparkles,
} from 'lucide-react'
import { usePageTitle } from '../../lib/usePageTitle'
import { useAuth } from '../../context/useAuth'
import { saveOnboarding } from '../../lib/cloud'
import { track } from '../../lib/analytics'
import { cacheOnboarding, minutesToSpeed, setChosenSubject } from '../../lib/onboarding'
import { setDailySpeed } from '../../lib/curriculum'
import type { AgeGroup } from '../../types'
import { listSupportedSubjects } from '@dhcb/core-learner/subjectRegistry'
import { subjectHomePath } from '@dhcb/core-learner/subjectHome'
import SubjectIllustration from '../../components/SubjectIllustration'

type OnboardLevel = 'beginner' | 'intermediate' | 'advanced'
type OnboardGoal = 'daily' | 'travel' | 'work' | 'ielts'

const AGE_GROUPS: { value: AgeGroup; emoji: string; label: string; desc: string }[] = [
  { value: 'nhi_dong', emoji: '🧸', label: 'Nhi đồng', desc: 'Dưới 10 tuổi' },
  { value: 'thieu_nien', emoji: '🎒', label: 'Thiếu niên', desc: '10–15 tuổi' },
  { value: 'thanh_nien', emoji: '🎓', label: 'Thanh niên', desc: '16–22 tuổi' },
  { value: 'nguoi_lon', emoji: '💼', label: 'Người lớn', desc: '23 tuổi trở lên' },
]

const LEVELS: { value: OnboardLevel; emoji: string; label: string; desc: string }[] = [
  { value: 'beginner', emoji: '🌱', label: 'Cơ bản', desc: 'A1–A2 · Mới bắt đầu, biết ít từ' },
  {
    value: 'intermediate',
    emoji: '🌿',
    label: 'Trung cấp',
    desc: 'B1–B2 · Giao tiếp được hàng ngày',
  },
  { value: 'advanced', emoji: '🌳', label: 'Nâng cao', desc: 'C1+ · Muốn nói lưu loát, tự nhiên' },
]

const GOALS: {
  value: OnboardGoal
  Icon: React.FC<{ className?: string }>
  label: string
  desc: string
  color: string
}[] = [
  {
    value: 'daily',
    Icon: MessageCircle,
    label: 'Giao tiếp hàng ngày',
    desc: 'Chat, mua sắm, xã giao',
    color: 'emerald',
  },
  {
    value: 'travel',
    Icon: Plane,
    label: 'Du lịch',
    desc: 'Khách sạn, nhà hàng, chỉ đường',
    color: 'sky',
  },
  {
    value: 'work',
    Icon: Briefcase,
    label: 'Công việc',
    desc: 'Họp, email, thuyết trình',
    color: 'violet',
  },
  {
    value: 'ielts',
    Icon: GraduationCap,
    label: 'Luyện IELTS',
    desc: 'Viết luận, đọc, nghe, nói',
    color: 'amber',
  },
]

const MINUTES = [5, 10, 20, 30] as const

export default function Onboarding() {
  const { user } = useAuth()
  return <OnboardingForm key={user?.id ?? ''} />
}

function OnboardingForm() {
  const nav = useNavigate()
  const location = useLocation()
  const { user, refreshVerified } = useAuth()
  // Tới từ /placement sau khi làm bài test xếp lớp: đã biết trình độ đề xuất →
  // bỏ qua bước chọn trình độ thủ công (vẫn cho quay lại step 0 nếu muốn đổi ý).
  const presetLevel = (location.state as { presetLevel?: OnboardLevel } | null)?.presetLevel
  // [Slice 04] Bước CHỌN MÔN trước mọi bước khác: nền tảng có 6 môn, onboarding cũ (trình độ
  // CEFR, mục tiêu giao tiếp) là của riêng Tiếng Anh. Tới từ /placement (đã làm test xếp lớp
  // Tiếng Anh) thì môn đã rõ. Chọn môn khác Tiếng Anh: vẫn hỏi NHÓM TUỔI (dùng chung toàn nền
  // tảng) rồi hoàn tất, các trường Tiếng Anh gửi giá trị mặc định — API không đổi.
  const [subjectId, setSubjectId] = useState<string>(presetLevel ? 'english' : '')
  const isEnglish = subjectId === 'english'
  const totalSteps = isEnglish ? 4 : 1
  const [step, setStep] = useState(presetLevel ? 2 : 0)
  const [ageGroup, setAgeGroup] = useState<AgeGroup>('nguoi_lon')
  const [level, setLevel] = useState<OnboardLevel>(presetLevel ?? 'beginner')
  const [goal, setGoal] = useState<OnboardGoal>('daily')
  const [minutes, setMinutes] = useState<number>(10)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const pending = useRef(false)
  const mounted = useRef(false)
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  usePageTitle('Làm quen | Đồng Hành Cùng Bạn')

  // Đo rớt từng bước — đây là cổng bắt buộc duy nhất còn lại trước khi vào app (Intake đã
  // tắt, xem App.tsx RequireAuth). refCode dùng chung khuôn "loại:bước" như Daily Plan.
  useEffect(() => {
    track('onboarding_step_view', { refCode: `onboarding:${step}` })
  }, [step])

  // Đích sau khi lưu: trang môn vừa chọn; bỏ qua ngay ở bước chọn môn (chưa có môn nào) thì về
  // Trang chủ — KHÔNG tự gán Tiếng Anh (luật "không mặc định tiếng Anh", S06 AC-3).
  const destination = subjectId ? subjectHomePath(subjectId) : '/'

  async function finish() {
    if (!user || pending.current) return
    pending.current = true
    setSaving(true)
    setSaveError(null)
    const token = getStoredToken()
    let didSave = saved
    try {
      if (!didSave) {
        const outcome = await saveOnboarding({ level, goal, dailyMinutes: minutes, ageGroup })
        if (!mounted.current || token !== getStoredToken()) return
        if (!outcome.ok) {
          setSaveError('Chưa xác nhận được việc lưu hồ sơ. Lựa chọn của bạn vẫn còn; hãy thử lại.')
          return
        }
        cacheOnboarding(user.id, { level, goal, dailyMinutes: minutes, ageGroup })
        setDailySpeed(user.id, minutesToSpeed(minutes))
        // [U9b] Nhớ môn vừa chọn để Trang chủ không hỏi lại "Chọn môn" (audit M19).
        if (subjectId) setChosenSubject(user.id, subjectId)
        didSave = true
        setSaved(true)
      }
      const verified = await refreshVerified(user.id)
      if (!mounted.current || token !== getStoredToken()) return
      if (verified.id !== user.id || !verified.onboarded) {
        setSaveError('Hồ sơ đã lưu, nhưng chưa xác nhận được phiên học. Hãy thử đọc lại phiên.')
        return
      }
      nav(destination, { replace: true })
    } catch {
      if (mounted.current)
        setSaveError(
          didSave
            ? 'Hồ sơ đã lưu, nhưng chưa đọc lại được phiên đăng nhập. Hãy thử đọc lại phiên.'
            : 'Chưa xác nhận được việc lưu hồ sơ. Lựa chọn của bạn vẫn còn; hãy thử lại.',
        )
    } finally {
      pending.current = false
      if (mounted.current) setSaving(false)
    }
  }

  // [U9b, audit 2026-09-30 mục 8] "Bỏ qua": lưu NGAY với những gì đã chọn tới lúc này, phần còn
  // lại giữ mặc định hợp lý (người lớn · cơ bản · giao tiếp hằng ngày · 10 phút) — chính là giá
  // trị khởi tạo của state. Ghi sự kiện riêng cạnh `onboarding_step_view` để phễu tách được
  // "rời đi" với "bỏ qua có chủ đích", kèm bước đang đứng.
  function skip() {
    if (saving || saved) return
    track('onboarding_skip', { refCode: subjectId ? `onboarding:${step}` : 'onboarding:subject' })
    void finish()
  }

  const busy = saving || saved
  const primaryClass =
    'tap-44 w-full bg-accent-500 hover:bg-accent-400 disabled:opacity-60 text-black font-semibold py-3 rounded-2xl flex items-center justify-center gap-2 transition'
  const secondaryClass = 'tap-44 w-full text-sm text-zinc-400 hover:text-white py-2'
  const choiceClass = (active: boolean) =>
    `w-full flex items-center gap-4 p-4 rounded-2xl border transition-all ${
      active
        ? 'bg-accent-500/15 border-accent-500/50 text-white'
        : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:border-zinc-700'
    }`

  // Nút chính + nút phụ của từng bước. Đặt trong CÙNG MỘT chân trang ghim đáy (xem bố cục bên
  // dưới) để "Tiếp theo" đứng yên một chỗ qua mọi bước — trước đây nội dung căn giữa theo chiều
  // dọc nên nút nhảy 653 → 683 → 671 → 618px ở 390×844 (audit mục 8).
  // Bước cuối của luồng (môn khác Tiếng Anh chỉ có bước nhóm tuổi; Tiếng Anh tới bước 3) → nút
  // chính là "Bắt đầu học", còn lại là "Tiếp theo".
  const laBuocCuoi = isEnglish ? step === 3 : step === 0
  const nhanChinh = laBuocCuoi ? (
    saving ? (
      'Đang lưu...'
    ) : (
      'Bắt đầu học! 🚀'
    )
  ) : (
    <>
      Tiếp theo <ChevronRight className="w-4 h-4" aria-hidden="true" />
    </>
  )
  const nhanPhu = step === 0 ? 'Chọn môn khác' : 'Quay lại'

  // Hàm xử lý sự kiện (không gọi lúc render) — `finish` chạm ref nên chỉ được gọi từ đây.
  function onPrimary() {
    if (laBuocCuoi) void finish()
    else setStep(step + 1)
  }
  function onSecondary() {
    if (step === 0) setSubjectId('')
    else setStep(step - 1)
  }

  return (
    // Bố cục (U9b): KHÔNG căn giữa theo chiều dọc nữa. Điện thoại: cột cao đúng một màn, nội dung
    // từ trên xuống, chân trang (nút chính) ghim đáy — vùng ngón cái, cùng toạ độ ở mọi bước.
    // Từ `sm`: cột có chiều cao tối thiểu cố định và được căn giữa NGUYÊN KHỐI, nên nút vẫn đứng
    // yên dù nội dung từng bước dài ngắn khác nhau.
    <div className="min-h-dvh bg-zinc-950 flex flex-col items-center px-4 pt-4 pb-6 sm:justify-center sm:py-8">
      <div className="w-full max-w-sm flex flex-col flex-1 sm:flex-none sm:min-h-[42rem]">
        <div className="flex items-center justify-between gap-3 mb-4">
          <p className="text-xs text-zinc-400">
            {subjectId ? (
              <>
                Bước {step + 1} / {totalSteps}
              </>
            ) : (
              'Làm quen'
            )}
          </p>
          <button
            type="button"
            disabled={busy}
            onClick={skip}
            className="tap-44 px-3 text-sm font-semibold text-zinc-300 hover:text-white disabled:opacity-60 transition"
          >
            Bỏ qua
          </button>
        </div>

        {/* Thanh tiến trình — chưa chọn môn thì chưa biết có mấy bước */}
        {subjectId && (
          <div className="flex gap-1.5 mb-8" aria-hidden="true">
            {Array.from({ length: totalSteps }, (_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= step ? 'bg-accent-500' : 'bg-zinc-800'}`}
              />
            ))}
          </div>
        )}

        {/* Bước chọn môn */}
        {!subjectId && (
          <div className="animate-fade-in">
            <h1 className="text-2xl font-bold text-white mb-1">Bạn muốn học gì?</h1>
            <p className="text-zinc-400 text-sm mb-4">
              Chọn một môn để bắt đầu. Sau này đổi hoặc học thêm môn khác bất cứ lúc nào ở Góc học
              tập.
            </p>
            <ul className="grid grid-cols-2 gap-3" aria-label="Chọn môn học">
              {listSupportedSubjects().map((sub) => (
                <li key={sub.id}>
                  <button
                    disabled={busy}
                    type="button"
                    onClick={() => {
                      setSubjectId(sub.id)
                      track('onboarding_step_view', { refCode: `onboarding:subject:${sub.id}` })
                    }}
                    className="tap-44 w-full h-full flex flex-col items-center gap-2 p-4 rounded-2xl border bg-zinc-900/80 border-zinc-800 text-zinc-200 hover:border-accent-500/60 hover:text-white transition-all"
                  >
                    <SubjectIllustration subjectId={sub.id} size="sm" />
                    <span className="font-semibold text-[15px]">{sub.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Bước 0: Nhóm tuổi */}
        {subjectId && step === 0 && (
          <div className="animate-fade-in">
            <h1 className="text-2xl font-bold text-white mb-1">Bạn thuộc nhóm tuổi nào?</h1>
            <p className="text-zinc-400 text-sm mb-4">
              Giúp app hiển thị giao diện và nội dung phù hợp với bạn.
            </p>
            <div className="space-y-3">
              {AGE_GROUPS.map((a) => (
                <button
                  disabled={busy}
                  key={a.value}
                  type="button"
                  onClick={() => setAgeGroup(a.value)}
                  aria-pressed={ageGroup === a.value}
                  className={choiceClass(ageGroup === a.value)}
                >
                  <span className="text-2xl">{a.emoji}</span>
                  <div className="text-left flex-1">
                    <p className="font-semibold text-[15px]">{a.label}</p>
                    <p className="text-xs text-zinc-400 mt-0.5">{a.desc}</p>
                  </div>
                  {ageGroup === a.value && <Check className="w-4 h-4 text-accent-400 shrink-0" />}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Bước 1: Trình độ */}
        {step === 1 && (
          <div className="animate-fade-in">
            <h1 className="text-2xl font-bold text-white mb-1">Trình độ của bạn?</h1>
            <p className="text-zinc-400 text-sm mb-4">AI sẽ điều chỉnh độ khó phù hợp.</p>
            <button
              disabled={busy}
              type="button"
              onClick={() => nav('/placement', { state: { from: 'onboarding' } })}
              className="w-full flex items-center gap-3 p-4 mb-4 rounded-2xl border border-accent-500/40 bg-accent-500/10 text-left hover:bg-accent-500/15 transition-all"
            >
              <Sparkles className="w-5 h-5 text-accent-400 shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-[15px] text-white">Làm bài test 5 phút</p>
                <p className="text-xs text-zinc-400 mt-0.5">Xếp đúng trình độ — khuyên dùng</p>
              </div>
              <ChevronRight className="w-4 h-4 text-accent-400 shrink-0" />
            </button>
            <p className="text-xs text-zinc-400 mb-3">Hoặc tự chọn:</p>
            <div className="space-y-3">
              {LEVELS.map((l) => (
                <button
                  disabled={busy}
                  key={l.value}
                  type="button"
                  onClick={() => setLevel(l.value)}
                  aria-pressed={level === l.value}
                  className={choiceClass(level === l.value)}
                >
                  <span className="text-2xl">{l.emoji}</span>
                  <div className="text-left flex-1">
                    <p className="font-semibold text-[15px]">{l.label}</p>
                    <p className="text-xs text-zinc-400 mt-0.5">{l.desc}</p>
                  </div>
                  {level === l.value && <Check className="w-4 h-4 text-accent-400 shrink-0" />}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Bước 2: Mục tiêu */}
        {step === 2 && (
          <div className="animate-fade-in">
            {presetLevel && (
              <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-xl bg-accent-500/10 border border-accent-500/30 text-xs text-accent-300">
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                Đã xếp trình độ từ bài test —{' '}
                <button
                  disabled={busy}
                  type="button"
                  onClick={() => setStep(1)}
                  className="underline underline-offset-2 hover:text-accent-200"
                >
                  đổi thủ công
                </button>
              </div>
            )}
            <h1 className="text-2xl font-bold text-white mb-1">Bạn học tiếng Anh để?</h1>
            <p className="text-zinc-400 text-sm mb-6">
              AI sẽ ưu tiên chủ đề và tình huống phù hợp.
            </p>
            <div className="space-y-3">
              {GOALS.map((g) => {
                const Icon = g.Icon
                const active = goal === g.value
                const colors: Record<string, string> = {
                  emerald: 'bg-accent-500/15 border-accent-500/50',
                  sky: 'bg-sky-500/15 border-sky-500/50',
                  violet: 'bg-violet-500/15 border-violet-500/50',
                  amber: 'bg-amber-500/15 border-amber-500/50',
                }
                const iconColors: Record<string, string> = {
                  emerald: 'text-accent-400',
                  sky: 'text-sky-400 theme-light:text-sky-900',
                  violet: 'text-violet-400 theme-light:text-violet-800',
                  amber: 'text-amber-400 theme-light:text-amber-900',
                }
                return (
                  <button
                    disabled={busy}
                    key={g.value}
                    type="button"
                    onClick={() => setGoal(g.value)}
                    aria-pressed={active}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                      active
                        ? colors[g.color]
                        : 'bg-zinc-900/80 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 shrink-0 ${active ? iconColors[g.color] : 'text-zinc-400'}`}
                    />
                    <div className="text-left flex-1">
                      <p
                        className={`font-semibold text-[15px] ${active ? 'text-white' : 'text-zinc-400'}`}
                      >
                        {g.label}
                      </p>
                      <p className="text-xs text-zinc-400 mt-0.5">{g.desc}</p>
                    </div>
                    {active && <Check className={`w-4 h-4 shrink-0 ${iconColors[g.color]}`} />}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Bước 3: Thời gian */}
        {step === 3 && (
          <div className="animate-fade-in">
            <h1 className="text-2xl font-bold text-white mb-1">Học bao nhiêu phút mỗi ngày?</h1>
            <p className="text-zinc-400 text-sm mb-6">
              Mục tiêu nhỏ vừa thôi — quan trọng là đều đặn.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {MINUTES.map((m) => (
                <button
                  disabled={busy}
                  key={m}
                  type="button"
                  onClick={() => setMinutes(m)}
                  // [U9b] Cùng hợp đồng với nút nhóm tuổi: trình đọc màn hình đọc được nút nào
                  // đang chọn, không chỉ dựa vào màu viền (audit mục 8).
                  aria-pressed={minutes === m}
                  className={`p-5 rounded-2xl border text-center transition-all ${
                    minutes === m
                      ? 'bg-accent-500/15 border-accent-500/50 text-white'
                      : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <p className="text-3xl font-bold">{m}</p>
                  <p className="text-xs text-zinc-400 mt-1">phút / ngày</p>
                  {m === 10 && <p className="text-[11px] text-accent-400 mt-1">Phổ biến nhất</p>}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Chân trang ghim đáy: lỗi lưu (nếu có) + nút chính + nút phụ — cùng chỗ ở mọi bước. */}
        <div className="mt-auto pt-6 space-y-3">
          {saveError && (
            <>
              <p role="alert" className="text-sm text-content leading-relaxed">
                {saveError}
              </p>
              <button
                type="button"
                disabled={saving}
                onClick={() => void finish()}
                className="tap-44 w-full rounded-2xl bg-accent-500 px-4 py-3 font-semibold text-black hover:bg-accent-400 disabled:opacity-60 transition-colors"
              >
                {saving ? 'Đang xác nhận…' : saved ? 'Thử đọc lại phiên' : 'Thử lưu lại'}
              </button>
            </>
          )}
          {subjectId && (
            <>
              <button type="button" disabled={busy} onClick={onPrimary} className={primaryClass}>
                {nhanChinh}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={onSecondary}
                className={secondaryClass}
              >
                {nhanPhu}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
