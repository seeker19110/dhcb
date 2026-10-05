// gitSim — TERMINAL GIẢ LẬP (shell + git) cho unit P3-U10/U11 (PR-L9).
//
// VẤN ĐỀ PHẢI GIẢI: hai unit cuối bậc P3 dạy Git/GitHub và dòng lệnh, nhưng sandbox học tập
// không có git, không có hệ điều hành thật, và cổng CI cũng không được đụng vào repo thật.
// Trước đây đây là lý do U10–U11 bị hoãn ("về bản chất không chạy được trong sandbox").
//
// LỜI GIẢI: mô phỏng. Một máy ảo tí hon thuần TypeScript giữ đúng ba khái niệm lõi mà người
// mới phải hiểu — THƯ MỤC LÀM VIỆC · VÙNG CHỜ (staging) · LỊCH SỬ COMMIT — rồi diễn ra bằng
// output y như terminal thật. Học viên GÕ LỆNH THẬT chứ không phải chọn đáp án, và bài tự
// viết chấm được bằng trạng thái repo cuối cùng.
//
// GIỚI HẠN PHẢI NÓI THẲNG VỚI HỌC VIÊN (nội dung bài học có nói): đây là mô hình dạy học, KHÔNG
// phải git thật. Nó cố tình chỉ làm phần lõi: không mạng (push/pull/clone chỉ diễn tả), không
// SHA thật (mã commit sinh tuần tự để bài học tất định); rebase chỉ tuyến tính, stash và
// cherry-pick giữ subset được công bố trong bài học. Điều
// gì mô phỏng không làm được thì bài học dạy bằng cách khác chứ KHÔNG giả vờ làm được.
//
// TẤT ĐỊNH TUYỆT ĐỐI: không Date.now(), không random — cùng chuỗi lệnh luôn cho cùng output,
// nếu không thì không thể làm cổng chấm.

/** Kết quả một lượt chạy — cùng hình dạng với các prelude khác của môn. */
export interface GitRunResult {
  output: string
  error?: string
  gitState?: GitStateSnapshot
}

/** Chỉ dữ liệu sao chép, không chứa trạng thái có thể điều khiển engine. */
export interface GitStateSnapshot {
  readonly initialized: boolean
  readonly workdir: Readonly<Record<string, string>>
  readonly staged: Readonly<Record<string, string>>
  readonly headSnapshot: Readonly<Record<string, string>> | null
  readonly headMessage: string | null
  readonly commits: readonly {
    readonly message: string
    readonly snapshot: Readonly<Record<string, string>>
  }[]
}

function ownValue<T>(map: Readonly<Record<string, T>>, path: string): T | undefined {
  return Object.hasOwn(map, path) ? map[path] : undefined
}

function hasControlCharacters(value: string): boolean {
  return [...value].some((char) => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127)
}

export function isCanonicalGitPath(path: string): boolean {
  return (
    path.length > 0 &&
    path.length <= 120 &&
    !path.includes('\\') &&
    !hasControlCharacters(path) &&
    path
      .split('/')
      .every(
        (part) =>
          part.length > 0 && !['.', '..', '__proto__', 'prototype', 'constructor'].includes(part),
      )
  )
}

/** Subset công bố: basename literal, một star, hoặc thư mục literal. Không regex learner. */
export function parseGitIgnore(content: string): readonly { name: string; directory: boolean }[] {
  const patterns: { name: string; directory: boolean }[] = []
  for (const [index, raw] of content.replace(/\r\n/g, '\n').split('\n').entries()) {
    const line = raw.replace(/ +$/g, '')
    if (!line || line.startsWith('#')) continue
    const directory = line.endsWith('/')
    const name = directory ? line.slice(0, -1) : line
    if (
      !name ||
      hasControlCharacters(name) ||
      [...name].some((char) => '!?[]\\/'.includes(char)) ||
      (name.match(/\*/g)?.length ?? 0) > 1 ||
      (directory && name.includes('*'))
    ) {
      throw new Error(
        `.gitignore dong ${index + 1}: pattern "${line}" ngoai subset: basename literal, mot *, hoac thu muc literal/.`,
      )
    }
    patterns.push({ name, directory })
    if (patterns.length > 100) throw new Error('.gitignore vuot 100 pattern.')
  }
  return patterns
}

export function matchesGitIgnore(
  path: string,
  patterns: ReturnType<typeof parseGitIgnore>,
): boolean {
  if (!isCanonicalGitPath(path)) throw new Error('Duong dan Git khong canonical.')
  const parts = path.split('/')
  return patterns.some(({ name, directory }) =>
    parts.some((part, index) => {
      if (directory && index === parts.length - 1) return false
      const star = name.indexOf('*')
      return star < 0
        ? part === name
        : part.length >= name.length - 1 &&
            part.startsWith(name.slice(0, star)) &&
            part.endsWith(name.slice(star + 1))
    }),
  )
}

function ignorePatterns(repo: RepoState): ReturnType<typeof parseGitIgnore> {
  return parseGitIgnore(
    Object.hasOwn(repo.workdir, '.gitignore') ? repo.workdir['.gitignore']! : '',
  )
}

function validateRepoBudget(repo: RepoState): void {
  for (const map of [repo.branches, repo.tags, repo.remote?.nhanh ?? {}]) {
    if (Object.keys(map).some((key) => ['__proto__', 'constructor', 'prototype'].includes(key)))
      throw new LoiLenh('Ten metadata Git khong hop le.')
  }
  const maps = [
    repo.workdir,
    repo.staged,
    ...repo.commits.map((c) => c.snapshot),
    ...(repo.remote?.commits.map((c) => c.snapshot) ?? []),
    ...repo.stash.flatMap((s) => [s.workdir, s.staged]),
  ]
  for (const map of maps) {
    if (Object.keys(map).length > 100) throw new LoiLenh('Trang thai vuot 100 file.')
    for (const [path, content] of Object.entries(map)) {
      if (!isCanonicalGitPath(path)) throw new LoiLenh('Duong dan file Git khong canonical.')
      if (typeof content !== 'string') throw new LoiLenh('Noi dung file Git phai la chuoi.')
      if (content.length > 4000) throw new LoiLenh('Noi dung file vuot 4000 ky tu.')
    }
  }
  if (repo.commits.length > 100 || (repo.remote?.commits.length ?? 0) > 100)
    throw new LoiLenh('Kho vuot 100 commit.')
  if (new TextEncoder().encode(JSON.stringify(snapshot(repo))).length > 128 * 1024)
    throw new LoiLenh('Snapshot Git vuot 128 KiB.')
  if (new TextEncoder().encode(JSON.stringify(repo)).length > 128 * 1024)
    throw new LoiLenh('Trang thai Git vuot 128 KiB.')
}

function snapshot(repo: RepoState): GitStateSnapshot {
  const head = commitHienTai(repo)
  return {
    initialized: repo.khoiTao,
    workdir: { ...repo.workdir },
    staged: { ...repo.staged },
    headSnapshot: head ? { ...head.snapshot } : null,
    headMessage: head?.message ?? null,
    commits: repo.commits.map((c) => ({ message: c.message, snapshot: { ...c.snapshot } })),
  }
}

interface Commit {
  /** Mã commit giả: 'c1', 'c2'… — tất định để bài học chấm được (git thật dùng SHA-1). */
  id: string
  message: string
  /** Ảnh chụp toàn bộ file tại thời điểm commit (đường dẫn → nội dung). */
  snapshot: Record<string, string>
  parents: string[]
  branch: string
}

