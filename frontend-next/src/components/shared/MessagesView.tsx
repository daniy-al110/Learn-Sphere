"use client";

import { useState, useEffect } from "react";
import { Icon } from "@/components/layout/icons";
import { useSession } from "@/hooks/useSession";
import { API_BASE_URL } from "@/lib/config";
import { toast } from "@/lib/toast-store";
import { Send, Plus, Inbox, Mail, User, X, CheckCircle2 } from "lucide-react";

interface Message {
  message_id: number;
  sender_key: string;
  receiver_key: string;
  sender_name: string;
  receiver_name: string;
  subject: string;
  content: string;
  is_read: number;
  created_at: string;
}

interface UserOpt {
  user_key: string;
  name: string;
  email: string;
  role: string;
}

export default function MessagesView() {
  const { session, ready } = useSession();
  const [activeTab, setActiveTab] = useState<"inbox" | "sent">("inbox");
  const [messages, setMessages] = useState<{ inbox: Message[]; sent: Message[] }>({
    inbox: [],
    sent: [],
  });
  const [loading, setLoading] = useState(true);

  // Compose modal state
  const [composeOpen, setComposeOpen] = useState(false);
  const [users, setUsers] = useState<UserOpt[]>([]);
  const [recipient, setRecipient] = useState("");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);

  // View modal state
  const [viewMessage, setViewMessage] = useState<Message | null>(null);

  const userKey = session.role + "_" + session.userId;

  useEffect(() => {
    if (ready && session.userId) {
      fetchMessages();
      fetchUsers();
    }
  }, [ready, session]);

  async function fetchMessages() {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/messages?user_key=${userKey}`);
      const data = await res.json();
      if (data.success) {
        setMessages({ inbox: data.received, sent: data.sent });
      }
    } catch {
      toast.error("Failed to load messages");
    } finally {
      setLoading(false);
    }
  }

  async function fetchUsers() {
    try {
      const res = await fetch(`${API_BASE_URL}/api/users`);
      const data = await res.json();
      if (data.success) {
        setUsers(data.users.filter((u: UserOpt) => u.user_key !== userKey));
      }
    } catch {}
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!recipient || !content) return toast.warning("Recipient and content are required.");
    setSending(true);
    try {
      const recUser = users.find((u) => u.user_key === recipient);
      const res = await fetch(`${API_BASE_URL}/api/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender_key: userKey,
          sender_name: session.userName || session.role,
          receiver_key: recipient,
          receiver_name: recUser?.name || recipient,
          subject,
          content,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Message dispatched securely!");
        setComposeOpen(false);
        setRecipient("");
        setSubject("");
        setContent("");
        fetchMessages();
      } else {
        toast.error(data.error || "Failed to send message");
      }
    } catch {
      toast.error("Network error delivering message");
    } finally {
      setSending(false);
    }
  }

  async function openMessage(m: Message) {
    setViewMessage(m);
    if (activeTab === "inbox" && m.is_read === 0) {
      try {
        await fetch(`${API_BASE_URL}/api/messages/${m.message_id}/read`, { method: "PATCH" });
        setMessages((prev) => ({
          ...prev,
          inbox: prev.inbox.map((msg) =>
            msg.message_id === m.message_id ? { ...msg, is_read: 1 } : msg
          ),
        }));
      } catch {}
    }
  }

  const displayList = activeTab === "inbox" ? messages.inbox : messages.sent;
  const unreadCount = messages.inbox.filter((m) => !m.is_read).length;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Campus Messenger
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            Encrypted inter-campus communications across faculty, administration, and scholars.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setComposeOpen(true)}
          className="px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 shadow-md shadow-pink-500/25 flex items-center gap-2 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Dispatch</span>
        </button>
      </div>

      {/* Main Container */}
      <div className="bg-white dark:bg-slate-900/80 rounded-2xl shadow-sm dark:shadow-[0_10px_30px_rgba(0,0,0,0.4)] border border-gray-200 dark:border-white/10 overflow-hidden">
        {/* Tab switchers */}
        <div className="flex border-b border-gray-100 dark:border-white/10 bg-slate-50/50 dark:bg-slate-800/40">
          <button
            type="button"
            onClick={() => setActiveTab("inbox")}
            className={`flex-1 py-3.5 px-4 font-bold text-xs sm:text-sm text-center transition cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === "inbox"
                ? "bg-white dark:bg-slate-900 text-pink-500 border-b-2 border-pink-500"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <span>Inbox</span>
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-pink-500 text-white text-[10px] font-bold">
                {unreadCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("sent")}
            className={`flex-1 py-3.5 px-4 font-bold text-xs sm:text-sm text-center transition cursor-pointer ${
              activeTab === "sent"
                ? "bg-white dark:bg-slate-900 text-pink-500 border-b-2 border-pink-500"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Dispatched Outbox
          </button>
        </div>

        {/* Message List */}
        {loading ? (
          <div className="p-12 text-center text-slate-400 animate-pulse text-sm">
            Accessing communication ledger...
          </div>
        ) : displayList.length === 0 ? (
          <div className="p-16 text-center text-slate-400 flex flex-col items-center">
            <Inbox className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-3" />
            <p className="font-semibold text-sm">No messages in this folder.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-white/5">
            {displayList.map((m) => {
              const isUnread = activeTab === "inbox" && !m.is_read;
              return (
                <div
                  key={m.message_id}
                  onClick={() => openMessage(m)}
                  className={`p-4 sm:p-5 hover:bg-slate-50 dark:hover:bg-white/[0.03] cursor-pointer transition flex items-center gap-4 ${
                    isUnread
                      ? "bg-pink-50/30 dark:bg-pink-500/5 font-semibold"
                      : ""
                  }`}
                >
                  <div
                    className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                      isUnread ? "bg-pink-500 shadow-[0_0_8px_rgba(233,69,96,0.8)]" : "bg-transparent"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <p
                        className={`text-xs sm:text-sm truncate ${
                          isUnread
                            ? "font-extrabold text-slate-900 dark:text-white"
                            : "font-semibold text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        {activeTab === "inbox" ? m.sender_name : `Recipient: ${m.receiver_name}`}
                      </p>
                      <span className="text-[11px] text-slate-400 whitespace-nowrap ml-3 font-mono">
                        {new Date(m.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p
                      className={`text-xs sm:text-sm truncate ${
                        isUnread
                          ? "text-slate-900 dark:text-slate-200"
                          : "text-slate-500 dark:text-slate-400"
                      }`}
                    >
                      {m.subject || "(No Subject)"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Compose Modal */}
      {composeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-white/10 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-white/10 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Mail className="w-4 h-4 text-pink-500" />
                <span>Compose New Dispatch</span>
              </h2>
              <button
                type="button"
                onClick={() => setComposeOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSend} className="p-6 flex-1 overflow-y-auto space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Recipient
                </label>
                <select
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-pink-500 outline-none"
                  required
                >
                  <option value="">Select Recipient Identity...</option>
                  {users.map((u) => (
                    <option key={u.user_key} value={u.user_key}>
                      {u.name} ({u.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-pink-500 outline-none"
                  placeholder="Subject of discussion"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Message Content
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full min-h-[140px] px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-pink-500 outline-none resize-y"
                  placeholder="Type your message here..."
                  required
                />
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setComposeOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sending}
                  className="flex-1 py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 shadow-md shadow-pink-500/25 cursor-pointer disabled:opacity-70 transition flex items-center justify-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{sending ? "Dispatching..." : "Send Dispatch"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Message Modal */}
      {viewMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-white/10 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-white/10 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                {viewMessage.subject || "(No Subject)"}
              </h2>
              <button
                type="button"
                onClick={() => setViewMessage(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer ml-3 shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto">
              <div className="flex justify-between items-center text-xs pb-3 border-b border-gray-100 dark:border-white/5">
                <div>
                  <span className="text-slate-400">Sender: </span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {viewMessage.sender_name}
                  </span>
                </div>
                <span className="text-slate-400 font-mono">
                  {new Date(viewMessage.created_at).toLocaleString()}
                </span>
              </div>
              <div className="text-slate-700 dark:text-slate-300 text-sm whitespace-pre-wrap leading-relaxed py-2">
                {viewMessage.content}
              </div>
            </div>
            <div className="px-6 py-3 border-t border-gray-100 dark:border-white/10 bg-slate-50 dark:bg-slate-800/50 flex justify-end">
              <button
                type="button"
                onClick={() => setViewMessage(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
