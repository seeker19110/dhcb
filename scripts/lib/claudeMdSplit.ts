// scripts/lib/claudeMdSplit.ts — logic thuần cho việc rút gọn CLAUDE.md (changelog 0476).
//
// CLAUDE.md được nạp vào MỌI phiên Claude, nên phần lý do/lịch sử/số đo được dời NGUYÊN VĂN sang
// `docs/claude-md-chi-tiet.md`, còn CLAUDE.md giữ luật + một dòng trỏ. Hai hàm dưới đây là cổng
// cho việc đó: không mất chữ nào khi dời, và mọi dòng trỏ đều trỏ tới mục có thật.

/** Đường dẫn file chi tiết mà CLAUDE.md trỏ tới. */
export const FILE_CHI_TIET = 'docs/claude-md-chi-tiet.md'

function tapDong(text: string): Set<string> {
  return new Set(
    text
      .split('\n')
      .map((dong) => dong.trim())
      .filter(Boolean),
  )
}

/**
 * Các dòng (bỏ khoảng trắng hai đầu, bỏ dòng trống) của CLAUDE.md CŨ không còn xuất hiện nguyên
 * văn ở CLAUDE.md MỚI lẫn file chi tiết — tức chữ đã bị mất khi rút gọn. Rỗng = không mất gì.
 */
export function dongBiMat(cu: string, moi: string, chiTiet: string): string[] {
  const conLai = tapDong(moi)
  const daDoi = tapDong(chiTiet)
  return [...tapDong(cu)].filter((dong) => !conLai.has(dong) && !daDoi.has(dong))
}

/** Các mục `§X` mà CLAUDE.md trỏ tới qua cụm "`docs/claude-md-chi-tiet.md` §X". */
export function mucDuocTro(claudeMd: string): string[] {
  const muc = new Set<string>()
  const khuon = /docs\/claude-md-chi-tiet\.md`?\s*(§\d+(?:\.\d+)?)/g
  for (const m of claudeMd.matchAll(khuon)) muc.add(m[1]!)
  return [...muc]
}

/** Các mục `§X` mà file chi tiết thật sự có (tiêu đề dạng `## §X — …`). */
export function mucCoThat(chiTiet: string): string[] {
  return [...chiTiet.matchAll(/^## (§\d+(?:\.\d+)?) /gm)].map((m) => m[1]!)
}
