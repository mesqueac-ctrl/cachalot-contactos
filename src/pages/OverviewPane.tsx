import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Avatar } from '../components/Avatar'
import { IconAlert, IconArrowLeft, IconCheck, IconPlus, IconRefresh } from '../components/icons'
import { StateMessage } from '../components/StateMessage'
import {
  FOLLOW_UP_DAYS,
  STATUSES,
  daysSince,
  needingFollowUp,
  noteKindLabel,
  recentNotes,
} from '../lib/crm'
import { formatRelative } from '../lib/dates'
import { pluralize } from '../lib/text'
import { useContacts } from '../state/contactsContext'
import './Overview.css'
import './pages.css'

const todayFormat = new Intl.DateTimeFormat('es-CO', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
})

export function OverviewPane() {
  const { status, contacts, error, reload } = useContacts()
  const [now] = useState(() => new Date())

  if (status === 'loading') {
    return (
      <div className="pane overview" role="status">
        <span className="visually-hidden">Cargando resumen…</span>
        <span className="skeleton" style={{ width: 180, height: 32 }} aria-hidden="true" />
        <div className="overview__stats" aria-hidden="true">
          {Array.from({ length: 4 }, (_, i) => (
            <span key={i} className="skeleton" style={{ height: 96, borderRadius: 16 }} />
          ))}
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="pane pane--center">
        <StateMessage
          role="alert"
          tone="danger"
          icon={<IconAlert size={22} />}
          title="No pudimos cargar el resumen"
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

  if (contacts.length === 0) {
    return (
      <div className="pane pane--center">
        <StateMessage
          icon={<IconPlus size={22} />}
          title="Tu resumen aparecerá aquí"
          action={
            <Link to="/contactos/nuevo" className="btn btn--primary">
              <IconPlus size={16} />
              Crear el primer contacto
            </Link>
          }
        >
          Cuando agregues contactos y notas verás quién necesita seguimiento y la actividad reciente.
        </StateMessage>
      </div>
    )
  }

  const followUp = needingFollowUp(contacts, now)
  const recent = recentNotes(contacts, 6)
  const notesThisMonth = contacts
    .flatMap((c) => c.notes)
    .filter((n) => daysSince(n.createdAt, now) <= 30).length
  const byStatus = STATUSES.map((s) => ({
    ...s,
    count: contacts.filter((c) => c.status === s.value).length,
  }))

  return (
    <div className="pane overview">
      <Link to="/" className="back-link back-link--mobile">
        <IconArrowLeft size={16} />
        Contactos
      </Link>

      <header className="overview__header">
        <h2 className="overview__title">Resumen</h2>
        <p className="overview__date">{todayFormat.format(now)}</p>
      </header>

      <dl className="overview__stats">
        <Stat label="Contactos" value={contacts.length} />
        <Stat
          label="En seguimiento"
          value={byStatus.find((s) => s.value === 'seguimiento')?.count ?? 0}
        />
        <Stat label="Notas en 30 días" value={notesThisMonth} />
        <Stat
          label={`Sin contacto en ${FOLLOW_UP_DAYS} días`}
          value={followUp.length}
          tone={followUp.length > 0 ? 'warn' : undefined}
        />
      </dl>

      <section className="panel" aria-labelledby="estados-titulo">
        <h3 id="estados-titulo" className="panel__title">
          Contactos por estado
        </h3>
        <div className="status-bar" aria-hidden="true">
          {byStatus.map(
            (s) =>
              s.count > 0 && (
                <span
                  key={s.value}
                  data-status={s.value}
                  style={{ flexGrow: s.count }}
                  title={`${s.label}: ${s.count}`}
                />
              ),
          )}
        </div>
        <ul className="status-legend">
          {byStatus.map((s) => (
            <li key={s.value} data-status={s.value}>
              <span className="status-legend__label">{s.label}</span>
              <span className="status-legend__value">
                {s.count} · {Math.round((s.count / contacts.length) * 100)}%
              </span>
            </li>
          ))}
        </ul>
      </section>

      <div className="overview__columns">
        <section className="panel" aria-labelledby="seguimiento-titulo">
          <h3 id="seguimiento-titulo" className="panel__title">
            Requieren seguimiento
          </h3>
          <p className="panel__hint">
            Sin notas en más de {FOLLOW_UP_DAYS} días, del más antiguo al más reciente.
          </p>
          {followUp.length === 0 ? (
            <p className="panel__empty">
              <IconCheck size={16} />
              Todo al día: hay notas recientes con todos tus contactos.
            </p>
          ) : (
            <ul className="mini-list">
              {followUp.slice(0, 5).map(({ contact, last }) => (
                <li key={contact.id}>
                  <Link to={`/contactos/${contact.id}`} className="mini-row">
                    <Avatar name={contact.name} company={contact.company} />
                    <span className="mini-row__body">
                      <span className="mini-row__title">{contact.name}</span>
                      <span className="mini-row__meta">
                        {contact.notes.length === 0 ? 'Sin notas · creado ' : 'Última nota '}
                        {formatRelative(last, now)}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
              {followUp.length > 5 && (
                <li className="mini-list__more">
                  y {pluralize(followUp.length - 5, 'contacto más', 'contactos más')}
                </li>
              )}
            </ul>
          )}
        </section>

        <section className="panel" aria-labelledby="actividad-titulo">
          <h3 id="actividad-titulo" className="panel__title">
            Actividad reciente
          </h3>
          <p className="panel__hint">Las últimas notas registradas en todos los contactos.</p>
          {recent.length === 0 ? (
            <p className="panel__empty">Todavía no hay notas.</p>
          ) : (
            <ul className="mini-list">
              {recent.map(({ contact, note }) => (
                <li key={note.id}>
                  <Link to={`/contactos/${contact.id}`} className="mini-row mini-row--activity">
                    <span className="mini-row__body">
                      <span className="mini-row__title">
                        {noteKindLabel(note.kind)} · {contact.name}
                      </span>
                      <span className="mini-row__text">{note.body}</span>
                    </span>
                    <time className="mini-row__time" dateTime={note.createdAt}>
                      {formatRelative(note.createdAt, now)}
                    </time>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: 'warn' }) {
  return (
    <div className="stat" data-tone={tone}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  )
}
