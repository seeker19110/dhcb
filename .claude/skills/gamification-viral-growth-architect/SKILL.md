---
name: gamification-viral-growth-architect
description: 'Kỹ năng Nghiệp vụ Gamification & Lan toả: đấu trường 1v1 PvP (đối thủ AI), xếp hạng Elo, mời bạn nhận VIP, nhiệm vụ, chuỗi ngày học (streak) và chia sẻ. Kích hoạt khi xây hoặc sửa đấu trường, điểm xếp hạng, phần thưởng, nhiệm vụ, streak hoặc tính năng chia sẻ/mời bạn.'
---

# GAMIFICATION, 1V1 PVP ARENA & VIRAL GROWTH

Quy chuẩn cho phần thưởng, thi đấu và lan toả trong Đồng Hành. Phần thưởng chạm tới **quyền lợi
trả phí (ngày VIP)** → đọc skill `financial-security-sentinel` mục 2 trước khi sửa.

> **Đối chiếu mã ngày 2026-10-02.** Bản trước của skill này mô tả như ĐÃ CÓ:
>
> - ghép cặp người thật;
> - lộ trình mốc mời bạn 1/3/5/10;
> - bộ 3 nhiệm vụ ngày → rương → vé đóng băng chuỗi;
> - trình tạo ảnh Story Canvas `ViralShareCardGenerator.tsx`.
>
> **Không cái nào tồn tại.** Khi skill và mã lệch nhau, **MÃ thắng**.

---

## 1. ĐẤU TRƯỜNG 1V1 PVP — ĐỐI THỦ LÀ AI

`packages/core-ai/pvpArenaService.ts` (API `apps/server/src/api/platform/pvp-arena.ts`, hợp đồng
`packages/core-contracts/pvpArena.ts`), giao diện `apps/dhcb/src/components/PvPArena/`.

**Thực tế ghép cặp:** **chỉ có đối thủ AI** ("ghost rival"):

- `matchmakeGhostRival` chọn một bot trong `GHOST_RIVALS` ("Bot Oxford", "Bot Cambridge"…);
- Elo của bot lệch ±35 quanh người chơi; số trận/thắng/chuỗi của bot luôn là 0;
- **không có** hàng đợi người thật.

**Luật trung thực (BẮT BUỘC, changelog 0482):**

- tên bot bắt đầu bằng "Bot ", không dùng cờ quốc gia, không bịa lịch sử thi đấu (test
  `pvpArenaService.test.ts` canh);
- màn trận đấu hiện nhãn "Đối thủ AI"; thẻ và sảnh ghi "Đấu với đối thủ AI";
- màn kết thúc chỉ hiện Elo **thật** server trả về (`match.eloChanges`), không hiện phần thưởng
  chưa được cộng vào đâu (vd "Exp") — test `PvPBattlefieldModal.test.tsx` canh;
- không bịa số người chơi online, không mô tả là "đấu với người thật".

**3 chế độ** (`PvPGameModeSchema`):

- `vocab_speed_duel` — phản xạ từ vựng;
- `grammar_clash` — bắt lỗi ngữ pháp;
- `toulmin_showdown` — tranh biện phản xạ.

Câu hỏi lấy từ ngân hàng theo chế độ, xáo thứ tự.

---

## 2. XẾP HẠNG ELO

- Kỳ vọng thắng: `E_A = 1 / (1 + 10^((R_B − R_A) / 400))`.
- Cập nhật: `R'_A = R_A + K · (S_A − E_A)`, với `K = 32` (tham số `kFactor` trong
  `pvpArenaService.ts`); `S_A` = 1 thắng / 0,5 hoà / 0 thua.
- Elo đấu với AI chỉ phản ánh phong độ trước bộ câu hỏi, **không** so được với người khác — đừng
  dựng bảng xếp hạng công khai từ con số này mà không nói rõ.
- Bảng xếp hạng (`realLeaderboard` trong `apps/server/src/api/platform/pvp-arena.ts`) là top 10 Elo
  **toàn thời gian** (không phải "tuần"), hiện biệt danh hoặc tên tài khoản cho mọi người chơi — nợ
  🟡 quyền riêng tư trong `PROGRESS.md`; đừng mở rộng thêm thông tin cá nhân lên bảng này.
- Ngưỡng bậc rank: đọc trong mã/hợp đồng, đừng chép bảng số vào đây.

---

## 3. MỜI BẠN NHẬN VIP

`apps/server/src/api/_lib/referral.ts` (API `apps/server/src/api/platform/referral.ts`, giao diện
`apps/dhcb/src/components/ReferralSection.tsx`):

- `REFERRAL_REWARD_DAYS = 7` ngày VIP cho **cả hai** bên, cấp qua `grantPlanDays` trong cùng
  transaction.
- Điều kiện đủ do server tự kiểm; có trần số lần thưởng cho người mời; mỗi người chỉ được mời một
  lần; mã mời 6 ký tự sinh bằng `randomInt`.
- **CHƯA CÓ:** lộ trình mốc 1/3/5/10 bạn, huy hiệu, khung avatar, danh hiệu.

---

## 4. NHIỆM VỤ & CHUỖI NGÀY

- `apps/server/src/api/_lib/quests.ts` (API `apps/server/src/api/platform/quests.ts`): 4 nhiệm
  vụ, xếp theo độ tin cậy xác minh.
  - "Chia sẻ công khai" và "Học liên tiếp N ngày" **thưởng 0 ngày VIP** — client không chứng minh
    được.
  - "Thi đạt cấp CEFR" thưởng 3 ngày, chỉ đọc kết quả server chấm.
  - "Mời bạn" gộp số liệu từ referral.
- **Luật: không cấp quyền lợi từ thứ client tự khai** (bấm nút chia sẻ, tiến độ tự báo…).
- Chuỗi ngày: mảng `streak_freeze_dates` trong tiến độ người học. **CHƯA CÓ** rương bí ẩn hay vé
  đóng băng thưởng từ nhiệm vụ.
- Phản hồi ăn mừng chỉ sau kết quả thật, không chồng toast lên thứ người dùng đã thấy (skill `ui-ux`
  mục 10.A.6).

---

## 5. CHIA SẺ

**CHƯA CÓ** trình tạo ảnh thẻ chia sẻ (Story Canvas 1080×1920, QR mời bạn). Nhiệm vụ "Chia sẻ công
khai" chỉ ghi nhận lượt bấm Web Share, không chứng minh bài đã đăng (vì thế thưởng 0). Muốn làm thẻ
chia sẻ thì cần đặc tả + Tầng 8b (ảnh chụp 1440/390).
