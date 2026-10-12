# Tổng hợp Nghiên cứu: Dinh Huong Va Ke Hoach Chung

Tài liệu này gộp từ 8 tài liệu nghiên cứu liên quan.

---

## [1] Tài liệu: ke-hoach-nen-tang-donghanhcungban-2026-07-31.md

_(Chi tiết nguồn gốc: `ke-hoach-nen-tang-donghanhcungban-2026-07-31.md`)_

# Kế hoạch: biến donghanhcungban.com thành NỀN TẢNG đồng hành đa lĩnh vực

> Ngày: 2026-07-31 · Trạng thái: **PHÁC THẢO — chờ người dùng chốt** (đây là cổng giai đoạn lớn, chưa code gì)
> Bối cảnh: hiện có 1 app chạy thật tại `en-vi.donghanhcungban.com` (React+Vite+Express+Postgres tự host, auth tự viết, thanh toán SePay).

---

## 1. Tầm nhìn & phạm vi

**Tầm nhìn:** `donghanhcungban.com` = "người đồng hành" của một người Việt suốt đời — bắt đầu từ **học hành**, sau lan sang **nuôi dạy con** và **phát triển nghề nghiệp**.

**Ba làn (lane) theo thời gian:**

| Làn               | Nội dung                                                      | Mốc dự kiến       |
| ----------------- | ------------------------------------------------------------- | ----------------- |
| L1 — Học hành     | Tiếng Anh (đã có) → Toán → Lý → Hoá → Văn/Sử/Địa              | 2026 H2 – 2027 H1 |
| L2 — Nuôi dạy con | Đồng hành cha mẹ: tâm lý theo độ tuổi, học cùng con, sức khoẻ | 2027              |
| L3 — Nghề nghiệp  | CV/phỏng vấn, kỹ năng số, định hướng ngành, học tiếp          | 2027–2028         |

**Nguyên tắc bất biến của nền tảng** (giữ đúng ADN app hiện tại):

1. Rẻ (ưu tiên model AI giá thấp, cache mạnh) — dự án vốn tối thiểu.
2. Tiếng Việt là ngôn ngữ mẹ đẻ của trải nghiệm; giải thích luôn dễ hiểu với người mới.
3. Sư phạm thật: có lộ trình, có SRS/ôn tập, có chấm điểm — không phải "chatbot hỏi đáp".
4. Một tài khoản, một gói cước dùng cho **mọi** môn/lĩnh vực.

**Không làm (ít nhất 12 tháng tới):** mạng xã hội, marketplace gia sư người thật, app native, livestream.

---

## 2. Quyết định kiến trúc cần chốt TRƯỚC (3 ngã rẽ)

### QĐ-1. Bố cục domain

| Phương án                                            | Mô tả                                                                                                                                                                                      | Ưu                                                                                               | Nhược                                                                             |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------- |
| **A. Subdomain mỗi môn** (`en-vi.`, `toan.`, `ly.`…) | Mỗi môn 1 app deploy riêng                                                                                                                                                                 | Cô lập lỗi; deploy độc lập; đã đúng với hiện trạng                                               | Cookie/SSO xuyên subdomain phải làm; N lần vận hành                               |
| **B. Một app, nhiều route** (`/anh`, `/toan`…)       | Gộp hết vào repo hiện tại                                                                                                                                                                  | Đơn giản nhất; SSO miễn phí                                                                      | Bundle phình; 1 lỗi sập cả nhà; repo khổng lồ                                     |
| **C. ⭐ Hub + subdomain, hạ tầng dùng chung**        | `donghanhcungban.com` = trang hub (giới thiệu + đăng nhập + điều hướng); mỗi môn 1 app subdomain; **dùng chung 1 Postgres + 1 dịch vụ auth + 1 dịch vụ thanh toán + 1 dịch vụ AI-gateway** | Mở môn mới không đụng môn cũ; chi phí vận hành gần bằng B; đường nâng cấp tự nhiên từ hiện trạng | Phải tách "lõi dùng chung" ra khỏi repo tiếng Anh (việc lớn nhất của cả kế hoạch) |

**Đề xuất: C.** Lý do: bạn đang một mình + VPS 1 vCPU, nhưng số môn sẽ tăng; C cho phép thêm môn mà **không** làm rủi ro app đang có người dùng thật.

#### ✅ ĐÃ CHỐT (2026-07-31): phương án C, thi hành ở **MỨC 2 — tách frontend, chung backend**

Mỗi môn có subdomain riêng (`en-vi.` · `math.` · `ly.` · `hoa.`, viết thường), `donghanhcungban.com` là hub.
Nhưng **chỉ MỘT tiến trình PM2** phục vụ tất cả, cho tới khi chạm ngưỡng nâng cấp bên dưới.

| Mức                | Frontend                | Tiến trình PM2                    | Ghi chú                                          |
| ------------------ | ----------------------- | --------------------------------- | ------------------------------------------------ |
| 1                  | 1 bundle, route `/toan` | 1                                 | Bị loại: bundle phình, sập cả nhà                |
| **2 ⭐ đang chọn** | mỗi môn 1 bundle riêng  | **1**                             | Người dùng thấy như app riêng; RAM/CPU thấp nhất |
| 3                  | mỗi môn 1 bundle        | mỗi môn 1 tiến trình + port riêng | Để dành, xem ngưỡng bên dưới                     |

**Vì sao mức 2:** VPS hiện **1 vCPU** — chạy N tiến trình Node chỉ tổ tranh nhau 1 core và tốn N×~200MB RAM,
chậm hơn chứ không an toàn hơn. Backend gần như đã dùng chung sẵn (auth, đếm lượt, SePay, `/api/agent`,
`/api/tts`, `/api/stt`, cache mã hoá); tách tiến trình lúc này là nhân bản vô ích.

**Điểm chạm code khi thi hành:**

1. `nginx/` — thêm `server` block cho mỗi subdomain, cùng `proxy_pass http://127.0.0.1:3001`;
   mở rộng cert Let's Encrypt đa tên (`certbot -d en-vi.… -d math.… -d donghanhcungban.com`).
2. `server.ts` (chỗ `express.static(… 'dist')` và `res.sendFile(… 'dist/index.html')`) — thay đường dẫn
   cứng `dist` bằng **bảng tra theo header `Host`**: `en-vi.→apps/english/dist`, `math.→apps/math/dist`,
   apex→`apps/hub/dist`, không khớp → hub. `/api/*` giữ nguyên một bộ dùng chung.
3. Auth SSO — cookie `domain=.donghanhcungban.com`; vì cùng tiến trình nên cùng secret, không phải
   đồng bộ gì giữa các môn (đây là chỗ mức 2 rẻ hơn hẳn mức 3).
4. Đếm lượt — vẫn cần migration `(subject, mode)`, độc lập với việc chọn mức.

**Ngưỡng nâng lên mức 3** (chốt trước để khỏi tranh luận lại) — đạt **bất kỳ** điều nào:

- một môn chiếm > 50% CPU của tiến trình chung, **hoặc**
- cần deploy môn A mà không được phép gián đoạn môn B, **hoặc**
- đã lên VPS nhiều core (khi đó **bắt buộc** đặt `REDIS_URL` cho rate limit dùng chung).

Nâng cấp = thêm entry vào `ecosystem.config.cjs` + đổi port trong Nginx. Không phải viết lại —
với điều kiện làm monorepo (QĐ-2) ngay từ đầu.

### QĐ-2. Repo

- **C1. Monorepo** (npm workspaces): `packages/core-auth`, `core-billing`, `core-ai`, `core-ui`, `apps/english`, `apps/math`, `apps/hub`.
- C2. Nhiều repo + package nội bộ.

**Đề xuất: C1 monorepo, npm workspaces** (không thêm Turborepo/pnpm lúc đầu — giữ đúng luật "không nâng cấp bừa"). Một CI, một chỗ sửa lõi.

### QĐ-3. Dữ liệu

Một Postgres, **một schema `core`** (users, plans, payments, usage, streak) + **mỗi môn một schema riêng** (`english`, `math`…). Không nhét bảng môn mới vào `public` chung.

> ⚠️ Rủi ro lớn nhất: bảng `profiles`/`daily_usage`/`payments` hiện đang gắn chặt vào khái niệm "mode: chat/writing/speaking/stt". Phải tổng quát hoá thành `(subject, mode)` trước khi có môn thứ hai. Đây là **migration phá vỡ**, cần làm sớm khi còn ít dữ liệu.

---

## 3. Cái gì tái dùng được, cái gì phải viết mới

**Tái dùng gần như nguyên vẹn (~60% giá trị đã có):**

- Auth Bearer token + Google Identity (`api/auth.ts`, `api/_lib/authService.ts`)
- Thanh toán SePay + `plan_prices`/`payments` (chỉ cần bỏ chữ "ENVI" cứng → tiền tố theo app)
- Đếm lượt/rate limit (`api/_lib/usage.ts`, `security.ts`)
- AI gateway `/api/agent`, TTS/STT + cache mã hoá, `fileStorage.ts` (R2/local)
- Hệ theme 4 màu + design tokens `--a-*`, bộ UI, hạ tầng test/CI/Sentry/PM2/Nginx
- **Động cơ SRS** (`cefrProgress`, SM2/FSRS) — dùng lại được cho MỌI môn: Toán/Lý/Hoá cũng cần ôn công thức, khái niệm.

**Phải viết mới cho mỗi môn:**

- Mô hình nội dung (Toán ≠ từ vựng: cần **bài toán có lời giải từng bước**, công thức LaTeX, chấm đáp án số/biểu thức)
- Chấm bài (Anh = IELTS band; Toán = đúng/sai + chỉ ra bước sai; Lý/Hoá = còn có đơn vị đo, cân bằng phương trình)
- Lộ trình (Anh = CEFR; Toán/Lý/Hoá = **chương trình GDPT 2018 theo lớp 6→12**)

---

## 4. Lộ trình 5 giai đoạn

### GĐ 0 — Chốt hướng + ADR (1 tuần, 0 dòng code sản phẩm)

- Chốt QĐ-1/2/3 ở trên; viết `docs/adr/0001-nen-tang-da-linh-vuc.md`.
- Khảo sát pháp lý/nội dung: dùng đề Toán/Lý/Hoá ở đâu cho **hợp pháp** (SGK có bản quyền!) — xem §6.
- **Cổng ra:** ADR được duyệt.

### GĐ 1 — Tách lõi dùng chung + trang hub (4–6 tuần) ⚠️ nặng nhất

1. Chuyển repo sang npm workspaces, **app tiếng Anh chạy y hệt như cũ** (không đổi hành vi — đây là refactor thuần, phải có E2E xanh trước & sau).
2. Tách `packages/core-auth`, `core-billing`, `core-ai`, `core-ui` (theme + component chung).
3. Migration `(subject, mode)` cho `daily_usage`/`plan_features`; thêm cột `subject` mặc định `'english'` (backfill an toàn, rollback được).
4. Dựng `apps/hub` tại `donghanhcungban.com` (chốt 2026-07-31, chi tiết ở
   `dac-ta-gd1-tach-loi-monorepo-2026-07-31.md` §7.1–7.2): một trang từ trên xuống — mục tiêu tổng
   thể dự án → hoạt động chung của dự án (số liệu thật, cộng gộp mọi môn) → **tab riêng cho từng
   môn** (mô tả + hoạt động riêng + nút "Học ngay"; môn chưa mở hiện "sắp ra mắt", không để tab
   rỗng) → bảng giá chung.
5. SSO xuyên subdomain (cookie `.donghanhcungban.com` hoặc token hand-off qua URL một lần).
6. Onboarding lần đầu theo môn: bấm "Học ngay" ở một môn lần đầu → hỏi trình độ/mục tiêu/phút học
   mỗi ngày/nhóm tuổi **giống hệt luồng đang có ở app tiếng Anh** (`Onboarding.tsx`), lưu riêng theo
   `(user_id, subject)` — không suy ra trình độ môn này từ môn khác.

- **Cổng ra:** đăng nhập ở hub → vào thẳng en-vi không phải login lại; app tiếng Anh không hồi quy;
  trang hub đúng bố cục trên; bấm "Học ngay" lần đầu ở một môn ra đúng luồng hỏi, lần sau không hỏi lại.

> Ghi nhận nhưng chưa làm ở GĐ1 (để dành GĐ sau, tránh phình phạm vi refactor thuần): bảng tiến độ
> đa môn ở hub (streak/thời gian học cộng gộp), referral xuyên môn. Chi tiết lý do ở đặc tả §7.

### GĐ 2 — Môn thứ hai: TOÁN (6–8 tuần) — bài kiểm chứng cho toàn kiến trúc

Vì sao Toán trước: nhu cầu lớn nhất, dữ liệu dễ tự sinh nhất, và chấm tự động khả thi (đáp án số/biểu thức) — khác Văn phải chấm bằng AI đắt tiền.

- Phạm vi MVP hẹp: **lớp 6–9, 3 chủ đề mỗi lớp**, không ôm cả 6→12.
- Tính năng: lộ trình theo chương → bài giảng ngắn (video/chữ) → luyện tập sinh đề theo tham số → **giải thích từng bước** → SRS công thức → chấm & thống kê.
- Kỹ thuật mới cần nghiên cứu: KaTeX (render công thức), nhập công thức trên mobile, sinh đề có tham số + kiểm đáp án bằng biểu thức (đề xuất: template hoá đề, chấm bằng so khớp số/biểu thức chuẩn hoá — **không** để AI tự chấm đúng/sai vì hay sai số học).
- **Cổng ra:** 50 người dùng thật học Toán 1 tuần, chi phí AI/người ≤ mức của môn Anh.

### GĐ 3 — Lý + Hoá (4–6 tuần/môn, dùng lại 80% từ GĐ2)

Thêm: đơn vị đo & thứ nguyên, cân bằng phương trình hoá học, bảng tuần hoàn, mô phỏng đơn giản.

### GĐ 4 — L2 nuôi dạy con & L3 nghề nghiệp (2027+)

Khác biệt về chất: ít "luyện tập", nhiều "tư vấn + theo dõi dài hạn". Cần thiết kế riêng, sẽ có kế hoạch riêng. **Chưa phác thảo chi tiết ở đây để tránh phình phạm vi.**

---

## 5. Mô hình kinh doanh

- Giữ nguyên bậc Free/Pro/VIP hiện có, nhưng **gói mua một lần dùng cho mọi môn** ("Đồng hành toàn diện") — đây là lợi thế lớn nhất so với app đơn môn.
- Lượt dùng: hạn mức chung theo ngày, chia sẻ giữa các môn (đơn giản, dễ hiểu, chống lạm dụng tốt hơn hạn mức riêng từng môn).
- Cần tính lại giá khi chi phí AI tăng theo số môn — làm bảng chi phí/người dùng trước GĐ2.

---

## 6. Rủi ro & cách giảm

| Rủi ro                                       | Mức    | Giảm thiểu                                                                                                                                              |
| -------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Phình phạm vi, không môn nào tới nơi**     | 🔴 cao | Mỗi GĐ có cổng ra đo được; cấm mở môn mới khi môn trước chưa đạt cổng                                                                                   |
| Refactor GĐ1 làm hỏng app đang có người dùng | 🔴 cao | Refactor thuần + E2E đầy đủ trước khi tách; deploy từng bước, giữ rollback                                                                              |
| Bản quyền đề/SGK Toán-Lý-Hoá                 | 🔴 cao | Chỉ bám **chương trình GDPT 2018** (văn bản nhà nước, được dùng); đề **tự sinh theo tham số** hoặc AI sinh mới; tuyệt đối không chép đề/sách thương mại |
| AI chấm sai Toán/Lý/Hoá                      | 🟡 vừa | Chấm bằng thuật toán (so khớp đáp án chuẩn hoá), AI chỉ **giải thích**, không phán đúng/sai                                                             |
| VPS 1 vCPU không tải nổi nhiều app           | 🟡 vừa | Nâng VPS trước GĐ2; đặt `REDIS_URL` khi chạy nhiều tiến trình                                                                                           |
| Một mình làm không xuể                       | 🟡 vừa | Dùng subagent theo luật phân việc ở CLAUDE.md §3; ưu tiên tái dùng thay vì viết mới                                                                     |

