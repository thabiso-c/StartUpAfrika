import express from "express";
import * as cheerio from "cheerio";
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
const EMAILS_FILE = path.join(dataDir, "emails.json");
const ADVERTS_FILE = path.join(dataDir, "adverts.json");
const AD_INQUIRIES_FILE = path.join(dataDir, "ad_inquiries.json");
const COMMUNITY_TOPICS_FILE = path.join(dataDir, "community_topics.json");
const COMMUNITY_COMMENTS_FILE = path.join(dataDir, "community_comments.json");
const COMMUNITY_POLLS_FILE = path.join(dataDir, "community_polls.json");
const COMMUNITY_CHALLENGES_FILE = path.join(dataDir, "community_challenges.json");
const COMMUNITY_SUBMISSIONS_FILE = path.join(dataDir, "community_submissions.json");

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

// Multer configuration â€” use /tmp in production (Vercel read-only FS), public/uploads locally
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

// â”€â”€ Editor Auth & Data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
  isEditorArticle?: boolean;
  source?: string;
}

const SLYZAH_ARTICLE: Article = {
  id: "art_slyzah_building_thabiso",
  title: "BUILDING SLYZAH: Thabiso's story",
  subtitle: "How Thabiso built Slyzah and launched Startup Afrika to chronicle the real blueprints of African tech founders.",
  founderName: "Thabiso",
  startupName: "Slyzah / Startup Afrika",
  location: "Johannesburg, South Africa",
  foundedYear: "2024",
  tags: ["Slyzah", "Startup Afrika", "Founders", "Tech", "South Africa"],
  coverImage: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80",
  coverHeight: 288,
  coverPosition: "center",
  body: `
    <h2>The Spark Behind Slyzah</h2>
    <p>Slyzah was born out of a desire to create powerful, modern digital platforms for African creators, developers, and entrepreneurs. During the initial development phase, it became clear that while African tech innovation was exploding, the authentic, unfiltered blueprints of how these startups were actually built remained undocumented.</p>
    
    <h2>Launching Startup Afrika</h2>
    <p>To bridge this gap, Startup Afrika was created as a dedicated publication and media channel. Through structured Q&As, code breakdowns, and payment gateway insights, Startup Afrika gives founders a direct voice to share their engineering choices, growth trajectories, and hard-earned lessons.</p>

    <h2>The Blueprint & Future Vision</h2>
    <p>From local payment integrations like Paystack and Ozow to scalable cloud architectures, building in Africa requires unique resilience. Slyzah and Startup Afrika continue to empower the next generation of builders across the continent.</p>
  `,
  status: "published",
  wordCount: 250,
  createdAt: "2026-07-20T10:00:00.000Z",
  updatedAt: "2026-07-25T12:00:00.000Z",
  isEditorArticle: true,
  source: "editor",
};

const DEFAULT_ARTICLES: Article[] = [SLYZAH_ARTICLE];

const loadedArticles = loadJsonArray<Article>(ARTICLES_FILE, []).filter(a => !a.id.startsWith("seed_"));
if (loadedArticles.length === 0) {
  saveJsonArray(ARTICLES_FILE, DEFAULT_ARTICLES);
}
// Ensure SLYZAH_ARTICLE is present if no editor article exists
if (!loadedArticles.some(a => a.id === SLYZAH_ARTICLE.id || (a.title && a.title.toLowerCase().includes("slyzah")))) {
  loadedArticles.unshift(SLYZAH_ARTICLE);
  saveJsonArray(ARTICLES_FILE, loadedArticles);
}
const articles: Article[] = loadedArticles;

const ADMIN_EMAIL = "letsokothabiso@gmail.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "startupafrika";

function requireEditorToken(req: express.Request, res: express.Response, next: express.NextFunction) {
  const token = (req.headers["x-editor-token"] as string) || (req.headers["x-admin-token"] as string);
  const validEditorToken = crypto.createHmac("sha256", EDITOR_PASSWORD).update(EDITOR_EMAIL).digest("hex");
  const validAdminToken = crypto.createHmac("sha256", ADMIN_PASSWORD).update(ADMIN_EMAIL).digest("hex");
  
  if (token && (token === validEditorToken || token === validAdminToken)) {
    return next();
  }
  return res.status(401).json({ error: "Unauthorized" });
}

function requireAdminToken(req: express.Request, res: express.Response, next: express.NextFunction) {
  const token = req.headers["x-admin-token"] as string;
  const validToken = crypto.createHmac("sha256", ADMIN_PASSWORD).update(ADMIN_EMAIL).digest("hex");
  
  if (!token || token !== validToken) {
    return res.status(401).json({ error: "Unauthorized: Only letsokothabiso@gmail.com is authorized as Admin." });
  }
  next();
}

// Fallback arrays when Firestore is unavailable/disabled, loaded from disk
const subscribers: Array<{ email: string; date: string; source?: string }> = loadJsonArray(SUBSCRIBERS_FILE, []);
const users: Array<{ uid: string; email: string; name: string; picture: string; lastLogin: string; isDemo?: boolean }> = loadJsonArray(USERS_FILE, []);
const adInquiries: Array<{ id: string; companyName: string; contactName: string; email: string; budget: string; message: string; date: string }> = loadJsonArray(AD_INQUIRIES_FILE, []);

const DEFAULT_COMMUNITY_TOPICS: Array<any> = [];

const DEFAULT_COMMUNITY_COMMENTS: Array<any> = [];

const DEFAULT_COMMUNITY_POLLS = [
  {
    id: "poll_july_2026",
    monthTitle: "ðŸ† July 2026 Featured Article of the Month Poll",
    description: "Cast your vote as a registered member for the most inspiring African tech story featured on StartUpAfrika this month!",
    options: [
      {
        articleId: "art_slyzah_building_thabiso",
        title: "Building Slyzah: Thabiso's Journey Bootstrapping Tech in SA",
        startupName: "Slyzah",
        founderName: "Thabiso Letsoko",
        votes: 0,
        votedBy: []
      }
    ],
    totalVotes: 0,
    active: true
  }
];

const DEFAULT_COMMUNITY_CHALLENGES = [
  {
    id: "challenge_ussd_parser",
    title: "Mobile Money & USSD Payload Normalizer",
    difficulty: "Intermediate",
    category: "Fintech & Data Parsing",
    points: 150,
    description: "Write a function that parses raw USSD SMS/HTTP string payloads from MPesa or PayFast and extracts: amount (number), currency (string), transactionRef (string), and timestamp (ISO string).",
    problemStatement: "Input format: 'Confirmed. R2,500.00 received from Thabiso for order #SA-9081 on 2026-07-26 14:00. Ref: MP-88902.'",
    sampleInput: "Confirmed. R2,500.00 received from Thabiso for order #SA-9081 on 2026-07-26 14:00. Ref: MP-88902.",
    expectedOutput: '{"amount": 2500, "currency": "ZAR", "transactionRef": "MP-88902"}',
    initialTemplate: `function parseUSSDPayload(payload: string) {
  // Extract amount, currency, and transactionRef
  const amountMatch = payload.match(/(R|USD|KES)\\s*([0-9,.]+)/);
  const refMatch = payload.match(/Ref:\\s*([A-Z0-9-]+)/i);

  const currency = amountMatch ? (amountMatch[1] === "R" ? "ZAR" : amountMatch[1]) : "ZAR";
  const amount = amountMatch ? parseFloat(amountMatch[2].replace(/,/g, "")) : 0;
  const transactionRef = refMatch ? refMatch[1] : "REF-PENDING";

  return { amount, currency, transactionRef };
}`,
    submissionCount: 0,
    createdAt: new Date().toISOString()
  },
  {
    id: "challenge_offline_queue",
    title: "Resilient Offline Sync Queue for Intermittent Networks",
    difficulty: "Advanced",
    category: "Architecture & Systems",
    points: 250,
    description: "Design an in-memory queue that buffers failed mutation jobs when network drops, deduplicates identical mutations by entityId, and retries with exponential backoff.",
    problemStatement: "Implement processQueue(jobs, isOnline) returning processed job IDs and remaining pending buffer.",
    sampleInput: "[{id: 'j1', entityId: 'art_1', action: 'UPVOTE'}, {id: 'j2', entityId: 'art_1', action: 'UPVOTE'}]",
    expectedOutput: "Deduplicated job executed successfully",
    initialTemplate: `function processOfflineQueue(queue: any[], isOnline: boolean) {
  if (!isOnline) return { processed: [], pending: queue };
  const uniqueJobs = Array.from(new Map(queue.map(j => [j.entityId, j])).values());
  return { processed: uniqueJobs.map(j => j.id), pending: [] };
}`,
    submissionCount: 0,
    createdAt: new Date().toISOString()
  }
];

const communityTopics: Array<any> = loadJsonArray(COMMUNITY_TOPICS_FILE, DEFAULT_COMMUNITY_TOPICS);
const communityComments: Array<any> = loadJsonArray(COMMUNITY_COMMENTS_FILE, DEFAULT_COMMUNITY_COMMENTS);
const communityPolls: Array<any> = loadJsonArray(COMMUNITY_POLLS_FILE, DEFAULT_COMMUNITY_POLLS);
const communityChallenges: Array<any> = loadJsonArray(COMMUNITY_CHALLENGES_FILE, DEFAULT_COMMUNITY_CHALLENGES);
const communitySubmissions: Array<any> = loadJsonArray(COMMUNITY_SUBMISSIONS_FILE, []);

// Overwrite saved files with cleaned arrays if they contained previous seed data
if (fs.existsSync(COMMUNITY_TOPICS_FILE)) {
  const fileContent = fs.readFileSync(COMMUNITY_TOPICS_FILE, "utf-8");
  if (fileContent.includes("topic_welcome_2026") || fileContent.includes("Kofi Mensah")) {
    saveJsonArray(COMMUNITY_TOPICS_FILE, DEFAULT_COMMUNITY_TOPICS);
    communityTopics.length = 0;
  }
}
if (fs.existsSync(COMMUNITY_COMMENTS_FILE)) {
  const fileContent = fs.readFileSync(COMMUNITY_COMMENTS_FILE, "utf-8");
  if (fileContent.includes("Sbusiso Ncube") || fileContent.includes("comm_1")) {
    saveJsonArray(COMMUNITY_COMMENTS_FILE, DEFAULT_COMMUNITY_COMMENTS);
    communityComments.length = 0;
  }
}
if (fs.existsSync(COMMUNITY_POLLS_FILE)) {
  const fileContent = fs.readFileSync(COMMUNITY_POLLS_FILE, "utf-8");
  if (fileContent.includes("Kuda Bank") || fileContent.includes("145")) {
    saveJsonArray(COMMUNITY_POLLS_FILE, DEFAULT_COMMUNITY_POLLS);
    communityPolls.length = 0;
    communityPolls.push(...DEFAULT_COMMUNITY_POLLS);
  }
}

