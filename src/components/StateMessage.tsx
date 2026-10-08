import type { ReactNode } from 'react'

interface Props {
  icon: ReactNode
  title: string
  children?: ReactNode
  action?: ReactNode
  tone?: 'neutral' | 'danger'
  role?: 'alert' | 'status'
}

export function StateMessage({ icon, title, children, action, tone = 'neutral', role }: Props) {
  return (
    <div className={`state state--${tone}`} role={role}>
      <span className="state__icon">{icon}</span>
      <p className="state__title">{title}</p>
      {children && <div className="state__text">{children}</div>}
      {action && <div className="state__action">{action}</div>}
    </div>
  )
}
