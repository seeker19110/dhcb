import { getAuthHeader } from '@core/authHeader'
// apps/dhcb/src/lib/avatarEmbodimentApi.ts — Client API giao tiep Hien than 3D Cyber-Tutor.
import { AvatarEmbodimentConfig, Avatar3DState } from '@dhcb/core-contracts/avatarEmbodiment'

export async function fetchAvatarEmbodiment(): Promise<{
  config: AvatarEmbodimentConfig
  state: Avatar3DState
}> {
  const res = await fetch('/api/avatar-embodiment', {
    headers: {
      ...getAuthHeader(),
    },
  })

  if (!res.ok) {
    throw new Error(`Loi tai cau hinh Avatar: ${res.status}`)
  }

  const data = await res.json()
  return {
    config: data.config,
    state: data.state,
  }
}

export async function updateAvatarEmbodiment(
  updates: Partial<AvatarEmbodimentConfig>,
): Promise<AvatarEmbodimentConfig> {
  const res = await fetch('/api/avatar-embodiment', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify(updates),
  })

  if (!res.ok) {
    throw new Error(`Loi cap nhat Avatar: ${res.status}`)
  }

  const data = await res.json()
  return data.config
}
