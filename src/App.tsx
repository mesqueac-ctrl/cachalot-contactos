import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { createBrowserApi } from './api/contactsApi'
import { AppLayout } from './components/AppLayout'
import { ContactDetail } from './pages/ContactDetail'
import { ContactsPage } from './pages/ContactsPage'
import { HomePage } from './pages/HomePage'
import { EditContactPage } from './pages/EditContactPage'
import { NewContactPage } from './pages/NewContactPage'
import { NotFoundPane } from './pages/NotFoundPane'
import { ContactsProvider } from './state/ContactsProvider'
import { ToastProvider } from './state/ToastProvider'
import './styles/components.css'
import './styles/cards.css'

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<HomePage />} />
        <Route path="contactos" element={<ContactsPage />} />
        <Route path="agenda" element={<Navigate to="/" replace />} />
        <Route path="resumen" element={<Navigate to="/" replace />} />
        <Route path="contactos/nuevo" element={<NewContactPage />} />
        <Route path="contactos/:id" element={<ContactDetail />} />
        <Route path="contactos/:id/editar" element={<EditContactPage />} />
        <Route path="*" element={<NotFoundPane />} />
      </Route>
    </Routes>
  )
}

const api = createBrowserApi()

export default function App() {
  return (
    <ContactsProvider api={api}>
      <ToastProvider>
        <HashRouter>
          <AppRoutes />
        </HashRouter>
      </ToastProvider>
    </ContactsProvider>
  )
}
