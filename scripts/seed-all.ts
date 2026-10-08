// scripts/seed-all.ts
// Công cụ seed audio (phát âm + TTS câu) có BÁO CÁO TIẾN ĐỘ + MENU chọn việc, GỘP LUÔN
// việc đồng bộ audio cache cũ (đang nằm local VPS) lên Cloudflare R2 — trước đây tách
// riêng ở scripts/sync-storage-to-r2.ts (đã gộp vào đây 2026-07-20, xem mục "s" ở menu).
//
// [2026-07-20] 2 thay đổi mặc định (theo yêu cầu: "mặc định lưu trên R2 nếu seed mới" +
// "thống kê cả ở R2"):
//   - `STORAGE_DRIVER` mặc định = 'r2' nếu `.env`/shell chưa set gì — audio MỚI seed tự
//     lên Cloudflare R2, không cần nhớ prefix `STORAGE_DRIVER=r2` mỗi lần chạy. Vẫn tôn
//     trọng nếu bạn set `STORAGE_DRIVER=local` rõ ràng (vd test tay trên máy dev).
//   - Báo cáo giờ có thêm mục "☁️ THỰC TẾ TRÊN CLOUDFLARE R2" — đếm object THẬT trên R2
//     (ListObjectsV2, không qua DB/ổ đĩa) vì ổ đĩa local có thể đã xóa sau khi đồng bộ,
//     không còn đối chiếu qua walkMp3 được nữa. Tự bỏ qua nếu chưa cấu hình đủ biến R2_*.
//
// Khi chạy `npm run seed:all`:
//   1. Kiểm tra DB (+ R2 nếu đã cấu hình) → báo cáo bao nhiêu % mỗi nhóm đã seed xong.
//   2. Hiện menu: seed riêng 1 nhóm · seed tất cả · đồng bộ audio local → R2 · thoát.
//   3. Sau mỗi lần seed, kiểm tra lại + hiện menu mới (lặp đến khi bạn thoát).
//
// Các nhóm seed nội dung (theo thứ tự ưu tiên client cần):
//   - pron          Phát âm từ điển (pronunciations)
//   - curriculum    Câu + ví dụ giáo trình nền tảng (/learn)
//   - cefr          Ví dụ ngữ pháp CEFR (Roadmap)
//   - lessons-early Hội thoại 50 bài đầu (Luyện nói)
//   - patterns      Câu mẫu trang Cụm từ
//   - lessons-rest  Hội thoại các bài còn lại
//
// Cờ / biến môi trường (SEED nội dung):
//   --check  (CHECK=1)       Chỉ in báo cáo rồi thoát (không seed, không menu).
//   --verify (VERIFY=1)      Kiểm tra KỸ DB: đối chiếu 2 chiều (thiếu / thừa / lệch đường dẫn).
//   --check-versions          CHỈ ĐỌC: báo cáo tts_cache đang ở phiên bản giọng nào (v2 cũ /
//                             v3 hiện tại / Studio) — không sửa/xoá/remap gì. Dùng để biết đã
//                             migrate xong VOICE_VERSION chưa trước khi cân nhắc --clean-orphans.
//   --clean-orphans          (kèm --verify) Xoá bản ghi + file THỪA (orphan) phát hiện được —
//                             mặc định CHỈ XEM TRƯỚC, thêm --yes để xoá thật. Vd sau đợt đổi
//                             tên giọng: female2/male2.mp3 không còn dùng nữa, chiếm dung
//                             lượng oan → npm run seed:all -- --verify --clean-orphans --yes
//   --all    (SEED_ALL=1/YES=1) Seed tất cả ngay, không hỏi menu (dùng cho CI/cron).
//   --force  (FORCE=1)       Tạo lại + ghi đè cả audio đã có (dùng chung cho cả seed VÀ sync R2).
//   --pron-lang=en-US        Chỉ seed/soát phát âm của (các) ngôn ngữ này — mặc định CẢ HAI:
//                             en-US (từ tiếng Anh) + vi-VN (NGHĨA tiếng Việt của cùng từ điển,
//                             chiều B đọc `card.vi`). Nhận nhiều giá trị: --pron-lang=en-US,vi-VN
//                             ⚠️ Cờ này CŨNG giới hạn phạm vi soát orphan: dòng thuộc ngôn ngữ
//                             ngoài lượt chạy sẽ KHÔNG bị --clean-orphans đụng tới (chạy hẹp
//                             không bao giờ xoá nhầm dữ liệu ngôn ngữ khác).
//   LIMIT=20                 Giới hạn số tác vụ mỗi nhóm (debug).
//   --eleven (SEED_ELEVEN=1) THÊM tác vụ giọng ElevenLabs (6 giọng, xem ELEVEN_VOICES) vào các
//                             nhóm câu: curriculum · cefr · hội thoại · cụm từ · challenge. MẶC
//                             ĐỊNH TẮT vì ElevenLabs tính tiền theo ký tự — không có cờ này thì
//                             `seed:all` y như cũ, báo cáo % cũng không đổi. Cần ELEVENLABS_API_KEY.
//                             Trước khi gọi API script in ƯỚC TÍNH số câu/ký tự rồi hỏi xác nhận
//                             (gõ "yes"); chạy không bàn phím thì phải thêm --yes. Kèm --check để
//                             CHỈ xem ước tính, không tốn đồng nào. Từ điển (pronunciations) KHÔNG
//                             seed ElevenLabs vì /api/pronunciation không hỗ trợ giọng này.
//   --eleven-budget=N (ELEVEN_BUDGET_CHARS=N)  Trần N KÝ TỰ (= credit) cho MỖI lượt chạy — chỉ seed
//                             tới khi chạm trần rồi dừng, lần sau chạy lại sẽ làm tiếp phần còn
//                             thiếu (script tự bỏ qua câu đã có). Để chia việc theo hạn mức credit
//                             hàng tháng của gói ElevenLabs. Thứ tự ưu tiên: CEFR → Challenge →
//                             hội thoại → giáo trình → Cụm từ (nhóm nhỏ/quan trọng trước, nhóm
//                             khổng lồ sau cùng). Không đặt = không trần. Tổng toàn bộ nội dung
//                             ~16 triệu ký tự (đo 2026-10-08) — đừng chạy không trần nếu chưa tính.
//   --no-tone                 (kèm --eleven) TẮT giọng điệu: đọc trung tính, không gắn thẻ cảm xúc.
//                             Mặc định mỗi nhóm câu có giọng điệu riêng (ELEVEN_TONE_BY_CAT: giáo
//                             trình/CEFR bình tĩnh, hội thoại vui vẻ, challenge hào hứng, Cụm từ
//                             trung tính) qua thẻ [calm]/[cheerful]/[excited] trên model eleven_v4.
//                             Thẻ TÍNH PHÍ như ký tự thường nên ước tính + trần đã cộng thêm.
//                             Nghe thử trước: `npm run eleven:tone-sample`.
//   ELEVENLABS_SEED_CONCURRENCY=3  Số request ElevenLabs chạy song song (mặc định 3 — gói thấp
//                             của ElevenLabs chỉ cho 2–5 request đồng thời, vượt là bị 429).
//   VERIFY_DECRYPT=20        (kèm --verify) Tải + giải mã thử 20 file để chắc dùng được.
//   WORDS_FILE=...           Đọc danh sách từ cần phát âm từ file (retry lỗi).
//
// Cờ / biến môi trường (ĐỒNG BỘ audio local → R2 — cần STORAGE_DRIVER=r2):
//   --sync-r2  (SYNC_R2=1)   Chạy đồng bộ ngay, không hỏi menu (dùng cho CI/cron).
//   --dry-run  (DRY_RUN=1)   (kèm --sync-r2) Chỉ ĐẾM, không tải lên R2/ghi DB.
//   BUCKET=tts-cache         (kèm --sync-r2) Chỉ 1 bucket (tts-cache | pronunciations).
//
// Cờ / biến môi trường (KIỂM TRA + DỌN file local đã đồng bộ R2 — trước ở
// scripts/verify-r2-sync.ts riêng, gộp vào đây 2026-07-20):
//   --verify-r2                Đối chiếu ổ đĩa VPS ↔ R2 thật (không đọc DB), in báo cáo.
//   --skip-size-check           (kèm --verify-r2) Chỉ kiểm tra CÓ MẶT, bỏ qua so kích thước.
//   --delete-verified           (kèm --verify-r2) Xem trước sẽ xoá bao nhiêu file local đã
//                                khớp R2 (CHƯA xoá gì — cần thêm --yes mới xoá thật).
//   --yes                       (kèm --delete-verified) Xác nhận xoá THẬT, từng file, chỉ
//                                file đã xác nhận khớp R2 — file thiếu/lệch luôn được giữ lại.
//
// Chạy: npm run seed:all   ·   Báo cáo: npm run seed:all -- --check   ·   Kiểm tra kỹ: npm run seed:all -- --verify
// Đồng bộ R2: STORAGE_DRIVER=r2 npm run seed:all -- --sync-r2 --dry-run  (rồi bỏ --dry-run)
// Xoá local đã an toàn: npm run seed:all -- --verify-r2 --delete-verified (xem trước) rồi --yes
//
// 📖 Hướng dẫn chi tiết (báo cáo / remap / verify / R2): docs/seed-guide.md

import * as crypto from 'node:crypto'
import * as dotenv from 'dotenv'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as readline from 'node:readline/promises'
import { fileURLToPath } from 'node:url'
import cliProgress from 'cli-progress'
import { S3Client, ListObjectsV2Command, DeleteObjectCommand } from '@aws-sdk/client-s3'
import {
  generateAudioFromGoogle,
  generateStudioAudioFromGoogle,
  isValidStudioVoice,
  hasGoogleTtsKey,
  probeApiKeys,
  setActiveKeyPool,
  VOICE_IDS,
  VOICE_VERSION,
  DEFAULT_SEED_VOICE_IDS,
  STUDIO_VOICE_IDS,
  type Lang,
  type VoiceId,
  type StudioVoiceId,
} from '@dhcb/core-ai/googleTts'
import {
  generateAudioFromGemini,
  isValidGeminiVoice,
  hasGeminiTtsKey,
} from '@dhcb/core-ai/geminiTts'
import { STORY_KIND_VOICE } from '../apps/dhcb/src/lib/stories.ts'
import { type VoiceId as AppVoiceId } from '../apps/dhcb/src/lib/voiceTiers.ts'
import type { StoryKind } from '../apps/dhcb/src/data/stories/index.ts'
import {
  ELEVEN_VOICE_IDS,
  elevenBilledChars,
  elevenVoiceGender,
  generateAudioFromElevenLabs,
  hasElevenLabsKey,
  isValidElevenVoice,
  type ElevenTone,
  type ElevenVoiceId,
} from '@dhcb/core-ai/elevenLabsTts'
import { visemeTimelineFromAlignment } from '@dhcb/core-ai/visemeTimeline'
import { CEFR_LEVELS } from '../apps/dhcb/src/data/cefr.ts'
import { encryptAudio, decryptAudio } from '@dhcb/core-ai/ttsCrypto'
import { saveAudio } from '@dhcb/core-ai/fileStorage'
import type { QueryResultRow } from 'pg'
import { getPgPool } from '@dhcb/core-db/pgPool'
import { FOUNDATION } from '../apps/dhcb/src/data/curriculum.ts'
import { CHALLENGE_TOPICS } from '../apps/dhcb/src/data/challengeTopics.ts'
import {
  loadSubjectsInDisplayOrder,
  loadPatternSeedIndex,
  PREF_VOICE_IDS,
} from './_lib/patternOrder.ts'

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
dotenv.config({ path: path.join(PROJECT_ROOT, '.env') })

// Mặc định lưu audio MỚI seed lên Cloudflare R2 — không cần nhớ prefix
// `STORAGE_DRIVER=r2` mỗi lần chạy. Chỉ áp khi `.env`/shell CHƯA set gì (tôn trọng
// lựa chọn rõ ràng của người dùng, vd STORAGE_DRIVER=local để test tay trên máy dev).
if (!process.env.STORAGE_DRIVER) process.env.STORAGE_DRIVER = 'r2'

// ── Cấu hình ────────────────────────────────────────────────────────────────
// Quyết định 2026-07-23: seed ĐỦ cả 14 giọng Chirp3-HD (không chỉ 8 giọng mặc định) — 6
// giọng "extra" luôn xếp SAU 8 giọng mặc định (+ Studio nếu có) trong mảng tác vụ mỗi mục,
// nên trong 1 lượt seed liên tục (--all / "Seed TẤT CẢ"), 8 giọng mặc định luôn được xử lý
// TRƯỚC 6 giọng còn lại (vòng lặp theo thứ tự mảng, batch theo batch) — tự nhiên seed
// "đủ 100% nhóm mặc định rồi mới tới 6 giọng còn lại" mà không cần logic chờ/gate riêng.
const EXTRA_VOICE_IDS: VoiceId[] = VOICE_IDS.filter((v) => !DEFAULT_SEED_VOICE_IDS.includes(v))

// Pronunciations: 8 giọng mặc định (4 nữ + 4 nam phổ biến nhất) trước, kèm 2 giọng Studio
// (cao cấp, Pro/VIP — CHỈ tiếng Anh nên pronunciations seed được toàn bộ, không như Cụm
// từ/hội thoại có cả tiếng Việt: free 1 triệu ký tự/tháng của Google TTS đủ seed thoải
// mái), rồi tới 6 giọng Chirp3-HD còn lại (EXTRA_VOICE_IDS) xếp SAU CÙNG.
const PRON_VOICE_IDS: AnyGoogleVoiceId[] = [
  ...DEFAULT_SEED_VOICE_IDS,
  ...STUDIO_VOICE_IDS,
  ...EXTRA_VOICE_IDS,
]

// Giọng cho phát âm TIẾNG VIỆT (chiều B đọc `card.vi`): 14 giọng Chirp3-HD, KHÔNG có Studio —
// Google không có giọng Studio cho vi-VN (api/pronunciation.ts tự hạ về Chirp3-HD), seed Studio
// cho vi-VN là tạo dòng không bao giờ khớp request thật.
const PRON_VI_VOICE_IDS: AnyGoogleVoiceId[] = [...DEFAULT_SEED_VOICE_IDS, ...EXTRA_VOICE_IDS]

// Ngôn ngữ phát âm sẽ seed trong lượt chạy này. Mặc định CẢ HAI: en-US (từ tiếng Anh) và
// vi-VN (nghĩa tiếng Việt của cùng từ điển — chiều B). Thu hẹp bằng `--pron-lang=en-US`.
//
// ⚠️ AN TOÀN: danh sách này cũng giới hạn phạm vi soát orphan (xem verifyDb) — dòng phát âm
// thuộc ngôn ngữ KHÔNG nằm trong lượt chạy sẽ không bị coi là orphan, để `--clean-orphans`
// của một lượt hẹp không xoá nhầm dữ liệu của ngôn ngữ khác.
const PRON_LANG_ARG = process.argv.find((a) => a.startsWith('--pron-lang='))?.split('=')[1]
const ALL_PRON_LANGS: PronLang[] = ['en-US', 'vi-VN']
const PRON_LANGS: PronLang[] = PRON_LANG_ARG
  ? PRON_LANG_ARG.split(',')
      .map((s) => s.trim())
      .filter((s): s is PronLang => (ALL_PRON_LANGS as string[]).includes(s))
  : ALL_PRON_LANGS
if (PRON_LANG_ARG && PRON_LANGS.length === 0) {
  console.error(`❌ --pron-lang không hợp lệ: ${PRON_LANG_ARG} (chỉ nhận en-US | vi-VN)`)
  process.exit(1)
}

const BATCH_SIZE = 50 // số tác vụ song song
const DELAY_MS = 0 // không cần delay
const RETRY_DELAY_MS = 5000 // nghỉ giữa vòng retry
const MAX_ROUNDS = 100
// Rate limit thích nghi — tự điều chỉnh theo lượng req thực của window trước:
//   429 xuất hiện  → nghỉ 60s, limit 180
//   req >= 180     → nghỉ 60s, limit 180
//   req < 180      → chạy liên tục (không nghỉ)
const RATE_LIMIT_DEFAULT = 180 // limit mặc định khi bắt đầu
const BASE_URL = process.env.BASE_URL || ''
const FORCE = process.argv.includes('--force') || process.env.FORCE === '1'
// Seed thêm giọng ElevenLabs (tốn tiền theo ký tự) — mặc định TẮT, xem ghi chú ở đầu file.
const ELEVEN_SEED = process.argv.includes('--eleven') || process.env.SEED_ELEVEN === '1'
// Trần ký tự ElevenLabs cho mỗi lượt chạy (Infinity = không trần), xem ghi chú ở đầu file.
const ELEVEN_BUDGET_ARG = process.argv.find((a) => a.startsWith('--eleven-budget='))?.split('=')[1]
const ELEVEN_BUDGET = Number(ELEVEN_BUDGET_ARG ?? process.env.ELEVEN_BUDGET_CHARS) || Infinity
// Giọng điệu theo nhóm câu (chốt với chủ dự án 2026-10-08: CỐ ĐỊNH theo nhóm, không cho người dùng
// chọn). Nhóm không có trong bảng = trung tính. Từ điển không dùng ElevenLabs nên không có ở đây.
const ELEVEN_TONE_BY_CAT: Partial<Record<CatId, ElevenTone>> = {
  curriculum: 'calm',
  cefr: 'calm',
  'lessons-early': 'cheerful',
  'lessons-rest': 'cheerful',
  challenge: 'excited',
  patterns: 'neutral',
}
const ELEVEN_TONES_ON = !process.argv.includes('--no-tone')
const toneOf = (cat: CatId): ElevenTone | undefined =>
  ELEVEN_TONES_ON ? ELEVEN_TONE_BY_CAT[cat] : undefined
