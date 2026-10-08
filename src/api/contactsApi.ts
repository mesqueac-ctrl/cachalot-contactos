import seed from '../data/contacts.json'
import type { Contact, ContactInput, Note, NoteKind } from '../types'

export const STORAGE_KEY = 'cachalot.contactos.v2'

/**
 * Cómo se comporta la API simulada:
 * - `normal`: lee y escribe en localStorage (se siembra con contacts.json la primera vez).
 * - `error`: todas las peticiones fallan, para ver el estado de error.
 * - `vacio`: arranca sin contactos, para ver el estado de lista vacía.
 */
export type SimulationMode = 'normal' | 'error' | 'vacio'

export interface ContactsApi {
  list(): Promise<Contact[]>
  create(input: ContactInput): Promise<Contact>
  update(id: string, input: ContactInput): Promise<Contact>
  remove(id: string): Promise<void>
  addNote(contactId: string, body: string, kind: NoteKind): Promise<Note>
  removeNote(contactId: string, noteId: string): Promise<void>
}

export class ApiError extends Error {
  readonly status: number

  constructor(message: string, status = 500) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

interface Options {
  storage?: Pick<Storage, 'getItem' | 'setItem'>
  delayMs?: number
  mode?: SimulationMode
  initialData?: Contact[]
}

export function createContactsApi({
  storage = window.localStorage,
  delayMs = 500,
  mode = 'normal',
  initialData = seed as Contact[],
}: Options = {}): ContactsApi {
  const wait = () => new Promise((resolve) => setTimeout(resolve, delayMs))

  function read(): Contact[] {
    const raw = storage.getItem(STORAGE_KEY)
    if (raw === null) {
      const start = structuredClone(initialData)
      write(start)
      return start
    }
    try {
      return (JSON.parse(raw) as Contact[]).map(withDefaults)
    } catch {
      throw new ApiError('Los datos guardados en este navegador están dañados.')
    }
  }

  function write(contacts: Contact[]) {
    storage.setItem(STORAGE_KEY, JSON.stringify(contacts))
  }

  async function request<T>(operation: () => T): Promise<T> {
    await wait()
    if (mode === 'error') {
      throw new ApiError('El servidor no respondió. Revisa tu conexión e inténtalo de nuevo.', 503)
    }
    return operation()
  }

  function findIndex(contacts: Contact[], id: string) {
    const index = contacts.findIndex((contact) => contact.id === id)
    if (index === -1) throw new ApiError('Este contacto ya no existe.', 404)
    return index
  }

  function clean(input: ContactInput): ContactInput {
    return {
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      phone: input.phone.trim(),
      company: input.company.trim(),
      role: input.role.trim(),
      status: input.status,
    }
  }

  return {
    list: () => request(() => read()),

    create: (input) =>
      request(() => {
        const contacts = read()
        const now = new Date().toISOString()
        const contact: Contact = {
          id: crypto.randomUUID(),
          ...clean(input),
          notes: [],
          createdAt: now,
          updatedAt: now,
        }
        write([...contacts, contact])
        return contact
      }),

    update: (id, input) =>
      request(() => {
        const contacts = read()
        const index = findIndex(contacts, id)
        const updated: Contact = {
          ...contacts[index],
          ...clean(input),
          updatedAt: new Date().toISOString(),
        }
        contacts[index] = updated
        write(contacts)
        return updated
      }),

    remove: (id) =>
      request(() => {
        const contacts = read()
        findIndex(contacts, id)
        write(contacts.filter((contact) => contact.id !== id))
      }),

    addNote: (contactId, body, kind) =>
      request(() => {
        const contacts = read()
        const index = findIndex(contacts, contactId)
        const now = new Date().toISOString()
        const note: Note = { id: crypto.randomUUID(), body: body.trim(), kind, createdAt: now }
        contacts[index] = {
          ...contacts[index],
          notes: [note, ...contacts[index].notes],
          updatedAt: now,
        }
        write(contacts)
        return note
      }),

    removeNote: (contactId, noteId) =>
      request(() => {
        const contacts = read()
        const index = findIndex(contacts, contactId)
        const notes = contacts[index].notes
        if (!notes.some((n) => n.id === noteId)) throw new ApiError('Esta nota ya no existe.', 404)
        contacts[index] = { ...contacts[index], notes: notes.filter((n) => n.id !== noteId) }
        write(contacts)
      }),
  }
}

/** Completa campos que datos guardados por versiones anteriores podrían no tener. */
function withDefaults(contact: Contact): Contact {
  return {
    ...contact,
    role: contact.role ?? '',
    status: contact.status ?? 'nuevo',
    notes: (contact.notes ?? []).map((note) => ({ ...note, kind: note.kind ?? 'nota' })),
  }
}

export function createMemoryStorage(): Pick<Storage, 'getItem' | 'setItem'> {
  const store = new Map<string, string>()
  return {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => void store.set(key, value),
  }
}

/** Lee `?simular=error` o `?simular=vacio` de la URL. */
export function readSimulationMode(search = window.location.search): SimulationMode {
  const value = new URLSearchParams(search).get('simular')
  return value === 'error' || value === 'vacio' ? value : 'normal'
}

/** API que usa la app. En modo `vacio` trabaja en memoria para no tocar los datos guardados. */
export function createBrowserApi(mode = readSimulationMode()): ContactsApi {
  if (mode === 'vacio') {
    return createContactsApi({ mode, storage: createMemoryStorage(), initialData: [] })
  }
  return createContactsApi({ mode })
}
