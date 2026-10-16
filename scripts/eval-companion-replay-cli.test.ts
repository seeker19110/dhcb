// @vitest-environment node
import { spawnSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import fixtures from './eval-companion-replay-fixtures.json'

const root = resolve(import.meta.dirname, '..')
const require = createRequire(join(root, 'package.json'))

function runCli(contents?: string) {
  const dir = mkdtempSync(join(tmpdir(), 'dhcb-companion-replay-'))
  try {
    const args = [
      '--import',
      require.resolve('tsx'),
      join(root, 'scripts/eval-companion-replay.ts'),
    ]
    if (contents !== undefined) {
      const file = join(dir, 'cassette.json')
      writeFileSync(file, contents)
      args.push(file)
    }
    const env: NodeJS.ProcessEnv = { TSX_TSCONFIG_PATH: join(root, 'tsconfig.api.json') }
    for (const key of ['PATH', 'SystemRoot', 'TEMP', 'TMP', 'TMPDIR']) {
      if (process.env[key]) env[key] = process.env[key]
    }
    return spawnSync(process.execPath, args, { cwd: root, env, encoding: 'utf8', timeout: 15_000 })
  } finally {
    rmSync(dir, { force: true, recursive: true })
  }
}

describe('CLI replay offline', () => {
  it('cassette mặc định chạy 7/7 và exit 0 trong tiến trình không có API key', () => {
    const result = runCli()
    expect(result.error).toBeUndefined()
    expect(result.status, result.stderr).toBe(0)
    expect(result.stdout).toContain('Replay provider tổng hợp: 7/7')
    expect(result.stdout).toContain('không phải eval model thật')
  })

  it('negative control: sai fingerprint của ca network_error phải exit 1', () => {
    const changed = structuredClone(fixtures)
    changed.cases.find((c) => c.group === 'malformed_json')!.exchanges[0]!.requestFingerprint =
      '0'.repeat(64)
    const result = runCli(JSON.stringify(changed))
    expect(result.error).toBeUndefined()
    expect(result.status).toBe(1)
    expect(result.stdout).toContain('REPLAY_INCOMPLETE')
    expect(result.stdout).toContain('6/7')
  })

  it.each(['{}', '{'])('schema/JSON hỏng không được thành công: %s', (contents) => {
    const result = runCli(contents)
    expect(result.error).toBeUndefined()
    expect(result.status).toBe(1)
    expect(result.stderr).toContain('FAIL')
  })
})
