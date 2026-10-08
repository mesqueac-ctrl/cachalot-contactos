import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { STATUSES, lastInteraction } from '../lib/crm'
import { formatRelative } from '../lib/dates'
import { groupByInitial, matchesQuery, pluralize, sortByName } from '../lib/text'
import { useContacts } from '../state/contactsContext'
import type { Contact, ContactStatus } from '../types'
import { Avatar } from './Avatar'
import { Highlight } from './Highlight'
import { IconAlert, IconChart, IconClose, IconPlus, IconRefresh, IconSearch } from './icons'
import { StateMessage } from './StateMessage'
import { StatusBadge } from './StatusBadge'
import './ContactList.css'

type StatusFilter = ContactStatus | 'todos'
type SortOrder = 'nombre' | 'actividad'

interface Props {
  query: string
  onQueryChange: (query: string) => void
}

export function ContactList({ query, onQueryChange }: Props) {
  const { status, contacts, error, reload } = useContacts()
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('todos')
  const [sort, setSort] = useState<SortOrder>('nombre')
  const searchRef = useRef<HTMLInputElement>(null)
  const deferredQuery = useDeferredValue(query)

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
    if (sort === 'nombre') return sortByName(byStatus)
    return [...byStatus].sort((a, b) => lastInteraction(b).localeCompare(lastInteraction(a)))
  }, [matching, statusFilter, sort])

  const groups = useMemo(
    () => (sort === 'nombre' ? groupByInitial(visible) : [{ letter: '', contacts: visible }]),
    [visible, sort],
  )

  // Atajo "/" para ir a la búsqueda, como en muchas herramientas de trabajo.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement
      const typing = target.closest('input, textarea, select, [contenteditable="true"]')
      if (event.key === '/' && !typing && !event.metaKey && !event.ctrlKey) {
        event.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const filtering = query.trim().length > 0 || statusFilter !== 'todos'
  const summary =
    status !== 'ready'
      ? ''
      : filtering
        ? `${pluralize(visible.length, 'resultado', 'resultados')} de ${contacts.length}`
        : pluralize(contacts.length, 'contacto', 'contactos')

  function clearFilters() {
    onQueryChange('')
    setStatusFilter('todos')
    searchRef.current?.focus()
  }

  const ready = status === 'ready' && contacts.length > 0
  const statusName = STATUSES.find((s) => s.value === statusFilter)?.label

  return (
    <div className="list-panel">
      <div className="list-panel__head">
        <div className="list-panel__titlebar">
          <h1 className="list-panel__title">Contactos</h1>
          <p className="list-panel__summary" aria-live="polite">
            {summary}
          </p>
          <NavLink to="/resumen" className="list-panel__overview">
            <IconChart size={16} />
            Resumen
          </NavLink>
        </div>

        <div className="search">
          <label htmlFor="buscar" className="visually-hidden">
            Buscar por nombre o empresa
          </label>
          <IconSearch className="search__icon" />
          <input
            ref={searchRef}
            id="buscar"
            type="search"
            className="input search__input"
            placeholder="Buscar por nombre o empresa"
            autoComplete="off"
            spellCheck={false}
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape' && query) {
                e.preventDefault()
                onQueryChange('')
              }
            }}
            disabled={status === 'error'}
          />
          {query ? (
            <button
              type="button"
              className="search__clear"
              onClick={() => {
                onQueryChange('')
                searchRef.current?.focus()
              }}
              aria-label="Borrar el texto de búsqueda"
            >
              <IconClose size={16} />
            </button>
          ) : (
            <kbd className="search__kbd" aria-hidden="true">
              /
            </kbd>
          )}
        </div>

        {ready && (
          <div className="list-tools">
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
              <span className="visually-hidden">Ordenar por</span>
              <select
                className="sort__select"
                value={sort}
                onChange={(e) => setSort(e.target.value as SortOrder)}
              >
                <option value="nombre">A–Z</option>
                <option value="actividad">Más recientes</option>
              </select>
            </label>
          </div>
        )}
      </div>

      <div className="list-panel__body">
        {status === 'loading' && <ListSkeleton />}

        {status === 'error' && (
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
        )}

        {status === 'ready' && contacts.length === 0 && (
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
            Agrega a las personas con las que trabajas para tener sus datos y notas en un solo lugar.
          </StateMessage>
        )}

        {ready && visible.length === 0 && (
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
            {query.trim()
              ? 'Revisa la ortografía o busca por el nombre de la empresa.'
              : 'Cambia el filtro de estado para ver otros contactos.'}
          </StateMessage>
        )}

        {ready && visible.length > 0 && (
          <ul className="contact-groups" aria-label="Lista de contactos">
            {groups.map((group) => (
              <li key={group.letter || 'todos'} className="contact-group">
                {group.letter && (
                  <span className="contact-group__letter" aria-hidden="true">
                    {group.letter}
                  </span>
                )}
                <ul>
                  {group.contacts.map((contact) => (
                    <li key={contact.id}>
                      <ContactRow
                        contact={contact}
                        query={deferredQuery}
                        showActivity={sort === 'actividad'}
                      />
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
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

function ContactRow({
  contact,
  query,
  showActivity,
}: {
  contact: Contact
  query: string
  showActivity: boolean
}) {
  return (
    <NavLink to={`/contactos/${contact.id}`} className="contact-row">
      <Avatar name={contact.name} company={contact.company} />
      <span className="contact-row__body">
        <span className="contact-row__top">
          <span className="contact-row__name">
            <Highlight text={contact.name} query={query} />
          </span>
          <StatusBadge status={contact.status} />
        </span>
        {contact.company && (
          <span className="contact-row__company">
            <Highlight text={contact.company} query={query} />
          </span>
        )}
        <span className="contact-row__meta mono">
          <span className="contact-row__email">{contact.email}</span>
          {contact.phone && <span>{contact.phone}</span>}
        </span>
        {showActivity && (
          <span className="contact-row__activity">
            Último contacto {formatRelative(lastInteraction(contact))}
          </span>
        )}
      </span>
    </NavLink>
  )
}

function ListSkeleton() {
  return (
    <div className="skeleton-list" role="status">
      <span className="visually-hidden">Cargando contactos…</span>
      {Array.from({ length: 7 }, (_, i) => (
        <div key={i} className="skeleton-row" aria-hidden="true">
          <span className="skeleton skeleton--avatar" />
          <span className="skeleton-row__lines">
            <span className="skeleton skeleton--line" style={{ width: `${70 - (i % 3) * 12}%` }} />
            <span className="skeleton skeleton--line skeleton--thin" style={{ width: '45%' }} />
          </span>
        </div>
      ))}
    </div>
  )
}
