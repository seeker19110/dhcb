// specializations/stageDetailsLoader.ts — Nạp LƯỜI chi tiết một chặng (audit 2026-10-10, đợt E4).
//
// `stageDetails.ts` import tĩnh cả 56 file `details/*` (~800 KB nguồn) — server và test cần trọn
// bộ nên vẫn dùng nó. Giao diện chỉ hiển thị MỘT chặng mỗi lần, nên dùng bộ nạp này: mỗi chặng
// là một chunk riêng, trang chặng chỉ tải đúng file của chặng đang mở.
//
// Thêm chặng mới: thêm 1 dòng vào bảng dưới (cùng lúc với `stageDetails.ts`). Test
// `stageDetailsLoader.test.ts` đỏ nếu hai nơi lệch nhau.
import type { SpecStageDetail } from './stageDetailTypes.js'

type DetailLoader = () => Promise<SpecStageDetail>

const LOADERS: Record<string, DetailLoader> = {
  'web-s1': () => import('./details/web-s1.js').then((m) => m.WEB_S1_DETAIL),
  'mobile-s1': () => import('./details/mobile-s1.js').then((m) => m.MOBILE_S1_DETAIL),
  'backend-s1': () => import('./details/backend-s1.js').then((m) => m.BACKEND_S1_DETAIL),
  'data-s1': () => import('./details/data-s1.js').then((m) => m.DATA_S1_DETAIL),
  'ai-s1': () => import('./details/ai-s1.js').then((m) => m.AI_S1_DETAIL),
  'devops-s1': () => import('./details/devops-s1.js').then((m) => m.DEVOPS_S1_DETAIL),
  'security-s1': () => import('./details/security-s1.js').then((m) => m.SECURITY_S1_DETAIL),
  'systems-s1': () => import('./details/systems-s1.js').then((m) => m.SYSTEMS_S1_DETAIL),
  'game-s1': () => import('./details/game-s1.js').then((m) => m.GAME_S1_DETAIL),
  'embedded-s1': () => import('./details/embedded-s1.js').then((m) => m.EMBEDDED_S1_DETAIL),
  'desktop-s1': () => import('./details/desktop-s1.js').then((m) => m.DESKTOP_S1_DETAIL),
  'architecture-s1': () =>
    import('./details/architecture-s1.js').then((m) => m.ARCHITECTURE_S1_DETAIL),
  'algo-s1': () => import('./details/algo-s1.js').then((m) => m.ALGO_S1_DETAIL),
  'mathforcode-s1': () =>
    import('./details/mathforcode-s1.js').then((m) => m.MATHFORCODE_S1_DETAIL),
  'web-s2': () => import('./details/web-s2.js').then((m) => m.WEB_S2_DETAIL),
  'mobile-s2': () => import('./details/mobile-s2.js').then((m) => m.MOBILE_S2_DETAIL),
  'backend-s2': () => import('./details/backend-s2.js').then((m) => m.BACKEND_S2_DETAIL),
  'data-s2': () => import('./details/data-s2.js').then((m) => m.DATA_S2_DETAIL),
  'ai-s2': () => import('./details/ai-s2.js').then((m) => m.AI_S2_DETAIL),
  'devops-s2': () => import('./details/devops-s2.js').then((m) => m.DEVOPS_S2_DETAIL),
  'security-s2': () => import('./details/security-s2.js').then((m) => m.SECURITY_S2_DETAIL),
  'systems-s2': () => import('./details/systems-s2.js').then((m) => m.SYSTEMS_S2_DETAIL),
  'game-s2': () => import('./details/game-s2.js').then((m) => m.GAME_S2_DETAIL),
  'embedded-s2': () => import('./details/embedded-s2.js').then((m) => m.EMBEDDED_S2_DETAIL),
  'desktop-s2': () => import('./details/desktop-s2.js').then((m) => m.DESKTOP_S2_DETAIL),
  'architecture-s2': () =>
    import('./details/architecture-s2.js').then((m) => m.ARCHITECTURE_S2_DETAIL),
  'algo-s2': () => import('./details/algo-s2.js').then((m) => m.ALGO_S2_DETAIL),
  'mathforcode-s2': () =>
    import('./details/mathforcode-s2.js').then((m) => m.MATHFORCODE_S2_DETAIL),
  'web-s3': () => import('./details/web-s3.js').then((m) => m.WEB_S3_DETAIL),
  'mobile-s3': () => import('./details/mobile-s3.js').then((m) => m.MOBILE_S3_DETAIL),
  'backend-s3': () => import('./details/backend-s3.js').then((m) => m.BACKEND_S3_DETAIL),
  'data-s3': () => import('./details/data-s3.js').then((m) => m.DATA_S3_DETAIL),
  'ai-s3': () => import('./details/ai-s3.js').then((m) => m.AI_S3_DETAIL),
  'devops-s3': () => import('./details/devops-s3.js').then((m) => m.DEVOPS_S3_DETAIL),
  'security-s3': () => import('./details/security-s3.js').then((m) => m.SECURITY_S3_DETAIL),
  'systems-s3': () => import('./details/systems-s3.js').then((m) => m.SYSTEMS_S3_DETAIL),
  'game-s3': () => import('./details/game-s3.js').then((m) => m.GAME_S3_DETAIL),
  'embedded-s3': () => import('./details/embedded-s3.js').then((m) => m.EMBEDDED_S3_DETAIL),
  'desktop-s3': () => import('./details/desktop-s3.js').then((m) => m.DESKTOP_S3_DETAIL),
  'architecture-s3': () =>
    import('./details/architecture-s3.js').then((m) => m.ARCHITECTURE_S3_DETAIL),
  'algo-s3': () => import('./details/algo-s3.js').then((m) => m.ALGO_S3_DETAIL),
  'mathforcode-s3': () =>
    import('./details/mathforcode-s3.js').then((m) => m.MATHFORCODE_S3_DETAIL),
  'web-s4': () => import('./details/web-s4.js').then((m) => m.WEB_S4_DETAIL),
  'mobile-s4': () => import('./details/mobile-s4.js').then((m) => m.MOBILE_S4_DETAIL),
  'backend-s4': () => import('./details/backend-s4.js').then((m) => m.BACKEND_S4_DETAIL),
  'data-s4': () => import('./details/data-s4.js').then((m) => m.DATA_S4_DETAIL),
  'ai-s4': () => import('./details/ai-s4.js').then((m) => m.AI_S4_DETAIL),
  'devops-s4': () => import('./details/devops-s4.js').then((m) => m.DEVOPS_S4_DETAIL),
  'security-s4': () => import('./details/security-s4.js').then((m) => m.SECURITY_S4_DETAIL),
  'systems-s4': () => import('./details/systems-s4.js').then((m) => m.SYSTEMS_S4_DETAIL),
  'game-s4': () => import('./details/game-s4.js').then((m) => m.GAME_S4_DETAIL),
  'embedded-s4': () => import('./details/embedded-s4.js').then((m) => m.EMBEDDED_S4_DETAIL),
  'desktop-s4': () => import('./details/desktop-s4.js').then((m) => m.DESKTOP_S4_DETAIL),
  'architecture-s4': () =>
    import('./details/architecture-s4.js').then((m) => m.ARCHITECTURE_S4_DETAIL),
  'algo-s4': () => import('./details/algo-s4.js').then((m) => m.ALGO_S4_DETAIL),
  'mathforcode-s4': () =>
    import('./details/mathforcode-s4.js').then((m) => m.MATHFORCODE_S4_DETAIL),
}

/** Mã các chặng đã có chi tiết — để test đối chiếu với `SPEC_STAGE_DETAILS`. */
export const LAZY_STAGE_DETAIL_IDS: readonly string[] = Object.keys(LOADERS)

/**
 * Nạp chi tiết một chặng ('web-s2'). `undefined` khi chưa soạn hoặc mã lạ — KHÔNG đoán bừa
 * (cùng hợp đồng với `getSpecStageDetail`). Lỗi tải chunk (mất mạng) thì Promise bị từ chối để
 * giao diện hiện trạng thái lỗi, không lặng lẽ coi là "chưa soạn".
 */
export async function loadSpecStageDetail(stageId: string): Promise<SpecStageDetail | undefined> {
  const id = stageId.trim().toLowerCase()
  const load = Object.hasOwn(LOADERS, id) ? LOADERS[id] : undefined
  return load ? load() : undefined
}
