// ProgrammingPlayground — trang "Chạy thử Python" của môn Lập trình (PR-L2).
// Python chạy NGAY TRONG TRÌNH DUYỆT (Pyodide WASM trong Web Worker, tự host —
// xem lib/pythonRunner.ts). Kèm 10 bài mẫu bậc P1 để vọc trước khi bài học đầy đủ
// (khuôn 8 bước) vào ở PR-L3/L4.
import { MAIN_CONTENT_ID } from '@core/PageShell'
import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Play, Square, Loader2, Terminal, Keyboard, ListOrdered } from 'lucide-react'
import { usePageTitle } from '../../../lib/usePageTitle'
import Layout from '../../../components/Layout'
import { PROGRAMMING_PREFIX } from '../../../lib/programmingRoutes'
import CodeEditor from '../../../components/CodeEditor'
import { runPython, resetPythonWorker } from '../../../lib/pythonRunner'
import { P1_SAMPLES } from '@dhcb/subject-programming/samplesP1'

// 'done' tách khỏi 'idle' để giữ luật N4: sau khi chạy phải nói được "đã chạy xong", kể cả
// khi chương trình không in ra gì. Gộp hai trạng thái này là cách cũ khiến màn hình quay về
// câu 'Bấm "Chạy"…' — tức nói dối rằng chưa chạy lần nào.
type RunState = 'idle' | 'loading-env' | 'running' | 'done'

export default function ProgrammingPlayground() {
  usePageTitle('Chạy thử code | Môn Lập trình · Đồng Hành Cùng Bạn')
  const nav = useNavigate()
  const firstSample = P1_SAMPLES[0]!
  const [sampleId, setSampleId] = useState(firstSample.id)
  const [code, setCode] = useState(firstSample.code)
  const [stdinText, setStdinText] = useState(firstSample.stdinLines.join('\n'))
  const [output, setOutput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [runState, setRunState] = useState<RunState>('idle')
  const runningRef = useRef(false)

  // Rời trang thì huỷ worker cho nhẹ máy (vào lại sẽ tải lại môi trường khi cần).
  useEffect(() => () => resetPythonWorker(), [])

  const pickSample = (id: string) => {
    const sample = P1_SAMPLES.find((s) => s.id === id)
    if (!sample) return
    setSampleId(id)
    setCode(sample.code)
    setStdinText(sample.stdinLines.join('\n'))
    setOutput('')
    setError(null)
  }

  const handleRun = async () => {
    if (runningRef.current) return
    runningRef.current = true
    setRunState('running')
    setOutput('')
    setError(null)
    const stdinLines = stdinText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0)
    const result = await runPython(code, {
      stdinLines,
      onOutput: setOutput,
      onLoading: () => setRunState('loading-env'),
    })
    setOutput(result.output)
    if (result.error) setError(result.error)
    setRunState('done')
    runningRef.current = false
  }

  const handleStop = () => {
    resetPythonWorker()
    setError('Đã dừng chương trình theo yêu cầu.')
    setRunState('done')
    runningRef.current = false
  }

  return (
    <div className="min-h-dvh bg-zinc-950 text-zinc-100">
      <Layout onBack={() => nav(PROGRAMMING_PREFIX)} title="Chạy thử Python" />

      <main
        id={MAIN_CONTENT_ID}
        tabIndex={-1}
        className="focus:outline-none max-w-4xl mx-auto px-4 pt-6 pb-[calc(2rem+var(--bnav-h))] space-y-5"
      >
        <h1 tabIndex={-1} className="sr-only focus:outline-none">
          Chạy thử Python
        </h1>

        {/* Chọn bài mẫu P1 */}
        <section className="space-y-2">
          <label
            htmlFor="sample-select"
            className="text-sm font-bold text-white flex items-center gap-2"
          >
            <ListOrdered className="w-4 h-4 text-accent-400" />
            <span>Bài mẫu bậc P1</span>
          </label>
          <select
            id="sample-select"
            value={sampleId}
            onChange={(e) => pickSample(e.target.value)}
            className="tap-44 w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3 text-base text-white focus:outline-none focus:border-accent-500"
          >
            {P1_SAMPLES.map((s, i) => (
              <option key={s.id} value={s.id}>
                Bài {i + 1}: {s.title}
              </option>
            ))}
          </select>
        </section>

        {/* Editor */}
        <section className="space-y-2">
          <h2 className="text-sm font-bold text-white">Code Python (sửa thoải mái)</h2>
          <CodeEditor value={code} onChange={setCode} ariaLabel="Ô soạn code Python" />
        </section>

        {/* Dữ liệu nhập cho input() */}
        <section className="space-y-2">
          <label
            htmlFor="stdin-input"
            className="text-sm font-bold text-white flex items-center gap-2"
          >
            <Keyboard className="w-4 h-4 text-accent-400" />
            <span>Dữ liệu nhập (mỗi dòng = một lần input)</span>
          </label>
          <textarea
            id="stdin-input"
            value={stdinText}
            onChange={(e) => setStdinText(e.target.value)}
            rows={3}
            placeholder="Chương trình có input() thì điền sẵn câu trả lời ở đây, mỗi dòng một câu"
            className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3 text-base font-mono text-white focus:outline-none focus:border-accent-500 placeholder:text-zinc-500 resize-y"
          />
        </section>

        {/* Nút chạy / dừng */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => void handleRun()}
            disabled={runState === 'running' || runState === 'loading-env' || !code.trim()}
            className="tap-44 inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-accent-500 hover:bg-accent-400 disabled:opacity-50 text-black font-semibold text-sm transition shadow-md active:scale-[0.98]"
          >
            {runState === 'idle' || runState === 'done' ? (
              <>
                <Play className="w-4 h-4" />
                <span>Chạy</span>
              </>
            ) : (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{runState === 'loading-env' ? 'Đang tải môi trường…' : 'Đang chạy…'}</span>
              </>
            )}
          </button>
          {(runState === 'running' || runState === 'loading-env') && (
            <button
              onClick={handleStop}
              className="tap-44 inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-sm transition"
            >
              <Square className="w-4 h-4" />
              <span>Dừng</span>
            </button>
          )}
        </div>

        {/* Console kết quả */}
        <section className="space-y-2" aria-live="polite">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Terminal className="w-4 h-4 text-accent-400" />
            <span>Kết quả</span>
          </h2>
          <pre className="min-h-[96px] max-h-80 overflow-auto rounded-2xl border border-zinc-800 bg-zinc-950 p-4 text-sm font-mono text-zinc-100 whitespace-pre-wrap">
            {/* Luật N4: không bao giờ để trống sau khi chạy. Chương trình chạy đúng mà không in
                gì là chuyện thường; im lặng ở đây khiến học viên tưởng máy hỏng. */}
            {output ||
              (runState === 'idle'
                ? 'Bấm "Chạy" để xem kết quả ở đây.'
                : runState === 'running' || runState === 'loading-env'
                  ? 'Đang chạy…'
                  : error
                    ? ''
                    : 'Chạy xong — chương trình không in ra gì.')}
          </pre>
          {error && (
            <pre className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm font-mono text-rose-200 theme-light:text-rose-700 whitespace-pre-wrap overflow-auto">
              {error}
            </pre>
          )}
        </section>
      </main>
    </div>
  )
}
