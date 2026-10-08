import { createContext, useContext } from 'react'
import type { Contact, ContactInput, ContactStatus, NextStep, Note, NoteKind } from '../types'

export type LoadStatus = 'loading' | 'ready' | 'error'

export interface ContactsContextValue {
  status: LoadStatus
  contacts: Contact[]
  error: string | null
  reload: () => void
  createContact: (input: ContactInput) => Promise<Contact>
  updateContact: (id: string, input: ContactInput) => Promise<Contact>
  deleteContact: (id: string) => Promise<void>
  changeStatus: (id: string, status: ContactStatus) => Promise<Contact>
  addNote: (
    contactId: string,
    body: string,
    kind: NoteKind,
    nextStep?: NextStep | null,
  ) => Promise<Note>
  removeNote: (contactId: string, noteId: string) => Promise<void>
  restoreNote: (contactId: string, note: Note) => Promise<void>
  setNextStep: (contactId: string, nextStep: NextStep | null) => Promise<void>
}

export const ContactsContext = createContext<ContactsContextValue | null>(null)

export function useContacts() {
  const value = useContext(ContactsContext)
  if (!value) throw new Error('useContacts debe usarse dentro de <ContactsProvider>')
  return value
}
