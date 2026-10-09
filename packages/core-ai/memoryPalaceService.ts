// packages/core-ai/memoryPalaceService.ts — V5 Flagship Spatial Memory Palace & Method of Loci Engine.
import { randomUUID } from 'node:crypto'
import {
  MemoryPalaceRoom,
  MemoryPalaceTheme,
  LocusAnchor,
  LocusRecallResult,
} from '@dhcb/core-contracts/memoryPalace'

/**
 * Độ bền ghi nhớ của một điểm neo VỪA TẠO, chưa ôn lần nào. Trước 0563 giá trị này là
 * `70 + random(25)` — một con số bịa hiển thị như kết quả đo. Nay khởi điểm 0 và CHỈ tăng/giảm
 * qua ôn tập thật (`verifyLocusRecall`); giao diện nhìn `lastRecalledAt` để hiện "Chưa ôn".
 */
export const INITIAL_RETENTION_STRENGTH = 0
/** Biên độ cộng/trừ độ bền sau mỗi lần ôn (đúng/sai). */
const RECALL_GAIN = 15
const RECALL_PENALTY = 5
const MAX_RETENTION = 100

export class MemoryPalaceService {
  /**
   * Tạo phòng cung điện trí nhớ theo chủ đề với các điểm neo loci mặc định và câu chuyện mnemonics.
   */
  static createMemoryPalaceRoom(
    personId: string,
    params: {
      name: string
      theme: MemoryPalaceTheme
      description?: string
      initialConcepts?: Array<{
        keyConcept: string
        mnemonicStory: string
        category: 'c1_c2_vocab' | 'stem_formula' | 'argument_fallacy' | 'life_wisdom'
      }>
    },
  ): MemoryPalaceRoom {
    const defaultDescriptions: Record<MemoryPalaceTheme, string> = {
      knowledge_library:
        'Đại sảnh Thư Viện Cổ Điển với các kệ sách gỗ sồi vô tận lưu giữ từ vựng và cấu trúc ngôn ngữ đỉnh cao.',
      debate_sanctuary:
        'Đấu trường Triết học La Mã nơi mỗi bức tượng và cột trụ khắc ghi một quy luật lập luận và ngụy biện.',
      philosophical_atrium:
        'Góc Chiêm Nghiệm Giếng Trời nơi ánh sáng rọi chiếu các nguyên lý sống và trí tuệ bất biến.',
      stem_laboratory:
        'Phòng Thí Nghiệm Lượng Tử với các bảng hologram động liên kết các công thức Toán-Lý-Hóa.',
      zen_garden:
        'Khu Vườn Thiền Nhật Bản với từng phiến đá và dòng suối neo giữ tâm thức và năng lượng tự thân.',
    }

    const defaultLociTemplates: Record<
      MemoryPalaceTheme,
      Array<{
        label: string
        x: number
        y: number
        z?: number
        anchorType: 'visual_monument' | 'auditory_echo' | 'tactile_relic' | 'narrative_symbol'
      }>
    > = {
      knowledge_library: [
        { label: 'Cổng Vòm Thư Viện Khắc Chữ Vàng', x: 10, y: 20, anchorType: 'visual_monument' },
        { label: 'Chiếc Đồng Hồ Cát Thủy Tinh Vô Tận', x: 30, y: 40, anchorType: 'tactile_relic' },
        {
          label: 'Bàn Đọc Sách Bằng Gỗ Mun Trầm Hương',
          x: 50,
          y: 60,
          anchorType: 'narrative_symbol',
        },
        {
          label: 'Bức Tranh Sơn Dầu Chân Dung Triết Gia',
          x: 70,
          y: 30,
          anchorType: 'visual_monument',
        },
        {
          label: 'Chiếc Chuông Đồng Gõ Nhịp Không Gian',
          x: 85,
          y: 80,
          anchorType: 'auditory_echo',
        },
      ],
      debate_sanctuary: [
        {
          label: 'Bục Diễn Thuyết Đá Hoa Cương Trắng',
          x: 20,
          y: 25,
          anchorType: 'visual_monument',
        },
        { label: 'Bức Tượng Cân Lý Trí & Cảm Xúc', x: 45, y: 50, anchorType: 'tactile_relic' },
        { label: 'Ngọn Đuốc Sự Thật Bất Diệt', x: 75, y: 35, anchorType: 'visual_monument' },
      ],
      philosophical_atrium: [
        { label: 'Giếng Trời Hút Ánh Dương Ban Mai', x: 50, y: 50, anchorType: 'visual_monument' },
        { label: 'Bể Nước Phản Chiếu Tâm Thức', x: 30, y: 70, anchorType: 'tactile_relic' },
      ],
      stem_laboratory: [
        {
          label: 'Máy Gia Tốc Hạt Hologram Trung Tâm',
          x: 50,
          y: 50,
          anchorType: 'visual_monument',
        },
        { label: 'Bảng Tuần Hoàn Nguyên Tố Tỏa Sáng', x: 25, y: 30, anchorType: 'visual_monument' },
        { label: 'Bình Phản Ứng Phát Quang Nhiệt Hạch', x: 75, y: 65, anchorType: 'tactile_relic' },
      ],
      zen_garden: [
        {
          label: 'Cây Bonsai Nghìn Năm Bên Hồ Cá Koi',
          x: 30,
          y: 40,
          anchorType: 'visual_monument',
        },
        { label: 'Tiếng Ống Tre Gõ Nước Lách Cách', x: 60, y: 30, anchorType: 'auditory_echo' },
        {
          label: 'Phiến Đá Thiền Tròn Nhẵn Cạnh Lối Mòn',
          x: 70,
          y: 70,
          anchorType: 'tactile_relic',
        },
      ],
    }

    const templates = defaultLociTemplates[params.theme] || defaultLociTemplates.knowledge_library
    const loci: LocusAnchor[] = []

    const sampleConcepts =
      params.initialConcepts && params.initialConcepts.length > 0
        ? params.initialConcepts
        : [
            {
              keyConcept: 'Eloquent (adj) - Hùng biện, lưu loát, truyền cảm',
              mnemonicStory:
                'Bức tượng khắc một diễn giả với dòng suối vàng lấp lánh tuôn chảy từ đôi môi.',
              category: 'c1_c2_vocab' as const,
            },
            {
              keyConcept: 'Equilibrium (n) - Trạng thái cân bằng bền vững',
              mnemonicStory:
                'Một quả cầu pha lê cân bằng tuyệt đối trên đầu mũi kim giữa không trung.',
              category: 'stem_formula' as const,
            },
            {
              keyConcept: 'Strawman Fallacy - Ngụy biện bẻ cong luận điểm đối phương',
              mnemonicStory: 'Một con bù nhìn rơm bị châm lửa đốt để đánh lừa khán giả.',
              category: 'argument_fallacy' as const,
            },
          ]

    for (let i = 0; i < templates.length; i++) {
      const tmpl = templates[i]
      const concept = sampleConcepts[i % sampleConcepts.length]
      if (tmpl && concept) {
        loci.push({
          // Hậu tố ngẫu nhiên (không dùng Date.now()) — hai locus tạo trong cùng một
          // mili-giây từng sinh ra id TRÙNG NHAU, khiến tra cứu trả về nhầm bản ghi.
          id: `locus-${params.theme}-${i + 1}-${randomUUID()}`,
          positionIndex: i,
          label: tmpl.label,
          spatialCoordinates: { x: tmpl.x, y: tmpl.y, z: tmpl.z || 0 },
          anchorType: tmpl.anchorType,
          keyConcept: concept.keyConcept,
          mnemonicStory: concept.mnemonicStory,
          category: concept.category,
          retentionStrength: INITIAL_RETENTION_STRENGTH,
          mastered: false,
        })
      }
    }

    // Cùng lý do như id của locus: phòng mặc định và phòng người dùng vừa tạo có thể rơi
    // vào cùng một mili-giây và cùng theme, làm find(id) khớp nhầm phòng rồi trả 404.
    const roomId = `room-${params.theme}-${randomUUID()}`
    const now = new Date().toISOString()

    return {
      id: roomId,
      personId,
      name: params.name,
      theme: params.theme,
      description: params.description || defaultDescriptions[params.theme],
      ambientAudioPrompt: `Âm thanh không gian ${params.theme} tĩnh lặng, tập trung sóng não Alpha`,
      loci,
      totalAnchorsCount: loci.length,
      masteredAnchorsCount: 0,
      averageRetentionRate: Math.round(
        loci.reduce((acc, l) => acc + l.retentionStrength, 0) / loci.length,
      ),
      createdAt: now,
      updatedAt: now,
    }
  }