const ELEVEN_CONCURRENCY = Math.max(1, Number(process.env.ELEVENLABS_SEED_CONCURRENCY) || 3)
const CHECK_ONLY = process.argv.includes('--check') || process.env.CHECK === '1'
const VERIFY_ONLY = process.argv.includes('--verify') || process.env.VERIFY === '1'
const CHECK_VERSIONS_ONLY = process.argv.includes('--check-versions')
// Xoá THẬT các bản ghi + file dư thừa (orphan) phát hiện được lúc --verify — mặc định
// (không có --yes) chỉ XEM TRƯỚC, không xoá gì. Dùng chung --yes với luồng sync R2 cũ.
const CLEAN_ORPHANS = process.argv.includes('--clean-orphans')
const SEED_ALL_FLAG =
  process.argv.includes('--all') || process.env.SEED_ALL === '1' || process.env.YES === '1'
const SYNC_R2_FLAG = process.argv.includes('--sync-r2') || process.env.SYNC_R2 === '1'
const SYNC_DRY_RUN = process.argv.includes('--dry-run') || process.env.DRY_RUN === '1'
const SYNC_ONLY_BUCKET = process.env.BUCKET || ''
const SYNC_BATCH_SIZE = 15 // upload song song mỗi đợt — vừa phải, tránh dồn ép R2 API
// Thư mục gốc chứa file local — phải khớp api/_lib/fileStorage.ts (getUploadsRoot).
const SYNC_UPLOADS_ROOT = process.env.UPLOADS_DIR || path.join(process.cwd(), 'uploads')
const VERIFY_R2_FLAG = process.argv.includes('--verify-r2')
const VERIFY_SKIP_SIZE_CHECK = process.argv.includes('--skip-size-check')
const VERIFY_DELETE_VERIFIED = process.argv.includes('--delete-verified')
const VERIFY_CONFIRM_YES = process.argv.includes('--yes')

const PRON_ERRORS_FILE = path.join(PROJECT_ROOT, 'scripts/seed-errors.json')
const PATTERN_ERRORS_FILE = path.join(PROJECT_ROOT, 'scripts/prefetch-tts-errors.json')

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms))

// ── Tự retry khi mất kết nối DB GIỮA CHỪNG (KHÁC lỗi nghiệp vụ) ─────────────────
// Postgres có thể bị restart bên ngoài (auto-update hệ điều hành, thao tác thủ công...)
// đúng lúc script đang chạy — biểu hiện qua lỗi 57P01 "terminating connection due to
// administrator command" (xem log Postgres thật đã xác nhận, không phải do script/OOM).
// Query cụ thể ĐANG chạy lúc đó bị văng, nhưng pool sẽ tự mở kết nối MỚI cho lần gọi kế
// tiếp — nên chỉ cần thử lại vài lần thay vì để cả tiến trình (đang chạy hàng giờ) crash.
const DB_RETRY_DELAYS_MS = [1000, 3000, 8000]
function isTransientDbError(err: unknown): boolean {
  const code = (err as { code?: string } | undefined)?.code
  const message = err instanceof Error ? err.message : String(err)
  return (
    code === '57P01' || // administrator command (restart/shutdown)
    code === '57P02' || // crash shutdown
    code === '57P03' || // cannot connect now (đang khởi động lại)
    code === 'ECONNRESET' ||
    code === 'ETIMEDOUT' ||
    message.includes('Connection terminated')
  )
}
// Chạy nhiều tác vụ ĐỒNG THỜI nhưng GIỚI HẠN số lượng cùng lúc — thay vì xử lý tuần tự
// từng dòng (mỗi dòng 1 round-trip network, hàng trăm nghìn dòng × độ trễ mạng → hàng
// giờ). Giới hạn để không mở quá nhiều kết nối DB cùng lúc (pool `max: 10` ở pgPool.ts) —
// vượt quá không lỗi (pg tự xếp hàng) nhưng không có lợi thêm.
const DELETE_CONCURRENCY = 12
async function runWithConcurrency<T>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<void>,
): Promise<void> {
  let index = 0
  async function runOne(): Promise<void> {
    while (index < items.length) {
      const item = items[index++]!
      await worker(item)
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, runOne))
}

async function withDbRetry<T>(fn: () => Promise<T>, label: string): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await fn()
    } catch (err) {
      if (!isTransientDbError(err) || attempt > DB_RETRY_DELAYS_MS.length) throw err
      const delay = DB_RETRY_DELAYS_MS[attempt - 1]!
      console.warn(
        `\n⚠️  Mất kết nối DB tạm thời khi ${label} (thử ${attempt}/${DB_RETRY_DELAYS_MS.length}) —` +
          ` nghỉ ${delay / 1000}s rồi thử lại...`,
      )
      await sleep(delay)
    }
  }
}

// ── Nhóm (category) ─────────────────────────────────────────────────────────
type CatId =
  | 'pron'
  | 'curriculum'
  | 'cefr'
  | 'lessons-early'
  | 'patterns'
  | 'lessons-rest'
  | 'challenge'
  | 'stories'

// Thứ tự seed khi chạy --all (menu chọn riêng từng nhóm không phụ thuộc thứ tự này).
// "Cụm từ" đặt CUỐI CÙNG vì số lượng lớn nhất (~313k câu) — ưu tiên seed xong các nhóm
// nhỏ hơn (CEFR, hội thoại...) trước để có kết quả sớm, tránh dồn hết quota/thời gian
// vào 1 nhóm ngay từ đầu.
const CATEGORIES: { id: CatId; label: string }[] = [
  { id: 'pron', label: 'Phát âm từ điển (pronunciations)' },
  { id: 'curriculum', label: 'Câu + ví dụ giáo trình nền tảng (/learn)' },
  { id: 'cefr', label: 'Ví dụ ngữ pháp CEFR (Roadmap)' },
  { id: 'lessons-early', label: 'Hội thoại 50 bài đầu (Luyện nói)' },
  { id: 'lessons-rest', label: 'Hội thoại các bài còn lại' },
  { id: 'challenge', label: 'Câu mẫu Challenge 30 ngày' },
  { id: 'stories', label: 'Truyện cổ tích/ngụ ngôn (trang Nghe)' },
  { id: 'patterns', label: 'Câu mẫu trang Cụm từ' },
]

// ── Kiểu dữ liệu ────────────────────────────────────────────────────────────
// Giọng Studio (cao cấp, Pro/VIP, CHỈ tiếng Anh — xem api/_lib/googleTts.ts) seed CHUNG
// luồng với Chirp3-HD ở đây (cùng bảng tts_cache/pronunciations, cùng cơ chế remap/retry),
// chỉ khác hàm gọi Google TTS thực tế (xem processTask).
type AnyGoogleVoiceId = VoiceId | StudioVoiceId
type AnyVoiceId = AppVoiceId
// Ngôn ngữ của 1 dòng phát âm. Bảng `pronunciations` unique theo (word, voice, lang) nên
// MỌI khoá/truy vấn trong file này phải gồm đủ 3 phần — thiếu `lang` sẽ khớp nhầm giữa từ
// tiếng Anh và nghĩa tiếng Việt trùng chuỗi.
type PronLang = 'en-US' | 'vi-VN'
interface PronTask {
  type: 'pron'
  cat: 'pron'
  word: string
  voice: AnyGoogleVoiceId
  lang: PronLang
}

// Khoá định danh 1 dòng phát âm — dùng CHUNG cho mọi nơi (dedupe, audit, verify, orphan).
function pronKey(word: string, voice: string, lang: string): string {
  return `${word}:${voice}:${lang}`
}
interface PatternTask {
  type: 'pattern'
  cat: CatId
  text: string
  lang: Lang
  voice: AnyVoiceId
}
type AnyTask = PronTask | PatternTask

// Tách thành các nhánh literal riêng để TypeScript narrow đúng về nhánh 'error'
// (gộp 'ok'|'skip'|'remapped' vào 1 nhánh khiến else không suy ra được .message).
type TaskResult =
  | { status: 'ok' }
  | { status: 'skip' }
  | { status: 'remapped' }
  | { status: 'error'; message: string }

// ── Hash cho pattern cache — phải khớp hoàn toàn với api/tts.ts ─────────────
// Hash đúng (mới): có VOICE_VERSION — dùng cho mọi entry mới (kể cả giọng Studio — hash chỉ
// nối chuỗi, không quan tâm giọng thuộc Chirp3-HD hay Studio).
function hashText(text: string, lang: Lang, voice: AnyVoiceId): string {
  // Giọng ElevenLabs KHÔNG đưa `lang` vào hash — PHẢI khớp packages/core-ai/tts.ts (hashLangPart),
  // sai là seed ra hàng nghìn dòng không bao giờ khớp request thật.
  const langPart = isValidElevenVoice(voice) ? '' : lang
  return crypto
    .createHash('sha256')
    .update(text + langPart + voice + VOICE_VERSION)
    .digest('hex')
    .slice(0, 32)
}
// Hash cũ (sai): thiếu VOICE_VERSION — dùng để tìm entry đã seed trước đây (từ hồi
// VOICE_VERSION chưa tồn tại, trước cả đợt đổi tên giọng bên dưới).
function oldHashText(text: string, lang: Lang, voice: VoiceId): string {
  return crypto
    .createHash('sha256')
    .update(text + lang + voice)
    .digest('hex')
    .slice(0, 32)
}

// ── Đổi tên giọng 2026-07-21: 'female'/'male'/'female2'/'male2' → tên thật Chirp3-HD
// ('Kore'/'Puck'/'Aoede'/'Charon') + VOICE_VERSION 'chirp3hd-v2' → 'chirp3hd-v3'. Âm thanh
// SINH RA GIỐNG HỆT (cùng 1 giọng Google, chỉ đổi định danh trong app) — nên có thể "gắn
// nhãn lại" cache cũ dưới tên/hash MỚI thay vì gọi lại Google TTS tốn tiền.
const OLD_VOICE_VERSION = 'chirp3hd-v2'
const OLD_VOICE_ALIAS: Partial<Record<VoiceId, string>> = {
  Kore: 'female',
  Puck: 'male',
  Aoede: 'female2',
  Charon: 'male2',
}
// Hash theo lược đồ tên giọng CŨ (trước đợt đổi tên 2026-07-21) — null nếu voice này
// không tồn tại trước đợt đổi tên (10 giọng mới hoàn toàn, không có tiền thân).
function legacyVoiceNameHash(text: string, lang: Lang, voice: VoiceId): string | null {
  const oldVoiceName = OLD_VOICE_ALIAS[voice]
  if (!oldVoiceName) return null
  return crypto
    .createHash('sha256')
    .update(text + lang + oldVoiceName + OLD_VOICE_VERSION)
    .digest('hex')
    .slice(0, 32)
}

