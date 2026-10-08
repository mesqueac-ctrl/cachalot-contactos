const RINGS = [36, 72, 108, 144, 180, 216, 252]

/** Anillos de sonar: el motivo gráfico de la marca. Decorativo. */
export function Sonar({ className = '', ping = false }: { className?: string; ping?: boolean }) {
  return (
    <svg
      className={`sonar ${className}`}
      viewBox="0 0 520 520"
      aria-hidden="true"
      focusable="false"
    >
      {RINGS.map((r, i) => (
        <circle key={r} cx="260" cy="260" r={r} style={{ opacity: 1 - i * 0.12 }} />
      ))}
      <line x1="260" y1="0" x2="260" y2="520" />
      <line x1="0" y1="260" x2="520" y2="260" />
      {ping && <circle className="sonar__ping" cx="260" cy="260" r="36" />}
      <circle className="sonar__core" cx="260" cy="260" r="5" />
    </svg>
  )
}
