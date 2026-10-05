// MixedLangText — hiển thị chuỗi trộn hai thứ tiếng (công thức ngữ pháp CEFR) với `lang` gắn
// theo TỪNG ĐOẠN (WCAG 3.1.2, audit 2026-09-30 C5). Quy tắc tách: `lib/langRuns.ts`.
// Không đổi giao diện: các `<span>` không mang lớp CSS nào, chữ hiển thị y hệt chuỗi gốc.
import { Fragment, useMemo } from 'react'
import { splitLangRuns } from '../lib/langRuns'

export default function MixedLangText({ text }: { text: string }) {
  const runs = useMemo(() => splitLangRuns(text), [text])
  return (
    <>
      {runs.map((run, i) =>
        run.lang ? (
          <span key={i} lang={run.lang}>
            {run.text}
          </span>
        ) : (
          <Fragment key={i}>{run.text}</Fragment>
        ),
      )}
    </>
  )
}