// ── Load dữ liệu ────────────────────────────────────────────────────────────
// Thứ tự ưu tiên seed TTS cache:
//   1. Curriculum sentences + examples  → /learn chạy ngay cho user đầu tiên
//   2. CEFR grammar examples            → Roadmap tab (/learn)
//   3. Lesson turns (50 bài đầu)        → Luyện nói beginner instant
//   4. Pattern sentences                → Cụm từ page
//   5. Lesson turns còn lại             → cache dần, ít urgent hơn
//   6. Câu mẫu Challenge 30 ngày        → trang /challenge, ít urgent nhất
//
// Lesson turns: mỗi turn seed 7 biến thể giọng/nhân vật (ghép theo index xoay vòng, KHÔNG
// phải 7×7=49 tổ hợp đầy đủ — xem LESSON_VOICE_VARIANTS bên dưới) + 1 biến thể Studio riêng
// cho câu tiếng Anh. Trước 2026-07-23 chỉ seed đúng 1 giọng/nhân vật (~5.900 tác vụ, giảm 96%
// so với seed đủ 7×7 tổ hợp) — quyết định 2026-07-23: chấp nhận tăng lại gần mức đó để phủ
// tốt hơn các giọng ngẫu nhiên VIP có thể gặp (pickRandomVoice chọn bất kỳ trong 7 giọng/giới).
function loadPatternTasks(): PatternTask[] {
  const tasks: PatternTask[] = []
  const seen = new Set<string>()

  // ── ElevenLabs (chỉ khi --eleven): đủ 6 giọng cho mọi câu của 5 nhóm câu. Gom riêng rồi nối
  // SAU CÙNG để 14 giọng Google luôn seed trước. Audio ElevenLabs không phụ thuộc `lang` (hash
  // bỏ lang) nên khoá khử trùng cũng bỏ lang.
  const elevenTasks: PatternTask[] = []
  const elevenSeen = new Set<string>()
  const addEleven = (
    rawText: string,
    lang: Lang,
    cat: CatId,
    voices: readonly ElevenVoiceId[] = ELEVEN_VOICE_IDS,
  ) => {
    if (!ELEVEN_SEED) return
    const text = rawText.trim()
    if (!text) return
    for (const voice of voices) {
      const key = `${text}|${voice}`
      if (elevenSeen.has(key)) continue
      elevenSeen.add(key)
      elevenTasks.push({ type: 'pattern', cat, text, lang, voice })
    }
  }

  // voices: cho phép giới hạn giọng theo nhóm (vd. patterns chỉ cần female/male).
  const add = (
    rawText: string,
    lang: Lang,
    cat: CatId,
    voices: readonly AnyVoiceId[] = VOICE_IDS,
  ) => {
    const text = rawText.trim()
    if (!text) return
    for (const voice of voices) {
      const key = `${text}|${lang}|${voice}`
      if (seen.has(key)) continue // bỏ qua giọng đã thêm, KHÔNG return (return sẽ rớt các giọng còn lại)
      seen.add(key)
      tasks.push({ type: 'pattern', cat, text, lang, voice })
    }
  }

  // Giọng cho câu ví dụ ở curriculum/CEFR/Cụm từ — 8 giọng mặc định (PREF_VOICE_IDS) rồi
  // tới 6 giọng Chirp3-HD còn lại (EXTRA_VOICE_IDS, xếp SAU nên luôn seed sau khi 8 giọng
  // mặc định xong). Riêng TIẾNG ANH có thêm 2 giọng Studio (cao cấp, Pro/VIP) — Studio CHỈ
  // tiếng Anh nên KHÔNG thêm vào bản dịch tiếng Việt.
  const PREF_VOICE_IDS_FULL: AnyGoogleVoiceId[] = [...PREF_VOICE_IDS, ...EXTRA_VOICE_IDS]
  const PREF_VOICE_IDS_EN: AnyGoogleVoiceId[] = [
    ...PREF_VOICE_IDS,
    ...STUDIO_VOICE_IDS,
    ...EXTRA_VOICE_IDS,
  ]

  // ── Ưu tiên 1: curriculum (câu thông dụng + ví dụ từng từ) ────────────────
  // Phát qua KaraokeText/getVoicePref → seed đủ 14 giọng Chirp3-HD (8 mặc định trước, 6 còn
  // lại sau) + tiếng Anh seed thêm 2 giọng Studio (Pro/VIP mặc định mới, xem lib/tts.ts).
  for (const circle of FOUNDATION) {
    for (const { en } of circle.sentences) {
      add(en, 'en-US', 'curriculum', PREF_VOICE_IDS_EN)
      addEleven(en, 'en-US', 'curriculum')
    }
    for (const entry of circle.words) {
      if (entry.ex_en) {
        add(entry.ex_en, 'en-US', 'curriculum', PREF_VOICE_IDS_EN)
        addEleven(entry.ex_en, 'en-US', 'curriculum')
      }
      if (entry.ex_vi) {
        add(entry.ex_vi, 'vi-VN', 'curriculum', PREF_VOICE_IDS_FULL)
        addEleven(entry.ex_vi, 'vi-VN', 'curriculum')
      }
    }
  }

  // ── Ưu tiên 2: CEFR grammar examples → Roadmap tab ────────────────────────
  // Cũng phát qua KaraokeText/getVoicePref → seed đủ 14 giọng + Studio cho tiếng Anh.
  for (const level of CEFR_LEVELS) {
    for (const unit of level.units) {
      for (const lesson of unit.grammar) {
        for (const { en, vi } of lesson.examples) {
          add(en, 'en-US', 'cefr', PREF_VOICE_IDS_EN)
          add(vi, 'vi-VN', 'cefr', PREF_VOICE_IDS_FULL)
          addEleven(en, 'en-US', 'cefr')
          addEleven(vi, 'vi-VN', 'cefr')
        }
      }
    }
  }

  // ── Ưu tiên 3 & 5: lesson turns — giọng đúng per nhân vật ─────────────────
  // Giống Lessons.tsx: voiceA = giới tính A; voiceB = variant2 nếu cùng giới, giọng kia nếu khác
  const lessonDir = path.join(PROJECT_ROOT, 'apps/dhcb/public/data/lessons')
  const lessonFiles = fs
    .readdirSync(lessonDir)
    .filter((f) => /^chunk-\d+\.json$/.test(f))
    .sort()
  let lessonCount = 0
  const laterLessonTasks: PatternTask[] = []

  type LessonRaw = {
    speakerAGender?: 'female' | 'male' | null
    speakerBGender?: 'female' | 'male' | null
    turns?: Array<{ speaker: string; en: string; vi: string }>
  }

  // Khớp đúng logic phân giọng ở client (src/pages/Lessons.tsx LessonView, src/components/
  // CefrLessonViews.tsx DialogueView): pickRandomVoice(gender, plan) chọn NGẪU NHIÊN 1 trong
  // 7 giọng cùng giới cho MỖI nhân vật — nên seed đủ 7 biến thể/giới (không chỉ 2 giọng mặc
  // định như trước) mới phủ được phần lớn tổ hợp user VIP có thể gặp. Quyết định 2026-07-23:
  // chấp nhận tăng chi phí/khối lượng seed lessons trở lại gần mức trước đợt tối ưu "giảm 96%"
  // (2 giọng/giới → 7 giọng/giới) để có coverage tốt hơn — xem PROGRESS.md.
  // KHÔNG seed đủ 7×7=49 tổ hợp (A×B đầy đủ) — quá tốn; thay vào đó ghép theo INDEX xoay vòng
  // (voiceA = giọng thứ i, voiceB = giọng thứ i+1 nếu cùng giới, thứ i nếu khác giới) → đúng 7
  // biến thể/bài thay vì 49, vẫn phủ đủ 7 giọng ở CẢ 2 vị trí nhân vật.
  // VOICE_IDS có thứ tự CỐ ĐỊNH "7 giọng nữ trước, 7 giọng nam sau" (xem googleTts.ts) —
  // dựa vào đó tách 2 nhóm thay vì gọi lại VOICE_GENDER (không export từ googleTts.ts).
  const FEMALE_VOICES_ALL: VoiceId[] = VOICE_IDS.slice(0, 7)
  const MALE_VOICES_ALL: VoiceId[] = VOICE_IDS.slice(7, 14)
  const voicesOfGender = (g: 'female' | 'male') =>
    g === 'female' ? FEMALE_VOICES_ALL : MALE_VOICES_ALL
  const LESSON_VOICE_VARIANTS = FEMALE_VOICES_ALL.length // = 7, khớp cả 2 giới
  // Giọng ElevenLabs theo giới (3 nữ + 3 nam). Ghép xoay vòng y như Chirp3-HD: voiceA = giọng thứ
  // i, voiceB = giọng thứ i+1 nếu cùng giới (để 2 nhân vật không trùng giọng).
  const elevenOf = (g: 'female' | 'male'): ElevenVoiceId[] =>
    ELEVEN_VOICE_IDS.filter((v) => elevenVoiceGender(v) === g)

  for (const file of lessonFiles) {
    const chunks = JSON.parse(fs.readFileSync(path.join(lessonDir, file), 'utf8')) as LessonRaw[]
    for (const lesson of chunks) {
      const gA = lesson.speakerAGender ?? 'female'
      const gB = lesson.speakerBGender ?? 'male'
      const voicesA = voicesOfGender(gA)
      const voicesB = voicesOfGender(gB)

      const isEarly = lessonCount < 50
      const cat: CatId = isEarly ? 'lessons-early' : 'lessons-rest'
      const bucket = isEarly ? tasks : laterLessonTasks

      for (let variant = 0; variant < LESSON_VOICE_VARIANTS; variant++) {
        const voiceA: VoiceId = voicesA[variant]!
        const voiceB: VoiceId =
          gB === gA ? voicesB[(variant + 1) % LESSON_VOICE_VARIANTS]! : voicesB[variant]!
        // Giọng Studio (chỉ tiếng Anh) — thêm 1 biến thể riêng cho câu tiếng Anh, KHÔNG lặp
        // lại theo 7 index như Chirp3-HD (chỉ 1 giọng Studio/giới, không có "7 giọng Studio").
        const studioA: StudioVoiceId = gA === 'female' ? 'Studio-O' : 'Studio-Q'
        const studioB: StudioVoiceId = gB === 'female' ? 'Studio-O' : 'Studio-Q'

        for (const turn of lesson.turns ?? []) {
          const isA = turn.speaker === 'A'
          const voice: AnyGoogleVoiceId = isA ? voiceA : voiceB
          if (turn.en) {
            const text = turn.en.trim()
            if (text) {
              const key = `${text}|en-US|${voice}`
              if (!seen.has(key)) {
                seen.add(key)
                bucket.push({ type: 'pattern', cat, text, lang: 'en-US', voice })
              }
              // Biến thể Studio — chỉ tạo 1 lần (ở variant đầu tiên), không lặp lại 7 lần.
              if (variant === 0) {
                const studioVoice = isA ? studioA : studioB
                const studioKey = `${text}|en-US|${studioVoice}`
                if (!seen.has(studioKey)) {
                  seen.add(studioKey)
                  bucket.push({ type: 'pattern', cat, text, lang: 'en-US', voice: studioVoice })
                }
              }
            }
          }
          if (turn.vi) {
            const text = turn.vi.trim()
            if (text) {
              const key = `${text}|vi-VN|${voice}`
              if (!seen.has(key)) {
                seen.add(key)
                bucket.push({ type: 'pattern', cat, text, lang: 'vi-VN', voice })
              }
            }
          }
        }
      }
      if (ELEVEN_SEED) {
        const eA = elevenOf(gA)
        const eB = elevenOf(gB)
        for (let variant = 0; variant < eA.length; variant++) {
          const vA = eA[variant]!
          const vB = gB === gA ? eB[(variant + 1) % eB.length]! : eB[variant % eB.length]!
          for (const turn of lesson.turns ?? []) {
            const v = turn.speaker === 'A' ? vA : vB
            // elevenTasks chỉ nối vào CUỐI toàn bộ; nhóm (early/rest) quyết bởi `cat`.
            if (turn.en) addEleven(turn.en, 'en-US', cat, [v])
            if (turn.vi) addEleven(turn.vi, 'vi-VN', cat, [v])
          }
        }
      }
      lessonCount++
    }
  }

  // ── Ưu tiên 4: pattern sentences (Cụm từ page) — PHỔ BIẾN NHẤT TRƯỚC ────────
  // Ba điều chỉnh để seed đúng cái app thật sự dùng, trước tiên:
  //   • CHỈ 8 giọng mặc định (PREF_VOICE_IDS = DEFAULT_SEED_VOICE_IDS) — KHÔNG mở rộng
  //     thêm 6 giọng/Studio như các nhóm khác (curriculum/CEFR/lessons/challenge/pron):
  //     đây là nhóm LỚN NHẤT (xem ước tính bên dưới), mở rộng thêm sẽ tốn hơn nhiều lần.
  //     6 giọng còn lại + Studio vẫn tạo động (cache-on-demand) khi user chọn ở trang này.
  //   • Thứ tự hiển thị (loadSubjectsInDisplayOrder): I am, You are, We are, He is...
  //     lên trước; chủ thể hiếm seed sau → nếu seed dở dang vẫn có sẵn câu hay gặp nhất.
  //   • CHỈ seed câu THÔNG DỤNG NHẤT trong mỗi chủ thể (top N/100, xem seed-index.json —
  //     ghi bởi `npm run rank:patterns`, xếp hạng theo tần suất từ THẬT trong từ điển).
  //     1.000 chủ thể × 100 câu × 8 giọng × 2 ngôn ngữ = 1,6 TRIỆU file nếu seed hết — quá
  //     tốn. Câu KHÔNG nằm trong seed-index vẫn hoạt động bình thường, chỉ tự tạo audio
  //     (chậm hơn 1 chút) ở lần người dùng THỰC SỰ bấm nghe (cache-on-demand qua /api/tts).
  //     Chưa chạy rank:patterns lần nào (seed-index.json chưa tồn tại) → fallback seed ĐỦ
  //     100 câu/chủ thể như trước (an toàn, không vỡ hành vi cũ).
  const patternDir = path.join(PROJECT_ROOT, 'apps/dhcb/public/data/patterns')
  const patternSeedIndex = loadPatternSeedIndex(patternDir)
  if (!patternSeedIndex) {
    console.warn(
      '[seed-all] Chưa có public/data/patterns/seed-index.json (chạy `npm run rank:patterns`' +
        ' trước để chỉ seed câu thông dụng) — tạm seed ĐỦ 100 câu/chủ thể như cũ.',
    )
  }
  for (const subject of loadSubjectsInDisplayOrder(patternDir)) {
    const seedIdx = patternSeedIndex?.[subject.starter]
    const seedSet = seedIdx ? new Set(seedIdx) : null
    subject.sentences.forEach(({ en, vi }, idx) => {
      if (seedSet && !seedSet.has(idx)) return // câu không thông dụng — để cache-on-demand
      add(en, 'en-US', 'patterns', PREF_VOICE_IDS)
      add(vi, 'vi-VN', 'patterns', PREF_VOICE_IDS)
      addEleven(en, 'en-US', 'patterns')
      addEleven(vi, 'vi-VN', 'patterns')
    })
  }

  // ── Ưu tiên 5: lesson turns còn lại ────────────────────────────────────────
  tasks.push(...laterLessonTasks)

  // ── Ưu tiên 6: câu mẫu Challenge 30 ngày (trang /challenge) ─────────────────
  // Seed đủ 14 giọng Chirp3-HD + Studio cho tiếng Anh (như curriculum/CEFR).
  for (const t of CHALLENGE_TOPICS) {
    for (const s of t.sampleEn) {
      add(s, 'en-US', 'challenge', PREF_VOICE_IDS_EN)
      addEleven(s, 'en-US', 'challenge')
    }
    for (const s of t.sampleVi) {
      add(s, 'vi-VN', 'challenge', PREF_VOICE_IDS_FULL)
      addEleven(s, 'vi-VN', 'challenge')
    }
  }

  // ── Ưu tiên 7: Truyện cổ tích/ngụ ngôn (trang /stories, /stories/:id) ─────────
  // Dùng giọng Gemini chuyên dụng theo từng thể loại (STORY_KIND_VOICE).
  const storyDir = path.join(PROJECT_ROOT, 'apps/dhcb/public/data/stories')
  if (fs.existsSync(storyDir)) {
    const storyFiles = fs
      .readdirSync(storyDir)
      .filter((f) => f.endsWith('.json') && f !== 'index.json')
    for (const file of storyFiles) {
      try {
        const raw = fs.readFileSync(path.join(storyDir, file), 'utf8')
        const story = JSON.parse(raw) as {
          kind: StoryKind
          lines?: Array<{ en?: string; vi?: string }>
          moralEn?: string
          moralVi?: string
        }
        const voice = STORY_KIND_VOICE[story.kind]
        if (voice && story.lines) {
          for (const line of story.lines) {
            if (line.en) add(line.en, 'en-US', 'stories', [voice])
            if (line.vi) add(line.vi, 'vi-VN', 'stories', [voice])
          }
          if (story.moralEn) add(story.moralEn, 'en-US', 'stories', [voice])
          if (story.moralVi) add(story.moralVi, 'vi-VN', 'stories', [voice])
        }
      } catch {
        // bỏ qua file lỗi JSON
      }
    }
  }

  // Nối cuối: 14 giọng Google (và Gemini truyện) luôn đứng trước ElevenLabs trong mỗi nhóm.
  // Vòng lặp thay cho push(...spread): spread mảng hàng trăm nghìn phần tử tràn stack.
  for (const t of elevenTasks) tasks.push(t)
  return tasks
}

// Toàn bộ tác vụ pattern (Cụm từ) BỎ QUA seed-index — khác loadPatternTasks() (chỉ top-N,
// dùng để SEED THẬT nên phải giới hạn vì tốn tiền API). Dùng riêng cho remap-only (KHÔNG
// gọi API nên quét hết 100 câu/chủ thể không tốn phí gì) để tận dụng lại audio cache đã
// seed đủ 100/chủ thể từ TRƯỚC khi có seed-index (hoặc dưới tên/hash giọng CŨ) cho cả 80
// câu ngoài top-N — nếu không quét, cache cũ của các câu đó không bao giờ được remap sang
// hash/tên giọng mới, coi như "chết" dù vẫn còn tốn chỗ trên Storage.
function loadFullPatternTasks(): PatternTask[] {
  const tasks: PatternTask[] = []
  const seen = new Set<string>()
  const patternDir = path.join(PROJECT_ROOT, 'apps/dhcb/public/data/patterns')
  for (const subject of loadSubjectsInDisplayOrder(patternDir)) {
    for (const { en, vi } of subject.sentences) {
      for (const { text: rawText, lang } of [
        { text: en, lang: 'en-US' as Lang },
        { text: vi, lang: 'vi-VN' as Lang },
      ]) {
        const text = rawText.trim()
        if (!text) continue
        for (const voice of PREF_VOICE_IDS) {
          const key = `${text}|${lang}|${voice}`
          if (seen.has(key)) continue
          seen.add(key)
          tasks.push({ type: 'pattern', cat: 'patterns', text, lang, voice })
        }
      }
    }
  }
  return tasks
}

// Hash tương ứng — dùng để BẢO VỆ khỏi bị verifyDb() coi là "orphan" và xoá nhầm: câu
// pattern hợp lệ ở giọng/version hiện tại nhưng ngoài seed-index vẫn là cache hợp lệ,
// /api/tts vẫn phục vụ đúng khi người dùng bấm nghe (cache-on-demand).
function loadAllPatternHashes(): Set<string> {
  const hashes = new Set<string>()
  for (const t of loadFullPatternTasks()) hashes.add(hashText(t.text, t.lang, t.voice))
  return hashes
}

// Nghĩa tiếng Việt của thẻ từ (`card.vi`) có được phép gửi lên /api/pronunciation không —
// PHẢI khớp WORD_SAFE_PATTERN + trần 100 ký tự trong api/pronunciation.ts. Seed chuỗi mà API
// từ chối thì vừa phí tiền tạo audio, vừa để lại dòng không bao giờ khớp request thật (và bị
// verifyDb coi là orphan). Giữ 2 điều kiện này ĐỒNG BỘ TAY với API — dự án không share code
// giữa scripts/ và api/.
const PRON_TEXT_SAFE_PATTERN = /^[\p{L}\p{M}0-9\s'’.,;:()/"-]+$/u
const PRON_TEXT_MAX = 100
function isSeedablePronText(text: string): boolean {
  return text.length > 0 && text.length <= PRON_TEXT_MAX && PRON_TEXT_SAFE_PATTERN.test(text)
}

function loadPronTasks(wordsFile?: string): PronTask[] {
  let words: string[]
  // Nghĩa tiếng Việt tương ứng (chỉ có khi đọc từ điển đầy đủ, không có ở đường retry file lỗi)
  let viTexts: string[] = []
  if (wordsFile) {
    // Retry từ file lỗi (seed-errors.json)
    const raw = JSON.parse(fs.readFileSync(wordsFile, 'utf-8')) as unknown[]
    words = raw.map((item) =>
      (typeof item === 'string' ? item : (item as { word: string }).word).toLowerCase(),
    )
  } else {
    // Đọc từ public/data/dictionary/chunk-*.json
    const dir = path.join(PROJECT_ROOT, 'apps/dhcb/public/data/dictionary')
    const files = fs
      .readdirSync(dir)
      .filter((f) => /^chunk-\d+\.json$/.test(f))
      .sort()
    words = []
    const viSeen = new Set<string>()
    for (const file of files) {
      const raw = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf-8')) as unknown[]
      for (const item of raw) {
        words.push(
          (typeof item === 'string' ? item : (item as { word: string }).word).toLowerCase(),
        )
        // Chiều B (WordCard.tsx) đọc `card.vi` — CHUỖI NGHĨA, không phải từ tiếng Anh. Nhiều
        // từ khác nhau dùng chung một nghĩa nên khử trùng ngay ở đây.
        const vi =
          typeof item === 'string' ? '' : String((item as { vi?: string }).vi ?? '').toLowerCase()
        const trimmed = vi.trim()
        if (isSeedablePronText(trimmed) && !viSeen.has(trimmed)) {
          viSeen.add(trimmed)
          viTexts.push(trimmed)
        }
      }
    }
  }
  if (!PRON_LANGS.includes('vi-VN')) viTexts = []
  // Curriculum words lên đầu → /learn hoạt động instant cho mọi user mới
  const curriculumWords = new Set(
    FOUNDATION.flatMap((c) => c.words.map((w) => w.word.toLowerCase())),
  )
  const tasks: PronTask[] = []
  const seen = new Set<string>()
  const pushTask = (word: string, voice: AnyGoogleVoiceId, lang: PronLang): void => {
    const key = pronKey(word, voice, lang)
    if (seen.has(key)) return
    seen.add(key)
    tasks.push({ type: 'pron', cat: 'pron', word, voice, lang })
  }
  if (PRON_LANGS.includes('en-US')) {
    for (const word of words) {
      for (const voice of PRON_VOICE_IDS) pushTask(word, voice, 'en-US')
    }
  }
  // Nghĩa tiếng Việt xếp SAU toàn bộ tiếng Anh: tiếng Anh là đường dùng chính (chiều A), seed
  // xong trước rồi mới tới chiều B — dừng giữa chừng vẫn ưu tiên đúng phần quan trọng hơn.
  for (const text of viTexts) {
    for (const voice of PRON_VI_VOICE_IDS) pushTask(text, voice, 'vi-VN')
  }
  tasks.sort((a, b) => {
    const aHigh = curriculumWords.has(a.word) ? 0 : 1
    const bHigh = curriculumWords.has(b.word) ? 0 : 1
    return aHigh - bHigh
  })
  return tasks
}

// ── Đồng bộ audio local → Cloudflare R2 ─────────────────────────────────────
// Đẩy audio đang nằm trên ổ đĩa VPS (STORAGE_DRIVER=local, thư mục UPLOADS_DIR) lên
// Cloudflare R2 + TÁI TẠO dòng Postgres tương ứng (tts_cache/pronunciations). Gộp vào
// đây (trước ở scripts/sync-storage-to-r2.ts riêng, xóa 2026-07-20) vì cùng mục đích
// "đưa audio cache vào trạng thái sẵn sàng cho client" như phần seed nội dung ở trên.
//
// ⚠️ Nguồn dữ liệu là Ổ ĐĨA, không phải DB: quyết định 2026-07-19 ("bỏ qua migrate dữ
// liệu người dùng cũ") khiến Postgres tự host bắt đầu từ schema RỖNG dù uploads/ trên
// VPS vẫn còn audio cache từ trước cutover. Script quét ổ đĩa trực tiếp, suy ra
// (hash/lang/voice) hoặc (word/voice) từ TÊN FILE, rồi INSERT/UPDATE dòng DB.
//
// An toàn chạy lại nhiều lần: file đã có dòng DB trỏ R2 (không phải /uploads/) → bỏ
// qua, trừ khi --force. File local KHÔNG bị xóa sau khi đồng bộ.
type R2Bucket = 'tts-cache' | 'pronunciations'

function resolveSyncBuckets(): R2Bucket[] {
  const list = (SYNC_ONLY_BUCKET ? [SYNC_ONLY_BUCKET] : ['tts-cache', 'pronunciations']).filter(
    (b): b is R2Bucket => b === 'tts-cache' || b === 'pronunciations',
  )
  if (list.length === 0) {
    console.error(
      `❌ BUCKET không hợp lệ: ${SYNC_ONLY_BUCKET} (chỉ nhận tts-cache | pronunciations)`,
    )
    process.exit(1)
  }
  return list
}

// Quét đệ quy tìm mọi file .mp3 dưới 1 thư mục (đường dẫn TƯƠNG ĐỐI so với gốc). Gom vào
// `out` DÙNG CHUNG QUA THAM CHIẾU (không spread mảng con vào .push()) — với hàng chục nghìn
// file, `out.push(...bigArray)` tràn giới hạn số đối số của V8 (RangeError).
async function walkMp3(root: string, dir = '', out: string[] = []): Promise<string[]> {
  const full = path.join(root, dir)
  if (!fs.existsSync(full)) return out
  const entries = await fs.promises.readdir(full, { withFileTypes: true })
  for (const entry of entries) {
    const rel = dir ? `${dir}/${entry.name}` : entry.name
    if (entry.isDirectory()) await walkMp3(root, rel, out)
    else if (entry.isFile() && entry.name.endsWith('.mp3')) out.push(rel)
  }
  return out
}

// tts-cache: <lang>/<voice>/<hash>.mp3 — 3 phần cố định, suy trực tiếp từ đường dẫn.
function parseTtsCacheKey(key: string): { lang: string; voice: string; hash: string } | null {
  const parts = key.split('/')
  if (parts.length !== 3) return null
  const [lang, voice, file] = parts
  if (!lang || !voice || !file?.endsWith('.mp3')) return null
  return { lang, voice, hash: file.slice(0, -'.mp3'.length) }
}

// pronunciations: <word-encoded>-<voice>.mp3 — khớp suffix dài nhất trước
// (female2/male2 trước female/male) để tránh cắt nhầm từ có gạch nối kết thúc trùng ký tự.
// Kèm 2 giọng Studio (voice string 'Studio-O'/'Studio-Q' cũng dùng làm suffix file).
const VOICE_SUFFIXES: AnyGoogleVoiceId[] = [...VOICE_IDS, ...STUDIO_VOICE_IDS].sort(
  (a, b) => b.length - a.length,
)
function parsePronunciationKey(
  key: string,
): { word: string; voice: AnyGoogleVoiceId; lang: PronLang } | null {
  if (!key.endsWith('.mp3')) return null
  let base = key.slice(0, -'.mp3'.length)
  // Hậu tố ngôn ngữ chỉ có ở file KHÔNG PHẢI tiếng Anh (`<word>-<voice>-vi-VN.mp3`); file
  // en-US giữ dạng cũ `<word>-<voice>.mp3` — xem processTask.
  let lang: PronLang = 'en-US'
  for (const l of ALL_PRON_LANGS) {
    if (l !== 'en-US' && base.endsWith(`-${l}`)) {
      lang = l
      base = base.slice(0, -`-${l}`.length)
      break
    }
  }
  for (const voice of VOICE_SUFFIXES) {
    const suffix = `-${voice}`
    if (base.endsWith(suffix)) {
      const encodedWord = base.slice(0, -suffix.length)
      if (!encodedWord) continue
      try {
        return { word: decodeURIComponent(encodedWord), voice, lang }
      } catch {
        return null // encodeURIComponent lỗi (hiếm) — bỏ qua file này
      }
    }
  }
  return null
}

interface SyncCounters {
  skip: number
  uploaded: number
  parseError: number
  errors: number
}

const seenSyncErrorMessages = new Set<string>()
function logSyncSampleError(message: string): void {
  const key = message.slice(0, 100)
  if (seenSyncErrorMessages.has(key)) return
  seenSyncErrorMessages.add(key)
  if (seenSyncErrorMessages.size > 8) return
  process.stdout.write(`\n🔎 Mẫu lỗi mới: ${message.slice(0, 300)}\n`)
}

async function syncTtsCacheFile(key: string, counters: SyncCounters, samples: string[]) {
  const parsed = parseTtsCacheKey(key)
  if (!parsed) {
    counters.parseError++
    if (samples.length < 5) samples.push(key)
    return
  }
  const pool = getPgPool()
  if (!FORCE) {
    const { rows } = await pool.query<{ audio_url: string }>(
      'select audio_url from public.tts_cache where hash = $1',
      [parsed.hash],
    )
    if (rows[0] && !rows[0].audio_url.includes('/uploads/')) {
      counters.skip++
      return
    }
  }
  if (SYNC_DRY_RUN) {
    counters.uploaded++
    return
  }
  try {
    const localPath = path.join(SYNC_UPLOADS_ROOT, 'tts-cache', key)
    const buf = await fs.promises.readFile(localPath)
    const arrayBuffer = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)
    const audioUrl = await saveAudio('tts-cache', key, arrayBuffer)
    // CHỦ Ý không đụng cột `iv`: luồng này chỉ TẢI LẠI file ciphertext local lên R2, không hề
    // mã hoá lại — iv của bản ghi vẫn đúng như cũ, ghi đè bằng null sẽ làm file không giải mã
    // được nữa. Nhánh `on conflict` vì thế chỉ cập nhật audio_url (xem migration 0038).
    await pool.query(
      `insert into public.tts_cache (hash, lang, voice, audio_url, last_accessed_at)
       values ($1, $2, $3, $4, now())
       on conflict (hash) do update set audio_url = excluded.audio_url, last_accessed_at = now()`,
      [parsed.hash, parsed.lang, parsed.voice, audioUrl],
    )
    counters.uploaded++
  } catch (err) {
    counters.errors++
    const message = err instanceof Error ? err.message : String(err)
    logSyncSampleError(message)
    if (samples.length < 5) samples.push(`${key} → ${message}`)
  }
}

