import { describe, expect, it } from 'vitest'
import { globToRegExp, startupScripts, uncoveredStartupFiles } from './startupCoverage'

const HTML = `<!doctype html><html><head>
<script type="module" crossorigin src="/js/index-AbC123.js"></script>
<link rel="modulepreload" crossorigin href="/js/rolldown-runtime-X1.js">
<link rel="modulepreload" crossorigin href="/js/vendor-core-Y2.js">
<link rel="stylesheet" crossorigin href="/assets/index-Z3.css">
<link rel="preload" href="/fonts/a.woff2" as="font">
</head><body><div id="root"></div></body></html>`

describe('startupScripts', () => {
  it('lấy entry + modulepreload, bỏ CSS/font, bỏ "/" đầu, không trùng', () => {
    expect(startupScripts(HTML)).toEqual([
      'js/index-AbC123.js',
      'js/rolldown-runtime-X1.js',
      'js/vendor-core-Y2.js',
    ])
  })

  it('đọc cả danh sách file trong script INLINE (khuôn dựng sẵn trang chủ khách, changelog 0584)', () => {
    // Đúng hình dạng `deferBootScriptsWhilePrerendered` sinh ra: không còn thẻ src/modulepreload.
    const deferred = `<html><head><script>(function(e,t,n,r){/*…*/})("/js/index-AbC.js",["/js/rolldown-runtime-X1.js","/js/vendor-core-Y2.js"],"data-guest-prerender",2000)</script>
<script type="application/ld+json">{"url":"https://x/js/khong-phai-file.js"}</script>
<link rel="stylesheet" href="/assets/index-Z3.css"></head></html>`
    expect(startupScripts(deferred)).toEqual([
      'js/index-AbC.js',
      'js/rolldown-runtime-X1.js',
      'js/vendor-core-Y2.js',
    ])
  })
})

describe('globToRegExp', () => {
  it('`*` khớp trong một đoạn đường dẫn, không vượt `/`', () => {
    const re = globToRegExp('dist/js/storage-*.js')
    expect(re.test('dist/js/storage-CLk.js')).toBe(true)
    expect(re.test('dist/js/syncOutboxStorage-CLk.js')).toBe(false)
    expect(re.test('dist/js/storage-a/b.js')).toBe(false)
  })

  it('ký tự đặc biệt của regex được thoát', () => {
    expect(globToRegExp('dist/js/a.b-*.js').test('dist/js/aXb-1.js')).toBe(false)
  })
})

describe('uncoveredStartupFiles', () => {
  it('báo đúng file khởi động không glob nào khớp', () => {
    const files = ['dist/js/index-1.js', 'dist/js/localJson-2.js', 'dist/js/vendor-core-3.js']
    expect(
      uncoveredStartupFiles(files, ['dist/js/index-*.js', 'dist/js/vendor-core-*.js']),
    ).toEqual(['dist/js/localJson-2.js'])
  })

  it('phủ đủ → mảng rỗng', () => {
    expect(uncoveredStartupFiles(['dist/js/index-1.js'], ['dist/js/index-*.js'])).toEqual([])
  })
})
