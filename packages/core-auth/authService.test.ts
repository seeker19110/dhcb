import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createHash } from 'node:crypto'
import { getPgPool } from '@dhcb/core-db/pgPool'

// google-auth-library: mock verifyIdToken để test verifyGoogleIdToken không gọi mạng thật.
const googleAuth = vi.hoisted(() => ({ verifyIdToken: vi.fn() }))
vi.mock('google-auth-library', () => ({ OAuth2Client: vi.fn() }))

// jose: mock jwtVerify dùng chung cho verifyAppleIdToken/verifyMicrosoftIdToken.
const jose = vi.hoisted(() => ({ jwtVerify: vi.fn() }))
vi.mock('jose', () => ({
  createRemoteJWKSet: vi.fn(() => ({})),
  jwtVerify: jose.jwtVerify,
}))

import { OAuth2Client } from 'google-auth-library'
import {
  hashPassword,
  verifyPassword,
  validateSessionToken,
  createUserWithPassword,
  createSession,
  revokeSession,
  verifyUserPassword,
  getUserById,
  ensureProfileRow,
  verifyGoogleIdToken,
  verifyGoogleAccessToken,
  verifyFacebookAccessToken,
  verifyAppleIdToken,
  verifyMicrosoftIdToken,
  findOrCreateGoogleUser,
  findOrCreateFacebookUser,
  findOrCreateAppleUser,
  findOrCreateMicrosoftUser,
  hashSessionToken,
  OAuthAccountLinkRequiredError,
} from './authService.js'

vi.mock('@dhcb/core-db/pgPool', () => ({ getPgPool: vi.fn() }))
const mockedGetPool = vi.mocked(getPgPool)

function mockPool(queryImpl: (sql: string, params?: unknown[]) => Promise<{ rows: unknown[] }>) {
  const query = vi.fn(queryImpl)
  return { query, connect: async () => ({ query, release: vi.fn() }) } as unknown as ReturnType<
    typeof getPgPool
  >
}

// Bốn describe dưới đây (hashPassword/verifyPassword, createUserWithPassword,
// verifyUserPassword, createUserWithPassword — nhánh thành công) đều gọi bcrypt.hash/compare
// THẬT với BCRYPT_ROUNDS=12 (không mock) — cố ý, vì đây chính là chi phí bảo mật thật của
// production, không phải việc test dựng thừa. Đo thật 2026-09-16, chạy riêng file: mỗi lượt
// hash/compare 12 vòng dao động 400ms–1.75s TRÊN MÁY RẢNH. Dưới tải CI (nhiều file test song
// song, cùng nhóm với `programmingSrs`/`seed-all`/`lessonsPython` đã trả nợ ở #937/#949/PR
// này), cùng khuôn "Test timed out in 5000ms" đã xảy ra thật (S05-2, full suite). Nới ngưỡng
// từng describe lên 10s thay vì giảm BCRYPT_ROUNDS — giảm số vòng sẽ làm test không còn đo
// đúng hành vi production.
describe('hashPassword / verifyPassword', { timeout: 10000 }, () => {
  it('băm rồi so khớp đúng mật khẩu gốc', async () => {
    const hash = await hashPassword('MatKhau123')
    expect(hash).not.toBe('MatKhau123')
    expect(await verifyPassword('MatKhau123', hash)).toBe(true)
  })

  it('so khớp SAI mật khẩu → false (không throw)', async () => {
    const hash = await hashPassword('MatKhau123')
    expect(await verifyPassword('SaiRoi', hash)).toBe(false)
  })
})

describe('validateSessionToken', () => {
  beforeEach(() => vi.restoreAllMocks())

  it('token hợp lệ, chưa hết hạn → trả userId', async () => {
    mockedGetPool.mockReturnValue(
      mockPool(async () => ({
        rows: [{ user_id: 'user-1', expires: new Date(Date.now() + 60_000) }],
      })),
    )
    const result = await validateSessionToken('token-hop-le')
    expect(result).toEqual({ userId: 'user-1' })
  })

  it('token KHÔNG tồn tại trong DB → null', async () => {
    mockedGetPool.mockReturnValue(mockPool(async () => ({ rows: [] })))
    const result = await validateSessionToken('token-la')
    expect(result).toBeNull()
  })

  it('token ĐÃ HẾT HẠN (ca biên: expires trong quá khứ) → null, không trả userId', async () => {
    mockedGetPool.mockReturnValue(
      mockPool(async (sql) => {
        if (sql.startsWith('select'))
          return { rows: [{ user_id: 'user-2', expires: new Date(Date.now() - 1000) }] }
        return { rows: [] } // câu delete dọn session hết hạn
      }),
    )
    const result = await validateSessionToken('token-het-han')
    expect(result).toBeNull()
  })
})

describe('createSession', () => {
  beforeEach(() => vi.restoreAllMocks())

  it('tạo token ngẫu nhiên, KHÔNG lưu token trần vào DB (chỉ lưu bản hash)', async () => {
    let savedToken = ''
    mockedGetPool.mockReturnValue(
      mockPool(async (sql, params) => {
        expect(sql).toContain('insert into public.sessions')
        savedToken = String(params?.[0])
        return { rows: [] }
      }),
    )
    const rawToken = await createSession('user-1')
    expect(rawToken).toBeTruthy()
    // Token trả về cho client phải khác hẳn bản đã lưu (đã băm) trong DB.
    expect(savedToken).not.toBe(rawToken)
  })

  it('gọi 2 lần → 2 token ngẫu nhiên khác nhau', async () => {
    mockedGetPool.mockReturnValue(mockPool(async () => ({ rows: [] })))
    const [tokenA, tokenB] = await Promise.all([createSession('user-1'), createSession('user-1')])
    expect(tokenA).not.toBe(tokenB)
  })
})