async function syncPronunciationFile(key: string, counters: SyncCounters, samples: string[]) {
  const parsed = parsePronunciationKey(key)
  if (!parsed) {
    counters.parseError++
    if (samples.length < 5) samples.push(key)
    return
  }
  const pool = getPgPool()
  if (!FORCE) {
    const { rows } = await pool.query<{ audio_url: string }>(
      'select audio_url from public.pronunciations where word = $1 and voice = $2 and lang = $3',
      [parsed.word, parsed.voice, parsed.lang],
    )
    if (rows[0] && !rows[0].audio_url.includes('/uploads/')) {
      counters.skip++
      return
    }
  }
  if (SYNC_DRY_RUN) {
    counters.uploaded++
    return
  }
  try {
    const localPath = path.join(SYNC_UPLOADS_ROOT, 'pronunciations', key)
    const buf = await fs.promises.readFile(localPath)
    const arrayBuffer = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)
    const audioUrl = await saveAudio('pronunciations', key, arrayBuffer)
    // voice_version = VOICE_VERSION hiện tại — GIẢ ĐỊNH (không xác nhận được từ tên
    // file), chấp nhận được vì hằng số này hiếm đổi.
    await pool.query(
      `insert into public.pronunciations (word, voice, audio_url, lang, voice_version, last_accessed_at)
       values ($1, $2, $3, $4, $5, now())
       on conflict (word, voice, lang) do update set audio_url = excluded.audio_url, last_accessed_at = now()`,
      [parsed.word, parsed.voice, audioUrl, parsed.lang, VOICE_VERSION],
    )
    counters.uploaded++
  } catch (err) {
    counters.errors++
    const message = err instanceof Error ? err.message : String(err)
    logSyncSampleError(message)
    if (samples.length < 5) samples.push(`${key} → ${message}`)
  }
}

async function syncR2Bucket(bucket: R2Bucket): Promise<SyncCounters> {
  process.stdout.write(`\n📤 Bucket "${bucket}" — đang quét ổ đĩa...`)
  const files = await walkMp3(path.join(SYNC_UPLOADS_ROOT, bucket))
  console.log(` ${files.length.toLocaleString('vi-VN')} file .mp3`)

  const counters: SyncCounters = { skip: 0, uploaded: 0, parseError: 0, errors: 0 }
  const samples: string[] = []
  const syncFile = bucket === 'tts-cache' ? syncTtsCacheFile : syncPronunciationFile

  const bar = new cliProgress.SingleBar(
    {
      format: `  |{bar}| {percentage}% | {value}/{total} | ⏭{skip} ${SYNC_DRY_RUN ? 'sẽ tải' : '↑'}{uploaded} ⚠{parseError} ✗{errors}`,
      barCompleteChar: '█',
      barIncompleteChar: '░',
      hideCursor: true,
    },
    cliProgress.Presets.shades_classic,
  )
  bar.start(files.length, 0, { ...counters })

  for (let i = 0; i < files.length; i += SYNC_BATCH_SIZE) {
    await Promise.all(
      files.slice(i, i + SYNC_BATCH_SIZE).map((f) => syncFile(f, counters, samples)),
    )
    bar.update(Math.min(i + SYNC_BATCH_SIZE, files.length), { ...counters })
  }
  bar.stop()

  console.log(
    `  ⏭ Đã ở R2: ${counters.skip}  ${SYNC_DRY_RUN ? 'sẽ tải' : '↑ Đã tải lên'}: ${counters.uploaded}  ⚠ Tên file lạ (bỏ qua): ${counters.parseError}  ✗ Lỗi: ${counters.errors}`,
  )
  if (samples.length > 0) {
    console.log('     Ví dụ (tên lạ/lỗi):')
    for (const s of samples) console.log(`       • ${s}`)
  }
  return counters
}

async function runR2Sync(): Promise<void> {
  const missing = [
    'DATABASE_URL',
    'R2_ACCOUNT_ID',
    'R2_ACCESS_KEY_ID',
    'R2_SECRET_ACCESS_KEY',
    'R2_BUCKET',
    'R2_PUBLIC_BASE_URL',
  ].filter((k) => !process.env[k])
  if (missing.length > 0) {
    console.error(`❌ Thiếu biến môi trường: ${missing.join(', ')}`)
    return
  }
  if (process.env.STORAGE_DRIVER !== 'r2') {
    console.error(
      '❌ Cần STORAGE_DRIVER=r2 khi chạy đồng bộ (saveAudio() mới upload lên R2) — vd:\n' +
        '   STORAGE_DRIVER=r2 npm run seed:all -- --sync-r2 --dry-run',
    )
    return
  }

  console.log(
    '🔄 Quét ổ đĩa VPS → đẩy audio lên Cloudflare R2 + tái tạo dòng DB' +
      (SYNC_DRY_RUN ? ' (DRY-RUN: chỉ đếm)' : '') +
      (FORCE ? ' (FORCE: ghi đè cả dòng đã ở R2)' : ''),
  )
  console.log(`📁 Thư mục nguồn: ${SYNC_UPLOADS_ROOT}`)

  const buckets = resolveSyncBuckets()
  const totals: SyncCounters = { skip: 0, uploaded: 0, parseError: 0, errors: 0 }
  for (const bucket of buckets) {
    const c = await syncR2Bucket(bucket)
    totals.skip += c.skip
    totals.uploaded += c.uploaded
    totals.parseError += c.parseError
    totals.errors += c.errors
  }

  console.log('\n──────────────────────────────────────────────')
  console.log(
    `📦 TỔNG: ⏭ đã ở R2 ${totals.skip}  ${SYNC_DRY_RUN ? 'sẽ tải' : '↑ đã tải lên'} ${totals.uploaded}  ⚠ tên lạ ${totals.parseError}  ✗ lỗi ${totals.errors}`,
  )
  if (SYNC_DRY_RUN) {
    console.log('ℹ️  Đây là DRY-RUN — chưa tải/ghi gì. Bỏ --dry-run để chạy thật.')
  } else if (totals.errors === 0) {
    console.log('✅ Mọi audio trên ổ đĩa đã có dòng DB trỏ về R2.')
  }
}

// ── Kiểm tra ổ đĩa ↔ R2 THẬT (không qua DB) + tuỳ chọn dọn file local đã an toàn ────
// Khác runR2Sync() (đối chiếu qua audio_url trong DB), hàm này liệt kê TRỰC TIẾP object
// trên R2 (ListObjectsV2) rồi so với file trên ổ đĩa — bắt được cả trường hợp DB đã trỏ
// R2 nhưng file thật ra chưa lên/bị hỏng. Chỉ dùng để XÁC NHẬN trước khi xoá local lấy
// lại dung lượng — KHÔNG đụng gì tới nội dung R2/DB.
// Cache client DÙNG CHUNG — trước đây tạo S3Client MỚI mỗi lần gọi, mà deleteStoredFile()
// gọi getR2Client() cho TỪNG file xoá (hàng trăm nghìn lần) → mỗi client giữ connection
// pool/buffer riêng, heap phình dần → OOM. Giống getPgPool(): tạo 1 lần rồi tái dùng.
let cachedR2Client: S3Client | null = null
function getR2Client(): S3Client {
  if (cachedR2Client) return cachedR2Client
  const accountId = process.env.R2_ACCOUNT_ID
  const accessKeyId = process.env.R2_ACCESS_KEY_ID
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY
  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error('Thiếu R2_ACCOUNT_ID/R2_ACCESS_KEY_ID/R2_SECRET_ACCESS_KEY trong .env')
  }
  cachedR2Client = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
    requestChecksumCalculation: 'WHEN_REQUIRED',
  })
  return cachedR2Client
}

// Liệt kê TOÀN BỘ key trong bucket R2 (phân trang 1000 key/lần) → Map<key, size byte>.
async function listAllR2Objects(): Promise<Map<string, number>> {
  const r2Bucket = process.env.R2_BUCKET
  if (!r2Bucket) throw new Error('Thiếu R2_BUCKET trong .env')
  const client = getR2Client()
  const result = new Map<string, number>()
  let continuationToken: string | undefined
  let pages = 0
  process.stdout.write('📥 Đang liệt kê object trên R2...')
  do {
    const res = await client.send(
      new ListObjectsV2Command({ Bucket: r2Bucket, ContinuationToken: continuationToken }),
    )
    for (const obj of res.Contents ?? []) {
      if (obj.Key) result.set(obj.Key, obj.Size ?? -1)
    }
    continuationToken = res.IsTruncated ? res.NextContinuationToken : undefined
    pages++
    if (pages % 20 === 0)
      process.stdout.write(
        `\r📥 Đang liệt kê object trên R2... ${result.size.toLocaleString('vi-VN')} object`,
      )
  } while (continuationToken)
  console.log(`\r📥 R2 hiện có ${result.size.toLocaleString('vi-VN')} object.                    `)
  return result
}

// Xoá file audio thật (local hoặc R2) ứng với 1 audio_url — tự nhận diện driver theo URL
// (R2_PUBLIC_BASE_URL khớp tiền tố → R2, ngược lại → local dưới UPLOADS_DIR).
async function deleteStoredFile(audioUrl: string): Promise<void> {
  const r2Base = (process.env.R2_PUBLIC_BASE_URL || '').replace(/\/$/, '')
  if (r2Base && audioUrl.startsWith(r2Base + '/')) {
    const bucket = process.env.R2_BUCKET
    if (!bucket) throw new Error('Thiếu R2_BUCKET trong .env')
    const key = audioUrl.slice(r2Base.length + 1)
    await getR2Client().send(new DeleteObjectCommand({ Bucket: bucket, Key: key }))
    return
  }
  const marker = '/uploads/'
  const idx = audioUrl.indexOf(marker)
  if (idx === -1) throw new Error(`Không nhận diện được đường dẫn lưu trữ: ${audioUrl}`)
  const relative = audioUrl.slice(idx + marker.length)
  await fs.promises.unlink(path.join(SYNC_UPLOADS_ROOT, relative))
}

// Xoá THẬT các bản ghi + file dư thừa (orphan) phát hiện ở verifyDb() — mặc định (không có
// --yes) CHỈ XEM TRƯỚC, không xoá gì. CHỈ xoá file nếu KHÔNG có bản ghi nào khác (còn nằm
// trong tập kỳ vọng) đang trỏ tới CÙNG audio_url — trường hợp remap giọng mới DÙNG LẠI
// audio_url của giọng cũ (xem OLD_VOICE_ALIAS) thì xoá file sẽ làm hỏng cả bản ghi đang
// dùng thật, nên những trường hợp đó chỉ xoá bản ghi DB thừa, GIỮ NGUYÊN file.
async function cleanOrphans(
  ttsOrphans: { hash: string; audio_url: string }[],
  pronOrphansList: { word: string; voice: string; lang: string; audio_url: string }[],
  activeAudioUrls: Set<string>,
  confirmYes = VERIFY_CONFIRM_YES,
): Promise<void> {
  const pool = getPgPool()
  const totalCandidates = ttsOrphans.length + pronOrphansList.length
  if (totalCandidates === 0) {
    console.log('\n✨ Không có bản ghi dư thừa nào để dọn.')
    return
  }

  const fileDeletable = [...ttsOrphans, ...pronOrphansList].filter(
    (r) => !activeAudioUrls.has(r.audio_url),
  ).length

  if (!confirmYes) {
    console.log(
      `\n👀 XEM TRƯỚC (--clean-orphans): sẽ xoá ${totalCandidates} bản ghi DB` +
        ` (${fileDeletable} kèm xoá file thật — ${totalCandidates - fileDeletable} bản ghi` +
        ` còn lại dùng CHUNG file với bản ghi đang hoạt động nên GIỮ LẠI file, chỉ xoá bản` +
        ` ghi thừa). Thêm --yes để xoá thật (vd: npm run seed:all -- --verify --clean-orphans --yes).`,
    )
    return
  }

  console.log(`\n🗑️  Đang xoá ${totalCandidates} bản ghi dư thừa (--yes đã bật)...`)
  let filesDeleted = 0
  let fileErrors = 0
  let rowsDeleted = 0

  // Vòng lặp có thể chạy hàng trăm nghìn dòng (xoá từng dòng qua network) — không có
  // progress bar trông như treo, không biết đang xoá tới đâu. Cập nhật mỗi 200 dòng để
  // không làm chậm vòng lặp (in ra console mỗi dòng mới tốn thời gian).
  const delBar = new cliProgress.SingleBar(
    { format: '  |{bar}| {percentage}% | {value}/{total} bản ghi', hideCursor: true },
    cliProgress.Presets.shades_classic,
  )
  delBar.start(totalCandidates, 0)

  const bumpProgress = (): void => {
    rowsDeleted++
    if (rowsDeleted % 50 === 0) delBar.update(rowsDeleted)
  }

  await runWithConcurrency(ttsOrphans, DELETE_CONCURRENCY, async (r) => {
    if (!activeAudioUrls.has(r.audio_url)) {
      try {
        await deleteStoredFile(r.audio_url)
        filesDeleted++
      } catch (err) {
        fileErrors++
        console.error(
          `\n❌ Không xoá được file ${r.audio_url}: ${err instanceof Error ? err.message : String(err)}`,
        )
      }
    }
    await withDbRetry(
      () => pool.query('delete from public.tts_cache where hash = $1', [r.hash]),
      `xoá orphan tts_cache ${r.hash}`,
    )
    bumpProgress()
  })
  await runWithConcurrency(pronOrphansList, DELETE_CONCURRENCY, async (r) => {
    if (!activeAudioUrls.has(r.audio_url)) {
      try {
        await deleteStoredFile(r.audio_url)
        filesDeleted++
      } catch (err) {
        fileErrors++
        console.error(
          `\n❌ Không xoá được file ${r.audio_url}: ${err instanceof Error ? err.message : String(err)}`,
        )
      }
    }
    await withDbRetry(
      () =>
        pool.query(
          'delete from public.pronunciations where word = $1 and voice = $2 and lang = $3',
          [r.word, r.voice, r.lang],
        ),
      `xoá orphan pronunciations ${r.word}/${r.voice}/${r.lang}`,
    )
    bumpProgress()
  })
  delBar.update(rowsDeleted)
  delBar.stop()

  console.log(
    `✅ Đã xoá ${rowsDeleted} bản ghi DB, ${filesDeleted} file` +
      (fileErrors ? `, ❌ ${fileErrors} file lỗi (xem log ở trên).` : '.'),
  )
}

