import { test, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import type { AxeResults } from 'axe-core'
import { freezeAnimations, waitForStableDom } from './axe'
import {
  AAA_RULE_IDS,
  classifyAaaTarget,
  collectAaaFindings,
  type AaaResolution,
} from './aaaFindings'
import {
  isGradientIncomplete,
  measureGradientContrast,
  type GradientContrast,
} from './gradientContrast'

// Quét a11y GIỚI HẠN trong một vùng (một thẻ) — cho các trạng thái SAU TƯƠNG TÁC mà vòng quét theo
// trang của e2e/a11y.spec.ts + e2e/a11y-aaa.spec.ts không bao giờ thấy (changelog 0544).
// Luật GIỐNG HỆT hai cổng kia: AA = cùng bộ tag axe, 0 vi phạm mọi mức tác động; AAA = cùng bộ
// rule `AAA_RULE_IDS` + cùng bộ phân loại/kết luận `collectAaaFindings` (chữ đọc ≥ 7:1, điều khiển
// ≥ AA, "incomplete" chưa kết luận được là LỖI — không bao giờ tự thành pass).
//
// Bổ sung DUY NHẤT so với `scanAaa`: chữ trên nền GRADIENT (axe bỏ ngỏ `bgGradient`) được đo lại
// bằng điểm dừng màu TỆ NHẤT (helpers/gradientContrast.ts) — đạt ngưỡng mới gỡ, rớt thì thành vi
// phạm có số đo, đo không chắc thì giữ nguyên lỗi "incomplete". Các thẻ Companion dùng gradient
// nhiều; không có bước này cổng sẽ đỏ vĩnh viễn vì "không đo được" chứ không vì tương phản thật.

/** Đúng bộ tag của `scan()` trong e2e/a11y.spec.ts. */
export const AA_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']

/** Thuộc tính đánh dấu gốc vùng quét (gỡ khi xong để lần quét sau không trúng vùng cũ). */
export const SCAN_ROOT_ATTR = 'data-a11y-scan-root'
const SCAN_ROOT = `[${SCAN_ROOT_ATTR}]`

const fmtAa = (v: AxeResults['violations'][number]) => {
  const first = v.nodes[0]?.target
  const sel = Array.isArray(first) ? first.join(' ') : String(first ?? '?')
  return `${v.id} (${v.impact}, ${v.nodes.length} phần tử, đầu tiên: ${sel})`
}

/** A/AA trong vùng đã đánh dấu — trả danh sách vi phạm (rỗng = đạt). */
export async function scanScopedAa(page: Page): Promise<string[]> {
  await freezeAnimations(page)
  const { violations } = await new AxeBuilder({ page })
    .include(SCAN_ROOT)
    .withTags(AA_TAGS)
    .analyze()
  return violations.map(fmtAa)
}

/**
 * AAA (nội dung + tiêu đề) trong vùng đã đánh dấu. Bắt buộc snapshot ỔN ĐỊNH: DOM đổi trong lúc
 * quét thì báo "unresolved" thay vì kết luận — cùng nguyên tắc fail-closed của `scanAaa` ở
 * e2e/a11y-aaa.spec.ts.
 */
export async function scanScopedAaa(page: Page, label: string): Promise<string[]> {
  await freezeAnimations(page)
  await waitForStableDom(page)
  const watcher = await page.evaluateHandle(() => {
    let mutations = 0
    const observer = new MutationObserver((records) => {
      mutations += records.length
    })
    observer.observe(document.documentElement, {
      subtree: true,
      childList: true,
      attributes: true,
      characterData: true,
    })
    return {
      stop: () => {
        mutations += observer.takeRecords().length
        observer.disconnect()
        return mutations
      },
    }
  })
  try {
    const results = await new AxeBuilder({ page })
      .include(SCAN_ROOT)
      .withRules(AAA_RULE_IDS)
      .analyze()
    const resolutions: AaaResolution[] = []
    let findings = await collectAaaFindings(page, results, {
      passes: results.passes,
      snapshotStable: true,
      resolutions,
    })
    const gradients: { target: string; rule: string; measurement: GradientContrast }[] = []
    for (const rule of results.incomplete) {
      if (rule.id !== 'color-contrast' && rule.id !== 'color-contrast-enhanced') continue
      for (const node of rule.nodes) {
        if (!isGradientIncomplete(node)) continue
        const key = JSON.stringify(node.target)
        const prefix = `incomplete: ${rule.id} target=${key} (`
        if (!findings.some((finding) => finding.startsWith(prefix))) continue
        const classification = await classifyAaaTarget(page, node.target)
        if (classification !== 'content' && classification !== 'chrome') continue
        const measurement = await measureGradientContrast(page, node.target)
        gradients.push({ target: key, rule: rule.id, measurement })
        if (measurement.status !== 'measured') continue
        // Ngưỡng của dự án: chữ đọc 7:1 (kể cả chữ lớn), điều khiển 4,5:1 (AA chữ thường).
        const required = classification === 'content' ? 7 : 4.5
        findings = findings.filter((finding) => !finding.startsWith(prefix))
        if (measurement.ratio < required)
          findings.push(
            `violation: gradient-worst-stop target=${key} (${classification}) ratio=${measurement.ratio} ` +
              `< ${required} chữ=${measurement.foreground} nền=${measurement.background}`,
          )
      }
    }
    const mutations = await watcher.evaluate((state) => state.stop())
    if (mutations > 0) {
      resolutions.length = 0
      findings = await collectAaaFindings(page, results)
      findings.push(`unresolved: DOM changed during scan (${mutations} mutations)`)
    }
    await test.info().attach(`axe-aaa-${label}`, {
      body: JSON.stringify({
        url: page.url(),
        mutations,
        violations: results.violations,
        incomplete: results.incomplete,
        resolutions,
        gradients,
      }),
      contentType: 'application/json',
    })
    return [...new Set(findings)]
  } finally {
    await watcher.dispose()
  }
}
