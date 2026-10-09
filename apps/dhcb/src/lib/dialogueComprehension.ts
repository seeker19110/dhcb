// dialogueComprehension — lối vào phía APP của kiểm tra hiểu hội thoại CEFR.
//
// Mã thật nằm ở gói dùng chung `@dhcb/subject-english/dialogueComprehension` (đợt 0555): server
// dựng LẠI đúng đề này từ cùng seed để chấm, nên client và server phải dùng MỘT hàm. File này chỉ
// re-export để các import trong app (`../lib/dialogueComprehension`) giữ nguyên.
// Đặc tả: docs/specs/2026-10-09-hoi-thoai-cefr-server-cham-lai.md
export * from '@dhcb/subject-english/dialogueComprehension'