---

## 7. Việc tiếp theo ngay (nếu bạn duyệt)

1. ~~QĐ-1/2/3~~ **ĐÃ CHỐT HẾT (2026-07-31)**: C ở mức 2 · monorepo npm workspaces · schema `core` + schema mỗi môn.
2. ~~Viết ADR + đặc tả GĐ1~~ **XONG** → `docs/adr/0001-nen-tang-da-linh-vuc.md` và
   `docs/research/dac-ta-gd1-tach-loi-monorepo-2026-07-31.md` (7 PR, migration `0028`, kế hoạch chống hồi quy).
3. **Việc kế tiếp:** ba việc chuẩn bị BẮT BUỘC trước PR-1 — ghi mốc E2E đang xanh · bổ sung E2E
   (hoặc danh sách kiểm tra tay) cho thanh toán + đăng nhập Google · backup DB và **xác minh restore
   chạy được**. Xong ba việc đó mới mở PR-1 (alias đường dẫn).

---

## [2] Tài liệu: dac-ta-trang-nghe-2026-08-01.md

_(Chi tiết nguồn gốc: `dac-ta-trang-nghe-2026-08-01.md`)_

# Đặc tả — Trang NGHE (`/listening`) · 2026-08-01

> Trạng thái: ĐANG TRIỂN KHAI (đợt 1). Nhánh `claude/listening-page-stories-conversations-c8jpm4`.
> Người duyệt: chủ dự án (đã chốt 3 quyết định phạm vi ngày 2026-08-01 — xem mục 2).

## 1. Mục tiêu

Một trang duy nhất gom **mọi nội dung để NGHE** của app, đường dẫn tiếng Anh `/listening`, gồm 4 mục:

| #   | Mục                                               | Nguồn dữ liệu                                      |
| --- | ------------------------------------------------- | -------------------------------------------------- |
| 1   | Câu thông dụng                                    | **Tái dùng** `/public/data/patterns/` (đã có)      |
| 2   | Các cuộc hội thoại                                | **Tái dùng** `/public/data/dialogues.json` (đã có) |
| 3   | Truyện cổ tích nổi tiếng các quốc gia (song ngữ)  | **MỚI** — `/public/data/stories/`                  |
| 4   | Truyện ngụ ngôn nổi tiếng các quốc gia (song ngữ) | **MỚI** — `/public/data/stories/`                  |

Khác biệt với trang `/phrases` và mục "Nghe" trong `/practice`: hai chỗ đó là **luyện tập có
chấm điểm** (dictation, nghe→chọn nghĩa). Trang `/listening` là **thư viện nghe** — nghe hiểu,
đọc theo, karaoke, song ngữ bật/tắt. Không nhân bản dữ liệu, không thêm bài tập chấm điểm ở đợt 1.

## 2. Quyết định phạm vi đã chốt (2026-08-01)

1. **Đợt 1 = 12 truyện** (6 cổ tích + 6 ngụ ngôn), phủ 8 quốc gia.
2. **Mục 1 & 2 tái dùng dữ liệu sẵn có**, chỉ đổi cách trình bày sang "chế độ nghe".
3. **TTS gọi theo từng câu khi cần** (`/api/tts` + cache mã hoá sẵn có), có nút "Phát cả truyện"
   phát tuần tự. KHÔNG prefetch trước lúc deploy ở đợt 1 (tránh tốn phí Google TTS trả trước).

## 3. ⚠️ Bản quyền — RÀNG BUỘC BẮT BUỘC

Đây là ràng buộc pháp lý, không phải gợi ý. Vi phạm = phải gỡ nội dung.

### 3.1 Bản tiếng Anh — CHỈ dùng public domain, TẢI THẬT, không chép từ trí nhớ

Bản dịch/bản kể tiếng Anh được phép dùng nguyên văn:

| Nguồn                                             | Người dịch/kể         | Năm  | Ghi chú |
| ------------------------------------------------- | --------------------- | ---- | ------- |
| Aesop's Fables                                    | George Fyler Townsend | 1867 | PD      |
| Aesop's Fables                                    | Joseph Jacobs         | 1894 | PD      |
| Grimm's Household Tales                           | Margaret Hunt         | 1884 | PD      |
| Andersen's Fairy Tales                            | H. P. Paull           | 1872 | PD      |
| Perrault (qua Andrew Lang, _The Blue Fairy Book_) | Andrew Lang           | 1889 | PD      |
| English Fairy Tales                               | Joseph Jacobs         | 1890 | PD      |
| The Japanese Fairy Book                           | Yei Theodora Ozaki    | 1903 | PD      |
| The Panchatantra / Indian Fairy Tales             | Joseph Jacobs         | 1892 | PD      |

**BẮT BUỘC:** văn bản tiếng Anh phải được **tải thật từ Project Gutenberg** (`gutenberg.org`)
rồi trích, **KHÔNG được gõ lại từ trí nhớ của AI** — sẽ sai chữ và vi phạm CLAUDE.md §5
(chống ảo giác). Mỗi truyện lưu kèm `source.enUrl` là URL Gutenberg đã tải.

> **🚧 CHẶN (2026-08-01):** network policy của môi trường Claude Code hiện **chặn hoàn toàn**
> `gutenberg.org`, `en.wikisource.org`, `classics.mit.edu`, `etc.usf.edu`, `sacred-texts.com`
> (CONNECT trả 403). `add_repo` cũng không gắn được kho GITenberg vì không cho thêm repo khác
> chủ sở hữu. **Chủ dự án đã chốt: mở network policy cho `gutenberg.org` rồi làm tiếp trong
> phiên mới.** Cho tới lúc đó, 9 truyện nước ngoài (mục 4) **CHƯA soạn được** — đợt 1 chỉ giao
> được 3 truyện dân gian Việt Nam (không cần nguồn ngoài).
>
> Cách mở: Claude Code trên web → cài đặt Environment của dự án → Network policy → thêm
> `gutenberg.org` (và `www.gutenberg.org`) vào danh sách cho phép. Xem
> https://code.claude.com/docs/en/claude-code-on-the-web

### 3.2 Bản tiếng Việt — Opus dịch tay

Các bản dịch tiếng Việt đang lưu hành (Lê Chu Cầu, Nguyễn Văn Hải, NXB Kim Đồng…) **VẪN CÒN
BẢN QUYỀN** — tuyệt đối không chép. Bản tiếng Việt trong app do **Opus dịch tay** từ bản PD
tiếng Anh, ghi rõ `source.vi = "Opus dịch tay 2026 từ bản public domain"`.

### 3.3 Truyện Việt Nam

Truyện dân gian Việt Nam (Tấm Cám, Ếch ngồi đáy giếng, Thầy bói xem voi…) là **văn học dân
gian, không có tác giả, thuộc phạm vi công cộng**. Bản tiếng Việt do Opus kể lại theo cốt
truyện dân gian (không chép sách giáo khoa/NXB nào), bản tiếng Anh do Opus dịch.

## 4. Danh sách 12 truyện đợt 1

### Cổ tích (`kind: "fairy-tale"`)

| id                  | Tiếng Anh               | Tiếng Việt                | Quốc gia    | Nguồn EN                  |
| ------------------- | ----------------------- | ------------------------- | ----------- | ------------------------- |
| `ft-hansel-gretel`  | Hansel and Gretel       | Hansel và Gretel          | 🇩🇪 Đức      | Grimm / Hunt 1884         |
| `ft-ugly-duckling`  | The Ugly Duckling       | Chú vịt con xấu xí        | 🇩🇰 Đan Mạch | Andersen / Paull 1872     |
| `ft-cinderella`     | Cinderella              | Cô bé Lọ Lem              | 🇫🇷 Pháp     | Perrault / Lang 1889      |
| `ft-jack-beanstalk` | Jack and the Beanstalk  | Jack và cây đậu thần      | 🇬🇧 Anh      | Jacobs 1890               |
| `ft-momotaro`       | Momotaro, the Peach Boy | Momotaro — cậu bé quả đào | 🇯🇵 Nhật Bản | Ozaki 1903                |
| `ft-tam-cam`        | Tam and Cam             | Tấm Cám                   | 🇻🇳 Việt Nam | Dân gian (Opus kể + dịch) |

### Ngụ ngôn (`kind: "fable"`)

| id                      | Tiếng Anh                      | Tiếng Việt                 | Quốc gia    | Nguồn EN                   |
| ----------------------- | ------------------------------ | -------------------------- | ----------- | -------------------------- |
| `fb-tortoise-hare`      | The Hare and the Tortoise      | Rùa và Thỏ                 | 🇬🇷 Hy Lạp   | Aesop / Townsend 1867      |
| `fb-boy-cried-wolf`     | The Shepherd Boy and the Wolf  | Cậu bé chăn cừu và con sói | 🇬🇷 Hy Lạp   | Aesop / Townsend 1867      |
| `fb-fox-grapes`         | The Fox and the Grapes         | Cáo và chùm nho            | 🇬🇷 Hy Lạp   | Aesop / Townsend 1867      |
| `fb-monkey-crocodile`   | The Monkey and the Crocodile   | Khỉ và Cá sấu              | 🇮🇳 Ấn Độ    | Panchatantra / Jacobs 1892 |
| `fb-frog-in-well`       | The Frog in the Well           | Ếch ngồi đáy giếng         | 🇻🇳 Việt Nam | Dân gian (Opus kể + dịch)  |
| `fb-blind-men-elephant` | The Blind Men and the Elephant | Thầy bói xem voi           | 🇻🇳 Việt Nam | Dân gian (Opus kể + dịch)  |

## 5. Cấu trúc dữ liệu

### 5.1 File trên đĩa

```
apps/english/src/data/stories/
  index.ts          # type + hằng số, KHÔNG chứa nội dung truyện
  loader.ts         # fetch từ /data/stories/, giống data/patterns/loader.ts
  raw/<id>.json     # NGUỒN — 12 file, mỗi truyện 1 file (do Opus soạn)
public/data/stories/
  index.json        # meta 12 truyện (không có nội dung) — sinh bằng script
  <id>.json         # nội dung đầy đủ 1 truyện — sinh bằng script
scripts/gen-stories-json.mjs   # raw/*.json → public/data/stories/*
```

Lý do tách `raw/` và `public/`: giống hệt cách `patterns` / `dialogues` đang làm — nội dung
KHÔNG được import vào bundle JS (sẽ phình bundle, vi phạm size-limit), chỉ tải bằng `fetch()`
khi người dùng mở truyện.

### 5.2 Kiểu TypeScript (chốt — worker không được đổi)

```ts
// apps/english/src/data/stories/index.ts
export type StoryKind = 'fairy-tale' | 'fable'

/** Một câu song ngữ. `p` = chỉ số đoạn văn (để gom câu thành đoạn khi hiển thị). */
export interface StoryLine {
  p: number
  en: string
  vi: string
}

export interface StorySource {
  /** Vd: "Aesop's Fables, tr. George Fyler Townsend (1867) — public domain" */
  en: string
  /** URL Gutenberg đã tải văn bản gốc. Rỗng với truyện dân gian Việt Nam. */
  enUrl: string
  /** Vd: "Opus dịch tay 2026 từ bản public domain" */
  vi: string
}

/** Meta hiển thị ở danh sách — nằm trong index.json, KHÔNG kèm nội dung. */
export interface StoryMeta {
  id: string
  kind: StoryKind
  titleEn: string
  titleVi: string
  countryVi: string
  countryEn: string
  /** Emoji cờ, vd "🇩🇪". */
  flag: string
  /** Cấp CEFR gợi ý để người học tự lượng sức: 'A2' | 'B1' | 'B2'. */
  level: 'A2' | 'B1' | 'B2'
  /** Số câu — dùng ước lượng thời gian nghe ở danh sách. */
  lineCount: number
}

/** Nội dung đầy đủ — nằm trong <id>.json. */
export interface Story extends StoryMeta {
  source: StorySource
  /** Bài học rút ra (ngụ ngôn mới có). */
  moralEn?: string
  moralVi?: string
  lines: StoryLine[]
}
```

### 5.3 Ràng buộc dữ liệu (worker phải kiểm bằng test)

- `lines` không rỗng; mọi `en` và `vi` đều non-empty sau `trim()`.
- `p` bắt đầu từ 0, tăng dần, không nhảy cóc.
- `id` khớp tên file và khớp `index.json`.
- `lineCount === lines.length`.
- `kind === 'fable'` → phải có `moralEn` + `moralVi`.

## 6. UI — `apps/english/src/pages/Listening.tsx`

### 6.1 Cấu trúc trang

- Dùng `Layout` + `PageHeader` như các trang khác.
- Thanh **4 tab** ở đầu trang (mẫu: thanh tab trong `CefrLevelPage.tsx`):
  `Câu thông dụng · Hội thoại · Truyện cổ tích · Truyện ngụ ngôn`
  (chiều B: `Common phrases · Conversations · Fairy tales · Fables`).
- Tab hiện tại đồng bộ vào URL query `?tab=phrases|dialogues|fairy-tales|fables` để chia sẻ
  link và bấm Back được. Mặc định `phrases`.
- `VoiceMenu` + `RateToggle` ở đầu trang như `CommonPhrases.tsx`.

### 6.2 Tab 1 — Câu thông dụng

Đọc `data/patterns/loader.ts` (`loadIndex` + `loadSubject`). Trình bày **chế độ nghe**:
danh sách chủ thể → mở ra danh sách câu, mỗi câu là một `KaraokeText`, có nút
**"Phát tất cả"** phát tuần tự cả chủ thể. Bản dịch tiếng Việt ẩn/hiện bằng một nút gạt
"Hiện bản dịch" (mặc định ẨN — đây là trang luyện nghe).

### 6.3 Tab 2 — Hội thoại

Đọc `data/dialoguesLoader.ts`. Nhóm hội thoại theo cấp CEFR bằng tiền tố id
(`a1-*`, `a2-*`, `b1-*`, `b2-*`, `c1-*`, `c2-*`). Mỗi hội thoại: hiện tên nhân vật, mỗi
dòng một `KaraokeText`, **2 giọng khác nhau cho A/B** theo `speakerAGender`/`speakerBGender`
(dùng lại đúng logic đã có ở `RoadmapTab.tsx` — worker phải đọc và tái dùng, không viết lại).
Có nút "Phát cả hội thoại". Bản dịch ẩn/hiện như tab 1.

### 6.4 Tab 3 & 4 — Truyện cổ tích / ngụ ngôn

Cùng một component, khác `kind`.

**Danh sách:** lưới thẻ truyện — cờ quốc gia + tiêu đề (ngôn ngữ đích lớn, bản dịch nhỏ) +
nhãn cấp CEFR + ước lượng thời gian nghe (`lineCount × 4 giây`, làm tròn phút).
Có bộ lọc theo quốc gia (chip).

**Đọc truyện** (route con `/listening/story/:id`, lazy-load nội dung):

