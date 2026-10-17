import { z } from 'zod'
import { wrapContextBlocks } from '@dhcb/core-personal/companionPrompt'
import { toToolData } from '@dhcb/core-personal/companionTools'
import { CompanionVisibleTextGuard } from '@dhcb/core-personal/companionVisibleText'
import { SURFACE_PENDING_LIMIT } from '@dhcb/core-personal/companionSurfaceSanitizer'
import { extractInteractiveQuestions } from '@dhcb/core-contracts/interactiveQuestion'
import type { BoundaryCase } from './companionBoundaryCorpus.js'
import type { BoundaryObservation } from './companionBoundaryEval.js'

type PromptCase = Extract<BoundaryCase, { kind: 'prompt_wrapping' }>
type StreamCase = Extract<BoundaryCase, { kind: 'stream_surface' }>
function sameSet(a: readonly string[], b: readonly string[]) {
  return a.length === b.length && a.every((value) => b.includes(value))
}
function contextBody(input: string, nonce: string) {
  const open = `<du_lieu_${nonce} nguon="validated_derived_memory">\n`
  const close = `\n</du_lieu_${nonce}>`
  const out = wrapContextBlocks([{ source: 'validated_derived_memory', content: input }], nonce)
  const start = out.indexOf(open)
  const end = out.lastIndexOf(close)
  if (start < 0 || end < start + open.length) throw new Error('WRAPPER_TOPOLOGY_INVALID')
  return { body: out.slice(start + open.length, end), out }
}
/** Oracle literal lấy từ JSON đã review, không tính expected bằng sanitizer production. */
export function executePromptBoundary(c: PromptCase): BoundaryObservation {
  if (c.input.surface === 'note_tool') throw new Error('NOTE_TOOL_REQUIRES_PG')
  if (c.input.surface === 'context') {
    const input = z.string().parse(c.input.value)
    const { body, out } = contextBody(input, c.input.nonce)
    const closings = out.split(`</du_lieu_${c.input.nonce}>`).length - 1
    const stable = contextBody(body, c.input.nonce).body === body
    return {
      checks: [
        { name: 'literal', ok: body === c.expected.literal },
        { name: 'wrapper_topology', ok: closings === c.expected.wrapperClosings },
        { name: 'idempotence', ok: stable === c.expected.idempotent },
      ],
    }
  }
  const out = toToolData(c.input.value)
  let stable = false
  try {
    stable = toToolData(z.json().parse(JSON.parse(out))) === out
  } catch {
    /* Truncated JSON không parse lại được. */
  }
  return {
    checks: [
      { name: 'literal', ok: out === c.expected.literal },
      { name: 'idempotence', ok: stable === c.expected.idempotent },
    ],
  }
}
function retainedStateIsBounded(guard: CompanionVisibleTextGuard) {
  const surface: unknown = Reflect.get(guard, 'surface')
  const questions: unknown = Reflect.get(guard, 'questions')
  const pending = (value: unknown) => {
    if (typeof value !== 'object' || value === null) return null
    const text: unknown = Reflect.get(value, 'pending')
    return typeof text === 'string' ? text.length : null
  }
  const lengths = [pending(surface), pending(questions)]
  return lengths.every((length) => length !== null && length <= SURFACE_PENDING_LIMIT)
}
function hasStandaloneUuid(text: string): boolean {
  const asciiWord = (char: string | undefined) => char !== undefined && /[A-Za-z0-9_]/.test(char)
  // Oracle riêng trên prefix đã phát; không import regex hoặc sanitizer production.
  for (const match of text.matchAll(
    /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/g,
  )) {
    if (!asciiWord(text[match.index - 1]) && !asciiWord(text[match.index + match[0].length]))
      return true
  }
  return false
}
export function executeStreamBoundary(c: StreamCase): BoundaryObservation {
  const emitted: string[] = []
  const issues = new Set<string>()
  let bounded = true
  let prefixSafe = true
  let checkpoint = c.expected.checkpoint === undefined
  const emit = (text: string) => {
    emitted.push(text)
    const prefix = emitted.join('')
    if (
      hasStandaloneUuid(prefix) ||
      c.expected.forbiddenPrefixes.some((forbidden) => prefix.includes(forbidden))
    )
      prefixSafe = false
  }
  let guard = new CompanionVisibleTextGuard(emit)
  for (const [i, fragment] of c.input.fragments.entries()) {
    guard.push(fragment)
    bounded = bounded && retainedStateIsBounded(guard)
    if (c.expected.checkpoint?.afterFragment === i)
      checkpoint = emitted.join('').includes(c.expected.checkpoint.includes)
  }
  if (c.input.termination === 'end') guard.end()
  else guard.abort()
  for (const issue of guard.issues) issues.add(issue)
  let raw = c.input.fragments.join('')
  if (c.input.termination === 'fallback') {
    guard = new CompanionVisibleTextGuard(emit)
    raw = (c.input.fallbackFragments ?? []).join('')
    for (const fragment of c.input.fallbackFragments ?? []) {
      guard.push(fragment)
      bounded = bounded && retainedStateIsBounded(guard)
    }
    guard.end()
    for (const issue of guard.issues) issues.add(issue)
  }
  bounded = bounded && retainedStateIsBounded(guard)
  const questions =
    c.input.termination === 'abort' ? [] : extractInteractiveQuestions(raw).questions
  return {
    checks: [
      { name: 'literal', ok: emitted.join('') === c.expected.literal },
      { name: 'prefix_safe', ok: prefixSafe && bounded },
      { name: 'prefix_before_eof', ok: checkpoint },
      { name: 'issues', ok: sameSet([...issues], c.expected.issues) },
      {
        name: 'questions',
        ok:
          questions.length === c.expected.questionCount &&
          (!c.expected.questions ||
            JSON.stringify(questions) === JSON.stringify(c.expected.questions)),
      },
    ],
  }
}
