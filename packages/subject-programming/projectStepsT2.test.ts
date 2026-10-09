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
import { execFileSync, spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { ProjectStepSchema, getProjectStages, getStepLanguage } from './projectSteps.js'
import { T2_P1_PROJECT_STEPS, T2_P2_PROJECT_STEPS, T2_PROJECT_STAGES } from './projectStepsT2.js'
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
