import { useNavigate } from 'react-router-dom'
import { ContactForm } from '../components/ContactForm'
import { useContacts } from '../state/contactsContext'
import { useToast } from '../state/toastContext'
import './pages.css'

export function NewContactPage() {
  const { contacts, createContact } = useContacts()
  const notify = useToast()
  const navigate = useNavigate()

  return (
    <ContactForm
      title="Nuevo contacto"
      submitLabel="Crear contacto"
      savingLabel="Creando…"
      cancelTo="/contactos"
      takenEmails={contacts.map((c) => c.email.toLowerCase())}
      onSubmit={async (input) => {
        const created = await createContact(input)
        notify(`Contacto creado: ${created.name}`)
        navigate(`/contactos/${created.id}`)
      }}
    />
  )
}
