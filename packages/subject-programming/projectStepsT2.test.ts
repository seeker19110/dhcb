// CỔNG NỘI DUNG riêng của DỰ ÁN TRỤC T2 "Quỹ lớp / Chi tiêu nhà mình".
//
// Ba lớp kiểm, bổ sung cho hai cổng chung đã tự quét T2:
//  - projectTracks.test.ts  → khuôn/hợp đồng (mã bước, unit cùng bậc, files, milestone).
//  - lessonsPython.test.ts  → code tham chiếu bước Python/pytest/apisim đạt hết check.
// File này thêm:
//  1. Bất biến từng chặng (số bước, mã tuần tự, mỗi bước có ca hiện để học viên đối chiếu).
//  2. KIỂM SỐ HỌC ĐỘC LẬP: tính lại `expected` bằng TypeScript từ luật đề — bắt lỗi tính tay
//     khi soạn (bài học PR-L3: 150 kWh ghi nhầm 305.850).
//  3. CHỐNG TEST DỄ DÃI: sửa code tham chiếu thành một lỗi người mới hay mắc thì PHẢI rớt.
//  4. Bước web (html/dom/sql/fetch) chấm bằng ĐÚNG engine thật — xem phần chặng P3.
import { describe, expect, it } from 'vitest'
import { Window } from 'happy-dom'
import initSqlJs from 'sql.js'
import { createRequire } from 'node:module'
import { execFileSync, spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { ProjectStepSchema, getProjectStages, getStepLanguage } from './projectSteps.js'
import { T2_P1_PROJECT_STEPS, T2_P2_PROJECT_STEPS, T2_PROJECT_STAGES } from './projectStepsT2.js'
import { T2_P3_PROJECT_STEPS, T2_SQL_SO_QUY } from './projectStepsT2P3.js'
import { T2_P4_PROJECT_STEPS } from './projectStepsT2P4.js'
import { getProjectTrack } from './projectTracks.js'
import { moTaCayDom, type ElementLike } from './htmlPrelude.js'
import { chayBaiDom } from './domPrelude.js'
import { chayBaiFetch, FETCH_SHIM_QUY_LOP_JS } from './fetchPrelude.js'
import { chayBaiFetchServer } from './domFetchServerPrelude.js'
import { SQL_SEED } from './sqlDataset.js'
import { formatSqlResults, type SqlResultTable } from './sqlPrelude.js'
import { SO_QUY_LOP } from './fundData.js'
import { PROGRAMMING_LEVELS } from './curriculum.js'
import { fileCuaLan, laLanPython, noiCodeTheoLan, type PythonLane } from './pyLanes.js'
import { allTestsPassed, gradeTestCase, type TestCaseResult } from './grading.js'
import type { ProjectStep } from './projectStepTypes.js'

const hasPython = spawnSync('python3', ['--version']).status === 0

function unitCuaBac(level: string): Set<string> {
  return new Set(PROGRAMMING_LEVELS.find((l) => l.id === level)!.units.map((u) => u.id))
}

/** Lấy bước theo mã — ném lỗi rõ ràng nếu mã sai (thay cho `!` rải rác). */
function buoc(steps: ProjectStep[], id: string): ProjectStep {
  const s = steps.find((x) => x.id === id)
  if (!s) throw new Error(`Không có bước ${id}`)
  return s
}

// ── Bộ chạy Python cho phần "chống test dễ dãi" ──────────────────────────────────────────
// Cùng prelude input() với lessonsPython.test.ts (đọc tuần tự + ECHO "prompt + giá trị", khớp
// sandbox trình duyệt). Mỗi lượt chấm một thư mục tạm riêng: bước P2 ghi file CSV thật.
function wrap(code: string, stdinLines: string[]): string {
  return `import builtins, json
_it = iter(json.loads(${JSON.stringify(JSON.stringify(stdinLines))}))
def _input(prompt=""):
    try:
        value = next(_it)
    except StopIteration:
        raise EOFError("het du lieu nhap")
    print(f"{prompt}{value}")
    return value
builtins.input = _input

${code}
`
}

function chayPython(code: string, stdinLines: string[], cwd: string) {
  try {
    const output = execFileSync('python3', ['-c', wrap(code, stdinLines)], {
      encoding: 'utf8',
      timeout: 15_000,
      cwd,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, PYTHONIOENCODING: 'utf-8', PYTHONUTF8: '1' },
    })
    return { output }
  } catch (err) {
    const e = err as { stdout?: string; stderr?: string; message?: string }
    return { output: e.stdout ?? '', error: (e.stderr || e.message || 'lỗi python3').trim() }
  }
}

