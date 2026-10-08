import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Avatar } from '../components/Avatar'
import { DueLabel } from '../components/DueLabel'
import {
  IconAlert,
  IconCalendarCheck,
  IconCheck,
  IconClock,
  IconFlag,
  IconNote,
  IconPlus,
  IconRefresh,
  IconTrend,
  IconUsers,
} from '../components/icons'
import { StateMessage } from '../components/StateMessage'
import {
  STATUSES,
  agenda,
  daysSince,
  needingFollowUp,
  weeklyActivity,
  type AgendaItem,
} from '../lib/crm'
import { pluralize } from '../lib/text'
import { useDocumentTitle } from '../lib/useDocumentTitle'
import { useContacts } from '../state/contactsContext'
import { useToast } from '../state/toastContext'
import type { ContactStatus } from '../types'
import './Home.css'
import './pages.css'

const todayFormat = new Intl.DateTimeFormat('es-CO', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
})
const weekFormat = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short' })

const WEEKS = 8

function greeting(now: Date) {
  const hour = now.getHours()
  if (hour < 12) return 'Buenos días'
  if (hour < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

export function HomePage() {
  const { status, contacts, error, reload } = useContacts()
  const [now] = useState(() => new Date())
  useDocumentTitle('Inicio')

  if (status === 'loading') {
    return (
      <div className="page home" role="status">
        <span className="visually-hidden">Cargando inicio…</span>
        <div className="kpis" aria-hidden="true">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className="skeleton" style={{ height: 116, borderRadius: 18 }} />
          ))}
        </div>
        <span className="skeleton" style={{ height: 280, borderRadius: 18 }} aria-hidden="true" />
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="page page--center">
        <StateMessage
          role="alert"
          tone="danger"
          icon={<IconAlert size={22} />}
          title="No pudimos cargar el inicio"
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
      <div className="page page--center">
        <StateMessage
          icon={<IconPlus size={22} />}
          title="Empieza agregando un contacto"
          action={
            <Link to="/contactos/nuevo" className="btn btn--primary">
              <IconPlus size={16} />
              Crear el primer contacto
            </Link>
          }
        >
          Aquí verás tus pendientes del día y cómo va tu cartera.
        </StateMessage>
      </div>
    )
  }

  const { overdue, today, week } = agenda(contacts, now)
  const tasks = [...overdue, ...today, ...week]
  const forgotten = needingFollowUp(contacts, now)
  const notes = contacts.flatMap((c) => c.notes)
  const notesThisMonth = notes.filter((n) => daysSince(n.createdAt, now) <= 30).length
  const notesLastMonth = notes.filter((n) => {
    const days = daysSince(n.createdAt, now)
    return days > 30 && days <= 60
  }).length
  const newThisMonth = contacts.filter((c) => daysSince(c.createdAt, now) <= 30).length
  const pendingToday = overdue.length + today.length

  return (
    <div className="page home">
      <header className="home__head">
        <p className="home__date">{todayFormat.format(now)}</p>
        <h1 className="page-title">{greeting(now)}</h1>
      </header>

      <section className="kpis" aria-label="Indicadores">
        <Kpi
          tone="amber"
          icon={<IconCalendarCheck size={20} />}
          label="Pendientes hoy"
          value={pendingToday}
          note={
            overdue.length > 0 ? (
              <span className="kpi__bad">{pluralize(overdue.length, 'atrasado', 'atrasados')}</span>
            ) : (
              'Nada atrasado'
            )
          }
        />
        <Kpi
          tone="blue"
          icon={<IconClock size={20} />}
          label="Esta semana"
          value={week.length}
          note="Próximos 7 días"
        />
        <Kpi
          tone="violet"
          icon={<IconUsers size={20} />}
          label="Contactos"
          value={contacts.length}
          note={newThisMonth > 0 ? <span className="kpi__good">+{newThisMonth} este mes</span> : 'Sin nuevos este mes'}
        />
        <Kpi
          tone="green"
          icon={<IconNote size={20} />}
          label="Notas en 30 días"
          value={notesThisMonth}
          note={<Delta now={notesThisMonth} before={notesLastMonth} />}
        />
      </section>

      <div className="home__grid">
        <ActivityChart counts={weeklyActivity(contacts, WEEKS, now)} now={now} />
        <StatusDonut
          counts={STATUSES.map((s) => ({
            ...s,
            count: contacts.filter((c) => c.status === s.value).length,
          }))}
          total={contacts.length}
        />
      </div>

      <div className="home__grid home__grid--wide">
        <section className="card" aria-labelledby="tareas-titulo">
          <div className="card__head">
            <h2 id="tareas-titulo" className="card__title">
              Próximos pasos
            </h2>
            <Link to="/contactos?orden=proximo" className="card__link">
              Ver todos
            </Link>
          </div>
          {tasks.length === 0 ? (
            <p className="card__empty">
              <IconCheck size={16} />
              Nada pendiente en los próximos 7 días.
            </p>
          ) : (
            <ul className="tasks">
              {tasks.map((item) => (
                <TaskRow key={item.contact.id} item={item} now={now} />
              ))}
            </ul>
          )}
        </section>

        <section className="card" aria-labelledby="olvidados-titulo">
          <div className="card__head">
            <h2 id="olvidados-titulo" className="card__title">
              Sin seguimiento
            </h2>
            <span className="card__icon card__icon--warn" aria-hidden="true">
              <IconFlag size={16} />
            </span>
          </div>
          {forgotten.length === 0 ? (
            <p className="card__empty">
              <IconCheck size={16} />
              Nadie olvidado.
            </p>
          ) : (
            <ul className="mini-list">
              {forgotten.slice(0, 5).map(({ contact, last }) => (
                <li key={contact.id}>
                  <Link to={`/contactos/${contact.id}`} className="mini-row">
                    <Avatar name={contact.name} company={contact.company} size="sm" />
                    <span className="mini-row__body">
                      <span className="mini-row__title">{contact.name}</span>
                      <span className="mini-row__meta">{contact.company || 'Sin empresa'}</span>
                    </span>
                    <span className="mini-row__days" title="Días sin contacto">
                      {daysSince(last, now)} d
                    </span>
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

function Kpi({
  tone,
  icon,
  label,
  value,
  note,
}: {
  tone: 'amber' | 'blue' | 'violet' | 'green'
  icon: ReactNode
  label: string
  value: number
  note: ReactNode
}) {
  return (
    <div className="kpi" data-tone={tone}>
      <span className="kpi__icon" aria-hidden="true">
        {icon}
      </span>
      <p className="kpi__label">{label}</p>
      <p className="kpi__value">{value}</p>
      <p className="kpi__note">{note}</p>
    </div>
  )
}

function Delta({ now, before }: { now: number; before: number }) {
  const diff = now - before
  if (diff === 0) return <>Igual que el mes anterior</>
  return (
    <span className={diff > 0 ? 'kpi__good' : 'kpi__bad'}>
      {diff > 0 ? '▲' : '▼'} {Math.abs(diff)} vs. mes anterior
    </span>
  )
}

function ActivityChart({ counts, now }: { counts: number[]; now: Date }) {
  const max = Math.max(...counts, 1)
  const total = counts.reduce((a, b) => a + b, 0)
  const labels = counts.map((_, i) => {
    const start = new Date(now)
    start.setDate(start.getDate() - (counts.length - 1 - i) * 7 - 6)
    return weekFormat.format(start).replace('.', '').replace(' de ', ' ')
  })

  return (
    <section className="card chart" aria-labelledby="actividad-titulo">
      <div className="card__head">
        <div>
          <h2 id="actividad-titulo" className="card__title">
            Actividad
          </h2>
          <p className="card__sub">
            {total} notas en {counts.length} semanas
          </p>
        </div>
        <span className="card__icon" aria-hidden="true">
          <IconTrend size={16} />
        </span>
      </div>
      <ol className="bars" aria-label="Notas registradas por semana">
        {counts.map((count, i) => (
          <li key={labels[i]} className="bars__item" data-current={i === counts.length - 1 || undefined}>
            <span className="bars__track">
              <span
                className="bars__fill"
                style={{ height: `${Math.max((count / max) * 100, count ? 8 : 0)}%` }}
              />
            </span>
            <span className="bars__value">{count}</span>
            <span className="bars__label">
              <span className="visually-hidden">Semana del </span>
              {labels[i]}
            </span>
          </li>
        ))}
      </ol>
    </section>
  )
}

function StatusDonut({
  counts,
  total,
}: {
  counts: { value: ContactStatus; plural: string; count: number }[]
  total: number
}) {
  const r = 52
  const length = 2 * Math.PI * r
  // Cada segmento empieza donde termina el anterior.
  const parts = counts.map((s) => (total ? (s.count / total) * length : 0))
  const starts = parts.map((_, i) => parts.slice(0, i).reduce((a, b) => a + b, 0))

  return (
    <section className="card donut" aria-labelledby="estados-titulo">
      <div className="card__head">
        <h2 id="estados-titulo" className="card__title">
          Cartera por estado
        </h2>
      </div>
      <div className="donut__body">
        <span className="donut__chart">
          <svg viewBox="0 0 128 128" width="148" height="148" aria-hidden="true">
            <circle cx="64" cy="64" r={r} className="donut__track" />
            {counts.map((s, i) => (
              <circle
                key={s.value}
                cx="64"
                cy="64"
                r={r}
                className="donut__segment"
                data-status={s.value}
                strokeDasharray={`${Math.max(parts[i] - 3, 0)} ${length}`}
                strokeDashoffset={-starts[i]}
              />
            ))}
          </svg>
          <span className="donut__total">
            <b>{total}</b>
            <span>contactos</span>
          </span>
        </span>
        <ul className="donut__legend">
          {counts.map((s) => (
            <li key={s.value} data-status={s.value}>
              <Link to={`/contactos?estado=${s.value}`}>
                <span className="donut__name">{s.plural}</span>
                <b>{s.count}</b>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

function TaskRow({ item, now }: { item: AgendaItem; now: Date }) {
  const { setNextStep } = useContacts()
  const notify = useToast()
  const { contact, step } = item

  async function markDone() {
    try {
      await setNextStep(contact.id, null)
      notify(`Hecho: ${contact.name}`, 'success', {
        label: 'Deshacer',
        onAction: () => void setNextStep(contact.id, step),
      })
    } catch (err) {
      notify(err instanceof Error ? err.message : 'No se pudo actualizar.', 'error')
    }
  }

  return (
    <li className="task" data-late={item.days < 0 || undefined}>
      <button
        type="button"
        className="task__check"
        onClick={markDone}
        aria-label={`Marcar como hecho: ${step.text || 'seguimiento'} con ${contact.name}`}
        title="Marcar como hecho"
      >
        <IconCheck size={14} />
      </button>
      <div className="task__body">
        <p className="task__text">{step.text || 'Dar seguimiento'}</p>
        <Link to={`/contactos/${contact.id}`} className="task__name">
          {contact.name}
        </Link>
      </div>
      <DueLabel date={step.date} now={now} short />
    </li>
  )
}
