import { test, expect, type Locator, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { mockLogin, USER_ID, type ThemeName } from './helpers/auth'
import { openLiveLocationTrip } from './helpers/location'
import { muteTts } from './helpers/tts'
import { freezeAnimations, waitForStableDom } from './helpers/axe'
import { moCauTuThuLai } from './helpers/stemRetry'
import {
  mockFriendsState,
  mockPlanPrices,
  mockQuestsStatus,
  mockReferralStats,
  mockStemSubjectDetail,
  STEM_DETAIL_SUBJECTS,
} from './helpers/realDataMocks'

// Quét a11y bằng axe-core (WCAG 2.0/2.1/2.2 A & AA), gồm quyền phóng to viewport.
//
// [2026-08-04] Cổng SIẾT THÀNH TUYỆT ĐỐI: 0 vi phạm A/AA ở MỌI mức tác động
// (critical/serious/moderate/minor), thay cho cổng cũ kiểu "không tệ hơn hiện tại"
// (chỉ chặn critical + serious mới). Đo thực tế toàn bộ 15 trang × 5 theme cho 0 vi
// phạm nên siết được ngay, không cần baseline. AA là SÀN BẮT BUỘC của dự án — theo
// khuyến nghị của W3C (Understanding Conformance): KHÔNG lấy AAA làm chính sách cho
// toàn site vì có nội dung không thể đạt hết AAA; chỗ nào chưa/không đạt AAA thì tối
// thiểu phải đạt AA. Mức AAA được gác riêng ở e2e/a11y-aaa.spec.ts.
async function scan(page: Page) {
  await freezeAnimations(page)
  const { violations } = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze()
  // Kèm target CSS selector của phần tử đầu tiên — không có nó, log CI chỉ nói "rớt ở đâu đó
  // trên trang" mà không nói RÕ chỗ nào, buộc phải đoán mò hoặc chờ thêm một vòng CI.
  const fmt = (v: { id: string; impact?: string | null; nodes: Array<{ target: unknown }> }) => {
    const first = v.nodes[0]?.target
    const sel = Array.isArray(first) ? first.join(' ') : String(first ?? '?')
    return `${v.id} (${v.impact}, ${v.nodes.length} phần tử, đầu tiên: ${sel})`
  }
  return { all: violations.map(fmt) }
}

// Danh sách theme dùng cho MỌI vòng quét bên dưới — gồm cả "Nhi đồng" (kid), theme
// bình thường chỉ tự áp khi age_group='nhi_dong'; ở E2E seed thẳng localStorage
// 'ui_theme' qua mockLogin() (theme render y hệt, chỉ khác cách được áp).
// Quét Trang chủ ở CẢ 5 THEME (gồm cả mặc định Xanh đêm) — bảo chứng cam kết
// "AA ở mọi theme" (CLAUDE.md mục 4.8, 8).
// Theme SÁNG (Blue sky, Pink) trước đây rớt color-contrast (pill màu cố định + token
// zinc-400 của Pink quá nhạt) → đã sửa bằng biến thể `theme-light:` (sắc độ đậm hơn) và
// chỉnh token `--z-400` của Pink. Gate này chống tụt lùi cho mọi theme.
const THEMES: ThemeName[] = ['dark-blue', 'blue-sky', 'kid']

// Trang đăng nhập — quét CẢ 5 theme (nút OAuth dùng màu thương hiệu cố định, không
// đổi theo theme, nhưng nền/chữ xung quanh thì có).
for (const theme of THEMES) {
  test(`a11y: trang đăng nhập theme=${theme} — 0 vi phạm A/AA`, async ({ page }) => {
    await page.addInitScript((t) => localStorage.setItem('ui_theme', t), theme)
    await page.goto('/login')
    // Chờ nút OAuth cuối cùng render xong rồi mới quét: các nút này hiện SAU form nên
    // quét sớm sẽ bỏ sót chúng (đã từng làm cổng lọt lỗi contrast + target-size).
    await expect(page.getByRole('button', { name: /Google/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Microsoft|Apple|Facebook/i })).toHaveCount(0)
    const { all } = await scan(page)
    expect(all).toEqual([])
  })
}

for (const theme of THEMES) {
  test(`a11y: trang chủ theme=${theme} — 0 vi phạm A/AA`, async ({ page }) => {
    await mockLogin(page, 'vi', theme)
    await page.goto('/')
    await expect(page.getByRole('banner').getByText(/Xin chào/)).toBeVisible()
    const { all } = await scan(page)
    expect(all).toEqual([])
  })
}

// Trang chủ ở CHIỀU B (người nước ngoài học tiếng Việt): đảo bộ màu accent→sky cho
// badge/nhãn chiều học. Quét ở 2 theme SÁNG (nơi màu sky cố định dễ rớt AA) để chắc
// biến thể `theme-light:` của nhánh B cũng đạt — gate Home phía trên chỉ phủ chiều A.
for (const theme of ['blue-sky'] as ThemeName[]) {
  test(`a11y: trang chủ chiều B theme=${theme} — 0 vi phạm A/AA`, async ({ page }) => {
    await mockLogin(page, 'en', theme)
    await page.addInitScript(() => localStorage.setItem('et_direction', 'B'))
    await page.goto('/')
    await expect(page.getByRole('banner').getByText(/Hi there/)).toBeVisible()
    const { all } = await scan(page)
    expect(all).toEqual([])
  })
}

// Các trang chính sau đăng nhập — quét ở CẢ 5 THEME (cam kết "AA ở mọi theme").
// Màu cố định của Tailwind (pill loại từ, màu chủ đề/cấp, IPA…) đã thêm biến thể
// `theme-light:` sắc độ đậm cho 2 theme nền sáng (qua map dùng chung: pos.ts,
// COLOR_MAP Phrases, COLORS Lessons, CEFR_COLORS Dashboard, tab Learn…).
const AUTHED_ROUTES = [
  '/tien-do',
  '/tu-dien',
  '/bai-hoc',
  // [S09c] Bài hội thoại mở theo URL: mục "Trong bài", tiêu đề bài, đích lượt, `#ket-qua` rỗng.
  '/goc-hoc-tap/english/bai-hoc?lesson=1#ket-qua',
  '/lich-su-hoc',
  '/cau-thong-dung',
  '/lo-trinh-hoc',
  '/lo-trinh-hoc/a1', // trang riêng cấp CEFR (6 cấp A1–C2 dùng chung layout)
  '/lo-trinh-hoc/c1', // cấp nâng cao (accent rose) — quét cả màn khóa
  '/tro-truyen',
  '/luyen-viet',
  '/luyen-noi',
  '/cai-dat',
  '/thu-thach', // màn "chưa bắt đầu thử thách" — các trạng thái khác quét riêng bên dưới
  '/lap-trinh', // môn Lập trình: tổng quan P1–P6 + dự án xuyên suốt (PR-L1)
  '/lap-trinh/p1', // trang một bậc, bản PHẲNG (P1–P5 không chia mạch nên dùng chung layout)
  // [PR-M12] P6 KHÔNG còn dùng chung layout với P1: 65 unit của nó được gom thành 4 mạch, nên
  // trang có thêm một tầng tiêu đề (h3) và mục lục trỏ tới mạch thay vì unit. Trước đây dòng
  // trên ghi "6 bậc dùng chung layout" — nay sai, và nếu không quét riêng thì bản CÓ CHIA MẠCH
  // không cổng a11y nào soi tới.
  '/lap-trinh/p6', // trang một bậc, bản CÓ CHIA MẠCH (chỉ P6)
  '/lap-trinh/chay-thu', // sandbox chạy Python (PR-L2) — quét màn tĩnh, không chạy Pyodide
  '/lap-trinh/bai-hoc/p1-u4-l1', // bài học 8 bước (PR-L3) — màn Khái niệm
  '/lap-trinh/du-an', // dự án trục chặng P1 (PR-L3b)
  '/so-tay-loi-sai', // sổ lỗi: bộ lọc môn + nhãn bằng chứng + nút "Ôn lại" (S12-2)
  '/lap-trinh/on-tap', // ôn thẻ SRS môn Lập trình (PR-L10) — màn rỗng khi chưa có thẻ
  '/goc-hoc-tap/on-tap', // hub ôn tập xuyên môn (S12-1) — màn rỗng khi chưa có gì đến hạn
  '/goc-hoc-tap/physics/on-tap', // ôn thẻ một môn STEM (S12-1) — bốn môn dùng chung layout
  '/lap-trinh/gioi-thieu', // mô tả khoá học & mục tiêu (PR-UX3) — trang chữ dài, nhiều tương phản
  '/lap-trinh/huong', // danh sách 13 hướng chuyên sâu (PR-L-SPEC)
  '/lap-trinh/huong/web--lap-trinh-web', // chi tiết một hướng (13 hướng dùng chung layout)
  '/lap-trinh/huong/architecture--kien-truc-he-thong-dac-ta-cho-ai-thi-hanh', // hướng kiến trúc — trang chi tiết dài nhất, nhiều danh sách chữ
  '/lap-trinh/huong/web--lap-trinh-web/web-s2--full-stack-co-backend-cua-minh', // trang CHẶNG: mục tiêu, tự kiểm, rubric, đặc tả 6 ô
  '/lap-trinh/khoa-hoc/git--git-github-thuc-hanh', // khoá ngắn Git & GitHub (PR 3/4 khoá Git) — cắt ngang bậc
  // [S07-2] Trang bài mở TRONG NGỮ CẢNH KHOÁ: mục lục đổi sang cây khoá, breadcrumb thêm một
  // đốt. Khác cây bậc đủ nhiều để phải quét riêng — cùng một bài nhưng khác hẳn thứ được vẽ.
  '/lap-trinh/bai-hoc/p3-u10-l1?khoa=git',
  // [2026-08-27] MỞ CỔNG SANG 4 TRỤ CÒN LẠI. Trước đây danh sách này chỉ có trụ Learning
  // (Tiếng Anh + Lập trình), nên Career/Work/Startup/Life/Companion và hub Môn học chưa
  // từng bị cổng a11y nào soi — dù CLAUDE.md mục 4.5 ghi cổng là "sàn cứng, dung sai 0,
  // không baseline/ngoại lệ". Đo lần đầu: 41/50 tổ hợp trang×theme vi phạm, có cả mức
  // critical. Đã sửa hết về 0 trước khi thêm vào đây (xem docs/changelog).
  '/goc-hoc-tap', // hub Môn học — cửa vào trụ Learning cho các môn ngoài Tiếng Anh
  // [2026-09-20] Bốn trang của ba trụ đã gỡ (/su-nghiep-khoi-nghiep, /life/wheel, /life-graph…)
  // rời khỏi danh sách cùng chính các trang đó. Trang "Ghi chú" thay chỗ trụ Work & Life cũ.
  '/ghi-chu', // trụ Ghi chú — việc cần làm, dự án, cuộc họp, ghi chú
  '/ghi-chu/kanban', // bảng Kanban việc cần làm
  '/ban-dong-hanh', // Companion — tác tử xuyên suốt
  '/action-canvas', // Bảng hành động của Companion
  '/ung-dung-thuc-te', // Ứng dụng thực tế — 22 thanh trượt mô phỏng
  '/luyen-tap', // Phòng luyện tập
  // [2026-09-13] Bốn môn STEM nối vào app — một khuôn trang dùng chung cho cả bốn môn,
  // nên quét đại diện một môn là đủ, cộng một trang bài CÓ hoạt ảnh (hoạt ảnh là thứ mới
  // nhất về a11y: có chữ trong SVG, có nút tạm dừng, có mô tả thay thế).
  '/goc-hoc-tap/physics/bai-hoc', // danh sách bài: hai nhánh chuẩn/HSG + chọn lớp
  '/goc-hoc-tap/physics/bai-hoc/ly10-c2-b10--su-roi-tu-do', // bài CÓ hoạt ảnh
  '/goc-hoc-tap/english/luyen-nghe', // Luyện nghe: nhóm gập + tìm kiếm + Xem thêm (audit 2026-09-22 P0-1)
]
for (const route of AUTHED_ROUTES) {
  for (const theme of THEMES) {
    test(`a11y: ${route} theme=${theme} — 0 vi phạm A/AA`, async ({ page }) => {
      await mockLogin(page, 'vi', theme)
      await page.goto(route, { waitUntil: 'domcontentloaded' })
      // Chờ theo TRẠNG THÁI, không theo thời gian — xem lý do đầy đủ ở `waitForStableDom`.
      await waitForStableDom(page)
      const { all } = await scan(page)
      expect(all).toEqual([])
    })
  }
}

// [audit 2026-09-30 minor 2] Từ điển nay mở mặc định ô TRA TỪ, nên vòng AUTHED_ROUTES ở trên quét
// tab đó. Tab thẻ ghi nhớ "Hôm nay" (trước là mặc định) quét riêng ở đây để cổng không mất phủ.
for (const theme of THEMES) {
  test(`a11y: /tu-dien tab "Hôm nay" theme=${theme} — 0 vi phạm A/AA`, async ({ page }) => {
    await mockLogin(page, 'vi', theme)
    await page.goto('/tu-dien', { waitUntil: 'domcontentloaded' })
    await page.getByRole('button', { name: 'Hôm nay', exact: true }).click()
    await expect(page.locator('button.flip-scene').first()).toBeVisible()
    await waitForStableDom(page)
    const { all } = await scan(page)
    expect(all).toEqual([])
  })
}

// ── [U3] TRANG CHỈ RỚT AA KHI CÓ DỮ LIỆU THẬT (audit UI/UX 2026-09-30, mục C4 + 11) ─────
// Audit đo 14 trang trượt axe AA khi có dữ liệu thật mà KHÔNG trang nào nằm trong cổng: hoặc
// trang vắng mặt khỏi danh sách quét, hoặc API riêng của trang không được mock nên phần tử rớt
// tương phản không bao giờ được vẽ ra (nút "Copy link kết bạn", mã mời, nút mua "Nâng cấp VIP"
// đang `disabled` vì chưa có giá…). Mỗi ca dưới đây: mock ĐÚNG HÌNH DẠNG dữ liệu thật
// (e2e/helpers/realDataMocks.ts), CHỜ đúng phần tử từng rớt hiện ra rồi mới quét — để cổng
// không thể xanh giả vì quét trúng màn tải/màn lỗi. Hai trang hub (U2) và /reset-password
// (form xác thực, U2) do đợt U2 phủ.
type RealDataCase = {
  route: string
  /** Mock API riêng của trang (ngoài `mockLogin`). */
  mock?: (page: Page) => Promise<void>
  /** Phần tử TỪNG RỚT — phải hiện ra trước khi quét. */
  ready: (page: Page) => Locator
  /** Mặc định viewport desktop của project; vùng cuộn CodeMirror chỉ tràn ở màn hẹp. */
  mobile?: boolean
}

const REAL_DATA_CASES: RealDataCase[] = [
  {
    route: '/welcome',
    ready: (page) => page.getByRole('main').getByText('Điểm khác biệt:'),
  },
  {
    route: '/learn-vietnamese',
    ready: (page) => page.getByRole('main').getByText("What's different:"),
  },
  {
    // Hồ sơ của tài khoản FREE (mockLogin mặc định plan='free'): khối "Nâng cấp VIP" rút gọn
    // + mã mời trong <code>.
    route: '/trang-ca-nhan',
    mock: mockReferralStats,
    ready: (page) => page.getByRole('link', { name: /Xem bảng giá đầy đủ/ }),
  },
  {
    route: '/nhiem-vu',
    mock: async (page) => {
      await mockReferralStats(page)
      await mockQuestsStatus(page)
    },
    ready: (page) => page.getByText('DHCB7Q2K'),
  },
  {
    route: '/ban-be',
    mock: mockFriendsState,
    ready: (page) => page.getByRole('button', { name: /Chép liên kết kết bạn/ }),
  },
  ...STEM_DETAIL_SUBJECTS.map((subjectId): RealDataCase => ({
    route: `/goc-hoc-tap/${subjectId}`,
    mock: (page) => mockStemSubjectDetail(page, subjectId),
    ready: (page) => page.getByRole('button', { name: /AI giải bài tập/ }),
  })),
  {
    // Lộ trình mục tiêu (dữ liệu tĩnh trong gói subject-programming): 32 nút "Mở bài kiểm" +
    // ô chọn giai đoạn của "Hồ sơ bằng chứng".
    route: '/goc-hoc-tap/programming/lo-trinh/principal-ai',
    ready: (page) => page.getByRole('button', { name: /Mở bài kiểm/ }),
  },
  {
    route: '/nang-cap',
    mock: mockPlanPrices,
    ready: (page) => page.getByRole('button', { name: /Nâng cấp VIP/ }),
  },
  {
    route: '/lap-trinh/chay-thu',
    mobile: true,
    ready: (page) => page.getByRole('textbox').first(),
  },
  {
    route: '/lap-trinh/du-an',
    mobile: true,
    ready: (page) => page.getByRole('textbox').first(),
  },
]

for (const c of REAL_DATA_CASES) {
  for (const theme of THEMES) {
    const vw = c.mobile ? ' 390px' : ''
    test(`a11y: ${c.route}${vw} có dữ liệu thật theme=${theme} — 0 vi phạm A/AA`, async ({
      page,
    }) => {
      if (c.mobile) await page.setViewportSize({ width: 390, height: 844 })
      await mockLogin(page, 'vi', theme)
      if (c.mock) await c.mock(page)
      await page.goto(c.route, { waitUntil: 'domcontentloaded' })
      const ready = c.ready(page).first()
      await expect(ready).toBeVisible()
      await expect(ready).toBeEnabled()
      await waitForStableDom(page)
      const { all } = await scan(page)
      expect(all).toEqual([])
    })
  }
}

// ── Khối duyệt chuyên môn STEM (chỉ admin) ──────────────────────────────────────────
// docs/specs/2026-09-14-quy-trinh-duyet-chuyen-mon-mon-sinh.md (CHỐT Q1): khối duyệt đặt
// cuối trang bài học + tab "Duyệt nội dung STEM" ở /admin-s, cả hai CHỈ hiện cho admin
// (RequireAdmin đọc user.isAdmin — mockLogin(..., { isAdmin: true })). Quét cả 5 theme vì
// đây là UI mới, chưa có cổng chống tụt lùi nào khác canh nó.
async function mockAdminStemReview(page: Page) {
  await page.route('**/api/admin-stem-review**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '{"luotDuyet":[]}' }),
  )
}

for (const theme of THEMES) {
  test(`a11y: khối duyệt trong bài học (admin) theme=${theme} — 0 vi phạm A/AA`, async ({
    page,
  }) => {
    await mockLogin(page, 'vi', theme, { isAdmin: true })
    await mockAdminStemReview(page)
    await page.goto('/goc-hoc-tap/biology/bai-hoc/sinh12-c1-b1--nhan-doi-adn', {
      waitUntil: 'domcontentloaded',
    })
    await waitForStableDom(page)
    // Mở khối duyệt (mặc định thu gọn) để axe thấy cả nội dung form bên trong.
    await page.getByRole('button', { name: /Duyệt chuyên môn bài này/ }).click()
    await expect(page.getByRole('textbox', { name: /Tên người duyệt/ })).toBeVisible()
    const { all } = await scan(page)
    expect(all).toEqual([])
  })

  test(`a11y: tab Duyệt nội dung STEM ở /admin-s theme=${theme} — 0 vi phạm A/AA`, async ({
    page,
  }) => {
    await mockLogin(page, 'vi', theme, { isAdmin: true })
    await mockAdminStemReview(page)
    await page.goto('/admin-s?tab=stem-review', { waitUntil: 'domcontentloaded' })
    await waitForStableDom(page)
    const { all } = await scan(page)
    expect(all).toEqual([])
  })

  test(`a11y: người học THƯỜNG không thấy khối duyệt theme=${theme}`, async ({ page }) => {
    await mockLogin(page, 'vi', theme, { isAdmin: false })
    await page.goto('/goc-hoc-tap/biology/bai-hoc/sinh12-c1-b1--nhan-doi-adn', {
      waitUntil: 'domcontentloaded',
    })
    await waitForStableDom(page)
    await expect(page.getByRole('button', { name: /Duyệt chuyên môn bài này/ })).not.toBeVisible()
  })
}

// ── MÀN KẾT QUẢ CẦN BACKEND (Chat trả lời/nhận xét · Writing chấm điểm/lỗi · Speaking
//    trả lời/sửa lỗi) ──────────────────────────────────────────────────────────────
// Các UI này chỉ hiện SAU khi gọi AI nên axe lúc tải trang không thấy. E2E không có
// backend thật → ta CHẶN /api/agent và trả câu mẫu cố định (đủ render màu amber/accent/
// red của phần sửa lỗi/điểm), rồi quét contrast ở CẢ 5 THEME (cam kết "AA ở mọi theme").
// Đây là phần a11y còn chừa lại trong PROGRESS.md ("Tiếp theo").

// Trả lời /api/agent bằng nội dung cố định để dựng UI kết quả.
async function mockClaude(page: Page, text: string) {
  await page.route('**/api/agent', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ content: [{ text }] }),
    }),
  )
}

