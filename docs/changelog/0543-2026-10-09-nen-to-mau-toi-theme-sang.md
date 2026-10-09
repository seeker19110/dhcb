# 0543 — Nền tô màu tối cố định ở theme sáng: sửa các thẻ Companion + cổng chống tái phát (2026-10-09)

- **Ngày:** 2026-10-09 · **PR:** (chưa tạo — commit trên nhánh worktree) · **Loại:** `fix(a11y)`
- **Dựng trên:** `origin/claude/gracious-maxwell-josnm0` (PR #1286, changelog 0542) — cùng khuôn sửa,
  KHÔNG đụng `SocraticDiagnosticsCard.tsx`.

## Nguyên nhân (đã xác minh trong mã, không đoán)

`apps/dhcb/tailwind.config.js` chỉ ánh xạ `white`, `zinc`, `accent` sang biến CSS theo theme;
`packages/core-ui/theme.css` chỉ ghi đè vài màu bậc **400** ở theme tối (`--color-red-400`…). Mọi
nền `bg|from|via|to-<indigo|purple|teal|emerald|red|amber|rose|sky…>-900/950` là hex CỐ ĐỊNH ⇒ ở
Blue sky/Nhi đồng nền vẫn tối trong khi chữ đã đổi sang sắc đậm (`theme-light:text-*-900`, hoặc token
`text-content*`/`text-zinc-*` vốn đậm ở theme sáng). `zinc`/`accent` đã đúng nên KHÔNG sửa.

Cổng `e2e/a11y*.spec.ts` không thấy vì chỉ quét trạng thái ban đầu; các khối này gần như toàn là
trạng thái **sau tương tác** (thẻ đang chọn, phiên đang chạy, bảng điểm tổng kết, khối mở rộng). Hai
chỗ ở trang đầu (`/goc-hoc-tap`, `/goc-hoc-tap/english`) lọt vì axe không đo được chữ trên gradient
(trả "incomplete", không tính lỗi).

## Đo thật (Chromium, Playwright, mock API bằng `page.route`)

Bộ đo trong trang: trộn alpha mọi lớp nền từ gốc tới phần tử, mỗi điểm dừng gradient là một ứng viên,
lấy điểm dừng TỆ NHẤT; ngưỡng chữ đọc 7:1 (4,5 nếu chữ lớn), chữ trong điều khiển 4,5:1 (3 nếu lớn).
Ô ghi: tương phản thấp nhất trong thẻ · số chữ rớt ngưỡng (trước → sau).

| Thẻ · trạng thái sau tương tác           | blue-sky              | dark-blue             | kid                    |
| ---------------------------------------- | --------------------- | --------------------- | ---------------------- |
| Holodeck · chọn kịch bản (thẻ đang chọn) | 2,66 · 4 → 5,89 · 0 ¹ | 5,89 · 0 → 5,89 · 0   | 2,65 · 4 → 5,89 · 0 ¹  |
| Holodeck · phiên đang chạy               | 3,38 · 3 → 7,35 · 0   | 6,13 · 7 → 7,15 · 0   | 3,45 · 3 → 7,06 · 0    |
| Holodeck · bảng điểm tổng kết            | 1,86 · 9 → 7,35 · 0   | 6,13 · 11 → 7,15 · 0  | 1,74 · 9 → 7,06 · 0    |
| Phát âm 3D · kết quả đường cong F0       | 3,68 · 7 → 7,21 · 0   | 6,07 · 7 → 7,08 · 0   | 3,31 · 7 → 7,06 · 0    |
| Workplace Harvester · lỗi thu hoạch      | 4,21 · 5 → 6,50 · 0 ¹ | 5,38 · 3 → 6,12 · 0 ¹ | 4,32 · 5 → 6,71 · 0 ¹  |
| Workplace Harvester · thẻ SRS            | 4,36 · 3 → 7,18 · 0   | 6,35 · 1 → 7,24 · 0   | 4,09 · 4 → 7,06 · 0    |
| A2A Mesh · mở rộng                       | 5,34 · 5 → 6,04 · 0 ¹ | 6,09 · 2 → 6,85 · 0 ¹ | 5,15 · 5 → 6,50 · 0 ¹  |
| Neuro-Affective · mở rộng, bật lá chắn   | 3,82 · 1 → 7,03 · 0   | 6,46 · 0 → 6,46 · 0 ¹ | 3,84 · 1 → 7,07 · 0    |
| Nhận thức ngầm · mở chi tiết             | 1,09 · 9 → 4,76 · 0 ¹ | 6,93 · 1 → 7,54 · 0   | 1,08 · 12 → 4,76 · 0 ¹ |

¹ Giá trị thấp nhất sau sửa < 7 là chữ trong **điều khiển** (nút/thẻ chọn — ngưỡng AA 4,5), đều đạt.

## Đã làm

**Sáu thẻ Companion** (`apps/dhcb/src/components/CompanionVoice/`): `ScenarioHolodeckCard`,
`ArticulatoryPhoneticsVisualizer`, `WorkplaceHarvesterCard`, `A2ANegotiatorCard`, `NeuroAffectiveCard`,
`SubconsciousInsightsCard`.

- Thêm `theme-light:bg-<họ>-50|100` / `theme-light:from-|to-<họ>-50` cạnh mọi nền tối; `text-[#fff]` trên
  nền đó thêm `theme-light:text-<họ>-950` (khuôn 0542).
- Theme tối: một số chữ chỉ đạt 6,1–6,9:1 trên `surface-raised` → nhích một bậc sáng (`indigo-400/300 →
200`, `red-400/300 → 200`, `emerald-400 → 300`, `teal-400 → 300`, `blue-300 → 100`, `purple-300 → 200`).
  Lưu ý: `red-400`/`indigo-400` đã bị theme tối ghi đè sáng lên ≈ bậc 300, nên đổi sang 300 KHÔNG tăng gì —
  phải lên 200 (đã đo).
- Holodeck: người không nói trước đây `opacity-70` cả khối ⇒ TÊN rớt 4,7–6,2:1; nay chỉ làm mờ ẢNH,
  tên dùng `text-content-secondary`. Placeholder `placeholder-slate-500` → `placeholder:text-content-muted`.
- Chữ token sai vai trò: `text-zinc-200` → `text-content`; chú thích `text-zinc-500`/`text-content-muted`
  cho câu đọc → `text-content-secondary`.

**Ngoài Companion — cùng khuôn, để cổng mới xanh không cần ngoại lệ** (20 file, 57 lớp): ActionCanvas
(2 file + trang), DebateArena, IntegrationsModal, LifeSynthesis, MemoryPalace, MetacognitiveReflection,
NeuralCurriculum (3), OfflineStatusBanner, ProactiveAgent (2), ProactiveBriefingCard, PvPArena (2),
StemScratchpad, `pages/learning/Subjects.tsx`, `pages/subjects/english/EnglishHome.tsx`,
`Companion3D/CyberTutorAvatar3D.tsx` (dải `via-slate-950` tối giữa nền sáng → `theme-light:via-zinc-900`,
xem ảnh). Đáng kể nhất: **dải báo ngoại tuyến `OfflineStatusBanner`** ở theme sáng là chữ `amber-900` trên
nền `amber-950/90` — gần như không đọc được (ảnh trước/sau).

**Chọn bậc nền theme sáng (đo, không cảm tính):** `-100` đặc chỉ đạt AAA với chữ `-900`; chữ token phụ
`text-content-secondary` (z-300) ở theme Nhi đồng chỉ còn 6,86–6,94:1 trên `indigo/blue/red-100`. Vì vậy:
khối có chữ token phụ dùng `-50` (mọi token z-100/300/400 ≥ 7,2:1 trên mọi `-50`, cả hai theme sáng);
chip/hover/khối đục (`/80`, `/90`, không mờ) dùng `-100` để còn phân biệt được trạng thái. Lồng nhau
(StemScratchpad: khung `-50`, ô phản hồi bên trong `-100`) để không chìm vào nhau.

**Ngoại lệ có lý do** (`TINT_ALLOWLIST`, 3 mục, đều `OfflineSyncIndicator.tsx`): dải đồng bộ cố ý là
khối ĐỤC tối ở mọi theme (chú thích sẵn trong file) với chữ sáng cố định — cặp màu y hệt ở mọi theme:
`amber-200/amber-950` 12,05:1, `emerald-200/emerald-950` 11,87:1; huy hiệu "Tự lưu cục bộ"
`amber-300 → amber-200` trên `amber-900` (6,26 → 7,28:1).

## Cổng chống tái phát — `scripts/light-theme-tint-guard.ts` + `.test.ts`

Test tĩnh (vitest, đã nằm trong `scripts/**/*.test.ts` nên tự chạy trong CI job `unit`/`test:coverage`):
quét `apps/dhcb/src/**/*.tsx`, mọi `bg|from|via|to-<họ cố định>-900|950` (kể cả có biến thể `hover:`…)
phải có `theme-light:<cùng biến thể><cùng thuộc tính>-` trên CÙNG DÒNG (gradient nhận thêm
`theme-light:bg-none`). Họ màu lấy từ `FIXED_FAMILIES` của `fixed-color-contrast-audit.ts` (không lặp
danh sách; `zinc`/`accent` tự loại vì đã đổi theo theme). Lỗi in đúng `file:dòng  lớp → thêm …`.
Ngoại lệ phải có lý do và còn khớp thật (mục chết = đỏ). Có test chống xanh-giả (bộ quét phải đọc được
≥ 1 file thật).

**Vì sao chọn test tĩnh thay vì (chỉ) thêm ca E2E:** lỗi sống ở trạng thái sau tương tác; mỗi ca E2E chỉ
phủ đúng trạng thái nó bấm tới, phải mock API từng thẻ, chạy chậm và vẫn bỏ sót thẻ mới. Test tĩnh phủ
MỌI className hiện có và tương lai, chạy < 1 s, và chỉ rõ chỗ sửa. Giới hạn đã biết: không đo tương phản
(chỉ đòi có bản theme sáng) — phần đo vẫn là việc của `fixed-color-contrast-audit` (màu chữ) + ảnh 8b.

**Chứng minh cổng đỏ:** gỡ `theme-light:bg-indigo-50` khỏi thẻ đang chọn của Holodeck →
`Tests 1 failed | 9 passed`, thông điệp `ScenarioHolodeckCard.tsx:233  bg-indigo-950/40 → thêm
\`theme-light:bg-<họ>-50|100\` cùng dòng`; trả lại → `10 passed`. Trước đợt này cổng báo 61 chỗ ngoài
Companion (+ các chỗ Companion đã sửa ở trên).

## Tầng 8b

Ảnh 1440px + 390px, blue-sky + dark-blue (kid chỉ đo), trước/sau cho 9 trạng thái thẻ Companion + avatar
3D + dải ngoại tuyến + thẻ AI `/goc-hoc-tap` + thẻ trọng tâm `/goc-hoc-tap/english`; đã tự xem. Theme tối
không đổi hình dạng (chỉ chữ sáng hơn một bậc). Thấy thêm (KHÔNG sửa trong đợt này): ở 390px header thẻ
"Nhận thức ngầm" chật — chip "V3 Autonomous" và nút "Hợp nhất lại" ép tiêu đề xuống 3 dòng.

## Kiểm chứng

`rm -rf packages/*/dist dist dist-server && npm run typecheck`, `npm run lint`, `prettier --check` file đổi,
`vitest run scripts/light-theme-tint-guard.test.ts scripts/fixed-color-contrast-audit.test.ts
apps/dhcb/src/components scripts/changelog.test.ts` — kết quả ghi trong mô tả commit/PR.
