import { getAuthHeader } from '@core/authHeader'
// apps/dhcb/src/lib/neuralCurriculumApi.ts — Client API giao tiếp Lộ trình Vi mô Thần kinh.
import {
  type NeuralCurriculumState,
  type MicroCurriculumModule,
  type NeuralDrillSubmission,
  NeuralCurriculumStateSchema,
  MicroCurriculumModuleSchema,
  NeuralDrillReviewSchema,
  type NeuralDrillReview,
} from '@dhcb/core-contracts/neuralCurriculum'

export async function fetchNeuralCurriculum(): Promise<NeuralCurriculumState> {
  const res = await fetch('/api/neural-curriculum', {
    headers: {
      ...getAuthHeader(),
    },
  })

  if (!res.ok) {
    throw new Error(`Lỗi tải Lộ trình Vi mô: ${res.status}`)
  }

  const data = await res.json()
  return NeuralCurriculumStateSchema.parse(data.state)
}

export async function generateMicroModule(params: {
  topicOrKeyword: string
  targetDomain?: 'learning' | 'career' | 'work' | 'startup' | 'life'
  cefrLevel?: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'
}): Promise<{ module: MicroCurriculumModule; state: NeuralCurriculumState }> {
  const res = await fetch('/api/neural-curriculum?action=generate_module', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify(params),
  })

  if (!res.ok) {
    throw new Error(`Lỗi tạo bài học vi mô: ${res.status}`)
  }

  const data = await res.json()
  return {
    module: MicroCurriculumModuleSchema.parse(data.module),
    state: NeuralCurriculumStateSchema.parse(data.state),
  }
}

export async function completeDrill(params: NeuralDrillSubmission): Promise<{
  review: NeuralDrillReview
  state: NeuralCurriculumState
}> {
  const res = await fetch('/api/neural-curriculum?action=complete_drill', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify(params),
  })

  if (!res.ok) {
    throw new Error(`Lỗi ghi nhận drill: ${res.status}`)
  }

  const data = await res.json()
  return {
    review: NeuralDrillReviewSchema.parse(data.review),
    state: NeuralCurriculumStateSchema.parse(data.state),
  }
}
