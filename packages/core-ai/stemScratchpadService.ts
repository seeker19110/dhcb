// packages/core-ai/stemScratchpadService.ts — Động cơ Kiểm thử & Hướng dẫn Nháp số STEM V5.1.
import {
  StemProblemState,
  ScratchpadStep,
  ScratchpadStepValidation,
  StemSubjectType,
  StemVariableTable,
} from '@dhcb/core-contracts/stemScratchpad'
import {
  checkMathStep,
  describeMathStep,
  type MathStepCheck,
} from '@dhcb/core-grading/stepCheckMath'
import { checkChemStep, type ChemStepCheck } from '@dhcb/core-grading/stepCheckChem'
import {
  checkPhysicsStep,
  type DimensionMismatch,
  type PhysicsStepCheck,
} from '@dhcb/core-grading/stepCheckPhysics'
import { generateSocraticHint, type MicroHint } from './stemMicroHint.js'
import { bangBienCuaDe } from './stemPhysicsVariables.js'

/** Nói rõ bộ kiểm đọc được gì — để "chưa tự kiểm được" không mơ hồ. */
const PHAM_VI_KIEM: Record<StemSubjectType, string> = {
  math:
    'Bộ kiểm hiện đọc được phương trình đại số MỘT ẩn (cộng, trừ, nhân, chia, phân số, luỹ thừa ' +
    'số nguyên); chưa đọc căn, lượng giác, log, π, bất phương trình hay nhiều ẩn.',
  chemistry:
    'Bộ kiểm hiện đọc được phương trình hoá học dạng `2H_2 + O_2 -> 2H_2O` (ngoặc, ngậm nước ·, ' +
    'ion có điện tích, electron e^-).',
  physics:
    'Bộ kiểm Vật lí chỉ kiểm THỨ NGUYÊN (đơn vị) của hai vế và từng hạng tử, khi đề có bảng ' +
    'thứ nguyên biến; chưa kiểm hệ số, dấu hay giá trị.',
  biology: 'Bộ kiểm chưa kiểm được bước giải môn Sinh học.',
}

/** Bước giữa được so với cái gì: phương trình của ĐỀ, hay bước 1 do chính người học viết. */
type MocSo = 'de' | 'buoc1'

/**
 * Kết luận của bộ kiểm toán → phản hồi cho người học. Trả `null` khi bộ kiểm không kết luận được
 * (để rơi xuống nhánh "chưa tự kiểm được"). Gợi ý theo lối Socratic: hỏi để người học tự tìm chỗ
 * sai, KHÔNG đưa nghiệm hay bước đúng.
 *
 * `moc = 'buoc1'` (changelog 0551): đề ngân hàng là lời văn, không có phương trình — bước 1 của
 * người học làm mốc. Khi đó chỉ được nói "tương đương bước 1", KHÔNG được nói "khớp đề bài", và
 * KHÔNG bao giờ là đáp số cuối (bước 1 có thể đã sai so với đề; đáp số chấm ở `submit_solution`).
 */
