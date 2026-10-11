import { test, expect } from '@playwright/test'
import { mockLogin } from './helpers/auth'

// Cổng CHỨC NĂNG bài học 8 bước (PR-L3) — đi trọn luồng 1 bài end-to-end trên bài mẫu
// P1-U4 "tiền điện bậc thang": Predict chọn đáp án → Parsons xếp đúng thứ tự → Make dùng
// code mẫu (phao) và chấm 5 test-case bằng Pyodide thật (tự host, chạy offline).

const PARSONS_ORDER = [
  'so_kwh = int(input("Số điện tháng này? "))',
  'if so_kwh < 100:',
  'print("Dùng tiết kiệm")',
  'elif so_kwh < 300:',
  'print("Bình thường")',
  'else:',
  'print("Dùng nhiều")',
]

test('luồng 1 bài học end-to-end: predict → parsons → make đạt hết test', async ({ page }) => {
  test.setTimeout(180_000)
  await mockLogin(page, 'vi', 'dark-blue')
  await page.goto('/goc-hoc-tap/programming/bai-hoc/p1-u4-l1', { waitUntil: 'domcontentloaded' })

  // ①② Khái niệm hiện móc thực tế
  await expect(page.getByText(/hoá đơn tiền điện/i).first()).toBeVisible()

  // ④ Predict: chọn đáp án đúng "Khá" → hiện giải thích
  await page.getByRole('button', { name: 'Dự đoán' }).click()
  await page.getByRole('button', { name: 'Khá', exact: true }).click()
  await expect(page.getByText('Chính xác! 🎉')).toBeVisible()

  // ⑤ Parsons: bấm các dòng theo đúng thứ tự rồi kiểm tra
  await page.getByRole('button', { name: 'Xếp code' }).click()
  for (const line of PARSONS_ORDER) {
    // Kho nằm SAU khung "Bài của bạn" — dòng còn trong kho là nút cuối trùng tên.
    await page.getByRole('button', { name: line }).last().click()
  }
  await page.getByRole('button', { name: 'Kiểm tra thứ tự' }).click()
  await expect(page.getByText('Đúng thứ tự!')).toBeVisible()

  // ⑥ Make: dùng phao (code mẫu) rồi chấm — 5 test-case chạy Pyodide thật
  await page.getByRole('button', { name: 'Tự viết' }).click()
  await page.getByRole('button', { name: 'Xem code mẫu' }).click()
  await page.getByRole('button', { name: 'Chấm bài' }).click()
  await expect(page.getByText('Đạt toàn bộ test!')).toBeVisible({ timeout: 120_000 })

  // [P1-6] Đạt bài → màn kết SessionDone kể ĐỦ 5 bước đã làm (Dự đoán + Xếp code đều làm
  // đúng ở trên); "Tiếp tục bài" đóng màn kết và đưa sang bước ⑦ "Về nhà".
  const ketPhien = page.getByRole('dialog')
  await expect(ketPhien).toBeVisible()
  await expect(ketPhien).toContainText('hoàn thành 5 bước')
  await expect(page).toHaveURL(/[?&]xong=1(&|#|$)/)
  await ketPhien.getByRole('button', { name: 'Tiếp tục bài' }).click()
  await expect(ketPhien).toBeHidden()
  await expect(page).not.toHaveURL(/xong=/)

  // ⑦ Về nhà: xác nhận trạng thái hoàn thành
  await expect(page.getByText('Bài học đã hoàn thành')).toBeVisible()
})

test('parsons xếp sai báo chưa đúng; make chạy code khởi đầu thì có ca rớt', async ({ page }) => {
  test.setTimeout(180_000)
  await mockLogin(page, 'vi', 'dark-blue')
  await page.goto('/goc-hoc-tap/programming/bai-hoc/p1-u4-l1', { waitUntil: 'domcontentloaded' })

  await page.getByRole('button', { name: 'Xếp code' }).click()
  // Xếp sai chủ đích: bấm 2 dòng cuối trước
  await page.getByRole('button', { name: PARSONS_ORDER[6]! }).last().click()
  await page.getByRole('button', { name: PARSONS_ORDER[0]! }).last().click()
  await page.getByRole('button', { name: 'Kiểm tra thứ tự' }).click()
  await expect(page.getByText('Chưa đúng thứ tự')).toBeVisible()

  // Make với code khởi đầu (chưa tính tiền) → phải có ca rớt hiện rõ
  await page.getByRole('button', { name: 'Tự viết' }).click()
  await page.getByRole('button', { name: 'Chấm bài' }).click()
  await expect(page.getByText(/Dùng 30 kWh/).first()).toBeVisible({ timeout: 120_000 })
  await expect(page.getByText('Đạt toàn bộ test!')).not.toBeVisible()
})

// Bài P1-U9 dạy random.seed() để kết quả TẤT ĐỊNH. Cổng nội dung (lessonsPython.test.ts)
// chấm bằng python3 của runner; học viên lại chạy CPython bản WASM (Pyodide). Nếu hai bản
// sinh dãy số khác nhau thì bài sẽ "xanh ở CI, rớt ở người học" — test này chạy chính code
// mẫu của bài TRONG TRÌNH DUYỆT để chốt hai môi trường khớp nhau.
test('bài số ngẫu nhiên: code mẫu đạt hết test-case trong Pyodide (khớp python3)', async ({
  page,
}) => {
  test.setTimeout(180_000)
  await mockLogin(page, 'vi', 'dark-blue')
  await page.goto('/goc-hoc-tap/programming/bai-hoc/p1-u9-l1', { waitUntil: 'domcontentloaded' })

  await page.getByRole('button', { name: 'Tự viết' }).click()
  await page.getByRole('button', { name: 'Xem code mẫu' }).click()
  await page.getByRole('button', { name: 'Chấm bài' }).click()
  await expect(page.getByText('Đạt toàn bộ test!')).toBeVisible({ timeout: 120_000 })
})

// P2 dùng hai thứ mà python3 của runner làm được nhưng Pyodide THÌ CHƯA CHẮC: ghi/đọc FILE
// (U6 — Pyodide dùng hệ thống file trong bộ nhớ) và thư viện datetime/math (U8). Xanh ở cổng
// python3 mà rớt trong trình duyệt thì học viên là người lãnh đủ, nên chạy thật hai bài này
// trong Pyodide y như học viên gặp.
for (const lessonId of ['p2-u6-l1', 'p2-u8-l1']) {
  test(`bài ${lessonId}: code mẫu đạt hết test-case trong Pyodide (khớp python3)`, async ({
    page,
  }) => {
    test.setTimeout(180_000)
    await mockLogin(page, 'vi', 'dark-blue')
    await page.goto(`/goc-hoc-tap/programming/bai-hoc/${lessonId}`, {
      waitUntil: 'domcontentloaded',
    })

    await page.getByRole('button', { name: 'Tự viết' }).click()
    await page.getByRole('button', { name: 'Xem code mẫu' }).click()
    await page.getByRole('button', { name: 'Chấm bài' }).click()
    await expect(page.getByText('Đạt toàn bộ test!')).toBeVisible({ timeout: 120_000 })
  })
}

// ⑥b AI đồng hành (PR-L5) — chặn `/api/programming/feedback` để KHÔNG gọi model thật trong CI.
// Thứ cần chốt ở đây là hợp đồng UI: bậc gợi ý mở dần theo bậc SERVER trả về, nút "nhờ xem
// code" chỉ xuất hiện sau khi đạt bài, và lời nhắn hết lượt hiện nguyên văn cho học viên.
test('gợi ý Socratic mở dần theo bậc server trả về; hết lượt hiện đúng lời nhắn', async ({
  page,
}) => {
  await mockLogin(page, 'vi', 'dark-blue')

  let call = 0
  await page.route('**/api/programming/feedback', async (route) => {
    call += 1
    if (call === 1) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          text: 'Đề bài yêu cầu in ra gì nhỉ?',
          kind: 'socratic_hint',
          hintLevel: 1,
        }),
      })
      return
    }
    await route.fulfill({
      status: 429,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Hết lượt rồi. Học thêm bài để có thêm lượt nhé!' }),
    })
  })

  await page.goto('/goc-hoc-tap/programming/bai-hoc/p1-u4-l1', { waitUntil: 'domcontentloaded' })
  await page.getByRole('button', { name: 'Tự viết' }).click()

  // Chưa đạt bài → KHÔNG được mời nhờ AI xem lại code (đó là đường vòng lấy lời giải).
  await expect(page.getByRole('button', { name: 'Nhờ AI xem lại code' })).toHaveCount(0)

  const hint = page.getByRole('button', { name: /Gợi ý bậc/ })
  await expect(hint).toContainText('bậc 1/3')
  await hint.click()
  await expect(page.getByText('Đề bài yêu cầu in ra gì nhỉ?')).toBeVisible()
  await expect(hint).toContainText('bậc 2/3')

  // Lượt sau hết lượt → hiện NGUYÊN VĂN lời nhắn của server, không nuốt thành lỗi chung.
  await hint.click()
  await expect(page.getByText('Hết lượt rồi. Học thêm bài để có thêm lượt nhé!')).toBeVisible()
})

