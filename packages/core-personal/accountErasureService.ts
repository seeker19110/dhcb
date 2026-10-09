// packages/core-personal/accountErasureService.ts — Xoá tài khoản + Xuất toàn bộ dữ liệu.
//
// Đặc tả: docs/specs/2026-10-08-xoa-tai-khoan-va-xuat-du-lieu.md (changelog 0533).
//
// Khác `personErasureService.ts` (chỉ dữ liệu Personal OS theo `person_id`): file này phủ MỌI
// dữ liệu gắn với một TÀI KHOẢN — mọi bảng ở mọi schema có cột trỏ tới người dùng — rồi uỷ phần
// Personal OS cho `personErasureService` chạy chung transaction.
//
// BẤT BIẾN:
//   - `ACCOUNT_TABLES` là MỘT nguồn sự thật: xuất và xoá cùng duyệt nó, nên không thể "xuất có mà
//     xoá sót" hay ngược lại. Test tích hợp đối chiếu nó với `pg_constraint`/`information_schema`
//     ⇒ thêm bảng có cột người dùng mà quên khai ở đây là test đỏ.
//   - Xoá là NGUYÊN TỬ: một transaction; câu nào lỗi ⇒ rollback toàn bộ + ném lỗi. KHÔNG có
//     `.catch` nuốt lỗi nào (sau một câu lỗi Postgres đã huỷ cả transaction — xem changelog 0527).
//   - Chứng từ thanh toán KHÔNG bị xoá, chỉ ẩn danh hoá (nghĩa vụ lưu chứng từ kế toán). Migration
//     0088 đổi khoá ngoại `payments.user_id` thành `on delete restrict`: quên ẩn danh hoá trước khi
//     xoá user ⇒ Postgres chặn, không âm thầm mất chứng từ.
//   - Nhật ký xoá `platform.account_erasure_log` không chứa dữ liệu cá nhân (chỉ mã băm một chiều).
//   - `userId` do nơi gọi suy từ PHIÊN đăng nhập, không bao giờ nhận từ client.

import type { Pool, PoolClient } from 'pg'
import { withTransaction } from '@dhcb/core-db/transaction'
import { NotFoundError } from '@dhcb/core-errors/appError'
import { decryptUserField } from '@dhcb/core-config/userDataCrypto'
import { SEPAY_LATE_GRACE_MS } from '@dhcb/core-billing/sepay'
import { accountSubjectHash, PendingPaymentError } from './accountErasureShared.js'
import {
  assertIdent,
  assertOrderBy,
  beginReadOnlySnapshot,
  erasePersonDataWith,
  IDENT,
  QUALIFIED_IDENT,
  readPersonDataWith,
  type PersonExportData,
} from './personErasureService.js'

// ─── Danh sách bảng (nguồn sự thật duy nhất) ─────────────────────────────────

/** Xoá cả dòng, hoặc giữ dòng nhưng gỡ danh tính. */
type EraseAction =
  | { readonly kind: 'delete' }
  /** `set …` — HẰNG trong code (không bao giờ ghép từ dữ liệu người dùng). */
  | { readonly kind: 'anonymize'; readonly setSql: string }

export interface AccountTableSpec {
  /** `schema.bảng`. */
  readonly table: string
  /** Cột trỏ tới người dùng (uuid) — hoặc cột email khi `match = 'email'`. */
  readonly userColumn: string
  /** So khớp theo id người dùng, hay theo email (không phân biệt hoa thường). */
  readonly match: 'user_id' | 'email'
  readonly erase: EraseAction
  /** Tên mục trong JSON xuất. */
  readonly exportKey: string
  /**
   * Cột XUẤT — liệt kê tường minh. Cố ý BỎ: bí mật xác thực (hash mật khẩu/phiên/mã, secret 2FA,
   * khoá push), mã mời còn hiệu lực, ghi chú nội bộ của admin, và id của NGƯỜI KHÁC.
   */
  readonly columns: readonly string[]
  readonly orderBy: string
  /** Cột mã hoá theo người dùng (`userDataCrypto`) — giải mã khi xuất, bỏ hậu tố `_enc`. */
  readonly encryptedColumns?: readonly string[]
}

const DELETE: EraseAction = { kind: 'delete' }

/**
 * Mọi (bảng, cột người dùng) — đối chiếu schema thật sau migration 0088.
 *
 * THỨ TỰ = THỨ TỰ CHẠY. Bảng con trước bảng cha khi có khoá ngoại giữa chúng (vd vị trí/thành
 * viên trước chuyến đi), ẩn danh hoá `payments` trước khi xoá `public.users` (FK restrict).
 * `personal.persons` (+ 21 bảng theo `person_id`) KHÔNG nằm ở đây — uỷ cho `personErasureService`.
 */
