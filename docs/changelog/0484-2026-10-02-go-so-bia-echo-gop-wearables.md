# 0484 — Gỡ số bịa ở Echo Shadowing, "GOP Lab" và thẻ Wearables (2026-10-02)

- **Ngày:** 2026-10-02 · **PR:** #1219 · **Loại:** `fix(companion)`.
- **Quyết định (chủ dự án chọn 2026-10-02, cho ba nợ 🔴 ghi ở 0478/0479/0481):**
  - Echo Shadowing: bỏ điểm, giữ bài luyện 3 pha;
  - GOP Lab: bỏ mọi con số, đổi thành gợi ý luyện âm;
  - Wearables: ẩn thẻ.

## Vấn đề

Ba thẻ trong Bạn Đồng Hành hiện con số như thể đã đo, nhưng thực ra không đo gì:

- **Echo Shadowing** (studio Thử thách): thẻ "giả lập" 4,5 giây ghi âm nhưng không ghi gì. Thẻ gửi
  độ trễ và độ chính xác âm vị bằng `Math.random()`, server tính "Band", độ đồng bộ nhịp và độ trôi
  chảy từ đó.
- **"Acoustic Phonetics & GOP Lab"** (studio Thử thách): đoán âm sai từ chính tả, rồi gán "Điểm GOP"
  bằng công thức cứng (`92 - idx * 3`, lệch thì 48). Lưu loát, ngữ điệu, WPM cũng là số suy ra.
- **Wearables & Circadian** (studio Kế hoạch): HRV, nhịp tim, giấc ngủ đều là `Math.random()`, kèm
  huy hiệu "BIO-SYNC ACTIVE" và nút HealthKit/Oura/Garmin. Không có tích hợp thiết bị nào.

## Đã làm

- **Echo Shadowing**
  - `EchoShadowingCard.tsx` viết lại thành bài luyện **3 pha**: nghe chủ động → nói đuổi → tự nói.
    - Mỗi pha có hướng dẫn và nút phát giọng mẫu bằng TTS thật (`speak`); bấm lại để dừng.
    - Có nút chuyển pha trước/tiếp và "Luyện lại từ đầu".
    - Ghi rõ "không ghi âm và không chấm điểm".
  - Server: bỏ `evaluateShadowingSession`; hợp đồng bỏ `ShadowingSessionSchema` và
    `AcousticDriftSampleSchema`. POST `/api/echo-shadowing` trả **501
    `ECHO_SHADOWING_SCORING_UNAVAILABLE`**; GET danh mục bài mẫu giữ nguyên.
  - Sửa câu mẫu mà TTS sẽ đọc to: "someone else's life", "other people's thinking". Câu pitch bỏ
    "five life domains" (ba trụ đã xoá).
- **Gợi ý luyện âm** (thay GOP Lab)
  - Thêm `packages/core-ai/pronunciationHints.ts`, hàm thuần chạy ở giao diện, không gọi server.
    - Ma trận lỗi L1 có 6 âm: /θ/, /ð/, /æ/, /r/, /ʃ/ và /ks/ cuối, kèm mẹo đặt lưỡi.
    - Nhận diện theo chữ viết: tách /θ/ và /ð/ bằng danh sách từ hữu thanh; /æ/ chỉ bắt ở từ một âm
      tiết kiểu bad/man/that.
    - Không có con số.
  - `AcousticPhoneticsLab.tsx` đổi thành `PronunciationHintsCard.tsx`. Thẻ hiện âm hay nhầm, các từ
    chứa âm đó và mẹo; có nút "Nghe câu mẫu"; ghi rõ gợi ý dựa trên chữ viết.
  - Xoá `acousticPhoneticsService.ts` (+ test) và hai schema `PhonemeAcousticScore`/
    `AcousticPhoneticsReport`. `/api/acoustic-phonetics` trả **501
    `ACOUSTIC_SCORING_UNAVAILABLE`**.
- **Wearables**
  - Gỡ thẻ khỏi `StudioProactive.tsx`. Xoá `WearablesSyncCard.tsx`, `wearablesIntegrationService.ts`
    và `core-contracts/wearablesIntegration.ts` (+ test).
  - `/api/wearables-sync` trả **501 `WEARABLES_UNAVAILABLE`**.
  - Dữ liệu cũ chỉ nằm trong bộ nhớ tạm của service, không có bảng CSDL nào phải dọn.
- **Đi kèm:**
  - allowlist `UiNoise.design.test.ts` bỏ các dòng của thẻ đã gỡ và hiệu ứng "đang ghi âm" giả;
  - 4 skill (cả `.claude/` và `.agents/`) đối chiếu lại: `multimodal-realtime-voice-master`,
    `pedagogy-linguistics-master`, `ui-ux`, `principal-engineer-architect`;
  - ba nợ dời sang `docs/legacy/no-ky-thuat-da-dong.md`.

## Không làm

- Chấm phát âm hay nói đuổi thật cần ghi âm cộng forced alignment, đo độ trễ từ bản ghi. Đây là tính
  năng mới, cần đặc tả. Luật trong skill: không thêm lại điểm khi chưa đo được.
- Thẻ "3D Articulatory Phonetics" ở cùng studio chưa rà trong đợt này.

## Bằng chứng

- Test mới hoặc viết lại:
  - `EchoShadowingCard.test.tsx` (5 ca): đi hết 3 pha không có POST nào, không hiện Band/ms/%;
    `speak` nhận đúng câu; lỗi phát có `role=alert`; nút dừng.
  - `PronunciationHintsCard.test.tsx` (4 ca).
  - `pronunciationHints.test.ts` (6 ca).
  - Ba handler đều có test 501 không trả số.
  - `echoShadowingService.test.ts`: canh hàm chấm không còn export, câu mẫu đúng ngữ pháp.
- Tầng 8b: chụp studio Thử thách và Kế hoạch ở 1440px và 390px, trước và sau.
  - Hai thẻ mới không tràn ngang ở 390px; ba pha nằm vừa một hàng.
  - Studio Kế hoạch mất thẻ Wearables mà không để lại khoảng trống.
