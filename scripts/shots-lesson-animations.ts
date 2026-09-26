/**
 * Chụp MỌI hoạt ảnh bài học của một môn ở nhiều mốc thời gian, để rà bằng mắt (Tầng 8b cho hoạt
 * ảnh — luật ⑥ của `docs/specs/2026-09-21-hoat-anh-mo-phong-bai-hoc.md`: ảnh cảnh đầu KHÔNG đủ,
 * phải soi ≥ 3 mốc và so ảnh khác nhau thật).
 *
 *   npm run shots:lesson-anim -- [--subject math|physics|chemistry|biology] [--out DIR] [--only id,...]
 *
 * Cách làm (không cần DB/đăng nhập): render `LessonAnimation` ra HTML tĩnh kèm token theme,
 * mở bằng Chromium, đặt `currentTime` của mọi animation về 5 mốc 2/25/50/75/98% `durationMs`
 * (kỹ thuật đáng tin — đổi `animation-delay` âm trên animation đã paused cho ảnh sai giả ở mốc
 * gần cuối, xem `TRAPS.md` mục 10), rồi ghép 5 khung thành một dải `montage/<id>.png` để đọc.
 * Ảnh ghi RA NGOÀI REPO (mặc định `/tmp/shots/lesson-animations/<môn>/`) — repo giữ 0 file PNG.
 *
 * Ở mỗi mốc còn chạy `kiemHinhHoc` (thêm 2026-09-26, đợt rà Lí `docs/changelog/0457-*.md`): in
 * dòng ⚠ khi chữ tràn khung, chữ đè chữ, đường/mũi tên gạch qua chữ, chấm đè chữ, chấm hay mũi
 * tên ra khỏi khung. CHỈ BÁO — có ca cố ý (chữ trắng trong quả cầu) — người rà vẫn phải NHÌN ảnh:
 * máy không biết nhãn có đi theo vật, chiều mũi tên có đúng vật lí không.
 *
 * Mốc renderToStaticMarkup: React escape dấu nháy trong <style> (`&#x27;`) — client thật không
 * bị vì set qua textContent — nên phải giải escape khối <style> trước khi ghi file.
 */
import { chromium } from '@playwright/test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { LessonAnimation as LessonAnimationSpec } from '@dhcb/core-contracts/lessonAnimation'

// `scripts/` được typecheck bởi tsconfig.api.json (không bật --jsx, loại trừ core-ui) nên không
// import tĩnh file .tsx được; nạp động qua chuỗi để tsx phân giải lúc chạy, khai kiểu tay.
type LessonAnimationComponent = (props: { spec: LessonAnimationSpec }) => React.ReactElement | null
const RENDERER_MODULE = '@dhcb/core-ui/LessonAnimation'

const MOC_PHAN_TRAM = [2, 25, 50, 75, 98] as const

function doiSo(name: string, fallback: string): string {
  const i = process.argv.indexOf(`--${name}`)
  const value = i >= 0 ? process.argv[i + 1] : undefined
  return value ?? fallback
}

type BaiCoHoatAnh = { id: string; animation?: LessonAnimationSpec }

// Bốn môn STEM đã nối `apps/` (2026-09-13). Mở rộng từ chỉ-Toán (2026-09-26) để rà mắt Lí/Hoá/Sinh
// theo đúng luật ⑥ như đợt Toán (`docs/changelog/0408-*.md`).
const NAP_MON: Record<string, () => Promise<readonly BaiCoHoatAnh[]>> = {
  math: async () => (await import('@dhcb/subject-math/lessons')).MATH_LESSONS,
  physics: async () => (await import('@dhcb/subject-physics/lessons')).PHYSICS_LESSONS,
  chemistry: async () => (await import('@dhcb/subject-chemistry/lessons')).CHEM_LESSONS,
  biology: async () => (await import('@dhcb/subject-biology/lessons')).BIOLOGY_LESSONS,
}

