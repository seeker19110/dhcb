// packages/core-ai/stemMicroHint.ts — Gợi ý Socratic cho bảng nháp STEM (changelog 0551).
//
// Đặc tả: docs/specs/2026-10-09-stem-goi-y-socratic-va-nop-loi-giai.md §①–§⑤.
//
// VÌ SAO CÓ FILE NÀY: `generateMicroHint` cũ trả gợi ý soạn sẵn cho một đề mẫu và với bước
// `2x = 10` thì đưa thẳng `x = \frac{10}{2} = 5` — tức GIẢI HỘ, trái nguyên tắc Socratic của
// skill `stem-science-reasoning-master` §3. Nay gợi ý luôn là CÂU HỎI dẫn dắt, chọn theo:
//   1. kết luận của chính bộ kiểm bước (changelog 0547) cho bước cuối — `checkMathStep` /
//      `checkChemStep` chạy lại để biết loại lỗi cụ thể (mất nghiệm, nghiệm lạ, chia cho 0,
//      lệch nguyên tử của nguyên tố nào…); Vật lí dùng `checkPhysicsStep` (changelog 0552) để
//      hỏi về đơn vị/thứ nguyên khi bước lệch thứ nguyên;
//   2. HÌNH DẠNG của bước cuối khi bước đó hợp lệ (`describeMathStep`: còn hạng tử gộp được,
//      còn ngoặc, ẩn ở hai vế, có mẫu chứa ẩn…).
// Bất biến: gợi ý KHÔNG chứa nghiệm, đáp số hay hệ số đã giải — chỉ chứa câu hỏi và tên khái niệm.
// Test canh: `stemMicroHint.test.ts` (lấy nghiệm bằng chính bộ kiểm rồi khẳng định gợi ý không
// chứa nghiệm đó).
import type {
  StemMicroHint,
  StemProblemState,
  StemSubjectType,
} from '@dhcb/core-contracts/stemScratchpad'
import {
  checkMathStep,
  describeMathStep,
  type MathStepCheck,
  type MathStepShape,
} from '@dhcb/core-grading/stepCheckMath'
import { checkChemStep, type ChemStepCheck } from '@dhcb/core-grading/stepCheckChem'
import { checkPhysicsStep, type PhysicsStepCheck } from '@dhcb/core-grading/stepCheckPhysics'
import { bangBienCuaDe } from './stemPhysicsVariables.js'

/**
 * Ba bậc gợi ý (skill §3): 1 = gợi khái niệm · 2 = gợi cấu trúc bước tiếp · 3 = chỉ đúng chỗ sai.
 * Bậc do TÌNH TRẠNG bài quyết định (chưa có bước → 1; bước hợp lệ → 2; bước sai → 3).
 */
export type MicroHint = StemMicroHint

// ── Câu hỏi soạn sẵn (không chứa số liệu của đề) ────────────────────────────

const BAT_DAU: Record<StemSubjectType, string> = {
  math:
    'Đề hỏi đại lượng nào? Em có thể gọi đại lượng đó là một ẩn (ví dụ x) rồi viết một đẳng ' +
    'thức từ dữ kiện của đề không?',
  physics:
    'Đại lượng cần tìm là gì, và đề đã cho những đại lượng nào (kèm đơn vị)? Công thức nào trong ' +
    'bài học nối được chúng với nhau?',
  chemistry:
    'Đề hỏi đại lượng nào? Dữ kiện nào liên quan trực tiếp tới nó, và định luật nào (bảo toàn ' +
    'khối lượng, bảo toàn nguyên tố, bảo toàn electron, n = m/M…) nối chúng lại?',
  biology: 'Đề đang hỏi về cơ chế hay quy luật nào? Dữ kiện nào của đề cho thấy điều đó?',
}

const BAT_DAU_PHUONG_TRINH_TOAN =
  'Ẩn cần tìm là gì, và những hạng tử nào đang chứa ẩn? Muốn ẩn đứng một mình, em định làm gì ' +
  'với các hạng tử còn lại?'

const BAT_DAU_CAN_BANG =
  'Mỗi vế có những chất nào? Nguyên tố nào chỉ nằm trong MỘT chất ở mỗi vế — bắt đầu cân bằng ' +
  'từ nguyên tố đó được không?'

