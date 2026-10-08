import type { ContactInput } from '../types'

export type ContactErrors = Partial<Record<keyof ContactInput, string>>

export const EMAIL_PATTERN = /^[^\s@]+@([^\s@.]+\.)+[^\s@.]{2,}$/
const PHONE_ALLOWED = /^[\d\s()+-]+$/
const NAME_MAX = 80
const COMPANY_MAX = 80
const ROLE_MAX = 60

interface Options {
  /** Correos ya usados por otros contactos (en minúsculas). */
  takenEmails?: string[]
}

export function validateContact(input: ContactInput, { takenEmails = [] }: Options = {}) {
  const errors: ContactErrors = {}
  const name = input.name.trim()
  const email = input.email.trim().toLowerCase()
  const phone = input.phone.trim()
  const company = input.company.trim()

  if (!name) errors.name = 'Escribe el nombre del contacto.'
  else if (name.length < 2) errors.name = 'El nombre debe tener al menos 2 letras.'
  else if (name.length > NAME_MAX) errors.name = `El nombre puede tener hasta ${NAME_MAX} caracteres.`

  if (!email) errors.email = 'Escribe el correo electrónico.'
  else if (!EMAIL_PATTERN.test(email))
    errors.email = 'Escribe un correo válido, por ejemplo nombre@empresa.com.'
  else if (takenEmails.includes(email)) errors.email = 'Ya hay otro contacto con este correo.'

  if (phone) {
    const digits = phone.replace(/\D/g, '').length
    if (!PHONE_ALLOWED.test(phone) || digits < 7 || digits > 15)
      errors.phone = 'Escribe un teléfono de 7 a 15 dígitos. Puedes usar espacios, +, guiones y paréntesis.'
  }

  if (company.length > COMPANY_MAX)
    errors.company = `El nombre de la empresa puede tener hasta ${COMPANY_MAX} caracteres.`

  if (input.role.trim().length > ROLE_MAX)
    errors.role = `El cargo puede tener hasta ${ROLE_MAX} caracteres.`

  return errors
}

export function hasErrors(errors: ContactErrors) {
  return Object.keys(errors).length > 0
}