const DEFAULT_ADVERT_CONFIG = {
  enabled: true,
  title: "Advertise your business on StartUpAfrika",
  subtitle: "Reach African tech founders, venture builders, investors, and decision makers.",
  imageUrl: "/src/assets/images/advertise_startup_afrika.jpg",
  ctaText: "Inquire / Book Ad Space",
  ctaLink: "mailto:advertise@startupafrika.co.za?subject=Ad%20Space%20Inquiry%20-%20StartUpAfrika",
  contactEmail: "advertise@startupafrika.co.za",
  badgeText: "Partner & Sponsor Placement",
  metrics: [],
  packages: [],
  updatedAt: new Date().toISOString(),
};

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

// â”€â”€ Multi-Key Gemini Client Pool â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Collect all available Gemini API keys and create a client for each.
// Keys are rotated every 8 hours so that each key's daily quota is used
// in turn, effectively tripling the available daily paraphrasing capacity.
const GEMINI_KEYS: string[] = [
  process.env.GEMINI_API_KEY,
  process.env.GEMINI_API_KEY_2,
  process.env.GEMINI_API_KEY_3,
].filter((k): k is string => !!k && k.trim().length > 0);

const geminiClients: GoogleGenAI[] = GEMINI_KEYS.map(
  (apiKey) =>
    new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    })
);

// 8-hour rotation interval (in milliseconds)
const ROTATION_INTERVAL = 8 * 60 * 60 * 1000; // 8 hours

// Determine which key index is active based on the current time.
// The rotation is deterministic: floor(timestamp / 8h) % numKeys.
// This ensures that even across cold starts on serverless, every instance
// picks the same key for the same 8-hour window.
function getActiveKeyIndex(): number {
  if (geminiClients.length === 0) return 0;
  const slot = Math.floor(Date.now() / ROTATION_INTERVAL);
  return slot % geminiClients.length;
}

// Get the active Gemini client for the current 8-hour window
function getActiveGeminiClient(): GoogleGenAI | null {
  if (geminiClients.length === 0) return null;
  return geminiClients[getActiveKeyIndex()];
}

// Backward-compatible alias: \`ai\` returns the first configured key (used by non-rotation features like outreach generation).
const ai: GoogleGenAI | null = geminiClients.length > 0 ? geminiClients[0] : null;

// Log key pool status at startup
if (geminiClients.length > 0) {
  console.log(`[Gemini Pool] Initialized with ${geminiClients.length} API key(s). Active key index: ${getActiveKeyIndex()}`);
} else {
  console.warn("[Gemini Pool] No Gemini API keys configured. Paraphrasing will be unavailable.");
}

// â”€â”€ Editor Auth Routes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€ Executive Admin Auth Routes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
app.post("/api/admin/login", (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = String(email || "").trim().toLowerCase();

  if (normalizedEmail !== ADMIN_EMAIL.toLowerCase()) {
    return res.status(403).json({ error: "Access Denied: Only letsokothabiso@gmail.com is authorized to login as Admin." });
  }

  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Invalid password." });
  }

  const token = crypto.createHmac("sha256", ADMIN_PASSWORD).update(ADMIN_EMAIL).digest("hex");
  res.json({ success: true, token, email: ADMIN_EMAIL });
});

app.post("/api/admin/verify", (req, res) => {
  const { token } = req.body;
  const validToken = crypto.createHmac("sha256", ADMIN_PASSWORD).update(ADMIN_EMAIL).digest("hex");
  res.json({ valid: !!(token && token === validToken), email: ADMIN_EMAIL });
});

app.post("/api/admin/logout", (_req, res) => {
  res.json({ success: true });
});

// â”€â”€ Advert Window & Inquiries Routes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
app.get("/api/adverts", async (_req, res) => {
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  if (db) {
    try {
      const doc = await db.collection("config").doc("adverts").get();
      if (doc.exists) {
        return res.json(doc.data());
      }
    } catch (e) {
      console.warn("Firestore adverts fetch error, fallback to local:", e);
    }
  }

  try {
    if (fs.existsSync(ADVERTS_FILE)) {
      const content = fs.readFileSync(ADVERTS_FILE, "utf-8");
      return res.json(JSON.parse(content));
    }
  } catch (e) {
    console.error("Error reading adverts file:", e);
  }

  res.json(DEFAULT_ADVERT_CONFIG);
});

app.post("/api/admin/adverts", requireAdminToken, async (req, res) => {
  const config = { ...req.body, updatedAt: new Date().toISOString() };

  try {
    fs.writeFileSync(ADVERTS_FILE, JSON.stringify(config, null, 2), "utf-8");
  } catch (e) {
    console.error("Error writing adverts file:", e);
  }

  if (db) {
    try {
      await db.collection("config").doc("adverts").set(config, { merge: true });
    } catch (e) {
      console.error("Firestore adverts save error:", e);
    }
  }

  res.json({ success: true, config });
});

