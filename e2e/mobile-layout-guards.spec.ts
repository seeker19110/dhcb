// e2e/mobile-layout-guards.spec.ts — S03-2: bố cục mobile không để thanh dưới che hành động.
//
// VÌ SAO CÓ FILE NÀY (đo 2026-09-15): đặc tả §④ B gạch 2 đòi "ở 390×844 và 320px, nội dung và
// hành động không bị GuestBanner/bottom nav/header che". Trước đợt này KHÔNG có phép đo nào
// canh điều đó — `e2e/a11y*.spec.ts` chạy ở viewport desktop mặc định, nên một trang quên chừa
// chỗ cho thanh điều hướng đáy sẽ hỏng LẶNG LẼ.
//
// Nó đã hỏng thật: `/welcome` và `/learn-vietnamese` tự khai `pb-16` (64px) thay vì dùng
// `PageShell`, trong khi thanh điều hướng cao 97px — nút CTA chính ("Đăng ký ngay — miễn phí")
// nằm dưới thanh nav và KHÔNG BẤM ĐƯỢC. Bốn trang trụ thì `!pb-20` (80px, có `!important`) ghi
// đè lề của `PageShell`, thiếu 17px — chưa cắn khi dữ liệu còn ngắn, sẽ cắn khi người dùng có
// đủ nội dung.
//
// HAI PHÉP ĐO, cố ý khác nhau:
//
//  1. BẤT BIẾN LỀ (`padding-bottom` vùng nội dung ≥ chiều cao thanh nav) — KHÔNG phụ thuộc độ
//     dài nội dung, nên nó bắt được cả lỗi TIỀM ẨN mà trang ngắn chưa lộ ra. Đây là lý do phép
//     đo này tồn tại thay vì chỉ chụp ảnh: đo bằng nội dung mock ngắn thì 4 trang trụ hiện ra
//     "sạch" dù lề vẫn thiếu.
//  2. BẤM ĐƯỢC THẬT (`elementFromPoint` tại tâm nút cuối trang) — bằng chứng trực tiếp rằng
//     người dùng chạm tới được, không phải suy ra từ con số lề.
import { test, expect, type Page } from '@playwright/test'
import { mockLogin } from './helpers/auth'
import { mockDomainApis } from './helpers/domains'

/** Hai bề rộng đặc tả nêu đích danh. */
const VIEWPORTS = [
  { name: '390x844', width: 390, height: 844 },
  { name: '320x568', width: 320, height: 568 },
]

/**
 * Trang phải chừa chỗ cho thanh điều hướng đáy.
 *
 * Không quét tự động toàn bộ route: danh sách cố định thì một trang mới quên `PageShell` sẽ
 * được thêm vào đây một cách CÓ Ý THỨC, thay vì lặng lẽ lọt qua vì vòng quét không biết tới nó.
 */
const ROUTES = [
  '/',
  // [S05] Màn gợi ý của /bat-dau có CTA "Bắt đầu" ở cuối — trang tự khai `<main>` (không dùng
  // PageShell) nên phải đo riêng ở đây, và nó KHÔNG nằm trong NAV_HIDDEN_PATHS.
  '/bat-dau',
  '/goc-hoc-tap',
  '/welcome',
  '/learn-vietnamese',
  '/ket-ban',
  '/luyen-tap',
  '/ho-so',
  '/gia-ca',
  '/kien-thuc-ung-dung',
  '/ghi-chu',
  '/ghi-chu/kanban',
  // [S07-2] Vùng học môn STEM: hai trang này nay có mục lục (nút mở panel ở trang bài, cây bài
  // ở trang danh sách). Trước đợt này chưa route môn nào của STEM nằm trong phép đo lề dưới.
  '/goc-hoc-tap/physics/bai-hoc',
  '/goc-hoc-tap/physics/bai-hoc/ly10-c2-b10--su-roi-tu-do',
]

