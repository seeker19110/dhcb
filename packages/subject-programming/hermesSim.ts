// hermesSim — BỘ MÔ PHỎNG HERMES AGENT cho khoá ngắn "Hermes Agent — trợ lý AI cho người đi
// làm" (PR 2/4 khoá Hermes — docs/specs/2026-08-31-khoa-dieu-phoi-ai-van-phong.md §③).
//
// VẤN ĐỀ PHẢI GIẢI: khoá dạy dùng một TÁC TỬ AI thật (Hermes Agent của Nous Research), nhưng
// cổng chấm phải TẤT ĐỊNH — cùng input luôn cho cùng output — nên không thể gọi AI/mạng/Docker
// thật (đặc tả §② "KHÔNG LÀM"). Lời giải đúng khuôn gitSim.ts mô phỏng git thật: một máy ảo
// tí hon thuần TypeScript duyệt danh sách lệnh hữu hạn học viên gõ; "phản hồi của agent" là
// văn bản đóng hộp chọn tất định theo lệnh, không sinh ngẫu nhiên.
//
// Cổng CI (lessonsHermes.test.ts, từ PR 3) và trình duyệt (hermesRunner.ts) gọi CHUNG hàm
// chayLenhHermes() này nên không có khe hở "xanh ở CI, rớt ở máy học viên".
//
// LUẬT TỰ KHAI (khuôn bashSim §3.3): mỗi lượt chạy in DONG_TU_KHAI_HERMES ở dòng đầu. Bộ mô
// phỏng này KHÔNG phải Hermes thật và không được để học viên tưởng nhầm — bài học nhắc học
// viên: lệnh là lệnh thật, còn phản hồi ngoài đời do AI sinh nên sẽ khác từng lần.
//
// BỘ MÔ PHỎNG NÀY KHÔNG LÀM GÌ (bài học phải nói lại đúng danh sách này):
//   · không AI thật, không mạng, không Docker, không Telegram thật — phản hồi là văn bản
//     đóng hộp tất định;
//   · không mô phỏng dashboard web (chỉ CLI) và không mô phỏng sâu công cụ hệ sinh thái
//     (Memos/Linear/Firecrawl/Honcho/Herdr/Paperclip) — chỉ mô phỏng LUỒNG VIỆC giao —
//     theo dõi — nghiệm thu qua nhóm lệnh `giao`/`trangthai`/`duyet`/`tuchoi`;
//   · không thời gian (`Date`), không ngẫu nhiên — tất định tuyệt đối để chấm được.
//
// BA LUẬT SƯ PHẠM nạp thẳng vào máy (đặc tả §③ — điểm ăn tiền của khoá):
//   1. Việc ở `cho-duyet` KHÔNG bao giờ tự thành `xong` — chỉ lệnh `duyet` của học viên
//      chuyển được. Nghiệm thu là việc của NGƯỜI, không phải của AI.
//   2. Lệnh giao việc chứa chuỗi dạng secret (api key, mật khẩu…) → agent TỪ CHỐI kèm giải
//      thích — secret không bao giờ dán vào việc.
//   3. Việc khó hoàn tác (xoá toàn bộ…) → agent DỪNG và đòi xác nhận rõ ràng trước khi làm.

import { khongDau } from './khongDau.js'

/** Kết quả một lượt chạy — cùng hình dạng với gitSim/bashSim để dùng chung đường chấm. */
export interface HermesRunResult {
  output: string
  error?: string
}

/** Dòng tự khai in ở đầu MỌI lượt chạy (luật tự khai — khuôn bashSim). */
export const DONG_TU_KHAI_HERMES =
  '[GIA LAP] Mo phong Hermes Agent cua DHCB de hoc — khong phai AI that, khong goi mang.'

/** Trạng thái một việc trên bảng việc. Luật sư phạm 1: 'cho-duyet' → 'xong' CHỈ qua `duyet`. */
type TrangThaiViec = 'cho-duyet' | 'xong' | 'tu-choi'