app.post("/api/adverts/inquire", async (req, res) => {
  const { companyName, contactName, email, budget, message } = req.body;
  if (!companyName || !email) {
    return res.status(400).json({ error: "Company Name and Email are required." });
  }

  const newInquiry = {
    id: `inq_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    companyName: String(companyName).trim(),
    contactName: String(contactName || "").trim(),
    email: String(email).trim().toLowerCase(),
    budget: String(budget || "R2,500 - R5,000"),
    message: String(message || "").trim(),
    date: new Date().toISOString(),
  };

  adInquiries.unshift(newInquiry);
  saveJsonArray(AD_INQUIRIES_FILE, adInquiries);

  if (db) {
    try {
      await db.collection("ad_inquiries").doc(newInquiry.id).set(newInquiry);
    } catch (e) {
      console.error("Firestore inquiry save error:", e);
    }
  }

  // Send email notification to the StartUpAfrika partnerships team
  if (resend && process.env.RESEND_API_KEY) {
    try {
      const inquiryDate = new Date(newInquiry.date).toLocaleString("en-ZA", {
        year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
      });

      const emailHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Ad Space Inquiry from ${newInquiry.companyName}</title>
</head>
<body style="margin:0;padding:0;background-color:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#f9fafb;padding:20px 12px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:580px;background:#ffffff;border-radius:12px;border:1px solid #f3f4f6;overflow:hidden;">
          <tr>
            <td style="padding:24px 28px 16px;border-bottom:1px solid #f3f4f6;">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td>
                    <a href="https://startupafrika.co.za" style="font-size:15px;font-weight:800;color:#047857;text-decoration:none;letter-spacing:0.5px;text-transform:uppercase;">Startup Afrika</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 28px;">
              <h1 style="margin:0 0 8px 0;font-size:22px;font-weight:800;color:#111827;line-height:1.3;">New Ad Space Inquiry</h1>
              <p style="margin:0 0 20px 0;font-size:14px;color:#4b5563;line-height:1.5;">
                A new advertising inquiry has been submitted on StartUpAfrika. Details below:
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:20px;">
                <tr>
                  <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;">
                    <span style="font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;">Company</span>
                    <div style="font-size:14px;color:#111827;margin-top:2px;">${newInquiry.companyName}</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;">
                    <span style="font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;">Contact Name</span>
                    <div style="font-size:14px;color:#111827;margin-top:2px;">${newInquiry.contactName || "â€”"}</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;">
                    <span style="font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;">Email</span>
                    <div style="font-size:14px;color:#111827;margin-top:2px;">${newInquiry.email}</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;">
                    <span style="font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;">Budget Range</span>
                    <div style="font-size:14px;color:#111827;margin-top:2px;">${newInquiry.budget}</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 0;">
                    <span style="font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;">Message</span>
                    <div style="font-size:14px;color:#111827;margin-top:2px;white-space:pre-wrap;">${newInquiry.message || "No message provided."}</div>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 20px 0;font-size:12px;color:#6b7280;line-height:1.5;">
                Submitted on ${inquiryDate}
              </p>

              <div>
                <a href="https://startupafrika.co.za/admin/inquiries" style="display:inline-block;background:#047857;color:#ffffff;font-size:14px;font-weight:600;padding:10px 24px;border-radius:8px;text-decoration:none;letter-spacing:0.2px;">View All Inquiries</a>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background-color:#f9fafb;padding:20px 28px;border-top:1px solid #f3f4f6;">
              <p style="margin:0;font-size:12px;color:#6b7280;line-height:1.5;text-align:center;">
                This email was sent automatically from the StartUpAfrika advertising inquiry form.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

      const emailText = `
New Ad Space Inquiry - StartUpAfrika

Company: ${newInquiry.companyName}
Contact Name: ${newInquiry.contactName || "â€”"}
Email: ${newInquiry.email}
Budget Range: ${newInquiry.budget}
Message: ${newInquiry.message || "No message provided."}

Submitted on: ${inquiryDate}

View all inquiries: https://startupafrika.co.za/admin/inquiries
`;

      await resend.emails.send({
        from: "Startup Afrika <adverts@startupafrika.co.za>",
        to: ["adverts@startupafrika.co.za"],
        subject: `New Ad Space Inquiry from ${newInquiry.companyName}`,
        text: emailText,
        html: emailHtml,
        headers: {
          "X-Entity-Ref-ID": newInquiry.id,
        },
      });
      console.log(`[Ad Inquiry] Email notification sent to adverts@startupafrika.co.za for inquiry ${newInquiry.id}`);
    } catch (emailErr) {
      console.error("[Ad Inquiry] Failed to send email notification:", emailErr);
    }
  }

  res.json({ success: true, inquiry: newInquiry });
});

app.get("/api/admin/inquiries", requireAdminToken, async (_req, res) => {
  if (db) {
    try {
      const snapshot = await db.collection("ad_inquiries").get();
      const docs = snapshot.docs.map((doc) => doc.data());
      if (docs.length > 0) {
        docs.sort((a: any, b: any) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
        return res.json(docs);
      }
    } catch (e) {
      console.error("Firestore ad_inquiries error:", e);
    }
  }
  adInquiries.sort((a: any, b: any) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
  res.json(adInquiries);
});

app.delete("/api/admin/inquiries/:id", requireAdminToken, async (req, res) => {
  const { id } = req.params;
  const index = adInquiries.findIndex((i) => i.id === id);
  if (index !== -1) {
    adInquiries.splice(index, 1);
    saveJsonArray(AD_INQUIRIES_FILE, adInquiries);
  }
  if (db) {
    try {
      await db.collection("ad_inquiries").doc(id).delete();
    } catch (e) {
      console.error("Firestore inquiry delete error:", e);
    }
  }
  res.json({ success: true });
});

// â”€â”€ Community Platform Routes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
app.get("/api/community/topics", (_req, res) => {
  const sorted = [...communityTopics].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
  res.json(sorted);
});

app.post("/api/community/topics", (req, res) => {
  const { title, content, category, tags, authorName, authorEmail, authorAvatar, authorRole, codeSnippet, codeLanguage } = req.body;
  
  if (!title || !content || !category || !authorName || !authorEmail) {
    return res.status(400).json({ error: "Missing required fields for community topic creation." });
  }

  const newTopic = {
    id: `topic_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    title: String(title).trim(),
    content: String(content).trim(),
    category,
    tags: Array.isArray(tags) ? tags : ["Tech"],
    authorName: String(authorName).trim(),
    authorEmail: String(authorEmail).trim(),
    authorAvatar: authorAvatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(authorEmail)}`,
    authorRole: authorRole || "Member Founder",
    codeSnippet: codeSnippet ? String(codeSnippet).trim() : undefined,
    codeLanguage: codeLanguage || "typescript",
    upvotes: 1,
    downvotes: 0,
    upvotedBy: [authorEmail],
    downvotedBy: [],
    commentCount: 0,
    isPinned: false,
    createdAt: new Date().toISOString(),
  };

  communityTopics.unshift(newTopic);
  saveJsonArray(COMMUNITY_TOPICS_FILE, communityTopics);

  if (db) {
    try {
      db.collection("community_topics").doc(newTopic.id).set(newTopic);
    } catch (e) {
      console.error("Firestore topic save error:", e);
    }
  }

  res.json({ success: true, topic: newTopic });
});

app.post("/api/community/topics/:id/vote", (req, res) => {
  const { id } = req.params;
  const { userEmail, voteType } = req.body; // 'up' or 'down'

  if (!userEmail) {
    return res.status(400).json({ error: "User email required to register vote." });
  }

  const topic = communityTopics.find((t) => t.id === id);
  if (!topic) {
    return res.status(404).json({ error: "Topic not found" });
  }

  if (!topic.upvotedBy) topic.upvotedBy = [];
  if (!topic.downvotedBy) topic.downvotedBy = [];

  const hasUpvoted = topic.upvotedBy.includes(userEmail);
  const hasDownvoted = topic.downvotedBy.includes(userEmail);

  if (voteType === "up") {
    if (hasUpvoted) {
      // Toggle off upvote
      topic.upvotedBy = topic.upvotedBy.filter((e: string) => e !== userEmail);
      topic.upvotes = Math.max(0, topic.upvotes - 1);
    } else {
      // Remove downvote if exists
      if (hasDownvoted) {
        topic.downvotedBy = topic.downvotedBy.filter((e: string) => e !== userEmail);
        topic.downvotes = Math.max(0, topic.downvotes - 1);
      }
      topic.upvotedBy.push(userEmail);
      topic.upvotes += 1;
    }
  } else if (voteType === "down") {
    if (hasDownvoted) {
      topic.downvotedBy = topic.downvotedBy.filter((e: string) => e !== userEmail);
      topic.downvotes = Math.max(0, topic.downvotes - 1);
    } else {
      if (hasUpvoted) {
        topic.upvotedBy = topic.upvotedBy.filter((e: string) => e !== userEmail);
        topic.upvotes = Math.max(0, topic.upvotes - 1);
      }
      topic.downvotedBy.push(userEmail);
      topic.downvotes += 1;
    }
  }

  saveJsonArray(COMMUNITY_TOPICS_FILE, communityTopics);
  res.json({ success: true, topic });
});

app.get("/api/community/topics/:id/comments", (req, res) => {
  const { id } = req.params;
  const comments = communityComments.filter((c) => c.topicId === id);
  comments.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  res.json(comments);
});

app.post("/api/community/topics/:id/comments", (req, res) => {
  const { id } = req.params;
  const { content, authorName, authorEmail, authorAvatar, authorRole, codeSnippet } = req.body;

  if (!content || !authorName || !authorEmail) {
    return res.status(400).json({ error: "Missing required fields for comment." });
  }

  const topic = communityTopics.find((t) => t.id === id);
  if (!topic) {
    return res.status(404).json({ error: "Topic not found" });
  }

  const newComment = {
    id: `comm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    topicId: id,
    content: String(content).trim(),
    codeSnippet: codeSnippet ? String(codeSnippet).trim() : undefined,
    authorName: String(authorName).trim(),
    authorEmail: String(authorEmail).trim(),
    authorAvatar: authorAvatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(authorEmail)}`,
    authorRole: authorRole || "Member",
    upvotes: 0,
    upvotedBy: [],
    createdAt: new Date().toISOString()
  };

  communityComments.push(newComment);
  saveJsonArray(COMMUNITY_COMMENTS_FILE, communityComments);

  topic.commentCount = (topic.commentCount || 0) + 1;
  saveJsonArray(COMMUNITY_TOPICS_FILE, communityTopics);

  res.json({ success: true, comment: newComment, commentCount: topic.commentCount });
});

app.post("/api/community/comments/:id/vote", (req, res) => {
  const { id } = req.params;
  const { userEmail } = req.body;

  const comment = communityComments.find((c) => c.id === id);
  if (!comment) return res.status(404).json({ error: "Comment not found" });

  if (!comment.upvotedBy) comment.upvotedBy = [];
  if (comment.upvotedBy.includes(userEmail)) {
    comment.upvotedBy = comment.upvotedBy.filter((e: string) => e !== userEmail);
    comment.upvotes = Math.max(0, comment.upvotes - 1);
  } else {
    comment.upvotedBy.push(userEmail);
    comment.upvotes += 1;
  }

  saveJsonArray(COMMUNITY_COMMENTS_FILE, communityComments);
  res.json({ success: true, comment });
});

app.get("/api/community/polls", (_req, res) => {
  res.json(communityPolls);
});

app.post("/api/community/polls/:id/vote", (req, res) => {
  const { id } = req.params;
  const { articleId, userEmail } = req.body;

  if (!userEmail) return res.status(400).json({ error: "User email required to vote in poll." });

  const poll = communityPolls.find((p) => p.id === id);
  if (!poll) return res.status(404).json({ error: "Poll not found" });

  // Remove previous vote if any option had userEmail
  poll.options.forEach((opt: any) => {
    if (!opt.votedBy) opt.votedBy = [];
    if (opt.votedBy.includes(userEmail)) {
      opt.votedBy = opt.votedBy.filter((e: string) => e !== userEmail);
      opt.votes = Math.max(0, opt.votes - 1);
    }
  });

  const selectedOpt = poll.options.find((opt: any) => opt.articleId === articleId);
  if (selectedOpt) {
    if (!selectedOpt.votedBy) selectedOpt.votedBy = [];
    selectedOpt.votedBy.push(userEmail);
    selectedOpt.votes += 1;
  }

  poll.totalVotes = poll.options.reduce((acc: number, opt: any) => acc + opt.votes, 0);
  saveJsonArray(COMMUNITY_POLLS_FILE, communityPolls);

  res.json({ success: true, poll });
});

app.get("/api/community/challenges", (_req, res) => {
  res.json(communityChallenges);
});

app.post("/api/community/challenges/:id/submit", (req, res) => {
  const { id } = req.params;
  const { code, authorName, authorEmail, authorAvatar } = req.body;

  if (!code || !authorEmail) return res.status(400).json({ error: "Code and email required." });

  const challenge = communityChallenges.find((c) => c.id === id);
  if (!challenge) return res.status(404).json({ error: "Challenge not found" });

  const submission = {
    id: `sub_${Date.now()}`,
    challengeId: id,
    authorName: authorName || "Dev Member",
    authorEmail,
    authorAvatar: authorAvatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(authorEmail)}`,
    code: String(code).trim(),
    status: "PASSED",
    submittedAt: new Date().toISOString()
  };

  communitySubmissions.unshift(submission);
  saveJsonArray(COMMUNITY_SUBMISSIONS_FILE, communitySubmissions);

  challenge.submissionCount = (challenge.submissionCount || 0) + 1;
  saveJsonArray(COMMUNITY_CHALLENGES_FILE, communityChallenges);

  res.json({ success: true, submission, submissionCount: challenge.submissionCount });
});


// â”€â”€ Editor Articles Routes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
app.get("/api/editor/articles", requireEditorToken, async (_req, res) => {
  const isStrictEditorArticle = (a: any) => {
    if (!a) return false;
    if (a.isNews === true || a.source === "news_scraper") return false;
    if (a.id?.startsWith("art_news_")) return false;
    if (a.isEditorArticle === true || a.source === "editor" || a.publishedViaEditor === true) return true;
    if (a.id === "art_slyzah_building_thabiso" || a.id?.startsWith("art_editor_")) return true;
    if (a.sourceUrl && String(a.sourceUrl).trim().length > 0) return false;
    const founder = String(a.founderName || "").toLowerCase();
    const startup = String(a.startupName || "").toLowerCase();
    if (founder.includes("ai news") || startup.includes("ai news")) return false;
    return true;
  };

  if (db) {
    try {
      const snapshot = await db.collection("articles").get();
      const fetched = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Article))
        .filter(isStrictEditorArticle);
      fetched.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      return res.json(fetched);
    } catch (error) {
      console.error("Firestore fetch articles error, falling back to local files:", error);
      db = null; // Disable Firestore dynamically on failure
    }
  }
  const filtered = articles.filter(isStrictEditorArticle);
  filtered.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  res.json(filtered);
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
    isEditorArticle: true,
    source: "editor",
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
        emailResult = await sendPublishEmail(savedArticle, req);
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
        emailResult = await sendPublishEmail(articles[idx], req);
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
    emailResult = await sendPublishEmail(newArticle, req);
  }
  res.json({ success: true, article: newArticle, emailResult });
});

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

function buildEmailText(article: Article, articleUrl: string, baseUrl: string): string {
  const { title, subtitle, founderName, startupName, body } = article;
  const previewText = stripHtml(body).substring(0, 300);
  const authorLine = founderName ? `By ${founderName}${startupName ? ` â€¢ ${startupName}` : ""}` : "";

  return `${title}
${subtitle ? `${subtitle}\n` : ""}${authorLine ? `${authorLine}\n` : ""}

${previewText}â€¦

Read the full article:
${articleUrl}

---
Startup Afrika â€” Stories from African founders
${baseUrl}`;
}

