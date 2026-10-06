---
name: ui-ux
description: 'Quy chuẩn thiết kế UI/UX đỉnh cao và quy trình triển khai giao diện cho Đồng Hành (Personal AI Companion & English Tutor). Bắt buộc kích hoạt khi tạo mới, thiết kế, review hoặc sửa đổi bất kỳ trang (page), layout, modal, form, audio/voice widget, quiz, flashcard, dashboard hay component nào.'
---

# UI/UX — QUY CHUẨN THIẾT KẾ & GIAO DIỆN ĐỒNG HÀNH

Bộ Skill này đóng gói toàn bộ tri thức thiết kế UI/UX hiện đại, tâm lý học học tập (learning ergonomics), hiệu ứng chuyển động mượt mà 60 FPS, chuẩn khả năng tiếp cận (W3C WCAG 2.2 AAA/AA) và quy trình triển khai giao diện cho hệ sinh thái Đồng Hành.

---

## 1. QUY TRÌNH 5 BƯỚC TRIỂN KHAI KHI CODE GIAO DIỆN MỚI

Mọi thay đổi giao diện trong `apps/dhcb/src/**` và `apps/hub/src/**` đều phải tuân thủ 5 bước tuần tự.
Trước B1, đọc `docs/ui-ux/decision-contract.json` và profile app tương ứng trong
`docs/ui-ux/apps/`.

```
[B1: Bối cảnh & Phân loại] ──► [B2: Thiết kế Tokens & Bố cục] ──► [B3: Đủ 5 Trạng thái] ──► [B4: Micro-Interactions] ──► [B5: Verification Gate]
```

### Phân loại theo 4 studio THẬT của Bạn Đồng Hành

Đối chiếu mã ngày 2026-10-02. Danh sách tab: `STUDIO_TABS_CONFIG` ở
`apps/dhcb/src/components/CompanionStudios/studioTypes.ts`. Khi skill này và mã lệch nhau, **MÃ
thắng** — sửa skill, đừng thiết kế theo skill.

1. **Trò chuyện** (`StudioDialogue.tsx`) — chat + voice thời gian thực:
   - CyberTutor Avatar (`apps/dhcb/src/components/Companion3D/CyberTutorAvatar3D.tsx`) — thực
     tế hiện là **Canvas 2D** (`canvas.getContext('2d')`), KHÔNG phải WebGL/PBR lighting như tên
     gọi "3D" gợi ý; có dải viseme 15 trạng thái. Nâng lên WebGL thật (three.js/PBR/gaze
     tracking) là việc CHƯA làm, cần quyết định riêng trước khi đầu tư.
   - Trạng thái voice (`CompanionLiveOrb`): `Idle` → `Listening` (sóng âm) → `Thinking` (glow)
     → `Speaking`. Trạng thái phải hiểu được cả khi chuyển động bị tắt (mục 11.E).
2. **Ghi nhớ** (`StudioCognitive.tsx`) — nhật ký phản tỉnh (`MetacognitiveJournalCard`), Cung điện
   trí nhớ (`MemoryPalaceCard`), `SubconsciousInsightsCard`, `SocraticDiagnosticsCard`.
3. **Thử thách** (`StudioLabs.tsx`) — gamification + lab:
   - `PvPArenaCard` + `PvPBattlefieldModal.tsx` (thanh máu kép, đồng hồ đếm ngược, combo streak).
   - `DebateArenaCard` (tranh biện).
   - `StemScratchpadCard` — bảng nháp STEM. **Bộ kiểm chỉ nhận ra vài lỗi cụ thể và đáp số của 3 đề
     mẫu**; bước khác hiện "? Chưa tự kiểm được" (changelog 0473). Đừng thiết kế UI hứa "kiểm tra
     hợp lệ đại số/hoá học tức thì".
   - Lab phát âm: `ArticulatoryPhoneticsVisualizer`, `PronunciationHintsCard` (gợi ý, không điểm), `EchoShadowingCard` (3 pha, không điểm),
     `ScenarioHolodeckCard`.
4. **Kế hoạch** (`StudioProactive.tsx`) — nudge 1-chạm (`ProactiveNudgeBanner`), `GoalAutoPilotCard`,
   `NeuralMicroCurriculumCard` và các thẻ đón đầu; cuối studio là `ActionCanvasBanner` (lối vào
   DUY NHẤT của `/action-canvas`).

**Đã GỠ — đừng thiết kế lại khi chưa có quyết định mới:** studio "Tổng kết" / Life Synthesis
(bảng 5 miền Learning · Career · Work · Startup · Life hiện điểm BỊA, changelog 0475; ba trụ
Career · Startup · Life đã xoá 2026-09-20) và thẻ "Studio Điều Phối Agent Tự Trị" (hiện phiên agent
DỰNG SẴN như đã chạy thật, changelog 0481).

