// apps/server/src/routes.ts — Bảng gắn TOÀN BỘ route API (tách từ server.ts ở PR-S3).
// server.ts chỉ còn app/middleware/static/scheduler — thêm endpoint mới thì sửa Ở ĐÂY
// (test gác: api/routes-registered.test.ts đọc file này).
import express from 'express'
import type { Response as ExpressResponse } from 'express'
import {
  HSTS_VALUE,
  PERMISSIONS_POLICY,
  X_XSS_PROTECTION_VALUE,
  CORP_VALUE,
  COOP_VALUE,
  isTrustedMutation,
  getCorsHeaders,
} from '@dhcb/core-auth/security'
import { captureServerException } from './api/_lib/sentry.js'
import { parseRunnerHostnames } from './runnerHost.js'
import { isAppError } from '@dhcb/core-errors/appError'

import ttsHandler from '@dhcb/core-ai/tts'
import aiHandler from '@dhcb/core-ai/ai'
import pronunciationHandler from './api/subjects/english/pronunciation.js'
import sttHandler from '@dhcb/core-ai/stt'
import pushHandler from './api/core/push.js'
import dictionaryHandler from './api/subjects/english/dictionary.js'
import leaderboardHandler from './api/platform/leaderboard.js'
import pronounceAssessHandler from './api/subjects/english/pronounce-assess.js'
import authHandler from '@dhcb/core-auth/auth'
import profileHandler from './api/core/profile.js'
import twoFactorHandler from './api/core/two-factor.js'
import accountHandler from './api/core/account.js'
import intakeHandler from './api/personal/intake.js'
import learnerIntentHandler from './api/personal/learner-intent.js'
import adminIntakeStatsHandler from './api/admin/admin-intake-stats.js'
import progressHandler from './api/core/progress.js'
import cefrAssessmentHandler from './api/subjects/english/cefr-assessment.js'
import usageSummaryHandler from './api/core/usage-summary.js'
import historyHandler from './api/core/history.js'
import challengeHandler from './api/subjects/english/challenge.js'
import mistakesHandler from './api/subjects/english/mistakes.js'
import programmingProgressHandler from './api/subjects/programming/progress.js'
import programmingSpecializationHandler from './api/subjects/programming/specialization.js'
import programmingPathProgressHandler from './api/subjects/programming/pathProgress.js'
import programmingPathQuizHandler from './api/subjects/programming/pathQuiz.js'
import programmingPathArtifactHandler from './api/subjects/programming/pathArtifact.js'
import programmingProjectHandler from './api/subjects/programming/project.js'
import programmingFeedbackHandler from './api/subjects/programming/feedback.js'
import programmingTsCheckHandler from './api/subjects/programming/ts-check.js'
import tutorFeedbackHandler from './api/subjects/english/tutor-feedback.js'
import feedbackHandler from './api/core/feedback.js'
import adminSettingsHandler from './api/admin/admin-settings.js'
import adminStemReviewHandler from './api/admin/admin-stem-review.js'
import appSettingsHandler from './api/platform/app-settings.js'
import adminGrantPlanHandler from './api/admin/admin-grant-plan.js'
import adminVipWhitelistHandler from './api/admin/admin-vip-whitelist.js'
import planFeaturesHandler from './api/billing/plan-features.js'
import adminPlanFeaturesHandler from './api/admin/admin-plan-features.js'
import adminPricePromoHandler from './api/admin/admin-price-promo.js'
import planMarketingHandler from './api/billing/plan-marketing.js'
import adminPlanMarketingHandler from './api/admin/admin-plan-marketing.js'
import analyticsHandler from './api/platform/analytics.js'
import analyticsSummaryHandler from './api/admin/analytics-summary.js'
import adminUsageStatsHandler from './api/admin/admin-usage-stats.js'
import adminUsersHandler from './api/admin/admin-users.js'
import referralHandler from './api/platform/referral.js'
import questsHandler from './api/platform/quests.js'
import achievementsHandler from './api/platform/achievements.js'
import friendsHandler from './api/platform/friends.js'
import chatHandler from './api/core/chat.js'
import locationHandler from './api/platform/location.js'
import companionLinkHandler from './api/personal/companion-link.js'
import examPlanHandler from './api/learning/exam-plan.js'
import adminAchievementRewardsHandler from './api/admin/admin-achievement-rewards.js'
import adminPaymentsHandler from './api/admin/admin-payments.js'
import adminSystemControlHandler from './api/admin/admin-system-control.js'
import adminTtsCacheHandler from './api/admin/admin-tts-cache.js'
import adminReservedNamesHandler from './api/admin/admin-reserved-names.js'
import adminFeedbackHandler from './api/admin/admin-feedback.js'
import adminFeatureStatusHandler from './api/admin/admin-feature-status.js'
import planPricesHandler from './api/billing/plan-prices.js'
import checkoutHandler from './api/billing/checkout.js'
import paymentWebhookHandler from './api/billing/payment-webhook.js'
import paymentStatusHandler from './api/billing/payment-status.js'
import paymentHistoryHandler from './api/billing/payment-history.js'
import paymentCancelHandler from './api/billing/payment-cancel.js'
import avatarVisemesHandler from './api/subjects/english/avatar-visemes.js'
import hubStatsHandler from './api/platform/hub-stats.js'
import personsHandler from './api/personal/persons.js'
import personalFactsHandler from './api/personal/personal-facts.js'
import consentsHandler from './api/personal/consents.js'
import personalPoliciesHandler from './api/personal/personal-policies.js'
import lifeGraphHandler from './api/personal/life-graph.js'
import lifeGoalsHandler from './api/personal/life-goals.js'
import memoriesHandler from './api/personal/memories.js'
import contextPackageHandler from './api/personal/context-package.js'
import proposedActionsHandler from './api/personal/proposed-actions.js'
import companionHandler from './api/personal/companion.js'
import decisionLedgerHandler from './api/personal/decision-ledger.js'
import learningReadModelHandler from './api/learning/learning-read-model.js'
import subjectsHandler from './api/learning/subjects.js'
import workHandler from './api/domains/work.js'
import automationHandler from './api/personal/automation.js'
import healthDeepHandler from './api/platform/healthDeep.js'
import proactiveBriefingHandler from './api/personal/proactive-briefing.js'
import visionSolveHandler from './api/learning/vision-solve.js'
import integrationsHandler from './api/platform/integrations.js'
import subconsciousHandler from './api/personal/subconscious.js'
import ambientVisionHandler from './api/personal/ambient-vision.js'
import a2aHandler from './api/platform/a2a.js'
import neuroAffectiveHandler from './api/personal/neuro-affective.js'
import scenarioHolodeckHandler from './api/learning/scenario-holodeck.js'
import articulatoryPhoneticsHandler from './api/subjects/english/articulatory-phonetics.js'
import workplaceInsightsHandler from './api/learning/workplace-insights.js'
import socraticDiagnosticsHandler from './api/learning/socratic-diagnostics.js'
import echoShadowingHandler from './api/subjects/english/echo-shadowing.js'
import wearablesSyncHandler from './api/platform/wearables-sync.js'
import acousticPhoneticsHandler from './api/subjects/english/acoustic-phonetics.js'
import avatarEmbodimentHandler from './api/platform/avatar-embodiment.js'
import actionCanvasHandler from './api/platform/action-canvas.js'
import neuralCurriculumHandler from './api/learning/neural-curriculum.js'
import meshTelemetryHandler from './api/platform/mesh-telemetry.js'
import proactiveAgentHandler from './api/personal/proactive-agent.js'
import debateArenaHandler from './api/learning/debate-arena.js'
import stemScratchpadHandler from './api/learning/stem-scratchpad.js'
import learningEvidenceHandler from './api/learning/evidence.js'
import metacognitiveReflectionHandler from './api/learning/metacognitive-reflection.js'
import memoryPalaceHandler from './api/learning/memory-palace.js'
import lifeSynthesisHandler from './api/personal/life-synthesis.js'
import agentOrchestratorHandler from './api/platform/agent-orchestrator.js'
import pvpArenaHandler from './api/platform/pvp-arena.js'
import geminiLiveHandler from './api/platform/gemini-live.js'

