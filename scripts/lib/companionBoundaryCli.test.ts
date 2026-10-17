// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { boundaryChildEnvironment, parseBoundaryOptions } from './companionBoundaryCli'
describe('CLI không lấy prod env làm fallback', () => {
  it('bắt buộc explicit profile/artifacts, chặn option không biết/positionals', () => {
    expect(() => parseBoundaryOptions([], 'corpus.json')).toThrow()
    expect(() =>
      parseBoundaryOptions(['--profile', 'production', '--artifacts', '/tmp/a'], 'corpus.json'),
    ).toThrow()
    expect(() =>
      parseBoundaryOptions(
        ['--profile', 'stored-local', '--artifacts', '/tmp/a', '--database-url', 'secret'],
        'corpus.json',
      ),
    ).toThrow()
    expect(() =>
      parseBoundaryOptions(
        ['--profile', 'stored-local', '--artifacts', '/tmp/a', 'positional'],
        'corpus.json',
      ),
    ).toThrow()
    expect(
      parseBoundaryOptions(
        ['--profile', 'stored-local', '--artifacts', '/tmp/a'],
        '/tmp/corpus.json',
      ),
    ).toEqual({ profile: 'stored-local', artifacts: '/tmp/a', corpus: '/tmp/corpus.json' })
  })
  it('child chỉ nhận test URL riêng, không inheritedprod/provider/debug/preload', () => {
    const env = boundaryChildEnvironment({
      PATH: '/synthetic',
      HOME: '/synthetic',
      CI: 'true',
      GITHUB_ACTIONS: 'true',
      STORED_EVAL_DATABASE_URL: 'explicit-synthetic',
      DATABASE_URL: 'private-prod',
      DATABASE_URL_READ: 'private-read',
      PGHOST: 'remote',
      ANTHROPIC_API_KEY: 'private-key',
      GEMINI_API_KEY: 'private-key',
      REDIS_URL: 'private-redis',
      R2_SECRET_ACCESS_KEY: 'private-r2',
      SENTRY_DSN: 'private-telemetry',
      NODE_DEBUG: 'http',
      NODE_DEBUG_NATIVE: 'net',
      DEBUG: '*',
      NODE_OPTIONS: '--require secret-module',
      DOTENV_CONFIG_PATH: 'private-env',
      SKIP_AUTH: 'true',
    })
    expect(env).toEqual({
      NODE_ENV: 'test',
      STORAGE_DRIVER: 'local',
      NODE_OPTIONS: '--max-old-space-size=4096',
      PATH: '/synthetic',
      HOME: '/synthetic',
      CI: 'true',
      GITHUB_ACTIONS: 'true',
      STORED_EVAL_DATABASE_URL: 'explicit-synthetic',
    })
    expect(JSON.stringify(env)).not.toContain('private-')
  })
  it('không có explicit test URL thì child vẫn thiếu, không đọc DATABASE_URL', () => {
    expect(
      boundaryChildEnvironment({ DATABASE_URL: 'private-prod' }).STORED_EVAL_DATABASE_URL,
    ).toBeUndefined()
  })
})
