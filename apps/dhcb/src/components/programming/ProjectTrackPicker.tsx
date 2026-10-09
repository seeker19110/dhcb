// ProjectTrackPicker — bộ chọn DỰ ÁN TRỤC T1/T2/T3 ở trang dự án (2026-10-09).
// Đặc tả: docs/specs/2026-10-09-du-an-truc-t2-t3-ha-tang.md.
//
// Vì sao dùng radio GỐC (fieldset + legend + input type=radio) chứ không tự dựng nút/role="radio":
// trình duyệt cho sẵn hợp đồng bàn phím (Tab vào nhóm, mũi tên đổi lựa chọn, bỏ qua ô bị vô
// hiệu) và trình đọc màn hình đọc đúng "1 trong 3, đã chọn/không khả dụng". Tự dựng thì phải tự
// cài lại đủ chừng đó — trang dự án đã có tiền lệ tránh role="tab" vì đúng lý do này.
//
// Dự án chưa có bước (available=false) hiện "Sắp mở" và ô radio bị `disabled` thật — không phải
// chỉ làm mờ, để bàn phím và trình đọc màn hình cũng thấy đúng là không chọn được.
import { Lock } from 'lucide-react'
import type { ProjectTrack, ProjectTrackId } from '@dhcb/subject-programming/projectTracks'

interface Props {
  tracks: readonly ProjectTrack[]
  value: ProjectTrackId
  onChange: (track: ProjectTrackId) => void
  /** Đang lưu file/đổi dự án — khoá cả nhóm để không đổi chồng lên nhau. */
  busy?: boolean
}

export default function ProjectTrackPicker({ tracks, value, onChange, busy = false }: Props) {
  return (
    <fieldset className="space-y-2" aria-busy={busy || undefined}>
      <legend className="text-sm font-bold text-white mb-2">Chọn dự án của bạn</legend>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {tracks.map((track) => {
          const checked = track.id === value
          const inputId = `project-track-${track.id}`
          return (
            <label
              key={track.id}
              htmlFor={inputId}
              // Lưới 2 cột: ô radio ở cột 1, chữ ở cột 2. Tên dự án nằm NGAY dưới <label> (không
              // lồng sâu) để lint jsx-a11y thấy được nhãn có chữ.
              className={`tap-44 grid grid-cols-[auto_1fr] content-start items-start gap-x-3 gap-y-1 rounded-2xl border p-3.5 transition-colors ${
                checked
                  ? 'border-accent-500 bg-accent-500/10'
                  : track.available
                    ? 'border-zinc-800 bg-zinc-900 hover:border-zinc-600 cursor-pointer'
                    : 'border-zinc-800 bg-zinc-900/50 cursor-not-allowed'
              }`}
            >
              <input
                id={inputId}
                type="radio"
                name="project-track"
                value={track.id}
                checked={checked}
                disabled={!track.available || busy}
                onChange={() => onChange(track.id)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-accent-500"
              />
              <span className="min-w-0 flex flex-wrap items-center gap-2 text-sm font-semibold text-zinc-100">
                {track.name}
                {!track.available && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-zinc-700 px-2 py-0.5 text-[0.6875rem] font-semibold text-zinc-300">
                    <Lock className="w-3 h-3" aria-hidden="true" />
                    Sắp mở
                  </span>
                )}
              </span>
              <span className="col-start-2 block text-xs leading-relaxed text-zinc-300">
                {track.description}
              </span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
