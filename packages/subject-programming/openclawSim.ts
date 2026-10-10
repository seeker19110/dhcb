// openclawSim — BỘ MÔ PHỎNG OPENCLAW cho khoá ngắn "OpenClaw — dựng trợ lý AI của riêng bạn"
// (PR 2/3 khoá OpenClaw — docs/specs/2026-08-31-khoa-openclaw.md §③).
//
// VẤN ĐỀ PHẢI GIẢI: khoá dạy cài đặt & vận hành một trợ lý AI TỰ HOST thật (OpenClaw), nhưng
// cổng chấm phải TẤT ĐỊNH — cùng input luôn cho cùng output — nên không thể gọi AI/mạng/Docker
// thật (đặc tả §② "KHÔNG LÀM"). Lời giải đúng khuôn gitSim/hermesSim: máy ảo tí hon thuần
// TypeScript duyệt danh sách lệnh hữu hạn học viên gõ; "phản hồi của agent" là văn bản đóng
// hộp chọn tất định theo lệnh, không sinh ngẫu nhiên.
//
// Cổng CI (lessonsOpenclaw.test.ts) và trình duyệt (openclawRunner.ts) gọi CHUNG hàm
// chayLenhOpenclaw() này nên không có khe hở "xanh ở CI, rớt ở máy học viên".
//
// LUẬT TỰ KHAI (khuôn bashSim §3.3): mỗi lượt chạy in DONG_TU_KHAI_OPENCLAW ở dòng đầu.
//
// BỘ MÔ PHỎNG NÀY KHÔNG LÀM GÌ (bài học phải nói lại đúng danh sách này):
//   · không AI thật, không mạng, không Docker, không Telegram/WhatsApp thật — phản hồi là
//     văn bản đóng hộp tất định;
//   · không mô phỏng Control UI web (chỉ CLI); tên model là tên GIẢ LẬP trung tính
//     (gon-nhe/can-bang/suy-luan-sau) để nội dung không mục theo phiên bản model thật;
//   · không thời gian (`Date`), không ngẫu nhiên — cron chỉ là DỮ LIỆU, muốn chạy phải kích
//     tay bằng `openclaw cron run <id>` (đặc tả §⑤: sim không bao giờ tự "đến giờ chạy").
//
// BA LUẬT SƯ PHẠM nạp thẳng vào máy (đặc tả §③ — điểm ăn tiền của khoá):
//   1. Kênh mới thêm LUÔN ở dmPolicy chặn người lạ + allowFrom RỖNG — học viên phải tự mở
//      từng người bằng `openclaw channel allow`; tin từ người lạ bị chặn kèm giải thích.
//   2. Agent muốn chạy lệnh trên "máy thật" → vào hàng chờ duyệt, chỉ NGƯỜI `duyet` mới chạy;
//      secret dán vào chat → cảnh báo + từ chối lưu.
//   3. Gateway chưa chạy mà gọi chat/kênh → lỗi chỉ đúng nguyên nhân + gợi lệnh bật —
//      dạy tư duy "control plane trước, mọi thứ sau".

import { khongDau } from './khongDau.js'

/** Kết quả một lượt chạy — cùng hình dạng với gitSim/hermesSim để dùng chung đường chấm. */
export interface OpenclawRunResult {
  output: string
  error?: string
}

/** Dòng tự khai in ở đầu MỌI lượt chạy (luật tự khai — khuôn bashSim). */
export const DONG_TU_KHAI_OPENCLAW =
  '[GIA LAP] Mo phong OpenClaw cua DHCB de hoc — khong phai AI that, khong goi mang.'

/** Ba kênh nhắn tin trong mô phỏng — đủ cho chương C2 (đặc tả §②: iMessage/Signal chỉ nhắc
 *  tên trong lý thuyết, không có bài riêng). */
const KENH_HOP_LE = ['telegram', 'whatsapp', 'discord'] as const
type TenKenh = (typeof KENH_HOP_LE)[number]

interface Kenh {
  ten: TenKenh
  trangThai: 'cho-token' | 'da-noi'
  allowFrom: string[]
  dmPolicy: 'chan-nguoi-la' | 'mo'
}

interface CronJob {
  id: string
  lich: string
  ten: string
  bat: boolean
}

interface AgentCon {
  ten: string
  kenhGhim: string[]
}

interface ChoDuyet {
  id: string
  lenh: string
}