interface Viec {
  id: string
  ten: string
  trangThai: TrangThaiViec
}

/** Máy ảo: toàn bộ trạng thái một lượt chạy — dựng mới mỗi lượt, không rò giữa các lượt. */
interface May {
  gateway: 'chua-cau-hinh' | 'da-cau-hinh' | 'dang-chay'
  modelChinh: string
  modelCurator: string
  profiles: string[]
  profileHienTai: string
  phien: string[]
  phienHienTai: string
  /** Đếm để đặt tên phiên tự động `phien-N` — tất định theo số lần /new. */
  soPhienDaTao: number
  kyNang: string[]
  goal: string | null
  quyen: 'hoi' | 'tu-do'
  viec: Viec[]
}

function taoMay(): May {
  return {
    gateway: 'chua-cau-hinh',
    // Tên model mặc định khớp tài liệu Hermes (model chính + curator model rẻ hơn lo nén
    // ngữ cảnh) — giá trị cụ thể chỉ để bài học có cái mà đọc, đổi model là bài tập.
    modelChinh: 'hermes-4',
    modelCurator: 'hermes-4-mini',
    profiles: ['mac-dinh'],
    profileHienTai: 'mac-dinh',
    phien: ['phien-1'],
    phienHienTai: 'phien-1',
    soPhienDaTao: 1,
    // Hai kỹ năng có sẵn để bài "Sử dụng skill" có kho mà duyệt; /learn thêm vào sau.
    kyNang: ['tom-tat-tai-lieu', 'soan-email'],
    goal: null,
    quyen: 'hoi',
    viec: [],
  }
}

/** Luật sư phạm 2 — chuỗi dạng secret trong nội dung việc: khóa API, mật khẩu, token. */
function coSecret(noiDung: string): boolean {
  const t = khongDau(noiDung)
  return (
    /\bsk-[a-z0-9]{8,}\b/.test(t) ||
    /\b(api[_ -]?key|mat khau|password|token|secret)\b\s*(la|:|=)/.test(t)
  )
}

/** Luật sư phạm 3 — việc khó hoàn tác: xoá hàng loạt, gửi hàng loạt. */
function khoHoanTac(noiDung: string): boolean {
  const t = khongDau(noiDung)
  return /\b(xoa|don sach|go bo)\b.*\b(tat ca|toan bo|het|vinh vien)\b|\bgui\b.*\btat ca (khach hang|nhan vien|danh ba)\b/.test(
    t,
  )
}

/** Xác nhận rõ ràng cho việc khó hoàn tác — học viên phải chủ động gõ thêm, không có mặc định. */
const TU_XAC_NHAN = 'CHAC CHAN'

/** Lấy phần trong cặp nháy kép đầu tiên — cách mọi lệnh nhận nội dung dài. */
function trongNhay(lenh: string): string | null {
  const m = lenh.match(/"([^"]*)"/)
  return m ? (m[1] ?? null) : null
}

interface KetQuaMotDong {
  ra?: string
  loi?: string
}

// ───────────────────────────── Từng nhóm lệnh ─────────────────────────────

