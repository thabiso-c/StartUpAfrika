import React, { useState, useEffect, useRef } from "react";
import {
  Inbox, Send, FileText, Trash2, Star, Search, Mail, Plus,
  Reply, Forward, ArrowLeft, Paperclip, X, MoreVertical,
  RefreshCw, ChevronRight, AlertCircle, CheckCircle2
} from "lucide-react";

interface Email {
  id: string;
  account: string;
  folder: "inbox" | "sent" | "drafts" | "trash";
  from: string;
  to: string;
  cc?: string;
  bcc?: string;
  subject: string;
  body: string;
  htmlBody?: string;
  isRead: boolean;
  isStarred: boolean;
  labels: string[];
  attachments: Array<{ name: string; size: number; type: string }>;
  threadId?: string;
  inReplyTo?: string;
  createdAt: string;
  updatedAt: string;
  sentAt?: string;
}

const ACCOUNTS = [
  { id: "adverts@startupafrika.co.za", name: "Adverts", color: "bg-emerald-600" },
  { id: "info@startupafrika.co.za", name: "Info", color: "bg-blue-600" },
  { id: "thabiso@startupafrika.co.za", name: "Thabiso", color: "bg-purple-600" },
];

const FOLDERS = [
  { id: "inbox", label: "Inbox", icon: Inbox },
  { id: "sent", label: "Sent", icon: Send },
  { id: "drafts", label: "Drafts", icon: FileText },
  { id: "trash", label: "Trash", icon: Trash2 },
] as const;