**CHƯA CÓ trong mã** (bản cũ của skill từng mô tả như đã có): trình tạo ảnh "Story Canvas" chia
sẻ Zalo/FB/Telegram (`ViralShareCardGenerator.tsx`).

---

## 2. QUY CHUẨN DESIGN TOKENS & KHẢ NĂNG TIẾP CẬN (WCAG 2.2 AAA / AA)

### A. Quy chuẩn Tương phản Tuyệt đối (W3C Standard)

- **Nội dung văn bản & Tiêu đề (Text & Headings):** BẮT BUỘC đạt chuẩn **WCAG AAA** (Độ tương phản $\ge 7:1$).
- **Giao diện Tương tác & Nút bấm (Interactive Controls & Icons):** BẮT BUỘC đạt chuẩn **WCAG AA** (Độ tương phản $\ge 4.5:1$).
- **Vùng Chạm Mobile (Touch Target):** Tối thiểu $\ge 44 \times 44\text{px}$ cho tất cả nút bấm và vùng tương tác.

### B. Tuân thủ Design Tokens & Không Hardcode Màu

- **Thang Nền / Viền / Chữ Semantic:**
  - Nền & Thẻ: `bg-zinc-950`, `bg-zinc-900`, `bg-zinc-900/80`, `border-zinc-800`, `border-zinc-700`.
  - Chữ: `text-zinc-100` (đọc chính), `text-zinc-300`, `text-zinc-400` (phụ trợ).
  - Điểm nhấn Thương hiệu: `bg-accent-500`, `text-accent-400`, `border-accent-500/30`.
- **CẤM:** Tuyệt đối không hardcode mã màu hex `#...` trong các component giao diện (trừ trường hợp màu trắng cố định của nút bên thứ ba `text-[#fff]`).

---

## 3. ĐẢM BẢO ĐẦY ĐỦ 5 TRẠNG THÁI BẮT BUỘC (THE 5 STATES)

Mọi màn hình hoặc component có tương tác/tải dữ liệu phải xử lý trọn vẹn:

1. **Initial / Empty State:** Khi chưa có dữ liệu/tin nhắn: Icon sinh động + Lời chào ấm áp + Gợi ý bắt đầu (Prompt Starters / Topic Suggestions).
2. **Loading / Skeleton State:** Khung xương tải mờ (`animate-pulse`) khớp chính xác kích thước thật, triệt tiêu hoàn toàn giật bố cục (CLS < 0.1).
3. **Data Loaded State:** Hiển thị dữ liệu trọn vẹn, căn chỉnh lề chuẩn mực, typography sắc nét.
4. **Error / Offline State:** Thông báo lỗi thân thiện kèm nguyên nhân + Nút "Thử lại ngay" (Retry Action) + Chế độ hoạt động Offline dự phòng.
5. **Validation Feedback:** Phản hồi tức thì khi người dùng nhập liệu hoặc thực hiện hành động (Badge, âm thanh nhẹ, toast notification).

---

## 4. VI TƯƠNG TÁC & HIỆU ỨNG VẬT LÝ (MICRO-INTERACTIONS & MOTION)

- **Nút bấm & Card tương tác:** Đầy đủ `hover:border-accent-500/50`, `active:scale-[0.98]`, viền focus mặc định của `index.css` (outline màu token `--focus-ring`, đạt ≥ 3:1 ở cả 3 theme — cổng `themeContrast.test.ts`; **đừng** tự đặt `ring-accent-500`, ở Blue sky/Nhi đồng nó chỉ 2,65–2,70:1, audit 2026-09-30 C1), `disabled:opacity-50 disabled:pointer-events-none`.
- **Chuyển động (Motion Ergonomics):** Chỉ transition đúng thuộc tính có ý nghĩa (`transition-colors`, `transition-transform`, `transition-opacity`); tránh `transition-all`. Motion phải interruptible và có nhánh `motion-reduce:` khi phù hợp. Số `transition-all` toàn kho chỉ được GIẢM (mốc + cổng: `apps/dhcb/src/pages/core/DesignSystem.design.test.ts`); luật `:focus-visible` ngoài `@layer` trong `index.css` giữ viền lấy nét hiện tức thì cả ở chỗ cũ (changelog 0500).
- **Nút & thẻ (changelog 0500, audit M17):** nút lấy class từ `buttonClass()` (`packages/core-ui/buttonStyles.ts`) — bộ chuẩn `primary` (accent, MỘT nút mỗi màn) · `secondary` · `outline` (viền, trung tính) · `danger`; `ghost` chỉ cho nút dạng chữ. Đừng tự ghép nền `blue-*`/`rose-*`/`amber-*` cho nút hành động. Tiêu đề mục/thẻ nổi bật lấy từ `packages/core-ui/cardStyles.ts` (tiêu đề MỤC phải lớn hơn tiêu đề thẻ nằm trong nó); hàng hành động trong lưới thẻ đẩy xuống đáy (`flex flex-col` + `mt-auto`) cho thẳng hàng. Nội dung dài đọc-khi-cần dùng khối gập `apps/dhcb/src/components/Disclosure.tsx`.
- **A11y:** Mọi nút Icon-only phải có `aria-label` và `title` rõ nghĩa cho Screen Readers.

