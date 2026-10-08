import type { Contact } from '../types'

/** Minúsculas y sin tildes, carácter por carácter para conservar las posiciones del texto original. */
export function normalize(text: string): string {
  return Array.from(text, (char) => {
    const base = char.normalize('NFD').replace(/\p{Diacritic}/gu, '')
    return base.length === 1 ? base : char
  })
    .join('')
    .toLowerCase()
}

export function matchesQuery(contact: Contact, query: string): boolean {
  const q = normalize(query.trim())
  if (!q) return true
  return normalize(contact.name).includes(q) || normalize(contact.company).includes(q)
}

/** Devuelve [inicio, fin) de la primera coincidencia de `query` en `text`, o null. */
export function findMatch(text: string, query: string): [number, number] | null {
  const q = normalize(query.trim())
  if (!q) return null
  const start = normalize(text).indexOf(q)
  return start === -1 ? null : [start, start + q.length]
}

export function sortByName(contacts: Contact[]): Contact[] {
  return [...contacts].sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }))
}

export interface ContactGroup {
  letter: string
  contacts: Contact[]
}

export function groupByInitial(sorted: Contact[]): ContactGroup[] {
  const groups: ContactGroup[] = []
  for (const contact of sorted) {
    const first = normalize(contact.name.trim().charAt(0)).toUpperCase()
    const letter = /[A-Z]/.test(first) ? first : '#'
    const last = groups.at(-1)
    if (last?.letter === letter) last.contacts.push(contact)
    else groups.push({ letter, contacts: [contact] })
  }
  return groups
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  const first = parts[0].charAt(0)
  const last = parts.length > 1 ? parts.at(-1)!.charAt(0) : ''
  return (first + last).toUpperCase()
}

/** Número estable 0–5 a partir de un texto, para asignar el tono del avatar. */
export function toneFor(seed: string): number {
  let hash = 0
  for (const char of normalize(seed)) hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  return hash % 6
}

export function pluralize(count: number, singular: string, plural: string) {
  return `${count} ${count === 1 ? singular : plural}`
}