export const ACCOUNT_TABLES = [
  // ── location ──
  {
    table: 'location.positions',
    userColumn: 'user_id',
    match: 'user_id',
    erase: DELETE,
    exportKey: 'locationPositions',
    columns: [
      'session_id',
      'lat',
      'lng',
      'accuracy_m',
      'heading_deg',
      'speed_mps',
      'battery_pct',
      'updated_at',
    ],
    orderBy: 'updated_at, session_id',
  },
  {
    table: 'location.consent_log',
    userColumn: 'user_id',
    match: 'user_id',
    erase: DELETE,
    exportKey: 'locationConsentLog',
    columns: ['id', 'session_id', 'action', 'created_at'],
    orderBy: 'created_at, id',
  },
  {
    table: 'location.session_members',
    userColumn: 'user_id',
    match: 'user_id',
    erase: DELETE,
    exportKey: 'locationSessionMemberships',
    columns: ['session_id', 'sharing_enabled', 'precision_mode', 'joined_at', 'left_at'],
    orderBy: 'joined_at, session_id',
  },
  {
    // Chuyến do người này TẠO: xoá chuyến kéo theo (cascade) thành viên/vị trí của chuyến đó —
    // giống khi chủ chuyến bấm kết thúc. `invite_code` không xuất (mã mời còn hiệu lực).
    table: 'location.sessions',
    userColumn: 'owner_id',
    match: 'user_id',
    erase: DELETE,
    exportKey: 'locationSessionsOwned',
    columns: [
      'id',
      'name',
      'meet_lat',
      'meet_lng',
      'meet_label',
      'alert_radius_m',
      'expires_at',
      'ended_at',
      'created_at',
    ],
    orderBy: 'created_at, id',
  },
  // ── chat ──
  {
    table: 'chat.moderation_events',
    userColumn: 'user_id',
    match: 'user_id',
    erase: DELETE,
    exportKey: 'chatModerationEvents',
    columns: ['id', 'message_id', 'severity', 'matched', 'action', 'created_at'],
    orderBy: 'created_at, id',
  },
  {
    // Phòng chat CHUNG với người khác: không xoá dòng (giữ mạch hội thoại của người kia), thay nội
    // dung bằng "[đã xoá]", gỡ người gửi và đặt `deleted_at` — đúng cơ chế "xoá tin" hiện có
    // (`chatService.deleteMessage`), nên tin biến khỏi danh sách như mọi tin đã xoá.
    table: 'chat.messages',
    userColumn: 'sender_id',
    match: 'user_id',
    erase: {
      kind: 'anonymize',
      setSql: `content = '[đã xoá]', content_clean = null, moderation_flags = null,
               sender_id = null, deleted_at = coalesce(deleted_at, now())`,
    },
    exportKey: 'chatMessagesSent',
    columns: ['id', 'room_id', 'content', 'is_blocked', 'created_at', 'deleted_at'],
    orderBy: 'created_at, id',
  },
  {
    table: 'chat.room_members',
    userColumn: 'user_id',
    match: 'user_id',
    erase: DELETE,
    exportKey: 'chatRoomMemberships',
    columns: ['room_id', 'joined_at', 'last_read_at'],
    orderBy: 'joined_at, room_id',
  },
  {
    table: 'chat.rooms',
    userColumn: 'created_by',
    match: 'user_id',
    erase: { kind: 'anonymize', setSql: 'created_by = null' },
    exportKey: 'chatRoomsCreated',
    columns: ['id', 'is_group', 'created_at'],
    orderBy: 'created_at, id',
  },
  // ── english ──
  {
    table: 'english.challenge_entries',
    userColumn: 'user_id',
    match: 'user_id',
    erase: DELETE,
    exportKey: 'englishChallengeEntries',
    columns: [
      'id',
      'day',
      'challenge_round',
      'challenge_day',
      'topic_day',
      'transcript',
      'feedback',
      'duration_sec',
      'word_count',
      'created_at',
    ],
    orderBy: 'day, id',
  },
  {
    table: 'english.chat_sessions',
    userColumn: 'user_id',
    match: 'user_id',
    erase: DELETE,
    exportKey: 'englishChatSessions',
    columns: ['id', 'situation', 'level', 'messages', 'created_at'],
    orderBy: 'created_at, id',
  },
  {
    table: 'english.learning_progress',
    userColumn: 'user_id',
    match: 'user_id',
    erase: DELETE,
    exportKey: 'englishLearningProgress',
    columns: [
      'learned',
      'hard',
      'srs',
      'cefr_grammar',
      'cefr_dialogues',
      'cefr_unlocked',
      'cefr_unlocked_grandfathered',
      'cefr_exams',
      'placement',
      'weekly_goal',
      'achievements',
      'settings',
      'streak_freeze_dates',
      'version',
      'client_updated_at',
      'updated_at',
    ],
    orderBy: 'updated_at',
  },
  {
    table: 'english.mistakes',
    userColumn: 'user_id',
    match: 'user_id',
    erase: DELETE,
    exportKey: 'englishMistakes',
    columns: [
      'id',
      'subject_id',
      'dedupe_key',
      'wrong',
      'corrected',
      'explanation',
      'source',
      'dir',
      'count',
      'review_count',
      'last_reviewed_at',
      'attempt_id',
      'content_id',
      'created_at',
      'updated_at',
    ],
    orderBy: 'created_at, id',
  },
  {
    table: 'english.speaking_sessions',
    userColumn: 'user_id',
    match: 'user_id',
    erase: DELETE,
    exportKey: 'englishSpeakingSessions',
    columns: ['id', 'situation', 'level', 'messages', 'created_at'],
    orderBy: 'created_at, id',
  },
  {
    table: 'english.tutor_feedback',
    userColumn: 'user_id',
    match: 'user_id',
    erase: DELETE,
    exportKey: 'englishTutorFeedback',
    columns: ['id', 'source', 'user_input', 'ai_feedback', 'created_at'],
    orderBy: 'created_at, id',
  },
  {
    table: 'english.user_profile',
    userColumn: 'user_id',
    match: 'user_id',
    erase: DELETE,
    exportKey: 'englishUserProfile',
    columns: ['user_level', 'goal', 'daily_minutes'],
    orderBy: 'user_id',
  },
  {
    table: 'english.writing_submissions',
    userColumn: 'user_id',
    match: 'user_id',
    erase: DELETE,
    exportKey: 'englishWritingSubmissions',
    columns: ['id', 'essay_prompt', 'essay', 'feedback', 'submitted_at'],
    orderBy: 'submitted_at, id',
  },
  // ── personal (theo user_id — Personal OS theo person_id uỷ riêng ở dưới) ──
  {
    // Hồ sơ năng lực ẨN (Luật số 1): xuất NGUYÊN câu trả lời của chính người dùng, hai câu tự do
    // giải mã về chữ họ đã viết. Tệp tải về, giao diện KHÔNG hiển thị — xem đặc tả §③ "Luật số 1".
    table: 'personal.intake',
    userColumn: 'user_id',
    match: 'user_id',
    erase: DELETE,
    exportKey: 'intake',
    columns: [
      'focus',
      'last_learned',
      'extra_hour_enc',
      'flow_activity_enc',
      'suggested_task_id',
      'chosen_task_id',
      'task_chosen_at',
      'task_done_at',
      'completed_at',
      'created_at',
      'updated_at',
    ],
    orderBy: 'created_at',
    encryptedColumns: ['extra_hour_enc', 'flow_activity_enc'],
  },
  {
    table: 'personal.learner_intent',
    userColumn: 'user_id',
    match: 'user_id',
    erase: DELETE,
    exportKey: 'learnerIntent',
    columns: [
      'subject_ids',
      'purpose',
      'time_budget',
      'level',
      'grade',
      'schema_version',
      'created_at',
      'updated_at',
    ],
    orderBy: 'created_at',
  },
  // ── platform ──
  {
    table: 'platform.completion_evidence',
    userColumn: 'user_id',
    match: 'user_id',
    erase: DELETE,
    exportKey: 'completionEvidence',
    columns: [
      'id',
      'subject_id',
      'content_id',
      'course_id',
      'activity_kind',
      'attempt_id',
      'evidence_kind',
      'correct',
      'total',
      'ratio',
      'passed',
      'content_version',
      'answers',
      'client_at',
      'server_at',
    ],
    orderBy: 'server_at, id',
  },
  {
    table: 'platform.completion_state',
    userColumn: 'user_id',
    match: 'user_id',
    erase: DELETE,
    exportKey: 'completionState',
    columns: [
      'subject_id',
      'content_id',
      'status',
      'best_ratio',
      'last_ratio',
      'attempts',
      'completed_at',
      'updated_at',
    ],
    orderBy: 'subject_id, content_id',
  },
  {
    table: 'platform.feature_state',
    userColumn: 'user_id',
    match: 'user_id',
    erase: DELETE,
    exportKey: 'featureState',
    columns: ['feature', 'state', 'updated_at'],
    orderBy: 'feature',
  },
  // ── programming ──
  {
    table: 'programming.learner_state',
    userColumn: 'user_id',
    match: 'user_id',
    erase: DELETE,
    exportKey: 'programmingLearnerState',
    columns: ['current_level', 'project_track', 'created_at', 'updated_at'],
    orderBy: 'created_at',
  },
  {
    table: 'programming.lesson_progress',
    userColumn: 'user_id',
    match: 'user_id',
    erase: DELETE,
    exportKey: 'programmingLessonProgress',
    columns: ['lesson_id', 'status', 'completed_at', 'version', 'client_updated_at', 'updated_at'],
    orderBy: 'lesson_id',
  },
  {
    table: 'programming.path_artifacts',
    userColumn: 'user_id',
    match: 'user_id',
    erase: DELETE,
    exportKey: 'programmingPathArtifacts',
    columns: ['id', 'path_id', 'phase_id', 'url', 'note', 'created_at'],
    orderBy: 'created_at, id',
  },
  {
    table: 'programming.path_progress',
    userColumn: 'user_id',
    match: 'user_id',
    erase: DELETE,
    exportKey: 'programmingPathProgress',
    columns: ['path_id', 'stage_id', 'status', 'updated_at'],
    orderBy: 'path_id, stage_id',
  },
  {
    table: 'programming.project_files',
    userColumn: 'user_id',
    match: 'user_id',
    erase: DELETE,
    exportKey: 'programmingProjectFiles',
    columns: ['path', 'content', 'updated_at'],
    orderBy: 'path',
  },
  {
    table: 'programming.project_snapshots',
    userColumn: 'user_id',
    match: 'user_id',
    erase: DELETE,
    exportKey: 'programmingProjectSnapshots',
    columns: ['id', 'milestone', 'files', 'created_at'],
    orderBy: 'created_at, id',
  },
  {
    table: 'programming.spec_enrollment',
    userColumn: 'user_id',
    match: 'user_id',
    erase: DELETE,
    exportKey: 'programmingSpecEnrollment',
    columns: ['spec_id', 'role', 'started_at', 'updated_at'],
    orderBy: 'spec_id',
  },
  {
    table: 'programming.spec_stage_progress',
    userColumn: 'user_id',
    match: 'user_id',
    erase: DELETE,
    exportKey: 'programmingSpecStageProgress',
    columns: ['spec_id', 'stage_id', 'status', 'completed_at', 'updated_at'],
    orderBy: 'spec_id, stage_id',
  },
  // ── public: học tập, phần thưởng, đếm lượt ──
  {
    table: 'public.achievement_claims',
    userColumn: 'user_id',
    match: 'user_id',
    erase: DELETE,
    exportKey: 'achievementClaims',
    columns: ['achievement_id', 'claimed_at'],
    orderBy: 'claimed_at, achievement_id',
  },
  {
    // Sự kiện phễu: gỡ `user_id` là hết dữ liệu cá nhân; giữ dòng cho số liệu tổng hợp (đúng ý
    // khoá ngoại gốc `on delete set null`).
    table: 'public.analytics_events',
    userColumn: 'user_id',
    match: 'user_id',
    erase: { kind: 'anonymize', setSql: 'user_id = null' },
    exportKey: 'analyticsEvents',
    columns: ['id', 'event', 'ref_code', 'utm_source', 'path', 'created_at'],
    orderBy: 'created_at, id',
  },
  {
    table: 'public.companion_invites',
    userColumn: 'learner_id',
    match: 'user_id',
    erase: DELETE,
    exportKey: 'companionInvitesCreated',
    columns: ['expires_at', 'used_at', 'created_at'],
    orderBy: 'created_at',
  },
  {
    // Mã mời của NGƯỜI HỌC KHÁC mà người này đã dùng: giữ dòng của họ, gỡ người dùng.
    table: 'public.companion_invites',
    userColumn: 'used_by',
    match: 'user_id',
    erase: { kind: 'anonymize', setSql: 'used_by = null' },
    exportKey: 'companionInvitesUsed',
    columns: ['used_at', 'created_at'],
    orderBy: 'used_at',
  },
  {
    table: 'public.companion_links',
    userColumn: 'learner_id',
    match: 'user_id',
    erase: DELETE,
    exportKey: 'companionLinksAsLearner',
    columns: ['id', 'relation', 'last_report_at', 'created_at'],
    orderBy: 'created_at, id',
  },
  {
    table: 'public.companion_links',
    userColumn: 'watcher_id',
    match: 'user_id',
    erase: DELETE,
    exportKey: 'companionLinksAsWatcher',
    columns: ['id', 'relation', 'last_report_at', 'created_at'],
    orderBy: 'created_at, id',
  },
  {
    table: 'public.daily_plan_completions',
    userColumn: 'user_id',
    match: 'user_id',
    erase: DELETE,
    exportKey: 'dailyPlanCompletions',
    columns: ['id', 'action_kind', 'planner_version', 'source', 'occurred_at', 'evidence'],
    orderBy: 'occurred_at, id',
  },
  {
    table: 'public.daily_usage',
    userColumn: 'user_id',
    match: 'user_id',
    erase: DELETE,
    exportKey: 'dailyUsage',
    columns: [
      'day',
      'subject',
      'chat_count',
      'writing_count',
      'speaking_count',
      'stt_count',
      'learn_count',
      'pronounce_count',
      'code_feedback_count',
    ],
    orderBy: 'day, subject',
  },
  {
    table: 'public.email_reminders',
    userColumn: 'user_id',
    match: 'user_id',
    erase: DELETE,
    exportKey: 'emailReminders',
    columns: ['last_sent_at'],
    orderBy: 'last_sent_at',
  },
  {
    table: 'public.email_verifications',
    userColumn: 'user_id',
    match: 'user_id',
    erase: DELETE,
    exportKey: 'emailVerifications',
    columns: ['expires_at', 'attempts', 'last_sent_at'],
    orderBy: 'last_sent_at',
  },
  {
    table: 'public.entitlements',
    userColumn: 'user_id',
    match: 'user_id',
    erase: DELETE,
    exportKey: 'entitlements',
    columns: ['product', 'tier', 'source', 'granted_at', 'expires_at'],
    orderBy: 'granted_at, product',
  },
  {
    table: 'public.exam_plans',
    userColumn: 'user_id',
    match: 'user_id',
    erase: DELETE,
    exportKey: 'examPlans',
    columns: [
      'id',
      'exam_kind',
      'exam_date',
      'target_label',
      'scope_items',
      'daily_cap_items',
      'rest_days',
      'status',
      'created_at',
      'updated_at',
    ],
    orderBy: 'created_at, id',
  },
  {
    table: 'public.free_daily_credit',
    userColumn: 'user_id',
    match: 'user_id',
    erase: DELETE,
    exportKey: 'freeDailyCredit',
    columns: ['day', 'subject', 'bonus_earned', 'credits_spent'],
    orderBy: 'day, subject',
  },
  {
    // Quan hệ bạn bè hai chiều: id của NGƯỜI KIA không xuất.
    table: 'public.friendships',
    userColumn: 'user_id_a',
    match: 'user_id',
    erase: DELETE,
    exportKey: 'friendshipsA',
    columns: ['id', 'created_at'],
    orderBy: 'created_at, id',
  },
  {
    table: 'public.friendships',
    userColumn: 'user_id_b',
    match: 'user_id',
    erase: DELETE,
    exportKey: 'friendshipsB',
    columns: ['id', 'created_at'],
    orderBy: 'created_at, id',
  },
  {
    table: 'public.identities',
    userColumn: 'user_id',
    match: 'user_id',
    erase: DELETE,
    exportKey: 'linkedIdentities',
    columns: ['provider', 'provider_user_id', 'email', 'linked_at'],
    orderBy: 'linked_at, provider',
  },
  {
    table: 'public.password_resets',
    userColumn: 'user_id',
    match: 'user_id',
    erase: DELETE,
    exportKey: 'passwordResets',
    columns: ['id', 'expires_at', 'used_at', 'created_at'],
    orderBy: 'created_at, id',
  },
  {
    // CHỨNG TỪ KẾ TOÁN — ẩn danh hoá, KHÔNG xoá. Đơn chưa trả (`pending`) không còn chủ ⇒
    // `expired` để webhook không thể cấp gói cho ai. Giữ: mọi cột còn lại (xem đặc tả §③).
    table: 'public.payments',
    userColumn: 'user_id',
    match: 'user_id',
    erase: {
      kind: 'anonymize',
      setSql: `user_id = null, anonymized_at = now(),
               status = case when status = 'pending' then 'expired' else status end`,
    },
    exportKey: 'payments',
    columns: [
      'id',
      'plan',
      'cycle',
      'years',
      'amount_vnd',
      'provider',
      'payment_code',
      'provider_txn_id',
      'status',
      'created_at',
      'expires_at',
      'paid_at',
    ],
    orderBy: 'created_at, id',
  },
  {
    table: 'public.push_subscriptions',
    userColumn: 'user_id',
    match: 'user_id',
    erase: DELETE,
    exportKey: 'pushSubscriptions',
    columns: ['id', 'remind_hour', 'created_at'],
    orderBy: 'created_at, id',
  },
  {
    table: 'public.quest_claims',
    userColumn: 'user_id',
    match: 'user_id',
    erase: DELETE,
    exportKey: 'questClaims',
    columns: ['quest_key', 'last_claimed_at'],
    orderBy: 'quest_key',
  },
  {
    // Giới thiệu bạn: `device_hash` (dấu vân tay thiết bị) và id người kia không xuất.
    table: 'public.referrals',
    userColumn: 'referrer_id',
    match: 'user_id',
    erase: DELETE,
    exportKey: 'referralsMade',
    columns: ['id', 'rewarded_at', 'created_at'],
    orderBy: 'created_at, id',
  },
  {
    table: 'public.referrals',
    userColumn: 'referee_id',
    match: 'user_id',
    erase: DELETE,
    exportKey: 'referralsReceived',
    columns: ['id', 'rewarded_at', 'created_at'],
    orderBy: 'created_at, id',
  },
  {
    // Phiên đăng nhập — xoá ở đây là "huỷ mọi phiên" trong CÙNG transaction.
    table: 'public.sessions',
    userColumn: 'user_id',
    match: 'user_id',
    erase: DELETE,
    exportKey: 'sessions',
    columns: ['expires', 'stepup_until'],
    orderBy: 'expires',
  },
  {
    // Lượt duyệt chuyên môn bài STEM (việc của người duyệt, không phải dữ liệu học): giữ hồ sơ
    // duyệt, gỡ danh tính. Chữ ký thay bằng nhãn theo `id` để vẫn qua ràng buộc CHECK (bản
    // `nguoi-duyet` bắt buộc có chữ ký) và unique `(lesson_id, nguoi_duyet, loai)`.
    table: 'public.stem_lesson_reviews',
    userColumn: 'user_id',
    match: 'user_id',
    erase: {
      kind: 'anonymize',
      setSql: `user_id = null,
               nguoi_duyet = case when nguoi_duyet is null then null else 'đã xoá #' || id::text end`,
    },
    exportKey: 'stemLessonReviews',
    columns: [
      'id',
      'lesson_id',
      'mon',
      'loai',
      'nguoi_duyet',
      'phien_ban_tieu_chi',
      'tieu_chi',
      'ghi_chu',
      'tao_luc',
      'cap_nhat_luc',
    ],
    orderBy: 'tao_luc, id',
  },
  {
    table: 'public.sync_conflicts',
    userColumn: 'user_id',
    match: 'user_id',
    erase: DELETE,
    exportKey: 'syncConflicts',
    columns: [
      'id',
      'doc_kind',
      'doc_id',
      'field',
      'base',
      'local_doc',
      'remote_doc',
      'content_version',
      'keep',
      'created_at',
      'resolved_at',
    ],
    orderBy: 'created_at, id',
  },
  {
    table: 'public.sync_receipts',
    userColumn: 'user_id',
    match: 'user_id',
    erase: DELETE,
    exportKey: 'syncReceipts',
    columns: ['attempt_id', 'endpoint', 'response', 'created_at'],
    orderBy: 'created_at, attempt_id',
  },
  {
    // Chỉ xuất trạng thái — secret TOTP tuyệt đối không ra khỏi server.
    table: 'public.user_2fa',
    userColumn: 'user_id',
    match: 'user_id',
    erase: DELETE,
    exportKey: 'twoFactor',
    columns: ['enabled_at', 'created_at'],
    orderBy: 'created_at',
  },
  {
    table: 'public.user_2fa_recovery_codes',
    userColumn: 'user_id',
    match: 'user_id',
    erase: DELETE,
    exportKey: 'twoFactorRecoveryCodes',
    columns: ['id', 'used_at'],
    orderBy: 'id',
  },
  {
    // Góp ý do chính người này gửi; `admin_notes` là ghi chú nội bộ — không xuất.
    table: 'public.user_feedback',
    userColumn: 'user_id',
    match: 'user_id',
    erase: DELETE,
    exportKey: 'feedback',
    columns: [
      'id',
      'category',
      'rating',
      'title',
      'message',
      'contact_email',
      'context_info',
      'status',
      'created_at',
      'updated_at',
    ],
    orderBy: 'created_at, id',
  },
  {
    table: 'public.weekly_ai_credit',
    userColumn: 'user_id',
    match: 'user_id',
    erase: DELETE,
    exportKey: 'weeklyAiCredit',
    columns: ['week_start', 'credit', 'last_bonus_day'],
    orderBy: 'week_start',
  },
  {
    // Nhật ký kiểm tra hệ thống do ADMIN bấm: không gắn user_id, chỉ lưu email ⇒ khớp theo email.
    table: 'public.feature_status_checks',
    userColumn: 'triggered_by_email',
    match: 'email',
    erase: { kind: 'anonymize', setSql: 'triggered_by_email = null' },
    exportKey: 'featureStatusChecksTriggered',
    columns: ['id', 'run_at', 'triggered_by', 'overall_status'],
    orderBy: 'run_at, id',
  },
  {
    // Hồ sơ hiển thị (tên, gói, nhóm tuổi…) — khoá chính là id người dùng.
    table: 'public.profiles',
    userColumn: 'id',
    match: 'user_id',
    erase: DELETE,
    exportKey: 'profile',
    columns: [
      'name',
      'nickname',
      'age_group',
      'user_level',
      'goal',
      'daily_minutes',
      'onboarded',
      'league_opt_in',
      'plan',
      'plan_expires_at',
      'is_founder',
      'referral_code',
      'friend_code',
      'trial_granted_at',
      'signup_trial_granted_at',
      'created_at',
    ],
    orderBy: 'created_at',
  },
] as const satisfies readonly AccountTableSpec[]

