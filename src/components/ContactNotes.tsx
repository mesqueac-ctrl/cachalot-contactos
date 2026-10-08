import { useId, useRef, useState, type FormEvent } from 'react'
import { NOTE_KINDS, noteKindLabel } from '../lib/crm'
import { formatDate, formatRelative, formatTime } from '../lib/dates'
import { pluralize } from '../lib/text'
import { useContacts } from '../state/contactsContext'
import { useToast } from '../state/toastContext'
import type { Note, NoteKind } from '../types'
import { IconAlert, IconCalendar, IconMail, IconNote, IconPhone, IconTrash } from './icons'
import './ContactNotes.css'

export const NOTE_MAX_LENGTH = 500

const KIND_ICON: Record<NoteKind, typeof IconNote> = {
  llamada: IconPhone,
  reunion: IconCalendar,
  correo: IconMail,
  nota: IconNote,
}

export function ContactNotes({ contactId, notes }: { contactId: string; notes: Note[] }) {
  const { removeNote } = useContacts()
  const notify = useToast()
  const [removing, setRemoving] = useState<string | null>(null)
  const sorted = [...notes].sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  async function handleRemove(note: Note) {
    setRemoving(note.id)
    try {
      await removeNote(contactId, note.id)
      notify('Nota eliminada')
    } catch (err) {
      notify(err instanceof Error ? err.message : 'No se pudo eliminar la nota.', 'error')
      setRemoving(null)
    }
  }

  return (
    <section className="notes" aria-labelledby="notas-titulo">
      <div className="notes__head">
        <h3 id="notas-titulo" className="notes__title">
          Notas
        </h3>
        <span className="notes__count">{pluralize(notes.length, 'nota', 'notas')}</span>
      </div>

      <NoteComposer key={contactId} contactId={contactId} />

      {sorted.length === 0 ? (
        <p className="notes__empty">
          Aún no hay notas. Registra aquí llamadas, reuniones o acuerdos con este contacto.
        </p>
      ) : (
        <ol className="timeline" aria-label="Historial de notas, de la más reciente a la más antigua">
          {sorted.map((note) => {
            const Icon = KIND_ICON[note.kind]
            return (
              <li key={note.id} className="timeline__item" data-kind={note.kind}>
                <span className="timeline__node" aria-hidden="true">
                  <Icon size={12} strokeWidth={2.2} />
                </span>
                <div className="timeline__stamp">
                  <span className="timeline__kind">{noteKindLabel(note.kind)}</span>
                  <time dateTime={note.createdAt}>
                    {formatDate(note.createdAt)} · {formatTime(note.createdAt)}
                  </time>
                  <span className="timeline__relative">{formatRelative(note.createdAt)}</span>
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

function NoteComposer({ contactId }: { contactId: string }) {
  const { addNote } = useContacts()
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
      await addNote(contactId, body, kind)
      setBody('')
      notify(`${noteKindLabel(kind)} ${kind === 'correo' ? 'registrado' : 'registrada'}`)
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
            const Icon = KIND_ICON[option.value]
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
                  <Icon size={14} />
                  {option.label}
                </span>
              </label>
            )
          })}
        </div>
      </fieldset>
      <label htmlFor={id} className="field__label">
        Nueva nota
      </label>
      <textarea
        ref={textareaRef}
        id={id}
        className="input composer__input"
        placeholder="Ej.: Llamada de seguimiento el 5 de octubre"
        rows={3}
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
      {error && (
        <p id={errorId} className="field__error">
          <IconAlert size={16} />
          {error}
        </p>
      )}
      <div className="composer__footer">
        <p id={hintId} className="field__hint">
          <span className={tooLong ? 'composer__counter--over' : undefined}>
            {length}/{NOTE_MAX_LENGTH}
          </span>
          <span className="composer__shortcut"> · Ctrl + Enter para guardar</span>
        </p>
        <button type="submit" className="btn btn--primary" disabled={saving}>
          {saving ? 'Guardando…' : 'Agregar nota'}
        </button>
      </div>
    </form>
  )
}
