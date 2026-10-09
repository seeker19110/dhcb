// projectStepsT2 — DỰ ÁN TRỤC T2 "Quỹ lớp / Chi tiêu nhà mình" (hạ tầng 2026-10-09).
// Đặc tả hạ tầng: docs/specs/2026-10-09-du-an-truc-t2-t3-ha-tang.md (mục "Hợp đồng cho PR nội
// dung"). Bối cảnh dự án: docs/research/mon-lap-trinh.md §2.2 — thu chi · thành viên · hạng mục
// · kỳ báo cáo · trang minh bạch quỹ; đồng hình kỹ thuật với T1 (CRUD + báo cáo + trang public).
//
// PR HẠ TẦNG chỉ dựng KHUNG: năm chặng P1–P5 với mảng bước RỖNG. Dự án tự "mở" (PROJECT_TRACKS
// suy `available` ở projectTracks.ts) ngay khi PR nội dung điền bước đầu tiên — không phải sửa
// cờ nào khác.
//
// LUẬT CHO PR NỘI DUNG (test `projectTracks.test.ts` canh, đỏ là sai hợp đồng):
//  - Mã bước `t2-p<n>-s<k>` (k đếm từ 1, liên tục trong chặng); `unitId` cùng bậc với chặng.
//  - MỌI bước phải khai `files` (phần tử đầu = file chạy chính): mặc định của schema là file
//    `cua_hang.py` của T1, để trống là chạy nhầm file dự án khác.
//  - Bước cuối mỗi chặng có `isMilestone: true`, các bước khác false.
//  - Chỉ import KIỂU từ projectStepTypes.ts (không import projectSteps.ts — chu trình import,
//    cổng `codemap -- cycles` chặn CI). Chặng dài thì tách file riêng `projectStepsT2P<n>.ts`
//    theo đúng khuôn T1 (projectStepsP3.ts…), rồi gắn mảng vào bảng bên dưới.
import type { ProjectStage, ProjectStep } from './projectStepTypes.js'

/** File làm việc chính của T2 từ chặng P1 (lưu ở server dưới tên `t2--quy_lop.py`). */
export const T2_PROJECT_MAIN_FILE = 'quy_lop.py'

/** Code khởi đầu khi mở T2 lần đầu. */
export const T2_PROJECT_STARTER_CODE = `# quy_lop.py — Quỹ lớp / Chi tiêu nhà mình (dự án xuyên suốt, chặng P1)
# Bạn sẽ xây file này lớn dần qua từng bước. Bắt đầu từ bước 1 nhé!
`

export const T2_P1_PROJECT_STEPS: ProjectStep[] = []
export const T2_P2_PROJECT_STEPS: ProjectStep[] = []
export const T2_P3_PROJECT_STEPS: ProjectStep[] = []
export const T2_P4_PROJECT_STEPS: ProjectStep[] = []
export const T2_P5_PROJECT_STEPS: ProjectStep[] = []

/** Năm chặng của T2 — cùng nhịp tiến hoá với T1: console → nhiều file + lưu tệp → web →
 *  lõi có class/test/API → chạy thật trên Internet. */
export const T2_PROJECT_STAGES: ProjectStage[] = [
  { level: 'p1', title: 'Chặng P1 — Sổ thu chi chạy chữ', steps: T2_P1_PROJECT_STEPS },
  { level: 'p2', title: 'Chặng P2 — Sổ quỹ không mất', steps: T2_P2_PROJECT_STEPS },
  { level: 'p3', title: 'Chặng P3 — Trang minh bạch quỹ', steps: T2_P3_PROJECT_STEPS },
  { level: 'p4', title: 'Chặng P4 — Lõi quỹ có test và API', steps: T2_P4_PROJECT_STEPS },
  { level: 'p5', title: 'Chặng P5 — Quỹ lên Internet', steps: T2_P5_PROJECT_STEPS },
]
