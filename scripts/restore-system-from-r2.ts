// scripts/restore-system-from-r2.ts — Tải bản cấu hình hệ thống (Nginx + crontab + PM2 dump) đã
// mã hoá từ R2, giải mã, ghi ra thư mục tạm để tự kiểm tra trước khi khôi phục từng phần.
// Dùng khi VPS mới bị mất/hỏng — xem scripts/backup-system-to-r2.ts để biết cách backup.
//
// Cách chạy:
//   ENV_BACKUP_PASSPHRASE="..." npm run restore:system                          # bản mới nhất
//   ENV_BACKUP_PASSPHRASE="..." npm run restore:system -- system_20260731.tar.gz.enc  # bản cụ thể
//
// Kết quả ghi ra ./system-restored.tar.gz — KHÔNG tự giải nén/ghi đè gì. Tự kiểm tra rồi khôi
// phục TỪNG PHẦN theo nhu cầu thật (đừng ghi đè cả /etc/nginx nếu chỉ cần crontab, ví dụ):
//   tar -tzf system-restored.tar.gz                          # xem cấu trúc bên trong
//   sudo tar -xzf system-restored.tar.gz -C /tmp/restored     # giải nén ra chỗ tạm, xem trước
//   sudo cp -a /tmp/restored/nginx/. /etc/nginx/              # khôi phục riêng Nginx
//   sudo crontab -u postgres /tmp/restored/crontab/postgres.txt  # khôi phục riêng crontab
//   pm2 resurrect  # sau khi cp /tmp/restored/pm2/dump.pm2 → ~/.pm2/dump.pm2

import * as dotenv from 'dotenv'
import { writePrivateFile } from './lib/restoreSafety'
import * as path from 'node:path'
import { S3Client, GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3'
import { KEY_PREFIX } from './backup-system-to-r2'
import { decryptEnv } from './restore-env-from-r2'

dotenv.config()

const OUTPUT_FILE = path.join(process.cwd(), 'system-restored.tar.gz')

function fail(message: string): never {
  console.error(`[restore:system] ❌ ${message}`)
  process.exit(1)
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
    fail(`Không thấy bản backup hệ thống nào trên bucket (prefix ${KEY_PREFIX}).`)
  objects.sort((a, b) => (b.LastModified?.getTime() ?? 0) - (a.LastModified?.getTime() ?? 0))
  const latest = objects[0]
  if (!latest?.Key) fail('Không thấy bản backup hệ thống nào trên bucket.')
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

  console.log(`[restore:system] Tải "${key}" từ bucket "${bucket}"...`)
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
    `[restore:system] ✅ Đã ghi ra "${OUTPUT_FILE}" — xem hướng dẫn khôi phục từng phần ở comment đầu file này.`,
  )
}

const isMainModule = process.argv[1] && import.meta.url === `file://${process.argv[1]}`
if (isMainModule) {
  main().catch((err) => {
    console.error('[restore:system] ❌ Lỗi:', err instanceof Error ? err.message : err)
    process.exit(1)
  })
}