// Chat: 💬 = câu thoại, ✅ = nhận xét (tiếng mẹ đẻ). Bong bóng tách 2 phần → màu amber.
const CHAT_REPLY =
  '💬 Hello! Welcome to the interview. Please tell me about yourself and your work experience.\n' +
  '✅ Nhận xét: Câu trả lời của bạn khá tốt, nhưng nên dùng thì hiện tại hoàn thành khi nói về kinh nghiệm.'

// Writing: JSON đúng dạng FeedbackData. Điểm pha cao/vừa/thấp để bật đủ 3 nhánh màu
// (accent ≥7 · amber 5–6 · red <5) ở ScoreBar và 1 lỗi (đỏ gạch + xanh sửa).
const WRITING_FEEDBACK = JSON.stringify({
  scores: { task_response: 7, coherence: 5, lexical: 6, grammar: 4, overall: 6 },
  errors: [
    {
      original: 'I have went to school yesterday.',
      corrected: 'I went to school yesterday.',
      explanation: 'Dùng quá khứ đơn "went", không dùng "have went".',
    },
  ],
  suggestions: [
    'Dùng câu phức để nâng band Grammatical Range.',
    'Thêm ví dụ cụ thể cho luận điểm.',
  ],
  sample: 'A well-structured paragraph would start with a clear topic sentence...',
  encouragement: 'Bài viết có ý tốt — tiếp tục luyện tập nhé!',
})

