# Đồng Hành

**Đồng Hành Cùng Bạn** hỗ trợ mọi người học hỏi, hiểu sâu hơn và từng bước nâng cao khả năng
**tự học**. Bài học, thực hành, ôn tập, Ghi chú và Bạn Đồng Hành AI cùng phục vụ việc học;
không khôi phục các trụ Sự nghiệp, Khởi nghiệp và Đời sống đã gỡ.

Ứng dụng chính: <https://www.donghanhcungban.org>. Khách có thể bắt đầu không đăng nhập,
trải nghiệm AI trong hạn mức riêng được kiểm soát ở server. Tài khoản Free có hạn mức AI/ngày.
VIP mở quyền chọn thứ tự bài trong nội dung đã có và không giới hạn lượt AI/ngày khi gói còn
hiệu lực; vẫn giữ xác thực, chống lạm dụng, thống kê và cầu dao chi phí. Triển khai phải qua CI
và xác minh bản deploy, không chỉ đổi nội dung quảng cáo.

## Hiện tại: Learning production

- Chat gia sư AI, luyện viết và chấm điểm, luyện nói qua STT + phản hồi bằng giọng nói.
- Lộ trình từ vựng, SRS, phát âm và CEFR A1 → C2; từ điển 12.000+ mục.
- Tiến độ, streak, thử thách, huy hiệu, referral, thông báo và quản trị.
- Gói Free / VIP; thanh toán VietQR qua SePay, webhook cấp quyền atomic và idempotent.
- Hai chiều Việt ⇄ Anh, giao diện song ngữ, mobile-first và bốn theme đạt WCAG AA.
- PostgreSQL tự host, Express, React/Vite; triển khai VPS sau Cloudflare với CI đầy đủ.

AI hiện tại dùng gateway nhiều provider để giữ độ ổn định. Định hướng đã chốt là **Gemini làm
engine chính cho hội thoại và trải nghiệm voice mới**; các provider/STT/TTS hiện hữu được duy trì
như adapter hoặc fallback trong giai đoạn chuyển đổi. Việc chuyển provider phải đi qua benchmark,
cost/latency evidence và rollout có thể rollback, không thay đổi production chỉ bằng sửa tài liệu.

## Tài liệu kiến trúc V2 tham khảo (không phải quyền lợi đang cung cấp)

V2 dùng modular monolith, contract rõ ràng và migration kiểu strangler. Trọng tâm không phải tạo
thêm một chatbot, mà xây một companion có continuity và kiểm soát được:

- **Personal World Model** — facts, preferences và constraints có provenance, confidence,
  sensitivity, expiry và quyền sửa/xoá/xuất.
- **Life Graph** — kết nối goal, project, skill, commitment, constraint và decision xuyên domain.
- **Knowledge Fabric + Context Engine** — lấy đúng ngữ cảnh theo purpose, permission và token budget.
- **Companion Runtime** — intent → context → plan → policy → capability → validated result.
- **Capability Registry + Automation** — mọi thao tác có schema, quyền, risk, budget, audit và revoke.
- **Decision / Outcome Loop** — lưu giả định, bằng chứng, lựa chọn và học từ kết quả thực tế.
- **Phạm vi đang triển khai** — Học tập đa môn và Ghi chú; không tự mở lại các domain đã gỡ.

Các invariant quan trọng: planning không đồng nghĩa execution; AI output không trực tiếp sửa
billing, permissions, mastery hoặc authoritative state; external write cần đúng authority; dữ liệu
nhạy cảm không tự động đi xuyên domain.

Kho tham khảo kiến trúc: [V2 Roadmap](docs/architecture-v2/21-ROADMAP.md). Kiến trúc:
[System Architecture](docs/architecture-v2/02-SYSTEM-ARCHITECTURE.md). Chiến lược chuyển đổi:
[Migration V1 → V2](docs/architecture-v2/20-MIGRATION-V1-V2.md). Trạng thái có bằng chứng:
[PROGRESS.md](PROGRESS.md).

## Trạng thái V2

- V2-00: inventory, ownership map, trace tám critical flow và risk register đã có; baseline
  latency/cost production còn chờ số liệu vận hành thật.
- V2-01: ADR boundary Platform / Learning và lint rule đã hoàn tất.
- V2-02: 13 core contracts V2 đã được thêm theo hướng additive, không phá contract Learning v1.
- Bước tiếp theo theo roadmap: bắt đầu Wave B bằng Personal World Model sau khi contract được owner
  review tại thời điểm dùng thật; không tự mở rộng phase khi gate chưa đạt.

English Tutor OS 46 phase là tài liệu v1 đã **frozen**. Chỉ tiếp tục phần nào phục vụ stability,
migration hoặc domain Learning của V2.

## Cấu hình Hệ thống & Runtime

- **Runtime & Tooling**: Node.js 22, React 19, Vite 8 (rolldown), Tailwind CSS v4 (qua `@config`), ESLint 9 flat config, Express 5 — cập nhật 2026-09-22. Không tự ý nâng cấp framework/tooling khi chưa đánh giá tương thích.
- **Server VPS Khuyến nghị**: Ubuntu 24.04 (3–4 vCPU, 4–8 GB RAM, PM2 Cluster Mode, PostgreSQL 16+, Redis 7+, Cloudflare R2 cho audio cache).
- **Client Web/PWA**: Trình duyệt Chromium ≥ 113 (WebGPU cho Edge AI 0ms), Microphone cho STT & Realtime Voice.
- Xem chi tiết tại: [System Requirements](docs/system-requirements.md) và [Deploy VPS Ubuntu](docs/deploy-vps-ubuntu.md).

## Chạy cục bộ

Yêu cầu Node.js 22+ và PostgreSQL disposable/local; không dùng production credentials cho test.

```bash
git clone https://github.com/seeker19110/dhcb.git
cd dhcb
npm install
cp .env.example .env
npm run dev
```

Các cổng chính:

```bash
npm run build
npm run typecheck
npm run lint
npm run format:check
npm test
npm run test:e2e
```

Quy ước làm việc: [AGENTS.md](AGENTS.md) và [CLAUDE.md](CLAUDE.md). Thiết lập Codex Cloud:
[CODEX_CLOUD_SETUP.md](docs/CODEX_CLOUD_SETUP.md).
