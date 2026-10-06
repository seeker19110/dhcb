import { test, expect, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { mockLogin, type ThemeName } from './helpers/auth'
import { openLiveLocationTrip } from './helpers/location'
import { mockLessonContrastSample } from './helpers/lessonContrastFixture'
import { freezeAnimations, waitForStableDom } from './helpers/axe'
import { moCauTuThuLai } from './helpers/stemRetry'
import { muteTts } from './helpers/tts'
import {
  AAA_RULE_IDS,
  AAA_TAGS,
  collectAaaFindings,
  classifyAaaTarget,
  measuredAa,
  type AaaResolution,
} from './helpers/aaaFindings'
import axe from 'axe-core'
import { remeasureContrast, type ContrastRemeasurement } from './helpers/remeasureContrast'

// ─────────────────────────────────────────────────────────────────────────────
// QUÉT WCAG 2.x mức AAA — bổ sung cho e2e/a11y.spec.ts (file kia gác mức A/AA).
//
// LUẬT DỰ ÁN (CLAUDE.md mục 4.5), theo khuyến nghị của W3C:
//   - W3C (Understanding Conformance) KHÔNG khuyến nghị lấy AAA làm chính sách cho
//     TOÀN site vì có loại nội dung không thể đạt hết AAA.
//   - Nên: **NỘI DUNG và TIÊU ĐỀ** (chữ để đọc: h1–h6, p, li, bảng, blockquote…) phải
//     đạt **AAA** (tương phản ≥ 7:1); mọi phần còn lại (nav, nút, badge, ô nhập, biểu
//     tượng…) phải đạt **AA** — cổng AA tuyệt đối 0 vi phạm ở e2e/a11y.spec.ts.
//
// Cổng này TUYỆT ĐỐI: 0 vi phạm AAA trên nội dung/tiêu đề, 15 trang × 5 theme.
// Nợ tương phản cũ (~305 phần tử) đã xử lý xong ngày 2026-08-04 bằng cách chỉnh token
// --z-300/--z-400 của cả 5 theme (xem apps/dhcb/src/index.css + PROGRESS.md), nên
// KHÔNG còn baseline nào — thêm màn hình mới mà rớt 7:1 là fail ngay.
// ─────────────────────────────────────────────────────────────────────────────

// Quét CẢ 5 theme (4 theme chính + "Nhi đồng") vì tương phản phụ thuộc bộ token màu.
const THEMES: ThemeName[] = ['dark-blue', 'blue-sky', 'kid']

const ROUTES = [
  '/login',
  '/',
  '/tien-do',
  '/tu-dien',
  '/bai-hoc',
  // [S09c] Bài hội thoại mở theo URL: tiêu đề bài, đích lượt, `#ket-qua` rỗng.
  '/goc-hoc-tap/english/bai-hoc?lesson=1#ket-qua',
  '/lich-su-hoc',
  '/cau-thong-dung',
  '/lo-trinh-hoc',
  '/lo-trinh-hoc/a1', // trang riêng cấp CEFR (6 cấp dùng chung layout)
  '/lo-trinh-hoc/c1', // cấp nâng cao (accent rose) — gồm cả màn khóa
  '/tro-truyen',
  '/luyen-viet',
  '/luyen-noi',
  '/cai-dat',
  '/thu-thach',
  '/lap-trinh', // môn Lập trình: tổng quan P1–P6 (PR-L1)
  '/lap-trinh/p1', // trang một bậc, bản PHẲNG (P1–P5 dùng chung layout)
  '/lap-trinh/p6', // trang một bậc, bản CÓ CHIA MẠCH (PR-M12) — thêm tầng tiêu đề h3 + mô tả mạch
  '/lap-trinh/chay-thu', // sandbox chạy Python (PR-L2)
  '/lap-trinh/bai-hoc/p1-u4-l1', // bài học 8 bước (PR-L3)
  '/lap-trinh/du-an', // dự án trục chặng P1 (PR-L3b)
  '/so-tay-loi-sai', // sổ lỗi: bộ lọc môn + nhãn bằng chứng + nút "Ôn lại" (S12-2)
  '/lap-trinh/on-tap', // ôn thẻ SRS môn Lập trình (PR-L10) — màn rỗng khi chưa có thẻ
  '/goc-hoc-tap/on-tap', // hub ôn tập xuyên môn (S12-1) — màn rỗng khi chưa có gì đến hạn
  '/goc-hoc-tap/physics/on-tap', // ôn thẻ một môn STEM (S12-1) — bốn môn dùng chung layout
  '/lap-trinh/gioi-thieu', // mô tả khoá học & mục tiêu (PR-UX3) — trang gần như toàn chữ đọc
  '/lap-trinh/huong', // danh sách 13 hướng chuyên sâu (PR-L-SPEC)
  '/lap-trinh/huong/web--lap-trinh-web', // chi tiết một hướng — trang chữ dài, nhiều tương phản
  '/lap-trinh/huong/architecture--kien-truc-he-thong-dac-ta-cho-ai-thi-hanh', // hướng kiến trúc — trang chi tiết dài nhất, nhiều danh sách chữ
  '/lap-trinh/huong/web--lap-trinh-web/web-s2--full-stack-co-backend-cua-minh', // trang CHẶNG: mục tiêu, tự kiểm, rubric, đặc tả 6 ô
  '/lap-trinh/khoa-hoc/git--git-github-thuc-hanh', // khoá ngắn Git & GitHub (PR 3/4 khoá Git) — cắt ngang bậc
  '/lap-trinh/bai-hoc/p3-u10-l1?khoa=git', // [S07-2] bài mở theo ngữ cảnh khoá — mục lục là cây khoá
  // [2026-09-13] Bốn môn STEM nối vào app. Trang bài học gần như toàn chữ đọc nên AAA là
  // chuẩn đúng cho nó; quét một môn đại diện vì cả bốn dùng chung một khuôn trang.
  '/goc-hoc-tap/physics/bai-hoc', // danh sách bài
  '/goc-hoc-tap/physics/bai-hoc/ly10-c2-b10--su-roi-tu-do', // một bài đầy đủ, có hoạt ảnh
  // [S13-1] Màn trợ giảng — một trong sáu màn mẫu của goal learning-ux
  // (`e2e/helpers/learningUxScreens.ts`, màn `tutor`). Đã có ở cổng AA nhưng thiếu ở
  // AAA: đây là màn ĐỌC (lời giải thích của trợ giảng) nên AAA là chuẩn đúng cho nó.
  '/ban-dong-hanh',
  '/goc-hoc-tap/english/luyen-nghe', // audit 2026-09-22 P0-1: nhóm gập + tìm kiếm + Xem thêm
  // [S06b] Hai màn đã ở cổng AA nhưng chưa ở AAA. Banner Sổ tay lỗi sai / Đấu trường từng
  // đặt chữ đọc trên gradient nên axe không đo được 7:1 (incomplete) — nay chữ nằm trên nền
  // token đặc, phải qua cổng AAA như mọi màn đọc khác.
  '/luyen-tap', // Phòng luyện tập
  '/goc-hoc-tap/english', // trang tổng quan môn Tiếng Anh
] as const

test.beforeEach(async ({ page }) => {
  await page.route('**/api/programming/progress**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(
        route.request().method() === 'GET'
          ? { lessons: [] }
          : { ok: true, replayed: false, lessons: [] },
      ),
    }),
  )
})

