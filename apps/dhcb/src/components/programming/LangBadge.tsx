// LangBadge — huy hiệu NGÔN NGỮ của một bài học (PR-UX1, đặc tả UI/UX §4.3).
// Vì sao cần: schema bài có trường `language` (7 giá trị) nhưng giao diện chưa bao giờ hiện
// ra, nên học viên bấm vào bài mà không biết sắp viết Python hay SQL — trong khi đó là thông
// tin định khung kỳ vọng mạnh nhất trước khi vào bài.
//
// Luật "không giả vờ" của môn: bài chạy trên BỘ MÔ PHỎNG (git, fetch) phải tự nói ra điều đó
// ngay trên huy hiệu, không để học viên tưởng mình đang gọi mạng thật.
import type { ProgrammingLesson } from '@dhcb/subject-programming/lessonTypes'

type Lang = ProgrammingLesson['language']

/** Nhãn hiển thị + màu chấm cho từng ngôn ngữ. Chấm màu chỉ PHỤ TRỢ — tên ngôn ngữ luôn hiện
 *  bằng chữ, nên người không phân biệt được màu vẫn đọc đủ thông tin (a11y). */
const LANGS: Record<Lang, { label: string; dot: string; simulated?: true }> = {
  python: { label: 'Python', dot: 'bg-sky-400' },
  // Ba làn Python mở rộng của P4 (pyLanes.ts): cùng engine Python, khác ở module ghi sẵn.
  // Cả ba đều là MÔ PHỎNG — `import requests` chạy được nhờ một file cùng tên nằm cạnh, chứ
  // không có gói tin nào rời máy. Huy hiệu phải nói ra, đúng luật "không giả vờ".
  pytest: { label: 'Python · pytest', dot: 'bg-sky-400', simulated: true },
  httpsim: { label: 'Python · gọi API', dot: 'bg-sky-400', simulated: true },
  apisim: { label: 'Python · dựng API', dot: 'bg-sky-400', simulated: true },
  typescript: { label: 'TypeScript', dot: 'bg-blue-400' },
  javascript: { label: 'JavaScript', dot: 'bg-amber-400' },
  sql: { label: 'SQL', dot: 'bg-violet-400' },
  html: { label: 'HTML/CSS', dot: 'bg-orange-400' },
  dom: { label: 'JS trên trang', dot: 'bg-amber-400' },
  fetch: { label: 'JS gọi API', dot: 'bg-amber-400', simulated: true },
  git: { label: 'Git', dot: 'bg-rose-400', simulated: true },
  // Dòng lệnh (chương trình M, tầng 1): hệ thống file trong bộ nhớ, dựng lại mỗi lượt chạy —
  // không phải bash thật, nên huy hiệu phải tự khai đúng như bài Git.
  bash: { label: 'Dòng lệnh (bash)', dot: 'bg-emerald-400', simulated: true },
  // Hermes Agent (khoá ngắn Hermes): lệnh là lệnh thật của Hermes, nhưng phản hồi "AI" là
  // văn bản đóng hộp tất định của hermesSim — không phải AI thật, huy hiệu phải tự khai.
  hermes: { label: 'Hermes Agent', dot: 'bg-cyan-400', simulated: true },
  // Tác tử AI viết code (khoá ngắn Vibe Code): quy trình là quy trình thật, nhưng "code AI
  // sinh ra" là tóm tắt diff đóng hộp tất định của vibeSim — huy hiệu phải tự khai.
  vibe: { label: 'Tác tử AI code', dot: 'bg-fuchsia-400', simulated: true },
  // OpenClaw (khoá ngắn OpenClaw): lệnh là lệnh thật của OpenClaw, nhưng phản hồi "AI" là
  // văn bản đóng hộp tất định của openclawSim — không phải AI thật, huy hiệu phải tự khai.
  openclaw: { label: 'OpenClaw', dot: 'bg-teal-400', simulated: true },
  // Swift (chương trình M, tầng 2): cú pháp Swift THẬT, chạy trên trình thông dịch tập con của
  // DHCB. Là tập con nên phải khai "mô phỏng" — học viên cần biết swiftc thật khắt khe hơn.
  swift: { label: 'Swift', dot: 'bg-orange-500', simulated: true },
  // Kotlin (chương trình M, tầng 2): cú pháp Kotlin THẬT, chạy trên trình thông dịch tập con
  // của DHCB. Cũng là tập con nên phải khai "mô phỏng" như Swift.
  kotlin: { label: 'Kotlin', dot: 'bg-purple-400', simulated: true },
}

interface Props {
  language: Lang
  className?: string
}

export default function LangBadge({ language, className = '' }: Props) {
  const lang = LANGS[language]
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-950 border border-zinc-700 text-[0.6875rem] font-semibold text-zinc-300 ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${lang.dot}`} aria-hidden="true" />
      <span>{lang.label}</span>
      {lang.simulated && <span className="font-normal text-zinc-400">· mô phỏng</span>}
    </span>
  )
}
