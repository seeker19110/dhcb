// mulberry32.ts — Bộ sinh số giả ngẫu nhiên CÓ SEED (tất định), bản DUY NHẤT trong repo.
//
// Đặt ở gói lá `core-grading` (không phụ thuộc gói nào) vì chính bộ chấm biểu thức cần nó, mà
// `core-contracts` đã phụ thuộc `core-grading` — để ở `core-contracts` sẽ thành vòng tham chiếu.
// Nơi khác dùng qua `@dhcb/core-contracts/seededRandom` (re-export kèm `fnv1a32`).

/** Trả hàm sinh số thực trong [0, 1), tất định theo `seed`. Không dùng cho mật mã. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
