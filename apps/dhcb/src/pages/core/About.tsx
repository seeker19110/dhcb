// Định vị do chủ dự án chốt 2026-10-06: hỗ trợ khả năng học hỏi, không quảng bá các trụ đã gỡ.
import { Link } from 'react-router-dom'
import Layout from '../../components/Layout'
import { PageShell } from '@core/PageShell'
import { buttonClass } from '@core/buttonStyles'
import { useLang } from '../../context/useLang'
import { usePageTitle } from '../../lib/usePageTitle'
import { useAppSettings } from '../../lib/useAppSettings'

const LEARNING_STEPS = [
  {
    vi: 'Biết bắt đầu từ đâu',
    en: 'Find a starting point',
    detailVi:
      'Chọn môn học, mục đích và khoảng thời gian đang có. Nền tảng gợi ý một việc để bắt đầu; bạn có thể bỏ qua câu hỏi và tự khám phá nội dung mình quan tâm.',
    detailEn:
      'Choose a subject, purpose and time budget. Get one suggested activity, or skip the questions and explore for yourself.',
  },
  {
    vi: 'Hiểu cách làm, không chỉ xem đáp án',
    en: 'Understand the method, not just the answer',
    detailVi:
      'Tùy hoạt động, AI có thể giải thích, nhận xét bài viết hoặc gợi ý cách tìm lỗi. Mục tiêu là giúp bạn suy nghĩ tiếp và từng bước tự làm được, không làm thay bạn.',
    detailEn:
      'Depending on the activity, AI can explain, give writing feedback or help you investigate an error. The goal is to help you think and practise, not do the learning for you.',
  },
  {
    vi: 'Biến kiến thức thành việc làm được',
    en: 'Put knowledge into practice',
    detailVi:
      'Đưa từ vừa học vào hội thoại, thử một cách giải hoặc áp dụng kiến thức lập trình vào dự án. Hoạt động thực hành giúp bạn tự kiểm tra mình đã hiểu và dùng được đến đâu.',
    detailEn:
      'Use new words in a conversation, try a solution, or apply programming knowledge to a project. Practice lets you check what you understand and can use.',
  },
  {
    vi: 'Ôn lại điều cần củng cố',
    en: 'Review what needs strengthening',
    detailVi:
      'Thẻ ôn tập và lịch ôn giúp bạn quay lại nội dung đã học. Làm sai hoặc chưa nhớ ngay là lý do để thử lại và điều chỉnh, không phải để đánh giá con người bạn.',
    detailEn:
      'Review cards and schedules help you revisit what you learned. A mistake or a forgotten item is a reason to try again, not a judgement about you.',
  },
  {
    vi: 'Tiếp tục theo nhịp của mình',
    en: 'Continue at your own pace',
    detailVi:
      'Theo dõi tiến độ và trở lại việc đang học. Bạn có thể bắt đầu bằng một việc nhỏ, nghỉ khi cần và tiếp tục sau đó; không cần biết cả lộ trình ngay từ đầu.',
    detailEn:
      'Track progress and return to your learning. Start small, take a break when needed and continue later. You do not need to plan the whole journey on day one.',
  },
] as const