// Speaking: JSON đúng dạng AIResponse (speech = câu thoại, feedback = nhận xét, corrected = sửa).
const SPEAKING_REPLY = JSON.stringify({
  speech: 'Hi there! What did you do last weekend?',
  feedback: 'Phát âm rõ ràng, nhưng chú ý nối âm giữa các từ.',
  corrected: 'I went to the cinema with my friends.',
})

const RESULT_THEMES: ThemeName[] = THEMES

for (const theme of RESULT_THEMES) {
  test(`a11y: Chat (kết quả AI) theme=${theme} — 0 vi phạm A/AA`, async ({ page }) => {
    await mockClaude(page, CHAT_REPLY)
    await mockLogin(page, 'vi', theme)
    await page.goto('/tro-truyen')
    await page.getByRole('button', { name: /Bắt đầu hội thoại/ }).click()
    await expect(page.getByText(/Câu trả lời của bạn khá tốt/)).toBeVisible()
    const { all } = await scan(page)
    expect(all).toEqual([])
  })

  test(`a11y: Writing (kết quả chấm) theme=${theme} — 0 vi phạm A/AA`, async ({ page }) => {
    await mockClaude(page, WRITING_FEEDBACK)
    await mockLogin(page, 'vi', theme)
    await page.goto('/luyen-viet')
    await page.locator('#prompt-input').fill('Some people think children should learn to compete.')
    await page
      .locator('#essay-input')
      .fill(
        'In my opinion, cooperation matters more than competition because working together helps children build social skills and solve problems effectively in real life.',
      )
    await page.getByRole('button', { name: /Chấm bài ngay/ }).click()
    await expect(page.getByText(/Điểm ước lượng IELTS/)).toBeVisible()
    const { all } = await scan(page)
    expect(all).toEqual([])
  })

  test(`a11y: Speaking (kết quả AI) theme=${theme} — 0 vi phạm A/AA`, async ({ page }) => {
    await muteTts(page)
    await mockClaude(page, SPEAKING_REPLY)
    await mockLogin(page, 'vi', theme)
    await page.goto('/luyen-noi')
    await page.getByRole('button', { name: /Bắt đầu luyện nói/ }).click()
    await expect(page.getByText(/What did you do last weekend/)).toBeVisible()
    const { all } = await scan(page)
    expect(all).toEqual([])
  })
}

