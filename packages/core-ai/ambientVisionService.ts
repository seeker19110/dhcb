// packages/core-ai/ambientVisionService.ts — V3 Ambient Vision & Screen Grounding Service.
import { fetchWithTimeout } from '@dhcb/core-http/fetchTimeout'
import {
  type AmbientContextInsight,
  type AppType,
  AmbientContextInsightSchema,
  AMBIENT_SCHEMA_VERSION,
} from '@dhcb/core-contracts/ambientContext'
import { normalizePillarDomain, type PillarDomain } from '@dhcb/core-contracts/pillarDomain'

const AMBIENT_TIMEOUT_MS = 25_000

export function cleanBase64Image(raw: string): { data: string; mimeType: string } {
  let mimeType = 'image/jpeg'
  let data = raw.trim()

  const match = data.match(/^data:(image\/[a-zA-Z0-9.+_-]+);base64,(.*)$/)
  if (match && match[1] && match[2]) {
    mimeType = match[1]
    data = match[2]
  }

  return { data, mimeType }
}

export function parseAmbientVisionText(aiText: string): {
  detectedApp: AppType
  summaryOfWork: string
  relevantDomain: PillarDomain
  tips: Array<{
    title: string
    description: string
    type: 'vocabulary' | 'grammar_fix' | 'code_refactor' | 'concept_explainer' | 'productivity'
    relevanceScore: number
    actionPayload?: string
  }>
  extractedKeywords: string[]
} {
  const jsonMatch = aiText.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
  const targetStr = jsonMatch && jsonMatch[1] ? jsonMatch[1] : aiText.trim()

  try {
    const parsed = JSON.parse(targetStr)
    if (parsed.summaryOfWork && Array.isArray(parsed.tips)) {
      return {
        detectedApp: (parsed.detectedApp || 'browser') as AppType,
        summaryOfWork: String(parsed.summaryOfWork),
        // Kết quả AI là dữ liệu ngoài: giá trị lạ → 'general', trụ đã xoá → 'general' (changelog 0628).
        relevantDomain: normalizePillarDomain(parsed.relevantDomain),
        tips: parsed.tips.map(
          (t: {
            title?: string
            description?: string
            type?: string
            relevanceScore?: number
            actionPayload?: string
          }) => ({
            title: String(t.title || 'Gợi ý ngữ cảnh'),
            description: String(t.description || ''),
            type: (t.type || 'productivity') as
              'vocabulary' | 'grammar_fix' | 'code_refactor' | 'concept_explainer' | 'productivity',
            relevanceScore: Math.min(1, Math.max(0, Number(t.relevanceScore) || 0.9)),
            actionPayload: t.actionPayload ? String(t.actionPayload) : undefined,
          }),
        ),
        extractedKeywords: Array.isArray(parsed.extractedKeywords)
          ? parsed.extractedKeywords.map((k: unknown) => String(k))
          : [],
      }
    }
  } catch {
    // Fallback parser
  }

  return {
    detectedApp: 'browser',
    summaryOfWork: 'Đang theo dõi ngữ cảnh làm việc trên màn hình',
    relevantDomain: 'learning',
    tips: [
      {
        title: 'Trợ lý Ngữ cảnh Màn hình Đang Hoạt động',
        description: 'Tự động phát hiện từ vựng tiếng Anh và cấu trúc quan trọng khi bạn làm việc.',
        type: 'productivity',
        relevanceScore: 0.9,
      },
    ],
    extractedKeywords: ['Context', 'Focus', 'Workflow'],
  }
}

