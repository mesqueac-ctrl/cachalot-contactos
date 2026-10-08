import { statusLabel } from '../lib/crm'
import type { ContactStatus } from '../types'

export function StatusBadge({ status }: { status: ContactStatus }) {
  return (
    <span className="status-badge" data-status={status}>
      {statusLabel(status)}
    </span>
  )
}