async function napHoatAnh(subject: string): Promise<{ id: string; spec: LessonAnimationSpec }[]> {
  const nap = NAP_MON[subject]
  if (!nap)
    throw new Error(
      `Chưa hỗ trợ môn "${subject}" — dùng một trong: ${Object.keys(NAP_MON).join(', ')}.`,
    )
  return (await nap()).flatMap((bai) =>
    bai.animation ? [{ id: bai.id, spec: bai.animation }] : [],
  )
}

function trangHtml(
  LessonAnimation: LessonAnimationComponent,
  spec: LessonAnimationSpec,
  themeCss: string,
): string {
  const body = renderToStaticMarkup(React.createElement(LessonAnimation, { spec })).replace(
    /<style>[\s\S]*?<\/style>/,
    (m) =>
      m
        .replace(/&#x27;/g, "'")
        .replace(/&quot;/g, '"')
        .replace(/&gt;/g, '>'),
  )
  return `<!doctype html><html data-theme="blue-sky"><head><meta charset="utf-8"><style>${themeCss}
body{margin:0;padding:16px;background:rgb(var(--surface-card));color:rgb(var(--text-primary));font-family:sans-serif}
figure{margin:0;width:720px}</style></head><body>${body}</body></html>`
}

/**
 * Kiểm hình học ở MỘT mốc thời gian (chạy TRONG trình duyệt, phải tự chứa — không dùng biến ngoài).
 * Bắt năm khuôn lỗi đã gặp thật khi rà mắt Lí (`docs/changelog/0457-*.md`), đổi hết về toạ độ
 * viewBox: chữ tràn khung (TRAN), chữ đè chữ (DE), đường/mũi tên gạch qua chữ (GACH), chấm tròn
 * đè chữ (CHAM), chấm hoặc mũi tên ra khỏi khung (RA-KHUNG). Chỉ tính hình đang hiện (opacity > 0,15).
 */
function kiemHinhHoc(): string[] {
  const svg = document.querySelector('svg[role="img"]') as SVGSVGElement | null
  if (!svg) return ['không thấy svg']
  const vb = svg.viewBox.baseVal
  const nguoc = svg.getScreenCTM()?.inverse()
  if (!nguoc) return []
  const veVB = (x: number, y: number): [number, number] => {
    const p = new DOMPoint(x, y).matrixTransform(nguoc)
    return [p.x, p.y]
  }
  const doMo = (el: Element): number => {
    let o = 1
    for (let e: Element | null = el; e && e !== svg; e = e.parentElement)
      o *= parseFloat(getComputedStyle(e).opacity || '1')
    return o
  }
  type Hop = { x0: number; y0: number; x1: number; y1: number }
  const hopVB = (el: Element): Hop => {
    const r = el.getBoundingClientRect()
    const [x0, y0] = veVB(r.left, r.top)
    const [x1, y1] = veVB(r.right, r.bottom)
    return { x0, y0, x1, y1 }
  }
  const tron = (n: number) => n.toFixed(0)
  const nhan = [...svg.querySelectorAll('text')]
    .filter((t) => doMo(t) > 0.15)
    .map((t) => ({ chu: t.textContent ?? '', h: hopVB(t) }))
  const loi: string[] = []
  for (const n of nhan) {
    const tran = Math.max(-n.h.x0, n.h.x1 - vb.width, -n.h.y0, n.h.y1 - vb.height)
    if (tran > 1) loi.push(`TRAN ${tron(tran)}: "${n.chu}"`)
  }
  for (let i = 0; i < nhan.length; i++)
    for (let j = i + 1; j < nhan.length; j++) {
      const a = nhan[i]!.h
      const b = nhan[j]!.h
      const rong = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0)
      const cao = Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0)
      if (rong > 0.5 && cao > 1.5) loi.push(`DE: "${nhan[i]!.chu}" × "${nhan[j]!.chu}"`)
    }
  // Đoạn thẳng của line/arrow/polyline/polygon SAU biến đổi CSS (getScreenCTM tính cả transform).
  const doan: { a: [number, number]; b: [number, number]; ten: string }[] = []
  for (const el of svg.querySelectorAll('line, polyline, polygon')) {
    if (doMo(el) <= 0.15) continue
    const m = (el as SVGGraphicsElement).getScreenCTM()
    if (!m) continue
    const diem: [number, number][] =
      el instanceof SVGLineElement
        ? [
            [el.x1.baseVal.value, el.y1.baseVal.value],
            [el.x2.baseVal.value, el.y2.baseVal.value],
          ]
        : [...(el as SVGPolylineElement).points].map((p) => [p.x, p.y])
    const vbDiem = diem.map(([x, y]) => {
      const s = new DOMPoint(x, y).matrixTransform(m)
      return veVB(s.x, s.y)
    })
    const loai =
      el.tagName === 'line' ? (el.getAttribute('marker-end') ? 'mũi tên' : 'đường') : el.tagName
    const ten = `${loai}(${diem[0]!.map(tron).join(',')})`
    for (let k = 0; k + 1 < vbDiem.length; k++) doan.push({ a: vbDiem[k]!, b: vbDiem[k + 1]!, ten })
    if (el.tagName === 'polygon') doan.push({ a: vbDiem.at(-1)!, b: vbDiem[0]!, ten })
    const ngoai = Math.max(...vbDiem.map(([x, y]) => Math.max(-x, x - vb.width, -y, y - vb.height)))
    if (loai === 'mũi tên' && ngoai > 1) loi.push(`RA-KHUNG ${tron(ngoai)}: ${ten}`)
  }
  // Liang–Barsky: đoạn pq có đi qua hộp chữ (thu nhỏ 1 đơn vị) không.
  const catHop = (p: [number, number], q: [number, number], h: Hop): boolean => {
    let t0 = 0
    let t1 = 1
    const dx = q[0] - p[0]
    const dy = q[1] - p[1]
    const canh: [number, number][] = [
      [-dx, p[0] - (h.x0 + 1)],
      [dx, h.x1 - 1 - p[0]],
      [-dy, p[1] - (h.y0 + 1)],
      [dy, h.y1 - 1 - p[1]],
    ]
    for (const [pp, qq] of canh) {
      if (pp === 0) {
        if (qq < 0) return false
      } else {
        const r = qq / pp
        if (pp < 0) {
          if (r > t1) return false
          if (r > t0) t0 = r
        } else {
          if (r < t0) return false
          if (r < t1) t1 = r
        }
      }
    }
    return t0 <= t1
  }
  for (const n of nhan) {
    const gach = new Set(doan.filter((d) => catHop(d.a, d.b, n.h)).map((d) => d.ten))
    if (gach.size) loi.push(`GACH: "${n.chu}" × ${[...gach].join(', ')}`)
  }
  for (const c of svg.querySelectorAll('circle')) {
    if (doMo(c) <= 0.15 || c.getAttribute('fill') === 'none') continue
    const h = hopVB(c)
    const tam = `chấm(${tron((h.x0 + h.x1) / 2)},${tron((h.y0 + h.y1) / 2)})`
    for (const n of nhan) {
      const rong = Math.min(h.x1, n.h.x1) - Math.max(h.x0, n.h.x0)
      const cao = Math.min(h.y1, n.h.y1) - Math.max(h.y0, n.h.y0)
      const dienTich = (n.h.x1 - n.h.x0) * (n.h.y1 - n.h.y0)
      if (rong > 1 && cao > 1 && (rong * cao) / dienTich > 0.04)
        loi.push(`CHAM: "${n.chu}" × ${tam}`)
    }
    const ngoai = Math.max(-h.x0, h.x1 - vb.width, -h.y0, h.y1 - vb.height)
    if (ngoai > 1) loi.push(`RA-KHUNG ${tron(ngoai)}: ${tam}`)
  }
  return loi
}

