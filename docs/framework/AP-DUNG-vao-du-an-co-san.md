# Áp dụng bộ khung vào DỰ ÁN ĐÃ CÓ SẴN (brownfield)

> Runbook `KHOI-TAO-du-an-moi.md` dành cho dự án mới (từ `create-next-app`). File này dành cho
> **dự án đã phát triển** — cách "đắp" khung lên code có sẵn một cách an toàn, **tăng dần, không làm lại từ đầu**.

> **Trạng thái áp dụng cho dự án này (bilingual-english-vietnamese)** — khớp `CLAUDE.md`/`PROGRESS.md`:
> đang ở **GĐ 4–5** (phát triển + nâng chất lượng, đã deploy thật); **Lớp 1 (hàng rào) đã xong**, **Lớp 2
> (E2E, a11y, bundle-size, i18n) đã đóng** — còn vài nợ kỹ thuật lẻ tẻ ghi ở `PROGRESS.md`. Runbook dưới
> đây là tài liệu phương pháp chung, không cần đọc lại mỗi phiên trừ khi áp khung cho phần mới.

## Nguyên tắc cốt lõi

1. **Không "big bang".** Đừng dừng dự án để viết lại. Áp khung theo từng lớp, ưu tiên **giá trị cao / rủi ro thấp** trước.
2. **Đo trước, sửa sau.** Lập "đường cơ sở" (baseline) hiện trạng rồi cải thiện dần, không đặt ngưỡng tuyệt đối ngay.
3. **Quy tắc hướng đạo sinh.** Code cũ dọn dần — "đụng đâu dọn đó", không cố dọn cả repo một lần.
4. **Hành vi không đổi khi dựng hàng rào.** Thêm lint/format/type không được làm đổi cách app chạy.

## Khung có HAI lớp — phân biệt khi áp vào dự án cũ

- **Lớp 1 — Quy trình & tiêu chuẩn (áp cho MỌI stack):** KHUNG 1 (giai đoạn + cổng), KHUNG 2 (luật AI, DoR/DoD,
  báo cáo xác thực), KHUNG 3 (research-first khi thêm/đổi công nghệ), CLAUDE.md, PROGRESS.md, ADR, các checklist
  Nhóm 1 & 2 (mobile, hiệu năng, a11y, UI/UX, **chống lỗi logic**). → **Dùng được ngay, bất kể bạn dùng công nghệ gì.**
- **Lớp 2 — File cấu hình cụ thể (Next/Tailwind/Supabase/Vercel):** `eslint.config.mjs`, `postcss.config.mjs`,
  `playwright.config.ts`, `lighthouserc.json`, `lib/env.ts`, `styles/theme.css`, `app/*`, `i18n/*`, workflows...
  → **Chỉ áp thẳng nếu trùng stack.** Khác stack thì lấy _ý tưởng_ và thay bằng công cụ tương đương (xem PHẦN D).

---

## Mang khung sang dự án (một lệnh)

Từ repo khung: `bash copy-framework.sh /đường-dẫn/tới/dự-án`. Script **không đè** file đang chạy: tài
liệu khung + `CLAUDE.md` (nếu chưa có) copy thẳng; file cấu hình theo stack đưa vào `_framework-dropins/`
để tự merge. Sau đó mở phiên Claude Code trong dự án đích → AI tự đọc `CLAUDE.md` và chạy Bước 0 (một
phiên chỉ tự nạp luật từ chính repo của nó, không đọc được repo khác qua link).

---

## PHẦN A — Trình tự áp dụng (4 bước)

### Bước 0 — Hiểu & ghi lại hiện trạng (AI TỰ XÁC ĐỊNH bằng cách đọc repo)

> **Quy tắc:** AI **không hỏi người dùng** những gì có thể đọc ra từ repo. Tự dò bằng cách **đọc file thật**
> (đúng luật chống "ảo giác"). Chỉ hỏi phần **không suy ra được từ code** (bối cảnh nghiệp vụ — xem cuối bước).

**Tự dò stack — đọc gì → suy ra gì:**

