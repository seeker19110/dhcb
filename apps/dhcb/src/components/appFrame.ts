// Lớp của cột nội dung chính, dùng chung cho App.tsx và bản dựng sẵn trang chủ khách
// (prerender/GuestHomePrerender.tsx) — hai nơi PHẢI cùng bố cục, nếu không lúc React tiếp quản
// trang, nội dung sẽ nhảy chỗ.
// `lg:pl-[var(--sidebar-w)]` chừa lề trái cho DesktopSidebar — biến CSS đổi theo trạng thái thu
// gọn/mở rộng nên không cần biết sidebar rộng bao nhiêu ở đây (xem index.css).
export const APP_CONTENT_COLUMN_CLASS = 'lg:pl-[var(--sidebar-w)] transition-[padding] duration-200'
