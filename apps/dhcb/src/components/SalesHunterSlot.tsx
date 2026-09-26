import { Component } from 'react'
import { showSalesHunterEntry } from '../lib/salesHunter'
import SalesHunterEntry from './SalesHunterEntry'

/**
 * A failed optional Sales render must never unmount the Learning/Companion application.
 * Không tải lười riêng: khối chỉ ~50 dòng và đã nằm trong chunk lười của trang chủ; thêm một
 * `lazy()` nữa làm lệch nhịp render của Home (test Home đỏ ngẫu nhiên) mà không lợi gì.
 */
export default class SalesHunterSlot extends Component<Record<string, never>, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    if (this.state.failed || !showSalesHunterEntry(window.location.hostname)) return null
    return <SalesHunterEntry />
  }
}
