// ProgrammingAbout — MÔ TẢ KHOÁ HỌC & MỤC TIÊU của môn Lập trình (PR-UX3).
// Nội dung theo đặc tả docs/research/dac-ta-uiux-mon-lap-trinh-2026-08-26.md §6.
//
// Ba điều quyết định hình dạng trang này:
//  1. Đây là trang CÔNG KHAI (route đặt ngoài RequireAuth) — người chưa đăng nhập phải đọc
//     được, vì bắt đăng nhập mới cho xem là tự chặn đúng người mình cần thuyết phục. Hệ quả:
//     KHÔNG gọi API cần token ở đây, và nút hành động cuối trang phải đi qua đăng nhập.
//  2. Mọi con số sinh từ dữ liệu (luật N1, tiêu chí A11) — số bài, số bậc, số chặng dự án đều
//     đếm tại chỗ. Viết tay là vi phạm: hôm nay đúng, tháng sau soạn thêm bài là thành nói dối.
//  3. Khối "trạng thái thật" (chưa ai đi hết môn) BẮT BUỘC hiển thị, và chỉ nói ở ĐÂY — không
//     rải lên trang môn hay trang bậc, vì nhắc nhiều lần thành tự bôi xấu.
import { useNavigate } from 'react-router-dom'
import { usePageTitle } from '../../../lib/usePageTitle'
import { PageShell } from '@core/PageShell'
import {
  Rocket,
  Trophy,
  Brain,
  ShieldAlert,
  Clock,
  UserCheck,
  ChevronRight,
  Code2,
} from 'lucide-react'
import Layout from '../../../components/Layout'
import { useAuth } from '../../../context/useAuth'
import { PROGRAMMING_LEVELS } from '@dhcb/subject-programming/curriculum'
import { LESSON_INDEX, getLessonSummary } from '@dhcb/subject-programming/lessonsLoader'
import { PROGRAMMING_PREFIX, duongDanBaiHoc } from '../../../lib/programmingRoutes'
import { PROJECT_STAGES } from '@dhcb/subject-programming/projectSteps'

/** Sản phẩm của học viên lớn lên thế nào qua từng chặng (khối 2 của đặc tả §6). */
const SAN_PHAM_TUNG_CHANG: { level: string; mo_ta: string }[] = [
  { level: 'P1', mo_ta: 'Máy tính tiền chạy chữ trong cửa sổ đen' },
  { level: 'P2', mo_ta: 'Phần mềm quản lý bán hàng, dữ liệu còn nguyên sau khi tắt máy' },
  { level: 'P3', mo_ta: 'Trang web của cửa hàng + kho dữ liệu SQL + repo GitHub công khai' },
  { level: 'P4', mo_ta: 'Backend API có test tự động, code chia lớp gọn gàng' },
  {
    level: 'P5',
    mo_ta: 'Chạy thật trên Internet: đăng nhập an toàn, CSDL có ràng buộc, báo cáo đã tối ưu',
  },
]

const NANG_LUC: { nhom: string; noi_dung: string }[] = [
  {
    nhom: 'Ngôn ngữ',
    noi_dung: 'Python thành thạo · JavaScript và TypeScript cơ bản · SQL · Git và dòng lệnh.',
  },
  {
    nhom: 'Làm backend',
    noi_dung:
      'Thiết kế cơ sở dữ liệu có khoá ngoại, ràng buộc, index; giao dịch; API đầy đủ bốn thao tác; trả đúng mã lỗi (422 / 404 / 409); và luật quan trọng nhất: không tin dữ liệu từ phía người dùng.',
  },
  {
    nhom: 'Chất lượng',
    noi_dung:
      'Viết test tự động; nghĩ ca biên trước khi viết code; sửa cấu trúc mà không đổi hành vi; lỗi có mã và có nhật ký.',
  },
  {
    nhom: 'Nền khoa học máy tính',
    noi_dung: 'Big-O; tìm kiếm và sắp xếp; stack, queue, hash, đệ quy; cây và đồ thị (BFS/DFS).',
  },
  {
    nhom: 'An toàn nhập môn',
    noi_dung: 'SQL injection, băm mật khẩu có muối, XSS ở mức nhận biết.',
  },
  {
    nhom: 'Vận hành',
    noi_dung: 'Cấu hình bằng biến môi trường, bí mật không nằm trong code, deploy miễn phí.',
  },
]

