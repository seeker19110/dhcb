// @vitest-environment node
// Launcher mock: không tạo process thật, không DB/network/provider.
import { ChildProcess } from 'node:child_process'
import { beforeEach, afterEach, expect, it, vi } from 'vitest'
const mocks = vi.hoisted(() => ({ spawn: vi.fn() }))
vi.mock('node:child_process', async (original) => ({
  ...(await original<typeof import('node:child_process')>()),
  spawn: mocks.spawn,
}))
const nativeProcess = process
let child: ChildProcess
let fakeProcess: typeof process
beforeEach(() => {
  vi.resetModules()
  child = new ChildProcess()
  mocks.spawn.mockReturnValue(child)
  fakeProcess = {
    ...nativeProcess,
    versions: { ...nativeProcess.versions, node: '22.23.2' },
    argv: ['node', 'launcher', '--profile', 'stored-local', '--artifacts', '/tmp/unit-artifacts'],
    env: {
      PATH: '/unit/path',
      HOME: '/unit/home',
      CI: 'false',
      STORED_EVAL_DATABASE_URL: 'UNIT_NOT_A_REAL_URL',
      DATABASE_URL: 'DROPPED_DB',
      GEMINI_API_KEY: 'DROPPED_KEY',
      ANTHROPIC_API_KEY: 'DROPPED_KEY',
      OPENAI_API_KEY: 'DROPPED_KEY',
      NODE_OPTIONS: '--import UNIT_FORBIDDEN',
      PGHOST: 'remote.invalid',
      HTTP_PROXY: 'remote.invalid',
    },
    exitCode: undefined,
  }
  vi.stubGlobal('process', fakeProcess)
  vi.spyOn(console, 'error').mockImplementation(() => {})
})
afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  mocks.spawn.mockReset()
})
const load = () => import('./eval-memory-retrieval.js')
it('scrub allowlist trước bootstrap, flags đầy đủ, deadline12 phút', async () => {
  await load()
  const [executable, args, options] = mocks.spawn.mock.calls[0]!
  expect(executable).toBe(nativeProcess.execPath)
  expect(args.slice(0, 2)).toEqual(['--import', 'tsx'])
  expect(args).toContain('--corpus')
  expect(args).toContain('--profile')
  expect(options.timeout).toBe(720000)
  expect(options.killSignal).toBe('SIGTERM')
  expect(options.env.STORED_EVAL_DATABASE_URL).toBe('UNIT_NOT_A_REAL_URL')
  expect(options.env.NODE_OPTIONS).toBe('--max-old-space-size=4096')
  for (const name of [
    'DATABASE_URL',
    'GEMINI_API_KEY',
    'ANTHROPIC_API_KEY',
    'OPENAI_API_KEY',
    'PGHOST',
    'HTTP_PROXY',
  ])
    expect(options.env[name]).toBeUndefined()
  child.emit('close', 0)
  expect(fakeProcess.exitCode).toBe(0)
})
it.each(['--ids', '--skip-cleanup', '--skip-context', '--quality-floor'])(
  'không có cờ bypass/selection %s',
  async (flag) => {
    fakeProcess.argv.push(flag, '1')
    await load()
    expect(mocks.spawn).not.toHaveBeenCalled()
    expect(fakeProcess.exitCode).toBe(2)
  },
)
it('không hỗ trợ Node20', async () => {
  Object.defineProperty(fakeProcess.versions, 'node', { value: '20.0.0' })
  await load()
  expect(mocks.spawn).not.toHaveBeenCalled()
  expect(fakeProcess.exitCode).toBe(2)
})
it('signal hoặc killed child không trở thành success kể cả code0', async () => {
  await load()
  Object.defineProperty(child, 'killed', { value: true })
  child.emit('close', 0)
  expect(fakeProcess.exitCode).toBe(1)
})
it('spawn error giữ nonzero khi close tiếp theo là0, lỗi không bị log raw', async () => {
  await load()
  child.emit('error', new Error('SECRET_SENTINEL'))
  child.emit('close', 0)
  expect(fakeProcess.exitCode).toBe(2)
  expect(JSON.stringify(vi.mocked(console.error).mock.calls)).not.toContain('SECRET_SENTINEL')
})
it('cleanup-only vẫn chuyển manifest cụ thể qua child, không thêm bypass', async () => {
  fakeProcess.argv.push('--cleanup-manifest', '/tmp/unit-manifest.json')
  await load()
  expect(mocks.spawn.mock.calls[0]?.[1]).toContain('--cleanup-manifest')
})