export default function EmailClient() {
  const [selectedAccount, setSelectedAccount] = useState(ACCOUNTS[0].id);
  const [selectedFolder, setSelectedFolder] = useState<"inbox" | "sent" | "drafts" | "trash">("inbox");
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCompose, setShowCompose] = useState(false);
  const [composeMode, setComposeMode] = useState<"compose" | "reply" | "forward">("compose");
  const [replyToEmail, setReplyToEmail] = useState<Email | null>(null);

  // Compose form state
  const [composeTo, setComposeTo] = useState("");
  const [composeCc, setComposeCc] = useState("");
  const [composeBcc, setComposeBcc] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [sending, setSending] = useState(false);

  const adminToken = localStorage.getItem("sa_admin_token") || "";

  const fetchEmails = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/emails?account=${encodeURIComponent(selectedAccount)}&folder=${selectedFolder}`, {
        headers: { "x-admin-token": adminToken },
      });
      if (res.ok) {
        const data = await res.json();
        setEmails(data);
      }
    } catch (err) {
      console.error("Failed to fetch emails:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmails();
  }, [selectedAccount, selectedFolder]);

  const handleSendEmail = async () => {
    if (!composeTo || !composeSubject || !composeBody) return;

    setSending(true);
    try {
      const res = await fetch("/api/admin/emails/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": adminToken,
        },
        body: JSON.stringify({
          account: selectedAccount,
          to: composeTo,
          cc: composeCc || undefined,
          bcc: composeBcc || undefined,
          subject: composeSubject,
          body: composeBody,
        }),
      });

      if (res.ok) {
        setShowCompose(false);
        setComposeTo("");
        setComposeCc("");
        setComposeBcc("");
        setComposeSubject("");
        setComposeBody("");
        fetchEmails();
      }
    } catch (err) {
      console.error("Failed to send email:", err);
    } finally {
      setSending(false);
    }
  };

  const handleSaveDraft = async () => {
    setSending(true);
    try {
      await fetch("/api/admin/emails/draft", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": adminToken,
        },
        body: JSON.stringify({
          account: selectedAccount,
          to: composeTo,
          cc: composeCc || undefined,
          bcc: composeBcc || undefined,
          subject: composeSubject,
          body: composeBody,
        }),
      });
      setShowCompose(false);
      setComposeTo("");
      setComposeCc("");
      setComposeBcc("");
      setComposeSubject("");
      setComposeBody("");
      fetchEmails();
    } catch (err) {
      console.error("Failed to save draft:", err);
    } finally {
      setSending(false);
    }
  };

  const handleDeleteEmail = async (id: string) => {
    try {
      await fetch(`/api/admin/emails/${id}`, {
        method: "DELETE",
        headers: { "x-admin-token": adminToken },
      });
      setSelectedEmail(null);
      fetchEmails();
    } catch (err) {
      console.error("Failed to delete email:", err);
    }
  };

  const handleStarEmail = async (email: Email) => {
    try {
      await fetch(`/api/admin/emails/${email.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": adminToken,
        },
        body: JSON.stringify({ isStarred: !email.isStarred }),
      });
      fetchEmails();
    } catch (err) {
      console.error("Failed to star email:", err);
    }
  };

  const handleReply = () => {
    if (!replyToEmail) return;
    setComposeMode("reply");
    setComposeTo(replyToEmail.from);
    setComposeSubject(`Re: ${replyToEmail.subject}`);
    setComposeBody(`\n\n--- Original Message ---\nFrom: ${replyToEmail.from}\nDate: ${new Date(replyToEmail.createdAt).toLocaleString()}\n\n${replyToEmail.body}`);
    setShowCompose(true);
  };

  const handleForward = () => {
    if (!replyToEmail) return;
    setComposeMode("forward");
    setComposeTo("");
    setComposeSubject(`Fwd: ${replyToEmail.subject}`);
    setComposeBody(`\n\n--- Forwarded Message ---\nFrom: ${replyToEmail.from}\nDate: ${new Date(replyToEmail.createdAt).toLocaleString()}\n\n${replyToEmail.body}`);
    setShowCompose(true);
  };

  const filteredEmails = emails.filter((email) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      email.subject.toLowerCase().includes(query) ||
      email.from.toLowerCase().includes(query) ||
      email.to.toLowerCase().includes(query) ||
      email.body.toLowerCase().includes(query)
    );
  });

  const getAccountColor = (accountId: string) => {
    return ACCOUNTS.find((a) => a.id === accountId)?.color || "bg-gray-600";
  };

  const getAccountName = (accountId: string) => {
    return ACCOUNTS.find((a) => a.id === accountId)?.name || accountId;
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden animate-fade-in" style={{ height: "calc(100vh - 280px)", minHeight: "600px" }}>
      <div className="flex h-full">
        {/* Left Sidebar - Accounts & Folders */}
        <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col">
          {/* Account Selector */}
          <div className="p-4 border-b border-gray-200">
            <select
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="w-full px-3 py-2 text-sm font-semibold border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
            >
              {ACCOUNTS.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name} ({account.id})
                </option>
              ))}
            </select>
          </div>

          {/* Compose Button */}
          <div className="p-3">
            <button
              onClick={() => {
                setComposeMode("compose");
                setComposeTo("");
                setComposeSubject("");
                setComposeBody("");
                setShowCompose(true);
              }}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Compose
            </button>
          </div>

          {/* Folders */}
          <div className="flex-1 overflow-y-auto px-3 py-2">
            {FOLDERS.map((folder) => {
              const Icon = folder.icon;
              return (
                <button
                  key={folder.id}
                  onClick={() => setSelectedFolder(folder.id as any)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all mb-1 ${
                    selectedFolder === folder.id
                      ? "bg-emerald-50 text-emerald-700 font-semibold"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="flex-1 text-left">{folder.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Email List */}
        <div className="w-96 border-r border-gray-200 flex flex-col bg-white">
          {/* Search Bar */}
          <div className="p-3 border-b border-gray-200">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search emails..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>

          {/* Refresh Button */}
          <div className="px-3 py-2 border-b border-gray-100">
            <button
              onClick={fetchEmails}
              disabled={loading}
              className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>

          {/* Email List */}
          <div className="flex-1 overflow-y-auto">
            {filteredEmails.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <Mail className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm font-medium">No emails in {selectedFolder}</p>
              </div>
            ) : (
              filteredEmails.map((email) => (
                <div
                  key={email.id}
                  onClick={() => {
                    setSelectedEmail(email);
                    setReplyToEmail(email);
                    // Mark as read
                    if (!email.isRead) {
                      fetch(`/api/admin/emails/${email.id}`, {
                        method: "PUT",
                        headers: {
                          "Content-Type": "application/json",
                          "x-admin-token": adminToken,
                        },
                        body: JSON.stringify({ isRead: true }),
                      }).then(() => fetchEmails());
                    }
                  }}
                  className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedEmail?.id === email.id ? "bg-emerald-50 border-l-4 border-l-emerald-600" : "border-l-4 border-l-transparent"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className={`w-2 h-2 rounded-full ${getAccountColor(email.account)} shrink-0`} />
                      <span className={`text-sm font-semibold truncate ${!email.isRead ? "text-gray-900" : "text-gray-700"}`}>
                        {email.from}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStarEmail(email);
                        }}
                        className="p-1 hover:bg-gray-200 rounded"
                      >
                        <Star className={`w-3.5 h-3.5 ${email.isStarred ? "text-amber-500 fill-amber-500" : "text-gray-400"}`} />
                      </button>
                    </div>
                  </div>
                  <h4 className={`text-sm mb-1 truncate ${!email.isRead ? "font-bold text-gray-900" : "font-medium text-gray-800"}`}>
                    {email.subject || "(No subject)"}
                  </h4>
                  <p className="text-xs text-gray-500 line-clamp-2 mb-2">{email.body}</p>
                  <div className="flex items-center justify-between text-[10px] text-gray-400">
                    <span className="font-mono">{getAccountName(email.account)}</span>
                    <span>{new Date(email.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Email Detail View */}
        <div className="flex-1 flex flex-col bg-white">
          {selectedEmail ? (
            <>
              {/* Email Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <h2 className="text-xl font-bold text-gray-900 flex-1">{selectedEmail.subject || "(No subject)"}</h2>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={handleReply}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Reply"
                    >
                      <Reply className="w-4 h-4 text-gray-600" />
                    </button>
                    <button
                      onClick={handleForward}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Forward"
                    >
                      <Forward className="w-4 h-4 text-gray-600" />
                    </button>
                    <button
                      onClick={() => handleDeleteEmail(selectedEmail.id)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full ${getAccountColor(selectedEmail.account)} flex items-center justify-center text-white font-bold text-sm`}>
                      {selectedEmail.from.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900">{selectedEmail.from}</p>
                      <p className="text-xs text-gray-500">To: {selectedEmail.to}</p>
                    </div>
                  </div>
                  {selectedEmail.cc && (
                    <p className="text-xs text-gray-500 ml-13">CC: {selectedEmail.cc}</p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-gray-400 font-mono">
                    <span>{new Date(selectedEmail.createdAt).toLocaleString()}</span>
                    <span className={`px-2 py-0.5 rounded-full ${getAccountColor(selectedEmail.account)} text-white`}>
                      {getAccountName(selectedEmail.account)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Email Body */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
                  {selectedEmail.body}
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <Mail className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm font-medium">Select an email to read</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Compose Modal */}
      {showCompose && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">
                {composeMode === "compose" && "New Message"}
                {composeMode === "reply" && "Reply"}
                {composeMode === "forward" && "Forward"}
              </h3>
              <button
                onClick={() => setShowCompose(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">To</label>
                <input
                  type="email"
                  value={composeTo}
                  onChange={(e) => setComposeTo(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="recipient@example.com"
                />
              </div>

              {composeMode !== "reply" && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">CC</label>
                    <input
                      type="text"
                      value={composeCc}
                      onChange={(e) => setComposeCc(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                      placeholder="cc@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">BCC</label>
                    <input
                      type="text"
                      value={composeBcc}
                      onChange={(e) => setComposeBcc(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                      placeholder="bcc@example.com"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Subject</label>
                <input
                  type="text"
                  value={composeSubject}
                  onChange={(e) => setComposeSubject(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="Email subject"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Message</label>
                <textarea
                  value={composeBody}
                  onChange={(e) => setComposeBody(e.target.value)}
                  rows={12}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                  placeholder="Write your message..."
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSaveDraft}
                  disabled={sending}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm rounded-lg transition-colors"
                >
                  Save Draft
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowCompose(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm rounded-lg transition-colors"
                >
                  Discard
                </button>
                <button
                  onClick={handleSendEmail}
                  disabled={sending || !composeTo || !composeSubject || !composeBody}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sending ? "Sending..." : "Send"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}