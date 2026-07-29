import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { api } from "../api";
import Card from "../components/Card";
import ChatPanel from "../components/ChatPanel";
import { useAuth } from "../context/AuthContext";

export default function TeamChat() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [channels, setChannels] = useState([]);
  const [activeChannel, setActiveChannel] = useState(null);
  const [newChannelName, setNewChannelName] = useState("");

  function refresh() {
    api.listChatChannels().then((chs) => {
      setChannels(chs);
      setActiveChannel((prev) => prev || chs[0] || null);
    });
  }

  useEffect(refresh, []);

  async function handleCreateChannel(e) {
    e.preventDefault();
    if (!newChannelName.trim()) return;
    const created = await api.createChatChannel(newChannelName.trim());
    setNewChannelName("");
    setChannels((prev) => [...prev, created]);
    setActiveChannel(created);
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-4">
      <Card className="w-56 shrink-0 flex flex-col !p-0 overflow-hidden">
        <div className="p-3 border-b border-slate-100 font-semibold text-sm">{t("chat.channels")}</div>
        <div className="flex-1 overflow-y-auto">
          {channels.map((ch) => (
            <button
              key={ch.id}
              onClick={() => setActiveChannel(ch)}
              className={`w-full text-left px-3 py-2 text-sm ${
                activeChannel?.id === ch.id ? "bg-primary/40 font-semibold" : "hover:bg-bg"
              }`}
            >
              # {ch.name}
            </button>
          ))}
        </div>
        <form onSubmit={handleCreateChannel} className="p-2 border-t border-slate-100 flex gap-1">
          <input
            value={newChannelName}
            onChange={(e) => setNewChannelName(e.target.value)}
            placeholder={t("chat.new_channel")}
            className="flex-1 border border-slate-200 rounded-xl2 px-2 py-1 text-xs"
          />
          <button type="submit" className="text-xs bg-secondary/60 hover:bg-secondary rounded-xl2 px-2">+</button>
        </form>
      </Card>

      <Card className="flex-1 !p-0 flex flex-col overflow-hidden">
        <div className="p-3 border-b border-slate-100 font-semibold text-sm">
          {activeChannel ? `# ${activeChannel.name}` : ""}
        </div>
        <div className="flex-1 min-h-0">
          {activeChannel && (
            <ChatPanel
              resetKey={activeChannel.id}
              fetchMessages={(after) => api.listChatMessages(activeChannel.id, after)}
              sendMessage={(body) => api.sendChatMessage(activeChannel.id, body)}
              emptyLabel={t("chat.empty")}
              placeholder={t("chat.placeholder")}
              myLabelMatcher={(m) => m.sender_user_id === user?.id}
            />
          )}
        </div>
      </Card>
    </div>
  );
}
