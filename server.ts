import express from "express";
import path from "path";
import { fileURLToPath } from "url";
// Vite will be dynamically imported locally
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import multer from "multer";
import fs from "fs";
import crypto from "crypto";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import { Resend } from "resend";

interface DecodedFirebaseToken {
  uid: string;
  email?: string;
  name?: string;
  picture?: string;
  [key: string]: any;
}

let cachedKeys: Record<string, string> = {};
let cacheExpiry = 0;

async function getGooglePublicKeys(): Promise<Record<string, string>> {
  const now = Date.now();
  if (now < cacheExpiry && Object.keys(cachedKeys).length > 0) {
    return cachedKeys;
  }
  const res = await fetch("https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com");
  const data = await res.json() as Record<string, string>;
  cachedKeys = data;
  cacheExpiry = now + 3600 * 1000; // Cache for 1 hour
  return cachedKeys;
}

async function verifyFirebaseIdToken(idToken: string): Promise<DecodedFirebaseToken> {
  const parts = idToken.split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid JWT token format");
  }

  const header = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf-8"));
  const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf-8"));

  if (header.alg !== "RS256") {
    throw new Error("Invalid signature algorithm");
  }

  const projectId = process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || "startup-afrika";
  const now = Math.floor(Date.now() / 1000);

  if (payload.aud !== projectId) {
    throw new Error(`Invalid audience: expected ${projectId}, got ${payload.aud}`);
  }

  if (payload.iss !== `https://securetoken.google.com/${projectId}`) {
    throw new Error("Invalid issuer");
  }

  if (payload.exp < now) {
    throw new Error("Token has expired");
  }

  if (!payload.sub) {
    throw new Error("Token sub claim is missing");
  }

  const keys = await getGooglePublicKeys();
  const cert = keys[header.kid];
  if (!cert) {
    throw new Error("Public key not found for kid");
  }

  const verify = crypto.createVerify("SHA256");
  verify.update(`${parts[0]}.${parts[1]}`);
  const isValid = verify.verify(cert, parts[2], "base64url");
  if (!isValid) {
    throw new Error("Token signature verification failed");
  }

  return {
    uid: payload.sub,
    email: payload.email,
    name: payload.name,
    picture: payload.picture,
    ...payload
  };
}


dotenv.config();

// Initialize Firebase Admin (assumes GOOGLE_APPLICATION_CREDENTIALS is set, or FIREBASE_PROJECT_ID)
let db: Firestore | null = null;
try {
  if (!getApps().length) {
    const serviceAccountVar = process.env.FIREBASE_SERVICE_ACCOUNT || process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    const projectId = process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;

    if (serviceAccountVar) {
      try {
        const serviceAccount = JSON.parse(serviceAccountVar);
        initializeApp({
          credential: cert(serviceAccount),
          projectId: projectId || serviceAccount.project_id
        });
        console.log("Firebase Admin successfully initialized via service account.");
      } catch (parseErr) {
        console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT, falling back:", parseErr);
        initializeApp({ projectId: projectId || "startup-afrika" });
      }
    } else if (projectId) {
      initializeApp({ projectId });
      console.log(`Firebase Admin initialized with explicit projectId: ${projectId}`);
    } else {
      // Auto-discover credentials and projectId on Google Cloud Run
      initializeApp();
      console.log("Firebase Admin initialized via Google Cloud ADC auto-discovery.");
    }
  }
  db = getFirestore();
} catch (error) {
  console.error("Firebase Admin initialization error, trying default project fallback:", error);
  try {
    if (!getApps().length) {
      initializeApp({ projectId: "startup-afrika" });
    }
    db = getFirestore();
    console.log("Firebase Admin initialized via default project fallback.");
  } catch (fallbackError) {
    console.error("Firebase Admin fallback initialization also failed:", fallbackError);
  }
}

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Standard ESM workarounds removed since Vercel bundles to CommonJS where import.meta is empty