/** Chấm một bước Python (mọi làn) với code CHÍNH thay thế; file phụ lấy từ referenceFiles
 *  trừ khi truyền `filesThay`. Chạy cộng dồn trong MỘT thư mục — đúng như học viên bấm chấm. */
function chamPython(
  step: ProjectStep,
  code: string,
  filesThay: Record<string, string> = {},
  checks: ProjectStep['checks'] = step.checks,
  dungProbe = true,
): TestCaseResult[] {
  const lane = getStepLanguage(step) as PythonLane
  const dir = mkdtempSync(join(tmpdir(), `dhcb-t2-${step.id}-`))
  for (const [name, content] of Object.entries(fileCuaLan(lane))) {
    mkdirSync(dirname(join(dir, name)), { recursive: true })
    writeFileSync(join(dir, name), content, 'utf8')
  }
  for (const [path, content] of Object.entries({ ...step.referenceFiles, ...filesThay })) {
    writeFileSync(join(dir, path), content, 'utf8')
  }
  writeFileSync(join(dir, step.files![0]!), code, 'utf8')
  const entry = noiCodeTheoLan(lane, (dungProbe ? step.probeCode : undefined) ?? code)
  return checks.map((c) => {
    const r = chayPython(entry, c.stdinLines, dir)
    return gradeTestCase(c, r.output, r.error)
  })
}

/** Sửa code tham chiếu — ném lỗi nếu đoạn cần thay không còn (test đột biến hết tác dụng). */
function dotBien(code: string, tu: string, thanh: string): string {
  if (!code.includes(tu)) throw new Error(`Đột biến hỏng: không thấy "${tu}"`)
  return code.replace(tu, thanh)
}

// ── Bất biến chung cả dự án ──────────────────────────────────────────────────────────────
describe('T2 — bất biến dữ liệu', () => {
  it('bảng chặng T2 là đúng bảng getProjectStages("T2") (chặn quên đăng ký)', () => {
    expect(getProjectStages('T2')).toBe(T2_PROJECT_STAGES)
  })

  it.each(T2_PROJECT_STAGES.filter((s) => s.steps.length > 0).map((s) => [s.level, s] as const))(
    'chặng %s: schema hợp lệ, mã tuần tự, unit cùng bậc có thật, có ca hiện, có ca ẩn',
    (level, stage) => {
      const units = unitCuaBac(level)
      stage.steps.forEach((step, i) => {
        expect(step.id).toBe(`t2-${level}-s${i + 1}`)
        expect(ProjectStepSchema.safeParse(step).success, `${step.id} sai khuôn`).toBe(true)
        expect(units.has(step.unitId), `${step.id} trỏ unit không có thật`).toBe(true)
        expect(
          step.checks.some((c) => !c.hidden),
          `${step.id} thiếu ca hiện`,
        ).toBe(true)
        expect(
          step.checks.some((c) => c.hidden),
          `${step.id} thiếu ca ẩn chống gõ cứng`,
        ).toBe(true)
      })
    },
  )

  it('mọi bước Python của T2 chạy file của T2, không bao giờ rơi về cua_hang.py của T1', () => {
    for (const stage of T2_PROJECT_STAGES) {
      for (const step of stage.steps) {
        expect(step.files?.includes('cua_hang.py'), step.id).toBe(false)
      }
    }
  })
})

// ── Chặng P1 ─────────────────────────────────────────────────────────────────────────────
const MUC_DONG = 50_000
const tinhTrang = (soDu: number) =>
  soDu >= 500_000 ? 'du dung' : soDu >= 100_000 ? 'sap het' : 'bao dong'

