import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { mockLogin, USER_ID } from './helpers/auth'
import { freezeAnimations } from './helpers/axe'

const ATTEMPT_ID = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
for (const theme of ['dark-blue', 'blue-sky', 'kid'] as const) {
  for (const width of [1440, 390]) {
    test(`CEFR ${theme} ${width}px: máy chủ chấm bài, lỗi nộp được thử lại cùng đáp án`, async ({
      page,
    }, testInfo) => {
      await page.setViewportSize({ width, height: 900 })
      await mockLogin(page, 'vi', theme)
      // Lịch sử cục bộ chỉ mở CTA thi lại; quyền/điểm mới phải đến từ API chấm thi.
      await page.addInitScript((uid) => {
        localStorage.setItem(
          `et_cefr_exams_${uid}`,
          JSON.stringify({
            A1: { passed: true, bestPct: 70, attempts: 1, lastAt: '2026-09-01T00:00:00Z' },
          }),
        )
      }, USER_ID)
      const submissions: unknown[] = []
      const starts: unknown[] = []
      await page.route('**/api/cefr-assessment', async (route) => {
        const body = route.request().postDataJSON() as { action?: string }
        if (body.action === 'start') {
          starts.push(body)
          return route.fulfill({
            json: {
              attemptId: ATTEMPT_ID,
              expiresAt: Date.now() + 60_000,
              questions: [
                {
                  key: 'audit-vocab',
                  part: 'vocab',
                  promptKind: 'text',
                  prompt: 'Xin chào',
                  options: ['hello', 'goodbye'],
                },
                {
                  key: 'audit-grammar',
                  part: 'grammar',
                  promptKind: 'text',
                  prompt: 'I ___ a learner.',
                  options: ['am', 'are'],
                },
              ],
            },
          })
        }
        submissions.push(body)
        if (submissions.length === 1)
          return route.fulfill({
            status: 503,
            json: { error: 'Chưa lưu được bài thi. Vui lòng nộp lại.' },
          })
        return route.fulfill({
          json: {
            pct: 100,
            passed: true,
            correct: 2,
            total: 2,
            correctAnswers: ['hello', 'am'],
            result: { passed: true, bestPct: 100, attempts: 2, lastAt: '2026-09-27T00:00:00Z' },
            cefrUnlocked: ['A1', 'A2'],
          },
        })
      })
      await page.route('**/api/quests', (route) =>
        route.fulfill({ json: { ok: true, rewardDays: 3 } }),
      )
      await page.goto('/goc-hoc-tap/english/lo-trinh/a1', { waitUntil: 'domcontentloaded' })
      await page.getByRole('button', { name: /Đã qua cấp A1/ }).click({ timeout: 60_000 })
      await expect(page.getByRole('heading', { name: /Xin chào/ })).toBeVisible()
      expect(starts).toContainEqual({ action: 'start', level: 'A1', isA: true })
      await freezeAnimations(page)
      await page.screenshot({
        path: testInfo.outputPath(`cefr-question-${width}.png`),
        fullPage: true,
      })
      await page.getByRole('button', { name: 'hello', exact: true }).click()
      await expect(page.getByText('Đã chọn: hello.', { exact: true }).first()).toBeVisible()
      await expect(page.getByText(/Đáp án đúng:|Chưa đúng\.|^Đúng\./)).toHaveCount(0)
      await page.getByRole('button', { name: 'Câu tiếp theo', exact: true }).click()
      await page.getByRole('button', { name: 'am', exact: true }).click()
      await page.getByRole('button', { name: 'Nộp bài', exact: true }).click()
      await expect(page.getByRole('alert')).toContainText('Chưa lưu được bài thi')
      await expect(page.getByText(/Bạn đã QUA cấp A1/)).toHaveCount(0)
      await page.getByRole('button', { name: 'Nộp lại bài', exact: true }).click()
      await expect(page.getByRole('heading', { name: '2/2 · 100%', exact: true })).toBeVisible()
      await expect(page.getByText(/Bạn đã QUA cấp A1/)).toBeVisible()
      expect(submissions).toEqual([
        { action: 'submit', attemptId: ATTEMPT_ID, answers: ['hello', 'am'] },
        { action: 'submit', attemptId: ATTEMPT_ID, answers: ['hello', 'am'] },
      ])
      await page.screenshot({
        path: testInfo.outputPath(`cefr-result-${theme}-${width}.png`),
        fullPage: true,
      })
      const { violations } = await new AxeBuilder({ page })
        .include('main')
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag2aaa'])
        .analyze()
      expect(
        violations.map(({ id, nodes }) => ({
          id,
          nodes: nodes.map(({ html, failureSummary }) => ({ html, failureSummary })),
        })),
      ).toEqual([])
    })
  }
}
