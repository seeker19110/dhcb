// e2e/helpers/companionCardsMock.ts — "Thẻ hôm nay" giả cho E2E (GĐ4a, changelog 0629).
//
// Đủ mọi biến thể giao diện để cổng a11y quét nội dung thật, không chỉ khối lỗi: thẻ đang mở,
// thẻ "Đã xong", thẻ đã bấm 👎 (hiện câu xác nhận). PARSE qua đúng hợp đồng Zod của server — lệch
// hợp đồng thì mock gãy ngay, không lặng lẽ quét một hình dạng app không bao giờ nhận.
import {
  CompanionDailyCardsResponseSchema,
  type CompanionDailyCardsResponse,
} from '../../packages/core-contracts/companionDailyCards'

export const MOCK_COMPANION_CARDS: CompanionDailyCardsResponse =
  CompanionDailyCardsResponseSchema.parse({
    day: '2026-10-12',
    cards: [
      {
        id: '0d1f0000-0000-4000-8000-000000000001',
        kind: 'review_due',
        title: 'Ôn thẻ đến hạn',
        body: 'Có 12 thẻ đã đến hạn ôn hôm nay.',
        route: '/goc-hoc-tap/on-tap',
        actionLabel: 'Ôn ngay',
        status: 'open',
        feedback: null,
      },
      {
        id: '0d1f0000-0000-4000-8000-000000000002',
        kind: 'due_tasks',
        title: 'Việc đến hạn trong Ghi chú',
        body: 'Không còn việc nào đến hạn hôm nay.',
        route: '/ghi-chu',
        actionLabel: 'Mở Ghi chú',
        status: 'done',
        feedback: 'up',
      },
      {
        id: '0d1f0000-0000-4000-8000-000000000003',
        kind: 'learning_goal',
        title: 'Mục tiêu học của bạn',
        body: '«Luyện IELTS» — hôm nay dành khoảng 20 phút nhé.',
        route: '/goc-hoc-tap',
        actionLabel: 'Chọn bài học',
        status: 'open',
        feedback: 'down',
      },
    ],
  })
