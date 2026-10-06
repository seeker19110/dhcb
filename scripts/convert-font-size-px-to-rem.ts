#!/usr/bin/env node
// Chuyển đổi font-size từ px sang rem (tỉ lệ 16)

import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const REPO_ROOT = join(__dirname, '..')
const SCAN_ROOTS = ['apps/dhcb/src', 'apps/hub/src', 'packages']
const SKIP_DIRS = new Set(['node_modules', 'dist', 'dist-server', '.next', 'coverage'])

function pxToRem(px: number): string {
  const rem = px / 16
  // Làm tròn 4 chữ số thập phân để tránh lỗi làm tròn
  return parseFloat(rem.toFixed(4)).toString()
}

function walk(dir: string, exts: string[]): string[] {
  const out: string[] = []
  try {
    for (const entry of readdirSync(dir)) {
      if (SKIP_DIRS.has(entry)) continue
      const full = join(dir, entry)
      const stat = statSync(full)
      if (stat.isDirectory()) out.push(...walk(full, exts))
      else if (exts.includes(full.slice(full.lastIndexOf('.')))) out.push(full)
    }
  } catch {
    // Ignore read errors
  }
  return out
}

function convertFontSize(source: string): string {
  // Pattern 1: Tailwind class text-[11px] → text-[0.6875rem]
  let result = source.replace(/text-\[(\d+(?:\.\d+)?)px\]/g, (match, num) => {
    return `text-[${pxToRem(parseFloat(num))}rem]`
  })

  // Pattern 2: fontSize: '11px' (string) → fontSize: '0.6875rem'
  result = result.replace(/fontSize:\s*['"](\d+(?:\.\d+)?)px['"]/g, (match, num) => {
    return `fontSize: '${pxToRem(parseFloat(num))}rem'`
  })

  // Pattern 3: fontSize: 11 (number, được hiểu là px) → fontSize: '0.6875rem'
  // Cần cẩn thận để không match trường hợp không phải font-size
  result = result.replace(/fontSize:\s*(\d+)(?![\w])/g, (match, num) => {
    // Loại bỏ trường hợp có dấu chấm theo sau (để tránh match decimal không hoàn chỉnh)
    return `fontSize: '${pxToRem(parseFloat(num))}rem'`
  })

  return result
}

function main() {
  const tsFiles = SCAN_ROOTS.flatMap((r) => walk(join(REPO_ROOT, r), ['.ts', '.tsx'])).filter(
    (f) => !/\.test\.tsx?$/.test(f) && !f.endsWith('.d.ts'),
  )

  console.log(`Scanning ${tsFiles.length} TypeScript files...`)

  let totalReplaced = 0
  const filesChanged: Array<[string, number]> = []

  for (const file of tsFiles) {
    const content = readFileSync(file, 'utf8')
    const newContent = convertFontSize(content)

    if (content !== newContent) {
      const oldMatches =
        content.match(/text-\[\d+(?:\.\d+)?px\]|fontSize:\s*(?:['"]\d+(?:\.\d+)?px['"]|\d)/g) || []
      const newMatches =
        newContent.match(/text-\[\d+(?:\.\d+)?px\]|fontSize:\s*(?:['"]\d+(?:\.\d+)?px['"]|\d)/g) ||
        []
      const count = oldMatches.length - newMatches.length

      writeFileSync(file, newContent, 'utf8')
      filesChanged.push([
        file
          .slice(REPO_ROOT.length + 1)
          .split('\\')
          .join('/'),
        count,
      ])
      totalReplaced += count
    }
  }

  console.log(`\nTotal replaced: ${totalReplaced}`)
  console.log(`Files changed: ${filesChanged.length}`)
  filesChanged.forEach(([file, count]) => {
    console.log(`  ${file}: ${count}`)
  })
}

main()