function lenhHermes(may: May, phan: string[]): KetQuaMotDong {
  if (phan.length === 0) {
    return {
      ra: [
        'Hermes Agent (mo phong) — profile: ' + may.profileHienTai,
        `model: ${may.modelChinh} · curator: ${may.modelCurator}`,
        `gateway telegram: ${may.gateway} · phien hien tai: ${may.phienHienTai}`,
        'Go "hermes gateway setup" de noi Telegram, hoac /new de mo phien moi.',
      ].join('\n'),
    }
  }
  const [nhom, ...conLai] = phan
  if (nhom === 'gateway') {
    if (conLai[0] === 'setup') {
      may.gateway = 'da-cau-hinh'
      return {
        ra: [
          'Thiet lap gateway Telegram:',
          '1. Tao bot voi @BotFather, nhan ve token.',
          '2. Token da luu vao ~/.hermes/config.yaml (muc gateway).',
          'Xong — go "hermes gateway start" de chay.',
        ].join('\n'),
      }
    }
    if (conLai[0] === 'start') {
      if (may.gateway === 'chua-cau-hinh') {
        return { loi: 'gateway chua duoc cau hinh — chay "hermes gateway setup" truoc.' }
      }
      may.gateway = 'dang-chay'
      return { ra: 'Gateway Telegram dang chay — nhan tin cho bot la agent tra loi.' }
    }
    return { loi: `khong hieu "hermes gateway ${conLai.join(' ')}" — dung: setup hoac start.` }
  }
  if (nhom === 'model') {
    if (conLai.length === 0) {
      return { ra: `model chinh: ${may.modelChinh}\nmodel curator: ${may.modelCurator}` }
    }
    if (conLai[0] === 'curator') {
      const ten = conLai[1]
      if (!ten) return { loi: 'thieu ten model — dung: hermes model curator <ten>.' }
      may.modelCurator = ten
      return { ra: `Da dat model curator: ${ten} (model re lo nen ngu canh).` }
    }
    may.modelChinh = conLai[0] ?? ''
    return { ra: `Da dat model chinh: ${may.modelChinh}` }
  }
  if (nhom === 'profile') {
    if (conLai.length === 0) {
      return {
        ra: may.profiles.map((p) => (p === may.profileHienTai ? `* ${p}` : `  ${p}`)).join('\n'),
      }
    }
    if (conLai[0] === 'create') {
      const ten = conLai[1]
      if (!ten) return { loi: 'thieu ten profile — dung: hermes profile create <ten>.' }
      if (may.profiles.includes(ten)) return { loi: `profile "${ten}" da ton tai.` }
      may.profiles.push(ten)
      may.profileHienTai = ten
      return { ra: `Da tao profile "${ten}" (config/bo nho/phien tach biet) va chuyen sang no.` }
    }
    return {
      loi: `khong hieu "hermes profile ${conLai.join(' ')}" — dung: hermes profile create <ten>.`,
    }
  }
  return {
    loi: `khong hieu "hermes ${phan.join(' ')}" — dung: hermes · hermes gateway setup|start · hermes model [curator] <ten> · hermes profile [create <ten>].`,
  }
}

