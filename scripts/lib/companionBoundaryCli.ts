import { parseArgs } from 'node:util'
import { resolve } from 'node:path'
import { z } from 'zod'

const OptionsSchema = z
  .object({
    profile: z.enum(['stored-local', 'github-ci']),
    artifacts: z.string().min(1),
    corpus: z.string().min(1),
    cleanupManifest: z.string().min(1).optional(),
  })
  .strict()
export type BoundaryCliOptions = z.infer<typeof OptionsSchema>
export function parseBoundaryOptions(
  args: readonly string[],
  defaultCorpus: string,
): BoundaryCliOptions {
  const { values } = parseArgs({
    args: [...args],
    options: {
      profile: { type: 'string' },
      artifacts: { type: 'string' },
      corpus: { type: 'string' },
      'cleanup-manifest': { type: 'string' },
    },
    strict: true,
    allowPositionals: false,
  })
  const options = OptionsSchema.parse({
    profile: values.profile,
    artifacts: values.artifacts,
    corpus: values.corpus ?? defaultCorpus,
    ...(values['cleanup-manifest'] ? { cleanupManifest: values['cleanup-manifest'] } : {}),
  })
  return {
    ...options,
    artifacts: resolve(options.artifacts),
    corpus: resolve(options.corpus),
    ...(options.cleanupManifest ? { cleanupManifest: resolve(options.cleanupManifest) } : {}),
  }
}
/** Allowlist child trước Node bootstrap/import cache; không chuyển key/provider/debug/PG defaults/.env. */
export function boundaryChildEnvironment(environment: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  const result: NodeJS.ProcessEnv = {
    NODE_ENV: 'test',
    STORAGE_DRIVER: 'local',
    NODE_OPTIONS: '--max-old-space-size=4096',
  }
  for (const name of [
    'PATH',
    'HOME',
    'TMPDIR',
    'TEMP',
    'TMP',
    'SystemRoot',
    'SYSTEMROOT',
    'WINDIR',
    'CI',
    'GITHUB_ACTIONS',
    'RUNNER_TEMP',
  ] as const) {
    if (environment[name] !== undefined) result[name] = environment[name]
  }
  if (environment.STORED_EVAL_DATABASE_URL !== undefined)
    result.STORED_EVAL_DATABASE_URL = environment.STORED_EVAL_DATABASE_URL
  return result
}
