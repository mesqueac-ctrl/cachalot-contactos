import { useEffect } from 'react'

const APP = 'Cachalot'

/** Título de la pestaña por vista, para el historial del navegador y los lectores de pantalla. */
export function useDocumentTitle(title: string | null) {
  useEffect(() => {
    document.title = title ? `${title} · ${APP}` : APP
  }, [title])
}
