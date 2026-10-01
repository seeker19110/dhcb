# ADR-0013: Tích hợp CHỌN LỌC ý tưởng của ECC — chuyển thể, không cài plugin

- **Trạng thái:** Đã chấp nhận
- **Ngày:** 2026-10-01

## Bối cảnh

Chủ dự án yêu cầu nghiên cứu sâu repo nổi tiếng ECC ("Everything Claude Code",
`github.com/affaan-m/ECC`, MIT, bản 2.2.2) rồi tích hợp sâu vào DHCB. ECC là bộ cấu hình tác tử
lớn: 68 agent, 293 skill, 94 lệnh, hook chạy bằng Node, rules theo ngôn ngữ, bộ nhớ học liên tục,
và công cụ quét an ninh AgentShield. Báo cáo đầy đủ:
[`docs/research/ecc-everything-claude-code.md`](../research/ecc-everything-claude-code.md).

Ràng buộc của DHCB: CLAUDE.md đã ~51 nghìn ký tự nạp mỗi phiên; có sẵn hệ lệnh/agent/hook riêng
(`/gate`, `/review` + OpenCodeReview, `/debug`, `pre-commit-gate.sh`…); vài luật DHCB trái với mặc
định của ECC (cho phép `--no-verify` có chủ đích, cấm xoá `package-lock.json`, không còn
Supabase/RLS); phiên cloud chạy trong container bị thu hồi.

## Quyết định

**Không cài plugin `ecc@ecc`, không chép thư mục của ECC.** Chuyển thể (viết lại bằng tiếng Việt,
theo quy ước và bẫy thật của DHCB, ghi nguồn MIT) đúng những phần lấp chỗ trống có thật:

1. Hook `config-protection.sh` (PreToolUse) — sửa một cổng chất lượng đi qua **hai nấc**: lần đầu
   chạm cổng đó trong phiên → `deny` kèm lý do (tác tử phải nói rõ với người dùng sửa gì + vì sao
   rồi mới thử lại — kiểu "fact-forcing" của GateGuard trong ECC); từ lần sau → `ask`. Không chặn
   cứng vĩnh viễn như bản gốc.
2. Hook `auto-format.sh` (PostToolUse) — Prettier sau mỗi lần sửa; tài liệu đã nói hook này tồn
   tại từ lâu nhưng thực tế chưa có.
3. `permissions.ask` cho `Read(.env)`, `Read(.env.*)` (trừ `.env.example`), `~/.ssh/**`, `~/.aws/**`.
4. Test CI `scripts/agent-config-security.test.ts` — bản offline của các nhóm kiểm AgentShield:
   ký tự vô hình, cấu hình `settings.json` nguy hiểm, hook phải là script được git theo dõi, hook
   không gọi mạng, agent chỉ-đọc không có công cụ ghi, hành vi của `config-protection.sh`.
5. Agent `build-error-resolver`, `silent-failure-hunter`, `database-reviewer`; lệnh `/build-fix`,
   `/learn` (bài học vào `TRAPS.md`, có người duyệt — thay cho "học liên tục" tự động).

## Lý do

- **Giá trị nằm ở ý tưởng, không ở số lượng.** Năm ý tưởng mạnh nhất của ECC (hook thi hành luật,
  nạp đúng lúc, rà từ ngữ cảnh sạch, bài học thành tài sản, cấu hình tác tử là bề mặt tấn công)
  đều áp được bằng vài file nhỏ viết riêng cho DHCB.
- **Ngữ cảnh là tài nguyên khan hiếm** — chính nguyên tắc của ECC. Cài cả catalog sẽ đưa hàng
  trăm mô tả skill/agent vào mọi phiên, phần lớn không liên quan (healthcare, trading, Laravel…).
- **Không thêm phụ thuộc chạy được của bên thứ ba**: hook bash ngắn, đọc được trong vài phút,
  cùng phong cách với `block-dangerous-git.sh`; không đổi `package-lock.json`.
- **Hai nấc thay vì "chặn" hay chỉ "hỏi"**: sửa cổng đôi khi là việc chính đáng; người quyết là
  chủ dự án (CLAUDE.md mục 12). Bản đầu của hook chỉ trả `ask` — **đo thật** trong chính phiên
  làm đợt này (cloud, auto mode, mở từ iOS, Claude Code 2.1.286): transcript ghi hook trả `ask` hai
  lần nhưng không hộp hỏi nào hiện, Edit chạy thẳng. `deny` lần đầu thì luôn có hiệu lực ở mọi chế
  độ, và lý do từ chối buộc tác tử nói thẳng với người dùng trước khi làm tiếp — đã thấy hoạt động
  thật hai lần khi sửa chính các test canh luật trong đợt này.

## Các phương án đã cân nhắc

- **Cài plugin `ecc@ecc` (hồ sơ hook standard):** nhanh nhưng kéo 68 agent + 293 skill vào ngữ
  cảnh, hook Node chạy mọi lệnh, và luật mâu thuẫn (`block-no-verify`). Loại.
- **Chép nguyên vài file `.md`/`.js` của ECC:** giữ được "chính chủ" nhưng mang theo lời khuyên sai
  cho DHCB (RLS, `rm package-lock.json`, coverage 80%). Loại.
- **Chạy `npx ecc-agentshield scan` trong CI:** quét sâu hơn, nhưng thêm mã bên thứ ba chạy trên
  CI mỗi PR. Để dành — chủ dự án có thể chạy tay khi cần.
- **Chỉ viết tài liệu nghiên cứu, không tích hợp:** không đáp ứng yêu cầu "tích hợp sâu".

## Hệ quả

- **Tích cực:** đường tắt "nới cổng cho xanh" không còn đi im lặng; format luôn đúng ngay khi sửa;
  Claude phải hỏi trước khi mở file bí mật (`Read`, `cat`, `head`…); CI chặn cấu hình tác tử nguy
  hiểm; thêm ba vai rà soát chuyên biệt.
- **Đánh đổi:** thêm ~0,3 giây sau mỗi lần sửa file (Prettier); sửa cổng tốn thêm một lượt (bị
  từ chối lần đầu); ở phiên cloud auto mode nấc `ask` không hiện hộp hỏi nên lớp bảo vệ thật ở đó
  là nấc `deny` + lý do hiển thị trong transcript; luật `permissions.ask` cho `.env` CHƯA được thử
  thực địa ở phiên cloud (thử là phải bật hộp hỏi giữa chừng). Hook
  theo tool không bắt được sửa qua Bash (`sed -i`) — CI vẫn là tuyến cuối. Luật `ask` cho `.env`
  là mức "cố gắng tốt nhất" (tài liệu Claude Code): `Grep` quét cả thư mục hay một script tự mở
  file thì không bị hỏi — rào cứng thật sự cần sandbox cấp hệ điều hành.
- **Việc tiếp theo (chờ chủ dự án):** sáu đề xuất đợt 2 ở mục 6 của báo cáo nghiên cứu — đáng kể
  nhất là rà rồi chuyển `.agents/skills/` sang `.claude/skills/` (hiện Claude Code không nạp) và
  rút gọn CLAUDE.md.
