import React, { useState } from "react";
import { Heart } from "lucide-react";

export default function Footer() {
  const [showTooltip, setShowTooltip] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowTooltip(true);
    setTimeout(() => {
      setShowTooltip(false);
    }, 4000);
  };

  return (
    <footer className="bg-gray-50 border-t border-gray-100 py-12 mt-20" id="main-footer">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <h3 className="font-sans font-bold text-gray-900 text-lg">Startup Afrika</h3>
            <p className="text-sm text-gray-500 mt-1 max-w-sm">
              Documenting the authentic, in-the-trenches blueprints of successful apps and websites across the African continent.
            </p>
          </div>
          <div className="flex flex-col items-center md:items-end gap-2 relative">
            <p className="text-sm text-gray-600 flex items-center gap-1">
              Curated with <Heart className="w-4 h-4 text-rose-500 fill-rose-500" /> by{" "}
              <span className="relative">
                <a 
                  href="#" 
                  className="text-emerald-700 font-semibold hover:underline"
                  onClick={handleClick}
                >
                  Thabiso (Founder, Slyzah)
                </a>
                {showTooltip && (
                  <span className="absolute bottom-full right-0 mb-2 w-64 bg-stone-900 text-white text-xs p-2.5 rounded-lg shadow-lg z-50 animate-in fade-in slide-in-from-bottom-1 duration-200 block text-center font-sans">
                    Slyzah Booking Platform is Thabiso's primary venture.
                    <span className="absolute top-full right-1/2 translate-x-1/2 border-4 border-transparent border-t-stone-900"></span>
                  </span>
                )}
              </span>
            </p>
            <p className="text-xs text-gray-400 font-mono">
              © {new Date().getFullYear()} Startup Afrika Media. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
