# Sales-Hunter platform entry — specification

Status: **Approved for implementation** — chủ dự án duyệt trong phiên ngày 2026-09-27
("Sửa rồi tích hợp"), kèm các điều chỉnh phạm vi ở mục "Điều chỉnh khi duyệt" bên dưới.
Owner request: integrate Sales-Hunter into donghanhcungban.org.
Related accepted Sales ADR: seeker19110/Sales-Hunter/docs/adr/0002-platform-subdomain-dhcb.md.
Việc merge PR này KHÔNG có nghĩa là Sales đã triển khai hay mở truy cập: cờ build vẫn tắt.

## Điều chỉnh khi duyệt (2026-09-27)

Bản đầu gắn khối vào `main.tsx`, nên nó hiện ở cuối **mọi** trang và làm đỏ E2E ở 4/6 mảnh
(AAA trang Vật lí, ma trận S07 reflow/44px, bố cục English 320/390px). Khi duyệt đã chốt:

- Khối chỉ đặt ở **trang chủ** (`apps/dhcb/src/pages/core/Home.tsx`): desktop ở rail phụ (giữ ngân
  sách chiều cao 1459px của cổng UX-R2), mobile cuối luồng chính; không trang nào khác có nó.
- Chỉ hiện khi giao diện là tiếng Việt: khối chưa có bản tiếng Anh cho chiều B.
- Màu dùng thang `zinc`/`white` đã map token theme; chữ nội dung đạt AAA ở 3 theme.
- Bỏ `lazy()` riêng (khối ~50 dòng, đã nằm trong chunk lười của trang chủ); vẫn giữ error
  boundary để lỗi của khối không làm sập trang.
- Cổng: `e2e/sales-hunter-entry.spec.ts` (mở bằng bàn phím, AA + AAA × 3 theme, không có link
  khi cờ tắt, không lọt sang trang khác).

## Scope

Add an independent, accessible product entry on the home page (desktop side rail, mobile end of main column) on the
main DHCB hostname. Do not restore removed Career/Startup/Life studios, alter router paths,
modify auth/billing/mastery, or embed an operator dashboard iframe. Sales stays a separate
Python application and independent deployment at sales.donghanhcungban.org.

The entry is visible on the root/WWW site and local development only, not en-vi or other
Learning hosts. It defaults to an honest unavailable state. The exact build flag
`VITE_SALES_HUNTER_PILOT_ENABLED=true` opens a fixed HTTPS URL in a new tab with no referrer,
query credentials, SSO handoff or extra tracking. This flag controls discoverability only;
it is never authorization. Direct access must be protected independently by Sales/Access.

## Acceptance

- Existing application, navigation and removed studio decisions remain intact.
- No destination URL from user input, localStorage or query strings.
- Disabled state has no clickable remote launch link; strings other than `true` stay off.
- Keyboard-accessible details and clearly labeled new-tab link.
- Separate staging/HTTPS/Access/rollback evidence from Sales is required before flag on.
- Test root and Learning hosts, desktop/mobile, keyboard focus and all existing themes.

## Deployment and rollback

No VPS, DNS, account or secrets are changed by this PR. Deploy the Sales read-only pilot and
record its checks first, then rebuild DHCB with the flag. Roll back the flag independently;
revoking existing Sales access also requires disabling Access/stopping Sales itself.
No claim is made that the complete Sales approval/publishing workflow is production ready.
