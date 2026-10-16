// packages/core-personal/memoryRetrieval.ts — Truy xuất ký ức LAI (chữ + nghĩa) với điểm 3 thành
// phần, GĐ2a (đặc tả docs/specs/2026-10-11-ban-dong-hanh-gd2a-tri-nho-truy-xuat.md, ADR-0015).
//
// Trước: contextEngine lấy "10 ký ức mới nhất" mỗi namespace — không theo câu đang hỏi. Nay:
//   1. Ứng viên = FTS (OR các token đã bỏ dấu, `ts_rank_cd`)
//              ∪ cosine (≤ MAX_SEMANTIC_CANDIDATES ký ức có vector, tính trong Node)
//              ∪ BASE_CANDIDATES ký ức quan trọng/dùng gần đây nhất (để "xin chào" vẫn có nền).
//   2. relevance = RRF(k = 60) của hai danh sách chữ/nghĩa, chuẩn hoá về [0, 1].
//   3. score = (recency + importance + relevance) / 3 — Generative Agents (arXiv 2304.03442):
//      recency = 0.995^giờ kể từ lần TRUY XUẤT gần nhất (chưa có thì lần tạo); importance/10.
//   4. Chọn top `limit`, rồi `touchMemoryAccess` cho đúng các ký ức đã vào prompt.
//
// Bất biến: không có provider embedding (hoặc Gemini lỗi) ⇒ vẫn ra kết quả từ chữ + importance.
// Mọi câu SQL đều lọc `person_id` — không có đường đọc chéo người.

import type { Pool, PoolClient } from 'pg'
import type { Sensitivity } from '@dhcb/core-contracts/personalFact'
import type { MemoryRecord } from '@dhcb/core-contracts/personalMemory'
import { cosineSimilarity, embedQuery, type EmbeddingProvider } from '@dhcb/core-ai/embeddings'
import { stripVietnameseDiacritics } from './vietnameseText.js'
import { rowToMemoryRecord, touchMemoryAccess, type MemoryRecordRow } from './memoryService.js'

type Runner = Pick<Pool | PoolClient, 'query'>

export const RRF_K = 60
export const RECENCY_DECAY_PER_HOUR = 0.995
export const MAX_SEMANTIC_CANDIDATES = 300
export const MAX_LEXICAL_CANDIDATES = 50
export const BASE_CANDIDATES = 20
export const MAX_QUERY_TOKENS = 24
const DEFAULT_LIMIT = 10
const SENSITIVITY_LEVELS: Sensitivity[] = ['public', 'personal', 'sensitive', 'restricted']

const MEMORY_COLUMNS =
  'id, person_id, namespace, content, provenance, sensitivity, status, merged_from_id, version, created_at, updated_at, retain_until, importance, last_accessed_at, access_count, valid_from, valid_to, superseded_by, source_message_id, (embedding is not null) as has_embedding'

export interface SearchMemoriesOptions {
  /** Câu người dùng vừa nói — nguồn cho cả tìm chữ lẫn tìm nghĩa. */
  query: string
  limit?: number
  maxSensitivity?: Sensitivity
  now?: Date
  /** Mặc định `getEmbeddingProvider()` (null khi không có key). Test truyền provider giả. */
  embeddingProvider?: EmbeddingProvider | null
  /** Tắt tìm nghĩa dù có provider (vd phiên tạm hoặc câu quá ngắn). */
  skipSemantic?: boolean
  /**
   * `false` = KHÔNG đánh dấu "vừa được dùng" (GĐ2b: bộ phản tỉnh nền tìm ký ức giống để so —
   * không phải Companion dùng ký ức để trả lời, nên không được đẩy recency). Mặc định `true`.
   */
  touch?: boolean
}

export interface ScoredMemory {
  record: MemoryRecord
  score: number
  recency: number
  importance: number
  relevance: number
}

/**
 * Token cho `to_tsquery('simple', …)`: bỏ dấu, chữ thường, chỉ giữ [a-z0-9], ≥ 2 ký tự, nối OR.
 * Trả `null` khi không còn token nào (câu chỉ có dấu/emoji) — nơi gọi bỏ nhánh chữ.
 * Chỉ [a-z0-9] lọt qua nên chuỗi tsquery không thể chứa toán tử lạ (an toàn với to_tsquery).
 */
export function buildLexicalQuery(text: string): string | null {
  const seen = new Set<string>()
  for (const raw of stripVietnameseDiacritics(text.toLowerCase()).split(/[^a-z0-9]+/)) {
    if (raw.length < 2 || seen.has(raw)) continue
    seen.add(raw)
    if (seen.size >= MAX_QUERY_TOKENS) break
  }
  return seen.size > 0 ? [...seen].join(' | ') : null
}

/** Danh sách đã xếp hạng → điểm RRF theo id; k = 60 theo Cormack et al. (2009). */
export function reciprocalRankFusion(
  rankedLists: ReadonlyArray<ReadonlyArray<string>>,
  k = RRF_K,
): Map<string, number> {
  const scores = new Map<string, number>()
  for (const list of rankedLists) {
    list.forEach((id, index) => {
      scores.set(id, (scores.get(id) ?? 0) + 1 / (k + index + 1))
    })
  }
  return scores
}

/** 0.995^giờ — 1 lúc vừa dùng, ≈ 0.89 sau một ngày, ≈ 0.43 sau một tuần. */
export function recencyScore(lastUsedAt: Date, now: Date): number {
  const hours = Math.max(0, (now.getTime() - lastUsedAt.getTime()) / 3_600_000)
  return Math.pow(RECENCY_DECAY_PER_HOUR, hours)
}

