// lessons — Registry BÀI HỌC 8 BƯỚC (gộp từ các file theo unit) + hàm tra cứu.
//
// Nội dung nằm ở `lessons/<bậc><unit>.ts` — mỗi unit MỘT file để soạn song song không đụng
// nhau và để đọc/sửa từng bài không phải cuộn qua file khổng lồ. Thêm unit mới: tạo file
// theo khuôn (xem lessons/p1u4.ts), rồi thêm 1 dòng import + 1 phần tử vào mảng dưới đây.
//
// Mọi bài PHẢI qua LessonSchema (lessons.test.ts) và code mẫu PHẢI chạy thật đạt hết
// test-case (lessonsPython.test.ts chạy python3 — cổng nội dung mạnh nhất của môn).
//
// APP KHÔNG IMPORT FILE NÀY (đợt tối ưu 2026-09-01): registry đồng bộ này kéo trọn ~3 MB nội
// dung vào một chunk, nên chỉ server/test/script dùng. Giao diện đi qua `lessonsLoader.ts`
// (chỉ mục nhẹ + nạp lười theo unit, sinh bởi `npm run gen:lesson-index` → `lessonsLazy.ts`).
// Thêm unit mới: ngoài dòng import + phần tử mảng dưới đây, PHẢI chạy lại lệnh gen đó.
import type { ProgrammingLesson } from './lessonTypes.js'
import { P1U1_LESSONS } from './lessons/p1u1.js'
import { P1U2_LESSONS } from './lessons/p1u2.js'
import { P1U3_LESSONS } from './lessons/p1u3.js'
import { P1U4_LESSONS } from './lessons/p1u4.js'
import { P1U5_LESSONS } from './lessons/p1u5.js'
import { P1U6_LESSONS } from './lessons/p1u6.js'
import { P1U7_LESSONS } from './lessons/p1u7.js'
import { P1U8_LESSONS } from './lessons/p1u8.js'
import { P1U9_LESSONS } from './lessons/p1u9.js'
import { P1U10_LESSONS } from './lessons/p1u10.js'
import { P2U1_LESSONS } from './lessons/p2u1.js'
import { P2U2_LESSONS } from './lessons/p2u2.js'
import { P2U3_LESSONS } from './lessons/p2u3.js'
import { P2U4_LESSONS } from './lessons/p2u4.js'
import { P2U5_LESSONS } from './lessons/p2u5.js'
import { P2U6_LESSONS } from './lessons/p2u6.js'
import { P2U7_LESSONS } from './lessons/p2u7.js'
import { P2U8_LESSONS } from './lessons/p2u8.js'
import { P2U9_LESSONS } from './lessons/p2u9.js'
import { P2U10_LESSONS } from './lessons/p2u10.js'
import { P3U1_LESSONS } from './lessons/p3u1.js'
import { P3U2_LESSONS } from './lessons/p3u2.js'
import { P3U3_LESSONS } from './lessons/p3u3.js'
import { P3U4_LESSONS } from './lessons/p3u4.js'
import { P3U5_LESSONS } from './lessons/p3u5.js'
import { P3U6_LESSONS } from './lessons/p3u6.js'
import { P3U6B_LESSONS } from './lessons/p3u6b.js'
import { P3U7_LESSONS } from './lessons/p3u7.js'
import { P3U8_LESSONS } from './lessons/p3u8.js'
import { P3U9_LESSONS } from './lessons/p3u9.js'
import { P3U10_LESSONS } from './lessons/p3u10.js'
import { P3U11_LESSONS } from './lessons/p3u11.js'
import { P3U12_LESSONS } from './lessons/p3u12.js'
import { P4U1_LESSONS } from './lessons/p4u1.js'
import { P4U2_LESSONS } from './lessons/p4u2.js'
import { P4U3_LESSONS } from './lessons/p4u3.js'
import { P4U4_LESSONS } from './lessons/p4u4.js'
import { P4U5_LESSONS } from './lessons/p4u5.js'
import { P4U6_LESSONS } from './lessons/p4u6.js'
import { P4U7_LESSONS } from './lessons/p4u7.js'

import { P4U8_LESSONS } from './lessons/p4u8.js'