const CHUA_DOC_DUOC: Record<StemSubjectType, string> = {
  math:
    'Em có thể viết bước này thành một phương trình chỉ có MỘT ẩn (dùng +, −, ·, /, phân số, luỹ ' +
    'thừa) để bộ kiểm đọc được không? Nếu chưa, hãy tự thay giá trị vào đề: hai vế có bằng nhau ' +
    'không?',
  physics:
    'Đơn vị ở hai vế của bước vừa viết có khớp nhau không? Em đã đổi mọi đại lượng về cùng một hệ ' +
    'đơn vị (SI) trước khi thay số chưa?',
  chemistry:
    'Bước vừa viết dựa trên định luật nào? Nếu là một phương trình phản ứng, số nguyên tử mỗi ' +
    'nguyên tố ở hai vế đã bằng nhau chưa?',
  biology: 'Bước vừa viết có khớp với dữ kiện của đề không? Em dựa vào quy luật nào?',
}

// ── Toán ────────────────────────────────────────────────────────────────────

/** Bước cuối SAI → bậc 3: hỏi đúng loại lỗi bộ kiểm vừa chứng minh. */
function hoiLoiToan(kq: MathStepCheck, deCoDKXD: boolean): string | null {
  if (kq.verdict === 'division_by_zero') {
    return 'Ở bước vừa rồi, mẫu số nào đang bằng 0? Phép chia đó có được phép không — và em nên quay lại từ bước nào?'
  }
  if (kq.verdict !== 'changed') return null
  const truoc = kq.sameAsPrevious
    ? 'Bước này cùng tập nghiệm với bước liền trước, nên chỗ sai nằm ở bước ✗ ĐẦU TIÊN. '
    : ''
  if (kq.lost && kq.extra) {
    return (
      truoc +
      'Đặt bước này cạnh bước liền trước: hạng tử nào vừa đổi vế? Khi đổi vế, dấu của nó phải ' +
      'thế nào — và em đã đổi chưa?'
    )
  }
  if (kq.lost) {
    return (
      truoc +
      'Em có vừa chia hai vế cho một biểu thức chứa ẩn không? Nếu biểu thức đó bằng 0 thì đề bài ' +
      'có được thoả không?'
    )
  }
  if (deCoDKXD) {
    return (
      truoc +
      'Đề có mẫu số chứa ẩn. Điều kiện xác định (mọi mẫu số khác 0) của đề là gì — giá trị em vừa ' +
      'tìm có thoả điều kiện đó không?'
    )
  }
  return (
    truoc +
    'Em có vừa nhân hai vế với biểu thức chứa ẩn hoặc bình phương hai vế không? Thay giá trị tìm ' +
    'được vào đề: hai vế có bằng nhau không?'
  )
}

/** Bước cuối HỢP LỆ → bậc 2: hỏi về cấu trúc để người học tự chọn bước tiếp. */
function hoiCauTrucToan(shape: MathStepShape): string {
  if (shape.isAnswerForm) {
    return (
      'Bước này đã ở dạng đáp số. Thay giá trị đó vào đề: hai vế có bằng nhau không? Đề hỏi ' +
      'đúng đại lượng này chưa — nếu rồi, hãy nộp lời giải.'
    )
  }
  if (shape.hasVariableDenominator) {
    return (
      'Phương trình còn mẫu số chứa ẩn. Trước khi khử mẫu, điều kiện xác định là gì — và em sẽ ' +
      'nhớ kiểm lại điều kiện đó ở cuối chứ?'
    )
  }
  if (shape.hasExpandableProduct) {
    return 'Có chỗ nào đang nhân một số (hay một biểu thức) với một tổng chứa ẩn không? Phá ngoặc ra thì hai vế trông thế nào?'
  }
  if (shape.hasLikeTerms) {
    return 'Hai vế còn hạng tử nào gộp được không — cùng là số, hoặc cùng chứa ẩn với cùng số mũ?'
  }
  if (shape.variableOnBothSides) {
    return 'Ẩn đang nằm ở cả hai vế. Đưa các hạng tử chứa ẩn về cùng một vế thì dấu của chúng thay đổi ra sao?'
  }
  if (shape.degree >= 2) {
    return (
      'Đây là phương trình bậc lớn hơn 1. Chuyển hết về một vế bằng 0 rồi thử phân tích thành ' +
      'nhân tử — mỗi nhân tử bằng 0 cho em biết điều gì?'
    )
  }
  if (shape.constantBesideVariable) {
    return 'Vế chứa ẩn còn một số hạng tự do. Muốn ẩn đứng riêng, em chuyển số hạng đó sang vế kia thế nào (dấu của nó ra sao)?'
  }
  if (shape.coefficientNotOne) {
    return 'Ẩn đang có hệ số khác 1. Em làm phép tính gì với CẢ HAI vế để ẩn đứng một mình?'
  }
  return 'Bước tiếp theo nên làm phương trình gọn hơn ở chỗ nào: gộp hạng tử, chuyển vế hay chia cho hệ số?'
}

