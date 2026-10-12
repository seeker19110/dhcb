-- 0095_cefr_exams_legacy_grandfather.sql
-- GĐ2b — chấm thi cuối cấp CEFR ở SERVER: giữ quyền cho người đã thi đạt theo cách CŨ.
-- Đặc tả: docs/specs/2026-10-12-gd2b-cham-thi-cefr-server.md §③
--
-- Từ PR #1320 (2026-10-10) kết quả thi cuối cấp chỉ còn được đọc từ sổ do server chấm
-- (`platform.feature_state`, feature `cefr_assessment_v1`, hàm `readVerifiedCefrExams`); cột
-- `english.learning_progress.cefr_exams` (bản client tự chấm rồi đẩy lên qua `/api/progress`)
-- KHÔNG còn được tính vào luật mở cấp, và còn bị ghi đè bằng sổ server ở lần đồng bộ kế tiếp.
-- Hệ quả: ai thi đạt cấp L(n) trong khoảng 2026-09-12 (migration 0077 đóng băng grandfather)
-- → 2026-10-10 bị KHOÁ LẠI cấp L(n+1) đang học — hồi tố, phá bất biến "không ai mất quyền đã có"
-- (đặc tả GĐ2a §⑤).
--
-- Nên: suy cấp L(n+1) từ mọi mục `passed = true` còn lại trong cột cũ và CỘNG vào
-- `cefr_unlocked_grandfathered` (cột chỉ-đọc của 0077). Chỉ dựa vào cột `cefr_exams`, KHÔNG dựa
-- vào bản chụp `cefr_unlocked`: bản chụp của người VIP có đủ 6 cấp, đóng băng nó là phát quyền
-- vĩnh viễn cho người VIP sắp hết hạn (phá tiêu chí 6 của GĐ2a).
--
-- Dòng đã đồng bộ SAU 2026-10-10 thì cột cũ đã bị ghi đè — không còn gì để cứu từ đây (muốn
-- cứu phải tra bản backup trước ngày đó). Ghi rõ ở changelog 0616.
--
-- Lũy đẳng: chỉ ghi khi mảng sau khi gộp KHÁC mảng đang có; chạy lại không đổi gì.

with next_level(prev, nxt) as (
  values ('A1', 'A2'), ('A2', 'B1'), ('B1', 'B2'), ('B2', 'C1'), ('C1', 'C2')
),
implied as (
  -- Cấp được mở nhờ một bài thi ĐẠT theo cách cũ còn nằm trong cột `cefr_exams`.
  select lp.user_id, nl.nxt as lvl
    from english.learning_progress lp
    cross join lateral jsonb_each(
      case when jsonb_typeof(lp.cefr_exams) = 'object' then lp.cefr_exams else '{}'::jsonb end
    ) as e(level_id, result)
    join next_level nl on nl.prev = e.level_id
   where jsonb_typeof(e.result) = 'object'
     and e.result -> 'passed' = 'true'::jsonb
),
current_grandfather as (
  select lp.user_id, g.lvl
    from english.learning_progress lp
    cross join lateral jsonb_array_elements_text(
      case when jsonb_typeof(lp.cefr_unlocked_grandfathered) = 'array'
           then lp.cefr_unlocked_grandfathered else '[]'::jsonb end
    ) as g(lvl)
),
merged as (
  -- Mã cấp A1 < A2 < B1 < B2 < C1 < C2 theo bảng chữ cái nên `order by lvl` = đúng thứ tự CEFR.
  select user_id, jsonb_agg(lvl order by lvl) as levels
    from (
      select user_id, lvl from implied
      union
      select user_id, lvl from current_grandfather
    ) as u
   group by user_id
)
update english.learning_progress lp
   set cefr_unlocked_grandfathered = m.levels
  from merged m
 where m.user_id = lp.user_id
   and lp.cefr_unlocked_grandfathered is distinct from m.levels;

-- ============================================================================
-- ROLLBACK (chạy tay nếu cần lùi):
--
-- Migration chỉ THÊM phần tử vào mảng grandfather (không đổi schema, không xoá gì). Lùi mã không
-- cần lùi dữ liệu. Muốn gỡ đúng phần vừa thêm thì không có cách tự động (không lưu "trước/sau");
-- khôi phục cột từ backup trước ngày chạy nếu thật sự cần.
