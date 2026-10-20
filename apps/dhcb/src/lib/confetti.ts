// Hiệu ứng confetti CSS thuần — KHÔNG thêm thư viện ngoài.
// File này chỉ được nạp qua import() ĐỘNG (SessionDone.tsx — overlay ăn mừng duy nhất từ
// 2026-09-17, P1-6; `Celebration.tsx` cũ đã xoá ở audit 2026-10-20, F-003) nên nằm ở chunk
// riêng, không tốn ngân sách bundle/CSS đầu trang (style tự tiêm khi chạy).
// Tôn trọng prefers-reduced-motion: không làm gì khi người dùng giảm chuyển động.

const PIECES = 28
const DURATION_MS = 1400

// Màu lấy từ biến theme --a-* + vài màu ngữ nghĩa sẵn có (không hard-code brand).
const COLORS = [
  'rgb(var(--a-400))',
  'rgb(var(--a-500))',
  '#f59e0b', // amber-500
  '#f43f5e', // rose-500
  '#8b5cf6', // violet-500
  '#0ea5e9', // sky-500
]

let styleInjected = false
function injectStyle() {
  if (styleInjected) return
  styleInjected = true
  const style = document.createElement('style')
  style.textContent = `
@keyframes et-confetti-fall {
  0% { transform: translate(0, 0) rotate(0deg); opacity: 1; }
  100% { transform: translate(var(--dx), 72vh) rotate(var(--rot)); opacity: 0; }
}
.et-confetti { position: absolute; top: -3vh; width: 8px; height: 12px; border-radius: 2px;
  animation: et-confetti-fall ${DURATION_MS}ms ease-in both; pointer-events: none; }
`
  document.head.appendChild(style)
}

// Bắn confetti vào container (thường là overlay ăn mừng). Tự dọn sau khi rơi xong.
export function burst(container: HTMLElement) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  injectStyle()
  const frag = document.createDocumentFragment()
  const pieces: HTMLSpanElement[] = []
  for (let i = 0; i < PIECES; i++) {
    const p = document.createElement('span')
    p.className = 'et-confetti'
    p.style.left = `${Math.random() * 100}%`
    p.style.background = COLORS[i % COLORS.length] ?? COLORS[0]!
    p.style.setProperty('--dx', `${(Math.random() - 0.5) * 160}px`)
    p.style.setProperty('--rot', `${(Math.random() - 0.5) * 720}deg`)
    p.style.animationDelay = `${Math.random() * 250}ms`
    p.setAttribute('aria-hidden', 'true')
    pieces.push(p)
    frag.appendChild(p)
  }
  container.appendChild(frag)
  window.setTimeout(() => {
    for (const p of pieces) p.remove()
  }, DURATION_MS + 400)
}
