// ──────────────────────────────────────────────────────────────────────
// TRANG RIÊNG CỦA 1 CẤP CEFR — /learning-path/a1 · a2 · b1 · b2
//
// Mỗi cấp là 1 trang (URL riêng, share/back được). Bố cục:
//   1. Thẻ tổng quan: mục tiêu, số liệu, 2 thanh tiến độ (từ vựng + ngữ pháp),
//      mục tiêu "can-do" thu gọn được.
//   2. Thẻ "Học tiếp": chỉ đúng mục kế tiếp chưa xong (vòng từ vựng / bài ngữ pháp).
//   3. Danh sách unit đánh số "Phần 1..n", trong mỗi unit học theo trình tự:
//      ① Từ vựng → ② Ngữ pháp → ③ Hội thoại.
//   Mục nào đã hoàn thành 100% thì ẨN đi (gom vào nút "Đã hoàn thành n mục —
//   Xem lại"); unit xong hết thì thu gọn thành 1 dòng.
//
// THANH TAB TRÊN ĐẦU (chuyển từ trang /learning-path vào từng cấp):
//   Bài học · Hôm nay · Ôn SRS · Từ khó · Kiểm tra · Nghe — 5 tab học lấy dữ liệu
//   THEO TỪ VỰNG CỦA CẤP (components/StudyTabs.tsx); cấp cuối (B2) học tiếp
//   cả phần ngoài lộ trình CEFR. Tab "Nghe" (③ N3, thêm 2026-07-16) dùng thêm
//   hội thoại TOÀN CẤP (levelDialogues) cho dạng bài dictation. Cấp còn khóa thì
//   ẩn thanh tab.
// ──────────────────────────────────────────────────────────────────────

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { z } from 'zod'
import { useParams, useNavigate, useSearchParams, Navigate } from 'react-router-dom'
import { duongDanLoTrinh } from '../../../lib/englishRoutes'
import {
  ChevronRight,
  ChevronDown,
  BookOpen,
  Brain,
  ClipboardList,
  GraduationCap,
  Sparkles,
  Star,
  Target,
  CheckCircle2,
  Check,
  Layers,
  Lock,
  MessageCircle,
  Play,
  PartyPopper,
  X,
  Zap,
  Headphones,
} from 'lucide-react'
import Layout from '../../../components/Layout'
import { useIsDesktopViewport } from '../../../lib/useIsDesktopViewport'
import { GrammarDetail, VocabFlash, DialogueView } from '../../../components/CefrLessonViews'
import {
  TodayLesson,
  SRSReview,
  HardWords,
  QuizTab,
  ListeningTab,
  type GrammarQuizSource,
} from '../../../components/StudyTabs'
import { ACCENT, type AccentClasses } from '../../../lib/cefrAccent'
import type { CefrLevel, CefrUnit, GrammarLesson } from '../../../data/cefr'
import type { Circle } from '../../../data/curriculum'
import type { Dialogue } from '../../../data/dialogues'
import { loadCefr } from '../../../data/cefrLoader'
import { loadFoundation } from '../../../data/curriculumLoader'
import { getDialogues } from '../../../data/dialoguesLoader'
import { useAuth } from '../../../context/useAuth'
import { getDirection } from '../../../lib/storage'
import { getLearnedWords, getDifficultWords } from '../../../lib/vocab'
import { getDueWords, getDueGrammarLessonIds, getLeechWords } from '../../../lib/srs'
import {
  loadCurriculum,
  isCurriculumReady,
  getLevelWords,
  getBeyondCefrWords,
  getLearningPath,
} from '../../../lib/curriculum'
import { preloadLearnData } from '../../../lib/preloader'
import { useAsyncLoad } from '../../../lib/useAsyncLoad'
import LoadError from '../../../components/LoadError'
import DialogueLoadError from '../../../components/DialogueLoadError'
import { thongDiepLoiThanThien } from '../../../lib/friendlyError'
import {
  LOI_HOI_THOAI_VI,
  LOI_HOI_THOAI_EN,
  LOI_TU_VUNG_VI,
  LOI_TU_VUNG_EN,
  GOI_Y_TU_VUNG_VI,
  GOI_Y_TU_VUNG_EN,
} from '../../../lib/curriculumMessages'
import {
  getDoneGrammar,
  getViewedDialogues,
  markDialogueViewed,
  dialogueKey,
  circleDoneCount,
  levelVocabCounts,
  levelGrammarCounts,
  computeLockedMapFromServer,
  computeLockedMap,
  findNextStep,
  isExamEligible,
  UNLOCK_PCT,
} from '../../../lib/cefrProgress'
import { getExamMap } from '../../../lib/cefrExam'
import CefrExam from '../../../components/CefrExam'
import { useOnboarding } from '../../../lib/onboarding'
import { docCapTuQueryTuyChon } from '../../../lib/reviewRoutes'
import { useOutlinePane } from '../../../components/useOutlinePane'
import {
  buildCefrOutline,
  docHoatDongTuQuery,
  duongDanHoatDongCefr,
  nodeIdHoatDong,
  type CefrActivityRef,
} from '../../../lib/outline/cefrOutline'
import { useLearningSession } from '../../../lib/useLearningSession'
import { PageShell } from '@core/PageShell'
import { TwoPane } from '@core/TwoPane'
import { countBadgeClass, badgeCount } from '@core/badgeStyles'
import { usePageTitle } from '../../../lib/usePageTitle'
import MixedLangText from '../../../components/MixedLangText'

// % an toàn (0 khi total = 0, không chia cho 0).
const pct = (done: number, total: number) => (total > 0 ? Math.round((done / total) * 100) : 0)

// Tab trên trang cấp: 'lessons' = danh sách bài; 5 tab còn lại là tab học theo cấp
// ('listening' = luyện nghe, ③ N3 — thêm 2026-07-16).
const STUDY_TABS = ['lessons', 'today', 'srs', 'hard', 'quiz', 'listening'] as const
type StudyTab = (typeof STUDY_TABS)[number]

// ── Phiên học của TRANG CẤP (khung phiên S08, lib/learningSession.ts) ──────────────────
// Nháp ở đây KHÔNG phải nội dung bài: chỉ là VỊ TRÍ đang học (tab nào, đang mở hoạt động nào)
// để reload/đóng tab xong quay lại đúng chỗ. Không chạm tiến độ, không gọi API.
const MON = 'english'
// Mảng rỗng DÙNG CHUNG (tham chiếu ổn định) khi hội thoại chưa tải xong / tải lỗi.
const NO_DIALOGUES: Dialogue[] = []
// Nội dung của trang không "hết hạn" theo cách nháp code hết hạn: thứ khôi phục là MÃ hoạt
// động, và mã nào không còn trong dữ liệu cấp thì bị bỏ qua (xem `coHoatDong`). Vì vậy phiên
// bản nội dung ở đây là hằng — đổi nó chỉ khi khuôn nháp bên dưới đổi.
const PHIEN_BAN_NHAP_CAP = 'cefr-level-v1'

const nhapCapSchema = z.object({
  tab: z.enum(STUDY_TABS),
  /** Hoạt động đang mở (từ vựng/ngữ pháp/hội thoại) — `null` là đang ở màn danh sách. */
  hd: z
    .object({
      unitId: z.string().min(1),
      kind: z.enum(['vocab', 'grammar', 'dialogue']),
      contentId: z.string().min(1),
    })
    .nullable(),
})
type NhapCap = z.infer<typeof nhapCapSchema>

const NHAN_TAB: Record<StudyTab, string> = {
  lessons: 'Bài học',
  today: 'Hôm nay',
  srs: 'Ôn lại',
  hard: 'Từ khó',
  quiz: 'Kiểm tra',
  listening: 'Nghe',
}

/** Khoá so sánh một hoạt động (dùng cho dependency của effect — chuỗi, không phải object). */
const khoaHoatDong = (hd: CefrActivityRef | null): string =>
  hd ? `${hd.unitId}|${hd.kind}|${hd.contentId}` : ''

/**
 * Mã trong nháp còn tồn tại trong dữ liệu cấp không. Bài bị gỡ/đổi mã thì KHÔNG mở lại — thà
 * hiện màn danh sách còn hơn đưa người học tới một màn con rỗng.
 */
function coHoatDong(level: CefrLevel, hd: CefrActivityRef): boolean {
  const unit = level.units.find((u) => u.id === hd.unitId)
  if (!unit) return false
  if (hd.kind === 'grammar') return unit.grammar.some((g) => g.id === hd.contentId)
  if (hd.kind === 'vocab') return unit.vocabCircleIds.includes(hd.contentId)
  // Hội thoại: MỘT hoạt động cho cả unit (cefrOutline.ts), mã nội dung chính là mã unit.
  return hd.contentId === unit.id
}

// Tên mục lục — cũng là nhãn nút mở panel trên mobile (S07-3 AC-20).
const TEN_MUC_LUC = 'Mục lục cấp học'

