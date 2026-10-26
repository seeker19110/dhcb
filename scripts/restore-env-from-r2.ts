// scripts/restore-env-from-r2.ts — Tải bản .env đã mã hoá từ R2 về, giải mã bằng passphrase.
// Dùng khi VPS mới bị mất/hỏng .env — xem scripts/backup-env-to-r2.ts để biết cách backup.
//
// Cách chạy:
//   ENV_BACKUP_PASSPHRASE="..." npm run restore:env                 # lấy bản mới nhất
//   ENV_BACKUP_PASSPHRASE="..." npm run restore:env -- env_20260729.enc   # chỉ định bản cụ thể
//
// Kết quả ghi ra .env.restored (KHÔNG ghi đè .env trực tiếp — tự kiểm tra rồi mới đổi tên tay).

import * as dotenv from 'dotenv'
import { writePrivateFile } from './lib/restoreSafety'
import * as path from 'node:path'
import * as crypto from 'node:crypto'
import { S3Client, GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3'
import { KEY_PREFIX } from './backup-env-to-r2'

dotenv.config()

const SALT_LENGTH = 16
const IV_LENGTH = 12
const SCRYPT_KEY_LENGTH = 32
const OUTPUT_FILE = path.join(process.cwd(), '.env.restored')

function fail(message: string): never {
  console.error(`[restore:env] ❌ ${message}`)
  process.exit(1)
}

export function decryptEnv(blob: Buffer, passphrase: string): Buffer {
  const salt = blob.subarray(0, SALT_LENGTH)
  const iv = blob.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH)
  const authTag = blob.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + 16)
  const ciphertext = blob.subarray(SALT_LENGTH + IV_LENGTH + 16)
  const key = crypto.scryptSync(passphrase, salt, SCRYPT_KEY_LENGTH)
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(authTag)
  return Buffer.concat([decipher.update(ciphertext), decipher.final()])
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

async function findLatestKey(client: S3Client, bucket: string): Promise<string> {
  const res = await client.send(new ListObjectsV2Command({ Bucket: bucket, Prefix: KEY_PREFIX }))
  const objects = (res.Contents ?? []).filter((o) => o.Key)
  if (objects.length === 0)
    fail(`Không thấy bản backup .env nào trên bucket (prefix ${KEY_PREFIX}).`)
  objects.sort((a, b) => (b.LastModified?.getTime() ?? 0) - (a.LastModified?.getTime() ?? 0))
  const latest = objects[0]
  if (!latest?.Key) fail('Không thấy bản backup .env nào trên bucket.')
  return latest.Key
}

async function main(): Promise<void> {
  const bucket = process.env.R2_BACKUP_BUCKET
  if (!bucket) fail('Thiếu R2_BACKUP_BUCKET trong .env')

  const passphrase = process.env.ENV_BACKUP_PASSPHRASE
  if (!passphrase) fail('Thiếu ENV_BACKUP_PASSPHRASE — truyền qua biến môi trường lúc chạy lệnh.')

  const client = getClient()
  const arg = process.argv[2]
  const key =
    arg && !arg.startsWith('--')
      ? `${KEY_PREFIX}${arg}`
      : await findLatestKey(client, bucket as string)

  console.log(`[restore:env] Tải "${key}" từ bucket "${bucket}"...`)
  const res = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }))
  const chunks: Buffer[] = []
  for await (const chunk of res.Body as AsyncIterable<Buffer>) chunks.push(chunk)
  const blob = Buffer.concat(chunks)

  let decrypted: Buffer
  try {
    decrypted = decryptEnv(blob, passphrase)
  } catch {
    fail('Giải mã thất bại — sai ENV_BACKUP_PASSPHRASE hoặc file backup bị hỏng.')
  }

  writePrivateFile(OUTPUT_FILE, decrypted)
  console.log(
    `[restore:env] ✅ Đã ghi ra "${OUTPUT_FILE}" — tự kiểm tra nội dung rồi mới đổi tên thành .env.`,
  )
}

// Guard giống scripts/backup-pg-to-r2.ts — không tự chạy main() khi bị import trong test.
const isMainModule = process.argv[1] && import.meta.url === `file://${process.argv[1]}`
if (isMainModule) {
  main().catch((err) => {
    console.error('[restore:env] ❌ Lỗi:', err instanceof Error ? err.message : err)
    process.exit(1)
  })
}
