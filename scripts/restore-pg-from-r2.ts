// scripts/restore-pg-from-r2.ts — Khôi phục Postgres THẬT từ backup trên Cloudflare R2, dùng
// khi VPS Postgres đã SẬP HẲN (mất luôn /var/backups local) hoặc cần dựng lại từ đầu trên máy
// mới. Đây là phần còn thiếu trong bộ 3 công cụ backup:
//   1. Cron pg_dump (docs/setup-postgresql-vps.md mục 7)         → TẠO backup
//   2. scripts/backup-pg-to-r2.ts (npm run backup:r2)            → ĐẨY backup lên R2
//   3. scripts/restore-pg-from-r2.ts (file này, npm run restore:r2) → LẤY VỀ + KHÔI PHỤC THẬT
//   (khác scripts/verify-pg-backup.sh — script đó chỉ test vào DB TẠM rồi xoá, không khôi phục
//   thật, và giả định file backup còn nằm local — không đúng khi cả VPS đã sập.)
//
// ⚠️ SCRIPT NÀY CÓ THỂ PHÁ HUỶ DỮ LIỆU nếu chạy nhầm target — mục --restore-into sẽ DROP +
// TẠO LẠI database đích trước khi restore. Đọc kỹ docs/ke-hoach-khoi-phuc-su-co.md trước khi
// chạy trên bất kỳ database nào đang có dữ liệu thật muốn giữ.
//
// Cách dùng:
//   npm run restore:r2 -- --list
//     Liệt kê các backup có trên R2 (mới nhất trước), không tải/đổi gì.
//
//   npm run restore:r2 -- --download [--key <tên-file>] [--out <đường-dẫn>]
//     CHỈ tải file về, KHÔNG đụng vào Postgres nào — an toàn tuyệt đối. Không truyền --key thì
//     tự lấy bản mới nhất. Không truyền --out thì lưu vào thư mục hiện tại.
//
//   npm run restore:r2 -- --restore-into <ten_database> [--key <tên-file>] --yes
//     Tải backup (nếu chưa có local) + DROP database đích (nếu đã tồn tại) + TẠO LẠI + khôi
//     phục. Thêm --from-file <đường-dẫn.sql.gz> để dùng file ĐÃ tải sẵn, bỏ qua R2 (không
//     tải lại bản dump lớn khi lần restore trước hỏng giữa chừng). BẮT BUỘC --yes (không có chế độ hỏi tương tác — kịch bản khẩn cấp thường chạy qua
//     script tự động/SSH, không có người ngồi gõ "yes" giữa lúc dịch vụ đang sập).
//
// Biến môi trường (xem .env.example):
//   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BACKUP_BUCKET — giống backup:r2
//   RESTORE_PSQL_URL — connection string tới Postgres SUPERUSER trên máy đích (KHÔNG phải
//     DATABASE_URL của app — cần quyền DROP/CREATE DATABASE, thường là postgres://postgres@...)