function ketLuanToan(kq: MathStepCheck, moc: MocSo): ScratchpadStepValidation | null {
  const tenMoc = moc === 'de' ? 'đề bài' : 'bước 1 của em'
  switch (kq.verdict) {
    case 'unsupported':
      return null
    case 'equivalent': {
      const laDapSo = moc === 'de' && kq.isFinalAnswer
      return {
        isValid: true,
        status: 'valid',
        errorType: 'none',
        feedback: laDapSo
          ? 'Tương đương đề bài và đã ở dạng đáp số: tập nghiệm khớp đúng tập nghiệm của đề.'
          : `Biến đổi tương đương: tập nghiệm (số thực) vẫn giữ nguyên so với ${tenMoc}.`,
        confidence: 1,
        isFinalAnswer: laDapSo,
      }
    }
    case 'division_by_zero':
      return {
        isValid: false,
        status: 'invalid',
        errorType: 'division_by_zero',
        feedback: 'Bước này có phép chia cho 0 nên biểu thức không xác định.',
        suggestedCorrection: 'Mẫu số nào đang bằng 0? Phép chia cho 0 không được phép.',
        confidence: 1,
      }
    case 'changed': {
      const doi =
        kq.lost && kq.extra
          ? `Bước này làm ĐỔI tập nghiệm so với ${tenMoc} (vừa mất nghiệm, vừa có nghiệm lạ).`
          : kq.lost
            ? `Bước này làm MẤT nghiệm: có giá trị thoả ${tenMoc} nhưng không thoả bước này.`
            : `Bước này làm THÊM nghiệm lạ: có giá trị thoả bước này nhưng không thoả ${tenMoc}.`
      const goiY =
        kq.lost && kq.extra
          ? 'Thử kiểm lại từng vế: khi chuyển một hạng tử sang vế bên kia, dấu của nó đổi thế nào? ' +
            'Khi nhân/chia, em đã làm cho CẢ HAI vế và cho mọi hạng tử chưa?'
          : kq.lost
            ? 'Em có vừa chia hai vế cho một biểu thức chứa ẩn không? Biểu thức đó có thể bằng 0 ' +
              'không — và nếu bằng 0 thì đề bài có được thoả không?'
            : 'Em có vừa nhân hai vế với biểu thức chứa ẩn, bình phương hai vế, hoặc bỏ mất điều ' +
              'kiện xác định (mẫu khác 0) không? Thử thay giá trị tìm được vào đề bài.'
      const truoc = kq.sameAsPrevious
        ? ' Bước này khớp với bước liền trước — chỗ sai nằm ở một bước TRƯỚC đó; hãy tìm bước ' +
          'đầu tiên bị đánh ✗.'
        : ''
      return {
        isValid: false,
        status: 'invalid',
        errorType: 'changed_solutions',
        feedback: doi + truoc,
        suggestedCorrection: goiY,
        confidence: 1,
      }
    }
  }
}

/** Kết luận của bộ kiểm hoá → phản hồi. `null` khi không đọc được phương trình. */
function ketLuanHoa(kq: ChemStepCheck): ScratchpadStepValidation | null {
  switch (kq.verdict) {
    case 'unsupported':
      return null
    case 'balanced':
      return {
        isValid: true,
        status: 'valid',
        errorType: 'none',
        feedback: kq.simplified
          ? 'Số nguyên tử mỗi nguyên tố và tổng điện tích ở hai vế đã bằng nhau.'
          : 'Số nguyên tử hai vế đã bằng nhau, nhưng các hệ số còn chung một ước — rút gọn để ' +
            'có bộ hệ số tối giản.',
        confidence: 1,
        isFinalAnswer: kq.simplified && kq.matchesProblem === true,
      }
    case 'unbalanced_atoms':
      return {
        isValid: false,
        status: 'invalid',
        errorType: 'unbalanced_equation',
        feedback:
          'Số nguyên tử chưa bằng nhau: ' +
          kq.counts.map((c) => `${c.element} (vế trái ${c.left}, vế phải ${c.right})`).join('; ') +
          '.',
        suggestedCorrection:
          'Chất nào chứa nguyên tố đang lệch? Thử đổi HỆ SỐ đứng trước chất đó (không sửa chỉ số ' +
          'trong công thức) rồi đếm lại cả hai vế.',
        confidence: 1,
      }
    case 'unbalanced_charge':
      return {
        isValid: false,
        status: 'invalid',
        errorType: 'unbalanced_charge',
        feedback: `Số nguyên tử đã khớp nhưng tổng điện tích hai vế khác nhau (vế trái ${kyHieuDien(kq.left)}, vế phải ${kyHieuDien(kq.right)}).`,
        suggestedCorrection:
          'Với phương trình ion, tổng điện tích hai vế cũng phải bằng nhau. Ion hoặc electron ' +
          'nào đang thiếu hệ số?',
        confidence: 1,
      }
    case 'substance_changed':
      return {
        isValid: false,
        status: 'invalid',
        errorType: 'substance_changed',
        feedback: 'Các chất ở bước này khác các chất trong đề bài.',
        suggestedCorrection:
          'Khi cân bằng chỉ được thêm HỆ SỐ đứng trước công thức. Em có lỡ sửa chỉ số (số nhỏ ' +
          'trong công thức), thêm hay bớt một chất không?',
        confidence: 1,
      }
  }
}

/** Phản hồi tối đa 500 ký tự (hợp đồng `ScratchpadStepValidationSchema`). */
function gioiHan(text: string): string {
  return text.length <= 500 ? text : `${text.slice(0, 499)}…`
}

