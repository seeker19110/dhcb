// ReviewHub — MỘT chỗ duy nhất trả lời "hôm nay tôi cần ôn gì trên MỌI môn" (S12-1, route
// `/goc-hoc-tap/on-tap`).
//
// Đặc tả: docs/specs/2026-09-15-learning-ux-s12-on-lai-so-loi-tien-do.md AC-5.
//
// BA điều trang này CỐ Ý KHÔNG làm:
//  1. Không viết lại màn ôn nào — mỗi nhóm chỉ DẪN tới giao diện ôn đã có của môn, kèm cap phiên.
//  2. Không ghi gì vào kho SRS: hàng đợi dựng bằng hàm thuần `buildReviewQueue` trên bản chụp
//     CHỈ ĐỌC của kho.
//  3. Không gọi AI, không sinh thẻ mới. Hàng đợi rỗng là tin TỐT, nói thẳng như vậy.
//
// Vì sao không nạp từ điển: số từ vựng đến hạn đọc thẳng từ kho SRS (khoá không mang tiền tố
// namespace nào), nên hub không kéo theo cả từ điển (~nặng) chỉ để đếm — đúng cảnh báo §8 của
// đặc tả.
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useSearchParams } from 'react-router-dom'
import { Brain, ArrowRight, Sparkles } from 'lucide-react'
import Layout from '../../components/Layout'
import { PageShell } from '@core/PageShell'
import { usePageTitle } from '../../lib/usePageTitle'
import { duongDanSoTayLoiSai } from '../../lib/englishRoutes'
import { useAuth } from '../../context/useAuth'
import { getSrsSnapshot } from '../../lib/srs'
import { getDueProgCards } from '../../lib/programmingSrs'
import { getDueStemCards } from '../../lib/stemSrs'
import { getDueMistakes, getMistakes } from '../../lib/mistakes'
import { getChosenSubject } from '../../lib/onboarding'
import { subjectHomePath } from '@dhcb/core-learner/subjectHome'
import {
  buildReviewQueue,
  nhanMon,
  type EvidenceMistakeDue,
  type ReviewSources,
} from '../../lib/reviewQueue'
import { fetchEvidenceAttempts, monStemDaHocTrenMay } from '../../lib/stemEvidence'
import {
  mistakesFromEvidence,
  getDueEvidenceMistakes,
  hanOnCuaMuc,
} from '../../lib/evidenceMistakes'
import { STEM_SUBJECTS } from '../../lib/stemLessonRoutes'
import { docCapTuQuery } from '../../lib/reviewRoutes'
import type { ReviewQueue } from '@dhcb/core-contracts/reviewItem'

/** Mã cấp CEFR — mã bài ngữ pháp luôn mở đầu bằng cấp (`a1-be`), đó là manh mối rẻ nhất. */
const CAP_CEFR = ['a1', 'a2', 'b1', 'b2', 'c1', 'c2']

/**
 * Cấp CEFR để dẫn tới tab "Ôn SRS" đúng trang cấp. Suy từ chính mã bài ngữ pháp đến hạn — hub
 * KHÔNG nạp giáo trình/từ điển chỉ để biết cấp. Không suy được thì trả `undefined` và mục môn
 * Anh dẫn về danh sách lộ trình để người học tự chọn (không đoán bừa một cấp).
 */
function capCefrTuBaiNguPhap(grammarIds: readonly string[]): string | undefined {
  for (const id of grammarIds) {
    const cap = id.slice(0, 2).toLowerCase()
    if (CAP_CEFR.includes(cap)) return cap
  }
  return undefined
}

/** Tiền tố của các namespace KHÔNG phải từ vựng — dùng để tách nhóm từ vựng khỏi kho chung. */
const NAMESPACE = ['grammar:', 'prog:', 'stem:']

/** Đọc thẳng kho SRS ra hai danh sách môn Anh đến hạn, không cần nạp từ điển. */
function nguonAnh(uid: string, now: number) {
  const kho = getSrsSnapshot(uid)
  const words: { word: string }[] = []
  const grammarIds: string[] = []
  for (const [key, card] of Object.entries(kho)) {
    if (card.due > now) continue
    if (key.startsWith('grammar:')) grammarIds.push(key.slice('grammar:'.length))
    else if (!NAMESPACE.some((t) => key.startsWith(t))) words.push({ word: key })
  }
  return { words, grammarIds, kho }
}

