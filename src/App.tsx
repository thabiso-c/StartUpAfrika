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
import NewsSection from "./components/NewsSection";
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
      // First, try to sync local custom articles with the server
      const cachedArticlesStr = localStorage.getItem("slyzah_custom_articles");
      if (cachedArticlesStr) {
        try {
          const cachedArticles = JSON.parse(cachedArticlesStr);
          if (Array.isArray(cachedArticles) && cachedArticles.length > 0) {
            await fetch("/api/articles/sync", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ articles: cachedArticles }),
            }).catch(console.error);
          }
        } catch (e) {
          console.error("Failed to sync articles:", e);
        }
      }

      const res = await fetch("/api/articles");
      if (res.ok) {
        let data = await res.json();
        
        // Merge with custom articles stored in localStorage to prevent loss on server recycle
        if (cachedArticlesStr) {
          try {
            const cachedArticles = JSON.parse(cachedArticlesStr) as any[];
            // Filter to only include cached articles that don't already exist in the API response (deduplicate by id)
            const apiIds = new Set(data.map((a: any) => a.id));
            const uniqueCached = cachedArticles.filter((a) => a.status === "published" && !apiIds.has(a.id));
            
            if (uniqueCached.length > 0) {
              data = [...uniqueCached, ...data];
              // Sort by updatedAt or createdAt desc
              data.sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());
            }
          } catch (e) {
            console.error("Failed to parse cached articles:", e);
          }
        }
        
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

  // Synchronize state from URL query parameter (?article=ID)
  useEffect(() => {
    const syncStateFromUrl = () => {
      const params = new URLSearchParams(window.location.search);
      const articleId = params.get("article");
      if (articleId) {
        setSelectedInterviewId(articleId);
        setCurrentTab("explore");
      } else {
        setSelectedInterviewId(null);
      }
    };

    window.addEventListener("popstate", syncStateFromUrl);
    syncStateFromUrl(); // run once on mount

    return () => {
      window.removeEventListener("popstate", syncStateFromUrl);
    };
  }, []);

  // Sync selectedInterviewId state to URL query parameter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const currentParam = params.get("article");
    if (selectedInterviewId) {
      if (currentParam !== selectedInterviewId) {
        params.set("article", selectedInterviewId);
        window.history.pushState({}, "", `${window.location.pathname}?${params.toString()}`);
      }
    } else {
      if (currentParam) {
        params.delete("article");
        const query = params.toString();
        window.history.pushState({}, "", `${window.location.pathname}${query ? `?${query}` : ""}`);
      }
    }
  }, [selectedInterviewId]);

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
              previousArticles={publishedArticles.slice(1)}
              onSelect={() => publishedArticles[0] && setSelectedInterviewId(publishedArticles[0].id)}
              articlesLoading={loadingArticles}
            />

            {/* Main grid feed */}
            <div className="max-w-6xl mx-auto px-4 py-16">
              <div className="flex items-center gap-2 mb-8 pb-3 border-b border-gray-100">
                <BookOpen className="w-5 h-5 text-emerald-600" />
                <h3 className="font-sans font-bold text-gray-900 text-lg">
                  Latest Founder Stories
                </h3>
              </div>

              {/* Vertical list feed */}
              <div className="flex flex-col divide-y divide-gray-100" id="interviews-feed">
                {loadingArticles ? (
                  <div className="text-center py-12 text-gray-400 text-sm">
                    Loading latest stories…
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
                    All set! There are no other curations yet.
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-400 text-sm">
                    No curations have been published yet.
                  </div>
                )}
              </div>
            </div>

            {/* News Section */}
            <NewsSection />
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
