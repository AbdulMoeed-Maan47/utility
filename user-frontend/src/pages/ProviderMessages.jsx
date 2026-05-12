import { useState, useEffect, useRef } from "react";
import { Send, Loader2 } from "lucide-react";
import ProviderLayout from "../components/ProviderLayout";
import api from "../services/api";

export default function ProviderMessages() {
  const [conversations, setConversations] = useState([]);
  const [activeUser, setActiveUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const email = localStorage.getItem("email");

  useEffect(() => {
    if (!email) return;
    api
      .get(`/conversations/${email}`)
      .then((r) => setConversations(r.data))
      .catch(() => {});
  }, [email]);

  useEffect(() => {
    if (!activeUser) return;
    setLoading(true);
    api
      .get(`/messages/${email}/${activeUser}`)
      .then((r) => {
        setMessages(r.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [activeUser, email]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!text.trim() || !activeUser) return;
    const msg = { sender: email, receiver: activeUser, text: text.trim() };
    setText("");
    try {
      await api.post("/messages", msg);
      setMessages((prev) => [...prev, { ...msg, timestamp: new Date() }]);
    } catch {}
  };

  return (
    <ProviderLayout>
      <div className="h-full flex" style={{ height: "calc(100vh - 0px)" }}>
        {/* Conversations list */}
        <div className="w-72 border-r bg-white flex flex-col shrink-0">
          <div className="p-4 border-b">
            <h2 className="font-bold text-gray-800">Messages</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 && (
              <p className="text-center text-sm text-gray-400 mt-8">
                No conversations yet
              </p>
            )}
            {conversations.map((c) => (
              <button
                key={c.user}
                onClick={() => setActiveUser(c.user)}
                className={`w-full text-left px-4 py-3 border-b hover:bg-gray-50 transition-colors ${activeUser === c.user ? "bg-sky-50" : ""}`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-sky-100 rounded-full flex items-center justify-center font-bold text-sky-600 text-sm shrink-0">
                    {c.user.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-gray-800 truncate">
                      {c.user}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      {c.lastMessage}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Chat area */}
        <div className="flex-1 flex flex-col">
          {!activeUser ? (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <p>Select a conversation to start chatting</p>
            </div>
          ) : (
            <>
              <div className="px-6 py-4 border-b bg-white">
                <p className="font-semibold text-gray-800">{activeUser}</p>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-gray-50">
                {loading && (
                  <div className="flex justify-center">
                    <Loader2 size={24} className="animate-spin text-sky-500" />
                  </div>
                )}
                {messages.map((m, i) => {
                  const mine = m.sender === email;
                  return (
                    <div
                      key={i}
                      className={`flex ${mine ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-xs px-4 py-2.5 rounded-2xl text-sm ${mine ? "bg-sky-500 text-white" : "bg-white border text-gray-800"}`}
                      >
                        {m.text}
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>
              <div className="px-4 py-3 border-t bg-white flex gap-3">
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  placeholder="Type a message…"
                  className="flex-1 px-4 py-2.5 border rounded-xl text-sm focus:border-sky-500 focus:outline-none"
                />
                <button
                  onClick={sendMessage}
                  className="p-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white disabled:opacity-60"
                >
                  <Send size={18} />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </ProviderLayout>
  );
}