function lenhSlash(may: May, lenh: string): KetQuaMotDong {
  const phan = lenh.split(/\s+/)
  const dau = phan[0]
  if (dau === '/new') {
    const ten = phan[1] ?? `phien-${may.soPhienDaTao + 1}`
    if (may.phien.includes(ten))
      return { loi: `phien "${ten}" da ton tai — dung /resume ${ten} de quay lai.` }
    may.soPhienDaTao += 1
    may.phien.push(ten)
    may.phienHienTai = ten
    return {
      ra: `Da mo phien moi "${ten}" — nguyen tac: moi viec mot phien, ngu canh khong lan sang nhau.`,
    }
  }
  if (dau === '/resume') {
    const ten = phan[1]
    if (!ten) return { loi: 'thieu ten phien — dung: /resume <ten-phien>.' }
    if (!may.phien.includes(ten)) {
      return { loi: `khong co phien "${ten}" — xem lai ten, hoac /new ${ten} de mo moi.` }
    }
    may.phienHienTai = ten
    return { ra: `Da quay lai phien "${ten}" — toan bo ngu canh cu van con.` }
  }
  if (dau === '/model') return lenhHermes(may, ['model'])
  if (dau === '/skills') {
    return { ra: ['Ky nang dang co:', ...may.kyNang.map((k) => `- ${k}`)].join('\n') }
  }
  if (dau === '/learn') {
    const ten = phan[1]
    if (!ten) return { loi: 'thieu ten ky nang — dung: /learn <ten-ky-nang>.' }
    if (may.kyNang.includes(ten))
      return { loi: `ky nang "${ten}" da co — go /skills de xem danh sach.` }
    may.kyNang.push(ten)
    return {
      ra: `Da dong goi cach lam viec vua roi thanh ky nang "${ten}" — lan sau viec tuong tu se lam theo dung quy trinh nay.`,
    }
  }
  if (dau === '/goal') {
    const noiDung = trongNhay(lenh)
    const thay = phan[1] === 'thay'
    if (noiDung === null) {
      return {
        ra: may.goal
          ? `Muc tieu dang theo: ${may.goal}`
          : 'Chua co muc tieu — dat bang /goal "<muc tieu>".',
      }
    }
    if (may.goal !== null && !thay) {
      return {
        loi: `dang co muc tieu "${may.goal}" — muon thay thi go: /goal thay "${noiDung}". Muc tieu dai khac viec le: chi nen co mot cai mot luc.`,
      }
    }
    may.goal = noiDung
    return {
      ra: `Da dat muc tieu: ${noiDung}. Agent se ben bi theo muc tieu nay giua cac phien — dung /steer de lai giua chung.`,
    }
  }
  if (dau === '/steer') {
    const noiDung = trongNhay(lenh)
    if (noiDung === null) return { loi: 'thieu chi dan — dung: /steer "<chi dan>".' }
    if (may.goal === null) {
      return { loi: 'chua co muc tieu de lai — dat truoc bang /goal "<muc tieu>".' }
    }
    return { ra: `Da dieu chinh huong lam viec: ${noiDung}. Muc tieu van giu nguyen: ${may.goal}.` }
  }
  if (dau === '/permission') {
    const che = phan[1]
    if (!che)
      return {
        ra: `Che do quyen hien tai: ${may.quyen} (hoi = viec nhay cam phai hoi lai; tu-do = tu lam).`,
      }
    if (che !== 'hoi' && che !== 'tu-do') return { loi: 'che do quyen chi co: hoi hoac tu-do.' }
    may.quyen = che
    return { ra: `Da chuyen che do quyen: ${che}.` }
  }
  if (dau === '/stop') {
    return { ra: 'Da dung viec dang chay — trang thai cong viec giu nguyen, xem bang "trangthai".' }
  }
  return {
    loi: `mo phong khong lam lenh "${dau}" — cac lenh co: /new /resume /model /skills /learn /goal /steer /permission /stop.`,
  }
}

function lenhGiao(may: May, lenh: string): KetQuaMotDong {
  const noiDung = trongNhay(lenh)
  if (noiDung === null || noiDung.trim() === '') {
    return { loi: 'thieu noi dung viec — dung: giao "<viec can lam>".' }
  }
  // Luật sư phạm 2: secret dán vào việc → từ chối, KHÔNG tạo việc.
  if (coSecret(noiDung)) {
    return {
      loi: 'viec chua chuoi dang mat khau/khoa API — agent tu choi. Secret khong bao gio dan vao noi dung viec; dat vao bien moi truong/kho secret roi giao viec khong kem gia tri that.',
    }
  }
  // Luật sư phạm 3: việc khó hoàn tác → đòi xác nhận rõ ràng (trừ khi đã ở chế độ tu-do
  // — và bài học dạy vì sao KHÔNG nên bật tu-do cho loại việc này).
  if (khoHoanTac(noiDung) && may.quyen === 'hoi' && !noiDung.endsWith(TU_XAC_NHAN)) {
    return {
      loi: `viec nay kho hoan tac — agent dung lai cho xac nhan. Neu chac, giao lai voi "${TU_XAC_NHAN}" o cuoi noi dung viec.`,
    }
  }
  const id = `v${may.viec.length + 1}`
  may.viec.push({ id, ten: noiDung, trangThai: 'cho-duyet' })
  return {
    ra: [
      `Da nhan viec ${id}: ${noiDung}`,
      'Ke hoach: hieu yeu cau → lam ban nhap → tu ra soat.',
      `Xong ban nhap — trang thai: cho-duyet. Xem bang "trangthai", nghiem thu bang "duyet ${id}" hoac "tuchoi ${id}".`,
    ].join('\n'),
  }
}

