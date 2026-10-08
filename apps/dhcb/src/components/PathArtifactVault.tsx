// PathArtifactVault — "Hồ sơ bằng chứng" của một lộ trình mục tiêu (đợt 3/4). Người học tự
// khai artifact (link + ghi chú) cuối mỗi giai đoạn — KHÔNG chấm bằng AI (quyết định đặc tả).
import { useEffect, useId, useState } from 'react'
import { Award, Trash2, Plus, Loader2 } from 'lucide-react'
import {
  fetchPathArtifacts,
  createPathArtifact,
  deletePathArtifact,
  type PathArtifact,
} from '../lib/programmingPathArtifacts'
import { buttonClass } from '@core/buttonStyles'

interface Props {
  pathId: string
  /** Giai đoạn có nội dung thật (P1–P4) — không cho nộp artifact cho giai đoạn đang soạn. */
  phases: { id: string; name: string }[]
}

export default function PathArtifactVault({ pathId, phases }: Props) {
  const [artifacts, setArtifacts] = useState<PathArtifact[]>([])
  const [loaded, setLoaded] = useState(false)
  const [phaseId, setPhaseId] = useState(phases[0]?.id ?? '')
  const [url, setUrl] = useState('')
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // [U3, audit UI/UX 2026-09-30 C4] Ô chọn giai đoạn từng KHÔNG có nhãn (axe `select-name`,
  // critical): trình đọc màn hình chỉ đọc "hộp kết hợp" mà không nói chọn cái gì. Hai ô nhập
  // chỉ có placeholder — mất ngay khi gõ (WCAG 3.3.2). Nay mỗi ô có <label> hiện, nối bằng id.
  const fieldId = useId()
  const phaseFieldId = `${fieldId}-giai-doan`
  const urlFieldId = `${fieldId}-link`
  const noteFieldId = `${fieldId}-ghi-chu`

  useEffect(() => {
    void fetchPathArtifacts(pathId).then((a) => {
      setArtifacts(a)
      setLoaded(true)
    })
  }, [pathId])

  async function handleSubmit() {
    if (!phaseId || url.trim().length === 0) return
    setSubmitting(true)
    setError(null)
    const result = await createPathArtifact(pathId, phaseId, url.trim(), note.trim())
    setSubmitting(false)
    if (!result.ok) {
      setError(result.error ?? 'Nộp artifact thất bại')
      return
    }
    setUrl('')
    setNote('')
    setArtifacts(await fetchPathArtifacts(pathId))
  }

  async function handleDelete(id: string) {
    const ok = await deletePathArtifact(id)
    if (ok) setArtifacts((prev) => prev.filter((a) => a.id !== id))
  }

  if (phases.length === 0) return null

  return (
    <section className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-5 space-y-3 shadow-sm">
      <h2 className="text-base font-bold text-white flex items-center gap-2">
        <Award className="w-5 h-5 text-accent-400" aria-hidden="true" />
        <span>Hồ sơ bằng chứng</span>
      </h2>
      <p className="text-sm text-zinc-300 leading-relaxed">
        Lưu lại link repo, bài viết hay ảnh chụp làm bằng chứng cho từng giai đoạn — hồ sơ này là
        của bạn, không ai chấm điểm.
      </p>

      <div className="space-y-2 rounded-2xl bg-zinc-950 border border-zinc-800 p-3">
        <label htmlFor={phaseFieldId} className="block text-xs font-semibold text-zinc-200">
          Giai đoạn
        </label>
        <select
          id={phaseFieldId}
          value={phaseId}
          onChange={(e) => setPhaseId(e.target.value)}
          className="tap-44 w-full rounded-xl bg-zinc-900 border border-zinc-800 px-3 py-2.5 text-sm text-zinc-100"
        >
          {phases.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <label htmlFor={urlFieldId} className="block text-xs font-semibold text-zinc-200">
          Link bằng chứng
        </label>
        <input
          id={urlFieldId}
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://…"
          className="tap-44 w-full rounded-xl bg-zinc-900 border border-zinc-800 px-3 py-2.5 text-sm text-zinc-100"
        />
        <label htmlFor={noteFieldId} className="block text-xs font-semibold text-zinc-200">
          Ghi chú
        </label>
        <input
          id={noteFieldId}
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Ghi chú ngắn (tuỳ chọn)"
          className="tap-44 w-full rounded-xl bg-zinc-900 border border-zinc-800 px-3 py-2.5 text-sm text-zinc-100"
        />
        {error && <p className="text-xs text-rose-400 theme-light:text-rose-900">{error}</p>}
        <button
          onClick={() => void handleSubmit()}
          disabled={submitting || url.trim().length === 0}
          className={buttonClass({ fullWidth: true })}
        >
          {submitting ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
          ) : (
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
          )}
          <span>{submitting ? 'Đang lưu…' : 'Lưu artifact'}</span>
        </button>
      </div>

      {loaded && artifacts.length === 0 && (
        <p className="text-xs text-zinc-400">Chưa có artifact nào — nộp cái đầu tiên ở trên.</p>
      )}

      <ul className="space-y-2">
        {artifacts.map((a) => (
          <li
            key={a.id}
            className="rounded-xl bg-zinc-950 border border-zinc-800 p-2.5 flex items-start justify-between gap-2"
          >
            <div className="min-w-0">
              <p className="text-xs font-semibold text-zinc-200">
                {phases.find((p) => p.id === a.phaseId)?.name ?? a.phaseId}
              </p>
              <a
                href={a.url}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-accent-400 underline break-all"
              >
                {a.url}
              </a>
              {a.note && <p className="text-xs text-zinc-400 mt-0.5">{a.note}</p>}
            </div>
            <button
              onClick={() => void handleDelete(a.id)}
              aria-label="Xoá artifact này"
              className="tap-44 shrink-0 p-2 rounded-lg text-zinc-400 hover:text-rose-400"
            >
              <Trash2 className="w-4 h-4" aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
