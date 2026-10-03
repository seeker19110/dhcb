// ActivityResult — MÀN KẾT QUẢ dùng chung sau khi nộp một hoạt động học.
//
// Đặc tả: docs/specs/2026-09-15-learning-ux-s11-completion-evidence.md AC-14 (slice S11-3);
// định danh câu, thứ tự và lời giải thu gọn:
// docs/specs/2026-09-23-uiux-s09-s12-trai-nghiem-va-nghiem-thu.md §2.4 (slice S09a).
//
// BỐN QUYẾT ĐỊNH ĐÁNG NHỚ:
//
//  1. NĂM TRẠNG THÁI, TRẠNG THÁI NÀO CŨNG CÓ CHỮ. `passed`/`failed` là lời của SERVER;
//     `local` là kết quả chấm trên chính máy này (khách); `pending` là "chưa gửi được, đang
//     giữ lại"; `error` là "gửi lên và bị từ chối". Người học phải phân biệt được bốn tình
//     huống rất khác nhau đó mà không cần nhìn màu — nên khác biệt nằm ở CÂU CHỮ, màu chỉ đi
//     kèm.
//
//  2. CHỮ "HOÀN THÀNH" CHỈ THUỘC VỀ `passed`. Bản chấm cục bộ nói rõ nó mới nằm trên máy này;
//     bản đang chờ gửi nói rõ nó chưa tới máy chủ. Đây là hình chiếu lên giao diện của bất
//     biến lớn nhất slice S11: client không tự phong hoàn thành cho mình.
//
//  3. LÝ DO SAI NÓI BẰNG TIẾNG VIỆT, KHÔNG GỌI AI. `reason` của `GradeResult` (engine chấm
//     thuần, tất định) đã đủ để nói "Thiếu đơn vị" hay "Chưa tối giản" — đúng tinh thần
//     `packages/core-grading`: AI chỉ để GIẢI THÍCH thêm, không bao giờ để PHÁN đúng/sai.
//
//  4. [S09a] MÀN HÌNH CHỈ TRÌNH BÀY, KHÔNG SUY RA ĐỊNH DANH. Số câu và neo `#cau-N` lấy từ
//     `questionIndex` GỐC mà adapter mang vào — nhờ vậy màn hình được xếp câu sai lên đầu mà
//     số câu không lệch. Caller cũ không mang index thì giữ nguyên thứ tự cũ và không có link
//     định vị (không bịa neo có thể trỏ nhầm câu).
import { useCallback, useId, useMemo, useRef, useState, type ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Check, ChevronDown, Minus, X } from 'lucide-react'
import { nhanLyDo } from '../../lib/gradeReasonLabel'
import { neoCauHoi } from '../../lib/mistakeRoutes'
import { buttonClass } from '@core/buttonStyles'
import { cauTongKetKetQua, type TongKetInput } from '../../lib/feedbackCopy'

// Hai kiểu trạng thái khai ở `lib/feedbackCopy.ts` (nơi dựng câu tổng kết — S10b), xuất lại ở
// đây để mọi nơi đang import từ component không phải đổi.
export type { ActivityResultStatus, ActivityResultPendingReason } from '../../lib/feedbackCopy'

export interface ActivityResultItem {
  /**
   * [S09a] Chỉ số câu GỐC trong bài (0-based). Khi MỌI item đều có: nhãn "Câu N" lấy từ đây
   * (không từ vị trí hiển thị), hàng có id `ket-qua-cau-N`, có link "Xem câu N" tới neo
   * `#cau-N` (`neoCauHoi`) — trang gọi phải có sẵn các neo đó — và danh sách được xếp
   * sai → chưa có kết quả → đúng. Thiếu ở bất kỳ item nào: giữ thứ tự cũ, không có link.
   */
  questionIndex?: number
  /** Định danh ổn định theo bài (vd `ly10-c2-b10#cau-3`) — chỉ làm key, không làm id DOM. */
  id?: string
  prompt: string
  /** Chữ người học đã trả lời (trắc nghiệm: nhãn lựa chọn, không phải id). */
  yourAnswer: string
  /**
   * `true` đúng · `false` chưa đúng · `null` CHƯA CÓ KẾT QUẢ câu này (nguồn chấm không trả
   * dòng cho câu đó). Thiếu kết quả KHÔNG có nghĩa là sai (§2.4 đặc tả S09).
   */
  correct: boolean | null
  /** Lời giảng của bài — thu gọn sau nút "Xem giải thích câu N"; câu đúng cũng mở được. */
  explain?: string
  /**
   * Mã lý do của engine chấm (`ReasonCode`), đổi sang chữ tiếng Việt ở `nhanLyDo`.
   *
   * Kiểu là `string` chứ không phải `ReasonCode` vì mã này đi qua MẠNG: hợp đồng
   * `EvidenceItem` khai `reason: z.string()`, nên một server mới hơn hoàn toàn có thể trả về
   * mã mà bản web đang chạy chưa biết. Ép kiểu hẹp ở đây chỉ để type-checker yên tâm rồi vỡ
   * lúc chạy — thà nhận mọi chuỗi và bỏ qua mã lạ.
   */
  reason?: string
}

