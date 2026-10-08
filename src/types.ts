export type NoteKind = 'llamada' | 'reunion' | 'correo' | 'nota'

export interface Note {
  id: string
  body: string
  kind: NoteKind
  createdAt: string
}

export type ContactStatus = 'nuevo' | 'activo' | 'seguimiento'

export interface Contact {
  id: string
  name: string
  email: string
  phone: string
  company: string
  role: string
  status: ContactStatus
  notes: Note[]
  createdAt: string
  updatedAt: string
}

export type ContactInput = Pick<
  Contact,
  'name' | 'email' | 'phone' | 'company' | 'role' | 'status'
>
