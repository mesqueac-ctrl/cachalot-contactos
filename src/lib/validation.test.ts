import { describe, expect, it } from 'vitest'
import { validateContact } from './validation'

const valid = { name: 'Valentina Ríos', email: 'valentina@andina.co', phone: '', company: '' }

describe('validateContact', () => {
  it('acepta un contacto con nombre y correo válidos', () => {
    expect(validateContact(valid)).toEqual({})
  })

  it('exige el nombre', () => {
    expect(validateContact({ ...valid, name: '   ' }).name).toBe('Escribe el nombre del contacto.')
  })

  it('exige el correo', () => {
    expect(validateContact({ ...valid, email: '' }).email).toBe('Escribe el correo electrónico.')
  })

  it.each(['valentina', 'valentina@', 'valentina@andina', 'val entina@andina.co', '@andina.co'])(
    'rechaza el correo con formato inválido "%s"',
    (email) => {
      expect(validateContact({ ...valid, email }).email).toMatch(/correo válido/)
    },
  )

  it('rechaza un correo que ya usa otro contacto, sin importar mayúsculas', () => {
    const errors = validateContact(
      { ...valid, email: 'Valentina@Andina.co' },
      { takenEmails: ['valentina@andina.co'] },
    )
    expect(errors.email).toBe('Ya hay otro contacto con este correo.')
  })

  it('valida el teléfono solo si se escribe', () => {
    expect(validateContact({ ...valid, phone: '+57 310 482 1937' }).phone).toBeUndefined()
    expect(validateContact({ ...valid, phone: '123' }).phone).toBeDefined()
    expect(validateContact({ ...valid, phone: '310-abc-1937' }).phone).toBeDefined()
  })
})
