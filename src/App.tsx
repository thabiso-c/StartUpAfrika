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
import AdminGate from "./components/AdminGate";
import AdvertiseWindow from "./components/AdvertiseWindow";
import AboutPage from "./components/AboutPage";
import Footer from "./components/Footer";
import NewsSection from "./components/NewsSection";
import EditorGate from "./components/editor/EditorGate";
import CommunityHub from "./components/community/CommunityHub";
import { interviews } from "./data/interviews";
import { AlertCircle, HelpCircle, BookOpen } from "lucide-react";

export default function App() {
  // Route /editor to the private editorial workspace
  if (window.location.pathname.startsWith("/editor")) {
    return <EditorGate />;
  }

  // Route /admin to the private executive admin portal
  if (window.location.pathname.startsWith("/admin")) {
    return <AdminGate />;
  }

  const [currentTab, setCurrentTab] = useState<string>(() => {
    if (window.location.pathname.startsWith("/community")) {
      return "community";
    }
    return "explore";
  });

  const [selectedInterviewId, setSelectedInterviewId] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [publishedArticles, setPublishedArticles] = useState<any[]>([]);
  const [loadingArticles, setLoadingArticles] = useState<boolean>(true);
  const [featuredArticle, setFeaturedArticle] = useState<any>(null);

  const fetchPublishedArticles = async (showLoadingState = true) => {
    const CACHE_KEY = "sa_articles_cache_v5";
    const CACHE_TS_KEY = "sa_articles_cache_ts_v5";
    const STALE_MS = 5 * 60 * 1000; // 5 minutes

    let servedFromCache = false;

    // 1. Paint instantly from localStorage cache
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const sorted = parsed.sort((a: any, b: any) =>
            new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()
          );
          setPublishedArticles(sorted);
          setLoadingArticles(false); // always stop spinner from cache
        }
      }
    } catch (_) {}

    // 2. Fetch fresh data
    try {
      const res = await fetch("/api/articles", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        const sorted = data.sort((a: any, b: any) =>
          new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()
        );
        setPublishedArticles(sorted);
        // Persist fresh data to localStorage
        localStorage.setItem(CACHE_KEY, JSON.stringify(sorted));
        localStorage.setItem(CACHE_TS_KEY, String(Date.now()));

        // Sync local articles in background (non-blocking)
        const cachedArticlesStr = localStorage.getItem("slyzah_custom_articles");
        if (cachedArticlesStr) {
          try {
            const cachedArticles = JSON.parse(cachedArticlesStr);
            if (Array.isArray(cachedArticles) && cachedArticles.length > 0) {
              fetch("/api/articles/sync", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ articles: cachedArticles }),
              }).catch(console.error);
            }
          } catch (e) {
            console.error("Failed to sync articles:", e);
          }
        }
      }
    } catch (err) {
      console.error("Failed to fetch articles:", err);
    } finally {
      // Always ensure spinner is dismissed even if there was no cache
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
  }, []); // fetch once on mount only — cache handles the rest

  const selectedInterview = [...publishedArticles, ...interviews].find((i) => i.id === selectedInterviewId);

  // Helper to identify scraped news articles from RSS, GNews, or AI news scraper
  const isScrapedNewsArticle = (article: any) => {
    if (!article) return false;
    if (article.isNews === true || article.source === "news_scraper") return true;
    if (article.id?.startsWith("art_news_")) return true;
    if (article.sourceUrl && String(article.sourceUrl).trim().length > 0) return true;
    const founder = String(article.founderName || "").toLowerCase();
    const startup = String(article.startupName || "").toLowerCase();
    if (founder.includes("ai news") || startup.includes("ai news") || founder.includes("news") || startup.includes("news")) return true;
    return false;
  };

  // Helper to determine if an article was published manually via the editor
  const isEditorArticle = (article: any) => {
    if (!article) return false;

    // Any scraped or aggregated news article is strictly excluded from editor articles
    if (isScrapedNewsArticle(article)) {
      return false;
    }

    // Explicit editor flags set when written/published via Editor Dashboard
    if (article.isEditorArticle === true || article.publishedViaEditor === true || article.source === "editor") {
      return true;
    }

    // Explicit ID check for editor articles (e.g., Building Slyzah)
    if (article.id === "art_slyzah_building_thabiso" || article.id?.startsWith("art_editor_")) {
      return true;
    }

    // Title match for editor story
    const titleLower = (article.title || "").toLowerCase();
    if (titleLower.includes("slyzah") || titleLower.includes("building slyzah")) {
      return true;
    }

    // Standard editor article ID format (art_...) excluding news prefix
    if (article.id?.startsWith("art_") && !article.id?.startsWith("art_news_")) {
      return true;
    }

    // Default: unless explicitly created as an editor article, do not treat as featured editor article
    return false;
  };

  const editorArticles = publishedArticles.filter(isEditorArticle);
  const otherArticles = publishedArticles.filter((a) => !isEditorArticle(a));

  const currentFeatured = editorArticles[0] || null;
  const currentPrevious = editorArticles.slice(1);

  // When a news article is selected but not found in publishedArticles, re-fetch without showing spinner
  useEffect(() => {
    if (selectedInterviewId && !selectedInterview) {
      fetchPublishedArticles(false);
    }
  }, [selectedInterviewId]);

  // Switch tabs and reset active detail views
  const handleTabChange = (tab: string) => {
    setCurrentTab(tab);
    setSelectedInterviewId(null);
  };

  const renderActiveView = () => {
    // If we have an interview selected, display the reader detailed view
    if (selectedInterviewId) {
      if (selectedInterview) {
        return (
          <InterviewDetail
            interview={selectedInterview}
            onBack={() => setSelectedInterviewId(null)}
          />
        );
      } else {
        // Show a loading state while fetching the article
        return (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-emerald-600">
            <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mb-4"></div>
            <p className="font-semibold text-gray-600">Loading article...</p>
          </div>
        );
      }
    }

    switch (currentTab) {
      case "explore":
        return (
          <div className="animate-fade-in" id="explore-view">
            {/* Minimalist Substack Hero block */}
            <Hero 
              user={user} 
              featuredArticle={currentFeatured}
              previousArticles={currentPrevious}
              onSelectArticle={(id) => setSelectedInterviewId(id)}
              articlesLoading={loadingArticles}
            />

            {/* Main Page "Advertise Your Business" Window */}
            <AdvertiseWindow />

            {/* News Section */}
            <NewsSection onSelectArticle={(id) => setSelectedInterviewId(id)} />
          </div>
        );
      case "submit":
        return (
          <CommunityHub
            user={user}
            onRequestLogin={() => {
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            publishedArticles={publishedArticles.length > 0 ? publishedArticles : interviews}
            initialTab="founders"
          />
        );

      case "community":
        return (
          <CommunityHub
            user={user}
            onRequestLogin={() => {
              // Scroll to header or trigger login
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            publishedArticles={publishedArticles.length > 0 ? publishedArticles : interviews}
          />
        );

      case "outreach":
        return <OutreachGenerator />;

      case "about":
        return (
          <div className="animate-fade-in">
            <AboutPage />
          </div>
        );

      case "admin":
        return <AdminGate />;

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
