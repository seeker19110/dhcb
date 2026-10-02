// packages/core-contracts/actionCanvas.test.ts
import { describe, it, expect } from 'vitest'
import {
  ACTION_CANVAS_VERSION,
  CanvasNodeTypeSchema,
  CanvasNodeSchema,
  CanvasEdgeSchema,
  ActionCanvasStateSchema,
  CanvasExportFormatSchema,
  CanvasDomainSchema,
} from './actionCanvas.js'

describe('Action Canvas Contract (V4.2)', () => {
  it('validates node types and domains', () => {
    expect(CanvasNodeTypeSchema.parse('goal')).toBe('goal')
    expect(CanvasNodeTypeSchema.parse('mindmap_node')).toBe('mindmap_node')
    expect(() => CanvasNodeTypeSchema.parse('invalid_type')).toThrow()
  })

  // Changelog 0485: miền của trụ đã xoá đổi về `general` khi đọc (canvas lưu từ trước vẫn hợp lệ),
  // giá trị lạ khác vẫn bị từ chối.
  it('CanvasDomainSchema: learning/work/general giữ nguyên, career/startup/life → general', () => {
    expect(CanvasDomainSchema.parse('learning')).toBe('learning')
    expect(CanvasDomainSchema.parse('work')).toBe('work')
    expect(CanvasDomainSchema.parse('general')).toBe('general')
    for (const legacy of ['career', 'startup', 'life']) {
      expect(CanvasDomainSchema.parse(legacy)).toBe('general')
    }
    expect(() => CanvasDomainSchema.parse('finance')).toThrow()
  })

  it('validates a complete CanvasNode', () => {
    const validNode = {
      id: '11111111-1111-4111-8111-111111111111',
      type: 'goal',
      title: 'Đạt IELTS 7.5',
      content: 'Luyện 40 từ vựng và 2 bài viết mỗi tuần',
      domain: 'learning',
      x: 100,
      y: 200,
      width: 240,
      height: 140,
      color: '#38bdf8',
      status: 'in_progress',
      tags: ['ielts', 'speaking'],
      assignedTo: 'user',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const parsed = CanvasNodeSchema.parse(validNode)
    expect(parsed.title).toBe('Đạt IELTS 7.5')
    expect(parsed.domain).toBe('learning')
    expect(parsed.status).toBe('in_progress')
  })

  it('validates CanvasEdgeSchema connections', () => {
    const validEdge = {
      id: '22222222-2222-4222-8222-222222222222',
      sourceNodeId: '11111111-1111-4111-8111-111111111111',
      targetNodeId: '33333333-3333-4333-8333-333333333333',
      relationship: 'contributes_to',
      label: 'Hỗ trợ phỏng vấn',
    }

    const parsed = CanvasEdgeSchema.parse(validEdge)
    expect(parsed.relationship).toBe('contributes_to')
    expect(parsed.label).toBe('Hỗ trợ phỏng vấn')
  })

  it('validates full ActionCanvasStateSchema', () => {
    const validCanvas = {
      canvasId: '44444444-4444-4444-8444-444444444444',
      personId: '11111111-1111-4111-8111-111111111111',
      title: 'Lộ trình Chuyển đổi Nghề nghiệp & Tiếng Anh 2026',
      nodes: [],
      edges: [],
      viewport: { zoom: 1.0, panX: 50, panY: -20 },
      lastEditedBy: 'companion_ai',
      schemaVersion: ACTION_CANVAS_VERSION,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const parsed = ActionCanvasStateSchema.parse(validCanvas)
    expect(parsed.schemaVersion).toBe('v4.2.0')
    expect(parsed.lastEditedBy).toBe('companion_ai')
  })

  it('validates export formats', () => {
    expect(CanvasExportFormatSchema.parse('markdown')).toBe('markdown')
    expect(CanvasExportFormatSchema.parse('notion')).toBe('notion')
    expect(CanvasExportFormatSchema.parse('google_calendar')).toBe('google_calendar')
  })
})