export type AccountExportKey = (typeof ACCOUNT_TABLES)[number]['exportKey']

/** Personal OS — một dòng `personal.persons` mỗi người dùng; xoá/xuất uỷ cho personErasureService. */
export const PERSONAL_OS_DELEGATE = { table: 'personal.persons', userColumn: 'user_id' } as const

/**
 * Cột có dữ liệu người dùng mà CỐ Ý không xoá/ẩn danh — kèm lý do. Test tích hợp coi các cột này
 * là "đã khai báo".
 */
export const ACCOUNT_KEPT_COLUMNS = [
  {
    table: 'public.vip_whitelist',
    column: 'email',
    reason:
      'Danh sách email do ADMIN nhập để cấp VIP — dữ liệu quản trị, admin tự gỡ ở /admin; xoá tự động sẽ đổi quyết định của admin.',
  },
] as const

/** Cột xuất của chính bảng tài khoản — KHÔNG có `password_hash`. */
const USER_EXPORT_COLUMNS = ['id', 'email', 'email_verified', 'created_at'] as const

/** Ghi chú đi kèm bản xuất: nói rõ phần nào cố ý không có, để người nhận không tưởng là thiếu. */
export const EXPORT_NOTES: readonly string[] = [
  'Bản xuất này gồm mọi dữ liệu Đồng Hành Cùng Bạn lưu về tài khoản của bạn tại thời điểm xuất.',
  'Cố ý KHÔNG xuất bí mật xác thực: mật khẩu (dạng băm), mã phiên đăng nhập, secret và mã khôi phục 2FA, mã đặt lại mật khẩu/xác minh email, khoá nhận thông báo đẩy, mã mời còn hiệu lực.',
  'Không xuất id hay dữ liệu của NGƯỜI KHÁC (bạn bè, người thân theo dõi, người giới thiệu, tin nhắn người khác gửi).',
  'Hai câu trả lời tự do của mục "intake" được lưu mã hoá; bản xuất đã giải mã về đúng chữ bạn viết.',
  'Thời gian theo ISO 8601 (UTC).',
]

