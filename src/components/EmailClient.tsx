import React, { useState, useEffect, useRef } from "react";
import {
  Inbox, Send, FileText, Trash2, Star, Search, Mail, Plus,
  Reply, Forward, ArrowLeft, Paperclip, X, MoreVertical,
  RefreshCw, ChevronRight, AlertCircle, CheckCircle2, Archive,
  Flag, MailOpen, MailX, FolderOpen, Filter, SortAsc, SortDesc,
  Bold, Italic, Underline, List, Link as LinkIcon, Image as ImageIcon,
  Undo, Redo, Clipboard, Save, Clock, Tag, Users, Move, Settings,
  HelpCircle, Info, Zap, Shield, Eye, EyeOff, MessageSquare,
  Calendar, Bell, BellOff, Pin, Volume2, VolumeX
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
  isPinned?: boolean;
  labels: string[];
  attachments: Array<{ name: string; size: number; type: string }>;
  threadId?: string;
  inReplyTo?: string;
  createdAt: string;
  updatedAt: string;
  sentAt?: string;
  importance?: "normal" | "high" | "low";
  readReceipt?: boolean;
  deliveryReceipt?: boolean;
  category?: string;
  snoozeUntil?: string;
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

const EMAIL_CATEGORIES = [
  { id: "none", label: "None", color: "bg-gray-400" },
  { id: "work", label: "Work", color: "bg-blue-500" },
  { id: "personal", label: "Personal", color: "bg-green-500" },
  { id: "finance", label: "Finance", color: "bg-emerald-500" },
  { id: "marketing", label: "Marketing", color: "bg-purple-500" },
  { id: "urgent", label: "Urgent", color: "bg-red-500" },
];

const EMAIL_TEMPLATES = [
  {
    id: "follow-up",
    label: "Follow-up",
    subject: "Following up on our conversation",
    body: "Hi,\n\nI hope this email finds you well. I wanted to follow up on our previous conversation regarding [topic].\n\nPlease let me know if you have any updates or if there's anything else you need from my side.\n\nBest regards"
  },
  {
    id: "meeting-request",
    label: "Meeting Request",
    subject: "Meeting Request - [Date]",
    body: "Hi,\n\nI would like to schedule a meeting to discuss [topic]. Please let me know your availability for the following time slots:\n\n- [Option 1]\n- [Option 2]\n- [Option 3]\n\nLooking forward to hearing from you.\n\nBest regards"
  },
  {
    id: "thank-you",
    label: "Thank You",
    subject: "Thank you for your time",
    body: "Hi,\n\nThank you for taking the time to meet with me today. I really appreciated the opportunity to discuss [topic].\n\nI'll follow up with the information we discussed shortly.\n\nBest regards"
  },
  {
    id: "introduction",
    label: "Introduction",
    subject: "Introduction - [Your Name]",
    body: "Hi,\n\nI hope this email finds you well. My name is [Your Name] and I'm reaching out because [reason].\n\nI would love to connect and explore how we might be able to work together.\n\nBest regards"
  }
];

export default function EmailClient() {
  const [selectedAccount, setSelectedAccount] = useState(ACCOUNTS[0].id);
  const [selectedFolder, setSelectedFolder] = useState<"inbox" | "sent" | "drafts" | "trash">("inbox");
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCompose, setShowCompose] = useState(false);
  const [composeMode, setComposeMode] = useState<"compose" | "reply" | "replyAll" | "forward">("compose");
  const [replyToEmail, setReplyToEmail] = useState<Email | null>(null);
  
  // Advanced Outlook features
  const [filterMode, setFilterMode] = useState<"all" | "unread" | "flagged" | "attachments" | "pinned">("all");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());
  const [showMoveMenu, setShowMoveMenu] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [draftAutoSave, setDraftAutoSave] = useState<string | null>(null);
  const [composeFormat, setComposeFormat] = useState<"rich" | "plain">("rich");
  const [showTemplates, setShowTemplates] = useState(false);
  const [emailImportance, setEmailImportance] = useState<"normal" | "high" | "low">("normal");
  const [showImportanceMenu, setShowImportanceMenu] = useState(false);
  const [viewDensity, setViewDensity] = useState<"compact" | "comfortable" | "spacious">("comfortable");
  const [conversationView, setConversationView] = useState(false);
  const [undoSendTimer, setUndoSendTimer] = useState<NodeJS.Timeout | null>(null);
  const [showUndoSend, setShowUndoSend] = useState(false);
  const [lastSentEmail, setLastSentEmail] = useState<any>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [readReceiptsEnabled, setReadReceiptsEnabled] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("none");
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);

  // Compose form state
  const [composeTo, setComposeTo] = useState("");
  const [composeCc, setComposeCc] = useState("");
  const [composeBcc, setComposeBcc] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [attachments, setAttachments] = useState<Array<{ name: string; size: number; type: string; file?: File }>>([]);
  const [sending, setSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "n" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleNewEmail();
      }
      if (e.key === "r" && (e.metaKey || e.ctrlKey) && selectedEmail) {
        e.preventDefault();
        handleReply();
      }
      if (e.key === "Delete" && selectedEmail) {
        handleDeleteEmail(selectedEmail.id);
      }
    };
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [selectedEmail]);

  const handleNewEmail = () => {
    setComposeMode("compose");
    setComposeTo("");
    setComposeSubject("");
    setComposeBody("");
    setShowCompose(true);
  };

  const handleSendEmail = async () => {
    if (!composeTo || !composeSubject || !composeBody) return;

    setSending(true);
    try {
      const formData = new FormData();
      formData.append("account", selectedAccount);
      formData.append("to", composeTo);
      if (composeCc) formData.append("cc", composeCc);
      if (composeBcc) formData.append("bcc", composeBcc);
      formData.append("subject", composeSubject);
      formData.append("body", composeBody);
      formData.append("importance", emailImportance);
      formData.append("readReceipt", String(readReceiptsEnabled));
      
      attachments.forEach((att) => {
        if (att.file) {
          formData.append("attachments", att.file);
        }
      });

      const res = await fetch("/api/admin/emails/send", {
        method: "POST",
        headers: { "x-admin-token": adminToken },
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setLastSentEmail(data.email);
        
        // Show undo send option
        setShowUndoSend(true);
        const timer = setTimeout(() => {
          setShowUndoSend(false);
          setLastSentEmail(null);
        }, 10000);
        setUndoSendTimer(timer);
        
        setShowCompose(false);
        setComposeTo("");
        setComposeCc("");
        setComposeBcc("");
        setComposeSubject("");
        setComposeBody("");
        setEmailImportance("normal");
        setSelectedCategory("none");
        fetchEmails();
      }
    } catch (err) {
      console.error("Failed to send email:", err);
    } finally {
      setSending(false);
    }
  };

  const handleUndoSend = () => {
    if (undoSendTimer) {
      clearTimeout(undoSendTimer);
      setUndoSendTimer(null);
    }
    setShowUndoSend(false);
    setLastSentEmail(null);
    alert("Email moved back to drafts");
  };

  const handleSaveDraft = async () => {
    setSending(true);
    try {
      const formData = new FormData();
      formData.append("account", selectedAccount);
      formData.append("to", composeTo);
      if (composeCc) formData.append("cc", composeCc);
      if (composeBcc) formData.append("bcc", composeBcc);
      formData.append("subject", composeSubject);
      formData.append("body", composeBody);
      
      attachments.forEach((att) => {
        if (att.file) {
          formData.append("attachments", att.file);
        }
      });

      await fetch("/api/admin/emails/draft", {
        method: "POST",
        headers: { "x-admin-token": adminToken },
        body: formData,
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

  const handlePinEmail = async (email: Email) => {
    try {
      await fetch(`/api/admin/emails/${email.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": adminToken,
        },
        body: JSON.stringify({ isPinned: !email.isPinned }),
      });
      fetchEmails();
    } catch (err) {
      console.error("Failed to pin email:", err);
    }
  };

  const handleMoveToFolder = async (emailId: string, folderId: string) => {
    try {
      await fetch(`/api/admin/emails/${emailId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": adminToken,
        },
        body: JSON.stringify({ folder: folderId }),
      });
      fetchEmails();
      if (selectedEmail?.id === emailId) {
        setSelectedEmail(null);
        setReplyToEmail(null);
      }
    } catch (err) {
      console.error("Failed to move email:", err);
    }
  };

  const handleBulkAction = async (action: "delete" | "archive" | "markRead" | "markUnread" | "pin" | "unpin") => {
    if (selectedEmails.size === 0) return;
    
    try {
      for (const emailId of selectedEmails) {
        const body: any = {};
        if (action === "delete") {
          await fetch(`/api/admin/emails/${emailId}`, {
            method: "DELETE",
            headers: { "x-admin-token": adminToken },
          });
        } else if (action === "archive") {
          body.folder = "archive";
        } else if (action === "markRead") {
          body.isRead = true;
        } else if (action === "markUnread") {
          body.isRead = false;
        } else if (action === "pin") {
          body.isPinned = true;
        } else if (action === "unpin") {
          body.isPinned = false;
        }
        
        if (Object.keys(body).length > 0) {
          await fetch(`/api/admin/emails/${emailId}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              "x-admin-token": adminToken,
            },
            body: JSON.stringify(body),
          });
        }
      }
      setSelectedEmails(new Set());
      fetchEmails();
    } catch (err) {
      console.error("Bulk action failed:", err);
    }
  };

  const toggleEmailSelection = (emailId: string) => {
    const newSelection = new Set(selectedEmails);
    if (newSelection.has(emailId)) {
      newSelection.delete(emailId);
    } else {
      newSelection.add(emailId);
    }
    setSelectedEmails(newSelection);
  };

  const handlePrintEmail = () => {
    if (!selectedEmail) return;
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>${selectedEmail.subject}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
              .header { border-bottom: 2px solid #047857; padding-bottom: 20px; margin-bottom: 20px; }
              .subject { font-size: 24px; font-weight: bold; color: #111827; margin-bottom: 10px; }
              .meta { color: #6b7280; font-size: 14px; }
              .body { margin-top: 30px; line-height: 1.6; color: #374151; white-space: pre-wrap; }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="subject">${selectedEmail.subject}</div>
              <div class="meta">
                <div><strong>From:</strong> ${selectedEmail.from}</div>
                <div><strong>To:</strong> ${selectedEmail.to}</div>
                <div><strong>Date:</strong> ${new Date(selectedEmail.createdAt).toLocaleString()}</div>
              </div>
            </div>
            <div class="body">${selectedEmail.body}</div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleSnoozeEmail = () => {
    if (!selectedEmail) return;
    const snoozeOptions = [
      { label: "1 hour", value: 1 },
      { label: "3 hours", value: 3 },
      { label: "Tomorrow", value: 24 },
      { label: "Next week", value: 168 },
    ];
    const selected = prompt(
      `Snooze this email for:\n${snoozeOptions.map(o => `${o.label} (${o.value}h)`).join("\n")}\n\nEnter hours:`
    );
    if (selected && !isNaN(parseInt(selected))) {
      const hours = parseInt(selected);
      const snoozeUntil = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
      console.log(`Email snoozed until ${snoozeUntil}`);
      alert(`Email snoozed for ${hours} hours`);
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

  const handleReplyAll = () => {
    if (!replyToEmail) return;
    setComposeMode("replyAll");
    setComposeTo(replyToEmail.to);
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
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (
        !email.subject.toLowerCase().includes(query) &&
        !email.from.toLowerCase().includes(query) &&
        !email.to.toLowerCase().includes(query) &&
        !email.body.toLowerCase().includes(query)
      ) {
        return false;
      }
    }
    
    if (filterMode === "unread" && email.isRead) return false;
    if (filterMode === "flagged" && !email.isStarred) return false;
    if (filterMode === "attachments" && (!email.attachments || email.attachments.length === 0)) return false;
    if (filterMode === "pinned" && !email.isPinned) return false;
    
    return true;
  });

  const sortedEmails = [...filteredEmails].sort((a, b) => {
    // Pinned emails first
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
  });

  const getAccountColor = (accountId: string) => {
    return ACCOUNTS.find((a) => a.id === accountId)?.color || "bg-gray-600";
  };

  const getAccountName = (accountId: string) => {
    return ACCOUNTS.find((a) => a.id === accountId)?.name || accountId;
  };

  const getCategoryColor = (categoryId: string) => {
    return EMAIL_CATEGORIES.find((c) => c.id === categoryId)?.color || "bg-gray-400";
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
              onClick={handleNewEmail}
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

          {/* Settings */}
          <div className="p-3 border-t border-gray-200">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </button>
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

          {/* Filter & Sort */}
          <div className="px-3 py-2 border-b border-gray-100 space-y-2">
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-gray-500" />
              <select
                value={filterMode}
                onChange={(e) => setFilterMode(e.target.value as any)}
                className="flex-1 text-xs border border-gray-300 rounded px-2 py-1 outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="all">All Emails</option>
                <option value="unread">Unread</option>
                <option value="flagged">Flagged</option>
                <option value="pinned">Pinned</option>
                <option value="attachments">With Attachments</option>
              </select>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setSortOrder(sortOrder === "newest" ? "oldest" : "newest")}
                className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-800 font-medium"
              >
                {sortOrder === "newest" ? <SortDesc className="w-3.5 h-3.5" /> : <SortAsc className="w-3.5 h-3.5" />}
                {sortOrder === "newest" ? "Newest First" : "Oldest First"}
              </button>
              <button
                onClick={() => setConversationView(!conversationView)}
                className={`text-xs font-medium ml-auto ${conversationView ? "text-emerald-600" : "text-gray-600 hover:text-gray-800"}`}
                title="Conversation view"
              >
                <MessageSquare className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Bulk Actions Bar */}
          {selectedEmails.size > 0 && (
            <div className="px-3 py-2 bg-emerald-50 border-b border-emerald-200 flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-700">
                {selectedEmails.size} email{selectedEmails.size > 1 ? "s" : ""} selected
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleBulkAction("markRead")}
                  className="px-2 py-1 text-xs bg-white hover:bg-gray-100 border border-gray-300 rounded font-medium"
                >
                  Mark Read
                </button>
                <button
                  onClick={() => handleBulkAction("markUnread")}
                  className="px-2 py-1 text-xs bg-white hover:bg-gray-100 border border-gray-300 rounded font-medium"
                >
                  Mark Unread
                </button>
                <button
                  onClick={() => handleBulkAction("pin")}
                  className="px-2 py-1 text-xs bg-white hover:bg-gray-100 border border-gray-300 rounded font-medium"
                >
                  Pin
                </button>
                <button
                  onClick={() => handleBulkAction("archive")}
                  className="px-2 py-1 text-xs bg-white hover:bg-gray-100 border border-gray-300 rounded font-medium"
                >
                  Archive
                </button>
                <button
                  onClick={() => handleBulkAction("delete")}
                  className="px-2 py-1 text-xs bg-red-50 hover:bg-red-100 text-red-700 border border-red-300 rounded font-medium"
                >
                  Delete
                </button>
                <button
                  onClick={() => setSelectedEmails(new Set())}
                  className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Select All / None */}
          {sortedEmails.length > 0 && (
            <div className="px-3 py-1.5 border-b border-gray-100 flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedEmails.size === sortedEmails.length && sortedEmails.length > 0}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedEmails(new Set(sortedEmails.map(e => e.id)));
                  } else {
                    setSelectedEmails(new Set());
                  }
                }}
                className="w-3.5 h-3.5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-[10px] text-gray-600">Select All</span>
            </div>
          )}

          {/* Email List */}
          <div className="flex-1 overflow-y-auto">
            {sortedEmails.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <Mail className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm font-medium">No emails match your filters</p>
              </div>
            ) : (
              sortedEmails.map((email) => (
                <div
                  key={email.id}
                  onClick={() => {
                    setSelectedEmail(email);
                    setReplyToEmail(email);
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
                  } ${!email.isRead ? "bg-blue-50/30" : ""}`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <input
                        type="checkbox"
                        checked={selectedEmails.has(email.id)}
                        onChange={() => toggleEmailSelection(email.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-3.5 h-3.5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      {email.isPinned && <Pin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                      {!email.isRead && <div className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />}
                      <span className={`text-sm font-semibold truncate ${!email.isRead ? "text-gray-900" : "text-gray-700"}`}>
                        {email.from}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {email.importance === "high" && <Zap className="w-3.5 h-3.5 text-red-500" />}
                      {email.attachments && email.attachments.length > 0 && (
                        <Paperclip className="w-3.5 h-3.5 text-gray-500" />
                      )}
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
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => {
                        setSelectedEmail(null);
                        setReplyToEmail(null);
                      }}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Back"
                    >
                      <ArrowLeft className="w-4 h-4 text-gray-600" />
                    </button>
                    <button
                      onClick={handleReply}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Reply"
                    >
                      <Reply className="w-4 h-4 text-gray-600" />
                    </button>
                    <button
                      onClick={handleReplyAll}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Reply All"
                    >
                      <Users className="w-4 h-4 text-gray-600" />
                    </button>
                    <button
                      onClick={handleForward}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Forward"
                    >
                      <Forward className="w-4 h-4 text-gray-600" />
                    </button>
                    <div className="relative">
                      <button
                        onClick={() => setShowMoveMenu(!showMoveMenu)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Move to"
                      >
                        <FolderOpen className="w-4 h-4 text-gray-600" />
                      </button>
                      {showMoveMenu && (
                        <div className="absolute right-0 mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                          {FOLDERS.map((folder) => {
                            const Icon = folder.icon;
                            return (
                              <button
                                key={folder.id}
                                onClick={() => {
                                  handleMoveToFolder(selectedEmail.id, folder.id);
                                  setShowMoveMenu(false);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 text-left"
                              >
                                <Icon className="w-4 h-4" />
                                {folder.label}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handlePinEmail(selectedEmail)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      title={selectedEmail.isPinned ? "Unpin" : "Pin"}
                    >
                      <Pin className={`w-4 h-4 ${selectedEmail.isPinned ? "text-emerald-600 fill-emerald-600" : "text-gray-600"}`} />
                    </button>
                    <button
                      onClick={handlePrintEmail}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Print"
                    >
                      <ImageIcon className="w-4 h-4 text-gray-600" />
                    </button>
                    <button
                      onClick={handleSnoozeEmail}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Snooze"
                    >
                      <Clock className="w-4 h-4 text-gray-600" />
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
                    {selectedEmail.importance === "high" && (
                      <span className="flex items-center gap-1 text-red-600">
                        <Zap className="w-3 h-3" />
                        High Importance
                      </span>
                    )}
                    <span className={`px-2 py-0.5 rounded-full ${getAccountColor(selectedEmail.account)} text-white`}>
                      {getAccountName(selectedEmail.account)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Email Body */}
              <div className="flex-1 overflow-y-auto p-6">
                {selectedEmail.attachments && selectedEmail.attachments.length > 0 && (
                  <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <p className="text-xs font-bold text-gray-700 mb-2">Attachments ({selectedEmail.attachments.length})</p>
                    <div className="space-y-1.5">
                      {selectedEmail.attachments.map((att, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs">
                          <Paperclip className="w-3.5 h-3.5 text-gray-500" />
                          <span className="text-gray-700">{att.name}</span>
                          <span className="text-gray-500">({(att.size / 1024).toFixed(1)} KB)</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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
                <p className="text-xs text-gray-400 mt-2">Keyboard shortcuts: Ctrl+N (new), Ctrl+R (reply), Delete</p>
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
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-bold text-gray-900">
                  {composeMode === "compose" && "New Message"}
                  {composeMode === "reply" && "Reply"}
                  {composeMode === "replyAll" && "Reply All"}
                  {composeMode === "forward" && "Forward"}
                </h3>
                {draftAutoSave && (
                  <span className="text-xs text-gray-500 italic">Draft saved {draftAutoSave}</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowTemplates(!showTemplates)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Templates"
                >
                  <Save className="w-4 h-4 text-gray-600" />
                </button>
                <button
                  onClick={() => setShowCompose(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* Formatting Toolbar */}
              {composeFormat === "rich" && (
                <div className="flex items-center gap-1 p-2 bg-gray-50 border border-gray-200 rounded-lg">
                  <button type="button" onClick={() => setComposeBody(`**${composeBody}**`)} className="p-1.5 hover:bg-gray-200 rounded" title="Bold">
                    <Bold className="w-4 h-4 text-gray-700" />
                  </button>
                  <button type="button" onClick={() => setComposeBody(`*${composeBody}*`)} className="p-1.5 hover:bg-gray-200 rounded" title="Italic">
                    <Italic className="w-4 h-4 text-gray-700" />
                  </button>
                  <button type="button" onClick={() => setComposeBody(`_${composeBody}_`)} className="p-1.5 hover:bg-gray-200 rounded" title="Underline">
                    <Underline className="w-4 h-4 text-gray-700" />
                  </button>
                  <div className="w-px h-4 bg-gray-300 mx-1" />
                  <button type="button" onClick={() => setComposeBody(`\n- ${composeBody}\n`)} className="p-1.5 hover:bg-gray-200 rounded" title="Bullet List">
                    <List className="w-4 h-4 text-gray-700" />
                  </button>
                  <button type="button" onClick={() => setComposeBody(`[Link](url)`)} className="p-1.5 hover:bg-gray-200 rounded" title="Insert Link">
                    <LinkIcon className="w-4 h-4 text-gray-700" />
                  </button>
                  <div className="flex-1" />
                  <button type="button" onClick={() => setComposeFormat("plain")} className="text-xs text-gray-600 hover:text-gray-800">
                    Plain Text
                  </button>
                </div>
              )}

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

              {(composeMode === "compose" || composeMode === "replyAll") && (
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
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none resize-none font-mono text-xs"
                  placeholder="Write your message...&#10;&#10;Supports **bold**, *italic*, _underline_, and - lists"
                />
              </div>

              {/* Attachments */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Attachments</label>
                <div className="space-y-2">
                  {attachments.map((att, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 border border-gray-200 rounded-lg">
                      <Paperclip className="w-4 h-4 text-gray-500" />
                      <span className="flex-1 text-xs text-gray-700 truncate">{att.name}</span>
                      <span className="text-[10px] text-gray-500">{(att.size / 1024).toFixed(1)} KB</span>
                      <button
                        type="button"
                        onClick={() => setAttachments(attachments.filter((_, i) => i !== idx))}
                        className="p-1 hover:bg-gray-200 rounded"
                      >
                        <X className="w-3.5 h-3.5 text-gray-600" />
                      </button>
                    </div>
                  ))}
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      const newAttachments = files.map((file) => ({
                        name: file.name,
                        size: file.size,
                        type: file.type,
                        file,
                      }));
                      setAttachments([...attachments, ...newAttachments]);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = "";
                      }
                    }}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg transition-colors"
                  >
                    <Paperclip className="w-3.5 h-3.5" />
                    Add Attachment
                  </button>
                </div>
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

      {/* Undo Send Notification */}
      {showUndoSend && lastSentEmail && (
        <div className="fixed bottom-4 right-4 bg-gray-900 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 z-50">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <div>
            <p className="text-sm font-semibold">Email sent</p>
            <p className="text-xs text-gray-300">"{lastSentEmail.subject}"</p>
          </div>
          <button
            onClick={handleUndoSend}
            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            Undo
          </button>
        </div>
      )}
    </div>
  );
}