/** Máy ảo: toàn bộ trạng thái một lượt chạy — dựng mới mỗi lượt, không rò giữa các lượt. */
interface May {
  daCai: boolean
  gateway: 'dung' | 'dang-chay'
  modelChinh: string
  kenh: Kenh[]
  kyNang: string[]
  pluginsBat: string[]
  cron: CronJob[]
  soCron: number
  agents: AgentCon[]
  choDuyet: ChoDuyet[]
  soDuyet: number
}

/** Danh sách model của mô phỏng — tên trung tính, KHÔNG theo model thật để nội dung khoá
 *  không mục khi thị trường model đổi (câu hỏi mở ① của đặc tả). */
const MODEL_CO_SAN = ['gon-nhe', 'can-bang', 'suy-luan-sau'] as const

function taoMay(): May {
  return {
    daCai: false,
    gateway: 'dung',
    modelChinh: 'can-bang',
    kenh: [],
    // Hai kỹ năng có sẵn để bài "Kho skills" (C3) có kho mà duyệt.
    kyNang: ['tom-tat-web', 'nhac-viec'],
    pluginsBat: [],
    cron: [],
    soCron: 0,
    agents: [{ ten: 'mac-dinh', kenhGhim: [] }],
    choDuyet: [],
    soDuyet: 0,
  }
}

/** Luật sư phạm 2 — chuỗi dạng secret trong tin nhắn: khóa API, mật khẩu, token. */
function coSecret(noiDung: string): boolean {
  const t = khongDau(noiDung)
  return (
    /\bsk-[a-z0-9]{8,}\b/.test(t) ||
    /\b(api[_ -]?key|mat khau|password|token|secret)\b\s*(la|:|=)/.test(t)
  )
}

/** Luật sư phạm 2 — tin nhắn nhờ agent HÀNH ĐỘNG trên máy thật (xoá, cài, chạy lệnh…):
 *  không làm ngay mà vào hàng chờ NGƯỜI duyệt. */
function laHanhDongMayThat(noiDung: string): boolean {
  const t = khongDau(noiDung)
  return /\b(xoa|don sach|go bo|cai dat|chay lenh|tat may|khoi dong lai|gui mail)\b/.test(t)
}

/** Lấy MỌI đoạn trong nháy kép, theo thứ tự — cách các lệnh nhận nội dung dài. */
function cacDoanTrongNhay(lenh: string): string[] {
  return [...lenh.matchAll(/"([^"]*)"/g)].map((m) => m[1] ?? '')
}

interface KetQuaMotDong {
  ra?: string
  loi?: string
}

// ───────────────────────────── Từng nhóm lệnh ─────────────────────────────

function timKenh(may: May, ten: string | undefined): Kenh | KetQuaMotDong {
  if (!ten) return { loi: `thieu ten kenh — cac kenh ho tro: ${KENH_HOP_LE.join(', ')}.` }
  const kenh = may.kenh.find((k) => k.ten === ten)
  if (!kenh) {
    return {
      loi: `chua co kenh "${ten}" — them bang: openclaw channel add <kenh>. Da co: ${
        may.kenh.length === 0 ? '(chua co kenh nao)' : may.kenh.map((k) => k.ten).join(', ')
      }.`,
    }
  }
  return kenh
}

function moTaKenh(k: Kenh): string {
  const allow = k.allowFrom.length === 0 ? '(trong — chan het nguoi la)' : k.allowFrom.join(', ')
  return `${k.ten} [${k.trangThai}] dmPolicy: ${k.dmPolicy} · allowFrom: ${allow}`
}

