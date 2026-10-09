// scripts/gen-feature-map.test.ts — test 3 hàm thuần rút dữ liệu cho bản đồ tính năng.

import { readFileSync } from 'node:fs'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

import { buildFeatureMap, extractRoutes, extractApiPaths, groupByPillar } from './gen-feature-map'

describe('extractRoutes', () => {
  it('rút mọi path= và bỏ trùng, sắp xếp', () => {
    const src = '<Route path="/b" /><Route path="/a" /><Route path="/a" />'
    expect(extractRoutes(src)).toEqual(['/a', '/b'])
  })

  it('giải path={`${PREFIX}/x`} và path={PREFIX} bằng hằng đã biết', () => {
    const src = 'path={`${P}/a`} path={P} path={Q()} path={`${LA_AI}/x`}'
    const consts = { scalars: { P: '/p', Q: '/q' }, lists: {} }
    expect(extractRoutes(src, consts)).toEqual(['/p', '/p/a', '/q'])
  })

  it('bung vòng {LIST.map((v) => <Route path={v} />)} theo từng phần tử', () => {
    const src = '{L.map((v) => (<Route path={`${v}/*`} />))}{L.map((v) => (<Route path={v} />))}'
    const consts = { scalars: {}, lists: { L: ['/x', '/y'] } }
    expect(extractRoutes(src, consts)).toEqual(['/x', '/x/*', '/y', '/y/*'])
  })

  it('vòng .map() của mảng không biết → bỏ qua, không văng lỗi', () => {
    expect(extractRoutes('{KHONG_BIET.map((v) => (<Route path={v} />))}')).toEqual([])
  })

  it('nguồn không có route nào → mảng rỗng', () => {
    expect(extractRoutes('export default function App() { return null }')).toEqual([])
  })
})

describe('extractApiPaths', () => {
  it('chỉ lấy chuỗi bắt đầu bằng /api/', () => {
    const src = "gan('/api/chat', h); gan('/health', h); gan('/api/tts', h)"
    expect(extractApiPaths(src)).toEqual(['/api/chat', '/api/tts'])
  })
})

describe('groupByPillar', () => {
  it('gom theo đoạn đầu của đường dẫn', () => {
    const g = groupByPillar(['/hoc/a', '/hoc/b', '/thi/c'])
    expect([...g.keys()]).toEqual(['hoc', 'thi'])
    expect(g.get('hoc')).toEqual(['/hoc/a', '/hoc/b'])
  })

  it('đường dẫn gốc "/" được gom vào nhóm riêng, không làm vỡ hàm', () => {
    expect([...groupByPillar(['/']).keys()]).toEqual(['(gốc)'])
  })
})

describe('docs/FEATURE-MAP.md', () => {
  it('khớp đầu ra bộ sinh — lệch thì chạy: npm run gen:feature-map', async () => {
    const file = readFileSync(path.resolve(import.meta.dirname, '../docs/FEATURE-MAP.md'), 'utf8')
    expect(file).toBe(await buildFeatureMap())
  })
})
