import type {
  LifeDomainScore,
  PredictiveGoalHorizon,
  StrategicRecommendation,
  LifeSynthesisReport,
  LifeDomainType,
} from '@dhcb/core-contracts/lifeSynthesis'

export interface LifeSynthesisInput {
  personId: string
  timeframe?: 'daily' | 'weekly' | 'monthly'
  domainActivityCounts?: Partial<Record<LifeDomainType, number>>
  metacognitiveAwarenessIndex?: number
  neuroEnergyScore?: number
  activeGoals?: Array<{
    id: string
    title: string
    domain: LifeDomainType
    targetDaysRemaining: number
    progressPercent: number
  }>
}

/**
 * ⚠️ KHÔNG NỐI VÀO GIAO DIỆN NGƯỜI DÙNG THẬT (changelog 0475, 2026-10-02). Khi thiếu dữ liệu, hàm
 * này dùng số hoạt động GÁN CỨNG, điểm mặc định (82/78), mục tiêu mẫu; còn câu nhận xét, khó
 * khăn và khuyến nghị thì LUÔN soạn sẵn, không lấy từ dữ liệu. API `/api/life-synthesis` đã
 * ngừng gọi hàm này (trả 501) và studio "Tổng kết" đã gỡ. Chỉ dùng lại khi có nguồn dữ liệu
 * hoạt động thật VÀ đã viết lại phần câu chữ theo dữ liệu đó.
 *
 * Thuật toán Tổng hợp Đa Miền (Cross-Domain Life Synthesis Engine V5.4)
 * Tổng hòa tín hiệu từ 5 miền (Học tập, Sự nghiệp, Công việc, Khởi nghiệp, Đời sống),
 * tính toán Holistic Alignment Score, Cognitive Resilience và trích xuất khuyến nghị chiến lược.
 */
