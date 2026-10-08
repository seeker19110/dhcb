# Hướng dẫn seed audio (`seed:all`) — báo cáo, remap, verify

Script: `scripts/seed-all.ts` · Lệnh: `npm run seed:all`

Mục tiêu: tạo sẵn (cache) audio **phát âm từ điển** + **TTS câu** lên Postgres tự host
(bảng `pronunciations` và `tts_cache` + file lưu local VPS hoặc Cloudflare R2 tùy
`STORAGE_DRIVER`) để client phát ngay, **không phải gọi Google TTS realtime** → nhanh + rẻ.

> File này dành cho người mới: giải thích từng lệnh và cách đọc số liệu. Nếu chỉ
> cần chạy nhanh: `npm run seed:all -- --check` (xem báo cáo) →
> `npm run seed:all -- --all` (seed hết) → `npm run seed:verify` (kiểm tra).

---

## 1. Các lệnh

| Lệnh                                   | Làm gì                                                                                                                                                                                                   |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run seed:all`                     | Menu tương tác: in báo cáo → chọn nhóm để seed (lặp tới khi thoát).                                                                                                                                      |
| `npm run seed:all -- --check`          | **Chỉ in báo cáo** tiến độ rồi thoát (không seed, không menu).                                                                                                                                           |
| `npm run seed:all -- --all`            | Seed **tất cả** nhóm còn thiếu, không hỏi (dùng cho CI/cron).                                                                                                                                            |
| `npm run seed:verify`                  | = `seed:all -- --verify`. **Kiểm tra kỹ** DB (đối chiếu 2 chiều).                                                                                                                                        |
| `npm run seed:all -- --check-versions` | **CHỈ ĐỌC:** báo cáo `tts_cache` đang ở phiên bản giọng nào (v2 cũ / v3 hiện tại / Studio) — không sửa/xoá/remap gì. Không cần `GOOGLE_TTS_API_KEY`/`TTS_ENCRYPTION_MASTER_KEY`, chỉ cần `DATABASE_URL`. |
| `npm run seed:all -- --force`          | Tạo lại + **ghi đè** cả audio đã có.                                                                                                                                                                     |

Biến môi trường thêm:

- `LIMIT=20` — giới hạn số tác vụ mỗi nhóm (debug nhanh).
- `VERIFY_DECRYPT=20` — (kèm `--verify`) tải + **giải mã thử** 20 file để chắc dùng được.
- `WORDS_FILE=scripts/seed-errors.json` — chỉ seed lại danh sách từ trong file (retry lỗi).
- `BASE_URL=...` — host để ghép `audio_url` khi lưu Storage (mặc định lấy từ `.env`).

Bắt buộc có trong `.env`: `DATABASE_URL`, `GOOGLE_TTS_API_KEY`, `TTS_ENCRYPTION_MASTER_KEY`.

---

## 2. Đọc báo cáo tiến độ

```
📊 BÁO CÁO TIẾN ĐỘ SEED (sẵn sàng cho client)
  ⏳ Phát âm từ điển (pronunciations)            20012/20014  ▓▓▓▓▓▓▓▓▓▓ 100.0%
  ⏳ Câu + ví dụ giáo trình nền tảng (/learn)      1747/2772  ▓▓▓▓▓▓░░░░  63.0%
  ...
  📦 TỔNG CỘNG                                 142238/422447  ▓▓▓░░░░░░░  33.7%
