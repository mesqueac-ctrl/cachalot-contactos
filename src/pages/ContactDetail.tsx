import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Avatar } from '../components/Avatar'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { ContactNotes } from '../components/ContactNotes'
import {
  IconAlert,
  IconArrowLeft,
  IconBuilding,
  IconMail,
  IconPencil,
  IconPhone,
  IconRefresh,
  IconTrash,
} from '../components/icons'
import { StateMessage } from '../components/StateMessage'
import { formatDate, formatRelative } from '../lib/dates'
import { useContacts } from '../state/contactsContext'
import { useToast } from '../state/toastContext'
import { NotFoundPane } from './NotFoundPane'
import './ContactDetail.css'
import './pages.css'

export function ContactDetail() {
  const { id = '' } = useParams()
  // La key reinicia el estado local (diálogo, foco) al pasar de un contacto a otro.
  return <ContactDetailView key={id} id={id} />
}

function ContactDetailView({ id }: { id: string }) {
  const { status, contacts, error, reload, deleteContact } = useContacts()
  const notify = useToast()
  const navigate = useNavigate()
  const contact = contacts.find((c) => c.id === id)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (!contact) return
    setDeleting(true)
    try {
      await deleteContact(contact.id)
      notify(`Contacto eliminado: ${contact.name}`)
      navigate('/')
    } catch (err) {
      notify(err instanceof Error ? err.message : 'No se pudo eliminar el contacto.', 'error')
      setDeleting(false)
      setConfirmOpen(false)
    }
  }

  // En móvil la lista desaparece al abrir el detalle; el foco debe acompañar al contenido.
  useEffect(() => {
    if (!window.matchMedia('(min-width: 900px)').matches) headingRef.current?.focus()
  }, [id, status])

  if (status === 'loading') return <DetailSkeleton />

  if (status === 'error') {
    return (
      <div className="pane pane--center">
        <StateMessage
          role="alert"
          tone="danger"
          icon={<IconAlert size={22} />}
          title="No pudimos cargar este contacto"
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
    )
  }

  if (!contact) {
    return (
      <NotFoundPane
        title="Este contacto no existe"
        text="Puede que lo hayan eliminado o que el enlace esté incompleto."
      />
    )
  }

  return (
    <article className="pane detail" aria-labelledby="detalle-nombre">
      <Link to="/" className="back-link back-link--mobile">
        <IconArrowLeft size={16} />
        Contactos
      </Link>

      <header className="detail__header">
        <Avatar name={contact.name} company={contact.company} size="lg" />
        <div className="detail__identity">
          <h2 id="detalle-nombre" className="detail__name" ref={headingRef} tabIndex={-1}>
            {contact.name}
          </h2>
          {contact.company && <p className="detail__company">{contact.company}</p>}
        </div>
        <div className="detail__actions">
          <Link to={`/contactos/${contact.id}/editar`} className="btn btn--secondary">
            <IconPencil size={16} />
            Editar
          </Link>
          <button
            type="button"
            className="btn btn--danger-quiet"
            onClick={() => setConfirmOpen(true)}
          >
            <IconTrash size={16} />
            Eliminar
          </button>
        </div>
      </header>

      <ConfirmDialog
        open={confirmOpen}
        title="¿Eliminar este contacto?"
        confirmLabel="Eliminar contacto"
        busyLabel="Eliminando…"
        busy={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      >
        Se borrará <strong>{contact.name}</strong>
        {contact.notes.length === 1 && ' junto con su nota'}
        {contact.notes.length > 1 && ` junto con sus ${contact.notes.length} notas`}. Esta acción no
        se puede deshacer.
      </ConfirmDialog>

      <dl className="facts">
        <div className="fact">
          <dt>
            <IconMail size={16} />
            Correo
          </dt>
          <dd>
            <a href={`mailto:${contact.email}`} className="mono">
              {contact.email}
            </a>
          </dd>
        </div>
        <div className="fact">
          <dt>
            <IconPhone size={16} />
            Teléfono
          </dt>
          <dd>
            {contact.phone ? (
              <a href={`tel:${contact.phone.replace(/[^\d+]/g, '')}`} className="mono">
                {contact.phone}
              </a>
            ) : (
              <span className="fact__empty">Sin teléfono</span>
            )}
          </dd>
        </div>
        <div className="fact">
          <dt>
            <IconBuilding size={16} />
            Empresa
          </dt>
          <dd>{contact.company || <span className="fact__empty">Sin empresa</span>}</dd>
        </div>
      </dl>

      <p className="detail__stamp">
        Creado el <time dateTime={contact.createdAt}>{formatDate(contact.createdAt)}</time> · última
        actividad <time dateTime={contact.updatedAt}>{formatRelative(contact.updatedAt)}</time>
      </p>

      <ContactNotes contactId={contact.id} notes={contact.notes} />
    </article>
  )
}

function DetailSkeleton() {
  return (
    <div className="pane detail" role="status">
      <span className="visually-hidden">Cargando contacto…</span>
      <div className="detail__header" aria-hidden="true">
        <span className="skeleton" style={{ width: 72, height: 72, borderRadius: '50%' }} />
        <div className="detail__identity" style={{ gap: 10 }}>
          <span className="skeleton" style={{ width: 220, height: 24 }} />
          <span className="skeleton" style={{ width: 140, height: 14 }} />
        </div>
      </div>
      <span className="skeleton" style={{ height: 150, borderRadius: 16 }} aria-hidden="true" />
    </div>
  )
}