// PR-L7b1 — bài JAVASCRIPT đầu tiên (p3-u6-l1) chạy bằng Web Worker riêng, KHÔNG phải Pyodide.
// Cổng nội dung (lessonsJs.test.ts) chấm bằng node:vm; test này chốt đường đi thật trong trình
// duyệt: trang chọn đúng bộ chạy theo `language` của bài, worker nạp được, output khớp bộ chấm.
test('bài JavaScript p3-u6-l1: code mẫu đạt hết test-case trong Worker', async ({ page }) => {
  test.setTimeout(120_000)
  await mockLogin(page, 'vi', 'dark-blue')
  await page.goto('/goc-hoc-tap/programming/bai-hoc/p3-u6-l1', { waitUntil: 'domcontentloaded' })

  await page.getByRole('button', { name: 'Tự viết' }).click()
  await page.getByRole('button', { name: 'Xem code mẫu' }).click()
  await page.getByRole('button', { name: 'Chấm bài' }).click()
  await expect(page.getByText('Đạt toàn bộ test!')).toBeVisible({ timeout: 60_000 })
})

// Vòng lặp vô hạn là lỗi kinh điển của người mới — và là lý do bài JS chạy trong Worker chứ
// không phải iframe (iframe chung luồng với trang thì treo cứng cả app, không ngắt được).
// Test này chốt: trang vẫn sống và báo đúng lời nhắn quá giờ.
test('bài JavaScript: vòng lặp vô hạn bị ngắt, trang không treo', async ({ page }) => {
  test.setTimeout(120_000)
  await mockLogin(page, 'vi', 'dark-blue')
  await page.goto('/goc-hoc-tap/programming/bai-hoc/p3-u6-l1', { waitUntil: 'domcontentloaded' })

  await page.getByRole('button', { name: 'Tự viết' }).click()
  const editor = page.getByRole('textbox').first()
  await editor.fill('while (true) {}')
  await page.getByRole('button', { name: 'Chấm bài' }).click()
  await expect(page.getByText(/quá 5 giây nên đã bị dừng/)).toBeVisible({ timeout: 60_000 })
  // Trang còn phản hồi: bấm sang bước khác vẫn được.
  await page.getByRole('button', { name: 'Về nhà' }).click()
})

