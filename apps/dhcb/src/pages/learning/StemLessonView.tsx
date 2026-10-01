// StemLessonView — học MỘT bài của môn STEM (Toán · Lí · Hoá · Sinh).
//
// Nhịp trang đi đúng thứ tự sư phạm đã chốt ở docs/specs/2026-09-13-hoan-thien-4-mon-stem.md:
// tình huống mở đầu → lý thuyết → hoạt ảnh → ví dụ mẫu → tự kiểm tra → thẻ ôn.
//
// Hai quyết định đáng nhớ:
//  1. Nội dung bài nạp LƯỜI theo chương (`loader.loadLesson`) — bốn registry cộng lại ~2 MB,
//     nhét thẳng vào bundle là mọi trang đều phải gánh.
//  2. Chấm câu hỏi bằng `gradeAnswer` của @dhcb/core-grading — hàm thuần, tất định, chạy
//     offline. KHÔNG có AI trong luồng phán đúng/sai (nguyên tắc bất di bất dịch của engine).
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Link,
  Navigate,
  useLocation,
  useNavigate,
  useNavigationType,
  useParams,
} from 'react-router-dom'
import { ArrowLeft, Check, X } from 'lucide-react'
import { z } from 'zod'
// Import xuyên gói phải trỏ FILE cụ thể (CLAUDE.md mục 6): không gói `@dhcb/*` nào khai entry
// "." trong `exports`, chỉ khai `"./*"`. Bare import từng chạy được nhờ Rollup dễ tính, nhưng
// rolldown (Vite 8) kiểm `exports` nghiêm và báo `"." is not exported` — xem changelog 0416.
import { gradeAnswer } from '@dhcb/core-grading/index'
import type {
  StemCheckQuestion,
  StemLessonLike,
  StemSubjectId,
} from '@dhcb/core-contracts/stemLesson'
import { STEM_CHECK_PASS_RATIO } from '@dhcb/core-learner/completionRules'
import { LessonAnimation } from '@core/LessonAnimation'
import Layout from '../../components/Layout'
import { buttonClass } from '@core/buttonStyles'
import { usePageTitle } from '../../lib/usePageTitle'
import StemTheory from '../../components/StemTheory'
import { useAuth } from '../../context/useAuth'
import { contentFingerprint } from '../../lib/learningSession'
import { boCoTuThuLai, docCauTuThuLai } from '../../lib/stemRetry'
import { STEM_CHECK_COPY } from '../../lib/feedbackCopy'
import { useLearningSession } from '../../lib/useLearningSession'
import { ChuaDuyetChuyenMon } from '../../components/ChuaDuyetChuyenMon'
import { LuotDuyetBai } from '../../components/admin/LuotDuyetBai'
import { PageShell } from '@core/PageShell'
import { TwoPane } from '@core/TwoPane'
import {
  duongDanDanhSachBai,
  getStemSubject,
  maBaiTuUrl,
  nhanCapHsg,
} from '../../lib/stemLessonRoutes'
import { buildStemOutlineForApp } from '../../lib/outline/stemOutlineApp'
import { useOutlinePane } from '../../components/useOutlinePane'
import { LoiTienDo } from '../../components/OutlinePane'
import OutlinePrevNext from '../../components/OutlinePrevNext'
import ActivityResult from '../../components/learning/ActivityResult'
import { neoCauHoi } from '../../lib/mistakeRoutes'
import {
  giaiNeoTrongBai,
  mucTrongBai,
  NEO_TRONG_BAI,
  type CauTrucBai,
} from '../../lib/stemLessonAnchors'
import TrongBaiNav from '../../components/learning/TrongBaiNav'
import { ketQuaSangManHinh } from '../../lib/stemResultView'
import { useStemCompletionState } from '../../lib/useStemCompletionState'
import { useIsDesktopViewport } from '../../lib/useIsDesktopViewport'
import {
  submitStemEvidence,
  flushPendingEvidence,
  hasPendingEvidence,
  type SubmitEvidenceResult,
} from '../../lib/stemEvidence'
import { prevNext } from '@dhcb/core-learner/outline/outlineNav'

// Nháp phần "Tự kiểm tra": CHỈ chữ người học gõ + danh sách câu đã bấm chấm.
// KHÔNG lưu kết quả đúng/sai — nó được TÍNH LẠI bằng `gradeAnswer` (hàm thuần, offline) mỗi lần
// dựng trang. Một nguồn sự thật cho việc chấm, và nháp không bao giờ là bằng chứng hoàn thành.
const stemDraftSchema = z.object({
  answers: z.record(z.string(), z.string()),
  checked: z.array(z.string()),
})
type StemDraft = z.infer<typeof stemDraftSchema>

const NHAP_RONG: StemDraft = { answers: {}, checked: [] }

