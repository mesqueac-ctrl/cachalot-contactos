import { useCallback, useRef, useState, type ReactNode } from 'react'
import { IconAlert, IconCheck, IconClose } from '../components/icons'
import { ToastContext, type Notify, type ToastAction, type ToastTone } from './toastContext'
import './Toast.css'

interface Toast {
  id: number
  message: string
  tone: ToastTone
  action?: ToastAction
}

const DURATION_MS = 4000
// Con "Deshacer" se deja más tiempo para alcanzar a reaccionar.
const ACTION_DURATION_MS = 7000

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextId = useRef(0)

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((t) => t.id !== id))
  }, [])

  const notify = useCallback<Notify>(
    (message, tone = 'success', action) => {
      const id = ++nextId.current
      setToasts((current) => [...current.slice(-2), { id, message, tone, action }])
      window.setTimeout(() => dismiss(id), action ? ACTION_DURATION_MS : DURATION_MS)
    },
    [dismiss],
  )

  return (
    <ToastContext.Provider value={notify}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast--${toast.tone}`}>
            {toast.tone === 'success' ? <IconCheck /> : <IconAlert />}
            <span className="toast__message">{toast.message}</span>
            {toast.action && (
              <button
                type="button"
                className="toast__action"
                onClick={() => {
                  dismiss(toast.id)
                  toast.action?.onAction()
                }}
              >
                {toast.action.label}
              </button>
            )}
            <button
              type="button"
              className="toast__close"
              onClick={() => dismiss(toast.id)}
              aria-label="Cerrar notificación"
            >
              <IconClose size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