interface VerifyLocalFile {
  bucket: R2Bucket
  rel: string
  fullPath: string
  r2Key: string
}

async function runVerifyR2(): Promise<void> {
  if (VERIFY_DELETE_VERIFIED && !VERIFY_CONFIRM_YES) {
    console.log('ℹ️  Chế độ XEM TRƯỚC (--delete-verified không kèm --yes) — sẽ KHÔNG xoá gì.\n')
  }

  const r2Objects = await listAllR2Objects()

  const localFiles: VerifyLocalFile[] = []
  for (const bucket of ['tts-cache', 'pronunciations'] as R2Bucket[]) {
    const rels = await walkMp3(path.join(SYNC_UPLOADS_ROOT, bucket))
    for (const rel of rels) {
      localFiles.push({
        bucket,
        rel,
        fullPath: path.join(SYNC_UPLOADS_ROOT, bucket, rel),
        r2Key: `${bucket}/${rel}`,
      })
    }
  }
  console.log(
    `📁 Ổ đĩa VPS có ${localFiles.length.toLocaleString('vi-VN')} file .mp3 (2 thư mục cộng lại).\n`,
  )

  const missing: VerifyLocalFile[] = []
  const sizeMismatch: VerifyLocalFile[] = []
  const verified: VerifyLocalFile[] = []

  const bar = new cliProgress.SingleBar(
    { format: '  |{bar}| {percentage}% | {value}/{total}', hideCursor: true },
    cliProgress.Presets.shades_classic,
  )
  bar.start(localFiles.length, 0)

  for (let i = 0; i < localFiles.length; i++) {
    const f = localFiles[i]!
    const r2Size = r2Objects.get(f.r2Key)
    if (r2Size === undefined) {
      missing.push(f)
    } else if (!VERIFY_SKIP_SIZE_CHECK) {
      const localSize = (await fs.promises.stat(f.fullPath)).size
      if (localSize !== r2Size) sizeMismatch.push(f)
      else verified.push(f)
    } else {
      verified.push(f)
    }
    if (i % 500 === 0) bar.update(i)
  }
  bar.update(localFiles.length)
  bar.stop()

  console.log('\n──────────────────────────────────────────────')
  console.log(`✅ Khớp R2 (an toàn): ${verified.length.toLocaleString('vi-VN')}`)
  console.log(`❌ THIẾU trên R2: ${missing.length.toLocaleString('vi-VN')}`)
  console.log(`⚠️  Kích thước LỆCH: ${sizeMismatch.length.toLocaleString('vi-VN')}`)

  if (missing.length > 0) {
    console.log('\n   Ví dụ file thiếu trên R2:')
    for (const f of missing.slice(0, 10)) console.log(`     • ${f.r2Key}`)
  }
  if (sizeMismatch.length > 0) {
    console.log('\n   Ví dụ file lệch kích thước:')
    for (const f of sizeMismatch.slice(0, 10)) console.log(`     • ${f.r2Key}`)
  }

  const allSafe = missing.length === 0 && sizeMismatch.length === 0
  if (allSafe) {
    console.log('\n🎉 TOÀN BỘ file local đã có bản khớp trên R2 — an toàn để xoá local.')
  } else {
    console.log(
      `\n⛔ CHƯA an toàn xoá toàn bộ — còn ${missing.length + sizeMismatch.length} file chưa khớp R2.` +
        ' Chạy lại đồng bộ (menu "s" hoặc --sync-r2, không cần --force) rồi verify lại.',
    )
  }

  if (!VERIFY_DELETE_VERIFIED) {
    console.log(
      '\nℹ️  Muốn xoá file local đã xác nhận khớp R2: thêm --delete-verified (xem trước) rồi --yes (xoá thật).',
    )
    return
  }

  // Chỉ xoá TỪNG FILE đã verified — file missing/mismatch luôn được GIỮ LẠI dù dùng --delete-verified.
  if (verified.length === 0) {
    console.log('\nℹ️  Không có file nào để xoá (0 file đã xác nhận khớp R2).')
    return
  }
  if (!VERIFY_CONFIRM_YES) {
    console.log(
      `\n👀 XEM TRƯỚC: sẽ xoá ${verified.length.toLocaleString('vi-VN')} file local đã khớp R2 (chưa xoá — thêm --yes để xoá thật).`,
    )
    return
  }

  console.log(
    `\n🗑️  Đang xoá ${verified.length.toLocaleString('vi-VN')} file local đã xác nhận khớp R2...`,
  )
  let deleted = 0
  let deleteErrors = 0
  const delBar = new cliProgress.SingleBar(
    { format: '  |{bar}| {percentage}% | {value}/{total}', hideCursor: true },
    cliProgress.Presets.shades_classic,
  )
  delBar.start(verified.length, 0)
  for (let i = 0; i < verified.length; i++) {
    const f = verified[i]!
    try {
      await fs.promises.unlink(f.fullPath)
      deleted++
    } catch (err) {
      deleteErrors++
      console.error(
        `\n❌ Không xoá được ${f.fullPath}: ${err instanceof Error ? err.message : String(err)}`,
      )
    }
    if (i % 500 === 0) delBar.update(i)
  }
  delBar.update(verified.length)
  delBar.stop()
  console.log(
    `\n✅ Đã xoá ${deleted.toLocaleString('vi-VN')} file. ${deleteErrors > 0 ? `❌ Lỗi: ${deleteErrors}` : ''}`,
  )
  console.log('ℹ️  Chạy `du -sh uploads/` để xem dung lượng đã giải phóng.')
}

// Giới hạn số request ElevenLabs chạy ĐỒNG THỜI. runBatch bắn 50 tác vụ song song — hợp với Google
// nhưng ElevenLabs chỉ cho vài request đồng thời tuỳ gói (vượt → 429 `too_many_concurrent_requests`),
// nên mọi lời gọi ElevenLabs phải xếp hàng qua đây.
let elevenActive = 0
const elevenWaiters: Array<() => void> = []
async function limitEleven<T>(fn: () => Promise<T>): Promise<T> {
  if (elevenActive >= ELEVEN_CONCURRENCY) {
    await new Promise<void>((resolve) => elevenWaiters.push(resolve))
  }
  elevenActive++
  try {
    return await fn()
  } finally {
    elevenActive--
    elevenWaiters.shift()?.()
  }
}

// ── Xử lý 1 tác vụ ──────────────────────────────────────────────────────────
// remapOnly=true: KHÔNG được gọi Google TTS trong bất kỳ trường hợp nào — dùng cho lựa
// chọn menu "Remap TOÀN BỘ" / cờ --remap-only, chỉ tái dùng audio cache đã có sẵn (đổi
// tên giọng, đổi lược đồ hash...), chạy nhanh vì không tốn round-trip API + không cần key.
// Tác vụ không remap được sẽ trả lỗi rõ ràng (ghi vào file lỗi) để seed lại BÌNH THƯỜNG
// (không --remap-only) khi có key, thay vì âm thầm bỏ qua.
async function processTask(task: AnyTask, remapOnly = false): Promise<TaskResult> {
  const pool = getPgPool()

  try {
    if (task.type === 'pron') {
      const { word, voice, lang: pronLang } = task

      // Trước khi gọi Google TTS: thử remap từ cache cũ dưới TÊN GIỌNG CŨ (đợt đổi tên
      // 2026-07-21: female→Kore, male→Puck...) — audio KHÔNG mã hoá (khác tts_cache) nên
      // chỉ cần copy nguyên audio_url sang dòng mới, không cần tải/upload lại gì cả.
      // Giọng Studio không có tiền thân (voice mới hoàn toàn) nên bỏ qua nhánh này.
      // Chỉ áp cho tiếng Anh: đợt đổi tên giọng 2026-07-21 chỉ có dòng en-US, không có dòng
      // vi-VN nào để tái dùng.
      if (!FORCE && !isValidStudioVoice(voice) && pronLang === 'en-US') {
        const oldVoiceName = OLD_VOICE_ALIAS[voice]
        if (oldVoiceName) {
          const { rows: oldRows } = await pool.query<{ audio_url: string }>(
            'select audio_url from public.pronunciations where word = $1 and voice = $2 and lang = $3',
            [word, oldVoiceName, pronLang],
          )
          const oldAudioUrl = oldRows[0]?.audio_url
          if (oldAudioUrl) {
            await pool.query(
              `insert into public.pronunciations (word, voice, audio_url, lang, voice_version, last_accessed_at)
               values ($1, $2, $3, $4, $5, now())
               on conflict (word, voice, lang) do update set
                 audio_url = excluded.audio_url, voice_version = excluded.voice_version,
                 last_accessed_at = now()`,
              [word, voice, oldAudioUrl, pronLang, VOICE_VERSION],
            )
            return { status: 'remapped' }
          }
        }
      }

      if (remapOnly) {
        return {
          status: 'error',
          message:
            'remap-only: chưa có cache giọng cũ để tái dùng — cần chạy seed thật (có key TTS)',
        }
      }

      const audioBuffer = isValidStudioVoice(voice)
        ? await generateStudioAudioFromGoogle(word, voice)
        : await generateAudioFromGoogle(word, voice, pronLang)
      // encodeURIComponent — GIỐNG HỆT api/pronunciation.ts (API thật) — để hỗ trợ từ
      // có dấu (café, naïve...) trong URL, dù key thô vẫn hợp lệ với R2/local.
      // Tên file en-US GIỮ NGUYÊN dạng cũ (không có phần lang) để 194.688 file đã seed trước
      // đây không bị đổi tên/tải lại; chỉ ngôn ngữ mới mới gắn hậu tố lang.
      const fileName =
        pronLang === 'en-US'
          ? `${encodeURIComponent(word)}-${voice}.mp3`
          : `${encodeURIComponent(word)}-${voice}-${pronLang}.mp3`
      const audioUrl = await saveAudio('pronunciations', fileName, audioBuffer, BASE_URL)
      await pool.query(
        `insert into public.pronunciations (word, voice, audio_url, lang, voice_version, last_accessed_at)
         values ($1, $2, $3, $4, $5, now())
         on conflict (word, voice, lang) do update set
           audio_url = excluded.audio_url, voice_version = excluded.voice_version,
           last_accessed_at = now()`,
        [word, voice, audioUrl, pronLang, VOICE_VERSION],
      )
      return { status: 'ok' }
    }

    // pattern task
    const { text, lang, voice } = task
    const hash = hashText(text, lang, voice)

    if (!FORCE) {
      const { rows } = await pool.query('select audio_url from public.tts_cache where hash = $1', [
        hash,
      ])
      if (rows.length > 0) return { status: 'skip' }
    }

    // Trước khi gọi Google TTS: thử remap từ cache cũ, theo 2 lược đồ hash cũ (thử lần
    // lượt, dừng ở lược đồ đầu tiên tìm thấy):
    //   1. Thiếu hẳn VOICE_VERSION (từ hồi khái niệm này chưa tồn tại)
    //   2. Đúng VOICE_VERSION cũ NHƯNG tên giọng cũ (đợt đổi tên 2026-07-21:
    //      female/male/female2/male2 → Kore/Puck/Aoede/Charon — CÙNG 1 giọng Google,
    //      chỉ đổi định danh trong app)
    // Nếu có → tải về → giải mã bằng hash cũ → re-encrypt bằng hash mới → upload.
    // Không tốn API quota, chỉ tốn băng thông Storage. Giọng Studio/Gemini không có tiền thân
    // (voice mới hoàn toàn, chưa từng đổi tên) nên bỏ qua nhánh này.
    if (
      !FORCE &&
      !isValidStudioVoice(voice) &&
      !isValidGeminiVoice(voice) &&
      !isValidElevenVoice(voice)
    ) {
      const legacyHashes = [
        oldHashText(text, lang, voice as VoiceId),
        legacyVoiceNameHash(text, lang, voice as VoiceId),
      ].filter((h): h is string => h !== null)

      for (const oldHash of legacyHashes) {
        const { rows: oldRows } = await pool.query<{ audio_url: string; iv: string | null }>(
          'select audio_url, iv from public.tts_cache where hash = $1',
          [oldHash],
        )
        const oldCached = oldRows[0]
        if (!oldCached?.audio_url) continue
        try {
          const res = await fetch(oldCached.audio_url)
          if (res.ok) {
            // Giải mã bản CŨ bằng iv của chính nó (null = bản ghi trước migration 0038 → iv
            // suy từ hash), rồi mã hoá lại bằng iv NGẪU NHIÊN mới và lưu iv đó kèm bản ghi mới.
            const plain = await decryptAudio(await res.arrayBuffer(), oldHash, oldCached.iv)
            const { cipher: newCipher, iv_b64: newIvB64 } = await encryptAudio(plain, hash)
            const fileName = `${lang}/${voice}/${hash}.mp3`
            const audioUrl = await saveAudio('tts-cache', fileName, newCipher, BASE_URL)
            await pool.query(
              `insert into public.tts_cache (hash, lang, voice, audio_url, iv, last_accessed_at)
               values ($1, $2, $3, $4, $5, now())
               on conflict (hash) do update set
                 audio_url = excluded.audio_url, iv = excluded.iv, last_accessed_at = now()`,
              [hash, lang, voice, audioUrl, newIvB64],
            )
            return { status: 'remapped' }
          }
        } catch {
          // Remap thất bại (file hỏng, mạng lỗi...) → thử lược đồ kế tiếp / generate mới bên dưới
        }
      }
    }

    if (remapOnly) {
      return {
        status: 'error',
        message: 'remap-only: chưa có cache giọng cũ để tái dùng — cần chạy seed thật (có key TTS)',
      }
    }

    let audioBuffer: ArrayBuffer
    // Mốc khẩu hình thật — chỉ ElevenLabs có (endpoint /with-timestamps). Dựng lỗi thì để null,
    // client tự ước lượng như cũ (giống nhánh /api/tts), KHÔNG làm hỏng việc seed.
    let visemeTimeline: unknown[] | null = null
    if (isValidElevenVoice(voice)) {
      const result = await limitEleven(() =>
        generateAudioFromElevenLabs(text, voice, toneOf(task.cat)),
      )
      audioBuffer = result.audio
      if (result.alignment) {
        visemeTimeline = await visemeTimelineFromAlignment(result.alignment, lang).catch(() => null)
      }
    } else if (isValidGeminiVoice(voice)) {
      audioBuffer = await generateAudioFromGemini(text, voice)
    } else if (isValidStudioVoice(voice)) {
      audioBuffer = await generateStudioAudioFromGoogle(text, voice)
    } else {
      audioBuffer = await generateAudioFromGoogle(text, voice as VoiceId, lang)
    }
    // iv NGẪU NHIÊN mỗi lần mã hoá, PHẢI lưu kèm bản ghi (migration 0038).
    const { cipher: encrypted, iv_b64: ivB64 } = await encryptAudio(audioBuffer, hash)
    const ext = isValidGeminiVoice(voice) ? 'wav' : 'mp3'
    const fileName = `${lang}/${voice}/${hash}.${ext}`
    const audioUrl = await saveAudio('tts-cache', fileName, encrypted, BASE_URL)
    await pool.query(
      `insert into public.tts_cache (hash, lang, voice, audio_url, iv, viseme_timeline, last_accessed_at)
       values ($1, $2, $3, $4, $5, $6, now())
       on conflict (hash) do update set
         audio_url = excluded.audio_url, iv = excluded.iv,
         viseme_timeline = coalesce(excluded.viseme_timeline, public.tts_cache.viseme_timeline),
         last_accessed_at = now()`,
      [hash, lang, voice, audioUrl, ivB64, visemeTimeline ? JSON.stringify(visemeTimeline) : null],
    )
    return { status: 'ok' }
  } catch (err) {
    return { status: 'error', message: err instanceof Error ? err.message : String(err) }
  }
}