- Tiêu đề + cờ + dòng ghi nguồn (bắt buộc hiển thị `source.en` và `source.vi` — nghĩa vụ ghi công).
- Nội dung theo đoạn (`p`), mỗi câu một `KaraokeText` ngôn ngữ đích; bản dịch nằm ngay dưới,
  thụt lề bằng `KARAOKE_INDENT`, ẩn/hiện bằng nút gạt "Hiện bản dịch" (mặc định ẨN).
- Nút **"Phát cả truyện"**: phát tuần tự từng câu, tự cuộn tới câu đang đọc, câu đang đọc
  được làm nổi (dùng `externalState` của `KaraokeText`). Có nút Tạm dừng/Tiếp tục.
- Với ngụ ngôn: khối "Bài học rút ra" (`moralEn`/`moralVi`) ở cuối, có nút loa.
- Nút quay lại danh sách; giữ nguyên tab đang mở.

### 6.5 Chiều A / B

Tuân thủ `lib/direction.ts` như mọi trang: chiều A (Việt học Anh) → ngôn ngữ đích = Anh,
bản dịch = Việt. Chiều B → đảo lại (đọc `vi` bằng giọng `vi-VN`, bản dịch là `en`).
Toàn bộ nhãn UI song ngữ theo `useLang()`.

## 7. Điểm chạm code (đầy đủ — worker không cần đoán)

| File                                                           | Việc                                                                                                             |
| -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `apps/english/src/pages/Listening.tsx`                         | MỚI — trang chính 4 tab                                                                                          |
| `apps/english/src/pages/StoryReader.tsx`                       | MỚI — màn đọc 1 truyện                                                                                           |
| `apps/english/src/components/StoryCard.tsx`                    | MỚI — thẻ truyện ở danh sách                                                                                     |
| `apps/english/src/data/stories/index.ts`                       | MỚI — type (mục 5.2)                                                                                             |
| `apps/english/src/data/stories/loader.ts`                      | MỚI — `loadStoryIndex()`, `loadStory(id)`                                                                        |
| `apps/english/src/data/stories/raw/*.json`                     | MỚI — 12 truyện (Opus soạn)                                                                                      |
| `scripts/gen-stories-json.mjs`                                 | MỚI — sinh `public/data/stories/`                                                                                |
| `package.json`                                                 | thêm `"gen:stories"`; nối vào `build` cạnh `gen-data-manifest.mjs`                                               |
| `apps/english/src/App.tsx`                                     | thêm route `/listening` + `/listening/story/:id`, lazy, bọc `RequireAuth` + `FeatureGate featureKey="listening"` |
| `apps/english/src/i18n/index.ts`                               | thêm nhãn `navListening` + nhãn 4 tab (cả `vi` và `en`)                                                          |
| `apps/english/src/pages/Practice.tsx`                          | mục "Nghe" thêm 1 thẻ trỏ sang `/listening`                                                                      |
| `apps/english/src/pages/Home.tsx`                              | thêm lối vào trang Nghe                                                                                          |
| `api/admin-plan-features.ts` (hoặc nơi khai danh sách feature) | thêm khoá `listening`                                                                                            |
| `scripts/gen-data-manifest.mjs`                                | kiểm xem có cần liệt kê thư mục stories không                                                                    |

**Lưu ý `FeatureGate`:** worker phải đọc `lib/planFeatures.ts` xác nhận khoá lạ mặc định là
**BẬT** (không khoá nhầm người dùng free). Nếu mặc định là TẮT thì phải thêm `listening` vào
danh sách bật sẵn cho mọi gói.

## 8. Chất lượng — cổng bắt buộc

- Test đơn vị: `apps/english/src/data/stories/stories.test.ts` — kiểm toàn bộ ràng buộc mục 5.3
  trên cả 12 file `raw/*.json` (chạy vòng lặp, không hard-code từng truyện).
- Test đơn vị cho hàm gom câu theo đoạn và hàm ước lượng thời gian nghe.
- a11y: tab dùng `role="tablist"`/`aria-selected`, nút loa có `aria-label`, vùng chạm ≥ 44px
  (class `tap-44`), tương phản AA ở cả 4 theme — **không hard-code màu**, chỉ dùng token `--a-*`
  / class `accent-*` (CLAUDE.md §4.8).
- Hiệu năng: nội dung truyện KHÔNG được import tĩnh vào bundle; kiểm `npm run size` không vượt
  ngân sách.
- Cổng commit CLAUDE.md §8: `npm run build` · `typecheck` · `lint` (0 cảnh báo) · `format` · `test`.
- Không đụng `apps/english/src/prompts/*` và `packages/core-ai/aiConfig.ts` → **không cần** chạy
  `npm run eval:tutor`.

## 9. Phân việc

| Việc                                                               | Người làm                 | Lý do                                                     |
| ------------------------------------------------------------------ | ------------------------- | --------------------------------------------------------- |
| A. Nội dung 12 truyện (tải PD từ Gutenberg + dịch tay tiếng Việt)  | **Opus (phiên chính)**    | Dịch văn học + rủi ro bản quyền/ảo giác — không giao được |
| B. Hạ tầng dữ liệu: type, loader, script sinh JSON, test ràng buộc | subagent `route:spec`     | Đặc tả đã kín (mục 5)                                     |
| C. UI: trang Listening 4 tab + StoryReader + route/nav/i18n        | subagent `route:standard` | Đặc tả UI cụ thể (mục 6-7)                                |

Thứ tự: B và C chạy song song trên dữ liệu mẫu → A đổ nốt các truyện còn lại → cổng chất lượng → PR.

**Tiến độ thực tế 2026-08-01:**

- [x] B — hạ tầng dữ liệu (subagent)
- [x] C — UI trang Nghe (subagent)
- [x] A — 3 truyện Việt Nam: `fb-frog-in-well`, `fb-blind-men-elephant`, `ft-tam-cam`
- [x] **CHẶN Ở MỤC 3.1 ĐÃ GỠ (2026-08-01):** `gutenberg.org` truy cập được, đã tải thật 16 bộ
      sách public domain và đọc mục lục thật.
- [x] Mở rộng phạm vi: **6 thể loại × 20 truyện = 120 truyện** — xem
      `docs/research/danh-muc-truyen-nghe-2026-08-01.md` (danh mục đầy đủ + kế hoạch 13 đợt).
      `StoryKind` mở từ 2 lên 6 giá trị; thanh tab đổi từ 4 tab sang 3 tab + chip lọc thể loại.
- [x] A — 4 ngụ ngôn nguyên văn public domain: `fb-tortoise-hare`, `fb-boy-cried-wolf`,
      `fb-fox-grapes` (Aesop/Townsend 1867), `fb-monkey-crocodile` (Jataka/Babbitt 1912)
- [ ] A — 113 truyện còn lại, làm theo đợt ~10 truyện/PR

## 10. Ngoài phạm vi đợt 1 (ghi để khỏi phình)

- Bài tập chấm điểm trong trang Nghe (đã có ở `/practice`).
- Prefetch TTS toàn bộ truyện lúc deploy.
- Lưu tiến độ nghe/đánh dấu truyện đã nghe lên DB.
- Truyện có minh hoạ.
- Tốc độ đọc riêng cho truyện (dùng `RateToggle` toàn cục).

---

## [3] Tài liệu: danh-muc-truyen-nghe-2026-08-01.md

_(Chi tiết nguồn gốc: `danh-muc-truyen-nghe-2026-08-01.md`)_

# Danh mục truyện cho trang NGHE — 6 thể loại × 20 truyện · 2026-08-01

> Bổ sung cho `docs/research/dac-ta-trang-nghe-2026-08-01.md` (đặc tả kỹ thuật vẫn giữ nguyên).
> Chốt phạm vi ngày 2026-08-01: 6 thể loại, mỗi thể loại 20 truyện = 120 truyện.
> **Cập nhật 2026-08-02: `myth` nâng lên 25 truyện → tổng phạm vi thành 125** (xem §6).
> Nhịp làm: **mỗi PR ~10 truyện**.

## 1. Nguyên tắc nội dung (chốt 2026-08-01)

1. **Bản tiếng Anh lấy NGUYÊN VĂN** từ bản public domain đã tải thật về từ Project Gutenberg —
   không diễn đạt lại, không rút gọn, không gõ từ trí nhớ. Chỉ được phép: tách câu và gom câu
   thành đoạn (`p`), chuẩn hoá dấu nháy cong → thẳng.
2. **Bản tiếng Việt do Opus dịch tay, chất lượng văn học cao nhất** — dịch nghĩa trọn vẹn, giữ
   giọng kể cổ tích, không dịch máy, không chép bản dịch đang lưu hành (còn bản quyền).
3. Truyện dân gian Việt Nam: không có bản PD tiếng Anh → Opus kể lại bằng lời văn riêng theo cốt
   truyện dân gian rồi tự dịch sang tiếng Anh.
4. Mỗi truyện ghi rõ `source.en` (tên sách + người dịch + năm) và `source.enUrl` (URL Gutenberg
   đã tải thật) — nghĩa vụ ghi công, hiển thị trong màn đọc truyện.

## 2. Kho nguồn public domain — ĐÃ TẢI VÀ KIỂM CHỨNG THẬT (2026-08-01)

Tất cả các ID dưới đây đã `curl` về HTTP 200 và **đã đọc mục lục thật** trong phiên này.

| PG ID   | Sách                                                                          | Người dịch / kể       | Năm     | Dùng cho thể loại   |
| ------- | ----------------------------------------------------------------------------- | --------------------- | ------- | ------------------- |
| `21`    | Aesop's Fables (Three Hundred Aesop's Fables)                                 | George Fyler Townsend | 1867    | Ngụ ngôn            |
| `62514` | Jataka Tales                                                                  | Ellen C. Babbitt      | 1912    | Ngụ ngôn            |
| `7518`  | More Jataka Tales                                                             | Ellen C. Babbitt      | 1922    | Ngụ ngôn            |
| `7128`  | Indian Fairy Tales                                                            | Joseph Jacobs         | 1892    | Ngụ ngôn / Cổ tích  |
| `5314`  | Household Tales (Grimm)                                                       | Margaret Hunt         | 1884    | Cổ tích             |
| `27200` | Fairy Tales of Hans Christian Andersen                                        | H. P. Paull           | 1872    | Cổ tích             |
| `1597`  | Andersen's Fairy Tales                                                        | H. P. Paull           | 1872    | Cổ tích             |
| `503`   | The Blue Fairy Book                                                           | Andrew Lang           | 1889    | Cổ tích             |
| `7439`  | English Fairy Tales                                                           | Joseph Jacobs         | 1890    | Cổ tích             |
| `4018`  | Japanese Fairy Tales                                                          | Yei Theodora Ozaki    | 1903    | Cổ tích             |
| `3327`  | Bulfinch's Mythology: The Age of Fable                                        | Thomas Bulfinch       | 1855    | Thần thoại          |
| `24737` | The Children of Odin                                                          | Padraic Colum         | 1920    | Thần thoại          |
| `677`   | The Heroes; or, Greek Fairy Tales                                             | Charles Kingsley      | 1856    | Thần thoại          |
| `16244` | The Turkish Jester (Nasr-Eddin Hoja)                                          | George Borrow         | 1884    | Truyện cười         |
| `2781`  | Just So Stories                                                               | Rudyard Kipling       | 1902    | Thiếu nhi kinh điển |
| Potter  | 14838 · 14407 · 14872 · 14814 · 14837 · 15137 · 15077 · 14220 · 17089 · 15284 | Beatrix Potter        | 1902–18 | Thiếu nhi kinh điển |

> ⚠️ **Lưu ý đã phát hiện khi kiểm chứng:**
>
> - `The Monkey and the Crocodile` **KHÔNG** nằm trong Indian Fairy Tales của Jacobs (đặc tả cũ
>   ghi sai). Nguồn đúng: **PG 62514, truyện I** — đã xác nhận trong mục lục.
> - `The Ugly Duckling` **KHÔNG** có trong PG 1597. Nguồn đúng: **PG 27200** (cùng người dịch
>   H. P. Paull) — đã xác nhận ở dòng 177 mục lục.
> - Không dùng `Uncle Remus` (Joel Chandler Harris): văn bản viết theo phương ngữ nặng
>   (eye-dialect), sai chính tả có chủ ý → hại cho người học nghe và cho TTS. Loại khỏi danh mục.

## 3. Thể loại 1 — Truyện cổ tích (`kind: "fairy-tale"`)

> ## ✅ **HOÀN TẤT 20/20 (2026-08-02)** — thể loại `fairy-tale` đã soạn xong toàn bộ.
>
> Đợt cuối bổ sung #15–20: Jacobs PG 7439 (Jack và cây đậu thần, Ba chú lợn con, Ba chú gấu) +
> Ozaki PG 4018 (Chim sẻ bị cắt lưỡi, Chàng Urashima Taro, Momotaro).
>
> ⚠️ **Đính chính (2026-08-02):** ghi chú trước đó ghi "12/20" là SAI — đếm thật lúc ấy chỉ có 11
> file `ft-*.json`. Từ nay khi cập nhật tiến độ phải **đếm file thật** (`ls raw/ft-*.json | wc -l`)
> chứ không cộng nhẩm.

| #   | id                      | Tiếng Anh                                    | Tiếng Việt                  | Nước        | Nguồn        | Cấp |
| --- | ----------------------- | -------------------------------------------- | --------------------------- | ----------- | ------------ | --- |
| 1   | `ft-tam-cam`            | Tam and Cam                                  | Tấm Cám                     | 🇻🇳 Việt Nam | Opus kể/dịch | B1  |
| 2   | `ft-hansel-gretel`      | Hansel and Grethel                           | Hansel và Gretel            | 🇩🇪 Đức      | PG 5314      | B1  |
| 3   | `ft-cinderella`         | Cinderella                                   | Cô bé Lọ Lem                | 🇩🇪 Đức      | PG 5314      | B1  |
| 4   | `ft-little-red-cap`     | Little Red-Cap                               | Cô bé quàng khăn đỏ         | 🇩🇪 Đức      | PG 5314      | A2  |
| 5   | `ft-snow-white`         | Little Snow-white                            | Nàng Bạch Tuyết             | 🇩🇪 Đức      | PG 5314      | B1  |
| 6   | `ft-rumpelstiltzkin`    | Rumpelstiltzkin                              | Chàng lùn tinh quái         | 🇩🇪 Đức      | PG 503       | B1  |
| 7   | `ft-ugly-duckling`      | The Ugly Duckling                            | Chú vịt con xấu xí          | 🇩🇰 Đan Mạch | PG 27200     | B1  |
| 8   | `ft-little-mermaid`     | The Little Mermaid                           | Nàng tiên cá                | 🇩🇰 Đan Mạch | PG 27200     | B2  |
| 9   | `ft-thumbelina`         | Little Tiny or Thumbelina                    | Cô bé tí hon                | 🇩🇰 Đan Mạch | PG 27200     | B1  |
| 10  | `ft-emperor-clothes`    | The Emperor's New Clothes                    | Bộ quần áo mới của hoàng đế | 🇩🇰 Đan Mạch | PG 1597      | A2  |
| 11  | `ft-match-girl`         | The Little Match Girl                        | Cô bé bán diêm              | 🇩🇰 Đan Mạch | PG 1597      | A2  |
| 12  | `ft-sleeping-beauty`    | The Sleeping Beauty in the Wood              | Người đẹp ngủ trong rừng    | 🇫🇷 Pháp     | PG 503       | B1  |
| 13  | `ft-puss-in-boots`      | The Master Cat; or, Puss in Boots            | Mèo đi hia                  | 🇫🇷 Pháp     | PG 503       | B1  |
| 14  | `ft-beauty-beast`       | Beauty and the Beast                         | Người đẹp và quái vật       | 🇫🇷 Pháp     | PG 503       | B2  |
| 15  | `ft-jack-beanstalk`     | Jack and the Beanstalk                       | Jack và cây đậu thần        | 🇬🇧 Anh      | PG 7439      | A2  |
| 16  | `ft-three-little-pigs`  | The Story of the Three Little Pigs           | Ba chú lợn con              | 🇬🇧 Anh      | PG 7439      | A2  |
| 17  | `ft-three-bears`        | The Story of the Three Bears                 | Ba chú gấu                  | 🇬🇧 Anh      | PG 7439      | A2  |
| 18  | `ft-momotaro`           | Momotaro, or the Story of the Son of a Peach | Momotaro — cậu bé quả đào   | 🇯🇵 Nhật     | PG 4018      | B1  |
| 19  | `ft-urashima-taro`      | The Story of Urashima Taro                   | Chàng Urashima Taro         | 🇯🇵 Nhật     | PG 4018      | B1  |
| 20  | `ft-tongue-cut-sparrow` | The Tongue-Cut Sparrow                       | Chim sẻ bị cắt lưỡi         | 🇯🇵 Nhật     | PG 4018      | A2  |

