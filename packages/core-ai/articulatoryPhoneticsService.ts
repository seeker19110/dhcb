// packages/core-ai/articulatoryPhoneticsService.ts — Hướng dẫn khẩu hình (mặt cắt miệng) cho âm
// người Việt hay nhầm: dữ liệu tĩnh viết tay, không đo gì.
//
// Changelog 0563 (khuôn 0484) đã GỠ `generatePitchContour`/`analyzePhoneticsAndPitch`: đường pitch
// "người học" = pitch mẫu (4 điểm sinh bằng công thức) + nhiễu ngẫu nhiên, kèm
// `alignmentScore`/`overallPhoneticScore` lấy thẳng từ điểm client tự gửi — hiển thị như kết quả
// đo dù không có âm thanh nào. Không thêm lại điểm/đường pitch khi chưa ghi âm + trích F0 thật.
import type { L1PhonemeTarget, ArticulatoryGuide } from '@dhcb/core-contracts/articulatoryPhonetics'

export const ARTICULATORY_GUIDES: Record<L1PhonemeTarget, ArticulatoryGuide> = {
  TH_VOICELESS: {
    targetPhoneme: 'TH_VOICELESS',
    ipaSymbol: '/θ/',
    commonVietnameseMistake: 'Phát âm nhầm thành /t/ (ví dụ: "thank" -> "tank") hoặc /s/ ("sank").',
    tonguePosition: 'tip_between_teeth',
    jawOpening: 'half_open',
    lipShape: 'neutral',
    vocalCordVibration: false,
    airflowDescription: 'Luồng khí ma sát thoát ra liên tục giữa bề mặt lưỡi và răng cửa trên.',
    stepByStepAnatomyTips: [
      'Đưa nhẹ đầu lưỡi ra giữa 2 hàm răng (chạm nhẹ răng cửa trên).',
      'Thổi nhẹ luồng hơi qua khe răng mà không để thanh quản rung (vô thanh).',
      'Rút nhanh đầu lưỡi về sau khi phát âm xong nguyên âm tiếp theo.',
    ],
  },
  TH_VOICED: {
    targetPhoneme: 'TH_VOICED',
    ipaSymbol: '/ð/',
    commonVietnameseMistake:
      'Phát âm nhầm thành /d/ (ví dụ: "this" -> "đít", "they" -> "đây") hoặc /z/.',
    tonguePosition: 'tip_between_teeth',
    jawOpening: 'half_open',
    lipShape: 'neutral',
    vocalCordVibration: true,
    airflowDescription:
      'Luồng khí ma sát kết hợp rung thanh quản mạnh mẽ tại vị trí đầu lưỡi chạm răng.',
    stepByStepAnatomyTips: [
      'Đặt đầu lưỡi ở vị trí tương tự /θ/ (giữa 2 hàm răng).',
      'Đồng thời bật rung thanh quản (đặt tay lên cổ họng để cảm nhận độ rung).',
      'Giữ hơi rung đều đặn trước khi chuyển sang nguyên âm.',
    ],
  },
  ASH_SHORT_A: {
    targetPhoneme: 'ASH_SHORT_A',
    ipaSymbol: '/æ/',
    commonVietnameseMistake:
      'Phát âm nhầm thành /e/ ("bad" -> "bed") hoặc /a/ ngắn ("cat" -> "cắt").',
    tonguePosition: 'low_front',
    jawOpening: 'fully_open',
    lipShape: 'spread',
    vocalCordVibration: true,
    airflowDescription: 'Âm mở rộng, vòm miệng hạ thấp tối đa, luồng âm vang tự do từ thanh quản.',
    stepByStepAnatomyTips: [
      'Hạ quai hàm xuống sâu hơn âm /e/ thông thường.',
      'Kéo bè khóe môi sang 2 bên như đang mỉm cười nhẹ.',
      'Ép phẳng thân lưỡi xuống đáy sàn miệng.',
    ],
  },
  RETROFLEX_R: {
    targetPhoneme: 'RETROFLEX_R',
    ipaSymbol: '/r/',
    commonVietnameseMistake: 'Rung đầu lưỡi kiểu tiếng Việt /r/ hoặc phát âm giống /w/ /z/.',
    tonguePosition: 'curled_retroflex',
    jawOpening: 'half_open',
    lipShape: 'rounded',
    vocalCordVibration: true,
    airflowDescription:
      'Luồng âm lướt nhẹ qua vòm họng mà đầu lưỡi KHÔNG ĐƯỢC CHẠM vào bất kỳ đâu.',
    stepByStepAnatomyTips: [
      'Cong nhẹ đầu lưỡi ngược lên phía vòm họng nhưng không để chạm vào ngạc.',
      'Hơi chu môi về phía trước.',
      'Phát âm mượt mà, giữ luồng âm trôi liên tục không đứt đoạn.',
    ],
  },
  FINAL_CLUSTER_KS: {
    targetPhoneme: 'FINAL_CLUSTER_KS',
    ipaSymbol: '/-ks/',
    commonVietnameseMistake:
      'Bỏ quên phụ âm đuôi /s/ hoặc nuốt âm /k/ (ví dụ: "box" -> "bóp" hoặc "bó").',
    tonguePosition: 'dorsum_velar',
    jawOpening: 'half_open',
    lipShape: 'neutral',
    vocalCordVibration: false,
    airflowDescription: 'Tắc âm /k/ tại cuống họng rồi xả nhanh luồng khí /s/ qua đầu răng.',
    stepByStepAnatomyTips: [
      'Nâng cuống lưỡi chạm ngạc mềm tạo âm tắc /k/.',
      'Ngay lập tức mở cuống lưỡi và xì hơi /s/ sắc bén qua khe răng cửa.',
    ],
  },
  AFFRICATE_CH: {
    targetPhoneme: 'AFFRICATE_CH',
    ipaSymbol: '/tʃ/',
    commonVietnameseMistake: 'Phát âm thành /ch/ nhẹ tiếng Việt hoặc /ʃ/ xì không có lực bật tắc.',
    tonguePosition: 'blade_hard_palate',
    jawOpening: 'half_open',
    lipShape: 'rounded',
    vocalCordVibration: false,
    airflowDescription: 'Chặn hơi hoàn toàn tại ngạc cứng sau đó bật tung luồng khí ma sát mạnh.',
    stepByStepAnatomyTips: [
      'Chu tròn môi về phía trước.',
      'Ép mặt lưỡi vào ngạc cứng chặn luồng hơi.',
      'Bật mạnh luồng khí ra ngoài dứt khoát.',
    ],
  },
  AFFRICATE_JH: {
    targetPhoneme: 'AFFRICATE_JH',
    ipaSymbol: '/dʒ/',
    commonVietnameseMistake: 'Phát âm thành /z/ hoặc /d/ tiếng Việt (ví dụ: "job" -> "dóp").',
    tonguePosition: 'blade_hard_palate',
    jawOpening: 'half_open',
    lipShape: 'rounded',
    vocalCordVibration: true,
    airflowDescription: 'Âm tắc xát hữu thanh bật mạnh tại ngạc cứng.',
    stepByStepAnatomyTips: ['Khẩu hình tương tự /tʃ/ nhưng kết hợp làm rung mạnh dây thanh quản.'],
  },
  FINAL_SIBILANT_Z: {
    targetPhoneme: 'FINAL_SIBILANT_Z',
    ipaSymbol: '/-z/',
    commonVietnameseMistake: 'Bỏ âm đuôi hoặc phát âm thành /s/ xì vô thanh.',
    tonguePosition: 'tip_alveolar_ridge',
    jawOpening: 'closed',
    lipShape: 'spread',
    vocalCordVibration: true,
    airflowDescription: 'Ma sát hữu thanh tạo tiếng ong kêu /zzz/ ở cuối từ.',
    stepByStepAnatomyTips: [
      'Đặt đầu lưỡi sát chân răng trên.',
      'Xì hơi kết hợp rung thanh quản như tiếng ong vo ve.',
    ],
  },
}

export function getArticulatoryGuide(phoneme: L1PhonemeTarget): ArticulatoryGuide {
  const guide = ARTICULATORY_GUIDES[phoneme]
  if (!guide) {
    throw new Error(`Chưa có hướng dẫn giải phẫu cho âm vị ${phoneme}`)
  }
  return guide
}
