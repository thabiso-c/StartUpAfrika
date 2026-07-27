import React, { useState, useEffect } from "react";
import { Users, FileText, Download, Calendar, Mail, CheckCircle2, ChevronRight, Inbox, RefreshCw, Megaphone, Sparkles, Save, Eye, Layers, DollarSign, Send, Check, Trash2, Search, Edit3, MailOpen } from "lucide-react";
import { Subscriber, Submission } from "../types";
import adBannerImg from "../assets/images/advertise_startup_afrika.jpg";
import EditorDashboard from "./editor/EditorDashboard";
import EmailClient from "./EmailClient";

interface EmailLog {
  id: string;
  to: string;
  from: string;
  subject: string;
  status: "delivered" | "bounced" | "failed" | "sent";
  timestamp: string;
  event: string;
  resendId?: string;
}

interface AdvertConfig {
  enabled: boolean;
  title: string;
  subtitle: string;
  imageUrl: string;
  ctaText: string;
  ctaLink: string;
  contactEmail: string;
  badgeText: string;
  metrics: Array<{ label: string; value: string }>;
  packages: Array<{ name: string; price: string; desc: string }>;
  updatedAt?: string;
}

interface AdInquiry {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  budget: string;
  message: string;
  date: string;
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<"subscribers" | "adverts" | "inquiries" | "submissions" | "editor" | "emails" | "email-client">("subscribers");
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [inquiries, setInquiries] = useState<AdInquiry[]>([]);
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [searchSubscriber, setSearchSubscriber] = useState("");
  const [searchInquiry, setSearchInquiry] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);

  // Advert Window Context State
  const [adConfig, setAdConfig] = useState<AdvertConfig>({
    enabled: true,
    title: "Advertise your business on StartUpAfrika",
    subtitle: "Reach African tech founders, venture builders, investors, and decision makers.",
    imageUrl: adBannerImg,
    ctaText: "Inquire / Book Ad Space",
    ctaLink: "mailto:advertise@startupafrika.co.za?subject=Ad%20Space%20Inquiry%20-%20StartUpAfrika",
    contactEmail: "advertise@startupafrika.co.za",
    badgeText: "Partner & Sponsor Placement",
    metrics: [],
    packages: [],
  });

  const [savingAd, setSavingAd] = useState(false);
  const [adSuccessMsg, setAdSuccessMsg] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [subsRes, submsRes, adRes, inqRes, emailRes] = await Promise.all([
        fetch("/api/subscribers"),
        fetch("/api/submissions"),
        fetch("/api/adverts"),
        fetch("/api/admin/inquiries", {
          headers: { "x-admin-token": localStorage.getItem("sa_admin_token") || "" }
        }).catch(() => null),
        fetch("/api/admin/email-logs", {
          headers: { "x-admin-token": localStorage.getItem("sa_admin_token") || "" }
        }).catch(() => null),
      ]);

      if (subsRes && subsRes.ok) {
        const subsData = await subsRes.json();
        setSubscribers(subsData);
      }
      if (submsRes && submsRes.ok) {
        const submsData = await submsRes.json();
        setSubmissions(submsData);
      }
      if (adRes && adRes.ok) {
        const adData = await adRes.json();
        if (adData && typeof adData === "object") {
          setAdConfig((prev) => ({
            ...prev,
            ...adData,
            imageUrl: adData.imageUrl || adBannerImg,
          }));
        }
      }
      if (inqRes && inqRes.ok) {
        const inqData = await inqRes.json();
        setInquiries(inqData);
      }
      if (emailRes && emailRes.ok) {
        const emailData = await emailRes.json();
        setEmailLogs(emailData);
      }
    } catch (err) {
      console.error("Failed to load admin dashboard statistics", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveAdConfig = async () => {
    setSavingAd(true);
    setAdSuccessMsg("");

    try {
      const token = localStorage.getItem("sa_admin_token") || "";
      const res = await fetch("/api/admin/adverts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": token,
        },
        body: JSON.stringify(adConfig),
      });

      if (res.ok) {
        setAdSuccessMsg("Main page Advert Window context saved & published live!");
        setTimeout(() => setAdSuccessMsg(""), 4000);
      } else {
        alert("Failed to save advert configuration.");
      }
    } catch (e) {
      console.error("Error saving advert context:", e);
      alert("Error connecting to server to save advert context.");
    } finally {
      setSavingAd(false);
    }
  };

  const downloadCSV = (data: any[], filename: string) => {
    if (data.length === 0) return;
    const headers = Object.keys(data[0]).join(",");
    const rows = data.map((obj) =>
      Object.values(obj)
        .map((val: any) => `"${String(val).replace(/"/g, '""')}"`)
        .join(",")
    );
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredSubscribers = subscribers.filter((s) =>
    s.email.toLowerCase().includes(searchSubscriber.toLowerCase())
  );

  const filteredInquiries = inquiries.filter(
    (inq) =>
      inq.companyName.toLowerCase().includes(searchInquiry.toLowerCase()) ||
      (inq.contactName && inq.contactName.toLowerCase().includes(searchInquiry.toLowerCase())) ||
      inq.email.toLowerCase().includes(searchInquiry.toLowerCase()) ||
      (inq.message && inq.message.toLowerCase().includes(searchInquiry.toLowerCase()))
  );

  const handleDeleteInquiry = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this ad request?")) return;

    try {
      const token = localStorage.getItem("sa_admin_token") || "";
      const res = await fetch(`/api/admin/inquiries/${id}`, {
        method: "DELETE",
        headers: { "x-admin-token": token },
      });

      if (res.ok) {
        setInquiries((prev) => prev.filter((i) => i.id !== id));
      } else {
        alert("Failed to delete ad request.");
      }
    } catch (e) {
      console.error("Error deleting inquiry:", e);
      alert("Network error while deleting ad request.");
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8" id="admin-dashboard-view">
      {/* Title & Refresh Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
            Executive Admin Control Center
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Authorized Admin: <span className="text-emerald-700 font-bold">letsokothabiso@gmail.com</span> • Manage subscribers, main page ad windows & story applications.
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="self-start sm:self-center inline-flex items-center gap-1.5 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-900 rounded-xl text-xs font-semibold shadow-sm transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh Metrics
        </button>
      </div>

      {/* Numerical Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">Subscribers</p>
            <p className="text-2xl font-mono font-extrabold text-gray-900">{subscribers.length}</p>
          </div>
        </div>

        <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-700 rounded-xl">
            <Megaphone className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">Main Page Ad</p>
            <p className="text-sm font-bold text-gray-900">{adConfig.enabled ? "Active Window" : "Paused"}</p>
          </div>
        </div>

        <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-700 rounded-xl">
            <Inbox className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">Ad Inquiries</p>
            <p className="text-2xl font-mono font-extrabold text-gray-900">{inquiries.length}</p>
          </div>
        </div>

        <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-purple-50 text-purple-700 rounded-xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">Story Drafts</p>
            <p className="text-2xl font-mono font-extrabold text-gray-900">{submissions.length}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-2 sm:gap-6 overflow-x-auto pb-1">
          <button
            onClick={() => {
              setActiveTab("subscribers");
              setSelectedSubmission(null);
            }}
            className={`pb-3 text-sm font-semibold transition-all relative flex items-center gap-1.5 ${
              activeTab === "subscribers" && !selectedSubmission
                ? "text-emerald-700 font-bold border-b-2 border-emerald-600"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Subscribers ({subscribers.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("editor");
              setSelectedSubmission(null);
            }}
            className={`pb-3 text-sm font-semibold transition-all relative flex items-center gap-1.5 ${
              activeTab === "editor" && !selectedSubmission
                ? "text-emerald-700 font-bold border-b-2 border-emerald-600"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            <Edit3 className="w-4 h-4 text-emerald-600" />
            <span>Editorial Workspace</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("adverts");
              setSelectedSubmission(null);
            }}
            className={`pb-3 text-sm font-semibold transition-all relative flex items-center gap-1.5 ${
              activeTab === "adverts" && !selectedSubmission
                ? "text-emerald-700 font-bold border-b-2 border-emerald-600"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            <Megaphone className="w-4 h-4" />
            <span>Advert Window Manager</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("inquiries");
              setSelectedSubmission(null);
            }}
            className={`pb-3 text-sm font-semibold transition-all relative flex items-center gap-1.5 ${
              activeTab === "inquiries" && !selectedSubmission
                ? "text-emerald-700 font-bold border-b-2 border-emerald-600"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            <Inbox className="w-4 h-4" />
            <span>Ad Requests ({inquiries.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("submissions")}
            className={`pb-3 text-sm font-semibold transition-all relative flex items-center gap-1.5 ${
              activeTab === "submissions" || selectedSubmission
                ? "text-emerald-700 font-bold border-b-2 border-emerald-600"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Story Submissions ({submissions.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("emails");
              setSelectedSubmission(null);
            }}
            className={`pb-3 text-sm font-semibold transition-all relative flex items-center gap-1.5 ${
              activeTab === "emails"
                ? "text-emerald-700 font-bold border-b-2 border-emerald-600"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            <MailOpen className="w-4 h-4" />
            <span>Email Logs ({emailLogs.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("email-client");
              setSelectedSubmission(null);
            }}
            className={`pb-3 text-sm font-semibold transition-all relative flex items-center gap-1.5 ${
              activeTab === "email-client"
                ? "text-emerald-700 font-bold border-b-2 border-emerald-600"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>Email Client</span>
          </button>
        </div>

        {activeTab === "subscribers" && subscribers.length > 0 && (
          <button
            onClick={() => downloadCSV(subscribers, `startup_afrika_subscribers_${Date.now()}.csv`)}
            className="mb-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg transition-colors border border-emerald-200"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV ({subscribers.length})
          </button>
        )}

        {activeTab === "inquiries" && inquiries.length > 0 && (
          <button
            onClick={() => downloadCSV(inquiries, `startup_afrika_ad_requests_${Date.now()}.csv`)}
            className="mb-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg transition-colors border border-emerald-200"
          >
            <Download className="w-3.5 h-3.5" />
            Export Ad Requests ({inquiries.length})
          </button>
        )}
      </div>

      {/* ── 1. SUBSCRIBERS PANEL ── */}
      {!selectedSubmission && activeTab === "subscribers" && (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden animate-fade-in" id="panel-subscribers">
          <div className="p-4 bg-gray-50 border-b border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-72">
              <input
                type="text"
                placeholder="Search subscriber email..."
                value={searchSubscriber}
                onChange={(e) => setSearchSubscriber(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
              />
              <Mail className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
            </div>

            <p className="text-xs text-gray-500 font-mono">
              Showing {filteredSubscribers.length} of {subscribers.length} total subscribers
            </p>
          </div>

          {filteredSubscribers.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm font-medium">No subscribers match your search query</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-500">
                <thead className="text-[11px] text-gray-500 font-mono uppercase bg-gray-50/80 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-3.5">Subscriber Email</th>
                    <th className="px-6 py-3.5">Date Subscribed</th>
                    <th className="px-6 py-3.5">Source</th>
                    <th className="px-6 py-3.5 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-mono text-xs">
                  {filteredSubscribers.map((sub, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-3.5 font-sans font-semibold text-gray-900 flex items-center gap-2.5">
                        <Mail className="w-4 h-4 text-emerald-600" />
                        {sub.email}
                      </td>
                      <td className="px-6 py-3.5 text-gray-500">
                        {sub.date ? new Date(sub.date).toLocaleDateString() : "Active"}
                      </td>
                      <td className="px-6 py-3.5 text-gray-400 uppercase text-[10px]">
                        {sub.source || "Website Footer"}
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Subscribed
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── 2. ADVERT WINDOW MANAGER PANEL ── */}
      {!selectedSubmission && activeTab === "adverts" && (
        <div className="space-y-8 animate-fade-in" id="panel-adverts">
          <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-amber-900">
            <div>
              <h4 className="font-bold text-sm flex items-center gap-2 text-amber-950">
                <Megaphone className="w-4 h-4 text-amber-600" />
                Main Page "Advertise Your Business" Window Context
              </h4>
              <p className="text-xs text-amber-800 mt-0.5">
                Edit and post the title, description, banner image, and CTA details rendered directly on the main website page.
              </p>
            </div>

            <button
              onClick={handleSaveAdConfig}
              disabled={savingAd}
              className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 shrink-0"
            >
              <Save className="w-4 h-4" />
              {savingAd ? "Publishing..." : "Post & Publish to Main Page"}
            </button>
          </div>

          {adSuccessMsg && (
            <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              {adSuccessMsg}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Editor Form */}
            <div className="lg:col-span-7 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-5">
              <h4 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-3">
                Window Content Settings
              </h4>

              <div className="flex items-center justify-between bg-gray-50 p-3 rounded-xl border border-gray-200">
                <span className="text-xs font-bold text-gray-700">Display Advert Window on Main Page</span>
                <input
                  type="checkbox"
                  checked={adConfig.enabled}
                  onChange={(e) => setAdConfig({ ...adConfig, enabled: e.target.checked })}
                  className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Headline / Title *</label>
                <input
                  type="text"
                  value={adConfig.title}
                  onChange={(e) => setAdConfig({ ...adConfig, title: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="Advertise your business on StartUpAfrika"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Subtitle / Tagline *</label>
                <textarea
                  rows={2}
                  value={adConfig.subtitle}
                  onChange={(e) => setAdConfig({ ...adConfig, subtitle: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="Reach thousands of African tech founders and decision makers..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Banner Image Asset Path / URL *
                </label>
                <input
                  type="text"
                  value={adConfig.imageUrl}
                  onChange={(e) => setAdConfig({ ...adConfig, imageUrl: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-mono"
                  placeholder="/src/assets/images/advertise_startup_afrika.jpg"
                />
                <p className="text-[10px] text-gray-400 mt-1">
                  Saved asset: <span className="font-mono text-emerald-700">/src/assets/images/advertise_startup_afrika.jpg</span>
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">CTA Button Text</label>
                  <input
                    type="text"
                    value={adConfig.ctaText}
                    onChange={(e) => setAdConfig({ ...adConfig, ctaText: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Contact Email</label>
                  <input
                    type="email"
                    value={adConfig.contactEmail}
                    onChange={(e) => setAdConfig({ ...adConfig, contactEmail: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Top Badge Label</label>
                <input
                  type="text"
                  value={adConfig.badgeText}
                  onChange={(e) => setAdConfig({ ...adConfig, badgeText: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl outline-none"
                  placeholder="Partner & Sponsor Placement"
                />
              </div>
            </div>

            {/* Live Visual Preview */}
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-emerald-600" />
                  Live Preview on Main Page
                </h4>
                <span className="text-[10px] font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  REAL-TIME
                </span>
              </div>

              <div className="bg-gradient-to-br from-stone-900 via-stone-900 to-emerald-950 rounded-2xl p-6 border border-emerald-800/40 shadow-xl text-white space-y-4">
                <div className="relative group overflow-hidden rounded-xl border border-emerald-500/20 bg-black/40">
                  <img
                    src={adConfig.imageUrl || adBannerImg}
                    alt="Ad Preview"
                    className="w-full h-44 object-cover rounded-xl"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = adBannerImg;
                    }}
                  />
                  <div className="absolute top-2 left-2 bg-stone-900/80 backdrop-blur-md text-emerald-400 text-[9px] font-mono font-bold tracking-wider px-2 py-0.5 rounded border border-emerald-500/30">
                    {adConfig.badgeText || "ADVERTISEMENT WINDOW"}
                  </div>
                </div>

                <div>
                  <h5 className="text-lg font-extrabold text-white leading-snug">
                    {adConfig.title || "Advertise your business on StartUpAfrika"}
                  </h5>
                  <p className="text-xs text-gray-300 mt-1 line-clamp-2">
                    {adConfig.subtitle}
                  </p>
                </div>

                <div className="pt-1">
                  <button className="w-full py-2.5 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow">
                    {adConfig.ctaText || "Inquire / Book Ad Space"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 3. AD REQUESTS INBOX ── */}
      {!selectedSubmission && activeTab === "inquiries" && (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden animate-fade-in" id="panel-inquiries">
          <div className="p-4 bg-gray-50 border-b border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-72">
              <input
                type="text"
                placeholder="Search ad requests (company, email, message)..."
                value={searchInquiry}
                onChange={(e) => setSearchInquiry(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
              />
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
            </div>

            <p className="text-xs text-gray-500 font-mono">
              Showing {filteredInquiries.length} of {inquiries.length} total ad requests
            </p>
          </div>

          {filteredInquiries.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              <Inbox className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm font-medium">
                {inquiries.length === 0 ? "No ad requests submitted yet" : "No ad requests match your search"}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Requests sent via the main page "Inquire / Book Ad Space" window will appear here instantly.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredInquiries.map((inq) => (
                <div key={inq.id} className="p-6 hover:bg-gray-50/50 transition-colors space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm">
                        {inq.companyName ? inq.companyName[0].toUpperCase() : "A"}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-gray-900">{inq.companyName}</h4>
                        <p className="text-xs text-gray-500">
                          Contact: <span className="font-semibold text-gray-800">{inq.contactName || "N/A"}</span> ({inq.email})
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono font-bold bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-md border border-emerald-200">
                        Budget: {inq.budget || "N/A"}
                      </span>
                      <span className="text-xs font-mono text-gray-400">
                        {inq.date ? new Date(inq.date).toLocaleDateString() : ""}
                      </span>
                    </div>
                  </div>

                  {inq.message && (
                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-xs text-gray-700">
                      <span className="font-bold text-gray-500 block mb-0.5">Campaign Details:</span>
                      {inq.message}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1">
                    <a
                      href={`mailto:${inq.email}?subject=StartUpAfrika%20Ad%20Space%20Inquiry%20Response`}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:underline"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Reply via Email ({inq.email})
                    </a>

                    <button
                      onClick={() => handleDeleteInquiry(inq.id)}
                      className="inline-flex items-center gap-1 text-xs text-rose-500 hover:text-rose-700 transition-colors font-medium"
                      title="Delete this request"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── 6. EMAIL CLIENT PANEL ── */}
      {!selectedSubmission && activeTab === "email-client" && (
        <EmailClient />
      )}

      {/* ── 5. EDITORIAL WORKSPACE PANEL ── */}
      {!selectedSubmission && activeTab === "editor" && (
        <div className="bg-[#0e1310] border border-stone-800 rounded-2xl shadow-xl overflow-hidden animate-fade-in min-h-[750px]" id="panel-editor">
          <EditorDashboard
            token={localStorage.getItem("sa_admin_token") || ""}
            onLogout={() => {}}
            isEmbedded={true}
          />
        </div>
      )}

      {/* ── 5. EMAIL LOGS PANEL ── */}
      {!selectedSubmission && activeTab === "emails" && (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden animate-fade-in" id="panel-emails">
          <div className="p-4 bg-gray-50 border-b border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Resend Email Webhook Logs</h3>
              <p className="text-xs text-gray-500 mt-0.5">Real-time email delivery events from Resend via webhook</p>
            </div>
            <button
              onClick={fetchData}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg transition-colors border border-emerald-200"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>

          {emailLogs.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              <MailOpen className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm font-medium">No email logs yet</p>
              <p className="text-xs text-gray-400 mt-1">Emails sent via Resend will appear here automatically</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-500">
                <thead className="text-[11px] text-gray-500 font-mono uppercase bg-gray-50/80 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5">Recipient</th>
                    <th className="px-6 py-3.5">Subject</th>
                    <th className="px-6 py-3.5">Event</th>
                    <th className="px-6 py-3.5">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-mono text-xs">
                  {emailLogs.map((log, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-3.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold ${
                          log.status === "delivered" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                          log.status === "bounced" ? "bg-amber-50 text-amber-700 border border-amber-200" :
                          log.status === "failed" ? "bg-rose-50 text-rose-700 border border-rose-200" :
                          "bg-gray-50 text-gray-700 border border-gray-200"
                        }`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 font-sans font-semibold text-gray-900">{log.to}</td>
                      <td className="px-6 py-3.5 text-gray-600 max-w-xs truncate">{log.subject}</td>
                      <td className="px-6 py-3.5 text-gray-500">{log.event}</td>
                      <td className="px-6 py-3.5 text-gray-400">
                        {log.timestamp ? new Date(log.timestamp).toLocaleString() : "N/A"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── 4. STORY SUBMISSIONS PANEL ── */}
      {!selectedSubmission && activeTab === "submissions" && (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden animate-fade-in" id="panel-submissions">
          {submissions.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              <Inbox className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm font-medium">No pending founder submissions yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {submissions.map((sub) => (
                <div
                  key={sub.id}
                  onClick={() => setSelectedSubmission(sub)}
                  className="p-6 hover:bg-gray-50/50 cursor-pointer flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold font-mono border border-emerald-100">
                      {sub.startupName[0]}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">
                        {sub.startupName} Blueprint draft
                      </h4>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Submitted by <span className="font-semibold">{sub.founderName}</span> ({sub.email})
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-gray-400 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(sub.date).toLocaleDateString()}
                    </span>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Expanded Submission Detail View */}
      {selectedSubmission && (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 sm:p-8 animate-fade-in" id="submission-detail-pane">
          <div className="flex items-center justify-between border-b border-gray-100 pb-5 mb-6">
            <div>
              <button
                onClick={() => setSelectedSubmission(null)}
                className="text-xs font-semibold text-emerald-700 hover:underline mb-1 flex items-center gap-1"
              >
                &larr; Back to Applications
              </button>
              <h3 className="text-lg font-bold text-gray-900">
                Application Review: {selectedSubmission.startupName}
              </h3>
            </div>
            <span className="text-xs font-mono text-gray-400 bg-gray-50 px-2.5 py-1 rounded-md border border-gray-100">
              {selectedSubmission.id}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
            <div>
              <p className="text-[10px] font-mono text-gray-400 uppercase tracking-wider mb-0.5">Founder Name</p>
              <p className="text-sm font-bold text-gray-900">{selectedSubmission.founderName}</p>
            </div>
            <div>
              <p className="text-[10px] font-mono text-gray-400 uppercase tracking-wider mb-0.5">Product Name</p>
              <p className="text-sm font-bold text-gray-900">{selectedSubmission.startupName}</p>
            </div>
            <div>
              <p className="text-[10px] font-mono text-gray-400 uppercase tracking-wider mb-0.5">Contact Email</p>
              <p className="text-sm font-semibold text-emerald-800 underline">{selectedSubmission.email}</p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h5 className="text-xs font-mono font-bold text-gray-400 uppercase tracking-wider mb-2">1. The Spark</h5>
              <p className="text-sm text-gray-700 leading-relaxed bg-white border border-gray-100 p-3 rounded-xl">
                {selectedSubmission.answers.spark}
              </p>
            </div>

            <div>
              <h5 className="text-xs font-mono font-bold text-gray-400 uppercase tracking-wider mb-2">2. The MVP</h5>
              <p className="text-sm text-gray-700 leading-relaxed bg-white border border-gray-100 p-3 rounded-xl">
                {selectedSubmission.answers.mvp}
              </p>
            </div>

            <div>
              <h5 className="text-xs font-mono font-bold text-gray-400 uppercase tracking-wider mb-2">3. The Tech Stack</h5>
              <p className="text-sm text-gray-700 leading-relaxed bg-white border border-gray-100 p-3 rounded-xl font-mono text-xs">
                {selectedSubmission.answers.techStack}
              </p>
            </div>

            <div>
              <h5 className="text-xs font-mono font-bold text-gray-400 uppercase tracking-wider mb-2">4. Traction Path</h5>
              <p className="text-sm text-gray-700 leading-relaxed bg-white border border-gray-100 p-3 rounded-xl">
                {selectedSubmission.answers.traction}
              </p>
            </div>

            <div>
              <h5 className="text-xs font-mono font-bold text-gray-400 uppercase tracking-wider mb-2">5. Revenue Model</h5>
              <p className="text-sm text-gray-700 leading-relaxed bg-white border border-gray-100 p-3 rounded-xl">
                {selectedSubmission.answers.revenue}
              </p>
            </div>

            <div>
              <h5 className="text-xs font-mono font-bold text-gray-400 uppercase tracking-wider mb-2">6. The Lesson</h5>
              <p className="text-sm text-gray-700 leading-relaxed bg-rose-50/20 border border-rose-100 p-3 rounded-xl">
                {selectedSubmission.answers.lesson}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
