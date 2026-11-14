/**
 * Kiểu dùng chung của hệ SRS — TÁCH RIÊNG để cắt chu trình import.
 *
 * Trước đây `SRSCard`/`Rating` khai báo trong `srs.ts`, mà `offlineSrsStore.ts` lại cần chúng →
 * `srs.ts → offlineSrsStore.ts → srs.ts`. Chu trình đó hiện không gây lỗi (cạnh quay lại chỉ là
 * `import type`, TypeScript xoá lúc biên dịch) nhưng là bẫy: chỉ cần ai đó đổi thành import giá
 * trị là sinh `undefined` lúc khởi tạo module, rất khó lần.
 *
 * File này CHỈ chứa kiểu, không import module nào trong `lib/` nên không thể nằm trong chu trình.
 * `srs.ts` xuất lại 2 kiểu này để mọi nơi đang `import { SRSCard } from './srs'` vẫn chạy y nguyên.
 */
import type { State } from 'ts-fsrs'

/** Mức tự đánh giá của người học sau mỗi thẻ. */
export type Rating = 'again' | 'hard' | 'good' | 'easy'

// Dạng LƯU trong localStorage — JSON-safe (Date của FSRS Card → epoch ms).
// Field còn lại khớp 1:1 field của `Card` (ts-fsrs) để có thể truyền THẲNG
// object này vào `scheduler.next()` làm CardInput mà không cần dựng lại.
export interface SRSCard {
  due: number
  stability: number
  difficulty: number
  /** @deprecated ts-fsrs 6 đã bỏ field này. Chỉ còn trong dữ liệu CŨ đã lưu (localStorage/IndexedDB/server) nên để tuỳ chọn; code mới KHÔNG ghi và KHÔNG đọc. */
  elapsed_days?: number
  scheduled_days: number
  learning_steps: number
  reps: number
  lapses: number
  state: State // 0 New · 1 Learning · 2 Review · 3 Relearning
  last_review: number | null
}
