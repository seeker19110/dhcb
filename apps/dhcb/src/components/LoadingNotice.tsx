// apps/dhcb/src/components/LoadingNotice.tsx — ô "Đang tải…" gọn cho vùng nội dung đang chờ.
//
// Dùng làm `fallback` của Suspense khi JS một màn/tab nạp lười đang về (changelog 0603/0604), cùng
// khuôn với ô "Đang tải từ vựng…" của các tab học để người học thấy MỘT trạng thái chờ liền mạch.
// `aria-busy` để trình đọc màn hình biết vùng này đang tải.
export default function LoadingNotice({ isA, label }: { isA: boolean; label?: string }) {
  return (
    <div className="glass rounded-xl p-8 text-center animate-fade-in" aria-busy="true">
      <p className="text-zinc-400 text-sm">{label ?? (isA ? 'Đang tải…' : 'Loading…')}</p>
    </div>
  )
}
