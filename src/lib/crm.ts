import type { Contact, ContactStatus, NoteKind } from '../types'

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

/** Contactos sin interacción en más de FOLLOW_UP_DAYS días, del más olvidado al más reciente. */
export function needingFollowUp(contacts: Contact[], now = new Date()) {
  return contacts
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
