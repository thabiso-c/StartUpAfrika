import React, { useState, useEffect } from "react";
import { Megaphone, ExternalLink, Sparkles, Send, CheckCircle2, X, BarChart3, Building2, Mail, DollarSign } from "lucide-react";
import adBannerImg from "../assets/images/advertise_startup_afrika.jpg";

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

export default function AdvertiseWindow() {
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

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    companyName: "",
    contactName: "",
    email: "",
    budget: "R2,500 - R5,000",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    fetch("/api/adverts")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && typeof data === "object") {
          setAdConfig((prev) => ({
            ...prev,
            ...data,
            imageUrl: data.imageUrl || adBannerImg,
          }));
        }
      })
      .catch((err) => console.log("Advert fetch fallback to static config:", err));
  }, []);

  if (!adConfig.enabled) return null;

  const handleSubmitInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.companyName || !formData.email) {
      setErrorMsg("Please fill in your company name and email address.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/adverts/inquire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setSubmitted(true);
      } else {
        const data = await res.json();
        setErrorMsg(data.error || "Failed to submit inquiry. Please try emailing directly.");
      }
    } catch (err) {
      // Fallback open mailto
      window.location.href = `mailto:${adConfig.contactEmail}?subject=Ad Space Inquiry from ${encodeURIComponent(formData.companyName)}&body=${encodeURIComponent(formData.message)}`;
      setSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="max-w-6xl mx-auto px-4 py-8" id="advertise-window-section">
      <div className="bg-gradient-to-br from-stone-900 via-stone-900 to-emerald-950 rounded-2xl border border-emerald-800/40 shadow-xl overflow-hidden text-white relative">
        {/* Subtle Ambient Background Lighting */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 p-6 sm:p-10 items-center relative z-10">
          {/* Banner Image Display */}
          <div className="lg:col-span-5 relative group overflow-hidden rounded-xl border border-emerald-500/20 shadow-lg bg-black/40">
            <img
              src={adConfig.imageUrl || adBannerImg}
              alt={adConfig.title}
              className="w-full h-auto max-h-[300px] sm:max-h-[340px] object-cover rounded-xl transition-transform duration-500 group-hover:scale-105"
              referrerPolicy="no-referrer"
              onError={(e) => {
                // Fallback to static asset if custom image fails to load
                (e.target as HTMLImageElement).src = adBannerImg;
              }}
            />
            <div className="absolute top-3 left-3 bg-stone-900/80 backdrop-blur-md text-emerald-400 text-[10px] font-mono font-bold tracking-wider px-2.5 py-1 rounded-md border border-emerald-500/30 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3" />
              {adConfig.badgeText || "ADVERTISEMENT WINDOW"}
            </div>
          </div>

          {/* Details & CTA */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono font-bold uppercase tracking-wider mb-2">
                <Megaphone className="w-4 h-4" />
                <span>Partner with StartUpAfrika</span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-snug mb-3">
                {adConfig.title}
              </h3>

              <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
                {adConfig.subtitle}
              </p>
            </div>

            {/* CTA Button */}
            <div className="pt-2 flex items-center">
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-emerald-900/40 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <Megaphone className="w-4 h-4" />
                {adConfig.ctaText || "Inquire / Book Ad Space"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Inquiry Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 relative shadow-2xl border border-gray-100">
            <button
              onClick={() => {
                setIsModalOpen(false);
                setSubmitted(false);
              }}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {!submitted ? (
              <div>
                <div className="flex items-center gap-2 text-emerald-700 text-xs font-mono font-bold uppercase mb-1">
                  <Megaphone className="w-4 h-4" />
                  <span>StartUpAfrika Ad Space Inquiry</span>
                </div>
                <h3 className="text-xl font-extrabold text-gray-900 mb-2">
                  Advertise Your Business
                </h3>
                <p className="text-xs text-gray-500 mb-6">
                  Fill out the form below to get our media kit, pricing tiers, and place your advertisement window on StartUpAfrika.
                </p>

                {errorMsg && (
                  <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
                    {errorMsg}
                  </div>
                )}

                <form onSubmit={handleSubmitInquiry} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Company / Business Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Slyzah, Paystack, Flutterwave"
                      value={formData.companyName}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Contact Name</label>
                      <input
                        type="text"
                        placeholder="Your Name"
                        value={formData.contactName}
                        onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Business Email *</label>
                      <input
                        type="email"
                        required
                        placeholder="you@company.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Budget Range</label>
                    <select
                      value={formData.budget}
                      onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                    >
                      <option value="R1,500 - R3,000">R1,500 - R3,000 / month</option>
                      <option value="R3,000 - R7,500">R3,000 - R7,500 / month</option>
                      <option value="R7,500+">R7,500+ / custom campaign</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Campaign Message / Objective</label>
                    <textarea
                      rows={3}
                      placeholder="Describe what product or service you'd like to advertise..."
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <span>Sending inquiry...</span>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Submit Ad Request</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            ) : (
              <div className="text-center py-8 space-y-4">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Inquiry Received!</h3>
                <p className="text-sm text-gray-600 max-w-sm mx-auto">
                  Thank you for reaching out. Our StartUpAfrika partnerships team will review your campaign details and email you shortly at <span className="font-semibold text-emerald-800">{formData.email}</span>.
                </p>
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    setSubmitted(false);
                  }}
                  className="px-6 py-2.5 bg-gray-900 text-white text-xs font-bold rounded-xl"
                >
                  Close Window
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
