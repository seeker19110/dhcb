// progressSummary — biến một cây mục lục (`Outline`, hợp đồng S07) thành MỘT con số tiến độ
// có thể nói ra được, hoặc nói thẳng là "chưa đo được".
//
// Đặc tả: docs/specs/2026-09-15-learning-ux-s12-on-lai-so-loi-tien-do.md §③.5 (AC-13).
//
// VÌ SAO LÀ HÀM THUẦN, VÌ SAO CHỈ NHẬN `Outline`:
// mọi con số tiến độ của nền tảng phải đi ra từ ĐÚNG MỘT nguồn — bằng chứng đã được từng môn
// đắp lên cây ở `OutlineNode.progress` + `evidenceSource`. Nhận `Outline` (chứ không nhận dữ
// liệu thô của từng môn) nghĩa là ở đây không có chỗ nào để lén suy ra "đã xong" từ "đã mở",
// "đã xem", hay từ một điểm chẩn đoán. Hàm thuần nghĩa là test quét được mọi ca biên mà không
// cần dựng trình duyệt (bất biến §⑤: không đọc/ghi localStorage, không `fetch`).
//
// LUẬT SỐ 1 (CLAUDE.md §2): `unknown` KHÔNG BAO GIỜ được quy về 0 rồi đem chia. Cây toàn
// `unknown` → `measured:false` → giao diện phải in CHỮ "chưa đo được", không in "0%".
import type { Outline, OutlineNode } from '@dhcb/core-contracts/outline'
import { isOutlineLeaf } from '@dhcb/core-contracts/outline'

export interface SubjectProgressSummary {
  subjectId: string
  /** Phạm vi đã đếm: levelId · courseId · lớp (`grade`). */
  scopeId: string
  /** Tiêu đề phạm vi, lấy nguyên từ nút gốc — không tự đặt tên lại. */
  scopeTitle: string
  /** Số lá `lesson`/`activity` trong cây. */
  total: number
  completed: number
  inProgress: number
  unknown: number
  /**
   * `false` khi KHÔNG có lá nào đo được (`unknown === total`, kể cả `total === 0`).
   * Đây là cờ để giao diện chọn giữa "n/m" và chữ "chưa đo được" — không phải để tính %.
   */
  measured: boolean
  /** Các `evidenceSource` gặp trong cây, đã khử trùng, sắp ổn định để test so được. */
  evidenceSources: readonly string[]
}

/**
 * Đếm tiến độ của MỘT cây mục lục.
 *
 * Chỉ lá (`lesson`/`activity`) được đếm: nút `level`/`chapter` là khung chứa, tiến độ của chúng
 * luôn là `unknown` theo đúng hợp đồng S07 — đếm chúng vào là đếm hai lần cùng một việc học.
 */
export function summarizeOutline(outline: Outline): SubjectProgressSummary {
  const leaves = outline.nodes.filter((n: OutlineNode) => isOutlineLeaf(n))

  let completed = 0
  let inProgress = 0
  let unknown = 0
  const sources = new Set<string>()

  for (const leaf of leaves) {
    if (leaf.progress === 'completed') completed += 1
    else if (leaf.progress === 'in-progress') inProgress += 1
    else if (leaf.progress === 'unknown') unknown += 1
    // `not-started` là một phép đo hợp lệ ("đã hỏi, chưa học") — nó không vào nhóm nào ở trên,
    // nhưng vẫn tính vào `total`, và vẫn làm cây trở thành ĐO ĐƯỢC.
    if (leaf.evidenceSource !== undefined) sources.add(leaf.evidenceSource)
  }

  const total = leaves.length
  const root = outline.nodes.find((n) => n.nodeId === outline.rootId)

  return {
    subjectId: outline.subjectId,
    scopeId: root?.contentId ?? outline.courseId ?? outline.rootId,
    scopeTitle: root?.title ?? outline.rootId,
    total,
    completed,
    inProgress,
    unknown,
    measured: total > 0 && unknown < total,
    evidenceSources: [...sources].sort(),
  }
}

/**
 * Nhãn tiếng Việt của nguồn bằng chứng — CHỮ, để người học biết con số đến từ đâu.
 *
 * Một bảng DUY NHẤT: nếu mỗi trang tự đặt tên nguồn thì cùng một bằng chứng sẽ có hai cách gọi
 * và người học không cách nào biết đó là một. Nguồn lạ (môn mới chưa kịp khai) trả `undefined`
 * để giao diện lặng lẽ bỏ phần nhãn, thay vì in mã máy ra màn hình.
 */
const NHAN_NGUON: Readonly<Record<string, string>> = {
  'english.vocab': 'theo vòng từ đã thuộc',
  'english.cefrGrammar': 'theo bài ngữ pháp đã học',
  'english.cefrDialogue': 'theo hội thoại đã xem',
  'english.cefrDialogueLearned': 'theo hội thoại đã đạt kiểm tra hiểu',
  'programming.progress': 'theo bài đã đạt test',
  'stem.evidence': 'theo bài đã đạt test',
  'stem.evidence.local': 'theo bài đã đạt test (trên thiết bị này)',
}

/** Một câu nhãn nguồn cho cả thẻ; nhiều nguồn thì nối bằng " · ". */
export function nhanNguonBangChung(sources: readonly string[]): string | undefined {
  const nhan = [...new Set(sources.map((s) => NHAN_NGUON[s]).filter((s): s is string => !!s))]
  return nhan.length > 0 ? nhan.join(' · ') : undefined
}

/**
 * Bỏ phần LẶP giữa tên môn và tiêu đề phạm vi khi hai thứ đứng cạnh nhau trên một thẻ.
 *
 * Adapter đặt tiêu đề gốc cho ngữ cảnh TRANG MÔN, nơi tên môn không có ở bên cạnh — nên
 * "Toán · Lớp 10" và "A1 · A1 — Sơ cấp" là đúng ở đó. Trên thẻ tiến độ thì tên môn đã nằm ngay
 * dòng trên, và chữ lặp là loại lỗi chỉ lộ ra khi NHÌN ảnh chụp trang (QUY-TRINH-AUDIT Tầng 8b).
 * Sửa ở đây, ở lớp trình bày — KHÔNG sửa adapter, vì tiêu đề gốc là hợp đồng S07 có test canh.
 */
export function rutGonPhamVi(subjectLabel: string, scopeTitle: string): string {
  // ① Bỏ tiền tố trùng tên môn: "Toán · Lớp 10" → "Lớp 10".
  let title = scopeTitle
  if (title.toLowerCase().startsWith(subjectLabel.toLowerCase())) {
    const conLai = title.slice(subjectLabel.length).replace(/^[\s·—–-]+/, '')
    if (conLai.length > 0) title = conLai
  }
  // ② Bỏ đoạn đầu đã được nhắc lại ngay sau đó: "A1 · A1 — Sơ cấp" → "A1 — Sơ cấp".
  const [dau, ...sau] = title.split(' · ')
  if (dau !== undefined && sau.length > 0) {
    const phanSau = sau.join(' · ')
    if (phanSau.toLowerCase().startsWith(dau.toLowerCase())) return phanSau
  }
  return title
}