export default function CefrLevelPage() {
  const { levelId } = useParams<{ levelId: string }>()
  const nav = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { user, loading: dangTaiDanhTinh, isGuest } = useAuth()
  const isA = getDirection() === 'A'
  // Master–detail ở desktop (≥1024px): khi mở 1 màn con, hiện thêm cột trái là danh sách
  // MỤC LỤC CÂY của cấp (xem `mucLuc`/`shell`) — bấm mục khác đổi luôn cột phải, không cần
  // rời trang rồi mở lại. Dưới ngưỡng này: nút "Mục lục cấp học" + panel (S07-3).
  const isDesktop = useIsDesktopViewport()

  const [levels, setLevels] = useState<CefrLevel[]>([])
  const [circleById, setCircleById] = useState<Record<string, Circle>>({})
  const [ready, setReady] = useState(false)

  // Tab đang mở — cho phép mở thẳng qua URL `?tab=` (vd link "Học tiếp" ở Home),
  // mặc định danh sách bài của cấp nếu không có/param không hợp lệ.
  //
  // URL THẮNG NHÁP (AC-18 của đặc tả S08): còn `?tab=` trên URL thì tab đó thắng, để link
  // "Học tiếp" ở Trang chủ và `?tab=&cap=` của `comeback.ts` không bị nháp cũ đè lên.
  const tabTuUrl = useMemo<StudyTab | null>(() => {
    const t = searchParams.get('tab')
    return (STUDY_TABS as readonly string[]).includes(t ?? '') ? (t as StudyTab) : null
  }, [searchParams])

  // Owner `null` khi AuthProvider chưa xong → hook ở trạng thái `loading`, tuyệt đối không ghi.
  const owner = useMemo(
    () =>
      dangTaiDanhTinh || !user
        ? null
        : { kind: isGuest ? ('guest' as const) : ('account' as const), id: user.id },
    [dangTaiDanhTinh, user, isGuest],
  )
  const maCap = (levelId ?? '').toUpperCase()
  const nhapBanDau = useCallback(
    () => ({
      stepIndex: tabTuUrl ? STUDY_TABS.indexOf(tabTuUrl) : 0,
      draft: { tab: tabTuUrl ?? 'lessons', hd: null } as NhapCap,
    }),
    [tabTuUrl],
  )
  const nhanBuoc = useCallback((i: number) => NHAN_TAB[STUDY_TABS[i] ?? 'lessons'], [])
  const phien = useLearningSession<NhapCap>({
    owner,
    subjectId: MON,
    // Phiên gắn với CẤP, không phải với một bài — thứ nó nhớ là vị trí trong trang cấp.
    contentId: `cefr-level:${maCap || 'none'}`,
    contentVersion: PHIEN_BAN_NHAP_CAP,
    draftSchema: nhapCapSchema,
    initial: nhapBanDau,
    stepLabel: nhanBuoc,
  })
  const { setDraft: datNhapPhien, setStep: datBuocPhien } = phien
  const tab: StudyTab = tabTuUrl ?? phien.draft.tab
  const setTab = useCallback(
    (k: StudyTab) => {
      datNhapPhien((d) => ({ ...d, tab: k }))
      datBuocPhien(STUDY_TABS.indexOf(k))
      // Người học tự bấm tab → bỏ chỉ định `?tab=` trên URL, nếu không mọi cú bấm sau đều bị
      // tham số cũ đè lên (URL chỉ thắng lúc MỞ trang). Giữ nguyên `?cap=`: hành vi giới hạn
      // phiên không đổi so với trước.
      if (searchParams.has('tab')) {
        const sau = new URLSearchParams(searchParams)
        sau.delete('tab')
        setSearchParams(sau, { replace: true })
      }
    },
    [datNhapPhien, datBuocPhien, searchParams, setSearchParams],
  )
  // Giới hạn phiên RIÊNG cho tab đang mở qua URL `?cap=` — dùng cho luồng "quay
  // lại sau khi bỏ bẵng" (② M4, lib/comeback.ts): Home trỏ tới `?tab=today&cap=3`
  // hoặc `?tab=srs&cap=5` để phiên đầu nhẹ nhàng hơn, không đổi tốc độ đã lưu.
  // Đọc qua hàm DÙNG CHUNG (lib/reviewQueue.ts) để hub ôn tập và trang cấp không có hai cách
  // hiểu khác nhau về cùng một tham số URL. Hành vi của trang này KHÔNG đổi: thiếu `?cap=`
  // nghĩa là "theo tốc độ đã lưu", không phải cap mặc định.
  const sessionCap = useMemo(() => docCapTuQueryTuyChon(searchParams), [searchParams])
  // Các tab học cần TOÀN BỘ từ điển (nạp động, nặng hơn cefr+foundation) —
  // gate riêng để tab "Bài học" vẫn hiện ngay không phải chờ.
  // [changelog 0525] Bản cũ `loadCurriculum().then(() => setDictReady(true))` không có nhánh lỗi:
  // tải từ điển hỏng là 4 tab học (Hôm nay/Ôn/Từ khó/Quiz) kẹt "Đang tải từ vựng…" vĩnh viễn.
  const { state: curriculumState, retry: retryCurriculum } = useAsyncLoad(loadCurriculum, {
    lang: isA ? 'vi' : 'en',
    errorMessage: isA ? LOI_TU_VUNG_VI : LOI_TU_VUNG_EN,
  })
  const dictReady = isCurriculumReady() || curriculumState.status === 'ready'

  // Màn con đang mở (giữ nguyên mẫu của RoadmapTab cũ: hội thoại đè lên flashcard
  // để xem xong hội thoại quay lại đúng màn flashcard).
  const [lesson, setLesson] = useState<GrammarLesson | null>(null)
  const [circle, setCircle] = useState<Circle | null>(null)
  const [dialogue, setDialogue] = useState<Dialogue | null>(null)
  // Đang làm bài thi cuối cấp (màn thi toàn màn hình đè lên trang cấp).
  const [examing, setExaming] = useState(false)

  // Khóa invalidation thủ công: bump() để tính lại tiến độ sau khi học/đánh dấu.
  const [refresh, setRefresh] = useState(0)
  const bump = () => setRefresh((k) => k + 1)

  useEffect(() => {
    Promise.all([loadCefr(), loadFoundation()]).then(([lv, foundation]) => {
      setLevels(lv)
      setCircleById(Object.fromEntries(foundation.map((c) => [c.id, c])))
      setReady(true)
    })
  }, [])

  const uid = user?.id ?? ''
  const level = levels.find((l) => l.id === (levelId ?? '').toUpperCase())
  usePageTitle(level ? `Trình độ ${level.id} | Môn tiếng Anh` : 'Lộ trình CEFR | Môn tiếng Anh')

  // Hội thoại của TOÀN CẤP (mọi unit) — dùng cho tab "Nghe" (③ N3, dictation lấy
  // câu từ hội thoại). Tải riêng theo cấp (giống CefrExam.tsx) — chỉ chạy khi có
  // `level`, không chặn các tab khác.
  // [changelog 0530] Bản cũ `Promise.all(...).then(set)` không có nhánh lỗi: tải hỏng là mất hội
  // thoại im lặng + unhandled rejection. Nay MỘT lần tải cho cả cấp (hội thoại là một file chung),
  // theo từng unit: tab Bài học đưa cho từng `UnitSection`, tab Nghe làm câu chép chính tả. Lỗi →
  // MỘT khối lỗi + Thử lại ở mỗi tab (không lặp 10+ khối, mỗi khối một nút).
  const loadLevelDialogues = useCallback(async (): Promise<Record<string, Dialogue[]>> => {
    if (!level) return {}
    const lists = await Promise.all(level.units.map((u) => getDialogues(u.id)))
    return Object.fromEntries(level.units.map((u, i) => [u.id, lists[i] ?? []]))
  }, [level])
  const { state: levelDialoguesState, retry: retryLevelDialogues } = useAsyncLoad(
    loadLevelDialogues,
    {
      lang: isA ? 'vi' : 'en',
      errorMessage: isA ? LOI_HOI_THOAI_VI : LOI_HOI_THOAI_EN,
    },
  )
  const dialoguesByUnit = levelDialoguesState.status === 'ready' ? levelDialoguesState.data : null
  const levelDialogues = useMemo(
    () => (dialoguesByUnit ? Object.values(dialoguesByUnit).flat() : NO_DIALOGUES),
    [dialoguesByUnit],
  )

  // U-3: trình độ khai lúc onboarding — nếu ≥ Trung cấp thì gợi ý test-out ở A1
  // ("Tôi đã biết vòng này" trong vòng từ vựng) thay vì học lại từng thẻ.
  const onboarding = useOnboarding(user?.id)
  const [testoutDismissed, setTestoutDismissed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(`et_a1_testout_dismissed_${uid}`) === '1'
    } catch {
      return false
    }
  })
  function dismissTestout() {
    try {
      localStorage.setItem(`et_a1_testout_dismissed_${uid}`, '1')
    } catch {
      /* localStorage bị chặn — banner vẫn ẩn trong phiên này nhờ state */
    }
    setTestoutDismissed(true)
  }

  // `refresh`/`ready` là khóa invalidation thủ công (dữ liệu đọc từ localStorage)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const learned = useMemo(() => getLearnedWords(uid), [uid, refresh, ready])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const doneGrammar = useMemo(() => getDoneGrammar(uid), [uid, refresh])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const viewedDialogues = useMemo(() => getViewedDialogues(uid), [uid, refresh])

  // Kết quả thi cuối cấp (để mở khóa + hiện điểm/huy hiệu + CTA "Thi cuối cấp").
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const examMap = useMemo(() => getExamMap(uid), [uid, refresh])
  const examPassed = useMemo(
    () => new Set(Object.keys(examMap).filter((id) => examMap[id]?.passed)),
    [examMap],
  )
  // Quyền mở cấp do SERVER cấp (GĐ2a) — client chỉ đọc danh sách server trả về.
  const lockedMap = useMemo(
    () => computeLockedMapFromServer(uid, levels, examPassed),
    [uid, levels, examPassed],
  )

  // Cấp mà người dùng FREE sẽ thấy ổ khoá — dùng để gắn nhãn "Mở tự do (VIP)" (GĐ2a §① mục 4).
  const freeRuleLockedMap = useMemo(
    () => computeLockedMap(levels, examPassed),
    [levels, examPassed],
  )

  // Số thứ tự "Bài N" liên tục trong cả cấp (ổn định dù có ẩn bài đã xong).
  const lessonNumberOf = useMemo(() => {
    const map = new Map<string, number>()
    let n = 0
    level?.units.forEach((u) => u.grammar.forEach((g) => map.set(g.id, ++n)))
    return map
  }, [level])

  // Nguồn câu quiz NGỮ PHÁP cho tab "Kiểm tra" (V8, docs/research/cai-tien-lo-trinh-hoc.md):
  // CHỈ lấy từ các bài đã đánh dấu "Đã học xong" — ngữ pháp chưa học không nên bị hỏi.
  const grammarQuizPool = useMemo((): GrammarQuizSource[] => {
    const out: GrammarQuizSource[] = []
    if (!level) return out
    for (const u of level.units) {
      for (const g of u.grammar) {
        if (doneGrammar.has(g.id) && g.quiz) {
          for (const item of g.quiz) out.push({ lessonId: g.id, item })
        }
      }
    }
    return out
  }, [level, doneGrammar])

  // Mở lại 1 bài ngữ pháp theo id (dùng khi trả lời sai câu quiz ngữ pháp ở tab Kiểm tra).
  function openLessonById(lessonId: string) {
    const g = level?.units.flatMap((u) => u.grammar).find((x) => x.id === lessonId)
    if (g) setLesson(g)
  }

  // Preload audio 20 từ "hôm nay" khi browser rảnh (chuyển từ trang /learning-path
  // sang đây vì tab "Hôm nay" giờ nằm ở trang cấp).
  useEffect(() => {
    if (!uid) return
    const run = () => {
      void preloadLearnData(uid)
    }
    if ('requestIdleCallback' in window) {
      const id = requestIdleCallback(run, { timeout: 3000 })
      return () => cancelIdleCallback(id)
    }
    const tid = setTimeout(run, 500)
    return () => clearTimeout(tid)
  }, [uid])

  // Từ vựng dùng cho 4 tab học: từ của CẤP này; cấp CUỐI (B2) cộng thêm phần
  // ngoài lộ trình CEFR để học tiếp sau khi xong cấp.
  const studyPool = useMemo(() => {
    if (!dictReady || !level) return []
    const words = getLevelWords(level.id, onboarding?.ageGroup)
    const isLast = levels[levels.length - 1]?.id === level.id
    return isLast ? [...words, ...getBeyondCefrWords(onboarding?.ageGroup)] : words
  }, [dictReady, level, levels, onboarding?.ageGroup])

  // Toàn bộ từ đã học (mọi cấp + Mở rộng) — dùng riêng cho tab Ôn SRS để KHÔNG
  // bỏ sót từ đến hạn của cấp khác (trước đây lọc theo studyPool khiến từ A1
  // đến hạn không hiện khi đang học trang B1 → quên dần).
  const allWordsPool = useMemo(
    () => (dictReady ? getLearningPath(onboarding?.ageGroup) : []),
    [dictReady, onboarding?.ageGroup],
  )

  // Badge trên tab: số từ CẦN ÔN SRS (toàn bộ lộ trình) / đã đánh dấu khó của cấp này.
  // `refresh` là khóa invalidation thủ công (dữ liệu đọc từ localStorage).
  const srsDue = useMemo(
    () => (uid ? getDueWords(uid, allWordsPool).length : 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [uid, allWordsPool, refresh],
  )
  // Khớp ĐÚNG logic tab "Từ khó" thật (StudyTabs.tsx HardWords) — hợp của 2 tập: từ đánh
  // dấu ⭐ thủ công VÀ leech tự động (≥3 lần "Quên"). Trước đây badge chỉ đếm ⭐ nên hiện
  // "0" trong khi tab có hàng chục từ leech — đúng nhóm cần chú ý nhất lại bị badge giấu
  // đi (audit toàn diện 2026-08-23).
  const hardCount = useMemo(() => {
    if (!uid) return 0
    const hard = getDifficultWords(uid)
    const leechKeys = new Set(getLeechWords(uid, studyPool).map((w) => w.word.toLowerCase()))
    return studyPool.filter(
      (w) => hard.has(w.word.toLowerCase()) || leechKeys.has(w.word.toLowerCase()),
    ).length
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, studyPool, refresh])

  // Badge trên tab "Kiểm tra": số bài NGỮ PHÁP đến hạn ôn (đề xuất E — spacing áp cho cả
  // ngữ pháp, không riêng từ vựng, xem lib/srs.ts getDueGrammarLessonIds).
  const grammarDue = useMemo(() => {
    if (!uid) return 0
    const ids = [...new Set(grammarQuizPool.map((g) => g.lessonId))]
    return getDueGrammarLessonIds(uid, ids).length
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, grammarQuizPool, refresh])

  // ── Mục lục CÂY của cấp (S07-3, AC-20) ────────────────────────────────
  // Thay danh sách unit rút gọn ở cột trái bằng cây `Outline` dùng chung ba môn: cùng một cách
  // hiển thị trạng thái (đã xong ✓ · đang học dở ◐ · chưa học ○ · khoá 🔒), cùng ô tìm không
  // dấu, và trên MOBILE có panel — trước đây mở một màn con trên điện thoại là mất hẳn lối
  // nhảy sang mục khác, phải bấm "Quay lại" rồi cuộn tìm.
  const circleMap = useMemo(() => new Map(Object.entries(circleById)), [circleById])
  const chiSoCap = level ? levels.findIndex((l) => l.id === level.id) : -1
  const maCapTruoc = chiSoCap > 0 ? levels[chiSoCap - 1]?.id : undefined
  const outline = useMemo(
    () =>
      level
        ? buildCefrOutline(level, {
            learned,
            doneGrammar,
            viewedDialogues,
            circles: circleMap,
            lockedMap,
            ...(maCapTruoc ? { prevLevelId: maCapTruoc } : {}),
          })
        : undefined,
    [level, learned, doneGrammar, viewedDialogues, circleMap, lockedMap, maCapTruoc],
  )

  // Hoạt động được chỉ đích danh trên URL (`?unit=…&hd=…`) — đây là thứ mục lục liên kết tới.
  const hoatDongUrl = useMemo(() => docHoatDongTuQuery(searchParams), [searchParams])

  // Lá "đang mở" của mục lục. Ưu tiên URL; nếu màn con được mở bằng cách bấm trong danh sách
  // chính (hoặc thẻ "Học tiếp") thì URL không đổi, nên suy từ state để mục lục vẫn mở đúng
  // phần đang học — không thì cây luôn bung phần 1 dù người học đang ở phần 12.
  const maNutDangMo = useMemo(() => {
    if (hoatDongUrl) return nodeIdHoatDong(hoatDongUrl)
    const maNoiDung = circle?.id ?? lesson?.id
    if (!outline || maNoiDung === undefined) return undefined
    return outline.nodes.find((n) => n.kind === 'activity' && n.contentId === maNoiDung)?.nodeId
  }, [hoatDongUrl, outline, circle, lesson])

  const { rail, trigger, sheet } = useOutlinePane({
    outline,
    ...(maNutDangMo ? { activeNodeId: maNutDangMo } : {}),
    title: TEN_MUC_LUC,
    // Khoá lưu RIÊNG từng cấp: mở "Phần 3" ở A1 không được kéo theo B1.
    storageKey: `cefr:${level?.id ?? 'none'}`,
    isDesktop,
  })

  // URL mở màn con: ba hoạt động của một unit là màn CON của trang này (không phải route
  // riêng), nên mục lục trỏ tới `?unit=&hd=` và trang tự mở đúng màn. Nhờ vậy Back/Forward và
  // tải lại trang đều đúng, và một liên kết mục lục là liên kết THẬT (mở tab mới được).
  //
  // Đồng bộ NGAY TRONG LÚC RENDER (không phải trong `useEffect`): đây là "điều chỉnh state khi
  // đầu vào đổi" — React khuyến nghị làm ở render để không vẽ một lượt bằng dữ liệu cũ rồi mới
  // sửa. Cùng khuôn với `useOutlinePane`. Hội thoại phải nạp bất đồng bộ nên nằm ở effect dưới.
  //
  // Khoá so sánh gồm CẢ cấp và unit, không riêng `hd`: cùng một vòng từ vựng có thể nằm ở hai
  // unit (cấp B2 có vòng `it` ở hai phần), và lúc render đầu tiên `level` chưa tải xong nên
  // phải đồng bộ lại một lần nữa khi dữ liệu về.
  const khoaManCon = `${level?.id ?? ''}|${searchParams.get('unit') ?? ''}|${hoatDongUrl ? `${hoatDongUrl.kind}:${hoatDongUrl.contentId}` : ''}`
  const [khoaDaXuLy, setKhoaDaXuLy] = useState<string | null>(null)
  if (khoaDaXuLy !== khoaManCon) {
    setKhoaDaXuLy(khoaManCon)
    const unit = level?.units.find((u) => u.id === hoatDongUrl?.unitId)
    // Đang mở một màn con mà chọn màn khác trong mục lục thì màn cũ phải nhường chỗ: thứ tự
    // ưu tiên khi vẽ là hội thoại → từ vựng → ngữ pháp, nên chỉ đặt cái mới là chưa đủ.
    const vong = hoatDongUrl?.kind === 'vocab' ? (circleById[hoatDongUrl.contentId] ?? null) : null
    const bai =
      hoatDongUrl?.kind === 'grammar'
        ? (unit?.grammar.find((g) => g.id === hoatDongUrl.contentId) ?? null)
        : null
    setCircle(vong)
    setLesson(bai)
    setDialogue(null)
  }

  // Hội thoại: danh sách nạp bất đồng bộ; mở bài đầu của unit (cây chỉ có MỘT nút hội thoại
  // cho cả unit — xem `cefrOutline.ts`).
  // [changelog 0530] Bản cũ `void getDialogues().then(...)` không có nhánh lỗi: mở hội thoại từ
  // mục lục mà tải hỏng thì không có gì xảy ra + unhandled rejection. Nay lưu lỗi theo KHOÁ màn
  // con (`khoaManCon`) — đổi màn thì lỗi cũ tự hết hiệu lực — và hiện khối lỗi + Thử lại.
  const [loiHoiThoaiUrl, setLoiHoiThoaiUrl] = useState<{ khoa: string; message: string } | null>(
    null,
  )
  const [lanThuHoiThoaiUrl, setLanThuHoiThoaiUrl] = useState(0)
  // Một nút Thử lại cho mọi khối lỗi hội thoại của trang: tải lại hội thoại cả cấp VÀ mở lại bài
  // đang trỏ trên URL (nếu có).
  const thuLaiHoiThoai = () => {
    retryLevelDialogues()
    setLoiHoiThoaiUrl(null)
    setLanThuHoiThoaiUrl((n) => n + 1)
  }
  useEffect(() => {
    if (!level || hoatDongUrl?.kind !== 'dialogue') return
    const unit = level.units.find((u) => u.id === hoatDongUrl.unitId)
    if (!unit) return // unit lạ → bỏ qua, trang hiện như bình thường
    let conHieuLuc = true
    getDialogues(unit.id).then(
      (ds) => {
        const d = ds[0]
        if (!conHieuLuc || !d) return
        if (uid) markDialogueViewed(uid, unit.id, d.titleEn)
        setLoiHoiThoaiUrl(null)
        setRefresh((k) => k + 1)
        setDialogue(d)
      },
      (err: unknown) => {
        if (!conHieuLuc) return
        setLoiHoiThoaiUrl({
          khoa: khoaManCon,
          message: thongDiepLoiThanThien(
            err,
            isA ? LOI_HOI_THOAI_VI : LOI_HOI_THOAI_EN,
            isA ? 'vi' : 'en',
          ),
        })
      },
    )
    return () => {
      conHieuLuc = false
    }
  }, [level, hoatDongUrl, uid, lanThuHoiThoaiUrl, khoaManCon, isA])

  // Đóng màn con: xoá luôn `?unit=&hd=` khỏi URL, nếu không lần render sau lại mở đúng màn vừa
  // đóng (URL là nguồn sự thật). `replace` để nút Back không phải bấm hai lần.
  const xoaNguCanhHoatDong = useCallback(() => {
    if (!searchParams.has('unit') && !searchParams.has('hd')) return
    const sau = new URLSearchParams(searchParams)
    sau.delete('unit')
    sau.delete('hd')
    setSearchParams(sau, { replace: true })
  }, [searchParams, setSearchParams])

  // ── Khôi phục vị trí đang học (AC-18) ─────────────────────────────────
  // Hoạt động đang mở, suy từ URL trước (nguồn sự thật), rồi mới tới state màn con khi người
  // học bấm thẳng trong danh sách (đường đó không ghi URL). Hội thoại ĐÈ LÊN màn từ vựng nên
  // cố tình không ghi vào nháp: mở lại trang thì về đúng vòng từ vựng bên dưới.
  const hdHienTai = useMemo<CefrActivityRef | null>(() => {
    if (hoatDongUrl) return hoatDongUrl
    if (!level) return null
    if (lesson) {
      const u = level.units.find((x) => x.grammar.some((g) => g.id === lesson.id))
      return u ? { unitId: u.id, kind: 'grammar', contentId: lesson.id } : null
    }
    if (circle) {
      const u = level.units.find((x) => x.vocabCircleIds.includes(circle.id))
      return u ? { unitId: u.id, kind: 'vocab', contentId: circle.id } : null
    }
    return null
  }, [hoatDongUrl, level, lesson, circle])
  const khoaHdHienTai = khoaHoatDong(hdHienTai)

  // Mở lại màn con của lần trước — ĐÚNG MỘT LẦN, ngay khi biết danh tính + dữ liệu cấp.
  // Cách mở là ĐIỀU HƯỚNG tới `?unit=&hd=` (hàm dựng URL dùng chung), để Back/Forward, mục lục
  // và màn con vẫn chỉ có một nguồn sự thật thay vì hai đường mở khác nhau.
  const daKhoiPhucRef = useRef(false)
  useEffect(() => {
    if (daKhoiPhucRef.current) return
    if (!level || phien.status === 'loading') return
    daKhoiPhucRef.current = true
    const hd = phien.draft.hd
    // URL đã chỉ đích danh (hoạt động hoặc tab) thì URL thắng — không mở đè lên.
    if (!hd || hoatDongUrl || tabTuUrl) return
    if (!coHoatDong(level, hd)) return
    nav(duongDanHoatDongCefr(level.id, hd.unitId, hd.kind, hd.contentId), { replace: true })
  }, [level, phien.status, phien.draft.hd, hoatDongUrl, tabTuUrl, nav])

  // Ghi vị trí đang học xuống nháp (hook tự gộp + trì hoãn 500 ms). Chỉ chạy SAU lượt khôi
  // phục ở trên, nếu không lần ghi đầu tiên sẽ xoá mất cái vừa định mở.
  useEffect(() => {
    if (!daKhoiPhucRef.current) return
    datNhapPhien((d) => (khoaHoatDong(d.hd) === khoaHdHienTai ? d : { ...d, hd: hdHienTai }))
  }, [khoaHdHienTai, hdHienTai, datNhapPhien])

  if (!user) return null
  // Dữ liệu đã tải mà không tìm thấy cấp (URL sai kiểu /lo-trinh-hoc/c9) → về lộ trình.
  if (ready && !level) return <Navigate to={duongDanLoTrinh()} replace />

  const accent: AccentClasses = level ? ACCENT[level.accent] : ACCENT.emerald
  const locked = level ? (lockedMap.get(level.id) ?? false) : false
  // Cấp này mở ra là NHỜ gói VIP (Free sẽ thấy ổ khoá) — nói rõ quyền lợi đang được hưởng.
  const unlockedByVip =
    user.plan === 'vip' && !locked && !!level && (freeRuleLockedMap.get(level.id) ?? false)

  // Đánh số bài ngữ pháp liên tục trong cả cấp (Bài 1, Bài 2, …) — cần TRƯỚC các early-return
  // màn con bên dưới vì danh sách unit của cột phải dùng lại số này.
  const unitLessonStarts: number[] = []
  let lessonStartAcc = 0
  if (level) {
    for (const u of level.units) {
      unitLessonStarts.push(lessonStartAcc)
      lessonStartAcc += u.grammar.length
    }
  }

  // Mở 1 hội thoại + ghi "đã xem" (ownerId = id unit hoặc id vòng từ vựng).
  function openDialogue(ownerId: string, d: Dialogue) {
    if (uid) markDialogueViewed(uid, ownerId, d.titleEn)
    bump()
    setDialogue(d)
  }

  // Cột trái ở desktop (≥1024px) khi đang xem 1 màn con (từ vựng/ngữ pháp/hội thoại):
  // MỤC LỤC CÂY của cả cấp (S07-3). Trước đây là danh sách unit đầy đủ dựng bằng `UnitSection`
  // — mỗi phần một thẻ cao gần bằng màn hình, nên "nhảy sang mục khác" vẫn phải cuộn rất xa.
  // KHÔNG hiện khi thi cuối cấp (màn thi cố tình toàn màn hình) hay khi cấp bị khóa.
  const mucLuc = level && !locked ? rail : null

  // ── Khung trang chung ──────────────────────────────────────────────────
  // headerBack: đích của nút back trên THANH HEADER trên cùng (khác nút "Quay lại"/"Back" bên
  // trong từng màn con). Luôn lùi ĐÚNG 1 BƯỚC theo cấu trúc cấp — bất kể vào bằng cách nào
  // (bấm tuần tự Lộ trình → Cấp → mục con, hay "tắt" thẳng từ nút Home) — KHÔNG về Trang chủ
  // như Layout mặc định: từ màn con (hội thoại/từ vựng/ngữ pháp/thi) → về trang cấp; từ trang
  // cấp (không mở màn con nào) → về danh sách cấp /lo-trinh-hoc.
  //
  // `master`: cột trái desktop (xem `mucLuc` ở trên) — CHỈ hiện khi có + `isDesktop` true.
  // Gate bằng JS (`useIsDesktopViewport`), không phải class Tailwind: bài học ở đợt thiết kế
  // desktop trước (changelog 0199) là ẩn-bằng-CSS vẫn để nội dung trùng trong DOM.
  function shell(
    children: React.ReactNode,
    headerBack?: () => void,
    master?: React.ReactNode,
    headerTitle?: string,
  ) {
    // [2026-09-02, đợt 3] Bố cục master–detail trước đây viết tay tại chỗ; nay dùng chung
    // `PageShell` + `TwoPane` với `railSide="left"` — cột phụ ở đây là DANH SÁCH ĐỂ CHỌN nên
    // phải đứng trước phần được chọn, khác với cột ngữ cảnh (đứng sau) ở các trang khác.
    return (
      <div className="min-h-dvh bg-zinc-950">
        <Layout back onBack={headerBack ?? (() => nav(duongDanLoTrinh()))} title={headerTitle} />
        {/* Bề rộng phụ thuộc CÓ cột danh sách hay không: có thì `standard` (1152px = danh sách
            288px + phần chi tiết ~840px); không thì `reading` (768px) để dòng chữ không dài quá
            khổ đọc — màn tổng quan cấp toàn chữ và danh sách mục tiêu, kéo rộng 1152px là mắt
            mất dấu dòng khi xuống hàng. */}
        <PageShell width={isDesktop && master ? 'standard' : 'reading'} baseWidth="max-w-3xl">
          <TwoPane
            isDesktop={isDesktop && !!master}
            railSide="left"
            railLabel="Danh sách trong cấp học"
            rail={master}
          >
            {children}
          </TwoPane>
        </PageShell>
        {/* Panel mục lục của mobile — tự `createPortal` ra `<body>`, đặt đâu cũng được. */}
        {sheet}
      </div>
    )
  }

  /**
   * Khung của một MÀN CON (từ vựng · ngữ pháp · hội thoại): thêm nút mở mục lục cho mobile
   * ngay trên đầu nội dung. Trên desktop `trigger` là `null` (đã có cột trái), nên chỗ này
   * KHÔNG sinh ra hai bản mục lục trong DOM.
   */
  function manCon(children: React.ReactNode, headerBack: () => void) {
    return shell(
      <>
        {trigger && <div className="mb-3">{trigger}</div>}
        {children}
      </>,
      headerBack,
      mucLuc,
    )
  }

  if (!ready || !level) {
    // Khung xương thay cho một dòng chữ "Đang tải…": nó vẽ sẵn ĐÚNG hình dạng nội dung sắp
    // hiện (thẻ tổng quan có hai thanh tiến độ, rồi danh sách phần), nên khi dữ liệu vào,
    // trang điền vào chỗ trống thay vì nhảy dựng — mắt không phải tìm lại vị trí đang đọc.
    // `aria-busy` + nhãn ẩn để trình đọc màn hình vẫn nghe được "đang tải", vì các khối xám
    // này với họ là vô nghĩa.
    return shell(
      <div className="animate-fade-in space-y-3" aria-busy="true">
        <span className="sr-only">{isA ? 'Đang tải lộ trình…' : 'Loading roadmap…'}</span>
        <div className="glass rounded-2xl p-5 space-y-3">
          <div className="h-5 w-40 rounded-lg bg-zinc-800 animate-pulse" />
          <div className="h-3 w-full rounded-full bg-zinc-800 animate-pulse" />
          <div className="h-3 w-2/3 rounded-full bg-zinc-800 animate-pulse" />
        </div>
        {[0, 1, 2].map((i) => (
          <div key={i} className="glass rounded-2xl p-4 flex items-center gap-3">
            <div className="h-10 w-10 shrink-0 rounded-xl bg-zinc-800 animate-pulse" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-3 w-24 rounded-full bg-zinc-800 animate-pulse" />
              <div className="h-4 w-48 max-w-full rounded-lg bg-zinc-800 animate-pulse" />
            </div>
          </div>
        ))}
      </div>,
    )
  }

  // ── Màn con: hội thoại / flashcard / bài ngữ pháp ─────────────────────
  // Đóng hội thoại: hội thoại ĐÈ LÊN màn từ vựng (xem chú thích ở khai báo state), nên chỉ
  // xoá ngữ cảnh trên URL khi bên dưới không còn màn con nào — nếu không, đóng hội thoại mở
  // từ trong một vòng từ vựng sẽ làm URL quên mất vòng đang học.
  const dongHoiThoai = () => {
    setDialogue(null)
    if (!circle && !lesson) xoaNguCanhHoatDong()
  }
  const dongVongTuVung = () => {
    setCircle(null)
    xoaNguCanhHoatDong()
  }
  const dongNguPhap = () => {
    setLesson(null)
    xoaNguCanhHoatDong()
  }

  if (dialogue) {
    return manCon(
      <DialogueView
        dialogue={dialogue}
        isA={isA}
        accent={accent}
        plan={user?.plan ?? 'free'}
        userId={uid}
        onBack={dongHoiThoai}
      />,
      dongHoiThoai,
    )
  }
  if (circle) {
    return manCon(
      <VocabFlash
        circle={circle}
        isA={isA}
        uid={uid}
        pool={studyPool}
        onProgress={bump}
        onBack={dongVongTuVung}
        onOpenDialogue={(d) => openDialogue(circle.id, d)}
      />,
      dongVongTuVung,
    )
  }
  if (lesson) {
    return manCon(
      <GrammarDetail
        lesson={lesson}
        isA={isA}
        uid={uid}
        accent={accent}
        onBack={dongNguPhap}
        onDoneChange={bump}
      />,
      dongNguPhap,
    )
  }
  if (examing) {
    return shell(
      <CefrExam
        uid={uid}
        isA={isA}
        level={level}
        accent={accent}
        ageGroup={onboarding?.ageGroup}
        onClose={() => {
          setExaming(false)
          bump() // cập nhật kết quả thi + mở khóa cấp sau nếu vừa đạt
        }}
        onOpenLesson={(id) => {
          setExaming(false)
          openLessonById(id)
        }}
      />,
      () => setExaming(false),
    )
  }

  const vocab = levelVocabCounts(level, circleById, learned)
  const grammar = levelGrammarCounts(level, doneGrammar)
  const next = locked ? null : findNextStep(level, circleById, learned, doneGrammar)

  // Bài thi cuối cấp: đủ điều kiện dự thi (≥70% từ vựng + 100% ngữ pháp) + kết quả.
  const examResult = examMap[level.id]
  const examPassedThis = examResult?.passed ?? false
  const examEligible = !locked && isExamEligible(level, circleById, learned, doneGrammar)

  // Banner gợi ý test-out (U-3): chỉ ở A1, người khai trình độ ≥ Trung cấp, chưa
  // bấm đóng, và từ vựng A1 chưa đạt ngưỡng mở A2 (đạt rồi thì gợi ý hết tác dụng).
  const showTestoutBanner =
    level.id === 'A1' &&
    !locked &&
    !testoutDismissed &&
    onboarding != null &&
    onboarding.level !== 'beginner' &&
    vocab.total > 0 &&
    vocab.done / vocab.total < UNLOCK_PCT

  // Mục "Học tiếp": nhãn + hành động mở đúng màn.
  let nextLabel = ''
  let nextOnClick: (() => void) | null = null
  if (next?.kind === 'vocab' && next.circleId) {
    const c = circleById[next.circleId]
    if (c) {
      const done = circleDoneCount(c, learned)
      nextLabel = `${c.emoji} ${isA ? c.titleVi : c.titleEn} (${done}/${c.words.length} ${isA ? 'từ' : 'words'})`
      nextOnClick = () => setCircle(c)
    }
  } else if (next?.kind === 'grammar' && next.lessonId) {
    const g = next.unit.grammar.find((x) => x.id === next.lessonId)
    if (g) {
      nextLabel = `${isA ? 'Bài' : 'Lesson'} ${lessonNumberOf.get(g.id) ?? ''}: ${isA ? g.titleVi : g.titleEn}`
      nextOnClick = () => setLesson(g)
    }
  }

  // Cấp kế tiếp (để gợi ý khi hoàn thành cấp này).
  const levelIdx = levels.findIndex((l) => l.id === level.id)
  const nextLevel = levels[levelIdx + 1]
  const prevLevel = levelIdx > 0 ? levels[levelIdx - 1] : undefined

  // Cấp còn khóa → chỉ hiện màn khóa (không có thanh tab / tab học).
  const activeTab: StudyTab = locked ? 'lessons' : tab

  // Thanh tab của trang cấp (kiểu dáng giữ nguyên từ trang /lo-trinh-hoc cũ).
  type TabDef = {
    key: StudyTab
    icon: typeof Target
    labelA: string
    labelB: string
    badge?: number
    active: string
    inactive: string
  }
  const TABS: TabDef[] = [
    {
      key: 'lessons',
      icon: BookOpen,
      labelA: 'Bài học',
      labelB: 'Lessons',
      active: 'bg-teal-500/20 text-teal-300 theme-light:text-teal-800 border border-teal-500/40',
      inactive: 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-zinc-200',
    },
    {
      key: 'today',
      icon: Target,
      labelA: 'Hôm nay',
      labelB: 'Today',
      active:
        'bg-accent-500/20 text-accent-300 theme-light:text-accent-800 border border-accent-500/40',
      inactive: 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-zinc-200',
    },
    {
      key: 'srs',
      icon: Brain,
      labelA: 'Ôn lại',
      labelB: 'SRS',
      badge: srsDue,
      active: 'bg-sky-500/20 text-sky-300 theme-light:text-sky-800 border border-sky-500/40',
      inactive: 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-zinc-200',
    },
    {
      key: 'listening',
      icon: Headphones,
      labelA: 'Nghe',
      labelB: 'Listen',
      active: 'bg-sky-500/20 text-sky-300 theme-light:text-sky-800 border border-sky-500/40',
      inactive: 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-zinc-200',
    },
    {
      key: 'hard',
      icon: Star,
      labelA: 'Từ khó',
      labelB: 'Hard',
      badge: hardCount,
      active:
        'bg-amber-500/20 text-amber-300 theme-light:text-amber-800 border border-amber-500/40',
      inactive: 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-zinc-200',
    },
    {
      key: 'quiz',
      icon: ClipboardList,
      labelA: 'Kiểm tra',
      labelB: 'Quiz',
      badge: grammarDue,
      active:
        'bg-violet-500/20 text-violet-300 theme-light:text-violet-800 border border-violet-500/40',
      inactive: 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-zinc-200',
    },
  ]

  // Tiêu đề thanh header: chỉ ở tab "Bài học" — các tab học khác đã có ngữ cảnh riêng
  // (vd "Từ 3/10") nên không cần tiêu đề to (xem khối `activeTab === 'lessons'` bên dưới).
  const pageTitle = activeTab === 'lessons' ? (isA ? level.titleVi : level.titleEn) : undefined

  return shell(
    <div className="animate-fade-in">
      {/* [audit 2026-09-30 minor 3] Header đã có nút quay lại Lộ trình CEFR cùng đích. */}

      {/* Mở hội thoại từ mục lục mà tải hỏng → báo lỗi + Thử lại (changelog 0530). */}
      {loiHoiThoaiUrl?.khoa === khoaManCon &&
        !(activeTab === 'lessons' && levelDialoguesState.status === 'error') && (
          <div className="mb-4">
            <DialogueLoadError
              isA={isA}
              message={loiHoiThoaiUrl.message}
              onRetry={thuLaiHoiThoai}
            />
          </div>
        )}

      {/* Thanh tab học của cấp — ẩn khi cấp còn khóa */}
      {!locked && (
        <div className="grid grid-cols-3 min-[340px]:grid-cols-6 gap-1.5 mb-4">
          {TABS.map(({ key, icon: Icon, labelA, labelB, badge, active, inactive }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              // Nút chuyển trạng thái (không phải tablist ARIA đầy đủ) → `aria-pressed` là cách
              // đúng để trình đọc màn hình biết tab nào đang bật; trước đây chỉ có màu sắc.
              aria-pressed={activeTab === key}
              className={`relative flex flex-col items-center justify-center gap-0.5 py-2 px-1 rounded-xl text-xs font-medium transition ${activeTab === key ? active : inactive}`}
            >
              <Icon className="w-4 h-4" />
              {/* whitespace-nowrap: "Kiểm tra" bị bẻ 2 dòng trong pill ở màn hẹp,
                  làm các tab cao thấp so le. */}
              <span className="whitespace-nowrap">{isA ? labelA : labelB}</span>
              {badge != null && badge > 0 && (
                <span className={countBadgeClass()}>{badgeCount(badge)}</span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Tiêu đề: to + phụ đề ở tab "Bài học"; gọn 1 dòng ở 4 tab học (đỡ chiếm chỗ,
          vì các tab đó đã có ngữ cảnh riêng — vd "Từ 3/10" — không cần tiêu đề to). */}
      {activeTab === 'lessons' ? (
        <h1 tabIndex={-1} className="sr-only focus:outline-none">
          {isA ? level.titleVi : level.titleEn}
        </h1>
      ) : (
        // [S07d] h1 chứ không phải p: ở các tab này đây là tiêu đề DUY NHẤT của trang
        // (probe 25/09 đo được 0 h1). Giữ nguyên cỡ chữ gọn — chỉ đổi ngữ nghĩa.
        <h1 className="text-sm font-semibold text-zinc-300 mb-4">
          {isA ? level.titleVi : level.titleEn}
        </h1>
      )}

      {/* 5 tab học theo cấp — cần từ điển nạp xong mới render */}
      {activeTab !== 'lessons' &&
        (!dictReady && curriculumState.status === 'error' ? (
          <LoadError
            message={curriculumState.message}
            onRetry={retryCurriculum}
            lang={isA ? 'vi' : 'en'}
            hint={isA ? GOI_Y_TU_VUNG_VI : GOI_Y_TU_VUNG_EN}
          />
        ) : !dictReady ? (
          <div className="glass rounded-xl p-8 text-center animate-fade-in">
            <p className="text-zinc-400 text-sm">
              {isA ? 'Đang tải từ vựng…' : 'Loading vocabulary…'}
            </p>
          </div>
        ) : (
          // key={level.id}: đổi cấp (điều hướng giữa các trang cấp) → remount để
          // batch/câu hỏi khởi tạo lại theo đúng từ vựng của cấp mới.
          <>
            {activeTab === 'today' && (
              <TodayLesson
                key={level.id}
                uid={uid}
                isA={isA}
                pool={studyPool}
                onProgress={bump}
                sessionCap={sessionCap}
              />
            )}
            {activeTab === 'srs' && (
              <SRSReview
                key={level.id}
                uid={uid}
                isA={isA}
                pool={allWordsPool}
                levelPool={studyPool}
                onUpdate={bump}
                sessionCap={sessionCap}
              />
            )}
            {activeTab === 'hard' && (
              <HardWords key={level.id} uid={uid} isA={isA} pool={studyPool} onUpdate={bump} />
            )}
            {activeTab === 'quiz' && (
              <QuizTab
                key={level.id}
                uid={uid}
                isA={isA}
                pool={studyPool}
                grammarPool={grammarQuizPool}
                onOpenLesson={openLessonById}
                sessionScope={level.id}
              />
            )}
            {activeTab === 'listening' && levelDialoguesState.status === 'error' && (
              <div className="mb-4">
                <DialogueLoadError
                  isA={isA}
                  message={levelDialoguesState.message}
                  onRetry={thuLaiHoiThoai}
                />
              </div>
            )}
            {activeTab === 'listening' && (
              <ListeningTab
                key={level.id}
                isA={isA}
                levelId={level.id}
                accent={accent}
                pool={studyPool}
                learned={learned}
                dialogues={levelDialogues}
              />
            )}
          </>
        ))}

      {activeTab === 'lessons' && (
        <>
          {/* Thẻ tổng quan cấp độ */}
          <div className={`glass rounded-2xl p-5 mb-4 border ${accent.ring}`}>
            <div className="flex items-start gap-3">
              <GraduationCap className={`w-6 h-6 shrink-0 ${accent.text}`} />
              <div className="flex-1">
                <p className="text-base text-zinc-300 leading-snug">{level.goalVi}</p>
                <div className="flex flex-wrap gap-x-3 gap-y-1 mt-3 text-sm text-zinc-400">
                  <span className="flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5" /> {level.units.length}{' '}
                    {isA ? 'chủ đề' : 'units'}
                  </span>
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5" /> {grammar.total}{' '}
                    {isA ? 'bài ngữ pháp' : 'grammar points'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> {vocab.total} {isA ? 'từ vựng' : 'words'}
                  </span>
                </div>
              </div>
            </div>

            {/* 2 thanh tiến độ: từ vựng + ngữ pháp */}
            <div className="mt-4 space-y-3">
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-zinc-400">{isA ? 'Từ vựng' : 'Vocabulary'}</span>
                  <span className={`font-semibold ${accent.text}`}>
                    {vocab.done}/{vocab.total} ({pct(vocab.done, vocab.total)}%)
                  </span>
                </div>
                <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${accent.bar} transition-[width]`}
                    style={{ width: `${pct(vocab.done, vocab.total)}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-zinc-400">{isA ? 'Ngữ pháp' : 'Grammar'}</span>
                  <span className={`font-semibold ${accent.text}`}>
                    {grammar.done}/{grammar.total} ({pct(grammar.done, grammar.total)}%)
                  </span>
                </div>
                <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${accent.bar} transition-[width]`}
                    style={{ width: `${pct(grammar.done, grammar.total)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Mục tiêu can-do — mặc định LUÔN MỞ ở mọi cấp (A1→C2), vẫn thu gọn được nếu
                người dùng tự bấm ẩn (thuộc tính open chỉ set giá trị ban đầu). */}
            <details open className="mt-4 pt-4 border-t border-zinc-800/80 group">
              <summary className="tap-44-y cursor-pointer list-none text-sm font-semibold text-zinc-300 flex items-center gap-1.5 select-none">
                <Sparkles className={`w-4 h-4 shrink-0 ${accent.text}`} />
                <span className="flex-1">
                  {isA
                    ? 'Hoàn thành cấp này, bạn có thể…'
                    : 'After this level, you will be able to…'}
                </span>
                <ChevronDown className="w-4 h-4 text-zinc-400 transition-transform group-open:rotate-180" />
              </summary>
              <ul className="space-y-2 mt-3">
                {level.canDo.map((c, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-base text-zinc-300 leading-snug"
                  >
                    <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${accent.text}`} />
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </details>

            {/* Nhãn quyền lợi VIP: cấp này người dùng Free sẽ thấy ổ khoá (GĐ2a). */}
            {unlockedByVip && (
              <p className="mt-4 flex items-center gap-1.5 text-sm text-accent-300 theme-light:text-accent-800">
                <Sparkles className="w-4 h-4 shrink-0" aria-hidden="true" />
                {isA
                  ? 'Mở tự do (VIP) — bạn vào thẳng cấp này mà không cần thi cấp trước.'
                  : 'Open access (VIP) — you can jump straight in without passing the previous exam.'}
              </p>
            )}
          </div>

          {locked ? (
            /* Màn khóa — cấp này chưa mở */
            <div className="glass rounded-2xl p-6 text-center space-y-3 border border-zinc-700/60">
              <Lock className="w-8 h-8 text-zinc-400 mx-auto" />
              <p className="text-white font-semibold text-lg">
                {isA ? `Cấp ${level.id} đang bị khóa` : `${level.id} is locked`}
              </p>
              <p className="text-sm text-zinc-400 leading-relaxed">
                {isA
                  ? `Thi đạt bài kiểm tra cuối cấp ${prevLevel?.id ?? ''} (≥70%) để mở khóa.`
                  : `Pass the ${prevLevel?.id ?? 'previous level'} end-of-level exam (≥70%) to unlock.`}
              </p>
              {prevLevel && (
                <button
                  onClick={() => nav(duongDanLoTrinh(prevLevel.id))}
                  className="tap-44-y inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-accent-500/20 hover:bg-accent-500/30 text-accent-300 theme-light:text-accent-800 text-sm font-medium transition"
                >
                  {isA ? `Học tiếp cấp ${prevLevel.id}` : `Continue ${prevLevel.id}`}
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Gợi ý test-out cho người đã có nền (U-3) */}
              {showTestoutBanner && (
                <div className="glass rounded-2xl p-4 mb-4 border border-sky-500/30 flex items-start gap-3 animate-fade-in">
                  <Zap className="w-5 h-5 text-sky-400 theme-light:text-sky-700 shrink-0 mt-0.5" />
                  <p className="flex-1 text-sm text-zinc-300 leading-relaxed">
                    {isA ? (
                      <>
                        Bạn khai trình độ{' '}
                        <strong className="text-white">
                          {onboarding?.level === 'advanced' ? 'Nâng cao' : 'Trung cấp'}
                        </strong>{' '}
                        khi bắt đầu? Không cần học lại từng thẻ — mở một vòng từ vựng rồi bấm{' '}
                        <strong className="text-white">
                          “Tôi đã biết vòng này — kiểm tra nhanh”
                        </strong>{' '}
                        để vượt nhanh các vòng đã biết.
                      </>
                    ) : (
                      <>
                        You said your level is{' '}
                        <strong className="text-white">
                          {onboarding?.level === 'advanced' ? 'Advanced' : 'Intermediate'}
                        </strong>
                        ? No need to relearn every card — open a vocabulary set and tap{' '}
                        <strong className="text-white">
                          “I already know this set — quick test”
                        </strong>{' '}
                        to skip ahead.
                      </>
                    )}
                  </p>
                  <button
                    onClick={dismissTestout}
                    aria-label={isA ? 'Đóng gợi ý' : 'Dismiss suggestion'}
                    className="tap-44 shrink-0 text-zinc-400 hover:text-zinc-200 transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Học tiếp / hoàn thành cấp
                  THỨ TỰ VÀ ĐỘ NẶNG THỊ GIÁC LÀ CÓ CHỦ ĐÍCH (sửa 2026-09-02): trước đây thẻ
                  "Thi cuối cấp" đứng TRÊN thẻ này và có cùng kiểu, cùng cỡ, nên hai hành động
                  trông ngang nhau — người học đủ điều kiện thi rất dễ bấm thi trước khi học
                  hết phần còn lại. Việc đúng gần như luôn là "học tiếp", nên nó đứng trước và
                  mang nền accent (hành động chính); thẻ thi lùi xuống sau, giữ nền trung tính
                  (hành động phụ). Đây là phân cấp bằng thị giác, không phải trang trí. */}
              {nextOnClick ? (
                <button
                  onClick={nextOnClick}
                  className={`w-full rounded-2xl p-4 mb-4 flex items-center gap-3 text-left border ${accent.soft} ${accent.ring} hover:brightness-110 transition shadow-lg shadow-black/5`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl ${accent.soft} flex items-center justify-center shrink-0`}
                  >
                    <Play className={`w-5 h-5 fill-current ${accent.text}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-zinc-400">
                      {isA ? 'Học tiếp' : 'Continue'} · {isA ? 'Phần' : 'Part'}{' '}
                      {(next?.unitIndex ?? 0) + 1} — {isA ? next?.unit.titleVi : next?.unit.titleEn}
                    </p>
                    <p className="text-sm font-semibold text-white break-words mt-0.5">
                      {nextLabel}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-zinc-400 shrink-0" />
                </button>
              ) : (
                <div className="glass rounded-2xl p-5 mb-4 text-center space-y-2">
                  <PartyPopper className="w-8 h-8 text-amber-400 theme-light:text-amber-900 mx-auto" />
                  <p className="text-white font-semibold">
                    {isA
                      ? `Chúc mừng! Bạn đã hoàn thành cấp ${level.id} 🎉`
                      : `Congrats! You finished ${level.id} 🎉`}
                  </p>
                  {nextLevel && !(lockedMap.get(nextLevel.id) ?? false) && (
                    <button
                      onClick={() => nav(duongDanLoTrinh(nextLevel.id))}
                      className="tap-44-y inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-accent-500/20 hover:bg-accent-500/30 text-accent-300 theme-light:text-accent-800 text-sm font-medium transition"
                    >
                      {isA ? `Sang cấp ${nextLevel.id}` : `Go to ${nextLevel.id}`}
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}

              {/* Thẻ CTA bài thi cuối cấp — khi đủ điều kiện dự thi hoặc đã qua */}
              {(examEligible || examPassedThis) && (
                <button
                  onClick={() => setExaming(true)}
                  className={`w-full glass rounded-2xl p-4 mb-4 flex items-center gap-3 text-left border transition hover:border-zinc-500 ${examPassedThis ? 'border-amber-500/40' : accent.ring} animate-fade-in`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${examPassedThis ? 'bg-amber-500/15' : accent.soft}`}
                  >
                    <GraduationCap
                      className={`w-5 h-5 ${examPassedThis ? 'text-amber-300 theme-light:text-amber-800' : accent.text}`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white">
                      {examPassedThis
                        ? isA
                          ? `🎓 Đã qua cấp ${level.id} · điểm cao nhất ${examResult?.bestPct}%`
                          : `🎓 ${level.id} passed · best ${examResult?.bestPct}%`
                        : isA
                          ? `🎓 Sẵn sàng — Thi cuối cấp ${level.id}`
                          : `🎓 Ready — take the ${level.id} exam`}
                    </p>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {examPassedThis
                        ? isA
                          ? 'Thi lại để cải thiện điểm (không bắt buộc).'
                          : 'Retake to improve your score (optional).'
                        : isA
                          ? 'Đạt ≥70% để qua cấp và mở khóa cấp tiếp theo.'
                          : 'Score ≥70% to pass and unlock the next level.'}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-zinc-400 shrink-0" />
                </button>
              )}

              {/* Mục lục nhảy nhanh — trang này có thể dài gấp nhiều lần khung nhìn khi
                  nhiều "Phần" chưa hoàn thành (audit UI/UX 2026-09-19: A1 cao ~6 lần khung
                  nhìn desktop, không có cách nào tới thẳng một Phần giữa danh sách ngoài
                  cuộn tay). Thu gọn mặc định để không chiếm chỗ ở cấp có ít unit. */}
              {level.units.length > 4 && (
                <details className="glass rounded-2xl p-4 mb-4 group">
                  <summary className="tap-44-y cursor-pointer list-none text-sm font-semibold text-zinc-300 flex items-center gap-1.5 select-none">
                    <Layers className={`w-4 h-4 shrink-0 ${accent.text}`} />
                    <span className="flex-1">
                      {isA
                        ? `Mục lục ${level.units.length} phần`
                        : `Table of contents (${level.units.length} parts)`}
                    </span>
                    <ChevronDown className="w-4 h-4 text-zinc-400 transition-transform group-open:rotate-180" />
                  </summary>
                  <ul className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {level.units.map((unit, ui) => (
                      <li key={unit.id}>
                        <a
                          href={`#cefr-unit-${unit.id}`}
                          onClick={(e) => {
                            e.preventDefault()
                            document
                              .getElementById(`cefr-unit-${unit.id}`)
                              ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                          }}
                          className="tap-44 flex items-center gap-2 px-2.5 py-2 rounded-xl text-sm text-zinc-300 hover:bg-zinc-800/80 hover:text-white transition"
                        >
                          <span className={`text-[0.6875rem] font-bold shrink-0 ${accent.text}`}>
                            {ui + 1}
                          </span>
                          <span className="text-base shrink-0">{unit.emoji}</span>
                          <span className="flex-1 min-w-0 break-words">
                            {isA ? unit.titleVi : unit.titleEn}
                          </span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </details>
              )}

              {/* Hội thoại cả cấp tải lỗi → MỘT khối lỗi + Thử lại (changelog 0530); từ vựng và
                  ngữ pháp bên dưới vẫn dùng được. */}
              {levelDialoguesState.status === 'error' && (
                <div className="mb-3">
                  <DialogueLoadError
                    isA={isA}
                    message={levelDialoguesState.message}
                    onRetry={thuLaiHoiThoai}
                  />
                </div>
              )}

              {/* Danh sách unit — "Phần 1..n", trình tự: từ vựng → ngữ pháp → hội thoại */}
              <div className="space-y-3">
                {level.units.map((unit, ui) => {
                  const start = unitLessonStarts[ui] ?? 0
                  return (
                    <UnitSection
                      key={unit.id}
                      unit={unit}
                      index={ui}
                      isA={isA}
                      accent={accent}
                      circleById={circleById}
                      learned={learned}
                      doneGrammar={doneGrammar}
                      viewedDialogues={viewedDialogues}
                      dialogues={dialoguesByUnit?.[unit.id]}
                      lessonStartIndex={start}
                      onOpenLesson={setLesson}
                      onOpenCircle={setCircle}
                      onOpenDialogue={openDialogue}
                    />
                  )
                })}
              </div>
            </>
          )}
        </>
      )}
    </div>,
    undefined,
    undefined,
    pageTitle,
  )
}

// ── 1 unit — "Phần i" với 3 bước; ẩn mục đã hoàn thành 100% ──────────────────
export function UnitSection({
  unit,
  index,
  isA,
  accent,
  circleById,
  learned,
  doneGrammar,
  viewedDialogues,
  dialogues: unitDialogues,
  lessonStartIndex,
  onOpenLesson,
  onOpenCircle,
  onOpenDialogue,
}: {
  unit: CefrUnit
  index: number
  isA: boolean
  accent: AccentClasses
  circleById: Record<string, Circle>
  learned: Set<string>
  doneGrammar: Set<string>
  viewedDialogues: Set<string>
  /** Hội thoại của unit; `undefined` = chưa tải xong hoặc tải lỗi (cấp trang báo lỗi một lần). */
  dialogues: Dialogue[] | undefined
  lessonStartIndex: number
  onOpenLesson: (g: GrammarLesson) => void
  onOpenCircle: (c: Circle) => void
  onOpenDialogue: (ownerId: string, d: Dialogue) => void
}) {
  // [changelog 0530] Hội thoại do trang cấp tải MỘT lần cho mọi unit (xem `loadLevelDialogues`) —
  // trước đây mỗi unit tự `getDialogues().then(...)` không có nhánh lỗi.
  const dialogues = unitDialogues ?? NO_DIALOGUES
  const dlgLoaded = unitDialogues !== undefined

  // Hiện lại các mục đã hoàn thành (mặc định ẩn).
  const [showDone, setShowDone] = useState(false)
  // Unit đã xong 100% → thu gọn thành 1 dòng; bấm để mở rộng xem lại.
  const [expanded, setExpanded] = useState(false)

  const circles = unit.vocabCircleIds
    .map((id) => circleById[id])
    .filter((c): c is Circle => c != null)
  const isCircleDone = (c: Circle) => circleDoneCount(c, learned) >= c.words.length
  const isDlgViewed = (d: Dialogue) => viewedDialogues.has(dialogueKey(unit.id, d.titleEn))

  const doneCircles = circles.filter(isCircleDone)
  const doneLessons = unit.grammar.filter((g) => doneGrammar.has(g.id))
  const doneDlgs = dialogues.filter(isDlgViewed)
  const hiddenCount = doneCircles.length + doneLessons.length + doneDlgs.length
  const totalCount = circles.length + unit.grammar.length + dialogues.length
  // Chỉ coi là "xong hết" khi hội thoại đã tải xong (tránh nhấp nháy thu gọn).
  const allDone = dlgLoaded && totalCount > 0 && hiddenCount >= totalCount

  // Unit hoàn thành + đang thu gọn → chỉ 1 dòng mỏng.
  if (allDone && !expanded) {
    return (
      <button
        id={`cefr-unit-${unit.id}`}
        onClick={() => setExpanded(true)}
        className="w-full glass rounded-2xl px-4 py-3 flex items-center gap-2 text-left hover:border-zinc-600 border border-transparent transition scroll-mt-20"
      >
        <CheckCircle2 className={`w-4 h-4 shrink-0 ${accent.text}`} />
        <span className="text-lg shrink-0">{unit.emoji}</span>
        <span className="flex-1 min-w-0 text-sm font-medium text-zinc-300 break-words">
          {isA ? unit.titleVi : unit.titleEn}
        </span>
        <span className={`text-xs shrink-0 ${accent.text}`}>{isA ? 'Hoàn thành' : 'Done'}</span>
        <ChevronDown className="w-4 h-4 text-zinc-400 shrink-0" />
      </button>
    )
  }

  // Khi unit đã xong và người dùng mở rộng → hiện tất cả mục (kiểu "đã xong").
  const showAll = showDone || (allDone && expanded)

  const visCircles = showAll ? circles : circles.filter((c) => !isCircleDone(c))
  const visLessons = showAll ? unit.grammar : unit.grammar.filter((g) => !doneGrammar.has(g.id))
  const visDlgs = showAll ? dialogues : dialogues.filter((d) => !isDlgViewed(d))

  // Đánh số bước theo các phần CÓ TRONG unit (unit thiếu phần nào thì bỏ qua số đó).
  let step = 0
  const stepLabel = (nameVi: string, nameEn: string) => {
    step += 1
    return (
      <p className="text-[0.6875rem] font-semibold text-zinc-400 mb-1.5">
        {step} · {isA ? nameVi : nameEn}
      </p>
    )
  }

  return (
    <div id={`cefr-unit-${unit.id}`} className="glass rounded-2xl p-4 scroll-mt-20">
      <div className="flex items-center gap-2 mb-3">
        <span className={`text-[0.6875rem] font-bold ${accent.text}`}>
          {isA ? 'Phần' : 'Part'} {index + 1}
        </span>
        <span className="text-xl">{unit.emoji}</span>
        <h2 className="flex-1 min-w-0 font-semibold text-white text-base break-words">
          {isA ? unit.titleVi : unit.titleEn}
        </h2>
        {allDone && expanded && (
          <button
            onClick={() => setExpanded(false)}
            className="tap-44 flex items-center justify-center text-xs text-zinc-400 hover:text-zinc-200 transition shrink-0"
          >
            {isA ? 'Thu gọn' : 'Collapse'}
          </button>
        )}
      </div>

      {/* ① Từ vựng */}
      {circles.length > 0 && (
        <div className="mb-3">
          {stepLabel('Từ vựng', 'Vocabulary')}
          {visCircles.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {visCircles.map((c) => {
                const done = circleDoneCount(c, learned)
                const full = done >= c.words.length
                return (
                  <button
                    key={c.id}
                    onClick={() => onOpenCircle(c)}
                    className={`tap-44-touch-y flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs border transition hover:border-zinc-500 ${full ? `${accent.soft} ${accent.ring}` : 'bg-zinc-900/70 border-zinc-800 text-zinc-300'}`}
                  >
                    <span>{c.emoji}</span>
                    <span>{isA ? c.titleVi : c.titleEn}</span>
                    <span className={full ? accent.text : 'text-zinc-400'}>
                      {full ? <Check className="w-3.5 h-3.5" /> : `${done}/${c.words.length}`}
                    </span>
                  </button>
                )
              })}
            </div>
          ) : (
            <p className="text-xs text-zinc-400">
              {isA ? '✓ Đã thuộc hết từ vựng phần này' : '✓ All words learned'}
            </p>
          )}
        </div>
      )}

      {/* ② Ngữ pháp — số thứ tự "Bài N" liên tục toàn cấp */}
      {unit.grammar.length > 0 && (
        <div className="mb-3">
          {stepLabel('Ngữ pháp', 'Grammar')}
          {visLessons.length > 0 ? (
            <div className="space-y-1.5">
              {visLessons.map((g) => {
                const gi = unit.grammar.indexOf(g)
                const done = doneGrammar.has(g.id)
                return (
                  <button
                    key={g.id}
                    onClick={() => onOpenLesson(g)}
                    className={`w-full flex items-center gap-2 text-left px-3 py-3 rounded-xl border transition hover:border-zinc-600 ${done ? `${accent.soft} ${accent.ring}` : 'bg-zinc-900/70 border-zinc-800'}`}
                  >
                    <span className={`text-xs font-bold w-14 shrink-0 ${accent.text}`}>
                      {isA ? `Bài ${lessonStartIndex + gi + 1}` : `L.${lessonStartIndex + gi + 1}`}
                    </span>
                    {done ? (
                      <CheckCircle2 className={`w-4 h-4 shrink-0 ${accent.text}`} />
                    ) : (
                      <BookOpen className={`w-4 h-4 shrink-0 ${accent.text}`} />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-200 break-words">
                        {/* [U4] tên "tiếng Việt" có khi là tiếng Anh ("This / That / …"). */}
                        <MixedLangText text={isA ? g.titleVi : g.titleEn} />
                      </p>
                      {/* [U4 · WCAG 3.1.2] công thức trộn Anh/Việt → `lang` theo từng đoạn. */}
                      <p className="text-xs text-zinc-400 font-mono break-words">
                        <MixedLangText text={g.structure} />
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-400 shrink-0" />
                  </button>
                )
              })}
            </div>
          ) : (
            <p className="text-xs text-zinc-400">
              {isA ? '✓ Đã học xong ngữ pháp phần này' : '✓ All grammar done'}
            </p>
          )}
        </div>
      )}

      {/* ③ Hội thoại mẫu */}
      {dialogues.length > 0 && (
        <div className="mb-1">
          {stepLabel('Hội thoại', 'Dialogues')}
          {visDlgs.length > 0 ? (
            <div className="space-y-1.5">
              {visDlgs.map((dl, i) => {
                const viewed = isDlgViewed(dl)
                return (
                  <button
                    key={i}
                    onClick={() => onOpenDialogue(unit.id, dl)}
                    className={`tap-44-y w-full flex items-center gap-2 text-left px-3 py-2.5 rounded-xl border transition hover:border-zinc-600 ${viewed ? `${accent.soft} ${accent.ring}` : 'bg-zinc-900/70 border-zinc-800'}`}
                  >
                    {viewed ? (
                      <CheckCircle2 className={`w-4 h-4 shrink-0 ${accent.text}`} />
                    ) : (
                      <MessageCircle className={`w-4 h-4 shrink-0 ${accent.text}`} />
                    )}
                    <span className="flex-1 min-w-0 text-sm font-medium text-zinc-200 break-words">
                      {isA ? dl.titleVi : dl.titleEn}
                    </span>
                    <ChevronRight className="w-4 h-4 text-zinc-400 shrink-0" />
                  </button>
                )
              })}
            </div>
          ) : (
            <p className="text-xs text-zinc-400">
              {isA ? '✓ Đã xem hết hội thoại phần này' : '✓ All dialogues viewed'}
            </p>
          )}
        </div>
      )}

      {/* Nút hiện/ẩn các mục đã hoàn thành (chỉ khi có mục bị ẩn và unit chưa xong hết) */}
      {hiddenCount > 0 && !allDone && (
        <button
          onClick={() => setShowDone((v) => !v)}
          className="tap-44-y mt-2 w-full flex items-center justify-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 py-2 transition"
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-accent-400 theme-light:text-accent-800" />
          {showDone
            ? isA
              ? 'Ẩn mục đã hoàn thành'
              : 'Hide completed'
            : isA
              ? `Đã hoàn thành ${hiddenCount} mục · Xem lại`
              : `${hiddenCount} completed · Review`}
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform ${showDone ? 'rotate-180' : ''}`}
          />
        </button>
      )}
    </div>
  )
}