function allowedSensitivities(max: Sensitivity): Sensitivity[] {
  return SENSITIVITY_LEVELS.slice(0, SENSITIVITY_LEVELS.indexOf(max) + 1)
}

async function lexicalCandidates(
  runner: Runner,
  personId: string,
  tsquery: string,
  sensitivities: Sensitivity[],
): Promise<string[]> {
  const { rows } = await runner.query<{ id: string }>(
    `select id
     from personal.memory_records
     where person_id = $1 and status <> 'expired' and valid_to is null
       and sensitivity = any($3::text[])
       and search_tsv @@ to_tsquery('simple', $2)
     order by ts_rank_cd(search_tsv, to_tsquery('simple', $2)) desc, importance desc
     limit ${MAX_LEXICAL_CANDIDATES}`,
    [personId, tsquery, sensitivities],
  )
  return rows.map((r) => r.id)
}

async function semanticCandidates(
  runner: Runner,
  personId: string,
  queryVector: number[],
  sensitivities: Sensitivity[],
): Promise<string[]> {
  const { rows } = await runner.query<{ id: string; embedding: number[] | null }>(
    `select id, embedding
     from personal.memory_records
     where person_id = $1 and status <> 'expired' and valid_to is null
       and embedding is not null and sensitivity = any($2::text[])
     order by last_accessed_at desc nulls last, importance desc, created_at desc
     limit ${MAX_SEMANTIC_CANDIDATES}`,
    [personId, sensitivities],
  )
  return rows
    .map((r) => ({ id: r.id, sim: r.embedding ? cosineSimilarity(queryVector, r.embedding) : 0 }))
    .filter((r) => r.sim > 0)
    .sort((a, b) => b.sim - a.sim)
    .map((r) => r.id)
}

/**
 * Tìm ký ức cho một lượt Companion. Luôn trả kết quả (có thể rỗng khi người đó chưa có ký ức),
 * không bao giờ ném vì embedding — nhánh nghĩa hỏng thì bỏ qua.
 */
export async function searchMemories(
  runner: Runner,
  personId: string,
  options: SearchMemoriesOptions,
): Promise<ScoredMemory[]> {
  const now = options.now ?? new Date()
  const limit = Math.min(Math.max(options.limit ?? DEFAULT_LIMIT, 1), 50)
  const sensitivities = allowedSensitivities(options.maxSensitivity ?? 'personal')

  const tsquery = buildLexicalQuery(options.query)
  const lexical = tsquery ? await lexicalCandidates(runner, personId, tsquery, sensitivities) : []

  let semantic: string[] = []
  // `embeddingProvider: undefined` = dùng mặc định (process.env); `null` = cố ý tắt.
  if (!options.skipSemantic && options.query.trim() && options.embeddingProvider !== null) {
    let vector: number[] | null = null
    try {
      vector =
        options.embeddingProvider === undefined
          ? await embedQuery(options.query)
          : await embedQuery(options.query, options.embeddingProvider)
    } catch {
      // Provider lỗi vẫn giữ nhánh chữ/nền; lỗi SQL bên dưới phải tiếp tục được báo.
    }
    if (vector) semantic = await semanticCandidates(runner, personId, vector, sensitivities)
  }

  // Nền: ký ức quan trọng / dùng gần đây — có mặt dù câu hỏi không khớp chữ lẫn nghĩa.
  const { rows: baseRows } = await runner.query<MemoryRecordRow>(
    `select ${MEMORY_COLUMNS}
     from personal.memory_records
     where person_id = $1 and status <> 'expired' and valid_to is null
       and sensitivity = any($2::text[])
     order by importance desc, last_accessed_at desc nulls last, created_at desc
     limit ${BASE_CANDIDATES}`,
    [personId, sensitivities],
  )

  const rowsById = new Map<string, MemoryRecordRow>(baseRows.map((r) => [r.id, r]))
  const missing = [...new Set([...lexical, ...semantic])].filter((id) => !rowsById.has(id))
  if (missing.length > 0) {
    const { rows } = await runner.query<MemoryRecordRow>(
      `select ${MEMORY_COLUMNS}
       from personal.memory_records
       where person_id = $1 and id = any($2::uuid[])
         and status <> 'expired' and valid_to is null
         and sensitivity = any($3::text[])`,
      [personId, missing, sensitivities],
    )
    for (const row of rows) rowsById.set(row.id, row)
  }
  if (rowsById.size === 0) return []

  const rrf = reciprocalRankFusion([lexical, semantic])
  const maxRrf = Math.max(0, ...rrf.values())

  const scored: ScoredMemory[] = []
  for (const row of rowsById.values()) {
    const record = rowToMemoryRecord(row)
    const recency = recencyScore(row.last_accessed_at ?? row.created_at, now)
    const importance = row.importance / 10
    const relevance = maxRrf > 0 ? (rrf.get(row.id) ?? 0) / maxRrf : 0
    scored.push({
      record,
      recency,
      importance,
      relevance,
      score: (recency + importance + relevance) / 3,
    })
  }
  scored.sort((a, b) => b.score - a.score || a.record.id.localeCompare(b.record.id))
  const chosen = scored.slice(0, limit)

  if (options.touch === false) return chosen
  // Đánh dấu đã dùng — nếu lỗi (CSDL bận) vẫn trả kết quả, lượt thoại không được chết vì tín
  // hiệu phụ.
  try {
    await touchMemoryAccess(
      runner,
      personId,
      chosen.map((s) => s.record.id),
    )
  } catch {
    // bỏ qua: last_accessed_at chỉ là tín hiệu xếp hạng
  }
  return chosen
}
