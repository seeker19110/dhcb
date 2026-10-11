// CrisisSupportCard.test.tsx — thẻ hỗ trợ khủng hoảng: số điện thoại phải BẤM GỌI được, lời dẫn
// đổi theo loại tình huống, và thẻ nói rõ Bạn Đồng Hành là AI (không gọi thay được).
import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import React from 'react'
import { buildSafetyNotice } from '@dhcb/core-contracts/companionSafety'
import CrisisSupportCard from './CrisisSupportCard'
import { formatPhone } from './formatPhone'

describe('formatPhone', () => {
  it('giãn số 10 chữ số cho dễ đọc, giữ nguyên số ngắn', () => {
    expect(formatPhone('0963061414')).toBe('096 306 1414')
    expect(formatPhone('111')).toBe('111')
  })
})

describe('CrisisSupportCard', () => {
  it('mức concern/self_harm: tiêu đề "không đơn độc", đủ 3 số gọi được qua tel:', () => {
    const html = renderToStaticMarkup(
      React.createElement(CrisisSupportCard, { notice: buildSafetyNotice('concern', 'self_harm') }),
    )
    expect(html).toContain('Bạn không đơn độc')
    expect(html).toContain('href="tel:111"')
    expect(html).toContain('href="tel:115"')
    expect(html).toContain('href="tel:0963061414"')
    expect(html).toContain('096 306 1414')
    expect(html).toContain('là AI và không thể gọi thay bạn')
    expect(html).toContain('aria-label="Hỗ trợ khẩn cấp"')
  })

  it('mức imminent: tiêu đề giục gọi ngay; loại abuse: nói rõ không phải lỗi của bạn', () => {
    const html = renderToStaticMarkup(
      React.createElement(CrisisSupportCard, { notice: buildSafetyNotice('imminent', 'abuse') }),
    )
    expect(html).toContain('Hãy gọi một người thật ngay bây giờ')
    expect(html).toContain('không phải lỗi của bạn')
  })
})
