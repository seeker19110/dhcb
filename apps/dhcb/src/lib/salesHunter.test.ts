import { describe, expect, it } from 'vitest'
import { SALES_HUNTER_URL, salesHunterLaunchUrl, showSalesHunterEntry } from './salesHunter'

describe('Sales-Hunter platform boundary', () => {
  it('does not expose a launch URL without the exact enable flag', () => {
    for (const flag of [undefined, null, false, true, '', 'false', 'TRUE', '1']) {
      expect(salesHunterLaunchUrl(flag)).toBeNull()
    }
    expect(salesHunterLaunchUrl('true')).toBe(SALES_HUNTER_URL)
  })

  it('uses a fixed HTTPS destination with no identity query or fragment', () => {
    const url = new URL(SALES_HUNTER_URL)
    expect(url.origin).toBe('https://sales.donghanhcungban.org')
    expect(url.search).toBe('')
    expect(url.hash).toBe('')
    expect(url.username).toBe('')
    expect(url.password).toBe('')
  })

  it('keeps the entry off Learning and unrelated hosts', () => {
    for (const host of ['en-vi.donghanhcungban.org', 'sales.donghanhcungban.org', 'evil.example']) {
      expect(showSalesHunterEntry(host)).toBe(false)
    }
    expect(showSalesHunterEntry('donghanhcungban.org')).toBe(true)
    expect(showSalesHunterEntry('www.donghanhcungban.org')).toBe(true)
    expect(showSalesHunterEntry('localhost')).toBe(true)
  })
})