// In ra MẪU lỗi thật ngay khi gặp (chỉ lần đầu mỗi loại) — trước đây script chỉ đếm số
// lỗi, không bao giờ lộ ra LÝ DO lỗi (kể cả file lỗi cuối cùng cũng chỉ lưu từ/câu, không
// lưu message), nên không ai đoán được là hết quota (429), lỗi mạng hay lỗi Storage/DB.
const seenErrorMessages = new Set<string>()
function logSampleError(message: string): void {
  const key = message.slice(0, 80)
  if (seenErrorMessages.has(key)) return
  seenErrorMessages.add(key)
  if (seenErrorMessages.size > 8) return // đủ mẫu, tránh spam nếu có nhiều loại lỗi khác nhau
  process.stdout.write(`\n🔎 Mẫu lỗi mới: ${message.slice(0, 200)}\n`)
}

// Trạng thái rate limit thích nghi — dùng chung trong 1 pass
interface RateState {
  limit: number // ngưỡng req hiện tại
  pauseMs: number // thời gian nghỉ hiện tại
  count: number // đếm req trong window hiện tại
  has429: boolean // window hiện tại có gặp lỗi 429 không
}

function nextRateState(prevReqs: number, prev429: boolean): { limit: number; pauseMs: number } {
  if (prev429) return { limit: 180, pauseMs: 62000 } // 429 → nghỉ 62s
  if (prevReqs >= 180) return { limit: 180, pauseMs: 62000 } // đầy window → nghỉ 62s
  return { limit: 180, pauseMs: 0 } // chưa đầy → liên tục
}

// ── Chạy 1 batch tác vụ + cập nhật progress bar ─────────────────────────────
async function runBatch(
  tasks: AnyTask[],
  failed: Array<{ task: AnyTask; message: string }>,
  counters: { ok: number; remapped: number; skip: number; errors: number },
  bar: cliProgress.SingleBar,
  processed: { value: number },
  total: number,
  rate: RateState,
  remapOnly = false,
): Promise<void> {
  const results = await Promise.all(tasks.map((t) => processTask(t, remapOnly)))
  let newReqs = 0
  results.forEach((result, idx) => {
    if (result.status === 'ok') {
      counters.ok++
      if (!remapOnly) newReqs++ // gọi Google TTS → tính rate (remapOnly không gọi API)
    } else if (result.status === 'remapped') {
      counters.remapped++ // re-encrypt, không tốn API
    } else if (result.status === 'skip') {
      counters.skip++
    } else {
      counters.errors++
      if (!remapOnly) newReqs++
      if (result.message.includes('429')) rate.has429 = true
      logSampleError(result.message)
      failed.push({ task: tasks[idx]!, message: result.message }) // idx khớp tasks nên có
    }
  })
  rate.count += newReqs
  processed.value = Math.min(processed.value + tasks.length, total)
  bar.update(processed.value, { ...counters })
  if (DELAY_MS > 0) await sleep(DELAY_MS)
  // remapOnly không gọi API → không cần nghỉ theo rate limit Google (chạy liên tục cho nhanh)
  if (!remapOnly && rate.count >= rate.limit) {
    const prevReqs = rate.count
    const prev429 = rate.has429
    const next = nextRateState(prevReqs, prev429)
    rate.count = 0
    rate.has429 = false
    rate.limit = next.limit
    rate.pauseMs = next.pauseMs
    bar.stop()
    process.stdout.write(
      `\n⏸  ${prevReqs} req${prev429 ? ' [429!]' : ''} → nghỉ ${next.pauseMs / 1000}s, limit tiếp=${next.limit}\n`,
    )
    await sleep(next.pauseMs)
    bar.start(total, processed.value, { ...counters })
  }
}

// ── Chạy 1 pass trên 1 danh sách tác vụ (có thanh tiến độ) ───────────────────
async function runPass(
  tasks: AnyTask[],
  label: string,
  remapOnly = false,
): Promise<Array<{ task: AnyTask; message: string }>> {
  const total = tasks.length
  console.log(`\n${label} — ${total} tác vụ`)

  const bar = new cliProgress.SingleBar(
    {
      format:
        'Tiến độ |{bar}| {percentage}% | {value}/{total} | ✓{ok} ↺{remapped} ⏭{skip} ✗{errors}',
      barCompleteChar: '█',
      barIncompleteChar: '░',
      hideCursor: true,
    },
    cliProgress.Presets.shades_classic,
  )
  bar.start(total, 0, { ok: 0, remapped: 0, skip: 0, errors: 0 })

  const counters = { ok: 0, remapped: 0, skip: 0, errors: 0 }
  const processed = { value: 0 }
  const rate: RateState = { limit: RATE_LIMIT_DEFAULT, pauseMs: 0, count: 0, has429: false }
  const failed: Array<{ task: AnyTask; message: string }> = []

  for (let i = 0; i < tasks.length; i += BATCH_SIZE) {
    await runBatch(
      tasks.slice(i, i + BATCH_SIZE),
      failed,
      counters,
      bar,
      processed,
      total,
      rate,
      remapOnly,
    )
  }

  bar.stop()
  console.log(
    `   ✓ OK: ${counters.ok}  ↺ Remap: ${counters.remapped}  ⏭ Skip: ${counters.skip}  ✗ Lỗi: ${failed.length}`,
  )
  return failed
}

// ── Seed 1 danh sách: pass đầu + các vòng retry cho tới khi hết/ngừng giảm ───
// remapOnly=true: chỉ chạy ĐÚNG 1 vòng — lỗi "chưa có cache cũ để remap" không tự hết dù
// retry bao nhiêu lần (không gọi API để tạo mới), nên retry chỉ tốn thời gian vô ích.
async function seedWithRetry(
  tasks: AnyTask[],
  baseLabel: string,
  remapOnly = false,
): Promise<AnyTask[]> {
  if (tasks.length === 0) return []
  let failed = await runPass(tasks, `🟢 ${baseLabel} — Vòng 1`, remapOnly)
  let remaining = failed.map((f) => f.task)
  if (remapOnly) return remaining
  let prevErr = Infinity

  for (let round = 2; round <= MAX_ROUNDS && remaining.length > 0; round++) {
    if (remaining.length >= prevErr) {
      console.log(`\n⛔ Lỗi không giảm (${remaining.length}) — dừng retry.`)
      break
    }
    prevErr = remaining.length
    console.log(`\n⏳ Nghỉ ${RETRY_DELAY_MS / 1000}s...`)
    await sleep(RETRY_DELAY_MS)
    failed = await runPass(remaining, `🔄 ${baseLabel} — Vòng ${round} (còn ${remaining.length})`)
    remaining = failed.map((f) => f.task)
  }
  return remaining
}

// ── Đọc bảng theo trang bằng KEYSET (cursor), xử lý TỪNG TRANG (không gom hết) ──
// KEYSET = `where (khóa) > (khóa_cuối_trang_trước)` thay cho OFFSET. OFFSET phải QUÉT &
// BỎ QUA toàn bộ dòng trước mỗi trang → O(n²): ở bảng >1 triệu dòng, trang cuối phải quét
// cả triệu dòng chỉ để lấy 1000 (chậm tới mức "treo"). Keyset dùng index khóa → mỗi trang
// O(log n), tổng O(n). keyCols PHẢI là khóa DUY NHẤT & NOT NULL (PK/unique) và NẰM TRONG
// `columns` (để đọc được giá trị cursor):
//   • tts_cache       → ['hash']          (primary key)
//   • pronunciations  → ['word','voice']  (unique (word,voice))
// onPage nhận từng trang (tối đa 1000 dòng) → caller tự gom/aggregate, KHÔNG bắt buộc giữ
// toàn bộ bảng trong RAM (tránh OOM khi bảng rất lớn).
async function streamRows<T extends QueryResultRow>(
  table: string,
  columns: string,
  keyCols: string[],
  onPage: (rows: T[]) => void,
): Promise<void> {
  const pool = getPgPool()
  const PAGE = 1000
  const orderBy = keyCols.join(', ')
  // So sánh bộ giá trị (row-value): `(a, b) > ($1, $2)` đúng bằng thứ tự ORDER BY a, b.
  const keyTuple = keyCols.length === 1 ? keyCols[0]! : `(${keyCols.join(', ')})`
  const placeholders =
    keyCols.length === 1 ? '$1' : `(${keyCols.map((_, i) => `$${i + 1}`).join(', ')})`
  let cursor: unknown[] | null = null
  for (;;) {
    const where = cursor ? `where ${keyTuple} > ${placeholders}` : ''
    const params = cursor ?? []
    const { rows } = await withDbRetry(
      () =>
        pool.query<T>(
          `select ${columns} from public.${table} ${where} order by ${orderBy} limit ${PAGE}`,
          params,
        ),
      `đọc ${table}`,
    )
    if (rows.length === 0) break
    onPage(rows)
    const last = rows[rows.length - 1] as Record<string, unknown>
    cursor = keyCols.map((c) => last[c])
    if (rows.length < PAGE) break
  }
}

// Gom TẤT CẢ dòng vào 1 mảng — tiện cho bảng NHỎ (vd pronunciations). Với bảng LỚN
// (tts_cache >1 triệu dòng) nên dùng streamRows trực tiếp để không giữ hết trong RAM.
async function fetchAllRows<T extends QueryResultRow>(
  table: string,
  columns: string,
  keyCols: string[],
): Promise<T[]> {
  const out: T[] = []
  await streamRows<T>(table, columns, keyCols, (rows) => {
    for (const r of rows) out.push(r)
  })
  return out
}

// ── Kiểm tra DB → tính done/total/remaining cho từng nhóm ────────────────────
interface CatStat {
  id: CatId
  label: string
  total: number
  done: number
  remaining: AnyTask[]
}

async function audit(allByCat: Map<CatId, AnyTask[]>): Promise<CatStat[]> {
  process.stdout.write('🔎 Đang kiểm tra DB (pronunciations + tts_cache)...')

  // Tập đã có trên DB
  const pronRows = await fetchAllRows<{ word: string; voice: string; lang: string }>(
    'pronunciations',
    'word, voice, lang',
    ['word', 'voice', 'lang'],
  )
  const donePron = new Set(pronRows.map((r) => pronKey(r.word, r.voice, r.lang)))
  const ttsRows = await fetchAllRows<{ hash: string }>('tts_cache', 'hash', ['hash'])
  const doneHash = new Set(ttsRows.map((r) => r.hash))

  process.stdout.write(` xong (${donePron.size} phát âm, ${doneHash.size} câu TTS)\n`)

  const isDone = (t: AnyTask): boolean =>
    t.type === 'pron'
      ? donePron.has(pronKey(t.word, t.voice, t.lang))
      : doneHash.has(hashText(t.text, t.lang, t.voice))

  const stats: CatStat[] = []
  for (const { id, label } of CATEGORIES) {
    const tasks = allByCat.get(id) ?? []
    const done = tasks.reduce((n, t) => n + (isDone(t) ? 1 : 0), 0)
    // FORCE: seed lại tất cả; bình thường: chỉ seed tác vụ chưa có
    const remaining = FORCE ? tasks.slice() : tasks.filter((t) => !isDone(t))
    stats.push({ id, label, total: tasks.length, done, remaining })
  }
  return stats
}

// ── In báo cáo tiến độ ──────────────────────────────────────────────────────
function bar10(pct: number): string {
  const filled = Math.round((pct / 100) * 10)
  return '▓'.repeat(filled) + '░'.repeat(10 - filled)
}

function printReport(stats: CatStat[]): void {
  let grandTotal = 0,
    grandDone = 0
  const labelWidth = Math.max(...CATEGORIES.map((c) => c.label.length))

  console.log('\n📊 BÁO CÁO TIẾN ĐỘ SEED (sẵn sàng cho client)')
  console.log('─'.repeat(labelWidth + 34))
  for (const s of stats) {
    grandTotal += s.total
    grandDone += s.done
    const pct = s.total === 0 ? 100 : (s.done / s.total) * 100
    const tag = s.total === 0 ? '∅' : pct >= 100 ? '✅' : '⏳'
    const counts = `${s.done}/${s.total}`.padStart(13)
    console.log(
      `  ${tag} ${s.label.padEnd(labelWidth)}  ${counts}  ${bar10(pct)} ${pct.toFixed(1).padStart(5)}%`,
    )
  }
  console.log('─'.repeat(labelWidth + 34))
  const gPct = grandTotal === 0 ? 100 : (grandDone / grandTotal) * 100
  const gCounts = `${grandDone}/${grandTotal}`.padStart(13)
  console.log(
    `  📦 ${'TỔNG CỘNG'.padEnd(labelWidth)}  ${gCounts}  ${bar10(gPct)} ${gPct.toFixed(1).padStart(5)}%`,
  )
  if (gPct >= 100)
    console.log('\n🎉 Tất cả đã seed xong — client dùng được ngay, không cần gọi TTS realtime.')
  else
    console.log(`\nℹ️  Còn ${(grandTotal - grandDone).toLocaleString('vi-VN')} tác vụ chưa seed.`)
}

// ── Thống kê THẬT trên Cloudflare R2 (đếm object thật, không qua DB/ổ đĩa) ──────
// Khác báo cáo ở trên (đếm DÒNG DB, tin audio_url là đúng): hàm này liệt kê TRỰC TIẾP
// object trên R2 — cần khi ổ đĩa local đã xóa (không còn đối chiếu được qua walkMp3 nữa),
// muốn biết THẬT SỰ đang có bao nhiêu file trên R2. Mỗi object là 1 key duy nhất trong
// Map (listAllR2Objects) nên không đếm trùng.
let cachedR2Counts: Record<string, number> | null = null
async function getR2Counts(forceRefresh = false): Promise<Record<string, number> | null> {
  if (cachedR2Counts && !forceRefresh) return cachedR2Counts
  const missing = ['R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET'].filter(
    (k) => !process.env[k],
  )
  if (missing.length > 0) return null // R2 chưa cấu hình đủ — bỏ qua, không phải lỗi
  try {
    const objects = await listAllR2Objects()
    const counts: Record<string, number> = {}
    for (const key of objects.keys()) {
      const bucket = key.split('/')[0] ?? 'khác'
      counts[bucket] = (counts[bucket] ?? 0) + 1
    }
    cachedR2Counts = counts
    return counts
  } catch (err) {
    console.error(
      `⚠️  Không lấy được thống kê R2: ${err instanceof Error ? err.message : String(err)}`,
    )
    return null
  }
}

function printR2Report(r2Counts: Record<string, number> | null): void {
  if (!r2Counts) return // R2 chưa cấu hình trong .env — im lặng bỏ qua
  const total = Object.values(r2Counts).reduce((s, n) => s + n, 0)
  console.log('\n☁️  THỰC TẾ TRÊN CLOUDFLARE R2 (đếm object thật, không qua DB)')
  for (const [bucket, n] of Object.entries(r2Counts).sort((a, b) => b[1] - a[1])) {
    console.log(`  • ${bucket}: ${n.toLocaleString('vi-VN')} file`)
  }
  console.log(`  📦 TỔNG trên R2: ${total.toLocaleString('vi-VN')} file`)
}

