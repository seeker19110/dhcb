// apps/dhcb/src/lib/curriculumMessages.ts — câu báo lỗi khi tải từ điển (`loadCurriculum`) hỏng.
// Dùng chung cho mọi màn chờ từ điển (StudyPanel ở trang Từ điển, các tab học của trang cấp
// CEFR) để cùng một sự cố hiện cùng một câu (changelog 0525).
export const LOI_TU_VUNG_VI = 'Chưa tải được từ vựng. Kiểm tra kết nối rồi thử lại.'
export const LOI_TU_VUNG_EN = 'Could not load the vocabulary. Check your connection and try again.'
// Dữ liệu từ điển là dữ liệu CHUNG; tiến độ người học (từ đã học, lịch ôn) nằm riêng nên vẫn còn.
export const GOI_Y_TU_VUNG_VI = 'Từ bạn đã học và lịch ôn vẫn được giữ nguyên.'
export const GOI_Y_TU_VUNG_EN = 'Your learned words and review schedule are kept.'