describe('revokeSession', () => {
  beforeEach(() => vi.restoreAllMocks())

  it('xoá đúng dòng session khớp với hash của token truyền vào', async () => {
    const deleteCalls: unknown[][] = []
    mockedGetPool.mockReturnValue(
      mockPool(async (sql, params) => {
        expect(sql).toContain('delete from public.sessions')
        deleteCalls.push(params ?? [])
        return { rows: [] }
      }),
    )
    await revokeSession('token-can-thu-hoi')
    expect(deleteCalls).toHaveLength(1)
    // Tham số xoá phải là bản hash, không phải token trần.
    expect(deleteCalls[0]?.[0]).not.toBe('token-can-thu-hoi')
  })
})

// Cùng lý do nới timeout ghi ở describe 'hashPassword / verifyPassword' — createUserWithPassword
// tự gọi hashPassword() bên trong (bcrypt 12 vòng THẬT).
describe('createUserWithPassword', { timeout: 10000 }, () => {
  beforeEach(() => vi.restoreAllMocks())

  it('email TRÙNG (unique_violation code 23505) → trả null, không throw', async () => {
    mockedGetPool.mockReturnValue(
      mockPool(async () => {
        const err = new Error('duplicate key') as Error & { code: string }
        err.code = '23505'
        throw err
      }),
    )
    const result = await createUserWithPassword('trung@example.com', 'MatKhau123')
    expect(result).toBeNull()
  })

  it('lỗi DB khác (không phải trùng email) → ném lại lỗi, không nuốt im lặng', async () => {
    mockedGetPool.mockReturnValue(
      mockPool(async () => {
        throw new Error('connection refused')
      }),
    )
    await expect(createUserWithPassword('a@example.com', 'MatKhau123')).rejects.toThrow(
      'connection refused',
    )
  })
})

// Cùng lý do nới timeout ghi ở describe 'hashPassword / verifyPassword' — hai ca "đúng mật
// khẩu"/"sai mật khẩu" ở đây tự gọi hashPassword() để dựng dữ liệu (bcrypt 12 vòng THẬT).
describe('verifyUserPassword', { timeout: 10000 }, () => {
  beforeEach(() => vi.restoreAllMocks())

  it('email KHÔNG tồn tại → null (không phân biệt với sai mật khẩu)', async () => {
    mockedGetPool.mockReturnValue(mockPool(async () => ({ rows: [] })))
    expect(await verifyUserPassword('khong-co@example.com', 'x')).toBeNull()
  })

  it('user chỉ đăng nhập OAuth, chưa từng đặt mật khẩu (password_hash null) → null', async () => {
    mockedGetPool.mockReturnValue(
      mockPool(async () => ({
        rows: [{ id: 'u1', email: 'a@b.com', password_hash: null }],
      })),
    )
    expect(await verifyUserPassword('a@b.com', 'batkyxi')).toBeNull()
  })

  it('đúng mật khẩu → trả user, KHÔNG kèm password_hash trong kết quả', async () => {
    const hash = await hashPassword('MatKhau123')
    mockedGetPool.mockReturnValue(
      mockPool(async () => ({ rows: [{ id: 'u1', email: 'a@b.com', password_hash: hash }] })),
    )
    const result = await verifyUserPassword('a@b.com', 'MatKhau123')
    expect(result).toEqual({ id: 'u1', email: 'a@b.com' })
  })

  it('sai mật khẩu → null', async () => {
    const hash = await hashPassword('MatKhau123')
    mockedGetPool.mockReturnValue(
      mockPool(async () => ({ rows: [{ id: 'u1', email: 'a@b.com', password_hash: hash }] })),
    )
    expect(await verifyUserPassword('a@b.com', 'SaiRoi')).toBeNull()
  })
})

describe('getUserById', () => {
  beforeEach(() => vi.restoreAllMocks())

  it('user tồn tại → trả id/email', async () => {
    mockedGetPool.mockReturnValue(
      mockPool(async () => ({ rows: [{ id: 'u1', email: 'a@b.com' }] })),
    )
    expect(await getUserById('u1')).toEqual({ id: 'u1', email: 'a@b.com' })
  })

  it('user không tồn tại → null', async () => {
    mockedGetPool.mockReturnValue(mockPool(async () => ({ rows: [] })))
    expect(await getUserById('khong-co')).toBeNull()
  })
})