function buildEmailHtml(article: Article, articleUrl: string, baseUrl: string): string {
  const { title, subtitle, founderName, startupName, coverImage, tags, body } = article;
  const previewText = stripHtml(body).substring(0, 260);
  const tagsHtml = (tags || []).map((t: string) => 
    `<span style="display:inline-block;background:#ecfdf5;color:#047857;font-size:11px;font-weight:600;padding:3px 10px;border-radius:12px;margin:0 4px 4px 0;letter-spacing:0.2px;">${t}</span>`
  ).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#f9fafb;padding:20px 12px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:580px;background:#ffffff;border-radius:12px;border:1px solid #f3f4f6;overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="padding:24px 28px 16px;border-bottom:1px solid #f3f4f6;">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td>
                    <a href="${baseUrl}" style="font-size:15px;font-weight:800;color:#047857;text-decoration:none;letter-spacing:0.5px;text-transform:uppercase;">Startup Afrika</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content Padding Area -->
          <tr>
            <td style="padding:24px 28px;">
              ${tagsHtml ? `<div style="margin-bottom:12px;">${tagsHtml}</div>` : ''}

              <!-- Title (Strictly article title, no 'New Blueprint' prefix) -->
              <h1 style="margin:0 0 8px 0;font-size:24px;font-weight:800;color:#111827;line-height:1.3;letter-spacing:-0.3px;">${title}</h1>

              ${subtitle ? `<p style="margin:0 0 16px 0;font-size:15px;color:#4b5563;line-height:1.5;">${subtitle}</p>` : ''}

              <!-- Author Info -->
              <table cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:20px;">
                <tr>
                  <td width="38" style="width:38px;vertical-align:middle;">
                    <table width="38" height="38" cellpadding="0" cellspacing="0" role="presentation" style="width:38px;height:38px;background:#047857;border-radius:50%;">
                      <tr><td align="center" style="color:#ffffff;font-size:16px;font-weight:700;">${(founderName || 'S')?.charAt(0).toUpperCase()}</td></tr>
                    </table>
                  </td>
                  <td style="padding-left:10px;vertical-align:middle;">
                    <div style="font-size:13px;font-weight:600;color:#1f2937;">${founderName || 'Startup Afrika'}</div>
                    <div style="font-size:12px;color:#6b7280;">${startupName ? `${startupName} â€¢ ` : ''}Startup Afrika</div>
                  </td>
                </tr>
              </table>

              <!-- Cover Image Optimized for Ultra Fast Loading -->
              ${coverImage ? `
              <div style="margin:16px 0 20px;">
                <a href="${articleUrl}" target="_blank" style="text-decoration:none;display:block;">
                  <img src="${coverImage}" alt="${title}" width="524" height="262" loading="eager" fetchpriority="high" style="width:100%;max-width:524px;height:auto;display:block;border-radius:8px;border:0;outline:none;object-fit:cover;background-color:#f3f4f6;" />
                </a>
              </div>
              ` : ''}

              <!-- Preview Body -->
              ${previewText ? `<p style="margin:0 0 24px 0;font-size:14px;color:#374151;line-height:1.6;">${previewText}â€¦</p>` : ''}

              <!-- Working CTA Button -->
              <div>
                <a href="${articleUrl}" target="_blank" style="display:inline-block;background:#047857;color:#ffffff;font-size:14px;font-weight:600;padding:12px 28px;border-radius:8px;text-decoration:none;letter-spacing:0.2px;">Read Full Article â†’</a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f9fafb;padding:20px 28px;border-top:1px solid #f3f4f6;">
              <p style="margin:0;font-size:12px;color:#6b7280;line-height:1.5;text-align:center;">
                You received this email because you subscribed to <a href="${baseUrl}" style="color:#047857;text-decoration:underline;">Startup Afrika</a>.<br>
                Stories and insights from African founders.
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

async function sendPublishEmail(article: Article, req?: express.Request) {
  let allEmails: string[] = [];
  try {
    // Determine working base URL from request or environment
    let baseUrl = process.env.APP_URL || "";
    if (!baseUrl && req) {
      const host = req.get("host");
      if (host) {
        const proto = req.get("x-forwarded-proto") || req.protocol || "https";
        baseUrl = `${proto}://${host}`;
      }
    }
    if (!baseUrl) {
      baseUrl = "https://startupafrika.co.za";
    }

    const articleUrl = `${baseUrl}?article=${article.id}`;

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
          const emailHtml = buildEmailHtml(article, articleUrl, baseUrl);
          const emailText = buildEmailText(article, articleUrl, baseUrl);
          
          await resend.emails.send({
            from: 'Startup Afrika <newsletter@startupafrika.co.za>',
            to: allEmails.slice(0, 50),
            subject: article.title, // Pure article title (removed "New Blueprint" prefix)
            text: emailText,
            html: emailHtml,
            headers: {
              'List-Unsubscribe': `<${baseUrl}>`,
              'X-Entity-Ref-ID': article.id
            }
          });
          isSimulated = false;
          sent = true;
          console.log(`Announcement email sent to ${Math.min(allEmails.length, 50)} subscribers with link: ${articleUrl}`);
        } catch (err) {
          console.error("Resend API failed, falling back to simulation log. Error:", err);
        }
      } else {
        console.log(`[SIMULATION] Announcement email sent to subscribers (${allEmails.length}):`, articleUrl);
        sent = true;
      }
      
      // Save log entry to EMAIL_LOGS_FILE
      const logs = loadJsonArray(EMAIL_LOGS_FILE, [] as any[]);
      const newLog = {
        id: `email_log_${Date.now()}`,
        title: article.title,
        subtitle: article.subtitle,
        articleUrl,
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
      articleUrl,
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

// â”€â”€ Public API Routes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  if (db) {
    try {
      const snapshot = await db.collection("articles").where("status", "==", "published").get();
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Article));
      if (!fetched.some(a => a.id === SLYZAH_ARTICLE.id || (a.title && a.title.toLowerCase().includes("slyzah")))) {
        fetched.unshift(SLYZAH_ARTICLE);
      }
      fetched.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      return res.json(fetched);
    } catch (error) {
      console.error("Firestore fetch published articles error, falling back:", error);
      db = null;
    }
  }
  if (!articles.some(a => a.id === SLYZAH_ARTICLE.id || (a.title && a.title.toLowerCase().includes("slyzah")))) {
    articles.unshift(SLYZAH_ARTICLE);
  }
  const published = articles
    .filter((a) => a.status === "published")
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  res.json(published);
});
app.get("/api/health", (req, res) => {
  const activeKeyIndex = geminiClients.length > 0 ? getActiveKeyIndex() : -1;
  const slot = Math.floor(Date.now() / ROTATION_INTERVAL);
  res.json({
    status: "ok",
    geminiConfigured: !!ai,
    geminiKeyCount: geminiClients.length,
    activeKeyIndex,
    rotationSlot: slot,
    nextRotation: new Date((slot + 1) * ROTATION_INTERVAL).toISOString(),
    rotationIntervalHours: 8,
  });
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

let newsCache: { timestamp: number; articles: any[] } = { timestamp: 0, articles: [] };
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

// â”€â”€ Gemini Quota State Persistence â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Tracks when the daily quota was exhausted so we can skip Gemini calls
// until the quota resets (free tier resets daily).
const QUOTA_STATE_FILE = path.join(dataDir, "gemini_quota_state.json");
// Per-key quota state: tracks exhaustion for each Gemini key independently

interface QuotaState {
  exhaustedUntil: Record<number, number>;
  lastExhaustedAt: Record<number, string>;
}

function loadQuotaState(): QuotaState | null {
  try {
    if (fs.existsSync(QUOTA_STATE_FILE)) {
      const content = fs.readFileSync(QUOTA_STATE_FILE, "utf-8");
      const parsed = JSON.parse(content);
      if (parsed.exhaustedUntil && typeof parsed.exhaustedUntil === "number") {
        return { exhaustedUntil: { 0: parsed.exhaustedUntil }, lastExhaustedAt: { 0: parsed.lastExhaustedAt } };
      }
      return { exhaustedUntil: parsed.exhaustedUntil || {}, lastExhaustedAt: parsed.lastExhaustedAt || {} };
    }
  } catch (e) {
    console.error("[Quota State] Error loading:", e);
  }
  return null;
}

function saveQuotaState(state: QuotaState): void {
  try {
    fs.writeFileSync(QUOTA_STATE_FILE, JSON.stringify(state, null, 2), "utf-8");
  } catch (e) {
    console.error("[Quota State] Error saving:", e);
  }
}

// Check if Gemini quota is currently marked as exhausted (checks local file + Firestore)
// Check if a SPECIFIC key index is currently marked as exhausted
async function isKeyExhausted(keyIndex: number): Promise<boolean> {
  const localState = loadQuotaState();
  if (localState?.exhaustedUntil?.[keyIndex] && Date.now() < localState.exhaustedUntil[keyIndex]) {
    return true;
  }
  if (db) {
    try {
      const doc = await db.collection("config").doc("gemini_quota").get();
      if (doc.exists) {
        const data = doc.data() as any;
        const eu = data?.exhaustedUntil;
        if (eu && typeof eu === "object" && eu[keyIndex] && Date.now() < eu[keyIndex]) {
          saveQuotaState({ exhaustedUntil: eu, lastExhaustedAt: data?.lastExhaustedAt || {} });
          return true;
        }
        if (eu && typeof eu === "number" && keyIndex === 0 && Date.now() < eu) return true;
      }
    } catch (_) {}
  }
  return false;
}

// Check if ALL keys are exhausted
async function isQuotaExhausted(): Promise<boolean> {
  if (geminiClients.length === 0) return true;
  for (let i = 0; i < geminiClients.length; i++) {
    if (!(await isKeyExhausted(i))) return false;
  }
  return true;
}

// Find the first available (non-exhausted) key index, starting from the active key
async function getAvailableKeyIndex(): Promise<number | null> {
  if (geminiClients.length === 0) return null;
  const startIdx = getActiveKeyIndex();
  for (let offset = 0; offset < geminiClients.length; offset++) {
    const idx = (startIdx + offset) % geminiClients.length;
    if (!(await isKeyExhausted(idx))) return idx;
  }
  return null;
}

// Mark quota as exhausted until the next UTC midnight
function markKeyExhausted(keyIndex: number): void {
  const now = new Date();
  const nextReset = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0));
  const state = loadQuotaState() || { exhaustedUntil: {}, lastExhaustedAt: {} };
  state.exhaustedUntil[keyIndex] = nextReset.getTime();
  state.lastExhaustedAt[keyIndex] = now.toISOString();
  saveQuotaState(state);
  if (db) {
    try { db.collection("config").doc("gemini_quota").set(state).catch(() => {}); } catch (_) {}
  }
  console.warn(`[Quota State] Gemini key #${keyIndex} marked exhausted until ${nextReset.toISOString()}`);
}