/**
 * Kho TỪ XA giả lập (PR khoá Git) — KHÔNG có mạng, chỉ là một object khác trong cùng bộ nhớ.
 *
 * Vì sao phải có: hai bài quan trọng nhất của phần cộng tác (`git pull` và **giải xung đột**)
 * đều cần một sự thật "người khác đã đẩy commit lên trước bạn". Không mô hình hoá được điều
 * đó thì hai bài ấy chỉ còn là lý thuyết đọc chay, không chấm được.
 */
interface RemoteState {
  url: string
  /** Nhánh trên kho từ xa → id commit mới nhất. */
  nhanh: Record<string, string | null>
  /** Commit đang nằm trên kho từ xa (có thể chưa có ở máy học viên). */
  commits: Commit[]
}

/** Một mục trong ngăn tạm `git stash`. */
interface StashEntry {
  /** 'stash@{0}' là mục MỚI NHẤT — đúng như git thật, dễ nhầm nên phải giữ đúng. */
  message: string
  workdir: Record<string, string>
  staged: Record<string, string>
}

/** Trạng thái "đang gộp dở": có xung đột chưa giải quyết, chưa tạo được commit gộp. */
interface TrangThaiGop {
  /** Tên nhánh (hoặc nhãn 'origin/x') đang được gộp vào nhánh hiện tại. */
  ten: string
  idKia: string
  /** File còn dấu xung đột, phải `git add` sau khi sửa mới commit được. */
  xungDot: string[]
}

interface RepoState {
  /** Đã `git init` chưa — mọi lệnh git khác đều đòi hỏi điều này. */
  khoiTao: boolean
  /** File trong thư mục làm việc (đường dẫn → nội dung). */
  workdir: Record<string, string>
  /** Đường dẫn đã `git add` (vùng chờ), kèm nội dung tại lúc add — đúng như git thật: add
   *  chụp NỘI DUNG chứ không đánh dấu tên file (sửa sau khi add thì phải add lại). */
  staged: Record<string, string>
  commits: Commit[]
  /** Nhánh → id commit mới nhất của nhánh đó. */
  branches: Record<string, string | null>
  nhanhHienTai: string
  demCommit: number
  /** Kho từ xa đã `git remote add` (null = chưa khai). Bài học chỉ dùng tên 'origin'. */
  remote: RemoteState | null
  /** `stash@{0}` ở đầu mảng = mục mới nhất, đúng thứ tự git thật liệt kê. */
  stash: StashEntry[]
  /** Khác null nghĩa là đang gộp dở, còn xung đột chưa giải quyết. */
  dangGop: TrangThaiGop | null
  /** Tên tag → id commit — `git tag -a` gắn nhãn cố định lên một commit. */
  tags: Record<string, string>
}

function taoRepo(): RepoState {
  return {
    khoiTao: false,
    workdir: {},
    staged: {},
    commits: [],
    branches: {},
    nhanhHienTai: 'main',
    demCommit: 0,
    remote: null,
    stash: [],
    dangGop: null,
    tags: {},
  }
}

/** Commit đang được nhánh hiện tại trỏ tới (null = nhánh chưa có commit nào). */
function commitHienTai(repo: RepoState): Commit | null {
  const id = ownValue(repo.branches, repo.nhanhHienTai) ?? null
  return id === null ? null : (repo.commits.find((c) => c.id === id) ?? null)
}

/** Ảnh chụp file của commit hiện tại — mốc để so "file nào đã đổi". */
function anhChupHienTai(repo: RepoState): Record<string, string> {
  return commitHienTai(repo)?.snapshot ?? {}
}

/** Tách dòng lệnh thành các từ, hiểu chuỗi trong nháy kép (cho `git commit -m "..."`). */
function tachTu(dong: string): string[] {
  const tu: string[] = []
  const re = /"([^"]*)"|'([^']*)'|(\S+)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(dong)) !== null) {
    tu.push(m[1] ?? m[2] ?? m[3] ?? '')
  }
  return tu
}

/** Lỗi có thông điệp dạy được (tiếng Việt, nói rõ cách sửa) thay vì thông điệp git thật khó hiểu. */
class LoiLenh extends Error {}

function doiHoiRepo(repo: RepoState): void {
  if (!repo.khoiTao) {
    throw new LoiLenh(
      'Thu muc nay chua phai kho git. Chay "git init" truoc da (git init tao thu muc .git — noi git ghi lich su).',
    )
  }
}

/** `git status` — bản rút gọn nhưng giữ đúng BA nhóm mà người mới cần phân biệt. */
function gitStatus(repo: RepoState): string {
  const dong: string[] = [`Tren nhanh ${repo.nhanhHienTai}`]
  const goc = anhChupHienTai(repo)
  const patterns = ignorePatterns(repo)

  const daChuanBi = Object.keys(repo.staged)
    .filter((p) => ownValue(repo.staged, p) !== ownValue(goc, p))
    .sort()
  // "Đã sửa nhưng chưa add": nội dung trong thư mục khác với thứ đang nằm ở vùng chờ (nếu có
  // trong vùng chờ) hoặc khác với commit gần nhất.
  const chuaChuanBi = Object.keys(repo.workdir)
    .filter((p) => {
      const mocSoSanh = Object.hasOwn(repo.staged, p) ? ownValue(repo.staged, p) : ownValue(goc, p)
      return mocSoSanh !== undefined && ownValue(repo.workdir, p) !== mocSoSanh
    })
    .sort()
  const chuaTheoDoi = Object.keys(repo.workdir)
    .filter(
      (p) =>
        !Object.hasOwn(repo.staged, p) && !Object.hasOwn(goc, p) && !matchesGitIgnore(p, patterns),
    )
    .sort()

  if (daChuanBi.length) {
    dong.push('Thay doi da chuan bi de commit:')
    for (const p of daChuanBi) dong.push(`  moi/sua: ${p}`)
  }
  if (chuaChuanBi.length) {
    dong.push('Thay doi chua chuan bi (can git add):')
    for (const p of chuaChuanBi) dong.push(`  sua: ${p}`)
  }
  if (chuaTheoDoi.length) {
    dong.push('File chua duoc theo doi (can git add):')
    for (const p of chuaTheoDoi) dong.push(`  ${p}`)
  }
  if (!daChuanBi.length && !chuaChuanBi.length && !chuaTheoDoi.length) {
    dong.push('Khong co gi de commit, thu muc lam viec sach')
  }
  return dong.join('\n')
}

function gitAdd(repo: RepoState, duongDan: string[]): string {
  doiHoiRepo(repo)
  if (duongDan.length === 0) {
    throw new LoiLenh('Thieu ten file. Vi du: "git add ghi_chu.txt" hoac "git add ." (tat ca).')
  }
  if (duongDan.some((p) => p.startsWith('-')))
    throw new LoiLenh('Mo phong chua ho tro git add -f/--force hoac flag khac.')
  const patterns = ignorePatterns(repo)
  const head = anhChupHienTai(repo)
  const ignored = (p: string) =>
    !Object.hasOwn(head, p) && !Object.hasOwn(repo.staged, p) && matchesGitIgnore(p, patterns)
  for (const p of duongDan.filter((p) => p !== '.')) {
    if (!isCanonicalGitPath(p) || !Object.hasOwn(repo.workdir, p))
      throw new LoiLenh(`Khong co file "${p}" trong thu muc.`)
    if (ignored(p))
      throw new LoiLenh(`File "${p}" bi .gitignore bo qua; mo phong khong ho tro force.`)
  }
  const canAdd = duongDan.includes('.')
    ? Object.keys(repo.workdir).filter((p) => !ignored(p))
    : duongDan
  for (const p of canAdd) repo.staged[p] = ownValue(repo.workdir, p)!
  return ''
}

