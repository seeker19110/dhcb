// ──────────────────────────────────────────────────────────────────────
// KHỐI HỌC NHANH — nội dung của 4 tab Hôm nay · Ôn SRS · Từ khó · Kiểm tra
//
// Đặt NGAY DƯỚI "Mốc từ vựng" (VocabMilestone) ở các trang có component đó
// (Từ điển, Học theo lộ trình). DÙNG LẠI component StudyTabs.tsx của trang
// cấp CEFR. Khác trang cấp: KHÔNG giới hạn theo cấp — pool = TOÀN BỘ lộ
// trình học (getLearningPath); không có phần ngữ pháp nên tab Kiểm tra chỉ
// hỏi từ vựng. Giới hạn ngày (tốc độ/ngày, cap) vẫn tính CHUNG toàn app
// (lib/curriculum.ts).
//
// `tab` do trang CHA điều khiển (controlled) — trang Từ điển gộp chung thanh
// tab của khối này với "Tra từ"/"Loại từ" thành 1 lưới 3+3, nên bản thân
// StudyPanel không tự vẽ thanh tab nữa, chỉ báo số badge (SRS/Từ khó) lên
// cho cha qua `onBadges`.
// ──────────────────────────────────────────────────────────────────────

import { useEffect, useMemo, useState } from 'react'
import { TodayLesson, SRSReview, HardWords, QuizTab } from './StudyTabs'
import type { DictEntry, AgeGroup } from '../types'
import { getDifficultWords } from '../lib/vocab'
import { getDueWords } from '../lib/srs'
import { loadCurriculum, isCurriculumReady, getLearningPath } from '../lib/curriculum'
import { useAsyncLoad } from '../lib/useAsyncLoad'
import LoadError from './LoadError'
import {
  LOI_TU_VUNG_VI,
  LOI_TU_VUNG_EN,
  GOI_Y_TU_VUNG_VI,
  GOI_Y_TU_VUNG_EN,
} from '../lib/curriculumMessages'

export type StudyTab = 'today' | 'srs' | 'hard' | 'quiz'

export default function StudyPanel({
  uid,
  isA,
  tab,
  onProgress,
  onBadges,
  ageGroup,
}: {
  uid: string
  isA: boolean
  tab: StudyTab
  // Gọi khi học/ôn xong 1 từ để trang cha cập nhật (vd: "Mốc từ vựng", "Đã học").
  onProgress?: () => void
  // Số badge SRS/Từ khó — cha vẽ badge trên nút tab của mình nên cần số này.
  onBadges?: (b: { srsDue: number; hardCount: number }) => void
  ageGroup?: AgeGroup
}) {
  // Các tab học cần TOÀN BỘ từ điển (nạp động) — gate riêng để hiện trạng thái tải.
  // [changelog 0525] Bản cũ `loadCurriculum().then(() => setReady(true))` không có nhánh lỗi:
  // tải từ điển hỏng là dòng "Đang tải từ vựng…" hiện mãi, không có cách thử lại.
  const { state: curriculumState, retry: retryCurriculum } = useAsyncLoad(loadCurriculum, {
    lang: isA ? 'vi' : 'en',
    errorMessage: isA ? LOI_TU_VUNG_VI : LOI_TU_VUNG_EN,
  })
  const ready = isCurriculumReady() || curriculumState.status === 'ready'
  // Khóa invalidation thủ công: bump() để tính lại badge sau khi học/đánh dấu.
  const [refresh, setRefresh] = useState(0)
  const bump = () => {
    setRefresh((k) => k + 1)
    onProgress?.()
  }

  // Pool = toàn bộ từ trong lộ trình học (mọi cấp + phần mở rộng).
  const pool = useMemo<DictEntry[]>(
    () => (ready ? getLearningPath(ageGroup) : []),
    [ready, ageGroup],
  )

  // Badge trên tab: số từ CẦN ÔN SRS / số từ đã đánh dấu khó.
  // `refresh` là khóa invalidation thủ công (dữ liệu đọc từ localStorage).
  const srsDue = useMemo(
    () => (uid && ready ? getDueWords(uid, pool).length : 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [uid, pool, ready, refresh],
  )
  const hardCount = useMemo(() => {
    if (!uid || !ready) return 0
    const hard = getDifficultWords(uid)
    return pool.filter((w) => hard.has(w.word.toLowerCase())).length
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, pool, ready, refresh])

  useEffect(() => {
    onBadges?.({ srsDue, hardCount })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [srsDue, hardCount])

  // Chờ từ điển nạp xong mới render (dữ liệu nặng)
  if (!ready && curriculumState.status === 'error') {
    return (
      <LoadError
        message={curriculumState.message}
        onRetry={retryCurriculum}
        lang={isA ? 'vi' : 'en'}
        hint={isA ? GOI_Y_TU_VUNG_VI : GOI_Y_TU_VUNG_EN}
      />
    )
  }
  if (!ready) {
    return (
      <div className="glass rounded-xl p-8 text-center animate-fade-in">
        <p className="text-zinc-400 text-sm">{isA ? 'Đang tải từ vựng…' : 'Loading vocabulary…'}</p>
      </div>
    )
  }

  return (
    <>
      {tab === 'today' && <TodayLesson uid={uid} isA={isA} pool={pool} onProgress={bump} />}
      {tab === 'srs' && (
        // levelPool = pool ⇒ không hiện nút lọc "chỉ cấp này" (trang từ điển không chia cấp).
        <SRSReview uid={uid} isA={isA} pool={pool} levelPool={pool} onUpdate={bump} />
      )}
      {tab === 'hard' && <HardWords uid={uid} isA={isA} pool={pool} onUpdate={bump} />}
      {tab === 'quiz' && (
        // Trang từ điển không có phần ngữ pháp ⇒ grammarPool rỗng, không mở lại bài.
        // `sessionScope` riêng ("dictionary") để bài đang dở ở đây không lẫn với bài của một
        // cấp CEFR — hai nơi lấy câu hỏi từ hai vốn từ khác nhau.
        <QuizTab
          uid={uid}
          isA={isA}
          pool={pool}
          grammarPool={[]}
          onOpenLesson={() => {}}
          sessionScope="dictionary"
        />
      )}
    </>
  )
}
