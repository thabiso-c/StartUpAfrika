import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Bold, Italic, Underline, Strikethrough,
  List, ListOrdered, Quote, Code, Link2, Image,
  Save, Eye, Edit3, X, Sparkles, Upload, Tag,
  ChevronDown, CheckCircle, Clock, Loader, ArrowLeft
} from "lucide-react";
import { storage } from "../../config/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import ReactCrop, { type Crop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

interface Article {
  id: string; title: string; subtitle: string;
  founderName: string; startupName: string; location: string; foundedYear: string;
  tags: string[]; coverImage: string; body: string;
  status: "draft" | "published"; wordCount: number;
  createdAt: string; updatedAt: string;
  coverHeight?: number;
  coverPosition?: string;
}
interface Props { article: Article; token: string; onSave: (a: Article) => Promise<any>; onClose: () => void; key?: any; }

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
  const [emailNotice, setEmailNotice] = useState<{ count: number; isSimulated: boolean; emails: string[] } | null>(null);
  const [wordCount, setWordCount] = useState(article.wordCount);
  const [linkUrl, setLinkUrl] = useState("");
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingInline, setUploadingInline] = useState(false);
  const [selectedImg, setSelectedImg] = useState<HTMLImageElement | null>(null);
  const [coverHeight, setCoverHeight] = useState<number>(article.coverHeight || 288);
  const [coverPosition, setCoverPosition] = useState<string>(article.coverPosition || "center");
  const [isCroppingCover, setIsCroppingCover] = useState(false);
  
  // Crop states
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropTarget, setCropTarget] = useState<HTMLImageElement | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [cropUploading, setCropUploading] = useState(false);
  const cropImageRef = useRef<HTMLImageElement>(null);

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

  const applyFontFamily = (family: string) => {
    document.execCommand("styleWithCSS", false, "true");
    document.execCommand("fontName", false, family);
    editorRef.current?.focus();
    updateWordCount();
  };

  const applyFontSize = (size: string) => {
    document.execCommand("styleWithCSS", false, "true");
    document.execCommand("fontSize", false, "7");
    const spans = editorRef.current?.querySelectorAll("span");
    spans?.forEach((span) => {
      const htmlSpan = span as HTMLElement;
      const styleSize = htmlSpan.style.fontSize;
      if (styleSize === "xx-large" || styleSize === "32px" || styleSize === "-webkit-xxx-large") {
        htmlSpan.style.fontSize = size;
      }
    });
    editorRef.current?.focus();
    updateWordCount();
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

  const handleInlineImageUpload = async (files: FileList | File[]) => {
    if (!storage) {
      alert("Firebase Storage is not configured.");
      return;
    }
    setUploadingInline(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const ext = file.name.split('.').pop();
        const storageRef = ref(storage, `editor/inline/${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        const img = `<img src="${url}" alt="Article image" style="max-width:100%;border-radius:8px;margin:12px 0;cursor:pointer;" />`;
        exec("insertHTML", img);
      }
    } catch (e) {
      console.error(e);
      alert("Failed to upload image(s).");
    } finally { setUploadingInline(false); }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files?.length > 0) {
      handleInlineImageUpload(e.dataTransfer.files);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setEmailNotice(null);
    try {
      const body = editorRef.current?.innerHTML || "";
      const payload: Article = {
        ...article,
        id: articleId.current,
        title: title || "Untitled Article",
        subtitle, founderName, startupName, location, foundedYear,
        tags, coverImage, body, status, wordCount,
        coverHeight, coverPosition,
        updatedAt: new Date().toISOString(),
      };
      const resData = await onSave(payload);
      setSavedAt(new Date().toLocaleTimeString());
      if (resData && resData.emailResult && resData.emailResult.count > 0) {
        setEmailNotice(resData.emailResult);
      }
    } catch (error: any) {
      console.error("Save failed:", error);
      alert(error.message || "Failed to save article draft.");
    } finally {
      setSaving(false);
    }
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

  const handleEditorClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName === "IMG") {
      setSelectedImg(target as HTMLImageElement);
    } else {
      setSelectedImg(null);
    }
  };

  const setImgAlign = (align: 'left' | 'center' | 'right' | 'full') => {
    if (!selectedImg) return;
    if (align === 'left') {
      selectedImg.style.float = 'left';
      selectedImg.style.margin = '12px 24px 12px 0';
      selectedImg.style.maxWidth = '50%';
    } else if (align === 'right') {
      selectedImg.style.float = 'right';
      selectedImg.style.margin = '12px 0 12px 24px';
      selectedImg.style.maxWidth = '50%';
    } else if (align === 'center') {
      selectedImg.style.float = 'none';
      selectedImg.style.display = 'block';
      selectedImg.style.margin = '12px auto';
      selectedImg.style.maxWidth = '80%';
    } else {
      selectedImg.style.float = 'none';
      selectedImg.style.display = 'block';
      selectedImg.style.margin = '12px 0';
      selectedImg.style.maxWidth = '100%';
    }
    updateWordCount();
  };

  const openCropModal = (img: HTMLImageElement) => {
    setIsCroppingCover(false);
    setCropTarget(img);
    setCrop(undefined);
    setCropModalOpen(true);
  };

  const openCoverCrop = () => {
    setIsCroppingCover(true);
    setCropTarget(null);
    setCrop(undefined);
    setCropModalOpen(true);
  };

  const handleCropSave = async () => {
    if ((!isCroppingCover && !cropTarget) || !crop || !storage || !cropImageRef.current) return;
    setCropUploading(true);
    try {
      const image = cropImageRef.current;
      const canvas = document.createElement("canvas");
      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;
      canvas.width = crop.width;
      canvas.height = crop.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(
        image,
        crop.x * scaleX, crop.y * scaleY,
        crop.width * scaleX, crop.height * scaleY,
        0, 0,
        crop.width, crop.height
      );
      const blob = await new Promise<Blob>((res, rej) => canvas.toBlob((b) => b ? res(b) : rej(), "image/jpeg", 0.95));
      const storageRef = ref(storage, isCroppingCover ? `editor/covers/cropped_${Date.now()}.jpg` : `editor/inline/cropped_${Date.now()}.jpg`);
      await uploadBytes(storageRef, blob);
      const url = await getDownloadURL(storageRef);
      if (isCroppingCover) {
        setCoverImage(url);
      } else if (cropTarget) {
        cropTarget.src = url;
      }
      setCropModalOpen(false);
      setCropTarget(null);
      setIsCroppingCover(false);
    } catch (e) {
      console.error(e);
      alert("Failed to crop image.");
    } finally {
      setCropUploading(false);
    }
  };

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
        {emailNotice && (
          <div className="bg-emerald-950/80 border-b border-emerald-500/30 px-5 py-3 flex items-center justify-between text-sm text-emerald-300 animate-fade-in" id="email-notification-banner">
            <div className="flex items-center gap-3">
              <span className="text-xl">📧</span>
              <div>
                <p className="font-semibold text-emerald-200">
                  Notification emails dispatched automatically to {emailNotice.count} subscribed user{emailNotice.count === 1 ? "" : "s"}!
                </p>
                <p className="text-xs text-emerald-400/80 mt-0.5">
                  {emailNotice.isSimulated 
                    ? `[Simulated mode] Delivery logged to email_logs.json for: ${emailNotice.emails.join(", ")}`
                    : `Delivered via Resend to: ${emailNotice.emails.join(", ")}`
                  }
                </p>
              </div>
            </div>
            <button 
              onClick={() => setEmailNotice(null)} 
              className="text-emerald-400 hover:text-emerald-200 p-1 transition-colors"
              title="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        {/* ── Preview Mode ── */}
        <div className={`max-w-3xl mx-auto px-8 py-12 ${previewMode ? "block" : "hidden"}`}>
          {coverImage && (
            <img 
              src={coverImage} 
              alt="Cover" 
              className="w-full rounded-2xl mb-8 object-cover" 
              style={{ 
                height: `${coverHeight}px`, 
                objectPosition: coverPosition 
              }} 
            />
          )}
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

        {/* ── Edit Mode ── */}
        <div className={`max-w-3xl mx-auto px-8 py-8 space-y-6 ${previewMode ? "hidden" : "block"}`}>
            {/* Cover Image */}
            <div>
              {coverImage ? (
                <div className="space-y-3">
                  <div className="relative group rounded-2xl overflow-hidden">
                    <img 
                      src={coverImage} 
                      alt="Cover" 
                      className="w-full object-cover transition-all" 
                      style={{ 
                        height: `${coverHeight}px`, 
                        objectPosition: coverPosition 
                      }}
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-3 transition-all">
                      <button onClick={() => coverInputRef.current?.click()} className="bg-white/20 hover:bg-white/30 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5 transition-all">
                        <Upload className="w-3.5 h-3.5" /> Change Cover
                      </button>
                      <button onClick={openCoverCrop} className="bg-purple-600/70 hover:bg-purple-600 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 transition-all">
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 1v3m12-3v3m-2 4h4M2 16h4M16 22v-3M8 22v-3M8 12h12v8H8z" /><rect x="4" y="4" width="12" height="12" rx="2" /></svg> Crop Cover
                      </button>
                      <button onClick={() => setCoverImage("")} className="bg-red-500/30 hover:bg-red-500/50 text-red-300 text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5 transition-all">
                        <X className="w-3.5 h-3.5" /> Remove
                      </button>
                    </div>
                  </div>

                  {/* Cover Settings Panel */}
                  <div className="bg-white/3 border border-white/8 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex-1">
                        <div className="flex justify-between text-[10px] text-white/40 uppercase tracking-wider mb-1">
                          <span>Cover Height</span>
                          <span className="font-mono text-emerald-400 font-bold">{coverHeight}px</span>
                        </div>
                        <input 
                          type="range" 
                          min="150" 
                          max="600" 
                          value={coverHeight} 
                          onChange={(e) => setCoverHeight(Number(e.target.value))}
                          className="w-full accent-emerald-500 bg-white/10 h-1 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-white/40 uppercase tracking-wider">Position</span>
                      <div className="bg-white/5 border border-white/10 p-0.5 rounded-lg flex">
                        {(['top', 'center', 'bottom'] as const).map((pos) => (
                          <button
                            key={pos}
                            type="button"
                            onClick={() => setCoverPosition(pos)}
                            className={`text-xs px-2.5 py-1 rounded-md uppercase font-semibold transition-all ${coverPosition === pos ? "bg-emerald-600 text-white" : "text-white/40 hover:text-white"}`}
                          >
                            {pos}
                          </button>
                        ))}
                      </div>
                    </div>
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
              <div className="relative flex items-center">
                <select
                  onChange={(e) => { handleHeading(e.target.value); e.target.value = ""; }}
                  defaultValue=""
                  className="appearance-none bg-white/5 border border-white/10 text-white/50 text-xs pl-2.5 pr-6 py-1 rounded-md focus:outline-none cursor-pointer hover:bg-white/10 hover:text-white transition-all mr-1"
                >
                  <option value="" disabled className="bg-[#0e1310] text-white/50">Heading</option>
                  <option value="h1" className="bg-[#0e1310] text-white">H1</option>
                  <option value="h2" className="bg-[#0e1310] text-white">H2</option>
                  <option value="h3" className="bg-[#0e1310] text-white">H3</option>
                  <option value="p" className="bg-[#0e1310] text-white">Normal</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-white/30 pointer-events-none" />
              </div>

              {/* Font Family */}
              <div className="relative flex items-center">
                <select
                  onChange={(e) => { applyFontFamily(e.target.value); e.target.value = ""; }}
                  defaultValue=""
                  className="appearance-none bg-white/5 border border-white/10 text-white/50 text-xs pl-2.5 pr-6 py-1 rounded-md focus:outline-none cursor-pointer hover:bg-white/10 hover:text-white transition-all mr-1"
                >
                  <option value="" disabled className="bg-[#0e1310] text-white/50">Font Family</option>
                  <option value="'Inter', sans-serif" className="bg-[#0e1310] text-white">Sans (Inter)</option>
                  <option value="'Playfair Display', serif" className="bg-[#0e1310] text-white">Serif (Playfair)</option>
                  <option value="'Lora', serif" className="bg-[#0e1310] text-white">Serif (Lora)</option>
                  <option value="'Space Grotesk', sans-serif" className="bg-[#0e1310] text-white">Modern (Space)</option>
                  <option value="'Outfit', sans-serif" className="bg-[#0e1310] text-white">Tech (Outfit)</option>
                  <option value="'JetBrains Mono', monospace" className="bg-[#0e1310] text-white">Mono (JetBrains)</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-white/30 pointer-events-none" />
              </div>

              {/* Font Size */}
              <div className="relative flex items-center">
                <select
                  onChange={(e) => { applyFontSize(e.target.value); e.target.value = ""; }}
                  defaultValue=""
                  className="appearance-none bg-white/5 border border-white/10 text-white/50 text-xs pl-2.5 pr-6 py-1 rounded-md focus:outline-none cursor-pointer hover:bg-white/10 hover:text-white transition-all mr-1"
                >
                  <option value="" disabled className="bg-[#0e1310] text-white/50">Font Size</option>
                  <option value="12px" className="bg-[#0e1310] text-white">12px</option>
                  <option value="14px" className="bg-[#0e1310] text-white">14px</option>
                  <option value="16px" className="bg-[#0e1310] text-white font-semibold">16px</option>
                  <option value="18px" className="bg-[#0e1310] text-white">18px</option>
                  <option value="20px" className="bg-[#0e1310] text-white font-semibold">20px</option>
                  <option value="24px" className="bg-[#0e1310] text-white">24px</option>
                  <option value="30px" className="bg-[#0e1310] text-white">30px</option>
                  <option value="36px" className="bg-[#0e1310] text-white">36px</option>
                  <option value="48px" className="bg-[#0e1310] text-white">48px</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-white/30 pointer-events-none" />
              </div>

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
              <input ref={inlineInputRef} type="file" multiple accept="image/*" className="hidden" onChange={(e) => { if (e.target.files) handleInlineImageUpload(e.target.files); }} />

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

            {/* Image Selected Options */}
            {selectedImg && (
              <div className="sticky top-[68px] z-10 bg-emerald-900/40 border border-emerald-500/30 rounded-xl px-3 py-2 flex flex-wrap items-center gap-2">
                <span className="text-emerald-300 text-xs font-semibold uppercase tracking-wider mr-2">Image Options</span>
                <button onClick={() => setImgAlign('left')} className="text-xs font-medium text-emerald-100 bg-white/10 hover:bg-white/20 px-2 py-1.5 rounded transition-colors">Align Left</button>
                <button onClick={() => setImgAlign('center')} className="text-xs font-medium text-emerald-100 bg-white/10 hover:bg-white/20 px-2 py-1.5 rounded transition-colors">Center</button>
                <button onClick={() => setImgAlign('right')} className="text-xs font-medium text-emerald-100 bg-white/10 hover:bg-white/20 px-2 py-1.5 rounded transition-colors">Align Right</button>
                <button onClick={() => setImgAlign('full')} className="text-xs font-medium text-emerald-100 bg-white/10 hover:bg-white/20 px-2 py-1.5 rounded transition-colors">Full Width</button>
                <div className="h-4 w-px bg-emerald-500/30 mx-1" />
                <button onClick={() => openCropModal(selectedImg)} className="text-xs font-bold text-purple-100 bg-purple-600/70 hover:bg-purple-600 px-3 py-1.5 rounded transition-all">Crop Image</button>
              </div>
            )}

            {/* Body Editor */}
            <div
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              onClick={handleEditorClick}
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

      {/* Crop Modal */}
      {cropModalOpen && cropTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-[#1a221d] rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-white/10">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white text-lg font-bold">Crop Image</h3>
              <button onClick={() => setCropModalOpen(false)} className="text-white/50 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto bg-black/50 rounded-xl flex items-center justify-center p-4">
              <ReactCrop crop={crop} onChange={(_, percentCrop) => setCrop(percentCrop)}>
                <img
                  ref={cropImageRef}
                  src={cropTarget.src}
                  crossOrigin="anonymous"
                  alt="Crop preview"
                  className="max-h-[60vh] object-contain"
                />
              </ReactCrop>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setCropModalOpen(false)}
                className="px-4 py-2 text-sm font-semibold text-white/50 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCropSave}
                disabled={cropUploading || !crop}
                className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-lg transition-colors"
              >
                {cropUploading && <Loader className="w-4 h-4 animate-spin" />}
                Save Crop
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
