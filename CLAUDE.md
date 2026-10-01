# CLAUDE.md — DHCB "Đồng hành cùng bạn" (nền tảng đồng hành cá nhân)

> File này được Claude Code đọc tự động ở đầu mỗi phiên. Mục tiêu: giúp Claude hiểu dự án và làm đúng ý.
> **Người làm: mới bắt đầu lập trình.** Hãy GIẢI THÍCH NGẮN GỌN BẰNG TIẾNG VIỆT khi sửa code, và **cảnh báo trước khi làm thay đổi lớn**.
> Giữ file này gọn — chi tiết tính năng/kế hoạch để ở `PROJECT.md` · `PROGRESS.md` · tài liệu liên quan, đọc khi cần.

## 0. Vai trò của bạn (AI)

Bạn vừa là **kỹ sư phần mềm cấp cao**, vừa là **người quản lý dự án**. Không chỉ code theo lệnh — bạn dẫn dắt dự án qua các giai đoạn một cách kỷ luật, giữ chất lượng cao nhất, và **chủ động góp ý để dự án hoàn thiện nhất**. Khi nhận **ý tưởng/thay đổi công nghệ**, bạn **nghiên cứu kỹ rồi mới đề xuất** — đúng phiên bản ổn định hiện hành (xem KHUNG 3).

## 1. Dự án này là gì

**DHCB — "Đồng hành cùng bạn"** (quyết định 2026-08-23, người dùng chốt): **nền tảng đồng
hành cá nhân** phát triển mọi mảng liên quan đến một con người — trụ **Learning** (học tập,
nhiều môn) · **Career** · **Work** · **Startup** · **Life**, với **Companion "Bạn Đồng Hành"**
là tác tử AI xuyên suốt. App chính: `apps/dhcb` (gói `@dhcb/app`). Kiến trúc chuẩn:
`docs/research/kien-truc-va-ha-tang.md` mục [1] (khuôn "thêm môn học mới",
tiêu chuẩn ngành phải theo).

**English là MỘT MÔN HỌC trong trụ Learning** — môn đầu tiên và chín nhất (mô tả chi tiết
dưới đây vẫn đúng cho môn này): web app gia sư ngôn ngữ AI hai chiều (Việt ⇄ Anh).

**Hai chiều học** (chọn bằng biến `direction` — `getDirection`/`setDirection` trong `apps/dhcb/src/lib/storage.ts`):

- **A — Người Việt học tiếng Anh:** hội thoại giọng Anh, sửa lỗi/giải thích giọng tiếng Việt.
- **B — Người nước ngoài học tiếng Việt (qua tiếng Anh):** hội thoại giọng Việt, sửa lỗi/giải thích giọng tiếng Anh.

Ba chế độ:

1. **Chat tổng hợp** — gia sư AI trò chuyện thân mật/nhẹ nhàng, sửa lỗi kèm động viên, giải thích
   bằng tiếng Việt; có nút "Kết thúc & chấm điểm" cuối phiên (chấm kiểu IELTS Speaking).
2. **Luyện viết + chấm điểm** — chấm bài kiểu IELTS, chỉ lỗi, ước lượng band.
3. **Luyện nói song ngữ** (tính năng chính) — nói → AI nghe (STT) → trả lời bằng **giọng ngôn ngữ đích** + sửa lỗi/giải thích bằng **giọng tiếng mẹ đẻ của học viên** (TTS hai giọng riêng). Chiều A: đích=Anh, giải thích=Việt. Chiều B: đích=Việt, giải thích=Anh.

Điểm khác biệt phải giữ: **sửa lỗi & giải thích bằng GIỌNG tiếng mẹ đẻ** (không chỉ chữ), hội thoại bằng giọng chuẩn của ngôn ngữ đích, giá rẻ, nội dung sát đời sống Việt Nam.

## 2. Tài liệu của dự án (đọc khi liên quan)

- `@PROJECT.md` — _cái gì_ cần xây (vấn đề, MVP, schema, kiến trúc, DoD). **Đọc trước việc liên quan tính năng/thiết kế.**
- `PROGRESS.md` — **trạng thái hiện tại**: đã xong / đang làm / tiếp theo, quyết định quan trọng,
  **nợ kỹ thuật**, việc cần làm tay. Sửa TẠI CHỖ, không chồng thêm mục.
- `docs/changelog/` — **nhật ký từng đợt việc, mỗi đợt một file** (tách khỏi `PROGRESS.md`
  2026-08-26 để hai PR song song không xung đột — xem `docs/changelog/README.md`). Xem nhanh:
  `npm run changelog`.
- `TRAPS.md` — **sổ bẫy đã mắc THẬT** (khác `docs/adr/` ghi quyết định): khuôn lỗi + cách rà +
  cổng chốt chặn, có ngày/PR. Tra trước khi debug lại từ đầu. Cổng liên quan:
  `scripts/check-progress-freshness.sh` cảnh báo khi `PROGRESS.md` nhắc nhánh đã lỗi thời
  (chạy trong CI job `audit` khi push lên `main`).