function goiYToan(problem: StemProblemState, buocCuoi: string): MicroHint {
  const moc = problem.problemLatex ?? problem.steps[0]?.latexInput
  const truoc = problem.steps[problem.steps.length - 2]?.latexInput
  // Bước cuối chính là mốc (bài không có phương trình đề, mới viết bước 1) → chỉ xét hình dạng.
  const laMoc = problem.problemLatex === undefined && problem.steps.length === 1
  if (moc !== undefined && !laMoc) {
    const kq = checkMathStep(buocCuoi, moc, truoc)
    const deCoDKXD = describeMathStep(moc)?.hasVariableDenominator ?? false
    const loi = hoiLoiToan(kq, deCoDKXD)
    if (loi !== null) return { hintText: loi, level: 3 }
    if (kq.verdict === 'unsupported') return { hintText: CHUA_DOC_DUOC.math, level: 1 }
  }
  const shape = describeMathStep(buocCuoi)
  if (shape === null) return { hintText: CHUA_DOC_DUOC.math, level: 1 }
  return { hintText: hoiCauTrucToan(shape), level: 2 }
}

// ── Hoá ─────────────────────────────────────────────────────────────────────

function hoiHoa(kq: ChemStepCheck): MicroHint | null {
  switch (kq.verdict) {
    case 'unsupported':
      return null
    case 'unbalanced_atoms': {
      // Nêu TÊN nguyên tố đang lệch (phản hồi của bước đã nêu) — không nêu hệ số cần điền.
      const el = kq.counts[0]?.element ?? 'đang lệch'
      return {
        hintText:
          `Nguyên tố ${el} chưa bằng nhau ở hai vế. Chất nào chứa ${el}, và nếu đổi HỆ SỐ đứng ` +
          `trước chất đó thì số nguyên tử ${el} ở vế ấy thay đổi thế nào? Nhớ đếm lại cả các ` +
          'nguyên tố khác.',
        level: 3,
      }
    }
    case 'unbalanced_charge':
      return {
        hintText:
          'Tổng điện tích hai vế chưa bằng nhau. Ion hay electron nào đang thiếu hệ số, và nó nằm ' +
          'ở vế nào?',
        level: 3,
      }
    case 'substance_changed':
      return {
        hintText:
          'Em có lỡ sửa chỉ số (số nhỏ trong công thức), thêm hay bớt một chất không? So từng ' +
          'chất ở bước này với đề: chỉ được đổi HỆ SỐ đứng trước.',
        level: 3,
      }
    case 'balanced':
      return kq.simplified
        ? {
            hintText:
              'Phương trình đã cân bằng. Đề hỏi đúng điều gì — em đọc được câu trả lời từ ' +
              'phương trình này chưa? Nếu rồi, hãy nộp lời giải.',
            level: 2,
          }
        : {
            hintText:
              'Số nguyên tử đã bằng nhau. Các hệ số còn ước chung nào (ngoài một) không? Chia ' +
              'tất cả cho ước chung đó thì được bộ hệ số thế nào?',
            level: 2,
          }
  }
}

function goiYHoa(problem: StemProblemState, buocCuoi: string): MicroHint {
  return (
    hoiHoa(checkChemStep(buocCuoi, problem.problemLatex)) ?? {
      hintText: CHUA_DOC_DUOC.chemistry,
      level: 1,
    }
  )
}

// ── Vật lí (gộp với changelog 0552) ─────────────────────────────────────────

