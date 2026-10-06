// LessonProse — hiển thị phần lý thuyết (bước ② của khuôn 8 bước) có định dạng.
//
// Trước PR này phần lý thuyết in thẳng bằng `whitespace-pre-line`, nên `**đậm**` hiện ra
// nguyên dấu sao và danh sách chỉ là mấy dòng chữ chạy dài — đúng chỗ khó đọc nhất trên
// điện thoại, mà lý thuyết lại dài 2.000–3.000 ký tự mỗi bài.
//
// Màu chữ giữ nguyên `text-zinc-200` như bản cũ: đây là NỘI DUNG ĐỂ ĐỌC nên phải đạt WCAG
// AAA (tương phản ≥ 7:1, CLAUDE.md mục 4.5) và token đó đã qua cổng `e2e/a11y-aaa.spec.ts`.
// Chữ đậm dùng `text-zinc-100` (sáng hơn, tương phản cao hơn) nên vẫn an toàn.
//
// Khối code dùng lại CodeSurface để giống hệt mọi khối code khác trong môn (luật N2 của
// đặc tả UI/UX: code là nhân vật chính, ở đâu cũng một hình dạng).
import CodeSurface from './CodeSurface'
import { parseLessonMarkdown, type InlineNode } from '../../lib/lessonMarkdown'

function Inline({ nodes }: { nodes: InlineNode[] }) {
  return (
    <>
      {nodes.map((n, i) => {
        if (n.kind === 'bold')
          return (
            <strong key={i} className="font-semibold text-zinc-100">
              {n.text}
            </strong>
          )
        if (n.kind === 'italic')
          return (
            <em key={i} className="italic">
              {n.text}
            </em>
          )
        if (n.kind === 'code')
          return (
            <code
              key={i}
              className="font-mono text-[0.9em] px-1.5 py-0.5 rounded-md bg-zinc-800 text-zinc-100"
            >
              {n.text}
            </code>
          )
        return <span key={i}>{n.text}</span>
      })}
    </>
  )
}

export default function LessonProse({ text }: { text: string }) {
  const blocks = parseLessonMarkdown(text)
  return (
    // `read-body` = cỡ chữ + giãn dòng của thân bài (15px / 1.65), KHÔNG phải `text-sm` cỡ
    // giao diện. Khoảng đọc `read-measure` áp lên TỪNG khối chữ chứ không lên thẻ bọc: khối
    // code phải được rộng hết cột (dòng code dài mà bị bó 66ch thì phải cuộn ngang liên tục).
    <div className="space-y-3 read-body text-zinc-200">
      {blocks.map((b, i) => {
        if (b.kind === 'code')
          return <CodeSurface key={i} code={b.code} className="text-[0.8125rem]" />
        if (b.kind === 'bullets')
          return (
            <ul key={i} className="read-measure list-disc pl-5 space-y-1.5 marker:text-accent-400">
              {b.items.map((it, j) => (
                <li key={j}>
                  <Inline nodes={it} />
                </li>
              ))}
            </ul>
          )
        if (b.kind === 'numbers')
          return (
            <ol
              key={i}
              className="read-measure list-decimal pl-5 space-y-1.5 marker:text-accent-400"
            >
              {b.items.map((it, j) => (
                <li key={j}>
                  <Inline nodes={it} />
                </li>
              ))}
            </ol>
          )
        return (
          <p key={i} className="read-measure">
            <Inline nodes={b.inline} />
          </p>
        )
      })}
    </div>
  )
}
