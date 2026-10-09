import { test, expect, type Page } from '@playwright/test'
import { mockLogin, type ThemeName } from './helpers/auth'
import { muteTts } from './helpers/tts'
import { waitForStableDom } from './helpers/axe'
import { mockCompanionInteractiveApis, MOCK_TEXT } from './helpers/companionInteractiveMocks'
import { SCAN_ROOT_ATTR, scanScopedAa, scanScopedAaa } from './helpers/scopedA11yScan'

// ─────────────────────────────────────────────────────────────────────────────
// LỚP BẢO VỆ THỨ HAI cho cổng a11y (changelog 0544): trạng thái SAU TƯƠNG TÁC của các thẻ
// Bạn Đồng Hành.
//
// e2e/a11y.spec.ts (A/AA) và e2e/a11y-aaa.spec.ts (AAA nội dung) quét trạng thái BAN ĐẦU của từng
// trang/studio. Phần lớn chữ của các thẻ dưới đây chỉ hiện SAU khi bấm (phiên đang chạy, bảng
// tổng kết, kết quả phát âm, khối mở rộng…) hoặc khi API trả dữ liệu (không có backend ở E2E thì
// thẻ ẩn hẳn) — nên lỗi tương phản theme sáng 0542/0543 sống lâu mà không cổng nào thấy.
//
// Spec này mock API (dữ liệu parse qua hợp đồng Zod — helpers/companionInteractiveMocks.ts), bấm
// tới từng trạng thái, rồi quét GIỚI HẠN trong thẻ đó bằng đúng luật của hai cổng kia: AA 0 vi
// phạm + AAA cho chữ đọc (helpers/scopedA11yScan.ts), ở cả 3 theme. Một test = một thẻ × một theme,
// các trạng thái của thẻ quét nối tiếp trên cùng một lần tải trang (đỡ tốn thời gian shard CI).
// ─────────────────────────────────────────────────────────────────────────────

const THEMES: ThemeName[] = ['dark-blue', 'blue-sky', 'kid']

type Studio = 'Ghi nhớ' | 'Thử thách' | 'Kế hoạch'

interface CardState {
  /** Tên trạng thái — in trong thông điệp lỗi. */
  name: string
  /** Đưa thẻ vào trạng thái này (tiếp nối trạng thái trước) và chờ theo NỘI DUNG, không theo giờ. */
  enter: (page: Page) => Promise<void>
}

interface InteractiveCard {
  card: string
  studio: Studio
  /** Chữ tiêu đề thẻ — dùng để tìm khung thẻ (tổ tiên `.rounded-2xl` gần nhất). */
  title: string
  states: CardState[]
}