export function generateLifeSynthesisReport(input: LifeSynthesisInput): LifeSynthesisReport {
  const timeframe = input.timeframe || 'weekly'
  const activityCounts = input.domainActivityCounts || {
    learning: 12,
    career: 6,
    work: 15,
    startup: 4,
    life: 8,
  }

  const domainScores: LifeDomainScore[] = (
    ['learning', 'career', 'work', 'startup', 'life'] as LifeDomainType[]
  ).map((domain) => {
    const count = activityCounts[domain] || 0
    let score = Math.min(100, Math.round(50 + count * 3.5))
    let momentum: LifeDomainScore['momentum'] = 'stable'

    if (count >= 10) momentum = 'accelerating'
    else if (count === 0) {
      momentum = 'dormant'
      score = 40
    } else if (count < 3) momentum = 'decelerating'

    const highlights: Record<LifeDomainType, string> = {
      learning: 'Hoàn thành ôn tập 40 thẻ SRS và 2 bài phản xạ nói Full-duplex.',
      career: 'Cập nhật lộ trình thăng tiến Senior Specialist và đánh giá kỹ năng.',
      work: 'Tối ưu hóa quy trình phân tích và giảm 25% thời gian xử lý dữ liệu.',
      startup: 'Kiểm chứng giả định thị trường cho giải pháp gia sư AI.',
      life: 'Duy trì nhịp sinh học và hoàn thành chuỗi 7 ngày thiền chánh niệm.',
    }

    const bottlenecksMap: Record<LifeDomainType, string[]> = {
      learning: count < 5 ? ['Thời gian luyện nói buổi tối còn hạn chế'] : [],
      career: count < 3 ? ['Chưa cập nhật sản phẩm vào portfolio cá nhân'] : [],
      work: count > 20 ? ['Nguy cơ quá tải thời gian tập trung sâu'] : [],
      startup: count < 2 ? ['Chưa hoàn tất khảo sát phản hồi từ 5 người dùng thử'] : [],
      life: count < 4 ? ['Cần cân bằng thời gian nghỉ ngơi phục hồi năng lượng'] : [],
    }

    return {
      domain,
      score,
      activityCount: count,
      momentum,
      keyHighlight: highlights[domain],
      bottlenecks: bottlenecksMap[domain],
    }
  })

  // Tính toán Holistic Alignment Score & Resilience
  const totalScoreSum = domainScores.reduce((acc, curr) => acc + curr.score, 0)
  const averageDomainScore = Math.round(totalScoreSum / domainScores.length)
  const maiScore = input.metacognitiveAwarenessIndex ?? 82
  const energyScore = input.neuroEnergyScore ?? 78

  const holisticAlignmentScore = Math.min(
    100,
    Math.round(averageDomainScore * 0.5 + maiScore * 0.3 + energyScore * 0.2),
  )
  const lifeSynergyIndex = Math.min(
    100,
    Math.round(
      (averageDomainScore + maiScore) / 2 +
        (domainScores.filter((d) => d.momentum === 'accelerating').length >= 2 ? 6 : 0),
    ),
  )
  const cognitiveResilienceScore = Math.min(100, Math.round(energyScore * 0.6 + maiScore * 0.4))

  // Sinh dự toán mục tiêu (Predictive Goal Horizons)
  const predictiveGoals: PredictiveGoalHorizon[] = (
    input.activeGoals || [
      {
        id: 'goal-cefr-c1',
        title: 'Đạt chuẩn thành thạo C1 Advanced Speaking & Academic Writing',
        domain: 'learning' as LifeDomainType,
        targetDaysRemaining: 45,
        progressPercent: 72,
      },
      {
        id: 'goal-tech-lead',
        title: 'Xây dựng năng lực Kiến trúc Hệ thống Phân tán Đa Miền',
        domain: 'career' as LifeDomainType,
        targetDaysRemaining: 60,
        progressPercent: 65,
      },
    ]
  ).map((goal) => {
    const synergyBonus = lifeSynergyIndex >= 80 ? 1.15 : 1.0
    const probability = Math.min(
      98,
      Math.max(
        30,
        Math.round((goal.progressPercent * 0.7 + holisticAlignmentScore * 0.3) * synergyBonus),
      ),
    )

    const now = new Date()
    const targetDateObj = new Date(now.getTime() + goal.targetDaysRemaining * 86400000)
    const estDays = Math.round(goal.targetDaysRemaining * (100 / Math.max(50, probability)))
    const estDateObj = new Date(now.getTime() + estDays * 86400000)
    const optDateObj = new Date(now.getTime() + Math.round(estDays * 0.85) * 86400000)
    const pessDateObj = new Date(now.getTime() + Math.round(estDays * 1.25) * 86400000)

    return {
      goalId: goal.id,
      title: goal.title,
      domain: goal.domain,
      targetDate: targetDateObj.toISOString().slice(0, 10),
      estimatedCompletionDate: estDateObj.toISOString().slice(0, 10),
      successProbabilityPercent: probability,
      confidenceInterval: {
        optimisticDate: optDateObj.toISOString().slice(0, 10),
        pessimisticDate: pessDateObj.toISOString().slice(0, 10),
      },
      criticalPathSteps: [
        'Duy trì tối thiểu 15 phút luyện phản xạ Socratic mỗi ngày',
        'Tổng hợp 3 bài học thực tế từ công việc vào đồ thị tri thức',
        'Thực hiện bài kiểm tra đối soát kết quả định kỳ',
      ],
      riskFactors:
        probability < 75
          ? ['Nguy cơ phân tán năng lượng khi khối lượng công việc tăng đột biến']
          : ['Biến động lịch trình vào các ngày cuối tuần'],
      energyAlignmentScore: Math.min(100, Math.round(energyScore * 0.9 + 10)),
    }
  })

  // Sinh khuyến nghị chiến lược đòn bẩy cao
  const highLeverageRecommendations: StrategicRecommendation[] = [
    {
      id: `rec-syn-${Date.now()}-1`,
      priority: 'high',
      sourceDomain: 'learning',
      targetDomain: 'career',
      title: 'Chuyển hóa bài học C1 Academic thành Case Study Chuyên Môn',
      actionPrompt:
        'Sử dụng các mẫu câu học thuật C1 để viết tài liệu tổng kết kiến trúc hệ thống bằng tiếng Anh.',
      expectedSynergyImpact:
        'Tăng đồng thời 25% điểm ngữ dụng tiếng Anh và làm giàu hồ sơ sự nghiệp.',
      estimatedMinutes: 20,
    },
    {
      id: `rec-syn-${Date.now()}-2`,
      priority: 'medium',
      sourceDomain: 'work',
      targetDomain: 'learning',
      title: 'Thu hoạch thuật ngữ chuyên môn từ dự án thực tế vào SRS',
      actionPrompt:
        'Trích xuất 5 cụm từ tiếng Anh hay dùng trong sprint này vào Spaced Repetition.',
      expectedSynergyImpact: 'Ghi nhớ tự nhiên ngữ cảnh thực tế không tốn thêm thời gian học rời.',
      estimatedMinutes: 10,
    },
    {
      id: `rec-syn-${Date.now()}-3`,
      priority: 'critical',
      sourceDomain: 'life',
      targetDomain: 'work',
      title: 'Kích hoạt Lá Chắn Dòng Chảy (Flow Shield) vào Khung Giờ Vàng',
      actionPrompt: 'Khóa thông báo và tập trung 45 phút vào nhiệm vụ đòn bẩy cao nhất trong ngày.',
      expectedSynergyImpact:
        'Nhân đôi hiệu suất tập trung và triệt tiêu nguy cơ quá tải tinh thần.',
      estimatedMinutes: 45,
    },
  ]

  const summary = `### Báo Cáo Tổng Hợp Đa Miền (Life Synthesis Report)
- **Chỉ số Đồng bộ Toàn diện (Holistic Alignment):** ${holisticAlignmentScore}/100
- **Chỉ số Cộng hưởng Đa Miền (Synergy Index):** ${lifeSynergyIndex}/100
- **Độ Bền Nhận Thức (Cognitive Resilience):** ${cognitiveResilienceScore}/100

**Đánh giá tổng quan:** Các miền Học tập và Sự nghiệp đang tạo lực đẩy cộng hưởng tích cực. Xác suất hoàn thành mục tiêu chiến lược đạt mức cao khi duy trì nhịp năng lượng hiện tại.`

  return {
    schemaVersion: 'v5.4.0',
    timestamp: new Date().toISOString(),
    personId: input.personId,
    timeframe,
    holisticAlignmentScore,
    lifeSynergyIndex,
    cognitiveResilienceScore,
    domainBreakdown: domainScores,
    predictiveGoals,
    highLeverageRecommendations,
    synthesisSummaryMarkdown: summary,
  }
}
