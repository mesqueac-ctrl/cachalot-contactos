import { useDeferredValue, useMemo } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { Avatar } from '../components/Avatar'
import { DueLabel } from '../components/DueLabel'
import { Highlight } from '../components/Highlight'
import { IconAlert, IconPhone, IconPlus, IconRefresh, IconSearch } from '../components/icons'
import { StateMessage } from '../components/StateMessage'
import { StatusBadge } from '../components/StatusBadge'
import { STATUSES, freshness, lastInteraction } from '../lib/crm'
import { matchesQuery, pluralize, sortByName } from '../lib/text'
import { useDocumentTitle } from '../lib/useDocumentTitle'
import { useContacts } from '../state/contactsContext'
import type { Contact, ContactStatus } from '../types'
import './ContactsPage.css'
import './pages.css'

type StatusFilter = ContactStatus | 'todos'
type SortOrder = 'nombre' | 'empresa' | 'actividad' | 'proximo'

const SORTS: { value: SortOrder; label: string }[] = [
  { value: 'nombre', label: 'Nombre (A–Z)' },
  { value: 'empresa', label: 'Empresa (A–Z)' },
  { value: 'actividad', label: 'Contacto más reciente' },
  { value: 'proximo', label: 'Próximo paso más cercano' },
]

function sortContacts(contacts: Contact[], sort: SortOrder) {
  switch (sort) {
    case 'nombre':
      return sortByName(contacts)
    case 'empresa':
      return sortByName(contacts).sort((a, b) =>
        // Sin empresa al final.
        (a.company || '￿').localeCompare(b.company || '￿', 'es', { sensitivity: 'base' }),
      )
    case 'actividad':
      return [...contacts].sort((a, b) => lastInteraction(b).localeCompare(lastInteraction(a)))
    case 'proximo':
      return sortByName(contacts).sort((a, b) =>
        (a.nextStep?.date ?? '9999').localeCompare(b.nextStep?.date ?? '9999'),
      )
  }
}

/** Búsqueda, filtro y orden viven en la URL: sobreviven a recargas y el botón atrás funciona. */
function useListParams() {
  const [params, setParams] = useSearchParams()
  const query = params.get('q') ?? ''
  const estado = params.get('estado')
  const orden = params.get('orden')
  const statusFilter: StatusFilter = STATUSES.some((s) => s.value === estado)
    ? (estado as ContactStatus)
    : 'todos'
  const sort: SortOrder = SORTS.some((s) => s.value === orden) ? (orden as SortOrder) : 'nombre'

  function update(key: string, value: string, fallback: string) {
    setParams(
      (current) => {
        const next = new URLSearchParams(current)
        if (value === fallback) next.delete(key)
        else next.set(key, value)
        return next
      },
      { replace: true },
    )
  }

  return {
    query,
    statusFilter,
    sort,
    setStatusFilter: (value: StatusFilter) => update('estado', value, 'todos'),
    setSort: (value: SortOrder) => update('orden', value, 'nombre'),
    // En un solo cambio: dos llamadas seguidas a setParams se pisarían entre sí.
    clearFilters: () =>
      setParams(
        (current) => {
          const next = new URLSearchParams(current)
          next.delete('q')
          next.delete('estado')
          return next
        },
        { replace: true },
      ),
  }
}

