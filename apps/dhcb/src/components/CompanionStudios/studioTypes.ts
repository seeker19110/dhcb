import {
  Sparkles,
  GraduationCap,
  FolderKanban,
  MessageSquare,
  Brain,
  Swords,
  Target,
} from 'lucide-react'
import type { ProposedAction } from '@dhcb/core-contracts/proposedAction'
import type { ContextPackage } from '@dhcb/core-contracts/contextPackage'
import type { InteractiveQuestion } from '@dhcb/core-contracts/interactiveQuestion'

// Studio "Tổng kết" ('synthesis') đã GỠ 2026-10-02 (changelog 0475): bảng "phân tích cuộc sống"
// của nó hiển thị điểm BỊA cho mọi người dùng. Thẻ Agent và banner Action Canvas dời sang "Kế
// hoạch". Bật lại khi có nguồn dữ liệu hoạt động thật — xem nợ trong PROGRESS.md.
export type StudioTab = 'dialogue' | 'cognitive' | 'labs' | 'proactive'

// Trạng thái chế độ giọng nói của Companion — pipeline STT → LLM → TTS (KHÔNG streaming
// audio "live"): ghi âm xong mới gửi nhận diện, gửi AI, rồi đọc câu trả lời.
export type CompanionVoiceState = 'idle' | 'recording' | 'transcribing' | 'thinking' | 'speaking'

export interface ChatMessage {
  id: string
  sender: 'user' | 'companion'
  text: string
  timestamp: string
  intent?: string
  domain?: string
  contextPackage?: ContextPackage
  proposedActions?: ProposedAction[]
  // Câu hỏi tick chọn kèm tin nhắn của Companion (nếu lượt đó có hỏi).
  interactiveQuestions?: InteractiveQuestion[]
}

// [2026-09-22] Chỉ còn HAI trụ thật: Học tập (`learning`) và Ghi chú (`work`). Ba trụ
// Sự nghiệp · Khởi nghiệp · Đời sống đã gỡ hẳn cả route API lẫn bảng CSDL (migration 0085,
// CLAUDE.md mục 6) — giữ chip ở đây là hứa thứ hệ thống không còn làm (audit UI/UX 2026-09-22
// P0-1). Test `studioTypes.test.ts` canh không cho chúng quay lại.
export const DOMAIN_OPTIONS = [
  { id: 'all', label: 'Tự động', icon: Sparkles, color: 'text-amber-400 bg-amber-400/10' },
  { id: 'learning', label: 'Học tập', icon: GraduationCap, color: 'text-blue-400 bg-blue-400/10' },
  {
    id: 'work',
    label: 'Ghi chú',
    icon: FolderKanban,
    color: 'text-emerald-400 bg-emerald-400/10',
  },
]

// Gợi ý nhanh chỉ nhắm việc THẬT của hai trụ còn lại — không mời chào lĩnh vực đã gỡ.
export const QUICK_PROMPTS = [
  {
    label: '⏱️ Hôm nay học gì trong 10 phút?',
    domain: 'learning',
    text: 'Tôi có 10 phút. Dựa trên tiến độ của tôi, hôm nay nên học gì trước?',
  },
  {
    label: '🎯 Đặt mục tiêu IELTS 7.0',
    domain: 'learning',
    text: 'Tôi muốn đặt mục tiêu học IELTS đạt 7.0 trong 6 tháng tới.',
  },
  {
    label: '🧭 Chọn hướng lập trình phù hợp',
    domain: 'learning',
    text: 'Tôi mới học lập trình xong bậc P1. Hãy giúp tôi chọn hướng chuyên sâu phù hợp.',
  },
  {
    label: '📝 Tóm tắt việc còn mở trong Ghi chú',
    domain: 'work',
    text: 'Hãy tóm tắt các việc còn mở trong Ghi chú của tôi và gợi ý việc nên làm trước.',
  },
]

// Nhãn tab nói việc người dùng LÀM, không phải tên kỹ thuật nội bộ (audit UI/UX 2026-09-22
// P1-3). Tên cũ ("Đối thoại & Voice", "Nhận thức & Ký ức"...) và badge "Socratic" là thuật
// ngữ sư phạm/kỹ thuật, người học phổ thông không hiểu.
export const STUDIO_TABS_CONFIG = [
  { id: 'dialogue' as const, label: 'Trò chuyện', icon: MessageSquare, badge: 'Giọng nói' },
  { id: 'cognitive' as const, label: 'Ghi nhớ', icon: Brain, badge: 'Hỏi đáp' },
  { id: 'labs' as const, label: 'Thử thách', icon: Swords, badge: 'STEM' },
  { id: 'proactive' as const, label: 'Kế hoạch', icon: Target, badge: 'Tự động' },
]