// Content-Security-Policy dùng chung cho mọi response (API, static, health).
// Đã bỏ các domain KHÔNG còn dùng: cdn.jsdelivr.net (không có script nào tải từ CDN),
// fonts.googleapis.com + fonts.gstatic.com (font Inter đã tự host — xem src/main.tsx).
// Tạm giữ inline/eval cho runtime luyện code; cần chuyển sang origin cách ly trước khi siết.
// Vite không cần các quyền này. Xem docs/security-rollout-2026-09-27.md.
// static.cloudflareinsights.com: script beacon Cloudflare tự chèn khi bật proxy
// (xem docs/cloudflare-setup.md) — cần cho phép cả script-src (tải file) lẫn
// connect-src (báo cáo RUM qua cdn-cgi/rum), nếu không sẽ bị chặn CSP.
// https://accounts.google.com trong script-src: tải script Google Identity Services
// (đăng nhập Google — Giai đoạn B, xem src/lib/auth.ts loadGoogleScript()).
// frame-src https://accounts.google.com: khung One Tap/popup chọn tài khoản Google hiện
// TRONG trang (không có directive này thì rơi về default-src 'self', chặn hẳn khung Google).
// style-src thêm https://accounts.google.com: nút/khung Google Identity Services tự chèn
// thẻ <link> tải stylesheet https://accounts.google.com/gsi/style — thiếu domain này sẽ bị
// CSP chặn (lỗi "violates style-src directive"), khiến nút đăng nhập Google mất style/không hiện.
// https://connect.facebook.net: tải Facebook JS SDK (đăng nhập Facebook, src/lib/auth.ts
// loadFacebookScript()). https://appleid.cdn-apple.com: tải Sign in with Apple JS
// (loadAppleScript()). https://alcdn.msauth.net: tải MSAL.js (đăng nhập Microsoft,
// loadMicrosoftScript()). Cả 3 mở popup (window mới), KHÔNG nhúng iframe trong trang như
// Google One Tap, nên KHÔNG cần thêm vào frame-src.
// frame-src thêm origin trang chạy code học viên (`run.…`, RUNNER_HOSTNAME — xem runnerHost.ts):
// app nhúng runner bằng iframe ẩn (lib/runnerBridge.ts) và khung xem trang bài DOM
// (HtmlPreview → preview.html). Thiếu thì CSP chặn iframe, không bài code nào chạy được.
export function buildAppCsp(runnerOrigins: readonly string[]): string {
  const frameSrc = ['https://accounts.google.com', ...runnerOrigins].join(' ')
  return `default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://static.cloudflareinsights.com https://accounts.google.com https://connect.facebook.net https://appleid.cdn-apple.com https://alcdn.msauth.net; style-src 'self' 'unsafe-inline' https://accounts.google.com; font-src 'self' data:; img-src 'self' data: https:; media-src 'self' blob: https:; connect-src 'self' https:; frame-src ${frameSrc}; frame-ancestors 'self'; object-src 'none'; base-uri 'self'; form-action 'self'`
}

