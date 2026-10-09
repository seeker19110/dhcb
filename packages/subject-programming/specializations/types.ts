// specializations/types.ts — Kiểu dữ liệu tầng HƯỚNG CHUYÊN SÂU của môn Lập trình.
//
// Vì sao có tầng này: P1–P5 (curriculum.ts) là XƯƠNG SỐNG chung — ai học lập trình cũng cần.
// Nhưng "trở thành chuyên gia" thì không có đường chung: người làm web app, người làm hệ
// thống, người làm nhúng đi ba con đường khác hẳn nhau. Tầng này mở P6 "Chuyên sâu" thành
// 14 hướng riêng biệt, mỗi hướng đi từ căn bản của hướng đó tới mức chuyên gia.
//
// Lưu ý đặt tên: KHÔNG dùng chữ "track" — trong môn này `PROJECT_TRACKS` (projectTracks.ts) đã
// mang nghĩa "chủ đề dự án trục T1/T2/T3". Ở đây dùng "specialization" / "hướng".
//
// Dữ liệu là hằng biên dịch, không I/O, không phụ thuộc thời gian — để test kiểm được và để
// mỗi lần mở app ra cùng một lộ trình.

/** Mã hướng chuyên sâu — ổn định, dùng làm khoá tiến độ và làm URL `/lap-trinh/huong/<id>`. */
export type SpecializationId =
  | 'web'
  | 'mobile'
  | 'backend'
  | 'systems'
  | 'data'
  | 'ai'
  | 'devops'
  | 'security'
  | 'game'
  | 'embedded'
  | 'desktop'
  | 'algo'
  | 'architecture'
  | 'mathforcode'

/** Bậc của một chặng trong hướng — 4 bậc cố định cho MỌI hướng để so sánh được với nhau. */
export type SpecStageTier = 's1' | 's2' | 's3' | 's4'

/** Một module kiến thức trong chặng (làn LUYỆN của hướng). */
export interface SpecModule {
  /** `<hướng>-<chặng>-m<số>`, ví dụ `web-s1-m2`. */
  id: string
  title: string
  /** 3–6 ý kiến thức chính. Ngắn, mỗi ý một khái niệm kiểm tra được. */
  topics: string[]
}

/** Dự án của một chặng (làn DỰ ÁN) — thứ nộp được, không phải bài tập lẻ. */
export interface SpecProject {
  name: string
  /** Một câu: xây cái gì, cho ai dùng. */
  brief: string
  /** Tiêu chí chấp nhận — "xong" nghĩa là gì, đo được. */
  requirements: string[]
  /** Phần mở rộng cho ai muốn đi xa hơn (không bắt buộc để qua chặng). */
  stretch?: string[]
}

export interface SpecStage {
  /** `<hướng>-<tier>`, ví dụ `web-s1`. */
  id: string
  tier: SpecStageTier
  name: string
  /** Mục tiêu đầu ra đo được của chặng (can-do). */
  canDo: string
  duration: string
  modules: SpecModule[]
  project: SpecProject
}

/**
 * Lát cắt KIẾN TRÚC của một hướng — phần quan trọng nhất với người sẽ ĐẶC TẢ cho người khác
 * (hoặc cho AI) thi hành thay vì tự gõ từng dòng.
 *
 * Vì sao bắt buộc mọi hướng phải có: một đặc tả thiếu ranh giới module thì người thi hành tự
 * bịa cấu trúc, mỗi lượt một kiểu; thiếu hợp đồng thì hai phần viết xong không ghép được;
 * thiếu NFR thì code chạy được nhưng chậm/không an toàn; thiếu tiêu chí nghiệm thu thì không có
 * cách nào chứng minh bên thi hành làm đúng. Bốn ô dưới đây chính là bốn lỗ hổng đó.
 */
export interface SpecArchitecture {
  /** Các module điển hình của một hệ thống trong hướng này, kèm TRÁCH NHIỆM DUY NHẤT của nó. */
  modules: SpecArchModule[]
  /** Hợp đồng đi qua ranh giới module: cái gì truyền qua, ràng buộc nào phải giữ. */
  contracts: string[]
  /** Quyết định kiến trúc phải chốt SỚM (đổi về sau rất đắt) + đánh đổi kèm theo. */
  keyDecisions: string[]
  /** Yêu cầu phi chức năng đặc trưng của hướng — phải ghi thành SỐ trong đặc tả. */
  nfrs: string[]
  /** Thứ phải viết rõ trong đặc tả thì bên thi hành mới làm đúng ngay lượt đầu. */
  specChecklist: string[]
}

/** Một module trong bản đồ kiến trúc của hướng. */
export interface SpecArchModule {
  name: string
  /** Một câu: module này chịu trách nhiệm DUY NHẤT việc gì, và KHÔNG được làm việc gì. */
  role: string
}

export interface ProgrammingSpecialization {
  id: SpecializationId
  /** Tên tiếng Việt hiển thị, ví dụ "Lập trình Web". */
  name: string
  /** Một câu bán hàng — người học đọc là biết hướng này làm ra cái gì. */
  tagline: string
  /** Hướng này hợp với ai / không hợp với ai. */
  forWho: string
  /** Bậc xương sống tối thiểu nên xong trước khi vào hướng ('p3'…'p5'). */
  prerequisite: 'p3' | 'p4' | 'p5'
  /** Tổng thời lượng ước tính cả 4 chặng. */
  duration: string
  languages: string[]
  /** Công cụ/hệ sinh thái lõi phải quen tay. */
  coreTools: string[]
  /**
   * Hướng NỀN cắt ngang (kiến trúc, thuật toán): học SONG SONG với một hướng sản phẩm chứ
   * không thay thế nó. Giao diện tách riêng nhóm này để người học không chọn nhầm.
   */
  crossCutting?: true
  /** Bản đồ kiến trúc & module của hướng — xem `SpecArchitecture`. */
  architecture: SpecArchitecture
  /** Đúng 4 chặng S1→S4, theo thứ tự. */
  stages: SpecStage[]
  /** Dự án cuối hướng — bằng chứng nghề, đủ để đem đi xin việc. */
  capstone: SpecProject
  /** Dấu hiệu ĐÃ là chuyên gia — hành vi quan sát được, không phải "số năm kinh nghiệm". */
  expertSignals: string[]
  /** Vị trí công việc mở ra. */
  careers: string[]
  /** Bẫy thường gặp khiến người học đứng lại ở mức trung bình. */
  pitfalls: string[]
  /** Nguồn học chuẩn của ngành (tên tài liệu, không phải link — link chết theo thời gian). */
  resources: string[]
}
