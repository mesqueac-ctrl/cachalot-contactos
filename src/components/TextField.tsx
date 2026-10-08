import type { InputHTMLAttributes, Ref } from 'react'
import { IconAlert } from './icons'

interface Props extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'name'> {
  id: string
  label: string
  optional?: boolean
  hint?: string
  error?: string
  inputRef?: Ref<HTMLInputElement>
}

export function TextField({ id, label, optional, hint, error, inputRef, ...inputProps }: Props) {
  const hintId = hint ? `${id}-ayuda` : undefined
  const errorId = error ? `${id}-error` : undefined
  const describedBy = [errorId, hintId].filter(Boolean).join(' ') || undefined

  return (
    <div className="field">
      <label htmlFor={id} className="field__label">
        {label}
        {optional && <span className="field__optional"> (opcional)</span>}
      </label>
      <input
        ref={inputRef}
        id={id}
        name={id}
        className="input"
        aria-required={optional ? undefined : true}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        {...inputProps}
      />
      {error && (
        <p id={errorId} className="field__error">
          <IconAlert size={16} />
          {error}
        </p>
      )}
      {hint && (
        <p id={hintId} className="field__hint">
          {hint}
        </p>
      )}
    </div>
  )
}
