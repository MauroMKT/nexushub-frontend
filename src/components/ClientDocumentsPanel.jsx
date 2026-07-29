import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { downloadBase64File, fileToBase64 } from "../utils/downloadBase64";

const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB, coerente con il limite lato backend

/**
 * Pannello documenti riutilizzabile per la scheda cliente: usato sia lato team
 * (upload + elenco + download + elimina) sia lato portale clienti (sola lettura,
 * passare `readOnly`). `listDocuments`/`uploadDocument`/`downloadDocument`/
 * `deleteDocument` incapsulano la differenza fra i due contesti (team vs portale).
 */
export default function ClientDocumentsPanel({ listDocuments, uploadDocument, downloadDocument, deleteDocument, readOnly = false }) {
  const { t } = useTranslation();
  const [docs, setDocs] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  function refresh() {
    listDocuments().then(setDocs).catch(() => {});
  }

  useEffect(refresh, []);

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > MAX_SIZE_BYTES) {
      setError(t("documents.too_large"));
      return;
    }
    setError("");
    setUploading(true);
    try {
      const content_base64 = await fileToBase64(file);
      await uploadDocument({ filename: file.name, content_type: file.type, content_base64 });
      refresh();
    } finally {
      setUploading(false);
    }
  }

  async function handleDownload(doc) {
    const full = await downloadDocument(doc.id);
    downloadBase64File(full.filename, full.content_type, full.content_base64);
  }

  async function handleDelete(doc) {
    if (!window.confirm(t("documents.confirm_delete"))) return;
    await deleteDocument(doc.id);
    refresh();
  }

  return (
    <div>
      {!readOnly && (
        <label className="inline-block text-xs bg-secondary/60 hover:bg-secondary rounded-xl2 px-3 py-1.5 cursor-pointer mb-2">
          {uploading ? t("documents.uploading") : `📎 ${t("documents.upload")}`}
          <input type="file" className="hidden" onChange={handleFileChange} disabled={uploading} />
        </label>
      )}
      {error && <p className="text-xs text-red-500 mb-2">{error}</p>}
      {docs.length === 0 && <p className="text-xs text-ink/40">{t("documents.empty")}</p>}
      <ul className="divide-y divide-slate-100">
        {docs.map((doc) => (
          <li key={doc.id} className="py-1.5 flex items-center justify-between gap-2 text-sm">
            <div className="min-w-0">
              <div className="truncate font-medium">📄 {doc.filename}</div>
              <div className="text-xs text-ink/40">
                {doc.uploaded_by_name && t("documents.uploaded_by", { name: doc.uploaded_by_name })}
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <button onClick={() => handleDownload(doc)} className="text-xs text-primary hover:underline">
                {t("documents.download")}
              </button>
              {!readOnly && (
                <button onClick={() => handleDelete(doc)} className="text-xs text-red-500 hover:underline">
                  {t("documents.delete")}
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
