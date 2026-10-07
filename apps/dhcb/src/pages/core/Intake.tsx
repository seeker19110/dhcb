// src/pages/core/Intake.tsx — Luồng NGƯỜI MỚI: 5 câu ~90 giây → một việc nên làm.
// Đặc tả: docs/research/luong-nguoi-moi-ho-so-nang-luc-an-2026-08-23.md
//
// Đây là lớp HỎI và lớp GỢI Ý. Lớp giữa (hồ sơ) nằm ở server và KHÔNG bao giờ hiện ra đây.
//
// Ba luật của lớp hỏi được thi hành ngay trong file này:
//   1. Tối đa 5 câu — mỗi câu thêm vào làm rơi một phần người dùng.
//   2. Bỏ qua câu nào cũng được; bỏ hết vẫn vào được app.
//   3. KHÔNG thanh tiến trình kiểu bài thi, không đếm điểm, không "câu 3/10".
//      Có chấm tròn chỉ vị trí — để người dùng biết còn dài bao nhiêu, không để chấm điểm họ.

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles, ArrowRight, Loader2, Check } from 'lucide-react'
import { usePageTitle } from '../../lib/usePageTitle'
import { useAuth } from '../../context/useAuth'
import {
  fetchIntake,
  saveIntake,
  chooseTask,
  type IntakeAnswers,
  type IntakeResult,
} from '../../lib/intakeApi'
import type { AgeGroup } from '../../types'
import { Button } from '@core/Button'
import { MAIN_CONTENT_ID } from '@core/PageShell'

const AGE_OPTIONS: { value: AgeGroup; label: string; hint: string }[] = [
  { value: 'nhi_dong', label: 'Dưới 10', hint: 'tuổi' },
  { value: 'thieu_nien', label: '10–15', hint: 'tuổi' },
  { value: 'thanh_nien', label: '16–22', hint: 'tuổi' },
  { value: 'nguoi_lon', label: 'Từ 23', hint: 'tuổi trở lên' },
]

const FOCUS_OPTIONS: { value: NonNullable<IntakeAnswers['focus']>; label: string }[] = [
  { value: 'hoc_thi', label: 'Học hành, thi cử' },
  { value: 'cong_viec', label: 'Công việc' },
  { value: 'suc_khoe', label: 'Sức khoẻ' },
  { value: 'tien_bac', label: 'Tiền bạc' },
  { value: 'quan_he', label: 'Người thân, bạn bè' },
  { value: 'chua_ro', label: 'Chưa rõ nữa' },
]

const MOMENTUM_OPTIONS: { value: NonNullable<IntakeAnswers['lastLearned']>; label: string }[] = [
  { value: 'tuan_nay', label: 'Tuần này' },
  { value: 'vai_thang', label: 'Vài tháng trước' },
  { value: 'lau_roi', label: 'Lâu rồi' },
  { value: 'khong_nho', label: 'Không nhớ nữa' },
]

const TOTAL_STEPS = 5

