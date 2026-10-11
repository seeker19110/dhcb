/** "0963061414" → "096 306 1414" để đọc được; số ngắn (111, 115) giữ nguyên. */
export function formatPhone(phone: string): string {
  if (phone.length !== 10) return phone
  return `${phone.slice(0, 3)} ${phone.slice(3, 6)} ${phone.slice(6)}`
}