| Đọc gì (file/dấu hiệu thật)                                                         | Suy ra                                                             |
| ----------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `package.json` (deps + scripts) + lockfile                                          | framework, thư viện chính, **phiên bản**, lệnh dev/build/test/lint |
| `next.config.*` / `vite.config.*` / `svelte.config.*` / `astro.config.*`            | framework + bundler + plugin đang dùng                             |
| Thư mục `app/` vs `pages/`                                                          | Next App Router hay Pages Router                                   |
| `tsconfig.json`                                                                     | có dùng TS không, đã `strict` chưa, thiếu cờ nào                   |
| `tailwind.config.*` / `postcss.config.*` / `@import "tailwindcss"`                  | cách làm CSS + phiên bản Tailwind                                  |
| `.eslintrc*` (cũ) vs `eslint.config.*` (flat) / không có                            | ESLint legacy / flat / chưa có                                     |
| deps `next-intl`·`react-i18next`·`i18next` + thư mục `messages/`·`locales/`·`i18n/` | **giải pháp đa ngôn ngữ hiện có** (giữ hay đổi)                    |
| `supabase/` · `prisma/` · `drizzle*` · deps CSDL                                    | CSDL/ORM + có migration chưa                                       |
| deps `vitest`·`jest`·`playwright`·`cypress` + config                                | bộ kiểm thử hiện có (đơn vị/E2E)                                   |
| `.github/workflows/`                                                                | CI hiện có (hay chưa)                                              |
| `.husky/` · `lint-staged` · `commitlint*`                                           | hook/quy ước commit hiện có                                        |
| `process.env.*` rải rác · `.env*` · `.gitignore`                                    | biến môi trường: có validate chưa, có lộ bí mật không              |

- [ ] **AI tổng hợp "Hồ sơ dự án"**: stack + phiên bản + cấu trúc + những gì _đã có_ vs _còn thiếu_ so với khung
      (bảng gap). Trình bày để người dùng xác nhận, **không bắt người dùng tự khai stack**.
- [ ] **Viết `PROJECT.md` ngược** từ những gì đọc được: tính năng đã làm, schema hiện tại, kiến trúc, **nợ kỹ thuật**.
- [ ] Viết `PROGRESS.md`: dự án đang ở giai đoạn nào (thường GĐ 4–5 nếu chưa xong, hoặc GĐ 8 nếu đã ra mắt).
- [ ] Tạo `CLAUDE.md` điền **đúng stack/lệnh thật vừa dò được** (mục 10) — không để `[ĐIỀN]`.
- [ ] Cài Git hygiene nếu thiếu: `.gitignore` chặn `.env`, nhánh riêng cho mỗi thay đổi.

> **Chỉ hỏi người dùng** thứ KHÔNG nằm trong code: bối cảnh nghiệp vụ (ai là người dùng thật, mục tiêu sản phẩm),
> ưu tiên/đánh đổi, điểm đau lớn nhất, và xác nhận các giả định AI suy ra khi không chắc.

### Bước 1 — Dựng hàng rào lên code có sẵn (an toàn, không đổi hành vi)

Thứ tự tăng dần để không bị "ngộp lỗi":

- [ ] **Prettier** — chạy format toàn bộ **trong MỘT commit riêng biệt** (chỉ format), để các diff sau dễ review.
- [ ] **ESLint** — bật ở mức _cảnh báo_ trước; sửa dần; siết lên _error_ sau. Đừng bật full strict ngay với repo lớn.
- [ ] **TypeScript strict tăng dần** — nếu chưa `strict`: bật từng cờ một (`strict` → `noUncheckedIndexedAccess`...),
      dùng `tsc --noEmit` đếm lỗi và **giảm dần**; chỗ chưa kịp sửa để `// @ts-expect-error` + ghi nợ.
- [ ] **Husky + lint-staged** — chỉ lint/format **file đang sửa** (staged) → không phải dọn cả repo mới commit được.
- [ ] **commitlint** (conventional commits) cho các commit _mới_.
- [ ] **CI** (lint/type/test/build). Nếu type/lint còn quá nhiều lỗi cũ → cho các bước đó `continue-on-error` tạm thời,
      hạ dần nợ rồi mới bắt buộc.
- [ ] **Branch protection** trên `main` (PR + CI xanh + nhánh cập nhật).

### Bước 2 — Lấp lỗ hổng chất lượng (đo baseline → cải thiện dần)