describe('ensureProfileRow', () => {
  beforeEach(() => vi.restoreAllMocks())

  it('user CŨ (profile đã tồn tại, insert 0 dòng) → KHÔNG chạy nhánh cấp VIP whitelist', async () => {
    const calls: string[] = []
    mockedGetPool.mockReturnValue(
      mockPool(async (sql) => {
        calls.push(sql)
        if (sql.startsWith('insert into public.profiles')) return { rows: [] } // 0 dòng = user cũ
        return { rows: [{ plan: 'free', plan_expires_at: null, onboarded: true, name: 'Cũ' }] }
      }),
    )
    const result = await ensureProfileRow('u1', 'Tên mới')
    expect(result.plan).toBe('free')
    expect(result.onboarded).toBe(true)
    // Không có câu update nào gán plan = 'vip' — nhánh VIP whitelist không chạy cho user cũ.
    expect(calls.some((sql) => sql.includes("plan = 'vip'"))).toBe(false)
  })

  it('user MỚI (profile vừa tạo lần đầu) → CÓ chạy nhánh kiểm VIP whitelist', async () => {
    const calls: string[] = []
    mockedGetPool.mockReturnValue(
      mockPool(async (sql) => {
        calls.push(sql)
        if (sql.startsWith('insert into public.profiles'))
          return { rows: [{ id: 'u1' }], rowCount: 1 } // 1 dòng = mới tạo
        if (sql.includes("plan = 'vip'")) return { rows: [] }
        return { rows: [{ plan: 'free', plan_expires_at: null, onboarded: false, name: 'Mới' }] }
      }),
    )
    const result = await ensureProfileRow('u1', 'Tên mới')
    expect(result.onboarded).toBe(false)
    expect(calls.some((sql) => sql.includes("plan = 'vip'"))).toBe(true)
  })

  it('gói Free nhưng DB còn sót plan_expires_at cũ → planExpiresAt trả null (tránh hiểu nhầm sắp hết hạn)', async () => {
    mockedGetPool.mockReturnValue(
      mockPool(async (sql) => {
        if (sql.startsWith('insert into public.profiles')) return { rows: [] }
        return {
          rows: [
            { plan: 'free', plan_expires_at: new Date('2020-01-01'), onboarded: true, name: 'X' },
          ],
        }
      }),
    )
    const result = await ensureProfileRow('u1', 'X')
    expect(result.plan).toBe('free')
    expect(result.planExpiresAt).toBeNull()
  })

  it('gói Pro còn hạn → planExpiresAt trả đúng ISO string', async () => {
    const future = new Date(Date.now() + 86_400_000)
    mockedGetPool.mockReturnValue(
      mockPool(async (sql) => {
        if (sql.startsWith('insert into public.profiles')) return { rows: [] }
        return { rows: [{ plan: 'pro', plan_expires_at: future, onboarded: true, name: 'X' }] }
      }),
    )
    const result = await ensureProfileRow('u1', 'X')
    expect(result.planExpiresAt).toBe(future.toISOString())
  })
})

// ── OAuth: Google (ID token qua google-auth-library) ─────────────────────────────────
describe('verifyGoogleIdToken', () => {
  const OLD = process.env.GOOGLE_CLIENT_ID
  beforeEach(() => {
    process.env.GOOGLE_CLIENT_ID = 'gclient'
    googleAuth.verifyIdToken.mockReset()
    // Các describe trước gọi vi.restoreAllMocks() (dọn spy khác) — nó cũng xoá luôn
    // implementation đã gán cho OAuth2Client mock, nên phải gán lại ở đây mỗi lần.
    vi.mocked(OAuth2Client).mockImplementation(function () {
      return { verifyIdToken: googleAuth.verifyIdToken } as unknown as OAuth2Client
    })
  })
  afterEach(() => {
    if (OLD === undefined) delete process.env.GOOGLE_CLIENT_ID
    else process.env.GOOGLE_CLIENT_ID = OLD
  })

  // Chạy TRƯỚC các test đăng nhập thành công — getGoogleClient() cache client Google ở cấp
  // module SAU LẦN GỌI THÀNH CÔNG ĐẦU TIÊN, nếu chạy sau sẽ dùng lại cache thay vì thật sự
  // kiểm tra nhánh thiếu biến môi trường.
  it('thiếu GOOGLE_CLIENT_ID → ném lỗi cấu hình (bọc trong try nên trả null)', async () => {
    delete process.env.GOOGLE_CLIENT_ID
    expect(await verifyGoogleIdToken('tok')).toBeNull()
  })

  it('token hợp lệ, email đã xác thực → trả thông tin user', async () => {
    googleAuth.verifyIdToken.mockResolvedValue({
      getPayload: () => ({ sub: 'g1', email: 'a@b.com', email_verified: true, name: 'A' }),
    })
    const result = await verifyGoogleIdToken('tok')
    expect(result).toEqual({ googleId: 'g1', email: 'a@b.com', name: 'A' })
  })

  it('email CHƯA xác thực (email_verified=false) → null', async () => {
    googleAuth.verifyIdToken.mockResolvedValue({
      getPayload: () => ({ sub: 'g1', email: 'a@b.com', email_verified: false }),
    })
    expect(await verifyGoogleIdToken('tok')).toBeNull()
  })

  it('token giả mạo (verifyIdToken ném lỗi) → null, không crash', async () => {
    googleAuth.verifyIdToken.mockRejectedValue(new Error('invalid signature'))
    expect(await verifyGoogleIdToken('tok-gia')).toBeNull()
  })
})

