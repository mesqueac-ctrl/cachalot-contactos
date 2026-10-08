import { describe, expect, it } from 'vitest'
import { STORAGE_KEY, createContactsApi, createMemoryStorage, readSimulationMode } from './contactsApi'

function setup(mode: 'normal' | 'error' = 'normal') {
  const storage = createMemoryStorage()
  return { storage, api: createContactsApi({ storage, delayMs: 0, mode, initialData: [] }) }
}

describe('API simulada', () => {
  it('crea contactos limpiando espacios y guardándolos', async () => {
    const { api, storage } = setup()
    const created = await api.create({
      name: '  Camila Ortega ',
      email: ' Camila@Ortega.legal ',
      phone: '',
      company: 'Ortega & Pardo',
    })
    expect(created.name).toBe('Camila Ortega')
    expect(created.email).toBe('camila@ortega.legal')
    expect(JSON.parse(storage.getItem(STORAGE_KEY)!)).toHaveLength(1)
  })

  it('agrega notas al inicio del historial', async () => {
    const { api } = setup()
    const { id } = await api.create({ name: 'Ana', email: 'ana@a.co', phone: '', company: '' })
    await api.addNote(id, 'Primera')
    await api.addNote(id, 'Segunda')
    const [contact] = await api.list()
    expect(contact.notes.map((n) => n.body)).toEqual(['Segunda', 'Primera'])
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
