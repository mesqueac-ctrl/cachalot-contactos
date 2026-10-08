import { describe, expect, it } from 'vitest'
import type { Contact, Note } from '../types'
import { agenda, dueState, lastInteraction, needingFollowUp, recentNotes } from './crm'

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
    nextStep: null,
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

  it('no cuenta como olvidado a quien ya tiene un próximo paso agendado', () => {
    const olvidado = contact('olvidado', '2026-01-01T00:00:00Z')
    const agendado = { ...olvidado, id: 'agendado', nextStep: { date: '2026-10-20', text: '' } }
    expect(needingFollowUp([olvidado, agendado], now).map((f) => f.contact.id)).toEqual([
      'olvidado',
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

describe('agenda', () => {
  const local = new Date(2026, 9, 8, 9, 0) // 8 de octubre, hora local
  const withStep = (id: string, date: string) => ({
    ...contact(id, '2026-01-01T00:00:00Z'),
    nextStep: { date, text: `Paso de ${id}` },
  })

  it('agrupa los próximos pasos en atrasados, hoy, esta semana y más adelante', () => {
    const groups = agenda(
      [
        withStep('semana', '2026-10-12'),
        withStep('hoy', '2026-10-08'),
        withStep('muy-atrasado', '2026-09-30'),
        withStep('atrasado', '2026-10-07'),
        withStep('luego', '2026-11-02'),
        contact('sin-paso', '2026-01-01T00:00:00Z'),
      ],
      local,
    )
    expect(groups.overdue.map((i) => i.contact.id)).toEqual(['muy-atrasado', 'atrasado'])
    expect(groups.today.map((i) => i.contact.id)).toEqual(['hoy'])
    expect(groups.week.map((i) => [i.contact.id, i.days])).toEqual([['semana', 4]])
    expect(groups.later.map((i) => i.contact.id)).toEqual(['luego'])
  })

  it('clasifica una fecha según el día de hoy', () => {
    expect(dueState('2026-10-07', local)).toBe('atrasado')
    expect(dueState('2026-10-08', local)).toBe('hoy')
    expect(dueState('2026-10-09', local)).toBe('proximo')
  })
})
