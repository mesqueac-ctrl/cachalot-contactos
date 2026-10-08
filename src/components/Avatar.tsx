import { initials, toneFor } from '../lib/text'

interface Props {
  name: string
  company: string
  size?: 'md' | 'lg'
}

/** El tono sale de la empresa: los contactos de una misma compañía comparten color. */
export function Avatar({ name, company, size = 'md' }: Props) {
  return (
    <span
      className={`avatar avatar--${size}`}
      data-tone={toneFor(company || name)}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  )
}
