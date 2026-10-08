import { screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderApp } from './test/renderApp'

const list = () => screen.getByRole('list', { name: 'Lista de contactos' })

describe('lista de contactos', () => {
  it('muestra el estado de carga y luego los contactos con nombre, correo, teléfono y empresa', async () => {
    renderApp()
    expect(screen.getByText('Cargando contactos…')).toBeInTheDocument()

    const row = await screen.findByRole('link', { name: /Valentina Ríos/ })
    expect(row).toHaveTextContent('Andina Logística')
    expect(row).toHaveTextContent('valentina.rios@andinalogistica.co')
    expect(row).toHaveTextContent('+57 310 482 1937')
    expect(screen.getByText('12 contactos')).toBeInTheDocument()
  })

  it('filtra por empresa sin importar tildes', async () => {
    const { user } = renderApp()
    await screen.findByRole('link', { name: /Valentina Ríos/ })

    await user.type(screen.getByLabelText('Buscar por nombre o empresa'), 'logistica')

    await waitFor(() => expect(within(list()).getAllByRole('link')).toHaveLength(2))
    expect(within(list()).getByRole('link', { name: /Mariana Londoño/ })).toBeInTheDocument()
    expect(screen.getByText('2 resultados de 12')).toBeInTheDocument()
  })

  it('avisa cuando no hay resultados y permite limpiar la búsqueda', async () => {
    const { user } = renderApp()
    await screen.findByRole('link', { name: /Valentina Ríos/ })

    await user.type(screen.getByLabelText('Buscar por nombre o empresa'), 'zzz')
    expect(await screen.findByText('Ningún contacto coincide con “zzz”')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Limpiar búsqueda' }))
    expect(await screen.findByText('12 contactos')).toBeInTheDocument()
  })

  it('muestra el estado vacío cuando no hay contactos', async () => {
    renderApp({ initialData: [] })
    expect(await screen.findByText('Todavía no hay contactos')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Crear el primer contacto' })).toBeInTheDocument()
  })

  it('muestra el error y un botón para reintentar', async () => {
    renderApp({ mode: 'error' })
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('No pudimos cargar los contactos')
    expect(within(alert).getByRole('button', { name: 'Reintentar' })).toBeInTheDocument()
  })
})

describe('detalle y notas', () => {
  it('muestra los datos del contacto y sus notas', async () => {
    renderApp({ route: '/contactos/c-001' })
    expect(await screen.findByRole('heading', { name: 'Valentina Ríos' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'valentina.rios@andinalogistica.co' })).toHaveAttribute(
      'href',
      'mailto:valentina.rios@andinalogistica.co',
    )
    const notes = screen.getByRole('list', { name: /Historial de notas/ })
    expect(within(notes).getAllByRole('listitem')).toHaveLength(2)
  })

  it('agrega una nota y la pone de primera', async () => {
    const { user } = renderApp({ route: '/contactos/c-001' })
    await screen.findByRole('heading', { name: 'Valentina Ríos' })

    await user.click(screen.getByRole('button', { name: 'Agregar nota' }))
    expect(screen.getByText('Escribe la nota antes de guardarla.')).toBeInTheDocument()

    await user.type(screen.getByLabelText('Nueva nota'), 'Llamada de seguimiento el 7 de octubre')
    await user.click(screen.getByRole('button', { name: 'Agregar nota' }))

    const notes = screen.getByRole('list', { name: /Historial de notas/ })
    await waitFor(() => expect(within(notes).getAllByRole('listitem')).toHaveLength(3))
    expect(within(notes).getAllByRole('listitem')[0]).toHaveTextContent(
      'Llamada de seguimiento el 7 de octubre',
    )
    expect(screen.getByLabelText('Nueva nota')).toHaveValue('')
  })

  it('avisa si el contacto no existe', async () => {
    renderApp({ route: '/contactos/no-existe' })
    expect(await screen.findByText('Este contacto no existe')).toBeInTheDocument()
  })

  it('elimina un contacto tras confirmar', async () => {
    const { user } = renderApp({ route: '/contactos/c-003' })
    await screen.findByRole('heading', { name: 'Camila Ortega' })

    await user.click(screen.getByRole('button', { name: 'Eliminar' }))
    await user.click(screen.getByRole('button', { name: 'Eliminar contacto' }))

    expect(await screen.findByText('11 contactos')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Camila Ortega/ })).not.toBeInTheDocument()
  })
})

describe('formulario de contacto', () => {
  it('marca los campos obligatorios con mensajes junto a cada uno', async () => {
    const { user } = renderApp({ route: '/contactos/nuevo' })
    await screen.findByText('12 contactos')

    await user.click(screen.getByRole('button', { name: 'Crear contacto' }))

    const name = screen.getByLabelText('Nombre')
    expect(name).toHaveAttribute('aria-invalid', 'true')
    expect(name).toHaveAccessibleDescription('Escribe el nombre del contacto.')
    expect(name).toHaveFocus()
    expect(screen.getByLabelText('Correo electrónico')).toHaveAccessibleDescription(
      'Escribe el correo electrónico.',
    )
    expect(screen.getByRole('alert')).toHaveTextContent('Hay 2 campos por corregir.')
  })

  it('valida el formato del correo', async () => {
    const { user } = renderApp({ route: '/contactos/nuevo' })
    await screen.findByText('12 contactos')

    await user.type(screen.getByLabelText('Correo electrónico'), 'maicol@correo')
    await user.tab()

    expect(screen.getByLabelText('Correo electrónico')).toHaveAccessibleDescription(
      'Escribe un correo válido, por ejemplo nombre@empresa.com.',
    )
  })

  it('crea el contacto y abre su detalle', async () => {
    const { user } = renderApp({ route: '/contactos/nuevo' })
    await screen.findByText('12 contactos')

    await user.type(screen.getByLabelText('Nombre'), 'Maicol Mesa')
    await user.type(screen.getByLabelText('Correo electrónico'), 'maicol@cachalot.co')
    await user.type(screen.getByLabelText('Empresa (opcional)'), 'Cachalot')
    await user.click(screen.getByRole('button', { name: 'Crear contacto' }))

    expect(await screen.findByRole('heading', { name: 'Maicol Mesa' })).toBeInTheDocument()
    expect(screen.getByText('13 contactos')).toBeInTheDocument()
    expect(screen.getByText('Contacto creado: Maicol Mesa')).toBeInTheDocument()
  })

  it('edita un contacto existente', async () => {
    const { user } = renderApp({ route: '/contactos/c-003/editar' })
    const company = await screen.findByLabelText('Empresa (opcional)')
    expect(company).toHaveValue('Ortega & Pardo Abogados')

    await user.clear(company)
    await user.type(company, 'Ortega Abogados')
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    expect(await screen.findByRole('heading', { name: 'Camila Ortega' })).toBeInTheDocument()
    expect(screen.getByText('Cambios guardados')).toBeInTheDocument()
  })
})
