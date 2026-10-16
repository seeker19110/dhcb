import {
  INTERACTIVE_QUESTION_FENCE,
  isInteractiveQuestionHeader,
} from '@dhcb/core-contracts/interactiveQuestion'
import { SURFACE_PENDING_LIMIT } from './companionSurfaceSanitizer.js'

const lineBreak = (char: string) => /[\r\n\u2028\u2029]/.test(char)

function possibleHeader(text: string): boolean {
  if (text.length < 3) return '```'.startsWith(text)
  if (!text.startsWith('```')) return false
  const label = text.slice(3).replace(/^[ \t]*/, '')
  if (INTERACTIVE_QUESTION_FENCE.startsWith(label)) return true
  return (
    label.startsWith(INTERACTIVE_QUESTION_FENCE) &&
    /^[ \t]*\r?$/.test(label.slice(INTERACTIVE_QUESTION_FENCE.length))
  )
}

/** Chỉ giữ header reserved ở đầu dòng; JSON phía sau không bao giờ là lời văn. */
export class QuestionFenceGuard {
  private pending = ''
  private lineStart = true
  private swallowing = false
  private closed = false
  private overflow = false

  constructor(private readonly emit: (text: string) => void) {}

  get diagnostics() {
    return { questionFence: this.swallowing && !this.overflow, overflow: this.overflow }
  }

  push(delta: string): void {
    if (this.closed || this.swallowing) return
    let batch = ''
    for (const char of delta) {
      if (this.pending.endsWith('\r') && char !== '\n') {
        batch += this.pending
        this.pending = ''
        this.lineStart = true
      }
      if (this.pending) {
        if (char === '\n' && isInteractiveQuestionHeader(this.pending)) {
          this.pending = ''
          this.swallowing = true
          break
        }
        this.pending += char
        if (possibleHeader(this.pending)) {
          if (this.pending.length > SURFACE_PENDING_LIMIT) {
            // DEBT: header không kết thúc bị giữ vô hạn | trần: 256 ký tự | xem lại khi: header benign chạm trần
            this.pending = ''
            this.overflow = this.swallowing = true
            break
          }
          continue
        }
        batch += this.pending
        this.pending = ''
        this.lineStart = lineBreak(char)
      } else if (this.lineStart && char === '`') this.pending = char
      else {
        batch += char
        if (char !== ' ' && char !== '\t') this.lineStart = lineBreak(char)
      }
    }
    if (batch) this.emit(batch)
  }

  end(): void {
    if (this.closed) return
    this.closed = true
    if (this.pending) this.emit(this.pending)
    this.pending = ''
  }

  abort(): void {
    this.closed = true
    this.pending = ''
  }
}
