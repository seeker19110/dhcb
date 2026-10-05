import type { Page } from '@playwright/test'
import {
  SubjectManifestSchema,
  SUBJECT_MANIFEST_SCHEMA_VERSION,
} from '../../packages/core-contracts/subjectManifest'

// Mock API ĐÚNG HÌNH DẠNG DỮ LIỆU THẬT cho cổng a11y (đợt U3, audit UI/UX 2026-09-30 mục C4 + 11).
//
// VÌ SAO CÓ FILE NÀY: `mockLogin()` chỉ chặn vài API nền; các trang Bạn bè, Hồ sơ, Nhiệm vụ,
// Bảng giá, trang môn STEM gọi thêm API riêng. Không có mock, các request đó rơi vào dev server
// (404) → trang vẽ màn lỗi/màn trống, và chính PHẦN TỬ RỚT TƯƠNG PHẢN (nút "Copy link kết bạn",
// mã mời, nút mua "Nâng cấp VIP", tab "AI Giải Bài Tập") KHÔNG BAO GIỜ được vẽ ra lúc quét →
// cổng xanh giả. Mỗi hàm dưới trả đúng các trường mà client đọc, giá trị lấy theo hằng số thật
// của máy chủ (ghi nguồn ở từng hàm) — sửa hợp đồng API thì sửa luôn ở đây.
//
// Không import kiểu từ `apps/dhcb/src/lib/*`: các file đó import alias `@core/*` mà
// tsconfig.e2e.json không có `paths` (cùng lý do ghi ở e2e/programming-home.spec.ts). Riêng
// manifest môn học thì dùng thẳng Zod schema nguồn sự thật (gói core-contracts chỉ phụ thuộc zod).

function json(body: unknown) {
  return { status: 200, contentType: 'application/json', body: JSON.stringify(body) }
}

/** `GET /api/friends` — khớp `FriendsState` ở apps/dhcb/src/lib/friends.ts. */
export async function mockFriendsState(page: Page): Promise<void> {
  await page.route('**/api/friends', (route) =>
    route.fulfill(
      json({
        code: 'K7Q2M9XD',
        friends: [
          { id: 'e2e-friend-0001', name: 'Minh Anh' },
          { id: 'e2e-friend-0002', name: 'Quang Huy' },
        ],
      }),
    ),
  )
}

/**
 * `GET /api/referral` — khớp `ReferralStats` ở apps/dhcb/src/lib/referral.ts; rewardDays/
 * maxRewarded = REFERRAL_REWARD_DAYS/MAX_REWARDED_REFERRALS ở apps/server/src/api/_lib/referral.ts.
 */
const REFERRAL = {
  code: 'DHCB7Q2K',
  rewardedCount: 1,
  pendingCount: 1,
  maxRewarded: 10,
  rewardDays: 7,
}

export async function mockReferralStats(page: Page): Promise<void> {
  await page.route('**/api/referral', (route) => route.fulfill(json(REFERRAL)))
}

/**
 * `GET /api/quests` — khớp `QuestsStatus` ở apps/dhcb/src/lib/quests.ts; số ngày theo hằng số ở
 * apps/server/src/api/_lib/quests.ts (thưởng 0 ngày, streak 5 ngày, hồi 7 ngày).
 */
export async function mockQuestsStatus(page: Page): Promise<void> {
  await page.route('**/api/quests', (route) =>
    route.fulfill(
      json({
        share: { cooldownDays: 7, rewardDays: 0, canClaim: false },
        streak: { current: 2, required: 5, rewardDays: 0, cooldownDays: 7, canClaim: false },
        cefrExams: [
          { level: 'A1', passed: true, claimed: true, rewardDays: 0 },
          { level: 'A2', passed: false, claimed: false, rewardDays: 0 },
        ],
        referral: REFERRAL,
      }),
    ),
  )
}

/**
 * `GET /api/plan-prices` — khớp `PlanPrices` ở apps/dhcb/src/lib/payment.ts; giá gốc theo
 * DEFAULT ở packages/core-billing/prices.ts (30k / 75k / 500k), giảm nhiều năm 10%/năm.
 * Không có giá thì nút mua bị `disabled` — axe BỎ QUA tương phản của phần tử disabled, nên
 * thiếu mock này là cổng không bao giờ đo được nút "Nâng cấp VIP".
 */