/** Mô phỏng TS độc lập của sổ quỹ chặng P1 (bước 4–5) để đối chiếu expected. */
function soQuyP1(stdin: string[]) {
  const siSo = Number(stdin[1])
  const daThu = Number(stdin[2]) * MUC_DONG
  const soKhoan = Number(stdin[3])
  let soDu = daThu
  let tongChi = 0
  for (let k = 0; k < soKhoan; k++) {
    const tien = Number(stdin[5 + 2 * k])
    if (tien <= soDu) {
      soDu -= tien
      tongChi += tien
    }
  }
  const moiBan = Math.ceil((500_000 - soDu) / (siSo * 1000)) * 1000
  return { soDu, tongChi, moiBan }
}

describe('T2 chặng P1 — Sổ thu chi chạy chữ', () => {
  it('đủ 5 bước, chỉ bước cuối là milestone, cùng một file quy_lop.py', () => {
    expect(T2_P1_PROJECT_STEPS.map((s) => s.id)).toEqual([
      't2-p1-s1',
      't2-p1-s2',
      't2-p1-s3',
      't2-p1-s4',
      't2-p1-s5',
    ])
    for (const s of T2_P1_PROJECT_STEPS) expect(s.files).toEqual(['quy_lop.py'])
  })

  it('số học các ca chấm khớp luật đề (mức đóng, tỉ lệ, bậc tình trạng, đóng bù)', () => {
    for (const c of buoc(T2_P1_PROJECT_STEPS, 't2-p1-s1').checks) {
      if (c.expected.startsWith('Can thu')) {
        expect(c.expected).toBe(`Can thu: ${Number(c.stdinLines[1]) * MUC_DONG}`)
      }
    }
    for (const c of buoc(T2_P1_PROJECT_STEPS, 't2-p1-s2').checks) {
      const [, siSo, daDong] = c.stdinLines.map(Number)
      if (c.expected.startsWith('Ti le')) {
        expect(c.expected).toBe(`Ti le da dong: ${Math.round((daDong! / siSo!) * 100)}%`)
      }
      if (c.expected.startsWith('Con thieu')) {
        expect(c.expected).toBe(`Con thieu: ${(siSo! - daDong!) * MUC_DONG}`)
      }
    }
    for (const c of buoc(T2_P1_PROJECT_STEPS, 't2-p1-s3').checks) {
      const daThu = Number(c.stdinLines[2]) * MUC_DONG
      const tien = Number(c.stdinLines[4])
      const soDu = tien <= daThu ? daThu - tien : daThu
      if (c.expected.startsWith('So du')) expect(c.expected).toBe(`So du: ${soDu}`)
      if (c.expected.startsWith('Tinh trang')) {
        expect(c.expected).toBe(`Tinh trang quy: ${tinhTrang(soDu)}`)
      }
    }
    for (const id of ['t2-p1-s4', 't2-p1-s5']) {
      for (const c of buoc(T2_P1_PROJECT_STEPS, id).checks) {
        const { soDu, tongChi, moiBan } = soQuyP1(c.stdinLines)
        if (c.expected.startsWith('So du')) expect(c.expected).toBe(`So du: ${soDu}`)
        if (c.expected.startsWith('Tong chi')) expect(c.expected).toBe(`Tong chi: ${tongChi}`)
        if (c.expected.startsWith('Moi ban')) {
          expect(soDu).toBeLessThan(100_000)
          expect(c.expected).toBe(`Moi ban dong them: ${moiBan}`)
        }
        if (c.expected === 'Chua can dong them') expect(soDu).toBeGreaterThanOrEqual(100_000)
      }
    }
  })
})

describe.skipIf(!hasPython)('T2 chặng P1 — check thật sự BẮT LỖI (chống test dễ dãi)', () => {
  const rot = (id: string, tu: string, thanh: string) => {
    const step = buoc(T2_P1_PROJECT_STEPS, id)
    expect(allTestsPassed(chamPython(step, dotBien(step.referenceCode, tu, thanh)))).toBe(false)
  }

  it('s1: gõ cứng sĩ số 40 thì rớt', () => rot('t2-p1-s1', 'si_so * MUC_DONG', '40 * MUC_DONG'))
  it('s2: cắt bằng int() thay vì làm tròn thì rớt', () =>
    rot('t2-p1-s2', 'round(da_dong / si_so * 100)', 'int(da_dong / si_so * 100)'))
  it('s3: so sánh < thay vì <= thì rớt (chi vừa đủ quỹ)', () =>
    rot('t2-p1-s3', 'if so_tien <= da_thu:', 'if so_tien < da_thu:'))
  it('s4: so với số đã thu ban đầu thay vì số dư hiện tại thì rớt', () =>
    rot('t2-p1-s4', 'if so_tien <= so_du:', 'if so_tien <= da_thu:'))
  it('s5: làm tròn XUỐNG thay vì lên thì rớt', () =>
    rot('t2-p1-s5', 'math.ceil(can_them', 'math.floor(can_them'))
})

