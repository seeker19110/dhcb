import { describe, it, expect } from 'vitest'
import { ArticulatoryGuideSchema } from './articulatoryPhonetics.js'

describe('articulatoryPhonetics contracts', () => {
  it('validates articulatory anatomy guide', () => {
    const guide = {
      targetPhoneme: 'TH_VOICELESS',
      ipaSymbol: '/θ/',
      commonVietnameseMistake:
        'Phát âm nhầm thành /t/ hoặc /s/ (ví dụ: "thank" -> "tank" hoặc "sank")',
      tonguePosition: 'tip_between_teeth',
      jawOpening: 'half_open',
      lipShape: 'neutral',
      vocalCordVibration: false,
      airflowDescription: 'Luồng khí liên tục đi qua khe giữa đầu lưỡi và răng cửa hàm trên',
      stepByStepAnatomyTips: [
        'Đặt nhẹ đầu lưỡi thò ra giữa hai hàm răng',
        'Thổi nhẹ luồng khí ra ngoài mà không làm rung dây thanh',
      ],
    }

    const parsed = ArticulatoryGuideSchema.parse(guide)
    expect(parsed.targetPhoneme).toBe('TH_VOICELESS')
    expect(parsed.vocalCordVibration).toBe(false)
  })
})
