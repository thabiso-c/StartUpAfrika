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

// Catch unhandled rejections globally to prevent any GCP library auth/gRPC failures from crashing the Node.js process.
process.on("unhandledRejection", (reason, promise) => {
  console.warn("Caught Unhandled Rejection in background task:", reason);
});

// Setup paths for local file-based storage fallback
const isVercel = !!process.env.VERCEL;
const dataDir = isVercel ? "/tmp/data" : path.join(process.cwd(), "data");
try { if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true }); } catch (_) {}

const ARTICLES_FILE = path.join(dataDir, "articles.json");
const SUBSCRIBERS_FILE = path.join(dataDir, "subscribers.json");
const USERS_FILE = path.join(dataDir, "users.json");
const SUBMISSIONS_FILE = path.join(dataDir, "submissions.json");
const EMAIL_LOGS_FILE = path.join(dataDir, "email_logs.json");

// Helper to load array from disk
function loadJsonArray<T>(filePath: string, fallback: T[]): T[] {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, "utf-8");
      return JSON.parse(content);
    }
  } catch (error) {
    console.error(`Error loading JSON from ${filePath}:`, error);
  }
  return fallback;
}

// Helper to save array to disk
function saveJsonArray<T>(filePath: string, data: T[]): void {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    console.error(`Error saving JSON to ${filePath}:`, error);
  }
}

try {
  const serviceAccountVar = process.env.FIREBASE_SERVICE_ACCOUNT || process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  const projectId = process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
  const hasCredentials = !!(serviceAccountVar || process.env.GOOGLE_APPLICATION_CREDENTIALS);
  const isProduction = process.env.NODE_ENV === "production" || !!process.env.VERCEL || !!process.env.K_SERVICE;

  // Only initialize Firestore if:
  // 1. We have explicit credentials provided (works anywhere)
  // 2. We are in production and have a projectId (ambient GCP credentials available)
  const shouldInitializeFirestore = hasCredentials || (isProduction && !!projectId);

  if (shouldInitializeFirestore) {
    let app;
    if (!getApps().length) {
      if (serviceAccountVar) {
        try {
          const serviceAccount = JSON.parse(serviceAccountVar);
          app = initializeApp({
            credential: cert(serviceAccount),
            projectId: projectId || serviceAccount.project_id
          });
          console.log("Firebase Admin successfully initialized via service account.");
        } catch (parseErr) {
          console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT, falling back:", parseErr);
          app = initializeApp({ projectId: projectId || "startup-afrika" });
        }
      } else if (projectId) {
        app = initializeApp({ projectId });
        console.log(`Firebase Admin initialized with explicit projectId: ${projectId}`);
      } else {
        app = initializeApp();
        console.log("Firebase Admin initialized via default ambient credentials.");
      }
    } else {
      app = getApps()[0];
    }

    const dbId = process.env.FIREBASE_DATABASE_ID || process.env.VITE_FIREBASE_DATABASE_ID;
    if (dbId && dbId !== "(default)") {
      console.log(`Initializing Firestore with custom database ID: ${dbId}`);
      db = getFirestore(app, dbId);
    } else {
      console.log("Initializing Firestore with standard (default) database.");
      db = getFirestore(app);
    }
  } else {
    console.log("Firestore is disabled (no credentials in development or missing project ID in production); falling back to local file persistence.");
    db = null;
  }
} catch (error) {
  console.error("Firebase Admin initialization error, disabling Firestore database:", error);
  db = null;
}

