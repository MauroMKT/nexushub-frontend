import { api } from "../api";
import ImportModal from "./ImportModal";

// Configurazione dell'import Rubrica (Fase 9.5) sopra al modale generico:
// prima la Rubrica poteva solo convertire i clienti già presenti nel CRM in
// contatti (vedi "Importa dai clienti" in Contacts.jsx), non c'era un vero
// import da file CSV/JSON/XML come per i Clienti.
const CONTACT_COLUMNS = [
  { key: "full_name", labelKey: "contacts.full_name" },
  { key: "company", labelKey: "contacts.company" },
  { key: "email", labelKey: "contacts.email" },
  { key: "phone", labelKey: "contacts.phone" },
  { key: "mobile", labelKey: "contacts.mobile" },
  { key: "whatsapp", labelKey: "contacts.whatsapp" },
  { key: "category", labelKey: "contacts.category" },
];

export default function ImportContactsModal({ onClose, onImported }) {
  return (
    <ImportModal
      onClose={onClose}
      onImported={onImported}
      titleKey="import.title_contacts"
      duplicateUpdateLabelKey="import.duplicate_update_contact"
      columns={CONTACT_COLUMNS}
      previewFn={api.previewContactImport}
      commitFn={api.commitContactImport}
    />
  );
}
