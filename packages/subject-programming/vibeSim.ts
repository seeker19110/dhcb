// vibeSim — BỘ MÔ PHỎNG TÁC TỬ AI VIẾT CODE cho khoá ngắn "Vibe Code — từ số 0 đến chuyên
// gia" (docs/specs/2026-08-31-khoa-vibe-code.md §③).
//
// VẤN ĐỀ PHẢI GIẢI: khoá dạy cách LẬP TRÌNH BẰNG MÔ TẢ (vibe coding) với một tác tử AI,
// nhưng cổng chấm phải TẤT ĐỊNH — cùng input luôn cho cùng output — nên không thể gọi AI
// thật (đặc tả §② "KHÔNG LÀM"). Lời giải đúng khuôn gitSim/hermesSim: máy ảo tí hon thuần
// TypeScript duyệt danh sách lệnh hữu hạn học viên gõ; "code AI sinh ra" là tóm tắt diff
// đóng hộp chọn tất định theo lệnh, không sinh ngẫu nhiên.
//
// Cổng CI (lessonsVibe.test.ts) và trình duyệt (vibeRunner.ts) gọi CHUNG hàm chayLenhVibe()
// này nên không có khe hở "xanh ở CI, rớt ở máy học viên".
//
// LUẬT TỰ KHAI (khuôn bashSim §3.3): mỗi lượt chạy in DONG_TU_KHAI_VIBE ở dòng đầu. Bộ mô
// phỏng KHÔNG phải một sản phẩm thương mại nào (Cursor/Claude Code/Lovable…) và không được
// để học viên tưởng nhầm — bài học nhắc: quy trình là quy trình thật, còn phản hồi ngoài
// đời do AI sinh nên khác từng lần.
//
// BỘ MÔ PHỎNG NÀY KHÔNG LÀM GÌ (bài học phải nói lại đúng danh sách này):
//   · không AI thật, không mạng, không chạy code thật — "phần mềm" chỉ tồn tại dưới dạng
//     bảng trạng thái + tóm tắt diff đóng hộp;
//   · không hệ thống file, không trình soạn thảo — khoá dạy QUY TRÌNH điều khiển AI, không
//     dạy cú pháp (việc của xương sống P1–P6);
//   · không thời gian (`Date`), không ngẫu nhiên — tất định tuyệt đối để chấm được.
//
// BỐN LUẬT SƯ PHẠM nạp thẳng vào máy (đặc tả §③ — điểm ăn tiền của khoá):
//   1. Mô tả MƠ HỒ (quá ngắn) → agent hỏi lại 3 câu, KHÔNG xây gì. Đời thật agent đo bằng
//      ngữ nghĩa; mô phỏng phải tất định nên đo bằng độ dài — bài học nói rõ điều này.
//   2. `nhan` khi CHƯA `xemdiff` bản nháp đó → từ chối. Không nhận code chưa đọc; `sua`
//      xong phải xem lại (cờ đã-xem bị xoá).
//   3. `trienkhai` khi test chưa XANH (chưa chạy / đỏ / đã nhận thêm sau lần kiểm cuối)
//      → từ chối. Test là trọng tài, không phải cảm giác.
//   4. Mô tả chứa chuỗi dạng secret (khoá API, mật khẩu, token) → từ chối thẳng.
//
// CƠ CHẾ CA BIÊN (bài C2): bản nháp mang cờ quenCaBien trừ khi mô tả gốc hoặc một lần `sua`
// nhắc từ khoá ca biên. `kiemtra` gặp tính năng quên ca biên → 1 test đỏ nêu đích danh.
// AI ngoài đời viết ca chính rất giỏi và quên ca biên rất đều — nén thành cơ chế tất định.

import { khongDau } from './khongDau.js'

/** Kết quả một lượt chạy — cùng hình dạng với gitSim/hermesSim để dùng chung đường chấm. */
export interface VibeRunResult {
  output: string
  error?: string
}

/** Dòng tự khai in ở đầu MỌI lượt chạy (luật tự khai — khuôn bashSim). */
export const DONG_TU_KHAI_VIBE =
  '[GIA LAP] Mo phong tac tu AI viet code cua DHCB de hoc — khong phai AI that, khong chay code that.'

/** Luật 1 — ngưỡng mơ hồ: nội dung (bỏ dấu, cắt khoảng trắng) ngắn hơn số này là mơ hồ. */
const NGUONG_MO_HO = 25

