import { describe, expect, it } from 'vitest'
import type { ContactInput } from '../types'
import { STORAGE_KEY, createContactsApi, createMemoryStorage, readSimulationMode } from './contactsApi'

function setup(mode: 'normal' | 'error' = 'normal') {
  const storage = createMemoryStorage()
  return { storage, api: createContactsApi({ storage, delayMs: 0, mode, initialData: [] }) }
}

const input = (overrides: Partial<ContactInput> = {}): ContactInput => ({
  name: 'Ana',
  email: 'ana@a.co',
  phone: '',
  company: '',
  role: '',
  status: 'nuevo',
  ...overrides,
})

describe('API simulada', () => {
  it('crea contactos limpiando espacios y guardándolos', async () => {
    const { api, storage } = setup()
    const created = await api.create(
      input({ name: '  Camila Ortega ', email: ' Camila@Ortega.legal ', role: ' Socia ' }),
    )
    expect(created).toMatchObject({
      name: 'Camila Ortega',
      email: 'camila@ortega.legal',
      role: 'Socia',
      status: 'nuevo',
    })
    expect(JSON.parse(storage.getItem(STORAGE_KEY)!)).toHaveLength(1)
  })

  it('agrega notas con su tipo al inicio del historial y permite eliminarlas', async () => {
    const { api } = setup()
    const { id } = await api.create(input())
    const first = await api.addNote(id, 'Primera', 'llamada')
    await api.addNote(id, 'Segunda', 'correo')

    let [contact] = await api.list()
    expect(contact.notes.map((n) => [n.body, n.kind])).toEqual([
      ['Segunda', 'correo'],
      ['Primera', 'llamada'],
    ])

    await api.removeNote(id, first.id)
    ;[contact] = await api.list()
    expect(contact.notes.map((n) => n.body)).toEqual(['Segunda'])
  })

  it('completa campos que faltan en datos guardados por versiones anteriores', async () => {
    const storage = createMemoryStorage()
    storage.setItem(
      STORAGE_KEY,
      JSON.stringify([{ id: '1', name: 'Viejo', email: 'v@v.co', notes: [{ id: 'n', body: 'x' }] }]),
    )
    const [contact] = await createContactsApi({ storage, delayMs: 0 }).list()
    expect(contact).toMatchObject({ role: '', status: 'nuevo', notes: [{ kind: 'nota' }] })
  })

  it('responde 404 si el contacto no existe', async () => {
    const { api } = setup()
    await expect(api.remove('no-existe')).rejects.toMatchObject({ status: 404 })
  })

  it('falla todas las peticiones en modo error', async () => {
    const { api } = setup('error')
    await expect(api.list()).rejects.toThrow(/servidor no respondió/)
  })

  it('lee el modo de simulación de la URL', () => {
    expect(readSimulationMode('?simular=error')).toBe('error')
    expect(readSimulationMode('?simular=vacio')).toBe('vacio')
    expect(readSimulationMode('?simular=otro')).toBe('normal')
  })
})
