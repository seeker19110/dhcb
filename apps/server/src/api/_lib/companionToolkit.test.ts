import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('@dhcb/subject-english/dictionaryData', async (importOriginal) => {
  const real = await importOriginal<typeof import('@dhcb/subject-english/dictionaryData')>()
  return {
    ...real,
    // Bộ từ điển nhỏ cố định — không đọc 2,6 MB file thật trong unit test.
    getAllEntries: () => [
      {
        word: 'runner',
        pos: 'n',
        vi: 'người chạy',
        ex_en: 'A fast runner.',
        ex_vi: 'Người chạy nhanh.',
      },
      {
        word: 'run',
        pos: 'v',
        vi: 'chạy',
        ex_en: 'I run.',
        ex_vi: 'Tôi chạy.',
        ipa_en: '/rʌn/',
        level: 'A1',
      },
      { word: 'rerun', pos: 'v', vi: 'chạy lại', ex_en: '', ex_vi: '' },
    ],
  }
})

import { getCompanionToolkit, lookupDictionary } from './companionToolkit.js'

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('lookupDictionary', () => {
  it('từ khớp ĐÚNG lên đầu, rồi tới từ bắt đầu bằng / chứa từ khoá', () => {
    expect(lookupDictionary('  Run ', 5).map((h) => h.word)).toEqual(['run', 'runner', 'rerun'])
  })

  it('ánh xạ đủ trường, bỏ trường rỗng', () => {
    const [run, , rerun] = lookupDictionary('run', 5)
    expect(run).toEqual({
      word: 'run',
      pos: 'v',
      vi: 'chạy',
      exampleEn: 'I run.',
      exampleVi: 'Tôi chạy.',
      ipa: '/rʌn/',
      level: 'A1',
    })
    expect(rerun).toEqual({ word: 'rerun', pos: 'v', vi: 'chạy lại' })
  })

  it('tra theo nghĩa tiếng Việt có dấu, tôn trọng `limit`, từ khoá rỗng ⇒ []', () => {
    expect(lookupDictionary('chạy lại', 5).map((h) => h.word)).toEqual(['rerun'])
    expect(lookupDictionary('run', 1)).toHaveLength(1)
    expect(lookupDictionary('   ', 5)).toEqual([])
  })
})

describe('getCompanionToolkit', () => {
  it('mặc định bật; COMPANION_TOOLS=off ⇒ undefined', () => {
    expect(getCompanionToolkit()).toBeDefined()
    vi.stubEnv('COMPANION_TOOLS', 'off')
    expect(getCompanionToolkit()).toBeUndefined()
  })
})
