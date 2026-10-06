// apps/dhcb/src/lib/simulators.ts — Core Real-Life Applied Mathematical & Scientific Models
// Cung cấp các thuật toán tính toán chính xác cho 10 mô hình mô phỏng thực tế trong đời sống

// 1. Tối ưu hóa Lợi nhuận (Toán học — Đạo hàm bậc 1)
export interface ProfitOptimizationResult {
  optimalPrice: number
  maxProfit: number
  unitsSold: number
  totalRevenue: number
  totalCost: number
  breakEvenLower: number
  breakEvenUpper: number
}

export function calculateProfitOptimization(
  fixedCost: number,
  unitCost: number,
  baseDemand: number,
  elasticity: number,
  minPrice: number,
  maxPrice: number,
): ProfitOptimizationResult {
  const optimalMargin = elasticity > 0 ? baseDemand / (2 * elasticity) : 0
  let optimalPrice = Math.round(unitCost + optimalMargin)
  if (optimalPrice < minPrice) optimalPrice = minPrice
  if (optimalPrice > maxPrice) optimalPrice = maxPrice

  const unitsSold = Math.max(0, Math.round(baseDemand - elasticity * (optimalPrice - unitCost)))
  const totalRevenue = optimalPrice * unitsSold
  const totalCost = fixedCost + unitCost * unitsSold
  const maxProfit = totalRevenue - totalCost

  const a = -elasticity
  const b = baseDemand
  const c = -fixedCost
  const delta = b * b - 4 * a * c

  let breakEvenLower = 0
  let breakEvenUpper = 0
  if (delta >= 0 && a !== 0) {
    const x1 = (-b + Math.sqrt(delta)) / (2 * a)
    const x2 = (-b - Math.sqrt(delta)) / (2 * a)
    const p1 = Math.round(unitCost + Math.min(x1, x2))
    const p2 = Math.round(unitCost + Math.max(x1, x2))
    breakEvenLower = Math.max(minPrice, p1)
    breakEvenUpper = Math.min(maxPrice, p2)
  }

  return {
    optimalPrice,
    maxProfit,
    unitsSold,
    totalRevenue,
    totalCost,
    breakEvenLower,
    breakEvenUpper,
  }
}

// 2. Lãi kép & Tự do Tài chính FIRE (Toán học — Cấp số nhân)
export interface CompoundInterestYearData {
  year: number
  totalContributed: number
  totalInterest: number
  nominalWealth: number
  realWealth: number
}

export interface CompoundInterestResult {
  totalWealth: number
  realWealth: number
  totalContributed: number
  totalInterest: number
  yearlyData: CompoundInterestYearData[]
}

export function calculateCompoundInterest(
  initialPrincipal: number,
  monthlyContribution: number,
  annualInterestRatePct: number,
  inflationRatePct: number,
  years: number,
): CompoundInterestResult {
  const r = annualInterestRatePct / 100
  const monthlyRate = r / 12
  const inflation = inflationRatePct / 100

  let currentNominal = initialPrincipal
  let totalContributed = initialPrincipal
  const yearlyData: CompoundInterestYearData[] = []

  for (let year = 1; year <= years; year++) {
    for (let month = 1; month <= 12; month++) {
      currentNominal = currentNominal * (1 + monthlyRate) + monthlyContribution
      totalContributed += monthlyContribution
    }
    const currentInterest = currentNominal - totalContributed
    const realWealth = currentNominal / Math.pow(1 + inflation, year)
    yearlyData.push({
      year,
      totalContributed: Math.round(totalContributed),
      totalInterest: Math.round(currentInterest),
      nominalWealth: Math.round(currentNominal),
      realWealth: Math.round(realWealth),
    })
  }

  const finalYear = yearlyData[yearlyData.length - 1] ?? {
    nominalWealth: initialPrincipal,
    realWealth: initialPrincipal,
    totalContributed: initialPrincipal,
    totalInterest: 0,
  }

  return {
    totalWealth: finalYear.nominalWealth,
    realWealth: finalYear.realWealth,
    totalContributed: finalYear.totalContributed,
    totalInterest: finalYear.totalInterest,
    yearlyData,
  }
}

// 3. Định giá & Trả góp Khoản vay (Loan Amortization — Dư nợ giảm dần)
export interface LoanAmortizationResult {
  monthlyPayment: number
  totalPayment: number
  totalInterestPaid: number
  firstMonthInterest: number
  firstMonthPrincipal: number
}