// PR-L7b2 — bài SQL chạy trên SQLite (sql.js) tự host tại /sqljs/sql-wasm.wasm, KHÔNG CDN.
// Cổng nội dung (lessonsSql.test.ts) chấm bằng chính engine này ở node, nên hai nơi không thể
// lệch; test dưới đây chốt phần cổng kia không thấy: worker nạp được .wasm từ đúng origin và
// trang chọn đúng bộ chạy theo `language: 'sql'`.
for (const lessonId of ['p3-u8-l1', 'p3-u9-l1']) {
  test(`bài SQL ${lessonId}: code mẫu đạt hết test-case trên SQLite trong trình duyệt`, async ({
    page,
  }) => {
    test.setTimeout(120_000)
    await mockLogin(page, 'vi', 'dark-blue')

    // Chốt "tự host": mọi yêu cầu ra ngoài origin của app đều bị chặn — nếu code lỡ trỏ CDN
    // thì test đỏ ngay chứ không âm thầm chạy được nhờ mạng của runner.
    await page.route('**/*', (route) => {
      const url = new URL(route.request().url())
      const noiBo = url.hostname === 'localhost' || url.hostname === '127.0.0.1'
      // fallback() chứ KHÔNG phải continue(): phải nhường lại cho các handler đăng ký
      // trước (mockLogin giả lập /api/*), nếu không sẽ giành mất và học viên thành chưa
      // đăng nhập.
      return noiBo || url.protocol === 'data:' ? route.fallback() : route.abort()
    })

    await page.goto(`/goc-hoc-tap/programming/bai-hoc/${lessonId}`, {
      waitUntil: 'domcontentloaded',
    })
    await page.getByRole('button', { name: 'Tự viết' }).click()
    await page.getByRole('button', { name: 'Xem code mẫu' }).click()
    await page.getByRole('button', { name: 'Chấm bài' }).click()
    await expect(page.getByText('Đạt toàn bộ test!')).toBeVisible({ timeout: 60_000 })
  })
}

// CSDL phải được dựng LẠI mỗi lượt: học viên xoá sạch bảng để thử nghiệm rồi chạy lại vẫn
// phải có dữ liệu. Nếu trạng thái rò rỉ giữa các lượt thì bài sau sẽ rớt oan.
test('bài SQL: xoá sạch bảng rồi chạy lại vẫn có dữ liệu (mỗi lượt một CSDL sạch)', async ({
  page,
}) => {
  test.setTimeout(120_000)
  await mockLogin(page, 'vi', 'dark-blue')
  await page.goto('/goc-hoc-tap/programming/bai-hoc/p3-u8-l1', { waitUntil: 'domcontentloaded' })

  await page.getByRole('button', { name: 'Tự viết' }).click()
  const editor = page.getByRole('textbox').first()
  await editor.fill('DELETE FROM mon;')
  await page.getByRole('button', { name: 'Chấm bài' }).click()
  await expect(page.getByText('Đạt toàn bộ test!')).not.toBeVisible()

  await editor.fill(
    "SELECT ten, gia FROM mon WHERE nhom = 'uong' AND gia >= 20000 ORDER BY gia DESC LIMIT 2;",
  )
  await page.getByRole('button', { name: 'Chấm bài' }).click()
  await expect(page.getByText('Đạt toàn bộ test!')).toBeVisible({ timeout: 60_000 })
})

// PR-L7c — bài HTML/CSS (U4–U5). Hai thứ cần chốt mà cổng CI không thấy được:
// (1) parser của TRÌNH DUYỆT thật cho ra cùng bản mô tả cây DOM với happy-dom ở cổng CI
//     (đây là khe hở hai engine duy nhất còn lại của môn — chấp nhận có, nên phải canh);
// (2) khung xem trang là iframe sandbox="" nên KHÔNG chạy script.
for (const lessonId of ['p3-u4-l1', 'p3-u5-l1']) {
  test(`bài HTML ${lessonId}: code mẫu đạt hết test-case trong trình duyệt thật`, async ({
    page,
  }) => {
    test.setTimeout(120_000)
    await mockLogin(page, 'vi', 'dark-blue')
    await page.goto(`/goc-hoc-tap/programming/bai-hoc/${lessonId}`, {
      waitUntil: 'domcontentloaded',
    })

    await page.getByRole('button', { name: 'Tự viết' }).click()
    await page.getByRole('button', { name: 'Xem code mẫu' }).click()
    await page.getByRole('button', { name: 'Chấm bài' }).click()
    await expect(page.getByText('Đạt toàn bộ test!')).toBeVisible({ timeout: 60_000 })
  })
}

