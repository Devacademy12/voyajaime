"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabaseClient";
import {
  Save, Eye, ChevronDown, ChevronUp, Check,
  Loader2, AlertCircle, LayoutTemplate, Type, BarChart2,
  Heart, Users, Megaphone, Edit3, Image as ImageIcon, RefreshCw,
  Bold, Italic, List, Link as LinkIcon, AlignLeft, AlignCenter,
  Quote, Heading1, Heading2, Minus, Trash2, Plus,
  Upload, X,
} from "lucide-react";

/* ══ TYPES ══ */
interface Section {
  id: string;
  section: string;
  title: string | null;
  subtitle: string | null;
  content: string | null;
  image_url: string | null;
  is_active: boolean;
  position: number;
  meta: Record<string, unknown>;
  updated_at: string;
}

/* ══ CONFIG SECTIONS ══ */
const SECTION_META: Record<string, {
  label: string;
  icon: React.ReactNode;
  color: string;
  bg: string;
  desc: string;
}> = {
  hero:    { label: "Hero",           icon: <LayoutTemplate size={15}/>, color: "#02AFCF", bg: "#E8F9FC", desc: "Bannière principale — titre, sous-titre, image de fond" },
  mission: { label: "Mission",        icon: <Type size={15}/>,           color: "#7C3AED", bg: "#F3F0FF", desc: "Bloc texte riche — mission et histoire" },
  stats:   { label: "Statistiques",   icon: <BarChart2 size={15}/>,      color: "#059669", bg: "#ECFDF5", desc: "Chiffres clés affichés en grille" },
  values:  { label: "Valeurs",        icon: <Heart size={15}/>,          color: "#E11D48", bg: "#FFF1F3", desc: "Valeurs de l'entreprise avec icônes" },
  team:    { label: "Équipe",         icon: <Users size={15}/>,          color: "#D97706", bg: "#FFFBEB", desc: "Membres de l'équipe avec photo et bio" },
  cta:     { label: "Appel à action", icon: <Megaphone size={15}/>,      color: "#053366", bg: "#EFF3FF", desc: "Section finale avec bouton d'action" },
};

const ICON_OPTIONS = ["heart","shield","globe","star","map","users","award","zap","compass","camera"];

/* ══ IMAGE UTILS ══ */
function fileToBase64(file: File, maxPx = 1200, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Lecture du fichier échouée"));
    reader.onload = (e) => {
      const src = e.target?.result as string;
      const img = new Image();
      img.onerror = () => reject(new Error("Image invalide"));
      img.onload = () => {
        let { width, height } = img;
        if (width > maxPx || height > maxPx) {
          if (width >= height) { height = Math.round((height * maxPx) / width); width = maxPx; }
          else { width = Math.round((width * maxPx) / height); height = maxPx; }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, width, height);
        const isTransparent = file.type === "image/png" || file.type === "image/gif";
        resolve(isTransparent ? canvas.toDataURL("image/png") : canvas.toDataURL("image/jpeg", quality));
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  });
}

function base64Size(b64: string): string {
  const bytes = Math.round((b64.length * 3) / 4);
  return bytes > 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
    : `${Math.round(bytes / 1024)} Ko`;
}

