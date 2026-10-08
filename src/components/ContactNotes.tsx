import { useId, useRef, useState, type FormEvent } from 'react'
import { formatDate, formatRelative, formatTime } from '../lib/dates'
import { pluralize } from '../lib/text'
import { useContacts } from '../state/contactsContext'
import { useToast } from '../state/toastContext'
import type { Note } from '../types'
import { IconAlert } from './icons'
import './ContactNotes.css'

export const NOTE_MAX_LENGTH = 500

export function ContactNotes({ contactId, notes }: { contactId: string; notes: Note[] }) {
  const sorted = [...notes].sort((a, b) => b.createdAt.localeCompare(a.createdAt))

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
          {sorted.map((note) => (
            <li key={note.id} className="timeline__item">
              <div className="timeline__stamp">
                <time dateTime={note.createdAt}>
                  {formatDate(note.createdAt)} · {formatTime(note.createdAt)}
                </time>
                <span className="timeline__relative">{formatRelative(note.createdAt)}</span>
              </div>
              <p className="timeline__body">{note.body}</p>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}

function NoteComposer({ contactId }: { contactId: string }) {
  const { addNote } = useContacts()
  const notify = useToast()
  const [body, setBody] = useState('')
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
      await addNote(contactId, body)
      setBody('')
      notify('Nota agregada')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar la nota.')
    } finally {
      setSaving(false)
      textareaRef.current?.focus()
    }
  }

  return (
    <form className="composer" onSubmit={handleSubmit} noValidate>
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
