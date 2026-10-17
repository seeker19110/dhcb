import { mkdir, open, rename } from 'node:fs/promises'
import { basename, dirname, join, resolve } from 'node:path'
import { randomUUID } from 'node:crypto'
import { z } from 'zod'

/** Chỉ local runner tạo đường dẫn; không nhận từ corpus/model/HTTP. */
export async function createBoundaryArtifacts(parent: string, runId: string) {
  z.string().uuid().parse(runId)
  const folder = resolve(parent, runId)
  await mkdir(folder, { recursive: false, mode: 0o700 })
  // Persist cả tên artifact root nếu caller vừa tạo các ancestor mới. Đây là fsync syscall, không thử mất điện.
  for (let ancestor = dirname(folder); ; ancestor = dirname(ancestor)) {
    const directory = await open(ancestor, 'r')
    try {
      await directory.sync()
    } finally {
      await directory.close()
    }
    if (ancestor === dirname(ancestor)) break
  }
  let busy = false
  let failed = false
  async function write(name: string, value: unknown): Promise<void> {
    if (busy || failed || !/^[a-z][a-z0-9-]*\.json$/.test(name) || basename(name) !== name)
      throw new Error('ARTIFACT_WRITER_INVALID_OR_BUSY')
    busy = true
    const temporary = join(folder, `.${name}.${randomUUID()}.tmp`)
    let timer: ReturnType<typeof setTimeout> | undefined
    const operation = async () => {
      const file = await open(temporary, 'wx', 0o600)
      try {
        await file.writeFile(JSON.stringify(value, null, 2) + '\n', 'utf8')
        await file.sync()
      } finally {
        await file.close()
      }
      await rename(temporary, join(folder, name))
      const directory = await open(dirname(temporary), 'r')
      try {
        await directory.sync()
      } finally {
        await directory.close()
      }
    }
    try {
      await Promise.race([
        operation(),
        new Promise<never>((_resolve, reject) => {
          timer = setTimeout(() => reject(new Error('ARTIFACT_WRITER_TIMEOUT')), 10_000)
        }),
      ])
    } catch {
      failed = true // Không mở thêm write/delete sau journal timeout chưa chứng minh đã kết thúc.
      // Giữ temp0600 để điều tra; không await thêm I/O trên filesystem đang lỗi/timeout.
      throw new Error('ARTIFACT_PERSIST_FAILED')
    } finally {
      if (timer) clearTimeout(timer)
      busy = false
    }
  }
  return { folder, write }
}