---

## 5. TÀI LIỆU DESIGN.md — 8 MỤC CHUẨN THAM KHẢO (nghiên cứu từ VoltAgent/awesome-design-md)

Kho `VoltAgent/awesome-design-md` tổng hợp 73 file `DESIGN.md` — tài liệu hệ thống thiết kế dạng
văn bản thuần (khởi xướng bởi Google Stitch) để AI agent đọc và sinh giao diện nhất quán, thay
vì phải parse Figma/JSON. Bổ sung skill này bằng **8 mục chuẩn** làm khung tự kiểm khi thiết kế
màn hình mới cho DHCB — không tạo file `DESIGN.md` riêng (dự án đã có `index.css` +
`tailwind.config.js` làm nguồn sự thật), mà dùng làm CHECKLIST khi review:

1. **Sắc thái & Tâm trạng thị giác (Visual Theme & Atmosphere):** mỗi theme trong 3 theme hiện hành
   (☀️ Blue sky mặc định · 🌙 Xanh đêm · 🧒 Nhi đồng) phải giữ đúng "mood" của nó — độ
   đậm nhạt nền, mật độ thông tin, không trộn phong cách giữa các theme khi thêm component mới.
2. **Bảng màu & Vai trò (Color Palette & Roles):** đã có ở mục 2 (design tokens `--a-*`/`--z-*`,
   không hardcode hex). Bổ sung: khi thêm màu ngữ nghĩa MỚI (không phải accent/zinc có sẵn), phải
   đặt tên vai trò rõ ràng (`--c-success`, `--c-danger`…) trong `index.css`, không chèn hex rời.
3. **Quy tắc Typography — bảng phân cấp đầy đủ:** dự án chưa có bảng phân cấp chính thức — khi
   thêm màn hình mới, khai rõ heading dùng cỡ nào theo thang Tailwind hiện có
   (`text-2xl font-bold` cho `h1`, `text-xl font-semibold` cho `h2`, `text-base` cho thân bài,
   `text-sm`/`text-xs` cho phụ trợ — sàn 11px tuyệt đối theo mục 2), tránh mỗi trang tự chế một
   cỡ chữ khác nhau cho cùng cấp tiêu đề.
4. **Component Stylings kèm biến thể trạng thái:** khi định nghĩa 1 component tái dùng (nút, thẻ,
   input, nav item), liệt kê ĐỦ biến thể trong cùng 1 chỗ — mặc định/hover/active/focus/disabled
   (đã có ở mục 4) — **VÀ** kích thước (sm/md/lg nếu có nhiều nơi dùng), không rải rác định nghĩa
   lại cùng component ở nhiều file.
5. **Nguyên tắc Bố cục — thang khoảng cách (Layout Principles & Spacing Scale):** dùng thang
   spacing gốc của Tailwind (`gap-2/3/4/6/8`…), KHÔNG tự chế giá trị `px` tuỳ ý; card/section
   cách nhau tối thiểu `gap-4` trên mobile, `gap-6` trở lên trên desktop.
6. **Chiều sâu & Phân lớp (Depth & Elevation — mục còn thiếu trước bản V7.0 này):** dự án dùng
   3 cấp bề mặt rõ rệt qua nền + viền (KHÔNG dùng shadow nặng gây rối mắt trên nền tối):
   cấp nền trang (`bg-zinc-950`) → cấp thẻ/card (`bg-zinc-900` + `border-zinc-800`) → cấp nổi
   (modal/dropdown/toast: `bg-zinc-900/95` + `border-zinc-700` + `backdrop-blur` nếu che nội dung
   phía sau). Modal/toast luôn có lớp phủ nền `bg-black/60` phía sau để tách bạch cấp.