export async function analyzeAmbientScreenFrame(
  base64Image: string,
  focusHint?: string,
): Promise<AmbientContextInsight> {
  const { data: cleanedData, mimeType } = cleanBase64Image(base64Image)
  // CHỈ đọc GEMINI_API_KEY. Trước 2026-09-05 còn nhánh dự phòng `VITE_GEMINI_API_KEY` — mọi
  // biến có tiền tố VITE_ đều bị Vite NHÚNG THẲNG vào bundle client lúc build, nên ai đặt tên
  // đó vào .env để "cho nó chạy" là vô tình công khai khoá Gemini (audit 2026-09-05, F4).
  const apiKey = process.env.GEMINI_API_KEY || ''

  if (!apiKey) {
    // Fallback deterministic analysis khi chưa có API key trong test
    const parsed = parseAmbientVisionText('')
    return AmbientContextInsightSchema.parse({
      timestamp: new Date().toISOString(),
      detectedApp: parsed.detectedApp,
      summaryOfWork: parsed.summaryOfWork,
      relevantDomain: parsed.relevantDomain,
      tips: parsed.tips,
      extractedKeywords: parsed.extractedKeywords,
      schemaVersion: AMBIENT_SCHEMA_VERSION,
    })
  }

  const prompt = `Bạn là Trợ lý Thị giác Môi trường (Ambient Vision Copilot) của Đồng Hành V3.
Nhiệm vụ của bạn: Nhìn vào hình ảnh chụp màn hình đang làm việc của người dùng và đưa ra hỗ trợ ngữ cảnh tinh tế, không làm phiền.
${focusHint ? `Gợi ý trọng tâm người dùng: ${focusHint}` : ''}

Hãy trả về DUY NHẤT một JSON hợp lệ dạng:
\`\`\`json
{
  "detectedApp": "browser" | "code_editor" | "document_editor" | "presentation" | "chat_app" | "general_desktop",
  "summaryOfWork": "Tóm tắt ngắn 1 câu người dùng đang làm gì",
  "relevantDomain": "learning" | "work" | "general",
  "tips": [
    {
      "title": "Tên gợi ý",
      "description": "Giải thích ngắn gọn hoặc gợi ý cải tiến",
      "type": "vocabulary" | "grammar_fix" | "code_refactor" | "concept_explainer" | "productivity",
      "relevanceScore": 0.95
    }
  ],
  "extractedKeywords": ["keyword1", "keyword2"]
}
\`\`\``

  // [2026-08-24] Đổi từ 'gemini-2.0-flash' — Google đã gỡ hẳn model này (xác nhận qua lỗi 404
  // thật khi chạy npm run eval:tutor, xem aiConfig.ts GEMINI_CHAT_MODEL). CHƯA verify được với
  // key thật ở đây — cần người có key chạy thử trước khi tin tưởng hoàn toàn.
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`
  const body = {
    contents: [
      {
        parts: [{ text: prompt }, { inlineData: { mimeType, data: cleanedData } }],
      },
    ],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 1000,
    },
  }

  const response = await fetchWithTimeout(
    url,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
    AMBIENT_TIMEOUT_MS,
  )

  if (!response.ok) {
    const parsed = parseAmbientVisionText('')
    return AmbientContextInsightSchema.parse({
      timestamp: new Date().toISOString(),
      detectedApp: parsed.detectedApp,
      summaryOfWork: parsed.summaryOfWork,
      relevantDomain: parsed.relevantDomain,
      tips: parsed.tips,
      extractedKeywords: parsed.extractedKeywords,
      schemaVersion: AMBIENT_SCHEMA_VERSION,
    })
  }

  const resJson = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
  }
  const rawText = resJson.candidates?.[0]?.content?.parts?.[0]?.text || ''
  const parsed = parseAmbientVisionText(rawText)

  return AmbientContextInsightSchema.parse({
    timestamp: new Date().toISOString(),
    detectedApp: parsed.detectedApp,
    summaryOfWork: parsed.summaryOfWork,
    relevantDomain: parsed.relevantDomain,
    tips: parsed.tips,
    extractedKeywords: parsed.extractedKeywords,
    schemaVersion: AMBIENT_SCHEMA_VERSION,
  })
}
