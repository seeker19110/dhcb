// Không cấu hình VITE_CODE_RUNNER_ORIGIN (dev, unit test, đường lui): chạy thẳng Worker trong
// trang qua workerLanes — không tạo iframe nào.
import { describe, expect, it, vi } from 'vitest'

const lanes = vi.hoisted(() => ({
  runWorkerLane: vi.fn(async () => ({ output: 'ok', timedOut: false, durationMs: 1 })),
  resetWorkerLanes: vi.fn(),
}))
vi.mock('./workerLanes', () => lanes)

import { getRunnerOrigin, resetSandboxedLanes, runSandboxedLane } from './runnerBridge'

describe('runnerBridge khi chưa cấu hình runner', () => {
  it('chạy và dọn bằng Worker trong trang, không tạo iframe', async () => {
    expect(getRunnerOrigin()).toBeNull()
    const onOutput = vi.fn()
    const req = { lane: 'javascript', code: 'x' } as const
    await expect(runSandboxedLane(req, { onOutput })).resolves.toMatchObject({ output: 'ok' })
    expect(lanes.runWorkerLane).toHaveBeenCalledWith(req, { onOutput })
    resetSandboxedLanes()
    expect(lanes.resetWorkerLanes).toHaveBeenCalledTimes(1)
    expect(document.querySelector('iframe')).toBeNull()
  })
})
