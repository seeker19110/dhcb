// packages/core-contracts/articulatoryPhonetics.ts — Hợp đồng dữ liệu cho hướng dẫn khẩu hình (3D Articulatory Phonetics).
// Changelog 0563 đã gỡ `PitchSample`/`PitchContourData`/`PhoneticAnalysisReport`: chúng chở đường
// pitch "người học" sinh ngẫu nhiên và điểm khớp giả — không có âm thanh nào được đo.
import { z } from 'zod'

export const L1PhonemeTargetSchema = z.enum([
  'TH_VOICELESS', // /θ/ as in "think"
  'TH_VOICED', // /ð/ as in "this"
  'ASH_SHORT_A', // /æ/ as in "cat" vs /ʌ/ "cut"
  'RETROFLEX_R', // /r/ as in "red" vs VN /r/
  'FINAL_CLUSTER_KS', // /-ks/ as in "box", "fix"
  'AFFRICATE_CH', // /tʃ/ as in "church"
  'AFFRICATE_JH', // /dʒ/ as in "judge"
  'FINAL_SIBILANT_Z', // /-z/ as in "dogs", "plays"
])

export type L1PhonemeTarget = z.infer<typeof L1PhonemeTargetSchema>

export const TonguePositionSchema = z.enum([
  'tip_between_teeth',
  'tip_alveolar_ridge',
  'blade_hard_palate',
  'dorsum_velar',
  'low_front',
  'low_back',
  'curled_retroflex',
])

export type TonguePosition = z.infer<typeof TonguePositionSchema>

export const JawOpeningSchema = z.enum(['closed', 'half_open', 'fully_open'])
export const LipShapeSchema = z.enum(['spread', 'neutral', 'rounded'])

export const ArticulatoryGuideSchema = z
  .object({
    targetPhoneme: L1PhonemeTargetSchema,
    ipaSymbol: z.string().min(1).max(10),
    commonVietnameseMistake: z.string().min(1).max(300),
    tonguePosition: TonguePositionSchema,
    jawOpening: JawOpeningSchema,
    lipShape: LipShapeSchema,
    vocalCordVibration: z.boolean(),
    airflowDescription: z.string().min(1).max(300),
    stepByStepAnatomyTips: z.array(z.string()).min(1),
  })
  .strict()

export type ArticulatoryGuide = z.infer<typeof ArticulatoryGuideSchema>