type TrangThaiNhap = 'cho-xem' | 'da-nhan'

interface BanNhap {
  id: string
  ten: string
  trangThai: TrangThaiNhap
  daXemDiff: boolean
  /** Cơ chế ca biên — true khi mô tả/góp ý sửa CHƯA nhắc từ khoá ca biên nào. */
  quenCaBien: boolean
}

interface Moc {
  ten: string
  /** Số tính năng ĐÃ NHẬN tại thời điểm lưu — `quaylai` cắt danh sách về con số này. */
  soDaNhan: number
}

/** Máy ảo: toàn bộ trạng thái một lượt chạy — dựng mới mỗi lượt, không rò giữa các lượt. */
interface May {
  nhap: BanNhap[]
  /** Đếm để đặt id bản nháp `vN` — tất định theo số lần mota. */
  soNhapDaTao: number
  test: 'chua-chay' | 'xanh' | 'do'
  moc: Moc[]
  daTrienKhai: boolean
}

function taoMay(): May {
  return { nhap: [], soNhapDaTao: 0, test: 'chua-chay', moc: [], daTrienKhai: false }
}

/** Luật 4 — chuỗi dạng secret trong mô tả: khoá API, mật khẩu, token. */
function coSecret(noiDung: string): boolean {
  const t = khongDau(noiDung)
  return (
    /\bsk-[a-z0-9]{8,}\b/.test(t) ||
    /\b(api[_ -]?key|mat khau|password|token|secret)\b\s*(la|:|=)/.test(t)
  )
}

/** Cơ chế ca biên — mô tả/góp ý có nhắc ca biên không (rỗng, số 0, âm, quá dài, giới hạn, lỗi). */
function coNhacCaBien(noiDung: string): boolean {
  const t = khongDau(noiDung)
  return /\b(rong|so 0|bang 0|khong co|am|qua dai|gioi han|loi|sai)\b/.test(t)
}

/** Lấy phần trong cặp nháy kép đầu tiên — cách mọi lệnh nhận nội dung dài. */
function trongNhay(lenh: string): string | null {
  const m = lenh.match(/"([^"]*)"/)
  return m ? (m[1] ?? null) : null
}

interface KetQuaMotDong {
  ra?: string
  loi?: string
}

/** Luật 1 — ba câu hỏi làm rõ agent in ra khi mô tả mơ hồ (đóng hộp, tất định). */
const CAU_HOI_LAM_RO = [
  'Mo ta qua mo ho — agent hoi lai truoc khi xay (khong doan mo):',
  '1. Ai dung tinh nang nay va de lam gi?',
  '2. Du lieu vao la gi, ket qua mong doi trong ra sao?',
  '3. Truong hop dac biet nao phai xu ly (rong, so 0, qua dai)?',
  'Mo ta lai day du hon roi giao lai.',
].join('\n')

// ───────────────────────────── Từng nhóm lệnh ─────────────────────────────

function lenhVibe(may: May): KetQuaMotDong {
  const choXem = may.nhap.filter((n) => n.trangThai === 'cho-xem')
  const daNhan = may.nhap.filter((n) => n.trangThai === 'da-nhan')
  const mocCuoi = may.moc[may.moc.length - 1]
  return {
    ra: [
      'Du an (mo phong) — tac tu AI viet code',
      `tinh nang da nhan: ${daNhan.length} · ban nhap cho xem: ${choXem.length}`,
      `test: ${may.test} · moc gan nhat: ${mocCuoi ? mocCuoi.ten : 'chua co'}`,
      `trien khai: ${may.daTrienKhai ? 'da len song' : 'chua'}`,
      'Giao viec bang: mota "<yeu cau>". Xem ke hoach truoc bang: kehoach "<yeu cau>".',
    ].join('\n'),
  }
}

/** Kiểm chung cho mota/kehoach: secret trước (từ chối thẳng), rồi mơ hồ (hỏi lại). */
function kiemNoiDungGiao(noiDung: string): KetQuaMotDong | null {
  if (coSecret(noiDung)) {
    return {
      loi: 'mo ta chua chuoi dang mat khau/khoa API — agent tu choi. Secret khong bao gio dan vao mo ta: dat vao bien moi truong roi mo ta viec khong kem gia tri that.',
    }
  }
  if (khongDau(noiDung).trim().length < NGUONG_MO_HO) {
    return { loi: CAU_HOI_LAM_RO }
  }
  return null
}

