import { dueState } from '../lib/crm'
import { daysUntil, formatDay, formatDue, parseDayKey } from '../lib/dates'

const shortDay = new Intl.DateTimeFormat('es-CO', { weekday: 'short', day: 'numeric' })
const shortDate = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short' })

/**
 * Fecha de un próximo paso, coloreada según si está atrasada, es hoy o viene después.
 * `short` la muestra como etiqueta compacta ("Hoy", "Mañana", "Vie 9"); el detalle va en el title.
 */
export function DueLabel({ date, now, short = false }: { date: string; now?: Date; short?: boolean }) {
  const state = dueState(date, now)
  const relative = formatDue(date, now)
  const full = `${capitalize(formatDay(date))} · ${relative}`

  if (short) {
    const days = daysUntil(date, now)
    const text =
      days < 0
        ? `Atrasado ${-days} d`
        : days === 0
          ? 'Hoy'
          : days === 1
            ? 'Mañana'
            : days < 7
              ? shortDay.format(parseDayKey(date))
              : shortDate.format(parseDayKey(date))
    return (
      <time className="due-pill" data-due={state} dateTime={date} title={full}>
        {capitalize(text.replace(/\./g, '').replace(',', ''))}
      </time>
    )
  }

  return (
    <span className="due" data-due={state}>
      <time dateTime={date}>{capitalize(state === 'proximo' ? formatDay(date) : relative)}</time>
      {state === 'proximo' ? (
        <span className="due__relative"> · {relative}</span>
      ) : (
        state === 'atrasado' && <span className="due__relative"> · {formatDay(date)}</span>
      )}
    </span>
  )
}

function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1)
}
