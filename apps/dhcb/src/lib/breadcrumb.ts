// breadcrumb — sinh "đường đi" (Trang chủ › Góc học tập › Toán học) TỪ đường dẫn hiện tại.
//
// Vì sao có file này: header desktop trước đây chỉ có nút "Back" trỏ về Trang chủ. Nút đó
// trả lời được câu "đi đâu tiếp" nhưng KHÔNG trả lời được "tôi đang ở đâu" — lặn sâu vào
// một bài học rồi thì người dùng mất định vị, và bấm Back là văng thẳng về Trang chủ chứ
// không lùi đúng một bậc. Breadcrumb trả lời cả hai câu cùng lúc, ở mọi tầng.
//
// Toàn bộ logic là HÀM THUẦN (không React, không router) nên test được thẳng bằng Vitest.
// Nhãn lấy lại từ `studios.ts` + `navTree.ts` — một nguồn sự thật, sidebar và breadcrumb
// không bao giờ gọi cùng một trang bằng hai cái tên khác nhau.
import { STUDIOS } from './studios'
import { SUBJECT_CHILDREN, type NavChild } from './navTree'
import { subjectHomePath } from '@dhcb/core-learner/subjectHome'
import { underPrefix } from './navPaths'
import { legacyEnglishPath } from './legacyEnglishPath'
import { duongDanLoTrinh } from './englishRoutes'

/** Một đốt trong đường đi. `to` rỗng nghĩa là đốt cuối (trang hiện tại, không phải liên kết). */
export interface Crumb {
  label: string
  to: string
}

/** Một nút trong cây route. `parent` là TIỀN TỐ của nút cha, bỏ trống = con trực tiếp của Trang chủ. */
interface RouteNode {
  /** Tiền tố đường dẫn. So khớp theo BIÊN đoạn (`/goc-hoc-tap` không nuốt `/goc-hoc-tap-abc`). */
  path: string
  label: string
  /** Đích khi bấm vào đốt này — mặc định chính là `path`. */
  to?: string
  parent?: string
}

const HOME: Crumb = { label: 'Trang chủ', to: '/' }

/** Studio nào đó theo id — sai id là lỗi lập trình, ném ngay lúc nạp module. */
function studioPath(id: string): string {
  const st = STUDIOS.find((s) => s.id === id)
  if (!st) throw new Error(`Không tìm thấy studio "${id}" trong lib/studios.ts`)
  return st.to
}

/**
 * Trải các mục con của một nhóm thành nút route (mỗi `paths` một nút, cùng nhãn + cùng đích).
 *
 * Mục có cấp 2 (Tiếng Anh → 5 công cụ): đường dẫn nào đã thuộc một mục cấp 2 thì KHÔNG dựng nút
 * ở cấp 1 — nếu không `/lo-trinh-hoc` sẽ mang nhãn "Tiếng Anh" thay vì "Lộ trình CEFR" (nút đầu
 * tiên thắng trong BY_PATH). Cấp 2 được trải riêng, treo dưới nút đầu của mục cha.
 *
 * Cây route ở đây phân biệt trang theo ĐƯỜNG DẪN, không theo query — mục cấp 2 nào KHÔNG có
 * `path` nào khác cha (như "Lớp 10" của 4 môn STEM: cùng trang, chỉ khác `?grade=`) thì bỏ
 * qua hẳn ở tầng breadcrumb (không tạo nút riêng, không loại path khỏi cha) — nếu không sẽ tự
 * đè lên chính đường dẫn của cha, sinh nút cha trỏ vòng về chính nó.
 */
function childNodes(children: readonly NavChild[], parent: string): RouteNode[] {
  return children.flatMap((c) => {
    const nested = (c.children ?? []).filter((n) => n.paths.some((p) => !c.paths.includes(p)))
    const owned = new Set(nested.flatMap((n) => n.paths))
    const own = c.paths.filter((p) => !owned.has(p))
    const to = c.to ?? c.paths[0]
    return [
      ...own.map((p) => ({ path: p, label: c.label, to, parent })),
      ...(nested.length && to ? childNodes(nested, to) : []),
    ]
  })
}

const SUBJECTS = studioPath('subjects')
const ENGLISH_HOME = subjectHomePath('english')

/**
 * Cây route dùng cho breadcrumb.
 *
 * CỐ Ý không liệt kê hết mọi trang: đốt cuối (trang đang xem) lấy tên từ tiêu đề trang
 * truyền vào, nên ở đây chỉ cần các tầng CHA mà người dùng có thể muốn lùi về.
 */