// ── /thu-thach — các trạng thái khác của thử thách "Challenge 1 phút" (chu kỳ tuần) ──
// Trạng thái "chưa bắt đầu" đã quét chung với AUTHED_ROUTES ở trên. 2 trạng thái
// dưới đây cần seed localStorage (khóa `et_challenge_<uid>` — src/lib/challenge.ts) để bỏ
// qua bước tương tác (bấm bắt đầu/quay/nộp — cần camera thật, không mock ở đây).
// Ghi âm/quay hình KHÔNG cần cho các trạng thái này (đều là màn tĩnh sau khi có
// dữ liệu challenge), nên không cần mock getUserMedia/MediaRecorder.

// Ngày theo giờ VN (khớp src/lib/date.ts vnDateStr), tính ở NODE lúc dựng test data
// (chạy trước khi trang tải — chỉ lệch múi giờ nếu máy CI đặt giờ hệ thống khác UTC,
// không xảy ra trên GitHub Actions runner).
function vnDateOffset(offsetDays: number): string {
  const ms = Date.now() - offsetDays * 86400000 + 7 * 3600000
  return new Date(ms).toISOString().slice(0, 10)
}

async function seedChallengeState(page: Page, challenge: unknown) {
  await page.addInitScript(({ key, value }) => localStorage.setItem(key, JSON.stringify(value)), {
    key: `et_challenge_${USER_ID}`,
    value: challenge,
  })
}

