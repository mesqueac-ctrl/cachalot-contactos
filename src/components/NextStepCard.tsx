import { useId, useState, type FormEvent } from 'react'
import { useContacts } from '../state/contactsContext'
import { useToast } from '../state/toastContext'
import type { Contact } from '../types'
import { DueLabel } from './DueLabel'
import { IconCalendarCheck, IconCheck } from './icons'
import { NextStepFields } from './NextStepFields'

/** Lo siguiente que hay que hacer con el contacto: verlo, marcarlo como hecho o reagendarlo. */
export function NextStepCard({ contact }: { contact: Contact }) {
  const { setNextStep } = useContacts()
  const notify = useToast()
  const id = useId()
  const step = contact.nextStep
  const [editing, setEditing] = useState(false)
  const [date, setDate] = useState('')
  const [text, setText] = useState('')
  const [dateError, setDateError] = useState<string>()
  const [saving, setSaving] = useState(false)

  function startEditing() {
    setDate(step?.date ?? '')
    setText(step?.text ?? '')
    setDateError(undefined)
    setEditing(true)
  }

  async function save(event: FormEvent) {
    event.preventDefault()
    if (!date) {
      setDateError('Elige una fecha.')
      return
    }
    setSaving(true)
    try {
      await setNextStep(contact.id, { date, text })
      notify(step ? 'Próximo paso reagendado' : 'Próximo paso agendado')
      setEditing(false)
    } catch (err) {
      notify(err instanceof Error ? err.message : 'No se pudo guardar.', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function markDone() {
    if (!step) return
    try {
      await setNextStep(contact.id, null)
      notify('Próximo paso completado', 'success', {
        label: 'Deshacer',
        onAction: () => void setNextStep(contact.id, step),
      })
    } catch (err) {
      notify(err instanceof Error ? err.message : 'No se pudo actualizar.', 'error')
    }
  }

  return (
    <section className="next-card" aria-labelledby={`${id}-titulo`} data-empty={!step || undefined}>
      <div className="next-card__head">
        <span className="next-card__icon" aria-hidden="true">
          <IconCalendarCheck size={18} />
        </span>
        <h2 id={`${id}-titulo`} className="next-card__eyebrow">
          Próximo paso
        </h2>
      </div>

      {editing ? (
        <form className="next-card__form" onSubmit={save} noValidate>
          <NextStepFields
            id={id}
            date={date}
            text={text}
            onDateChange={(value) => {
              setDate(value)
              setDateError(undefined)
            }}
            onTextChange={setText}
            dateError={dateError}
          />
          <div className="next-card__actions">
            <button type="button" className="btn btn--ghost" onClick={() => setEditing(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn btn--primary" disabled={saving}>
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </form>
      ) : step ? (
        <div className="next-card__body">
          <div className="next-card__what">
            <p className="next-card__text">{step.text || 'Dar seguimiento'}</p>
            <DueLabel date={step.date} />
          </div>
          <div className="next-card__actions">
            <button type="button" className="btn btn--ghost btn--sm" onClick={startEditing}>
              Reagendar
            </button>
            <button type="button" className="btn btn--secondary btn--sm" onClick={markDone}>
              <IconCheck size={16} />
              Hecho
            </button>
          </div>
        </div>
      ) : (
        <div className="next-card__body">
          <p className="next-card__none">
            Nada agendado. Decide cuándo volver a hablar para que no se enfríe.
          </p>
          <div className="next-card__actions">
            <button type="button" className="btn btn--secondary btn--sm" onClick={startEditing}>
              Agendar
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