// ─── Kiểu kết quả ─────────────────────────────────────────────────────────────

export type ExportRow = Record<string, unknown>

export interface AccountExportData {
  format: 'dhcb-account-export'
  formatVersion: 1
  exportedAt: string
  userId: string
  notes: readonly string[]
  account: ExportRow
  tables: Record<AccountExportKey, ExportRow[]>
  personalOs: PersonExportData | null
}

export interface TableCount {
  action: 'delete' | 'anonymize'
  rows: number
}

export interface DeleteAccountResult {
  erasedAt: string
  erasureLogId: string
  /** `schema.bảng.cột` ⇒ số dòng — đúng thứ ghi vào nhật ký. */
  tableCounts: Record<string, TableCount>
  recordsDeleted: number
  recordsAnonymized: number
  personErasureLogId: string | null
}

// ─── Tiện ích ─────────────────────────────────────────────────────────────────

// `accountSubjectHash` sống ở accountErasureShared.ts (handler cần nó cả khi test mock service);
// re-export để nơi gọi cũ không đổi.
export { accountSubjectHash }

/** `extra_hour_enc` → `extra_hour`. */
function decryptedKey(column: string): string {
  return column.endsWith('_enc') ? column.slice(0, -'_enc'.length) : column
}

function whereClause(spec: AccountTableSpec): string {
  const col = assertIdent(spec.userColumn, IDENT)
  return spec.match === 'email' ? `lower(${col}) = lower($1)` : `${col} = $1`
}