- [ ] **Test** phần **quan trọng nhất / hay đổi nhất trước** (không cố phủ hết code cũ). Mỗi bug đã từng gặp → 1 test hồi quy.
- [ ] **E2E (Playwright)** cho 1–2 luồng chính (đăng nhập → thao tác lõi). Đặt **coverage threshold** thấp rồi nâng dần.
- [ ] **Lighthouse:** đo điểm hiện tại làm baseline; đặt budget kiểu "không tệ hơn hiện tại", cải thiện dần (Nhóm 2 mục 2).
- [ ] **Accessibility:** chạy axe, lập danh sách vi phạm, sửa theo mức nghiêm trọng (Nhóm 2 mục 3).
- [ ] **Theme/mobile:** nếu đã có UI, **retrofit dần** sang design tokens (`styles/theme.css`) — không viết lại giao diện.
- [ ] **Observability (Sentry):** thêm sớm để **thấy lỗi production thật** (Nhóm nâng cao mục 3).
- [ ] **Migration:** nếu áp kỷ luật migration lên CSDL đang chạy → **baseline schema hiện tại thành migration đầu tiên**
      (dump schema), rồi mọi thay đổi sau đi qua migration có phiên bản.

### Bước 3 — Vận hành theo khung từ đây

- [ ] Mọi tính năng mới / sửa lỗi: qua **DoR** (đủ rõ mới làm) → cổng commit → **DoD** → cổng merge → báo cáo xác thực.
- [ ] Code cũ: dọn dần theo "đụng đâu dọn đó"; ghi mọi "làm tạm" vào `PROGRESS.md` (nợ kỹ thuật).
- [ ] Đổi/thêm công nghệ lớn: chạy **KHUNG 3** (research-first, phiên bản đã xác minh) + ghi **ADR**.

---

## PHẦN B — Riêng cho dự án SONG NGỮ (EN–VI)

Dự án bạn đã có i18n → **đừng thay nếu đang chạy tốt.** Đánh giá rồi quyết:

- [ ] Đang dùng gì? (`next-intl`, `react-i18next`, `next` built-in i18n, hay tự viết). **Giữ nếu ổn**; chỉ cân nhắc
      `next-intl` (file kèm khung) nếu bạn _đang đau_ với giải pháp cũ và đang ở Next App Router.
- [ ] **Độ phủ bản dịch:** có khóa nào thiếu một trong hai ngôn ngữ không? Có cơ chế cảnh báo khóa thiếu khi build không?
- [ ] **Phát hiện & nhớ ngôn ngữ:** chọn theo URL (`/en`, `/vi`) hay cookie? Có nhớ lựa chọn của người dùng không?
- [ ] **SEO song ngữ:** có thẻ `hreflang` cho từng phiên bản ngôn ngữ + canonical đúng không? sitemap có cả hai?
- [ ] **Định dạng theo locale:** ngày/số/tiền dùng `Intl`/formatter theo locale, không hard-code định dạng.
- [ ] **Theme × i18n:** nhãn nút chuyển theme, `aria-label`, thông báo lỗi... đều đã dịch cả hai ngôn ngữ.
- [ ] **Kiểm thử:** smoke test E2E chạy cho **cả `en` lẫn `vi`** (thêm vào `playwright.config.ts` nếu cần).

---

## PHẦN C — Bản đồ "dùng ngay vs cần thay" theo stack

| Bạn đang dùng                                              | Lớp 1 (quy trình)                         | Lớp 2 (file cấu hình)                                                                             |
| ---------------------------------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------- |
| **Next.js + Tailwind + Supabase** (trùng stack tham chiếu) | Dùng ngay                                 | Áp thẳng gần hết; chỉ chỉnh tên biến/route                                                        |
| **Next.js nhưng CSDL/CSS khác**                            | Dùng ngay                                 | ESLint/Playwright/theme dùng được; thay phần Supabase/Tailwind                                    |
| **React SPA (Vite/CRA)**                                   | Dùng ngay                                 | ESLint/Prettier/Vitest/Playwright/theme tokens dùng được; bỏ phần Next (app/\*, next-intl plugin) |
| **Vue/Svelte/khác**                                        | Dùng ngay                                 | Lấy _ý tưởng_ (lint/format/hook/CI/budget/a11y) + thay công cụ tương đương của hệ đó              |
| **Không phải web**                                         | Dùng phần lớn (cổng, DoR/DoD, ADR, logic) | Bỏ phần web (Lighthouse/theme/PWA)                                                                |

