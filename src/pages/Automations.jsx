import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../api";
import Card from "../components/Card";

export default function Automations() {
  const { t } = useTranslation();
  const [rules, setRules] = useState([]);
  const [blueprints, setBlueprints] = useState([]);
  const [clients, setClients] = useState([]);
  const [stages, setStages] = useState([]);
  
  // Form states
  const [ruleName, setRuleName] = useState("");
  const [triggerType, setTriggerType] = useState("new_client");
  const [actionType, setActionType] = useState("send_whatsapp");
  const [actionContent, setActionContent] = useState("");
  
  const [bpName, setBpName] = useState("");
  const [bpEntityType, setBpEntityType] = useState("deal");
  const [bpStages, setBpStages] = useState("");

  const [testTrigger, setTestTrigger] = useState("new_client");
  const [testClient, setTestClient] = useState("");
  const [testLogs, setTestLogs] = useState([]);

  function refresh() {
    api.listRules().then(setRules).catch(console.error);
    api.listBlueprints().then(setBlueprints).catch(console.error);
    api.listClients().then(setClients).catch(console.error);
    api.listStages().then(setStages).catch(console.error);
  }

  useEffect(refresh, []);

  async function handleCreateRule(e) {
    e.preventDefault();
    const actionObj = { type: actionType, content: actionContent };
    const payload = {
      name: ruleName,
      trigger_type: triggerType,
      conditions: "{}",
      actions: JSON.stringify([actionObj]),
      is_active: true
    };
    await api.createRule(payload);
    setRuleName("");
    setActionContent("");
    refresh();
  }

  async function toggleRule(rule) {
    await api.updateRule(rule.id, {
      ...rule,
      is_active: !rule.is_active
    });
    refresh();
  }

  async function handleDeleteRule(id) {
    await api.deleteRule(id);
    refresh();
  }

  async function handleCreateBlueprint(e) {
    e.preventDefault();
    const defaultStagesJson = JSON.stringify({
      states: bpStages.split(",").map(s => s.trim()).filter(Boolean),
      transitions: []
    });
    await api.createBlueprint({
      name: bpName,
      entity_type: bpEntityType,
      stages: defaultStagesJson,
      is_active: true
    });
    setBpName("");
    setBpStages("");
    refresh();
  }

  async function handleDeleteBlueprint(id) {
    await api.deleteBlueprint(id);
    refresh();
  }

  async function handleTestTrigger() {
    if (!testClient) return;
    try {
      const res = await api.triggerEvent(testTrigger, testClient);
      setTestLogs(prev => [
        {
          timestamp: new Date().toLocaleTimeString(),
          event: testTrigger,
          client: clients.find(c => c.id === testClient)?.name || testClient,
          matched: res.matched_rules_count,
          details: res.triggered_actions
        },
        ...prev
      ]);
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-xl2 bg-gradient-to-r from-primary/30 via-secondary/20 to-accent/30 p-8 shadow-sm">
        <div className="relative z-10">
          <h1 className="text-3xl font-extrabold text-ink tracking-tight">⚡ {t("nav.automations")}</h1>
          <p className="text-ink/80 mt-2 max-w-xl text-sm leading-relaxed">
            Gestisci trigger ed eventi automatici per risparmiare tempo. Definisci flussi "Se accade X allora esegui Y" e crea Blueprint per far rispettare i processi di vendita aziendali.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Rules Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-ink">Rules & Workflows</h2>
          </div>

          {/* Create Rule Form */}
          <Card className="border border-slate-100 hover:shadow-md transition-shadow">
            <form onSubmit={handleCreateRule} className="space-y-4">
              <h3 className="text-md font-semibold text-ink/90">Crea Nuova Regola</h3>
              <div>
                <label className="text-xs font-semibold text-ink/70 uppercase block mb-1">Nome Regola</label>
                <input
                  type="text" required value={ruleName} onChange={(e) => setRuleName(e.target.value)}
                  placeholder="Es. Benvenuto WhatsApp"
                  className="w-full border border-slate-200 rounded-xl2 px-3 py-2 text-sm focus:border-primary focus:ring-0 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-ink/70 uppercase block mb-1">Trigger Event</label>
                  <select
                    value={triggerType} onChange={(e) => setTriggerType(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl2 px-3 py-2 text-sm bg-white focus:border-primary focus:ring-0 outline-none"
                  >
                    <option value="new_client">Nuovo Cliente Creato</option>
                    <option value="stage_change">Trattativa Cambia Stato</option>
                    <option value="task_due">Task in Scadenza</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-ink/70 uppercase block mb-1">Azione</label>
                  <select
                    value={actionType} onChange={(e) => setActionType(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl2 px-3 py-2 text-sm bg-white focus:border-primary focus:ring-0 outline-none"
                  >
                    <option value="send_whatsapp">Invia WhatsApp</option>
                    <option value="send_email">Invia Email</option>
                    <option value="create_task">Crea Task Interno</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-ink/70 uppercase block mb-1">Contenuto Azione</label>
                <textarea
                  required value={actionContent} onChange={(e) => setActionContent(e.target.value)}
                  placeholder={actionType === "create_task" ? "Titolo del task da creare" : "Testo del messaggio da inviare"}
                  rows={2}
                  className="w-full border border-slate-200 rounded-xl2 px-3 py-2 text-sm focus:border-primary focus:ring-0 outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-secondary hover:bg-secondary/90 text-ink font-semibold rounded-xl2 px-4 py-2.5 text-sm transition-all shadow-sm hover:scale-[1.01]"
              >
                Crea Automazione
              </button>
            </form>
          </Card>

          {/* Rules List */}
          <div className="space-y-3">
            {rules.map((rule) => {
              const actions = JSON.parse(rule.actions || "[]");
              return (
                <div key={rule.id} className="bg-white rounded-xl2 p-4 border border-slate-100 shadow-sm flex items-center justify-between hover:border-primary/50 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-ink">{rule.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${rule.is_active ? "bg-secondary/35 text-ink" : "bg-slate-100 text-ink/50"}`}>
                        {rule.is_active ? "Attiva" : "Pausa"}
                      </span>
                    </div>
                    <div className="text-xs text-ink/60">
                      Trigger: <span className="font-semibold">{rule.trigger_type}</span>
                    </div>
                    {actions.map((act, i) => (
                      <div key={i} className="text-xs text-ink/75 bg-slate-50 px-2 py-1 rounded mt-1 font-mono">
                        ⚙️ {act.type}: {act.content}
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleRule(rule)}
                      className="text-xs bg-slate-100 hover:bg-slate-200 text-ink font-medium px-2.5 py-1.5 rounded-lg transition-all"
                    >
                      {rule.is_active ? "Sospendi" : "Attiva"}
                    </button>
                    <button
                      onClick={() => handleDeleteRule(rule.id)}
                      className="text-xs text-red-500 hover:bg-red-50 hover:text-red-600 p-1.5 rounded-lg transition-all"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })}
            {rules.length === 0 && (
              <div className="text-center text-sm text-ink/40 py-8">Nessuna regola di automazione attiva.</div>
            )}
          </div>
        </div>

        {/* Blueprints & Sandbox Section */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-ink">Pipeline Blueprints</h2>

          {/* Create Blueprint Form */}
          <Card className="border border-slate-100 hover:shadow-md transition-shadow">
            <form onSubmit={handleCreateBlueprint} className="space-y-4">
              <h3 className="text-md font-semibold text-ink/90">Crea Nuovo Blueprint</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-ink/70 uppercase block mb-1">Nome Processo</label>
                  <input
                    type="text" required value={bpName} onChange={(e) => setBpName(e.target.value)}
                    placeholder="Es. Qualificazione Lead"
                    className="w-full border border-slate-200 rounded-xl2 px-3 py-2 text-sm focus:border-primary focus:ring-0 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-ink/70 uppercase block mb-1">Entità Associata</label>
                  <select
                    value={bpEntityType} onChange={(e) => setBpEntityType(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl2 px-3 py-2 text-sm bg-white focus:border-primary focus:ring-0 outline-none"
                  >
                    <option value="deal">Trattativa (Deal)</option>
                    <option value="client">Cliente (Client)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-ink/70 uppercase block mb-1">Stati del Processo (separati da virgola)</label>
                <input
                  type="text" required value={bpStages} onChange={(e) => setBpStages(e.target.value)}
                  placeholder="Qualificato, Contattato, Demo Fissata, Trattativa Conclusa"
                  className="w-full border border-slate-200 rounded-xl2 px-3 py-2 text-sm focus:border-primary focus:ring-0 outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-primary hover:bg-primary/95 text-ink font-semibold rounded-xl2 px-4 py-2.5 text-sm transition-all shadow-sm hover:scale-[1.01]"
              >
                Crea Blueprint
              </button>
            </form>
          </Card>

          {/* Blueprints List */}
          <div className="space-y-3">
            {blueprints.map((bp) => {
              const stagesData = JSON.parse(bp.stages || "{}");
              return (
                <div key={bp.id} className="bg-white rounded-xl2 p-4 border border-slate-100 shadow-sm flex items-center justify-between hover:border-primary/50 transition-colors">
                  <div className="space-y-1">
                    <div className="font-semibold text-sm text-ink">{bp.name}</div>
                    <div className="text-xs text-ink/60">Entità: {bp.entity_type}</div>
                    <div className="flex items-center gap-1 flex-wrap mt-1">
                      {stagesData.states?.map((st, i) => (
                        <span key={i} className="text-[10px] bg-primary/20 text-ink px-2 py-0.5 rounded-full font-medium">
                          {st}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteBlueprint(bp.id)}
                    className="text-xs text-red-500 hover:bg-red-50 hover:text-red-600 p-1.5 rounded-lg transition-all"
                  >
                    🗑️
                  </button>
                </div>
              );
            })}
            {blueprints.length === 0 && (
              <div className="text-center text-sm text-ink/40 py-8">Nessun Blueprint attivo.</div>
            )}
          </div>

          {/* Engine Sandbox Test */}
          <div className="bg-gradient-to-br from-positive/30 to-accent/30 rounded-xl2 p-6 border border-slate-100 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-ink flex items-center gap-1">🧪 Sandbox: Test delle Automazioni</h3>
            <p className="text-xs text-ink/80">
              Usa questa sandbox per simulare un evento e vedere in tempo reale quali azioni vengono innescate.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-ink/75 block mb-1">Simula Trigger</label>
                <select
                  value={testTrigger} onChange={(e) => setTestTrigger(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl2 px-3 py-2 text-xs bg-white outline-none"
                >
                  <option value="new_client">Nuovo Cliente Creato</option>
                  <option value="stage_change">Trattativa Cambia Stato</option>
                  <option value="task_due">Task in Scadenza</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-ink/75 block mb-1">Seleziona Cliente</label>
                <select
                  value={testClient} onChange={(e) => setTestClient(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl2 px-3 py-2 text-xs bg-white outline-none"
                >
                  <option value="">Seleziona...</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.company || "Privato"})</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={handleTestTrigger}
              disabled={!testClient}
              className="w-full bg-ink hover:bg-ink/90 text-white disabled:opacity-50 font-semibold rounded-xl2 px-4 py-2 text-xs transition-all"
            >
              Simula Evento
            </button>

            {/* Test log output */}
            {testLogs.length > 0 && (
              <div className="bg-white/70 backdrop-blur rounded-lg p-3 max-h-40 overflow-y-auto space-y-2 border border-slate-100">
                {testLogs.map((log, idx) => (
                  <div key={idx} className="text-[11px] font-mono border-b border-slate-100 last:border-0 pb-1.5 last:pb-0">
                    <span className="text-slate-400">[{log.timestamp}]</span> Evento: <span className="font-bold text-ink">{log.event}</span> per <span className="underline">{log.client}</span>
                    <br />
                    <span>✓ Corrispondenze: {log.matched} regole</span>
                    {log.details.map((det, dIdx) => (
                      <div key={dIdx} className="text-green-600 pl-3">
                        ⚡ {det.rule_name} {"->"} {det.status}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
