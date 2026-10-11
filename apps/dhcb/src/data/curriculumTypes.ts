/**
 * Kiểu `Circle` (một "vòng" từ vựng) — TÁCH RIÊNG để cắt chu trình import.
 *
 * `curriculum.ts` import DỮ LIỆU của `cefrC1C2Vocab.ts` / `cefrA1B2ExtraVocab.ts`, mà hai file
 * đó lại cần KIỂU `Circle` — nếu lấy kiểu từ './curriculum' thì thành chu trình. File
 * chỉ-chứa-kiểu này không import module nào trong `data/` nên nằm ngoài mọi chu trình;
 * `curriculum.ts` xuất lại `Circle` để nơi đang import từ './curriculum' giữ nguyên.
 */
import type { DictEntry } from '../types'

export interface Circle {
  id: string
  titleVi: string
  titleEn: string
  emoji: string
  words: DictEntry[]
  // Câu thông dụng ráp từ chính các từ trong vòng này
  sentences: { en: string; vi: string }[]
  // Chủ đề KHÔNG phù hợp trẻ em (kinh doanh, chính trị, tài chính, sức khỏe tinh thần,
  // mối quan hệ tình cảm...) — ẨN HẲN khỏi luồng học của nhóm tuổi 'nhi_dong' (GĐ 4,
  // PROGRESS.md 2026-07-22). Chỉ áp cho vòng THỦ CÔNG bên dưới; vòng CEFR C1/C2 sinh tự
  // động (cefrC1C2Vocab.ts) không gắn cờ này — thực tế không ai ở tốc độ học của trẻ
  // em chạm tới mức C1/C2 trong thời gian ngắn.
  notForKids?: boolean
}

/**
 * Bản TÓM TẮT của một vòng — đủ để vẽ tên vòng và đếm tiến độ ("đã thuộc x/N từ"), không có
 * nghĩa/câu ví dụ/phiên âm. Tải từ `/data/curriculum-index.json` (~50 KB nén) thay cho
 * `curriculum.json` (~1 MB nén) ở mọi trang chỉ đếm tiến độ — changelog 0601.
 * `Circle` đầy đủ vẫn gán được vào kiểu này, nên hàm đếm nhận cả hai.
 */
export interface CircleSummary {
  id: string
  titleVi: string
  titleEn: string
  emoji: string
  words: ReadonlyArray<Pick<DictEntry, 'word'>>
  notForKids?: boolean
}