// Clear exhaustion state for a SPECIFIC key when a call succeeds
function clearKeyExhausted(keyIndex: number): void {
  const state = loadQuotaState();
  if (state) {
    let changed = false;
    if (state.exhaustedUntil?.[keyIndex]) { delete state.exhaustedUntil[keyIndex]; changed = true; }
    if (state.lastExhaustedAt?.[keyIndex]) { delete state.lastExhaustedAt[keyIndex]; changed = true; }
    if (changed) {
      saveQuotaState(state);
      if (db) { try { db.collection("config").doc("gemini_quota").set(state).catch(() => {}); } catch (_) {} }
    }
  }
}

// Clear ALL quota state
function clearQuotaState(): void {
  try { if (fs.existsSync(QUOTA_STATE_FILE)) fs.unlinkSync(QUOTA_STATE_FILE); } catch (_) {}
  if (db) {
    try { db.collection("config").doc("gemini_quota").delete().catch(() => {}); } catch (_) {}
  }
}

// Helper: store an article with original (unparaphrased) content as a fallback
// This ensures the dedup cache builds up even when Gemini quota is exhausted
async function storeUnparaphrasedArticle(article: any, stableId: string): Promise<void> {
  const fallbackArticle: Article & { sourceUrl?: string; isEditorArticle?: boolean; isNews?: boolean; source?: string; paraphrased?: boolean } = {
    id: stableId,
    title: article.title,
    subtitle: (article.description || "").substring(0, 150) + "...",
    founderName: "Startup Afrika AI News",
    startupName: article.source,
    location: "Africa",
    foundedYear: new Date().getFullYear().toString(),
    tags: ["African Tech"],
    coverImage: article.imageUrl || "",
    coverHeight: 288,
    coverPosition: "center",
    body: `<p>${article.description || article.title}</p>`,
    status: "published",
    wordCount: (article.description || "").split(/\s+/).filter(Boolean).length,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    sourceUrl: article.url,
    isEditorArticle: false,
    isNews: true,
    source: "news_scraper",
    paraphrased: false,
  };

  const existingIdx = articles.findIndex(a => a.id === stableId);
  if (existingIdx !== -1) {
    articles[existingIdx] = fallbackArticle;
  } else {
    articles.push(fallbackArticle);
  }
  saveJsonArray(ARTICLES_FILE, articles);
  if (db) {
    try {
      await db.collection("articles").doc(stableId).set(fallbackArticle);
    } catch (err) {
      console.error("[News Task] Firestore save error (fallback):", err);
    }
  }
}

async function fetchAndParaphraseNews() {
  console.log("[News Task] Starting hourly news fetch & paraphrase...");
  const apiKey = process.env.GNEWS_API_KEY || process.env.NEWSAPI_KEY;
  if (!apiKey) {
    console.error("[News Task] API key not configured. Please add GNEWS_API_KEY in .env");
    return [];
  }

  const apiUrl = process.env.GNEWS_API_KEY
    ? `https://gnews.io/api/v4/search?q=(Africa AND (tech OR startup OR fintech OR AI))&lang=en&max=4&apikey=${apiKey}`
    : `https://newsapi.org/v2/everything?q=Africa+technology+startup+fintech&sortBy=publishedAt&pageSize=4&apiKey=${apiKey}`;

  const newsResponse = await fetch(apiUrl);
  if (!newsResponse.ok) throw new Error("Failed to fetch news from API");

  const newsData = await newsResponse.json();
  const sourceArticles = newsData.articles || [];

  const unique = sourceArticles.map((a: any) => ({
    title: a.title,
    description: a.description || "",
    url: a.url,
    source: a.source?.name || "Unknown",
    publishedAt: a.publishedAt,
    imageUrl: a.urlToImage || a.image,
  })).filter((article: any, index: number, self: any[]) =>
    index === self.findIndex((a: any) => a.url === article.url)
  ).slice(0, 4);

  // Build a set of source URLs already processed (stored in articles as startupName+title combo)
  // Use a stable hash of the URL as the deterministic article ID to enable true deduplication
  const urlToId = (url: string) => {
    const hash = crypto.createHash("sha256").update(url).digest("hex").slice(0, 16);
    return `art_news_${hash}`;
  };

  // Helper: call Gemini with retry-with-backoff on 429
  // Dynamically selects an available (non-exhausted) key for each call,
  // falling back to other keys in the pool when one is exhausted.
  const callGeminiWithRetry = async (prompt: string, retries = 2): Promise<any> => {
    for (let attempt = 0; attempt <= retries; attempt++) {
      // Find an available (non-exhausted) key for this call
      const availableIdx = await getAvailableKeyIndex();
      if (availableIdx === null) {
        console.warn("[News Task] Daily Gemini quota completely exhausted. Aborting retry.");
        const quotaErr: any = new Error("GEMINI_QUOTA_EXHAUSTED");
        quotaErr.status = 429;
        quotaErr.isQuotaExhausted = true;
        throw quotaErr;
      }
      const client = geminiClients[availableIdx];
      try {
        const aiResponse = await client.models.generateContent({
          model: "gemini-2.0-flash-lite",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                newTitle: { type: Type.STRING },
                paraphrasedBodyHtml: { type: Type.STRING },
                tags: { type: Type.STRING },
              },
              required: ["newTitle", "paraphrasedBodyHtml", "tags"],
            },
          },
        });
        const parsed = JSON.parse(aiResponse.text?.trim() || "{}");
        // Clear quota state for this key on successful call
        clearKeyExhausted(availableIdx);
        return parsed;
      } catch (err: any) {
        const errMsg = String(err?.message || "").toLowerCase();
        const errDetails = JSON.stringify(err?.errorDetails || err?.details || "");
        const isDailyExhausted = errMsg.includes("limit: 0") || errDetails.includes("limit: 0");

        if (err?.status === 429 && isDailyExhausted) {
          // Mark this specific key as exhausted
          markKeyExhausted(availableIdx);
          // Check if any other key is still available
          const nextIdx = await getAvailableKeyIndex();
          if (nextIdx === null) {
            console.warn("[News Task] Daily Gemini quota completely exhausted. Aborting retry.");
            const quotaErr: any = new Error("GEMINI_QUOTA_EXHAUSTED");
            quotaErr.status = 429;
            quotaErr.isQuotaExhausted = true;
            throw quotaErr;
          }
          console.warn(`[News Task] Key #${availableIdx} daily quota exhausted. Switching to key #${nextIdx}...`);
          // Continue to next attempt with a different key
          continue;
        }

        if (err?.status === 429 && attempt < retries) {
          // Extract retry delay from error or use exponential backoff
          const retryDelay = (err?.errorDetails?.find?.((d: any) => d.retryDelay)?.retryDelay || `${(attempt + 1) * 20}s`);
          const waitMs = (parseInt(String(retryDelay)) || (attempt + 1) * 20) * 1000;
          console.warn(`[News Task] Rate limited (429). Waiting ${waitMs / 1000}s before retry ${attempt + 1}...`);
          await new Promise(resolve => setTimeout(resolve, waitMs));
        } else {
          throw err;
        }
      }
    }
    // If we exhausted all retries, throw a generic error
    throw new Error("Gemini API call failed after all retries");
  };

  const rewrittenArticles = [];
  let paraphrasedCount = 0;

  // Check if Gemini quota is already known to be exhausted
  const quotaExhausted = await isQuotaExhausted();
  if (quotaExhausted) {
    console.warn("[News Task] Gemini quota is marked as exhausted. Storing articles without paraphrasing.");
  }

  if (unique.length > 0) {
    for (let i = 0; i < unique.length; i++) {
      const article = unique[i];

      // --- DEDUPLICATION: check Firestore first (survives cold starts), then in-memory ---
      const stableId = urlToId(article.url);
      let existingData = articles.find(a => a.id === stableId || (a as any).sourceUrl === article.url || (a as any).url === article.url) as any;
      let alreadyExists = !!existingData;

      if (!alreadyExists && db) {
        try {
          const docSnap = await db.collection("articles").doc(stableId).get();
          if (docSnap.exists) {
            alreadyExists = true;
            existingData = docSnap.data();
          } else {
            const querySnap = await db.collection("articles").where("sourceUrl", "==", article.url).limit(1).get();
            if (!querySnap.empty) {
              alreadyExists = true;
              existingData = querySnap.docs[0].data();
            }
          }
        } catch (_) {}
      }

      if (alreadyExists) {
        // If the existing article was stored unparaphrased and quota is now available, retry paraphrasing
        if (existingData?.paraphrased === false && geminiClients.length > 0 && !quotaExhausted) {
          console.log(`[News Task] Retrying paraphrase for previously unparaphrased article: ${article.title}`);
          // Fall through to the paraphrase logic below by treating it as not existing
          alreadyExists = false;
          existingData = null;
        } else {
          console.log(`[News Task] Skipping already-processed article: ${article.title}`);
          rewrittenArticles.push({
            ...article,
            title: existingData?.title || article.title,
            description: existingData?.subtitle || article.description,
            articleId: existingData?.id || stableId,
          });
          continue;
        }
      }

      // If quota is exhausted or AI unavailable, store the article unparaphrased and move on
      if (quotaExhausted || !ai) {
        console.log(`[News Task] Storing unparaphrased article (quota exhausted or AI unavailable): ${article.title}`);
        await storeUnparaphrasedArticle(article, stableId);
        rewrittenArticles.push({
          ...article,
          title: article.title,
          description: article.description,
          articleId: stableId,
        });
        continue;
      }

      try {
        const pageRes = await fetch(article.url, {
           headers: { "User-Agent": "Mozilla/5.0" }
        });
        const html = await pageRes.text();
        const $ = cheerio.load(html);

        $('script, style, nav, header, footer, iframe, noscript').remove();
        let fullText = '';
        $('p, h1, h2, h3, article').each((_, el) => {
          fullText += $(el).text() + '\n\n';
        });

        if (fullText.length < 200) fullText = article.description || article.title;
        fullText = fullText.substring(0, 12000); // reduced to save tokens

        const prompt = `
        You are Thabiso, the founder and editor of "Startup Afrika", a platform showcasing African tech innovation.
        I will provide you with the raw scraped text of a news article about African technology, startups, or AI.
        
        Your task:
        1. Rewrite the headline to be catchy, engaging, and aligned with Startup Afrika's tone. (Return as plain text, no quotes).
        2. Paraphrase the ENTIRE article content to create a cohesive, standalone article for our platform. Focus on the innovation, the founders, and the impact on Africa.
        3. Format the paraphrased body strictly as HTML (using <p>, <strong>, <h3> etc.) so it looks great on a web page. DO NOT include <html> or <body> tags, just the inner content.
        4. Also generate 2-3 relevant tags (e.g., "Fintech", "AI", "Young Founders") in a comma-separated string.
        
        Original Title: ${article.title}
        Original Content:
        ${fullText}
        `;

        const aiResult = await callGeminiWithRetry(prompt);

        const startupAfrikaArticle: Article & { sourceUrl?: string; isEditorArticle?: boolean; isNews?: boolean; source?: string; paraphrased?: boolean } = {
          id: stableId,
          title: aiResult.newTitle || article.title,
          subtitle: (aiResult.paraphrasedBodyHtml || article.description).replace(/<[^>]*>?/gm, '').substring(0, 150) + "...",
          founderName: "Startup Afrika AI News",
          startupName: article.source,
          location: "Africa",
          foundedYear: new Date().getFullYear().toString(),
          tags: aiResult.tags ? aiResult.tags.split(',').map((t: string) => t.trim()) : ["African Tech"],
          coverImage: article.imageUrl || "",
          coverHeight: 288,
          coverPosition: "center",
          body: aiResult.paraphrasedBodyHtml || `<p>${article.description}</p>`,
          status: "published",
          wordCount: (aiResult.paraphrasedBodyHtml || "").split(/\s+/).filter(Boolean).length,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          sourceUrl: article.url,
          isEditorArticle: false,
          isNews: true,
          source: "news_scraper",
          paraphrased: true,
        };

        // Update if article was previously stored unparaphrased (retry case), otherwise push
        const existingIdx = articles.findIndex(a => a.id === stableId);
        if (existingIdx !== -1) {
          articles[existingIdx] = startupAfrikaArticle;
        } else {
          articles.push(startupAfrikaArticle);
        }
        saveJsonArray(ARTICLES_FILE, articles);
        if (db) {
          try {
            await db.collection("articles").doc(startupAfrikaArticle.id).set(startupAfrikaArticle);
          } catch (err) {
            console.error("[News Task] Firestore save error:", err);
          }
        }

        rewrittenArticles.push({
          ...article,
          title: startupAfrikaArticle.title,
          description: startupAfrikaArticle.subtitle,
          articleId: startupAfrikaArticle.id,
        });

        paraphrasedCount++;
        // Throttle: wait 3 seconds between Gemini calls to stay under rate limits
        if (i < unique.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 3000));
        }

      } catch (articleErr: any) {
        console.error(`[News Task] Error processing article ${article.url}:`, articleErr?.message || articleErr);
        if (articleErr?.isQuotaExhausted || articleErr?.status === 429) {
          console.warn("[News Task] Quota limit reached. Storing remaining articles unparaphrased.");
          // Store this article unparaphrased
          await storeUnparaphrasedArticle(article, stableId);
          rewrittenArticles.push({
            ...article,
            title: article.title,
            description: article.description,
            articleId: stableId,
          });
          // Store remaining articles unparaphrased too
          for (let j = i + 1; j < unique.length; j++) {
            const nextArticle = unique[j];
            const nextId = urlToId(nextArticle.url);
            const nextExists = articles.some(a => a.id === nextId);
            if (!nextExists) {
              await storeUnparaphrasedArticle(nextArticle, nextId);
            }
            rewrittenArticles.push({
              ...nextArticle,
              title: nextArticle.title,
              description: nextArticle.description,
              articleId: nextId,
            });
          }
          break;
        }
        rewrittenArticles.push(article);
      }
    }
    
    newsCache = { timestamp: Date.now(), articles: rewrittenArticles };
    console.log(`[News Task] Successfully processed `${rewrittenArticles.length}` articles (`${paraphrasedCount}` paraphrased, `${rewrittenArticles.length - paraphrasedCount}` stored as fallback).`);
    return rewrittenArticles;
  }
  
  return unique;
}

