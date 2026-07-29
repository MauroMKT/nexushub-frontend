import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { api } from "../api";
import Card from "../components/Card";

const TABS = ["invoices", "journal", "reports"];

export default function Accounting() {
  const { t } = useTranslation();
  const [tab, setTab] = useState("invoices");
  const [clients, setClients] = useState([]);
  const [accounts, setAccounts] = useState([]);

  useEffect(() => {
    api.listClients().then(setClients).catch(() => {});
    api.listAccounts().then(setAccounts).catch(() => {});
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">{t("accounting.title")}</h1>

      <div className="flex gap-2 mb-6">
        {TABS.map((tb) => (
          <button
            key={tb}
            onClick={() => setTab(tb)}
            className={`text-sm font-medium rounded-xl2 px-4 py-2 ${
              tab === tb ? "bg-primary text-ink" : "bg-white text-ink/60 hover:bg-secondary/30"
            }`}
          >
            {t(`accounting.tab_${tb}`)}
          </button>
        ))}
      </div>

      {tab === "invoices" && <InvoicesTab t={t} clients={clients} />}
      {tab === "journal" && <JournalTab t={t} accounts={accounts} />}
      {tab === "reports" && <ReportsTab t={t} />}
    </div>
  );
}

const emptyLine = { description: "", quantity: 1, unit_price: 0, vat_rate: 22 };

function InvoicesTab({ t, clients }) {
  const [invoices, setInvoices] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ client_id: "", issue_date: "", due_date: "", notes: "" });
  const [lines, setLines] = useState([{ ...emptyLine }]);
  const [error, setError] = useState("");

  function refresh() {
    api.listInvoices().then(setInvoices).catch(() => {});
  }
  useEffect(refresh, []);

  function clientName(id) {
    return clients.find((c) => c.id === id)?.name;
  }

  function updateLine(i, field, value) {
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, [field]: value } : l)));
  }

  const subtotal = lines.reduce((s, l) => s + (Number(l.quantity) || 0) * (Number(l.unit_price) || 0), 0);
  const vatTotal = lines.reduce((s, l) => s + (Number(l.quantity) || 0) * (Number(l.unit_price) || 0) * ((Number(l.vat_rate) || 0) / 100), 0);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      await api.createInvoice({
        client_id: form.client_id,
        issue_date: new Date(form.issue_date).toISOString(),
        due_date: form.due_date ? new Date(form.due_date).toISOString() : null,
        notes: form.notes || null,
        lines: lines.map((l) => ({ ...l, quantity: Number(l.quantity), unit_price: Number(l.unit_price), vat_rate: Number(l.vat_rate) })),
      });
      setForm({ client_id: "", issue_date: "", due_date: "", notes: "" });
      setLines([{ ...emptyLine }]);
      setShowForm(false);
      refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleIssue(id) {
    await api.issueInvoice(id);
    refresh();
  }
  async function handleMarkPaid(id) {
    await api.markInvoicePaid(id);
    refresh();
  }
  async function handleDelete(id) {
    if (!window.confirm(t("accounting.confirm_delete_invoice"))) return;
    await api.deleteInvoice(id);
    refresh();
  }

  const statusColor = { draft: "bg-slate-200", sent: "bg-accent/50", paid: "bg-secondary/60", overdue: "bg-red-200", cancelled: "bg-slate-100" };

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button onClick={() => setShowForm((s) => !s)} className="bg-primary hover:bg-primary/80 font-semibold rounded-xl2 px-4 py-2 text-sm">
          + {t("accounting.new_invoice")}
        </button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <form onSubmit={handleSubmit} className="space-y-3">
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-sm font-medium block mb-1">{t("clients.title")}</label>
                <select required value={form.client_id} onChange={(e) => setForm({ ...form, client_id: e.target.value })}
                        className="w-full border border-slate-200 rounded-xl2 px-3 py-2">
                  <option value="">-</option>
                  {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">{t("accounting.issue_date")}</label>
                <input type="date" required value={form.issue_date} onChange={(e) => setForm({ ...form, issue_date: e.target.value })}
                       className="w-full border border-slate-200 rounded-xl2 px-3 py-2" />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">{t("accounting.due_date")}</label>
                <input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                       className="w-full border border-slate-200 rounded-xl2 px-3 py-2" />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium block mb-1">{t("accounting.lines")}</label>
              <div className="space-y-2">
                {lines.map((l, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 items-center">
                    <input placeholder={t("accounting.line_description")} required value={l.description}
                           onChange={(e) => updateLine(i, "description", e.target.value)}
                           className="col-span-5 border border-slate-200 rounded-xl2 px-2 py-1.5 text-sm" />
                    <input type="number" min="0" step="0.01" placeholder={t("accounting.quantity")} value={l.quantity}
                           onChange={(e) => updateLine(i, "quantity", e.target.value)}
                           className="col-span-2 border border-slate-200 rounded-xl2 px-2 py-1.5 text-sm" />
                    <input type="number" min="0" step="0.01" placeholder={t("accounting.unit_price")} value={l.unit_price}
                           onChange={(e) => updateLine(i, "unit_price", e.target.value)}
                           className="col-span-2 border border-slate-200 rounded-xl2 px-2 py-1.5 text-sm" />
                    <input type="number" min="0" step="0.01" placeholder={t("accounting.vat_rate")} value={l.vat_rate}
                           onChange={(e) => updateLine(i, "vat_rate", e.target.value)}
                           className="col-span-2 border border-slate-200 rounded-xl2 px-2 py-1.5 text-sm" />
                    <button type="button" onClick={() => setLines((prev) => prev.filter((_, idx) => idx !== i))}
                            className="col-span-1 text-red-500 text-xs">✕</button>
                  </div>
                ))}
              </div>
              <button type="button" onClick={() => setLines((prev) => [...prev, { ...emptyLine }])}
                      className="text-xs text-primary hover:underline mt-2">
                + {t("accounting.add_line")}
              </button>
            </div>

            <div className="text-sm text-ink/70">
              {t("accounting.subtotal")}: {subtotal.toFixed(2)} € · {t("accounting.vat_amount")}: {vatTotal.toFixed(2)} € ·{" "}
              <span className="font-semibold">{t("accounting.total")}: {(subtotal + vatTotal).toFixed(2)} €</span>
            </div>

            <div>
              <label className="text-sm font-medium block mb-1">{t("accounting.notes")}</label>
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                        className="w-full border border-slate-200 rounded-xl2 px-3 py-2 text-sm" rows={2} />
            </div>

            <button type="submit" className="bg-secondary hover:bg-secondary/80 font-semibold rounded-xl2 px-4 py-2 text-sm">
              {t("accounting.save_draft")}
            </button>
          </form>
        </Card>
      )}

      <div className="space-y-2">
        {invoices.length === 0 && <p className="text-sm text-ink/50">{t("accounting.no_invoices")}</p>}
        {invoices.map((inv) => (
          <Card key={inv.id} className="flex items-center justify-between gap-3 flex-wrap">
            <div className="min-w-0">
              <div className="font-medium flex items-center gap-2 flex-wrap">
                {inv.number || t("accounting.draft_badge")}
                <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor[inv.status] || "bg-slate-200"}`}>
                  {t(`accounting.status_${inv.status}`)}
                </span>
              </div>
              <div className="text-sm text-ink/60">
                {clientName(inv.client_id) || inv.client_name} · {new Date(inv.issue_date).toLocaleDateString()} · {inv.total.toFixed(2)} €
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              {inv.status === "draft" && (
                <>
                  <button onClick={() => handleIssue(inv.id)} className="text-xs bg-primary hover:bg-primary/80 rounded-xl2 px-2 py-1">
                    {t("accounting.issue")}
                  </button>
                  <button onClick={() => handleDelete(inv.id)} className="text-xs text-red-500 hover:underline">
                    {t("common.cancel")}
                  </button>
                </>
              )}
              {(inv.status === "sent" || inv.status === "overdue") && (
                <button onClick={() => handleMarkPaid(inv.id)} className="text-xs bg-secondary hover:bg-secondary/80 rounded-xl2 px-2 py-1">
                  {t("accounting.mark_paid")}
                </button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

const emptyJournalLine = { account_id: "", debit: 0, credit: 0, description: "" };

function JournalTab({ t, accounts }) {
  const [entries, setEntries] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [entryDate, setEntryDate] = useState("");
  const [description, setDescription] = useState("");
  const [lines, setLines] = useState([{ ...emptyJournalLine }, { ...emptyJournalLine }]);
  const [error, setError] = useState("");

  function refresh() {
    api.listJournalEntries().then(setEntries).catch(() => {});
  }
  useEffect(refresh, []);

  function updateLine(i, field, value) {
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, [field]: value } : l)));
  }

  const totalDebit = lines.reduce((s, l) => s + (Number(l.debit) || 0), 0);
  const totalCredit = lines.reduce((s, l) => s + (Number(l.credit) || 0), 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      await api.createJournalEntry({
        entry_date: new Date(entryDate).toISOString(),
        description,
        lines: lines.filter((l) => l.account_id).map((l) => ({ ...l, debit: Number(l.debit) || 0, credit: Number(l.credit) || 0 })),
      });
      setEntryDate("");
      setDescription("");
      setLines([{ ...emptyJournalLine }, { ...emptyJournalLine }]);
      setShowForm(false);
      refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button onClick={() => setShowForm((s) => !s)} className="bg-primary hover:bg-primary/80 font-semibold rounded-xl2 px-4 py-2 text-sm">
          + {t("accounting.new_journal_entry")}
        </button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <form onSubmit={handleSubmit} className="space-y-3">
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium block mb-1">{t("accounting.entry_date")}</label>
                <input type="date" required value={entryDate} onChange={(e) => setEntryDate(e.target.value)}
                       className="w-full border border-slate-200 rounded-xl2 px-3 py-2" />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">{t("accounting.line_description")}</label>
                <input required value={description} onChange={(e) => setDescription(e.target.value)}
                       className="w-full border border-slate-200 rounded-xl2 px-3 py-2" />
              </div>
            </div>

            <div className="space-y-2">
              {lines.map((l, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center">
                  <select value={l.account_id} onChange={(e) => updateLine(i, "account_id", e.target.value)}
                          className="col-span-5 border border-slate-200 rounded-xl2 px-2 py-1.5 text-sm">
                    <option value="">-</option>
                    {accounts.map((a) => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}
                  </select>
                  <input type="number" min="0" step="0.01" placeholder={t("accounting.debit")} value={l.debit}
                         onChange={(e) => updateLine(i, "debit", e.target.value)}
                         className="col-span-2 border border-slate-200 rounded-xl2 px-2 py-1.5 text-sm" />
                  <input type="number" min="0" step="0.01" placeholder={t("accounting.credit")} value={l.credit}
                         onChange={(e) => updateLine(i, "credit", e.target.value)}
                         className="col-span-2 border border-slate-200 rounded-xl2 px-2 py-1.5 text-sm" />
                  <input placeholder={t("accounting.line_description")} value={l.description}
                         onChange={(e) => updateLine(i, "description", e.target.value)}
                         className="col-span-2 border border-slate-200 rounded-xl2 px-2 py-1.5 text-sm" />
                  <button type="button" onClick={() => setLines((prev) => prev.filter((_, idx) => idx !== i))}
                          className="col-span-1 text-red-500 text-xs">✕</button>
                </div>
              ))}
            </div>
            <button type="button" onClick={() => setLines((prev) => [...prev, { ...emptyJournalLine }])}
                    className="text-xs text-primary hover:underline">
              + {t("accounting.add_line")}
            </button>

            <div className={`text-sm ${isBalanced ? "text-green-600" : "text-red-500"}`}>
              {t("accounting.debit")}: {totalDebit.toFixed(2)} · {t("accounting.credit")}: {totalCredit.toFixed(2)}{" "}
              {isBalanced ? `✓ ${t("accounting.balanced")}` : `✕ ${t("accounting.not_balanced")}`}
            </div>

            <button type="submit" disabled={!isBalanced} className="bg-secondary hover:bg-secondary/80 disabled:opacity-40 font-semibold rounded-xl2 px-4 py-2 text-sm">
              {t("accounting.save")}
            </button>
          </form>
        </Card>
      )}

      <div className="space-y-2">
        {entries.length === 0 && <p className="text-sm text-ink/50">{t("accounting.no_entries")}</p>}
        {entries.map((e) => (
          <Card key={e.id}>
            <div className="flex items-center justify-between mb-2">
              <div className="font-medium">{e.description}</div>
              <div className="text-xs text-ink/50">{new Date(e.entry_date).toLocaleDateString()}</div>
            </div>
            <table className="w-full text-xs">
              <tbody>
                {e.lines.map((l) => (
                  <tr key={l.id} className="border-t border-slate-100">
                    <td className="py-1">{l.account_name}</td>
                    <td className="py-1 text-right w-20">{l.debit > 0 ? l.debit.toFixed(2) : ""}</td>
                    <td className="py-1 text-right w-20">{l.credit > 0 ? l.credit.toFixed(2) : ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        ))}
      </div>
    </div>
  );
}

function ReportsTab({ t }) {
  const [asOf, setAsOf] = useState(new Date().toISOString().slice(0, 10));
  const [balanceSheet, setBalanceSheet] = useState(null);
  const [start, setStart] = useState(`${new Date().getFullYear()}-01-01`);
  const [end, setEnd] = useState(new Date().toISOString().slice(0, 10));
  const [incomeStatement, setIncomeStatement] = useState(null);

  function loadBalanceSheet() {
    api.getBalanceSheet(new Date(asOf).toISOString()).then(setBalanceSheet).catch(() => {});
  }
  function loadIncomeStatement() {
    api.getIncomeStatement(new Date(start).toISOString(), new Date(end).toISOString()).then(setIncomeStatement).catch(() => {});
  }
  useEffect(() => { loadBalanceSheet(); loadIncomeStatement(); }, []);

  function renderSection(section) {
    return (
      <div className="mb-3">
        <div className="text-xs font-semibold text-ink/50 uppercase mb-1">{t(`accounting.type_${section.account_type}`)}</div>
        {section.accounts.map((a, i) => (
          <div key={i} className="flex justify-between text-sm py-0.5">
            <span>{a.code} - {a.name}</span>
            <span>{a.balance.toFixed(2)} €</span>
          </div>
        ))}
        <div className="flex justify-between text-sm font-semibold border-t border-slate-100 pt-1 mt-1">
          <span>{t("accounting.subtotal")}</span>
          <span>{section.total.toFixed(2)} €</span>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <h2 className="font-semibold mb-3">{t("accounting.balance_sheet")}</h2>
        <div className="flex gap-2 mb-3">
          <input type="date" value={asOf} onChange={(e) => setAsOf(e.target.value)}
                 className="border border-slate-200 rounded-xl2 px-2 py-1 text-sm" />
          <button onClick={loadBalanceSheet} className="text-xs bg-secondary hover:bg-secondary/80 rounded-xl2 px-3 py-1.5">
            {t("accounting.refresh")}
          </button>
        </div>
        {balanceSheet && (
          <>
            {renderSection(balanceSheet.assets)}
            {renderSection(balanceSheet.liabilities)}
            {renderSection(balanceSheet.equity)}
            <div className={`text-sm font-semibold ${balanceSheet.balanced ? "text-green-600" : "text-red-500"}`}>
              {balanceSheet.balanced ? `✓ ${t("accounting.balanced")}` : `✕ ${t("accounting.not_balanced")}`}
            </div>
          </>
        )}
      </Card>

      <Card>
        <h2 className="font-semibold mb-3">{t("accounting.income_statement")}</h2>
        <div className="flex gap-2 mb-3 flex-wrap">
          <input type="date" value={start} onChange={(e) => setStart(e.target.value)}
                 className="border border-slate-200 rounded-xl2 px-2 py-1 text-sm" />
          <input type="date" value={end} onChange={(e) => setEnd(e.target.value)}
                 className="border border-slate-200 rounded-xl2 px-2 py-1 text-sm" />
          <button onClick={loadIncomeStatement} className="text-xs bg-secondary hover:bg-secondary/80 rounded-xl2 px-3 py-1.5">
            {t("accounting.refresh")}
          </button>
        </div>
        {incomeStatement && (
          <>
            {renderSection(incomeStatement.revenue)}
            {renderSection(incomeStatement.expenses)}
            <div className="text-sm font-semibold">
              {t("accounting.net_income")}: {incomeStatement.net_income.toFixed(2)} €
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
