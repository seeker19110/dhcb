-- 0092_learner_intent_grade_thcs.sql — Cho phép lớp THCS 6–9 trong ý định học (màn "Bắt đầu").
-- Đặc tả: docs/specs/2026-10-10-menu-lop-thcs-va-bat-dau-6-9.md.
--
-- Môn Toán đã có đủ bài lớp 6–9 (changelog 0590–0594), nên câu "Bạn đang học lớp mấy?" ở
-- `/bat-dau` hiện thêm Lớp 6–9 khi người học chọn Toán. Ràng buộc CHECK của 0082 chỉ nhận
-- '10','11','12' → ghi '9' sẽ lỗi 500. Migration này NỚI ràng buộc (chỉ THÊM giá trị): mọi dòng
-- đang có vẫn hợp lệ, nên thêm ràng buộc mới không phải quét sửa dữ liệu.
--
-- Luật "lớp 6–9 chỉ đi cùng môn Toán" KHÔNG đặt ở DB (phải đọc mảng `subject_ids`, dễ lệch khi
-- thêm môn THCS sau này) — nó nằm ở hợp đồng Zod `LearnerIntentSchema`, server kiểm trước khi ghi.
--
-- Lũy đẳng THẬT: chỉ thay ràng buộc khi định nghĩa hiện tại CHƯA nhận '6' — chạy lại không
-- drop/add gì (OID ràng buộc giữ nguyên).
--
-- ROLLBACK (chạy tay; lùi mã TRƯỚC, rồi mới lùi ràng buộc — đưa lớp THCS về "chưa khai"):
--   update personal.learner_intent set grade = null where grade in ('6','7','8','9');
--   alter table personal.learner_intent drop constraint if exists learner_intent_grade_check;
--   alter table personal.learner_intent add constraint learner_intent_grade_check
--     check (grade is null or grade in ('10','11','12'));

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'learner_intent_grade_check'
      and conrelid = 'personal.learner_intent'::regclass
      and pg_get_constraintdef(oid) like '%''6''%'
  ) then
    alter table personal.learner_intent drop constraint if exists learner_intent_grade_check;
    alter table personal.learner_intent add constraint learner_intent_grade_check
      check (grade is null or grade in ('6','7','8','9','10','11','12'));
  end if;
end $$;