function lenhMota(may: May, lenh: string): KetQuaMotDong {
  const noiDung = trongNhay(lenh)
  if (noiDung === null || noiDung.trim() === '') {
    return { loi: 'thieu noi dung — dung: mota "<yeu cau day du>".' }
  }
  const chan = kiemNoiDungGiao(noiDung)
  if (chan) return chan
  const id = `v${may.soNhapDaTao + 1}`
  may.soNhapDaTao += 1
  may.nhap.push({
    id,
    ten: noiDung,
    trangThai: 'cho-xem',
    daXemDiff: false,
    quenCaBien: !coNhacCaBien(noiDung),
  })
  return {
    ra: [
      `Da hieu yeu cau. Agent viet xong ban nhap ${id}: ${noiDung}`,
      `trang thai: cho-xem — doc truoc bang "xemdiff ${id}", roi "nhan ${id}" hoac "sua ${id}" kem gop y.`,
    ].join('\n'),
  }
}

function lenhKeHoach(lenh: string): KetQuaMotDong {
  const noiDung = trongNhay(lenh)
  if (noiDung === null || noiDung.trim() === '') {
    return { loi: 'thieu noi dung — dung: kehoach "<yeu cau day du>".' }
  }
  const chan = kiemNoiDungGiao(noiDung)
  if (chan) return chan
  return {
    ra: [
      `Ke hoach cho: ${noiDung}`,
      '1. Lam ro du lieu vao/ra va cac truong hop dac biet.',
      '2. Dung phan loi chinh, chua co giao dien.',
      '3. Viet test cho ca chinh + ca bien.',
      '4. Noi giao dien, chay thu tung buoc.',
      'Chua dung vao code — dong y voi ke hoach thi giao bang: mota "<yeu cau>".',
    ].join('\n'),
  }
}

function timNhap(may: May, id: string | undefined, lenh: string): BanNhap | KetQuaMotDong {
  if (!id) return { loi: `thieu id ban nhap — dung: ${lenh} <id>. Xem id bang "vibe".` }
  const n = may.nhap.find((x) => x.id === id)
  if (!n) return { loi: `khong co ban nhap "${id}" — xem danh sach bang "vibe".` }
  return n
}

function lenhXemDiff(may: May, id: string | undefined): KetQuaMotDong {
  const n = timNhap(may, id, 'xemdiff')
  if (!('id' in n)) return n
  n.daXemDiff = true
  return {
    ra: [
      `diff cua ${n.id} (${n.ten}):`,
      `+ them ham xu ly chinh cho: ${n.ten}`,
      '+ noi ham vao giao dien, hien ket qua ra man hinh',
      n.quenCaBien
        ? '(chua thay nhanh xu ly ca bien — de y khi doc)'
        : '+ them nhanh xu ly ca bien nhu mo ta yeu cau',
      `Da danh dau DA XEM — gio "nhan ${n.id}" hoac "sua ${n.id}" kem gop y.`,
    ].join('\n'),
  }
}

function lenhGiaiThich(may: May, id: string | undefined): KetQuaMotDong {
  const n = timNhap(may, id, 'giaithich')
  if (!('id' in n)) return n
  return {
    ra: [
      `Giai thich ${n.id} bang loi thuong:`,
      `Phan nay lam viec: ${n.ten}.`,
      'Cach chay: nhan du lieu vao → xu ly o ham chinh → tra ket qua cho giao dien.',
      'Hoi tiep duoc: vi sao chon cach nay, doi cho nao thi anh huong gi.',
    ].join('\n'),
  }
}

function lenhNhan(may: May, id: string | undefined): KetQuaMotDong {
  const n = timNhap(may, id, 'nhan')
  if (!('id' in n)) return n
  if (n.trangThai === 'da-nhan') return { loi: `ban nhap ${n.id} da duoc nhan roi.` }
  // Luật 2: không nhận code chưa đọc.
  if (!n.daXemDiff) {
    return {
      loi: `chua xem diff cua ${n.id} — khong nhan code chua doc. Chay "xemdiff ${n.id}" truoc: nguoi chiu trach nhiem la ban, khong phai AI.`,
    }
  }
  n.trangThai = 'da-nhan'
  // Nhận thêm code là phải kiểm lại — test quay về chưa chạy (luật 3 dựa vào đây).
  may.test = 'chua-chay'
  return {
    ra: `Da nhan ${n.id} vao du an. Test quay ve "chua-chay" — chay "kiemtra" truoc khi trien khai.`,
  }
}