// ── Chặng P2 ─────────────────────────────────────────────────────────────────────────────
describe('T2 chặng P2 — Sổ quỹ không mất', () => {
  it('đủ 5 bước; milestone khai đủ 3 file, file chính đứng đầu, mọi file phụ có code mẫu', () => {
    expect(T2_P2_PROJECT_STEPS.map((s) => s.id)).toEqual([
      't2-p2-s1',
      't2-p2-s2',
      't2-p2-s3',
      't2-p2-s4',
      't2-p2-s5',
    ])
    const s5 = buoc(T2_P2_PROJECT_STEPS, 't2-p2-s5')
    expect(s5.files).toEqual(['quy_lop.py', 'tinh_quy.py', 'luu_so.py'])
    expect(Object.keys(s5.referenceFiles ?? {}).sort()).toEqual(['luu_so.py', 'tinh_quy.py'])
    expect(s5.probeCode).toContain('from tinh_quy import')
    expect(s5.probeCode).toContain('from luu_so import')
  })
})

describe.skipIf(!hasPython)('T2 chặng P2 — check thật sự BẮT LỖI (chống test dễ dãi)', () => {
  const rot = (id: string, tu: string, thanh: string) => {
    const step = buoc(T2_P2_PROJECT_STEPS, id)
    expect(allTestsPassed(chamPython(step, dotBien(step.referenceCode, tu, thanh)))).toBe(false)
  }

  it('s1: coi bạn đóng thiếu là "chưa đóng" thì rớt', () =>
    rot('t2-p2-s1', 'if tien == 0:', 'if tien < 50000:'))
  it('s2: ghi đè hạng mục thay vì cộng dồn thì rớt', () =>
    rot('t2-p2-s2', 'CHI[hang_muc] = CHI.get(hang_muc, 0) + tien', 'CHI[hang_muc] = tien'))
  it('s3: quên mở sổ mới "w" đầu phiên thì rớt (cộng dồn sổ cũ)', () =>
    rot('t2-p2-s3', 'open(SO_FILE, "w", encoding="utf-8").close()', 'pass'))
  it('s4: chỉ bắt chữ mà để lọt số âm thì rớt', () =>
    rot('t2-p2-s4', '    if tien <= 0:\n        return None\n', ''))
  it('s5: mo_so_moi() không xoá sổ cũ thì rớt', () => {
    const step = buoc(T2_P2_PROJECT_STEPS, 't2-p2-s5')
    const luuSo = dotBien(
      step.referenceFiles!['luu_so.py']!,
      'open(SO_FILE, "w", encoding="utf-8").close()',
      'pass',
    )
    expect(allTestsPassed(chamPython(step, step.referenceCode, { 'luu_so.py': luuSo }))).toBe(false)
  })

  it('s5: quy_lop.py của milestone (chạy thật, không qua probe) giữ NGUYÊN hành vi bước 4', () => {
    const s4 = buoc(T2_P2_PROJECT_STEPS, 't2-p2-s4')
    const s5 = buoc(T2_P2_PROJECT_STEPS, 't2-p2-s5')
    const ketQua = chamPython(s5, s5.referenceCode, {}, s4.checks, false)
    expect(allTestsPassed(ketQua), JSON.stringify(ketQua.filter((r) => !r.passed))).toBe(true)
  })
})

// ── Chặng P3 — chấm bằng ĐÚNG engine của từng ngôn ngữ (khuôn projectStepsP3.test.ts) ──────
const require = createRequire(import.meta.url)
const SQL = await initSqlJs({ locateFile: () => require.resolve('sql.js/dist/sql-wasm.wasm') })

