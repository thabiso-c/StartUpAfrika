import React, { useState, useEffect } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "./config/firebase";
import Header from "./components/Header";
import Hero from "./components/Hero";
import InterviewCard from "./components/InterviewCard";
import InterviewDetail from "./components/InterviewDetail";
import OutreachGenerator from "./components/OutreachGenerator";
import SubmitBlueprint from "./components/SubmitBlueprint";
import AdminDashboard from "./components/AdminDashboard";
import Footer from "./components/Footer";
import EditorGate from "./components/editor/EditorGate";
import { interviews } from "./data/interviews";
import { AlertCircle, HelpCircle, BookOpen } from "lucide-react";

export default function App() {
  // Route /editor to the private editorial workspace
  if (window.location.pathname.startsWith("/editor")) {
    return <EditorGate />;
  }

  const [currentTab, setCurrentTab] = useState<string>("explore");
  const [selectedInterviewId, setSelectedInterviewId] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [publishedArticles, setPublishedArticles] = useState<any[]>([]);
  const [loadingArticles, setLoadingArticles] = useState<boolean>(true);

  const fetchPublishedArticles = async () => {
    try {
      const res = await fetch("/api/articles");
      if (res.ok) {
        const data = await res.json();
        setPublishedArticles(data);
      }
    } catch (err) {
      console.error("Failed to fetch articles:", err);
    } finally {
      setLoadingArticles(false);
    }
  };

  useEffect(() => {
    // Check if we have a persisted demo user first
    const savedDemoUser = localStorage.getItem("slyzah_demo_user");
    if (savedDemoUser) {
      try {
        setUser(JSON.parse(savedDemoUser));
      } catch (e) {
        localStorage.removeItem("slyzah_demo_user");
      }
    }

    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else if (!localStorage.getItem("slyzah_demo_user")) {
        setUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    fetchPublishedArticles();
  }, [currentTab]); // re-fetch when coming back to explore or changing tabs

  const selectedInterview = [...publishedArticles, ...interviews].find((i) => i.id === selectedInterviewId);

  // Switch tabs and reset active detail views
  const handleTabChange = (tab: string) => {
    setCurrentTab(tab);
    setSelectedInterviewId(null);
  };

  const renderActiveView = () => {
    // If we have an interview selected, display the reader detailed view
    if (selectedInterviewId && selectedInterview) {
      return (
        <InterviewDetail
          interview={selectedInterview}
          onBack={() => setSelectedInterviewId(null)}
        />
      );
    }

    switch (currentTab) {
      case "explore":
        return (
          <div className="animate-fade-in" id="explore-view">
            {/* Minimalist Substack Hero block */}
            <Hero 
              user={user} 
              featuredArticle={publishedArticles[0]}
              onSelect={() => publishedArticles[0] && setSelectedInterviewId(publishedArticles[0].id)}
            />

            {/* Main grid feed */}
            <div className="max-w-6xl mx-auto px-4 py-16">
              <div className="flex items-center gap-2 mb-8 pb-3 border-b border-gray-100">
                <BookOpen className="w-5 h-5 text-emerald-600" />
                <h3 className="font-sans font-bold text-gray-900 text-lg">
                  Latest Blueprint Curations
                </h3>
              </div>

              {/* Vertical list feed */}
              <div className="flex flex-col divide-y divide-gray-100" id="interviews-feed">
                {loadingArticles ? (
                  <div className="text-center py-12 text-gray-400 text-sm">
                    Loading latest blueprints…
                  </div>
                ) : publishedArticles.length > 1 ? (
                  publishedArticles.slice(1).map((interview) => (
                    <InterviewCard
                      key={interview.id}
                      interview={interview}
                      onSelect={() => setSelectedInterviewId(interview.id)}
                    />
                  ))
                ) : publishedArticles.length === 1 ? (
                  <div className="text-center py-12 text-gray-400 text-sm">
                    All set! There are no other blueprint curations yet.
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-400 text-sm">
                    No blueprint curations have been published yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case "submit":
        return <SubmitBlueprint />;

      case "outreach":
        return <OutreachGenerator />;

      case "admin":
        return <AdminDashboard />;

      default:
        return (
          <div className="max-w-md mx-auto py-16 text-center text-gray-500">
            <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
            <p className="text-sm font-semibold">View not found.</p>
          </div>
        );
    }
  };

  const handleOpenSubscribe = () => {
    setCurrentTab("explore");
    setSelectedInterviewId(null);
    setTimeout(() => {
      const el = document.getElementById("subscripts-panel");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        const input = el.querySelector("input");
        if (input) input.focus();
      }
    }, 120);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col justify-between font-sans text-gray-700 antialiased" id="app-root">
      <div>
        {/* Main Header navigation */}
        <Header 
          currentTab={selectedInterviewId ? "explore" : currentTab} 
          setCurrentTab={handleTabChange} 
          onOpenSubscribe={handleOpenSubscribe}
          user={user}
          setUser={setUser}
        />

        {/* Dynamic Inner view */}
        <main>{renderActiveView()}</main>
      </div>

      {/* Shared Footer block */}
      <Footer />
    </div>
  );
}
