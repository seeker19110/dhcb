// Loader cho dữ liệu CEFR — tải từ /public/data/cefr.json bằng fetch() thay vì bundle.
// Re-export các interface để code cũ import type không cần sửa.

export type { Example, CommonMistake, QuizItem, GrammarLesson, CefrUnit, CefrLevel } from './cefr'

import type { CefrLevel } from './cefr'

let _promise: Promise<CefrLevel[]> | null = null

export function loadCefr(): Promise<CefrLevel[]> {
  if (!_promise) {
    const promise = fetch('/data/cefr.json').then((response) => {
      // `CEFR HTTP <mã>` để `friendlyError` dịch đúng ngôn ngữ giao diện (changelog 0602).
      if (!response.ok) throw new Error(`CEFR HTTP ${response.status}`)
      return response.json() as Promise<CefrLevel[]>
    })
    _promise = promise
    void promise.catch(() => {
      if (_promise === promise) _promise = null
    })
  }
  return _promise
}
