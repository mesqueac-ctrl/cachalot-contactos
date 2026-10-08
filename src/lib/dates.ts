const dateFormat = new Intl.DateTimeFormat('es-CO', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

const timeFormat = new Intl.DateTimeFormat('es-CO', { hour: 'numeric', minute: '2-digit' })

const relativeFormat = new Intl.RelativeTimeFormat('es', { numeric: 'auto' })

export function formatDate(iso: string) {
  return dateFormat.format(new Date(iso))
}

export function formatTime(iso: string) {
  return timeFormat.format(new Date(iso))
}

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 60 * 60 * 24 * 365],
  ['month', 60 * 60 * 24 * 30],
  ['week', 60 * 60 * 24 * 7],
  ['day', 60 * 60 * 24],
  ['hour', 60 * 60],
  ['minute', 60],
]

export function formatRelative(iso: string, now = new Date()) {
  const seconds = (new Date(iso).getTime() - now.getTime()) / 1000
  for (const [unit, size] of UNITS) {
    if (Math.abs(seconds) >= size) return relativeFormat.format(Math.round(seconds / size), unit)
  }
  return 'justo ahora'
}

/* Días de calendario (AAAA-MM-DD, hora local), para el próximo paso de cada contacto. */

export function toDayKey(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function parseDayKey(key: string) {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(key: string, days: number) {
  const date = parseDayKey(key)
  date.setDate(date.getDate() + days)
  return toDayKey(date)
}

/** Días que faltan para `key` contando desde hoy: 0 es hoy, negativo es atrasado. */
export function daysUntil(key: string, now = new Date()) {
  const today = parseDayKey(toDayKey(now))
  return Math.round((parseDayKey(key).getTime() - today.getTime()) / 86_400_000)
}

const dayFormat = new Intl.DateTimeFormat('es-CO', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
})

/** "jue, 9 oct" */
export function formatDay(key: string) {
  return dayFormat.format(parseDayKey(key)).replace(/\./g, '')
}

/** "hoy", "mañana", "hace 2 días", "dentro de 6 días" */
export function formatDue(key: string, now = new Date()) {
  return relativeFormat.format(daysUntil(key, now), 'day')
}
