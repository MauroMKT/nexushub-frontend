import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../api";
import Card from "../components/Card";

export default function EmailMarketing() {
  const { t } = useTranslation();

  const [campaigns, setCampaigns] = useState([]);
  const [sequences, setSequences] = useState([]);
  const [stages, setStages] = useState([]);
  
  // Campaign Form
  const [campTitle, setCampTitle] = useState("");
  const [campSubject, setCampSubject] = useState("");
  const [campBody, setCampBody] = useState("");
  const [showCampForm, setShowCampForm] = useState(false);

  // Sequence Form
  const [seqName, setSeqName] = useState("");
  const [seqStage, setSeqStage] = useState("");
  const [seqSteps, setSeqSteps] = useState("");
  const [showSeqForm, setShowSeqForm] = useState(false);

  function refresh() {
    api.listEmailCampaigns().then(setCampaigns).catch(console.error);
    api.listEmailSequences().then(setSequences).catch(console.error);
    api.listStages().then(setStages).catch(console.error);
  }

  useEffect(refresh, []);

  async function handleCreateCampaign(e) {
    e.preventDefault();
    if (!campTitle || !campSubject || !campBody) return;
    
    try {
      await api.createEmailCampaign({
        title: campTitle,
        subject: campSubject,
        body_html: campBody
      });
      setCampTitle("");
      setCampSubject("");
      setCampBody("");
      setShowCampForm(false);
      refresh();
    } catch (err) {
      console.error(err);
    }
  }

  async function handleSendCampaign(id) {
    try {
      await api.sendEmailCampaign(id);
      refresh();
    } catch (err) {
      console.error(err);
    }
  }

  async function handleCreateSequence(e) {
    e.preventDefault();
    if (!seqName || !seqStage || !seqSteps) return;

    // Parse the simple steps notation
    // format: Delay (days) | Subject | Content
    // eg: 1 | Ciao | Come va?
    const parsedSteps = seqSteps.split("\n").map(line => {
      const parts = line.split("|").map(p => p.trim());
      if (parts.length >= 3) {
        return {
          delay_days: parseInt(parts[0]) || 0,
          subject: parts[1],
          body: parts[2]
        };
      }
      return null;
    }).filter(Boolean);

    try {
      await api.createEmailSequence({
        name: seqName,
        trigger_stage_id: seqStage,
        steps: JSON.stringify(parsedSteps),
        is_active: true
      });
      setSeqName("");
      setSeqStage("");
      setSeqSteps("");
      setShowSeqForm(false);
      refresh();
    } catch (err) {
      console.error(err);
    }
  }

  async function handleDeleteSequence(id) {
    await api.deleteEmailSequence(id);
    refresh();
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Banner */}
      <div className="relative overflow-hidden rounded-xl2 bg-gradient-to-r from-accent/30 via-primary/20 to-secondary/30 p-8 shadow-sm">
        <h1 className="text-3xl font-extrabold text-ink tracking-tight">✉️ {t("nav.email")}</h1>
        <p className="text-ink/80 mt-2 max-w-xl text-sm leading-relaxed">
          Crea campagne newsletter drag & drop o automatizza le sequenze di email di follow-up collegate direttamente alle fasi della tua pipeline di vendita.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Newsletter Campaigns */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-ink">Campagne Newsletter</h2>
            <button
              onClick={() => setShowCampForm(s => !s)}
              className="bg-accent hover:bg-accent/80 text-ink font-semibold rounded-xl2 px-4 py-2 text-xs transition-colors shadow-sm"
            >
              {showCampForm ? "Annulla" : "+ Nuova Campagna"}
            </button>
          </div>

          {showCampForm && (
            <Card className="border border-slate-100 shadow-md">
              <form onSubmit={handleCreateCampaign} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-ink/70 block mb-1">Titolo Campagna (Interno)</label>
                  <input
                    type="text" required placeholder="Es. Promozione di Fine Estate" value={campTitle} onChange={(e) => setCampTitle(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl2 px-3 py-2 text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-ink/70 block mb-1">Oggetto dell'Email</label>
                  <input
                    type="text" required placeholder="Es. Non perderti le novità!" value={campSubject} onChange={(e) => setCampSubject(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl2 px-3 py-2 text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-ink/70 block mb-1">Corpo dell'Email (HTML/Testo)</label>
                  <textarea
                    required placeholder="Ciao! Ecco la nostra promozione..." value={campBody} onChange={(e) => setCampBody(e.target.value)}
                    rows={4}
                    className="w-full border border-slate-200 rounded-xl2 px-3 py-2 text-sm outline-none font-sans"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-secondary hover:bg-secondary/90 text-ink font-semibold rounded-xl2 px-4 py-2.5 text-sm transition-all"
                >
                  Salva Campagna
                </button>
              </form>
            </Card>
          )}

          {/* Campaigns list */}
          <div className="space-y-4">
            {campaigns.map((camp) => (
              <Card key={camp.id} className="border border-slate-100 hover:border-accent/40 transition-colors shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-ink">{camp.title}</h3>
                    <p className="text-xs text-ink/60">Oggetto: {camp.subject}</p>
                  </div>
                  {camp.sent_count === 0 ? (
                    <button
                      onClick={() => handleSendCampaign(camp.id)}
                      className="bg-primary hover:bg-primary/95 text-ink font-bold px-3 py-1.5 rounded-lg text-xs transition-colors"
                    >
                      🚀 Invia Ora
                    </button>
                  ) : (
                    <span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-2 py-1 rounded-lg">
                      Inviata
                    </span>
                  )}
                </div>

                {camp.sent_count > 0 && (
                  <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-100 text-center">
                    <div className="bg-slate-50/70 p-2 rounded-lg">
                      <div className="text-xs text-slate-400">Inviate</div>
                      <div className="text-sm font-bold text-ink">{camp.sent_count}</div>
                    </div>
                    <div className="bg-green-50/70 p-2 rounded-lg">
                      <div className="text-xs text-green-500">Aperte</div>
                      <div className="text-sm font-bold text-green-700">
                        {camp.open_count} <span className="text-[10px] font-normal">({Math.round((camp.open_count/camp.sent_count)*100)}%)</span>
                      </div>
                    </div>
                    <div className="bg-blue-50/70 p-2 rounded-lg">
                      <div className="text-xs text-blue-500">Cliccate</div>
                      <div className="text-sm font-bold text-blue-700">
                        {camp.click_count} <span className="text-[10px] font-normal">({Math.round((camp.click_count/camp.sent_count)*100)}%)</span>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            ))}
            {campaigns.length === 0 && (
              <div className="text-center text-sm text-ink/40 py-8">Nessuna campagna creata.</div>
            )}
          </div>
        </div>

        {/* Marketing Follow-up Sequences */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-ink">Sequenze Automatiche</h2>
            <button
              onClick={() => setShowSeqForm(s => !s)}
              className="bg-primary hover:bg-primary/80 text-ink font-semibold rounded-xl2 px-4 py-2 text-xs transition-colors shadow-sm"
            >
              {showSeqForm ? "Annulla" : "+ Nuova Sequenza"}
            </button>
          </div>

          {showSeqForm && (
            <Card className="border border-slate-100 shadow-md">
              <form onSubmit={handleCreateSequence} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-ink/70 block mb-1">Nome Sequenza</label>
                  <input
                    type="text" required placeholder="Es. Follow-up Lead Iniziale" value={seqName} onChange={(e) => setSeqName(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl2 px-3 py-2 text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-ink/70 block mb-1">Trigger (Fase Pipeline)</label>
                  <select
                    value={seqStage} required onChange={(e) => setSeqStage(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl2 px-3 py-2 text-sm bg-white outline-none"
                  >
                    <option value="">Seleziona...</option>
                    {stages.map(st => (
                      <option key={st.id} value={st.id}>{st.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-ink/70 block mb-1">
                    Step della Sequenza (un'email per riga formato: <span className="font-mono bg-slate-100 p-0.5 rounded">GiorniRitardo | Oggetto | Corpo</span>)
                  </label>
                  <textarea
                    required placeholder="1 | Benvenuto! | Grazie per esserti registrato.&#13;3 | Come possiamo aiutarti? | Hai domande sul servizio?"
                    value={seqSteps} onChange={(e) => setSeqSteps(e.target.value)}
                    rows={4}
                    className="w-full border border-slate-200 rounded-xl2 px-3 py-2 text-xs outline-none font-mono"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-secondary hover:bg-secondary/90 text-ink font-semibold rounded-xl2 px-4 py-2.5 text-sm transition-all"
                >
                  Salva Sequenza
                </button>
              </form>
            </Card>
          )}

          {/* Sequences List */}
          <div className="space-y-3">
            {sequences.map((seq) => {
              const steps = JSON.parse(seq.steps || "[]");
              return (
                <div key={seq.id} className="bg-white rounded-xl2 p-4 border border-slate-100 shadow-sm flex items-center justify-between hover:border-primary/50 transition-colors">
                  <div className="space-y-1">
                    <div className="font-semibold text-sm text-ink">{seq.name}</div>
                    <div className="text-xs text-ink/60">
                      Attivata al cambio fase pipeline: <span className="font-semibold">{stages.find(st => st.id === seq.trigger_stage_id)?.name || seq.trigger_stage_id}</span>
                    </div>
                    <div className="space-y-1 mt-2">
                      {steps.map((st, i) => (
                        <div key={i} className="text-[10px] bg-slate-50 border border-slate-100 text-ink/80 px-2 py-1 rounded">
                          📧 <span className="font-bold">Giorno {st.delay_days}</span>: {st.subject} - <span className="italic">"{st.body.slice(0, 30)}..."</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteSequence(seq.id)}
                    className="text-xs text-red-500 hover:bg-red-50 hover:text-red-600 p-1.5 rounded-lg transition-all"
                  >
                    🗑️
                  </button>
                </div>
              );
            })}
            {sequences.length === 0 && (
              <div className="text-center text-sm text-ink/40 py-8">Nessuna sequenza di follow-up attiva.</div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
