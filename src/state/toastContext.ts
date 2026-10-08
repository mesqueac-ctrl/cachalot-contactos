import { createContext, useContext } from 'react'

export type ToastTone = 'success' | 'error'

export interface ToastAction {
  label: string
  onAction: () => void
}

export type Notify = (message: string, tone?: ToastTone, action?: ToastAction) => void

export const ToastContext = createContext<Notify | null>(null)

export function useToast() {
  const notify = useContext(ToastContext)
  if (!notify) throw new Error('useToast debe usarse dentro de <ToastProvider>')
  return notify
}
