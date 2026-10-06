// apps/dhcb/src/components/location/GroupSpread.tsx — "Nhóm đang giãn bao xa".
//
// Bản cũ liệt kê khoảng cách của MỌI CẶP thành viên. Số cặp tăng theo bình phương số người:
// 4 người = 6 dòng, 6 người = 15 dòng, 10 người = 45 dòng — cuộn mãi không hết và chẳng dòng nào
// trả lời được câu hỏi người ta thật sự hỏi: "cả nhóm có đang tách ra không?".
//
// Thay bằng: MỘT con số dẫn dắt (cặp xa nhau nhất = độ giãn của cả nhóm), phần còn lại gấp vào
// <details> cho ai muốn xem chi tiết. Dữ liệu không mất đi, chỉ thôi tranh chỗ với thứ quan trọng.

import { formatDistance } from '../../lib/locationFormat'
import { MEMBER_INK, memberColor, memberInitial } from './memberColor'
import type { MemberPosition } from '../../lib/locationShare'

export interface Pair {
  a: MemberPosition
  b: MemberPosition
  distanceM: number
}

interface Props {
  /** Đã sắp xếp tăng dần theo khoảng cách. */
  pairs: Pair[]
  myUserId: string
}

function Dot({ member }: { member: MemberPosition }) {
  return (
    <span
      className="inline-flex h-5 w-5 items-center justify-center rounded-full align-middle text-[0.6875rem] font-bold"
      style={{ backgroundColor: memberColor(member.userId), color: MEMBER_INK }}
      aria-hidden="true"
    >
      {memberInitial(member.name)}
    </span>
  )
}

function PairLine({ pair, myUserId }: { pair: Pair; myUserId: string }) {
  const label = (m: MemberPosition) => `${m.name}${m.userId === myUserId ? ' (bạn)' : ''}`
  return (
    <span className="flex items-center justify-between gap-2">
      <span className="flex min-w-0 items-center gap-1.5 text-zinc-200">
        <Dot member={pair.a} />
        <span className="truncate">{label(pair.a)}</span>
        <span aria-hidden="true">↔</span>
        <Dot member={pair.b} />
        <span className="truncate">{label(pair.b)}</span>
      </span>
      <span className="shrink-0 font-bold tabular-nums text-zinc-100">
        {formatDistance(pair.distanceM)}
      </span>
    </span>
  )
}

export default function GroupSpread({ pairs, myUserId }: Props) {
  if (pairs.length === 0) return null
  const widest = pairs[pairs.length - 1]!

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
      <h2 className="text-lg font-bold text-zinc-100">Nhóm đang giãn</h2>
      <p className="mt-1 text-sm text-zinc-200">
        Hai người xa nhau nhất cách {formatDistance(widest.distanceM)}.
      </p>
      <div className="mt-2 text-sm">
        <PairLine pair={widest} myUserId={myUserId} />
      </div>

      {pairs.length > 1 && (
        <details className="mt-3">
          <summary className="tap-44-y cursor-pointer text-sm font-semibold text-accent-400 theme-light:text-accent-700">
            Xem khoảng cách từng cặp ({pairs.length} cặp)
          </summary>
          <ul className="mt-2 space-y-2 text-sm">
            {pairs.map((pair) => (
              <li key={`${pair.a.userId}-${pair.b.userId}`}>
                <PairLine pair={pair} myUserId={myUserId} />
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  )
}