// ── KIỂM TRA KỸ DB: đối chiếu dữ liệu đã seed với tập KỲ VỌNG ────────────────
// Khác `audit()` (chỉ đếm có/thiếu). Hàm này đối chiếu HAI CHIỀU vì đã seed rất nhiều:
//   • Chiều thiếu : câu kỳ vọng nào CHƯA có trong DB (theo nhóm).
//   • Chiều thừa  : bản ghi nào trong DB KHÔNG còn nằm trong tập kỳ vọng
//                   (vd. female2/male2 của Cụm từ đã bỏ, hoặc VOICE_VERSION cũ) → "orphan".
//   • Nhất quán   : audio_url có đúng dạng `${lang}/${voice}/${hash}.mp3` không.
//   • (tùy chọn)  : VERIFY_DECRYPT=N → tải + giải mã thử N file để chắc dùng được thật.
async function verifyDb(
  allByCat: Map<CatId, AnyTask[]>,
  opts: { cleanOrphans?: boolean; confirmYes?: boolean; patternsAreFull?: boolean } = {},
): Promise<void> {
  const doClean = opts.cleanOrphans ?? CLEAN_ORPHANS
  const confirmYes = opts.confirmYes ?? VERIFY_CONFIRM_YES
  const patternsAreFull = opts.patternsAreFull ?? false
  console.log('\n🔬 KIỂM TRA KỸ DB — đối chiếu hash kỳ vọng với dữ liệu đã seed')

  // 1) Tập KỲ VỌNG: hash TTS (kèm VOICE_VERSION) + key phát âm
  const expectedTts = new Set<string>() // hash câu TTS kỳ vọng
  const expectedPron = new Set<string>() // `word:voice:lang` phát âm kỳ vọng
  for (const { id } of CATEGORIES) {
    for (const t of allByCat.get(id) ?? []) {
      if (t.type === 'pron') expectedPron.add(pronKey(t.word, t.voice, t.lang))
      else expectedTts.add(hashText(t.text, t.lang, t.voice))
    }
  }
  // Bảo vệ câu pattern hợp lệ ở giọng/version hiện tại nhưng ngoài seed-index (seed đủ
  // 100/chủ thể từ trước, hoặc dở dang) — KHÔNG coi là orphan, vì /api/tts vẫn phục vụ
  // đúng. GỘP THẲNG vào expectedTts (thay vì 1 Set riêng ~1,6 triệu phần tử) để tiết kiệm
  // RAM. Chỉ cần khi THỰC SỰ sắp xoá (doClean) và allByCat chưa có sẵn full patterns
  // (patternsAreFull=false — nhánh remap "m" đã tự truyền đủ 100/100 vào expectedTts rồi).
  if (doClean && !patternsAreFull) {
    for (const h of loadAllPatternHashes()) expectedTts.add(h)
  }

  // Bao nhiêu file cần giải mã thử (mục 6) — đọc TRƯỚC để gom mẫu ngay trong lúc stream,
  // khỏi phải giữ lại toàn bộ dòng tts_cache chỉ để lọc mẫu ở cuối.
  const sampleN = process.env.VERIFY_DECRYPT ? parseInt(process.env.VERIFY_DECRYPT, 10) : 0

  // 2) Đọc DB — STREAM tts_cache (bảng lớn >1 triệu dòng) theo keyset, gom NGAY từng trang
  // vào các cấu trúc nhỏ cần thiết thay vì giữ CẢ BẢNG trong RAM (audio_url dài → OOM).
  process.stdout.write('   Đang đọc DB...')
  const dbHash = new Set<string>() // mọi hash đang có (mục 3: đối chiếu chiều thiếu)
  // Orphan tts: dòng KHÔNG còn kỳ vọng (kèm lang/voice cho thống kê, audio_url để xoá file)
  const orphans: { hash: string; lang: string; voice: string; audio_url: string }[] = []
  const orphanByVoice = new Map<string, number>()
  const activeTtsUrls = new Set<string>() // audio_url của dòng CÒN kỳ vọng (an toàn khi xoá)
  let pathBad = 0 // mục 5: audio_url không đúng dạng lang/voice/hash.mp3
  const badSample: string[] = []
  // mục 6: mẫu file để giải mã thử (chỉ giữ tối đa sampleN dòng, không giữ cả bảng)
  const decryptSample: { hash: string; audio_url: string; iv: string | null }[] = []
  let ttsCount = 0

  await streamRows<{
    hash: string
    lang: string
    voice: string
    audio_url: string
    iv: string | null
  }>('tts_cache', 'hash, lang, voice, audio_url, iv', ['hash'], (rows) => {
    for (const r of rows) {
      ttsCount++
      dbHash.add(r.hash)
      // BẢO VỆ giọng ElevenLabs (audit 2026-08-12): script này chỉ sinh tác vụ cho giọng
      // Google/Gemini, nên MỌI dòng giọng ElevenLabs đều nằm ngoài expectedTts và trước đây
      // bị coi là orphan → `--clean-orphans --yes` xoá sạch. Nhưng ElevenLabs (Rachel) là
      // giọng người dùng CHỌN TAY được ở Cài đặt (chỉ bị loại khỏi bể random, xem
      // apps/dhcb/src/lib/voiceTiers.ts RANDOM_EXCLUDED_VOICES) — /api/tts vẫn phục vụ
      // bình thường. Tức là chúng KHÔNG "mất khỏi dữ liệu app", xoá đi là vi phạm chính sách
      // cache (CLAUDE.md mục 6: không bao giờ tự xoá cache đang dùng) và phải trả tiền sinh lại.
      // Cùng tinh thần với phần bảo vệ câu pattern ngoài seed-index ở mục 1.
      if (expectedTts.has(r.hash) || isValidElevenVoice(r.voice) || isValidGeminiVoice(r.voice)) {
        if (doClean) activeTtsUrls.add(r.audio_url)
        if (sampleN > 0 && decryptSample.length < sampleN)
          decryptSample.push({ hash: r.hash, audio_url: r.audio_url, iv: r.iv ?? null })
      } else {
        orphans.push({ hash: r.hash, lang: r.lang, voice: r.voice, audio_url: r.audio_url })
        const k = `${r.lang}/${r.voice}`
        orphanByVoice.set(k, (orphanByVoice.get(k) ?? 0) + 1)
      }
      const ext = isValidGeminiVoice(r.voice) ? 'wav' : 'mp3'
      if (!r.audio_url || !r.audio_url.includes(`${r.lang}/${r.voice}/${r.hash}.${ext}`)) {
        pathBad++
        if (badSample.length < 5) badSample.push(r.hash)
      }
    }
  })
  // pronunciations nhỏ (~180k dòng) — gom cả mảng vẫn nhẹ.
  const pronRowsAll = await fetchAllRows<{
    word: string
    voice: string
    lang: string
    audio_url: string
  }>('pronunciations', 'word, voice, lang, audio_url', ['word', 'voice', 'lang'])
  // ⚠️ AN TOÀN: chỉ soát những ngôn ngữ NẰM TRONG lượt chạy này. Chạy hẹp (vd
  // `--pron-lang=en-US`) mà vẫn soát cả bảng thì toàn bộ dòng vi-VN sẽ bị coi là orphan và
  // `--clean-orphans --yes` xoá sạch chúng — mất hàng vạn file audio đúng nghĩa.
  const pronRows = pronRowsAll.filter((r) => (PRON_LANGS as string[]).includes(r.lang))
  const pronSkippedByLang = pronRowsAll.length - pronRows.length
  if (pronSkippedByLang > 0) {
    console.log(
      `\n   ℹ️  Bỏ qua ${pronSkippedByLang} dòng phát âm thuộc ngôn ngữ ngoài lượt chạy này` +
        ` (--pron-lang=${PRON_LANGS.join(',')}) — không soát, không xoá.`,
    )
  }
  console.log(` xong (${ttsCount} câu TTS, ${pronRows.length} phát âm)`)

  // 3) Chiều THIẾU — theo nhóm
  const labelWidth = Math.max(...CATEGORIES.map((c) => c.label.length))
  console.log('\n📋 Câu kỳ vọng đã có trong DB chưa (theo nhóm):')
  let totalMissing = 0
  for (const { id, label } of CATEGORIES) {
    if (id === 'pron') continue
    const tasks = (allByCat.get(id) ?? []).filter((t): t is PatternTask => t.type === 'pattern')
    let present = 0,
      missing = 0
    for (const t of tasks) {
      if (dbHash.has(hashText(t.text, t.lang, t.voice))) present++
      else missing++
    }
    totalMissing += missing
    const tag = tasks.length === 0 ? '∅' : missing === 0 ? '✅' : '⚠️'
    console.log(
      `  ${tag} ${label.padEnd(labelWidth)}  có ${present}/${tasks.length}  thiếu ${missing}`,
    )
  }
  // phát âm
  let pronPresent = 0
  for (const r of pronRows) if (expectedPron.has(pronKey(r.word, r.voice, r.lang))) pronPresent++
  console.log(
    `  ${pronPresent === expectedPron.size ? '✅' : '⚠️'} ${'Phát âm (pron)'.padEnd(labelWidth)}  có ${pronPresent}/${expectedPron.size}  thiếu ${expectedPron.size - pronPresent}`,
  )

  // 4) Chiều THỪA — orphan (DB có nhưng không còn kỳ vọng). Đã gom trong lúc stream ở mục 2
  // (dùng expectedTts đã GỘP sẵn pattern-bảo-vệ ở mục 1) → chỉ in báo cáo ở đây.
  console.log(`\n🧹 Bản ghi tts_cache KHÔNG còn trong tập kỳ vọng: ${orphans.length}/${ttsCount}`)
  if (orphans.length > 0) {
    for (const [k, n] of [...orphanByVoice.entries()].sort((a, b) => b[1] - a[1])) {
      console.log(`     • ${k}: ${n}`)
    }
    console.log(
      '     (thường là female2/male2 đã bỏ ở curriculum/cefr/Cụm từ, hoặc VOICE_VERSION cũ — có thể xóa cho gọn)',
    )
  }

  // 4b) Chiều THỪA ở pronunciations (giống mục 4 nhưng cho bảng phát âm — trước đây
  // chỉ tts_cache có kiểm tra này, pronunciations bị bỏ sót). Ca điển hình sau đợt đổi
  // tên giọng 2026-07-21: dòng voice='female2'/'male2' còn sót lại (chưa từng remap vì
  // pronunciations trước giờ chỉ seed 2 giọng female/male, không có female2/male2) — vẫn
  // chiếm chỗ trên Storage dù app hiện tại không bao giờ đọc tới.
  const pronOrphans = pronRows.filter((r) => !expectedPron.has(pronKey(r.word, r.voice, r.lang)))
  const pronOrphanByVoice = new Map<string, number>()
  for (const r of pronOrphans) {
    pronOrphanByVoice.set(r.voice, (pronOrphanByVoice.get(r.voice) ?? 0) + 1)
  }
  console.log(
    `\n🧹 Bản ghi pronunciations KHÔNG còn trong tập kỳ vọng: ${pronOrphans.length}/${pronRows.length}`,
  )
  if (pronOrphans.length > 0) {
    for (const [voice, n] of [...pronOrphanByVoice.entries()].sort((a, b) => b[1] - a[1])) {
      console.log(`     • ${voice}: ${n}`)
    }
    console.log(
      '     (thường là female2/male2 đã đổi tên (đợt 2026-07-21) — an toàn để xóa, app không còn đọc tới)',
    )
  }

  if (doClean) {
    // activeTtsUrls đã gom trong stream (mục 2); chỉ cần thêm url của phát âm còn kỳ vọng.
    const activeAudioUrls = activeTtsUrls
    for (const r of pronRows) {
      if (expectedPron.has(pronKey(r.word, r.voice, r.lang))) activeAudioUrls.add(r.audio_url)
    }
    await cleanOrphans(orphans, pronOrphans, activeAudioUrls, confirmYes)
  }

  // 5) Nhất quán đường dẫn: audio_url phải chứa `${lang}/${voice}/${hash}.mp3`
  // (pathBad/badSample đã đếm trong lúc stream ở mục 2)
  console.log(
    `\n🔗 audio_url khớp lang/voice/hash: ${ttsCount - pathBad}/${ttsCount}` +
      (pathBad ? `  (✗ ${pathBad} lệch, vd: ${badSample.join(', ')})` : ' ✅'),
  )

  // 6) (tùy chọn) Giải mã thử N file để chắc dùng được — VERIFY_DECRYPT=20 (mẫu đã gom ở mục 2)
  if (sampleN > 0) {
    // ⚠️ Ở STORAGE_DRIVER=local, audio_url thường là đường dẫn TƯƠNG ĐỐI
    // ('/uploads/...') khi seed/generate không đặt BASE_URL. Node `fetch` KHÔNG
    // nhận URL tương đối → phải ghép base, nếu không sẽ fail HẾT ngay ở bước tải
    // (chưa tới giải mã). Base lấy theo: VERIFY_BASE_URL > BASE_URL > VITE_SITE_URL.
    const verifyBase = (
      process.env.VERIFY_BASE_URL ||
      process.env.BASE_URL ||
      process.env.VITE_SITE_URL ||
      ''
    )
      .trim()
      .replace(/\/$/, '')
    const toAbsolute = (u: string): string =>
      /^https?:\/\//i.test(u)
        ? u
        : verifyBase
          ? `${verifyBase}${u.startsWith('/') ? '' : '/'}${u}`
          : u

    const pick = decryptSample
    let okDec = 0
    const reasons = new Map<string, number>() // gom LÝ DO fail để biết hỏng ở khâu nào
    const samples: string[] = []
    for (const r of pick) {
      try {
        const url = toAbsolute(r.audio_url)
        if (!/^https?:\/\//i.test(url))
          throw new Error('URL_TƯƠNG_ĐỐI (đặt VERIFY_BASE_URL=https://...)')
        const res = await fetch(url)
        if (!res.ok) throw new Error(`HTTP_${res.status}`)
        const buf = await res.arrayBuffer()
        if (buf.byteLength < 32)
          throw new Error(`BODY_NGẮN_${buf.byteLength}B (có thể là trang lỗi, không phải audio)`)
        // Khoá suy từ hash; iv lấy từ chính bản ghi (null = bản ghi trước migration 0038 →
        // rơi về iv suy từ hash). Thiếu iv này thì mọi bản ghi mới đều báo giải mã hỏng oan.
        await decryptAudio(buf, r.hash, r.iv)
        okDec++
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        const label = msg.split(/[:\n]/)[0]?.trim().slice(0, 40) || 'lỗi không rõ' // gom theo nhãn đầu
        reasons.set(label, (reasons.get(label) ?? 0) + 1)
        if (samples.length < 3) samples.push(`${r.audio_url.slice(0, 70)} → ${msg.slice(0, 90)}`)
      }
    }
    const failDec = pick.length - okDec
    console.log(`\n🔓 Giải mã thử ${pick.length} file (mẫu): ✓ ${okDec}  ✗ ${failDec}`)
    if (failDec > 0) {
      for (const [k, n] of [...reasons.entries()].sort((a, b) => b[1] - a[1]))
        console.log(`     • ${k}: ${n}`)
      for (const s of samples) console.log(`     ↳ ${s}`)
      console.log(
        '     Gợi ý: URL_TƯƠNG_ĐỐI / "Failed to parse URL" → đặt VERIFY_BASE_URL (vd domain production);',
      )
      console.log(
        '            HTTP_4xx/5xx → file chưa có trên Storage/Nginx; OperationError → sai master key hoặc file hỏng.',
      )
    }
  }

  // 7) Kết luận
  console.log('─'.repeat(labelWidth + 30))
  if (totalMissing === 0 && pathBad === 0) {
    console.log(
      '✅ DB KHỚP tập kỳ vọng: mọi câu cần thiết đã có, đường dẫn đúng.' +
        (orphans.length || pronOrphans.length
          ? ` (còn ${orphans.length + pronOrphans.length} bản ghi thừa có thể dọn: ${orphans.length} tts_cache + ${pronOrphans.length} pronunciations)`
          : ''),
    )
  } else {
    console.log(
      `⚠️  Chưa khớp: thiếu ${totalMissing} câu kỳ vọng` +
        (pathBad ? `, ${pathBad} đường dẫn lệch` : '') +
        `. Chạy \`npm run seed:all -- --all\` để bù.`,
    )
  }
}

// ── --check-versions: BÁO CÁO (chỉ đọc) tts_cache đang ở phiên bản giọng nào ────────────────
// Khác verifyDb() (đối chiếu thiếu/thừa rồi có thể XOÁ orphan), lệnh này CHỈ trả lời "cache
// hiện có đang ở v2 (tên giọng cũ / hash thiếu VOICE_VERSION), v3 (VOICE_VERSION hiện tại)
// hay Studio?" — không sửa, không remap, không xoá gì cả.
// Giới hạn cố hữu: hash 1 chiều (không suy ngược ra version), nên chỉ phân loại CHÍNH XÁC
// được cho câu vẫn còn trong tập "kỳ vọng" hiện tại (allByCat) — dòng KHÔNG khớp gì (không
// v3, không v2 cũ) bị gộp vào "không xác định" (orphan thật hoặc voice_version lạ khác).
async function checkVersions(allByCat: Map<CatId, AnyTask[]>): Promise<void> {
  console.log('\n🔖 KIỂM TRA PHIÊN BẢN GIỌNG trong tts_cache (chỉ đọc — không sửa/xoá/remap gì)')

  // Tập kỳ vọng hiện tại (v3) + 2 lược đồ hash CŨ tương ứng — chỉ tính được cho giọng
  // Chirp3-HD, KHÔNG phải Studio (Studio không có tiền thân, xem legacyVoiceNameHash).
  const expectedCurrent = new Set<string>()
  const expectedOldNoVersion = new Set<string>()
  const expectedLegacyName = new Set<string>()
  for (const { id } of CATEGORIES) {
    for (const t of allByCat.get(id) ?? []) {
      if (t.type === 'pron') continue
      expectedCurrent.add(hashText(t.text, t.lang, t.voice))
      if (!isValidStudioVoice(t.voice) && !isValidGeminiVoice(t.voice)) {
        expectedOldNoVersion.add(oldHashText(t.text, t.lang, t.voice as VoiceId))
        const legacy = legacyVoiceNameHash(t.text, t.lang, t.voice as VoiceId)
        if (legacy) expectedLegacyName.add(legacy)
      }
    }
  }
  // Câu pattern ngoài seed-index (xem loadAllPatternHashes) vẫn là cache v3 hợp lệ.
  for (const h of loadAllPatternHashes()) expectedCurrent.add(h)

  // Voice CHƯA từng remap tên giọng (đợt đổi tên 2026-07-21) — nhận biết trực tiếp từ cột
  // voice, không cần đối chiếu hash.
  const LEGACY_RAW_NAMES = new Set(['female', 'male', 'female2', 'male2'])
  const counts = { v3: 0, v2Name: 0, v2Hash: 0, studio: 0, unknown: 0 }
  let total = 0

  await streamRows<{ hash: string; voice: string }>(
    'tts_cache',
    'hash, voice',
    ['hash'],
    (rows) => {
      for (const r of rows) {
        total++
        if (LEGACY_RAW_NAMES.has(r.voice)) counts.v2Name++
        else if (isValidStudioVoice(r.voice)) counts.studio++
        else if (expectedCurrent.has(r.hash)) counts.v3++
        else if (expectedOldNoVersion.has(r.hash) || expectedLegacyName.has(r.hash)) counts.v2Hash++
        else counts.unknown++
      }
    },
  )

  console.log(`\n   Tổng ${total} bản ghi tts_cache:`)
  console.log(`   ✅ v3 hiện tại (chirp3hd-v3):                      ${counts.v3}`)
  console.log(`   🟡 v2 cũ — tên giọng chưa remap (female/male/...): ${counts.v2Name}`)
  console.log(`   🟡 v2 cũ — đúng tên giọng, hash thiếu version:     ${counts.v2Hash}`)
  console.log(`   🔵 Studio (không có khái niệm v2/v3):              ${counts.studio}`)
  console.log(`   ⚪ Không xác định (orphan thật hoặc version lạ):   ${counts.unknown}`)

  if (counts.v2Name + counts.v2Hash > 0) {
    console.log(
      '\n   Gợi ý: chạy `npm run seed:all -- --all` (hoặc chọn đúng nhóm) để REMAP các dòng v2' +
        ' sang v3 — không tốn phí API, chỉ tải/giải mã/mã hoá lại (xem processTask()).',
    )
  }
  if (counts.unknown > 0) {
    console.log(
      '   Dòng "Không xác định" xem chi tiết + xoá an toàn bằng `npm run seed:all -- --verify' +
        ' --clean-orphans` (mặc định chỉ xem trước, thêm --yes mới xoá thật).',
    )
  }
}

// ── Ghi/xóa file lỗi sau khi seed ───────────────────────────────────────────
function writeErrorFiles(remaining: AnyTask[]): void {
  const pronLeft = remaining.filter((t): t is PronTask => t.type === 'pron')
  const patternLeft = remaining.filter((t): t is PatternTask => t.type === 'pattern')

  if (pronLeft.length > 0) {
    const words = [...new Set(pronLeft.map((t) => t.word))]
    fs.writeFileSync(PRON_ERRORS_FILE, JSON.stringify(words, null, 2))
    console.log(`⚠️  ${pronLeft.length} phát âm lỗi → scripts/seed-errors.json`)
  } else if (fs.existsSync(PRON_ERRORS_FILE)) fs.unlinkSync(PRON_ERRORS_FILE)

  if (patternLeft.length > 0) {
    const errors = patternLeft.map((t) => ({ text: t.text, lang: t.lang, voice: t.voice }))
    fs.writeFileSync(PATTERN_ERRORS_FILE, JSON.stringify(errors, null, 2))
    console.log(`⚠️  ${patternLeft.length} câu TTS lỗi → scripts/prefetch-tts-errors.json`)
  } else if (fs.existsSync(PATTERN_ERRORS_FILE)) fs.unlinkSync(PATTERN_ERRORS_FILE)
}

// ── Seed nhiều nhóm rồi báo kết quả ─────────────────────────────────────────
async function seedCategories(
  stats: CatStat[],
  picked: CatId[],
  remapOnly = false,
): Promise<AnyTask[]> {
  const tasks = applyElevenBudget(
    picked.flatMap((id) => stats.find((s) => s.id === id)?.remaining ?? []),
  )
  if (tasks.length === 0) {
    console.log('\n✅ Các nhóm đã chọn không còn gì để seed.')
    return []
  }
  const label =
    (remapOnly ? 'Remap ' : '') +
    (picked.length === CATEGORIES.length
      ? 'Seed TẤT CẢ'
      : `Seed ${picked.map((id) => CATEGORIES.find((c) => c.id === id)?.label).join(' + ')}`)
  console.log(
    `\n🚀 ${label} — ${tasks.length} tác vụ${FORCE ? ' (FORCE: ghi đè)' : ''}${remapOnly ? ' (remap-only: không gọi API)' : ''}`,
  )
  const remaining = await seedWithRetry(tasks, label, remapOnly)
  writeErrorFiles(remaining)
  if (remaining.length === 0) console.log('\n🎉 Hoàn thành — không còn lỗi.')
  else if (remapOnly)
    console.log(
      `\nℹ️  Còn ${remaining.length} tác vụ KHÔNG remap được (chưa có cache giọng cũ) —` +
        ' cần seed thật (có key TTS) để tạo mới.',
    )
  else console.log(`\n⚠️  Còn ${remaining.length} tác vụ chưa xong (xem file lỗi ở trên).`)
  return remaining
}

// ── Ước tính chi phí ElevenLabs + xác nhận (chỉ khi --eleven) ─────────────────
// ElevenLabs tính tiền theo KÝ TỰ gửi đi (mỗi ký tự = 1 credit; gói Creator ~100k credit/tháng,
// Pro ~500k) nên không để script âm thầm tiêu hết. Đếm trên các tác vụ CHƯA có trong DB.
const isElevenTask = (t: AnyTask): t is PatternTask =>
  t.type === 'pattern' && isValidElevenVoice(t.voice)

// Thứ tự dùng ngân sách: nhóm nhỏ/quan trọng trước, hai nhóm khổng lồ (giáo trình, Cụm từ) sau.
const ELEVEN_PRIORITY: CatId[] = [
  'cefr',
  'challenge',
  'lessons-early',
  'lessons-rest',
  'curriculum',
  'patterns',
]

// Áp trần ngân sách: tác vụ Google/Gemini giữ nguyên; tác vụ ElevenLabs sắp theo ELEVEN_PRIORITY
// (sort ổn định nên thứ tự trong nhóm giữ nguyên) rồi cắt ngay khi lố trần. Dùng CHUNG cho ước
// tính và seed thật nên số hiển thị luôn bằng số sẽ tiêu.
function applyElevenBudget(tasks: AnyTask[]): AnyTask[] {
  if (!Number.isFinite(ELEVEN_BUDGET)) return tasks
  const rank = (t: PatternTask) => ELEVEN_PRIORITY.indexOf(t.cat)
  const eleven = tasks.filter(isElevenTask).sort((a, b) => rank(a) - rank(b))
  const kept: AnyTask[] = []
  let spent = 0
  for (const t of eleven) {
    const cost = elevenBilledChars(t.text, toneOf(t.cat))
    if (spent + cost > ELEVEN_BUDGET) break
    spent += cost
    kept.push(t)
  }
  return [...tasks.filter((t) => !isElevenTask(t)), ...kept]
}

function summarizeElevenSpend(stats: CatStat[]): {
  rows: Array<{ label: string; sentences: number; chars: number }>
  chars: number
  allChars: number
} {
  const remaining = stats.flatMap((s) => s.remaining)
  const billed = (t: PatternTask) => elevenBilledChars(t.text, toneOf(t.cat))
  const allChars = remaining.filter(isElevenTask).reduce((n, t) => n + billed(t), 0)
  const planned = applyElevenBudget(remaining).filter(isElevenTask)
  const rows: Array<{ label: string; sentences: number; chars: number }> = []
  for (const s of stats) {
    const mine = planned.filter((t) => t.cat === s.id)
    if (mine.length === 0) continue
    rows.push({
      label: s.label,
      sentences: mine.length,
      chars: mine.reduce((n, t) => n + billed(t), 0),
    })
  }
  return { rows, chars: rows.reduce((n, r) => n + r.chars, 0), allChars }
}

function printElevenEstimate(stats: CatStat[]): number {
  const { rows, chars, allChars } = summarizeElevenSpend(stats)
  console.log('\n💸 ƯỚC TÍNH ELEVENLABS (chỉ tính câu CHƯA có trong DB, mỗi ký tự = 1 credit)')
  if (rows.length === 0) {
    console.log('   Không còn tác vụ ElevenLabs nào cần seed.')
    return 0
  }
  for (const r of rows) {
    console.log(
      `   • ${r.label}: ${r.sentences.toLocaleString('vi-VN')} audio · ${r.chars.toLocaleString('vi-VN')} ký tự`,
    )
  }
  console.log(`   ⇒ LƯỢT NÀY ~${chars.toLocaleString('vi-VN')} credit ElevenLabs`)
  if (chars < allChars) {
    console.log(
      `   (trần --eleven-budget=${ELEVEN_BUDGET.toLocaleString('vi-VN')}; còn lại ~${(allChars - chars).toLocaleString('vi-VN')} credit cho các lượt sau)`,
    )
  }
  return chars
}

// Chặn trước khi tiêu tiền: có TTY → hỏi gõ "yes"; không TTY → bắt buộc có --yes.
async function confirmElevenSpend(stats: CatStat[]): Promise<boolean> {
  const chars = printElevenEstimate(stats)
  if (chars === 0) return true
  if (VERIFY_CONFIRM_YES) return true
  if (!process.stdin.isTTY) {
    console.error('❌ Chạy không bàn phím: thêm --yes để xác nhận chi tiêu ElevenLabs ở trên.')
    return false
  }
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  try {
    const ans = await rl.question(
      '\nTiếp tục gọi ElevenLabs và TRẢ PHÍ số credit trên? (gõ "yes" để tiếp tục): ',
    )
    return ans.trim().toLowerCase() === 'yes'
  } finally {
    rl.close()
  }
}

// ── Menu tương tác ──────────────────────────────────────────────────────────
async function interactiveMenu(allByCat: Map<CatId, AnyTask[]>): Promise<void> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  try {
    for (;;) {
      const stats = await audit(allByCat)
      printReport(stats)
      printR2Report(await getR2Counts())

      const pending = stats.filter((s) => s.remaining.length > 0)
      if (pending.length === 0 && !FORCE) {
        console.log('\n✨ Mọi nhóm nội dung đã seed đủ.')
      }

      console.log('\n── Chọn việc tiếp theo ──')
      stats.forEach((s, i) => {
        const left = s.remaining.length
        const mark = left === 0 ? '✔ đã đủ' : `còn ${left.toLocaleString('vi-VN')}`
        console.log(`  ${i + 1}) ${s.label}  (${mark})`)
      })
      console.log('  a) Seed TẤT CẢ nhóm còn thiếu')
      console.log('  m) Remap TOÀN BỘ (không gọi API, nhanh) + dọn orphan sau đó')
      console.log('  s) Đồng bộ audio local → Cloudflare R2 (cần STORAGE_DRIVER=r2)')
      console.log('  v) Kiểm tra ổ đĩa ↔ R2 thật + xoá local đã an toàn (--yes mới xoá)')
      console.log('  r) Làm mới báo cáo')
      console.log('  q) Thoát')

      const ans = (await rl.question('\nNhập lựa chọn (số / a / m / s / v / r / q): '))
        .trim()
        .toLowerCase()

      if (ans === 'q' || ans === '') {
        console.log('👋 Thoát.')
        return
      }
      if (ans === 'r') continue
      if (ans === 's') {
        await runR2Sync()
        continue
      }
      if (ans === 'v') {
        await runVerifyR2()
        continue
      }
      if (ans === 'a') {
        await seedCategories(
          stats,
          CATEGORIES.map((c) => c.id),
        )
        continue
      }
      if (ans === 'm') {
        // Remap-only KHÔNG gọi API nên không tốn phí — quét pattern ĐẦY ĐỦ 100 câu/chủ thể
        // (loadFullPatternTasks, bỏ qua seed-index) thay vì chỉ top-N như allByCat, để cache
        // cũ (giọng/hash cũ) của 80 câu ngoài top-N cũng được remap sang hash hiện tại, không
        // bị bỏ quên "chết" trên Storage.
        const remapAllByCat = new Map(allByCat)
        remapAllByCat.set('patterns', loadFullPatternTasks())
        const remapStats = await audit(remapAllByCat)
        await seedCategories(
          remapStats,
          CATEGORIES.map((c) => c.id),
          true, // remapOnly
        )
        // Remap chỉ THÊM bản ghi dưới hash/tên giọng mới — bản ghi cũ (hash/tên giọng cũ)
        // không tự mất, nên sau khi remap xong luôn còn orphan để dọn. Xem trước rồi hỏi
        // xác nhận thay vì xoá luôn — orphan là dữ liệu Storage thật, xoá nhầm không hoàn tác được.
        await verifyDb(remapAllByCat, {
          cleanOrphans: true,
          confirmYes: false,
          patternsAreFull: true,
        })
        const confirm = (
          await rl.question(
            '\n🗑️  Xoá THẬT các bản ghi/file dư thừa (orphan) ở trên? (gõ "yes" để xoá, Enter để bỏ qua): ',
          )
        )
          .trim()
          .toLowerCase()
        if (confirm === 'yes') {
          await verifyDb(remapAllByCat, {
            cleanOrphans: true,
            confirmYes: true,
            patternsAreFull: true,
          })
        } else {
          console.log('ℹ️  Bỏ qua — chưa xoá gì.')
        }
        continue
      }
      const n = parseInt(ans, 10)
      if (Number.isInteger(n) && n >= 1 && n <= stats.length) {
        await seedCategories(stats, [stats[n - 1]!.id])
      } else {
        console.log('❓ Lựa chọn không hợp lệ.')
      }
    }
  } finally {
    rl.close()
  }
}