async function scanAaa(page: Page, remainingRefreshes = 1): Promise<string[]> {
  await expect(
    page.getByRole('status').filter({ hasText: /^Đang đồng bộ dữ liệu \(\d+ mục\)\.\.\.$/ }),
  ).toHaveCount(0)
  await freezeAnimations(page)
  await waitForStableDom(page)
  const watcher = await page.evaluateHandle(() => {
    let mutations = 0
    const details: {
      type: string
      attribute: string | null
      target: string
      added: string[]
      removed: string[]
    }[] = []
    const record = (records: MutationRecord[]) => {
      mutations += records.length
      for (const item of records) {
        if (details.length < 20)
          details.push({
            type: item.type,
            attribute: item.attributeName,
            added: [...item.addedNodes]
              .slice(0, 2)
              .map((node) =>
                node instanceof Element
                  ? node.outerHTML.slice(0, 500)
                  : (node.textContent?.slice(0, 500) ?? node.nodeName),
              ),
            removed: [...item.removedNodes]
              .slice(0, 2)
              .map((node) =>
                node instanceof Element
                  ? node.outerHTML.slice(0, 500)
                  : (node.textContent?.slice(0, 500) ?? node.nodeName),
              ),
            target:
              item.target instanceof Element
                ? item.target.outerHTML.slice(0, 1000)
                : item.target.nodeName,
          })
      }
    }
    const observer = new MutationObserver((records) => {
      record(records)
    })
    observer.observe(document.documentElement, {
      subtree: true,
      childList: true,
      attributes: true,
      characterData: true,
    })
    return {
      stop: () => {
        record(observer.takeRecords())
        observer.disconnect()
        return { mutations, details }
      },
    }
  })
  try {
    // Union rõ ràng: withRules sau withTags sẽ ghi đè tags, không phải phép hợp.
    const results = await new AxeBuilder({ page }).withRules(AAA_RULE_IDS).analyze()
    const resolutions: AaaResolution[] = []
    const unresolvedMeasurements: { target: axe.NodeResult['target']; reason: string }[] = []
    let findings = await collectAaaFindings(page, results, {
      passes: results.passes,
      snapshotStable: true,
      resolutions,
      unresolvedMeasurements,
    })
    const { mutations, details: mutationDetails } = await watcher.evaluate((state) => state.stop())
    if (mutations > 0) {
      resolutions.length = 0
      findings = await collectAaaFindings(page, results)
      findings.push(`unresolved: DOM changed during scan (${mutations} mutations)`)
    }
    const remeasurements: ContrastRemeasurement[] = []
    if (mutations === 0) {
      const cache = new Map<string, ContrastRemeasurement>()
      for (const rule of results.incomplete) {
        if (!['color-contrast', 'color-contrast-enhanced'].includes(rule.id)) continue
        for (const node of rule.nodes) {
          const key = JSON.stringify(node.target)
          const prefix = `incomplete: ${rule.id} target=${key} (`
          if (!findings.some((finding) => finding.startsWith(prefix))) continue
          const classification = await classifyAaaTarget(page, node.target)
          if (classification !== 'content' && classification !== 'chrome') continue
          let measurement = cache.get(key)
          if (!measurement) {
            measurement = await remeasureContrast(page, node.target, () =>
              classifyAaaTarget(page, node.target),
            )
            cache.set(key, measurement)
            remeasurements.push(measurement)
          }
          if (!measurement.stable || measurement.reason || !measurement.results) continue
          const measuredClassification = measurement.classification
          if (measuredClassification !== 'content' && measuredClassification !== 'chrome') continue
          const rerun = measurement.results
          if (
            rerun.violations.some(
              (item) =>
                (item.id === 'color-contrast' || measuredClassification === 'content') &&
                item.nodes.some((item) => JSON.stringify(item.target) === key),
            )
          )
            continue
          if (measurement.halo?.status === 'measured' && measurement.halo.ratio >= 7) {
            const halo = measurement.halo
            resolutions.push({
              target: node.target,
              incompleteRule: rule.id,
              resolvedBy: halo.method,
              foreground: halo.foreground,
              background: halo.background,
              ratio: halo.ratio,
              strokeWidth: halo.strokeWidth,
            })
            findings = findings.filter((finding) => !finding.startsWith(prefix))
            continue
          }
          const pass = rerun.passes
            .find((item) => item.id === 'color-contrast')
            ?.nodes.find((item) => JSON.stringify(item.target) === key)
          const colors = pass ? measuredAa(pass) : null
          if (colors && colors.ratio >= (measuredClassification === 'content' ? 7 : 4.5)) {
            resolutions.push({
              target: node.target,
              incompleteRule: rule.id,
              resolvedBy: 'scroll-exact-contrast',
              ...colors,
            })
            findings = findings.filter((finding) => !finding.startsWith(prefix))
          }
        }
      }
    }
    await test.info().attach('axe-aaa-evidence', {
      body: JSON.stringify({
        url: page.url(),
        remainingRefreshes,
        mutations,
        mutationDetails,
        violations: results.violations,
        incomplete: results.incomplete,
        resolutions,
        remeasurements,
        unresolvedMeasurements,
      }),
      contentType: 'application/json',
    })
    if (remeasurements.some((measurement) => measurement.scrollChanged)) {
      if (remainingRefreshes === 0) {
        findings.push('unresolved: page changed again while scrolling after fresh full-page scan')
      } else {
        // Giữ mọi finding cũ; full-page scan mới phải bắt cả nội dung lazy append ngoài target.
        findings.push(...(await scanAaa(page, remainingRefreshes - 1)))
      }
    }
    return [...new Set(findings)]
  } finally {
    await watcher.evaluate((state) => state.stop())
    await watcher.dispose()
  }
}