// Start the hourly recurring background task (only in non-serverless environments)
// On Vercel, setInterval does not persist across cold starts and can cause
// duplicate calls that burn through the Gemini quota. The /api/news endpoint
// triggers fetchAndParaphraseNews() on demand when the cache expires.
if (!process.env.VERCEL) {
  setInterval(async () => {
    try {
      await fetchAndParaphraseNews();
    } catch (err) {
      console.error("[News Task] Background fetch failed:", err);
    }
  }, CACHE_TTL);
}

// Helper: strip "Startup Afrika Featured:" prefix from article titles if present
function stripFeaturedPrefix(title: string): string {
  if (!title) return title;
  const prefix = "Startup Afrika Featured: ";
  if (title.startsWith(prefix)) {
    return title.substring(prefix.length);
  }
  // Also handle case variations
  const lowerPrefix = "startup afrika featured: ";
  if (title.toLowerCase().startsWith(lowerPrefix)) {
    return title.substring(lowerPrefix.length);
  }
  return title;
}

// Helper: fetch already-processed news articles from Firestore
async function getExistingNewsArticles(): Promise<any[]> {
  if (db) {
    try {
      // Use a simple query without composite index requirements.
      // Fetch published articles and filter for news articles in-memory.
      const snapshot = await db.collection("articles")
        .where("status", "==", "published")
        .limit(50)
        .get();
      const docs: any[] = snapshot.docs.map((doc: any) => {
        const data = doc.data();
        const cleanTitle = stripFeaturedPrefix(data.title);
        // If the title had the prefix, update it in Firestore to clean it permanently
        if (cleanTitle !== data.title) {
          db.collection("articles").doc(doc.id).set({ title: cleanTitle }, { merge: true }).catch(() => {});
        }
        return {
          title: cleanTitle,
          description: data.subtitle,
          url: data.sourceUrl || "",
          source: data.startupName || "Startup Afrika",
          publishedAt: data.createdAt,
          imageUrl: data.coverImage || "",
          articleId: doc.id,
          isNews: data.isNews === true || data.source === "news_scraper",
        };
      });
      // Filter for news articles (isNews flag or news_scraper source) and sort by date
      return docs
        .filter(d => d.isNews)
        .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
        .slice(0, 8);
    } catch (err) {
      console.error("[News] Failed to load existing news articles from Firestore:", err);
    }
  }
  return [];
}

// â”€â”€ Vercel Cron Job: Paraphrase Articles Every 8 Hours â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// This endpoint is called by Vercel's cron job (configured in vercel.json).
// It fetches fresh news, paraphrases using the currently active Gemini key,
// and appends new articles to the existing store (never deletes).
// Protected by a CRON_SECRET to prevent unauthorized invocations.
app.post("/api/cron/paraphrase-articles", async (req, res) => {
  // Verify cron secret to prevent unauthorized access
  const cronSecret = req.headers["x-cron-secret"] as string;
  const expectedSecret = process.env.CRON_SECRET;
  if (expectedSecret && cronSecret !== expectedSecret) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    console.log("[Cron Job] Starting 8-hour paraphrasing cycle...");
    const activeKeyIdx = getActiveKeyIndex();
    console.log(`[Cron Job] Active Gemini key index: ${activeKeyIdx} (out of ${geminiClients.length} keys)`);

    const articles = await fetchAndParaphraseNews();
    console.log(`[Cron Job] Completed. Processed ${articles.length} articles.`);

    res.json({
      success: true,
      processed: articles.length,
      activeKeyIndex: activeKeyIdx,
      totalKeys: geminiClients.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("[Cron Job] Error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Unknown error",
      timestamp: new Date().toISOString(),
    });
  }
});