/**
 * [S09a] Một lượt nộp đã có kết quả, gắn CHẶT với câu trả lời lúc bấm Nộp và với người nộp.
 * Chỉ sống trong bộ nhớ — không persist thêm trạng thái "có thẩm quyền" nào (§2.4).
 */
interface LuotDaNop {
  ketQua: SubmitEvidenceResult
  answers: Readonly<Record<string, string>>
  uid: string
}

function CauHoi({
  cau,
  thuTu,
  traLoi: traLoiNhap,
  daCham: daChamNhap,
  dangTuThu,
  onChon,
  onGo,
  onKiemTra,
  onThuLai,
  onXemLai,
}: {
  cau: StemCheckQuestion
  thuTu: number
  traLoi: string
  daCham: boolean
  /** [S11b] Vào từ Sổ lỗi: ẩn đáp án cũ + lời giải cho tới khi người học trả lời lại. */
  dangTuThu: boolean
  onChon: (giaTri: string) => void
  onGo: (giaTri: string) => void
  onKiemTra: () => void
  /** [S11b] Xoá đáp án + kết quả của RIÊNG câu này để làm lại từ đầu. */
  onThuLai: () => void
  /** [S11b] Thoát chế độ tự thử, hiện lại câu trả lời lần trước. */
  onXemLai: () => void
}) {
  // Chế độ tự thử CHỈ đổi thứ được VẼ, không đụng nháp: người học có thể xem lại bất cứ lúc nào.
  const traLoi = dangTuThu ? '' : traLoiNhap
  const daCham = dangTuThu ? false : daChamNhap
  // Kết quả SUY RA, không lưu: có bấm chấm và có chữ thì mới có đúng/sai.
  const ketQua: 'dung' | 'sai' | null =
    daCham && traLoi.trim() ? (gradeAnswer(traLoi, cau.answer).correct ? 'dung' : 'sai') : null

  return (
    <li className="rounded-xl border border-line-subtle bg-surface-card p-4">
      <p id={neoCauHoi(thuTu - 1)} tabIndex={-1} className="scroll-mt-24 font-medium text-content">
        Câu {thuTu}. {cau.prompt}
      </p>

      {dangTuThu && (
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
          <p className="text-content-secondary">
            Đang tự thử lại — câu trả lời lần trước đang được ẩn.
          </p>
          <button
            type="button"
            onClick={onXemLai}
            className="tap-44-y text-accent-300 theme-light:text-accent-800 underline underline-offset-2"
          >
            Xem câu trả lời lần trước
          </button>
        </div>
      )}

      {cau.choices ? (
        <ul className="mt-3 space-y-2">
          {cau.choices.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => onChon(c.id)}
                aria-pressed={traLoi === c.id}
                className={`w-full min-h-[44px] rounded-lg border px-4 py-2 text-left text-content ${
                  traLoi === c.id ? 'border-accent-500' : 'border-line-strong'
                }`}
              >
                {c.label}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          <label className="sr-only" htmlFor={`tra-loi-${thuTu}`}>
            Câu trả lời của bạn cho câu {thuTu}
          </label>
          <input
            id={`tra-loi-${thuTu}`}
            value={traLoi}
            onChange={(e) => onGo(e.target.value)}
            className="min-h-[44px] flex-1 rounded-lg border border-line-strong bg-surface-base px-3 text-content"
            placeholder="Nhập câu trả lời"
          />
          <button type="button" onClick={onKiemTra} className={buttonClass({ variant: 'primary' })}>
            Kiểm tra
          </button>
        </div>
      )}

      {ketQua && (
        <div className="mt-3" role="status">
          <p className="font-medium text-content">
            {ketQua === 'dung' ? (
              <>
                <Check className="inline h-4 w-4 mr-1" aria-hidden="true" />
                {STEM_CHECK_COPY.dung}
              </>
            ) : (
              <>
                <X className="inline h-4 w-4 mr-1" aria-hidden="true" />
                {STEM_CHECK_COPY.sai}
              </>
            )}
          </p>
          <p className="mt-1 text-content-secondary">{cau.explain}</p>
        </div>
      )}
      {/* Nút nằm NGOÀI vùng role="status" để trình đọc màn hình không đọc nhãn nút như một
          phần của thông báo kết quả. */}
      {ketQua === 'sai' && (
        <button
          type="button"
          onClick={onThuLai}
          className={`${buttonClass({ variant: 'secondary' })} mt-3 min-h-[44px]`}
        >
          Thử lại câu này
        </button>
      )}
    </li>
  )
}

/**
 * Phần "Tự kiểm tra" — MỘT nguồn ghi cho đáp án của mọi câu, để nháp sống qua reload.
 *
 * Vì sao tách thành component riêng: hook phiên học cần `bai` đã tải xong, mà bài STEM nạp lười
 * nên lúc `StemLessonView` mount thì chưa có `bai.id`/`bai.checkQuestions` — hook thì không được
 * gọi có điều kiện. Trang dựng nó với `key={bai.id}` nên đổi bài là dựng lại sạch.
 *
 * Ranh giới: đây chỉ là NHÁP trên cùng thiết bị. Bài STEM vẫn KHÔNG có tiến độ/evidence —
 * không khoá localStorage nào khác, không endpoint, không cột DB (đặc tả S08 §① KHÔNG LÀM).
 */