// ── OAuth: Google (access token qua tokeninfo + userinfo endpoint) ───────────────────
describe('verifyGoogleAccessToken', () => {
  const OLD = process.env.GOOGLE_CLIENT_ID
  beforeEach(() => {
    process.env.GOOGLE_CLIENT_ID = 'gclient'
    vi.stubGlobal('fetch', vi.fn())
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    if (OLD === undefined) delete process.env.GOOGLE_CLIENT_ID
    else process.env.GOOGLE_CLIENT_ID = OLD
  })

  it('audience đúng + userinfo hợp lệ → trả thông tin user', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ aud: 'gclient' }) } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ sub: 'g2', email: 'b@c.com', email_verified: true, name: 'B' }),
      } as Response)
    const result = await verifyGoogleAccessToken('atok')
    expect(result).toEqual({ googleId: 'g2', email: 'b@c.com', name: 'B' })
  })

  it('audience SAI (token cấp cho app khác) → null', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ aud: 'app-khac' }),
    } as Response)
    expect(await verifyGoogleAccessToken('atok')).toBeNull()
  })

  it('tokeninfo trả lỗi HTTP → null', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({ ok: false } as Response)
    expect(await verifyGoogleAccessToken('atok')).toBeNull()
  })
})

// ── OAuth: Facebook (debug_token + /me qua Graph API) ─────────────────────────────────
describe('verifyFacebookAccessToken', () => {
  const OLD_ID = process.env.FACEBOOK_APP_ID
  const OLD_SECRET = process.env.FACEBOOK_APP_SECRET
  beforeEach(() => {
    process.env.FACEBOOK_APP_ID = 'fbapp'
    process.env.FACEBOOK_APP_SECRET = 'fbsecret'
    vi.stubGlobal('fetch', vi.fn())
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    if (OLD_ID === undefined) delete process.env.FACEBOOK_APP_ID
    else process.env.FACEBOOK_APP_ID = OLD_ID
    if (OLD_SECRET === undefined) delete process.env.FACEBOOK_APP_SECRET
    else process.env.FACEBOOK_APP_SECRET = OLD_SECRET
  })

  it('token hợp lệ, đúng app_id, có email → trả thông tin user', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        json: async () => ({ data: { is_valid: true, app_id: 'fbapp' } }),
      } as Response)
      .mockResolvedValueOnce({
        json: async () => ({ id: 'fb1', email: 'x@y.com', name: 'X' }),
      } as Response)
    const result = await verifyFacebookAccessToken('atok')
    expect(result).toEqual({ facebookId: 'fb1', email: 'x@y.com', name: 'X' })
  })

  it('debug_token báo is_valid=false → null', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      json: async () => ({ data: { is_valid: false, app_id: 'fbapp' } }),
    } as Response)
    expect(await verifyFacebookAccessToken('atok')).toBeNull()
  })

  it('app_id KHÔNG khớp (token của app Facebook khác) → null', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      json: async () => ({ data: { is_valid: true, app_id: 'app-khac' } }),
    } as Response)
    expect(await verifyFacebookAccessToken('atok')).toBeNull()
  })

  it('user không cấp quyền email → null (users.email NOT NULL)', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        json: async () => ({ data: { is_valid: true, app_id: 'fbapp' } }),
      } as Response)
      .mockResolvedValueOnce({ json: async () => ({ id: 'fb1' }) } as Response)
    expect(await verifyFacebookAccessToken('atok')).toBeNull()
  })

  it('thiếu FACEBOOK_APP_ID/SECRET → null, không throw ra ngoài', async () => {
    delete process.env.FACEBOOK_APP_ID
    expect(await verifyFacebookAccessToken('atok')).toBeNull()
  })
})

// ── OAuth: Apple (id_token JWT verify qua JWKS) ────────────────────────────────────────
describe('verifyAppleIdToken', () => {
  const OLD = process.env.APPLE_CLIENT_ID
  beforeEach(() => {
    process.env.APPLE_CLIENT_ID = 'apple-client'
    jose.jwtVerify.mockReset()
  })
  afterEach(() => {
    if (OLD === undefined) delete process.env.APPLE_CLIENT_ID
    else process.env.APPLE_CLIENT_ID = OLD
  })

  it('JWT hợp lệ, có email, có tên từ client (lần đầu) → trả thông tin user', async () => {
    jose.jwtVerify.mockResolvedValue({ payload: { sub: 'ap1', email: 'a@icloud.com' } })
    const result = await verifyAppleIdToken('idtok', 'Táo Tây')
    expect(result).toEqual({ appleId: 'ap1', email: 'a@icloud.com', name: 'Táo Tây' })
  })

  it('không có tên từ client (lần sau) → dùng phần trước @ của email', async () => {
    jose.jwtVerify.mockResolvedValue({ payload: { sub: 'ap1', email: 'a@icloud.com' } })
    const result = await verifyAppleIdToken('idtok')
    expect(result?.name).toBe('a')
  })

  it('id_token thiếu email → null (không tạo được tài khoản)', async () => {
    jose.jwtVerify.mockResolvedValue({ payload: { sub: 'ap1' } })
    expect(await verifyAppleIdToken('idtok')).toBeNull()
  })

  it('chữ ký sai/hết hạn (jwtVerify ném lỗi) → null', async () => {
    jose.jwtVerify.mockRejectedValue(new Error('signature verification failed'))
    expect(await verifyAppleIdToken('idtok')).toBeNull()
  })
})

