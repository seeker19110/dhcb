// dialogueData.ts — Nạp hội thoại CEFR Ở PHÍA SERVER (1 lần, cache RAM) để chấm lại kiểm tra hiểu.
//
// Đặc tả: docs/specs/2026-10-09-hoi-thoai-cefr-server-cham-lai.md §③ "Nguồn dữ liệu".
//
// MỘT NGUỒN SỰ THẬT: đọc ĐÚNG file `apps/dhcb/public/data/dialogues.json` mà giao diện fetch
// (`/data/dialogues.json`) — không chép sang chỗ khác, không bundle bản thứ hai. Cùng cách làm với
// `dictionaryData.ts` (từ điển) và `_lib/cefrAssessment.ts` (bài thi cấp, đã đọc chính file này):
// repo được clone nguyên vẹn trên VPS và tiến trình server chạy với cwd = gốc repo ở cả ba môi
// trường (Vite dev, tsx, `node dist-server/server.js`), nên `process.cwd()` trỏ đúng; còn
// `import.meta.url` của file đã biên dịch thì trỏ vào `dist/` — SAI.
//
// File này dùng `node:fs` → CHỈ server/test import. Giao diện dùng `dialoguesLoader.ts` (fetch).

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { z } from 'zod'
import type { ComprehensionDialogue } from './dialogueComprehension.js'

/** Đường dẫn cố định tới dữ liệu hội thoại (tính từ gốc repo). */
export const DIALOGUES_JSON_PATH = join('apps', 'dhcb', 'public', 'data', 'dialogues.json')

const SpeakerSchema = z.object({ vi: z.string(), en: z.string() })
// Chỉ validate phần việc chấm cần; khoá thừa (giới tính giọng đọc…) Zod tự bỏ.
const DialoguesFileSchema = z.record(
  z.string(),
  z.array(
    z.object({
      titleEn: z.string(),
      speakerA: SpeakerSchema.optional(),
      speakerB: SpeakerSchema.optional(),
      lines: z.array(z.object({ who: z.enum(['A', 'B']), en: z.string(), vi: z.string() })),
    }),
  ),
)

let cache: Map<string, ComprehensionDialogue> | null = null

const cacheKey = (ownerId: string, titleEn: string) => `${ownerId}\u0000${titleEn}`

function load(root: string): Map<string, ComprehensionDialogue> {
  const raw: unknown = JSON.parse(readFileSync(join(root, DIALOGUES_JSON_PATH), 'utf8'))
  const data = DialoguesFileSchema.parse(raw)
  const map = new Map<string, ComprehensionDialogue>()
  for (const [ownerId, list] of Object.entries(data)) {
    for (const d of list) map.set(cacheKey(ownerId, d.titleEn), d)
  }
  return map
}

/**
 * Tra MỘT hội thoại theo (id unit/vòng, `titleEn`) — đúng khoá mà tiến độ dùng (`dialogueKey`).
 * Không có → `undefined`. File hỏng/thiếu → NÉM (lỗi triển khai, handler trả 500 chứ không chấm
 * bừa). Cache sau lần đọc đầu; dữ liệu đổi thì PM2 restart lúc deploy nạp lại.
 */
export function findCefrDialogue(
  ownerId: string,
  titleEn: string,
  root: string = process.cwd(),
): ComprehensionDialogue | undefined {
  cache ??= load(root)
  return cache.get(cacheKey(ownerId, titleEn))
}

/** CHỈ cho test: xoá cache để nạp lại từ đĩa. */
export function resetCefrDialogueCacheForTest(): void {
  cache = null
}
