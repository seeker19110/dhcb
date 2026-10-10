# 0587 — Đợt E4.1b audit: route `/` không còn tải zod bản đầy đủ

- **Ngày:** 2026-10-10 · **PR:** (xem mô tả PR) · **Loại:** `perf(app)`
- **Nguồn:** báo cáo `docs/audit/2026-10-10-audit-toan-dien-va-toi-uu.md` mục E4.1b (hoãn ở `0584`).
  Người dùng yêu cầu "làm tiếp hết đi". Không đổi API, không đổi thông báo lỗi validate ở server.

## Đổi hướng so với đề xuất cũ (vì sao rẻ hơn hẳn)

`0584` hoãn E4.1b vì tưởng phải đổi ~10 file hợp đồng `core-contracts` sang `zod/mini` (kéo theo
`versionedObject` của 38 hợp đồng + ~150 lời gọi method ở server). Dò lại đồ thị import thì trang
chủ **không dùng schema nào của hợp đồng** — chỉ dùng HÀM THUẦN nằm chung file với schema:
`todayItemId`, `isOutlineLeaf`, các khoá hội thoại CEFR. Vậy chỉ cần tách các hàm đó ra file không
import gì; hợp đồng và server giữ nguyên, file cũ re-export nên ~mọi nơi import cũ không đổi.

## Đã làm

1. **Tách hàm thuần khỏi file hợp đồng** (không zod, không import gì):
   - `packages/core-contracts/todayItemId.ts` — `todayItemId` + `TODAY_ITEM_KINDS` (nguồn duy nhất,
     `TodayItemSchema.kind` dựng enum từ mảng này). `todayPlan.ts` re-export.
   - `packages/core-contracts/outlineLeaf.ts` — `isOutlineLeaf` (chỉ import KIỂU từ `outline.ts`).
     `outline.ts` import lại để dùng trong `superRefine` + re-export.
   - `packages/core-contracts/cefrDialogueKey.ts` — `DIALOGUE_LEARNED_PREFIX`, `dialogueKey`,
     `learnedDialogueEntry`, `isLearnedDialogueEntry`. `cefrDialogueCheck.ts` re-export.
   - 8 nơi trên đường trang chủ đổi import sang file mới (`englishNext`, `programmingNext`,
     `stemNext`, `progressSummary`, `cefrProgress`, `buildTodayPlan`, `outlineNav`, `OutlineTree`).
2. **Ba schema cục bộ của app sang `zod/mini`** (kiểm dữ liệu localStorage/sessionStorage/JSON tĩnh,
   không ai dùng method classic trên chúng): `lib/learningSession.ts`, `lib/learningQuestionDraft.ts`,
   `data/lessons/loader.ts`. Cái cuối được `AuthProvider → preloadBrowse` nạp lúc trình duyệt rảnh
   ngay sau đăng nhập — để zod đầy đủ ở đó thì MỌI phiên đã đăng nhập vẫn tải `vendor-zod`.
3. **Test canh** `apps/dhcb/src/lib/homeRouteBundle.test.ts`: đi theo ĐỒ THỊ import tĩnh từ
   `Home.tsx` (và từ 2 loader nạp trước) — bất kỳ file nào ở bất kỳ tầng nào import `zod` là đỏ,
   in đường đi. Có ca chống xanh giả (đi từ `todayPlan.ts` phải bắt được chính nó). Đã thử: bỏ phần
   sửa ở `buildTodayPlan.ts` → test đỏ, in đúng
   `todayPlan.ts <- buildTodayPlan.ts <- useTodayPlan.ts <- Home.tsx`.

## Bằng chứng kiểm chứng

Đo bằng Chromium trên bản build thật (`vite preview`), đăng nhập giả như `e2e/helpers/auth.ts`, có
gieo một phiên học dở; cộng gzip-9 của MỌI file JS trình duyệt tải trên route `/` (kể cả lượt nạp
lúc rảnh):

| Đo                      | Trước (`main`) | Sau                  |
| ----------------------- | -------------- | -------------------- |
| Số file JS tải          | 66             | 65                   |
| Tổng JS gzip-9          | 313.234 B      | 299.545 B (−13,7 kB) |
| Có tải `vendor-zod`     | có             | **không**            |
| `size-limit` Initial JS | 135,68 kB      | 135,75 kB (dao động) |

- Tầng 8b: ảnh 1440px + 390px trang chủ đã đăng nhập trước/sau **giống hệt**; có mục "Học tiếp" từ
  phiên học dở (đi qua schema `zod/mini` mới); không cuộn ngang; 0 lỗi console/pageerror (dòng
  "Chưa tải được tiến độ" có ở cả hai bản — preview không có backend). Trang Bài học
  (`/goc-hoc-tap/english/bai-hoc`) nạp đủ danh sách bài qua loader mini, cũng không tải `vendor-zod`.
- Cổng (typecheck sạch, lint, format, test:coverage, build, size): xem mô tả PR.