test('khung xem trang hiển thị trang nhưng KHÔNG chạy script trong đó', async ({ page }) => {
  test.setTimeout(120_000)
  await mockLogin(page, 'vi', 'dark-blue')
  await page.goto('/goc-hoc-tap/programming/bai-hoc/p3-u4-l1', { waitUntil: 'domcontentloaded' })
  await page.getByRole('button', { name: 'Tự viết' }).click()

  await page
    .getByRole('textbox')
    .first()
    .fill(
      '<!doctype html><html lang="vi"><body><h1 id="tieu-de">Xin chao</h1>' +
        '<script>document.getElementById("tieu-de").textContent = "SCRIPT DA CHAY"</script>' +
        '</body></html>',
    )

  const khung = page.frameLocator('iframe[title="Xem trước trang web bạn vừa viết"]')
  // Trang hiển thị được...
  await expect(khung.getByRole('heading', { name: 'Xin chao' })).toBeVisible()
  // ...nhưng script bên trong KHÔNG được phép chạy (sandbox="" thu hồi mọi quyền).
  await expect(khung.getByText('SCRIPT DA CHAY')).toHaveCount(0)
})

// PR-L7d — bài DOM (p3-u6-l2). Chấm chạy trong Web Worker với linkedom (cùng thư viện cổng CI
// dùng), còn iframe chỉ để XEM trang chạy. Ba thứ cần chốt trong trình duyệt thật:
test('bài DOM p3-u6-l2: code mẫu đạt hết test-case (Worker + linkedom)', async ({ page }) => {
  test.setTimeout(120_000)
  await mockLogin(page, 'vi', 'dark-blue')
  await page.goto('/goc-hoc-tap/programming/bai-hoc/p3-u6-l2', { waitUntil: 'domcontentloaded' })

  await page.getByRole('button', { name: 'Tự viết' }).click()
  await page.getByRole('button', { name: 'Xem code mẫu' }).click()
  await page.getByRole('button', { name: 'Chấm bài' }).click()
  await expect(page.getByText('Đạt toàn bộ test!')).toBeVisible({ timeout: 60_000 })
})

test('bài DOM: khung "Xem trang chạy" chạy script thật và phản ứng khi bấm', async ({ page }) => {
  test.setTimeout(120_000)
  await mockLogin(page, 'vi', 'dark-blue')
  await page.goto('/goc-hoc-tap/programming/bai-hoc/p3-u6-l2', { waitUntil: 'domcontentloaded' })

  await page.getByRole('button', { name: 'Tự viết' }).click()
  await page.getByRole('button', { name: 'Xem code mẫu' }).click()
  // Khung chỉ chạy khi bấm — KHÔNG chạy theo từng phím gõ (script dở dang là mối nguy thật).
  await expect(page.locator('iframe[title="Xem trước trang web bạn vừa viết"]')).toHaveCount(0)
  await page.getByRole('button', { name: 'Xem trang chạy' }).click()

  const khung = page.frameLocator('iframe[title="Xem trước trang web bạn vừa viết"]')
  await khung.locator('#so-kwh').fill('150')
  await khung.getByRole('button', { name: 'Tinh tien' }).click()
  await expect(khung.locator('#ket-qua')).toHaveText('Tien dien: 306000 dong')
})

// PR-L7e — bài FETCH (p3-u7). Sandbox không có mạng nên fetch là GIẢ LẬP (fetchPrelude.ts):
// bộ chấm trong Worker dùng thẳng taoFetchGia(), còn khung xem trang nhúng FETCH_SHIM_JS sinh
// từ .toString() của chính hàm đó. Hai test dưới chốt cả hai đường trong trình duyệt thật —
// đặc biệt đường shim, vì source qua bundler của Vite có thể bị biến đổi (đã đệm __name).
for (const lessonId of ['p3-u7-l1', 'p3-u7-l2']) {
  test(`bài fetch ${lessonId}: code mẫu đạt hết test-case KHÔNG cần mạng thật`, async ({
    page,
  }) => {
    test.setTimeout(120_000)
    await mockLogin(page, 'vi', 'dark-blue')

    // Chặn mọi yêu cầu ra ngoài origin: nếu bài fetch lỡ gọi mạng thật thì đỏ ngay tại đây,
    // không âm thầm xanh nhờ mạng của runner (cùng khuôn với test SQL tự host ở trên).
    await page.route('**/*', (route) => {
      const url = new URL(route.request().url())
      const noiBo = url.hostname === 'localhost' || url.hostname === '127.0.0.1'
      return noiBo || url.protocol === 'data:' ? route.fallback() : route.abort()
    })

    await page.goto(`/goc-hoc-tap/programming/bai-hoc/${lessonId}`, {
      waitUntil: 'domcontentloaded',
    })
    await page.getByRole('button', { name: 'Tự viết' }).click()
    await page.getByRole('button', { name: 'Xem code mẫu' }).click()
    await page.getByRole('button', { name: 'Chấm bài' }).click()
    await expect(page.getByText('Đạt toàn bộ test!')).toBeVisible({ timeout: 60_000 })
  })
}

test('bài fetch: khung "Xem trang chạy" dùng fetch giả — tra cứu chạy thật trong iframe', async ({
  page,
}) => {
  test.setTimeout(120_000)
  await mockLogin(page, 'vi', 'dark-blue')
  await page.goto('/goc-hoc-tap/programming/bai-hoc/p3-u7-l2', { waitUntil: 'domcontentloaded' })

  await page.getByRole('button', { name: 'Tự viết' }).click()
  await page.getByRole('button', { name: 'Xem code mẫu' }).click()
  await page.getByRole('button', { name: 'Xem trang chạy' }).click()

  const khung = page.frameLocator('iframe[title="Xem trước trang web bạn vừa viết"]')
  await khung.locator('#o-tinh').fill('Đà Nẵng')
  await khung.getByRole('button', { name: 'Tra cuu' }).click()
  // Số liệu từ bộ dữ liệu mẫu weatherData.ts — iframe không có mạng mà vẫn trả lời được.
  await expect(khung.locator('#ket-qua')).toHaveText('Đà Nẵng: 26 do C, mưa rào')
})