export function calculateLoanAmortization(
  loanAmount: number,
  annualRatePct: number,
  years: number,
): LoanAmortizationResult {
  if (loanAmount <= 0 || years <= 0) {
    return {
      monthlyPayment: 0,
      totalPayment: 0,
      totalInterestPaid: 0,
      firstMonthInterest: 0,
      firstMonthPrincipal: 0,
    }
  }

  const r = annualRatePct / 100 / 12
  const n = years * 12

  if (r === 0) {
    const monthlyPayment = Math.round(loanAmount / n)
    return {
      monthlyPayment,
      totalPayment: loanAmount,
      totalInterestPaid: 0,
      firstMonthInterest: 0,
      firstMonthPrincipal: monthlyPayment,
    }
  }

  const compound = Math.pow(1 + r, n)
  const monthlyPayment = Math.round((loanAmount * (r * compound)) / (compound - 1))
  const totalPayment = monthlyPayment * n
  const totalInterestPaid = totalPayment - loanAmount

  const firstMonthInterest = Math.round(loanAmount * r)
  const firstMonthPrincipal = monthlyPayment - firstMonthInterest

  return {
    monthlyPayment,
    totalPayment,
    totalInterestPaid,
    firstMonthInterest,
    firstMonthPrincipal,
  }
}

// 4. Tính toán & Cắt giảm Tiền điện EVN (Vật lí — Công suất P = U*I, A = P*t, Biểu giá 6 bậc)
export interface EvnTierBreakdown {
  tier: number
  kwhInTier: number
  rate: number
  cost: number
}

export interface ElectricityConsumptionResult {
  totalKwh: number
  subtotal: number
  vat: number
  totalBill: number
  tierBreakdown: EvnTierBreakdown[]
  acSavingPotentialKwh: number
  acSavingPotentialMoney: number
}

export function calculateEvnElectricityBill(
  acHoursDaily: number,
  acTempC: number,
  waterHeaterMinutesDaily: number,
  pcHoursDaily: number,
  otherBaseKwhMonthly: number,
): ElectricityConsumptionResult {
  const tempFactor = Math.max(0.65, 0.75 + (27 - acTempC) * 0.0875)
  const acDailyKwh = acHoursDaily * tempFactor
  const acMonthlyKwh = acDailyKwh * 30

  const heaterMonthlyKwh = 2.5 * (waterHeaterMinutesDaily / 60) * 30
  const pcMonthlyKwh = 0.2 * pcHoursDaily * 30

  const totalKwh = Math.round(acMonthlyKwh + heaterMonthlyKwh + pcMonthlyKwh + otherBaseKwhMonthly)

  const TIERS = [
    { max: 50, rate: 1806 },
    { max: 100, rate: 1866 },
    { max: 200, rate: 2167 },
    { max: 300, rate: 2729 },
    { max: 400, rate: 3050 },
    { max: Infinity, rate: 3151 },
  ]

  let remainingKwh = totalKwh
  let previousMax = 0
  let subtotal = 0
  const tierBreakdown: EvnTierBreakdown[] = []

  for (const [i, tier] of TIERS.entries()) {
    const tierLimit = tier.max - previousMax
    const kwhInThisTier = Math.min(remainingKwh, tierLimit)
    if (kwhInThisTier > 0) {
      const cost = Math.round(kwhInThisTier * tier.rate)
      subtotal += cost
      tierBreakdown.push({
        tier: i + 1,
        kwhInTier: kwhInThisTier,
        rate: tier.rate,
        cost,
      })
      remainingKwh -= kwhInThisTier
    }
    previousMax = tier.max
    if (remainingKwh <= 0) break
  }

  const vat = Math.round(subtotal * 0.08)
  const totalBill = subtotal + vat

  const idealAcKwh = acHoursDaily * 0.75 * 30
  const acSavingPotentialKwh = Math.max(0, Math.round(acMonthlyKwh - idealAcKwh))
  const acSavingPotentialMoney = Math.round(acSavingPotentialKwh * 2800 * 1.08)

  return {
    totalKwh,
    subtotal,
    vat,
    totalBill,
    tierBreakdown,
    acSavingPotentialKwh,
    acSavingPotentialMoney,
  }
}

// 5. Thuyết Tương Đối Einstein & Hệ thống GPS (Vật lí Hiện đại)
export interface GpsRelativityResult {
  days: number
  srDilationUs: number
  grDilationUs: number
  netDilationUs: number
  positionDriftKm: number
}

export function calculateGpsRelativity(days: number): GpsRelativityResult {
  const srDilationUs = +(-7.2 * days).toFixed(1)
  const grDilationUs = +(45.8 * days).toFixed(1)
  const netDilationUs = +(srDilationUs + grDilationUs).toFixed(1)
  const positionDriftKm = +(days * 11.58).toFixed(2)

  return {
    days,
    srDilationUs,
    grDilationUs,
    netDilationUs,
    positionDriftKm,
  }
}

