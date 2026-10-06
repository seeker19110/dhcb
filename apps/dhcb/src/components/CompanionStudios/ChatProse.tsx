// ChatProse — hiển thị câu trả lời của Companion có định dạng, KHÔNG thêm thư viện nào.
//
// VẤN ĐỀ NÓ GIẢI (đo thật 2026-09-15, trước khi sửa): `StudioDialogue` in câu trả lời bằng
// `whitespace-pre-wrap` thuần. Prompt hệ thống (`COMPANION_SYSTEM_PROMPT`) yêu cầu trả lời
// "có cấu trúc mạch lạc" và không hề cấm markdown, nên mô hình trả về đúng thứ mô hình vẫn
// trả về: `**đậm**`, danh sách, và code trong rào ```. Người dùng đọc ra nguyên dấu sao, và
// code thì mất hẳn hình khối.
//
// VÌ SAO KHÔNG CÀI PARSER MỚI (đặc tả nền §④ B gạch 5 — "không cài parser mới nếu chưa
// review bundle/dependency"): dự án đã có sẵn bộ đọc tối giản `lib/lessonMarkdown.ts`, viết
// ra chính vì lý do này (ngân sách bundle mỏng — PROGRESS.md nợ #6), và đã qua cổng test
// trên 68 bài học. Thêm `react-markdown` + bộ khử trùng HTML là hàng chục kB cho đúng năm
// cấu trúc mà file kia đã đọc được. Đợt này chỉ thêm rào ``` vào bộ đọc đó.
//
// AN TOÀN: KHÔNG có `dangerouslySetInnerHTML` ở đây, và bộ đọc không hề sinh liên kết. Mọi
// mảnh chữ đi qua JSX nên React tự thoát ký tự: `<script>` của mô hình hiện ra là chữ
// `<script>`, `[x](javascript:...)` hiện ra nguyên văn chứ không thành thẻ `a`. Xem
// `ChatProse.test.tsx` — cổng canh đúng hai điều đó.
import CodeSurface from '../programming/CodeSurface'
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

export default function ChatProse({ text }: { text: string }) {
  // `headings: true` chỉ bật ở đây: bài học KHÔNG bật (305 dòng comment Python bắt đầu bằng
  // `#` sẽ bị nuốt) — xem chú thích trong lib/lessonMarkdown.ts.
  const blocks = parseLessonMarkdown(text, { headings: true })
  return (
    // Cỡ chữ + giãn dòng giữ NGUYÊN của bong bóng cũ (`text-sm sm:text-[0.9375rem] leading-relaxed`)
    // để đợt này không lẫn thay đổi kiểu chữ vào thay đổi cấu trúc. Màu `text-zinc-200` cũng
    // là màu cũ — đây là NỘI DUNG ĐỂ ĐỌC nên phải giữ WCAG AAA (CLAUDE.md mục 4.5) và token
    // đó đã qua cổng `e2e/a11y-aaa.spec.ts`.
    <div className="space-y-2.5 text-sm sm:text-[0.9375rem] leading-relaxed text-zinc-200">
      {blocks.map((b, i) => {
        if (b.kind === 'code')
          return <CodeSurface key={i} code={b.code} className="text-[0.8125rem]" />
        if (b.kind === 'heading') {
          // Tiêu đề bên trong MỘT lượt trả lời, không phải tiêu đề của trang — nên hạ xuống
          // `h4`/`h5`: bong bóng chat nằm dưới `h1` của trang và `h3` của khu vực, đặt `h2`
          // ở đây sẽ phá thứ bậc tiêu đề mà luật axe `heading-order` canh.
          const Tag = b.level === 2 ? 'h4' : 'h5'
          return (
            <Tag key={i} className="font-bold text-zinc-100 pt-1">
              <Inline nodes={b.inline} />
            </Tag>
          )
        }
        if (b.kind === 'bullets')
          return (
            <ul key={i} className="list-disc pl-5 space-y-1 marker:text-accent-400">
              {b.items.map((it, j) => (
                <li key={j}>
                  <Inline nodes={it} />
                </li>
              ))}
            </ul>
          )
        if (b.kind === 'numbers')
          return (
            <ol key={i} className="list-decimal pl-5 space-y-1 marker:text-accent-400">
              {b.items.map((it, j) => (
                <li key={j}>
                  <Inline nodes={it} />
                </li>
              ))}
            </ol>
          )
        return (
          <p key={i}>
            <Inline nodes={b.inline} />
          </p>
        )
      })}
    </div>
  )
}
