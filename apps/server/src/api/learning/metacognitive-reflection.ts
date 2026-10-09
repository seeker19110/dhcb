// api/metacognitive-reflection.ts — REST handler cho Metacognitive Reflection & Socratic Journaling.
// State đã chuyển sang bảng platform.feature_state (migration 0058, packages/core-db/featureState.ts)
// — thay cho Map in-memory cấp module, tránh mất dữ liệu/vỡ trong PM2 cluster.
import { jsonResponse } from '@dhcb/core-http/http'
import { validateAuth, getCorsHeaders } from '@dhcb/core-auth/security'
import { MetacognitiveReflectionService } from '@dhcb/core-personal/metacognitiveReflectionService'
import {
  SubmitReflectionRequestSchema,
  toPublicReflection,
  type MetacognitiveReflection,
  type StoredMetacognitiveReflection,
} from '@dhcb/core-contracts/metacognitiveReflection'
import { getFeatureState, setFeatureState } from '@dhcb/core-db/featureState'

const FEATURE = 'metacognitive_reflection'

/** Bản ghi THÔ trong CSDL — bản cũ còn hai số giả "MAI"/"Growth Mindset" (changelog 0539). */
async function readStored(personId: string): Promise<StoredMetacognitiveReflection[]> {
  const list = await getFeatureState<StoredMetacognitiveReflection[]>(personId, FEATURE)
  return Array.isArray(list) ? list : []
}

/**
 * Danh sách trả cho client: chiếu qua `toPublicReflection` (danh sách trắng) để số giả của bản ghi
 * cũ không bao giờ rời server. Dữ liệu trong CSDL giữ nguyên — chỉ thôi đọc trường đó.
 */
async function readPublic(personId: string): Promise<MetacognitiveReflection[]> {
  return (await readStored(personId)).map(toPublicReflection)
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: getCorsHeaders(req) })
  }

  const auth = await validateAuth(req)
  if (!auth) {
    return jsonResponse(
      {
        error: 'Unauthorized',
        message: 'Yêu cầu đăng nhập để truy cập Nhật ký Phản tỉnh Nhận thức.',
      },
      401,
    )
  }

  const personId = auth.userId
  const url = new URL(req.url)
  const action = url.searchParams.get('action')

  if (req.method === 'GET') {
    if (action === 'daily_prompt') {
      const rawDomain = url.searchParams.get('domain')
      const domain = (
        rawDomain === 'career' ||
        rawDomain === 'work' ||
        rawDomain === 'startup' ||
        rawDomain === 'life'
          ? rawDomain
          : 'learning'
      ) as MetacognitiveReflection['domain']
      const contextAnchor = url.searchParams.get('contextAnchor') || undefined
      const prompt = MetacognitiveReflectionService.generateDailySocraticPrompt(
        domain,
        contextAnchor,
      )
      return jsonResponse({ success: true, prompt }, 200)
    }

    if (action === 'summary') {
      const list = await readPublic(personId)
      const summary = MetacognitiveReflectionService.summarizeReflections(list)
      return jsonResponse({ success: true, summary, reflections: list }, 200)
    }

    return jsonResponse({ success: true, reflections: await readPublic(personId) }, 200)
  }

  if (req.method === 'POST') {
    try {
      const body = await req.json()

      if (action === 'submit_reflection') {
        const parsed = SubmitReflectionRequestSchema.safeParse(body)
        if (!parsed.success) {
          return jsonResponse({ error: 'Missing required reflection fields' }, 400)
        }

        const analysis = MetacognitiveReflectionService.analyzeReflection(personId, parsed.data)

        // Ghi lại NGUYÊN danh sách thô (bản ghi cũ giữ mọi trường của nó — không xoá dữ liệu thật),
        // chỉ thêm bản ghi mới (không còn trường điểm) lên đầu.
        const currentList = await readStored(personId)
        currentList.unshift(analysis)
        await setFeatureState(personId, FEATURE, currentList)

        return jsonResponse({ success: true, reflection: analysis }, 200)
      }

      return jsonResponse({ error: 'Unknown action' }, 400)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      return jsonResponse({ error: 'Failed to process request', details: msg }, 500)
    }
  }

  return jsonResponse({ error: 'Method not allowed' }, 405)
}