// 6. Khoảng Cách Phanh An Toàn & Động Năng Xe Cộ (Vật lí — Động học & Ma sát)
export interface BrakingDistanceResult {
  reactionDistanceM: number
  brakingDistanceM: number
  totalStoppingDistanceM: number
  initialKineticEnergyKj: number
  speedMps: number
  dangerLevel: 'safe' | 'caution' | 'danger'
}

export function calculateBrakingDistance(
  speedKmh: number,
  reactionTimeSeconds: number,
  roadFrictionCoeff: number,
  vehicleMassKg: number = 1500,
): BrakingDistanceResult {
  const speedMps = (speedKmh * 1000) / 3600
  const reactionDistanceM = +(speedMps * reactionTimeSeconds).toFixed(1)
  const g = 9.81
  const brakingDistanceM = +(Math.pow(speedMps, 2) / (2 * roadFrictionCoeff * g)).toFixed(1)
  const totalStoppingDistanceM = +(reactionDistanceM + brakingDistanceM).toFixed(1)

  const initialKineticEnergyKj = Math.round((0.5 * vehicleMassKg * Math.pow(speedMps, 2)) / 1000)

  let dangerLevel: 'safe' | 'caution' | 'danger' = 'safe'
  if (totalStoppingDistanceM > 70 || reactionTimeSeconds >= 1.5) {
    dangerLevel = 'danger'
  } else if (totalStoppingDistanceM > 40 || roadFrictionCoeff < 0.5) {
    dangerLevel = 'caution'
  }

  return {
    reactionDistanceM,
    brakingDistanceM,
    totalStoppingDistanceM,
    initialKineticEnergyKj,
    speedMps: +speedMps.toFixed(1),
    dangerLevel,
  }
}

// 7. Pha Cồn Sát Khuẩn 70° Chuẩn Y Tế (Hóa học — Nồng độ Dung dịch C1*V1 = C2*V2)
export interface AlcoholDilutionResult {
  target70VolumeMl: number
  initialAlcoholVolumeMl: number
  waterToAddMl: number
  scientificReason: string
}

export function calculateAlcoholDilution(
  targetVolumeMl: number,
  initialConcentrationDegree: number = 90,
): AlcoholDilutionResult {
  const initialAlcoholVolumeMl = Math.round((70 * targetVolumeMl) / initialConcentrationDegree)
  const waterToAddMl = targetVolumeMl - initialAlcoholVolumeMl

  const scientificReason =
    'Cồn 70° tối ưu nhất vì có tốc độ thẩm thấu qua màng tế bào vi khuẩn vừa đủ để làm biến tính protein từ trong ra ngoài. Cồn 90° bay hơi quá nhanh và làm đông tụ lớp vỏ protein bên ngoài lập tức tạo thành màng bọc bảo vệ vi khuẩn bên trong.'

  return {
    target70VolumeMl: targetVolumeMl,
    initialAlcoholVolumeMl,
    waterToAddMl,
    scientificReason,
  }
}

// 8. Thang Đo Độ pH & Nồng Độ Ion Axit (Hóa học Axit-Bazơ)
export interface PhItemData {
  name: string
  ph: number
  hConcentration: number
  nature: 'strong_acid' | 'weak_acid' | 'neutral' | 'weak_base' | 'strong_base'
  effectOnBody: string
}

export const COMMON_PH_ITEMS: PhItemData[] = [
  {
    name: 'Axit Dạ Dày (Gastric Acid)',
    ph: 1.5,
    hConcentration: Math.pow(10, -1.5),
    nature: 'strong_acid',
    effectOnBody: 'Hòa tan thức ăn, tiêu diệt vi khuẩn, cần lớp chất nhầy bảo vệ niêm mạc.',
  },
  {
    name: 'Nước Chanh / Nước Ngọt Có Ga',
    ph: 2.5,
    hConcentration: Math.pow(10, -2.5),
    nature: 'strong_acid',
    effectOnBody: 'Ăn mòn men răng nếu ngâm lâu, kích thích trào ngược dạ dày.',
  },
  {
    name: 'Cà Phê Đen',
    ph: 5.0,
    hConcentration: Math.pow(10, -5.0),
    nature: 'weak_acid',
    effectOnBody: 'Gây tăng tiết axit dịch vị nhẹ, an toàn với người không viêm loét.',
  },
  {
    name: 'Nước Tinh Khiết / Nước Mưa',
    ph: 7.0,
    hConcentration: Math.pow(10, -7.0),
    nature: 'neutral',
    effectOnBody: 'Cân bằng sinh học hoàn hảo, dung môi hòa tan mọi chất điện giải.',
  },
  {
    name: 'Máu Người (Huyết tương chuẩn)',
    ph: 7.4,
    hConcentration: Math.pow(10, -7.4),
    nature: 'neutral',
    effectOnBody: 'Hệ đệm Bicarbonate giữ pH máu ổn định tuyệt đối từ 7.35 đến 7.45.',
  },
  {
    name: 'Nước Khoáng Kiềm / Baking Soda',
    ph: 8.5,
    hConcentration: Math.pow(10, -8.5),
    nature: 'weak_base',
    effectOnBody: 'Hỗ trợ trung hòa axit dư thừa dạ dày sau bữa ăn nhiều dầu mỡ/rượu bia.',
  },
  {
    name: 'Nước Xà Phòng Rửa Tay',
    ph: 10.0,
    hConcentration: Math.pow(10, -10.0),
    nature: 'strong_base',
    effectOnBody: 'Phá vỡ lớp lipid màng virus/vi khuẩn, rửa sạch bụi bẩn.',
  },
]