import * as dotenv from 'dotenv'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { execFileSync } from 'node:child_process'
import { S3Client, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3'
import type { Readable } from 'node:stream'
import { redactConnectionUrl } from './lib/restoreSafety.js'

dotenv.config()

const KEY_PREFIX = 'pg-backups/'

function fail(message: string): never {
  console.error(`[restore:r2] ❌ ${message}`)
  process.exit(1)
}

function getArg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`)
  return i !== -1 ? process.argv[i + 1] : undefined
}
function hasFlag(name: string): boolean {
  return process.argv.includes(`--${name}`)
}

function getClient(): S3Client {
  const accountId = process.env.R2_ACCOUNT_ID
  const accessKeyId = process.env.R2_ACCESS_KEY_ID
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY
  if (!accountId || !accessKeyId || !secretAccessKey) {
    fail('Thiếu R2_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY trong .env')
  }
  return new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
    requestChecksumCalculation: 'WHEN_REQUIRED',
  })
}

function getBucket(): string {
  const bucket = process.env.R2_BACKUP_BUCKET
  if (!bucket) fail('Thiếu R2_BACKUP_BUCKET trong .env — xem .env.example.')
  return bucket
}

interface RemoteBackup {
  key: string
  size: number
  lastModified: Date
}

// Danh sách backup trên R2, MỚI NHẤT TRƯỚC (dùng LastModified — đáng tin hơn tên file).
async function listBackups(client: S3Client, bucket: string): Promise<RemoteBackup[]> {
  const found: RemoteBackup[] = []
  let token: string | undefined
  do {
    const res = await client.send(
      new ListObjectsV2Command({ Bucket: bucket, Prefix: KEY_PREFIX, ContinuationToken: token }),
    )
    for (const obj of res.Contents ?? []) {
      if (obj.Key && obj.Size !== undefined && obj.LastModified) {
        found.push({ key: obj.Key, size: obj.Size, lastModified: obj.LastModified })
      }
    }
    token = res.IsTruncated ? res.NextContinuationToken : undefined
  } while (token)
  return found.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime())
}

async function downloadBackup(
  client: S3Client,
  bucket: string,
  key: string,
  outPath: string,
): Promise<void> {
  const res = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }))
  const body = res.Body as Readable | undefined
  if (!body) fail(`Không đọc được nội dung "${key}" từ R2 (Body rỗng).`)

  await new Promise<void>((resolve, reject) => {
    const out = fs.createWriteStream(outPath)
    body.pipe(out)
    body.on('error', reject)
    out.on('error', reject)
    out.on('finish', resolve)
  })
}

async function cmdList(): Promise<void> {
  const client = getClient()
  const bucket = getBucket()
  const backups = await listBackups(client, bucket)
  if (backups.length === 0) {
    console.log(`[restore:r2] Không có backup nào trong bucket "${bucket}".`)
    return
  }
  console.log(`[restore:r2] ${backups.length} backup trong "${bucket}" (mới nhất trước):`)
  for (const b of backups) {
    const name = b.key.slice(KEY_PREFIX.length)
    console.log(
      `  ${b.lastModified.toISOString()}  ${(b.size / 1e6).toFixed(1).padStart(8)} MB  ${name}`,
    )
  }
}

async function resolveKey(client: S3Client, bucket: string, requested?: string): Promise<string> {
  const backups = await listBackups(client, bucket)
  if (backups.length === 0) fail(`Bucket "${bucket}" không có backup nào.`)

  if (!requested) return backups[0]!.key // mới nhất

  const full = requested.startsWith(KEY_PREFIX) ? requested : `${KEY_PREFIX}${requested}`
  const found = backups.find((b) => b.key === full)
  if (!found) {
    fail(`Không thấy "${requested}" trên R2. Chạy "npm run restore:r2 -- --list" để xem tên đúng.`)
  }
  return full
}

async function cmdDownload(): Promise<void> {
  const client = getClient()
  const bucket = getBucket()
  const key = await resolveKey(client, bucket, getArg('key'))
  const fileName = key.slice(KEY_PREFIX.length)
  const outPath = getArg('out') || path.join(process.cwd(), fileName)

  console.log(`[restore:r2] Tải "${key}" → "${outPath}"...`)
  await downloadBackup(client, bucket, key, outPath)
  console.log(`[restore:r2] ✅ Đã tải xong: ${outPath}`)
}

async function cmdRestoreInto(targetDb: string): Promise<void> {
  if (!hasFlag('yes')) {
    fail(
      'Thiếu --yes. Lệnh này sẽ XOÁ VÀ TẠO LẠI database đích trước khi khôi phục — bắt buộc ' +
        'xác nhận rõ ràng bằng --yes. Đọc docs/ke-hoach-khoi-phuc-su-co.md trước khi chạy.',
    )
  }
  const psqlUrl = process.env.RESTORE_PSQL_URL
  if (!psqlUrl) {
    fail(
      'Thiếu RESTORE_PSQL_URL — connection string SUPERUSER (KHÔNG phải DATABASE_URL của app), ' +
        'cần quyền DROP/CREATE DATABASE. Xem .env.example.',
    )
  }

  // --from-file: dùng file .sql.gz CÓ SẴN, bỏ qua R2 hoàn toàn. Hai lý do:
  //   1. Sự cố thật: đã `--download` bản dump vài GB rồi mà lần restore đầu hỏng giữa chừng —
  //      không có lý do gì tải lại từ đầu trong lúc dịch vụ đang sập.
  //   2. Kiểm chứng được nhánh PHÁ HUỶ này trên cụm Postgres nháp mà không cần khoá R2
  //      (nợ kỹ thuật cũ: nhánh --restore-into chưa từng được chạy thử thật).
  const fromFile = getArg('from-file')
  let localPath: string
  let cleanupLocal = true

  if (fromFile) {
    if (!fs.existsSync(fromFile)) fail(`Không thấy file "${fromFile}" (tham số --from-file).`)
    localPath = path.resolve(fromFile)
    cleanupLocal = false // file của người dùng — KHÔNG tự xoá
    console.log(`[restore:r2] Dùng file có sẵn "${localPath}" (bỏ qua R2).`)
  } else {
    const client = getClient()
    const bucket = getBucket()
    const key = await resolveKey(client, bucket, getArg('key'))
    const fileName = key.slice(KEY_PREFIX.length)
    localPath = path.join(process.cwd(), `.restore-${fileName}`)

    console.log(`[restore:r2] Tải "${key}" về tạm "${localPath}"...`)
    await downloadBackup(client, bucket, key, localPath)
  }

  // Kiểm file TRƯỚC bước phá huỷ: dump hỏng/tải dở thì dừng khi database cũ còn nguyên.
  console.log(`[restore:r2] Kiểm tính toàn vẹn gzip của "${localPath}"...`)
  assertGzipIntact(localPath)

  console.log(`[restore:r2] ⚠️  Xoá + tạo lại database "${targetDb}"...`)
  try {
    execFileSync('psql', [psqlUrl, '-c', `drop database if exists ${targetDb};`], {
      stdio: 'inherit',
    })
    execFileSync('psql', [psqlUrl, '-c', `create database ${targetDb};`], { stdio: 'inherit' })
  } catch (err) {
    rethrowWithoutCommand(err, `Xoá/tạo lại database "${targetDb}"`)
  }

  console.log(`[restore:r2] Khôi phục dữ liệu vào "${targetDb}"...`)
  // Ghép connection string trỏ đúng database đích thay vì database mặc định của psqlUrl.
  const targetUrl = psqlUrl.replace(/\/[^/?]*(\?|$)/, `/${targetDb}$1`)
  runRestorePipeline(localPath, targetUrl)

  const users = verifyRestoredDatabase(targetUrl)
  if (cleanupLocal) fs.unlinkSync(localPath)
  console.log(
    `[restore:r2] ✅ Khôi phục xong vào database "${targetDb}" (public.users: ${users} dòng).`,
  )
  console.log(`  Kiểm lại: psql "${redactConnectionUrl(targetUrl)}"`)
}

/**
 * Lỗi của execFileSync chứa NGUYÊN dòng lệnh — tức cả connection string có mật khẩu — và
 * `main().catch` sẽ in nó ra. Ném lại lỗi chỉ mang tên bước + mã thoát (AUD-SEC-003).
 * stderr của psql đã hiện trực tiếp nhờ stdio 'inherit', không mất thông tin chẩn đoán.
 */
function rethrowWithoutCommand(err: unknown, step: string): never {
  const status = (err as { status?: number | null }).status
  throw new Error(`${step} thất bại${status != null ? ` (mã thoát ${status})` : ''}.`)
}

/** `gunzip -t`: đọc hết file nén, ném lỗi nếu cắt cụt/hỏng — không ghi gì ra đĩa hay CSDL. */
export function assertGzipIntact(localPath: string): void {
  try {
    execFileSync('gunzip', ['-t', localPath], { stdio: 'pipe' })
  } catch {
    throw new Error(
      `File backup "${localPath}" hỏng hoặc tải dở (gunzip -t lỗi) — KHÔNG đụng tới database.`,
    )
  }
}

/**
 * gunzip | psql — giống hệt cách pg_dump tạo ra file (cron: pg_dump ... | gzip), xem
 * docs/setup-postgresql-vps.md mục 7. `pipefail` để gzip hỏng giữa chừng làm cả lệnh lỗi;
 * `ON_ERROR_STOP=1` để câu SQL lỗi đầu tiên dừng psql với mã khác 0 — thiếu hai cờ này, restore
 * từng báo thành công sau dump lỗi (audit 2026-10-26, AUD-DATA-002).
 */
export function runRestorePipeline(localPath: string, targetUrl: string): void {
  try {
    execFileSync(
      'bash',
      ['-o', 'pipefail', '-c', `gunzip -c "${localPath}" | psql -v ON_ERROR_STOP=1 "${targetUrl}"`],
      {
        stdio: 'inherit',
      },
    )
  } catch (err) {
    rethrowWithoutCommand(err, 'Nạp dump (gunzip | psql)')
  }
}

/** Kiểm dữ liệu sau restore: bảng lõi đọc được và trả về số. Ném lỗi nếu không. */
export function verifyRestoredDatabase(targetUrl: string): number {
  let out: string
  try {
    out = execFileSync(
      'psql',
      ['-X', '-v', 'ON_ERROR_STOP=1', '-At', '-c', 'select count(*) from public.users;', targetUrl],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] },
    ).trim()
  } catch (err) {
    rethrowWithoutCommand(err, 'Kiểm sau restore (select count(*) from public.users)')
  }
  if (!/^\d+$/.test(out)) {
    throw new Error(`Kiểm sau restore trả kết quả lạ: "${out.slice(0, 80)}"`)
  }
  return Number(out)
}

async function main(): Promise<void> {
  if (hasFlag('list')) return cmdList()
  if (hasFlag('download')) return cmdDownload()

  const targetDb = getArg('restore-into')
  if (targetDb) return cmdRestoreInto(targetDb)

  console.log(
    'Cách dùng:\n' +
      '  npm run restore:r2 -- --list\n' +
      '  npm run restore:r2 -- --download [--key <tên-file>] [--out <đường-dẫn>]\n' +
      '  npm run restore:r2 -- --restore-into <ten_database> [--key <tên-file>] --yes\n' +
      '  npm run restore:r2 -- --restore-into <ten_database> --from-file <file.sql.gz> --yes\n' +
      'Xem chi tiết trong comment đầu file scripts/restore-pg-from-r2.ts.',
  )
}

const isMainModule = process.argv[1] && import.meta.url === `file://${process.argv[1]}`
if (isMainModule) {
  main().catch((err) => {
    console.error('[restore:r2] ❌ Lỗi:', err instanceof Error ? err.message : err)
    process.exit(1)
  })
}
