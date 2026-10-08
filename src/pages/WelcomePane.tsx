import { Link } from 'react-router-dom'
import { IconPlus } from '../components/icons'
import { Logo } from '../components/Logo'
import { useContacts } from '../state/contactsContext'
import './pages.css'

export function WelcomePane() {
  const { status, contacts } = useContacts()
  const notes = contacts.reduce((total, c) => total + c.notes.length, 0)
  const companies = new Set(contacts.map((c) => c.company).filter(Boolean)).size

  return (
    <div className="pane pane--center">
      <div className="welcome">
        <span className="welcome__mark">
          <Logo size={56} />
        </span>
        <h2 className="welcome__title">Elige un contacto</h2>
        <p className="welcome__text">
          Selecciona a alguien de la lista para ver sus datos y su bitácora de notas.
        </p>

        {status === 'ready' && contacts.length > 0 && (
          <dl className="welcome__stats">
            <div>
              <dt>Contactos</dt>
              <dd>{contacts.length}</dd>
            </div>
            <div>
              <dt>Empresas</dt>
              <dd>{companies}</dd>
            </div>
            <div>
              <dt>Notas</dt>
              <dd>{notes}</dd>
            </div>
          </dl>
        )}

        <Link to="/contactos/nuevo" className="btn btn--secondary">
          <IconPlus size={16} />
          Nuevo contacto
        </Link>
      </div>
    </div>
  )
}
