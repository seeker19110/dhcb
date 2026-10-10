// Máy chủ sở hữu câu hỏi, chấm bài và ghi tiến độ; không nhận nguyên state từ client.
import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import { jsonResponse, logInternalError } from '@dhcb/core-http/http'
import { readJsonBody, validateBody } from '@dhcb/core-http/validation'
import { validateAuth, getCorsHeaders } from '@dhcb/core-auth/security'
import {
  NeuralCurriculumStateSchema,
  NeuralDrillSubmissionSchema,
  NeuralDrillReviewSchema,
  GenerateNeuralModuleSchema,
} from '@dhcb/core-contracts/neuralCurriculum'
import { NeuralCurriculumService } from '@dhcb/core-ai/neuralCurriculumService'
import { getPgPool } from '@dhcb/core-db/pgPool'
import { withTransaction } from '@dhcb/core-db/transaction'

// Namespace mới: JSON cũ từng cho client ghi cả đáp án/điểm, không thể làm nguồn chấm tin cậy.
const FEATURE = 'neural_curriculum_verified_v1'
const StoredStateSchema = z
  .object({
    curriculum: NeuralCurriculumStateSchema,
    completions: z.record(z.string(), NeuralDrillReviewSchema),
    scoredDrillIds: z.array(z.string()),
  })
  .strict()

export default async function handler(req: Request): Promise<Response> {
  const headers = getCorsHeaders(req)
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers })
  const auth = await validateAuth(req)
  if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401, headers)
  if (!['GET', 'POST'].includes(req.method)) {
    return jsonResponse({ error: 'Method not allowed' }, 405, headers)
  }
  const action = new URL(req.url).searchParams.get('action')
  let generate: z.infer<typeof GenerateNeuralModuleSchema> | undefined
  let submission: z.infer<typeof NeuralDrillSubmissionSchema> | undefined
  if (req.method === 'POST') {
    if (action !== 'generate_module' && action !== 'complete_drill') {
      return jsonResponse({ error: 'invalid_action' }, 400, headers)
    }
    const body = await readJsonBody(req)
    if (!body.ok) return jsonResponse({ error: body.error.message }, body.error.status, headers)
    if (action === 'generate_module') {
      const parsed = validateBody(GenerateNeuralModuleSchema, body.raw)
      if (!parsed.ok) return jsonResponse({ error: 'invalid_request' }, 400, headers)
      generate = parsed.data
    } else {
      const parsed = validateBody(NeuralDrillSubmissionSchema, body.raw)
      if (!parsed.ok) return jsonResponse({ error: 'invalid_request' }, 400, headers)
      submission = parsed.data
    }
  }
  try {
    return await withTransaction(getPgPool(), async (client) => {
      const initial = {
        curriculum: NeuralCurriculumService.createDefaultState(auth.userId),
        completions: {},
        scoredDrillIds: [],
      }
      await client.query(
        `insert into platform.feature_state (user_id, feature, state, updated_at)
         values ($1, $2, $3::jsonb, now()) on conflict (user_id, feature) do nothing`,
        [auth.userId, FEATURE, JSON.stringify(initial)],
      )
      const { rows } = await client.query<{ state: unknown }>(
        'select state from platform.feature_state where user_id = $1 and feature = $2 for update',
        [auth.userId, FEATURE],
      )
      const stored = StoredStateSchema.parse(rows[0]?.state)
      const state = stored.curriculum
      if (req.method === 'GET') return jsonResponse({ success: true, state }, 200, headers)
      let result: Record<string, unknown>
      if (generate) {
        const module = NeuralCurriculumService.generateMicroCurriculumModule({
          ...generate,
          moduleId: randomUUID(),
        })
        state.modules = [module, ...state.modules].slice(0, 50)
        state.activeModuleId = module.moduleId
        const kept = new Set(state.modules.map((item) => item.moduleId))
        stored.completions = Object.fromEntries(
          Object.entries(stored.completions).filter(([id]) => kept.has(id)),
        )
        result = { module }
      } else if (submission) {
        const module = state.modules.find((item) => item.moduleId === submission.moduleId)
        if (!module) return jsonResponse({ error: 'module_not_found' }, 404, headers)
        const correctCount = NeuralCurriculumService.gradeDrill(module, submission.answers)
        if (correctCount === null) return jsonResponse({ error: 'invalid_answers' }, 400, headers)
        const passed = correctCount >= Math.ceil(module.drills.length / 2)
        const prior = stored.completions[module.moduleId]
        const review = NeuralCurriculumService.computeNextSpacedReview(1, passed)
        // Module mới sinh lại cùng nội dung vẫn là ôn tập, không cộng lặp điểm kiến thức.
        const hasNewEvidence = module.drills.some(
          (drill) => !stored.scoredDrillIds.includes(drill.id),
        )
        const recorded = !prior && hasNewEvidence
        const newScore = recorded
          ? Math.max(0, Math.min(100, state.masteryScore + review.masteryDelta))
          : state.masteryScore
        const graded = {
          ...review,
          correctCount,
          total: module.drills.length,
          recorded,
          masteryDelta: newScore - state.masteryScore,
        }
        state.masteryScore = newScore
        module.status = passed || module.status === 'mastered' ? 'mastered' : 'in_progress'
        module.updatedAt = new Date().toISOString()
        if (!prior) {
          stored.completions[module.moduleId] = graded
          stored.scoredDrillIds = [
            ...new Set([...stored.scoredDrillIds, ...module.drills.map((drill) => drill.id)]),
          ]
        }
        result = { review: graded }
      } else {
        return jsonResponse({ error: 'invalid_request' }, 400, headers)
      }
      state.updatedAt = new Date().toISOString()
      await client.query(
        `update platform.feature_state set state = $3::jsonb, updated_at = now()
         where user_id = $1 and feature = $2`,
        [auth.userId, FEATURE, JSON.stringify(stored)],
      )
      return jsonResponse({ success: true, ...result, state }, 200, headers)
    })
  } catch (err) {
    logInternalError(err, 'neural-curriculum', 503)
    return jsonResponse({ error: 'Không thể lưu bài luyện. Vui lòng thử lại.' }, 503, headers)
  }
}