for (const theme of THEMES) {
  for (const route of ROUTES) {
    test(`a11y AAA (nội dung + tiêu đề): ${route} theme=${theme}`, async ({ page }) => {
      await mockLogin(page, 'vi', theme)
      // [S09c] Bài hội thoại 20 lượt: mỗi CHỮ là một <span> karaoke → hàng trăm nút cần đo
      // tương phản; đo thật ~22–30s ở máy dev, sát trần 30s mặc định → nới thời gian cho đúng ca này.
      if (route.startsWith('/goc-hoc-tap/english/bai-hoc?')) test.slow()
      // Cả danh sách lẫn bài mở theo URL đều có danh sách bài (cột trái desktop) — giữ mẫu
      // hữu hạn để cuộn đo chữ không kéo vòng tải thêm 350 bài.
      if (route === '/bai-hoc' || route.startsWith('/goc-hoc-tap/english/bai-hoc'))
        await mockLessonContrastSample(page)
      await page.goto(route, { waitUntil: 'domcontentloaded' })
      // Dữ liệu curriculum/từ điển tính OFFLINE ở client (networkidle không giúp) nên
      // chờ cố định cho render xong — cùng cách làm với e2e/a11y.spec.ts.
      // Chờ theo TRẠNG THÁI, không theo thời gian — xem lý do ở `waitForStableDom`.
      await waitForStableDom(page)

      const violated = await scanAaa(page)
      expect(
        violated,
        `Vi phạm WCAG AAA trên nội dung/tiêu đề ở ${route} theme=${theme} — ` +
          `chữ nội dung phải đạt tương phản ≥ 7:1 (chỉnh token màu ở apps/dhcb/src/index.css).`,
      ).toEqual([])
    })
  }
}