function lenhSua(may: May, lenh: string): KetQuaMotDong {
  const phan = lenh.split(/\s+/)
  const n = timNhap(may, phan[1], 'sua')
  if (!('id' in n)) return n
  const gopY = trongNhay(lenh)
  if (gopY === null || gopY.trim() === '') {
    return {
      loi: 'sua phai kem gop y — dung: sua <id> "<gop y cu the>". Gop y ro thi AI sua trung.',
    }
  }
  n.trangThai = 'cho-xem'
  n.daXemDiff = false
  if (coNhacCaBien(gopY)) n.quenCaBien = false
  if (may.nhap.some((x) => x.trangThai === 'da-nhan') === false) may.test = 'chua-chay'
  return {
    ra: [
      `Agent sua ${n.id} theo gop y: ${gopY}`,
      `trang thai: cho-xem — ban sua la ban MOI, doc lai bang "xemdiff ${n.id}" roi moi nhan.`,
    ].join('\n'),
  }
}

function lenhKiemTra(may: May): KetQuaMotDong {
  const daNhan = may.nhap.filter((n) => n.trangThai === 'da-nhan')
  if (daNhan.length === 0) {
    return { loi: 'chua co tinh nang nao duoc nhan — khong co gi de kiem. Nhan ban nhap truoc.' }
  }
  const dong: string[] = []
  const choXem = may.nhap.filter((n) => n.trangThai === 'cho-xem')
  if (choXem.length > 0) {
    dong.push(`(luu y: con ${choXem.length} ban nhap cho xem — chua duoc tinh vao du an)`)
  }
  const quen = daNhan.filter((n) => n.quenCaBien)
  if (quen.length > 0) {
    may.test = 'do'
    dong.push(`ket qua: ${daNhan.length - quen.length} xanh, ${quen.length} do`)
    for (const n of quen) {
      dong.push(`DO ${n.id} (${n.ten}): quen ca bien — chuoi rong/so 0 lam ket qua sai.`)
    }
    dong.push('Sua bang: sua <id> "<gop y co nhac ca bien>", xem lai diff, nhan lai, kiem lai.')
  } else {
    may.test = 'xanh'
    dong.push(`ket qua: ${daNhan.length} xanh, 0 do — xanh het.`)
  }
  return { ra: dong.join('\n') }
}

function lenhLuu(may: May, lenh: string): KetQuaMotDong {
  const ten = trongNhay(lenh)
  if (ten === null || ten.trim() === '') {
    return { loi: 'thieu ten moc — dung: luu "<ten moc de hieu>".' }
  }
  const soDaNhan = may.nhap.filter((n) => n.trangThai === 'da-nhan').length
  may.moc.push({ ten, soDaNhan })
  return {
    ra: `Da luu moc "${ten}" (${soDaNhan} tinh nang). Truoc moi thay doi lon, luu mot moc — sai thi "quaylai" khong so hai.`,
  }
}

function lenhLichSu(may: May): KetQuaMotDong {
  if (may.moc.length === 0) {
    return { ra: 'Chua co moc nao — luu bang: luu "<ten moc>".' }
  }
  return {
    ra: may.moc.map((m, i) => `${i + 1}. ${m.ten} (${m.soDaNhan} tinh nang)`).join('\n'),
  }
}

function lenhQuayLai(may: May): KetQuaMotDong {
  const moc = may.moc[may.moc.length - 1]
  if (!moc) {
    return {
      loi: 'chua co moc nao de quay lai — day la ly do phai "luu" TRUOC khi cho AI lam thay doi lon.',
    }
  }
  // Cắt các tính năng nhận SAU mốc: duyệt theo thứ tự nhận, giữ đúng soDaNhan cái đầu.
  let conLai = moc.soDaNhan
  const boDi: string[] = []
  for (const n of may.nhap) {
    if (n.trangThai !== 'da-nhan') continue
    if (conLai > 0) {
      conLai -= 1
    } else {
      n.trangThai = 'cho-xem'
      n.daXemDiff = false
      boDi.push(n.id)
    }
  }
  may.test = 'chua-chay'
  return {
    ra: [
      `Da quay ve moc "${moc.ten}".`,
      boDi.length > 0
        ? `Cac ban nhan sau moc quay ve cho-xem: ${boDi.join(', ')} — khong mat, chi go ra khoi du an.`
        : 'Khong co tinh nang nao nhan sau moc — du an giu nguyen.',
      'Test quay ve "chua-chay".',
    ].join('\n'),
  }
}