## 4. Thể loại 2 — Truyện ngụ ngôn (`kind: "fable"`)

> ## ✅ **HOÀN TẤT 20/20 (2026-08-02)** — thể loại `fable` đã soạn xong toàn bộ.
>
> Đợt cuối bổ sung 14 truyện Jataka (PG 62514 + PG 7518). Tổng độ dài EN của thể loại: 9.789 từ,
> trung bình 489 từ/truyện (bản Aesop cũ chỉ ~94 từ/truyện).
>
> ⚠️ **Cẩn thận với con số trung bình 489 ở trên — nó che mất phân bố rất lệch.** Rà lại
> 2026-08-03 bằng cách đo TỪNG truyện: **10/20 truyện dưới sàn 400 từ**, trong đó 3 truyện dưới
> cả ngưỡng 200 từ mà quy tắc bên dưới nói "cân nhắc bỏ". Trung bình cao là nhờ vài truyện
> Jataka rất dài kéo lên (`fb-prince-wicked` 1.692 từ, `fb-monkey-crocodile` 942). Bài học:
> khi kiểm độ dài thể loại phải xem **phân bố**, đừng tin mỗi số trung bình.
>
> ✅ **QUYẾT ĐỊNH 2026-08-03 (chủ dự án): GIỮ NGUYÊN 3 truyện siêu ngắn — ngoại lệ có chủ đích.**
> `fb-fox-grapes` (56 từ) · `fb-boy-cried-wolf` (98 từ) · `fb-tortoise-hare` (128 từ). Đây là ba
> ngụ ngôn Aesop nổi tiếng nhất thế giới, hầu như ai cũng biết; nguyên văn Townsend 1867 vốn
> ngắn đúng như vậy, không phải lỗi dữ liệu. Giá trị nhận biết lớn hơn thiệt hại về thời lượng
> nghe. **Đây là ngoại lệ được ghi nhận, KHÔNG phải việc còn tồn** — đừng "sửa" ở các đợt sau.

> **📌 Ghi chú độ dài — chốt 2026-08-01 sau khi đo độ dài thật:**
>
> Đã đo 7 truyện đầu tiên: ngụ ngôn Aesop nguyên văn CỰC NGẮN — `fb-fox-grapes` 56 từ (~20 giây
> nghe), `fb-boy-cried-wolf` 98 từ, `fb-tortoise-hare` 128 từ. Đây là ĐÚNG bản Townsend 1867,
> không phải lỗi — nhưng quá ngắn cho một "thư viện nghe".
>
> **Chủ dự án đã chốt: ƯU TIÊN NGUỒN DÀI HƠN.** Nguyên tắc cho mọi đợt sau:
>
> 1. Mỗi truyện nên **≥ 400 từ tiếng Anh** (~1,5 phút nghe trở lên). Dưới 200 từ thì cân nhắc bỏ.
> 2. Ưu tiên Jataka (PG 62514 / 7518, ~400–800 từ), Grimm (PG 5314), Andersen (PG 27200),
>    Just So Stories (PG 2781), Beatrix Potter — đều dài hơn Aesop nhiều lần.
> 3. Giảm tỷ trọng Aesop (PG 21) xuống, **chỉ giữ các truyện Aesop DÀI**.
>
> **✅ ĐÃ XỬ LÝ 2026-08-02.** Đã `curl` mục lục thật PG 62514 / 7518 / 7128, đo `wc -w` từng
> truyện rồi thay 4 mục (bảng dưới đã cập nhật):
>
> | Mục cũ                       | Lý do bỏ                           | Mục mới thay vào                      | Từ EN |
> | ---------------------------- | ---------------------------------- | ------------------------------------- | ----- |
> | `fb-boys-frogs` (Aesop)      | quá ngắn (< 200 từ)                | `fb-ox-won-forfeit` (PG 62514)        | 504   |
> | `fb-walnut-tree` (Aesop)     | quá ngắn (< 200 từ)                | `fb-stolen-plow` (PG 7518)            | 489   |
> | `fb-charcoal-fuller` (Aesop) | quá ngắn (< 200 từ)                | `fb-woodpecker-turtle-deer` (PG 7518) | 717   |
> | `fb-cruel-crane` (PG 7128)   | **TRÙNG NỘI DUNG** `fb-crab-crane` | `fb-prince-wicked` (PG 7518)          | 1.692 |
>
> Lưu ý cho phiên sau: "The Cruel Crane Outwitted" (Jacobs, PG 7128) và "The Crab and the Crane"
> (Babbitt, PG 62514) là **cùng một tích Jataka**, chỉ khác người kể lại — khi chọn truyện từ
> nhiều tuyển tập Jataka phải đối chiếu nội dung, không chỉ đối chiếu tên.
>
> Ngoài ra `ft-tam-cam` đã được viết lại dày hơn (976 → ~2.100 từ EN) vì bản đầu kể quá gọn.

| #   | id                          | Tiếng Anh                              | Tiếng Việt                               | Nước        | Nguồn    | Cấp |
| --- | --------------------------- | -------------------------------------- | ---------------------------------------- | ----------- | -------- | --- |
| 1   | `fb-frog-in-well`           | The Frog in the Well                   | Ếch ngồi đáy giếng                       | 🇻🇳 Việt Nam | Opus     | A2  |
| 2   | `fb-blind-men-elephant`     | The Blind Men and the Elephant         | Thầy bói xem voi                         | 🇻🇳 Việt Nam | Opus     | A2  |
| 3   | `fb-tortoise-hare`          | The Hare and the Tortoise              | Rùa và Thỏ                               | 🇬🇷 Hy Lạp   | PG 21    | A2  |
| 4   | `fb-boy-cried-wolf`         | The Shepherd's Boy and the Wolf        | Cậu bé chăn cừu và con sói               | 🇬🇷 Hy Lạp   | PG 21    | A2  |
| 5   | `fb-fox-grapes`             | The Fox and the Grapes                 | Cáo và chùm nho                          | 🇬🇷 Hy Lạp   | PG 21    | A2  |
| 6   | `fb-ox-won-forfeit`         | The Ox Who Won the Forfeit             | Con Bò thắng cược                        | 🇮🇳 Ấn Độ    | PG 62514 | A2  |
| 7   | `fb-stolen-plow`            | The Stolen Plow                        | Cái cày bị mất trộm                      | 🇮🇳 Ấn Độ    | PG 7518  | A2  |
| 8   | `fb-woodpecker-turtle-deer` | The Woodpecker, Turtle, and Deer       | Chim gõ kiến, Rùa và Hươu                | 🇮🇳 Ấn Độ    | PG 7518  | A2  |
| 9   | `fb-monkey-crocodile`       | The Monkey and the Crocodile           | Khỉ và Cá sấu                            | 🇮🇳 Ấn Độ    | PG 62514 | A2  |
| 10  | `fb-turtle-saved-life`      | How the Turtle Saved His Own Life      | Rùa tự cứu mình                          | 🇮🇳 Ấn Độ    | PG 62514 | A2  |
| 11  | `fb-talkative-turtle`       | The Turtle Who Couldn't Stop Talking   | Rùa nói nhiều                            | 🇮🇳 Ấn Độ    | PG 62514 | A2  |
| 12  | `fb-sandy-road`             | The Sandy Road                         | Con đường cát                            | 🇮🇳 Ấn Độ    | PG 62514 | B1  |
| 13  | `fb-quarrel-quails`         | The Quarrel of the Quails              | Cuộc cãi vã của bầy chim cút             | 🇮🇳 Ấn Độ    | PG 62514 | A2  |
| 14  | `fb-timid-rabbit`           | The Foolish, Timid Rabbit              | Chú Thỏ nhút nhát dại dột                | 🇮🇳 Ấn Độ    | PG 62514 | A2  |
| 15  | `fb-banyan-deer`            | The Banyan Deer                        | Vua Hươu cây Đa                          | 🇮🇳 Ấn Độ    | PG 62514 | B1  |
| 16  | `fb-crab-crane`             | The Crab and the Crane                 | Cua và Sếu                               | 🇮🇳 Ấn Độ    | PG 62514 | B1  |
| 17  | `fb-golden-goose`           | The Golden Goose                       | Con ngỗng vàng                           | 🇮🇳 Ấn Độ    | PG 7518  | A2  |
| 18  | `fb-three-fishes`           | The Three Fishes                       | Ba con Cá                                | 🇮🇳 Ấn Độ    | PG 7518  | A2  |
| 19  | `fb-penny-wise-monkey`      | The Penny-Wise Monkey                  | Con Khỉ tham lam                         | 🇮🇳 Ấn Độ    | PG 7518  | A2  |
| 20  | `fb-prince-wicked`          | Prince Wicked and the Grateful Animals | Hoàng tử Độc Ác và những con vật biết ơn | 🇮🇳 Ấn Độ    | PG 7518  | B1  |

## 5. Thể loại 3 — Truyện dân gian Việt Nam (`kind: "vn-folk"`)

Không có bản PD tiếng Anh → **Opus kể lại bằng lời văn riêng + tự dịch sang tiếng Anh**.
Không chép sách giáo khoa hay bản của bất kỳ NXB nào.

> ## 🔓 **KHÔNG GIỚI HẠN SỐ LƯỢNG — chủ dự án chốt 2026-08-03.**
>
> `vn-folk` **không còn trần 20 truyện**. Đây là thể loại mở: cứ còn truyện dân gian Việt Nam
> hay và chưa có thì bổ sung tiếp, không cần sửa danh mục để xin thêm chỗ. Lý do: thể loại này
> **không phụ thuộc nguồn ngoài** (Opus tự kể + tự dịch theo §1.3) nên không bị giới hạn bởi
> việc tuyển tập public domain có gì; và đây là phần nội dung mang bản sắc riêng của sản phẩm.
>
> ⚠️ **Hệ quả cho con số tổng:** tổng danh mục 125 truyện giờ chỉ còn là **sàn**, không phải
> đích. Khi báo cáo tiến độ, `vn-folk` ghi số tuyệt đối (vd "vn-folk: 26 truyện"), KHÔNG ghi
> dạng phân số `n/20` nữa vì không còn mẫu số.
>
> Mốc đã qua: 20/20 (2026-08-02) → 24 (2026-08-03, thêm Thần Trụ Trời, Sự tích Táo Quân,
> Mỵ Châu — Trọng Thuỷ, Cóc kiện Trời).
>
> 🚨 **SỰ CỐ TRÙNG LẶP 2026-08-03 — đã xử lý, ghi lại để không lặp.** Đã soạn `vn-tam-cam` (Tấm
> Cám) rồi mới phát hiện **`ft-tam-cam` ĐÃ TỒN TẠI** từ trước, nằm ở thể loại `fairy-tale` (mục
> #1 của §3), là bản dài hơn hẳn (115 câu / 2.044 từ so với 59 câu / 1.035 từ). Đã **xoá bản
> trùng `vn-tam-cam`**, giữ `ft-tam-cam`.
>
> **Nguyên nhân:** khi kiểm "truyện Việt Nam nào đã có", đã liệt kê bằng `ls raw/vn-*.json` —
> tức lọc theo TIỀN TỐ THỂ LOẠI, trong khi truyện Việt Nam còn nằm rải ở `fairy-tale` (Tấm Cám)
> và sẽ còn ở `humor` (5 truyện cười VN, §7). Đúng bài học đã ghi ở §4 cho lô Jataka — _"phải
> đối chiếu NỘI DUNG, không chỉ đối chiếu tên"_ — nhưng lần này sai ở chiều khác: lọc nhầm
> phạm vi tìm kiếm.
>
> ✅ **QUY TẮC BẮT BUỘC TỪ NAY:** trước khi soạn bất kỳ truyện mới nào, phải rà **TOÀN BỘ**
> `raw/*.json` (không lọc tiền tố) theo `titleVi`, `titleEn` VÀ câu mở đầu, cộng với `grep` tên
> nhân vật/tích trong chính file danh mục này. Đã có sẵn script rà trong lịch sử phiên; chạy nó
> trước mỗi đợt.
>
> 📌 **Ghi chú xếp loại:** `ft-tam-cam` là truyện dân gian Việt Nam nhưng nằm ở `fairy-tale`.
> Đây là xếp loại có từ đầu dự án, giữ nguyên để không phá URL/tiến độ người học; nhưng nó chính
> là cái bẫy đã gây ra sự cố trên — nhớ rằng **thể loại KHÔNG suy ra được quốc gia**.
>
> #1–3 soạn ở PR #440; #4–13 và #14–20 soạn trong hai đợt ngày 2026-08-02.
> Độ dài: 497–709 từ EN mỗi truyện (đều vượt ngưỡng ≥400 từ đã chốt ở §4), 22–37 câu song ngữ.
>
> ⚠️ **Đính chính danh mục (2026-08-02) — 3 chỗ sai đã sửa trong bảng dưới:**
>
> 1. Mục #10 cũ `vn-mai-an-tiem` ("Mai An Tiêm on the Island") **trùng nội dung** với #4
>    `vn-su-tich-dua-hau` — Mai An Tiêm chính là nhân vật của sự tích quả dưa hấu, hai dòng là
>    cùng một truyện. Đã **thay bằng `vn-so-dua` (Sọ Dừa)**, giữ nguyên tổng số 20.
> 2. Mục #15 id cũ `vn-tam-that-quy` **không mang nghĩa gì** so với nội dung (Sự tích con muỗi,
>    nhân vật là Ngọc Tâm — Nhan Diệp). Đổi thành `vn-su-tich-con-muoi`.
> 3. Mục #17 id cũ `vn-hai-chi-em-cay-vu-sua` ("hai chị em") **mô tả sai truyện** — đây là chuyện
>    một người mẹ và đứa con trai, không có hai chị em nào. Đổi thành `vn-su-tich-cay-vu-sua`.
>
> 📌 **Vì sao đợt này làm `vn-folk` chứ không phải `fable` như kế hoạch:** 14 truyện `fable` còn
> lại đều cần **nguyên văn Project Gutenberg**, nhưng network policy của phiên chặn
> `gutenberg.org` (403 ở CONNECT, mọi mirror đã thử đều hỏng). CLAUDE.md §5 cấm gõ từ trí nhớ →
> `fable`/`myth`/`humor`/`children` bị chặn cứng. `vn-folk` là thể loại duy nhất không phụ thuộc
> nguồn ngoài (Opus tự kể + tự dịch, theo đúng nguyên tắc §1.3 ở trên).