const CARDS: InteractiveCard[] = [
  {
    card: 'Scenario Holodeck',
    studio: 'Thử thách',
    title: 'Scenario Holodeck V3',
    states: [
      {
        name: 'chọn kịch bản (thẻ đang chọn)',
        enter: async (page) => {
          await expect(
            page.getByRole('button', { name: new RegExp(MOCK_TEXT.holodeckScenario) }),
          ).toHaveAttribute('aria-pressed', 'true')
        },
      },
      {
        name: 'phiên đang chạy',
        enter: async (page) => {
          await page.getByRole('button', { name: /Bước vào phòng giả lập/ }).click()
          await expect(page.getByText(MOCK_TEXT.holodeckFirstTurn)).toBeVisible()
        },
      },
      {
        name: 'bảng điểm tổng kết',
        enter: async (page) => {
          await page.getByRole('button', { name: 'Kết thúc', exact: true }).click()
          await expect(page.getByText(/Overall Band/)).toBeVisible()
        },
      },
    ],
  },
  {
    card: 'Phát âm 3D',
    studio: 'Thử thách',
    title: '3D Articulatory Phonetics & Pitch Alignment',
    states: [
      {
        name: 'kết quả đường cong F0',
        enter: async (page) => {
          await page.getByRole('button', { name: /Kiểm tra Phát âm/ }).click()
          await expect(page.getByText(MOCK_TEXT.phoneticAdvice, { exact: false })).toBeVisible()
        },
      },
    ],
  },
  {
    card: 'Socratic',
    studio: 'Ghi nhớ',
    title: 'Socratic Cognitive Diagnostic Engine',
    states: [
      {
        name: 'chọn chủ đề (thẻ đang chọn)',
        enter: async (page) => {
          await expect(
            page.getByRole('button', { name: new RegExp(MOCK_TEXT.socraticTopic) }),
          ).toHaveAttribute('aria-pressed', 'true')
        },
      },
      {
        name: 'phiên đang chạy (phản hồi chưa đúng)',
        enter: async (page) => {
          await page.getByRole('button', { name: /Bắt đầu đối thoại dẫn dắt Socratic/ }).click()
          await expect(page.getByText(MOCK_TEXT.socraticFirstFeedback)).toBeVisible()
        },
      },
      {
        name: 'đột phá (phản hồi đúng + banner)',
        enter: async (page) => {
          await page.getByPlaceholder(/Nhập câu trả lời \/ suy ngẫm/).fill('I saw him yesterday.')
          await page.getByRole('button', { name: /Gửi phản tư/ }).click()
          await expect(page.getByText('Đột phá nhận thức đạt được!')).toBeVisible()
        },
      },
    ],
  },
  {
    card: 'Nhận thức ngầm',
    studio: 'Ghi nhớ',
    title: 'Nhận thức ngầm & dự đoán đón đầu',
    states: [
      {
        name: 'có dữ liệu (thu gọn)',
        enter: async (page) => {
          await expect(
            page.getByRole('button', { name: /Xem chi tiết tái cấu trúc/ }),
          ).toBeVisible()
        },
      },
      {
        name: 'mở chi tiết',
        enter: async (page) => {
          await page.getByRole('button', { name: /Xem chi tiết tái cấu trúc/ }).click()
          await expect(page.getByText(MOCK_TEXT.subconsciousHypothesis)).toBeVisible()
        },
      },
    ],
  },
  {
    card: 'Workplace Harvester',
    studio: 'Kế hoạch',
    title: 'Workplace Error Harvester',
    states: [
      {
        name: 'lỗi đã thu hoạch',
        enter: async (page) => {
          await expect(
            page.getByText(MOCK_TEXT.harvestedMistake, { exact: false }).first(),
          ).toBeVisible()
        },
      },
      {
        name: 'thẻ SRS',
        enter: async (page) => {
          await page.getByRole('button', { name: /^Thẻ SRS/ }).click()
          await expect(page.getByText(MOCK_TEXT.srsFront, { exact: false })).toBeVisible()
        },
      },
    ],
  },
  {
    card: 'A2A Mesh',
    studio: 'Kế hoạch',
    title: 'Mạng Lưới Agent-to-Agent (A2A Mesh)',
    states: [
      {
        name: 'mở rộng',
        enter: async (page) => {
          await page.getByRole('button', { name: /Mạng Lưới Agent-to-Agent/ }).click()
          await expect(page.getByText(MOCK_TEXT.a2aTopic)).toBeVisible()
        },
      },
    ],
  },
  {
    card: 'Thấu cảm sinh học',
    studio: 'Kế hoạch',
    title: 'Thấu cảm sinh học',
    states: [
      {
        name: 'mở rộng, bật lá chắn',
        enter: async (page) => {
          await page.getByRole('button', { name: /Thấu cảm sinh học/ }).click()
          await expect(page.getByText('Chặn thông báo xao nhãng')).toBeVisible()
        },
      },
    ],
  },
]

