import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { Avatar } from '../components/Avatar'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { ContactNotes } from '../components/ContactNotes'
import { CopyButton } from '../components/CopyButton'
import {
  IconAlert,
  IconArrowLeft,
  IconClock,
  IconMail,
  IconPencil,
  IconPhone,
  IconRefresh,
  IconTrash,
} from '../components/icons'
import { NextStepCard } from '../components/NextStepCard'
import { Sonar } from '../components/Sonar'
import { StateMessage } from '../components/StateMessage'
import { StatusBadge } from '../components/StatusBadge'
import { STATUSES, freshness, lastInteraction, statusLabel } from '../lib/crm'
import { formatDate, formatRelative } from '../lib/dates'
import { useDocumentTitle } from '../lib/useDocumentTitle'
import type { ContactStatus } from '../types'
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

/** Vuelve a la lista con la misma búsqueda, filtro y orden con que se dejó. */
function useBackToList() {
  const state = useLocation().state as { from?: string } | null
  return state?.from ?? '/contactos'
}

function ContactDetailView({ id }: { id: string }) {
  const { status, contacts, error, reload, deleteContact, changeStatus } = useContacts()
  const notify = useToast()
  const navigate = useNavigate()
  const backTo = useBackToList()
  const contact = contacts.find((c) => c.id === id)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [changingStatus, setChangingStatus] = useState(false)
  useDocumentTitle(contact?.name ?? null)

  async function handleStatusChange(next: ContactStatus) {
    if (!contact) return
    setChangingStatus(true)
    try {
      await changeStatus(contact.id, next)
      notify(`Estado actualizado: ${statusLabel(next)}`)
    } catch (err) {
      notify(err instanceof Error ? err.message : 'No se pudo cambiar el estado.', 'error')
    } finally {
      setChangingStatus(false)
    }
  }

  async function handleDelete() {
    if (!contact) return
    setDeleting(true)
    try {
      await deleteContact(contact.id)
      notify(`Contacto eliminado: ${contact.name}`)
      navigate(backTo)
    } catch (err) {
      notify(err instanceof Error ? err.message : 'No se pudo eliminar el contacto.', 'error')
      setDeleting(false)
      setConfirmOpen(false)
    }
  }

  // Al cambiar de vista el foco acompaña al contenido nuevo.
  const ready = status === 'ready'
  useEffect(() => {
    if (ready) headingRef.current?.focus()
  }, [ready])

  if (status === 'loading') return <DetailSkeleton />

  if (status === 'error') {
    return (
      <div className="page page--center">
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

  const telHref = contact.phone ? `tel:${contact.phone.replace(/[^\d+]/g, '')}` : null

  return (
    <article className="page detail" aria-labelledby="detalle-nombre">
      <Link to={backTo} className="back-link" aria-label="Volver a contactos">
        <IconArrowLeft size={16} />
        Contactos
      </Link>

      <header className="profile">
        <div className="profile__banner" aria-hidden="true">
          <Sonar className="profile__sonar" />
        </div>
        <div className="profile__body">
          <Avatar
            name={contact.name}
            company={contact.company}
            size="lg"
            freshness={freshness(contact)}
          />
          <div className="profile__identity">
            <h1 id="detalle-nombre" className="profile__name" ref={headingRef} tabIndex={-1}>
              {contact.name}
            </h1>
            {(contact.role || contact.company) && (
              <p className="profile__company">
                {[contact.role, contact.company].filter(Boolean).join(' · ')}
              </p>
            )}
            <div className="profile__meta">
              <StatusBadge status={contact.status} />
              <span className="profile__stamp">
                <IconClock size={14} />
                <time dateTime={lastInteraction(contact)}>
                  {formatRelative(lastInteraction(contact))}
                </time>
              </span>
            </div>
          </div>

          <div className="profile__actions">
            {telHref && (
              <a href={telHref} className="btn btn--primary">
                <IconPhone size={16} />
                Llamar
              </a>
            )}
            <a href={`mailto:${contact.email}`} className="btn btn--secondary">
              <IconMail size={16} />
              Escribir
            </a>
            <Link
              to={`/contactos/${contact.id}/editar`}
              state={{ from: backTo }}
              className="btn btn--secondary btn--icon"
              aria-label="Editar"
              title="Editar"
            >
              <IconPencil size={16} />
            </Link>
            <button
              type="button"
              className="btn btn--secondary btn--icon btn--danger-text"
              onClick={() => setConfirmOpen(true)}
              aria-label="Eliminar"
              title="Eliminar"
            >
              <IconTrash size={16} />
            </button>
          </div>
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

      <div className="detail__layout">
        <div className="detail__main">
          <NextStepCard contact={contact} />
          <ContactNotes contact={contact} />
        </div>

        <aside className="detail__aside card" aria-labelledby="ficha-titulo">
          <h2 id="ficha-titulo" className="card__title">
            Datos de contacto
          </h2>
          <dl className="facts">
            <div className="fact">
              <dt>Correo</dt>
              <dd className="fact__value">
                <a href={`mailto:${contact.email}`} className="mono">
                  {contact.email}
                </a>
                <CopyButton value={contact.email} label="Copiar correo" done="Correo copiado" />
              </dd>
            </div>
            <div className="fact">
              <dt>Teléfono</dt>
              <dd className="fact__value">
                {contact.phone && telHref ? (
                  <>
                    <a href={telHref} className="mono">
                      {contact.phone}
                    </a>
                    <CopyButton
                      value={contact.phone}
                      label="Copiar teléfono"
                      done="Teléfono copiado"
                    />
                  </>
                ) : (
                  <span className="fact__empty">Sin teléfono</span>
                )}
              </dd>
            </div>
            <div className="fact">
              <dt>Empresa</dt>
              <dd>{contact.company || <span className="fact__empty">Sin empresa</span>}</dd>
            </div>
            <div className="fact">
              <dt>Cargo</dt>
              <dd>{contact.role || <span className="fact__empty">Sin cargo</span>}</dd>
            </div>
            <div className="fact">
              <dt>
                <label htmlFor="detalle-estado">Estado</label>
              </dt>
              <dd>
                <select
                  id="detalle-estado"
                  className="input fact__select"
                  value={contact.status}
                  disabled={changingStatus}
                  onChange={(e) => handleStatusChange(e.target.value as ContactStatus)}
                >
                  {STATUSES.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </dd>
            </div>
            <div className="fact">
              <dt>Creado</dt>
              <dd>
                <time dateTime={contact.createdAt}>{formatDate(contact.createdAt)}</time>
              </dd>
            </div>
          </dl>
        </aside>
      </div>
    </article>
  )
}

function DetailSkeleton() {
  return (
    <div className="page detail" role="status">
      <span className="visually-hidden">Cargando contacto…</span>
      <span className="skeleton" style={{ height: 190, borderRadius: 18 }} aria-hidden="true" />
      <div className="detail__layout" aria-hidden="true">
        <span className="skeleton" style={{ height: 220, borderRadius: 16 }} />
        <span className="skeleton" style={{ height: 220, borderRadius: 16 }} />
      </div>
    </div>
  )
}