const ROUTE_NODES: readonly RouteNode[] = [
  ...STUDIOS.map((st) => ({ path: st.to, label: st.title })),
  // [Slice 03] Trang Tiếng Anh KHÔNG lên sidebar nhưng vẫn phải có tầng cha đúng. Đặt TRƯỚC
  // childNodes(SUBJECT_CHILDREN): ENGLISH_PATHS (paths của mục "Tiếng Anh") cũng chứa hai đường
  // này, mà BY_PATH lấy nút ĐẦU TIÊN — đặt sau là chúng mang nhãn "Tiếng Anh" thay vì nhãn riêng.
  { path: '/placement', label: 'Xếp lớp', parent: duongDanLoTrinh() },
  { path: '/cai-dat', label: 'Cài đặt môn', parent: ENGLISH_HOME },
  // SUBJECT_CHILDREN đã gồm cấp 2 của Tiếng Anh (ENGLISH_CHILDREN) — không trải lại lần hai.
  ...childNodes(SUBJECT_CHILDREN, SUBJECTS),
  // [S12-1] Hub ôn tập xuyên môn: đứng NGANG các môn dưới Góc học tập (nó gộp mọi môn), nên
  // đốt cha là Góc học tập chứ không phải một môn cụ thể.
  { path: '/goc-hoc-tap/on-tap', label: 'Ôn tập', parent: SUBJECTS },
  { path: '/tien-do', label: 'Tiến độ' },
  { path: '/nang-cap', label: 'Nâng cấp' },
  { path: '/trang-ca-nhan', label: 'Hồ sơ' },
  { path: '/cai-dat', label: 'Cài đặt', parent: '/trang-ca-nhan' },
  { path: '/lich-su-hoc', label: 'Lịch sử học', parent: '/tien-do' },
  { path: '/gioi-thieu', label: 'Giới thiệu' },
  { path: '/ban-be', label: 'Bạn bè', parent: '/trang-ca-nhan' },
  { path: '/tin-nhan', label: 'Tin nhắn', parent: '/trang-ca-nhan' },
  { path: '/nhiem-vu', label: 'Nhiệm vụ', parent: '/tien-do' },

  // --- Môn Lập trình: các tầng TĨNH dưới tiền tố chuẩn ---
  // Chỉ liệt kê nhánh nào có TRANG THẬT để bấm về (xem App.tsx). Nhánh có id động
  // (`/lap-trinh/khoa-hoc/:id`, `/lap-trinh/lo-trinh/:id`, `/lap-trinh/bai-hoc/:id`) KHÔNG có
  // trang danh sách riêng, nên không đặt nút ở đây — trang tự truyền đốt cha động vào
  // `Layout crumbs` (xem tham số `extra` của `buildCrumbs` bên dưới).
  {
    path: '/goc-hoc-tap/programming/huong',
    label: 'Hướng chuyên sâu',
    parent: '/goc-hoc-tap/programming',
  },
  { path: '/goc-hoc-tap/programming/du-an', label: 'Dự án', parent: '/goc-hoc-tap/programming' },
  { path: '/goc-hoc-tap/programming/on-tap', label: 'Ôn tập', parent: '/goc-hoc-tap/programming' },
  {
    path: '/goc-hoc-tap/programming/chay-thu',
    label: 'Chạy thử',
    parent: '/goc-hoc-tap/programming',
  },
  {
    path: '/goc-hoc-tap/programming/gioi-thieu',
    label: 'Giới thiệu môn',
    parent: '/goc-hoc-tap/programming',
  },

  // --- Trụ "Ghi chú" ---
  // [2026-09-20] Các nút của trụ Sự nghiệp / Khởi nghiệp / Đời sống đã bị gỡ cùng trang của
  // chúng. Trang con `/ghi-chu/kanban` KHÔNG cần nút riêng: nó đã khớp tiền tố nút `/ghi-chu`
  // (sinh từ `STUDIOS` ở đầu danh sách này) nên đốt cha "Ghi chú" tự có — thêm nút riêng chỉ
  // làm tên trang hiện HAI lần trên breadcrumb.
  { path: '/action-canvas', label: 'Action Canvas', parent: studioPath('companion') },
  { path: '/ung-dung-thuc-te', label: 'Ứng dụng thực tế', parent: SUBJECTS },
]

/** Tra nhanh theo tiền tố. Trùng tiền tố thì mục ĐẦU TIÊN thắng (có test canh). */
const BY_PATH = new Map<string, RouteNode>()
for (const node of ROUTE_NODES) if (!BY_PATH.has(node.path)) BY_PATH.set(node.path, node)

/** Nút khớp SÂU NHẤT với đường dẫn (tiền tố dài nhất thắng). */
function deepestNode(pathname: string): RouteNode | null {
  let best: RouteNode | null = null
  for (const node of BY_PATH.values()) {
    if (!underPrefix(pathname, node.path)) continue
    if (!best || node.path.length > best.path.length) best = node
  }
  return best
}

