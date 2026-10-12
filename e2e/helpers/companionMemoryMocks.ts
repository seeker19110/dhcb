// e2e/helpers/companionMemoryMocks.ts — Giả lập API trang "Bạn Đồng Hành nhớ gì về tôi" với dữ liệu
// chạm MỌI mục GĐ2b (gợi ý chờ duyệt · khối ghi nhớ cố định · thông tin cũ đã được thay · tóm tắt).
// Dùng chung cho cổng a11y `e2e/a11y-companion-memory.spec.ts` và ảnh chụp Tầng 8b.
import type { Page } from '@playwright/test'

export const COMPANION_MEMORY_PAGE = '/ban-dong-hanh/ky-uc'
const PERSON = '11111111-1111-4111-8111-111111111111'

function record(id: string, content: string, extra: Record<string, unknown> = {}) {
  return {
    id,
    personId: PERSON,
    namespace: 'semantic',
    content,
    provenance: 'companion:reflection',
    sensitivity: 'personal',
    status: 'accepted',
    createdAt: '2026-10-01T00:00:00.000Z',
    version: 1,
    importance: 6,
    validFrom: '2026-10-01T00:00:00.000Z',
    hasEmbedding: true,
    schemaVersion: 2,
    ...extra,
  }
}

const NEW_ID = '22222222-2222-4222-8222-222222222222'
const OLD_ID = '33333333-3333-4333-8333-333333333333'

/** Giả lập đủ bốn API trang đọc — dữ liệu chạm MỌI mục mới của GĐ2b. */
export async function mockMemoryPageApi(page: Page): Promise<void> {
  await page.route('**/api/companion-memory', (route) =>
    route.fulfill({
      json: {
        settings: { rememberMemories: true, useHistory: true, suggestMemories: true },
        coreBlocks: [
          {
            label: 'about_me',
            content: 'Học sinh lớp 10, thích vẽ, muốn được giải thích ngắn gọn.',
            version: 2,
            updatedAt: '2026-10-10T00:00:00.000Z',
          },
          { label: 'current_focus', content: '', version: 0 },
        ],
        summaries: [
          {
            domain: 'learning',
            summary: 'Hai buổi gần đây bàn về ôn IELTS phần Nghe và cách ghi chú từ mới.',
            updatedAt: '2026-10-11T00:00:00.000Z',
          },
        ],
      },
    }),
  )
  await page.route('**/api/memories', (route) =>
    route.fulfill({
      json: {
        records: [
          record(NEW_ID, 'Mục tiêu IELTS 7.0 vào tháng 12', {
            createdAt: '2026-10-11T00:00:00.000Z',
          }),
          record(OLD_ID, 'Mục tiêu IELTS 6.5', {
            validTo: '2026-10-11T00:00:00.000Z',
            supersededBy: NEW_ID,
          }),
        ],
      },
    }),
  )
  await page.route('**/api/proposed-actions?status=pending', (route) =>
    route.fulfill({
      json: {
        actions: [
          {
            id: '44444444-4444-4444-8444-444444444444',
            capabilityId: 'memory.create_record',
            status: 'pending',
            payload: { content: 'Thích học buổi sáng trước giờ đi học' },
            createdAt: '2026-10-12T00:00:00.000Z',
          },
          {
            id: '55555555-5555-4555-8555-555555555555',
            capabilityId: 'memory.invalidate_record',
            status: 'pending',
            payload: { previousContent: 'Học buổi tối sau 22 giờ' },
            createdAt: '2026-10-12T00:00:00.000Z',
          },
        ],
      },
    }),
  )
}
