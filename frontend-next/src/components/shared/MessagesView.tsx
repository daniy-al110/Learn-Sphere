"use client";

import { useState, useEffect } from "react";
import { Icon } from "@/components/layout/icons";
import { useSession } from "@/hooks/useSession";
import { API_BASE_URL } from "@/lib/config";
import { toast } from "@/lib/toast-store";

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
  const [messages, setMessages] = useState<{ inbox: Message[], sent: Message[] }>({ inbox: [], sent: [] });
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
    } catch (err) {
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
        setUsers(data.users.filter((u: UserOpt) => u.user_key !== userKey)); // Exclude self
      }
    } catch (err) {}
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!recipient || !content) return toast.warning("Recipient and content are required.");
    setSending(true);
    try {
      const recUser = users.find(u => u.user_key === recipient);
      const res = await fetch(`${API_BASE_URL}/api/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender_key: userKey,
          sender_name: session.userName || session.role,
          receiver_key: recipient,
          receiver_name: recUser?.name || recipient,
          subject,
          content
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Message sent successfully!");
        setComposeOpen(false);
        setRecipient("");
        setSubject("");
        setContent("");
        fetchMessages();
      } else {
        toast.error(data.error || "Failed to send message");
      }
    } catch (err) {
      toast.error("Network error");
    } finally {
      setSending(false);
    }
  }

  async function openMessage(m: Message) {
    setViewMessage(m);
    if (activeTab === "inbox" && m.is_read === 0) {
      // Mark as read
      try {
        await fetch(`${API_BASE_URL}/api/messages/${m.message_id}/read`, { method: "PATCH" });
        setMessages(prev => ({
          ...prev,
          inbox: prev.inbox.map(msg => msg.message_id === m.message_id ? { ...msg, is_read: 1 } : msg)
        }));
      } catch (err) {}
    }
  }

  const displayList = activeTab === "inbox" ? messages.inbox : messages.sent;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
          <p className="text-gray-500">Communicate securely with admins, teachers, and students.</p>
        </div>
        <button 
          onClick={() => setComposeOpen(true)}
          className="bg-accent hover:bg-accent-hover text-white px-5 py-2.5 rounded-lg font-semibold flex items-center gap-2 transition cursor-pointer"
        >
          <Icon name="plus" className="w-5 h-5" />
          Compose
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex border-b border-gray-200">
          <button 
            onClick={() => setActiveTab("inbox")}
            className={`flex-1 py-3 px-4 font-semibold text-center transition ${activeTab === 'inbox' ? 'bg-gray-50 text-accent border-b-2 border-accent' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'}`}
          >
            Inbox {messages.inbox.filter(m => !m.is_read).length > 0 && `(${messages.inbox.filter(m => !m.is_read).length})`}
          </button>
          <button 
            onClick={() => setActiveTab("sent")}
            className={`flex-1 py-3 px-4 font-semibold text-center transition ${activeTab === 'sent' ? 'bg-gray-50 text-accent border-b-2 border-accent' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'}`}
          >
            Sent
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-500 animate-pulse">Loading messages...</div>
        ) : displayList.length === 0 ? (
          <div className="p-12 text-center text-gray-500 flex flex-col items-center">
            <Icon name="inbox" className="w-12 h-12 text-gray-300 mb-4" />
            <p>No messages in this folder.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {displayList.map(m => (
              <div 
                key={m.message_id} 
                onClick={() => openMessage(m)}
                className={`p-4 hover:bg-gray-50 cursor-pointer transition flex items-center gap-4 ${activeTab === 'inbox' && !m.is_read ? 'bg-blue-50/30' : ''}`}
              >
                <div className={`w-2 h-2 rounded-full ${activeTab === 'inbox' && !m.is_read ? 'bg-accent' : 'bg-transparent'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <p className={`text-sm font-bold truncate ${activeTab === 'inbox' && !m.is_read ? 'text-gray-900' : 'text-gray-700'}`}>
                      {activeTab === 'inbox' ? m.sender_name : `To: ${m.receiver_name}`}
                    </p>
                    <span className="text-xs text-gray-400 whitespace-nowrap ml-2">
                      {new Date(m.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className={`text-sm truncate ${activeTab === 'inbox' && !m.is_read ? 'text-gray-900 font-semibold' : 'text-gray-600'}`}>
                    {m.subject}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Compose Modal */}
      {composeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-lg font-bold text-gray-800">New Message</h2>
              <button onClick={() => setComposeOpen(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <Icon name="x" className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSend} className="p-6 flex-1 overflow-y-auto space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">To</label>
                <select 
                  value={recipient} 
                  onChange={e => setRecipient(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent outline-none"
                  required
                >
                  <option value="">Select Recipient...</option>
                  {users.map(u => (
                    <option key={u.user_key} value={u.user_key}>
                      {u.name} ({u.role})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Subject</label>
                <input 
                  type="text" 
                  value={subject} 
                  onChange={e => setSubject(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent outline-none"
                  placeholder="Subject of your message"
                />
              </div>
              <div className="flex-1 flex flex-col">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Message</label>
                <textarea 
                  value={content} 
                  onChange={e => setContent(e.target.value)}
                  className="w-full flex-1 min-h-[150px] px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent outline-none resize-y"
                  placeholder="Type your message here..."
                  required
                />
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setComposeOpen(false)} className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold rounded-lg cursor-pointer">
                  Cancel
                </button>
                <button type="submit" disabled={sending} className="flex-1 py-2 bg-accent hover:bg-accent-hover text-white font-semibold rounded-lg shadow-md cursor-pointer disabled:opacity-70">
                  {sending ? 'Sending...' : 'Send Message'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Message Modal */}
      {viewMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-start bg-gray-50">
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-1">{viewMessage.subject}</h2>
                <p className="text-sm text-gray-500">
                  {activeTab === 'inbox' 
                    ? <><span className="font-semibold text-gray-700">From:</span> {viewMessage.sender_name}</>
                    : <><span className="font-semibold text-gray-700">To:</span> {viewMessage.receiver_name}</>}
                </p>
                <p className="text-xs text-gray-400 mt-1">{new Date(viewMessage.created_at).toLocaleString()}</p>
              </div>
              <button onClick={() => setViewMessage(null)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <Icon name="x" className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              <div className="whitespace-pre-wrap text-gray-700">
                {viewMessage.content}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button onClick={() => setViewMessage(null)} className="py-2 px-6 bg-gray-900 hover:bg-black text-white font-semibold rounded-lg cursor-pointer">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
