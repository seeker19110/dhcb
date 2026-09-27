import { getPgPool } from '@dhcb/core-db/pgPool'
import {
  validateAuth,
  checkRateLimit,
  getCorsHeaders,
  SECURITY_HEADERS,
} from '@dhcb/core-auth/security'
import { jsonResponse } from '@dhcb/core-http/http'
import { CefrAssessmentRequest } from '@dhcb/core-contracts/cefrAssessment'
import { assessCefr, AssessmentError } from '../../_lib/cefrAssessment.js'
import { rewardReferralIfEligible } from '../../_lib/referral.js'

export default async function handler(req: Request): Promise<Response> {
  const headers = { ...getCorsHeaders(req), ...SECURITY_HEADERS }
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers })
  const auth = await validateAuth(req)
  if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401, headers)
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405, headers)
  if (!(await checkRateLimit(auth.userId, 10, 'cefr-assessment')))
    return jsonResponse({ error: 'Vui lòng chờ một phút rồi thử lại' }, 429, headers)
  const parsed = CefrAssessmentRequest.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return jsonResponse({ error: 'Bài thi không hợp lệ' }, 400, headers)
  try {
    const result = await assessCefr(getPgPool(), auth.userId, parsed.data)
    // assessCefr đã commit kết quả chấm; tạo đề hoặc bài chưa đạt không kích hoạt thưởng.
    if (parsed.data.action === 'submit' && 'passed' in result && result.passed) {
      await rewardReferralIfEligible(auth.userId)
    }
    return jsonResponse(result, 200, headers)
  } catch (error) {
    if (error instanceof AssessmentError)
      return jsonResponse({ error: error.message }, error.status, headers)
    return jsonResponse({ error: 'Chưa lưu được bài thi. Vui lòng thử lại.' }, 503, headers)
  }
}
