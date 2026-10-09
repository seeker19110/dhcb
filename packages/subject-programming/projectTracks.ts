// projectTracks — BA PHƯƠNG ÁN DỰ ÁN TRỤC T1/T2/T3 (chuyển từ curriculum.ts, 2026-10-09).
// Đặc tả: docs/specs/2026-10-09-du-an-truc-t2-t3-ha-tang.md.
//
// VÌ SAO RỜI curriculum.ts: cờ `available` nay SUY từ dữ liệu bước (dự án có ít nhất một bước
// là mở), nên cần đọc projectSteps.ts. curriculum.ts được rất nhiều trang import; bắt nó import
// toàn bộ nội dung bước dự án là phình bundle mọi trang đó. File này chỉ trang dự án/trang môn
// và server dùng.
//
// Thứ tự import một chiều: projectTracks → projectSteps → projectSteps{P3,P4,P5,T2,T3} →
// projectStepTypes → projectTrackIds. Không file nào bên dưới import ngược lên đây.
import { getProjectStages, PROJECT_STARTER_CODE } from './projectSteps.js'
import { PROJECT_MAIN_FILE, type ProjectStage } from './projectStepTypes.js'
import { T2_PROJECT_MAIN_FILE, T2_PROJECT_STARTER_CODE } from './projectStepsT2.js'
import { T3_PROJECT_MAIN_FILE, T3_PROJECT_STARTER_CODE } from './projectStepsT3.js'
import { DEFAULT_PROJECT_TRACK, PROJECT_TRACK_IDS, type ProjectTrackId } from './projectTrackIds.js'

export {
  PROJECT_TRACK_IDS,
  DEFAULT_PROJECT_TRACK,
  isProjectTrackId,
  type ProjectTrackId,
} from './projectTrackIds.js'

/** Một phương án dự án trục — học viên chọn 1, đổi lúc nào cũng được (tiến độ giữ riêng). */
export interface ProjectTrack {
  id: ProjectTrackId
  name: string
  description: string
  /** Danh từ chỉ sản phẩm, dùng trong câu chúc mừng ("Bản <…> của bạn đã được chốt…"). */
  productNoun: string
  /** File làm việc chính khi mở dự án lần đầu (tên khi chạy, chưa gắn tiền tố lưu). */
  mainFile: string
  /** Code khởi đầu của file chính. */
  starterCode: string
  /** SUY từ dữ liệu: dự án có ít nhất một bước thì mở — không ghi cứng (xem isTrackAvailable). */
  available: boolean
}

/** Dự án mở khi có ÍT NHẤT MỘT bước ở bất kỳ chặng nào. Hàm thuần — test được với dữ liệu giả. */
export function isTrackAvailable(stages: readonly ProjectStage[]): boolean {
  return stages.some((stage) => stage.steps.length > 0)
}

type ProjectTrackInfo = Omit<ProjectTrack, 'available'>

const TRACK_INFO: readonly ProjectTrackInfo[] = [
  {
    id: 'T1',
    name: 'Cửa hàng của tôi',
    description:
      'Quản lý bán hàng nhỏ: menu, đơn, kho, doanh thu, trang đặt hàng — từ console P1 đến web chạy thật trên Internet ở P5.',
    productNoun: 'cửa hàng',
    mainFile: PROJECT_MAIN_FILE,
    starterCode: PROJECT_STARTER_CODE,
  },
  {
    id: 'T2',
    name: 'Quỹ lớp / Chi tiêu nhà mình',
    description: 'Thu chi, thành viên, báo cáo, trang minh bạch quỹ.',
    productNoun: 'sổ quỹ',
    mainFile: T2_PROJECT_MAIN_FILE,
    starterCode: T2_PROJECT_STARTER_CODE,
  },
  {
    id: 'T3',
    name: 'Sổ học tập của tôi',
    description: 'Quản lý môn học, deadline, điểm, thẻ ôn, trang chia sẻ tài liệu.',
    productNoun: 'sổ học tập',
    mainFile: T3_PROJECT_MAIN_FILE,
    starterCode: T3_PROJECT_STARTER_CODE,
  },
]

export const PROJECT_TRACKS: readonly ProjectTrack[] = TRACK_INFO.map((info) => ({
  ...info,
  available: isTrackAvailable(getProjectStages(info.id)),
}))

const trackMap = new Map(PROJECT_TRACKS.map((t) => [t.id, t]))

export function getProjectTrack(id: ProjectTrackId): ProjectTrack {
  // Bảng đủ cả ba mã (test canh) — `!` an toàn.
  return trackMap.get(id)!
}

export function isProjectTrackAvailable(id: ProjectTrackId): boolean {
  return getProjectTrack(id).available
}

/**
 * Quy một giá trị bất kỳ (cột DB, localStorage, phản hồi API) về một dự án ĐANG MỞ. Mã lạ hoặc
 * dự án chưa có bước → T1. Giao diện phải đi qua hàm này: hiển thị một dự án chưa có bước nào
 * là trang trắng.
 */
export function normalizeProjectTrack(value: unknown): ProjectTrackId {
  for (const id of PROJECT_TRACK_IDS) {
    if (id === value && isProjectTrackAvailable(id)) return id
  }
  return DEFAULT_PROJECT_TRACK
}