// ── OAuth: Microsoft (id_token JWT verify qua JWKS, issuer theo tenant động) ──────────
describe('verifyMicrosoftIdToken', () => {
  const OLD = process.env.MICROSOFT_CLIENT_ID
  beforeEach(() => {
    process.env.MICROSOFT_CLIENT_ID = 'ms-client'
    jose.jwtVerify.mockReset()
  })
  afterEach(() => {
    if (OLD === undefined) delete process.env.MICROSOFT_CLIENT_ID
    else process.env.MICROSOFT_CLIENT_ID = OLD
  })

  it('JWT hợp lệ, issuer đúng mẫu tenant, có email → trả thông tin user', async () => {
    jose.jwtVerify.mockResolvedValue({
      payload: {
        sub: 'ms1',
        iss: 'https://login.microsoftonline.com/tenant-abc/v2.0',
        email: 'm@corp.com',
        name: 'M',
      },
    })
    const result = await verifyMicrosoftIdToken('idtok')
    expect(result).toEqual({ microsoftId: 'ms1', email: 'm@corp.com', name: 'M' })
  })

  it('thiếu claim email → fallback dùng preferred_username', async () => {
    jose.jwtVerify.mockResolvedValue({
      payload: {
        sub: 'ms1',
        iss: 'https://login.microsoftonline.com/tenant-abc/v2.0',
        preferred_username: 'm@corp.com',
      },
    })
    const result = await verifyMicrosoftIdToken('idtok')
    expect(result?.email).toBe('m@corp.com')
    expect(result?.name).toBe('m') // không có claim 'name' → lấy phần trước @
  })

  it('issuer KHÔNG khớp mẫu tenant Microsoft → null', async () => {
    jose.jwtVerify.mockResolvedValue({
      payload: { sub: 'ms1', iss: 'https://evil.com/fake', email: 'm@corp.com' },
    })
    expect(await verifyMicrosoftIdToken('idtok')).toBeNull()
  })

  it('không có email lẫn preferred_username → null', async () => {
    jose.jwtVerify.mockResolvedValue({
      payload: { sub: 'ms1', iss: 'https://login.microsoftonline.com/tenant-abc/v2.0' },
    })
    expect(await verifyMicrosoftIdToken('idtok')).toBeNull()
  })
})

// ── findOrCreate*User (dùng chung findOrCreateOAuthUser, tra cứu qua bảng `identities` — 0034,
// Bước 6 đã bỏ 4 cột google_id/facebook_id/apple_id/microsoft_id cũ trên `users`) ──
describe('findOrCreate*User — không tự liên kết tài khoản qua email', () => {
  beforeEach(() => vi.restoreAllMocks())

  it('findOrCreateGoogleUser: đã có identity → trả user cũ, isNew=false', async () => {
    mockedGetPool.mockReturnValue(
      mockPool(async (sql) => {
        if (sql.includes('join public.identities'))
          return { rows: [{ id: 'u1', email: 'a@b.com' }] }
        return { rows: [] }
      }),
    )
    const result = await findOrCreateGoogleUser('g1', 'a@b.com')
    expect(result).toEqual({ user: { id: 'u1', email: 'a@b.com' }, isNew: false })
  })

  it.each([
    ['Google', findOrCreateGoogleUser],
    ['Facebook', findOrCreateFacebookUser],
    ['Apple', findOrCreateAppleUser],
    ['Microsoft', findOrCreateMicrosoftUser],
  ])('%s: identity mới không chiếm tài khoản đã có cùng email', async (_provider, findUser) => {
    const calls: string[] = []
    mockedGetPool.mockReturnValue(
      mockPool(async (sql) => {
        calls.push(sql)
        if (sql.includes('join public.identities')) return { rows: [] }
        if (sql.startsWith('select id, email from public.users where email'))
          return { rows: [{ id: 'u2', email: 'old@b.com' }] }
        return { rows: [] }
      }),
    )
    await expect(findUser('new-sub', 'old@b.com')).rejects.toBeInstanceOf(
      OAuthAccountLinkRequiredError,
    )
    expect(calls.some((sql) => sql.startsWith('insert'))).toBe(false)
  })

  it('findOrCreateAppleUser: email HOÀN TOÀN mới → tạo user mới + ghi identities, isNew=true', async () => {
    const calls: string[] = []
    mockedGetPool.mockReturnValue(
      mockPool(async (sql) => {
        calls.push(sql)
        if (sql.startsWith('select')) return { rows: [] }
        if (sql.startsWith('insert into public.users'))
          return { rows: [{ id: 'u3', email: 'moi@b.com' }] }
        return { rows: [] }
      }),
    )
    const result = await findOrCreateAppleUser('ap1', 'moi@b.com')
    expect(result).toEqual({ user: { id: 'u3', email: 'moi@b.com' }, isNew: true })
    expect(calls.some((sql) => sql.startsWith('insert into public.identities'))).toBe(true)
  })

  it.each([
    ['Google', findOrCreateGoogleUser],
    ['Facebook', findOrCreateFacebookUser],
    ['Apple', findOrCreateAppleUser],
    ['Microsoft', findOrCreateMicrosoftUser],
  ])(
    '%s: identity đã liên kết vẫn đăng nhập được khi email claim thay đổi',
    async (_provider, findUser) => {
      const pool = mockPool(async () => ({ rows: [{ id: 'existing', email: 'old@example.com' }] }))
      mockedGetPool.mockReturnValue(pool)
      expect(await findUser('linked-sub', 'new@example.com')).toEqual({
        user: { id: 'existing', email: 'old@example.com' },
        isNew: false,
      })
      expect(pool.query).toHaveBeenCalledTimes(1)
    },
  )

  it('tạo identity lỗi → rollback user mới và không phát tài khoản mồ côi', async () => {
    const calls: string[] = []
    const failure = new Error('identity write failed')
    mockedGetPool.mockReturnValue(
      mockPool(async (sql) => {
        calls.push(sql)
        if (sql.startsWith('insert into public.users'))
          return { rows: [{ id: 'new', email: 'new@example.com' }] }
        if (sql.startsWith('insert into public.identities')) throw failure
        return { rows: [] }
      }),
    )
    await expect(findOrCreateGoogleUser('sub', 'new@example.com')).rejects.toBe(failure)
    expect(calls).toContain('begin')
    expect(calls).toContain('rollback')
    expect(calls).not.toContain('commit')
  })

  it.each([false, true])(
    'đua unique email: chỉ phục hồi khi identity chính xác tồn tại (%s)',
    async (identityExists) => {
      let conflict = false
      mockedGetPool.mockReturnValue(
        mockPool(async (sql) => {
          if (sql.startsWith('insert into public.users')) {
            conflict = true
            throw Object.assign(new Error('duplicate'), { code: '23505' })
          }
          if (sql.includes('join public.identities') && conflict && identityExists)
            return { rows: [{ id: 'winner', email: 'same@example.com' }] }
          return { rows: [] }
        }),
      )
      const result = findOrCreateGoogleUser('sub', 'same@example.com')
      if (identityExists)
        expect(await result).toEqual({
          user: { id: 'winner', email: 'same@example.com' },
          isNew: false,
        })
      else await expect(result).rejects.toBeInstanceOf(OAuthAccountLinkRequiredError)
    },
  )

  it('Microsoft chưa có identity → từ chối tạo/liên kết bằng email mutable', async () => {
    mockedGetPool.mockReturnValue(
      mockPool(async (sql) => {
        if (sql.startsWith('select')) return { rows: [] }
        return { rows: [] } // insert thất bại âm thầm — ca biên hiếm
      }),
    )
    await expect(findOrCreateMicrosoftUser('ms1', 'x@b.com')).rejects.toThrow(
      'Hãy đăng nhập bằng email đã xác minh',
    )
  })
})

