# 0474 — Hộp thoại ở các studio Bạn Đồng Hành phủ đúng cửa sổ: gỡ gốc bẫy `transform` của hoạt ảnh (2026-10-02)

- **Ngày:** 2026-10-02 · **PR:** [#1209](https://github.com/seeker19110/dhcb/pull/1209) · **Loại:** `fix(ui)`.
- **Nguồn:** lộ ra khi chụp ảnh Tầng 8b cho bảng nháp STEM (changelog `0473`, PR #1208).

## Vì sao

Mở "Bảng nháp STEM" ở Bạn Đồng Hành › Thử thách, màn 1440px:

- hộp thoại bị đẩy xuống nửa dưới màn hình, cắt mất danh sách bước;
- nền mờ chỉ phủ khung studio, không phủ sidebar và thanh trên cùng;
- ở đáy còn hở một dải 16px không được phủ.

Đo trong trình duyệt: lớp phủ `fixed inset-0` bắt đầu ở `y = 147` thay vì 0, cao 469–1494px
thay vì 900px. Có **hai nguyên nhân**:

1. **Hoạt ảnh giữ `transform`.** Các studio bọc trong `animate-fade-in`, khai báo
   `fade-in 0.35s ease-out both`. Fill-mode `both` giữ khung cuối (`transform: translateY(0)`)
   mãi sau khi chạy xong. Phần tử có `transform` thành containing block, nên mọi con
   `position: fixed` neo theo nó thay vì màn hình.
2. **Lề từ `space-y-4`.** Lớp phủ là con trực tiếp của khung studio `space-y-4`. Tailwind 4 gán
   `margin-bottom: 16px` cho mọi con trừ con cuối, nên lớp phủ hụt 16px ở đáy.

Đây là **lần thứ ba** bẫy (1) xuất hiện. Hai lần trước đều vá cục bộ:

- `Celebration.tsx` phải portal ra `document.body`;
- `OfflineSyncIndicator.tsx` phải né `-translate-x-1/2`.

Chưa ai sửa gốc.

## Việc đã làm

### A. Sửa gốc: hoạt ảnh chạy một lần không giữ khung cuối

`apps/dhcb/tailwind.config.js`: sáu hoạt ảnh chạy một lần đổi fill-mode `both` → `backwards`:
`fade-in`, `fade-up`, `scale-in`, `pop-correct`, `shake`, `companion-cheer`.

- Khung cuối của cả sáu trùng style gốc (opacity 1, không dịch/phóng), nên hình ảnh sau khi
  chạy xong **giữ nguyên**. Chỉ khác ở chỗ không còn để lại `transform`.
- `backwards` vẫn áp khung đầu trong thời gian `delay`, nên các lớp `delay-*` (hiện dần lần
  lượt) không đổi.
- Chế độ "giảm chuyển động" (duration 0) trả phần tử về style gốc, cũng là trạng thái hiển thị
  đầy đủ. Đã sửa chú thích tương ứng ở `index.css` và `e2e/helpers/axe.ts`.
- Đã quét 229 chỗ dùng ba hoạt ảnh xuất hiện: không phần tử nào kèm lớp `opacity-*` hay
  `transform` riêng có thể bị lộ ra sau khi hoạt ảnh không còn giữ khung cuối.

### B. 10 hộp thoại trong studio render qua portal

Bọc phần trả về trong `createPortal(…, document.body)`, giống
`apps/dhcb/src/components/Modal.tsx`. Portal thoát khỏi cả hai bẫy, kể cả bẫy lề `space-y-4`
mà bước A không gỡ được.

| Studio    | Hộp thoại                                                                             |
| --------- | ------------------------------------------------------------------------------------- |
| Thử thách | `StemScratchpadModal`, `PvPArenaLobbyModal`, `PvPBattlefieldModal`, `LiveDebateModal` |
| Ghi nhớ   | `MemoryPalaceExplorerModal`, `MetacognitiveReflectionModal`                           |
| Kế hoạch  | `ProactiveAgentSettingsModal`, `MicroDrillModal`                                      |
| Tổng kết  | `LifeSynthesisDetailModal`, `AgentOrchestratorModal`                                  |

`MicroDrillModal.test.tsx` đổi chỗ tìm nút từ `container` sang `document.body`, vì hộp thoại
nay nằm ngoài `container`. Nội dung kiểm giữ nguyên.

### C. Cổng chốt chặn (TRAPS mục 18)

- `apps/dhcb/src/lib/tailwindAnimations.test.ts`: hoạt ảnh chạy một lần mà khung cuối có
  `transform` thì không được dùng `both`/`forwards`. **Đã kiểm cổng bắt được lỗi:** đổi `fade-in`
  về `both` → đỏ.
- `e2e/studio-modal-overlay.spec.ts`: mở hộp thoại ở studio Thử thách và Ghi nhớ, đo lớp phủ phải
  đúng `{x: 0, y: 0, width, height}` của cửa sổ ở 1440px và 390px. **Đã kiểm trên mã cũ:** đỏ với
  `y = 147`, cao 469 và 1494px.

## Bằng chứng

- **Ảnh chụp trước/sau (Tầng 8b)**, 1440px + 390px, hộp thoại STEM (Dark blue) và Cung Điện Trí
  Nhớ (Blue sky):
  - Trước: lớp phủ chỉ phủ khung studio, hộp thoại lệch xuống, sidebar và thanh trên không bị
    làm mờ.
  - Sau: phủ kín cả trang (kể cả thanh điều hướng dưới trên mobile), hộp thoại nằm giữa.
- **So điểm ảnh các trang không mở hộp thoại** (Playwright `toHaveScreenshot`, tua hoạt ảnh tới
  cuối), bản cũ so với bản mới:
  - `/ghi-chu`: 0 điểm ảnh khác ở cả hai khổ.
  - `/` và `/tien-do`: 12–58 điểm ảnh, chỉ nằm trong nét chữ (khử răng cưa).
  - `/ban-dong-hanh` 390px: 2 điểm ảnh.
  - Bản cũ so với chính nó cho 0 điểm ảnh, nên các khác biệt trên là thật. Nguyên nhân: phần tử
    giữ `transform` bị đẩy lên lớp compositing riêng, chữ trong đó được khử răng cưa khác một
    chút. Không có dịch chuyển bố cục nào.
- Cổng: xem mô tả PR.

## Còn mở

- 10 lớp phủ `fixed inset-0` khác vẫn render tại chỗ (chưa portal), ví dụ `FeedbackModal`,
  `ShareProgress`, `QuickActions`, `IntegrationsModal`. Bẫy `transform` đã gỡ gốc cho chúng.
  Bẫy lề `space-y-*` chỉ xảy ra nếu chúng là con của khung `space-y-*`. Lệnh rà nằm ở TRAPS mục
  18; chưa rà từng cái trong đợt này.
- Hoạt ảnh **lặp vô hạn** (`float`, `orbit`…) luôn có `transform` khi chạy — fill-mode không đổi
  được điều đó. Đừng đặt hộp thoại trong phần tử chạy hoạt ảnh vô hạn (ghi ở chú thích test).
