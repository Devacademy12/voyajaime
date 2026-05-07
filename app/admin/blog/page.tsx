"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabaseClient";
import {
  Plus, Save, Trash2, Eye, EyeOff, ChevronLeft, Check,
  Loader2, AlertCircle, Search, Star,  Clock,
  Bold, Italic, List, Link as LinkIcon, AlignLeft,
  AlignCenter, Quote, Heading1, Heading2, Minus, RefreshCw,
  Upload, X, ImagePlus, ExternalLink, FileText, BarChart2,
  Tag, Calendar, Edit3, Globe, Image,
} from "lucide-react";

/* ══════════════════════════════════════════
   TYPES  — alignés sur le schéma SQL réel
══════════════════════════════════════════ */
interface Post {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string | null;
  cover_url: string | null;
  category: string;
  tags: string[];
  is_published: boolean;
  is_featured: boolean;
  /* ✅ CORRIGÉ : read_time et position ajoutés (colonnes absentes du schéma → ALTER TABLE requis) */
  read_time: number;
  position: number;
  published_at: string | null;
  author_name: string;
  /* ✅ CORRIGÉ : author_avatar → author_photo (nom réel dans le schéma SQL) */
  author_photo: string | null;
  views: number;
  created_at: string;
  updated_at: string;
}