export const CSP_HEADER = buildAppCsp(
  parseRunnerHostnames(process.env.RUNNER_HOSTNAME).map((host) => `https://${host}`),
)

// Header bảo mật đính vào MỌI response — API, static và health dùng chung đúng một nguồn.
// Trước đây 3 chỗ tự gọi setHeader riêng nên HSTS/Permissions-Policy chỉ có ở response API,
// còn trang HTML (thứ trình duyệt thực sự ghim HSTS theo) thì không (audit 2026-08-25, F4).
// X-Frame-Options SAMEORIGIN khớp với `frame-ancestors 'self'` của CSP — cho trình duyệt cũ
// chưa hiểu frame-ancestors.
export function applyCommonSecurityHeaders(res: ExpressResponse): void {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('Content-Security-Policy', CSP_HEADER)
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.setHeader('Strict-Transport-Security', HSTS_VALUE)
  res.setHeader('X-Frame-Options', 'SAMEORIGIN')
  res.setHeader('Permissions-Policy', PERMISSIONS_POLICY)
  res.setHeader('X-XSS-Protection', X_XSS_PROTECTION_VALUE)
  res.setHeader('Cross-Origin-Resource-Policy', CORP_VALUE)
  res.setHeader('Cross-Origin-Opener-Policy', COOP_VALUE)
}

