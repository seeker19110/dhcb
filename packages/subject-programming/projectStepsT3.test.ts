// CỔNG NỘI DUNG dự án trục T3 "Sổ học tập của tôi" — bổ sung cho hai cổng chung:
//  - projectTracks.test.ts: khuôn mã/unit/files/milestone của mọi bước T2/T3.
//  - lessonsPython.test.ts: chạy code tham chiếu của MỌI bước Python (cả làn pytest/apisim).
// File này thêm ba thứ hai cổng kia không làm:
//  1. Kiểm SỐ HỌC đối chiếu độc lập (tính lại ĐTB có trọng số bằng TypeScript) — bắt lỗi soạn
//     tay `expected` mà code mẫu lỡ sai cùng chiều.
//  2. Chạy code mẫu các bước WEB (html/dom/sql/fetch) bằng ĐÚNG engine học viên gặp — như
//     projectStepsP3.test.ts làm cho T1.
//  3. Kiểm milestone check thật sự BẮT LỖI: sửa code mẫu thành phiên bản sai điển hình của
//     người mới (> thay >=, quên làm tròn, quên transaction…) thì phải rớt.
import { describe, expect, it } from 'vitest'
import { Window } from 'happy-dom'
import initSqlJs from 'sql.js'
import { createRequire } from 'node:module'
import { execFileSync, spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import {
  T3_P1_PROJECT_STEPS,
  T3_P2_PROJECT_STEPS,
  T3_PROJECT_MAIN_FILE,
  T3_PROJECT_STAGES,
} from './projectStepsT3.js'
import {
  getProjectStages,
  getStepFiles,
  getStepLanguage,
  type ProjectStep,
} from './projectSteps.js'
import { isProjectTrackAvailable } from './projectTracks.js'
import { laLanPython, fileCuaLan, noiCodeTheoLan, type PythonLane } from './pyLanes.js'
import { gradeTestCase, allTestsPassed, type TestCaseResult } from './grading.js'
import { T3_P3_PROJECT_STEPS } from './projectStepsT3P3.js'
import { T3_P4_PROJECT_STEPS } from './projectStepsT3P4.js'
import { T3_P5_PROJECT_STEPS } from './projectStepsT3P5.js'
import { moTaCayDom, type ElementLike } from './htmlPrelude.js'
import { chayBaiDom } from './domPrelude.js'
import { chayBaiFetch, FETCH_SHIM_TAI_LIEU_JS } from './fetchPrelude.js'
import { SQL_SEED } from './sqlDataset.js'
import { formatSqlResults, type SqlResultTable } from './sqlPrelude.js'
import { TAI_LIEU_CHIA_SE } from './hocTapData.js'

const hasPython = spawnSync('python3', ['--version']).status === 0

/** ĐTB môn theo luật điểm của dự án: (tx + 2·gk + 3·ck) / 6, làm tròn 1 chữ số. */
function dtbMon(tx: number, gk: number, ck: number): number {
  return Math.round(((tx + 2 * gk + 3 * ck) / 6) * 10) / 10
}

/** ĐTB có trọng số theo hệ số môn (chặng P2). */
function dtbTrongSo(diem: Record<string, number>, heSo: Record<string, number>): number {
  let tong = 0
  let tongHeSo = 0
  for (const [mon, d] of Object.entries(diem)) {
    tong += d * (heSo[mon] ?? 0)
    tongHeSo += heSo[mon] ?? 0
  }
  return tongHeSo === 0 ? 0 : Math.round((tong / tongHeSo) * 10) / 10
}

/** Python in số thực luôn có phần thập phân (8.0, không phải 8). */
const pyFloat = (n: number): string => (Number.isInteger(n) ? n.toFixed(1) : String(n))

const step = (steps: ProjectStep[], id: string): ProjectStep => {
  const s = steps.find((x) => x.id === id)
  if (!s) throw new Error(`Không có bước ${id}`)
  return s
}

// ── Chạy python3 THẬT, cùng prelude input() với lessonsPython.test.ts ─────────────────────
// (prelude phải khớp sandbox trình duyệt: đọc tuần tự các dòng điền sẵn và echo prompt+giá trị)
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

/** Chấm code (mẫu hoặc đã cố ý làm sai) của một bước Python theo đúng làn + workspace của bước. */
function gradePython(s: ProjectStep, code: string): TestCaseResult[] {
  const lane = getStepLanguage(s) as PythonLane
  const dir = mkdtempSync(join(tmpdir(), `dhcb-t3-${s.id}-`))
  for (const [name, content] of Object.entries(fileCuaLan(lane))) {
    mkdirSync(dirname(join(dir, name)), { recursive: true })
    writeFileSync(join(dir, name), content, 'utf8')
  }
  for (const [path, content] of Object.entries(s.referenceFiles ?? {})) {
    writeFileSync(join(dir, path), content, 'utf8')
  }
  writeFileSync(join(dir, getStepFiles(s)[0]!), code, 'utf8')
  const entry = noiCodeTheoLan(lane, s.probeCode ?? code)
  return s.checks.map((c) => {
    try {
      const output = execFileSync('python3', ['-c', wrap(entry, c.stdinLines)], {
        encoding: 'utf8',
        timeout: 15_000,
        cwd: dir,
        stdio: ['ignore', 'pipe', 'pipe'],
        env: { ...process.env, PYTHONIOENCODING: 'utf-8', PYTHONUTF8: '1' },
      })
      return gradeTestCase(c, output)
    } catch (err) {
      const e = err as { stdout?: string; stderr?: string }
      return gradeTestCase(c, e.stdout ?? '', (e.stderr || 'lỗi chạy python3').trim())
    }
  })
}

/** Sửa code mẫu thành bản sai — chuỗi gốc PHẢI có trong code (chống mutation trượt âm thầm). */
function sua(code: string, cu: string, moi: string): string {
  expect(code.includes(cu), `không tìm thấy đoạn cần sửa: ${cu}`).toBe(true)
  return code.split(cu).join(moi)
}

const PY_TIMEOUT_MS = 60_000

// ─────────────────────────────────────────────────────────────────────────────────────────
describe('T3 — đăng ký dự án', () => {
  it('năm chặng gắn đúng mảng bước; dự án T3 đã mở', () => {
    expect(getProjectStages('T3')).toBe(T3_PROJECT_STAGES)
    expect(T3_PROJECT_STAGES[0]!.steps).toBe(T3_P1_PROJECT_STEPS)
    expect(T3_PROJECT_STAGES[1]!.steps).toBe(T3_P2_PROJECT_STEPS)
    expect(T3_PROJECT_STAGES[2]!.steps).toBe(T3_P3_PROJECT_STEPS)
    expect(T3_PROJECT_STAGES[3]!.steps).toBe(T3_P4_PROJECT_STEPS)
    expect(T3_PROJECT_STAGES[4]!.steps).toBe(T3_P5_PROJECT_STEPS)
    expect(isProjectTrackAvailable('T3')).toBe(true)
  })

  it('mọi bước có ca HIỆN (học viên đối chiếu được) và ít nhất một ca ẩn chống gõ cứng', () => {
    for (const stage of T3_PROJECT_STAGES) {
      for (const s of stage.steps) {
        expect(
          s.checks.some((c) => !c.hidden),
          s.id,
        ).toBe(true)
        expect(
          s.checks.some((c) => c.hidden),
          s.id,
        ).toBe(true)
      }
    }
  })
})

describe('T3 chặng P1 — số học các ca chấm khớp luật điểm', () => {
  it('chỉ một file so_hoc_tap.py, thuần Python', () => {
    for (const s of T3_P1_PROJECT_STEPS) {
      expect(getStepFiles(s)).toEqual([T3_PROJECT_MAIN_FILE])
      expect(getStepLanguage(s)).toBe('python')
    }
  })

  it('s2: "DTB <mon>: <dtb>" = (tx + 2·gk + 3·ck) / 6 làm tròn', () => {
    for (const c of step(T3_P1_PROJECT_STEPS, 't3-p1-s2').checks) {
      const [, mon, tx, gk, ck] = c.stdinLines
      expect(c.expected).toBe(`DTB ${mon}: ${pyFloat(dtbMon(+tx!, +gk!, +ck!))}`)
    }
  })

  it('s3: xếp loại theo bậc trên ĐTB đã làm tròn', () => {
    const loai = (d: number) => (d >= 8 ? 'Tot' : d >= 6.5 ? 'Kha' : d >= 5 ? 'Dat' : 'Chua dat')
    for (const c of step(T3_P1_PROJECT_STEPS, 't3-p1-s3').checks) {
      if (!c.expected.startsWith('Xep loai')) continue
      const [, , tx, gk, ck] = c.stdinLines.map(Number)
      expect(c.expected).toBe(`Xep loai: ${loai(dtbMon(tx!, gk!, ck!))}`)
    }
    // Ca "làm tròn trước khi xếp loại" chỉ có nghĩa khi điểm THÔ dưới 8 mà điểm tròn bằng 8.
    expect((7.8 + 16 + 24) / 6).toBeLessThan(8)
    expect(dtbMon(7.8, 8, 8)).toBe(8)
  })

  it('s5: số điểm còn thiếu = mục tiêu − ĐTB', () => {
    expect(Math.round((8 - dtbMon(6, 7.5, 7)) * 10) / 10).toBe(1)
    expect(Math.round((9 - dtbMon(8, 7, 9)) * 10) / 10).toBe(0.8)
    expect(dtbMon(8, 7, 9)).toBe(8.2)
  })
})

describe('T3 chặng P2 — số học + cấu trúc file', () => {
  const HE_SO = { toan: 2, van: 2, anh: 1 }

  it('ĐTB có trọng số các ca hiện khớp công thức Σ(điểm × hệ số) / Σ(hệ số)', () => {
    expect(dtbTrongSo({ toan: 8, anh: 6.5 }, HE_SO)).toBe(7.5)
    expect(dtbTrongSo({ ly: 6, toan: 9 }, { ...HE_SO, ly: 2 })).toBe(7.5)
    expect(dtbTrongSo({ toan: 9, van: 7 }, HE_SO)).toBe(8)
    expect(dtbTrongSo({ toan: 8, hoa: 2 }, HE_SO)).toBe(8)
    expect(dtbTrongSo({}, HE_SO)).toBe(0)
  })

  it('bước tách file: khai đủ 3 file, file chính đứng đầu, có code mẫu file phụ và probe', () => {
    const s5 = step(T3_P2_PROJECT_STEPS, 't3-p2-s5')
    expect(getStepFiles(s5)).toEqual([T3_PROJECT_MAIN_FILE, 'tinh_diem.py', 'luu_tru.py'])
    expect(Object.keys(s5.referenceFiles ?? {}).sort()).toEqual(['luu_tru.py', 'tinh_diem.py'])
    expect(s5.probeCode).toContain('from tinh_diem import')
    expect(s5.probeCode).toContain('from luu_tru import')
    for (const s of T3_P2_PROJECT_STEPS.slice(0, -1)) {
      expect(getStepFiles(s)).toEqual([T3_PROJECT_MAIN_FILE])
      expect(s.probeCode).toBeUndefined()
    }
  })
})

describe.skipIf(!hasPython)('T3 P1/P2 — milestone check BẮT được lỗi điển hình', () => {
  const expectRot = (s: ProjectStep, code: string) =>
    expect(allTestsPassed(gradePython(s, code)), `${s.id}: bản sai mà vẫn đạt`).toBe(false)

  it(
    'p1-s3: viết > thay cho >= ở mốc Khá thì rớt',
    () => {
      const s = step(T3_P1_PROJECT_STEPS, 't3-p1-s3')
      expectRot(s, sua(s.referenceCode, 'dtb >= 6.5', 'dtb > 6.5'))
    },
    PY_TIMEOUT_MS,
  )

  it(
    'p1-s3: xếp loại theo điểm CHƯA làm tròn thì rớt',
    () => {
      const s = step(T3_P1_PROJECT_STEPS, 't3-p1-s3')
      const sai = sua(
        s.referenceCode,
        'dtb = round((tx + 2 * gk + 3 * ck) / 6, 1)\nprint(f"DTB {mon}: {dtb}")',
        'dtb = (tx + 2 * gk + 3 * ck) / 6\nprint(f"DTB {mon}: {round(dtb, 1)}")',
      )
      expectRot(s, sai)
    },
    PY_TIMEOUT_MS,
  )

  it(
    'p1-s5: so mục tiêu bằng > (vừa bằng mục tiêu mà báo thiếu) thì rớt',
    () => {
      const s = step(T3_P1_PROJECT_STEPS, 't3-p1-s5')
      expectRot(s, sua(s.referenceCode, 'dtb >= muc_tieu', 'dtb > muc_tieu'))
    },
    PY_TIMEOUT_MS,
  )

  it(
    'p2-s1: quên chặn chia cho 0 khi chưa có điểm thì rớt',
    () => {
      const s = step(T3_P2_PROJECT_STEPS, 't3-p2-s1')
      expectRot(s, sua(s.referenceCode, '    if tong_he_so == 0:\n        return 0.0\n', ''))
    },
    PY_TIMEOUT_MS,
  )

  it(
    'p2-s3: mở sổ bằng "a" (không xoá sổ phiên trước) thì rớt',
    () => {
      const s = step(T3_P2_PROJECT_STEPS, 't3-p2-s3')
      expectRot(
        s,
        sua(
          s.referenceCode,
          'open(SO_FILE, "w", encoding="utf-8").close()',
          'open(SO_FILE, "a", encoding="utf-8").close()',
        ),
      )
    },
    PY_TIMEOUT_MS,
  )

  it(
    'p2-s4: ghi cả điểm ngoài thang 0–10 thì rớt',
    () => {
      const s = step(T3_P2_PROJECT_STEPS, 't3-p2-s4')
      const sai = sua(
        s.referenceCode,
        '    if not 0 <= d <= 10:\n        print("Diem phai tu 0 den 10")\n        continue\n',
        '',
      )
      expectRot(s, sai)
    },
    PY_TIMEOUT_MS,
  )

  it(
    'p2-s5: luu_tru.doc_so cộng dồn thay vì ghi đè (giữ điểm cũ) thì rớt',
    () => {
      const s = step(T3_P2_PROJECT_STEPS, 't3-p2-s5')
      const sai: ProjectStep = {
        ...s,
        referenceFiles: {
          ...s.referenceFiles,
          'luu_tru.py': sua(
            s.referenceFiles!['luu_tru.py']!,
            'diem[mon] = float(d)',
            'diem.setdefault(mon, float(d))',
          ),
        },
      }
      expectRot(sai, s.referenceCode)
    },
    PY_TIMEOUT_MS,
  )
})

// Lọc an toàn: file này chỉ chấm bước Python bằng python3 ở các khối trên; bước web có khối
// riêng (thêm cùng chặng P3). Chặn nhầm ngôn ngữ ngay từ đây cho dễ đọc lỗi.
it('mọi bước chặng P1/P2 của T3 chạy bằng engine Python', () => {
  for (const s of [...T3_P1_PROJECT_STEPS, ...T3_P2_PROJECT_STEPS]) {
    expect(laLanPython(getStepLanguage(s)), s.id).toBe(true)
  }
})

// ── Chặng P3: bước web chạy bằng ĐÚNG engine học viên gặp (như projectStepsP3.test.ts) ────────
const require = createRequire(import.meta.url)
const wasmPath = require.resolve('sql.js/dist/sql-wasm.wasm')
const SQL = await initSqlJs({ locateFile: () => wasmPath })

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

/** Mỗi ca một CSDL sạch, nạp đúng bộ dữ liệu của ca (datasetSql) — như sqlWorker ở trình duyệt. */
function runSql(sql: string, seed: string): RunOutcome {
  const db = new SQL.Database()
  try {
    db.run(seed)
    return { output: formatSqlResults(db.exec(sql) as SqlResultTable[]) }
  } catch (err) {
    return { output: '', error: (err as Error).message }
  } finally {
    db.close()
  }
}

/** Bảng rẽ nhánh duy nhất: bộ chạy do `language` của bước quyết định, như trang dự án. */
async function gradeWeb(s: ProjectStep, code: string): Promise<TestCaseResult[]> {
  const out: TestCaseResult[] = []
  for (const c of s.checks) {
    const lang = getStepLanguage(s)
    const r =
      lang === 'html'
        ? runHtml(code)
        : lang === 'sql'
          ? runSql(code, c.datasetSql ?? SQL_SEED)
          : lang === 'dom'
            ? chayBaiDom(s.domHtml!, code, c.stdinLines)
            : lang === 'fetch'
              ? await chayBaiFetch(s.domHtml!, code, c.stdinLines, 'tai-lieu')
              : { output: '', error: `bước ${s.id}: chặng P3 không dùng '${lang}'` }
    out.push(gradeTestCase(c, r.output, r.error))
  }
  return out
}

function moTaLoi(results: TestCaseResult[]): string {
  return results
    .filter((r) => !r.passed)
    .map(
      (r) => `[${r.label}] ${r.error ? `LỖI: ${r.error}` : `output thật: ${r.actual ?? '(ẩn)'}`}`,
    )
    .join(' | ')
}

describe('T3 chặng P3 — bất biến dữ liệu', () => {
  it('đi đủ năm ngôn ngữ web theo nhịp T1: html → html/CSS → dom → sql → fetch', () => {
    expect(T3_P3_PROJECT_STEPS.map((s) => getStepLanguage(s))).toEqual([
      'html',
      'html',
      'dom',
      'sql',
      'fetch',
    ])
    for (const s of T3_P3_PROJECT_STEPS) {
      expect(getStepFiles(s), s.id).toHaveLength(1)
      const lang = getStepLanguage(s)
      expect(s.domHtml !== undefined, s.id).toBe(lang === 'dom' || lang === 'fetch')
    }
  })

  it('bước SQL: MỌI ca có bộ dữ liệu riêng của dự án, ca ẩn dùng bộ số khác ca hiện', () => {
    const sql = T3_P3_PROJECT_STEPS.find((s) => getStepLanguage(s) === 'sql')!
    expect(sql.checks.every((c) => c.datasetSql !== undefined)).toBe(true)
    const hien = new Set(sql.checks.filter((c) => !c.hidden).map((c) => c.datasetSql))
    const an = sql.checks.filter((c) => c.hidden).map((c) => c.datasetSql)
    expect(an.length).toBeGreaterThan(0)
    for (const d of an) expect(hien.has(d)).toBe(false)
  })

  it('API tài liệu giữ đúng 3 tài liệu của trang tĩnh bước 1 (một sản phẩm tiến hoá)', () => {
    const trangTinh = T3_P3_PROJECT_STEPS[0]!.referenceCode
    for (const tl of TAI_LIEU_CHIA_SE.slice(0, 3)) expect(trangTinh).toContain(`>${tl.ten}</a>`)
    expect(TAI_LIEU_CHIA_SE.length).toBeGreaterThan(3)
  })
})

describe('T3 chặng P3 — API giả /api/tai-lieu', () => {
  it('shim khung "Xem trang chạy" tự chứa và trả đúng dữ liệu của bộ chấm', async () => {
    // Đúng cách iframe dùng shim: một scope mới toanh, chỉ có JavaScript chuẩn.
    const chay = new Function(
      FETCH_SHIM_TAI_LIEU_JS + '\nreturn fetch("/api/tai-lieu")',
    ) as () => Promise<{ status: number; json(): Promise<unknown> }>
    const res = await chay()
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual(TAI_LIEU_CHIA_SE)
  })

  it('tra một tài liệu theo tên; tên lạ → 404; địa chỉ khác → lỗi mạng giả', async () => {
    const js = `const a = await fetch("/api/tai-lieu?ten=" + encodeURIComponent("tom tat van 11"))
      const b = await fetch("/api/tai-lieu?ten=khong-co")
      let loi = ""
      try { await fetch("/api/menu") } catch (e) { loi = e.name }
      document.getElementById("trang-thai").textContent =
        (await a.json()).luot_tai + " " + b.status + " " + loi`
    const r = await chayBaiFetch(T3_P3_PROJECT_STEPS[4]!.domHtml!, js, [], 'tai-lieu')
    expect(r.error).toBeUndefined()
    expect(r.output).toContain('p id="trang-thai" "85 404 TypeError"')
  })
})

describe('T3 chặng P3 — code mẫu chạy THẬT và đạt hết milestone check', () => {
  it.each(T3_P3_PROJECT_STEPS)('$id — $title', async (s) => {
    const results = await gradeWeb(s, s.referenceCode)
    expect(allTestsPassed(results), `Bước ${s.id}: ${moTaLoi(results)}`).toBe(true)
  })
})

describe('T3 chặng P3 — milestone check BẮT được lỗi điển hình', () => {
  const rot = async (s: ProjectStep, code: string) =>
    expect(allTestsPassed(await gradeWeb(s, code)), `${s.id}: bản sai mà vẫn đạt`).toBe(false)

  it('p3-s1: thiếu meta charset thì rớt', async () => {
    const s = T3_P3_PROJECT_STEPS[0]!
    await rot(s, sua(s.referenceCode, '<meta charset="utf-8" />', ''))
  })

  it('p3-s1: liên kết đặt NGOÀI thẻ li thì rớt', async () => {
    const s = T3_P3_PROJECT_STEPS[0]!
    await rot(
      s,
      sua(
        s.referenceCode,
        '<li><a href="tom-tat-van.pdf">Tom tat Van 11</a></li>',
        '<li></li><a href="tom-tat-van.pdf">Tom tat Van 11</a>',
      ),
    )
  })

  it('p3-s2: ô tài liệu thiếu vùng chạm 44px thì rớt', async () => {
    const s = T3_P3_PROJECT_STEPS[1]!
    await rot(s, sua(s.referenceCode, 'min-height: 44px;', ''))
  })

  it('p3-s3: sang thẻ mới mà quên úp thẻ (giữ đáp án cũ) thì rớt', async () => {
    const s = T3_P3_PROJECT_STEPS[2]!
    await rot(s, sua(s.referenceCode, '  matSau.textContent = ""\n', ''))
  })

  it('p3-s3: không chặn bấm thừa sau thẻ cuối thì rớt', async () => {
    const s = T3_P3_PROJECT_STEPS[2]!
    await rot(s, sua(s.referenceCode, '  if (viTri >= THE.length) return\n', ''))
  })

  it('p3-s4: đi từ mon_hoc LEFT JOIN diem (lọt môn chưa có điểm, dtb NULL) thì rớt', async () => {
    const s = T3_P3_PROJECT_STEPS[3]!
    await rot(
      s,
      sua(
        s.referenceCode,
        'FROM diem d\nJOIN mon_hoc m ON m.id = d.mon_id',
        'FROM mon_hoc m\nLEFT JOIN diem d ON d.mon_id = m.id',
      ),
    )
  })

  it('p3-s4: thiếu luật xử hoà theo tên thì rớt', async () => {
    const s = T3_P3_PROJECT_STEPS[3]!
    await rot(s, sua(s.referenceCode, 'ORDER BY dtb ASC, ten ASC', 'ORDER BY dtb ASC'))
  })

  it('p3-s4: ĐTB không theo hệ số (AVG thường) thì rớt', async () => {
    const s = T3_P3_PROJECT_STEPS[3]!
    await rot(
      s,
      sua(
        s.referenceCode,
        'ROUND(SUM(d.diem * d.he_so) / SUM(d.he_so), 1)',
        'ROUND(AVG(d.diem), 1)',
      ),
    )
  })

  it('p3-s4: chép tay kết quả của bộ số hiện thì rớt ở bộ số ẩn', async () => {
    const s = T3_P3_PROJECT_STEPS[3]!
    await rot(
      s,
      "SELECT 'Anh' AS ten, 5.8 AS dtb UNION ALL SELECT 'Dia', 6.3 UNION ALL SELECT 'Ly', 6.3;",
    )
  })

  it('p3-s5: lọc mà không xoá danh sách cũ thì rớt', async () => {
    const s = T3_P3_PROJECT_STEPS[4]!
    await rot(s, sua(s.referenceCode, '  dsEl.innerHTML = ""\n', ''))
  })

  it('p3-s5: gõ cứng 3 tài liệu cũ thay vì lấy từ API thì rớt', async () => {
    const s = T3_P3_PROJECT_STEPS[4]!
    await rot(
      s,
      sua(
        s.referenceCode,
        'TAT_CA = await res.json()',
        'await res.json()\n  TAT_CA = [{ ten: "De cuong Toan HK1", mon: "toan" }, { ten: "Tom tat Van 11", mon: "van" }, { ten: "Tu vung Anh Unit 1-5", mon: "anh" }]',
      ),
    )
  })
})

// ── Chặng P4: lõi class → test → API ──────────────────────────────────────────────────────────
describe('T3 chặng P4 — cấu trúc', () => {
  it('đi qua đủ ba làn Python của bậc (python thuần → pytest → apisim) như T1', () => {
    expect(T3_P4_PROJECT_STEPS.map((s) => getStepLanguage(s))).toEqual([
      'python',
      'python',
      'python',
      'pytest',
      'apisim',
      'apisim',
    ])
    expect(T3_P4_PROJECT_STEPS.every((s) => s.probeCode === undefined)).toBe(true)
  })

  it('số học: milestone dùng ĐÚNG bộ điểm 8·7·9 của chặng P1 (một dòng chảy, không đề rời)', () => {
    const s6 = T3_P4_PROJECT_STEPS.at(-1)!
    expect(s6.checks.some((c) => c.expected === `TONG KET: toan 3 ${dtbMon(8, 7, 9)} Tot`)).toBe(
      true,
    )
  })
})

describe.skipIf(!hasPython)('T3 chặng P4 — milestone check BẮT được lỗi điển hình', () => {
  const expectRot = (s: ProjectStep, code: string) =>
    expect(allTestsPassed(gradePython(s, code)), `${s.id}: bản sai mà vẫn đạt`).toBe(false)

  it(
    'p4-s1: môn chưa có điểm trả 0 thay vì None thì rớt',
    () => {
      const s = T3_P4_PROJECT_STEPS[0]!
      expectRot(s, sua(s.referenceCode, 'return None          #', 'return 0          #'))
    },
    PY_TIMEOUT_MS,
  )

  it(
    'p4-s2: bỏ sót bài đến hạn đúng ngày thứ 3 (< thay cho <=) thì rớt',
    () => {
      const s = T3_P4_PROJECT_STEPS[1]!
      expectRot(s, sua(s.referenceCode, '<= SAP_DEN_HAN]', '< SAP_DEN_HAN]'))
    },
    PY_TIMEOUT_MS,
  )

  it(
    'p4-s3: thêm điểm TRƯỚC khi kiểm luật (điểm sai lọt vào môn) thì rớt',
    () => {
      const s = T3_P4_PROJECT_STEPS[2]!
      const sai = sua(
        s.referenceCode,
        '    def them_diem(self, diem, he_so):\n',
        '    def them_diem(self, diem, he_so):\n        self.diem.append((diem, he_so))\n',
      )
      expectRot(
        s,
        sua(
          sai,
          '            raise DiemKhongHopLe(f"He so {he_so} khong hop le")\n        self.diem.append((diem, he_so))',
          '            raise DiemKhongHopLe(f"He so {he_so} khong hop le")',
        ),
      )
    },
    PY_TIMEOUT_MS,
  )

  it(
    'p4-s4: lõi bị sửa sai mốc Khá (> thay >=) thì chính bộ test của học viên phải đỏ',
    () => {
      const s = T3_P4_PROJECT_STEPS[3]!
      expectRot(s, sua(s.referenceCode, 'if d >= 6.5:', 'if d > 6.5:'))
    },
    PY_TIMEOUT_MS,
  )

  it(
    'p4-s5: danh sách sắp theo id thay vì theo hạn thì rớt',
    () => {
      const s = T3_P4_PROJECT_STEPS[4]!
      expectRot(s, sua(s.referenceCode, 'ORDER BY han, id', 'ORDER BY id'))
    },
    PY_TIMEOUT_MS,
  )

  it(
    'p4-s6: quên kiểm hệ số ở cửa API thì rớt',
    () => {
      const s = T3_P4_PROJECT_STEPS[5]!
      expectRot(
        s,
        sua(
          s.referenceCode,
          '    if he_so not in (1, 2, 3):\n        raise HTTPException(422, "He so phai la 1, 2 hoac 3")\n',
          '',
        ),
      )
    },
    PY_TIMEOUT_MS,
  )
})

// ─────────────────────────────────────────────────────────────────────────────────────────
describe('T3 chặng P5 — cấu trúc + số học', () => {
  it('bốn bước Python thuần rồi milestone apisim; chỉ bước cuối là milestone', () => {
    expect(T3_P5_PROJECT_STEPS.map((s) => getStepLanguage(s))).toEqual([
      'python',
      'python',
      'python',
      'python',
      'apisim',
    ])
    expect(T3_P5_PROJECT_STEPS.map((s) => s.isMilestone)).toEqual([
      false,
      false,
      false,
      false,
      true,
    ])
  })

  it('luật điểm giữ nguyên từ P1: CSDL tính 8·7·9 ra đúng ĐTB của chặng P1', () => {
    const s1 = T3_P5_PROJECT_STEPS[0]!
    expect(s1.checks.some((c) => c.expected === `DTB: ${dtbMon(8, 7, 9)}`)).toBe(true)
    expect(s1.checks.some((c) => c.expected === `DTB: ${pyFloat(dtbMon(6, 7.5, 7))}`)).toBe(true)
  })

  it('bước hiệu năng: số phép so khớp n(n-1)/2 và n ở cả ca hiện lẫn ca ẩn', () => {
    const s3 = T3_P5_PROJECT_STEPS[2]!
    for (const n of [1000, 300]) {
      const cham = s3.checks.filter(
        (c) => c.stdinLines[0] === String(n) && c.expected.startsWith('Cham:'),
      )
      expect(cham.map((c) => c.expected)).toEqual([`Cham: ${(n * (n - 1)) / 2} phep so`])
    }
  })

  it('bước cấu hình: độ dài khoá in ra khớp đúng khoá trong ca chấm', () => {
    const s4 = T3_P5_PROJECT_STEPS[3]!
    const khoa = 'so-hoc-tap-bi-mat-2026'
    expect(s4.checks.some((c) => c.stdinLines.includes(`SECRET_KEY=${khoa}`))).toBe(true)
    expect(s4.checks.some((c) => c.expected === `SECRET_KEY: da dat (${khoa.length} ky tu)`)).toBe(
      true,
    )
  })
})

describe.skipIf(!hasPython)('T3 chặng P5 — milestone check BẮT được lỗi điển hình', () => {
  const expectRot = (s: ProjectStep, code: string) =>
    expect(allTestsPassed(gradePython(s, code)), `${s.id}: bản sai mà vẫn đạt`).toBe(false)

  it(
    'p5-s1: commit sau TỪNG dòng (mất tính tất-cả-hoặc-không) thì rớt',
    () => {
      const s = T3_P5_PROJECT_STEPS[0]!
      expectRot(
        s,
        sua(
          s.referenceCode,
          '(mon[0], he_so, d)\n            )\n',
          '(mon[0], he_so, d)\n            )\n            db.commit()\n',
        ),
      )
    },
    PY_TIMEOUT_MS,
  )

  it(
    'p5-s1: quên bật PRAGMA foreign_keys (khoá ngoại chỉ để trang trí) thì rớt',
    () => {
      const s = T3_P5_PROJECT_STEPS[0]!
      expectRot(s, sua(s.referenceCode, 'db.execute("PRAGMA foreign_keys = ON")', 'pass'))
    },
    PY_TIMEOUT_MS,
  )

  it(
    'p5-s2: ghép tên tài liệu thẳng vào HTML (không escape) thì rớt',
    () => {
      const s = T3_P5_PROJECT_STEPS[1]!
      expectRot(s, sua(s.referenceCode, "html.escape(tl['ten'])", "tl['ten']"))
    },
    PY_TIMEOUT_MS,
  )

  it(
    'p5-s2: kiểm quyền quên nhánh "chính chủ" thì rớt',
    () => {
      const s = T3_P5_PROJECT_STEPS[1]!
      expectRot(
        s,
        sua(s.referenceCode, 'tl["cong_khai"] or tl["chu"] == nguoi_xem', 'tl["cong_khai"]'),
      )
    },
    PY_TIMEOUT_MS,
  )

  it(
    'p5-s3: cách chậm dừng sớm (đếm sai số phép so) thì rớt',
    () => {
      const s = T3_P5_PROJECT_STEPS[2]!
      expectRot(
        s,
        sua(
          s.referenceCode,
          '                da_co = True\n',
          '                da_co = True\n                break\n',
        ),
      )
    },
    PY_TIMEOUT_MS,
  )

  it(
    'p5-s4: bỏ yêu cầu https cho địa chỉ công khai thì rớt',
    () => {
      const s = T3_P5_PROJECT_STEPS[3]!
      expectRot(s, sua(s.referenceCode, ' and not url.startswith("https://")', ' and False'))
    },
    PY_TIMEOUT_MS,
  )

  it(
    'p5-s4: chỉ kiểm kiểu của PORT, quên kiểm khoảng thì rớt',
    () => {
      const s = T3_P5_PROJECT_STEPS[3]!
      expectRot(s, sua(s.referenceCode, ' or not (1 <= int(cong) <= 65535)', ''))
    },
    PY_TIMEOUT_MS,
  )

  it(
    'p5-s5: nộp ĐÚNG ngày hạn bị tính là trễ (>= thay >) thì rớt',
    () => {
      const s = T3_P5_PROJECT_STEPS[4]!
      expectRot(s, sua(s.referenceCode, 'tre = ngay > date', 'tre = ngay >= date'))
    },
    PY_TIMEOUT_MS,
  )

  it(
    'p5-s5: tra bài TRƯỚC khi kiểm dữ liệu vào (404 trước 422) thì rớt',
    () => {
      const s = T3_P5_PROJECT_STEPS[4]!
      const kiemNgay =
        '    ngay = doc_ngay(du_lieu.get("ngay"))\n    if ngay is None:\n        raise HTTPException(422, "ngay phai co dang YYYY-MM-DD")\n'
      const traBai =
        '    bai = db.execute("SELECT han, da_nop FROM bai_tap WHERE id = ?", (bai_id,)).fetchone()\n    if bai is None:\n        raise HTTPException(404, "Khong co bai tap nay")\n'
      const doiCho = sua(sua(s.referenceCode, kiemNgay + '\n', ''), traBai, traBai + kiemNgay)
      expectRot(s, doiCho)
    },
    PY_TIMEOUT_MS,
  )
})