function lenhChannel(may: May, phan: string[]): KetQuaMotDong {
  const [hanhDong, tenKenh, ...conLai] = phan
  if (hanhDong === 'add') {
    if (!tenKenh || !(KENH_HOP_LE as readonly string[]).includes(tenKenh)) {
      return {
        loi: `kenh "${tenKenh ?? ''}" khong ho tro — cac kenh co: ${KENH_HOP_LE.join(', ')}.`,
      }
    }
    if (may.kenh.some((k) => k.ten === tenKenh)) {
      return { loi: `kenh "${tenKenh}" da co roi — xem bang: openclaw channel list.` }
    }
    // Luật sư phạm 1: kênh mới LUÔN sinh ra ở trạng thái an toàn nhất.
    may.kenh.push({
      ten: tenKenh as TenKenh,
      trangThai: 'cho-token',
      allowFrom: [],
      dmPolicy: 'chan-nguoi-la',
    })
    return {
      ra: [
        `Da them kenh ${tenKenh} — trang thai: cho-token.`,
        'An toan mac dinh: dmPolicy chan-nguoi-la, allowFrom trong — KHONG ai nhan tin duoc cho toi khi ban tu mo tung nguoi (openclaw channel allow).',
        `Buoc tiep: dan token vao ~/.openclaw/openclaw.json (giu token nhu mat khau), roi chay: openclaw channel reconnect ${tenKenh}.`,
      ].join('\n'),
    }
  }
  if (hanhDong === 'list') {
    if (may.kenh.length === 0) {
      return { ra: 'Chua co kenh nao — them bang: openclaw channel add <kenh>.' }
    }
    return { ra: may.kenh.map(moTaKenh).join('\n') }
  }
  if (hanhDong === 'reconnect') {
    const k = timKenh(may, tenKenh)
    if ('loi' in k) return k as KetQuaMotDong
    const kenh = k as Kenh
    // Luật sư phạm 3: control plane trước — gateway chưa chạy thì không nối được gì.
    if (may.gateway !== 'dang-chay') {
      return {
        loi: 'gateway chua chay — kenh noi QUA gateway nen phai bat truoc: openclaw gateway start.',
      }
    }
    kenh.trangThai = 'da-noi'
    return {
      ra: `Kenh ${kenh.ten} da noi thanh cong. Nho: allowFrom dang ${
        kenh.allowFrom.length === 0 ? 'TRONG — chua ai nhan tin duoc' : kenh.allowFrom.join(', ')
      }.`,
    }
  }
  if (hanhDong === 'status') {
    const k = timKenh(may, tenKenh)
    if ('loi' in k) return k as KetQuaMotDong
    if (may.gateway !== 'dang-chay') {
      return {
        loi: 'gateway chua chay — trang thai kenh do gateway giu, bat truoc: openclaw gateway start.',
      }
    }
    return { ra: moTaKenh(k as Kenh) }
  }
  if (hanhDong === 'allow') {
    const k = timKenh(may, tenKenh)
    if ('loi' in k) return k as KetQuaMotDong
    const ai = conLai[0]
    if (!ai) return { loi: 'thieu nguoi can mo — dung: openclaw channel allow <kenh> <tai-khoan>.' }
    const kenh = k as Kenh
    if (kenh.allowFrom.includes(ai)) return { loi: `"${ai}" da nam trong allowFrom roi.` }
    kenh.allowFrom.push(ai)
    return {
      ra: `Da mo cua cho "${ai}" tren kenh ${kenh.ten}. Quyen hep nhat du dung: chi mo dung nguoi can, dung mo ca nhom.`,
    }
  }
  if (hanhDong === 'remove') {
    const k = timKenh(may, tenKenh)
    if ('loi' in k) return k as KetQuaMotDong
    may.kenh = may.kenh.filter((x) => x.ten !== (k as Kenh).ten)
    return { ra: `Da go kenh ${(k as Kenh).ten}.` }
  }
  if (hanhDong === 'test') {
    // Lệnh riêng của mô phỏng: giả một tin nhắn đến, để bài học CHO THẤY hàng rào chặn người
    // lạ hoạt động — ngoài đời không có lệnh này, bài học phải nói rõ.
    const k = timKenh(may, tenKenh)
    if ('loi' in k) return k as KetQuaMotDong
    const kenh = k as Kenh
    const ai = conLai[0]
    if (!ai) return { loi: 'thieu nguoi gui — dung: openclaw channel test <kenh> <tai-khoan>.' }
    if (kenh.trangThai !== 'da-noi') {
      return { loi: `kenh ${kenh.ten} chua noi (dang ${kenh.trangThai}) — chua nhan duoc tin.` }
    }
    if (kenh.dmPolicy === 'chan-nguoi-la' && !kenh.allowFrom.includes(ai)) {
      return {
        ra: `[mo phong tin den] "${ai}" nhan tin -> BI CHAN: khong nam trong allowFrom (dmPolicy chan-nguoi-la). Agent khong doc, khong tra loi — day la hang rao dau tien cua ban.`,
      }
    }
    return { ra: `[mo phong tin den] "${ai}" nhan tin -> DUOC NHAN, agent tra loi binh thuong.` }
  }
  return {
    loi: `khong hieu "openclaw channel ${phan.join(' ')}" — dung: add|remove|list|status|reconnect|allow|test.`,
  }
}