// ═══════════════════════════════════════════════════════════════════════════════════════
// Đợt 2 coverage 2026-09-05: nhánh chưa phủ (branch 78,5% → siết lên ≥93%). Các describe
// dưới đây KHÔNG lặp lại ca đã có ở trên — chỉ nhắm đúng nhánh/hàm còn thiếu ghi trong
// uncovered-all.md (đường rẽ if/??/||/ternary chưa từng đi qua vế đó, và hàm hashSessionToken
// chưa từng được gọi).
// ═══════════════════════════════════════════════════════════════════════════════════════

describe('hashSessionToken (Đợt 2 coverage 2026-09-05)', () => {
  it('băm đúng SHA-256 hex — khớp cách bảng public.sessions lưu session_token', () => {
    const raw = 'raw-token-vi-du'
    expect(hashSessionToken(raw)).toBe(createHash('sha256').update(raw).digest('hex'))
  })

  it('hai token gốc khác nhau → hai hash khác nhau', () => {
    expect(hashSessionToken('token-a')).not.toBe(hashSessionToken('token-b'))
  })
})

// Cùng lý do nới timeout ghi ở describe 'hashPassword / verifyPassword' — createUserWithPassword
// tự gọi hashPassword() bên trong (bcrypt 12 vòng THẬT).
describe(
  'createUserWithPassword — nhánh thành công (Đợt 2 coverage 2026-09-05)',
  { timeout: 10000 },
  () => {
    beforeEach(() => vi.restoreAllMocks())

    it('email CHƯA tồn tại → insert thành công, trả đúng user vừa tạo', async () => {
      mockedGetPool.mockReturnValue(
        mockPool(async () => ({ rows: [{ id: 'u9', email: 'moi@example.com' }] })),
      )
      const result = await createUserWithPassword('moi@example.com', 'MatKhau123')
      expect(result).toEqual({ id: 'u9', email: 'moi@example.com' })
    })

    it('insert không lỗi nhưng không trả dòng nào (phòng thủ, hiếm vì insert không có ON CONFLICT) → null', async () => {
      mockedGetPool.mockReturnValue(mockPool(async () => ({ rows: [] })))
      const result = await createUserWithPassword('la@example.com', 'MatKhau123')
      expect(result).toBeNull()
    })
  },
)

