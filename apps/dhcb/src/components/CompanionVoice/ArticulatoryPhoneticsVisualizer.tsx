import { useState, useEffect } from 'react'
import { Activity, Sparkles, Layers, TrendingUp } from 'lucide-react'
import type {
  L1PhonemeTarget,
  ArticulatoryGuide,
  PhoneticAnalysisReport,
} from '@dhcb/core-contracts/articulatoryPhonetics'
import { buttonClass } from '@core/buttonStyles'

const PHONEME_OPTIONS: { target: L1PhonemeTarget; label: string; sample: string }[] = [
  { target: 'TH_VOICELESS', label: '/θ/ (th- vô thanh)', sample: 'think, thought, path' },
  { target: 'TH_VOICED', label: '/ð/ (th- hữu thanh)', sample: 'this, that, brother' },
  { target: 'ASH_SHORT_A', label: '/æ/ (a bẹt)', sample: 'cat, apple, bad' },
  { target: 'RETROFLEX_R', label: '/r/ (r uốn lưỡi)', sample: 'red, right, river' },
  { target: 'FINAL_CLUSTER_KS', label: '/-ks/ (đuôi box)', sample: 'box, fix, relax' },
  { target: 'AFFRICATE_CH', label: '/tʃ/ (ch bật tắc)', sample: 'church, watch, check' },
  { target: 'AFFRICATE_JH', label: '/dʒ/ (j hữu thanh)', sample: 'judge, job, bridge' },
  { target: 'FINAL_SIBILANT_Z', label: '/-z/ (s hữu thanh)', sample: 'dogs, plays, rules' },
]

