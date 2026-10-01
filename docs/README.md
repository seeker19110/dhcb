# `docs/` — bản đồ tài liệu: cái nào ĐANG HIỆU LỰC, cái nào chỉ THAM KHẢO

> Thêm 2026-09-06 (đánh giá sâu dự án). Lý do: `docs/` có 63.000 dòng, nhiều file mang tên
> "MASTER", "OS", "phases" trông như backlog đang chạy nhưng thực ra đã bị thay thế. Mỗi phiên
> AI/người mới phải tự đoán cái nào còn hiệu lực — tốn thời gian và dễ làm theo kế hoạch cũ.
> File này trả lời câu đó một lần. **Khi thêm/thay tài liệu, cập nhật bảng dưới.**

## 1. Nguồn THI HÀNH (đọc đầu phiên, làm theo)

| File                                                  | Vai trò                                                                                                    |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `../CLAUDE.md`                                        | Luật làm việc hiện hành của AI (gọn, không lịch sử)                                                        |
| `../PROGRESS.md`                                      | Trạng thái hiện tại: giai đoạn · tiếp theo · việc tay · nợ mở                                              |
| `../PROJECT.md`                                       | Cái gì cần xây: MVP, schema, DoD                                                                           |
| `research/kien-truc-va-ha-tang.md` mục [1]            | Kiến trúc chuẩn nền tảng (khuôn "thêm môn học mới")                                                        |
| `changelog/`                                          | Nhật ký từng đợt việc, mỗi PR một file (`npm run changelog`)                                               |
| `specs/`                                              | Đặc tả từng tính năng đã/đang thi hành (cổng `feat(` cần link)                                             |
| `research/`                                           | Đặc tả nghiên cứu: năng lực theo tuổi, đồng hành, thanh toán…                                              |
| `adr/`                                                | Quyết định kiến trúc lớn, đánh số tăng dần (xem `ls docs/adr/`; mới nhất: 0013 tích hợp ECC)               |
| `templates/`                                          | Khuôn đặc tả tính năng + khuôn DESIGN_SPEC + khuôn ADR                                                     |
| `AI_DEVELOPMENT_PROTOCOL.md`                          | Quy trình "kín" 5 vai: state machine, hợp đồng artifact, khoá file, cổng QA, quyền sửa, điều kiện PR/merge |
| `AI_DEVELOPMENT_PIPELINES.md`                         | Chọn model/effort theo rủi ro cho từng bước (bổ sung cho PROTOCOL, không thay)                             |
| `framework/QUY-TRINH-AUDIT.md`                        | Quy trình audit toàn diện 11 tầng (+ 8b ảnh chụp trang)                                                    |
| `framework/KHUNG-1..3-*.md`, `framework/BO-SUNG-*.md` | Quy trình 9 giai đoạn, luật AI, tiêu chuẩn chất lượng                                                      |
| `goals/`                                              | Mục tiêu lớn đang mở (STEM 3 môn nháp, AI Systems Architect, Learning UX) — goal DONE dời sang `legacy/`   |

## 2. VẬN HÀNH (đọc khi deploy / sự cố / cấu hình)

`deploy-vps-ubuntu.md` (deploy chính) · `DEPLOY.md` (deploy + fix nhanh) · `rollback-runbook.md`
· `ke-hoach-khoi-phuc-su-co-server.md` (server sập) · `runbook-dung-vps-moi-tu-dau.md` ·
`setup-postgresql-vps.md` · `cloudflare-setup.md` · `nginx-hub-apex.md` · `email-setup.md` ·
`huong-dan-lien-ket-facebook-apple-microsoft.md` · `van-hanh-khoa-ma-hoa.md` · `seed-guide.md`
· `kiem-thu-restore-into-staging.md` · `kiem-tra-tay-thanh-toan-google-login.md` ·
`huong-dan-tu-host-scale-50k.md` · `system-requirements.md` · `migration-thoat-ly-supabase.md`
(lịch sử rời Supabase + chính sách cache TTS) · `doi-ten-mien-chinh-org.md` ·
`runbook-platform-v2-production-deployment.md` · `ops/COMPREHENSIVE-AUDIT-STATUS.md` (bảng
trạng thái lượt audit gần nhất) · `FEATURE-MAP.md` (**sinh tự động**, `npm run gen:feature-map`).

