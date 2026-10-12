// packages/core-contracts/actionCanvas.ts — Hợp đồng Không gian làm việc Tương tác & Sơ đồ Tư duy Đa miền V4.2.
import { z } from 'zod'
import { IsoDateTimeSchema, UuidSchema } from './shared.js'
import {
  PILLAR_DOMAINS,
  PILLAR_DOMAIN_LABELS,
  PillarDomainSchema,
  type PillarDomain,
} from './pillarDomain.js'

export const ACTION_CANVAS_VERSION = 'v4.2.0'

export const CanvasNodeTypeSchema = z.enum([
  'goal',
  'task',
  'note',
  'code',
  'mindmap_node',
  'decision_bridge',
  'metric',
])

export type CanvasNodeType = z.infer<typeof CanvasNodeTypeSchema>

// Miền của một nút: hai trụ còn thật (Learning, Ghi chú = `work`) + `general`. Canvas người dùng
// LƯU từ trước vẫn có thể chứa trụ đã xoá (career/startup/life) — đổi về `general` khi đọc, không
// từ chối (changelog 0485). Nguồn chung: `pillarDomain.ts` (changelog 0628).
export const CANVAS_DOMAINS = PILLAR_DOMAINS
export const CanvasDomainSchema = PillarDomainSchema
export type CanvasDomain = PillarDomain

export const CanvasNodeStatusSchema = z.enum(['draft', 'in_progress', 'blocked', 'completed'])

export type CanvasNodeStatus = z.infer<typeof CanvasNodeStatusSchema>

// [2026-10-05, audit M11, đợt U5] Nhãn HIỂN THỊ tiếng Việt cho mã enum — dùng chung cho thẻ trên
// canvas và bản xuất Markdown, để người dùng không thấy mã thô ("in progress", "LEARNING", "You").
export const CANVAS_DOMAIN_LABELS: Record<CanvasDomain, string> = PILLAR_DOMAIN_LABELS

export const CANVAS_STATUS_LABELS: Record<CanvasNodeStatus, string> = {
  draft: 'Bản nháp',
  in_progress: 'Đang làm',
  blocked: 'Đang vướng',
  completed: 'Đã xong',
}

export const CANVAS_ASSIGNEE_LABELS: Record<'user' | 'companion_ai', string> = {
  user: 'Bạn',
  companion_ai: 'Bạn Đồng Hành',
}

export const CanvasNodeSchema = z
  .object({
    id: UuidSchema,
    type: CanvasNodeTypeSchema,
    title: z.string().min(1).max(200),
    content: z.string().max(2000).default(''),
    domain: CanvasDomainSchema,
    x: z.number(),
    y: z.number(),
    width: z.number().positive().default(220),
    height: z.number().positive().default(120),
    color: z.string().default('#00f0ff'),
    status: CanvasNodeStatusSchema.default('in_progress'),
    tags: z.array(z.string()).default([]),
    assignedTo: z.enum(['user', 'companion_ai']).default('user'),
    createdAt: IsoDateTimeSchema,
    updatedAt: IsoDateTimeSchema,
  })
  .strict()

export type CanvasNode = z.infer<typeof CanvasNodeSchema>

export const CanvasEdgeRelationshipSchema = z.enum([
  'requires',
  'contributes_to',
  'blocks',
  'relates_to',
])

export type CanvasEdgeRelationship = z.infer<typeof CanvasEdgeRelationshipSchema>

export const CanvasEdgeSchema = z
  .object({
    id: UuidSchema,
    sourceNodeId: UuidSchema,
    targetNodeId: UuidSchema,
    relationship: CanvasEdgeRelationshipSchema.default('contributes_to'),
    label: z.string().max(100).optional(),
    color: z.string().optional(),
  })
  .strict()

export type CanvasEdge = z.infer<typeof CanvasEdgeSchema>

export const CanvasViewportSchema = z
  .object({
    zoom: z.number().min(0.2).max(3.0).default(1.0),
    panX: z.number().default(0),
    panY: z.number().default(0),
  })
  .strict()

export type CanvasViewport = z.infer<typeof CanvasViewportSchema>

export const ActionCanvasStateSchema = z
  .object({
    canvasId: UuidSchema,
    personId: UuidSchema,
    title: z.string().min(1).max(200),
    nodes: z.array(CanvasNodeSchema).default([]),
    edges: z.array(CanvasEdgeSchema).default([]),
    viewport: CanvasViewportSchema.default({ zoom: 1.0, panX: 0, panY: 0 }),
    lastEditedBy: z.enum(['user', 'companion_ai']).default('user'),
    schemaVersion: z.literal(ACTION_CANVAS_VERSION).default(ACTION_CANVAS_VERSION),
    createdAt: IsoDateTimeSchema,
    updatedAt: IsoDateTimeSchema,
  })
  .strict()

export type ActionCanvasState = z.infer<typeof ActionCanvasStateSchema>

export const CanvasExportFormatSchema = z.enum([
  'markdown',
  'pdf',
  'notion',
  'google_calendar',
  'json',
])

export type CanvasExportFormat = z.infer<typeof CanvasExportFormatSchema>
