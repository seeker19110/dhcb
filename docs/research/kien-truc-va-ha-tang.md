# Tổng hợp Nghiên cứu: Kien Truc Va Ha Tang

Tài liệu này gộp từ 10 tài liệu nghiên cứu liên quan.

---

## [1] Tài liệu: dac-ta-kien-truc-platform-dhcb-2026-08-23.md

_(Chi tiết nguồn gốc: `dac-ta-kien-truc-platform-dhcb-2026-08-23.md`)_

# Kiến trúc nền tảng DHCB — "Đồng hành cùng bạn" (chốt 2026-08-23)

> Người dùng chốt tầm nhìn: **DHCB là nền tảng phát triển mọi mảng liên quan đến cá nhân của
> một người; English chỉ là MỘT MÔN HỌC như mọi môn khác.** Tài liệu này là đặc tả kiến trúc
> theo tầm nhìn đó, thay thế cách đóng khung "app gia sư tiếng Anh" cũ. Yêu cầu đi kèm: mọi
> cấu trúc và phát triển phải theo **tiêu chuẩn cao nhất của ngành**.

## 1. Mô hình khái niệm

```
DHCB Platform (một người dùng — một hồ sơ — một dòng dữ liệu cá nhân)
├─ Companion ("Bạn Đồng Hành") — tác tử AI xuyên suốt, biết ngữ cảnh mọi trụ
├─ Trụ LEARNING (học tập)
│  ├─ Môn english  ← môn ĐẦU TIÊN, đã chín (3 chế độ, CEFR/SRS, TTS/STT)
│  └─ Môn math/physics/chemistry/biology… ← cùng KHUÔN môn học (mục 4)
├─ Trụ CAREER (sự nghiệp) · WORK (công việc) · STARTUP · LIFE (đời sống)
└─ Nền dùng chung: auth · billing · usage · personal data (facts/memory/
   consent/life-graph) · AI gateway · thông báo · admin
```

Nguyên tắc rút ra (và đối chiếu chuẩn ngành):

1. **Modular monolith trước, không microservices** — một server Express, ranh giới module
   bằng gói workspace + luật import (ESLint) + schema Postgres riêng từng domain. Đây là
   khuyến nghị chuẩn hiện nay cho đội nhỏ (tách service chỉ khi có áp lực scale thật).
2. **Subject là plugin của trụ Learning** — thêm môn mới KHÔNG được đòi sửa nền tảng; nền
   tảng expose khuôn (registry, tiến độ, lượt dùng, thanh toán) và môn cắm vào (mục 4).
3. **Một nguồn sự thật cho dữ liệu cá nhân** — mọi trụ ghi về Postgres schema riêng
   (`personal/career/work/startup/life/english`), KHÔNG state in-memory (nợ N1/N3 hiện tại).
4. **Đặt tên phản ánh vai trò**: cái gì của nền tảng mang tên nền tảng (`@dhcb/app`,
   `packages/core-*`), cái gì của môn mang tên môn (`subjects/english`, `subject-english`).

## 2. Hiện trạng sau PR-S2b (đã thực thi)

- `apps/english` → **`apps/dhcb`** (gói `@dhcb/app`): app chính giờ mang đúng tên nền tảng —
  nó vốn chứa toàn bộ platform (companion, 4 trụ đời sống, admin, phòng học đa môn), phần
  riêng môn Anh chỉ là `src/pages/subjects/english/` + `src/data/` + `src/prompts/`.
- Alias `@english/*` đã XOÁ (0 nơi dùng — không giữ khái niệm chết). Alias còn lại:
  `@dhcb/*` (workspace packages) và `@core` (packages/core-ui).
- URL công khai, route, schema `english.*`, nội dung môn — KHÔNG đổi (người dùng cuối không
  thấy khác biệt).

## 3. Cây thư mục đích (điều chỉnh platform-first so với đặc tả cải tổ cũ)

```
dhcb/
├─ apps/
│  ├─ dhcb/                        # ✅ App nền tảng (đổi tên từ english, PR-S2b)
│  │  └─ src/
│  │     ├─ pages/{core,companion,learning,domains,subjects/english}
│  │     ├─ components/ · lib/     # (S5 sắp lại khớp taxonomy pages)
│  │     └─ data/ · prompts/       # dữ liệu/prompt MÔN ANH — sẽ theo môn khi tách subject
│  ├─ hub/                         # landing apex — giữ; về lâu dài cân nhắc gộp vào dhcb
│  └─ server/                      # (S3) Express + api/
├─ packages/
│  ├─ core-*                       # nền tảng dùng chung (17 gói hiện có + core-http)
│  └─ subject-english/             # (S4, ĐỔI so với đặc tả cũ "core-english"):
│                                  # cefr*, dictionary, wordFreq, viseme, espeak…
├─ api/ → (S3) apps/server/src/api/
│  ├─ {core,admin,personal,domains,platform}/
│  └─ subjects/english/            # (S4, ĐỔI so với "api/english/"): dictionary,
│                                  # pronunciation, pronounce-assess, tutor-feedback,
│                                  # challenge, echo-shadowing, phonetics…
└─ postgres/  scripts/  e2e/  docs/
```

Khác biệt so với `dac-ta-cai-to-cau-truc-2026-08-23.md` (vẫn hiệu lực phần còn lại):
`core-english` → **`subject-english`**, `api/english/` → **`api/subjects/english/`** — để mọi
môn sau này (`subject-math`…) theo đúng một khuôn, và để phân biệt rõ 2 loại gói:
`core-*` = nền tảng, `subject-*` = môn học.

## 4. Khuôn "thêm một môn học mới" (chuẩn hoá từ những gì english đã có)

Một môn học đầy đủ gồm 5 mảnh, mảnh nào cũng có chỗ đứng định sẵn:

| Mảnh                | Chỗ đứng                              | English hiện tại                                       |
| ------------------- | ------------------------------------- | ------------------------------------------------------ |
| Khai báo môn        | `subjectRegistry` (`core-learner`)    | ✅ đã có (english + 4 môn STEM ở dạng khai báo)        |
| UI môn              | `apps/dhcb/src/pages/subjects/<môn>/` | ✅ `subjects/english/` (18 file)                       |
| Logic + dữ liệu môn | `packages/subject-<môn>/`             | ⏳ S4 (đang rải ở `api/_lib` + `core-ai` + `src/data`) |
| API môn             | `api/subjects/<môn>/`                 | ⏳ S4 (đang phẳng trong `api/`)                        |
| Dữ liệu bền         | Postgres schema `<môn>.*`             | ✅ schema `english` (7 bảng)                           |

Dịch vụ nền tảng môn nào cũng dùng, KHÔNG tự chế lại: auth/usage (đếm lượt theo mode),
billing (gói Pro/VIP), tiến độ + SRS (đang là của english — S4 cân nhắc kéo phần chung về
`core-learner`), TTS/STT/AI gateway (`core-ai`), theme/a11y (`core-ui`).

Định nghĩa xong khuôn này thì `core-grading` (engine chấm STEM 1.355 dòng đang mồ côi) có chỗ
quay lại: nó là mảnh "logic môn" của `subject-math/physics/chemistry` khi các môn đó làm thật.

## 5. Tiêu chuẩn ngành — đang đạt gì, còn thiếu gì (trung thực)

**Đã đạt:** TS strict toàn repo · workspace npm thật + project references (S1) · boundary
enforce bằng lint (`packages ↛ apps`, `packages ↛ api`) · conventional commits + PR policy ·
CI 3 job (typecheck/lint/format/test+coverage sàn 90/build/size-budget/boot-check + e2e a11y
WCAG 15 trang × 5 theme) · migration đánh số + backup/restore kiểm chứng · secret qua env ·
zero-downtime deploy (PM2 wait_ready).

**Còn thiếu so với "cao nhất của ngành" (cập nhật trạng thái 2026-08-23 cuối ngày):**

1. Persistence 33 API in-memory — **ĐÃ TRẢ PHẦN LỚN**: nền `platform.feature_state`
   (0058) + lô B (5 handler per-user, PR #625) + **N3 (2026-08-23): nhóm A đã GỘP/XOÁ**
   (daily-quests + referral-vip xoá hẳn, leaderboard giả xoá) và **PvP chuyển feature_state**
   (Elo thật K=32, trận vs Ghost per-user). Còn nhóm C multi-user realtime (phòng
   co-learning, WS session, mesh-telemetry, debate/stem/orchestrator session) — cần shared
   store khi dùng thật, đã ghi ở PROGRESS.
2. ~~Đếm lượt/rate-limit đủ 100% đường AI trả tiền~~ **ĐÃ XONG** (B3): companion/
   vision-solve/ambient-vision trừ `chat` + refund; gemini-live rate-limit + trừ `speaking`;
   co-learning rate-limit. Kèm B1 (bỏ fallback u-default), B2 (health/deep gate admin),
   B5 (scheduler instance 0), B6 (trùng route + JSON 404).
3. ~~`quality`/`e2e` phải là **required status check**~~ **ĐÃ XONG** (người dùng xác nhận
   2026-08-23). Mục này TỪNG GHI NHẦM là "chưa làm" trong khi `CLAUDE.md` mục 13 đã ghi xong từ
   2026-07-11 — bài học: trạng thái việc tay phải HỎI người dùng để xác nhận, không suy từ trí
   nhớ của phiên trước. Nay bắt buộc cả `metadata` (không chỉ 2 check như ghi ban đầu).
4. ~~`npm audit` + `codemap cycles` vào CI~~ **ĐÃ XONG** (2 gate mới trong job quality).
5. Observability: Sentry đã có. **Alert chi phí AI theo token thật ĐÃ XONG (N4, 2026-08-23)**:
   bảng `platform.ai_token_usage_daily` (migration 0059) ghi token THẬT do nhà cung cấp báo về
   cho đường chat gia sư + Companion, quy giá bằng `capabilityCostTracker`, ngưỡng
   `AI_DAILY_BUDGET_USD` cảnh báo 1 lần/ngày, dashboard admin hiện cạnh số ước tính cũ. CÒN
   THIẾU: uptime monitor (cần dịch vụ ngoài — việc tay người dùng) và TTS/STT/chấm phát âm
   (tính theo ký tự/giờ audio, không theo token — vẫn dùng ước tính).
6. ~~Một lộ trình duy nhất~~ **ĐÃ CHỐT Q2**: thi hành = PROGRESS.md + tài liệu này;
   MASTER_SPEC = tầm nhìn; `docs/phases/` + `docs/architecture-v2/` = tham khảo (đã gắn banner).

## 6. Trình tự còn lại (điều chỉnh)

~~S3 (server → `apps/server/`)~~ ✅ ĐÃ XONG (cùng ngày) · ~~N1~~ ✅ ĐÃ XONG trong PR #625 (vá tiền/bảo mật — không
phụ thuộc cấu trúc) → ~~S4 (chia `api/` + `subject-english` + `core-domains`)~~ ✅ ĐÃ XONG (cùng ngày) → ~~S5~~ ✅ (thu hẹp: xoá mồ côi kiểm chứng; regroup components/lib HOÃN sau N3 — xem ADR-0004 mục 6) → ~~S6~~ ✅ (archive 24 script + ADR-0004). **Lộ trình S1→S6 HOÀN TẤT 2026-08-23.** ~~N3~~ ✅ (PR #629) → ~~N4~~ ✅ (đo chi phí AI theo
token thật + cảnh báo ngân sách). Còn lại: việc tay của người dùng (uptime monitor —
required status check đã xong 2026-08-23) + persistence nhóm C khi các tính năng realtime được dùng thật.

---

## [2] Tài liệu: dac-ta-gd1-scale-30k.md

_(Chi tiết nguồn gốc: `dac-ta-gd1-scale-30k.md`)_

# Đặc tả GĐ 1 — nền tảng đa tiến trình cho mục tiêu 30k concurrent

> Đặc tả thi hành cho `docs/research/ke-hoach-scale-30k-concurrent.md` §3 GĐ1. Chia 2 việc độc lập:
> **Việc A** (build TS→JS + PM2 cluster mode) do phiên chính (Opus) tự làm — quyết định kiến trúc,
> đụng cấu hình deploy, từng gây crash production 2026-07-20 (xem `ecosystem.config.cjs`), rủi ro cao.
> **Việc B** (rate limit Map → Redis) đặc tả kín, giao `spec-executor`.

## Việc A — Build TS→JS + bật lại PM2 cluster mode (Opus tự làm, không giao)

### Bối cảnh

