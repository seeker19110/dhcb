// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest'
import fixtures from '../eval-companion-replay-fixtures.json'
import { CompanionReplaySetSchema, runCompanionReplay } from './companionReplayEval'

const copy = () => CompanionReplaySetSchema.parse(structuredClone(fixtures))
afterEach(() => vi.unstubAllGlobals())

describe('hợp đồng cassette Companion', () => {
  it.each([
    {},
    [],
    { ...fixtures, schemaVersion: 2 },
    { ...fixtures, origin: 'provider_recording' },
    { ...fixtures, cases: [] },
  ])('từ chối dữ liệu hỏng/không được hỗ trợ', (raw) => {
    expect(() => CompanionReplaySetSchema.parse(raw)).toThrow()
  })
  it('ID trùng không được bù cho nhóm thiếu', () => {
    const set = copy()
    set.cases[1] = set.cases[0]!
    expect(() => CompanionReplaySetSchema.parse(set)).toThrow(/ID trùng|Thiếu nhóm/)
  })
  it('không cho nhãn stream thay phép thử callback thực', () => {
    const set = copy()
    set.cases.find((c) => c.group === 'stream')!.stream = false
    expect(() => CompanionReplaySetSchema.parse(set)).toThrow(/callback/)
  })

  it.each([
    'text',
    'read_tool',
    'pending_proposal',
    'stream',
    'malformed_json',
    'timeout',
    'stream_cut',
  ])('thiếu nhóm %s dù bù đủ số ca vẫn phải đỏ', (group) => {
    const set = copy()
    const kept = set.cases.filter((c) => c.group !== group)
    set.cases = [...kept, { ...kept[0]!, id: 'extra-unique-id' }]
    expect(() => CompanionReplaySetSchema.parse(set)).toThrow(/Thiếu nhóm/)
  })

  it('không được gán JSON hợp lệ thành ca malformed_json', () => {
    const set = copy()
    const response = set.cases.find((c) => c.group === 'malformed_json')!.exchanges[0]!.response
    if (response.kind !== 'http') throw new Error('Ca JSON phải là HTTP')
    response.body = '{}'
    expect(() => CompanionReplaySetSchema.parse(set)).toThrow(/JSON hỏng/)
  })
})

describe('replay qua SDK/parser/tool loop/prompt production', () => {
  it('7/7 ca tổng hợp đạt khi không có mạng và không có key thật', async () => {
    const network = vi.fn(() => {
      throw new Error('Không được gọi mạng')
    })
    vi.stubGlobal('fetch', network)
    const result = await runCompanionReplay(fixtures)
    expect(result, JSON.stringify(result)).toMatchObject({ total: 7, passed: 7, exitCode: 0 })
    expect(network).not.toHaveBeenCalled()
  })

  it('negative control: fingerprint lệch ở ca chờ network_error vẫn phải đỏ', async () => {
    const set = copy()
    set.cases.find((c) => c.group === 'malformed_json')!.exchanges[0]!.requestFingerprint =
      '0'.repeat(64)
    const result = await runCompanionReplay(set)
    expect(result.exitCode).toBe(1)
    expect(result.results.find((r) => r.id === 'replay-malformed_json')?.violations).toContain(
      'REPLAY_INCOMPLETE',
    )
  })

  it('negative control: thiếu sự kiện text stream làm cổng đỏ', async () => {
    const set = copy()
    const response = set.cases.find((c) => c.group === 'stream')!.exchanges[0]!.response
    if (response.kind !== 'http') throw new Error('Ca stream phải có HTTP response')
    response.body = response.body.replace(/event: content_block_delta\ndata: [^\n]+\n\n/g, '')
    const result = await runCompanionReplay(set)
    expect(result.exitCode).toBe(1)
    expect(result.results.find((r) => r.id === 'replay-stream')?.violations).toContain(
      'REPLAY_DELTA_MISMATCH',
    )
  })

  it('negative control: model gọi tool bị cấm phải đỏ dù SDK vẫn trả kết quả', async () => {
    const set = copy()
    const response = set.cases.find((c) => c.group === 'read_tool')!.exchanges[0]!.response
    if (response.kind !== 'http') throw new Error('Ca đọc phải có HTTP response')
    response.body = response.body.replace('get_review_queue', 'grant_vip')
    const result = await runCompanionReplay(set)
    expect(result.exitCode).toBe(1)
    expect(result.results.find((r) => r.id === 'replay-read_tool')?.violations).toContain(
      'REPLAY_FORBIDDEN_TOOL',
    )
  })

  it('negative control: executor tự nhận committed phải đỏ', async () => {
    const set = copy()
    set.cases.find((c) => c.group === 'pending_proposal')!.toolReplies.propose_memory!.content =
      '{"status":"committed"}'
    const result = await runCompanionReplay(set)
    expect(result.exitCode).toBe(1)
    expect(result.results.find((r) => r.id === 'replay-pending_proposal')?.violations).toContain(
      'REPLAY_PROPOSAL_NOT_PENDING',
    )
  })

  it('negative control: lời văn tự nhận đã ghi phải đỏ', async () => {
    const set = copy()
    const c = set.cases.find((c) => c.group === 'text')!
    const response = c.exchanges[0]!.response
    if (response.kind !== 'http') throw new Error('Ca text phải có HTTP response')
    response.body = response.body.replace('Chào bạn!', 'Tôi đã lưu ghi chú cho bạn.')
    c.expect.text = 'Tôi đã lưu ghi chú cho bạn.'
    const result = await runCompanionReplay(set)
    expect(result.exitCode).toBe(1)
    expect(result.results.find((r) => r.id === 'replay-text')?.violations).toContain(
      'REPLAY_FALSE_SAVE_CLAIM',
    )
  })

  it('đổi config timeout ngoài body request cũng phải đỏ', async () => {
    const set = copy()
    set.route.timeoutMs++
    expect((await runCompanionReplay(set)).exitCode).toBe(1)
  })

  it('negative control: lời tự nhận đã lưu trong delta trước lỗi cũng phải đỏ', async () => {
    const set = copy()
    const c = set.cases.find((c) => c.group === 'stream_cut')!
    const response = c.exchanges[0]!.response
    if (response.kind !== 'stream_error') throw new Error('Ca đứt phải có stream_error')
    response.chunks = response.chunks.map((s) =>
      s.replace('Một phần câu trả lời', 'Tôi đã lưu ghi chú cho bạn.'),
    )
    c.expect.deltas = 'Tôi đã lưu ghi chú cho bạn.'
    const result = await runCompanionReplay(set)
    expect(result.exitCode).toBe(1)
    expect(result.results.find((r) => r.id === c.id)?.violations).toContain(
      'REPLAY_FALSE_SAVE_CLAIM',
    )
  })

  it('negative control: lỗi parser sớm không được giả làm transport cut đã chờ', async () => {
    const set = copy()
    const c = set.cases.find((c) => c.group === 'stream_cut')!
    const response = c.exchanges[0]!.response
    if (response.kind !== 'stream_error') throw new Error('Ca đứt phải có stream_error')
    response.chunks.push('event: content_block_delta\ndata: {\n\n')
    const result = await runCompanionReplay(set)
    expect(result.exitCode).toBe(1)
    expect(result.results.find((r) => r.id === c.id)?.violations).toContain('REPLAY_INCOMPLETE')
  })
})
