# Đặc tả — Bạn Đồng Hành GĐ4b: nhắc nghỉ khi trẻ trò chuyện lâu (tất định, không dựa vào AI)

- **Ngày:** 2026-10-13 · **Trạng thái:** Approved for implementation. Khung 4 giai đoạn được chủ dự án
  chốt ngày 2026-10-11 ("làm lần lượt cả 4"). GĐ4b được giao trong phiên 2026-10-13: "tiếp mục kế
  tiếp theo khuyến nghị".
- **Nghiên cứu:** `docs/research/nang-cap-ban-dong-hanh-2026-10-11.md`
  - mục 2.3: OpenAI nhắc nghỉ khi phiên dài; đo "rời đi đã làm xong việc", không đo thời gian ở lại;
  - mục 2.4: California SB 243 `[thứ cấp]` buộc nhắc nghỉ với người dùng nhỏ tuổi và nói rõ đây là
    AI; Character.AI bỏ chat mở cho người dưới 18 tuổi;
  - mục 3, dòng GĐ4.
- **GĐ trước:** `docs/specs/2026-10-12-ban-dong-hanh-gd4a-the-hom-nay.md` (đã merge, PR #1392).

## 0. Một câu

Khi người dùng nhóm `nhi_dong` hoặc `thieu_nien` trò chuyện liên tục với Bạn Đồng Hành quá một
ngưỡng thời gian, trang hiện một **lời nhắc nghỉ do người viết sẵn**. Lời nhắc có hai lựa chọn:
"Mình nghỉ đây" và "Thêm một chút". Thời gian do **mã đếm**, không nhờ AI tự đoán.

## Hiện trạng đo trong mã (trước GĐ4b)

| Điểm                 | Mã thật                                                                                                                | Hệ quả                                                                                                                                     |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Lời dặn trong prompt | `AGE_GROUP_GUIDANCE` (`packages/core-personal/companionPrompt.ts`) có câu "Em học lâu (hơn 30 phút) thì nhắc nghỉ mắt" | Mô hình KHÔNG biết phiên đã kéo dài bao lâu, vì prompt không có mốc thời gian phiên ⇒ lời nhắc hoặc không bao giờ đến, hoặc đến ngẫu nhiên |
| Giao diện            | Trang `/ban-dong-hanh` không có bộ đếm thời gian phiên nào                                                             | Trẻ có thể trò chuyện hàng giờ mà không có gì nhắc                                                                                         |
| Nhóm tuổi ở client   | `useOnboarding(uid).ageGroup` (`apps/dhcb/src/lib/onboarding.ts`), đã dùng để khoá theme Nhi đồng                      | Có sẵn tín hiệu, không cần API mới                                                                                                         |

## ① Phạm vi

**LÀM:**

- **Chính sách theo nhóm tuổi** (hằng số đặt tên, không dùng số ma thuật):

  | Nhóm         | Nhắc lần đầu sau | Bấm "Thêm một chút" ⇒ nhắc lại sau | Nghỉ thật (không gửi lượt nào) ≥ |
  | ------------ | ---------------- | ---------------------------------- | -------------------------------- |
  | `nhi_dong`   | 20 phút          | 10 phút                            | 15 phút ⇒ tính là phiên mới      |
  | `thieu_nien` | 40 phút          | 15 phút                            | 15 phút ⇒ tính là phiên mới      |

  Nhóm `thanh_nien` và `nguoi_lon` không có lời nhắc. Ngưỡng 20 phút bám quy tắc nghỉ mắt
  20-20-20 thường dùng cho trẻ. Mọi ngưỡng ở đây đều chặt hơn nhiều so với trần 3 giờ của SB 243.

- **"Phiên" = chuỗi lượt gửi** (gõ chữ hoặc nói) mà hai lượt liền nhau cách nhau không quá ngưỡng
  nghỉ. Mỗi lượt gửi gọi `recordActivity`. Lời nhắc chỉ hiện khi CẢ HAI điều sau cùng đúng:
  - đã tới mốc nhắc;
  - phiên vẫn đang diễn ra, tức lượt cuối chưa quá ngưỡng nghỉ. Nếu trẻ đã rời đi rồi quay lại thì
    lời nhắc không bật lên.
- **Trạng thái lưu ở `localStorage`**, với khoá riêng theo từng người dùng. Nhờ vậy tải lại trang
  hay mở tab mới không làm đồng hồ về 0. Dữ liệu đọc lên được kiểm bằng Zod; hỏng hoặc thiếu thì
  coi như chưa có phiên. Mọi thao tác đọc/ghi đều bọc `try/catch`: ở chế độ riêng tư, trang vẫn
  chạy và đồng hồ chỉ sống trong bộ nhớ.
- **Lời nhắc** là một khối `role="status"`, không phải hộp thoại chặn, đặt trên studio:
  - Câu chữ viết sẵn theo nhóm tuổi, nói rõ "mình là bạn đồng hành AI" (SB 243), gợi ý việc cụ
    thể: vươn vai, uống nước, nhìn ra xa. **Không có câu tội lỗi** hay câu về chuỗi ngày (streak).
  - "Mình nghỉ đây": xoá phiên rồi về Trang chủ.
  - "Thêm một chút": dời mốc nhắc theo cột thứ ba của bảng trên.
- Kiểm định kỳ mỗi 30 giây khi trang mở (`setInterval`, dọn khi rời trang), cộng thêm một lần kiểm
  ngay sau mỗi lượt gửi.

**KHÔNG LÀM:**

- Khoá cứng hay giới hạn thời gian dùng, báo cho phụ huynh, đếm ở server. Lời nhắc là một cú hích
  nhẹ, không phải hàng rào bảo mật, nên đặt ở client là hợp lý. Luật "không tin client" (CLAUDE.md
  mục 4.2) áp cho kiểm quyền và đếm lượt AI, không áp cho lời nhắc UX.
- Sửa prompt (`AGE_GROUP_GUIDANCE`): sửa prompt Companion cần chạy lại eval với key thật. Câu cũ
  được giữ nguyên; lời nhắc tất định mới chạy song song, không phụ thuộc mô hình.
- Đếm thời gian ở studio khác (Ghi nhớ, Thử thách, Kế hoạch): chỉ lượt trò chuyện mới tính là hoạt
  động.

## ② Điểm chạm

| Việc | Đường dẫn file                                                              | Ghi chú                                                          |
| ---- | --------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Thêm | `apps/dhcb/src/lib/companionBreakReminder.ts`                               | chính sách, hàm thuần, câu nhắc viết sẵn, đọc/ghi `localStorage` |
| Thêm | `apps/dhcb/src/lib/companionBreakReminder.test.ts`                          | ca biên: phiên mới, nghỉ thật, dời mốc, dữ liệu hỏng, nhóm khác  |
| Thêm | `apps/dhcb/src/lib/useCompanionBreakReminder.ts`                            | hook: nạp/lưu trạng thái, đồng hồ 30 giây, `recordActivity`      |
| Thêm | `apps/dhcb/src/components/CompanionStudios/CompanionBreakReminder.tsx`      | khối lời nhắc, hai nút ≥ 44 px                                   |
| Thêm | `apps/dhcb/src/components/CompanionStudios/CompanionBreakReminder.test.tsx` | hook + khối với đồng hồ giả                                      |
| Sửa  | `apps/dhcb/src/pages/companion/Companion.tsx`                               | đọc `ageGroup`, gọi `recordActivity` trong `handleSend`          |
| Thêm | `e2e/a11y-companion-break.spec.ts`                                          | A/AA + AAA chữ nội dung, 3 theme; luồng hai nút                  |

## ③ Hợp đồng (client, không có API mới)

```ts
type BreakAgeGroup = 'nhi_dong' | 'thieu_nien'
interface BreakState {
  sessionStartMs: number
  lastActivityMs: number
  nextReminderAtMs: number
}
breakPolicyFor(ageGroup: AgeGroup | null | undefined): BreakPolicy | null
recordActivity(state: BreakState | null, nowMs: number, policy: BreakPolicy): BreakState
shouldRemind(state: BreakState | null, nowMs: number, policy: BreakPolicy): boolean
snooze(state: BreakState, nowMs: number, policy: BreakPolicy): BreakState
sessionMinutes(state: BreakState, nowMs: number): number
```

## ④ Tiêu chí chấp nhận

- [ ] `companionBreakReminder.test.ts`:
  - nhóm `thanh_nien`/`nguoi_lon`/`null` không có chính sách;
  - lượt đầu tạo phiên mới, mốc nhắc = bắt đầu + ngưỡng;
  - lượt cách lượt trước dưới ngưỡng nghỉ thì giữ phiên, quá ngưỡng thì tạo phiên mới;
  - đúng mốc thì `shouldRemind` = true, trước mốc 1 ms thì false;
  - quá ngưỡng nghỉ thì false dù đã qua mốc;
  - `snooze` dời mốc đúng số phút;
  - dữ liệu `localStorage` hỏng (JSON sai, thiếu khoá, số âm) ⇒ `null`;
  - `localStorage` ném lỗi ⇒ không ném ra ngoài.
- [ ] `CompanionBreakReminder.test.tsx` (đồng hồ giả):
  - `nhi_dong` gửi lượt, qua 20 phút (có gửi lượt giữa chừng) ⇒ lời nhắc hiện, câu có "AI";
  - "Thêm một chút" ⇒ ẩn, 10 phút sau hiện lại;
  - "Mình nghỉ đây" ⇒ gọi điều hướng về `/` và xoá trạng thái;
  - `nguoi_lon` ⇒ không bao giờ hiện;
  - trong câu không có "streak"/"chuỗi".
- [ ] `e2e/a11y-companion-break.spec.ts`: khối lời nhắc ở theme dark-blue, blue-sky, kid đạt 0 vi
      phạm A/AA.
- [ ] Tầng 8b: ảnh trang `/ban-dong-hanh` có lời nhắc ở 1440 px và 390 px, chụp trước và sau.

**Lệnh chứng minh:**

```bash
rm -rf packages/*/dist dist dist-server && npm run typecheck && npm run lint && npm run test:coverage && npm run build
npx playwright test e2e/a11y-companion-break.spec.ts
```

## ⑤ Bất biến không được phá

| Bất biến                                                       | Test canh                                         |
| -------------------------------------------------------------- | ------------------------------------------------- |
| Người lớn không bao giờ thấy lời nhắc                          | `CompanionBreakReminder.test.tsx`                 |
| Lỗi `localStorage` không làm vỡ trang                          | `companionBreakReminder.test.ts`                  |
| Không câu tội lỗi / streak; có nói rõ là AI                    | `CompanionBreakReminder.test.tsx`                 |
| Không gọi AI, không trừ lượt, không thêm request mạng          | kiểm khi review (module không import lớp API nào) |
| Luồng gửi tin hiện có (stream, giọng nói, hành động) không đổi | `Companion.*.test.tsx` hiện có                    |

## ⑥ Quy ước dự án liên quan

- Đọc/ghi `localStorage` phải bọc `try/catch` và trang vẫn render đúng khi thiếu nó.
- Chữ đọc đạt AAA, điều khiển đạt AA; dùng màu qua token `--z-*`/`--a-*`; vùng chạm ≥ 44 px.

---

## Nghiệm thu

- Lệnh đã chạy và kết quả thật: xem changelog `0631`.
