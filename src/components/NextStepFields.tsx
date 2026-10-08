import { useRef, useState } from 'react'
import { addDays, toDayKey } from '../lib/dates'

const QUICK = [
  { days: 1, label: 'Mañana' },
  { days: 3, label: 'En 3 días' },
  { days: 7, label: 'En 1 semana' },
  { days: 14, label: 'En 2 semanas' },
]

interface Props {
  id: string
  date: string
  text: string
  onDateChange: (date: string) => void
  onTextChange: (text: string) => void
  /** Texto del botón para no agendar nada; si falta, la fecha es obligatoria. */
  noneLabel?: string
  dateError?: string
}

/** Fecha (con atajos) y descripción del próximo paso. Se usa al registrar una nota y al reagendar. */
export function NextStepFields({
  id,
  date,
  text,
  onDateChange,
  onTextChange,
  noneLabel,
  dateError,
}: Props) {
  const dateRef = useRef<HTMLInputElement>(null)
  const [today] = useState(() => toDayKey(new Date()))
  const quickDates = QUICK.map((q) => ({ ...q, date: addDays(today, q.days) }))
  const isQuick = quickDates.some((q) => q.date === date)

  return (
    <div className="next-fields">
      <div className="quick-dates" role="group" aria-label="Elegir fecha rápida">
        {noneLabel && (
          <button
            type="button"
            className="quick-date"
            aria-pressed={date === ''}
            onClick={() => onDateChange('')}
          >
            {noneLabel}
          </button>
        )}
        {quickDates.map((q) => (
          <button
            key={q.days}
            type="button"
            className="quick-date"
            aria-pressed={q.date === date}
            onClick={() => onDateChange(q.date)}
          >
            {q.label}
          </button>
        ))}
        <button
          type="button"
          className="quick-date"
          aria-pressed={date !== '' && !isQuick}
          onClick={() => {
            if (!date) onDateChange(addDays(today, 21))
            requestAnimationFrame(() => dateRef.current?.focus())
          }}
        >
          Otra fecha
        </button>
      </div>

      {(date !== '' || !noneLabel) && (
        <div className="next-fields__row">
          <div className="field next-fields__date">
            <label htmlFor={`${id}-fecha`} className="field__label">
              Fecha
            </label>
            <input
              ref={dateRef}
              id={`${id}-fecha`}
              type="date"
              className="input"
              min={today}
              value={date}
              onChange={(e) => onDateChange(e.target.value)}
              aria-invalid={dateError ? true : undefined}
              aria-describedby={dateError ? `${id}-fecha-error` : undefined}
            />
            {dateError && (
              <p id={`${id}-fecha-error`} className="field__error">
                {dateError}
              </p>
            )}
          </div>
          <div className="field next-fields__text">
            <label htmlFor={`${id}-que`} className="field__label">
              Qué hay que hacer <span className="field__optional">(opcional)</span>
            </label>
            <input
              id={`${id}-que`}
              className="input"
              value={text}
              maxLength={120}
              placeholder="Ej.: Enviar la cotización"
              onChange={(e) => onTextChange(e.target.value)}
            />
          </div>
        </div>
      )}
    </div>
  )
}