for (const theme of THEMES) {
  test(`a11y: /thu-thach — đã bắt đầu, chưa nộp hôm nay theme=${theme} — 0 vi phạm A/AA`, async ({
    page,
  }) => {
    await mockLogin(page, 'vi', theme)
    await seedChallengeState(page, { startDate: vnDateOffset(0), round: 1, entries: {} })
    await page.goto('/thu-thach', { waitUntil: 'domcontentloaded' })
    // `getByText` từng khớp CẢ hai: tiêu đề hiện ở thanh header (`Layout title=`) LẪN
    // `<h1 className="sr-only">` cùng chữ trong thân trang (đợt chuyển PageHeader→Layout,
    // 2026-09-20) — strict mode Playwright báo lỗi vì 2 phần tử khớp. Nhắm đúng heading.
    await expect(page.getByRole('heading', { name: /Challenge 1 phút/ })).toBeVisible()
    // Đã chờ đúng mốc trạng thái ở trên; `waitForStableDom` bắt nốt phần render sau đó
    // (đồng hồ đếm ngược chỉ đổi CHỮ, không đổi số phần tử, nên vẫn ổn định nhanh).
    await waitForStableDom(page)
    const { all } = await scan(page)
    expect(all).toEqual([])
  })

  test(`a11y: /thu-thach — đã nộp hôm nay (màn nhận xét AI) theme=${theme} — 0 vi phạm A/AA`, async ({
    page,
  }) => {
    await mockLogin(page, 'vi', theme)
    const today = vnDateOffset(0)
    const feedback = JSON.stringify({
      praise: 'Bạn kể chuyện rất tự nhiên!',
      corrections: [
        {
          original: 'I eat breakfast',
          better: 'I ate breakfast',
          explain: 'Thì quá khứ vì đã ăn rồi.',
        },
      ],
      upgrade: 'This morning I had a delicious bowl of pho.',
    })
    await seedChallengeState(page, {
      startDate: today,
      round: 1,
      entries: {
        [today]: {
          day: today,
          challengeDay: 1,
          topicDay: 1,
          transcript: 'I eat breakfast this morning with banh mi',
          feedback,
          durationSec: 42,
          wordCount: 8,
          round: 1,
        },
      },
    })
    await page.goto('/thu-thach', { waitUntil: 'domcontentloaded' })
    await expect(page.getByText(/Đã nộp challenge hôm nay/)).toBeVisible()
    await waitForStableDom(page)
    const { all } = await scan(page)
    expect(all).toEqual([])
  })
}