export default function About() {
  const vi = useLang().lang === 'vi'
  const settings = useAppSettings()
  usePageTitle(vi ? 'Giới thiệu' : 'About')
  const section = 'rounded-2xl border border-line-subtle bg-surface-card p-5 space-y-3'
  const title = 'text-lg font-bold text-content'
  const prose = 'text-sm leading-relaxed text-content-muted'

  return (
    <div className="min-h-dvh bg-zinc-950">
      <Layout title={vi ? 'Giới thiệu nền tảng' : 'About the platform'} />
      <PageShell width="reading" baseWidth="max-w-3xl" className="space-y-5">
        <h1 tabIndex={-1} className="sr-only focus:outline-none">
          {vi
            ? 'Đồng Hành Cùng Bạn — hỗ trợ khả năng học hỏi'
            : 'Đồng Hành Cùng Bạn — supporting your ability to learn'}
        </h1>
        <section className={section}>
          <h2 className="text-2xl font-bold text-content">
            {vi
              ? 'Học điều bạn muốn. Hiểu điều bạn học.'
              : 'Learn what matters to you. Understand what you learn.'}
          </h2>
          <p className={prose}>
            {vi
              ? 'Đồng Hành Cùng Bạn hỗ trợ mọi người học hỏi, hiểu sâu hơn và từng bước nâng cao khả năng tự học. Bài học, luyện tập, ghi chú và AI cùng phục vụ việc giúp bạn chủ động hơn trong quá trình học của chính mình.'
              : 'Đồng Hành Cùng Bạn supports people in exploring knowledge, understanding more deeply and developing independent learning. Lessons, practice, notes and AI help you take an active role in your own learning.'}
          </p>
          <p className={prose}>
            {vi
              ? 'Bạn có thể đang đi học, đi làm, bắt đầu một kỹ năng mới hoặc trở lại kiến thức đã quên. Không cần giỏi sẵn hay có cùng tốc độ với người khác. Hãy bắt đầu từ một câu hỏi, một bài học hoặc một việc nhỏ.'
              : 'You may be studying, working, starting a new skill or revisiting forgotten knowledge. You do not need prior expertise or someone else’s pace. Start with a question, a lesson or a small task.'}
          </p>
          <Link
            to="/bat-dau"
            className={buttonClass({ variant: 'primary', size: 'lg', fullWidth: true })}
          >
            {vi ? 'Bắt đầu học miễn phí' : 'Start learning for free'}
          </Link>
          <p className={prose}>
            {vi
              ? 'Thử ngay, không cần đăng nhập. Các tính năng AI dùng thử có hạn mức.'
              : 'Try without signing in. Free AI trials have usage limits.'}
          </p>
        </section>

        <section aria-labelledby="learning-how-heading" className="space-y-3">
          <h2 id="learning-how-heading" className={title}>
            {vi ? 'Không chỉ học thêm — học tốt hơn' : 'Not just more learning — better learning'}
          </h2>
          {LEARNING_STEPS.map((step) => (
            <article key={step.vi} className={section}>
              <h3 className="text-base font-semibold text-content">{vi ? step.vi : step.en}</h3>
              <p className={prose}>{vi ? step.detailVi : step.detailEn}</p>
            </article>
          ))}
        </section>

        <section className={section}>
          <h2 className={title}>{vi ? 'Học theo điều bạn quan tâm' : 'Explore your interests'}</h2>
          <h3 className="text-base font-semibold text-content">
            {vi ? 'Tiếng Anh: hiểu và sử dụng' : 'English: understand and use it'}
          </h3>
          <p className={prose}>
            {vi
              ? 'Lộ trình A1–C2 kết hợp từ vựng, ngữ pháp, nghe, đọc, viết và hội thoại. Tra từ và ví dụ, ôn bằng thẻ từ, nghe truyện song ngữ và luyện tập theo tình huống. Phản hồi bằng tiếng Việt hỗ trợ bạn hiểu cách sửa lỗi. Điểm viết kiểu IELTS là ước lượng để tham khảo, không phải kết quả thi hay chứng nhận chính thức.'
              : 'The A1–C2 pathway connects vocabulary, grammar, listening, reading, writing and conversation. Explore examples, review cards, bilingual stories and situational practice. Vietnamese feedback helps explain corrections. IELTS-style writing scores are practice estimates, not official results or certificates.'}
          </p>
          <h3 className="text-base font-semibold text-content">
            {vi
              ? 'Lập trình: từ hiểu vấn đề đến tự xây dựng'
              : 'Programming: from understanding to building'}
          </h3>
          <p className={prose}>
            {vi
              ? 'Tiếp cận Python, JavaScript/TypeScript và SQL qua bài học và các chặng dự án. Luyện đọc hiểu mã, thử giải pháp, kiểm tra kết quả và tìm lỗi. Lộ trình hướng tới thực hành, không bảo đảm thay thế kinh nghiệm làm việc nhóm hay vận hành hệ thống thực tế.'
              : 'Explore Python, JavaScript/TypeScript and SQL through lessons and project stages. Practise reading code, trying solutions, checking results and debugging. The course supports practice; it does not replace real team or production experience.'}
          </p>
          <h3 className="text-base font-semibold text-content">
            {vi
              ? 'Toán, Vật lý, Hóa học, Sinh học — xem trước'
              : 'Mathematics, Physics, Chemistry, Biology — preview'}
          </h3>
          <p className={prose}>
            {vi
              ? 'Các môn STEM đang hoàn thiện và có nội dung để xem trước. Nhãn trạng thái giúp bạn biết phần nào đã mở; không phải tất cả các môn đều có cùng mức độ hoàn thiện.'
              : 'STEM subjects are being developed and include preview content. Status labels show what is available; not every subject has the same level of completeness.'}
          </p>
          <Link
            to="/goc-hoc-tap"
            className="tap-44 inline-flex items-center text-sm font-semibold text-content underline underline-offset-2"
          >
            {vi ? 'Khám phá các môn học' : 'Explore subjects'}
          </Link>
        </section>

        <section className={section}>
          <h2 className={title}>
            {vi
              ? 'Ghi lại điều đang học. Có AI hỗ trợ khi cần.'
              : 'Keep your learning notes. Get AI support when needed.'}
          </h2>
          <p className={prose}>
            {vi
              ? 'Ghi chú giúp giữ lại câu hỏi, ý tưởng, tài liệu và việc cần làm. Bạn Đồng Hành có thể dùng ngữ cảnh liên quan trong ứng dụng để hỗ trợ trao đổi và gợi ý bước tiếp theo. Bạn vẫn là người chọn mục tiêu và quyết định; phản hồi AI có thể sai và cần được kiểm tra.'
              : 'Notes keep questions, ideas, documents and tasks together. Your Companion can use relevant in-app context to support a discussion and suggest next steps. You choose the goal and decide; AI feedback can be wrong and should be checked.'}
          </p>
          <p className={prose}>
            {vi
              ? 'Ghi chú và Bạn Đồng Hành cần tài khoản để gắn dữ liệu với bạn. Chế độ khách vẫn cho phép bắt đầu với nội dung học và các hoạt động dùng thử được mở.'
              : 'Notes and Companion require an account to associate data with you. Guest mode still lets you begin with available learning content and trial activities.'}
          </p>
        </section>

        <section className={section}>
          <h2 className={title}>
            {vi
              ? 'Bắt đầu miễn phí. Nâng cấp để học tự do.'
              : 'Start free. Upgrade for more freedom.'}
          </h2>
          <h3 className="text-base font-semibold text-content">
            {vi ? 'Miễn phí — trải nghiệm trước' : 'Free — try it first'}
          </h3>
          <p className={prose}>
            {vi
              ? 'Không cần đăng nhập để khám phá nội dung và thử hoạt động được mở cho khách. Các tính năng AI miễn phí có hạn mức; số lượt dùng thử khác với tài khoản Free. Tiến độ khách được lưu trên trình duyệt này. Đăng ký khi cần lưu vào tài khoản và tiếp tục trên thiết bị khác.'
              : 'Explore content and guest activities without signing in. Free AI has usage limits; the guest trial differs from a Free account. Guest progress is stored in this browser. Register to save it to an account and continue on another device.'}
          </p>
          <h3 className="text-base font-semibold text-content">
            {vi
              ? 'VIP — tự chọn bài, chủ động cách học'
              : 'VIP — choose lessons and your own order'}
          </h3>
          <p className={prose}>
            {vi
              ? 'Trong những nội dung đã mở, bạn có thể học phần đang cần trước, quay lại nền tảng hoặc tập trung vào chủ đề quan tâm. VIP mở các cấp tiếng Anh và bậc lập trình mà không bắt học lại chỉ để mở khóa. Quyền mở bài không phải chứng nhận đã thành thạo; bài kiểm tra vẫn giúp bạn tự đánh giá.'
              : 'Within available content, study what you need first, revisit fundamentals or focus on a topic. VIP opens English and programming levels without repeating earlier levels just to unlock them. Access does not certify mastery; practice and assessments remain useful.'}
          </p>
          <p className={prose}>
            {settings.vipUnlimited === true
              ? vi
                ? 'Không giới hạn lượt AI trong thời gian gói còn hiệu lực. Các kiểm soát chống lạm dụng, an toàn và gián đoạn kỹ thuật vẫn áp dụng; đây không phải cam kết hoạt động mãi mãi sau một lần mua.'
                : 'Unlimited AI turns while your plan is active. Anti-abuse and safety controls and technical interruptions still apply; this is not lifetime access from any one purchase.'
              : vi
                ? 'Xem quyền lợi AI và thời hạn hiện hành ở trang nâng cấp trước khi thanh toán.'
                : 'Check the current AI benefits and subscription term on the upgrade page before paying.'}
          </p>
          <Link
            to="/nang-cap"
            className="tap-44 inline-flex items-center text-sm font-semibold text-content underline underline-offset-2"
          >
            {vi ? 'Xem gói VIP và nâng cấp' : 'View VIP and upgrade'}
          </Link>
        </section>
        <p className={prose}>
          {vi
            ? 'Một câu hỏi được hiểu rõ hơn. Một lỗi được tự sửa. Một kiến thức được dùng vào việc thật. Đó là những bước tiến Đồng Hành Cùng Bạn hướng tới.'
            : 'A question understood more clearly. A mistake you can fix yourself. Knowledge applied to a real task. These are the steps forward Đồng Hành Cùng Bạn aims to support.'}
        </p>
      </PageShell>
    </div>
  )
}