> Điểm mấu chốt: **giá trị lớn nhất của khung là Lớp 1 (kỷ luật + cổng + chống lỗi logic) — áp được ngay
> cho dự án của bạn dù dùng công nghệ gì.** Lớp 2 là tiện ích đi kèm cho stack tham chiếu.

---

## PHẦN D — Học tiếp từ khung / repo / skill BÊN NGOÀI (phương pháp ba cột)

> Bổ sung 2026-10-12 (changelog 0620), rút gọn từ `docs/framework/adopt-from-outside.md` của khung
> `seeker19110/project-template`. Dùng khi chủ dự án đưa một nguồn ngoài và bảo "lấy cái hay về" — kể cả khi
> nguồn đó là chính bộ khung này ở phiên bản mới hơn. Đọc TRƯỚC khi chép một dòng nào.

1. **Xếp mỗi hạng mục vào đúng MỘT cột:** _Đã có và SÂU HƠN_ (không lấy; ghi một câu mạnh hơn ở đâu) ·
   _Đã có nhưng NÔNG HƠN_ (chỉ lấy đúng điểm yếu hơn, không chép cả hạng mục) · _CHƯA CÓ_ (lấy khi qua cổng ở
   bước 2). Không có cột "hay quá, lấy luôn" — chép một luật vào chỗ đã có luật đó là tạo **nguồn lệch mới**.
2. **Cổng "tốt hơn RÒNG bản đang chạy", chứng minh được:** bắt thêm một lớp lỗi (nêu được ca cụ thể bản hiện có
   cho lọt — `TRAPS.md`/bug/PR làm lại là bằng chứng mạnh nhất) · cùng kết quả mà ít code/bước/dependency hơn ·
   biến luật văn xuôi thành cổng máy · nhanh/rẻ hơn đo được. Trừ đi cái nó mang thêm (một luật phải nhớ, một
   file phải đồng bộ). Không chứng minh được → "chưa cần" + **điều kiện xem lại**.
3. **Grep CỔNG ĐANG CHẠY, đừng đọc văn xuôi.** Tài liệu nói "chưa có" chỉ là giả thuyết — tìm test/script/job
   CI/hằng số ngưỡng (`grep -rn "TRAN_\|THRESHOLD\|BASELINE"`, `.github/workflows/`, `scripts/*.test.ts`) mới là
   dữ kiện. ĐO trên repo thật trước khi kết luận cả hai chiều (một luật tưởng hay có thể ra toàn dương tính giả —
   vd ngưỡng file lớn của khung sẽ chặn 5 file dữ liệu > 1 MB DHCB sửa thường xuyên, changelog 0619).
4. **Kiểm MÂU THUẪN luật, không chỉ trùng lặp:** luật nào ở DHCB nói ngược hạng mục sắp lấy? Có → không lấy,
   hoặc đưa ra cho chủ dự án quyết; với DHCB, luật **chặt hơn** của mình luôn thắng (vd chặn MỌI force-push).
5. **Đầu ra:** bản đối chiếu lưu lại (changelog của đợt tích hợp là đủ) — thứ đã lấy, thứ bỏ kèm một câu lý do
   bác lại được, thứ "chưa cần" kèm điều kiện xem lại. Tiền lệ: changelog `0292`, `0294`, `0619`, `0620`.

---

## Cổng "đã áp khung xong cho dự án cũ"

- [ ] `PROJECT.md` (ngược) + `PROGRESS.md` + `CLAUDE.md` (điền thật) đã có.
- [ ] Pre-commit hook + commit-msg hook **chặn được** lỗi trên commit MỚI.
- [ ] CI chạy trên PR; branch protection bật.
- [ ] Có baseline (lint/type/test/Lighthouse/a11y) + kế hoạch hạ nợ dần.
- [ ] Tính năng mới đầu tiên đã đi trọn vẹn qua DoR → DoD → cổng merge.