/**
 * NGOẠI LỆ CÓ CHỦ ĐÍCH — không phải chỗ để nhét trang đang hỏng vào cho cổng xanh.
 *
 * `/dong-hanh` (Companion) là khung chiều-cao-đầy (`flex flex-1 flex-col`) ép `!py-4`: đệm dưới
 * lớn của `PageShell` đẩy nội dung chồng lên hàng nút Studio — đo được là 3 vi phạm
 * `target-size` ở cổng a11y. Xem chú thích tại `apps/dhcb/src/pages/companion/Companion.tsx`
 * (đợt 4 thiết kế lại desktop, 2026-09-02). Vùng cuộn nằm ở phần tử BÊN TRONG nên phép đo lề
 * trên `<main>` không nói đúng về trang này.
 */
const MIEN_TRU = new Set(['/dong-hanh'])

/** Lề dưới thực tế của vùng nội dung, và chiều cao thật của thanh điều hướng. */
async function doLeDuoi(page: Page) {
  return page.evaluate(() => {
    const bnav = document.querySelector('nav[aria-label="Điều hướng chính"]') as HTMLElement | null
    // `<main>` của `PageShell` (#noi-dung-chinh) hoặc `<main>` trang tự khai.
    const main = (document.getElementById('noi-dung-chinh') ||
      document.querySelector('main')) as HTMLElement | null
    return {
      coNav: !!bnav,
      coMain: !!main,
      navH: bnav ? Math.round(bnav.getBoundingClientRect().height) : 0,
      leDuoi: main ? Math.round(parseFloat(getComputedStyle(main).paddingBottom)) : -1,
      tranNgang: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    }
  })
}

for (const vp of VIEWPORTS) {
  test(`lề dưới ≥ thanh điều hướng ở mọi trang @${vp.name}`, async ({ page }) => {
    // Một test nạp 13 trang trong CÙNG một context (rẻ hơn 13 test mỗi test một lần tải, xem
    // luật CI mục 11.1) — nên phải nới hạn giờ mặc định 30s, nếu không test đỏ vì HẾT GIỜ chứ
    // không phải vì bắt được lỗi, và thông báo đỏ đó nói sai chuyện đã xảy ra.
    test.setTimeout(180_000)
    await page.setViewportSize({ width: vp.width, height: vp.height })
    await mockLogin(page, 'vi', 'dark-blue')
    await mockDomainApis(page)

    const thieu: string[] = []
    const tran: string[] = []
    for (const route of ROUTES) {
      if (MIEN_TRU.has(route)) continue
      await page.goto(route, { waitUntil: 'domcontentloaded' })
      await page.waitForSelector('main', { timeout: 30_000 })
      // BottomNav có thể chủ ý không được render ở landing/focus mode. Khi không có nav,
      // chiều cao cần chừa là 0; vẫn kiểm main và tràn ngang thay vì chờ một phần tử không tồn tại.
      // Chờ khối nạp lười dựng xong — đo sớm thì `<main>` còn là khung rỗng của Suspense.
      await page.waitForTimeout(1200)

      const d = await doLeDuoi(page)
      expect(d.coMain, `${route}: không thấy vùng nội dung`).toBe(true)
      if (d.leDuoi < d.navH) {
        thieu.push(
          `${route}: lề dưới ${d.leDuoi}px < thanh nav ${d.navH}px (thiếu ${d.navH - d.leDuoi}px)`,
        )
      }
      if (d.tranNgang > 0) tran.push(`${route}: tràn ngang ${d.tranNgang}px`)
    }

    expect(
      thieu,
      `Trang chừa thiếu chỗ cho thanh điều hướng đáy — nội dung cuối trang sẽ bị che:\n${thieu.join('\n')}`,
    ).toEqual([])
    expect(tran, `Trang tràn ngang ở ${vp.name}:\n${tran.join('\n')}`).toEqual([])
  })
}

