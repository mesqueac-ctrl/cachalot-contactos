import { useDeferredValue, useEffect, useMemo, useRef } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { groupByInitial, matchesQuery, pluralize, sortByName } from '../lib/text'
import { useContacts } from '../state/contactsContext'
import { Avatar } from './Avatar'
import { Highlight } from './Highlight'
import { IconAlert, IconClose, IconPlus, IconRefresh, IconSearch } from './icons'
import { StateMessage } from './StateMessage'
import './ContactList.css'

interface Props {
  query: string
  onQueryChange: (query: string) => void
}

export function ContactList({ query, onQueryChange }: Props) {
  const { status, contacts, error, reload } = useContacts()
  const searchRef = useRef<HTMLInputElement>(null)
  const deferredQuery = useDeferredValue(query)

  const filtered = useMemo(
    () => sortByName(contacts.filter((c) => matchesQuery(c, deferredQuery))),
    [contacts, deferredQuery],
  )
  const groups = useMemo(() => groupByInitial(filtered), [filtered])

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

  const hasQuery = query.trim().length > 0
  const summary =
    status !== 'ready'
      ? ''
      : hasQuery
        ? `${pluralize(filtered.length, 'resultado', 'resultados')} de ${contacts.length}`
        : pluralize(contacts.length, 'contacto', 'contactos')

  return (
    <div className="list-panel">
      <div className="list-panel__head">
        <div className="list-panel__titlebar">
          <h1 className="list-panel__title">Contactos</h1>
          <p className="list-panel__summary" aria-live="polite">
            {summary}
          </p>
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

        {status === 'ready' && contacts.length > 0 && filtered.length === 0 && (
          <StateMessage
            icon={<IconSearch size={22} />}
            title={`Ningún contacto coincide con “${query.trim()}”`}
            action={
              <button
                type="button"
                className="btn btn--secondary"
                onClick={() => {
                  onQueryChange('')
                  searchRef.current?.focus()
                }}
              >
                Limpiar búsqueda
              </button>
            }
          >
            Revisa la ortografía o busca por el nombre de la empresa.
          </StateMessage>
        )}

        {status === 'ready' && filtered.length > 0 && (
          <ul className="contact-groups" aria-label="Lista de contactos">
            {groups.map((group) => (
              <li key={group.letter} className="contact-group">
                <span className="contact-group__letter" aria-hidden="true">
                  {group.letter}
                </span>
                <ul>
                  {group.contacts.map((contact) => (
                    <li key={contact.id}>
                      <NavLink to={`/contactos/${contact.id}`} className="contact-row">
                        <Avatar name={contact.name} company={contact.company} />
                        <span className="contact-row__body">
                          <span className="contact-row__name">
                            <Highlight text={contact.name} query={deferredQuery} />
                          </span>
                          {contact.company && (
                            <span className="contact-row__company">
                              <Highlight text={contact.company} query={deferredQuery} />
                            </span>
                          )}
                          <span className="contact-row__meta mono">
                            <span className="contact-row__email">{contact.email}</span>
                            {contact.phone && <span>{contact.phone}</span>}
                          </span>
                        </span>
                      </NavLink>
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