// ── Tab "Nghe" (luyện nghe theo cấp, ③ N3) — 2 chế độ: Chọn nghĩa (mặc định) và
// Gõ lại (dictation). A1 luôn mở khóa nên vào thẳng qua ?tab=listening.
for (const theme of THEMES) {
  test(`a11y: /lo-trinh-hoc/a1 tab Nghe — Chọn nghĩa theme=${theme} — 0 vi phạm A/AA`, async ({
    page,
  }) => {
    await muteTts(page)
    await mockLogin(page, 'vi', theme)
    await page.goto('/lo-trinh-hoc/a1?tab=listening', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('button', { name: /Nghe lại/ })).toBeVisible()
    const { all } = await scan(page)
    expect(all).toEqual([])
  })

  test(`a11y: /lo-trinh-hoc/a1 tab Nghe — Gõ lại theme=${theme} — 0 vi phạm A/AA`, async ({
    page,
  }) => {
    await muteTts(page)
    await mockLogin(page, 'vi', theme)
    await page.goto('/lo-trinh-hoc/a1?tab=listening', { waitUntil: 'domcontentloaded' })
    await page.getByRole('button', { name: /Gõ lại/ }).click()
    await expect(page.getByPlaceholder(/Gõ lại câu vừa nghe/)).toBeVisible()
    const { all } = await scan(page)
    expect(all).toEqual([])
  })
}

// ── Home: banner "quay lại sau khi bỏ bẵng" (② M4) + gợi ý "Luyện nói với từ
// vừa học" — 2 trạng thái không hiện ở lần quét trang chủ mặc định (user E2E mới
// tinh không kích hoạt điều kiện) nên cần seed riêng.
async function seedEnglishComeback(page: Page, offsetDays: number) {
  const ms = Date.now() - offsetDays * 86400000 + 7 * 3600000
  const date = new Date(ms).toISOString().slice(0, 10)
  await page.addInitScript(
    ({ usageKey, usage, learnedKey }) => {
      localStorage.setItem(usageKey, JSON.stringify(usage))
      // Usage là đa miền; từ đã học là bằng chứng riêng để Home bật comeback của môn English.
      localStorage.setItem(learnedKey, JSON.stringify(['apple']))
    },
    {
      usageKey: `et_usage_${USER_ID}_${date}`,
      usage: { date, chatCount: 0, writingCount: 0, speakingCount: 0, learnCount: 1 },
      learnedKey: `et_learned_${USER_ID}`,
    },
  )
}