export interface ActivityResultProps extends TongKetInput {
  items: readonly ActivityResultItem[]
  /** Tỉ lệ đúng tối thiểu để đạt; có thì hiện thêm một dòng ngưỡng khi chưa đạt. */
  passRatio?: number
  /** Route bài tiếp theo, lấy từ `prevNext` của cây mục lục (S07). */
  nextHref?: string
  /** Làm lại: nơi gọi dọn kết quả cũ, lượt nộp sau sinh `attemptId` MỚI. */
  onRetry?: () => void
  /** Chỗ cắm "Hẹn ôn" cho slice S12. S11 KHÔNG ghi thẻ ôn nào. */
  reviewSlot?: ReactNode
}

/** Một hàng đã sẵn sàng để vẽ: số câu, key và neo đã tính xong. */
interface HangKetQua {
  item: ActivityResultItem
  /** Số câu người học thấy ("Câu N"), bắt đầu từ 1. */
  so: number
  key: string
  /** Neo câu hỏi trong trang (`cau-N`) — chỉ có khi item mang index gốc. */
  neo?: string
}

/** Sai trước, chưa có kết quả giữa, đúng cuối (§2.4): câu cần sửa là thứ người học tìm trước. */
function nhomSapXep(correct: boolean | null): number {
  return correct === false ? 0 : correct === null ? 1 : 2
}

/**
 * Chuẩn bị danh sách hàng. Hàm THUẦN, không sửa `items` (sắp trên bản sao).
 *
 * Chỉ sắp xếp khi MỌI item mang index gốc hợp lệ và không trùng: thiếu index thì số câu buộc
 * phải là vị trí hiển thị, mà đã lấy vị trí làm số thì không được đảo vị trí.
 */
function dungHang(items: readonly ActivityResultItem[]): HangKetQua[] {
  const chiSo = items.map((it) => it.questionIndex)
  const coIndex =
    chiSo.every((i) => i !== undefined && Number.isInteger(i) && i >= 0) &&
    new Set(chiSo).size === chiSo.length

  if (!coIndex) return items.map((item, i) => ({ item, so: i + 1, key: `vi-tri-${i}` }))

  return items
    .map((item, viTri) => ({ item, viTri, goc: item.questionIndex ?? viTri }))
    .sort((a, b) => nhomSapXep(a.item.correct) - nhomSapXep(b.item.correct) || a.viTri - b.viTri)
    .map(({ item, goc }) => {
      const neo = neoCauHoi(goc)
      return { item, so: goc + 1, key: item.id ?? neo, neo }
    })
}

/** Nhãn kết quả của một câu — luôn là CHỮ, màu/biểu tượng chỉ đi kèm. */
function nhanKetQua(item: ActivityResultItem): string {
  if (item.correct === true) return 'Đúng'
  if (item.correct === null) return 'Chưa có kết quả câu này'
  const lyDo = nhanLyDo(item.reason)
  return lyDo ? `Chưa đúng — ${lyDo}` : 'Chưa đúng'
}

/**
 * Đưa tiêu điểm tới câu hỏi trong trang. Link "Xem câu N" vẫn đổi hash như thường; hàm này lo
 * trường hợp hash KHÔNG đổi (bấm lại cùng câu) — khi đó trang không có gì để phản ứng. Tra
 * bằng `getElementById`, không dựng CSS selector từ dữ liệu.
 */
function denCau(neo: string) {
  const dich = document.getElementById(neo)
  if (!dich) return
  dich.focus({ preventScroll: true })
  dich.scrollIntoView({ block: 'start', behavior: 'instant' })
}

