import { useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { STATUSES } from '../lib/crm'
import { useDocumentTitle } from '../lib/useDocumentTitle'
import { hasErrors, validateContact, type ContactErrors } from '../lib/validation'
import type { ContactInput, ContactStatus } from '../types'
import { Avatar } from './Avatar'
import { IconAlert } from './icons'
import { TextField } from './TextField'
import './ContactForm.css'

type FieldName = Exclude<keyof ContactInput, 'status'>

const FIELD_ORDER: FieldName[] = ['name', 'email', 'phone', 'company', 'role']

const EMPTY: ContactInput = {
  name: '',
  email: '',
  phone: '',
  company: '',
  role: '',
  status: 'nuevo',
}

interface Props {
  title: string
  submitLabel: string
  savingLabel: string
  cancelTo: string
  initial?: ContactInput
  takenEmails: string[]
  onSubmit: (input: ContactInput) => Promise<void>
}

export function ContactForm({
  title,
  submitLabel,
  savingLabel,
  cancelTo,
  initial = EMPTY,
  takenEmails,
  onSubmit,
}: Props) {
  const [values, setValues] = useState<ContactInput>(initial)
  const [touched, setTouched] = useState<Partial<Record<FieldName, boolean>>>({})
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const refs = useRef<Partial<Record<FieldName, HTMLInputElement | null>>>({})
  useDocumentTitle(title)

  const errors = validateContact(values, { takenEmails })
  const visibleErrors: ContactErrors = {}
  for (const field of FIELD_ORDER) {
    if ((submitted || touched[field]) && errors[field]) visibleErrors[field] = errors[field]
  }
  const errorCount = Object.keys(visibleErrors).length

  function update(field: FieldName, value: string) {
    setValues((current) => ({ ...current, [field]: value }))
  }

  function fieldProps(field: FieldName) {
    return {
      id: `contacto-${field}`,
      value: values[field],
      error: visibleErrors[field],
      inputRef: (el: HTMLInputElement | null) => {
        refs.current[field] = el
      },
      onChange: (e: ChangeEvent<HTMLInputElement>) => update(field, e.target.value),
      onBlur: () => setTouched((current) => ({ ...current, [field]: true })),
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setSubmitted(true)
    setSubmitError(null)
    if (hasErrors(errors)) {
      const first = FIELD_ORDER.find((field) => errors[field])
      if (first) refs.current[first]?.focus()
      return
    }
    setSaving(true)
    try {
      await onSubmit(values)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'No se pudo guardar el contacto.')
      setSaving(false)
    }
  }

  return (
    <div className="page page--narrow form-page">
      <header className="form-page__header">
        <Avatar name={values.name || '?'} company={values.company} size="lg" />
        <div>
          <h1 className="form-page__title">{title}</h1>
          <p className="form-page__lede">
            {values.name.trim()
              ? [values.name.trim(), values.company.trim()].filter(Boolean).join(' · ')
              : 'El nombre y el correo son obligatorios.'}
          </p>
        </div>
      </header>

      <form className="form-card" onSubmit={handleSubmit} noValidate aria-label={title}>
        {submitted && errorCount > 0 && (
          <div className="form-alert" role="alert">
            <IconAlert size={18} />
            <p>
              {errorCount === 1
                ? 'Hay un campo por corregir.'
                : `Hay ${errorCount} campos por corregir.`}
            </p>
          </div>
        )}

        {submitError && (
          <div className="form-alert" role="alert">
            <IconAlert size={18} />
            <p>{submitError}</p>
          </div>
        )}

        <div className="form-grid">
          <div className="form-grid__full">
            <TextField
              {...fieldProps('name')}
              label="Nombre"
              autoComplete="name"
              placeholder="Ej.: Valentina Ríos"
            />
          </div>
          <TextField
            {...fieldProps('email')}
            label="Correo electrónico"
            type="email"
            inputMode="email"
            autoComplete="email"
            spellCheck={false}
            placeholder="nombre@empresa.com"
          />
          <TextField
            {...fieldProps('phone')}
            label="Teléfono"
            optional
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="+57 300 000 0000"
          />
          <TextField
            {...fieldProps('company')}
            label="Empresa"
            optional
            autoComplete="organization"
            placeholder="Ej.: Andina Logística"
          />
          <TextField
            {...fieldProps('role')}
            label="Cargo"
            optional
            autoComplete="organization-title"
            placeholder="Ej.: Jefe de compras"
          />
          <fieldset className="form-grid__full segmented-field">
            <legend className="field__label">Estado</legend>
            <div className="segmented">
              {STATUSES.map((option) => (
                <label key={option.value} className="segmented__option" data-status={option.value}>
                  <input
                    type="radio"
                    name="contacto-estado"
                    value={option.value}
                    checked={values.status === option.value}
                    onChange={() =>
                      setValues((current) => ({ ...current, status: option.value as ContactStatus }))
                    }
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          </fieldset>
        </div>

        <div className="form-actions">
          <Link to={cancelTo} className="btn btn--ghost">
            Cancelar
          </Link>
          <button type="submit" className="btn btn--primary" disabled={saving}>
            {saving ? savingLabel : submitLabel}
          </button>
        </div>
      </form>
    </div>
  )
}