| #   | id                               | Tiếng Việt              | Tiếng Anh                            | Cấp |
| --- | -------------------------------- | ----------------------- | ------------------------------------ | --- |
| 1   | `vn-son-tinh-thuy-tinh`          | Sơn Tinh — Thủy Tinh    | The Mountain God and the Water God   | B1  |
| 2   | `vn-banh-chung-banh-giay`        | Bánh chưng bánh giầy    | The Square Cake and the Round Cake   | A2  |
| 3   | `vn-thanh-giong`                 | Thánh Gióng             | The Boy Hero of Phu Dong             | B1  |
| 4   | `vn-su-tich-dua-hau`             | Sự tích quả dưa hấu     | The Legend of the Watermelon         | A2  |
| 5   | `vn-cay-khe`                     | Ăn khế trả vàng         | The Star-Fruit Tree                  | A2  |
| 6   | `vn-cay-tre-tram-dot`            | Cây tre trăm đốt        | The Hundred-Knot Bamboo              | A2  |
| 7   | `vn-thach-sanh`                  | Thạch Sanh              | Thach Sanh the Woodcutter            | B1  |
| 8   | `vn-su-tich-ho-guom`             | Sự tích Hồ Gươm         | The Legend of the Returned Sword     | B1  |
| 9   | `vn-chu-cuoi`                    | Chú Cuội cung trăng     | The Man in the Moon                  | A2  |
| 10  | `vn-so-dua`                      | Sọ Dừa                  | So Dua, the Coconut Boy              | B1  |
| 11  | `vn-con-rong-chau-tien`          | Con Rồng cháu Tiên      | Children of the Dragon and the Fairy | B1  |
| 12  | `vn-trau-cau`                    | Sự tích trầu cau        | The Legend of the Betel and Areca    | B1  |
| 13  | `vn-tro-cuoi-trang-quynh`        | Trạng Quỳnh             | The Clever Scholar Quynh             | B1  |
| 14  | `vn-luu-binh-duong-le`           | Lưu Bình — Dương Lễ     | Two Friends, Luu Binh and Duong Le   | B1  |
| 15  | `vn-su-tich-con-muoi`            | Sự tích con muỗi        | The Legend of the Mosquito           | A2  |
| 16  | `vn-nguoi-con-gai-nam-xuong`     | Người con gái Nam Xương | The Woman of Nam Xuong               | B2  |
| 17  | `vn-su-tich-cay-vu-sua`          | Sự tích cây vú sữa      | The Legend of the Milk-Fruit Tree    | A2  |
| 18  | `vn-su-tich-chim-quoc`           | Sự tích chim quốc       | The Legend of the Quoc Bird          | A2  |
| 19  | `vn-anh-nong-dan-va-ba-dieu-uoc` | Ba điều ước             | The Three Wishes                     | A2  |
| 20  | `vn-tri-khon-cua-ta-day`         | Trí khôn của ta đây     | Here Is My Wisdom                    | A2  |

## 6. Thể loại 4 — Thần thoại (`kind: "myth"`)

> **📌 SỬA DANH MỤC 2026-08-02 — 3 mục Kingsley quá dài, đã tách theo PART.**
>
> Đo nguyên văn PG 677: `my-perseus` **12.068 từ**, Argonauts và Theseus còn dài hơn. Một thẻ
> nghe 12.000 từ ≈ 45–50 phút audio — không dùng được. Danh mục có sàn ≥400 từ (§4) nhưng
> **thiếu trần**, nên chỗ này lọt lưới. Chủ dự án chốt: **tách theo PART có sẵn của Kingsley**
> (không cắt giữa chừng, mỗi PART vốn là một chương trọn vẹn), lấy tiêu đề PART thật trong mục lục.
>
> Số đo từng PART (`wc -w` thật): Perseus I 1.336 · II 3.124 · III 2.709 · IV 3.530 · V 1.367 ·
> Argonauts I 2.699 · II 2.769 · III 1.192 · IV 7.363 · V 7.465 · VI 845 ·
> Theseus I 1.319 · II 7.353 · III 1.522 · IV **789**.
>
> ⚠️ **Đính chính 2026-08-02 (đợt Theseus):** số đo T-IV ghi lần đầu là "3.768 từ" **SAI** — T-IV
> là phần cuối sách nên phép đo đã gộp cả chú thích cuối sách + toàn bộ giấy phép Project
> Gutenberg vào. Nội dung truyện thật chỉ **789 từ** (vẫn trên sàn 400). Bài học: khi đo phần
> CUỐI một sách Gutenberg phải cắt bỏ boilerplate trước, không đo tới hết file.
>
> **Loại** A-IV, A-V, T-II (đều >7.000 từ) và A-VI (845 từ, hụt so với mạch truyện).
> Kingsley chiếm **8 slot** (Perseus trọn 5 phần + Theseus 3 phần I/III/IV — vẫn thành một mạch
> liền: nhấc tảng đá → giết Minotaur → chết vì kiêu ngạo). Argonauts bị bỏ khỏi PG 677 vì các
> phần cốt lõi đều quá dài. Còn lại 12 slot cho Bulfinch (8) + Colum (4).
>
> ✅ **ĐÃ QUYẾT 2026-08-02 — nâng `myth` lên 25 truyện.** Ban đầu, để giữ tổng 20 sau khi Kingsley
> chiếm 8 slot, 5 mục Bulfinch đã bị cắt (Apollo & Daphne, Pyramus & Thisbe, Phaeton, Baucis &
> Philemon, Pygmalion). Chủ dự án chốt **giữ lại cả 5** và nâng thể loại lên **25 truyện**:
> Kingsley 8 + Bulfinch 13 + Colum 4.
>
> 📌 Hệ quả cho phạm vi tổng: các thể loại không còn đồng đều 20 truyện nữa. Tổng danh mục thành
> **125 truyện** (fairy-tale 20 · fable 20 · vn-folk 20 · **myth 25** · humor 20 · children 20).
> Tiêu đề tài liệu này ("6 thể loại × 20 truyện") vì vậy chỉ còn đúng với 5 thể loại kia.
>
> Lỗi bản quét đã sửa khi soạn (ghi rõ trong `source.en` từng file): `flail` → `frail` (Perseus I),
> `Perseuss` → `Perseus` (Perseus IV). Các dòng `[Picture: ...]` là chú thích tranh, đã bỏ vì TTS
> sẽ đọc lên thành lời truyện.

| #   | id                    | Tiếng Anh                                                    | Tiếng Việt                             | Nước      | Nguồn    | Cấp | TT  |
| --- | --------------------- | ------------------------------------------------------------ | -------------------------------------- | --------- | -------- | --- | --- |
| 1   | `my-perseus-1`        | Perseus, Part I: How Perseus and His Mother Came to Seriphos | Perseus I: Hai mẹ con dạt vào Seriphos | 🇬🇷 Hy Lạp | PG 677   | B2  | ✅  |
| 2   | `my-perseus-2`        | Perseus, Part II: How Perseus Vowed a Rash Vow               | Perseus II: Lời thề nông nổi           | 🇬🇷 Hy Lạp | PG 677   | B2  | ✅  |
| 3   | `my-perseus-3`        | Perseus, Part III: How Perseus Slew the Gorgon               | Perseus III: Chém quái vật Medusa      | 🇬🇷 Hy Lạp | PG 677   | B2  | ✅  |
| 4   | `my-perseus-4`        | Perseus, Part IV: How Perseus Came to the Æthiops            | Perseus IV: Cứu nàng Andromeda         | 🇬🇷 Hy Lạp | PG 677   | B2  | ✅  |
| 5   | `my-perseus-5`        | Perseus, Part V: How Perseus Came Home Again                 | Perseus V: Ngày trở về                 | 🇬🇷 Hy Lạp | PG 677   | B2  | ✅  |
| 6   | `my-theseus-1`        | Theseus, Part I: How Theseus Lifted the Stone                | Theseus I: Nhấc tảng đá                | 🇬🇷 Hy Lạp | PG 677   | B2  | ✅  |
| 7   | `my-theseus-3`        | Theseus, Part III: How Theseus Slew the Minotaur             | Theseus III: Giết quái vật Minotaur    | 🇬🇷 Hy Lạp | PG 677   | B2  | ✅  |
| 8   | `my-theseus-4`        | Theseus, Part IV: How Theseus Fell by His Pride              | Theseus IV: Ngã vì kiêu ngạo           | 🇬🇷 Hy Lạp | PG 677   | B2  | ✅  |
| 9   | `my-prometheus`       | Prometheus and Pandora                                       | Prometheus và chiếc hộp Pandora        | 🇬🇷 Hy Lạp | PG 3327  | B2  | ✅  |
| 10  | `my-proserpine`       | Pluto and Proserpine                                         | Pluto và nàng Proserpine               | 🇬🇷 Hy Lạp | PG 3327  | B2  | ✅  |
| 11  | `my-midas`            | Midas                                                        | Vua Midas và bàn tay vàng              | 🇬🇷 Hy Lạp | PG 3327  | B1  | ✅  |
| 12  | `my-daedalus-icarus`  | Daedalus and Icarus                                          | Daedalus và Icarus                     | 🇬🇷 Hy Lạp | PG 3327  | B1  | ✅  |
| 13  | `my-orpheus-eurydice` | Orpheus and Eurydice                                         | Orpheus và Eurydice                    | 🇬🇷 Hy Lạp | PG 3327  | B2  | ✅  |
| 14  | `my-narcissus-echo`   | Echo and Narcissus                                           | Tiếng vọng và chàng Narcissus          | 🇬🇷 Hy Lạp | PG 3327  | B2  | ✅  |
| 15  | `my-cupid-psyche`     | Cupid and Psyche                                             | Cupid và Psyche                        | 🇬🇷 Hy Lạp | PG 3327  | B2  | ✅  |
| 16  | `my-arachne`          | Arachne                                                      | Nàng Arachne dệt vải                   | 🇬🇷 Hy Lạp | PG 3327  | B2  | ✅  |
| 17  | `my-apollo-daphne`    | Apollo and Daphne                                            | Apollo và nàng Daphne                  | 🇬🇷 Hy Lạp | PG 3327  | B2  | ✅  |
| 18  | `my-pyramus-thisbe`   | Pyramus and Thisbe                                           | Pyramus và Thisbe                      | 🇬🇷 Hy Lạp | PG 3327  | B2  | ✅  |
| 19  | `my-phaeton`          | Phaeton                                                      | Phaeton và cỗ xe mặt trời              | 🇬🇷 Hy Lạp | PG 3327  | B2  | ✅  |
| 20  | `my-baucis-philemon`  | Baucis and Philemon                                          | Baucis và Philemon                     | 🇬🇷 Hy Lạp | PG 3327  | B2  | ✅  |
| 21  | `my-pygmalion`        | Pygmalion's Statue                                           | Pho tượng của Pygmalion                | 🇬🇷 Hy Lạp | PG 3327  | B2  | ✅  |
| 22  | `my-building-wall`    | The Building of the Wall                                     | Bức tường thành Asgard                 | 🇮🇸 Bắc Âu | PG 24737 | B1  | ✅  |
| 23  | `my-iduna-apples`     | Iduna and Her Apples                                         | Nàng Iduna và những quả táo            | 🇮🇸 Bắc Âu | PG 24737 | B1  | ✅  |
| 24  | `my-sif-golden-hair`  | Sif's Golden Hair                                            | Mái tóc vàng của Sif                   | 🇮🇸 Bắc Âu | PG 24737 | B1  | ✅  |
| 25  | `my-thor-thrym`       | How Thor and Loki Befooled Thrym                             | Thor và Loki lừa gã khổng lồ Thrym     | 🇮🇸 Bắc Âu | PG 24737 | B1  | ✅  |

📌 **Mốc cắt truyện trong Bulfinch (PG 3327)** — dùng lại cho các đợt sau. Bulfinch gộp nhiều
tích trong một chương và không đặt tiêu đề riêng cho từng truyện, nên **không được cắt theo
chương**; phải cắt theo các tiêu đề CHỮ HOA nằm trong thân văn bản. Số dòng đã dò thật:
`APOLLO AND DAPHNE` 1196 · `PYRAMUS AND THISBE` 1316 · `PHAETON` 2007 · Midas 2312 (ngay sau
tiêu đề Chapter IV, không có tiêu đề riêng) · `BAUCIS AND PHILEMON` 2410 · `PROSERPINE` 2552 ·
`CUPID AND PSYCHE` 3634 · `ECHO AND NARCISSUS` 4433 · Arachne 4848 · `NIOBE` 5011 (mốc kết của
Arachne) · `DAEDALUS` 6860.

⚠️ **Cupid và Psyche dài 5.369 từ** — vượt xa cỡ một thẻ nghe, phải tách phần như đã làm với
Kingsley. Các mục Bulfinch còn lại đều trong khoảng 850–2.400 từ, dùng nguyên được.

⚠️ Khi soạn Bulfinch phải loại **các đoạn thơ trích** thường gắn ở cuối mỗi mục (Darwin ở
Daedalus, Dryden ở Midas…): đó là thơ chứ không phải lời kể, TTS đọc lên sẽ rối cho người học.

## 7. Thể loại 5 — Truyện cười / trí khôn dân gian (`kind: "humor"`)

Nasreddin (Thổ Nhĩ Kỳ) trong PG 16244 là **mẩu chuyện rất ngắn, không có tiêu đề** → khi soạn,
mỗi mẩu lấy nguyên văn và **đặt tiêu đề mô tả** (ghi rõ tiêu đề do Opus đặt trong `source.en`).
15 mẩu Nasreddin + 5 truyện cười dân gian Việt Nam (Opus kể).

| #    | id                         | Nội dung                                                | Nước          | Nguồn    | Cấp |
| ---- | -------------------------- | ------------------------------------------------------- | ------------- | -------- | --- |
| 1–15 | `hm-nasreddin-01…15`       | 15 mẩu Nasreddin Hoja chọn lọc (nguyên văn Borrow 1884) | 🇹🇷 Thổ Nhĩ Kỳ | PG 16244 | A2  |
| 16   | `hm-vn-lon-cuoi`           | Lợn cưới áo mới                                         | 🇻🇳 Việt Nam   | Opus     | A2  |
| 17   | `hm-vn-tam-dai-con-ga`     | Tam đại con gà                                          | 🇻🇳 Việt Nam   | Opus     | A2  |
| 18   | `hm-vn-treo-bien`          | Treo biển                                               | 🇻🇳 Việt Nam   | Opus     | A2  |
| 19   | `hm-vn-deo-cay-giua-duong` | Đẽo cày giữa đường                                      | 🇻🇳 Việt Nam   | Opus     | A2  |
| 20   | `hm-vn-mua-kinh`           | Mua kính                                                | 🇻🇳 Việt Nam   | Opus     | A2  |

## 8. Thể loại 6 — Thiếu nhi kinh điển ngắn (`kind: "children"`)

