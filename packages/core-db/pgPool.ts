// api/_lib/pgPool.ts — Pool kết nối PostgreSQL tự host (Giai đoạn B trở đi).
// Dùng chung cho mọi truy vấn phía server tới Postgres mới (KHÁC getSupabaseAdmin() —
// file đó vẫn còn dùng cho các bảng nghiệp vụ CHƯA di trú, xem docs/migration-thoat-ly-supabase.md).

import { Pool, type PoolConfig } from 'pg'

// Mặc định 5 kết nối MỖI TIẾN TRÌNH (hạ từ 10 ngày 2026-08-26).
// Con số này NHÂN với số tiến trình, đó là chỗ dễ tính nhầm: PM2 chạy cluster `instances:'max'`
// trên VPS 3 core ⇒ default cũ 10 thành 30 kết nối Postgres thật, cho một máy đo được CPU 0,5%
// và mỗi instance ~220 MB. Mỗi backend Postgres tốn vài MB RAM trên máy chỉ có 2,9 GB, nên đó
// là bộ nhớ trả cho thứ không dùng tới. 3 × 5 = 15 vẫn thừa cho tải hiện tại.
// Tách Postgres ra VPS riêng + PgBouncer (GĐ2) thì set PG_POOL_MAX trong .env cho khớp
// `default_pool_size` — xem postgres/pgbouncer.ini.example.
const POOL_MAX_MAC_DINH = 5

// Ba mức chờ tối đa (audit 2026-10-10, E1.2). Trước đó pool KHÔNG có timeout nào: pool chỉ 5
// kết nối/tiến trình, nên một câu SQL treo (khoá dòng, CSDL quá tải) hoặc một transaction quên
// commit giữ kết nối mãi mãi → mọi request sau xếp hàng chờ vô hạn, server "sống" mà không trả lời.
// Ngưỡng chọn RỘNG (request web thật chạy dưới 1s) để không cắt nhầm job nền dọn dữ liệu hằng ngày.
// Chỉnh qua .env; đặt 0 = tắt hẳn (vd script nạp dữ liệu lớn `seed:all`). Migration dùng `Client`
// riêng (scripts/run-pg-migrations.ts) nên KHÔNG chịu các ngưỡng này.
const KET_NOI_TIMEOUT_MS_MAC_DINH = 10_000 // chờ mở kết nối mới / chờ kết nối rảnh trong pool
const CAU_LENH_TIMEOUT_MS_MAC_DINH = 60_000 // Postgres tự huỷ câu lệnh chạy quá lâu
const GIAO_DICH_RANH_TIMEOUT_MS_MAC_DINH = 60_000 // Postgres cắt phiên ngồi im giữa transaction

function msFromEnv(env: NodeJS.ProcessEnv, name: string, fallback: number): number {
  const raw = env[name]
  if (raw === undefined || raw.trim() === '') return fallback
  const value = Number(raw)
  return Number.isInteger(value) && value >= 0 ? value : fallback
}

/** Cấu hình timeout của pool, đọc từ biến môi trường (tách riêng để test được). */
export function poolTimeoutsFromEnv(
  env: NodeJS.ProcessEnv,
): Pick<
  PoolConfig,
  'connectionTimeoutMillis' | 'statement_timeout' | 'idle_in_transaction_session_timeout'
> {
  return {
    connectionTimeoutMillis: msFromEnv(env, 'PG_CONNECT_TIMEOUT_MS', KET_NOI_TIMEOUT_MS_MAC_DINH),
    statement_timeout: msFromEnv(env, 'PG_STATEMENT_TIMEOUT_MS', CAU_LENH_TIMEOUT_MS_MAC_DINH),
    idle_in_transaction_session_timeout: msFromEnv(
      env,
      'PG_IDLE_IN_TRANSACTION_TIMEOUT_MS',
      GIAO_DICH_RANH_TIMEOUT_MS_MAC_DINH,
    ),
  }
}

function makePool(connectionString: string, maxEnvVar: string): Pool {
  const maxEnv = Number(process.env[maxEnvVar])
  const max = Number.isFinite(maxEnv) && maxEnv > 0 ? maxEnv : POOL_MAX_MAC_DINH
  const pool = new Pool({ connectionString, max, ...poolTimeoutsFromEnv(process.env) })
  pool.on('error', (err) => {
    // Lỗi kết nối idle (vd DB restart) — log, KHÔNG crash cả process.
    console.error(`[pgPool] Lỗi kết nối idle (${maxEnvVar}):`, err.message)
  })
  return pool
}

let cached: Pool | null = null

// Pool GHI (write) — mọi insert/update/delete PHẢI qua đây. Cũng là pool ĐỌC mặc định khi
// chưa cấu hình read-replica (DATABASE_URL_READ) — xem getPgReadPool() bên dưới.
export function getPgPool(): Pool {
  if (cached) return cached

  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error(
      'Server chưa cấu hình DATABASE_URL — xem docs/setup-postgresql-vps.md (Giai đoạn A).',
    )
  }

  // PG_POOL_MAX cấu hình được qua .env (mặc định 5 mỗi tiến trình — xem makePool ở trên).
  // Khi tách Postgres ra VPS riêng + PgBouncer (GĐ2 kế hoạch scale, xem
  // docs/research/dac-ta-gd2-scale-50k.md), tăng số này lên cho khớp default_pool_size của
  // PgBouncer — không cần sửa code + build lại mỗi lần đổi.
  cached = makePool(connectionString, 'PG_POOL_MAX')
  return cached
}

let cachedRead: Pool | null = null

// Pool ĐỌC riêng — trỏ vào Postgres READ-REPLICA qua biến môi trường DATABASE_URL_READ
// (chuẩn bị cho scale 100k-1M, xem docs/research/ke-hoach-scale-30k-concurrent.md). KHÔNG bắt
// buộc: nếu không set, tự động dùng CHUNG pool ghi (getPgPool()) — hành vi giống hệt trước khi
// có tính năng này, không phá gì khi chưa dựng replica.
//
// CHỈ dùng cho truy vấn ĐỌC THUẦN, không cần dữ liệu mới nhất tuyệt đối (replication có độ trễ
// vài chục ms tới vài giây tuỳ tải) — ví dụ tra từ điển, bảng xếp hạng, xem tiến độ học. KHÔNG
// dùng cho bất kỳ luồng nào ngay sau khi vừa ghi cùng request (đọc lại có thể chưa thấy dữ liệu
// mới ghi — "read-after-write" không đảm bảo qua replica).
export function getPgReadPool(): Pool {
  const connectionString = process.env.DATABASE_URL_READ
  if (!connectionString) return getPgPool()

  if (cachedRead) return cachedRead
  cachedRead = makePool(connectionString, 'PG_POOL_READ_MAX')
  return cachedRead
}
