import React from "react";
import logo from "@/assets/images/logo.png";

interface HeaderProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onOpenSubscribe?: () => void;
}

export default function Header({ currentTab, setCurrentTab, onOpenSubscribe }: HeaderProps) {
  return (
    <header className="border-b border-gray-100 bg-white sticky top-0 z-40" id="main-header">
      <div className="max-w-6xl mx-auto px-4 h-20 flex items-center justify-between">
        {/* Stacked Brand Logo with Africa SVG */}
        <div 
          className="flex items-center gap-3.5 cursor-pointer group select-none" 
          onClick={() => setCurrentTab("explore")}
          id="brand-logo"
        >
          {/* Detailed SVG Africa Map */}
          <div className="transition-transform group-hover:scale-105 duration-300">
            <img src={logo} alt="Startup Afrika Logo" className="w-14 h-14 object-contain" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-sans font-extrabold text-[17px] tracking-[0.14em] text-gray-900 uppercase">
              Startup
            </span>
            <span className="font-sans font-extrabold text-[17px] tracking-[0.14em] text-gray-900 uppercase">
              Afrika
            </span>
          </div>
        </div>

        {/* Navigation Items aligned to mockup */}
        <nav className="flex items-center gap-1.5 sm:gap-7" id="main-nav">
          <button
            onClick={() => setCurrentTab("explore")}
            className={`px-1 py-2 text-sm font-semibold transition-colors ${
              currentTab === "explore"
                ? "text-emerald-700"
                : "text-gray-600 hover:text-emerald-600"
            }`}
            id="nav-home"
          >
            Home
          </button>
          
          <button
            onClick={() => setCurrentTab("submit")}
            className={`px-1 py-2 text-sm font-semibold transition-colors ${
              currentTab === "submit"
                ? "text-emerald-700"
                : "text-gray-600 hover:text-emerald-600"
            }`}
            id="nav-founders"
          >
            Founders
          </button>

          <button
            onClick={() => setCurrentTab("outreach")}
            className={`px-1 py-2 text-sm font-semibold transition-colors ${
              currentTab === "outreach"
                ? "text-emerald-700"
                : "text-gray-600 hover:text-emerald-600"
            }`}
            id="nav-posts"
          >
            Posts
          </button>

          <button
            onClick={() => setCurrentTab("admin")}
            className={`px-1 py-2 text-sm font-semibold transition-colors ${
              currentTab === "admin"
                ? "text-emerald-700"
                : "text-gray-600 hover:text-emerald-600"
            }`}
            id="nav-login"
          >
            Log in
          </button>

          <button
            onClick={onOpenSubscribe}
            className="ml-2 sm:ml-4 px-5 py-2.5 bg-emerald-800 text-white font-bold rounded-lg text-xs tracking-wider uppercase transition-all hover:bg-emerald-900 hover:shadow-sm active:scale-95 whitespace-nowrap"
            id="nav-subscribe-btn"
          >
            Subscribe
          </button>
        </nav>
      </div>
    </header>
  );
}

