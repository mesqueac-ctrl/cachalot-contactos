import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { ContactsApi } from '../api/contactsApi'
import type { Contact, ContactInput } from '../types'
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

  const addNote = useCallback(
    async (contactId: string, body: string) => {
      const note = await api.addNote(contactId, body)
      setContacts((current) =>
        current.map((c) =>
          c.id === contactId ? { ...c, notes: [note, ...c.notes], updatedAt: note.createdAt } : c,
        ),
      )
      return note
    },
    [api],
  )

  const value = useMemo<ContactsContextValue>(
    () => ({ status, contacts, error, reload, createContact, updateContact, deleteContact, addNote }),
    [status, contacts, error, reload, createContact, updateContact, deleteContact, addNote],
  )

  return <ContactsContext.Provider value={value}>{children}</ContactsContext.Provider>
}
