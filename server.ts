import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import multer from "multer";
import fs from "fs";
import crypto from "crypto";

dotenv.config();

// Standard ESM workarounds
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

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
const editorSessions = new Set<string>(); // active session tokens

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
  body: string;
  status: ArticleStatus;
  wordCount: number;
  createdAt: string;
  updatedAt: string;
}
const articles: Article[] = [];

function requireEditorToken(req: express.Request, res: express.Response, next: express.NextFunction) {
  const token = req.headers["x-editor-token"] as string;
  if (!token || !editorSessions.has(token)) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

// In-memory data store for the live session (resets on server restart, but works perfectly for full-stack prototype)
const subscribers: Array<{ email: string; date: string }> = [
  { email: "slyzahofficial@gmail.com", date: new Date().toISOString() },
  { email: "tech_enthusiast@startup.afrika", date: new Date().toISOString() }
];

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
  const expectedPassword = process.env.EDITOR_PASSWORD;
  if (!expectedPassword) {
    return res.status(500).json({ error: "EDITOR_PASSWORD environment variable is not set." });
  }
  if (email !== EDITOR_EMAIL || password !== expectedPassword) {
    return res.status(401).json({ error: "Invalid credentials." });
  }
  const token = crypto.randomBytes(32).toString("hex");
  editorSessions.add(token);
  res.json({ success: true, token });
});

app.post("/api/editor/verify", (req, res) => {
  const { token } = req.body;
  res.json({ valid: !!(token && editorSessions.has(token)) });
});

app.post("/api/editor/logout", (req, res) => {
  const token = req.headers["x-editor-token"] as string;
  if (token) editorSessions.delete(token);
  res.json({ success: true });
});

// ── Editor Articles Routes ────────────────────────────────────────────────────
app.get("/api/editor/articles", requireEditorToken, (_req, res) => {
  res.json(articles.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()));
});

app.post("/api/editor/articles", requireEditorToken, (req, res) => {
  const { id, title, subtitle, founderName, startupName, location, foundedYear, tags, coverImage, body, status } = req.body;
  const wordCount = body ? body.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length : 0;
  if (id) {
    const idx = articles.findIndex((a) => a.id === id);
    if (idx !== -1) {
      articles[idx] = { ...articles[idx], title, subtitle, founderName, startupName, location, foundedYear, tags, coverImage, body, status, wordCount, updatedAt: new Date().toISOString() };
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
    body: body || "",
    status: status || "draft",
    wordCount,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  articles.push(newArticle);
  res.json({ success: true, article: newArticle });
});

app.delete("/api/editor/articles/:id", requireEditorToken, (req, res) => {
  const idx = articles.findIndex((a) => a.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Article not found" });
  articles.splice(idx, 1);
  res.json({ success: true });
});

// ── Editor Image Upload ───────────────────────────────────────────────────────
app.post("/api/editor/upload", requireEditorToken, upload.single("image"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  const url = `/uploads/${req.file.filename}`;
  res.json({ success: true, url });
});

// ── Public API Routes ─────────────────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", geminiConfigured: !!ai });
});

// Subscriber Endpoints
app.get("/api/subscribers", (req, res) => {
  res.json(subscribers);
});

app.post("/api/subscribers", (req, res) => {
  const { email } = req.body;
  if (!email || !email.includes("@")) {
    return res.status(400).json({ error: "Invalid email address" });
  }
  const exists = subscribers.some((s) => s.email.toLowerCase() === email.toLowerCase());
  if (exists) {
    return res.status(400).json({ error: "Email is already subscribed" });
  }
  const newSub = { email, date: new Date().toISOString() };
  subscribers.push(newSub);
  res.json({ success: true, subscriber: newSub });
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

// Configure Vite or Static Assets serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
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