const THOI_QUEN: { tieu_de: string; giai_thich: string }[] = [
  {
    tieu_de: 'Phân biệt "đúng" với "đúng và rẻ"',
    giai_thich: 'Cùng một kết quả, có cách tốn một triệu thao tác và có cách tốn mười nghìn.',
  },
  {
    tieu_de: 'Đo trước khi sửa, đo lại sau khi sửa',
    giai_thich: 'Bước đo lại là bước hay bị bỏ nhất.',
  },
  {
    tieu_de: 'Sợ đúng thứ đáng sợ: lỗi im lặng',
    giai_thich:
      'Tìm nhị phân trên danh sách chưa sắp xếp trả sai rất tự tin. Chương trình vẫn chạy êm — chỉ dữ liệu là sai.',
  },
  {
    tieu_de: 'Đặt ràng buộc ở chỗ mọi đường vào đều phải đi qua',
    giai_thich: 'Cái if trong một hàm không cứu bạn vào ngày bạn viết thêm một script nhập liệu.',
  },
  {
    tieu_de: 'Biết mình đang chạy thật hay đang mô phỏng',
    giai_thich:
      'Ở đây chỗ nào giả lập thì ghi rõ, chỗ nào không kiểm chứng được thì không chấm hộ bạn.',
  },
  {
    tieu_de: 'Hỏi cho rõ đề trước khi gõ dòng đầu tiên',
    giai_thich: 'Bài phỏng vấn cuối môn dựng nguyên một cái bẫy quanh việc quên hỏi lại đề.',
  },
]

const KHONG_CO: string[] = [
  'Chưa viết được Go, Rust hay C. Bậc cuối dạy cơ chế (đồng thời, quyền sở hữu bộ nhớ) bằng mô hình chạy được; cú pháp thật bạn phải tự học tiếp.',
  'Chưa có kinh nghiệm làm việc nhóm. Không code review, không xung đột merge thật, không phải đọc code người khác, không có code cũ để bảo trì. Đây là khoảng trống lớn nhất và bài tập không dạy được.',
  'Chưa gặp quy mô thật. Không tải cao, không dữ liệu bẩn ngoài đời, không trực sự cố. Mười nghìn đơn sinh bằng công thức khác hẳn mười nghìn đơn của người thật.',
  'Frontend còn mỏng — JavaScript thuần và DOM, chưa có React hay framework nào.',
  'Docker, CI/CD, giám sát mới ở mức việc về nhà, không chấm.',
]

