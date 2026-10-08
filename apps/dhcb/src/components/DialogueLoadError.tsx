// apps/dhcb/src/components/DialogueLoadError.tsx — khối lỗi + Thử lại cho phần HỘI THOẠI MẪU.
//
// Vì sao có file này (changelog 0530): bốn nơi gọi `getDialogues()` viết `.then(setX)` không có
// nhánh lỗi — tải hỏng thì mất phần hội thoại im lặng và sinh unhandled rejection. Gom câu chữ +
// ngôn ngữ chiều học vào một chỗ để các nơi dùng cùng một khối lỗi.
import LoadError from './LoadError'
import { GOI_Y_HOI_THOAI_EN, GOI_Y_HOI_THOAI_VI } from '../lib/curriculumMessages'

export default function DialogueLoadError({
  isA,
  message,
  onRetry,
}: {
  /** Chiều A (giao diện tiếng Việt) hay chiều B (tiếng Anh). */
  isA: boolean
  message: string
  onRetry: () => void
}) {
  return (
    <LoadError
      message={message}
      onRetry={onRetry}
      lang={isA ? 'vi' : 'en'}
      hint={isA ? GOI_Y_HOI_THOAI_VI : GOI_Y_HOI_THOAI_EN}
    />
  )
}