// PR-L9 — bài GIT (p3-u10, p3-u11). Chạy trên bộ mô phỏng thuần TypeScript (gitSim.ts), KHÔNG
// worker và KHÔNG git thật: cổng CI và trình duyệt gọi chung một hàm nên không thể lệch. Test
// này chốt đường đi trong trình duyệt: trang chọn đúng bộ chạy theo language 'git', và lệnh
// gõ sai hiện lỗi dạy được ngay tại chỗ thay vì im lặng.
test('bài Git p3-u10-l1: code mẫu đạt hết test-case, không cần git thật', async ({ page }) => {
  test.setTimeout(120_000)
  await mockLogin(page, 'vi', 'dark-blue')
  await page.goto('/goc-hoc-tap/programming/bai-hoc/p3-u10-l1', { waitUntil: 'domcontentloaded' })

  await page.getByRole('button', { name: 'Tự viết' }).click()
  await page.getByRole('button', { name: 'Xem code mẫu' }).click()
  await page.getByRole('button', { name: 'Chấm bài' }).click()
  await expect(page.getByText('Đạt toàn bộ test!')).toBeVisible({ timeout: 60_000 })
})

test('bài Git: quên git add thì báo lỗi dạy được, không im lặng đánh rớt', async ({ page }) => {
  test.setTimeout(120_000)
  await mockLogin(page, 'vi', 'dark-blue')
  await page.goto('/goc-hoc-tap/programming/bai-hoc/p3-u10-l1', { waitUntil: 'domcontentloaded' })

  await page.getByRole('button', { name: 'Tự viết' }).click()
  await page
    .getByRole('textbox')
    .first()
    .fill('git init\necho "Quan cua toi" > README.md\ngit commit -m "Them README"')
  await page.getByRole('button', { name: 'Chấm bài' }).click()
  // Thông điệp của bộ mô phỏng phải tới được mắt học viên, kèm cách sửa.
  await expect(page.getByText(/vung cho/).first()).toBeVisible({ timeout: 60_000 })
})

// PR-M2 — bài DÒNG LỆNH (p3-u11-l2..l4), chạy trên bashSim.ts (PR-M1). Cùng lý do với bài
// Git ở trên: cổng CI gọi thẳng chayBash() nên đã chứng minh nội dung đúng, nhưng chỉ test
// trình duyệt mới chốt được ĐƯỜNG ĐI — trang chọn đúng bộ chạy theo language 'bash', và luật
// tự khai (dòng [GIA LAP]) tới được mắt học viên chứ không chỉ nằm trong engine.
test('bài dòng lệnh p3-u11-l4: code mẫu đạt hết test-case, có dòng tự khai mô phỏng', async ({
  page,
}) => {
  test.setTimeout(120_000)
  await mockLogin(page, 'vi', 'dark-blue')
  await page.goto('/goc-hoc-tap/programming/bai-hoc/p3-u11-l4', { waitUntil: 'domcontentloaded' })

  // Huy hiệu ngôn ngữ phải tự khai là mô phỏng NGAY trước khi học viên vào bài.
  await expect(page.getByText('Dòng lệnh (bash)').first()).toBeVisible()

  await page.getByRole('button', { name: 'Tự viết' }).click()
  await page.getByRole('button', { name: 'Xem code mẫu' }).click()
  await page.getByRole('button', { name: 'Chấm bài' }).click()
  await expect(page.getByText('Đạt toàn bộ test!')).toBeVisible({ timeout: 60_000 })
})

test('bài dòng lệnh: gõ sai lệnh thì hiện thông báo dạy được ngay tại chỗ', async ({ page }) => {
  test.setTimeout(120_000)
  await mockLogin(page, 'vi', 'dark-blue')
  await page.goto('/goc-hoc-tap/programming/bai-hoc/p3-u11-l2', { waitUntil: 'domcontentloaded' })

  await page.getByRole('button', { name: 'Tự viết' }).click()
  await page.getByRole('textbox').first().fill('mkdir bao_cao\nrm bao_cao')
  await page.getByRole('button', { name: 'Chấm bài' }).click()
  // Bộ chạy phải NÓI RA cách sửa (thêm -r), không im lặng đánh rớt.
  await expect(page.getByText(/them "-r"/).first()).toBeVisible({ timeout: 60_000 })
})

// PR-M8 — bài KOTLIN đầu tiên (p6-u5), chạy trên kotlinSim.ts (PR-M7, cổng đối chiếu §3.4 mở
// ngày 2026-09-03). Cùng lý do với bài Git/bash ở trên: cổng CI `lessonsKotlin.test.ts` gọi
// thẳng chayKotlin() nên đã chứng minh NỘI DUNG đúng, nhưng chỉ test trình duyệt mới chốt được
// ĐƯỜNG ĐI — trang chọn đúng bộ chạy theo language 'kotlin', và luật tự khai §3.3 (huy hiệu
// "· mô phỏng" + dòng [GIA LAP]) tới được mắt học viên chứ không chỉ nằm trong engine.
test('bài Kotlin p6-u5-l3: code mẫu đạt hết test-case, huy hiệu tự khai là mô phỏng', async ({
  page,
}) => {
  test.setTimeout(120_000)
  await mockLogin(page, 'vi', 'dark-blue')
  await page.goto('/goc-hoc-tap/programming/bai-hoc/p6-u5-l3', { waitUntil: 'domcontentloaded' })

  // Huy hiệu phải tự khai là mô phỏng NGAY trước khi học viên vào bài (§3.3 luật 1).
  await expect(page.getByText('Kotlin').first()).toBeVisible()
  await expect(page.getByText('· mô phỏng').first()).toBeVisible()

  await page.getByRole('button', { name: 'Tự viết' }).click()
  await page.getByRole('button', { name: 'Xem code mẫu' }).click()
  await page.getByRole('button', { name: 'Chấm bài' }).click()
  await expect(page.getByText('Đạt toàn bộ test!')).toBeVisible({ timeout: 60_000 })
})

