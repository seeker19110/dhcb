import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it, expect } from 'vitest'
import * as service from './articulatoryPhoneticsService.js'
import { getArticulatoryGuide } from './articulatoryPhoneticsService.js'

describe('articulatoryPhoneticsService', () => {
  it('retrieves anatomy guide for TH_VOICELESS and ASH_SHORT_A', () => {
    const thGuide = getArticulatoryGuide('TH_VOICELESS')
    expect(thGuide.ipaSymbol).toBe('/θ/')
    expect(thGuide.tonguePosition).toBe('tip_between_teeth')
    expect(thGuide.vocalCordVibration).toBe(false)

    const ashGuide = getArticulatoryGuide('ASH_SHORT_A')
    expect(ashGuide.ipaSymbol).toBe('/æ/')
    expect(ashGuide.jawOpening).toBe('fully_open')
  })

  it('không còn hàm sinh đường pitch/điểm giả (changelog 0563)', () => {
    expect('generatePitchContour' in service).toBe(false)
    expect('analyzePhoneticsAndPitch' in service).toBe(false)
    const source = readFileSync(join(__dirname, 'articulatoryPhoneticsService.ts'), 'utf8')
    expect(source).not.toMatch(/Math\.random/)
  })
})