/** Câu nêu SỰ THẬT về chỗ lệch thứ nguyên — trích đúng phần người học gõ. */
function moTaLech(m: DimensionMismatch): string {
  const { left: l, right: r } = m
  switch (m.context) {
    case 'sum':
      return `“${l.text}” (thứ nguyên ${l.dimension}) đang được cộng/trừ với “${r.text}” (thứ nguyên ${r.dimension})`
    case 'equation':
      return `vế “${l.text}” có thứ nguyên ${l.dimension}, còn vế “${r.text}” có thứ nguyên ${r.dimension}`
    case 'function_argument':
      return `đối số của ${m.functionName ?? 'hàm'} là “${l.text}”, có thứ nguyên ${l.dimension} (phải không thứ nguyên)`
    case 'exponent':
      return `số mũ “${l.text}” có thứ nguyên ${l.dimension} (số mũ phải không thứ nguyên)`
  }
}

/** Gợi ý Socratic theo loại lệch — hỏi để người học tự tìm, không đưa công thức đúng. */
function goiYLech(m: DimensionMismatch): string {
  return m.context === 'function_argument' || m.context === 'exponent'
    ? 'Hàm sin, cos, e mũ, ln chỉ nhận một con số không đơn vị. Trong đối số còn thiếu thừa số ' +
        'nào để các đơn vị triệt tiêu nhau?'
    : 'Hai đại lượng chỉ cộng, trừ hay đặt bằng nhau được khi cùng thứ nguyên. Đơn vị của từng ' +
        'hạng tử là gì — hạng tử nào đang thiếu hoặc thừa một thừa số?'
}

/** Vì sao bộ kiểm Vật lí không kết luận được — câu cụ thể thay cho "chưa kiểm được" chung chung. */
function lyDoChuaKiemLi(kq: Extract<PhysicsStepCheck, { verdict: 'unsupported' }>): string {
  const chi = kq.detail ?? ''
  switch (kq.reason) {
    case 'no_variable_table':
      return 'Đề này chưa khai bảng thứ nguyên cho các biến, nên bộ kiểm không biết mỗi ký hiệu là đại lượng gì (và không đoán).'
    case 'bad_variable_table':
      return `Bảng biến của đề có mục không đọc được (${chi}).`
    case 'unknown_symbol':
      return `Ký hiệu “${chi}” không có trong bảng biến của đề.`
    case 'ambiguous_symbol':
      return `Ký hiệu “${chi}” có nhiều nghĩa — đề cần khai rõ nó là đại lượng gì.`
    case 'unknown_unit':
      return `Bộ kiểm chưa đọc được đơn vị “${chi}”.`
    case 'unknown_notation':
      return `Có ký hiệu bộ kiểm chưa đọc được (“${chi}”).`
    case 'not_equation':
      return 'Bước này chưa có dấu “=”.'
    case 'symbolic_exponent':
      return `Số mũ “${chi}” là một biến nên chưa suy được thứ nguyên.`
    case 'numeric_only':
      return 'Bước này chỉ có số không kèm đơn vị, nên không có thứ nguyên nào để so.'
    case 'too_complex':
      return 'Biểu thức quá dài hoặc quá phức tạp để tự kiểm.'
  }
}

/**
 * Kết luận của bộ kiểm thứ nguyên → phản hồi. CHỈ lệch thứ nguyên đã chứng minh (và chia cho 0) mới
 * thành ✗. Khớp thứ nguyên là điều kiện CẦN, không đủ (`v = 2at` khớp mà vẫn sai) → không bao giờ ✓;
 * trả `null` để nơi gọi rơi về "chưa tự kiểm được" (`chuaKiemLi`).
 */
function ketLuanLi(kq: PhysicsStepCheck): ScratchpadStepValidation | null {
  if (kq.verdict === 'mismatch') {
    return {
      isValid: false,
      status: 'invalid',
      errorType: 'dimension_mismatch',
      feedback: gioiHan(`Lệch thứ nguyên: ${moTaLech(kq.mismatch)}.`),
      suggestedCorrection: goiYLech(kq.mismatch),
      confidence: 1,
    }
  }
  if (kq.verdict === 'division_by_zero') {
    return {
      isValid: false,
      status: 'invalid',
      errorType: 'division_by_zero',
      feedback: 'Bước này có phép chia cho 0 nên biểu thức không xác định.',
      suggestedCorrection: 'Mẫu số nào đang bằng 0? Phép chia cho 0 không được phép.',
      confidence: 1,
    }
  }
  return null
}

