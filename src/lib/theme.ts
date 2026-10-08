import { useCallback, useEffect, useState } from 'react'

export type Theme = 'light' | 'dark'

/** Debe coincidir con el script en línea de index.html que aplica el tema antes de pintar. */
export const THEME_KEY = 'cachalot.tema'

function currentTheme(): Theme {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(currentTheme)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  const toggle = useCallback(() => {
    setTheme((current) => {
      const next = current === 'dark' ? 'light' : 'dark'
      try {
        localStorage.setItem(THEME_KEY, next)
      } catch {
        // Sin acceso a localStorage el tema solo dura la sesión.
      }
      return next
    })
  }, [])

  return { theme, toggle }
}
