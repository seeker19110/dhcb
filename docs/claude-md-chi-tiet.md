# CLAUDE.md — phần chi tiết, lý do và lịch sử

> Dời NGUYÊN VĂN từ `CLAUDE.md` ngày 2026-10-02 (changelog 0476) để file nạp vào mỗi phiên gọn
> lại. **LUẬT hiện hành vẫn nằm ở `CLAUDE.md`** — file này giữ lý do, lịch sử, số đo và mô tả
> chi tiết mà luật đã tóm tắt. Khi hai nơi lệch nhau, `CLAUDE.md` thắng. Mỗi mục `§` khớp số
> mục của `CLAUDE.md`; mỗi đoạn dưới đây là bản gốc của một đoạn đã được rút gọn ở đó.
>
> Kiểm không mất chữ nào: `npm run check:claude-md -- <ref-trước-khi-rút-gọn>`.

## §1 — Dự án này là gì

**DHCB — "Đồng hành cùng bạn"** (quyết định 2026-08-23, người dùng chốt): **nền tảng đồng
hành cá nhân** phát triển mọi mảng liên quan đến một con người — trụ **Learning** (học tập,
nhiều môn) · **Career** · **Work** · **Startup** · **Life**, với **Companion "Bạn Đồng Hành"**
là tác tử AI xuyên suốt. App chính: `apps/dhcb` (gói `@dhcb/app`). Kiến trúc chuẩn:

## §2 — Tài liệu của dự án

