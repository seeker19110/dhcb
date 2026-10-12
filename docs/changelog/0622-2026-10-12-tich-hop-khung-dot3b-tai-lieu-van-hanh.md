# 0622 — Tích hợp khung project-template (đợt 3b): thang SEV + nơi lưu post-mortem cố định · thiết lập repo đo thật · khuôn mối đe doạ/quản trị dữ liệu · red-team eval AI (phát hiện harness xanh giả)

- **Ngày:** 2026-10-12 · **PR:** (điền khi tạo PR) · **Loại:** `docs(ops)`
- **Nguồn việc:** đợt cuối của chuỗi tích hợp khung — `0619` (#1381), `0620` (#1382), `0621` (#1383). Chủ dự
  án: "tích hợp sâu những cái hay, ưu điểm vào dự án" → "xong tích hợp luôn".
- **Khung đối chiếu:** `seeker19110/project-template` @ `59bd1d1` — `docs/ops/{incident-response,
repository-settings,release-readiness}.md`, `docs/framework/templates/{THREAT-MODEL,DATA-GOVERNANCE,
AI-EVAL,SUPPORT}.template.md`, `.github/ISSUE_TEMPLATE/incident.md`. Phương pháp ba cột
  (`docs/framework/AP-DUNG-vao-du-an-co-san.md` PHẦN D).

## Đã lấy (mỗi dòng: tốt hơn bản đang chạy ở đâu)

| Hạng mục                                                                                    | Nơi đặt                                                                            | Tốt hơn ở đâu                                                                                                                                                                                        |
| ------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Thang SEV1/2/3 với ví dụ DHCB + quy tắc "phân vân chọn mức cao"                             | `docs/ke-hoach-khoi-phuc-su-co-server.md` Phần 1b, `/incident` bước 1              | Tài liệu cũ ghi "phát hiện → **phân loại mức độ** → …" nhưng `grep` không có thang nào. SEV gắn với "có bắt buộc post-mortem không".                                                                 |
| Nơi lưu post-mortem CỐ ĐỊNH + khuôn đủ (dòng thời gian có bằng chứng, 5 Whys, hàng rào mới) | `docs/ops/postmortem/README.md`, runbook Phần 5, `/incident` bước 7, `PROGRESS.md` | Trước: rải ba nơi (runbook Phần 7 · `PROGRESS.md` · `docs/legacy/`) — `/incident` còn cho chọn giữa hai. Nay một file một sự cố, `PROGRESS.md` giữ một dòng trỏ.                                     |
| Luật sự cố bảo mật trong repo PUBLIC                                                        | runbook Phần 1b, khuôn post-mortem                                                 | Không có trước đây: không mở issue công khai, post-mortem chỉ viết sau khi vá + xoay khoá.                                                                                                           |
| Thiết lập repo: giá trị THẬT + ngày kiểm + lệnh kiểm lại không cần token                    | `docs/ops/repository-settings.md` (mới)                                            | Thiết lập GitHub không nằm trong git. Khác khung: không chép checklist chung chung, chỉ ghi giá trị đọc từ API hôm nay — nhờ vậy lộ ra 2 thiết lập đang TẮT (mục "Phát hiện").                       |
| Khuôn mô hình mối đe doạ                                                                    | `docs/templates/threat-model.md` (mới) + móc ở `dac-ta-tinh-nang.md`               | Khuôn đặc tả chưa có ô bảo mật. Chỉnh cho DHCB: không RLS (lọc `user_id` là lưới duy nhất), đếm lượt fail-open, replay SePay, prompt injection. Là MỤC trong đặc tả, không thêm file riêng.          |
| Khuôn quản trị dữ liệu                                                                      | `docs/templates/data-governance.md` (mới) + móc ở `dac-ta-tinh-nang.md`            | 5 câu bắt buộc trỏ vào mã thật (`PERSON_TABLES`, lớp mã hoá, `BACKUP_KEEP_DAYS`) — đúng loại thiếu sót đã thành nợ `/api/persons`.                                                                   |
| Phần "rủi ro an toàn" của khuôn AI-EVAL → bảng độ phủ red-team + 5 luật viết ca tấn công    | `docs/ops/ai-eval-red-team.md` (mới)                                               | Trước không có chỗ nào kê mặt AI nào có ca injection. Đo ra: `eval:tutor` 0 ca, `eval:companion` 0 ca, chấm bài viết chưa có eval; mẫu chuẩn sẵn có trong DHCB là `actionCanvasScoring.ts` + canary. |

## Đã có và SÂU HƠN (không lấy)

- **Runbook sự cố của DHCB** — 10 kịch bản có lệnh copy-paste + lịch sử sự cố thật; `incident-response.md` của khung chỉ
  có quy trình chung. Chỉ lấy thang SEV + khuôn post-mortem.
- **Phần so baseline của khuôn AI-EVAL** — CLAUDE.md §8 + `docs/research/eval-tutor-baseline.md` đã bắt dán bảng
  so sánh, có cả nợ dải nhiễu (PROGRESS nợ 16).

## Chưa cần (kèm điều kiện xem lại)

- **Issue template "incident":** repo public — issue sự cố công khai dễ lộ chi tiết đang khai thác; file post-mortem
  viết sau khi vá thay thế. _Xem lại khi:_ repo chuyển private hoặc có người trực thứ hai cần kênh điều phối.
- **`release-readiness.md`:** DHCB deploy liên tục mỗi PR (`deploy.yml`), cổng merge + DoD + `rollback-runbook.md`
  đã phủ. _Xem lại khi:_ có bản phát hành theo mốc (app store, bản cho trường học).
- **`SUPPORT.template.md`:** một người vận hành; `SECURITY.md` đã có kênh + mốc 72 giờ. _Xem lại khi:_ có người
  dùng trả phí cần cam kết phản hồi.
- **Job CI `protection-guard`** (đối chiếu ruleset sống với file): ghi ở `docs/ops/repository-settings.md` mục
  "Chưa làm" kèm điều kiện.

## Phát hiện khi đối chiếu (đã sửa trong đợt này)

1. **`eval:v2:red-team` xanh do cách dựng.** 20/30 ca cộng thẳng theo số lượng fixture, 2 ca qua nhờ đọc nhãn
   `expectedBlockLayer` của chính fixture (`rt-pi-5` thực tế sinh kế hoạch `learning.update_goal`). Chạy thật
   trên `main`: `29/30 … ❌ Failed`, thoát mã 1 (`rt-pi-9` nhắc trụ `career` đã xoá). Test đi kèm là
   `expect(true).toBe(true)`. Thế mà `docs/research/kien-truc-va-ha-tang.md`, nguồn thi hành, ghi "100% blocked
   (30/30) PASS" → **đính chính tại chỗ** + nợ mới trong `PROGRESS.md`. KHÔNG viết lại harness trong đợt tài liệu
   này (việc mã, cần đặc tả).
2. **Private vulnerability reporting đang TẮT** (API `private-vulnerability-reporting` → `enabled: false`) —
   link `security/advisories/new` đặt ở `0621` không dùng được cho người ngoài. Issue template nay trỏ về
   `SECURITY.md` (còn email); `SECURITY.md` ghi rõ trạng thái. Bật là việc của chủ repo.
3. **Dependabot security updates đang TẮT** — ghi ở `repository-settings.md`, chờ chủ repo quyết.
4. **`SECURITY.md` ghi quyền admin qua `ADMIN_EMAILS`** — mã thật dùng `ADMIN_USER_IDS` và cố ý không fallback
   email (`packages/core-auth/adminAuth.ts` dòng 1–3). Đã sửa.
5. **Runbook sự cố Phần 2 (chẩn đoán nhanh) lệch Phần 0 của chính nó:** domain `.com` + IP `103.81.87.174`, trong
   khi Phần 0 và `docs/DEPLOY.md` ghi `103.118.29.58`; lệnh `ssh app`/`ssh xboss` không khớp tên host `dhcb`/`vps`
   trong khối cấu hình ngay trên. Đã sửa theo Phần 0. **Còn IP cũ ở 3 file khác** (`runbook-dung-vps-moi-tu-dau.md`
   dòng 9, `huong-dan-tu-host-scale-50k.md` dòng 17, `nginx-hub-apex.md` dòng 82) — chưa sửa, chờ chủ dự án xác nhận
   IP hiện hành.

## Bằng chứng kiểm chứng

- Thiết lập repo: ba lệnh `curl` ghi trong `docs/ops/repository-settings.md`, chạy 2026-10-12, giá trị chép nguyên.
- Red-team: `npx tsx scripts/red-team/eval-red-team.ts` → `29/30 scenarios blocked (96.67%) ❌`, `exit=1`; script dò
  từng ca (`resolveIntentAndDomain` + `generatePlan`) in intent/domain/plan của 10 ca prompt-injection.
- Độ phủ eval: đếm theo `kind` của `eval-tutor-fixtures*.json` (62 + 118 ca, 0 ca chứa từ khoá injection/canary),
  `eval-companion-fixtures.json` (3 nhóm, 0 ca), `actionCanvasScoring.ts` dòng 50–51 kiểm canary.
- Cổng đủ: xem Báo cáo xác thực trong mô tả PR.
