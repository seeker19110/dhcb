// CSS media query phải chạy trong browser thật: SSR/DOM giả không kiểm được fallback khi
// người học bật giảm chuyển động, đặc biệt khi đổi cài đặt giữa lúc hoạt ảnh đang chạy.
import { test, expect, type Page } from '@playwright/test'
import { execFileSync } from 'node:child_process'
import { resolve } from 'node:path'
import type { LessonAnimation as Spec } from '../packages/core-contracts/lessonAnimation'

const spec: Spec = {
  title: 'Trạng thái đầu khi giảm chuyển động',
  description:
    'Hình xuất hiện muộn phải được ẩn; hình co giãn giữ đúng trạng thái đầu và lời dẫn vẫn đọc được.',
  viewBoxWidth: 200,
  viewBoxHeight: 120,
  durationMs: 2000,
  loop: false,
  shapes: [
    {
      kind: 'circle',
      id: 'delayed',
      cx: 10,
      cy: 10,
      r: 3,
      opacity: 0,
      keyframes: [
        { atMs: 0, opacity: 0 },
        { atMs: 1000, opacity: 1 },
      ],
    },
    {
      kind: 'rect',
      id: 'transformed',
      x: 30,
      y: 20,
      w: 8,
      h: 60,
      origin: [34, 80],
      keyframes: [
        { atMs: 250, dx: 12, dy: 8, rotate: 90, scale: 0.5, scaleY: 0.5 },
        { atMs: 1000, dx: 60, dy: 20, rotate: 0, scale: 1, scaleY: 1 },
      ],
    },
    {
      kind: 'circle',
      id: 'static-opacity',
      cx: 60,
      cy: 10,
      r: 3,
      opacity: 0.4,
      keyframes: [
        { atMs: 0, dx: 14 },
        { atMs: 1000, dx: 40 },
      ],
    },
  ],
  captions: [{ atMs: 0, text: 'Khi giảm chuyển động, đọc mô tả và giữ trạng thái ban đầu.' }],
}

// Playwright có bộ biến đổi JSX riêng cho component testing, không sinh React element mà
// React SSR nhận được. Nạp renderer thật bằng tsx ở tiến trình Node riêng, giống công cụ ảnh.
// Chương trình cố định; dữ liệu fixture truyền qua stdin, không ghép vào mã hoặc shell command.
const RENDER_SCRIPT = `
import { readFileSync } from 'node:fs'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { LessonAnimation } from './packages/core-ui/LessonAnimation.tsx'
const spec = JSON.parse(readFileSync(0, 'utf8'))
process.stdout.write(renderToStaticMarkup(createElement(LessonAnimation, { spec })))
`
let markup: string

test.beforeAll(() => {
  markup = execFileSync(
    process.execPath,
    ['--import', 'tsx', '--input-type=module', '--eval', RENDER_SCRIPT],
    {
      cwd: process.cwd(),
      env: { ...process.env, TSX_TSCONFIG_PATH: resolve(process.cwd(), 'tsconfig.base.json') },
      input: JSON.stringify(spec),
      encoding: 'utf8',
      timeout: 30_000,
    },
  ).replace(/<style>[\s\S]*?<\/style>/, (style) =>
    style
      .replace(/&#x27;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/&gt;/g, '>'),
  )
})

async function checkInitialState(page: Page) {
  const groups = page.locator('g[data-animated="true"]')
  await expect(groups).toHaveCount(3)
  await expect(groups.nth(0)).toHaveCSS('opacity', '0')
  await expect(groups.nth(1)).toHaveCSS('transform-origin', '34px 80px')
  const matrix = await groups.nth(1).evaluate((element) => {
    const value = new DOMMatrix(getComputedStyle(element).transform)
    return [value.a, value.b, value.c, value.d, value.e, value.f]
  })
  const expected = [0, 0.5, -0.25, 0, 12, 8]
  matrix.forEach((value, index) => expect(value).toBeCloseTo(expected[index]!, 5))
  // Opacity tĩnh chỉ nằm trên hình con; nếu lặp ở nhóm cha, độ mờ sẽ thành 0,16.
  await expect(groups.nth(2)).toHaveCSS('opacity', '1')
  await expect(groups.nth(2).locator('circle')).toHaveCSS('opacity', '0.4')
  await expect(groups.nth(2)).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 14, 0)')
  await expect(page.getByText(spec.description)).toBeVisible()
  await expect(page.getByText(spec.captions![0]!.text)).toBeVisible()
  expect(await page.evaluate(() => document.getAnimations().length)).toBe(0)
}

test('reduced motion từ đầu: ẩn hình đến muộn và giữ transform/origin của mốc đầu', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.setContent(markup)
  await checkInitialState(page)
})

test('bật reduced motion giữa lượt: trở về cảnh đầu, không giữ cảnh đang chạy', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.setContent(markup)
  await expect.poll(() => page.evaluate(() => document.getAnimations().length)).toBe(3)
  // Đặt timeline thật ở mốc 1500ms để canh cả CSS ghi đè fallback khi chuyển động được phép.
  await page.evaluate(() => {
    for (const animation of document.getAnimations()) {
      animation.pause()
      animation.currentTime = 1500
    }
  })
  const groups = page.locator('g[data-animated="true"]')
  await expect(groups.nth(0)).toHaveCSS('opacity', '1')
  await expect(groups.nth(1)).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 60, 20)')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await checkInitialState(page)
})