interface RunOutcome {
  output: string
  error?: string
}

function runHtml(html: string): RunOutcome {
  const win = new Window()
  try {
    win.document.write(html)
    return { output: moTaCayDom(win.document.documentElement as unknown as ElementLike) }
  } catch (err) {
    return { output: '', error: (err as Error).message }
  } finally {
    win.close()
  }
}

/** SQL: nạp bộ dữ liệu RIÊNG của ca (datasetSql) như trang dự án làm; không có thì SQL_SEED. */
function runSql(sql: string, datasetSql: string | undefined): RunOutcome {
  const db = new SQL.Database()
  try {
    db.run(datasetSql ?? SQL_SEED)
    return { output: formatSqlResults(db.exec(sql) as SqlResultTable[]) }
  } catch (err) {
    return { output: '', error: (err as Error).message }
  } finally {
    db.close()
  }
}

/** Bảng rẽ nhánh DUY NHẤT của cổng — API fetch lấy theo đúng khai báo của dự án T2, y như
 *  trang dự án (projectTracks.ts), nên cổng và sản phẩm không thể lệch nhau. */
async function runWeb(
  step: ProjectStep,
  code: string,
  c: ProjectStep['checks'][number],
): Promise<RunOutcome> {
  const lang = getStepLanguage(step)
  if (lang === 'html') return runHtml(code)
  if (lang === 'sql') return runSql(code, c.datasetSql)
  if (lang === 'dom') return chayBaiDom(step.domHtml!, code, c.stdinLines)
  if (lang === 'fetch') {
    return chayBaiFetch(step.domHtml!, code, c.stdinLines, getProjectTrack('T2').fetchApi)
  }
  throw new Error(`Bước ${step.id}: chặng P3 không dùng ngôn ngữ '${lang}'`)
}

async function chamWeb(step: ProjectStep, code: string): Promise<TestCaseResult[]> {
  const out: TestCaseResult[] = []
  for (const c of step.checks) {
    const r = await runWeb(step, code, c)
    out.push(gradeTestCase(c, r.output, r.error))
  }
  return out
}

function moTaRot(results: TestCaseResult[]): string {
  return results
    .filter((r) => !r.passed)
    .map((r) => `[${r.label}] ${r.error ? `LỖI: ${r.error}` : `output: ${r.actual ?? '(ẩn)'}`}`)
    .join(' | ')
}

