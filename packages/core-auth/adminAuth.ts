// Quyền ADMIN gắn với ID tài khoản bất biến do validateAuth xác thực, không dùng email
// do người dùng có thể sửa. ADMIN_USER_IDS là danh sách ID phân tách bằng dấu phẩy.
// Không cấu hình danh sách => từ chối toàn bộ quyền quản trị, không fallback ADMIN_EMAILS.
export function isAdminUser(userId: string | null | undefined): boolean {
  if (!userId) return false
  const list = (process.env.ADMIN_USER_IDS || '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean)
  return list.includes(userId)
}