- `App-Gia-Su-Tieng-Anh-AI.md` — kế hoạch sản phẩm đầy đủ.
- `docs/framework/KHUNG-1..3-*.md` — quy trình 9 giai đoạn + luật AI + research-first chọn công nghệ.
- `docs/framework/BO-SUNG-*.md` — chất lượng Nhóm 1/2 (mobile, hiệu năng, a11y, UI/UX, chống lỗi logic), theme, i18n/PWA/Sentry/SEO.
- `docs/framework/QUY-TRINH-AUDIT.md` — đặc tả quy trình **audit toàn diện** (11 tầng + rà độ phủ test + audit luồng dữ liệu + mẫu báo cáo). **Đọc khi được yêu cầu "rà soát toàn bộ / audit toàn diện".** Bổ sung 2026-08-24: Tầng 1b (test flaky — một lượt xanh không đủ), Tầng 6b (tài liệu điều hành có nói đúng thực tế không), Tầng 10 (logic ngẫu nhiên/thống kê — loại lỗi KHÔNG cổng nào bắt được), Tầng 11 (đường cài mới + lũy đẳng migration).
  **Bổ sung 2026-09-05: Tầng 8b (NHÌN trang thật bằng ảnh chụp 1440px + 390px, trước/sau) — BẮT
  BUỘC với mọi đợt việc chạm giao diện.** Lý do: chuỗi ba đợt thiết kế lại desktop giáo dục (PR
  #861/#862/#863) tìm ra BỐN lỗi lặp nội dung mà không cổng nào bắt được và đọc mã cũng không
  thấy — chúng chỉ lộ ra khi nhìn ảnh chụp trang.
- `docs/framework/AP-DUNG-vao-du-an-co-san.md` — cách áp khung lên dự án có sẵn (đang theo runbook này).
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
- `docs/deploy-vps-ubuntu.md` — hướng dẫn deploy VPS. ADR (quyết định kiến trúc lớn): đặt ở `docs/adr/` khi có.
- `docs/ke-hoach-khoi-phuc-su-co-server.md` — **quy trình khôi phục khi server sập/gặp sự cố** (chẩn đoán nhanh → kịch bản xử lý → restore backup → post-mortem). Đọc khi có sự cố thật hoặc chuẩn bị runbook. Khác `docs/DEPLOY.md` (deploy + fix nhanh) và `docs/rollback-runbook.md` (rollback cấu hình theo PR cụ thể).
- `docs/MASTER_SPEC.md` — tầm nhìn kiến trúc Đồng Hành Platform (THAM KHẢO tầm nhìn).
  **Nguồn thi hành duy nhất (chốt Q2, 2026-08-23): `PROGRESS.md` +
  `docs/research/kien-truc-va-ha-tang.md` mục [1].** `docs/phases/00..45-*.md` và
  `docs/architecture-v2/` là kho tham khảo nghiệm thu — KHÔNG phải backlog đang chạy.

## 2.1. Hệ thống 10 Siêu Kỹ Năng Tác Tử (`.agents/skills/`)

Hệ thống được chuẩn hóa theo 10 bộ quy chuẩn SOTA chuyên biệt trong `.agents/skills/`:

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

> Các file trong `docs/framework/` là tham khảo dài — đọc đúng phần cần, không nạp toàn bộ mỗi phiên.

## 3. Cách quản lý dự án (quan trọng nhất)

- **Theo giai đoạn, không bỏ giai đoạn.** Đầu phiên nêu rõ đang ở giai đoạn nào, việc tiếp theo là gì.
- **Cổng giữa các giai đoạn.** Trước khi chuyển giai đoạn / thay đổi lớn: tóm tắt đã đạt cổng chưa và **xin xác nhận của người dùng**.
- **Theo dõi trạng thái.** `PROGRESS.md` chỉ giữ TRẠNG THÁI HIỆN TẠI (giai đoạn · tiếp theo · việc tay · quyết định · nợ mở) — sửa TẠI CHỖ khi trạng thái thật sự đổi, không chồng thêm mục. Phần đã xong dời sang `docs/legacy/`.
- **TẠO PR = COI NHƯ ĐÃ XONG (2026-08-09, làm rõ 2026-08-26).** Ba việc làm **liền một mạch**, không tách ra hỏi lại:
  1. **Nhật ký đợt việc = MỘT FILE MỚI trong `docs/changelog/`** theo khuôn `NNNN-YYYY-MM-DD-slug.md` (`npm run changelog` in số kế tiếp). Ghi số PR, ngày, việc đã làm, quyết định, bằng chứng kiểm chứng. KHÔNG chồng mục vào `PROGRESS.md` (test `scripts/changelog.test.ts` canh).
  2. **Cập nhật `PROGRESS.md`** chỉ khi trạng thái đổi (mục "Tiếp theo" / nợ / việc tay), kèm số PR. Sửa `CLAUDE.md`/`PROJECT.md`/`docs/*` nếu thay đổi chạm tới. **Quy ước chung (2026-09-19): bước đồng bộ `PROGRESS.md` LUÔN gộp vào PR đang mở gần nhất của đợt việc đó — KHÔNG tách thành PR/commit riêng**, kể cả khi phát hiện lệch trạng thái đến từ nguồn khác (vd `scripts/maintenance-sweep.sh`, `check-progress-freshness.sh`) trong lúc PR đó còn đang mở.
  3. **Bật auto-merge (squash) trong cùng nhịp tạo PR; không bật được thì theo dõi và tự merge khi CI xanh** — xem mục 11.
- **PR KHÔNG ĐỂ Ở DẠNG NHÁP** — GitHub từ chối auto-merge trên PR nháp (đã dính PR #693). Công cụ tạo nháp thì bỏ nháp ngay.
- **Chia nhỏ.** Mỗi lần một phần nhỏ, hoàn chỉnh, kiểm tra được. Việc lớn → đề xuất kế hoạch chia nhỏ trước.
- **Chủ động góp ý (BẮT BUỘC).** Thấy cách tốt hơn / rủi ro / thiếu sót / phạm vi phình → **nêu kèm đề xuất cụ thể**. Im lặng làm theo khi biết có vấn đề là vi phạm.
- **Nhịp theo giới hạn giờ (usage limit):** ≥ 70% → hoàn tất việc đang làm, tạo PR rồi DỪNG chờ người dùng. < 70% → sau khi PR merge, tự tiếp mục kế tiếp trong `PROGRESS.md`. **Từ 2026-09-19 luật này được TỰ ĐỘNG nhắc** bởi hook Stop `.claude/hooks/usage-guard.sh` (bật bằng cách copy `.claude/usage-budget.example.sh` thành `.claude/usage-budget.sh` và điền số quota — file cá nhân, không commit).
- **Phân việc theo độ phức tạp (2026-07-15).** LUÔN đọc đặc tả liên quan (`docs/research/*.md`, `docs/specs/*.md`) trước khi giao. Phức tạp (kiến trúc, nhiều file/luồng, cần ngữ cảnh phiên) → **tự làm**. Vừa (1 tính năng/hàm có đặc tả rõ) → subagent **Sonnet**. Cơ học (đổi tên hàng loạt, format) → subagent **Haiku**. Brief phải đủ ngữ cảnh: đường dẫn file, quy ước, tiêu chí chấp nhận — subagent không thấy hội thoại.

## 4. Nguyên tắc kỹ thuật bất biến

1. **Type safety:** TypeScript `strict` (đã bật), không `any`. Dữ liệu ngoài (API, form, CSDL) validate lúc chạy bằng **Zod** _(đang bổ sung dần — xem PROGRESS)_.
2. **Bảo mật:** không tin client; logic nhạy cảm (kiểm quyền, đếm lượt, gọi AI) luôn ở server (`api/`, `server.ts`); mọi handler API tự kiểm `user_id` khớp token qua `validateAuth()` trước khi query Postgres (thay Row Level Security cũ của Supabase); không lộ secret.
3. **Xử lý lỗi:** mọi thao tác có thể fail (mạng, CSDL, AI) đều có nhánh lỗi + trạng thái tải/rỗng/lỗi trên UI.
4. **Rõ ràng & DRY:** không lặp logic; hàm nhỏ làm một việc; tên tự giải thích; không "số/chuỗi ma thuật".
5. **Accessibility — LUẬT BẮT BUỘC (2026-08-04), theo khuyến nghị W3C:**
   - **Nội dung & tiêu đề** (chữ để đọc: `h1–h6`, `p`, `li`, bảng, blockquote…) phải đạt **WCAG AAA** — riêng tương phản là **≥ 7:1**.
   - **Mọi phần còn lại** (nav, nút, badge, ô nhập, biểu tượng…) phải đạt **AA** — sàn cứng, dung sai 0.
   - Lý do không ép AAA toàn site: W3C (_Understanding Conformance_) khuyến nghị KHÔNG lấy AAA làm chính sách cho toàn bộ site vì có nội dung không thể đạt hết AAA.
   - Gác tự động, **chặn CI**, cả hai cổng TUYỆT ĐỐI (không có baseline/ngoại lệ): `e2e/a11y.spec.ts` (A/AA — 0 vi phạm ở mọi mức tác động) + `e2e/a11y-aaa.spec.ts` (AAA cho nội dung/tiêu đề). Đều quét **15 trang × 3 theme hiện hành**. Kèm lint `jsx-a11y` (`jsxA11y.flatConfigs.recommended` trong `eslint.config.js` — bật THẬT từ 2026-09-05; trước đó tài liệu ghi có nhưng gói chưa từng được cài, audit toàn diện F1 phát hiện. Chuyển sang flat config 2026-09-22, đã kiểm luật còn bắt lỗi thật bằng file thử `<img>` thiếu `alt`).
   - Màu chữ lấy từ token `--z-*`/`--a-*` (`apps/dhcb/src/index.css`) — sửa tương phản thì **sửa token**, đừng vá từng chỗ. Lưu ý `text-white` map sang `--c-white` và **bị đảo thành màu tối ở theme nền sáng**: nền cố định tối (nút thương hiệu OAuth…) phải dùng `text-[#fff]`.
6. **Không bí mật trong code:** dùng biến môi trường; `.env` đã nằm trong `.gitignore`.
7. **Mobile-first & hiệu năng:** thiết kế màn nhỏ trước, vùng chạm ≥ 44px; hướng tới ngân sách Core Web Vitals (LCP ≤ 2.5s, INP ≤ 200ms, CLS ≤ 0.1) — Lighthouse CI _(đang bổ sung)_.
8. **Theme:** **3 theme, mặc định "Blue sky"**: hai theme tự chọn `blue-sky`/`dark-blue` và theme
   "Nhi đồng" (`kid`) khóa theo nhóm tuổi, tách khỏi cycle của `ThemeToggle` (chốt lại 2026-09-18,
   xem `packages/core-ui/theme.ts`); dùng design tokens qua
   biến CSS `--a-*` (`apps/dhcb/src/index.css` + `tailwind.config.js`), **không hard-code màu**;
   giữ màu ngữ nghĩa (xanh lá = "đúng", phân cấp A1–B2/loại từ). AA ở mọi theme.
9. **Chống lỗi logic:** type-checker không bắt lỗi nghiệp vụ — rà ca biên/rỗng, `null` vs 0, async race/idempotency, thời gian UTC, đếm lượt đúng; mỗi nhánh logic phức tạp có ≥ 1 test ca biên.

## 5. Chống "ảo giác" (bắt buộc)

- Không bịa hàm/thư viện/API — xác nhận tồn tại (đọc tài liệu/mã nguồn) trước khi dùng.
- Không giả định cấu trúc dự án — đọc file thật để biết tên, kiểu, cấu trúc hiện có. **AI tự xác định stack/phiên bản** bằng cách đọc repo — không hỏi người dùng điều đã có trong code.
- Không đoán kết quả lệnh — thực sự chạy và đọc output + exit code, ngay lúc đó, không dùng lại kết quả lần chạy trước.
- **Cờ đỏ:** sắp viết "chắc là / có lẽ / should work / về cơ bản đã xong" → nghĩa là CHƯA xác minh. Quay lại chạy lệnh chứng minh được điều mình định nói, rồi mới nói. Áp dụng cho mọi lời khẳng định, không riêng lúc commit. Bảng bằng chứng theo loại việc: KHUNG 2 mục "Bằng chứng trước khi báo xong".

## 6. Công nghệ (stack) & lệnh

- **Frontend:** React 18 + Vite 7 + TypeScript 5.2 (`strict`) + Tailwind CSS 3 (mã gốc do Lovable sinh ra).
- **Backend & dữ liệu:** Express (`server.ts`) + **PostgreSQL tự host trên VPS** (thư viện `pg`, `packages/core-db/pgPool.ts`) — đã rời hẳn Supabase (xem `docs/migration-thoat-ly-supabase.md`). Auth tự viết (Bearer token, `packages/core-auth/auth.ts` + `packages/core-auth/authService.ts`, email/password + Google Identity Services). Handler API trong `api/`.
- **AI:** gọi qua biến môi trường, ưu tiên model rẻ. Chat qua `/api/agent`. **STT** Whisper qua **Groq hoặc OpenAI** (`/api/stt`, tự chọn theo key). **TTS** Google Cloud qua `/api/tts` (audio cache **mã hóa AES-256-GCM**, lưu Cloudflare R2 qua `STORAGE_DRIVER=r2` trên production — `packages/core-ai/fileStorage.ts`; Web Speech API chỉ là fallback). **Chính sách cache TTS (chốt 2026-08-06): KHÔNG bao giờ tự xoá theo "lâu không dùng" (LRU) — cache `tts_cache`/`pronunciations` giữ vĩnh viễn, chỉ xoá bản ghi orphan (không còn nằm trong dữ liệu app) qua `npm run seed:all -- --verify --clean-orphans --yes`. Gần hết dung lượng R2 thì trả phí thêm, không xoá cache đang dùng. Xem `docs/migration-thoat-ly-supabase.md` mục 3.3.**
- **Gói dịch vụ (chốt GĐ1, 2026-09-12 — `docs/specs/2026-09-12-gd1-xoa-goi-pro.md`):** ĐÚNG **HAI** gói — `free` và `vip`. Gói `plus`/`pro` đã bị XOÁ (migration `0076`): người đang trả tiền còn hạn được nâng VIP giữ nguyên `plan_expires_at`, hết hạn thì về free. **Free hưởng hạn mức Plus cũ: 30 lượt AI/ngày** tính TỔNG mọi tính năng, cấu hình được ở `/admin` (lưu ở cột DB `app_settings.pro_daily_limit` — cột giữ TÊN cũ, ý nghĩa mới là "hạn mức Free"). VIP là gói trả phí duy nhất, bán qua SePay. Kiểu dữ liệu nguồn sự thật: `packages/core-billing/plan.ts`.
- **Deploy:** VPS Ubuntu (PM2 + Nginx + Let's Encrypt), đang chạy tại https://en-vi.donghanhcungban.org — xem `docs/deploy-vps-ubuntu.md`. `.com` là domain cũ/redirect.
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

- **Lệnh:** dev `npm run dev` · build `npm run build` · typecheck `npm run typecheck` (gộp cả `tsconfig.json` + `tsconfig.api.json` + `tsconfig.e2e.json`) · lint `npm run lint` (max-warnings 0) · format `npm run format` (Prettier — đang thêm ở bước khung) · test `npm test` (`vitest run`) · E2E `npm run test:e2e` (Playwright) · biên độ ngân sách `npm run budget` (in phần còn lại của size-limit + ngưỡng coverage, cảnh báo khi sắp cạn — cần `dist/` và `coverage/` đã có) · start `npm start` (`tsx apps/server/src/server.ts`) · migration Postgres tự host `npm run migrate:pg` (tự chạy trong `scripts/deploy.sh`, xem `postgres/migrations/README.md`).
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
- **Đặt tên:** component PascalCase (`apps/dhcb/src/components`), tiện ích camelCase
  (`apps/dhcb/src/lib`), prompt gửi AI để riêng trong `apps/dhcb/src/prompts/`.

## 7. Quy ước khi viết code & cách làm việc

- **Slash-command sẵn có (`.claude/commands/`):** `/gate` (cổng commit/merge + Báo cáo xác thực,
  mục 8-10) · `/debug` (chẩn đoán bug khó theo 6 pha có kỷ luật) · `/incident` (sự cố production —
  giảm thiệt hại trước, bám `docs/ke-hoach-khoi-phuc-su-co-server.md`) · `/consult` (tư vấn công
  nghệ research-first cho DHCB) · `/protocol` (in trạng thái một feature theo
  `AI_DEVELOPMENT_PROTOCOL.md`) · **thêm 2026-09-21 (áp từ `seeker19110/projects-template`):**
  `/adr` (tạo ADR — bản ghi quyết định kiến trúc khó đảo, xem `docs/adr/`) · `/contract` (chốt
  schema Postgres/API TRƯỚC khi code) · `/grill` (phỏng vấn dồn dập làm rõ ý tưởng trước khi
  hành động, kỹ thuật cụ thể cho mục 12 "dừng và hỏi") · `/review` (đọc-hiểu logic/thiết kế trước
  khi mở PR, khác `/gate` chỉ chạy máy). Dùng thay vì tự nhớ quy trình mỗi lần.
  7 file `.claude/agents/*.md` điều phối 3 tầng theo route độ phức tạp
  (`complex-implementer`/`coordinator`/`mechanical-worker`/`qa-verifier`/`reviewer`/
  `spec-executor`/`standard-worker` — xem `docs/framework/KIEN-TRUC-DIEU-PHOI-3-TANG.md`) +
  **3 subagent tiện ích thêm 2026-09-21** ngoài bảng route đó, gọi trực tiếp khi cần:
  `lookup` (tra cứu read-only, Haiku) · `version-check` (xác minh phiên bản qua nguồn sống,
  Haiku) · `security-reviewer` (rà bảo mật độc lập trên diff, Sonnet, dùng trong `/review`). Đây
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

- **Tra bản đồ code TRƯỚC khi sửa file dùng chung.** `npm run codemap` quét cả dự án (~9s) rồi:
  `-- impact <file>` (sửa file này gãy chỗ nào) · `-- callers <file>#<hàm>` (ai đang gọi hàm này) ·
  `-- hotspots` (file bị import nhiều nhất = rủi ro cao nhất) · `-- cycles` · `-- orphans`.
  Dùng nó thay cho việc đoán phạm vi ảnh hưởng. Code: `scripts/codemap.ts` + `scripts/lib/codemap.ts`.

- **Bài học môn Lập trình nạp lười theo unit (2026-09-01).** App KHÔNG import
  `@dhcb/subject-programming/lessons` (registry đồng bộ 3 MB — chỉ server/test/script dùng);
  giao diện dùng `@dhcb/subject-programming/lessonsLoader` (chỉ mục nhẹ `LESSON_INDEX` +
  `loadLesson`/`loadUnitLessons` nạp đúng unit). **Thêm/đổi bài học xong PHẢI chạy
  `npm run gen:lesson-index`** để sinh lại `lessonsLazy.ts`; quên thì `lessonsLazy.test.ts` đỏ
  với đúng câu nhắc đó.
- Code đơn giản, dễ đọc, **thêm comment tiếng Việt** ở chỗ quan trọng. Mỗi file/hàm làm 1 việc; tên biến tiếng Anh dễ hiểu.
- KHÔNG đưa API key/mật khẩu vào code — luôn dùng `.env`. Mọi lệnh gọi AI phải **đếm/giới hạn lượt** (Free vs VIP) tránh tốn tiền API.
- Trước khi sửa nhiều file hoặc đổi cấu trúc: **giải thích kế hoạch ngắn gọn rồi hỏi trước**. Mỗi thay đổi nhỏ, dễ kiểm tra; sau khi sửa nói rõ đã đổi gì + cách chạy thử.
- Gặp khái niệm mới: **giải thích cho người mới hiểu**. Ưu tiên giải pháp **miễn phí / chi phí thấp** (dự án vốn tối thiểu).
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

## 8. Cổng trước khi COMMIT (chạy và đạt hết)

Build `npm run build` · Type `npm run typecheck` · Lint `npm run lint` (0 cảnh báo) · Format `npm run format` _(sau khi thêm Prettier)_ · Test `npm test`. Ngoài ra: tự đọc lại diff (đúng mục tiêu, không sửa nhầm); xóa `console.log` debug/code chết; không bí mật trong code; mọi input đã validate; mọi thao tác có thể lỗi đã xử lý; commit message theo **conventional commits**. Nếu `git diff --stat` hiện `Bin` ở một file mã nguồn → file lẫn ký tự điều khiển (NUL…), diff thành nhị phân **không review được**: dùng escape (`\u0000`) thay vì gõ ký tự thật, rồi kiểm lại bằng `file <path>`.

**Từ 2026-09-19, hook PreToolUse `.claude/hooks/pre-commit-gate.sh` TỰ CHẶN `git commit` khi `typecheck`/`lint`/`test` đỏ** (không chạy `build` ở đây — quá chậm cho mỗi commit, vẫn bắt buộc ở CI job `build` + checklist merge). Bỏ qua có chủ đích: `git commit --no-verify`. Hook `.claude/hooks/block-dangerous-git.sh` cũng chặn cứng `reset --hard`/`clean -f`/`branch -D`/`checkout .`/`push --force`/`merge --abort` (thi hành mục 11 bằng máy, không chỉ bằng văn bản).

**Chống đặc tả "nói suông" (thêm 2026-09-19):** `npm run check:specs` (chạy trong CI job `audit`, chặn merge) kiểm mọi đường dẫn ở cột "Đường dẫn file" của đặc tả ĐÃ "Approved for implementation" (`docs/specs/*.md`) có tồn tại thật — xem `scripts/check-spec-paths.ts`.

**Rà câu chữ nội dung học (thêm 2026-09-21, `docs/changelog/0406`):** `npm run audit:prose` (`scripts/audit-prose.ts`) quét chính tả tiếng Việt sai chuẩn, từ lặp, dấu câu, tiếng Việt không dấu, TODO sót trong bài học/hội thoại/truyện/từ điển; `-- --ci` thoát 1 khi còn lỗi mức ✖ (chạy trong CI job `audit`). Nó chỉ bắt lớp lỗi máy nhìn được — phần "dễ hiểu / đúng sư phạm" vẫn phải người đọc tay theo khuôn rà 5 tiêu chuẩn ghi ở changelog 0406. **Sửa từ điển (`apps/dhcb/public/data/dictionary/chunk-*.json`) xong thì chạy `npx tsx scripts/archive/sync-vocab-from-dictionary.ts`** (đồng bộ nghĩa/ví dụ sang hai file vòng từ vựng mà KHÔNG xáo thành phần vòng), rồi `gen-curriculum-json.ts` + `gen-learn-json.ts` — chỉ sửa CHỮ thì KHÔNG chạy lại `gen-a1b2-extra-vocab.ts`/`gen-cefr-c1c2-vocab.ts` vì chúng xếp vòng theo nghĩa tiếng Việt, sẽ phá bộ câu mẫu viết tay theo id vòng. **Đổi BẬC hoặc thêm/xoá từ** thì buộc phải sinh lại vòng theo đúng thứ tự 5 bước ở `docs/audit/2026-09-15-sinh-lai-vong-theo-thang-bac.md` §2, rồi `npx tsx scripts/archive/reassign-circle-sentences.ts` gán lại câu mẫu cũ cho vòng mới (2026-09-22: cứu 208/239 câu) và viết tay phần nó báo còn thiếu. Bậc của nhãn KHÔNG có nguồn CEFR-J/Octanove phải tôn trọng sàn theo tần suất (`UNSOURCED_LEVEL_FLOORS`, cổng `packages/subject-english/dictionaryLevels.test.ts`; áp bằng `scripts/archive/relevel-unsourced-easy-words.ts`).

**Bảo trì định kỳ:** `npm run maintain` (`scripts/maintenance-sweep.sh`) quét tổng hợp git hygiene/dependency/tài liệu lỗi thời/bí mật lọt git/CI — chỉ đọc, không sửa; dùng khi rà soát định kỳ hoặc trước một đợt việc lớn.

**Công cụ phải khớp lockfile (bài học 2026-08-04, CI #475 đỏ).** Cổng chỉ đáng tin khi `node_modules` đúng `package-lock.json`. Dấu hiệu lệch: cổng local báo lỗi ở **nhiều file mình không hề đụng tới**, hoặc local xanh mà CI đỏ (và ngược lại). Gặp dấu hiệu đó → `npm ci` rồi chạy lại cổng, ĐỪNG đi sửa từng file theo báo lỗi giả. Trong container phiên mới, chạy `npm ci` trước lần chạy cổng đầu tiên. Kiểm nhanh: `npx prettier --version` khớp `package.json`.

**Cổng ở máy có thể XANH GIẢ — ba biến thể đã mắc thật, xem `TRAPS.md` mục 3 (2026-09-13, PR #893).** Tóm tắt cách chốt chặn: (1) thêm/xoá gói trong `packages/`/`apps/` thì phải `npm install` và commit `package-lock.json`, kiểm bằng `npm ci` trả về 0 — CI dùng `npm ci` nên lockfile lệch là giết MỌI job ở bước cài đặt; (2) trước lần push cuối, `rm -rf packages/*/dist dist dist-server` rồi chạy lại `npm run typecheck` để tái hiện checkout sạch của CI; (3) cổng test của CI là `npm run test:coverage` (có ngưỡng chặn), KHÔNG phải `npm test`.

**Đổi prompt hoặc model AI:** mọi PR sửa `apps/dhcb/src/prompts/*` hoặc `packages/core-ai/aiConfig.ts` (model/guardrail) PHẢI chạy lại `npm run eval:tutor` (cần key AI trong `.env`) và **dán bảng so sánh với `docs/research/eval-tutor-baseline.md` vào mô tả PR** — recall/precision không được tụt so với baseline. Xem `scripts/eval-tutor.ts`. **Môn Lập trình có prompt + eval RIÊNG** (nó không đi qua `/api/agent`): PR sửa `packages/subject-programming/feedbackPrompt.ts` PHẢI chạy lại `npm run eval:code-feedback` và dán kết quả vào mô tả PR — còn ca vi phạm bất biến (lộ lời giải · không phải tiếng Việt · gợi ý không có câu hỏi) là script thoát mã 1.

**Golden snapshot prompt (thêm 2026-09-12, học từ `seeker19110/claude-agents`):** `apps/dhcb/src/prompts/golden.test.ts` chụp lại nguyên văn chuỗi prompt của 9 hàm dựng prompt môn Anh (`__snapshots__/golden.test.ts.snap`). Nó **KHÔNG gọi AI**, chạy trong CI mọi PR, miễn phí — bắt đúng thứ `eval:tutor` không bắt được: prompt bị sửa **không chủ đích** (đổi chữ, đổi khoảng trắng, sửa nhầm khi refactor). Sửa prompt có chủ đích thì xem kỹ diff snapshot rồi cập nhật: `npx vitest run apps/dhcb/src/prompts/golden.test.ts -u`, commit cả `.snap`. **Snapshot KHÔNG thay thế `eval:tutor`** — vẫn phải chạy eval + dán bảng như trên; hai cổng bổ sung nhau (snapshot = đổi cái gì, eval = đổi có tốt lên không).

## 9. Cổng trước khi MERGE (thêm)

Đạt toàn bộ cổng commit · chạy TOÀN BỘ test (xanh) · nhánh đã cập nhật với nhánh chính, không xung đột · đối chiếu đủ tiêu chí chấp nhận (`PROJECT.md`) + Definition of Done · tự chạy smoke test luồng chính (thật) · rà bảo mật (quyền server, không lộ dữ liệu) · không phá tính năng khác (ghi rõ nếu có breaking change) · nếu đổi schema: có migration có phiên bản, rollback được.

"Không phá tính năng khác" phải **kiểm bằng công cụ, không bằng trí nhớ**: `npm run codemap -- impact <file>` cho từng file đã sửa → soát lại danh sách bị ảnh hưởng (mục 7). Nếu merge cục bộ: chạy lại test **trên kết quả đã merge**, không chỉ trên nhánh feature. Quyết định tích hợp (merge / tạo PR / giữ nguyên chờ) là của **người dùng** — AI trình bày lựa chọn, không tự chọn thay; chỉ xoá nhánh khi người dùng xác nhận rõ ràng. Chi tiết: KHUNG 2 mục "Hoàn tất một nhánh phát triển".

## 10. Báo cáo xác thực (xuất trước mỗi commit/merge)

```
Build ✅/❌ | Type ✅/❌ (lỗi:..) | Lint ✅/❌ (cảnh báo:..) | Format ✅/❌ | Test ✅/❌ (X/Y)
Tự review diff ✅ | Không bí mật/rác ✅ | Tiêu chí chấp nhận ✅ | DoD ✅
Rủi ro/ảnh hưởng: .. | Góp ý cải tiến: ..
KẾT LUẬN: Sẵn sàng  /  Cần xử lý: [..]
```

Bất kỳ mục ❌ → sửa trước, chạy lại toàn bộ, KHÔNG commit/merge.

## 11. Quy ước Git

Mỗi tính năng/sửa lỗi một nhánh · commit nhỏ, một thay đổi logic · **conventional commits** (`feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `style`, `perf`) · mọi merge vào `main` qua PR · **không push thẳng `main`**.

**Mục tiêu duy nhất: CI xanh là PR vào `main`, không cần người dùng bấm.** Nhánh `main` có branch protection với 3 required check `quality` · `e2e` · `metadata`, nên auto-merge/merge tay khi xanh là an toàn. **Cấm: merge tay để đi tắt khi CI CHƯA xanh.**

**BỐN BƯỚC BẮT BUỘC KHI TẠO PR — làm liền một mạch, không hỏi giữa chừng:**

1. **Kiểm TIÊU ĐỀ + MÔ TẢ khớp cổng `metadata` TRƯỚC khi tạo** (cổng chạy ~4 giây, đỏ là PR không vào được `main`). Regex thật ở `.github/workflows/pr-policy.yml`:

   ```
   ^(feat|fix|refactor|docs|test|chore|style|perf|build|ci|revert)(\([a-z0-9._/-]+\))?!?: .+
   ```

   - Scope chỉ nhận **chữ thường** (`fix(kotlinSim)` trượt, `fix(programming)` đạt).
   - Mô tả PR **phải có đủ 6 tiêu đề** khớp từng chữ: `## Tóm tắt` · `## Issue / outcome` · `## Research / spec` · `## Validation` · `## Rủi ro, rollout và rollback` · `## Definition of Done`.
   - Tiêu đề `feat(`/`feat:` còn cần mô tả chứa đường dẫn `docs/specs/YYYY-MM-DD-slug.md` hoặc `docs/research/<slug>.md` **tồn tại thật trong nhánh** + cụm "Approved for implementation". Việc không có đặc tả trước (tái cấu trúc UI theo yêu cầu trong phiên…) thì dùng `refactor`/`style`/`chore` cho đúng bản chất.

2. **Tạo PR ở trạng thái READY**, không bao giờ nháp.
3. **Gọi bật auto-merge (squash) ĐÚNG MỘT LẦN, NGAY trong vài giây sau lệnh tạo PR.** Đo 2026-09-06: #867 gọi ngay → **bật được**; #865 gọi sau khi `metadata` xanh → "clean status"; #866 gọi khi check đang chạy → "unstable". Cửa sổ chỉ vài giây. Trượt cửa sổ thì GitHub từ chối ở cả lúc CI đang chạy ("unstable status — required checks are failing" là cách nói trạng thái `unstable`, KHÔNG có nghĩa là có check đỏ) lẫn lúc CI xong ("already in clean status"). **Đừng chẩn đoán, đừng gọi lại.** Thất bại thì theo dõi CI; **xanh cả 3 check + không xung đột → tự merge (squash) NGAY** (quy ước người dùng 2026-08-28).
4. **Chỉ gộp `main` khi THẬT SỰ CẦN:** GitHub báo xung đột (`mergeable_state: dirty`), hoặc `main` vừa đổi đúng file/luồng PR này đụng. Repo đã TẮT "require branches up to date" (2026-08-27) nên nhánh tụt sau `main` không chặn merge. Merge SẠCH thì không chạy lại cổng ở máy (CI đã chạy trên kết quả gộp); merge CÓ xung đột / chạm file chung → chạy lại đủ cổng (mục 9) trước khi push.

**PR mình tạo là PR của mình:** CI đỏ → đọc log, tái hiện ở máy, sửa, push tới khi xanh. Không để PR nằm đỏ chờ người dùng.

Lịch sử vì sao có từng luật trên (PR #693/#709/#724/#726/#727): `docs/legacy/claude-md-lich-su-quy-uoc.md`.

## 11.1. Quy ước CI (chốt 2026-08-27, PR #713 + #714)

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

## 12. Khi nào PHẢI dừng và hỏi

Yêu cầu mơ hồ / nhiều cách hiểu · thao tác không thể hoàn tác (xóa dữ liệu, đổi schema phá vỡ) · mâu thuẫn với code/thiết kế hiện có · breaking change ảnh hưởng nhiều nơi · nhiều giải pháp đánh đổi khác nhau đáng kể · đụng bảo mật, thanh toán, dữ liệu người dùng thật.

## 13. Trạng thái hiện tại

**Nguồn duy nhất: `PROGRESS.md`** (giai đoạn · tiếp theo · việc cần làm tay · quyết định · nợ mở). Hook đầu phiên `.claude/report-status.sh` in sẵn 3 đợt gần nhất + nợ mở. Bản đồ tài liệu nào còn hiệu lực: `docs/README.md`. Bản mô tả trạng thái dài từng nằm ở đây (cập nhật tới 2026-09-01) đã dời sang `docs/legacy/claude-md-lich-su-quy-uoc.md`.

Tóm tắt một dòng (2026-09-06): app nền tảng chạy thật tại `donghanhcungban.org` · môn Anh A1→C2 hai chiều A/B, 3 chế độ, TTS/STT thật · môn Lập trình P1–P6 + 14 hướng + khoá ngắn + lộ trình mục tiêu · trụ Ghi chú (`/ghi-chu`, tên cũ "Công việc"; ba trụ Sự nghiệp/Khởi nghiệp/Đời sống gỡ hẳn 2026-09-20) · thanh toán SePay · Postgres tự host + Redis + R2, backup đã kiểm chứng · cổng CI: build/type/lint/format/test coverage sàn stmts/branches/funcs/lines 93/89/93/93/E2E a11y AA+AAA.