function TuKiemTra({
  bai,
  subjectId,
  nextHref,
  onSubmitted,
  onNhay,
  tuThuLaiCau = null,
}: {
  bai: StemLessonLike
  subjectId: StemSubjectId
  /** [S11b] Câu (đếm từ 0) được mở từ Sổ lỗi để tự thử lại — đọc MỘT lần lúc dựng. */
  tuThuLaiCau?: number | null
  /** [S09b] Nhảy tới một neo trong bài (đổi hash + focus) — dùng cho link "về Tự kiểm tra". */
  onNhay: (id: string) => void
  /** Bài kế tiếp theo cây mục lục — màn kết quả mời đi tiếp thay vì bỏ người học ở đó. */
  nextHref?: string
  /** Nộp xong (bất kể đạt hay chưa) thì mục lục phải đọc lại trạng thái từ nguồn sự thật. */
  onSubmitted?: () => void
}) {
  const { user, loading, isGuest } = useAuth()
  // Owner `null` khi AuthProvider chưa xong → hook ở trạng thái `loading`, tuyệt đối không ghi.
  const owner = useMemo(
    () =>
      loading || !user
        ? null
        : { kind: isGuest ? ('guest' as const) : ('account' as const), id: user.id },
    [loading, user, isGuest],
  )

  // Vân tay khung bài: đổi đề thì nháp cũ thành `stale` và bị bỏ IM LẶNG (§3.5 của đặc tả) —
  // nháp STEM chỉ là chữ/chỉ số nên không đáng làm phiền người học bằng một hộp hỏi.
  const contentVersion = useMemo(
    () =>
      contentFingerprint([
        bai.id,
        bai.title,
        bai.checkQuestions.length,
        ...bai.checkQuestions.map((c) => c.prompt),
      ]),
    [bai],
  )

  const initial = useCallback(() => ({ stepIndex: 0, draft: NHAP_RONG }), [])
  const stepLabel = useCallback(() => 'Tự kiểm tra', [])

  const phien = useLearningSession<StemDraft>({
    owner,
    subjectId,
    contentId: bai.id,
    contentVersion,
    draftSchema: stemDraftSchema,
    initial,
    stepLabel,
  })

  const { draft, setDraft } = phien

  // [S11b] Câu đang ở chế độ tự thử (ẩn đáp án cũ). Chỉ nhận chỉ số có thật trong bài — cờ đến
  // từ history nên có thể lệch (bài đã sửa bớt câu). Thoát khi người học trả lời hoặc bấm xem lại.
  const [cauTuThu, setCauTuThu] = useState<number | null>(() =>
    tuThuLaiCau !== null && tuThuLaiCau < bai.checkQuestions.length ? tuThuLaiCau : null,
  )

  // Trắc nghiệm: bấm là chọn VÀ chấm luôn (giữ đúng hành vi đang có).
  const chon = useCallback(
    (i: number, giaTri: string) => {
      setCauTuThu((c) => (c === i ? null : c))
      setDraft((prev) => ({
        answers: { ...prev.answers, [i]: giaTri },
        checked: prev.checked.includes(String(i)) ? prev.checked : [...prev.checked, String(i)],
      }))
    },
    [setDraft],
  )

  // Tự luận: gõ là bỏ kết quả cũ, chỉ chấm khi bấm "Kiểm tra" (hành vi hiện có, giữ nguyên).
  const go = useCallback(
    (i: number, giaTri: string) => {
      setCauTuThu((c) => (c === i ? null : c))
      setDraft((prev) => ({
        answers: { ...prev.answers, [i]: giaTri },
        checked: prev.checked.filter((k) => k !== String(i)),
      }))
    },
    [setDraft],
  )

  // [S11b] "Thử lại câu này": xoá đáp án + kết quả của RIÊNG câu i (thao tác chủ động của người
  // học), rồi đưa focus về đề câu để làm lại ngay. Không tạo bằng chứng, không đụng câu khác.
  const thuLai = useCallback(
    (i: number) => {
      setDraft((prev) => {
        const { [String(i)]: _bo, ...conLai } = prev.answers
        void _bo
        return { answers: conLai, checked: prev.checked.filter((k) => k !== String(i)) }
      })
      requestAnimationFrame(() => document.getElementById(neoCauHoi(i))?.focus())
    },
    [setDraft],
  )

  const kiemTra = useCallback(
    (i: number) =>
      setDraft((prev) =>
        !(prev.answers[String(i)] ?? '').trim() || prev.checked.includes(String(i))
          ? prev
          : { ...prev, checked: [...prev.checked, String(i)] },
      ),
    [setDraft],
  )

  // ── Nộp bài: MỘT lượt cho cả bài, và người phán "đạt hay chưa" là SERVER (S11-2) ──
  const [dangNop, setDangNop] = useState(false)
  const [luotNop, setLuotNop] = useState<LuotDaNop | null>(null)

  const uid = owner?.id ?? ''

  // [S09a AC05] Số thứ tự lượt nộp "còn hiệu lực". Đổi người dùng (hoặc rời bài) thì tăng lên,
  // nên response về muộn của người/bài cũ tự nhận ra mình đã lỗi thời và KHÔNG ghi đè màn
  // kết quả của người/bài mới. Đổi bài vốn đã dựng lại component (`key={bai.id}`); ref này che
  // nốt ca đổi người trên cùng một bài.
  const luotHieuLuc = useRef(0)
  useEffect(
    () => () => {
      luotHieuLuc.current += 1
    },
    [uid],
  )
  const soCau = bai.checkQuestions.length
  // [S11b] Đáp án ĐANG HIỆU LỰC: câu đang tự thử coi như chưa trả lời — nộp lúc này không được
  // lặng lẽ gửi lại đáp án cũ mà người học đang không nhìn thấy.
  const dapAnHieuLuc = useMemo(() => {
    if (cauTuThu === null) return draft.answers
    const { [String(cauTuThu)]: _an, ...conLai } = draft.answers
    void _an
    return conLai
  }, [draft.answers, cauTuThu])
  const daTraLoiHet =
    soCau > 0 &&
    bai.checkQuestions.every((_, i) => (dapAnHieuLuc[String(i)] ?? '').trim().length > 0)

  // Gửi lại những lượt nộp đang kẹt trên máy này (mất mạng / server lỗi / hết phiên lúc nộp).
  // CÓ ĐIỀU KIỆN `hasPendingEvidence`: hàng đợi rỗng thì KHÔNG có request nào rời trình duyệt,
  // nên "mở bài" vẫn là không-gửi-gì (AC-13).
  useEffect(() => {
    if (!uid || owner?.kind !== 'account') return
    const gui = () => {
      if (hasPendingEvidence(uid)) void flushPendingEvidence(uid)
    }
    gui()
    window.addEventListener('online', gui)
    return () => window.removeEventListener('online', gui)
  }, [uid, owner?.kind])

  // Nạp TRƯỚC phần chấm điểm STEM (đợi lười, xem lib/stemEvidence.ts) ngay khi vào bài — lúc này
  // người học còn đang trả lời, còn thời gian để trình duyệt tải xong trước khi bấm Nộp. Không
  // await kết quả: nộp bài vẫn hoạt động đúng nếu preload chưa xong, chỉ là submitStemEvidence tự
  // await import() của chính nó lần nữa (cache module, gần như không tốn thêm gì).
  useEffect(() => {
    void import('@dhcb/core-learner/stemGrading.js')
  }, [])

  const nop = useCallback(async () => {
    if (!uid || dangNop) return
    setDangNop(true)
    const luot = ++luotHieuLuc.current
    // [S09a AC05] Chụp câu trả lời NGAY LÚC BẤM NỘP (chỉ trong bộ nhớ). Màn kết quả hiện đúng
    // bản chụp này — sửa nháp trong lúc chờ hay sau khi có kết quả không được lọt vào lượt cũ.
    const banChup: Readonly<Record<string, string>> = { ...dapAnHieuLuc }
    // Nộp rồi thì mọi câu đều phải hiện đúng/sai — kể cả câu tự luận chưa bấm "Kiểm tra".
    setDraft((prev) => ({ ...prev, checked: bai.checkQuestions.map((_, i) => String(i)) }))
    const answers = bai.checkQuestions
      .map((_, i) => ({ questionIndex: i, raw: (banChup[String(i)] ?? '').trim() }))
      .filter((a) => a.raw.length > 0)
    try {
      const ketQua = await submitStemEvidence(
        uid,
        { subjectId, contentId: bai.id, activityKind: 'stem_lesson_check', answers },
        bai,
      )
      // Lượt đã lỗi thời (đổi người dùng / rời bài trong lúc chờ): bỏ qua kết quả trên màn
      // hình. Bằng chứng thì đã ghi xong ở `submitStemEvidence` — mục lục vẫn phải đọc lại.
      if (luot === luotHieuLuc.current) setLuotNop({ ketQua, answers: banChup, uid })
      onSubmitted?.()
    } finally {
      setDangNop(false)
    }
  }, [uid, dangNop, setDraft, bai, subjectId, dapAnHieuLuc, onSubmitted])

  // Chỉ hiện kết quả của ĐÚNG người đang mở bài: đổi tài khoản thì kết quả người trước biến mất.
  const manKetQua = useMemo(
    () =>
      luotNop && luotNop.uid === uid
        ? ketQuaSangManHinh(luotNop.ketQua, bai, luotNop.answers)
        : null,
    [luotNop, uid, bai],
  )

  return (
    <>
      <h2
        id={NEO_TRONG_BAI.tuKiem}
        tabIndex={-1}
        className="mt-8 scroll-mt-24 text-xl font-bold text-content"
      >
        Tự kiểm tra
      </h2>
      {phien.storageMode === 'memory' && (
        <p className="mt-2 text-content-secondary" role="status">
          Trình duyệt đang chặn lưu nháp — rời trang là mất phần đang gõ.
        </p>
      )}
      <ul className="mt-3 space-y-4">
        {bai.checkQuestions.map((cau, i) => (
          <CauHoi
            key={i}
            cau={cau}
            thuTu={i + 1}
            traLoi={draft.answers[String(i)] ?? ''}
            daCham={draft.checked.includes(String(i))}
            // Chỉ có gì để ẩn khi nháp còn đáp án cũ (máy khác/không nháp thì hiện như thường).
            dangTuThu={cauTuThu === i && (draft.answers[String(i)] ?? '').trim().length > 0}
            onChon={(giaTri) => chon(i, giaTri)}
            onGo={(giaTri) => go(i, giaTri)}
            onKiemTra={() => kiemTra(i)}
            onThuLai={() => thuLai(i)}
            onXemLai={() => setCauTuThu(null)}
          />
        ))}
      </ul>

      {soCau > 0 && (
        <div className="mt-4">
          <button
            type="button"
            onClick={() => void nop()}
            disabled={!daTraLoiHet || dangNop || !uid}
            className={`${buttonClass({ variant: 'primary' })} min-h-[44px] disabled:opacity-60`}
          >
            {dangNop ? 'Đang nộp…' : 'Nộp bài tự kiểm tra'}
          </button>
          {!daTraLoiHet && (
            <p className="mt-2 text-content-secondary">{STEM_CHECK_COPY.chuaTraLoiHet(soCau)}</p>
          )}
        </div>
      )}

      {/* [S09b] Heading `#ket-qua` LUÔN có, để link "Kết quả" trong mục Trong bài không bao giờ
          rơi vào khoảng không. Chưa nộp (hoặc vừa tải lại trang) thì nói thẳng là chưa có — KHÔNG
          dựng điểm 0 hay tự nộp để có màn hình; kết quả chỉ đến từ lượt nộp thật (§2.3). */}
      <h2
        id={NEO_TRONG_BAI.ketQua}
        tabIndex={-1}
        className="mt-8 scroll-mt-24 text-xl font-bold text-content"
      >
        Kết quả
      </h2>
      {soCau === 0 ? (
        <p className="mt-2 text-content-secondary">
          Bài này chưa có câu tự kiểm tra nên không có lượt nộp và không có kết quả.
        </p>
      ) : manKetQua ? (
        <ActivityResult
          {...manKetQua}
          passRatio={STEM_CHECK_PASS_RATIO}
          // Giữ hành vi S11: "Làm lại" chỉ dọn màn kết quả, KHÔNG xoá nháp; lượt nộp sau
          // sinh attemptId mới (§2.4 — không gắn "Gửi lại" vào đây).
          onRetry={() => setLuotNop(null)}
          {...(nextHref ? { nextHref } : {})}
        />
      ) : (
        <div className="mt-2">
          <p className="text-content-secondary">Chưa có kết quả lượt nộp trong lần mở bài này.</p>
          <a
            href={`#${NEO_TRONG_BAI.tuKiem}`}
            onClick={(e) => {
              if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
              e.preventDefault()
              onNhay(NEO_TRONG_BAI.tuKiem)
            }}
            className="tap-44 inline-flex items-center font-medium text-content underline underline-offset-4"
          >
            Về phần Tự kiểm tra để làm và nộp bài
          </a>
        </div>
      )}
    </>
  )
}

