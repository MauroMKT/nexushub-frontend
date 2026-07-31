import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { api, clearToken, clearViewTenantId } from "../api";
import Card from "../components/Card";
import LanguageFlagSelect, { findLanguageOption } from "../components/LanguageFlagSelect";
import { useAuth } from "../context/AuthContext";
import { changeLanguage } from "../i18n";
import { applyTenantTheme } from "../theme";

export default function Settings() {
  const { t } = useTranslation();
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [tenant, setTenant] = useState(null);
  const [team, setTeam] = useState([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [invitePassword, setInvitePassword] = useState("");
  const [gcalStatus, setGcalStatus] = useState(null);

  const [langVariant, setLangVariant] = useState(
    localStorage.getItem("nexushub_lang_variant") || findLanguageOption(localStorage.getItem("nexushub_lang")).variant
  );
  const [profileForm, setProfileForm] = useState({ full_name: "" });
  const [pwForm, setPwForm] = useState({ current_password: "", new_password: "" });
  const [profileMsg, setProfileMsg] = useState(null);
  const [pwMsg, setPwMsg] = useState(null);
  const [companyForm, setCompanyForm] = useState(null);
  const [companyMsg, setCompanyMsg] = useState(null);
  const [billingStatus, setBillingStatus] = useState(null);
  const [billingPlans, setBillingPlans] = useState([]);
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [billingMsg, setBillingMsg] = useState(null);
  const [billingBusy, setBillingBusy] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteMsg, setDeleteMsg] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  function refresh() {
    api.getTenantSettings().then((tn) => { setTenant(tn); setCompanyForm(tn); }).catch(() => {});
    api.listTeam().then(setTeam).catch(() => {});
    api.googleCalendarStatus().then(setGcalStatus).catch(() => {});
    api.billingStatus().then(setBillingStatus).catch(() => {});
    api.billingPlans().then(setBillingPlans).catch(() => {});
  }

  useEffect(refresh, []);
  useEffect(() => {
    if (user) setProfileForm({ full_name: user.full_name || "" });
  }, [user]);

  async function handleLanguageChange(opt) {
    changeLanguage(opt.i18nCode);
    localStorage.setItem("nexushub_lang_variant", opt.variant);
    setLangVariant(opt.variant);
    try {
      const updated = await api.updateMe({ language: opt.i18nCode });
      if (setUser) setUser(updated);
    } catch (e) { /* la lingua dell'interfaccia resta comunque cambiata lato client */ }
  }

  async function handleProfileSave(e) {
    e.preventDefault();
    setProfileMsg(null);
    const updated = await api.updateMe({ full_name: profileForm.full_name });
    if (setUser) setUser(updated);
    setProfileMsg(t("settings.profile_updated"));
  }

  async function handlePasswordChange(e) {
    e.preventDefault();
    setPwMsg(null);
    await api.updateMe({ current_password: pwForm.current_password, new_password: pwForm.new_password });
    setPwForm({ current_password: "", new_password: "" });
    setPwMsg(t("settings.password_updated"));
  }

  async function handleUpgrade(planId) {
    setBillingMsg(null);
    setBillingBusy(true);
    try {
      const res = await api.billingCheckout(planId, billingCycle);
      window.location.href = res.checkout_url;
    } catch (e) {
      setBillingMsg(e.message);
    } finally {
      setBillingBusy(false);
    }
  }

  async function handleManageBilling() {
    setBillingMsg(null);
    try {
      const res = await api.billingPortal();
      window.location.href = res.portal_url;
    } catch (e) {
      setBillingMsg(e.message);
    }
  }

  async function handleCompanySave(e) {
    e.preventDefault();
    setCompanyMsg(null);
    const { id, slug, plan, primary_color, secondary_color, accent_color, account_type, vat_country_code, ...editable } = companyForm;
    const saved = await api.updateTenantSettings(editable);
    setTenant(saved);
    setCompanyForm(saved);
    setCompanyMsg(t("settings.data_updated"));
  }

  async function handleColorChange(field, value) {
    const updated = { ...tenant, [field]: value };
    setTenant(updated);
    applyTenantTheme(updated); // anteprima live mentre si sceglie il colore
  }

  async function saveColors() {
    const saved = await api.updateTenantSettings({
      primary_color: tenant.primary_color,
      secondary_color: tenant.secondary_color,
      accent_color: tenant.accent_color,
    });
    setTenant(saved);
    applyTenantTheme(saved);
  }

  async function handleNotifPref(field, value) {
    await api.updateNotificationPreferences({ [field]: value });
  }

  async function handleGoogleConnect() {
    const { auth_url } = await api.googleCalendarAuthUrl();
    window.location.href = auth_url;
  }

  async function handleGoogleSync() {
    const res = await api.googleCalendarSync();
    alert(t("settings.google_calendar_sync_result", { synced: res.synced, total: res.total }));
  }

  async function handleInvite(e) {
    e.preventDefault();
    await api.inviteTeamMember({
      email: inviteEmail, full_name: inviteName, password: invitePassword, role: "member",
    });
    setInviteEmail(""); setInviteName(""); setInvitePassword("");
    refresh();
  }

  // Cancellazione definitiva del proprio account/azienda: azione irreversibile,
  // riservata all'admin del tenant, protetta da conferma testuale + password.
  async function handleDeleteAccount(e) {
    e.preventDefault();
    setDeleteMsg(null);
    if (deleteConfirmText.trim() !== "ELIMINA") {
      setDeleteMsg(t("settings.danger_zone_confirm_text_error"));
      return;
    }
    setDeleteBusy(true);
    try {
      await api.deleteOwnTenant(deletePassword);
      clearToken();
      clearViewTenantId();
      navigate("/login");
    } catch (e2) {
      setDeleteMsg(e2.message);
      setDeleteBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t("settings.title")}</h1>

      <Card>
        <h2 className="font-semibold mb-3">{tenant?.name}</h2>
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium">{t("settings.language")}</label>
          <LanguageFlagSelect value={langVariant} onChange={handleLanguageChange} />
        </div>
        <p className="text-xs text-ink/50 mt-2">
          Piano attuale: <span className="font-medium capitalize">{tenant?.plan}</span> · Settore: {tenant?.sector || "-"}
          {" · "}
          <button onClick={() => navigate("/modules")} className="underline hover:text-ink">
            {t("settings.manage_modules_link")}
          </button>
        </p>
      </Card>

      <Card>
        <h2 className="font-semibold mb-3">{t("settings.profile_title")}</h2>
        <form onSubmit={handleProfileSave} className="flex flex-wrap items-end gap-3 mb-4">
          <div>
            <label className="text-sm font-medium block mb-1">{t("settings.full_name")}</label>
            <input
              value={profileForm.full_name}
              onChange={(e) => setProfileForm({ full_name: e.target.value })}
              className="border border-slate-200 rounded-xl2 px-3 py-2 text-sm"
            />
          </div>
          <button type="submit" className="bg-primary hover:bg-primary/80 text-ink font-semibold rounded-xl2 px-4 py-2 text-sm">
            {t("settings.save")}
          </button>
          {profileMsg && <span className="text-xs text-ink/60 self-center">{profileMsg}</span>}
        </form>

        <form onSubmit={handlePasswordChange} className="flex flex-wrap items-end gap-3">
          <div>
            <label className="text-sm font-medium block mb-1">{t("settings.current_password")}</label>
            <input
              type="password" required
              value={pwForm.current_password}
              onChange={(e) => setPwForm((f) => ({ ...f, current_password: e.target.value }))}
              className="border border-slate-200 rounded-xl2 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">{t("settings.new_password")}</label>
            <input
              type="password" required minLength={6}
              value={pwForm.new_password}
              onChange={(e) => setPwForm((f) => ({ ...f, new_password: e.target.value }))}
              className="border border-slate-200 rounded-xl2 px-3 py-2 text-sm"
            />
          </div>
          <button type="submit" className="bg-secondary hover:bg-secondary/80 text-ink font-semibold rounded-xl2 px-4 py-2 text-sm">
            {t("settings.change_password")}
          </button>
          {pwMsg && <span className="text-xs text-ink/60 self-center">{pwMsg}</span>}
        </form>
      </Card>

      {companyForm && (
        <Card>
          <h2 className="font-semibold mb-3">
            {companyForm.account_type === "azienda" ? t("settings.company_data_title") : t("settings.individual_data_title")}
          </h2>
          <form onSubmit={handleCompanySave} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <TextField label={t("register.legal_name")} value={companyForm.name}
                         onChange={(v) => setCompanyForm((f) => ({ ...f, name: v }))} />
              {companyForm.account_type === "azienda" && (
                <TextField label={t("register.company_type")} value={companyForm.company_type}
                           onChange={(v) => setCompanyForm((f) => ({ ...f, company_type: v }))} />
              )}
            </div>

            {companyForm.account_type === "azienda" && (
              <>
                <TextField label={t("register.trade_name")} value={companyForm.trade_name}
                           onChange={(v) => setCompanyForm((f) => ({ ...f, trade_name: v }))} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <TextField label={t("register.vat_number")} value={companyForm.vat_number}
                             onChange={(v) => setCompanyForm((f) => ({ ...f, vat_number: v }))} />
                  {companyForm.vat_country_code === "IT" && (
                    <TextField label={t("register.pec")} value={companyForm.pec}
                               onChange={(v) => setCompanyForm((f) => ({ ...f, pec: v }))} />
                  )}
                </div>
                <TextField label={t("register.sector")} value={companyForm.sector}
                           onChange={(v) => setCompanyForm((f) => ({ ...f, sector: v }))} />
              </>
            )}

            <TextField label={t("register.address")} value={companyForm.address}
                       onChange={(v) => setCompanyForm((f) => ({ ...f, address: v }))} />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <TextField label={t("register.zip_code")} value={companyForm.zip_code}
                         onChange={(v) => setCompanyForm((f) => ({ ...f, zip_code: v }))} />
              <TextField label={t("register.country")} value={companyForm.country}
                         onChange={(v) => setCompanyForm((f) => ({ ...f, country: v }))} />
              <TextField label={companyForm.account_type === "azienda" ? t("register.company_phone") : t("register.individual_phone")}
                         value={companyForm.phone}
                         onChange={(v) => setCompanyForm((f) => ({ ...f, phone: v }))} />
            </div>
            <TextField label={companyForm.account_type === "azienda" ? t("register.company_email") : t("register.individual_email")}
                       type="email" value={companyForm.email}
                       onChange={(v) => setCompanyForm((f) => ({ ...f, email: v }))} />

            {companyForm.account_type === "azienda" && (
              <fieldset className="border border-slate-200 rounded-xl2 p-3">
                <legend className="text-sm font-semibold px-1">{t("register.contact_section_title")}</legend>
                <div className="space-y-3">
                  <TextField label={t("register.contact_full_name")} value={companyForm.contact_full_name}
                             onChange={(v) => setCompanyForm((f) => ({ ...f, contact_full_name: v }))} />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <TextField label={t("register.contact_phone")} value={companyForm.contact_phone}
                               onChange={(v) => setCompanyForm((f) => ({ ...f, contact_phone: v }))} />
                    <TextField label={t("register.contact_email")} type="email" value={companyForm.contact_email}
                               onChange={(v) => setCompanyForm((f) => ({ ...f, contact_email: v }))} />
                  </div>
                </div>
              </fieldset>
            )}

            <div className="flex items-center gap-3">
              <button type="submit" className="bg-primary hover:bg-primary/80 text-ink font-semibold rounded-xl2 px-4 py-2 text-sm">
                {t("settings.save")}
              </button>
              {companyMsg && <span className="text-xs text-ink/60">{companyMsg}</span>}
            </div>
          </form>
        </Card>
      )}

      <Card>
        <h2 className="font-semibold mb-3">{t("settings.team")}</h2>
        <ul className="divide-y divide-slate-100 mb-4">
          {team.map((m) => (
            <li key={m.id} className="py-2 flex justify-between text-sm">
              <span>{m.full_name} <span className="text-ink/40">({m.email})</span></span>
              <span className="capitalize text-ink/60">{m.role}</span>
            </li>
          ))}
        </ul>
        {user?.role === "admin" && (
          <form onSubmit={handleInvite} className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input placeholder="Nome" required value={inviteName} onChange={(e) => setInviteName(e.target.value)}
                   className="border border-slate-200 rounded-xl2 px-3 py-2 text-sm" />
            <input placeholder="Email" type="email" required value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)}
                   className="border border-slate-200 rounded-xl2 px-3 py-2 text-sm" />
            <input placeholder="Password" type="password" required value={invitePassword} onChange={(e) => setInvitePassword(e.target.value)}
                   className="border border-slate-200 rounded-xl2 px-3 py-2 text-sm" />
            <button type="submit" className="sm:col-span-3 bg-secondary hover:bg-secondary/80 text-ink font-semibold rounded-xl2 px-4 py-2 text-sm">
              {t("settings.invite")}
            </button>
          </form>
        )}
      </Card>

      <Card>
        <h2 className="font-semibold mb-3">{t("settings.white_label")}</h2>
        <p className="text-xs text-ink/50 mb-3">{t("settings.white_label_hint")}</p>
        {tenant && (
          <div className="flex flex-wrap gap-4 items-end">
            <ColorField label={t("settings.color_primary")} value={tenant.primary_color}
                        onChange={(v) => handleColorChange("primary_color", v)} />
            <ColorField label={t("settings.color_secondary")} value={tenant.secondary_color}
                        onChange={(v) => handleColorChange("secondary_color", v)} />
            <ColorField label={t("settings.color_accent")} value={tenant.accent_color}
                        onChange={(v) => handleColorChange("accent_color", v)} />
            <button onClick={saveColors} className="bg-primary hover:bg-primary/80 text-ink font-semibold rounded-xl2 px-4 py-2 text-sm">
              {t("clients.save")}
            </button>
          </div>
        )}
      </Card>

      <Card>
        <h2 className="font-semibold mb-3">{t("settings.billing_title")}</h2>
        {billingMsg && <div className="bg-accent/30 text-ink text-xs rounded-xl2 p-2 mb-3">{billingMsg}</div>}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm">
            {t("settings.billing_current_plan")}: <span className="font-semibold capitalize">{billingStatus?.plan}</span>
            {billingStatus?.subscription_status && (
              <span className="text-xs text-ink/50 ml-2">({billingStatus.subscription_status})</span>
            )}
          </p>
          <div className="flex border border-slate-200 rounded-xl2 overflow-hidden text-xs">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-3 py-1.5 ${billingCycle === "monthly" ? "bg-primary text-ink font-semibold" : "bg-white text-ink/60"}`}
            >
              {t("settings.billing_monthly")}
            </button>
            <button
              onClick={() => setBillingCycle("annual")}
              className={`px-3 py-1.5 ${billingCycle === "annual" ? "bg-primary text-ink font-semibold" : "bg-white text-ink/60"}`}
            >
              {t("settings.billing_annual")}
            </button>
          </div>
        </div>

        {!billingStatus?.configured && (
          <p className="text-xs text-ink/50 mb-3">{t("settings.billing_not_configured")}</p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {billingPlans.map((plan) => {
            const price = billingCycle === "monthly" ? plan.price_monthly : plan.price_annual;
            const isCurrent = billingStatus?.plan === plan.id;
            return (
              <div key={plan.id} className={`border rounded-xl2 p-4 ${isCurrent ? "border-primary" : "border-slate-200"}`}>
                <div className="font-semibold">{plan.name}</div>
                <div className="text-xl font-bold my-1">
                  €{price}
                  <span className="text-xs font-normal text-ink/50">
                    {billingCycle === "monthly" ? t("settings.billing_per_month") : t("settings.billing_per_year")}
                  </span>
                </div>
                <ul className="text-xs text-ink/60 mb-3 space-y-0.5">
                  <li>{plan.max_users ? `${plan.max_users} utenti` : "Utenti illimitati"}</li>
                  <li>{plan.max_clients ? `${plan.max_clients} clienti` : "Clienti illimitati"}</li>
                </ul>
                {isCurrent ? (
                  <span className="text-xs font-semibold text-ink/50">{t("settings.billing_current_plan")}</span>
                ) : plan.id !== "free" ? (
                  <button
                    disabled={billingBusy}
                    onClick={() => handleUpgrade(plan.id)}
                    className="w-full bg-primary hover:bg-primary/80 text-ink font-semibold rounded-xl2 py-1.5 text-xs"
                  >
                    {t("settings.billing_upgrade")}
                  </button>
                ) : null}
              </div>
            );
          })}
        </div>

        {billingStatus?.stripe_connected && (
          <button onClick={handleManageBilling} className="mt-3 text-xs underline text-ink/60">
            {t("settings.billing_manage")}
          </button>
        )}
      </Card>

      <Card>
        <h2 className="font-semibold mb-3">{t("settings.notifications")}</h2>
        <div className="space-y-2">
          <ToggleRow label={t("settings.notify_email")} defaultValue={user?.notify_email}
                     onChange={(v) => handleNotifPref("notify_email", v)} />
          <ToggleRow label={t("settings.notify_whatsapp")} defaultValue={user?.notify_whatsapp}
                     onChange={(v) => handleNotifPref("notify_whatsapp", v)} />
        </div>
        <p className="text-xs text-ink/40 mt-2">{t("settings.notify_whatsapp_hint")}</p>
      </Card>

      <Card>
        <h2 className="font-semibold mb-3">{t("settings.google_calendar")}</h2>
        {!gcalStatus?.configured && (
          <p className="text-sm text-ink/60">{t("settings.google_calendar_not_configured")}</p>
        )}
        {gcalStatus?.configured && !gcalStatus?.connected && (
          <button onClick={handleGoogleConnect} className="bg-secondary hover:bg-secondary/80 text-ink font-semibold rounded-xl2 px-4 py-2 text-sm">
            {t("settings.google_calendar_connect")}
          </button>
        )}
        {gcalStatus?.connected && (
          <div className="flex gap-2">
            <span className="text-sm text-ink/70 self-center">✅ {t("settings.google_calendar_connected")}</span>
            <button onClick={handleGoogleSync} className="bg-secondary hover:bg-secondary/80 text-ink font-semibold rounded-xl2 px-4 py-2 text-sm">
              {t("settings.google_calendar_sync")}
            </button>
          </div>
        )}
      </Card>

      {user?.role === "admin" && (
        <Card className="border-red-200">
          <h2 className="font-semibold mb-2 text-red-700">{t("settings.danger_zone_title")}</h2>
          <p className="text-xs text-ink/60 mb-3">{t("settings.danger_zone_hint")}</p>
          <form onSubmit={handleDeleteAccount} className="space-y-3 max-w-md">
            <div>
              <label className="text-sm font-medium block mb-1">
                {t("settings.danger_zone_confirm_label")}
              </label>
              <input
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="ELIMINA"
                className="w-full border border-red-200 rounded-xl2 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">{t("settings.danger_zone_password_label")}</label>
              <input
                type="password" required
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                className="w-full border border-red-200 rounded-xl2 px-3 py-2 text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={deleteBusy}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl2 px-4 py-2 text-sm disabled:opacity-40"
            >
              {deleteBusy ? t("settings.danger_zone_deleting") : t("settings.danger_zone_delete_button")}
            </button>
            {deleteMsg && <p className="text-xs text-red-600">{deleteMsg}</p>}
          </form>
        </Card>
      )}
    </div>
  );
}

function TextField({ label, value, onChange, type = "text" }) {
  return (
    <div>
      <label className="text-sm font-medium block mb-1">{label}</label>
      <input
        type={type} value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-slate-200 rounded-xl2 px-3 py-2 text-sm"
      />
    </div>
  );
}

function ColorField({ label, value, onChange }) {
  return (
    <div>
      <label className="text-sm font-medium block mb-1">{label}</label>
      <input type="color" value={value || "#A9D6E5"} onChange={(e) => onChange(e.target.value)}
             className="w-14 h-9 rounded-xl2 border border-slate-200 cursor-pointer" />
    </div>
  );
}

function ToggleRow({ label, defaultValue, onChange }) {
  const [checked, setChecked] = useState(!!defaultValue);
  return (
    <label className="flex items-center gap-2 text-sm cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => { setChecked(e.target.checked); onChange(e.target.checked); }}
      />
      {label}
    </label>
  );
}
