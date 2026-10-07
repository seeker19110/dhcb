# 0514 — M17 đợt 3: gỡ hết `transition-all` toàn kho, cổng thành tuyệt đối (2026-10-07)

- **Ngày:** 2026-10-07 · **PR:** (điền khi tạo) · **Loại:** `style(ui)` · **Nhánh:**
  `claude/peaceful-newton-czolhg` (dựng lại từ `main` sau khi #1264 merge).
- **Nguồn:** nợ còn lại của changelog `0513` ("`transition-all` còn 51: hub 9, Onboarding 6, Luyện
  viết 3…"), audit `docs/audit/2026-09-30-audit-ui-ux-chuan-2026.md` **M17**. Chủ dự án: "tiếp tục".
- **Kèm:** commit ghi số PR #1264 vào `0513` + `PROGRESS.md` (push sau khi #1264 đã tự merge nên
  chưa vào `main`).
- **Không chạm:** màu/biến thể nút (nút tự ghép class để đợt riêng).

## Đã làm

- 25 file (hub `App.tsx`, Onboarding, Luyện viết/nghe, Từ điển, Câu thông dụng, bài học CEFR, Ghi
  chú Kanban, Trò chuyện, thẻ từ, thanh tiến độ…): **47 chỗ `transition-all` → 0**. Bốn chỗ còn lại
  của số đếm 51 là comment giải thích (`Layout.tsx`, `buttonStyles.ts`) — giữ.
  - Mặc định → `transition`.
  - 10 thanh tiến độ đổi `style.width` (CefrExam, Placement, QuizTab, ListeningTab ×2, HardWords,
    VocabMilestone, EvaluationResultView, Luyện viết, BloodGenetics) → `transition-[width]`.
  - Vạch bước Onboarding (chỉ đổi màu nền) → `transition-colors`.
  - **Hai mặt thẻ lật `WordCard`** đổi `visibility` qua `style`; `transition-all` đang giữ mặt cũ
    hiện đến hết 300ms trong lúc lật. Đổi sang `transition` sẽ tắt mặt cũ NGAY → hỏng hoạt ảnh lật.
    Nên khai rõ: mặt trước `transition-[border-color,visibility]`, mặt sau `transition-[visibility]`.
- Cổng `DesignSystem.design.test.ts`: bỏ mốc "chỉ được giảm" + hai danh sách file ưu tiên/khu Bạn
  Đồng Hành → MỘT ca tuyệt đối: toàn kho (`apps/dhcb/src`, `apps/hub/src`, `packages`) không còn
  `transition-all` ngoài comment. Đối chứng âm: chèn lại một chỗ ở `StoryCard.tsx` → ca đỏ; gỡ → xanh.

## Số đo (Blue sky, đăng nhập giả lập, Playwright — spec tạm, đã xoá)

Phần tử có `transition-property` chứa `all` và thời lượng > 0, 8 trang × 1440/390px:

| Trang                             | Trước (1440 / 390) | Sau       | Tràn ngang |
| --------------------------------- | ------------------ | --------- | ---------- |
| `/tu-dien`                        | 1 / 1              | **0 / 0** | không      |
| `/cau-thong-dung`                 | 28 / 7             | **0 / 0** | không      |
| `/luyen-viet`                     | 1 / 1              | **0 / 0** | không      |
| `/goc-hoc-tap/english/luyen-nghe` | 20 / 20            | **0 / 0** | không      |
| `/ghi-chu/kanban`                 | 0 / 0              | **0 / 0** | không      |
| `/tro-truyen`                     | 0 / 0              | **0 / 0** | không      |
| `/onboarding`                     | 6 / 6              | **0 / 0** | không      |
| `/ung-dung-thuc-te`               | 0 / 0              | **0 / 0** | không      |

**Tầng 8b:** 16 cặp ảnh (8 trang × 1440/390) cùng kích thước; 12/16 trùng pixel tuyệt đối. Lệch còn lại: hình minh hoạ đang chuyển động ở Onboarding (1440 + 390, đã xem ảnh cắt cạnh nhau — giống hệt); một chấm động ở Câu thông dụng 1440; Từ điển 1440 lệch thanh bên + ô tìm kiếm. Thanh bên: chụp ở giây 3 khi `Layout.tsx` (không nằm trong diff) còn đang mở — chụp lại ở giây 8 thì đủ rộng. Ô tìm kiếm: style tính được của ô ở giây 8 giống hệt hai bản; chụp thêm hai lần cùng mã SAU thì một lần trùng pixel với ảnh TRƯỚC, một lần lệch → độ nhạt phụ thuộc thời điểm chụp, không do đợt này.

## Bằng chứng kiểm chứng

- `npm run lint` (0 cảnh báo) ✅ · `npm run typecheck` (sau `rm -rf packages/*/dist dist
dist-server`) ✅ · `npm run build` ✅ · `npm run test:coverage` **808 file / 18.822 test** ✅ (đạt ngưỡng; số file giảm so với `0513` vì `main` đã gỡ test ở #1263 — 809 file test theo dõi trong git = 809 file chạy).

## Nợ còn lại (M17)

- Nút tự ghép class (`bg-teal-700`, gradient indigo/violet…) ở Bạn Đồng Hành, Cài đặt, Hồ sơ,
  Luyện nói/viết, hub chưa chuyển sang `buttonClass`; M18 chưa làm.