test('bài Kotlin: gán lại một `val` thì báo lỗi nói được, ngay tại chỗ', async ({ page }) => {
  test.setTimeout(120_000)
  await mockLogin(page, 'vi', 'dark-blue')
  await page.goto('/goc-hoc-tap/programming/bai-hoc/p6-u5-l1', { waitUntil: 'domcontentloaded' })

  await page.getByRole('button', { name: 'Tự viết' }).click()
  await page
    .getByRole('textbox')
    .first()
    .fill('fun main() {\n    val x = 1\n    x = 2\n    println(x)\n}')
  await page.getByRole('button', { name: 'Chấm bài' }).click()
  // Bộ chạy phải NÓI RA vì sao, không im lặng đánh rớt — đây là lý do sư phạm chính đáng của
  // việc tự viết interpreter (§3.4 "lỗi phải nói được").
  await expect(page.getByText(/khong gan lai duoc/).first()).toBeVisible({ timeout: 60_000 })
})

// PR-M9 — bài KOTLIN khép track (p6-u7-l2, dự án "Sổ chi tiêu" ghép cả ba unit u5–u7). Cùng
// lý do với bài Kotlin của PR-M8: cổng CI đã chấm nội dung, nhưng đường đi trong giao diện thì
// chỉ trình duyệt mới chốt được — nhất là bài này dùng sealed class, thứ cú pháp nặng nhất mà
// bộ chạy phải phân tích trước khi chấm.
test('bài Kotlin p6-u7-l2: dự án khép track chấm được trong trình duyệt', async ({ page }) => {
  test.setTimeout(120_000)
  await mockLogin(page, 'vi', 'dark-blue')
  await page.goto('/goc-hoc-tap/programming/bai-hoc/p6-u7-l2', { waitUntil: 'domcontentloaded' })

  await expect(page.getByText('· mô phỏng').first()).toBeVisible()

  await page.getByRole('button', { name: 'Tự viết' }).click()
  await page.getByRole('button', { name: 'Xem code mẫu' }).click()
  await page.getByRole('button', { name: 'Chấm bài' }).click()
  await expect(page.getByText('Đạt toàn bộ test!')).toBeVisible({ timeout: 60_000 })
})

test('bài Kotlin null safety: dùng thẳng dấu chấm trên kiểu có thể null thì được dạy cách sửa', async ({
  page,
}) => {
  test.setTimeout(120_000)
  await mockLogin(page, 'vi', 'dark-blue')
  await page.goto('/goc-hoc-tap/programming/bai-hoc/p6-u6-l1', { waitUntil: 'domcontentloaded' })

  await page.getByRole('button', { name: 'Tự viết' }).click()
  await page
    .getByRole('textbox')
    .first()
    .fill('fun main() {\n    val nhom: String? = null\n    println(nhom.length)\n}')
  await page.getByRole('button', { name: 'Chấm bài' }).click()
  // Thông báo phải NÊU ĐỦ BA CÁCH SỬA (?. / ?: / !!) — đây là giá trị sư phạm chính của việc
  // tự viết bộ chạy, và nó phải tới được mắt học viên chứ không chỉ nằm trong engine.
  await expect(page.getByText(/KHONG duoc dung thang dau/).first()).toBeVisible({ timeout: 60_000 })
})

// PR-M12 — GOM NHÓM unit P6 theo mạch. Cổng a11y đã quét /goc-hoc-tap/programming/bac/p6 ở cả 5 theme, nhưng nó
// chỉ chứng minh trang KHÔNG vi phạm tương phản/ngữ nghĩa — không chứng minh việc chia mạch có
// thật sự xảy ra. Hai test dưới chốt đúng điều đó, và chốt cả mặt trái: bậc KHÔNG chia mạch
// phải giữ nguyên danh sách phẳng như trước.
test('bậc P6: 65 unit được gom thành các mạch, mục lục trỏ tới mạch', async ({ page }) => {
  test.setTimeout(120_000)
  await mockLogin(page, 'vi', 'dark-blue')
  await page.goto('/goc-hoc-tap/programming/bac/p6', { waitUntil: 'domcontentloaded' })

  // Ba mạch của chương trình M phải hiện thành tiêu đề thật, không lẫn vào dải unit.
  await expect(page.getByRole('heading', { name: 'Dẫn nhập bốn hướng phổ biến' })).toBeVisible()
  await expect(page.getByRole('heading', { name: /Track Kotlin/ })).toBeVisible()
  await expect(page.getByRole('heading', { name: /Track Paradigm/ })).toBeVisible()
  // `exact` là bắt buộc: cột phải có sẵn một h2 "Hướng chuyên sâu tự chọn — …" (chặng dự án
  // của bậc), nếu không khớp chính xác thì locator dính cả hai và test đỏ oan.
  await expect(page.getByRole('heading', { name: 'Hướng chuyên sâu', exact: true })).toBeVisible()

  // Mục lục đổi sang đếm MẠCH (4 mục quét được) thay vì 65 unit liền một dải.
  await expect(page.getByText(/Mục lục \d+ mạch/).first()).toBeVisible()
})

