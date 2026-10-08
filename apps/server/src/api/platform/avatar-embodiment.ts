// api/avatar-embodiment.ts — REST handler cho Hien than 3D & Cau hinh Cyber-Tutor V4.
// State da chuyen sang bang platform.feature_state (migration 0058, packages/core-db/featureState.ts)
// — thay cho Map in-memory cap module, tranh vo trong PM2 cluster.
import { badJsonOrInternalError, jsonResponse } from '@dhcb/core-http/http'
import { validateAuth, getCorsHeaders } from '@dhcb/core-auth/security'
import {
  AvatarEmbodimentConfig,
  AvatarEmbodimentConfigSchema,
  AVATAR_EMBODIMENT_VERSION,
} from '@dhcb/core-contracts/avatarEmbodiment'
import { VisemeMorphingService } from '@dhcb/core-ai/visemeMorphingService'
import { getFeatureState, setFeatureState } from '@dhcb/core-db/featureState'

const FEATURE = 'avatar_embodiment'

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: getCorsHeaders(req) })
  }

  const auth = await validateAuth(req)
  if (!auth) {
    return jsonResponse(
      { error: 'Unauthorized', message: 'Yeu cau dang nhap de truy cap cau hinh Hien than 3D.' },
      401,
    )
  }

  const personId = auth.userId

  if (req.method === 'GET') {
    const existing = (await getFeatureState<AvatarEmbodimentConfig>(personId, FEATURE)) || {
      personId,
      renderMode: '3d_cyber_avatar',
      quality: 'high',
      emissiveAccent: 'cyan',
      autoGaze: true,
      idleAnimations: true,
      schemaVersion: AVATAR_EMBODIMENT_VERSION,
    }

    const idleState = VisemeMorphingService.computeNaturalIdleState(
      Date.now(),
      { x: 0, y: 0 },
      'neutral',
    )

    return jsonResponse(
      {
        success: true,
        config: existing,
        state: idleState,
      },
      200,
    )
  }

  if (req.method === 'POST') {
    try {
      const body = await req.json()
      const parseResult = AvatarEmbodimentConfigSchema.safeParse({
        ...body,
        personId,
      })

      if (!parseResult.success) {
        return jsonResponse(
          {
            error: 'invalid_request',
            details: parseResult.error.format(),
          },
          400,
        )
      }

      await setFeatureState(personId, FEATURE, parseResult.data)

      return jsonResponse(
        {
          success: true,
          config: parseResult.data,
          message: 'Cap nhat cau hinh Hien than 3D thanh cong.',
        },
        200,
      )
    } catch (err) {
      return badJsonOrInternalError(err, 'avatar-embodiment', 'Invalid payload')
    }
  }

  return jsonResponse({ error: 'Method not allowed' }, 405)
}