// ── Bọc Edge Function handler thành Express route ────────────────────────────
// Edge Function: nhận (Request) → trả (Response)  [Web API chuẩn]
// Express      : nhận (req, res)                   [Node.js API]
// Node.js 20 hỗ trợ sẵn Web API Request/Response nên chuyển đổi khá gọn.
export function wrapEdge(handler: (req: Request) => Promise<Response>) {
  return async (req: express.Request, res: express.Response) => {
    try {
      // Dựng lại URL đầy đủ — một số handler dùng URL để đọc query params
      const protocol = req.get('x-forwarded-proto') || req.protocol
      const host = req.get('host') || 'localhost'
      const fullUrl = `${protocol}://${host}${req.originalUrl}`

      // Chuyển Express request → Web API Request
      const webReq = new Request(fullUrl, {
        method: req.method,
        headers: req.headers as HeadersInit,
        // GET/HEAD không có body
        body: ['GET', 'HEAD'].includes(req.method) ? undefined : JSON.stringify(req.body),
      })

      if (!isTrustedMutation(webReq)) {
        applyCommonSecurityHeaders(res)
        for (const [name, value] of Object.entries(getCorsHeaders(webReq)))
          res.setHeader(name, value)
        res.setHeader('Cache-Control', 'no-store')
        res.status(403).json({ error: 'Nguồn yêu cầu không được phép', code: 'UNTRUSTED_ORIGIN' })
        return
      }

      // Gọi handler gốc
      const webRes = await handler(webReq)

      // Chuyển Web API Response → Express response
      res.status(webRes.status)
      webRes.headers.forEach((val, key) => res.setHeader(key, val))

      // Security headers — thêm sau khi convert response, tránh conflict với Web API Response
      applyCommonSecurityHeaders(res)

      res.send(await webRes.text())
    } catch (err) {
      // Lỗi nghiệp vụ có kiểu (AppError) lọt ra khỏi handler — trả ĐÚNG mã của nó thay vì gộp
      // thành 500 (audit 2026-10-10, E1.5): `validateAuth` ném 503 khi CSDL không kiểm được
      // phiên, và client phải nhận 503 (giữ phiên) chứ không phải 401/500. Body giữ hình dạng
      // `{error: 'chuỗi', code}` như nhánh 403 ở trên — handler cũ đọc `error` là chuỗi.
      // AppError 4xx là lỗi người dùng đã lường trước — không đẩy lên Sentry.
      if (!isAppError(err) || err.status >= 500) {
        console.error('[server] Lỗi handler:', err)
        captureServerException(err, { path: req.originalUrl, method: req.method })
      }
      if (isAppError(err)) res.status(err.status).json({ error: err.message, code: err.code })
      else res.status(500).json({ error: 'Internal server error' })
    }
  }
}

