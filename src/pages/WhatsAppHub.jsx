import { useEffect, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../api";
import Card from "../components/Card";

export default function WhatsAppHub() {
  const { t } = useTranslation();
  
  const [clients, setClients] = useState([]);
  const [activeClient, setActiveClient] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  
  const [templates, setTemplates] = useState([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [tplName, setTplName] = useState("");
  const [tplContent, setTplContent] = useState("");

  const [simText, setSimText] = useState("");

  const messagesEndRef = useRef(null);

  function refresh() {
    api.listClients().then(res => {
      setClients(res);
      if (res.length > 0 && !activeClient) {
        setActiveClient(res[0]);
      }
    }).catch(console.error);
    
    api.listWhatsAppTemplates().then(setTemplates).catch(console.error);
  }

  useEffect(refresh, []);

  // Fetch messages when activeClient changes
  useEffect(() => {
    if (activeClient) {
      api.listWhatsAppMessages(activeClient.id)
        .then(setMessages)
        .catch(console.error);
    }
  }, [activeClient]);

  // Scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e) {
    e.preventDefault();
    if (!inputText || !activeClient) return;
    
    const payload = {
      client_id: activeClient.id,
      direction: "outbound",
      message_text: inputText,
      status: "sent"
    };

    try {
      await api.sendWhatsAppMessage(payload);
      setInputText("");
      // Ricarica i messaggi
      const updated = await api.listWhatsAppMessages(activeClient.id);
      setMessages(updated);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleCreateTemplate(e) {
    e.preventDefault();
    if (!tplName || !tplContent) return;

    try {
      await api.createWhatsAppTemplate({
        name: tplName,
        content: tplContent,
        language: "it"
      });
      setTplName("");
      setTplContent("");
      setShowTemplates(false);
      refresh();
    } catch (err) {
      console.error(err);
    }
  }

  async function handleDeleteTemplate(id) {
    await api.deleteWhatsAppTemplate(id);
    refresh();
  }

  async function handleSendTemplate(tpl) {
    if (!activeClient) return;
    try {
      await api.sendWhatsAppMessage({
        client_id: activeClient.id,
        direction: "outbound",
        message_text: tpl.content,
        status: "sent"
      });
      const updated = await api.listWhatsAppMessages(activeClient.id);
      setMessages(updated);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleSimulateInbound(e) {
    e.preventDefault();
    if (!simText || !activeClient) return;

    try {
      await api.simulateWhatsAppInbound(activeClient.id, simText);
      setSimText("");
      const updated = await api.listWhatsAppMessages(activeClient.id);
      setMessages(updated);
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Banner */}
      <div className="relative overflow-hidden rounded-xl2 bg-gradient-to-r from-secondary/40 via-primary/20 to-accent/20 p-6 shadow-sm">
        <h1 className="text-2xl font-extrabold text-ink flex items-center gap-2">💬 {t("nav.whatsapp")}</h1>
        <p className="text-xs text-ink/75 mt-1">
          {t("whatsapp.banner_desc")}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
        {/* Left Column: Clients list & Templates */}
        <div className="lg:col-span-1 bg-white border border-slate-100 rounded-xl2 flex flex-col overflow-hidden shadow-sm">
          {/* Tabs */}
          <div className="flex border-b border-slate-100">
            <button
              onClick={() => setShowTemplates(false)}
              className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider ${!showTemplates ? "border-b-2 border-primary text-ink bg-slate-50/50" : "text-ink/60"}`}
            >
              {t("whatsapp.tab_conversations")}
            </button>
            <button
              onClick={() => setShowTemplates(true)}
              className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider ${showTemplates ? "border-b-2 border-primary text-ink bg-slate-50/50" : "text-ink/60"}`}
            >
              {t("whatsapp.tab_templates")}
            </button>
          </div>

          {!showTemplates ? (
            /* Conversations List */
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {clients.map(c => (
                <div
                  key={c.id}
                  onClick={() => setActiveClient(c)}
                  className={`p-4 cursor-pointer flex items-center gap-3 transition-colors ${activeClient?.id === c.id ? "bg-primary/20" : "hover:bg-slate-50"}`}
                >
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-lg shrink-0">
                    👤
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-sm text-ink truncate">{c.name}</div>
                    <div className="text-xs text-ink/60 truncate">{c.company || t("whatsapp.private_label")}</div>
                    {c.whatsapp && <div className="text-[10px] text-green-600 font-semibold">{c.whatsapp}</div>}
                  </div>
                </div>
              ))}
              {clients.length === 0 && (
                <div className="text-center text-sm text-ink/40 py-8">{t("whatsapp.no_clients")}</div>
              )}
            </div>
          ) : (
            /* Template Management */
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <form onSubmit={handleCreateTemplate} className="space-y-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div className="text-xs font-bold text-ink/80">{t("whatsapp.new_template_title")}</div>
                <input
                  type="text" required placeholder={t("whatsapp.template_name_placeholder")} value={tplName} onChange={(e) => setTplName(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs outline-none"
                />
                <textarea
                  required placeholder={t("whatsapp.template_content_placeholder")} value={tplContent} onChange={(e) => setTplContent(e.target.value)}
                  rows={2}
                  className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs outline-none"
                />
                <button
                  type="submit"
                  className="w-full bg-secondary hover:bg-secondary/90 text-ink font-semibold rounded-lg py-1.5 text-xs transition-colors"
                >
                  {t("whatsapp.save_template_button")}
                </button>
              </form>

              <div className="space-y-2">
                <div className="text-xs font-bold text-ink/80">{t("whatsapp.your_templates_title")}</div>
                {templates.map(tpl => (
                  <div key={tpl.id} className="bg-white p-3 rounded-lg border border-slate-100 text-xs space-y-1 hover:border-primary/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-ink">{tpl.name}</span>
                      <span className="text-[9px] bg-green-150 text-green-700 font-bold px-1.5 py-0.5 rounded-full">{t("whatsapp.approved_badge")}</span>
                    </div>
                    <p className="text-ink/75 italic">"{tpl.content}"</p>
                    <div className="flex items-center justify-end gap-1 pt-1 border-t border-slate-100">
                      <button
                        onClick={() => handleSendTemplate(tpl)}
                        className="bg-primary/40 hover:bg-primary/60 text-ink font-semibold px-2 py-1 rounded text-[10px] transition-colors"
                      >
                        {t("whatsapp.send_to_chat_button")}
                      </button>
                      <button
                        onClick={() => handleDeleteTemplate(t.id)}
                        className="text-[10px] text-red-500 hover:bg-red-50 p-1 rounded"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Chat History & Input */}
        <div className="lg:col-span-2 bg-white border border-slate-100 rounded-xl2 flex flex-col overflow-hidden shadow-sm">
          {activeClient ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/30 flex items-center justify-center text-lg">
                    💬
                  </div>
                  <div>
                    <div className="font-bold text-sm text-ink">{activeClient.name}</div>
                    <div className="text-xs text-ink/60">{activeClient.phone || t("whatsapp.no_phone")}</div>
                  </div>
                </div>
                {/* Sandbox simulator panel */}
                <form onSubmit={handleSimulateInbound} className="flex items-center gap-2">
                  <input
                    type="text" required placeholder={t("whatsapp.simulate_reply_placeholder")} value={simText} onChange={(e) => setSimText(e.target.value)}
                    className="border border-slate-200 rounded-lg px-2 py-1 text-xs outline-none w-44"
                  />
                  <button
                    type="submit"
                    className="bg-ink hover:bg-ink/90 text-white font-semibold rounded-lg px-2.5 py-1 text-xs transition-colors"
                  >
                    {t("whatsapp.simulate_receive_button")}
                  </button>
                </form>
              </div>

              {/* Chat History */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#f0f2f5]/30">
                {messages.map(msg => {
                  const isInbound = msg.direction === "inbound";
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isInbound ? "justify-start" : "justify-end"}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-xl2 px-4 py-2.5 text-sm shadow-sm relative ${isInbound ? "bg-white text-ink rounded-tl-none border border-slate-100" : "bg-primary/45 text-ink rounded-tr-none"}`}
                      >
                        <p>{msg.message_text}</p>
                        <span className="text-[9px] text-ink/50 block mt-1 text-right">
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {!isInbound && (
                            <span className="ml-1 text-green-600">✓✓</span>
                          )}
                        </span>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSend} className="p-4 border-t border-slate-100 flex items-center gap-3 bg-white">
                <input
                  type="text"
                  placeholder={t("whatsapp.message_placeholder")}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="flex-1 border border-slate-200 rounded-xl2 px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-0"
                />
                <button
                  type="submit"
                  className="bg-secondary hover:bg-secondary/90 text-ink font-semibold rounded-xl2 px-5 py-2.5 text-sm transition-transform active:scale-95 shadow-sm"
                >
                  {t("whatsapp.send_button")}
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-ink/40 space-y-2">
              <div className="text-4xl">💬</div>
              <div className="text-sm">{t("whatsapp.select_client_prompt")}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
