// apps/dhcb/src/components/QuizOptionKey.tsx — Ô số phím tắt hiện trước mỗi đáp án.
//
// Phím tắt chỉ hữu ích khi người học BIẾT nó tồn tại. Một phím tắt không được hiển thị thì
// chỉ phục vụ người đã đọc tài liệu — tức gần như không ai. Ô số này chính là phần "dạy" của
// tính năng: nhìn thấy số 1 2 3 4 nằm cạnh đáp án là hiểu ngay có thể bấm phím.
//
// CHỈ HIỆN TỪ 1024px (`hidden lg:flex`): dưới ngưỡng đó gần như không có bàn phím rời, hiện ra
// chỉ tổ chiếm chỗ trên màn hình vốn đã hẹp và gợi ý sai một thao tác không làm được.
//
// `aria-hidden`: trình đọc màn hình phải đọc "đáp án A: ..." chứ không phải "1 đáp án A" —
// con số là chỉ dẫn thị giác cho người dùng chuột/bàn phím, không phải nội dung câu hỏi.
export default function QuizOptionKey({ index }: { index: number }) {
  return (
    <span
      aria-hidden="true"
      className="hidden lg:flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-line-subtle bg-surface-raised text-[0.6875rem] font-semibold text-content-muted"
    >
      {index + 1}
    </span>
  )
}