function lenhBangViec(may: May, lenh: string): KetQuaMotDong {
  const phan = lenh.split(/\s+/)
  const dau = phan[0]
  if (dau === 'trangthai') {
    if (may.viec.length === 0) return { ra: 'Chua co viec nao — giao viec bang: giao "<viec>".' }
    return { ra: may.viec.map((v) => `${v.id} [${v.trangThai}] ${v.ten}`).join('\n') }
  }
  const id = phan[1]
  if (!id) return { loi: `thieu id viec — dung: ${dau} <id>. Xem id bang "trangthai".` }
  const viec = may.viec.find((v) => v.id === id)
  if (!viec) return { loi: `khong co viec "${id}" — xem danh sach bang "trangthai".` }
  if (viec.trangThai !== 'cho-duyet') {
    return {
      loi: `viec ${id} dang o trang thai "${viec.trangThai}", khong phai "cho-duyet" — khong co gi de nghiem thu.`,
    }
  }
  if (dau === 'duyet') {
    viec.trangThai = 'xong'
    return {
      ra: `Da duyet ${id} — viec chuyen sang "xong". Nghiem thu la viec cua NGUOI: chi ban chuyen duoc trang thai nay.`,
    }
  }
  // tuchoi
  const lyDo = trongNhay(lenh)
  if (lyDo === null || lyDo.trim() === '') {
    return {
      loi: 'tu choi phai kem ly do — dung: tuchoi <id> "<ly do>". Ly do ro giup lan giao sau tot hon.',
    }
  }
  viec.trangThai = 'tu-choi'
  return {
    ra: `Da tu choi ${id} (ly do: ${lyDo}). Giao lai viec voi yeu cau ro hon de agent lam lai.`,
  }
}

/** Chạy MỘT dòng lệnh trên máy — trái tim của bộ mô phỏng. */
function chayMotDong(may: May, lenh: string): KetQuaMotDong {
  if (lenh.startsWith('/')) return lenhSlash(may, lenh)
  const phan = lenh.split(/\s+/)
  const dau = phan[0]
  if (dau === 'hermes') return lenhHermes(may, phan.slice(1))
  if (dau === 'giao') return lenhGiao(may, lenh)
  if (dau === 'trangthai' || dau === 'duyet' || dau === 'tuchoi') return lenhBangViec(may, lenh)
  return {
    loi: `mo phong khong lam lenh "${dau ?? ''}" — cac lenh co: hermes… · /new /resume /model /skills /learn /goal /steer /permission /stop · giao "…" · trangthai · duyet <id> · tuchoi <id> "…".`,
  }
}

/**
 * Chạy một kịch bản lệnh của học viên — điểm vào DUY NHẤT, trình duyệt và cổng CI gọi chung.
 *
 * `lenhChuanBi` dựng sẵn bối cảnh (vd đã có việc chờ duyệt, đã có goal) mà KHÔNG in ra —
 * nhờ vậy đề bài nói "agent của bạn đang có…" mà học viên không phải gõ lại phần dựng cảnh.
 * Đúng khuôn `gitSim.chayLenh`.
 */
export function chayLenhHermes(script: string, lenhChuanBi: string[] = []): HermesRunResult {
  const may = taoMay()
  const dong: string[] = [DONG_TU_KHAI_HERMES]

  for (const lenh of lenhChuanBi) {
    const r = chayMotDong(may, lenh)
    if (r.loi) return { output: DONG_TU_KHAI_HERMES, error: `Loi khi dung boi canh: ${r.loi}` }
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