function gitCommit(repo: RepoState, tu: string[]): string {
  doiHoiRepo(repo)
  const viTriM = tu.findIndex((t) => t === '-m')
  const message = viTriM === -1 ? undefined : tu[viTriM + 1]
  if (!message) {
    throw new LoiLenh(
      'Commit phai co loi nhan. Viet: git commit -m "noi ban vua lam gi" (loi nhan la thu ban doc lai sau 3 thang).',
    )
  }

  // Đang gộp dở (từ `git pull` gây xung đột thật — xem `guiGop`): commit này KẾT THÚC cuộc
  // gộp, không phải commit thường. Phải chặn nếu còn file nào chưa giải xung đột.
  if (repo.dangGop) {
    const conThieu = repo.dangGop.xungDot.filter(
      (p) => !Object.hasOwn(repo.staged, p) || ownValue(repo.staged, p)!.includes('<<<<<<<'),
    )
    if (conThieu.length) {
      throw new LoiLenh(
        `Con xung dot chua giai o: ${conThieu.join(', ')}. Sua het cac dau <<<<<<< / ======= / >>>>>>> trong file roi "git add <file>" lai truoc khi commit.`,
      )
    }
    const idNay = ownValue(repo.branches, repo.nhanhHienTai) ?? null
    const kia = repo.commits.find((c) => c.id === repo.dangGop!.idKia)!
    repo.demCommit += 1
    const commit: Commit = {
      id: `c${repo.demCommit}`,
      message,
      snapshot: { ...anhChupHienTai(repo), ...kia.snapshot, ...repo.staged },
      parents: idNay ? [idNay, kia.id] : [kia.id],
      branch: repo.nhanhHienTai,
    }
    repo.commits.push(commit)
    repo.branches[repo.nhanhHienTai] = commit.id
    repo.staged = {}
    repo.dangGop = null
    return `[${repo.nhanhHienTai} ${commit.id}] ${message}\nDa hoan tat gop (commit co hai cha: ${commit.parents.join(', ')})`
  }

  const goc = anhChupHienTai(repo)
  const coThayDoi = Object.keys(repo.staged).some(
    (p) => ownValue(repo.staged, p) !== ownValue(goc, p),
  )
  if (!coThayDoi) {
    throw new LoiLenh(
      'Khong co gi trong vung cho de commit. Dung "git add <file>" de dua thay doi vao vung cho truoc.',
    )
  }

  repo.demCommit += 1
  const cha = ownValue(repo.branches, repo.nhanhHienTai)
  const commit: Commit = {
    id: `c${repo.demCommit}`,
    message,
    snapshot: { ...goc, ...repo.staged },
    parents: cha ? [cha] : [],
    branch: repo.nhanhHienTai,
  }
  repo.commits.push(commit)
  repo.branches[repo.nhanhHienTai] = commit.id
  repo.staged = {}
  const soFile = Object.keys(commit.snapshot).length
  return `[${repo.nhanhHienTai} ${commit.id}] ${message}\n ${soFile} file trong ban chup`
}

/** Đi ngược cha để lấy lịch sử của nhánh hiện tại, mới nhất trước. */
function lichSu(repo: RepoState): Commit[] {
  const ra: Commit[] = []
  let id = ownValue(repo.branches, repo.nhanhHienTai) ?? null
  while (id) {
    const c = repo.commits.find((x) => x.id === id)
    if (!c) break
    ra.push(c)
    id = c.parents[0] ?? null
  }
  return ra
}

function gitLog(repo: RepoState, tu: string[]): string {
  doiHoiRepo(repo)
  const ds = lichSu(repo)
  if (ds.length === 0) return 'Chua co commit nao'
  if (tu.includes('--oneline')) return ds.map((c) => `${c.id} ${c.message}`).join('\n')
  return ds.map((c) => `commit ${c.id}\nNhanh: ${c.branch}\n\n    ${c.message}`).join('\n\n')
}

function validateMetadataName(name: string): void {
  if (['__proto__', 'constructor', 'prototype'].includes(name))
    throw new LoiLenh('Ten metadata Git khong hop le.')
}

function gitBranch(repo: RepoState, tu: string[]): string {
  doiHoiRepo(repo)
  const ten = tu[0]
  if (!ten) {
    // Liệt kê: nhánh hiện tại có dấu * đằng trước, đúng như git thật.
    return Object.keys(repo.branches)
      .sort()
      .map((b) => (b === repo.nhanhHienTai ? `* ${b}` : `  ${b}`))
      .join('\n')
  }
  validateMetadataName(ten)
  if (Object.hasOwn(repo.branches, ten)) throw new LoiLenh(`Nhanh "${ten}" da ton tai roi.`)
  repo.branches[ten] = ownValue(repo.branches, repo.nhanhHienTai) ?? null
  return ''
}

function chuyenNhanh(repo: RepoState, ten: string, taoMoi: boolean): string {
  doiHoiRepo(repo)
  validateMetadataName(ten)
  if (taoMoi) {
    if (Object.hasOwn(repo.branches, ten)) throw new LoiLenh(`Nhanh "${ten}" da ton tai roi.`)
    repo.branches[ten] = ownValue(repo.branches, repo.nhanhHienTai) ?? null
    repo.nhanhHienTai = ten
    return `Da chuyen sang nhanh moi "${ten}"`
  }
  if (!Object.hasOwn(repo.branches, ten)) {
    throw new LoiLenh(
      `Khong co nhanh "${ten}". Go "git branch" de xem danh sach, hoac them -b de tao nhanh moi.`,
    )
  }
  repo.nhanhHienTai = ten
  // Đổi nhánh thì thư mục làm việc trở về ảnh chụp của nhánh đó — đây chính là điều khiến
  // người mới kinh ngạc nhất ("file của tôi biến mất!"), nên mô phỏng phải làm đúng.
  repo.workdir = { ...anhChupHienTai(repo) }
  repo.staged = {}
  return `Da chuyen sang nhanh "${ten}"`
}

