# Kiến trúc điều phối 3 tầng

> Cách tổ chức làm việc giữa phiên chính và các subagent. Định nghĩa agent nằm ở
> `.claude/agents/*.md` (Claude Code đọc tự động).

> **GIỚI HẠN ĐÃ ĐO (khung `seeker19110/project-template`, nghiệm thu 2026-10-09; changelog DHCB `0620`):**
> trong Claude Code, subagent **KHÔNG có tool Agent** — không tạo được subagent lồng. Vì vậy gọi
> `coordinator` như một subagent thì nó KHÔNG dispatch được worker nào. **Tầng 2 do PHIÊN CHÍNH đảm
> nhận**; file `.claude/agents/coordinator.md` giữ lại làm bản mô tả vai (quy trình + ranh giới) để
> phiên chính đọc và làm theo. Trần: **tối đa 5 subagent chạy cùng lúc** trong cả phiên.

## Tầng 1 — Người lập kế hoạch: phiên chính

Phần **"nghĩ"**. Không code, không babysit worker. Quy trình:

1. Hiểu yêu cầu. Thiếu đặc tả → **hỏi người dùng** bằng `AskUserQuestion`.
   - **Luật cứng:** KHÔNG tự chế đặc tả; KHÔNG gắn nhãn `route:complex` để né việc hỏi.
2. Viết **đặc tả chi tiết**: schema DDL, API, điểm chạm code, tiêu chí chấp nhận.
3. Gắn **nhãn `route:`** cho từng việc (xem bảng dưới).
4. Xuất **PLAN.md**.
5. **Duyệt kết quả cuối** sau khi coordinator báo cáo tổng hợp.

## Tầng 2 — Người điều phối: PHIÊN CHÍNH, theo vai `coordinator`

Phần **"chạy"** (do phiên chính làm — xem giới hạn ở đầu file). Lấy **nguyên văn PLAN.md**, thi hành đúng kế hoạch: đồng bộ
git → tạo nhánh/worktree từng việc → dispatch mỗi việc đến đúng worker theo nhãn
`route:` → nghiệm thu theo tiêu chí chấp nhận → gọi `reviewer` soát diff → tích
hợp (số migration, rebase) → báo cáo tổng hợp về phiên chính.

**Ranh giới cứng:** không đổi kế hoạch/đặc tả · không tự code · không merge ·
worker vướng đặc tả → dừng việc đó và báo lên (không tự vá, không route lại để né).

**Giới hạn đo được (lấy từ khung, 2026-10-12):**

- Một tiêu chí chấp nhận thử tối đa **3 vòng** (giao → nghiệm thu đỏ → giao lại); vòng 3 vẫn đỏ →
  BLOCKED, báo người dùng kèm chẩn đoán (AI_DELIVERY_LOOP §5).
- Worker sửa file NGOÀI "Điểm chạm" của brief → **loại kết quả**, không vá hộ.
- Worktree còn thay đổi chưa commit → không xoá; dùng lại worktree đã cô lập thay vì tạo mới.
- PR đã bật auto-merge mà CI đỏ → tắt auto-merge trước khi sửa tiếp.

**Khối "Luật chung" dán nguyên vào brief MỌI worker** (worker không thấy hội thoại — luật phải nằm
trong brief): ô ⑦ của `docs/templates/dac-ta-tinh-nang.md`.

## Tầng 3 — Workers (định tuyến 2 trục: độ phức tạp × độ kín đặc tả)

| `route:`     | Agent                 | Model · effort  | Khi nào                                             |
| ------------ | --------------------- | --------------- | --------------------------------------------------- |
| `complex`    | `complex-implementer` | Opus · high     | Phức tạp, còn chỗ tự quyết trong ranh giới brief    |
| `spec`       | `spec-executor`       | Opus · low      | Phức tạp nhưng đặc tả kín — chỉ thi hành            |
| `standard`   | `standard-worker`     | Sonnet · medium | Việc vừa có đặc tả cụ thể (kế thừa "coder" cũ)      |
| `mechanical` | `mechanical-worker`   | Haiku           | Cơ học theo mẫu/thông báo (kế thừa "mechanical" cũ) |

**`reviewer` (Sonnet)** — hậu kiểm bằng skill `code-review` sau khi worker xong,
trước khi phiên chính duyệt cuối. Không nằm trong bảng route; do phiên chính (vai Tầng 2) gọi.

## Sơ đồ luồng

```
Người dùng
   │  yêu cầu
   ▼
[Tầng 1] phiên chính ── hỏi nếu thiếu đặc tả (AskUserQuestion)
   │  PLAN.md (đặc tả + nhãn route:)
   ▼
[Tầng 2] phiên chính (vai coordinator) ── dispatch theo route: ──► [Tầng 3] worker
   │                                                     │ diff
   │  ◄──────────── reviewer (code-review) ◄─────────────┘
   │  báo cáo tổng hợp
   ▼
[Tầng 1] phiên chính ── duyệt cuối ──► người dùng
```