`ecosystem.config.cjs` chạy `tsx server.ts` trực tiếp (`script: './node_modules/.bin/tsx'`).
Comment trong file ghi rõ: đã thử cluster mode 1 lần (PR #283/#284), worker **crash im lặng** vì
`--import tsx` (ESM loader) không tương thích Node `cluster` module → rollback về fork mode (PR #285).

### Mục tiêu

Chạy app bằng **JS đã biên dịch sẵn** (không qua `tsx` loader lúc runtime) để cluster mode hoạt động,
tận dụng nhiều CPU core trên 1 máy.

### Việc cần làm

1. Thêm `tsconfig.server.json` riêng (KHÔNG đụng `tsconfig.json`/`tsconfig.api.json` hiện có —
   chúng cố tình `noEmit: true` để chỉ typecheck): `include: ["api", "server.ts"]`, `noEmit: false`,
   `outDir: "dist-server"`, giữ `module`/`moduleResolution` tương thích Node ESM. Lưu ý import trong
   `server.ts`/`api/*.ts` đã ghi đuôi `.js` sẵn (vd `./api/tts.js`) — thuận cho Node ESM resolution,
   kiểm tra `tsc` emit ra đúng cấu trúc thư mục giữ nguyên đường dẫn tương đối.
2. Thêm script `build:server` (chạy `tsc -p tsconfig.server.json`) — gọi trong `npm run build` hiện có
   (không phá `build` cũ, chỉ nối thêm bước).
3. Sửa `ecosystem.config.cjs`: `script: './dist-server/server.js'` (bỏ `interpreter: tsx`),
   `instances: 'max'`, `exec_mode: 'cluster'`. Cập nhật comment giải thích đã gỡ nguyên nhân crash cũ.
4. Cập nhật `docs/deploy-vps-ubuntu.md`: thêm bước `npm run build:server` (hoặc gộp vào `npm run build`
   đã có) TRƯỚC khi `pm2 reload`/`pm2 start` trên VPS.
5. **Kiểm chứng bắt buộc trước khi coi là xong**: chạy local `npm run build:server && pm2 start
ecosystem.config.cjs` (hoặc mô phỏng gần nhất có thể trong sandbox), xác nhận nhiều instance start
   OK, `pm2 logs` không crash, `/api/health` trả 200 từ mọi instance. Nếu sandbox không chạy được PM2
   thật, ít nhất chạy `node dist-server/server.js` trực tiếp (single) để xác nhận build chạy đúng, và
   ghi rõ trong PROGRESS.md rằng **cluster mode thật cần xác nhận lại trên VPS** trước khi coi nợ kỹ
   thuật này đã hết (không tự ý phán "đã xong" nếu chưa test được trên máy có PM2 thật).

### Tiêu chí chấp nhận

- `npm run build` (gộp `build:server`) chạy sạch, không lỗi type.
- `node dist-server/server.js` khởi động, `/api/health` trả 200, ít nhất 1 luồng request end-to-end
  (vd `/api/dictionary`) hoạt động đúng như chạy bằng `tsx`.
- `ecosystem.config.cjs` cập nhật cluster mode + comment giải thích, không xoá lịch sử ghi chú cũ (giữ
  làm bài học, chỉ thêm dòng mới nói đã gỡ nguyên nhân).
- KHÔNG đổi logic nghiệp vụ trong `api/*.ts` — chỉ đổi cách build/chạy.

## Việc B — Rate limit: in-memory Map → Redis (giao `spec-executor`)

### Bối cảnh

`api/_lib/security.ts:68` dùng `Map` in-memory cho `checkRateLimit()`. Khi chạy nhiều PM2 instance
(kết quả Việc A) hoặc nhiều máy, mỗi instance có Map riêng → rate limit **không còn đúng** (1 IP có
thể vượt giới hạn N lần = N instance). Đây là điều kiện bắt buộc trước khi chạy cluster mode ở tải thật.

### Phạm vi thay đổi

1. Thêm dependency `ioredis` vào `package.json` (bản ổn định mới nhất — kiểm tra npm trước khi ghim
   version, không đoán).
2. Thêm biến môi trường `REDIS_URL` (`.env.example` + comment tiếng Việt giải thích). **Không bắt
   buộc** — nếu không set, giữ nguyên hành vi Map in-memory hiện tại (fail-open về đúng cơ chế cũ,
   giống triết lý FAIL-OPEN đã dùng ở `usage.ts`/`refundUsage`) để không phá dev local/môi trường
   chưa có Redis.
3. Sửa `api/_lib/security.ts`:
   - `checkRateLimit()` chuyển thành **async**, `Promise<boolean>`.
   - Nếu có `REDIS_URL`: dùng lệnh Redis atomic (`INCR` + `EXPIRE` khi key mới, hoặc dùng Lua script
     / `multi()` để tránh race) theo đúng cửa sổ 60s hiện có (namespace key `bucket:ip`, giữ đúng ý
     nghĩa `maxPerMin`).
   - Nếu KHÔNG có `REDIS_URL` hoặc Redis lỗi kết nối (bắt lỗi, KHÔNG để crash request): fallback về
     `Map` in-memory hiện tại — log cảnh báo 1 lần (không spam log mỗi request), giữ code Map cũ làm
     phương án dự phòng, không xoá.
   - Giữ nguyên chữ ký gọi ở phía dùng: `checkRateLimit(ip, maxPerMin, bucket)` nhưng giờ phải
     `await`.
4. Cập nhật **toàn bộ 17 call site** đang gọi `checkRateLimit(...)` đồng bộ (liệt kê để không sót):
   `api/progress.ts`, `api/admin-grant-plan.ts`, `api/admin-settings.ts`, `api/leaderboard.ts`,
   `api/pronounce-assess.ts`, `api/profile.ts`, `api/auth.ts`, `api/tts.ts` (2 chỗ), `api/app-settings.ts`,
   `api/pronunciation.ts` (2 chỗ), `api/dictionary.ts`, `api/tutor-feedback.ts`, `api/stt.ts`,
   `api/history.ts`, `api/challenge.ts`, `api/ai.ts` — đổi `if (!checkRateLimit(...))` thành
   `if (!(await checkRateLimit(...)))`, đảm bảo handler bao quanh đã là `async function` (đa số đã là
   — kiểm tra từng file, KHÔNG giả định).
5. Cập nhật test:
   - `api/_lib/security.test.ts`: sửa test hiện có thành `await checkRateLimit(...)`; thêm ít nhất 1
     test case xác nhận fallback Map hoạt động khi không có `REDIS_URL` (giữ hành vi cũ, không cần
     mock Redis thật — có thể test qua việc không set `REDIS_URL` trong test env).
   - Các file mock `checkRateLimit: () => true` (`api/history.test.ts`, `api/pronounce-assess.test.ts`,
     `api/challenge.test.ts`, `api/ai.test.ts`) đổi thành `checkRateLimit: async () => true` (hoặc
     `vi.fn().mockResolvedValue(true)`), khớp chữ ký mới.
6. Không cần Redis client thật để chạy CI/test — mock hoặc kiểm tra fallback nhánh Map khi
   `REDIS_URL` rỗng.

### Tiêu chí chấp nhận

- `npm run typecheck` sạch, `npm run lint` (0 cảnh báo), `npm test` xanh.
- Không đổi hành vi khi `REDIS_URL` không set (dev/local vẫn chạy y như trước — Map in-memory).
- Khi có `REDIS_URL` hợp lệ: rate limit đúng across nhiều tiến trình (test thủ công tối thiểu: 2
  process Node cùng gọi `checkRateLimit` chung 1 Redis, tổng số lần cho qua = đúng `maxPerMin`, không
  gấp đôi).
- Comment tiếng Việt giải thích rõ cơ chế fallback (đúng quy ước dự án — người đọc mới lập trình).
- Cập nhật đoạn comment "Với traffic thật nên dùng Redis (Upstash)..." trong `security.ts` cho khớp
  thực tế mới (đã dùng Redis khi cấu hình).

### Việc KHÔNG làm (ngoài phạm vi)

- Không đổi logic đếm lượt `usage.ts` (khác cơ chế, dùng Postgres — không đụng vào).
- Không thêm Redis cho cache TTS/dictionary (thuộc GĐ3, việc khác).
- Không đổi CORS/auth/logic khác trong `security.ts`.

## Thứ tự thực hiện

Việc B **không phụ thuộc** Việc A về mặt code (độc lập file), nhưng nên xong trước khi Việc A được
xác nhận chạy cluster mode thật trên VPS (nếu không, cluster mode sẽ làm rate limit sai ngay). Có thể
làm song song, nhưng merge Việc B trước khi bật cluster mode production.

---

## [3] Tài liệu: dac-ta-gd2-scale-50k.md

_(Chi tiết nguồn gốc: `dac-ta-gd2-scale-50k.md`)_

# Đặc tả GĐ 2 — Tầng dữ liệu chịu tải (Postgres/Redis tách máy + PgBouncer)

> Đặc tả thi hành cho `docs/research/ke-hoach-scale-30k-concurrent.md` §3 GĐ2, sau khi GĐ1 đã
> merge (PR #321/#322/#323) và quyết định 5.1/5.2 đã chốt: ngân sách $2.000/tháng, **tự host**.

## Giới hạn quan trọng cần biết trước (đọc kỹ)

Phiên AI này chạy trong sandbox, **không có quyền truy cập VPS production thật** (không SSH,
không tài khoản nhà cung cấp VPS/hosting để mua thêm máy). Deploy tự động (`.github/workflows/
deploy.yml`) chỉ chạy đúng các lệnh đã viết sẵn trong `scripts/deploy.sh` qua SSH bằng secret đã
cấu hình — không phải quyền truy cập tương tác.

Vì vậy GĐ2 chia làm 2 phần:

- **Phần A (AI tự làm được ngay, trong sandbox):** thay đổi code/config — pool Postgres cấu hình
  qua env thay vì hard-code, file cấu hình PgBouncer mẫu, cập nhật script/docs deploy.
- **Phần B (CẦN NGƯỜI DÙNG làm tay):** mua thêm VPS mới, cài PostgreSQL/PgBouncer/Redis lên đó,
  cấu hình DNS/firewall, chuyển `DATABASE_URL`/`REDIS_URL` sang trỏ máy mới. AI **không thể** tự
  hoàn thành phần này — sẽ viết thành **runbook chi tiết từng lệnh** để người dùng copy-paste.

## Phần A — Việc AI làm ngay (Opus tự làm, ít rủi ro, dễ kiểm chứng)

### A1. `api/_lib/pgPool.ts` — pool size cấu hình được qua env

Hiện tại `max: 10` hard-code. Đổi sang đọc từ `PG_POOL_MAX` (mặc định giữ 10 nếu không set —
không đổi hành vi hiện tại), để khi có PgBouncer/máy Postgres riêng, chỉnh số này qua `.env`
không cần sửa code + build lại.

### A2. File cấu hình PgBouncer mẫu

Thêm `postgres/pgbouncer.ini.example` (transaction pooling mode, `max_client_conn` cỡ vài nghìn,
`default_pool_size` khớp `PG_POOL_MAX` × số tiến trình app) + comment tiếng Việt giải thích từng
tham số. Đây là FILE MẪU — người dùng copy sang máy Postgres thật, điền `DATABASE_URL` thật.

### A3. Cập nhật `docs/deploy-vps-ubuntu.md` — thêm mục "GĐ2: tách Postgres/Redis ra VPS riêng"

Runbook từng bước (Phần B) để người dùng tự chạy tay trên VPS mới:

1. Tạo VPS mới (khuyến nghị: Hetzner CX-series hoặc Vultr/DigitalOcean cỡ trung, 4 vCPU/8GB —
   trong ngân sách đã đánh giá ở mục 4.1 kế hoạch scale).
2. Cài PostgreSQL 16+ + PgBouncer (`apt install postgresql postgresql-contrib pgbouncer`).
3. Copy `postgres/schema.sql` + chạy `npm run migrate:pg` trỏ vào máy mới.
4. Cấu hình PgBouncer bằng file mẫu A2.
5. Mở firewall CHỈ cho IP VPS app (không public 5432/6432 ra Internet).
6. Đổi `DATABASE_URL` trên VPS app trỏ qua PgBouncer (`postgresql://...@<ip-db-vps>:6432/...`).
7. Redis: cài `redis-server` trên cùng VPS DB hoặc VPS riêng nếu tải cao; đổi `REDIS_URL`.
8. Restart app (`bash scripts/pm2-reload.sh`), xác nhận `/api/health` OK + thử 1 luồng
   chat/dictionary thật.
9. **Rollback nếu lỗi:** giữ nguyên `DATABASE_URL`/`REDIS_URL` cũ (Postgres/Redis local trên VPS
   app hiện tại) cho tới khi xác nhận máy mới ổn định — KHÔNG xoá dữ liệu cũ ngay.

### A4. Rà index (đã rà trong phiên này — không cần đổi)

Đã đọc `postgres/schema.sql`: các bảng truy vấn nóng nêu trong kế hoạch (`daily_usage`,
`profiles`, `learning_progress`) đã có primary key/index hợp lý (`daily_usage` PK
`(user_id, day)` đúng pattern truy vấn của `consume_usage`/`refund_usage`; `profiles`/
`learning_progress` PK là `user_id`). **Không cần thêm index mới ở GĐ2.**

## Phần B — Người dùng cần tự làm (không thể giao AI)

- Quyết định + mua VPS mới (billing, tài khoản nhà cung cấp).
- Chạy các lệnh SSH trong runbook A3 trên máy mới.
- Xác nhận firewall/security group đúng (không lộ Postgres/Redis ra Internet).

## Tiêu chí chấp nhận Phần A

- `npm run typecheck`/`lint`/`test` xanh, không đổi hành vi khi `PG_POOL_MAX` không set.
- `postgres/pgbouncer.ini.example` không phải file thật thi hành được ngay (chỉ mẫu, không đưa
  secret), có comment tiếng Việt.
- `docs/deploy-vps-ubuntu.md` có runbook đầy đủ, đủ chi tiết để người mới làm theo được (đúng
  triết lý CLAUDE.md — người dùng mới lập trình).

---

## [4] Tài liệu: ke-hoach-scale-30k-concurrent.md

_(Chi tiết nguồn gốc: `ke-hoach-scale-30k-concurrent.md`)_

# Kế hoạch mở rộng: đáp ứng 50.000 người dùng ACTIVE CÙNG LÚC

> Soạn 2026-07-25, **cập nhật mục tiêu 30k → 50.000 concurrent cùng ngày** (giữ tên file cũ để
> không vỡ liên kết — nội dung đã cập nhật). Mục tiêu: nâng hạ tầng từ "1 VPS / 1 tiến trình
> fork" (đủ ~vài trăm–1.000 đồng thời) lên **50.000 người dùng đồng thời (concurrent)**, trong
> **ngân sách đã chốt: $2.000/tháng hạ tầng + AI ≤ ~$1,67/user/tháng** (xem mục 5.1). Đây là tài
> liệu KẾ HOẠCH — GĐ1 đã xong (PR #321, #322), GĐ2–5 chưa làm.

## 0. TL;DR

Kiến trúc hiện tại **không** chịu nổi 30k đồng thời vì 5 nút thắt cứng (đã đối chiếu code thật):

| #   | Nút thắt                                                | Bằng chứng trong code                          | Trần hiện tại                          |
| --- | ------------------------------------------------------- | ---------------------------------------------- | -------------------------------------- |
| 1   | 1 tiến trình Node, fork mode, 1 core                    | `ecosystem.config.cjs` (không set `instances`) | ~1 core JS                             |
| 2   | Pool Postgres `max: 10`                                 | `api/_lib/pgPool.ts:19`                        | 10 query đồng thời                     |
| 3   | Rate limit in-memory `Map`                              | `api/_lib/security.ts:68`                      | Vỡ khi chạy >1 instance                |
| 4   | VPS dùng chung với app "xboss"                          | `ecosystem.config.cjs` (PORT 3001)             | Không tài nguyên riêng                 |
| 5   | Gọi AI trả phí đồng bộ mỗi request (Claude/Whisper/TTS) | `api/ai.ts`, `api/stt.ts`, `api/tts.ts`        | Trần chi phí + rate limit nhà cung cấp |

Điểm mấu chốt: **30k concurrent KHÔNG phải 30k request/giây**. Nếu mỗi người thao tác ~1 lần / 30–60s,
tải nền ~500–1.000 req/s; nhưng lời gọi AI kéo dài 1–5s nên số **request đang bay đồng thời** có thể
1.000–3.000. Con số này quyết định số instance và độ rộng pool/queue.

## 1. Nguyên tắc thiết kế

1. **Không viết lại app** — giữ nguyên logic handler `api/*`, chỉ đổi cách _chạy_ và _chia tải_.
2. **Stateless hoá tiến trình** — mọi state chia sẻ (rate limit, cache, session tạm) ra Redis, để chạy N instance sau load balancer.
3. **Tách phần đắt/chậm (AI) khỏi đường request đồng bộ** khi có thể — cache mạnh + hàng đợi.
4. **Đo trước khi mở rộng** — dựng load test (k6) làm thước đo mỗi giai đoạn, không "mở rộng mù".
5. **Chi phí là ràng buộc số 1** — dự án miễn phí cho cộng đồng; 30k concurrent gọi AI có thể tốn hàng nghìn USD/ngày nếu không cache/giới hạn. Phải chốt ngân sách + hạn mức trước.

## 2. Kiến trúc đích (tóm tắt)

```
                 Cloudflare (CDN + WAF + rate limit biên)
                          │
                    Nginx / LB (nhiều máy)
                          │
        ┌──────── N × Node instance (app, stateless) ────────┐
        │                    │                               │
     Redis (cache +      PgBouncer  ──►  Postgres primary  ──► read-replica(s)
     rate limit +           │
     queue)             Object storage (R2/S3) + CDN cho audio
        │
     Worker pool (BullMQ) ──► gọi AI (Claude/Whisper/TTS) bất đồng bộ
```

## 3. Lộ trình theo giai đoạn (ưu tiên theo đòn bẩy/chi phí)

### GĐ 1 — Cho phép chạy đa tiến trình + đa máy (nền tảng bắt buộc)

Mục tiêu: gỡ nút thắt #1, #3. Đây là điều kiện tiên quyết cho mọi bước sau.

1. **Bước build TS→JS** (`tsc`/esbuild ra `dist/`) rồi chạy `node dist/server.js` thay `tsx`.
   → Gỡ đúng nguyên nhân cluster mode crash trước đây (xung đột `--import tsx` + Node cluster).
2. Bật **PM2 cluster mode** `instances: 'max'` (hoặc chạy container + orchestrator). Tận dụng mọi core.
3. **Redis** (self-host hoặc Upstash) → chuyển rate limit `Map` (`api/_lib/security.ts`) sang Redis
   để đúng khi chạy nhiều instance. Đưa mọi state tạm khác vào Redis.
4. Kiểm chứng: chạy 2–4 instance sau Nginp, xác nhận rate limit + auth hoạt động đồng nhất.

**DoD GĐ1:** app chạy ≥ N instance stateless, rate limit toàn cụm đúng, không hồi quy chức năng.

### GĐ 2 — Tầng dữ liệu chịu tải

Mục tiêu: gỡ nút thắt #2.

1. **PgBouncer** (transaction pooling) trước Postgres — hàng nghìn client → ít kết nối thật.
2. Nâng `max` pool theo instance cho hợp PgBouncer; đặt statement/idle timeout.
3. Tách **Postgres ra máy riêng** (rời VPS dùng chung) — cân nhắc DB có quản lý (Neon/RDS) có sẵn replica + backup.
4. **Read-replica** cho truy vấn đọc nặng (leaderboard, dictionary, progress).
5. Rà index cho các truy vấn nóng (`daily_usage`, `profiles`, `learning_progress`).

**DoD GĐ2:** chịu ≥ 2.000 query đồng thời không cạn kết nối; p95 truy vấn < 50ms ở tải mục tiêu.

### GĐ 3 — Cắt tải AI (chi phí + độ trễ)

Mục tiêu: gỡ nút thắt #5 — quan trọng nhất về tiền.

1. **Cache mạnh TTS** (đã có cache mã hoá — mở rộng), phục vụ audio qua **R2 + CDN** (`STORAGE_DRIVER=r2`), không qua Node.
2. **Cache dictionary/pronunciation** ở Redis + CDN (nội dung tĩnh, dùng lại cao).
3. **Hàng đợi (BullMQ) cho STT/chat/TTS**: request đẩy vào queue, worker pool xử lý, giới hạn concurrency gọi nhà cung cấp → không vượt rate limit Anthropic/Groq/Google, không sập khi tải đỉnh.
4. **Trần chi phí + hạn mức**: giữ đếm lượt server (đã có `usage.ts`), thêm **circuit breaker** khi chi phí/ngày chạm ngưỡng.
5. Cân nhắc model rẻ hơn/self-host STT (Whisper) nếu chi phí Groq/OpenAI vượt ngân sách.

**DoD GĐ3:** ≥ 70% lượt TTS/dictionary phục vụ từ cache/CDN; gọi AI có trần concurrency; có dashboard chi phí.

### GĐ 4 — Quan sát & kiểm chứng tải

1. Bật **Sentry** (đang nợ — chỉ cần điền DSN, **cần người dùng tự làm**: AI không có tài
   khoản sentry.io để tạo DSN) + metrics (Prometheus/Grafana hoặc APM sẵn có).
2. **Load test k6**: đã có kịch bản khởi điểm `scripts/load-test/k6-baseline.js`
   (`npm run loadtest:k6`, cần cài k6 binary + set `BASE_URL`) — test 2 route nhẹ (health +
   dictionary), ramp thận trọng từ `VU_TARGET` thấp (mặc định 100, tăng dần qua nhiều lần chạy,
   KHÔNG nhảy thẳng lên 50k). Kịch bản đủ cho luồng có đăng nhập + gọi AI thật (chat/speaking/
   stt) CHƯA viết — tốn tiền thật mỗi request, cần ngân sách test riêng, làm sau.
3. Alert theo p95 latency, tỷ lệ lỗi, độ sâu queue, chi phí AI.

**DoD GĐ4:** k6 50k VU đạt p95 < mục tiêu, tỷ lệ lỗi < 1%, không sập tầng nào. **Chạy k6 là việc
người dùng tự thực hiện** (nhắm vào staging hoặc production thật ở giờ ít traffic) — AI chỉ
chuẩn bị kịch bản, không tự chạy load test nhắm vào production được (rủi ro làm sập dịch vụ
đang phục vụ người dùng thật, cần người quyết định thời điểm).

### GĐ 5 — Vận hành & dự phòng

1. Nginx/LB **≥ 2 máy** (bỏ single point of failure), health check tự loại instance chết. **CẦN
   MUA MÁY MỚI (Phần B, người dùng tự làm)** — chưa thực hiện được trong sandbox này.
2. Auto-restart: **ĐÃ CÓ SẴN** (`ecosystem.config.cjs` — `restart_delay`/`max_restarts`/
   `min_uptime`, PM2 tự khởi động lại khi crash). Auto-scale (container/K8s/VPS scaling theo
   traffic): chưa làm, phụ thuộc quyết định 5.2 (đã chốt tự host VPS thường — auto-scale kiểu
   này thường cần thêm công cụ giám sát + script riêng, ưu tiên thấp hơn LB/backup).
3. Backup Postgres: **tự động ĐÃ CÓ SẴN** (`docs/setup-postgresql-vps.md` mục 7, cron `pg_dump`
   hàng ngày). **Kiểm thử phục hồi: ĐÃ THÊM** `scripts/verify-pg-backup.sh` (mục 7.1 cùng doc) —
   restore vào database tạm + kiểm tra dữ liệu, khuyến nghị chạy cron hàng tuần. Kế hoạch
   rollback từng giai đoạn: đã có sẵn rải rác trong từng PR (GĐ1: rollback fork mode ghi trong
   `ecosystem.config.cjs`; GĐ2: rollback giữ `.env` cũ trong runbook) — chưa gom thành 1 tài
   liệu riêng, có thể làm nếu cần.

## 4. Ước lượng tài nguyên (thô — cần k6 xác nhận, đã cập nhật cho mục tiêu 50k)

- **App**: 50k concurrent → ước ~2.500–4.500 req đang bay đồng thời (x1,67 so với ước lượng 30k
  cũ). Mỗi Node instance IO-bound gánh ~1–2k kết nối → cần **~14–27 vCPU** tổng cho tầng app.
- **Redis**: 1 node (cân nhắc thêm replica nếu ngân sách cho phép) — tải rate limit + cache.
- **Postgres**: 1 primary khoẻ (6–8+ vCPU) + 1 replica; PgBouncer gom kết nối — tải tăng so với
  30k, cần đo thật qua k6 trước khi chốt spec máy.
- **AI/chi phí**: **ràng buộc lớn nhất**, càng găng hơn ở 50k. Cache + queue là BẮT BUỘC, không
  còn là "nên làm" — thiếu chúng, chi phí AI ở quy mô 50k gần như chắc chắn vượt trần $1,67/user.

### 4.1 Ngân sách $2.000/tháng có đủ cho 50k không? (đánh giá 2026-07-25)

**Rất eo hẹp — chỉ khả thi nếu tự host toàn bộ (self-host), không dùng managed service cao cấp.**
Lý do:

- Riêng tầng app đã cần ~14–27 vCPU — tương đương 3–6 VPS cỡ trung (4–8 vCPU/máy) ở nhà cung cấp
  giá rẻ (Hetzner/Vultr/DigitalOcean cỡ $40–80/máy/tháng) → **~$150–450/tháng** chỉ cho tầng app.
- Postgres tự host (primary + replica, máy riêng khỏi VPS dùng chung hiện tại) → **~$150–300/tháng**
  tự host; managed (Neon/RDS cỡ tương đương) có thể **gấp 2–4 lần** con số này ở mức tải 50k.
- Redis tự host: **~$20–60/tháng**; managed (Upstash) tính theo lượt gọi — có thể rẻ hơn ở tải
  vừa nhưng cần ước lượng kỹ ở 50k (rate limit + cache gọi rất nhiều lần/giây).
- Load balancer + Nginx: dùng LB của nhà cung cấp (~$10–20/tháng) hoặc thêm 1 VPS nhỏ.
- CDN/object storage cho audio TTS (Cloudflare R2): egress rẻ/miễn phí phần lớn — không đáng kể.

**Tổng tự host ước tính: ~$350–850/tháng** cho hạ tầng lõi — **nằm trong ngân sách $2.000/tháng**,
còn dư cho dự phòng/tăng trưởng. Nhưng nếu chọn managed service (Neon/Upstash/RDS tier cao, K8s
managed...) ở quy mô 50k, **rất dễ vượt $2.000/tháng chỉ riêng phần DB+cache**, chưa tính app.

**Hệ quả cho quyết định 5.2 (nền tảng deploy):** ngân sách này **gần như ép chọn tự host VPS**
(mở rộng từ VPS hiện có, không chuyển sang managed cao cấp) để nằm trong $2.000/tháng — đổi lại
gánh thêm công vận hành (patch OS, backup thủ công, HA tự dựng). Đây là khuyến nghị, cần bạn xác
nhận trước khi thiết kế chi tiết GĐ2.

## 5. Rủi ro & điểm cần bạn quyết

1. ~~**Ngân sách hạ tầng + AI/tháng**~~ **ĐÃ CHỐT (2026-07-25, xem mục 5.1 dưới)**.
2. ~~**Nền tảng deploy**~~ **ĐÃ CHỐT (2026-07-25): TỰ HOST** — giữ VPS thủ công (Nginx+PM2), mở
   rộng thêm máy khi cần thay vì chuyển sang managed/container platform. Đúng như khuyến nghị ở
   mục 4.1 (managed cao cấp dễ vượt ngân sách $2.000/tháng ở quy mô 50k). GĐ2 (PgBouncer/
   read-replica/thêm VPS) sẽ thiết kế theo hướng tự host thuê thêm VPS giá rẻ (Hetzner/Vultr/
   DigitalOcean cỡ trung), KHÔNG dùng Neon/Upstash/RDS/K8s managed.
3. ~~**Tự host hay thuê quản lý** Postgres/Redis~~ **ĐÃ CHỐT cùng mục 5.2 — tự host cả hai.**
4. Cluster mode từng crash — **ĐÃ LÀM GĐ1** (PR #321), đang vá thêm 1 lỗi phát hiện qua log deploy thật (PR #322, xem PROGRESS.md).

### 5.1 Ngân sách (CHỐT 2026-07-25, quy mô nâng lên 50k cùng ngày)

- **Hạ tầng: $2.000/tháng**, tính cho quy mô **tối đa 50.000 concurrent** (không phải mức khởi
  động rồi tăng dần) — đây là ràng buộc CỨNG cho thiết kế GĐ2 (Postgres/Redis/LB): phải chọn
  giải pháp vừa túi tiền này ở tải đỉnh, không phải "cứ dùng managed service tốt nhất rồi tính
  sau". Xem đánh giá chi tiết ở mục 4.1 — **khả thi nếu tự host, eo hẹp/khó khả thi nếu managed
  cao cấp**.
- **AI: trần ≤ 1/3 doanh thu gói Pro dự kiến ($5/tháng/user) = ~$1,67/user/tháng.** Đây là thay
  đổi mô hình sản phẩm quan trọng: **đảo ngược quyết định 2026-07-11** ("dự án dùng MIỄN PHÍ cho
  cộng đồng — KHÔNG làm thanh toán Pro tới khi người dùng chủ động yêu cầu lại", xem CLAUDE.md
  mục 13 + PROGRESS.md mục "Việc còn dang dở" #3). Người dùng dự án đã chủ động yêu cầu lại
  (2026-07-25) — nhưng **thanh toán là 1 trong các việc CLAUDE.md mục 12 bắt buộc dừng lại hỏi
  trước khi làm** ("đụng bảo mật, thanh toán, dữ liệu người dùng thật"). Việc thi hành gói Pro
  $5/tháng (chọn cổng thanh toán, schema, luồng nâng/hạ cấp, thuế/hoá đơn nếu có...) là **một dự
  án riêng, cần đặc tả riêng** — KHÔNG nằm trong phạm vi kế hoạch scale 30k concurrent này. Kế
  hoạch này chỉ DÙNG con số $1,67/user/tháng làm trần thiết kế cho GĐ3 (cache/queue/circuit
  breaker chi phí AI), không tự ý triển khai thu phí.

## 6. Đề xuất bắt đầu

**GĐ 1 đã xong** (PR #321 merged, PR #322 đang vá 1 lỗi phát hiện qua log deploy thật — xem
PROGRESS.md). Ngân sách (5.1) đã chốt. Còn thiếu trước khi làm GĐ2: chốt mục 5.2 (nền tảng
deploy Postgres/Redis) — so sánh chi phí cụ thể trong ngân sách $2.000/tháng. Việc thu phí Pro
(để hiện thực hoá trần ngân sách AI 5.1) là việc riêng, cần bạn xác nhận có muốn bắt đầu đặc tả
tính năng đó ngay bây giờ hay để sau khi xong hạ tầng scale.

---

## [5] Tài liệu: lo-trinh-100k-200k-1trieu.md

_(Chi tiết nguồn gốc: `lo-trinh-100k-200k-1trieu.md`)_

# Lộ trình kỹ thuật: 100k → 200k → 1 triệu active tự host

> Nối tiếp `docs/research/ke-hoach-scale-30k-concurrent.md` (mục tiêu gốc 50k). Tài liệu này
> **KHÔNG xét ngân sách** — chỉ xét khả thi kỹ thuật khi tự host, và **cảnh báo rủi ro an toàn**
> (mất dữ liệu, sập dịch vụ, vận hành quá tải con người) ở từng mốc. Ngân sách là quyết định
> riêng của người dùng, không phải điều kiện chặn ở đây.

## Nguyên tắc xuyên suốt

1. **Không nhảy cóc mốc.** Mỗi mốc phải đo bằng k6 thật (`scripts/load-test/k6-baseline.js`)
   trước khi coi là đạt — không suy diễn từ mốc trước.
2. **Mỗi mốc thêm 1 lớp phức tạp vận hành mới.** Càng lên cao, số việc có thể tự làm 1 mình càng
   giảm — tới 1 triệu, tự host AN TOÀN gần như chắc chắn cần ≥1 người phụ trách hạ tầng full-time
   (không phải cảnh báo ngân sách, mà cảnh báo **rủi ro vận hành**: 1 người không kịp phản ứng sự
   cố 24/7 ở quy mô này).

---

## Mốc 100k concurrent

> **QUYẾT ĐỊNH (2026-07-25):** 50k vận hành **tự host thủ công** (theo
> `docs/huong-dan-tu-host-scale-50k.md`). Tới 100k, chuyển **TOÀN BỘ stack sang managed
> auto-scale** — không tiếp tục tự host thêm VPS. Lý do: đúng ranh giới "vùng chuyển tiếp" đã
> phân tích — 1 người vận hành thủ công ổn định tới ~100k, qua mốc đó nên trả tiền cho tự động
> hoá thay vì tự làm tay.

### Kiến trúc managed (thay thế hoàn toàn VPS tự host)

| Tầng             | Dịch vụ                                                                | Thay thế cho                                  |
| ---------------- | ---------------------------------------------------------------------- | --------------------------------------------- |
| App              | Render / Fly.io / AWS Fargate (auto-scale)                             | VPS app + PM2 cluster mode + Nginx LB tự host |
| Database         | Neon Postgres (serverless, auto-scale, backup tự động, replica có sẵn) | VPS Postgres + PgBouncer tự host              |
| Cache/rate-limit | Upstash Redis (serverless)                                             | VPS Redis tự host                             |
| Audio storage    | Cloudflare R2 (giữ nguyên — đã managed sẵn từ trước)                   | —                                             |

**Code hiện tại đã tương thích thẳng** — `DATABASE_URL`/`REDIS_URL` chỉ là connection string,
đổi sang Neon/Upstash không cần sửa code (`getPgPool()`/`getPgReadPool()` đã trừu tượng hoá).
Riêng tầng app cần đóng gói lại thành container (Dockerfile) nếu Render/Fly.io yêu cầu — hiện
app chạy trực tiếp qua PM2 trên VPS, chưa có Dockerfile trong repo.

### Ước tính chi phí managed ở 100k concurrent (2026-07-25 — THÔ, cần k6 xác nhận)

> Dao động rộng vì phụ thuộc TẢI TRUY VẤN THẬT, không chỉ số người dùng. Lấy báo giá chính thức
> từ từng nhà cung cấp sau khi có số liệu k6, đừng dùng số này để chốt ngân sách thật.

| Hạng mục                                                        | Ước tính/tháng             |
| --------------------------------------------------------------- | -------------------------- |
| App (Render/Fly.io/Fargate, auto-scale ~28-54 vCPU tương đương) | $800 – 2.500               |
| Database (Neon, compute + storage tự scale)                     | $700 – 2.000               |
| Redis (Upstash, theo lượt gọi hoặc gói cố định)                 | $100 – 1.000               |
| CDN/Storage (Cloudflare R2 — không đổi)                         | $10 – 50                   |
| **Tổng ước tính**                                               | **~$2.800 – $6.500/tháng** |

**Việc cần làm trước khi chuyển:**

1. Chạy k6 (`scripts/load-test/k6-baseline.js`) ở mức tải gần 100k để lấy số request/giây +
   query/giây thật — input bắt buộc để báo giá managed chính xác.
2. Đóng gói app thành container (viết `Dockerfile`, chưa có trong repo) nếu chọn Render/Fly.io/
   Fargate.
3. Export dữ liệu từ Postgres tự host (VPS) → import vào Neon; tương tự Redis (không cần export
   vì chỉ là cache, mất dữ liệu ở đây không nghiêm trọng — tự build lại cache dần).
4. Chạy song song (VPS cũ + managed mới) một thời gian, so sánh kết quả trước khi cắt hẳn DNS/
   traffic sang managed.

**⚠️ Cảnh báo an toàn:** nếu chưa bật Sentry (vẫn là nợ kỹ thuật) — ở 100k, sự cố sẽ xảy ra
THƯỜNG XUYÊN hơn nhiều so với hiện tại mà không ai biết cho tới khi người dùng report. Bắt buộc
phải bật trước khi lên mốc này, không phải tuỳ chọn nữa.

## Mốc 200k concurrent

**Thay đổi kiến trúc thật sự bắt đầu ở đây:**

- **Hàng đợi cho AI (BullMQ hoặc tương đương) trở thành bắt buộc, không còn là lựa chọn.** Ở
  200k, số request đồng thời gọi AI đủ lớn để concurrency limiter (chặn tại chỗ, giữ request
  đợi) bắt đầu gây timeout hàng loạt phía client thay vì chỉ làm chậm — cần chuyển sang mô hình
  hàng đợi thật (client nhận "đang xử lý", poll hoặc WebSocket nhận kết quả). **Đây LÀ breaking
  change UX** (đã nêu ở GĐ3) — cần thiết kế lại luồng Chat/Speaking phía client, không chỉ backend.
- **Phân vùng bảng nóng theo thời gian** (`daily_usage`, có thể cả `chat_sessions`/
  `speaking_sessions`) — Postgres partitioning theo tháng/quý, giảm kích thước index phải quét,
  tăng tốc query + dọn dữ liệu cũ (drop cả partition thay vì DELETE hàng loạt).
- **Kết nối DB**: PgBouncer 1 tầng có thể không đủ — cân nhắc PgBouncer nhiều tầng hoặc
  `pgcat` (hỗ trợ sharding-aware routing tốt hơn) nếu tách nhiều Postgres theo vùng dữ liệu.
- **Cache Redis**: cân nhắc Redis Cluster (sharding thật, không chỉ Sentinel failover) nếu 1
  node đơn (dù có Sentinel) bắt đầu chạm giới hạn CPU/băng thông mạng.

**⚠️ Cảnh báo an toàn nghiêm trọng:** Postgres partitioning và chuyển sang hàng đợi là các thay
đổi **có thể mất dữ liệu hoặc gây downtime dài nếu làm sai** (không giống các bước ở 50k-100k,
vốn chỉ thêm máy). **Bắt buộc test đầy đủ trên môi trường staging/VM riêng trước khi áp production
— không làm trực tiếp trên dữ liệu thật.**

## Mốc 1 triệu active

Đây không còn là "thêm máy" — là **kiến trúc khác hẳn**, dù vẫn tự host được:

- **Postgres HA + sharding thật**: Patroni (tự động failover primary) + Citus hoặc sharding tay
  theo `user_id` (mỗi shard là 1 cụm Postgres riêng, ứng dụng biết route theo hash user_id).
  Đây là thay đổi lớn nhất — ảnh hưởng MỌI query trong `api/_lib/*.ts` hiện đang giả định 1 DB
  duy nhất.
- **Hàng đợi AI phân tán thật** (BullMQ + Redis Cluster làm broker, nhiều worker process/máy
  riêng, tách khỏi tiến trình phục vụ HTTP).
- **CDN edge mạnh hơn**: audio TTS/pronunciation gần như 100% phải phục vụ từ cache CDN
  (Cloudflare R2 + cache rule tối ưu), Node hầu như không bao giờ cache-miss ở steady state.
- **Multi-region cân nhắc** nếu người dùng trải nhiều múi giờ/khu vực địa lý xa (độ trễ mạng
  transatlantic/transpacific bắt đầu đáng kể) — tăng độ phức tạp vận hành rất nhiều (đồng bộ dữ
  liệu giữa vùng, latency ghi).
- **Giám sát 24/7 thật** (không chỉ Sentry bắt lỗi — cần alert PagerDuty/tương đương, người trực
  ca) — ở quy mô này, downtime 10 phút ảnh hưởng hàng chục nghìn người dùng cùng lúc.

**⚠️ Cảnh báo an toàn nghiêm trọng nhất:** tự host ở quy mô 1 triệu active **AN TOÀN chỉ khi có
đội vận hành chuyên trách** (không phải 1 người kiêm nhiệm). Rủi ro thật nếu cố tự host với nhân
sự không đủ: mất dữ liệu do sharding/failover cấu hình sai, downtime kéo dài vì không ai trực khi
sự cố xảy ra ngoài giờ, chi phí sửa lỗi sau khi mất dữ liệu **cao hơn nhiều** so với chi phí thuê
thêm người/dùng managed service cho riêng tầng DB (dù kiến trúc tổng thể vẫn tự host phần còn lại).
Đây là cảnh báo về **an toàn vận hành**, không phải về tiền — quyết định nhân sự vẫn của bạn.

---

## Việc CÓ THỂ chuẩn bị trước (code), CHƯA cần chờ tới mốc tương ứng

Đã làm (PR #329): `getPgReadPool()`, `AI_CONCURRENCY_*`, `MIGRATE_DATABASE_URL`. Các việc sau
**chưa làm** vì cần quyết định kiến trúc rõ ràng hơn trước khi viết code (tránh viết sai rồi phải
viết lại):

- Thiết kế partitioning cho `daily_usage` (cần biết chu kỳ dọn dữ liệu thật trước khi chọn theo
  tháng hay quý).
- Chọn công nghệ hàng đợi (BullMQ vs khác) — phụ thuộc quyết định UX (poll vs WebSocket) chưa có.
- Chọn chiến lược sharding (Citus vs sharding tay) — phụ thuộc traffic pattern thật đo được ở
  mốc 200k, chưa có số liệu.

Khi tới gần mỗi mốc, quay lại yêu cầu tôi đặc tả chi tiết + implement phần tương ứng.

---

## [6] Tài liệu: v2-final-architecture-audit.md

_(Chi tiết nguồn gốc: `v2-final-architecture-audit.md`)_

# Platform V2 Final Architecture & Scale Audit Evidence Report

**Milestone:** V2-20 — Scale and Final Architecture Audit  
**Date:** 2026-08-17  
**Status:** ACCEPTED (100% Passed)  
**Evaluator:** AI Delivery Loop

---

## 1. Executive Summary

Dong Hanh Platform V2 has successfully completed its final architecture, scale, and safety audit.
All **8 Acceptance Invariants** defined in `docs/architecture-v2/21-ROADMAP.md` have been programmatically evaluated and validated against deterministic golden sets, adversarial red-team harnesses, privacy cascade drills, and cross-domain end-to-end integration tests.

```
╔════════════════════════════════════════════════════════════════════════════╗
║        PLATFORM V2 FINAL ARCHITECTURE & SCALE ACCEPTANCE AUDIT (V2-20)     ║
╚════════════════════════════════════════════════════════════════════════════╝

Criteria Evaluated: 8 / 8
Criteria Passed:    8 / 8 (100.00%)
Status:             PASSED (Ready for Production Deployment)
```

---

## 2. Acceptance Invariants & Audit Results

### Invariant 1: Multi-Domain Companion Integration

- **Requirement**: The same person uses a single Companion runtime across $\ge 2$ production domains without context fragmentation.
- **Verification**:
  - Companion Runtime routes requests dynamically across **5 production domains**: `learning` (English & STEM), `career`, `work`, `startup`, and `life`.
  - Intent classification achieved **98.00% accuracy** (49/50 fixture tests passed in `eval:v2:routing`).
  - Session conversation preserves identity, facts, and intent when switching between domains (e.g. learning English for a job interview $\leftrightarrow$ updating career profile $\leftrightarrow$ scheduling life habits).
- **Result**: **PASS**

### Invariant 2: Cross-Domain Life Graph

- **Requirement**: Life Graph connects cross-domain goal/evidence without schema leaking.
- **Verification**:
  - `CrossDomainGraphService` establishes semantic links between `Career Goal` $\rightarrow$ `Skill Gap` $\rightarrow$ `Learning Mastery` $\rightarrow$ `Life Graph Nodes & Edges` (`requires`, `supports`).
  - Boundary isolation maintained: CrossDomain service reads from `LearningReadModel` without querying internal tables of the learning domain.
- **Result**: **PASS**

### Invariant 3: Personal World Model Integrity

- **Requirement**: Personal World Model enforces provenance, confidence, and privacy controls.
- **Verification**:
  - `personal.personal_facts` and `personal.memory_records` enforce non-empty provenance (`user_declared` vs `derived`).
  - Personal Policy authority gate evaluates `ALLOW` / `DENY` rules before any context packaging or tool invocation.
  - Zero DENY-bypasses (0/40 adversarial attempts) and 0 sensitive leakage in `eval:v2:permissions` and `eval:v2:context`.
- **Result**: **PASS**

### Invariant 4: Knowledge Fabric Inspect / Correct / Delete

- **Requirement**: Knowledge Fabric supports full export, correction, and cascade deletion across all 13 database schemas.
- **Verification**:
  - `exportPersonData` extracts complete graph, memories, facts, consent, automation, and domain records across 13 schemas.
  - `erasePersonData` executes atomic cascade erasure within a single PostgreSQL transaction, leaving zero residual personal records.
  - 7/7 privacy drills passed in `eval:v2:privacy`.
- **Result**: **PASS**

### Invariant 5: External Side Effects & Authority Enforcement

- **Requirement**: External side effects require explicit grants, authority checks, action receipts, and compensation.
- **Verification**:
  - `AutomationService` requires valid `AutomationGrant` (`status = 'active'`, `reviewAt` in the future).
  - Rate limits (hourly/daily quotas and cooldowns) enforced atomically.
  - `ActionReceipt` stored immutably with unique idempotency keys to prevent duplicate executions.
  - Automatic compensation triggered on failures.
- **Result**: **PASS**

### Invariant 6: Decision / Outcome Loop End-to-End

- **Requirement**: Decision ledger connects context and decisions to verifiable outcomes and feedback loops.
- **Verification**:
  - `decision_records` captures rationale, considered alternatives, chosen option, and policy evaluations.
  - Real-world outcomes linked to decision records, allowing reflection and iterative policy calibration.
- **Result**: **PASS**

### Invariant 7: Provider & Agent Independence

- **Requirement**: Replacing LLM providers or conversational agents causes zero loss of personal state.
- **Verification**:
  - 100% of authoritative learner, career, work, startup, and life state is persisted in PostgreSQL schemas.
  - No authoritative memory or world state is locked inside vendor proprietary LLM context windows or agent storage.
  - Tested seamless switching between Anthropic (Claude Haiku), Google Gemini (Gemini 2.0 Flash), and Groq (Llama 3.3).
- **Result**: **PASS**

### Invariant 8: SLO, Cost, Security & Audit Completeness

- **Requirement**: Per-capability AI cost tracking, red-team defenses, backup/recovery verified, and full CI gate green.
- **Verification**:
  - `CapabilityCostTracker` measures prompt tokens, completion tokens, latency, and USD cost per capability invocation with budget guardrail alerts.
  - Red-team security suite: **100% blocked (30/30 attacks)** across prompt injection, tool abuse, and data exfiltration in `eval:v2:red-team`.
  - Database backup to Cloudflare R2 (`backup:r2`) and system configuration backup (`backup:system`) verified with recovery runbooks.
- **Result**: **PASS**

---

## 3. Platform V2 Test Suite & Quality Gate Summary

| Check                                        | Target                 | Result                                                | Status   |
| -------------------------------------------- | ---------------------- | ----------------------------------------------------- | -------- |
| Unit & Integration Tests                     | 100% pass              | **3934 / 3934 passed** (261 test files)               | **PASS** |
| TypeScript Typecheck                         | 0 errors               | **0 errors** (strict mode across all apps & packages) | **PASS** |
| ESLint Linting                               | max-warnings 0         | **0 errors, 0 warnings**                              | **PASS** |
| Code Formatting                              | prettier --check       | **100% conformant**                                   | **PASS** |
| Routing Accuracy (`eval:v2:routing`)         | $\ge 85\%$             | **98.00%** (49/50)                                    | **PASS** |
| Context Precision (`eval:v2:context`)        | 0 leaks, 0 DENY bypass | **100.00%** (20/20)                                   | **PASS** |
| Memory Accuracy (`eval:v2:memory`)           | $< 5\%$ false memory   | **0.00% false memory, 100% correction**               | **PASS** |
| Permission Authority (`eval:v2:permissions`) | 0 bypasses             | **100.00%** (40/40)                                   | **PASS** |
| Red-Team Harness (`eval:v2:red-team`)        | 100% blocked           | **100.00% blocked** (30/30)                           | **PASS** |
| Privacy Drills (`eval:v2:privacy`)           | 100% pass              | **100.00%** (7/7 drills)                              | **PASS** |
| Final Acceptance Audit (`eval:v2:audit`)     | 8/8 criteria           | **8/8 criteria PASSED (100%)**                        | **PASS** |

---

## 4. Conclusion & Acceptance Sign-off

Platform V2 has met all architectural goals and invariants across all 20 milestones (V2-01 to V2-20).
The platform is declared **Officially Audited and Accepted**.

---

## [7] Tài liệu: de-xuat-nang-cap-cai-to-2026-08-23.md

_(Chi tiết nguồn gốc: `de-xuat-nang-cap-cai-to-2026-08-23.md`)_

# Đề xuất nâng cấp & cải tổ toàn diện — 2026-08-23

> Kết quả quét toàn dự án (4 lượt khảo sát song song: backend API, frontend, kiến trúc
> monorepo, nợ kỹ thuật/tài liệu). Đây là **bản đề xuất** — mọi cổng chuyển giai đoạn và quyết
> định chiến lược vẫn cần người dùng duyệt theo CLAUDE.md mục 3.

## 0. Số liệu nền (đo thật ngày 2026-08-23)

- ~1.171 file TS/TSX · ~200.000 dòng. `apps/english/src` 482 file / ~113k dòng · `packages/`
  (17 gói) 389 file / ~54k dòng · `api/` 240 file / ~32k dòng.
- 99 đường dẫn API được gắn trong `server.ts` (gắn thủ công 100%, 562 dòng).
- 79 route frontend (48 page thật), 83 bảng Postgres trên 7 schema, 59 file migration.
- CI: coverage sàn 90/90/90/90, e2e a11y 15 trang × 5 theme, size-limit 123 kB JS.
- Người dùng thật trong DB production: **18**. Hạ tầng: 1 VPS 3 vCPU / 3 GB RAM.

## 1. Chẩn đoán tổng quát

**Phần lõi (gia sư Anh ⇄ Việt 3 chế độ + CEFR/SRS + thanh toán + admin) là phần chín nhất và
có chất lượng kỹ thuật tốt**: coverage cao, cổng a11y nghiêm, đếm lượt AI có refund, cache TTS
có leader-lock, backup R2 hai chiều đã kiểm chứng. Loạt PR A→C vừa qua đang sửa đúng chỗ.

**Vấn đề lớn nhất không phải lỗi lẻ, mà là PHẠM VI**: tầng "Platform Vx / Companion / OS" đã
phình vượt xa MVP và phần lớn chưa "thật":

1. **33/48 API mở rộng không có persistence** — state nằm trong `Map` cấp module (mất khi
   restart, vỡ hoàn toàn trong PM2 cluster 3 instance vì mỗi process một bản copy). Ví dụ:
   `pvp-arena` (Elo hardcode 1250, trận tạo ở instance 1 thì instance 2 trả 404),
   `daily-quests`, `referral-vip`, `memory-palace`, `debate-arena`, `stem-scratchpad`…
2. **Dữ liệu giả hiển thị ngay trang chủ**: `ReferralVipBanner` ("bạn mời" cứng Huyền
   Trang/Quốc Bảo cho mọi user) và `DailyQuestsCard` (quest in-memory reset mỗi restart) render
   ở `Home.tsx`/`EnglishHome.tsx`/`Practice.tsx`, mâu thuẫn với hệ referral/quest THẬT đang chạy
   ở `/profile` và `/nhiem-vu`.
3. **5 đường gọi AI trả tiền KHÔNG đếm lượt, phần lớn không rate-limit**: `/api/gemini-live`
   (WS realtime, tốn nhất), `/api/companion` (dùng đúng model trả phí của `/api/agent` nhưng
   né toàn bộ hạn mức — user free chat vô hạn), `/api/vision-solve`, `/api/ambient-vision`,
   `/api/co-learning-audio`. Dashboard chi phí admin vì thế **thấp hơn chi phí thật**.
4. **Hai lộ trình kiến trúc chạy song song** (45-phase "English Tutor OS" và V2 Wave A→F),
   không rõ nguồn chân lý; 993 dòng tài liệu scale 50k–1 triệu user chưa có số đo thật nào
   (k6 chưa từng chạy). Bằng chứng hệ quả: 8 service "Platform Vx" chết hoàn toàn vừa bị xoá
   (PR #621, 2.115 dòng) dù coverage 90–100%.
5. **Workspace monorepo là "giả"**: khai `workspaces` nhưng 17 gói `packages/*` và
   `apps/english` đều KHÔNG có `package.json`; import bằng đường dẫn tương đối sâu 5 cấp;
   `index.html`/`vite.config.ts`/`tsconfig.json` gốc vẫn đóng vai app english ngầm.

## 2. Phát hiện chi tiết theo mảng

### 2.1. Bảo mật & tiền bạc (nghiêm trọng nhất)

| #   | Phát hiện                                                                                                                                                | Vị trí                                                                                                               |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| B1  | 3 handler gọi `validateAuth()` rồi bỏ qua kết quả null → mọi khách vãng lai dùng chung khoá `'u-default'`/`'guest-learner'`, đọc/ghi đè dữ liệu của nhau | `api/daily-quests.ts:23`, `api/pvp-arena.ts:28`, `api/referral-vip.ts:20`                                            |
| B2  | `/api/health/deep` không auth, không rate-limit, lộ pool stats, RSS/heap, `STORAGE_DRIVER`, thông báo lỗi DB                                             | `api/healthDeep.ts`                                                                                                  |
| B3  | 5 đường AI không đếm lượt (mục 1.3); 21 handler không rate-limit                                                                                         | `api/gemini-live.ts`, `api/companion.ts`, `api/vision-solve.ts`, `api/ambient-vision.ts`, `api/co-learning-audio.ts` |
| B4  | `ecosystem.config.cjs` **không có `REDIS_URL`** → rate-limit rơi về `Map` in-memory, hạn mức lỏng ×3 trong cluster (kể cả 5 req/phút của `/api/agent`)   | `ecosystem.config.cjs`                                                                                               |
| B5  | Scheduler chạy ở CẢ 3 instance, không guard `NODE_APP_INSTANCE === '0'` → push/email nhắc học gửi 3 lần/người, `downgradeExpiredPlans()` chạy 3 lần      | `server.ts` (`startReminderScheduler`, `startPlanExpiryScheduler`)                                                   |
| B6  | Trùng route `/api/vision-solve` đăng ký 2 lần (body limit khác nhau); `app.get('*')` trả HTML 200 cho `/api/xxx` gõ sai thay vì JSON 404                 | `server.ts:171,330,447`                                                                                              |

### 2.2. Hệ thống song song / trùng lặp

| Cặp          | Bản THẬT (giữ)                                                  | Bản VỎ (gộp/xoá)                                             |
| ------------ | --------------------------------------------------------------- | ------------------------------------------------------------ |
| Referral     | `api/referral.ts` + bảng `public.referrals` + `ReferralSection` | `api/referral-vip.ts` (Map) + `ReferralVip/*`                |
| Quest        | `api/quests.ts` + bảng `public.quest_claims` + `QuestsPanel`    | `api/daily-quests.ts` (Map) + `DailyQuestsCard`              |
| Leaderboard  | `api/leaderboard.ts` + `LeagueSection`                          | `getWeeklyLeaderboard()` hardcode trong `pvpArenaService.ts` |
| Streak       | `lib/storage.ts getStreak()` (từ `daily_usage`)                 | 4 bộ streak in-memory riêng ở pvp/quests/proactive/life      |
| Sync tiến độ | `progressSync.ts` (merge union)                                 | chồng lấn với `cloud.ts`, 2 hàng đợi offline riêng           |

### 2.3. Code chết / rác

- 49 shim `apps/english/src/pages/*.tsx` (re-export 2 dòng, không ai gọi) + 3 barrel `index.ts`
  mồ côi (hại tree-shaking).
- `packages/core-grading/` **1.355 dòng, 0 nơi import** (engine chấm STEM viết trước).
- 11/72 file `core-contracts` chỉ có test, chưa implementation nào tiêu thụ.
- 2 test không có file nguồn: `packages/core-personal/companionStream.test.ts`,
  `api/_lib/voiceTierParity.test.ts` (file sau còn import ngược `apps/english` — vi phạm boundary).
- 3 bảng DB chết: `public.entitlements`, `public.weekly_ai_credit`, `english.user_profile`.
- 2 cặp migration TRÙNG SỐ: `0026_achievement_rewards` / `0026_price_promo` và
  `0027_payments_years` / `0027_reserved_names`.
- 3 vòng import trong cụm SRS frontend (gốc: `srsTypes.ts` import ngược `srs.ts`).
- `apps/hub` (1.646 dòng) được build trong CI nhưng Nginx trỏ mọi domain vào `dist/` của app
  english — artifact không có đường vào.
- ~21 script one-off trong `scripts/` không còn tham chiếu.
- Dead code: `AudioCoLearningRoomModal.tsx` (350 dòng), `core-config/env.ts`.

### 2.4. Dữ liệu người dùng có rủi ro

- **Sổ tay lỗi sai `et_mistakes_${uid}` CHỈ nằm localStorage** — không bảng DB, không endpoint,
  dù là "tài liệu ôn giá trị nhất và độc nhất của từng người" (comment trong `lib/mistakes.ts`).
  Đổi máy/xoá cache là mất sạch. Là dữ liệu học duy nhất còn 100% localStorage.
- `LifeWheel.tsx` nút "Lưu" chỉ hiện toast, không ghi đi đâu.

### 2.5. Quy trình / tài liệu

- Gate coverage `quality` **không phải required status check** → từng fail liên tục trên `main`
  (branches 89.23%) mà vẫn merge được — mâu thuẫn CLAUDE.md mục 13.
- 2 việc treo bắt buộc theo CLAUDE.md mục 8: chưa chạy `eval:tutor` sau khi đổi model Groq mặc
  định và sau khi sửa prompt Speaking chiều B (cần máy có AI key).
- AUDIT.md lệch số thật (ghi coverage 93/89/96/93 — thật 90/90/90/90; CSS 11 kB — thật 16 kB);
  CHANGELOG.md là tài liệu chết; PROGRESS.md phình 4.607 dòng; tên "việc quyết định lớn #4"
  không được ghi tường minh ở đâu.
- CI thiếu gate: `npm audit`, `codemap -- cycles`.
- Nợ treo khác: Gemini Live chưa chạy phiên thật nào; chưa audit các file V6.x/V7.0 còn lại
  cùng commit `cf44362` (cùng loại lỗi sinh ra 8 service chết); Redis rate-limit chưa kiểm
  chứng đa tiến trình trên VPS; giá `openai/gpt-oss-120b` chưa điền vào registry → mọi số USD
  telemetry đang sai.

## 3. Đề xuất cải tổ — theo thứ tự ưu tiên

### N0 — Hai quyết định chiến lược (CẦN NGƯỜI DÙNG CHỐT trước khi làm tiếp)

**Q1. Chốt phạm vi sản phẩm.** Khuyến nghị: **quay về lõi gia sư ngôn ngữ**, đóng băng tầng
Platform Vx chưa có persistence. Cụ thể cho từng tính năng nhóm (c) chọn 1 trong 3:

- **Giữ & làm thật** (cần bảng Postgres + đếm lượt + test): chỉ nên chọn cho thứ người dùng
  thật đang dùng.
- **Ẩn khỏi UI, giữ code** (feature flag tắt): chi phí thấp, tránh dữ liệu giả lộ ra.
- **Xoá hẳn** (như đã làm với 8 service PR #621): cho phần chắc chắn không dùng.

Bằng chứng ủng hộ: 8 service chết vừa xoá; 33 API in-memory sẽ VỠ ngay khi có 2 user thật dùng
cùng lúc qua 2 instance; mỗi dòng code "vỏ" đều đang trả phí bảo trì (coverage, a11y, review).

**Q2. Chốt MỘT lộ trình kiến trúc.** Khuyến nghị: đóng băng cả `docs/MASTER_SPEC.md` (45
phase) lẫn V2 Wave thành tài liệu tham khảo (như đã làm `ENGLISH_TUTOR_OS_V1_FROZEN.md`);
nguồn chân lý duy nhất là `PROGRESS.md` + backlog ngắn 1–2 quý. Tài liệu scale 50k–1M giữ
nguyên nhưng gắn nhãn "chưa kích hoạt — cần số đo k6 thật trước".

### N1 — Vá an toàn & tiền bạc (làm NGAY, trước cả PR D; 2 PR nhỏ)

1. Thêm `checkAndConsumeUsage` + rate-limit cho 5 đường AI chưa đếm lượt (hoặc tắt endpoint
   nếu Q1 quyết định ẩn tính năng đó — rẻ hơn).
2. `api/healthDeep.ts`: gate admin (hoặc chặn ở Nginx, chỉ cho localhost).
3. B1: 3 handler `'u-default'` → trả 401 khi không có auth thật.
4. Thêm `REDIS_URL` vào `ecosystem.config.cjs`; guard scheduler bằng
   `NODE_APP_INSTANCE === '0'` (hết push ×3).
5. Gỡ `ReferralVipBanner` + `DailyQuestsCard` khỏi `Home`/`EnglishHome`/`Practice` (hết dữ
   liệu giả trang chủ) — độc lập với Q1, làm được ngay.
6. Sửa trùng route `/api/vision-solve`; `/api/*` không khớp trả JSON 404.

### N2 — Dọn rác cơ học (1 PR lớn hoặc 2–3 PR nhỏ, rủi ro thấp)

- Xoá 49 shim + 3 barrel + `AudioCoLearningRoomModal` + `core-config/env.ts` + 2 test mồ côi.
- Sửa 2 cặp migration trùng số (đổi thành 0058/0059, giữ nội dung).
- Cắt vòng `srsTypes.ts → srs.ts` (tách type thuần ra).
- Drop 3 bảng chết (migration riêng, có rollback).
- Archive ~21 script one-off vào `scripts/archive/`; thêm `scripts/*.ts` vào `ENTRY_POINTS`
  của codemap (hết false-positive orphan).
- `core-grading`: xoá khỏi nhánh chính (giữ trong lịch sử git, khôi phục khi làm STEM thật).
- `apps/hub`: bỏ khỏi `npm run build` cho tới khi có cấu hình Nginx thật (hoặc cấu hình luôn
  nếu muốn dùng — việc tay trên VPS).

### N3 — Hợp nhất hệ song song (sau khi Q1 chốt)

- Referral: giữ hệ thật, xoá `referral-vip` (đúng "việc quyết định lớn #1" đã duyệt).
- Quest: giữ `quests` thật; nếu muốn giữ UX "nhiệm vụ ngày" của DailyQuests thì nối vào
  `quest_claims`, không giữ 2 hệ.
- Leaderboard/streak: một nguồn số duy nhất từ Postgres.
- **Sync Sổ tay lỗi sai lên server**: thêm cột vào `learning_progress`, tái dùng cơ chế merge
  sẵn có của `progressSync.ts`. (Ưu tiên cao — dữ liệu người dùng thật.)
- Elo + Memory Palace ra Postgres nếu Q1 giữ PvP/Palace ("việc quyết định lớn #2");
  ẩn telemetry USD + điền giá model thật ("việc #3").

### N4 — Củng cố nền kiến trúc (làm dần, mỗi bước 1 PR)

1. `package.json` thật cho 17 gói + `apps/english` (tên `@dhcb/*`, `exports`), đổi import sâu
   sang tên gói; chuyển `index.html`/`vite.config.ts`/`tailwind.config.js` từ gốc vào
   `apps/english/` (đối xứng với hub). ~2–3 ngày, trả dứt di sản tiền-monorepo.
2. Tách `api/` phẳng 87 file thành `api/{admin,english,personal,domains}/`; tách logic English
   trong `api/_lib/` (cefr\*, dictionary, wordFreq, viseme…) ra `packages/core-english/`.
3. Gỡ 3 chỗ frontend import type thẳng từ handler + import `core-ai`/`core-billing` — chuyển
   type về `core-contracts`; thêm lint rule chặn boundary.
4. Đo token thật thay `aiCost.ts` ước lượng/lượt; đưa TTS/companion/vision vào dashboard chi
   phí admin.

### N5 — Quy trình & tài liệu

- Bật `quality` + `e2e` làm **required status check** (việc tay trên GitHub Settings).
- Thêm gate CI: `npm audit --omit=dev` và `codemap -- cycles` (ngưỡng 0).
- Chạy tay `npm run eval:tutor` (máy có key) đóng 2 món treo; dán bảng so baseline.
- Đồng bộ AUDIT.md về số thật + thêm tầng audit mới "đối chiếu đồ thị import thật" (bài học
  8 service chết); khai tử hoặc tự động hoá CHANGELOG.md; nén PROGRESS.md (chuyển mục đã đóng
  sang `docs/archive/progress-2026H1.md`); ghi tên chính thức "việc quyết định lớn #4".
- Audit các file V6.x/V7.0 còn lại cùng commit `cf44362` tìm scaffolding giả.

## 4. Trình tự đề xuất (ghép với loạt PR A→G đang dở)

| Bước | Nội dung                                                  | Ghi chú                             |
| ---- | --------------------------------------------------------- | ----------------------------------- |
| 1    | **N0**: người dùng chốt Q1 + Q2                           | quyết định, không cần code          |
| 2    | **N1** (2 PR): vá tiền/bảo mật + gỡ dữ liệu giả trang chủ | chèn TRƯỚC PR D vì rủi ro tiền thật |
| 3    | **N2** (1–3 PR): dọn rác cơ học                           | giảm ~55 file + 1.355 dòng chết     |
| 4    | PR D → E (Speaking/Writing UX) như kế hoạch cũ            | lõi sản phẩm                        |
| 5    | **N3** (2–3 PR): hợp nhất referral/quest, sync mistakes   | gồm 3 "việc quyết định lớn" còn lại |
| 6    | PR F → G (hiệu năng CEFR, đánh bóng UX)                   | lõi sản phẩm                        |
| 7    | **N4** (3–4 PR): workspace thật, tách api/, core-english  | nền cho môn học thứ 2               |
| 8    | **N5**: gate CI + đồng bộ tài liệu                        | rải kèm các bước trên               |

Nguyên tắc xuyên suốt: **không thêm tính năng "Platform" mới cho tới khi mọi tính năng đang
hiển thị đều chạy thật** (persistence + đếm lượt + đúng trong cluster).

## 5. Việc KHÔNG đề xuất làm

- KHÔNG nâng React 18 / TS 5.2 / Tailwind 3 / ESLint 8 (chủ đích giữ, CLAUDE.md mục 6). Nâng
  `eslint-plugin-react-hooks` v7 + vitest 4 để riêng, chỉ làm khi rảnh tay (đã có ghi chú nợ).
- KHÔNG đầu tư thêm hạ tầng scale (PgBouncer, Redis cluster, multi-VPS) khi chưa có số đo k6
  thật và chưa vượt ~1.000 concurrent.
- KHÔNG viết thêm contract/spec "viết trước chờ dùng" — 11 contract mồ côi hiện có là đủ
  bài học.

---

## [8] Tài liệu: dac-ta-cai-to-cau-truc-2026-08-23.md

_(Chi tiết nguồn gốc: `dac-ta-cai-to-cau-truc-2026-08-23.md`)_

# Đặc tả cải tổ cấu trúc dự án — sắp xếp lại cây thư mục theo chuẩn (2026-08-23)

> **[CẬP NHẬT cùng ngày] Người dùng đã CHỐT PHƯƠNG ÁN B** (TypeScript project references,
> KHÔNG dùng esbuild như khuyến nghị ban đầu ở mục 3) **và PR-S1 ĐÃ THỰC THI THEO B** — xem
> PROGRESS.md mục "PR-S1". Khác biệt so với đặc tả gốc khi làm thật: (1) phải dời 21 file
> `api/_lib` bị packages import ngược vào các gói (`core-http` mới + auth/billing/ai/chat);
> (2) 7 handler HTTP của `core-billing` + `learningGoalAdapter` phải dời để cắt 3 chu trình
> phụ thuộc CẤP GÓI; (3) dev (tsx/Vite/Vitest) phân giải `@dhcb` về source qua tsconfig
> `paths`/alias nên không cần build gói trước khi dev.
>
> **PR-S2 CŨNG ĐÃ THỰC THI** (cùng ngày): app english về `apps/english/` đầy đủ
> (index.html/public/vite/tailwind/postcss/tsconfig/package.json), outDir giữ `dist/` gốc.
> Khác đặc tả gốc: dùng `vite --config` + `root:` tường minh trong config (không đổi cwd qua
> `--workspace`) để `.env`/Playwright/npm script gốc giữ nguyên; 2 bẫy Tailwind-theo-cwd đã
> ghi lại trong PROGRESS.md mục PR-S2.

> Nghiên cứu tiếp nối `de-xuat-nang-cap-cai-to-2026-08-23.md` (mục N4), đi sâu riêng phần
> **cấu trúc thư mục + workspace**. Đây là đặc tả để duyệt — CHƯA thực thi. Mỗi bước bên dưới
> là 1 PR riêng, có cổng kiểm chứng và đường lùi.

## 1. Hiện trạng và vì sao phải cải tổ

### 1.1. Cây thư mục hiện tại (rút gọn)

```
donghanh/
├─ index.html, vite.config.ts, tailwind.config.js, postcss.config.js   ← của app english, nằm ở GỐC
├─ server.ts                        ← Express, 562 dòng, gắn tay 100 route
├─ api/                             ← 87 handler PHẲNG + _lib/ (71 file, trộn 2 tầng)
├─ apps/
│  ├─ english/src/                  ← 482 file; KHÔNG có package.json/vite.config riêng
│  └─ hub/                          ← chuẩn (có package.json, vite.config, tsconfig riêng)
├─ packages/core-* (17 gói)         ← KHÔNG gói nào có package.json
├─ public/                          ← asset của app english, nằm ở gốc
├─ scripts/ (70 file, ~30% one-off) · e2e/ · postgres/ · docs/ · nginx/
└─ tsconfig.json (= tsconfig của app english) + 4 tsconfig khác
```

### 1.2. Vấn đề gốc rễ (đo thật)

1. **Workspace "giả"**: `package.json` khai `workspaces: ["packages/*", "apps/*"]` nhưng 17
   gói `packages/*` và `apps/english` đều không có `package.json` → không phải npm workspace
   thật. Hệ quả trực tiếp: import bằng đường dẫn tương đối sâu tới 5 cấp
   (`'../../../../../packages/core-contracts/proposedAction'`), không enforce được phụ thuộc
   giữa gói bằng công cụ.
2. **Gốc repo là "app english ngầm"**: `tsconfig.json` gốc `include: ["apps/english/src",
"packages/core-ui"]`; `index.html`/`vite.config.ts`/`public/` của english nằm ở gốc. Bất
   đối xứng hoàn toàn với `apps/hub` (đã chuẩn).
3. **Hai chế độ phân giải module tồn tại song song, alias bị cấm nửa hệ thống**: Vite có alias
   `@core`/`@english`, nhưng `api/` + `server.ts` biên dịch bằng `tsc -p tsconfig.server.json`
   (NodeNext, emit `dist-server/`, import ghi sẵn đuôi `.js`) — tsc KHÔNG rewrite alias nên
   backend phải dùng đường dẫn tương đối. Cùng một module `core-db/pgPool` được import 2 kiểu
   khác nhau tuỳ tầng.
4. **`api/` phẳng 87 handler**, nhóm chỉ thể hiện bằng tiền tố tên file (`admin-*`);
   `api/_lib/` trộn hạ tầng platform (http, validation, mailer, sepay) với logic riêng môn
   tiếng Anh (cefrTagging, dictionaryData, wordFreq, visemeTimeline…) — chưa có
   `packages/core-english` dù đã có `core-career/work/startup/life`.
5. **`apps/english` là "app tất cả trong một"**: chứa cả Personal OS
   (`pages/domains/{career,work,startup,life}`, `pages/companion/`) — tên thư mục nói dối về
   nội dung; trong khi hub (đúng nghĩa shell) chỉ có 3 file.
6. Rác cấu trúc: 49 shim `pages/*.tsx` mồ côi, 3 barrel không dùng, ~21 script one-off,
   `core-grading` 1.355 dòng không ai import, 4 gói "1 file" (career/work/startup/life).

### 1.3. Ràng buộc PHẢI tôn trọng khi di chuyển (đọc từ config thật)

| Ràng buộc                                                                                                                                                                | Nguồn                                          |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------- |
| Production chạy `node dist-server/server.js`, PM2 cluster — KHÔNG qua loader tsx (cluster + ESM loader từng crash)                                                       | `ecosystem.config.cjs`, `tsconfig.server.json` |
| Deploy = `git reset --hard origin/main` → `npm ci` → `migrate:pg` → `npm run build` → PM2 reload; mọi đường dẫn trong deploy.sh/ecosystem phải đổi ĐỒNG BỘ trong cùng PR | `scripts/deploy.sh`                            |
| Nginx trỏ `root /var/www/dhcb/dist` — đổi outDir là VIỆC TAY trên VPS (sửa nginx + certbot giữ nguyên)                                                                   | `nginx/en-vi.conf`                             |
| size-limit đo `dist/js/index-*.js` + 4 vendor chunk — đổi đường dẫn dist là phải sửa `.size-limit.json`                                                                  | `.size-limit.json`                             |
| Dev middleware của Vite gọi thẳng handler theo đường dẫn file (`API_ROUTES` trong `vite.config.ts`) — di chuyển handler là phải cập nhật bảng này                        | `vite.config.ts`                               |
| ESLint đang giữ boundary `packages/ ↛ apps/` bằng `no-restricted-imports` — cấu trúc mới phải giữ/thắt chặt rule này                                                     | `.eslintrc.cjs`                                |
| CI: 4 lệnh typecheck + coverage 90/90/90/90 + e2e (port 5179) + size — mọi PR cấu trúc phải xanh toàn bộ                                                                 | `.github/workflows/ci.yml`                     |
| KHÔNG nâng React/TS/Tailwind/ESLint (CLAUDE.md mục 6) — cải tổ cấu trúc không kèm nâng version                                                                           | CLAUDE.md                                      |

## 2. Cấu trúc đích đề xuất

```
donghanh/
├─ apps/
│  ├─ english/                      # Frontend (Vite) — app học tập
│  │  ├─ package.json               # name: "@dhcb/english"
│  │  ├─ index.html · vite.config.ts · tailwind.config.js · postcss.config.js
│  │  ├─ tsconfig.json              # kế thừa tsconfig.base.json
│  │  ├─ public/                    # dời từ public/ gốc
│  │  └─ src/
│  │     ├─ pages/{core,learning,companion,domains,subjects/english}   # đã đúng, giữ
│  │     ├─ components/{core,learning,companion,domains,english}/      # sắp lại KHỚP taxonomy pages
│  │     ├─ lib/{core,learning,companion,english}/                     # như trên
│  │     ├─ data/ · prompts/ · i18n/ · context/
│  │     └─ App.tsx · main.tsx · types.ts
│  ├─ hub/                          # giữ nguyên (đã chuẩn)
│  └─ server/                       # Backend Express — app thứ 3
│     ├─ package.json               # name: "@dhcb/server"
│     ├─ tsconfig.json
│     └─ src/
│        ├─ server.ts               # chỉ còn: khởi tạo app, middleware, listen, graceful shutdown
│        ├─ routes.ts               # bảng route TẬP TRUNG (tách khỏi server.ts, test bảo vệ sẵn có)
│        └─ api/
│           ├─ core/                # auth-adjacent: profile, progress, history, usage-summary, push…
│           ├─ english/             # dictionary, pronunciation, pronounce-assess, tutor-feedback,
│           │                       # challenge, echo-shadowing, acoustic/articulatory-phonetics…
│           ├─ admin/               # 15 file admin-* (bỏ tiền tố: admin/users.ts…)
│           ├─ personal/            # persons, memories, personal-facts, consents, life-*, proactive-*…
│           ├─ domains/             # career.ts, work.ts, startup.ts, life.ts
│           ├─ platform/            # health, healthDeep, app-settings, subjects, feedback, analytics…
│           └─ _lib/                # CHỈ còn hạ tầng HTTP thuần của server (http, validation…)
├─ packages/                        # mỗi gói có package.json  name: "@dhcb/<tên>"
│  ├─ core-contracts/               # type dùng chung 2 tầng (duy nhất frontend được import ngoài core-ui)
│  ├─ core-db/ · core-errors/ · core-config/
│  ├─ core-auth/ · core-billing/ · core-ai/ · core-chat/
│  ├─ core-english/                 # MỚI — logic môn tiếng Anh tách từ api/_lib:
│  │                                # cefrTagging, cefrjLookup, dictionaryData, wordFreq,
│  │                                # wordsCefrDataset, espeakPhonemes, visemeTimeline…
│  ├─ core-domains/                 # MỚI — gộp 4 gói 1-file: {career,work,startup,life}Service
│  ├─ core-learner/ · core-personal/ · core-integrations/
│  └─ core-ui/                      # UI dùng chung (theme, Toast, authHeader) — alias @core giữ nguyên
├─ e2e/ · playwright.config.ts      # giữ ở gốc (test xuyên app)
├─ postgres/ · nginx/ · docs/
├─ scripts/                         # chỉ còn script ĐANG vận hành (seed/backup/deploy/codemap/eval)
│  └─ archive/                      # ~21 script one-off (gen-*, ocr-*, patch-*…)
├─ package.json                     # root: workspaces + script điều phối (build/test/lint gọi xuống)
├─ tsconfig.base.json               # compilerOptions chung, các tsconfig con extends
└─ vitest.config.ts · .eslintrc.cjs · commitlint · prettier   # công cụ toàn repo ở gốc
```

**Gói bị xoá/gộp:** `core-grading` (xoá — 0 nơi dùng, khôi phục từ git khi làm STEM thật),
`core-career`+`core-work`+`core-startup`+`core-life` → `core-domains`, `core-config/env.ts`
(xoá — chỉ test của chính nó import).

### 2.1. Luật phụ thuộc (enforce bằng ESLint `no-restricted-imports` + codemap trong CI)

```
apps/english, apps/hub  →  chỉ được import: @dhcb/core-ui, @dhcb/core-contracts
apps/server             →  mọi packages/*, KHÔNG được import apps/*
packages/*              →  packages/* khác (không vòng), KHÔNG được import apps/* (rule sẵn có)
scripts/                →  packages/* + apps/server (không import apps/english trừ data tĩnh)
```

Ba vi phạm hiện hữu phải sửa kèm: 3 panel admin import type thẳng từ `api/admin-*.ts` (chuyển
type sang `core-contracts`); `CyberTutorAvatar3D.tsx` import `core-ai/visemeMorphingService`
(chuyển phần thuần trình duyệt sang `core-ui` hoặc `core-contracts`);
`api/_lib/voiceTierParity.test.ts` import ngược `apps/english` (xoá/viết lại).

## 3. Quyết định kỹ thuật then chốt: cách backend hết khổ vì đường dẫn

Vấn đề: muốn `apps/server` import `@dhcb/core-db` (tên gói) thay vì `../../packages/...js`,
nhưng production chạy `node dist-server/server.js` — Node phải phân giải được tên gói lúc
runtime, mà các gói là TS source. Hai phương án:

**Phương án A — Bundle server bằng esbuild (KHUYẾN NGHỊ).**
Build server = `esbuild apps/server/src/server.ts --bundle --platform=node --format=esm
--packages=external --outfile=dist-server/server.js`. esbuild tự phân giải workspace + alias +
TS, bundle toàn bộ code repo thành 1 file; `node_modules` thật (pg, ws, sharp, ioredis…) để
external như hiện nay. `tsc -p tsconfig.server.json` giữ lại CHỈ để typecheck (`noEmit`).

- Ưu: hết hẳn ràng buộc "cấm alias ở backend"; build server nhanh hơn tsc emit; PM2/deploy
  giữ nguyên đường dẫn `dist-server/server.js` (KHÔNG cần việc tay trên VPS); cluster mode
  không đổi gì (vẫn là JS thật).
- Rủi ro & cách đỡ: khác biệt hành vi bundle vs multi-file (import.meta.url, `__dirname`) —
  quét trước bằng grep `import.meta.url|__dirname` trong api/packages; dynamic import có biến
  — kiểm bằng smoke test `node dist-server/server.js` trong CI (thêm bước "boot check" chạy
  server 5s với env giả, đã có `/api/health`).

**Phương án B — TypeScript project references (`tsc -b`), mỗi gói tự emit `dist/`.**
Chuẩn "sách giáo khoa" hơn nhưng: 18 gói × (tsconfig composite + exports trỏ dist), build
chậm hơn, deploy phức tạp hơn (nhiều dist), và không giải quyết được chuyện Vite/dev tsx đọc
source trực tiếp. Chi phí cao hơn hẳn A với lợi ích thấp hơn ở quy mô 1 người làm.

→ Đề xuất chốt **A**. (Nếu sau này cần publish gói riêng thì mới nâng cấp lên B.)

Với frontend không có vấn đề này: Vite phân giải workspace tự nhiên qua `node_modules`
symlink, hoặc giữ alias như cũ.

## 4. Lộ trình thực thi — 6 PR, mỗi PR tự đứng được

Nguyên tắc chung mọi PR: dùng `git mv` (giữ lịch sử file); chạy
`npm run codemap -- impact <file>` cho file bị di chuyển nhiều nơi dùng; đủ cổng commit
CLAUDE.md mục 8; KHÔNG trộn refactor cấu trúc với thay đổi hành vi (diff chỉ gồm move +
sửa import + sửa config).

### PR-S1 — Workspace thật + esbuild server (nền của mọi bước sau)

1. Thêm `package.json` cho 17 gói (`name: "@dhcb/core-*"`, `"type": "module"`,
   `exports` trỏ source `.ts` — hợp lệ vì mọi consumer đều đi qua bundler/tsx/vitest).
2. Thêm build server bằng esbuild (phương án A), giữ `tsc` typecheck; xoá emit của
   `tsconfig.server.json` (chuyển `noEmit: true`).
3. Codemod đổi import tương đối sâu → `@dhcb/*` (script tự viết chạy 1 lần, ~500 điểm import;
   thuần cơ học, giao subagent mechanical được).
4. Cập nhật: `vitest.config.ts` (resolve workspace), ESLint boundary rule sang tên gói,
   `API_ROUTES` trong vite.config nếu đường dẫn module đổi.
5. Cổng riêng: CI thêm bước **boot check** `node dist-server/server.js` (env giả, chờ
   `/api/health` 200) — bảo hiểm cho mọi PR cấu trúc sau.
   _Không đụng: vị trí file nào ngoài package.json mới; nginx; PM2._

### PR-S2 — Trả gốc repo về đúng vai: app english về `apps/english/`

1. `git mv` `index.html`, `public/`, `tailwind.config.js`, `postcss.config.js`,
   `vite.config.ts` → `apps/english/`; thêm `apps/english/package.json` + `tsconfig.json`
   (extends `tsconfig.base.json` mới tách từ tsconfig gốc).
2. Root `npm run dev/build` → `npm run dev --workspace=@dhcb/english` (giữ tên lệnh cũ ở root
   để thói quen + CI + docs không gãy).
3. **Giữ nguyên outDir về `dist/` ở GỐC** (`build.outDir: '../../dist'`) — để nginx,
   deploy.sh, `.size-limit.json`, backup script KHÔNG phải đổi và KHÔNG có việc tay trên VPS
   ở bước này. (Việc dời dist là bước tuỳ chọn cuối, mục 6.)
4. Sửa đường dẫn trong `scripts/gen-data-manifest.mjs`/`gen-stories-json.mjs` nếu trỏ
   `public/`.

### PR-S3 — Server thành app: `server.ts` + `api/` → `apps/server/`

1. `git mv server.ts apps/server/src/server.ts`; `git mv api apps/server/src/api`.
2. Tách bảng gắn route ra `apps/server/src/routes.ts` (chỉ move code từ server.ts, không đổi
   logic); sửa luôn 2 lỗi cấu trúc sẵn có trong lúc tách: trùng đăng ký `/api/vision-solve`,
   `/api/*` không khớp trả JSON 404 thay vì HTML.
3. Cập nhật esbuild entry, `tsconfig.api.json` include, `API_ROUTES` vite.config,
   `api/routes-registered.test.ts` đường dẫn.
   _Output vẫn là `dist-server/server.js` → PM2/deploy/nginx không đổi._

### PR-S4 — Chia `api/` theo domain + tách `core-english`, `core-domains`

1. Trong `apps/server/src/api/`: chia 87 handler vào `{core,english,admin,personal,domains,platform}/`
   (bảng phân loại đầy đủ ở báo cáo khảo sát backend — mục 1). Bỏ tiền tố `admin-` khi đã nằm
   trong `admin/`. Đường dẫn URL `/api/...` GIỮ NGUYÊN 100% (chỉ file di chuyển).
2. `api/_lib/` tách 3 hướng: logic English → `packages/core-english/`; hạ tầng dùng chung
   nhiều tầng (sepay, prices, planFeatures đã có chỗ ở core-billing) → gói tương ứng; phần
   thuần HTTP server ở lại `_lib/`.
3. Gộp `core-career/work/startup/life` → `packages/core-domains/` (4 file service + test, đổi
   4 import).
4. Xoá `core-grading/` + `core-config/env.ts` + 2 test mồ côi (nếu chưa xoá ở đợt N2).

### PR-S5 — Sắp lại `apps/english/src` theo taxonomy + dọn di sản

1. Xoá 49 shim `pages/*.tsx` + 3 barrel mồ côi (nếu chưa làm ở N2).
2. `components/` (130 file, 24 thư mục con phẳng) sắp về `{core,learning,companion,domains,english}/`
   khớp taxonomy `pages/` — cơ học, giao subagent mechanical với bảng ánh xạ duyệt trước.
3. `lib/` (114 module) tương tự; cắt 3 vòng import cụm SRS trong lúc di chuyển (tách type
   thuần khỏi `srsTypes.ts`).

### PR-S6 — `scripts/` + tài liệu + gác cổng lâu dài

1. `git mv` ~21 script one-off → `scripts/archive/` (giữ chạy được, khỏi lẫn vào vận hành);
   thêm `scripts/*.ts` vào `ENTRY_POINTS` của codemap.
2. CI thêm 2 gate: `codemap -- cycles` = 0 và kiểm tra orphans không tăng (baseline hoá).
3. Cập nhật CLAUDE.md mục 6 "Cấu trúc" + PROJECT.md + docs liên quan về cây mới; vẽ sơ đồ
   phụ thuộc vào `docs/adr/` (ADR mới cho cải tổ này).

## 5. Rủi ro chính & cách đỡ

| Rủi ro                                     | Đỡ bằng                                                                                                                                       |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Deploy VPS gãy vì đường dẫn đổi            | PR-S1→S5 giữ bất biến 2 đường dẫn production: `dist/` (frontend) + `dist-server/server.js` (backend) → deploy.sh/nginx/PM2 không đổi dòng nào |
| esbuild bundle khác hành vi tsc multi-file | Boot check trong CI (PR-S1) + smoke test luồng chính trên VPS sau deploy đầu tiên; grep trước `__dirname`/`import.meta.url`                   |
| Codemod import sót/sai                     | tsc 4 project + eslint + vitest toàn bộ đều phải xanh; codemap so tổng số cạnh import trước/sau (chỉ được đổi hình thức, không đổi số lượng)  |
| Conflict với loạt PR D→G đang chạy         | Làm cải tổ cấu trúc SAU khi loạt bug-fix D→G xong, hoặc chen giữa 2 PR — không chạy song song 2 nhánh cùng đụng `apps/english/src`            |
| PR move file làm diff khổng lồ khó review  | Mỗi PR chỉ move + sửa import; mô tả PR kèm bảng ánh xạ cũ→mới; `git log --follow` vẫn tra được lịch sử                                        |
| Vitest/coverage lệch sau move              | Coverage tính theo glob toàn repo, không theo path cố định — chạy `test:coverage` ở từng PR, sàn 90 giữ nguyên                                |

## 6. Bước tuỳ chọn về sau (KHÔNG nằm trong 6 PR)

- Dời `dist/` về `apps/english/dist` + sửa nginx root (việc tay VPS) — chỉ làm khi thật sự
  cần build 2 app frontend song song.
- Kích hoạt `apps/hub` thật (cấu hình Nginx theo Host) hoặc bỏ khỏi build — theo quyết định
  Q1 của bản đề xuất tổng.
- Nâng phương án A → B (project references) nếu có nhu cầu publish gói.

## 7. Ước lượng & thứ tự khuyến nghị

| PR  | Khối lượng                                           | Độ rủi ro | Ghi chú                                 |
| --- | ---------------------------------------------------- | --------- | --------------------------------------- |
| S1  | ~2 ngày (17 package.json + esbuild + codemod import) | TB-cao    | Nền của tất cả; có boot check bảo hiểm  |
| S2  | ~0,5 ngày                                            | Thấp      | Move config, outDir giữ nguyên          |
| S3  | ~1 ngày                                              | TB        | Move server + tách routes.ts            |
| S4  | ~1,5 ngày                                            | TB        | Chia api/ + core-english + core-domains |
| S5  | ~1 ngày (phần lớn cơ học)                            | Thấp      | Giao mechanical với bảng ánh xạ         |
| S6  | ~0,5 ngày                                            | Thấp      | Archive + gate + docs                   |

Tổng ~6,5 ngày công, chia 6 PR độc lập, dừng được sau bất kỳ PR nào mà repo vẫn nhất quán.

**Cổng cần người dùng duyệt trước khi bắt đầu:** (1) chốt phương án A (esbuild) cho backend;
(2) chốt cây thư mục đích mục 2 (đặc biệt: `apps/server`, `core-english`, `core-domains`);
(3) chốt thời điểm — sau PR D→G hay chen vào giữa.

---

## [9] Tài liệu: dac-ta-gd1-tach-loi-monorepo-2026-07-31.md

_(Chi tiết nguồn gốc: `dac-ta-gd1-tach-loi-monorepo-2026-07-31.md`)_

# Đặc tả GĐ1 — Tách lõi dùng chung + trang hub

> Ngày: 2026-07-31 · Căn cứ: `docs/adr/0001-nen-tang-da-linh-vuc.md`
> Trạng thái: **đặc tả, chưa thi hành** · Ước lượng: 4–6 tuần, 8 PR
> Cập nhật 2026-07-31: chốt 3 điểm còn mở — tiền tố SePay `DHCB`, tách schema dữ liệu học theo môn,
> cơ chế học/ôn tách riêng từng môn (xem §2).
> **Nguyên tắc xuyên suốt GĐ1: đây là REFACTOR THUẦN. Không thêm một tính năng nào cho người dùng cuối. Nếu một PR vừa di chuyển file vừa đổi hành vi → tách làm hai PR.**

---

## 0. Trạng thái xuất phát (đã đọc repo, không đoán)

| Thành phần       | Hiện tại                                                                                                                                                  |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Frontend         | `src/` — 47 component, 102 file `lib`, ~24 page                                                                                                           |
| Backend          | `api/` — ~50 handler + `api/_lib/` 86 file; `server.ts` gắn handler                                                                                       |
| Build            | `npm run build` = gen-data-manifest → `tsc` → `tsc -p tsconfig.api.json` → `vite build` → `build:server` (`tsc -p tsconfig.server.json` → `dist-server/`) |
| Chạy             | PM2 fork/cluster `node dist-server/server.js`, port 3001, Nginx `nginx/en-vi.conf`                                                                        |
| DB               | `postgres/schema.sql`, 13 bảng, tất cả trong `public`; migration mới nhất `0027`                                                                          |
| Đường dẫn import | **Tương đối, KHÔNG có alias** (`vite.config.ts` và `tsconfig.json` không khai báo `alias`/`paths`)                                                        |

> Ghi chú quan trọng: vì repo **chưa có alias**, mỗi lần di chuyển file là một loạt đổi đường dẫn
> tương đối. PR-1 sẽ dựng alias trước để các PR sau chỉ đổi _một_ tên alias thay vì hàng trăm `../../`.

---

## 1. Đích đến — cây thư mục sau GĐ1

```
package.json                  ← workspaces root, script điều phối
packages/
  core-auth/                  ← đăng ký/đăng nhập/token/Google, middleware validateAuth
  core-billing/               ← SePay, plan_prices, plan_features, promo, đếm lượt
  core-ai/                    ← aiConfig, gọi model, TTS/STT, cache mã hoá, fileStorage
  core-db/                    ← pgPool, chạy migration, helper truy vấn
  core-ui/                    ← theme + token --a-*, component dùng chung, layout, i18n
apps/
  english/                    ← toàn bộ app tiếng Anh hiện tại (src/ + api riêng của môn)
  hub/                        ← MỚI: trang giới thiệu + đăng nhập + điều hướng + bảng giá
server.ts                     ← một tiến trình: gắn API lõi + API từng môn, chọn dist theo Host
postgres/                     ← schema core + schema từng môn, migrations dùng chung
```

**Quy tắc phân loại — dùng khi phân vân một file thuộc `packages/` hay `apps/english/`:**

> Nếu app **Toán** cũng sẽ cần file này gần như nguyên vẹn → `packages/`.
> Nếu phải sửa nhiều mới dùng lại được → để nguyên ở `apps/english/`, tách sau khi môn Toán
> thật sự cần (tránh trừu tượng hoá sớm dựa trên phỏng đoán).

Áp quy tắc này vào hiện trạng:

| Vào `packages/`                                                                                                                                                                                | Ở lại `apps/english/`                                                                                |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `api/auth.ts`, `_lib/authService.ts`, `adminAuth.ts`, `security.ts`, `emailVerification.ts`, `changeEmail.ts`                                                                                  | `api/dictionary.ts`, `pronunciation.ts`, `pronounce-assess.ts`, `avatar-visemes.ts`, `challenge.ts`  |
| `api/checkout.ts`, `payment-webhook.ts`, `payment-status.ts`, `payment-history.ts`, `plan-prices.ts`, `plan-features.ts`, `plan-marketing.ts`, `_lib/promo.ts`, `usage.ts`, `plan.ts`          | `api/tutor-feedback.ts`, `quests.ts`, `leaderboard.ts`, `history.ts`, `progress.ts`                  |
| `api/tts.ts`, `stt.ts`, `ai.ts`, `_lib/aiConfig.ts`, `aiCost.ts`, `openaiStt.ts`, `elevenLabsTts.ts`, `azurePronounce.ts`, `fileStorage.ts`                                                    | `src/data/**` (từ điển, CEFR), `src/prompts/**`, `src/pages/**`                                      |
| `_lib/pgPool.ts`, `date.ts`, `base64.ts`, `concurrencyLimiter.ts`, `settings.ts`                                                                                                               | `src/lib/curriculum.ts`, `cefr*.ts`, `vocab.ts`, `wordForms.ts`, `pos.ts`, `dictionaryApi.ts`        |
| `src/lib/theme.ts`, `auth.ts`, `authHeader.ts`, `payment.ts`, `planFeatures.ts`, `promo.ts`, `errorTracking.ts`, `storage.ts`, `date.ts`, `haptics.ts`, `sound.ts`, `deviceId.ts`, `uiLang.ts` | `src/lib/pronounce*.ts`, `listening.ts`, `placement.ts`, `mistakes.ts`, `challenge*.ts`              |
| `src/components/ThemeToggle.tsx` + component nền (nút, thẻ, modal, trạng thái tải/rỗng/lỗi)                                                                                                    | các component gắn nội dung tiếng Anh (`WordCard`, `StudyTabs`, `CefrLessonViews`, …)                 |
| _(không có)_ — mọi thứ thuộc **học tập/ôn tập** ở lại app, xem §2.3                                                                                                                            | `src/lib/srs.ts`, `cefrProgress.ts`, `stats.ts`, `achievements.ts`, `weeklyGoal.ts`, `curriculum.ts` |

⚠️ **`api/admin-*.ts`**: phần quản trị người dùng/gói/giá là lõi; phần thống kê học tập là của môn.
PR-4 tách theo đúng ranh giới đó, không bê nguyên cụm `admin-*` sang một bên.

> **Phạm vi dùng cho PR-1 (alias):** chỉ dòng liên quan `src/lib/*` và `src/components/*` (hàng
> "theme.ts, auth.ts, …", "ThemeToggle.tsx …", "srs.ts, cefrProgress.ts, …") — vì PR-1 chỉ đụng
> `src/`, không đụng `api/`. Các dòng `api/*` trong bảng này dùng cho PR-3/4/5 (di chuyển file
> thật), không áp dụng ở bước alias.

---

## 2. Ba điểm ĐÃ CHỐT (2026-07-31) — trước đây để mở, nay không phải hỏi lại

### 2.1. Tiền tố SePay: **`DHCB` dùng chung toàn nền tảng** (không tách theo môn)

Nội dung chuyển khoản: `DHCB<mã đơn>`. Người dùng mua **một gói dùng cho mọi môn**, nên tiền tố
theo môn là sai mô hình kinh doanh — và người chuyển khoản chỉ cần nhớ một dạng nội dung.

**Ràng buộc bắt buộc — webhook phải chấp nhận CẢ HAI tiền tố mãi mãi:**

- `ENVI…` — giao dịch cũ, và cả những chuyển khoản mới của người dùng copy lại nội dung cũ.
- `DHCB…` — mặc định cho đơn mới.

Cách làm: hằng số `PAYMENT_PREFIX = 'DHCB'` (dùng khi **tạo** mã đơn) và
`ACCEPTED_PREFIXES = ['DHCB', 'ENVI']` (dùng khi **đối chiếu** webhook), đặt trong `core-billing`.
Tuyệt đối không xoá `ENVI` khỏi danh sách chấp nhận. Trên trang SePay nhớ **thêm** bộ lọc tiền tố
`DHCB` chứ không thay thế bộ lọc `ENVI` đang có.

**Kiểm thử bắt buộc:** một test cho mỗi tiền tố, cộng test mã đơn cũ dạng `ENVI…` vẫn khớp đúng
đơn hàng cũ trong bảng `payments`.

### 2.2. Dữ liệu học tập: **mỗi môn một schema riêng**

`core` giữ những gì không thuộc môn nào: `users`, `sessions`, `profiles`, `payments`,
`plan_prices`, `plan_features`, `app_settings`, `usage_events`, `push_subscriptions`.

Mọi bảng **dữ liệu học** chuyển sang schema của môn:

| Bảng hiện tại (đang ở `public`) | Sau GĐ1                                                                                  |
| ------------------------------- | ---------------------------------------------------------------------------------------- |
| `chat_sessions`                 | `english.chat_sessions`                                                                  |
| `writing_submissions`           | `english.writing_submissions`                                                            |
| `speaking_sessions`             | `english.speaking_sessions`                                                              |
| `learning_progress`             | `english.learning_progress`                                                              |
| `pronunciations`                | `english.pronunciations`                                                                 |
| `challenge_entries`             | `english.challenge_entries`                                                              |
| `tutor_feedback`                | `english.tutor_feedback`                                                                 |
| `tts_cache`                     | **ở lại `core`** — cache audio dùng chung, khoá là hash nội dung, môn nào cũng dùng được |

Môn Toán sau này có schema `math` với bảng **của riêng nó** (`math.attempts`, `math.problem_progress`,
`math.formula_reviews`…), **không** cố nhét vào bảng chung với tiếng Anh. Khoá ngoại về
`core.users(id)` là điểm nối duy nhất giữa các schema.

**Cách chuyển an toàn:** `alter table public.X set schema english` (đổi chỗ, **không** copy dữ liệu —
nhanh và không có nguy cơ lệch), rồi tạo `create view public.X as select * from english.X` để mã cũ
chưa kịp sửa vẫn chạy. Xoá view ở một PR sau, khi đã đổi hết truy vấn. Rollback: `set schema public`.
Nhớ đặt `search_path` của kết nối `pg` cho phù hợp, hoặc ghi rõ tên schema trong mọi câu truy vấn
(**khuyến nghị ghi rõ** — tường minh, không phụ thuộc trạng thái kết nối).

### 2.3. Cơ chế học & ôn tập: **tách riêng theo từng môn, KHÔNG đưa vào `core`**

`srs.ts`, `cefrProgress.ts`, `curriculum.ts`, `stats.ts`, `achievements.ts`, `weeklyGoal.ts` **ở lại
`apps/english/`**. Môn Toán tự viết cơ chế học/ôn của riêng nó, không kế thừa gì.

Lý do đúng đắn: ôn từ vựng và ôn công thức Toán khác nhau về bản chất — Toán còn phải sinh lại đề
theo tham số, chấm bước giải, phân biệt "sai vì nhầm dấu" với "chưa hiểu khái niệm". Một trừu tượng
SRS chung sẽ hoặc quá loãng để dùng được, hoặc biến thành nút thắt mà sửa cho môn này thì hỏng môn kia.

> ⚠️ Đánh đổi đã biết và **chấp nhận có chủ đích**: thuật toán lập lịch ôn (SM2/FSRS) sẽ tồn tại
> ở nhiều bản sao. Nếu sau này phát hiện lỗi trong công thức tính khoảng cách ôn, phải sửa ở từng
> môn. Ghi vào `PROGRESS.md` mục nợ kỹ thuật để không quên. Nếu tới môn thứ ba mà cả ba bản sao vẫn
> giống hệt nhau, khi đó **mới** tách phần hàm thuần ra dùng chung — tách dựa trên bằng chứng thật,
> không dựa trên phỏng đoán.

### 2.4. Hạn mức: **mỗi môn đếm RIÊNG, con số hạn mức BẰNG NHAU** (chốt cuối 2026-07-31)

> Lịch sử quyết định tại chỗ này (giữ lại để không ai lật lại mà không biết): ban đầu định "kho chung
> toàn nền tảng, cộng gộp mọi môn" → sau đổi thành "chỉ áp cho tiếng Anh, môn khác không giới hạn" →
> rồi "kho chung, cộng gộp" lần nữa → **chốt cuối cùng**: mỗi môn có kho lượt riêng (không cộng gộp),
> nhưng dùng chung MỘT con số hạn mức/ngày với tiếng Anh. Xem ADR-0001 mục bổ sung 8.

- Mọi môn (`english`, `math`, `ly`, `hoa`, …) áp **cùng một CON SỐ** đang dùng cho tiếng Anh: cùng
  `FREE_WEEKLY_BONUS_PER_DAY`/`FREE_ROLLING_WINDOW_DAYS` cho Free, cùng hạn mức ngày cho Pro/VIP.
- Nhưng **đếm và trừ lượt riêng theo từng môn** — hết lượt tiếng Anh trong ngày **không** ảnh hưởng
  lượt Toán còn lại của chính ngày đó. Không cộng gộp giữa các môn.
- Không đổi hành vi của tiếng Anh trong GĐ1 — số đang hiển thị cho người dùng hiện tại phải giữ nguyên.

**Cách thi hành:**

```sql
-- Trong migration 0028, cạnh usage_events.
create table if not exists public.subject_limits (
  subject   text primary key,          -- 'english' | 'math' | ...
  enforced  boolean not null default true,   -- true = áp hạn mức (mặc định cho MỌI môn)
  updated_at timestamptz not null default now()
);
insert into public.subject_limits (subject, enforced) values ('english', true)
on conflict (subject) do nothing;
-- Môn mới thêm sau cũng insert với enforced = true (hoặc dựa vào default của cột).
```

`consumeUsage(userId, subject, mode)` được gọi ở mọi môn, **kiểm tra và trừ lượt theo đúng
`subject` đó** khi `enforced = true` (mặc định) — mỗi môn một bộ đếm độc lập, cùng hằng số hạn mức.
Bảng `subject_limits` vẫn có ích làm phanh tay: admin bật `enforced = false` tạm thời cho một môn cụ
thể khi cần (ví dụ giai đoạn ra mắt), không cần deploy.

`usage_events` đếm theo `(user_id, day, subject, mode)`; "còn bao nhiêu lượt hôm nay" của Free tính
**riêng theo từng `subject`** — người học cả tiếng Anh lẫn Toán trong một ngày có đủ lượt cho cả hai,
không bị trừ chung vào một kho.

Vẫn giữ **rate limit kỹ thuật** (chống spam theo IP/token trong `api/_lib/security.ts`) cho mọi môn —
đây là chống lạm dụng hạ tầng, khác với hạn mức nghiệp vụ, và không được tắt.

### 2.5. Còn lại một điểm mở

**`weeklyCredit` / `FREE_WEEKLY_BONUS_PER_DAY`** trong `api/_lib/usage.ts` — cơ chế "học thật thì
được thêm lượt". Vì hạn mức đếm **riêng theo từng môn** (§2.4), cơ chế "học thật" cũng phải thành
**hợp đồng theo môn**: mỗi môn tự gọi `grantDailyBonus(userId, subject)` khi xác định người dùng đã
học thật hôm đó, và lượt thưởng chỉ cộng vào kho của **chính môn đó** — học Toán thật không tự động
cộng thêm lượt cho kho tiếng Anh, và ngược lại. `core-billing` chỉ lo cộng lượt đúng kho + chống gian
lận trong phạm vi một môn. Chốt chi tiết ở PR-5.

---

## 3. Chia PR (mỗi PR merge được độc lập, không PR nào để repo ở trạng thái hỏng)

### PR-1 — Alias đường dẫn (không di chuyển file nào) ⚠️ CHỈ ÁP DỤNG CHO `src/`, KHÔNG áp dụng cho `api/`

> **Sửa lại phạm vi (2026-07-31), phát hiện lúc thi hành:** `api/` được `tsc -p tsconfig.server.json`
> biên dịch thành JS thật rồi chạy trực tiếp bằng `node dist-server/server.js` — KHÔNG qua bundler.
> `tsc` không tự đổi alias thành đường dẫn thật lúc build; Node lúc chạy không hiểu `@core/x.js` là
> gì → crash production ngay khi khởi động. Vite (frontend) thì bundle nên alias resolve được bình
> thường. Vì vậy: **alias chỉ dựng cho `src/`.** Khi `api/_lib/*` thật sự chuyển sang
> `packages/core-*` (PR-3/4/5), dùng **import package thật qua npm workspaces** (Node tự symlink
> vào `node_modules`, đúng cơ chế chuẩn), không dựng alias giả trung gian cho `api/`.

- Thêm `resolve.alias` trong `vite.config.ts` + `paths` trong `tsconfig.json` (chỉ áp cho `src/`):
  `@core/*`, `@english/*`, tạm thời **cùng trỏ vào `./src/*`**.
- Đổi các import tương đối sâu (`../../../`) trong `src/` sang alias, theo đúng bảng phân loại §1
  (core vs english) — dù vị trí file trên đĩa CHƯA đổi, tên alias phải đúng nơi file sẽ chuyển tới,
  để PR-6 (tách `core-ui`) sau này chỉ đổi 1 dòng target thay vì sửa lại từng import.
  Việc cơ học → giao subagent `mechanical`.
- `api/`, `tsconfig.api.json`, `tsconfig.server.json`: **không đổi gì trong PR-1.**
- **Nghiệm thu:** `npm run build` + `typecheck` + `lint` + `test` + `test:e2e` xanh; `git diff` chỉ
  chứa dòng `import` trong `src/` + 2 file cấu hình (`vite.config.ts`, `tsconfig.json`). Ứng dụng
  chạy y hệt. **Kiểm thêm:** `npm run build` xong, chạy thử `node dist-server/server.js` khởi động
  bình thường (xác nhận `api/` không bị đụng, không có alias lọt vào).

### PR-2 — Bật npm workspaces, dời app hiện tại vào `apps/english/`

- Root `package.json` thêm `"workspaces": ["packages/*", "apps/*"]`; giữ **một** `package-lock.json`.
- `git mv src apps/english/src` (dùng `git mv` để giữ lịch sử file).
- Cập nhật `vite.config.ts`, `tsconfig*.json`, `vitest.config.ts`, `playwright.config.ts`,
  `size-limit`, `scripts/gen-data-manifest.mjs`, đường dẫn coverage trong CI.
- **Chưa** tách `packages/` — đây thuần tuý là bước dời chỗ.
- **Nghiệm thu:** như PR-1, cộng thêm: `npm ci` từ đầu trên máy sạch chạy được; CI xanh.

### PR-3 — Tách `packages/core-db` + `core-ai`

Hai package ít ràng buộc nhất, làm trước để kiểm chứng cách làm.

- **Nghiệm thu:** `/api/tts`, `/api/stt`, `/api/agent` hoạt động thật (smoke test tay trên staging
  hoặc local có key); cache mã hoá vẫn giải mã được **file cũ** (kiểm tra bằng một hash đã có trong DB).

### PR-4 — Tách `packages/core-auth` ⚠️ PR nhạy cảm nhất

- Kèm rà bảo mật: mọi handler còn lại vẫn gọi `validateAuth()` và vẫn đối chiếu `user_id` với token.
- **Nghiệm thu bắt buộc, làm tay:** đăng ký mới · xác thực email · đăng nhập email/mật khẩu ·
  đăng nhập Google · đổi email · quên mật khẩu · token hết hạn bị từ chối · **token của user A
  không đọc được dữ liệu user B** (thử thật, ít nhất 3 endpoint).

### PR-5 — Tách `packages/core-billing` + migration `(subject, mode)` ⚠️ có migration

Migration `0028_platform_subject.sql`, **cộng dồn, không phá dữ liệu cũ**:

```sql
-- Bảng đếm lượt dạng DÒNG thay cho cột cứng, có chiều `subject`.
create table if not exists public.usage_events (
  user_id  uuid not null references public.users(id) on delete cascade,
  day      text not null,                 -- 'YYYY-MM-DD' theo giờ VN
  subject  text not null,                 -- 'english' | 'math' | ...
  mode     text not null,                 -- 'chat' | 'writing' | 'speaking' | 'stt' | 'pronounce' | ...
  count    integer not null default 0,
  primary key (user_id, day, subject, mode)
);

-- Backfill từ daily_usage, gán toàn bộ lịch sử cho môn 'english'.
insert into public.usage_events (user_id, day, subject, mode, count)
select user_id, day, 'english', m.mode, m.cnt
from public.daily_usage d
cross join lateral (values
  ('chat', d.chat_count), ('writing', d.writing_count),
  ('speaking', d.speaking_count), ('stt', d.stt_count),
  ('pronounce', d.pronounce_count)
) as m(mode, cnt)
where m.cnt > 0
on conflict do nothing;
```

- **`daily_usage` được GIỮ NGUYÊN, không `drop`.** Xoá ở một PR sau, sau khi `usage_events` chạy
  thật ổn ít nhất 2 tuần. Đây là đường lùi.
- Hàm SQL `consume_usage`/`refund_usage`/`grant_daily_bonus_rolling` thêm tham số `subject`
  (mặc định `'english'` để mã cũ gọi vẫn đúng).
- Thêm bảng `subject_limits`, mặc định `enforced = true` cho mọi môn (hạn mức dùng chung — §2.4).
  Bảng này cần một màn quản trị nhỏ (bật/tắt `enforced` theo môn) trong trang admin sẵn có, dùng làm
  phanh tay khi cần nới tạm cho một môn cụ thể.
- Cơ chế "học thật được thêm lượt" thành hợp đồng `grantDailyBonus(userId, subject)` theo môn (§2.5),
  cộng gộp đúng trần thiết kế ban đầu bất kể học mấy môn trong ngày.
- **Rollback:** `drop table usage_events` — không mất gì vì `daily_usage` còn nguyên.

Cùng PR này, đổi tiền tố SePay sang **`DHCB`** theo §2.1: hằng số `PAYMENT_PREFIX = 'DHCB'` khi tạo
mã đơn, `ACCEPTED_PREFIXES = ['DHCB', 'ENVI']` khi đối chiếu webhook. **Việc tay đi kèm, không quên:**
vào trang SePay **thêm** bộ lọc tiền tố `DHCB`, **giữ nguyên** bộ lọc `ENVI` đang có.

- **Nghiệm thu:** ca biên đếm lượt có test — hết lượt · hoàn lượt khi AI lỗi · đổi ngày theo giờ VN ·
  gói hết hạn · cửa sổ trượt 7 ngày của gói Free · **hết lượt tiếng Anh trong ngày không ảnh hưởng
  lượt Toán còn lại của chính ngày đó (đếm riêng theo môn)** · hạn mức của môn Toán/Lý/Hoá bị chặn
  giống hệt tiếng Anh khi hết lượt (cùng con số) · admin bật `enforced = false` cho một môn thì môn
  đó không bị chặn nhưng vẫn ghi đủ dòng vào `usage_events`. Test webhook khớp đúng với **cả hai**
  tiền tố, kể cả một mã đơn `ENVI…` cũ có thật trong bảng `payments`. Chạy thật một giao dịch SePay
  số tiền nhỏ bằng nội dung `DHCB…`.

### PR-5b — Chuyển bảng dữ liệu học sang schema `english` ⚠️ có migration

Migration `0029_schema_english.sql`, theo cách ở §2.2:

```sql
create schema if not exists english;

-- Đổi CHỖ, không copy dữ liệu (nhanh, không có nguy cơ lệch bản sao).
alter table public.chat_sessions       set schema english;
alter table public.writing_submissions set schema english;
alter table public.speaking_sessions   set schema english;
alter table public.learning_progress   set schema english;
alter table public.pronunciations      set schema english;
alter table public.challenge_entries   set schema english;
alter table public.tutor_feedback      set schema english;
-- tts_cache Ở LẠI public/core: cache audio dùng chung mọi môn.

-- Cầu tương thích: mã chưa kịp sửa vẫn chạy.
create view public.chat_sessions       as select * from english.chat_sessions;
-- … tương tự cho các bảng còn lại.
```

- Sau đó đổi truy vấn trong `apps/english/api` sang **ghi rõ tên schema** (`english.chat_sessions`),
  không dựa vào `search_path`.
- View tương thích xoá ở PR sau, khi đã xác nhận không còn truy vấn nào dùng tên cũ
  (kiểm bằng `grep` toàn repo + theo dõi log 1 tuần).
- **Rollback:** `drop view` + `alter table … set schema public`.
- **Nghiệm thu:** mọi luồng học chạy thật (chat · viết · nói · lộ trình · SRS · phát âm · challenge);
  đếm số dòng từng bảng trước/sau migration phải **bằng nhau tuyệt đối**.

### PR-6 — Tách `packages/core-ui` (theme, token `--a-*`, component nền)

**Không** đưa SRS hay bất cứ logic học/ôn nào vào `core-ui` — theo §2.3, những thứ đó ở lại
`apps/english/`.

- **Nghiệm thu:** cả 4 theme hiển thị đúng trên mọi trang; axe trong E2E không có lỗi mới;
  ảnh chụp màn hình trước/sau vài trang chính để đối chiếu bằng mắt.

### PR-7 — `apps/hub` + Nginx đa subdomain + SSO

**7.1. Nội dung trang chủ hub (chốt 2026-07-31)**

Bố cục một trang, từ trên xuống:

1. **Mở đầu — mục tiêu tổng thể dự án.** "Đồng hành cùng bạn" là gì, vì sao làm (§1 bản kế hoạch),
   không phải quảng cáo một app cụ thể. Ngắn, 1 màn hình đầu.
2. **Hoạt động của dự án nói chung.** Tổng số người học, tổng số buổi học/lượt học đã thực hiện
   (tổng hợp qua mọi môn — số thật, đọc từ `core`, không bịa), các mốc/tin tức chung (ra mắt môn mới,
   thay đổi lớn). Đây là chỗ trả lời câu 3 đã thêm ở buổi trước: "cross-sell" giữa các môn.
3. **Tab riêng cho từng môn** (không phải cuộn dài một trang) — mỗi tab: mô tả ngắn môn đó, hoạt
   động riêng của môn (số người học, tính năng nổi bật, ví dụ một bài học/câu hỏi mẫu), nút
   "Học ngay" → điều hướng sang subdomain tương ứng. Tab tiếng Anh dùng ngay dữ liệu thật đang có;
   tab Toán/Lý/Hoá hiện trạng thái "sắp ra mắt" cho tới khi GĐ2/3 xong — **không dựng tab rỗng vô
   nghĩa, phải có nội dung thật dù môn chưa mở**.
4. Bảng giá chung (một gói dùng mọi môn — đúng nguyên tắc ở §1) + nút đăng nhập/đăng ký.

**7.2. Chọn môn lần đầu → hỏi y như app tiếng Anh đang làm (chốt 2026-07-31)**

Khi người dùng bấm "Học ngay" ở một tab lần đầu tiên (chưa có hồ sơ onboarding cho môn đó), hub dẫn
qua **đúng luồng hỏi đang có ở `src/pages/Onboarding.tsx`** của môn tiếng Anh trước khi vào app của
môn: trình độ (`level`), mục tiêu học (`goal`), số phút học mỗi ngày (`dailyMinutes`), nhóm tuổi
(`ageGroup`). Lưu qua `core-auth`/`core-billing` theo `(user_id, subject)` — **không dùng chung một
bản ghi onboarding cho mọi môn**, vì trình độ tiếng Anh và trình độ Toán là hai chuyện khác nhau.

- Bảng: `onboarding_profiles(user_id, subject, level, goal, daily_minutes, age_group, created_at)`
  trong schema `core` (một bảng, phân biệt bằng cột `subject` — không tạo bảng riêng theo môn, vì
  cấu trúc dữ liệu là chung, chỉ có tập giá trị `level` khả dĩ khác nhau theo môn tuỳ chọn UI).
- Môn thứ hai trở đi hỏi lại **từ đầu** khi người dùng vào lần đầu, không suy ra từ môn đã học —
  trình độ tiếng Anh không nói lên được gì về trình độ Toán của một người.
- App của môn (ví dụ `en-vi.`) đọc `onboarding_profiles` lọc theo `subject` của chính nó, thay vì
  bảng/khoá cũ dùng chung — đây là điểm chạm cần sửa khi tách `packages/core-auth`.

1. `apps/hub`: trang giới thiệu theo §7.1, luồng hỏi lần đầu theo §7.2, đăng nhập chung, bảng giá.
2. `server.ts`: thay đường dẫn cứng `dist` (chỗ `express.static` và `res.sendFile`) bằng bảng tra
   theo `Host` → `apps/<app>/dist`; không khớp → hub. **`/api/*` xử lý trước, không đụng bảng này.**
3. `nginx/`: thêm `server` block cho apex + `math.` (dựng sẵn, trỏ tạm về hub);
   mở rộng cert: `certbot --expand -d en-vi.… -d donghanhcungban.com -d www.… -d math.…`.
4. Cookie phiên đặt `domain=.donghanhcungban.com`, `Secure`, `HttpOnly`, `SameSite=Lax`.
5. Cập nhật CSP (`server.ts`) và `VITE_SITE_URL` cho hub.

- **Nghiệm thu:** đăng nhập ở hub → mở `en-vi.` **không phải đăng nhập lại**; đăng xuất ở một
  subdomain thì mọi subdomain cùng mất phiên; SSL hợp lệ trên cả 3 tên miền; bấm "Học ngay" lần đầu
  ở một môn → hiện đúng luồng hỏi onboarding của môn đó, hoàn tất → vào thẳng app, lần sau bấm lại
  không hỏi nữa; số liệu "hoạt động dự án" trên hub khớp số liệu thật trong DB.

---

## 4. Kế hoạch chống hồi quy (bắt buộc, không rút gọn)

**Trước khi bắt đầu PR-1:**

1. Chạy `npm run test:e2e`, **ghi lại** số ca đang xanh — đây là mốc đối chiếu cho mọi PR sau.
2. Bổ sung E2E cho luồng chưa được phủ mà GĐ1 sẽ đụng tới: **thanh toán** và **đăng nhập Google**.
   Nếu chưa phủ được thì phải có **danh sách kiểm tra tay** viết sẵn, ký từng mục mỗi lần deploy.
3. **Backup DB** (`npm run backup:r2`) và xác minh restore chạy được (`npm run restore:r2` vào
   một DB tạm) — chưa xác minh restore thì chưa được chạy migration nào.

**Mỗi PR:** đủ cổng commit ở `CLAUDE.md` §8 + E2E không được ít ca xanh hơn mốc + xuất báo cáo §10.

**Deploy:** mỗi PR deploy riêng, giãn cách ít nhất 1 ngày, theo dõi Sentry trước khi làm PR kế tiếp.
Nhớ `npm run build` (gồm `build:server`) **trước mỗi** `pm2 reload`.

---

## 5. Rủi ro riêng của GĐ1

| Rủi ro                                                         | Giảm thiểu                                                                             |
| -------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Refactor lớn làm hỏng app đang có người trả tiền               | 8 PR nhỏ, refactor thuần, E2E làm mốc, deploy giãn cách, backup trước migration        |
| Đổi tiền tố SePay làm rơi giao dịch cũ `ENVI…`                 | `ACCEPTED_PREFIXES` chấp nhận cả hai **vĩnh viễn**; giữ bộ lọc `ENVI` trên trang SePay |
| Chuyển schema làm hỏng truy vấn chưa kịp sửa                   | `set schema` (không copy) + view tương thích ở `public`; đếm số dòng trước/sau         |
| SM2/FSRS nhân bản ở nhiều môn, sửa lỗi sót chỗ                 | Chấp nhận có chủ đích (§2.3); ghi nợ kỹ thuật; xét gộp lại khi có môn thứ ba           |
| Lịch sử git nát sau khi dời file                               | Luôn `git mv`; PR di chuyển **không** kèm sửa nội dung                                 |
| Migration `(subject, mode)` sai → mất lượt/mất tiền người dùng | Cộng dồn, giữ `daily_usage`, rollback bằng một câu `drop`                              |
| Trừu tượng hoá sớm, `core-*` phình theo phỏng đoán             | Áp quy tắc §1: chỉ tách khi môn thứ hai thật sự cần                                    |
| Làm 4–6 tuần không có gì mới cho người dùng, dễ nản            | Chấp nhận có chủ đích; hub (PR-7) là thứ nhìn thấy được, đặt ở cuối làm mốc hoàn thành |

## 6. Cổng ra GĐ1

- [ ] Đăng nhập ở `donghanhcungban.com` → vào `en-vi.` không phải đăng nhập lại
- [ ] App tiếng Anh không hồi quy: E2E xanh bằng hoặc hơn mốc, Sentry không có loại lỗi mới
- [ ] Thêm một app rỗng mới (`math.`) chỉ cần: tạo `apps/math`, thêm `server` block Nginx, thêm
      một dòng vào bảng tra `Host` — **không đụng vào `packages/` hay `apps/english/`**
- [ ] `usage_events` chạy thật ≥ 2 tuần, số liệu khớp `daily_usage`
- [ ] Thanh toán bằng nội dung `DHCB…` chạy thật; một giao dịch `ENVI…` cũ vẫn đối chiếu đúng
- [ ] Bảng dữ liệu học nằm hết trong schema `english`; `core` không còn bảng nào thuộc về môn
- [ ] Trang chủ hub đúng bố cục §7.1 (mục tiêu chung → hoạt động dự án → tab từng môn → giá);
      onboarding lần đầu theo môn hoạt động đúng §7.2
- [ ] `PROGRESS.md` cập nhật, ADR-0001 chuyển sang "Đã thi hành"

---

## 7. Ghi nhận nhưng CHƯA đưa vào GĐ1 (đúng phạm vi, để dành GĐ sau)

Các đề xuất dưới đây hợp lý nhưng không thuộc phạm vi "refactor thuần" của GĐ1 — đưa vào đây để
không quên, làm ở GĐ2 trở đi hoặc một PR bổ sung riêng, có cổng duyệt riêng, không trộn vào 8 PR
tách lõi để tránh phình phạm vi (đúng tinh thần "mỗi PR một thay đổi logic" ở CLAUDE.md §11).

- **Bảng tiến độ đa môn ở hub** — trang tổng quan hiển thị streak/thời gian học cộng gộp mọi môn
  của một người dùng, khác với `/progress` hiện tại (chỉ của tiếng Anh). Cần API tổng hợp đọc
  `usage_events`/`onboarding_profiles` qua mọi `subject`. Làm sau khi có ít nhất 2 môn thật để tránh
  thiết kế UI dựa trên phỏng đoán.
- **Referral xuyên môn** — giới thiệu bạn học Toán có tính thành lượt thưởng cho tiếng Anh không?
  Cần chốt cùng logic hạn mức (§2.4) vì bản chất là một dạng cộng lượt. Xem lại `src/lib/referral.ts`
  hiện có khi tới lúc.
- **Nội dung/pipeline soạn bài Toán-Lý-Hoá** (sinh đề theo tham số, gắn nhãn lớp/chương theo GDPT
  2018, kiểu `scripts/gen-*`/`scripts/tag-cefr-levels.ts` hiện có cho tiếng Anh) — thuộc GĐ2, đã ghi
  trong bản kế hoạch tổng (`ke-hoach-nen-tang-…md` §4 GĐ2).

---

## [10] Tài liệu: dac-ta-nang-cap-react-router-v7-2026-08-02.md

_(Chi tiết nguồn gốc: `dac-ta-nang-cap-react-router-v7-2026-08-02.md`)_

# Đặc tả: nâng cấp `react-router-dom` 6 → 7 (vá CVE moderate)

> Nghiên cứu 2026-08-02, theo yêu cầu "nghiên cứu + lên kế hoạch" ở `PROGRESS.md` mục "Nợ kỹ
> thuật còn mở" (mục react-router). Đây là ĐẶC TẢ/KẾ HOẠCH — **chưa thi hành code**, cần bạn
> duyệt trước khi làm (CLAUDE.md mục 3: "cổng giữa các giai đoạn" + mục 12: breaking change ảnh
> hưởng nhiều nơi phải hỏi trước).

## 1. Vì sao phải nâng major, không có bản vá ở nhánh 6.x

`npm audit` xác nhận 2 lỗ hổng moderate:

- `GHSA-wrjc-x8rr-h8h6` — Open redirect qua backslash trong `<Link>`/`useNavigate`.
- `GHSA-337j-9hxr-rhxg` — Arbitrary Constructor Injection qua `deserializeErrors()` (SSR
  hydration).

Dải phiên bản dính lỗ hổng: `6.0.0 – 7.17.0`. Bản vá nằm ở `react-router-dom@7.18.2` — **không
có bản 6.x nào được vá** (đã kiểm tra: bản 6.x mới nhất là `6.30.4`, vẫn nằm trong dải dính lỗi).
Muốn hết audit warning bắt buộc phải lên major 7.

## 2. Đánh giá rủi ro cụ thể cho dự án này

Đã quét toàn bộ codebase (`apps/english/src`, `apps/hub/src`) dùng `react-router-dom`:

- **API đang dùng:** `BrowserRouter`, `Routes`, `Route`, `Navigate`, `Link`, `useLocation`,
  `useNavigate`, `useParams`, `useSearchParams` — 32 file.
- **KHÔNG dùng** bất kỳ API "data router" nào: không `createBrowserRouter`, không
  `RouterProvider`, không `loader`/`action` trên route, không `<Outlet>`, không
  `useLoaderData`/`useActionData`/`useRouteError`. (Các chuỗi `action:` tìm thấy trong code đều
  là field object thường — payload gọi API, JSX prop `onClick`-style — không liên quan router.)
- Toàn app render qua `<BrowserRouter><Routes>...<Route>...</Routes></BrowserRouter>` đơn giản ở
  `apps/english/src/App.tsx` (32 `<Route>`, không lồng route con qua `<Outlet>`).

→ Đây là **kịch bản migration dễ nhất** trong tài liệu chính thức của React Router: ứng dụng chỉ
dùng "Declarative Mode" (tương đương "Library Mode" cũ), không có SSR, không có data
loader/action. React Router v7 **giữ nguyên** toàn bộ API kể trên ở chế độ Declarative Mode — v7
gộp 3 chế độ (Declarative/Data/Framework) vào 1 package, không bắt buộc đổi sang data router nếu
không cần.

## 3. Thay đổi cần biết khi lên v7 (đọc từ CHANGELOG + upgrade guide chính thức)

1. **Yêu cầu React ≥ 18** — dự án đã dùng React `^18.3.1`, đạt yêu cầu, không cần đổi.
2. **`future` flags của v6.30 nên bật trước khi nhảy v7** (`v7_relativeSplatPath`,
   `v7_startTransition`, …) để bắt sớm hành vi khác biệt — nhưng vì dự án không dùng route lồng
   kiểu splat (`*`) phức tạp và không có `Suspense`+`useNavigate` transition đặc thù, rủi ro thấp;
   vẫn nên bật thử trên nhánh 6.30.4 trước 1 bước trung gian nếu muốn an toàn tối đa (tuỳ chọn,
   xem mục 5).
3. **`json()`/`defer()` bị xoá** — dự án không dùng (không có loader), không ảnh hưởng.
4. **`useSearchParams`, `useNavigate`, `useParams`, `<Navigate>`, `<Link>`** giữ nguyên chữ ký —
   8 file đang dùng `useSearchParams` không cần sửa.
5. **Tên package không đổi** (`react-router-dom` vẫn tồn tại làm alias sang `react-router` cho
   tương thích ngược) — không bắt buộc đổi import, dù tài liệu mới khuyến khích chuyển sang
   `react-router` (gộp package). **Khuyến nghị: giữ nguyên `react-router-dom` ở lần nâng này**,
   tránh đổi 32 file import cùng lúc với nâng version — giảm diện thay đổi trong 1 PR.

## 4. Kế hoạch thực hiện (đề xuất chia 1 PR, có thể tách bước nếu muốn thận trọng hơn)

1. `npm install react-router-dom@^7.18.2` (bump duy nhất trong `package.json`/`package-lock.json`).
2. Chạy `npm run typecheck` — bắt lỗi type do đổi API (nếu có) ngay tại bước này trước khi chạy gì
   khác.
3. Chạy `npm run build && npm run lint && npm test` (cổng commit CLAUDE.md mục 8).
4. **Test tay bắt buộc** (do E2E hiện tại chỉ có 7 file, không phủ hết mọi route):
   - Đăng nhập → điều hướng qua ít nhất: Home, Chat, Speaking, Writing, Listening, Stories,
     Dictionary, Learn, Dashboard, Profile — xác nhận route khớp URL, back/forward trình duyệt
     hoạt động đúng.
   - Test riêng các trang dùng `useSearchParams` (Landing, LandingEn, CefrLevelPage, Chat,
     Listening, AdminDashboard, ResetPassword, Speaking) — xác nhận query string đọc/ghi đúng.
   - Test `<Navigate replace>` (3 chỗ: chưa đăng nhập → `/login`, chưa onboard → `/onboarding`,
     không phải admin → `/`) — xác nhận redirect không lặp vô hạn, không để lại lịch sử back rác.
5. Chạy `npm run test:e2e` đầy đủ (Playwright) — đây là cổng merge, không phải cổng commit, nhưng
   nên chạy trước khi xin duyệt vì đổi router ảnh hưởng toàn bộ điều hướng trong test.
6. Cập nhật `package.json` dependency + `CLAUDE.md` (không cần sửa mục "GIỮ NGUYÊN PHIÊN BẢN" vì
   mục đó chỉ áp cho React/TS/Tailwind/ESLint, không nhắc react-router) + xoá dòng nợ kỹ thuật
   react-router khỏi `PROGRESS.md`.

## 5. Phương án thận trọng hơn (nếu muốn giảm rủi ro tối đa)

Thay vì nhảy thẳng 6.24.1 → 7.18.2, có thể chia 2 bước:

- **Bước A:** 6.24.1 → 6.30.4 (bản 6.x mới nhất, cùng major, an toàn tuyệt đối) + bật các
  `future` flags (`v7_relativeSplatPath`, `v7_startTransition`, `v7_fetcherPersist`,
  `v7_normalizeFormMethod`, `v7_partialHydration`, `v7_skipActionErrorRevalidation`) trên
  `<BrowserRouter future={{...}}>` — các flag này làm 6.x tự cảnh báo console nếu code phụ thuộc
  hành vi cũ sắp đổi ở v7, giúp phát hiện sớm mà KHÔNG cần đổi major.
- **Bước B:** sau khi chạy ổn định vài ngày không thấy warning, mới lên hẳn `^7.18.2`.

Đánh đổi: an toàn hơn nhưng tốn 2 PR + 2 lần chờ duyệt thay vì 1. Vì đã xác nhận app không dùng
API phức tạp (mục 2), tôi nghiêng về **làm thẳng 1 bước (mục 4)** — nhưng để bạn quyết định cuối
cùng.

## 6. Việc KHÔNG làm trong lần nâng này

- Không đổi sang `createBrowserRouter`/data router — không cần thiết, tăng rủi ro không đáng.
- Không đổi import từ `react-router-dom` sang `react-router` — giữ nguyên tên package đang dùng.
- Không đụng `apps/hub` nếu hub không dùng react-router (cần xác nhận lại lúc thi hành — file này
  chỉ quét `apps/english`).

## Kết luận / việc cần bạn quyết định

Đề xuất: chọn giữa **phương án 1 bước** (mục 4, nhanh, rủi ro thấp vì codebase chỉ dùng API cơ
bản) hoặc **phương án 2 bước** (mục 5, an toàn hơn, chậm hơn). Sau khi bạn chọn, tôi sẽ thi hành
trên 1 nhánh riêng, chạy đủ cổng commit + test tay theo mục 4, rồi báo cáo trước khi xin merge.

---
