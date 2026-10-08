import { HashRouter, Route, Routes } from 'react-router-dom'
import { createBrowserApi } from './api/contactsApi'
import { AppLayout } from './components/AppLayout'
import { ContactDetail } from './pages/ContactDetail'
import { EditContactPage } from './pages/EditContactPage'
import { NewContactPage } from './pages/NewContactPage'
import { NotFoundPane } from './pages/NotFoundPane'
import { OverviewPane } from './pages/OverviewPane'
import { ContactsProvider } from './state/ContactsProvider'
import { ToastProvider } from './state/ToastProvider'
import './styles/components.css'

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<OverviewPane />} />
        <Route path="resumen" element={<OverviewPane />} />
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