function lenhTrienKhai(may: May): KetQuaMotDong {
  // Luật 3: test là trọng tài — chưa xanh (chưa chạy / đỏ / vừa nhận thêm) thì không lên sóng.
  if (may.test !== 'xanh') {
    return {
      loi: `test dang "${may.test}" — khong trien khai. Chay "kiemtra" cho xanh het roi moi len song: cam giac "chac chay duoc" khong phai bang chung.`,
    }
  }
  may.daTrienKhai = true
  return {
    ra: [
      'Da trien khai: https://du-an-cua-ban.vibe.app (gia lap — khong co trang that)',
      'Nho: moi lan nhan them tinh nang, test quay ve chua-chay — kiem lai truoc lan len song sau.',
    ].join('\n'),
  }
}

/** Chạy MỘT dòng lệnh trên máy — trái tim của bộ mô phỏng. */
function chayMotDong(may: May, lenh: string): KetQuaMotDong {
  const phan = lenh.split(/\s+/)
  const dau = phan[0]
  if (dau === 'vibe') return lenhVibe(may)
  if (dau === 'mota') return lenhMota(may, lenh)
  if (dau === 'kehoach') return lenhKeHoach(lenh)
  if (dau === 'xemdiff') return lenhXemDiff(may, phan[1])
  if (dau === 'giaithich') return lenhGiaiThich(may, phan[1])
  if (dau === 'nhan') return lenhNhan(may, phan[1])
  if (dau === 'sua') return lenhSua(may, lenh)
  if (dau === 'kiemtra') return lenhKiemTra(may)
  if (dau === 'luu') return lenhLuu(may, lenh)
  if (dau === 'lichsu') return lenhLichSu(may)
  if (dau === 'quaylai') return lenhQuayLai(may)
  if (dau === 'trienkhai') return lenhTrienKhai(may)
  return {
    loi: `mo phong khong lam lenh "${dau ?? ''}" — cac lenh co: vibe · mota "…" · kehoach "…" · xemdiff <id> · giaithich <id> · nhan <id> · sua <id> "…" · kiemtra · luu "…" · lichsu · quaylai · trienkhai.`,
  }
}

/**
 * Chạy một kịch bản lệnh của học viên — điểm vào DUY NHẤT, trình duyệt và cổng CI gọi chung.
 *
 * `lenhChuanBi` dựng sẵn bối cảnh (vd đã có bản nháp chờ xem, đã có mốc) mà KHÔNG in ra —
 * nhờ vậy đề bài nói "dự án của bạn đang có…" mà học viên không phải gõ lại phần dựng cảnh.
 * Đúng khuôn `gitSim.chayLenh`/`chayLenhHermes`.
 */
export function chayLenhVibe(script: string, lenhChuanBi: string[] = []): VibeRunResult {
  const may = taoMay()
  const dong: string[] = [DONG_TU_KHAI_VIBE]

  for (const lenh of lenhChuanBi) {
    const r = chayMotDong(may, lenh)
    if (r.loi) return { output: DONG_TU_KHAI_VIBE, error: `Loi khi dung boi canh: ${r.loi}` }
  }

  for (const raw of script.split('\n')) {
    const lenh = raw.trim()
    if (!lenh || lenh.startsWith('#')) continue
    dong.push(`$ ${lenh}`)
    const r = chayMotDong(may, lenh)
    if (r.loi) {
      // Lệnh sai không phải "sự cố hệ thống" mà là một phần bài học: giữ dòng `loi:` cho học
      // viên đọc, trường error cho bộ chấm đánh rớt ca đó (đúng khuôn gitSim/hermesSim).
      dong.push(`loi: ${r.loi}`)
      return { output: dong.join('\n'), error: r.loi }
    }
    if (r.ra) dong.push(r.ra)
  }
  return { output: dong.join('\n') }
}
