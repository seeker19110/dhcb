// @vitest-environment node
// Chặn nâng CI nhưng bỏ sót launcher, worker hoặc môi trường phát triển.
import { readFileSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { expect, it } from 'vitest'

const root = resolve(import.meta.dirname, '..')
const read = (name: string) => readFileSync(resolve(root, name), 'utf8')

it('Node 24 nhất quán giữa nvm, engines, CI và runner bằng chứng', () => {
  expect(read('.nvmrc').trim()).toBe('24')
  expect(JSON.parse(read('package.json')).engines.node).toBe('>=24.0.0')
  const versions = [...read('.github/workflows/ci.yml').matchAll(/node-version: (\d+)/g)]
  expect(versions.length).toBeGreaterThan(0)
  expect(versions.every((match) => match[1] === '24')).toBe(true)
  for (const path of [
    'scripts/eval-companion-boundary.ts',
    'scripts/eval-memory-retrieval.ts',
    'scripts/retrieval-benchmark-worker.ts',
  ]) {
    expect(read(path)).toContain("Number(process.versions.node.split('.')[0]) !== 24")
    expect(read(path)).toContain('NODE24_REQUIRED')
  }
})

it.each([false, true])('deploy kiểm runtime trước mọi thao tác git: hợp lệ=%s', (valid) => {
  const scratch = mkdtempSync(resolve(tmpdir(), 'dhcb-runtime-'))
  try {
    // Chỉ stub node và git. Git dừng ngay tại fetch đầu tiên, không deploy thật.
    writeFileSync(resolve(scratch, 'node'), `#!/bin/sh\necho ${valid}\n`, { mode: 0o755 })
    writeFileSync(resolve(scratch, 'git'), '#!/bin/sh\necho GIT_REACHED\nexit 73\n', {
      mode: 0o755,
    })
    const child = spawnSync('bash', [resolve(root, 'scripts/deploy.sh')], {
      env: {
        PATH: `${scratch}:${process.env.PATH}`,
        APP_DIR: scratch,
        GITHUB_TOKEN: 'synthetic-test-only',
      },
      encoding: 'utf8',
      timeout: 5000,
    })
    expect(child.error).toBeUndefined()
    expect(child.status).toBe(valid ? 73 : 1)
    expect(child.stdout.includes('GIT_REACHED')).toBe(valid)
  } finally {
    rmSync(scratch, { recursive: true, force: true })
  }
})
