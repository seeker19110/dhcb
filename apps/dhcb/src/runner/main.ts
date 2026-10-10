// Điểm vào của `runner.html` — trang chạy code học viên ở origin riêng `run.…`. Chỉ nối lõi
// runnerHost.ts với `window` thật; mọi logic nằm trong runnerHost.ts (có test).
import { runWorkerLane, resetWorkerLanes } from '../lib/workerLanes'
import { startRunner } from './runnerHost'

const handle = startRunner({
  parentParam: new URLSearchParams(window.location.search).get('parent'),
  parentWindow: window.parent,
  selfWindow: window,
  post: (event, targetOrigin) => window.parent.postMessage(event, targetOrigin),
  runLane: runWorkerLane,
  resetLanes: resetWorkerLanes,
})

if (handle) {
  window.addEventListener('message', (e) =>
    handle({ origin: e.origin, source: e.source, data: e.data }),
  )
}