  /**
   * Đánh giá câu trả lời truy xuất trí nhớ tại điểm neo không gian Loci (Spatial Active Recall).
   */
  static verifyLocusRecall(locus: LocusAnchor, userRecallText: string): LocusRecallResult {
    const normalizedUser = userRecallText.toLowerCase().trim()
    const conceptTokens = locus.keyConcept
      .toLowerCase()
      .split(/[\s,()-]+/)
      .filter((t) => t.length > 2)

    let matchCount = 0
    for (const token of conceptTokens) {
      if (normalizedUser.includes(token)) {
        matchCount++
      }
    }

    const similarityRatio = conceptTokens.length > 0 ? matchCount / conceptTokens.length : 0
    const isAccurate = similarityRatio >= 0.4 || normalizedUser.length > 20

    const similarityScore = Math.min(
      100,
      Math.round(similarityRatio * 80 + (normalizedUser.length > 10 ? 20 : 0)),
    )
    // Kẹp trong [0, 100]: từ khởi điểm 0, trả lời sai lần đầu không được rơi xuống -5
    // (hợp đồng `retentionStrength` là min(0) — giá trị âm làm hỏng lần đọc sau).
    const strengthenedRetention = Math.max(
      0,
      Math.min(
        MAX_RETENTION,
        locus.retentionStrength + (isAccurate ? RECALL_GAIN : -RECALL_PENALTY),
      ),
    )

    const nextDate = new Date()
    nextDate.setDate(nextDate.getDate() + (isAccurate ? 7 : 1))

    return {
      locusId: locus.id,
      isAccurate,
      similarityScore,
      feedback: isAccurate
        ? `Tuyệt vời! Bạn đã kích hoạt thành công điểm neo "${locus.label}". Hình ảnh liên tưởng thần kinh đã được củng cố.`
        : `Điểm neo chưa kích hoạt trọn vẹn. Hãy nhắm mắt hình dung lại câu chuyện: "${locus.mnemonicStory}".`,
      strengthenedRetention,
      nextRecommendedReviewDate: nextDate.toISOString(),
    }
  }
}