export async function mockPlanPrices(page: Page): Promise<void> {
  const entry = (priceVnd: number) => ({
    priceVnd,
    salePriceVnd: null,
    saleUntil: null,
    effectiveVnd: priceVnd,
  })
  await page.route('**/api/plan-prices', (route) =>
    route.fulfill(
      json({
        vip: {
          '10day': entry(30_000),
          month: entry(75_000),
          year: { ...entry(500_000), yearTotals: [500_000, 900_000, 1_050_000] },
        },
        promoPercent: null,
        promoEndsAt: null,
        maxPromoYears: 3,
      }),
    ),
  )
}

/** Ba môn STEM có trang chi tiết `/goc-hoc-tap/<môn>` (khuôn SubjectDetail dùng chung). */
export const STEM_DETAIL_SUBJECTS = ['mathematics', 'physics', 'chemistry'] as const
type StemDetailSubject = (typeof STEM_DETAIL_SUBJECTS)[number]

/**
 * Manifest ba môn — chép từ SUPPORTED_SUBJECTS ở packages/core-learner/subjectRegistry.ts và
 * PARSE QUA CHÍNH `SubjectManifestSchema` (một nguồn sự thật, audit mục 11(d)): lệch hợp đồng
 * là test ném lỗi ngay, không lặng lẽ vẽ màn "dữ liệu không đúng định dạng".
 */
const STEM_MANIFESTS: Record<StemDetailSubject, unknown> = {
  mathematics: {
    id: 'mathematics',
    label: 'Toán học',
    description:
      'Đại số, hình học không gian, giải tích và xác suất thống kê theo chương trình chuẩn',
    category: 'stem',
    taxonomyKind: 'grade_curriculum',
    standardLevels: ['grade_10', 'grade_11', 'grade_12', 'university'],
    questionTypes: [
      'multiple_choice',
      'step_by_step_proof',
      'formula_calculation',
      'graphing_analysis',
    ],
    evaluationModes: ['exact_formula', 'step_analysis', 'discrete_check'],
    schemaVersion: SUBJECT_MANIFEST_SCHEMA_VERSION,
  },
  physics: {
    id: 'physics',
    label: 'Vật lý',
    description: 'Cơ học, nhiệt học, điện từ học, quang học và vật lý lượng tử',
    category: 'stem',
    taxonomyKind: 'grade_curriculum',
    standardLevels: ['grade_10', 'grade_11', 'grade_12', 'university'],
    questionTypes: [
      'multiple_choice',
      'numerical_problem',
      'experiment_simulation',
      'formula_derivation',
    ],
    evaluationModes: ['exact_formula', 'step_analysis', 'discrete_check'],
    schemaVersion: SUBJECT_MANIFEST_SCHEMA_VERSION,
  },
  chemistry: {
    id: 'chemistry',
    label: 'Hóa học',
    description: 'Hóa vô cơ, hóa hữu cơ, phản ứng oxi hóa khử và hóa phân tích',
    category: 'stem',
    taxonomyKind: 'grade_curriculum',
    standardLevels: ['grade_10', 'grade_11', 'grade_12', 'university'],
    questionTypes: [
      'chemical_equation',
      'reaction_mechanism',
      'stoichiometry_problem',
      'multiple_choice',
    ],
    evaluationModes: ['exact_formula', 'step_analysis', 'discrete_check'],
    schemaVersion: SUBJECT_MANIFEST_SCHEMA_VERSION,
  },
}

/** `GET /api/subjects?id=<môn>` — envelope `{ subject }` như apps/dhcb/src/lib/subjectApi.ts đọc. */
export async function mockStemSubjectDetail(page: Page, subjectId: StemDetailSubject) {
  const subject = SubjectManifestSchema.parse(STEM_MANIFESTS[subjectId])
  await page.route('**/api/subjects?id=*', (route) => route.fulfill(json({ subject })))
}