function gitMerge(repo: RepoState, tu: string[]): string {
  doiHoiRepo(repo)
  const ten = tu[0]
  if (!ten) throw new LoiLenh('Thieu ten nhanh. Vi du: git merge tinh-nang-moi')
  if (!Object.hasOwn(repo.branches, ten)) throw new LoiLenh(`Khong co nhanh "${ten}".`)
  if (ten === repo.nhanhHienTai) throw new LoiLenh('Khong the gop mot nhanh vao chinh no.')

  // `?? null` chứ không để nguyên: tra map bằng khoá cho ra `string | null | undefined` dưới
  // noUncheckedIndexedAccess, mà "nhánh chưa có commit" và "không có khoá" là cùng một ý.
  const idKia = ownValue(repo.branches, ten) ?? null
  const idNay = ownValue(repo.branches, repo.nhanhHienTai) ?? null
  if (!idKia) throw new LoiLenh(`Nhanh "${ten}" chua co commit nao de gop.`)

  const dsKia: string[] = []
  let duyet: string | null = idKia
  while (duyet) {
    dsKia.push(duyet)
    duyet = repo.commits.find((c) => c.id === duyet)?.parents[0] ?? null
  }
  // Nhánh hiện tại KHÔNG có commit riêng nào ngoài tổ tiên chung → tua nhanh (fast-forward):
  // git chỉ dời con trỏ nhánh, không tạo commit gộp. Người mới cần thấy sự khác biệt này.
  if (idNay === null || dsKia.includes(idNay)) {
    repo.branches[repo.nhanhHienTai] = idKia
    repo.workdir = { ...anhChupHienTai(repo) }
    return `Tua nhanh (fast-forward). Nhanh ${repo.nhanhHienTai} nay tro toi ${idKia}`
  }

  const kia = repo.commits.find((c) => c.id === idKia)!
  const nay = repo.commits.find((c) => c.id === idNay)!
  repo.demCommit += 1
  const commit: Commit = {
    id: `c${repo.demCommit}`,
    message: `Gop nhanh ${ten} vao ${repo.nhanhHienTai}`,
    // Mô phỏng chỉ gộp Ở MỨC FILE: hai nhánh sửa hai file khác nhau thì gộp gọn. Hai nhánh
    // cùng sửa MỘT file thì git thật báo xung đột — ở đây lấy bản của nhánh được gộp vào và
    // NÓI RÕ trong output, chứ không im lặng giả vờ mọi thứ ổn.
    snapshot: { ...nay.snapshot, ...kia.snapshot },
    parents: [idNay, idKia],
    branch: repo.nhanhHienTai,
  }
  repo.commits.push(commit)
  repo.branches[repo.nhanhHienTai] = commit.id
  repo.workdir = { ...commit.snapshot }

  const trung = Object.keys(kia.snapshot).filter(
    (p) =>
      ownValue(nay.snapshot, p) !== undefined &&
      ownValue(nay.snapshot, p) !== ownValue(kia.snapshot, p),
  )
  const canhBao = trung.length
    ? `\nLuu y: ca hai nhanh cung sua ${trung.join(', ')} — mo phong lay ban cua nhanh ${ten}. Git that se bao XUNG DOT va bat ban tu chon.`
    : ''
  return `Da gop nhanh ${ten} vao ${repo.nhanhHienTai} (commit gop ${commit.id})${canhBao}`
}

// ============================================================================================
// TẦNG HOÀN TÁC — diff / restore / reset / revert / reflog (khoá "Git & GitHub thực hành" C3).
// ============================================================================================

/** So hai chuỗi nhiều dòng theo TỪNG DÒNG (đơn giản, không phải thuật toán LCS như git thật —
 *  đủ dùng vì file trong bài học ngắn, và mục tiêu là dạy KHÁI NIỆM diff, không phải thuật toán). */
function dongDiff(cu: string | undefined, moi: string | undefined): string[] {
  const a = (cu ?? '').split('\n')
  const b = (moi ?? '').split('\n')
  const max = Math.max(a.length, b.length)
  const ra: string[] = []
  for (let i = 0; i < max; i++) {
    if (a[i] === b[i]) continue
    if (cu !== undefined && a[i] !== undefined) ra.push(`-${a[i]}`)
    if (moi !== undefined && b[i] !== undefined) ra.push(`+${b[i]}`)
  }
  return ra
}

function gitDiff(repo: RepoState, tu: string[]): string {
  doiHoiRepo(repo)
  const staged = tu.includes('--staged') || tu.includes('--cached')
  const goc = anhChupHienTai(repo)
  if (staged) {
    const doi = Object.keys(repo.staged)
      .filter((p) => ownValue(repo.staged, p) !== ownValue(goc, p))
      .sort()
    if (!doi.length) return ''
    return doi
      .map(
        (p) =>
          `diff --git a/${p} b/${p}\n${dongDiff(ownValue(goc, p), ownValue(repo.staged, p)).join('\n')}`,
      )
      .join('\n')
  }
  const mocSoSanh = { ...goc, ...repo.staged }
  const doi = Object.keys(repo.workdir)
    .filter((p) => ownValue(repo.workdir, p) !== ownValue(mocSoSanh, p))
    .sort()
  if (!doi.length) return ''
  return doi
    .map(
      (p) =>
        `diff --git a/${p} b/${p}\n${dongDiff(ownValue(mocSoSanh, p), ownValue(repo.workdir, p)).join('\n')}`,
    )
    .join('\n')
}

function gitRestore(repo: RepoState, tu: string[]): string {
  doiHoiRepo(repo)
  const staged = tu.includes('--staged')
  const files = tu.filter((t) => t !== '--staged')
  if (!files.length) {
    throw new LoiLenh(
      'Thieu ten file. Vi du: "git restore ten_file.txt" (bo thay doi chua add) hoac "git restore --staged ten_file.txt" (bo khoi vung cho).',
    )
  }
  const goc = anhChupHienTai(repo)
  for (const p of files) {
    if (staged) {
      if (!Object.hasOwn(repo.staged, p)) throw new LoiLenh(`File "${p}" khong o trong vung cho.`)
      delete repo.staged[p]
      continue
    }
    // KHÔNG có --staged: ghi đè thư mục làm việc bằng bản đã add (nếu có) hoặc bản commit gần
    // nhất — MẤT VĨNH VIỄN thay đổi chưa add. Bài học phải cảnh báo trước khi cho gõ lệnh này.
    const nguon = Object.hasOwn(repo.staged, p) ? ownValue(repo.staged, p) : ownValue(goc, p)
    if (nguon === undefined) throw new LoiLenh(`Khong co gi de khoi phuc cho "${p}".`)
    repo.workdir[p] = nguon
  }
  return ''
}

function gitReset(repo: RepoState, tu: string[]): string {
  doiHoiRepo(repo)
  const args = [...tu]
  let muc: 'soft' | 'mixed' | 'hard' = 'mixed'
  for (const co of ['--soft', '--mixed', '--hard'] as const) {
    const i = args.indexOf(co)
    if (i !== -1) {
      muc = co.slice(2) as 'soft' | 'mixed' | 'hard'
      args.splice(i, 1)
    }
  }
  const dich = args[0] ?? ownValue(repo.branches, repo.nhanhHienTai) ?? undefined
  if (!dich) throw new LoiLenh('Khong co commit de reset ve.')
  const target = repo.commits.find((c) => c.id === dich)
  if (!target) {
    throw new LoiLenh(`Khong co commit "${dich}". Dung "git log --oneline" de xem ma commit.`)
  }
  const truocKhiReset = anhChupHienTai(repo)
  repo.branches[repo.nhanhHienTai] = target.id
  if (muc === 'soft') {
    // Vùng chờ giữ NGUYÊN "cây" của HEAD cũ — như git thật, index không đổi khi reset --soft,
    // nên so với HEAD mới nó hiện ra là "đã chuẩn bị để commit lại".
    repo.staged = { ...truocKhiReset }
  } else {
    repo.staged = {}
  }
  if (muc === 'hard') repo.workdir = { ...target.snapshot }
  const canhBao =
    muc === 'hard'
      ? '\nCANH BAO: --hard xoa het thay doi chua commit trong thu muc lam viec — KHONG cuu duoc thu chua tung add. Commit da tao van con trong "git reflog".'
      : ''
  return `Da reset (${muc}) nhanh ${repo.nhanhHienTai} ve ${target.id}${canhBao}`
}

