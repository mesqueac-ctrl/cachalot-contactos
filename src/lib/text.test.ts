import { describe, expect, it } from 'vitest'
import type { Contact } from '../types'
import { findMatch, groupByInitial, initials, matchesQuery, normalize, sortByName } from './text'

function contact(name: string, company = ''): Contact {
  return {
    id: name,
    name,
    company,
    email: 'x@y.co',
    phone: '',
    notes: [],
    createdAt: '',
    updatedAt: '',
  }
}

describe('búsqueda', () => {
  it('ignora tildes y mayúsculas', () => {
    expect(normalize('Andrés Mejía')).toBe('andres mejia')
    expect(matchesQuery(contact('Andrés Mejía'), 'ANDRES')).toBe(true)
  })

  it('busca por nombre o por empresa, pero no por correo', () => {
    const c = contact('Laura Valencia', 'Banco Terra')
    expect(matchesQuery(c, 'terra')).toBe(true)
    expect(matchesQuery(c, 'valen')).toBe(true)
    expect(matchesQuery(c, 'x@y')).toBe(false)
  })

  it('ubica la coincidencia en el texto original aunque tenga tildes', () => {
    expect(findMatch('Andina Logística', 'logistica')).toEqual([7, 16])
  })
})

describe('agrupación', () => {
  it('ordena alfabéticamente y agrupa por inicial sin tilde', () => {
    const groups = groupByInitial(
      sortByName([contact('Óscar Peña'), contact('Ana Ruiz'), contact('Olga Díaz')]),
    )
    expect(groups.map((g) => g.letter)).toEqual(['A', 'O'])
    expect(groups[1].contacts.map((c) => c.name)).toEqual(['Olga Díaz', 'Óscar Peña'])
  })

  it('arma iniciales con el primer y el último nombre', () => {
    expect(initials('Andrés Felipe Mejía')).toBe('AM')
    expect(initials('Camila')).toBe('C')
  })
})