/** Bước Vật lí bộ kiểm KHÔNG chứng minh được đúng/sai → "chưa tự kiểm được", nói rõ đã biết gì. */
function chuaKiemLi(kq: PhysicsStepCheck): ScratchpadStepValidation {
  const chung = { isValid: true, status: 'unverified', errorType: 'none', confidence: 0 } as const
  if (kq.verdict === 'consistent') {
    return {
      ...chung,
      feedback: gioiHan(
        `Thứ nguyên khớp: các vế đều là ${kq.dimension}` +
          (kq.assumedCoefficients ? ' (coi các số không kèm đơn vị là hệ số thuần)' : '') +
          '. Khớp thứ nguyên mới là điều kiện CẦN — bộ kiểm chưa kiểm được hệ số, dấu hay giá ' +
          'trị, nên chưa xác nhận bước này đúng.',
      ),
      suggestedCorrection:
        'Mỗi hệ số trong bước này lấy từ định luật hay công thức nào? Thay số của đề vào thì kết ' +
        'quả có hợp lí không?',
    }
  }
  if (kq.verdict === 'conditional_mismatch') {
    return {
      ...chung,
      feedback: gioiHan(
        `Chưa kết luận được. Nếu ${kq.doubts.join('; ')}, thì ${moTaLech(kq.mismatch)}.`,
      ),
      suggestedCorrection:
        'Nếu em đã thay số, em ghi kèm đơn vị cho từng số (vd 9,8 m/s²) được không? Còn nếu đó là ' +
        'hệ số thuần thì đơn vị hai vế đã khớp chưa?',
    }
  }
  const lyDo = kq.verdict === 'unsupported' ? lyDoChuaKiemLi(kq) : ''
  return {
    ...chung,
    feedback: gioiHan(
      `Hệ thống chưa tự kiểm được bước này. ${lyDo} ${PHAM_VI_KIEM.physics} Hãy tự đối chiếu: ` +
        'đơn vị hai vế có giống nhau không?',
    ),
  }
}

/** Điện tích có dấu: 0, +3, −2. */
function kyHieuDien(q: number): string {
  return q > 0 ? `+${q}` : q < 0 ? `−${-q}` : '0'
}

/**
 * Phần đề bài bộ kiểm cần. Mọi trường đều tuỳ chọn. Thiếu `problemLatex` (đề lời văn của ngân hàng
 * đề, changelog 0551) thì bước 1 làm mốc cho Toán. `variables` là bảng thứ nguyên biến của đề Vật
 * lí (changelog 0552).
 */
type DeBai = { problemLatex?: string; problemStatement?: string; variables?: StemVariableTable }

export class StemScratchpadService {
  /**
   * Tạo phiên bài tập STEM mới
   */
  static createProblemSession(params: {
    personId: string
    subject: StemSubjectType
    title: string
    problemStatement: string
    problemLatex?: string
    variables?: StemVariableTable
    /** Câu ngân hàng đề mà phiên này giải (changelog 0551) — chỉ server truyền. */
    questionId?: string
  }): StemProblemState {
    const now = new Date().toISOString()
    const id = `prob-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`

    return {
      id,
      personId: params.personId,
      subject: params.subject,
      title: params.title,
      problemStatement: params.problemStatement,
      problemLatex: params.problemLatex,
      ...(params.variables !== undefined ? { variables: params.variables } : {}),
      ...(params.questionId === undefined ? {} : { questionId: params.questionId }),
      steps: [],
      isSolved: false,
      hintsUsed: 0,
      createdAt: now,
      updatedAt: now,
    }
  }

