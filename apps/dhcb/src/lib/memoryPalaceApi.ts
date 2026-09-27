import { getAuthHeader } from '@core/authHeader'
// apps/dhcb/src/lib/memoryPalaceApi.ts — Client API cho Spatial Memory Palace.
import type {
  MemoryPalaceRoom,
  MemoryPalaceState,
  MemoryPalaceTheme,
  LocusAnchor,
  LocusRecallResult,
} from '@dhcb/core-contracts/memoryPalace'

export async function fetchMemoryPalaceState(): Promise<MemoryPalaceState> {
  const res = await fetch('/api/memory-palace', {
    headers: {
      ...getAuthHeader(),
    },
  })

  if (!res.ok) {
    throw new Error(`Lỗi tải trạng thái Cung điện Trí nhớ: ${res.status}`)
  }

  const data = await res.json()
  return data.state
}

export async function createMemoryPalaceRoomApi(params: {
  name: string
  theme: MemoryPalaceTheme
  description?: string
  initialConcepts?: Array<{
    keyConcept: string
    mnemonicStory: string
    category: 'c1_c2_vocab' | 'stem_formula' | 'argument_fallacy' | 'life_wisdom'
  }>
}): Promise<MemoryPalaceRoom> {
  const res = await fetch('/api/memory-palace?action=create_room', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify(params),
  })

  if (!res.ok) {
    throw new Error(`Lỗi tạo phòng Trí nhớ: ${res.status}`)
  }

  const data = await res.json()
  return data.room
}

export async function verifyLocusRecallApi(params: {
  roomId: string
  locusId: string
  userRecallText: string
}): Promise<{
  result: LocusRecallResult
  updatedLocus: LocusAnchor
}> {
  const res = await fetch('/api/memory-palace?action=verify_recall', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify(params),
  })

  if (!res.ok) {
    throw new Error(`Lỗi xác thực điểm neo trí nhớ: ${res.status}`)
  }

  const data = await res.json()
  return {
    result: data.result,
    updatedLocus: data.updatedLocus,
  }
}
