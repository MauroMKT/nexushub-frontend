import { useEffect, useRef, useState } from "react";

/**
 * Pannello di chat riutilizzabile (a polling ogni 4s, stile Slack): usato sia
 * per la chat interna team sia per il thread agenzia-cliente. `resetKey`
 * identifica la conversazione corrente (channel_id o client_id): quando cambia,
 * il pannello riparte da zero. `fetchMessages(afterId)` e `sendMessage(body)`
 * incapsulano la differenza fra i due contesti (team vs portale clienti).
 */
export default function ChatPanel({ resetKey, fetchMessages, sendMessage, emptyLabel, placeholder, myLabelMatcher }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const lastIdRef = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    setMessages([]);
    lastIdRef.current = null;
    let cancelled = false;

    async function pollOnce() {
      try {
        const newMsgs = await fetchMessages(lastIdRef.current);
        if (!cancelled && newMsgs && newMsgs.length > 0) {
          setMessages((prev) => [...prev, ...newMsgs]);
          lastIdRef.current = newMsgs[newMsgs.length - 1].id;
        }
      } catch (e) {
        /* errori temporanei di polling: ignorati, riproverà al giro successivo */
      }
    }

    pollOnce();
    const interval = setInterval(pollOnce, 4000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e) {
    e.preventDefault();
    if (!text.trim() || busy) return;
    setBusy(true);
    try {
      const sent = await sendMessage(text.trim());
      setMessages((prev) => [...prev, sent]);
      lastIdRef.current = sent.id;
      setText("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-3 p-3">
        {messages.length === 0 && <p className="text-xs text-ink/40 text-center mt-6">{emptyLabel}</p>}
        {messages.map((m) => {
          const isMine = myLabelMatcher ? myLabelMatcher(m) : false;
          return (
            <div key={m.id} className={isMine ? "text-right" : "text-left"}>
              <div className="text-xs text-ink/40 mb-0.5">
                <span className="font-semibold text-ink/60">{m.sender_name}</span>{" "}
                {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </div>
              <div className={`inline-block max-w-[85%] rounded-xl2 px-3 py-2 text-sm break-words ${isMine ? "bg-primary/50" : "bg-bg"}`}>
                {m.body}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={handleSend} className="flex gap-2 p-2 border-t border-slate-100">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholder}
          className="flex-1 border border-slate-200 rounded-xl2 px-3 py-2 text-sm"
        />
        <button type="submit" disabled={busy} className="bg-primary hover:bg-primary/80 text-ink font-semibold rounded-xl2 px-4 py-2 text-sm">
          ➤
        </button>
      </form>
    </div>
  );
}
