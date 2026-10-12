import { describe, it, expect } from 'vitest'
import { MemoryRecordSchema, PERSONAL_MEMORY_SCHEMA_VERSION } from './personalMemory.js'

const validRecord = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  personId: '123e4567-e89b-12d3-a456-426614174001',
  namespace: 'preference',
  content: 'Thích học vào buổi tối sau 20h',
  provenance: 'chat:msg-42',
  sensitivity: 'personal',
  status: 'accepted',
  createdAt: '2026-08-16T00:00:00Z',
  // v2 (GĐ2a): version + điểm truy xuất + hai trục thời gian + cờ vector.
  version: 1,
  importance: 5,
  validFrom: '2026-08-16T00:00:00Z',
  hasEmbedding: false,
  schemaVersion: PERSONAL_MEMORY_SCHEMA_VERSION,
}

describe('MemoryRecordSchema', () => {
  it('payload hợp lệ tối thiểu → parse thành công', () => {
    expect(MemoryRecordSchema.parse(validRecord)).toEqual(validRecord)
  })

  it('status=merged kèm mergedFromId → parse thành công', () => {
    const merged = {
      ...validRecord,
      status: 'merged',
      mergedFromId: '123e4567-e89b-12d3-a456-426614174002',
    }
    expect(MemoryRecordSchema.parse(merged)).toEqual(merged)
  })

  it('có retainUntil → parse thành công', () => {
    const withRetention = { ...validRecord, retainUntil: '2027-08-16T00:00:00Z' }
    expect(MemoryRecordSchema.parse(withRetention)).toEqual(withRetention)
  })

  it('namespace ngoài 5 giá trị hợp lệ → từ chối', () => {
    expect(() => MemoryRecordSchema.parse({ ...validRecord, namespace: 'working' })).toThrow()
  })

  it('status ngoài 3 giá trị hợp lệ → từ chối', () => {
    expect(() => MemoryRecordSchema.parse({ ...validRecord, status: 'rejected' })).toThrow()
  })

  it('content rỗng → từ chối', () => {
    expect(() => MemoryRecordSchema.parse({ ...validRecord, content: '' })).toThrow()
  })

  it('field lạ (vd learnerId của v1 Memory) → từ chối', () => {
    expect(() =>
      MemoryRecordSchema.parse({
        ...validRecord,
        learnerId: '123e4567-e89b-12d3-a456-426614174003',
      }),
    ).toThrow()
  })

  it('v2: importance ngoài 1–10 hoặc thiếu version → từ chối; có lastAccessedAt/validTo/supersededBy → nhận', () => {
    expect(() => MemoryRecordSchema.parse({ ...validRecord, importance: 11 })).toThrow()
    expect(() => MemoryRecordSchema.parse({ ...validRecord, importance: 0 })).toThrow()
    const noVersion: Record<string, unknown> = { ...validRecord }
    delete noVersion.version
    expect(() => MemoryRecordSchema.parse(noVersion)).toThrow()
    const full = {
      ...validRecord,
      lastAccessedAt: '2026-10-11T10:00:00Z',
      validTo: '2026-10-12T00:00:00Z',
      supersededBy: '123e4567-e89b-12d3-a456-426614174009',
      sourceMessageId: '123e4567-e89b-12d3-a456-426614174010',
      hasEmbedding: true,
    }
    expect(MemoryRecordSchema.parse(full)).toEqual(full)
  })

  it('schemaVersion cũ (1) → từ chối: nơi đọc phải nâng cấp cùng contract', () => {
    expect(() => MemoryRecordSchema.parse({ ...validRecord, schemaVersion: 1 })).toThrow()
  })
})
