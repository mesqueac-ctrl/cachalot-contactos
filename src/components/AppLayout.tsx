import { useEffect, useMemo, useRef } from 'react'
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useMatch,
  useNavigate,
  useSearchParams,
} from 'react-router-dom'
import { agenda, freshness } from '../lib/crm'
import { useTheme } from '../lib/theme'
import { useContacts } from '../state/contactsContext'
import { IconClose, IconGrid, IconMoon, IconPlus, IconSearch, IconSun, IconUsers } from './icons'
import { Logo } from './Logo'
import { Sonar } from './Sonar'
import './AppLayout.css'

export function AppLayout() {
  const { theme, toggle } = useTheme()
  const { status, contacts } = useContacts()
  const inContacts = useMatch('/contactos/*') !== null

  const { pending, healthy } = useMemo(() => {
    const { overdue, today } = agenda(contacts)
    // "Al día": hablamos hace poco o ya hay un próximo paso agendado.
    const ok = contacts.filter((c) => c.nextStep || freshness(c) !== 'olvidado').length
    return {
      pending: overdue.length + today.length,
      healthy: contacts.length ? Math.round((ok / contacts.length) * 100) : 0,
    }
  }, [contacts])

  // Cada vista nueva empieza arriba; cambiar solo la búsqueda (?q=…) no mueve el scroll.
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <div className="shell">
      <a
        href="#contenido"
        className="skip-link"
        onClick={(event) => {
          // Con HashRouter un ancla normal cambiaría la ruta.
          event.preventDefault()
          document.getElementById('contenido')?.focus()
        }}
      >
        Saltar al contenido
      </a>

      <aside className="sidebar">
        <div className="sidebar__top">
          <Link to="/" className="brand" aria-label="Cachalot, ir al inicio">
            <span className="brand__logo">
              <Logo size={24} />
            </span>
            <span className="brand__text">
              <span className="brand__name">Cachalot</span>
              <span className="brand__tag">CRM de clientes</span>
            </span>
          </Link>

          <div className="sidebar__mobile-actions">
            <ThemeButton theme={theme} onToggle={toggle} />
            <Link to="/contactos/nuevo" className="btn btn--on-dark btn--sm" aria-label="Nuevo contacto">
              <IconPlus size={16} />
              Nuevo
            </Link>
          </div>
        </div>

        <nav className="sidenav" aria-label="Principal">
          <NavLink
            to="/"
            end
            className="sidenav__link"
            aria-label={pending > 0 ? `Inicio, ${pending} pendientes para hoy` : undefined}
          >
            <IconGrid size={18} />
            Inicio
            {pending > 0 && (
              <span className="sidenav__badge" aria-hidden="true">
                {pending}
              </span>
            )}
          </NavLink>
          <NavLink
            to="/contactos"
            end
            className={({ isActive }) => `sidenav__link${isActive || inContacts ? ' active' : ''}`}
          >
            <IconUsers size={18} />
            Contactos
            {status === 'ready' && (
              <span className="sidenav__count" aria-hidden="true">
                {contacts.length}
              </span>
            )}
          </NavLink>
        </nav>

        <Link to="/contactos/nuevo" className="btn btn--on-dark sidebar__new">
          <IconPlus size={16} />
          Nuevo contacto
        </Link>

        {status === 'ready' && contacts.length > 0 && (
          <div className="pulse-card">
            <Sonar className="pulse-card__sonar" />
            <HealthRing value={healthy} />
            <div>
              <p className="pulse-card__label">Cartera al día</p>
              <p className="pulse-card__hint">Contacto reciente o paso agendado</p>
            </div>
          </div>
        )}

        <div className="sidebar__foot">
          <ThemeButton theme={theme} onToggle={toggle} withLabel />
        </div>
      </aside>

      <div className="main-col">
        <header className="appbar">
          <GlobalSearch />
        </header>

        <main id="contenido" className="main" tabIndex={-1}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}

function ThemeButton({
  theme,
  onToggle,
  withLabel = false,
}: {
  theme: 'light' | 'dark'
  onToggle: () => void
  withLabel?: boolean
}) {
  const label = theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'
  return (
    <button
      type="button"
      className={withLabel ? 'theme-btn' : 'btn btn--icon btn--ghost-dark'}
      onClick={onToggle}
      aria-label={withLabel ? undefined : label}
      title={label}
    >
      {theme === 'dark' ? <IconSun size={18} /> : <IconMoon size={18} />}
      {withLabel && (theme === 'dark' ? 'Modo claro' : 'Modo oscuro')}
    </button>
  )
}

/** Anillo de progreso con el porcentaje de la cartera al día. */
function HealthRing({ value }: { value: number }) {
  const r = 22
  const length = 2 * Math.PI * r
  return (
    <span className="ring" role="img" aria-label={`${value}% de la cartera al día`}>
      <svg viewBox="0 0 56 56" width="56" height="56" aria-hidden="true">
        <circle cx="28" cy="28" r={r} className="ring__track" />
        <circle
          cx="28"
          cy="28"
          r={r}
          className="ring__value"
          strokeDasharray={length}
          strokeDashoffset={length * (1 - value / 100)}
        />
      </svg>
      <span className="ring__text" aria-hidden="true">
        {value}%
      </span>
    </span>
  )
}

/**
 * Buscador siempre visible. En la lista filtra en vivo (vía ?q=); desde cualquier otra vista,
 * al escribir lleva a la lista con la búsqueda puesta.
 */
function GlobalSearch() {
  const navigate = useNavigate()
  const onList = useMatch({ path: '/contactos', end: true }) !== null
  const [params, setParams] = useSearchParams()
  const query = onList ? (params.get('q') ?? '') : ''
  const inputRef = useRef<HTMLInputElement>(null)

  function setQuery(value: string) {
    if (!onList) {
      navigate(value ? `/contactos?q=${encodeURIComponent(value)}` : '/contactos')
      return
    }
    setParams(
      (current) => {
        const next = new URLSearchParams(current)
        if (value) next.set('q', value)
        else next.delete('q')
        return next
      },
      { replace: true },
    )
  }

  // Atajo "/" para ir a la búsqueda, como en muchas herramientas de trabajo.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement
      const typing = target.closest('input, textarea, select, [contenteditable="true"]')
      if (event.key === '/' && !typing && !event.metaKey && !event.ctrlKey) {
        event.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <div className="search" role="search">
      <label htmlFor="buscar" className="visually-hidden">
        Buscar por nombre o empresa
      </label>
      <IconSearch className="search__icon" />
      <input
        ref={inputRef}
        id="buscar"
        type="search"
        className="input search__input"
        placeholder="Buscar por nombre o empresa"
        autoComplete="off"
        spellCheck={false}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape' && query) {
            e.preventDefault()
            setQuery('')
          }
        }}
      />
      {query ? (
        <button
          type="button"
          className="search__clear"
          onClick={() => {
            setQuery('')
            inputRef.current?.focus()
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
  )
}