async function decryptRow(
  userId: string,
  row: ExportRow,
  encrypted: readonly string[],
): Promise<ExportRow> {
  const out: ExportRow = {}
  for (const [key, value] of Object.entries(row)) {
    if (encrypted.includes(key)) {
      // Lỗi giải mã (thiếu khoá…) ⇒ NÉM — không trả bản xuất mang ciphertext hay bỏ trống im lặng.
      out[decryptedKey(key)] =
        typeof value === 'string' ? await decryptUserField(userId, value) : value
    } else {
      out[key] = value
    }
  }
  return out
}

// ─── Export ───────────────────────────────────────────────────────────────────

async function readAccount(client: PoolClient, userId: string): Promise<AccountExportData> {
  // Câu ĐẦU của transaction: ảnh chụp nhất quán + không thể vô tình ghi.
  await beginReadOnlySnapshot(client)

  const userCols = USER_EXPORT_COLUMNS.map((c) => assertIdent(c, IDENT)).join(', ')
  const userRes = await client.query<ExportRow & { email: string }>(
    `select ${userCols} from public.users where id = $1`,
    [userId],
  )
  const account = userRes.rows[0]
  if (!account) throw new NotFoundError('Không tìm thấy tài khoản')

  const tables: Partial<Record<AccountExportKey, ExportRow[]>> = {}
  for (const spec of ACCOUNT_TABLES as readonly AccountTableSpec[]) {
    const table = assertIdent(spec.table, QUALIFIED_IDENT)
    const cols = spec.columns.map((c) => assertIdent(c, IDENT)).join(', ')
    const param = spec.match === 'email' ? account.email : userId
    const res = await client.query<ExportRow>(
      `select ${cols} from ${table} where ${whereClause(spec)} order by ${assertOrderBy(spec.orderBy)}`,
      [param],
    )
    const encrypted = spec.encryptedColumns ?? []
    const rows =
      encrypted.length > 0
        ? await Promise.all(res.rows.map((row) => decryptRow(userId, row, encrypted)))
        : res.rows
    tables[spec.exportKey as AccountExportKey] = rows
  }

  const personRes = await client.query<{ id: string }>(
    'select id from personal.persons where user_id = $1',
    [userId],
  )
  const personId = personRes.rows[0]?.id
  const personalOs = personId ? await readPersonDataWith(client, personId) : null

  return {
    format: 'dhcb-account-export',
    formatVersion: 1,
    exportedAt: new Date().toISOString(),
    userId,
    notes: EXPORT_NOTES,
    account,
    tables: tables as Record<AccountExportKey, ExportRow[]>,
    personalOs,
  }
}