describe('T2 chặng P3 — Trang minh bạch quỹ', () => {
  it('đủ 5 bước html → html/CSS → dom → sql → fetch, mỗi bước một file làm việc', () => {
    expect(T2_P3_PROJECT_STEPS.map((s) => `${s.id}:${getStepLanguage(s)}`)).toEqual([
      't2-p3-s1:html',
      't2-p3-s2:html',
      't2-p3-s3:dom',
      't2-p3-s4:sql',
      't2-p3-s5:fetch',
    ])
    for (const s of T2_P3_PROJECT_STEPS) expect(s.files).toHaveLength(1)
  })

  it('bước SQL: MỌI ca chấm khai bộ dữ liệu sổ quỹ (không rơi về CSDL quán của T1)', () => {
    const sql = buoc(T2_P3_PROJECT_STEPS, 't2-p3-s4')
    for (const c of sql.checks) expect(c.datasetSql, c.label).toBeDefined()
    // Có ít nhất hai bộ số khác nhau — chống câu truy vấn gõ cứng kết quả.
    expect(new Set(sql.checks.map((c) => c.datasetSql)).size).toBeGreaterThanOrEqual(2)
  })

  it('dự án T2 khai API giả "quy-lop"; sổ trên API khớp số liệu chấm của bước fetch', () => {
    expect(getProjectTrack('T2').fetchApi).toBe('quy-lop')
    const thu = SO_QUY_LOP.filter((g) => g.loai === 'thu').reduce((a, g) => a + g.so_tien, 0)
    const chi = SO_QUY_LOP.filter((g) => g.loai === 'chi').reduce((a, g) => a + g.so_tien, 0)
    const s5 = buoc(T2_P3_PROJECT_STEPS, 't2-p3-s5')
    const mongDoi = s5.checks.map((c) => c.expected)
    expect(mongDoi).toContain(`p id="tong-thu" "Tong thu: ${thu}"`)
    expect(mongDoi).toContain(`p id="tong-chi" "Tong chi: ${chi}"`)
    expect(mongDoi).toContain(`p id="so-du" "So du: ${thu - chi}"`)
  })

  it('kiểm số học bước SQL: tính lại báo cáo kỳ tháng 11 từ chính bộ dữ liệu', () => {
    const db = new SQL.Database()
    try {
      db.run(T2_SQL_SO_QUY)
      const dong = db.exec(
        'SELECT h.ten, k.ngay, k.so_tien FROM khoan_chi k JOIN hang_muc h ON h.id = k.hang_muc_id',
      )[0]!.values as [string, string, number][]
      const tong = new Map<string, number>()
      for (const [ten, ngay, tien] of dong) {
        if (ngay.startsWith('2026-11-')) tong.set(ten, (tong.get(ten) ?? 0) + tien)
      }
      const bang = [...tong].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      const mongDoi = ['hang_muc | tong_chi', ...bang.map(([t, v]) => `${t} | ${v}`)].join('\n')
      const caAn = buoc(T2_P3_PROJECT_STEPS, 't2-p3-s4').checks.find(
        (c) => c.match === 'exact' && c.datasetSql === T2_SQL_SO_QUY,
      )
      expect(caAn?.expected).toBe(mongDoi)
    } finally {
      db.close()
    }
  })

  it('FETCH_SHIM_QUY_LOP_JS tự chứa — khung xem trang (iframe) gọi được API sổ quỹ', async () => {
    const chay = new Function(
      FETCH_SHIM_QUY_LOP_JS + '\nreturn fetch("/api/quy?ma=c02")',
    ) as () => Promise<{
      status: number
      json(): Promise<unknown>
    }>
    const res = await chay()
    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({ ma: 'C02', so_tien: 300000 })
  })
})

describe('code mẫu chặng P3 của T2 chạy THẬT và đạt hết milestone check', () => {
  it.each(T2_P3_PROJECT_STEPS)('$id — $title', async (step) => {
    const results = await chamWeb(step, step.referenceCode)
    expect(allTestsPassed(results), `Bước ${step.id}: ${moTaRot(results)}`).toBe(true)
  })

  it('t2-p3-s5 — bộ chấm SERVER (node:vm) cho cùng kết quả với bộ chạy Worker', async () => {
    const step = buoc(T2_P3_PROJECT_STEPS, 't2-p3-s5')
    for (const c of step.checks) {
      const r = await chayBaiFetchServer(step.domHtml!, step.referenceCode, c.stdinLines, 'quy-lop')
      expect(gradeTestCase(c, r.output, r.error).passed, c.label).toBe(true)
    }
  })
})

describe('T2 chặng P3 — check thật sự BẮT LỖI (chống test dễ dãi)', () => {
  const rot = async (id: string, tu: string, thanh: string) => {
    const step = buoc(T2_P3_PROJECT_STEPS, id)
    const ketQua = await chamWeb(step, dotBien(step.referenceCode, tu, thanh))
    expect(allTestsPassed(ketQua)).toBe(false)
  }

  it('s1: tiêu đề cột dùng td thay vì th thì rớt', () =>
    rot('t2-p3-s1', '<th>Noi dung</th>', '<td>Noi dung</td>'))
  it('s2: bảng không co theo màn hình (bỏ width: 100%) thì rớt', () =>
    rot('t2-p3-s2', 'border-collapse: collapse; width: 100%;', 'border-collapse: collapse;'))
  it('s3: chặn cả khoản chi bằng đúng số dư (>= thay vì >) thì rớt', () =>
    rot('t2-p3-s3', 'if (khoan.soTien > soDu)', 'if (khoan.soTien >= soDu)'))
  it('s3: quên chặn số âm thì rớt', () => rot('t2-p3-s3', ' || soTien <= 0', ''))
  it('s4: quên lọc kỳ thì rớt', () =>
    rot('t2-p3-s4', "WHERE kc.ngay >= '2026-11-01' AND kc.ngay < '2026-12-01'\n", ''))
  it('s4: sai ranh giới đầu kỳ (> thay vì >=) thì rớt', () =>
    rot('t2-p3-s4', "kc.ngay >= '2026-11-01'", "kc.ngay > '2026-11-01'"))
  it('s5: không xử lý 404 thì rớt', () => rot('t2-p3-s5', 'if (!res.ok) {', 'if (false) {'))
})

