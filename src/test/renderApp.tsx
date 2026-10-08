import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { AppRoutes } from '../App'
import { createContactsApi, createMemoryStorage, type SimulationMode } from '../api/contactsApi'
import { ContactsProvider } from '../state/ContactsProvider'
import { ToastProvider } from '../state/ToastProvider'
import type { Contact } from '../types'

interface Options {
  route?: string
  mode?: SimulationMode
  initialData?: Contact[]
}

export function renderApp({ route = '/', mode = 'normal', initialData }: Options = {}) {
  const api = createContactsApi({
    storage: createMemoryStorage(),
    delayMs: 0,
    mode,
    ...(initialData && { initialData }),
  })
  const user = userEvent.setup()
  const utils = render(
    <ContactsProvider api={api}>
      <ToastProvider>
        <MemoryRouter initialEntries={[route]}>
          <AppRoutes />
        </MemoryRouter>
      </ToastProvider>
    </ContactsProvider>,
  )
  return { user, api, ...utils }
}
