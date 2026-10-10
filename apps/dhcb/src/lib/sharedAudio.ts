// Thẻ <audio> DUY NHẤT dùng chung cho mọi lần phát + mở khoá iOS.
// Tách khỏi ./tts.ts (audit 2026-10-10, đợt E4): main.tsx gọi unlockAudio() ở cú chạm đầu tiên,
// nếu import từ ./tts thì cả module TTS (~31 KB nguồn) + voiceTiers + audioCache bị kéo vào
// bundle khởi động của MỌI trang. Module này cố ý không import gì.
//
// iOS/Safari (kể cả khi cài PWA) chỉ cho JavaScript phát audio trên một thẻ
// <audio> ĐÃ được người dùng "mở khoá" bằng một cú chạm tay. Nếu mỗi câu tạo
// `new Audio()` mới rồi gọi .play() trong chuỗi async (sau khi await tải/giải mã),
// thì sau câu 1–2 hiệu lực của cú chạm tay đã hết → iOS chặn các câu sau (hội
// thoại đứng giữa chừng). Khắc phục: tái dùng MỘT thẻ duy nhất, mở khoá 1 lần
// lúc chạm đầu tiên (unlockAudio), sau đó chỉ đổi .src cho từng câu — thẻ đã mở
// khoá sẽ phát được mãi. Máy tính không có giới hạn này nên trước đây vẫn chạy.
let sharedAudio: HTMLAudioElement | null = null
let audioUnlocked = false

/** Lấy thẻ dùng chung, tạo nếu chưa có. */
export function getSharedAudio(): HTMLAudioElement {
  if (!sharedAudio) {
    sharedAudio = new Audio()
    sharedAudio.preload = 'auto'
  }
  return sharedAudio
}

/** Thẻ dùng chung nếu ĐÃ tạo — không tạo mới (dùng cho pause/stop: chưa phát gì thì không làm gì). */
export function peekSharedAudio(): HTMLAudioElement | null {
  return sharedAudio
}

// WAV im lặng cực ngắn để "mở khoá" thẻ audio trên iOS (tạo 1 lần, dùng lại)
let silentUrl: string | null = null
function getSilentUrl(): string {
  if (silentUrl) return silentUrl
  const numSamples = 8
  const buf = new ArrayBuffer(44 + numSamples)
  const dv = new DataView(buf)
  const writeStr = (off: number, s: string) => {
    for (let i = 0; i < s.length; i++) dv.setUint8(off + i, s.charCodeAt(i))
  }
  writeStr(0, 'RIFF')
  dv.setUint32(4, 36 + numSamples, true)
  writeStr(8, 'WAVE')
  writeStr(12, 'fmt ')
  dv.setUint32(16, 16, true)
  dv.setUint16(20, 1, true) // PCM
  dv.setUint16(22, 1, true) // 1 kênh (mono)
  dv.setUint32(24, 8000, true) // sample rate
  dv.setUint32(28, 8000, true) // byte rate
  dv.setUint16(32, 1, true) // block align
  dv.setUint16(34, 8, true) // 8 bit / mẫu
  writeStr(36, 'data')
  dv.setUint32(40, numSamples, true)
  for (let i = 0; i < numSamples; i++) dv.setUint8(44 + i, 128) // 128 = im lặng (8-bit)
  silentUrl = URL.createObjectURL(new Blob([buf], { type: 'audio/wav' }))
  return silentUrl
}

// Mở khoá audio cho iOS — PHẢI gọi ĐỒNG BỘ bên trong handler của một cú chạm tay
// (onClick/onTouch...), TRƯỚC mọi await. Phát 1 đoạn im lặng để Safari đánh dấu
// thẻ dùng chung là "được người dùng cho phép". Gọi nhiều lần vẫn an toàn (chỉ
// chạy thực sự ở lần đầu).
export function unlockAudio(): void {
  if (audioUnlocked) return
  try {
    const a = getSharedAudio()
    a.src = getSilentUrl()
    const p = a.play()
    if (p && typeof p.then === 'function') {
      p.then(() => {
        a.pause()
        a.currentTime = 0
      }).catch(() => {})
    }
    audioUnlocked = true
  } catch {
    /* sẽ thử lại ở lần phát thật */
  }
}
