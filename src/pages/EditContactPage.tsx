import { useNavigate, useParams } from 'react-router-dom'
import { ContactForm } from '../components/ContactForm'
import { useContacts } from '../state/contactsContext'
import { useToast } from '../state/toastContext'
import { NotFoundPane } from './NotFoundPane'
import './pages.css'

export function EditContactPage() {
  const { id } = useParams()
  const { status, contacts, updateContact } = useContacts()
  const notify = useToast()
  const navigate = useNavigate()
  const contact = contacts.find((c) => c.id === id)

  if (status === 'loading') {
    return (
      <div className="pane" role="status">
        <span className="visually-hidden">Cargando contacto…</span>
      </div>
    )
  }

  if (!contact) {
    return (
      <NotFoundPane
        title="No se puede editar este contacto"
        text="Puede que lo hayan eliminado o que el enlace esté incompleto."
      />
    )
  }

  return (
    <ContactForm
      key={contact.id}
      title="Editar contacto"
      submitLabel="Guardar cambios"
      savingLabel="Guardando…"
      cancelTo={`/contactos/${contact.id}`}
      initial={{
        name: contact.name,
        email: contact.email,
        phone: contact.phone,
        company: contact.company,
        role: contact.role,
        status: contact.status,
      }}
      takenEmails={contacts.filter((c) => c.id !== contact.id).map((c) => c.email.toLowerCase())}
      onSubmit={async (input) => {
        await updateContact(contact.id, input)
        notify('Cambios guardados')
        navigate(`/contactos/${contact.id}`)
      }}
    />
  )
}