test('bậc P3: không chia mạch thì giữ nguyên danh sách phẳng như trước', async ({ page }) => {
  test.setTimeout(120_000)
  await mockLogin(page, 'vi', 'dark-blue')
  await page.goto('/goc-hoc-tap/programming/bac/p3', { waitUntil: 'domcontentloaded' })

  // Nhãn nhóm MẶC ĐỊNH tuyệt đối không được rò ra ở bậc không chia mạch — nếu rò thì P1–P5
  // sẽ hiện một tiêu đề "Hướng chuyên sâu" hoàn toàn sai ngữ cảnh.
  await expect(page.getByRole('heading', { name: 'Hướng chuyên sâu', exact: true })).toHaveCount(0)
  await expect(page.getByText(/Mục lục \d+ unit/).first()).toBeVisible()
})

test('bài DOM: vòng lặp vô hạn khi CHẤM bị ngắt, trang không treo', async ({ page }) => {
  test.setTimeout(120_000)
  await mockLogin(page, 'vi', 'dark-blue')
  await page.goto('/goc-hoc-tap/programming/bai-hoc/p3-u6-l2', { waitUntil: 'domcontentloaded' })

  await page.getByRole('button', { name: 'Tự viết' }).click()
  await page.getByRole('textbox').first().fill('while (true) {}')
  await page.getByRole('button', { name: 'Chấm bài' }).click()
  await expect(page.getByText(/quá 5 giây nên đã bị dừng/)).toBeVisible({ timeout: 60_000 })
  // Trang còn phản hồi.
  await page.getByRole('button', { name: 'Về nhà' }).click()
})

// PR-L10 — THẺ SRS (bước ⑧ của khuôn bài học). Ba thứ cần chốt trong trình duyệt thật:
// thẻ chỉ vào vòng ôn khi ĐẠT bài, màn ôn bắt nghĩ trước khi lật đáp án, và chấm xong thì
// thẻ rời hàng đợi. Kho thẻ dựng từ chính nội dung bài học nên không cần cố định id bài.
test('thẻ SRS: đạt bài xong thì trang ôn có thẻ, lật đáp án rồi chấm được', async ({ page }) => {
  test.setTimeout(120_000)
  await mockLogin(page, 'vi', 'dark-blue')

  // Chưa học gì → không có thẻ nào tới hạn.
  await page.goto('/goc-hoc-tap/programming/on-tap', { waitUntil: 'domcontentloaded' })
  await expect(page.getByText('Hôm nay không có thẻ nào tới hạn')).toBeVisible({ timeout: 30_000 })

  // Đạt một bài (bài Git chạy nhanh, không cần tải Pyodide) → thẻ của bài vào vòng ôn.
  await page.goto('/goc-hoc-tap/programming/bai-hoc/p3-u10-l1', { waitUntil: 'domcontentloaded' })
  await page.getByRole('button', { name: 'Tự viết' }).click()
  await page.getByRole('button', { name: 'Xem code mẫu' }).click()
  await page.getByRole('button', { name: 'Chấm bài' }).click()
  await expect(page.getByText('Đạt toàn bộ test!')).toBeVisible({ timeout: 60_000 })

  // Thẻ mới hẹn lần ôn đầu sau vài giờ (NEW_CARD_DELAY_MS) — đẩy đồng hồ trình duyệt tới
  // tương lai để thấy chúng tới hạn, thay vì chờ thật.
  await page.clock.install()
  await page.clock.fastForward('30:00:00')
  await page.goto('/goc-hoc-tap/programming/on-tap', { waitUntil: 'domcontentloaded' })

  // Đáp án PHẢI ẩn cho tới khi bấm — bắt nghĩ trước là toàn bộ giá trị của thẻ.
  const xemDapAn = page.getByRole('button', { name: 'Xem đáp án' })
  await expect(xemDapAn).toBeVisible({ timeout: 30_000 })
  await expect(page.getByRole('button', { name: 'Nhớ được' })).toHaveCount(0)

  await xemDapAn.click()
  await page.getByRole('button', { name: 'Nhớ được' }).click()
  // Chấm xong: hoặc sang thẻ kế tiếp, hoặc hết phiên — cả hai đều KHÔNG còn nút cũ ở trạng
  // thái đã lật, nên nút "Xem đáp án" quay lại (thẻ mới) hoặc biến mất (hết thẻ).
  await expect(page.getByRole('button', { name: 'Nhớ được' })).toHaveCount(0)
})

// PR-L11 — MILESTONE chặng P3 (p3-u12-l1): bài tổng kết ráp DOM + sự kiện + gom nhóm dữ liệu.
// Đề độc lập với dự án trục (sổ chi tiêu, không phải cửa hàng) nên đây là phép thử "tự ráp
// được từ đầu" — chạy code mẫu thật trong Chromium để chắc bài giải được như cổng CI nói.
test('bài milestone P3 p3-u12-l1: code mẫu đạt hết test-case trong trình duyệt', async ({
  page,
}) => {
  test.setTimeout(120_000)
  await mockLogin(page, 'vi', 'dark-blue')
  await page.goto('/goc-hoc-tap/programming/bai-hoc/p3-u12-l1', { waitUntil: 'domcontentloaded' })

  await page.getByRole('button', { name: 'Tự viết' }).click()
  await page.getByRole('button', { name: 'Xem code mẫu' }).click()
  await page.getByRole('button', { name: 'Chấm bài' }).click()
  await expect(page.getByText('Đạt toàn bộ test!')).toBeVisible({ timeout: 60_000 })
})

