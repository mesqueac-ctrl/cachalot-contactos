import { createContext, useContext } from 'react'

export type ToastTone = 'success' | 'error'

export const ToastContext = createContext<((message: string, tone?: ToastTone) => void) | null>(
  null,
)

export function useToast() {
  const notify = useContext(ToastContext)
  if (!notify) throw new Error('useToast debe usarse dentro de <ToastProvider>')
  return notify
}