// News API Endpoint â€” optimized with proper cache headers for faster loading
app.get("/api/news", async (req, res) => {
  // Enable browser/CDN caching for 5 minutes to reduce server load and speed up repeat visits
  res.setHeader("Cache-Control", "public, max-age=300, stale-while-revalidate=600");
  try {
    const now = Date.now();
    if (now - newsCache.timestamp < CACHE_TTL && newsCache.articles.length > 0) {
      console.log("Serving news from cache...");
      return res.json({ articles: newsCache.articles });
    }

    // Load already-processed articles from Firestore first (survives cold starts)
    const existingArticles = await getExistingNewsArticles();
    if (existingArticles.length > 0) {
      // Serve existing articles immediately while attempting background refresh
      newsCache = { timestamp: now - CACHE_TTL + 10000, articles: existingArticles }; // mark as nearly-expired so background will refresh
    }

    // Try to fetch & process new articles
    try {
      const newArticles = await fetchAndParaphraseNews();
      res.json({ articles: newArticles.length > 0 ? newArticles : existingArticles });
    } catch (fetchErr: any) {
      // If Gemini quota is exhausted, serve the existing stored articles gracefully
      const isQuotaError = fetchErr?.status === 429 || String(fetchErr?.message).includes("RESOURCE_EXHAUSTED");
      if (isQuotaError && existingArticles.length > 0) {
        console.warn("[News] Gemini quota exhausted â€” serving existing stored articles.");
        newsCache = { timestamp: now, articles: existingArticles };
        return res.json({ articles: existingArticles });
      }
      throw fetchErr;
    }
  } catch (error) {
    console.error("Error fetching news on request:", error);
    res.json({
      error: "Unable to load news at this time",
      articles: newsCache.articles // fallback to stale cache if any
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
      model: "gemini-2.0-flash",
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

// â”€â”€ Email Client Routes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
interface Email {
  id: string;
  account: string; // which email account
  folder: "inbox" | "sent" | "drafts" | "trash";
  from: string;
  to: string;
  cc?: string;
  bcc?: string;
  subject: string;
  body: string;
  htmlBody?: string;
  isRead: boolean;
  isStarred: boolean;
  labels: string[];
  attachments: Array<{ name: string; size: number; type: string }>;
  threadId?: string;
  inReplyTo?: string;
  createdAt: string;
  updatedAt: string;
  sentAt?: string;
}

// In-memory email store (loaded from disk at startup; also persisted to Firestore when available)
const emails: Email[] = loadJsonArray(EMAILS_FILE, []);

// Helper: persist emails to Firestore when available (critical for serverless environments
// where the local file system is ephemeral and not shared across function instances)
async function syncEmailsToFirestore(action: "set" | "delete", email?: Email, emailId?: string) {
  if (!db) return;
  try {
    if (action === "set" && email) {
      // Strip undefined values to prevent Firestore "Cannot use undefined as a Firestore value" errors
      const cleanEmail = Object.fromEntries(
        Object.entries(email).filter(([, v]) => v !== undefined)
      ) as Email;
      await db.collection("emails").doc(email.id).set(cleanEmail);
    } else if (action === "delete" && emailId) {
      await db.collection("emails").doc(emailId).delete();
    }
  } catch (err) {
    console.error("[Firestore] Email sync error:", err);
  }
}

// Helper: load emails from Firestore when available (falls back to local file)
// NOTE: We only use a single `where` clause on `account` to avoid requiring a
// composite index (account + folder) in Firestore, which would silently fail
// and return an empty array if the index is missing.
async function loadEmailsFromFirestore(account?: string, folder?: string): Promise<Email[]> {
  if (!db) return [];
  try {
    let query: any = db.collection("emails");
    if (account) query = query.where("account", "==", account);
    const snapshot = await query.get();
    const allEmails = snapshot.docs.map((doc: any) => doc.data() as Email);
    // Filter by folder in-memory to avoid composite index requirement
    if (folder && folder !== "all") {
      return allEmails.filter((email: Email) => email.folder === folder);
    }
    return allEmails;
  } catch (err) {
    console.error("[Firestore] Email load error:", err);
    return [];
  }
}

// Resend Webhook Endpoint - process incoming emails
app.post("/api/webhooks/resend", async (req: express.Request, res: express.Response) => {
  try {
    const event = req.body;
    console.log("[Resend Webhook] Received event:", event.type || "unknown");
    
    // Handle email received events
    if (event.type === "email.received" || event.type === "email.delivered") {
      // Resend webhooks only include metadata, NOT the email body.
      // We must use the Resend Receiving API to fetch the full content.
      console.log("[Resend Webhook] Received event:", event.type);
      console.log("[Resend Webhook] RAW PAYLOAD:", JSON.stringify(event).substring(0, 1000));
      
      const emailData = event.data?.email || event.data || event;
      
      // Extract basic fields from webhook
      const from = emailData.from || emailData.sender || "unknown";
      const to = Array.isArray(emailData.to) ? emailData.to.join(", ") : (emailData.to || "");
      const subject = emailData.subject || "(No subject)";
      
      // Determine account
      let account = "adverts@startupafrika.co.za";
      if (to.includes("adverts@startupafrika.co.za")) {
        account = "adverts@startupafrika.co.za";
      } else if (to.includes("info@startupafrika.co.za")) {
        account = "info@startupafrika.co.za";
      } else if (to.includes("thabiso@startupafrika.co.za")) {
        account = "thabiso@startupafrika.co.za";
      }
      
      // Create email record with empty body initially
      const receivedEmail: Email = {
        id: `email_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        account,
        folder: "inbox",
        from,
        to,
        subject,
        body: "",
        isRead: false,
        isStarred: false,
        labels: ["inbox"],
        attachments: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      // Fetch full email content from Resend Receiving API with retry logic
      if (resend && process.env.RESEND_API_KEY) {
        try {
          // Get the email ID from the webhook payload - try multiple possible field names
          const emailId = emailData.email_id || emailData.id || emailData.emailId || event.email_id || event.id || event.emailId;
          console.log(`[Resend Webhook] Attempting to fetch email from Resend API. ID: ${emailId || 'not found'}`);
          console.log("[Resend Webhook] emailData keys:", Object.keys(emailData).join(", "));
          
          if (emailId) {
            // Retry logic: email might not be immediately available via API
            let emailResponse: any = null;
            let lastError: any = null;
            
            for (let attempt = 1; attempt <= 3; attempt++) {
              try {
                // Use the Resend Receiving API to get the full email
                emailResponse = await resend.emails.receiving.get(emailId);
                
                if (emailResponse.data && !emailResponse.error) {
                  break; // Success!
                } else {
                  console.warn(`[Resend Webhook] API attempt ${attempt} failed:`, emailResponse.error);
                  lastError = emailResponse.error;
                }
              } catch (err: any) {
                console.warn(`[Resend Webhook] API attempt ${attempt} error:`, err.message);
                lastError = err;
              }
              
              // Wait before retry (exponential backoff)
              if (attempt < 3) {
                const delay = attempt * 2000; // 2s, 4s
                console.log(`[Resend Webhook] Waiting ${delay/1000}s before retry...`);
                await new Promise(resolve => setTimeout(resolve, delay));
              }
            }
            
            // Process the response
            if (emailResponse?.data && !emailResponse.error) {
              const fullEmail = emailResponse.data;
              console.log("[Resend Webhook] API response keys:", Object.keys(fullEmail).join(", "));
              
              // Extract body content from API response
              if (fullEmail.body && typeof fullEmail.body === 'string') {
                receivedEmail.body = fullEmail.body;
              }
              if (fullEmail.html && typeof fullEmail.html === 'string') {
                receivedEmail.htmlBody = fullEmail.html;
              }
              if (!receivedEmail.body && fullEmail.text && typeof fullEmail.text === 'string') {
                receivedEmail.body = fullEmail.text;
              }
              
              // Extract attachments if present
              if (fullEmail.attachments && Array.isArray(fullEmail.attachments)) {
                receivedEmail.attachments = fullEmail.attachments.map((att: any) => ({
                  name: att.name || "attachment",
                  size: att.size || 0,
                  type: att.type || "application/octet-stream"
                }));
              }
              
              console.log(`[Resend Webhook] Successfully fetched: body=${receivedEmail.body.length} chars, html=${receivedEmail.htmlBody?.length || 0} chars`);
            } else {
              console.warn("[Resend Webhook] All API fetch attempts failed. Last error:", lastError);
              console.warn("[Resend Webhook] Webhook payload keys:", Object.keys(event).join(", "));
              console.warn("[Resend Webhook] emailData keys:", Object.keys(emailData).join(", "));
            }
          } else {
            console.warn("[Resend Webhook] No email ID found in webhook payload");
            console.warn("[Resend Webhook] Full event structure:", JSON.stringify(event).substring(0, 500));
          }
        } catch (apiError: any) {
          console.error("[Resend Webhook] Error in API fetch block:", apiError.message);
        }
      } else {
        console.warn("[Resend Webhook] Resend client not configured (resend=", !!resend, ", hasKey=", !!process.env.RESEND_API_KEY, ")");
      }
      
      // Persist to local file
      const currentEmails = loadJsonArray<Email>(EMAILS_FILE, []);
      currentEmails.unshift(receivedEmail);
      saveJsonArray(EMAILS_FILE, currentEmails);
      
      // Update in-memory array
      emails.unshift(receivedEmail);
      
      // Persist to Firestore
      if (db) {
        try {
          await syncEmailsToFirestore("set", receivedEmail);
        } catch (e) {
          console.error("[Firestore] Webhook email sync error:", e);
        }
      }

      console.log(`[Resend Webhook] Final: from=${from} to=${to} subject=${subject} body=${receivedEmail.body.length} chars`);
    }
    
    // Acknowledge after processing
    res.json({ received: true, processed: true });
  } catch (error: any) {
    console.error("[Resend Webhook] Error:", error);
     res.status(400).json({ error: "Invalid webhook payload" });
  }
});

// Admin: Get email logs
app.get("/api/admin/email-logs", requireAdminToken, async (req: express.Request, res: express.Response) => {
  // Prevent caching so the admin dashboard always sees the latest email logs
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    // Read from EMAIL_LOGS_FILE (also try Firestore for serverless environments)
    let logs = loadJsonArray(EMAIL_LOGS_FILE, []);
    if (db) {
      try {
        const snapshot = await db.collection("email_logs").orderBy("sentAt", "desc").limit(limit).get();
        const fsLogs = snapshot.docs.map(doc => doc.data());
        if (fsLogs.length > 0) {
          logs = fsLogs;
        }
      } catch (e) {
        console.error("Firestore email_logs fetch error, using file:", e);
      }
    }
    res.json(logs.slice(0, limit));
  } catch (error: any) {
    console.error("Failed to fetch email logs:", error);
    res.status(500).json({ error: "Failed to fetch email logs" });
  }
});

// Get emails for an account/folder
app.get("/api/admin/emails", requireAdminToken, async (req: express.Request, res: express.Response) => {
  // Prevent caching so the admin dashboard always sees the latest emails
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  const account = String(req.query.account || "adverts@startupafrika.co.za");
  const folder = String(req.query.folder || "inbox") as Email["folder"] | "all";
  
  // Merge emails from both Firestore and local file to ensure no data loss
  // Firestore is the durable source in serverless, local file is the fallback
  const emailMap = new Map<string, Email>();
  
  // 1. Load from local file first (fast, always available)
  const fileEmails = loadJsonArray<Email>(EMAILS_FILE, []);
  for (const email of fileEmails) {
    if (email.account === account && (folder === "all" || email.folder === folder)) {
      emailMap.set(email.id, email);
    }
  }
  
  // 2. Load from Firestore and merge (overwrites file data with Firestore data)
  if (db) {
    try {
      const fsEmails = await loadEmailsFromFirestore(account, folder);
      for (const email of fsEmails) {
        emailMap.set(email.id, email);
      }
    } catch (e) {
      console.error("Firestore emails fetch error, using file data only:", e);
    }
  }
  
  // 3. Convert map to sorted array
  const merged = Array.from(emailMap.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  
  res.json(merged);
});

// Send email with attachment support
app.post("/api/admin/emails/send", requireAdminToken, upload.array("attachments", 10), async (req: express.Request, res: express.Response) => {
  const { account, to, cc, bcc, subject, body, htmlBody, threadId, inReplyTo } = req.body;
  
  if (!account || !to || !subject || !body) {
    return res.status(400).json({ error: "Missing required fields: account, to, subject, body" });
  }

  const now = new Date().toISOString();
  // Process attachments
  const uploadedFiles = req.files as Express.Multer.File[] | undefined;
  const processedAttachments = uploadedFiles 
    ? uploadedFiles.map((file) => ({
        name: file.originalname,
        size: file.size,
        type: file.mimetype,
        url: `/uploads/${file.filename}`,
      }))
    : [];

  const sentEmail: Email = {
    id: `email_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    account,
    folder: "sent",
    from: account,
    to: Array.isArray(to) ? to.join(", ") : to,
    cc: cc ? (Array.isArray(cc) ? cc.join(", ") : cc) : undefined,
    bcc: bcc ? (Array.isArray(bcc) ? bcc.join(", ") : bcc) : undefined,
    subject,
    body,
    htmlBody,
    isRead: true,
    isStarred: false,
    labels: [],
    attachments: processedAttachments,
    threadId,
    inReplyTo,
    createdAt: now,
    updatedAt: now,
    sentAt: now,
  };

  emails.unshift(sentEmail);
  saveJsonArray(EMAILS_FILE, emails);
  syncEmailsToFirestore("set", sentEmail).catch(() => {});

  // Send via Resend if configured
  if (resend && process.env.RESEND_API_KEY) {
    try {
      // Get signature based on account
      const signature = getEmailSignature(account);
      
      // Build HTML with signature if not already present
      const finalHtml = htmlBody || body.replace(/\n/g, "<br>");
      const htmlWithSignature = finalHtml.includes("<!-- signature -->") 
        ? finalHtml 
        : `${finalHtml}<br><br>${signature}`;
      
      // Process attachments for Resend
      const resendAttachments: any[] = [];
      if (uploadedFiles && uploadedFiles.length > 0) {
        for (const file of uploadedFiles) {
          try {
            const fileContent = fs.readFileSync(file.path);
            const base64Content = fileContent.toString("base64");
            resendAttachments.push({
              filename: file.originalname,
              content: base64Content,
            });
            console.log(`[Attachment] Prepared ${file.originalname} (${(file.size / 1024).toFixed(1)} KB) for sending`);
          } catch (fileErr) {
            console.error(`[Attachment] Failed to read file ${file.originalname}:`, fileErr);
          }
        }
      }
      
      const emailPayload: any = {
        from: account,
        to: Array.isArray(to) ? to : [to],
        cc: cc ? (Array.isArray(cc) ? cc : [cc]) : undefined,
        bcc: bcc ? (Array.isArray(bcc) ? bcc : [bcc]) : undefined,
        subject,
        text: body + "\n\n" + signature.replace(/<[^>]+>/g, ""),
        html: htmlWithSignature,
        headers: {
          'List-Unsubscribe': `<${process.env.APP_URL || 'https://startupafrika.co.za'}>`,
          'X-Entity-Ref-ID': sentEmail.id,
          'X-Priority': '1',
          'X-MSMail-Priority': 'High',
          'Importance': 'high',
        },
        replyTo: account,
      };
      
      // Add attachments if present
      if (resendAttachments.length > 0) {
        emailPayload.attachments = resendAttachments;
      }
      
      await resend.emails.send(emailPayload);
      console.log(`Email sent from ${account} to ${to}: ${subject}${resendAttachments.length > 0 ? ` (with ${resendAttachments.length} attachment(s))` : ""}`);
    } catch (err) {
      console.error("Resend send error:", err);
    }
  }

  res.json({ success: true, email: sentEmail });
});

// Save draft with attachment support
app.post("/api/admin/emails/draft", requireAdminToken, upload.array("attachments", 10), (req: express.Request, res: express.Response) => {
  const { account, to, cc, bcc, subject, body, htmlBody } = req.body;
  
  // Process attachments
  const uploadedFiles = req.files as Express.Multer.File[] | undefined;
  const processedAttachments = uploadedFiles 
    ? uploadedFiles.map((file) => ({
        name: file.originalname,
        size: file.size,
        type: file.mimetype,
        url: `/uploads/${file.filename}`,
      }))
    : [];
  
  const draft: Email = {
    id: `draft_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    account: account || "adverts@startupafrika.co.za",
    folder: "drafts",
    from: account || "adverts@startupafrika.co.za",
    to: to || "",
    cc: cc || undefined,
    bcc: bcc || undefined,
    subject: subject || "(No subject)",
    body: body || "",
    htmlBody,
    isRead: true,
    isStarred: false,
    labels: ["draft"],
    attachments: processedAttachments,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  emails.unshift(draft);
  saveJsonArray(EMAILS_FILE, emails);
  syncEmailsToFirestore("set", draft).catch(() => {});
  res.json({ success: true, email: draft });
});

// Update email (move to folder, star, mark read, etc.)
app.put("/api/admin/emails/:id", requireAdminToken, async (req: express.Request, res: express.Response) => {
  const { id } = req.params;
  const { folder, isRead, isStarred, labels } = req.body;
  
  const idx = emails.findIndex(e => e.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: "Email not found" });
  }

  if (folder) emails[idx].folder = folder;
  if (typeof isRead === "boolean") emails[idx].isRead = isRead;
  if (typeof isStarred === "boolean") emails[idx].isStarred = isStarred;
  if (labels) emails[idx].labels = labels;
  emails[idx].updatedAt = new Date().toISOString();

  saveJsonArray(EMAILS_FILE, emails);
  syncEmailsToFirestore("set", emails[idx]).catch(() => {});
  res.json({ success: true, email: emails[idx] });
});

// Delete email (move to trash)
app.delete("/api/admin/emails/:id", requireAdminToken, async (req: express.Request, res: express.Response) => {
  const { id } = req.params;
  const idx = emails.findIndex(e => e.id === id);
  
  if (idx === -1) {
    return res.status(404).json({ error: "Email not found" });
  }

  if (emails[idx].folder === "trash") {
    // Permanently delete
    emails.splice(idx, 1);
    syncEmailsToFirestore("delete", undefined, id).catch(() => {});
  } else {
    // Move to trash
    emails[idx].folder = "trash";
    emails[idx].updatedAt = new Date().toISOString();
    syncEmailsToFirestore("set", emails[idx]).catch(() => {});
  }

  saveJsonArray(EMAILS_FILE, emails);
  res.json({ success: true });
});

// Receive email (simulate incoming email)
app.post("/api/admin/emails/receive", requireAdminToken, (req: express.Request, res: express.Response) => {
  const { account, from, to, cc, bcc, subject, body, htmlBody } = req.body;
  
  if (!account || !from || !subject || !body) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const receivedEmail: Email = {
    id: `email_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    account,
    folder: "inbox",
    from,
    to: Array.isArray(to) ? to.join(", ") : (to || account),
    cc: cc ? (Array.isArray(cc) ? cc.join(", ") : cc) : undefined,
    bcc: bcc ? (Array.isArray(bcc) ? bcc.join(", ") : bcc) : undefined,
    subject,
    body,
    htmlBody,
    isRead: false,
    isStarred: false,
    labels: ["inbox"],
    attachments: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  emails.unshift(receivedEmail);
  saveJsonArray(EMAILS_FILE, emails);
  syncEmailsToFirestore("set", receivedEmail).catch(() => {});
  res.json({ success: true, email: receivedEmail });
});

// Email signature helper
function getEmailSignature(account: string): string {
  const baseUrl = process.env.APP_URL || "https://startupafrika.co.za";
  
  const signatures: Record<string, string> = {
    "adverts@startupafrika.co.za": `
      <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #047857;">
        <p style="margin: 0 0 10px 0; font-family: Arial, sans-serif; font-size: 14px; color: #111827;">
          <strong style="color: #047857; font-size: 16px;">Startup Afrika â€” Advertise With Us</strong>
        </p>
        <p style="margin: 0 0 5px 0; font-family: Arial, sans-serif; font-size: 13px; color: #4b5563;">
          Reach African tech founders, venture builders, investors, and decision makers.
        </p>
        <p style="margin: 0 0 5px 0; font-family: Arial, sans-serif; font-size: 12px; color: #6b7280;">
          ðŸ“§ <a href="mailto:advertise@startupafrika.co.za" style="color: #047857; text-decoration: none;">advertise@startupafrika.co.za</a>
        </p>
        <p style="margin: 0; font-family: Arial, sans-serif; font-size: 12px; color: #6b7280;">
          ðŸŒ <a href="${baseUrl}" style="color: #047857; text-decoration: none;">${baseUrl}</a>
        </p>
      </div>
      <!-- signature -->`,
    
    "info@startupafrika.co.za": `
      <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #047857;">
        <p style="margin: 0 0 10px 0; font-family: Arial, sans-serif; font-size: 14px; color: #111827;">
          <strong style="color: #047857; font-size: 16px;">Startup Afrika â€” Stories from African Founders</strong>
        </p>
        <p style="margin: 0 0 5px 0; font-family: Arial, sans-serif; font-size: 13px; color: #4b5563;">
          We chronicle the real blueprints of African tech innovation.
        </p>
        <p style="margin: 0 0 5px 0; font-family: Arial, sans-serif; font-size: 12px; color: #6b7280;">
          ðŸ“§ <a href="mailto:info@startupafrika.co.za" style="color: #047857; text-decoration: none;">info@startupafrika.co.za</a>
        </p>
        <p style="margin: 0; font-family: Arial, sans-serif; font-size: 12px; color: #6b7280;">
          ðŸŒ <a href="${baseUrl}" style="color: #047857; text-decoration: none;">${baseUrl}</a>
        </p>
      </div>
      <!-- signature -->`,
    
    "thabiso@startupafrika.co.za": `
      <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #047857;">
        <p style="margin: 0 0 10px 0; font-family: Arial, sans-serif; font-size: 14px; color: #111827;">
          <strong style="color: #047857; font-size: 16px;">Thabiso Letsoko</strong>
        </p>
        <p style="margin: 0 0 5px 0; font-family: Arial, sans-serif; font-size: 13px; color: #4b5563;">
          Founder & Editor, Startup Afrika
        </p>
        <p style="margin: 0 0 5px 0; font-family: Arial, sans-serif; font-size: 12px; color: #6b7280;">
          ðŸ“§ <a href="mailto:thabiso@startupafrika.co.za" style="color: #047857; text-decoration: none;">thabiso@startupafrika.co.za</a>
        </p>
        <p style="margin: 0; font-family: Arial, sans-serif; font-size: 12px; color: #6b7280;">
          ðŸŒ <a href="${baseUrl}" style="color: #047857; text-decoration: none;">${baseUrl}</a>
        </p>
      </div>
      <!-- signature -->`,
  };

  return signatures[account] || `
    <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #047857;">
      <p style="margin: 0 0 5px 0; font-family: Arial, sans-serif; font-size: 12px; color: #6b7280;">
        ðŸ“§ <a href="mailto:${account}" style="color: #047857; text-decoration: none;">${account}</a>
      </p>
      <p style="margin: 0; font-family: Arial, sans-serif; font-size: 12px; color: #6b7280;">
        ðŸŒ <a href="${baseUrl}" style="color: #047857; text-decoration: none;">${baseUrl}</a>
      </p>
    </div>
    <!-- signature -->
  `;
}

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

  // Only bind a port when running as a standalone process (local dev or Cloud Run).
  // On Vercel, api/index.ts exports the Express app as a serverless handler â€”
  // calling app.listen() there would start a competing HTTP server and break responses.
  if (!process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`[Startup Afrika Server] running on http://localhost:${PORT}`);
    });
  } else {
    console.log("[Startup Afrika Server] serverless mode â€” handler exported, skipping app.listen()");
  }
}

// Start the server (skipped automatically in Vercel serverless via the guard above)
startServer();

export default app;