// PR-L13 — LÀN PYTEST của bậc P4. Đây là làn đầu tiên dựa vào việc GHI MODULE vào workspace
// Pyodide trước khi chạy (pytest.py + dhcb_pytest.py, xem pyLanes.ts): cổng CI chạy python3
// trong một thư mục thật, còn trình duyệt dùng hệ thống file trong bộ nhớ — hai đường khác
// hẳn nhau, nên phải chạy thật trong Chromium mới biết học viên có làm được không.
//
// Chọn p4-u6-l1 vì nó là bài khắt khe nhất của làn: đề yêu cầu báo cáo có ĐÚNG MỘT test đỏ
// ("3 passed, 1 failed"), nên bài chỉ đạt khi bộ chạy rút gọn hoạt động đúng cả nhánh PASSED
// lẫn nhánh FAILED — chạy sai một nhánh là rớt ngay.
test('bài pytest p4-u6-l1: bộ chạy rút gọn hoạt động thật trong Pyodide', async ({ page }) => {
  test.setTimeout(180_000)
  await mockLogin(page, 'vi', 'dark-blue')
  await page.goto('/goc-hoc-tap/programming/bai-hoc/p4-u6-l1', { waitUntil: 'domcontentloaded' })

  await page.getByRole('button', { name: 'Tự viết' }).click()
  await page.getByRole('button', { name: 'Xem code mẫu' }).click()
  await page.getByRole('button', { name: 'Chấm bài' }).click()
  await expect(page.getByText('Đạt toàn bộ test!')).toBeVisible({ timeout: 120_000 })
})

// PR-L15 — LÀN APISIM. Khác làn pytest ở một điểm hạ tầng: module được ghi vào workspace nằm
// trong THƯ MỤC CON (fastapi/__init__.py + fastapi/testclient.py, để `from fastapi.testclient
// import TestClient` gõ đúng như FastAPI thật). Hệ thống file trong bộ nhớ của Pyodide không
// tự tạo thư mục cha, nên đường này phải được chứng minh trong trình duyệt thật.
test('bài apisim p4-u8-l1: gói fastapi giả lập nạp được trong Pyodide', async ({ page }) => {
  test.setTimeout(180_000)
  await mockLogin(page, 'vi', 'dark-blue')
  await page.goto('/goc-hoc-tap/programming/bai-hoc/p4-u8-l1', { waitUntil: 'domcontentloaded' })

  await page.getByRole('button', { name: 'Tự viết' }).click()
  await page.getByRole('button', { name: 'Xem code mẫu' }).click()
  await page.getByRole('button', { name: 'Chấm bài' }).click()
  await expect(page.getByText('Đạt toàn bộ test!')).toBeVisible({ timeout: 120_000 })
})

// Cổng chặn V2 tái phát (PR-UX1, tiêu chí A6 của đặc tả UI/UX). Trước PR này trang bài học
// ghi cứng `nav('/goc-hoc-tap/programming/bac/p1')`, nên học xong một bài P3/P4/P5 rồi bấm Quay lại là rơi về
// bậc P1 — sai bậc, mất chỗ đang học. Test đi từ một bài KHÔNG thuộc P1 để bắt đúng lỗi đó.
test('quay lại từ bài học về ĐÚNG bậc của bài, không phải P1', async ({ page }) => {
  await mockLogin(page, 'vi', 'dark-blue')
  await page.goto('/goc-hoc-tap/programming/bai-hoc/p3-u10-l1', { waitUntil: 'domcontentloaded' })

  // Huy hiệu ngôn ngữ của bài hiện ngay đầu trang (PR-UX1, vá V7). Bài Git chạy trên bộ mô
  // phỏng nên phải tự khai điều đó.
  //
  // Trên dev server NGUỘI, expect đầu tiên sau `goto` phải chờ Vite dịch lần đầu chunk trang
  // bài học + component mô phỏng — đo thật (`playwright.config.cold.ts` tạm, cổng riêng,
  // `reuseExistingServer: false`, 2026-09-16, 1 worker): ~3,0s một mình, đã ~60% ngưỡng mặc
  // định 5000ms; chạy song song với spec khác (CPU tranh chấp) thì giãn thêm và có thể vượt
  // ngưỡng — đúng khuôn "chạy riêng xanh, chạy song song đỏ" đã báo. Nới đúng expect này.
  await expect(page.getByText('· mô phỏng').first()).toBeVisible({ timeout: 30_000 })

  // [2026-09-17] Nhãn nút Back nay lấy đúng đốt cha thật (`Layout.tsx` — `backLabel`) thay vì
  // chữ cứng "Trang chủ" (vốn sai: nút này không hề về Trang chủ). Với bài p3-u10-l1, đốt cha
  // là tên bậc P3 trong `curriculum.ts` ("Làm được việc thật").
  await page.getByRole('button', { name: 'Làm được việc thật' }).click()
  // [S07-2] Lối về nay dựng bằng `duongDanBac` nên là URL CHUẨN `<mã>--<tên đã slug hoá>`,
  // thay cho chuỗi ghép tay `/goc-hoc-tap/programming/bac/p3` (URL cũ vẫn vào được, nhưng bị chuyển hướng ngay
  // — dẫn thẳng tới URL chuẩn thì bớt một lượt điều hướng). Điều cần canh vẫn y nguyên: đúng
  // BẬC P3, không rơi về P1.
  await expect(page).toHaveURL(/\/goc-hoc-tap\/programming\/bac\/p3(--[a-z0-9-]+)?$/)
})
