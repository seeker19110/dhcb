// scripts/eleven-tone-sample.ts
// NGHE THỬ giọng điệu ElevenLabs trước khi seed lớn (`seed:all -- --eleven`): mỗi giọng điệu × (1 câu
// tiếng Anh + 1 câu tiếng Việt) → file mp3 trong thư mục tạm, kèm báo cáo. Tốn khoảng 400 credit.
//
// Vì sao cần: thẻ cảm xúc ([calm]/[cheerful]/[excited]) trên eleven_v4 chưa kiểm định với tiếng
// Việt. Nếu model KHÔNG hiểu thẻ, nó sẽ đọc thẳng chữ "calm" thành tiếng — thành hàng nghìn audio
// hỏng. Nghe 8 file này trước khi tiêu hàng triệu credit.
//
// Chạy:  npm run eleven:tone-sample                      (giọng Alice)
//        npm run eleven:tone-sample -- --voice=Eric --out=/duong/dan/thu-muc

import * as dotenv from 'dotenv'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  ELEVEN_TONES,
  ELEVEN_VOICE_IDS,
  elevenBilledChars,
  generateAudioFromElevenLabs,
  hasElevenLabsKey,
  isValidElevenVoice,
} from '@dhcb/core-ai/elevenLabsTts'

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '.env') })

const arg = (name: string): string | undefined =>
  process.argv.find((a) => a.startsWith(`--${name}=`))?.split('=')[1]

const SAMPLES = [
  { lang: 'en', text: 'Nice to meet you. How was your day?' },
  { lang: 'vi', text: 'Rất vui được gặp bạn. Hôm nay của bạn thế nào?' },
]

async function main(): Promise<void> {
  if (!hasElevenLabsKey()) {
    console.error('❌ Thiếu ELEVENLABS_API_KEY trong .env')
    process.exit(1)
  }
  const voice = arg('voice') ?? 'Alice'
  if (!isValidElevenVoice(voice)) {
    console.error(`❌ Giọng không hợp lệ: ${voice} (chọn: ${ELEVEN_VOICE_IDS.join(', ')})`)
    process.exit(1)
  }
  const outDir = arg('out') ?? path.join(os.tmpdir(), 'eleven-tone-samples')
  fs.mkdirSync(outDir, { recursive: true })

  let credits = 0
  for (const tone of ELEVEN_TONES) {
    for (const { lang, text } of SAMPLES) {
      const result = await generateAudioFromElevenLabs(text, voice, tone)
      const file = path.join(outDir, `${voice}-${tone}-${lang}.mp3`)
      fs.writeFileSync(file, Buffer.from(result.audio))
      credits += elevenBilledChars(text, tone)
      console.log(
        `✓ ${file}  (mốc thời gian: ${result.alignment ? 'có' : 'KHÔNG — khẩu hình sẽ tự ước lượng'})`,
      )
    }
  }
  console.log(`\n≈ ${credits} credit đã dùng. Nghe lần lượt rồi kiểm tra:`)
  console.log(
    '  1. Có file nào ĐỌC THÀNH TIẾNG chữ "calm"/"cheerful"/"excited" không? (nếu có: dừng,',
  )
  console.log('     đổi ELEVENLABS_TONE_MODEL hoặc dùng --no-tone khi seed)')
  console.log('  2. Giọng điệu giữa các bản có khác nhau rõ rệt không, nhất là tiếng Việt?')
}

main().catch((err) => {
  console.error('❌ Lỗi:', err)
  process.exit(1)
})