7. **Do's and Don'ts (rào chắn thiết kế) — chốt lại các luật đã có rải rác:**
   - ✅ Dùng token, không hardcode hex · ✅ Đủ 5 trạng thái (mục 3) · ✅ Vùng chạm ≥44px ·
     ✅ Giữ màu ngữ nghĩa nhất quán (xanh lá = "đúng", đỏ = lỗi) · ✅ Tương phản AAA cho nội
     dung/tiêu đề, AA cho phần còn lại.
   - ❌ Không thêm shadow đậm/gradient loè loẹt phá vỡ "mood" theme tối · ❌ Không tự chế cỡ chữ/
     khoảng cách ngoài thang chuẩn · ❌ Không để icon-only thiếu `aria-label` · ❌ Không copy y
     nguyên phong cách "retro web"/trang ngoài vào DHCB — mọi component mới phải khớp 1 trong 3
     theme sẵn có, không du nhập phong cách rời rạc.
8. **Hành vi Responsive (mục còn thiếu trước bản V7.0 này) — breakpoint & chiến lược:** mobile-
   first tuyệt đối (mục 4, KHUNG bất biến #7): thiết kế cho màn hẹp nhất trước, dùng breakpoint
   Tailwind mặc định `sm(640) / md(768) / lg(1024) / xl(1280)`; nav/menu chuyển từ dạng tab dưới
   (mobile) sang sidebar/topbar (từ `md` trở lên — xem `apps/dhcb/src/components` nav desktop vs
   mobile hiện có); bảng dữ liệu rộng trên mobile phải có phương án cuộn ngang hoặc rút gọn cột,
   không được tràn layout.

**Ghi chú nguồn:** áp dụng như checklist tư duy, KHÔNG sinh file `DESIGN.md`/`preview.html` mới
trong repo — DHCB đã có nguồn sự thật token riêng (`apps/dhcb/src/index.css` +
`tailwind.config.js` + `packages/core-ui/theme.ts`), tránh hai nguồn song song gây lệch.

---

## 9. RÀO CHẮN CHỐNG "UI DO AI SINH" — 9 LUẬT (chắt lọc 2026-09-03)

**Nguồn:** đọc toàn bộ 61 luật của `pbakaus/impeccable`
(file `pbakaus/impeccable:scripts/detector/registry/antipatterns.mjs` của repo ngoài, Apache 2.0) rồi **đối chiếu bằng grep trên
`apps/`** để chỉ giữ luật có bằng chứng chạm dự án. **KHÔNG cài công cụ đó vào repo** (nó cài
hook + `.impeccable/config.json` + đòi file `DESIGN.md` riêng — dựng nguồn sự thật thứ hai, trái
ghi chú mục 5). Chỉ nhập tri thức, diễn đạt lại bằng token và quy ước của DHCB.

52 luật còn lại bị **loại có lý do** — đừng bàn lại: nhóm copywriting landing page SaaS tiếng
Anh (buzzword, em-dash, kicker hero, cream palette…) không áp được cho app học tiếng Việt; nhóm
tương phản/cấp tiêu đề/cỡ chữ đã có cổng `e2e/a11y.spec.ts` + `a11y-aaa.spec.ts` + `jsx-a11y`
bắt rồi, nhập vào là dựng cổng thứ hai cho cùng một việc; luật "bỏ font Inter" bị loại vì đổi
font toàn app đánh đổi CLS + bundle + chạy lại 2 cổng a11y × 15 trang × 3 theme để lấy "cá
tính" — không đáng.

### A. Bốn luật MỚI (lấp lỗ hổng V7.0 chưa nói tới)

1. **Độ dài dòng đọc ≤ ~75ch.** Mọi khối văn xuôi dài (bài học, giải thích ngữ pháp, mô tả năng
   lực, nhật ký) phải có `max-w-prose` hoặc `max-w-[70ch]`. Dòng dài quá ~80 ký tự làm mắt lạc
   dòng khi quay về đầu dòng sau — với app mà **đọc hiểu là công việc chính**, đây là lỗi trải
   nghiệm học, không phải chuyện thẩm mỹ. Đo 2026-09-03: cả `apps/` chỉ có **2** chỗ giới hạn
   độ dài dòng.
2. **Nhịp tiêu đề: khoảng trống TRÊN tiêu đề phải LỚN HƠN khoảng dưới nó.** Tiêu đề thuộc về
   phần nội dung nó mở ra. Khi khoảng trên bằng hoặc nhỏ hơn khoảng dưới, mỗi mục đọc như đang
   chú thích cho mục TRƯỚC nó — đây là nguyên nhân của cảm giác "các mục dính vào nhau" mà
   thang `gap-*` ở mục 5 không giải thích được.
3. **Chiều cao dòng thân bài 1.5–1.7** (`leading-relaxed`). Dưới 1.3 là chữ nhiều dòng khó đọc.
4. **KHÔNG lồng thẻ trong thẻ.** Hệ quả trực tiếp của 3 cấp bề mặt ở mục 6: phân tách bằng
   khoảng cách, đường kẻ và phân cấp chữ, không bằng cách bọc thêm một `border` + `bg` nữa.

### B. Ba luật SIẾT LẠI cái đã có

5. **Bóng phát sáng màu chỉ dùng khi có nghĩa.** `shadow-<màu>/xx` và `radial-gradient` quầng
   sáng là dấu hiệu dễ nhận nhất của UI do AI sinh, và nền tối của DHCB dính nặng nhất
   (đo 2026-09-03: **~70+ chỗ** dùng `shadow-accent-500/*`, `shadow-violet-*`, `shadow-cyan-*`).
   Độ nổi mặc định lấy theo **3 cấp bề mặt ở mục 6** (nền + viền). Bóng màu chỉ hợp lệ khi mang
   nghĩa trạng thái — đang ghi âm, đang được chọn, tiêu điểm bàn phím. **Không thêm mới** ngoài
   các ca đó; chỗ cũ gỡ dần khi đụng tới, không mở đợt quét riêng.
6. **Pulse chỉ dành cho thứ ĐANG THAY ĐỔI THẬT.** `animate-pulse` hợp lệ cho skeleton tải (mục
   3.2) và cho trạng thái sống thật của Companion (đang nghe / đang nghĩ / đang nói). Nhãn
   trạng thái tĩnh thì để tĩnh — nhấp nháy trang trí vừa là "tell", vừa tốn pin, vừa là thứ
   `prefers-reduced-motion` phải tắt. Đo 2026-09-03: **29 file** dùng `animate-pulse`.
7. **11px là SÀN TUYỆT ĐỐI, không phải cỡ mặc định cho chữ phụ trợ.** Đo 2026-09-03: **560**
   chỗ dùng đúng `text-[11px]` — dự án đang sống sát mép sàn. Chữ có chức năng (link, nút, nav,
   nhãn, ô bảng) mặc định nên là `text-sm`; hạ xuống 11px phải có lý do chật chỗ thật.

### C. Hai luật kỹ thuật

8. **Chỉ animate `transform` và `opacity`** (và `grid-template-rows` khi cần mở/đóng chiều cao).
   Animate `width`/`height`/`padding`/`margin` gây layout thrash — phá thẳng cam kết 60 FPS và
   ngân sách CLS < 0.1 ở mục 3.2.
9. **Nhãn HOA nhỏ giãn chữ đặt riêng một dòng trên tiêu đề (kicker/eyebrow): KHÔNG THÊM MỚI.**
   Tiêu đề tự đủ sức nặng; chữ trong nhãn đó nếu quan trọng thì đưa vào chính tiêu đề hoặc câu
   mở. Đo 2026-09-03: **54 file** đang có mẫu này — chưa gỡ, chỉ chặn không sinh thêm.

> **Đã chốt 2026-09-03 và xác nhận lại 2026-09-18 (người dùng quyết) — ĐỪNG mở lại cuộc bàn này.** Đợt đối chiếu đo được
> **~4.141 lần** dùng màu Tailwind gốc trong `apps/` (`amber` 763 · `emerald` 700 · `rose` 480 ·
> `sky` 328 · `indigo` 277…). Câu hỏi "có nên token hoá hết không" đã có câu trả lời: **KHÔNG.**
> Đổi thì chạm >4.000 chỗ với rủi ro thị giác thật, mà lý do an toàn đã không còn — PR #842 đã
> vá 720 chỗ rớt tương phản ở 3 theme nền sáng và thêm cổng
> `scripts/fixed-color-contrast-audit.test.ts` đo mọi màu cứng dùng làm màu chữ trên cả 3 theme hiện hành.
>
> **Luật thi hành khi viết code mới:** dùng màu Tailwind cố định làm màu chữ thì **phải kèm
> `theme-light:text-<họ>-800/900` ngay từ đầu** — thang `zinc`/`accent`/`content` tự đảo ở theme
> nền sáng, màu Tailwind gốc thì không. Quên thì cổng trên đỏ và chỉ luôn cách vá. Bậc chọn theo
> luật lịch sử "bậc sáng nhất đạt AAA trên 3 theme sáng tại thời điểm audit" (nay còn 2 theme sáng
> `blue-sky`/`kid`): `slate-700` · `blue/indigo/violet/purple-800`
> · còn lại `-900`.

---

## 10. NHẬP TRI THỨC TỪ `Nutlope/hallmark` — 6 LUẬT + KHUÔN BÁO CÁO AUDIT (2026-09-05)

**Nguồn:** `Nutlope/hallmark` (Together AI, MIT) — skill "chống UI kiểu AI": `skills/hallmark/SKILL.md`
(67 KB) + ~130 file `references/`, trong đó `references/slop-test.md` là **57 gate + tự phê bình 6
trục** và `references/verbs/audit.md` là khuôn rà soát.

**KHÔNG cài công cụ đó vào repo** (`npx skills add nutlope/hallmark`) — nó sinh **landing page
HTML/CSS thuần một file**, kèm 21 theme + 21 macrostructure + `design.md` riêng. DHCB là React +
Tailwind + 3 theme + token `--a-*`/`--z-*`, đã có nguồn sự thật riêng (`apps/dhcb/src/index.css` +
`tailwind.config.js` + `packages/core-ui/theme.ts`). Cài vào là dựng nguồn sự thật thứ hai — đúng
lý do đã từ chối `pbakaus/impeccable` ở mục 9. **Chỉ nhập tri thức, diễn đạt lại bằng token và quy
ước DHCB.**

**Phần bị LOẠI có lý do — đừng bàn lại:** 21 theme + 21 macrostructure + catalog fingerprint
nav/hero/footer (DHCB là APP có điều hướng cố định, không phải trang tiếp thị đổi bố cục mỗi lần
sinh); nhóm copywriting landing page SaaS tiếng Anh (gate 46 số liệu bịa, gate 20–21 dấu triện
macrostructure); nhóm tương phản/typography/prose-width/không-lồng-thẻ/không-animate-layout/token
(gate 22–27, 37–41, 48) đã có ở mục 2 · 6 · 9 của skill này **và** đã có cổng chặn CI
(`e2e/a11y.spec.ts`, `e2e/a11y-aaa.spec.ts`, `scripts/fixed-color-contrast-audit.test.ts`,
`jsx-a11y`) — nhập vào là dựng cổng thứ hai cho cùng một việc.

### A. Sáu luật MỚI (đều có bằng chứng đo trên `apps/` ngày 2026-09-05)

1. **Cấm `transition-all` — khai đúng thuộc tính cần chuyển động.** `transition-all` bắt trình
   duyệt theo dõi mọi thuộc tính đổi được, kể cả thuộc tính gây layout, nên nó vừa phá cam kết
   60 FPS ở mục 4 vừa sinh chuyển động ngoài ý muốn khi component đổi lớp. Viết
   `transition-colors` / `transition-transform` / `transition-opacity` (kèm `duration-200
ease-out` như cũ). Đo được **197** chỗ `transition-all` — **không mở đợt quét sửa**, chỗ cũ
   gỡ dần khi đụng tới; luật áp cho code MỚI.
2. **Không dùng chung một `hover:scale-*` cho mọi thứ không liên quan.** Phóng to khi rê chuột
   là tín hiệu "cái này bấm được và là hành động chính"; rải đều lên thẻ, badge, icon, hàng danh
   sách thì tín hiệu mất nghĩa và trang rung khi lướt. Mỗi màn hình giữ tối đa một cấp phần tử
   dùng `scale`; phần còn lại phản hồi bằng viền/nền như mục 4. Đo được **56** chỗ.
3. **Mọi `transform`/`animation` phải có nhánh `prefers-reduced-motion: reduce`.** Đây là lỗ
   hổng thật, không phải chuyện thẩm mỹ: chỉ **5 file** trong `apps/` có nhánh này, trong khi
   mục 9.6 đã ngầm hứa "thứ `prefers-reduced-motion` phải tắt". Dùng biến thể `motion-reduce:`
   của Tailwind (`motion-reduce:transform-none motion-reduce:animate-none`) ngay tại chỗ khai
   hiệu ứng, không gom vào một chỗ khác.
4. **Focus ring hiện TỨC THÌ, và viền ô nhập KHÔNG đổi độ dày giữa các trạng thái.** Ring có
   `transition` là ring đến trễ — người dùng bàn phím mất dấu vị trí. Đổi trạng thái ô nhập
   bằng `outline` / màu viền / nền, **giữ nguyên `border-width`**: tăng viền 1px→2px khi focus
   làm nội dung xê dịch 1px, đây là nguồn "giật nhẹ khó truy" của các form dài.
5. **Ô nhập chừa sẵn chỗ cho dòng lỗi.** Khối phản hồi validate (mục 3.5) phải chiếm chỗ ngay
   cả khi rỗng (`min-h-[1lh]` hoặc khối ẩn `invisible` chứ không phải `hidden`), nếu không mỗi
   lần hiện lỗi là cả form bị đẩy xuống — vi phạm ngân sách CLS < 0.1 ở mục 3.2 đúng lúc người
   dùng đang cần đọc kỹ nhất.
6. **Không toast báo thành công cho việc ĐÃ THẤY BẰNG MẮT.** Xoá một mục mà mục đó biến mất khỏi
   danh sách, gạt công tắc mà công tắc đã đổi vị trí — thêm toast là nhiễu. Toast dành cho việc
   xảy ra ngoài tầm nhìn (đồng bộ nền, gửi thư tuần, lưu lên máy chủ) và cho **mọi** trạng thái
   lỗi. Luật này là rào chắn cho phần gamification (studio Thử thách, mục 1.3), nơi dễ thêm
   phản hồi ăn mừng chồng lên nhau nhất.

### B. Khuôn BÁO CÁO khi rà soát UI (lấy từ `references/verbs/audit.md`)

Skill này có đủ luật nhưng chưa có **khuôn đầu ra**, nên ba đợt rà UI gần nhất
(`docs/changelog/0206`, `0207`, `0208`) mỗi đợt tự chế một định dạng khác nhau — không so sánh
được giữa các đợt, không biết đợt sau có sót lại lỗi của đợt trước không. Từ nay mọi lượt rà
UI/UX ghi mỗi phát hiện đúng **4 ô**:

- **Lỗi** — tên luật bị phạm (dẫn số mục của skill này, vd "mục 10.A.1").
- **Ở đâu** — `đường/dẫn/file.tsx:dòng`.
- **Mức** — `critical` / `major` / `minor`.
- **Sửa** — đúng một dòng, nói cách sửa cụ thể chứ không nói lại lỗi.

Nhóm theo mức, `critical` trước, kết bằng dòng đếm `N critical · M major · K minor`.

Thang mức, hiệu chỉnh cho DHCB:

- **critical** — chặn người dùng hoặc phá cổng đã có: rớt tương phản, thiếu `aria-label` ở nút
  icon-only, vùng chạm < 44px, tràn layout ngang, mất dấu tiêu điểm bàn phím, thiếu trạng thái
  lỗi ở thao tác có thể fail (mục 3.4).
- **major** — phá quy chuẩn dự án nhưng dùng vẫn được: hardcode màu ngoài token, thiếu một trong
  5 trạng thái, animate thuộc tính gây layout, thiếu nhánh `prefers-reduced-motion`.
- **minor** — lệch thẩm mỹ/nhịp: khoảng cách ngoài thang chuẩn, nhịp tiêu đề (mục 9.A.2), bóng
  màu trang trí, `text-[11px]` không có lý do chật chỗ.

> **Phạm vi thi hành:** cả 6 luật ở mục A áp cho **code MỚI và code đang sửa**. Không mở đợt quét
> riêng cho 197 chỗ `transition-all` và 56 chỗ `hover:scale-*` — cùng lập luận với mục 9.5: đổi
> hàng loạt là rủi ro thị giác thật đổi lấy lợi ích không đo được.

---

## 11. UI/UX PRO MAX — DECISION CONTRACT NATIVE CHO ĐỒNG HÀNH (2026-09-23)

Phần có giá trị nhất của `nextlevelbuilder/ui-ux-pro-max-skill` không phải catalog style/font/icon mà
là cách **định tuyến quyết định trước khi thiết kế**. Đồng Hành native hóa thành
`docs/ui-ux/decision-contract.json` để agent dùng cùng một vocabulary và CI có thể kiểm contract.

### A. Precedence — khi guideline mâu thuẫn

1. Business/security/privacy/pedagogy correctness.
2. Evidence và pattern đang chạy thật trong repo.
3. `packages/core-ui/theme.css` + Tailwind mapping của app (token source of truth).
4. Profile `docs/ui-ux/apps/dhcb.md` hoặc `hub.md`.
5. Skill này.
6. External guidance, gồm UI/UX Pro Max.

Không external recommendation nào được tự đổi token, navigation hierarchy, icon system, font,
payment semantics hoặc learner-state authority.

### B. Query contract — một dominant intent mỗi lượt

Trước khi code/review, viết intent 2–5 từ + constraint quan trọng, ví dụ:

- `mobile voice latency`;
- `lesson long reading`;
- `payment retry trust`;
- `admin data table`;
- `kid quiz feedback`;
- `keyboard error summary`.

Match signal trong decision contract; `must-have` luôn áp. Nếu có nhiều concern độc lập, tách lượt.
Không dùng query kiểu “review accessibility performance animation colors responsive forms” vì nó
che mất observable outcome cần sửa.

### C. Context bắt buộc trước pattern

Mỗi thay đổi phải xác định đủ:

- **app:** DHCB hay Hub;
- **persona/job:** learner, companion user, admin/reviewer, account/payment;
- **device/network:** mobile/desktop, touch/keyboard, slow/offline;
- **information shape:** prose, quiz, chat/voice, form, dashboard/table/chart, high-trust flow;
- **dominant risk:** hiểu sai, thao tác nhầm, mất tiến độ, sensory overload, latency uncertainty,
  focus loss, payment ambiguity;
- **existing pattern:** component/flow nào trong repo đã giải bài toán gần nhất.

Chỉ sau đó mới chọn density/motion/layout. “Bento”, “glass”, “immersive”, “3D” không phải requirement.

### D. Master + override nhưng KHÔNG tạo source token thứ hai

Đồng Hành **không** tạo `DESIGN.md` hoặc file master chứa lại màu/font/spacing. Source token vẫn là
`packages/core-ui/theme.css`. Lớp mới chỉ chứa **decision constraints**:

- global routing: `docs/ui-ux/decision-contract.json`;
- app profile: `docs/ui-ux/apps/*.md`;
- page/feature override khi thật sự cần: `docs/ui-ux/pages/<feature>.md`.

Page override phải ghi lý do nghiệp vụ, rule bị override, phạm vi, a11y/performance implication và
ngày review. Không override vì sở thích thẩm mỹ.

### E. Conditional design posture

- **Learning/reading:** readability > decoration; prose 65–75ch, line-height 1.5–1.7,
  progressive disclosure, giữ focus học.
- **Voice/realtime:** state phải hiểu được cả khi motion bị tắt; feedback latency rõ; user action
  luôn interrupt được animation/voice affordance.
- **Mobile/low-end/network yếu:** performance-first; touch >=44px; không animation nặng; offline /
  retry / queued state rõ; mobile là tái ưu tiên thông tin chứ không thu nhỏ desktop.
- **Kids:** target/chữ rõ hơn, copy đơn giản, hạn chế overstimulation; reward không che task.
- **Gamification:** celebration chỉ sau outcome thật, không toast trùng feedback đã nhìn thấy,
  không biến mọi interaction thành scale/glow/pulse.
- **Payment/trust:** total/status/recovery rõ, success chỉ khi authoritative state xác nhận;
  destructive/exit tách khỏi primary action.
- **Data-heavy/admin:** scanability > decoration; tabular number; chart có context/text alternative;
  mobile vẫn giữ quan hệ dữ liệu quan trọng.

### F. Forms — bổ sung từ quick-reference upstream, curate cho repo

- Dùng `type` / `inputMode` / `autocomplete` đúng ngữ nghĩa để mobile keyboard/autofill hỗ trợ.
- Validation ưu tiên sau blur/submit thay vì spam khi đang gõ, trừ constraint realtime rõ ràng.
- Nhiều lỗi cùng lúc: có error summary focusable + link tới field, vẫn giữ inline error.
- Read-only và disabled là hai trạng thái khác nhau cả semantic lẫn visual.
- Form dài/rủi ro mất dữ liệu phải cân nhắc draft/autosave/confirm unsaved change theo spec, không
  tự thêm persistence nếu business contract chưa cho phép.

### G. Navigation & state preservation

- Top-level navigation giữ nhất quán; không trộn bottom nav/sidebar/tab ở cùng hierarchy.
- Back/deep-link phải giữ context hợp lý: scroll, filter, input draft nếu contract cho phép.
- Route change quan trọng phải xét focus về main heading/content cho screen reader.
- Destination unavailable cần lý do/next step thay vì chỉ biến mất nếu người dùng cần hiểu quyền/trạng thái.

### H. Charts/data

Nếu chart mang thông tin quyết định, phải có title/context, unit/time range, accessible text/table
alternative khi cần và exact value qua interaction phù hợp. Không dùng pie/donut nhiều category,
3D chart hoặc dual-axis khó diễn giải chỉ vì “đẹp”. Với dataset lớn, aggregate/sample + drill-down
thay vì render mọi điểm.

### I. Verification contract

Chạy tối thiểu cho thay đổi UI:

```bash
npm run check:ui-ux
npm run lint
npm run typecheck
```

Flow đổi hành vi/layout/navigation/auth/payment/learning state chạy thêm E2E liên quan và axe.
`check:ui-ux` không thay E2E; nó gom contract + policy + contrast gates nhanh để phát hiện sai
kiến trúc UI trước full suite.