function gitRevert(repo: RepoState, tu: string[]): string {
  doiHoiRepo(repo)
  const id = tu[0]
  if (!id) throw new LoiLenh('Thieu ma commit. Vi du: git revert c2')
  const target = repo.commits.find((c) => c.id === id)
  if (!target) throw new LoiLenh(`Khong co commit "${id}".`)
  const chaId = target.parents[0]
  const truoc = chaId ? (repo.commits.find((c) => c.id === chaId)?.snapshot ?? {}) : {}
  // Ảnh chụp mới = ảnh hiện tại, áp lại nội dung "TRƯỚC target" cho đúng những file mà target
  // từng đổi — mô hình đơn giản (không xử lý ca revert-chồng-revert nhiều tầng).
  const hienTai = anhChupHienTai(repo)
  const snapshotMoi: Record<string, string> = { ...hienTai }
  for (const p of Object.keys(target.snapshot)) {
    if (Object.hasOwn(truoc, p)) snapshotMoi[p] = truoc[p]!
    else delete snapshotMoi[p]
  }
  repo.demCommit += 1
  const cha = ownValue(repo.branches, repo.nhanhHienTai)
  const commit: Commit = {
    id: `c${repo.demCommit}`,
    message: `Revert "${target.message}"`,
    snapshot: snapshotMoi,
    parents: cha ? [cha] : [],
    branch: repo.nhanhHienTai,
  }
  repo.commits.push(commit)
  repo.branches[repo.nhanhHienTai] = commit.id
  repo.workdir = { ...snapshotMoi }
  repo.staged = {}
  return `[${repo.nhanhHienTai} ${commit.id}] Revert "${target.message}"\nDa tao COMMIT MOI de hoan lai — lich su khong bi xoa (khac voi reset).`
}

function gitReflog(repo: RepoState): string {
  doiHoiRepo(repo)
  // Đơn giản hoá: liệt kê MỌI commit từng tạo ra, không phân biệt nhánh — đúng tinh thần
  // reflog thật ("nhật ký mọi nơi HEAD từng trỏ tới", kể cả commit đã "mất" sau reset --hard).
  if (!repo.commits.length) return 'Chua co gi trong reflog'
  const ds = [...repo.commits].reverse()
  return ds.map((c, i) => `${c.id} HEAD@{${i}}: commit: ${c.message}`).join('\n')
}

// ============================================================================================
// TẦNG KHO TỪ XA GIẢ LẬP — remote / push / fetch / pull / clone (khoá C4, KHÔNG có mạng thật).
// ============================================================================================

/** `ancestorId` có nằm trên nhánh tổ tiên của `id` không — đi ngược TẤT CẢ cha (kể cả commit gộp). */
function laToTien(commits: Commit[], id: string | null, ancestorId: string): boolean {
  const hangDoi: string[] = id ? [id] : []
  const daXet = new Set<string>()
  while (hangDoi.length) {
    const cur = hangDoi.shift()!
    if (cur === ancestorId) return true
    if (daXet.has(cur)) continue
    daXet.add(cur)
    const c = commits.find((x) => x.id === cur)
    if (c) hangDoi.push(...c.parents)
  }
  return false
}

/** Sao chép một chuỗi commit (theo cha đầu tiên) từ `nguon` sang `dich` nếu `dich` chưa có. */
function saoChepChuoi(nguon: Commit[], id: string | null, dich: Commit[]): void {
  let cur = id
  while (cur) {
    if (dich.some((c) => c.id === cur)) return // đã có — tổ tiên xa hơn coi như cũng đã có
    const c = nguon.find((x) => x.id === cur)
    if (!c) return
    dich.push(c)
    cur = c.parents[0] ?? null
  }
}

function gitRemote(repo: RepoState, tu: string[]): string {
  doiHoiRepo(repo)
  if (tu[0] === '-v') {
    if (!repo.remote) return '(chua co remote nao)'
    return `origin  ${repo.remote.url} (fetch)\norigin  ${repo.remote.url} (push)`
  }
  if (tu[0] === 'add') {
    const ten = tu[1]
    const url = tu[2]
    if (ten !== 'origin') {
      throw new LoiLenh('Mo phong chi ho tro mot remote ten "origin" (dung nhu quy uoc pho bien).')
    }
    if (!url) {
      throw new LoiLenh('Thieu URL. Vi du: git remote add origin https://github.com/ban/du-an.git')
    }
    if (repo.remote) throw new LoiLenh('remote "origin" da ton tai roi.')
    repo.remote = { url, nhanh: {}, commits: [] }
    return ''
  }
  throw new LoiLenh('Mo phong ho tro: "git remote -v" va "git remote add origin <url>".')
}

function gitPush(repo: RepoState, tu: string[]): string {
  doiHoiRepo(repo)
  if (!repo.remote) {
    throw new LoiLenh('Chua co remote. Chay "git remote add origin <url>" truoc.')
  }
  const luc = repo.remote
  const setUpstream = tu.includes('-u')
  const force = tu.includes('--force') || tu.includes('--force-with-lease')
  const args = tu.filter((t) => t !== '-u' && t !== '--force' && t !== '--force-with-lease')
  if (args.length && args[0] !== 'origin') {
    throw new LoiLenh('Mo phong chi co remote "origin". Vi du: git push -u origin main')
  }
  const nhanh = args[1] ?? repo.nhanhHienTai
  const localId = ownValue(repo.branches, nhanh) ?? null
  if (!localId) throw new LoiLenh(`Nhanh "${nhanh}" chua co commit nao de day.`)
  const remoteId = ownValue(luc.nhanh, nhanh) ?? null
  if (remoteId && remoteId !== localId && !laToTien(repo.commits, localId, remoteId) && !force) {
    throw new LoiLenh(
      `Bi tu choi: origin/${nhanh} co commit ban chua co o may. Chay "git pull" truoc, hoac "git push --force-with-lease" neu THAT SU chac chan muon ghi de (nguy hiem — co the xoa mat viec cua nguoi khac).`,
    )
  }
  saoChepChuoi(repo.commits, localId, luc.commits)
  luc.nhanh[nhanh] = localId
  const dongDau = setUpstream
    ? `Nhanh "${nhanh}" duoc thiet lap de theo doi "origin/${nhanh}".\n`
    : ''
  return `${dongDau}Da day len origin/${nhanh} (${localId})`
}

function gitFetch(repo: RepoState): string {
  doiHoiRepo(repo)
  if (!repo.remote) throw new LoiLenh('Chua co remote. Chay "git remote add origin <url>" truoc.')
  const ds = Object.entries(repo.remote.nhanh)
  if (!ds.length) return 'Da lay du lieu tu origin — hien origin chua co nhanh nao.'
  return (
    'Da lay du lieu moi tu origin.\n' +
    ds.map(([b, id]) => `  origin/${b} -> ${id ?? '(chua co commit)'}`).join('\n')
  )
}

/** Thực hiện gộp `idKia` (đã có trong `repo.commits` — sao chép từ remote trước đó) vào nhánh
 *  hiện tại. Khác với `gitMerge` (lệnh `merge` cục bộ, giữ hành vi cũ để không phá bài đã có):
 *  hàm này mô phỏng ĐÚNG quy trình git thật khi có xung đột — CHÈN DẤU XUNG ĐỘT vào file, KHÔNG
 *  tự tạo commit, bắt học viên sửa rồi tự `git add` + `git commit` mới hoàn tất. */