export default function Intake() {
  const navigate = useNavigate()
  const { refresh } = useAuth()
  const [step, setStep] = useState(0)
  const [ageGroup, setAgeGroup] = useState<AgeGroup | undefined>()
  const [answers, setAnswers] = useState<IntakeAnswers>({})
  const [result, setResult] = useState<IntakeResult | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [checking, setChecking] = useState(true)

  usePageTitle('Bắt đầu | Đồng Hành Cùng Bạn')

  // Đã trả lời rồi thì không hỏi lại — đi thẳng tới onboarding của môn.
  //
  // Cố ý hỏi SERVER thay vì thêm cờ vào payload `/api/auth`: cờ đó nằm trong luồng đăng nhập của
  // mọi người dùng, đụng vào là rủi ro cho cả những người không liên quan tới luồng này.
  useEffect(() => {
    let cancelled = false
    void fetchIntake().then((r) => {
      if (cancelled) return
      if (r.ok && r.data.done) navigate('/onboarding', { replace: true })
      else setChecking(false)
    })
    return () => {
      cancelled = true
    }
  }, [navigate])

  function next() {
    setStep((s) => s + 1)
  }

  async function finish() {
    setSaving(true)
    setError('')
    const r = await saveIntake(answers, ageGroup)
    setSaving(false)
    if (!r.ok) {
      setError(r.error)
      return
    }
    setResult(r.data.result)
  }

  async function pick(taskId: string) {
    if (taskId) await chooseTask(taskId)
    await refresh()
    // Xong lớp nền tảng → tới onboarding của MÔN (trình độ, mục tiêu học). Hai lớp tách nhau từ
    // PR C1b (migration 0059), đây là chỗ chúng nối lại thành một luồng liền mạch cho người mới.
    navigate('/onboarding', { replace: true })
  }

  if (checking) {
    return (
      <main
        id={MAIN_CONTENT_ID}
        tabIndex={-1}
        className="focus:outline-none min-h-dvh flex items-center justify-center p-5"
      >
        <p role="status" className="text-sm text-zinc-300 flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          Đang mở…
        </p>
      </main>
    )
  }

  // ── Màn GỢI Ý: đúng MỘT việc nổi bật ────────────────────────────────────
  if (result) {
    return (
      <main
        id={MAIN_CONTENT_ID}
        tabIndex={-1}
        className="focus:outline-none min-h-dvh flex items-center justify-center p-5"
      >
        <div className="w-full max-w-md space-y-4 animate-fade-in">
          <h1 className="text-xl font-semibold text-white">Mình gợi ý bắt đầu từ đây nhé?</h1>

          <section className="rounded-2xl border border-accent-500/40 bg-accent-500/10 p-4 space-y-2">
            <p className="text-base font-semibold text-white">{result.primary.title}</p>
            <p className="text-sm text-zinc-200">{result.primary.why}</p>
            <Button onClick={() => void pick(result.primary.id)} fullWidth className="mt-2">
              <Check className="w-4 h-4" />
              Được, mình bắt đầu
            </Button>
          </section>

          {result.alternatives.length > 0 && (
            <section className="space-y-2">
              <h2 className="text-xs text-zinc-400">Hoặc chọn hướng khác:</h2>
              {result.alternatives.map((alt) => (
                <button
                  key={alt.id}
                  type="button"
                  onClick={() => void pick(alt.id)}
                  className="tap-44 w-full text-left rounded-xl border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800/70 hover:border-zinc-700 transition-colors px-4 py-3 text-sm text-zinc-200"
                >
                  {alt.title}
                </button>
              ))}
            </section>
          )}

          <button
            type="button"
            onClick={() => void pick('')}
            className="tap-44 w-full text-xs text-zinc-400 hover:text-zinc-200 transition-colors underline underline-offset-2"
          >
            Để sau cũng được
          </button>
        </div>
      </main>
    )
  }

  // ── Lớp HỎI ─────────────────────────────────────────────────────────────
  return (
    <main
      id={MAIN_CONTENT_ID}
      tabIndex={-1}
      className="focus:outline-none min-h-dvh flex items-center justify-center p-5"
    >
      <div className="w-full max-w-md space-y-5 animate-fade-in">
        {/* [U10] Lớp hỏi chỉ có <legend> từng bước — thêm tiêu đề trang ẩn (WCAG 1.3.1/2.4.6). */}
        <h1 className="sr-only">Bắt đầu</h1>
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-accent-400" />
          <p className="text-xs text-zinc-400">Vài câu ngắn thôi, khoảng một phút rưỡi</p>
        </div>

        {/* Chấm chỉ VỊ TRÍ, không phải điểm số — xem ghi chú đầu file */}
        <ol className="flex gap-1.5" aria-label={`Bước ${step + 1} trên ${TOTAL_STEPS}`}>
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <li
              key={i}
              aria-hidden="true"
              className={`h-1 flex-1 rounded-full ${i <= step ? 'bg-accent-500' : 'bg-zinc-800'}`}
            />
          ))}
        </ol>

        {step === 0 && (
          <fieldset className="space-y-3">
            <legend className="text-lg font-semibold text-white">Bạn bao nhiêu tuổi rồi?</legend>
            <div className="grid grid-cols-2 gap-2">
              {AGE_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => {
                    setAgeGroup(o.value)
                    next()
                  }}
                  className="tap-44 rounded-xl border border-zinc-700 bg-zinc-900/60 hover:bg-zinc-800/70 hover:border-zinc-600 transition-colors px-3 py-3 text-sm text-zinc-100"
                >
                  <span className="font-semibold">{o.label}</span>{' '}
                  <span className="text-zinc-400">{o.hint}</span>
                </button>
              ))}
            </div>
          </fieldset>
        )}

        {step === 1 && (
          <fieldset className="space-y-3">
            <legend className="text-lg font-semibold text-white">
              Dạo này điều gì chiếm nhiều tâm trí bạn nhất?
            </legend>
            <div className="space-y-2">
              {FOCUS_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => {
                    setAnswers((a) => ({ ...a, focus: o.value }))
                    next()
                  }}
                  className="tap-44 w-full text-left rounded-xl border border-zinc-700 bg-zinc-900/60 hover:bg-zinc-800/70 hover:border-zinc-600 transition-colors px-4 py-3 text-sm text-zinc-100"
                >
                  {o.label}
                </button>
              ))}
            </div>
          </fieldset>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <label htmlFor="intake-extra" className="block text-lg font-semibold text-white">
              Nếu mỗi ngày có thêm một giờ, bạn dùng vào việc gì?
            </label>
            <input
              id="intake-extra"
              value={answers.extraHour ?? ''}
              onChange={(e) => setAnswers((a) => ({ ...a, extraHour: e.target.value }))}
              placeholder="Viết ngắn thôi cũng được"
              className="w-full tap-44 rounded-xl bg-zinc-900 border border-zinc-700 px-3 text-base text-white placeholder:text-zinc-500"
            />
            <NextRow onNext={next} onSkip={next} />
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3">
            <label htmlFor="intake-flow" className="block text-lg font-semibold text-white">
              Việc gì bạn làm mà quên mất thời gian?
            </label>
            <input
              id="intake-flow"
              value={answers.flowActivity ?? ''}
              onChange={(e) => setAnswers((a) => ({ ...a, flowActivity: e.target.value }))}
              placeholder="Bất cứ thứ gì cũng được"
              className="w-full tap-44 rounded-xl bg-zinc-900 border border-zinc-700 px-3 text-base text-white placeholder:text-zinc-500"
            />
            <NextRow onNext={next} onSkip={next} />
          </div>
        )}

        {step === 4 && (
          <fieldset className="space-y-3">
            <legend className="text-lg font-semibold text-white">
              Lần gần nhất bạn tự học xong một thứ mới là khi nào?
            </legend>
            <div className="space-y-2">
              {MOMENTUM_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  disabled={saving}
                  onClick={() => {
                    setAnswers((a) => ({ ...a, lastLearned: o.value }))
                    void finish()
                  }}
                  className="tap-44 w-full text-left rounded-xl border border-zinc-700 bg-zinc-900/60 hover:bg-zinc-800/70 hover:border-zinc-600 transition-colors px-4 py-3 text-sm text-zinc-100 disabled:opacity-60"
                >
                  {o.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              disabled={saving}
              onClick={() => void finish()}
              className="tap-44 w-full text-xs text-zinc-400 hover:text-zinc-200 transition-colors underline underline-offset-2"
            >
              Bỏ qua câu này
            </button>
          </fieldset>
        )}

        {saving && (
          <p role="status" className="text-sm text-zinc-300 flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Đang chuẩn bị gợi ý…
          </p>
        )}
        {error && (
          <p role="alert" className="text-sm text-rose-300 theme-light:text-rose-800">
            {error}
          </p>
        )}
      </div>
    </main>
  )
}

function NextRow({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) {
  return (
    <div className="flex items-center gap-3">
      <Button onClick={onNext} className="flex-1">
        Tiếp
        <ArrowRight className="w-4 h-4" />
      </Button>
      <button
        type="button"
        onClick={onSkip}
        className="tap-44 px-3 text-xs text-zinc-400 hover:text-zinc-200 transition-colors underline underline-offset-2"
      >
        Bỏ qua
      </button>
    </div>
  )
}
