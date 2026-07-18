import React from "react";

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
            <svg className="w-11 h-11" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Africa Outline in dark emerald green */}
              <path 
                d="M47.7,21.1c2.1-1.5,5.1-1,7-0.7c2.2,0.4,4.2,1.3,6.2,2.3c3.5,1.7,6.8,3.7,10,5.9c2.4,1.7,4.8,3.5,7.1,5.3c1.9,1.5,3.9,3.1,5.5,4.9c1.9,2.2,2.9,4.8,2.7,7.7c-0.2,2.6-1.5,5-3,7.1c-2.3,3.3-5,6.4-7.8,9.3c-3,3.1-6,6.1-9.2,9c-3,2.7-6,5.3-9.2,7.7c-2.3,1.7-4.8,3.2-7.3,4.7c-3.1,1.9-6.3,3.6-9.6,5c-2.7,1.1-5.6,2-8.5,2.4c-2.1,0.3-4.2,0.4-6.3,0c-1.8-0.3-3.6-1.2-4.9-2.5c-1.6-1.7-2.3-4.1-2.4-6.4c-0.2-2.9,0.5-5.8,1.4-8.6c1.1-3.5,2.7-6.8,4.3-10.1c1.5-3.1,3.1-6.1,4.9-9.1c1.9-3.1,4-6.1,6.4-8.9c1.7-2,3.6-3.8,5.7-5.5C40,28,43,24.8,47.7,21.1z" 
                stroke="#0f3d26" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
              {/* Madagascar Outline */}
              <path 
                d="M 76,70 C 78,68 81,73 81,76 C 81,79 78,82 76,80 C 75,78 75,72 76,70 Z" 
                stroke="#0f3d26" 
                strokeWidth="1.8" 
                fill="none" 
              />
              {/* Stylized Regional Internal Border Lines */}
              <path 
                d="M 40,30 L 48,45 L 60,42 L 65,55 M 48,45 L 43,62 L 53,60 L 58,74 M 58,74 L 52,90 M 60,62 L 68,60 M 62,80 L 68,78" 
                stroke="#0f3d26" 
                strokeWidth="1.2" 
                strokeLinecap="round" 
              />
              {/* Gold Connection Lines */}
              <line x1="21" y1="45" x2="34" y2="55" stroke="#c8a241" strokeWidth="1.2" />
              <line x1="34" y1="55" x2="51" y2="36" stroke="#c8a241" strokeWidth="1.2" />
              <line x1="51" y1="36" x2="63" y2="61" stroke="#c8a241" strokeWidth="1.2" />
              <line x1="63" y1="61" x2="68" y2="60" stroke="#c8a241" strokeWidth="1.2" />
              <line x1="68" y1="60" x2="66" y2="78" stroke="#c8a241" strokeWidth="1.2" />
              <line x1="66" y1="78" x2="53" y2="91" stroke="#c8a241" strokeWidth="1.2" />
              {/* Gold Nodes (Dots) */}
              <circle cx="21" cy="45" r="3.2" fill="#c8a241" />
              <circle cx="34" cy="55" r="3.2" fill="#c8a241" />
              <circle cx="51" cy="36" r="3.2" fill="#c8a241" />
              <circle cx="63" cy="61" r="2.8" fill="#c8a241" />
              <circle cx="68" cy="60" r="2.8" fill="#c8a241" />
              <circle cx="66" cy="78" r="3.2" fill="#c8a241" />
              <circle cx="53" cy="91" r="3.2" fill="#c8a241" />
              <circle cx="79" cy="75" r="2.2" fill="#c8a241" />
              {/* Gold Swoosh wrapping around bottom and climbing up to top right */}
              <path 
                d="M 18,63 C 15,76 36,75 56,60 C 76,45 87,30 96,15" 
                fill="none" 
                stroke="#c8a241" 
                strokeWidth="4.2" 
                strokeLinecap="round" 
              />
              {/* Gold Star at the end of the swoosh */}
              <polygon 
                points="99,4 101.5,8.5 106.5,9 102.5,12 104,17 99,14.5 94,17 95.5,12 91.5,9 96.5,8.5" 
                fill="#c8a241" 
              />
            </svg>
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

