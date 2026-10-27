// @vitest-environment node
// Canh hướng dẫn dựng môi trường cloud (audit 2026-10-26, AUD-DOC-001): AGENTS.md và
// docs/CODEX_CLOUD_SETUP.md bảo chạy `bash scripts/codex-cloud-*.sh` nhưng hai file từng chỉ nằm ở
// `scripts/archive/` — làm đúng hướng dẫn thì checkout mới không bootstrap được.
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const DOCS = ['AGENTS.md', 'docs/CODEX_CLOUD_SETUP.md']

function referencedScripts(): string[] {
  const found = new Set<string>()
  for (const doc of DOCS)
    for (const m of readFileSync(doc, 'utf8').matchAll(/bash (scripts\/[\w./-]+\.sh)/g))
      if (m[1]) found.add(m[1])
  return [...found]
}

describe('Script cloud mà tài liệu nhắc tới', () => {
  const scripts = referencedScripts()

  it('tài liệu có nhắc script setup và maintenance', () => {
    expect(scripts).toEqual(
      expect.arrayContaining([
        'scripts/codex-cloud-setup.sh',
        'scripts/codex-cloud-maintenance.sh',
      ]),
    )
  })

  it.each(scripts)('%s tồn tại và tính PROJECT_DIR ra đúng gốc repo', (script) => {
    expect(existsSync(script)).toBe(true)
    const text = readFileSync(script, 'utf8')
    // Script dùng `dirname/..` làm gốc dự án ⇒ phải nằm ngay dưới scripts/ thì `..` mới là gốc.
    expect(text).toContain('PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"')
    expect(existsSync(path.join(path.dirname(script), '..', 'package.json'))).toBe(true)
    expect(path.dirname(script)).toBe('scripts')
  })
})