// ── Chặng P4 ─────────────────────────────────────────────────────────────────────────────
describe('T2 chặng P4 — Lõi quỹ có test và API', () => {
  it('đủ 6 bước, đúng làn: python ×3 → pytest → apisim ×2', () => {
    expect(T2_P4_PROJECT_STEPS.map((s) => `${s.id}:${getStepLanguage(s)}`)).toEqual([
      't2-p4-s1:python',
      't2-p4-s2:python',
      't2-p4-s3:python',
      't2-p4-s4:pytest',
      't2-p4-s5:apisim',
      't2-p4-s6:apisim',
    ])
  })

  it('khối kiểm thử dán cuối file ở đề bài khớp NGUYÊN VĂN code tham chiếu (học viên chép đúng đề)', () => {
    for (const id of ['t2-p4-s5', 't2-p4-s6']) {
      const step = buoc(T2_P4_PROJECT_STEPS, id)
      const khoi = step.referenceCode.slice(step.referenceCode.indexOf('client = TestClient(app)'))
      expect(step.requirement, id).toContain(khoi)
    }
  })
})

describe.skipIf(!hasPython)('T2 chặng P4 — check thật sự BẮT LỖI (chống test dễ dãi)', () => {
  const rot = (id: string, tu: string, thanh: string) => {
    const step = buoc(T2_P4_PROJECT_STEPS, id)
    expect(allTestsPassed(chamPython(step, dotBien(step.referenceCode, tu, thanh)))).toBe(false)
  }

  it('s1: còn thiếu ra số âm khi đóng dư thì rớt', () =>
    rot('t2-p4-s1', '        if self.da_dong >= MUC_DONG:\n            return 0\n', ''))
  it('s2: cộng lẫn thu với chi thì rớt', () =>
    rot('t2-p4-s2', 'in self.giao_dich if l == loai)', 'in self.giao_dich)'))
  it('s3: ghi khoản chi TRƯỚC khi kiểm số dư thì rớt', () =>
    rot(
      't2-p4-s3',
      '        con = self.so_du()\n        if so_tien > con:\n            raise QuyKhongDu(f"Quy chi con {con}, khong du {so_tien}")\n        self.giao_dich.append(("chi", hang_muc, so_tien))',
      '        con = self.so_du()\n        self.giao_dich.append(("chi", hang_muc, so_tien))\n        if so_tien > con:\n            raise QuyKhongDu(f"Quy chi con {con}, khong du {so_tien}")',
    ))
  it('s4: bộ test bắt được lõi viết sai mốc (> thành >=)', () =>
    rot('t2-p4-s4', '    if so_tien > so_du:', '    if so_tien >= so_du:'))
  it('s4: thiếu một hàm test thì rớt', () =>
    rot('t2-p4-s4', 'def test_dung_moc_500k():', 'def kiem_moc_500k():'))
  it('s5: DELETE không báo 404 khi không còn gì để xoá thì rớt', () =>
    rot('t2-p4-s5', '    if cur.rowcount == 0:', '    if False:'))
  it('s6: tin số dư người gọi gửi lên thì rớt', () =>
    rot('t2-p4-s6', 'con = so_du_hien_tai()', 'con = du_lieu.get("so_du", so_du_hien_tai())'))
})

// Mọi bước Python của T2 đi qua cổng chung lessonsPython.test.ts; ở đây chỉ chặn trường hợp
// bước không phải Python lọt ra khỏi mọi cổng (P3 có cổng engine web riêng bên dưới).
it('mọi bước T2 đều có cổng chấm: Python ở lessonsPython, web ở file này', () => {
  const web = new Set(['html', 'dom', 'sql', 'fetch'])
  for (const stage of T2_PROJECT_STAGES) {
    for (const step of stage.steps) {
      const lang = getStepLanguage(step)
      expect(laLanPython(lang) || web.has(lang), `${step.id}: ${lang}`).toBe(true)
    }
  }
})