// Khối duyệt chuyên môn (chỉ admin, cuối trang bài học) mang thêm mấy đoạn <p> hướng dẫn —
// đúng loại "nội dung để đọc" nên phải qua cổng AAA này, không chỉ cổng AA.
for (const theme of THEMES) {
  test(`a11y AAA: khối duyệt trong bài học (admin) theme=${theme}`, async ({ page }) => {
    await mockLogin(page, 'vi', theme, { isAdmin: true })
    await page.route('**/api/admin-stem-review**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '{"luotDuyet":[]}' }),
    )
    await page.goto('/goc-hoc-tap/biology/bai-hoc/sinh12-c1-b1--nhan-doi-adn', {
      waitUntil: 'domcontentloaded',
    })
    await waitForStableDom(page)
    await page.getByRole('button', { name: /Duyệt chuyên môn bài này/ }).click()
    await expect(page.getByRole('textbox', { name: /Tên người duyệt/ })).toBeVisible()

    const violated = await scanAaa(page)
    expect(violated, `Vi phạm WCAG AAA trên nội dung khối duyệt theme=${theme}.`).toEqual([])
  })
}

// Khối AI phản hồi code (PR-L5) chỉ hiện ở bước "Tự viết" sau khi gọi API → vòng quét theo
// ROUTES ở trên không thấy. Quét riêng đúng trạng thái đó, đủ 5 theme.
for (const theme of THEMES) {
  test(`a11y AAA (nội dung + tiêu đề): AI xem code (Lập trình) theme=${theme}`, async ({
    page,
  }) => {
    await page.route('**/api/programming/feedback', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          text: 'Đề bài muốn in ra số tiền điện. Bạn thử đọc lại xem mốc 50 kWh đầu tính giá nào nhé?',
          kind: 'socratic_hint',
          hintLevel: 1,
        }),
      }),
    )
    await mockLogin(page, 'vi', theme)
    await page.goto('/lap-trinh/bai-hoc/p1-u4-l1', { waitUntil: 'domcontentloaded' })
    await page.getByRole('button', { name: 'Tự viết' }).click()
    await page.getByRole('button', { name: /Gợi ý bậc/ }).click()
    await expect(page.getByText(/mốc 50 kWh đầu/)).toBeVisible()
    // Về đầu trang trước khi quét, như mọi vòng quét theo route ở trên (không bao giờ cuộn).
    // Playwright tự cuộn để bấm "Gợi ý bậc"; độ cuộn đó phụ thuộc chiều cao bố cục, và khi dòng
    // CodeMirror nằm đúng dưới header dính (nền mờ + blur) thì axe không xác định được nền của
    // chữ HEADER → "incomplete" giả, đổi theo từng pixel bố cục (S09d thêm heading bước là lộ
    // ra). Khối AI dưới màn hình vẫn được đo lại bằng `remeasureContrast` (tự cuộn tới đích).
    await page.evaluate(() => window.scrollTo(0, 0))

    const violated = await scanAaa(page)
    expect(violated, `Vi phạm WCAG AAA trên khối AI phản hồi code, theme=${theme}.`).toEqual([])
  })
}