export default function ArticulatoryPhoneticsVisualizer() {
  const [selectedPhoneme, setSelectedPhoneme] = useState<L1PhonemeTarget>('TH_VOICELESS')
  const [guide, setGuide] = useState<ArticulatoryGuide | null>(null)
  const [report, setReport] = useState<PhoneticAnalysisReport | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false)

  useEffect(() => {
    async function loadGuide() {
      try {
        const res = await fetch(`/api/articulatory-phonetics?phoneme=${selectedPhoneme}`)
        if (res.ok) {
          const data = await res.json()
          if (data.guide) {
            setGuide(data.guide)
          }
        }
      } catch (err) {
        console.error('Failed to load articulatory guide', err)
      }
    }
    loadGuide()
  }, [selectedPhoneme])

  const handleTestPhonetics = async () => {
    setIsAnalyzing(true)
    try {
      const res = await fetch('/api/articulatory-phonetics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetWord:
            PHONEME_OPTIONS.find((p) => p.target === selectedPhoneme)?.sample.split(',')[0] ||
            'think',
          targetPhoneme: selectedPhoneme,
          scoreEstimate: Math.floor(Math.random() * 15) + 85,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setReport(data.report)
      }
    } catch (err) {
      console.error('Failed to run phonetics analysis', err)
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Helper để vẽ đường cong giải phẫu lưỡi theo vị trí
  const getTonguePath = (pos: string) => {
    switch (pos) {
      case 'tip_between_teeth':
        return 'M 60,140 Q 110,120 160,88 Q 170,82 175,85' // Đầu lưỡi thò ra giữa răng
      case 'curled_retroflex':
        return 'M 60,140 Q 110,130 140,80 Q 130,55 120,65' // Lưỡi cong ngược lên vòm họng
      case 'low_front':
        return 'M 60,140 Q 110,150 155,130' // Lưỡi phẳng hạ thấp sàn miệng
      case 'blade_hard_palate':
        return 'M 60,140 Q 100,80 140,80 Q 155,100 160,110' // Mặt lưỡi ép sát ngạc cứng
      case 'dorsum_velar':
        return 'M 60,140 Q 80,75 110,90 Q 140,120 160,120' // Cuống lưỡi chạm ngạc mềm
      default:
        return 'M 60,140 Q 110,110 155,100'
    }
  }

  return (
    <div className="bg-surface-card border border-teal-500/30 rounded-2xl p-5 shadow-2xl backdrop-blur-xl relative overflow-hidden transition duration-300">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-line-subtle">
        <div className="flex min-w-0 items-center gap-3">
          <div className="w-10 h-10 shrink-0 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-500 flex items-center justify-center shadow-lg">
            <Activity className="w-5 h-5 text-[#fff]" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <h3 className="text-base font-bold text-white tracking-wide">
                3D Articulatory Phonetics & Pitch Alignment
              </h3>
              <span className="text-[0.6875rem] px-2 py-0.5 font-bold uppercase rounded-full bg-teal-500/20 text-teal-300 theme-light:text-teal-900 border border-teal-500/30">
                L1 Special Care
              </span>
            </div>
            <p className="text-xs text-content-secondary">
              Giải phẫu âm vị học 3D vòm họng & đối sánh đường cong ngữ điệu F0
            </p>
          </div>
        </div>

        <button
          onClick={handleTestPhonetics}
          disabled={isAnalyzing}
          className={buttonClass({
            variant: 'primary',
            className: 'self-start sm:self-auto shrink-0',
          })}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{isAnalyzing ? 'Đang phân tích...' : 'Kiểm tra Phát âm'}</span>
        </button>
      </div>

      {/* Phoneme selector badges */}
      <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
        {PHONEME_OPTIONS.map((item) => {
          const isSelected = item.target === selectedPhoneme
          return (
            <button
              key={item.target}
              onClick={() => {
                setSelectedPhoneme(item.target)
                setReport(null)
              }}
              aria-pressed={isSelected}
              className={`tap-44-y px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition border ${
                isSelected
                  ? 'bg-teal-950/60 theme-light:bg-teal-100 border-teal-400 text-teal-200 theme-light:text-teal-900 shadow-md shadow-teal-500/20'
                  : 'bg-surface-raised border-line-subtle text-content-secondary hover:text-content'
              }`}
            >
              {item.label}
            </button>
          )
        })}
      </div>

      {guide && (
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Col 1: SVG Sagittal Vocal Tract Diagram */}
          <div className="lg:col-span-5 p-4 rounded-xl bg-surface-raised border border-line-subtle flex flex-col items-center justify-center">
            <div className="text-[0.6875rem] font-bold text-content-secondary mb-2 flex items-center gap-1.5">
              <span>Mặt cắt Giải phẫu Miệng / Vòm họng</span>
              <span className="text-teal-300 theme-light:text-teal-900 font-mono text-sm">
                {guide.ipaSymbol}
              </span>
            </div>

            <svg
              viewBox="0 0 220 180"
              className="w-48 h-40 overflow-visible"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Vòm miệng trên (Hard & Soft Palate) */}
              <path
                d="M 60,60 Q 110,40 150,60 Q 170,70 170,80"
                fill="none"
                stroke="#64748b"
                strokeWidth="4"
                strokeLinecap="round"
              />
              {/* Răng cửa trên */}
              <rect x="165" y="75" width="6" height="12" fill="#e2e8f0" rx="1" />
              {/* Răng cửa dưới */}
              <rect x="165" y="105" width="6" height="12" fill="#e2e8f0" rx="1" />

              {/* Dây thanh quản (Vocal cords) */}
              <circle
                cx="50"
                cy="150"
                r="7"
                fill={guide.vocalCordVibration ? '#10b981' : '#475569'}
                className={guide.vocalCordVibration ? 'animate-pulse' : ''}
              />

              {/* Lưỡi giải phẫu động (Tongue Curve) */}
              <path
                d={getTonguePath(guide.tonguePosition)}
                fill="none"
                stroke="#2dd4bf"
                strokeWidth="8"
                strokeLinecap="round"
                className="transition-[d] duration-500 ease-out"
              />

              {/* Mũi tên luồng khí (Airflow) */}
              <path
                d="M 120,70 Q 145,72 185,75"
                fill="none"
                stroke="#38bdf8"
                strokeWidth="2"
                strokeDasharray="4 2"
              />
            </svg>

            {/* Nhãn dây thanh là chữ HTML theo token, không phải <text> trong SVG: trước đây tô
                cứng `#94a3b8` cỡ ~7px — ở theme sáng chỉ ≈ 2,6:1 và axe không đo được chữ SVG
                (lộ ra khi quét trạng thái sau tương tác, changelog 0544). */}
            <div className="mt-1 text-[0.6875rem] font-semibold text-content-secondary">
              Dây thanh: {guide.vocalCordVibration ? 'thanh quản rung' : 'vô thanh (không rung)'}
            </div>
            <div className="mt-2 text-[0.6875rem] text-center text-content-secondary max-w-xs">
              {guide.airflowDescription}
            </div>
          </div>

          {/* Col 2: Step-by-Step Anatomical Tips & L1 Trap */}
          <div className="lg:col-span-7 space-y-3">
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 theme-light:text-amber-900">
              <span className="font-bold text-amber-300 theme-light:text-amber-900">
                ⚠️ Lỗi kinh điển người Việt hay mắc:{' '}
              </span>
              {guide.commonVietnameseMistake}
            </div>

            <div className="p-3.5 rounded-xl bg-surface-raised border border-line-strong space-y-2">
              <div className="text-xs font-bold text-content flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-teal-400 theme-light:text-teal-900" />
                <span>3 bước đặt khẩu hình chuẩn xác:</span>
              </div>
              <ul className="space-y-1.5">
                {guide.stepByStepAnatomyTips.map((tip, idx) => (
                  <li key={idx} className="text-xs text-content-secondary flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-teal-500/20 text-teal-200 theme-light:text-teal-950 text-[0.6875rem] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Pitch Contour Result Section if generated */}
            {report && (
              <div className="p-3.5 rounded-xl bg-teal-950/40 theme-light:bg-teal-50 border border-teal-500/40 space-y-2 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-teal-200 theme-light:text-teal-900">
                    <TrendingUp className="w-4 h-4 text-teal-400 theme-light:text-teal-900" />
                    <span>Đường cong Ngữ điệu F0 (Pitch Contour):</span>
                  </div>
                  <span className="text-xs font-bold text-emerald-300 theme-light:text-emerald-900 bg-emerald-400/10 px-2 py-0.5 rounded">
                    Khớp {report.pitchContour.alignmentScore}%
                  </span>
                </div>

                {/* Simulated Pitch Chart — chú giải nằm DƯỚI biểu đồ, không đè lên đường cong
                    (chữ đè lên nét vẽ thì nền không xác định, axe không đo được — changelog 0544). */}
                <div className="h-16 w-full bg-surface-raised rounded-lg p-2 flex items-center overflow-hidden border border-line-subtle">
                  {/* Native curve */}
                  <svg className="w-full h-full" viewBox="0 0 300 50">
                    <path
                      d="M 10,35 Q 100,10 200,20 T 290,40"
                      fill="none"
                      stroke="#64748b"
                      strokeWidth="2"
                      strokeDasharray="4 2"
                    />
                    <path
                      d="M 10,38 Q 100,12 200,18 T 290,36"
                      fill="none"
                      stroke="#2dd4bf"
                      strokeWidth="2.5"
                    />
                  </svg>
                </div>
                <div className="text-right text-[0.6875rem] text-content-secondary">
                  <span>--- Bản xứ</span> |{' '}
                  <span className="text-teal-300 theme-light:text-teal-900">― Của bạn</span>
                </div>

                <p className="text-[0.6875rem] text-content-secondary italic">
                  💡 {report.pitchContour.coachingAdvice}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