- `docs/framework/QUY-TRINH-AUDIT.md` — đặc tả quy trình **audit toàn diện** (11 tầng + rà độ phủ test + audit luồng dữ liệu + mẫu báo cáo). **Đọc khi được yêu cầu "rà soát toàn bộ / audit toàn diện".** Bổ sung 2026-08-24: Tầng 1b (test flaky — một lượt xanh không đủ), Tầng 6b (tài liệu điều hành có nói đúng thực tế không), Tầng 10 (logic ngẫu nhiên/thống kê — loại lỗi KHÔNG cổng nào bắt được), Tầng 11 (đường cài mới + lũy đẳng migration).
  **Bổ sung 2026-09-05: Tầng 8b (NHÌN trang thật bằng ảnh chụp 1440px + 390px, trước/sau) — BẮT
  BUỘC với mọi đợt việc chạm giao diện.** Lý do: chuỗi ba đợt thiết kế lại desktop giáo dục (PR
  #861/#862/#863) tìm ra BỐN lỗi lặp nội dung mà không cổng nào bắt được và đọc mã cũng không
  thấy — chúng chỉ lộ ra khi nhìn ảnh chụp trang.

- `docs/research/dac-ta-nang-luc-ca-nhan-theo-do-tuoi-2026-08-23.md` — **năng lực cá nhân theo
  độ tuổi × bậc thành thạo × họ ngành nghề** (trụ LIFE + CAREER): 30 năng lực lõi, bảng 8 băng
  tuổi kèm dấu hiệu đạt + hành động 90 ngày, thang 5 bậc thay "số năm kinh nghiệm", 8 họ nghề,
  cách chấm/xếp hạng khoảng cách. **Luật bắt buộc: giới tính KHÔNG dùng làm trục kỳ vọng năng
  lực** — dùng "vai trò chăm sóc & gián đoạn nghề" thay thế (mục 8 của tài liệu). Đọc trước khi
  làm bất cứ việc gì liên quan hồ sơ năng lực/lộ trình cá nhân. **Bộ 3 tài liệu**, đọc kèm:
  `docs/research/nang-luc-10-40-chi-tiet-2026-08-23.md` (chi tiết vận hành quãng 10–40: 6 băng
  nhỏ, ngưỡng đo được, bài tự chẩn đoán 23 câu, chương trình 12 tuần) và
  `docs/research/dong-hanh-va-phat-trien-nang-khieu-2026-08-23.md` (**tư thế ĐỒNG HÀNH** — 8 luật
  hành xử của Companion theo SDT; **đường ĐỈNH phát triển năng khiếu** tách khỏi đường nền; cơ
  chế đóng góp xã hội). **Luật số 1 của sản phẩm: kết quả chẩn đoán KHÔNG bao giờ là màn hình
  chính** — nó là công cụ chọn việc, không phải bảng chấm điểm con người. Hai tài liệu chuyên sâu
  kèm theo: `docs/research/nang-luc-10-18-nen-tang-va-nang-khieu-2026-08-23.md` (3 trụ nền tảng
  học hành · nghiên cứu · hiểu biết rộng cho tuổi 10–18, thang nghiên cứu R1–R5, 7 miền tri thức,
  chế độ mở rộng 10–14 / thu hẹp 15–18 cho năng khiếu) và
  `docs/research/luong-nguoi-moi-ho-so-nang-luc-an-2026-08-23.md` (**luồng người mới**: 5 câu hỏi
  ~90 giây → hồ sơ năng lực ẩn → gợi ý ĐÚNG MỘT việc; **luật ngôn ngữ cấm/cho phép** + 7 test bất
  biến chặn CI để con số năng lực không rò lên giao diện).

- **14 hướng chuyên sâu của môn Lập trình** — 11 hướng sản phẩm (web · di động · backend · dữ
  liệu · AI · DevOps · bảo mật · hệ thống · game · nhúng · desktop) + **3 hướng NỀN cắt ngang**
  (kiến trúc · thuật toán · **toán cho lập trình**), mỗi hướng 4 chặng S1→S4 + 5 dự án + **bản đồ
  kiến trúc bắt buộc** (module · hợp đồng · quyết định phải chốt sớm · NFR · checklist đặc tả).
  **Nguồn sự thật là MÃ NGUỒN, không phải tài liệu nghiên cứu:**
  `packages/subject-programming/specializations/registry.ts` (danh sách 14 hướng) +
  `specializations/<hướng>.ts` (bản đồ chặng/module) + `specializations/details/<hướng>-<chặng>.ts`
  (nội dung chi tiết 56/56 chặng) + `specializations/stageUnits.ts` (chặng nào ĐÃ có bài học thật).
  Nền nghiên cứu: `docs/research/mon-lap-trinh.md` (bản gộp 6 tài liệu, có trước khi thêm hướng
  `mathforcode` nên chỉ mô tả 13 hướng — đọc để hiểu bối cảnh, KHÔNG dùng làm con số). Đặc tả
  triển khai từng chặng nằm ở `docs/specs/*-bai-hoc-that.md`. Đọc trước khi đụng bậc P6 hoặc nội
  dung sau P5.

- `docs/templates/dac-ta-tinh-nang.md` + `docs/templates/adr.md` — **khuôn đặc tả giao việc và
  khuôn ADR**. Dùng khi cần viết đặc tả cho AI/người khác thi hành: 6 ô bắt buộc (phạm vi có mục
  "KHÔNG làm" · điểm chạm file · hợp đồng vào-ra · tiêu chí chấp nhận đo được · bất biến + test
  canh · quy ước dự án) và ô nghiệm thu. Cơ sở lý thuyết ở đặc tả hướng chuyên sâu §2.5.

- `docs/ke-hoach-khoi-phuc-su-co-server.md` — **quy trình khôi phục khi server sập/gặp sự cố** (chẩn đoán nhanh → kịch bản xử lý → restore backup → post-mortem). Đọc khi có sự cố thật hoặc chuẩn bị runbook. Khác `docs/DEPLOY.md` (deploy + fix nhanh) và `docs/rollback-runbook.md` (rollback cấu hình theo PR cụ thể).

## §2.1 — Bộ skill miền (`.agents/skills/`)

## 2.1. Hệ thống 10 Siêu Kỹ Năng Tác Tử (`.agents/skills/`)

Hệ thống được chuẩn hóa theo 10 bộ quy chuẩn SOTA chuyên biệt trong `.agents/skills/`:

> **Kiểm thực tế 2026-10-01 (ADR-0013):** Claude Code **KHÔNG tự nạp** `.agents/skills/` — nó chỉ
> tìm skill ở `.claude/skills/<tên>/SKILL.md` (tài liệu chính thức). Phiên Claude chỉ dùng bộ dưới
> đây khi tự mở đúng file. Chưa chuyển sang `.claude/skills/` vì vài bản đã lỗi thời (vd
> `life-career-strategic-advisor` còn mô tả trụ Career/Life đã xoá 2026-09-20) — cần rà nội dung
> trước, chờ chủ dự án quyết.

1. `autonomous-agent-orchestrator`: Vòng lặp tự trị 5 bước, Multi-Agent Delphi Consensus, Zero-Trust Tool Synthesizer, REM Consolidation.
2. `financial-security-sentinel`: VietQR Webhook HMAC-SHA256, Idempotency, Prompt Caching Gateway, Referral VIP, Streak Freeze Vault.
3. `pedagogy-linguistics-master`: Sư phạm song ngữ 2 chiều, CEFR A1-C2, CAT IRT 3PL, BKT DAG, Acoustic GOP, Echo Shadowing.
4. `principal-engineer-architect`: Type safety strict, Zod validation, RRF Hybrid RAG, Web Worker Audio DSP, OPFS Edge AI, 5 Quality Gates.
5. `ui-ux`: 5 Focus Studios, CyberTutor Avatar Canvas 2D 15-visemes (WebGL chưa làm), 1v1 PvP 60 FPS, WCAG 2.2 AAA/AA, Design Tokens.
6. `gamification-viral-growth-architect`: 1v1 PvP Arena, Elo FIDE ($K=32$), Ghost Rival Matchmaking, Referral VIP 4 tầng mốc, Story Canvas.
7. `multimodal-realtime-voice-master`: Full-Duplex WebRTC (<250ms), Barge-in (<50ms), Web Audio Worker ($F_0, F_1, F_2$), 3D Viseme Shaders.
8. `memory-palace-cognitive-scaffolder`: Method of Loci 3D/Isometric, BKT DAG gap backtrack, Flow State CLI Regulator, Metacognitive MAI.
9. `stem-science-reasoning-master`: STEM Scratchpad 4 môn, Step-by-Step Symbolic Equation Validator, Socratic Micro-Hints, LaTeX rendering.
10. `life-career-strategic-advisor`: Tổng hợp 5 Miền Cuộc sống, Holistic Alignment HAS, Predictive Goal Horizon, Decision Ledger, Action Canvas.

## §3 — Cách quản lý dự án

- **Nhịp theo giới hạn giờ (usage limit):** ≥ 70% → hoàn tất việc đang làm, tạo PR rồi DỪNG chờ người dùng. < 70% → sau khi PR merge, tự tiếp mục kế tiếp trong `PROGRESS.md`. **Từ 2026-09-19 luật này được TỰ ĐỘNG nhắc** bởi hook Stop `.claude/hooks/usage-guard.sh` (bật bằng cách copy `.claude/usage-budget.example.sh` thành `.claude/usage-budget.sh` và điền số quota — file cá nhân, không commit).

## §4 — Nguyên tắc kỹ thuật bất biến

- Gác tự động, **chặn CI**, cả hai cổng TUYỆT ĐỐI (không có baseline/ngoại lệ): `e2e/a11y.spec.ts` (A/AA — 0 vi phạm ở mọi mức tác động) + `e2e/a11y-aaa.spec.ts` (AAA cho nội dung/tiêu đề). Đều quét **15 trang × 3 theme hiện hành**. Kèm lint `jsx-a11y` (`jsxA11y.flatConfigs.recommended` trong `eslint.config.js` — bật THẬT từ 2026-09-05; trước đó tài liệu ghi có nhưng gói chưa từng được cài, audit toàn diện F1 phát hiện. Chuyển sang flat config 2026-09-22, đã kiểm luật còn bắt lỗi thật bằng file thử `<img>` thiếu `alt`).

## §6 — Công nghệ (stack) & lệnh

- **Frontend:** React 18 + Vite 7 + TypeScript 5.2 (`strict`) + Tailwind CSS 3 (mã gốc do Lovable sinh ra).

- **PHIÊN BẢN STACK (cập nhật 2026-09-22, đợt changelog 0416).** Đã nâng: **React 19** · **Tailwind 4** (qua `@config`, dùng lại cấu hình JS cũ) · **ESLint 9 flat config** · **Express 5** · **Vite 8** (rolldown thay Rollup). Giữ **Node 22** và **TypeScript 5.x**.

  **Ba thứ CHƯA nâng được, và lý do là RÀNG BUỘC THẬT chứ không phải sở thích** — đừng thử lại
  trước khi ràng buộc mất:
  - **TypeScript 7**: `@typescript-eslint/parser` (bản mới nhất) khai `typescript: ">=4.8.4 <6.1.0"`.
    Cài TS 7 là đẩy cổng lint ra ngoài vùng hỗ trợ.
  - **ESLint 10**: `eslint-plugin-jsx-a11y` (bản mới nhất) chỉ khai peer `eslint: ^…^9`, mà đó là
    cổng a11y bắt buộc ở mục 4.5. **Đích ESLint là 9.x.** Nền: `docs/adr/0011-nang-eslint-9-flat-config.md`.
  - **Node 26**: chờ tới sau 2026-10-28 (v22 hỗ trợ đến 2027-04-30 nên không gấp; v24 rời Active
    LTS 2026-10-20 nên nâng lên 24 là nâng vào dòng sắp hạ cấp).

  **Vite 8 (rolldown) — hai điều phải biết** (nền: `docs/changelog/0416-*.md`):
  - **Rolldown kiểm `exports` NGHIÊM.** Không gói `@dhcb/*` nào khai entry `"."`, chỉ khai `"./*"`,
    nên bare import `@dhcb/<gói>` **gãy build** với `"." is not exported`. Đây chính là quy ước
    import ở cuối mục 6 này — Rollup từng dễ tính bỏ qua, rolldown thì không. Viết đủ
    `@dhcb/<gói>/<file>`.
  - **Không còn sinh file `.br`.** Không ảnh hưởng production vì `nginx/en-vi.conf` chỉ có
    `gzip_static on;`, chưa từng có `brotli_static`.

  **Tailwind 4 dùng `@config`** để giữ nguyên `apps/*/tailwind.config.js` — pipeline token
  `--a-*`/`--z-*` KHÔNG bị viết lại. Bảng màu v4 khai bằng `oklch()` (kể cả `oklch(L 0 none)` cho
  thang vô sắc), nên cổng tương phản đọc màu qua `parseCssColor` ở `scripts/lib/contrast.ts`; nó
  **ném lỗi** khi gặp định dạng lạ thay vì bỏ qua — đừng đổi thành bỏ qua, đó chính là lỗ hổng
  xanh-giả đã vá ở changelog 0415.

- **Cấu trúc [Cập nhật 2026-08-23, workspace THẬT — PR-S1..S4 phương án B, xem
  `docs/research/dac-ta-cai-to-cau-truc-2026-08-23.md`]:** `apps/dhcb/` (đổi tên từ `apps/english` ở PR-S2b — app NỀN TẢNG, gói `@dhcb/app`) là Vite app ĐẦY ĐỦ
  (`index.html` + `public/` + `vite.config.ts` + `tailwind/postcss` + `tsconfig.json` +
  `package.json @dhcb/app` + `src/`: `pages/`, `components/`, `lib/`, `data/`, `prompts/`
  — dời từ gốc repo ở PR-S2; npm script gốc gọi `vite --config apps/dhcb/vite.config.ts`,
  **output build VẪN là `dist/` ở gốc** cho nginx/deploy không đổi; tsconfig gốc chỉ còn là
  solution file, compilerOptions chung ở `tsconfig.base.json`), `apps/server/` (gói `@dhcb/server` — Express: `apps/server/src/server.ts` khởi tạo app/middleware/static/scheduler, `apps/server/src/routes.ts` bảng gắn ~100 route API, `apps/server/src/api/{core,billing,admin,personal,domains,learning,platform,subjects/english}/` handler chia theo trụ (PR-S4, URL không đổi) + `_lib/` hạ tầng; dời từ gốc ở PR-S3, output biên dịch VẪN là `dist-server/server.js`), `packages/`
  (23 gói npm workspace thật — đếm lại 2026-09-19: `@dhcb/core-*` + `@dhcb/subject-english` (logic môn Anh) + `@dhcb/subject-programming` (logic môn Lập trình, thêm ở PR-L1) + `@dhcb/subject-math` (môn Toán); `core-domains` từng gộp 4 gói career/work/startup/life — **từ 2026-09-20 CHỈ CÒN trụ `work`, mang tên hiển thị "Ghi chú" ở `/ghi-chu`. Ba trụ Career · Startup · Life đã XOÁ HẲN: giao diện gỡ ở `docs/changelog/0389-*`, rồi service + route API (`/api/career`, `/api/career-interview`, `/api/startup`, `/api/life`) + BẢNG CSDL gỡ luôn theo quyết định chủ dự án (migration `postgres/migrations/0085_drop_career_startup_life.sql`). Companion vì thế KHÔNG còn tư vấn xuyên trụ ở ba mảng đó; read model ở `core-domains/domainReadModelService.ts` chỉ còn `work`**; `core-grading` từng bị xoá vì mồ côi, đã KHÔI PHỤC 2026-08-31 cho 3 gói môn STEM `subject-physics`/`subject-chemistry`/`subject-biology` (nội dung bản nháp chờ duyệt, CHƯA nối vào `apps/` — xem `docs/goals/2026-08-31-mon-hoc-toan-ly-hoa-sinh.md`), MỖI GÓI có `package.json` + `tsconfig.json`
  composite; gói mới `core-http` = hạ tầng http/validation/mailer tách từ `api/_lib` cũ (thư mục đã không còn sau đợt cải tổ)),
  `apps/hub/` (gói `@dhcb/hub` — Vite app **riêng, tách khỏi `@dhcb/app`**: trang chủ/landing
  giới thiệu nền tảng "Đồng Hành Cùng Bạn" tại domain gốc, "Global Studio Switcher" chuyển nhanh
  giữa các miền/subject, `HubLogin`; build qua `npm run build --workspace=@dhcb/hub` gọi trong
  script `build` gốc), `postgres/`, `scripts/`, `docs/`.
  **Import xuyên gói dùng tên gói `@dhcb/<gói>/<file>` (KHÔNG đuôi `.js`), import nội bộ gói
  dùng đường tương đối có đuôi `.js`.** Luật phụ thuộc (ESLint chặn): `packages/` không import
  `apps/` và không import `api/`. Build backend = `npm run build:packages` (`tsc -b` project
  references, mỗi gói emit `dist/` riêng) rồi `tsc -p tsconfig.server.json`; dev
  (`tsx`/Vite/Vitest) phân giải `@dhcb` về source qua tsconfig `paths` + alias, KHÔNG cần build
  gói trước. CI có bước boot check `node dist-server/server.js` + `/api/health`.

## §7 — Quy ước khi viết code & cách làm việc

- **Slash-command sẵn có (`.claude/commands/`):** `/gate` (cổng commit/merge + Báo cáo xác thực,
  mục 8-10) · `/debug` (chẩn đoán bug khó theo 6 pha có kỷ luật) · `/incident` (sự cố production —
  giảm thiệt hại trước, bám `docs/ke-hoach-khoi-phuc-su-co-server.md`) · `/consult` (tư vấn công
  nghệ research-first cho DHCB) · `/protocol` (in trạng thái một feature theo
  `AI_DEVELOPMENT_PROTOCOL.md`) · **thêm 2026-09-21 (áp từ `seeker19110/projects-template`):**
  `/adr` (tạo ADR — bản ghi quyết định kiến trúc khó đảo, xem `docs/adr/`) · `/contract` (chốt
  schema Postgres/API TRƯỚC khi code) · `/grill` (phỏng vấn dồn dập làm rõ ý tưởng trước khi
  hành động, kỹ thuật cụ thể cho mục 12 "dừng và hỏi") · `/review` (đọc-hiểu logic/thiết kế trước
  khi mở PR, khác `/gate` chỉ chạy máy) · **thêm 2026-10-01 (chuyển thể từ ECC, ADR-0013):**
  `/build-fix` (gỡ cổng đỏ ở máy/CI với diff tối thiểu, không nới cổng) · `/learn` (rút bài học
  của phiên thành mục `TRAPS.md`, chờ người dùng duyệt mới ghi). Dùng thay vì tự nhớ quy trình mỗi lần.
  7 file `.claude/agents/*.md` điều phối 3 tầng theo route độ phức tạp
  (`complex-implementer`/`coordinator`/`mechanical-worker`/`qa-verifier`/`reviewer`/
  `spec-executor`/`standard-worker` — xem `docs/framework/KIEN-TRUC-DIEU-PHOI-3-TANG.md`) +
  **3 subagent tiện ích thêm 2026-09-21** ngoài bảng route đó, gọi trực tiếp khi cần:
  `lookup` (tra cứu read-only, Haiku) · `version-check` (xác minh phiên bản qua nguồn sống,
  Haiku) · `security-reviewer` (rà bảo mật độc lập trên diff, Sonnet, dùng trong `/review`) +
  **3 cái chuyển thể từ ECC 2026-10-01:** `build-error-resolver` (gỡ cổng đỏ, Sonnet, dùng trong
  `/build-fix`) · `silent-failure-hunter` (săn lỗi bị nuốt + rào an ninh/tiền fail-open, chỉ đọc)
  · `database-reviewer` (rà SQL/migration Postgres tự host, không RLS, chỉ đọc). Đây
  là lớp **khác** 10 skill ở mục 2.1 (skill = kiến thức miền, agent = vai trò điều phối/thực thi
  việc) — dùng song song, không thay thế nhau.

- **OpenCodeReview ở chế độ delegation (2026-10-01, ADR-0012):** `/review` lấy danh sách file +
  luật DHCB theo đường dẫn từ `.opencodereview/rule.json` qua `npm run review:ocr:preview` và
  `npm run review:ocr -- delegate rule <file...>` — không gọi LLM, không tốn lượt AI. Thêm luật
  dự án theo vùng code thì sửa file đó (luật `**/*` luôn đứng cuối — `scripts/ocr-rules-policy.test.ts`).
- **`npm run check:docs`** (`scripts/check-docs-consistency.sh`, thêm 2026-09-21, áp từ
  `seeker19110/projects-template`) — đối chiếu máy hai chiều lệnh ↔ CLAUDE.md và subagent
  frontmatter `name:` ↔ tên file, bắt lỗi kiểu "thêm lệnh mà quên khai trong CLAUDE.md". Chạy
  trước khi thêm/xoá `.claude/commands/`hoặc `.claude/agents/`.

- **Quy ước URL mang tiêu đề (chốt 2026-09-01, PR #795 mở rộng cho môn Lập trình).** Route nào
  có tham số là id một nội dung có tiêu đề (bài học, bậc học, hướng chuyên sâu, khoá học, lộ
  trình, chặng…) PHẢI dùng khuôn `<mã>--<tiêu đề đã slug hoá>` — ví dụ `p1--nhap-mon-tu-duy`,
  `web--lap-trinh-web`, `cv1--deep-learning-for-computer-vision-co-ban`. Dùng `buildSlugSegment`/
  `idFromSlugSegment` ở `packages/core-ui/slug.ts`: mã giữ nguyên (không đổi khoá tiến độ, không
  phá link cũ), phần slug chỉ để người đọc/Google biết trang nói về gì — trang tự đọc `idFromSlugSegment`
  ra mã, bỏ qua phần mô tả. **Không tự ghép chuỗi URL rải rác ở nhiều nơi** — dựng qua đúng MỘT
  hàm dùng chung theo mẫu `apps/dhcb/src/lib/programmingRoutes.ts` (`duongDanBac`, `duongDanKhoa`,
  `duongDanHuong`, `duongDanLoTrinh`, `duongDanChangHuong`…), rồi mọi nơi tạo link gọi hàm đó.
  Route chỉ khớp mã cũ (không có `--`) vẫn phải tra đúng và tự `<Navigate replace>` về URL chuẩn
  để không phá link đã chia sẻ. Ngoại lệ đã quyết định KHÔNG áp dụng: param đã tự mô tả nội dung
  hoặc là mã mời (`/tu-vung/:word`, `/ket-ban/:code`, `/nhom-di-chung/:code`), mã cố định giá trị
  SEO thấp (`/lo-trinh-hoc/:levelId` — mã CEFR A1–C2), và route có logic định tuyến đa host riêng
  (`/mon-hoc/:subjectId`).

## §8 — Cổng trước khi COMMIT

**Từ 2026-09-19, hook PreToolUse `.claude/hooks/pre-commit-gate.sh` TỰ CHẶN `git commit` khi `typecheck`/`lint`/`test` đỏ** (không chạy `build` ở đây — quá chậm cho mỗi commit, vẫn bắt buộc ở CI job `build` + checklist merge). Bỏ qua có chủ đích: `git commit --no-verify`. Hook `.claude/hooks/block-dangerous-git.sh` cũng chặn cứng `reset --hard`/`clean -f`/`branch -D`/`checkout .`/`push --force`/`merge --abort` (thi hành mục 11 bằng máy, không chỉ bằng văn bản).

**Từ 2026-10-01 (chuyển thể từ ECC, ADR-0013):** hook PreToolUse `.claude/hooks/config-protection.sh`
canh Edit/Write vào một CỔNG (cấu hình lint/format/coverage, test canh luật
`scripts/*-policy.test.ts`, cổng a11y, workflow CI, `.husky/`, chính các hook) theo **hai nấc**:
lần đầu chạm cổng đó trong phiên → **từ chối** kèm lý do (phải nói rõ với người dùng sửa gì + vì
sao rồi mới thử lại), từ lần sau → **hỏi quyền**. Không chỉ "hỏi" vì đo thật ở phiên cloud auto
mode: `ask` của hook không hiện hộp hỏi nào. Bỏ qua có chủ đích: `ALLOW_GATE_EDIT=1`. Hook
PostToolUse `.claude/hooks/auto-format.sh` chạy Prettier ngay sau mỗi lần sửa file (báo lại cho
Claude nếu Prettier gặp lỗi cú pháp). Đọc `.env`/`.env.*` (trừ `.env.example`) luôn phải hỏi
(`permissions.ask`). `scripts/agent-config-security.test.ts` canh tất cả những điều này trong CI.
**Thêm 2026-10-02 (changelog 0469):** `.claude/hooks/block-pipe-to-shell.sh` chặn tải-rồi-chạy
(`curl … | sh`, `sh -c "$(curl …)"`, `bash <(curl …)` — luật quyền không khớp được lệnh có `|`;
cách đúng: tải về file, đọc, rồi chạy; bỏ qua có chủ đích `ALLOW_PIPE_TO_SHELL=1`) và
`.claude/hooks/shared-file-reminder.sh` NHẮC (không chặn) chạy `npm run codemap -- impact` khi
lần đầu sửa một file được ≥ 20 nơi import (đếm từ `.codemap/graph.json`; chưa có bản đồ thì im
lặng). Test hành vi: `scripts/claude-hooks.test.ts`.

**Rà câu chữ nội dung học (thêm 2026-09-21, `docs/changelog/0406`):** `npm run audit:prose` (`scripts/audit-prose.ts`) quét chính tả tiếng Việt sai chuẩn, từ lặp, dấu câu, tiếng Việt không dấu, TODO sót trong bài học/hội thoại/truyện/từ điển; `-- --ci` thoát 1 khi còn lỗi mức ✖ (chạy trong CI job `audit`). Nó chỉ bắt lớp lỗi máy nhìn được — phần "dễ hiểu / đúng sư phạm" vẫn phải người đọc tay theo khuôn rà 5 tiêu chuẩn ghi ở changelog 0406. **Sửa từ điển (`apps/dhcb/public/data/dictionary/chunk-*.json`) xong thì chạy `npx tsx scripts/archive/sync-vocab-from-dictionary.ts`** (đồng bộ nghĩa/ví dụ sang hai file vòng từ vựng mà KHÔNG xáo thành phần vòng), rồi `gen-curriculum-json.ts` + `gen-learn-json.ts` — chỉ sửa CHỮ thì KHÔNG chạy lại `gen-a1b2-extra-vocab.ts`/`gen-cefr-c1c2-vocab.ts` vì chúng xếp vòng theo nghĩa tiếng Việt, sẽ phá bộ câu mẫu viết tay theo id vòng. **Đổi BẬC hoặc thêm/xoá từ** thì buộc phải sinh lại vòng theo đúng thứ tự 5 bước ở `docs/audit/2026-09-15-sinh-lai-vong-theo-thang-bac.md` §2, rồi `npx tsx scripts/archive/reassign-circle-sentences.ts` gán lại câu mẫu cũ cho vòng mới (2026-09-22: cứu 208/239 câu) và viết tay phần nó báo còn thiếu. Bậc của nhãn KHÔNG có nguồn CEFR-J/Octanove phải tôn trọng sàn theo tần suất (`UNSOURCED_LEVEL_FLOORS`, cổng `packages/subject-english/dictionaryLevels.test.ts`; áp bằng `scripts/archive/relevel-unsourced-easy-words.ts`).

**Công cụ phải khớp lockfile (bài học 2026-08-04, CI #475 đỏ).** Cổng chỉ đáng tin khi `node_modules` đúng `package-lock.json`. Dấu hiệu lệch: cổng local báo lỗi ở **nhiều file mình không hề đụng tới**, hoặc local xanh mà CI đỏ (và ngược lại). Gặp dấu hiệu đó → `npm ci` rồi chạy lại cổng, ĐỪNG đi sửa từng file theo báo lỗi giả. Trong container phiên mới, chạy `npm ci` trước lần chạy cổng đầu tiên. Kiểm nhanh: `npx prettier --version` khớp `package.json`.

**Golden snapshot prompt (thêm 2026-09-12, học từ `seeker19110/claude-agents`):** `apps/dhcb/src/prompts/golden.test.ts` chụp lại nguyên văn chuỗi prompt của 9 hàm dựng prompt môn Anh (`__snapshots__/golden.test.ts.snap`). Nó **KHÔNG gọi AI**, chạy trong CI mọi PR, miễn phí — bắt đúng thứ `eval:tutor` không bắt được: prompt bị sửa **không chủ đích** (đổi chữ, đổi khoảng trắng, sửa nhầm khi refactor). Sửa prompt có chủ đích thì xem kỹ diff snapshot rồi cập nhật: `npx vitest run apps/dhcb/src/prompts/golden.test.ts -u`, commit cả `.snap`. **Snapshot KHÔNG thay thế `eval:tutor`** — vẫn phải chạy eval + dán bảng như trên; hai cổng bổ sung nhau (snapshot = đổi cái gì, eval = đổi có tốt lên không).

## §11 — Quy ước Git

3. **Gọi bật auto-merge (squash) ĐÚNG MỘT LẦN, NGAY trong vài giây sau lệnh tạo PR.** Đo 2026-09-06: #867 gọi ngay → **bật được**; #865 gọi sau khi `metadata` xanh → "clean status"; #866 gọi khi check đang chạy → "unstable". Cửa sổ chỉ vài giây. Trượt cửa sổ thì GitHub từ chối ở cả lúc CI đang chạy ("unstable status — required checks are failing" là cách nói trạng thái `unstable`, KHÔNG có nghĩa là có check đỏ) lẫn lúc CI xong ("already in clean status"). **Đừng chẩn đoán, đừng gọi lại.** Thất bại thì theo dõi CI; **xanh cả 3 check + không xung đột → tự merge (squash) NGAY** (quy ước người dùng 2026-08-28).

## §11.1 — Quy ước CI

CI là thứ đứng giữa mọi PR và `main`, nên nó **chậm là tốn của cả dự án**: auto-merge bật cho
mọi PR, mỗi lần push sửa là chờ lại từ đầu. Bốn luật dưới đây áp cho MỌI thay đổi
`.github/workflows/ci.yml` từ nay.

**1. Song song, không nối đuôi.** Mỗi bước cổng đứng ở một job riêng chạy đồng thời
(`static` · `unit` · `build` · `audit`), thời gian tường bằng nhánh chậm nhất chứ không bằng
tổng. Thêm bước kiểm mới thì **gắn vào job con hợp lý nhất**, đừng nối thêm vào một job đã dài;
nếu bước mới nặng và không phụ thuộc ai, cho nó job riêng.

**2. Tên `quality` và `e2e` là BẤT BIẾN.** Đây là required status check của branch protection
nhánh `main` (cùng `metadata`). Hai job đó nay chỉ là **job tổng hợp** — `needs:` các job con và
`exit 1` nếu có job nào không `success`. Đổi id chúng = auto-merge kẹt vĩnh viễn trên mọi PR
đang mở, và **hỏng im lặng**: không PR nào đỏ để lần ra nguyên nhân. Thêm job con mới thì
**phải** nối vào `needs` của một trong hai, nếu không kết quả của nó không được tính vào cổng.

**3. E2E luôn chia mảnh.** `--shard=N/M` trên matrix + `fail-fast: false` (một mảnh đỏ không
giết các mảnh kia — xem hết lỗi trong MỘT vòng thay vì sửa từng cái một). Playwright chia mảnh
theo **số test chứ không theo thời gian**, nên cụm test nặng dồn vào một mảnh sẽ tự mình quyết
định thời gian tường; số mảnh chọn theo ĐO THẬT, không theo cảm giác.

**4. Chỉ upload artifact khi ĐỎ (`if: failure()`).** Báo cáo Playwright của một mảnh xanh đo
được là ~29 giây trên đường tới hạn để tạo ra file không ai mở.

**Cách làm việc bắt buộc khi động vào CI: ĐO, đừng đoán.** Sau khi đổi, đọc thời gian thật của
từng job trong run CI của chính PR đó (`started_at`/`completed_at`), và đọc mốc `##[group]Run`
trong log job để biết từng BƯỚC tốn bao lâu. Tối ưu chỗ chưa đo là đoán mò.

Ba luật đầu + luật 4 có **test canh gác chặn CI**: `scripts/ci-workflow-policy.test.ts`. Sửa
`ci.yml` mà test đó đỏ nghĩa là đang phá một luật — sửa cho đúng luật, **đừng sửa test cho vừa**.
