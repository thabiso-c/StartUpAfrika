import React from "react";
import { Twitter, Linkedin, Instagram, Youtube, Mail, ArrowUpRight } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    explore: [
      { name: "Startups", href: "#startups" },
      { name: "Funding", href: "#intelligence" },
      { name: "AI", href: "#latest-stories" },
      { name: "Fintech", href: "#latest-stories" },
      { name: "Founders", href: "#editors-pick" },
      { name: "Markets", href: "#intelligence" },
    ],
    africa: [
      { name: "South Africa", href: "#latest-stories" },
      { name: "Nigeria", href: "#latest-stories" },
      { name: "Kenya", href: "#latest-stories" },
      { name: "Egypt", href: "#latest-stories" },
      { name: "Ghana", href: "#latest-stories" },
      { name: "All Countries", href: "#intelligence" },
    ],
    company: [
      { name: "About", href: "/#about" },
      { name: "Contact", href: "mailto:info@startupafrika.co.za" },
      { name: "Advertise", href: "#advertise-window-section" },
      { name: "Newsletter", href: "#hero-section" },
      { name: "Careers", href: "mailto:info@startupafrika.co.za?subject=Careers%20Inquiry" },
    ],
  };

  return (
    <footer className="bg-charcoal text-white" id="main-footer">
      {/* Newsletter section */}
      <div className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="max-w-3xl mx-auto text-center">
            <h3 className="font-display text-3xl sm:text-4xl font-extrabold mb-4 tracking-tight">
              THE AFRICA STARTUP BRIEF
            </h3>
            <p className="text-gray-300 text-lg mb-8 font-light">
              What matters in Africa's tech ecosystem — delivered weekly.
            </p>
            <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder="your@email.com"
                className="flex-1 px-5 py-3.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
              />
              <button
                type="submit"
                className="px-8 py-3.5 bg-accent text-charcoal font-bold text-sm tracking-wider uppercase rounded-xl hover:bg-accent-hover transition-all hover:shadow-lg whitespace-nowrap"
              >
                Subscribe
              </button>
            </form>
            <p className="text-xs text-gray-400 mt-4">
              Join 12,000+ founders and investors. Unsubscribe anytime.
            </p>
          </div>
        </div>
      </div>

      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-12">
          {/* Brand column */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10">
                <img src="/src/assets/images/logo.png" alt="Startup Afrika" className="w-full h-full object-contain" />
              </div>
              <div className="flex flex-col leading-none">
                <span className="font-display font-extrabold text-sm tracking-[0.14em] uppercase">
                  Startup
                </span>
                <span className="font-display font-extrabold text-sm tracking-[0.14em] uppercase">
                  Afrika
                </span>
              </div>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed mb-6 max-w-sm">
              The definitive platform for African startup intelligence. Documenting the stories, 
              funding, and founders shaping the continent's technology future.
            </p>
            <div className="flex items-center gap-4">
              <a href="https://twitter.com/startupafrika" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors" aria-label="Twitter">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="https://linkedin.com/company/startupafrika" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors" aria-label="LinkedIn">
                <Linkedin className="w-5 h-5" />
              </a>
              <a href="https://instagram.com/startupafrika" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors" aria-label="Instagram">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="https://youtube.com/@startupafrika" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors" aria-label="YouTube">
                <Youtube className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Explore column */}
          <div>
            <h4 className="font-display text-xs font-bold uppercase tracking-widest mb-4 text-gray-400">
              Explore
            </h4>
            <ul className="space-y-3">
              {footerLinks.explore.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-sm text-gray-300 hover:text-white transition-colors flex items-center gap-1 group"
                  >
                    {link.name}
                    <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Africa column */}
          <div>
            <h4 className="font-display text-xs font-bold uppercase tracking-widest mb-4 text-gray-400">
              Africa
            </h4>
            <ul className="space-y-3">
              {footerLinks.africa.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-sm text-gray-300 hover:text-white transition-colors flex items-center gap-1 group"
                  >
                    {link.name}
                    <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company column */}
          <div>
            <h4 className="font-display text-xs font-bold uppercase tracking-widest mb-4 text-gray-400">
              Company
            </h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-sm text-gray-300 hover:text-white transition-colors flex items-center gap-1 group"
                  >
                    {link.name}
                    <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-gray-400">
              © {currentYear} Startup Afrika Media. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <a href="/privacy" className="text-xs text-gray-400 hover:text-white transition-colors">
                Privacy Policy
              </a>
              <a href="/terms" className="text-xs text-gray-400 hover:text-white transition-colors">
                Terms of Service
              </a>
              <a href="/cookies" className="text-xs text-gray-400 hover:text-white transition-colors">
                Cookie Policy
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}