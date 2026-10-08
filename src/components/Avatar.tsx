import { initials, toneFor } from '../lib/text'

export type Freshness = 'reciente' | 'enfriando' | 'olvidado'

const FRESHNESS_LABEL: Record<Freshness, string> = {
  reciente: 'Contacto reciente',
  enfriando: 'Hace semanas sin contacto',
  olvidado: 'Más de 21 días sin contacto',
}

interface Props {
  name: string
  company: string
  size?: 'sm' | 'md' | 'lg'
  /** Punto de color en la esquina según la última actividad. */
  freshness?: Freshness
}

/** Iniciales de la persona; el color sale de la empresa, así los colegas comparten tono. */
export function Avatar({ name, company, size = 'md', freshness }: Props) {
  return (
    <span className={`avatar avatar--${size}`} data-tone={toneFor(company || name)}>
      <span aria-hidden="true">{initials(name)}</span>
      {freshness && (
        <span
          className="avatar__dot"
          data-fresh={freshness}
          role="img"
          aria-label={FRESHNESS_LABEL[freshness]}
          title={FRESHNESS_LABEL[freshness]}
        />
      )}
    </span>
  )
}