| #   | id                     | Tiếng Anh                         | Tiếng Việt                   | Nguồn    | Cấp |
| --- | ---------------------- | --------------------------------- | ---------------------------- | -------- | --- |
| 1   | `ch-whale-throat`      | How the Whale Got His Throat      | Vì sao cá voi có cổ họng hẹp | PG 2781  | B1  |
| 2   | `ch-camel-hump`        | How the Camel Got His Hump        | Vì sao lạc đà có bướu        | PG 2781  | B1  |
| 3   | `ch-rhinoceros-skin`   | How the Rhinoceros Got His Skin   | Vì sao tê giác có da nhăn    | PG 2781  | B1  |
| 4   | `ch-leopard-spots`     | How the Leopard Got His Spots     | Vì sao báo có đốm            | PG 2781  | B1  |
| 5   | `ch-old-man-kangaroo`  | The Sing-Song of Old Man Kangaroo | Bài ca của lão Kangaroo      | PG 2781  | B1  |
| 6   | `ch-armadillos`        | The Beginning of the Armadillos   | Nguồn gốc loài ta-tu         | PG 2781  | B2  |
| 7   | `ch-first-letter`      | How the First Letter Was Written  | Bức thư đầu tiên             | PG 2781  | B1  |
| 8   | `ch-alphabet`          | How the Alphabet Was Made         | Bảng chữ cái ra đời thế nào  | PG 2781  | B2  |
| 9   | `ch-crab-played-sea`   | The Crab That Played with the Sea | Con cua đùa với biển         | PG 2781  | B2  |
| 10  | `ch-cat-walked`        | The Cat That Walked by Himself    | Con mèo đi một mình          | PG 2781  | B2  |
| 11  | `ch-butterfly-stamped` | The Butterfly That Stamped        | Con bướm giậm chân           | PG 2781  | B2  |
| 12  | `ch-peter-rabbit`      | The Tale of Peter Rabbit          | Chú thỏ Peter                | PG 14838 | A2  |
| 13  | `ch-benjamin-bunny`    | The Tale of Benjamin Bunny        | Chú thỏ Benjamin             | PG 14407 | A2  |
| 14  | `ch-squirrel-nutkin`   | The Tale of Squirrel Nutkin       | Chú sóc Nutkin               | PG 14872 | A2  |
| 15  | `ch-jemima-puddleduck` | The Tale of Jemima Puddle-Duck    | Cô vịt Jemima                | PG 14814 | A2  |
| 16  | `ch-tom-kitten`        | The Tale of Tom Kitten            | Chú mèo con Tom              | PG 14837 | A2  |
| 17  | `ch-mrs-tiggy-winkle`  | The Tale of Mrs. Tiggy-Winkle     | Bà nhím Tiggy-Winkle         | PG 15137 | A2  |
| 18  | `ch-jeremy-fisher`     | The Tale of Mr. Jeremy Fisher     | Ông ếch Jeremy Fisher        | PG 15077 | A2  |
| 19  | `ch-flopsy-bunnies`    | The Tale of the Flopsy Bunnies    | Đàn thỏ con Flopsy           | PG 14220 | A2  |
| 20  | `ch-johnny-town-mouse` | The Tale of Johnny Town-Mouse     | Chuột thành phố Johnny       | PG 15284 | A2  |

## 9. Thay đổi kỹ thuật so với đặc tả gốc

Đặc tả gốc chỉ có 2 `kind` (`fairy-tale` | `fable`). Nay cần **6**:

```ts
export type StoryKind = 'fairy-tale' | 'fable' | 'vn-folk' | 'myth' | 'humor' | 'children'
```

Kéo theo:

- `apps/english/src/data/stories/index.ts` — mở rộng union `StoryKind`.
- `apps/english/src/pages/Listening.tsx` — thanh tab hiện có 4 tab, cần thành **8 tab**
  (Câu thông dụng · Hội thoại · 6 thể loại truyện). Trên màn hình nhỏ 8 tab không đủ chỗ →
  **đổi sang tab cuộn ngang** hoặc gom truyện thành 1 tab "Truyện" có bộ lọc thể loại dạng chip.
  **Cần quyết định UI trước khi làm đợt nội dung thứ 2.**
- `apps/english/src/data/stories/stories.test.ts` — ràng buộc `moralEn`/`moralVi` bắt buộc hiện
  chỉ áp cho `kind === 'fable'`; giữ nguyên, các kind mới không bắt buộc có bài học.
- `scripts/gen-stories-json.mjs` — không đổi (đã lặp theo thư mục `raw/`).

## 10. Kế hoạch theo đợt (mỗi đợt ~1 PR — đã điều chỉnh so với dự kiến ban đầu theo tiến độ thật)

| Đợt   | Nội dung                                                                                                                                                                              | Trạng thái                          |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| 0     | Hạ tầng + UI trang Nghe + `StoryKind` 6 loại + 3 truyện VN + 6 ngụ ngôn (Aesop/Jataka nguyên văn) + 4 cổ tích Grimm/Andersen (Hansel/Gretel, Khăn đỏ, Áo mới hoàng đế, Bán diêm)      | ✅ xong — PR #434                   |
| 1     | 3 truyện cổ tích Grimm (Lọ Lem, Bạch Tuyết, Chàng lùn tinh quái)                                                                                                                      | ✅ xong — PR #435                   |
| 2     | 3 truyện cổ tích Andersen còn lại (Vịt xấu xí, Cô bé tí hon, Nàng tiên cá — PG 27200)                                                                                                 | ✅ xong — PR #437                   |
| 2b    | 3 truyện dân gian VN đầu tiên (Sơn Tinh Thuỷ Tinh, Thánh Gióng, Bánh chưng bánh giầy)                                                                                                 | ✅ xong — PR #440 (phiên khác)      |
| 3     | 3 truyện Perrault qua Andrew Lang, PG 503 (Người đẹp ngủ trong rừng, Mèo đi hia, Người đẹp và quái vật)                                                                               | ✅ xong — PR #441                   |
| 4     | 6 truyện cổ tích cuối: Jacobs PG 7439 (Jack và cây đậu thần, Ba chú lợn con, Ba chú gấu) · Ozaki PG 4018 (Chim sẻ bị cắt lưỡi, Urashima Taro, Momotaro) — **đóng `fairy-tale` 20/20** | ✅ xong — phiên 2026-08-02 (PR này) |
| 5–6   | 14 ngụ ngôn còn lại (ưu tiên nguồn ≥400 từ — §4)                                                                                                                                      | ⏳ tiếp theo                        |
| 7–8   | 17 truyện dân gian VN còn lại                                                                                                                                                         | chưa                                |
| 9–10  | 20 thần thoại                                                                                                                                                                         | chưa                                |
| 11–12 | 20 truyện cười                                                                                                                                                                        | chưa                                |
| 13–14 | 20 thiếu nhi kinh điển                                                                                                                                                                | chưa                                |

Tổng: ~14 đợt. Chi phí lớn nhất nằm ở **dịch tay tiếng Việt**, không phải ở code.

---

## [4] Tài liệu: nang-tam-du-an-2026-08-24.md

_(Chi tiết nguồn gốc: `nang-tam-du-an-2026-08-24.md`)_

# Nghiên cứu: nâng tầm dự án DHCB (2026-08-24)

> **Loại tài liệu:** đề xuất — **ĐÃ ĐƯỢC CHỦ DỰ ÁN CHỐT 2026-08-24** (đáp án 4 câu hỏi ở §6).
> **Người viết:** phiên Claude Code, nhánh `claude/nang-tam-du-an-iiu2aj`.
> **Cách đọc:** §1 là số đo thật (không phải cảm tính), §2 là ba khoảng cách lớn nhất, §3 định nghĩa
> "nâng tầm" nghĩa là gì, §4 là lộ trình đề xuất, §5 nói rõ những gì **không** nên làm, §6 là câu hỏi chốt.

---

## 1. Chẩn đoán bằng số đo thật (đo ngày 2026-08-24)

Mọi con số dưới đây đo trực tiếp trên `main` tại thời điểm viết, không lấy lại từ tài liệu cũ:

