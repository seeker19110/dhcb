// apps/dhcb/src/components/Field.tsx — bọc một ô nhập cùng nhãn của nó.
//
// Vì sao có file này: 4 trang trụ cột có ~59 thẻ <label> đứng CẠNH ô nhập mà không có
// `htmlFor`, cũng không bọc ô nhập. Đó là nhãn mồ côi: bấm vào chữ không đưa tiêu điểm
// vào ô, và trình đọc màn hình đọc ô đó là "edit, blank" (vi phạm WCAG 1.3.1 / 4.1.2,
// axe rule `label`).
//
// Dùng kiểu render-prop để hoạt động với MỌI loại ô (input/select/textarea) mà không
// cần cloneElement ma thuật:
//
//   <Field label="Vị trí mục tiêu" required>
//     {(id) => <input id={id} className={FIELD_INPUT} ... />}
//   </Field>
import { useId, type ReactNode } from 'react'

/** Lớp Tailwind dùng chung cho ô nhập trong các hộp thoại của trang trụ cột. */
export const FIELD_INPUT =
  'w-full px-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 text-sm focus:border-accent-500 focus:outline-none'

export type FieldProps = {
  label: string
  /** Đánh dấu bắt buộc: hiện dấu (*) và thêm phần đọc rõ cho trình đọc màn hình. */
  required?: boolean
  /** Ghi chú phụ hiện dưới ô nhập. */
  hint?: string
  children: (id: string) => ReactNode
}

export default function Field({ label, required, hint, children }: FieldProps) {
  const id = useId()
  const hintId = `${id}-hint`
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-medium text-zinc-400 mb-1">
        {label}
        {required && (
          <>
            {' '}
            <span aria-hidden="true">(*)</span>
            <span className="sr-only">bắt buộc</span>
          </>
        )}
      </label>
      {children(id)}
      {hint && (
        <p id={hintId} className="mt-1 text-[0.6875rem] text-zinc-500">
          {hint}
        </p>
      )}
    </div>
  )
}
