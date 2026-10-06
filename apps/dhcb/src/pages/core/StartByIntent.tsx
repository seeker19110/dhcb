// src/pages/core/StartByIntent.tsx — "BẮT ĐẦU THEO Ý ĐỊNH": ≤ 5 câu → ĐÚNG MỘT việc để làm.
// Đặc tả: docs/specs/2026-09-15-learning-ux-s05-bat-dau-theo-y-dinh.md
//
// Ba luật của trang này:
//   1. Tối đa 5 câu, mỗi câu BỎ QUA được; bỏ hết vẫn có một nút "Bắt đầu" (dẫn về danh mục môn).
//   2. KHÔNG mặc định môn nào — kể cả Tiếng Anh. Mở trang ra không ô nào được chọn sẵn.
//   3. KHÔNG hiện chẩn đoán: không điểm, không bậc, không "trình độ của bạn", không token enum
//      (`lv_*`). Chấm tròn chỉ VỊ TRÍ, không phải điểm số.
//
// Trang CÔNG KHAI: khách (chưa đăng nhập) dùng được trọn vẹn — ý định của khách nằm ở
// localStorage, KHÔNG gọi `/api/learner-intent` (endpoint đó cần token).

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Sparkles, ArrowRight, Loader2, Check, RefreshCw } from 'lucide-react'
import { usePageTitle } from '../../lib/usePageTitle'
import { useAuth } from '../../context/useAuth'
import { track } from '../../lib/analytics'
import { Button } from '@core/Button'
import {
  IntentSubjectIdSchema,
  isStemIntentSubject,
  type IntentSubjectId,
  type IntentPurpose,
  type IntentTimeBudget,
  type IntentLevel,
  type IntentGrade,
  type LearnerIntent,
} from '@dhcb/core-contracts/learnerIntent'
import {
  buildIntent,
  readLocalIntent,
  writeLocalIntent,
  fetchServerIntent,
  saveServerIntent,
} from '../../lib/intent/learnerIntentStore'
import {
  pickStartAction,
  CATALOG_PATH,
  type StartActionResult,
} from '../../lib/intent/pickStartAction'
import { buildIntentOutlines } from '../../lib/intent/buildIntentOutlines'
import { MAIN_CONTENT_ID } from '@core/PageShell'

// Nhãn môn — lấy đúng chữ của registry (`@dhcb/core-learner/subjectRegistry`), khai lại ở đây để
// trang không phải kéo cả registry vào chunk. S05-2 sẽ gộp về MỘT nguồn danh mục.
const SUBJECT_OPTIONS: { value: IntentSubjectId; label: string }[] = [
  { value: 'english', label: 'Tiếng Anh' },
  { value: 'programming', label: 'Lập trình' },
  { value: 'mathematics', label: 'Toán học' },
  { value: 'physics', label: 'Vật lí' },
  { value: 'chemistry', label: 'Hóa học' },
  { value: 'biology', label: 'Sinh học' },
]

const PURPOSE_OPTIONS: { value: IntentPurpose; label: string }[] = [
  { value: 'thi_cu', label: 'Để thi cử' },
  { value: 'cong_viec', label: 'Để đi làm' },
  { value: 'so_thich', label: 'Vì thích' },
  { value: 'chua_ro', label: 'Chưa rõ nữa' },
]

const TIME_OPTIONS: { value: IntentTimeBudget; label: string }[] = [
  { value: 5, label: '5 phút' },
  { value: 10, label: '10 phút' },
  { value: 20, label: '20 phút' },
  { value: 30, label: '30 phút' },
]

// Nhãn tiếng Việt, KHÔNG bao giờ hiện token `lv_*` (bất biến T6).
const LEVEL_OPTIONS: { value: IntentLevel; label: string }[] = [
  { value: 'lv_new', label: 'Mới bắt đầu' },
  { value: 'lv_some', label: 'Đã học qua đôi chút' },
  { value: 'lv_solid', label: 'Đã học khá lâu' },
]

const GRADE_OPTIONS: { value: IntentGrade; label: string }[] = [
  { value: '10', label: 'Lớp 10' },
  { value: '11', label: 'Lớp 11' },
  { value: '12', label: 'Lớp 12' },
]

/** Mốc thời gian hiện tại — tách ra khỏi thân component cho rõ đây là việc của trình xử lý
 *  sự kiện, không phải của lượt render. */
function mocThoiGian(): number {
  return Date.now()
}

type StepId = 'mon' | 'muc-dich' | 'thoi-gian' | 'quen-chua' | 'lop'