export function ContactsPage() {
  const { status, contacts, error, reload } = useContacts()
  const { query, statusFilter, sort, setStatusFilter, setSort, clearFilters: clearParams } =
    useListParams()
  const deferredQuery = useDeferredValue(query)
  useDocumentTitle('Contactos')

  const matching = useMemo(
    () => contacts.filter((c) => matchesQuery(c, deferredQuery)),
    [contacts, deferredQuery],
  )

  const counts = useMemo(() => {
    const result: Record<StatusFilter, number> = {
      todos: matching.length,
      nuevo: 0,
      activo: 0,
      seguimiento: 0,
    }
    for (const c of matching) result[c.status]++
    return result
  }, [matching])

  const visible = useMemo(() => {
    const byStatus =
      statusFilter === 'todos' ? matching : matching.filter((c) => c.status === statusFilter)
    return sortContacts(byStatus, sort)
  }, [matching, statusFilter, sort])

  const filtering = query.trim().length > 0 || statusFilter !== 'todos'
  const summary =
    status !== 'ready'
      ? ''
      : filtering
        ? `${pluralize(visible.length, 'resultado', 'resultados')} de ${contacts.length}`
        : pluralize(contacts.length, 'contacto', 'contactos')

  function clearFilters() {
    clearParams()
    document.getElementById('buscar')?.focus()
  }

  const ready = status === 'ready' && contacts.length > 0
  const statusName = STATUSES.find((s) => s.value === statusFilter)?.label

  return (
    <div className="page contacts">
      <div className="page-head">
        <div>
          <h1 className="page-title">Contactos</h1>
          <p className="page-summary" aria-live="polite">
            {summary}
          </p>
        </div>
        <Link to="/contactos/nuevo" className="btn btn--primary">
          <IconPlus size={16} />
          Nuevo contacto
        </Link>
      </div>

      {ready && (
        <div className="toolbar">
          <div className="chips" role="group" aria-label="Filtrar por estado">
            <FilterChip
              label="Todos"
              count={counts.todos}
              active={statusFilter === 'todos'}
              onClick={() => setStatusFilter('todos')}
            />
            {STATUSES.map((option) => (
              <FilterChip
                key={option.value}
                label={option.plural}
                status={option.value}
                count={counts[option.value]}
                active={statusFilter === option.value}
                onClick={() => setStatusFilter(option.value)}
              />
            ))}
          </div>
          <label className="sort">
            <span className="sort__label">Ordenar por</span>
            <select
              className="sort__select"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOrder)}
            >
              {SORTS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      {status === 'loading' && <TableSkeleton />}

      {status === 'error' && (
        <div className="card">
          <StateMessage
            role="alert"
            tone="danger"
            icon={<IconAlert size={22} />}
            title="No pudimos cargar los contactos"
            action={
              <button type="button" className="btn btn--secondary" onClick={reload}>
                <IconRefresh size={16} />
                Reintentar
              </button>
            }
          >
            {error}
          </StateMessage>
        </div>
      )}

      {status === 'ready' && contacts.length === 0 && (
        <div className="card">
          <StateMessage
            icon={<IconPlus size={22} />}
            title="Todavía no hay contactos"
            action={
              <Link to="/contactos/nuevo" className="btn btn--primary">
                <IconPlus size={16} />
                Crear el primer contacto
              </Link>
            }
          >
            Agrega a las personas con las que trabajas.
          </StateMessage>
        </div>
      )}

      {ready && visible.length === 0 && (
        <div className="card">
          <StateMessage
            icon={<IconSearch size={22} />}
            title={
              query.trim()
                ? `Ningún contacto coincide con “${query.trim()}”`
                : `No hay contactos en “${statusName}”`
            }
            action={
              <button type="button" className="btn btn--secondary" onClick={clearFilters}>
                {query.trim() ? 'Limpiar búsqueda' : 'Ver todos'}
              </button>
            }
          >
            {query.trim() ? 'Prueba con el nombre de la empresa.' : 'Prueba con otro estado.'}
          </StateMessage>
        </div>
      )}

      {ready && visible.length > 0 && (
        <ContactsTable contacts={visible} query={deferredQuery} sort={sort} onSort={setSort} />
      )}
    </div>
  )
}

function ContactsTable({
  contacts,
  query,
  sort,
  onSort,
}: {
  contacts: Contact[]
  query: string
  sort: SortOrder
  onSort: (sort: SortOrder) => void
}) {
  const navigate = useNavigate()
  const location = useLocation()
  // La ficha recuerda de dónde se vino para volver con los mismos filtros.
  const from = `${location.pathname}${location.search}`

  const header = (label: string, value: SortOrder, className: string) => (
    <th
      scope="col"
      className={className}
      // "Contacto más reciente" ordena del más nuevo al más antiguo.
      aria-sort={sort !== value ? undefined : value === 'actividad' ? 'descending' : 'ascending'}
    >
      <button type="button" className="th-sort" onClick={() => onSort(value)}>
        {label}
      </button>
    </th>
  )

  return (
    <table className="ctable" aria-label="Lista de contactos" data-sort={sort}>
      <thead>
        <tr>
          {header('Contacto', 'nombre', 'ctable__who')}
          <th scope="col" className="ctable__phone">
            Teléfono
          </th>
          {header('Empresa', 'empresa', 'ctable__company')}
          <th scope="col" className="ctable__status">
            Estado
          </th>
          {header('Próximo paso', 'proximo', 'ctable__next')}
        </tr>
      </thead>
      <tbody>
        {contacts.map((contact) => {
          const to = `/contactos/${contact.id}`
          return (
            <tr
              key={contact.id}
              className="ctable__row"
              onClick={(event) => {
                // Toda la fila abre la ficha; el enlace del nombre sigue siendo el control real.
                if ((event.target as HTMLElement).closest('a, button')) return
                if (window.getSelection()?.toString()) return
                navigate(to, { state: { from } })
              }}
            >
              <td className="ctable__who">
                <div className="ctable__who-inner">
                  <Avatar
                    name={contact.name}
                    company={contact.company}
                    freshness={freshness(contact)}
                  />
                  <div className="ctable__person">
                    <Link to={to} state={{ from }} className="ctable__name">
                      <Highlight text={contact.name} query={query} />
                    </Link>
                    <span className="ctable__email">{contact.email}</span>
                  </div>
                </div>
              </td>
              <td className="ctable__phone">
                {contact.phone ? (
                  <span className="ctable__phone-value">
                    <IconPhone size={13} />
                    {contact.phone}
                  </span>
                ) : (
                  <span className="ctable__muted">—</span>
                )}
              </td>
              <td className="ctable__company">
                {contact.company ? (
                  <Highlight text={contact.company} query={query} />
                ) : (
                  <span className="ctable__muted">—</span>
                )}
              </td>
              <td className="ctable__status">
                <StatusBadge status={contact.status} />
              </td>
              <td className="ctable__next" data-empty={!contact.nextStep || undefined}>
                {contact.nextStep ? (
                  <span title={contact.nextStep.text || undefined}>
                    <DueLabel date={contact.nextStep.date} short />
                    {contact.nextStep.text && (
                      <span className="visually-hidden">: {contact.nextStep.text}</span>
                    )}
                  </span>
                ) : (
                  <span className="ctable__muted">—</span>
                )}
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

function FilterChip({
  label,
  count,
  active,
  status,
  onClick,
}: {
  label: string
  count: number
  active: boolean
  status?: ContactStatus
  onClick: () => void
}) {
  return (
    <button
      type="button"
      className="chip"
      data-status={status}
      aria-pressed={active}
      onClick={onClick}
    >
      {label}
      <span className="chip__count">{count}</span>
    </button>
  )
}

function TableSkeleton() {
  return (
    <div className="card skeleton-list" role="status">
      <span className="visually-hidden">Cargando contactos…</span>
      {Array.from({ length: 7 }, (_, i) => (
        <div key={i} className="skeleton-row" aria-hidden="true">
          <span className="skeleton skeleton--avatar" />
          <span className="skeleton-row__lines">
            <span className="skeleton skeleton--line" style={{ width: `${55 - (i % 3) * 10}%` }} />
            <span className="skeleton skeleton--line skeleton--thin" style={{ width: '35%' }} />
          </span>
        </div>
      ))}
    </div>
  )
}
