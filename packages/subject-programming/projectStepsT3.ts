// projectStepsT3 — DỰ ÁN TRỤC T3 "Sổ học tập của tôi" (hạ tầng 2026-10-09).
// Đặc tả hạ tầng: docs/specs/2026-10-09-du-an-truc-t2-t3-ha-tang.md (mục "Hợp đồng cho PR nội
// dung"). Bối cảnh dự án: docs/research/mon-lap-trinh.md §2.2 — môn · nhiệm vụ/deadline · điểm ·
// thẻ ôn · trang chia sẻ tài liệu; đồng hình kỹ thuật với T1 (CRUD + báo cáo + trang public).
//
// PR HẠ TẦNG chỉ dựng KHUNG: năm chặng P1–P5 với mảng bước RỖNG. Dự án tự "mở" (PROJECT_TRACKS
// suy `available` ở projectTracks.ts) ngay khi PR nội dung điền bước đầu tiên.
//
// LUẬT CHO PR NỘI DUNG (test `projectTracks.test.ts` canh) — giống hệt T2, chỉ khác tiền tố:
//  - Mã bước `t3-p<n>-s<k>` (k đếm từ 1, liên tục trong chặng); `unitId` cùng bậc với chặng.
//  - MỌI bước phải khai `files` (phần tử đầu = file chạy chính).
//  - Bước cuối mỗi chặng có `isMilestone: true`, các bước khác false.
//  - Chỉ import KIỂU từ projectStepTypes.ts (không import projectSteps.ts — chu trình import).
import type { ProjectStage, ProjectStep } from './projectStepTypes.js'

/** File làm việc chính của T3 từ chặng P1 (lưu ở server dưới tên `t3--so_hoc_tap.py`). */
export const T3_PROJECT_MAIN_FILE = 'so_hoc_tap.py'

/** Code khởi đầu khi mở T3 lần đầu. */
export const T3_PROJECT_STARTER_CODE = `# so_hoc_tap.py — Sổ học tập của tôi (dự án xuyên suốt, chặng P1)
# Bạn sẽ xây file này lớn dần qua từng bước. Bắt đầu từ bước 1 nhé!
`

export const T3_P1_PROJECT_STEPS: ProjectStep[] = []
export const T3_P2_PROJECT_STEPS: ProjectStep[] = []
export const T3_P3_PROJECT_STEPS: ProjectStep[] = []
export const T3_P4_PROJECT_STEPS: ProjectStep[] = []
export const T3_P5_PROJECT_STEPS: ProjectStep[] = []

/** Năm chặng của T3 — cùng nhịp tiến hoá với T1. */
export const T3_PROJECT_STAGES: ProjectStage[] = [
  { level: 'p1', title: 'Chặng P1 — Sổ điểm chạy chữ', steps: T3_P1_PROJECT_STEPS },
  { level: 'p2', title: 'Chặng P2 — Sổ môn học không mất', steps: T3_P2_PROJECT_STEPS },
  { level: 'p3', title: 'Chặng P3 — Trang chia sẻ tài liệu', steps: T3_P3_PROJECT_STEPS },
  { level: 'p4', title: 'Chặng P4 — Lõi sổ học có test và API', steps: T3_P4_PROJECT_STEPS },
  { level: 'p5', title: 'Chặng P5 — Sổ học tập lên Internet', steps: T3_P5_PROJECT_STEPS },
]