  /**
   * Kiểm thử tính hợp lệ của từng bước biến đổi (Step Validation)
   */
  static validateStep(
    subject: StemSubjectType,
    latexInput: string,
    previousSteps: ScratchpadStep[] = [],
    deBai?: DeBai,
  ): ScratchpadStepValidation {
    const trimmed = latexInput.trim()

    // Bắt lỗi rỗng
    if (!trimmed) {
      return {
        isValid: false,
        status: 'invalid',
        errorType: 'logic_gap',
        feedback: 'Bước biến đổi không được để trống.',
        confidence: 1.0,
      }
    }

    // Heuristics kiểm tra dấu ngoặc
    const openParen = (trimmed.match(/\(/g) || []).length
    const closeParen = (trimmed.match(/\)/g) || []).length
    if (openParen !== closeParen) {
      return {
        isValid: false,
        status: 'invalid',
        errorType: 'arithmetic_error',
        feedback: 'Số lượng dấu mở ngoặc và đóng ngoặc không khớp nhau.',
        suggestedCorrection:
          'Kiểm tra lại việc đóng các cặp ngoặc tròn hoặc ngoặc nhọn trong LaTeX.',
        confidence: 0.95,
      }
    }

    // Bộ kiểm THẬT (changelog 0547, đặc tả docs/specs/2026-10-09-kiem-buoc-giai-stem.md) thay cho
    // hai mẫu lỗi gán cứng cũ (chỉ bắt đúng chuỗi `2x = 15 + 5` và `H_2 + O_2 -> H_2O`, kèm
    // "gợi ý" lộ luôn lời giải). Toán: so TẬP NGHIỆM với đề; Hoá: đếm nguyên tử + điện tích.
    if (subject === 'math') {
      const deCoPhuongTrinh = deBai?.problemLatex !== undefined
      const moc = deBai?.problemLatex ?? previousSteps[0]?.latexInput
      const prev = previousSteps[previousSteps.length - 1]?.latexInput
      if (moc !== undefined) {
        const ketQua = ketLuanToan(
          checkMathStep(trimmed, moc, prev),
          deCoPhuongTrinh ? 'de' : 'buoc1',
        )
        if (ketQua !== null) return ketQua
      } else if (describeMathStep(trimmed) !== null) {
        // Đề lời văn (ngân hàng đề) + đây là bước 1: bộ kiểm ĐỌC được nhưng không có gì để so.
        // Nói rõ vai trò "mốc" thay vì câu chung "chưa đọc được" (vốn sai sự thật ở đây).
        return {
          isValid: true,
          status: 'unverified',
          errorType: 'none',
          feedback:
            'Đề này không cho sẵn phương trình, nên bước 1 là MỐC: các bước sau sẽ được so với ' +
            'nó. Bước này có khớp dữ kiện của đề không thì hệ thống chưa tự kiểm được — hãy tự ' +
            'đối chiếu từng con số với đề.',
          confidence: 0,
        }
      }
    }

    if (subject === 'chemistry') {
      const ketQua = ketLuanHoa(checkChemStep(trimmed, deBai?.problemLatex))
      if (ketQua !== null) return ketQua
    }

    // Vật lí (changelog 0552, docs/specs/2026-10-09-kiem-thu-nguyen-vat-li.md): kiểm THỨ NGUYÊN
    // theo bảng biến của đề. Chỉ lệch đã chứng minh (hoặc chia cho 0) mới ✗; khớp thứ nguyên là
    // điều kiện cần → "chưa tự kiểm được". Đáp số đề mẫu viết cứng đã gỡ ở changelog 0551 — "giải
    // xong" của bài ngân hàng đi qua `submit_solution`.
    if (subject === 'physics') {
      const kq = checkPhysicsStep(trimmed, bangBienCuaDe(deBai))
      return ketLuanLi(kq) ?? chuaKiemLi(kq)
    }

    // Bộ kiểm không kết luận được KHÔNG có nghĩa là bước đúng. Trước 2026-10-02 nhánh này trả
    // "Bước biến đổi logic chính xác" (confidence 0,95) cho MỌI bước, kể cả bước sai — dạy sai
    // người học (changelog 0473). Nay nói thật: chưa kiểm được, nêu phạm vi, kèm cách tự kiểm.
    return {
      isValid: true,
      status: 'unverified',
      errorType: 'none',
      feedback:
        'Hệ thống chưa tự kiểm được bước này. ' +
        PHAM_VI_KIEM[subject] +
        ' Hãy tự đối chiếu: thay giá trị vừa tìm vào đề bài, hoặc kiểm hai vế (và số nguyên tử ' +
        'mỗi nguyên tố nếu là phương trình hoá học) có bằng nhau không.',
      confidence: 0,
    }
  }

  /**
   * Gợi ý cho bước tiếp theo — CÂU HỎI Socratic theo loại bước/lỗi, không chứa nghiệm hay đáp
   * số (changelog 0551; trước đó với bước `2x = 10` hàm này trả thẳng `x = \frac{10}{2} = 5`).
   */
  static generateMicroHint(problem: StemProblemState): MicroHint {
    return generateSocraticHint(problem)
  }
}
