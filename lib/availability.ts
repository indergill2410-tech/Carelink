export const AVAILABILITY_TIME_ZONE = 'Australia/Melbourne'

export const AVAILABILITY_DAYS = [
  { key: 'mon', label: 'Mon', weekday: 'Mon' },
  { key: 'tue', label: 'Tue', weekday: 'Tue' },
  { key: 'wed', label: 'Wed', weekday: 'Wed' },
  { key: 'thu', label: 'Thu', weekday: 'Thu' },
  { key: 'fri', label: 'Fri', weekday: 'Fri' },
  { key: 'sat', label: 'Sat', weekday: 'Sat' },
  { key: 'sun', label: 'Sun', weekday: 'Sun' },
] as const

export const AVAILABILITY_PERIODS = [
  { key: 'am', label: 'AM', from: 5, to: 12 },
  { key: 'pm', label: 'PM', from: 12, to: 20 },
  { key: 'night', label: 'Night', from: 20, to: 5 },
] as const

export type AvailabilityDayKey = (typeof AVAILABILITY_DAYS)[number]['key']
export type AvailabilityPeriodKey = (typeof AVAILABILITY_PERIODS)[number]['key']
export type WorkerAvailability = Record<AvailabilityDayKey, Record<AvailabilityPeriodKey, boolean>>

const DAY_BY_WEEKDAY = new Map(
  AVAILABILITY_DAYS.map(day => [day.weekday.toLowerCase(), day.key] as const),
)

export function emptyAvailability(): WorkerAvailability {
  return Object.fromEntries(
    AVAILABILITY_DAYS.map(day => [
      day.key,
      Object.fromEntries(AVAILABILITY_PERIODS.map(period => [period.key, false])),
    ]),
  ) as WorkerAvailability
}

export function normalizeAvailability(value: unknown): WorkerAvailability {
  const normalized = emptyAvailability()
  if (!value || typeof value !== 'object' || Array.isArray(value)) return normalized

  for (const day of AVAILABILITY_DAYS) {
    const rawDay = (value as Record<string, unknown>)[day.key]
    if (!rawDay || typeof rawDay !== 'object' || Array.isArray(rawDay)) continue
    for (const period of AVAILABILITY_PERIODS) {
      normalized[day.key][period.key] = Boolean((rawDay as Record<string, unknown>)[period.key])
    }
  }

  return normalized
}

export function hasAvailability(value: unknown): boolean {
  const availability = normalizeAvailability(value)
  return AVAILABILITY_DAYS.some(day =>
    AVAILABILITY_PERIODS.some(period => availability[day.key][period.key]),
  )
}

export function availabilityFromFormData(formData: FormData): WorkerAvailability {
  const availability = emptyAvailability()
  for (const day of AVAILABILITY_DAYS) {
    for (const period of AVAILABILITY_PERIODS) {
      availability[day.key][period.key] = formData.get(`availability.${day.key}.${period.key}`) === 'on'
    }
  }
  return availability
}

export function getShiftAvailabilitySlot(date: Date): {
  day: AvailabilityDayKey
  period: AvailabilityPeriodKey
} | null {
  const weekday = new Intl.DateTimeFormat('en-AU', {
    weekday: 'short',
    timeZone: AVAILABILITY_TIME_ZONE,
  }).format(date).toLowerCase()

  const day = DAY_BY_WEEKDAY.get(weekday)
  if (!day) return null

  const hourText = new Intl.DateTimeFormat('en-AU', {
    hour: '2-digit',
    hour12: false,
    timeZone: AVAILABILITY_TIME_ZONE,
  }).format(date)
  const hour = Number(hourText) % 24
  if (!Number.isFinite(hour)) return null

  if (hour >= 5 && hour < 12) return { day, period: 'am' }
  if (hour >= 12 && hour < 20) return { day, period: 'pm' }
  return { day, period: 'night' }
}

export function isShiftAllowedByAvailability(value: unknown, startTime: Date): boolean {
  if (!hasAvailability(value)) return true
  const availability = normalizeAvailability(value)
  const slot = getShiftAvailabilitySlot(startTime)
  if (!slot) return true
  return availability[slot.day][slot.period]
}