export function getPhComparison(ph1: number, ph2: number): number {
  return Math.round(Math.pow(10, Math.abs(ph1 - ph2)))
}

// 9. Bilan Năng Lượng BMR/TDEE & Phân Bổ Macro (Sinh học — Trao đổi chất)
export interface NutritionTdeeResult {
  bmr: number
  tdee: number
  targetCalories: number
  proteinGrams: number
  carbGrams: number
  fatGrams: number
  macroCalories: {
    protein: number
    carb: number
    fat: number
  }
}

export function calculateTdeeAndMacro(
  weightKg: number,
  heightCm: number,
  age: number,
  gender: 'male' | 'female',
  activityMultiplier: number,
  goal: 'fat_loss' | 'maintenance' | 'muscle_gain',
): NutritionTdeeResult {
  let bmr = 10 * weightKg + 6.25 * heightCm - 5 * age
  if (gender === 'male') {
    bmr += 5
  } else {
    bmr -= 161
  }
  bmr = Math.round(bmr)

  const tdee = Math.round(bmr * activityMultiplier)

  let targetCalories = tdee
  if (goal === 'fat_loss') {
    targetCalories = Math.round(tdee * 0.8)
  } else if (goal === 'muscle_gain') {
    targetCalories = Math.round(tdee * 1.15)
  }

  const proteinGrams = Math.round(weightKg * 2.0)
  const proteinCalories = proteinGrams * 4

  const fatCalories = Math.round(targetCalories * 0.25)
  const fatGrams = Math.round(fatCalories / 9)

  const carbCalories = Math.max(0, targetCalories - proteinCalories - fatCalories)
  const carbGrams = Math.round(carbCalories / 4)

  return {
    bmr,
    tdee,
    targetCalories,
    proteinGrams,
    carbGrams,
    fatGrams,
    macroCalories: {
      protein: proteinCalories,
      carb: carbCalories,
      fat: fatCalories,
    },
  }
}

// 10. Di Truyền Học Men-đen & Dự Đoán Nhóm Máu (Sinh học — Di truyền)
export type BloodType = 'A' | 'B' | 'AB' | 'O'

export interface BloodTypeOffspringProbability {
  bloodType: BloodType
  percentage: number
}

export function predictOffspringBloodTypes(
  fatherType: BloodType,
  motherType: BloodType,
): BloodTypeOffspringProbability[] {
  const genotypesMap: Record<BloodType, string[][]> = {
    A: [
      ['A', 'A'],
      ['A', 'O'],
    ],
    B: [
      ['B', 'B'],
      ['B', 'O'],
    ],
    AB: [['A', 'B']],
    O: [['O', 'O']],
  }

  const fatherGenotypes = genotypesMap[fatherType]
  const motherGenotypes = genotypesMap[motherType]

  const outcomes: Record<BloodType, number> = { A: 0, B: 0, AB: 0, O: 0 }
  let totalCombinations = 0

  fatherGenotypes.forEach((fGeno) => {
    motherGenotypes.forEach((mGeno) => {
      fGeno.forEach((fAllele) => {
        mGeno.forEach((mAllele) => {
          totalCombinations++
          const sortedAlleles = [fAllele, mAllele].sort().join('')
          if (sortedAlleles === 'AA' || sortedAlleles === 'AO') outcomes.A++
          else if (sortedAlleles === 'BB' || sortedAlleles === 'BO') outcomes.B++
          else if (sortedAlleles === 'AB') outcomes.AB++
          else if (sortedAlleles === 'OO') outcomes.O++
        })
      })
    })
  })

  const results: BloodTypeOffspringProbability[] = (['A', 'B', 'AB', 'O'] as BloodType[])
    .map((type) => ({
      bloodType: type,
      percentage: Math.round((outcomes[type] / totalCombinations) * 100),
    }))
    .filter((item) => item.percentage > 0)

  return results
}