// Gắn toàn bộ route API vào app theo ĐÚNG thứ tự middleware cũ của server.ts:
// parser body lớn cho 3 route đặc biệt TRƯỚC parser JSON 64kb mặc định, rồi mọi route còn lại.
export function registerApiRoutes(app: express.Express): void {
  // STT nhận audio base64 → body lớn hơn nhiều so với chat/tts. Đăng ký parser riêng
  // cho route này TRƯỚC parser JSON 64kb mặc định bên dưới (Express chạy middleware theo
  // thứ tự — nếu để parser 64kb chạy trước, body audio sẽ bị chặn 413 trước khi tới handler).
  app.post('/api/stt', express.json({ limit: '10mb' }), wrapEdge(sttHandler))
  // /api/pronounce-assess cũng nhận audio base64 (câu ngắn ~30s, nhẹ hơn STT hội thoại tự do)
  // — cùng lý do cần parser riêng thay vì giới hạn 64kb mặc định.
  app.post(
    '/api/pronounce-assess',
    express.json({ limit: '5mb' }),
    wrapEdge(pronounceAssessHandler),
  )
  // /api/vision-solve nhận image base64 từ camera/file upload
  app.post('/api/vision-solve', express.json({ limit: '10mb' }), wrapEdge(visionSolveHandler))

  app.use(express.json({ limit: '64kb' }))

  // ── API routes ────────────────────────────────────────────────────────────────
  // Thêm vào đây nếu tạo thêm file api/*.ts mới
  app.all('/api/tts', wrapEdge(ttsHandler))
  app.all('/api/agent', wrapEdge(aiHandler))
  app.all('/api/pronunciation', wrapEdge(pronunciationHandler))
  app.all('/api/push', wrapEdge(pushHandler))
  app.all('/api/dictionary', wrapEdge(dictionaryHandler))
  app.all('/api/mistakes', wrapEdge(mistakesHandler))
  app.all('/api/programming/progress', wrapEdge(programmingProgressHandler))
  app.all('/api/programming/specialization', wrapEdge(programmingSpecializationHandler))
  app.all('/api/programming/path-progress', wrapEdge(programmingPathProgressHandler))
  app.all('/api/programming/path-quiz', wrapEdge(programmingPathQuizHandler))
  app.all('/api/programming/path-artifact', wrapEdge(programmingPathArtifactHandler))
  app.all('/api/programming/project', wrapEdge(programmingProjectHandler))
  app.all('/api/programming/feedback', wrapEdge(programmingFeedbackHandler))
  app.all('/api/programming/ts-check', wrapEdge(programmingTsCheckHandler))
  app.all('/api/leaderboard', wrapEdge(leaderboardHandler))
  app.all('/api/auth', wrapEdge(authHandler))
  app.all('/api/profile', wrapEdge(profileHandler))
  app.all('/api/two-factor', wrapEdge(twoFactorHandler))
  app.all('/api/account', wrapEdge(accountHandler))
  app.all('/api/intake', wrapEdge(intakeHandler))
  app.all('/api/learner-intent', wrapEdge(learnerIntentHandler))
  app.all('/api/admin-intake-stats', wrapEdge(adminIntakeStatsHandler))
  app.all('/api/progress', wrapEdge(progressHandler))
  app.all('/api/cefr-assessment', wrapEdge(cefrAssessmentHandler))
  app.all('/api/usage-summary', wrapEdge(usageSummaryHandler))
  app.all('/api/history', wrapEdge(historyHandler))
  app.all('/api/challenge', wrapEdge(challengeHandler))
  app.all('/api/tutor-feedback', wrapEdge(tutorFeedbackHandler))
  app.all('/api/feedback', wrapEdge(feedbackHandler))
  app.all('/api/admin-settings', wrapEdge(adminSettingsHandler))
  app.all('/api/admin-stem-review', wrapEdge(adminStemReviewHandler))
  app.all('/api/app-settings', wrapEdge(appSettingsHandler))
  app.all('/api/admin-grant-plan', wrapEdge(adminGrantPlanHandler))
  app.all('/api/admin-vip-whitelist', wrapEdge(adminVipWhitelistHandler))
  app.all('/api/plan-features', wrapEdge(planFeaturesHandler))
  app.all('/api/admin-plan-features', wrapEdge(adminPlanFeaturesHandler))
  app.all('/api/admin-price-promo', wrapEdge(adminPricePromoHandler))
  app.all('/api/plan-marketing', wrapEdge(planMarketingHandler))
  app.all('/api/admin-plan-marketing', wrapEdge(adminPlanMarketingHandler))
  app.all('/api/analytics', wrapEdge(analyticsHandler))
  app.all('/api/analytics-summary', wrapEdge(analyticsSummaryHandler))
  app.all('/api/admin-usage-stats', wrapEdge(adminUsageStatsHandler))
  app.all('/api/admin-users', wrapEdge(adminUsersHandler))
  app.all('/api/referral', wrapEdge(referralHandler))
  app.all('/api/quests', wrapEdge(questsHandler))
  app.all('/api/achievements', wrapEdge(achievementsHandler))
  app.all('/api/friends', wrapEdge(friendsHandler))
  app.all('/api/chat', wrapEdge(chatHandler))
  app.all('/api/location', wrapEdge(locationHandler))
  app.all('/api/companion-link', wrapEdge(companionLinkHandler))
  app.all('/api/exam-plan', wrapEdge(examPlanHandler))
  app.all('/api/admin-achievement-rewards', wrapEdge(adminAchievementRewardsHandler))
  app.all('/api/admin-payments', wrapEdge(adminPaymentsHandler))
  app.all('/api/admin-system-control', wrapEdge(adminSystemControlHandler))
  app.all('/api/admin-tts-cache', wrapEdge(adminTtsCacheHandler))
  app.all('/api/admin-reserved-names', wrapEdge(adminReservedNamesHandler))
  app.all('/api/admin-feedback', wrapEdge(adminFeedbackHandler))
  app.all('/api/admin-feature-status', wrapEdge(adminFeatureStatusHandler))
  app.all('/api/plan-prices', wrapEdge(planPricesHandler))
  app.all('/api/checkout', wrapEdge(checkoutHandler))
  app.all('/api/payment-webhook', wrapEdge(paymentWebhookHandler))
  app.all('/api/payment-status', wrapEdge(paymentStatusHandler))
  app.all('/api/payment-history', wrapEdge(paymentHistoryHandler))
  app.all('/api/payment-cancel', wrapEdge(paymentCancelHandler))
  app.all('/api/avatar-visemes', wrapEdge(avatarVisemesHandler))
  app.all('/api/hub-stats', wrapEdge(hubStatsHandler))
  // Personal World Model (V2-03) — danh tính + fact cá nhân, đều bắt buộc đăng nhập.
  app.all('/api/persons', wrapEdge(personsHandler))
  app.all('/api/personal-facts', wrapEdge(personalFactsHandler))
  // Consent + Personal Policy (V2-04) — quyền/đồng ý của chính người dùng, bắt buộc đăng nhập.
  app.all('/api/consents', wrapEdge(consentsHandler))
  app.all('/api/personal-policies', wrapEdge(personalPoliciesHandler))
  // Life Graph foundation (V2-05) — graph của chính người dùng + Learning Goal read view.
  app.all('/api/life-graph', wrapEdge(lifeGraphHandler))
  app.all('/api/life-goals', wrapEdge(lifeGoalsHandler))
  // Personal Knowledge Fabric (V2-06) — bộ nhớ cá nhân hóa theo namespace & retention.
  app.all('/api/memories', wrapEdge(memoriesHandler))
  // Context Engine (V2-07) — xây dựng ContextPackage có lọc permission/sensitivity/budget.
  app.all('/api/context-package', wrapEdge(contextPackageHandler))
  // ProposedAction & Tool Manifest Pipeline (V2-08) — Planning ≠ Execution ≠ State Mutation.
  app.all('/api/proposed-actions', wrapEdge(proposedActionsHandler))
  // Companion Runtime (V2-09) — Intent -> Context -> Planner -> Policy -> Actions -> Response.
  app.all('/api/companion', wrapEdge(companionHandler))
  // Decision Ledger + Outcome Loop (V2-10) — Structured decision records & evidence loop.
  app.all('/api/decision-ledger', wrapEdge(decisionLedgerHandler))
  // Learning Read Model (V2-11) — Typed Learning domain read model for Companion.
  app.all('/api/learning-read-model', wrapEdge(learningReadModelHandler))
  // Multi-Subject Learning (V2-12) — Subject manifests & taxonomy registry.
  app.all('/api/subjects', wrapEdge(subjectsHandler))
  // Work Domain (V2-15) — Projects, tasks, meetings, documents, deadlines.
  app.all('/api/work', wrapEdge(workHandler))
  // Approved Automation (V2-18) — Explicit grants, triggers, budgets, retries/compensation, action receipts.
  app.all('/api/automation', wrapEdge(automationHandler))
  // Deep Health Check — Giám sát chuyên sâu Database, Storage, Cache, Uptime.
  app.all('/api/health/deep', wrapEdge(healthDeepHandler))
  // Proactive Briefing (V2 Flagship P1) — Morning / Evening personalized proactive briefs.
  app.all('/api/proactive-briefing', wrapEdge(proactiveBriefingHandler))
  // Multimodal Vision Solver (V2 Flagship P1) — STEM & Document OCR solver.
  // External Integrations (V2 Flagship) — Google Calendar & Notion sync.
  app.all('/api/integrations', wrapEdge(integrationsHandler))
  // Subconscious Cognition & Nightly REM Consolidation (V3 Flagship) — Autonomous cognition & predictive strategy.
  app.all('/api/subconscious', wrapEdge(subconsciousHandler))
  // Ambient Vision & Screen Grounding (V3 Flagship) — Realtime screen context copilot.
  app.all('/api/ambient-vision', wrapEdge(ambientVisionHandler))
  // Multi-Agent A2A Protocol & Peer Negotiation (V3 Flagship) — Cryptographic agent-to-agent bus.
  app.all('/api/a2a', wrapEdge(a2aHandler))
  // Neuro-Affective Flow & Bio-Adaptive Orchestration (V3 Flagship) — Stress intervention & flow state shielding.
  app.all('/api/neuro-affective', wrapEdge(neuroAffectiveHandler))
  // Scenario Holodeck Engine (V3 Flagship) — Multi-persona high-stakes simulation & Cambridge rubric evaluation.
  app.all('/api/scenario-holodeck', wrapEdge(scenarioHolodeckHandler))
  // 3D Articulatory Phonetics & Pitch Alignment (V3 Flagship) — Vocal tract anatomy & F0 pitch contour.
  app.all('/api/articulatory-phonetics', wrapEdge(articulatoryPhoneticsHandler))
  // Workplace Error Harvester & Auto-SRS (V3 Flagship) — Workplace error ingestion to personalized SRS cards.
  app.all('/api/workplace-insights', wrapEdge(workplaceInsightsHandler))
  // Socratic Cognitive Diagnostics (V3 Flagship Wave 2) — Deep mental model debugging & guided reflection.
  app.all('/api/socratic-diagnostics', wrapEdge(socraticDiagnosticsHandler))
  // Real-Time Echo Shadowing (V3 Flagship Wave 2) — Sub-second acoustic drift & cadence synchronizer.
  app.all('/api/echo-shadowing', wrapEdge(echoShadowingHandler))
  // Wearables & Circadian Bio-Adaptive MCP (V3 Flagship Wave 2) — Biometric stream to circadian learning window.
  app.all('/api/wearables-sync', wrapEdge(wearablesSyncHandler))
  // `/api/realtime-multimodal` đã GỠ (changelog 0534): không client nào gọi, không rate limit, Map
  // phiên trong bộ nhớ không bao giờ dọn → rủi ro cạn RAM. Đàm thoại thời gian thực thật đi qua
  // Gemini Live (`/api/gemini-live`). Gọi lại đường này nhận 404 như mọi route không tồn tại.
  // Acoustic Phonetics & GOP Engine (Platform V4 Phase 1) — Phoneme-level acoustic assessment & alignment.
  app.all('/api/acoustic-phonetics', wrapEdge(acousticPhoneticsHandler))
  // 3D Embodied Cyber-Tutor & Viseme Morphing (Platform V4 Phase 2) — 3D Embodiment & Real-time Visemes.
  app.all('/api/avatar-embodiment', wrapEdge(avatarEmbodimentHandler))
  // Live Autonomous Action Canvas & Cross-Domain Hub (Platform V4 Phase 3) — Interactive Collaborative Workspace.
  app.all('/api/action-canvas', wrapEdge(actionCanvasHandler))
  // Dynamic Neural Micro-Curriculum & Spaced Collocations (Platform V4 Phase 4) — Adaptive 2-min drills.
  app.all('/api/neural-curriculum', wrapEdge(neuralCurriculumHandler))
  // Distributed WebSocket Mesh & Realtime Telemetry (Platform V4 Phase 5) — Live session cost & latency mesh.
  app.all('/api/mesh-telemetry', wrapEdge(meshTelemetryHandler))
  // Autonomous Proactive Agent & Goal Auto-Pilot (Platform V5 Phase 1) — Proactive Nudges & Action Dispatcher.
  app.all('/api/proactive-agent', wrapEdge(proactiveAgentHandler))
  // AI Debate Arena & Socratic Multi-Agent (Platform V5 Phase 2) — Live debate & logic rubric.
  app.all('/api/debate-arena', wrapEdge(debateArenaHandler))
  // STEM Interactive Scratchpad (Platform V5 Phase 2) — Step-by-step math/chem/physics logic validator.
  app.all('/api/stem-scratchpad', wrapEdge(stemScratchpadHandler))
  // Bằng chứng hoàn thành hoạt động học (S11) — server chấm LẠI trả lời thô, không tin client.
  app.all('/api/learning/evidence', wrapEdge(learningEvidenceHandler))
  // Deep Metacognitive Reflection Engine & Socratic Journal (Platform V5 Phase 3) — Peak Metacognition & Bias Detection.
  app.all('/api/metacognitive-reflection', wrapEdge(metacognitiveReflectionHandler))
  // Spatial Multi-Sensory Memory Palace (Platform V5 Phase 3) — Method of Loci & Neural Anchors.
  app.all('/api/memory-palace', wrapEdge(memoryPalaceHandler))
  // Tổng hợp 30 ngày (Học tập + Ghi chú) — chỉ đếm bản ghi thật, không điểm tổng hợp (changelog 0550).
  app.all('/api/life-synthesis', wrapEdge(lifeSynthesisHandler))
  // Autonomous Multi-Agent Orchestrator Studio (Platform V5.5) — Multi-Step Autonomous Execution.
  app.all('/api/agent-orchestrator', wrapEdge(agentOrchestratorHandler))
  // Live 1v1 PvP Arena & Ghost Matchmaking — Speed Vocab, Grammar Clash & Elo Rank.
  app.all('/api/pvp-arena', wrapEdge(pvpArenaHandler))
  // Gemini Live Bidirectional Streaming Gateway (Platform V7.2) — Full-Duplex PCM & Audio Streaming.
  app.all('/api/gemini-live', wrapEdge(geminiLiveHandler))
}
