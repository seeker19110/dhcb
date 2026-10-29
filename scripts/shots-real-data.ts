/**
 * Chụp ảnh Tầng 8b cho các trang CẦN DỮ LIỆU mới vẽ đủ (changelog 0690): Bảng giá, Nhiệm vụ,
 * Hồ sơ (huy hiệu), Kanban + trang Ghi chú — × 3 theme × 1440/390 px.
 *
 *   npm run dev -- --port 5179 --strictPort --host 127.0.0.1   # cửa sổ khác
 *   [PW_CHROMIUM_PATH=…] npm run shots:real-data -- [--out DIR] [--pages a,b] [--themes t1,t2] [--widths 390,1440]
 *
 * VÌ SAO: audit UI/UX 2026-09-22 (nợ (4)) chỉ chụp được bản RỖNG của các trang này — không có dữ
 * liệu thì thẻ giá, huy hiệu, cột Kanban không bao giờ hiện, nên lỗi bố cục của chúng không lộ.
 * Mock dùng lại `e2e/helpers/realDataMocks.ts` (đúng hình dạng API thật) + dữ liệu Kanban/huy hiệu
 * dựng theo hợp đồng Zod thật ở dưới.
 *
 * Ảnh ghi RA NGOÀI REPO (mặc định `/tmp/shots/real-data/`) — repo giữ kỷ luật 0 file PNG (cùng quy
 * ước `scripts/shots-learning-ux.ts`). Script báo lỗi nếu ảnh trắng/quá thấp/rơi về màn đăng nhập.
 */
import { chromium, type Page } from '@playwright/test'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { WorkProjectSchema, WorkTaskSchema } from '@dhcb/core-contracts/work'
import { mockLogin, USER_ID, type ThemeName } from '../e2e/helpers/auth.js'
import { screenshotFullPage, waitForShotReady } from '../e2e/helpers/fullPageShot.js'
import {
  mockPlanPrices,
  mockQuestsStatus,
  mockReferralStats,
} from '../e2e/helpers/realDataMocks.js'

const args = process.argv.slice(2)
const arg = (name: string, def: string) => {
  const i = args.indexOf(name)
  return i >= 0 && args[i + 1] ? args[i + 1]! : def
}

const BASE = process.env.BASE_URL ?? `http://localhost:${process.env.PORT ?? 5179}`
const OUT = arg('--out', '/tmp/shots/real-data')
const THEMES = arg('--themes', 'blue-sky,dark-blue,kid').split(',') as ThemeName[]
const WIDTHS = arg('--widths', '390,1440').split(',').map(Number)
const HEIGHT: Record<number, number> = { 390: 844, 1440: 900 }

const NOW = '2026-10-29T08:00:00.000Z'
const PERSON = '00000000-0000-4000-8000-000000000001'
const PROJECT = '00000000-0000-4000-8000-0000000000a1'

// Dữ liệu Kanban PARSE qua đúng schema hợp đồng — sửa hợp đồng mà quên sửa ở đây thì script ném lỗi.
const PROJECTS = [
  WorkProjectSchema.parse({
    schemaVersion: 1,
    id: PROJECT,
    personId: PERSON,
    name: 'Ôn thi IELTS tháng 12',
    status: 'active',
    createdAt: NOW,
    updatedAt: NOW,
  }),
]
const TASK_ROWS: Array<[string, 'low' | 'medium' | 'high' | 'urgent', 'todo' | 'done']> = [
  ['Làm đề Reading Cambridge 18 — Test 2', 'high', 'todo'],
  ['Viết lại bài Task 2 về giao thông công cộng, sửa theo nhận xét', 'urgent', 'todo'],
  ['Ôn 30 từ vựng chủ đề môi trường', 'medium', 'todo'],
  ['Nghe podcast 6 Minute English', 'low', 'done'],
  ['Đăng ký lịch thi chính thức', 'high', 'done'],
]
const TASKS = TASK_ROWS.map(([title, priority, status], i) =>
  WorkTaskSchema.parse({
    schemaVersion: 1,
    id: `00000000-0000-4000-8000-00000000010${i}`,
    personId: PERSON,
    projectId: PROJECT,
    title,
    priority,
    status,
    dueAt: '2026-11-05T10:00:00.000Z',
    createdAt: NOW,
    updatedAt: NOW,
  }),
)

