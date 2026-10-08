import { useToast } from '../state/toastContext'
import { IconCopy } from './icons'

/** Copia un dato al portapapeles. En escritorio `mailto:` muchas veces no abre nada. */
export function CopyButton({ value, label, done }: { value: string; label: string; done: string }) {
  const notify = useToast()

  async function copy() {
    try {
      await navigator.clipboard.writeText(value)
      notify(done)
    } catch {
      notify('No se pudo copiar. Selecciona el texto y cópialo a mano.', 'error')
    }
  }

  return (
    <button type="button" className="icon-btn" onClick={copy} aria-label={label} title={label}>
      <IconCopy size={16} />
    </button>
  )
}
