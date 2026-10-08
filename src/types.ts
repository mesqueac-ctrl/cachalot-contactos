export interface Note {
  id: string
  body: string
  createdAt: string
}

export interface Contact {
  id: string
  name: string
  email: string
  phone: string
  company: string
  notes: Note[]
  createdAt: string
  updatedAt: string
}

export type ContactInput = Pick<Contact, 'name' | 'email' | 'phone' | 'company'>