/**
 * Gom MỌI dữ liệu của tài khoản thành một bản xuất. Bất kỳ câu nào lỗi ⇒ NÉM (không trả bản xuất
 * thiếu). Nơi gọi phải xác thực + xác minh lại danh tính và lấy userId từ phiên.
 */
export async function exportAccountData(pool: Pool, userId: string): Promise<AccountExportData> {
  return withTransaction(pool, (client) => readAccount(client, userId))
}

// ─── Delete ───────────────────────────────────────────────────────────────────

/**
 * Đơn `pending` còn có thể được webhook SePay tự cấp gói: chưa quá `expires_at` + ân hạn
 * `SEPAY_LATE_GRACE_MS` — ĐÚNG điều kiện webhook dùng (payment-webhook.ts). So bằng giờ của CSDL.
 */
const LIVE_PENDING_PAYMENT_SQL = `select 1 from public.payments
   where user_id = $1 and status = 'pending'
     and expires_at > now() - make_interval(secs => $2::double precision)
   limit 1`

/**
 * Người dùng còn đơn chờ trả "sống" không. Nhận Pool hoặc PoolClient: handler gọi trước để báo
 * sớm (không trừ lượt xác minh), `deleteAccount` gọi LẠI trong transaction — lần đó mới là chốt.
 */
