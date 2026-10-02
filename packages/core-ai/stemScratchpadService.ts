// packages/core-ai/stemScratchpadService.ts — Động cơ Kiểm thử & Hướng dẫn Nháp số STEM V5.1.
import {
  StemProblemState,
  ScratchpadStep,
  ScratchpadStepValidation,
  StemSubjectType,
} from '@dhcb/core-contracts/stemScratchpad'

/**
 * Đáp số ĐÃ BIẾT của các đề mẫu (modal STEM hiện chỉ dựng 3 đề cố định). Đây là kiểm tra THẬT duy
 * nhất mà bộ kiểm làm được: đáp số cuối khớp NGUYÊN VẸN với đáp số đúng. Trước 2026-10-02 server
 * so CHUỖI CON (`includes('x = 5')`) nên "x = 50" hay "H_2 + O_2 -> 2H_2O" (chưa cân bằng) vẫn được
 * gắn "ĐÃ GIẢI XONG" (changelog 0473). Đề vật lý cần khớp cả lời đề vì công thức `v = a·t` không
 * tự quyết định đáp số.
 */
const DAP_SO_DE_MAU: ReadonlyArray<{
  subject: StemSubjectType
  problemLatex: string
  problemStatement?: string
  dapSo: readonly string[]
}> = [
  { subject: 'math', problemLatex: '2x + 5 = 15', dapSo: ['x=5'] },
  {
    subject: 'physics',
    problemLatex: 'v = a \\cdot t',
    problemStatement: 'Tính vận tốc sau 5s khi gia tốc a = 2m/s² từ trạng thái nghỉ:',
    dapSo: ['v=10', 'v=10m/s'],
  },
  {
    subject: 'chemistry',
    problemLatex: 'H_2 + O_2 \\rightarrow H_2O',
    dapSo: ['2H_2+O_2\\rightarrow2H_2O'],
  },
]

/** Phần đề bài bộ kiểm cần để so đáp số. Hai trường đều tuỳ chọn: thiếu thì coi như đề lạ. */
type DeBai = { problemLatex?: string; problemStatement?: string }

/** Bỏ khoảng trắng, thống nhất mũi tên phản ứng, chỉ giữ vế sau dấu suy ra cuối cùng. */
function chuanHoaDapSo(latex: string): string {
  const veCuoi = latex.split(/\\implies|\\Rightarrow/).pop() ?? latex
  return veCuoi.replace(/\s+/g, '').replace(/->|→/g, '\\rightarrow')
}

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

    // Heuristics toán học: kiểm tra dấu sai phổ biến (ví dụ: đổi vế không đổi dấu)
    const prev = previousSteps.length > 0 ? previousSteps[previousSteps.length - 1] : undefined
    if (
      prev &&
      prev.latexInput.includes('+') &&
      trimmed.includes('+') &&
      trimmed.includes('=') &&
      !trimmed.includes('-')
    ) {
      const last = prev.latexInput
      if (last.includes('2x + 5 = 15') && trimmed.includes('2x = 15 + 5')) {
        return {
          isValid: false,
          status: 'invalid',
          errorType: 'sign_error',
          feedback:
            'Lỗi chuyển vế: khi chuyển +5 sang vế phải, dấu cần đổi thành -5 (tức là 15 - 5 = 10).',
          suggestedCorrection: '2x = 15 - 5 \\implies 2x = 10',
          confidence: 0.99,
        }
      }
    }

    // Heuristics hóa học: kiểm tra cân bằng phương trình
    if (subject === 'chemistry') {
      if (trimmed.includes('H_2 + O_2 -> H_2O') && !trimmed.includes('2H_2')) {
        return {
          isValid: false,
          status: 'invalid',
          errorType: 'unbalanced_equation',
          feedback: 'Phương trình hóa học chưa cân bằng số nguyên tử Oxi ở 2 vế.',
          suggestedCorrection: '2H_2 + O_2 \\rightarrow 2H_2O',
          confidence: 0.98,
        }
      }
    }

    if (deBai && StemScratchpadService.khopDapSo(subject, deBai, trimmed)) {
      return {
        isValid: true,
        status: 'valid',
        errorType: 'none',
        feedback: 'Đúng đáp số của đề bài.',
        confidence: 1,
      }
    }

    // Không bắt được lỗi nào ở trên KHÔNG có nghĩa là bước đúng: bộ kiểm này mới chỉ nhận ra vài
    // lỗi cụ thể, chưa tự chứng minh được biến đổi đại số/cân bằng phản ứng. Trước 2026-10-02 nhánh
    // này trả "Bước biến đổi logic chính xác" (confidence 0,95) cho MỌI bước, kể cả bước sai —
    // dạy sai người học (changelog 0473). Nay nói thật: chưa kiểm được, kèm cách tự kiểm.
    return {
      isValid: true,
      status: 'unverified',
      errorType: 'none',
      feedback:
        'Hệ thống chưa tự kiểm được bước này. Hãy tự đối chiếu: thay giá trị vừa tìm vào đề bài, ' +
        'hoặc kiểm hai vế (và số nguyên tử mỗi nguyên tố nếu là phương trình hoá học) có bằng nhau không.',
      confidence: 0,
    }
  }

  /** `true` khi `latexInput` là ĐÚNG đáp số đã biết của đề mẫu (so nguyên vẹn, không so chuỗi con). */
  static khopDapSo(subject: StemSubjectType, deBai: DeBai, latexInput: string): boolean {
    const de = DAP_SO_DE_MAU.find(
      (d) =>
        d.subject === subject &&
        d.problemLatex === deBai.problemLatex &&
        (d.problemStatement === undefined || d.problemStatement === deBai.problemStatement),
    )
    return de !== undefined && de.dapSo.includes(chuanHoaDapSo(latexInput))
  }

  /**
   * Sinh gợi ý thông minh cho bước tiếp theo (Next Step Micro-Hint)
   */
  static generateMicroHint(problem: StemProblemState): {
    hintText: string
    suggestedFormula?: string
  } {
    if (problem.steps.length === 0) {
      return {
        hintText:
          'Bắt đầu bằng việc xác định biến số cần tìm và cô lập các hạng tử chứa biến về một vế.',
        suggestedFormula: problem.problemLatex,
      }
    }

    const lastStep = problem.steps[problem.steps.length - 1]
    if (lastStep && lastStep.latexInput.includes('2x = 10')) {
      return {
        hintText: 'Chia cả hai vế cho hệ số của x (tức là chia cho 2) để tìm nghiệm x.',
        suggestedFormula: 'x = \\frac{10}{2} = 5',
      }
    }

    return {
      hintText: 'Rút gọn biểu thức và kiểm tra lại điều kiện xác định của bài toán.',
    }
  }
}
