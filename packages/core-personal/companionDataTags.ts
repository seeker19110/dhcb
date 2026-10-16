const MAX_DATA_TAG_DELETION_PASSES = 32

/** Caller giữ matcher riêng; chỉ trả dữ liệu đã ổn định sau các lượt xóa. */
export function stripCompanionDataTags(text: string, matcher: RegExp): string | null {
  let current = text
  // DEBT: thẻ lồng có thể ghép lại qua nhiều pass | trần: 32 lượt xóa + kiểm ổn định | xem lại khi: cần nesting sâu hơn hoặc có parser tuyến tính giữ đúng policy.
  for (let pass = 0; pass < MAX_DATA_TAG_DELETION_PASSES; pass += 1) {
    const next = current.replace(matcher, '')
    if (next === current) return current
    current = next
  }
  // Kiểm ổn định sau tối đa 32 deletion passes; không trả kết quả của pass thứ 33.
  return current.replace(matcher, '') === current ? current : null
}