export async function hasLivePendingPayment(
  db: Pool | PoolClient,
  userId: string,
): Promise<boolean> {
  const res = await db.query(LIVE_PENDING_PAYMENT_SQL, [userId, SEPAY_LATE_GRACE_MS / 1000])
  return res.rows.length > 0
}

/**
 * Xoá tài khoản: mọi bảng trong `ACCOUNT_TABLES` (xoá hoặc ẩn danh hoá) + Personal OS + chính dòng
 * `public.users`, ghi nhật ký xoá — MỘT transaction.
 *
 *   - Khoá dòng `public.users` (`for update`) NGAY câu đầu: mọi insert vào bảng có khoá ngoại tới
 *     users phải lấy khoá `key share` trên dòng này ⇒ bị chặn tới khi xoá xong, không có bản ghi
 *     mới lọt vào giữa chừng rồi sống sót (cùng kỹ thuật changelog 0527). Request xoá song song
 *     thứ hai chờ khoá rồi thấy 0 dòng ⇒ NotFoundError.
 *   - Một câu lỗi ⇒ rollback toàn bộ, lỗi được ném lên nguyên vẹn.
 */
export async function deleteAccount(pool: Pool, userId: string): Promise<DeleteAccountResult> {
  return withTransaction(pool, async (client) => {
    const userRes = await client.query<{ id: string; email: string }>(
      'select id, email from public.users where id = $1 for update',
      [userId],
    )
    const user = userRes.rows[0]
    if (!user) throw new NotFoundError('Không tìm thấy tài khoản')

    // Còn đơn chờ trả ⇒ TỪ CHỐI (rà soát 0533). Kiểm SAU khoá dòng users: checkout tạo đơn mới
    // phải lấy `key share` trên dòng này nên bị chặn tới khi transaction xong — không lọt đơn mới.
    if (await hasLivePendingPayment(client, userId)) throw new PendingPaymentError()

    const tableCounts: Record<string, TableCount> = {}
    let recordsDeleted = 0
    let recordsAnonymized = 0

    for (const spec of ACCOUNT_TABLES as readonly AccountTableSpec[]) {
      const table = assertIdent(spec.table, QUALIFIED_IDENT)
      const param = spec.match === 'email' ? user.email : userId
      const sql =
        spec.erase.kind === 'delete'
          ? `delete from ${table} where ${whereClause(spec)}`
          : `update ${table} set ${spec.erase.setSql} where ${whereClause(spec)}`
      const res = await client.query(sql, [param])
      const rows = res.rowCount ?? 0
      tableCounts[`${spec.table}.${spec.userColumn}`] = { action: spec.erase.kind, rows }
      if (spec.erase.kind === 'delete') recordsDeleted += rows
      else recordsAnonymized += rows
    }

    // Personal OS (21 bảng theo person_id + persons) — CÙNG transaction.
    const personRes = await client.query<{ id: string }>(
      'select id from personal.persons where user_id = $1',
      [userId],
    )
    let personErasureLogId: string | null = null
    let personRows = 0
    const personId = personRes.rows[0]?.id
    if (personId) {
      const erased = await erasePersonDataWith(client, personId, 'self')
      personErasureLogId = erased.erasureLogId
      personRows = erased.recordsDeletedCount
    }
    tableCounts[`${PERSONAL_OS_DELEGATE.table}.${PERSONAL_OS_DELEGATE.userColumn}`] = {
      action: 'delete',
      rows: personRows,
    }
    recordsDeleted += personRows

    // Bảng gốc CUỐI CÙNG. Khoá ngoại `payments` là RESTRICT (0088): đơn nào chưa ẩn danh sẽ làm
    // câu này lỗi ⇒ rollback, thay vì âm thầm mất chứng từ.
    const userDel = await client.query('delete from public.users where id = $1', [userId])
    if (userDel.rowCount !== 1) {
      throw new Error(`Xoá public.users trả rowCount=${String(userDel.rowCount)}, mong đợi 1`)
    }
    tableCounts['public.users.id'] = { action: 'delete', rows: 1 }
    recordsDeleted += 1

    const logRes = await client.query<{ id: string; erased_at: Date }>(
      `insert into platform.account_erasure_log
         (subject_hash, initiated_by, table_counts, records_deleted_count, records_anonymized_count,
          person_erasure_log_id)
       values ($1, 'self', $2::jsonb, $3, $4, $5)
       returning id, erased_at`,
      [
        accountSubjectHash(userId),
        JSON.stringify(tableCounts),
        recordsDeleted,
        recordsAnonymized,
        personErasureLogId,
      ],
    )
    const log = logRes.rows[0]
    if (!log) throw new Error('Không ghi được nhật ký xoá tài khoản (account_erasure_log)')

    return {
      erasedAt: new Date(log.erased_at).toISOString(),
      erasureLogId: log.id,
      tableCounts,
      recordsDeleted,
      recordsAnonymized,
      personErasureLogId,
    }
  })
}
