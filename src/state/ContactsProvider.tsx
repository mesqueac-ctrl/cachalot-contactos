import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { ContactsApi } from '../api/contactsApi'
import type { Contact, ContactInput, ContactStatus, NoteKind } from '../types'
import { ContactsContext, type ContactsContextValue, type LoadStatus } from './contactsContext'

interface Props {
  api: ContactsApi
  children: ReactNode
}

export function ContactsProvider({ api, children }: Props) {
  const [status, setStatus] = useState<LoadStatus>('loading')
  const [contacts, setContacts] = useState<Contact[]>([])
  const [error, setError] = useState<string | null>(null)
  const requestId = useRef(0)

  const fetchContacts = useCallback(() => {
    const id = ++requestId.current
    api
      .list()
      .then((data) => {
        if (id !== requestId.current) return
        setContacts(data)
        setStatus('ready')
      })
      .catch((err: unknown) => {
        if (id !== requestId.current) return
        setError(err instanceof Error ? err.message : 'No se pudieron cargar los contactos.')
        setStatus('error')
      })
  }, [api])

  useEffect(() => {
    fetchContacts()
  }, [fetchContacts])

  const reload = useCallback(() => {
    setStatus('loading')
    setError(null)
    fetchContacts()
  }, [fetchContacts])

  const createContact = useCallback(
    async (input: ContactInput) => {
      const created = await api.create(input)
      setContacts((current) => [...current, created])
      return created
    },
    [api],
  )

  const updateContact = useCallback(
    async (id: string, input: ContactInput) => {
      const updated = await api.update(id, input)
      setContacts((current) => current.map((c) => (c.id === id ? updated : c)))
      return updated
    },
    [api],
  )

  const deleteContact = useCallback(
    async (id: string) => {
      await api.remove(id)
      setContacts((current) => current.filter((c) => c.id !== id))
    },
    [api],
  )

  const changeStatus = useCallback(
    async (id: string, nextStatus: ContactStatus) => {
      const contact = contacts.find((c) => c.id === id)
      if (!contact) throw new Error('Este contacto ya no existe.')
      const { name, email, phone, company, role } = contact
      return updateContact(id, { name, email, phone, company, role, status: nextStatus })
    },
    [contacts, updateContact],
  )

  const addNote = useCallback(
    async (contactId: string, body: string, kind: NoteKind) => {
      const note = await api.addNote(contactId, body, kind)
      setContacts((current) =>
        current.map((c) =>
          c.id === contactId ? { ...c, notes: [note, ...c.notes], updatedAt: note.createdAt } : c,
        ),
      )
      return note
    },
    [api],
  )

  const removeNote = useCallback(
    async (contactId: string, noteId: string) => {
      await api.removeNote(contactId, noteId)
      setContacts((current) =>
        current.map((c) =>
          c.id === contactId ? { ...c, notes: c.notes.filter((n) => n.id !== noteId) } : c,
        ),
      )
    },
    [api],
  )

  const value = useMemo<ContactsContextValue>(
    () => ({
      status,
      contacts,
      error,
      reload,
      createContact,
      updateContact,
      deleteContact,
      changeStatus,
      addNote,
      removeNote,
    }),
    [
      status,
      contacts,
      error,
      reload,
      createContact,
      updateContact,
      deleteContact,
      changeStatus,
      addNote,
      removeNote,
    ],
  )

  return <ContactsContext.Provider value={value}>{children}</ContactsContext.Provider>
}