/**
 * Bằng chứng trực tiếp cho lỗi đã tìm ra: nút CTA cuối trang landing phải BẤM ĐƯỢC THẬT.
 *
 * Dùng `elementFromPoint` chứ không chỉ so toạ độ: thứ ta cần biết là cú chạm của người dùng
 * rơi vào nút hay rơi vào thanh điều hướng nằm đè lên nó.
 */
const LANDING = [
  { route: '/welcome', cta: 'Đăng ký ngay — miễn phí' },
  { route: '/learn-vietnamese', cta: 'Sign up free' },
]

for (const vp of VIEWPORTS) {
  for (const { route, cta } of LANDING) {
    test(`CTA "${cta}" bấm được ở cuối trang ${route} @${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height })
      await mockLogin(page, 'vi', 'dark-blue')
      await page.goto(route, { waitUntil: 'domcontentloaded' })

      const nut = page.getByRole('button', { name: cta }).last()
      await expect(nut).toBeVisible()
      await nut.scrollIntoViewIfNeeded()
      // Cuộn hết đáy — đây đúng là tình huống người dùng đọc xong trang rồi mới bấm.
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
      await page.waitForTimeout(400)

      const ketQua = await nut.evaluate((el) => {
        const b = el.getBoundingClientRect()
        const hit = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2)
        const cheBoi = hit && hit !== el && !el.contains(hit) ? (hit as HTMLElement) : null
        return {
          trongKhungNhin: b.bottom <= window.innerHeight && b.top >= 0,
          cheBoi: cheBoi ? `${cheBoi.tagName}.${cheBoi.className.slice(0, 40)}` : null,
        }
      })

      expect(ketQua.cheBoi, `Nút "${cta}" bị phần tử khác che nên không bấm được`).toBeNull()
      expect(
        ketQua.trongKhungNhin,
        `Nút "${cta}" không nằm trọn trong khung nhìn sau khi cuộn hết đáy`,
      ).toBe(true)
    })
  }
}

// [P0-4, 2026-09-17, AC-4] Header mobile chỉ còn 4 khe — không nút nào bị cắt chữ
// (`scrollWidth > clientWidth` là dấu hiệu `truncate` ăn mất nội dung mà không co lại được).
test('header mobile 360×740: không phần tử nào bị cắt chữ (truncate)', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 })
  await mockLogin(page, 'vi', 'dark-blue')
  await page.goto('/goc-hoc-tap/english/tro-truyen', { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('header')

  const cacDoTran = await page.evaluate(() => {
    const header = document.querySelector('header')
    if (!header) return []
    const els = Array.from(header.querySelectorAll<HTMLElement>('button, a'))
    return els
      .filter((el) => el.scrollWidth > el.clientWidth + 1) // +1: sai số dựng chữ (subpixel)
      .map((el) => (el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 40))
  })

  expect(cacDoTran, `Phần tử header bị cắt chữ: ${cacDoTran.join(', ')}`).toEqual([])
})

// [P1-7, lệnh 9, AC-5] BottomNav 5 tab ở 360px — nhãn rút gọn (Học/Ôn tập/Tôi) không được cắt.
test('BottomNav 360×740: không nhãn tab nào bị cắt chữ (truncate)', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 })
  await mockLogin(page, 'vi', 'dark-blue')
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('nav[aria-label="Điều hướng chính"]')

  const cacDoTran = await page.evaluate(() => {
    const nav = document.querySelector('nav[aria-label="Điều hướng chính"]')
    if (!nav) return []
    const els = Array.from(nav.querySelectorAll<HTMLElement>('span'))
    return els
      .filter((el) => el.scrollWidth > el.clientWidth + 1) // +1: sai số dựng chữ (subpixel)
      .map((el) => (el.textContent || '').trim().slice(0, 40))
  })

  expect(cacDoTran, `Nhãn BottomNav bị cắt chữ: ${cacDoTran.join(', ')}`).toEqual([])
})
