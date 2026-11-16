import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string, timezone?: string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: timezone,
  }).format(d)
}

export function formatTime(date: Date | string, timezone?: string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: timezone,
  }).format(d)
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}

export function formatPrice(
  amount: number | null,
  currency: string = 'USD'
): string {
  if (amount === null) return 'Price on consultation'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount / 100)
}

/**
 * Generates an array of "HH:MM" time slot strings between startTime and endTime,
 * spaced by durationMin minutes, skipping any slots that overlap the break window.
 */
export function generateTimeSlots(
  startTime: string,  // "HH:MM"
  endTime: string,    // "HH:MM"
  durationMin: number,
  breakStart?: string, // "HH:MM"
  breakEnd?: string    // "HH:MM"
): string[] {
  const toMinutes = (t: string) => {
    const [h, m] = t.split(':').map(Number)
    return h * 60 + m
  }
  const toHHMM = (mins: number) => {
    const h = Math.floor(mins / 60)
    const m = mins % 60
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  }

  const start = toMinutes(startTime)
  const end = toMinutes(endTime)
  const breakS = breakStart ? toMinutes(breakStart) : null
  const breakE = breakEnd ? toMinutes(breakEnd) : null

  const slots: string[] = []
  for (let cur = start; cur + durationMin <= end; cur += durationMin) {
    const slotEnd = cur + durationMin
    // Skip if slot overlaps with break
    if (breakS !== null && breakE !== null) {
      if (cur < breakE && slotEnd > breakS) {
        continue
      }
    }
    slots.push(toHHMM(cur))
  }
  return slots
}
