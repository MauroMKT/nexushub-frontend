import { useState } from "react";
import { useTranslation } from "react-i18next";

import { api } from "../api";

function detectFormat(filename) {
  const ext = (filename.split(".").pop() || "").toLowerCase();
  if (ext === "json") return "json";
  if (ext === "xml") return "xml";
  return "csv";
}

/**
 * Modale per l'importazione clienti da CSV/JSON/XML: due step (anteprima poi
 * conferma), coerente con l'endpoint backend che non scrive mai in DB senza
 * un'anteprima esplicita passata prima dall'utente.
 */
export default function ImportClientsModal({ onClose, onImported }) {
  const { t } = useTranslation();
  const [file, setFile] = useState(null);
  const [format, setFormat] = useState("csv");
  const [content, setContent] = useState("");
  const [duplicateStrategy, setDuplicateStrategy] = useState("skip");
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleFileChange(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setFormat(detectFormat(f.name));
    setPreview(null);
    setResult(null);
    setError("");
    const text = await f.text();
    setContent(text);
  }

  async function handlePreview() {
    if (!content.trim()) return;
    setBusy(true);
    setError("");
    try {
      const p = await api.previewClientImport({ format, content });
      setPreview(p);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleCommit() {
    setBusy(true);
    setError("");
    try {
      const r = await api.commitClientImport({ format, content, duplicate_strategy: duplicateStrategy });
      setResult(r);
      onImported?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl2 shadow-lg max-w-2xl w-full max-h-[85vh] overflow-y-auto p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">{t("import.title")}</h2>
          <button onClick={onClose} className="text-ink/50 hover:text-ink text-sm">✕</button>
        </div>

        {!result && (
          <>
            <label className="text-sm font-medium block mb-1">{t("import.select_file")}</label>
            <input type="file" accept=".csv,.json,.xml" onChange={handleFileChange}
                   className="w-full text-sm border border-slate-200 rounded-xl2 px-3 py-2 mb-3" />

            {file && (
              <>
                <div className="text-xs text-ink/50 mb-3">
                  {t("import.format_label")}: <span className="font-semibold uppercase">{format}</span>
                </div>

                <label className="text-sm font-medium block mb-1">{t("import.duplicate_strategy_label")}</label>
                <select value={duplicateStrategy} onChange={(e) => setDuplicateStrategy(e.target.value)}
                        className="w-full text-sm border border-slate-200 rounded-xl2 px-3 py-2 mb-3">
                  <option value="skip">{t("import.duplicate_skip")}</option>
                  <option value="update">{t("import.duplicate_update")}</option>
                </select>

                <button onClick={handlePreview} disabled={busy}
                        className="bg-secondary hover:bg-secondary/80 font-semibold rounded-xl2 px-4 py-2 text-sm mb-4">
                  {t("import.preview_button")}
                </button>
              </>
            )}

            {error && <p className="text-sm text-red-500 mb-3">{error}</p>}

            {preview && (
              <div className="mb-4">
                <h3 className="font-semibold text-sm mb-2">{t("import.preview_title")}</h3>
                <p className="text-xs text-ink/60 mb-2">
                  {t("import.total_rows")}: {preview.total_rows} · {t("import.valid_rows")}: {preview.valid_rows}
                </p>
                {preview.errors.length > 0 && (
                  <div className="mb-2">
                    <p className="text-xs font-semibold text-red-500">{t("import.errors_title")}</p>
                    <ul className="text-xs text-red-500 list-disc list-inside">
                      {preview.errors.map((e, i) => <li key={i}>{e}</li>)}
                    </ul>
                  </div>
                )}
                {preview.preview.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-left text-ink/50">
                          <th className="pr-2">Nome</th><th className="pr-2">Azienda</th>
                          <th className="pr-2">Email</th><th className="pr-2">Telefono</th><th>Settore</th>
                        </tr>
                      </thead>
                      <tbody>
                        {preview.preview.map((row, i) => (
                          <tr key={i} className="border-t border-slate-100">
                            <td className="pr-2 py-1">{row.name}</td>
                            <td className="pr-2 py-1">{row.company}</td>
                            <td className="pr-2 py-1">{row.email}</td>
                            <td className="pr-2 py-1">{row.phone}</td>
                            <td className="py-1">{row.sector}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {preview.valid_rows > 0 && (
                  <button onClick={handleCommit} disabled={busy}
                          className="mt-3 bg-primary hover:bg-primary/80 font-semibold rounded-xl2 px-4 py-2 text-sm">
                    {t("import.commit_button")}
                  </button>
                )}
              </div>
            )}
          </>
        )}

        {result && (
          <div>
            <h3 className="font-semibold text-sm mb-2">{t("import.result_title")}</h3>
            <p className="text-sm mb-2">
              {t("import.created")}: {result.created} · {t("import.updated")}: {result.updated} · {t("import.skipped")}: {result.skipped}
            </p>
            {result.errors.length > 0 && (
              <ul className="text-xs text-red-500 list-disc list-inside mb-2">
                {result.errors.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            )}
            <button onClick={onClose} className="bg-secondary hover:bg-secondary/80 font-semibold rounded-xl2 px-4 py-2 text-sm">
              {t("import.close")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
