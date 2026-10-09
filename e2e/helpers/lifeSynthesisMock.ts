// Mock `GET /api/life-synthesis` ("30 ngày qua của bạn", changelog 0550) — PARSE qua đúng hợp
// đồng Zod strict của server, nên lệch hợp đồng là lỗi ngay lúc nạp file test (như MOCK_APP_SETTINGS).
//
// Bộ dữ liệu cố ý phủ MỌI phần của khối (danh sách môn, nhận xét hai trụ, ba khuyến nghị) để các
// cổng a11y AA/AAA quét studio "Kế hoạch" đo được toàn bộ nội dung, không chỉ khung chờ/khối lỗi.
import {
  LifeSynthesisReportSchema,
  type LifeSynthesisReport,
} from '../../packages/core-contracts/lifeSynthesis'

export const MOCK_LIFE_SYNTHESIS: LifeSynthesisReport = LifeSynthesisReportSchema.parse({
  schemaVersion: 2,
  generatedAt: '2026-10-09T03:00:00.000Z',
  windowDays: 30,
  windowStart: '2026-09-10',
  windowEnd: '2026-10-09',
  learning: {
    activeDays: 9,
    streakDays: 3,
    lastActiveDate: '2026-10-09',
    subjects: [
      {
        subjectId: 'english',
        label: 'Tiếng Anh',
        activeDays: 7,
        lastActiveDate: '2026-10-09',
        streakDays: 3,
        completions: null,
      },
      {
        subjectId: 'programming',
        label: 'Lập trình',
        activeDays: 3,
        lastActiveDate: '2026-09-29',
        streakDays: 0,
        completions: 4,
      },
    ],
  },
  notes: {
    totalTasks: 8,
    openTasks: 5,
    overdueTasks: 2,
    dueSoonTasks: 1,
    undatedOpenTasks: 3,
    blockedTasks: 0,
    totalNotes: 4,
    notesCreated: 2,
  },
  observations: [
    {
      ruleId: 'learning.subject_streak',
      domain: 'learning',
      text: 'Có học Tiếng Anh 3 ngày liên tiếp, tính tới hôm nay.',
    },
    {
      ruleId: 'learning.completions',
      domain: 'learning',
      text: 'Hoàn thành 4 bài Lập trình trong 30 ngày qua.',
    },
    {
      ruleId: 'learning.lapsed',
      domain: 'learning',
      text: 'Đã 10 ngày chưa quay lại Lập trình (lần gần nhất 29/09).',
    },
    { ruleId: 'notes.overdue', domain: 'notes', text: '2 việc đã quá hạn.' },
    {
      ruleId: 'notes.due_soon',
      domain: 'notes',
      text: '1 việc đến hạn trong 7 ngày tới (tính cả hôm nay).',
    },
    { ruleId: 'notes.undated', domain: 'notes', text: '3 việc đang mở chưa có hạn.' },
    { ruleId: 'notes.created', domain: 'notes', text: '2 ghi chú mới trong 30 ngày qua.' },
  ],
  recommendations: [
    {
      ruleId: 'rec.notes_overdue',
      domain: 'notes',
      text: 'Xem lại 2 việc quá hạn: làm tiếp, dời hạn hoặc đánh dấu xong.',
      actionLabel: 'Mở Ghi chú',
      target: { kind: 'notes' },
    },
    {
      ruleId: 'rec.learning_resume',
      domain: 'learning',
      text: 'Quay lại Lập trình với một bài ngắn.',
      actionLabel: 'Mở Lập trình',
      target: { kind: 'subject', subjectId: 'programming' },
    },
  ],
})
