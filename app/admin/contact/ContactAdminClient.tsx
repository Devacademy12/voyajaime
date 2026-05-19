"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabaseClient";
import {
  Save, Check, Loader2, AlertCircle, Mail, Phone,
  MapPin, Clock, Eye, MessageSquare, Image as ImageIcon,
  ChevronDown, ChevronUp, Trash2, MailOpen, RefreshCw,
  Upload, X, FolderOpen,
} from "lucide-react";

/* ══ TYPES ══ */
interface ContentRow { id: string; key: string; value: string | null; updated_at: string; }
interface Message    { id: string; name: string; email: string; subject: string | null; message: string; is_read: boolean; created_at: string; }

/* ══ CHAMPS ÉDITABLES ══ */
const FIELDS: { key: string; label: string; icon: React.ReactNode; placeholder: string; multiline?: boolean; isImage?: boolean }[] = [
  { key:"hero_title",    label:"Titre principal",    icon:<MessageSquare size={14}/>, placeholder:"Contactez-nous" },
  { key:"hero_subtitle", label:"Sous-titre",         icon:<MessageSquare size={14}/>, placeholder:"Votre message…", multiline:true },
  { key:"bg_image",      label:"Image de fond",      icon:<ImageIcon size={14}/>,     placeholder:"https://…", isImage:true },
  { key:"email",         label:"Email",              icon:<Mail size={14}/>,          placeholder:"contact@voyajaime.tn" },
  { key:"phone",         label:"Téléphone",          icon:<Phone size={14}/>,         placeholder:"+216 XX XXX XXX" },
  { key:"address",       label:"Adresse",            icon:<MapPin size={14}/>,        placeholder:"Tunis, Tunisie" },
  { key:"hours",         label:"Horaires",           icon:<Clock size={14}/>,         placeholder:"Lun–Ven : 9h–18h" },
  { key:"cta_label",     label:"Texte du bouton CTA",icon:<MessageSquare size={14}/>, placeholder:"Envoyer le message" },
  { key:"success_msg",   label:"Message de succès",  icon:<Check size={14}/>,         placeholder:"Message envoyé !", multiline:true },
];

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600;700;800&display=swap');
  *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
  body { font-family:'DM Sans',system-ui,sans-serif; background:#F0F2F8; }

  @keyframes spin   { to { transform:rotate(360deg); } }
  @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }

  /* ── Topbar ── */
  .topbar {
    background:white; border-bottom:1px solid #E8ECF4;
    padding:0 32px; height:64px;
    display:flex; justify-content:space-between; align-items:center;
    position:sticky; top:0; z-index:10;
  }

  .topbar-actions {
    display:flex; align-items:center; gap:10px; flex-shrink:0;
  }

  .tab-btn {
    padding:8px 18px; border-radius:10px; border:none;
    font-size:13px; font-weight:700; font-family:inherit;
    cursor:pointer; transition:all .18s;
  }
  .tab-btn.active { background:#053366; color:white; }
  .tab-btn.idle   { background:#F4F6FB; color:#6B7280; }
  .tab-btn.idle:hover { background:#EBF0FA; color:#374151; }

  .save-btn {
    display:inline-flex; align-items:center; gap:7px;
    padding:10px 22px; background:linear-gradient(135deg,#02AFCF,#053366);
    color:white; border:none; border-radius:12px;
    font-size:13px; font-weight:700; cursor:pointer;
    font-family:inherit; transition:all .2s;
    box-shadow:0 4px 14px rgba(2,175,207,.28);
    white-space:nowrap;
  }
  .save-btn:hover:not(:disabled) { transform:translateY(-1px); }
  .save-btn:disabled { background:#E5E7EB; color:#9CA3AF; cursor:not-allowed; box-shadow:none; }
  .save-btn.ok { background:linear-gradient(135deg,#059669,#047857); }

  .preview-link {
    display:inline-flex; align-items:center; gap:7px;
    padding:10px 18px; background:#F4F6FB;
    border:1.5px solid #E2E6F0; border-radius:12px;
    font-size:13px; font-weight:600; color:#374151;
    text-decoration:none; white-space:nowrap; transition:all .18s;
  }
  .preview-link:hover { background:#EBF0FA; border-color:#C7D2E8; }

  .error-banner {
    display:flex; align-items:center; gap:7px;
    padding:8px 13px; background:#FEF2F2;
    border:1.5px solid #FCA5A5; border-radius:10px;
    font-size:12px; color:#DC2626; max-width:260px;
  }

  .card {
    background:white; border-radius:14px; border:1.5px solid #E8ECF4;
    overflow:hidden; animation:fadeUp .22s ease both;
  }

  .field {
    width:100%; padding:10px 14px;
    background:white; border:1.5px solid #E8ECF4;
    border-radius:10px; font-size:14px; font-family:inherit;
    color:#111827; outline:none; transition:border .18s, box-shadow .18s;
    resize:vertical;
  }
  .field:focus { border-color:#02AFCF; box-shadow:0 0 0 3px rgba(2,175,207,.09); }

  .label {
    display:block; font-size:10.5px; font-weight:800;
    color:#94A3B8; text-transform:uppercase; letter-spacing:.7px; margin-bottom:6px;
  }

  /* ── Upload zone ── */
  .upload-zone {
    border:2px dashed #D1D5DB; border-radius:12px; padding:20px;
    display:flex; flex-direction:column; align-items:center; gap:10px;
    cursor:pointer; transition:all .2s; background:#F9FAFB; text-align:center;
  }
  .upload-zone:hover  { border-color:#02AFCF; background:#F0FAFF; }
  .upload-zone.dragging { border-color:#02AFCF; background:#E8F9FC; }

  .upload-btn {
    display:inline-flex; align-items:center; gap:7px;
    padding:8px 16px; background:#053366; color:white;
    border:none; border-radius:9px;
    font-size:12px; font-weight:700; cursor:pointer;
    font-family:inherit; transition:all .18s;
  }
  .upload-btn:hover    { background:#02265a; }
  .upload-btn:disabled { background:#9CA3AF; cursor:not-allowed; }

  .img-preview {
    position:relative; margin-top:10px;
    border-radius:10px; overflow:hidden; border:1.5px solid #E8ECF4;
  }
  .img-preview-del {
    position:absolute; top:6px; right:6px;
    width:26px; height:26px; border-radius:50%;
    background:rgba(0,0,0,.55); border:none; cursor:pointer;
    display:flex; align-items:center; justify-content:center;
    color:white; transition:background .15s;
  }
  .img-preview-del:hover { background:rgba(220,38,38,.8); }

  .upload-progress {
    height:4px; border-radius:2px; background:#E5E7EB; overflow:hidden; margin-top:6px;
  }
  .upload-progress-bar {
    height:100%; background:linear-gradient(90deg,#02AFCF,#053366);
    border-radius:2px; transition:width .3s ease;
  }

  /* Messages */
  .msg-row {
    display:flex; gap:16px; padding:18px 20px;
    border-bottom:1px solid #F3F4F6; transition:background .15s; cursor:pointer;
  }
  .msg-row:last-child { border-bottom:none; }
  .msg-row:hover { background:#F8FAFF; }
  .msg-row.unread { background:#FAFEFF; }

  .msg-detail {
    padding:20px 24px; background:#F8FAFF;
    border-top:1.5px solid #E8ECF4; animation:fadeUp .18s ease both;
  }

  .badge {
    display:inline-flex; align-items:center; gap:4px;
    padding:2px 8px; border-radius:20px; font-size:10px; font-weight:800;
  }

  .icon-btn {
    display:inline-flex; align-items:center; justify-content:center;
    width:30px; height:30px; border-radius:8px;
    border:1.5px solid #E8ECF4; background:white;
    cursor:pointer; transition:all .15s; color:#6B7280; font-family:inherit;
  }
  .icon-btn:hover { background:#FEF2F2; border-color:#FCA5A5; color:#DC2626; }
  .icon-btn.read-btn:hover { background:#EFF6FF; border-color:#BFDBFE; color:#3B82F6; }

  *::-webkit-scrollbar { width:4px; }
  *::-webkit-scrollbar-thumb { background:#E2E6F0; border-radius:2px; }

  /* ══════════════════════════════════════
     RESPONSIVE — TABLETTE (≤ 768px)
  ══════════════════════════════════════ */
  @media (max-width: 768px) {

    .topbar {
      padding: 0 16px;
      height: auto;
      min-height: 64px;
      flex-wrap: wrap;
      gap: 8px;
      padding-top: 10px;
      padding-bottom: 10px;
    }

    .topbar-actions { gap: 8px; }

    /* Cacher label "Voir la page" — icône seule */
    .preview-label { display: none; }
    .preview-link  { padding: 10px 12px; }

    /* Tabs : pleine largeur */
    .tabs-row {
      padding: 16px 16px 0 !important;
    }

    /* Content padding */
    .page-content {
      padding: 14px 16px 80px !important;
    }

    /* Card padding réduit */
    .card-inner {
      padding: 14px 16px !important;
    }

    /* Message row — gap réduit */
    .msg-row { gap: 10px; padding: 14px 14px; }

    /* Message detail */
    .msg-detail { padding: 16px 14px; }
  }

  /* ══════════════════════════════════════
     RESPONSIVE — MOBILE (≤ 480px)
  ══════════════════════════════════════ */
  @media (max-width: 480px) {

    /* Topbar */
    .topbar { padding: 8px 12px; }

    /* Titre topbar */
    .topbar-title h1  { font-size: 16px !important; }
    .topbar-title p   { display: none; }

    /* Bouton save : icône seule */
    .save-btn-label { display: none; }
    .save-btn { padding: 10px 14px; }

    /* Tabs scroll horizontal */
    .tabs-row {
      padding: 12px 12px 0 !important;
      overflow-x: auto;
    }
    .tabs-row > div {
      flex-wrap: nowrap !important;
      min-width: max-content;
    }

    .tab-btn { padding: 7px 14px; font-size: 12px; }

    /* Content */
    .page-content { padding: 12px 12px 80px !important; }

    /* Card */
    .card-inner { padding: 12px 14px !important; }

    /* Erreur */
    .error-banner { max-width: 180px; font-size: 11px; padding: 6px 10px; }

    /* Champs */
    .field { font-size: 13px; padding: 9px 12px; }

    /* Upload zone compact */
    .upload-zone { padding: 14px 12px; }

    /* Message row mobile */
    .msg-row { padding: 12px 12px; gap: 8px; }

    /* Masquer subject sur mobile (évite overflow) */
    .msg-subject { display: none; }

    /* Actions messages */
    .msg-actions { gap: 4px !important; }

    /* Message detail */
    .msg-detail { padding: 14px 12px; }

    /* Répondre btn */
    .reply-btn { padding: 8px 14px !important; font-size: 12px !important; }

    /* Refresh btn */
    .refresh-btn-label { display: none; }
    .refresh-row { gap: 8px !important; }
  }

  /* ══════════════════════════════════════
     RESPONSIVE — TRÈS PETIT (≤ 360px)
  ══════════════════════════════════════ */
  @media (max-width: 360px) {
    .topbar-actions { gap: 5px; }
    .save-btn  { padding: 8px 11px; }
    .tab-btn   { padding: 6px 11px; font-size: 11px; }
    .field     { font-size: 12px; }
    .msg-row   { padding: 10px; gap: 7px; }
  }
`;

/* ══ IMAGE UPLOADER ══ */
function ImageUploader({
  value,
  onChange,
}: {
  value: string;
  onChange: (url: string) => void;
}) {
  const sb          = createClient();
  const fileRef     = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress,  setProgress]  = useState(0);
  const [error,     setError]     = useState<string | null>(null);
  const [dragging,  setDragging]  = useState(false);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Seules les images sont acceptées (JPG, PNG, WebP…)");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("L'image ne doit pas dépasser 5 Mo.");
      return;
    }

    setUploading(true); setError(null); setProgress(10);

    try {
      const ext      = file.name.split(".").pop() ?? "jpg";
      const filename = `contact-bg-${Date.now()}.${ext}`;
      const path     = `contact/${filename}`;

      setProgress(40);

      const { error: upErr } = await sb.storage
        .from("images")
        .upload(path, file, { cacheControl: "3600", upsert: true });

      if (upErr) throw upErr;

      setProgress(80);

      const { data: urlData } = sb.storage.from("images").getPublicUrl(path);
      setProgress(100);
      onChange(urlData.publicUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Échec de l'upload.");
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 800);
    }
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const clearImage = () => {
    onChange("");
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div>
      <div
        className={`upload-zone ${dragging ? "dragging" : ""}`}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => fileRef.current?.click()}
      >
        {uploading
          ? <Loader2 size={24} color="#02AFCF" style={{ animation:"spin .7s linear infinite" }}/>
          : <Upload size={24} color="#9CA3AF"/>}

        <p style={{ fontSize:13, fontWeight:600, color:"#374151" }}>
          {dragging ? "Déposez l'image ici" : "Glissez-déposez une image"}
        </p>
        <p style={{ fontSize:11, color:"#9CA3AF" }}>JPG, PNG, WebP — max 5 Mo</p>

        <button
          className="upload-btn"
          type="button"
          disabled={uploading}
          onClick={e => { e.stopPropagation(); fileRef.current?.click(); }}
        >
          <FolderOpen size={13}/>
          {uploading ? "Upload en cours…" : "Choisir depuis le PC"}
        </button>
      </div>

      {progress > 0 && (
        <div className="upload-progress">
          <div className="upload-progress-bar" style={{ width:`${progress}%` }}/>
        </div>
      )}

      {error && (
        <p style={{ marginTop:8, fontSize:12, color:"#DC2626", display:"flex", alignItems:"center", gap:5 }}>
          <AlertCircle size={12}/> {error}
        </p>
      )}

      <div style={{ display:"flex", alignItems:"center", gap:8, margin:"10px 0 6px" }}>
        <div style={{ flex:1, height:1, background:"#E8ECF4" }}/>
        <span style={{ fontSize:11, color:"#9CA3AF", fontWeight:600 }}>ou entrer une URL</span>
        <div style={{ flex:1, height:1, background:"#E8ECF4" }}/>
      </div>
      <input
        className="field"
        value={value}
        placeholder="https://example.com/image.jpg"
        onChange={e => onChange(e.target.value)}
      />

      {value && (
        <div className="img-preview" style={{ marginTop:10, height:140 }}>
          <img
            src={value} alt="Aperçu image de fond"
            style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }}
            onError={e => { (e.target as HTMLImageElement).style.display="none"; }}
          />
          <button className="img-preview-del" type="button" onClick={clearImage} title="Supprimer l'image">
            <X size={13}/>
          </button>
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        style={{ display:"none" }}
        onChange={onInputChange}
      />
    </div>
  );
}

/* ══ PAGE ADMIN PRINCIPALE ══ */
export default function ContactAdminClient({
  initialContent,
  initialMessages,
}: {
  initialContent:  ContentRow[];
  initialMessages: Message[];
}) {
  const sb = createClient();

  const [tab,        setTab]        = useState<"content"|"messages">("content");
  const [content,    setContent]    = useState<Record<string, string>>(
    Object.fromEntries(initialContent.map(r => [r.key, r.value ?? ""]))
  );
  const [saving,     setSaving]     = useState(false);
  const [saveOk,     setSaveOk]     = useState(false);
  const [saveError,  setSaveError]  = useState<string|null>(null);
  const [messages,   setMessages]   = useState<Message[]>(initialMessages);
  const [openMsg,    setOpenMsg]    = useState<string|null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const saveContent = async () => {
    setSaving(true); setSaveError(null);
    try {
      for (const [key, value] of Object.entries(content)) {
        const { error } = await sb.from("contact_content")
          .update({ value, updated_at: new Date().toISOString() })
          .eq("key", key);
        if (error) throw new Error(`Clé "${key}" : ${error.message}`);
      }
      setSaveOk(true);
      setTimeout(() => setSaveOk(false), 2800);
    } catch(e) {
      setSaveError(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setSaving(false);
    }
  };

  const markRead = async (id: string) => {
    await sb.from("contact_messages").update({ is_read: true }).eq("id", id);
    setMessages(p => p.map(m => m.id === id ? { ...m, is_read: true } : m));
  };

  const deleteMsg = async (id: string) => {
    if (!confirm("Supprimer ce message ?")) return;
    await sb.from("contact_messages").delete().eq("id", id);
    setMessages(p => p.filter(m => m.id !== id));
    if (openMsg === id) setOpenMsg(null);
  };

  const refreshMessages = async () => {
    setRefreshing(true);
    const { data } = await sb.from("contact_messages").select("*").order("created_at", { ascending: false }).limit(100);
    if (data) setMessages(data as Message[]);
    setRefreshing(false);
  };

  const unreadCount = messages.filter(m => !m.is_read).length;

  return (
    <div style={{ fontFamily:"'DM Sans',system-ui,sans-serif", background:"#F0F2F8", minHeight:"100vh" }}>
      <style>{CSS}</style>

      {/* ── Topbar ── */}
      <div className="topbar">
        <div className="topbar-title">
          <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:20, fontWeight:900, color:"#053366" }}>
            Page Contact
          </h1>
          <p style={{ fontSize:11.5, color:"#94A3B8", marginTop:2 }}>
            {unreadCount > 0
              ? `${unreadCount} message${unreadCount>1?"s":""} non lu${unreadCount>1?"s":""}`
              : "Aucun message non lu"}
          </p>
        </div>

        <div className="topbar-actions">
          {saveError && (
            <div className="error-banner">
              <AlertCircle size={13}/> {saveError}
            </div>
          )}

          <a href="/contact" target="_blank" rel="noopener" className="preview-link">
            <Eye size={13}/> <span className="preview-label">Voir la page</span>
          </a>

          {tab === "content" && (
            <button className={`save-btn ${saveOk?"ok":""}`} onClick={saveContent} disabled={saving||saveOk}>
              {saving
                ? <><Loader2 size={13} style={{animation:"spin .7s linear infinite"}}/> <span className="save-btn-label">Enregistrement…</span></>
                : saveOk
                  ? <><Check size={13}/> <span className="save-btn-label">Enregistré !</span></>
                  : <><Save size={13}/> <span className="save-btn-label">Enregistrer</span></>}
            </button>
          )}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="tabs-row" style={{ maxWidth:860, margin:"0 auto", padding:"20px 24px 0" }}>
        <div style={{ display:"flex", gap:8 }}>
          <button className={`tab-btn ${tab==="content"?"active":"idle"}`} onClick={() => setTab("content")}>
            <MessageSquare size={13} style={{display:"inline",marginRight:6}}/>
            Contenu de la page
          </button>
          <button className={`tab-btn ${tab==="messages"?"active":"idle"}`} onClick={() => setTab("messages")}>
            <Mail size={13} style={{display:"inline",marginRight:6}}/>
            Messages reçus
            {unreadCount > 0 && (
              <span style={{ marginLeft:7, background:"#02AFCF", color:"white", borderRadius:20, padding:"1px 7px", fontSize:10, fontWeight:800 }}>
                {unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="page-content" style={{ maxWidth:860, margin:"0 auto", padding:"16px 24px 100px" }}>

        {/* ══ ONGLET CONTENU ══ */}
        {tab === "content" && (
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {FIELDS.map(f => (
              <div key={f.key} className="card">
                <div className="card-inner" style={{ padding:"18px 20px" }}>
                  <label className="label" style={{ display:"flex", alignItems:"center", gap:6, marginBottom: f.isImage ? 10 : 6 }}>
                    {f.icon} {f.label}
                  </label>

                  {f.isImage ? (
                    <ImageUploader
                      value={content[f.key] ?? ""}
                      onChange={url => setContent(p => ({ ...p, [f.key]: url }))}
                    />
                  ) : f.multiline ? (
                    <textarea
                      className="field"
                      value={content[f.key] ?? ""}
                      placeholder={f.placeholder}
                      rows={3}
                      onChange={e => setContent(p => ({ ...p, [f.key]: e.target.value }))}
                    />
                  ) : (
                    <input
                      className="field"
                      value={content[f.key] ?? ""}
                      placeholder={f.placeholder}
                      onChange={e => setContent(p => ({ ...p, [f.key]: e.target.value }))}
                    />
                  )}
                </div>
              </div>
            ))}

            <div style={{ padding:"12px 16px", background:"#FFFBEB", border:"1.5px solid #FDE68A", borderRadius:12, fontSize:12, color:"#92400E" }}>
              <strong>💡 Astuce :</strong> Pour l'image de fond, glissez-déposez un fichier ou cliquez sur <em>Choisir depuis le PC</em>. L'image est uploadée automatiquement sur Supabase Storage. Pensez à <strong>Enregistrer</strong> après chaque modification.
            </div>
          </div>
        )}

        {/* ══ ONGLET MESSAGES ══ */}
        {tab === "messages" && (
          <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
            <div className="refresh-row" style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12, gap:10 }}>
              <p style={{ fontSize:13, color:"#6B7280", fontWeight:600 }}>
                {messages.length} message{messages.length!==1?"s":""} reçu{messages.length!==1?"s":""}
              </p>
              <button
                className="icon-btn read-btn"
                title="Actualiser"
                onClick={refreshMessages}
                style={{ width:"auto", padding:"0 12px", gap:6, display:"flex", alignItems:"center", fontSize:12, fontWeight:700, color:"#374151" }}
              >
                <RefreshCw size={13} style={{ animation: refreshing ? "spin .7s linear infinite" : "none" }}/>
                <span className="refresh-btn-label">Actualiser</span>
              </button>
            </div>

            <div className="card">
              {messages.length === 0 && (
                <div style={{ padding:"60px 20px", textAlign:"center", color:"#9CA3AF" }}>
                  <Mail size={36} style={{ margin:"0 auto 14px", opacity:.3, display:"block" }}/>
                  <p style={{ fontSize:14, fontWeight:600 }}>Aucun message reçu</p>
                </div>
              )}

              {messages.map(m => (
                <div key={m.id}>
                  <div
                    className={`msg-row ${!m.is_read ? "unread" : ""}`}
                    onClick={() => {
                      setOpenMsg(o => o === m.id ? null : m.id);
                      if (!m.is_read) markRead(m.id);
                    }}
                  >
                    {/* Avatar */}
                    <div style={{ width:40, height:40, borderRadius:12, background: m.is_read ? "#F3F4F6" : "#E8F9FC", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontFamily:"'Playfair Display',serif", fontSize:17, fontWeight:900, color: m.is_read ? "#9CA3AF" : "#02AFCF" }}>
                      {m.name[0]?.toUpperCase()}
                    </div>

                    {/* Info */}
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                        <span style={{ fontSize:14, fontWeight:800, color:"#111827" }}>{m.name}</span>
                        {!m.is_read && (
                          <span className="badge" style={{ background:"#E8F9FC", color:"#02AFCF" }}>Nouveau</span>
                        )}
                        <span style={{ fontSize:12, color:"#9CA3AF", marginLeft:"auto", flexShrink:0 }}>
                          {new Date(m.created_at).toLocaleDateString("fr-FR", { day:"numeric", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" })}
                        </span>
                      </div>
                      <p style={{ fontSize:12, color:"#6B7280", marginTop:2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{m.email}</p>
                      {m.subject && (
                        <p className="msg-subject" style={{ fontSize:12, color:"#9CA3AF", marginTop:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                          {m.subject}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="msg-actions" style={{ display:"flex", gap:6, alignItems:"center", flexShrink:0 }} onClick={e => e.stopPropagation()}>
                      {!m.is_read && (
                        <button className="icon-btn read-btn" title="Marquer comme lu" onClick={() => markRead(m.id)}>
                          <MailOpen size={13}/>
                        </button>
                      )}
                      <button className="icon-btn" title="Supprimer" onClick={() => deleteMsg(m.id)}>
                        <Trash2 size={13}/>
                      </button>
                      <div style={{ color:"#D1D5DB", marginLeft:4 }}>
                        {openMsg === m.id ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                      </div>
                    </div>
                  </div>

                  {/* Message détail */}
                  {openMsg === m.id && (
                    <div className="msg-detail">
                      <p style={{ fontSize:11, fontWeight:800, color:"#94A3B8", textTransform:"uppercase", letterSpacing:".7px", marginBottom:8 }}>Message</p>
                      <p style={{ fontSize:14, color:"#374151", lineHeight:1.75, whiteSpace:"pre-wrap" }}>{m.message}</p>
                      <a
                        href={`mailto:${m.email}?subject=Re: ${m.subject ?? ""}`}
                        className="reply-btn"
                        style={{ display:"inline-flex", alignItems:"center", gap:7, marginTop:16, padding:"9px 18px", background:"#053366", color:"white", borderRadius:9, fontSize:13, fontWeight:700, textDecoration:"none" }}
                      >
                        <Mail size={13}/> Répondre par email
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}