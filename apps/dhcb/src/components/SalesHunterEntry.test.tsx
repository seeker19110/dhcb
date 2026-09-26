import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import SalesHunterEntry from './SalesHunterEntry'

describe('SalesHunterEntry', () => {
  it('renders an honest unavailable state with no launch link by default', () => {
    const html = renderToStaticMarkup(
      <SalesHunterEntry hostname="donghanhcungban.org" enabled="false" />,
    )
    expect(html).toContain('Chưa mở truy cập')
    expect(html).not.toContain('href=')
    expect(html).toContain('<summary')
  })

  it('launches only the independent Sales origin without a referrer', () => {
    const html = renderToStaticMarkup(
      <SalesHunterEntry hostname="donghanhcungban.org" enabled="true" />,
    )
    expect(html).toContain('href="https://sales.donghanhcungban.org"')
    expect(html).toContain('target="_blank"')
    expect(html).toContain('rel="noopener noreferrer"')
    expect(html.toLowerCase()).toContain('referrerpolicy="no-referrer"')
    expect(html).not.toContain('<iframe')
  })

  it('does not appear on Learning even when the flag is enabled', () => {
    const html = renderToStaticMarkup(
      <SalesHunterEntry hostname="en-vi.donghanhcungban.org" enabled="true" />,
    )
    expect(html).toBe('')
  })
})
