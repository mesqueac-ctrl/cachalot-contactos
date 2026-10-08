import { useId, useRef, useState, type FormEvent } from 'react'
import { NOTE_KINDS, noteKindLabel } from '../lib/crm'
import { formatDate, formatRelative, formatTime } from '../lib/dates'
import { pluralize } from '../lib/text'
import { useContacts } from '../state/contactsContext'
import { useToast } from '../state/toastContext'
import type { Contact, Note, NoteKind } from '../types'
import { IconAlert, IconCalendarCheck, IconTrash } from './icons'
import { NextStepFields } from './NextStepFields'
import { NoteKindIcon } from './NoteKindIcon'
import './ContactNotes.css'

export const NOTE_MAX_LENGTH = 500

export function ContactNotes({ contact }: { contact: Contact }) {
  const { id: contactId, notes } = contact
  const { removeNote, restoreNote } = useContacts()
  const notify = useToast()
  const [removing, setRemoving] = useState<string | null>(null)
  const sorted = [...notes].sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  async function handleRemove(note: Note) {
    setRemoving(note.id)
    try {
      await removeNote(contactId, note.id)
      notify('Nota eliminada', 'success', {
        label: 'Deshacer',
        onAction: () => void restoreNote(contactId, note),
      })
    } catch (err) {
      notify(err instanceof Error ? err.message : 'No se pudo eliminar la nota.', 'error')
    } finally {
      setRemoving(null)
    }
  }

  return (
    <section className="notes" aria-labelledby="notas-titulo">
      <div className="notes__head">
        <h2 id="notas-titulo" className="notes__title">
          Historial
        </h2>
        <span className="notes__count">{pluralize(notes.length, 'nota', 'notas')}</span>
      </div>

      <NoteComposer key={contactId} contactId={contactId} hasNextStep={contact.nextStep !== null} />

      {sorted.length === 0 ? (
        <p className="notes__empty">Aún no hay notas.</p>
      ) : (
        <ol className="timeline" aria-label="Historial de notas, de la más reciente a la más antigua">
          {sorted.map((note) => {
            return (
              <li key={note.id} className="timeline__item" data-kind={note.kind}>
                <span className="timeline__node" aria-hidden="true">
                  <NoteKindIcon kind={note.kind} />
                </span>
                <div className="timeline__stamp">
                  <span className="timeline__kind">{noteKindLabel(note.kind)}</span>
                  <time
                    dateTime={note.createdAt}
                    title={`${formatDate(note.createdAt)} · ${formatTime(note.createdAt)}`}
                  >
                    {formatRelative(note.createdAt)}
                  </time>
                  <button
                    type="button"
                    className="timeline__delete"
                    onClick={() => handleRemove(note)}
                    disabled={removing === note.id}
                    aria-label={`Eliminar ${noteKindLabel(note.kind).toLowerCase()} del ${formatDate(note.createdAt)}`}
                    title="Eliminar nota"
                  >
                    <IconTrash size={14} />
                  </button>
                </div>
                <p className="timeline__body">{note.body}</p>
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}

function NoteComposer({ contactId, hasNextStep }: { contactId: string; hasNextStep: boolean }) {
  const { addNote } = useContacts()
  const [nextDate, setNextDate] = useState('')
  const [nextText, setNextText] = useState('')
  const [scheduling, setScheduling] = useState(false)
  const notify = useToast()
  const [body, setBody] = useState('')
  const [kind, setKind] = useState<NoteKind>('llamada')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const id = useId()
  const hintId = `${id}-ayuda`
  const errorId = `${id}-error`
  const length = body.trim().length
  const tooLong = length > NOTE_MAX_LENGTH

  async function handleSubmit(event?: FormEvent) {
    event?.preventDefault()
    if (saving) return
    if (length === 0) {
      setError('Escribe la nota antes de guardarla.')
      textareaRef.current?.focus()
      return
    }
    if (tooLong) {
      setError(`La nota puede tener hasta ${NOTE_MAX_LENGTH} caracteres; tiene ${length}.`)
      textareaRef.current?.focus()
      return
    }
    setSaving(true)
    setError(null)
    try {
      await addNote(contactId, body, kind, nextDate ? { date: nextDate, text: nextText } : undefined)
      setBody('')
      setNextDate('')
      setNextText('')
      setScheduling(false)
      const saved = `${noteKindLabel(kind)} ${kind === 'correo' ? 'registrado' : 'registrada'}`
      notify(nextDate ? `${saved} y próximo paso agendado` : saved)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar la nota.')
    } finally {
      setSaving(false)
      textareaRef.current?.focus()
    }
  }

  return (
    <form className="composer" onSubmit={handleSubmit} noValidate>
      <fieldset className="composer__kinds">
        <legend className="visually-hidden">Tipo de nota</legend>
        <div className="segmented">
          {NOTE_KINDS.map((option) => {
            return (
              <label key={option.value} className="segmented__option">
                <input
                  type="radio"
                  name={`${id}-tipo`}
                  value={option.value}
                  checked={kind === option.value}
                  onChange={() => setKind(option.value)}
                />
                <span>
                  <NoteKindIcon kind={option.value} size={14} />
                  {option.label}
                </span>
              </label>
            )
          })}
        </div>
      </fieldset>
      <label htmlFor={id} className="visually-hidden">
        Qué pasó
      </label>
      <textarea
        ref={textareaRef}
        id={id}
        className="input composer__input"
        placeholder="¿Qué pasó? Ej.: Llamada de seguimiento el 5 de octubre"
        rows={2}
        value={body}
        onChange={(e) => {
          setBody(e.target.value)
          if (error) setError(null)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault()
            void handleSubmit()
          }
        }}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${errorId} ${hintId}` : hintId}
      />
      <p id={hintId} className="visually-hidden">
        Ctrl + Enter para guardar. Máximo {NOTE_MAX_LENGTH} caracteres.
      </p>
      {error && (
        <p id={errorId} className="field__error">
          <IconAlert size={16} />
          {error}
        </p>
      )}

      {scheduling && (
        <fieldset className="composer__next">
          <legend className="visually-hidden">Próximo paso</legend>
          <NextStepFields
            id={`${id}-paso`}
            date={nextDate}
            text={nextText}
            onDateChange={setNextDate}
            onTextChange={setNextText}
          />
        </fieldset>
      )}

      <div className="composer__footer">
        <button
          type="button"
          className="composer__schedule"
          aria-expanded={scheduling}
          onClick={() => {
            setScheduling((open) => !open)
            setNextDate('')
            setNextText('')
          }}
        >
          <IconCalendarCheck size={16} />
          {scheduling ? 'No agendar' : hasNextStep ? 'Cambiar próximo paso' : 'Agendar seguimiento'}
        </button>
        <span className="composer__actions">
          {length > NOTE_MAX_LENGTH - 100 && (
            <span className={tooLong ? 'composer__counter composer__counter--over' : 'composer__counter'}>
              {length}/{NOTE_MAX_LENGTH}
            </span>
          )}
          <button
            type="submit"
            className="btn btn--primary"
            disabled={saving}
            title="Ctrl + Enter"
          >
            {saving ? 'Guardando…' : 'Agregar nota'}
          </button>
        </span>
      </div>
    </form>
  )
}
