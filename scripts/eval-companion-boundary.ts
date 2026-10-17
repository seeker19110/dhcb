// Entry chỉ dùng parser thuần; child scrub môi trường trước mọi module app/SDK/pg.
import { spawn } from 'node:child_process'
import { resolve } from 'node:path'
import { boundaryChildEnvironment, parseBoundaryOptions } from './lib/companionBoundaryCli'

try {
  if (Number(process.versions.node.split('.')[0]) !== 22) throw new Error('NODE22_REQUIRED')
  const options = parseBoundaryOptions(
    process.argv.slice(2),
    resolve(import.meta.dirname, 'companion-boundary-corpus.json'),
  )
  const args = [
    '--import',
    'tsx',
    resolve(import.meta.dirname, 'companion-boundary-worker.ts'),
    '--profile',
    options.profile,
    '--artifacts',
    options.artifacts,
    '--corpus',
    options.corpus,
    ...(options.cleanupManifest ? ['--cleanup-manifest', options.cleanupManifest] : []),
  ]
  const child = spawn(process.execPath, args, {
    cwd: resolve(import.meta.dirname, '..'),
    env: boundaryChildEnvironment(process.env),
    stdio: 'inherit',
    timeout: 12 * 60_000,
    killSignal: 'SIGTERM',
  })
  let spawnFailed = false
  child.once('error', () => {
    spawnFailed = true
    console.error('FAIL: không khởi động được worker đã cô lập môi trường')
    process.exitCode = 2
  })
  child.once('close', (code) => {
    if (!spawnFailed) process.exitCode = typeof code === 'number' && code >= 0 ? code : 1
  })
} catch {
  console.error(
    'FAIL: cần Node22, --profile stored-local|github-ci và --artifacts; chỉ dùng STORED_EVAL_DATABASE_URL cho DB disposable',
  )
  process.exitCode = 2
}