export default function ActivityResult(props: ActivityResultProps) {
  const { status, items, passRatio, nextHref, onRetry, reviewSlot } = props
  const location = useLocation()
  const idGoc = useId()
  const tomTatRef = useRef<HTMLDivElement>(null)
  // Những câu đang MỞ lời giải. Mặc định đóng hết: danh sách ngắn lại, câu cần sửa lộ ra ngay.
  const [dangMo, setDangMo] = useState<ReadonlySet<string>>(() => new Set())

  const hang = useMemo(() => dungHang(items), [items])

  const batTat = useCallback((key: string) => {
    setDangMo((cu) => {
      const moi = new Set(cu)
      if (moi.has(key)) moi.delete(key)
      else moi.add(key)
      return moi
    })
  }, [])

  const veTomTat = useCallback(() => {
    tomTatRef.current?.focus({ preventScroll: true })
    tomTatRef.current?.scrollIntoView({ block: 'start', behavior: 'instant' })
  }, [])

  // Chưa đạt = mọi trạng thái KHÔNG phải `passed` mà vẫn có phán quyết đạt/không đạt.
  const chuaDat =
    status === 'failed' || ((status === 'local' || status === 'pending') && !props.passed)

  return (
    <section
      aria-label="Kết quả lượt nộp"
      className="mt-4 rounded-2xl border border-line-subtle bg-surface-card p-4"
    >
      {/* Tóm tắt điểm + trạng thái lưu: KHÔNG bao giờ thu gọn. `tabIndex={-1}` để nút "Về tóm
          tắt kết quả" đưa tiêu điểm về được mà không thêm điểm dừng Tab. */}
      <div
        ref={tomTatRef}
        tabIndex={-1}
        className="scroll-mt-24 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
      >
        {/* Vùng SỐNG DUY NHẤT của màn kết quả, chỉ bọc câu tổng kết: trình đọc màn hình đọc ngay
            phán quyết, còn danh sách từng câu để người học tự đọc. Mở/đóng lời giải không chạm
            vào vùng này nên không bị đọc lại. */}
        <div role="status">
          <p className="font-medium text-content">{cauTongKetKetQua(props)}</p>
          {chuaDat && passRatio !== undefined && (
            <p className="mt-1 text-content-secondary">
              Cần đúng từ {Math.round(passRatio * 100)}% số câu trở lên.
            </p>
          )}
        </div>
      </div>

      {hang.length > 0 && (
        <>
          <ol className="mt-3 space-y-3">
            {hang.map(({ item, so, key, neo }) => {
              const moId = `${idGoc}-giai-thich-${key}`
              const mo = dangMo.has(key)
              return (
                <li
                  key={key}
                  {...(neo ? { id: `ket-qua-${neo}` } : {})}
                  className="scroll-mt-24 rounded-xl border border-line-subtle p-3"
                >
                  <p className="font-medium text-content">
                    <span
                      className={
                        item.correct === true
                          ? 'text-emerald-400 theme-light:text-emerald-800'
                          : 'text-content-muted'
                      }
                    >
                      {item.correct === true ? (
                        <Check className="inline h-4 w-4 mr-1" aria-hidden="true" />
                      ) : item.correct === null ? (
                        <Minus className="inline h-4 w-4 mr-1" aria-hidden="true" />
                      ) : (
                        <X className="inline h-4 w-4 mr-1" aria-hidden="true" />
                      )}
                    </span>
                    Câu {so}. {item.prompt}
                  </p>
                  <p className="mt-1 text-content-secondary">
                    Bạn trả lời: {item.yourAnswer.trim() === '' ? '(bỏ trống)' : item.yourAnswer} ·{' '}
                    {nhanKetQua(item)}
                  </p>

                  {(item.explain || neo) && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {item.explain && (
                        <button
                          type="button"
                          aria-expanded={mo}
                          aria-controls={moId}
                          onClick={() => batTat(key)}
                          className={`${buttonClass({ variant: 'ghost' })} tap-44 border border-line-subtle`}
                        >
                          <ChevronDown
                            className={`h-4 w-4 transition-transform motion-reduce:transition-none ${mo ? 'rotate-180' : ''}`}
                            aria-hidden="true"
                          />
                          Xem giải thích câu {so}
                        </button>
                      )}
                      {neo && (
                        <Link
                          to={{
                            pathname: location.pathname,
                            search: location.search,
                            hash: `#${neo}`,
                          }}
                          onClick={() => denCau(neo)}
                          className={`${buttonClass({ variant: 'ghost' })} tap-44 underline underline-offset-4`}
                        >
                          Xem câu {so}
                        </Link>
                      )}
                    </div>
                  )}

                  {/* Lời giải ĐÓNG bằng `hidden` (ra khỏi cây a11y, không nhận tiêu điểm) chứ
                      không gỡ khỏi DOM, để `aria-controls` luôn trỏ tới phần tử có thật. */}
                  {item.explain && (
                    <div id={moId} hidden={!mo} className="mt-2">
                      <p className="text-content-secondary">{item.explain}</p>
                    </div>
                  )}
                </li>
              )
            })}
          </ol>
          {/* Tóm tắt KHÔNG dính (sticky) để khỏi che nội dung/tiêu điểm ở màn hẹp và zoom 200%
              (§2.4) — thay vào đó có đường về tóm tắt bằng MỘT lần bấm từ cuối danh sách. */}
          <button
            type="button"
            onClick={veTomTat}
            className={`${buttonClass({ variant: 'ghost' })} tap-44 mt-3 underline underline-offset-4`}
          >
            Về tóm tắt kết quả
          </button>
        </>
      )}

      {reviewSlot}

      {(onRetry || nextHref) && (
        <div className="mt-4 flex flex-wrap gap-3">
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className={`${buttonClass({ variant: 'secondary' })} min-h-[44px]`}
            >
              Làm lại
            </button>
          )}
          {nextHref && (
            <Link to={nextHref} className={`${buttonClass({ variant: 'ghost' })} min-h-[44px]`}>
              Bài tiếp theo
            </Link>
          )}
        </div>
      )}
    </section>
  )
}
