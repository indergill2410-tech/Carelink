type PayRole = 'NURSE' | 'EN' | 'PCA'

type ShiftPayInput = {
  role: string
  startTime: Date
  endTime: Date
  hourlyRate: number
  urgent?: boolean | null
}

type PayComponent = {
  code: string
  label: string
  amount: number
}

const MS_PER_HOUR = 3_600_000
const SEGMENT_MS = 15 * 60 * 1000
const MELBOURNE_TZ = 'Australia/Melbourne'

export const ROLE_RATE_FLOORS: Record<PayRole, number> = {
  NURSE: 55.00,
  EN: 45.00,
  PCA: 32.50,
}

const DEFAULT_RATE_FLOOR = 45.00
const WEEKEND_LOADING_RATE = 0.10
const NIGHT_LOADING_RATE = 0.15
const URGENT_LOADING_RATE = 0.05
const ERTC_INCENTIVE_RATE = 0.08
const ERTC_INCENTIVE_CAP = 75

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

function getMelbourneParts(date: Date) {
  const parts = new Intl.DateTimeFormat('en-AU', {
    weekday: 'short',
    hour: '2-digit',
    hourCycle: 'h23',
    timeZone: MELBOURNE_TZ,
  }).formatToParts(date)

  return {
    weekday: parts.find(part => part.type === 'weekday')?.value ?? '',
    hour: Number(parts.find(part => part.type === 'hour')?.value ?? '0'),
  }
}

function getWindowHours(startTime: Date, endTime: Date, predicate: (date: Date) => boolean) {
  if (!(startTime < endTime)) return 0

  let hours = 0
  for (let cursor = startTime.getTime(); cursor < endTime.getTime(); cursor += SEGMENT_MS) {
    const next = Math.min(cursor + SEGMENT_MS, endTime.getTime())
    const midpoint = new Date(cursor + (next - cursor) / 2)
    if (predicate(midpoint)) hours += (next - cursor) / MS_PER_HOUR
  }
  return roundMoney(hours)
}

export function getRoleRateFloor(role: string) {
  return ROLE_RATE_FLOORS[role as PayRole] ?? DEFAULT_RATE_FLOOR
}

export function normaliseOfferedRate(role: string, hourlyRate: number) {
  const rate = Number.isFinite(hourlyRate) && hourlyRate > 0 ? hourlyRate : 0
  return roundMoney(Math.max(rate, getRoleRateFloor(role)))
}

export function calculateShiftPay(input: ShiftPayInput) {
  const hours = Math.max(0, (input.endTime.getTime() - input.startTime.getTime()) / MS_PER_HOUR)
  const roundedHours = roundMoney(hours)
  const awardFloorRate = getRoleRateFloor(input.role)
  const baseRate = normaliseOfferedRate(input.role, input.hourlyRate)
  const basePay = roundMoney(baseRate * roundedHours)
  const components: PayComponent[] = []

  if (input.hourlyRate > 0 && input.hourlyRate < awardFloorRate) {
    components.push({
      code: 'AWARD_GUARDRAIL',
      label: 'Award wage guardrail top-up',
      amount: roundMoney((awardFloorRate - input.hourlyRate) * roundedHours),
    })
  }

  const weekendHours = getWindowHours(input.startTime, input.endTime, date => {
    const { weekday } = getMelbourneParts(date)
    return weekday === 'Sat' || weekday === 'Sun'
  })
  if (weekendHours > 0) {
    components.push({
      code: 'WEEKEND_LOADING',
      label: 'Weekend loading',
      amount: roundMoney(baseRate * weekendHours * WEEKEND_LOADING_RATE),
    })
  }

  const nightHours = getWindowHours(input.startTime, input.endTime, date => {
    const { hour } = getMelbourneParts(date)
    return hour >= 22 || hour < 6
  })
  if (nightHours > 0) {
    components.push({
      code: 'NIGHT_LOADING',
      label: 'Night shift loading',
      amount: roundMoney(baseRate * nightHours * NIGHT_LOADING_RATE),
    })
  }

  if (input.urgent) {
    components.push({
      code: 'URGENT_UPLIFT',
      label: 'Urgent shift uplift',
      amount: roundMoney(basePay * URGENT_LOADING_RATE),
    })
  }

  const qualifiesForErtc = Boolean(input.urgent) || weekendHours > 0 || nightHours > 0
  const ertcIncentive = qualifiesForErtc
    ? Math.min(ERTC_INCENTIVE_CAP, basePay * ERTC_INCENTIVE_RATE)
    : 0
  if (ertcIncentive > 0) {
    components.push({
      code: 'ERTC_INCENTIVE',
      label: 'ERTC incentive',
      amount: roundMoney(ertcIncentive),
    })
  }

  const extras = roundMoney(components.reduce((sum, component) => sum + component.amount, 0))
  const total = roundMoney(basePay + extras)

  return {
    hours: roundedHours,
    baseRate,
    awardFloorRate,
    basePay,
    weekendHours,
    nightHours,
    extras,
    total,
    effectiveHourlyRate: roundedHours > 0 ? roundMoney(total / roundedHours) : 0,
    components,
  }
}