// Gom toàn bộ tác vụ theo nhóm (LIMIT cắt bớt mỗi nhóm khi debug) — dùng chung cho luồng
// seed chính lẫn các chế độ chỉ-đọc không cần key TTS (--check-versions).
function buildAllByCat(wordsFile: string | undefined, limit: number): Map<CatId, AnyTask[]> {
  const allByCat = new Map<CatId, AnyTask[]>()
  for (const { id } of CATEGORIES) allByCat.set(id, [])
  allByCat.set('pron', loadPronTasks(wordsFile).slice(0, limit))
  for (const t of loadPatternTasks()) allByCat.get(t.cat)!.push(t)
  if (Number.isFinite(limit)) {
    for (const { id } of CATEGORIES) {
      if (id === 'pron') continue
      allByCat.set(id, allByCat.get(id)!.slice(0, limit))
    }
  }
  return allByCat
}

// ── MAIN ─────────────────────────────────────────────────────────────────────
async function main(): Promise<void> {
  // 2 chế độ R2 không cần key TTS (không gọi Google) — tách trước các check khác.
  if (SYNC_R2_FLAG) {
    await runR2Sync()
    return
  }
  if (VERIFY_R2_FLAG) {
    await runVerifyR2()
    return
  }

  const wordsFile = process.env.WORDS_FILE
    ? path.resolve(PROJECT_ROOT, process.env.WORDS_FILE)
    : undefined
  const limit = process.env.LIMIT ? parseInt(process.env.LIMIT, 10) : Infinity

  // --check-versions CHỈ ĐỌC DB (không giải mã, không gọi Google) — chỉ cần DATABASE_URL,
  // tách trước để không đòi hỏi TTS_ENCRYPTION_MASTER_KEY/GOOGLE_TTS_API_KEY như luồng seed.
  if (CHECK_VERSIONS_ONLY) {
    if (!process.env.DATABASE_URL) {
      console.error('❌ Thiếu biến môi trường: DATABASE_URL')
      process.exit(1)
    }
    await checkVersions(buildAllByCat(wordsFile, limit))
    return
  }

  const missing = ['DATABASE_URL', 'TTS_ENCRYPTION_MASTER_KEY'].filter((k) => !process.env[k])
  if (missing.length > 0) {
    console.error(`❌ Thiếu biến môi trường: ${missing.join(', ')}`)
    process.exit(1)
  }
  if (!hasGoogleTtsKey() && !hasGeminiTtsKey()) {
    console.warn(
      '⚠️  Chưa cấu hình GOOGLE_TTS_API_KEY hoặc GEMINI_API_KEY — chỉ có thể chạy remap/audit.',
    )
  }

  const allByCat = buildAllByCat(wordsFile, limit)

  // ── --eleven: cần key; --check chỉ in ước tính, các chế độ seed phải được xác nhận chi tiêu ──
  if (ELEVEN_SEED) {
    if (!CHECK_ONLY && !VERIFY_ONLY && !hasElevenLabsKey()) {
      console.error(
        '❌ --eleven cần ELEVENLABS_API_KEY trong .env (lấy ở elevenlabs.io → Profile).',
      )
      process.exit(1)
    }
    if (CHECK_ONLY) {
      printElevenEstimate(await audit(allByCat))
    } else if (!VERIFY_ONLY && !(await confirmElevenSpend(await audit(allByCat)))) {
      console.log('👋 Đã huỷ — chưa gọi ElevenLabs lần nào.')
      return
    }
  }

  // ── Chế độ chỉ xem báo cáo ────────────────────────────────────────────────
  if (CHECK_ONLY) {
    printReport(await audit(allByCat))
    printR2Report(await getR2Counts())
    return
  }

  // ── Chế độ kiểm tra kỹ DB (đối chiếu 2 chiều, không seed) ──────────────────
  if (VERIFY_ONLY) {
    await verifyDb(allByCat)
    return
  }

  // ── Probe key TTS: chỉ xoay vòng qua key CÒN DÙNG ĐƯỢC lúc này ─────────────
  if (hasGoogleTtsKey()) {
    console.log('🔑 Kiểm tra key TTS còn dùng được...')
    const { working, total } = await probeApiKeys()
    if (working.length === 0) {
      console.warn(
        '⚠️  Không key GOOGLE_TTS nào dùng được lúc này (có thể tất cả đã hết quota) —' +
          ' vẫn tiếp tục để chạy REMAP/Gemini TTS;' +
          ' tác vụ nào thực sự cần tạo audio Google mới sẽ báo lỗi riêng, không chặn cả lượt chạy.',
      )
    }
    setActiveKeyPool(working)
    if (working.length > 0) {
      console.log(
        working.length === total.length
          ? `   ✓ ${working.length}/${total.length} key dùng được — xoay vòng đủ cả bể.`
          : `   ⚠️  ${working.length}/${total.length} key dùng được — ${total.length - working.length} key đã cạn quota, tạm loại khỏi vòng xoay lượt chạy này.`,
      )
    }
  }

  // ── Chế độ seed tất cả không hỏi (CI/cron) ────────────────────────────────
  if (SEED_ALL_FLAG) {
    const stats = await audit(allByCat)
    printReport(stats)
    await seedCategories(
      stats,
      CATEGORIES.map((c) => c.id),
    )
    // In lại báo cáo cuối để biết đã 100% chưa
    printReport(await audit(allByCat))
    printR2Report(await getR2Counts(true)) // làm mới — vừa upload thêm audio mới
    return
  }

  // ── Không có TTY (không gõ được) mà không kèm cờ → in báo cáo + hướng dẫn ──
  if (!process.stdin.isTTY) {
    printReport(await audit(allByCat))
    printR2Report(await getR2Counts())
    console.log('\nℹ️  Không có bàn phím tương tác. Chạy `npm run seed:all -- --all` để seed hết,')
    console.log('   hoặc `npm run seed:all -- --check` để chỉ xem báo cáo.')
    return
  }

  // ── Mặc định: menu tương tác ──────────────────────────────────────────────
  console.log('🔊 seed:all — báo cáo tiến độ + chọn việc (phát âm + TTS câu)')
  await interactiveMenu(allByCat)
}

// CHỈ chạy khi gọi trực tiếp (`npm run seed:all`), KHÔNG chạy khi file được import — nhờ vậy
// test đơn vị nạp được các hàm thuần bên dưới mà không kích hoạt cả quy trình seed (đụng DB,
// gọi Google TTS, xoá file).
const isDirectRun =
  !!process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isDirectRun) {
  main().catch((err) => {
    console.error('❌ Lỗi:', err)
    process.exit(1)
  })
}

// Xuất cho test (scripts/seed-all.test.ts) — hàm thuần, không đụng DB/mạng.
export {
  loadPronTasks,
  loadPatternTasks,
  hashText,
  applyElevenBudget,
  ELEVEN_TONE_BY_CAT,
  CATEGORIES,
  parsePronunciationKey,
  pronKey,
  isSeedablePronText,
  PRON_VI_VOICE_IDS,
}