describe('verifyGoogleIdToken — nhánh còn thiếu (Đợt 2 coverage 2026-09-05)', () => {
  const OLD = process.env.GOOGLE_CLIENT_ID
  beforeEach(() => {
    process.env.GOOGLE_CLIENT_ID = 'gclient'
    googleAuth.verifyIdToken.mockReset()
    vi.mocked(OAuth2Client).mockImplementation(function () {
      return { verifyIdToken: googleAuth.verifyIdToken } as unknown as OAuth2Client
    })
  })
  afterEach(() => {
    if (OLD === undefined) delete process.env.GOOGLE_CLIENT_ID
    else process.env.GOOGLE_CLIENT_ID = OLD
  })

  it('payload thiếu sub → null (không tạo được tài khoản không có sub)', async () => {
    googleAuth.verifyIdToken.mockResolvedValue({
      getPayload: () => ({ email: 'a@b.com', email_verified: true }),
    })
    expect(await verifyGoogleIdToken('tok')).toBeNull()
  })

  it('payload không có tên → dùng phần trước @ của email', async () => {
    googleAuth.verifyIdToken.mockResolvedValue({
      getPayload: () => ({ sub: 'g1', email: 'a@b.com', email_verified: true }),
    })
    const result = await verifyGoogleIdToken('tok')
    expect(result?.name).toBe('a')
  })

  it('verifyIdToken ném lỗi KHÔNG PHẢI Error (vd chuỗi) → vẫn trả null, không crash', async () => {
    googleAuth.verifyIdToken.mockRejectedValue('boom-khong-phai-error')
    expect(await verifyGoogleIdToken('tok')).toBeNull()
  })
})

describe('verifyGoogleAccessToken — nhánh còn thiếu (Đợt 2 coverage 2026-09-05)', () => {
  const OLD = process.env.GOOGLE_CLIENT_ID
  beforeEach(() => {
    process.env.GOOGLE_CLIENT_ID = 'gclient'
    vi.stubGlobal('fetch', vi.fn())
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    if (OLD === undefined) delete process.env.GOOGLE_CLIENT_ID
    else process.env.GOOGLE_CLIENT_ID = OLD
  })

  it('tokeninfo hợp lệ nhưng userinfo trả lỗi HTTP → null', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ aud: 'gclient' }) } as Response)
      .mockResolvedValueOnce({ ok: false } as Response)
    expect(await verifyGoogleAccessToken('atok')).toBeNull()
  })

  it('userinfo thiếu sub/email → null', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ aud: 'gclient' }) } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ email: 'a@b.com' }) } as Response)
    expect(await verifyGoogleAccessToken('atok')).toBeNull()
  })

  it('email CHƯA xác thực (email_verified=false) → null', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ aud: 'gclient' }) } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ sub: 'g3', email: 'a@b.com', email_verified: false }),
      } as Response)
    expect(await verifyGoogleAccessToken('atok')).toBeNull()
  })

  it('userinfo không có tên → dùng phần trước @ của email', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ aud: 'gclient' }) } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ sub: 'g4', email: 'c@d.com', email_verified: true }),
      } as Response)
    const result = await verifyGoogleAccessToken('atok')
    expect(result?.name).toBe('c')
  })

  it('fetch ném lỗi mạng (Error thật) → null, không crash', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('network down'))
    expect(await verifyGoogleAccessToken('atok')).toBeNull()
  })

  it('fetch ném lỗi KHÔNG PHẢI Error → vẫn trả null', async () => {
    vi.mocked(fetch).mockRejectedValueOnce('boom')
    expect(await verifyGoogleAccessToken('atok')).toBeNull()
  })
})

describe('verifyFacebookAccessToken — nhánh còn thiếu (Đợt 2 coverage 2026-09-05)', () => {
  const OLD_ID = process.env.FACEBOOK_APP_ID
  const OLD_SECRET = process.env.FACEBOOK_APP_SECRET
  beforeEach(() => {
    process.env.FACEBOOK_APP_ID = 'fbapp'
    process.env.FACEBOOK_APP_SECRET = 'fbsecret'
    vi.stubGlobal('fetch', vi.fn())
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    if (OLD_ID === undefined) delete process.env.FACEBOOK_APP_ID
    else process.env.FACEBOOK_APP_ID = OLD_ID
    if (OLD_SECRET === undefined) delete process.env.FACEBOOK_APP_SECRET
    else process.env.FACEBOOK_APP_SECRET = OLD_SECRET
  })

  it('me.name thiếu → dùng phần trước @ của email', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        json: async () => ({ data: { is_valid: true, app_id: 'fbapp' } }),
      } as Response)
      .mockResolvedValueOnce({ json: async () => ({ id: 'fb2', email: 'z@y.com' }) } as Response)
    const result = await verifyFacebookAccessToken('atok')
    expect(result?.name).toBe('z')
  })

  it('fetch ném lỗi KHÔNG PHẢI Error → null, không crash', async () => {
    vi.mocked(fetch).mockRejectedValueOnce('boom')
    expect(await verifyFacebookAccessToken('atok')).toBeNull()
  })
})

