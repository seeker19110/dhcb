# 0477 — Chuyển skill sang `.claude/skills/` đợt 1: `ui-ux` + `marketing-content-writer`, kèm cổng chống mô tả bịa (2026-10-02)

- **Ngày:** 2026-10-02 · **PR:** (điền sau khi tạo) · **Loại:** `chore(skills)`.
- **Nối tiếp:** đề xuất (1) đợt 2 tích hợp ECC (ADR-0013). Claude Code **không nạp**
  `.agents/skills/`; nó chỉ nạp `.claude/skills/<tên>/SKILL.md`. Chủ dự án chọn phương án **"Rà
  & viết lại rồi chuyển"**:
  - mỗi skill bỏ hoặc đánh dấu "chưa có" phần không tồn tại, sửa đường dẫn đã dời, rồi chuyển;
  - giữ bản `.agents/` cho công cụ khác (Antigravity/Codex);
  - nhiều PR nhỏ.

## Vì sao phải rà trước khi chuyển

Skill trong `.claude/skills/` được **tự nạp** vào mọi phiên, và tác tử tin nội dung đó là thật.
Đợt rà 2026-10-02 thấy 9/11 skill nhắc tới file hoặc tính năng không tồn tại. Chuyển nguyên sang
là dạy tác tử thiết kế theo thứ không có.

Đợt này làm hai skill ít lỗi nhất, kèm hạ tầng dùng chung cho các đợt sau.

## Việc đã làm

### A. `ui-ux` — viết lại mục 1 theo 4 studio THẬT

Bản cũ mô tả "5 Focus Studios & Gamification Hub" không khớp mã:

- Có **studio 5 "Tổng hợp Đa Miền"** với bảng 5 miền Learning/Career/Work/Startup/Life. Studio
  này đã gỡ ở changelog 0475; ba trụ Career/Startup/Life đã xoá ngày 2026-09-20.
- Bảng nháp STEM được tả là "phản hồi tức thì tính hợp lệ đại số/hoá học". Thực tế bộ kiểm chỉ
  nhận ra vài lỗi (changelog 0473).
- Nhắc `ViralShareCardGenerator.tsx` ("Story Canvas" chia sẻ Zalo/FB) — **file không tồn tại**.

Mục 1 mới liệt kê đúng 4 tab: Trò chuyện · Ghi nhớ · Thử thách · Kế hoạch. Mỗi tab kèm component
thật lấy từ `StudioDialogue`/`StudioCognitive`/`StudioLabs`/`StudioProactive`, và ghi rõ hai nhóm:

- "**Đã GỠ** — đừng thiết kế lại";
- "**CHƯA CÓ** trong mã".

Mục 1 cũng thêm luật: khi skill và mã lệch nhau, **mã thắng**.

Sửa kèm: một đường dẫn của repo ngoài (`scripts/detector/registry/antipatterns.mjs` của
`pbakaus/impeccable`) viết như file cục bộ, nay ghi rõ tiền tố repo. Cổng mới bắt được chỗ này.

### B. `marketing-content-writer` — hồ sơ giọng văn có ba chỗ sai thực tế

`references/dhcb-voice.md` là **nguồn sự thật cho mọi nội dung quảng bá**. Bản cũ ghi sai ba
điều, viết theo nó là quảng cáo sai:

1. Nền tảng gồm các trụ "Learning · Career · Work · Startup · Life" — ba trụ đã gỡ. Nay là trụ
   Học tập + trụ Ghi chú, kèm câu cấm nhắc ba trụ đã gỡ.
2. Lập trình có "11 hướng chuyên sâu" — thực tế là **14** (11 sản phẩm + 3 nền).
3. **Bảng giá còn gói Pro** (20k/40k/360k) — gói này đã **ngừng bán 2026-09-12**. Nay ghi:
   - Free được 30 lượt AI/ngày;
   - VIP là gói trả phí duy nhất, giá mặc định 30k/75k/500k lấy từ `packages/core-billing/prices.ts`;
   - giá thật nằm ở bảng `plan_prices`, admin đổi được, nên **phải kiểm `GET /api/plan-prices`
     trước khi đăng bài có con số**.

Thêm: không quảng cáo bảng nháp STEM là "AI kiểm từng bước giải".

### C. Hạ tầng chuyển skill

- `.gitignore`: thêm ngoại lệ `!.claude/skills` + `!.claude/skills/**` (trước đó `.claude/*` chặn
  hết).
- `.claude/skills/{ui-ux,marketing-content-writer}/` là bản chính. `.agents/skills/` cùng tên là
  **bản gương trùng từng byte**, giữ cho công cụ khác. Bản gương được sửa luôn, để công cụ khác
  không tiếp tục đọc bản sai.
- **`scripts/skills-mirror.test.ts`** chạy trong CI, với mỗi skill ở `.claude/skills/` kiểm:
  1. frontmatter `name` khớp tên thư mục, `description` không rỗng;
  2. bản `.agents/` trùng từng byte, cùng tập file;
  3. **mọi đường dẫn trong repo mà skill nhắc tới** (`apps/`, `packages/`, `scripts/`, `docs/`,
     `e2e/`, `postgres/`, `.github/`, `.claude/`) phải tồn tại. Đường dẫn mẫu có `<…>`/`*` và tên
     lớp Tailwind kiểu `bg-zinc-900/80` được bỏ qua. Đây đúng là loại lỗi đã làm hỏng bộ skill cũ.
- `scripts/agent-config-security.test.ts` vốn đã quét mọi file `.claude/` mà git theo dõi (ký tự
  vô hình, bidi), nên skill mới được quét tự động.

## Bằng chứng

- `skills-mirror.test.ts`: 8/8 xanh.
- **Đã kiểm cổng bắt được lỗi:**
  - trước khi sửa, ui-ux bị bắt đường dẫn `scripts/detector/registry/antipatterns.mjs` không tồn
    tại;
  - thêm một dòng vào bản `.claude/` của `dhcb-voice.md` → ca "bản gương trùng từng byte" đỏ;
  - khôi phục → xanh.
- Bộ dò có test tự kiểm: bắt `packages/core-ai/hybridRagEngine.ts` (file bịa của skill cũ), bỏ qua
  `bg-zinc-900/80` và `docs/ui-ux/pages/<feature>.md`.

## Còn lại (các PR sau)

Còn 9 skill chưa chuyển, chia theo nhóm:

- `principal-engineer-architect` · `financial-security-sentinel` · `pedagogy-linguistics-master`
- `stem-science-reasoning-master` · `memory-palace-cognitive-scaffolder` ·
  `multimodal-realtime-voice-master`
- `autonomous-agent-orchestrator` · `gamification-viral-growth-architect` ·
  `life-career-strategic-advisor` — skill này gắn với ba trụ đã xoá nên có thể phải bỏ hẳn; sẽ hỏi
  chủ dự án

Khi chuyển xong sẽ cập nhật CLAUDE.md §2.1.
