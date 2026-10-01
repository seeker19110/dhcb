// scripts/ocr-rules-policy.test.ts — Chốt chặn cho bộ luật review `.opencodereview/rule.json`.
//
// VÌ SAO CẦN: OpenCodeReview (ADR-0012) chọn luật theo kiểu "khớp ĐẦU TIÊN thắng". Một luật
// bắt-tất-cả `**/*` đặt lên trên sẽ nuốt mọi luật riêng (validateAuth, migration lũy đẳng…)
// mà không báo lỗi gì — review vẫn chạy, chỉ là chạy với luật sai. Hỏng im lặng.
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'

const ruleFileSchema = z.object({
  include: z.array(z.string()).optional(),
  exclude: z.array(z.string()).optional(),
  rules: z
    .array(
      z.object({
        path: z.string().min(1),
        rule: z.string().min(1),
        merge_system_rule: z.boolean().optional(),
      }),
    )
    .min(1),
})

const ruleFile = ruleFileSchema.parse(
  JSON.parse(readFileSync(resolve(process.cwd(), '.opencodereview/rule.json'), 'utf8')),
)

describe('.opencodereview/rule.json', () => {
  it('luật bắt-tất-cả `**/*` chỉ được đứng CUỐI', () => {
    const catchAll = ruleFile.rules.findIndex((r) => r.path === '**/*')
    expect(catchAll).toBe(ruleFile.rules.length - 1)
  })

  it('mọi luật đều GỘP với luật hệ thống theo ngôn ngữ, không thay thế', () => {
    for (const r of ruleFile.rules) expect(r.merge_system_rule, r.path).toBe(true)
  })

  it('không có hai luật trùng đường dẫn (luật sau sẽ không bao giờ được dùng)', () => {
    const paths = ruleFile.rules.map((r) => r.path)
    expect(new Set(paths).size).toBe(paths.length)
  })

  it('luật handler API còn đòi validateAuth + user_id từ token', () => {
    const api = ruleFile.rules.find((r) => r.path.startsWith('apps/server/src/api/'))
    expect(api?.rule).toMatch(/validateAuth\(\)/)
    expect(api?.rule).toMatch(/user_id/)
  })
})