/**
 * Đường đi tới trang hiện tại, LUÔN bắt đầu bằng "Trang chủ".
 *
 * @param pathname đường dẫn đang xem
 * @param currentLabel tiêu đề trang hiện tại (nếu có) — thành đốt CUỐI, không phải liên kết
 * @param extra đốt cha ĐỘNG do trang tự cấp (tên hướng chuyên sâu, tên lộ trình, tên bậc…),
 *   chèn SAU các tầng tĩnh. Cây route ở file này chỉ biết đường dẫn cố định, không biết
 *   `/lap-trinh/huong/web--lap-trinh-web` tên là "Lập trình Web" — chỉ trang đó mới biết.
 * @returns mảng đốt; đốt cuối có `to` rỗng. Ở Trang chủ trả về mảng RỖNG (không vẽ gì).
 */
export function buildCrumbs(
  pathname: string,
  currentLabel?: string,
  extra: readonly Crumb[] = [],
): Crumb[] {
  if (pathname === '/') return []

  // Breadcrumb có thể render trước khi React Router hoàn tất redirect legacy; chuẩn hóa
  // đường dẫn cũ để vẫn dựng đúng cây canonical trong khoảnh khắc chuyển tiếp.
  const canonicalPathname = legacyEnglishPath(pathname, '') ?? pathname

  const trail: Crumb[] = []
  // Lần ngược lên cha. `seen` chặn vòng lặp vô hạn nếu cấu hình `parent` lỡ trỏ vòng tròn.
  const seen = new Set<string>()
  const deepest = deepestNode(canonicalPathname)
  // Nút khớp SÂU NHẤT có trùng khít đường dẫn hiện tại không (không chỉ là tiền tố của một
  // trang con) — nếu có, nó đang đại diện cho CHÍNH trang đang xem (vd "Trò chuyện" đăng ký
  // đúng `/goc-hoc-tap/english/tro-truyen`), không phải một tầng cha.
  const deepestIsCurrentPage = deepest?.path === canonicalPathname
  let node = deepest
  while (node && !seen.has(node.path)) {
    seen.add(node.path)
    trail.unshift({ label: node.label, to: node.to ?? node.path })
    node = node.parent ? (BY_PATH.get(node.parent) ?? null) : null
  }
  trail.unshift(HOME)

  // Đốt cha động của trang — bỏ đốt trùng ngay trước nó (tránh "Lập trình › Lập trình").
  for (const c of extra) {
    if (trail[trail.length - 1]?.label !== c.label) trail.push(c)
  }

  // Tiêu đề trang: nút tĩnh sâu nhất VỪA LÀ chính trang này (không phải tầng cha) thì THAY
  // nhãn của nó bằng tiêu đề thật (thường đầy đủ hơn, vd "Chat với gia sư" so với "Trò
  // chuyện" ở sidebar) — cộng thêm thay vì thay thế sẽ biến nó thành một tầng cha giả, làm
  // nút Back trỏ nhầm lên nhãn cũ (bài học 2026-09-20, PR #1064). Các trang khác (nút tĩnh
  // sâu nhất chỉ là tầng cha, hoặc không có nút tĩnh nào — trang động như bài học) vẫn cộng
  // thêm như cũ.
  if (currentLabel && trail[trail.length - 1]?.label !== currentLabel) {
    // Chỉ thay khi đốt cuối vẫn ĐÚNG là nút tĩnh sâu nhất (chưa bị `extra` chèn thêm sau nó) —
    // nếu không thì đây là tầng cha động, phải cộng thêm như cũ.
    if (deepestIsCurrentPage && extra.length === 0 && trail.length > 0) {
      trail[trail.length - 1] = { ...trail[trail.length - 1]!, label: currentLabel }
    } else {
      trail.push({ label: currentLabel, to: '' })
    }
  }
  // Đốt cuối luôn là trang hiện tại → bỏ liên kết (bấm vào chính mình là vô nghĩa).
  const last = trail[trail.length - 1]
  if (last) trail[trail.length - 1] = { ...last, to: '' }
  return trail
}

/**
 * Đích MẶC ĐỊNH của nút Back ở header: đốt cha gần nhất — đúng đốt đang làm NHÃN của nút.
 *
 * Nhãn và đích phải lấy từ CÙNG một nguồn: trước 2026-10-01 nhãn lấy từ đây còn đích mặc định
 * là '/' cứng, nên trang không tự truyền đích có nút ghi "← Vật lí" mà bấm lại về Trang chủ.
 * Không có đốt cha (Trang chủ) hoặc đốt cha không có liên kết thì về '/'.
 *
 * @param ancestors kết quả `buildCrumbs(...)` đã bỏ đốt cuối (trang hiện tại)
 */
export function defaultBackDestination(ancestors: readonly Crumb[]): string {
  return ancestors[ancestors.length - 1]?.to || '/'
}
