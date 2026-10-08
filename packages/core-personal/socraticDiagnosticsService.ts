// packages/core-personal/socraticDiagnosticsService.ts — V3 Socratic Cognitive Diagnostic Service.
import { randomUUID } from 'node:crypto'
import {
  type MentalModelMisconception,
  type CognitiveBreakthroughRecord,
  type SocraticReflectionTurn,
  SOCRATIC_SCHEMA_VERSION,
} from '@dhcb/core-contracts/socraticDiagnostics'

export const PREDEFINED_MISCONCEPTIONS: MentalModelMisconception[] = [
  {
    id: 'present_perfect_past_confusion',
    title: 'Hiện tại Hoàn thành (Trải nghiệm) vs Quá khứ Đơn (Mốc thời gian đóng)',
    domain: 'aspect_vs_tense_confusion',
    surfaceErrorPattern: 'I have visited Da Nang last summer.',
    rootCauseAnalysis:
      'Người học liên tưởng chữ "đã" trong tiếng Việt sang "have visited" thay vì nhận diện mốc thời gian "last summer" đã kết thúc hoàn toàn.',
    inquiryPath: [
      {
        stepIndex: 0,
        guidingQuestion:
          'Trong câu "I visited Da Nang last summer", khoảng thời gian "last summer" là một mốc thời gian đã đóng lại trong quá khứ hay còn kéo dài đến tận hôm nay?',
        expectedMentalConcept: 'thời gian đã kết thúc hoàn toàn trong quá khứ',
        hintIfStuck: 'Hãy so sánh mùa hè năm ngoái với thời điểm hiện tại của bạn.',
      },
      {
        stepIndex: 1,
        guidingQuestion:
          'Chính xác! Vậy theo nguyên tắc ngữ pháp tiếng Anh, khi một hành động đi kèm một mốc thời gian đã khóa lại hoàn toàn trong quá khứ, ta dùng thì Quá khứ Đơn (Past Simple) hay Hiện tại Hoàn thành (Present Perfect)?',
        expectedMentalConcept: 'quá khứ đơn',
        hintIfStuck:
          'Hiện tại hoàn thành chỉ dùng khi thời gian chưa kết thúc hoặc không đề cập thời điểm cụ thể.',
      },
      {
        stepIndex: 2,
        guidingQuestion:
          'Tuyệt vời! Bây giờ bạn hãy tự sửa lại câu "I have visited Da Nang last summer" thành câu đúng chuẩn và giải thích vì sao câu mới lại đúng?',
        expectedMentalConcept: 'i visited da nang last summer',
        hintIfStuck: 'Bỏ trợ động từ have và giữ nguyên động từ visited.',
      },
    ],
    schemaVersion: SOCRATIC_SCHEMA_VERSION,
  },
  {
    id: 'vietnamese_to_be_omission',
    title: 'Lược bỏ động từ To-Be trước tính từ do ảnh hưởng ngữ pháp tiếng Việt',
    domain: 'vietnamese_grammar_interference',
    surfaceErrorPattern: 'She very happy today / I agree with you (hiểu agree là tính từ)',
    rootCauseAnalysis:
      'Trong tiếng Việt, tính từ có thể tự đóng vai trò làm vị ngữ ("Cô ấy vui"), trong khi tiếng Anh bắt buộc phải có hệ từ (linking verb) hoặc động từ to-be kết nối.',
    inquiryPath: [
      {
        stepIndex: 0,
        guidingQuestion:
          'Trong tiếng Anh, một câu hoàn chỉnh bắt buộc phải có thành phần cốt lõi nào đi sau chủ ngữ?',
        expectedMentalConcept: 'động từ',
        hintIfStuck: 'Một câu tiếng Anh không thể tồn tại nếu thiếu Verb (V).',
      },
      {
        stepIndex: 1,
        guidingQuestion:
          'Đúng vậy. Từ "happy" là Tính từ (Adjective) hay Động từ (Verb)? Nếu nó là Tính từ thì câu cần thêm từ gì để đóng vai trò làm động từ?',
        expectedMentalConcept: 'tính từ cần thêm to be',
        hintIfStuck: 'Cần động từ to-be (am/is/are) đứng trước tính từ.',
      },
    ],
    schemaVersion: SOCRATIC_SCHEMA_VERSION,
  },
  {
    id: 'diplomatic_politeness_imperative',
    title: 'Văn phong mệnh lệnh trực tiếp vs Giao tiếp ngoại giao công sở',
    domain: 'register_and_politeness',
    surfaceErrorPattern: 'Send me the file now / You must do this immediately.',
    rootCauseAnalysis:
      'Dịch trực tiếp từ câu chỉ đạo tiếng Việt sang tiếng Anh khiến câu mang sắc thái áp đặt, thiếu tính hợp tác ngoại giao trong môi trường quốc tế.',
    inquiryPath: [
      {
        stepIndex: 0,
        guidingQuestion:
          'Khi đồng nghiệp nước ngoài nhận được câu "Send me the file now", họ có thể cảm thấy như thế nào về thái độ giao tiếp?',
        expectedMentalConcept: 'gay gắt thiếu lịch sự áp đặt',
        hintIfStuck: 'Mệnh lệnh trực tiếp dễ khiến người nghe cảm thấy bị ra lệnh thay vì hợp tác.',
      },
      {
        stepIndex: 1,
        guidingQuestion:
          'Làm thế nào để chuyển đổi câu trên thành một lời đề nghị trang nhã bằng cách dùng "Could you please..." hoặc "Would you mind..."?',
        expectedMentalConcept: 'could you please send me the file',
        hintIfStuck: 'Dùng trợ động từ khuyết thiếu để làm mềm câu yêu cầu.',
      },
    ],
    schemaVersion: SOCRATIC_SCHEMA_VERSION,
  },
]

