// scripts/lib/sqlAllowlist.ts — Danh sách ngoại lệ TƯỜNG MINH của cổng `check:sql`.
//
// File dữ liệu: scripts/sql-prepare-allowlist.json. Mỗi mục là một câu SQL ĐƯỢC PHÉP không
// PREPARE được, kèm lý do bắt buộc (DDL cố ý, câu đang được sửa ở PR khác…). So khớp theo
// (file, đoạn SQL) chứ KHÔNG theo số dòng — số dòng xê dịch mỗi lần ai sửa file, khiến allowlist
// hoặc gãy vô cớ, hoặc tệ hơn là trỏ nhầm sang câu khác.
//
// Dữ liệu ngoài (file JSON) → validate bằng Zod lúc chạy (CLAUDE.md mục 4.1).

import { z } from 'zod'
import { normalizeSql } from './sqlExtract.js'

export const AllowlistEntrySchema = z.object({
  /** Đường dẫn file tương đối gốc repo, dấu `/`. */
  file: z.string().min(1),
  /** Một đoạn của câu SQL (so khớp sau khi gộp khoảng trắng) — đủ dài để chỉ khớp đúng câu đó. */
  sqlIncludes: z.string().min(8),
  /** Vì sao câu này được miễn — bắt buộc, không để trống. */
  reason: z.string().min(10),
})

export const AllowlistSchema = z.object({
  entries: z.array(AllowlistEntrySchema),
})

export type AllowlistEntry = z.infer<typeof AllowlistEntrySchema>

export function parseAllowlist(raw: unknown): AllowlistEntry[] {
  return AllowlistSchema.parse(raw).entries
}

/** Mục allowlist khớp câu SQL ở `file` (hoặc `undefined`). */
export function findAllowlistEntry(
  entries: readonly AllowlistEntry[],
  file: string,
  sql: string,
): AllowlistEntry | undefined {
  const flat = normalizeSql(sql)
  return entries.find((e) => e.file === file && flat.includes(normalizeSql(e.sqlIncludes)))
}
