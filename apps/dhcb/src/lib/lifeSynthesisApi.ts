// apps/dhcb/src/lib/lifeSynthesisApi.ts — gọi `GET /api/life-synthesis` ("Tổng hợp 30 ngày").
//
// Phản hồi được PARSE qua đúng hợp đồng Zod của server: lệch hình dạng là LỖI (khối lỗi + Thử
// lại), không bao giờ là một báo cáo nửa vời với số mặc định (CLAUDE.md mục 4.1 + 4.3).
// Đặc tả: docs/specs/2026-10-09-tong-hop-da-mien-du-lieu-that.md.
import { getAuthHeader } from '@core/authHeader'
import {
  LifeSynthesisResponseSchema,
  type LifeSynthesisReport,
} from '@dhcb/core-contracts/lifeSynthesis'

export const LIFE_SYNTHESIS_ENDPOINT = '/api/life-synthesis'

export async function fetchLifeSynthesisReport(): Promise<LifeSynthesisReport> {
  const res = await fetch(LIFE_SYNTHESIS_ENDPOINT, { headers: { ...getAuthHeader() } })
  if (!res.ok) {
    throw new Error(`Lỗi tải bản tổng hợp: ${res.status}`)
  }
  const parsed = LifeSynthesisResponseSchema.safeParse(await res.json())
  if (!parsed.success) {
    throw new Error('Bản tổng hợp trả về sai định dạng — thử lại sau ít phút.')
  }
  return parsed.data.report
}