## 3. THAM KHẢO — KHÔNG phải backlog đang chạy

Các file dưới đây là tầm nhìn/kế hoạch cũ hoặc kho nghiệm thu. **Không lấy làm việc tiếp
theo**; việc tiếp theo chỉ ở `PROGRESS.md`. Giữ lại vì code còn trích dẫn số mục của chúng
trong comment (`packages/core-contracts/*`, `packages/core-errors/*`), và vì ADR-0003/0004 đối
chiếu ngược về chúng.

| File / thư mục                       | Là gì                                                                                        | Bị thay bởi                                               |
| ------------------------------------ | -------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| `MASTER_SPEC.md`                     | Tầm nhìn kiến trúc Đồng Hành Platform v2.0 (2026-08-15)                                      | `research/kien-truc-va-ha-tang.md` mục [1] (Q2)           |
| `architecture-v2/` (24 file)         | Đặc tả kiến trúc v2 theo miền — kho đối chiếu nghiệm thu                                     | như trên                                                  |
| `phases/` (47 file)                  | Kế hoạch "English Tutor OS" theo phase 00–45                                                 | OS v1 **FROZEN** — `legacy/ENGLISH_TUTOR_OS_V1_FROZEN.md` |
| `OS_COMPLETE_IMPLEMENTATION_PLAN.md` | Kế hoạch thi hành OS đến Final Audit                                                         | như trên                                                  |
| `OS_EXECUTION_GUIDE.md`              | Chuẩn điều hành + nghiệm thu OS                                                              | `CLAUDE.md` mục 8–11 + `framework/QUY-TRINH-AUDIT.md`     |
| `OS_PHASE_BACKLOG.md`                | Backlog OS theo phase                                                                        | `PROGRESS.md` mục "Tiếp theo"                             |
| `AI_DELIVERY_LOOP.md`                | Vòng lặp AI qua nhiều PR tới mục tiêu lớn                                                    | `CLAUDE.md` mục 3 (nhịp làm việc, tạo PR = xong)          |
| `DEVELOPMENT_WORKFLOW.md`            | Quy trình ý tưởng → production (bản 2026-08)                                                 | `CLAUDE.md` mục 3, 8–11 + `templates/dac-ta-tinh-nang.md` |
| `CODEX_CLOUD_SETUP.md`               | Thiết lập chạy trên Codex Cloud                                                              | Chỉ dùng nếu chạy Codex Cloud; xem `../AGENTS.md`         |
| `RECOVERY-V2-RECENT-BRANCHES.md`     | Biên bản khôi phục nhánh v2 (đóng 2026-08-16)                                                | Đã xong, giữ làm bằng chứng                               |
| `legacy/`                            | Kho lưu: OS v1 frozen · nợ kỹ thuật đã đóng · `PROGRESS.md` cũ · lịch sử quy ước `CLAUDE.md` | —                                                         |

Tài liệu khung chung, dài — đọc đúng phần cần khi được trỏ tới, không nạp mỗi phiên:
`framework/KIEN-TRUC-DIEU-PHOI-3-TANG.md` · `framework/PERFORMANCE_OPTIMIZATION.md` ·
`framework/KHOI-TAO-du-an-moi.md` · `framework/HUONG-DAN-cau-hinh-precommit-CI.md`.

## 4. Quy tắc giữ bản đồ này đúng

- Thêm tài liệu thi hành mới → thêm dòng ở mục 1 hoặc 2.
- Tài liệu bị thay thế → **đừng xoá** (code/ADR có thể còn trỏ tới), chuyển dòng xuống mục 3
  và ghi rõ "bị thay bởi" cái gì.
- Không tạo thêm file "MASTER"/"PLAN" tổng hợp mới; việc đang chạy chỉ ở `PROGRESS.md`.
