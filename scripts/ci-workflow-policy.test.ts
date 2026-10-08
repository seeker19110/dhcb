// scripts/ci-workflow-policy.test.ts — Chốt chặn cho QUY ƯỚC CI (CLAUDE.md mục 11.1).
//
// VÌ SAO CẦN: ba luật dưới đây hỏng theo kiểu IM LẶNG — workflow vẫn chạy, vẫn xanh, nhưng
// cổng merge của repo hỏng theo cách không ai thấy cho tới lúc quá muộn:
//
//   1. Đổi id job `quality` / `e2e` → branch protection nhánh `main` đòi hai check ĐÚNG TÊN
//      đó. Check mới tên khác sẽ xanh, còn check cũ thì KHÔNG BAO GIỜ báo cáo nữa → auto-merge
//      kẹt vĩnh viễn trên MỌI PR đang mở, mà không PR nào hiện lỗi đỏ để lần ra nguyên nhân.
//   2. Thêm bước cổng mới vào một job con nhưng quên nối job đó vào `needs` của `quality` →
//      cổng chạy mà kết quả KHÔNG được tính vào check bắt buộc: đỏ cũng merge được.
//   3. Bỏ chia mảnh E2E → quay về một runner chạy hết 563 test, CI chậm gấp nhiều lần.
//
// CỐ Ý chỉ kiểm CẤU TRÚC (id job, quan hệ needs, có chia mảnh hay không), KHÔNG kiểm nội dung
// từng bước: ép nội dung sẽ biến test thành vật cản mỗi lần thêm một bước kiểm mới.

import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const CI_YML = readFileSync(join(process.cwd(), '.github', 'workflows', 'ci.yml'), 'utf-8')

// Tự tách khối job thay vì kéo thêm một thư viện YAML: chỉ cần biết id job và phần thân của
// nó, mà `ci.yml` thì luôn thụt lề 2 khoảng cho job id (Prettier giữ chuẩn này).
function parseJobs(yml: string): Map<string, string> {
  const lines = yml.split('\n')
  const start = lines.findIndex((l) => l === 'jobs:')
  const jobs = new Map<string, string>()
  let current: string | null = null
  let body: string[] = []
  for (const line of lines.slice(start + 1)) {
    const header = /^ {2}([A-Za-z0-9_-]+):\s*$/.exec(line)
    if (header) {
      if (current) jobs.set(current, body.join('\n'))
      current = header[1] ?? null
      body = []
    } else if (current) {
      body.push(line)
    }
  }
  if (current) jobs.set(current, body.join('\n'))
  return jobs
}

// Đọc danh sách trong `needs: [a, b]` hoặc `needs: a`.
function needsOf(body: string): string[] {
  const m = /^\s*needs:\s*(.+)$/m.exec(body)
  if (!m) return []
  return (m[1] ?? '')
    .replace(/[[\]]/g, '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

describe('.github/workflows/ci.yml — quy ước CI', () => {
  const jobs = parseJobs(CI_YML)

  it('tách được job (tự bảo vệ khỏi test rỗng luôn xanh)', () => {
    expect(jobs.size).toBeGreaterThan(3)
  })

  // Luật 1 — hai tên BẤT BIẾN vì branch protection gọi đúng chúng.
  it.each(['quality', 'e2e'])('giữ job id bắt buộc `%s`', (id) => {
    expect(jobs.has(id)).toBe(true)
  })

  // Luật 2 — mọi job con phải được một trong hai job tổng hợp gom lại, nếu không thì kết quả
  // của nó không nằm trong check bắt buộc nào.
  it('mọi job đều nằm trong cây `needs` của `quality` hoặc `e2e`', () => {
    const aggregators = ['quality', 'e2e']
    const covered = new Set<string>(aggregators)
    const walk = (id: string) => {
      for (const dep of needsOf(jobs.get(id) ?? '')) {
        if (!covered.has(dep)) {
          covered.add(dep)
          walk(dep)
        }
      }
    }
    aggregators.forEach(walk)
    const orphans = [...jobs.keys()].filter((id) => !covered.has(id))
    // Báo thẳng tên job mồ côi — người sửa biết ngay phải nối nó vào `needs` nào.
    expect(orphans).toEqual([])
  })

  it('`quality` và `e2e` là job TỔNG HỢP (có `needs`), không phải job chạy việc', () => {
    expect(needsOf(jobs.get('quality') ?? '').length).toBeGreaterThan(0)
    expect(needsOf(jobs.get('e2e') ?? '').length).toBeGreaterThan(0)
  })

  // Luật 3 — E2E phải chạy chia mảnh song song.
  it('E2E chạy chia mảnh (`--shard=` trên một matrix nhiều mảnh)', () => {
    const shardJob = jobs.get('e2e-shard') ?? ''
    expect(shardJob).toContain('--shard=')
    const matrix = /shard:\s*\[(.+)\]/.exec(shardJob)
    expect(matrix, 'job `e2e-shard` phải có matrix `shard: [...]`').not.toBeNull()
    expect((matrix?.[1] ?? '').split(',').length).toBeGreaterThan(1)
  })

  // Báo cáo Playwright chỉ có giá trị khi ĐỎ; upload lúc xanh đo được là ~29 giây lãng phí
  // trên đường tới hạn (đo ở run PR #713).
  it('chỉ upload báo cáo Playwright khi mảnh đó ĐỎ', () => {
    expect(jobs.get('e2e-shard') ?? '').toContain('if: failure()')
  })
})

// Luật 4 (changelog 0521) — action của bên thứ ba (ngoài tổ chức `actions/` của GitHub) phải ghim
// theo commit SHA 40 ký tự, không theo tag. Tag là con trỏ dời được: chủ action (hoặc kẻ chiếm
// tài khoản họ) dời tag sang commit độc là mọi workflow ghim tag chạy mã đó, kèm secret đang cấp
// — `appleboy/ssh-action` cầm cả SSH key VPS. Dependabot (`github-actions`) vẫn cập nhật SHA và
// chú thích `# vX.Y.Z` đi kèm, nên ghim SHA không làm mất cập nhật.
describe('.github/workflows/*.yml — action bên thứ ba ghim theo SHA', () => {
  const dir = join(process.cwd(), '.github', 'workflows')
  const uses = readdirSync(dir)
    .filter((f) => /\.ya?ml$/.test(f))
    .flatMap((f) =>
      readFileSync(join(dir, f), 'utf-8')
        .split('\n')
        .map((line) => /^\s*(?:-\s*)?uses:\s*([^\s#]+)/.exec(line)?.[1])
        .filter((ref): ref is string => !!ref)
        .map((ref) => ({ file: f, ref })),
    )

  it('quét được `uses:` (tự bảo vệ khỏi test rỗng luôn xanh)', () => {
    expect(uses.length).toBeGreaterThan(5)
    expect(uses.some((u) => !u.ref.startsWith('actions/'))).toBe(true)
  })

  it('mọi action ngoài `actions/` dùng `@<SHA 40 ký tự>`', () => {
    const unpinned = uses
      .filter((u) => !u.ref.startsWith('actions/') && !u.ref.startsWith('./'))
      .filter((u) => !/@[0-9a-f]{40}$/.test(u.ref))
      .map((u) => `${u.file}: ${u.ref}`)
    expect(unpinned).toEqual([])
  })
})
