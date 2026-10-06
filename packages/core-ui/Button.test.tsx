import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { Button } from './Button.js'
import { buttonClass } from './buttonStyles.js'

describe('Button', () => {
  it('mặc định là type="button", không phải submit', () => {
    // Mặc định của HTML là "submit": một nút phụ trong biểu mẫu mà quên khai type sẽ lặng lẽ
    // gửi biểu mẫu. Đây là ca lỗi im lặng nên phải có test canh.
    expect(renderToStaticMarkup(<Button>Lưu</Button>)).toContain('type="button"')
  })

  it('loading = true → nút bị khoá và báo aria-busy', () => {
    const html = renderToStaticMarkup(<Button loading>Gửi</Button>)
    // Khoá nút khi đang xử lý là để chặn bấm hai lần gửi hai lần (idempotency), không chỉ để
    // trông cho đẹp — nên kiểm cả `disabled` chứ không chỉ vòng quay.
    expect(html).toContain('disabled')
    expect(html).toContain('aria-busy="true"')
    expect(html).toContain('Đang xử lý')
  })

  it('mọi biến thể dùng viền lấy nét CHUNG của index.css, không tự tắt hay thay nó', () => {
    // Viền chung (`--focus-ring`) đã đo ≥ 3:1 ở cả 3 theme; vòng `ring-accent-*` cũ chỉ ~2,6:1
    // ở Blue sky (audit 2026-09-30 C1). `outline-none` mà lọt lại là mất viền lấy nét chuẩn.
    for (const variant of ['primary', 'secondary', 'outline', 'danger', 'ghost'] as const) {
      const cls = buttonClass({ variant })
      expect(cls).not.toMatch(/outline-none/)
      expect(cls).not.toMatch(/focus-visible:ring/)
      // `transition-all` làm viền lấy nét hiện dần 200ms (audit M17) — chỉ chuyển màu.
      expect(cls).toContain('transition-colors')
      expect(cls).not.toMatch(/\btransition-all\b/)
    }
  })

  it('biến thể viền (`outline`) có khung bằng token, không mang màu thương hiệu làm nền', () => {
    const cls = buttonClass({ variant: 'outline' })
    expect(cls).toContain('border-line-strong')
    expect(cls).toContain('bg-transparent')
    expect(cls).not.toMatch(/\bbg-accent-500\b(?!\/)/)
  })

  it('nút chính KHÔNG bao giờ dùng text-white trên nền accent', () => {
    // `text-white` map sang --c-white, biến này bị đảo thành màu tối ở 3 theme nền sáng; ở
    // theme NỀN TỐI nó là chữ trắng thật trên nền accent → ~2,3–3,4:1, dưới sàn AA 4,5:1.
    const primary = buttonClass({ variant: 'primary' })
    expect(primary).toContain('bg-accent-500')
    expect(primary).not.toMatch(/\btext-white\b/)
    expect(primary).toContain('text-[#09090b]')
  })
})

// ── Test canh gác toàn kho mã ────────────────────────────────────────────────────────────
// Bất biến: KHÔNG file nào được đặt `text-white` lên nền accent ĐẶC (`bg-accent-500` không
// kèm độ mờ). Lý do đầy đủ ở đầu `Button.tsx`. Cổng a11y e2e không bắt được ca này vì các nút
// dính lỗi nằm sau đăng nhập (bảng quản trị, cổng tính năng), ngoài 15 trang được quét — nên
// phải canh bằng test tĩnh, không phải bằng trình duyệt.
const repoRoot = process.cwd()

/** Liệt kê đệ quy mọi file .tsx trong một thư mục. */
function listTsx(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) return listTsx(full)
    return entry.isFile() && entry.name.endsWith('.tsx') ? [full] : []
  })
}

describe('bất biến tương phản: chữ trắng trên nền accent đặc', () => {
  it('không file .tsx nào vi phạm', () => {
    // `bg-accent-500` KHÔNG theo sau bởi `/` (độ mờ) hay chữ số, rồi tới `text-white` trong
    // cùng một chuỗi class.
    const pattern = /bg-accent-500(?![/\d])[^"'`]*\btext-white\b/
    const offenders = [join(repoRoot, 'apps/dhcb/src'), join(repoRoot, 'packages/core-ui')]
      .flatMap(listTsx)
      .filter((file) => pattern.test(readFileSync(file, 'utf8')))
      .map((file) => file.replace(repoRoot + '/', ''))

    expect(
      offenders,
      'Dùng <Button variant="primary"> hoặc buttonClass() thay vì tự ghép class — xem đầu packages/core-ui/Button.tsx',
    ).toEqual([])
  })
})

describe('buttonVariantClass — chỉ phần màu của biến thể (changelog 0501)', () => {
  it('trùng phần màu trong buttonClass và KHÔNG mang chiều cao/cấm xuống dòng', async () => {
    const { buttonVariantClass } = await import('./buttonStyles.js')
    for (const variant of ['primary', 'secondary', 'outline', 'danger', 'ghost'] as const) {
      const mau = buttonVariantClass(variant)
      expect(buttonClass({ variant })).toContain(mau)
      expect(mau).not.toMatch(/\bh-\d|whitespace-nowrap|\bpx-\d/)
    }
  })
})
