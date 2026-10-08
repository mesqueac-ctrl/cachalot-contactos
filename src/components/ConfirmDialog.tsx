import { useEffect, useId, useRef, type ReactNode } from 'react'
import './ConfirmDialog.css'

interface Props {
  open: boolean
  title: string
  children: ReactNode
  confirmLabel: string
  busyLabel: string
  busy?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel,
  busyLabel,
  busy = false,
  onConfirm,
  onCancel,
}: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const id = useId()

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) {
      // jsdom no implementa showModal; en ese caso basta con el atributo.
      if (typeof dialog.showModal === 'function') dialog.showModal()
      else dialog.setAttribute('open', '')
    } else if (!open && dialog.open) {
      if (typeof dialog.close === 'function') dialog.close()
      else dialog.removeAttribute('open')
    }
  }, [open])

  return (
    <dialog
      ref={ref}
      className="dialog"
      aria-labelledby={`${id}-titulo`}
      aria-describedby={`${id}-texto`}
      onCancel={(event) => {
        event.preventDefault()
        if (!busy) onCancel()
      }}
      onClose={() => {
        if (open) onCancel()
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.preventDefault()
          if (!busy) onCancel()
        }
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget && !busy) onCancel()
      }}
    >
      {open && (
        <div className="dialog__body">
          <h2 id={`${id}-titulo`} className="dialog__title">
            {title}
          </h2>
          <div id={`${id}-texto`} className="dialog__text">
            {children}
          </div>
          <div className="dialog__actions">
            <button
              type="button"
              className="btn btn--secondary"
              onClick={onCancel}
              disabled={busy}
              autoFocus
            >
              Cancelar
            </button>
            <button type="button" className="btn btn--danger" onClick={onConfirm} disabled={busy}>
              {busy ? busyLabel : confirmLabel}
            </button>
          </div>
        </div>
      )}
    </dialog>
  )
}