// Perform a silent asynchronous validation of Firestore connection if db exists.
if (db) {
  db.collection("_health")
    .limit(1)
    .get()
    .then(() => {
      console.log("Firebase Firestore connection verified successfully.");
    })
    .catch((err) => {
      console.warn("Firebase Firestore is unreachable or credentials are missing. Disabling Firestore to fallback to local file storage. Error:", err instanceof Error ? err.message : String(err));
      db = null;
    });
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

const DEFAULT_ARTICLES: Article[] = [];

const loadedArticles = loadJsonArray<Article>(ARTICLES_FILE, []).filter(a => !a.id.startsWith("seed_"));
if (loadedArticles.length === 0) {
  saveJsonArray(ARTICLES_FILE, DEFAULT_ARTICLES);
}
const articles: Article[] = loadedArticles;

function requireEditorToken(req: express.Request, res: express.Response, next: express.NextFunction) {
  const token = req.headers["x-editor-token"] as string;
  const validToken = crypto.createHmac("sha256", EDITOR_PASSWORD).update(EDITOR_EMAIL).digest("hex");
  
  if (!token || token !== validToken) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

// Fallback arrays when Firestore is unavailable/disabled, loaded from disk
const subscribers: Array<{ email: string; date: string; source?: string }> = loadJsonArray(SUBSCRIBERS_FILE, []);
const users: Array<{ uid: string; email: string; name: string; picture: string; lastLogin: string; isDemo?: boolean }> = loadJsonArray(USERS_FILE, []);

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
}> = loadJsonArray(SUBMISSIONS_FILE, []);

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
      console.error("Firestore fetch articles error, falling back to local files:", error);
      db = null; // Disable Firestore dynamically on failure
    }
  }
  res.json(articles.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()));
});

app.post("/api/editor/articles", requireEditorToken, async (req, res) => {
  const { id, title, subtitle, founderName, startupName, location, foundedYear, tags, coverImage, coverHeight, coverPosition, body, status } = req.body;
  const wordCount = body ? body.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length : 0;
  
  // Build article object for email
  const buildArticle = (targetId: string, createdAt: string) => ({
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
  });
  
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

      const savedArticle = buildArticle(targetId, createdAt);

      await docRef.set(savedArticle, { merge: true });

      let emailResult = null;
      if (status === "published") {
        emailResult = await sendPublishEmail(savedArticle);
      }

      return res.json({ success: true, article: savedArticle, emailResult });
    } catch (error) {
      console.error("Firestore save article error, falling back to local files:", error);
      db = null; // Disable Firestore dynamically on failure
    }
  }

  if (id) {
    const idx = articles.findIndex((a) => a.id === id);
    if (idx !== -1) {
      const oldStatus = articles[idx].status;
      articles[idx] = { ...articles[idx], title, subtitle, founderName, startupName, location, foundedYear, tags, coverImage, coverHeight, coverPosition, body, status, wordCount, updatedAt: new Date().toISOString() };
      
      let emailResult = null;
      if (status === "published") {
        emailResult = await sendPublishEmail(articles[idx]);
      }
      saveJsonArray(ARTICLES_FILE, articles);
      return res.json({ success: true, article: articles[idx], emailResult });
    }
  }
  const newArticle: Article = buildArticle(`art_${Date.now()}`, new Date().toISOString());
  articles.push(newArticle);
  saveJsonArray(ARTICLES_FILE, articles);

  let emailResult = null;
  if (status === "published") {
    emailResult = await sendPublishEmail(newArticle);
  }
  res.json({ success: true, article: newArticle, emailResult });
});

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

