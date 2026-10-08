import { screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { addDays, toDayKey } from './lib/dates'
import type { Contact } from './types'
import { renderApp } from './test/renderApp'

const table = () => screen.getByRole('table', { name: 'Lista de contactos' })
const nameLinks = () => within(table()).getAllByRole('link')
const rowNames = () => nameLinks().map((link) => link.textContent)
const rowOf = (name: RegExp) => within(table()).getByRole('link', { name }).closest('tr')!

describe('lista de contactos', () => {
  it('muestra el estado de carga y luego los contactos con nombre, correo, teléfono y empresa', async () => {
    renderApp({ route: '/contactos' })
    expect(screen.getByText('Cargando contactos…')).toBeInTheDocument()

    await screen.findByText('12 contactos')
    const row = rowOf(/Valentina Ríos/)
    expect(row).toHaveTextContent('Andina Logística')
    expect(row).toHaveTextContent('valentina.rios@andinalogistica.co')
    expect(row).toHaveTextContent('+57 310 482 1937')
    expect(row).toHaveTextContent('En seguimiento')
    expect(row).toHaveTextContent('Enviar la cotización de las 3 bodegas en Funza')
  })

  it('filtra por empresa sin importar tildes', async () => {
    const { user } = renderApp({ route: '/contactos' })
    await screen.findByText('12 contactos')

    await user.type(screen.getByLabelText('Buscar por nombre o empresa'), 'logistica')

    await waitFor(() => expect(nameLinks()).toHaveLength(2))
    expect(within(table()).getByRole('link', { name: /Mariana Londoño/ })).toBeInTheDocument()
    expect(screen.getByText('2 resultados de 12')).toBeInTheDocument()
  })

  it('filtra por estado y combina el filtro con la búsqueda', async () => {
    const { user } = renderApp({ route: '/contactos' })
    await screen.findByText('12 contactos')

    const nuevos = screen.getByRole('button', { name: /^Nuevos/ })
    await user.click(nuevos)
    expect(nuevos).toHaveAttribute('aria-pressed', 'true')
    expect(nameLinks()).toHaveLength(3)

    await user.type(screen.getByLabelText('Buscar por nombre o empresa'), 'banco')
    expect(await screen.findByText('Ningún contacto coincide con “banco”')).toBeInTheDocument()
  })

  it('lee la búsqueda, el filtro y el orden desde la URL', async () => {
    renderApp({ route: '/contactos?q=cafetera&estado=activo&orden=actividad' })
    await screen.findByText('2 resultados de 12')

    expect(screen.getByLabelText('Buscar por nombre o empresa')).toHaveValue('cafetera')
    expect(screen.getByRole('button', { name: /^Activos/ })).toHaveAttribute('aria-pressed', 'true')
    expect(rowNames()).toEqual(['Andrés Felipe Mejía', 'Natalia Suárez'])
  })

  it('ordena por actividad reciente y por próximo paso', async () => {
    const { user } = renderApp({ route: '/contactos' })
    await screen.findByText('12 contactos')
    expect(rowNames()[0]).toBe('Andrés Felipe Mejía')

    await user.selectOptions(screen.getByLabelText('Ordenar por'), 'actividad')
    expect(rowNames()[0]).toBe('Tomás Castaño')

    await user.click(screen.getByRole('button', { name: 'Próximo paso' }))
    expect(rowNames()[0]).toBe('Laura Valencia')
    expect(screen.getByRole('columnheader', { name: 'Próximo paso' })).toHaveAttribute(
      'aria-sort',
      'ascending',
    )
  })

  it('avisa cuando no hay resultados y permite limpiar la búsqueda', async () => {
    const { user } = renderApp({ route: '/contactos' })
    await screen.findByText('12 contactos')

    await user.type(screen.getByLabelText('Buscar por nombre o empresa'), 'zzz')
    expect(await screen.findByText('Ningún contacto coincide con “zzz”')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Limpiar búsqueda' }))
    expect(await screen.findByText('12 contactos')).toBeInTheDocument()
  })

  it('muestra el estado vacío cuando no hay contactos', async () => {
    renderApp({ route: '/contactos', initialData: [] })
    expect(await screen.findByText('Todavía no hay contactos')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Crear el primer contacto' })).toHaveAttribute(
      'href',
      '/contactos/nuevo',
    )
  })

  it('muestra el error y un botón para reintentar', async () => {
    renderApp({ route: '/contactos', mode: 'error' })
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('No pudimos cargar los contactos')
    expect(within(alert).getByRole('button', { name: 'Reintentar' })).toBeInTheDocument()
  })
})

describe('inicio', () => {
  const today = toDayKey(new Date())
  const old = '2025-01-01T10:00:00.000Z'
  const base = {
    phone: '',
    role: '',
    status: 'seguimiento' as const,
    createdAt: old,
    updatedAt: old,
    notes: [],
  }
  const data: Contact[] = [
    {
      ...base,
      id: 'x-1',
      name: 'Atrasada Ruiz',
      email: 'a@x.co',
      company: 'Ruiz S.A.',
      nextStep: { date: addDays(today, -2), text: 'Enviar contrato' },
    },
    {
      ...base,
      id: 'x-2',
      name: 'Hoy Gómez',
      email: 'h@x.co',
      company: '',
      nextStep: { date: today, text: 'Llamar' },
    },
    {
      ...base,
      id: 'x-3',
      name: 'Pronto Díaz',
      email: 'p@x.co',
      company: '',
      nextStep: { date: addDays(today, 3), text: 'Demo' },
    },
    {
      ...base,
      id: 'x-4',
      name: 'Olvidada Pérez',
      email: 'o@x.co',
      company: 'Olvido S.A.',
      nextStep: null,
      notes: [{ id: 'n-1', body: 'Primer acercamiento', kind: 'reunion', createdAt: old }],
    },
  ]

  it('muestra indicadores, próximos pasos y a quién nadie está siguiendo', async () => {
    renderApp({ initialData: data })
    const kpis = await screen.findByRole('region', { name: 'Indicadores' })
    expect(kpis).toHaveTextContent('Pendientes hoy2')
    expect(kpis).toHaveTextContent('1 atrasado')

    const tasks = screen.getByRole('region', { name: 'Próximos pasos' })
    expect(within(tasks).getAllByRole('listitem').map((li) => li.textContent)).toEqual([
      expect.stringContaining('Enviar contrato'),
      expect.stringContaining('Llamar'),
      expect.stringContaining('Demo'),
    ])

    const olvidados = screen.getByRole('region', { name: 'Sin seguimiento' })
    expect(within(olvidados).getByRole('link', { name: /Olvidada Pérez/ })).toHaveAttribute(
      'href',
      '/contactos/x-4',
    )
    expect(screen.getByRole('region', { name: 'Cartera por estado' })).toHaveTextContent(
      'En seguimiento4',
    )
    // El menú avisa cuántos pendientes hay hoy (atrasado + hoy).
    expect(screen.getByRole('link', { name: 'Inicio, 2 pendientes para hoy' })).toBeInTheDocument()
  })

  it('marca un paso como hecho y permite deshacerlo', async () => {
    const { user } = renderApp({ initialData: data })
    const tasks = await screen.findByRole('region', { name: 'Próximos pasos' })

    await user.click(within(tasks).getByRole('button', { name: /Llamar con Hoy Gómez/ }))
    expect(await screen.findByText('Hecho: Hoy Gómez')).toBeInTheDocument()
    expect(within(tasks).queryByText('Llamar')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Deshacer' }))
    expect(await within(tasks).findByText('Llamar')).toBeInTheDocument()
  })

  it('redirige las rutas antiguas al inicio', async () => {
    renderApp({ route: '/resumen', initialData: data })
    expect(await screen.findByRole('region', { name: 'Indicadores' })).toBeInTheDocument()
  })

  it('desde cualquier vista, buscar lleva a la lista filtrada', async () => {
    const { user } = renderApp({ initialData: data })
    await screen.findByRole('region', { name: 'Indicadores' })

    await user.type(screen.getByLabelText('Buscar por nombre o empresa'), 'ruiz')

    expect(await screen.findByText('1 resultado de 4')).toBeInTheDocument()
    expect(within(table()).getByRole('link', { name: /Atrasada Ruiz/ })).toBeInTheDocument()
  })
})

describe('detalle y notas', () => {
  it('muestra los datos del contacto, su próximo paso y sus notas', async () => {
    renderApp({ route: '/contactos/c-001' })
    expect(await screen.findByRole('heading', { name: 'Valentina Ríos' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'valentina.rios@andinalogistica.co' })).toHaveAttribute(
      'href',
      'mailto:valentina.rios@andinalogistica.co',
    )
    expect(screen.getByRole('link', { name: 'Llamar' })).toHaveAttribute('href', 'tel:+573104821937')
    expect(screen.getByRole('button', { name: 'Copiar correo' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Próximo paso' })).toHaveTextContent(
      'Enviar la cotización de las 3 bodegas en Funza',
    )
    const notes = screen.getByRole('list', { name: /Historial de notas/ })
    expect(within(notes).getAllByRole('listitem')).toHaveLength(2)
  })

  it('agrega una nota con su tipo y la pone de primera', async () => {
    const { user } = renderApp({ route: '/contactos/c-001' })
    await screen.findByRole('heading', { name: 'Valentina Ríos' })

    await user.click(screen.getByRole('button', { name: 'Agregar nota' }))
    expect(screen.getByText('Escribe la nota antes de guardarla.')).toBeInTheDocument()

    await user.click(screen.getByRole('radio', { name: 'Correo' }))
    await user.type(screen.getByLabelText('Qué pasó'), 'Envié la propuesta actualizada')
    await user.click(screen.getByRole('button', { name: 'Agregar nota' }))

    const notes = screen.getByRole('list', { name: /Historial de notas/ })
    await waitFor(() => expect(within(notes).getAllByRole('listitem')).toHaveLength(3))
    const [first] = within(notes).getAllByRole('listitem')
    expect(first).toHaveTextContent('Envié la propuesta actualizada')
    expect(first).toHaveTextContent('Correo')
    expect(screen.getByText('Correo registrado')).toBeInTheDocument()
    expect(screen.getByLabelText('Qué pasó')).toHaveValue('')
    // Sin elegir fecha, el próximo paso no cambia.
    expect(screen.getByRole('region', { name: 'Próximo paso' })).toHaveTextContent(
      'Enviar la cotización',
    )
  })

  it('al registrar una nota puede agendar el próximo paso', async () => {
    const { user } = renderApp({ route: '/contactos/c-003' })
    await screen.findByRole('heading', { name: 'Camila Ortega' })
    expect(screen.getByRole('region', { name: 'Próximo paso' })).toHaveTextContent('Nada agendado')

    await user.type(screen.getByLabelText('Qué pasó'), 'Pidió la propuesta por escrito')
    await user.click(screen.getByRole('button', { name: 'Agendar seguimiento' }))
    await user.click(screen.getByRole('button', { name: 'Mañana' }))
    await user.type(screen.getByLabelText('Qué hay que hacer (opcional)'), 'Enviar propuesta')
    await user.click(screen.getByRole('button', { name: 'Agregar nota' }))

    expect(await screen.findByText('Llamada registrada y próximo paso agendado')).toBeInTheDocument()
    const step = screen.getByRole('region', { name: 'Próximo paso' })
    expect(step).toHaveTextContent('Enviar propuesta')
    expect(step).toHaveTextContent(/mañana/i)
  })

  it('elimina una nota y permite deshacerlo', async () => {
    const { user } = renderApp({ route: '/contactos/c-001' })
    await screen.findByRole('heading', { name: 'Valentina Ríos' })
    const notes = screen.getByRole('list', { name: /Historial de notas/ })

    const [deleteFirst] = within(notes).getAllByRole('button', { name: /^Eliminar/ })
    await user.click(deleteFirst)

    await waitFor(() => expect(within(notes).getAllByRole('listitem')).toHaveLength(1))
    expect(screen.getByText('Nota eliminada')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Deshacer' }))
    await waitFor(() => expect(within(notes).getAllByRole('listitem')).toHaveLength(2))
  })

  it('marca el próximo paso como hecho y lo reagenda', async () => {
    const { user } = renderApp({ route: '/contactos/c-001' })
    await screen.findByRole('heading', { name: 'Valentina Ríos' })
    const step = screen.getByRole('region', { name: 'Próximo paso' })

    await user.click(within(step).getByRole('button', { name: 'Hecho' }))
    expect(await within(step).findByText(/Nada agendado/)).toBeInTheDocument()

    await user.click(within(step).getByRole('button', { name: 'Agendar' }))
    await user.click(within(step).getByRole('button', { name: 'Guardar' }))
    expect(within(step).getByText('Elige una fecha.')).toBeInTheDocument()

    await user.click(within(step).getByRole('button', { name: 'En 1 semana' }))
    await user.click(within(step).getByRole('button', { name: 'Guardar' }))
    expect(await screen.findByText('Próximo paso agendado')).toBeInTheDocument()
    expect(step).toHaveTextContent('Dar seguimiento')
  })

  it('cambia el estado desde el detalle y lo refleja en la lista', async () => {
    const { user } = renderApp({ route: '/contactos/c-003' })
    await screen.findByRole('heading', { name: 'Camila Ortega' })

    await user.selectOptions(screen.getByLabelText('Estado'), 'activo')
    expect(await screen.findByText('Estado actualizado: Activo')).toBeInTheDocument()

    await user.click(screen.getByRole('link', { name: 'Volver a contactos' }))
    expect(rowOf(/Camila Ortega/)).toHaveTextContent('Activo')
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
    await screen.findByRole('heading', { name: 'Nuevo contacto' })

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
    await screen.findByRole('heading', { name: 'Nuevo contacto' })

    await user.type(screen.getByLabelText('Correo electrónico'), 'maicol@correo')
    await user.tab()

    expect(screen.getByLabelText('Correo electrónico')).toHaveAccessibleDescription(
      'Escribe un correo válido, por ejemplo nombre@empresa.com.',
    )
  })

  it('crea el contacto con cargo y estado y abre su detalle', async () => {
    const { user } = renderApp({ route: '/contactos/nuevo' })
    await screen.findByRole('heading', { name: 'Nuevo contacto' })

    await user.type(screen.getByLabelText('Nombre'), 'Maicol Mesa')
    await user.type(screen.getByLabelText('Correo electrónico'), 'maicol@cachalot.co')
    await user.type(screen.getByLabelText('Empresa (opcional)'), 'Cachalot')
    await user.type(screen.getByLabelText('Cargo (opcional)'), 'Desarrollador')
    await user.click(screen.getByRole('radio', { name: 'Activo' }))
    await user.click(screen.getByRole('button', { name: 'Crear contacto' }))

    expect(await screen.findByRole('heading', { name: 'Maicol Mesa' })).toBeInTheDocument()
    expect(screen.getByText('Desarrollador · Cachalot')).toBeInTheDocument()
    expect(screen.getByLabelText('Estado')).toHaveValue('activo')
    expect(screen.getByText('Contacto creado: Maicol Mesa')).toBeInTheDocument()

    await user.click(screen.getByRole('link', { name: 'Volver a contactos' }))
    expect(await screen.findByText('13 contactos')).toBeInTheDocument()
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
