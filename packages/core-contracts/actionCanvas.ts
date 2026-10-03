// packages/core-contracts/actionCanvas.ts — Hợp đồng Không gian làm việc Tương tác & Sơ đồ Tư duy Đa miền V4.2.
import { z } from 'zod'
import { IsoDateTimeSchema, UuidSchema } from './shared.js'

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

// Miền của một nút: hai trụ còn thật (Learning, Ghi chú = `work`) + `general`. Ba trụ Career ·
// Startup · Life đã gỡ 2026-09-20 — canvas người dùng LƯU từ trước vẫn có thể chứa ba giá trị đó,
// nên chúng được đổi về `general` khi đọc thay vì bị từ chối (lưu lại canvas cũ không lỗi 400).
// Changelog 0485.
export const CANVAS_DOMAINS = ['learning', 'work', 'general'] as const
const LEGACY_CANVAS_DOMAINS = new Set(['career', 'startup', 'life'])

export const CanvasDomainSchema = z.preprocess(
  (value) => (typeof value === 'string' && LEGACY_CANVAS_DOMAINS.has(value) ? 'general' : value),
  z.enum(CANVAS_DOMAINS),
)

export type CanvasDomain = z.infer<typeof CanvasDomainSchema>

export const CanvasNodeStatusSchema = z.enum(['draft', 'in_progress', 'blocked', 'completed'])

export type CanvasNodeStatus = z.infer<typeof CanvasNodeStatusSchema>

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