// Màn "Đi chung" khi ĐANG TRONG CHUYẾN — cũng nằm ngoài vòng quét theo ROUTES ở trên vì
// giao diện chỉ dựng sau khi có dữ liệu chuyến. Fixture dùng chung với cổng A/AA.
for (const theme of THEMES) {
  test(`a11y AAA (nội dung + tiêu đề): Đi chung — trong chuyến theme=${theme}`, async ({
    page,
  }) => {
    await openLiveLocationTrip(page, theme)
    const violated = await scanAaa(page)
    expect(
      violated,
      `Vi phạm WCAG AAA trên nội dung/tiêu đề ở /nhom-di-chung theme=${theme} — ` +
        `chữ nội dung phải đạt tương phản ≥ 7:1 (chỉnh token màu ở apps/dhcb/src/index.css).`,
    ).toEqual([])
  })
}

// ── [S11-3] Màn KẾT QUẢ sau khi nộp bài tự kiểm tra STEM ────────────────────────────
// Chỉ hiện SAU một lượt POST nên vòng quét theo route ở trên không bao giờ thấy nó. Quét
// trạng thái "nộp KHÔNG đạt" vì đó là trạng thái vẽ ra NHIỀU thứ nhất: câu tổng kết, dòng
// ngưỡng, danh sách từng câu kèm lý do sai và lời giảng, nút "Làm lại", liên kết "Bài tiếp theo".
const BAI_STEM = '/goc-hoc-tap/physics/bai-hoc/ly10-c2-b10--su-roi-tu-do'

/** Server chấm lại và trả "chưa đạt" — chữ trên màn hình là chữ của SERVER (S11 §⑤). */
async function mockNopChuaDat(page: Page) {
  await page.route('**/api/learning/evidence*', (route) => {
    if (route.request().method() !== 'POST') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: '{"state":[]}' })
    }
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        schemaVersion: 1,
        subjectId: 'physics',
        contentId: 'ly10-c2-b10',
        activityKind: 'stem_lesson_check',
        attemptId: 'attempt-0123456789abcd',
        clientAt: '2026-09-16T00:00:00.000Z',
        ownerId: 'u-1',
        evidenceKind: 'server_graded',
        correct: 1,
        total: 4,
        ratio: 0.25,
        passed: false,
        serverAt: '2026-09-16T00:00:01.000Z',
        items: [
          { questionIndex: 0, correct: true, reason: 'CORRECT' },
          { questionIndex: 1, correct: false, reason: 'MISSING_UNIT' },
          { questionIndex: 2, correct: false, reason: 'WRONG_VALUE' },
          { questionIndex: 3, correct: false, reason: 'EMPTY' },
        ],
      }),
    })
  })
}

/** Trả lời hết mọi câu rồi nộp, chờ màn kết quả hiện ra theo TRẠNG THÁI (không theo thời gian). */
async function nopBaiStem(page: Page) {
  const cauHoi = page.locator('h2:has-text("Tự kiểm tra") + ul > li')
  await expect(cauHoi.first()).toBeVisible()
  for (let i = 0; i < (await cauHoi.count()); i += 1) {
    const li = cauHoi.nth(i)
    const o = li.locator('input[id^="tra-loi-"]')
    if ((await o.count()) > 0) await o.fill('20 m/s')
    else await li.getByRole('button').first().click()
  }
  await page.getByRole('button', { name: 'Nộp bài tự kiểm tra' }).click()
  await expect(page.getByRole('region', { name: 'Kết quả lượt nộp' })).toBeVisible()
}