import { P4U9_LESSONS } from './lessons/p4u9.js'
import { P4U10_LESSONS } from './lessons/p4u10.js'
import { P4U11_LESSONS } from './lessons/p4u11.js'
import { P4U12_LESSONS } from './lessons/p4u12.js'
import { P5U1_LESSONS } from './lessons/p5u1.js'
import { P5U2_LESSONS } from './lessons/p5u2.js'
import { P5U3_LESSONS } from './lessons/p5u3.js'
import { P5U4_LESSONS } from './lessons/p5u4.js'
import { P5U5_LESSONS } from './lessons/p5u5.js'
import { P5U6_LESSONS } from './lessons/p5u6.js'
import { P5U7_LESSONS } from './lessons/p5u7.js'
import { P5U8_LESSONS } from './lessons/p5u8.js'
import { P5U9_LESSONS } from './lessons/p5u9.js'
import { P6U1_LESSONS } from './lessons/p6u1.js'
import { P6U2_LESSONS } from './lessons/p6u2.js'
import { P6U3_LESSONS } from './lessons/p6u3.js'
import { P6U4_LESSONS } from './lessons/p6u4.js'
import { P6U5_LESSONS } from './lessons/p6u5.js'
import { P6U6_LESSONS } from './lessons/p6u6.js'
import { P6U7_LESSONS } from './lessons/p6u7.js'
import { P6U13_LESSONS } from './lessons/p6u13.js'
import { P6U14_LESSONS } from './lessons/p6u14.js'
import { P6U15_LESSONS } from './lessons/p6u15.js'
import { P6U16_LESSONS } from './lessons/p6u16.js'
import { P6U17_LESSONS } from './lessons/p6u17.js'
import { P6U18_LESSONS } from './lessons/p6u18.js'
import { P6U19_LESSONS } from './lessons/p6u19.js'
import { P6U20_LESSONS } from './lessons/p6u20.js'
import { P6U21_LESSONS } from './lessons/p6u21.js'
import { P6U22_LESSONS } from './lessons/p6u22.js'
import { P6U23_LESSONS } from './lessons/p6u23.js'
import { P6U24_LESSONS } from './lessons/p6u24.js'
import { P6U61_LESSONS } from './lessons/p6u61.js'
import { P6U62_LESSONS } from './lessons/p6u62.js'
import { P6U63_LESSONS } from './lessons/p6u63.js'
import { P6U64_LESSONS } from './lessons/p6u64.js'
import { P6U65_LESSONS } from './lessons/p6u65.js'
// Đợt 4 lộ trình "Kỹ Sư Trưởng AI" — 4 chặng riêng principal-s1…s4, giai đoạn P5 "Tầm
// trưởng". Đặc tả: docs/specs/2026-08-31-dot-4-p5-tam-truong.md.
import { P6_U94_LESSONS } from './lessons/p6u94.js'
import { P6_U95_LESSONS } from './lessons/p6u95.js'
import { P6_U96_LESSONS } from './lessons/p6u96.js'
import { P6_U97_LESSONS } from './lessons/p6u97.js'
import { P6_U98_LESSONS } from './lessons/p6u98.js'
import { P6_U99_LESSONS } from './lessons/p6u99.js'
import { P6_U100_LESSONS } from './lessons/p6u100.js'
import { P6_U101_LESSONS } from './lessons/p6u101.js'
import { P6U66_LESSONS } from './lessons/p6u66.js'
import { P6U67_LESSONS } from './lessons/p6u67.js'
import { P6U68_LESSONS } from './lessons/p6u68.js'
import { P6U102_LESSONS } from './lessons/p6u102.js'
import { P6U103_LESSONS } from './lessons/p6u103.js'
import { P6U104_LESSONS } from './lessons/p6u104.js'
import { P6U105_LESSONS } from './lessons/p6u105.js'
import { P6U106_LESSONS } from './lessons/p6u106.js'
import { P6U107_LESSONS } from './lessons/p6u107.js'
import { P6U108_LESSONS } from './lessons/p6u108.js'
import { P6U109_LESSONS } from './lessons/p6u109.js'
import { P6U110_LESSONS } from './lessons/p6u110.js'
import { P6U111_LESSONS } from './lessons/p6u111.js'
import { P6U112_LESSONS } from './lessons/p6u112.js'
import { P6U113_LESSONS } from './lessons/p6u113.js'
import { P6U114_LESSONS } from './lessons/p6u114.js'
import { P6U115_LESSONS } from './lessons/p6u115.js'
import { P6U116_LESSONS } from './lessons/p6u116.js'
import { P6U117_LESSONS } from './lessons/p6u117.js'
import { P6U118_LESSONS } from './lessons/p6u118.js'
import { P6U119_LESSONS } from './lessons/p6u119.js'
import { P6U120_LESSONS } from './lessons/p6u120.js'
import { P6U121_LESSONS } from './lessons/p6u121.js'
import { P6U122_LESSONS } from './lessons/p6u122.js'
import { P6U123_LESSONS } from './lessons/p6u123.js'
import { P6U124_LESSONS } from './lessons/p6u124.js'
import { P6U125_LESSONS } from './lessons/p6u125.js'
import { P6U126_LESSONS } from './lessons/p6u126.js'
import { P6U127_LESSONS } from './lessons/p6u127.js'
import { P6U128_LESSONS } from './lessons/p6u128.js'
import { P6U131_LESSONS } from './lessons/p6u131.js'
import { P6U132_LESSONS } from './lessons/p6u132.js'
import { P6U133_LESSONS } from './lessons/p6u133.js'
import { P6U134_LESSONS } from './lessons/p6u134.js'
import { P6U135_LESSONS } from './lessons/p6u135.js'
import { P6U136_LESSONS } from './lessons/p6u136.js'
import { P6U137_LESSONS } from './lessons/p6u137.js'
import { P6U138_LESSONS } from './lessons/p6u138.js'
import { P6U139_LESSONS } from './lessons/p6u139.js'
import { P6U140_LESSONS } from './lessons/p6u140.js'
import { P6U141_LESSONS } from './lessons/p6u141.js'
import { P6U142_LESSONS } from './lessons/p6u142.js'
import { P6U143_LESSONS } from './lessons/p6u143.js'
import { P6U144_LESSONS } from './lessons/p6u144.js'
import { P6U145_LESSONS } from './lessons/p6u145.js'
import { P6U146_LESSONS } from './lessons/p6u146.js'
import { P6U147_LESSONS } from './lessons/p6u147.js'
import { P6U148_LESSONS } from './lessons/p6u148.js'
import { P6U149_LESSONS } from './lessons/p6u149.js'
import { P6U150_LESSONS } from './lessons/p6u150.js'
import { P6U151_LESSONS } from './lessons/p6u151.js'
import { P6U152_LESSONS } from './lessons/p6u152.js'
import { P6U153_LESSONS } from './lessons/p6u153.js'
import { P6U154_LESSONS } from './lessons/p6u154.js'
import { P6U155_LESSONS } from './lessons/p6u155.js'
import { P6U156_LESSONS } from './lessons/p6u156.js'
import { P6U157_LESSONS } from './lessons/p6u157.js'
import { P6U158_LESSONS } from './lessons/p6u158.js'
import { P6U159_LESSONS } from './lessons/p6u159.js'
import { P6U160_LESSONS } from './lessons/p6u160.js'
import { P6U161_LESSONS } from './lessons/p6u161.js'
import { P6U290_LESSONS } from './lessons/p6u290.js'
import { P6U291_LESSONS } from './lessons/p6u291.js'
import { P6U292_LESSONS } from './lessons/p6u292.js'
import { P6U293_LESSONS } from './lessons/p6u293.js'
import { P6U162_LESSONS } from './lessons/p6u162.js'
import { P6U163_LESSONS } from './lessons/p6u163.js'
import { P6U164_LESSONS } from './lessons/p6u164.js'
import { P6U165_LESSONS } from './lessons/p6u165.js'
import { P6U190_LESSONS } from './lessons/p6u190.js'
import { P6U191_LESSONS } from './lessons/p6u191.js'
import { P6U192_LESSONS } from './lessons/p6u192.js'
import { P6U193_LESSONS } from './lessons/p6u193.js'
import { P6U194_LESSONS } from './lessons/p6u194.js'
import { P6U195_LESSONS } from './lessons/p6u195.js'
import { P6U196_LESSONS } from './lessons/p6u196.js'
import { P6U197_LESSONS } from './lessons/p6u197.js'
import { P6U198_LESSONS } from './lessons/p6u198.js'
import { P6U199_LESSONS } from './lessons/p6u199.js'
import { P6U200_LESSONS } from './lessons/p6u200.js'
import { P6U201_LESSONS } from './lessons/p6u201.js'
import { P6U202_LESSONS } from './lessons/p6u202.js'
import { P6U203_LESSONS } from './lessons/p6u203.js'
import { P6U204_LESSONS } from './lessons/p6u204.js'
import { P6U205_LESSONS } from './lessons/p6u205.js'
import { P6U242_LESSONS } from './lessons/p6u242.js'
import { P6U243_LESSONS } from './lessons/p6u243.js'
import { P6U244_LESSONS } from './lessons/p6u244.js'
import { P6U245_LESSONS } from './lessons/p6u245.js'
import { P6U246_LESSONS } from './lessons/p6u246.js'
import { P6U247_LESSONS } from './lessons/p6u247.js'
import { P6U248_LESSONS } from './lessons/p6u248.js'
import { P6U249_LESSONS } from './lessons/p6u249.js'
import { P6U250_LESSONS } from './lessons/p6u250.js'
import { P6U251_LESSONS } from './lessons/p6u251.js'
import { P6U252_LESSONS } from './lessons/p6u252.js'
import { P6U253_LESSONS } from './lessons/p6u253.js'
import { P6U254_LESSONS } from './lessons/p6u254.js'
import { P6U255_LESSONS } from './lessons/p6u255.js'
import { P6U256_LESSONS } from './lessons/p6u256.js'
import { P6U257_LESSONS } from './lessons/p6u257.js'
import { P6U214_LESSONS } from './lessons/p6u214.js'
import { P6U215_LESSONS } from './lessons/p6u215.js'
import { P6U216_LESSONS } from './lessons/p6u216.js'
import { P6U217_LESSONS } from './lessons/p6u217.js'
import { P6U218_LESSONS } from './lessons/p6u218.js'
import { P6U219_LESSONS } from './lessons/p6u219.js'
import { P6U220_LESSONS } from './lessons/p6u220.js'
import { P6U221_LESSONS } from './lessons/p6u221.js'
import { P6U222_LESSONS } from './lessons/p6u222.js'
import { P6U223_LESSONS } from './lessons/p6u223.js'
import { P6U224_LESSONS } from './lessons/p6u224.js'
import { P6U225_LESSONS } from './lessons/p6u225.js'
import { P6U226_LESSONS } from './lessons/p6u226.js'
import { P6U227_LESSONS } from './lessons/p6u227.js'
import { P6U228_LESSONS } from './lessons/p6u228.js'
import { P6U229_LESSONS } from './lessons/p6u229.js'
import { P6U230_LESSONS } from './lessons/p6u230.js'
import { P6U231_LESSONS } from './lessons/p6u231.js'
import { P6U232_LESSONS } from './lessons/p6u232.js'
import { P6U233_LESSONS } from './lessons/p6u233.js'
import { P6U234_LESSONS } from './lessons/p6u234.js'
import { P6U235_LESSONS } from './lessons/p6u235.js'
import { P6U236_LESSONS } from './lessons/p6u236.js'
import { P6U237_LESSONS } from './lessons/p6u237.js'
import { P6U238_LESSONS } from './lessons/p6u238.js'
import { P6U239_LESSONS } from './lessons/p6u239.js'
import { P6U240_LESSONS } from './lessons/p6u240.js'
import { P6U241_LESSONS } from './lessons/p6u241.js'
import { P6U206_LESSONS } from './lessons/p6u206.js'
import { P6U207_LESSONS } from './lessons/p6u207.js'
import { P6U208_LESSONS } from './lessons/p6u208.js'
import { P6U209_LESSONS } from './lessons/p6u209.js'
import { P6U210_LESSONS } from './lessons/p6u210.js'
import { P6U211_LESSONS } from './lessons/p6u211.js'
import { P6U212_LESSONS } from './lessons/p6u212.js'
import { P6U213_LESSONS } from './lessons/p6u213.js'
import { P6U274_LESSONS } from './lessons/p6u274.js'
import { P6U275_LESSONS } from './lessons/p6u275.js'
import { P6U276_LESSONS } from './lessons/p6u276.js'
import { P6U277_LESSONS } from './lessons/p6u277.js'
import { P6U278_LESSONS } from './lessons/p6u278.js'
import { P6U279_LESSONS } from './lessons/p6u279.js'
import { P6U280_LESSONS } from './lessons/p6u280.js'
import { P6U281_LESSONS } from './lessons/p6u281.js'
import { P6U282_LESSONS } from './lessons/p6u282.js'
import { P6U283_LESSONS } from './lessons/p6u283.js'
import { P6U284_LESSONS } from './lessons/p6u284.js'
import { P6U285_LESSONS } from './lessons/p6u285.js'
import { P6U286_LESSONS } from './lessons/p6u286.js'
import { P6U287_LESSONS } from './lessons/p6u287.js'
import { P6U288_LESSONS } from './lessons/p6u288.js'
import { P6U289_LESSONS } from './lessons/p6u289.js'
import { P6U258_LESSONS } from './lessons/p6u258.js'
import { P6U259_LESSONS } from './lessons/p6u259.js'
import { P6U260_LESSONS } from './lessons/p6u260.js'
import { P6U261_LESSONS } from './lessons/p6u261.js'
import { P6U262_LESSONS } from './lessons/p6u262.js'
import { P6U263_LESSONS } from './lessons/p6u263.js'
import { P6U264_LESSONS } from './lessons/p6u264.js'
import { P6U265_LESSONS } from './lessons/p6u265.js'
import { P6U266_LESSONS } from './lessons/p6u266.js'
import { P6U267_LESSONS } from './lessons/p6u267.js'
import { P6U268_LESSONS } from './lessons/p6u268.js'
import { P6U269_LESSONS } from './lessons/p6u269.js'
import { P6U270_LESSONS } from './lessons/p6u270.js'
import { P6U271_LESSONS } from './lessons/p6u271.js'
import { P6U272_LESSONS } from './lessons/p6u272.js'
import { P6U273_LESSONS } from './lessons/p6u273.js'
import { P6U178_LESSONS } from './lessons/p6u178.js'
import { P6U179_LESSONS } from './lessons/p6u179.js'
import { P6U180_LESSONS } from './lessons/p6u180.js'
import { P6U181_LESSONS } from './lessons/p6u181.js'
import { P6U182_LESSONS } from './lessons/p6u182.js'
import { P6U183_LESSONS } from './lessons/p6u183.js'
import { P6U184_LESSONS } from './lessons/p6u184.js'
import { P6U185_LESSONS } from './lessons/p6u185.js'
import { P6U186_LESSONS } from './lessons/p6u186.js'
import { P6U187_LESSONS } from './lessons/p6u187.js'
import { P6U188_LESSONS } from './lessons/p6u188.js'
import { P6U189_LESSONS } from './lessons/p6u189.js'
import { P6U166_LESSONS } from './lessons/p6u166.js'
import { P6U167_LESSONS } from './lessons/p6u167.js'
import { P6U168_LESSONS } from './lessons/p6u168.js'
import { P6U169_LESSONS } from './lessons/p6u169.js'
import { P6U170_LESSONS } from './lessons/p6u170.js'
import { P6U171_LESSONS } from './lessons/p6u171.js'
import { P6U172_LESSONS } from './lessons/p6u172.js'
import { P6U173_LESSONS } from './lessons/p6u173.js'
import { P6U174_LESSONS } from './lessons/p6u174.js'
import { P6U175_LESSONS } from './lessons/p6u175.js'
import { P6U176_LESSONS } from './lessons/p6u176.js'
import { P6U177_LESSONS } from './lessons/p6u177.js'
import { GIT_U2_LESSONS } from './lessons/gitu2.js'
import { GIT_U3_LESSONS } from './lessons/gitu3.js'
import { GIT_U4_LESSONS } from './lessons/gitu4.js'
import { GIT_U5_LESSONS } from './lessons/gitu5.js'
import { HERMES_U1_LESSONS } from './lessons/hermesu1.js'
import { HERMES_U2_LESSONS } from './lessons/hermesu2.js'
import { HERMES_U3_LESSONS } from './lessons/hermesu3.js'
import { HERMES_U4_LESSONS } from './lessons/hermesu4.js'
import { VIBE_U1_LESSONS } from './lessons/vibeu1.js'
import { VIBE_U2_LESSONS } from './lessons/vibeu2.js'
import { VIBE_U3_LESSONS } from './lessons/vibeu3.js'
import { VIBE_U4_LESSONS } from './lessons/vibeu4.js'
import { OPENCLAW_U1_LESSONS } from './lessons/openclawu1.js'
import { OPENCLAW_U2_LESSONS } from './lessons/openclawu2.js'
import { OPENCLAW_U3_LESSONS } from './lessons/openclawu3.js'
import { OPENCLAW_U4_LESSONS } from './lessons/openclawu4.js'
import { ML_U1_LESSONS } from './lessons/mlu1.js'
import { ML_U2_LESSONS } from './lessons/mlu2.js'
import { ML_U3_LESSONS } from './lessons/mlu3.js'
import { ML_U4_LESSONS } from './lessons/mlu4.js'
import { PYAI_U1_LESSONS } from './lessons/pyaiu1.js'
import { PYAI_U2_LESSONS } from './lessons/pyaiu2.js'
import { PYAI_U3_LESSONS } from './lessons/pyaiu3.js'
import { PYAI_U4_LESSONS } from './lessons/pyaiu4.js'
import { MATHAI_U1_LESSONS } from './lessons/mathaiu1.js'
import { MATHAI_U2_LESSONS } from './lessons/mathaiu2.js'
import { MATHAI_U3_LESSONS } from './lessons/mathaiu3.js'
import { MLDS_U1_LESSONS } from './lessons/mldsu1.js'
import { MLDS_U2_LESSONS } from './lessons/mldsu2.js'
import { MLDS_U3_LESSONS } from './lessons/mldsu3.js'
import { CV1_U1_LESSONS } from './lessons/cv1u1.js'
import { CV1_U2_LESSONS } from './lessons/cv1u2.js'
import { CV1_U3_LESSONS } from './lessons/cv1u3.js'
import { CV2_U1_LESSONS } from './lessons/cv2u1.js'
import { CV2_U2_LESSONS } from './lessons/cv2u2.js'
import { CV2_U3_LESSONS } from './lessons/cv2u3.js'
import { CV2_U4_LESSONS } from './lessons/cv2u4.js'
import { LLMAGENT_U1_LESSONS } from './lessons/llmagentu1.js'
import { LLMAGENT_U2_LESSONS } from './lessons/llmagentu2.js'
import { LLMAGENT_U3_LESSONS } from './lessons/llmagentu3.js'