for (const theme of THEMES) {
  test(`a11y: Home — banner quay lại theme=${theme} — 0 vi phạm A/AA`, async ({ page }) => {
    await seedEnglishComeback(page, 5)
    await mockLogin(page, 'vi', theme)
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await expect(page.getByText(/Đã 5 ngày rồi/)).toBeVisible()
    const { all } = await scan(page)
    expect(all).toEqual([])
  })

  test(`a11y: Home — gợi ý luyện nói với từ vừa học theme=${theme} — 0 vi phạm A/AA`, async ({
    page,
  }) => {
    await page.addInitScript(({ key, value }) => localStorage.setItem(key, JSON.stringify(value)), {
      key: `et_learned_${USER_ID}`,
      value: ['apple', 'banana', 'cherry'],
    })
    await mockLogin(page, 'vi', theme)
    // Nút gợi ý này nằm ở trang tổng quan môn Tiếng Anh "/goc-hoc-tap/english" (slice 02
    // Góc học tập, 2026-09-15; trước đó là "/hoc-tieng-anh") — xem EnglishHome.tsx.
    await page.goto('/goc-hoc-tap/english', { waitUntil: 'domcontentloaded' })
    await expect(page.getByText(/Luyện nói với 3 từ vừa học/)).toBeVisible()
    const { all } = await scan(page)
    expect(all).toEqual([])
  })
}

// ── MÀN AI PHẢN HỒI CODE môn Lập trình (PR-L5) ────────────────────────────────────
// Khối này chỉ hiện ở bước "Tự viết" và phần trả lời chỉ hiện SAU khi gọi API, nên vòng
// quét theo route ở trên không bao giờ chạm tới. Chặn `/api/programming/feedback` trả câu
// mẫu rồi quét đủ 5 theme — cùng cách đã làm cho màn kết quả Chat/Writing/Speaking.
async function openProgrammingAiPanel(page: Page, theme: ThemeName) {
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
}

for (const theme of THEMES) {
  test(`a11y: AI xem code (Lập trình) theme=${theme} — 0 vi phạm A/AA`, async ({ page }) => {
    await openProgrammingAiPanel(page, theme)
    const { all } = await scan(page)
    expect(all).toEqual([])
  })
}

// ── MÀN "ĐI CHUNG" ĐANG TRONG CHUYẾN (/nhom-di-chung) ─────────────────────────────
// Trang này KHÔNG nằm trong vòng quét theo route ở trên vì toàn bộ giao diện đáng quét
// (bản đồ, danh sách người, cảnh báo đi lạc, công tắc chia sẻ, nút kết thúc chuyến) chỉ
// hiện SAU khi có dữ liệu chuyến từ backend — tải trang trơn chỉ thấy màn tạo chuyến.
//
// Vì sao phải thêm: bản đầu của trang dùng `bg-accent-500` kèm chữ trắng, RỚT tương phản
// AA ở cả 5 theme (2,54–3,53 so với sàn 4,5) mà không cổng nào bắt được — đúng vì trang
// nằm ngoài danh sách quét. Fixture dùng chung ở e2e/helpers/location.ts bịt khoảng trống đó.
for (const theme of THEMES) {
  test(`a11y: Đi chung — trong chuyến theme=${theme} — 0 vi phạm A/AA`, async ({ page }) => {
    await openLiveLocationTrip(page, theme)
    const { all } = await scan(page)
    expect(all).toEqual([])
  })
}

// Cùng màn hình nhưng khi trình duyệt TỪ CHỐI quyền vị trí — lúc đó app hiện toast lỗi, và
// chính cái toast đó từng mang hai vi phạm mà không cổng nào chạm tới, vì trước đây không có
// trang nào được quét trong lúc đang hiện toast:
//   • `button-name` (critical): nút đóng toast chỉ có icon, không có tên đọc được;
//   • `color-contrast` (serious): chữ toast dùng sắc độ -300, rớt AA trên 3 theme nền sáng
//     (đo được 1,38–1,52 so với sàn 4,5).
// Cả hai đã sửa ở packages/core-ui/ToastProvider.tsx; vòng quét này giữ cho chúng không quay lại.
for (const theme of THEMES) {
  test(`a11y: Đi chung — toast lỗi GPS theme=${theme} — 0 vi phạm A/AA`, async ({ page }) => {
    await openLiveLocationTrip(page, theme, 'denied')
    await expect(page.getByText(/chưa cho phép truy cập vị trí/i)).toBeVisible()
    const { all } = await scan(page)
    expect(all).toEqual([])
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
  test(`a11y: màn kết quả bài STEM (đã nộp) theme=${theme} — 0 vi phạm A/AA`, async ({ page }) => {
    await mockNopChuaDat(page)
    await mockLogin(page, 'vi', theme)
    await page.goto(BAI_STEM, { waitUntil: 'domcontentloaded' })
    await waitForStableDom(page)
    await nopBaiStem(page)
    const { all } = await scan(page)
    expect(all).toEqual([])
  })
}

// [S11b] Câu STEM ở chế độ TỰ THỬ LẠI (vào từ Sổ lỗi, router state) — 0 vi phạm A/AA.
for (const theme of THEMES) {
  test(`a11y: câu STEM tự thử lại từ Sổ lỗi, theme=${theme}`, async ({ page }) => {
    await mockLogin(page, 'vi', theme)
    await muteTts(page)
    await moCauTuThuLai(page)
    await waitForStableDom(page)
    const { all } = await scan(page)
    expect(all, `Vi phạm A/AA ở câu STEM tự thử lại, theme=${theme}`).toEqual([])
  })
}

// [S06c] Các studio của Bạn Đồng Hành — trước đây cổng chỉ quét studio mặc định, nên 4 studio
// còn lại chưa từng được đo (14 vi phạm tương phản sống sót tới 25/09, spec S06–S08 mục S06c).
// Studio "Tổng kết" đã GỠ (changelog 0475); thẻ Agent + banner Action Canvas của nó dời sang
// "Kế hoạch" nên vẫn được quét ở đây.
const COMPANION_STUDIOS = ['Trò chuyện', 'Ghi nhớ', 'Thử thách', 'Kế hoạch']
for (const theme of THEMES) {
  for (const studio of COMPANION_STUDIOS) {
    test(`a11y: Bạn Đồng Hành — studio ${studio}, theme=${theme}`, async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 })
      await mockLogin(page, 'vi', theme)
      await muteTts(page)
      await page.goto('/ban-dong-hanh', { waitUntil: 'domcontentloaded' })
      const tab = page.getByRole('button', { name: studio, exact: true })
      await tab.click()
      // Chờ theo TRẠNG THÁI: nút studio báo đang chọn, rồi DOM của studio (nạp lười) đứng yên.
      await expect(tab).toHaveAttribute('aria-pressed', 'true')
      await waitForStableDom(page)
      const { all } = await scan(page)
      expect(all, `Vi phạm A/AA ở studio ${studio}, theme=${theme}`).toEqual([])
    })
  }
}