for (const theme of THEMES) {
  test(`a11y AAA (nội dung + tiêu đề): màn kết quả bài STEM (đã nộp) theme=${theme}`, async ({
    page,
  }) => {
    await mockNopChuaDat(page)
    await mockLogin(page, 'vi', theme)
    await page.goto(BAI_STEM, { waitUntil: 'domcontentloaded' })
    await waitForStableDom(page)
    await nopBaiStem(page)
    const violated = await scanAaa(page)
    expect(violated, `Vi phạm WCAG AAA trên màn kết quả bài STEM, theme=${theme}.`).toEqual([])
  })
}

// [S11b] Câu STEM ở chế độ TỰ THỬ LẠI (vào từ Sổ lỗi) — chỉ tồn tại sau một lượt bấm có
// router state, nên vòng quét theo route không thấy. Dòng hướng dẫn là chữ đọc → 7:1.
for (const theme of THEMES) {
  test(`a11y AAA (nội dung + tiêu đề): câu STEM tự thử lại từ Sổ lỗi theme=${theme}`, async ({
    page,
  }) => {
    await mockLogin(page, 'vi', theme)
    await moCauTuThuLai(page)
    await waitForStableDom(page)
    const violated = await scanAaa(page)
    expect(violated, `Vi phạm WCAG AAA ở câu STEM tự thử lại, theme=${theme}.`).toEqual([])
  })
}

