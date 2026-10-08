import { HashRouter, Route, Routes } from 'react-router-dom'
import { createBrowserApi } from './api/contactsApi'
import { AppLayout } from './components/AppLayout'
import { NotFoundPane } from './pages/NotFoundPane'
import { WelcomePane } from './pages/WelcomePane'
import { ContactsProvider } from './state/ContactsProvider'
import { ToastProvider } from './state/ToastProvider'
import './styles/components.css'

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<WelcomePane />} />
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