// [S06d] Thẻ Workplace Harvester (studio "Kế hoạch") từng tràn ngang ở 390 px: tiêu đề và nhóm tab
// chung một hàng không xuống dòng nên tab "Thẻ SRS" bị cắt. Thẻ có overflow-hidden nên phần tràn
// không hiện thanh cuộn — đo bằng scrollWidth > clientWidth của chính thẻ và của hàng header.
test('Bạn Đồng Hành — thẻ Workplace Harvester không tràn ngang ở 390 px', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await mockLogin(page, 'vi', 'blue-sky')
  await muteTts(page)
  await page.goto('/ban-dong-hanh', { waitUntil: 'domcontentloaded' })
  const tab = page.getByRole('button', { name: 'Kế hoạch', exact: true })
  await tab.click()
  await expect(tab).toHaveAttribute('aria-pressed', 'true')
  const heading = page.getByRole('heading', { name: /Workplace Error Harvester/ })
  await expect(heading).toBeVisible()
  const cardsTab = page.getByRole('button', { name: /Thẻ SRS/ })
  await expect(cardsTab).toBeInViewport({ ratio: 1 })
  const overflow = await heading.evaluate((h) => {
    const header = h.closest('.border-b') as HTMLElement
    const card = header.parentElement as HTMLElement
    return [header, card].map((el) => el.scrollWidth - el.clientWidth)
  })
  expect(overflow, 'Header/thẻ Workplace Harvester tràn ngang (px)').toEqual([0, 0])
  await cardsTab.click()
  await expect(cardsTab).toHaveAttribute('aria-pressed', 'true')
})

// [S06d-b] Ở 390 px, header thẻ đặt tiêu đề và nút CTA chung một hàng không xuống dòng: tiêu đề bị ép
// thành cột hẹp (3–4 dòng) và nút CTA bẻ chữ thành 3–4 dòng. Header nay xếp dọc ở màn hẹp.
// Đo đúng triệu chứng người đọc thấy: mọi tiêu đề h3 trong ba studio có thẻ dạng này tối đa 2 dòng,
// và nút ngay trong header thẻ giữ một dòng chữ.
const MAX_TITLE_LINES_390 = 2
const MAX_HEADER_BUTTON_HEIGHT = 48
for (const studio of ['Ghi nhớ', 'Thử thách', 'Kế hoạch']) {
  test(`Bạn Đồng Hành — header thẻ không bị ép hẹp ở 390 px, studio ${studio}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await mockLogin(page, 'vi', 'blue-sky')
    await muteTts(page)
    await page.goto('/ban-dong-hanh', { waitUntil: 'domcontentloaded' })
    const tab = page.getByRole('button', { name: studio, exact: true })
    await tab.click()
    await expect(tab).toHaveAttribute('aria-pressed', 'true')
    await waitForStableDom(page)
    const cramped = await page.locator('main h3').evaluateAll(
      (headings, [maxLines, maxButton]) =>
        headings.flatMap((h) => {
          const problems: string[] = []
          const name = (h.textContent ?? '').trim().slice(0, 40)
          const lineHeight = parseFloat(getComputedStyle(h).lineHeight)
          const lines = Math.round(h.getBoundingClientRect().height / lineHeight)
          if (lines > maxLines) problems.push(`tiêu đề "${name}" ${lines} dòng`)
          const button = h.closest('.border-b')?.querySelector(':scope > button')
          if (button && button.getBoundingClientRect().height > maxButton)
            problems.push(
              `nút ở header "${name}" cao ${Math.round(button.getBoundingClientRect().height)}px`,
            )
          return problems
        }),
      [MAX_TITLE_LINES_390, MAX_HEADER_BUTTON_HEIGHT] as const,
    )
    expect(cramped, `Header thẻ bị ép hẹp ở studio ${studio}`).toEqual([])
  })
}