/** `?mon=english,programming` — bỏ id lạ, giữ id hợp lệ theo thứ tự xuất hiện, không lỗi. */
function monTuQuery(raw: string | null): IntentSubjectId[] {
  if (!raw) return []
  const out: IntentSubjectId[] = []
  for (const phan of raw.split(',')) {
    const parsed = IntentSubjectIdSchema.safeParse(phan.trim())
    if (parsed.success && !out.includes(parsed.data)) out.push(parsed.data)
  }
  return out
}

export default function StartByIntent() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { user } = useAuth()
  const uid = user?.id ?? ''
  const laKhach = user?.isGuest !== false

  const [subjectIds, setSubjectIds] = useState<IntentSubjectId[]>(() =>
    monTuQuery(params.get('mon')),
  )
  const [purpose, setPurpose] = useState<IntentPurpose>()
  const [timeBudget, setTimeBudget] = useState<IntentTimeBudget>()
  const [level, setLevel] = useState<IntentLevel>()
  const [grade, setGrade] = useState<IntentGrade>()

  const [stepIndex, setStepIndex] = useState(0)
  const [dangHoi, setDangHoi] = useState(true)
  const [dangTinh, setDangTinh] = useState(false)
  const [ketQua, setKetQua] = useState<StartActionResult | null>(null)
  const [canhBao, setCanhBao] = useState('')
  const [dangMo, setDangMo] = useState(true)

  usePageTitle('Bắt đầu | Đồng Hành Cùng Bạn')

  // Bước "lớp" CHỈ hiện khi trong lựa chọn có môn STEM — không hỏi thừa người học Lập trình.
  const steps = useMemo<StepId[]>(() => {
    const base: StepId[] = ['mon', 'muc-dich', 'thoi-gian', 'quen-chua']
    return subjectIds.some(isStemIntentSubject) ? [...base, 'lop'] : base
  }, [subjectIds])
  const step = steps[Math.min(stepIndex, steps.length - 1)] ?? 'mon'

  /** Tính lại "một việc" từ ý định + tiến độ hiện tại. Ý định `null` ⇒ dẫn về danh mục môn. */
  const tinhGoiY = useCallback(
    async (intent: LearnerIntent | null) => {
      setDangTinh(true)
      const outlines = intent
        ? await buildIntentOutlines(intent, uid, user?.plan === 'vip' ? 'vip' : 'free')
        : new Map()
      setKetQua(pickStartAction(intent, { outlines, catalogPath: CATALOG_PATH }))
      setDangTinh(false)
      setDangHoi(false)
    },
    [uid, user?.plan],
  )

  // Đã có ý định (trên máy hoặc trên tài khoản) → KHÔNG hỏi lại, hiện thẳng màn gợi ý.
  // Chạy đúng MỘT lần cho mỗi uid: reload nhiều lần cũng chỉ một lượt GET.
  useEffect(() => {
    if (!uid) return
    let huy = false
    void (async () => {
      const local = readLocalIntent(uid)
      const daCo = local ?? (laKhach ? null : await fetchServerIntent())
      if (huy) return
      setDangMo(false)
      if (!daCo) return
      if (!local) writeLocalIntent(uid, daCo)
      setSubjectIds([...daCo.subjectIds])
      setPurpose(daCo.purpose)
      setTimeBudget(daCo.timeBudget)
      setLevel(daCo.level)
      setGrade(daCo.grade)
      await tinhGoiY(daCo)
    })()
    return () => {
      huy = true
    }
  }, [uid, laKhach, tinhGoiY])

  // Đo rớt từng bước — dùng lại event có sẵn, không thêm event mới (đặc tả §① mục 6).
  useEffect(() => {
    if (dangHoi && !dangMo) track('onboarding_step_view', { refCode: `intent:${step}` })
  }, [step, dangHoi, dangMo])

  function chuyenBuoc() {
    setStepIndex((s) => s + 1)
  }

  async function ketThuc(
    lua: Partial<Record<'purpose' | 'timeBudget' | 'level' | 'grade', unknown>> = {},
  ) {
    const cuoi = {
      purpose: (lua.purpose as IntentPurpose | undefined) ?? purpose,
      timeBudget: (lua.timeBudget as IntentTimeBudget | undefined) ?? timeBudget,
      level: (lua.level as IntentLevel | undefined) ?? level,
      grade: (lua.grade as IntentGrade | undefined) ?? grade,
    }
    // Bỏ HẾT (không chọn môn nào) ⇒ KHÔNG lưu bản rỗng; gợi ý là danh mục môn.
    if (subjectIds.length === 0) {
      await tinhGoiY(null)
      return
    }
    const now = mocThoiGian()
    const cu = readLocalIntent(uid)
    const intent = buildIntent(
      {
        subjectIds,
        ...(cuoi.purpose ? { purpose: cuoi.purpose } : {}),
        ...(cuoi.timeBudget ? { timeBudget: cuoi.timeBudget } : {}),
        ...(cuoi.level ? { level: cuoi.level } : {}),
        // Lớp chỉ đi cùng môn STEM — hợp đồng từ chối nếu không, nên lọc ngay tại đây.
        ...(cuoi.grade && subjectIds.some(isStemIntentSubject) ? { grade: cuoi.grade } : {}),
      },
      now,
      cu?.createdAt ?? now,
    )
    const luuDuoc = writeLocalIntent(uid, intent)
    if (!luuDuoc) setCanhBao('Không lưu được trên máy này — bạn vẫn bắt đầu học được ngay bây giờ.')
    if (!laKhach) {
      const ok = await saveServerIntent(intent)
      if (!ok) setCanhBao('Chưa lưu được lên tài khoản — mình sẽ thử lại lần sau.')
    }
    await tinhGoiY(intent)
  }

  function doiYDinh() {
    setKetQua(null)
    setStepIndex(0)
    setDangHoi(true)
  }

  function chonMon(id: IntentSubjectId) {
    setSubjectIds((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]))
  }

  if (dangMo) {
    return (
      <main
        id={MAIN_CONTENT_ID}
        tabIndex={-1}
        className="focus:outline-none min-h-dvh flex items-center justify-center p-5 pb-32"
      >
        <p role="status" className="text-sm text-zinc-300 flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          Đang mở…
        </p>
      </main>
    )
  }

  // ── Màn GỢI Ý: đúng MỘT việc nổi bật ────────────────────────────────────
  if (!dangHoi) {
    return (
      <main
        id={MAIN_CONTENT_ID}
        tabIndex={-1}
        className="focus:outline-none min-h-dvh flex items-center justify-center p-5 pb-32"
      >
        <div className="w-full max-w-md space-y-4 animate-fade-in">
          <h1 className="text-xl font-semibold text-white">Mình gợi ý bắt đầu từ đây nhé?</h1>

          {dangTinh && (
            <p role="status" className="text-sm text-zinc-300 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Đang chọn một việc cho bạn…
            </p>
          )}

          {canhBao && (
            <p role="alert" className="text-sm text-rose-300 theme-light:text-rose-800">
              {canhBao}
            </p>
          )}

          {ketQua && (
            <>
              <section className="rounded-2xl border border-accent-500/40 bg-accent-500/10 p-4 space-y-2">
                <p className="text-base font-semibold text-white break-words">
                  {ketQua.primary.title}
                </p>
                <p className="text-sm text-zinc-200">{ketQua.primary.why}</p>
                <Button
                  onClick={() => {
                    track('cta_click', { refCode: 'intent:start' })
                    navigate(ketQua.primary.href)
                  }}
                  fullWidth
                  className="mt-2"
                >
                  <Check className="w-4 h-4" />
                  Bắt đầu
                </Button>
              </section>

              {ketQua.alternatives.length > 0 && (
                <section className="space-y-2">
                  <h2 className="text-xs text-zinc-400">Hoặc bắt đầu với môn khác:</h2>
                  {ketQua.alternatives.map((alt) => (
                    <button
                      key={alt.id}
                      type="button"
                      onClick={() => navigate(alt.href)}
                      className="tap-44 w-full text-left rounded-xl border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800/70 hover:border-zinc-700 transition-colors px-4 py-3 text-sm text-zinc-200 break-words"
                    >
                      {alt.title}
                    </button>
                  ))}
                </section>
              )}
            </>
          )}

          <button
            type="button"
            onClick={doiYDinh}
            className="tap-44 w-full inline-flex items-center justify-center gap-2 text-xs text-zinc-400 hover:text-zinc-200 transition-colors underline underline-offset-2"
          >
            <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
            Đổi ý định
          </button>
        </div>
      </main>
    )
  }

  // ── Lớp HỎI ─────────────────────────────────────────────────────────────
  const nutBoQua = (onClick: () => void) => (
    <button
      type="button"
      onClick={onClick}
      className="tap-44 px-3 text-xs text-zinc-400 hover:text-zinc-200 transition-colors underline underline-offset-2"
    >
      Bỏ qua
    </button>
  )

  const laBuocCuoi = stepIndex >= steps.length - 1

  return (
    <main
      id={MAIN_CONTENT_ID}
      tabIndex={-1}
      className="focus:outline-none min-h-dvh flex items-center justify-center p-5 pb-32"
    >
      <div className="w-full max-w-md space-y-5 animate-fade-in">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-accent-400" aria-hidden="true" />
          <p className="text-xs text-zinc-400">Vài câu ngắn thôi, câu nào cũng bỏ qua được</p>
        </div>

        {/* Chấm chỉ VỊ TRÍ, không phải điểm số — xem ghi chú đầu file */}
        <ol className="flex gap-1.5" aria-label={`Bước ${stepIndex + 1} trên ${steps.length}`}>
          {steps.map((s, i) => (
            <li
              key={s}
              aria-hidden="true"
              className={`h-1 flex-1 rounded-full ${i <= stepIndex ? 'bg-accent-500' : 'bg-zinc-800'}`}
            />
          ))}
        </ol>

        {step === 'mon' && (
          <fieldset className="space-y-3">
            <legend className="text-lg font-semibold text-white">Bạn muốn học môn gì?</legend>
            <p className="text-sm text-zinc-300">Chọn được nhiều môn — môn chọn trước học trước.</p>
            <div className="grid grid-cols-2 gap-2">
              {SUBJECT_OPTIONS.map((o) => {
                const chon = subjectIds.includes(o.value)
                return (
                  <button
                    key={o.value}
                    type="button"
                    aria-pressed={chon}
                    onClick={() => chonMon(o.value)}
                    className={`tap-44 rounded-xl border px-3 py-3 text-sm transition-colors ${
                      chon
                        ? 'border-accent-500 bg-accent-500/15 text-white'
                        : 'border-zinc-700 bg-zinc-900/60 text-zinc-100 hover:bg-zinc-800/70 hover:border-zinc-600'
                    }`}
                  >
                    {o.label}
                  </button>
                )
              })}
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={chuyenBuoc} className="flex-1">
                Tiếp
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Button>
              {nutBoQua(() => void ketThuc())}
            </div>
          </fieldset>
        )}

        {step === 'muc-dich' && (
          <fieldset className="space-y-3">
            <legend className="text-lg font-semibold text-white">Bạn học để làm gì?</legend>
            <div className="space-y-2">
              {PURPOSE_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  aria-pressed={purpose === o.value}
                  onClick={() => {
                    setPurpose(o.value)
                    chuyenBuoc()
                  }}
                  className="tap-44 w-full text-left rounded-xl border border-zinc-700 bg-zinc-900/60 hover:bg-zinc-800/70 hover:border-zinc-600 transition-colors px-4 py-3 text-sm text-zinc-100"
                >
                  {o.label}
                </button>
              ))}
            </div>
            {nutBoQua(chuyenBuoc)}
          </fieldset>
        )}

        {step === 'thoi-gian' && (
          <fieldset className="space-y-3">
            <legend className="text-lg font-semibold text-white">Mỗi ngày bạn có bao lâu?</legend>
            <div className="grid grid-cols-2 gap-2">
              {TIME_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  aria-pressed={timeBudget === o.value}
                  onClick={() => {
                    setTimeBudget(o.value)
                    chuyenBuoc()
                  }}
                  className="tap-44 rounded-xl border border-zinc-700 bg-zinc-900/60 hover:bg-zinc-800/70 hover:border-zinc-600 transition-colors px-3 py-3 text-sm text-zinc-100"
                >
                  {o.label}
                </button>
              ))}
            </div>
            {nutBoQua(chuyenBuoc)}
          </fieldset>
        )}

        {step === 'quen-chua' && (
          <fieldset className="space-y-3">
            <legend className="text-lg font-semibold text-white">
              Bạn đã quen với môn này chưa?
            </legend>
            <div className="space-y-2">
              {LEVEL_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  aria-pressed={level === o.value}
                  onClick={() => {
                    setLevel(o.value)
                    if (laBuocCuoi) void ketThuc({ level: o.value })
                    else chuyenBuoc()
                  }}
                  className="tap-44 w-full text-left rounded-xl border border-zinc-700 bg-zinc-900/60 hover:bg-zinc-800/70 hover:border-zinc-600 transition-colors px-4 py-3 text-sm text-zinc-100"
                >
                  {o.label}
                </button>
              ))}
            </div>
            {nutBoQua(() => (laBuocCuoi ? void ketThuc() : chuyenBuoc()))}
          </fieldset>
        )}

        {step === 'lop' && (
          <fieldset className="space-y-3">
            <legend className="text-lg font-semibold text-white">Bạn đang học lớp mấy?</legend>
            <div className="space-y-2">
              {GRADE_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  aria-pressed={grade === o.value}
                  onClick={() => {
                    setGrade(o.value)
                    void ketThuc({ grade: o.value })
                  }}
                  className="tap-44 w-full text-left rounded-xl border border-zinc-700 bg-zinc-900/60 hover:bg-zinc-800/70 hover:border-zinc-600 transition-colors px-4 py-3 text-sm text-zinc-100"
                >
                  {o.label}
                </button>
              ))}
            </div>
            {nutBoQua(() => void ketThuc())}
          </fieldset>
        )}
      </div>
    </main>
  )
}