function lenhCron(may: May, phan: string[], lenh: string): KetQuaMotDong {
  const hanhDong = phan[0]
  if (hanhDong === 'add') {
    const doan = cacDoanTrongNhay(lenh)
    const lich = doan[0]
    const ten = doan[1]
    if (!lich || !ten) {
      return { loi: 'thieu lich hoac ten viec — dung: openclaw cron add "<lich>" "<ten viec>".' }
    }
    may.soCron += 1
    const id = `c${may.soCron}`
    may.cron.push({ id, lich, ten, bat: true })
    return {
      ra: `Da tao viec ${id}: "${ten}" — lich: ${lich}, dang bat. Mo phong KHONG tu chay theo gio (de cham bai duoc) — kich tay bang: openclaw cron run ${id}.`,
    }
  }
  if (hanhDong === 'list') {
    if (may.cron.length === 0) {
      return { ra: 'Chua co viec dinh ky nao — tao bang: openclaw cron add "<lich>" "<ten>".' }
    }
    return {
      ra: may.cron.map((c) => `${c.id} [${c.bat ? 'bat' : 'tat'}] ${c.lich} — ${c.ten}`).join('\n'),
    }
  }
  const id = phan[1]
  const job = may.cron.find((c) => c.id === id)
  if (hanhDong === 'enable' || hanhDong === 'disable' || hanhDong === 'run') {
    if (!id) return { loi: `thieu id viec — dung: openclaw cron ${hanhDong} <id>.` }
    if (!job) {
      return {
        loi: `khong co viec "${id}" — dang co: ${
          may.cron.length === 0 ? '(chua co viec nao)' : may.cron.map((c) => c.id).join(', ')
        }.`,
      }
    }
    if (hanhDong === 'enable') {
      job.bat = true
      return { ra: `Da bat viec ${id}.` }
    }
    if (hanhDong === 'disable') {
      job.bat = false
      return { ra: `Da tat viec ${id} — lich giu nguyen, chi khong chay nua.` }
    }
    if (!job.bat) return { loi: `viec ${id} dang tat — bat lai truoc: openclaw cron enable ${id}.` }
    return { ra: `Da chay viec ${id} (kich tay): "${job.ten}" — xong.` }
  }
  return {
    loi: `khong hieu "openclaw cron ${phan.join(' ')}" — dung: add "<lich>" "<ten>" · list · enable <id> · disable <id> · run <id>.`,
  }
}

function lenhAgents(may: May, phan: string[]): KetQuaMotDong {
  const [hanhDong, ten, kenh] = phan
  if (hanhDong === undefined || hanhDong === 'list') {
    return {
      ra: may.agents
        .map(
          (a) =>
            `${a.ten} — kenh ghim: ${a.kenhGhim.length === 0 ? '(khong)' : a.kenhGhim.join(', ')}`,
        )
        .join('\n'),
    }
  }
  if (hanhDong === 'add') {
    if (!ten) return { loi: 'thieu ten agent — dung: openclaw agents add <ten>.' }
    if (may.agents.some((a) => a.ten === ten)) return { loi: `agent "${ten}" da ton tai.` }
    may.agents.push({ ten, kenhGhim: [] })
    return { ra: `Da tao agent "${ten}" — workspace/bo nho/skill tach biet voi cac agent khac.` }
  }
  const agent = may.agents.find((a) => a.ten === ten)
  if (hanhDong === 'delete') {
    if (!agent) return { loi: `khong co agent "${ten ?? ''}" — xem: openclaw agents list.` }
    if (agent.ten === 'mac-dinh') return { loi: 'khong xoa duoc agent mac-dinh.' }
    may.agents = may.agents.filter((a) => a.ten !== agent.ten)
    return { ra: `Da xoa agent "${agent.ten}".` }
  }
  if (hanhDong === 'bind' || hanhDong === 'unbind') {
    if (!agent) {
      return { loi: `khong co agent "${ten ?? ''}" — tao truoc: openclaw agents add <ten>.` }
    }
    if (!kenh) return { loi: `thieu ten kenh — dung: openclaw agents ${hanhDong} <agent> <kenh>.` }
    if (hanhDong === 'bind') {
      if (!may.kenh.some((k) => k.ten === kenh)) {
        return { loi: `chua co kenh "${kenh}" — them truoc: openclaw channel add ${kenh}.` }
      }
      if (agent.kenhGhim.includes(kenh)) return { loi: `agent "${agent.ten}" da ghim ${kenh} roi.` }
      agent.kenhGhim.push(kenh)
      return { ra: `Da ghim kenh ${kenh} vao agent "${agent.ten}" — tin tu kenh nay do no lo.` }
    }
    if (!agent.kenhGhim.includes(kenh)) {
      return { loi: `agent "${agent.ten}" khong ghim kenh ${kenh}.` }
    }
    agent.kenhGhim = agent.kenhGhim.filter((k) => k !== kenh)
    return { ra: `Da bo ghim kenh ${kenh} khoi agent "${agent.ten}".` }
  }
  return {
    loi: `khong hieu "openclaw agents ${phan.join(' ')}" — dung: list · add <ten> · delete <ten> · bind <agent> <kenh> · unbind <agent> <kenh>.`,
  }
}

