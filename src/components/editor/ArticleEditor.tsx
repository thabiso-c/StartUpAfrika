import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Bold, Italic, Underline, Strikethrough,
  List, ListOrdered, Quote, Code, Link2, Image,
  Save, Eye, Edit3, X, Sparkles, Upload, Tag,
  ChevronDown, CheckCircle, Clock, Loader, ArrowLeft
} from "lucide-react";
import { storage } from "../../config/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

interface Article {
  id: string; title: string; subtitle: string;
  founderName: string; startupName: string; location: string; foundedYear: string;
  tags: string[]; coverImage: string; body: string;
  status: "draft" | "published"; wordCount: number;
  createdAt: string; updatedAt: string;
}
interface Props { article: Article; token: string; onSave: (a: Article) => Promise<void>; onClose: () => void; }

const EDITOR_HEADER = "x-editor-token";

export default function ArticleEditor({ article, token, onSave, onClose }: Props) {
  const [title, setTitle] = useState(article.title === "Untitled Article" ? "" : article.title);
  const [subtitle, setSubtitle] = useState(article.subtitle);
  const [founderName, setFounderName] = useState(article.founderName);
  const [startupName, setStartupName] = useState(article.startupName);
  const [location, setLocation] = useState(article.location);
  const [foundedYear, setFoundedYear] = useState(article.foundedYear);
  const [tags, setTags] = useState<string[]>(article.tags);
  const [tagInput, setTagInput] = useState("");
  const [coverImage, setCoverImage] = useState(article.coverImage);
  const [status, setStatus] = useState<"draft" | "published">(article.status);
  const [previewMode, setPreviewMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [wordCount, setWordCount] = useState(article.wordCount);
  const [linkUrl, setLinkUrl] = useState("");
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingInline, setUploadingInline] = useState(false);

  const editorRef = useRef<HTMLDivElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const inlineInputRef = useRef<HTMLInputElement>(null);
  const articleId = useRef<string>(article.id);

  // Initialise editor body
  useEffect(() => {
    if (editorRef.current && !editorRef.current.innerHTML) {
      editorRef.current.innerHTML = article.body || "";
    }
  }, []);

  // Word count updater
  const updateWordCount = useCallback(() => {
    const text = editorRef.current?.innerText || "";
    setWordCount(text.split(/\s+/).filter(Boolean).length);
  }, []);

  // Ctrl+S save
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") { e.preventDefault(); handleSave(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [title, subtitle, founderName, startupName, location, foundedYear, tags, coverImage, status]);

  const exec = (cmd: string, value?: string) => {
    document.execCommand(cmd, false, value);
    editorRef.current?.focus();
  };

  const handleHeading = (tag: string) => {
    exec("formatBlock", tag);
  };

  const insertLink = () => {
    if (!linkUrl) return;
    exec("createLink", linkUrl);
    setLinkUrl("");
    setShowLinkInput(false);
  };

  const handleCoverUpload = async (file: File) => {
    if (!storage) {
      alert("Firebase Storage is not configured.");
      return;
    }
    setUploadingCover(true);
    try {
      const ext = file.name.split('.').pop();
      const storageRef = ref(storage, `editor/covers/${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setCoverImage(url);
    } catch (e) {
      console.error(e);
      alert("Failed to upload cover image.");
    } finally { setUploadingCover(false); }
  };

  const handleInlineImageUpload = async (file: File) => {
    if (!storage) {
      alert("Firebase Storage is not configured.");
      return;
    }
    setUploadingInline(true);
    try {
      const ext = file.name.split('.').pop();
      const storageRef = ref(storage, `editor/inline/${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      const img = `<img src="${url}" alt="Article image" style="max-width:100%;border-radius:8px;margin:12px 0;" />`;
      exec("insertHTML", img);
    } catch (e) {
      console.error(e);
      alert("Failed to upload image.");
    } finally { setUploadingInline(false); }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) handleInlineImageUpload(file);
  };

  const handleSave = async () => {
    setSaving(true);
    const body = editorRef.current?.innerHTML || "";
    const payload: Article = {
      ...article,
      id: articleId.current,
      title: title || "Untitled Article",
      subtitle, founderName, startupName, location, foundedYear,
      tags, coverImage, body, status, wordCount,
      updatedAt: new Date().toISOString(),
    };
    await onSave(payload);
    setSaving(false);
    setSavedAt(new Date().toLocaleTimeString());
  };

  const handleAIPolish = async () => {
    const body = editorRef.current?.innerHTML || "";
    if (!body.trim()) return;
    setAiLoading(true);
    try {
      const res = await fetch("/api/generate-outreach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startupName: startupName || title,
          description: editorRef.current?.innerText?.substring(0, 500) || body,
          targetAchievements: "Polish this article for grammar, clarity, and flow",
        }),
      });
      // For now just show a placeholder — full AI polish can be wired to Gemini later
      alert("AI Polish is ready to use once you wire it to the Gemini endpoint. Your article content has been preserved.");
    } finally { setAiLoading(false); }
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setTagInput("");
  };

  const removeTag = (t: string) => setTags(tags.filter((x) => x !== t));

  // Toolbar button component
  const ToolBtn = ({ icon: Icon, cmd, val, title: tip }: { icon: any; cmd?: string; val?: string; title: string; onClick?: () => void }) => (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); if (cmd) exec(cmd, val); }}
      title={tip}
      className="p-1.5 rounded text-white/50 hover:text-white hover:bg-white/10 transition-all"
    >
      <Icon className="w-4 h-4" />
    </button>
  );

  return (
    <div className="flex flex-col h-full bg-[#0e1310] text-white" style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>
      {/* ── Top Bar ── */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/8 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="text-white/30 hover:text-white transition-colors p-1">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2 text-white/30 text-xs">
            {savedAt ? (
              <><CheckCircle className="w-3.5 h-3.5 text-emerald-400" /><span className="text-emerald-400/70">Saved {savedAt}</span></>
            ) : (
              <><Clock className="w-3.5 h-3.5" /><span>Unsaved changes</span></>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Word count */}
          <span className="text-white/25 text-xs px-3 border-r border-white/10">{wordCount} words</span>

          {/* Status toggle */}
          <div className="relative">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as "draft" | "published")}
              className="appearance-none bg-white/5 border border-white/10 text-white/70 text-xs font-semibold pl-3 pr-7 py-1.5 rounded-lg focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-white/30 pointer-events-none" />
          </div>

          {/* Preview toggle */}
          <button
            onClick={() => setPreviewMode(!previewMode)}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${previewMode ? "bg-emerald-600/30 text-emerald-300 border border-emerald-600/40" : "bg-white/5 text-white/50 border border-white/10 hover:text-white"}`}
          >
            {previewMode ? <><Edit3 className="w-3.5 h-3.5" />Edit</> : <><Eye className="w-3.5 h-3.5" />Preview</>}
          </button>

          {/* AI Polish */}
          <button
            onClick={handleAIPolish}
            disabled={aiLoading}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-purple-900/30 text-purple-300 border border-purple-700/30 hover:bg-purple-800/40 transition-all disabled:opacity-50"
          >
            {aiLoading ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            AI Polish
          </button>

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 text-xs font-bold px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 transition-all disabled:opacity-60"
          >
            {saving ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Save
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {previewMode ? (
          /* ── Preview Mode ── */
          <div className="max-w-3xl mx-auto px-8 py-12">
            {coverImage && <img src={coverImage} alt="Cover" className="w-full h-72 object-cover rounded-2xl mb-8" />}
            <div className="flex flex-wrap gap-2 mb-4">
              {tags.map((t) => <span key={t} className="text-xs bg-emerald-900/40 text-emerald-300 px-3 py-1 rounded-full">{t}</span>)}
            </div>
            <h1 className="text-4xl font-extrabold text-white leading-tight mb-3">{title || "Untitled Article"}</h1>
            {subtitle && <p className="text-xl text-white/50 mb-6 leading-relaxed">{subtitle}</p>}
            <div className="flex items-center gap-3 py-4 border-y border-white/8 mb-8">
              <div className="w-10 h-10 rounded-full bg-emerald-700/40 flex items-center justify-center text-emerald-300 font-bold text-sm">
                {founderName?.charAt(0) || "?"}
              </div>
              <div>
                <p className="text-white/80 text-sm font-semibold">{founderName || "Founder Name"}</p>
                <p className="text-white/30 text-xs">{startupName}{location ? ` · ${location}` : ""}{foundedYear ? ` · ${foundedYear}` : ""}</p>
              </div>
            </div>
            <div
              className="prose prose-invert prose-emerald max-w-none text-white/80 leading-relaxed"
              style={{ lineHeight: "1.85" }}
              dangerouslySetInnerHTML={{ __html: editorRef.current?.innerHTML || article.body }}
            />
          </div>
        ) : (
          /* ── Edit Mode ── */
          <div className="max-w-3xl mx-auto px-8 py-8 space-y-6">
            {/* Cover Image */}
            <div>
              {coverImage ? (
                <div className="relative group rounded-2xl overflow-hidden">
                  <img src={coverImage} alt="Cover" className="w-full h-52 object-cover" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-3 transition-all">
                    <button onClick={() => coverInputRef.current?.click()} className="bg-white/20 hover:bg-white/30 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5 transition-all">
                      <Upload className="w-3.5 h-3.5" /> Change Cover
                    </button>
                    <button onClick={() => setCoverImage("")} className="bg-red-500/30 hover:bg-red-500/50 text-red-300 text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5 transition-all">
                      <X className="w-3.5 h-3.5" /> Remove
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => coverInputRef.current?.click()}
                  disabled={uploadingCover}
                  className="w-full h-36 rounded-2xl border-2 border-dashed border-white/10 hover:border-emerald-600/40 text-white/25 hover:text-emerald-400/60 flex flex-col items-center justify-center gap-2 transition-all text-sm font-medium"
                >
                  {uploadingCover ? <Loader className="w-5 h-5 animate-spin" /> : <><Image className="w-6 h-6" /><span>Click to add a cover image</span></>}
                </button>
              )}
              <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { if (e.target.files?.[0]) handleCoverUpload(e.target.files[0]); }} />
            </div>

            {/* Tags */}
            <div className="flex flex-wrap items-center gap-2">
              {tags.map((t) => (
                <span key={t} className="flex items-center gap-1 text-xs bg-emerald-900/30 text-emerald-300 border border-emerald-700/30 px-2.5 py-1 rounded-full">
                  {t}
                  <button onClick={() => removeTag(t)} className="hover:text-red-400 transition-colors"><X className="w-3 h-3" /></button>
                </span>
              ))}
              <div className="flex items-center gap-1">
                <Tag className="w-3 h-3 text-white/20" />
                <input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(); } }}
                  placeholder="Add tag…"
                  className="bg-transparent text-white/50 placeholder-white/15 text-xs outline-none w-24"
                />
              </div>
            </div>

            {/* Title */}
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Article Headline"
              className="w-full bg-transparent text-white text-4xl font-extrabold placeholder-white/15 outline-none border-none resize-none leading-tight"
            />

            {/* Subtitle */}
            <input
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="A compelling subtitle or excerpt…"
              className="w-full bg-transparent text-white/50 text-xl placeholder-white/15 outline-none border-none"
            />

            {/* Founder Meta */}
            <div className="grid grid-cols-2 gap-3 p-4 bg-white/3 border border-white/8 rounded-xl">
              <div>
                <label className="block text-white/30 text-[10px] uppercase tracking-widest mb-1">Founder Name</label>
                <input value={founderName} onChange={(e) => setFounderName(e.target.value)} placeholder="e.g. Thabiso Letsoko" className="w-full bg-transparent text-white/80 text-sm placeholder-white/15 outline-none" />
              </div>
              <div>
                <label className="block text-white/30 text-[10px] uppercase tracking-widest mb-1">Startup Name</label>
                <input value={startupName} onChange={(e) => setStartupName(e.target.value)} placeholder="e.g. Slyzah" className="w-full bg-transparent text-white/80 text-sm placeholder-white/15 outline-none" />
              </div>
              <div>
                <label className="block text-white/30 text-[10px] uppercase tracking-widest mb-1">Location</label>
                <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Johannesburg, SA" className="w-full bg-transparent text-white/80 text-sm placeholder-white/15 outline-none" />
              </div>
              <div>
                <label className="block text-white/30 text-[10px] uppercase tracking-widest mb-1">Founded Year</label>
                <input value={foundedYear} onChange={(e) => setFoundedYear(e.target.value)} placeholder="e.g. 2023" className="w-full bg-transparent text-white/80 text-sm placeholder-white/15 outline-none" />
              </div>
            </div>

            {/* Formatting Toolbar */}
            <div className="sticky top-0 z-10 bg-[#0e1310] border border-white/8 rounded-xl px-3 py-2 flex flex-wrap items-center gap-1">
              {/* Headings */}
              <select
                onChange={(e) => { handleHeading(e.target.value); e.target.value = ""; }}
                defaultValue=""
                className="appearance-none bg-white/5 border border-white/10 text-white/50 text-xs px-2 py-1 rounded mr-1 focus:outline-none cursor-pointer"
              >
                <option value="" disabled>Heading</option>
                <option value="h1">H1</option>
                <option value="h2">H2</option>
                <option value="h3">H3</option>
                <option value="p">Normal</option>
              </select>

              <div className="h-4 w-px bg-white/10 mx-1" />

              <ToolBtn icon={Bold} cmd="bold" title="Bold (Ctrl+B)" />
              <ToolBtn icon={Italic} cmd="italic" title="Italic (Ctrl+I)" />
              <ToolBtn icon={Underline} cmd="underline" title="Underline (Ctrl+U)" />
              <ToolBtn icon={Strikethrough} cmd="strikeThrough" title="Strikethrough" />

              <div className="h-4 w-px bg-white/10 mx-1" />

              <ToolBtn icon={List} cmd="insertUnorderedList" title="Bullet List" />
              <ToolBtn icon={ListOrdered} cmd="insertOrderedList" title="Numbered List" />
              <ToolBtn icon={Quote} cmd="formatBlock" val="blockquote" title="Blockquote" />
              <ToolBtn icon={Code} cmd="formatBlock" val="pre" title="Code Block" />

              <div className="h-4 w-px bg-white/10 mx-1" />

              {/* Link */}
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); setShowLinkInput(!showLinkInput); }}
                title="Insert Link"
                className="p-1.5 rounded text-white/50 hover:text-white hover:bg-white/10 transition-all"
              >
                <Link2 className="w-4 h-4" />
              </button>

              {/* Inline Image Upload */}
              <button
                type="button"
                onClick={() => inlineInputRef.current?.click()}
                title="Upload Image"
                disabled={uploadingInline}
                className="p-1.5 rounded text-white/50 hover:text-white hover:bg-white/10 transition-all disabled:opacity-40"
              >
                {uploadingInline ? <Loader className="w-4 h-4 animate-spin" /> : <Image className="w-4 h-4" />}
              </button>
              <input ref={inlineInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { if (e.target.files?.[0]) handleInlineImageUpload(e.target.files[0]); }} />

              {/* Link input popup */}
              {showLinkInput && (
                <div className="flex items-center gap-1 ml-2">
                  <input
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && insertLink()}
                    placeholder="https://…"
                    autoFocus
                    className="bg-white/10 border border-white/20 text-white text-xs px-2 py-1 rounded outline-none w-44 placeholder-white/20"
                  />
                  <button onClick={insertLink} className="text-emerald-400 hover:text-emerald-300 text-xs font-semibold px-2 py-1 rounded bg-emerald-900/30 hover:bg-emerald-900/50 transition-all">Apply</button>
                  <button onClick={() => setShowLinkInput(false)} className="text-white/30 hover:text-white transition-all"><X className="w-3.5 h-3.5" /></button>
                </div>
              )}
            </div>

            {/* Body Editor */}
            <div
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              onInput={updateWordCount}
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              data-placeholder="Start writing your article here… You can drag and drop images directly into the editor."
              className="min-h-[480px] text-white/80 text-base leading-[1.85] outline-none focus:outline-none relative empty-editor"
              style={{
                caretColor: "#34d399",
              }}
            />
          </div>
        )}
      </div>

      <style>{`
        .empty-editor:empty:before {
          content: attr(data-placeholder);
          color: rgba(255,255,255,0.15);
          pointer-events: none;
          display: block;
        }
        .empty-editor blockquote {
          border-left: 3px solid #059669;
          padding-left: 1rem;
          color: rgba(255,255,255,0.6);
          font-style: italic;
          margin: 1.5rem 0;
        }
        .empty-editor pre {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          padding: 1rem;
          font-family: 'Fira Code', monospace;
          font-size: 0.85rem;
          color: #86efac;
          overflow-x: auto;
          margin: 1.5rem 0;
        }
        .empty-editor h1 { font-size: 2.25rem; font-weight: 800; color: white; margin: 2rem 0 0.75rem; }
        .empty-editor h2 { font-size: 1.75rem; font-weight: 700; color: white; margin: 1.75rem 0 0.6rem; }
        .empty-editor h3 { font-size: 1.35rem; font-weight: 600; color: rgba(255,255,255,0.9); margin: 1.5rem 0 0.5rem; }
        .empty-editor ul, .empty-editor ol { padding-left: 1.5rem; margin: 0.75rem 0; color: rgba(255,255,255,0.75); }
        .empty-editor li { margin: 0.3rem 0; }
        .empty-editor a { color: #34d399; text-decoration: underline; }
      `}</style>
    </div>
  );
}
