import { api } from "../api";
import ImportModal from "./ImportModal";

// Configurazione dell'import Clienti sopra al modale generico (Fase 9.5:
// prima questo file conteneva tutta la logica, ora condivisa con la Rubrica
// tramite ImportModal.jsx — vedi ImportContactsModal.jsx per il gemello).
const CLIENT_COLUMNS = [
  { key: "name", labelKey: "clients.name" },
  { key: "company", labelKey: "clients.company" },
  { key: "email", labelKey: "clients.email" },
  { key: "phone", labelKey: "clients.phone" },
  { key: "sector", labelKey: "clients.sector" },
];

export default function ImportClientsModal({ onClose, onImported }) {
  return (
    <ImportModal
      onClose={onClose}
      onImported={onImported}
      titleKey="import.title"
      duplicateUpdateLabelKey="import.duplicate_update"
      columns={CLIENT_COLUMNS}
      previewFn={api.previewClientImport}
      commitFn={api.commitClientImport}
    />
  );
}
