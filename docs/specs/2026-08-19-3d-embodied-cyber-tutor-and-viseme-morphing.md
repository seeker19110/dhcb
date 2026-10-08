# Feature spec: 3D Embodied Cyber-Tutor & Real-Time Viseme Morphing Engine (Platform V4 Phase 2)

| Thuộc tính   | Giá trị                         |
| ------------ | ------------------------------- |
| Issue        | #v4-02-3d-embodied-cyber-tutor  |
| Spec owner   | Platform Core Team              |
| Trạng thái   | **Approved for implementation** |
| Người duyệt  | Architecture Owner              |
| Ngày duyệt   | 2026-08-19                      |
| Lần cập nhật | 2026-08-19                      |

> Trạng thái: **Approved for implementation** — Triển khai diện mạo 3D Cyber-Humanoid Robot Avatar tương tác sống động, đồng bộ trực tiếp với luồng đàm thoại Full-Duplex Realtime Voice và phân tích âm học GOP.

> **Cập nhật 2026-10-08 (changelog 0534):** `/api/realtime-multimodal` cùng `packages/core-ai/realtimeMultimodalService.ts` và `packages/core-contracts/realtimeMultimodal.ts` đã GỠ — không client nào gọi, Map phiên trong bộ nhớ không dọn. Đàm thoại thời gian thực thật đi qua `/api/gemini-live`.

---

## 1. Tóm tắt quyết định

Nâng cấp diện mạo Bạn Đồng Hành từ quả cầu ánh sáng trừu tượng và Avatar 2D SVG tĩnh lên **3D Embodied Cyber-Tutor (Robot Nữ Cyber-Humanoid 3D)**. Kết hợp công nghệ WebGL / High-Performance Canvas 3D Rendering với **Real-Time Viseme Morphing Engine 15-Oculus Blendshapes**, đồng bộ chính xác từng mili-giây với luồng âm thanh PCM đàm thoại song công và phân tích âm học GOP. Đảm bảo 60 FPS mượt mà trên cả điện thoại di động và máy tính mà không làm nặng ứng dụng (0 MB tài nguyên ngoài tải chậm, 100% thủ tục toán học và PBR lighting nhẹ).

---

## 2. Vấn đề, người dùng và bằng chứng

- **Persona/job-to-be-done**: Học viên luyện phản xạ giao tiếp tiếng Anh và người dùng tương tác với Bạn Đồng Hành muốn có cảm giác đối thoại với một 'thực thể trí tuệ sống' chân thực, có biểu cảm, ánh mắt dõi theo và khẩu hình chuẩn xác.
- **Hiện trạng & Pain point**:
  - Giao diện Live Orb Canvas tuy mượt mà nhưng mang tính chất 'loa thông minh' trừu tượng.
  - Avatar 2D cũ không có chiều sâu không gian 3D, không có tương tác ánh mắt (Gaze Tracking) và cử động thở tự nhiên.
- **Mục tiêu**:
  - Tái hiện sống động nhân vật Cyber-Humanoid Robot Avatar 3D với phong cách viền sáng Emissive Cyan/Accent đổi màu theo Theme, ánh mắt dõi theo con trỏ chuột/chạm tay, cử động thở tự nhiên (breathing idle) và khẩu hình dải sáng LED Morphing phản xạ chuẩn 15 visemes âm vị học.

---

## 3. Nghiên cứu hiện trạng

### Code và luồng liên quan

- `packages/core-contracts/realtimeMultimodal.ts`: Hợp đồng V4 Realtime & Acoustic GOP.
- `packages/core-ai/realtimeMultimodalService.ts`: Động cơ đàm thoại Full-Duplex song công.
- `packages/core-ai/acousticPhoneticsService.ts`: Động cơ phân tích âm học GOP F1, F2, F0.
- `apps/english/src/components/CompanionVoice/`: Thư viện giao diện thoại tại `/dong-hanh`.

---

## 4. Phương án và quyết định

| Phương án                                                                           | Lợi ích                                                                                                            | Chi phí/rủi ro                                          | Kết luận               |
| :---------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------ | :--------------------- |
| **A. Tải Model 3D GLB cồng kềnh (50–100MB)**                                        | Chi tiết đa giác cao                                                                                               | Tải chậm, crash RAM mobile, phụ thuộc tài nguyên ngoài  | ❌ Loại bỏ             |
| **B. Native WebGL/Procedural 3D Cyber-Humanoid Shader Engine + 15 Viseme Morphing** | Siêu nhẹ (< 50KB code), khởi động 0ms, 60 FPS mượt mà trên mọi thiết bị, 100% theme adaptive, zero external assets | Cần tính toán hình học giải tích và PBR Shader cẩn thận | ✅ **Lựa chọn tối ưu** |

---

## 5. Outcome và guardrails

- **FPS Target**: >= 60 FPS ổn định trên cả thiết bị di động tầm trung.
- **Latency Viseme Sync**: Độ trễ từ luồng âm thanh PCM đến cập nhật khẩu hình <= 16ms (1 frame).
- **Bundle Size Guardrail**: Tăng kích thước bundle < 30KB (không thêm thư viện ngoài nặng nề).
- **Theme Parity**: Emissive Shader tự động đồng bộ màu theo 5 theme của ứng dụng (Dark Blue, Blue Sky, Pink, Vibrant, Kid).

---

## 6. Scope và Yêu cầu Kỹ thuật

### In scope

1. **Hợp đồng dữ liệu `packages/core-contracts/avatarEmbodiment.ts`**:
   - Định nghĩa `Avatar3DStateSchema`, `VisemeMorphTargetSchema`, `Oculus15VisemeEnum`, `AvatarEmotionStateSchema`.
2. **Động cơ Morphing `packages/core-ai/visemeMorphingService.ts`**:
   - Thuật toán trích xuất biên độ âm vị và ánh xạ 15 blendshapes Oculus (`sil, PP, FF, TH, DD, kk, CH, SS, nn, RR, aa, E, I, O, U`) từ luồng PCM và GOP scores.
3. **Engine Kết xuất 3D `apps/english/src/components/Companion3D/`**:
   - `CyberTutorAvatar3D.tsx`: Trình kết xuất 3D WebGL/Canvas với PBR Lighting, Emissive Visor, Ánh mắt Gaze Tracking, Head Pitch/Yaw tilt, và Breathing micro-movements.
   - `AvatarEmbodimentSelector.tsx`: Tùy chỉnh chế độ hiển thị (Full 3D / Live Orb / Minimalist).
4. **Tích hợp vào Companion Hub (`apps/english/src/pages/Companion.tsx`)**:
   - Hiển thị trực tiếp tại trung tâm Bạn Đồng Hành, kết nối mượt mà với WebSocket Realtime Full-Duplex.
5. **API Route `api/avatar-embodiment.ts`** & Unit/Integration Tests.

---

## 7. Kế hoạch Kiểm thử

- **Unit tests**: Kiểm thử thuật toán phân rã Viseme Morphing, chuyển đổi cảm xúc, tương thích schema Zod.
- **Integration tests**: Kiểm thử luồng phát âm thanh -> Viseme Morph target -> Frame render.
- **Quality Gates**: `npm test`, `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm run build` đều đạt 100% xanh.
