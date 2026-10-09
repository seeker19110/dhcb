// Loader cho hội thoại mẫu — tải từ /public/data/dialogues.json bằng fetch().

export type { DialogueLine, Dialogue, SpeakerName } from './dialogues'
import type { Dialogue } from './dialogues'
import { z } from 'zod'

const speakerSchema = z.object({ vi: z.string(), en: z.string() })
const dialoguesSchema = z.record(
  z.string(),
  z.array(
    z.object({
      titleVi: z.string(),
      titleEn: z.string(),
      speakerA: speakerSchema.optional(),
      speakerB: speakerSchema.optional(),
      speakerAGender: z.enum(['female', 'male']).optional(),
      speakerBGender: z.enum(['female', 'male']).optional(),
      lines: z.array(z.object({ who: z.enum(['A', 'B']), en: z.string(), vi: z.string() })),
    }),
  ),
)

export const DIALOGUES_TIMEOUT_MS = 15_000

let _promise: Promise<Record<string, Dialogue[]>> | null = null

function loadDialogues(): Promise<Record<string, Dialogue[]>> {
  if (!_promise) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), DIALOGUES_TIMEOUT_MS)
    const pending = (async () => {
      try {
        const response = await fetch('/data/dialogues.json', { signal: controller.signal })
        if (!response.ok) throw new Error(`Dialogues HTTP ${response.status}`)
        return dialoguesSchema.parse(await response.json())
      } finally {
        clearTimeout(timeout)
      }
    })()
    _promise = pending
    void pending.catch(() => {
      if (_promise === pending) _promise = null
    })
  }
  return _promise
}

// Tương thích với code cũ dùng getDialogues(id).
export async function getDialogues(id: string): Promise<Dialogue[]> {
  const data = await loadDialogues()
  return data[id] ?? []
}

// Toàn bộ hội thoại kèm id (tiền tố a1-/a2-/b1-/b2-/…) — dùng cho trang Nghe (tab "Hội thoại")
// để nhóm theo cấp CEFR. Trả về map gốc, KHÔNG copy — không sửa trực tiếp giá trị trả về.
export async function getAllDialogues(): Promise<Record<string, Dialogue[]>> {
  return loadDialogues()
}

/**
 * `titleEn` các hội thoại của từng unit/vòng — để mục lục đếm đúng "đã học x/N" (đặc tả
 * docs/specs/2026-10-09-hoi-thoai-cefr-bang-chung-da-hoc.md). Id không có hội thoại → mảng rỗng.
 * Lỗi tải ném ra cho nơi gọi tự quyết (mục lục thì bỏ qua và không khẳng định "đã học hết").
 */
export async function getDialogueTitlesByUnit(
  ids: readonly string[],
): Promise<Map<string, string[]>> {
  const data = await loadDialogues()
  return new Map(ids.map((id) => [id, (data[id] ?? []).map((d) => d.titleEn)]))
}