/* ══ STYLES ══ */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600;700;800&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'DM Sans', system-ui, sans-serif; background: #F0F2F8; }

  @keyframes spin    { to { transform: rotate(360deg); } }
  @keyframes fadeUp  { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes slideIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }

  .sec-card {
    background: white;
    border-radius: 16px;
    border: 1.5px solid #E8ECF4;
    overflow: hidden;
    transition: box-shadow .2s, border-color .2s;
    animation: fadeUp .22s ease both;
  }
  .sec-card:hover { box-shadow: 0 4px 20px rgba(5,51,102,.07); }
  .sec-card.inactive { opacity: .55; }
  .sec-card.open { border-color: #C7D2E8; box-shadow: 0 6px 28px rgba(5,51,102,.10); }

  /* ── Topbar ── */
  .topbar {
    background: white;
    border-bottom: 1px solid #E8ECF4;
    padding: 0 32px;
    height: 64px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    position: sticky;
    top: 0;
    z-index: 10;
    box-shadow: 0 1px 0 #E8ECF4;
  }

  .topbar-actions {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-shrink: 0;
  }

  .save-btn {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 10px 22px;
    background: linear-gradient(135deg, #02AFCF, #053366);
    color: white; border: none; border-radius: 12px;
    font-size: 13px; font-weight: 700; cursor: pointer;
    font-family: inherit; transition: all .2s;
    box-shadow: 0 4px 14px rgba(2,175,207,.28);
    white-space: nowrap;
  }
  .save-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(2,175,207,.38); }
  .save-btn:disabled { background: #E5E7EB; color: #9CA3AF; cursor: not-allowed; box-shadow: none; }
  .save-btn.ok { background: linear-gradient(135deg, #059669, #047857); box-shadow: 0 4px 14px rgba(5,150,105,.28); }

  .preview-btn {
    display: inline-flex; align-items: center; gap: 7px;
    padding: 10px 18px;
    background: #F4F6FB; border: 1.5px solid #E2E6F0;
    border-radius: 12px; font-size: 13px; font-weight: 600;
    color: #374151; cursor: pointer; font-family: inherit;
    text-decoration: none; transition: all .18s;
    white-space: nowrap;
  }
  .preview-btn:hover { background: #EBF0FA; border-color: #C7D2E8; }

  .icon-btn {
    display: inline-flex; align-items: center; justify-content: center;
    width: 32px; height: 32px; border-radius: 9px;
    border: 1.5px solid #E8ECF4; background: white;
    cursor: pointer; transition: all .15s; color: #6B7280;
    font-family: inherit;
  }
  .icon-btn:hover { background: #FEF2F2; border-color: #FCA5A5; color: #DC2626; }

  .add-btn {
    display: flex; align-items: center; justify-content: center; gap: 7px;
    width: 100%; padding: 9px;
    background: #F8FAFF; border: 1.5px dashed #C7D2E8;
    border-radius: 10px; font-size: 12px; font-weight: 700;
    color: #6B7280; cursor: pointer; font-family: inherit; transition: all .18s;
  }
  .add-btn:hover { border-color: #02AFCF; color: #02AFCF; background: #F0FAFF; }

  .field {
    width: 100%; padding: 10px 14px;
    border: 1.5px solid #E8ECF4; border-radius: 11px;
    font-size: 14px; font-family: inherit; color: #111827;
    background: white; outline: none; transition: border .18s, box-shadow .18s;
  }
  .field:focus { border-color: #02AFCF; box-shadow: 0 0 0 3px rgba(2,175,207,.10); }

  .meta-field {
    width: 100%; padding: 8px 11px;
    border: 1.5px solid #E8ECF4; border-radius: 9px;
    font-size: 13px; font-family: inherit; color: #111827;
    background: white; outline: none; transition: border .18s;
    resize: vertical;
  }
  .meta-field:focus { border-color: #02AFCF; }

  .field-label {
    display: block;
    font-size: 10.5px; font-weight: 800;
    color: #94A3B8; text-transform: uppercase; letter-spacing: .7px;
    margin-bottom: 6px;
  }

  .toggle {
    position: relative; width: 42px; height: 23px;
    border-radius: 12px; border: none; cursor: pointer;
    transition: background .2s; flex-shrink: 0;
  }
  .toggle-knob {
    position: absolute; top: 2.5px;
    width: 18px; height: 18px; border-radius: 50%;
    background: white; transition: left .2s;
    box-shadow: 0 1px 4px rgba(0,0,0,.22);
  }

  .wy-wrap { border: 1.5px solid #E8ECF4; border-radius: 12px; overflow: hidden; }
  .wy-wrap:focus-within { border-color: #02AFCF; box-shadow: 0 0 0 3px rgba(2,175,207,.10); }

  .wy-toolbar {
    display: flex; flex-wrap: wrap; gap: 3px;
    padding: 8px 10px;
    background: #F8FAFF; border-bottom: 1.5px solid #E8ECF4;
  }
  .wy-btn {
    display: flex; align-items: center; justify-content: center;
    width: 28px; height: 28px;
    border: 1px solid transparent; border-radius: 7px;
    background: none; cursor: pointer; color: #4B5563;
    font-size: 13px; font-weight: 700; font-family: inherit;
    transition: all .13s; flex-shrink: 0;
  }
  .wy-btn:hover  { background: #E8ECF4; border-color: #D1D5DB; }
  .wy-btn.active { background: #053366; color: white; border-color: #053366; }
  .wy-sep { width: 1px; height: 22px; background: #E8ECF4; margin: 0 2px; align-self: center; flex-shrink: 0; }

  .wy-editor {
    min-height: 160px; padding: 14px 16px;
    font-size: 14px; color: #111827; line-height: 1.8;
    outline: none; font-family: 'DM Sans', sans-serif;
  }
  .wy-editor:empty::before { content: attr(data-ph); color: #C4CAD4; pointer-events: none; }
  .wy-editor h1 { font-family: 'Playfair Display',serif; font-size:24px; font-weight:900; margin-bottom:10px; color:#053366; }
  .wy-editor h2 { font-family: 'Playfair Display',serif; font-size:18px; font-weight:700; margin-bottom:8px;  color:#053366; }
  .wy-editor p  { margin-bottom: 9px; }
  .wy-editor ul { padding-left:20px; margin-bottom:9px; }
  .wy-editor blockquote { border-left:3px solid #02AFCF; padding-left:13px; color:#6B7280; font-style:italic; margin:9px 0; }
  .wy-editor a  { color:#02AFCF; text-decoration:underline; }
  .wy-editor strong { font-weight:700; }
  .wy-editor em { font-style:italic; }
  .wy-editor hr { border:none; border-top:1px solid #E8ECF4; margin:13px 0; }

  .item-card {
    background: #F8FAFF; border-radius: 12px; padding: 14px;
    border: 1.5px solid #E8ECF4; margin-bottom: 10px;
    display: flex; flex-direction: column; gap: 10px;
    animation: slideIn .18s ease both;
  }

  .badge {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 3px 9px; border-radius: 20px;
    font-size: 11px; font-weight: 700;
  }

  .error-banner {
    display: flex; align-items: center; gap: 7px;
    padding: 8px 14px; background: #FEF2F2;
    border: 1.5px solid #FCA5A5; border-radius: 10px;
    font-size: 12px; color: #DC2626;
    max-width: 280px;
  }

  .icon-picker {
    display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px;
  }
  .icon-chip {
    padding: 4px 10px; border-radius: 8px;
    border: 1.5px solid #E8ECF4; background: white;
    font-size: 11px; font-weight: 700; cursor: pointer;
    color: #374151; font-family: inherit; transition: all .13s;
  }
  .icon-chip:hover    { border-color: #02AFCF; color: #02AFCF; }
  .icon-chip.selected { background: #053366; color: white; border-color: #053366; }

  /* ── Upload zone ── */
  .upload-zone {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 8px; padding: 20px; margin-top: 10px;
    border: 2px dashed #C7D2E8; border-radius: 12px;
    background: #F8FAFF; cursor: pointer; transition: all .18s;
    text-align: center;
  }
  .upload-zone:hover { border-color: #02AFCF; background: #F0FAFF; }
  .upload-zone.dragging { border-color: #02AFCF; background: #E8F9FC; }

  .img-preview {
    position: relative; margin-top: 10px;
    border-radius: 10px; overflow: hidden;
    border: 1.5px solid #E8ECF4; background: #F4F6FB;
  }
  .img-preview img { width: 100%; display: block; object-fit: cover; }
  .img-preview-remove {
    position: absolute; top: 7px; right: 7px;
    background: rgba(0,0,0,.55); border: none; border-radius: 8px;
    color: white; cursor: pointer; padding: 5px 8px;
    display: flex; align-items: center; gap: 4px;
    font-size: 11px; font-weight: 700; font-family: inherit;
    transition: background .15s;
  }
  .img-preview-remove:hover { background: rgba(220,38,38,.85); }

  .img-size-badge {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 2px 8px; background: #F0FDF4;
    border: 1px solid #BBF7D0; border-radius: 6px;
    font-size: 10px; font-weight: 700; color: #166534;
  }

  /* Grid CTA */
  .cta-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  /* Grid stats item */
  .stat-row-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    flex: 1;
  }

  /* Grid team member */
  .team-member-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }

  *::-webkit-scrollbar { width: 4px; }
  *::-webkit-scrollbar-thumb { background: #E2E6F0; border-radius: 2px; }

  /* ══════════════════════════════════════
     RESPONSIVE — TABLETTE (≤ 768px)
  ══════════════════════════════════════ */
  @media (max-width: 768px) {

    /* Topbar */
    .topbar {
      padding: 0 16px;
      height: auto;
      min-height: 64px;
      flex-wrap: wrap;
      gap: 8px;
      padding-top: 10px;
      padding-bottom: 10px;
    }

    .topbar-actions {
      gap: 8px;
    }

    /* Cacher le label "Voir la page" sur tablette */
    .preview-btn span { display: none; }
    .preview-btn { padding: 10px 12px; }

    /* Grille CTA — une colonne */
    .cta-grid {
      grid-template-columns: 1fr;
    }

    /* Grille stats — une colonne */
    .stat-row-grid {
      grid-template-columns: 1fr;
    }

    /* Grille team member — une colonne */
    .team-member-grid {
      grid-template-columns: 1fr;
    }

    /* Section card header — on réduit le padding */
    .sec-card-header {
      padding: 12px 14px !important;
    }

    /* Body section */
    .sec-card-body {
      padding: 0 14px 16px !important;
    }
  }

  /* ══════════════════════════════════════
     RESPONSIVE — MOBILE (≤ 480px)
  ══════════════════════════════════════ */
  @media (max-width: 480px) {

    /* Topbar compact */
    .topbar {
      padding: 8px 12px;
    }

    /* Titre topbar */
    .topbar-title h1 { font-size: 16px !important; }
    .topbar-title p  { display: none; }

    /* Bouton save : icône seule sur très petit écran */
    .save-btn-label { display: none; }
    .save-btn { padding: 10px 14px; }

    /* Content padding */
    .about-content {
      padding: 16px 12px 80px !important;
    }

    /* Section card — padding réduit */
    .sec-card-header {
      padding: 10px 12px !important;
      gap: 8px !important;
    }

    .sec-card-body {
      padding: 0 12px 14px !important;
    }

    /* Masquer description section sur mobile */
    .sec-desc { display: none; }

    /* Wysiwyg editor moins haut */
    .wy-editor { min-height: 120px; }

    /* Toolbar wysiwyg — plus petite */
    .wy-toolbar { padding: 6px 8px; gap: 2px; }
    .wy-btn { width: 26px; height: 26px; }

    /* Upload zone compact */
    .upload-zone { padding: 14px 12px; }

    /* Badge dans section card */
    .badge { font-size: 10px; padding: 2px 7px; }

    /* Error banner */
    .error-banner {
      font-size: 11px;
      padding: 6px 10px;
      max-width: 200px;
    }
  }

  /* ══════════════════════════════════════
     RESPONSIVE — TRÈS PETIT (≤ 360px)
  ══════════════════════════════════════ */
  @media (max-width: 360px) {
    .topbar-actions { gap: 6px; }
    .save-btn  { padding: 8px 12px; font-size: 12px; }
    .preview-btn { padding: 8px 10px; }
    .field { font-size: 13px; padding: 9px 12px; }
    .meta-field { font-size: 12px; }
  }
`;

/* ══ IMAGE UPLOAD FIELD ══ */
function ImageUploadField({
  value,
  onChange,
  label = "Image",
  maxHeight = 180,
}: {
  value: string | null;
  onChange: (v: string | null) => void;
  label?: string;
  maxHeight?: number;
}) {
  const [loading, setLoading]   = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isBase64 = (v: string) => v.startsWith("data:");

  const processFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Seules les images sont acceptées (jpg, png, gif, webp…)");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Fichier trop volumineux (max recommandé : 5 Mo). Compression en cours…");
    } else {
      setError(null);
    }
    setLoading(true);
    try {
      const b64 = await fileToBase64(file);
      onChange(b64);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur de conversion");
    } finally {
      setLoading(false);
    }
  };

  const handleFiles = (files: FileList | null) => {
    if (files && files[0]) processFile(files[0]);
  };

  return (
    <div>
      <label className="field-label" style={{ display: "flex", alignItems: "center", gap: 5 }}>
        <ImageIcon size={10} /> {label}
      </label>

      <input
        className="field"
        value={value && !isBase64(value) ? value : ""}
        placeholder="https://example.com/image.jpg  (ou glissez / chargez une image ci-dessous)"
        onChange={e => onChange(e.target.value || null)}
      />

      {!value && (
        <div
          className={`upload-zone ${dragging ? "dragging" : ""}`}
          onClick={() => inputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
        >
          {loading
            ? <>
                <Loader2 size={20} style={{ animation: "spin .8s linear infinite", color: "#02AFCF" }} />
                <span style={{ fontSize: 12, color: "#6B7280" }}>Compression en cours…</span>
              </>
            : <>
                <Upload size={20} style={{ color: "#02AFCF" }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>
                  Glissez une image ou cliquez pour choisir
                </span>
                <span style={{ fontSize: 11, color: "#9CA3AF" }}>
                  JPG, PNG, GIF, WebP — compressée automatiquement
                </span>
              </>
          }
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={e => handleFiles(e.target.files)}
      />

      {error && (
        <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#DC2626" }}>
          <AlertCircle size={12} /> {error}
        </div>
      )}

      {value && !loading && (
        <div className="img-preview" style={{ maxHeight }}>
          <img
            src={value}
            alt="Aperçu"
            style={{ maxHeight }}
            onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
          <div style={{ position: "absolute", bottom: 7, left: 7, display: "flex", gap: 6, alignItems: "center" }}>
            {isBase64(value) && (
              <span className="img-size-badge">✓ locale · {base64Size(value)}</span>
            )}
            {!isBase64(value) && (value.startsWith("http") || value.startsWith("/")) && (
              <span className="img-size-badge" style={{ background: "#EFF6FF", borderColor: "#BFDBFE", color: "#1D4ED8" }}>
                🔗 URL externe
              </span>
            )}
          </div>
          <button className="img-preview-remove" onClick={() => { onChange(null); setError(null); }}>
            <X size={11} /> Supprimer
          </button>
        </div>
      )}

      {value && !loading && (
        <button
          style={{
            marginTop: 8, display: "inline-flex", alignItems: "center", gap: 6,
            padding: "7px 14px", fontSize: 12, fontWeight: 600,
            background: "#F3F4F6", border: "1px solid #D1D5DB",
            borderRadius: 8, cursor: "pointer", color: "#374151", fontFamily: "inherit",
          }}
          onClick={() => inputRef.current?.click()}
        >
          <Upload size={11} /> Changer l'image
        </button>
      )}
    </div>
  );
}

/* ══ WYSIWYG EDITOR ══ */
function WysiwygEditor({ value, onChange, placeholder = "Commencez à écrire…" }: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const skipNextSync = useRef(false);

  useEffect(() => {
    if (ref.current && !skipNextSync.current) {
      ref.current.innerHTML = value || "";
    }
    skipNextSync.current = false;
  }, [value]);

  const exec = (cmd: string, val?: string) => {
    document.execCommand(cmd, false, val);
    ref.current?.focus();
    if (ref.current) { skipNextSync.current = true; onChange(ref.current.innerHTML); }
  };

  const isActive = (cmd: string) => {
    try { return document.queryCommandState(cmd); } catch { return false; }
  };

  const insertLink = () => {
    const url = prompt("URL du lien :", "https://");
    if (url) exec("createLink", url);
  };

  type Tool = { icon: React.ReactNode; cmd: string; val?: string; title: string };
  const TOOLS: Array<Tool | "sep"> = [
    { icon: <Bold size={12}/>,      cmd: "bold",                         title: "Gras" },
    { icon: <Italic size={12}/>,    cmd: "italic",                       title: "Italique" },
    "sep",
    { icon: <Heading1 size={12}/>,  cmd: "formatBlock",    val: "h1",    title: "Titre 1" },
    { icon: <Heading2 size={12}/>,  cmd: "formatBlock",    val: "h2",    title: "Titre 2" },
    { icon: <AlignLeft size={12}/>, cmd: "formatBlock",    val: "p",     title: "Paragraphe" },
    "sep",
    { icon: <List size={12}/>,      cmd: "insertUnorderedList",          title: "Liste" },
    { icon: <Quote size={12}/>,     cmd: "formatBlock",    val: "blockquote", title: "Citation" },
    { icon: <Minus size={12}/>,     cmd: "insertHorizontalRule",         title: "Séparateur" },
    "sep",
    { icon: <AlignCenter size={12}/>, cmd: "justifyCenter",              title: "Centrer" },
    { icon: <LinkIcon size={12}/>,  cmd: "__link__",                     title: "Lien" },
    "sep",
    { icon: <RefreshCw size={10}/>, cmd: "removeFormat",                 title: "Effacer le format" },
  ];

  return (
    <div className="wy-wrap">
      <div className="wy-toolbar">
        {TOOLS.map((t, i) =>
          t === "sep"
            ? <div key={i} className="wy-sep" />
            : <button
                key={i} type="button" title={t.title}
                className={`wy-btn ${isActive(t.cmd) ? "active" : ""}`}
                onMouseDown={e => {
                  e.preventDefault();
                  if (t.cmd === "__link__") insertLink();
                  else exec(t.cmd, t.val);
                }}
              >{t.icon}</button>
        )}
      </div>
      <div
        ref={ref}
        className="wy-editor"
        contentEditable
        suppressContentEditableWarning
        data-ph={placeholder}
        onInput={() => {
          if (ref.current) { skipNextSync.current = true; onChange(ref.current.innerHTML); }
        }}
      />
    </div>
  );
}

/* ══ SECTION CARD ══ */
function SectionCard({ sec, onUpdate }: { sec: Section; onUpdate: (s: Section) => void }) {
  const [open, setOpen] = useState(false);
  const info = SECTION_META[sec.section];
  const meta = sec.meta ?? {};

  const upd     = (p: Partial<Section>) => onUpdate({ ...sec, ...p });
  const updMeta = (p: Record<string, unknown>) => onUpdate({ ...sec, meta: { ...meta, ...p } });

  type StatItem   = { value: string; label: string };
  type ValueItem  = { icon: string; title: string; text: string };
  type TeamMember = { name: string; role: string; photo: string; bio: string };

  const statItems:   StatItem[]   = (meta.items   as StatItem[]   | undefined) ?? [];
  const valueItems:  ValueItem[]  = (meta.items   as ValueItem[]  | undefined) ?? [];
  const teamMembers: TeamMember[] = (meta.members as TeamMember[] | undefined) ?? [];

  return (
    <div className={`sec-card ${!sec.is_active ? "inactive" : ""} ${open ? "open" : ""}`}>

      {/* ── Header ── */}
      <div
        className="sec-card-header"
        style={{ display:"flex", alignItems:"center", gap:12, padding:"14px 18px", cursor:"pointer", userSelect:"none" }}
        onClick={() => setOpen(o => !o)}
      >
        <div style={{ width:38, height:38, borderRadius:11, background:info?.bg, display:"flex", alignItems:"center", justifyContent:"center", color:info?.color, flexShrink:0 }}>
          {info?.icon}
        </div>

        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
            <span style={{ fontSize:14, fontWeight:800, color:"#111827" }}>{info?.label ?? sec.section}</span>
            <span
              className="badge"
              style={{ background: sec.is_active ? `${info?.color}15` : "#F3F4F6", color: sec.is_active ? info?.color : "#9CA3AF" }}
            >
              {sec.is_active ? "Actif" : "Masqué"}
            </span>
            {sec.title && (
              <span style={{ fontSize:12, color:"#9CA3AF", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:200 }}>
                — {sec.title}
              </span>
            )}
          </div>
          <p className="sec-desc" style={{ fontSize:11.5, color:"#9CA3AF", marginTop:2 }}>{info?.desc}</p>
        </div>

        <div style={{ display:"flex", alignItems:"center", gap:10, flexShrink:0 }}>
          <button
            className="toggle"
            style={{ background: sec.is_active ? "#02AFCF" : "#E5E7EB" }}
            onClick={e => { e.stopPropagation(); upd({ is_active: !sec.is_active }); }}
            title={sec.is_active ? "Masquer" : "Activer"}
          >
            <div className="toggle-knob" style={{ left: sec.is_active ? "21px" : "2.5px" }} />
          </button>
          <div style={{ color:"#C4CAD4" }}>
            {open ? <ChevronUp size={15}/> : <ChevronDown size={15}/>}
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      {open && (
        <div
          className="sec-card-body"
          style={{ padding:"0 20px 20px", borderTop:"1.5px solid #F4F6FB", display:"flex", flexDirection:"column", gap:18 }}
        >
          <div style={{ height:6 }}/>

          <div>
            <label className="field-label">Titre</label>
            <input
              className="field"
              value={sec.title ?? ""}
              placeholder="Titre de la section…"
              onChange={e => upd({ title: e.target.value })}
            />
          </div>

          <div>
            <label className="field-label">Sous-titre</label>
            <input
              className="field"
              value={sec.subtitle ?? ""}
              placeholder="Sous-titre optionnel…"
              onChange={e => upd({ subtitle: e.target.value })}
            />
          </div>

          {["hero", "team"].includes(sec.section) && (
            <ImageUploadField
              value={sec.image_url}
              onChange={v => upd({ image_url: v })}
              label={sec.section === "hero" ? "Image de fond (Hero)" : "Image de l'équipe"}
              maxHeight={sec.section === "hero" ? 200 : 140}
            />
          )}

          {["hero","mission","team","cta"].includes(sec.section) && (
            <div>
              <label className="field-label" style={{ display:"flex", alignItems:"center", gap:5 }}>
                <Edit3 size={10}/> Contenu (éditeur riche)
              </label>
              <WysiwygEditor
                value={sec.content ?? ""}
                onChange={html => upd({ content: html })}
                placeholder="Rédigez le contenu de cette section…"
              />
            </div>
          )}

          {/* ── Stats ── */}
          {sec.section === "stats" && (
            <div>
              <label className="field-label">Statistiques</label>
              {statItems.map((item, i) => (
                <div key={i} className="item-card" style={{ flexDirection:"row", gap:10, alignItems:"center" }}>
                  <div className="stat-row-grid">
                    <input
                      className="meta-field"
                      value={item.value}
                      placeholder="Valeur (ex : 500+)"
                      onChange={e => {
                        const items = [...statItems];
                        items[i] = { ...items[i], value: e.target.value };
                        updMeta({ items });
                      }}
                    />
                    <input
                      className="meta-field"
                      value={item.label}
                      placeholder="Label (ex : Excursions)"
                      onChange={e => {
                        const items = [...statItems];
                        items[i] = { ...items[i], label: e.target.value };
                        updMeta({ items });
                      }}
                    />
                  </div>
                  <button
                    className="icon-btn"
                    title="Supprimer"
                    onClick={() => updMeta({ items: statItems.filter((_,j) => j !== i) })}
                  ><Trash2 size={13}/></button>
                </div>
              ))}
              <button
                className="add-btn"
                onClick={() => updMeta({ items: [...statItems, { value:"", label:"" }] })}
              >
                <Plus size={13}/> Ajouter une statistique
              </button>
            </div>
          )}

          {/* ── Values ── */}
          {sec.section === "values" && (
            <div>
              <label className="field-label">Valeurs</label>
              {valueItems.map((item, i) => (
                <div key={i} className="item-card">
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <span style={{ fontSize:11, fontWeight:700, color:"#9CA3AF" }}>Valeur {i+1}</span>
                    <button
                      className="icon-btn"
                      title="Supprimer"
                      onClick={() => updMeta({ items: valueItems.filter((_,j) => j !== i) })}
                    ><Trash2 size={13}/></button>
                  </div>
                  <input
                    className="meta-field"
                    value={item.title}
                    placeholder="Titre de la valeur…"
                    onChange={e => {
                      const items = [...valueItems];
                      items[i] = { ...items[i], title: e.target.value };
                      updMeta({ items });
                    }}
                  />
                  <textarea
                    className="meta-field"
                    value={item.text}
                    placeholder="Description de la valeur…"
                    rows={2}
                    onChange={e => {
                      const items = [...valueItems];
                      items[i] = { ...items[i], text: e.target.value };
                      updMeta({ items });
                    }}
                  />
                  <div>
                    <p style={{ fontSize:10.5, fontWeight:700, color:"#9CA3AF", textTransform:"uppercase", letterSpacing:".5px", marginBottom:6 }}>Icône</p>
                    <div className="icon-picker">
                      {ICON_OPTIONS.map(ic => (
                        <button
                          key={ic}
                          className={`icon-chip ${item.icon === ic ? "selected" : ""}`}
                          onClick={() => {
                            const items = [...valueItems];
                            items[i] = { ...items[i], icon: ic };
                            updMeta({ items });
                          }}
                        >{ic}</button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
              <button
                className="add-btn"
                onClick={() => updMeta({ items: [...valueItems, { icon:"star", title:"", text:"" }] })}
              >
                <Plus size={13}/> Ajouter une valeur
              </button>
            </div>
          )}

          {/* ── Team ── */}
          {sec.section === "team" && (
            <div>
              <label className="field-label">Membres de l'équipe</label>
              {teamMembers.map((m, i) => (
                <div key={i} className="item-card">
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <span style={{ fontSize:11, fontWeight:700, color:"#9CA3AF" }}>
                      {m.name || `Membre ${i+1}`}
                    </span>
                    <button
                      className="icon-btn"
                      title="Supprimer"
                      onClick={() => updMeta({ members: teamMembers.filter((_,j) => j !== i) })}
                    ><Trash2 size={13}/></button>
                  </div>

                  <div className="team-member-grid">
                    <input
                      className="meta-field"
                      value={m.name}
                      placeholder="Nom complet"
                      onChange={e => {
                        const members = [...teamMembers];
                        members[i] = { ...members[i], name: e.target.value };
                        updMeta({ members });
                      }}
                    />
                    <input
                      className="meta-field"
                      value={m.role}
                      placeholder="Rôle / Poste"
                      onChange={e => {
                        const members = [...teamMembers];
                        members[i] = { ...members[i], role: e.target.value };
                        updMeta({ members });
                      }}
                    />
                  </div>

                  <ImageUploadField
                    value={m.photo || null}
                    onChange={v => {
                      const members = [...teamMembers];
                      members[i] = { ...members[i], photo: v ?? "" };
                      updMeta({ members });
                    }}
                    label="Photo du membre"
                    maxHeight={80}
                  />

                  <textarea
                    className="meta-field"
                    value={m.bio}
                    placeholder="Biographie courte…"
                    rows={2}
                    onChange={e => {
                      const members = [...teamMembers];
                      members[i] = { ...members[i], bio: e.target.value };
                      updMeta({ members });
                    }}
                  />
                </div>
              ))}
              <button
                className="add-btn"
                onClick={() => updMeta({ members: [...teamMembers, { name:"", role:"", photo:"", bio:"" }] })}
              >
                <Plus size={13}/> Ajouter un membre
              </button>
            </div>
          )}

          {/* ── CTA ── */}
          {sec.section === "cta" && (
            <div className="cta-grid">
              <div>
                <label className="field-label">Texte du bouton</label>
                <input
                  className="meta-field"
                  value={(meta.button_text as string) ?? ""}
                  placeholder="Commencer l'aventure…"
                  onChange={e => updMeta({ button_text: e.target.value })}
                />
              </div>
              <div>
                <label className="field-label">URL du bouton</label>
                <input
                  className="meta-field"
                  value={(meta.button_url as string) ?? ""}
                  placeholder="/excursions"
                  onChange={e => updMeta({ button_url: e.target.value })}
                />
              </div>
            </div>
          )}

          <p style={{ fontSize:11, color:"#C4CAD4", textAlign:"right" }}>
            Modifié le {new Date(sec.updated_at).toLocaleDateString("fr-FR", { day:"numeric", month:"long", year:"numeric", hour:"2-digit", minute:"2-digit" })}
          </p>
        </div>
      )}
    </div>
  );
}

/* ══ MAIN PAGE ══ */
export default function AboutAdminClient({ initialSections }: { initialSections: Section[] }) {
  const sb = createClient();
  const [sections,  setSections]  = useState<Section[]>(initialSections);
  const [saving,    setSaving]    = useState(false);
  const [saveOk,    setSaveOk]    = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const updateSection = (updated: Section) =>
    setSections(prev => prev.map(s => s.id === updated.id ? updated : s));

  const saveAll = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      for (const sec of sections) {
        const { error } = await sb.from("about_content").update({
          title:      sec.title,
          subtitle:   sec.subtitle,
          content:    sec.content,
          image_url:  sec.image_url,
          is_active:  sec.is_active,
          meta:       sec.meta,
          updated_at: new Date().toISOString(),
        }).eq("id", sec.id);

        if (error) throw new Error(`Section "${sec.section}" : ${error.message}`);
      }
      setSaveOk(true);
      setTimeout(() => setSaveOk(false), 2800);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setSaving(false);
    }
  };

  const activeSections = sections.filter(s => s.is_active).length;

  return (
    <div style={{ fontFamily:"'DM Sans',system-ui,sans-serif", background:"#F0F2F8", minHeight:"100vh" }}>
      <style>{CSS}</style>

      {/* ── Topbar ── */}
      <div className="topbar">
        <div className="topbar-title">
          <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:20, fontWeight:900, color:"#053366", lineHeight:1 }}>
            Page À propos
          </h1>
          <p style={{ fontSize:11.5, color:"#94A3B8", marginTop:3 }}>
            {activeSections} section{activeSections !== 1 ? "s" : ""} active{activeSections !== 1 ? "s" : ""}
            {" · "}{sections.length} au total
          </p>
        </div>

        <div className="topbar-actions">
          {saveError && (
            <div className="error-banner">
              <AlertCircle size={13}/> {saveError}
            </div>
          )}

          <a href="/about" target="_blank" rel="noopener" className="preview-btn">
            <Eye size={13}/> <span>Voir la page</span>
          </a>

          <button
            className={`save-btn ${saveOk ? "ok" : ""}`}
            onClick={saveAll}
            disabled={saving || saveOk}
          >
            {saving
              ? <><Loader2 size={13} style={{ animation:"spin .7s linear infinite" }}/> <span className="save-btn-label">Enregistrement…</span></>
              : saveOk
                ? <><Check size={13}/> <span className="save-btn-label">Enregistré !</span></>
                : <><Save size={13}/> <span className="save-btn-label">Enregistrer tout</span></>}
          </button>
        </div>
      </div>

      {/* ── Content ── */}
      <div
        className="about-content"
        style={{ maxWidth:820, margin:"0 auto", padding:"28px 24px 100px", display:"flex", flexDirection:"column", gap:10 }}
      >
        {sections.length === 0 && (
          <div style={{ textAlign:"center", padding:"80px 20px", color:"#94A3B8" }}>
            <LayoutTemplate size={40} style={{ margin:"0 auto 16px", opacity:.4 }}/>
            <p style={{ fontSize:14, fontWeight:600 }}>Aucune section trouvée</p>
            <p style={{ fontSize:12, marginTop:6 }}>Exécutez la migration SQL pour initialiser les sections.</p>
          </div>
        )}

        {sections.map(sec => (
          <SectionCard key={sec.id} sec={sec} onUpdate={updateSection} />
        ))}
      </div>
    </div>
  );
}