const json = (body: unknown) => ({
  status: 200,
  contentType: 'application/json',
  body: JSON.stringify(body),
})

/** `/api/work` — việc + dự án mẫu ở trên; loại khác (cuộc họp, tài liệu) trả rỗng. */
async function mockWorkData(page: Page): Promise<void> {
  await page.route('**/api/work**', (route) => {
    const kind = new URL(route.request().url()).searchParams.get('kind') ?? 'projects'
    if (kind === 'tasks') return route.fulfill(json({ tasks: TASKS }))
    if (kind === 'projects') return route.fulfill(json({ projects: PROJECTS }))
    return route.fulfill(json({ [kind]: [] }))
  })
}

interface ShotPage {
  id: string
  path: string
  setup: (page: Page) => Promise<void>
}

const PAGES: ShotPage[] = [
  { id: 'bang-gia', path: '/nang-cap', setup: mockPlanPrices },
  {
    id: 'nhiem-vu',
    path: '/nhiem-vu',
    setup: async (page) => {
      await mockQuestsStatus(page)
      await mockReferralStats(page)
    },
  },
  {
    id: 'ho-so-huy-hieu',
    path: '/trang-ca-nhan',
    setup: async (page) => {
      // Huy hiệu đã đạt lưu ở localStorage (apps/dhcb/src/lib/achievements.ts, khoá `et_achievements_<uid>`).
      await page.addInitScript(({ key, ids }) => localStorage.setItem(key, JSON.stringify(ids)), {
        key: `et_achievements_${USER_ID}`,
        ids: ['streak_7', 'streak_30', 'vocab_100'],
      })
      await page.route('**/api/achievements', (route) =>
        route.fulfill(
          json({
            items: ['streak_7', 'streak_30', 'vocab_100'].map((id, i) => ({
              id,
              earned: true,
              claimed: i === 0,
              reward: { enabled: true, rewardPlan: 'vip', rewardDays: 3 },
            })),
          }),
        ),
      )
    },
  },
  { id: 'kanban', path: '/ghi-chu/kanban', setup: mockWorkData },
  { id: 'ghi-chu', path: '/ghi-chu', setup: mockWorkData },
]

function pngHeight(buf: Buffer): number {
  // Chiều cao đọc thẳng từ header IHDR (4 byte tại offset 20) — không ước lượng.
  return buf.readUInt32BE(20)
}

async function main(): Promise<void> {
  const only = arg('--pages', '')
  const pages = only ? PAGES.filter((p) => only.split(',').includes(p.id)) : PAGES
  mkdirSync(OUT, { recursive: true })
  // `PW_CHROMIUM_PATH`: máy có Chromium cài sẵn khác bản Playwright của repo (vd container cloud) thì
  // trỏ thẳng tới nó; để trống = Chromium mặc định của Playwright.
  const browser = await chromium.launch({
    executablePath: process.env.PW_CHROMIUM_PATH || undefined,
  })
  const problems: string[] = []
  let count = 0
  try {
    for (const p of pages) {
      for (const theme of THEMES) {
        for (const width of WIDTHS) {
          const file = `${p.id}--${theme}--${width}.png`
          const ctx = await browser.newContext({
            baseURL: BASE,
            viewport: { width, height: HEIGHT[width] ?? 900 },
            deviceScaleFactor: 1,
          })
          const page = await ctx.newPage()
          try {
            await mockLogin(page, 'vi', theme)
            await p.setup(page)
            await page.goto(p.path)
            await waitForShotReady(page)
            const buf = await screenshotFullPage(page)
            const loginForm = await page.locator('form[action*="login"]').count()
            if (pngHeight(buf) < 400 || loginForm > 0) {
              problems.push(`${file}: cao ${pngHeight(buf)}px, form đăng nhập ${loginForm}`)
            }
            writeFileSync(join(OUT, file), buf)
            count++
          } finally {
            await ctx.close()
          }
        }
      }
    }
  } finally {
    await browser.close()
  }
  console.log(`Đã chụp ${count} ảnh vào ${OUT}`)
  if (problems.length > 0) {
    console.error(`❌ Ảnh không dùng được:\n  ${problems.join('\n  ')}`)
    process.exitCode = 1
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