// Controls chạy qua cùng collector của gate, không cần server/provider.
test.describe('S06a negative controls', () => {
  test('lazy append chữ tương phản thấp ngoài target vẫn chặn toàn trang', async ({ page }) => {
    await page.setContent(
      '<html lang="vi"><head><title>Scroll toàn trang</title></head><body style="color:#111;background:white"><div id="scroller" style="height:100px;overflow:auto;background:linear-gradient(white,#eee)"><div style="height:40px"></div><p id="target" style="font-size:20px;line-height:40px;height:100px">Nội dung đích đủ dài và đủ tương phản</p></div></body></html>',
    )
    await page.evaluate(() => {
      document.querySelector('#scroller')!.addEventListener(
        'scroll',
        () => {
          ;(document.querySelector('#scroller') as HTMLElement).style.background = 'white'
          const low = document.createElement('p')
          low.id = 'new-low-contrast'
          low.style.cssText = 'color:#aaa;background:white'
          low.textContent = 'Chữ mới tải thêm không đủ tương phản'
          document.body.append(low)
        },
        { once: true },
      )
    })
    const initial = await new AxeBuilder({ page }).withRules(AAA_RULE_IDS).analyze()
    expect(
      initial.incomplete.some((rule) => rule.nodes.some((node) => node.target.includes('#target'))),
    ).toBe(true)
    const findings = await scanAaa(page)
    await expect(page.locator('#new-low-contrast')).toHaveCount(1)
    expect(findings.some((finding) => finding.includes('new-low-contrast'))).toBe(true)
  })
  test('giữ toàn bộ rules AAA và thêm AA contrast', () => {
    for (const rule of axe.getRules(AAA_TAGS)) expect(AAA_RULE_IDS).toContain(rule.ruleId)
    expect(AAA_RULE_IDS).toContain('color-contrast-enhanced')
    expect(AAA_RULE_IDS).toContain('color-contrast')
  })
  test('snapshot ổn định mới được kết luận; DOM đổi phải báo chưa kết luận', async ({ page }) => {
    await page.setContent(
      '<html lang="vi"><head><title>Control</title></head><body style="background:white;color:#111"><p>Chữ đọc đạt</p></body></html>',
    )
    expect(await scanAaa(page)).toEqual([])
    const interval = await page.evaluate(() =>
      window.setInterval(() => {
        document.body.dataset.tick = String(performance.now())
      }, 10),
    )
    try {
      const findings = await scanAaa(page)
      expect(findings.some((finding) => finding.includes('DOM changed during scan'))).toBe(true)
    } finally {
      await page.evaluate((id) => window.clearInterval(id), interval)
    }
  })
  test('bắt chữ inline, link văn xuôi và heading trong header; giữ AA cho nút', async ({
    page,
  }) => {
    await page.setContent(`
      <html lang="vi"><head><title>Control</title></head><body style="background:white">
      <main style="font:16px Arial;color:#666">
        <p><span id="span">Chữ đọc trong span</span></p>
        <p><em id="em">Chữ đọc trong em</em></p>
        <p><a id="link" href="#" style="color:inherit">Liên kết trong văn xuôi</a></p>
        <header><h2 style="font:16px Arial"><span id="heading">Tiêu đề đọc</span></h2></header>
        <nav><p><a href="#" style="color:inherit"><span id="nav">Nhãn điều hướng</span></a></p></nav>
        <details><summary id="summary" style="font:16px Arial;color:#666;background:white">Nhãn mở chi tiết AA</summary><p>Chi tiết</p></details>
        <button id="button" style="font:16px Arial;color:#666;background:white">Nút AA</button>
        <p id="pass" style="color:#333">Chữ đạt AAA</p>
      </main></body></html>
    `)
    const results = await new AxeBuilder({ page })
      .withRules(['color-contrast-enhanced', 'color-contrast'])
      .analyze()
    const findings = await collectAaaFindings(page, results)
    for (const id of ['span', 'em', 'link', 'heading']) {
      expect(
        findings.some((finding) => finding.includes(`#${id}`)),
        id,
      ).toBe(true)
    }
    expect(findings.some((finding) => finding.includes('#button'))).toBe(false)
    expect(findings.some((finding) => finding.includes('#pass'))).toBe(false)
    expect(findings.some((finding) => finding.includes('#nav'))).toBe(false)
    expect(findings.some((finding) => finding.includes('#summary'))).toBe(false)
  })

  test('chỉ kết luận chrome short-text từ phép đo AA cùng snapshot', async ({ page }) => {
    await page.setContent(`<html lang="vi"><head><title>Control</title></head><body style="background:white">
      <button id="short" style="color:#666;background:white;font:16px Arial">1</button>
      <button id="bad" style="color:#aaa;background:white;font:16px Arial">Nút sai AA</button>
      <p id="reading" style="color:#666;font:16px Arial">Chữ đọc vẫn cần 7:1</p>
      <button id="unknown" style="color:#666;background:linear-gradient(white,black);font:16px Arial">1</button>
    </body></html>`)
    const results = await new AxeBuilder({ page }).withRules(AAA_RULE_IDS).analyze()
    expect(
      results.incomplete.some((rule) => rule.nodes.some((node) => node.target.includes('#short'))),
    ).toBe(true)
    const resolutions: AaaResolution[] = []
    const unresolvedMeasurements: { target: axe.NodeResult['target']; reason: string }[] = []
    const findings = await collectAaaFindings(page, results, {
      passes: results.passes,
      snapshotStable: true,
      resolutions,
      unresolvedMeasurements,
    })
    expect(resolutions).toEqual([
      expect.objectContaining({ target: ['#short'], resolvedBy: 'color-contrast' }),
    ])
    expect(findings.some((finding) => finding.includes('#short'))).toBe(false)
    expect(findings.some((finding) => finding.includes('#bad'))).toBe(true)
    expect(findings.some((finding) => finding.includes('#reading'))).toBe(true)
    expect(findings.some((finding) => finding.includes('#unknown'))).toBe(true)
    const stale = await collectAaaFindings(page, results, {
      passes: results.passes,
      snapshotStable: false,
      resolutions: [],
    })
    expect(stale.some((finding) => finding.includes('#short'))).toBe(true)
    const unmeasured = await collectAaaFindings(page, results, {
      passes: [],
      snapshotStable: true,
      resolutions: [],
    })
    expect(unmeasured.some((finding) => finding.includes('#short'))).toBe(true)
  })

  test('tiêu đề lớn và ví dụ đọc trong nút vẫn cần 7:1', async ({ page }) => {
    await page.setContent(`<html lang="vi"><head><title>Control</title></head><body style="background:white">
      <h1 id="large" style="font:32px Arial;color:#666">Tiêu đề lớn</h1>
      <button id="label" style="font:16px Arial;color:#666;background:white">Nhãn nút AA</button>
      <button style="font:16px Arial;color:#666;background:white"><span data-reading-content id="example">Ví dụ học để đọc</span></button>
    </body></html>`)
    const results = await new AxeBuilder({ page }).withRules(AAA_RULE_IDS).analyze()
    const findings = await collectAaaFindings(page, results)
    expect(
      findings.some(
        (finding) => finding.includes('project-reading-7') && finding.includes('#large'),
      ),
    ).toBe(true)
    expect(findings.some((finding) => finding.includes('#example'))).toBe(true)
    expect(findings.some((finding) => finding.includes('#label'))).toBe(false)
  })

  test('không bỏ qua target biến mất, target lồng hoặc incomplete thật', async ({ page }) => {
    await page.setContent(`
      <html lang="vi"><head><title>Control</title></head><body>
      <p id="gradient" style="color:black;background:linear-gradient(white,black)">Nền chưa kết luận</p>
      <p id="removed" style="color:#666;background:white">Chữ sẽ biến mất</p>
      </body></html>
    `)
    const results = await new AxeBuilder({ page })
      .withRules(['color-contrast-enhanced', 'color-contrast'])
      .analyze()
    expect(results.incomplete.flatMap((rule) => rule.nodes).length).toBeGreaterThan(0)
    await page.locator('#removed').evaluate((el) => el.remove())
    const findings = await collectAaaFindings(page, results)
    expect(findings.some((finding) => finding.startsWith('incomplete:'))).toBe(true)
    expect(findings.some((finding) => finding.includes('missing target'))).toBe(true)
    const rule = results.violations[0]
    if (!rule || !rule.nodes[0]) throw new Error('Control phải sinh violation có node')
    const nested = await collectAaaFindings(page, {
      incomplete: [],
      violations: [{ ...rule, nodes: [{ ...rule.nodes[0], target: ['#frame', '#child'] }] }],
    })
    expect(nested).toEqual([expect.stringContaining('unsupported target')])
    expect(nested[0]).toContain('["#frame","#child"]')
    const empty = await collectAaaFindings(page, {
      violations: [],
      incomplete: [{ ...rule, nodes: [] }],
    })
    expect(empty).toEqual([expect.stringContaining('no target evidence')])
  })
})