export const PROGRAMMING_LESSONS: ProgrammingLesson[] = [
  ...P1U1_LESSONS,
  ...P1U2_LESSONS,
  ...P1U3_LESSONS,
  ...P1U4_LESSONS,
  ...P1U5_LESSONS,
  ...P1U6_LESSONS,
  ...P1U7_LESSONS,
  ...P1U8_LESSONS,
  ...P1U9_LESSONS,
  ...P1U10_LESSONS,
  ...P2U1_LESSONS,
  ...P2U2_LESSONS,
  ...P2U3_LESSONS,
  ...P2U4_LESSONS,
  ...P2U5_LESSONS,
  ...P2U6_LESSONS,
  ...P2U7_LESSONS,
  ...P2U8_LESSONS,
  ...P2U9_LESSONS,
  ...P2U10_LESSONS,
  ...P3U1_LESSONS,
  ...P3U2_LESSONS,
  ...P3U3_LESSONS,
  ...P3U4_LESSONS,
  ...P3U5_LESSONS,
  ...P3U6_LESSONS,
  ...P3U6B_LESSONS,
  ...P3U7_LESSONS,
  ...P3U8_LESSONS,
  ...P3U9_LESSONS,
  ...P3U10_LESSONS,
  ...P3U11_LESSONS,
  ...P3U12_LESSONS,
  ...P4U1_LESSONS,
  ...P4U2_LESSONS,
  ...P4U3_LESSONS,
  ...P4U4_LESSONS,
  ...P4U5_LESSONS,
  ...P4U6_LESSONS,
  ...P4U7_LESSONS,
  ...P4U8_LESSONS,
  ...P4U9_LESSONS,
  ...P4U10_LESSONS,
  ...P4U11_LESSONS,
  ...P4U12_LESSONS,
  ...P5U1_LESSONS,
  ...P5U2_LESSONS,
  ...P5U3_LESSONS,
  ...P5U4_LESSONS,
  ...P5U5_LESSONS,
  ...P5U6_LESSONS,
  ...P5U7_LESSONS,
  ...P5U8_LESSONS,
  ...P5U9_LESSONS,
  ...P6U1_LESSONS,
  ...P6U2_LESSONS,
  ...P6U3_LESSONS,
  ...P6U4_LESSONS,
  ...P6U5_LESSONS,
  ...P6U6_LESSONS,
  ...P6U7_LESSONS,
  ...P6U13_LESSONS,
  ...P6U14_LESSONS,
  ...P6U15_LESSONS,
  ...P6U16_LESSONS,
  ...P6U17_LESSONS,
  ...P6U18_LESSONS,
  ...P6U19_LESSONS,
  ...P6U20_LESSONS,
  ...P6U21_LESSONS,
  ...P6U22_LESSONS,
  ...P6U23_LESSONS,
  ...P6U24_LESSONS,
  ...P6U61_LESSONS,
  ...P6U62_LESSONS,
  ...P6U63_LESSONS,
  ...P6U64_LESSONS,
  ...P6U65_LESSONS,
  ...P6_U94_LESSONS,
  ...P6_U95_LESSONS,
  ...P6_U96_LESSONS,
  ...P6_U97_LESSONS,
  ...P6_U98_LESSONS,
  ...P6_U99_LESSONS,
  ...P6_U100_LESSONS,
  ...P6_U101_LESSONS,
  ...P6U66_LESSONS,
  ...P6U67_LESSONS,
  ...P6U68_LESSONS,
  ...P6U102_LESSONS,
  ...P6U103_LESSONS,
  ...P6U104_LESSONS,
  ...P6U105_LESSONS,
  ...P6U106_LESSONS,
  ...P6U107_LESSONS,
  ...P6U108_LESSONS,
  ...P6U109_LESSONS,
  ...P6U110_LESSONS,
  ...P6U111_LESSONS,
  ...P6U112_LESSONS,
  ...P6U113_LESSONS,
  ...P6U114_LESSONS,
  ...P6U115_LESSONS,
  ...P6U116_LESSONS,
  ...P6U117_LESSONS,
  ...P6U118_LESSONS,
  ...P6U119_LESSONS,
  ...P6U120_LESSONS,
  ...P6U121_LESSONS,
  ...P6U122_LESSONS,
  ...P6U123_LESSONS,
  ...P6U124_LESSONS,
  ...P6U125_LESSONS,
  ...P6U126_LESSONS,
  ...P6U127_LESSONS,
  ...P6U128_LESSONS,
  ...P6U131_LESSONS,
  ...P6U132_LESSONS,
  ...P6U133_LESSONS,
  ...P6U134_LESSONS,
  ...P6U135_LESSONS,
  ...P6U136_LESSONS,
  ...P6U137_LESSONS,
  ...P6U138_LESSONS,
  ...P6U139_LESSONS,
  ...P6U140_LESSONS,
  ...P6U141_LESSONS,
  ...P6U142_LESSONS,
  ...P6U143_LESSONS,
  ...P6U144_LESSONS,
  ...P6U145_LESSONS,
  ...P6U146_LESSONS,
  ...P6U147_LESSONS,
  ...P6U148_LESSONS,
  ...P6U149_LESSONS,
  ...P6U150_LESSONS,
  ...P6U151_LESSONS,
  ...P6U152_LESSONS,
  ...P6U153_LESSONS,
  ...P6U154_LESSONS,
  ...P6U155_LESSONS,
  ...P6U156_LESSONS,
  ...P6U157_LESSONS,
  ...P6U158_LESSONS,
  ...P6U159_LESSONS,
  ...P6U160_LESSONS,
  ...P6U161_LESSONS,
  ...P6U290_LESSONS,
  ...P6U291_LESSONS,
  ...P6U292_LESSONS,
  ...P6U293_LESSONS,
  ...P6U162_LESSONS,
  ...P6U163_LESSONS,
  ...P6U164_LESSONS,
  ...P6U165_LESSONS,
  ...P6U190_LESSONS,
  ...P6U191_LESSONS,
  ...P6U192_LESSONS,
  ...P6U193_LESSONS,
  ...P6U194_LESSONS,
  ...P6U195_LESSONS,
  ...P6U196_LESSONS,
  ...P6U197_LESSONS,
  ...P6U198_LESSONS,
  ...P6U199_LESSONS,
  ...P6U200_LESSONS,
  ...P6U201_LESSONS,
  ...P6U202_LESSONS,
  ...P6U203_LESSONS,
  ...P6U204_LESSONS,
  ...P6U205_LESSONS,
  ...P6U242_LESSONS,
  ...P6U243_LESSONS,
  ...P6U244_LESSONS,
  ...P6U245_LESSONS,
  ...P6U246_LESSONS,
  ...P6U247_LESSONS,
  ...P6U248_LESSONS,
  ...P6U249_LESSONS,
  ...P6U250_LESSONS,
  ...P6U251_LESSONS,
  ...P6U252_LESSONS,
  ...P6U253_LESSONS,
  ...P6U254_LESSONS,
  ...P6U255_LESSONS,
  ...P6U256_LESSONS,
  ...P6U257_LESSONS,
  ...P6U214_LESSONS,
  ...P6U215_LESSONS,
  ...P6U216_LESSONS,
  ...P6U217_LESSONS,
  ...P6U218_LESSONS,
  ...P6U219_LESSONS,
  ...P6U220_LESSONS,
  ...P6U221_LESSONS,
  ...P6U222_LESSONS,
  ...P6U223_LESSONS,
  ...P6U224_LESSONS,
  ...P6U225_LESSONS,
  ...P6U226_LESSONS,
  ...P6U227_LESSONS,
  ...P6U228_LESSONS,
  ...P6U229_LESSONS,
  ...P6U230_LESSONS,
  ...P6U231_LESSONS,
  ...P6U232_LESSONS,
  ...P6U233_LESSONS,
  ...P6U234_LESSONS,
  ...P6U235_LESSONS,
  ...P6U236_LESSONS,
  ...P6U237_LESSONS,
  ...P6U238_LESSONS,
  ...P6U239_LESSONS,
  ...P6U240_LESSONS,
  ...P6U241_LESSONS,
  ...P6U206_LESSONS,
  ...P6U207_LESSONS,
  ...P6U208_LESSONS,
  ...P6U209_LESSONS,
  ...P6U210_LESSONS,
  ...P6U211_LESSONS,
  ...P6U212_LESSONS,
  ...P6U213_LESSONS,
  ...P6U274_LESSONS,
  ...P6U275_LESSONS,
  ...P6U276_LESSONS,
  ...P6U277_LESSONS,
  ...P6U278_LESSONS,
  ...P6U279_LESSONS,
  ...P6U280_LESSONS,
  ...P6U281_LESSONS,
  ...P6U282_LESSONS,
  ...P6U283_LESSONS,
  ...P6U284_LESSONS,
  ...P6U285_LESSONS,
  ...P6U286_LESSONS,
  ...P6U287_LESSONS,
  ...P6U288_LESSONS,
  ...P6U289_LESSONS,
  ...P6U258_LESSONS,
  ...P6U259_LESSONS,
  ...P6U260_LESSONS,
  ...P6U261_LESSONS,
  ...P6U262_LESSONS,
  ...P6U263_LESSONS,
  ...P6U264_LESSONS,
  ...P6U265_LESSONS,
  ...P6U266_LESSONS,
  ...P6U267_LESSONS,
  ...P6U268_LESSONS,
  ...P6U269_LESSONS,
  ...P6U270_LESSONS,
  ...P6U271_LESSONS,
  ...P6U272_LESSONS,
  ...P6U273_LESSONS,
  ...P6U178_LESSONS,
  ...P6U179_LESSONS,
  ...P6U180_LESSONS,
  ...P6U181_LESSONS,
  ...P6U182_LESSONS,
  ...P6U183_LESSONS,
  ...P6U184_LESSONS,
  ...P6U185_LESSONS,
  ...P6U186_LESSONS,
  ...P6U187_LESSONS,
  ...P6U188_LESSONS,
  ...P6U189_LESSONS,
  ...P6U166_LESSONS,
  ...P6U167_LESSONS,
  ...P6U168_LESSONS,
  ...P6U169_LESSONS,
  ...P6U170_LESSONS,
  ...P6U171_LESSONS,
  ...P6U172_LESSONS,
  ...P6U173_LESSONS,
  ...P6U174_LESSONS,
  ...P6U175_LESSONS,
  ...P6U176_LESSONS,
  ...P6U177_LESSONS,
  ...GIT_U2_LESSONS,
  ...GIT_U3_LESSONS,
  ...GIT_U4_LESSONS,
  ...GIT_U5_LESSONS,
  ...HERMES_U1_LESSONS,
  ...HERMES_U2_LESSONS,
  ...HERMES_U3_LESSONS,
  ...HERMES_U4_LESSONS,
  ...VIBE_U1_LESSONS,
  ...VIBE_U2_LESSONS,
  ...VIBE_U3_LESSONS,
  ...VIBE_U4_LESSONS,
  ...OPENCLAW_U1_LESSONS,
  ...OPENCLAW_U2_LESSONS,
  ...OPENCLAW_U3_LESSONS,
  ...OPENCLAW_U4_LESSONS,
  ...ML_U1_LESSONS,
  ...ML_U2_LESSONS,
  ...ML_U3_LESSONS,
  ...ML_U4_LESSONS,
  ...PYAI_U1_LESSONS,
  ...PYAI_U2_LESSONS,
  ...PYAI_U3_LESSONS,
  ...PYAI_U4_LESSONS,
  ...MATHAI_U1_LESSONS,
  ...MATHAI_U2_LESSONS,
  ...MATHAI_U3_LESSONS,
  ...MLDS_U1_LESSONS,
  ...MLDS_U2_LESSONS,
  ...MLDS_U3_LESSONS,
  ...CV1_U1_LESSONS,
  ...CV1_U2_LESSONS,
  ...CV1_U3_LESSONS,
  ...CV2_U1_LESSONS,
  ...CV2_U2_LESSONS,
  ...CV2_U3_LESSONS,
  ...CV2_U4_LESSONS,
  ...LLMAGENT_U1_LESSONS,
  ...LLMAGENT_U2_LESSONS,
  ...LLMAGENT_U3_LESSONS,
]

const lessonMap = new Map(PROGRAMMING_LESSONS.map((l) => [l.id, l]))

export function getLesson(lessonId: string): ProgrammingLesson | undefined {
  return lessonMap.get(lessonId)
}

/** Bài học của một unit (unit chưa soạn bài → mảng rỗng — UI hiện "sắp mở"). */
export function getLessonsByUnit(unitId: string): ProgrammingLesson[] {
  return PROGRAMMING_LESSONS.filter((l) => l.unitId === unitId)
}
