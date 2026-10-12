# 0620 — Tích hợp khung project-template (đợt 2): điều phối 3 tầng theo giới hạn đo được · review tra TRAPS · luật nội dung ngoài · checkpoint trước khi nén

- **Ngày:** 2026-10-12 · **PR:** #1382 · **Loại:** `docs(framework)`
- **Nguồn việc:** tiếp đợt 1 (`0619`, PR #1381) — chủ dự án: "chờ project-template merge xong rồi tích
  hợp sâu những cái hay, ưu điểm vào dự án" → "đọc toàn bộ luôn" → "xong tích hợp luôn".
- **Khung đối chiếu:** `seeker19110/project-template` @ `59bd1d1`. File này kiêm **bản đối chiếu ba cột**
  (phương pháp mới ghi ở `docs/framework/AP-DUNG-vao-du-an-co-san.md` PHẦN D).

## Đã lấy (CHƯA CÓ hoặc NÔNG HƠN — mỗi dòng: tốt hơn bản đang chạy ở đâu)

| Hạng mục                                                             | Nơi đặt ở DHCB                                                                                | Tốt hơn ở đâu                                                                                                                                                                                                                         |
| -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Subagent KHÔNG có tool Agent → Tầng 2 = phiên chính                  | `KIEN-TRUC-DIEU-PHOI-3-TANG.md`, `.claude/agents/coordinator.md` (model `opus`→`sonnet`)      | Bắt một lỗi thiết kế: tài liệu cũ bảo phiên chính giao PLAN cho subagent `coordinator` đi dispatch worker — điều Claude Code không làm được (khung đo 2026-10-09). Thêm trần 5 subagent, 3 vòng/AC, loại kết quả sửa ngoài điểm chạm. |
| `/review` + `reviewer` tra `TRAPS.md`                                | `.claude/commands/review.md` Bước 2b, `.claude/agents/reviewer.md`                            | Trước đợt này `grep TRAPS` trong cả hai = 0 dòng: sổ bẫy chỉ được ghi, không được tra lúc review. Thêm luật `path:line` + bằng chứng và 4 loại phát hiện.                                                                             |
| ADR-0016 nội dung ngoài là dữ liệu                                   | `docs/adr/0016-*.md`, CLAUDE.md §5, `AGENTS.md`, `lookup`/`version-check`/`security-reviewer` | Trước: grep "không phải chỉ thị"/"prompt injection" ở luật tác tử = 0 dòng (repo public).                                                                                                                                             |
| Khuôn đặc tả: AC-n → bằng chứng + ô ⑦ "Luật chung"                   | `docs/templates/dac-ta-tinh-nang.md`                                                          | Kiểm được hơn: mỗi tiêu chí trỏ tới test/lệnh chứng minh HÀNH VI; brief cho subagent mang theo 7 luật tối thiểu (subagent không thấy hội thoại).                                                                                      |
| Dòng "Đỏ-trước" + 5 ngoại lệ đóng                                    | CLAUDE.md §10, `.claude/commands/gate.md`                                                     | Luật đỏ-trước trước đây chỉ nằm trong `/debug`; nay ở báo cáo xác thực mọi commit.                                                                                                                                                    |
| Lần sửa thứ 2 → ghi tầng gây lỗi                                     | `docs/AI_DELIVERY_LOOP.md` §5, `/debug` Pha 5, `/build-fix`                                   | Văn xuôi nối với bộ đếm chuỗi đỏ đã thêm ở `0619` (`.claude/.gate-red-streak`).                                                                                                                                                       |
| Hook `PreCompact` chụp trạng thái                                    | `.claude/hooks/precompact-checkpoint.sh` + `.claude/settings.json` + `report-status.sh`       | Chưa có: nén ngữ cảnh làm mất dấu việc đang dở (đã gặp nhiều lần ở chính phiên này). Chỉnh cho DHCB: không trích `PROGRESS.md` (200+ KB), dùng changelog.                                                                             |
| Xoá dấu `.winddown-nudged` đầu phiên                                 | `.claude/report-status.sh`                                                                    | Bắt lỗi: trước đây không chỗ nào xoá dấu này → trên máy cố định `usage-guard.sh` chỉ nhắc ĐÚNG MỘT LẦN trong đời repo.                                                                                                                |
| Bỏ khối "ĐÃ XONG" chép tay                                           | `.claude/report-status.sh`                                                                    | Lỗi thời lần thứ ba (vẫn ghi "Thanh toán Pro/VIP" sau khi xoá gói Pro 2026-09-12) — cùng lý do đã bỏ danh sách nợ chép tay.                                                                                                           |
| Dấu `DEBT: … \| trần: … \| xem lại khi: …`                           | `docs/claude-md-chi-tiet.md` §7, `AGENTS.md`, `scripts/maintenance-sweep.sh`                  | Biến "nợ cố ý" thành thứ máy đếm được; sweep cảnh báo 🟡 dấu thiếu `xem lại khi:`.                                                                                                                                                    |
| Truy vết F-/W- + tiêu chí thoát hội tụ + deletion test + dòng `net:` | `docs/framework/QUY-TRINH-AUDIT.md` §3b                                                       | Trước: audit kết ở báo cáo, không có luật đóng vòng (phát hiện nào đã đóng, khi nào dừng quét).                                                                                                                                       |
| Phương pháp ba cột học từ nguồn ngoài                                | `docs/framework/AP-DUNG-vao-du-an-co-san.md` PHẦN D                                           | Chưa có; đúng loại việc của đợt này (`0292`, `0294`, `0619`).                                                                                                                                                                         |
| Ghi chú "DHCB không dùng bảng stack mặc định"                        | `docs/framework/KHUNG-3-*.md` PHẦN C                                                          | Bảng vẫn ghi Next.js/Supabase/Vercel — `/consult` có thể so nhầm với stack không phải của DHCB.                                                                                                                                       |

## Đã có và SÂU HƠN (không lấy)

- **`config-protection.sh`** (từ chối lần đầu, hỏi lần sau, phủ cả workflow/policy test) mạnh hơn danh sách
  `ask`/`deny` 54 mục của khung.
- **Cổng a11y AA + AAA tuyệt đối 15 trang × 3 theme, chữ gradient** — khung chỉ có luật a11y dạng văn bản, không job CI nào chạy axe.
- **`TRAPS.md` + `/learn`** đã có cổng chất lượng Ghi mới/Bổ sung/Chuyển chỗ/Bỏ — tương đương khung.
- **`check-progress-freshness.sh`, `check:specs`, `check:sql`** — khung không có cổng tương đương (riêng SQL: grep `PREPARE` chỉ ra hàm `evidence_prepare`).

## Chưa cần (kèm điều kiện xem lại)

- **`CONTEXT.md` (bảng thuật ngữ):** CLAUDE.md §1 + 11 skill miền đã giữ thuật ngữ; thêm file nữa là thêm nguồn
  phải đồng bộ. _Xem lại khi:_ có phát hiện review/bug do hiểu sai thuật ngữ giữa hai môn/trụ.
- **4 file trạng thái `/completion` (FEATURE-MAP, CONVENTIONS…):** DHCB chưa chạy một đợt "hoàn thiện" kiểu đó;
  §3b đã lấy phần luật đóng vòng. _Xem lại khi:_ chủ dự án yêu cầu đợt hoàn thiện trước mốc ra mắt lớn.
- **Model `opusplan` trong `.claude/settings.json`:** ADR-0007 của khung nói không còn được hỗ trợ — là quyết định
  của chủ dự án (chi phí), KHÔNG tự đổi; nêu lại trong mô tả PR.

## Bằng chứng kiểm chứng

- `precompact-checkpoint.sh` chạy với payload `{"trigger":"manual"}` → exit 0, file ghi đúng nhánh/thay đổi/
  commit; `git check-ignore` xác nhận file bị bỏ qua (`.claude/*`); `report-status.sh` in dòng "VỪA NÉN NGỮ CẢNH".
- Bộ đếm `DEBT:`: file thử stage tạm 2 dấu (1 thiếu `xem lại khi:`) → "2 (thiếu: 1)" + 🟡; gỡ file → "0".
- `scripts/agent-config-security.test.ts` canh hook mới: lệnh `bash .claude/hooks/<tên>.sh` + file được git theo dõi.
- Cổng đủ: xem Báo cáo xác thực trong mô tả PR.
