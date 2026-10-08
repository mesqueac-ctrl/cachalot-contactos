import { describe, expect, it } from 'vitest'
import type { Contact, Note } from '../types'
import { lastInteraction, needingFollowUp, recentNotes } from './crm'

const now = new Date('2026-10-08T12:00:00Z')

function contact(id: string, createdAt: string, notes: Partial<Note>[] = []): Contact {
  return {
    id,
    name: id,
    email: `${id}@x.co`,
    phone: '',
    company: '',
    role: '',
    status: 'activo',
    createdAt,
    updatedAt: createdAt,
    notes: notes.map((n, i) => ({ id: `${id}-${i}`, body: '', kind: 'nota', createdAt: '', ...n })),
  }
}

describe('seguimiento', () => {
  it('usa la última nota como último contacto, o la creación si no hay notas', () => {
    const conNotas = contact('a', '2026-01-01T00:00:00Z', [
      { createdAt: '2026-09-01T00:00:00Z' },
      { createdAt: '2026-10-01T00:00:00Z' },
    ])
    expect(lastInteraction(conNotas)).toBe('2026-10-01T00:00:00Z')
    expect(lastInteraction(contact('b', '2026-02-02T00:00:00Z'))).toBe('2026-02-02T00:00:00Z')
  })

  it('lista a quienes llevan más de 21 días sin contacto, del más antiguo primero', () => {
    const contacts = [
      contact('reciente', '2026-01-01T00:00:00Z', [{ createdAt: '2026-10-01T00:00:00Z' }]),
      contact('olvidado', '2026-01-01T00:00:00Z', [{ createdAt: '2026-07-01T00:00:00Z' }]),
      contact('sin-notas', '2026-08-15T00:00:00Z'),
    ]
    expect(needingFollowUp(contacts, now).map((f) => f.contact.id)).toEqual([
      'olvidado',
      'sin-notas',
    ])
  })

  it('ordena la actividad reciente de todos los contactos', () => {
    const contacts = [
      contact('a', '2026-01-01T00:00:00Z', [{ createdAt: '2026-09-01T00:00:00Z' }]),
      contact('b', '2026-01-01T00:00:00Z', [{ createdAt: '2026-10-01T00:00:00Z' }]),
    ]
    expect(recentNotes(contacts, 1).map((r) => r.contact.id)).toEqual(['b'])
  })
})