function guiGop(repo: RepoState, tenKia: string, idKia: string): string {
  const idNay = ownValue(repo.branches, repo.nhanhHienTai) ?? null
  if (idKia === idNay) return `Da cap nhat, khong co gi moi tu ${tenKia}.`
  if (idNay === null || laToTien(repo.commits, idKia, idNay)) {
    // Nhánh hiện tại không có gì mới so với phía kia (hoặc chưa có commit nào) → tua nhanh.
    repo.branches[repo.nhanhHienTai] = idKia
    repo.workdir = { ...anhChupHienTai(repo) }
    repo.staged = {}
    return `Tua nhanh (fast-forward) tu ${tenKia}.`
  }
  if (laToTien(repo.commits, idNay, idKia)) {
    return `Da cap nhat, khong co gi moi tu ${tenKia}.`
  }
  const kia = repo.commits.find((c) => c.id === idKia)!
  const nay = repo.commits.find((c) => c.id === idNay)!
  const trung = Object.keys(kia.snapshot).filter(
    (p) =>
      ownValue(nay.snapshot, p) !== undefined &&
      ownValue(nay.snapshot, p) !== ownValue(kia.snapshot, p),
  )
  if (!trung.length) {
    // Không file nào trùng — gộp sạch, tạo luôn commit gộp (không cần học viên can thiệp).
    repo.demCommit += 1
    const commit: Commit = {
      id: `c${repo.demCommit}`,
      message: `Gop ${tenKia} vao ${repo.nhanhHienTai}`,
      snapshot: { ...nay.snapshot, ...kia.snapshot },
      parents: [idNay, idKia],
      branch: repo.nhanhHienTai,
    }
    repo.commits.push(commit)
    repo.branches[repo.nhanhHienTai] = commit.id
    repo.workdir = { ...commit.snapshot }
    repo.staged = {}
    return `Da gop ${tenKia} vao ${repo.nhanhHienTai} (commit gop ${commit.id})`
  }
  // XUNG ĐỘT THẬT: chèn dấu vào các file cả hai bên cùng sửa, dừng lại chờ học viên xử lý.
  for (const p of trung) {
    repo.workdir[p] =
      `<<<<<<< HEAD\n${ownValue(nay.snapshot, p)}\n=======\n${ownValue(kia.snapshot, p)}\n>>>>>>> ${tenKia}\n`
  }
  for (const p of Object.keys(kia.snapshot)) {
    if (!trung.includes(p) && ownValue(kia.snapshot, p) !== ownValue(nay.snapshot, p))
      repo.workdir[p] = ownValue(kia.snapshot, p)!
  }
  repo.staged = {}
  repo.dangGop = { ten: tenKia, idKia, xungDot: trung }
  return (
    `TU DONG GOP THAT BAI; sua XUNG DOT o cac file:\n` +
    trung.map((p) => `  ca hai cung sua: ${p}`).join('\n') +
    `\nMo file, chon lai noi dung dung (xoa het dau <<<<<<< / ======= / >>>>>>>), roi "git add <file>". Xong ca thi "git commit -m ..." de hoan tat gop.`
  )
}

function gitPull(repo: RepoState): string {
  doiHoiRepo(repo)
  if (repo.dangGop) {
    throw new LoiLenh(
      'Dang gop dang do (con xung dot chua giai). Giai xong roi commit truoc khi pull tiep.',
    )
  }
  if (!repo.remote) throw new LoiLenh('Chua co remote. Chay "git remote add origin <url>" truoc.')
  const nhanh = repo.nhanhHienTai
  const remoteId = ownValue(repo.remote.nhanh, nhanh) ?? null
  if (!remoteId) return `Khong co gi moi tu origin/${nhanh}.`
  saoChepChuoi(repo.remote.commits, remoteId, repo.commits)
  return guiGop(repo, `origin/${nhanh}`, remoteId)
}

function gitClone(repo: RepoState, tu: string[]): string {
  if (repo.khoiTao) throw new LoiLenh('Thu muc nay da la kho git roi, khong the clone de len.')
  const url = tu[0]
  if (!url) throw new LoiLenh('Thieu URL. Vi du: git clone https://github.com/ban/du-an.git')
  if (!repo.remote || repo.remote.url !== url) {
    throw new LoiLenh(
      '(Loi rieng cua bai hoc, khong phai git that): mo phong chi "clone" duoc kho da duoc dung san lam boi canh cua bai.',
    )
  }
  repo.khoiTao = true
  const nhanhChinh = 'main'
  const id = ownValue(repo.remote.nhanh, nhanhChinh) ?? null
  repo.branches[nhanhChinh] = id
  repo.nhanhHienTai = nhanhChinh
  if (id) {
    saoChepChuoi(repo.remote.commits, id, repo.commits)
    repo.workdir = { ...anhChupHienTai(repo) }
  }
  return `Da clone tu ${url} ve thu muc hien tai.`
}

// ============================================================================================
// TẦNG NÂNG CAO — stash / tag / cherry-pick / rebase tuyến tính (khoá C5).
// ============================================================================================

function gitStash(repo: RepoState, tu: string[]): string {
  doiHoiRepo(repo)
  const sub = tu[0] ?? 'push'
  if (sub === 'push') {
    const goc = anhChupHienTai(repo)
    const coGiDoi =
      Object.keys(repo.workdir).some((p) => {
        const moc = Object.hasOwn(repo.staged, p) ? ownValue(repo.staged, p) : ownValue(goc, p)
        return moc === undefined || ownValue(repo.workdir, p) !== moc
      }) || Object.keys(repo.staged).some((p) => ownValue(repo.staged, p) !== ownValue(goc, p))
    if (!coGiDoi) throw new LoiLenh('Khong co gi de stash — thu muc lam viec dang sach.')
    const viTriM = tu.findIndex((t) => t === '-m')
    const msg = viTriM === -1 ? `WIP tren ${repo.nhanhHienTai}` : (tu[viTriM + 1] ?? 'WIP')
    repo.stash.unshift({ message: msg, workdir: { ...repo.workdir }, staged: { ...repo.staged } })
    // "Dọn bàn": đưa thư mục làm việc + vùng chờ về đúng commit gần nhất để chuyển việc khác.
    repo.workdir = { ...goc }
    repo.staged = {}
    return `Da cat (stash) thay doi: ${msg}`
  }
  if (sub === 'list') {
    if (!repo.stash.length) return '(khong co stash nao)'
    return repo.stash.map((s, i) => `stash@{${i}}: ${s.message}`).join('\n')
  }
  if (sub === 'pop' || sub === 'apply') {
    const entry = repo.stash[0]
    if (!entry) throw new LoiLenh('Khong co stash nao de lay lai.')
    repo.workdir = { ...repo.workdir, ...entry.workdir }
    repo.staged = { ...repo.staged, ...entry.staged }
    if (sub === 'pop') repo.stash.shift()
    return sub === 'pop'
      ? 'Da lay lai va XOA khoi ngan stash.'
      : 'Da ap dung, VAN GIU trong ngan stash (dung "git stash drop" de xoa).'
  }
  if (sub === 'drop') {
    if (!repo.stash.length) throw new LoiLenh('Khong co stash nao de xoa.')
    repo.stash.shift()
    return 'Da xoa stash@{0}.'
  }
  throw new LoiLenh('Mo phong ho tro: git stash [push [-m "..."]], list, pop, apply, drop.')
}

function gitTag(repo: RepoState, tu: string[]): string {
  doiHoiRepo(repo)
  if (!tu.length) {
    const ds = Object.keys(repo.tags).sort()
    return ds.length ? ds.join('\n') : '(chua co tag nao)'
  }
  if (tu[0] !== '-a') {
    throw new LoiLenh('Mo phong chi ho tro: git tag -a <ten> -m "<loi nhan>" (tag co chu thich).')
  }
  const ten = tu[1]
  if (!ten) throw new LoiLenh('Thieu ten tag. Vi du: git tag -a v1.0 -m "Ban phat hanh dau tien"')
  validateMetadataName(ten)
  if (Object.hasOwn(repo.tags, ten)) throw new LoiLenh(`Tag "${ten}" da ton tai.`)
  const id = ownValue(repo.branches, repo.nhanhHienTai)
  if (!id) throw new LoiLenh('Chua co commit nao de gan tag.')
  repo.tags[ten] = id
  return `Da tao tag "${ten}" tro toi ${id}`
}

