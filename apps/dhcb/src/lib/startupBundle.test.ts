// Canh ĐƯỜNG KHỞI ĐỘNG không kéo lại zod bản đầy đủ / dữ liệu nặng (changelog 0580, 2026-10-10).
//
// Vì sao cần test ở mức MÃ NGUỒN: `.size-limit.json` chỉ đo 4 glob (index + 3 vendor), còn các
// chunk `modulepreload` khác (`storage`, `appSettings`…) và chunk tách riêng như `vendor-zod`
// thì KHÔNG đếm. Đợt 0580 đã dính đúng bẫy đó: tách zod sang `vendor-zod` làm size-limit báo
// giảm 15 kB, trong khi `appSettings`/`cloud` vẫn kéo `vendor-zod` vào `<link rel=modulepreload>`
// — trình duyệt vẫn tải như cũ. Chỉ phát hiện được khi mở bản build bằng trình duyệt thật.
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const ROOT = resolve(__dirname, '../../../..')
const read = (rel: string) => readFileSync(resolve(ROOT, rel), 'utf8')

/** Module nằm trong entry hoặc chunk `modulepreload` — chỉ được dùng `zod/mini`, không `zod`. */
const STARTUP_ZOD_MINI_ONLY = [
  'packages/core-ui/clientAuth.ts',
  'packages/core-contracts/appSettings.ts',
  'apps/dhcb/src/lib/cloud.ts',
] as const

/** Module nhẹ tách riêng cho đường khởi động — không được import zod dưới bất kỳ dạng nào. */
const STARTUP_NO_ZOD = [
  'apps/dhcb/src/lib/storageKeyPrefixes.ts',
  'apps/dhcb/src/lib/guestProgressKeys.ts',
  'apps/dhcb/src/lib/guestActivity.ts',
] as const

const FULL_ZOD_IMPORT = /from\s+['"]zod['"]/
const ANY_ZOD_IMPORT = /from\s+['"]zod(\/[^'"]*)?['"]/

describe('đường khởi động không kéo zod bản đầy đủ', () => {
  it.each(STARTUP_ZOD_MINI_ONLY)('%s chỉ import zod/mini', (file) => {
    const src = read(file)
    expect(src).not.toMatch(FULL_ZOD_IMPORT)
    expect(src).toMatch(/from\s+['"]zod\/mini['"]/)
  })

  it.each(STARTUP_NO_ZOD)('%s không import zod', (file) => {
    expect(read(file)).not.toMatch(ANY_ZOD_IMPORT)
  })

  it('App.tsx và AuthProvider chỉ nạp ĐỘNG learningSession / guestProgress', () => {
    const staticHeavy = /^import\s[^;]*from\s+['"][./]*(lib\/)?(learningSession|guestProgress)['"]/m
    expect(read('apps/dhcb/src/App.tsx')).not.toMatch(staticHeavy)
    expect(read('apps/dhcb/src/context/AuthProvider.tsx')).not.toMatch(staticHeavy)
  })

  it('Placement.tsx không import GIÁ TRỊ từ data/cefr (~4,4 MB JSON) — chỉ qua cefrLoader', () => {
    expect(read('apps/dhcb/src/pages/subjects/english/Placement.tsx')).not.toMatch(
      /from\s+['"][./]+data\/cefr['"]/,
    )
  })
})
