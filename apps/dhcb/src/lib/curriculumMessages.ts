// apps/dhcb/src/lib/curriculumMessages.ts — câu báo lỗi khi tải từ điển (`loadCurriculum`) hỏng.
// Dùng chung cho mọi màn chờ từ điển (StudyPanel ở trang Từ điển, các tab học của trang cấp
// CEFR) để cùng một sự cố hiện cùng một câu (changelog 0525).
export const LOI_TU_VUNG_VI = 'Chưa tải được từ vựng. Kiểm tra kết nối rồi thử lại.'
export const LOI_TU_VUNG_EN = 'Could not load the vocabulary. Check your connection and try again.'
// Dữ liệu từ điển là dữ liệu CHUNG; tiến độ người học (từ đã học, lịch ôn) nằm riêng nên vẫn còn.
export const GOI_Y_TU_VUNG_VI = 'Từ bạn đã học và lịch ôn vẫn được giữ nguyên.'
export const GOI_Y_TU_VUNG_EN = 'Your learned words and review schedule are kept.'

// Hội thoại mẫu (`getDialogues`) tải hỏng (changelog 0530). Hội thoại là phần PHỤ của bài học nên
// câu trấn an nói rõ phần còn lại vẫn dùng được.
export const LOI_HOI_THOAI_VI = 'Chưa tải được hội thoại mẫu. Kiểm tra kết nối rồi thử lại.'
export const LOI_HOI_THOAI_EN =
  'Could not load the sample dialogues. Check your connection and try again.'
export const GOI_Y_HOI_THOAI_VI = 'Phần còn lại của bài học vẫn dùng được bình thường.'
export const GOI_Y_HOI_THOAI_EN = 'The rest of the lesson still works.'