function gitCherryPick(repo: RepoState, tu: string[]): string {
  doiHoiRepo(repo)
  const id = tu[0]
  if (!id) throw new LoiLenh('Thieu ma commit. Vi du: git cherry-pick c3')
  const target = repo.commits.find((c) => c.id === id)
  if (!target) throw new LoiLenh(`Khong co commit "${id}". Dung "git log --oneline" de xem ma.`)
  const goc = anhChupHienTai(repo)
  repo.demCommit += 1
  const cha = ownValue(repo.branches, repo.nhanhHienTai)
  const commit: Commit = {
    id: `c${repo.demCommit}`,
    message: target.message,
    // Đơn giản hoá: lấy nguyên trạng thái file của commit kia (không tính diff-3-phía như git
    // thật) — đủ để dạy Ý NGHĨA "mang một commit cụ thể sang nhánh khác", tạo ra MÃ COMMIT MỚI.
    snapshot: { ...goc, ...target.snapshot },
    parents: cha ? [cha] : [],
    branch: repo.nhanhHienTai,
  }
  repo.commits.push(commit)
  repo.branches[repo.nhanhHienTai] = commit.id
  repo.workdir = { ...commit.snapshot }
  repo.staged = {}
  return `[${repo.nhanhHienTai} ${commit.id}] ${target.message}\n(cherry-pick tu ${id} — tao commit MOI, khac ma voi ban goc)`
}

function gitRebase(repo: RepoState, tu: string[]): string {
  doiHoiRepo(repo)
  if (tu.includes('-i')) {
    throw new LoiLenh('Mo phong khong lam rebase tuong tac (-i) — nam ngoai bai hoc nay.')
  }
  const ten = tu[0]
  if (!ten) throw new LoiLenh('Thieu ten nhanh. Vi du: git rebase main')
  if (!Object.hasOwn(repo.branches, ten)) throw new LoiLenh(`Khong co nhanh "${ten}".`)
  const idDich = ownValue(repo.branches, ten) ?? null
  const idNay = ownValue(repo.branches, repo.nhanhHienTai) ?? null
  if (idNay === null) throw new LoiLenh('Nhanh hien tai chua co commit nao de rebase.')

  // Chỉ chấp nhận ca TUYẾN TÍNH: đi ngược nhánh hiện tại tới khi gặp TỔ TIÊN CHUNG với nhánh
  // đích (không nhất thiết là chính idDich — main có thể đã đi xa hơn từ tổ tiên đó, đúng ca
  // "rebase để bắt kịp main" thường gặp). Không tìm được tổ tiên chung → không mô phỏng nổi.
  const chuoiNay: Commit[] = []
  let cur: string | null = idNay
  while (cur !== null && !laToTien(repo.commits, idDich, cur)) {
    const c = repo.commits.find((x) => x.id === cur)
    if (!c) break
    chuoiNay.unshift(c)
    cur = c.parents[0] ?? null
  }
  if (cur === null && idDich !== null) {
    throw new LoiLenh(
      'Mo phong chi rebase duoc truong hop TUYEN TINH (hai nhanh co to tien chung). Rebase phuc tap hon nam ngoai bai hoc nay.',
    )
  }

  let chaMoi: string | null = idDich
  for (const c of chuoiNay) {
    repo.demCommit += 1
    const idMoi = `c${repo.demCommit}`
    const commitMoi: Commit = {
      id: idMoi,
      message: c.message,
      snapshot: c.snapshot,
      parents: chaMoi ? [chaMoi] : [],
      branch: repo.nhanhHienTai,
    }
    repo.commits.push(commitMoi)
    chaMoi = idMoi
  }
  repo.branches[repo.nhanhHienTai] = chaMoi
  repo.workdir = { ...anhChupHienTai(repo) }
  repo.staged = {}
  return `Da rebase ${chuoiNay.length} commit len tren "${ten}". Luu y: rebase TAO COMMIT MOI (ma commit doi) — dung push --force-with-lease neu nhanh nay da len GitHub va co nguoi khac dang dung chung.`
}

/** Lệnh git chưa mô phỏng — nói thẳng là mô hình không làm, kèm điều học viên cần biết. */
const GIT_CHUA_MO_PHONG: Record<string, string> = {
  worktree: 'Mo phong nay khong lam "git worktree" — nam ngoai bai hoc nay.',
  submodule: 'Mo phong nay khong lam "git submodule" — nam ngoai bai hoc nay.',
  lfs: 'Mo phong nay khong lam "git lfs" — nam ngoai bai hoc nay.',
  mergetool: 'Mo phong nay khong lam "git mergetool" — sua xung dot bang cach mo file va sua tay.',
  archive: 'Mo phong nay khong lam "git archive" — nam ngoai bai hoc nay.',
  fsck: 'Mo phong nay khong lam "git fsck" — nam ngoai bai hoc nay.',
  bisect:
    'Mo phong nay khong CHAY duoc "git bisect" — bai hoc chi ke lai cach dung no (Predict), khong co ca chay that.',
}

function chayGit(repo: RepoState, tu: string[]): string {
  const lenh = tu[0]
  if (!lenh) throw new LoiLenh('Thieu lenh git. Vi du: git status')
  if (Object.hasOwn(GIT_CHUA_MO_PHONG, lenh)) throw new LoiLenh(GIT_CHUA_MO_PHONG[lenh]!)

  const conLai = tu.slice(1)
  if (lenh === 'init') {
    if (repo.khoiTao) return 'Thu muc nay da la kho git roi'
    repo.khoiTao = true
    repo.branches[repo.nhanhHienTai] = null
    return `Da khoi tao kho git rong, nhanh mac dinh "${repo.nhanhHienTai}"`
  }
  if (lenh === 'status') {
    doiHoiRepo(repo)
    return gitStatus(repo)
  }
  if (lenh === 'add') return gitAdd(repo, conLai)
  if (lenh === 'commit') return gitCommit(repo, conLai)
  if (lenh === 'log') return gitLog(repo, conLai)
  if (lenh === 'branch') return gitBranch(repo, conLai)
  if (lenh === 'merge') return gitMerge(repo, conLai)
  if (lenh === 'checkout' || lenh === 'switch') {
    doiHoiRepo(repo)
    const taoMoi = conLai[0] === '-b' || conLai[0] === '-c'
    const ten = taoMoi ? conLai[1] : conLai[0]
    if (!ten) throw new LoiLenh('Thieu ten nhanh. Vi du: git switch -c tinh-nang-moi')
    return chuyenNhanh(repo, ten, taoMoi)
  }
  if (lenh === 'diff') return gitDiff(repo, conLai)
  if (lenh === 'restore') return gitRestore(repo, conLai)
  if (lenh === 'reset') return gitReset(repo, conLai)
  if (lenh === 'revert') return gitRevert(repo, conLai)
  if (lenh === 'reflog') return gitReflog(repo)
  if (lenh === 'remote') return gitRemote(repo, conLai)
  if (lenh === 'push') return gitPush(repo, conLai)
  if (lenh === 'fetch') return gitFetch(repo)
  if (lenh === 'pull') return gitPull(repo)
  if (lenh === 'clone') return gitClone(repo, conLai)
  if (lenh === 'stash') return gitStash(repo, conLai)
  if (lenh === 'tag') return gitTag(repo, conLai)
  if (lenh === 'cherry-pick') return gitCherryPick(repo, conLai)
  if (lenh === 'rebase') return gitRebase(repo, conLai)
  throw new LoiLenh(
    `Mo phong chua ho tro "git ${lenh}". Cac lenh dung duoc: init, status, add, commit, log, branch, switch/checkout, merge, diff, restore, reset, revert, reflog, remote, push, fetch, pull, clone, stash, tag, cherry-pick, rebase.`,
  )
}

