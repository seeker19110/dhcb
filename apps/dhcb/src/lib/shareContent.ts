// src/lib/shareContent.ts — Hàm THUẦN dựng nội dung (title + lines) cho ảnh "Chia sẻ kết quả"
// (ShareResultCard.tsx). Tách riêng khỏi phần vẽ canvas/DOM để dễ test — không đụng DOM/canvas
// ở đây, chỉ nhận dữ liệu đã có và trả về chuỗi hiển thị. Chịu được field thiếu/rỗng, không throw.

import type { EvaluationResult } from '../types'

// Làm tròn 1 chữ số thập phân cho điểm — tránh số lẻ dài khi hiển thị (vd 6.666666 → 6.7).
function round1(n: number): string {
  return (Math.round(n * 10) / 10).toString()
}

// Nội dung chia sẻ kết quả chấm điểm cuối phiên Chat (EvaluationResult).
// isA: true = giao diện tiếng Việt (chiều A), false = tiếng Anh (chiều B).
export function buildEvaluationShareContent(
  evaluation: EvaluationResult,
  isA: boolean,
): { title: string; lines: string[] } {
  const scores = evaluation?.scores
  const overall = typeof scores?.overall === 'number' ? scores.overall : 0

  const title = isA
    ? `Điểm hội thoại: ${round1(overall)}/9`
    : `Conversation score: ${round1(overall)}/9`

  const lines: string[] = []
  if (typeof scores?.fluency === 'number') {
    lines.push(`${isA ? 'Trôi chảy' : 'Fluency'}: ${round1(scores.fluency)}`)
  }
  if (typeof scores?.lexical === 'number') {
    lines.push(`${isA ? 'Từ vựng' : 'Lexical'}: ${round1(scores.lexical)}`)
  }
  if (typeof scores?.grammar === 'number') {
    lines.push(`${isA ? 'Ngữ pháp' : 'Grammar'}: ${round1(scores.grammar)}`)
  }
  // pronunciation chỉ có ở Speaking (có audio) — Chat không có, bỏ qua êm nếu thiếu.
  if (typeof scores?.pronunciation === 'number') {
    lines.push(`${isA ? 'Phát âm' : 'Pronunciation'}: ${round1(scores.pronunciation)}`)
  }

  return { title, lines }
}

// Nội dung chia sẻ tổng kết tuần Challenge — count = số ngày đã nộp trong tuần (0-7),
// firstWpm/lastWpm = nhịp nói đầu tuần → cuối tuần (có thể trùng nếu chỉ nộp 1 ngày).
export function buildChallengeShareContent(
  stats: { count: number; firstWpm: number; lastWpm: number } | null | undefined,
  isA: boolean,
): { title: string; lines: string[] } {
  const count = stats?.count ?? 0
  const firstWpm = stats?.firstWpm ?? 0
  const lastWpm = stats?.lastWpm ?? 0

  const title = isA ? `Tổng kết tuần: ${count}/7 ngày` : `Week recap: ${count}/7 days`

  const lines: string[] = []
  if (stats && (firstWpm > 0 || lastWpm > 0)) {
    lines.push(
      isA ? `Nhịp nói ${firstWpm} → ${lastWpm} từ/phút` : `Pace ${firstWpm} → ${lastWpm} words/min`,
    )
  }
  lines.push(isA ? 'Challenge nói 1 phút mỗi ngày' : 'The 1-minute daily speaking challenge')

  return { title, lines }
}

// Nội dung chia sẻ kết quả 1 bài kiểm tra/luyện nghe/chính tả trong lộ trình CEFR
// (tab Kiểm tra · Nghe · Từ khó ở StudyTabs.tsx) — score/total là số câu đúng/tổng số câu.
export function buildQuizShareContent(
  score: number,
  total: number,
  isA: boolean,
): { title: string; lines: string[] } {
  const pct = total > 0 ? Math.round((score / total) * 100) : 0
  const title = isA ? `Kết quả bài kiểm tra: ${score}/${total}` : `Quiz result: ${score}/${total}`
  const lines = [isA ? `Đạt ${pct}%` : `Scored ${pct}%`]
  return { title, lines }
}

// Nội dung chia sẻ tiến độ chung (streak + số từ đã học) — dùng cho nút chia sẻ ở nhiệm vụ
// "Chia sẻ công khai" (Quests), không gắn với 1 lượt chấm điểm cụ thể nào.
export function buildProgressShareContent(
  streak: number,
  learned: number,
  isA: boolean,
): { title: string; lines: string[] } {
  const title = isA ? `Chuỗi học ${streak} ngày liên tiếp 🔥` : `${streak}-day streak 🔥`
  const lines = [isA ? `Đã học ${learned} từ` : `${learned} words learned`]
  return { title, lines }
}