export default function ReviewHub() {
  usePageTitle('Ôn tập hôm nay · Đồng hành cùng bạn')
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const cap = useMemo(() => docCapTuQuery(searchParams), [searchParams])
  // Mốc "bây giờ" chốt MỘT LẦN lúc vào trang: hàng đợi tính lại giữa chừng thì số mục nhảy
  // dưới chân người học (và lint react-hooks/purity cấm gọi Date.now() khi render).
  const [now] = useState(() => Date.now())

  // ── Câu sai của bài STEM (S12-2) ───────────────────────────────────────────────────────────
  //
  // Nguồn duy nhất là nhật ký bằng chứng (S11) — phải đi mạng, nên đây là nguồn DUY NHẤT trong
  // hub không đọc được đồng bộ. Chỉ hỏi những môn người này đã từng nộp bài trên máy: người
  // chưa học STEM thì hub không phát sinh request nào.
  const [loiStem, setLoiStem] = useState<{
    status: 'ready' | 'error'
    items: EvidenceMistakeDue[]
  } | null>(null)
  useEffect(() => {
    if (!user) return
    // Danh sách rỗng đi qua ĐÚNG đường dẫn bất đồng bộ này luôn (Promise.all([]) giải ngay):
    // đặt state thẳng trong thân effect là một lượt render dây chuyền, lint chặn có lý.
    const mon = monStemDaHocTrenMay(user.id)
    let cancelled = false
    void Promise.all(mon.map((m) => fetchEvidenceAttempts(user.id, m))).then((ketQua) => {
      if (cancelled) return
      const attempts = ketQua.flatMap((r) => r.attempts)
      const items = getDueEvidenceMistakes(mistakesFromEvidence(attempts), now).map((e) => ({
        entryId: e.entryId,
        subjectId: e.subjectId,
        contentId: e.contentId,
        questionIndex: e.questionIndex,
        dueAt: hanOnCuaMuc(e),
        href: duongDanSoTayLoiSai(),
        title: `${STEM_SUBJECTS[e.subjectId].loader.getSummary(e.contentId)?.title ?? e.contentId} · câu ${e.questionIndex + 1}`,
      }))
      // Một môn hỏng là cả nguồn 'error': hub phải nói "chưa tải được", KHÔNG được im lặng
      // hiện phần đọc được như thể đó là toàn bộ.
      setLoiStem({
        status: ketQua.some((r) => r.status === 'error') ? 'error' : 'ready',
        items,
      })
    })
    return () => {
      cancelled = true
    }
  }, [user, now])

  // Bốn nguồn đọc ĐỒNG BỘ từ thiết bị (localStorage) nên hàng đợi dựng ngay trong render và
  // hiện được ngay. Nguồn thứ năm — `learning.evidence` (câu sai bài STEM, S12-2) — phải đi
  // mạng nên tới sau và làm hàng đợi dựng lại một lần; trong lúc chờ nó là 'unavailable'
  // (CHƯA BIẾT), tải hỏng là 'error' — cả hai đều khác "không có lỗi nào".
  const queue: ReviewQueue | null = useMemo(() => {
    if (!user) return null
    const { words, grammarIds, kho } = nguonAnh(user.id, now)
    const sources: ReviewSources = {
      uid: user.id,
      englishDueWords: words,
      englishDueGrammarIds: grammarIds,
      programmingDueCards: getDueProgCards(user.id),
      stemDueCards: getDueStemCards(user.id),
      englishMistakesDue: getDueMistakes(user.id, now),
      evidenceMistakesDue: loiStem?.items ?? [],
      srsCards: kho,
      englishLevelId: capCefrTuBaiNguPhap(grammarIds),
      sourcesState: {
        'english.srs': 'ready',
        'programming.srs': 'ready',
        'stem.srs': 'ready',
        'english.mistakes': 'ready',
        // Chưa tải xong thì 'unavailable' (chưa biết), tải hỏng thì 'error' — hai điều khác
        // nhau, và cả hai đều KHÁC "không có lỗi nào".
        'learning.evidence': loiStem == null ? 'unavailable' : loiStem.status,
      },
    }
    return buildReviewQueue(sources, { cap, now })
  }, [user, cap, now, loiStem])

  // Nhóm theo MÔN và theo LOẠI (thẻ / lỗi đã mắc): hai loại đó ôn ở hai màn khác nhau, gộp
  // chung một dòng thì nút "Ôn ngay" chỉ dẫn đúng được một nửa. Số đếm là số mục CỦA PHIÊN NÀY
  // (sau khi cắt cap) — phần còn lại được nói riêng ở dòng tổng bên trên, để hai con số không
  // mâu thuẫn nhau.
  const nhom = useMemo(() => {
    if (!queue) return []
    const theoNhom = new Map<string, { khoa: string; nhan: string; soMuc: number; href: string }>()
    for (const it of queue.items) {
      const laLoi = it.kind === 'mistake'
      const khoa = `${it.subjectId}|${laLoi ? 'mistake' : 'card'}`
      const cu = theoNhom.get(khoa)
      if (cu) {
        cu.soMuc += 1
        continue
      }
      theoNhom.set(khoa, {
        khoa,
        nhan: laLoi ? `${nhanMon(it.subjectId)} · lỗi đã mắc` : nhanMon(it.subjectId),
        soMuc: 1,
        href: it.href,
      })
    }
    return [...theoNhom.values()].sort((a, b) => b.soMuc - a.soMuc)
  }, [queue])

  const conLai = queue ? Math.max(0, queue.totalDue - queue.items.length) : 0

  // [U9b, audit 2026-09-30 M19] "Không có gì đến hạn — quay lại ngày mai" chỉ ĐÚNG với người đã
  // có thẻ/lỗi đang chờ lịch ôn. Người chưa học gì (kho SRS chung — gồm cả thẻ `prog:`/`stem:` —
  // rỗng, chưa có lỗi nào, chưa nộp bài STEM nào trên máy) thì "ngày mai" cũng chẳng có gì: phải
  // chỉ lối BẮT ĐẦU, vào đúng môn đã chọn lúc onboarding nếu có.
  const chuaCoGiDeOn =
    !!user &&
    queue?.totalDue === 0 &&
    Object.keys(getSrsSnapshot(user.id)).length === 0 &&
    getMistakes(user.id).length === 0 &&
    monStemDaHocTrenMay(user.id).length === 0
  const monDaChon = user ? getChosenSubject(user.id) : undefined
  const loiBatDau = monDaChon ? subjectHomePath(monDaChon) : '/goc-hoc-tap'

  return (
    <>
      <Layout title="Ôn tập hôm nay" />
      <PageShell width="standard" baseWidth="max-w-2xl" className="space-y-5">
        <h1 tabIndex={-1} className="sr-only focus:outline-none">
          Ôn tập hôm nay
        </h1>

        {queue?.sourcesState['learning.evidence'] === 'error' && (
          <p className="text-sm text-content-secondary" role="status">
            Chưa tải được lỗi từ bài STEM — số dưới đây chưa gồm chúng.{' '}
            <Link to={duongDanSoTayLoiSai()} className="underline font-semibold">
              Mở sổ lỗi để thử lại
            </Link>
          </p>
        )}

        {chuaCoGiDeOn && (
          <div
            className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-5 space-y-3"
            role="status"
          >
            <p className="flex items-center gap-2 text-sm font-bold text-content">
              <Sparkles className="w-5 h-5 text-accent-400" aria-hidden="true" />
              <span>Chưa có gì để ôn — bạn chưa học bài nào</span>
            </p>
            <p className="text-sm text-content-secondary leading-relaxed">
              Học xong bài đầu tiên, những từ và câu bạn vừa gặp sẽ tự vào lịch ôn ở đây, đúng lúc
              trí nhớ sắp quên.
            </p>
            <Link
              to={loiBatDau}
              className="tap-44 inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-accent-500 hover:bg-accent-400 text-black font-semibold text-sm transition"
            >
              <span>Bắt đầu học bài đầu tiên</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>
        )}

        {queue && queue.totalDue === 0 && !chuaCoGiDeOn && (
          <div
            className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-5 space-y-3"
            role="status"
          >
            <p className="flex items-center gap-2 text-sm font-bold text-content">
              <Sparkles
                className="w-5 h-5 text-emerald-400 theme-light:text-emerald-900"
                aria-hidden="true"
              />
              <span>Hôm nay không có gì đến hạn — quay lại ngày mai</span>
            </p>
            <p className="text-sm text-content-secondary leading-relaxed">
              Khoảng nghỉ chính là lúc trí nhớ được củng cố, nên không có gì để ôn là dấu hiệu tốt.
              Muốn học tiếp thì chọn một môn ở Góc học tập.
            </p>
            <Link
              to="/goc-hoc-tap"
              className="tap-44 inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-accent-500 hover:bg-accent-400 text-black font-semibold text-sm transition"
            >
              <span>Học tiếp</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>
        )}

        {queue && queue.totalDue > 0 && (
          <>
            <p className="text-sm text-content-secondary" aria-live="polite">
              {queue.items.length} mục trong phiên này (đã gộp mục trùng nhau)
              {conLai > 0 ? ` · còn ${conLai} mục sau phiên này` : ''}.
            </p>

            <ul className="space-y-3">
              {nhom.map((n) => (
                <li key={n.khoa}>
                  <Link
                    to={n.href}
                    className="tap-44 flex items-center justify-between gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 hover:border-accent-500/50 transition"
                  >
                    <span className="min-w-0">
                      <span className="block font-semibold text-content">{n.nhan}</span>
                      <span className="block text-sm text-content-secondary">
                        {n.soMuc} mục · tính trên thiết bị này
                      </span>
                    </span>
                    <span className="shrink-0 inline-flex items-center gap-1.5 text-sm font-semibold text-accent-400">
                      <Brain className="w-4 h-4" aria-hidden="true" />
                      <span>Ôn ngay</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>

            <p className="text-sm text-content-secondary leading-relaxed">
              Số ở đây tính từ dữ liệu trên thiết bị này. Ôn xong, kết quả được ghi đúng vào lịch ôn
              của từng môn như khi bạn ôn trong màn của môn đó.
            </p>
          </>
        )}
      </PageShell>
    </>
  )
}
