import { useState } from 'react'
import { Link, Outlet, useMatch } from 'react-router-dom'
import { useTheme } from '../lib/theme'
import { ContactList } from './ContactList'
import { IconMoon, IconPlus, IconSun } from './icons'
import { Logo } from './Logo'
import './AppLayout.css'

export function AppLayout() {
  const [query, setQuery] = useState('')
  const { theme, toggle } = useTheme()
  const isIndex = useMatch({ path: '/', end: true }) !== null

  return (
    <>
      <a
        href="#contenido"
        className="skip-link"
        onClick={(event) => {
          // Con HashRouter un ancla normal cambiaría la ruta.
          event.preventDefault()
          document.getElementById(isIndex ? 'buscar' : 'contenido')?.focus()
        }}
      >
        Saltar al contenido
      </a>

      <header className="topbar">
        <Link to="/" className="brand" aria-label="Cachalot, ir al inicio">
          <Logo />
          <span className="brand__name">Cachalot</span>
          <span className="brand__section" aria-hidden="true">
            CRM
          </span>
        </Link>

        <div className="topbar__actions">
          <button
            type="button"
            className="btn btn--icon btn--ghost-dark"
            onClick={toggle}
            aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
          >
            {theme === 'dark' ? <IconSun /> : <IconMoon />}
          </button>
          <Link to="/contactos/nuevo" className="btn btn--on-dark">
            <IconPlus size={16} />
            <span>
              Nuevo<span className="hide-sm"> contacto</span>
            </span>
          </Link>
        </div>
      </header>

      <div className="workspace" data-view={isIndex ? 'list' : 'pane'}>
        <section className="workspace__list" aria-label="Contactos">
          <ContactList query={query} onQueryChange={setQuery} />
        </section>
        <main id="contenido" className="workspace__pane" tabIndex={-1}>
          <Outlet />
        </main>
      </div>
    </>
  )
}