// Bộ nhớ đệm cho các phiên Socratic
const socraticSessions = new Map<string, CognitiveBreakthroughRecord>()

export function listMisconceptions(): MentalModelMisconception[] {
  return [...PREDEFINED_MISCONCEPTIONS]
}

export function getMisconceptionById(id: string): MentalModelMisconception | undefined {
  return PREDEFINED_MISCONCEPTIONS.find((m) => m.id === id)
}

/**
 * Đọc một phiên Socratic theo id (không kiểm chủ). Handler PHẢI so `personId` của phiên với
 * người đang đăng nhập trước khi dùng — Map này chứa phiên của MỌI người dùng.
 */
export function getSocraticSession(sessionId: string): CognitiveBreakthroughRecord | undefined {
  return socraticSessions.get(sessionId)
}

export function startSocraticSession(
  personId: string,
  misconceptionId: string,
): CognitiveBreakthroughRecord {
  const misconception = getMisconceptionById(misconceptionId)
  if (!misconception) {
    throw new Error(`Không tìm thấy chủ đề chẩn đoán ${misconceptionId}`)
  }

  const now = new Date().toISOString()
  const firstStep = misconception.inquiryPath[0]!

  const initialTurn: SocraticReflectionTurn = {
    stepIndex: 0,
    question: firstStep.guidingQuestion,
    learnerAnswer: '',
    conceptUnderstood: false,
    companionFeedback:
      'Hãy suy ngẫm và trả lời câu hỏi dẫn dắt này theo cách hiểu tự nhiên của bạn.',
    timestamp: now,
  }

  const record: CognitiveBreakthroughRecord = {
    id: randomUUID(),
    personId,
    misconceptionId,
    status: 'in_progress',
    currentStepIndex: 0,
    turns: [initialTurn],
    createdAt: now,
    updatedAt: now,
    schemaVersion: SOCRATIC_SCHEMA_VERSION,
  }

  socraticSessions.set(record.id, record)
  return record
}

export interface SubmitReflectionResult {
  updatedRecord: CognitiveBreakthroughRecord
  isComplete: boolean
  feedback: string
  nextQuestion?: string
}

export function submitSocraticReflection(
  sessionId: string,
  learnerAnswer: string,
): SubmitReflectionResult {
  const record = socraticSessions.get(sessionId)
  if (!record || record.status === 'breakthrough_achieved') {
    throw new Error(`Phiên Socratic ${sessionId} không hợp lệ hoặc đã hoàn tất`)
  }

  const misconception = getMisconceptionById(record.misconceptionId)
  if (!misconception) {
    throw new Error(`Misconception ${record.misconceptionId} không tồn tại`)
  }

  const currentStep = misconception.inquiryPath[record.currentStepIndex]
  if (!currentStep) {
    throw new Error('Bước câu hỏi không hợp lệ')
  }

  const now = new Date().toISOString()
  const normalizedAnswer = learnerAnswer.toLowerCase().trim()

  // Phân tích xem câu trả lời có phản ánh đúng ý niệm trọng tâm không
  const expectedKeywords = currentStep.expectedMentalConcept.toLowerCase().split(/\s+/)
  const matchCount = expectedKeywords.filter((k) => normalizedAnswer.includes(k)).length
  const conceptUnderstood = matchCount >= 1 || normalizedAnswer.length > 15

  let feedback = ''
  if (conceptUnderstood) {
    feedback = `Xuất sắc! Bạn đã nhận ra mấu chốt: "${currentStep.expectedMentalConcept}".`
  } else {
    feedback = `Gần đúng rồi! Gợi ý thêm cho bạn: ${currentStep.hintIfStuck}`
  }

  // Cập nhật lượt hiện tại
  const lastTurn = record.turns[record.turns.length - 1]
  if (lastTurn) {
    lastTurn.learnerAnswer = learnerAnswer
    lastTurn.conceptUnderstood = conceptUnderstood
    lastTurn.companionFeedback = feedback
  }

  const isLastStep = record.currentStepIndex >= misconception.inquiryPath.length - 1

  if (conceptUnderstood && isLastStep) {
    record.status = 'breakthrough_achieved'
    record.breakthroughSummary = `Người học đã thấu suốt bản chất của "${misconception.title}" thông qua phương pháp tự phản tư Socratic.`
    record.updatedAt = now
    socraticSessions.set(sessionId, record)
    return {
      updatedRecord: record,
      isComplete: true,
      feedback: `${feedback} 🎉 Bạn đã đạt trạng thái Thấu Suốt Nhận Thức (Cognitive Breakthrough)!`,
    }
  }

  if (conceptUnderstood && !isLastStep) {
    record.currentStepIndex += 1
    const nextStep = misconception.inquiryPath[record.currentStepIndex]!
    const nextTurn: SocraticReflectionTurn = {
      stepIndex: record.currentStepIndex,
      question: nextStep.guidingQuestion,
      learnerAnswer: '',
      conceptUnderstood: false,
      companionFeedback: 'Hãy tiếp tục bước tiếp theo để liên kết toàn bộ mô hình tư duy.',
      timestamp: now,
    }
    record.turns.push(nextTurn)
    record.updatedAt = now
    socraticSessions.set(sessionId, record)
    return {
      updatedRecord: record,
      isComplete: false,
      feedback,
      nextQuestion: nextStep.guidingQuestion,
    }
  }

  record.updatedAt = now
  socraticSessions.set(sessionId, record)
  return {
    updatedRecord: record,
    isComplete: false,
    feedback,
  }
}
