import { Link } from 'react-router-dom'
import { IconSearch } from '../components/icons'
import { StateMessage } from '../components/StateMessage'
import './pages.css'

export function NotFoundPane({
  title = 'Esta página no existe',
  text = 'Puede que el enlace esté mal escrito.',
}: {
  title?: string
  text?: string
}) {
  return (
    <div className="page page--center">
      <StateMessage
        icon={<IconSearch size={22} />}
        title={title}
        action={
          <Link to="/contactos" className="btn btn--secondary">
            Volver a contactos
          </Link>
        }
      >
        {text}
      </StateMessage>
    </div>
  )
}
