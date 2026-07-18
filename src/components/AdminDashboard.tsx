import React, { useState, useEffect } from "react";
import { Users, FileText, Download, Calendar, Mail, CheckCircle2, ChevronRight, Inbox, RefreshCw, Eye } from "lucide-react";
import { Subscriber, Submission } from "../types";

export default function AdminDashboard() {
  const [activeSubTab, setActiveSubTab] = useState<"subscribers" | "submissions">("subscribers");
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [subsRes, submsRes] = await Promise.all([
        fetch("/api/subscribers"),
        fetch("/api/submissions"),
      ]);

      if (subsRes.ok && submsRes.ok) {
        const subsData = await subsRes.json();
        const submsData = await submsRes.json();
        setSubscribers(subsData);
        setSubmissions(submsData);
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

  return (
    <div className="max-w-6xl mx-auto px-4 py-8" id="admin-dashboard-view">
      {/* Title & Refresh Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Host Workspace & Database</h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage your audience metrics and pending founder interview applications in real-time.
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="self-start sm:self-center inline-flex items-center gap-1.5 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-900 rounded-xl text-xs font-semibold shadow-sm transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh Database
        </button>
      </div>

      {/* Numerical Stats overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-mono text-gray-400 uppercase tracking-wider">Total Subscribers</p>
            <p className="text-2xl font-mono font-extrabold text-gray-900">{subscribers.length}</p>
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-700 rounded-xl">
            <Inbox className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-mono text-gray-400 uppercase tracking-wider">Pending Stories</p>
            <p className="text-2xl font-mono font-extrabold text-gray-900">{submissions.length}</p>
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-purple-50 text-purple-700 rounded-xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-mono text-gray-400 uppercase tracking-wider">Verified Hosts</p>
            <p className="text-2xl font-mono font-extrabold text-gray-900">1 (Thabiso)</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-100 mb-6 flex items-center justify-between">
        <div className="flex gap-6">
          <button
            onClick={() => {
              setActiveSubTab("subscribers");
              setSelectedSubmission(null);
            }}
            className={`pb-3 text-sm font-semibold transition-all relative ${
              activeSubTab === "subscribers" && !selectedSubmission
                ? "text-emerald-700 font-bold"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            Subscribers List ({subscribers.length})
            {activeSubTab === "subscribers" && !selectedSubmission && (
              <span className="absolute bottom-0 left-0 w-full h-[2px] bg-emerald-600 rounded-full"></span>
            )}
          </button>
          <button
            onClick={() => setActiveSubTab("submissions")}
            className={`pb-3 text-sm font-semibold transition-all relative ${
              activeSubTab === "submissions" || selectedSubmission
                ? "text-emerald-700 font-bold"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            Story Applications ({submissions.length})
            {(activeSubTab === "submissions" || selectedSubmission) && (
              <span className="absolute bottom-0 left-0 w-full h-[2px] bg-emerald-600 rounded-full"></span>
            )}
          </button>
        </div>

        {activeSubTab === "subscribers" && subscribers.length > 0 && (
          <button
            onClick={() => downloadCSV(subscribers, `startup_africa_subscribers_${Date.now()}.csv`)}
            className="mb-2 inline-flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-emerald-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        )}
      </div>

      {/* Tab Panels */}
      {!selectedSubmission && activeSubTab === "subscribers" && (
        <div className="bg-white border border-gray-150 rounded-2xl shadow-sm overflow-hidden animate-fade-in" id="panel-subscribers">
          {subscribers.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm font-medium">No subscribers yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-500">
                <thead className="text-xs text-gray-400 font-mono uppercase bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4">Subscriber Email</th>
                    <th className="px-6 py-4">Date Joined</th>
                    <th className="px-6 py-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {subscribers.map((sub, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50">
                      <td className="px-6 py-4 font-medium text-gray-900 flex items-center gap-2.5">
                        <Mail className="w-4 h-4 text-gray-400" />
                        {sub.email}
                      </td>
                      <td className="px-6 py-4 text-xs font-mono text-gray-400">
                        {new Date(sub.date).toLocaleDateString()} at {new Date(sub.date).toLocaleTimeString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
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

      {/* Submissions Panel */}
      {!selectedSubmission && activeSubTab === "submissions" && (
        <div className="bg-white border border-gray-150 rounded-2xl shadow-sm overflow-hidden animate-fade-in" id="panel-submissions">
          {submissions.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              <Inbox className="w-8 h-8 text-gray-300 mx-auto mb-2 animate-bounce" />
              <p className="text-sm font-medium">No pending submissions yet</p>
              <p className="text-xs text-gray-400 mt-1">
                Story drafts submitted via the "Submit Story" portal will arrive here instantly.
              </p>
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

      {/* Expanded Submission details view */}
      {selectedSubmission && (
        <div className="bg-white border border-gray-150 rounded-2xl shadow-sm p-6 sm:p-8 animate-fade-in" id="submission-detail-pane">
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

          {/* 6 Answers listed out for Thabiso */}
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