/**
 * Câu hỏi theo kết luận THỨ NGUYÊN của `checkPhysicsStep`. Chỉ nêu thứ nguyên (sự thật bộ kiểm
 * chứng minh được, phản hồi của bước cũng đã nêu), không bao giờ nêu công thức đúng hay đáp số —
 * bộ kiểm thứ nguyên vốn không biết hai thứ đó.
 */
function hoiLi(kq: PhysicsStepCheck): MicroHint | null {
  switch (kq.verdict) {
    case 'mismatch': {
      const { context, left, right } = kq.mismatch
      if (context === 'function_argument' || context === 'exponent') {
        return {
          hintText:
            `Đối số (hoặc số mũ) ở bước này đang mang thứ nguyên ${left.dimension}. Hàm sin, cos, ` +
            'e mũ, ln chỉ nhận một con số không đơn vị — trong biểu thức đó còn thiếu thừa số nào ' +
            'để các đơn vị triệt tiêu nhau?',
          level: 3,
        }
      }
      const cho = context === 'sum' ? 'đang cộng/trừ với nhau' : 'đang được đặt bằng nhau'
      return {
        hintText:
          `Hai phần ${cho} có thứ nguyên ${left.dimension} và ${right.dimension}. Đơn vị của từng ` +
          'đại lượng trong mỗi phần là gì — phần nào đang thiếu hoặc thừa một thừa số (ví dụ một ' +
          'thời gian, một khối lượng)?',
        level: 3,
      }
    }
    case 'division_by_zero':
      return {
        hintText: 'Ở bước vừa rồi, mẫu số nào đang bằng 0? Phép chia đó có được phép không?',
        level: 3,
      }
    case 'conditional_mismatch':
      return {
        hintText:
          'Bước này có con số chưa kèm đơn vị nên chưa so được thứ nguyên. Em ghi đơn vị cho từng ' +
          'số đã thay vào được không — khi đó đơn vị hai vế có khớp nhau không?',
        level: 2,
      }
    case 'consistent':
      return {
        hintText:
          'Đơn vị hai vế đã khớp — nhưng khớp đơn vị chưa chắc là đúng. Mỗi hệ số trong bước này ' +
          'lấy từ định luật hay công thức nào của bài học? Thay số của đề vào thì kết quả có hợp ' +
          'lí không?',
        level: 2,
      }
    case 'unsupported':
      return null
  }
}

function goiYLi(problem: StemProblemState, buocCuoi: string): MicroHint {
  return (
    hoiLi(checkPhysicsStep(buocCuoi, bangBienCuaDe(problem))) ?? {
      hintText: CHUA_DOC_DUOC.physics,
      level: 1,
    }
  )
}

// ── Điểm vào ────────────────────────────────────────────────────────────────

/** Đề có sẵn phương trình mà bộ kiểm đọc được không (để chọn câu hỏi mở đầu sát hơn). */
function deLaPhuongTrinh(problem: StemProblemState): boolean {
  const de = problem.problemLatex
  if (de === undefined) return false
  if (problem.subject === 'math') return describeMathStep(de) !== null
  if (problem.subject === 'chemistry') return checkChemStep(de).verdict !== 'unsupported'
  return false
}

/**
 * Gợi ý cho bước tiếp theo: luôn là CÂU HỎI dẫn dắt, không bao giờ chứa nghiệm/đáp số/hệ số.
 */
export function generateSocraticHint(problem: StemProblemState): MicroHint {
  const buocCuoi = problem.steps[problem.steps.length - 1]?.latexInput.trim()
  if (buocCuoi === undefined || buocCuoi === '') {
    if (deLaPhuongTrinh(problem)) {
      return {
        hintText: problem.subject === 'math' ? BAT_DAU_PHUONG_TRINH_TOAN : BAT_DAU_CAN_BANG,
        level: 1,
      }
    }
    return { hintText: BAT_DAU[problem.subject], level: 1 }
  }
  if (problem.subject === 'math') return goiYToan(problem, buocCuoi)
  if (problem.subject === 'chemistry') return goiYHoa(problem, buocCuoi)
  if (problem.subject === 'physics') return goiYLi(problem, buocCuoi)
  return { hintText: CHUA_DOC_DUOC[problem.subject], level: 1 }
}
