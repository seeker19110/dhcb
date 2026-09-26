/** Sales is a separate application, never a Learning permission or billing grant. */
export const SALES_HUNTER_URL = 'https://sales.donghanhcungban.org' as const

export function showSalesHunterEntry(hostname: string): boolean {
  return ['donghanhcungban.org', 'www.donghanhcungban.org', 'localhost', '127.0.0.1'].includes(
    hostname,
  )
}

export function salesHunterLaunchUrl(flag: unknown): string | null {
  return flag === 'true' ? SALES_HUNTER_URL : null
}