```

- Mỗi dòng = 1 **nhóm**, số `done/total` = đã seed / cần seed (theo tập **kỳ vọng**
  dựng từ dữ liệu tĩnh trong repo, nên `total` cố định).
- 6 nhóm theo thứ tự ưu tiên client cần (seed dở vẫn có sẵn cái hay dùng nhất trước):
  `pron` → `curriculum` → `cefr` → `lessons-early` (50 bài đầu) → `patterns` (Cụm từ)
  → `lessons-rest`.

> Số liệu ổn định giữa các lần chạy (đọc DB có `ORDER BY` theo khóa duy nhất —
> xem `fetchAllRows` trong `scripts/seed-all.ts`).

Dòng đầu khi audit: `xong (27330 phát âm, 301227 câu TTS)` = **tổng số dòng thật**
trong DB. Con số này có thể **lớn hơn** `done` của báo cáo vì DB còn chứa **bản ghi
thừa (orphan)** không nằm trong tập kỳ vọng (xem mục 4) — đây là chuyện bình thường,
không phải lỗi.

---

## 3. Remap — chuyển cache cũ sang khóa mới, KHÔNG tốn quota API

### Vì sao có remap

Khóa cache 1 câu = `hash(text + lang + voice + VOICE_VERSION)` (32 hex đầu của SHA-256).
Khi đổi giọng TTS, ta tăng `VOICE_VERSION` (hiện là `chirp3hd-v3`, ở
`api/_lib/googleTts.ts`) → **hash đổi** → mọi câu đã seed trước đó không còn khớp.

Nhưng audio cũ vẫn nằm trên Storage, chỉ là **đã mã hóa bằng khóa suy từ hash cũ**.
Tạo lại bằng cách gọi Google TTS sẽ **tốn quota**. Remap tránh điều đó.

### Remap chạy thế nào

Trong `processTask` (`scripts/seed-all.ts`), với mỗi câu chưa có ở hash mới, **trước
khi gọi Google** script thử LẦN LƯỢT 2 lược đồ hash cũ:

1. `hash(text + lang + voice)` — thiếu hẳn `VOICE_VERSION` (từ hồi khái niệm này chưa
   tồn tại).
2. `hash(text + lang + TÊN_GIỌNG_CŨ + 'chirp3hd-v2')` — đúng `VOICE_VERSION` cũ nhưng
   TÊN giọng cũ (đợt đổi tên 2026-07-21: `female/male/female2/male2` →
   `Kore/Puck/Aoede/Charon` — CÙNG 1 giọng Google Chirp3-HD thật, chỉ đổi định danh
   trong app; xem `OLD_VOICE_ALIAS` trong `scripts/seed-all.ts`).

Gặp lược đồ nào khớp trước thì dùng lược đồ đó: **tải audio cũ → giải mã bằng hash
cũ → mã hóa lại bằng hash mới → upload** → ghi dòng `tts_cache` mới. Chỉ tốn **băng
thông Storage**, **0 quota Google**. Đếm vào cột `↺ remapped`. Remap lỗi (file
hỏng/mạng, hoặc cả 2 lược đồ đều không có) → tự chuyển sang gọi Google tạo mới
(`✓ ok`).

`pronunciations` (âm 1 từ, không mã hóa) cũng có remap tương tự cho đợt đổi tên giọng
— vì KHÔNG mã hóa nên chỉ cần copy nguyên `audio_url` sang dòng `(word, tên_giọng_mới)`
mới, không cần tải/giải mã/upload lại gì.

### Cách kích hoạt remap

**Không có lệnh riêng** — cứ seed bình thường:

```bash
npm run seed:all -- --all      # gặp câu nào remap được, tự remap; còn lại generate mới
```

Cuối mỗi vòng có thống kê: `✓ OK (gọi Google)  ↺ Remap (tái mã hóa)  ⏭ Skip (đã có)  ✗ Lỗi`.
Nếu thấy `↺ Remap` lớn nghĩa là đang tận dụng lại audio cũ — đỡ tốn tiền.

> `--force` sẽ **bỏ qua** cả skip lẫn remap và **gọi Google tạo lại tất cả** (tốn quota).
> Chỉ dùng khi thật sự muốn làm mới audio.

---

## 4. Verify — kiểm tra kỹ DB (đối chiếu 2 chiều)

```bash
npm run seed:verify                  # hoặc: npm run seed:all -- --verify
VERIFY_DECRYPT=20 npm run seed:verify  # thêm: tải + giải mã thử 20 file

