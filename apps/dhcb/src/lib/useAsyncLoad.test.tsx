// useAsyncLoad.test.tsx — hook tải có trạng thái tải / lỗi / sẵn sàng tách bạch (changelog 0525).
import { describe, it, expect, vi, afterEach } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { useAsyncLoad, type AsyncLoadOptions, type AsyncLoadState } from './useAsyncLoad'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

let root: Root | null = null
let container: HTMLDivElement | null = null

afterEach(async () => {
  if (root) await act(async () => root?.unmount())
  container?.remove()
  root = null
  container = null
})

type Probe<T> = { state: AsyncLoadState<T>; retry: () => void }

async function renderHook<T>(loader: () => Promise<T>, options?: AsyncLoadOptions) {
  const latest: { current: Probe<T> | null } = { current: null }
  function Harness({ load }: { load: () => Promise<T> }) {
    latest.current = useAsyncLoad(load, options)
    return null
  }
  container = document.createElement('div')
  document.body.appendChild(container)
  const r = createRoot(container)
  root = r
  await act(async () => r.render(<Harness load={loader} />))
  return {
    latest,
    rerender: async (next: () => Promise<T>) => {
      await act(async () => r.render(<Harness load={next} />))
    },
  }
}

describe('useAsyncLoad', () => {
  it('tải xong → ready kèm dữ liệu', async () => {
    const { latest } = await renderHook(() => Promise.resolve([1, 2]))
    expect(latest.current?.state).toEqual({ status: 'ready', data: [1, 2] })
  })

  it('đang chờ → loading', async () => {
    const { latest } = await renderHook(() => new Promise<number>(() => {}))
    expect(latest.current?.state).toEqual({ status: 'loading' })
  })

  it('lỗi mạng → error với câu thân thiện, KHÔNG phải ready rỗng', async () => {
    const { latest } = await renderHook(() => Promise.reject(new TypeError('Failed to fetch')))
    expect(latest.current?.state).toEqual({
      status: 'error',
      message: 'Không kết nối được máy chủ — kiểm tra mạng rồi thử lại.',
    })
  })

  it('lỗi kỹ thuật không dịch được → dùng errorMessage, theo lang', async () => {
    const { latest } = await renderHook(() => Promise.reject(new Error('ECONNRESET')), {
      errorMessage: 'Could not load.',
      lang: 'en',
    })
    expect(latest.current?.state).toEqual({ status: 'error', message: 'Could not load.' })
  })

  it('retry → về loading ngay rồi gọi lại loader', async () => {
    const loader = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(new Error('HTTP 503'))
      .mockResolvedValueOnce('ok')
    const { latest } = await renderHook(loader)
    expect(latest.current?.state.status).toBe('error')

    await act(async () => latest.current?.retry())
    expect(loader).toHaveBeenCalledTimes(2)
    expect(latest.current?.state).toEqual({ status: 'ready', data: 'ok' })
  })

  it('đổi loader (vd đổi tham số URL) → bỏ kết quả cũ, tải lại', async () => {
    const { latest, rerender } = await renderHook(() => Promise.resolve('a'))
    expect(latest.current?.state).toEqual({ status: 'ready', data: 'a' })
    await rerender(() => Promise.resolve('b'))
    expect(latest.current?.state).toEqual({ status: 'ready', data: 'b' })
  })

  it('kết quả về SAU khi unmount → không setState (không cảnh báo, không ném)', async () => {
    let resolve: (v: string) => void = () => {}
    const { latest } = await renderHook(() => new Promise<string>((r) => (resolve = r)))
    await act(async () => root?.unmount())
    root = null
    resolve('muộn')
    await Promise.resolve()
    expect(latest.current?.state).toEqual({ status: 'loading' })
  })

  it('lỗi về SAU khi unmount → bỏ qua', async () => {
    let reject: (e: Error) => void = () => {}
    const { latest } = await renderHook(() => new Promise<string>((_, rj) => (reject = rj)))
    await act(async () => root?.unmount())
    root = null
    reject(new Error('muộn'))
    await Promise.resolve()
    expect(latest.current?.state).toEqual({ status: 'loading' })
  })
})