/** Mã bài từ đoạn cuối pathname — biết "đang ở bài nào" mà không cần chờ bài nạp xong. */
function maBaiTuPathname(pathname: string): string {
  return maBaiTuUrl(pathname.split('/').filter(Boolean).pop())
}

export default function StemLessonView() {
  const location = useLocation()
  const { hash } = location
  const navigate = useNavigate()

  // [S11b] Cờ "tự thử lại câu N" từ Sổ lỗi: chụp MỘT lần lúc mở trang, rồi xoá khỏi history
  // (replace, giữ nguyên pathname/query/hash) để tải lại trang không bật lại chế độ tự thử.
  // Gắn với ĐÚNG bài lúc mở: chuyển sang bài khác trong mục lục thì cờ không được đi theo.
  const [tuThuLai] = useState(() => ({
    maBai: maBaiTuPathname(location.pathname),
    cau: docCauTuThuLai(location.state),
  }))
  useEffect(() => {
    if (docCauTuThuLai(location.state) === null) return
    navigate(
      { pathname: location.pathname, search: location.search, hash: location.hash },
      { replace: true, state: boCoTuThuLai(location.state) },
    )
  }, [location.state, location.pathname, location.search, location.hash, navigate])
  const articleRef = useRef<HTMLElement>(null)
  const { subjectId, lessonSlug } = useParams<{ subjectId: string; lessonSlug: string }>()
  const subject = getStemSubject(subjectId)
  const lessonId = maBaiTuUrl(lessonSlug)
  const tuThuLaiCau = tuThuLai.cau !== null && tuThuLai.maBai === lessonId ? tuThuLai.cau : null

  // Giữ CẢ mã bài trong state, rồi suy ra trạng thái tải bằng cách so với mã bài đang xem.
  // Nhờ vậy không phải gọi setState đồng bộ ngay đầu effect khi chuyển bài (ESLint chặn, và
  // đó cũng là một lượt render thừa) — chuyển bài là kết quả cũ tự khác mã, tức đang tải.
  const [ketQua, setKetQua] = useState<{
    id: string
    bai: StemLessonLike | null
    loi: boolean
  } | null>(null)

  const tomTat = useMemo(() => subject?.loader.getSummary(lessonId), [subject, lessonId])
  usePageTitle(tomTat?.title ?? 'Bài học')

  useEffect(() => {
    if (!subject || !lessonId) return
    let huy = false
    subject.loader
      .loadLesson(lessonId)
      .then((l) => {
        if (!huy) setKetQua({ id: lessonId, bai: l ?? null, loi: false })
      })
      .catch(() => {
        if (!huy) setKetQua({ id: lessonId, bai: null, loi: true })
      })
    return () => {
      huy = true
    }
  }, [subject, lessonId])

  const daTaiXong = ketQua?.id === lessonId
  const bai = daTaiXong ? ketQua.bai : null
  const trangThai = !daTaiXong ? 'dang-tai' : ketQua.loi ? 'loi' : 'xong'

  // [S09b] Hình dạng bài → section nào tồn tại. Cùng MỘT nguồn cho danh sách "Trong bài" và bộ
  // giải hash, nên link trong danh sách không bao giờ trỏ vào section không được vẽ.
  const cauTruc = useMemo<CauTrucBai | null>(
    () =>
      bai
        ? {
            soCau: bai.checkQuestions.length,
            coHoatAnh: Boolean(bai.animation),
            coTheOn: bai.srsCards.length > 0,
          }
        : null,
    [bai],
  )
  const dsMuc = useMemo(() => (cauTruc ? mucTrongBai(cauTruc) : []), [cauTruc])

  // Bấm lại CÙNG đích thì hash không đổi → không có gì để effect bên dưới phản ứng. Bộ đếm này
  // là tín hiệu "focus lại đích hiện tại" mà KHÔNG thêm history entry.
  const [lanNhay, setLanNhay] = useState(0)
  // Hash đã xử lý lần trước, theo bài: phân biệt "mở bài không hash" (giữ nguyên hành vi cũ) với
  // "Back về entry đầu bài" (trả focus về đầu bài).
  const hashTruoc = useRef<{ baiId: string; hash: string } | null>(null)

  // Hash ĐANG CHỜ router render (đã push nhưng location chưa kịp đổi). KHÔNG so với
  // `location.hash` trong closure: router cập nhật location ở một lượt render SAU, có khi còn
  // commit từng bước (hash cũ rồi mới hash mới), nên bấm nhanh liên tiếp sẽ so với hash CŨ và
  // đẩy entry trùng — đo được thật ở E2E 1440px (history.length 4 → 5, 1/6 lượt chạy).
  // Chỉ xoá "đang chờ" khi location tới ĐÚNG hash đó, hoặc khi người dùng Back/Forward (POP).
  const hashDangCho = useRef<string | null>(null)
  const kieuDieuHuong = useNavigationType()
  useEffect(() => {
    if (hashDangCho.current === hash || kieuDieuHuong === 'POP') hashDangCho.current = null
  }, [hash, kieuDieuHuong])

  /** Chọn một mục: chỉ đổi hash (giữ pathname + query + state), không đụng nháp. */
  const nhay = useCallback(
    (id: string) => {
      const hashMoi = `#${id}`
      if ((hashDangCho.current ?? location.hash) === hashMoi) {
        setLanNhay((n) => n + 1)
        return
      }
      hashDangCho.current = hashMoi
      navigate(
        { pathname: location.pathname, search: location.search, hash: hashMoi },
        { state: location.state as unknown },
      )
    },
    [location.hash, location.pathname, location.search, location.state, navigate],
  )

  // Sổ lỗi xuất #cau-N; mục Trong bài xuất #ly-thuyet… Đợi bài nạp lười dựng xong đích (`bai`
  // chỉ khác null khi ĐÚNG bài đang xem đã tải) rồi mới focus/cuộn — callback của bài cũ không
  // thể focus bài mới vì effect chạy lại theo `bai` mới và chỉ tìm trong `<article>` hiện tại.
  // Chỉ đọc DOM: đổi hash không reset nháp, không chấm lại, không sinh lượt nộp.
  useEffect(() => {
    const article = articleRef.current
    if (!bai || !cauTruc || !article) return
    const truoc = hashTruoc.current
    hashTruoc.current = { baiId: bai.id, hash }

    const dich = giaiNeoTrongBai(hash, cauTruc)
    let target: HTMLElement | null = null
    if (dich.loai === 'khong') {
      // Mở bài bình thường (không hash) → giữ hành vi cũ, không cướp focus. Chỉ khi QUAY LẠI
      // entry không hash trong cùng bài (Back) mới đưa focus về đầu bài.
      const quayLaiDauBai = truoc?.baiId === bai.id && truoc.hash !== ''
      if (!quayLaiDauBai) return
    } else if (dich.loai === 'dich') {
      // `getElementById` với id đã qua danh sách trắng — không bao giờ dựng CSS selector từ URL.
      const el = document.getElementById(dich.id)
      target = el && article.contains(el) ? el : null
    }
    target ??= article.querySelector('h1')
    target?.focus({ preventScroll: true })
    // `instant` cả khi không bật giảm chuyển động: cuộn mượt làm focus và vị trí lệch nhau trong
    // lúc chạy, và người bật prefers-reduced-motion không bao giờ gặp chuyển động (AC08).
    target?.scrollIntoView({ block: 'start', behavior: 'instant' })
  }, [bai, cauTruc, hash, lanNhay])

  // Mục lục môn (S07-2). Dựng từ CHỈ MỤC (`tomTat`), không chờ nội dung bài tải xong — nhờ
  // vậy cột trái có ngay từ khung hình đầu và không gây nhảy layout khi bài về.
  const isDesktop = useIsDesktopViewport()
  // [S11-3] Lớp tiến độ: đọc `completion_state` MỘT LẦN khi mở, và lại sau mỗi lượt nộp
  // thành công (`reload` truyền xuống `TuKiemTra`). Không polling — mở bài không bao giờ ghi.
  const tienDo = useStemCompletionState(subject?.id)
  const outline =
    subject && tomTat ? buildStemOutlineForApp(subject, tomTat.grade, tienDo) : undefined
  const { rail, trigger, sheet } = useOutlinePane({
    outline,
    activeContentId: lessonId,
    title: 'Mục lục môn học',
    storageKey: `${subject?.id ?? 'stem'}:${tomTat?.grade ?? '?'}`,
    isDesktop,
    ...(tienDo.stateStatus === 'error' ? { footer: <LoiTienDo onRetry={tienDo.reload} /> } : {}),
  })
  // Bài kế tiếp theo ĐÚNG cây đang mở — cùng nguồn với hai nút "Bài trước / Bài sau" bên dưới.
  const baiSau = outline ? prevNext(outline, lessonId).next?.href : undefined

  if (!subject) return <Navigate to="/goc-hoc-tap" replace />

  const duongDanVe = duongDanDanhSachBai(subject.id)
  const nhanDanhSach = `Bài học môn ${subject.label}`

  return (
    <>
      {/* `focus`: trang ngồi học lâu → ẩn bộ chuyển Studio + huy hiệu streak (xem Layout).
          [2026-10-01, audit đồng nhất bố cục] `crumbs` cho nút Back ở header đúng nhãn + đúng
          đích "← Bài học môn …" (trước đây không truyền gì: nhãn "← Góc học tập" mà bấm lại về
          Trang chủ). Đốt cuối là tên bài — KHÔNG truyền `title` vì tên bài đã là <h1> bên dưới,
          header không nhắc lại (cùng quy ước bài hội thoại tiếng Anh, S09c). */}
      <Layout
        focus
        crumbs={[
          { label: nhanDanhSach, to: duongDanVe },
          { label: tomTat?.title ?? 'Bài học', to: '' },
        ]}
      />
      <PageShell width={isDesktop && rail ? 'standard' : 'reading'}>
        <TwoPane isDesktop={isDesktop} railSide="left" railLabel="Mục lục môn học" rail={rail}>
          {/* Liên kết về danh sách CHỈ ở mobile: ở đó nút Back của header chỉ còn mũi tên (nhãn
              ẩn dưới 640px). Từ 1024px header đã ghi đúng chữ này — vẽ thêm một bản trong nội
              dung là hai lối lùi trùng nhau đứng cách nhau 40px. */}
          {(!isDesktop || trigger) && (
            <div className="flex flex-wrap items-center gap-3">
              {!isDesktop && (
                <Link
                  to={duongDanVe}
                  className="inline-flex min-h-[44px] items-center gap-2 text-content-secondary"
                >
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  {nhanDanhSach}
                </Link>
              )}
              {trigger}
            </div>
          )}

          {trangThai === 'dang-tai' && <p className="mt-6 text-content-secondary">Đang tải bài…</p>}

          {trangThai === 'loi' && (
            <p className="mt-6 text-content">
              Không tải được nội dung bài. Kiểm tra kết nối mạng rồi tải lại trang.
            </p>
          )}

          {trangThai === 'xong' && !bai && (
            <p className="mt-6 text-content">
              Không tìm thấy bài học này. Có thể liên kết đã cũ —{' '}
              <Link to={duongDanVe} className="underline">
                xem danh sách bài
              </Link>
              .
            </p>
          )}

          {bai && (
            // `read-measure` (index.css): bó CẢ cột bài học vào khoảng đọc, thay vì rắc lên
            // từng thẻ `<p>`. Đo bằng cổng AC-3 trước khi sửa (2026-09-16): 92 ký tự/dòng ở
            // 768px và 97 ở 1440px — gần gấp rưỡi khoảng 60–75 mà spec nền chốt.
            <article ref={articleRef} className="mt-4 read-measure">
              <p className="text-content-muted">
                {bai.track === 'advanced'
                  ? `Chuyên đề bồi dưỡng học sinh giỏi · ${nhanCapHsg(bai.advancedTier)}`
                  : `Lớp ${bai.grade} · Chương ${bai.chapterNumber}: ${bai.chapterTitle}`}
              </p>
              {/* `tabIndex={-1}`: không thêm điểm dừng Tab, nhưng cho phép đưa tiêu điểm tới
                bằng mã lệnh — panel mục lục mobile đóng xong sẽ focus đúng vào đây. */}
              <h1
                id={NEO_TRONG_BAI.dauBai}
                tabIndex={-1}
                className="mt-1 scroll-mt-24 text-2xl sm:text-3xl font-extrabold text-content"
              >
                {bai.title}
              </h1>

              {/* [S09b] Các PHẦN của bài đang mở — khác "Mục lục môn học" (cây các bài). */}
              <TrongBaiNav muc={dsMuc} thuGon={!isDesktop} onChon={nhay} />

              {bai.reviewStatus === 'draft' && <ChuaDuyetChuyenMon />}

              <p className="mt-4 text-content-secondary">{bai.hook}</p>

              <h2
                id={NEO_TRONG_BAI.lyThuyet}
                tabIndex={-1}
                className="mt-8 scroll-mt-24 text-xl font-bold text-content"
              >
                Lý thuyết
              </h2>
              {/* [2026-10-01] Dòng "TIÊU ĐỀ:" thành <h3> thật + chỉ số dưới — xem lib/stemTheory.ts. */}
              <StemTheory text={bai.theory} />

              {bai.animation && (
                <>
                  <h2
                    id={NEO_TRONG_BAI.hoatAnh}
                    tabIndex={-1}
                    className="mt-8 scroll-mt-24 text-xl font-bold text-content"
                  >
                    Hoạt ảnh minh hoạ
                  </h2>
                  <LessonAnimation spec={bai.animation} className="mt-2" />
                </>
              )}

              <h2
                id={NEO_TRONG_BAI.viDu}
                tabIndex={-1}
                className="mt-8 scroll-mt-24 text-xl font-bold text-content"
              >
                Ví dụ mẫu
              </h2>
              <p className="mt-2 text-content">{bai.workedExample.problem}</p>
              <ol className="mt-3 list-decimal space-y-2 pl-6 text-content">
                {bai.workedExample.steps.map((buoc, i) => (
                  <li key={i}>{buoc}</li>
                ))}
              </ol>
              <p className="mt-3 font-medium text-content">Đáp số: {bai.workedExample.answer}</p>

              <TuKiemTra
                key={bai.id}
                bai={bai}
                subjectId={subject.id}
                onSubmitted={tienDo.reload}
                onNhay={nhay}
                tuThuLaiCau={tuThuLaiCau}
                {...(baiSau ? { nextHref: baiSau } : {})}
              />

              {bai.srsCards.length > 0 && (
                <>
                  <h2
                    id={NEO_TRONG_BAI.theOn}
                    tabIndex={-1}
                    className="mt-8 scroll-mt-24 text-xl font-bold text-content"
                  >
                    Thẻ ôn tập
                  </h2>
                  <dl className="mt-3 space-y-3">
                    {bai.srsCards.map((the, i) => (
                      <div
                        key={i}
                        className="rounded-xl border border-line-subtle bg-surface-card p-4"
                      >
                        <dt className="font-medium text-content">{the.hoi}</dt>
                        <dd className="mt-1 text-content-secondary">{the.dap}</dd>
                      </div>
                    ))}
                  </dl>
                </>
              )}

              <LuotDuyetBai lessonId={bai.id} mon={subject.id} />

              {/* Bài trước / bài sau theo đúng cây đang mở (AC-14). */}
              <OutlinePrevNext outline={outline} contentId={lessonId} />
            </article>
          )}
        </TwoPane>
      </PageShell>
      {sheet}
    </>
  )
}
