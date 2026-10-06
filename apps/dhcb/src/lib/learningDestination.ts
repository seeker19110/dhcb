// apps/dhcb/src/lib/learningDestination.ts — Đoán NƠI HỌC phù hợp từ câu hỏi người dùng gõ.
//
// Đặc tả: docs/specs/2026-09-15-learning-ux-foundation.md §④ A (slice S02).
//
// Tách khỏi `components/Home/HomeUniversalAiBar.tsx` để test được riêng phần logic và để file
// thành phần chỉ còn xuất đúng một thành phần (luật react-refresh của dự án).
//
// ĐỌC KỸ: đây là TÌM TỪ KHOÁ, không phải phân loại bằng AI. Mọi chữ hiện ra trên giao diện dựa
// trên bảng dưới đây đều phải nói đúng bản chất đó — không hứa "AI đã hiểu câu hỏi của bạn".

/** Nơi học được gợi ý. `isCompanion` = đích cần đăng nhập và nhận được nháp câu hỏi. */
import { duongDanLuyenNoi } from './englishRoutes'

export interface Destination {
  route: string
  label: string
  /** Vì sao gợi ý chỗ này — nói bằng lời người dùng kiểm chứng được, không phải "AI đã phân tích". */
  reason: string
  isCompanion: boolean
}

const COMPANION: Destination = {
  route: '/ban-dong-hanh',
  label: 'Bạn Đồng Hành',
  reason: 'Câu hỏi chung — Bạn Đồng Hành trò chuyện được ở mọi lĩnh vực.',
  isCompanion: true,
}

// Bảng từ khoá → nơi học. Cố tình để dạng dữ liệu (không phải chuỗi if lồng nhau) để đọc và bổ
// sung môn mới dễ, và để test liệt kê được từng nhánh.
// [2026-09-20] Dòng từ khoá 'phỏng vấn'/'sự nghiệp' → `/career/interview` đã bị gỡ cùng trang
// Phòng Luyện Phỏng Vấn: không được trỏ tới trang không còn tồn tại. Các câu hỏi đó nay rơi về
// Bạn Đồng Hành (`COMPANION`), nơi vẫn trò chuyện được mọi lĩnh vực.
const KEYWORD_ROUTES: { keywords: string[]; destination: Destination }[] = [
  {
    keywords: ['toán', 'đạo hàm', 'tích phân', 'hàm số', 'phương trình', 'cực trị', 'hình học'],
    destination: {
      route: '/goc-hoc-tap/mathematics',
      label: 'Môn Toán',
      reason: 'Câu hỏi có từ khoá về Toán.',
      isCompanion: false,
    },
  },
  {
    keywords: ['vật lí', 'vật lý', 'con lắc', 'dao động'],
    destination: {
      route: '/goc-hoc-tap/physics',
      label: 'Môn Vật lí',
      reason: 'Câu hỏi có từ khoá về Vật lí.',
      isCompanion: false,
    },
  },
  {
    keywords: ['hóa học', 'phản ứng', 'oxi hóa'],
    destination: {
      route: '/goc-hoc-tap/chemistry',
      label: 'Môn Hóa học',
      reason: 'Câu hỏi có từ khoá về Hóa học.',
      isCompanion: false,
    },
  },
  {
    keywords: ['sinh học', 'di truyền', 'adn'],
    destination: {
      route: '/goc-hoc-tap/biology',
      label: 'Môn Sinh học',
      reason: 'Câu hỏi có từ khoá về Sinh học.',
      isCompanion: false,
    },
  },
  {
    keywords: ['mô phỏng', 'tiền điện', 'lãi kép', 'gps', 'tdee'],
    destination: {
      route: '/ung-dung-thuc-te',
      label: 'Ứng dụng thực tế',
      reason: 'Câu hỏi có từ khoá về các bài mô phỏng đời sống.',
      isCompanion: false,
    },
  },
  {
    keywords: ['phát âm', 'nói', 'speaking', 'ipa'],
    destination: {
      route: duongDanLuyenNoi(),
      label: 'Luyện nói',
      reason: 'Câu hỏi có từ khoá về phát âm, luyện nói.',
      isCompanion: false,
    },
  },
]

/**
 * Đoán nơi học từ câu hỏi. ĐÂY LÀ TÌM TỪ KHOÁ, không phải phân loại bằng AI — tên hàm, lời giải
 * thích trên giao diện và tài liệu đều phải nói đúng như vậy. Không khớp gì thì về Bạn Đồng Hành.
 */
export function suggestDestination(rawQuestion: string): Destination {
  const q = rawQuestion.toLowerCase()
  for (const row of KEYWORD_ROUTES) {
    if (row.keywords.some((k) => q.includes(k))) return row.destination
  }
  return COMPANION
}
