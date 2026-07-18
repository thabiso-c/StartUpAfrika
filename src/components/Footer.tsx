import React from "react";
import { Heart } from "lucide-react";

export default function Footer() {
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
          <div className="flex flex-col items-center md:items-end gap-2">
            <p className="text-sm text-gray-600 flex items-center gap-1">
              Curated with <Heart className="w-4 h-4 text-rose-500 fill-rose-500" /> by{" "}
              <a 
                href="#" 
                className="text-emerald-700 font-semibold hover:underline"
                onClick={(e) => {
                  e.preventDefault();
                  alert("Slyzah Booking Platform is Thabiso's primary venture.");
                }}
              >
                Thabiso (Founder, Slyzah)
              </a>
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
