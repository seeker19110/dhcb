import { CompanionSurfaceSanitizer } from './companionSurfaceSanitizer.js'
import { QuestionFenceGuard } from './companionQuestionFence.js'

export type VisibleTextIssue = 'markup' | 'internal_id' | 'question_fence' | 'surface_overflow'

/** Thứ tự quan trọng: xóa markup có thể ghép lại thành header reserved. */
export class CompanionVisibleTextGuard {
  private readonly surface: CompanionSurfaceSanitizer
  private readonly questions: QuestionFenceGuard

  constructor(emit: (text: string) => void) {
    this.questions = new QuestionFenceGuard(emit)
    this.surface = new CompanionSurfaceSanitizer((text) => this.questions.push(text))
  }

  get issues(): VisibleTextIssue[] {
    const surface = this.surface.diagnostics
    const questions = this.questions.diagnostics
    return [
      ...(surface.markup ? (['markup'] as const) : []),
      ...(surface.internalId ? (['internal_id'] as const) : []),
      ...(questions.questionFence ? (['question_fence'] as const) : []),
      ...(surface.overflow || questions.overflow ? (['surface_overflow'] as const) : []),
    ]
  }

  push(delta: string): void {
    this.surface.push(delta)
  }

  end(): void {
    this.surface.end()
    this.questions.end()
  }

  abort(): void {
    this.surface.abort()
    this.questions.abort()
  }
}

export function sanitizeCompanionVisibleText(reply: string) {
  let text = ''
  const guard = new CompanionVisibleTextGuard((delta) => (text += delta))
  guard.push(reply)
  guard.end()
  return { text, issues: guard.issues }
}