function lenhOpenclaw(may: May, phan: string[], lenh: string): KetQuaMotDong {
  const [nhom, ...conLai] = phan
  if (nhom === 'onboard') {
    if (may.daCai) return { loi: 'da onboard roi — xem suc khoe he thong bang: openclaw doctor.' }
    may.daCai = true
    return {
      ra: [
        'Chao mung den OpenClaw! Trinh huong dan da lam 3 viec:',
        '1. Kiem tra ket noi model — OK (model chinh: can-bang).',
        '2. Tao workspace tai ~/.openclaw/ (config: openclaw.json).',
        '3. Chuan bi Gateway — chua chay, bat bang: openclaw gateway start.',
      ].join('\n'),
    }
  }
  // Mọi lệnh còn lại đều cần đã onboard — như ngoài đời: chưa có workspace thì chưa có gì.
  if (!may.daCai) {
    return { loi: 'chua cai dat/onboard — chay truoc: openclaw onboard.' }
  }
  if (nhom === 'gateway') {
    const hanhDong = conLai[0]
    if (hanhDong === 'start') {
      if (may.gateway === 'dang-chay') return { loi: 'gateway dang chay roi.' }
      may.gateway = 'dang-chay'
      return {
        ra: 'Gateway dang chay — control plane cua ban da mo: phien, cong cu, kenh deu di qua day.',
      }
    }
    if (hanhDong === 'stop') {
      if (may.gateway === 'dung') return { loi: 'gateway dang dung san roi.' }
      may.gateway = 'dung'
      return { ra: 'Da dung gateway — moi kenh tam ngat, cau hinh giu nguyen.' }
    }
    if (hanhDong === 'status') {
      return {
        ra: `gateway: ${may.gateway} · kenh: ${may.kenh.length} · agent: ${may.agents.length} · model: ${may.modelChinh}`,
      }
    }
    return { loi: `khong hieu "openclaw gateway ${conLai.join(' ')}" — dung: start|stop|status.` }
  }
  if (nhom === 'dashboard') {
    if (may.gateway !== 'dang-chay') {
      return {
        loi: 'gateway chua chay — dashboard chi la cua so nhin vao gateway, bat truoc: openclaw gateway start.',
      }
    }
    return {
      ra: 'Da mo Control UI tai http://localhost:18789 (mo phong — khong mo trinh duyet that). Dashboard de NHIN: phien, kenh, lich su; con LAM thi dung CLI.',
    }
  }
  if (nhom === 'chat') {
    const tin = cacDoanTrongNhay(lenh)[0]
    if (tin === undefined || tin.trim() === '') {
      return { loi: 'thieu noi dung — dung: openclaw chat "<tin nhan>".' }
    }
    // Luật sư phạm 3: chat đi qua gateway.
    if (may.gateway !== 'dang-chay') {
      return { loi: 'gateway chua chay — chat di qua gateway, bat truoc: openclaw gateway start.' }
    }
    // Luật sư phạm 2a: secret dán vào chat → từ chối lưu.
    if (coSecret(tin)) {
      return {
        loi: 'tin nhan chua chuoi dang mat khau/khoa API — agent tu choi luu. Secret khong dan vao chat: dat vao ~/.openclaw/openclaw.json hoac kho secret, roi chi noi ten viec.',
      }
    }
    // Luật sư phạm 2b: việc đụng máy thật → vào hàng chờ NGƯỜI duyệt.
    if (laHanhDongMayThat(tin)) {
      may.soDuyet += 1
      const id = `d${may.soDuyet}`
      may.choDuyet.push({ id, lenh: tin })
      return {
        ra: `Agent (mo phong): viec nay dung den may that nen toi KHONG tu lam — da xep vao hang cho duyet, id ${id}. Ban quyet: duyet ${id} hoac tuchoi ${id} "<ly do>".`,
      }
    }
    return {
      ra: `Agent (mo phong): da nhan "${tin}" — ngoai doi phan hoi do AI sinh nen moi lan mot khac; o day co dinh de cham bai duoc.`,
    }
  }
  if (nhom === 'doctor') {
    const kenhLoi = may.kenh.filter((k) => k.trangThai === 'cho-token')
    return {
      ra: [
        'openclaw doctor — kiem tra suc khoe:',
        '[OK] workspace ~/.openclaw/ ton tai, config doc duoc.',
        may.gateway === 'dang-chay'
          ? '[OK] gateway dang chay.'
          : '[CHU Y] gateway dang dung — bat bang: openclaw gateway start.',
        kenhLoi.length === 0
          ? `[OK] ${may.kenh.length} kenh, khong kenh nao treo.`
          : `[CHU Y] ${kenhLoi.length} kenh cho-token: ${kenhLoi.map((k) => k.ten).join(', ')} — dan token roi chay openclaw channel reconnect.`,
        `[OK] model chinh: ${may.modelChinh}.`,
      ].join('\n'),
    }
  }
  if (nhom === 'models') {
    if (conLai.length === 0) {
      return {
        ra: MODEL_CO_SAN.map((m) => (m === may.modelChinh ? `* ${m}` : `  ${m}`)).join('\n'),
      }
    }
    if (conLai[0] === 'use') {
      const ten = conLai[1]
      if (!ten || !(MODEL_CO_SAN as readonly string[]).includes(ten)) {
        return {
          loi: `khong co model "${ten ?? ''}" — cac model co: ${MODEL_CO_SAN.join(', ')}.`,
        }
      }
      may.modelChinh = ten
      return { ra: `Da chuyen model chinh: ${ten}.` }
    }
    return { loi: `khong hieu "openclaw models ${conLai.join(' ')}" — dung: models [use <ten>].` }
  }
  if (nhom === 'channel') return lenhChannel(may, conLai)
  if (nhom === 'skills') {
    if (conLai.length === 0 || conLai[0] === 'list') {
      return { ra: ['Ky nang dang co:', ...may.kyNang.map((k) => `- ${k}`)].join('\n') }
    }
    if (conLai[0] === 'info') {
      const ten = conLai[1]
      if (!ten || !may.kyNang.includes(ten)) {
        return { loi: `khong co ky nang "${ten ?? ''}" — xem kho: openclaw skills.` }
      }
      return { ra: `Ky nang ${ten}: quy trinh dong goi san, agent gap viec khop la lam theo.` }
    }
    return { loi: `khong hieu "openclaw skills ${conLai.join(' ')}" — dung: skills [info <ten>].` }
  }
  if (nhom === 'cron') return lenhCron(may, conLai, lenh)
  if (nhom === 'agents') return lenhAgents(may, conLai)
  return {
    loi: `khong hieu "openclaw ${phan.join(' ')}" — dung: onboard · gateway start|stop|status · dashboard · chat "…" · doctor · models [use <ten>] · channel … · skills … · cron … · agents ….`,
  }
}

