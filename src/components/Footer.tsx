import React from "react";

export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-100 py-12 mt-20" id="main-footer">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <h3 className="font-sans font-bold text-gray-900 text-lg">Startup Afrika</h3>
            <p className="text-sm text-gray-500 mt-1 max-w-sm">
              Documenting the authentic, in-the-trenches stories of successful founders and startups across the African continent.
            </p>
          </div>
          <div className="flex flex-col items-center md:items-end gap-2 relative">
            <p className="text-xs text-gray-400 font-mono">
              © {new Date().getFullYear()} Startup Afrika Media. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