async function main() {
  const subject = doiSo('subject', 'math')
  const out = doiSo('out', `/tmp/shots/lesson-animations/${subject}`)
  const only = doiSo('only', '').split(',').filter(Boolean)
  const themeCss = readFileSync('packages/core-ui/theme.css', 'utf8')
  const { LessonAnimation } = (await import(RENDERER_MODULE)) as {
    LessonAnimation: LessonAnimationComponent
  }
  const danhSach = (await napHoatAnh(subject)).filter(
    (a) => only.length === 0 || only.includes(a.id),
  )
  mkdirSync(join(out, 'shots'), { recursive: true })
  mkdirSync(join(out, 'montage'), { recursive: true })

  const browser = await chromium.launch(
    process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {},
  )
  const page = await browser.newPage({ viewport: { width: 760, height: 900 } })
  // tsx (esbuild keepNames) bọc hàm con trong `__name(...)`; hàm `kiemHinhHoc` chạy TRONG trình
  // duyệt nên phải có sẵn `__name` ở đó, không thì page.evaluate ném ReferenceError.
  await page.addInitScript('globalThis.__name = (f) => f')
  let dungYen = 0
  let coVanDe = 0
  for (const { id, spec } of danhSach) {
    const htmlPath = join(out, `${id}.html`)
    writeFileSync(htmlPath, trangHtml(LessonAnimation, spec, themeCss))
    await page.goto(`file://${htmlPath}`)
    const soAnim = await page.evaluate(() =>
      [...document.querySelectorAll("[data-animated='true']")].reduce(
        (n, g) => n + g.getAnimations().length,
        0,
      ),
    )
    const vanDe = new Map<string, number[]>()
    for (const pct of MOC_PHAN_TRAM) {
      const t = Math.round((spec.durationMs * pct) / 100)
      await page.evaluate((ms) => {
        document.querySelectorAll("[data-animated='true']").forEach((g) =>
          g.getAnimations().forEach((a) => {
            a.pause()
            a.currentTime = ms
          }),
        )
      }, t)
      await page
        .locator('svg')
        .screenshot({ path: join(out, 'shots', `${id}--${String(pct).padStart(2, '0')}.png`) })
      for (const loi of await page.evaluate(kiemHinhHoc))
        vanDe.set(loi, [...(vanDe.get(loi) ?? []), pct])
    }
    // Dải ghép 5 khung để đọc một lượt.
    const khung = MOC_PHAN_TRAM.map(
      (pct) =>
        `<figure style="margin:0;text-align:center"><img src="shots/${id}--${String(pct).padStart(2, '0')}.png" style="width:370px;border:1px solid #999"><figcaption style="font:13px sans-serif">${pct}% · ${Math.round((spec.durationMs * pct) / 100)}ms</figcaption></figure>`,
    ).join('')
    const montagePath = join(out, `m-${id}.html`)
    writeFileSync(
      montagePath,
      `<html><body style="margin:0;padding:6px;background:#fff"><div style="font:bold 15px sans-serif;margin-bottom:4px">${id} — ${spec.title}</div><div style="display:flex;gap:4px">${khung}</div></body></html>`,
    )
    await page.setViewportSize({ width: 1900, height: 600 })
    await page.goto(`file://${montagePath}`)
    await page.locator('body').screenshot({ path: join(out, 'montage', `${id}.png`) })
    await page.setViewportSize({ width: 760, height: 900 })
    if (soAnim === 0) dungYen += 1
    console.log(`${id}: ${soAnim} animation đang chạy · ${spec.durationMs}ms`)
    for (const [loi, moc] of vanDe) console.log(`   ⚠ ${loi} @${moc.join('/')}%`)
    if (vanDe.size > 0) coVanDe += 1
  }
  await browser.close()
  console.log(`\n${danhSach.length} hoạt ảnh → ${out}/montage/*.png`)
  // Chỉ BÁO, không chặn: có ca cố ý (chữ trắng nằm trong quả cầu, trục đi qua điện tích) —
  // người soạn đọc từng dòng ⚠ rồi NHÌN dải ảnh để quyết (TRAPS.md mục 10).
  console.log(`⚠ ${coVanDe}/${danhSach.length} hoạt ảnh có dòng cảnh báo hình học cần nhìn lại.`)
  if (dungYen > 0) {
    console.error(`✖ ${dungYen} hoạt ảnh KHÔNG có animation nào chạy (xem TRAPS.md mục 10).`)
    process.exit(1)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
