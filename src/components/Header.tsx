import React, { useState } from "react";
import { signInWithPopup, signOut } from "firebase/auth";
import { auth, googleProvider } from "../config/firebase";
import logo from "../assets/images/logo.png";
import { X, ShieldAlert, CheckCircle2, Loader2, Key } from "lucide-react";

interface HeaderProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onOpenSubscribe?: () => void;
  user?: any | null;
  setUser?: (user: any) => void;
}

export default function Header({ currentTab, setCurrentTab, onOpenSubscribe, user, setUser }: HeaderProps) {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [demoEmail, setDemoEmail] = useState("slyzahofficial@gmail.com");
  const [demoName, setDemoName] = useState("Thabiso");
  const [isDemoSubmitting, setIsDemoSubmitting] = useState(false);
  const [demoSuccess, setDemoSuccess] = useState(false);
  const [demoError, setDemoError] = useState("");

  const handleGoogleSignIn = async () => {
    if (!auth) {
      setDemoError("Google Auth is currently disabled on this web client because the Firebase API Key is not configured.");
      return;
    }
    try {
      setDemoError("");
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();
      await fetch("/api/users/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`
        }
      });
      if (setUser) {
        setUser(result.user);
      }
      setIsLoginModalOpen(false);
    } catch (error: any) {
      console.error("Error signing in with Google", error);
      setDemoError(error.message || "Failed to sign in with Google.");
    }
  };

  const handleDemoSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!demoEmail || !demoEmail.includes("@")) {
      setDemoError("Please enter a valid email address.");
      return;
    }

    setIsDemoSubmitting(true);
    setDemoError("");

    try {
      const res = await fetch("/api/users/demo-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: demoEmail,
          name: demoName,
          picture: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(demoEmail)}`
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to process demo login");
      }

      setDemoSuccess(true);
      localStorage.setItem("slyzah_demo_user", JSON.stringify(data.user));
      
      if (setUser) {
        setUser(data.user);
      }

      setTimeout(() => {
        setIsLoginModalOpen(false);
        setDemoSuccess(false);
      }, 1000);

    } catch (err: any) {
      setDemoError(err.message || "Something went wrong.");
    } finally {
      setIsDemoSubmitting(false);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem("slyzah_demo_user");
    if (auth) {
      signOut(auth);
    }
    if (setUser) {
      setUser(null);
    }
  };

  return (
    <>
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

            {user ? (
              <div className="flex items-center gap-4 ml-2 sm:ml-4">
                <div className="flex items-center gap-2">
                  {user.photoURL && <img src={user.photoURL} alt="Profile" className="w-8 h-8 rounded-full border border-gray-200" />}
                  <span className="text-sm font-semibold text-gray-700 hidden sm:block">{user.displayName || user.name}</span>
                </div>
                <button
                  onClick={handleSignOut}
                  className="px-4 py-2 text-gray-500 hover:text-gray-700 text-xs font-bold uppercase tracking-wider transition-colors"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={() => setIsLoginModalOpen(true)}
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
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Modern, Beautiful Login Modal */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm" id="login-modal">
          <div className="bg-white rounded-2xl max-w-md w-full border border-gray-100 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-6 border-b border-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-50 text-emerald-800 rounded-lg">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">Sign In</h3>
                  <p className="text-xs text-gray-500">Access the editorial workspace & saved tools</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setIsLoginModalOpen(false);
                  setDemoError("");
                }}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 space-y-6">
              {demoError && (
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-800 text-xs flex items-start gap-2 leading-relaxed">
                  <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{demoError}</span>
                </div>
              )}

              {demoSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-800 text-xs flex items-start gap-2 leading-relaxed">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Success! Authenticated and saved to Firestore.</span>
                </div>
              )}

              {/* Real Auth Option */}
              {auth ? (
                <div>
                  <button
                    onClick={handleGoogleSignIn}
                    className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg text-sm font-semibold text-gray-700 transition-all active:scale-[0.98]"
                  >
                    {/* Google Icon */}
                    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="#EA4335"
                        d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.48 14.98 1 12 1 7.35 1 3.37 3.68 1.39 7.56l3.86 3C6.18 7.36 8.87 5.04 12 5.04z"
                      />
                      <path
                        fill="#4285F4"
                        d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.46c-.28 1.48-1.12 2.74-2.38 3.58l3.69 2.87c2.16-1.99 3.42-4.91 3.42-8.6z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.25 14.56c-.24-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29L1.39 7.56C.5 9.35 0 11.35 0 13.48c0 2.13.5 4.13 1.39 5.92l3.86-3z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.69-2.87c-1.02.68-2.33 1.09-4.27 1.09-3.13 0-5.82-2.32-6.75-5.52l-3.86 3C3.37 20.32 7.35 23 12 23z"
                      />
                    </svg>
                    <span>Sign In with Google</span>
                  </button>
                </div>
              ) : (
                <div className="p-3 bg-amber-50/60 border border-amber-100 rounded-xl text-amber-800 text-xs leading-relaxed">
                  <p className="font-bold flex items-center gap-1.5 mb-1 text-amber-900">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    Firebase Credentials Needed
                  </p>
                  <span>Google Sign-In is disabled on the client side because the Web API key is not configured in this preview environment yet. Use the Quick Developer Sign-In below to instantly authenticate and sync to Firestore!</span>
                </div>
              )}

              {/* Separator */}
              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-gray-100"></div>
                <span className="flex-shrink mx-4 text-gray-400 text-[10px] font-mono tracking-wider uppercase">Or Quick Developer Sign-In</span>
                <div className="flex-grow border-t border-gray-100"></div>
              </div>

              {/* Developer Bypass Form */}
              <form onSubmit={handleDemoSignIn} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                    Your Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={demoEmail}
                    onChange={(e) => setDemoEmail(e.target.value)}
                    placeholder="e.g. slyzahofficial@gmail.com"
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                    Your Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={demoName}
                    onChange={(e) => setDemoName(e.target.value)}
                    placeholder="e.g. Thabiso"
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isDemoSubmitting || demoSuccess}
                  className="w-full py-3 bg-emerald-800 text-white font-bold tracking-wider uppercase rounded-lg text-xs transition-all hover:bg-emerald-900 active:scale-95 flex items-center justify-center gap-2"
                >
                  {isDemoSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      AUTHENTICATING...
                    </>
                  ) : (
                    "QUICK SIGN IN (SYNCS TO FIRESTORE)"
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