export default function ProgrammingAbout() {
  usePageTitle('Giới thiệu môn Lập trình | Đồng hành cùng bạn')
  const nav = useNavigate()
  const { user } = useAuth()

  // Đếm TẠI CHỖ từ dữ liệu giáo trình — xem ghi chú (2) ở đầu file.
  const soBai = LESSON_INDEX.length
  const soBac = PROGRAMMING_LEVELS.length
  const soChang = PROJECT_STAGES.length
  const tongTuan = PROGRAMMING_LEVELS.reduce((tong, bac) => {
    // duration dạng "8–10 tuần" → lấy số LỚN để ước tính không lạc quan quá.
    const so = bac.duration.match(/\d+/g)
    return tong + (so ? Number(so[so.length - 1]) : 0)
  }, 0)

  const the = 'bg-zinc-900/80 border border-zinc-800 rounded-3xl p-5'
  const tieuDe = 'text-base font-bold text-white flex items-center gap-2'

  return (
    <div className="min-h-dvh bg-zinc-950 text-zinc-100">
      <Layout
        title="Lập trình — từ số 0 tới một sản phẩm chạy thật trên Internet"
        onBack={() => nav(user ? PROGRAMMING_PREFIX : '/')}
      />

      {/* [2026-09-02, đợt 4 thiết kế lại desktop] Trang toàn chữ để đọc → giữ hẹp cho dễ đọc. */}
      <PageShell width="reading" baseWidth="max-w-3xl" className="space-y-6">
        <h1 tabIndex={-1} className="sr-only focus:outline-none">
          Lập trình — từ số 0 tới một sản phẩm chạy thật trên Internet
        </h1>

        {/* Khối 2 — cầm được gì trên tay */}
        <section className={`${the} space-y-3`}>
          <h2 className={tieuDe}>
            <Trophy className="w-5 h-5 text-accent-400" />
            <span>Học xong bạn cầm được gì trên tay</span>
          </h2>
          <p className="text-sm text-zinc-200 leading-relaxed read-measure">
            Không phải chứng chỉ. Là <strong>hai thứ</strong>:
          </p>
          <ol className="space-y-2 text-sm text-zinc-200 leading-relaxed list-decimal pl-5 read-measure">
            <li>
              <strong>Một sản phẩm chạy thật trên Internet</strong> — có địa chỉ https, người khác
              vào dùng được.
            </li>
            <li>
              <strong>Một repo GitHub có lịch sử từ dòng code đầu tiên</strong> — cho người tuyển
              dụng thấy bạn đi từ đâu tới. Cái đó thuyết phục hơn mọi dòng CV, vì nó không giả được.
            </li>
          </ol>
          <p className="text-sm text-zinc-300 pt-1">Sản phẩm ấy lớn lên như sau:</p>
          <ul className="space-y-2">
            {SAN_PHAM_TUNG_CHANG.map((chang) => (
              <li
                key={chang.level}
                className="flex items-start gap-3 rounded-2xl bg-zinc-950 border border-zinc-800 p-3"
              >
                <span className="shrink-0 px-2 py-0.5 rounded-full bg-accent-500/15 border border-accent-500/40 text-[11px] font-bold text-accent-300 theme-light:text-accent-900">
                  {chang.level}
                </span>
                <span className="text-sm text-zinc-200 leading-relaxed">{chang.mo_ta}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Khối 3 — năng lực nghề */}
        <section className={`${the} space-y-3`}>
          <h2 className={tieuDe}>
            <Code2 className="w-5 h-5 text-accent-400" />
            <span>Năng lực nghề bạn sẽ có</span>
          </h2>
          <dl className="space-y-3">
            {NANG_LUC.map((nl) => (
              <div key={nl.nhom}>
                <dt className="text-sm font-bold text-white">{nl.nhom}</dt>
                <dd className="text-sm text-zinc-200 leading-relaxed mt-0.5 read-measure">
                  {nl.noi_dung}
                </dd>
              </div>
            ))}
          </dl>
          <p className="text-sm text-zinc-200 leading-relaxed pt-1 border-t border-zinc-800 read-measure">
            Theo thang nghề SFIA, đây tương đương{' '}
            <strong>bậc 3 — lập trình viên làm việc độc lập</strong>, tức đủ để nhận việc thật ở mức
            junior.
          </p>
        </section>

        {/* Khối 4 — sáu thói quen tư duy */}
        <section className={`${the} space-y-3`}>
          <h2 className={tieuDe}>
            <Brain className="w-5 h-5 text-accent-400" />
            <span>Thứ chúng tôi cho là giá trị nhất: sáu thói quen tư duy</span>
          </h2>
          <p className="text-sm text-zinc-200 leading-relaxed read-measure">
            Kiến thức thì tra được. Sáu thói quen này thì không — và chúng được cài rải khắp {soBai}{' '}
            bài chứ không nằm gọn ở bài nào:
          </p>
          <ol className="space-y-2.5 list-decimal pl-5">
            {THOI_QUEN.map((tq) => (
              <li key={tq.tieu_de} className="text-sm text-zinc-200 leading-relaxed read-measure">
                <strong className="text-white">{tq.tieu_de}.</strong> {tq.giai_thich}
              </li>
            ))}
          </ol>
        </section>

        {/* Khối 5 — nói thẳng thứ KHÔNG có */}
        <section className={`${the} space-y-3`}>
          <h2 className={tieuDe}>
            <ShieldAlert className="w-5 h-5 text-amber-400 theme-light:text-amber-900" />
            <span>Nói thẳng: thứ bạn sẽ KHÔNG có</span>
          </h2>
          <p className="text-sm text-zinc-200 leading-relaxed read-measure">
            Chúng tôi thà mất một học viên còn hơn để bạn học một năm rồi mới biết:
          </p>
          <ul className="space-y-2">
            {KHONG_CO.map((item) => (
              <li
                key={item}
                className="flex items-start gap-2 text-sm text-zinc-200 leading-relaxed read-measure"
              >
                <span
                  className="text-amber-400 theme-light:text-amber-900 shrink-0"
                  aria-hidden="true"
                >
                  •
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Khối 6 — cái giá + TRẠNG THÁI THẬT (bắt buộc hiển thị, luật N1) */}
        <section className={`${the} space-y-3`}>
          <h2 className={tieuDe}>
            <Clock className="w-5 h-5 text-accent-400" />
            <span>Cái giá, và trạng thái thật của khoá học</span>
          </h2>
          <p className="text-sm text-zinc-200 leading-relaxed read-measure">
            Ước tính trong đặc tả: <strong>khoảng {tongTuan} tuần — gần một năm</strong> học đều
            đặn. Đây không phải bootcamp ba tháng, và chúng tôi không bán nó như vậy.
          </p>
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 space-y-2">
            <p className="text-sm font-bold text-white">Trạng thái thật hôm nay</p>
            <p className="text-sm text-zinc-100 leading-relaxed read-measure">
              Nội dung đã đủ —{' '}
              <strong>
                {soBai} bài, cả {soBac} bậc đều mở
              </strong>
              , không bậc nào còn chỗ trống. Nhưng <strong>chưa có ai đi hết môn này</strong>: toàn
              bộ vừa soạn xong, chưa hiệu chỉnh theo một người học thật nào. Nghĩa là mọi con số ở
              trên — kể cả "gần một năm" — là{' '}
              <strong>thiết kế đầu ra, không phải kết quả đã đo được</strong>. Bạn sẽ nằm trong nhóm
              đầu tiên đi qua nó.
            </p>
          </div>
        </section>

        {/* Khối 7 — hợp và không hợp */}
        <section className={`${the} space-y-3`}>
          <h2 className={tieuDe}>
            <UserCheck className="w-5 h-5 text-accent-400" />
            <span>Hợp và không hợp</span>
          </h2>
          <p className="text-sm text-zinc-200 leading-relaxed read-measure">
            <strong className="text-emerald-300 theme-light:text-emerald-800">
              Hợp với bạn nếu:
            </strong>{' '}
            bạn muốn đổi nghề một cách nghiêm túc, hoặc là học sinh / sinh viên muốn một cái nền
            vững chứ không phải mẹo vặt.
          </p>
          <p className="text-sm text-zinc-200 leading-relaxed read-measure">
            <strong className="text-amber-300 theme-light:text-amber-900">Không hợp nếu:</strong>{' '}
            bạn cần một công việc trong ba tháng.
          </p>
        </section>

        {/* Khối 8 — hành động. Chưa đăng nhập thì đi qua /login trước. */}
        <section className="space-y-2.5">
          <button
            onClick={() =>
              nav(
                user
                  ? duongDanBaiHoc({
                      id: 'p1-u1-l1',
                      title: getLessonSummary('p1-u1-l1')?.title ?? '',
                    })
                  : '/login',
              )
            }
            className="tap-44 w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-accent-500 hover:bg-accent-400 text-black font-semibold text-sm transition shadow-md active:scale-[0.98]"
          >
            <Rocket className="w-4 h-4" />
            <span>Bắt đầu bài đầu tiên</span>
          </button>
          <button
            onClick={() => nav(PROGRAMMING_PREFIX)}
            className="tap-44 w-full inline-flex items-center justify-center gap-2 py-3 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-zinc-600 text-zinc-200 font-semibold text-sm transition"
          >
            <span>
              Xem lộ trình {soBac} bậc và {soChang} chặng dự án
            </span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </section>
      </PageShell>
    </div>
  )
}