const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Serve uploaded images as static files (local dev only; Vercel uses /tmp)
app.use("/uploads", express.static(path.join(process.cwd(), "public", "uploads")));

// Multer configuration — use /tmp in production (Vercel read-only FS), public/uploads locally
const isVercel = !!process.env.VERCEL;
const uploadDir = isVercel ? "/tmp/uploads" : path.join(process.cwd(), "public", "uploads");
try { if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true }); } catch (_) {}
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `img_${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// ── Editor Auth & Data ────────────────────────────────────────────────────────
const EDITOR_EMAIL = "letsokothabiso@gmail.com";
const EDITOR_PASSWORD = process.env.EDITOR_PASSWORD || "startupafrika";

type ArticleStatus = "draft" | "published";
interface Article {
  id: string;
  title: string;
  subtitle: string;
  founderName: string;
  startupName: string;
  location: string;
  foundedYear: string;
  tags: string[];
  coverImage: string;
  coverHeight?: number;
  coverPosition?: string;
  body: string;
  status: ArticleStatus;
  wordCount: number;
  createdAt: string;
  updatedAt: string;
}
const articles: Article[] = [];

function requireEditorToken(req: express.Request, res: express.Response, next: express.NextFunction) {
  const token = req.headers["x-editor-token"] as string;
  const validToken = crypto.createHmac("sha256", EDITOR_PASSWORD).update(EDITOR_EMAIL).digest("hex");
  
  if (!token || token !== validToken) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

// Firestore is now used for subscribers and users

const submissions: Array<{
  id: string;
  founderName: string;
  startupName: string;
  email: string;
  answers: {
    spark: string;
    mvp: string;
    techStack: string;
    traction: string;
    revenue: string;
    lesson: string;
  };
  date: string;
}> = [];

// Initialize Gemini Client
const ai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    })
  : null;

// ── Editor Auth Routes ───────────────────────────────────────────────────────
app.post("/api/editor/login", (req, res) => {
  const { email, password } = req.body;
  if (email !== EDITOR_EMAIL || password !== EDITOR_PASSWORD) {
    return res.status(401).json({ error: "Invalid credentials." });
  }
  const token = crypto.createHmac("sha256", EDITOR_PASSWORD).update(EDITOR_EMAIL).digest("hex");
  res.json({ success: true, token });
});

app.post("/api/editor/verify", (req, res) => {
  const { token } = req.body;
  const validToken = crypto.createHmac("sha256", EDITOR_PASSWORD).update(EDITOR_EMAIL).digest("hex");
  res.json({ valid: !!(token && token === validToken) });
});

app.post("/api/editor/logout", (req, res) => {
  // Stateless logout: the client just deletes their token locally
  res.json({ success: true });
});

// ── Editor Articles Routes ────────────────────────────────────────────────────
app.get("/api/editor/articles", requireEditorToken, async (_req, res) => {
  if (db) {
    try {
      const snapshot = await db.collection("articles").get();
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Article));
      fetched.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      return res.json(fetched);
    } catch (error) {
      console.error("Firestore fetch articles error:", error);
      return res.status(500).json({ error: "Failed to fetch articles from database", details: error instanceof Error ? error.message : String(error) });
    }
  }
  res.json(articles.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()));
});

app.post("/api/editor/articles", requireEditorToken, async (req, res) => {
  const { id, title, subtitle, founderName, startupName, location, foundedYear, tags, coverImage, coverHeight, coverPosition, body, status } = req.body;
  const wordCount = body ? body.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length : 0;
  
  if (db) {
    try {
      const targetId = id || `art_${Date.now()}`;
      const docRef = db.collection("articles").doc(targetId);
      const docSnap = await docRef.get();

      let oldStatus = "draft";
      let createdAt = new Date().toISOString();

      if (docSnap.exists) {
        const oldData = docSnap.data();
        oldStatus = oldData?.status || "draft";
        createdAt = oldData?.createdAt || createdAt;
      }

      const savedArticle: Article = {
        id: targetId,
        title: title || "Untitled Article",
        subtitle: subtitle || "",
        founderName: founderName || "",
        startupName: startupName || "",
        location: location || "",
        foundedYear: foundedYear || "",
        tags: tags || [],
        coverImage: coverImage || "",
        coverHeight: coverHeight !== undefined ? coverHeight : 288,
        coverPosition: coverPosition || "center",
        body: body || "",
        status: status || "draft",
        wordCount,
        createdAt,
        updatedAt: new Date().toISOString(),
      };

      await docRef.set(savedArticle, { merge: true });

      if (status === "published" && (oldStatus === "draft" || !docSnap.exists)) {
        sendPublishEmail(savedArticle.title, savedArticle.subtitle);
      }

      return res.json({ success: true, article: savedArticle });
    } catch (error) {
      console.error("Firestore save article error:", error);
      return res.status(500).json({ success: false, error: "Failed to save article to database", details: error instanceof Error ? error.message : String(error) });
    }
  }

  if (id) {
    const idx = articles.findIndex((a) => a.id === id);
    if (idx !== -1) {
      const oldStatus = articles[idx].status;
      articles[idx] = { ...articles[idx], title, subtitle, founderName, startupName, location, foundedYear, tags, coverImage, coverHeight, coverPosition, body, status, wordCount, updatedAt: new Date().toISOString() };
      
      if (oldStatus === "draft" && status === "published") {
        sendPublishEmail(title, subtitle);
      }
      return res.json({ success: true, article: articles[idx] });
    }
  }
  const newArticle: Article = {
    id: `art_${Date.now()}`,
    title: title || "Untitled Article",
    subtitle: subtitle || "",
    founderName: founderName || "",
    startupName: startupName || "",
    location: location || "",
    foundedYear: foundedYear || "",
    tags: tags || [],
    coverImage: coverImage || "",
    coverHeight: coverHeight !== undefined ? coverHeight : 288,
    coverPosition: coverPosition || "center",
    body: body || "",
    status: status || "draft",
    wordCount,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  articles.push(newArticle);

  if (status === "published") {
    sendPublishEmail(title, subtitle);
  }
  res.json({ success: true, article: newArticle });
});

async function sendPublishEmail(title: string, subtitle: string) {
  if (!db || !resend) {
    console.warn("Skipping email announcement: Firebase or Resend is not configured.");
    return;
  }
  try {
    const snapshot = await db.collection("subscribers").get();
    const emails = snapshot.docs.map(doc => doc.data().email).filter(Boolean);
    
    // We send to users collection as well if they aren't in subscribers (or assume they are in subscribers)
    const usersSnapshot = await db.collection("users").get();
    const userEmails = usersSnapshot.docs.map(doc => doc.data().email).filter(Boolean);
    
    // Combine and deduplicate
    const allEmails = Array.from(new Set([...emails, ...userEmails]));
    
    if (allEmails.length > 0 && process.env.RESEND_API_KEY) {
      // Resend allows up to 50 recipients per batch in the 'to' or 'bcc' field. For a real app, chunk the array.
      await resend.emails.send({
        from: 'Startup Afrika <onboarding@resend.dev>', // Use a verified domain or Resend testing domain
        to: allEmails.slice(0, 50),
        subject: `New Article: ${title}`,
        html: `<p>A new article has been published on Startup Afrika: <strong>${title}</strong></p><p>${subtitle}</p><p><a href="https://startup.afrika">Read it now</a></p>`
      });
      console.log(`Announcement email sent to ${Math.min(allEmails.length, 50)} subscribers.`);
    }
  } catch (error) {
    console.error("Failed to send announcement emails:", error);
  }
}

app.delete("/api/editor/articles/:id", requireEditorToken, async (req, res) => {
  const { id } = req.params;
  if (db) {
    try {
      await db.collection("articles").doc(id).delete();
      return res.json({ success: true });
    } catch (error) {
      console.error("Firestore delete article error:", error);
    }
  }
  const idx = articles.findIndex((a) => a.id === id);
  if (idx !== -1) articles.splice(idx, 1);
  res.json({ success: true });
});

// ── Public API Routes ─────────────────────────────────────────────────────────
app.get("/api/articles", async (req, res) => {
  if (db) {
    try {
      const snapshot = await db.collection("articles").where("status", "==", "published").get();
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Article));
      fetched.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      return res.json(fetched);
    } catch (error) {
      console.error("Firestore fetch published articles error:", error);
    }
  }
  const published = articles
    .filter((a) => a.status === "published")
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  res.json(published);
});
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", geminiConfigured: !!ai });
});

// Subscriber Endpoints
app.get("/api/subscribers", async (req, res) => {
  if (!db) return res.json([]);
  try {
    const snapshot = await db.collection("subscribers").get();
    const subs = snapshot.docs.map(doc => doc.data());
    res.json(subs);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch subscribers" });
  }
});

app.post("/api/subscribers", async (req, res) => {
  if (!db) return res.status(503).json({ error: "Database not configured" });
  const { email } = req.body;
  if (!email || !email.includes("@")) {
    return res.status(400).json({ error: "Invalid email address" });
  }
  try {
    const docRef = db.collection("subscribers").doc(email.toLowerCase());
    const docSnap = await docRef.get();
    if (docSnap.exists) {
      return res.status(400).json({ error: "Email is already subscribed" });
    }
    const newSub = { email: email.toLowerCase(), date: new Date().toISOString() };
    await docRef.set(newSub);
    res.json({ success: true, subscriber: newSub });
  } catch (error) {
    res.status(500).json({ error: "Failed to subscribe" });
  }
});

// Demo/Developer Bypass Login
app.post("/api/users/demo-login", async (req, res) => {
  if (!db) return res.status(503).json({ error: "Database not configured" });
  const { email, name, picture } = req.body;
  if (!email || !email.includes("@")) {
    return res.status(400).json({ error: "Invalid email address" });
  }
  try {
    const userRef = db.collection("users").doc(email.toLowerCase());
    await userRef.set({
      email: email.toLowerCase(),
      name: name || "Developer Demo",
      picture: picture || "",
      lastLogin: new Date().toISOString(),
      isDemo: true
    }, { merge: true });

    // Auto-subscribe
    const subRef = db.collection("subscribers").doc(email.toLowerCase());
    const subSnap = await subRef.get();
    if (!subSnap.exists) {
      await subRef.set({
        email: email.toLowerCase(),
        date: new Date().toISOString(),
        source: 'demo_signup'
      });
    }

    res.json({
      success: true,
      user: {
        uid: email.toLowerCase(),
        email: email.toLowerCase(),
        displayName: name || "Developer Demo",
        photoURL: picture || ""
      }
    });
  } catch (error) {
    console.error("Demo login error:", error);
    res.status(500).json({ error: "Failed to process demo login" });
  }
});

// User Sync Endpoint
app.post("/api/users/sync", async (req, res) => {
  if (!db) return res.status(503).json({ error: "Database not configured" });
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return res.status(401).json({ error: "Unauthorized" });
  
  const idToken = authHeader.split("Bearer ")[1];
  try {
    const decodedToken = await verifyFirebaseIdToken(idToken);
    const userRef = db.collection("users").doc(decodedToken.uid);
    await userRef.set({
      email: decodedToken.email,
      name: decodedToken.name || "",
      picture: decodedToken.picture || "",
      lastLogin: new Date().toISOString()
    }, { merge: true });
    
    // Auto-subscribe
    if (decodedToken.email) {
       const subRef = db.collection("subscribers").doc(decodedToken.email.toLowerCase());
       const subSnap = await subRef.get();
       if (!subSnap.exists) {
         await subRef.set({ email: decodedToken.email.toLowerCase(), date: new Date().toISOString(), source: 'signup' });
       }
    }

    res.json({ success: true });
  } catch (error) {
    console.error("User sync error", error);
    res.status(401).json({ error: "Invalid token" });
  }
});

// Submissions Endpoints
app.get("/api/submissions", (req, res) => {
  res.json(submissions);
});

app.post("/api/submissions", (req, res) => {
  const { founderName, startupName, email, answers } = req.body;
  if (!founderName || !startupName || !email || !answers) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  const newSubmission = {
    id: `sub_${Date.now()}`,
    founderName,
    startupName,
    email,
    answers,
    date: new Date().toISOString(),
  };
  submissions.push(newSubmission);
  res.json({ success: true, submission: newSubmission });
});

// Gemini Outreach Script and Interview Generator
app.post("/api/generate-outreach", async (req, res) => {
  if (!ai) {
    return res.status(500).json({
      error: "Gemini API key is not configured. Please add GEMINI_API_KEY in the Secrets panel.",
    });
  }

  const { startupName, description, targetAchievements } = req.body;
  if (!startupName || !description) {
    return res.status(400).json({ error: "Startup name and description are required." });
  }

  try {
    const prompt = `
      You are Thabiso, the founder of Slyzah (a creative web platform and startup) and the host of 'Startup Afrika', a premium media channel and newsletter that interviews successful African founders and developers about their real blueprints.
      
      You are drafting a professional, highly compelling cold email outreach to a startup founder you want to interview.
      
      Target Founder / Startup Details:
      - Startup Name: ${startupName}
      - Description: ${description}
      - Key Achievements / Notable Focus: ${targetAchievements || "General market entry and tech stack"}
      
      Please generate:
      1. A professional, catchy email Subject line.
      2. A highly personalized, respectful Email Body. You should mention that you are the founder of Slyzah yourself, and establish peer-to-peer credibility. Do not ask for generic business advice; focus on engineering, payments, and actual user traction. Keep it concise (under 250 words) so they actually reply. Explain that the interview is done entirely over email (6 questions) and we also request visual assets like headshots and screenshots.
      3. A customized list of exactly 6 interview questions tailored SPECIFICALLY to their industry, product type, and region (e.g., if they do fintech, ask about payment integrations, licensing, or local trust; if they do logistics, ask about route mapping, delivery agents, or infrastructure). Match the tone of these questions to the standard Startup Afrika structure:
         - Question 1: The Spark (inspiration)
         - Question 2: The MVP (first build, timeline)
         - Question 3: The Tech Stack (exact technologies used)
         - Question 4: Gaining Traction (getting first 100 paying customers)
         - Question 5: The Revenue (business model, profitability path)
         - Question 6: The Lesson (major early mistake to avoid)
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            subject: {
              type: Type.STRING,
              description: "The subject line of the email",
            },
            emailBody: {
              type: Type.STRING,
              description: "The complete, personalized email body text",
            },
            customQuestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Array of exactly 6 customized questions based on the startup's niche",
            },
          },
          required: ["subject", "emailBody", "customQuestions"],
        },
      },
    });

    const text = response.text?.trim() || "{}";
    const result = JSON.parse(text);
    res.json(result);
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    res.status(500).json({ error: error.message || "Failed to generate outreach via Gemini" });
  }
});

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("EXPRESS UNHANDLED ERROR:", err);
  res.status(500).json({ 
    error: "Internal Server Error", 
    message: err.message || "An unexpected error occurred", 
    stack: err.stack 
  });
});

// Configure Vite or Static Assets serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Startup Afrika Server] running on http://localhost:${PORT}`);
  });
}

// Only start the server locally, not when running as a Vercel serverless function
if (process.env.NODE_ENV !== "production" || process.env.RUN_LOCAL === "true") {
  startServer();
}

export default app;
