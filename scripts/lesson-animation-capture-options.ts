/** Tham số của công cụ chụp; từ chối lỗi gõ để không báo đạt khi chưa kiểm đúng bài. */
export const CAPTURE_SUBJECTS = ['math', 'physics', 'chemistry', 'biology', 'programming'] as const
export const CAPTURE_THEMES = ['blue-sky', 'dark-blue', 'kid'] as const
export type CaptureTheme = (typeof CAPTURE_THEMES)[number]

export function parseCaptureOptions(args: readonly string[]) {
  const values = new Map<string, string>()
  const names = ['subject', 'out', 'only', 'viewports', 'themes']
  for (let i = 0; i < args.length; i += 2) {
    const name = args[i]?.replace(/^--/, '') ?? ''
    if (!args[i]?.startsWith('--') || !names.includes(name))
      throw new Error(`Tham số không được hỗ trợ: ${args[i]}`)
    const value = args[i + 1]
    if (!value?.trim() || value.startsWith('--')) throw new Error(`Thiếu giá trị --${name}.`)
    if (values.has(name)) throw new Error(`Tham số --${name} bị lặp.`)
    values.set(name, value)
  }
  const list = (name: string, fallback: string): string[] => {
    const parts = (values.get(name) ?? fallback).split(',').map((s) => s.trim())
    if (parts.some((s) => !s)) throw new Error(`Danh sách --${name} có phần tử rỗng.`)
    return [...new Set(parts)]
  }
  const subject = values.get('subject') ?? 'math'
  if (!CAPTURE_SUBJECTS.some((s) => s === subject))
    throw new Error(`Chưa hỗ trợ môn "${subject}" — dùng: ${CAPTURE_SUBJECTS.join(', ')}.`)
  const viewports = list('viewports', '760').map((value) => {
    const width = Number(value)
    if (!/^\d+$/.test(value) || !Number.isSafeInteger(width) || width <= 0)
      throw new Error(`Viewport không hợp lệ: "${value}"; cần số nguyên dương.`)
    return width
  })
  const themes = list('themes', 'blue-sky').map((value) => {
    const theme = CAPTURE_THEMES.find((t) => t === value)
    if (!theme) throw new Error(`Theme không hợp lệ: "${value}".`)
    return theme
  })
  const only = values.has('only') ? list('only', '') : []
  if (only.some((id) => !/^[a-zA-Z0-9_-]+$/.test(id)))
    throw new Error('ID bài trong --only chỉ được chứa chữ, số, dấu gạch ngang/gạch dưới.')
  return { subject, out: values.get('out'), only, viewports: [...new Set(viewports)], themes }
}

export function selectCaptureLessons<T extends { id: string }>(
  available: readonly T[],
  only: readonly string[],
): T[] {
  const missing = only.filter((id) => !available.some((lesson) => lesson.id === id))
  if (missing.length) throw new Error(`Không tìm thấy bài có hoạt họa: ${missing.join(', ')}.`)
  const selected = available.filter((lesson) => only.length === 0 || only.includes(lesson.id))
  if (!selected.length) throw new Error('Không có bài có hoạt họa để chụp.')
  return selected
}