const CATEGORIES = ["Voyage","Culture","Gastronomie","Nature","Aventure","Conseils","Hébergement","Transport"];

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600;700;800&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'DM Sans',system-ui,sans-serif;background:#F0F4F8}

  @keyframes spin   {to{transform:rotate(360deg)}}
  @keyframes fadeUp {from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
  @keyframes slideR {from{opacity:0;transform:translateX(24px)}to{opacity:1;transform:translateX(0)}}

  .post-card{background:white;border-radius:16px;border:1.5px solid #E5E7EB;overflow:hidden;transition:all .2s;animation:fadeUp .2s ease both;cursor:pointer}
  .post-card:hover{box-shadow:0 8px 28px rgba(0,0,0,.09);transform:translateY(-2px)}
  .post-card.selected{border-color:#02AFCF;box-shadow:0 0 0 3px rgba(2,175,207,.12)}

  .btn-primary{display:inline-flex;align-items:center;gap:7px;padding:10px 20px;background:linear-gradient(135deg,#02AFCF,#053366);color:white;border:none;border-radius:12px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;transition:all .2s;box-shadow:0 4px 14px rgba(2,175,207,.3)}
  .btn-primary:hover{transform:translateY(-1px);box-shadow:0 6px 20px rgba(2,175,207,.4)}
  .btn-primary:disabled{background:#E5E7EB;color:#9CA3AF;cursor:not-allowed;transform:none;box-shadow:none}
  .btn-primary.ok{background:linear-gradient(135deg,#059669,#047857)}
  .btn-danger{display:inline-flex;align-items:center;gap:6px;padding:8px 16px;background:#FEF2F2;color:#DC2626;border:1.5px solid #FCA5A5;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;transition:all .15s}
  .btn-danger:hover{background:#DC2626;color:white}
  .btn-ghost{display:inline-flex;align-items:center;gap:6px;padding:8px 14px;background:#F3F4F6;color:#374151;border:1.5px solid #E5E7EB;border-radius:10px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;transition:all .15s}
  .btn-ghost:hover{border-color:#D1D5DB;background:#E5E7EB}

  .field{width:100%;padding:10px 14px;border:1.5px solid #E5E7EB;border-radius:12px;font-size:14px;font-family:inherit;color:#111827;background:white;outline:none;transition:all .2s}
  .field:focus{border-color:#02AFCF;box-shadow:0 0 0 3px rgba(2,175,207,.08)}
  .field-label{font-size:11px;font-weight:700;color:#9CA3AF;text-transform:uppercase;letter-spacing:.5px;display:block;margin-bottom:6px}

  .tb{display:flex;flex-wrap:wrap;gap:4px;padding:10px 12px;background:#F9FAFB;border:1.5px solid #E5E7EB;border-bottom:none;border-radius:12px 12px 0 0}
  .tb-btn{display:flex;align-items:center;justify-content:center;width:30px;height:30px;border:1px solid transparent;border-radius:7px;background:none;cursor:pointer;color:#374151;font-size:13px;font-weight:700;transition:all .15s;flex-shrink:0}
  .tb-btn:hover{background:#E5E7EB;border-color:#D1D5DB}
  .tb-btn.on{background:#053366;color:white;border-color:#053366}
  .tb-sep{width:1px;height:24px;background:#E5E7EB;margin:0 3px;align-self:center}
  .editor{min-height:280px;padding:16px;border:1.5px solid #E5E7EB;border-radius:0 0 12px 12px;font-size:15px;color:#111827;line-height:1.85;outline:none;font-family:'DM Sans',sans-serif}
  .editor:focus{border-color:#02AFCF;box-shadow:0 0 0 3px rgba(2,175,207,.08)}
  .editor h1{font-family:'Playfair Display',serif;font-size:28px;font-weight:900;margin-bottom:12px;color:#053366}
  .editor h2{font-family:'Playfair Display',serif;font-size:22px;font-weight:700;margin-bottom:10px;color:#053366}
  .editor p{margin-bottom:12px}
  .editor ul{padding-left:22px;margin-bottom:12px}
  .editor li{margin-bottom:5px}
  .editor blockquote{border-left:3px solid #02AFCF;padding:10px 16px;background:rgba(2,175,207,.05);border-radius:0 10px 10px 0;color:#6B7280;font-style:italic;margin:12px 0}
  .editor a{color:#02AFCF;text-decoration:underline}
  .editor strong{font-weight:700}
  .editor em{font-style:italic}
  .editor hr{border:none;border-top:1px solid #E5E7EB;margin:16px 0}

  .drop{position:relative;border-radius:14px;border:2px dashed #D1D5DB;background:#F9FAFB;transition:all .2s;overflow:hidden}
  .drop:hover,.drop.over{border-color:#02AFCF;background:rgba(2,175,207,.04)}
  .drop.filled{border-style:solid;border-color:#E5E7EB}
  .drop-overlay{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;background:rgba(255,255,255,.92);backdrop-filter:blur(4px);z-index:10}
  .prog-bg{width:160px;height:5px;background:#E5E7EB;border-radius:10px;overflow:hidden}
  .prog-fill{height:100%;background:linear-gradient(90deg,#02AFCF,#053366);border-radius:10px;transition:width .2s}
  .img-hover{position:absolute;inset:0;background:linear-gradient(to top,rgba(5,16,36,.7) 0%,transparent 55%);opacity:0;transition:opacity .2s;display:flex;align-items:flex-end;justify-content:space-between;padding:12px 14px}
  .drop:hover .img-hover{opacity:1}
  .img-act{display:flex;align-items:center;gap:5px;padding:6px 12px;border-radius:8px;border:none;cursor:pointer;font-size:12px;font-weight:700;font-family:inherit;transition:all .15s}

  .tog{position:relative;width:44px;height:24px;border-radius:12px;border:none;cursor:pointer;transition:background .2s;flex-shrink:0}
  .tog-k{position:absolute;top:3px;width:18px;height:18px;border-radius:50%;background:white;transition:left .2s;box-shadow:0 1px 4px rgba(0,0,0,.2)}

  .badge{display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700}

  .edit-panel{background:white;border-left:1.5px solid #E5E7EB;height:100vh;overflow-y:auto;position:sticky;top:0;animation:slideR .25s ease}

  *::-webkit-scrollbar{width:4px}
  *::-webkit-scrollbar-thumb{background:#E5E7EB;border-radius:2px}
`;

/* ══════════════════════════════════════════
   IMAGE UPLOADER
══════════════════════════════════════════ */
function ImageUploader({
  value,
  onChange,
  folder = "blog",
}: {
  value: string;
  onChange: (u: string) => void;
  folder?: string;
}) {
  const sb = createClient();
  const ref = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [drag, setDrag] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [tab, setTab] = useState<"upload" | "url">("upload");
  const [urlInput, setUrlInput] = useState(value || "");

  useEffect(() => setUrlInput(value || ""), [value]);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) return setErr("Fichier invalide — image uniquement");
    if (file.size > 10 * 1024 * 1024) return setErr("Max 10 Mo");
    setErr(null);
    setUploading(true);
    setProgress(10);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const tick = setInterval(() => setProgress((p) => Math.min(p + 10, 85)), 280);
      const { error: upErr } = await sb.storage
        .from("voyajaime-media")
        .upload(path, file, { upsert: true });
      clearInterval(tick);
      if (upErr) throw upErr;
      setProgress(100);
      const { data } = sb.storage.from("voyajaime-media").getPublicUrl(path);
      setTimeout(() => {
        onChange(data.publicUrl);
        setUrlInput(data.publicUrl);
        setUploading(false);
        setProgress(0);
      }, 400);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Erreur upload");
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <div>
      <label className="field-label">
        <Image size={11} style={{ display: "inline", marginRight: 4 }} />
        Image de couverture
      </label>
      <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
        {(["upload", "url"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: "4px 12px",
              borderRadius: 8,
              border: "1.5px solid",
              borderColor: tab === t ? "#02AFCF" : "#E5E7EB",
              background: tab === t ? "rgba(2,175,207,.08)" : "white",
              color: tab === t ? "#02AFCF" : "#6B7280",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            {t === "upload" ? "📁 PC" : "🔗 URL"}
          </button>
        ))}
      </div>

      {tab === "upload" && (
        <>
          <div
            className={`drop ${drag ? "over" : ""} ${value ? "filled" : ""}`}
            onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDrag(false);
              const f = e.dataTransfer.files?.[0];
              if (f) handleFile(f);
            }}
            onClick={() => !value && ref.current?.click()}
            style={{ minHeight: value ? "auto" : 130, cursor: value ? "default" : "pointer" }}
          >
            <input
              ref={ref}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
                e.target.value = "";
              }}
            />
            {uploading && (
              <div className="drop-overlay">
                <Loader2 size={20} color="#02AFCF" style={{ animation: "spin .7s linear infinite" }} />
                <div className="prog-bg">
                  <div className="prog-fill" style={{ width: `${progress}%` }} />
                </div>
                <p style={{ fontSize: 12, color: "#6B7280", fontWeight: 600 }}>{progress}%</p>
              </div>
            )}
            {value ? (
              <>
                <img src={value} alt="" style={{ width: "100%", height: 160, objectFit: "cover", display: "block" }} />
                <div className="img-hover">
                  <button
                    className="img-act"
                    style={{ background: "rgba(255,255,255,.15)", color: "white", backdropFilter: "blur(6px)" }}
                    onClick={(e) => { e.stopPropagation(); ref.current?.click(); }}
                  >
                    <Upload size={11} />Remplacer
                  </button>
                  <button
                    className="img-act"
                    style={{ background: "rgba(220,38,38,.85)", color: "white" }}
                    onClick={(e) => { e.stopPropagation(); onChange(""); setUrlInput(""); }}
                  >
                    <X size={11} />Supprimer
                  </button>
                </div>
              </>
            ) : (
              <div style={{ padding: "28px 16px", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, pointerEvents: "none" }}>
                <div style={{ width: 44, height: 44, borderRadius: 14, background: "rgba(2,175,207,.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <ImagePlus size={20} color="#02AFCF" />
                </div>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>
                  Glisser ou <span style={{ color: "#02AFCF" }}>parcourir</span>
                </p>
                <p style={{ fontSize: 11, color: "#C4C4C4" }}>JPG · PNG · WEBP · max 10 Mo</p>
              </div>
            )}
          </div>
          {err && (
            <p style={{ fontSize: 12, color: "#DC2626", marginTop: 6, display: "flex", alignItems: "center", gap: 4 }}>
              <AlertCircle size={12} />{err}
            </p>
          )}
          {value && !uploading && (
            <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 6, padding: "5px 10px", background: "#F0FFF4", border: "1px solid #A7F3D0", borderRadius: 8 }}>
              <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#059669" }} />
              <p style={{ fontSize: 11, color: "#065F46", flex: 1, wordBreak: "break-all" }}>
                {value.length > 55 ? `…${value.slice(-50)}` : value}
              </p>
              {/* ✅ CORRIGÉ : size:11 → size={11} */}
              <a href={value} target="_blank" rel="noreferrer" style={{ color: "#059669" }}>
                <ExternalLink size={11} />
              </a>
            </div>
          )}
        </>
      )}

      {tab === "url" && (
        <div>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              className="field"
              value={urlInput}
              placeholder="https://…"
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onChange(urlInput)}
              style={{ flex: 1 }}
            />
            <button
              onClick={() => onChange(urlInput)}
              style={{ padding: "10px 14px", background: "#053366", color: "white", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
            >
              OK
            </button>
          </div>
          {value && (
            <div style={{ marginTop: 8, borderRadius: 10, overflow: "hidden", border: "1.5px solid #E5E7EB", height: 120, position: "relative" }}>
              <img src={value} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              <button
                onClick={() => { onChange(""); setUrlInput(""); }}
                style={{ position: "absolute", top: 8, right: 8, width: 24, height: 24, borderRadius: "50%", background: "rgba(0,0,0,.5)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}
              >
                <X size={12} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════
   WYSIWYG
══════════════════════════════════════════ */
function Wysiwyg({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value) ref.current.innerHTML = value || "";
  }, []);
  const exec = (cmd: string, val?: string) => {
    document.execCommand(cmd, false, val);
    ref.current?.focus();
    if (ref.current) onChange(ref.current.innerHTML);
  };
  const active = (cmd: string) => {
    try { return document.queryCommandState(cmd); } catch { return false; }
  };

  const TOOLS: Array<{ icon: React.ReactNode; cmd: string; val?: string; title: string } | "sep"> = [
    { icon: <Bold size={13} />,       cmd: "bold",                    title: "Gras" },
    { icon: <Italic size={13} />,     cmd: "italic",                  title: "Italique" },
    "sep",
    { icon: <Heading1 size={13} />,   cmd: "formatBlock", val: "h1",  title: "Titre H1" },
    { icon: <Heading2 size={13} />,   cmd: "formatBlock", val: "h2",  title: "Titre H2" },
    { icon: <AlignLeft size={13} />,  cmd: "formatBlock", val: "p",   title: "Paragraphe" },
    "sep",
    { icon: <List size={13} />,       cmd: "insertUnorderedList",     title: "Liste" },
    { icon: <Quote size={13} />,      cmd: "formatBlock", val: "blockquote", title: "Citation" },
    { icon: <Minus size={13} />,      cmd: "insertHorizontalRule",    title: "Séparateur" },
    "sep",
    { icon: <AlignCenter size={13} />, cmd: "justifyCenter",          title: "Centrer" },
    { icon: <LinkIcon size={13} />,   cmd: "__link__",                title: "Lien" },
    "sep",
    { icon: <RefreshCw size={11} />,  cmd: "removeFormat",            title: "Effacer formatage" },
  ];

  return (
    <div>
      <div className="tb">
        {TOOLS.map((t, i) =>
          t === "sep" ? (
            <div key={i} className="tb-sep" />
          ) : (
            <button
              key={i}
              type="button"
              title={t.title}
              className={`tb-btn ${active(t.cmd) ? "on" : ""}`}
              onMouseDown={(e) => {
                e.preventDefault();
                if (t.cmd === "__link__") {
                  const u = prompt("URL:", "");
                  if (u) exec("createLink", u);
                } else {
                  exec(t.cmd, t.val);
                }
              }}
            >
              {t.icon}
            </button>
          )
        )}
      </div>
      <div
        ref={ref}
        className="editor"
        contentEditable
        suppressContentEditableWarning
        onInput={() => { if (ref.current) onChange(ref.current.innerHTML); }}
        data-placeholder="Commencez à rédiger votre article…"
      />
    </div>
  );
}

/* ══════════════════════════════════════════
   SLUG GENERATOR
══════════════════════════════════════════ */
const toSlug = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-");

/* ══════════════════════════════════════════
   EMPTY POST — ✅ CORRIGÉ : author_avatar → author_photo
══════════════════════════════════════════ */
const emptyPost = (): Omit<Post, "id" | "views" | "created_at" | "updated_at"> => ({
  slug: "",
  title: "",
  excerpt: null,
  content: null,
  cover_url: null,
  category: "Voyage",
  tags: [],
  is_published: false,
  is_featured: false,
  read_time: 5,
  position: 0,
  published_at: null,
  author_name: "VoyajAime",
  author_photo: null,   // ✅ CORRIGÉ
});

/* ══════════════════════════════════════════
   MAIN ADMIN COMPONENT
══════════════════════════════════════════ */
export default function BlogAdminPage() {
  const sb = createClient();
  const [posts, setPosts]       = useState<Post[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [filter, setFilter]     = useState<"all" | "published" | "draft">("all");
  const [editing, setEditing]   = useState<Post | null>(null);
  const [isNew, setIsNew]       = useState(false);
  const [saving, setSaving]     = useState(false);
  const [saveOk, setSaveOk]     = useState(false);
  const [saveErr, setSaveErr]   = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState("");

  /* ── Load posts ── */
  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await sb
      .from("blog_posts")
      .select("*")
      .order("position")
      .order("created_at", { ascending: false });
    setPosts(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  /* ── Filtered list ── */
  const filtered = posts.filter((p) => {
    const q = search.toLowerCase();
    const match = !q || p.title.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
    const pub =
      filter === "all" ? true : filter === "published" ? p.is_published : !p.is_published;
    return match && pub;
  });

  /* ── Open editor ── */
  const openNew = () => {
    setEditing({ ...emptyPost(), id: "__new__", views: 0, created_at: "", updated_at: "" } as Post);
    setIsNew(true);
    setSaveErr(null);
  };
  const openEdit = (p: Post) => { setEditing({ ...p }); setIsNew(false); setSaveErr(null); };
  const close = () => { setEditing(null); setIsNew(false); };

  /* ── Save ── ✅ CORRIGÉ : payload utilise author_photo + read_time + position */
  const save = async () => {
    if (!editing) return;
    if (!editing.title.trim()) return setSaveErr("Le titre est obligatoire.");
    if (!editing.slug.trim())  return setSaveErr("Le slug est obligatoire.");
    setSaving(true);
    setSaveErr(null);
    try {
      const payload = {
        slug:         editing.slug,
        title:        editing.title,
        excerpt:      editing.excerpt,
        content:      editing.content,
        cover_url:    editing.cover_url,
        category:     editing.category,
        tags:         editing.tags,
        is_published: editing.is_published,
        is_featured:  editing.is_featured,
        read_time:    editing.read_time,   // ✅ CORRIGÉ (colonne ajoutée via ALTER TABLE)
        position:     editing.position,    // ✅ CORRIGÉ (colonne ajoutée via ALTER TABLE)
        author_name:  editing.author_name,
        author_photo: editing.author_photo, // ✅ CORRIGÉ : author_avatar → author_photo
        published_at:
          editing.is_published && !editing.published_at
            ? new Date().toISOString()
            : editing.published_at,
      };
      if (isNew) {
        const { error } = await sb.from("blog_posts").insert(payload);
        if (error) throw error;
      } else {
        const { error } = await sb.from("blog_posts").update(payload).eq("id", editing.id);
        if (error) throw error;
      }
      setSaveOk(true);
      await load();
      setTimeout(() => { setSaveOk(false); close(); }, 900);
    } catch (e: unknown) {
      setSaveErr(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setSaving(false);
    }
  };

  /* ── Delete ── */
  const del = async (id: string) => {
    if (!confirm("Supprimer cet article définitivement ?")) return;
    setDeleting(id);
    await sb.from("blog_posts").delete().eq("id", id);
    await load();
    setDeleting(null);
    if (editing?.id === id) close();
  };

  /* ── Quick toggle publish ── */
  const togglePublish = async (p: Post) => {
    await sb.from("blog_posts").update({
      is_published: !p.is_published,
      published_at: !p.is_published ? new Date().toISOString() : p.published_at,
    }).eq("id", p.id);
    await load();
  };

  /* ── Tag helpers ── */
  const addTag = () => {
    if (!editing || !tagInput.trim()) return;
    const t = tagInput.trim();
    if (!editing.tags.includes(t)) setEditing({ ...editing, tags: [...editing.tags, t] });
    setTagInput("");
  };
  const removeTag = (t: string) => {
    if (!editing) return;
    setEditing({ ...editing, tags: editing.tags.filter((x) => x !== t) });
  };

  /* ═══════════════════════════
     RENDER
  ═══════════════════════════ */
  return (
    <div style={{ fontFamily: "'DM Sans',system-ui,sans-serif", background: "#F0F4F8", minHeight: "100vh" }}>
      <style>{CSS}</style>

      {/* ── Topbar ── */}
      <div style={{ background: "white", borderBottom: "1px solid #E5E7EB", padding: "16px 28px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 50, gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 21, fontWeight: 900, color: "#053366", margin: 0 }}>Blog</h1>
          <p style={{ fontSize: 12, color: "#9CA3AF", margin: 0 }}>
            {posts.filter((p) => p.is_published).length} publié · {posts.filter((p) => !p.is_published).length} brouillon
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <a href="/blog" target="_blank" className="btn-ghost"><Eye size={13} />Voir le blog</a>
          <button className="btn-primary" onClick={openNew}><Plus size={14} />Nouvel article</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: editing ? "1fr 480px" : "1fr", minHeight: "calc(100vh - 65px)" }}>

        {/* ════════════════════════════════
            LEFT — Liste des articles
        ════════════════════════════════ */}
        <div style={{ padding: "24px 28px", overflowY: "auto" }}>

          {/* Filters */}
          <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 200, position: "relative" }}>
              <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#9CA3AF" }} />
              <input
                className="field"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un article…"
                style={{ paddingLeft: 36 }}
              />
            </div>
            {(["all", "published", "draft"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{ padding: "8px 16px", borderRadius: 10, border: "1.5px solid", borderColor: filter === f ? "#02AFCF" : "#E5E7EB", background: filter === f ? "rgba(2,175,207,.08)" : "white", color: filter === f ? "#02AFCF" : "#6B7280", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}
              >
                {f === "all" ? "Tous" : f === "published" ? "Publiés" : "Brouillons"}
              </button>
            ))}
          </div>

          {/* Stats row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 20 }}>
            {[
              { label: "Total articles", value: posts.length,                                          icon: <FileText size={16} color="#02AFCF" />,  bg: "rgba(2,175,207,.08)" },
              { label: "Publiés",        value: posts.filter((p) => p.is_published).length,            icon: <Globe size={16} color="#059669" />,       bg: "rgba(5,150,105,.08)" },
              { label: "Vues totales",   value: posts.reduce((a, p) => a + p.views, 0).toLocaleString(), icon: <BarChart2 size={16} color="#7C3AED" />, bg: "rgba(124,58,237,.08)" },
            ].map((s, i) => (
              <div key={i} style={{ background: "white", borderRadius: 14, padding: "16px 18px", border: "1.5px solid #E5E7EB", display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>{s.icon}</div>
                <div>
                  <p style={{ fontSize: 20, fontWeight: 800, color: "#111827", lineHeight: 1 }}>{s.value}</p>
                  <p style={{ fontSize: 12, color: "#9CA3AF" }}>{s.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Posts list */}
          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
              <Loader2 size={28} color="#02AFCF" style={{ animation: "spin .7s linear infinite" }} />
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: "#9CA3AF" }}>
              <FileText size={36} style={{ marginBottom: 12, opacity: 0.4 }} />
              <p style={{ fontWeight: 600 }}>Aucun article trouvé</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {filtered.map((p, i) => (
                <div
                  key={p.id}
                  className={`post-card ${editing?.id === p.id ? "selected" : ""}`}
                  style={{ animationDelay: `${i * 0.04}s` }}
                  onClick={() => openEdit(p)}
                >
                  <div style={{ display: "flex", gap: 0 }}>
                    {/* Cover thumb */}
                    <div style={{ width: 100, height: 80, flexShrink: 0, overflow: "hidden", background: "linear-gradient(135deg,#053366,#02AFCF)" }}>
                      {p.cover_url
                        ? <img src={p.cover_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}><FileText size={20} color="rgba(255,255,255,.4)" /></div>
                      }
                    </div>
                    {/* Info */}
                    <div style={{ flex: 1, padding: "12px 14px", minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                            <span className="badge" style={{ background: p.is_published ? "rgba(5,150,105,.1)" : "rgba(156,163,175,.12)", color: p.is_published ? "#059669" : "#6B7280" }}>
                              {p.is_published ? "Publié" : "Brouillon"}
                            </span>
                            {p.is_featured && (
                              <span className="badge" style={{ background: "rgba(217,119,6,.1)", color: "#D97706" }}>
                                <Star size={9} />À la une
                              </span>
                            )}
                            <span className="badge" style={{ background: "rgba(2,175,207,.08)", color: "#02AFCF" }}>{p.category}</span>
                          </div>
                          <p style={{ fontSize: 14, fontWeight: 800, color: "#111827", lineHeight: 1.3, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.title}</p>
                          {p.excerpt && <p style={{ fontSize: 12, color: "#9CA3AF", marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.excerpt}</p>}
                        </div>
                        {/* Actions */}
                        <div style={{ display: "flex", gap: 6, flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                          <button
                            title={p.is_published ? "Dépublier" : "Publier"}
                            onClick={() => togglePublish(p)}
                            style={{ width: 30, height: 30, borderRadius: 8, border: "1.5px solid #E5E7EB", background: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: p.is_published ? "#059669" : "#9CA3AF" }}
                          >
                            {p.is_published ? <Eye size={13} /> : <EyeOff size={13} />}
                          </button>
                          <button
                            title="Supprimer"
                            onClick={() => del(p.id)}
                            disabled={deleting === p.id}
                            style={{ width: 30, height: 30, borderRadius: 8, border: "1.5px solid #FCA5A5", background: "#FEF2F2", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#DC2626" }}
                          >
                            {deleting === p.id
                              ? <Loader2 size={12} style={{ animation: "spin .7s linear infinite" }} />
                              : <Trash2 size={13} />}
                          </button>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 6 }}>
                        <span style={{ fontSize: 11, color: "#C4C4C4", display: "flex", alignItems: "center", gap: 3 }}><Clock size={10} />{p.read_time} min</span>
                        <span style={{ fontSize: 11, color: "#C4C4C4", display: "flex", alignItems: "center", gap: 3 }}><BarChart2 size={10} />{p.views} vues</span>
                        {p.published_at && (
                          <span style={{ fontSize: 11, color: "#C4C4C4", display: "flex", alignItems: "center", gap: 3 }}>
                            <Calendar size={10} />{new Date(p.published_at).toLocaleDateString("fr-FR")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ════════════════════════════════
            RIGHT — Editor panel
        ════════════════════════════════ */}
        {editing && (
          <div className="edit-panel" style={{ padding: "0 0 80px" }}>
            {/* Panel header */}
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #F3F4F6", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, background: "white", zIndex: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button className="btn-ghost" onClick={close} style={{ padding: "6px 10px" }}><ChevronLeft size={14} /></button>
                <p style={{ fontSize: 14, fontWeight: 800, color: "#111827" }}>{isNew ? "Nouvel article" : "Modifier"}</p>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {saveErr && (
                  <p style={{ fontSize: 12, color: "#DC2626", display: "flex", alignItems: "center", gap: 4 }}>
                    <AlertCircle size={12} />{saveErr}
                  </p>
                )}
                <button className={`btn-primary ${saveOk ? "ok" : ""}`} onClick={save} disabled={saving || saveOk}>
                  {saving  ? <><Loader2 size={13} style={{ animation: "spin .7s linear infinite" }} />Enregistrement…</>
                  : saveOk ? <><Check size={13} />Enregistré !</>
                  :           <><Save size={13} />Enregistrer</>}
                </button>
              </div>
            </div>

            <div style={{ padding: "20px" }}>

              {/* Titre */}
              <div style={{ marginBottom: 14 }}>
                <label className="field-label">Titre *</label>
                <input
                  className="field"
                  value={editing.title}
                  placeholder="Titre de l'article…"
                  style={{ fontSize: 16, fontWeight: 700 }}
                  onChange={(e) => {
                    const slug = isNew ? toSlug(e.target.value) : editing.slug;
                    setEditing({ ...editing, title: e.target.value, slug });
                  }}
                />
              </div>

              {/* Slug */}
              <div style={{ marginBottom: 14 }}>
                <label className="field-label">Slug (URL)</label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: "#9CA3AF" }}>/blog/</span>
                  <input
                    className="field"
                    value={editing.slug}
                    style={{ paddingLeft: 52, fontFamily: "monospace", fontSize: 13 }}
                    onChange={(e) => setEditing({ ...editing, slug: toSlug(e.target.value) })}
                  />
                </div>
              </div>

              {/* Excerpt */}
              <div style={{ marginBottom: 14 }}>
                <label className="field-label">Résumé (cards / SEO)</label>
                <textarea
                  className="field"
                  value={editing.excerpt || ""}
                  placeholder="Courte description affichée dans les cartes…"
                  rows={2}
                  onChange={(e) => setEditing({ ...editing, excerpt: e.target.value })}
                  style={{ resize: "vertical" }}
                />
              </div>

              {/* Cover image */}
              <div style={{ marginBottom: 14 }}>
                <ImageUploader
                  value={editing.cover_url || ""}
                  onChange={(url) => setEditing({ ...editing, cover_url: url })}
                  folder="blog"
                />
              </div>

              {/* Category + Read time */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 100px", gap: 10, marginBottom: 14 }}>
                <div>
                  <label className="field-label">Catégorie</label>
                  <select className="field" value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })}>
                    {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="field-label"><Clock size={10} style={{ display: "inline" }} /> Lecture</label>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <input
                      className="field"
                      type="number"
                      min={1}
                      max={60}
                      value={editing.read_time}
                      onChange={(e) => setEditing({ ...editing, read_time: parseInt(e.target.value) || 5 })}
                      style={{ textAlign: "center" }}
                    />
                    <span style={{ fontSize: 12, color: "#9CA3AF", whiteSpace: "nowrap" }}>min</span>
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div style={{ marginBottom: 14 }}>
                <label className="field-label">
                  <Tag size={10} style={{ display: "inline", marginRight: 3 }} />Tags
                </label>
                <div style={{ display: "flex", gap: 6 }}>
                  <input
                    className="field"
                    value={tagInput}
                    placeholder="Ajouter un tag…"
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                    style={{ flex: 1 }}
                  />
                  <button
                    onClick={addTag}
                    style={{ padding: "10px 14px", background: "#F3F4F6", border: "1.5px solid #E5E7EB", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
                  >+</button>
                </div>
                {editing.tags.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                    {editing.tags.map((t) => (
                      <span key={t} style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", background: "rgba(2,175,207,.1)", border: "1px solid rgba(2,175,207,.2)", borderRadius: 20, fontSize: 12, fontWeight: 600, color: "#02AFCF" }}>
                        {t}
                        <button onClick={() => removeTag(t)} style={{ background: "none", border: "none", cursor: "pointer", color: "#02AFCF", display: "flex", alignItems: "center", padding: 0 }}>
                          <X size={11} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Options : publish + featured + position */}
              <div style={{ background: "#F9FAFB", borderRadius: 14, padding: "14px 16px", marginBottom: 14, display: "flex", flexDirection: "column", gap: 12 }}>
                {[
                  { label: "Publié",   sub: "Visible sur le blog public",       key: "is_published" as keyof Post },
                  { label: "À la une", sub: "Mis en avant sur la homepage",     key: "is_featured"  as keyof Post },
                ].map((opt) => (
                  <div key={opt.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "#111827", margin: 0 }}>{opt.label}</p>
                      <p style={{ fontSize: 11, color: "#9CA3AF", margin: 0 }}>{opt.sub}</p>
                    </div>
                    <button
                      className="tog"
                      style={{ background: (editing[opt.key] as boolean) ? "#02AFCF" : "#E5E7EB" }}
                      onClick={() => setEditing({ ...editing, [opt.key]: !editing[opt.key] })}
                    >
                      <div className="tog-k" style={{ left: (editing[opt.key] as boolean) ? "23px" : "3px" }} />
                    </button>
                  </div>
                ))}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: "#111827", margin: 0 }}>Position</p>
                    <p style={{ fontSize: 11, color: "#9CA3AF", margin: 0 }}>Ordre d'affichage (plus bas = premier)</p>
                  </div>
                  <input
                    type="number"
                    className="field"
                    value={editing.position}
                    min={0}
                    onChange={(e) => setEditing({ ...editing, position: parseInt(e.target.value) || 0 })}
                    style={{ width: 70, textAlign: "center" }}
                  />
                </div>
              </div>

              {/* Auteur */}
              <div style={{ marginBottom: 16 }}>
                <label className="field-label">Nom de l'auteur</label>
                <input
                  className="field"
                  value={editing.author_name}
                  onChange={(e) => setEditing({ ...editing, author_name: e.target.value })}
                />
              </div>

              {/* WYSIWYG Content */}
              <div>
                <label className="field-label">
                  <Edit3 size={10} style={{ display: "inline", marginRight: 4 }} />Contenu (éditeur riche)
                </label>
                <Wysiwyg
                  value={editing.content || ""}
                  onChange={(html) => setEditing({ ...editing, content: html })}
                />
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
}