describe('verifyAppleIdToken — nhánh còn thiếu (Đợt 2 coverage 2026-09-05)', () => {
  const OLD = process.env.APPLE_CLIENT_ID
  beforeEach(() => {
    process.env.APPLE_CLIENT_ID = 'apple-client'
    jose.jwtVerify.mockReset()
  })
  afterEach(() => {
    if (OLD === undefined) delete process.env.APPLE_CLIENT_ID
    else process.env.APPLE_CLIENT_ID = OLD
  })

  it('thiếu APPLE_CLIENT_ID → null (bọc trong try nên không throw ra ngoài)', async () => {
    delete process.env.APPLE_CLIENT_ID
    expect(await verifyAppleIdToken('idtok')).toBeNull()
  })

  it('payload.sub không phải string → null', async () => {
    jose.jwtVerify.mockResolvedValue({ payload: { sub: 123, email: 'a@icloud.com' } })
    expect(await verifyAppleIdToken('idtok')).toBeNull()
  })

  it('nameFromClient chỉ có khoảng trắng (trim rỗng) → dùng phần trước @ của email', async () => {
    jose.jwtVerify.mockResolvedValue({ payload: { sub: 'ap2', email: 'b@icloud.com' } })
    const result = await verifyAppleIdToken('idtok', '   ')
    expect(result?.name).toBe('b')
  })

  it('email không có phần trước @ (ca hiếm) → name dùng nguyên chuỗi email', async () => {
    jose.jwtVerify.mockResolvedValue({ payload: { sub: 'ap3', email: '@privaterelay.com' } })
    const result = await verifyAppleIdToken('idtok')
    expect(result?.name).toBe('@privaterelay.com')
  })

  it('jwtVerify ném lỗi KHÔNG PHẢI Error → null', async () => {
    jose.jwtVerify.mockRejectedValue('boom')
    expect(await verifyAppleIdToken('idtok')).toBeNull()
  })
})

describe('verifyMicrosoftIdToken — nhánh còn thiếu (Đợt 2 coverage 2026-09-05)', () => {
  const OLD = process.env.MICROSOFT_CLIENT_ID
  beforeEach(() => {
    process.env.MICROSOFT_CLIENT_ID = 'ms-client'
    jose.jwtVerify.mockReset()
  })
  afterEach(() => {
    if (OLD === undefined) delete process.env.MICROSOFT_CLIENT_ID
    else process.env.MICROSOFT_CLIENT_ID = OLD
  })

  it('thiếu MICROSOFT_CLIENT_ID → null (bọc trong try nên không throw ra ngoài)', async () => {
    delete process.env.MICROSOFT_CLIENT_ID
    expect(await verifyMicrosoftIdToken('idtok')).toBeNull()
  })

  it('payload.sub không phải string → null', async () => {
    jose.jwtVerify.mockResolvedValue({
      payload: {
        sub: 123,
        iss: 'https://login.microsoftonline.com/tenant-abc/v2.0',
        email: 'm@corp.com',
      },
    })
    expect(await verifyMicrosoftIdToken('idtok')).toBeNull()
  })

  it('preferred_username không có phần trước @ (ca hiếm) → name dùng nguyên chuỗi', async () => {
    jose.jwtVerify.mockResolvedValue({
      payload: {
        sub: 'ms2',
        iss: 'https://login.microsoftonline.com/tenant-abc/v2.0',
        preferred_username: '@corp.com',
      },
    })
    const result = await verifyMicrosoftIdToken('idtok')
    expect(result?.name).toBe('@corp.com')
  })

  it('jwtVerify ném lỗi Error thật → null', async () => {
    jose.jwtVerify.mockRejectedValue(new Error('jwks fetch failed'))
    expect(await verifyMicrosoftIdToken('idtok')).toBeNull()
  })

  it('jwtVerify ném lỗi KHÔNG PHẢI Error → vẫn trả null', async () => {
    jose.jwtVerify.mockRejectedValue('boom')
    expect(await verifyMicrosoftIdToken('idtok')).toBeNull()
  })
})

describe('ensureProfileRow — nhánh còn thiếu (Đợt 2 coverage 2026-09-05)', () => {
  beforeEach(() => vi.restoreAllMocks())

  it('profile chưa có tên (row.name null trong DB) → dùng tên truyền vào làm mặc định', async () => {
    mockedGetPool.mockReturnValue(
      mockPool(async (sql) => {
        if (sql.startsWith('insert into public.profiles')) return { rows: [] }
        return { rows: [{ plan: 'free', plan_expires_at: null, onboarded: true, name: null }] }
      }),
    )
    const result = await ensureProfileRow('u1', 'Tên Mặc Định')
    expect(result.name).toBe('Tên Mặc Định')
  })
})

describe('Microsoft — không dùng email/UPN làm bằng chứng sở hữu tài khoản', () => {
  it('email trùng tài khoản nạn nhân không dẫn tới liên kết identity', async () => {
    const query = vi.fn(async (sql: string) => ({
      rows: sql.includes('join public.identities')
        ? []
        : [{ id: 'victim', email: 'victim@example.com' }],
    }))
    mockedGetPool.mockReturnValue({ query } as unknown as ReturnType<typeof getPgPool>)
    await expect(findOrCreateMicrosoftUser('attacker-sub', 'victim@example.com')).rejects.toThrow(
      'Hãy đăng nhập bằng email đã xác minh',
    )
    expect(query).toHaveBeenCalledTimes(1)
  })

  it('identity đã liên kết đăng nhập được dù email claim đã đổi', async () => {
    const query = vi.fn(async () => ({ rows: [{ id: 'owner', email: 'owner@example.com' }] }))
    mockedGetPool.mockReturnValue({ query } as unknown as ReturnType<typeof getPgPool>)
    expect(await findOrCreateMicrosoftUser('linked-sub', 'changed@example.com')).toEqual({
      user: { id: 'owner', email: 'owner@example.com' },
      isNew: false,
    })
    expect(query).toHaveBeenCalledTimes(1)
  })
})