# ⚠️ STORAGE_DRIVER=local: audio_url hay là đường dẫn TƯƠNG ĐỐI (/uploads/...).
# Node fetch không nhận URL tương đối → phải cho base, nếu không giải mã thử fail HẾT:
VERIFY_DECRYPT=20 VERIFY_BASE_URL=https://en-vi.donghanhcungban.com npm run seed:verify
```

Khác báo cáo thường (chỉ đếm thiếu), verify đối chiếu **HAI CHIỀU** + kiểm đường dẫn:

1. **Chiều THIẾU** (theo nhóm): câu kỳ vọng nào **chưa có** trong DB.
   `✅` đủ · `⚠️` còn thiếu.
2. **Chiều THỪA — orphan**: bản ghi `tts_cache` **và** `pronunciations` **có trong DB nhưng
   không còn kỳ vọng**, gom theo `lang/voice` (tts_cache) hoặc `voice` (pronunciations).
   Thường là:
   - giọng `female`/`male`/`female2`/`male2` đã đổi tên (đợt 2026-07-21 → `Kore`/`Puck`/
     `Aoede`/`Charon`) — app hiện tại không bao giờ đọc tới tên cũ nữa, hoặc
   - audio của `VOICE_VERSION` **cũ** còn sót.

   Orphan **vô hại** (chỉ tốn dung lượng, không bao giờ bị phát) nhưng nếu muốn dọn sạch
   để lấy lại dung lượng:

   ```bash
   npm run seed:all -- --verify --clean-orphans           # XEM TRƯỚC — chưa xóa gì
   npm run seed:all -- --verify --clean-orphans --yes     # Xóa THẬT (DB + file)
   ```

   An toàn: nếu 1 file đang được bản ghi KHÁC (còn nằm trong tập kỳ vọng) dùng chung — vd
   remap giọng mới trỏ vào audio_url của giọng cũ (xem mục 3) — lệnh **chỉ xóa bản ghi
   thừa, GIỮ NGUYÊN file** (không đụng vào file đang thực sự được dùng).

3. **Nhất quán đường dẫn**: `audio_url` phải chứa đúng `${lang}/${voice}/${hash}.mp3`.
4. **Giải mã thử** (khi đặt `VERIFY_DECRYPT=N`): tải N file + giải mã bằng khóa suy từ
   hash để chắc audio **dùng được thật**, không chỉ tồn tại dòng DB. Khi fail, in
   **lý do gom nhóm** + vài mẫu để biết hỏng ở khâu nào:
   - `URL_TƯƠNG_ĐỐI` / `Failed to parse URL` → `audio_url` tương đối (local mode) mà
     chưa cho base → **đặt `VERIFY_BASE_URL=https://...`** rồi chạy lại (đây là lỗi của
     phép thử, KHÔNG phải audio hỏng — trình duyệt vẫn phát được vì tự resolve theo origin).
   - `HTTP_4xx/5xx` → file chưa có trên Storage/Nginx (đường dẫn lỗi hoặc chưa upload).
   - `OperationError` → giải mã thất bại thật: sai `TTS_ENCRYPTION_MASTER_KEY` (khác lúc
     mã hóa) hoặc file ciphertext hỏng.
   - `BODY_NGẮN_*` → tải về quá ngắn (thường là trang lỗi HTML, không phải audio).

Kết luận cuối:

- `✅ DB KHỚP tập kỳ vọng` — mọi câu cần thiết đã có, đường dẫn đúng (có thể còn orphan để dọn).
- `⚠️ Chưa khớp: thiếu N câu...` — chạy `npm run seed:all -- --all` để bù.

---

## 4b. Kiểm tra phiên bản giọng (`--check-versions`)

```bash
npm run seed:all -- --check-versions
```

Khác `--verify` (đối chiếu thiếu/thừa để CÓ THỂ dọn), lệnh này **chỉ đọc** — không sửa,
không remap, không xóa gì — trả lời đúng 1 câu hỏi: cache `tts_cache` hiện có đang ở
phiên bản giọng nào?