function lenhSlash(may: May, lenh: string): KetQuaMotDong {
  const phan = lenh.split(/\s+/)
  const dau = phan[0]
  if (!may.daCai) return { loi: 'chua cai dat/onboard — chay truoc: openclaw onboard.' }
  if (dau === '/config') {
    return {
      ra: [
        'Cau hinh (~/.openclaw/openclaw.json):',
        `model chinh: ${may.modelChinh}`,
        `kenh: ${may.kenh.length === 0 ? '(chua co)' : may.kenh.map((k) => k.ten).join(', ')}`,
        `agent: ${may.agents.map((a) => a.ten).join(', ')}`,
      ].join('\n'),
    }
  }
  if (dau === '/plugins') {
    const kho = ['ghi-chu', 'lich-hop']
    if (phan[1] === 'bat') {
      const ten = phan[2]
      if (!ten || !kho.includes(ten)) {
        return { loi: `khong co plugin "${ten ?? ''}" — kho co: ${kho.join(', ')}.` }
      }
      if (may.pluginsBat.includes(ten)) return { loi: `plugin "${ten}" da bat roi.` }
      may.pluginsBat.push(ten)
      return { ra: `Da bat plugin ${ten}.` }
    }
    return {
      ra: kho.map((p) => `${may.pluginsBat.includes(p) ? '[bat]' : '[tat]'} ${p}`).join('\n'),
    }
  }
  return { loi: `mo phong khong lam lenh "${dau}" — cac lenh gach cheo co: /config /plugins.` }
}

