import { createContext, useContext } from 'react'
import type { Contact, ContactInput, Note } from '../types'

export type LoadStatus = 'loading' | 'ready' | 'error'

export interface ContactsContextValue {
  status: LoadStatus
  contacts: Contact[]
  error: string | null
  reload: () => void
  createContact: (input: ContactInput) => Promise<Contact>
  updateContact: (id: string, input: ContactInput) => Promise<Contact>
  deleteContact: (id: string) => Promise<void>
  addNote: (contactId: string, body: string) => Promise<Note>
}

export const ContactsContext = createContext<ContactsContextValue | null>(null)

export function useContacts() {
  const value = useContext(ContactsContext)
  if (!value) throw new Error('useContacts debe usarse dentro de <ContactsProvider>')
  return value
}