function buildEmailHtml(article: Article): string {
  const { title, subtitle, founderName, startupName, coverImage, tags, body } = article;
  const previewText = stripHtml(body).substring(0, 200);
  const tagsHtml = (tags || []).map((t: string) => 
    `<span style="display:inline-block;background:rgba(5,150,105,0.15);color:#059669;font-size:12px;font-weight:600;padding:4px 12px;border-radius:999px;margin:0 4px 4px 0;letter-spacing:0.3px;">${t}</span>`
  ).join("");
  const articleUrl = `https://startup.afrika?article=${article.id}`;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
  </style>
</head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:'Inter',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:24px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="padding:28px 32px 0;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-size:14px;font-weight:700;color:#065f46;letter-spacing:1px;text-transform:uppercase;">Startup Afrika</td>
                  <td align="right" style="font-size:12px;color:#9ca3af;">New Article</td>
                </tr>
              </table>
              <div style="height:1px;background:#e5e7eb;margin:16px 0 0;"></div>
            </td>
          </tr>
          <!-- Cover Image -->
          ${coverImage ? `<tr>
            <td style="padding:20px 0 0;">
              <img src="${coverImage}" alt="${founderName || 'Article'}" style="width:100%;height:auto;max-height:360px;object-fit:cover;display:block;" />
            </td>
          </tr>` : `<tr>
            <td style="padding:32px 32px 0;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#0c3121,#064e3b);border-radius:12px;padding:48px 32px;">
                <tr><td align="center" style="color:rgba(255,255,255,0.6);font-size:13px;font-weight:500;letter-spacing:0.5px;">📖 Startup Afrika</td></tr>
              </table>
            </td>
          </tr>`}
          <!-- Tags -->
          ${tagsHtml ? `<tr>
            <td style="padding:24px 32px 0;">${tagsHtml}</td>
          </tr>` : ''}
          <!-- Title -->
          <tr>
            <td style="padding:${tagsHtml ? '8px' : '28px'} 32px 0;">
              <h1 style="margin:0;font-size:28px;font-weight:800;color:#111827;line-height:1.2;letter-spacing:-0.3px;">${title}</h1>
            </td>
          </tr>
          <!-- Subtitle -->
          ${subtitle ? `<tr>
            <td style="padding:12px 32px 0;">
              <p style="margin:0;font-size:16px;color:#6b7280;line-height:1.5;">${subtitle}</p>
            </td>
          </tr>` : ''}
          <!-- Founder Info -->
          <tr>
            <td style="padding:20px 32px 0;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td width="44" style="width:44px;vertical-align:middle;">
                    <table width="44" height="44" cellpadding="0" cellspacing="0" style="width:44px;height:44px;background:#047857;border-radius:50%;">
                      <tr><td align="center" style="color:#fff;font-size:18px;font-weight:700;">${(founderName || 'S')?.charAt(0).toUpperCase()}</td></tr>
                    </table>
                  </td>
                  <td style="padding-left:12px;vertical-align:middle;">
                    <p style="margin:0;font-size:14px;font-weight:600;color:#374151;">${founderName || 'Startup Afrika'}</p>
                    <p style="margin:2px 0 0;font-size:13px;color:#9ca3af;">${startupName || 'Featured Article'}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Preview Body -->
          ${previewText ? `<tr>
            <td style="padding:20px 32px 0;">
              <p style="margin:0;font-size:15px;color:#4b5563;line-height:1.7;">${previewText}…</p>
            </td>
          </tr>` : ''}
          <!-- CTA Button -->
          <tr>
            <td style="padding:28px 32px 40px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#065f46;border-radius:10px;padding:0;">
                    <a href="${articleUrl}" target="_blank" style="display:inline-block;padding:14px 36px;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:0.5px;text-transform:uppercase;">Read the Full Story →</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f3f4f6;padding:24px 32px;">
              <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">
                You received this email because you subscribed to Startup Afrika.<br>
                <a href="https://startup.afrika" style="color:#065f46;text-decoration:underline;">Startup Afrika</a> — Stories from African founders
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

async function sendPublishEmail(article: Article) {
  let allEmails: string[] = [];
  try {
    if (db) {
      const snapshot = await db.collection("subscribers").get();
      const emails = snapshot.docs.map(doc => doc.data().email).filter(Boolean);
      
      const usersSnapshot = await db.collection("users").get();
      const userEmails = usersSnapshot.docs.map(doc => doc.data().email).filter(Boolean);
      
      allEmails = Array.from(new Set([...emails, ...userEmails]));
    } else {
      // Fallback to local files
      const localSubs = loadJsonArray(SUBSCRIBERS_FILE, [] as { email: string }[]);
      const localUsers = loadJsonArray(USERS_FILE, [] as { email: string }[]);
      const emails = localSubs.map(s => s.email).filter(Boolean);
      const userEmails = localUsers.map(u => u.email).filter(Boolean);
      allEmails = Array.from(new Set([...emails, ...userEmails]));
    }
    
    // Normalize and filter valid emails
    allEmails = allEmails.map(e => e.trim().toLowerCase()).filter(e => e && e.includes("@"));

    let isSimulated = true;
    let sent = false;

    if (allEmails.length > 0) {
      if (resend && process.env.RESEND_API_KEY) {
        try {
          const emailHtml = buildEmailHtml(article);
          await resend.emails.send({
            from: 'Startup Afrika <newsletter@startupafrika.co.za>',
            to: allEmails.slice(0, 50),
            subject: `New Article: ${article.title}`,
            html: emailHtml
          });
          isSimulated = false;
          sent = true;
          console.log(`Beautiful announcement email sent to ${Math.min(allEmails.length, 50)} subscribers.`);
        } catch (err) {
          console.error("Resend API failed, falling back to simulation log. Error:", err);
        }
      } else {
        console.log(`[SIMULATION] Announcement email sent to subscribers:`, allEmails);
        sent = true;
      }
      
      // Save log entry to EMAIL_LOGS_FILE
      const logs = loadJsonArray(EMAIL_LOGS_FILE, [] as any[]);
      const newLog = {
        id: `email_log_${Date.now()}`,
        title: article.title,
        subtitle: article.subtitle,
        emailsCount: allEmails.length,
        emails: allEmails,
        sentAt: new Date().toISOString(),
        isSimulated
      };
      logs.unshift(newLog);
      saveJsonArray(EMAIL_LOGS_FILE, logs);
    }
    
    return {
      sent,
      count: allEmails.length,
      emails: allEmails,
      isSimulated
    };
  } catch (error) {
    console.error("Failed to send announcement emails:", error);
    return {
      sent: false,
      count: 0,
      emails: [],
      isSimulated: !resend,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

app.get("/api/editor/email-logs", requireEditorToken, async (_req, res) => {
  const logs = loadJsonArray(EMAIL_LOGS_FILE, []);
  res.json({ success: true, logs });
});

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
  if (idx !== -1) {
    articles.splice(idx, 1);
    saveJsonArray(ARTICLES_FILE, articles);
  }
  res.json({ success: true });
});

// ── Public API Routes ─────────────────────────────────────────────────────────
app.post("/api/articles/sync", async (req, res) => {
  const clientArticles = req.body.articles || [];
  if (!Array.isArray(clientArticles)) {
    return res.status(400).json({ error: "Invalid articles payload" });
  }

  if (db) {
    try {
      for (const item of clientArticles) {
        if (!item.id) continue;
        const docRef = db.collection("articles").doc(item.id);
        const docSnap = await docRef.get();
        if (!docSnap.exists) {
          await docRef.set(item);
        } else {
          const serverData = docSnap.data();
          const serverUpdated = serverData?.updatedAt ? new Date(serverData.updatedAt).getTime() : 0;
          const clientUpdated = item.updatedAt ? new Date(item.updatedAt).getTime() : 0;
          if (clientUpdated > serverUpdated) {
            await docRef.set(item, { merge: true });
          }
        }
      }
      const snapshot = await db.collection("articles").get();
      const dbArticles: Article[] = [];
      snapshot.forEach((doc) => {
        dbArticles.push({ id: doc.id, ...doc.data() } as Article);
      });
      return res.json({ success: true, articles: dbArticles });
    } catch (error) {
      console.error("Firestore sync articles error, falling back:", error);
      db = null;
    }
  }

  let hasChanges = false;
  for (const item of clientArticles) {
    if (!item.id) continue;
    const idx = articles.findIndex((a) => a.id === item.id);
    if (idx === -1) {
      articles.push(item);
      hasChanges = true;
    } else {
      const serverUpdated = articles[idx].updatedAt ? new Date(articles[idx].updatedAt).getTime() : 0;
      const clientUpdated = item.updatedAt ? new Date(item.updatedAt).getTime() : 0;
      if (clientUpdated > serverUpdated) {
        articles[idx] = item;
        hasChanges = true;
      }
    }
  }

  if (hasChanges) {
    saveJsonArray(ARTICLES_FILE, articles);
  }

  res.json({ success: true, articles });
});

app.get("/api/articles", async (req, res) => {
  if (db) {
    try {
      const snapshot = await db.collection("articles").where("status", "==", "published").get();
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Article));
      fetched.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      return res.json(fetched);
    } catch (error) {
      console.error("Firestore fetch published articles error, falling back:", error);
      db = null;
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
  if (!db) {
    return res.json(subscribers);
  }
  try {
    const snapshot = await db.collection("subscribers").get();
    const subs = snapshot.docs.map(doc => doc.data());
    res.json(subs);
  } catch (error) {
    console.error("Firestore fetch subscribers error, falling back:", error);
    db = null;
    res.json(subscribers);
  }
});

app.post("/api/subscribers", async (req, res) => {
  const { email } = req.body;
  if (!email || !email.includes("@")) {
    return res.status(400).json({ error: "Invalid email address" });
  }
  const normalizedEmail = email.toLowerCase();

  if (!db) {
    const exists = subscribers.some(s => s.email === normalizedEmail);
    if (exists) {
      return res.status(400).json({ error: "Email is already subscribed" });
    }
    const newSub = { email: normalizedEmail, date: new Date().toISOString() };
    subscribers.push(newSub);
    saveJsonArray(SUBSCRIBERS_FILE, subscribers);
    return res.json({ success: true, subscriber: newSub });
  }

  try {
    const docRef = db.collection("subscribers").doc(normalizedEmail);
    const docSnap = await docRef.get();
    if (docSnap.exists) {
      return res.status(400).json({ error: "Email is already subscribed" });
    }
    const newSub = { email: normalizedEmail, date: new Date().toISOString() };
    await docRef.set(newSub);
    res.json({ success: true, subscriber: newSub });
  } catch (error) {
    console.error("Firestore subscribe error, falling back:", error);
    db = null;
    const exists = subscribers.some(s => s.email === normalizedEmail);
    if (exists) {
      return res.status(400).json({ error: "Email is already subscribed" });
    }
    const newSub = { email: normalizedEmail, date: new Date().toISOString() };
    subscribers.push(newSub);
    saveJsonArray(SUBSCRIBERS_FILE, subscribers);
    res.json({ success: true, subscriber: newSub });
  }
});

// Demo/Developer Bypass Login
app.post("/api/users/demo-login", async (req, res) => {
  const { email, name, picture } = req.body;
  if (!email || !email.includes("@")) {
    return res.status(400).json({ error: "Invalid email address" });
  }
  const normalizedEmail = email.toLowerCase();

  if (!db) {
    const user = {
      uid: normalizedEmail,
      email: normalizedEmail,
      name: name || "Developer Demo",
      picture: picture || "",
      lastLogin: new Date().toISOString(),
      isDemo: true
    };
    const exists = users.some(u => u.uid === normalizedEmail);
    if (!exists) {
      users.push(user);
    }
    const subExists = subscribers.some(s => s.email === normalizedEmail);
    if (!subExists) {
      subscribers.push({
        email: normalizedEmail,
        date: new Date().toISOString(),
        source: 'demo_signup'
      });
    }
    saveJsonArray(USERS_FILE, users);
    saveJsonArray(SUBSCRIBERS_FILE, subscribers);
    return res.json({
      success: true,
      user: {
        uid: normalizedEmail,
        email: normalizedEmail,
        displayName: user.name,
        photoURL: user.picture
      }
    });
  }

  try {
    const userRef = db.collection("users").doc(normalizedEmail);
    await userRef.set({
      email: normalizedEmail,
      name: name || "Developer Demo",
      picture: picture || "",
      lastLogin: new Date().toISOString(),
      isDemo: true
    }, { merge: true });

    // Auto-subscribe
    const subRef = db.collection("subscribers").doc(normalizedEmail);
    const subSnap = await subRef.get();
    if (!subSnap.exists) {
      await subRef.set({
        email: normalizedEmail,
        date: new Date().toISOString(),
        source: 'demo_signup'
      });
    }

    res.json({
      success: true,
      user: {
        uid: normalizedEmail,
        email: normalizedEmail,
        displayName: name || "Developer Demo",
        photoURL: picture || ""
      }
    });
  } catch (error) {
    console.error("Demo login error, falling back:", error);
    db = null;
    const user = {
      uid: normalizedEmail,
      email: normalizedEmail,
      name: name || "Developer Demo",
      picture: picture || "",
      lastLogin: new Date().toISOString(),
      isDemo: true
    };
    const exists = users.some(u => u.uid === normalizedEmail);
    if (!exists) {
      users.push(user);
      saveJsonArray(USERS_FILE, users);
    }
    return res.json({
      success: true,
      user: {
        uid: normalizedEmail,
        email: normalizedEmail,
        displayName: user.name,
        photoURL: user.picture
      }
    });
  }
});

// User Sync Endpoint
app.post("/api/users/sync", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return res.status(401).json({ error: "Unauthorized" });
  
  const idToken = authHeader.split("Bearer ")[1];
  try {
    const decodedToken = await verifyFirebaseIdToken(idToken);
    
    if (db) {
      try {
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
        return res.json({ success: true });
      } catch (dbErr) {
        console.error("Firestore user sync error, falling back to local files:", dbErr);
        db = null;
      }
    }

    const user = {
      uid: decodedToken.uid,
      email: decodedToken.email || "",
      name: decodedToken.name || "",
      picture: decodedToken.picture || "",
      lastLogin: new Date().toISOString()
    };
    const exists = users.some(u => u.uid === user.uid);
    if (!exists) users.push(user);

    if (decodedToken.email) {
      const subExists = subscribers.some(s => s.email === decodedToken.email!.toLowerCase());
      if (!subExists) {
        subscribers.push({ email: decodedToken.email.toLowerCase(), date: new Date().toISOString(), source: 'signup' });
      }
    }
    saveJsonArray(USERS_FILE, users);
    saveJsonArray(SUBSCRIBERS_FILE, subscribers);
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
  saveJsonArray(SUBMISSIONS_FILE, submissions);
  res.json({ success: true, submission: newSubmission });
});

// News API Endpoint with AI Rewriting
app.get("/api/news", async (req, res) => {
  try {
    const apiKey = process.env.NEWSAPI_KEY;
    
    if (!apiKey) {
      return res.json({ 
        error: "News API key not configured",
        articles: []
      });
    }

    // Fetch African tech, startup, and fintech news
    const techResponse = await fetch(
      `https://newsapi.org/v2/everything?q=Africa+technology+startup+fintech&sortBy=publishedAt&pageSize=6&apiKey=${apiKey}`
    );

    // Fetch African AI news
    const aiResponse = await fetch(
      `https://newsapi.org/v2/everything?q=Africa+AI+artificial+intelligence+machine+learning&sortBy=publishedAt&pageSize=4&apiKey=${apiKey}`
    );

    if (!techResponse.ok || !aiResponse.ok) {
      throw new Error("Failed to fetch news from API");
    }

    const techData = await techResponse.json();
    const aiData = await aiResponse.json();

    const combined = [
      ...(techData.articles || []).map((a: any) => ({
        title: a.title,
        description: a.description || "",
        url: a.url,
        source: a.source?.name || "Unknown",
        publishedAt: a.publishedAt,
        imageUrl: a.urlToImage,
      })),
      ...(aiData.articles || []).map((a: any) => ({
        title: a.title,
        description: a.description || "",
        url: a.url,
        source: a.source?.name || "Unknown",
        publishedAt: a.publishedAt,
        imageUrl: a.urlToImage,
      })),
    ];

    // Remove duplicates by URL
    const unique = combined.filter((article, index, self) =>
      index === self.findIndex((a) => a.url === article.url)
    );

    // Sort by date
    unique.sort((a, b) => 
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );

    const newsArticles = unique.slice(0, 8);

    // Rewrite articles to focus on African innovation (rule-based, no AI required)
    if (newsArticles.length > 0) {
      try {
        console.log(`Rewriting ${newsArticles.length} articles for African innovation focus...`);
        const rewrittenArticles = newsArticles.map((article, index) => {
          // Always rewrite the title and description
          const originalTitle = article.title;
          const originalDesc = article.description || "";
          
          // Extract sector from content
          let sector = "Technology";
          const content = (originalTitle + " " + originalDesc).toLowerCase();
          
          if (content.includes('fintech') || content.includes('payment') || content.includes('banking') || content.includes('stablecoin')) {
            sector = "Fintech";
          } else if (content.includes('health') || content.includes('medical') || content.includes('healthcare')) {
            sector = "Health Tech";
          } else if (content.includes('e-commerce') || content.includes('ecommerce') || content.includes('retail')) {
            sector = "E-commerce";
          } else if (content.includes('agriculture') || content.includes('agritech')) {
            sector = "Agriculture Tech";
          } else if (content.includes('mining') || content.includes('mineral')) {
            sector = "Mining Tech";
          } else if (content.includes('manufacturing') || content.includes('industrial')) {
            sector = "Manufacturing Tech";
          } else if (content.includes('ai') || content.includes('artificial intelligence') || content.includes('machine learning')) {
            sector = "AI & Machine Learning";
          }
          
          // Rewrite title to focus on African innovation
          const rewrittenTitle = `African ${sector} Innovation: Young Founders and Developers Building the Future Across the Continent`;
          
          // Rewrite description to focus on young African founders
          const shortDesc = originalDesc.substring(0, 250).replace(/<[^>]+>/g, '').trim();
          const rewrittenDesc = `A new generation of young African founders and developers is transforming the continent through innovative ${sector.toLowerCase()} solutions. ${shortDesc} This highlights the growing tech ecosystem across Africa, where young entrepreneurs under 35 are building world-class solutions that address local challenges and create global impact. From fintech to health tech, e-commerce to agriculture, these young innovators are putting Africa on the global tech map.`;
          
          // Create a proper Startup Afrika article
          const startupAfrikaArticle: Article = {
            id: `art_news_${Date.now()}_${index}_${Math.random().toString(36).slice(2, 9)}`,
            title: rewrittenTitle,
            subtitle: rewrittenDesc,
            founderName: "",
            startupName: "",
            location: "Africa",
            foundedYear: "",
            tags: [sector, "Young Founders", "African Innovation"].filter(Boolean),
            coverImage: article.imageUrl || "",
            coverHeight: 288,
            coverPosition: "center",
            body: `<p>${rewrittenDesc}</p><p><em>This article is part of our series highlighting young African founders and developers building innovative solutions across the continent.</em></p>`,
            status: "published",
            wordCount: rewrittenDesc.split(/\s+/).filter(Boolean).length,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          // Save to the global articles array
          const existingIndex = articles.findIndex(a => a.id === startupAfrikaArticle.id);
          if (existingIndex === -1) {
            articles.push(startupAfrikaArticle);
            saveJsonArray(ARTICLES_FILE, articles);
            console.log(`✓ Saved: ${rewrittenTitle.substring(0, 60)}...`);
          }

          return {
            ...article,
            title: rewrittenTitle,
            description: rewrittenDesc,
          };
        });

        console.log(`✓ Successfully rewrote and saved ${rewrittenArticles.length} articles`);
        res.json({ articles: rewrittenArticles });
      } catch (error) {
        console.error("Error rewriting articles:", error);
        res.json({ articles: newsArticles });
      }
    } else {
      res.json({ articles: newsArticles });
    }
  } catch (error) {
    console.error("Error fetching news:", error);
    res.json({ 
      error: "Unable to load news at this time",
      articles: []
    });
  }
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