function lenhDuyet(may: May, phan: string[], lenh: string): KetQuaMotDong {
  const dau = phan[0]
  const id = phan[1]
  if (!id) return { loi: `thieu id — dung: ${dau} <id>. Xem hang cho o output luc agent xep viec.` }
  const muc = may.choDuyet.find((d) => d.id === id)
  if (!muc) {
    return {
      loi: `khong co muc cho duyet "${id}" — dang cho: ${
        may.choDuyet.length === 0 ? '(trong)' : may.choDuyet.map((d) => d.id).join(', ')
      }.`,
    }
  }
  may.choDuyet = may.choDuyet.filter((d) => d.id !== id)
  if (dau === 'duyet') {
    return {
      ra: `Da duyet ${id} — agent thuc hien: "${muc.lenh}" (mo phong). Viec dung may that CHI chay sau khi NGUOI duyet.`,
    }
  }
  const lyDo = cacDoanTrongNhay(lenh)[0]
  if (lyDo === undefined || lyDo.trim() === '') {
    return { loi: 'tu choi phai kem ly do — dung: tuchoi <id> "<ly do>".' }
  }
  return { ra: `Da tu choi ${id} (ly do: ${lyDo}) — agent khong lam va ghi nho ly do.` }
}

/** Chạy MỘT dòng lệnh trên máy — trái tim của bộ mô phỏng. */
function chayMotDong(may: May, lenh: string): KetQuaMotDong {
  if (lenh.startsWith('/')) return lenhSlash(may, lenh)
  const phan = lenh.split(/\s+/)
  const dau = phan[0]
  if (dau === 'openclaw') return lenhOpenclaw(may, phan.slice(1), lenh)
  if (dau === 'duyet' || dau === 'tuchoi') return lenhDuyet(may, phan, lenh)
  return {
    loi: `mo phong khong lam lenh "${dau ?? ''}" — cac lenh co: openclaw … · /config /plugins · duyet <id> · tuchoi <id> "…".`,
  }
}

/**
 * Chạy một kịch bản lệnh của học viên — điểm vào DUY NHẤT, trình duyệt và cổng CI gọi chung.
 *
 * `lenhChuanBi` dựng sẵn bối cảnh (vd đã onboard, đã có kênh) mà KHÔNG in ra — nhờ vậy đề
 * bài nói "máy của bạn đang có…" mà học viên không phải gõ lại phần dựng cảnh. Đúng khuôn
 * `gitSim.chayLenh`/`hermesSim.chayLenhHermes`.
 */
export function chayLenhOpenclaw(script: string, lenhChuanBi: string[] = []): OpenclawRunResult {
  const may = taoMay()
  const dong: string[] = [DONG_TU_KHAI_OPENCLAW]

  for (const lenh of lenhChuanBi) {
    const r = chayMotDong(may, lenh)
    if (r.loi) return { output: DONG_TU_KHAI_OPENCLAW, error: `Loi khi dung boi canh: ${r.loi}` }
  }

  for (const raw of script.split('\n')) {
    const lenh = raw.trim()
    if (!lenh || lenh.startsWith('#')) continue
    dong.push(`$ ${lenh}`)
    const r = chayMotDong(may, lenh)
    if (r.loi) {
      // Lệnh sai không phải "sự cố hệ thống" mà là một phần bài học: giữ dòng `loi:` cho học
      // viên đọc, trường error cho bộ chấm đánh rớt ca đó (đúng khuôn gitSim).
      dong.push(`loi: ${r.loi}`)
      return { output: dong.join('\n'), error: r.loi }
    }
    if (r.ra) dong.push(r.ra)
  }
  return { output: dong.join('\n') }
}
