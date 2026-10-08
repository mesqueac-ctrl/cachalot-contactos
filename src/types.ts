export type NoteKind = 'llamada' | 'reunion' | 'correo' | 'nota'

export interface Note {
  id: string
  body: string
  kind: NoteKind
  createdAt: string
}

export type ContactStatus = 'nuevo' | 'activo' | 'seguimiento'

/** Lo siguiente que hay que hacer con el contacto. `date` es un día local: AAAA-MM-DD. */
export interface NextStep {
  date: string
  text: string
}

export interface Contact {
  id: string
  name: string
  email: string
  phone: string
  company: string
  role: string
  status: ContactStatus
  notes: Note[]
  nextStep: NextStep | null
  createdAt: string
  updatedAt: string
}

export type ContactInput = Pick<
  Contact,
  'name' | 'email' | 'phone' | 'company' | 'role' | 'status'
>