/** Đánh dấu khung thẻ chứa tiêu đề `title` làm vùng quét (gỡ dấu cũ trước). */
async function markCard(page: Page, title: string) {
  const heading = page.getByText(title, { exact: false }).first()
  await expect(heading).toBeVisible()
  await heading.evaluate((el, attr) => {
    document.querySelectorAll(`[${attr}]`).forEach((node) => node.removeAttribute(attr))
    const root = el.closest('.rounded-2xl')
    if (!root) throw new Error('Không tìm thấy khung thẻ (.rounded-2xl) quanh tiêu đề')
    root.setAttribute(attr, '')
  }, SCAN_ROOT_ATTR)
}

for (const theme of THEMES) {
  for (const { card, studio, title, states } of CARDS) {
    test(`a11y sau tương tác: ${card} (studio ${studio}) theme=${theme}`, async ({ page }) => {
      await mockLogin(page, 'vi', theme)
      await muteTts(page)
      await mockCompanionInteractiveApis(page)
      await page.goto('/ban-dong-hanh', { waitUntil: 'domcontentloaded' })
      const tab = page.getByRole('button', { name: studio, exact: true })
      await tab.click()
      await expect(tab).toHaveAttribute('aria-pressed', 'true')

      const failures: string[] = []
      for (const state of states) {
        await state.enter(page)
        await waitForStableDom(page)
        await markCard(page, title)
        const where = `${card} · ${state.name} · theme=${theme}`
        for (const v of await scanScopedAa(page)) failures.push(`[AA] ${where}: ${v}`)
        for (const v of await scanScopedAaa(page, `${card}-${state.name}`))
          failures.push(`[AAA] ${where}: ${v}`)
      }
      expect(
        failures,
        `Vi phạm a11y ở trạng thái sau tương tác — sửa bằng token/biến thể theme (theme-light:…), ` +
          `không hard-code màu, không nới ngưỡng.`,
      ).toEqual([])
    })
  }
}

// Đối chứng âm cho bộ đo nền gradient (helpers/gradientContrast.ts) — chứng minh nó KHÔNG làm cổng
// xanh giả: một điểm dừng tệ là đủ rớt; chữ bị phần tử khác đè thì giữ nguyên "incomplete".
test.describe('đối chứng: đo chữ trên nền gradient', () => {
  const html = (body: string) =>
    `<html lang="vi"><head><title>Đối chứng</title></head><body style="background:#fff">` +
    `<main ${SCAN_ROOT_ATTR}>${body}</main></body></html>`

  test('một điểm dừng tương phản thấp là đủ rớt (dù phần lớn dải màu đạt)', async ({ page }) => {
    await page.setContent(
      html(
        '<p id="bad" style="color:#111;background:linear-gradient(90deg,#fff,#fff 80%,#666)">Chữ đọc trên dải màu</p>',
      ),
    )
    const findings = await scanScopedAaa(page, 'control-bad')
    expect(findings.some((f) => f.includes('gradient-worst-stop') && f.includes('#bad'))).toBe(true)
  })

  test('mọi điểm dừng đạt 7:1 thì kết luận được, không còn lỗi', async ({ page }) => {
    await page.setContent(
      html('<p style="color:#111;background:linear-gradient(90deg,#fff,#eef)">Chữ đọc đạt</p>'),
    )
    expect(await scanScopedAaa(page, 'control-good')).toEqual([])
  })

  test('chữ bị phần tử khác đè lên thì không kết luận (giữ incomplete)', async ({ page }) => {
    await page.setContent(
      html(
        '<div style="position:relative;background:linear-gradient(90deg,#fff,#eef)">' +
          '<p id="covered" style="color:#111;margin:0">Chữ bị che một phần</p>' +
          '<span style="position:absolute;inset:0;background:rgba(0,0,0,.05)"></span></div>',
      ),
    )
    const findings = await scanScopedAaa(page, 'control-covered')
    expect(findings.some((f) => f.startsWith('incomplete:') && f.includes('#covered'))).toBe(true)
  })
})
