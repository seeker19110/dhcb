-- 0087_plan_marketing_gd1_copy.sql — Sửa nội dung mô tả gói (bảng plan_marketing_*) cho khớp
-- hạn mức THẬT sau GĐ1 (2026-09-12, docs/specs/2026-09-12-gd1-xoa-goi-pro.md).
--
-- VÌ SAO (audit UI/UX 2026-09-30 mục M8, đợt U5 — docs/changelog/0495-*.md): dòng seed của
-- 0025_plan_marketing.sql vẫn hứa với người dùng Free cơ chế ĐÃ BỎ ở GĐ1 — "+5 lượt AI/ngày có
-- học từ mới…, dồn tối đa 35 lượt trong 7 ngày" — trong khi Free thật được 30 lượt AI/ngày tính
-- TỔNG mọi tính năng (packages/core-billing/usage.ts, app_settings.pro_daily_limit). Chữ từ DB
-- (/api/plan-marketing) GHI ĐÈ chữ đúng trong UpgradeSection.tsx, nên sửa mã không đủ. Cùng đợt:
-- tagline Free "Học thử" (Free nay học đầy đủ, không phải bản dùng thử), thuật ngữ nhà cung cấp
-- "Chirp3-HD" ở gói VIP, và "không giới hạn thực tế" (VIP có hạn mức 300 lượt/ngày thật).
--
-- AN TOÀN VỚI CHỮ ADMIN ĐÃ SỬA: mỗi lệnh `update` chỉ khớp dòng còn ĐÚNG NGUYÊN VĂN seed cũ
-- (so cả text_vi lẫn text_en). Admin đã tự sửa dòng nào qua /admin (tab "Nội dung gói") thì
-- dòng đó KHÔNG bị đụng — chủ dự án kiểm lại tay (ghi trong changelog 0495).
--
-- LŨY ĐẲNG: chạy lại lần hai không khớp dòng nào nữa (chữ đã là bản mới) → update 0 hàng.
-- `updated_at = now()` để ETag của /api/plan-marketing đổi, client nạp lại nội dung mới.
--
-- KHÔNG đụng dòng của gói đã xoá ('pro'): giữ lịch sử như 0076 đã quyết, tầng ứng dụng không đọc.
--
-- ROLLBACK (chỉ là nội dung hiển thị, không ảnh hưởng quyền lợi hay hạn mức thật). Mỗi câu chỉ
-- khớp dòng còn đúng chữ MỚI, nên cũng không đè chữ admin sửa sau đó:
--   update public.plan_marketing_bullets set text_vi = '+5 lượt AI/ngày có học từ mới (Chat/Viết/Nói/Nghe), dồn tối đa 35 lượt trong 7 ngày', text_en = '+5 AI turns/day when you study new words (Chat/Writing/Speaking/Listening), rolling cap of 35 over 7 days', updated_at = now()
--    where plan = 'free' and text_vi = '30 lượt AI/ngày (Chat · Viết · Nói · Nghe) — không cần trả phí';
--   update public.plan_marketing_info set tagline_vi = 'Học thử, không tốn phí', tagline_en = 'Try it out, no cost', updated_at = now()
--    where plan = 'free' and tagline_vi = 'Học đầy đủ, miễn phí';
--   update public.plan_marketing_bullets set text_vi = 'Trọn bộ 14 giọng Chirp3-HD + giọng đặc biệt + 2 giọng Studio thu âm phòng thu (tiếng Anh)', text_en = 'All 14 Chirp3-HD voices + a special voice + 2 studio-quality voices (English)', updated_at = now()
--    where plan = 'vip' and text_vi = 'Trọn bộ giọng đọc bản xứ chất lượng cao, thêm một giọng đặc biệt và 2 giọng thu âm phòng thu (tiếng Anh)';
--   update public.plan_marketing_bullets set text_vi = '300 lượt AI/ngày — thoải mái luyện không giới hạn thực tế', text_en = '300 AI turns/day — practically unlimited', updated_at = now()
--    where plan = 'vip' and text_vi = '300 lượt AI/ngày (gấp 10 lần gói Free), tính chung mọi tính năng AI';
--
-- LƯU Ý: chữ trong DB ghi cứng "30"/"300" lượt — admin đổi hạn mức ở /admin thì nhớ sửa luôn nội
-- dung gói (tab "Nội dung gói"); đây là giới hạn chung của nội dung quảng cáo lưu DB.

-- Free — câu hạn mức sai (cơ chế kho lượt 7 ngày đã bỏ ở GĐ1).
update public.plan_marketing_bullets
   set text_vi = '30 lượt AI/ngày (Chat · Viết · Nói · Nghe) — không cần trả phí',
       text_en = '30 AI turns/day (Chat · Writing · Speaking · Listening) — no payment needed',
       updated_at = now()
 where plan = 'free'
   and text_vi = '+5 lượt AI/ngày có học từ mới (Chat/Viết/Nói/Nghe), dồn tối đa 35 lượt trong 7 ngày'
   and text_en = '+5 AI turns/day when you study new words (Chat/Writing/Speaking/Listening), rolling cap of 35 over 7 days';

-- Free — tagline "Học thử": Free sau GĐ1 là học đầy đủ, không phải bản dùng thử.
update public.plan_marketing_info
   set tagline_vi = 'Học đầy đủ, miễn phí',
       tagline_en = 'Full learning, free',
       updated_at = now()
 where plan = 'free'
   and tagline_vi = 'Học thử, không tốn phí'
   and tagline_en = 'Try it out, no cost';

-- VIP — bỏ tên kỹ thuật của nhà cung cấp giọng đọc ("Chirp3-HD").
update public.plan_marketing_bullets
   set text_vi = 'Trọn bộ giọng đọc bản xứ chất lượng cao, thêm một giọng đặc biệt và 2 giọng thu âm phòng thu (tiếng Anh)',
       text_en = 'All high-quality native voices, plus a special voice and 2 studio-quality voices (English)',
       updated_at = now()
 where plan = 'vip'
   and text_vi = 'Trọn bộ 14 giọng Chirp3-HD + giọng đặc biệt + 2 giọng Studio thu âm phòng thu (tiếng Anh)'
   and text_en = 'All 14 Chirp3-HD voices + a special voice + 2 studio-quality voices (English)';

-- VIP — "không giới hạn thực tế" mâu thuẫn với hạn mức 300 lượt/ngày thật.
update public.plan_marketing_bullets
   set text_vi = '300 lượt AI/ngày (gấp 10 lần gói Free), tính chung mọi tính năng AI',
       text_en = '300 AI turns/day (10x the Free plan), shared across all AI features',
       updated_at = now()
 where plan = 'vip'
   and text_vi = '300 lượt AI/ngày — thoải mái luyện không giới hạn thực tế'
   and text_en = '300 AI turns/day — practically unlimited';