for (const theme of THEMES) {
  test(`a11y AAA: hai mặt thẻ từ theme=${theme}`, async ({ page }) => {
    await mockLogin(page, 'vi', theme)
    await page.goto('/tu-dien', { waitUntil: 'domcontentloaded' })
    // [audit 2026-09-30 minor 2] Từ điển nay mở ô tra từ; thẻ ghi nhớ ở tab "Hôm nay".
    await page.getByRole('button', { name: 'Hôm nay', exact: true }).click()
    const card = page.locator('button.flip-scene').first()
    const front = card.locator('.flip-face').first()
    const back = card.locator('.flip-back')
    await expect(front).toBeVisible()
    await expect(back).toBeHidden()
    await expect(card).toHaveAttribute('aria-pressed', 'false')
    expect(await scanAaa(page), `Mặt trước thẻ từ theme=${theme}`).toEqual([])
    await card.focus()
    await page.keyboard.press('Enter')
    await expect(card).toHaveAttribute('aria-pressed', 'true')
    await expect(card).toBeFocused()
    await expect(front).toBeHidden()
    await expect(back).toBeVisible()
    await waitForStableDom(page)
    expect(await scanAaa(page), `Mặt sau thẻ từ theme=${theme}`).toEqual([])
    await page.keyboard.press('Space')
    await expect(card).toHaveAttribute('aria-pressed', 'false')
    await expect(front).toBeVisible()
    await expect(back).toBeHidden()
  })
}

// [S06d] Các studio của Bạn Đồng Hành — ROUTES chỉ quét studio mặc định nên chữ đọc ở các studio
// còn lại chưa từng qua cổng 7:1 (S06c chỉ đưa chúng vào cổng AA). Cùng khuôn chờ theo trạng
// thái với vòng COMPANION_STUDIOS ở e2e/a11y.spec.ts. Studio "Tổng kết" đã GỠ (changelog 0475);
// thẻ Agent + banner Action Canvas của nó dời sang "Kế hoạch" nên vẫn được quét.
const COMPANION_STUDIOS = ['Trò chuyện', 'Ghi nhớ', 'Thử thách', 'Kế hoạch']
for (const theme of THEMES) {
  for (const studio of COMPANION_STUDIOS) {
    test(`a11y AAA (nội dung + tiêu đề): Bạn Đồng Hành — studio ${studio}, theme=${theme}`, async ({
      page,
    }) => {
      await mockLogin(page, 'vi', theme)
      await muteTts(page)
      await page.goto('/ban-dong-hanh', { waitUntil: 'domcontentloaded' })
      const tab = page.getByRole('button', { name: studio, exact: true })
      await tab.click()
      await expect(tab).toHaveAttribute('aria-pressed', 'true')
      await waitForStableDom(page)
      const violated = await scanAaa(page)
      expect(violated, `Vi phạm AAA ở studio ${studio}, theme=${theme}`).toEqual([])
    })
  }
}
