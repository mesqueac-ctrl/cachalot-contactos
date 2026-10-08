import type { NoteKind } from '../types'
import { IconCalendar, IconMail, IconNote, IconPhone } from './icons'

const KIND_ICON: Record<NoteKind, typeof IconNote> = {
  llamada: IconPhone,
  reunion: IconCalendar,
  correo: IconMail,
  nota: IconNote,
}

export function NoteKindIcon({ kind, size = 12 }: { kind: NoteKind; size?: number }) {
  const Icon = KIND_ICON[kind]
  return <Icon size={size} strokeWidth={size <= 12 ? 2.2 : 1.8} />
}
