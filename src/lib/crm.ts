import type { Contact, ContactStatus, NextStep, NoteKind } from '../types'
import { daysUntil } from './dates'

export const STATUSES: { value: ContactStatus; label: string; plural: string }[] = [
  { value: 'nuevo', label: 'Nuevo', plural: 'Nuevos' },
  { value: 'activo', label: 'Activo', plural: 'Activos' },
  { value: 'seguimiento', label: 'En seguimiento', plural: 'En seguimiento' },
]

export function statusLabel(status: ContactStatus) {
  return STATUSES.find((s) => s.value === status)?.label ?? status
}

export const NOTE_KINDS: { value: NoteKind; label: string }[] = [
  { value: 'llamada', label: 'Llamada' },
  { value: 'reunion', label: 'Reunión' },
  { value: 'correo', label: 'Correo' },
  { value: 'nota', label: 'Nota' },
]

export function noteKindLabel(kind: NoteKind) {
  return NOTE_KINDS.find((k) => k.value === kind)?.label ?? 'Nota'
}

/** Fecha de la última nota; si no hay notas, la fecha de creación del contacto. */
export function lastInteraction(contact: Contact): string {
  return contact.notes.reduce(
    (latest, note) => (note.createdAt > latest ? note.createdAt : latest),
    contact.notes.length ? '' : contact.createdAt,
  )
}

export const FOLLOW_UP_DAYS = 21

export function daysSince(iso: string, now = new Date()) {
  return Math.floor((now.getTime() - new Date(iso).getTime()) / 86_400_000)
}

/**
 * Contactos olvidados: sin interacción en más de FOLLOW_UP_DAYS días y sin próximo paso
 * agendado (si ya tienen uno, la agenda se encarga). Del más olvidado al más reciente.
 */
export function needingFollowUp(contacts: Contact[], now = new Date()) {
  return contacts
    .filter((contact) => !contact.nextStep)
    .map((contact) => ({ contact, last: lastInteraction(contact) }))
    .filter(({ last }) => daysSince(last, now) > FOLLOW_UP_DAYS)
    .sort((a, b) => a.last.localeCompare(b.last))
}

export function recentNotes(contacts: Contact[], limit: number) {
  return contacts
    .flatMap((contact) => contact.notes.map((note) => ({ contact, note })))
    .sort((a, b) => b.note.createdAt.localeCompare(a.note.createdAt))
    .slice(0, limit)
}

export type DueState = 'atrasado' | 'hoy' | 'proximo'

export function dueState(dayKey: string, now = new Date()): DueState {
  const days = daysUntil(dayKey, now)
  if (days < 0) return 'atrasado'
  if (days === 0) return 'hoy'
  return 'proximo'
}

export interface AgendaItem {
  contact: Contact
  step: NextStep
  days: number
}

/** Próximos pasos agrupados para la agenda, cada grupo del más urgente al menos urgente. */
export function agenda(contacts: Contact[], now = new Date()) {
  const items: AgendaItem[] = contacts
    .filter((contact) => contact.nextStep)
    .map((contact) => ({
      contact,
      step: contact.nextStep!,
      days: daysUntil(contact.nextStep!.date, now),
    }))
    .sort((a, b) => a.days - b.days || a.contact.name.localeCompare(b.contact.name, 'es'))

  return {
    overdue: items.filter((i) => i.days < 0),
    today: items.filter((i) => i.days === 0),
    week: items.filter((i) => i.days > 0 && i.days <= 7),
    later: items.filter((i) => i.days > 7),
  }
}

/** Qué tan "fría" está la relación: menos de 7 días, hasta FOLLOW_UP_DAYS, o más. */
export function freshness(contact: Contact, now = new Date()) {
  const days = daysSince(lastInteraction(contact), now)
  if (days <= 7) return 'reciente' as const
  if (days <= FOLLOW_UP_DAYS) return 'enfriando' as const
  return 'olvidado' as const
}

/** Notas por semana (de la más antigua a la actual), para el gráfico de actividad. */
export function weeklyActivity(contacts: Contact[], weeks: number, now = new Date()) {
  const counts = Array.from({ length: weeks }, () => 0)
  for (const note of contacts.flatMap((c) => c.notes)) {
    const index = weeks - 1 - Math.floor(daysSince(note.createdAt, now) / 7)
    if (index >= 0 && index < weeks) counts[index]++
  }
  return counts
}
