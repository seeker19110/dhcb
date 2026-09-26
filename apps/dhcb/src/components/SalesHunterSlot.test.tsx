// @vitest-environment happy-dom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { expect, it, vi } from 'vitest'
import SalesHunterSlot from './SalesHunterSlot'

vi.mock('./SalesHunterEntry', () => ({
  default: () => {
    throw new Error('simulated optional Sales chunk failure')
  },
}))

it('isolates an optional Sales render failure from the existing application', async () => {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  const errorLog = vi.spyOn(console, 'error').mockImplementation(() => {})
  try {
    await act(async () => {
      root.render(
        <>
          <h1>Ứng dụng Đồng Hành vẫn hoạt động</h1>
          <SalesHunterSlot />
        </>,
      )
    })
    expect(container.textContent).toContain('Ứng dụng Đồng Hành vẫn hoạt động')
    expect(container.textContent).not.toContain('simulated optional Sales chunk failure')
  } finally {
    await act(async () => root.unmount())
    errorLog.mockRestore()
    container.remove()
  }
})