/** Lệnh shell tối giản — đủ để dạy U11 (đi lại, xem, tạo file) mà không cần hệ điều hành thật. */
function chayShell(repo: RepoState, tu: string[], dongGoc: string): string {
  const lenh = tu[0]!
  const conLai = tu.slice(1)

  if (lenh === 'pwd') return '/home/ban/du-an'
  if (lenh === 'ls') {
    const ds = Object.keys(repo.workdir).sort()
    return ds.length ? ds.join('\n') : '(thu muc rong)'
  }
  if (lenh === 'cat') {
    const p = conLai[0]
    if (!p) throw new LoiLenh('Thieu ten file. Vi du: cat ghi_chu.txt')
    const noiDung = Object.hasOwn(repo.workdir, p) ? ownValue(repo.workdir, p) : undefined
    if (noiDung === undefined) throw new LoiLenh(`Khong co file "${p}".`)
    return noiDung
  }
  if (lenh === 'rm') {
    const p = conLai[0]
    if (!p) throw new LoiLenh('Thieu ten file. Vi du: rm ghi_chu.txt')
    if (!Object.hasOwn(repo.workdir, p)) throw new LoiLenh(`Khong co file "${p}".`)
    delete repo.workdir[p]
    return ''
  }
  if (lenh === 'echo') {
    // Chỉ hiểu dạng: echo "noi dung" > file  (và >> để nối thêm) — đủ để tạo/sửa file trong bài.
    const chuyenHuong = dongGoc.includes('>>') ? '>>' : dongGoc.includes('>') ? '>' : ''
    if (!chuyenHuong) return conLai.join(' ')
    const [phanChu, phanFile] = dongGoc.split(chuyenHuong)
    const chu = tachTu((phanChu ?? '').replace(/^\s*echo\s*/, '')).join(' ')
    const file = tachTu(phanFile ?? '')[0]
    if (!file) throw new LoiLenh('Thieu ten file sau dau ">". Vi du: echo "xin chao" > ghi_chu.txt')
    if (!isCanonicalGitPath(file)) throw new LoiLenh('Duong dan file Git khong canonical.')
    repo.workdir[file] =
      chuyenHuong === '>>' ? `${ownValue(repo.workdir, file) ?? ''}${chu}\n` : `${chu}\n`
    return ''
  }
  if (lenh === 'remote-seed') {
    // KHÔNG phải lệnh git thật — chỉ để lesson author DỰNG BỐI CẢNH "co nguoi khac da push
    // truoc" trong boi canh an (lenhChuanBi), phục vụ bài `pull`/xung đột. Cú pháp:
    //   remote-seed <nhánh> "<lời nhắn>" <tên_file> "<nội dung>"
    // Tự tạo remote (URL giả) nếu chưa có, nối tiếp lên đúng tip hiện tại của nhánh đó trên
    // remote — mô phỏng "ai đó push thêm SAU khi bạn đã push lần đầu, hoặc trước khi bạn clone".
    const [nhanh, msg, file, noiDung] = conLai
    if (!nhanh || !msg || !file || noiDung === undefined) {
      throw new LoiLenh(
        'remote-seed can 4 tham so: nhanh, loi nhan (nhay kep), ten file, noi dung (nhay kep).',
      )
    }
    if (!isCanonicalGitPath(file) || ['__proto__', 'constructor', 'prototype'].includes(nhanh))
      throw new LoiLenh('Duong dan/nhanh Git khong canonical.')
    if (!repo.remote)
      repo.remote = { url: 'https://mo-phong.local/kho.git', nhanh: {}, commits: [] }
    const chaId = ownValue(repo.remote.nhanh, nhanh) ?? null
    const cha = chaId ? repo.remote.commits.find((c) => c.id === chaId) : undefined
    const idMoi = `r${repo.remote.commits.length + 1}`
    repo.remote.commits.push({
      id: idMoi,
      message: msg,
      snapshot: { ...(cha?.snapshot ?? {}), [file]: noiDung },
      parents: chaId ? [chaId] : [],
      branch: nhanh,
    })
    repo.remote.nhanh[nhanh] = idMoi
    return ''
  }
  if (lenh === 'mkdir' || lenh === 'cd') {
    // Mô phỏng phẳng một thư mục: nhận lệnh để học viên gõ quen tay, nhưng KHÔNG giả vờ có
    // cây thư mục thật (nói rõ còn hơn im lặng làm sai).
    return `(mo phong: khong tao cay thu muc that, moi file nam chung mot thu muc)`
  }
  throw new LoiLenh(
    `Mo phong chua ho tro lenh "${lenh}". Cac lenh dung duoc: pwd, ls, cat, echo, rm, git.`,
  )
}

/**
 * Chạy một loạt lệnh (mỗi dòng một lệnh) trên MỘT kho mới tinh, trả về output như terminal.
 *
 * Định dạng output: mỗi lệnh in ra dòng nhắc `$ <lệnh>` rồi tới kết quả — giống hệt thứ học
 * viên thấy khi xem người khác thao tác, nên đọc lại bài chấm là hiểu ngay chuyện gì xảy ra.
 * Lệnh lỗi in `loi: <thông điệp>` và DỪNG (như thật: gõ sai thì các lệnh sau vô nghĩa).
 */
export function chayLenh(script: string, lenhChuanBi: string[] = []): GitRunResult {
  const repo = taoRepo()
  const result = (output: string, error?: string): GitRunResult => ({
    output,
    ...(error ? { error } : {}),
    gitState: snapshot(repo),
  })
  if (
    script.length > 4000 ||
    lenhChuanBi.length > 20 ||
    lenhChuanBi.join('\n').length > 4000 ||
    script.split('\n').filter((s) => s.trim() && !s.trim().startsWith('#')).length > 100
  )
    return result(
      '',
      'Script/boi canh vuot gioi han 4000 ky tu, 100 lenh hoc vien hoac 20 lenh chuan bi.',
    )
  const dong: string[] = []

  // `lenhChuanBi` dựng sẵn bối cảnh (vd repo đã có sẵn vài commit) mà KHÔNG in ra — nhờ vậy
  // đề bài nói "kho của bạn đang có…" mà học viên không phải gõ lại phần dựng cảnh.
  for (const lenh of lenhChuanBi) {
    const r = chayMotDong(repo, lenh)
    if (r.loi) return result('', `Loi khi dung boi canh: ${r.loi}`)
  }

  for (const raw of script.split('\n')) {
    const lenh = raw.trim()
    if (!lenh || lenh.startsWith('#')) continue
    dong.push(`$ ${lenh}`)
    const r = chayMotDong(repo, lenh)
    if (r.loi) {
      dong.push(`loi: ${r.loi}`)
      return result(dong.join('\n'), r.loi)
    }
    if (r.ra) dong.push(r.ra)
  }
  return result(dong.join('\n'))
}

function chayMotDong(repo: RepoState, lenh: string): { ra: string; loi?: string } {
  try {
    const tu = tachTu(lenh)
    if (tu.length === 0) return { ra: '' }
    const candidate: RepoState = structuredClone(repo)
    const ra = tu[0] === 'git' ? chayGit(candidate, tu.slice(1)) : chayShell(candidate, tu, lenh)
    validateRepoBudget(candidate)
    Object.assign(repo, candidate)
    return { ra }
  } catch (err) {
    return { ra: '', loi: err instanceof Error ? err.message : String(err) }
  }
}
