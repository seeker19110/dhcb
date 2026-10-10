import { describe, expect, it } from 'vitest'
import { fnv1a32, mulberry32 } from './seededRandom'

// Bản chép tay CŨ (trước đợt E4) — giữ làm đối chứng: đầu ra mới phải trùng từng bit.
function fnvCuKhongDau(text: string): number {
  let hash = 0x811c9dc5
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193) >>> 0
  }
  return hash
}
function fnvCuCoDau(seed: string): number {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h
}
function mulberryCu(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const CHUOI = ['', 'a', 'web-s2', 'Tiếng Việt có dấu', 'p1-l3-parsons', '😀 emoji', 'x'.repeat(500)]

describe('fnv1a32', () => {
  it('trùng bản cũ (mọi biến thể: >>>0 từng bước / chỉ cuối / giữ số có dấu)', () => {
    for (const s of CHUOI) {
      expect(fnv1a32(s)).toBe(fnvCuKhongDau(s))
      expect(fnv1a32(s)).toBe(fnvCuCoDau(s) >>> 0)
    }
  })

  it('giá trị chuẩn FNV-1a 32-bit (vector công bố)', () => {
    expect(fnv1a32('')).toBe(0x811c9dc5)
    expect(fnv1a32('a')).toBe(0xe40c292c)
    expect(fnv1a32('foobar')).toBe(0xbf9cf968)
  })

  it('luôn là số nguyên không dấu 32-bit', () => {
    for (const s of CHUOI) {
      const h = fnv1a32(s)
      expect(Number.isInteger(h) && h >= 0 && h <= 0xffffffff).toBe(true)
    }
  })
})

describe('mulberry32', () => {
  it('trùng bản cũ 1.000 số đầu với nhiều seed', () => {
    for (const seed of [0, 1, 0x5eed1234, 0xffffffff, -1, fnv1a32('dialogue')]) {
      const moi = mulberry32(seed)
      const cu = mulberryCu(seed)
      for (let i = 0; i < 1000; i++) expect(moi()).toBe(cu())
    }
  })

  it('số sinh ra nằm trong [0, 1)', () => {
    const rng = mulberry32(42)
    for (let i = 0; i < 1000; i++) {
      const x = rng()
      expect(x >= 0 && x < 1).toBe(true)
    }
  })
})
