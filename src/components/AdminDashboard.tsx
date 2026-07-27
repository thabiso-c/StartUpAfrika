import React, { useState, useEffect } from "react";
import {
  Users, FileText, Download, Calendar, Mail, CheckCircle2, ChevronRight,
  Inbox, RefreshCw, Megaphone, Sparkles, Save, Eye, Layers, DollarSign,
  Send, Check, Trash2, Search, Edit3, MailOpen, LayoutDashboard,
  BarChart3, TrendingUp, Globe, Settings, Bell, User, LogOut,
  Menu, X, Copy, ExternalLink, Clock, Filter, MoreVertical,
  Shield, Zap, Target, Award, ArrowUpRight, ArrowDownRight
} from "lucide-react";
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

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "subscribers", label: "Subscribers", icon: Users },
  { id: "editor", label: "Editorial", icon: Edit3 },
  { id: "adverts", label: "Ad Manager", icon: Megaphone },
  { id: "inquiries", label: "Ad Requests", icon: Inbox },
  { id: "submissions", label: "Submissions", icon: FileText },
  { id: "emails", label: "Email Logs", icon: MailOpen },
  { id: "email-client", label: "Email Client", icon: Mail },
] as const;

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "subscribers" | "adverts" | "inquiries" | "submissions" | "editor" | "emails" | "email-client">("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [inquiries, setInquiries] = useState<AdInquiry[]>([]);
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [searchSubscriber, setSearchSubscriber] = useState("");
  const [searchInquiry, setSearchInquiry] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);

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

  const StatCard = ({ icon: Icon, label, value, subtext, color, trend }: any) => (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all group">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon className="w-6 h-6" />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-semibold ${trend > 0 ? "text-emerald-600" : "text-rose-600"}`}>
            {trend > 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div>
        <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
        <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
        {subtext && <p className="text-xs text-gray-400">{subtext}</p>}
      </div>
    </div>
  );

  const renderDashboard = () => (
    <div className="space-y-6 animate-fade-in">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={Users}
          label="Total Subscribers"
          value={subscribers.length}
          subtext="Active newsletter readers"
          color="bg-emerald-50 text-emerald-600"
          trend={12}
        />
        <StatCard
          icon={FileText}
          label="Story Submissions"
          value={submissions.length}
          subtext="Pending review"
          color="bg-blue-50 text-blue-600"
          trend={5}
        />
        <StatCard
          icon={Inbox}
          label="Ad Inquiries"
          value={inquiries.length}
          subtext="New requests"
          color="bg-amber-50 text-amber-600"
          trend={-2}
        />
        <StatCard
          icon={MailOpen}
          label="Emails Sent"
          value={emailLogs.length}
          subtext="Via Resend"
          color="bg-purple-50 text-purple-600"
          trend={8}
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-br from-emerald-50 to-blue-50 border border-emerald-200 rounded-2xl p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-emerald-600" />
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button
            onClick={() => setActiveTab("editor")}
            className="p-4 bg-white border border-gray-200 rounded-xl hover:border-emerald-300 hover:shadow-sm transition-all text-left"
          >
            <Edit3 className="w-5 h-5 text-emerald-600 mb-2" />
            <p className="text-sm font-bold text-gray-900">Write Article</p>
            <p className="text-xs text-gray-500 mt-1">Create new story</p>
          </button>
          <button
            onClick={() => setActiveTab("email-client")}
            className="p-4 bg-white border border-gray-200 rounded-xl hover:border-emerald-300 hover:shadow-sm transition-all text-left"
          >
            <Mail className="w-5 h-5 text-blue-600 mb-2" />
            <p className="text-sm font-bold text-gray-900">Send Email</p>
            <p className="text-xs text-gray-500 mt-1">Compose message</p>
          </button>
          <button
            onClick={() => setActiveTab("adverts")}
            className="p-4 bg-white border border-gray-200 rounded-xl hover:border-emerald-300 hover:shadow-sm transition-all text-left"
          >
            <Megaphone className="w-5 h-5 text-amber-600 mb-2" />
            <p className="text-sm font-bold text-gray-900">Manage Ads</p>
            <p className="text-xs text-gray-500 mt-1">Update advert window</p>
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-600" />
            Recent Subscribers
          </h3>
          <div className="space-y-3">
            {subscribers.slice(0, 5).map((sub, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold">
                    {sub.email[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{sub.email}</p>
                    <p className="text-xs text-gray-500">{sub.date ? new Date(sub.date).toLocaleDateString() : "Active"}</p>
                  </div>
                </div>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            Recent Submissions
          </h3>
          <div className="space-y-3">
            {submissions.slice(0, 5).map((sub) => (
              <div key={sub.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                    {sub.startupName[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{sub.startupName}</p>
                    <p className="text-xs text-gray-500">by {sub.founderName}</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-screen transition-transform ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 bg-white border-r border-gray-200 w-64`}
      >
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-lg">
                  SA
                </div>
                <div>
                  <h1 className="text-sm font-bold text-gray-900">Startup Afrika</h1>
                  <p className="text-xs text-gray-500">Admin Panel</p>
                </div>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? "bg-emerald-50 text-emerald-700 font-semibold"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? "text-emerald-600" : "text-gray-400"}`} />
                  <span>{item.label}</span>
                  {isActive && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-600" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* User Profile */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold">
                TL
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">Thabiso Letsoko</p>
                <p className="text-xs text-gray-500 truncate">Admin</p>
              </div>
              <button
                onClick={() => {
                  localStorage.removeItem("sa_admin_token");
                  window.location.href = "/admin";
                }}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:ml-64">
        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {NAV_ITEMS.find((item) => item.id === activeTab)?.label || "Dashboard"}
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={fetchData}
                disabled={loading}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </button>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="p-6">
          {/* Dashboard View */}
          {activeTab === "dashboard" && renderDashboard()}

          {/* Subscribers View */}
          {activeTab === "subscribers" && (
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden animate-fade-in">
              <div className="p-6 border-b border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Newsletter Subscribers</h3>
                  <p className="text-sm text-gray-500 mt-1">Manage your email subscribers</p>
                </div>
                {subscribers.length > 0 && (
                  <button
                    onClick={() => downloadCSV(subscribers, `startup_afrika_subscribers_${Date.now()}.csv`)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-sm font-semibold rounded-xl transition-colors border border-emerald-200"
                  >
                    <Download className="w-4 h-4" />
                    Export CSV
                  </button>
                )}
              </div>

              <div className="p-4 bg-gray-50 border-b border-gray-100">
                <div className="relative">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Search subscribers..."
                    value={searchSubscriber}
                    onChange={(e) => setSearchSubscriber(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              {filteredSubscribers.length === 0 ? (
                <div className="p-12 text-center text-gray-400">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm font-medium">No subscribers found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Source</th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredSubscribers.map((sub, idx) => (
                        <tr key={idx} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold">
                                {sub.email[0].toUpperCase()}
                              </div>
                              <span className="text-sm font-semibold text-gray-900">{sub.email}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {sub.date ? new Date(sub.date).toLocaleDateString() : "Active"}
                          </td>
                          <td className="px-6 py-4 text-xs text-gray-500 uppercase font-medium">
                            {sub.source || "Website"}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Active
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

          {/* Adverts View */}
          {activeTab === "adverts" && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-6">
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <Megaphone className="w-5 h-5 text-amber-600" />
                      Advert Window Manager
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">Configure the main page advertisement window</p>
                  </div>
                  <button
                    onClick={handleSaveAdConfig}
                    disabled={savingAd}
                    className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md transition-all disabled:opacity-50"
                  >
                    <Save className="w-4 h-4 inline mr-2" />
                    {savingAd ? "Publishing..." : "Publish Changes"}
                  </button>
                </div>
              </div>

              {adSuccessMsg && (
                <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-800 text-sm font-semibold rounded-xl flex items-center gap-2">
                  <Check className="w-5 h-5" />
                  {adSuccessMsg}
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-5">
                  <h4 className="font-bold text-gray-900 border-b border-gray-100 pb-3">Content Settings</h4>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <span className="text-sm font-semibold text-gray-700">Enable Advert Window</span>
                    <input
                      type="checkbox"
                      checked={adConfig.enabled}
                      onChange={(e) => setAdConfig({ ...adConfig, enabled: e.target.checked })}
                      className="w-5 h-5 accent-emerald-600 rounded cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Headline</label>
                    <input
                      type="text"
                      value={adConfig.title}
                      onChange={(e) => setAdConfig({ ...adConfig, title: e.target.value })}
                      className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Subtitle</label>
                    <textarea
                      rows={3}
                      value={adConfig.subtitle}
                      onChange={(e) => setAdConfig({ ...adConfig, subtitle: e.target.value })}
                      className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Banner Image URL</label>
                    <input
                      type="text"
                      value={adConfig.imageUrl}
                      onChange={(e) => setAdConfig({ ...adConfig, imageUrl: e.target.value })}
                      className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">CTA Text</label>
                      <input
                        type="text"
                        value={adConfig.ctaText}
                        onChange={(e) => setAdConfig({ ...adConfig, ctaText: e.target.value })}
                        className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Contact Email</label>
                      <input
                        type="email"
                        value={adConfig.contactEmail}
                        onChange={(e) => setAdConfig({ ...adConfig, contactEmail: e.target.value })}
                        className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    Live Preview
                  </h4>
                  <div className="bg-gradient-to-br from-stone-900 to-stone-800 rounded-2xl p-6 text-white space-y-4">
                    <div className="relative rounded-xl overflow-hidden border border-emerald-500/20">
                      <img
                        src={adConfig.imageUrl || adBannerImg}
                        alt="Ad Preview"
                        className="w-full h-48 object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = adBannerImg;
                        }}
                      />
                      <div className="absolute top-3 left-3 bg-black/80 backdrop-blur text-emerald-400 text-xs font-bold px-3 py-1 rounded border border-emerald-500/30">
                        {adConfig.badgeText || "AD"}
                      </div>
                    </div>
                    <div>
                      <h5 className="text-xl font-bold text-white leading-tight">
                        {adConfig.title || "Advertise your business"}
                      </h5>
                      <p className="text-sm text-gray-300 mt-2">{adConfig.subtitle}</p>
                    </div>
                    <button className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition-colors">
                      {adConfig.ctaText || "Inquire Now"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Inquiries View */}
          {activeTab === "inquiries" && (
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden animate-fade-in">
              <div className="p-6 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Ad Inquiries</h3>
                    <p className="text-sm text-gray-500 mt-1">Manage incoming ad requests</p>
                  </div>
                  {inquiries.length > 0 && (
                    <button
                      onClick={() => downloadCSV(inquiries, `ad_requests_${Date.now()}.csv`)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-sm font-semibold rounded-xl transition-colors border border-emerald-200"
                    >
                      <Download className="w-4 h-4" />
                      Export CSV
                    </button>
                  )}
                </div>
              </div>

              <div className="p-4 bg-gray-50 border-b border-gray-100">
                <div className="relative">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Search inquiries..."
                    value={searchInquiry}
                    onChange={(e) => setSearchInquiry(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              {filteredInquiries.length === 0 ? (
                <div className="p-12 text-center text-gray-400">
                  <Inbox className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm font-medium">No ad inquiries yet</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {filteredInquiries.map((inq) => (
                    <div key={inq.id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-lg">
                            {inq.companyName[0].toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <h4 className="text-base font-bold text-gray-900">{inq.companyName}</h4>
                            <p className="text-sm text-gray-600 mt-1">
                              Contact: <span className="font-semibold">{inq.contactName || "N/A"}</span> • {inq.email}
                            </p>
                            {inq.message && (
                              <div className="mt-3 p-3 bg-gray-50 rounded-xl text-sm text-gray-700">
                                {inq.message}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className="text-xs font-mono font-bold bg-amber-50 text-amber-700 px-3 py-1.5 rounded-lg border border-amber-200">
                            {inq.budget || "N/A"}
                          </span>
                          <span className="text-xs text-gray-400">
                            {new Date(inq.date).toLocaleDateString()}
                          </span>
                          <div className="flex items-center gap-2 mt-2">
                            <a
                              href={`mailto:${inq.email}?subject=StartUpAfrika%20Ad%20Inquiry`}
                              className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition-colors"
                              title="Reply via email"
                            >
                              <Send className="w-4 h-4" />
                            </a>
                            <button
                              onClick={() => handleDeleteInquiry(inq.id)}
                              className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Submissions View */}
          {activeTab === "submissions" && !selectedSubmission && (
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden animate-fade-in">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-900">Story Submissions</h3>
                <p className="text-sm text-gray-500 mt-1">Review founder applications</p>
              </div>

              {submissions.length === 0 ? (
                <div className="p-12 text-center text-gray-400">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm font-medium">No submissions yet</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {submissions.map((sub) => (
                    <div
                      key={sub.id}
                      onClick={() => setSelectedSubmission(sub)}
                      className="p-6 hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-blue-500 text-white flex items-center justify-center font-bold text-lg">
                            {sub.startupName[0]}
                          </div>
                          <div>
                            <h4 className="text-base font-bold text-gray-900">{sub.startupName}</h4>
                            <p className="text-sm text-gray-600 mt-1">
                              by <span className="font-semibold">{sub.founderName}</span> • {sub.email}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-gray-400 font-mono">
                            {new Date(sub.date).toLocaleDateString()}
                          </span>
                          <ChevronRight className="w-5 h-5 text-gray-400" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Submission Detail View */}
          {selectedSubmission && (
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8 animate-fade-in">
              <div className="flex items-center justify-between mb-6 pb-6 border-b border-gray-200">
                <div>
                  <button
                    onClick={() => setSelectedSubmission(null)}
                    className="text-sm font-semibold text-emerald-700 hover:underline mb-2 flex items-center gap-1"
                  >
                    <ArrowUpRight className="w-4 h-4 rotate-180" />
                    Back to Applications
                  </button>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {selectedSubmission.startupName}
                  </h3>
                </div>
                <span className="text-xs font-mono text-gray-400 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
                  {selectedSubmission.id}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 p-4 bg-gray-50 rounded-xl">
                <div>
                  <p className="text-xs font-mono text-gray-500 uppercase tracking-wider mb-1">Founder</p>
                  <p className="text-sm font-bold text-gray-900">{selectedSubmission.founderName}</p>
                </div>
                <div>
                  <p className="text-xs font-mono text-gray-500 uppercase tracking-wider mb-1">Startup</p>
                  <p className="text-sm font-bold text-gray-900">{selectedSubmission.startupName}</p>
                </div>
                <div>
                  <p className="text-xs font-mono text-gray-500 uppercase tracking-wider mb-1">Email</p>
                  <p className="text-sm font-semibold text-emerald-700">{selectedSubmission.email}</p>
                </div>
              </div>

              <div className="space-y-6">
                {Object.entries(selectedSubmission.answers).map(([key, value], idx) => (
                  <div key={key}>
                    <h5 className="text-xs font-mono font-bold text-gray-500 uppercase tracking-wider mb-2">
                      {idx + 1}. {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, " $1")}
                    </h5>
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 leading-relaxed">
                      {value as string}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Email Logs View */}
          {activeTab === "emails" && (
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden animate-fade-in">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Email Logs</h3>
                  <p className="text-sm text-gray-500 mt-1">Resend webhook delivery events</p>
                </div>
                <button
                  onClick={fetchData}
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-sm font-semibold rounded-xl transition-colors border border-emerald-200"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                  Refresh
                </button>
              </div>

              {emailLogs.length === 0 ? (
                <div className="p-12 text-center text-gray-400">
                  <MailOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm font-medium">No email logs yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Recipient</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Subject</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Event</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {emailLogs.map((log, idx) => (
                        <tr key={idx} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                              log.status === "delivered" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                              log.status === "bounced" ? "bg-amber-50 text-amber-700 border border-amber-200" :
                              log.status === "failed" ? "bg-rose-50 text-rose-700 border border-rose-200" :
                              "bg-gray-50 text-gray-700 border border-gray-200"
                            }`}>
                              {log.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm font-semibold text-gray-900">{log.to}</td>
                          <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">{log.subject}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{log.event}</td>
                          <td className="px-6 py-4 text-xs text-gray-500 font-mono">
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

          {/* Email Client View */}
          {activeTab === "email-client" && (
            <div className="animate-fade-in">
              <EmailClient />
            </div>
          )}

          {/* Editor View */}
          {activeTab === "editor" && (
            <div className="bg-[#0e1310] border border-stone-800 rounded-2xl shadow-xl overflow-hidden animate-fade-in min-h-[750px]">
              <EditorDashboard
                token={localStorage.getItem("sa_admin_token") || ""}
                onLogout={() => {}}
                isEmbedded={true}
              />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}