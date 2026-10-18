// @vitest-environment node
// Native Node22 regression cho predicate thật; không import worker/Pool hoặc gọi DB/provider.
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { dirname, resolve } from 'node:path'
import { expect, it } from 'vitest'
import { z } from 'zod'
import { boundaryChildEnvironment } from './lib/companionBoundaryCli.js'

const Hash = z.string().regex(/^[a-f0-9]{64}$/)
const Observation = z
  .object({
    nodeMajor: z.literal(22),
    nativeEnvPrototypeDiffers: z.literal(true),
    accepted: z.boolean(),
    extraOwnKeys: z.number().int().nonnegative(),
    sameOwnValues: z.boolean(),
    guardSha256: Hash,
  })
  .strict()
const require = createRequire(import.meta.url)
const worker = readFileSync(new URL('./retrieval-benchmark-worker.ts', import.meta.url), 'utf8')
const guard = /if\s*\((!isDeepStrictEqual[\s\S]*?)\)\s*throw new Error\('UNSCRUBBED_ENV'\)/.exec(
  worker,
)?.[1]
if (
  !guard ||
  !/^!isDeepStrictEqual\(\s*(?:process\.env|\{\s*\.\.\.process\.env\s*\})\s*,\s*boundaryChildEnvironment\(process\.env\),?\s*\)$/.test(
    guard,
  )
) {
  throw new Error('ENV_GUARD_SOURCE_SHAPE_CHANGED')
}
const guardSha256 = createHash('sha256').update(guard).digest('hex')
// Cùng realm trong native child: không để VM Object.prototype tạo lại lỗi khác.
// Hàm policy là actual S04 export, không viết bản allowlist giả để làm expected.
const code = `
import { isDeepStrictEqual } from 'node:util';
const boundaryChildEnvironment = (${boundaryChildEnvironment.toString()});
const allowed = boundaryChildEnvironment(process.env);
const own = { ...process.env };
const rejected = (${guard});
console.log(JSON.stringify({
  nodeMajor: Number(process.versions.node.split('.')[0]),
  nativeEnvPrototypeDiffers: Object.getPrototypeOf(process.env) !== Object.prototype,
  accepted: !rejected,
  extraOwnKeys: Object.keys(own).filter((key) => !Object.hasOwn(allowed, key)).length,
  sameOwnValues: Object.keys(own).length === Object.keys(allowed).length && Object.keys(own).every((key) => own[key] === allowed[key]),
  guardSha256: '${guardSha256}',
}));`

for (const bootstrap of ['native', 'tsx'] as const) {
  it.each(['clean', 'extra_key', 'wrong_fixed_value'] as const)(
    `native process.env ${bootstrap}: %s`,
    (variant) => {
      expect(Number(process.versions.node.split('.')[0])).toBe(22)
      const scratch = mkdtempSync(resolve(tmpdir(), 'dhcb-retrieval-env-'))
      try {
        const environment = boundaryChildEnvironment({
          PATH: process.env.PATH,
          HOME: scratch,
          TMPDIR: scratch,
        })
        if (variant === 'extra_key') environment.S05_UNEXPECTED_ENV_CANARY = 'synthetic'
        if (variant === 'wrong_fixed_value') environment.STORAGE_DRIVER = 'unexpected'
        const child = spawnSync(
          process.execPath,
          [
            ...(bootstrap === 'tsx' ? ['--import', 'tsx'] : []),
            '--input-type=module',
            '--eval',
            code,
          ],
          {
            cwd: resolve(dirname(require.resolve('tsx/package.json')), '../..'),
            env: environment,
            encoding: 'utf8',
            timeout: 5000,
            maxBuffer: 16_384,
          },
        )
        // Không in child env, error/stderr hoặc source code khi bootstrap thất bại.
        expect(child.error === undefined).toBe(true)
        expect(child.status).toBe(0)
        expect(child.signal).toBeNull()
        const raw: unknown = JSON.parse(child.stdout)
        const observed = Observation.parse(raw)
        expect(observed.guardSha256).toBe(guardSha256)
        expect(observed.accepted).toBe(variant === 'clean')
        expect(observed.extraOwnKeys).toBe(variant === 'extra_key' ? 1 : 0)
        expect(observed.sameOwnValues).toBe(variant === 'clean')
      } finally {
        rmSync(scratch, { recursive: true, force: true })
      }
    },
  )
}
