// Chỉ lời văn của Companion, không áp dụng lên DTO actions/questions/context.
// Giữ suffix còn có thể thành markup/UUID; dữ liệu chắc chắn literal được phát ngay.
export const SURFACE_PENDING_LIMIT = 256
export const SURFACE_FRAME_LIMIT = 16

const UUID_SHAPE = 'hhhhhhhh-hhhh-hhhh-hhhh-hhhhhhhhhhhh'
const UUID = /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi
// invoke/parameter mở cần ký tự kế tiếp không phải word, không coi cuối pending là EOF.
const TAG_PREFIX =
  /<\/?(?:du_lieu_|tool_use|tool_result|function_calls|antml:[a-z_])|<(?:invoke|parameter)(?=[^\w])|<\/(?:invoke|parameter)>/i
const TAG_STARTS = [
  '<du_lieu_',
  '</du_lieu_',
  '<tool_use',
  '</tool_use',
  '<tool_result',
  '</tool_result',
  '<function_calls',
  '</function_calls',
  '<antml:',
  '</antml:',
  '<invoke',
  '<parameter',
  '</invoke>',
  '</parameter>',
] as const

const word = (char: string | undefined) => char !== undefined && /^[a-z0-9_]$/i.test(char)
const hex = (char: string) => /^[0-9a-f]$/i.test(char)

function uuidPrefix(text: string): boolean {
  if (!text || text.length > UUID_SHAPE.length) return false
  for (let index = 0; index < text.length; index++) {
    if (UUID_SHAPE[index] === '-' ? text[index] !== '-' : !hex(text[index]!)) return false
  }
  return true
}

function possibleSuffix(text: string, leftWord: boolean): number | undefined {
  for (let index = Math.max(0, text.length - UUID_SHAPE.length); index < text.length; index++) {
    const suffix = text.slice(index)
    if (suffix[0] === '<' && TAG_STARTS.some((start) => start.startsWith(suffix.toLowerCase())))
      return index
    const precededByWord = index === 0 ? leftWord : word(text[index - 1])
    if (!precededByWord && uuidPrefix(suffix)) return index
  }
  return undefined
}

/** Giả bỏ suffix có thể bị xóa để giữ cả prefix bên ngoài, ví dụ <tool_<t. */
function frontier(text: string, leftWord: boolean): { index: number; overflow: boolean } {
  let end = text.length
  let frames = 0
  for (;;) {
    const start = possibleSuffix(text.slice(0, end), leftWord)
    if (start === undefined) return { index: end, overflow: false }
    if (++frames > SURFACE_FRAME_LIMIT) return { index: 0, overflow: true }
    end = start
  }
}

export class CompanionSurfaceSanitizer {
  private pending = ''
  private leftWord = false
  private discardingTag = false
  private closed = false
  private markup = false
  private internalId = false
  private overBudget = false

  constructor(private readonly emit: (text: string) => void) {}

  get diagnostics() {
    return { markup: this.markup, internalId: this.internalId, overflow: this.overBudget }
  }

  push(delta: string): void {
    if (this.closed || this.overBudget) return
    let batch = ''
    let offset = 0
    while (offset < delta.length && !this.overBudget) {
      if (this.discardingTag) {
        const end = delta.indexOf('>', offset)
        if (end === -1) break
        offset = end + 1
        this.discardingTag = false
        batch += this.takeStable(false)
        continue
      }
      const char = delta[offset++]!
      if (!this.pending && char !== '<' && (!hex(char) || this.leftWord)) {
        batch += char
        this.leftWord = word(char)
        continue
      }
      this.pending += char
      batch += this.takeStable(false)
    }
    // Candidate UUID cùng ký tự chứng minh nó thuộc một từ phải ở cùng callback.
    if (batch) this.emit(batch)
  }

  end(): void {
    if (this.closed) return
    this.closed = true
    if (!this.overBudget) {
      const batch = this.takeStable(true)
      if (batch) this.emit(batch)
    }
    this.pending = ''
    this.discardingTag = false
  }

  abort(): void {
    this.closed = true
    this.pending = ''
    this.discardingTag = false
  }

  private overflow(): void {
    // DEBT: bỏ lời văn còn lại khi nesting mơ hồ vượt ngân sách | trần: 256 ký tự/16 frame | xem lại khi: corpus benign hợp lệ chạm trần
    this.overBudget = true
    this.pending = ''
    this.discardingTag = false
  }

  private takeStable(final: boolean): string {
    this.reduce(final)
    if (this.overBudget) return ''
    const held = final
      ? { index: this.pending.length, overflow: false }
      : frontier(this.pending, this.leftWord)
    if (held.overflow || this.pending.length - held.index > SURFACE_PENDING_LIMIT) {
      this.overflow()
      return ''
    }
    const literal = this.pending.slice(0, held.index)
    this.pending = this.pending.slice(held.index)
    if (literal) this.leftWord = word(literal.at(-1))
    return literal
  }

  private reduce(final: boolean): void {
    for (;;) {
      const tag = TAG_PREFIX.exec(this.pending)
      if (tag) {
        const end = this.pending.indexOf('>', tag.index)
        this.markup = true
        if (end === -1) {
          // Prefix đã là markup cấm: không đệm thuộc tính, kể cả khi tag chưa đóng.
          this.pending = this.pending.slice(0, tag.index)
          this.discardingTag = true
        } else this.pending = this.pending.slice(0, tag.index) + this.pending.slice(end + 1)
        continue
      }
      const held = final
        ? { index: this.pending.length, overflow: false }
        : frontier(this.pending, this.leftWord)
      if (held.overflow || this.pending.length - held.index > SURFACE_PENDING_LIMIT) {
        this.overflow()
        return
      }
      let removed = false
      for (const match of this.pending.matchAll(UUID)) {
        if (match.index === 0 && this.leftWord) continue
        const end = match.index + match[0].length
        // Boundary phải có thể biến mất sau một tag/chunk sau; chỉ kết luận khi ổn định.
        if (!final && (end === this.pending.length || end >= held.index)) continue
        this.pending = this.pending.slice(0, match.index) + this.pending.slice(end)
        this.internalId = true
        removed = true
        break
      }
      if (!removed) return
    }
  }
}