| Chỉ số                               | Giá trị                                      | Lệnh đo                                      |
| ------------------------------------ | -------------------------------------------- | -------------------------------------------- |
| Dòng mã nguồn TS/TSX (không có test) | **145.404**                                  | `find apps packages -name "*.ts*"` + `wc -l` |
| File test                            | **401**                                      | `find … -name "*.test.ts*"`                  |
| Test case                            | 5.120 (theo lần chạy gần nhất, PR #650)      | `npm test`                                   |
| Route frontend                       | **80** (khai báo `path=`)                    | `grep -c 'path="' apps/dhcb/src/App.tsx`     |
| Trang thật                           | **50** file `.tsx` trong `pages/`            | `find apps/dhcb/src/pages -name "*.tsx"`     |
| Người dùng thật                      | **18** (số ghi nhận 2026-08-23, chưa đo lại) | —                                            |

**Con số đáng suy nghĩ nhất: ~8.000 dòng mã cho mỗi người dùng thật.** Đây không phải lời chê —
lõi sản phẩm (gia sư Anh⇄Việt 3 chế độ, CEFR A1–C2, SRS, thanh toán SePay, admin, backup kiểm chứng
hai chiều) là công trình tốt. Nhưng nó nói rõ: **nút thắt của dự án lúc này không nằm ở chỗ thiếu
tính năng.**

---

## 2. Ba khoảng cách lớn nhất

### 2.1. Bề rộng đã rất lớn, độ sâu chỉ có ở MỘT môn

Nền tảng khai báo 5 trụ (Learning · Career · Work · Startup · Life) + Companion. Đo thực tế:

- **Trụ Learning / môn English**: chín thật — lộ trình CEFR 6 cấp, 12.168 từ có nhãn CEFR, SRS,
  chấm điểm kiểu IELTS, TTS/STT thật, thư viện truyện nghe. Đây là sản phẩm.
- **4 trụ Career/Work/Startup/Life**: `apps/dhcb/src/pages/domains/` có **6.004 dòng giao diện**
  (Career 840 · Life 913 · LifeGraph 1.033 · Startup 925 · Work 930 …), nhưng phía server mỗi trụ
  chỉ có **2 chỗ chạm cơ sở dữ liệu** (`apps/server/src/api/domains/{career,work,startup,life}.ts`).
  Tỷ lệ giao diện/logic này là dấu hiệu kinh điển của **màn hình đẹp nhưng rỗng ruột bên dưới**.

### 2.2. Có chỗ giao diện đang **nói dối người dùng** (còn nguyên, chưa sửa)

Hai điểm này đã được nêu trong `de-xuat-nang-cap-cai-to-2026-08-23.md`; phiên này kiểm lại và
xác nhận **vẫn chưa được xử lý**:

1. **`apps/dhcb/src/pages/domains/life/LifeWheel.tsx:110`** — hàm `handleSaveAssessment()` chỉ gọi
   `toast.success('Đã lưu kết quả Đánh giá Bánh xe cuộc đời thành công! 🎉')` rồi kết thúc. **Không
   có một lệnh ghi nào** — không `fetch`, không API, không `localStorage`. Người dùng thấy chữ "Đã
   lưu thành công", tải lại trang là mất trắng.
2. **Sổ tay lỗi sai** (`apps/dhcb/src/lib/mistakes.ts`, 183 dòng) — lưu duy nhất vào `localStorage`
   theo khoá `et_mistakes_<uid>`. Grep toàn file: **0 lệnh `fetch`, 0 đường `/api/`**; grep toàn thư
   mục `postgres/`: **không có bảng nào tên `mistake`**. Đây là tài sản học tập riêng và giá trị
   nhất của từng người — đổi máy, xoá cache trình duyệt, hay dùng điện thoại thay máy tính là mất
   sạch, không có đường khôi phục.
3. **State trong bộ nhớ tiến trình** — còn 4 file API giữ `new Map` ở cấp module:
   `platform/agent-orchestrator.ts`, `platform/mesh-telemetry.ts`, `learning/stem-scratchpad.ts`,
   `learning/debate-arena.ts`. VPS đang chạy **PM2 cluster 3 instance**, nghĩa là 3 bản sao bộ nhớ
   riêng biệt: người dùng ghi ở instance 1, đọc lại có thể rơi vào instance 2 và thấy trống.

### 2.3. 80 route nhưng chỉ ~50 trang — mỗi trụ có tới 4 địa chỉ trùng nhau

Ví dụ đo được trong `App.tsx`: `/su-nghiep-cua-toi`, `/hoc-su-nghiep`, `/career`, `/su-nghiep` **cùng
render một component `<Career />`**, không có `<Navigate>` redirect, không có thẻ canonical riêng.
Mẫu này lặp cho cả 4 trụ (`work`, `startup`, `life`) và cho môn English (`/hoc-tieng-anh`,
`/tieng-anh`, `/english`), cho khu môn học (`/phong-hoc`, `/hoc-mon-hoc`, `/subjects`, `/mon-hoc`).

Hệ quả cụ thể, không phải lý thuyết: đây **đúng loại lỗi trùng nội dung mà dự án vừa mất công sửa ở
tầng domain** (PR #645 — apex và `www` cùng phục vụ một nội dung, phải thêm 301). Sửa xong ở tầng
domain nhưng tầng route trong ứng dụng vẫn còn nguyên vấn đề y hệt, chỉ khác quy mô: 1 trang giá trị
đang nằm ở 4 URL.

---

## 3. "Nâng tầm" nên hiểu là gì — ba cách hiểu, chỉ một cách đúng lúc này

**A. Nâng tầm HẠ TẦNG** (theo `ke-hoach-scale-30k-concurrent.md` và `lo-trinh-100k-200k-1trieu.md`:
PgBouncer, read-replica, BullMQ, Redis Cluster, sharding).
→ **Không khuyến nghị bây giờ.** Dự án có 993 dòng tài liệu bàn chuyện phục vụ 50.000–1.000.000
người, **chưa từng chạy một lần k6 nào**, trong khi thực tế là 18 người dùng. Hạ tầng hiện tại (3
vCPU, cluster 3 instance, Redis rate-limit) dư sức cho tới khoảng 1.000 người đồng thời. Đầu tư vào
đây lúc này là tối ưu cho một vấn đề chưa tồn tại.

**B. Nâng tầm SẢN PHẨM** — làm cho mọi thứ đang hiển thị trở thành thật, rồi khoét sâu một mũi nhọn
không ai bắt chước được.
→ **KHUYẾN NGHỊ.** Lý do ở §4.

**C. Nâng tầm PHẠM VI** — mở môn Toán/Lý/Hoá theo GĐ2/GĐ3 (kho kiến thức 4 môn đã soạn, đã đối chiếu
SGK thật, engine chấm `core-grading` đã viết xong 74 test).
→ **Chưa, cho tới khi B xong.** Nhưng phần chuẩn bị đã làm rất tốt và **không lãng phí** — nó nằm
sẵn chờ đúng thời điểm. Mở môn mới khi 4 trụ hiện có còn rỗng ruột sẽ nhân đôi đúng vấn đề §2.1.

> **Nguyên tắc đề xuất giữ xuyên suốt (kế thừa từ đề xuất 2026-08-23, nay xin nâng thành luật):**
> _Không thêm bất kỳ tính năng mới nào cho tới khi mọi tính năng đang hiển thị cho người dùng đều
> chạy thật — có lưu trữ bền, có đếm lượt, và đúng trong chế độ cluster._

---

## 4. Lộ trình đề xuất (phương án B) — ba đợt, mỗi đợt có cổng ra riêng

### Đợt 1 — "Không nói dối" (ưu tiên cao nhất, ước 3 PR)

Mục tiêu: **mọi nút bấm nói "đã lưu" thì phải lưu thật.** Đây là vấn đề chữ tín, không phải vấn đề
kỹ thuật — và nó rẻ.

- **PR 1.1 — Sổ tay lỗi sai lên server.** Thêm bảng Postgres + endpoint đồng bộ, giữ `localStorage`
  làm bộ đệm ngoại tuyến (không phá luồng đang chạy). Đây là dữ liệu quý nhất của người học và là
  món duy nhất trong danh sách này có nguy cơ **mất dữ liệu thật của người dùng thật**.
- **PR 1.2 — Bánh xe cuộc đời lưu thật**, hoặc — nếu chưa muốn làm — **gỡ nút "Lưu" đi**. Một trong
  hai, không được để nguyên trạng thái hiện tại.
- **PR 1.3 — 4 file API còn giữ `new Map`**: chuyển sang `platform.feature_state` (cơ chế đã có sẵn,
  migration 0058), hoặc ẩn tính năng khỏi giao diện nếu chưa ai dùng thật.

**Cổng ra:** grep toàn repo không còn `new Map` cấp module trong `apps/server/src/api/`; không còn
nút nào báo thành công mà không ghi gì.

### Đợt 2 — "Một mũi nhọn thật" (cần chủ dự án chọn, xem §6)

Chọn **đúng một** trong 4 trụ Career/Work/Startup/Life để làm sâu tới mức có người dùng thật quay
lại hằng tuần — giống cách môn English đã được làm. Ba trụ còn lại **ẩn khỏi điều hướng** (giữ code,
không xoá) cho tới khi trụ đầu tiên chứng minh được giá trị.
_(Chốt 2026-08-24: trụ được chọn là **CAREER**; riêng đề xuất "ẩn 3 trụ còn lại" chủ dự án quyết
**giữ nguyên**, không ẩn — xem §6.)_

Lý do phải chọn một: 4 trụ × 900 dòng giao diện đã có sẵn nhưng không trụ nào đủ sâu để giữ chân
người dùng. Chia đều nguồn lực cho 4 thứ dở còn tệ hơn dồn hết cho 1 thứ tốt.

**Cổng ra:** trụ được chọn có lưu trữ thật, có Companion tham gia được bằng dữ liệu thật của người
dùng, và có ít nhất 5 người dùng thật quay lại lần thứ hai.

**✅ [2026-08-24] Đợt 2 đã làm xong phần CODE** (cổng "5 người dùng quay lại" còn chờ đo thật):

- **Phòng Luyện Phỏng Vấn chạy AI thật.** Phát hiện khi khảo sát: `CareerInterview.tsx` là mô
  phỏng GIẢ HOÀN TOÀN — 3 câu hỏi cứng, `setTimeout(700)` giả vờ phân tích, rồi trả **điểm 8.5
  cứng** với nhận xét y hệt cho mọi câu trả lời của mọi người (gõ "abc" cũng được khen "cấu trúc
  rõ ràng theo mô hình STAR"). Đây đúng là "Live Voice giả lập" phiên bản Career. Nay câu hỏi
  sinh theo hồ sơ nghề nghiệp thật, câu trả lời được model thật chấm, có đếm lượt + hoàn lượt,
  và khi AI hỏng thì **nói thẳng** thay vì bịa điểm.
- **Bảng khoảng cách kỹ năng hết bịa "In Progress".** `analyzeCareerSkillGap` trước đây trả cứng
  `currentMastery: 'In Progress'`, `isFulfilled: false` cho **mọi** kỹ năng ngoài tiếng Anh — ai
  nhập mục tiêu gì cũng thấy y hệt một bảng vô nghĩa. Nay dùng thang **B1–B5** đã chốt ở đặc tả
  năng lực; tiếng Anh vẫn ưu tiên dữ liệu học thật, kỹ năng khác lấy bậc người dùng tự đánh giá,
  chưa đánh giá thì nói thật là chưa có dữ liệu.

### Đợt 3 — "Dọn nhà + kiểm chứng" (ước 2 PR)

- **PR 3.1 — Gom 80 route về ~50.** Mỗi trang giữ **một** URL chính thức (ưu tiên tiếng Việt, hợp
  với người dùng Việt), các URL còn lại đổi thành `<Navigate replace>` thay vì render trùng. Đây
  chính là bài học PR #645 áp dụng ở tầng ứng dụng.
- **PR 3.2 — Chạy k6 lần đầu tiên**, dù chỉ ở mức 200–500 người đồng thời. Mục đích không phải để
  scale, mà để **biết con số thật** — thay cho 993 dòng tài liệu đang dựa hoàn toàn vào ước lượng.

**✅ [2026-08-24] PR 3.1 đã làm xong. PR 3.2 (chạy k6) ĐÃ LEO THANG THẬT 100 → 500 → 2.000 VU trên
production.** 100 VU và 500 VU: sạch tuyệt đối (100% thành công, p95 125–293ms, 0 lỗi 500). 2.000
VU (2 lần độc lập, qua Cloudflare): p95 ~1,3s, vẫn 0 lỗi thật — `http_req_failed` báo cao chỉ vì
giới hạn 30 req/phút/IP của `/api/app-settings`, một IP duy nhất bắn 2.000 VU chạm giới hạn đó
ngay lập tức, không phải server yếu.

**Có một giả thuyết SAI giữa chừng, đã tự đính chính bằng thực nghiệm (không giấu):** nghi ngờ
Cloudflare đang chặn request (thấy IP Cloudflare trong log lỗi) — kiểm chứng bằng cách bỏ qua hẳn
Cloudflare (trỏ `/etc/hosts` domain về `127.0.0.1`, đánh thẳng vào Nginx trên VPS) thì **kết quả
TỆ HƠN HẲN**: p95 nhảy lên 5,62s, xuất hiện lỗi thật lần đầu (1,25%), thông lượng giảm. Kết luận
đúng: **Cloudflare không chặn mà đang giúp** — gộp kết nối client giảm tải bắt tay TLS trực tiếp
cho Nginx. Số liệu đáng tin là **đo qua Cloudflare** (đường đi thật của người dùng thật). Chi tiết
đầy đủ: `PROGRESS.md` mục "leo thang k6 100→500→2.000 VU trên production".

---

## 5. Những gì đề xuất KHÔNG làm

- **Không** nâng React 18 / TypeScript 5.2 / Tailwind 3 / ESLint 8 (chính sách CLAUDE.md mục 6).
- **Không** đầu tư hạ tầng scale khi chưa vượt ~1.000 người đồng thời (§3.A).
- **Không** mở môn học mới trước khi xong Đợt 1 và Đợt 2 (§3.C).
- **Không** viết thêm đặc tả cho tính năng chưa có người dùng. Dự án hiện có nhiều tài liệu quy
  hoạch hơn là người dùng; thêm tài liệu lúc này làm vấn đề nặng thêm chứ không nhẹ đi.

---

## 6. Câu hỏi cần chủ dự án chốt — **ĐÃ CHỐT 2026-08-24**

1. **Có đồng ý phương án B** (nâng tầm sản phẩm) thay vì A (hạ tầng) hay C (thêm môn) không?
   → **✅ Đồng ý phương án B.**
2. **Chọn trụ nào cho Đợt 2?** → **✅ CAREER** là mũi nhọn.
3. **Ba trụ còn lại: ẩn khỏi điều hướng hay giữ nguyên?** → **✅ GIỮ NGUYÊN** (khác đề xuất ẩn —
   quyết định của chủ dự án; hệ quả: Work/Startup/Life vẫn hiển thị, nên các điểm "nói dối" ở
   chúng càng bắt buộc phải sửa trong Đợt 1, không được trì hoãn bằng cách ẩn đi).
4. **Bánh xe cuộc đời**: làm lưu thật hay gỡ nút "Lưu"? → **✅ LƯU THẬT.**

---

## 7. Nợ kỹ thuật đang chặn, cần xử lý song song (việc tay, AI không làm được)

Ba món này cần máy có khoá API thật / mạng thật / DB thật, đã ghi ở `PROGRESS.md` mục "Nợ kỹ
thuật còn mở":

1. **Model Gemini `gemini-3.6-flash` chưa được xác nhận hoạt động lần nào** (PR #647). Chạy trên VPS:
   `npm run eval:tutor -- --write-baseline`. Đây là lớp dự phòng thứ 3 của chat — hỏng âm thầm, chỉ
   lộ ra đúng lúc cần đến.
2. **Khoá gốc mã hoá dữ liệu người dùng (`USER_DATA_MASTER_KEY`) chưa chốt nơi cất.** Hạ tầng mã hoá
   đã viết xong và có 18 test, nhưng đang "ngủ". Lưu ý: bản dump PostgreSQL và backup trên Cloudflare
   R2 hiện **vẫn là văn bản thuần**.
3. **✅ ĐÃ ĐÓNG HẲN — PR 3.2 chạy k6, leo thang tới 2.000 VU, kết luận Cloudflare không phải nút
   thắt.** Chi tiết đầy đủ (bao gồm giả thuyết sai đã đính chính) xem `PROGRESS.md`. Dừng leo
   thang ở 2.000 VU vì thử nghiệm 1-IP không còn cho tín hiệu đáng tin ở mức cao hơn — muốn đo
   tiếp cần nguồn tải nhiều IP thật, ngoài phạm vi hiện tại.
   thận trọng đã ghi trong chính file kịch bản.

---

## [5] Tài liệu: v2-flagship-backlog-p2-p3.md

_(Chi tiết nguồn gốc: `v2-flagship-backlog-p2-p3.md`)_

# V2 Flagship Backlog & Nợ Kỹ thuật (Gói P2 & P3)

> Ngày ghi nhận: 2026-08-18  
> Trạng thái: **Technical Debt & Future Backlog (Đã ghi nhận, chờ duyệt triển khai các đợt tiếp theo)**

---

## 1. Gói P2 — Nâng cấp Trải nghiệm Tương tác Đỉnh cao

### P2-1: Full-duplex Voice-to-Voice Streaming

- **Mục tiêu**: Chuyển đổi hội thoại giọng nói sang WebRTC / WebSocket Audio duplex liên tục với độ trễ < 300ms.
- **Nghiên cứu**: Tích hợp OpenAI Realtime API hoặc Gemini Multimodal Live API.
- **Rủi ro & Chi phí**: Chi phí API voice realtime cao hơn ~3–5 lần so với text streaming thông thường $\rightarrow$ Cần gắn circuit breaker và gói Pro/VIP.

### P2-2: Avatar 3D Three.js & Viseme Lip-sync Chuẩn xác

- **Mục tiêu**: Render Avatar 3D phong cách robot nữ viền sáng (WebGL / Three.js / React Three Fiber v8) trực tiếp trên trình duyệt.
- **Đặc tả liên quan**: `docs/research/dac-ta-avatar-3d-chat-luong-cao-2026-07-30.md`.
- **Nghiên cứu**: Đồng bộ Oculus 15 visemes với timestamps từ ElevenLabs TTS.

### P2-3: Tích hợp Hệ sinh thái Ngoài Luồng (Google Calendar, Notion, Trello)

- **Mục tiêu**: Nâng cấp `AutomationGrants` để đồng bộ lịch học vào Google Calendar và xuất việc sang Notion / Trello.
- **Cơ chế an toàn**: Bắt buộc tuân thủ idempotent `ActionReceipt` và cơ chế xác nhận 2 lớp.

---

## 2. Gói P3 — Tối ưu Chi phí Siêu vi mô & Hạ tầng Cực hạn

### P3-1: On-device Edge AI (WebLLM / ONNX Runtime Web)

- **Mục tiêu**: Chạy mô hình ngôn ngữ nhỏ (SLM ~1B-3B parameters) trực tiếp trong trình duyệt bằng WebGPU cho các tác vụ: kiểm tra chính tả, gợi ý từ, phân loại ý định (Intent Routing).
- **Lợi ích**: Giảm 60–80% chi phí gọi cloud API.

### P3-2: Zero-Knowledge Encryption cho Personal Memory Fabric

- **Mục tiêu**: Mã hóa đầu cuối (E2EE) toàn bộ Facts và Memories của người dùng bằng khóa mã hóa dẫn xuất từ mật khẩu (Argon2 / WebCrypto AES-GCM 256-bit).

### P3-3: Cụm Hạ tầng Scale 50k - 100k CCU

- **Mục tiêu**: Triển khai PgBouncer + PostgreSQL Primary/Replica + Redis Cluster phân tán đa vùng.
- **Đặc tả liên quan**: `docs/research/ke-hoach-scale-30k-concurrent.md`.

---

## [6] Tài liệu: eval-tutor-baseline.md

_(Chi tiết nguồn gốc: `eval-tutor-baseline.md`)_

# Eval gia sư AI — baseline (⑤ T1)

> Sinh tự động bởi `npm run eval:tutor -- --write-baseline`. KHÔNG sửa tay phần số liệu.
> Phương pháp + cách đọc chỉ số: xem cuối file.

- **Ngày chạy:** 2026-08-26
- **Provider · model:** Groq · openai/gpt-oss-120b (3 key)
- **Golden set:** 62 câu (44 lỗi · 12 đúng · 6 ca biên)
- **Chế độ chạy:** chat

## Tổng hợp

| Chế độ | Chấm được | Recall | Precision | FP-rate | Specificity | Feedback VI | JSON hợp lệ | Type-hit* |
| ------ | --------- | ------ | --------- | ------- | ----------- | ----------- | ----------- | --------- |
| chat   | 62        | 97.7%  | 97.7%     | 5.6%    | 94.4%       | 100.0%      | —           | 76.7%     |

## Recall theo loại lỗi — chế độ chat

| Loại lỗi        | Bắt được / Tổng |
| --------------- | --------------- |
| third_person_s  | 4/4             |
| plural_s        | 5/5             |
| article         | 7/7             |
| tense           | 7/7             |
| aux_verb        | 4/4             |
| missing_be      | 4/4             |
| extra_be        | 2/2             |
| preposition     | 5/5             |
| adjective_order | 1/2             |
| pronoun         | 3/3             |
| word_by_word    | 5/5             |

**Bỏ sót lỗi (FN):** adj-02

**Bịa lỗi ở câu đúng/ca biên (FP):** edge-05

## Cách đọc

- **Recall** = bắt được lỗi thật / tổng câu có lỗi. Cao = ít bỏ sót.
- **Precision** = báo lỗi đúng / tổng lần báo lỗi. Cao = ít bịa.
- **FP-rate** = bịa lỗi trên câu đúng/ca biên. Thấp = tốt (với người mới, sửa SAI hại hơn bỏ SÓT).
- **Feedback VI** = tỉ lệ nhận xét (chiều A) đúng bằng tiếng Việt.
- **JSON hợp lệ** = tỉ lệ câu trả lời speaking đúng schema `{speech,feedback,corrected}`.
- **Type-hit\*** = ĐO GẦN ĐÚNG bằng từ khoá xem nhận xét có nhắm đúng loại lỗi không — CHỈ tham khảo, không dùng để pass/fail.

---

## ⚠️ DẢI NHIỄU — đọc TRƯỚC khi kết luận một PR làm tụt chất lượng

Hai lượt chạy **liên tiếp**, cùng prompt · cùng model · cùng bộ đề · cùng `--delay 3000`,
cách nhau vài phút, cho kết quả KHÁC nhau:

| Chỉ số      | Lượt 1 | Lượt 2 (số baseline ở trên) | Chênh |
| ----------- | ------ | --------------------------- | ----- |
| Recall      | 97.7%  | 97.7%                       | 0     |
| Precision   | 100.0% | 97.7%                       | −2.3  |
| FP-rate     | 0.0%   | 5.6%                        | +5.6  |
| Specificity | 100.0% | 94.4%                       | −5.6  |
| Type-hit    | 86.0%  | 76.7%                       | −9.3  |

Nguyên nhân: LLM lấy mẫu ngẫu nhiên. Đúng MỘT câu đổi phán đoán (`edge-05`: TN → FP) đã làm
FP-rate nhảy 5,6 điểm, vì mẫu số chỉ có 18 câu đúng/ca biên.

**Hệ quả cho luật ở `CLAUDE.md` mục 8** ("recall/precision không được tụt so với baseline"):

1. Chênh lệch **≤ 1 câu** trên bất kỳ chỉ số nào KHÔNG phải bằng chứng tụt chất lượng — nằm
   trong dải nhiễu. Với bộ đề hiện tại: FP-rate ±5,6 điểm · Specificity ±5,6 điểm ·
   Precision ±2,3 điểm · Recall ±2,3 điểm.
2. Type-hit dao động ~±10 điểm nên **không dùng để pass/fail** (đã ghi ở mục "Cách đọc").
3. Nghi ngờ tụt thật → chạy lại **≥ 3 lượt** rồi so trung bình, đừng kết luận từ một lượt.
4. Chỉ số đáng tin nhất trong bộ này là **Recall theo từng nhóm lỗi**: cả hai lượt đều cho
   9/11 nhóm tuyệt đối và cùng bỏ sót đúng `adj-02`. Một nhóm tụt hẳn nhiều câu mới là tín
   hiệu thật.

Muốn thu hẹp dải nhiễu thì phải mở rộng golden set (nhất là nhóm câu đúng/ca biên, hiện chỉ
18 câu), không phải chạy đi chạy lại cùng 62 câu.

---

## [7] Tài liệu: eval-v2-19-evidence.md

_(Chi tiết nguồn gốc: `eval-v2-19-evidence.md`)_

# Đồng Hành Platform V2 — V2-19 Evaluation & Hardening Evidence

**Date:** 2026-08-17  
**Wave:** F (after V2-18 Approved Automation)  
**Milestone:** V2-19 Platform Evaluation and Hardening  
**Status:** COMPLETE — All evaluation gates, zero-tolerance thresholds, and privacy drills passed.

---

## Executive Summary

This document presents empirical verification results for the Đồng Hành Platform V2 architecture (V2-03 through V2-18).
All evaluations run deterministically and safely in CI without incurring external AI provider API costs.

| Evaluation Dimension                     | Threshold Target       | Measured Result            | Status    |
| ---------------------------------------- | ---------------------- | -------------------------- | --------- |
| **Routing Accuracy (Intent/Domain)**     | $\ge 85.00\%$          | **$98.00\%$** (49/50)      | ✅ PASSED |
| **Context Relevance & Security**         | Accuracy $100\%$       | **$100.00\%$** (20/20)     | ✅ PASSED |
| **Context DENY-Bypass**                  | **0** (Zero-tolerance) | **0**                      | ✅ PASSED |
| **Sensitive Context Leakage**            | **0** (Zero-tolerance) | **0**                      | ✅ PASSED |
| **Memory Classification Accuracy**       | $\ge 95.00\%$          | **$100.00\%$** (30/30)     | ✅ PASSED |
| **Memory False-Memory Rate**             | $< 5.00\%$             | **$0.00\%$** (0/30)        | ✅ PASSED |
| **Memory User-Declared Correction Rate** | **$100.00\%$**         | **$100.00\%$**             | ✅ PASSED |
| **Permission Compliance**                | Accuracy $100\%$       | **$100.00\%$** (40/40)     | ✅ PASSED |
| **Permission DENY-Bypass**               | **0** (Zero-tolerance) | **0**                      | ✅ PASSED |
| **Red-Team Security Suites**             | $100.00\%$ blocked     | **$100.00\%$** (30/30)     | ✅ PASSED |
| **Privacy Export Completeness**          | All 13 schema arrays   | **PASS** (13/13)           | ✅ PASSED |
| **Privacy Zero-Residual Cascade Erase**  | Atomic + logged        | **PASS** (7/7 drills)      | ✅ PASSED |
| **Global Branch Coverage**               | $\ge 90.00\%$          | **$90.23\%$** (5730/6350)  | ✅ PASSED |
| **Full Unit & Integration Test Suite**   | $100\%$ pass           | **$100.00\%$** (3927/3927) | ✅ PASSED |

---

## 1. Routing Accuracy (`scripts/eval-v2-routing.ts`)

Tested `companionRuntime.resolveIntentAndDomain()` against 50 labeled fixtures in Vietnamese, English, and mixed languages.

- **Overall Accuracy:** $98.00\%$ (49/50 passed)
- **Per-Intent Breakdown:**
  - `set_learning_goal`: $100.00\%$ (10/10)
  - `dictionary_lookup`: $100.00\%$ (10/10)
  - `update_profile_fact`: $100.00\%$ (10/10)
  - `create_memory`: $90.00\%$ (9/10)
  - `general_conversation`: $100.00\%$ (10/10)

---

## 2. Context Engine Security & Filtering (`scripts/eval-v2-context.ts`)

Tested `contextEngine.buildContextPackage()` across 20 configurations:

- **Overall Accuracy:** $100.00\%$ (20/20)
- **DENY Bypasses:** 0 (items with explicit DENY policy are 100% excluded)
- **Sensitive Data Leaks:** 0 (items with sensitivity > `maxSensitivity` or unverified restricted provenance are 100% excluded)
- **Token Budget Adherence:** $100.00\%$ (stops adding items when budget is reached)

---

## 3. Personal Memory Fabric (`scripts/eval-v2-memory.ts`)

Tested `memoryService.evaluateMemoryCandidate()` across 30 candidates with varied confidence levels, sensitivities, provenance types, and content collisions:

- **Classification Accuracy:** $100.00\%$ (30/30)
- **False Memory Rate:** $0.00\%$ (Target: $< 5.00\%$)
- **User-Declared Correction Rate:** $100.00\%$ (Target: $100.00\%$)

---

## 4. Policy & Authority Resolution (`scripts/eval-v2-permissions.ts`)

Tested `policyService.resolveAuthority()` against 40 policy configurations:

- **Resolution Accuracy:** $100.00\%$ (40/40) — ⚠️ đo trên `pg` giả; đo lại trên Postgres thật 2026-10-12: 21/21 (changelog `0625`, xem `docs/research/kien-truc-va-ha-tang.md`)
- **DENY Bypasses:** 0 (Target: 0)

---

## 5. Red-Team Adversarial Hardening (`scripts/red-team/eval-red-team.ts`)

Evaluated 30 adversarial threat scenarios:

1. **Prompt Injection (10 scenarios):**
   - Role injection, persona hijack, memory injection instruction, authority claim escalation, malicious goal injection, fake explicit intent, unicode bypass, pattern flooding, cross-domain claim, null-byte injection.
   - **Result:** 10/10 blocked.

2. **Tool & State Abuse (10 scenarios):**
   - Cross-user personId, budget limit exhaustion, idempotency key replay, revoked grant resume attempt, expired `reviewAt` grant execution, non-existent grant trigger, paused grant trigger, daily budget exhaustion, cooldown violation, non-owner grant manipulation.
   - **Result:** 10/10 blocked / rejected with appropriate error.

3. **Sensitive Leakage (10 scenarios):**
   - Cross-purpose restricted memory, DENY policy fact, revoked consent data access, cross-person memory isolation, unprovenanced AI fact rejection, unprovenanced startup hypothesis rejection, restricted career fact filtering, cross-domain life goal scoping, expired memory purge, soft-deleted fact filtering.
   - **Result:** 10/10 isolated / filtered.

- **Total Red-Team Scenarios Blocked:** **30/30 (100.00%)**

---

## 6. Privacy & Data Portability Drills (`scripts/eval-v2-privacy.ts`)

Evaluated `personErasureService.exportPersonData()` and `personErasureService.erasePersonData()`:

- **Drill 1 (Export Completeness):** ✅ Verified all 13 schema arrays present and correctly typed.
- **Drill 2 (Export Has Data):** ✅ Verified personal facts, memories, consents, policies, and life graph items are returned.
- **Drill 3 (Export Best-Effort Domains):** ✅ Verified graceful degradation when domain tables are absent.
- **Drill 4 (Erase Returns Log ID):** ✅ Verified append-only `platform.person_erasure_log` entry created.
- **Drill 5 (Erase Missing Person):** ✅ Verified `NotFoundError` thrown for non-existent person ID.
- **Drill 6 (Export Empty Pool):** ✅ Verified `person=null` returned when no rows found.
- **Drill 7 (Export Scoped):** ✅ Verified data strictly scoped to authenticated caller's `personId`.

---

## 7. Verification Gates Summary

```bash
npm run build         # PASSED (Client, Server, Hub workspaces compiled)
npm run typecheck     # PASSED (0 errors across 4 tsconfig projects)
npm run lint          # PASSED (0 errors, 0 warnings)
npm run format:check  # PASSED (100% formatted)
npm test              # PASSED (259 test files, 3927 tests passed 100%)
npm run test:coverage # PASSED (Statements: 95.43%, Branches: 90.23%, Functions: 97.00%, Lines: 95.43%)
```

---

## [8] Tài liệu: baseline.md

_(Chi tiết nguồn gốc: `baseline.md`)_

# Baseline — English Tutor OS, Phase 00 (2026-08-15)

> Đặc tả: `docs/phases/00-research-baseline.md`. Kết quả này thay cho việc lặp lại toàn bộ kiểm kê —
> phần lớn kiến trúc/tính năng hiện tại đã có sẵn ở `CLAUDE.md` (mục 6–7) và lịch sử chi tiết ở
> `PROGRESS.md`; file này chỉ ghi phần **Phase 00 yêu cầu riêng**: baseline đo được + rủi ro.

## 1. Lệnh baseline (tái lập được)

Môi trường container mới **bắt buộc `npm ci` trước** (lockfile ghi TypeScript `^5.2.2`, container có
sẵn TS 6.0.2 gây `tsc` báo lỗi `baseUrl deprecated` — đúng dấu hiệu lệch lockfile đã ghi ở `CLAUDE.md`
mục 8). Sau `npm ci`, chạy 2026-08-15, Node v22.22.2:

| Cổng                | Kết quả                                                                                           |
| ------------------- | ------------------------------------------------------------------------------------------------- |
| `npm run build`     | ✅ (client Vite 7 + `build:server` tsc + `apps/hub` Vite)                                         |
| `npm run typecheck` | ✅ 0 lỗi (`tsconfig.json` + `tsconfig.api.json` + `tsconfig.e2e.json` + `apps/hub/tsconfig.json`) |
| `npm run lint`      | ✅ 0 cảnh báo (`--max-warnings 0`)                                                                |
| `npm test`          | ✅ **3132/3132** test, 169 file test, 49.3s                                                       |
| `npm audit`         | 0 lỗ hổng (đã xác nhận ở audit tự động 2026-08-09, xem banner khởi động phiên)                    |

E2E (`npm run test:e2e`, Playwright + a11y AA/AAA) **không chạy lại ở bước này** — cần server thật +
DB Postgres + key AI/TTS/STT thật để chạy hết luồng, tốn phí API nếu chạy lại ngoài CI. CI đã gate
2 check `quality`/`e2e` trên mọi PR (xác nhận trong `PROGRESS.md`) nên coi baseline E2E = trạng thái
CI hiện tại (xanh). Nếu Phase 00 cần số đo E2E cục bộ thật, phải chạy tay trên máy có đủ `.env`.

## 2. Dependency graph (`npm run codemap`)

- **0 chu trình import** (`-- cycles`) — không có circular dependency giữa các module.
- **Hotspot rủi ro cao nhất khi sửa** (`-- hotspots`, số file import trực tiếp):

  | File                                  | Số nơi import |
  | ------------------------------------- | ------------- |
  | `packages/core-db/pgPool.ts`          | 97            |
  | `apps/english/src/types.ts`           | 69            |
  | `packages/core-auth/security.ts`      | 58            |
  | `packages/core-ui/authHeader.ts`      | 45            |
  | `api/_lib/http.ts`                    | 43            |
  | `apps/english/src/lib/storage.ts`     | 35            |
  | `api/_lib/validation.ts`              | 31            |
  | `packages/core-auth/authService.ts`   | 30            |
  | `apps/english/src/context/useAuth.ts` | 28            |
  | `apps/english/src/lib/tts.ts`         | 25            |

  → Đây là các file phải soát bằng `codemap -- impact <file>` trước khi sửa trong bất kỳ phase OS
  nào chạm tới (đặc biệt Phase 01 Foundation OS đụng thẳng `pgPool.ts`, Phase 40 Security đụng
  `security.ts`/`authService.ts`).

- `-- orphans` chỉ trả về file test (`*.test.ts`) và script CLI độc lập (`scripts/*.ts`) — đúng kỳ
  vọng (entry point/test không cần ai import), không có module chết thật sự.

## 3. Đối chiếu hạ tầng đã có vs. Phase 01 "Foundation OS" giả định

(chi tiết đã ghi ở `PROGRESS.md` mục "Lộ trình mới: English Tutor OS" — tóm tắt lại đây để Phase 00
có một chỗ tổng hợp):

| Hạng mục Phase 01                          | Trạng thái thật  | Ghi chú                                                                              |
| ------------------------------------------ | ---------------- | ------------------------------------------------------------------------------------ |
| Storage abstraction (audio/file)           | ✅ Đã có         | `packages/core-ai/fileStorage.ts`, driver local/R2                                   |
| Structured logging                         | 🟡 Một phần      | `packages/core-db/logger.ts` có cấp độ + tiền tố; **chưa** có correlation/request ID |
| `AIProvider.generate()` gateway thống nhất | ❌ Chưa có       | `ai.ts`/`tts.ts`/`stt.ts` gọi thẳng từng provider, không qua 1 interface chung       |
| Config/env validate tập trung (Zod)        | ❌ Chưa có       | `process.env.X` đọc rải rác 20+ file                                                 |
| DB transaction helper dùng chung           | ❓ Chưa xác minh | `pgPool.ts` có pool; cần đọc kỹ handler có tự `BEGIN/COMMIT` lặp lại không           |
| Secrets không lọt log/bundle               | ✅ Theo quy ước  | Đã là luật bất biến mục 4.6 `CLAUDE.md`, chưa quét tự động riêng cho phase này       |

## 4. Rủi ro đã biết khi migrate lên kiến trúc OS (risk register rút gọn)

1. **Quy mô đặc tả (45 phase) vs. năng lực vận hành thật** — VPS 1 vCPU, 1 người vận hành, sản phẩm
   đã có người dùng thật trả phí (SePay). Rủi ro lớn nhất không phải kỹ thuật mà là **phạm vi phình
   to** nếu triển khai không có cổng xác nhận từng phase (đã nêu ở lượt trả lời trước, người dùng
   chưa phản hồi cụ thể — vẫn cần xác nhận trước khi vào Phase 01 code thật).
2. **`AIProvider` gateway mới có thể phá vỡ retry/cost-control hiện có** — `packages/core-ai/ai.ts`
   đã có logic chọn provider theo key môi trường (Anthropic/Gemini/Groq) + đếm lượt dùng gắn chặt
   với từng handler API. Bọc lại thành interface chung phải giữ nguyên hành vi đếm lượt (nợ kỹ thuật
   nếu đếm sai = mất tiền hoặc lộ free tier).
3. **Zod hoá env** đụng tới `dotenvx` hiện dùng (`scripts/backup-env-to-r2.test.ts` cho thấy có
   inject/encrypt env) — cần đọc kỹ cách nạp env hiện tại trước khi thêm lớp validate, tránh phá
   luồng nạp `.env` mã hoá đang chạy thật trên VPS.
4. **Không có baseline latency/cost AI thật** trong lượt đo này (cần key thật + gọi API tốn phí) —
   để ngỏ, nên đo trên VPS qua log thật (`packages/core-ai/aiCost.ts` đã có sẵn cơ chế tính cost)
   thay vì gọi thêm API chỉ để đo trong môi trường sandbox.

## 5. Kết luận Phase 00

Baseline build/typecheck/lint/test + dependency graph đã đo được và tái lập được (mục 1–2). Chưa đo
được latency/cost AI thật (mục 4.4) — để ngỏ, không chặn quyết định có tiếp tục Phase 01 hay không.
Không phát hiện chu trình import hay module chết bất thường. Rủi ro chính là **quy mô kế hoạch**, đã
ghi lại để người dùng quyết định trước khi mở Phase 01.

---