- **v3 hiện tại** (`chirp3hd-v3`) — đã đúng, không cần làm gì.
- **v2 cũ — tên giọng chưa remap** (`voice` vẫn là `female`/`male`/`female2`/`male2`).
- **v2 cũ — đúng tên giọng nhưng hash thiếu `VOICE_VERSION`** (mục 3, lược đồ hash cũ #1).
- **Studio** — không có khái niệm v2/v3 (giọng Studio không có tiền thân, xem mục 3).
- **Không xác định** — không khớp lược đồ hash nào đã biết (orphan thật, hoặc
  `voice_version` lạ). Hạn chế cố hữu: hash là 1 chiều nên chỉ phân loại chính xác được
  cho câu **vẫn còn** trong tập kỳ vọng hiện tại — orphan mà đồng thời là hash cũ vẫn rơi
  vào nhóm này thay vì "v2 cũ" (không có văn bản gốc để đối chiếu ngược).

Thấy `v2 cũ` > 0 → chạy `npm run seed:all -- --all` để remap (không tốn quota, xem mục
3). Thấy `Không xác định` > 0 → xem/dọn bằng `--verify --clean-orphans` (mục 4).

---

## 5. Đồng bộ audio cache cũ lên Cloudflare R2 (menu "s"/"v" trong `seed:all`)

> Mục 5 và 6 cũ (`sync:storage`/`check:supabase`, đồng bộ với **Supabase Storage**) đã hết
> hiệu lực — dự án đã rời hẳn Supabase, 2 script đó đã bị xóa
> (`scripts/sync-storage-to-vps.ts`, `scripts/check-supabase-audio.ts`). Xem
> `docs/migration-thoat-ly-supabase.md`. **[2026-07-20]** 2 script R2 riêng
> (`scripts/sync-storage-to-r2.ts`, `scripts/verify-r2-sync.ts`) cũng đã GỘP HẲN vào
> `scripts/seed-all.ts` (menu "s"/"v" hoặc cờ `--sync-r2`/`--verify-r2`) — 1 file seed
> duy nhất cho mọi việc audio cache.

Với `STORAGE_DRIVER=local` (mặc định), `saveAudio()` ghi thẳng vào `UPLOADS_DIR` trên VPS —
không cần bước đồng bộ nào. Với `STORAGE_DRIVER=r2`, audio mới tự động lên Cloudflare R2, nhưng
audio đã cache TRƯỚC KHI bật R2 (còn nằm trên ổ VPS) cần đẩy lên bằng menu "s" (hoặc cờ
`--sync-r2`) của `seed:all`:

```bash
# CHẠY TRÊN VPS
STORAGE_DRIVER=r2 npm run seed:all -- --sync-r2 --dry-run   # xem trước, không tải
STORAGE_DRIVER=r2 npm run seed:all -- --sync-r2              # chạy thật
STORAGE_DRIVER=r2 npm run seed:all -- --sync-r2 --force      # chạy lại, ghi đè cả file đã có trên R2
BUCKET=pronunciations npm run seed:all -- --sync-r2          # chỉ 1 bucket
```

An toàn chạy lại nhiều lần: quét thẳng ổ đĩa (`uploads/tts-cache/**/*.mp3`,
`uploads/pronunciations/*.mp3`), suy hash/lang/voice (hoặc word/voice) từ TÊN FILE, upload lên
R2 rồi `INSERT ... ON CONFLICT` tái tạo dòng DB — không cần dòng DB có sẵn.

Sau khi đồng bộ, muốn **xác nhận thật** (đối chiếu trực tiếp với R2, không qua DB) rồi **xoá
file local** lấy lại dung lượng — dùng menu "v" (hoặc cờ `--verify-r2`):

```bash
npm run seed:all -- --verify-r2                              # chỉ đối chiếu, in báo cáo
npm run seed:all -- --verify-r2 --delete-verified             # xem trước sẽ xoá bao nhiêu (CHƯA xoá)
npm run seed:all -- --verify-r2 --delete-verified --yes       # xoá thật (chỉ file đã khớp R2)
```

`--yes` bắt buộc mới xoá thật; file thiếu/lệch kích thước trên R2 luôn được GIỮ LẠI dù dùng
`--delete-verified`.

---

## 7. Quy trình khuyến nghị

```bash
# Seed audio (tạo cache TTS)
npm run seed:all -- --check     # 1. Xem còn thiếu bao nhiêu (số liệu nay ổn định)
npm run seed:all -- --all       # 2. Seed hết (tự remap cái nào remap được)
npm run seed:verify             # 3. Kiểm tra: thiếu / thừa / đường dẫn
VERIFY_DECRYPT=20 npm run seed:verify   # 4. (tùy chọn) chắc chắn audio giải mã được

# Nếu dùng STORAGE_DRIVER=r2: đẩy nốt audio cache cũ (seed trước khi bật R2) lên Cloudflare
STORAGE_DRIVER=r2 npm run seed:all -- --sync-r2 --dry-run   # 5. Xem trước
STORAGE_DRIVER=r2 npm run seed:all -- --sync-r2              # 6. Chạy thật

# 7. (tùy chọn) Đối chiếu R2 thật + xoá file local đã an toàn — CHẠY TRÊN VPS
npm run seed:all -- --verify-r2                              # 7a. chỉ đối chiếu, in báo cáo
npm run seed:all -- --verify-r2 --delete-verified             # 7b. xem trước sẽ xoá bao nhiêu (CHƯA xoá)
npm run seed:all -- --verify-r2 --delete-verified --yes       # 7c. xoá thật (chỉ file đã khớp R2)
```

Nếu seed bị lỗi giữa chừng: danh sách lỗi được ghi ra `scripts/seed-errors.json`
(phát âm) và `scripts/prefetch-tts-errors.json` (câu TTS) để retry sau.

---

## 8. Seed giọng ElevenLabs (`--eleven`) — TÍNH TIỀN theo ký tự

6 giọng: **nữ** Rachel · Alice · Matilda, **nam** Eric · Daniel · Chris (bảng `ELEVEN_VOICES` ở
`packages/core-ai/elevenLabsTts.ts`; chỉ VIP). Mặc định `seed:all` **không** đụng ElevenLabs —
phải thêm cờ `--eleven`, và cần `ELEVENLABS_API_KEY` trong `.env`.

**Quy mô (đo 2026-10-08, chưa có gì trong DB):** ~421.000 audio · ~15,9 triệu ký tự (1 ký tự =
1 credit). Giáo trình ~6,4M · Cụm từ ~7,7M · hội thoại ~1,6M · CEFR ~0,12M · Challenge ~0,05M.
Gói ElevenLabs tính theo credit/tháng (Creator ~100k, Pro ~500k, Scale ~2M — xem giá hiện hành
trên elevenlabs.io) nên **không nên chạy một lần không trần**. Cách làm:

```bash
npm run seed:all -- --eleven --check                       # 1. CHỈ in ước tính, không gọi API
npm run seed:all -- --eleven --eleven-budget=400000        # 2. Seed tối đa 400k ký tự rồi dừng
#   (in ước tính, hỏi gõ "yes"; chạy không bàn phím thì thêm --yes)
# 3. Tháng sau chạy lại ĐÚNG lệnh trên — câu đã có tự bỏ qua, làm tiếp phần còn thiếu.
```

- **Thứ tự dùng ngân sách:** CEFR → Challenge → hội thoại (50 bài đầu, rồi còn lại) → giáo trình →
  Cụm từ. Nhóm nhỏ/quan trọng trước, hai nhóm khổng lồ sau cùng.
- **Giọng điệu (cố định theo nhóm câu):** giáo trình + CEFR `[calm]` · hội thoại `[cheerful]` ·
  Challenge `[excited]` · Cụm từ trung tính (không thẻ). Thẻ gắn vào ĐẦU câu gửi ElevenLabs, chạy
  trên model `eleven_v4` (đổi bằng `ELEVENLABS_TONE_MODEL`); phát lúc người dùng bấm nghe vẫn dùng
  `eleven_multilingual_v2`, không thẻ. Thẻ **tính phí như ký tự thường**: tổng toàn bộ nay
  ~17,3 triệu credit (+8,9%); ước tính và `--eleven-budget` đã cộng sẵn. Tắt bằng `--no-tone`.
  **Nghe thử trước khi seed lớn:** `npm run eleven:tone-sample` (~400 credit, 8 file mp3). Nếu
  model đọc thẳng chữ "calm"/"cheerful" thành tiếng thì DỪNG, đừng seed.
- **Khoá cache:** hash ElevenLabs **bỏ `lang`** (đúng như `/api/tts`), nên một câu chỉ seed 1 lần
  cho cả hai ngôn ngữ.
- **Hội thoại:** mỗi nhân vật dùng giọng ElevenLabs đúng giới tính, xoay vòng 3 giọng/giới.
- **Không seed:** từ điển (`/api/pronunciation` không hỗ trợ ElevenLabs) và truyện (dùng Gemini).
- **Song song:** `ELEVENLABS_SEED_CONCURRENCY` (mặc định 3). Bị 429 thì giảm xuống 1–2.
- **Khẩu hình:** seed cũng lưu `viseme_timeline` thật (cần eSpeak-ng; không có thì để trống, client
  tự ước lượng như cũ).
- Muốn thêm giọng: thêm 1 dòng vào `ELEVEN_VOICES`, rồi thêm cùng tên vào
  `apps/dhcb/src/lib/voiceTiers.ts`; `scripts/eleven-voices-parity.test.ts` đỏ nếu quên.
